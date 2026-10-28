'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
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


test('V11.62.1 uses the filtered variant and preserves exact manufacturer media',()=>{
  const code=fs.readFileSync(path.join(root,'brand-configurators.js'),'utf8');
  assert.doesNotMatch(code,/const selected=\(g\.variants\|\|\[\]\)\.find/);
  assert.equal((code.match(/const selected=rows\.find\(v=>v\.reference===draft\.reference\)/g)||[]).length,3);
  assert.equal((code.match(/mediaPreview\('(Bette|Carrodrain|Hidrobox)',p,g,exact\)/g)||[]).length,3);
  assert.equal((code.match(/technicalSheetUrl:media\.technicalSheetUrl/g)||[]).length,3);
  assert.equal((code.match(/image:media\.image/g)||[]).length,3);
  assert.doesNotMatch(code,/image:'',purchaseDiscount:50/);
  assert.match(code,/cfgCache\.delete\(key\)/);
  const win={};
  vm.runInNewContext(code,{window:win,Map,Uint8Array});
  for(const brand of ['Bette','Carrodrain','Hidrobox']){
    const api=win['Hydro'+brand+'Configurator'];
    assert.equal(typeof api?.open,'function');
    assert.equal(api.eligible({manufacturer:brand,configuratorType:brand.toLowerCase()}),true);
    assert.equal(api.eligible({manufacturer:'Different',configuratorType:brand.toLowerCase()}),false);
  }
});


test('V11.62.2 guided Hidrobox supports every priced supplier group',()=>{
 const groups=loadB64Gzip(['hidrobox-config-01.b64']).groups;
 const guide=fs.readFileSync(path.join(root,'hidrobox-guided.js'),'utf8');
 const neoCode=fs.readFileSync(path.join(root,'hidrobox-neo-plus-2026.js'),'utf8');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const carro=fs.readFileSync(path.join(root,'brand-configurators.js'),'utf8');
 assert.match(html,/hidrobox-guided\.js/);
 assert.match(html,/hidrobox-neo-plus-2026\.js/);
 assert.match(guide,/HIDROBOX_PRODUCT_TREE/);
 assert.match(guide,/universalPage\(group\)/);
 assert.match(guide,/source:'HIDROBOX_TARIF_FR_V0226_19-02-2026\.pdf'/);
 assert.match(guide,/technicalSheetUrl:tech/);
 assert.match(carro,/CARRODRAIN_MODELS/);
 const win={HydroHidroboxConfigurator:{groups:async()=>groups}};
 vm.runInNewContext(neoCode,{window:win});
 vm.runInNewContext(guide,{window:win});
 const neo=win.HydroNeoPlus2026;
 const x={form:'rectangle',width:90,length:120,material:'Kromat',texture:'Lisse',group:'BAS',color:'Beige',grille:'Point Inox',bonde:'Horizontale standard'};
 const p=neo.lookup(x);
 assert.equal(p.ok,true);
 assert.equal(p.reference,'SNEC0043');
 assert.equal(p.rawPrice,720);
 assert.equal(p.price,748.8);
 assert.equal(neo.lookup({...x,width:140,length:210}).ok,false);
 assert.ok(groups.every(g=>Array.isArray(g.variants)&&g.variants.length));
 assert.equal(typeof win.HydroHidroboxConfigurator.open,'function');
 console.log('HIDROBOX_TARIFF_GROUPS',JSON.stringify(groups.map(g=>({
   id:g.id,collection:g.collection,category:g.category,rows:g.variants.length,
   fields:Object.keys(g.variants[0]||{}),
   first:g.variants[0]
 }))));
});
