'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const special=require('../public/hidrobox-special-parts-2026.js');
const supplier=require('./fixtures/hidrobox/supplier-2026-special-parts-prices.json');
test('Every manufacturer 2026 SCOC and VCOC special part has exact original price and SKU',()=>{
 assert.equal(special.rows.length,1360);
 assert.equal(special.byRef.size,1360);
 assert.equal(supplier.rows.length,1360);
 for(const r of supplier.rows){
  const actual=special.byRef.get(r.reference);
  assert(actual,'Missing manufacturer SKU '+r.reference);
  assert.equal(actual.rawPrice,r.rawPrice,r.reference);
  assert.equal(actual.sourcePage,r.sourcePage,r.reference);
  assert.equal(actual.price,Math.round(r.rawPrice*104)/100,r.reference);
 }
});
test('Special-piece configurator resolves distinct official models, dimensions and colours',()=>{
 const basic=special.resolve({kind:'rajout-receveur',material:'Kromat',finish:'Lisse',
  color:'Bianco',height:2.5,width:20,length:70});
 assert.equal(basic.ok,true);
 assert.equal(basic.reference,'SCOC0001');
 assert.equal(basic.rawPrice,238);
 assert.equal(basic.price,247.52);
 const next=special.resolve({kind:'rajout-receveur',material:'Kromat',finish:'Lisse',
  color:'Bianco',height:2.5,width:20,length:80});
 assert.equal(next.reference,'SCOC0002');
 const wall=special.resolve({kind:'credence-habillage',material:'Kromat',finish:'Lisse',
  color:'Bianco',width:8,length:30});
 assert.equal(wall.ok,true);
 assert.equal(wall.reference,'VCOC0001');
 assert.equal(wall.rawPrice,92);
 const invalid=special.resolve({kind:'credence-habillage',material:'Kromat',finish:'Lisse',
  color:'Bianco',width:200,length:30});
 assert.equal(invalid.ok,false);
 assert.equal(special.resolve({kind:'rajout-receveur',material:'Kromat',finish:'Lisse',
  color:'Blush',height:2.5,width:20,length:70}).ok,true);
});
