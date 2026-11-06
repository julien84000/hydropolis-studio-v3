'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../public');
const ctx={window:{},console};
function load(name){vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name,timeout:5000})}
load('naxani-2026-catalog.js');
load('naxani-2026-enhancements.js');
load('naxani-plan-drawings.js');
const source=ctx.window.HydroNaxani2026;
const E=ctx.window.HydroNaxaniEnhancements;
E.annotate(source.rows);
const indexed=new Map(source.rows.map(x=>[x.reference,x]));
const doubles=source.rows.filter(x=>x.productType==='plan-integre'&&x.naSinkCount===2);
const group=collection=>doubles.filter(x=>x.collection===collection);
test('Naxani source tariff double basins cover all 95 exact priced SKU across nine families',()=>{
 assert.equal(doubles.length,95);
 assert.equal(new Set(doubles.map(x=>x.reference)).size,95);
 assert.deepEqual(Object.fromEntries(['Alma','Alpos','Aran','Ares','Borvo','Daro','Inis','Latu','Orbit'].map(c=>[c,group(c).length])),{
  Alma:9,Alpos:13,Aran:4,Ares:17,Borvo:21,Daro:4,Inis:4,Latu:2,Orbit:21
 });
 for(const p of doubles){
  const verified=E.doublePlans[p.reference];
  assert.ok(verified,'Missing exact SKU '+p.reference);
  assert.equal(verified.naVerifiedTariffPrice,p.price,p.reference);
  assert.equal(p.naWidth,verified.naDisplayWidth,p.reference);
  assert.equal(E.width(p),verified.naDisplayWidth,p.reference);
  assert.equal(p.naPosition,'Double vasque',p.reference);
  assert.equal(p.naVerifiedSourcePage,p.sourcePage,p.reference);
 }
});
test('Naxani Borvo / Daro: 25 previously hidden double basins restore true widths',()=>{
 const samples=[
  ['574026','Borvo',120,1100],['574224','Borvo',140,1479],
  ['574378','Borvo',150,1483],['574538','Borvo',182.5,2611],
  ['574590','Borvo',200,2667],['574712','Borvo',240,2999],
  ['574996','Daro',140,1304],['575115','Daro',150,1359],
  ['575153','Daro',160,1541],['575221','Daro',180,2090],
  ['571889','Alpos',149,2035],['572084','Alpos',182.5,2813],
  ['572268','Alpos',240,3298]
 ];
 for(const [ref,collection,w,price] of samples){
  const p=indexed.get(ref);
  assert.ok(p,ref);assert.equal(p.collection,collection,ref);
  assert.equal(p.naSinkCount,2,ref);
  assert.equal(E.width(p),w,ref);
  assert.equal(p.naWidth,w,ref);
  assert.equal(p.price,price,ref);
 }
 assert.equal(doubles.filter(x=>['Borvo','Daro'].includes(x.collection)).length,25);
});
test('Naxani: no unpriced double-integrated basin fabricated for the other six families',()=>{
 for(const name of ['Forma Large','Forma Small','Patra','Prenn','Tulpan','2R'])
  assert.equal(group(name).length,0,name+' has no double basin SKU in tariff PDF 2026');
 const ui=fs.readFileSync(path.join(root,'naxani-modular-configurator.js'),'utf8');
 assert.match(ui,/Double vasque : sur devis/);
 assert.match(ui,/pas de référence et de prix public confirmés/);
 assert.match(ui,/const allIntegratedModels/);
 assert.match(ui,/topDrawing\(sample\)/);
});
test('Naxani: 15 cropped manufacturer technical diagrams bound to the matching family',()=>{
 const drawings=ctx.window.HydroNaxaniPlanDrawings;
 assert.equal(drawings.names.length,15);
 for(const name of drawings.names){
  const html=drawings.html(name);
  assert.match(html,/nax-plan-technical/);
  assert.match(html,/background-position/);
  assert.ok(html.includes(name));
 }
 assert.equal(drawings.html('nonexistent'),'');
 const js=fs.readFileSync(path.join(root,'naxani-plan-drawings.js'),'utf8');
 const m=js.match(/const payload="([A-Za-z0-9+/=]+)"/);
 assert.ok(m,'WebP sprite payload missing');
 const binary=Buffer.from(m[1],'base64');
 assert.equal(binary.subarray(0,4).toString('ascii'),'RIFF');
 assert.equal(binary.subarray(8,12).toString('ascii'),'WEBP');
 assert.ok(binary.length>3000,'Manufacturer sprite appears empty');
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(index.includes('naxani-plan-drawings.js?v=__APP_VERSION__'));
 assert.ok(index.indexOf('naxani-plan-drawings.js')<index.indexOf('naxani-modular-configurator.js'));
 const css=fs.readFileSync(path.join(root,'naxani-configurator.css'),'utf8');
 assert.match(css,/\.nax-plan-technical/);
});
