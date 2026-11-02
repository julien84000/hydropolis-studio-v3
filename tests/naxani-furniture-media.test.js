'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'../public');
function load(name,context){vm.runInNewContext(fs.readFileSync(path.join(base,name),'utf8'),context,{filename:name,timeout:3000})}
test('Naxani: photos officielles sur Prenn, Suró et Slat, sans substituer Simenta',()=>{
 const context={window:{}};
 load('naxani-2026-catalog.js',context);
 load('naxani-furniture-official-media.js',context);
 const rows=context.window.HydroNaxani2026.rows;
 const examples={
  'Prenn':{pages:[15,16,17],variants:['31','64'],path:'/producto/prenn-4/'},
  'Suró':{pages:[25,26],variants:['31','64'],path:'/producto/suro-3/'},
  'Slat':{pages:[21,22,23,24],variants:['1C','2C'],path:'/producto/slat-'}
 };
 let count=0;
 for(const [collection,options] of Object.entries(examples)){
  const items=rows.filter(x=>x.collection===collection&&x.productType==='bois-massif');
  assert.ok(items.length,'Des références '+collection+' doivent exister');
  for(const p of items){
   assert.ok(p.image?.startsWith('https://naxani.com/wp-content/uploads/'),p.reference+' image officielle absente');
   assert.ok(!p.image.includes('simenta-200-wevet'),p.reference+' image substituée à tort');
   assert.ok(options.pages.includes(p.sourcePage),p.reference+' page fabricant inattendue');
   assert.ok(options.variants.includes(p.naIllustratedVariant),p.reference+' famille visuelle non reconnue');
   assert.ok(p.manufacturerUrl.includes(options.path),p.reference+' page fabricant périmée');
   assert.equal(p.naxaniPhotoScope,'collection');
  }
  count+=items.length;
 }
 assert.equal(count,312,'Les trois collections doivent couvrir 312 références tarifées');
 const slat=rows.filter(x=>x.collection==='Slat'&&x.productType==='bois-massif');
 assert.notEqual(slat.find(x=>x.sourcePage===21).image,slat.find(x=>x.sourcePage===23).image,'Slat 1C et 2C : photographies distinctes');
 const prenn=rows.filter(x=>x.collection==='Prenn'&&x.productType==='bois-massif');
 assert.notEqual(prenn.find(x=>x.sourcePage===15).image,prenn.find(x=>x.sourcePage===17).image,'Prenn 31 et 64 : photographies distinctes');
 const suro=rows.filter(x=>x.collection==='Suró'&&x.productType==='bois-massif');
 assert.notEqual(suro.find(x=>x.sourcePage===25).image,suro.find(x=>x.sourcePage===26).image,'Suró 31 et 64 : photographies distinctes');
});
