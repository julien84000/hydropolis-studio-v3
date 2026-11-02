'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const pub=path.join(__dirname,'../public'),root={};
for(const f of ['radaway-official-catalog.js','radaway-extended-catalog.js','radaway-photo-seeds.js','radaway-gallery-2026.js']){
 const js=fs.readFileSync(path.join(pub,f),'utf8');
 vm.runInNewContext(js,{window:root,module:{exports:{}}},{filename:f,timeout:5000});
}
const gallery=root.HydroRadawayGallery,rows=root.HydroRadawayCatalog.rows;
test('All Radaway catalogue items have a manufacturer photo or explicitly illustrative gallery preview',()=>{
 assert.ok(rows.length>=140);
 const missing=rows.filter(row=>!gallery.previewFor(row)?.url);
 assert.equal(missing.length,0,missing.map(r=>r.designation).join(', '));
 for(const r of rows){
  const p=gallery.previewFor(r);
  assert.ok(gallery.valid(p.url),r.designation);
  assert.ok(p.exact||gallery.illustrationFor(r),r.designation);
 }
});
test('Official manufacturer images have exact model IDs and are never mistaken for generic collection photos',()=>{
 const gold=rows.find(p=>p.reference==='RAD-MODELE-MODO-XL-GOLD');
 assert.ok(gold);
 assert.equal(gallery.previewFor(gold).exact,true);
 assert.match(gallery.exactFor(gold),/Radaway-Modo-Gold-XL/);
 const missingFinish=rows.find(p=>p.reference==='RAD-MODELE-MODO-XL-BRUSHED-GUNMETAL');
 assert.ok(missingFinish);
 assert.equal(gallery.exactFor(missingFinish),'');
 assert.equal(gallery.previewFor(missingFinish).exact,false);
});
test('Configurator exposes its illustrative photo status and attempts to upgrade to the exact model photo',()=>{
 const source=fs.readFileSync(path.join(pub,'radaway-configurator.js'),'utf8');
 assert.match(source,/photoFor\(p\)/);
 assert.match(source,/shown\.filter\(p=>!exactPhoto\(p\)\)/);
 assert.match(source,/Visuel fabricant indicatif/);
 assert.match(source,/imageFinishMatch:previewFor\(selected\)\?\.exact/);
 assert.match(source,/card\.querySelector\('img'\)/);
 const html=fs.readFileSync(path.join(pub,'index.html'),'utf8');
 assert.ok(html.indexOf('radaway-gallery-2026.js')<html.indexOf('radaway-configurator.js'));
});
