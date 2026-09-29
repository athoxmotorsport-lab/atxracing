import {test} from 'node:test';
import assert from 'node:assert/strict';
let handler;
globalThis.Deno={env:{get:name=>({SESSION_SECRET:'unit-test-secret',ATX_SITE_URL:'https://example.test',SUPABASE_URL:'https://database.test',SUPABASE_SERVICE_ROLE_KEY:'unit-test-service-key'})[name]},serve:fn=>{handler=fn;}};
await import('../supabase/functions/driver-profile/index.ts');
const token='a'.repeat(43),headers={Origin:'https://example.test',Authorization:'Bearer '+token,'Content-Type':'application/json'};
const payload={nickname:'Pilot',displayName:'Public Pilot',teamName:'',carNumber:'',preferredGt3:'',gamesPlayed:['acc'],gamesToDiscover:['ace'],driver_id:'attacker-chosen-id'};
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
 assert.equal(response.status,200);assert.equal(sent.p_driver_id,'verified-owner');assert.equal('driver_id' in sent.p_profile,false);
});
test('GET merges private preferences only for the session owner',async()=>{
 globalThis.fetch=async url=>url.includes('auth_sessions?')?Response.json([{driver_id:'verified-owner'}]):Response.json([{id:'verified-owner',driver_profile_preferences:{nickname:'Private nickname'}}]);
 const response=await handler(new Request('https://edge.test',{headers}));assert.deepEqual(await response.json(),{driver:{id:'verified-owner',nickname:'Private nickname'}});
});
test('invalid input never reaches the write RPC',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return Response.json([{driver_id:'verified-owner'}]);};
 const response=await handler(new Request('https://edge.test',{method:'POST',headers,body:JSON.stringify({...payload,gamesPlayed:['unknown']})}));assert.equal(response.status,400);assert.equal(calls,1);
});
test('database failure is explicit and does not report a successful save',async()=>{
 globalThis.fetch=async()=>new Response('error',{status:500});assert.equal((await handler(new Request('https://edge.test',{headers}))).status,503);
 globalThis.fetch=originalFetch;
});
