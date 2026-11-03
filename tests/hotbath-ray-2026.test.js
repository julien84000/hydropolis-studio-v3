'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const rows=require('../public/catalog_hotbath.json');
const ray=require('../public/hotbath-ray-2026.js');
const rough=require('../public/hotbath-rough-in.js');
const general=require('../public/rough-in.js');
const taxonomy=require('../public/brand-guide-hotbath-taxonomy.json');
const standard=['IX','CR','GN','WH'],premium=['TB','BBP','BCP','MBP','BGP'];

test('Photo tariff: 54 RAY heating trims, 3 support SKUs and 9 RAAR accessories exactly match the supplied pages',()=>{
 const audit=ray.checkPrice(rows);
 assert.deepEqual(audit.missing,[]);
 assert.deepEqual(audit.mismatches,[]);
 assert.equal(Object.keys(ray.tariffs).length,6);
 assert.equal(rows.filter(x=>/^RAR(?:H50|V135)-[123]EXT\./.test(x.reference)).length,54);
 assert.equal(rows.filter(x=>/^RAAR\./.test(x.reference)).length,9);
 for(const model of Object.keys(ray.tariffs)){
  const t=ray.tariffs[model],support=ray.models[model].base;
  assert.equal(Number(rows.find(x=>x.reference===support)?.price),t.base);
  for(const finish of [...standard,...premium]){
   const ref=model+'EXT.'+finish,p=rows.find(x=>x.reference===ref);
   assert(p,ref);
   assert.equal(p.vat,'HT');
   assert.equal(Number(p.price),standard.includes(finish)?t.standard:t.premium);
  }
 }
});

test('Every RAY rail trim links exactly one mandatory separately priced MBASES with no double billing',()=>{
 const copy=rows.map(x=>({...x}));
 const audit=rough.linkCatalog(copy);
 assert(audit.linked>=254,'RAY and all existing embedded trims must be linked');
 for(const model of Object.keys(ray.models)){
  for(const finish of [...standard,...premium]){
   const ref=model+'EXT.'+finish,p=copy.find(x=>x.reference===ref);
   const base=copy.find(x=>x.reference===ray.models[model].base);
   assert.equal(p.internalReference,base.reference,ref);
   assert.equal(p.internalPrice,base.price,ref);
   assert.equal(p.totalPrice,p.price+base.price,ref);
   const required=rough.resolve(p);
   assert.equal(required.kind,'verified',ref);
   assert.equal(required.priceAgrees,true,ref);
   assert.equal(required.bodyDiscount,55,ref);
   assert.equal(rough.purchaseDiscount(p,'Ray'),55,ref);
  }
 }
 const selected={...copy.find(x=>x.reference==='RARV135-2EXT.BBP'),id:'p1',roomId:'r1',
   catalogPrice:1867+222,catalogTotalPrice:1867+222,price:1867+222,totalPrice:1867+222};
 const lookup=p=>copy.find(x=>x.manufacturer===p.manufacturer&&x.reference===p.reference);
 const make=(p,roomId,parentId)=>({...p,roomId,accessoryFor:parentId,id:'body1'});
 let out=general.reconcile([selected],lookup,make);
 assert.equal(out.records.length,2);
 assert.equal(out.records[0].price,1867);
 assert.equal(out.records[1].reference,'MBASES3');
 assert.equal(out.records[1].price,222);
 assert.equal(out.records[1].accessoryFor,'p1');
 assert.equal(out.records[1].purchaseDiscount,55);
 out=general.reconcile(out.records,lookup,make);
 assert.equal(out.records.length,2,'Reload must not duplicate concealed support');
 const again=rough.linkCatalog(copy);
 assert(again.already>=54,'Linking the catalogue twice must be idempotent');
});

test('Missing RAY in-wall mounting component never becomes a free or guessed accessory',()=>{
 const copy=rows.map(x=>({...x})).filter(x=>x.reference!=='MBASES4');
 rough.linkCatalog(copy);
 const candidate=copy.find(x=>x.reference==='RARH50-3EXT.IX');
 assert.equal(candidate.roughInRequirement.required,true);
 assert.equal(rough.resolve(candidate).verified,false);
 assert.equal(rough.resolve(candidate).kind,'unverified');
});

test('RAY exposes original six models and RAAR under a distinct accessory category; Sparky source is not renamed',()=>{
 const copy=rows.map(x=>({...x}));
 ray.apply(copy);
 const win={HydroManufacturerGuide:{open:()=>{}}};
 const script=fs.readFileSync(path.join(__dirname,'../public/hotbath-official-guide.js'),'utf8');
 vm.runInNewContext(script,{window:win});
 const idx=win.HydroHotbathOfficialGuide.tariffIndex(copy);
 assert.equal(idx.get('Ray').size,7);
 const categories=win.HydroHotbathOfficialGuide.categories('Ray',taxonomy,idx);
 assert.deepEqual(Array.from(categories.map(x=>x.label)),['Horizontales','Verticales','Accessoires sèche-serviettes']);
 for(const [category,expected] of [
  ['Horizontales',['RARH50-1','RARH50-2','RARH50-3']],
  ['Verticales',['RARV135-1','RARV135-2','RARV135-3']],
  ['Accessoires sèche-serviettes',['RAAR']]
 ]){
  const group=categories.find(c=>c.label===category);
  const models=win.HydroHotbathOfficialGuide.officialModels('Ray',group,idx);
  assert.deepEqual(Array.from(models.map(x=>x.base)),expected);
  for(const m of models)assert.equal(m.variants.length,9,m.base);
 }
 assert.equal(copy.find(x=>x.reference==='RARH50-1EXT.IX').collection,'Sparky');
 assert.equal(copy.find(x=>x.reference==='RARH50-1EXT.IX').category,'Sèche-serviettes électriques');
});

test('Technical properties: six wattages, CE-related ratings, exact model images never mislabel other finishes',()=>{
 const expected=[16,31,46,63,125,187];
 const names=['RARH50-1','RARH50-2','RARH50-3','RARV135-1','RARV135-2','RARV135-3'];
 assert.deepEqual(names.map(x=>ray.specification(x).powerW),expected);
 for(const name of names){
  const r=ray.specification(name);
  assert.equal(r.ip,'IP44');assert.equal(r.voltage,'230 V AC / 50 Hz');
  assert.equal(r.cableLengthMm,1500);
  assert.match(r.photo,new RegExp(name.replace('-','\\-')));
  const exact=ray.media({base:name,reference:name+'EXT.'+r.photoFinish,finishCode:r.photoFinish});
  assert.equal(exact.exact,true);
  const other=ray.media({base:name,reference:name+'EXT.IX',finishCode:'IX'});
  if(r.photoFinish!=='IX'){assert.equal(other.exact,false);assert.match(other.caption,/illustrative/)}
 }
 assert.equal(ray.specification('RAAR'),null);
});

test('Hotbath RAY UI and module remain independent of other manufacturers and display HT with linked support',()=>{
 const index=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 const ui=fs.readFileSync(path.join(__dirname,'../public/hotbath-galassia-configurator.js'),'utf8');
 assert(index.indexOf('hotbath-ray-2026.js')>0);
 assert(index.indexOf('hotbath-ray-2026.js')<index.indexOf('hotbath-rough-in.js'));
 assert.match(ui,/raySpec/);assert.match(ui,/hotbath-ray-tech/);
 assert.match(ui,/Support obligatoire/);assert.match(ui,/ray\?\.apply\(rows\)/);
 assert.match(ui,/rough\.resolve\(p\)/);
});
