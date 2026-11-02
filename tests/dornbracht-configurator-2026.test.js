'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const cheerio=require('cheerio');
const Dornbracht=require('../public/dornbracht-configurator.js');
const installMedia=require('../dornbracht-media-server.js');
function products(){
 const mk=(reference,collection,designation,category,price,finish='',base=reference.split('-')[0])=>({
  manufacturer:'Dornbracht',reference,base,collection,designation,category,price,finish
 });
 return [
  mk('36860845-00','LISSÉ','Mitigeur monocommande de lavabo mural sans garniture d’écoulement','Lavabo',933.7,'Chrome','36860845'),
  mk('36860845-06','LISSÉ','Mitigeur monocommande de lavabo mural sans garniture d’écoulement','Lavabo',1395.1,'Platine brossé','36860845'),
  mk('3586097090','ARTICLES GÉNÉRIQUES','Mitigeur monocommande mural à encastrer','Autres',257.3,''),
  mk('3581697090','ARTICLES GÉNÉRIQUES','Mitigeur monocommande mural à encastrer mitigeur à droite','Autres',441.8,''),
  mk('20705882-42','TARA','Mélangeur lavabo à 3 trous','Lavabo',1500,'Bronze brossé','20705882')
 ];
}
test('Dornbracht prices: exact tariff variants and correct visual hierarchy',()=>{
 const i=Dornbracht.indexRows(products());
 assert.equal(i.originals.length,5);
 assert.equal(i.collections.get('LISSÉ').rows.length,2);
 const categories=i.collections.get('LISSÉ').categories;
 assert.ok(categories.has('Mitigeurs et mélangeurs'));
 const model=categories.get('Mitigeurs et mélangeurs').models.get('36860845');
 assert.equal(model.variants.length,2);
 assert.equal(model.variants[0].price,933.7);
 assert.equal(Dornbracht.mayNeedBody(model.variants[0]),true);
 assert.equal(Dornbracht.mayNeedBody(i.byRef.get('3586097090')),false);
});
test('Dornbracht FR: only documented, French-page-verified, priced accessories are selectable',()=>{
 const i=Dornbracht.indexRows(products());
 const a=Dornbracht.accessoryOptions({accessories:[
  {reference:'3586097090',label:'Standard',francePageVerified:true},
  {reference:'3581697090',label:'Mitigeur à droite',francePageVerified:false},
  {reference:'9999999999',label:'Autre',francePageVerified:true}
 ]},i.byRef);
 assert.equal(a[0].selectable,true);
 assert.equal(a[0].row.price,257.3);
 assert.equal(a[1].selectable,false,'Missing French product page must block this option');
 assert.equal(a[2].selectable,false,'No fabricated SKU or price');
});
test('Dornbracht server: necessary accessories are extracted only from manufacturer group',()=>{
 const urls={};
 const api=installMedia({get:(route,fn)=>urls[route]=fn});
 assert.ok(urls['/api/dornbracht-product-config']);
 assert.equal(api.safeSku('36860845-00'),true);
 assert.equal(api.safeSku('http://evil.test'),false);
 assert.equal(api.safeImage('https://evil.test/image.webp'),'');
 const $=cheerio.load('<html><head><title>LISSÉ - Chrome</title></head><body>'+
  '<h3>Accessoires nécessaires</h3><div>'+
  '<a href="https://www.dornbracht.com/fr-fr/produits/3586097090/standard">Mitigeur mural à encastrer</a>'+
  '<a href="https://www.dornbracht.com/fr-fr/produits/3581697090/droite">Mitigeur à droite</a>'+
  '</div><h3>Informations techniques</h3><a href="https://www.dornbracht.com/fr-fr/produits/1234567890/autre">Autre</a></body></html>');
 const options=api.accessoriesFromHtml($);
 assert.deepEqual(options.map(x=>x.reference),['3586097090','3581697090']);
 assert.equal(api.validRefPage(cheerio.load('<title>LISSÉ</title><body>Référence article 36 860 845-00</body>'),
    'https://www.dornbracht.com/fr-fr/produits/36860845-00','36860845-00'),true);
});
test('Dornbracht UI loads before app and has direct launcher',()=>{
 const fs=require('fs'),path=require('path'),base=path.join(__dirname,'../public');
 const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
 const app=fs.readFileSync(path.join(base,'app.js'),'utf8');
 const js=fs.readFileSync(path.join(base,'dornbracht-configurator.js'),'utf8');
 assert.ok(html.indexOf('dornbracht-configurator.js')<html.indexOf('src="app.js'));
 assert.ok(html.includes('dornbracht-configurator.css'));
 assert.ok(app.includes('function launchDornbrachtConfigurator('));
 assert.ok(app.includes('function addDornbrachtConfigured('));
 assert.ok(app.includes('dornbracht-direct-open'));
 assert.ok(js.includes('/api/dornbracht-product-config'));
});
