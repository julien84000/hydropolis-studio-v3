'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const tree=require('../public/galassia-tree.js');
const official=require('../public/galassia/official-tree.json');
const core=official.collections.find(c=>c.slug==='core');
const tabulae=official.collections.find(c=>c.slug==='tabulae');
test('Galassia Core: the seven official furniture & structure models are visible within Core with genuine manufacturer photos',()=>{
 const furniture=core.groups.find(g=>g.name==='Mobili e strutture');
 assert(furniture,'missing official Core furniture group');
 assert.deepEqual(furniture.items.map(m=>m.base),['2062','2063','2064','7345','2077','2078','2081NE']);
 assert.equal(new Set(furniture.items.map(m=>m.base)).size,7);
 assert(furniture.items.every(m=>/https:\/\/www\.ceramicagalassia\.(it|com)\/public\//.test(m.image)));
 assert(furniture.items.every(m=>/https:\/\/www\.ceramicagalassia\.(it|com)\/(catalogo|catalogue)\//.test(m.url)));
 const classified=tree.enrich({manufacturer:'Galassia',reference:'2062NEMT',base:'2062',collection:'Core',price:1124,purchaseDiscount:50,image:''},official);
 assert.equal(classified.collection,'Core');
 assert.equal(classified.manufacturerFamily,'Mobili e strutture');
 assert.equal(classified.image,'https://www.ceramicagalassia.it/public/_resized/2062_650X550_90_C.jpg');
 assert.equal(classified.price,1124);
 assert.equal(classified.purchaseDiscount,50);
 assert.equal(classified.officialStructureVerified,true);
});
test('Galassia: Core 2063 2064 2078 models keep their own images, never borrow from other references',()=>{
 const expected={2063:'2063_650X550_90_C.jpg',2064:'2064_650X550_90_C.jpg',2078:'2078ne_650X550_90_C.jpg'};
 for(const [code,filename] of Object.entries(expected)){
  const p=tree.enrich({manufacturer:'Galassia',base:code,reference:code+'NE',price:999,image:''},official);
  assert.equal(p.manufacturerCollectionSlug,'core');
  assert.equal(p.manufacturerFamily,'Mobili e strutture');
  assert(p.image.endsWith(filename),code+' image mismatch');
 }
});
test('Galassia Tabulae: 2051 moves out of Core into manufacturer Top group with its own photo',()=>{
 const top=tabulae.groups.find(g=>g.name==='Top');
 assert(top);
 assert.deepEqual(top.items.map(m=>m.base),['2056','2050','2051','2057','2058','2053','2052','2060','2061','2055','2054']);
 const item=tree.enrich({manufacturer:'Galassia',base:'2051',reference:'2051NEMT',collection:'Core',price:496,purchaseDiscount:50,image:''},official);
 assert.equal(item.collection,'Tabulae');
 assert.equal(item.manufacturerFamily,'Top');
 assert.equal(item.manufacturerCollectionSlug,'tabulae');
 assert.equal(item.image,'https://www.ceramicagalassia.com/public/colori/2051/_resized/2051_650X550_90_C.jpg');
 assert.equal(item.price,496);
 assert.equal(item.purchaseDiscount,50);
});
test('Galassia: unknown SKUs remain unclassified, no image or invented pricing',()=>{
 const p={manufacturer:'Galassia',reference:'999999XYZ',base:'999999',price:1000,image:''};
 assert.equal(tree.verifiedModel(official,p),null);
 assert.equal(tree.enrich(p,official),p);
 assert.equal(p.image,'');
 assert.equal(p.officialStructureVerified,undefined);
 assert.equal(p.price,1000);
});
test('Galassia Core and Core Freestanding furniture stay in separate official collections',()=>{
 const separate=official.collections.find(c=>c.slug==='core-freestanding');
 const inCore=core.groups.find(g=>g.name==='Mobili e strutture').items.map(x=>x.base);
 const inFree=separate.groups.flatMap(g=>g.items.map(x=>x.base));
 assert(inCore.includes('2062'));assert(!inFree.includes('2062'));
 assert(inFree.includes('7343'));assert(!inCore.includes('7343'));
 const coverage=tree.coverage(official,[]);
 assert.equal(coverage.collections,17);
 assert.equal(coverage.sections,71);
 assert.equal(coverage.models,282);
});
