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
  return json({honours:safe});
 }catch(error){console.error("public-honours error",error instanceof Error?error.message:"unknown");return json({error:"unavailable"},503)}
});
