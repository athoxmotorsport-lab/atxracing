BEGIN;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS site_registration_enabled boolean NOT NULL DEFAULT false;
CREATE TABLE public.atx_acc_cars (
 car_model_id integer PRIMARY KEY CHECK(car_model_id BETWEEN 0 AND 999),
 name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 100), active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.atx_race_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
 owner_driver_id uuid NOT NULL REFERENCES public.drivers(id), race_number integer NOT NULL CHECK(race_number BETWEEN 0 AND 999),
 car_model_id integer NOT NULL REFERENCES public.atx_acc_cars(car_model_id), team_name text NOT NULL DEFAULT '' CHECK(length(team_name)<=100),
 join_code uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(event_id,race_number), UNIQUE(id,event_id)
);
CREATE TABLE public.atx_entry_members (
 entry_id uuid NOT NULL, event_id uuid NOT NULL, driver_id uuid NOT NULL REFERENCES public.drivers(id),
 first_name text NOT NULL CHECK(length(trim(first_name)) BETWEEN 1 AND 50),
 last_name text NOT NULL CHECK(length(trim(last_name)) BETWEEN 1 AND 50),
 short_name text NOT NULL CHECK(length(trim(short_name)) BETWEEN 1 AND 3),
 PRIMARY KEY(event_id,driver_id), FOREIGN KEY(entry_id,event_id) REFERENCES public.atx_race_entries(id,event_id) ON DELETE CASCADE
);
ALTER TABLE public.atx_acc_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atx_race_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atx_entry_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.atx_acc_cars,public.atx_race_entries,public.atx_entry_members FROM anon,authenticated;
GRANT ALL ON public.atx_acc_cars,public.atx_race_entries,public.atx_entry_members TO service_role;

-- The edge service supplies the authenticated actor; event locking serialises capacity and crew changes.
CREATE FUNCTION public.atx_register_entry(p_actor uuid,p_event uuid,p_action text,p_data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e public.events%rowtype; entry public.atx_race_entries%rowtype; member public.atx_entry_members%rowtype; crew_limit integer;
BEGIN
 SELECT * INTO e FROM public.events WHERE id=p_event FOR UPDATE;
 IF NOT FOUND OR NOT e.is_public OR NOT e.site_registration_enabled THEN RAISE EXCEPTION 'registration_unavailable'; END IF;
 IF e.status<>'registration_open' OR e.starts_at<=now() THEN RAISE EXCEPTION 'registration_closed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.driver_identities WHERE driver_id=p_actor AND last_login_at IS NOT NULL AND steam_id64 ~ '^[0-9]{17}$')
 OR NOT EXISTS(SELECT 1 FROM public.driver_profile_preferences WHERE driver_id=p_actor AND profile_confirmed_at IS NOT NULL)
 THEN RAISE EXCEPTION 'confirmed_profile_required'; END IF;
 SELECT * INTO member FROM public.atx_entry_members WHERE event_id=p_event AND driver_id=p_actor;
 IF p_action='withdraw' THEN
  IF member.entry_id IS NULL THEN RETURN jsonb_build_object('withdrawn',true); END IF;
  SELECT * INTO entry FROM public.atx_race_entries WHERE id=member.entry_id;
  IF entry.owner_driver_id=p_actor AND (SELECT count(*) FROM public.atx_entry_members WHERE entry_id=entry.id)>1 THEN RAISE EXCEPTION 'captain_has_members'; END IF;
  DELETE FROM public.atx_entry_members WHERE event_id=p_event AND driver_id=p_actor;
  DELETE FROM public.atx_race_entries WHERE id=entry.id AND NOT EXISTS(SELECT 1 FROM public.atx_entry_members WHERE entry_id=entry.id);
  UPDATE public.registrations SET status='withdrawn',updated_at=now() WHERE event_id=p_event AND driver_id=p_actor AND external_source='atx-site';
  RETURN jsonb_build_object('withdrawn',true);
 END IF;
 IF p_action<>'register' THEN RAISE EXCEPTION 'invalid_action'; END IF;
 IF member.entry_id IS NOT NULL THEN RAISE EXCEPTION 'already_registered'; END IF;
 crew_limit:=CASE WHEN e.format_code='WGT_ENDURANCE' THEN 6 WHEN e.format_code='WGT_SPRINT' THEN 2 ELSE 1 END;
 IF nullif(p_data->>'joinCode','') IS NOT NULL THEN
  SELECT * INTO entry FROM public.atx_race_entries WHERE event_id=p_event AND join_code=(p_data->>'joinCode')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_invitation'; END IF;
  IF (SELECT count(*) FROM public.atx_entry_members WHERE entry_id=entry.id)>=crew_limit THEN RAISE EXCEPTION 'crew_full'; END IF;
 ELSE
  IF (SELECT count(*) FROM public.atx_race_entries WHERE event_id=p_event)>=e.max_drivers THEN RAISE EXCEPTION 'event_full'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.atx_acc_cars WHERE car_model_id=(p_data->>'carModelId')::integer AND active) THEN RAISE EXCEPTION 'invalid_car'; END IF;
  IF EXISTS(SELECT 1 FROM public.atx_race_entries WHERE event_id=p_event AND race_number=(p_data->>'raceNumber')::integer) THEN RAISE EXCEPTION 'race_number_taken'; END IF;
  INSERT INTO public.atx_race_entries(event_id,owner_driver_id,race_number,car_model_id,team_name)
  VALUES(p_event,p_actor,(p_data->>'raceNumber')::integer,(p_data->>'carModelId')::integer,coalesce(p_data->>'teamName','')) RETURNING * INTO entry;
 END IF;
 INSERT INTO public.atx_entry_members(entry_id,event_id,driver_id,first_name,last_name,short_name)
 VALUES(entry.id,p_event,p_actor,trim(p_data->>'firstName'),trim(p_data->>'lastName'),upper(trim(p_data->>'shortName')));
 INSERT INTO public.registrations(event_id,driver_id,status,race_number,car_model,team_name,external_source)
 SELECT p_event,p_actor,'confirmed',entry.race_number,name,entry.team_name,'atx-site' FROM public.atx_acc_cars WHERE car_model_id=entry.car_model_id
 ON CONFLICT(event_id,driver_id) DO UPDATE SET status='confirmed',race_number=excluded.race_number,car_model=excluded.car_model,team_name=excluded.team_name,external_source='atx-site',updated_at=now();
 RETURN jsonb_build_object('registered',true,'entryId',entry.id);
END $$;
REVOKE ALL ON FUNCTION public.atx_register_entry(uuid,uuid,text,jsonb) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.atx_register_entry(uuid,uuid,text,jsonb) TO service_role;
COMMIT;
