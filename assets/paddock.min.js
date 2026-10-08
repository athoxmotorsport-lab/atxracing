/* Private driver dashboard and wallet. Reuse the page's freshly verified Steam session. */
(() => {
 const base=document.querySelector('meta[name="atx-base"]')?.content||'/atxracing/',lang=document.documentElement.lang==='en'?'en':'fr';
 const word=(fr,en)=>lang==='fr'?fr:en,node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e;};
 const raceUrl=event=>base+lang+'/acc/course.html?slug='+encodeURIComponent(event.slug),title=e=>e['title_'+lang]||e.title_fr;
 const clock=stamp=>new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Brussels'}).format(new Date(stamp));
 const action=(text,href)=>{const a=node('a','pill',text);a.href=href;return a;};
 const root=document.querySelector('[data-paddock-dashboard]'),profile=base+lang+'/acc/profile.html',hasToken=()=>{try{return sessionStorage.getItem('atx-racing-session');}catch{return null;}};
 const kinds=lang==='fr'?{welcome:'Bienvenue',entry:'Inscription',withdrawal:'Désinscription remboursée',finish:'Course terminée · remboursement',position:'Récompense de classement',fastest:'Meilleur tour',adjustment:'Correction'}:{welcome:'Welcome',entry:'Registration',withdrawal:'Withdrawal refund',finish:'Race finished · refund',position:'Position reward',fastest:'Fastest lap',adjustment:'Correction'};
 async function boot(){
  const token=hasToken();if(!token)return;
  try{
   if(window.ATX_SESSION_AUTH)await window.ATX_SESSION_AUTH;
   const full=root||(document.body.dataset.page==='profile'&&!new URLSearchParams(location.search).has('driver'));
   const response=await fetch('https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/driver-paddock'+(full?'':'?view=wallet'),{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('unavailable');const data=await response.json();if(!Number.isSafeInteger(data.coins))throw Error('invalid_wallet');
   document.querySelectorAll('[data-atx-coins]').forEach(e=>e.textContent=String(data.coins));
   if(root){root.replaceChildren();const summary=node('div','paddock-summary');
    const card=(label,value,link)=>{const c=node('article','paddock-personal-card');c.append(node('small','eyebrow',label),node('strong','',value));if(link)c.append(link);summary.append(c);return c;};
    const profileLink=document.querySelector('.paddock-profile-link');if(profileLink)profileLink.textContent=data.profile_complete?word('Voir mon profil pilote ↗','View my driver profile ↗'):word('Compléter mon profil ACC ↗','Complete my ACC profile ↗');
    const next=data.registrations[0];card(word('Ma prochaine course','My next race'),next?title(next.event):word('La piste vous attend','The track awaits'),next?action(word('Voir ma course','View my race'),raceUrl(next.event)):action(word('Choisir une course','Choose a race'),base+lang+'/acc/calendar.html'));if(next)summary.lastChild.append(node('span','',clock(next.event.starts_at)));
    card(word('Mes inscriptions','My registrations'),data.registrations.length,action(word('Voir les inscriptions','View registrations'),'#mes-inscriptions'));
    card('Coins ATX',data.coins,action(word('Voir mon historique','View my history'),profile+'#coins'));
    const last=data.latest_result;card(word('Mon dernier résultat officiel','My latest official result'),last?((last.finish_position?'P'+last.finish_position:'—')+' · '+title(last.event)):word('À venir','Coming soon'),last?action(word('Voir le résultat','View result'),raceUrl(last.event)+'#resultats'):null);
    root.append(summary);const actionBox=node('div','paddock-next-action');actionBox.append(action(data.profile_complete?word('Trouver ma prochaine course','Find my next race'):word('Compléter mon profil ACC','Complete my ACC profile'),data.profile_complete?base+lang+'/acc/calendar.html':profile+'?complete=acc'));root.append(actionBox);
    const list=node('section','paddock-registrations');list.id='mes-inscriptions';list.append(node('h2','',word('Ma grille de départ','My starting grid')));
    for(const r of data.registrations){const row=node('article','paddock-registration');row.append(node('strong','',title(r.event)),node('span','',clock(r.event.starts_at)),node('small','',r.car_model||r.team_name||''),action(word('Gérer mon inscription','Manage my registration'),raceUrl(r.event)));list.append(row);}
    for(const w of data.waitlist){const offered=w.state==='offered';const row=node('article','paddock-registration'+(offered?' is-offered':''));row.append(node('strong','',title(w.event)),node('span','',offered?word('Une place vous est réservée jusqu’au ','A place is reserved for you until ')+clock(w.offered_until):word('En liste d’attente','On the waiting list')),action(offered?word('Confirmer ma place','Confirm my place'):word('Gérer ma demande','Manage my request'),raceUrl(w.event)));list.append(row);}
    if(!data.registrations.length&&!data.waitlist.length)list.append(node('p','profile-note',word('Vous n’avez pas encore d’inscription à venir. Les inscriptions SimGrid apparaissent ici uniquement lorsqu’elles ont été synchronisées.','You have no upcoming registration yet. SimGrid registrations appear here only when synced.')));root.append(list);
   }
   if(document.body.dataset.page==='profile'&&!new URLSearchParams(location.search).has('driver')){
    document.querySelector('#coins.wallet-history')?.remove();
    const wallet=node('section','wallet-history');wallet.id='coins';wallet.append(node('h2','',word('Mes Coins ATX','My ATX Coins')),node('strong','wallet-balance',data.coins+' ATX'),node('p','profile-note',word('10 Coins de bienvenue · inscription sur le site : −1 · désinscription avant le départ : +1 · course terminée : remboursement de 1 Coin payé · meilleur tour : +1 · top 10 : de 10 à 1. Récompenses après validation officielle. Aucun débit en liste d’attente.','10 welcome Coins · website registration: −1 · withdrawal before the start: +1 · finished race: refund of 1 paid Coin · fastest lap: +1 · top 10: 10 down to 1. Rewards follow official validation. No charge while waiting.')));
    for(const item of data.ledger){const row=node('div','wallet-row');row.append(node('strong','',`${item.amount>0?'+':''}${item.amount} ATX`),node('span','',(item.amount<0&&['finish','position','fastest'].includes(item.kind)?word('Correction · ','Correction · '):'')+(kinds[item.kind]||item.kind)),node('small','',clock(item.created_at)));const event=Array.isArray(item.event)?item.event[0]:item.event;if(event)row.append(action(title(event),raceUrl(event)));wallet.append(row);}document.querySelector('.content')?.append(wallet);if(location.hash==='#coins')wallet.scrollIntoView({block:'start'});
   }
  }catch{if(root)root.replaceChildren(node('p','profile-note',word('Votre tableau de bord est momentanément indisponible.','Your dashboard is temporarily unavailable.')));}
 }
 boot();window.addEventListener('atx-wallet-changed',boot);
})();
