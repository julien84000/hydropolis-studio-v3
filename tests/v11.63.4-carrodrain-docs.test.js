'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const docs=require('../public/carrodrain-documents.js');
const dir=path.join(__dirname,'..','public');
const source=fs.readFileSync(path.join(dir,'brand-configurators.js'),'utf8');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(dir,'sw.js'),'utf8');
test('Carrodrain: 14 official product pages and only supplier-hosted published PDFs',()=>{
 assert.equal(docs.models.length,14);
 const seen=new Set();
 for(const id of docs.models){
   assert.ok(!seen.has(id));seen.add(id);
   for(const version of ['LOW','PRO']){
     const r=docs.resolve(id,version);
     assert.match(r.sourcePage,/^https:\/\/carrodrain\.com\/en\/products\//);
     for(const key of ['technicalSheetUrl','installationGuideUrl'])if(r[key]){
       assert.match(r[key],/^https:\/\/cdn\.shopify\.com\/s\/files\/1\/0400\/4459\/3315\/files\/[\w-]+\.pdf\?v=\d+$/);
     }
     if(r.technicalScope==='exact-version'){
       assert.ok(r.technicalSheetUrl.includes(version),'wrong LOW/PRO specification '+id);
     }
   }
 }
 assert.equal(docs.resolve('unknown','LOW').technicalSheetUrl,'');
 assert.equal(docs.resolve('liquidmono','LOW').technicalSheetUrl,'','no unproven model-specific PDF on Liquid Mono page');
 assert.equal(docs.resolve('quattro','LOW').installationGuideUrl,'','Cayman manual is not silently labelled Quattro installation');
});
test('Carrodrain: LOW and PRO files are never swapped and family documents remain labelled',()=>{
 for(const id of ['quattro','disco','invisiblequattro','liquid','liquidquattro','liquiddisco','liquidsnake']){
   const lo=docs.resolve(id,'LOW'),hi=docs.resolve(id,'PRO');
   assert.equal(lo.technicalScope,'exact-version',id);
   assert.equal(hi.technicalScope,'exact-version',id);
   assert.notEqual(lo.technicalSheetUrl,hi.technicalSheetUrl,id);
   assert.match(lo.technicalSheetUrl,/(?:LOW|_125_Technical)/);
   assert.match(hi.technicalSheetUrl,/PRO/);
 }
 assert.equal(docs.resolve('invisibledisco','LOW').technicalScope,'family','unlabelled generic PDF is not certified LOW');
 assert.equal(docs.resolve('invisibledisco','PRO').technicalScope,'exact-version');
 assert.equal(docs.resolve('cayman','PRO').technicalScope,'family');
 assert.equal(docs.resolve('invisible','LOW').technicalScope,'family');
 assert.equal(docs.resolve('liquidmono','PRO').installationScope,'family');
});
test('Carrodrain: documents loaded before configurator and preserved in project record',()=>{
 assert.ok(html.indexOf('carrodrain-documents.js')<html.indexOf('brand-configurators.js'));
 assert.match(sw,/carrodrain-documents\.js/);
 assert.match(source,/root\.HydroCarrodrainDocuments\?\.resolve\(model\.id,v\?\.version\)/);
 assert.match(source,/installationGuideUrl:media\.installationGuideUrl/);
 assert.match(source,/technicalSheetLabel:media\.technicalScope/);
 assert.match(source,/Notice de pose · famille/);
});
test('Carrodrain: 2027 tariff remains 635 variants with no changes to reference or price',()=>{
 const zip=fs.readFileSync(path.join(dir,'brand-data','carrodrain-config-01.b64'),'utf8').trim();
 const data=JSON.parse(zlib.gunzipSync(Buffer.from(zip,'base64')).toString('utf8'));
 assert.equal(data.groups.length,12);
 const rows=data.groups.flatMap(g=>g.variants);
 assert.equal(rows.length,635);
 assert.ok(rows.every(r=>String(r.reference||'').trim()&&Number.isFinite(Number(r.price))&&Number(r.price)>0));
 const low=rows.find(x=>x.version==='LOW'),pro=rows.find(x=>x.version==='PRO');
 assert.ok(low&&pro);
 assert.match(source,/purchaseDiscount:50/);
});
