'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const engine=require('../public/hidrobox-tray-cascade-2026.js');
const models=require('../public/hidrobox-tray-models-2026.js');
const official=require('../public/hidrobox-official-render.js');
const raw=fs.readFileSync(path.join(__dirname,'../public/brand-data/hidrobox-config-01.b64'),'utf8');
const all=JSON.parse(zlib.gunzipSync(Buffer.from(raw.trim(),'base64')).toString('utf8')).groups;
const group=name=>all.find(x=>x.collection===name);
test('Supplier-specific fixed material and texture are applied before filtering, never global defaults',()=>{
 const cases={
  Twins:['Kromat','Microtex'],
  Quadro:['Kromat','Ardoise'],
  Pure:['Kromat','Microtex'],
  Arq:['Kromat','Ciment'],
  Loovers:['Scene','Lisse'],
  Unique:['Scene','Lisse'],
  Iconik:['Scene','Lisse']
 };
 for(const [name,[material,texture]] of Object.entries(cases)){
   const g=group(name);assert(g,name+' tariff group missing');
   const products=g.variants.filter(x=>engine.belongs(g,x));
   assert(products.length>0,name+' real SKUs missing');
   assert.deepEqual([...new Set(products.map(x=>engine.enrich(g,x).material))],[material],name+' material');
   assert.deepEqual([...new Set(products.map(x=>engine.enrich(g,x).finish))],[texture],name+' texture');
   const flow=engine.arrange(g,products,{},models,official);
   assert.equal(flow.fields[0].chosen,material);
   assert.equal(flow.fields[1].chosen,texture);
   assert.equal(flow.fields[0].static,true);
   assert.equal(flow.fields[1].static,true);
   console.log('Hidrobox '+name+' : '+products.length+' sources, '+material+'/'+texture);
 }
});
test('ONE texture follows the corresponding published SKU and its shape',()=>{
 const g=group('One');assert(g);
 const samples={SONC0439:'Ardoise',SONC0478:'Ardoise',SONC0585:'Microtex',SONC0643:'Microtex'};
 for(const [reference,texture] of Object.entries(samples)){
   const line=g.variants.find(x=>x.reference===reference);assert(line,reference);
   assert.equal(engine.enrich(g,line).material,'Kromat');
   assert.equal(engine.enrich(g,line).finish,texture);
 }
});
test('Exact order is model, material, texture, color, width, length and then verified SKU',()=>{
 for(const name of ['Twins','Quadro','One','Pure','Arq','Loovers','Unique','Iconik']){
  const g=group(name),flow=engine.arrange(g,g.variants,{},models,official);
  assert(flow.models.length>0,name+' must have supplier model choice');
  assert.deepEqual(flow.fields.map(f=>f.key),['material','finish','color','width','length']);
  assert(flow.selected,name+' must have selected tariff record');
  assert(flow.refs.every(x=>g.variants.some(y=>y.reference===x)));
 }
});
test('Color groups retain actual supplier references and never fabricate a finish code',()=>{
 assert(engine.colorsForGroup('BAS').includes('Bianco'));
 assert(engine.colorsForGroup('TRE').includes('Brownie'));
 assert(engine.colorsForGroup('BLA').includes('Blanc'));
 assert.deepEqual(engine.colorsForGroup('BLA'),['Blanc']);
 assert.equal(engine.groupForColor('Brownie','Kromat',['BAS','TRE','SPE']),'TRE');
 assert.equal(engine.groupForColor('Bianco','Kromat',['BAS','TRE','SPE']),'BAS');
 assert.equal(engine.groupForColor('Bianco','Scene',['BLA']),'');
 assert.equal(engine.groupForColor('Random unlisted','Kromat',['BAS','TRE']),'');
 const q=group('Quadro');
 const picture=engine.arrange(q,q.variants,{showerColor:'Brownie'},models,official);
 assert.equal(picture.selected.material,'Kromat');
 assert.equal(picture.selected.finish,'Ardoise');
 assert(picture.refs.every(ref=>q.variants.some(row=>row.reference===ref)));
});
test('Scene standard only offers white for shower trays, with no Kromat shade mislabelled',()=>{
 const g=group('Loovers');
 const result=engine.arrange(g,g.variants,{showerColor:'Brownie'},models,official);
 assert.equal(result.fields.find(f=>f.key==='color').chosen,'Blanc');
 assert.equal(result.needsColorQuote,false);
 const white=engine.arrange(g,g.variants,{showerColor:'Blanc'},models,official);
 assert.equal(white.needsColorQuote,false);
});
test('Drain and grilles are never primary receveur rows',()=>{
 for(const name of ['Line','Twins','Quadro','One']){
  const g=group(name);
  assert(g.variants.filter(v=>engine.belongs(g,v)).every(v=>!/^OPSH/.test(v.reference)));
 }
});
