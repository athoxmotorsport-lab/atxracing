/* ACC leaderboards are car results; currentDriver alone loses the other stints. */
export const steamId = value => String(value ?? '').trim().match(/^S?(\d{17})$/i)?.[1] ?? '';
export function expandCrews(results, raw, teamNames = new Map()) {
 const lines=raw?.sessionResult?.leaderBoardLines;
 if(!Array.isArray(lines))throw Error('ACC leaderboard missing');
 const expanded=results.flatMap(result=>{
  const matches=lines.filter(line=>Number(line.car?.raceNumber)===Number(result.numeroVoiture));
  if(matches.length!==1)throw Error('ACC crew car is ambiguous');
  const line=matches[0],drivers=line.car?.drivers??[],times=line.driverTotalTimes;
  const participated=drivers.filter((driver,index)=>steamId(driver.playerId)&&
   (Array.isArray(times)?Number(times[index])>0:steamId(driver.playerId)===steamId(line.currentDriver?.playerId)));
  // Keep a non-starting car represented, without crediting its unused reserve drivers.
  const members=participated.length?participated:[line.currentDriver].filter(d=>steamId(d?.playerId));
  const name=String(line.car.teamName||teamNames.get(Number(line.car.raceNumber))||'').trim()||
   ['#'+line.car.raceNumber,members.map(d=>[d.firstName,d.lastName].filter(Boolean).join(' ').trim()).filter(Boolean).join(' / ')].filter(Boolean).join(' · ');
  return members.map(driver=>{
   const index=drivers.findIndex(d=>steamId(d.playerId)===steamId(driver.playerId));
   const laps=(raw.laps??[]).filter(lap=>lap.carId===line.car.carId&&lap.driverIndex===index&&lap.isValidForBest===true&&lap.laptime>0&&lap.laptime<=3600000);
   const best=laps.sort((a,b)=>a.laptime-b.laptime)[0];
   return {...result,participated:participated.includes(driver),personalBestLapMs:best?.laptime??null,personalSplits:best?.splits??[],teamName:name.slice(0,100),pilote:{steamId:steamId(driver.playerId),pseudo:[driver.firstName,driver.lastName].filter(Boolean).join(' ').trim()}};
  });
 });
 const unique=new Map();
 for(const row of expanded){
  const previous=unique.get(row.pilote.steamId);
  if(previous?.participated&&row.participated&&previous.numeroVoiture!==row.numeroVoiture)throw Error('ACC driver raced in multiple cars');
  if(!previous||row.participated&&!previous.participated)unique.set(row.pilote.steamId,row);
 }
 return [...unique.values()].map(({participated,...row})=>row);
}
const decode=value=>value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export function simgridTeams(html){
 const names=new Map();
 for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const team=row[1].match(/<a\b[^>]*href="\/teams\/[^\"]+"[^>]*>([\s\S]*?)<\/a>/i);
  const number=row[1].match(/class="car-number"[^>]*>\s*(\d+)/i)||row[1].match(/class="badge bg-yellow[^\"]*"[^>]*>\s*#(\d+)/i);
  if(team&&number)names.set(Number(number[1]),decode(team[1].replace(/<[^>]*>/g,'').trim()));
 }
 return names;
}
export async function loadSimgridTeams(url){
 const id=String(url||'').match(/^https:\/\/(?:www\.)?thesimgrid\.com\/championships\/(\d+)(?:[/?#]|$)/)?.[1];
 if(!id)return new Map();
 const pages=await Promise.allSettled(['drivers','results'].map(async page=>{
  const response=await fetch(`https://www.thesimgrid.com/championships/${id}/${page}`,{signal:AbortSignal.timeout(8000)});
  return response.ok?simgridTeams(await response.text()):new Map();
 }));
 const names=new Map();for(const page of pages)if(page.status==='fulfilled')for(const [number,name]of page.value)names.set(number,name);
 return names;
}
