const fs=require('node:fs'),assert=require('node:assert/strict');
const {stripTypeScriptTypes}=require('node:module');
const source=fs.readFileSync('supabase/functions/auth-session/index.ts','utf8');
const code=stripTypeScriptTypes(source.slice(source.indexOf('const readSession ='),source.indexOf('Deno.serve')));
let expired=false,heavy=0;const tables=[];
const supabase={from(table){tables.push(table);return {select(){return this},eq(){return this},is(){return this},gt(){return this},update(){return this},async maybeSingle(){return {data:expired?null:{id:'session',driver_id:'driver',expires_at:'2030-01-01'}}},async single(){return {data:{id:'driver',display_name:'Alex',avatar_url:null,driver_profile_preferences:[{profile_confirmed_at:'2026-10-01'}]}}}}}};
const read=new Function('bearerToken','adminClient','hmacHex','jsonResponse','publicDriver',code+';return readSession')(
 request=>request.headers.get('Authorization'),()=>supabase,async()=> 'hash',(_,data,status=200)=>new Response(JSON.stringify(data),{status}),async()=>{heavy++;return {id:'driver',results:[]}}
);
(async()=>{
 const request=()=>new Request('https://example.test/?view=identity',{headers:{Authorization:'Bearer test'}});
 const data=await (await read(request())).json();assert.equal(data.driver.profile_confirmed_at,'2026-10-01');assert.equal(heavy,0);assert.equal(data.driver.results,undefined);
 assert.deepEqual(tables,['auth_sessions','auth_sessions','drivers']);
 expired=true;assert.equal((await read(request())).status,401);assert.equal(heavy,0,'expired session cannot read a driver');
 expired=false;await read(new Request('https://example.test/',{headers:{Authorization:'Bearer test'}}));assert.equal(heavy,1,'full profiles keep their history');
 console.log('PASS: lightweight confirmed identity, no history queries, expired session rejected, full profile preserved');
})().catch(error=>{console.error(error);process.exitCode=1});
