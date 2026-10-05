'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),zlib=require('zlib');
const assets=require('../official-assets-server'),{MetadataCache,createPool}=require('../metadata-cache');
const rough=require('../public/rough-in'),index=require('../public/catalog-index');
const root=path.join(__dirname,'..'),fixtures=path.join(__dirname,'fixtures/official');
const read=file=>fs.readFileSync(path.join(fixtures,file),'utf8');
const alpi=require('../public/alpi_catalog_2025.json');
const models=require('../public/sira_models.json').models;
const rawCatalog=()=>{
  const manifest=require('../public/catalog_manifest.json');const by=new Map();
  const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8'),start=app.indexOf('const CATALOG=')+14,end=app.indexOf(';\n',start);
  for(const p of JSON.parse(app.slice(start,end)))by.set(index.key(p),p);
  for(const c of manifest.chunks){const b=fs.readFileSync(path.join(root,'public',c.file));const rows=JSON.parse(c.file.endsWith('.gz')?zlib.gunzipSync(b):b);for(const p of rows)by.set(index.key(p),p);}
  return [...by.values()];
};
test('les fabricants et les parents configurables sont conservés',()=>{
  const rows=rawCatalog(),counts={};for(const p of rows)counts[p.manufacturer]=(counts[p.manufacturer]||0)+1;
  assert.deepEqual(counts,{Amphora:171,Coalbrook:1483,Alpi:3041,Catalano:1430,Nicolazzi:36303,Hotbath:2554,'Lefroy Brooks':3397,Gessi:16211,Ritmonio:16082,Recor:192,Fioranese:1135,Resigres:38,Vismaravetro:15,TDA:20,'Sira Concrete':5,Zucchetti:12053});
  assert.equal(rows.length,94130);
  const tariff=require('../public/sira_tariff_2024.json');assert.equal(models.length,26);assert.equal(tariff.products.length,22);assert.equal(Object.keys(tariff.arctic).length,4);
  assert.equal(new Set(models.map(x=>x.collection)).size,5);
});
test('index local incrémental : fabricant + référence, y compris après chargement',()=>{
  const rows=[{manufacturer:'A',reference:'1'},{manufacturer:'B',reference:'1'}],i=index.create(rows);
  assert.equal(i.get('B|1').manufacturer,'B');rows.push({manufacturer:'B',reference:'2'});assert.equal(i.maker('B').length,2);assert.equal(i.get('B|2'),rows[2]);
});
test('Sira : tous les modèles, toutes les variations officielles et aucun produit voisin',()=>{
  for(const model of models){
    const data=assets.parseSiraPage(read('sira-'+model.code+'.html'),model.productUrl);
    assert.equal(data.colors.length,12,model.code);const images=new Set();
    for(const {code} of data.colors){const r=assets.selectSira(data,{color:code});assert.equal(r.finishMatch,'exact',model.code+'/'+code);assert.equal(r.finishCode,code);assert(assets.hostAllowed(r.image,'sira'));assert(r.technicalSheetUrl,model.code+' fiche absente');images.add(r.image);}
    assert.equal(images.size,12,model.code+' photos non distinctes');
    assert.equal(assets.selectSira(data,{color:'UNKNOWN'}).finishMatch,'generic');
  }
});
test('Gessi : dix articles, trois finitions distinctes minimum, aucune URL déduite',()=>{
  const files=fs.readdirSync(fixtures).filter(x=>/^gessi-\d+\.json/.test(x));assert(files.length>=10);
  for(const file of files){const json=JSON.parse(read(file)),article=json.data.product.productId,data=assets.parseGessiArticle(json,article);const finishes=Object.keys(data.variants);assert(finishes.length>=3,article);const images=new Set();
    for(const finish of finishes.slice(0,3)){const r=assets.selectGessi(data,{reference:article+'#'+finish});assert.equal(r.finishMatch,'exact');assert.equal(r.image,json.data.product.productsConfigured.find(v=>v.finiture.finitureId===finish).specificFeatureProductImg);assert(!/logo/i.test(r.image));images.add(r.image);}
    assert.equal(images.size,3,article);assert.equal(assets.selectGessi(data,{reference:article+'#XXX'}).image,'');
  }
  assert.throws(()=>assets.parseGessiArticle(JSON.parse(read(files[0])),'wrong'));
  const fake={data:{product:{productId:'75051',productsConfigured:[{finiture:{finitureId:'031'},specificFeatureProductImg:'https://www.gessi.com/logo.png'}]}}};assert.equal(assets.selectGessi(assets.parseGessiArticle(fake,'75051'),{reference:'75051#031'}).image,'');
});
test('ALPI : références exactes, plusieurs collections, documents officiels et finitions génériques explicites',()=>{
  const samples=JSON.parse(read('alpi-samples.json'));assert(samples.length>=10);
  for(const p of samples){const item=assets.matchAlpi(p);assert(item,p.reference);const r=assets.parseAlpiPopup(read('alpi-popup-'+item.id+'.html'),item);assert(assets.hostAllowed(r.image,'alpi'));assert(assets.hostAllowed(r.drawingUrl||r.technicalSheetUrl,'alpi'),p.reference+' document');}
  assert.equal(assets.matchAlpi({reference:'UNKNOWN',finishCode:'CR'}),null);
  const variant=assets.matchAlpi({reference:'VREL876MG17',finishCode:'MG'});assert(variant);assert.equal(variant.finishMatch,'generic');
});
test('hôtes officiels stricts : pas de tiers, identifiants ou protocoles détournés',()=>{
  for(const url of ['http://alpirubinetterie.com/x','https://alpirubinetterie.com.evil.test/x','https://user:pw@alpirubinetterie.com/x','data:image/png;base64,AA','https://localhost/x'])assert.equal(assets.hostAllowed(url,'alpi'),false,url);
});
test('cache métadonnées borné, expiration et déduplication en vol',async()=>{
  let now=0,calls=0;const c=new MetadataCache({max:2,ttl:10,clock:()=>now});
  await Promise.all(Array.from({length:50},()=>c.resolve('x',async()=>{calls++;return {image:'https://example.test/a.png'};})));assert.equal(calls,1);assert.equal(c.pending.size,0);
  c.set('y',{});c.set('z',{});assert.equal(c.size,2);assert.equal(c.get('x'),undefined);now=11;assert.equal(c.size,0);
  const pool=createPool(2,20);let high=0,active=0;await Promise.all(Array.from({length:12},()=>pool(async()=>{active++;high=Math.max(high,active);await new Promise(r=>setTimeout(r,3));active--;})));assert.equal(high,2);assert.equal(pool.stats().queued,0);
});
test('requêtes de finitions : un seul chargement par article et métadonnées sans HTML/Base64',async()=>{
  const json=JSON.parse(read('gessi-75051.json'));let calls=0;
  const resolver=new assets.ManufacturerAssetResolver({request:async()=>{calls++;return {status:200,data:json}}});
  try{const result=await Promise.all(Array.from({length:100},(_,i)=>resolver.resolve('gessi',{reference:'75051#'+['031','726','299'][i%3]})));assert.equal(calls,1);assert(result.every(x=>x.finishMatch==='exact'));assert(!/data:image|<html/.test(JSON.stringify(result)));assert.equal(resolver.stats().gessi.entries,1);}finally{resolver.close();}
});
test('corps natifs : prix séparé, quantités, marge, idempotence, orphelins et exception Lefroy',()=>{
  const source=alpi.find(p=>p.internalReference),body=alpi.find(p=>p.reference===source.internalReference);assert(source&&body);
  const parent={...source,id:'parent',roomId:'room',quantity:3,price:source.price+source.internalPrice,totalPrice:source.price+source.internalPrice,catalogPrice:source.price+source.internalPrice,catalogTotalPrice:source.price+source.internalPrice};
  const lookup=p=>{const row=alpi.find(x=>x.reference===p.reference&&x.manufacturer===p.manufacturer);return row===source?{...row,totalPrice:row.price+row.internalPrice}:row},make=(p,roomId,accessoryFor)=>({...p,id:'body',roomId,accessoryFor});
  let r=rough.reconcile([parent],lookup,make);assert.equal(r.records.length,2);const child=r.records[1];assert.equal(child.reference,body.reference);assert.equal(child.price,body.price);assert.equal(child.quantity,3);assert.equal(parent.price,source.price);
  assert.equal((parent.price+child.price)*.45,(source.price+source.internalPrice)*.45);assert.equal(rough.reconcile(r.records,lookup,make).changed,false);
  parent.quantity=4;rough.reconcile(r.records,lookup,make);assert.equal(child.quantity,4);
  assert.equal(rough.reconcile([child],lookup,make).records.length,0);
  const duplicate={...child,id:'duplicate'};assert.equal(rough.reconcile([...r.records,duplicate],lookup,make).records.length,2);
  assert.equal(rough.reconcile([{...parent,manufacturer:'Lefroy Brooks'}],()=>source,make).records.length,1);
  assert.equal(rough.reconcile([{id:'u',internalReference:'UNKNOWN',internalPrice:0}],()=>null,make).records.length,1);
});
test('proxy : annulation client libère immédiatement le stream distant',async()=>{
  const express=require('express'),http=require('http'),{Readable}=require('stream');
  const app=express();let destroyed=false,aborted=false,timer;
  const upstream=new Readable({read(){},destroy(error,callback){destroyed=true;clearInterval(timer);callback(error);}});
  app.get('/image',(req,res)=>assets.streamImage('https://alpirubinetterie.com/image.jpg',req,res,{family:'alpi',request:async options=>{options.signal.addEventListener('abort',()=>aborted=true);timer=setInterval(()=>upstream.push(Buffer.alloc(1024)),5);return {status:200,headers:{'content-type':'image/jpeg'},data:upstream};}}));
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  try{
    await new Promise((resolve,reject)=>{const req=http.get(`http://127.0.0.1:${server.address().port}/image`,res=>{res.once('data',()=>{req.destroy();setTimeout(resolve,30);});});req.on('error',e=>{if(e.code!=='ECONNRESET')reject(e);});});
    assert(destroyed);assert(aborted);
  }finally{upstream.destroy();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('proxy : un refus 403 est préservé et le corps distant détruit',async()=>{
  const {Readable,PassThrough}=require('stream'),{EventEmitter}=require('events');let status=0;
  const source=Readable.from('Access denied'),res=new PassThrough(),req=new EventEmitter();res.status=s=>{status=s;return res;};
  await assets.streamImage('https://siraconcrete.com/a.jpg',req,res,{family:'sira',request:async()=>({status:403,headers:{},data:source})});assert.equal(status,403);assert(source.destroyed);
});
test('verify-release est sans effets de bord et les scripts injectés ont disparu',()=>{
  const file=path.join(root,'public/index.html'),before=fs.readFileSync(file),cp=require('child_process');
  const result=cp.spawnSync(process.execPath,[path.join(root,'verify-release.js')],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.deepEqual(fs.readFileSync(file),before);
  assert(!before.toString().includes('alpi-integration.js'));assert(!before.toString().includes('ROUGHIN_AUTO_CATALOG_LOOKUP'));
  const src=fs.readFileSync(path.join(root,'server.js'),'utf8');assert(!src.includes('loadCatalogSearchIndex'));assert(!src.includes('embedOfficialImage'));assert(!src.includes('finishSimulationCache'));
});
test('service worker : catalogues réseau prioritaire et suppression des anciennes versions',async()=>{
  const vm=require('vm'),events={},deleted=[],cacheWrites=[];
  const version=require('../package.json').version,code=fs.readFileSync(path.join(root,'public/sw.js'),'utf8').replaceAll('__APP_VERSION__',version);
  const cache={put:(...args)=>cacheWrites.push(args),match:async()=>new Response('["old"]')};
  const self={addEventListener:(name,fn)=>events[name]=fn,clients:{claim:async()=>{}},skipWaiting:async()=>{}};
  const caches={keys:async()=>['hydropolis-old-shell','hydropolis-v'+version+'-shell','hydropolis-v'+version+'-catalogs','unrelated'],delete:async key=>deleted.push(key),open:async()=>cache};
  let network=0;vm.runInNewContext(code,{self,caches,URL,Response,location:{origin:'https://local.test'},fetch:async()=>{network++;return new Response('["fresh"]',{status:200})}});
  let pending;events.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['hydropolis-old-shell']);
  events.fetch({request:{method:'GET',url:'https://local.test/alpi_catalog_2025.json'},respondWith:p=>pending=p});const response=await pending;assert.equal(await response.text(),'["fresh"]');assert.equal(network,1);assert.equal(cacheWrites.length,1);
});


test('packs compressés : octets identiques, données imbriquées, erreurs et annulation',async()=>{
  const os=require('os'),crypto=require('crypto'),{packedStream,collectDocument}=require('../packed-assets');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-pack-test-')),file=path.join(dir,'assets.gz');
  const expected=crypto.randomBytes(350003),other=crypto.randomBytes(700001);
  fs.writeFileSync(file,zlib.gzipSync(JSON.stringify({before:{data:other.toString('base64')},models:{test:{image:expected.toString('base64')}},after:{data:other.toString('base64')}})));
  try{
    assert.deepEqual(await collectDocument(packedStream(file,['models','test'],'image')),expected);
    assert.deepEqual(await collectDocument(packedStream(file,['after'],'data')),other);
    await assert.rejects(collectDocument(packedStream(file,['missing'],'data')),/absente/);
    await assert.rejects(collectDocument(packedStream(file,['after'],'data'),100),/volumineux/);
    const stream=packedStream(file,['after'],'data');for await(const chunk of stream){assert(chunk.length<128*1024);break;}
    assert(stream.destroyed);
    assert.equal(Object.keys(require('../assets_metadata.json')).length,Object.keys(require('../assets_index.json')).length);
    assert(!JSON.stringify(require('../public/nicolazzi_pdf_index.json')).includes('data:image'));
    assert(Object.values(require('../public/nicolazzi_pdf_index.json').models).every(m=>!m.image));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('corps Coalbrook, Hotbath et Zucchetti : ajout sans double comptage du tarif',()=>{
  const rows=rawCatalog(),by=new Map(rows.map(p=>[index.key(p),p]));
  for(const maker of ['Coalbrook','Hotbath','Zucchetti']){
    const source=rows.find(p=>p.manufacturer===maker&&p.internalReference&&p.internalPrice>0);
    const parent={...source,id:maker,roomId:'r',quantity:2,price:source.totalPrice,catalogPrice:source.totalPrice};
    const lookup=p=>by.get(index.key(p)),make=(p,roomId,accessoryFor)=>({...p,id:maker+'-body',roomId,accessoryFor});
    const result=rough.reconcile([parent],lookup,make);assert.equal(result.records.length,2,maker);
    assert.equal(result.records[1].reference,source.internalReference);assert.equal(result.records[1].quantity,2);
    assert(Math.abs(result.records.reduce((sum,p)=>sum+p.price,0)-source.totalPrice)<.01,maker);
    assert.equal(rough.reconcile(result.records,lookup,make).changed,false);
  }
});
test('version runtime unique sur interface, API, manifests et service worker',async()=>{
  const express=require('express'),app=express(),version=require('../package.json').version;
  require('../assets-server')(app);
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    for(const route of ['/api/version','/api/health','/api/health/memory','/catalog_manifest.json','/manufacturers_manifest.json'])assert.equal((await fetch(base+route).then(r=>r.json())).version,version,route);
    for(const route of ['/','/index.html','/runtime-config.js','/sw.js']){const text=await fetch(base+route).then(r=>r.text());assert(text.includes(version),route);assert(!text.includes('__APP_VERSION__'),route);}
    const image=await fetch(base+'/images/RE026.jpg');assert.equal(image.status,200);assert(image.headers.get('content-type').includes('image/jpeg'));assert((await image.arrayBuffer()).byteLength>1000);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
