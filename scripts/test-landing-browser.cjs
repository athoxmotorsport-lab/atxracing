/* Check the Steam-first entrance and signed-in navigation in a real browser. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const output=path.resolve(__dirname,'../.local');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]).replace(/^\/atxracing\//,'');if(!name||name.endsWith('/'))name+='index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{const content=fs.readFileSync(file);res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','js':'text/javascript; charset=utf-8','css':'text/css','jpg':'image/jpeg','png':'image/png','svg':'image/svg+xml','webp':'image/webp'})[file.split('.').pop()]||'application/octet-stream');res.end(content);}catch{res.writeHead(404);res.end();}});
let browser;
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.route('https://fonts.googleapis.com/**',route=>route.abort());await context.route('https://fonts.gstatic.com/**',route=>route.abort());
 await context.route('https://twjpjzalyvbsdpbzhqln.supabase.co/**',route=>route.fulfill({status:401,contentType:'application/json',body:'{"error":"unauthorized"}'}));
 await context.route('https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/auth-session',route=>{
  const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
  if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
  const valid=route.request().method()==='POST'||route.request().headers().authorization==='Bearer test-session';
  return route.fulfill({status:valid?200:401,headers,contentType:'application/json',body:JSON.stringify(valid?{access_token:'test-session',driver:{display_name:'Pilote test'}}:{error:'unauthorized'})});
 });
 const page=await context.newPage();
 await page.goto(origin+'/atxracing/');
 assert.equal(await page.locator('header,footer,.brand,img').count(),0);
 assert.equal(await page.locator('.entry-connect').count(),1);
 assert.equal(await page.locator('.entry-french').getAttribute('lang'),'fr');
 assert.equal(await page.locator('.entry-english').getAttribute('lang'),'en');
 assert.deepEqual(await page.locator('.entry-english > *').allTextContents(),[
  'Sign in with Steam to access races and create your driver profile.',
  'THE PADDOCK AWAITS YOU.',
  'ONE ACCOUNT. YOUR PLACE ON THE GRID.'
 ]);
 assert.match(await page.locator('.entry-connect').innerText(),/Se connecter avec Steam\s+Sign in with Steam/);
 assert((await page.locator('.entry-connect').getAttribute('href')).includes('auth-steam?return_path=/atxracing/fr/acc/profile.html'));
 assert(await page.locator('.entry h1').evaluate(el=>getComputedStyle(el).fontSize)===await page.locator('.entry-english h2').evaluate(el=>getComputedStyle(el).fontSize));
 assert(await page.locator('.entry-lead').evaluate(el=>getComputedStyle(el).fontSize)===await page.locator('.entry-english-lead').evaluate(el=>getComputedStyle(el).fontSize));
 assert(await page.locator('.entry-connect > span:nth-child(2)').evaluate(el=>getComputedStyle(el).fontSize)===await page.locator('.entry-connect small').evaluate(el=>getComputedStyle(el).fontSize));
 await page.screenshot({path:path.join(output,'steam-entry-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:path.join(output,'steam-entry-mobile.png'),fullPage:true});
 await page.setViewportSize({width:1440,height:900});
 await page.goto(origin+'/atxracing/fr/acc/');await page.waitForURL(origin+'/atxracing/');
 await page.goto(origin+'/atxracing/fr/acc/profile.html#steam_code=test-code');await page.waitForURL(origin+'/atxracing/fr/');
 assert.equal(await page.locator('.side-dock a').count(),8);
 assert.equal(await page.locator('.header-languages a').count(),2);
 assert.equal(await page.locator('[data-driver-name]').innerText(),'Pilote test');
 await page.locator('.side-dock a[aria-label="Calendrier"]').hover();
 assert(await page.locator('.side-dock a[aria-label="Calendrier"] span').isVisible());
 assert.equal(await page.getByRole('heading',{name:'MON PADDOCK.'}).count(),1);
 assert.equal(await page.locator('.paddock-game').count(),2);
 const headerCenter=await page.evaluate(()=>{const first=document.querySelector('.top-inner .brand').getBoundingClientRect(),last=document.querySelector('.top-inner .steam-connect').getBoundingClientRect();return(first.left+last.right)/2});
 assert(Math.abs(headerCenter-720)<30,'header is centered');
 await page.locator('.paddock-game img').first().evaluate(img=>img.decode());
 await page.screenshot({path:path.join(output,'signed-in-paddock-desktop.png'),fullPage:true});
 await page.setViewportSize({width:2560,height:1440});
 const homeBackground=await page.evaluate(()=>{const style=getComputedStyle(document.body,'::before');return{position:style.position,size:style.backgroundSize.split(',').at(-1).trim(),repeat:style.backgroundRepeat.split(',').at(-1).trim(),images:style.backgroundImage.match(/site-background\.jpg/g)?.length||0}});
 assert.deepEqual(homeBackground,{position:'fixed',size:'cover',repeat:'no-repeat',images:1});
 await page.screenshot({path:path.join(output,'signed-in-paddock-wide.png'),fullPage:true});
 await page.setViewportSize({width:1440,height:900});
 await page.locator('.paddock-intro .eyebrow').click();await page.getByRole('heading',{name:'À propos'}).waitFor();
 await page.locator('.header-languages a[lang=en]').click();await page.getByRole('heading',{name:'About'}).waitFor();
 await page.locator('.game-switch a',{hasText:'ACC'}).click();await page.locator('.league-overview').waitFor();await page.waitForLoadState('load');assert(new URL(page.url()).pathname.endsWith('/en/acc/'));
 const fixed=await page.evaluate(()=>({position:getComputedStyle(document.body,'::before').position,image:getComputedStyle(document.body,'::before').backgroundImage}));
 assert.equal(fixed.position,'fixed');assert(fixed.image.includes('site-background.jpg'));
 await page.screenshot({path:path.join(output,'acc-background-desktop.png'),fullPage:true});
 await page.goto(origin+'/atxracing/fr/');await page.locator('.paddock-game').first().click();await page.waitForURL('**/fr/acc/');
 await page.goto(origin+'/atxracing/fr/');await page.locator('.paddock-game').last().click();await page.waitForURL('**/fr/ace/');
 await page.goto(origin+'/atxracing/acc/');await page.waitForURL('**/fr/acc/');
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/atxracing/fr/');
 assert(await page.locator('.paddock-games').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert(await page.locator('.side-dock').isVisible());
 await page.screenshot({path:path.join(output,'landing-mobile.png'),fullPage:true});
 await page.locator('.paddock-profile-link').click();await page.getByRole('heading',{name:'Profil pilote'}).waitFor();
 console.log('Landing checks passed: Steam callback, bilingual entrance, gated paddock, icon dock, ACC/ACE cards, fixed background and mobile navigation.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
