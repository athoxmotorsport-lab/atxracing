import {test} from 'node:test';import assert from 'node:assert/strict';
import {raceStatuses,resultStatus} from '../supabase/functions/ingest-acc-results/finish-status.mjs';
test('finishers must complete a crossing after the leader; fewer laps alone do not mean DNF',()=>{
 const raw={sessionType:'R',sessionResult:{leaderBoardLines:[[1,100,1000000],[2,98,1005000],[3,95,999000],[4,0,123]].map(([raceNumber,lapCount,totalTime])=>({car:{raceNumber},timing:{lapCount,totalTime}}))}};
 assert.deepEqual([...raceStatuses(raw)],[[1,'classified'],[2,'classified'],[3,'dnf'],[4,'dns']]);
 assert.equal(resultStatus('classe','dnf'),'dnf');assert.equal(resultStatus('dsq','classified'),'dsq');assert.equal(resultStatus('abandon','classified'),'dnf');
 assert.equal(raceStatuses({...raw,sessionType:'FP'}).size,0);
});

test('no completed laps means DNS and missing finish evidence cannot create classified results',()=>{
 assert.deepEqual([...raceStatuses({sessionType:'R',sessionResult:{leaderBoardLines:[{car:{raceNumber:1},timing:{lapCount:0,totalTime:0}}]}})],[[1,'dns']]);
 assert.throws(()=>raceStatuses({sessionType:'R',sessionResult:{leaderBoardLines:[{car:{raceNumber:1},timing:{lapCount:1,totalTime:0}}]}}),/finish timestamp/);
});
