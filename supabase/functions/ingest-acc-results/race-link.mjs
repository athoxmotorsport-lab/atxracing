/* Explicit event marker avoids guessing among recurring races on the same track. */
export function linkedRaceSlug(serverName){
 const match=String(serverName||'').match(/\[ATX:([a-z0-9]+(?:-[a-z0-9]+)*)\]/);
 return match?.[1]||null;
}
export function validateLinkedRace(event,key,stamp,date){
 if(!event?.is_public||event.status==='draft'||event.status==='cancelled'||!event.site_registration_enabled||event.circuit_key!==key)throw Error('Invalid published ACC race marker');
 const start=Date.parse(event.starts_at),instant=stamp?Date.parse(stamp):NaN;
 if(Number.isFinite(instant)){
  const earliest=Date.parse(event.server_opens_at||event.starts_at)-30*60000;
  const minutes=(event.event_schedule||[]).reduce((n,s)=>n+Number(s.durationMinutes||s.duration_minutes||0),0);
  const latest=start+(Math.max(minutes,Number(event.duration_minutes)||0)+90)*60000;
  if(instant<earliest||instant>latest)throw Error('ACC session outside published race window');
 }else{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('ACC session date required for published race');
  const day=Date.parse(date+'T00:00:00Z'),utcDay=Date.parse(event.starts_at.slice(0,10)+'T00:00:00Z');
  if(Math.abs(day-utcDay)>86400000)throw Error('ACC session outside published race date');
 }
 return event;
}
