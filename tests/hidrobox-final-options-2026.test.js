'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const PDF=require('./fixtures/hidrobox/supplier-2026-pdf-skus.json');
const options=require('../public/hidrobox-additional-options-2026.js');
const showers=require('../public/hidrobox-shower-options-2026.js');
test('Hidrobox 2026: exactly 29 supplier-only options have verified rules, no invented euro prices',()=>{
 const source=new Map(PDF.sourceSkus);
 assert.equal(options.rows.length,29);
 assert.equal(options.byRef.size,29);
 for(const row of options.rows){
  assert(source.has(row.reference),'Code absent original PDF: '+row.reference);
  assert.equal(source.get(row.reference),row.page,'Wrong PDF source page for '+row.reference);
 }
 assert.equal(options.rows.filter(x=>x.rule==='included').length,24);
 assert.equal(options.rows.filter(x=>x.rule==='percent').length,2);
 assert.equal(options.rows.filter(x=>x.rule==='embedded_percent').length,1);
 assert.equal(options.rows.filter(x=>x.rule==='manufacturer_quote').length,2);
 assert.equal(options.quote('OPSH0019',500).requiresManufacturerQuote,true);
 assert.equal(options.quote('OPSH0020',500).requiresManufacturerQuote,true);
 assert.equal(options.quote('OPWB0229',525).ok,false,'Do not automatically double charge an embedded Spot Colour surcharge');
 assert.equal(options.quote('OPWB0229',656,{embeddedInSupplierPrice:true}).extraRawPrice,0);
 assert.equal(options.quote('OPBT0025',900).extraRawPrice,0);
 assert.equal(options.quote('OPWB0139',900).extraRawPrice,0);
 assert.equal(options.quote('OPSH0018',653).extraRawPrice,65.3);
 assert.equal(options.quote('OPSH0073',1000).extraRawPrice,150);
});
test('Hidrobox LINE, TWINS and ARQ quote the official 10% special cut from manufacturer base only',()=>{
 for(const spec of [
  {model:'line-x',width:80,material:'Kromat',texture:'Lisse',colorGroup:'BAS'},
  {model:'twins-yl',colorGroup:'BAS'},
  {model:'arq'}
 ]){
  const groups=showers.optionsFor(spec);
  const cut=groups.find(x=>x.key==='cut');
  assert(cut,'Missing optional cut for '+spec.model);
  assert.equal(cut.options.find(x=>x.id==='special').reference,'OPSH0018');
  const quote=showers.quote(653,groups,{cut:'special'});
  assert.equal(quote.ok,true);
  assert.equal(quote.optionRawPrice,65.3);
  assert.equal(quote.price,747.03);
  assert(quote.components.some(x=>x.reference==='OPSH0018'&&x.rawPrice===65.3));
 }
});
test('Hidrobox source-price zero is kept for included ARQ/PURE/ICONIK covers',()=>{
 for(const [model,ref] of [['arq','OPSH0056'],['pure','OPSH0057'],['iconik','OPSH0058']]){
  const optionsFor=showers.optionsFor({model});
  const cover=optionsFor.find(x=>x.key==='cover').options[0];
  assert.equal(cover.reference,ref);
  assert.equal(cover.rawPrice,0);
 }
 const iconik=showers.optionsFor({model:'iconik'});
 const color=iconik.find(x=>x.key==='iconikColor');
 assert.equal(color.options.find(x=>x.id==='plus').reference,'OPSH0073');
 const quote=showers.quote(1000,iconik,{iconikColor:'plus'});
 assert.equal(quote.rawPrice,1150);
 assert.equal(quote.price,1196);
 assert.deepEqual(quote.components.filter(x=>x.reference==='OPSH0073').map(x=>x.rawPrice),[150]);
});
