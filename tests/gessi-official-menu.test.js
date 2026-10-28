'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');
const legacy=JSON.parse(read('public/gessi-area-pro-data.json')),menu=JSON.parse(read('public/gessi-area-pro-menu.json'));
const context={window:{}};vm.runInNewContext(read('public/gessi-area-pro.js'),context);const g=context.window.HydroGessiAreaPro;
test('Official FR menu preserves every collection, image and series with source provenance',()=>{
 const raw=read('tests/fixtures/gessi-areapro/menu-fr.json'),source=JSON.parse(raw).data;
 assert.equal(menu.sourceSha256,crypto.createHash('sha256').update(raw).digest('hex'));
 assert.equal(menu.areas.length,9);assert.equal(menu.areas.reduce((n,a)=>n+a.collections.length,0),79);
 for(const [i,a] of menu.areas.entries()){
  assert.equal(a.officialId,source[i].ambientId);
  for(const [j,c] of a.collections.entries()){
   const original=source[i].collections[j];
   assert.equal(c.id,original.collectionId);assert.equal(c.image,original.collectionMainImage||'');
   assert.equal(c.series.length,original.series.length);
   if(c.image)assert.equal(new URL(c.image).hostname,'gwebassets.gessi.com');
  }
 }
});
test('Menu augmentation retains all 16211 original tariff objects exactly once and all 130 verified photos',()=>{
 const bytes=fs.readFileSync(require('node:path').join(__dirname,'../public/catalog_gessi.json.gz'));
 const rows=JSON.parse(zlib.gunzipSync(bytes));const before=JSON.stringify(rows);
 const data=g.withOfficialMenu(legacy,menu),index=g.buildIndex(rows,data);
 const listed=index.areas.flatMap(a=>g.listAreaCollections(index,a).flatMap(c=>c.rows));
 assert.equal(listed.length,16211);assert.equal(new Set(listed).size,16211);
 assert.ok(listed.every(p=>rows.includes(p)));assert.equal(JSON.stringify(rows),before);
 assert.equal(data.exactFinishImages,legacy.exactFinishImages);
 const bathroom=data.areas.find(a=>a.id==='bathroom');assert.equal(bathroom.collections.length,18);
 assert.equal(g.officialPhoto(bathroom,'origini'),menu.areas.find(a=>a.id==='bathroom').collections.find(c=>c.name==='ORIGINI').image);
 assert.equal(g.withOfficialMenu(legacy,null),legacy);
});
