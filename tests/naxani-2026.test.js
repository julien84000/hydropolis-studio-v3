'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('../public/naxani-2026-catalog.js');
const data=globalThis.HydroNaxani2026;
const ui=require('../public/naxani-configurator.js');
const rows=data.rows;
const sku=ref=>rows.find(x=>x.reference===ref);
test('Naxani : 2026 PDF references unique, priced and grouped across requested subcategories',()=>{
 assert(rows.length>=1800,'Unexpected catalogue loss');
 assert.equal(new Set(rows.map(x=>x.reference)).size,rows.length);
 for(const item of rows){
  assert(/^\d{6}$/.test(item.reference),item.reference);
  assert(Number.isFinite(item.price)&&item.price>0,item.reference);
  assert.equal(item.price,item.totalPrice);
  assert.equal(item.manufacturer,'Naxani');
  assert(item.sourcePage>=4&&item.sourcePage<=70);
  assert.equal(item.purchaseDiscount,0,'Commercial terms not supplied');
 }
 for(const group of ['bois-massif','laque','complement','plan-integre','vasque-poser','plan-solid','plan-mdf','suspendu','bonde']){
  assert(rows.some(x=>x.productType===group),'Missing '+group);
 }
});
test('Naxani : check literal supplier PDF sample prices across main families',()=>{
 for(const [reference,collection,price] of [
  ['504086','Aalto',2033],['504000','Aalto',2297],
  ['500002','Aran',999],['500101','Aran',1046],
  ['572299','Aran',323],['572534','Aran',555],['572527','Aran',635],
  ['570011','1Q84',640],['516300','Hirga',439],['516317','Ovum',308],
  ['515006','Solid Surface',175],['520413','MDF laqué',147],
  ['579861','Clic Clac',73],['615395','Clic Clac',45]
 ]){
  const p=sku(reference);
  assert(p,'Missing '+reference);
  assert.equal(p.collection,collection,reference);
  assert.equal(p.price,price,reference);
 }
});
test('Naxani : manufacturer incompatible basin exclusions and exact widths',()=>{
 const aalto=sku('504086'),alma=sku('570738'),aran=sku('572329');
 assert(aalto&&alma&&aran);
 assert.equal(ui.compatible(aalto,alma,data),false,'Aalto excludes Alma on tariff page 4');
 assert.equal(ui.compatible(aalto,aran,data),true,'80 cm Aalto with 80 cm Aran');
 assert.equal(ui.compatible({...aalto,naWidth:90},aran,data),false,'Width conflict');
 assert(data.compatibilities.aalto.excluded.includes('Orbit'));
 assert.equal(ui.quote([aalto.reference,aran.reference],rows).total,2451);
});
test('Naxani : official site images are clearly generic and references stay exact',()=>{
 const pics=rows.filter(x=>x.image);
 assert(pics.length>1000);
 assert(pics.every(x=>x.image.startsWith('https://naxani.com/wp-content/uploads/')));
 assert(pics.every(x=>/illustrative/i.test(x.imageSource)));
 const js=fs.readFileSync(path.join(__dirname,'../public/naxani-configurator.js'),'utf8');
 assert(js.includes('compatible(meuble,plan'));
 assert(js.includes('Plan + vasque à poser'));
 assert(js.includes('Bonde / siphon (optionnel)'));
 assert(js.includes('conditions d’achat')||js.includes('Conditions d’achat'));
 assert(js.includes('naxaniAssembly'));
});
