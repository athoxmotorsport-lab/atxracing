/* Same owner statistics as the full Steam-session response, without global lap scans. */
export function sportingProfile(rows){
 const event=row=>Array.isArray(row.event)?row.event[0]:row.event||{};
 const results=rows.filter(row=>{
  const e=event(row),title=(String(e.title_fr||'')+' '+String(e.title_en||'')).toLowerCase();
  if(/discord|open\s*lobby|hotlaper|entrainement|entraînement/.test(title))return false;
  return ['DR','WGT','BATX','BA','ATXS'].includes(String(e.competition_code||'').toUpperCase())||['daily_race','sprint','championship','endurance'].includes(e.event_type)||/\b(daily\s*race|dr|wgt|ball?ade\s*atx)\b/i.test(title);
 });
 const stats=results.reduce((s,r)=>({races:s.races+1,wins:s.wins+(r.finish_position===1&&r.status==='classified'?1:0),podiums:s.podiums+(r.finish_position&&r.finish_position<=3&&r.status==='classified'?1:0),points:s.points+Number(r.points||0)}),{races:0,wins:0,podiums:0,points:0});
 return {stats,results:[...results].sort((a,b)=>Date.parse(event(b).starts_at||'')-Date.parse(event(a).starts_at||''))};
}
