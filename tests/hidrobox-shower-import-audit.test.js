'use strict';
/* Regression audit against the price rows already imported from the manufacturer PDF.
   This checks the database is internally consistent, NOT that every PDF row was imported. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
const raw=fs.readFileSync(path.join(__dirname,'../public/brand-data/hidrobox-config-01.b64'),'utf8').trim();
const catalog=JSON.parse(zlib.gunzipSync(Buffer.from(raw,'base64')).toString('utf8'));
const groups=catalog.groups||[];
const rows=groups.flatMap(g=>(g.variants||[]).map(v=>({group:g.collection||g.family||g.model||g.id,...v})));
const showerPrefixes=['SNEC','SLIC','STWC','SQUC','SONC','SPUC','SARC','SLOC','SUNC','SINC'];
const showers=rows.filter(v=>showerPrefixes.some(p=>String(v.reference||'').startsWith(p)));
test('Hidrobox source is parseable and shower-tray price records are populated',()=>{
 assert(groups.length>0,'supplier catalog groups missing');
 assert(rows.length>100,'supplier tariff variants unexpectedly empty');
 assert(showers.length>200,'shower tray tariff entries unexpectedly few');
 console.log('Hidrobox catalogue audit: groups='+groups.length+' variants='+rows.length+' priced shower-tray refs='+showers.length);
 console.log('Hidrobox shower-tray sources: '+[...new Set(showers.map(x=>x.group))].join(', '));
});
test('Known 2026 PDF supplier SKU/price anchors match the stored primary rows',()=>{
 const anchors={SNEC0001:522,SLIC0533:657,STWC0097:689,SQUC0001:624,SONC0439:428};
 for(const [sku,rawExpected] of Object.entries(anchors)){
   const matches=showers.filter(v=>v.reference===sku);
   assert(matches.length>0,'source SKU absent: '+sku);
   for(const row of matches)assert.equal(Number(row.rawPrice),rawExpected,sku);
 }
});
test('Every imported priced shower tray has valid reference and exactly one +4% supplier uplift',()=>{
 const errors=[];
 for(const v of showers){
   if(!/^S[A-Z]{2,4}\d{4}$/.test(v.reference))errors.push('Malformed ref '+v.reference);
   if(!Number.isFinite(Number(v.rawPrice))||Number(v.rawPrice)<=0)errors.push('No supplier price '+v.reference);
   const expected=Math.round(Number(v.rawPrice)*104)/100;
   if(Math.abs(expected-Number(v.price))>0.005)errors.push('Wrong +4% '+v.reference+' '+v.price+' vs '+expected);
 }
 assert.deepEqual(errors.slice(0,30),[],errors.length+' source-price validation errors');
});
