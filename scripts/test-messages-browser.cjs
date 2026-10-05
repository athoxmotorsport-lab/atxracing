const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');

(async()=>{
 const root=path.resolve(__dirname,'../dist');
 const server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]).replace(/^\/atxracing\//,'');if(!name||name.endsWith('/'))name+='index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}try{const content=fs.readFileSync(file);res.setHeader('Content-Type',({'html':'text/html','js':'text/javascript','css':'text/css','svg':'image/svg+xml'})[file.split('.').pop()]||'application/octet-stream');res.end(content)}catch{res.writeHead(404);res.end()}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const me='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',peer='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 const driver={id:peer,display_name:'Pilote Test',team_name:'ATX'};const messages=[];let blocked=false;
 try{
  const context=await browser.newContext({viewport:{width:1365,height:900}});
  await context.addInitScript(()=>sessionStorage.setItem('atx-racing-session','test-token'));
  await context.route('**/functions/v1/auth-session',route=>route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':origin},contentType:'application/json',body:JSON.stringify({driver:{id:me,display_name:'Test'}})}));
  await context.route('**/functions/v1/public-event',route=>route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':origin},contentType:'application/json',body:JSON.stringify({notifications:[],today:[],events:[]})}));
  await context.route('**/functions/v1/driver-messages**',async route=>{
   const request=route.request(),url=new URL(request.url());let body={},status=200;
   if(request.method()==='GET'&&url.searchParams.get('view')==='directory')body={drivers:[driver]};
   else if(request.method()==='GET'&&url.searchParams.get('view')==='thread')body={peer:driver,messages,blocked};
   else if(request.method()==='GET')body={conversations:messages.length?[{peer_id:peer,driver,last_message:messages.at(-1).body,created_at:messages.at(-1).created_at,unread:0}]:[],unread:0};
   else{const input=request.postDataJSON();if(input.action==='send'){const message={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',sender_id:me,recipient_id:peer,body:input.body,created_at:new Date().toISOString(),read_at:null};messages.push(message);body={message};status=201}else if(input.action==='block'){blocked=true;body={blocked}}else if(input.action==='unblock'){blocked=false;body={blocked}}else body={ok:true}}
   await route.fulfill({status,headers:{'Access-Control-Allow-Origin':origin},contentType:'application/json',body:JSON.stringify(body)});
  });
  const page=await context.newPage();await page.goto(origin+'/atxracing/fr/acc/messages.html');
  await page.locator('.messages-person').first().waitFor();
  await page.locator('.messages-drivers .messages-person').first().click();
  await page.locator('.messages-text').fill('Bonjour pilote');await page.locator('.messages-send').click();
  await page.waitForFunction(()=>document.querySelector('.messages-bubble')?.textContent.includes('Bonjour pilote'));
  assert.equal(messages.length,1);assert.equal(messages[0].recipient_id,peer);
  await page.locator('.messages-block').click();assert.equal(blocked,true);assert.equal(await page.locator('.messages-text').isDisabled(),true);
  await page.locator('.messages-block').click();assert.equal(blocked,false);
  await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('.messages-conversation').isVisible(),true);
  await page.goto(origin+'/atxracing/en/ace/messages.html');await page.locator('.messages-search').waitFor();assert.equal(await page.locator('.messages-search-label').innerText(),'Find a driver');
  console.log('Private messages FR/EN, send, block/unblock and mobile layout: OK');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
