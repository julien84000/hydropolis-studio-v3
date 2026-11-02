'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const pub=path.join(__dirname,'../public');
const window={};
for(const file of ['radaway-official-catalog.js','radaway-extended-catalog.js','radaway-hierarchy.js','radaway-configurator.js']){
 const code=fs.readFileSync(path.join(pub,file),'utf8');
 vm.runInNewContext(code,{window,URL},{filename:file,timeout:5000});
}
const H=window.HydroRadawayHierarchy,rows=window.HydroRadawayCatalog.rows;
test('Radaway navigation exposes all four groups and manufacturer form topology',()=>{
 assert.deepEqual(H.groups.map(g=>g.id).join(','),'paroi,walk,doors,bath');
 assert.equal(H.byGroup('paroi').length,8);
 assert.equal(H.byGroup('walk').length,2);
 assert.equal(H.byGroup('doors').length,5);
 assert.equal(H.byGroup('bath').length,7);
 for(const g of H.groups)for(const option of H.byGroup(g.id)){
  assert.ok(option.url.startsWith('https://www.radaway.fr/typ/'));
  assert.match(H.pictogram(option),/<svg.*path/);
 }
});
test('All registered Radaway models are official and have no fabricated retail prices',()=>{
 assert.ok(rows.length>=140,'expected expanded official models');
 assert.equal(rows.length,new Set(rows.map(r=>r.reference)).size,'duplicate model keys');
 for(const row of rows){
  assert.equal(row.manufacturer,'Radaway');
  assert.equal(row.price,0);
  assert.match(row.manufacturerUrl,/^https:\/\/www\.radaway\.fr\/kategoria\//);
  assert.ok(['paroi','walk','doors','bath'].includes(H.groupFor(row)));
 }
});
test('Walk-in branches include multiple series and manufacturer model finishes',()=>{
 const walk=rows.filter(p=>H.groupFor(p)==='walk');
 const names=new Set(walk.map(p=>p.collection));
 for(const s of ['Modo X','Modo XL','Modo F','Modo F SL','Modo SL','Modo New','Furo','Furo SL','Nes 6','Essenza Pro 8','Arta 8'])
  assert.ok(names.has(s),s);
 assert.ok(walk.some(p=>H.shapeFor(p)==='mono'));
 assert.ok(walk.some(p=>H.shapeFor(p)==='multi'));
});
test('Browser picker renders form first and loads official product images on demand',()=>{
 const ui=fs.readFileSync(path.join(pub,'radaway-configurator.js'),'utf8');
 const server=fs.readFileSync(path.join(__dirname,'../radaway-media-server.js'),'utf8');
 const html=fs.readFileSync(path.join(pub,'index.html'),'utf8');
 assert.match(ui,/function renderShapes\(\)/);
 assert.match(ui,/renderType\(\);renderShapes\(\);renderGrid\(\)/);
 assert.match(ui,/radaway-crumbs/);
 assert.match(ui,/radaway-shapes/);
 assert.match(ui,/api\/radaway-model-media/);
 assert.match(server,/\/api\/radaway-model-media/);
 assert.ok(html.indexOf('radaway-extended-catalog.js')<html.indexOf('radaway-configurator.js'));
 assert.ok(html.indexOf('radaway-hierarchy.js')<html.indexOf('radaway-configurator.js'));
});
