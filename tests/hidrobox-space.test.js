'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'../public'),w={};
vm.runInNewContext(fs.readFileSync(path.join(root,'hidrobox-space-2026.js'),'utf8'),{window:w});
const m=w.HydroSpace2026;
const expected=[
 ['BLA','155',false,'BSPC0001',3477],['BLA','155',true,'BSPC0004',3747],
 ['BLA','170',false,'BSPC0002',3754],['BLA','170',true,'BSPC0005',4024],
 ['BLA','180',false,'BSPC0003',4030],['BLA','180',true,'BSPC0006',4302],
 ['BAS','155',false,'BSPC0007',5014],['BAS','155',true,'BSPC0008',5285],
 ['BAS','170',false,'BSPC0009',5291],['BAS','170',true,'BSPC0010',5562],
 ['BAS','180',false,'BSPC0011',5568],['BAS','180',true,'BSPC0012',5839],
 ['TRE','155',false,'BSPC0013',5014],['TRE','155',true,'BSPC0014',5285],
 ['TRE','170',false,'BSPC0015',5291],['TRE','170',true,'BSPC0016',5562],
 ['TRE','180',false,'BSPC0017',5568],['TRE','180',true,'BSPC0018',5839],
 ['SPE','155',false,'BSPC0019',5373],['SPE','155',true,'BSPC0020',5644],
 ['SPE','170',false,'BSPC0021',5650],['SPE','170',true,'BSPC0022',5920],
 ['SPE','180',false,'BSPC0023',5927],['SPE','180',true,'BSPC0024',6198]
];
test('SPACE: 24 precise published references/prices in printed page 136, all sizes and overflows',()=>{
 assert.equal(m.VARIANTS.length,24);assert.equal(new Set(m.VARIANTS.map(x=>x.reference)).size,24);
 for(const [colour,sizeId,overflow,ref,raw] of expected){
  const q=m.quote({colour,sizeId,overflow,drain:'OPBT0001'});
  assert.equal(q.ok,true,ref+': '+q.errors.join(';'));
  assert.equal(q.reference,ref);assert.equal(q.rawPrice,raw);
  assert.equal(q.price,Math.round(raw*104)/100);
  assert.equal(q.purchasePrice,Math.round(q.price*50)/100);
 }
 assert.deepEqual(Array.from(m.SIZES,s=>[s.length,s.width,s.height]),[[155,78,50],[170,80,53.5],[180,85,53.5]]);
});
test('SPACE: proper restrictions and no double count Plus Colour',()=>{
 assert.equal(m.quote({colour:'BAS',exterior:'OPBT0008'}).ok,false);
 assert.equal(m.quote({colour:'SPE',exterior:'OPBT0009'}).ok,false);
 assert.equal(m.quote({sizeId:'155',colour:'BAS'}).rawPrice,5014);
 assert.equal(m.quote({sizeId:'155',colour:'BLA',exterior:'OPBT0008'}).rawPrice,3477+666);
 assert.equal(m.quote({colour:'BLA',overflow:true,drain:'OPBT0006'}).ok,false);
 assert.equal(m.quote({colour:'BLA',overflow:false,drain:'OPBT0006',headrest:'OPBT0015'}).rawPrice,3477+231+123);
 assert.equal(m.quote({colour:'TRE',overflow:true,drain:'OPBT0024'}).ok,true);
 assert.equal(m.quote({colour:'SPE',overflow:false,drain:'OPBT0025'}).ok,true);
 assert.equal(m.quote({sizeId:'40',colour:'BLA'}).ok,false);
 assert.equal(m.quote({colour:'INVALID'}).ok,false);
 assert.equal(m.quote({headrest:'OPBT9999'}).ok,false);
});
test('SPACE: connected to dedicated guide, preserve state in project and no generic faux dimensions',()=>{
 const guide=fs.readFileSync(path.join(root,'hidrobox-guided.js'),'utf8');
 assert.match(guide,/if\(norm\(g\.collection\|\|g\.id\)==='space'\)return spacePage\(g\)/);
 assert.match(guide,/Space · modèle exact/);
 assert.match(guide,/type:'space-2026'/);
 assert.match(guide,/spaceDraft=p\?\.hidroboxConfiguration\?\.type==='space-2026'/);
 assert.match(guide,/result\.components/);
});
