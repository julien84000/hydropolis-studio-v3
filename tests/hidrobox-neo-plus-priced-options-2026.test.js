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
