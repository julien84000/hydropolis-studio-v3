'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const root=path.join(__dirname,'..');
const requests=require('../bette-render-requests.json').requests;
const raw=['01','02','03'].map(n=>fs.readFileSync(path.join(root,'public/brand-data/bette-config-'+n+'.b64'),'utf8').trim()).join('');
const catalog=JSON.parse(zlib.gunzipSync(Buffer.from(raw,'base64')).toString('utf8'));
test('Capture 3D Bette must match a uniquely priced SKU in supplier price matrix',()=>{
 assert.equal(catalog.manufacturer,'Bette');
 for(const q of requests){
  const matches=catalog.groups.flatMap(g=>g.variants.filter(v=>v.reference===q.reference).map(v=>({group:g,variant:v})));
  assert.equal(matches.length,1,'Référence tarifée unique requise : '+q.reference+' (matches '+matches.length+')');
  const {group,variant}=matches[0];
  assert.equal(Number(variant.lengthMm),q.lengthMm,'Longueur '+q.reference);
  assert.equal(Number(variant.widthMm),q.widthMm,'Largeur '+q.reference);
  assert(/^bette/i.test(group.family)&&group.family.toLowerCase().includes(q.model.toLowerCase()),
    'Nom du modèle incohérent : '+group.family+' vs '+q.model);
  assert(Number(variant.price)>0);
 }
});