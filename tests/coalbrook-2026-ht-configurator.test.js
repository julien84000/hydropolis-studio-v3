'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const C=require('../public/coalbrook-2026-model.js');
const rows=JSON.parse(read('public/catalog_coalbrook.json'));
const byRef=new Map(rows.map(x=>[x.reference,x]));
test('Coalbrook August 2026: ALL catalogue prices are EUR HT, no VAT conversion',()=>{
 const audit=C.audit(rows);
 assert.equal(audit.total,1483);
 assert.equal(audit.allHT,true);
 assert.equal(audit.missingPrice.length,0);
 assert.deepEqual([...new Set(rows.map(x=>x.vat))],['HT']);
 assert.equal(byRef.get('DO1000CP').price,225);
 assert.equal(byRef.get('DO1000CP').vat,'HT');
 assert.equal(byRef.get('CO1201').price,127.09);
 assert.equal(C.detail(byRef.get('DO1000CP')).price,225);
 assert.equal(C.detail(byRef.get('DO1000CP')).vat,'HT');
});
test('Coalbrook PDF taxonomy retains Domo, Decca, Bank, Zurich and manufacturer sections',()=>{
 assert.deepEqual(Object.keys(C.menus),['Robinetterie','Douche & bain','WC','Accessoires','Mobilier','Compléments mobilier']);
 for(const [ref,expected] of [
 ['DO1000CP',['Robinetterie','Domo','Lavabo']],
 ['BA1002CP',['Robinetterie','Bank','Lavabo']],
 ['DO3001CP',['Robinetterie','Domo','Douche']],
 ['BY8080MW',['Douche & bain','Bay','Receveurs']],
 ['DV9120BB',['Mobilier','Decimal','Meubles']]
 ]){
  const row=byRef.get(ref);assert.ok(row,ref+' must exist');assert.deepEqual(C.classification(row),expected,ref);
 }
});
test('Finition mobilier is not interpreted as brushed brass and options share one model',()=>{
 assert.equal(C.base(byRef.get('DV9120BB')),'DV9120');
 assert.equal(C.base(byRef.get('DV9120GG')),'DV9120');
 assert.equal(C.finish(byRef.get('DV9120BB')),'Brazed Brown');
 assert.equal(C.finish(byRef.get('DV9120GG')),'Gauge Green');
 assert.equal(C.finish(byRef.get('DO1000BB')),'Laiton brossé');
});
test('Technical page index and mandatory rough in are referenced, not synthesized',()=>{
 const row=byRef.get('DO1007CP');
 assert.ok(row);assert.equal(row.internalReference,'CO1201');
 assert.deepEqual(C.detail(row).specificationPages,[217]);
 assert.deepEqual(C.detail(byRef.get('CO1201')).specificationPages,[217,238]);
 assert.equal(byRef.get('CO1201').price,127.09);
 assert.ok(C.audit(rows).missingMedia>0,'Images still require import');
});
test('Configurator scripts parse and are loaded without replacing any catalogue or server',()=>{
 const html=read('public/index.html');
 for(const name of ['coalbrook-2026-model.js','coalbrook-2026-configurator.js','coalbrook-2026-configurator.css'])assert.ok(html.includes(name+'?v=__APP_VERSION__'),name);
 for(const name of ['public/coalbrook-2026-model.js','public/coalbrook-2026-configurator.js']){
  const r=spawnSync(process.execPath,['--check',path.join(root,name)],{encoding:'utf8'});
  assert.equal(r.status,0,name+': '+r.stderr);
 }
 const js=read('public/coalbrook-2026-configurator.js');
 assert.ok(js.includes('createSelectedProductRecord'));
 assert.ok(js.includes('child.accessoryFor=parent.id'));
 assert.ok(js.includes('commitSelectedRecords'));
 assert.ok(!js.includes('1.2'));
 assert.ok(!js.includes('state.commercial.supplierDiscounts='));
 const manifest=read('public/catalog_manifest.json');
 assert.ok(manifest.includes('catalog_coalbrook.json'));
});

test('Coalbrook official site imagery is exact per SKU and tech PDF links are manufacturer-hosted',()=>{
 const photoRows=rows.filter(p=>p.image);
 const docs=rows.filter(p=>p.technicalSheetUrl);
 assert.ok(photoRows.length>=500,'Need at least 500 verified official photo references');
 assert.ok(docs.length>=590,'Need at least 590 manufacturer-backed technical sheet links');
 for(const p of photoRows){
  const url=new URL(p.image);
  assert.equal(url.hostname,'coalbrook-bathrooms.transforms.svdcdn.com');
  const filename=decodeURIComponent(url.pathname.split('/').pop());
  assert.ok(filename.startsWith(p.reference+'.')||filename.startsWith(p.reference+'-')||filename.startsWith(p.reference+'_'),
   'Finish photo must match exact reference: '+p.reference+' => '+filename);
  assert.equal(p.imageFinishMatch,'exact');
 }
 for(const p of docs){
  const url=new URL(p.technicalSheetUrl);
  assert.equal(url.hostname,'coalbrook-bathrooms.files.svdcdn.com');
  assert.match(url.pathname,/\.pdf$/i);
 }
 assert.equal(byRef.get('DO1000CP').technicalSheetUrl.includes('DO1000'),true);
 assert.equal(byRef.get('DO1000CP').vat,'HT');
});
test('Configured Coalbrook media and PDF links exist as source records, without modifying other brands',()=>{
 const assets=JSON.parse(read('public/coalbrook-official-assets-2026.json'));
 assert.ok(assets.pagesProcessed>=200);
 assert.ok(Object.keys(assets.images).length>=500);
 assert.ok(Object.keys(assets.documents).length>=200);
 const app=read('public/app.js');
 assert.ok(app.includes('p.technicalSheetUrl'));
 const config=read('public/coalbrook-2026-configurator.js');
 assert.match(config,/Ouvrir la fiche technique PDF officielle/);
 assert.match(config,/Notice d’installation PDF/);
});

test('31 verified 2026 price corrections preserve HT and included body costs without double counting',()=>{
 const report=JSON.parse(read('public/coalbrook-2026-price-audit.json'));
 assert.equal(report.vat,'HT');
 assert.equal(report.corrected,31);
 assert.equal(report.verifiedAgainstPDF,593);
 for(const item of report.changes){
  const row=byRef.get(item.reference);
  assert.ok(row,'Reference '+item.reference+' must exist');
  assert.equal(row.price,item.newHT);
  assert.equal(row.vat,'HT');
 }
 const wall=byRef.get('DO1007CP'),body=byRef.get('CO1201');
 assert.equal(wall.price,228.13);
 assert.equal(body.price,127.09);
 assert.equal(wall.totalPrice,355.22);
 assert.equal(Number((wall.price+body.price).toFixed(2)),wall.totalPrice);
 const code=read('public/coalbrook-2026-configurator.js');
 assert.match(code,/totalPrice:Number\(main\.price\),internalPrice:0/);
 assert.match(code,/child\.accessoryFor=parent\.id/);
});
