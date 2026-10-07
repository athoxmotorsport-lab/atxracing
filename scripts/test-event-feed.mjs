import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eventFeed} from '../supabase/functions/public-event/feed.ts';
test('lightweight feed includes website races and filters notices without loading result archives',async()=>{
 const calls=[];
 const future={id:'race',slug:'atx-test',status:'registration_open',starts_at:'2099-01-01T00:00:00Z',image_url:'https://example.test/poster.webp',simgrid_url:null,site_registration_enabled:true,duration_minutes:45};
 const notices=[{id:'safe',event_id:'race',driver_id:'public'},{id:'private-race',event_id:'hidden'},{id:'private-driver',driver_id:'private'},{id:'general'}];
 const db={from(table){const state={table},chain={};calls.push(state);for(const method of ['eq','neq','order','limit','in'])chain[method]=()=>chain;chain.select=value=>{state.select=value;return chain;};chain.then=(resolve,reject)=>Promise.resolve({data:table==='events'?state.select==='id'?[{id:'race'}]:[future]:table==='notifications'?notices:table==='drivers'?[{id:'public'}]:[],error:null}).then(resolve,reject);return chain;}};
 const data=await eventFeed(db);assert.deepEqual(data.events.map(e=>e.slug),['atx-test']);assert.deepEqual(data.archives,[]);assert.deepEqual(data.notifications.map(n=>n.id),['safe','general']);assert.ok(data.notifications.every(n=>!('event_id' in n)));assert.ok(!calls.some(c=>c.table==='results'));assert.equal(calls.filter(c=>c.table==='drivers').length,1);
});
test('database failures are not turned into a cacheable empty calendar',async()=>{
 const db={from(){const chain={};for(const method of ['select','eq','neq','order','limit'])chain[method]=()=>chain;chain.then=(resolve,reject)=>Promise.resolve({data:[],error:Error('offline')}).then(resolve,reject);return chain;}};
 await assert.rejects(eventFeed(db),/feed_unavailable/);
});
