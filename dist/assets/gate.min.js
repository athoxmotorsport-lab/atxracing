/* Verify Steam on every page without delaying its public layout. */
(() => {
 'use strict';
 const base=document.querySelector('meta[name="atx-base"]')?.content||'/atxracing/';
 const key='atx-racing-session';
 const fragment=new URLSearchParams(location.hash.slice(1));
 if(fragment.has('steam_code')||fragment.has('steam')||new URLSearchParams(location.search).has('steam')){
  location.replace(base+location.search+location.hash);
  return;
 }
 const page=document.body.dataset.page,publicProfile=page==='profile'&&/^[0-9a-f-]{36}$/i.test(new URLSearchParams(location.search).get('driver')||'');
 const publicPage=!['home','admin','messages','profile'].includes(page)||publicProfile;
 let token;
 try{token=sessionStorage.getItem(key);}catch{}
 if(!token){if(publicPage){document.body.classList.remove('site-locked');const login=document.querySelector('[data-steam-link]');if(login){login.href=base;login.onclick=()=>{try{sessionStorage.setItem('atx-after-login',location.pathname+location.search);}catch{}};}return;}try{sessionStorage.setItem('atx-after-login',location.pathname+location.search);}catch{}location.replace(base);return;}
 const api='https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/';
 // Static public pages can paint while the server checks the session.
 // Private endpoints still authenticate every request; no session result is cached.
 document.body.classList.remove('site-locked');
 window.ATX_SESSION_TOKEN=token;
 window.ATX_SESSION_AUTH=fetch(api+'auth-session?view=identity',{
  headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)
 }).then(response=>{
  if(!response.ok){const error=Error('session');error.status=response.status;throw error;}
  return response.json();
 });
 window.ATX_SESSION_AUTH.then(async session=>{
  if(document.body.dataset.page!=='profile'){
   let profile=session;
   if(session.driver?.profile_confirmed_at===undefined){
    const response=await fetch(api+'driver-profile',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
    if(!response.ok){const error=Error('profile');error.status=response.status;throw error;}
    profile=await response.json();
   }
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
 }).catch(error=>{
  if(error.status===401||error.status===403){
   try{sessionStorage.removeItem(key);}catch{}
   if(publicPage){window.ATX_SESSION_AUTH=null;document.body.classList.remove('site-locked');return;}
   location.replace(base);return;
  }
  // A temporary network failure does not mean the account has signed out.
  window.ATX_SESSION_AUTH=null;
  const retry=document.createElement('button');retry.type='button';retry.className='session-retry pill';
  retry.textContent=document.documentElement.lang==='en'?'Steam check unavailable · Retry':'Vérification Steam indisponible · Réessayer';
  retry.onclick=()=>location.reload();document.body.append(retry);
 });
})();
