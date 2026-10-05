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
 let drafts=[],published=0,imported=0;
 await context.route('https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/**',async route=>{
  const request=route.request(),name=new URL(request.url()).pathname.split('/').pop();let result={},status=200;
  if(name==='atx-event-admin'){
   if(request.method()==='GET')result={drafts};
   else{const body=request.postDataJSON();if(body.action==='import'){imported++;status=503;result={error:'simgrid_token_required'};}
    else if(body.action==='save'){const record={id:'00000000-0000-4000-8000-000000000001',draft:{...body.draft,circuitKey:'laguna_seca',schedule:[]},status:'draft'};drafts=[record];result={draft:record};status=201;}
    else if(body.action==='publish'){published++;result={event:{slug:'atx-test'}};}
   }
  }else if(name==='auth-session')result={driver:{id:'00000000-0000-4000-8000-000000000001',display_name:'Admin Test',roles:['admin']},access_token:'test-token'};
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin+'/atxracing/fr/acc/admin.html');await page.getByRole('heading',{name:'Importer depuis SimGrid'}).waitFor();
 assert.equal(await page.locator('.header-languages a').count(),2);
 await page.getByLabel('Lien du championnat SimGrid').fill('https://www.thesimgrid.com/championships/27666');
 await page.getByRole('button',{name:'Lire la page publique'}).click();await page.getByText(/jeton API de votre communauté/).waitFor();assert.equal(imported,1);
 await page.getByRole('button',{name:'Nouveau brouillon manuel'}).first().click();
 await page.getByLabel('Titre français').fill('DR Laguna Seca');await page.getByLabel('Titre anglais').fill('Laguna Seca DR');
 await page.getByLabel('Description française').fill('Course test');await page.getByLabel('Description anglaise').fill('Test race');
 await page.getByLabel('Circuit',{exact:true}).fill('Laguna Seca');await page.getByLabel(/Début officiel/).fill('2026-10-15T20:00');
 await page.getByLabel(/Essais libres/).fill('60');await page.getByLabel(/Qualifications/).fill('15');await page.getByLabel(/Course · minutes/).fill('60');
 await page.getByLabel('Places totales').fill('28');await page.getByLabel(/Affiche/).fill('https://cdn.thesimgrid.com/test.png');
 await page.getByLabel('Lien d’inscription SimGrid').fill('https://www.thesimgrid.com/championships/27666');
 await page.getByLabel('Compétition').selectOption('DR');await page.getByLabel('Format').selectOption('DR');
 await page.getByRole('button',{name:'Enregistrer le brouillon'}).click();await page.getByText('Brouillon enregistré. Il reste invisible pour les pilotes.').waitFor();
 assert.equal(published,0);assert.equal(drafts.length,1);assert.equal(await page.getByRole('button',{name:'Publier la course'}).count(),1);
 await page.getByLabel('Titre français').fill('DR Laguna Seca modifiée');await page.getByRole('button',{name:'Publier la course'}).click();
 await page.getByText('Enregistrez vos modifications avant de publier.').waitFor();assert.equal(published,0);
 await page.getByLabel('Titre français').fill('DR Laguna Seca');await page.getByRole('button',{name:'Publier la course'}).click();
 await page.getByText('Course publiée dans le calendrier.').waitFor();assert.equal(published,1);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');assert.deepEqual(errors,[]);
 console.log('Admin browser checks passed: missing SimGrid API token, editable draft, private save, stale edit guard, publish and mobile.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
