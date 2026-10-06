const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/public-data.js','utf8'),storage=new Map();
let now=100000,calls=0,fail=false;
const makePage=()=>{const window={};vm.runInNewContext(source,{window,Map,Date:{now:()=>now,parse:Date.parse},JSON,Number,Error,AbortSignal,sessionStorage:{get length(){return storage.size},key:i=>[...storage.keys()][i],getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},fetch:async()=>{calls++;await Promise.resolve();return {ok:!fail,status:fail?503:200,json:async()=>({drivers:[],generated_at:new Date(now).toISOString()})}}});window.ATX_PUBLIC_LEADERBOARD.clear=window.ATX_CLEAR_PUBLIC_LEADERBOARDS;return window.ATX_PUBLIC_LEADERBOARD};
(async()=>{
 let get=makePage();await Promise.all([get('ALL'),get('ALL')]);assert.equal(calls,1);
 get=makePage();await get('ALL');assert.equal(calls,1,'reuse across page navigation');
 await get('DR');assert.equal(calls,2,'separate categories');
 now+=60001;get=makePage();await get('ALL');assert.equal(calls,3,'expiry re-fetches');
 fail=true;await assert.rejects(get('WGT'));await assert.rejects(get('WGT'));assert.equal(calls,5,'failure allows retry');
 assert([...storage.keys()].every(k=>k.startsWith('atx-public-leaderboard-')));
 storage.set('atx-racing-session','test-session');fail=false;get.clear();assert.equal(storage.size,1);assert.equal(storage.get('atx-racing-session'),'test-session');await get('ALL');assert.equal(calls,6,'profile save invalidates public caches only');
 console.log('PASS: concurrent requests, cross-page reuse, category isolation, expiry and failed-fetch retry; public data only');
})().catch(e=>{console.error(e);process.exitCode=1});
