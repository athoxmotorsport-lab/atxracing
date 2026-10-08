import {nativeCounts} from './counts.ts';
/* Calendar, media and notices do not need the complete results archive. */
export async function eventFeed(db:any){
 const [eventsResult,noticesResult,mediaResult]=await Promise.all([
  db.from('events').select('id,slug,event_type,status,title_fr,title_en,description_fr,description_en,circuit_name,starts_at,duration_minutes,max_drivers,simgrid_url,image_url,car_class,schedule_timezone_label,event_schedule,mandatory_pit_stop,mandatory_tyre_change,mandatory_refuelling,fixed_refuelling_seconds,time_multiplier,server_name,competition_code,format_code,mandatory_stop_count,server_opens_at,registered_snapshot,site_registration_enabled,result_publication_state,results_validated_at').eq('is_public',true).neq('status','draft').order('starts_at',{ascending:false}).limit(100),
  db.from('notifications').select('id,event_id,type,title_fr,title_en,message_fr,message_en,related_link,circuit_key,driver_id,best_lap_ms,created_at').eq('visibility','public').order('created_at',{ascending:false}).limit(200),
  db.from('atx_media').select('id,media_type,title_fr,title_en,url,event_slug,published_at').eq('is_public',true).order('published_at',{ascending:false}).limit(50),
 ]);
 if(eventsResult.error||noticesResult.error||mediaResult.error)throw Error('feed_unavailable');
 const notices=noticesResult.data||[];
 const eventIds=[...new Set(notices.map((n:any)=>n.event_id).filter(Boolean))],driverIds=[...new Set(notices.map((n:any)=>n.driver_id).filter(Boolean))];
 const [visibleEvents,visibleDrivers]=await Promise.all([
  eventIds.length?db.from('events').select('id').in('id',eventIds).eq('is_public',true).neq('status','draft'):Promise.resolve({data:[],error:null}),
  driverIds.length?db.from('drivers').select('id').in('id',driverIds).eq('is_profile_public',true):Promise.resolve({data:[],error:null}),
 ]);
 if(visibleEvents.error||visibleDrivers.error)throw Error('feed_unavailable');
 const publicEventIds=new Set((visibleEvents.data||[]).map((e:any)=>e.id)),publicDriverIds=new Set((visibleDrivers.data||[]).map((d:any)=>d.id));
 const notifications=notices.filter((n:any)=>(!n.event_id||publicEventIds.has(n.event_id))&&(!n.driver_id||publicDriverIds.has(n.driver_id))).slice(0,30).map(({event_id,...n}:any)=>n);
 const now=Date.now(),localDay=(at:number)=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Brussels'}).format(new Date(at)),todayKey=localDay(now);
 const countedEvents=await nativeCounts(db,eventsResult.data||[]);
 const published=countedEvents.filter((e:any)=>!['draft','cancelled'].includes(e.status)&&e.image_url&&(e.simgrid_url||e.site_registration_enabled)).map(({id,...e}:any)=>({...e,result_count:0}));
 const events=published.filter((e:any)=>Date.parse(e.starts_at)>=now).sort((a:any,b:any)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)).slice(0,24);
 const today=published.filter((e:any)=>localDay(Date.parse(e.starts_at))===todayKey&&now<Date.parse(e.starts_at)+(Number(e.duration_minutes)+120)*60000).sort((a:any,b:any)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
 return {events,today,archives:[],notifications,media:mediaResult.data||[],generated_at:new Date(now).toISOString()};
}
