-- Private preferences are separate from the existing publicly readable drivers table.
create table public.driver_profile_preferences (
  driver_id uuid primary key references public.drivers(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 64),
  games_played text[] not null default '{}' check (games_played <@ array['acc','ace']::text[]),
  games_to_discover text[] not null default '{}' check (games_to_discover <@ array['acc','ace']::text[]),
  preferred_gt3 text check (char_length(preferred_gt3) <= 100),
  profile_confirmed_at timestamptz not null default now()
);
alter table public.driver_profile_preferences enable row level security;
revoke all on public.driver_profile_preferences from public, anon, authenticated;
grant select, insert, update, delete on public.driver_profile_preferences to service_role;

-- One transaction prevents a partially saved profile. Only the authenticated
-- server function can call this RPC, with an ID derived from a valid Steam session.
create function public.save_driver_profile(p_driver_id uuid, p_profile jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  update public.drivers set
    display_name=p_profile->>'display_name', custom_display_name=p_profile->>'display_name',
    team_name=p_profile->>'team_name', car_number=p_profile->>'car_number'
  where id=p_driver_id;
  if not found then raise exception 'driver_not_found'; end if;
  insert into public.driver_profile_preferences(driver_id,nickname,games_played,games_to_discover,preferred_gt3,profile_confirmed_at)
  values(p_driver_id,p_profile->>'nickname',array(select jsonb_array_elements_text(p_profile->'games_played')),
    array(select jsonb_array_elements_text(p_profile->'games_to_discover')),p_profile->>'preferred_gt3',now())
  on conflict(driver_id) do update set nickname=excluded.nickname,games_played=excluded.games_played,
    games_to_discover=excluded.games_to_discover,preferred_gt3=excluded.preferred_gt3,profile_confirmed_at=excluded.profile_confirmed_at;
  select to_jsonb(profile) into result from (
    select d.id,d.display_name,d.avatar_url,d.team_name,d.car_number,p.nickname,p.games_played,
      p.games_to_discover,p.preferred_gt3,p.profile_confirmed_at
    from public.drivers d join public.driver_profile_preferences p on p.driver_id=d.id where d.id=p_driver_id
  ) profile;
  return result;
end $$;
revoke all on function public.save_driver_profile(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.save_driver_profile(uuid,jsonb) to service_role;
