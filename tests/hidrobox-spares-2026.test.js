'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const spares=require('../public/hidrobox-spares-2026.js');
const pdf=require('./fixtures/hidrobox/supplier-2026-pdf-skus.json');
test('170 actual Hidrobox manufacturer spare-part references and prices are available',()=>{
 const sourceCodes=new Set(pdf.sourceSkus.map(x=>x[0]));
 assert.equal(spares.rows.length,170);
 assert.equal(spares.byRef.size,170);
 for(const item of spares.rows){
  assert(sourceCodes.has(item.reference),item.reference+' not printed in tariff');
  assert(item.designation&&item.designation.length>5,item.reference+' has no designation');
  assert(Number.isFinite(item.rawPrice)&&item.rawPrice>0,item.reference);
  assert.equal(item.price,Math.round(item.rawPrice*104)/100,item.reference);
  assert.equal(item.sourceDiscountPct,50,item.reference);
  assert.equal(item.sourcePage,83,item.reference);
  assert.notEqual(item.type,'Pièces détachées',item.reference+' unidentified family');
 }
 const anchors={AMAS0001:115,BSPS0002:139,VSPC0014:37,VSPS0021:73,
  WTRS0021:168,CSPS0001:50};
 for(const [ref,rawPrice] of Object.entries(anchors))
  assert.equal(spares.byRef.get(ref)?.rawPrice,rawPrice,ref);
});
test('Spare parts with exact supplier designation are selectable in Hidrobox guided UI',()=>{
 const guided=fs.readFileSync(path.join(__dirname,'../public/hidrobox-guided.js'),'utf8');
 const index=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 assert.match(index,/hidrobox-spares-2026\.js/);
 assert.match(guided,/root\.HydroHidroboxSpares2026/);
 assert.match(guided,/id:'hidrobox-spares-2026'/);
 assert.match(guided,/item\?\.designation/);
});
