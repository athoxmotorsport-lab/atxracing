import {test} from 'node:test';
import assert from 'node:assert/strict';
let handler;
globalThis.Deno={env:{get:name=>({SESSION_SECRET:'unit-test-secret',ATX_SITE_URL:'https://example.test',SUPABASE_URL:'https://database.test',SUPABASE_SERVICE_ROLE_KEY:'unit-test-service-key'})[name]},serve:fn=>{handler=fn;}};
await import('../supabase/functions/driver-profile/index.ts');
const token='a'.repeat(43),headers={Origin:'https://example.test',Authorization:'Bearer '+token,'Content-Type':'application/json'};
const payload={accFirstName:'Test',accLastName:'Driver',accShortName:'tst',nickname:'Pilot',displayName:'Public Pilot',teamName:'',carNumber:'37',preferredGt3:'Porsche 992 GT3 R',favoriteCircuits:['spa','monza'],preferredRaceFormat:'sprint_60',gamesPlayed:['acc'],gamesToDiscover:['ace'],driver_id:'attacker-chosen-id'};
const originalFetch=globalThis.fetch;
test('custom authentication rejects missing, expired and revoked sessions before any profile query',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return Response.json([]);};
 assert.equal((await handler(new Request('https://edge.test'))).status,401);assert.equal(calls,0);
 assert.equal((await handler(new Request('https://edge.test',{headers}))).status,401);assert.equal(calls,1);
});
test('foreign origins cannot read or write even with a token',async()=>{
 globalThis.fetch=()=>{throw Error('must not reach the database');};
 assert.equal((await handler(new Request('https://edge.test',{headers:{...headers,Origin:'https://foreign.test'}}))).status,403);
});
test('POST targets the verified session owner and strips attacker-controlled columns',async()=>{
 let sent;
 globalThis.fetch=async(url,options)=>{
  if(url.includes('auth_sessions?')){assert(url.includes('revoked_at=is.null'));assert(url.includes('expires_at=gt.'));return Response.json([{driver_id:'verified-owner'}]);}
  assert(url.endsWith('/rpc/save_driver_profile'));sent=JSON.parse(options.body);return Response.json({id:'verified-owner',nickname:'Pilot'});
 };
 const response=await handler(new Request('https://edge.test',{method:'POST',headers,body:JSON.stringify(payload)}));
 assert.equal(response.status,200);assert.equal(sent.p_driver_id,'verified-owner');assert.equal('driver_id' in sent.p_profile,false);assert.deepEqual(sent.p_profile.favorite_circuits,['spa','monza']);
});
test('GET merges private preferences, Safe and official honours only for the session owner',async()=>{
 globalThis.fetch=async url=>{
  if(url.includes('auth_sessions?'))return Response.json([{driver_id:'verified-owner'}]);
  if(url.includes('/drivers?'))return Response.json([{id:'verified-owner',driver_profile_preferences:{nickname:'Private nickname',favorite_circuits:['spa']}}]);
  if(url.includes('/driver_roles?')){assert(url.includes('driver_id=eq.verified-owner'));return Response.json([{role:'admin'}]);}
  if(url.includes('/driver_ratings?'))return Response.json([{safety_class:'gold',safety_score:84}]);
  if(url.includes('/event_honours?'))return Response.json([{event_id:'visible',award_type:'fast_driver'},{event_id:'hidden',award_type:'gentleman_driver'}]);
  if(url.includes('/events?'))return Response.json([{id:'visible'}]);
  if(url.includes('/results?')){assert(url.includes('driver_id=eq.verified-owner'));return Response.json([{event_id:'visible',finish_position:2,status:'classified',points:18,event:{event_type:'daily_race',starts_at:'2026-10-07',result_publication_state:'official'}},{event_id:'lobby',finish_position:1,status:'classified',points:25,event:{title_fr:'Open Lobby'}}]);}
  throw Error('unexpected request');
 };
 const response=await handler(new Request('https://edge.test',{headers}));assert.deepEqual(await response.json(),{driver:{id:'verified-owner',nickname:'Private nickname',favorite_circuits:['spa'],roles:['admin'],stats:{races:1,wins:0,podiums:1,points:18},results:[{event_id:'visible',finish_position:2,status:'classified',points:18,event:{event_type:'daily_race',starts_at:'2026-10-07',result_publication_state:'official'}}],car_photo:null,rating:{safety_class:'gold',safety_score:84},awards:[{event_id:'visible',award_type:'fast_driver',finish_position:2,finish_status:'classified'}]}});
});
test('invalid input never reaches the write RPC',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return Response.json([{driver_id:'verified-owner'}]);};
 const response=await handler(new Request('https://edge.test',{method:'POST',headers,body:JSON.stringify({...payload,gamesPlayed:['unknown']})}));assert.equal(response.status,400);assert.equal(calls,1);
});
test('database failure is explicit and does not report a successful save',async()=>{
 globalThis.fetch=async()=>new Response('error',{status:500});assert.equal((await handler(new Request('https://edge.test',{headers}))).status,503);
 globalThis.fetch=originalFetch;
});
