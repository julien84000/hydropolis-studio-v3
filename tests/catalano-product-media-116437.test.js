'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const server=require('../catalano-product-media-server');
const client=require('../public/catalano-product-media');
const rows=require('../public/catalog_catalano.json');
const builder=require('../public/catalano-configurator');
const row=ref=>rows.find(p=>p.reference===ref);
const ROOT='https://www.catalano.it/wp-content/uploads/2025/03/';
const BIDET=ROOT+'SFERA_bidet_terra_50x35_0519501001-600x600.webp';
const BIDET_COLOR=ROOT+'SFERA_bidet_terra_50x35_0519501021-600x600.webp';
const WC=ROOT+'SFERA_wc_sospeso_55x35_0511550001-600x600.webp';
function tile(codes,href,photos){
 return '<div class="products-grid-item" data-codes="'+codes+'"><a href="https://www.catalano.it/en/products/wc-and-bidet/'+href+'/">'+
 '<div class="product-thumb" data-thumbs="'+JSON.stringify(photos.map(image_url=>({finish_id:227,image_url}))).replace(/"/g,'&quot;')+
 '" data-default-thumb="'+photos[0]+'"><img src="'+photos[0]+'"></div></a></div>';
}
const html='<main>'+tile('05 1950 1001,05 1950 1021','bidet-sfera-50',[BIDET,BIDET_COLOR])+
 tile('05 1155 0001','wc-sfera-55-wall-hung-up-fix',[WC])+
 tile('05 3301 0001','sfera-cistern',['https://www.catalano.it/wp-content/uploads/2025/03/CATALANO_Sfera_55_sospesi.webp'])+
 '</main>';
test('Photo source: SKU extracted from manufacturer URL and validated with supplier data-codes',()=>{
 assert.equal(server.photoReference(BIDET),'0519501001');
 assert.equal(server.photoReference(BIDET_COLOR),'0519501021');
 assert.equal(server.photoReference('https://www.catalano.it/wp-content/uploads/2026/02/SFERA_lavabo_appoggio_28_05-2328-0001-600x600.webp'),'0523280001');
 assert.equal(server.photoReference('https://www.catalano.it/wp-content/uploads/2025/04/CATALANO_Sfera_55-sospesi.webp'),'');
 assert.equal(server.photoReference('https://attacker.example/wp-content/uploads/2025/03/0519501001.webp'),'');
});
test('Catalogue HTML groups exact product thumbnails and never maps editorial scene or unrelated SKU',()=>{
 const parsed=server.parseCollection(html,'Sfera');
 assert.deepEqual(Object.keys(parsed.exact).sort(),['0511550001','0519501001','0519501021'].sort());
 assert.equal(parsed.exact['0519501001'].image,BIDET);
 assert.equal(parsed.exact['0519501021'].image,BIDET_COLOR);
 assert.equal(parsed.exact['0511550001'].image,WC);
 assert.equal(parsed.models['051950|WC'].image,BIDET);
 assert(!parsed.exact['0533010001'],'Do not attach an editorial bathroom to a cistern');
 const wrong=server.parseCollection(tile('05 1950 1001','bidet-sfera-50',[WC]),'Sfera');
 assert.equal(Object.keys(wrong.exact).length,0,'Image SKU must be included in the official card codes');
 const other=server.parseCollection(html,'Zero');
 assert.equal(Object.keys(other.exact).length,0,'Same URL cannot be reused across a different collection');
});
test('Server returns known product photo seed while manufacturer source times out',async()=>{
 const service=server.createService({get:async()=>{throw new Error('manufacturer unavailable')}});
 const data=await service.collection('Sfera');
 assert.equal(data.exact['0519501001'].image,BIDET);
 assert.equal(data.exact['0519501021'].image,BIDET_COLOR);
 assert(!data.exact['0533010001']);
 await assert.rejects(service.collection('BAD-COLLECTION'));
});
test('Client returns only same base+category+collection when exact SKU has no photo',()=>{
 client.clear();
 const data={exact:server.seedsFor('Sfera').exact,models:server.seedsFor('Sfera').models,collection:'Sfera',ok:true};
 client.setFixture('Sfera',data);
 assert.deepEqual([client.get(row('0519501001')).scope,client.get(row('0519501021')).scope],['exact','exact']);
 assert.equal(client.get(row('0519501001')).src,BIDET);
 assert.equal(client.get(row('0519501021')).src,BIDET_COLOR);
 assert.equal(client.get({...row('0519501001'),reference:'0519501028'}).scope,'model','Same ceramic model may use white indicative photo');
 assert.equal(client.get(row('0512500001')).scope,'missing','A floorstanding WC cannot display a bidet');
 assert.equal(client.get(row('0533010001')).scope,'missing','Cistern must never inherit the collection hero');
 assert.equal(client.get(row('0111460001')).scope,'missing','Zero cannot reuse Sfera photo');
 assert.equal(builder.imageFor(row('0533010001')).scope,'missing');
 assert.equal(builder.imageFor(row('0519501021')).scope,'exact');
 client.clear();
});
test('Gallery photos remain only in collection rail and cannot surface via outdated manufacturer cache',()=>{
 const cfg=fs.readFileSync(path.join(__dirname,'../public/catalano-configurator.js'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 const sw=fs.readFileSync(path.join(__dirname,'../public/sw.js'),'utf8');
 assert.match(cfg,/ensureMedia\(collection\)/);
 assert.match(cfg,/mediaApi\?\.get\?\.\(p\)/);
 assert.match(cfg,/Visuel produit indisponible/);
 assert(!cfg.includes('photoCache.get(p.reference)'));
 assert(!cfg.includes('photoLoader(p)'));
 assert(!cfg.includes("image.scope==='collection'"));
 assert.match(cfg,/const hero=root\?\.HydroCatalanoGallery\?\.family\?\.\(name\)/);
 assert.match(html,/catalano-product-media\.js\?v=__APP_VERSION__/);
 assert.match(sw,/catalano-product-media\.js/);
 assert.match(app,/launchCatalanoConfigurator/);
});
