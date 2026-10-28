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

test('Hotbath 2026: official collections can price exact models shared by supplier collections',()=>{
  const vm=require('node:vm');
  const fs=require('node:fs');
  const taxonomy=require(path.join(__dirname,'..','public','brand-guide-hotbath-taxonomy.json'));
  const window={HydroManufacturerGuide:{open:()=>{}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','public','hotbath-official-guide.js'),'utf8'),{window});
  const guide=window.HydroHotbathOfficialGuide;
  const index=guide.tariffIndex(rows);
  let total=0,covered=0,shared=0;
  for(const [collection,categories] of Object.entries(taxonomy.collections)){
    const unique=[...new Set(categories.flatMap(cat=>cat.refs))];
    for(const ref of unique){
      total++;
      const models=guide.officialModels(collection,{refs:[ref]},index);
      assert.equal(models.length,1);
      const matched=models[0].variants;
      const ids=new Set(matched.map(p=>p.reference));
      assert.equal(ids.size,matched.length,'duplicate tariff price for '+collection+' / '+ref);
      assert.ok(matched.every(p=>p.manufacturer==='Hotbath'&&p.base===ref));
      if(matched.length)covered++;
      if(matched.some(p=>p.collection.includes('/')))shared++;
    }
  }
  assert.equal(total,647);
  assert.equal(covered,611,'price-list collection aliases must not hide official exact models');
  assert.ok(shared>=100,'shared price-list collections must be indexed');
  assert.ok(index.has('Cobber X'),'Cobber-X from price list must match official Cobber X');
  assert.equal(index.get('Cobber X').has('CX003'),true);
  assert.equal(index.has('Sparky'),false,'Sparky is not one of the 12 official browse collections');
});
