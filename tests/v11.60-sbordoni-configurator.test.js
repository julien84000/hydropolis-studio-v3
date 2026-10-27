'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const model=require('../public/sbordoni-model');
const root=path.join(__dirname,'..');
const catalog=fs.readdirSync(path.join(root,'public')).filter(x=>/^catalog_sbordoni_\d+\.json$/.test(x)).flatMap(f=>JSON.parse(fs.readFileSync(path.join(root,'public',f))));
const expected={
 Romana:{9200:['P9200','N9200','R9200'],9090:['P9090','N9090','R9090'],9065:['P9065','N9065','R9065','9001'],9050:[]},
 Palladio:{7200:['P7200','G720'],7100:['P7100','7001','G720','7100M'],7070:['P7070','7001','7070M'],7064:['P7064','7001'],7050:[]},
 Neoclassica:{5700:['P5700','N5700','Y5700','G571'],5775:['P5775','N5775','Y5775','5771'],5770:['P5770','N5770','Y5770','5771'],5765:['P5765','N5765','Y5765','5771'],5758:['P5758','N5758','Y5758','5771']},
 Masaccio:{5369:['5369M','5771','M5369','M5369G'],5365:['5365M','5771','M5365','M5365G'],5359:['5359M','5771','M5359','M5359G'],5352:[],5304:[],5305:[]}
};
function loadConfigurator(name){const c={window:{HydroSbordoniModel:model},CATALOG:catalog,console};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'public',name),'utf8'),c);return c.window;}

test('all four basin matrices match the labelled manufacturer composition plates, independently of OCR',()=>{
 const poisoned=catalog.map(p=>({...p,designation:'incorrect OCR 7200 supports céramiques',category:'Accessoires'}));
 for(const [collection,families] of Object.entries(expected)){
  assert.deepEqual(model.families(poisoned,collection).sort(),Object.keys(families).sort());
  for(const [family,supports] of Object.entries(families))assert.deepEqual(model.supportGroups(poisoned,collection,family).map(g=>g.key),supports,collection+' '+family);
 }
 assert.equal(model.familyFrom({manufacturer:'Other',collection:'Palladio',reference:'7200/3'}),'');
 assert.equal(model.familyFrom(catalog.find(p=>p.reference==='5903/1')),'');
});
test('metal stands cannot resolve to the bare-reference glass shelf',()=>{
 for(const collection of ['Romana','Palladio'])for(const family of model.families(catalog,collection))
  for(const group of model.supportGroups(catalog,collection,family).filter(g=>g.key.startsWith('P'))){
   assert(group.items.every(p=>p.reference!==group.key&&p.finishCode),group.key);
   assert(group.representative.price>1000,group.key+' must be a complete stand');
  }
});
test('every allowed basin configuration has a local exact composition image and sums the selected components',async()=>{
 const {loadImage}=require('@napi-rs/canvas');let count=0;const decoded=new Set();
 const provenance=require('../public/sbordoni/compositions/provenance.json');
 for(const [collection,families] of Object.entries(expected))for(const [family,supports] of Object.entries(families)){
  const variants=model.familyRows(catalog,collection,family);
  const options=[null,...model.supportGroups(catalog,collection,family).flatMap(g=>g.items)];
  for(const basin of variants)for(const support of options){
   const result=model.buildBasin(catalog,{collection,family,holes:model.holesFrom(basin),supportRef:support?.reference||''});
   assert.equal(result.price,basin.price+(support?.price||0));
   assert.equal(result.image,result.pdfImage);assert.equal(result.images.length,1);
   assert.equal(result.sbordoniConfiguration.componentReferences.length,support?2:1);
   assert(!/^https?:/.test(result.image));
   const key=path.basename(result.image,'.jpg');assert(provenance.images[key],key+' provenance');
   if(!decoded.has(key)){const image=await loadImage(path.join(root,'public',result.image));assert(image.width>70&&image.height>25,key);decoded.add(key);}
   count++;
  }
 }
 assert(count>300);assert.equal(decoded.size,73);
});
test('Palladio invalid supports and glass shelves are rejected, not silently replaced',()=>{
 for(const ref of ['7100M','7001','P7200','G571'])assert.throws(()=>model.buildBasin(catalog,{collection:'Palladio',family:'7200',holes:3,supportRef:ref}),/incompatible/);
 assert.equal(model.image('Palladio','7200','7100M'),'');
 assert.equal(model.image('Palladio','9999'),'');
});
test('1 and 3 hole variants use the same 5700 basin photograph',()=>{
 const cfg=loadConfigurator('sbordoni-configurator.js').HydroSbordoniConfigurator;
 assert.equal(cfg.catalogImage(catalog.find(p=>p.reference==='5700/1')),cfg.catalogImage(catalog.find(p=>p.reference==='5700/3')));
 assert.equal(cfg.resultImage('Romana','9065',{reference:'9001'}),'/sbordoni/compositions/9065-9001.jpg');
});
test('saved grouped compositions recover their total and local picture without losing user commercial choices',()=>{
 const p=model.buildBasin(catalog,{collection:'Palladio',family:'7100',holes:1,supportRef:'P7100CR'});
 const saved={...p,id:'item',roomId:'room',quantity:3,priceOverride:1234,clientDiscountOverride:12,quoteDesignationOverride:'Custom',price:999,image:'https://old.example/wrong.jpg'};
 const {selected,changed}=model.migrate([saved]);assert(changed);
 assert.equal(selected[0].price,p.price);assert.equal(selected[0].quantity,3);assert.equal(selected[0].priceOverride,1234);
 assert.equal(selected[0].quoteDesignationOverride,'Custom');assert.equal(selected[0].image,p.image);
 assert.equal(saved.image,'https://old.example/wrong.jpg','migration does not mutate input');
 assert.equal(model.migrate(selected).changed,false,'migration is idempotent');
});
test('legacy separate basin/support items become one result and unrelated project items survive',()=>{
 const parent={id:'p',manufacturer:'Sbordoni',reference:'9065/1',roomId:'r',price:401,quantity:2,sbordoniConfiguration:{collection:'Romana',family:'9065',holes:1,supportRef:'9001'}};
 const child={id:'c',reference:'9001',price:260,accessoryFor:'p',sbordoniConfigurationAccessory:true};
 const other={id:'unrelated',price:99};const result=model.migrate([parent,child,other]);
 assert.equal(result.selected.length,2);assert.equal(result.selected[0].price,661);assert.equal(result.selected[0].quantity,2);
 assert.deepEqual(result.selected[0].sbordoniConfiguration.componentReferences,['9065/1','9001']);assert.deepEqual(result.selected[1],other);
 assert.equal(model.migrate(result.selected).changed,false);
});
test('invalid saved configurations retain their references and prices, with an actionable issue',()=>{
 const p={id:'p',reference:'7200/3',price:100,sbordoniGrouped:true,sbordoniConfiguration:{collection:'Palladio',family:'7200',holes:3,supportRef:'7100M',components:[{role:'lavabo',reference:'7200/3',price:100},{role:'pietement',reference:'7100M',price:25}]}};
 const result=model.migrate([p]).selected[0];assert.equal(result.price,125);assert.equal(result.sbordoniConfiguration.supportRef,'7100M');assert(result.sbordoniConfigurationIssue);assert.equal(result.image,'');
});
test('editing a saved composition preserves quantity, room, quote and attached documents',()=>{
 const current={id:'p',roomId:'r2',quantity:4,space:'Douche',priceOverride:90,quoteReferenceOverride:'Custom',technicalSheetUrl:'data:application/pdf;base64,abc',includeTechnicalSheet:true,hideFromDossier:true,leadTime:'6 semaines'};
 const next=model.applyEditedRecord(current,{id:'new',roomId:'wrong',quantity:1,price:99,technicalSheetUrl:'',includeTechnicalSheet:false,hideFromDossier:false});
 for(const k of Object.keys(current))assert.equal(next[k],current[k],k);assert.equal(next.price,99);
});
test('WC mandatory components and all seat families resolve to existing catalogue references',()=>{
 const cfg=loadConfigurator('sbordoni-wc-configurator.js').HydroSbordoniWCConfigurator;
 for(const [collection,systems] of Object.entries(cfg.config))for(const system of systems){
  for(const [ref] of system.bowls){assert(model.byRef(catalog,collection,ref),ref);for(const flush of system.flush.length?system.flush:[{id:''}])assert(fs.existsSync(path.join(root,'public',model.wcImage({bowlRef:ref,flush:flush.id}))),ref);}
  for(const f of system.flush){assert(model.byRef(catalog,collection,f.tank),f.tank);for(const base of [...f.mechanisms,...(f.pipe?[f.pipe]:[])])assert(model.byRef(catalog,collection,base+'CR'),base);}
  for(const seat of system.seats)assert(model.byRef(catalog,collection,seat+'CR'),seat);
 }
 assert(cfg.config.Palladio.find(s=>s.id==='floor').flush.some(f=>f.tank==='7029'&&f.mechanisms.includes('MC06')));
});
