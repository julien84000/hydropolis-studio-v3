'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const dir=path.resolve(__dirname,'../public'),read=n=>fs.readFileSync(path.join(dir,n),'utf8');
const api=require('../public/hidrobox-measured-plans-2026.js');
const source=JSON.parse(zlib.gunzipSync(Buffer.from(read('brand-data/hidrobox-config-01.b64').trim(),'base64')).toString('utf8'));
test('Program Colour, Lom and Artop use the same tariff row for both exact measurements',()=>{
 for(const name of ['Program Colour','Lom','Artop']){
  assert(api.applies(name),name);
  const rows=source.groups.find(g=>g.collection===name)?.variants||[];
  assert(rows.length>0,name+' source missing');
  const m=api.resolve(rows);
  // If the imported tariff has no explicit two-axis ranges, keep quotes disabled;
  // do not create an apparently valid made-to-measure reference.
  if(!m.available){assert(!m.ready);assert(!m.selected);continue;}
  assert(m.bounds.width.first>0&&m.bounds.length.first>0);
  assert(m.width>=m.bounds.width.first);
  assert(m.length>=m.bounds.length.first);
  if(m.ready){
   assert(m.matching.some(r=>r.reference===m.selected.reference));
   const dims=api.dimensions(m.selected);
   assert(m.width>=dims.width.first&&m.width<=dims.width.last);
   assert(m.length>=dims.length.first&&m.length<=dims.length.last);
  }
  const invalid=api.resolve(rows,m.bounds.width.last+10,m.bounds.length.last+10);
  assert(!invalid.ready,'No extrapolation '+name);assert.equal(invalid.selected,null);
 }
});
test('Exact dimensions reject ambiguous, unpriced or unsupported tariff combinations',()=>{
 const rows=[
  {reference:'A',width:'60 - 120',length:'40–50 cm',rawPrice:900},
  {reference:'B',width:'121 - 160',length:'40–50 cm',rawPrice:1100},
  {reference:'C',width:'120-180',length:'51-60',rawPrice:1300},
  {reference:'UNPRICED',width:'10-100',length:'20-30',rawPrice:0}
 ];
 const a=api.resolve(rows,119,48);assert(a.ready);assert.equal(a.selected.reference,'A');
 const b=api.resolve(rows,150,49);assert(b.ready);assert.equal(b.selected.reference,'B');
 const c=api.resolve(rows,150,55);assert(c.ready);assert.equal(c.selected.reference,'C');
 const gap=api.resolve(rows,120,55);assert(gap.ready);assert.equal(gap.selected.reference,'C');
 const bad=api.resolve(rows,125,35);assert.equal(bad.ready,false);
 assert.equal(api.band('120 / 160'),null,'A list is not a dimensional interval');
 assert.equal(api.band('0–30'),null);
 const overlap=api.resolve([...rows,{reference:'D',width:'60-120',length:'40-50',rawPrice:925}],80,45);
 assert.equal(overlap.ready,false,'Ambiguous tariff lines cannot silently select an SKU');
 assert.equal(api.resolve([...rows,{reference:'D',width:'60-120',length:'40-50',rawPrice:925}],80,45,'D').selected.reference,'D');
});
test('Guided interface displays measured fields and blocks adding when the supplier row is unavailable',()=>{
 const guided=read('hidrobox-guided.js'),html=read('index.html');
 assert.match(guided,/const measuredApi=root\.HydroHidroboxMeasuredPlans2026/);
 assert.match(guided,/measuredApi\.resolve\(rows/);
 assert.match(guided,/Matière, finition et les trois dimensions sont vérifiées ensemble/);
 assert.match(guided,/!measuredPlan\|\|selection\.ready/);
 assert.match(guided,/if\(measuredPlan&&!validation\.ready\)/);
 assert.match(html,/hidrobox-measured-plans-2026\.js\?v=__APP_VERSION__/);
});