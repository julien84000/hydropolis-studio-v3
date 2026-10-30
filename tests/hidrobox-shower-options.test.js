'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const m=require('../public/hidrobox-shower-options-2026.js');
const group=(a,k)=>a.find(x=>x.key===k);
test('LINE X outlet length and supplier option code follow exact official dimensions',()=>{
 const a=m.optionsFor({model:'line-x',width:80,material:'Kromat',texture:'Lisse',colorGroup:'BAS'});
 assert.equal(group(a,'cover').options[0].reference,'OPSH0022'); // LINE L60 inox
 assert.equal(group(a,'cover').options[1].reference,'OPSH0031'); // L60 Basic smooth
 assert.equal(group(a,'drain').options[1].reference,'OPSH0050');
 assert.equal(group(a,'drain').options[1].rawPrice,36);
 const b=m.optionsFor({model:'line-x',width:98,material:'Kromat',texture:'Ardoise',colorGroup:'TRE'});
 assert.equal(group(b,'cover').options[0].reference,'OPSH0024');
 assert.equal(group(b,'cover').options[1].reference,'OPSH0047'); // L80 slate trend
 const c=m.optionsFor({model:'line-y',width:80,material:'Scene',texture:'Lisse',colorGroup:'BLA'});
 assert.equal(group(c,'cover').options[0].reference,'OPSH0023');
 assert.equal(group(c,'cover').options[1].reference,'OPSH0026');
 assert.deepEqual(m.optionsFor({model:'line-x',width:120,material:'Scene',texture:'Lisse'}),[]);
});
test('TWINS YL/YR have distinct source codes, a matching cover and Ø50 Domoplex',()=>{
 const l=m.optionsFor({model:'twins-yl',colorGroup:'BAS'});
 const r=m.optionsFor({model:'twins-yr',colorGroup:'TRE'});
 assert.equal(group(l,'cover').options[0].reference,'OPSH0051');
 assert.equal(group(r,'cover').options[0].reference,'OPSH0052');
 assert.equal(group(r,'drain').options[1].rawPrice,36);
});
test('QUADRO / ONE / PURE options use true manufacturer 2026 prices',()=>{
 const q=m.optionsFor({model:'quadro'});
 assert.equal(q[0].options.find(x=>x.id==='point-trend').rawPrice,25);
 assert.equal(q[0].options.find(x=>x.id==='radiance-steel').rawPrice,62);
 assert.equal(q[1].options.find(x=>x.id==='v90').rawPrice,51);
 assert.equal(q[1].options.find(x=>x.id==='low90').rawPrice,26);
 const o=m.optionsFor({model:'one'});
 assert.equal(o[0].options.find(x=>x.id==='basic').rawPrice,14);
 assert.equal(m.optionsFor({model:'pure'})[1].options.find(x=>x.id==='plus90').rawPrice,38);
});
test('Options change public price exactly once by +4%, without changing base supplier ref',()=>{
 const groups=m.optionsFor({model:'line-x',width:80,material:'Kromat',texture:'Lisse',colorGroup:'BAS'});
 const quote=m.quote(657,groups,{cover:'matching',drain:'v50'});
 assert.equal(quote.rawPrice,657+38+36);
 assert.equal(quote.price,760.24);
 assert.equal(quote.optionRawPrice,74);
 assert.deepEqual(quote.components.map(x=>x.reference),['OPSH0031','OPSH0050']);
 assert.equal(m.quote(657,groups,{cover:'bogus',drain:'h50'}).ok,false);
 assert.equal(m.quote(0,groups).ok,false);
});
test('Do not guess outlet diameter on LOOVERS or options on unverified UNIQUE/FALCON',()=>{
 assert.deepEqual(m.optionsFor({model:'loovers'}),[]);
 assert.equal(m.optionsFor({model:'loovers',outlet:'50'})[1].options[1].rawPrice,36);
 assert.equal(m.optionsFor({model:'loovers',outlet:'90'})[1].options[1].rawPrice,51);
 assert.deepEqual(m.optionsFor({model:'unique'}),[]);
 assert.deepEqual(m.optionsFor({model:'falcon'}),[]);
});
