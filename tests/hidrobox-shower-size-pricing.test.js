'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const all=JSON.parse(zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(__dirname,'../public/brand-data/hidrobox-config-01.b64'),'utf8').trim(),'base64')).toString('utf8')).groups;
const line=require('../public/hidrobox-line-tariff-bands-2026.js');
const other=require('../public/hidrobox-shower-tariff-bands-2026.js');
const measures=require('../public/hidrobox-tray-dimensions-2026.js');
const cascade=require('../public/hidrobox-tray-cascade-2026.js');
const models=require('../public/hidrobox-tray-models-2026.js');
const official=require('../public/hidrobox-official-render.js');
const sources={Line:['SLIC',660],Twins:['STWC',96],Quadro:['SQUC',150],One:['SONC',132],
 Pure:['SPUC',33],Arq:['SARC',72],Loovers:['SLOC',9],Unique:['SUNC',113],Iconik:['SICC',10]};
const group=n=>all.find(g=>g.collection===n);
const normalized=n=>group(n).variants.filter(r=>String(r.reference||'').startsWith(sources[n][0]))
  .map(r=>n==='Line'?line.fill(r):other.fill(r));
test('All 1275 primary shower tray SKUs have manufacturer source price and dimension metadata',()=>{
 const missed=[];
 for(const [name,[prefix,count]] of Object.entries(sources)){
  const rows=normalized(name);
  assert.equal(rows.length,count,name);
  for(const r of rows){
   if(!r||!measures.band(r.width)||!measures.band(r.length)||Number(r.rawPrice)<=0||!r.sourceBandsVerified)
    missed.push({name,reference:r?.reference});
   else assert.equal(r.price,Math.round(r.rawPrice*104)/100,r.reference);
  }
 }
 assert.deepEqual(missed,[],'Unmatched SKU/width/length source cells');
 assert.equal(line.map?Object.keys(line.map).length:0,660);
 assert.equal(other.map.size,615);
});
test('Measured LINE X 80 × 120 cm obtains original Kromat BAS Smooth SKU and price',()=>{
 const rows=normalized('Line').filter(r=>r.model==='line-x'&&r.material==='Kromat'&&r.finish==='Lisse'&&r.colorGroup==='BAS');
 const res=measures.resolve(rows,80,120);
 assert.equal(res.ok,true);
 assert.deepEqual(res.matches.map(x=>x.reference),['SLIC0554']);
 assert.equal(res.matches[0].rawPrice,756);
 assert.equal(res.matches[0].price,786.24);
 const adjacent=measures.resolve(rows,81,120);
 assert.equal(adjacent.matches[0].reference,'SLIC0564');
});
test('Each other shower tray collection resolves the supplier SKU and exact imported tariff price',()=>{
 const examples=[
  ['Twins','twins-yl','STWC0097',80,105],
  ['Twins','twins-yr','STWC0113',80,105],
  ['Quadro','quadro-rectangle','SQUC0021',80,105],
  ['One','one-rectangle','SONC0470',80,140],
  ['Pure','pure-rectangle','SPUC0014',80,120],
  ['Arq','arq-rectangle','SARC0383',80,125],
  ['Unique','unique-rectangle','SUNC0055',90,145],
  ['Iconik','iconik-rectangle','SICC0006',90,120],
  ['Loovers','loovers-share','SLOC0001',90,180]
 ];
 for(const [name,model,reference,width,length] of examples){
  const rows=normalized(name).filter(x=>x.model===model&&x.reference===reference);
  assert.equal(rows.length,1,name+' '+reference+' absent');
  const direct=measures.resolve(rows,width,length);
  assert.equal(direct.ok,true,name+' '+reference);
  assert.equal(direct.matches[0].reference,reference);
  assert.equal(direct.tiers[0].price,Math.round(direct.matches[0].rawPrice*104)/100);
 }
});
test('Out-of-catalogue and gap dimensions are never priced by interpolating nearest SKU',()=>{
 const rows=normalized('Twins').filter(x=>x.model==='twins-yl'&&x.colorGroup==='BAS');
 assert.equal(measures.resolve(rows,70,150).ok,false);
 assert.equal(measures.resolve(rows,80,181).ok,false);
 assert.equal(measures.resolve(rows,80,100.5).ok,false);
 const one=normalized('One').filter(x=>x.model==='one-rectangle');
 assert.equal(measures.resolve(one,73,120).ok,false,'ONE supports standard widths only');
});
test('Tariff cascade prices measured size after model, material, texture and colour selection',()=>{
 const g=group('Line'),rows=normalized('Line');
 const pick=cascade.arrange(g,rows,{traySubmodel:'line-x',material:'Kromat',finish:'Lisse',
  showerColor:'Bianco',exactwidth:80,exactlength:120},models,official,measures);
 assert.equal(pick.ready,true);
 assert.equal(pick.selected.reference,'SLIC0554');
 assert.equal(pick.selected.rawPrice,756);
 assert.deepEqual(pick.fields.map(f=>f.key),['material','finish','color','width','length']);
 const invalid=cascade.arrange(g,rows,{traySubmodel:'line-x',material:'Kromat',finish:'Lisse',
  showerColor:'Bianco',exactwidth:80,exactlength:250},models,official,measures);
 assert.equal(invalid.ready,false);
 assert.equal(invalid.dimensionResolution.ok,false);
});
