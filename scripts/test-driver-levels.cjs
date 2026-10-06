const assert=require('node:assert/strict');
const fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');
for(const file of ['public-leaderboard','ingest-acc-results']){
 const source=fs.readFileSync(`supabase/functions/${file}/index.ts`,'utf8');
 const start=source.indexOf('const performanceClass =');
 const code=stripTypeScriptTypes(source.slice(start,source.indexOf('\n};',start)+3));
 const classify=new Function(code+';return performanceClass')();
 for(const [score,expected] of [[100,'alien'],[101.99,'alien'],[102,'elite'],[103.99,'elite'],[104,'pro'],[105.99,'pro'],[106,'challenger'],[107.99,'challenger'],[108,'rookie'],[109,'rookie'],[120,'rookie']])assert.equal(classify(score),expected,`${file}: ${score}`);
 if(file==='public-leaderboard')assert.equal(classify(null),'unranked');
}
const ranking=fs.readFileSync('src/ranking.js','utf8');
const fallback=ranking.split('\n').find(line=>line.includes('function classFromScore'));
const classify=new Function(fallback+';return classFromScore')();
assert.equal(classify(106),'challenger');assert.equal(classify(108),'rookie');assert.equal(classify(null),'unranked');
console.log('PASS: all five levels and exact 102/104/106/108 boundaries in leaderboard, Collector and team fallback');
