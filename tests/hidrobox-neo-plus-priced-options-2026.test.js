'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const opt=require('../public/hidrobox-shower-options-2026.js');
test('Neo Plus 2026 grille/bonde prices reflect exact manufacturer OPSH references',()=>{
 const groups=opt.optionsFor({model:'neo-plus',material:'Kromat',texture:'Lisse',width:90,colorGroup:'BAS'});
 assert.deepEqual(groups.map(x=>x.key),['cover','drain','cut']);
 const quote=opt.quote(1000,groups,{cover:'point-trend',drain:'v90',cut:'special'});
 assert.equal(quote.ok,true);
 assert.deepEqual(quote.components.map(c=>c.reference),['OPSH0003','OPSH0077','OPSH0018']);
 assert.deepEqual(quote.components.map(c=>c.rawPrice),[25,51,100]);
 assert.equal(quote.optionRawPrice,176);
 assert.equal(quote.rawPrice,1176);
 assert.equal(quote.price,1223.04);
 const free=opt.quote(1000,groups,{cover:'point-inox',drain:'h90',cut:'none'});
 assert.equal(free.price,1040);
 assert.equal(free.optionRawPrice,0);
 assert.deepEqual(free.components.map(c=>c.reference),['OPSH0001','OPSH0078']);
});
test('Neo Plus added grid and drain surcharges must never change the 10% cut base',()=>{
 const groups=opt.optionsFor({model:'neo-plus'});
 const a=opt.quote(653,groups,{cover:'point-inox',drain:'h90',cut:'special'});
 const b=opt.quote(653,groups,{cover:'radiance-gunmetal',drain:'plus90',cut:'special'});
 assert.equal(a.optionRawPrice,65.3);
 assert.equal(b.optionRawPrice,65.3+62+38);
 assert.equal(b.price-a.price,104);
 assert(b.components.some(c=>c.reference==='OPSH0013'&&c.rawPrice===62));
 assert(b.components.some(c=>c.reference==='OPSH0017'&&c.rawPrice===38));
});

test('Neo Plus existing supplier lookup already includes grille and bonde; quoted option cost is not duplicated',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
 const ctx={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/hidrobox-neo-plus-2026.js'),'utf8'),ctx);
 const calc=ctx.window.HydroNeoPlus2026;
 const chosen={form:'rectangle',material:'Kromat',group:'BAS',texture:'Lisse',
   color:'Bianco',width:90,length:120,grille:'Point Trend',bonde:'Verticale'};
 const row=calc.lookup(chosen);
 assert.equal(row.ok,true,JSON.stringify(row));
 assert.equal(row.grilleRawPrice,25);
 assert.equal(row.bondeRawPrice,51);
 assert.equal(row.rawPrice-row.rawBasePrice,76);
 const price=opt.quote(row.rawBasePrice,opt.optionsFor({model:'neo-plus'}),{cover:'point-trend',drain:'v90',cut:'none'});
 assert.equal(price.rawPrice,row.rawPrice,'Existing supplier-priced fittings cannot be counted twice');
 assert.equal(price.price,row.price);
 const cut=opt.quote(row.rawBasePrice,opt.optionsFor({model:'neo-plus'}),{cover:'point-trend',drain:'v90',cut:'special'});
 const cutComponent=cut.components.find(x=>x.reference==='OPSH0018');
 assert.equal(cutComponent.rawPrice,Math.round(row.rawBasePrice*10)/100);
 assert.equal(cut.rawPrice,row.rawPrice+cutComponent.rawPrice);
});
