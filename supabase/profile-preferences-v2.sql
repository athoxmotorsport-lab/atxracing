-- Favourite circuits and race format are private Steam-account preferences.
alter table public.driver_profile_preferences
  add column if not exists favorite_circuits text[] not null default '{}',
  add column if not exists preferred_race_format text;

alter table public.driver_profile_preferences
  add constraint driver_profile_favorite_circuits_limit
    check (cardinality(favorite_circuits) <= 3),
  add constraint driver_profile_preferred_race_format
    check (preferred_race_format is null or preferred_race_format in ('sprint_60','sprint_90','endurance'));

create or replace function public.save_driver_profile(p_driver_id uuid, p_profile jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  update public.drivers set
    display_name=p_profile->>'display_name', custom_display_name=p_profile->>'display_name',
    team_name=p_profile->>'team_name', car_number=p_profile->>'car_number'
  where id=p_driver_id;
  if not found then raise exception 'driver_not_found'; end if;

  insert into public.driver_profile_preferences
    (driver_id,nickname,games_played,games_to_discover,preferred_gt3,favorite_circuits,preferred_race_format,profile_confirmed_at)
  values
    (p_driver_id,p_profile->>'nickname',
     array(select jsonb_array_elements_text(p_profile->'games_played')),
     array(select jsonb_array_elements_text(p_profile->'games_to_discover')),
     p_profile->>'preferred_gt3',
     array(select jsonb_array_elements_text(p_profile->'favorite_circuits')),
     p_profile->>'preferred_race_format',now())
  on conflict(driver_id) do update set
    nickname=excluded.nickname,games_played=excluded.games_played,
    games_to_discover=excluded.games_to_discover,
    preferred_gt3=excluded.preferred_gt3,
    favorite_circuits=excluded.favorite_circuits,
    preferred_race_format=excluded.preferred_race_format,
    profile_confirmed_at=excluded.profile_confirmed_at;

  select to_jsonb(profile) into result from (
    select d.id,d.display_name,d.avatar_url,d.team_name,d.car_number,
      p.nickname,p.games_played,p.games_to_discover,p.preferred_gt3,
      p.favorite_circuits,p.preferred_race_format,p.profile_confirmed_at
    from public.drivers d join public.driver_profile_preferences p on p.driver_id=d.id
    where d.id=p_driver_id
  ) profile;
  return result;
end $$;

revoke all on function public.save_driver_profile(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.save_driver_profile(uuid,jsonb) to service_role;
