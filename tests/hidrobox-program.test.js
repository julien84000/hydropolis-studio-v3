'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const window={};for(const f of ['hidrobox-program-data.js','hidrobox-program-2026.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public',f),'utf8'),{window});
const d=window.HydroProgramData,m=window.HydroProgram2026;
test('All 56 plan tiers match the original PDF reference and price',()=>{
 const source=fs.readFileSync(path.join(__dirname,'fixtures/hidrobox/program-source.txt'),'utf8');
 assert.equal(d.rows.length,56);assert.equal(new Set(d.rows.map(r=>r.reference)).size,56);
 for(const r of d.rows){
  const expected=new RegExp(r.reference+'\\n'+r.rawPrice.toLocaleString('de-DE').replace('.','\\.')+'\\n');assert.match(source,expected);
  const q=m.quote({basin:'S26',length:r.length[0],depth:r.depth[0],height:r.height[0]});
  assert.equal(q.ok,true,q.errors.join(';'));assert.equal(q.reference,r.reference);assert.equal(q.rawPrice,r.rawPrice);assert.equal(q.price,Math.round(r.rawPrice*104)/100);
 }
});
test('Source basin IDs, codes, geometry and source prices are preserved',()=>{
 assert.equal(d.basins.length,52);assert.equal(new Set(d.basins.map(b=>b.id)).size,52);
 for(const b of d.basins){assert.ok(b.depth>0&&b.length>0&&b.height>0);if(b.reference)assert.equal(d.options[b.reference].rawPrice,b.rawPrice);}
 assert.equal(d.basins.find(b=>b.id==='S59').length,90);assert.equal(d.basins.find(b=>b.id==='S48').depth,41);
});
test('Additive Program options use the additional-basin tariff, uplift once and discount once',()=>{
 const q=m.quote({length:140,depth:50,height:10,basin:'S15',additional:'S25',curve:'LR',tap:'OPWB0007'});
 assert.equal(q.ok,true,q.errors.join(';'));assert.equal(q.reference,'WPRC0044');
 assert.equal(q.rawPrice,1107+215+123+23);assert.equal(q.price,1526.72);assert.equal(q.purchasePrice,763.36);
 const extra=m.quote({length:201,depth:50,height:10,basin:'S15',additional:'S62'});
 assert.equal(extra.ok,true);assert.equal(extra.components.find(c=>c.label.includes('additionnelle')).rawPrice,584);
 assert.equal(extra.components.filter(c=>c.reference==='OPWB0246').length,0,'Do not add first-basin supplement again');
});
test('Basin fit, Curve geometry and invalid or unsupported dimensions block pricing',()=>{
 for(const config of [{length:202},{length:81.5},{height:2},{depth:39},{curve:'L',depth:60},{curve:'R',height:40},{basin:'S62',length:60},{basin:'S15',additional:'S15',length:80},{basin:'FAKE'},{tap:'OPWB0138'}]){
  const q=m.quote(config);assert.equal(q.ok,false,JSON.stringify(config));assert.equal(q.price,null);
 }
 const a=m.quote({length:81}),b=m.quote({length:82});assert.notEqual(a.reference,b.reference);assert.notEqual(a.rawPrice,b.rawPrice);
});
test('Unresolved source disagreements and conditional options cannot produce a false quote',()=>{
 for(const config of [{towel:'OPWB0105'},{wallBacksplash:true},{specialCut:true},{shelf:'OPWB0127',height:10},{underShelf:true,height:20},{backsplash:10,backTap:true}])assert.equal(m.quote(config).ok,false,JSON.stringify(config));
 const q=m.quote({length:120,depth:50,height:20,backsplash:16,backTap:true});assert.equal(q.ok,true);assert.ok(q.components.some(c=>c.reference==='OPWB0082'));
});
test('Neo Plus tier labels preserve inclusive lower boundaries 100 and 120 cm',()=>{
 const w={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/hidrobox-neo-plus-2026.js'),'utf8'),{window:w});
 const opts={form:'rectangle',material:'Kromat',texture:'Ardoise',group:'BAS',color:'Bianco'};
 assert.match(w.HydroNeoPlus2026.lookup({...opts,width:100,length:100}).tier,/100-110/);
 assert.match(w.HydroNeoPlus2026.lookup({...opts,width:120,length:120}).tier,/120-130/);
 assert.equal(w.HydroNeoPlus2026.lookup({...opts,width:120,length:119}).ok,false);
 assert.equal(w.HydroNeoPlus2026.lookup({...opts,width:90,length:120,texture:'FAKE'}).ok,false);
});
