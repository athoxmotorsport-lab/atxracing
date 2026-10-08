export async function nativeCounts(db:any,events:any[]){
 const ids=events.filter(e=>!e.simgrid_url).map(e=>e.id);
 if(!ids.length)return events.map(e=>({...e,registered_snapshot:null}));
 const {data,error}=await db.rpc('atx_public_entry_counts',{p_events:ids});if(error)throw Error('counts_unavailable');
 const counts=new Map((data||[]).map((r:any)=>[r.event_id,r]));
 return events.map(e=>{const row:any=counts.get(e.id);return {...e,registered_snapshot:null,...(row?{registered_count:Number(row.entries),places_remaining:Math.max(0,Number(e.max_drivers)-Number(row.entries)-Number(row.reserved))}:{})};});
}
