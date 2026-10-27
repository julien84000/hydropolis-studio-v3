'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');

const root=path.join(__dirname,'..','public');
function loadB64Gzip(files){
  const b64=files.map(f=>fs.readFileSync(path.join(root,'brand-data',f),'utf8').trim()).join('');
  return JSON.parse(zlib.gunzipSync(Buffer.from(b64,'base64')).toString('utf8'));
}

test('V11.62 Bette tariff matrix is complete and configurable',()=>{
  const data=loadB64Gzip(['bette-config-01.b64','bette-config-02.b64','bette-config-03.b64']);
  assert.equal(data.manufacturer,'Bette');
  assert.equal(data.groups.length,93);
  assert.equal(data.groups.reduce((n,g)=>n+g.variants.length,0),62264);
  const air=data.groups.find(g=>g.id==='betteair');
  assert.ok(air);
  assert.match(air.manufacturerUrl,/my-bette\.com\/fr\/produit\//);
  assert.ok(air.variants.some(v=>v.reference==='7350-000T2'&&v.lengthMm===900&&v.widthMm===900));
});

test('V11.62 Carrodrain matrix follows collection version length finish',()=>{
  const data=loadB64Gzip(['carrodrain-config-01.b64']);
  assert.equal(data.groups.length,12);
  assert.equal(data.groups.reduce((n,g)=>n+g.variants.length,0),635);
  const cayman=data.groups.find(g=>g.id==='cayman');
  assert.ok(cayman.variants.some(v=>v.version==='LOW'&&v.length==='600'&&v.finish==='INOX stainless steel'&&v.reference==='100403'));
  assert.ok(cayman.variants.some(v=>v.version==='PRO'));
});

test('V11.62 Hidrobox applies exactly +4 percent to supplied public tariff',()=>{
  const data=loadB64Gzip(['hidrobox-config-01.b64']);
  assert.equal(data.priceRule.upliftPct,4);
  assert.equal(data.groups.length,27);
  assert.equal(data.groups.reduce((n,g)=>n+g.variants.length,0),4479);
  const arq=data.groups.find(g=>g.id==='arq');
  const row=arq.variants.find(v=>v.reference==='SARC0361');
  assert.equal(row.rawPrice,571);
  assert.equal(row.price,593.84);
  assert.equal(Number((row.rawPrice*1.04).toFixed(2)),row.price);
});

test('V11.62 app routes new brands to configurators and uses 50 percent supplier default',()=>{
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/brand-configurators\.js/);
  assert.match(app,/HydroHidroboxConfigurator/);
  assert.match(app,/HydroBetteConfigurator/);
  assert.match(app,/HydroCarrodrainConfigurator/);
  assert.match(app,/Hidrobox:50,Bette:50,Carrodrain:50/);
  assert.match(app,/Hidrobox\|Bette\|Carrodrain/);
});
