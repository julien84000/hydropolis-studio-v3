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
  if(Number(p.internalPrice)>0){
   assert.equal(r.kind,'verified',p.reference);
   assert.equal(r.reference,p.internalReference);
   assert.equal(r.price,p.internalPrice);
   assert.equal(r.required,true);
   assert.equal(r.separateLine,true);
   assert(Number.isFinite(r.price)&&r.price>0,p.reference);
  }else{
   assert.equal(r.kind,'unverified',p.reference+' must not invent a zero-priced body');
  }
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


test('Hotbath 2026: independently listed bodies are linked to exact compatible exterior references',()=>{
 const copy=rows.map(p=>({...p}));
 const audit=rough.linkCatalog(copy);
 assert(audit.linked>=200,'At least 200 missing supplier body links must be recovered');
 for(const [external,reference,bodyPrice,trimPrice] of [
  ['GT7009EXT.IX','HB.CB7009',655,715],
  ['GT7066EXT.IX','HB.CB7066',732,975],
  ['GT7070EXT.IX','HB.CB7070',938,1295]
 ]){
  const p=copy.find(x=>x.reference===external);
  assert(p,external+' missing from price list');
  assert.equal(p.internalReference,reference);
  assert(!p.internalReference.endsWith('.IT'));
  assert.equal(p.internalPrice,bodyPrice);
  assert.equal(p.totalPrice,trimPrice+bodyPrice);
  assert.equal(rough.resolve(p).kind,'verified');
  const source={...p,id:'p1',roomId:'r1',catalogPrice:p.totalPrice,catalogTotalPrice:p.totalPrice};
  const lookup=x=>copy.find(y=>y.reference===x.reference&&y.manufacturer===x.manufacturer);
  const make=(v,roomId,accessoryFor)=>({...v,roomId,accessoryFor,id:'c1'});
  let out=general.reconcile([source],lookup,make);
  assert.equal(out.records.length,2);
  const body=out.records.find(x=>x.requiredRoughIn);
  assert.equal(body.reference,reference);
  assert.equal(body.price,bodyPrice);
  assert.equal(body.purchaseDiscount,55);
  assert.equal(out.records.find(x=>x.id==='p1').price,trimPrice);
  out=general.reconcile(out.records,lookup,make);
  assert.equal(out.records.length,2,'No duplicated body on project reload');
 }
});
test('Hotbath: negotiated discounts are 55% standard and sequential 50+10+10=59.5% Archie',()=>{
 assert.equal(rough.purchaseDiscount({collection:'Gent'}),55);
 assert.equal(rough.purchaseDiscount({collection:'Archie'}),59.5);
 assert.equal(rough.purchaseDiscount({collection:'Archie / Gent'},'Gent'),55);
 assert.equal(rough.purchaseDiscount({collection:'Archie / Gent'},'Archie'),59.5);
 const rowsCopy=rows.map(p=>({...p}));
 rough.linkCatalog(rowsCopy);
 const p=rowsCopy.find(x=>x.reference==='GT7009EXT.IX');
 p.hotbathSelectedCollection='Gent';
 const bodySource=rowsCopy.find(x=>x.reference==='HB.CB7009');
 const lookup=x=>rowsCopy.find(v=>v.reference===x.reference&&v.manufacturer===x.manufacturer);
 const mk=(x,roomId,parentId)=>({...x,id:'child',roomId,accessoryFor:parentId});
 const main={...p,id:'parent',roomId:'room',catalogPrice:p.totalPrice,catalogTotalPrice:p.totalPrice};
 const linked=general.reconcile([main],lookup,mk);
 const child=linked.records.find(x=>x.requiredRoughIn);
 assert.equal(child.purchaseDiscount,55);
 assert.equal(bodySource.reference,'HB.CB7009');
 assert.equal(linked.records.find(x=>x.id==='parent').price,715);
 const archie={...rowsCopy.find(x=>x.reference==='AR124EXT.IX'),id:'parent2',roomId:'room',hotbathSelectedCollection:'Archie'};
 const linkedArchie=general.reconcile([archie],lookup,mk);
 const childArchie=linkedArchie.records.find(x=>x.requiredRoughIn);
 assert(childArchie);
 assert.equal(childArchie.purchaseDiscount,59.5);
 const js=fs.readFileSync(path.join(__dirname,'../public/hotbath-galassia-configurator.js'),'utf8');
 assert.match(js,/negotiatedDiscount/);
 assert.match(js,/hotbathSelectedCollection:collection/);
 assert(!js.includes("Remise d’achat fournisseur</span><b>50 %</b>"));
});
test('Hotbath unresolved or ambiguous trim never silently receives an invented body',()=>{
 const copy=rows.map(x=>({...x}));
 rough.linkCatalog(copy);
 const missing=copy.find(x=>x.reference==='AR078WEXT.IX');
 assert(missing);
 assert.equal(rough.resolve(missing).kind,'unverified');
 assert.equal(rough.resolve(missing).required,true);
 const ambiguous=copy.find(x=>x.reference==='GL7066EXT.CR');
 assert(ambiguous);
 assert.equal(rough.resolve(ambiguous).kind,'unverified');
});
