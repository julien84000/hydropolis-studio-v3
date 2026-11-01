'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const data=require('../public/naxani-tariff-2026.json');
const api=require('../public/naxani-data.js');
const config=require('../public/naxani-configurator.js');
const rows=api.toRecords(data),byRef=new Map(rows.map(x=>[x.reference,x]));
test('Naxani PDF 2026 contains distinct priced supplier SKUs spanning wood, lacquer, basins and tops',()=>{
 assert(rows.length>=2200,rows.length);
 assert.equal(byRef.size,rows.length);
 for(const row of rows){
  assert.equal(row.manufacturer,'Naxani');
  assert(/^\d{6}$/.test(row.reference));
  assert(row.price>0&&Number.isFinite(row.price),row.reference);
  assert(row.sourcePage>=4&&row.sourcePage<=70);
  assert.equal(row.purchaseDiscount,null,'Unknown commercial terms must not be fabricated');
 }
 const kinds=new Set(rows.map(x=>x.naxaniKind));
 for(const required of ['bois-massif','laque','complement','plan-integre','vasque-poser','plan-solid','plan-mdf','suspendu'])
  assert(kinds.has(required),required);
});
test('Naxani first known supplier price cells agree with 2026 PDF',()=>{
 for(const [ref,price,model,width] of [
  ['504086',2033,'Aalto',80],['504000',2297,'Aalto',80],
  ['500200',1062,'Banaavat',60],['570738',945,'Alma',80],
  ['574743',605,'Daro',80],['570011',640,'1Q84',null],
  ['579861',73,'Clic Clac',null],['615395',45,'Clic Clac',null],
  ['515037',252,'Solid Surface',80]
 ]){
  const p=byRef.get(ref);
  assert(p,ref);assert.equal(p.price,price,ref);assert.equal(p.collection,model,ref);
  assert.equal(p.naxaniWidth,width,ref);
 }
});
test('Naxani furniture basin compatibility: width exact and published exclusions',()=>{
 const a=byRef.get('504086'),d=byRef.get('574743'),alma=byRef.get('570738'),different=rows.find(x=>x.collection==='Daro'&&x.naxaniWidth===90);
 assert(api.compatible(a,d,data.incompatible));
 assert(!api.compatible(a,alma,data.incompatible));
 assert(!api.compatible(a,different,data.incompatible));
 assert(!api.compatible(a,byRef.get('570011'),data.incompatible));
});
test('Naxani collection images are explicitly illustrative, never SKU finish verified',()=>{
 const row=byRef.get('504086');
 assert.match(row.image,/naxani-collection-image/);
 assert.match(row.imageSource,/non contractuelle/);
 assert(!row.imageFinishMatch);
 assert.equal(api.pageUrl('Aalto'),'https://naxani.com/producto/aalto/');
});
test('Naxani brand integration, grouped quote and source declarations present',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
 assert.match(app,/HydroNaxani2026\?\.load/);
 assert.match(app,/launchNaxaniConfigurator/);
 assert.match(app,/naxaniLinkedAccessory/);
 assert.match(app,/naxani-open/);
 assert.match(html,/naxani-data\.js/);
 assert.match(html,/naxani-configurator\.js/);
 assert.match(server,/api\/naxani-collection-photo/);
 assert.match(server,/naxaniImageCache/);
 assert(config.SECTIONS.Meubles.includes('Laqués'));
 assert(config.SECTIONS.Lavabos.includes('Plans suspendus'));
});
