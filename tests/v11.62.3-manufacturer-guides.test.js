'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.join(__dirname,'..','public');
const html=()=>fs.readFileSync(path.join(dir,'index.html'),'utf8');
function api(){const target={};vm.runInNewContext(fs.readFileSync(path.join(dir,'manufacturer-guide.js'),'utf8'),{window:target});return target.HydroManufacturerGuide;}
const hot=()=>JSON.parse(fs.readFileSync(path.join(dir,'brand-guide-hotbath-media.json'),'utf8'));
const brand=()=>JSON.parse(fs.readFileSync(path.join(dir,'brand-guide-collections.json'),'utf8'));

test('V11.62.3 scripts and sources are versioned and publicly served',()=>{
 assert.match(html(),/manufacturer-guide\.js\?v=__APP_VERSION__/);
 assert.match(fs.readFileSync(path.join(dir,'sw.js'),'utf8'),/brand-guide-hotbath-media\.json/);
 const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
 assert.match(app,/manufacturer-guide-launcher/);
 assert.match(app,/HydroManufacturerGuide\?\.open/);
 assert.match(app,/technicalSheetUrl:cached\?\.technicalSheetUrl\|\|p\.technicalSheetUrl/);
 assert.match(app,/installationGuideUrl:cached\?\.installationGuideUrl\|\|p\.installationGuideUrl/);
 assert.match(app,/drawingUrl:cached\?\.drawingUrl\|\|p\.drawingUrl/);
});
test('V11.62.3 official photographic collections have grounded source URLs',()=>{
 const images=brand();
 const h=hot();
 assert.equal(Object.keys(h.collections).length,12);
 assert.ok(Object.keys(h.models).length>=300);
 assert.match(h.byCollection.Archie.AR088,/^https:\/\/hotbath\.com\/images\/compano\/AR088\//);
 assert.match(h.byCollection.Archie.AR110,/^https:\/\/hotbath\.com\/images\/compano\/AR110\//);
 assert.equal(h.byCollection.Guy.AR088,undefined);
 assert.ok(Object.keys(h.byCollection.Archie).length>=45);
 assert.ok(Object.values(h.byCollection.Archie).every(url=>/^https:\/\/hotbath\.(?:com|it)\//.test(url)));
 assert.match(h.byCollection.Archie.AR003,/hotbath\.com\/images\/compano\/AR003\/AR003IX_02\.png/);
 assert.equal(Object.keys(images.collections['Lefroy Brooks']).length,8);
 assert.equal(Object.keys(images.collections.Zucchetti).length>=13,true);
 assert.match(images.collections.Zucchetti['Octo X'].image,/assets\.zucchettidesign\.it/);
 assert.match(images.models['Lefroy Brooks']['TH-1233'],/images\.squarespace-cdn\.com/);
});
test('V11.62.3 groups references without replacing tariff rows or required bodies',()=>{
 const guide=api();
 assert.equal(guide.isSupported('Hotbath'),true);
 assert.equal(guide.isSupported('Hidrobox'),false);
 const rows=[
 {manufacturer:'Hotbath',collection:'Archie',base:'AR003',reference:'AR003.BS',finishCode:'BS',finish:'Acier',category:'Lavabo',price:300,internalReference:'R1',internalPrice:55,totalPrice:355},
 {manufacturer:'Hotbath',collection:'Archie',base:'AR003',reference:'AR003.BB',finishCode:'BB',finish:'Bronze',category:'Lavabo',price:450,internalReference:'R1',internalPrice:55,totalPrice:505},
 {manufacturer:'Hotbath',collection:'Cobber',base:'CR001',reference:'CR001.BS',category:'Douche',price:720},
 {manufacturer:'Zucchetti',collection:'Octo',base:'ZOC564',reference:'ZOC564.C50',category:'Lavabo',price:880}
 ];
 const grouped=guide.groupProducts(rows,'Hotbath');
 assert.equal(grouped.length,2);
 assert.equal(grouped.find(x=>x.name==='Archie').products.length,2);
 const models=guide.groupModels(grouped.find(x=>x.name==='Archie').products);
 assert.equal(models.length,1);
 assert.equal(models[0].variants.length,2);
 assert.equal(models[0].variants[0].internalReference,'R1');
 assert.equal(models[0].variants[0].totalPrice,355);
 assert.equal(guide.displayCollection('Lefroy Brooks','TEN TEN'),'1920 Ten Ten');
 assert.equal(guide.modelBase({reference:'ZOC564.C50',finishCode:'C50'}),'ZOC564');
});


test('V11.62.3 official model images override generic catalogue pictures with correct collection scope',()=>{
 const g=api(),hotbath=hot(),collections=brand();
 const media={hotbath,collections};
 const archie={manufacturer:'Hotbath',collection:'Archie',reference:'AR088.IX',base:'AR088',finishCode:'IX',image:'/images/generic-bathroom.jpg',imageSource:'Photo générique'};
 const image=g.findModelVisual('Hotbath',archie,'AR088',media);
 assert.match(image.image,/hotbath\.com\/images\/compano\/AR088\//);
 assert.match(image.image,/AR088/i);
 assert.equal(image.match,'model');
 const gt={manufacturer:'Hotbath',collection:'Gent',reference:'GT004.BS',base:'GT004',image:'/images/generic.jpg'};
 assert.match(g.findModelVisual('Hotbath',gt,'GT004',media).image,/GT004/);
 const missing={manufacturer:'Hotbath',collection:'Guy',reference:'AR088.IX',base:'AR088',image:'',imageSource:''};
 assert.equal(g.findModelVisual('Hotbath',missing,'AR088',media).match,'missing');
 const z={manufacturer:'Zucchetti',collection:'Octo',reference:'ZOC564.C50',base:'ZOC564',image:'/images/no-finish.jpg'};
 assert.match(g.findModelVisual('Zucchetti',z,'ZOC564',media).image,/ZOC564/i);
 const lefroy={manufacturer:'Lefroy Brooks',collection:'1920 Ten Ten',reference:'TH-1233-NK',base:'TH1233',image:''};
 assert.match(g.findModelVisual('Lefroy Brooks',lefroy,'TH1233',media).image,/TH-1233/i);
});


test('V11.62.4 references appear on photo overlay; broken URL preserves photo area',()=>{
 const js=fs.readFileSync(path.join(dir,'manufacturer-guide.js'),'utf8');
 const css=fs.readFileSync(path.join(dir,'styles.css'),'utf8');
 assert.match(js,/mg-official-gallery/);
 assert.match(js,/mg-tile-photo/);
 assert.match(js,/mg-image-broken/);
 assert.match(css,/mg-official-gallery \.mg-tile-meta/);
 assert.match(css,/background:rgba\(52,48,45,\.76\)/);
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 const d=hot();
 assert.ok(Object.values(d.byCollection.Archie).every(v=>v.startsWith('https://hotbath.com/images/compano/')));
 assert.match(d.byCollection.Archie.AR003,/AR003IX_02\.png/);
});


test('Gessi-style manufacturer finish cards preserve exact SKU and never dress generic model photos as exact finishes',()=>{
 const guide=api();
 const media={collections:{finishModels:{'Lefroy Brooks':{BL1185:{CP:'https://uk.lefroybrooks.com/BL1185-CP.jpg'}}},models:{'Lefroy Brooks':{BL1185:'https://uk.lefroybrooks.com/BL1185-generic.jpg'}}},hotbath:{}};
 const variants=[
  {manufacturer:'Lefroy Brooks',collection:'1900 Classic',base:'BL1185',reference:'BL1185-CP',finishCode:'CP',finish:'Chrome',price:400},
  {manufacturer:'Lefroy Brooks',collection:'1900 Classic',base:'BL1185',reference:'BL1185-NK',finishCode:'NK',finish:'Nickel',price:450}
 ];
 const html=guide.finishTiles('Lefroy Brooks',variants,'BL1185-NK','BL1185',media);
 assert.match(html,/role="group"/);
 assert.match(html,/data-mg-finish="BL1185-CP"/);
 assert.match(html,/data-mg-finish="BL1185-NK" aria-pressed="true"/);
 assert.match(html,/BL1185-CP\.jpg/);
 assert.doesNotMatch(html,/BL1185-generic\.jpg/);
 assert.match(html,/Finition à confirmer sur photo/);
 assert.equal(variants[0].price,400);
 assert.equal(variants[1].price,450);
 const misleading=[{...variants[1],image:'https://images.example.test/BL1185-NK.jpg',imageSource:'exact'}];
 const safe=guide.finishTiles('Lefroy Brooks',misleading,misleading[0].reference,'BL1185',media);
 assert.doesNotMatch(safe,/images\\.example\\.test/);
 assert.match(safe,/Finition à confirmer sur photo/);
 const css=fs.readFileSync(path.join(dir,'styles.css'),'utf8');
 assert.match(css,/\.mg-visual-finishes\{/);
 assert.match(css,/\.mg-visual-finish\[aria-pressed="true"\]/);
});
