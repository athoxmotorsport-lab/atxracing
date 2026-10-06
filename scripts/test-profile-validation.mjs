import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateProfile } from '../supabase/functions/driver-profile/validation.mjs';
const valid = {nickname:'Pilot',displayName:'Public Pilot',teamName:'',carNumber:'',preferredGt3:'',favoriteCircuits:[],preferredRaceFormat:'',gamesPlayed:[],gamesToDiscover:[]};
test('Bentley Continental GT3 2018 is a supported profile preference',()=>{
 assert.equal(validateProfile({...valid,preferredGt3:'Bentley Continental GT3 (2018)'}).preferred_gt3,'Bentley Continental GT3 (2018)');
});
test('a beginner can save without a team, a car, a number or game history',()=>{
 const result=validateProfile(valid);
 assert.equal(result.team_name,null);assert.equal(result.preferred_gt3,null);assert.deepEqual(result.games_played,[]);
});
test('identity, arbitrary columns and sporting scores cannot be supplied by the client',()=>{
 const result=validateProfile({...valid,driver_id:'other',is_profile_public:false,safety_score:100,performance_class:'alien'});
 for(const field of ['driver_id','is_profile_public','safety_score','performance_class'])assert.equal(field in result,false);
});
test('server rejects unsupported games, oversized names, empty identity and malformed numbers',()=>{
 for(const change of [{nickname:''},{displayName:' '.repeat(4)},{nickname:'x'.repeat(65)},{gamesPlayed:['other']},{gamesToDiscover:'acc'},{carNumber:'<1>'},{preferredGt3:'Invented GT3'},{favoriteCircuits:['spa','monza','imola','zolder']},{favoriteCircuits:['spa','spa']},{favoriteCircuits:['unknown']},{preferredRaceFormat:'24h'}])assert.throws(()=>validateProfile({...valid,...change}));
});
test('normalises names and games without changing the preferred GT3',()=>{
 const result=validateProfile({...valid,nickname:' Pilot  One ',gamesPlayed:['acc','acc'],preferredGt3:'Porsche 911 GT3 R'});
 assert.equal(result.nickname,'Pilot One');assert.deepEqual(result.games_played,['acc']);assert.equal(result.preferred_gt3,'Porsche 911 GT3 R');
});
test('stores one catalogue GT3, at most three known circuits and one race format',()=>{
 const result=validateProfile({...valid,preferredGt3:'Porsche 992 GT3 R',favoriteCircuits:['spa','monza','zolder'],preferredRaceFormat:'sprint_90'});
 assert.equal(result.preferred_gt3,'Porsche 992 GT3 R');assert.deepEqual(result.favorite_circuits,['spa','monza','zolder']);assert.equal(result.preferred_race_format,'sprint_90');
});
