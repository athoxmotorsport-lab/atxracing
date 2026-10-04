/* Keep visitors at the Steam entrance until their existing session is verified. */
(() => {
 'use strict';
 const base=document.querySelector('meta[name="atx-base"]')?.content||'/atxracing/';
 const key='atx-racing-session';
 const fragment=new URLSearchParams(location.hash.slice(1));
 if(fragment.has('steam_code')||fragment.has('steam')){
  location.replace(base+location.hash);
  return;
 }
 let token;
 try{token=sessionStorage.getItem(key);}catch{}
 if(!token){location.replace(base);return;}
 fetch('https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/auth-session',{
  headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)
 }).then(response=>{
  if(!response.ok)throw Error('session');
  const label=document.querySelector('[data-steam-label]');
  if(label)label.textContent=document.documentElement.lang==='en'?'Driver profile':'Profil pilote';
  document.body.classList.remove('site-locked');
 }).catch(()=>{
  try{sessionStorage.removeItem(key);}catch{}
  location.replace(base);
 });
})();
