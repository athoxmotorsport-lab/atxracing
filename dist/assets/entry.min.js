/* The public entrance uses the existing Steam session exchange. */
(() => {
 'use strict';
 const base=document.querySelector('meta[name="atx-base"]')?.content||'/atxracing/';
 const api='https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/';
 const key='atx-racing-session';
 const status=document.querySelector('[data-entry-status]');
 const params=new URLSearchParams(location.hash.slice(1));
 const code=params.get('steam_code');
 const destination=base+'fr/';
 const getToken=()=>{try{return sessionStorage.getItem(key);}catch{return null;}};
 const saveToken=value=>{try{sessionStorage.setItem(key,value);return true;}catch{return false;}};
 const clearToken=()=>{try{sessionStorage.removeItem(key);}catch{}};
 async function session(options){
  const response=await fetch(api+'auth-session',{...options,signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('session');
  return response.json();
 }
 async function start(){
  if(code){
   history.replaceState(null,'',location.pathname+location.search);
   status.textContent='Connexion Steam en cours…';
   try{
    const data=await session({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
    if(!data.access_token||!saveToken(data.access_token))throw Error('storage');
    location.replace(destination);
   }catch{status.textContent='La connexion Steam a échoué. Réessayez.';}
   return;
  }
  const token=getToken();
  if(token){
   status.textContent='Ouverture de votre espace…';
   try{await session({headers:{Authorization:'Bearer '+token}});location.replace(destination);return;}
   catch{clearToken();status.textContent='';}
  }
  if(new URLSearchParams(location.search).get('steam')==='error'||params.get('steam')==='error')status.textContent='La connexion Steam a échoué. Réessayez.';
 }
 start();
})();
