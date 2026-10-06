/* Isolated circuit UI regression: mocked public data, no production writes. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,pathname.replace(/^\/atxracing\//,''));
 if(!file.startsWith(root+path.sep)){console.error('Rejected test path',pathname);res.writeHead(403);return res.end()}
 try{res.setHeader('Content-Type',({'html':'text/html','js':'text/javascript','css':'text/css','webp':'image/webp'})[file.split('.').pop()]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--proxy-bypass-list=localhost;127.0.0.1']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const driver={id:'test',display_name:'Alex',profile_confirmed_at:'2026-10-01T00:00:00Z'};
 const entries=[{driver_id:'test',profile_id:'test',display_name:'Alex',best_lap_ms:103985,car_model_name:'Porsche 992 GT3 R'},{driver_id:'unknown',display_name:'Pilote historique',best_lap_ms:105000,car_model_name:'Unknown model'}];
 const errors=[];
 await context.route('https://**/*',async route=>{
  const name=new URL(route.request().url()).pathname.split('/').pop();
  const body=name==='auth-session'?{driver,access_token:'test-token'}:name==='driver-profile'?{driver}:name==='public-leaderboard'?{drivers:[{driver_id:'test',performance_class:'alien'}],circuits:[{circuit_key:'barcelona',drivers:entries},{circuit_key:'spa',drivers:entries}]}:{};
  await route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'},body:JSON.stringify(body)});
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>sessionStorage.setItem('atx-racing-session','test-token'));
 await page.goto('http://127.0.0.1:'+server.address().port+'/atxracing/fr/acc/circuits.html');
 await page.locator('.circuit-lap-row').first().waitFor({timeout:10000}).catch(async e=>{console.error('Circuit diagnostic',page.url(),errors,await page.locator('body').innerText());throw e});
 assert.equal(await page.locator('.record-card').count(),25);
 await page.locator('.record-card[data-key=spa]').click();
 assert.equal(await page.locator('#record-spotlight h2').innerText(),'Spa-Francorchamps');
 assert.equal(await page.locator('.circuit-lap-row').count(),2);
 assert.equal(await page.locator('.circuit-lap-row').first().getAttribute('data-level'),'alien');
 assert.equal(await page.locator('.circuit-lap-row').nth(1).getAttribute('data-level'),null);
 assert.equal(await page.locator('.circuit-lap-car img').getAttribute('alt'),'Porsche 992 GT3 R');
 await page.locator('.circuit-lap-car img').evaluate(img=>img.decode());
 assert.equal(await page.locator('.circuit-lap-timing small').nth(1).innerText(),'+1.015 s');
 assert(await page.locator('#record-spotlight').evaluate(el=>el.getBoundingClientRect().top<innerHeight));
 assert.equal(await page.locator('#record-spotlight h2').evaluate(el=>el===document.activeElement),true);
 await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');
 await page.locator('#record-spotlight').evaluate(el=>el.scrollIntoView({block:'start'}));
 fs.mkdirSync(path.resolve(__dirname,'../.local'),{recursive:true});
 await page.screenshot({path:path.resolve(__dirname,'../.local/circuits-mobile.png')});
 assert.deepEqual(errors,[]);
 console.log('PASS: circuit selection, scroll/focus, car artwork, verified level, neutral unknown driver, lap gap and mobile layout');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server.close()});
