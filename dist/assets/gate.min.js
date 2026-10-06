/* Keep visitors at the Steam entrance until their existing session is verified. */
(() => {
 'use strict';
 const base=document.querySelector('meta[name="atx-base"]')?.content||'/atxracing/';
 const key='atx-racing-session';
 const fragment=new URLSearchParams(location.hash.slice(1));
 if(fragment.has('steam_code')||fragment.has('steam')||new URLSearchParams(location.search).has('steam')){
  location.replace(base+location.search+location.hash);
  return;
 }
 let token;
 try{token=sessionStorage.getItem(key);}catch{}
 if(!token){location.replace(base);return;}
 const api='https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/';
 fetch(api+'auth-session',{
  headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)
 }).then(response=>{
  if(!response.ok)throw Error('session');
  return response.json();
 }).then(async session=>{
  if(document.body.dataset.page!=='profile'){
   const response=await fetch(api+'driver-profile',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('profile');
   const profile=await response.json();
   if(!profile.driver?.profile_confirmed_at){
    const lang=document.documentElement.lang==='en'?'en':'fr';
    location.replace(base+lang+'/acc/profile.html?onboarding=1');
    return;
   }
  }
  const label=document.querySelector('[data-steam-label]');
  if(label)label.textContent=document.documentElement.lang==='en'?'Driver profile':'Profil pilote';
  const name=document.querySelector('[data-driver-name]');
  if(name)name.textContent=session.driver?.display_name||(document.documentElement.lang==='en'?'driver':'pilote');
  document.body.classList.remove('site-locked');
 }).catch(()=>{
  try{sessionStorage.removeItem(key);}catch{}
  location.replace(base);
 });
})();
