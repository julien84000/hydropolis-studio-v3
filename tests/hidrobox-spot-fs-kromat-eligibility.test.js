'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const base=path.resolve(__dirname,'../public');
const read=name=>fs.readFileSync(path.join(base,name),'utf8');
const db=JSON.parse(zlib.gunzipSync(Buffer.from(read('brand-data/hidrobox-config-01.b64').trim(),'base64')).toString('utf8'));
const spot=require('../public/hidrobox-spot-2026.js'),fs2026=require('../public/hidrobox-fs-2026.js');
const spotKromat=new Set(['Spot 62','Spot 125','Spot 159','Spot 169','Spot 186']);
const fsKromat=new Set(['FS 19','FS 23']);
test('Only five supplier-priced Spot models expose Kromat coloured BAS/TRE/SPE',()=>{
 const actual=new Set(spot.rows.filter(r=>r.material==='Kromat').map(r=>r.model));
 assert.deepEqual([...actual].sort(),[...spotKromat].sort());
 for(const model of spotKromat){
  const entries=spot.rows.filter(r=>r.model===model&&r.material==='Kromat');
  assert.equal(entries.length,3,model);
  assert.deepEqual(new Set(entries.map(r=>r.colorGroup)),new Set(['BAS','TRE','SPE']));
  for(const row of entries){
   assert(/^WSCC\d{4}$/.test(row.reference),'Kromat exact SKU '+row.reference);
   assert(row.rawPrice>0);
  }
 }
 for(const model of new Set(spot.rows.map(r=>r.model))){
  if(!spotKromat.has(model)){
   assert(!spot.rows.some(r=>r.model===model&&r.material==='Kromat'),'Scene-only model '+model+' must have no coloured Kromat SKU');
  }
 }
});
test('Only FS 19 and FS 23 offer Kromat, all other FS retain the white Scene SKU',()=>{
 const imported=db.groups.find(g=>g.id==='fs').variants;
 const rows=fs2026.available(imported);
 const actual=new Set(rows.filter(r=>r.material==='Kromat').map(r=>r.model));
 assert.deepEqual([...actual].sort(),[...fsKromat].sort());
 for(const model of fsKromat){
  const entries=rows.filter(r=>r.model===model&&r.material==='Kromat');
  assert.equal(entries.length,3,model);
  assert.deepEqual(new Set(entries.map(r=>r.colorGroup)),new Set(['BAS','TRE','SPE']));
  assert(entries.every(r=>/^WFSC\d{4}$/.test(r.reference)&&r.rawPrice>0));
 }
 for(const model of new Set(rows.map(r=>r.model))){
  if(!fsKromat.has(model)){
   const rowsFor=rows.filter(r=>r.model===model);
   assert(rowsFor.every(r=>r.material==='Scene'&&r.colorGroup==='BLA'),model);
  }
 }
});
test('Spot and FS material controls are built from the selected model supplier rows, not a global Kromat menu',()=>{
 const spotUi=read('hidrobox-panel-spot-ui.js'),fsUi=read('hidrobox-fs-ui.js');
 assert.match(spotUi,/const variant=m\.rows\.filter\(x=>x\.model===current\.model\)/);
 assert.match(spotUi,/const materials=\[\.\.\.new Set\(variant\.map\(x=>x\.material\)\)\]/);
 assert.match(spotUi,/Kromat coloré existe uniquement pour Spot 62, 125, 159, 169 et 186/);
 assert.match(fsUi,/const materialRows=rows\.filter\(r=>r\.model===selected\.model\)/);
 assert.match(fsUi,/const materials=\[\.\.\.new Set\(materialRows\.map\(r=>r\.material\)\)\]/);
 assert.match(fsUi,/Kromat coloré : uniquement FS 19 et FS 23/);
 assert.match(spotUi,/data-hb-spot-color-tile/);
 assert.match(spotUi,/HydroProgramColour2026\?\.SWATCHES/);
 assert.match(fsUi,/hb-fs-swatches hb-pc-palette/);
 assert.match(fsUi,/HydroProgramColour2026\?\.SWATCHES/);
});
