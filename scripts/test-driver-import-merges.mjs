import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=readFileSync(new URL('../supabase/functions/ingest-acc-results/index.ts',import.meta.url),'utf8');
const resolver=source.slice(source.indexOf('const resolveDriver ='),source.indexOf('const resolveEvent ='));
function setup(merge,error=null){
 const accessed=[];
 const client={from(table){accessed.push(table);return {select(){return this},eq(){return this},async maybeSingle(){return table==='driver_identities'?{data:{driver_id:'source'}}:{data:merge,error}},async single(){return {data:{display_name:'Existing pilot'}}}}}};
 return {accessed,resolve:new Function('adminClient',stripTypeScriptTypes(resolver)+'; return resolveDriver;')(()=>client)};
}
test('merged Collector identity resolves to canonical sporting profile without modifying login or name',async()=>{
 const {resolve,accessed}=setup({target_driver_id:'target'});
 assert.equal(await resolve('steam-id','Imported name'),'target');
 assert.deepEqual(accessed,['driver_identities','driver_import_merges']);
});
test('unmerged identities keep their own profile and mapping failures stop imports',async()=>{
 const regular=setup(null);assert.equal(await regular.resolve('steam-id','name'),'source');
 const failed=setup(null,new Error('lookup unavailable'));
 await assert.rejects(failed.resolve('steam-id','name'),/lookup unavailable/);
});
