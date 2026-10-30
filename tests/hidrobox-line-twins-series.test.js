'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
const visual=require('../public/hidrobox-official-render.js');
const content=fs.readFileSync(path.join(__dirname,'../public/brand-data/hidrobox-config-01.b64'),'utf8');
const catalog=JSON.parse(zlib.gunzipSync(Buffer.from(content.trim(),'base64')).toString('utf8'));
test('All Line and Twins imported 2026 references resolve to one manufacturer orientation, never from geometry alone',()=>{
 const expected={Line:['line-x','line-y'],Twins:['twins-yl','twins-yr']};
 for(const [name,allowed] of Object.entries(expected)){
   const group=catalog.groups.find(g=>g.collection===name);assert(group,name+' group absent');
   const prefix=name==='Line'?'SLIC':'STWC';
   const products=(group.variants||[]).filter(v=>String(v.reference||'').startsWith(prefix));
   assert(products.length>40,name+' priced tray references unexpectedly sparse');
   const misses=products.filter(v=>!allowed.includes(visual.modelFromReference(v.reference)));
   assert.equal(misses.length,0,name+' incomplete SKU mapping: '+misses.slice(0,20).map(x=>x.reference).join(', '));
   const kinds=[...new Set(products.map(v=>visual.modelFromReference(v.reference)))].sort();
   assert.deepEqual(kinds,allowed.slice().sort());
   console.log('Hidrobox '+name+': '+products.length+' genuine shower tray SKUs; accessory rows excluded');
 }
});
test('Line X / Line Y and Twin YL / Twin YR remain distinct for documented samples and edge codes',()=>{
 const samples={SLIC0533:'line-x',SLIC0588:'line-x',SLIC0589:'line-y',SLIC0623:'line-y',
  SLIC0698:'line-x',SLIC0712:'line-y',SLIC0729:'line-x',SLIC0876:'line-x',SLIC0877:'line-y',
  STWC0097:'twins-yl',STWC0112:'twins-yl',STWC0113:'twins-yr',
  STWC0128:'twins-yr',STWC0129:'twins-yl',STWC0144:'twins-yl',
  STWC0145:'twins-yr',STWC0160:'twins-yr'};
 for(const [ref,series] of Object.entries(samples))assert.equal(visual.modelFromReference(ref),series,ref);
 assert.equal(visual.modelFromReference('SLIC9999'),'');
 assert.equal(visual.modelFromReference('STWC9999'),'');
 assert.equal(visual.modelFor({collection:'Line'},{reference:'SLIC0533'}),'line-x');
 assert.equal(visual.modelFor({collection:'Line'},{reference:'SLIC0589'}),'line-y');
 assert.equal(visual.modelFor({collection:'Twins'},{reference:'STWC0097'}),'twins-yl');
 assert.equal(visual.modelFor({collection:'Twins'},{reference:'STWC0113'}),'twins-yr');
});
