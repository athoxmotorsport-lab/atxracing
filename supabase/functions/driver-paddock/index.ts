import {adminClient,assertAllowedOrigin,bearerToken,hmacHex,jsonResponse} from '../_shared/auth.ts';
import {officialRace} from '../_shared/race-visibility.mjs';
Deno.serve(async request=>{
 const reply=(data:unknown,status=200)=>jsonResponse(request,data,status);
 try{
  assertAllowedOrigin(request);if(request.method==='OPTIONS')return reply({ok:true});if(request.method!=='GET')return reply({error:'method_not_allowed'},405);
  const token=bearerToken(request);if(!token)return reply({error:'unauthorized'},401);const db=adminClient();
  const check=async(q:any)=>{const r=await q;if(r.error)throw Error('database');return r.data;};
  const session=await check(db.from('auth_sessions').select('driver_id').eq('token_hash',await hmacHex(token)).is('revoked_at',null).gt('expires_at',new Date().toISOString()).maybeSingle());if(!session)return reply({error:'unauthorized'},401);const actor=session.driver_id;
  if(new URL(request.url).searchParams.get('view')==='wallet')return reply(await check(db.rpc('atx_driver_wallet',{p_actor:actor})));
  const waits=await check(db.from('atx_waitlist').select('event_id').eq('driver_id',actor).in('state',['waiting','offered']));
  for(const w of waits)await check(db.rpc('atx_refresh_waitlist',{p_event:w.event_id}));
  const [wallet,registrations,waitlist,results,profile]=await Promise.all([
   check(db.rpc('atx_driver_wallet',{p_actor:actor})),
   check(db.from('registrations').select('status,race_number,car_model,team_name,event:events!inner(slug,title_fr,title_en,starts_at,circuit_name,is_public,status,simgrid_url,site_registration_enabled)').eq('driver_id',actor).eq('status','confirmed').eq('event.is_public',true).gt('event.starts_at',new Date().toISOString())),
   check(db.from('atx_waitlist').select('state,offered_until,event:events!inner(slug,title_fr,title_en,starts_at,circuit_name,is_public,status)').eq('driver_id',actor).in('state',['waiting','offered']).eq('event.is_public',true).gt('event.starts_at',new Date().toISOString())),
   check(db.from('results').select('finish_position,status,points,best_lap_ms,event:events!inner(slug,title_fr,title_en,server_name,circuit_name,starts_at,event_type,competition_code,is_public,status,result_publication_state)').eq('driver_id',actor).eq('event.is_public',true).eq('event.result_publication_state','official').order('created_at',{ascending:false}).limit(30)),
   check(db.from('drivers').select('car_number,driver_profile_preferences(profile_confirmed_at,acc_first_name,acc_last_name,acc_short_name)').eq('id',actor).single()),
  ]);
  const prefs=Array.isArray(profile.driver_profile_preferences)?profile.driver_profile_preferences[0]:profile.driver_profile_preferences;
  const complete=Boolean(prefs?.profile_confirmed_at&&prefs.acc_first_name&&prefs.acc_last_name&&prefs.acc_short_name&&/^[0-9]{1,3}$/.test(profile.car_number||''));
  const unwrap=(r:any)=>({...r,event:Array.isArray(r.event)?r.event[0]:r.event});
  return reply({profile_complete:complete,coins:wallet.coins,ledger:wallet.ledger,registrations:registrations.map(unwrap).filter((r:any)=>!['cancelled','draft'].includes(r.event.status)).sort((a:any,b:any)=>Date.parse(a.event.starts_at)-Date.parse(b.event.starts_at)),waitlist:waitlist.map(unwrap).filter((r:any)=>!['cancelled','draft'].includes(r.event.status)),latest_result:results.map(unwrap).find((r:any)=>officialRace(r.event))||null});
 }catch{return reply({error:'paddock_unavailable'},503);}
});
