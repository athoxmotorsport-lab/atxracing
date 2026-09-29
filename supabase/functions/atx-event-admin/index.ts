import { parseSimgrid, simgridUrl } from './simgrid.mjs';

const encoder=new TextEncoder();
const required=(name:string)=>{const value=Deno.env.get(name);if(!value)throw Error('configuration');return value;};
const secret=()=>{const modern=Deno.env.get('SUPABASE_SECRET_KEYS');return modern?JSON.parse(modern).default||required('SUPABASE_SERVICE_ROLE_KEY'):required('SUPABASE_SERVICE_ROLE_KEY');};
async function hmac(token:string){const key=await crypto.subtle.importKey('raw',encoder.encode(required('SESSION_SECRET')),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(token))),b=>b.toString(16).padStart(2,'0')).join('');}
async function rest(path:string,options:RequestInit={}){const key=secret();const response=await fetch(required('SUPABASE_URL')+'/rest/v1/'+path,{...options,headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:'Bearer '+key}),'Content-Type':'application/json',Prefer:'return=representation',...options.headers},signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('database_error');return response.json();}
async function administrator(request:Request){const token=request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{40,128})$/)?.[1];if(!token)throw Error('unauthorized');const sessions=await rest('auth_sessions?select=driver_id&token_hash=eq.'+await hmac(token)+'&revoked_at=is.null&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&limit=1');if(!sessions.length)throw Error('unauthorized');const id=sessions[0].driver_id;const roles=await rest('driver_roles?select=role&driver_id=eq.'+encodeURIComponent(id)+'&role=eq.admin&limit=1');if(!roles.length)throw Error('forbidden');return id;}
const clean=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
function validateDraft(raw:any){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('invalid_draft');
 const allowed=['DR','BATX','WGT'],formats=['DR','BATX','WGT_SPRINT','WGT_ENDURANCE'];const competition=clean(raw.competition,8),format=clean(raw.format,20);
 if(competition&&!allowed.includes(competition)||format&&!formats.includes(format))throw Error('invalid_format');
 if(format&&competition&&!(format===competition||(competition==='WGT'&&format.startsWith('WGT_'))))throw Error('invalid_format');
 const numeric=(key,max)=>{if(raw[key]==null||raw[key]==='')return null;const number=Number(raw[key]);if(!Number.isInteger(number)||number<0||number>max)throw Error('invalid_'+key);return number;};
 const instant=key=>{const value=clean(raw[key],36);if(!value)return '';const date=new Date(value);if(!Number.isFinite(date.getTime())||!/\d{4}-\d\d-\d\dT/.test(value))throw Error('invalid_'+key);return date.toISOString();};
 const source=clean(raw.simgridUrl,180),image=clean(raw.imageUrl,500);if(source&&simgridUrl(source)!==source)throw Error('invalid_simgrid_url');
 if(image){let url;try{url=new URL(image);}catch{throw Error('invalid_image_url');}if(url.protocol!=='https:'||url.username||url.password)throw Error('invalid_image_url');}
 const circuit=clean(raw.circuit,64),circuitKey=circuit.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,64);
 const sourceKey=clean(raw.sourceKey,80);if(sourceKey&&!/^\d+:(?:\d+|round-\d+)$/.test(sourceKey))throw Error('invalid_source_key');
 const draft={sourceKey,titleFr:clean(raw.titleFr,96),titleEn:clean(raw.titleEn,96),descriptionFr:clean(raw.descriptionFr,4000),descriptionEn:clean(raw.descriptionEn,4000),circuit,circuitKey,
  startsAt:instant('startsAt'),serverOpensAt:instant('serverOpensAt'),practiceMinutes:numeric('practiceMinutes',1440),qualifyingMinutes:numeric('qualifyingMinutes',1440),raceMinutes:numeric('raceMinutes',1440),
  maxDrivers:numeric('maxDrivers',100),registered:numeric('registered',1000),carClass:clean(raw.carClass,32),imageUrl:image,simgridUrl:source,competition,format,
  raceUrl:clean(raw.raceUrl,180),roundNumber:numeric('roundNumber',200)};
 if(draft.startsAt&&draft.serverOpensAt&&Date.parse(draft.serverOpensAt)>Date.parse(draft.startsAt))throw Error('invalid_serverOpensAt');
 return {...draft,schedule:draft.startsAt?schedule(draft):[]};
}
function ready(d:any){const preset={DR:[60,15,60],BATX:[60,15,90],WGT_SPRINT:[60,15,60]}[d.format];return Boolean(d.competition&&d.format&&d.titleFr&&d.titleEn&&d.descriptionFr&&d.descriptionEn&&d.circuit&&d.circuitKey&&d.startsAt&&d.raceMinutes&&d.maxDrivers&&d.imageUrl&&d.simgridUrl&&
 (!preset||[d.practiceMinutes,d.qualifyingMinutes,d.raceMinutes].every((value,index)=>value===preset[index])));}
function schedule(d:any){const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Brussels',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});let at=Date.parse(d.startsAt);const items=[];for(const [key,fr,en,minutes] of [['practice_1','Essais libres','Free practice',d.practiceMinutes],['qualifying','Qualifications','Qualifying',d.qualifyingMinutes],['race','Course','Race',d.raceMinutes]]){if(minutes==null||minutes===0)continue;const start=fmt.format(at);at+=minutes*60000;items.push({key,labelFr:fr,labelEn:en,start,end:fmt.format(at)});}return items;}
async function simgridPage(url:string){const response=await fetch(url,{redirect:'error',headers:{Accept:'text/html'},signal:AbortSignal.timeout(12000)});if(response.status===403||response.status===429||response.headers.get('cf-mitigated'))throw Error('simgrid_access_blocked');if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw Error('simgrid_unavailable');const size=Number(response.headers.get('content-length')||0);if(size>2_000_000)throw Error('simgrid_unreadable');const html=await response.text();if(html.length>2_000_000)throw Error('simgrid_unreadable');return html;}

Deno.serve(async request=>{const headers=new Headers({'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS','Access-Control-Allow-Headers':'authorization, content-type'});const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 try{const origin=new URL(required('ATX_SITE_URL')).origin;headers.set('Access-Control-Allow-Origin',origin);if(request.headers.get('origin')&&request.headers.get('origin')!==origin)return reply({error:'origin_not_allowed'},403);if(request.method==='OPTIONS')return reply({ok:true});if(!['GET','POST','PATCH'].includes(request.method))return reply({error:'method_not_allowed'},405);
  const admin=await administrator(request);
  if(request.method==='GET'){const drafts=await rest('atx_event_drafts?select=id,source_key,draft,status,event_id,published_slug,created_at,updated_at&order=created_at.desc&limit=100');return reply({drafts});}
  const raw=await request.text();if(raw.length>65_536)return reply({error:'payload_too_large'},413);let body;try{body=JSON.parse(raw);}catch{return reply({error:'invalid_json'},400);}const action=body?.action;
  if(action==='import'&&request.method==='POST'){
   const url=simgridUrl(body.url);const [info,races]=await Promise.all([simgridPage(url),simgridPage(url+'/races')]);return reply(parseSimgrid(info,races,url));
  }
  if(action==='save'&&['POST','PATCH'].includes(request.method)){
   const draft=validateDraft(body.draft),id=clean(body.id,36);let rows;
   if(draft.sourceKey){const existing=await rest('atx_event_drafts?select=id&source_key=eq.'+encodeURIComponent(draft.sourceKey)+'&limit=1');if(existing.length&&existing[0].id!==id)return reply({error:'round_already_imported',id:existing[0].id},409);}
   if(request.method==='PATCH'){if(!/^[0-9a-f-]{36}$/i.test(id))return reply({error:'invalid_id'},400);rows=await rest('atx_event_drafts?id=eq.'+id+'&status=eq.draft',{method:'PATCH',body:JSON.stringify({draft,source_key:draft.sourceKey||null,updated_at:new Date().toISOString()})});}
   else rows=await rest('atx_event_drafts',{method:'POST',body:JSON.stringify({draft,source_key:draft.sourceKey||null,created_by:admin})});
   return rows.length?reply({draft:rows[0]},request.method==='POST'?201:200):reply({error:'draft_not_found'},404);
  }
  if(action==='publish'&&request.method==='POST'){
   const id=clean(body.id,36);if(!/^[0-9a-f-]{36}$/i.test(id))return reply({error:'invalid_id'},400);const rows=await rest('atx_event_drafts?id=eq.'+id+'&select=id,draft,status&limit=1');if(!rows.length)return reply({error:'draft_not_found'},404);if(rows[0].status==='draft'&&!ready(rows[0].draft))return reply({error:'complete_draft_before_publishing'},400);
   const result=await rest('rpc/publish_atx_event_draft',{method:'POST',body:JSON.stringify({p_draft_id:id})});return reply({event:result});
  }
  return reply({error:'invalid_action'},400);
 }catch(error){const message=error instanceof Error?error.message:'unavailable';const known=['invalid_simgrid_url','invalid_image_url','invalid_format','invalid_draft','invalid_source_key','simgrid_unreadable','simgrid_no_rounds','simgrid_unavailable','simgrid_access_blocked'];if(message==='unauthorized')return reply({error:message},401);if(message==='forbidden')return reply({error:message},403);if(known.includes(message)||message.startsWith('invalid_'))return reply({error:message},message==='simgrid_access_blocked'?503:400);return reply({error:'service_unavailable'},503);}
});
