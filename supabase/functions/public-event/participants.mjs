// Public grid: never expose Steam IDs, ACC legal names or crew invitation codes.
export async function raceParticipants(db,event,publicDriverIds){
 if(event.competition_code!=='ATXS'||event.simgrid_url)return [];
 const entries=await db.from('atx_race_entries').select('id,race_number,car_model_id').eq('event_id',event.id).order('race_number');
 if(entries.error)throw Error('participants_unavailable');
 if(!entries.data?.length)return [];
 const [members,cars]=await Promise.all([
  db.from('atx_entry_members').select('entry_id,driver_id,driver:drivers(display_name)').eq('event_id',event.id),
  db.from('atx_acc_cars').select('car_model_id,name,artwork_file')
 ]);
 if(members.error||cars.error)throw Error('participants_unavailable');
 return entries.data.map(entry=>{
  const car=cars.data?.find(car=>car.car_model_id===entry.car_model_id);
  return {race_number:entry.race_number,car_model_name:car?.name??null,artwork_file:car?.artwork_file??null,
   drivers:(members.data??[]).filter(member=>member.entry_id===entry.id).map(member=>{
    const visible=publicDriverIds.has(member.driver_id),driver=Array.isArray(member.driver)?member.driver[0]:member.driver;
    return {profile_id:visible?member.driver_id:null,display_name:visible?driver?.display_name:null};
   })};
 });
}
