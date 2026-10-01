'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),zlib=require('zlib');
const read=n=>JSON.parse(fs.readFileSync(path.join(__dirname,n),'utf8'));
// ALPI 2025 data integrity.
const alpi=read('public/alpi_catalog_2025.json');
assert(Array.isArray(alpi)&&alpi.length===3041,`Catalogue ALPI incomplet : ${Array.isArray(alpi)?alpi.length:'invalide'} références`);
assert(alpi.every(p=>p.manufacturer==='Alpi'),'Fabricant ALPI incohérent');
assert(alpi.every(p=>Number(p.purchaseDiscount)===55),'Remise ALPI : 55 % attendus');
assert(alpi.every(p=>Number.isFinite(Number(p.price))&&Number(p.price)>0),'Prix public ALPI invalide');
assert(alpi.every(p=>Math.abs(Number(p.purchasePrice)-Number(p.price)*0.45)<0.06),'Prix remisé ALPI incohérent avec 55 %');
const byRef=new Map(alpi.map(p=>[String(p.reference||'').replace(/\s+/g,'').toUpperCase(),p]));
const linked=alpi.filter(p=>p.internalReference);
assert(linked.length>=40,'Liaisons corps d’encastrement ALPI insuffisantes');
for(const p of linked){
  const r=String(p.internalReference).replace(/\s+/g,'').toUpperCase();
  const body=byRef.get(r);
  assert(body,`Corps ALPI ${p.internalReference} absent pour ${p.reference}`);
  assert(Math.abs(Number(p.internalPrice)-Number(body.price))<0.02,`Prix corps ALPI incohérent pour ${p.reference}`);
}

// Existing release checks.
const files=fs.readdirSync(path.join(__dirname,'public'));for(const f of files.filter(x=>x.endsWith('.json')))read('public/'+f);
const v=read('public/vismara_tariff_2026.json'),kn=v.pages.find(p=>p.model==='KN');assert(kn.matrix.some(r=>r.range==='KN 67'&&r.profiles.includes('21')&&r.glasses.includes('04')&&r.price===1265));assert(kn.matrix.some(r=>r.range==='KN 68 … KN 77'&&r.profiles.includes('31')&&r.glasses.includes('05')&&r.price===1515));
const t=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'tda_tariff_2026.json.gz'))));assert(t.rows.length>300000);
const idx=read('assets_index.json');for(const pack of new Set(Object.values(idx)))assert(fs.existsSync(path.join(__dirname,pack)));


const html=fs.readFileSync(path.join(__dirname,'public/index.html'),'utf8');
for(const module of ['runtime-config','catalog-index','rough-in','official-media','app','sira-configurator'])assert(html.includes(module+'.js'),'Module source absent : '+module);
assert(!html.includes('ROUGHIN_AUTO_CATALOG_LOOKUP'),'Ancien correctif injecté présent');
assert(!html.includes('alpi-integration.js'),'Ancien chargement ALPI en parallèle présent');
console.log(`Release ${read('package.json').version} : données, ressources et modules source valides.`);
