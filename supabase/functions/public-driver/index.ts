import { adminClient } from "../_shared/auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "https://athoxmotorsport-lab.github.io",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60" },
});
const isCompetition = (row: { event?: { title_fr?: string; title_en?: string; event_type?: string; competition_code?: string } | null }): boolean => {
  const event = row.event ?? {};
  const title = `${event.title_fr ?? ''} ${event.title_en ?? ''}`.toLowerCase();
  if (/discord|open\s*lobby|hotlaper|entrainement|entraînement/.test(title)) return false;
  return ['DR', 'WGT', 'BATX', 'BA', 'ATXS'].includes(String(event.competition_code ?? '').toUpperCase())
    || ['daily_race', 'sprint', 'championship', 'endurance'].includes(event.event_type ?? '')
    || /\b(daily\s*race|dr|wgt|ball?ade\s*atx)\b/i.test(title);
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  const driverId = new URL(request.url).searchParams.get("driver") ?? "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(driverId)) {
    return json({ error: "invalid_driver" }, 400);
  }
  try {
    const supabase = adminClient();
    const { data: identity } = await supabase.from("driver_identities").select("last_login_at")
      .eq("driver_id", driverId).not("last_login_at", "is", null).maybeSingle();
    if (!identity) return json({ error: "profile_not_claimed" }, 404);
    const { data: driver, error } = await supabase.from("drivers")
      .select("id, display_name, avatar_url, country_code, team_name, car_number, bio_fr, bio_en, twitch_url, tiktok_url, youtube_url, instagram_url, website_url")
      .eq("id", driverId).eq("is_profile_public", true).maybeSingle();
    if (error) throw error;
    if (!driver) return json({ error: "profile_not_found" }, 404);
    const { data: ratings, error: ratingsError } = await supabase.from("driver_ratings")
      .select("circuit_key, performance_class, performance_score, safety_class, safety_score, calculated_at")
      .eq("driver_id", driverId).order("calculated_at", { ascending: false });
    if (ratingsError) throw ratingsError;
    const { data: results, error: resultsError } = await supabase.from("results")
      .select("status, finish_position, points, laps_completed, best_lap_ms, car_model_name, created_at, event:events!inner(slug, title_fr, title_en, circuit_name, circuit_key, starts_at, is_public, status, event_type, competition_code, result_publication_state)")
      .eq("driver_id", driverId).eq("event.is_public", true).neq("event.status", "draft").eq("event.result_publication_state","official").order("created_at", { ascending: false });
    if (resultsError) throw resultsError;
    const allResults = (results ?? []).filter(isCompetition);
    const { data: preference, error: preferenceError } = await supabase.from("driver_profile_preferences")
      .select("preferred_gt3, favorite_circuits, preferred_race_format, preferred_race_formats")
      .eq("driver_id", driverId).maybeSingle();
    if (preferenceError) throw preferenceError;
    const { data: carPhoto, error: carPhotoError } = preference?.preferred_gt3
      ? await supabase.from("gt3_car_catalog").select("model_name, image_url, source_url, credit").eq("model_name", preference.preferred_gt3).maybeSingle()
      : { data: null, error: null };
    if (carPhotoError) throw carPhotoError;
    const stats = allResults.reduce((summary, result) => ({
      races: summary.races + 1,
      wins: summary.wins + (result.status === "classified" && Number(result.finish_position) === 1 ? 1 : 0),
      podiums: summary.podiums + (result.status === "classified" && Number(result.finish_position) <= 3 ? 1 : 0),
      points: summary.points + Number(result.points ?? 0),
    }), { races: 0, wins: 0, podiums: 0, points: 0 });
    const { data: visibleEvents, error: visibleEventsError } = await supabase.from("events").select("slug").eq("is_public", true).neq("status", "draft").eq("result_publication_state","official");
    if (visibleEventsError) throw visibleEventsError;
    const visibleEventSlugs = new Set((visibleEvents ?? []).map((event) => event.slug));
    const { data: honours, error: honoursError } = await supabase.from("event_honours")
      .select("award_type, best_lap_ms, penalty_count, clean_laps, event_slug, circuit_name, starts_at")
      .eq("driver_id", driverId).order("starts_at", { ascending: false });
    if (honoursError) throw honoursError;
    return json({ driver: { ...driver, preferred_gt3: preference?.preferred_gt3 ?? null, favorite_circuits: preference?.favorite_circuits ?? [], preferred_race_format: preference?.preferred_race_format ?? null, preferred_race_formats: preference?.preferred_race_formats ?? [], car_photo: carPhoto, ratings: ratings ?? [], results: allResults, awards: (honours ?? []).filter((honour) => visibleEventSlugs.has(honour.event_slug)), stats } });
  } catch (error) {
    console.error("Public driver failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "server_error" }, 500);
  }
});
