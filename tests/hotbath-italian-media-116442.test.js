'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const index=require('../public/hotbath-italian-product-media.json');
const source=require('../hotbath-italian-media-server');
test('Hotbath Italian catalogue maps 12 collections and at least 600 exact-model photo links',()=>{
 const names=Object.keys(index.byCollection);
 assert.equal(names.length,12);
 const number=names.reduce((n,c)=>n+Object.keys(index.byCollection[c]).length,0);
 assert(number>=600,'All Italian collection model links must be indexed');
 for(const c of names)for(const [model,item]of Object.entries(index.byCollection[c])){
  assert.equal(source.lookup(c,model)?.image,item.image,c+' '+model);
  assert(item.officialProductPage.endsWith('/'+model));
  assert(!item.verified,'Italian collection HTML is not proof of live JPG availability');
 }
 assert.equal(source.lookup('Archie','UNKNOWN'),null);
 assert.equal(source.lookup('Mate','AR003'),null);
});
test('Hotbath image service rejects 404 HTML and accepts real JPEG only',async()=>{
 const jpg=Buffer.from([255,216,255,...Array(300).fill(4),255,217]);
 const html=Buffer.from('<html>Not found</html>');
 assert.equal(source.validBytes(jpg,'image/jpeg'),true);
 assert.equal(source.validBytes(html,'image/jpeg'),false);
 assert.equal(source.validBytes(jpg,'text/html'),false);
 const blocked=source.createService({get:async()=>({status:404,headers:{'content-type':'text/html'},data:html})});
 assert.equal(await blocked.media('Archie','AR003'),null);
 const success=source.createService({get:async()=>({status:200,headers:{'content-type':'image/jpeg'},data:jpg})});
 const photo=await success.media('Archie','AR003');
 assert.equal(photo.scope,'model');assert(photo.image.includes('AR003_1_2023.jpg'));
 assert.equal(photo.verified,true);
});
test('Hotbath Galassia UI prioritizes the Italian source without substituting a different model',()=>{
 const s=fs.readFileSync(require('node:path').join(__dirname,'../public/hotbath-galassia-configurator.js'),'utf8');
 assert.match(s,/hotbath-italian-product-media\.json/);
 assert.match(s,/function italianPhoto/);
 assert.match(s,/function onItalianError/);
 assert.match(s,/brokenItalian\.add/);
 assert.match(s,/item\?\.verified/);
});

test('Hotbath fallback catalogue includes exact model images without crossing collection or SKU',()=>{
 const other=require('../public/hotbath-exact-alternative-media.json');
 let matched=0;
 for(const [collection,byModel] of Object.entries(other.byCollection)){
  for(const [model,item] of Object.entries(byModel)){
   matched++;
   assert(index.byCollection[collection]?.[model],collection+' '+model+' is a real manufacturer model');
   assert.equal(item.officialProductPage,index.byCollection[collection][model].officialProductPage);
   assert.equal(item.status,'manufacturer-model-code-matched');
   const filename=item.image.split('/').pop().toUpperCase();
   assert(filename.startsWith('B_HOTBATH_'+collection.toUpperCase().replace(/\s+/g,'-')+'-'+model.toUpperCase()+'_'),collection+' '+model);
   assert(item.image.startsWith('https://img.edilportale.com/product-thumbs/b_Hotbath_'));
  }
 }
 assert(matched>=100,'Source is not a generic collection photo gallery');
 for(const code of ['SDSCH9','C7066'])
  assert(other.byCollection.Chap[code]?.image.includes('-'+code+'_'),'Missing Chap thumbnail '+code);
 assert(other.byCollection.Archie.AR124?.image.includes('-AR124_'));
 const js=fs.readFileSync(require('node:path').join(__dirname,'../public/hotbath-galassia-configurator.js'),'utf8');
 assert.match(js,/hotbath-exact-alternative-media\.json/);
 assert.match(js,/item\?\.verified/);
 assert.match(js,/brokenUrls\.add\(url\)/);
 assert.match(js,/function supplementalPhoto/);
 assert.match(js,/manufacturer-model-code-matched/);
 assert.match(js,/img\.edilportale\.com/);
 assert.match(js,/italianPhoto\(c,m\)\|\|validUrl\(checked\)/);
});
