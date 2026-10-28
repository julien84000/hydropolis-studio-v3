'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const bette=require('../public/bette-official-resources.js');
const root=path.join(__dirname,'..','public');
const js=fs.readFileSync(path.join(root,'brand-configurators.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
test('Bette: official product family links are strict and never inferred from neighbouring models',()=>{
 assert.equal(bette.knownFamilies.length,6);
 const targets=[
 ['BetteAir','https://www.my-bette.com/fr/produits/autres-sujets-sur-les-produits/betteair'],
 ['LaBette','https://www.my-bette.com/fr/produit/baignoires/labette'],
 ['BetteFloor','https://www.my-bette.com/fr/produit/receveurs-de-douche-receveurs-ultra-plats/bettefloor'],
 ['BetteFlat','https://www.my-bette.com/fr/produit/receveurs-de-douche-receveurs-ultra-plats/betteflat'],
 ['BetteStarlet','https://www.my-bette.com/fr/produit/baignoires/bettestarlet'],
 ['BetteStarlet V Silhouette','https://www.my-bette.com/fr/produit/baignoires/bettestarlet-v-silhouette']
 ];
 for(const [name,url]of targets){
   const d=bette.resolve(name);
   assert.equal(d.productPage,url);
   assert.match(d.configuratorPage,/^https:\/\/www\.my-bette\.com\/fr\/service\/configurateur$/);
   assert.match(d.downloadsPage,/^https:\/\/www\.my-bette\.com\/fr\/service\/downloads$/);
 }
 assert.equal(bette.resolve('BetteFlat Pro').productPage,'','no silent product variant substitution');
 assert.equal(bette.resolve('Unknown').technicalSheetUrl,'','no guessed technical document');
 const sheet=bette.resolve('LaBette');
 assert.equal(sheet.technicalScope,'family');
 assert.match(sheet.technicalSheetUrl,/^https:\/\/content\.my-bette\.com\/.+DS-LaBette-BW_0069-FR\.pdf$/);
});
test('Bette: official resources loaded before configuration; visuals not asserted exact without finish proof',()=>{
 assert.ok(html.indexOf('bette-official-resources.js')<html.indexOf('brand-configurators.js'));
 assert.match(sw,/bette-official-resources\.js/);
 assert.match(js,/root\.HydroBetteResources\?\.resolve\(g\?\.family\|\|p\?\.collection\)/);
 assert.match(js,/brand==='Bette'&&v\?\.imageFinishMatch!=='exact'\?'':suppliedImage/);
 assert.match(js,/imageFinishMatch:media\.image\?'exact':media\.representativeImage\?'collection':'missing'/);
 assert.match(js,/Configurateur 3D Bette · couleurs et options/);
 assert.match(js,/Plans, CAO\/BIM et notices Bette/);
 assert.match(js,/technicalSheetLabel:media\.technicalScope/);
});
test('Bette: 62 264 original tariff rows are intact with their reference and price',()=>{
 let b64='';
 for(let i=1;i<=3;i++)b64+=fs.readFileSync(path.join(root,'brand-data','bette-config-'+String(i).padStart(2,'0')+'.b64'),'utf8').trim();
 const data=JSON.parse(zlib.gunzipSync(Buffer.from(b64,'base64')).toString('utf8'));
 assert.equal(data.groups.length,93);
 const rows=data.groups.flatMap(g=>g.variants);
 assert.equal(rows.length,62264);
 assert.ok(rows.every(v=>v.reference&&Number.isFinite(Number(v.price))&&Number(v.price)>0));
 assert.match(js,/purchaseDiscount:50,configuratorType:'bette-configured'/);
});
