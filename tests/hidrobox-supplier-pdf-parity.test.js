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
const panelPricing=require('../public/hidrobox-panels-2026.js');
const config=load('hidrobox-config-01.b64'),catalog=load('hidrobox-catalog-01.b64');
const collect=data=>(Array.isArray(data)?data:(data.groups||data.items||data.products||[]))
 .flatMap(x=>x.variants?.length?x.variants:[x])
 .map(x=>String(x.reference||x.ref||'').toUpperCase()).filter(Boolean);
const imported=new Set([...collect(config),...collect(catalog)]);
const panelSourceRows=panelPricing.mapped;
const implemented=new Set([...imported,...panelSourceRows.map(r=>r.reference)]);
const sourceCodes=new Map(source.sourceSkus);
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
 const summary={};for(const [sku,page] of missing){const p=prefix(sku);if(!summary[p])summary[p]={count:0,samples:[],pages:[]};
  summary[p].count++;if(summary[p].samples.length<8)summary[p].samples.push(sku);
  if(summary[p].pages.length<8&&!summary[p].pages.includes(page))summary[p].pages.push(page);
 }
 const total={supplierPdfUniqueSkus:sourceCodes.size,importedUniqueSkus:imported.size,
   programmedPanelSkus:panelSourceRows.length,effectiveUniqueSkus:implemented.size,primaryShowerPdfSkus:pdfShowerCodes.length,primaryShowerMissing:missingShower.length,
   missingFromEffectiveCatalog:missing.length,missingByPrefix:Object.entries(summary).sort((a,b)=>b[1].count-a[1].count)};
 console.log('HIDROBOX_PDF_PARITY '+JSON.stringify(total));
 // Diagnostic audit: do not claim all supplier codes are commercial SKUs or
 // block unrelated releases before the supplier-code classification is finished.
 assert(imported.size>4000,'Hidrobox supplier import unexpectedly shrunk');
 assert.equal(panelSourceRows.length,496,'All manufacturer wall panel codes must be accessible through the specific calculator');
 const g=(config.groups||[]).flatMap(group=>group.variants||[]);
 const panelAudit=panelPricing.verifyImported(g);
 assert.deepEqual(panelAudit.priceConflicts,[],'Panel tariff import conflicts with official 2026 matrix');
 assert.equal(panelAudit.missingFromImport.length,125,'Revisit audit if compressed import becomes more complete');
});
