import { validateProfile } from './validation.mjs';
import { sportingProfile } from './sporting.mjs';

// Reuse the existing Steam session protocol without changing the legacy functions.
const encoder = new TextEncoder();
const columns = 'id,display_name,avatar_url,team_name,car_number,youtube_url,instagram_url,twitch_url,driver_profile_preferences(nickname,games_played,games_to_discover,preferred_gt3,favorite_circuits,preferred_race_format,profile_confirmed_at)';

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw Error('configuration');
  return value;
}
async function sessionHash(token: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(required('SESSION_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(token))), b => b.toString(16).padStart(2, '0')).join('');
}
async function rest(path: string, options: RequestInit = {}) {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS');
  const key = modern ? JSON.parse(modern).default || required('SUPABASE_SERVICE_ROLE_KEY') : required('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(required('SUPABASE_URL') + '/rest/v1/' + path, {
    ...options,
    headers: { apikey: key, ...(key.startsWith('sb_secret_') ? {} : { Authorization: 'Bearer ' + key }), 'Content-Type': 'application/json', Prefer: 'return=representation', ...options.headers },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error('database');
  return response.json();
}

Deno.serve(async request => {
  const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' });
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
  try {
    const allowed = new URL(required('ATX_SITE_URL')).origin;
    headers.set('Access-Control-Allow-Origin', allowed);
    headers.set('Access-Control-Allow-Headers', 'authorization, content-type');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    const origin = request.headers.get('origin');
    if (origin && origin !== allowed) return reply({ error: 'origin_not_allowed' }, 403);
    if (request.method === 'OPTIONS') return reply({ ok: true });
    if (!['GET', 'POST'].includes(request.method)) return reply({ error: 'method_not_allowed' }, 405);
    const token = (request.headers.get('authorization') || '').match(/^Bearer ([A-Za-z0-9_-]{40,128})$/)?.[1];
    if (!token) return reply({ error: 'unauthorized' }, 401);
    const sessions = await rest('auth_sessions?select=driver_id&token_hash=eq.' + await sessionHash(token) + '&revoked_at=is.null&expires_at=gt.' + encodeURIComponent(new Date().toISOString()) + '&limit=1');
    if (!sessions.length) return reply({ error: 'unauthorized' }, 401);
    // The driver ID always comes from the verified session, never the request body.
    const path = 'drivers?id=eq.' + encodeURIComponent(sessions[0].driver_id) + '&select=' + columns;
    if (request.method === 'GET') {
      const rows = await rest(path);
      if (!rows.length) return reply({ error: 'not_found' }, 404);
      const { driver_profile_preferences: preferences, ...driver } = rows[0];
      const selected = Array.isArray(preferences) ? preferences[0] : preferences;
      const id = encodeURIComponent(sessions[0].driver_id);
      const [ratings, honours, visibleEvents, results, carPhotos, roles] = await Promise.all([
        rest('driver_ratings?select=performance_class,performance_score,safety_class,safety_score,algorithm_version&driver_id=eq.' + id + '&circuit_key=eq.overall&limit=1'),
        rest('event_honours?select=event_id,award_type,best_lap_ms,penalty_count,clean_laps,event_slug,circuit_name,starts_at&driver_id=eq.' + id + '&order=starts_at.desc'),
        rest('events?select=id&is_public=eq.true&status=neq.draft'),
        rest('results?select=event_id,status,finish_position,points,laps_completed,best_lap_ms,car_model_name,created_at,event:events(slug,title_fr,title_en,circuit_name,circuit_key,starts_at,event_type,competition_code)&driver_id=eq.' + id + '&order=created_at.desc'),
        selected?.preferred_gt3 ? rest('gt3_car_catalog?select=model_name,image_url,source_url,credit&model_name=eq.' + encodeURIComponent(selected.preferred_gt3) + '&limit=1') : Promise.resolve([]),
        rest('driver_roles?select=role&driver_id=eq.' + id),
      ]);
      const visibleIds = new Set(visibleEvents.map((event: { id: string }) => event.id));
      const finishByEvent = new Map(results.map((result: { event_id: string; finish_position: number | null; status: string }) => [result.event_id, result]));
      return reply({ driver: { ...driver, ...selected, ...sportingProfile(results), roles: roles.map((row: { role: string }) => row.role), car_photo: carPhotos[0] ?? null,
        rating: ratings[0] ?? null, awards: honours.filter((honour: { event_id: string }) => visibleIds.has(honour.event_id))
          .map((honour: { event_id: string }) => ({ ...honour, finish_position: finishByEvent.get(honour.event_id)?.finish_position ?? null,
            finish_status: finishByEvent.get(honour.event_id)?.status ?? null })) } });
    }
    const raw = await request.text();
    if (raw.length > 8192) return reply({ error: 'payload_too_large' }, 413);
    let values;
    try { values = validateProfile(JSON.parse(raw)); }
    catch { return reply({ error: 'invalid_profile' }, 400); }
    const driver = await rest('rpc/save_driver_profile', { method: 'POST', body: JSON.stringify({ p_driver_id: sessions[0].driver_id, p_profile: values }) });
    return reply({ driver });
  } catch {
    return reply({ error: 'profile_unavailable' }, 503);
  }
});
