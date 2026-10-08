import {adminClient,assertAllowedOrigin,bearerToken,hmacHex,jsonResponse} from '../_shared/auth.ts';
import {entryList,entryCSV} from './export.mjs';

Deno.serve(async request=>{
 const reply=(data:unknown,status=200)=>jsonResponse(request,data,status);
 try {
  assertAllowedOrigin(request);if(request.method==='OPTIONS')return reply({ok:true});
  if(!['GET','POST'].includes(request.method))return reply({error:'method_not_allowed'},405);
  const db=adminClient(),token=bearerToken(request);if(!token)return reply({error:'unauthorized'},401);
  const result=await db.from('auth_sessions').select('driver_id').eq('token_hash',await hmacHex(token)).is('revoked_at',null).gt('expires_at',new Date().toISOString()).maybeSingle();
  if(result.error)throw Error('database_error');if(!result.data)return reply({error:'unauthorized'},401);
  const actor=result.data.driver_id;
  const check=async(query:any)=>{const r=await query;if(r.error)throw Error('database_error');return r.data;};
  const admin=async()=>{const r=await check(db.from('driver_roles').select('role').eq('driver_id',actor).eq('role','admin').maybeSingle());if(!r)throw Error('forbidden');};
  const url=new URL(request.url);
  if(request.method==='GET'&&url.searchParams.get('admin')==='1'){
   await admin();const events=await check(db.from('events').select('id,slug,title_fr,title_en,starts_at,format_code,site_registration_enabled,status,competition_code,simgrid_url,deleted_at').eq('is_public',true).order('starts_at',{ascending:false}).limit(100));
   const cars=await check(db.from('atx_acc_cars').select('*').order('name'));
   return reply({events:events.filter((event:any)=>!event.deleted_at&&event.status!=='cancelled'&&!event.simgrid_url&&(event.competition_code==='ATXS'||event.site_registration_enabled)),cars});
  }
  const raw=request.method==='POST'?await request.text():'';if(raw.length>8192)return reply({error:'payload_too_large'},413);
  const body=raw?JSON.parse(raw):{};
  if(body.action==='save_car'){
   await admin();if(!Number.isInteger(body.carModelId)||body.carModelId<0||body.carModelId>999||typeof body.name!=='string'||!body.name.trim()||body.name.length>100)return reply({error:'invalid_car'},400);
   await check(db.from('atx_acc_cars').upsert({car_model_id:body.carModelId,name:body.name.trim(),active:body.active!==false}));return reply({saved:true});
  }
  const eventId=body.eventId||url.searchParams.get('event');if(!/^[0-9a-f-]{36}$/i.test(eventId||''))return reply({error:'invalid_event'},400);
  const event=await check(db.from('events').select('id,slug,format_code,starts_at,status,max_drivers,site_registration_enabled,is_public,simgrid_url,deleted_at').eq('id',eventId).maybeSingle());
  if(!event||!event.is_public||event.deleted_at||event.status==='cancelled')return reply({error:'event_not_found'},404);
  if(body.action==='enable'){
   await admin();if(event.simgrid_url)return reply({error:'external_registration'},409);if(event.starts_at<=new Date().toISOString())return reply({error:'registration_closed'},409);
   await check(db.from('events').update({site_registration_enabled:body.enabled===true}).eq('id',eventId));return reply({saved:true});
  }
  if(request.method==='GET'&&url.searchParams.has('export')){
   await admin();if(event.simgrid_url)return reply({error:'external_registration'},409);const entries=await check(db.from('atx_race_entries').select('*').eq('event_id',eventId).order('race_number'));
   const members=await check(db.from('atx_entry_members').select('*').eq('event_id',eventId).order('driver_id'));
   const identities=members.length?await check(db.from('driver_identities').select('driver_id,steam_id64,last_login_at').in('driver_id',members.map((m:any)=>m.driver_id))):[];
   const list=entryList(entries,members,identities);
   for(const e of list.entries){if(event.format_code==='WGT_SPRINT'&&e.drivers.length!==2) return reply({error:'incomplete_sprint_crew',raceNumber:e.raceNumber},409);}
   const csv=url.searchParams.get('export')==='csv';const response=reply({});
   response.headers.set('Content-Type',csv?'text/csv; charset=utf-8':'application/json; charset=utf-8');
   response.headers.set('Content-Disposition','attachment; filename="'+(csv?'suivi-inscriptions.csv':'entrylist.json')+'"');
   return new Response(csv?entryCSV(list):JSON.stringify(list,null,2),{headers:response.headers});
  }
  if(event.simgrid_url)return reply({error:'external_registration'},409);
  if(request.method==='GET'){
   await check(db.rpc('atx_refresh_waitlist',{p_event:eventId}));
   const waitlist=await check(db.from('atx_waitlist').select('state,offered_until,created_at').eq('event_id',eventId).eq('driver_id',actor).in('state',['waiting','offered']).maybeSingle());
   const cars=await check(db.from('atx_acc_cars').select('car_model_id,name,artwork_file').eq('active',true).order('name'));
   const membership=await check(db.from('atx_entry_members').select('entry_id,first_name,last_name,short_name').eq('event_id',eventId).eq('driver_id',actor).maybeSingle());
   let entry=null;
   if(membership){entry=await check(db.from('atx_race_entries').select('id,owner_driver_id,race_number,car_model_id,team_name,join_code').eq('id',membership.entry_id).single());if(entry.owner_driver_id!==actor)delete entry.join_code;delete entry.owner_driver_id;}
   const {count,error}=await db.from('atx_race_entries').select('id',{head:true,count:'exact'}).eq('event_id',eventId);if(error)throw Error('database_error');
   const [preferences,driver]=await Promise.all([
    check(db.from('driver_profile_preferences').select('acc_first_name,acc_last_name,acc_short_name,preferred_gt3,profile_confirmed_at').eq('driver_id',actor).maybeSingle()),
    check(db.from('drivers').select('car_number,team_name').eq('id',actor).maybeSingle()),
   ]);
   const profile={...preferences,car_number:driver?.car_number??null,team_name:driver?.team_name??null,
    complete:Boolean(preferences?.profile_confirmed_at&&preferences?.acc_first_name&&preferences?.acc_last_name&&preferences?.acc_short_name&&/^[0-9]{1,3}$/.test(driver?.car_number||''))};
   const crew=membership?await check(db.from('atx_entry_members').select('driver_id,first_name,last_name,short_name').eq('event_id',eventId).eq('entry_id',membership.entry_id)):[];
   return reply({event,cars,entry,membership,count,profile,crew,waitlist});
  }
  if(!['register','withdraw','waitlist'].includes(body.action))return reply({error:'invalid_action'},400);
  if(['register','waitlist'].includes(body.action)){
   if(body.joinCode){if(!/^[0-9a-f-]{36}$/i.test(body.joinCode))return reply({error:'invalid_invitation'},400);}
   else if(!Number.isInteger(body.raceNumber)||body.raceNumber<0||body.raceNumber>999||!Number.isInteger(body.carModelId)||typeof body.teamName!=='string'||body.teamName.length>100)return reply({error:'invalid_entry'},400);
  }
  const registration=await db.rpc('atx_register_entry',{p_actor:actor,p_event:eventId,p_action:body.action,p_data:{joinCode:body.joinCode||'',raceNumber:body.raceNumber,carModelId:body.carModelId,teamName:body.teamName}});
  if(registration.error){const known=['team_name_required','team_name_taken','insufficient_coins','acc_profile_required','registration_unavailable','registration_closed','confirmed_profile_required','captain_has_members','already_registered','invalid_invitation','crew_full','event_full','invalid_car','race_number_taken'];const error=known.find(code=>registration.error.message.includes(code));return reply({error:error||'registration_failed'},error?409:500);}
  return reply(registration.data);
 }catch(error){const message=error instanceof Error?error.message:'';return reply({error:message==='forbidden'?'forbidden':message==='ORIGIN_NOT_ALLOWED'?'origin_not_allowed':'service_unavailable'},message==='forbidden'||message==='ORIGIN_NOT_ALLOWED'?403:503);}
});
