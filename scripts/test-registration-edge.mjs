import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {entryList,entryCSV} from '../supabase/functions/race-registration/export.mjs';
let handler,admin=false,session=true,writes=[],queries=[];
const eventId='00000000-0000-4000-8000-000000000001';
function query(table){
 queries.push(table);const state={table};const chain={};for(const name of ['select','eq','is','gt','maybeSingle','single','order','limit','in'])chain[name]=()=>chain;
 for(const name of ['upsert','update'])chain[name]=body=>{writes.push({table,body});return chain;};
 chain.then=(resolve,reject)=>Promise.resolve({data:table==='auth_sessions'?session?{driver_id:'verified-actor'}:null:table==='driver_roles'?admin?{role:'admin'}:null:table==='events'?{id:eventId,is_public:true,site_registration_enabled:true,starts_at:'2099-01-01T00:00:00Z'}:[],count:0,error:null}).then(resolve,reject);
 return chain;
}
const db={from:query,rpc:(name,body)=>{writes.push({name,body});return Promise.resolve({data:{registered:true},error:null});}};
const source=stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/race-registration/index.ts',import.meta.url),'utf8').replace(/^import .*;$/gm,''));
new Function('Deno','adminClient','assertAllowedOrigin','bearerToken','hmacHex','jsonResponse','entryList','entryCSV',source)(
 {serve:fn=>{handler=fn;}},()=>db,req=>{if(req.headers.get('Origin')==='https://bad.test')throw Error('ORIGIN_NOT_ALLOWED');},req=>req.headers.get('Authorization')?.slice(7)||null,async()=> 'hashed-token',(_req,data,status=200)=>Response.json(data,{status}),entryList,entryCSV);
const request=(path='',body,authenticated=true)=>new Request('https://edge.test/'+path,{method:body?'POST':'GET',headers:authenticated?{Authorization:'Bearer test-token','Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
test('invalid sessions and origins cannot reach registration data',async()=>{
 queries=[];writes=[];assert.equal((await handler(request('',null,false))).status,401);assert.deepEqual(queries,[]);
 session=false;assert.equal((await handler(request('?event='+eventId))).status,401);assert.deepEqual(queries,['auth_sessions']);session=true;
 const bad=request('?event='+eventId);bad.headers.set('Origin','https://bad.test');queries=[];assert.equal((await handler(bad)).status,403);assert.deepEqual(queries,[]);
});
test('only administrators can export Steam IDs or manage cars and registration',async()=>{
 admin=false;queries=[];writes=[];assert.equal((await handler(request('?event='+eventId+'&export=json'))).status,403);assert.ok(!queries.includes('driver_identities'));
 assert.equal((await handler(request('',{action:'save_car',carModelId:36,name:'Test car'}))).status,403);assert.deepEqual(writes,[]);
 assert.equal((await handler(request('',{action:'enable',eventId,enabled:true}))).status,403);assert.deepEqual(writes,[]);
});
test('registration always uses the verified session actor, ignoring submitted driver IDs',async()=>{
 writes=[];const response=await handler(request('',{action:'register',eventId,firstName:'Test',lastName:'Driver',shortName:'TST',raceNumber:37,carModelId:36,teamName:'',driverId:'victim',p_actor:'victim',steamId:'70000000000000001'}));assert.equal(response.status,200);
 assert.equal(writes[0].name,'atx_register_entry');assert.equal(writes[0].body.p_actor,'verified-actor');
});
