import {test} from 'node:test';
import assert from 'node:assert/strict';
import {worldGTChampionship,worldGTPoints,worldGTPositionPoints} from '../supabase/functions/_shared/worldgt-scoring.ts';

test('three championship identities are independent of format and retain the short Collector code',()=>{
 assert.equal(worldGTChampionship({competition_code:'WGT',format_code:'WGT_SPRINT'}),'WGT_SPRINT');
 assert.equal(worldGTChampionship({server_name:'ATXRACING | WGT | 1000 km',event_type:'endurance'}),'WGT_ENDURANCE');
 assert.equal(worldGTChampionship({title_fr:'WGT: AMERICAN DREAM MANCHE 1',event_type:'championship'}),'WGT_AMERICAN_DREAM');
 assert.equal(worldGTChampionship({competition_code:'WGT',format_code:'WGT_ENDURANCE',championship_code:'WGT_AMERICAN_DREAM',title_fr:'New title'}),'WGT_AMERICAN_DREAM');
 assert.equal(worldGTChampionship({competition_code:'DR',title_fr:'Sprint test'}),null);
 assert.equal(worldGTChampionship({competition_code:'ATXS',title_fr:'American Dream'}),null);
 assert.equal(worldGTChampionship({competition_code:'WGT',title_fr:'Unidentified race'}),null);
});
test('Sprint and American Dream award the 25-point table; Endurance keeps the 50-point table',()=>{
 for(const c of ['WGT_SPRINT','WGT_AMERICAN_DREAM'])assert.deepEqual(Array.from({length:11},(_,i)=>worldGTPositionPoints(c,i+1)),[25,18,15,12,10,8,6,4,2,1,0]);
 assert.deepEqual(Array.from({length:11},(_,i)=>worldGTPositionPoints('WGT_ENDURANCE',i+1)),[50,36,30,24,20,16,12,8,4,2,0]);
});
test('same crew earns one score per event and each participating driver receives it, without mixing championships',()=>{
 const championships=new Map([['s','WGT_SPRINT'],['e','WGT_ENDURANCE'],['a','WGT_AMERICAN_DREAM']]);
 const results=[],registrations=[];
 for(const event_id of championships.keys())for(const driver_id of ['p1','p2']){
  results.push({event_id,driver_id,status:'classified',finish_position:1,best_lap_ms:90000});
  registrations.push({event_id,driver_id,team_name:'ATX Team 1'});
 }
 results.push({event_id:'s',driver_id:'unmapped',status:'classified',finish_position:2,best_lap_ms:89000});
 const score=worldGTPoints(results,registrations,championships);
 assert.equal(score.entries.length,3);
 assert.deepEqual(score.entries.map(e=>[e.event_id,e.points]),[['s',25],['e',52],['a',27]]);
 for(const entry of score.entries){assert.equal(entry.driver_ids.length,2);for(const id of entry.driver_ids)assert.equal(score.driverPoints.get(entry.event_id+'|'+id).points,entry.points);}
 assert.equal(score.driverPoints.has('s|unmapped'),false);
 const disqualified=worldGTPoints([{event_id:'s',driver_id:'p1',status:'dsq',finish_position:1,best_lap_ms:80000}],registrations,championships);assert.equal(disqualified.entries.length,0);
});

test('leaderboard API and its cache keep all three championships separate for pilots and racing teams',async()=>{
 const {readFileSync}=await import('node:fs');const {stripTypeScriptTypes}=await import('node:module');
 const source=readFileSync('supabase/functions/public-leaderboard/index.ts','utf8').replace(/^import .*\n/gm,'');
 const events=['WGT_SPRINT','WGT_ENDURANCE','WGT_AMERICAN_DREAM'].map(championship_code=>({id:championship_code,championship_code,competition_code:'WGT',format_code:'WGT_ENDURANCE',status:'completed',is_public:true,result_publication_state:'official',starts_at:'2026-10-01T18:00:00Z',title_fr:'WGT test'}));
 const drivers=['p1','p2'].map(id=>({id,display_name:id,team_name:'ATX',is_profile_public:true}));
 const results=events.flatMap(event=>drivers.map(d=>({event_id:event.id,driver:{display_name:d.id},driver_id:d.id,event,status:'classified',finish_position:1,best_lap_ms:90000,points:999,created_at:'2026-10-01T20:00:00Z'})));
 const registrations=events.flatMap(e=>drivers.map(d=>({event_id:e.id,driver_id:d.id,team_name:'ATX Team 1'})));
 const db={from(table){let ids;const query=new Proxy({}, {get(_,method){if(method==='then')return(resolve,reject)=>Promise.resolve({data:table==='events'?events:table==='drivers'?drivers:table==='results'?results:table==='registrations'?registrations.filter(r=>!ids||ids.includes(r.event_id)):[],error:null}).then(resolve,reject);return(...args)=>{if(method==='in'&&table==='registrations')ids=args[1];return query;};}});return query;}};
 let handler;new Function('Deno','adminClient','worldGTPoints','worldGTChampionship',stripTypeScriptTypes(source,{mode:'strip'}))({serve:fn=>handler=fn},()=>db,worldGTPoints,worldGTChampionship);
 for(const [category,points] of [['WGT_SPRINT',27],['WGT_ENDURANCE',52],['WGT_AMERICAN_DREAM',27]]){
  const response=await handler(new Request('https://edge.test/?category='+category));assert.equal(response.status,200);const body=await response.json();assert.equal(body.category,category);assert.equal(body.teams.length,1);assert.equal(body.teams[0].points,points);assert.equal(body.teams[0].races,1);assert.equal(body.drivers.length,2);for(const d of body.drivers){assert.equal(d.points,points);assert.equal(d.races,1);}
 }
 const legacy=await(await handler(new Request('https://edge.test/?category=WGT'))).json();assert.equal(legacy.category,'WGT_SPRINT');assert.equal(legacy.teams[0].points,27);
 const gtSource=readFileSync('supabase/functions/public-gtworld/index.ts','utf8').replace(/^import .*\n/gm,'');
 let gtHandler;new Function('Deno','adminClient','worldGTPoints','worldGTChampionship','worldGTPositionPoints',stripTypeScriptTypes(gtSource,{mode:'strip'}))({serve:fn=>gtHandler=fn},()=>db,worldGTPoints,worldGTChampionship,worldGTPositionPoints);
 for(const [category,points,counter] of [['WGT_SPRINT',27,'sprint'],['WGT_ENDURANCE',52,'endurance'],['WGT_AMERICAN_DREAM',27,'american_dream']]){const response=await gtHandler(new Request('https://edge.test/?category='+category));assert.equal(response.status,200);const body=await response.json();assert.equal(body.category,category);assert.equal(body.events.length,1);assert.equal(body.standings[0].points,points);assert.equal(body.standings[0][counter],1);for(const other of ['sprint','endurance','american_dream'].filter(c=>c!==counter))assert.equal(body.standings[0][other],0);}

});
