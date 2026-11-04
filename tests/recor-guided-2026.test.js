'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const model=require('../public/recor-guided-model.js');
const attachMedia=require('../recor-media-server.js');
const catalog=require('../public/catalog_recor.json');
const recors=catalog.filter(p=>p.manufacturer==='Recor');

test('Recor 2026: real products, priced categories and no duplicate references',()=>{
 assert.equal(recors.length,196);
 const references=recors.map(x=>x.reference);
 assert.equal(new Set(references).size,references.length);
 assert.deepEqual(model.CATEGORIES.map(x=>x.id),['Baignoires îlot','Baignoires sur pieds','Finitions premium','Baignoires rectangulaires']);
 assert.equal(model.groupByModel(recors,'Baignoires sur pieds').length,9);
 assert.equal(model.groupByModel(recors,'Baignoires îlot').length,13);
 assert.equal(model.groupByModel(recors,'Baignoires rectangulaires').length,6);
});

test('The 2026 catalogue includes quote-only Camile and shower trays without fabricated SKUs',()=>{
 const camile=model.groupByModel(recors,'Baignoires îlot').find(x=>x.model==='CAMILE');
 const shower=model.groupByModel(recors,'Baignoires rectangulaires').find(x=>x.model==='SHOWER-TRAYS');
 assert.equal(camile.quoteOnly,true);
 assert.equal(shower.quoteOnly,true);
 assert.equal(camile.items.length,0);
 assert.equal(shower.items.length,0);
 assert.deepEqual(model.PDF_MODEL_PAGES['SHOWER-TRAYS'],[71,35]);
 assert.equal(model.PREMIUM_FINISHES.length,10);
 assert.ok(model.PREMIUM_FINISHES.some(x=>x.id==='SOLID-COPPER'));
 assert.deepEqual(model.PREMIUM_ELIGIBILITY['SOLID-COPPER'],['DAKOTA','EIFFEL','EPOQUE','IRIS']);
 assert.deepEqual(model.PREMIUM_ELIGIBILITY['NATURAL-RUSTIC'],[]);
});

test('Slipper: find exact 2026 tariff SKU by size, base finish and tap holes',()=>{
 const options=model.pricedOptions(recors,'SLIPPER');
 assert.equal(options.rows.length,12);
 assert.ok(options.dimensions.some(d=>d.label==='137 × 76 cm'));
 assert.ok(options.tapHoles);
 const bath=model.findVariant(recors,'SLIPPER','137 × 76 cm','RAW',false);
 assert.equal(bath.reference,'RECOR-SLIPPER-137-X-76-RAW-NH');
 assert.equal(bath.price,2416.83);
 assert.equal(bath.mandatoryFreight,380);
 assert.equal(model.findVariant(recors,'SLIPPER','137 × 76 cm','WHITE',true).reference,
  'RECOR-SLIPPER-137-X-76-WHITE-TH');
 assert.equal(model.findVariant(recors,'SLIPPER','200 × 200 cm','WHITE',false),null);
});

test('Slipper compatible feet and optional wastes are real catalog lines',()=>{
 const bath=model.findVariant(recors,'SLIPPER','137 × 76 cm','RAW',false);
 const feet=model.feetFor(recors,bath);
 assert.ok(feet.length>=10);
 assert.ok(feet.every(p=>p.collection==='Pieds Recor'&&p.price>0));
 assert.ok(feet.some(p=>p.reference==='RECOR-BALL-CLAW-CAST'));
 assert.ok(!feet.some(p=>p.reference.startsWith('RECOR-LION')));
 const wastes=model.wastesFor(recors,bath);
 assert.ok(wastes.some(p=>p.reference==='RECOR-CLASSIC-WASTE-CHROME'));
 assert.ok(wastes.every(p=>/vidage|waste/i.test([p.designation,p.originalDescription].join(' '))));
});

test('Model-specific pedestals are valid alternatives only at their listed nominal sizes',()=>{
 const roll154=model.findVariant(recors,'ROLL-TOP','154 × 77 cm','RAW',false);
 const roll170=model.findVariant(recors,'ROLL-TOP','170 × 77 cm','RAW',false);
 if(!roll154||!roll170)throw Error('Roll Top size variants missing');
 const feet154=model.feetFor(recors,roll154);
 const feet170=model.feetFor(recors,roll170);
 assert.ok(feet154.some(p=>p.collection==='Socles Recor'&&/1540 mm/.test(p.designation)));
 assert.ok(!feet170.some(p=>p.collection==='Socles Recor'));
 const antique170=model.findVariant(recors,'ANTIQUE','170 × 77 cm','RAW',false);
 assert.ok(antique170);
 assert.ok(!model.feetFor(recors,antique170).some(p=>p.collection==='Socles Recor'));
});

test('Recor mandatory freight is never added to the product selling total',()=>{
 const bath=model.findVariant(recors,'SLIPPER','137 × 76 cm','RAW',false);
 const foot=model.feetFor(recors,bath).find(p=>p.reference==='RECOR-BALL-CLAW-CAST');
 const waste=model.wastesFor(recors,bath).find(p=>p.reference==='RECOR-CLASSIC-WASTE-CHROME');
 const expected=bath.price+foot.price+waste.price;
 assert.ok(Math.abs(model.selectedTotal(bath,foot,waste)-expected)<0.001);
 assert.ok(Math.abs(model.selectedTotal(bath,null,null)-bath.price)<0.001);
 const ui=fs.readFileSync(path.join(__dirname,'../public/recor-configurator.js'),'utf8');
 assert.match(ui,/Total produits HT \(hors port fournisseur\)/);
 assert.doesNotMatch(ui,/<span>Transport Recor obligatoire<\/span>/);
});

test('Feet thumbnails exist in the deployed packed assets map',()=>{
 const assetIndex=require('../assets_index.json');
 const feet=recors.filter(p=>p.collection==='Pieds Recor');
 assert.equal(feet.length,50);
 for(const foot of feet){
  assert.ok(foot.image&&(assetIndex[foot.image]||fs.existsSync(path.join(__dirname,'../public',foot.image))), 'Photo manquante : '+foot.reference);
 }
});

test('Custom RAL and material colors do not create fake priced references',()=>{
 assert.equal(model.ralColor('RAL 7016'),'#383e42');
 assert.equal(model.ralColor('9010'),'#f5f2e9');
 assert.equal(model.ralColor('RAL 9999'),null);
 assert.equal(model.materialFromText('Laiton poli').label,'Laiton');
 assert.equal(model.materialFromText('Cuivre brossé').type,'metal');
 assert.equal(model.materialFromText('Mosaïque sur mesure').type,'texture');
});

test('Manufacturer photo proxy accepts only exact supported model and Recor URLs',()=>{
 assert.ok(attachMedia.validModel('SLIPPER'));
 assert.ok(attachMedia.validModel('CAMILE'));
 assert.ok(attachMedia.validModel('SHOWER-TRAYS'));
 assert.ok(attachMedia.validModel('HAND-GILDED'));
 assert.ok(attachMedia.validModel('BRONZE-RUSTIC'));
 assert.equal(attachMedia.validModel('NOT-A-RECOR-MODEL'),false);
 assert.ok(attachMedia.pageCandidates('SLIPPER').includes('https://recor.pt/product/slipper-en/'));
 assert.ok(attachMedia.allowedURL('https://recor.pt/wp-content/uploads/2026/01/slipper.jpg'));
 assert.equal(attachMedia.allowedURL('https://other.example/wp-content/uploads/2026/01/slipper.jpg'),'');
 assert.equal(attachMedia.allowedURL('http://recor.pt/wp-content/uploads/2026/01/slipper.jpg'),'');
});

test('Recor photo proxy matches official product model, not unrelated products',()=>{
 const page='https://recor.pt/product/slipper-en/';
 const photo='https://recor.pt/wp-content/uploads/2026/01/slipper-product.jpg';
 const html='<html><head><title>Slipper - Recor</title></head><body><h1>Slipper</h1>'+
   '<div class="woocommerce-product-gallery"><a href="'+photo+'">Photo</a></div>'+
   '</body></html>';
 const parsed=attachMedia.parseProduct(html,page,'SLIPPER');
 assert.ok(parsed);
 assert.equal(parsed.images[0],photo);
 assert.equal(parsed.verifiedModel,true);
 assert.equal(attachMedia.parseProduct(html,page,'DUAL'),null);
});

test('Recor official images: all 38 models have exact curated manufacturer photographs',()=>{
 const media=require('../public/recor-media-curated.js');
 assert.equal(media.models.length,38);
 assert.equal(new Set(media.models).size,media.models.length);
 for(const m of media.models){
  const item=media.get(m);
  assert.equal(item.verifiedModel,true,m);
  assert.ok(item.images.length>0,m);
  assert.ok(item.images.every(url=>/^https:\/\/recor\.pt\/wp-content\/uploads\/\d{4}\/\d{2}\//.test(url)),m);
  assert.equal(item.image,item.images[0]);
  assert.ok(attachMedia.allowedURL(item.image),m);
  if(item.technicalSheetUrl)assert.ok(attachMedia.allowedURL(item.technicalSheetUrl,'pdf'),m);
 }
 assert.equal(media.get('COLLINS').productUrl,'https://recor.pt/product/collins/');
 assert.equal(media.get('HUDSON').productUrl,'https://recor.pt/product/hudson-2/');
 assert.ok(media.get('SLIPPER').images[0].includes('Slipper-900X900.jpg'));
 assert.equal(media.get('NOT-A-MODEL'),null);
});
test('Recor live media route data resolves without WordPress scraping',async()=>{
 const media=attachMedia.service({get:async()=>{throw Error('Network must not be required')}});
 for(const modelName of ['COLLINS','HUDSON','SLIPPER','CAMILE','SHOWER-TRAYS','HAND-GILDED']){
  const entry=await media.getMedia(modelName);
  assert.equal(entry.verifiedModel,true,modelName);
  assert.ok(entry.images.length,modelName);
 }
});
test('Recor UI loads official image mappings and persists real manufacturer photos',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../public/recor-configurator.js'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 assert.ok(html.indexOf('recor-media-curated.js')>0);
 assert.ok(html.indexOf('recor-media-curated.js')<html.indexOf('recor-configurator.js'));
 assert.match(ui,/const photo=\(model,index=0\)=>curated\?\.photo/);
 assert.match(ui,/image\.removeAttribute\('crossorigin'\)/);
 assert.match(app,/preview\|\|media\.image\|\|window\.HydroRecorCurated/);
});
