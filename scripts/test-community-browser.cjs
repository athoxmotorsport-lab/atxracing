const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'../dist');
 const server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]).replace(/^\/atxracing\//,'');if(!name||name.endsWith('/'))name+='index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}try{const content=fs.readFileSync(file);res.setHeader('Content-Type',({'html':'text/html','js':'text/javascript','css':'text/css','jpg':'image/jpeg','webp':'image/webp'})[file.split('.').pop()]||'application/octet-stream');res.end(content)}catch{res.writeHead(404);res.end()}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(()=>sessionStorage.setItem('atx-racing-session','test'));
 await context.route('**/functions/v1/auth-session*',route=>route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':origin},contentType:'application/json',body:JSON.stringify({driver:{display_name:'Test'}})}));
 await context.route('**/functions/v1/driver-profile',route=>route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':origin},contentType:'application/json',body:JSON.stringify({driver:{display_name:'Test',profile_confirmed_at:'2026-10-06T00:00:00Z'}})}));
  await context.route('**/functions/v1/driver-messages**',route=>route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':origin},contentType:'application/json',body:JSON.stringify({conversations:[],unread:2})}));
  const notices=[{id:'a',type:'results_published',title_fr:'Résultat',title_en:'Result',message_fr:'Course publiée',message_en:'Race published',related_link:'course.html?event=sample-race'},{id:'b',type:'circuit_record',title_fr:'Record',title_en:'Record',message_fr:'Record du circuit',message_en:'Track record',related_link:'classement.html#circuit'}];
  await context.route('**/functions/v1/public-event*',route=>route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':origin},contentType:'application/json',body:JSON.stringify({notifications:notices,today:[],events:[],archives:[]})}));
  const page=await context.newPage();
  await page.goto(origin+'/atxracing/fr/acc/archives.html');
  const bell=page.locator('.community-bell');await bell.waitFor();await page.waitForFunction(()=>document.querySelector('.community-count')?.textContent==='2');
  await page.waitForFunction(()=>document.querySelector('.community-message-link .community-count')?.textContent==='2');
  await bell.click();assert.equal(await page.locator('.community-notice').count(),2);
  assert.equal(await page.locator('.community-notice').first().getAttribute('href'),'/atxracing/fr/acc/course.html?slug=sample-race');
  assert.equal(await page.locator('.community-notice').last().getAttribute('href'),'/atxracing/fr/acc/records.html');
  assert.equal(await page.locator('.community-notification-shell .community-count').isHidden(),true);
  await page.locator('.discord-tab').click();assert.equal(await page.locator('.discord-widget').getAttribute('src'),'https://discord.com/widget?id=1542830665039487058&theme=dark');
  await page.locator('.discord-close').click();assert.equal(await page.locator('.discord-drawer').isHidden(),true);
  await page.setViewportSize({width:390,height:844});await page.locator('.discord-tab').click();assert.equal(await page.locator('.discord-drawer').isVisible(),true);
  await page.goto(origin+'/atxracing/en/acc/archives.html');await page.locator('.community-bell').waitFor();await page.locator('.community-bell').click();assert.equal(await page.locator('.community-notice').first().locator('strong').innerText(),'Result');
  console.log('Notifications FR/EN, links, read state, Discord drawer, desktop/mobile: OK');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
