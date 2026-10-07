export function entryList(entries, members, identities) {
 const steam=new Map(identities.filter(x=>x.last_login_at&&/^[0-9]{17}$/.test(x.steam_id64)).map(x=>[x.driver_id,x.steam_id64]));
 return {entries:entries.map(entry=>{
  const crew=members.filter(x=>x.entry_id===entry.id);
  if(!crew.length)throw Error('empty_crew');
  return {drivers:crew.map(m=>{
   if(!steam.has(m.driver_id))throw Error('unverified_driver');
   return {firstName:m.first_name,lastName:m.last_name,shortName:m.short_name,driverCategory:0,nationality:0,playerID:'S'+steam.get(m.driver_id)};
  }),raceNumber:entry.race_number,forcedCarModel:entry.car_model_id,customCar:'',teamName:entry.team_name,
   overrideDriverInfo:1,defaultGridPosition:-1,ballastKg:0,restrictor:0,isServerAdmin:0};
 }),forceEntryList:1};
}
export function entryCSV(list){
 const quote=value=>'"'+String(value??'').replace(/^(?:\s*[=+@\-]|[\t\r\n])/ ,"'$&").replaceAll('"','""')+'"';
 const rows=[['raceNumber','forcedCarModel','teamName','firstName','lastName','shortName','driverCategory','nationality','playerID']];
 for(const entry of list.entries)for(const d of entry.drivers)rows.push([entry.raceNumber,entry.forcedCarModel,entry.teamName,d.firstName,d.lastName,d.shortName,d.driverCategory,d.nationality,d.playerID]);
 return '\ufeff'+rows.map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n';
}
