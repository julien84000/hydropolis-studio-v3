'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const svc=require('../bette-official-media-server');
const client=require('../public/bette-model-media');
const PRODUCT='https://www.my-bette.com/fr/produit/baignoires/bettestarlet-i';
const IMAGE='https://content.my-bette.com/produkt_bilder/BetteStarlet-I-134599/186085/image-thumb__186085__ProductEntryThumbImage/BEMI_Starlet_I_8310_000_EB_Website_content.0e202fc8.png';
const TEASER='https://content.my-bette.com/produkt_bilder/BetteStarlet-I-134599/186085/image-thumb__186085__ProductTeaserImage/BEMI_Starlet_I_8310_000_EB_Website_content.1b3742e3.webp';
const listing='<html><body><div class="productlist__item"><article aria-label="BetteStarlet I" class="productteaser">'+
 '<a href="'+PRODUCT+'"><img src="'+TEASER+'"></a><a class="productteaser__link" href="'+PRODUCT+'"><span class="productteaser__headline">BetteStarlet I</span></a></article></div>'+
 '<article aria-label="BetteStarlet" class="productteaser"><a href="https://www.my-bette.com/fr/produit/baignoires/bettestarlet"><img src="'+TEASER+'"></a></article></body></html>';
const product='<html><body><h1 class="product__headline">BetteStarlet I</h1><div class="product-gallery"><img src="'+IMAGE+'"></div>'+
 '<a href="https://www.my-bette.com/fr/configurator?variant=11585&amp;product=11584">Configurer un produit</a></body></html>';
test('Supplier listing resolves exact Bette model only, never Starlet for Starlet I',()=>{
 const items=svc.parseListing(listing,'baths');
 assert.equal(items.length,2);
 assert.equal(svc.matchModel(items,'BetteStarlet I')?.page,PRODUCT);
 assert.equal(svc.matchModel(items,'BetteStarlet')?.name,'BetteStarlet');
 assert.equal(svc.matchModel(items,'BetteStarlet III'),null);
 assert.equal(svc.matchModel(items,'BetteArt'),null);
 assert.equal(svc.parseListing(listing,'wrong').length,0);
});
test('Bette page must prove matching model and valid source photo/deep link',()=>{
 const item=svc.matchModel(svc.parseListing(listing,'baths'),'BetteStarlet I');
 const found=svc.parseProduct(product,item);
 assert(found);assert.equal(found.name,'BetteStarlet I');
 assert.equal(found.image,IMAGE);
 assert.equal(found.configurator,'https://www.my-bette.com/fr/configurator?product=11584&variant=11585');
 assert.equal(found.scope,'model-only');assert.equal(found.skuExact,false);
 assert.equal(svc.parseProduct(product.replace('BetteStarlet I</h1>','BetteStarlet</h1>'),item),null);
 assert.equal(svc.trustedConfigurator('https://evil.example/fr/configurator?product=1&variant=2'),'');
 assert.equal(svc.trustedConfigurator('https://www.my-bette.com/fr/configurator?product=1&variant=2&override=evil'),
   'https://www.my-bette.com/fr/configurator?product=1&variant=2');
 assert(!svc.trustedPhoto('https://evil.example/produkt_bilder/A.webp'));
});
test('Bette retrieval is source-bound, cached, and does not invent a SKU-exact image',async()=>{
 const seen=[];
 const service=svc.makeService({get:async url=>{
  seen.push(url);
  return {data:url.endsWith('/fr/produits/baignoires')?listing:product};
 }});
 const a=await service.modelImage('baths','BetteStarlet I');
 assert(a.ok);assert.equal(a.skuExact,false);assert.equal(a.image,IMAGE);
 assert.equal(seen.length,2);
 const b=await service.modelImage('baths','BetteStarlet I');
 assert(b.ok);assert.equal(seen.length,2,'supplier cache required');
 const missing=await service.modelImage('baths','BetteStarlet III');
 assert(!missing.ok);
 assert.equal(await service.modelImage('unknown','BetteStarlet I').then(x=>x.ok),false);
});
test('Bette client rejects any image/link outside verified model provenance',async()=>{
 const good={ok:true,name:'BetteStarlet I',scope:'model-only',skuExact:false,image:IMAGE,page:PRODUCT,
 configurator:'https://www.my-bette.com/fr/configurator?variant=11585&product=11584'};
 assert(client.normalize(good));
 assert(!client.normalize({...good,skuExact:true}));
 assert(!client.normalize({...good,image:'https://example.org/a.webp'}));
 assert(!client.normalize({...good,page:'https://example.org/fr/produit/test'}));
 assert(!client.trustedConfigurator('https://www.my-bette.com/fr/configurator/products'));
 const seen=[];
 const result=await client.lookup('baths','BetteStarlet I','BetteStarlet I',{fetcher:async url=>{
  seen.push(url);
  return {ok:true,json:async()=>good};
 }});
 assert(result);assert.equal(result.scope,'model-only');
 assert.equal(seen.length,1);
});
test('Bette configurator UI loads model photos, keeps real supplier SKU pricing and marks 3D as a default model variant',()=>{
 const js=fs.readFileSync(path.join(__dirname,'../public/brand-configurators.js'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 const sw=fs.readFileSync(path.join(__dirname,'../public/sw.js'),'utf8');
 assert.match(js,/fetchBettePicture\(g,exact\)/);
 assert.match(js,/officialBettePreview\(g,exact\)/);
 assert.match(js,/modelPhotos\.get\(bettePictureKey\(g,selected\)\)/);
 assert.match(js,/imageFinishMatch:media\.image\?'exact':officialModel\?\.image\?'model-only'/);
 assert.match(js,/verifiedPublicPrice\('Bette',selected\)/);
 assert.match(html,/bette-model-media\.js\?v=__APP_VERSION__/);
 assert.match(sw,/bette-model-media\.js/);
});
