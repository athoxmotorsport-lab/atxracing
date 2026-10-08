import { adminClient } from "../_shared/auth.ts";
const headers={"Access-Control-Allow-Origin":"https://athoxmotorsport-lab.github.io","Access-Control-Allow-Methods":"GET, OPTIONS","Content-Type":"application/json; charset=utf-8","Vary":"Origin"};
Deno.serve(async request=>{
 if(request.method==="OPTIONS")return new Response(null,{headers});
 if(request.method!=="GET")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
 try{
  // One identity per driver; imported identities without a verified Steam login are excluded.
  const {count,error}=await adminClient().from("driver_identities").select("driver_id",{count:"exact",head:true}).not("last_login_at","is",null);
  if(error||count===null)throw new Error("count_unavailable");
  return new Response(JSON.stringify({members:count}),{headers:{...headers,"Cache-Control":"public, max-age=60"}});
 }catch{return new Response(JSON.stringify({error:"count_unavailable"}),{status:503,headers:{...headers,"Cache-Control":"no-store"}});}
});
