/* Private one-to-one conversations for verified Steam drivers. */
(() => {
 'use strict';
 const root=document.querySelector('#messages-app');if(!root)return;
 const lang=document.documentElement.lang==='en'?'en':'fr';
 const t=lang==='fr'?{
  search:'Rechercher un pilote',placeholder:'Nom du pilote',inbox:'Conversations',drivers:'Pilotes',empty:'Aucune conversation pour le moment.',choose:'Choisissez un pilote ou une conversation.',write:'Votre message',send:'Envoyer',sending:'Envoi…',blocked:'Vous avez bloqué ce pilote.',block:'Bloquer',unblock:'Débloquer',error:'La messagerie est momentanément indisponible.',sendError:'Le message n’a pas été envoyé. Réessayez.',limited:'Trop de messages envoyés. Réessayez plus tard.',forbidden:'Cette conversation est bloquée.',login:'Reconnectez-vous avec Steam pour accéder aux messages.',you:'Vous',noResults:'Aucun pilote trouvé.',unread:'non lu(s)'}:{
  search:'Find a driver',placeholder:'Driver name',inbox:'Conversations',drivers:'Drivers',empty:'No conversations yet.',choose:'Choose a driver or conversation.',write:'Your message',send:'Send',sending:'Sending…',blocked:'You have blocked this driver.',block:'Block',unblock:'Unblock',error:'Messages are temporarily unavailable.',sendError:'Your message was not sent. Try again.',limited:'Too many messages sent. Try again later.',forbidden:'This conversation is blocked.',login:'Sign in with Steam again to access messages.',you:'You',noResults:'No driver found.',unread:'unread'};
 const endpoint='https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/driver-messages';
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const token=()=>{try{return sessionStorage.getItem('atx-racing-session')}catch{return null}};
 const el=(tag,cls,value)=>{const item=document.createElement(tag);if(cls)item.className=cls;if(value!==undefined)item.textContent=String(value);return item};
 async function call(query='',body){
  const key=token();if(!key)throw Object.assign(Error('unauthorized'),{status:401});
  const response=await fetch(endpoint+query,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(Error(data.error||'request_failed'),{status:response.status});return data;
 }
 const layout=el('div','messages-layout');
 const sidebar=el('section','messages-sidebar');
 const label=el('label','messages-search-label',t.search);label.htmlFor='messages-search';
 const search=el('input','messages-search');search.id='messages-search';search.type='search';search.placeholder=t.placeholder;search.autocomplete='off';
 const contactsTitle=el('h2','',t.inbox),contacts=el('div','messages-contacts');
 const driversTitle=el('h2','',t.drivers),drivers=el('div','messages-drivers');
 sidebar.append(label,search,contactsTitle,contacts,driversTitle,drivers);
 const conversation=el('section','messages-conversation');conversation.append(el('p','messages-placeholder',t.choose));
 layout.append(sidebar,conversation);root.replaceChildren(layout);
 let active=null,blocked=false,searchTimer=0,requestId=0;
 const date=value=>new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Brussels'}).format(new Date(value));
 const status=(message,error=false)=>{const node=conversation.querySelector('.messages-status');if(node){node.textContent=message||'';node.classList.toggle('is-error',error)}};
 function personButton(person,detail,unread){
  const button=el('button','messages-person');button.type='button';
  button.append(el('strong','',person?.display_name||'Pilote'),el('span','',detail||''));
  if(unread){button.append(el('b','messages-unread',String(unread)));button.setAttribute('aria-label',(person?.display_name||'Pilote')+' · '+unread+' '+t.unread)}
  button.onclick=()=>open(person?.id);return button;
 }
 async function loadInbox(){
  try{
   const data=await call('?view=inbox');contacts.replaceChildren();
   if(!data.conversations?.length)contacts.append(el('p','messages-muted',t.empty));
   else data.conversations.forEach(entry=>contacts.append(personButton(entry.driver||{id:entry.peer_id,display_name:'Pilote'},entry.last_message,entry.unread)));
  }catch(error){contacts.replaceChildren(el('p','messages-muted',error.status===401?t.login:t.error))}
 }
 async function loadDirectory(value=''){
  const current=++requestId;
  try{
   const data=await call('?view=directory&q='+encodeURIComponent(value));if(current!==requestId)return;
   drivers.replaceChildren();if(!data.drivers?.length)drivers.append(el('p','messages-muted',t.noResults));
   else data.drivers.forEach(person=>drivers.append(personButton(person,person.team_name||'')));
  }catch{if(current===requestId)drivers.replaceChildren(el('p','messages-muted',t.error))}
 }
 function renderThread(data){
  blocked=!!data.blocked;conversation.replaceChildren();
  const top=el('header','messages-thread-heading');top.append(el('h2','',data.peer?.display_name||'Pilote'));
  const block=el('button','messages-block',blocked?t.unblock:t.block);block.type='button';
  block.onclick=async()=>{try{const result=await call('',{action:blocked?'unblock':'block',peerId:active});blocked=!!result.blocked;block.textContent=blocked?t.unblock:t.block;composer.disabled=blocked;send.disabled=blocked;status(blocked?t.blocked:'')}catch{status(t.error,true)}};
  top.append(block);conversation.append(top);
  const history=el('div','messages-history');
  (data.messages||[]).forEach(message=>{
   const mine=message.recipient_id===active;
   const item=el('article','messages-bubble '+(mine?'is-mine':'is-theirs'));
   item.append(el('small','',mine?t.you:(data.peer?.display_name||'Pilote')),el('p','',message.body),el('time','',date(message.created_at)));
   history.append(item);
  });
  if(!history.childNodes.length)history.append(el('p','messages-muted',t.choose));
  conversation.append(history);
  const form=el('form','messages-composer');
  const composer=el('textarea','messages-text');composer.name='message';composer.maxLength=2000;composer.rows=3;composer.placeholder=t.write;composer.setAttribute('aria-label',t.write);composer.disabled=blocked;
  const send=el('button','messages-send',t.send);send.type='submit';send.disabled=blocked;
  const note=el('p','messages-status',blocked?t.blocked:'');form.append(composer,send,note);conversation.append(form);
  form.onsubmit=async event=>{
   event.preventDefault();const value=composer.value.trim();if(!value||blocked)return;
   send.disabled=true;send.textContent=t.sending;status('');
   try{await call('',{action:'send',peerId:active,body:value});composer.value='';await Promise.all([loadThread(active),loadInbox()])}
   catch(error){send.disabled=false;send.textContent=t.send;status(error.status===429?t.limited:error.status===403?t.forbidden:t.sendError,true)}
  };
  history.scrollTop=history.scrollHeight;
 }
 async function loadThread(peer){if(!uuid.test(peer||''))return;
  try{const data=await call('?view=thread&peer='+encodeURIComponent(peer));if(active!==peer)return;renderThread(data);await call('',{action:'read',peerId:peer});await loadInbox();window.dispatchEvent(new Event('atx-messages-changed'))}
  catch(error){conversation.replaceChildren(el('p','messages-placeholder',error.status===401?t.login:t.error))}
 }
 async function open(peer){if(!uuid.test(peer||''))return;active=peer;history.replaceState(null,'','?to='+encodeURIComponent(peer));conversation.replaceChildren(el('p','messages-placeholder','…'));await loadThread(peer)}
 search.oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadDirectory(search.value.trim()),220)};
 loadInbox();loadDirectory();
 const initial=new URLSearchParams(location.search).get('to');if(uuid.test(initial||''))open(initial);
 setInterval(()=>{if(!document.hidden){loadInbox();if(active&&!conversation.querySelector('.messages-text:focus'))loadThread(active)}},20000);
})();
