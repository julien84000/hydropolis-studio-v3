'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const supplier=require('../hotbath-italian-media-server');
const pdf=require('../public/hotbath-catalogue-2026');
const index=require('../public/hotbath-italian-product-media.json');
const jpeg=Buffer.from([255,216,255,...Array(150).fill(1),255,217]);
const examples=[['GL002','3498'],['GL018','3493']];
function officialHtml(model,id){
 return '<html><head><title>'+model+' - Hotbath product</title></head><body>'+
  '<img src="https://www.hotbath.it/documents/ProdCateg/'+id+'/'+model+'_2.jpg">'+
  '<a href="https://www.hotbath.it/documents//ProdCateg/'+id+'/'+model+'-00.pdf">Technical</a>'+
  '<a href="/documents/ProdCateg/'+id+'/'+model+'-LT.jpg">Drawing</a>'+
  '</body></html>';
}
test('Official manufacturer product pages expose exact photo and model PDF for GL002 and GL018',async()=>{
 for(const [model,id] of examples){
  const item=supplier.lookup('Gal',model);assert(item,model+' must have manufacturer product page');
  assert.equal(supplier.productPageUrl(item),'https://www.hotbath.it/en/products/'+id+'/'+model);
  const photo='https://www.hotbath.it/documents/ProdCateg/'+id+'/'+model+'_2.jpg';
  const pdfurl='https://www.hotbath.it/documents//ProdCateg/'+id+'/'+model+'-00.pdf';
  assert(supplier.matchesProductDocument(photo,item,model,'image'));
  assert(supplier.matchesProductDocument(pdfurl,item,model,'pdf'));
  assert(!supplier.matchesProductDocument(photo.replace(id,'9999'),item,model,'image'));
  assert(!supplier.matchesProductDocument(photo.replace(model,model==='GL002'?'GL018':'GL002'),item,model,'image'));
  const parsed=supplier.parseProductPage(officialHtml(model,id),item,model);
  assert.equal(parsed.images[0],photo);
  assert.equal(parsed.technicalSheetUrl,pdfurl);
  const fetcher=async url=>{
   if(url.endsWith('/'+id+'/'+model))return {status:200,data:officialHtml(model,id)};
   if(url===photo)return {status:200,headers:{'content-type':'image/jpeg'},data:jpeg};
   return {status:404,data:'not found',headers:{'content-type':'text/html'}};
  };
  const result=await supplier.createService({get:fetcher}).media('Gal',model);
  assert.equal(result.image,photo);
  assert.equal(result.technicalSheetUrl,pdfurl);
  assert.equal(result.verified,true);
  assert.equal(result.scope,'model','Official product picture is not assumed to match a chosen finish');
 }
});
test('Missing official photo must not promote a catalogue page, an unrelated image or unverified guessed URL',async()=>{
 const result=await supplier.createService({get:async url=>{
  if(url.endsWith('/3493/GL018'))return {status:200,data:officialHtml('GL018','3493')};
  return {status:404,headers:{'content-type':'text/html'},data:'not found'};
 }}).media('Gal','GL018');
 assert.equal(result.image,'');
 assert.equal(result.scope,'missing');
 assert.match(result.technicalSheetUrl,/GL018-00\.pdf/);
 const official=supplier.lookup('Gal','GL018');
 assert(!supplier.matchesProductDocument('https://img.archiexpo.com/pdf/repository_ae/159470/general-catalog-2026-463917_100m.jpg',official,'GL018'));
});
test('Manufacturer collection links cover the 2026 catalogue indexed models, including seven previously missed product pages',()=>{
 const indexed=new Set(Object.values(index.byCollection).flatMap(m=>Object.keys(m)));
 const mapped=Object.keys(pdf.PAGE_BY_MODEL);
 const confirmed=mapped.filter(code=>indexed.has(code)||Object.values(supplier.EXTRA_OFFICIAL).some(g=>Object.hasOwn(g,code)));
 assert(confirmed.length>=285,'Almost all catalogue-indexed models have their own official product page');
 for(const [collection,model] of [['Gent','GT003'],['Archie','AR131'],['Archie','AR129'],
   ['Archie','AR096-20'],['Archie','AR7070'],['Ace','AC514'],['Cobber X','CX131']]){
  assert(supplier.lookup(collection,model)?.officialProductPage.includes('/'+model),model);
 }
});
test('Configurator never substitutes an ArchiExpo catalogue page for any Hotbath product photo',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../public/hotbath-galassia-configurator.js'),'utf8');
 assert(!ui.includes('catalogueImagePreview'));
 assert(!ui.includes('hotbath-catalogue-tile'));
 assert(!ui.includes('cataloguePage.preview'));
 assert(ui.includes('IntersectionObserver'),'All lower models must load their own product images on scroll');
 assert(ui.includes('requestJson(italianUrl)'));
 assert(ui.includes('documents.get(mediaKey(collection,m.base))'));
});

test('Hotbath concealed-body associations cover all 619 priced external trim finishes',()=>{
 const rough=require('../public/hotbath-rough-in.js');
 const tariff=require('../public/catalog_hotbath.json');
 const rows=JSON.parse(JSON.stringify(tariff));
 const trims=rows.filter(p=>p.manufacturer==='Hotbath'&&rough.trim(p));
 assert.equal(trims.length,619,'Supplier July 2026 catalogue external trim count changed');
 const before=new Map(trims.map(p=>[p.reference,Number(p.price)]));
 rough.linkCatalog(rows);
 const verified=trims.filter(p=>rough.resolve(p).kind==='verified');
 const choices=trims.filter(p=>rough.resolve(p).kind==='unverified');
 assert.equal(verified.length,601,'Every unambiguous concealed body must be mapped');
 assert.equal(choices.length,18,'Only CB/CX7001 require horizontal/vertical selection');
 for(const p of verified){
  const body=rows.find(b=>b.reference===p.internalReference);
  assert(body&&Number(body.price)>0,p.reference+' linked to missing/untarfied body '+p.internalReference);
  assert.equal(Number(p.internalPrice),Number(body.price));
  assert.equal(Number(p.price),before.get(p.reference),'Original finish tariff must not change');
  assert.equal(p.totalPrice,Math.round((p.price+body.price)*100)/100);
 }
 for(const p of choices){
  assert(['CB7001','CX7001'].includes(rough.modelCode(p)),p.reference+' must not remain ambiguous');
  const options=rough.bodyOptions(p,rows);
  assert.equal(options.length,2);
  assert(options.every(x=>x.price===367));
  assert.equal(rough.chooseBody(p,options[0].reference,rows),true);
  assert.equal(rough.resolve(p).kind,'verified');
  assert.equal(Number(p.price),before.get(p.reference));
 }
 for(const suffix of ['BBP','BGP','CR','GN']){
  const p=trims.find(x=>x.reference==='GL7066EXT.'+suffix);
  assert(p);
  assert.equal(p.internalReference,'HB.CB7066');
  assert.equal(rough.resolve(p).kind,'verified');
 }
 assert.equal(rough.purchaseDiscount({collection:'Archie'},'Archie'),59.5);
 assert.equal(rough.purchaseDiscount({collection:'Gal'},'Gal'),55);
});
test('Hotbath accepts official exact technical PDFs with revision suffixes',()=>{
 const item=supplier.lookup('Gal','GL7066');
 assert(item);
 assert(supplier.matchesProductDocument(
  'https://www.hotbath.it/documents//ProdCateg/3509/GL7066-00_rel2.pdf',item,'GL7066','pdf'));
 assert(!supplier.matchesProductDocument(
  'https://www.hotbath.it/documents//ProdCateg/3509/GL7067-00_rel2.pdf',item,'GL7066','pdf'));
});
