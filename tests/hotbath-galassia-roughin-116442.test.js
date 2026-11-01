'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const rough=require('../public/hotbath-rough-in.js');
const rows=require('../public/catalog_hotbath.json');
const general=require('../public/rough-in.js');
test('Hotbath embedded products: every verified tariff body has an exact positive reference and amount',()=>{
 const bodies=rows.filter(p=>p.internalReference);
 assert.equal(bodies.length,188,'Preserve the 188 supplier-priced embedded technical-body lines');
 for(const p of bodies){
  const r=rough.resolve(p);
  assert.equal(r.kind,'verified',p.reference);
  assert.equal(r.reference,p.internalReference);
  assert.equal(r.price,p.internalPrice);
  assert.equal(r.required,true);
  assert.equal(r.separateLine,true);
  assert(Number.isFinite(r.price)&&r.price>0,p.reference);
 }
});
test('Hotbath rough-in reconciliation makes one priced compulsory child and strips total-included amount',()=>{
 const tariff=rows.find(p=>p.internalReference&&Number(p.internalPrice)>0&&
  Math.abs(Number(p.totalPrice)-Number(p.price)-Number(p.internalPrice))<.03);
 assert(tariff,'Need a tariff row with a billed-in rough-in body');
 const main={...tariff,id:'parent',roomId:'room1',catalogPrice:tariff.totalPrice,catalogTotalPrice:tariff.totalPrice};
 const mk=(p,roomId,parentId)=>({...p,id:'body',roomId,accessoryFor:parentId});
 const lookup=p=>p.reference===tariff.reference?tariff:null;
 let out=general.reconcile([main],lookup,mk);
 assert.equal(out.records.length,2);
 const body=out.records.find(p=>p.requiredRoughIn);
 assert.equal(body.reference,tariff.internalReference);
 assert.equal(body.price,tariff.internalPrice);
 assert.equal(body.accessoryFor,'parent');
 assert.equal(out.records.find(p=>p.id==='parent').price,tariff.price);
 out=general.reconcile(out.records,lookup,mk);
 assert.equal(out.records.length,2,'Repeated save/reload must not duplicate concealed body');
});
test('Hotbath concealed body mapping never invents an unpriced SKU',()=>{
 const p={manufacturer:'Hotbath',reference:'TEST.X',designation:'Mitigeur de lavabo encastré',price:100,totalPrice:100};
 const result=rough.resolve(p);
 assert.equal(result.kind,'unverified');
 assert.equal(result.verified,false);
 assert.equal(result.reference,'');
 assert.equal(result.price,null);
 assert.equal(rough.resolve({...p,manufacturer:'Galassia'}).kind,'none');
});
test('Hotbath Galassia-style configurator is installed after old guide, preserving other brands',()=>{
 const doc=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 const js=fs.readFileSync(path.join(__dirname,'../public/hotbath-galassia-configurator.js'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'../public/hotbath-galassia.css'),'utf8');
 const old=doc.indexOf('hotbath-official-guide.js'),newUI=doc.indexOf('hotbath-galassia-configurator.js');
 assert(old>=0&&newUI>old);
 assert.match(doc,/hotbath-rough-in\.js/);
 assert.match(css,/grid-template-columns:225px minmax\(0,1fr\) 355px/);
 assert.match(js,/galassia-shell hotbath-galassia-shell/);
 assert.match(js,/galassia-collections hotbath-collections/);
 assert.match(js,/galassia-models hotbath-models/);
 assert.match(js,/galassia-selection hotbath-selection/);
 assert.match(js,/data-model/);
 assert.match(js,/rough\.resolve\(p\)/);
 assert.match(js,/await onAdd\(p,roomId\)/);
 const window={HydroManufacturerGuide:{open:(brand)=>'original:'+brand},
  HydroHotbathOfficialGuide:{},HydroHotbathRoughIn:{}};
 vm.runInNewContext(js,{window});
 const registered=window.HydroManufacturerGuide.open;
 assert.equal(registered('Galassia'),'original:Galassia');
 assert.equal(registered('Zucchetti'),'original:Zucchetti');
});
