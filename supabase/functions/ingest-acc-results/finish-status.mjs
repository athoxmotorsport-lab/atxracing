/* ACC totalTime is the last completed crossing, not the time of disconnection.
   Finishers cross after the leader has completed the race, including lapped cars. */
export function raceStatuses(raw){
 if(raw?.sessionType!=='R')return new Map();
 const lines=raw?.sessionResult?.leaderBoardLines;
 if(!Array.isArray(lines)||!lines.length)return new Map();
 const maxLaps=Math.max(...lines.map(r=>Number(r.timing?.lapCount)||0));
 const ends=lines.filter(r=>Number(r.timing?.lapCount)===maxLaps).map(r=>Number(r.timing?.totalTime)).filter(t=>t>0&&Number.isFinite(t));
 if(!maxLaps)return new Map(lines.map(r=>[Number(r.car?.raceNumber),'dns']));
 if(!ends.length)throw Error('ACC race finish timestamp unavailable');
 const finish=Math.min(...ends);
 return new Map(lines.map(r=>[Number(r.car?.raceNumber),Number(r.timing?.lapCount)>0?(Number(r.timing?.totalTime)>=finish?'classified':'dnf'):'dns']));
}
export function resultStatus(value, inferred){
 const status=String(value??'').toLowerCase();
 if(['disqualifie','disqualifié','dsq'].includes(status))return 'dsq';
 if(['dns','non_classe','non_classé','non_partant'].includes(status))return 'dns';
 if(['dnf','abandon','abandonne','abandonné'].includes(status))return 'dnf';
 return inferred??'classified';
}
