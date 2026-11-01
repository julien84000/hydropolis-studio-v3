'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const dir=path.join(__dirname,'../public');
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const m=require('../public/hidrobox-program-colour-2026.js');
const json=JSON.parse(zlib.gunzipSync(Buffer.from(read('brand-data/hidrobox-config-01.b64').trim(),'base64')).toString('utf8'));
const group=json.groups.find(g=>g.collection==='Program Colour');
const imported=group?.variants||[];
test('2026 French supplier: all 84 Program Colour WPCC SKUs have the exact published reference, price, and colour tier',()=>{
 assert(group,'Program Colour collection must exist');
 assert.equal(m.BASE_ROWS.length,84,'4 dimensional bands × 3 price colours × 7 length bands');
 const prices=new Map(imported.filter(r=>/^WPCC\d{4}$/.test(r.reference)).map(r=>[r.reference,r]));
 assert.equal(prices.size,84,'all 84 product references must be in the actual imported price list');
 for(const row of m.BASE_ROWS){
  const source=prices.get(row.reference);
  assert(source,'Missing supplier SKU '+row.reference);
  assert.equal(Number(source.rawPrice),row.rawPrice,'2026 supplier price mismatch '+row.reference);
  assert.equal(source.colorGroup,row.group,'colour group mismatch '+row.reference);
 }
 assert.equal(m.BASE_ROWS.find(r=>r.reference==='WPCC0145').rawPrice,604);
 assert.equal(m.BASE_ROWS.find(r=>r.reference==='WPCC0201').rawPrice,754);
 assert.equal(m.BASE_ROWS.find(r=>r.reference==='WPCC0228').rawPrice,2722);
});
test('Program Colour: S41 is included, S42 is the manufacturer +215 EUR extra; no second +25% special surcharge',()=>{
 const a=m.quote({length:120,depth:50,height:1.2,group:'BAS',color:'Beige',basin:'S41'},imported);
 assert(a.ok,JSON.stringify(a.errors));assert.equal(a.reference,'WPCC0147');assert.equal(a.rawPrice,821);assert.equal(a.price,853.84);
 assert.equal(a.components[1].reference,'OPWB0139');assert.equal(a.components[1].rawPrice,0);
 const b=m.quote({length:140,depth:48,height:1.2,group:'TRE',color:'Blush',basin:'S42'},imported);
 assert(b.ok,JSON.stringify(b.errors));assert.equal(b.reference,'WPCC0176');
 assert.equal(b.components[1].reference,'OPWB0241');assert.equal(b.components[1].rawPrice,215);
 assert.equal(b.rawPrice,1177);assert.equal(b.price,1224.08);
 const c=m.quote({length:140,depth:48,height:1.2,group:'SPE',specialCode:'RAL 9010'},imported);
 assert(c.ok,JSON.stringify(c.errors));assert.equal(c.reference,'WPCC0204');
 assert.equal(c.rawPrice,1203,'already includes manufacturer special-colour premium');
 assert.equal(c.price,1251.12,'4% applied once and only once');
});
test('Only manufacturer-priced compatible centimetre dimensions are quoted',()=>{
 const q=(x)=>m.quote(x,imported);
 assert(!q({length:69,depth:45,height:1.2}).ok,'no published base SKU under 70cm');
 assert(!q({length:202,depth:45,height:1.2}).ok,'not over the 201cm max');
 assert(!q({length:160,depth:56,height:10}).ok,'55cm depth limit when skirt present');
 assert(!q({length:100,depth:45,height:2}).ok,'height 2cm has no supplier SKU');
 assert(!q({length:120.5,depth:50,height:1.2}).ok,'whole centimetres only');
 assert(!q({length:120,depth:50,height:1.2,group:'SPE',specialCode:''}).ok,'RAL/NCS code is mandatory');
 assert(!q({length:120,depth:50,height:1.2,group:'TRE',color:'Beige'}).ok,'different palette');
 assert(!q({length:120,depth:50,height:1.2,group:'BAS',color:'Beige',basin:'S42'}).ok,'double basin too short');
 const legal=q({length:150,depth:40,height:10,group:'BAS',color:'Pietra',basin:'S42'});
 assert(legal.ok,JSON.stringify(legal.errors));
});
test('Accessory options are sourced from the printed PDF, itemized and not double counted',()=>{
 const q=m.quote({length:120,depth:50,height:1.2,group:'TRE',color:'Blush',tap:'H1',
    drain:'clickKromatTRE',overflow:true,backsplashHeight:8,towel:'under30Steel'},imported);
 assert(q.ok,JSON.stringify(q.errors));
 const refs=q.components.map(c=>c.reference);
 for(const code of ['WPCC0175','OPWB0140','OPWB0007','OPWB0057','OPWB0012','OPWB0106','OPWB0172'])assert(refs.includes(code),code);
 assert.equal(q.rawPrice,q.components.reduce((n,c)=>n+c.rawPrice,0));
 assert.equal(q.price,Math.round(q.rawPrice*104)/100);
 assert(!m.quote({group:'BAS',drain:'clickKromatTRE'},imported).ok,'no mixed finish/color group');
 assert(!m.quote({specialCut:true},imported).ok,'special cut requires technical approval');
});
test('Guided route, CSS and official-image disclaimers never pretend palette swatches are exact manufacturer photos',()=>{
 const html=read('index.html'),guided=read('hidrobox-guided.js'),ui=read('hidrobox-program-colour-ui.js');
 assert.match(html,/hidrobox-program-colour-2026\.js\?v=__APP_VERSION__/);
 assert.match(html,/hidrobox-program-colour-ui\.js\?v=__APP_VERSION__/);
 assert.match(html,/hidrobox-program\.css\?v=__APP_VERSION__/);
 assert.match(guided,/familyName==='program colour'\)return sourcePanelSpotPage\(g,'programColour'\)/);
 assert.match(guided,/root\.HydroProgramColourUI\?\.programColour\(g,ctx\)/);
 for(const field of ['pcGroup','pcLength','pcDepth','pcHeight','pcSpecial','pcPosition','pcAdd','pcDrain'])assert(ui.includes(field),field);
 assert.match(ui,/SCHÉMA INDICATIF/);assert.match(ui,/pastilles de couleur sont des approximations visuelles/);
 assert.match(ui,/HydroHidroboxOfficialVisual/);
});