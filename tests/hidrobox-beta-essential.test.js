'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..','public'),win={};
vm.runInNewContext(fs.readFileSync(path.join(root,'hidrobox-beta-essential-2026.js'),'utf8'),{window:win});
const m=win.HydroBetaEssential2026;
const asPlain=x=>JSON.parse(JSON.stringify(x));
test('Beta Essential: 8 shapes, 12 size patterns, 96 exact distinct SKU references',()=>{
 assert.equal(m.FORMS.length,8);
 assert.deepEqual(asPlain(m.FORMS.map(x=>x.sizes.length)),[1,1,1,1,2,2,2,2]);
 assert.equal(m.VARIANTS.length,96);
 assert.equal(new Set(m.VARIANTS.map(x=>x.reference)).size,96);
 const numbers=m.VARIANTS.map(x=>Number(x.reference.slice(4))).sort((a,b)=>a-b);
 assert.deepEqual(asPlain(numbers),[...Array(24)].map((_,i)=>i+1).concat([...Array(72)].map((_,i)=>i+32)));
 assert.equal(m.VARIANTS.filter(v=>v.colour==='BLA').length,24);
 assert.equal(m.VARIANTS.filter(v=>v.colour==='BAS').length,24);
 assert.equal(m.VARIANTS.filter(v=>v.colour==='TRE').length,24);
 assert.equal(m.VARIANTS.filter(v=>v.colour==='SPE').length,24);
 assert.equal(m.VARIANTS.every(v=>v.material==='Scene Solid Surface'),true);
});
test('Beta Essential: actual source white and coloured references at each form/size/overflow boundary',()=>{
 const samples=[
  ['oval-v1','170x80','BLA',false,'BBEC0001',4266],
  ['oval-v1','170x80','BLA',true,'BBEC0005',4538],
  ['oval-v4','157x74','BLA',true,'BBEC0008',4538],
  ['circle-v1','d140','BLA',false,'BBEC0009',4709],
  ['circle-v1','d150','BLA',true,'BBEC0021',5421],
  ['circle-v3','127x140','BLA',true,'BBEC0014',4978],
  ['circle-v4','d140','BLA',true,'BBEC0023',5421],
  ['circle-v5','d150','BLA',true,'BBEC0024',5421],
  ['oval-v1','170x80','BAS',false,'BBEC0032',5804],
  ['oval-v1','170x80','TRE',true,'BBEC0057',6075],
  ['oval-v2','185x95','SPE',false,'BBEC0082',6162],
  ['circle-v1','d140','SPE',false,'BBEC0088',6861],
  ['circle-v3','140x150','BAS',true,'BBEC0047',7215],
  ['circle-v4','d127','TRE',false,'BBEC0072',6503],
  ['circle-v5','d150','SPE',true,'BBEC0103',7574]
 ];
 for(const [form,sizeId,colour,overflow,reference,rawPrice] of samples){
  const q=m.quote({form,sizeId,colour,overflow});
  assert.equal(q.ok,true,reference+': '+q.errors.join(', '));
  assert.equal(q.reference,reference);
  assert.equal(q.rawPrice,rawPrice,reference);
  assert.equal(q.price,Math.round(rawPrice*104)/100);
  assert.equal(q.purchasePrice,Math.round(q.price*50)/100);
 }
});
test('Beta Essential: all prices match tier mapping and totals are rounded after a single 4pct uplift',()=>{
 for(const v of m.VARIANTS){
  const q=m.quote({form:v.form,sizeId:v.sizeId,colour:v.colour,overflow:v.overflow});
  assert.equal(q.ok,true,v.reference);
  assert.equal(q.reference,v.reference);
  assert.equal(q.rawPrice,v.rawPrice);
  assert.equal(q.components.filter(c=>c.reference===v.reference).length,1);
 }
 const item=m.quote({form:'circle-v3',sizeId:'140x150',colour:'BAS',overflow:true,drain:'OPBT0023',headrest:'OPBT0016'});
 assert.equal(item.ok,true);
 assert.equal(item.reference,'BBEC0047');
 assert.equal(item.rawPrice,7215+123);
 assert.equal(item.price,7631.52);
});
test('Beta Essential: no invented dimensions, no double-charged Plus Colour, overflow/drain compatibility',()=>{
 for(const invalid of [
  {form:'circle-v1',sizeId:'d127'}, {form:'oval-v4',sizeId:'170x80'},
  {form:'circle-v3',sizeId:'d140'}, {form:'oval-v1',sizeId:'40x50'},
  {form:'nonexistent'}, {colour:'COL'}, {overflow:'false'},
  {colour:'BAS',exterior:'OPBT0008'},
  {colour:'SPE',exterior:'OPBT0009'},
  {overflow:true,drain:'OPBT0006'},
  {colour:'BLA',drain:'OPBT0023'},
  {tapPrep:true,technicalPlanProvided:false}
 ]){
  const q=m.quote(invalid);assert.equal(q.ok,false,JSON.stringify(invalid));assert.equal(q.price,null);
 }
 const painted=m.quote({colour:'BLA',exterior:'OPBT0008',drain:'OPBT0005'});
 assert.equal(painted.ok,true);assert.equal(painted.rawPrice,4266+666);
 const prepared=m.quote({tapPrep:true,technicalPlanProvided:true,headrest:'OPBT0015'});
 assert.equal(prepared.ok,true);assert.equal(prepared.rawPrice,4266+68+123);
 assert.equal(prepared.components.find(x=>x.reference==='OPBT0029').rawPrice,68);
});
test('Beta Essential: dedicated guide, saved composition and compatible manufacturer resources',()=>{
 const source=fs.readFileSync(path.join(root,'hidrobox-guided.js'),'utf8');
 assert.match(source,/if\(norm\(g\.collection\|\|g\.id\)==='beta essential'\)return betaEssentialPage\(g\)/);
 assert.match(source,/type:'beta-essential-2026'/);
 assert.match(source,/betaEssentialDraft=p\?\.hidroboxConfiguration\?\.type==='beta-essential-2026'/);
 assert.match(source,/data-hbess/);
 assert.match(source,/manufacturer:'Hidrobox',collection:'Beta Essential'/);
});
