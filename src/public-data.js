/* Short-lived public standings only. Private data and Steam validation are never cached. */
(() => {
 const pending=new Map(),lifetime=60000;
 let revision=0;
 window.ATX_CLEAR_PUBLIC_LEADERBOARDS=()=>{
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
