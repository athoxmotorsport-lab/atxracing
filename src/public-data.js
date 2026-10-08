/* Short-lived public data only. Private data and Steam validation are never cached. */
(() => {
 const pending=new Map(),lifetime=60000;
 const eventPending=new Map(),eventLifetime=30000,eventEndpoint='https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/public-event';
 let eventRevision=0;
 window.ATX_CLEAR_PUBLIC_EVENTS=()=>{
  eventRevision++;eventPending.clear();
  try{for(let i=sessionStorage.length-1;i>=0;i--){const key=sessionStorage.key(i);if(key?.startsWith('atx-public-events-v1:'))sessionStorage.removeItem(key);}}catch{}
 };
 window.ATX_PUBLIC_EVENTS=async scope=>{
  if(scope==null)scope=typeof document!=='undefined'&&document.body?.dataset.page==='archives'?'archives':'feed';
  scope=scope==='archives'?'archives':typeof scope==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(scope)?scope:'feed';
  const key='atx-public-events-v1:'+scope;
  try{const entry=JSON.parse(sessionStorage.getItem(key)),age=Date.now()-entry?.at;if(entry?.data&&age>=0&&age<eventLifetime)return entry.data;}catch{}
  if(eventPending.has(scope))return eventPending.get(scope);
  const query=scope==='feed'?'?view=feed':scope==='archives'?'':'?slug='+encodeURIComponent(scope);
  const started=eventRevision;
  const task=fetch(eventEndpoint+query,{signal:AbortSignal.timeout(12000)}).then(async response=>{
   if(!response.ok){const error=Error('events');error.status=response.status;throw error;}const data=await response.json();
   if(scope==='feed'||scope==='archives'){if(!Array.isArray(data.events)||!Array.isArray(data.notifications))throw Error('invalid_events');}
   else if(!data.event||data.event.slug!==scope)throw Error('invalid_event');
   try{if(started===eventRevision){const entry=JSON.stringify({at:Date.now(),data});sessionStorage.setItem(key,entry);if(scope==='archives')sessionStorage.setItem('atx-public-events-v1:feed',entry);}}catch{}
   return data;
  }).finally(()=>{if(eventPending.get(scope)===task)eventPending.delete(scope);});
  eventPending.set(scope,task);return task;
 };
 let revision=0;
 window.ATX_CLEAR_PUBLIC_LEADERBOARDS=()=>{
  window.ATX_CLEAR_PUBLIC_EVENTS();
  revision++;pending.clear();
  try{for(let i=sessionStorage.length-1;i>=0;i--){const key=sessionStorage.key(i);if(key?.startsWith('atx-public-leaderboard-v1:'))sessionStorage.removeItem(key);}}catch{}
 };
 window.ATX_PUBLIC_LEADERBOARD=async category=>{
  const scope=['WGT','ATXS','OL','ALL'].includes(category)?category:'DR';
  const key='atx-public-leaderboard-v1:'+scope;
  try{const entry=JSON.parse(sessionStorage.getItem(key));const age=Date.now()-entry?.at;if(entry?.data&&age>=0&&age<lifetime)return entry.data;}catch{}
  if(pending.has(scope))return pending.get(scope);
  const started=revision;
  const task=fetch('https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/public-leaderboard?category='+scope,{signal:AbortSignal.timeout(12000)}).then(async response=>{
   if(!response.ok){const error=Error('leaderboard');error.status=response.status;throw error;}
   const data=await response.json();
   if(!Array.isArray(data.drivers))throw Error('invalid_leaderboard');
   const generated=Date.parse(data.generated_at),at=Number.isFinite(generated)?Math.min(Date.now(),generated):Date.now();
   try{if(started===revision)sessionStorage.setItem(key,JSON.stringify({at,data}));}catch{}
   return data;
  }).finally(()=>{if(pending.get(scope)===task)pending.delete(scope);});
  pending.set(scope,task);return task;
 };
})();
