'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),zlib=require('zlib');
const read=n=>JSON.parse(fs.readFileSync(path.join(__dirname,n),'utf8'));
const files=fs.readdirSync(path.join(__dirname,'public'));for(const f of files.filter(x=>x.endsWith('.json')))read('public/'+f);
const v=read('public/vismara_tariff_2026.json'),kn=v.pages.find(p=>p.model==='KN');assert(kn.matrix.some(r=>r.range==='KN 67'&&r.profiles.includes('21')&&r.glasses.includes('04')&&r.price===1265));assert(kn.matrix.some(r=>r.range==='KN 68 … KN 77'&&r.profiles.includes('31')&&r.glasses.includes('05')&&r.price===1515));
const t=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'tda_tariff_2026.json.gz'))));assert(t.rows.length>300000);
const idx=read('assets_index.json');for(const pack of new Set(Object.values(idx)))assert(fs.existsSync(path.join(__dirname,pack)));
const html=fs.readFileSync(path.join(__dirname,'public/index.html'),'utf8');assert.equal((html.match(/<script src=/g)||[]).length,1);assert(html.includes('app.js?v=11.54-clean-final'));
console.log('V11.54 : catalogues, tarifs, ressources et livraison vérifiés.');
