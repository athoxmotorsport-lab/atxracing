const decoded = s => String(s||'').replace(/&(?:amp|quot|apos|lt|gt|#39);/g, token => ({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&#39;':"'"})[token]);
const plain = s => decoded(String(s||'').replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
const attr = (html,name) => decoded(html.match(new RegExp(`\\b${name}="([^"]*)"`,'i'))?.[1]||'');
const meta = (html,property) => {const tags=html.match(/<meta\b[^>]*>/gi)||[];return tags.map(tag=>({property:attr(tag,'property'),content:attr(tag,'content')})).find(x=>x.property===property)?.content||'';};
const duration = text => {const h=Number(text.match(/(\d+)h/i)?.[1]||0),m=Number(text.match(/(\d+)m/i)?.[1]||0);return h*60+m||null;};
export function simgridUrl(input){
 let url;try{url=new URL(input);}catch{throw Error('invalid_simgrid_url');}
 if(url.protocol!=='https:'||!['www.thesimgrid.com','thesimgrid.com'].includes(url.hostname)||url.port||url.username||url.password||url.search||url.hash||!/^\/(championships|events)\/\d+\/?$/.test(url.pathname))throw Error('invalid_simgrid_url');
 return `https://www.thesimgrid.com/${url.pathname.match(/^\/(championships|events)/)[1]}/${url.pathname.match(/\d+/)[0]}`;
}
export function mapSimgridChampionship(data,id,sourceUrl=`https://www.thesimgrid.com/championships/${id}`){
 if(String(data?.id)!==String(id)||!Array.isArray(data?.races))throw Error('simgrid_unreadable');
 const clean=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
 const source=simgridUrl(sourceUrl);
 const rounds=data.races.filter(race=>Number.isInteger(race.id)&&Number.isFinite(Date.parse(race.starts_at))&&!race.hot_lap).map((race,index)=>({
  sourceKey:`${id}:${race.id}`,titleFr:clean(race.display_name||race.race_name||data.name,96),titleEn:clean(race.display_name||race.race_name||data.name,96),
  circuit:clean(race.track?.name,64),startsAt:race.starts_at,serverOpensAt:race.starts_at,
  practiceMinutes:null,qualifyingMinutes:null,raceMinutes:null,
  maxDrivers:Number.isInteger(data.capacity)?data.capacity:null,registered:Number.isInteger(data.spots_taken)?data.spots_taken:null,
  carClass:'',imageUrl:typeof data.image==='string'&&data.image.startsWith('https://')?data.image:'',simgridUrl:source,raceUrl:source,
  descriptionFr:'',descriptionEn:'',competition:'',format:'',roundNumber:index+1
 }));
 if(!rounds.length)throw Error('simgrid_no_rounds');
 return {championshipTitle:clean(data.name,96),rounds,warnings:['review_all_fields','choose_format','review_official_start','descriptions_not_available']};
}
export function parseSimgrid(infoHtml,racesHtml,url){
 if(/Just a moment|cf-mitigated|challenge-platform|Attention Required/i.test(infoHtml+' '+racesHtml))throw Error('simgrid_access_blocked');
 const title=plain(infoHtml.match(/<h1\b[^>]*class="[^"]*event-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
 const canonical=meta(infoHtml,'og:url');if(!title||(canonical&&canonical.replace(/\/$/,'')!==url))throw Error('simgrid_unreadable');
 const rawImage=meta(infoHtml,'og:image');let imageUrl='';try{const image=new URL(rawImage);if(image.protocol==='https:'&&image.hostname==='cdn.thesimgrid.com')imageUrl=image.href;}catch{}
 const classSection=infoHtml.match(/<h4[^>]*>\s*Car Categories\s*<\/h4>([\s\S]*?)<\/div>\s*<\/div>/i)?.[1]||'';
 const carClass=plain(classSection.match(/<span[^>]*badge-chunky[^>]*>([\s\S]*?)<\/span>/i)?.[1])||'';
 const capacityPart=infoHtml.match(/class="[^"]*badge-counter[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1]||'';
 const numbers=[...capacityPart.matchAll(/<span[^>]*>(\d+)<\/span>/gi)].map(x=>Number(x[1]));
 const registered=Number.isInteger(numbers[0])?numbers[0]:null,maxDrivers=Number.isInteger(numbers[1])?numbers[1]:null;
 const scheduleCards=infoHtml.split(/class="schedule-card(?:\s|")/i).slice(1);
 const schedule=scheduleCards.map(block=>{
  const date=block.match(/<time\s+datetime="([^"]+)"/i)?.[1]||'';
  const circuit=plain(block.match(/class="schedule-track"[^>]*>([\s\S]*?)<\/div>/i)?.[1]);
  const sessions=[...block.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>\s*<span[^>]*>([\s\S]*?)<\/span>/gi)].map(x=>({minutes:duration(plain(x[1])),type:plain(x[2]).toLowerCase()}));
  if(!date||!Number.isFinite(Date.parse(date))||!circuit)return null;
  return {startsAt:date,circuit,practiceMinutes:sessions.find(s=>/^p\d*$/.test(s.type))?.minutes||null,qualifyingMinutes:sessions.find(s=>/^q\d*$/.test(s.type))?.minutes||null,raceMinutes:sessions.find(s=>/^r\d*$/.test(s.type))?.minutes||null};
 }).filter(Boolean);
 const raceCards=racesHtml.split(/class="race-card(?:\s|")/i).slice(1).map(block=>({
  raceId:block.match(/data-race-panel-url="[^"]*\/races\/(\d+)\/panel"/i)?.[1]||'',
  title:plain(block.match(/class="race-card-title[^>]*>([\s\S]*?)<\/span>/i)?.[1]),
  circuit:plain(block.match(/class="d-block fs-xs text-white-90"[^>]*>([\s\S]*?)<\/span>/i)?.[1]),
  startsAt:block.match(/<time\s+datetime="([^"]+)"/i)?.[1]||''
 })).filter(r=>r.raceId&&Number.isFinite(Date.parse(r.startsAt)));
 const rounds=(raceCards.length?raceCards:schedule.map((s,i)=>({raceId:`round-${i+1}`,title,circuit:s.circuit,startsAt:s.startsAt}))).map((r,i)=>{
  const match=schedule.find(s=>s.startsAt===r.startsAt&&s.circuit.toLowerCase()===r.circuit.toLowerCase())||{};
  return {sourceKey:url.match(/\d+$/)[0]+':'+r.raceId,titleFr:r.title||title,titleEn:r.title||title,
   circuit:r.circuit||match.circuit||'',startsAt:r.startsAt,serverOpensAt:r.startsAt,
   practiceMinutes:match.practiceMinutes||null,qualifyingMinutes:match.qualifyingMinutes||null,raceMinutes:match.raceMinutes||null,
   maxDrivers,registered,carClass,imageUrl,simgridUrl:url,descriptionFr:'',descriptionEn:'',competition:'',format:'',roundNumber:i+1};
 });
 if(!rounds.length)throw Error('simgrid_no_rounds');
 return {championshipTitle:title,rounds,warnings:[
  ...(!imageUrl?['image_not_found']:[]),...(!carClass?['car_class_not_found']:[]),...(!maxDrivers?['capacity_not_found']:[]),
  'review_all_fields','choose_format','review_official_start','descriptions_not_available'
 ]};
}
