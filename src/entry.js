/* The public entrance uses the existing Steam session exchange. */
(() => {
 'use strict';
 const base=document.querySelector('meta[name="atx-base"]')?.content||'/atxracing/';
 const api='https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/';
 const key='atx-racing-session';
 const status=document.querySelector('[data-entry-status]');
 const engineer=document.querySelector('[data-race-engineer]');
 const params=new URLSearchParams(location.hash.slice(1));
 const code=params.get('steam_code');
 const paddock=base+'fr/';
 const onboarding=base+'fr/acc/profile.html?onboarding=1';
 const getToken=()=>{try{return sessionStorage.getItem(key);}catch{return null;}};
 const saveToken=value=>{try{sessionStorage.setItem(key,value);return true;}catch{return false;}};
 const clearToken=()=>{try{sessionStorage.removeItem(key);}catch{}};
 async function session(options){
  const response=await fetch(api+'auth-session',{...options,signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('session');
  return response.json();
 }
 async function destination(token){
  status.textContent='Identification du pilote… / Identifying driver…';
  engineer?.removeAttribute('hidden');
  const response=await fetch(api+'driver-profile',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('profile');
  const data=await response.json();
  status.textContent=data.driver?.profile_confirmed_at?'Profil confirmé. Ouverture du paddock… / Profile confirmed. Opening the paddock…':'Profil à compléter. Votre ingénieur de course vous accompagne… / Complete your profile. Your race engineer will guide you…';
  return data.driver?.profile_confirmed_at?paddock:onboarding;
 }
 async function start(){
  if(code){
   history.replaceState(null,'',location.pathname+location.search);
   engineer?.removeAttribute('hidden');
   status.textContent='Connexion Steam en cours… / Signing in with Steam…';
   try{
    const data=await session({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
    if(!data.access_token||!saveToken(data.access_token))throw Error('storage');
    location.replace(await destination(data.access_token));
   }catch{status.textContent='La connexion Steam a échoué. Réessayez. / Steam sign-in failed. Please try again.';}
   return;
  }
  const token=getToken();
  if(token){
   engineer?.removeAttribute('hidden');
   status.textContent='Ouverture de votre espace… / Opening your space…';
   try{await session({headers:{Authorization:'Bearer '+token}});location.replace(await destination(token));return;}
   catch{clearToken();status.textContent='';}
  }
  if(new URLSearchParams(location.search).get('steam')==='error'||params.get('steam')==='error')status.textContent='La connexion Steam a échoué. Réessayez. / Steam sign-in failed. Please try again.';
 }
 start();
})();
