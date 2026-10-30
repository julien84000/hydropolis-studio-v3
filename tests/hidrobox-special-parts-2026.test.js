'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const supplier=require('./fixtures/hidrobox/supplier-2026-special-parts-prices.json');
const impl=require('../public/hidrobox-special-parts-2026.js');
test('All 1360 manufacturer VCOC/SCOC reference/price/printed-page entries are implemented',()=>{
 assert.equal(impl.rows.length,1360);
 assert.equal(impl.byRef.size,1360);
 for(const src of supplier.rows){
  const r=impl.byRef.get(src.reference);
  assert(r,'Missing '+src.reference);
  assert.equal(r.rawPrice,src.rawPrice,src.reference);
  assert.equal(r.sourcePage,src.sourcePage,src.reference);
  assert.equal(r.price,Math.round(src.rawPrice*104)/100,src.reference);
  assert(r.material&&r.finish&&r.colorGroup&&r.kind&&r.width!=null&&r.length!=null,
   'Incomplete configurator axes for '+src.reference);
 }
 assert.equal(impl.byRef.has('SCOC0773'),false,'Do not invent supplier codes absent from PDF');
});
test('Kromat and Scene require exactly the selected priced special-part SKU, not nearest sizing',()=>{
 const a=impl.resolve({kind:'rajout-receveur',material:'Kromat',finish:'Lisse',color:'Bianco',
  width:20,length:70,height:2.5});
 assert.equal(a.ok,true);assert.equal(a.reference,'SCOC0001');assert.equal(a.rawPrice,238);
 assert.equal(a.price,247.52);
 const b=impl.resolve({kind:'rajout-receveur',material:'Scene',finish:'Lisse',color:'Blanc',
  width:20,length:70,height:2.5});
 assert.equal(b.ok,true);assert.equal(b.reference,'SCOC0601');assert.equal(b.rawPrice,299);
 const c=impl.resolve({kind:'credence-habillage',material:'Kromat',finish:'Lisse',color:'Beige',
  width:8,length:30});
 assert.equal(c.ok,true);assert.equal(c.reference,'VCOC0001');assert.equal(c.rawPrice,92);
 const d=impl.resolve({kind:'credence-habillage',material:'Scene',finish:'Lisse',color:'Blanc',
  width:8,length:30});
 assert.equal(d.ok,true);assert.equal(d.reference,'VCOC0490');assert.equal(d.rawPrice,110);
 const e=impl.resolve({kind:'credence-habillage',material:'Kromat',finish:'Lisse',color:'Blush',
  width:8,length:30});
 assert.equal(e.reference,'VCOC0164');assert.equal(e.rawPrice,92);
 for(const bad of [
  {kind:'rajout-receveur',material:'Scene',finish:'Lisse',color:'Blush',width:20,length:70,height:2.5},
  {kind:'credence-habillage',material:'Kromat',finish:'Lisse',color:'Beige',width:30,length:240},
  {kind:'rajout-receveur',material:'Kromat',finish:'Lisse',color:'Beige',width:21,length:70,height:2.5}
 ])assert.equal(impl.resolve(bad).ok,false,JSON.stringify(bad));
});
