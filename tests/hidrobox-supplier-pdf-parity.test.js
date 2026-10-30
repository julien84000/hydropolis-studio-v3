'use strict';
/* Coverage audit against all codes extracted from the user's original
 * Hidrobox French February 2026 price list (87 pages).
 * A PDF code is NOT evidence that the article is orderable: spare parts,
 * accessory and duplicate columns are listed separately for review.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const root=path.join(__dirname,'..');
function load(file){return JSON.parse(zlib.gunzipSync(Buffer.from(
 fs.readFileSync(path.join(root,'public/brand-data',file),'utf8').trim(),'base64')).toString('utf8'));}
const source=require('./fixtures/hidrobox/supplier-2026-pdf-skus.json');
const specialSource=require('./fixtures/hidrobox/supplier-2026-special-parts-prices.json');
const panelPricing=require('../public/hidrobox-panels-2026.js');
const sparePricing=require('../public/hidrobox-spares-2026.js');
const extraOptionPricing=require('../public/hidrobox-additional-options-2026.js');
const vm=require('node:vm');
const programCtx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'public/hidrobox-program-data.js'),'utf8'),programCtx);
const programData=programCtx.window.HydroProgramData;

const config=load('hidrobox-config-01.b64'),catalog=load('hidrobox-catalog-01.b64');
const collect=data=>(Array.isArray(data)?data:(data.groups||data.items||data.products||[]))
 .flatMap(x=>x.variants?.length?x.variants:[x])
 .map(x=>String(x.reference||x.ref||'').toUpperCase()).filter(Boolean);
const imported=new Set([...collect(config),...collect(catalog)]
 .filter(code=>/^[A-Z]{3,6}\d{4}$/.test(code))); // Exclude 27 synthetic HBX-CFG navigation entries
const panelSourceRows=panelPricing.mapped;
const programReferences=[...(programData.rows||[]).map(r=>r.reference),...Object.keys(programData.options||{})];
const implemented=new Set([...imported,...panelSourceRows.map(r=>r.reference),...programReferences,...specialSource.rows.map(r=>r.reference),...sparePricing.rows.map(r=>r.reference)]);
const sourceCodes=new Map(source.sourceSkus);
const specialPriceIndex=new Map(specialSource.rows.map(x=>[x.reference,x]));
function prefix(code){return String(code).match(/^[A-Z]+/)?.[0]||'OTHER';}
test('Supplier PDF 2026 SKU inventory is available, with independent imported coverage audit',()=>{
 assert.equal(source.pageCount,87);
 assert(sourceCodes.size>5000,'PDF extraction unexpectedly incomplete');
 const coreShowerPrefixes=['SNEC','SLIC','STWC','SQUC','SONC','SPUC','SARC','SLOC','SUNC','SICC'];
 const pdfShowerCodes=[...sourceCodes.keys()].filter(sku=>coreShowerPrefixes.some(p=>sku.startsWith(p)));
 const missingShower=pdfShowerCodes.filter(sku=>!imported.has(sku));
 assert.equal(pdfShowerCodes.length,2027,'Unexpected Hidrobox shower-tray manufacturer SKU count');
 assert.deepEqual(missingShower,[],'Every primary shower-tray SKU printed in 2026 tariff must be imported');
 const missing=[...sourceCodes].filter(([sku])=>!implemented.has(sku));
 const unclassified=missing.filter(([sku])=>!extraOptionPricing.byRef.has(sku));
 assert.equal(extraOptionPricing.rows.length,29,'Final source option registry must list exactly 29 codes');
 assert.deepEqual(unclassified,[],'Every remaining 2026 supplier reference must have explicit tariff handling');
 assert.deepEqual(missing.map(([sku])=>sku).sort(),extraOptionPricing.rows.map(x=>x.reference).sort(),
  'The additional-options registry may not hide real product SKU omissions');
 const summary={};for(const [sku,page] of missing){const p=prefix(sku);if(!summary[p])summary[p]={count:0,samples:[],pages:[]};
  summary[p].count++;if(summary[p].samples.length<8)summary[p].samples.push(sku);
  if(summary[p].pages.length<8&&!summary[p].pages.includes(page))summary[p].pages.push(page);
 }
 const total={supplierPdfUniqueSkus:sourceCodes.size,importedUniqueSkus:imported.size,
   programmedPanelSkus:panelSourceRows.length,programDataReferences:programReferences.length,sparePartReferences:sparePricing.rows.length,effectiveUniqueSkus:implemented.size,primaryShowerPdfSkus:pdfShowerCodes.length,primaryShowerMissing:missingShower.length,
   missingFromEffectiveCatalog:missing.length,classifiedNonProductOptions:extraOptionPricing.rows.length,unclassifiedSupplierCodes:unclassified.length,missingByPrefix:Object.entries(summary).sort((a,b)=>b[1].count-a[1].count)};
 console.log('HIDROBOX_PDF_PARITY '+JSON.stringify(total));
 console.log('HIDROBOX_MISSING_2026_CODES '+JSON.stringify(missing.map(([reference,page])=>({reference,page}))));
 const reportDir=path.join(root,'build-audit');
 fs.mkdirSync(reportDir,{recursive:true});
 fs.writeFileSync(path.join(reportDir,'hidrobox-2026-pdf-parity.json'),
  JSON.stringify({...total,missingCodes:missing.map(([reference,page])=>({reference,pdfPage:page}))},null,2)+'\n','utf8');
 // Diagnostic audit: do not claim all supplier codes are commercial SKUs or
 // block unrelated releases before the supplier-code classification is finished.
 assert(imported.size>4000,'Hidrobox supplier import unexpectedly shrunk');
 assert.equal(panelSourceRows.length,496,'All manufacturer wall panel codes must be accessible through the specific calculator');
 assert.equal(sparePricing.rows.length,170,'All page 83 priced spare parts must be included');
 assert(missing.length<=29,'More than the known 29 remaining unresolved tariff options are missing');
 assert(programReferences.length>=180,'Program supplier product/option references unexpectedly missing');
 for(const option of Object.values(programData.options||{}))assert(Number.isFinite(Number(option.rawPrice))&&Number(option.rawPrice)>=0,option.reference+' invalid price');
 const g=(config.groups||[]).flatMap(group=>group.variants||[]);
 const panelAudit=panelPricing.verifyImported(g);
 assert.deepEqual(panelAudit.priceConflicts,[],'Panel tariff import conflicts with official 2026 matrix');
 assert.equal(panelAudit.missingFromImport.length,125,'Revisit audit if compressed import becomes more complete');
});

test('Hidrobox 2026 PDF: every SCOC/VCOC reference has a genuine manufacturer source price',()=>{
 assert.equal(specialPriceIndex.size,1360);
 const specialCodes=[...sourceCodes.keys()].filter(ref=>/^(SCOC|VCOC)\d{4}$/.test(ref));
 assert.equal(specialCodes.length,1360);
 assert.deepEqual(specialCodes.filter(ref=>!specialPriceIndex.has(ref)),[]);
 assert(specialSource.rows.every(r=>Number.isFinite(r.rawPrice)&&r.rawPrice>0&&[36,37,38].includes(r.sourcePage)));
 const variants=(config.groups||[]).flatMap(g=>g.variants||[]);
 const conflicts=variants.filter(r=>specialPriceIndex.has(r.reference)&&Number(r.rawPrice)!==specialPriceIndex.get(r.reference).rawPrice)
  .map(r=>({reference:r.reference,importedPrice:r.rawPrice,pdfPrice:specialPriceIndex.get(r.reference).rawPrice}));
 assert.deepEqual(conflicts,[],'Original PDF price and imported source must match exactly, before 4% uplift');
 const missing=specialSource.rows.filter(r=>!imported.has(r.reference));
 console.log('HIDROBOX_SPECIAL_PARTS '+JSON.stringify({sourceSkus:specialPriceIndex.size,
   imported:1360-missing.length,missingInCompressedImport:missing.length,
   sampleMissing:missing.slice(0,15)}));
});
