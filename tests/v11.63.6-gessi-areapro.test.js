'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const pub=path.join(__dirname,'..','public');
const read=f=>fs.readFileSync(path.join(pub,f),'utf8');
const site=JSON.parse(read('gessi-area-pro-data.json'));
const client={};vm.runInNewContext(read('gessi-area-pro.js'),{window:client});
const g=client.HydroGessiAreaPro;
function variant(collection,base,finish,price,category='Lavabo'){
 return {manufacturer:'Gessi',collection,base,reference:base+'.'+finish,finishCode:finish,finish:'Finition '+finish,category,productType:'Mitigeur lavabo',designation:'Mitigeur '+base,price,totalPrice:price,image:''};
}
test('V11.63.6: Area Pro menu is preserved with nine supplier universes and Bathroom fifteen collection names',()=>{
 assert.equal(site.source,'https://areapro.gessi.com/fr');
 assert.deepEqual(site.areas.map(a=>a.id),['haute-culture','bathroom','private-wellness','total-look','sensor-taps','home-decor','emporio','kitchen','technical-parts']);
 assert.deepEqual(site.areas.find(x=>x.id==='bathroom').collections,['Incastri','Inverso','Ventaglio','Origini','Gessi316','Inciso','Venti20','Anello','Ingranaggio','Habito','Rettangolo K','Rettangolo','Goccia','Rilievo','Minimalistic Shower']);
 assert.ok(site.areas.some(a=>a.collections.includes('Perle')));
 assert.ok(site.areas.some(a=>a.collections.includes('HI-FI')));
 assert.ok(site.areas.some(a=>a.collections.includes('Via Manzoni')));
});
test('V11.63.6: 130 official finish images are exact product and finish mappings from checked-in source fixtures',()=>{
 const keys=Object.keys(site.exactFinishImages),entries=Object.entries(site.exactFinishImages).flatMap(([id,codes])=>Object.entries(codes).map(([finish,url])=>({id,finish,url})));
 assert.equal(keys.length,10);
 assert.equal(entries.length,130);
 for(const item of entries){
   const source=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','official','gessi-'+item.id+'.json'),'utf8'));
   const matches=source.data.product.productsConfigured.filter(v=>String(v.finiture?.finitureId)===item.finish);
   assert.equal(matches.length,1);
   assert.equal(item.url,matches[0].specificFeatureProductImg);
   assert.match(item.url,new RegExp('/'+item.id+'%23'+item.finish+'\\.png$'));
 }
});
test('V11.63.6: source tariff prices and unique manufacturer SKU objects are used unchanged',()=>{
 const p=variant('Origini','66134','726',385);
 const q=variant('ORIGINI ACCESSORI','66134','299',415);
 const kitchen=variant('Habito','73588','031',600,'Cuisine');
 const other={manufacturer:'Zucchetti',collection:'Origini',reference:'66134.726',price:2};
 const arr=[p,q,kitchen,other],copy=JSON.stringify(arr),idx=g.buildIndex(arr,site);
 assert.equal(idx.total,3);
 const origini=g.listAreaCollections(idx,site.areas.find(a=>a.id==='bathroom')).find(a=>a.name==='Origini');
 assert.equal(origini.rows.length,2);
 assert.equal(g.modelsFor(origini.rows).length,1);
 assert.equal(g.modelsFor(origini.rows)[0].variants[1],q);
 assert.equal(g.typesFor(origini.rows)[0].name,'Mitigeur lavabo');
 assert.equal(g.modelBase(p),'66134');
 assert.equal(g.finishCode(q),'299');
 assert.equal(g.findImage(p,site).match,'exact');
 assert.equal(g.findImage(q,site).match,'exact');
 assert.equal(g.productPage(q),'https://areapro.gessi.com/fr/product/66134?finId=299');
 assert.equal(JSON.stringify(arr),copy,'Original tariff objects must not be mutated');
});
test('V11.63.6: nonverified finish image is labelled illustrative or missing, never guessed from SKU',()=>{
 const p=variant('Origini','66134','999',137);
 assert.equal(g.findImage(p,site).match,'missing');
 p.image='https://example.com/catalogue-generic.jpg';
 assert.equal(g.findImage(p,site).match,'illustrative');
 const unpriced=variant('NO MATCH','88111','031',910);
 const idx=g.buildIndex([unpriced],site);
 assert.equal(idx.unmapped.length,1);
 assert.ok(g.listAreaCollections(idx,site.areas.find(a=>a.id==='bathroom')).some(a=>a.notOfficial));
 assert.equal(g.officialName('GESSI 316',site.areas),'Gessi316');
 assert.equal(g.modelBase({reference:'75004726'}),'75004');
 assert.equal(g.finishCode({reference:'75004726'}),'726');
});
test('V11.63.6: Gessi launcher and versioned assets are included without changing existing supplier pricing',()=>{
 assert.match(read('index.html'),/gessi-area-pro\.js\?v=__APP_VERSION__/);
 assert.match(read('index.html'),/gessi-area-pro\.css\?v=__APP_VERSION__/);
 assert.match(read('sw.js'),/gessi-area-pro-data\.json/);
 assert.match(read('app.js'),/fs\.manufacturer==="Gessi"\?"Univers/);
 const other={};vm.runInNewContext(read('manufacturer-guide.js'),{window:other});
 assert.equal(other.HydroManufacturerGuide.isSupported('Gessi'),true);
 assert.equal(other.HydroManufacturerGuide.isSupported('Hotbath'),true);
 assert.equal(other.HydroManufacturerGuide.isSupported('Zucchetti'),true);
 assert.equal(other.HydroManufacturerGuide.isSupported('Lefroy Brooks'),true);
 const manifest=JSON.parse(read('catalog_manifest.json'));
 assert.equal(manifest.chunks.find(c=>c.label==='Gessi').count,16211);
 const js=read('gessi-area-pro.js');
 assert.match(js,/onAdd\(p\)/);
 assert.doesNotMatch(js,/fetch\(\s*['"]\/api\/.*(?:price|tariff)/);
 assert.match(read('gessi-area-pro.css'),/gessi-univers/);
});

test('V11.63.8: same supplier collection in three Area Pro universes never duplicates priced SKUs',()=>{
 const bathroom=variant('Inciso','56121','031',200,'Mitigeur lavabo');
 const kitchen=variant('Inciso','56122','031',220,'Mitigeur cuisine');
 const sensor=variant('Inciso','56123','031',240,'Robinet électronique');
 const unknown=variant('Inciso','56124','031',260,'Accessoire');
 const idx=g.buildIndex([bathroom,kitchen,sensor,unknown],site);
 const at=id=>g.listAreaCollections(idx,site.areas.find(a=>a.id===id)).find(c=>c.name==='Inciso').rows;
 assert.deepEqual(at('bathroom').map(p=>p.reference),[bathroom.reference,unknown.reference]);
 assert.deepEqual(at('kitchen').map(p=>p.reference),[kitchen.reference]);
 assert.deepEqual(at('sensor-taps').map(p=>p.reference),[sensor.reference]);
 assert.equal(at('bathroom').length+at('kitchen').length+at('sensor-taps').length,4);
 assert.equal(idx.total,4);
 assert.equal(g.selectArea({...unknown,universe:'Kitchen'},'Inciso',site.areas).id,'kitchen');
});
