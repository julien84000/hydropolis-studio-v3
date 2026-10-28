'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const root=path.join(__dirname,'..','public');
const source=fs.readFileSync(path.join(root,'hidrobox-guided.js'),'utf8');
const docs={
 neoPlusBim:'https://hidrobox.com/wp-content/uploads/2025/01/BIMobject-Shower-tray-Neo-Plus.zip',
 neoPlus3D:'https://hidrobox.com/wp-content/uploads/2025/05/Neo-Plus-80x140x3-1.zip',
 lineBim:'https://hidrobox.com/wp-content/uploads/2025/05/BIMobject-Shower-tray-Line-X-Scene-Smooth.zip',
 line3D:'https://hidrobox.com/wp-content/uploads/2025/05/STL-Line-Hidrobox.zip'
};
test('Hidrobox: official Neo Plus and Line BIM/3D downloads are collection-scoped and not advertised as exact finish',()=>{
 for(const [name,url] of Object.entries(docs)){
   const uri=new URL(url);
   assert.equal(uri.protocol,'https:');
   assert.equal(uri.hostname,'hidrobox.com');
   assert.ok(uri.pathname.startsWith('/wp-content/uploads/'));
   assert.ok(uri.pathname.endsWith('.zip'));
   assert.ok(source.includes(url),name+' official manufacturer link omitted');
 }
 assert.match(source,/const officialZip=url=>\/\^https:/);
 assert.match(source,/const bim=officialZip\(assets\.bim\),model3D=officialZip\(assets\.model3D\)/);
 assert.match(source,/Objet BIM constructeur · famille/);
 assert.match(source,/Modèle 3D constructeur · exemple, dimensions à vérifier/);
 assert.match(source,/Modèle 3D constructeur · 80 × 140 × 3 cm/);
 assert.match(source,/technicalSheetUrl:tech/);
 assert.match(source,/installationGuideUrl:manual/);
});

test('Hidrobox: all 4479 variants preserve source tariff +4% and their original supplier codes',()=>{
 const bytes=fs.readFileSync(path.join(root,'brand-data','hidrobox-config-01.b64'),'utf8').trim();
 const data=JSON.parse(zlib.gunzipSync(Buffer.from(bytes,'base64')).toString('utf8'));
 assert.equal(data.groups.length,27);
 let count=0;
 for(const group of data.groups)for(const item of group.variants){
   count++;
   assert.ok(item.reference);
   assert.ok(Number.isFinite(Number(item.rawPrice))&&Number(item.rawPrice)>0);
   assert.equal(Number(item.price),Math.round(Number(item.rawPrice)*104)/100,item.reference);
 }
 assert.equal(count,4479);
 assert.match(source,/purchaseDiscount:50/);
});
