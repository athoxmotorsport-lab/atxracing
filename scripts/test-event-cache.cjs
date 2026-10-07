const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/public-data.js','utf8'),storage=new Map();let now=100000,calls=[],fail=false;
function page(){const window={};vm.runInNewContext(source,{window,Map,Date:{now:()=>now,parse:Date.parse},JSON,Number,Error,AbortSignal,sessionStorage:{get length(){return storage.size},key:i=>[...storage.keys()][i],getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},fetch:async url=>{calls.push(url);await Promise.resolve();return {ok:!fail,json:async()=>url.includes('slug=')?{event:{slug:new URL(url).searchParams.get('slug')}}:{events:[],notifications:[],archives:[]}};}});return window;}
(async()=>{
 let w=page();await Promise.all([w.ATX_PUBLIC_EVENTS(),w.ATX_PUBLIC_EVENTS()]);assert.equal(calls.length,1,'notifications and page share one request');
 w=page();await w.ATX_PUBLIC_EVENTS();assert.equal(calls.length,1,'navigation reuses public feed');
 await w.ATX_PUBLIC_EVENTS('archives');await w.ATX_PUBLIC_EVENTS('atx-test');assert.equal(calls.length,3,'archive and race detail have separate cache entries');
 now+=30001;await w.ATX_PUBLIC_EVENTS();assert.equal(calls.length,4,'freshness expires after 30 seconds');
 fail=true;await assert.rejects(w.ATX_PUBLIC_EVENTS('other-race'));await assert.rejects(w.ATX_PUBLIC_EVENTS('other-race'));assert.equal(calls.length,6,'failure remains retryable');
 storage.set('atx-racing-session','private-token');w.ATX_CLEAR_PUBLIC_EVENTS();assert.equal(storage.size,1);assert.equal(storage.get('atx-racing-session'),'private-token');
 console.log('PASS: one public event request, cross-page reuse, 30-second expiry, isolated details, private session preserved.');
})().catch(e=>{console.error(e);process.exitCode=1;});
