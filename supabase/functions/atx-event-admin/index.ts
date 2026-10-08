import { mapSimgridChampionship, simgridUrl } from './simgrid.mjs';
import { circuitPhoto } from './circuits.mjs';

const encoder=new TextEncoder();
const required=(name:string)=>{const value=Deno.env.get(name);if(!value)throw Error('configuration');return value;};
const secret=()=>{const modern=Deno.env.get('SUPABASE_SECRET_KEYS');return modern?JSON.parse(modern).default||required('SUPABASE_SERVICE_ROLE_KEY'):required('SUPABASE_SERVICE_ROLE_KEY');};
async function hmac(token:string){const key=await crypto.subtle.importKey('raw',encoder.encode(required('SESSION_SECRET')),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(token))),b=>b.toString(16).padStart(2,'0')).join('');}
async function rest(path:string,options:RequestInit={}){const key=secret();const response=await fetch(required('SUPABASE_URL')+'/rest/v1/'+path,{...options,headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:'Bearer '+key}),'Content-Type':'application/json',Prefer:'return=representation',...options.headers},signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('database_error');return response.json();}
async function administrator(request:Request){const token=request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{40,128})$/)?.[1];if(!token)throw Error('unauthorized');const sessions=await rest('auth_sessions?select=driver_id&token_hash=eq.'+await hmac(token)+'&revoked_at=is.null&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&limit=1');if(!sessions.length)throw Error('unauthorized');const id=sessions[0].driver_id;const roles=await rest('driver_roles?select=role&driver_id=eq.'+encodeURIComponent(id)+'&role=eq.admin&limit=1');if(!roles.length)throw Error('forbidden');return id;}
const clean=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
function validateMedia(raw:any){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('invalid_media');const mediaType=clean(raw.mediaType,12),titleFr=clean(raw.titleFr,120),titleEn=clean(raw.titleEn,120),url=clean(raw.url,500),eventSlug=clean(raw.eventSlug,120);if(!['live','replay'].includes(mediaType)||!titleFr||!titleEn)throw Error('invalid_media');let parsed;try{parsed=new URL(url);}catch{throw Error('invalid_media_url');}const host=parsed.hostname.toLowerCase().replace(/^www\./,'');if(parsed.protocol!=='https:'||parsed.username||parsed.password||!['youtube.com','youtu.be','twitch.tv'].includes(host))throw Error('invalid_media_url');if(eventSlug&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(eventSlug))throw Error('invalid_event_slug');return{media_type:mediaType,title_fr:titleFr,title_en:titleEn,url:parsed.href,event_slug:eventSlug||null,is_public:raw.isPublic!==false,published_at:new Date().toISOString(),updated_at:new Date().toISOString()};}
function validateDraft(raw:any){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('invalid_draft');
 const allowed=['DR','BATX','WGT','ATXS'],formats=['DR','DR_90','BATX','WGT_SPRINT','WGT_ENDURANCE','ATXS'];const competition=clean(raw.competition,8),siteOnly=competition==='ATXS',format=siteOnly?'ATXS':clean(raw.format,20);
 if(competition&&!allowed.includes(competition)||format&&!formats.includes(format))throw Error('invalid_format');
 if(format&&competition&&!(format===competition||(competition==='DR'&&format==='DR_90')||(competition==='WGT'&&format.startsWith('WGT_'))))throw Error('invalid_format');
 const numeric=(key,max)=>{if(raw[key]==null||raw[key]==='')return null;const number=Number(raw[key]);if(!Number.isInteger(number)||number<0||number>max)throw Error('invalid_'+key);return number;};
 const instant=key=>{const value=clean(raw[key],36);if(!value)return '';const date=new Date(value);if(!Number.isFinite(date.getTime())||!/\d{4}-\d\d-\d\dT/.test(value))throw Error('invalid_'+key);return date.toISOString();};
 const source=siteOnly?'':clean(raw.simgridUrl,180),image=siteOnly?circuitPhoto(raw.circuit,required('ATX_SITE_URL')):clean(raw.imageUrl,500);const canonicalSource=source?simgridUrl(source):'';
 if(image){let url;try{url=new URL(image);}catch{throw Error('invalid_image_url');}if(url.protocol!=='https:'||url.username||url.password)throw Error('invalid_image_url');}
 const circuit=clean(raw.circuit,64),circuitKey=circuit.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,64);
 const sourceKey=siteOnly?'':clean(raw.sourceKey,80);if(sourceKey&&!/^\d+:(?:\d+|round-\d+)$/.test(sourceKey))throw Error('invalid_source_key');
 const draft={sourceKey,titleFr:clean(raw.titleFr,96),titleEn:clean(raw.titleEn,96),descriptionFr:clean(raw.descriptionFr,4000),descriptionEn:clean(raw.descriptionEn,4000),circuit,circuitKey,
  startsAt:instant('startsAt'),serverOpensAt:instant('serverOpensAt'),practiceMinutes:siteOnly?2:numeric('practiceMinutes',1440),qualifyingMinutes:siteOnly?15:numeric('qualifyingMinutes',1440),raceMinutes:siteOnly?45:numeric('raceMinutes',1440),
  maxDrivers:numeric('maxDrivers',100),registered:siteOnly?null:numeric('registered',1000),carClass:clean(raw.carClass,32),imageUrl:image,simgridUrl:canonicalSource,competition,format,
  raceUrl:siteOnly?'':clean(raw.raceUrl,180),roundNumber:numeric('roundNumber',200)};
 if(draft.startsAt&&draft.serverOpensAt&&Date.parse(draft.serverOpensAt)>Date.parse(draft.startsAt))throw Error('invalid_serverOpensAt');
 return {...draft,schedule:draft.startsAt?schedule(draft):[]};
}
function ready(d:any){const preset={ATXS:[2,15,45],DR_90:[60,15,90],DR:[60,15,60],BATX:[60,15,90],WGT_SPRINT:[60,15,60]}[d.format];return Boolean(d.competition&&d.format&&d.titleFr&&d.titleEn&&d.descriptionFr&&d.descriptionEn&&d.circuit&&d.circuitKey&&d.startsAt&&d.raceMinutes&&d.maxDrivers&&d.imageUrl&&(d.competition==='ATXS'||d.simgridUrl)&&
 (!preset||[d.practiceMinutes,d.qualifyingMinutes,d.raceMinutes].every((value,index)=>value===preset[index])));}
function schedule(d:any){const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Brussels',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});let at=Date.parse(d.startsAt);const items=[];for(const [key,fr,en,minutes] of [['practice_1','Essais libres','Free practice',d.practiceMinutes],['qualifying','Qualifications','Qualifying',d.qualifyingMinutes],['race','Course','Race',d.raceMinutes]]){if(minutes==null||minutes===0)continue;const start=fmt.format(at);at+=minutes*60000;items.push({key,labelFr:fr,labelEn:en,start,end:fmt.format(at)});}return items;}
async function simgridApi(id:string,source:string){const token=Deno.env.get('SIMGRID_API_TOKEN');if(!token)throw Error('simgrid_token_required');const response=await fetch('https://www.thesimgrid.com/api/v1/championships/'+id,{headers:{Accept:'application/json',Authorization:'Bearer '+token},signal:AbortSignal.timeout(12000)});if(response.status===401||response.status===403)throw Error('simgrid_token_invalid');if(response.status===404)throw Error('simgrid_unavailable');if(!response.ok)throw Error('simgrid_unavailable');return mapSimgridChampionship(await response.json(),id,source);}

Deno.serve(async request=>{const headers=new Headers({'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS','Access-Control-Allow-Headers':'authorization, content-type'});const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 try{const origin=new URL(required('ATX_SITE_URL')).origin;headers.set('Access-Control-Allow-Origin',origin);if(request.headers.get('origin')&&request.headers.get('origin')!==origin)return reply({error:'origin_not_allowed'},403);if(request.method==='OPTIONS')return reply({ok:true});if(!['GET','POST','PATCH'].includes(request.method))return reply({error:'method_not_allowed'},405);
  const admin=await administrator(request);
  if(request.method==='GET'){const [drafts,media]=await Promise.all([rest('atx_event_drafts?select=id,source_key,draft,status,event_id,published_slug,created_at,updated_at&order=created_at.desc&limit=100'),rest('atx_media?select=id,media_type,title_fr,title_en,url,event_slug,is_public,published_at&order=published_at.desc&limit=100')]);return reply({drafts,media});}
  const raw=await request.text();if(raw.length>65_536)return reply({error:'payload_too_large'},413);let body;try{body=JSON.parse(raw);}catch{return reply({error:'invalid_json'},400);}const action=body?.action;
  if(action==='import'&&request.method==='POST'){
   const url=simgridUrl(body.url);return reply(await simgridApi(url.match(/\d+$/)![0],url));
  }
  if(action==='save'&&['POST','PATCH'].includes(request.method)){
   const draft=validateDraft(body.draft),id=clean(body.id,36);let rows;
   if(draft.sourceKey){const existing=await rest('atx_event_drafts?select=id&source_key=eq.'+encodeURIComponent(draft.sourceKey)+'&limit=1');if(existing.length&&existing[0].id!==id)return reply({error:'round_already_imported',id:existing[0].id},409);}
   if(request.method==='PATCH'){if(!/^[0-9a-f-]{36}$/i.test(id))return reply({error:'invalid_id'},400);rows=await rest('atx_event_drafts?id=eq.'+id+'&status=eq.draft',{method:'PATCH',body:JSON.stringify({draft,source_key:draft.sourceKey||null,updated_at:new Date().toISOString()})});}
   else rows=await rest('atx_event_drafts',{method:'POST',body:JSON.stringify({draft,source_key:draft.sourceKey||null,created_by:admin})});
   return rows.length?reply({draft:rows[0]},request.method==='POST'?201:200):reply({error:'draft_not_found'},404);
  }
  if(action==='save_media'&&request.method==='POST'){
   const media=validateMedia(body.media),id=clean(body.id,36);let rows;
   if(id){if(!/^[0-9a-f-]{36}$/i.test(id))return reply({error:'invalid_id'},400);rows=await rest('atx_media?id=eq.'+id,{method:'PATCH',body:JSON.stringify(media)});}
   else rows=await rest('atx_media',{method:'POST',body:JSON.stringify({...media,created_by:admin})});
   return rows.length?reply({media:rows[0]},id?200:201):reply({error:'media_not_found'},404);
  }
  if(action==='publish'&&request.method==='POST'){
   const id=clean(body.id,36);if(!/^[0-9a-f-]{36}$/i.test(id))return reply({error:'invalid_id'},400);const rows=await rest('atx_event_drafts?id=eq.'+id+'&select=id,draft,status&limit=1');if(!rows.length)return reply({error:'draft_not_found'},404);if(rows[0].status==='draft'&&!ready(rows[0].draft))return reply({error:'complete_draft_before_publishing'},400);
   const result=await rest('rpc/publish_atx_event_draft',{method:'POST',body:JSON.stringify({p_draft_id:id})});return reply({event:result});
  }
  return reply({error:'invalid_action'},400);
 }catch(error){const message=error instanceof Error?error.message:'unavailable';const known=['invalid_simgrid_url','invalid_image_url','invalid_format','invalid_draft','invalid_source_key','invalid_media','invalid_media_url','invalid_event_slug','simgrid_unreadable','simgrid_no_rounds','simgrid_unavailable','simgrid_access_blocked','simgrid_token_required','simgrid_token_invalid'];if(message==='unauthorized')return reply({error:message},401);if(message==='forbidden')return reply({error:message},403);if(known.includes(message)||message.startsWith('invalid_'))return reply({error:message},['simgrid_access_blocked','simgrid_token_required','simgrid_token_invalid'].includes(message)?503:400);return reply({error:'service_unavailable'},503);}
});
