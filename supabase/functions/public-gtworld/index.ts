import { adminClient } from "../_shared/auth.ts";
import { worldGTPoints, worldGTChampionship, worldGTPositionPoints } from "../_shared/worldgt-scoring.ts";

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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  try {
    const supabase = adminClient();
    const requested=new URL(request.url).searchParams.get('category');
    const category=requested==='WGT_ENDURANCE'||requested==='WGT_AMERICAN_DREAM'?requested:'WGT_SPRINT';
    const season={WGT_SPRINT:'WGT Sprint',WGT_ENDURANCE:'WGT Endurance',WGT_AMERICAN_DREAM:'WGT American Dream'}[category];
    const positions=Object.fromEntries(Array.from({length:10},(_,i)=>[i+1,worldGTPositionPoints(category,i+1)]));
    const { data: events, error: eventsError } = await supabase.from("events")
      .select("id, slug, title_fr, title_en, circuit_name, starts_at, status, is_public, server_name, event_type,competition_code,format_code,championship_code,result_publication_state")
      .eq("is_public", true).neq("status", "draft").order("starts_at", { ascending: true });
    if (eventsError) throw eventsError;

    const gtEvents = (events ?? []).filter(event=>event.status!=='cancelled'&&worldGTChampionship(event)===category).map(event=>({...event,format:category}));
    const ids = gtEvents.map((event) => event.id);
    if (!ids.length) return json({ season, category, points_system: { positions: positions, fastest_lap: 2 }, standings: [], events: [] });

    const { data: results, error: resultsError } = await supabase.from("results")
      .select("event_id, driver_id, status, finish_position, points, best_lap_ms, driver:drivers!inner(display_name)")
      .in("event_id", ids);
    if (resultsError) throw resultsError;
    const { data: publicDrivers, error: driversError } = await supabase.from("drivers").select("id").eq("is_profile_public", true);
    if (driversError) throw driversError;
    const publicDriverIds = new Set((publicDrivers ?? []).map((driver) => driver.id));
    const officialIds=new Set(gtEvents.filter(e=>e.result_publication_state==="official").map(e=>e.id));
    const visibleResults = (results ?? []).filter((result) => officialIds.has(result.event_id)&&publicDriverIds.has(result.driver_id));

    if(category==='WGT_AMERICAN_DREAM'){
      const totals=new Map<string,any>();
      for(const r of visibleResults){const driver=Array.isArray(r.driver)?r.driver[0]:r.driver;const d=totals.get(r.driver_id)||{driver_id:r.driver_id,display_name:driver?.display_name||'ACC',points:0,races:0,wins:0,podiums:0};d.points+=Number(r.points||0);d.races++;if(r.status==='classified'&&r.finish_position===1)d.wins++;if(r.status==='classified'&&r.finish_position!=null&&r.finish_position<=3)d.podiums++;totals.set(r.driver_id,d);}
      const standings=[...totals.values()].sort((a,b)=>b.points-a.points||b.wins-a.wins).map((d,i)=>({...d,rank:i+1}));
      return json({generated_at:new Date().toISOString(),season,category,entry_mode:'solo',points_system:{positions,fastest_lap:2},standings,events:gtEvents.map(e=>({...e,drivers:visibleResults.filter(r=>r.event_id===e.id)}))});
    }
    const { data: registrations, error: registrationsError } = await supabase.from("registrations")
      .select("event_id, driver_id, team_name").in("event_id", ids);
    if (registrationsError) throw registrationsError;
    const { entries } = worldGTPoints(visibleResults, (registrations ?? []).filter((r) => publicDriverIds.has(r.driver_id)),new Map(gtEvents.map(e=>[e.id,category])));
    const championship = new Map<string, { team_name:string; points:number; events:number; wins:number; podiums:number; sprint:number; endurance:number; american_dream:number; fastest_laps:number }>();
    const eventPayload = gtEvents.map((event) => {
      const classified = entries.filter((entry) => entry.event_id === event.id).map((entry) => {
        const key = entry.team_name.toLocaleLowerCase("fr");
        const total = championship.get(key) ?? {
          team_name: entry.team_name, points:0, events:0, wins:0,
          podiums:0, sprint:0, endurance:0, american_dream:0, fastest_laps:0,
        };
        total.points += entry.points;
        total.events += 1;
        if (entry.finish_position === 1) total.wins += 1;
        if (entry.finish_position !== null && entry.finish_position <= 3) total.podiums += 1;
        if (event.format === "WGT_SPRINT") total.sprint += 1; else if (event.format === "WGT_ENDURANCE") total.endurance += 1; else total.american_dream += 1;
        if (entry.fastest_lap_bonus) total.fastest_laps += 1;
        championship.set(key, total);
        const members = entry.driver_ids.flatMap((driverId) => {
          const record = visibleResults.find((row) => row.event_id === event.id && row.driver_id === driverId);
          const driver = Array.isArray(record?.driver) ? record.driver[0] : record?.driver;
          return driver?.display_name ? [String(driver.display_name)] : [];
        }).sort();
        return {
          team_name: entry.team_name,
          finish_position: entry.finish_position, best_lap_ms: entry.best_lap_ms,
          fastest_lap_bonus: entry.fastest_lap_bonus, points: entry.points, members,
        };
      }).sort((first, second) =>
        (first.finish_position ?? 999) - (second.finish_position ?? 999) ||
        first.team_name.localeCompare(second.team_name));
      return {
        event_id: event.id, slug: event.slug, title: event.title_fr,
        circuit_name: event.circuit_name, starts_at: event.starts_at,
        status: event.status, format: event.format, teams: classified,
      };
    });

    const standings = [...championship.values()]
      .sort((a,b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums || a.team_name.localeCompare(b.team_name))
      .map((team, index) => ({ rank: index + 1, ...team }));

    return json({
      generated_at: new Date().toISOString(),
      season, category,
      points_system: { positions: positions, fastest_lap: 2 },
      standings,
      events: eventPayload,
    });
  } catch (error) {
    console.error("WorldGT leaderboard failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "server_error" }, 500);
  }
});
