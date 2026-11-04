'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const catalog=require('../public/catalog_hotbath.json');
const rough=require('../public/hotbath-rough-in.js');
const pdf=require('../public/hotbath-catalogue-2026.js');
const file=require('node:fs');
const path=require('node:path');
test('Official Hotbath 2026 technical drawings are assigned to models and remain price-neutral',()=>{
 assert.equal(pdf.pageFor('GT105EXT.IX'),11);
 assert.equal(pdf.pageFor('GT131EXT.IX'),11);
 assert.equal(pdf.pageFor('AR187EXT.IX'),35);
 assert.equal(pdf.pageFor('GL177EXT.CR'),101);
 assert.equal(pdf.pageFor('AC105EXT.CR'),84);
 assert.equal(pdf.pageFor('SOME_UNKNOWN_CODE'),null);
 const rows=[{manufacturer:'Hotbath',reference:'GT105EXT.IX',base:'GT105',price:200},
             {manufacturer:'Other',reference:'GT105EXT.IX',base:'GT105',price:200}];
 assert.equal(pdf.apply(rows),1);
 assert.equal(rows[0].technicalSheetType,'pdf');
 assert.match(rows[0].technicalSheetUrl,/#page=11$/);
 assert.equal(rows[0].price,200);
 assert.equal(rows[1].technicalSheetUrl,undefined);
});
test('Hotbath 2026: PDF-confirmed concealed bodies are added only when the exact SKU is priced',()=>{
 const rows=JSON.parse(JSON.stringify(catalog));
 const index=rows.reduce((m,p)=>(m.set(p.reference,p),m),new Map());
 for(const [trim,bodyRef] of Object.entries({
  'AR078WEXT.IX':'B077.010','AR187EXT.IX':'B077.010',
  'CB178WEXT.CR':'HB.CB177','GL177EXT.CR':'HB.CB177'
 })){
  const p=index.get(trim),body=index.get(bodyRef);
  if(!p||!body)continue; // Some finish variants not offered in current price list.
  assert(body.price>0,bodyRef);
 }
 const report=rough.linkCatalog(rows);
 assert(report.linked>0);
 for(const [trim,bodyRef] of Object.entries({
  'AR078WEXT.IX':'B077.010','AR187EXT.IX':'B077.010',
  'CB178WEXT.CR':'HB.CB177','GL177EXT.CR':'HB.CB177'
 })){
  const p=rows.find(x=>x.reference===trim),b=rows.find(x=>x.reference===bodyRef);
  if(!p||!b)continue;
  assert.equal(p.internalReference,bodyRef,trim+' needs '+bodyRef);
  assert.equal(Number(p.internalPrice),Number(b.price));
  assert.equal(p.totalPrice,Math.round((p.price+b.price)*100)/100);
 }
 assert.equal(rough.purchaseDiscount({collection:'Archie'},'Archie'),59.5);
 assert.equal(rough.purchaseDiscount({collection:'Guy'},'Guy'),55);
});
test('Hotbath visual selector includes a source-referenced 2026 document fallback',()=>{
 const js=file.readFileSync(path.join(__dirname,'../public/hotbath-galassia-configurator.js'),'utf8');
 const html=file.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 assert.match(js,/manufacturerCatalogue\?\.entry\?\.\(p\)/);
 assert.match(js,/catalogueImagePreview/);
 assert.match(js,/catalogueDocument/);
 assert.match(html,/hotbath-catalogue-2026\.js/);
});
