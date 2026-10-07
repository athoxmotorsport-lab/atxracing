import { adminClient, assertAllowedOrigin, bearerToken, corsHeaders, hmacHex, jsonResponse } from '../_shared/auth.ts';

const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const publicFields = 'id,display_name,avatar_url,team_name';

Deno.serve(async request => {
 try {
  assertAllowedOrigin(request);
  if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders(request.headers.get('origin'))});
  if(!['GET','POST'].includes(request.method))return jsonResponse(request,{error:'method_not_allowed'},405);
  const token=bearerToken(request);
  if(!token)return jsonResponse(request,{error:'unauthorized'},401);
  const db=adminClient();
  const {data:session,error:sessionError}=await db.from('auth_sessions').select('driver_id').eq('token_hash',await hmacHex(token)).is('revoked_at',null).gt('expires_at',new Date().toISOString()).maybeSingle();
  if(sessionError)throw sessionError;
  if(!session)return jsonResponse(request,{error:'unauthorized'},401);
  const me=session.driver_id as string;
  if(request.method==='GET'){
   const params=new URL(request.url).searchParams;
   const view=params.get('view')||'inbox';
   if(view==='unread'){
    const {count,error}=await db.from('driver_messages').select('id',{count:'exact',head:true}).eq('recipient_id',me).is('read_at',null);
    if(error)throw error;
    return jsonResponse(request,{unread:count||0});
   }
   if(view==='directory'){
    const search=(params.get('q')||'').trim().slice(0,64);
    let query=db.from('drivers').select(publicFields).eq('is_profile_public',true).neq('id',me).order('display_name').limit(40);
    if(search)query=query.ilike('display_name','%'+search.replace(/[%,()_]/g,'')+'%');
    const {data,error}=await query;if(error)throw error;
    return jsonResponse(request,{drivers:data||[]});
   }
   if(view==='thread'){
    const peer=params.get('peer');if(!uuid(peer))return jsonResponse(request,{error:'invalid_peer'},400);
    const {data:messages,error}=await db.from('driver_messages').select('id,sender_id,recipient_id,body,created_at,read_at')
     .or(`and(sender_id.eq.${me},recipient_id.eq.${peer}),and(sender_id.eq.${peer},recipient_id.eq.${me})`)
     .order('created_at',{ascending:false}).limit(200);
    if(error)throw error;
    let driverQuery=db.from('drivers').select(publicFields).eq('id',peer);
    if(!messages?.length)driverQuery=driverQuery.eq('is_profile_public',true);
    const {data:driver,error:driverError}=await driverQuery.maybeSingle();if(driverError)throw driverError;
    if(!driver)return jsonResponse(request,{error:'recipient_unavailable'},404);
    const {data:blocked,error:blockError}=await db.from('driver_message_blocks').select('blocker_id').eq('blocker_id',me).eq('blocked_id',peer).maybeSingle();if(blockError)throw blockError;
    return jsonResponse(request,{peer:driver,messages:(messages||[]).reverse(),blocked:!!blocked});
   }
   if(view!=='inbox')return jsonResponse(request,{error:'invalid_view'},400);
   const {data:messages,error}=await db.from('driver_messages').select('id,sender_id,recipient_id,body,created_at,read_at')
    .or(`sender_id.eq.${me},recipient_id.eq.${me}`).order('created_at',{ascending:false}).limit(500);
   if(error)throw error;
   const grouped=new Map<string,{peer_id:string;last_message:string;created_at:string;unread:number}>();
   for(const message of messages||[]){
    const peer=message.sender_id===me?message.recipient_id:message.sender_id;
    let entry=grouped.get(peer);
    if(!entry){entry={peer_id:peer,last_message:message.body,created_at:message.created_at,unread:0};grouped.set(peer,entry)}
    if(message.recipient_id===me&&!message.read_at)entry.unread++;
   }
   const ids=[...grouped.keys()];
   const {data:drivers,error:driverError}=ids.length?await db.from('drivers').select(publicFields).in('id',ids):{data:[],error:null};
   if(driverError)throw driverError;
   const names=new Map((drivers||[]).map(driver=>[driver.id,driver]));
   return jsonResponse(request,{conversations:[...grouped.values()].map(entry=>({...entry,driver:names.get(entry.peer_id)||null})),unread:[...grouped.values()].reduce((sum,entry)=>sum+entry.unread,0)});
  }
  const raw=await request.text();if(raw.length>4096)return jsonResponse(request,{error:'payload_too_large'},413);
  let input:Record<string,unknown>;try{input=JSON.parse(raw)}catch{return jsonResponse(request,{error:'invalid_request'},400)}
  const action=input.action;
  const peer=input.peerId;
  if(!uuid(peer)||peer===me)return jsonResponse(request,{error:'invalid_peer'},400);
  if(action==='send'){
   const content=typeof input.body==='string'?input.body.trim():'';
   if(!content||content.length>2000)return jsonResponse(request,{error:'invalid_message'},400);
   const {data:recipient,error:recipientError}=await db.from('drivers').select('id').eq('id',peer).eq('is_profile_public',true).maybeSingle();if(recipientError)throw recipientError;
   if(!recipient)return jsonResponse(request,{error:'recipient_unavailable'},404);
   const {data:blocks,error:blockError}=await db.from('driver_message_blocks').select('blocker_id').or(`and(blocker_id.eq.${me},blocked_id.eq.${peer}),and(blocker_id.eq.${peer},blocked_id.eq.${me})`).limit(1);if(blockError)throw blockError;
   if(blocks?.length)return jsonResponse(request,{error:'conversation_blocked'},403);
   const minute=new Date(Date.now()-60000).toISOString(),day=new Date(Date.now()-86400000).toISOString();
   const [{count:recent,error:recentError},{count:daily,error:dailyError}]=await Promise.all([
    db.from('driver_messages').select('id',{count:'exact',head:true}).eq('sender_id',me).gte('created_at',minute),
    db.from('driver_messages').select('id',{count:'exact',head:true}).eq('sender_id',me).gte('created_at',day)
   ]);
   if(recentError||dailyError)throw recentError||dailyError;
   if((recent||0)>=5||(daily||0)>=100)return jsonResponse(request,{error:'rate_limited'},429);
   const {data:message,error}=await db.from('driver_messages').insert({sender_id:me,recipient_id:peer,body:content}).select('id,sender_id,recipient_id,body,created_at,read_at').single();if(error)throw error;
   return jsonResponse(request,{message},201);
  }
  if(action==='read'){
   const {error}=await db.from('driver_messages').update({read_at:new Date().toISOString()}).eq('sender_id',peer).eq('recipient_id',me).is('read_at',null);if(error)throw error;
   return jsonResponse(request,{ok:true});
  }
  if(action==='block'){
   const {error}=await db.from('driver_message_blocks').upsert({blocker_id:me,blocked_id:peer},{onConflict:'blocker_id,blocked_id'});if(error)throw error;
   return jsonResponse(request,{blocked:true});
  }
  if(action==='unblock'){
   const {error}=await db.from('driver_message_blocks').delete().eq('blocker_id',me).eq('blocked_id',peer);if(error)throw error;
   return jsonResponse(request,{blocked:false});
  }
  return jsonResponse(request,{error:'invalid_action'},400);
 } catch(error) {
  if(error instanceof Error&&error.message==='ORIGIN_NOT_ALLOWED')return jsonResponse(request,{error:'origin_not_allowed'},403);
  console.error('Driver messages unavailable',error instanceof Error?error.message:'unknown');
  return jsonResponse(request,{error:'messages_unavailable'},503);
 }
});
