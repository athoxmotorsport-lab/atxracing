/* Controlled latency: compare the old gate with current navigation, then check auth failures. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist'),oldGate=fs.readFileSync(path.join(__dirname,'fixtures/gate-before-navigation.js'),'utf8');
const server=http.createServer((req,res)=>{let pathname=new URL(req.url,'http://localhost').pathname.replace(/^\/atxracing\//,'');if(!pathname||pathname.endsWith('/'))pathname+='index.html';const file=path.resolve(root,pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{res.setHeader('Content-Type',({'html':'text/html','js':'text/javascript','css':'text/css','webp':'image/webp','woff2':'font/woff2'})[file.split('.').pop()]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/chromium'});const origin='http://127.0.0.1:'+server.address().port;
 const driver={id:'11111111-1111-4111-8111-111111111111',display_name:'Test',profile_confirmed_at:'2026-10-07T00:00:00Z'};
 async function context(baseline=false,status=200,confirmed=true){
  const c=await browser.newContext({viewport:{width:1440,height:900}});await c.addInitScript(()=>{if(location.pathname.includes('.html'))sessionStorage.setItem('atx-racing-session','test-token');});const counts={auth:0,feed:0,inbox:0,full:0,externalFonts:0};
  if(baseline)await c.route('**/assets/gate.min.js*',r=>r.fulfill({contentType:'text/javascript',body:oldGate}));
  await c.route('https://**/*',async r=>{const req=r.request(),u=new URL(req.url()),name=u.pathname.split('/').pop(),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};if(req.method()==='OPTIONS')return r.fulfill({status:204,headers});let data={},responseStatus=200;
   if(u.hostname.startsWith('fonts.')){counts.externalFonts++;return r.abort();}
   if(name==='auth-session'){counts.auth++;if(u.searchParams.get('view')!=='identity')counts.full++;await new Promise(resolve=>setTimeout(resolve,1200));responseStatus=status;data=status===200?{driver:{...driver,profile_confirmed_at:confirmed?driver.profile_confirmed_at:null}}:{error:'unavailable'};}
   if(name==='driver-profile')data={driver:{...driver,profile_confirmed_at:confirmed?driver.profile_confirmed_at:null}};
   if(name==='public-event'){counts.feed++;data={events:[],notifications:[],today:[],archives:[],media:[]};}
   if(name==='public-leaderboard')data={drivers:[],circuits:[],teams:[]};
   if(name==='driver-messages'){if(u.searchParams.get('view')==='inbox')counts.inbox++;data={unread:0};}
   await r.fulfill({status:responseStatus,contentType:'application/json',headers,body:JSON.stringify(data)});
  });return {c,counts};
 }
 const times=[];
 for(const baseline of [true,false]){
  const {c,counts}=await context(baseline),p=await c.newPage();const start=performance.now();await p.goto(origin+'/atxracing/fr/acc/courses.html',{waitUntil:'domcontentloaded'});await p.locator('.format-card').first().waitFor({state:'visible'});times.push(Math.round(performance.now()-start));
  if(!baseline){assert.equal(counts.feed,1,'page and notices share the public feed');assert.equal(counts.full,0);await p.waitForTimeout(1250);await p.goto(origin+'/atxracing/fr/acc/calendar.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1250);await p.goto(origin+'/atxracing/en/acc/live.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1250);assert.equal(counts.auth,3,'session is checked on every page');assert.equal(counts.feed,1,'public feed reused between pages and languages');assert.equal(counts.inbox,0,'header never downloads message bodies');assert.equal(counts.externalFonts,0);}
  await c.close();
 }
 assert.ok(times[0]>=1200,'baseline waits for remote session');console.log(`Controlled 1200 ms Steam response: public page visible in ${times[0]} ms before, ${times[1]} ms after.`);
 {const {c}=await context(false,401),p=await c.newPage();await p.goto(origin+'/atxracing/fr/acc/courses.html');await p.waitForURL(origin+'/atxracing/');assert.equal(await p.evaluate(()=>sessionStorage.getItem('atx-racing-session')),null);await c.close();}
 {const {c}=await context(false,503),p=await c.newPage();await p.goto(origin+'/atxracing/fr/acc/courses.html');await p.locator('.session-retry').waitFor();assert.equal(await p.evaluate(()=>sessionStorage.getItem('atx-racing-session')),'test-token');assert.ok(await p.locator('.format-card').first().isVisible());await c.close();}
 {const {c}=await context(false,200,false),p=await c.newPage();await p.goto(origin+'/atxracing/fr/acc/courses.html');await p.waitForURL('**/profile.html?onboarding=1');await c.close();}
 console.log('PASS: public paint, shared feed, fresh Steam checks, lightweight badge, expiry redirect, transient retry and required onboarding.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
