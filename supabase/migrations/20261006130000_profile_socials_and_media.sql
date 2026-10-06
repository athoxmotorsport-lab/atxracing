alter table public.drivers add column if not exists instagram_url text;
alter table public.drivers drop constraint if exists drivers_instagram_url_https;
alter table public.drivers add constraint drivers_instagram_url_https
  check (instagram_url is null or instagram_url ~ '^https://(www\.)?instagram\.com/');

create table if not exists public.atx_media (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('live','replay')),
  title_fr text not null check (char_length(title_fr) between 1 and 120),
  title_en text not null check (char_length(title_en) between 1 and 120),
  url text not null check (url ~ '^https://(www\.)?(youtube\.com|youtu\.be|twitch\.tv)/'),
  event_slug text,
  published_at timestamptz not null default now(),
  is_public boolean not null default true,
  created_by uuid not null references public.drivers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.atx_media enable row level security;
revoke all on public.atx_media from public, anon, authenticated;
grant select, insert, update, delete on public.atx_media to service_role;

create or replace function public.save_driver_profile(p_driver_id uuid, p_profile jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  update public.drivers set
    display_name=p_profile->>'display_name', custom_display_name=p_profile->>'display_name',
    team_name=p_profile->>'team_name', car_number=p_profile->>'car_number',
    youtube_url=p_profile->>'youtube_url', instagram_url=p_profile->>'instagram_url',
    twitch_url=p_profile->>'twitch_url'
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
      d.youtube_url,d.instagram_url,d.twitch_url,
      p.nickname,p.games_played,p.games_to_discover,p.preferred_gt3,
      p.favorite_circuits,p.preferred_race_format,p.profile_confirmed_at
    from public.drivers d join public.driver_profile_preferences p on p.driver_id=d.id
    where d.id=p_driver_id
  ) profile;
  return result;
end $$;

revoke all on function public.save_driver_profile(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.save_driver_profile(uuid,jsonb) to service_role;
