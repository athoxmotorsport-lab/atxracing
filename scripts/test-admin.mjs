import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSimgrid,simgridUrl} from '../supabase/functions/atx-event-admin/simgrid.mjs';

const url='https://www.thesimgrid.com/championships/27666';
const info=`<meta property="og:url" content="${url}"><meta property="og:image" content="https://cdn.thesimgrid.com/poster.png"><h1 class="event-title">DAILY RACE LAGUNA SECA</h1><div class="badge-counter"><span>8</span><span>28</span></div><div class="schedule-card"><time datetime="2026-10-01T18:45:00Z"></time><div class="schedule-track">Laguna Seca</div><strong>1h15m</strong><span>p1</span><strong>15m</strong><span>q1</span><strong>1h</strong><span>r1</span></div><div class="schedule-card"><time datetime="2026-10-02T18:45:00Z"></time><div class="schedule-track">Spa</div><strong>1h</strong><span>p1</span><strong>15m</strong><span>q1</span><strong>1h</strong><span>r1</span></div>`;
const races=`<button class="race-card" data-race-panel-url="/championships/27666/races/269256/panel"><span class="race-card-title">Round 1</span><span class="d-block fs-xs text-white-90">Laguna Seca</span><time datetime="2026-10-01T18:45:00Z"></time></button><button class="race-card" data-race-panel-url="/championships/27666/races/269257/panel"><span class="race-card-title">Round 2</span><span class="d-block fs-xs text-white-90">Spa</span><time datetime="2026-10-02T18:45:00Z"></time></button>`;

test('canonical SimGrid links prevent arbitrary server fetches',()=>{
 assert.equal(simgridUrl(url+'/'),url);
 for(const candidate of ['http://www.thesimgrid.com/championships/1','https://evil.test/championships/1','https://www.thesimgrid.com@evil.test/championships/1','https://www.thesimgrid.com/championships/1/races'])assert.throws(()=>simgridUrl(candidate),/invalid_simgrid_url/);
});
test('one championship becomes separate reviewable rounds without guessed format',()=>{
 const result=parseSimgrid(info,races,url);assert.equal(result.rounds.length,2);
 assert.deepEqual(result.rounds.map(r=>r.sourceKey),['27666:269256','27666:269257']);
 assert.equal(result.rounds[0].registered,8);assert.equal(result.rounds[0].maxDrivers,28);
 assert.equal(result.rounds[0].practiceMinutes,75);assert.equal(result.rounds[0].qualifyingMinutes,15);
 assert.equal(result.rounds[0].competition,'');assert.equal(result.rounds[0].format,'');
 assert.equal(result.rounds[0].descriptionFr,'');
});
test('blocked and unrelated pages are rejected',()=>{
 assert.throws(()=>parseSimgrid('Just a moment',races,url),/simgrid_access_blocked/);
 assert.throws(()=>parseSimgrid('<h1 class="event-title">Fake</h1><meta property="og:url" content="https://elsewhere.test">',races,url),/simgrid_unreadable/);
});

let handler;
globalThis.Deno={env:{get:name=>({SESSION_SECRET:'unit-test-secret',ATX_SITE_URL:'https://example.test',SUPABASE_URL:'https://database.test',SUPABASE_SERVICE_ROLE_KEY:'unit-test-service-key'})[name]},serve:fn=>{handler=fn;}};
await import('../supabase/functions/atx-event-admin/index.ts');
const headers={Origin:'https://example.test',Authorization:'Bearer '+'a'.repeat(43),'Content-Type':'application/json'};
const originalFetch=globalThis.fetch;
const draft={sourceKey:'27666:269256',titleFr:'Course',titleEn:'Race',descriptionFr:'Description française',descriptionEn:'English description',circuit:'Laguna Seca',circuitKey:'laguna_seca',startsAt:'2026-10-01T18:45:00Z',serverOpensAt:'2026-10-01T18:00:00Z',practiceMinutes:60,qualifyingMinutes:15,raceMinutes:60,maxDrivers:28,imageUrl:'https://cdn.thesimgrid.com/poster.png',simgridUrl:url,competition:'DR',format:'DR'};
const id='00000000-0000-4000-8000-000000000001';
function mockDatabase(draftRow){let rpcCalls=0;globalThis.fetch=async(input,options)=>{const target=String(input);if(target.includes('/auth_sessions?'))return Response.json([{driver_id:id}]);if(target.includes('/driver_roles?'))return Response.json([{role:'admin'}]);if(target.includes('/atx_event_drafts?select=id&source_key'))return Response.json([]);if(target.includes('/atx_event_drafts?id=eq.'))return Response.json([draftRow]);if(target.endsWith('/rpc/publish_atx_event_draft')){rpcCalls++;return Response.json({id,slug:'atx-test',already_published:false});}if(target.endsWith('/atx_event_drafts'))return Response.json([{id,draft:JSON.parse(options.body).draft,status:'draft'}]);throw Error(target);};return ()=>rpcCalls;}
test('admin role and origin are required before any import or publication',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return Response.json([]);};
 assert.equal((await handler(new Request('https://edge.test',{method:'GET'}))).status,401);assert.equal(calls,0);
 assert.equal((await handler(new Request('https://edge.test',{method:'GET',headers:{...headers,Origin:'https://foreign.test'}}))).status,403);assert.equal(calls,0);
 assert.equal((await handler(new Request('https://edge.test',{method:'GET',headers}))).status,401);
 globalThis.fetch=async input=>String(input).includes('/auth_sessions?')?Response.json([{driver_id:id}]):Response.json([]);
 assert.equal((await handler(new Request('https://edge.test',{method:'GET',headers}))).status,403);
});
test('saving a round creates a private draft; publication requires reviewed official durations',async()=>{
 const rpcCount=mockDatabase({id,draft,status:'draft'});
 const save=await handler(new Request('https://edge.test',{method:'POST',headers,body:JSON.stringify({action:'save',draft:{...draft,practiceMinutes:75}})}));
 assert.equal(save.status,201);assert.equal((await save.json()).draft.draft.schedule.length,3);assert.equal(rpcCount(),0);
 const publish=await handler(new Request('https://edge.test',{method:'POST',headers,body:JSON.stringify({action:'publish',id})}));
 assert.equal(publish.status,200);assert.equal(rpcCount(),1);
 const invalid=mockDatabase({id,draft:{...draft,practiceMinutes:75},status:'draft'});
 const denied=await handler(new Request('https://edge.test',{method:'POST',headers,body:JSON.stringify({action:'publish',id})}));
 assert.equal(denied.status,400);assert.equal(invalid(),0);
 globalThis.fetch=originalFetch;
});
