import {test} from 'node:test';import assert from 'node:assert/strict';
import {raceParticipants} from '../supabase/functions/public-event/participants.mjs';
function db(error=null){return {from(table){const data={atx_race_entries:[{id:'entry',race_number:21,car_model_id:35}],atx_entry_members:[{entry_id:'entry',driver_id:'public',driver:{display_name:'Pilot'}},{entry_id:'entry',driver_id:'private',driver:{display_name:'Hidden'}}],atx_acc_cars:[{car_model_id:35,name:'Car',artwork_file:'car.webp'}]}[table];return {select(){return this},eq(){return this},order(){return this},then(resolve){return Promise.resolve({data,error}).then(resolve)}}}}}
test('public ATX Series grid contains car, number and public nickname but protects private profiles',async()=>{
 const rows=await raceParticipants(db(),{id:'race',competition_code:'ATXS'},new Set(['public']));
 assert.deepEqual(rows,[{race_number:21,car_model_name:'Car',artwork_file:'car.webp',drivers:[{profile_id:'public',display_name:'Pilot'},{profile_id:null,display_name:null}]}]);
});
test('SimGrid races have no native list and database errors cannot masquerade as empty grids',async()=>{
 assert.deepEqual(await raceParticipants(db(),{competition_code:'ATXS',simgrid_url:'https://simgrid.com'},new Set()),[]);
 await assert.rejects(raceParticipants(db('error'),{id:'race',competition_code:'ATXS'},new Set()),/participants_unavailable/);
});
