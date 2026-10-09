/* Local browser checks with mocked services; no real course is published. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]).replace(/^\/atxracing\//,'');if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{const content=fs.readFileSync(file);res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','js':'text/javascript; charset=utf-8','css':'text/css','png':'image/png','svg':'image/svg+xml','webp':'image/webp'})[file.split('.').pop()]||'application/octet-stream');res.end(content);}catch{res.writeHead(404);res.end();}});
let browser;
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(()=>sessionStorage.setItem('atx-racing-session','test-token'));
 await context.route('https://fonts.googleapis.com/**',r=>r.abort());await context.route('https://fonts.gstatic.com/**',r=>r.abort());
 let drafts=[],published=0,imported=0,saved=[],edited,eventDeleted=false,mediaAttempts=0,mediaRows=[];const publishedEvent={id:"00000000-0000-4000-8000-000000000002",slug:"existing-race",title_fr:"Course publiée",title_en:"Published race",starts_at:"2026-10-12T18:00:00Z",circuit_name:"Monza"};
 await context.route('https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/**',async route=>{
  const request=route.request(),name=new URL(request.url()).pathname.split('/').pop();let result={},status=200;
  if(name==='atx-event-admin'){
   if(request.method()==='GET')result={drafts,events:eventDeleted?[]:[publishedEvent],media:mediaRows};
   else{const body=request.postDataJSON();if(body.action==='import'){imported++;status=503;result={error:'simgrid_token_required'};}
    else if(body.action==='save'){saved.push(body.draft);const record={id:'00000000-0000-4000-8000-000000000001',draft:{...body.draft,circuitKey:'laguna_seca',schedule:[]},status:'draft'};drafts=[record];result={draft:record};status=201;}
    else if(body.action==='save_media'){mediaAttempts++;if(mediaAttempts===1){status=400;result={error:'invalid_event_slug'};}else{assert.equal(body.media.eventSlug,'');mediaRows=[{title_fr:body.media.titleFr,title_en:body.media.titleEn,url:body.media.url,media_type:'replay'}];result={media:mediaRows[0]};}}
    else if(body.action==='delete_draft'){assert.equal(body.id,drafts[0].id);drafts=[];result={deleted:true};}
    else if(body.action==='delete_event'){eventDeleted=true;result={deleted:true};}
    else if(body.action==='update_event'){edited=body;result={event:publishedEvent};}
    else if(body.action==='publish'){published++;result={event:{slug:'atx-test'}};}
   }
  }else if(name==='auth-session')result={driver:{id:'00000000-0000-4000-8000-000000000001',display_name:'Admin Test',roles:['admin']},access_token:'test-token'};
  else if(name==='driver-profile')result={driver:{id:'00000000-0000-4000-8000-000000000001',display_name:'Admin Test',profile_confirmed_at:'2026-10-06T00:00:00Z'}};
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin+'/atxracing/fr/acc/admin.html');await page.getByRole('heading',{name:'Créer une course'}).waitFor();assert.equal(await page.getByRole('heading',{name:'Administration ATX Racing',exact:true}).count(),1);assert.equal(await page.locator('.admin-import').count(),0);
 assert.equal(await page.locator('.header-languages a').count(),2);
 assert.equal(imported,0);
 await page.getByRole('button',{name:'Nouveau brouillon manuel'}).first().click();
 await page.getByLabel('Titre français').fill('DR Laguna Seca');await page.getByLabel('Titre anglais').fill('Laguna Seca DR');
 await page.getByLabel('Description française').fill('Course test');await page.getByLabel('Description anglaise').fill('Test race');
 await page.getByLabel('Circuit',{exact:true}).fill('Laguna Seca');await page.getByLabel(/Début officiel/).fill('2026-10-15T20:00');
 await page.getByLabel(/Essais libres/).fill('60');await page.getByLabel(/Qualifications/).fill('15');await page.getByLabel(/Course · minutes/).fill('60');
 await page.getByLabel('Places totales').fill('28');await page.getByLabel(/Affiche/).fill('https://cdn.thesimgrid.com/test.png');
 await page.getByLabel('Lien d’inscription SimGrid').fill('https://www.thesimgrid.com/championships/27666');
 await page.locator('select[name="competition"]').selectOption('DR');await page.getByLabel('Format').selectOption('DR');
 await page.getByRole('button',{name:'Enregistrer le brouillon'}).click();await page.getByText('Brouillon enregistré. Il reste invisible pour les pilotes.').waitFor();
 assert.equal(published,0);assert.equal(drafts.length,1);assert.equal(await page.getByRole('button',{name:'Publier la course'}).count(),1);
 await page.getByLabel('Titre français').fill('DR Laguna Seca modifiée');await page.getByRole('button',{name:'Publier la course'}).click();
 await page.getByText('Course publiée dans le calendrier.').waitFor();assert.equal(saved.at(-1).titleFr,'DR Laguna Seca modifiée');
 await page.getByText('Course publiée dans le calendrier.').waitFor();assert.equal(published,1);
 await page.goto(origin+'/atxracing/en/acc/admin.html');await page.getByRole('button',{name:'New ATX Series schedule'}).click();
 await page.getByLabel('Circuit',{exact:true}).fill('Silverstone');
 await page.getByLabel(/Official session start/).fill('2026-10-15T20:00');await page.getByLabel('Total places').fill('28');
 assert.equal(await page.locator('input[name="imageUrl"]').isVisible(),false);assert.equal(await page.locator('input[name="simgridUrl"]').isVisible(),false);assert.equal(await page.locator('input[name="imageUrl"]').evaluate(x=>x.required),false);
 assert((await page.locator('.admin-poster-preview').getAttribute('src')).endsWith('/assets/circuits/silverstone.webp'));
 await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.getByText('Draft saved. It is still invisible to drivers.').waitFor();assert(saved.at(-1).imageUrl.endsWith('/assets/circuits/silverstone.webp'));
 // Clear the stored default to test automatic images on a new multi-track programme.
 await page.getByRole('button',{name:'Back to list'}).click();await page.getByRole('button',{name:'New ATX Series schedule'}).click();
 await page.getByLabel(/Official session start/).fill('2026-10-15T20:00');await page.getByLabel('ATX Series schedule tracks').fill('Silverstone\nSpa');
 await page.getByRole('button',{name:'Create ATX Series drafts',exact:true}).click();await page.getByText('Draft saved. It is still invisible to drivers.').waitFor();
 assert(saved.at(-2).imageUrl.endsWith('/assets/circuits/silverstone.webp'));assert(saved.at(-1).imageUrl.endsWith('/assets/circuits/spa.webp'));
 assert.equal(Date.parse(saved.at(-1).startsAt)-Date.parse(saved.at(-2).startsAt),90*60000);
 await page.getByRole('button',{name:'New ATX Series schedule'}).click();await page.getByLabel('Circuit',{exact:true}).fill('Silverstone');assert.equal(await page.getByLabel('SimGrid registration link').isVisible(),false);await page.evaluate(()=>{document.querySelector('[name=simgridUrl]').value='invalid-link';document.querySelector('[name=imageUrl]').value='http://invalid-poster.test';});await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.getByText('Draft saved. It is still invisible to drivers.').waitFor();assert.equal(saved.at(-1).simgridUrl,'');assert(saved.at(-1).imageUrl.endsWith('/assets/circuits/silverstone.webp'));assert.equal(saved.at(-1).startsAt,'');
 await page.getByRole('button',{name:'Back to list'}).click();await page.getByRole('button',{name:'New manual draft'}).click();await page.locator('[name=competition]').selectOption('WGT');await page.locator('[name=format]').selectOption('WGT_ENDURANCE');await page.locator('[name=registrationMode]').selectOption('site');assert.equal(await page.locator('[name=simgridUrl]').isVisible(),false);await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.getByText('Draft saved. It is still invisible to drivers.').waitFor();assert.equal(saved.at(-1).registrationMode,'site');assert.equal(saved.at(-1).simgridUrl,'');
 // Publish a new ATXS course directly, with errors beside its controls and no preliminary save.
 await page.getByRole('button',{name:'Back to list'}).click();await page.getByRole('button',{name:'New ATX Series schedule'}).click();
 const before=saved.length;await page.getByRole('button',{name:'Publish race',exact:true}).click();await page.locator('.admin-editor .form-status').filter({hasText:'Choose a catalogue track'}).waitFor();assert.equal(saved.length,before);
 await page.getByLabel('Circuit',{exact:true}).fill('Spa');await page.getByLabel(/Official session start/).fill('2026-11-13T13:00');
 await page.getByRole('button',{name:'Publish race',exact:true}).click();await page.getByText('Race published in the calendar.',{exact:true}).waitFor();assert.equal(published,2);assert.equal(saved.at(-1).startsAt,'2026-11-13T12:00:00.000Z');
 // Draft deletion is explicit and cancellable.
 await page.getByRole('button',{name:'Delete draft',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(drafts.length,1);
 await page.getByRole('button',{name:'Delete draft',exact:true}).click();await page.getByRole('button',{name:'Confirm deletion',exact:true}).click();await page.getByText('Draft deleted.',{exact:true}).waitFor();assert.equal(drafts.length,0);
 for(const lang of ['fr','en']){await page.goto(origin+'/atxracing/'+lang+'/acc/admin.html');await page.getByRole('button',{name:lang==='fr'?'Modifier l’événement':'Edit event',exact:true}).click();await page.locator('input[type=datetime-local]').first().fill('2026-10-11T20:00');await page.getByRole('button',{name:lang==='fr'?'Enregistrer les modifications':'Save changes',exact:true}).click();await page.getByText(lang==='fr'?'Événement mis à jour.':'Event updated.',{exact:true}).waitFor();assert.equal(edited.id,publishedEvent.id);assert.equal(edited.event.startsAt,'2026-10-11T18:00:00.000Z');}
 await page.getByRole('button',{name:'Delete event',exact:true}).click();assert.equal(eventDeleted,false);await page.getByRole('button',{name:'Confirm deletion',exact:true}).click();await page.getByText('Event deleted.',{exact:true}).waitFor();assert.equal(eventDeleted,true);assert.equal(await page.getByRole('button',{name:'Edit event',exact:true}).count(),0);
 const mediaPanel=page.locator('.admin-media');await mediaPanel.getByLabel('French title',{exact:true}).fill('Replay test');await mediaPanel.getByLabel('English title',{exact:true}).fill('Test replay');await mediaPanel.locator('input[type=url]').fill('https://www.youtube.com/watch?v=synthetic');assert.equal(await mediaPanel.locator('select').nth(1).inputValue(),'');await mediaPanel.getByRole('button',{name:'Publish this link',exact:true}).click();await mediaPanel.locator('.form-status').filter({hasText:'Choose a race from the list'}).waitFor();assert.equal(await mediaPanel.locator('input[type=url]').inputValue(),'https://www.youtube.com/watch?v=synthetic');await mediaPanel.getByRole('button',{name:'Publish this link',exact:true}).click();await page.locator('.admin-media .form-status').filter({hasText:'Media link saved.'}).waitFor();assert.equal(mediaAttempts,2);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');assert.deepEqual(errors,[]);
 console.log('Admin browser checks passed: manual creation without SimGrid import, private save, publish, FR/EN, automatic track images, per-track 90-minute programme without SimGrid or poster fields, and incomplete ATX Series draft saves.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
