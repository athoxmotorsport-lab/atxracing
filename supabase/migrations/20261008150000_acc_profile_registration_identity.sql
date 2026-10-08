BEGIN;
ALTER TABLE public.driver_profile_preferences
 ADD COLUMN acc_first_name text,
 ADD COLUMN acc_last_name text,
 ADD COLUMN acc_short_name text;
ALTER TABLE public.driver_profile_preferences ADD CONSTRAINT acc_profile_identity_valid CHECK (
 (acc_first_name IS NULL AND acc_last_name IS NULL AND acc_short_name IS NULL)
 OR (acc_first_name IS NOT NULL AND length(trim(acc_first_name)) BETWEEN 1 AND 50
 AND acc_last_name IS NOT NULL AND length(trim(acc_last_name)) BETWEEN 1 AND 50
 AND acc_short_name IS NOT NULL AND acc_short_name ~ '^[A-Z0-9]{1,3}$')
);
-- The existing implementation retains profile/social/preferences behaviour.
ALTER FUNCTION public.save_driver_profile(uuid,jsonb) RENAME TO save_driver_profile_without_acc_identity;
CREATE FUNCTION public.save_driver_profile(p_driver_id uuid,p_profile jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF coalesce(length(trim(p_profile->>'acc_first_name')),0) NOT BETWEEN 1 AND 50
 OR coalesce(length(trim(p_profile->>'acc_last_name')),0) NOT BETWEEN 1 AND 50
 OR coalesce(upper(trim(p_profile->>'acc_short_name')),'') !~ '^[A-Z0-9]{1,3}$'
 OR coalesce(p_profile->>'car_number','') !~ '^[0-9]{1,3}$'
 THEN RAISE EXCEPTION 'acc_profile_required'; END IF;
 result:=public.save_driver_profile_without_acc_identity(p_driver_id,p_profile);
 UPDATE public.driver_profile_preferences SET
 acc_first_name=trim(p_profile->>'acc_first_name'),acc_last_name=trim(p_profile->>'acc_last_name'),
 acc_short_name=upper(trim(p_profile->>'acc_short_name')) WHERE driver_id=p_driver_id;
 RETURN result || jsonb_build_object('acc_first_name',trim(p_profile->>'acc_first_name'),
 'acc_last_name',trim(p_profile->>'acc_last_name'),'acc_short_name',upper(trim(p_profile->>'acc_short_name')));
END $$;
REVOKE ALL ON FUNCTION public.save_driver_profile(uuid,jsonb) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_driver_profile(uuid,jsonb) TO service_role;

ALTER FUNCTION public.atx_register_entry(uuid,uuid,text,jsonb) RENAME TO atx_register_entry_without_profile_identity;
CREATE FUNCTION public.atx_register_entry(p_actor uuid,p_event uuid,p_action text,p_data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE profile public.driver_profile_preferences%rowtype; number text;
BEGIN
 IF p_action='register' THEN
  SELECT * INTO profile FROM public.driver_profile_preferences WHERE driver_id=p_actor;
  SELECT car_number INTO number FROM public.drivers WHERE id=p_actor;
  IF profile.acc_first_name IS NULL OR profile.acc_last_name IS NULL OR profile.acc_short_name IS NULL
  OR profile.profile_confirmed_at IS NULL OR coalesce(number,'') !~ '^[0-9]{1,3}$'
  THEN RAISE EXCEPTION 'acc_profile_required'; END IF;
  -- Client names and identities never override the verified actor's private profile.
  p_data:=p_data || jsonb_build_object('firstName',profile.acc_first_name,'lastName',profile.acc_last_name,'shortName',profile.acc_short_name);
 END IF;
 RETURN public.atx_register_entry_without_profile_identity(p_actor,p_event,p_action,p_data);
END $$;
REVOKE ALL ON FUNCTION public.atx_register_entry(uuid,uuid,text,jsonb) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.atx_register_entry(uuid,uuid,text,jsonb) TO service_role;

-- Native website registrations can also serve WGT crews.
create or replace function public.publish_atx_event_draft(p_draft_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare item public.atx_event_drafts%rowtype;
declare d jsonb;
declare new_event public.events%rowtype;
declare chosen_type public.event_type;
declare race_minutes integer;
declare pit_count integer;
declare source_id text;
begin
  select * into item from public.atx_event_drafts where id=p_draft_id for update;
  if not found then raise exception 'draft_not_found'; end if;
  if item.status='published' then
    select * into new_event from public.events where id=item.event_id;
    return jsonb_build_object('id',new_event.id,'slug',new_event.slug,'already_published',true);
  end if;
  d:=item.draft;
  if coalesce(d->>'competition','') not in ('DR','BATX','WGT','ATXS')
    or coalesce(d->>'format','') not in ('DR','DR_90','BATX','WGT_SPRINT','WGT_ENDURANCE','ATXS')
    or (d->>'competition'='DR' and d->>'format' not in ('DR','DR_90'))
    or (d->>'competition'='BATX' and d->>'format'<>'BATX')
    or (d->>'competition'='ATXS' and d->>'format'<>'ATXS')
    or (d->>'competition'='WGT' and d->>'format' not in ('WGT_SPRINT','WGT_ENDURANCE'))
    then raise exception 'invalid_format'; end if;
  if nullif(trim(d->>'titleFr'),'') is null or nullif(trim(d->>'titleEn'),'') is null
    or nullif(trim(d->>'descriptionFr'),'') is null or nullif(trim(d->>'descriptionEn'),'') is null
    or nullif(trim(d->>'circuit'),'') is null or coalesce(d->>'circuitKey','') !~ '^[a-z0-9]+(_[a-z0-9]+)*$'
    or nullif(d->>'startsAt','') is null
    or (d->>'competition'<>'ATXS' and coalesce(d->>'registrationMode','simgrid')<>'site' and nullif(d->>'simgridUrl','') is null) or nullif(d->>'imageUrl','') is null
    then raise exception 'missing_required_fields'; end if;
  if nullif(d->>'simgridUrl','') is not null and d->>'simgridUrl' !~ '^https://www\.thesimgrid\.com/championships/[0-9]+$'
    or d->>'imageUrl' !~ '^https://' then raise exception 'invalid_url'; end if;
  race_minutes:=(d->>'raceMinutes')::integer;
  if race_minutes < 1 or race_minutes > 1440 or (d->>'maxDrivers')::integer not between 1 and 100
    then raise exception 'invalid_duration_or_capacity'; end if;
  if d->>'format' in ('DR','DR_90','BATX','WGT_SPRINT') and (
    (d->>'practiceMinutes')::integer is distinct from 60 or (d->>'qualifyingMinutes')::integer is distinct from 15
    or race_minutes <> case when d->>'format' in ('BATX','DR_90') then 90 else 60 end
  ) then raise exception 'invalid_format_duration'; end if;
  if nullif(d->>'serverOpensAt','')::timestamptz > (d->>'startsAt')::timestamptz
    then raise exception 'invalid_server_opening'; end if;
  if d->>'format'='ATXS' and ((d->>'practiceMinutes')::integer is distinct from 2 or (d->>'qualifyingMinutes')::integer is distinct from 15 or race_minutes<>45) then raise exception 'invalid_format_duration'; end if;
  if d->>'format'='ATXS' then chosen_type:='daily_race';pit_count:=0;
  elsif d->>'format'='DR_90' then chosen_type:='daily_race';pit_count:=2;
  elsif d->>'format'='DR' then chosen_type:='daily_race';pit_count:=1;
  elsif d->>'format'='BATX' then chosen_type:='special_event';pit_count:=2;
  elsif d->>'format'='WGT_SPRINT' then chosen_type:='sprint';pit_count:=1;
  else chosen_type:='endurance';pit_count:=0; end if;
  source_id:=case when item.source_key is not null then 'atx-simgrid:'||item.source_key else null end;
  insert into public.events (
    slug,event_type,status,title_fr,title_en,description_fr,description_en,game,
    circuit_name,circuit_key,starts_at,timezone,duration_minutes,max_drivers,simgrid_url,
    image_url,is_public,is_official,source_event_key,car_class,schedule_timezone_label,
    event_schedule,mandatory_pit_stop,mandatory_tyre_change,mandatory_refuelling,
    time_multiplier,competition_code,format_code,mandatory_stop_count,server_opens_at,registered_snapshot,site_registration_enabled
  ) values (
    'atx-'||substr(replace(item.id::text,'-',''),1,24),chosen_type,'registration_open',
    d->>'titleFr',d->>'titleEn',nullif(d->>'descriptionFr',''),nullif(d->>'descriptionEn',''),
    'Assetto Corsa Competizione',d->>'circuit',d->>'circuitKey',
    (d->>'startsAt')::timestamptz,'Europe/Brussels',race_minutes,(d->>'maxDrivers')::integer,
    case when d->>'competition'='ATXS' or d->>'registrationMode'='site' then null else nullif(d->>'simgridUrl','') end,d->>'imageUrl',true,true,source_id,
    coalesce(nullif(d->>'carClass',''),'GT3'),'Europe/Brussels',
    coalesce(d->'schedule','[]'::jsonb),pit_count>0,
    d->>'format'='BATX',d->>'format'='BATX',1,
    d->>'competition',d->>'format',pit_count,nullif(d->>'serverOpensAt','')::timestamptz,
    nullif(d->>'registered','')::integer,(d->>'competition'='ATXS' or coalesce(d->>'registrationMode','simgrid')='site')
  ) returning * into new_event;
  update public.atx_event_drafts set status='published',event_id=new_event.id,published_slug=new_event.slug,updated_at=now() where id=item.id;
  return jsonb_build_object('id',new_event.id,'slug',new_event.slug,'already_published',false);
end $$;
revoke all on function public.publish_atx_event_draft(uuid) from public, anon, authenticated;
grant execute on function public.publish_atx_event_draft(uuid) to service_role;


COMMIT;
