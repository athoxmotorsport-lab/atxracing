import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {entryList,entryCSV} from '../supabase/functions/race-registration/export.mjs';
const entries=[{id:'car',race_number:37,car_model_id:36,team_name:'Test crew'}];
const members=[{entry_id:'car',driver_id:'a',first_name:'Test',last_name:'Driver',short_name:'TST'}];
const identities=[{driver_id:'a',steam_id64:'70000000000000001',last_login_at:'2026-10-07'}];
test('ACC export matches solo and team entrylist structure and verified Steam IDs',()=>{
 const solo=entryList(entries,members,identities);assert.equal(solo.forceEntryList,1);assert.equal(solo.entries[0].drivers[0].playerID,'S70000000000000001');assert.equal(solo.entries[0].forcedCarModel,36);assert.equal(solo.entries[0].isServerAdmin,0);
 const team=entryList(entries,[...members,{...members[0],driver_id:'b'}],[...identities,{...identities[0],driver_id:'b',steam_id64:'70000000000000002'}]);assert.equal(team.entries.length,1);assert.equal(team.entries[0].drivers.length,2);
 assert.throws(()=>entryList(entries,members,[{...identities[0],last_login_at:null}]),/unverified_driver/);
 assert.throws(()=>entryList(entries,[],identities),/empty_crew/);
});
test('CSV preserves driver rows and escapes quotes and spreadsheet formulas',()=>{
 const list=entryList([{...entries[0],team_name:'=SUM(1,2)'}],[{...members[0],first_name:'Test "quoted"'}],identities);const csv=entryCSV(list);
 assert.ok(csv.startsWith('\ufeff'));assert.ok(csv.includes('"\'=SUM(1,2)"'));assert.ok(csv.includes('Test ""quoted""'));assert.equal(csv.split('\r\n').length,3);
});

test('exports preserve solo and Monza crew structures from the supplied examples',()=>{
 const shapes=JSON.parse(readFileSync(new URL('fixtures/acc-entrylist-example-shapes.json',import.meta.url),'utf8'));
 for(const shape of Object.values(shapes)){
  let index=0;const entries=[],members=[],identities=[];
  for(const count of shape.crewSizes){const entry={id:'car-'+count,race_number:count,car_model_id:34,team_name:'Synthetic crew'};entries.push(entry);for(let i=0;i<count;i++){index++;const id='driver-'+index;members.push({entry_id:entry.id,driver_id:id,first_name:'Test',last_name:'Driver',short_name:'TST'});identities.push({driver_id:id,steam_id64:String(70000000000000000n+BigInt(index)),last_login_at:'2026-10-08'});}}
  const exported=entryList(entries,members,identities);assert.equal(exported.entries.length,shape.crewSizes.length);assert.deepEqual(exported.entries.map(e=>e.drivers.length),shape.crewSizes);for(const entry of exported.entries){assert(shape.entryKeys.every(key=>key in entry));assert(entry.drivers.every(driver=>shape.driverKeys.every(key=>key in driver)));}
 }
});
