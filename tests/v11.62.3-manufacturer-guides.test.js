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
 assert.match(h.models.AR003,/^https:\/\/hotbath\.it\/documents\//);
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
