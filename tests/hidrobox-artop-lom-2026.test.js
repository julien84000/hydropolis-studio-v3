'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const api=require('../public/hidrobox-measured-plans-2026.js');
const root=path.resolve(__dirname,'../public');
const src=JSON.parse(zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(root,'brand-data/hidrobox-config-01.b64'),'utf8').trim(),'base64')).toString('utf8'));
const group=name=>src.groups.find(g=>g.collection===name).variants;
test('Lom preserves all 20 exact supplier dimensions and source prices without interpolation',()=>{
 const rows=group('Lom');
 assert.equal(rows.filter(r=>/^WLOS\d{4}$/.test(r.reference)).length,20);
 const sizes=rows.map(x=>api.detail('Lom',x)).filter(Boolean);
 assert.equal(sizes.length,20);
 const refs=[...new Set(sizes.map(x=>x.reference))];
 assert.equal(refs.length,20);
 const q=api.resolveExact('Lom',rows,{width:45.5,length:71,height:1.2});
 assert(q.ready,q.reason);assert.equal(q.selected.reference,'WLOS0001');
 assert.equal(q.selected.rawPrice,382);assert.equal(q.selected.price,397.28);
 const l=api.resolveExact('Lom',rows,{width:50.5,length:141,height:15});
 assert(l.ready,l.reason);assert.equal(l.selected.reference,'WLOS0020');
 assert.equal(l.selected.rawPrice,891);
 for(const invalid of [{width:45.5,length:72,height:1.2},{width:46,length:71,height:1.2},{width:45.5,length:71,height:10}]){
   assert(!api.resolveExact('Lom',rows,invalid).ready,'Reject custom size '+JSON.stringify(invalid));
 }
});
test('Artop recovers all 392 supplier geometry-mapped Lisse/Microtex and Kromat/Scene codes',()=>{
 const rows=group('Artop');
 const article=rows.map(x=>api.detail('Artop',x)).filter(Boolean);
 assert.equal(article.length,392);
 assert.equal(new Set(article.map(x=>x.reference)).size,392);
 for(const x of article){
  assert(x.rawPrice>0,x.reference);assert(x.price>0,x.reference);
  assert(x.widthMin>0&&x.widthMax<=60);
  assert(x.lengthMin>=60&&x.lengthMax<=201);
  assert(x.heightMin>0&&x.heightMax<=40);
  if(x.material==='Scene'){assert.equal(x.finish,'Lisse');assert.equal(x.colorGroup,'BLA');}
  if(x.finish==='Microtex')assert.equal(x.material,'Kromat');
 }
 const base=api.resolveExact('Artop',rows,{width:45,length:110,height:1.2,material:'Kromat',finish:'Lisse',group:'BAS',color:'Beige'});
 assert(base.ready,base.reason);assert.equal(base.selected.reference,'CARC0923');assert.equal(base.selected.rawPrice,551);
 const scene=api.resolveExact('Artop',rows,{width:55,length:150,height:8,material:'Scene',finish:'Lisse',group:'BLA',color:'Blanc'});
 assert(scene.ready,scene.reason);assert.equal(scene.selected.reference,'CARC0875');assert.equal(scene.selected.rawPrice,1149);
 const special=api.resolveExact('Artop',rows,{width:56,length:160,height:25,material:'Kromat',finish:'Microtex',group:'SPE',specialCode:'RAL 9010',color:'RAL / NCS'});
 assert(special.ready,special.reason);assert.equal(special.selected.reference,'CARC0334');
 const bad=api.resolveExact('Artop',rows,{width:55,length:150,height:2,material:'Scene',finish:'Lisse',group:'BLA',color:'Blanc'});
 assert(!bad.ready);
 assert(!api.resolveExact('Artop',rows,{width:55.5,length:150,height:8,material:'Scene',finish:'Lisse',group:'BLA',color:'Blanc'}).ready);
 assert(!api.resolveExact('Artop',rows,{width:55,length:150,height:8,material:'Scene',finish:'Microtex',group:'BLA',color:'Blanc'}).ready);
 assert(!api.resolveExact('Artop',rows,{width:56,length:160,height:25,material:'Kromat',finish:'Microtex',group:'SPE',specialCode:'',color:'RAL / NCS'}).ready);
});
test('Guided render stores 3D dimensions and uses exact manufacturer supplier SKU for Lom and Artop',()=>{
 const guide=fs.readFileSync(path.join(root,'hidrobox-guided.js'),'utf8');
 assert.match(guide,/exactPlans\.resolveExact\(g\.collection\|\|g\.id,rows/);
 for(const id of ['huExactwidth','huExactlength','huExactheight','huPlanMaterial','huPlanFinish','huPlanGroup','huPlanSpecial'])
  assert(guide.includes(id),id);
 assert.match(guide,/dimInfo=measuredPlan\?/);
 assert.match(guide,/heightCm:Number\(universalDraft\.exactheight\)/);
 assert.match(guide,/universalDraft\.customColor/);
});
