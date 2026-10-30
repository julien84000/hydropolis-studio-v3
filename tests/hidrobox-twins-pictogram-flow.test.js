'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const trays=require('../public/hidrobox-tray-models-2026.js');
const official=require('../public/hidrobox-official-render.js');
const cascade=require('../public/hidrobox-tray-cascade-2026.js');
const raw=fs.readFileSync(path.join(__dirname,'../public/brand-data/hidrobox-config-01.b64'),'utf8').trim();
const groups=JSON.parse(zlib.gunzipSync(Buffer.from(raw,'base64')).toString('utf8')).groups;
const group=name=>groups.find(g=>g.collection===name);
test('TWINS must show precisely YL and YR, never a third model, Scene, Lisse or Ardoise',()=>{
 const twins=group('Twins');assert(twins);
 const rows=twins.variants.filter(v=>/^STWC\d{4}$/.test(v.reference));
 assert.deepEqual(trays.variants(twins,rows,official).map(x=>x.id),['twins-yl','twins-yr']);
 assert(rows.length>=90);
 for(const id of ['twins-yl','twins-yr']){
  const selected=trays.filter(twins,rows,id,official);
  assert(selected.length>0,id+' must have valid SKUs');
  assert(selected.every(x=>trays.submodel(twins,x,official)===id));
  assert.deepEqual([...new Set(selected.map(x=>cascade.enrich(twins,x).material))],['Kromat']);
  assert.deepEqual([...new Set(selected.map(x=>cascade.enrich(twins,x).finish))],['Microtex']);
  assert(selected.every(x=>/^[A-Z]{4}\d{4}$/.test(x.reference)));
  assert.match(trays.shapeSvg(id),/svg/);
 }
 const yl=trays.filter(twins,rows,'twins-yl',official);
 const yr=trays.filter(twins,rows,'twins-yr',official);
 assert(yl.some(x=>x.reference==='STWC0097'));
 assert(yr.some(x=>x.reference==='STWC0113'));
 assert(!yl.some(x=>x.reference==='STWC0113'));
 assert(!yr.some(x=>x.reference==='STWC0097'));
});
test('LINE displays X/Y/square pictograms and restricts each to manufacturer SKUs',()=>{
 const line=group('Line');assert(line);
 const rows=line.variants.filter(v=>/^SLIC\d{4}$/.test(v.reference));
 assert.deepEqual(trays.variants(line,rows,official).map(x=>x.id),['line-x','line-y','line-square']);
 for(const id of ['line-x','line-y','line-square']){
  const chosen=trays.filter(line,rows,id,official);assert(chosen.length>0,id);
  assert(chosen.every(v=>trays.submodel(line,v,official)===id),id);
 }
 const square=trays.filter(line,rows,'line-square',official);
 for(const sku of ['SLIC0587','SLIC0678','SLIC0041','SLIC0114'])assert(square.some(x=>x.reference===sku),sku);
 assert(!trays.filter(line,rows,'line-x',official).some(v=>square.some(x=>x.reference===v.reference)));
});
test('Only supplier-verified submodels are shown for each collection',()=>{
 for(const [name,expected] of Object.entries({
   One:['one-rectangle','one-square','one-angular'],
   Pure:['pure-rectangle'],Quadro:['quadro-rectangle'],
   Arq:['arq-rectangle'],Iconik:['iconik-rectangle','iconik-square'],
   Loovers:['loovers-share','loovers-round-c','loovers-round-l','loovers-round-r',
     'loovers-round-rect','loovers-single-l','loovers-single-r'],
   Unique:['unique-rectangle']
 })){
  const g=group(name);assert(g);
  const found=trays.variants(g,g.variants,official).map(x=>x.id);
  assert.deepEqual(found,expected,name);
 }
});
test('Correct model pictograms are mirrored while accessory selection remains separate',()=>{
 const left=trays.shapeSvg('twins-yl'),right=trays.shapeSvg('twins-yr');
 assert.notEqual(left,right);
 assert.match(left,/svg/);assert.match(right,/svg/);
 assert.equal(trays.shapeSvg('fake-model'),'');
 assert.equal(trays.filter(group('Twins'),[{reference:'OPSH0051'}],'twins-yl',official).length,0);
});
