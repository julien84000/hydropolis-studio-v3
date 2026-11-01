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
const WC=ROOT+'SFERA_wc_sospeso_55x35_0511650001-600x600.webp';
function tile(codes,href,photos){
 return '<div class="products-grid-item" data-codes="'+codes+'"><a href="https://www.catalano.it/en/products/wc-and-bidet/'+href+'/">'+
 '<div class="product-thumb" data-thumbs="'+JSON.stringify(photos.map(image_url=>({finish_id:227,image_url}))).replace(/"/g,'&quot;')+
 '" data-default-thumb="'+photos[0]+'"><img src="'+photos[0]+'"></div></a></div>';
}
const html='<main>'+tile('05 1950 1001,05 1950 1021','bidet-sfera-50',[BIDET,BIDET_COLOR])+
 tile('05 1165 0001','wc-sfera-55-wall-hung-up-fix',[WC])+
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
 assert.deepEqual(Object.keys(parsed.exact).sort(),['0511650001','0519501001','0519501021'].sort());
 assert.equal(parsed.exact['0519501001'].image,BIDET);
 assert.equal(parsed.exact['0519501021'].image,BIDET_COLOR);
 assert.equal(parsed.exact['0511650001'].image,WC);
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

test('Nested Catalano H3 shower tray and bathtub collections use verified live manufacturer URLs',()=>{
 assert.equal(server.COLLECTIONS['H3 Ceramic'],'https://www.catalano.it/en/all-collections/shower-trays-bathtubs/h3-ceramic/');
 assert.equal(server.COLLECTIONS['H3 Planar'],'https://www.catalano.it/en/all-collections/shower-trays-bathtubs/h3-planar-ceramic/');
 assert.equal(server.COLLECTIONS['H3 Solid'],'https://www.catalano.it/en/all-collections/shower-trays-bathtubs/h3-solid/');
 assert.equal(server.COLLECTIONS['H 4,5 Ceramic'],'https://www.catalano.it/en/all-collections/shower-trays-bathtubs/shower-tray-h4-5/');
 assert.equal(server.COLLECTIONS['Vasca'],'https://www.catalano.it/en/all-collections/shower-trays-bathtubs/solid-bathtubs/');
});

test('H3 Solid official product tile gives actual SKU image and same model fallback only',async()=>{
 const src='https://www.catalano.it/wp-content/uploads/2025/03/H3_SOLID_100x130_7141310021-300x300.webp';
 assert.equal(server.photoReference(src),'7141310021','scaled manufacturer photos preserve supplier SKU');
 assert.equal(client.imageCode(src),'7141310021');
 assert(row('7141310021'),'Source-priced H3 Solid white model exists');
 const html=('<main>'+tile('71 4131 0021,71 4131 0022','h3-solid-130x100',[src])+'</main>').padEnd(600);
 let requested='';
 const service=server.createService({get:async url=>{requested=url;return {data:html}}});
 const collection=await service.collection('H3 Solid');
 assert.equal(requested,server.COLLECTIONS['H3 Solid']);
 assert.equal(collection.exact['7141310021'].image,src);
 client.clear();client.setFixture('H3 Solid',{...collection,ok:true});
 assert.equal(client.get(row('7141310021')).scope,'exact');
 assert.equal(client.get(row('7141310022')).scope,'model');
 assert.equal(client.get(row('7140880021')).scope,'missing','Different tray dimensions must not reuse a 130×100 image');
 client.clear();
});

test('Static manufacturer thumbnail is safe only if reference matches both tile and image',()=>{
 const src='https://www.catalano.it/wp-content/uploads/2025/03/H3_SOLID_100x130_7141310021.webp';
 const markup='<div class="products-grid-item" data-codes="71 4131 0021"><a href="https://www.catalano.it/en/products/shower-trays/h3-solid-130x100/"><div class="product-thumb"><img src="'+src+'"></div></a></div>';
 const found=server.parseCollection(markup,'H3 Solid');
 assert.equal(found.exact['7141310021'].image,src);
 const wrong=server.parseCollection(markup.replace('71 4131 0021','71 4141 0021'),'H3 Solid');
 assert.equal(Object.keys(wrong.exact).length,0);
});

test('Catalano accessories are indexed from official category listing, not unrelated collection hero',async()=>{
 assert(server.supplementalSources('Sfera').some(url=>url.endsWith('/accessories/seats-and-covers/')));
 assert(server.supplementalSources('Zero').some(url=>url.endsWith('/accessories/towel-rail/')));
 assert.deepEqual(server.supplementalSources('H3 Solid'),[]);
 const seat='https://www.catalano.it/wp-content/uploads/2026/02/SEDILE_SFERA_0551250001-600x600.webp';
 const towel='https://www.catalano.it/wp-content/uploads/2025/03/PORTASCIUGAMANI_ZERO_0160500061-600x600.webp';
 const sourceHtml=(url)=>url.includes('seats-and-covers')?tile('05 5125 0001','seat-sfera',[seat]):
  url.includes('towel-rail')?tile('01 6050 0061','towel-rail-zero',[towel]):'<main></main>';
 const get=async url=>({data:sourceHtml(url).padEnd(600,' ')});
 const service=server.createService({get});
 const sfera=await service.collection('Sfera');
 const zero=await service.collection('Zero');
 assert.equal(sfera.exact['0551250001'].image,seat);
 assert.equal(zero.exact['0160500061'].image,towel);
 assert(!sfera.exact['0160500061'],'Never mix towel rail from another supplier collection');
 assert(!zero.exact['0551250001'],'Never mix WC seat from another supplier collection');
});

test('Temporary manufacturer primary-page failure does not cache an incomplete collection for six hours',async()=>{
 let clock=1000,attempt=0;
 const src='https://www.catalano.it/wp-content/uploads/2026/02/SFERA_wc_sospeso_55x35_0511750001.webp';
 const mockHtml=tile('05 1175 0001','wc-sfera-new',[src]).padEnd(600,' ');
 const service=server.createService({now:()=>clock,get:async url=>{
  if(url===server.COLLECTIONS['Sfera']){attempt++;if(attempt===1)throw Error('temporary 429');return {data:mockHtml};}
  return {data:'<main></main>'.padEnd(600,' ')};
 }});
 let first=await service.collection('Sfera');
 assert(!first.exact['0511750001']);
 clock+=61*1000;
 let second=await service.collection('Sfera');
 assert.equal(second.exact['0511750001'].image,src);
 assert.equal(attempt,2,'Manufacturer collection page must be retried after 60 seconds');
});
