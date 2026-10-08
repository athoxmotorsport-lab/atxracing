export function competitiveRace(event){
 const text=[event?.title_fr,event?.title_en,event?.server_name].join(' ');
 if(/open[ _-]*lobby|hotlap|entra[iî]nement|practice|discord/i.test(text))return false;
 return ['DR','WGT','ATXS'].includes(event?.competition_code)||['daily_race','sprint','endurance','championship'].includes(event?.event_type);
}
export function officialRace(event){return competitiveRace(event)&&event?.result_publication_state==='official'&&event?.is_public!==false&&event?.status!=='draft'&&event?.status!=='cancelled';}
