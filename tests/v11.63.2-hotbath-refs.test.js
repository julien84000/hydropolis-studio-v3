'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const rows=require(path.join(__dirname,'..','public','catalog_hotbath.json'));
const CatalogIndex=require(path.join(__dirname,'..','public','catalog-index.js'));

test('Hotbath 2026: strip only trailing .IT, keep 2554 priced lines and supplier provenance',()=>{
  assert.equal(rows.length,2554);
  const seen=new Set();let normalised=0,roughIns=0;
  for(const product of rows){
    assert.equal(product.manufacturer,'Hotbath');
    assert.doesNotMatch(product.reference,/\.IT$/i);
    assert.equal(typeof product.base,'string');
    assert.equal(typeof product.finishCode,'string');
    assert.ok(Number.isFinite(product.price)&&product.price>0,product.reference);
    assert.ok(Number.isFinite(product.totalPrice)&&product.totalPrice>0,product.reference);
    const key=product.manufacturer+'|'+product.reference;
    assert.ok(!seen.has(key),'duplicate canonical reference '+key);
    seen.add(key);
    if(product.sourceReference){
      normalised++;
      assert.equal(product.sourceReference,product.reference+'.IT');
    }
    if(product.sourceInternalReference){
      roughIns++;
      assert.equal(product.sourceInternalReference,product.internalReference+'.IT');
    }
  }
  assert.equal(normalised,2546);
  assert.equal(roughIns,188);
});

test('Hotbath 2026: legacy .IT project references still resolve to the same tariff row',()=>{
  const idx=CatalogIndex.create([...rows]);
  for(const p of rows){
    assert.equal(idx.get(CatalogIndex.key(p)),p);
    if(p.sourceReference){
      assert.equal(idx.get('Hotbath|'+p.sourceReference),p);
      assert.equal(idx.reference(p.sourceReference),p);
    }
  }
  const matching=rows.find(p=>p.sourceReference==='AC003.BBP.IT');
  assert.ok(matching);
  assert.equal(matching.reference,'AC003.BBP');
  assert.equal(matching.finishCode,'BBP');
  assert.equal(matching.price,309);
  const old={manufacturer:'Hotbath',reference:'AC003.BBP.IT'};
  assert.equal(idx.get(CatalogIndex.key(old)),matching);
});

test('Hotbath 2026: technical bodies retain complete provenance without changing item price',()=>{
  for(const p of rows.filter(p=>p.sourceInternalReference)){
    assert.ok(p.internalReference);
    assert.doesNotMatch(p.internalReference,/\.IT$/i);
    assert.equal(p.sourceInternalReference,p.internalReference+'.IT');
    assert.ok(Number.isFinite(p.internalPrice)&&p.internalPrice>=0);
    assert.ok(Number.isFinite(p.price)&&Number.isFinite(p.totalPrice));
  }
});
