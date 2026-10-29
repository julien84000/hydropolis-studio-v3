'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'../public'),win={};
vm.runInNewContext(fs.readFileSync(path.join(root,'hidrobox-beta-evoque-2026.js'),'utf8'),{window:win});
const m=win.HydroBetaEvoque2026;

test('Hidrobox Beta Evoque: six actual BBEC refs, all 170×90×56, no fabricated Plus Colour rows',()=>{
 const expected=[
  ['L',false,'BBEC0104',4266],['C',false,'BBEC0105',4266],['R',false,'BBEC0106',4266],
  ['L',true,'BBEC0107',4538],['C',true,'BBEC0108',4538],['R',true,'BBEC0109',4538]
 ];
 assert.equal(m.VARIANTS.length,6);assert.equal(new Set(m.VARIANTS.map(v=>v.reference)).size,6);
 for(const [position,overflow,reference,rawPrice] of expected){
  const q=m.quote({position,overflow});
  assert.equal(q.ok,true,reference+' '+q.errors);
  assert.equal(q.reference,reference);assert.equal(q.rawPrice,rawPrice);
  assert.equal(q.price,Math.round(rawPrice*104)/100);assert.equal(q.purchasePrice,Math.round(q.price*.5*100)/100);
  assert.deepEqual([q.variant.length,q.variant.width,q.variant.height],[170,90,56]);
 }
 assert.equal(m.VARIANTS.every(v=>v.colour==='BIA'),true);
});
test('Hidrobox Beta Evoque: options additive, colour ambiguity blocked, no H2 with overflow',()=>{
 const q=m.quote({position:'C',overflow:true,drain:'OPBT0005',exterior:'OPBT0009',headrest:'OPBT0016'});
 assert.equal(q.ok,true,q.errors.join(','));
 assert.equal(q.reference,'BBEC0108');assert.equal(q.rawPrice,4538+984+123);
 assert.equal(q.price,5870.8);assert.equal(q.purchasePrice,2935.4);
 assert.ok(q.components.some(c=>c.reference==='OPBT0009'&&c.rawPrice===984));
 for(const conf of [
  {position:'?',overflow:false},{position:'L',overflow:'false'},
  {position:'R',overflow:true,drain:'OPBT0006'},
  {position:'L',overflow:false,drain:'OPBT9999'},
  {position:'L',overflow:false,exterior:'OPBT0008'},
  {position:'L',overflow:false,headrest:'OPBT9999'}
 ]){const r=m.quote(conf);assert.equal(r.ok,false,JSON.stringify(conf));assert.equal(r.price,null);}
 const conflict=m.quote({exterior:'OPBT0008'});
 assert.match(conflict.errors.join(' '),/650.*666/);
});
test('Beta Evoque has a dedicated visual screen and saved configuration independent of duplicated navigation branch',()=>{
 const js=fs.readFileSync(path.join(root,'hidrobox-guided.js'),'utf8');
 assert.match(js,/if\(norm\(g\.collection\|\|g\.id\)==='beta evoque'\)return betaEvoquePage\(g\)/);
 assert.match(js,/type:'beta-evoque-2026'/);
 assert.match(js,/betaEvoqueDraft=p\?\.hidroboxConfiguration\?\.type==='beta-evoque-2026'/);
 assert.match(js,/model\.VARIANTS\.find\(v=>v\.reference===original\?\.reference\)/);
 assert.match(js,/data-hbev/);assert.match(js,/hbev-diagram/);
});
