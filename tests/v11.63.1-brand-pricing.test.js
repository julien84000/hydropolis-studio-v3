'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditAll}=require('../scripts/audit-brand-pricing');

test('Hidrobox / Bette / Carrodrain : all supplier price matrices are read and audited',()=>{
 const data=auditAll();
 const by=Object.fromEntries(data.map(a=>[a.brand,a]));
 assert.equal(by.Hidrobox.groups,27);
 assert.equal(by.Hidrobox.variants,4479);
 assert.equal(by.Bette.groups,93);
 assert.equal(by.Bette.variants,62264);
 assert.equal(by.Carrodrain.groups,12);
 assert.equal(by.Carrodrain.variants,635);
 for(const r of data){
   assert.equal(r.variants,r.priced+r.noPrice);
   assert.equal(r.noPrice,0,r.brand+': invalid supplier price');
   assert.equal(r.duplicateExact,0,r.brand+': duplicated exact variant');
   assert.equal(r.issues['blank-reference']||0,0,r.brand+': missing manufacturer reference');
 }
 assert.equal(by.Hidrobox.rawCount,4479);
 assert.equal(by.Hidrobox.incorrectUplift,0,'Hidrobox public HT must be source HT * 1.04 exactly once');
 console.log('BRAND_PRICE_MATRIX_AUDIT',JSON.stringify(data.map(({_data,issueExamples,...x})=>x)));
});

test('Buying conditions are stored separately from public list prices',()=>{
 const data=auditAll();
 for(const a of data){
  assert.ok(a.priced>0);
  for(const g of a._data.groups){
    for(const v of g.variants){
      assert.ok(v.price>0,a.brand+' '+v.reference);
      if(a.brand==='Hidrobox'){
        assert.ok(v.rawPrice>0);
        assert.equal(v.price,Math.round(v.rawPrice*104)/100);
      }
    }
  }
 }
});
