import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attributeCrewPenalties,expandCrews,simgridTeams} from '../supabase/functions/ingest-acc-results/crews.mjs';
const a={playerId:'S76561198000000001',firstName:'First',lastName:'Driver'},b={playerId:'S76561198000000002',firstName:'Second',lastName:'Driver'},reserve={playerId:'S76561198000000003'};
const result={numeroVoiture:69,position:1,meilleurTourMs:100000,pilote:{steamId:b.playerId}};
const raw={sessionResult:{leaderBoardLines:[{car:{raceNumber:69,drivers:[a,b,reserve],teamName:''},currentDriver:b,driverTotalTimes:[123,456,0]}]}};
test('all drivers who drove receive the crew result, unused reserve does not',()=>{
 const rows=expandCrews([result],raw,new Map([[69,'RST-FR- - RST-DZT']]));
 assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.pilote.steamId),[a.playerId.slice(1),b.playerId.slice(1)]);
 for(const row of rows){assert.equal(row.position,1);assert.equal(row.teamName,'RST-FR- - RST-DZT');}
});
test('raw crew name takes precedence and empty names use a distinct car identity',()=>{
 const withName=structuredClone(raw);withName.sessionResult.leaderBoardLines[0].car.teamName='Actual team';
 assert.equal(expandCrews([result],withName,new Map([[69,'Other']]))[0].teamName,'Actual team');
 assert.match(expandCrews([result],raw)[0].teamName,/^#69 · First Driver \/ Second Driver$/);
 assert.throws(()=>expandCrews([{...result,numeroVoiture:99}],raw),/ambiguous/);
});
test('public SimGrid race results and entry rows supply car-scoped crew names',()=>{
 const html='<tr><td><a title="Crew" href="/teams/1/grid_feed">RST-FR- &amp; DZT</a><span class="car-number">69</span></td></tr><tr><td><a href="/teams/2/grid_feed">ATX team 1</a><span class="badge bg-yellow text-gray-800">#37</span></td></tr>';
 assert.deepEqual([...simgridTeams(html)],[[69,'RST-FR- & DZT'],[37,'ATX team 1']]);
});

test('an unused duplicate car cannot replace a driver who actually raced',()=>{
 const source=structuredClone(raw);source.sessionResult.leaderBoardLines.push({car:{raceNumber:224,drivers:[a],teamName:''},currentDriver:a,driverTotalTimes:[0]});
 source.laps=[{carId:1,driverIndex:0,laptime:108000,isValidForBest:true,splits:[36000,36000,36000]}];source.sessionResult.leaderBoardLines[0].car.carId=1;
 const rows=expandCrews([result,{...result,numeroVoiture:224,position:17,statut:'non_classe'}],source);
 assert.equal(rows.length,2);assert.equal(rows.find(r=>r.pilote.steamId===a.playerId.slice(1)).numeroVoiture,69);
 assert.equal(rows.find(r=>r.pilote.steamId===a.playerId.slice(1)).personalBestLapMs,108000);
 assert.equal(rows.find(r=>r.pilote.steamId===b.playerId.slice(1)).personalBestLapMs,null);
});

test('crew penalties use the driver active on the violating car lap',()=>{
 const source=structuredClone(raw);
 source.sessionResult.leaderBoardLines[0].car.carId=1008;
 source.laps=[
  ...Array.from({length:23},()=>({carId:1008,driverIndex:0})),
  ...Array.from({length:23},()=>({carId:1008,driverIndex:1})),
  {carId:1008,driverIndex:0},
 ];
 source.penalties=[
  {carId:1008,driverIndex:0,reason:'PitSpeeding',penalty:'StopAndGo_30',violationInLap:46,clearedInLap:47},
  {carId:1008,driverIndex:0,reason:'Cutting',penalty:'None',violationInLap:0,clearedInLap:168},
 ];
 const penalties=attributeCrewPenalties([
  {steamId:a.playerId,tourViolation:46},
  {steamId:a.playerId,tourViolation:0},
 ],source);
 assert.equal(penalties[0].steamId,b.playerId.slice(1));
 assert.equal(penalties[1].steamId,a.playerId);
});
