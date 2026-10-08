import {nativeCounts} from '../supabase/functions/public-event/counts.ts';
import {competitiveRace} from '../supabase/functions/_shared/race-visibility.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
let handler;
const atxs={id:'series',slug:'atxs-test',starts_at:'2099-01-01T00:00:00Z',status:'registration_open',image_url:'https://example.test/poster.webp',simgrid_url:null,site_registration_enabled:true};
const rows=[atxs,{...atxs,id:'simgrid',slug:'daily-test',site_registration_enabled:false,simgrid_url:'https://www.thesimgrid.com/championships/1'},{...atxs,id:'closed-site',site_registration_enabled:false},{...atxs,id:'past',starts_at:'2025-01-01T00:00:00Z'},{...atxs,id:'cancelled',status:'cancelled'}];
const db={rpc:async()=>({data:[{event_id:'series',entries:2,reserved:1}],error:null}),from:table=>{const chain={};for(const name of ['select','eq','neq','order','limit','in','range'])chain[name]=()=>chain;chain.then=(resolve,reject)=>Promise.resolve({data:table==='events'?rows:[],error:null}).then(resolve,reject);return chain;}};
const source=stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/public-event/index.ts',import.meta.url),'utf8').replace(/^import .*;$/gm,''));
new Function('Deno','adminClient','worldGTPoints','nativeCounts','competitiveRace',source)({serve:fn=>{handler=fn;}},()=>db,()=>[],nativeCounts,competitiveRace);
test('calendar includes website-only ATX Series without requiring a SimGrid URL',async()=>{
 const response=await handler(new Request('https://edge.test/public-event'));assert.equal(response.status,200);const data=await response.json();assert.deepEqual(data.events.map(e=>e.slug),['atxs-test','daily-test']);assert.ok(data.events.every(e=>!('id' in e)));
});
