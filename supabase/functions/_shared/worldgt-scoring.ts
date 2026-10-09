/**
 * WorldGT: one race entry (team name scoped to an event) earns points once.
 * Every participating driver assigned to that entry receives exactly its points.
 * A different Team 1/Team 2 is never combined by its parent organisation name.
 * Do not score unmapped pilots: the Collector's individual 25/18/etc are not WGT points.
 */
export type WorldGTResult = {
  event_id: string; driver_id: string; status: string;
  finish_position: number | null; best_lap_ms: number | null;
};
export type WorldGTRegistration = {
  event_id: string; driver_id: string; team_name: string | null;
};
export type WorldGTEntry = {
  event_id: string; team_name: string; finish_position: number | null;
  best_lap_ms: number | null; fastest_lap_bonus: number; points: number;
  driver_ids: string[];
};
export type WorldGTChampionship = 'WGT_SPRINT' | 'WGT_ENDURANCE' | 'WGT_AMERICAN_DREAM';
export const worldGTChampionship = (event: Record<string, unknown> | null | undefined): WorldGTChampionship | null => {
  if (!event) return null;
  const explicit = String(event.championship_code ?? '').toUpperCase();
  if (['WGT_SPRINT','WGT_ENDURANCE','WGT_AMERICAN_DREAM'].includes(explicit)) return explicit as WorldGTChampionship;
  const competition = String(event.competition_code ?? '').toUpperCase();
  if (competition && competition !== 'WGT') return null;
  const text = [event.title_fr,event.title_en,event.server_name].join(' ');
  const wgt = competition === 'WGT' || /(?:^|[^a-z0-9])WGT(?=$|[^a-z0-9])|WORLD\s*GT/i.test(text);
  if (!wgt && !/\b(SPRINT|ENDU)\b/i.test(text)) return null;
  if (/AMERICAN[ _-]+DREAM/i.test(text)) return 'WGT_AMERICAN_DREAM';
  if (event.format_code === 'WGT_ENDURANCE' || event.event_type === 'endurance' || /\bENDU(?:RANCE)?\b/i.test(text)) return 'WGT_ENDURANCE';
  if (event.format_code === 'WGT_SPRINT' || event.event_type === 'sprint' || /\bSPRINT\b/i.test(text)) return 'WGT_SPRINT';
  return null;
};
export const worldGTPositionPoints = (championship: WorldGTChampionship, position: number | null): number => {
  const points = championship === 'WGT_ENDURANCE' ? [50,36,30,24,20,16,12,8,4,2] : [25,18,15,12,10,8,6,4,2,1];
  return position === null || position < 1 ? 0 : points[position-1] ?? 0;
};
const validNumber = (value: unknown): number | null => {
  const n = Number(value);
  return value !== null && value !== undefined && Number.isFinite(n) && n > 0 ? n : null;
};
export const worldGTPoints = (
  results: WorldGTResult[], registrations: WorldGTRegistration[],
  championships: Map<string, WorldGTChampionship> = new Map(),
): {entries: WorldGTEntry[]; driverPoints: Map<string, WorldGTEntry>} => {
  const registrationByDriver = new Map<string, string>();
  for (const row of registrations) {
    const team = String(row.team_name ?? "").trim();
    if (team) registrationByDriver.set(row.event_id + "|" + row.driver_id, team);
  }
  const grouped = new Map<string, WorldGTEntry>();
  for (const result of results) {
    if (result.status === "dns" || result.status === "dsq") continue;
    const teamName = registrationByDriver.get(result.event_id + "|" + result.driver_id);
    if (!teamName) continue;
    const key = result.event_id + "|" + teamName.toLocaleLowerCase("fr");
    const entry = grouped.get(key) ?? {
      event_id: result.event_id, team_name: teamName, finish_position: null,
      best_lap_ms: null, fastest_lap_bonus: 0, points: 0, driver_ids: [],
    };
    if (!entry.driver_ids.includes(result.driver_id)) entry.driver_ids.push(result.driver_id);
    const pos = result.status === "classified" ? validNumber(result.finish_position) : null;
    if (pos !== null && (entry.finish_position === null || pos < entry.finish_position)) entry.finish_position = pos;
    const lap = validNumber(result.best_lap_ms);
    if (lap !== null && (entry.best_lap_ms === null || lap < entry.best_lap_ms)) entry.best_lap_ms = lap;
    grouped.set(key, entry);
  }
  const entries = [...grouped.values()];
  // The reference fastest lap must include every classified crew, even when
  // an administrator has not yet mapped its pilots to a racing team.
  const fastestByEvent = new Map<string, number>();
  for (const result of results) {
    if (result.status !== "classified" || validNumber(result.finish_position) === null) continue;
    const lap = validNumber(result.best_lap_ms);
    if (lap === null) continue;
    const current = fastestByEvent.get(result.event_id);
    if (current === undefined || lap < current) fastestByEvent.set(result.event_id, lap);
  }
  for (const entry of entries) {
    if (entry.finish_position === null || entry.best_lap_ms === null) continue;
    const current = fastestByEvent.get(entry.event_id);
    if (current === undefined || entry.best_lap_ms < current) fastestByEvent.set(entry.event_id, entry.best_lap_ms);
  }
  const driverPoints = new Map<string, WorldGTEntry>();
  for (const entry of entries) {
    entry.points = entry.finish_position === null ? 0 : worldGTPositionPoints(championships.get(entry.event_id) ?? 'WGT_ENDURANCE', entry.finish_position);
    entry.fastest_lap_bonus = entry.finish_position !== null && entry.best_lap_ms !== null &&
      entry.best_lap_ms === fastestByEvent.get(entry.event_id) ? 2 : 0;
    entry.points += entry.fastest_lap_bonus;
    for (const driverId of entry.driver_ids) {
      driverPoints.set(entry.event_id + "|" + driverId, entry);
    }
  }
  return { entries, driverPoints };
};

