/* Shared race notifications and the official ATXRACING Discord server widget. */
(() => {
 'use strict';
 const body=document.body;
 if(!body.dataset.page||body.dataset.page==='entry')return;
 const lang=document.documentElement.lang==='en'?'en':'fr';
 const base=document.querySelector('meta[name="atx-base"]')?.content||'/atxracing/';
 const text=(fr,en)=>lang==='fr'?fr:en;
 const api='https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/public-event';
 const header=document.querySelector('.header-tools')||document.querySelector('.top-inner');
 const seenKey='atxracing-notifications-seen-v1';
 const dismissedKey='atxracing-race-reminders-v1';
 const read=(storage,key)=>{try{return JSON.parse(storage.getItem(key)||'{}')}catch{return {}}};
 const save=(storage,key,value)=>{try{storage.setItem(key,JSON.stringify(value))}catch{}};
 const element=(tag,cls,label)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(label!==undefined)node.textContent=label;return node};
 const route=notice=>{
  const link=String(notice.related_link||'');
  const race=/^course\.html\?event=([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(link);
  if(race)return base+lang+'/acc/course.html?slug='+encodeURIComponent(race[1]);
  if(link==='classement.html#circuit')return base+lang+'/acc/records.html';
  return base+lang+'/acc/calendar.html';
 };
 let notices=[],today=[];
 const bell=element('button','community-bell');
 bell.type='button';bell.setAttribute('aria-controls','community-notices');bell.setAttribute('aria-expanded','false');
 bell.innerHTML='<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>';
 const count=element('span','community-count');count.hidden=true;bell.append(count);
 const panel=element('section','community-notices');panel.id='community-notices';panel.hidden=true;
 panel.setAttribute('aria-label',text('Notifications ATXRACING','ATXRACING notifications'));
 const shell=element('div','community-notification-shell');shell.append(bell,panel);
 const messagesLink=element('a','community-message-link');
 messagesLink.href=base+lang+'/'+(body.dataset.game||'acc')+'/messages.html';
 messagesLink.setAttribute('aria-label',text('Messages privés','Private messages'));
 messagesLink.title=text('Messages privés','Private messages');
 messagesLink.innerHTML='<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>';
 const messageCount=element('span','community-count');messageCount.hidden=true;messagesLink.append(messageCount);
 async function refreshMessages(){
  let token;try{token=sessionStorage.getItem('atx-racing-session')}catch{}
  if(!token)return;
  try{const response=await fetch('https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/driver-messages?view=inbox',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});if(!response.ok)return;const data=await response.json();const value=Math.max(0,Number(data.unread)||0);messageCount.hidden=value===0;messageCount.textContent=value>9?'9+':String(value);messagesLink.setAttribute('aria-label',text(`Messages privés : ${value} non lu(s)`,`Private messages: ${value} unread`))}catch{}
 }
 if(header){header.insertBefore(shell,header.querySelector('.steam-connect'));header.insertBefore(messagesLink,header.querySelector('.steam-connect'))}
 refreshMessages();setInterval(refreshMessages,60000);window.addEventListener('atx-messages-changed',refreshMessages);
 const unread=()=>notices.filter(notice=>!read(localStorage,seenKey)[notice.id]).length;
 const updateCount=()=>{const value=unread();count.hidden=value===0;count.textContent=value>9?'9+':String(value);bell.setAttribute('aria-label',text(`Notifications : ${value} non lue(s)`,`Notifications: ${value} unread`))};
 const render=()=>{
  panel.replaceChildren(element('h2','',text('Notifications','Notifications')));
  if(!notices.length){panel.append(element('p','community-empty',text('Aucune notification pour le moment.','No notifications yet.')));return}
  notices.slice(0,20).forEach(notice=>{
   const link=element('a','community-notice');link.href=route(notice);
   link.append(element('strong','',notice['title_'+lang]||notice.title_fr),element('span','',notice['message_'+lang]||notice.message_fr));
   panel.append(link);
  });
 };
 const closeNotices=()=>{panel.hidden=true;bell.setAttribute('aria-expanded','false')};
 bell.addEventListener('click',()=>{
  panel.hidden=!panel.hidden;bell.setAttribute('aria-expanded',String(!panel.hidden));
  if(!panel.hidden){const seen=read(localStorage,seenKey);notices.forEach(notice=>{seen[notice.id]=true});save(localStorage,seenKey,seen);updateCount();render()}
 });
 const localDay=stamp=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Brussels'}).format(new Date(stamp));
 const reminder=event=>{
  const key=event.slug+':'+localDay(event.starts_at),dismissed=read(sessionStorage,dismissedKey);
  if(dismissed[key]||document.querySelector('.community-race-overlay'))return;
  const overlay=element('div','community-race-overlay'),dialog=element('section','community-race-dialog');
  dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','community-race-title');
  const close=element('button','community-race-close','×');close.type='button';close.setAttribute('aria-label',text('Fermer','Close'));
  const title=element('h2','',event['title_'+lang]||event.title_fr||event.circuit_name||'ATXRACING');title.id='community-race-title';
  const clock=new Intl.DateTimeFormat(lang,{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Brussels'}).format(new Date(event.starts_at));
  const description=element('p','',`${event.circuit_name||'ACC'} · ${text('Début de l’événement','Event starts')} ${clock} (${text('heure belge','Belgium time')})`);
  const link=element('a','community-race-action',text('Voir la course','View race'));link.href=base+lang+'/acc/course.html?slug='+encodeURIComponent(event.slug);
  const later=element('button','community-race-later',text('Plus tard','Later'));later.type='button';
  dialog.append(close,element('small','',text('COURSE AUJOURD’HUI','RACE TODAY')),title,description,link,later);overlay.append(dialog);body.append(overlay);
  const previous=document.activeElement;
  const finish=()=>{dismissed[key]=true;save(sessionStorage,dismissedKey,dismissed);overlay.remove();document.removeEventListener('keydown',onKey);if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()};
  const onKey=event=>{if(event.key==='Escape')finish()};
  close.onclick=finish;later.onclick=finish;link.onclick=finish;overlay.onclick=event=>{if(event.target===overlay)finish()};document.addEventListener('keydown',onKey);close.focus();
 };
 async function refresh(){
  try{
   const response=await fetch(api,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('notifications');
   const data=await response.json();
   notices=(Array.isArray(data.notifications)?data.notifications:[]).filter(item=>item&&typeof item.id==='string'&&typeof item.title_fr==='string'&&typeof item.message_fr==='string').slice(0,30);
   today=(Array.isArray(data.today)?data.today:[]).filter(item=>item&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug||''));
   updateCount();if(!panel.hidden)render();
   const announced=today.find(event=>notices.some(notice=>notice.type==='race_day'&&notice.related_link==='course.html?event='+event.slug));
   if(announced)reminder(announced);
  }catch{if(!panel.hidden&&!notices.length)panel.replaceChildren(element('p','community-empty',text('Notifications momentanément indisponibles.','Notifications are temporarily unavailable.')))}
 }
 updateCount();refresh();setInterval(refresh,60000);
 document.addEventListener('click',event=>{if(!shell.contains(event.target))closeNotices()});

 const discordButton=element('button','discord-tab','Discord');discordButton.type='button';
 discordButton.setAttribute('aria-controls','discord-drawer');discordButton.setAttribute('aria-expanded','false');
 discordButton.setAttribute('aria-label',text('Ouvrir le serveur Discord','Open Discord server'));
 const drawer=element('aside','discord-drawer');drawer.id='discord-drawer';drawer.hidden=true;
 drawer.setAttribute('aria-label',text('Communauté Discord ATXRACING','ATXRACING Discord community'));
 const heading=element('div','discord-drawer-heading');heading.append(element('strong','',text('Communauté ATXRACING','ATXRACING community')));
 const discordClose=element('button','discord-close','×');discordClose.type='button';discordClose.setAttribute('aria-label',text('Fermer Discord','Close Discord'));heading.append(discordClose);
 const widgetHolder=element('div','discord-widget-holder');
 const invite=element('a','discord-invite',text('Ouvrir Discord ↗','Open Discord ↗'));invite.href='https://discord.com/invite/dgyJJYTSsD';invite.target='_blank';invite.rel='noopener noreferrer';
 drawer.append(heading,widgetHolder,invite);body.append(discordButton,drawer);
 const closeDiscord=()=>{drawer.hidden=true;discordButton.setAttribute('aria-expanded','false')};
 discordButton.onclick=()=>{
  drawer.hidden=!drawer.hidden;discordButton.setAttribute('aria-expanded',String(!drawer.hidden));
  if(!drawer.hidden&&!widgetHolder.firstChild){const iframe=element('iframe','discord-widget');iframe.src='https://discord.com/widget?id=1542830665039487058&theme=dark';iframe.title=text('Membres en ligne sur Discord ATXRACING','ATXRACING Discord members online');iframe.loading='lazy';iframe.referrerPolicy='no-referrer';iframe.setAttribute('sandbox','allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts');widgetHolder.append(iframe)}
  if(!drawer.hidden)discordClose.focus();
 };
 discordClose.onclick=()=>{closeDiscord();discordButton.focus()};
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeNotices();if(!drawer.hidden){closeDiscord();discordButton.focus()}}});
})();
