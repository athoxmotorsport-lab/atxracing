/* ATX public live ticker, recent racing honours and Hall of Fame. No invented results. */
(() => {
  'use strict';
  if (!document.querySelector('.topbar') || document.body.dataset.game !== 'acc') return;
  const lang = document.documentElement.lang === 'en' ? 'en' : 'fr';
  const base = document.querySelector('meta[name="atx-base"]')?.content || '/atxracing/';
  const tr = (fr,en) => lang === 'fr' ? fr : en;
  const el = (tag,cls,txt) => {
    const n=document.createElement(tag); if(cls)n.className=cls;
    if(txt!==undefined)n.textContent=txt; return n;
  };
  const safeSlug = s => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(s||''));
  const eventHref = s => base+lang+'/acc/course.html?slug='+encodeURIComponent(s);
  const hallHref = base+lang+'/acc/hall-of-fame.html';
  const ticker=el('section','atx-ticker');
  ticker.setAttribute('aria-label',tr('Informations de la ligue','League updates'));
  const live=el('span','atx-ticker-live','LIVE');
  const screen=el('div','atx-ticker-window');
  const track=el('div','atx-ticker-track');
  screen.append(track); ticker.append(live,screen);
  document.querySelector('.topbar').insertAdjacentElement('afterend',ticker);
  const renderTicker=(events,notifications)=>{
    const items=[];
    for(const notice of notifications.slice(0,8)){
      const caption=notice['title_'+lang]||notice.title_fr;
      const body=notice['message_'+lang]||notice.message_fr;
      if(!caption||!body)continue;
      const a=el('a','atx-ticker-item',caption+' — '+body);
      const m=/^course\.html\?event=([a-z0-9-]+)$/.exec(notice.related_link||'');
      a.href=m&&safeSlug(m[1])?eventHref(m[1]):base+lang+'/acc/calendar.html';
      items.push(a);
    }
    const upcoming=events.filter(e=>safeSlug(e.slug)&&Date.parse(e.starts_at)>Date.now()).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)).slice(0,4);
    for(const e of upcoming){
      const title=e['title_'+lang]||e.title_fr||e.circuit_name;
      if(!title)continue;
      const date=new Intl.DateTimeFormat(lang==='fr'?'fr-BE':'en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Brussels'}).format(new Date(e.starts_at));
      const a=el('a','atx-ticker-item',tr('PROCHAINE COURSE','NEXT RACE')+' · '+title+' · '+date);
      a.href=eventHref(e.slug);items.push(a);
    }
    if(!items.length){track.replaceChildren(el('span','atx-ticker-item',tr('Bienvenue dans le paddock ATXRACING','Welcome to the ATXRACING paddock')));return}
    const fragment=document.createDocumentFragment();
    for(let i=0;i<2;i++)for(const item of items){const clone=item.cloneNode(true);if(i)clone.setAttribute('aria-hidden','true');fragment.append(clone)}
    track.replaceChildren(fragment);
    track.style.animationDuration=Math.max(35,items.length*11)+'s';
  };
  const isHonouredRace=e=>safeSlug(e.slug)&&e.result_publication_state==='official'&&Date.parse(e.starts_at)<=Date.now()&&e.status!=='draft';
  const makeLink=(name,href,cls)=>{
    const a=el('a',cls,name);a.href=href;return a;
  };
  const rail=el('aside','atx-honours-rail');
  rail.setAttribute('aria-label',tr('Pilotes à l’honneur','Honoured drivers'));
  const heading=el('div','atx-rail-title',tr('PILOTES À L’HONNEUR','DRIVERS IN THE SPOTLIGHT'));
  const listFast=el('div','atx-honours-list');
  const listSafe=el('div','atx-honours-list');
  const sections=[
    {name:'fast_driver',label:'FAST DRIVERS',target:listFast},
    {name:'gentleman_driver',label:'GENTLEMAN DRIVERS',target:listSafe}
  ];
  rail.append(heading);
  sections.forEach(s=>{
    const box=el('section','atx-honours-panel');
    box.append(el('h2','',s.label),s.target);rail.append(box);
  });
  rail.append(makeLink(tr('Voir le Hall of Fame →','Explore the Hall of Fame →'),hallHref,'atx-hall-link'));
  const isHall=document.body.dataset.page==='hall-of-fame';
  if(isHall){
    const main=document.querySelector('main');if(main){
      main.append(el('p','atx-hall-intro',tr('Distinctions officielles des pilotes ATXRACING. Chaque carte renvoie vers sa course.','Official ATXRACING driver honours. Each card links to its race.')));
    }
  }else{
    document.body.append(rail);
  }
  const renderHonours=(records,scanned)=>{
    const byType=type=>{
      const m=new Map();
      for(const x of records.filter(r=>r.type===type)){
        const key=x.driver_id;const row=m.get(key)||{name:x.driver,avatar:x.avatar,count:0};
        row.count++;m.set(key,row);
      }
      return [...m.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)).slice(0,5);
    };
    for(const section of sections){
      const list=byType(section.name);section.target.replaceChildren();
      if(!list.length){section.target.append(el('p','atx-honours-empty',tr('Aucune distinction publiée','No published honours')));continue}
      list.forEach((driver,i)=>{
        const entry=el('div','atx-honours-entry');
        entry.append(el('b','',String(i+1).padStart(2,'0')));
        if(driver.avatar&&/^https:\/\//.test(driver.avatar)){const img=el('img');img.src=driver.avatar;img.alt='';img.loading='lazy';entry.append(img)}
        entry.append(el('span','',driver.name),el('strong','',String(driver.count)));
        section.target.append(entry);
      });
    }
    const existing=rail.querySelector('.atx-honours-note');
    if(existing)existing.remove();
    rail.append(el('small','atx-honours-note',tr('Sur '+scanned+' courses officielles consultées','Across '+scanned+' official races reviewed')));
    if(isHall){
      const gallery=document.querySelector('#atx-hall-gallery');
      if(!gallery)return;
      gallery.replaceChildren();
      for(const record of records){
        const card=makeLink('',eventHref(record.slug),'atx-hall-card');
        card.append(el('span','atx-hall-kind',record.type==='fast_driver'?'FAST DRIVER':'GENTLEMAN DRIVER'));
        card.append(el('strong','',record.driver));
        card.append(el('span','',record.event));
        card.append(el('small','',new Intl.DateTimeFormat(lang,{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Brussels'}).format(new Date(record.date))));
        gallery.append(card);
      }
      if(!records.length)gallery.append(el('p','',tr('Aucune distinction officielle publiée.','No official honours published.')));
    }
  };
  async function init(){
    try{
      const data=window.ATX_PUBLIC_EVENTS?await window.ATX_PUBLIC_EVENTS():await (await fetch('https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/public-event?view=feed')).json();
      const events=Array.isArray(data.events)?data.events:[];
      renderTicker(events,Array.isArray(data.notifications)?data.notifications:[]);
      const races=events.filter(isHonouredRace).sort((a,b)=>Date.parse(b.starts_at)-Date.parse(a.starts_at)).slice(0,24);
      const records=[];let scanned=0;
      // Bounded, staggered reads; public-event enforces official-event and public-driver visibility.
      for(let start=0;start<races.length;start+=4){
        const batch=await Promise.all(races.slice(start,start+4).map(async e=>{
          try{return await(window.ATX_PUBLIC_EVENTS?window.ATX_PUBLIC_EVENTS(e.slug):fetch('https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/public-event?slug='+encodeURIComponent(e.slug)).then(r=>r.ok?r.json():null))}catch{return null}
        }));
        batch.forEach((result,i)=>{
          if(!result||!Array.isArray(result.honours)||result.event?.result_publication_state!=='official')return;
          const event=races[start+i];scanned++;
          for(const a of result.honours){
            if(!['fast_driver','gentleman_driver'].includes(a.award_type)||!a.driver_id||!a.driver?.display_name)continue;
            records.push({type:a.award_type,driver_id:a.driver_id,driver:a.driver.display_name,avatar:a.driver.avatar_url,slug:event.slug,event:event['title_'+lang]||event.title_fr||event.circuit_name,date:event.starts_at});
          }
        });
      }
      renderHonours(records,scanned);
    }catch{renderTicker([],[]);renderHonours([],0)}
  }
  init();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)init()});
})();
