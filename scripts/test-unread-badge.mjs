import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
let handler,verified=true;const calls=[];
const db={from(table){const row={table},chain={};calls.push(row);chain.select=(fields,options)=>{row.fields=fields;row.options=options;return chain;};chain.eq=(key,value)=>{row[key]=value;return chain;};chain.is=(key,value)=>{row[key]=value;return chain;};chain.gt=()=>chain;chain.maybeSingle=()=>chain;chain.then=(resolve,reject)=>Promise.resolve({data:table==='auth_sessions'?(verified?{driver_id:'verified-owner'}:null):null,count:7,error:null}).then(resolve,reject);return chain;}};
const source=stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/driver-messages/index.ts',import.meta.url),'utf8').replace(/^import .*;$/gm,''));
new Function('Deno','adminClient','assertAllowedOrigin','bearerToken','corsHeaders','hmacHex','jsonResponse',source)({serve:fn=>{handler=fn;}},()=>db,()=>{},()=> 'token',()=>({}),async()=> 'hash',(_req,data,status=200)=>Response.json(data,{status}));
test('header receives only an authenticated unread count, never message bodies',async()=>{
 const response=await handler(new Request('https://edge.test/?view=unread&driver_id=victim'));assert.equal(response.status,200);assert.deepEqual(await response.json(),{unread:7});assert.equal(calls.length,2);assert.equal(calls[1].recipient_id,'verified-owner');assert.deepEqual(calls[1].options,{count:'exact',head:true});assert.equal(calls[1].fields,'id');assert.equal(calls[1].read_at,null);
 verified=false;calls.length=0;assert.equal((await handler(new Request('https://edge.test/?view=unread'))).status,401);assert.equal(calls.length,1);
});
