/* Short competition codes, track and session time identify published races. */
export function competitionCode(serverName){
 const codes=[...String(serverName||'').toUpperCase().matchAll(/(?:^|[^A-Z0-9])(ATXS|(?:LF)?WGT|DR)(?=$|[^A-Z0-9])/g)].map(m=>m[1]==='LFWGT'?'WGT':m[1]);
 const unique=[...new Set(codes)];
 if(unique.length>1)throw Error('Ambiguous ACC competition code');
 return unique[0]||null;
}
export function matchPublishedRace(events,code,key,stamp,date,serverName){
 if(!code)return null;
 const instant=Date.parse(stamp||'');
 const candidates=(events||[]).filter(e=>e.is_public&&e.status!=='draft'&&e.status!=='cancelled'&&e.competition_code===code&&e.circuit_key===key).filter(e=>{
  if(!Number.isFinite(instant))return String(e.starts_at||'').slice(0,10)===date;
  const opens=Date.parse(e.server_opens_at||e.starts_at),start=Date.parse(e.starts_at);
  const schedule=(e.event_schedule||[]).reduce((n,s)=>n+Number(s.durationMinutes||s.duration_minutes||0),0);
  return instant>=opens-30*60000&&instant<=start+(Math.max(schedule,Number(e.duration_minutes)||0)+90)*60000;
 });
 if(!candidates.length){
  // Named WGT round exports may use the file time instead of the session start.
  if(code==='WGT'&&serverName){const clean=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');const source=clean(serverName);const named=(events||[]).filter(e=>e.is_public&&e.status!=='draft'&&e.status!=='cancelled'&&e.competition_code===code&&e.circuit_key===key&&String(e.starts_at||'').slice(0,10)===date).filter(e=>[e.title_fr,e.title_en].some(t=>clean(t).length>=8&&source.includes(clean(t))));if(named.length>1)throw Error('Ambiguous named WGT race');if(named.length===1)return named[0];}
  return null;
 }
 if(candidates.length===1)return candidates[0];
 if(!Number.isFinite(instant))throw Error('ACC session time required to distinguish recurring races');
 candidates.sort((a,b)=>Math.abs(Date.parse(a.starts_at)-instant)-Math.abs(Date.parse(b.starts_at)-instant));
 if(Math.abs(Date.parse(candidates[0].starts_at)-instant)===Math.abs(Date.parse(candidates[1].starts_at)-instant))throw Error('Ambiguous published ACC race time');
 return candidates[0];
}
