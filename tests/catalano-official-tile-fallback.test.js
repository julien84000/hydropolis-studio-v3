'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const server=require('../catalano-product-media-server');
const client=require('../public/catalano-product-media');
const rows=require('../public/catalog_catalano.json');
const root='https://www.catalano.it/wp-content/uploads/2025/03/';
const uri='https://www.catalano.it/en/products/wc-and-bidet/bidet-sfera-50/';
const card=(codes,url)=>
 '<div class="products-grid-item" data-codes="'+codes+'"><a href="'+uri+
 '"><div class="product-thumb" data-thumbs="'+JSON.stringify([{image_url:url}]).replace(/"/g,'&quot;')+
 '" data-default-thumb="'+url+'"></div></a></div>';
test('Catalano: official SKU-listed tile photo without a numeric filename is allowed for same model only',()=>{
 const url=root+'SFERA_bidet_terra_50x35.webp';
 const parsed=server.parseCollection(card('05 1950 1001,05 1950 1021',url),'Sfera');
 assert.deepEqual(Object.keys(parsed.exact),[]);
 assert(parsed.models['051950|WC']?.verifiedTile);
 client.clear();client.setFixture('Sfera',{...parsed,ok:true});
 const white=rows.find(p=>p.reference==='0519501001');
 const colour=rows.find(p=>p.reference==='0519501021');
 assert.equal(client.get(white).scope,'model');
 assert.equal(client.get(colour).scope,'model','Other finish is illustrative, never exact');
 assert.equal(client.get(rows.find(p=>p.reference==='0511500001')).scope,'missing','Unrelated WC model cannot inherit bidet');
 client.clear();
});
test('Catalano: refuse collection editorial photo and mismatched model group',()=>{
 const hero=root+'CATALANO_Sfera_55_sospesi.webp';
 assert.equal(Object.keys(server.parseCollection(card('05 3301 0001',hero),'Sfera').models).length,0);
 const plain=root+'SFERA_bidet_terra_50x35.webp';
 assert.equal(Object.keys(server.parseCollection(card('05 1950 1001,05 1165 0001',plain),'Sfera').models).length,0);
 assert.equal(Object.keys(server.parseCollection(card('05 1950 1001',plain),'Zero').models).length,0);
});
