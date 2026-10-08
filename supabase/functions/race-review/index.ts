import {adminClient,assertAllowedOrigin,bearerToken,hmacHex,jsonResponse} from '../_shared/auth.ts';
import {competitiveRace} from '../_shared/race-visibility.mjs';
Deno.serve(async request=>{
 const reply=(data:unknown,status=200)=>jsonResponse(request,data,status);
 try{
  assertAllowedOrigin(request);if(request.method==='OPTIONS')return reply({ok:true});if(!['GET','POST'].includes(request.method))return reply({error:'method_not_allowed'},405);
  const token=bearerToken(request);if(!token)return reply({error:'unauthorized'},401);const db=adminClient();
  const check=async(q:any)=>{const r=await q;if(r.error)throw Error('database');return r.data;};
  const session=await check(db.from('auth_sessions').select('driver_id').eq('token_hash',await hmacHex(token)).is('revoked_at',null).gt('expires_at',new Date().toISOString()).maybeSingle());if(!session)return reply({error:'unauthorized'},401);
  const roles=await check(db.from('driver_roles').select('role').eq('driver_id',session.driver_id).in('role',['admin','steward']));if(!roles.length)return reply({error:'forbidden'},403);
  const eventId=new URL(request.url).searchParams.get('event');
  if(request.method==='GET'&&!eventId){const events=await check(db.from('events').select('id,slug,title_fr,title_en,server_name,event_type,competition_code,starts_at,status,is_public,result_publication_state,results_validated_at').eq('is_public',true).neq('status','draft').neq('result_publication_state','official').lt('starts_at',new Date().toISOString()).order('starts_at',{ascending:false}).limit(200));return reply({events:events.filter(competitiveRace)});}
  if(request.method==='GET'){
   if(!/^[0-9a-f-]{36}$/i.test(eventId||''))return reply({error:'invalid_event'},400);
   const results=await check(db.from('results').select('driver_id,finish_position,status,points,laps_completed,best_lap_ms,driver:drivers(display_name)').eq('event_id',eventId).order('finish_position',{ascending:true,nullsFirst:false}));
   const decisions=await check(db.from('atx_result_decisions').select('reason_fr,reason_en,before_value,after_value,created_at').eq('event_id',eventId).order('created_at',{ascending:false}));return reply({results,decisions});
  }
  const raw=await request.text();if(raw.length>8192)return reply({error:'payload_too_large'},413);let body;try{body=JSON.parse(raw);}catch{return reply({error:'invalid_json'},400);}
  if(!/^[0-9a-f-]{36}$/i.test(body.eventId||'')||!['publication','correct'].includes(body.action)||typeof body.reasonFr!=='string'||typeof body.reasonEn!=='string')return reply({error:'invalid_review'},400);
  const event=await check(db.from('events').select('event_type,competition_code,title_fr,title_en,server_name').eq('id',body.eventId).maybeSingle());if(!competitiveRace(event))return reply({error:'not_a_race'},409);
  if(body.action==='correct'&&(!/^[0-9a-f-]{36}$/i.test(body.driverId||'')||!['classified','dnf','dns','dsq'].includes(body.status)||!Number.isFinite(body.points)||body.points<0||body.points>1000||(body.position!==null&&(!Number.isInteger(body.position)||body.position<1||body.position>999))))return reply({error:'invalid_result'},400);
  const r=await db.rpc('atx_review_results',{p_actor:session.driver_id,p_event:body.eventId,p_action:body.action,p_data:{state:body.state,driverId:body.driverId,status:body.status,points:body.points,position:body.position,reasonFr:body.reasonFr,reasonEn:body.reasonEn}});
  if(r.error){const known=['results_locked','results_import_in_progress','teams_required','positions_conflict','results_required','race_not_finished','reason_required','invalid_state','result_not_found'];return reply({error:known.find(k=>r.error.message.includes(k))||'review_failed'},409);}return reply(r.data);
 }catch{return reply({error:'review_unavailable'},503);}
});
