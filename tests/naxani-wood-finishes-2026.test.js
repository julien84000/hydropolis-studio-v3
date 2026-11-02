'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const rootPath=path.join(__dirname,'../public');
function load(name,ctx){vm.runInNewContext(fs.readFileSync(path.join(rootPath,name),'utf8'),ctx,{filename:name,timeout:3000})}
function fixture(){
 const ctx={window:{}};
 load('naxani-2026-catalog.js',ctx);
 load('naxani-2026-enhancements.js',ctx);
 ctx.window.HydroNaxaniEnhancements.annotate(ctx.window.HydroNaxani2026.rows);
 load('naxani-wood-finishes-2026.js',ctx);
 return ctx.window;
}
test('Naxani: every 2026 solid-wood tariff reference has species or finish',()=>{
 const root=fixture();
 const rows=root.HydroNaxani2026.rows.filter(x=>x.productType==='bois-massif');
 assert.equal(rows.length,739);
 assert.deepEqual(Array.from(rows.filter(x=>!x.naWood),x=>x.reference),[]);
 for(const row of rows)assert.ok(row.naVariant, 'Cabinet type missing: '+row.reference);
});
test('Naxani Suró 31: four distinct stain references/prices at 80 cm',()=>{
 const root=fixture();
 const rows=root.HydroNaxani2026.rows;
 const expected={
  Honey:['509302',1517],
  Smoked:['509623',1517],
  Burned:['509463',1529],
  Dark:['514436',1615]
 };
 const found=rows.filter(x=>x.collection==='Suró'&&x.naVariant==='31 · 1 tiroir'&&x.naWidth===80);
 assert.equal(found.length,4);
 for(const [finish,[ref,price]] of Object.entries(expected)){
  const item=found.find(x=>x.naWood===finish);
  assert.ok(item,'Suró finish missing '+finish);
  assert.equal(item.reference,ref);
  assert.equal(item.price,price);
  assert.equal(item.naFinishType,'teinte');
 }
});
test('Naxani Prenn and Slat: width and cabinet model remain stable across species',()=>{
 const root=fixture();
 const rows=root.HydroNaxani2026.rows;
 for(const [collection,model,width,expected] of [
  ['Prenn','31 · 1 tiroir',80,['Iroko','Érable','Noyer','Chêne']],
  ['Prenn','64 · 2 tiroirs + porte',100,['Iroko','Érable','Noyer','Chêne']],
  ['Slat','1C · 1 tiroir',80,['Frêne','Iroko','Érable','Noyer','Chêne']],
  ['Slat','2C · 2 tiroirs',80,['Frêne','Iroko','Érable','Noyer','Chêne']],
  ['Taba','1C · 1 tiroir',80,['Frêne','Érable','Noyer','Chêne','Iroko']]
 ]){
  const variants=rows.filter(x=>x.collection===collection&&x.naVariant===model&&x.naWidth===width);
  assert.deepEqual(Array.from(variants,x=>x.naWood).sort(),expected.slice().sort(),collection+' '+model+' '+width);
  assert.equal(new Set(variants.map(x=>x.reference)).size,expected.length);
 }
});
test('Naxani configurator exposes wood selector and clickable manufacturer photos',()=>{
 const html=fs.readFileSync(path.join(rootPath,'index.html'),'utf8');
 const js=fs.readFileSync(path.join(rootPath,'naxani-modular-configurator.js'),'utf8');
 const styles=fs.readFileSync(path.join(rootPath,'naxani-configurator.css'),'utf8');
 assert.ok(html.includes('naxani-wood-finishes-2026.js?v=__APP_VERSION__'));
 assert.ok(js.includes("root.HydroNaxaniWoodFinishes?.annotate?.(rows)"));
 assert.ok(js.includes('data-wood-finish'));
 assert.ok(js.includes('data-input="wood"'));
 assert.ok(js.includes("const woodCard=event.target.closest('button[data-wood-finish]')"));
 assert.ok(styles.includes('.nax-wood-choice.active'));
});
