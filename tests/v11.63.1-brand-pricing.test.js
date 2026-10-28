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

test('Supplier quote at commit never re-applies Hidrobox uplift or stores invalid prices',()=>{
 const vm=require('node:vm');
 const fs=require('node:fs');
 const path=require('node:path');
 const win={};
 const code=fs.readFileSync(path.join(__dirname,'../public/brand-configurators.js'),'utf8');
 vm.runInNewContext(code,{window:win,Map,Uint8Array});
 const verified=win.HydroBrandCatalogs.verifiedPublicPrice;
 assert.equal(verified('Hidrobox',{reference:'SARC0361',rawPrice:571,price:593.84}),593.84);
 assert.equal(verified('Bette',{reference:'TEST',price:728}),728);
 assert.equal(verified('Carrodrain',{reference:'TEST',price:195}),195);
 assert.throws(()=>verified('Hidrobox',{rawPrice:571,price:617.59}),/4 %/);
 assert.throws(()=>verified('Hidrobox',{price:593.84}),/Tarif source/);
 assert.throws(()=>verified('Bette',{price:0}),/Prix public HT/);
 assert.throws(()=>verified('Carrodrain',{price:'non tarifé'}),/Prix public HT/);
 assert.match(code,/image:media.image\|\|media.representativeImage,imageSource:media.image/);
});
