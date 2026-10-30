'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const rows=require('../public/catalog_galassia.json');
const official=require('../public/galassia/official-index.json');
const conflicts=require('../public/galassia/price-conflicts.json');
const moduleApi=require('../public/galassia-configurator.js');
const technical=require('../galassia-technical-server.js');
const byRef=new Map(rows.map(p=>[p.reference,p]));
test('Galassia Listino 32: independently priced SKUs and quarantined conflicting rows',()=>{
 assert.equal(rows.length,1090);
 assert.equal(new Set(rows.map(p=>p.reference)).size,rows.length);
 assert.equal(conflicts.count,33);
 const blocked=new Set(conflicts.rows.map(p=>p.reference));
 assert(rows.every(p=>!blocked.has(p.reference)));
 assert(rows.every(p=>p.manufacturer==='Galassia'&&p.price>0&&p.totalPrice===p.price));
 assert(rows.every(p=>p.purchaseDiscount===50));
 assert(rows.every(p=>Number.isInteger(p.sourcePage)&&p.sourcePage>=1&&p.sourcePage<=291));
});
test('Galassia R70 SKU and finish variant differ exactly in list prices',()=>{
 assert.equal(byRef.get('7701').price,418);
 assert.equal(byRef.get('7701MT').price,585);
 assert.equal(byRef.get('7701').finish,'Blanc');
 assert.equal(byRef.get('7701MT').finish,'Blanc mat');
 assert.equal(byRef.get('7701SFMT').price,585);
 assert.equal(byRef.get('7701SFMT').base,'7701SF');
 assert.equal(moduleApi.modelId(byRef.get('7701SFMT')),'7701SF');
 assert(!moduleApi.variantsFor(rows,byRef.get('7701SF')).some(p=>p.reference==='7701'));
});
test('Collection and model drilldown does not mix manufacturer and variant types',()=>{
 const cols=moduleApi.familyList(rows);
 assert(cols.includes('R70'));assert(cols.includes('Dream')||cols.includes('DREAM'));
 const models=moduleApi.modelList(rows,'R70','Lavabos','7701');
 assert(models.some(p=>p.base==='7701'));
 assert(models.some(p=>p.base==='7701SF'));
 assert(rows.filter(p=>p.image).every(p=>/^https:\/\/www\.ceramicagalassia\.it\//.test(p.image)));
 assert(rows.every(p=>/^https:\/\/www\.ceramicagalassia\.it\/catalogo\//.test(p.manufacturerUrl)));
 assert(official.collections.some(c=>c.name==='R70'&&c.items.some(p=>p.base==='7701')));
});
test('50% discount is a supplier condition, not a client quote discount',()=>{
 const p=byRef.get('7701');
 assert.equal(p.price,418);
 assert.equal(p.price*(1-p.purchaseDiscount/100),209);
 assert.equal(Object.prototype.hasOwnProperty.call(p,'quoteDiscountOverride'),false);
});
test('Official technical link resolver cannot accept arbitrary user supplied URLs',()=>{
 const html='<a href="/public/schede%20tecniche%202025/7701.pdf">Scheda Tecnica</a>';
 const source='https://www.ceramicagalassia.it/catalogo/r70/lavabo.html';
 const link=technical.fromPage(html,source);
 assert.equal(link,'https://www.ceramicagalassia.it/public/schede%20tecniche%202025/7701.pdf');
 assert.equal(technical.fromPage('<a href="http://127.0.0.1/file.pdf">Scheda Tecnica</a>',source),null);
 assert.equal(technical.fromPage('<a href="https://evil.example/attacker.pdf">Scheda Tecnica</a>',source),null);
 assert(technical.allowed.has('7701'));
 assert(moduleApi.technicalLink(byRef.get('7701')).includes('7701.pdf'));
});
test('Manufacturer media and technical PDF are never invented for non-indexed SKUs',()=>{
 const unsupported=rows.filter(p=>!p.image);
 assert(unsupported.length>0);
 assert(unsupported.every(p=>!p.technicalSheetUrl));
 const code=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
 assert.match(code,/HydroGalassiaConfigurator\?\.eligible/);
 assert.match(code,/Carrodrain\|Galassia/);
 assert.match(code,/Galassia:50/);
 const manifest=require('../public/catalog_manifest.json');
 assert(manifest.chunks.some(p=>p.file==='catalog_galassia.json'&&p.count===rows.length));
});
