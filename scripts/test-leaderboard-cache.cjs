const assert=require('node:assert/strict');
const fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');
const source=fs.readFileSync('supabase/functions/public-leaderboard/index.ts','utf8');
const cacheCode=stripTypeScriptTypes(source.slice(source.indexOf('const responseCache =')));
let handler,calls=0,now=0,fail=false;
const build=async request=>{calls++;await Promise.resolve();return new Response(JSON.stringify({call:calls,category:new URL(request.url).searchParams.get('category')}),{status:fail?500:200})};
new Function('Deno','buildLeaderboard','Date',cacheCode)({serve:fn=>handler=fn},build,{now:()=>now});
const request=category=>new Request('https://example.test/?category='+category);
(async()=>{
 const responses=await Promise.all([handler(request('DR')),handler(request('DR'))]);
 assert.equal(calls,1,'concurrent callers share one build');
 assert.deepEqual(await responses[0].json(),await responses[1].json());
 await handler(request('DR'));assert.equal(calls,1,'successful response reused');
 await handler(request('WGT'));assert.equal(calls,2,'categories stay separate');
 now=60001;await handler(request('DR'));assert.equal(calls,3,'cache expires after 60 seconds');
 fail=true;await handler(request('ATXS'));await handler(request('ATXS'));assert.equal(calls,5,'errors never cached');
 console.log('PASS: shared concurrent build, scope isolation, 60-second expiry and uncached errors');
})().catch(error=>{console.error(error);process.exitCode=1});
