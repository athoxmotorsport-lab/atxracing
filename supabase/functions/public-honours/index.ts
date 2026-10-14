import { adminClient } from "../_shared/auth.ts";
const origin="https://athoxmotorsport-lab.github.io";
const headers={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"GET, OPTIONS","Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age=60","Vary":"Origin"};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
Deno.serve(async(request)=>{
 if(request.method==="OPTIONS")return new Response(null,{headers});
 if(request.method!=="GET")return json({error:"method_not_allowed"},405);
 try{
  const db=adminClient();
  const {data:honours,error}=await db.from("event_honours").select("event_id,driver_id,award_type,best_lap_ms,clean_laps,penalty_count");
  if(error)throw error;
  const eventIds=[...new Set((honours||[]).map(x=>x.event_id))];
  const driverIds=[...new Set((honours||[]).map(x=>x.driver_id))];
  if(!eventIds.length)return json({honours:[]});
  const [eventResult,driverResult]=await Promise.all([
   db.from("events").select("id,slug,title_fr,title_en,starts_at,is_public,status,deleted_at,result_publication_state").in("id",eventIds),
   db.from("drivers").select("id,display_name,avatar_url,is_profile_public,profile_slug").in("id",driverIds)
  ]);
  if(eventResult.error||driverResult.error)throw(eventResult.error||driverResult.error);
  const events=new Map((eventResult.data||[]).filter(e=>e.is_public&&e.status!=="draft"&&e.status!=="cancelled"&&!e.deleted_at&&e.result_publication_state==="official").map(e=>[e.id,e]));
  const drivers=new Map((driverResult.data||[]).filter(d=>d.is_profile_public).map(d=>[d.id,d]));
  const safe=(honours||[]).filter(x=>["fast_driver","gentleman_driver"].includes(x.award_type)&&events.has(x.event_id)&&drivers.has(x.driver_id)).map(x=>{
   const event=events.get(x.event_id)!,driver=drivers.get(x.driver_id)!;
   return{type:x.award_type,driver_id:x.driver_id,driver:driver.display_name,avatar:driver.avatar_url,profile_slug:driver.profile_slug,slug:event.slug,event_fr:event.title_fr,event_en:event.title_en,date:event.starts_at,best_lap_ms:x.best_lap_ms,clean_laps:x.clean_laps,penalty_count:x.penalty_count};
  }).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  // Sporting achievement cards are derived only from official published results.
  const {data:officialEvents,error:officialError}=await db.from("events").select("id,slug,title_fr,title_en,starts_at,championship_code,is_public,status,deleted_at,result_publication_state")
    .eq("is_public",true).eq("result_publication_state","official").is("deleted_at",null).neq("status","draft").neq("status","cancelled").order("starts_at",{ascending:true});
  if(officialError)throw officialError;
  const eligible=(officialEvents||[]).filter(e=>e.slug&&Date.parse(e.starts_at)<=Date.now());
  const achievements: Array<Record<string,unknown>>=[];
  if(eligible.length){
    const {data:placements,error:placementsError}=await db.from("results").select("event_id,driver_id,finish_position,status")
      .in("event_id",eligible.map(e=>e.id)).in("finish_position",[1,2,3]).eq("status","classified");
    if(placementsError)throw placementsError;
    const eventMap=new Map(eligible.map(e=>[e.id,e]));
    const placedDrivers=[...new Set((placements||[]).map(r=>r.driver_id))];
    const {data:placedProfiles,error:profilesError}=placedDrivers.length?await db.from("drivers").select("id,display_name,avatar_url,profile_slug,is_profile_public").in("id",placedDrivers):{data:[],error:null};
    if(profilesError)throw profilesError;
    const profiles=new Map((placedProfiles||[]).filter(d=>d.is_profile_public).map(d=>[d.id,d]));
    const wins=new Set<string>();
    for(const row of [...(placements||[])].sort((a,b)=>Date.parse(eventMap.get(a.event_id)?.starts_at||"")-Date.parse(eventMap.get(b.event_id)?.starts_at||""))){
      const event=eventMap.get(row.event_id),driver=profiles.get(row.driver_id);
      if(!event||!driver)continue;
      let type:string|null=null;
      if(row.finish_position===1&&!wins.has(row.driver_id)){type="first_victory";wins.add(row.driver_id);}
      if(row.finish_position===1&&event.championship_code==="WGT_ENDURANCE")type="endurance_winner";
      if(!type&&row.finish_position===2)type="podium_p2";
      if(!type&&row.finish_position===3)type="podium_p3";
      if(!type)continue;
      achievements.push({type,driver_id:driver.id,driver:driver.display_name,avatar:driver.avatar_url,profile_slug:driver.profile_slug,slug:event.slug,event_fr:event.title_fr,event_en:event.title_en,date:event.starts_at,position:row.finish_position});
    }
  }
  return json({honours:safe,achievements});

 }catch(error){console.error("public-honours error",error instanceof Error?error.message:"unknown");return json({error:"unavailable"},503)}
});
