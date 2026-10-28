'use strict';
// Audit local declarations and photo-to-reference mappings, not remote HTTP availability.
// Usage: node tests/manufacturer-image-audit.js  (also run by npm test)
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const assert=require('node:assert/strict'),test=require('node:test');
const PUBLIC=path.join(__dirname,'../public');
const read=file=>JSON.parse(fs.readFileSync(path.join(PUBLIC,file),'utf8'));
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
function modelBase(p){
 if(p.base)return String(p.base);
 const ref=String(p.reference||''),code=String(p.finishCode||'');
 if(code&&ref.endsWith('.'+code))return ref.slice(0,-code.length-1);
 return ref;
}
const usefulUrl=x=>/^(https:\/\/|\/(?!\/)|images\/)/i.test(String(x||''));
const packedAssets=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets_index.json'),'utf8'));
const manifest=read('catalog_manifest.json');
const guide=read('brand-guide-collections.json'),hot=read('brand-guide-hotbath-media.json'),sb=read('sbordoni/sbordoni-image-index.json'),gessi=read('gessi-area-pro-data.json');
const entries=new Map(),missed=new Map();
function observe(brand,p){
 const row=entries.get(brand)||{articles:0,declaredPhoto:0,localResolved:0,exactIndex:0,modelIndex:0,noDeclaredOrIndex:0,remoteDeclared:0,brokenLocal:0,sourceExamples:[]};
 row.articles++;
 const own=usefulUrl(p.image)?String(p.image):'';
 if(own)row.declaredPhoto++;
 const local=own&&own.startsWith('/')&&!own.startsWith('//')&& !own.startsWith('/api/');
 if(own&&own.startsWith('https://'))row.remoteDeclared++;
 let backed=false;
 if(local){
  backed=fs.existsSync(path.join(PUBLIC,own.slice(1)))||Boolean(packedAssets[own]);
  if(backed)row.localResolved++;else row.brokenLocal++;
 }else if(own.startsWith('/api/sbordoni-image')){
  const ref=new URL(own,'https://hydropolis.test').searchParams.get('ref');
  backed=Boolean(ref&&sb.items[ref]);
  if(backed)row.localResolved++;else row.brokenLocal++;
 }
 const key=norm(modelBase(p)),finish=String(p.finishCode||'').trim().toUpperCase();
 let exact=false,model=false;
 if(brand==='Zucchetti'||brand==='Lefroy Brooks'){
  exact=!!(finish&&guide.finishModels?.[brand]?.[key]?.[finish]);
  model=!!guide.models?.[brand]?.[key];
 }else if(brand==='Gessi'){
  exact=!!(finish&&gessi.exactFinishImages?.[modelBase(p)]?.[finish]);
 }else if(brand==='Hotbath'){
  const collections=String(p.collection||'').split('/').map(x=>x.trim());
  const dicts=collections.map(c=>Object.entries(hot.byCollection||{}).find(([name])=>norm(name)===norm(c))?.[1]||{});
  model=dicts.some(dict=>Object.keys(dict).some(x=>norm(x)===key&&usefulUrl(dict[x])));
 }
 if(exact)row.exactIndex++;
 if(model)row.modelIndex++;
 if(!own&&!exact&&!model){
  row.noDeclaredOrIndex++;
  if(row.sourceExamples.length<12)row.sourceExamples.push(p.reference);
 }
 entries.set(brand,row);
}
for(const spec of manifest.chunks){
 const file=spec.file;
 const content=fs.readFileSync(path.join(PUBLIC,file));
 let rows;
 try{rows=JSON.parse(file.endsWith('.gz')?zlib.gunzipSync(content).toString('utf8'):content.toString('utf8'))}
 catch(e){throw new Error(file+': '+e.message)}
 assert(Array.isArray(rows),file+' must be a list');
 for(const p of rows)observe(p.manufacturer||spec.label,p);
}
function decodeBrand(brand,partCount){
 const parts=Array.from({length:partCount},(_,i)=>fs.readFileSync(path.join(PUBLIC,'brand-data',brand+'-config-'+String(i+1).padStart(2,'0')+'.b64'),'utf8').trim()).join('');
 return JSON.parse(zlib.gunzipSync(Buffer.from(parts,'base64')).toString('utf8'));
}
const configured={};
for(const [brand,n] of [['Bette',3],['Hidrobox',1],['Carrodrain',1]]){
 const data=decodeBrand(brand.toLowerCase(),n),groups=data.groups||[];
 const variants=groups.flatMap(g=>g.variants||[]);
 const exact=variants.filter(p=>usefulUrl(p.image)).length;
 const representative=variants.filter(p=>!usefulUrl(p.image)&&groups.some(g=>g.variants?.includes(p)&&usefulUrl(g.image))).length;
 configured[brand]={groups:groups.length,variants:variants.length,groupNames:groups.map(g=>g.family||g.collection||g.model||g.id),declaredExact:exact,groupIllustrative:representative,missing:variants.length-exact-representative,samplesMissing:variants.filter(p=>!usefulUrl(p.image)&&!groups.some(g=>g.variants?.includes(p)&&usefulUrl(g.image))).slice(0,10).map(p=>p.reference)};
}
const report={method:'index-and-declaration-audit, NO REMOTE HTTP validation',supplierCatalogs:Object.fromEntries([...entries].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>[k,v])),configured,officialIndexes:{zucchettiModels:Object.keys(guide.models.Zucchetti||{}).length,lefroyModels:Object.keys(guide.models['Lefroy Brooks']||{}).length,lefroyExactFinishes:Object.values(guide.finishModels['Lefroy Brooks']||{}).reduce((n,x)=>n+Object.keys(x).length,0),hotbathHistoricallyMissing:Object.keys(hot.missingContemporaryCDN||{}).length,gessiExactFinishes:Object.values(gessi.exactFinishImages||{}).reduce((n,x)=>n+Object.keys(x).length,0)}};
if(require.main===module)console.log('PHOTO_AUDIT_JSON '+JSON.stringify(report));
test('manufacturer image audit keeps index and storage integrity',()=>{
 assert(manifest.chunks.length>30);
 assert(Object.keys(sb.items).length>=4500,'Sbordoni image tiles were unexpectedly removed');
 assert(Object.keys(guide.models.Zucchetti||{}).length>500);
 assert(report.configured.Bette.variants>0);
 assert(report.configured.Hidrobox.variants>0);
 assert(report.configured.Carrodrain.variants>0);
 assert(!entries.get('Sbordoni').brokenLocal,'Sbordoni rows point to absent crop URLs/files');
 assert.equal(entries.get('Recor').brokenLocal,0,'packed Recor photo assets must count as local');
});
test('Bette official pictures are exact-model scoped, never borrowed for another family',()=>{
 const vm=require('node:vm'),win={};
 vm.runInNewContext(fs.readFileSync(path.join(PUBLIC,'brand-configurators.js'),'utf8'),{window:win,Map,Uint8Array});
 const photo=win.HydroBrandCatalogs.verifiedModelPhoto;
 assert.match(photo('Bette','BetteOcean'),/^https:\/\/content\.my-bette\.com\/produkt_bilder\/BetteOcean-/);
 assert.match(photo('Bette','BetteStarlet I'),/^https:\/\/content\.my-bette\.com\/produkt_bilder\/BetteStarlet-I-/);
 assert.match(photo('Bette','BetteArt'),/\/BetteArt-134583\//);
 assert.match(photo('Bette','BetteLux'),/\/BetteLux-134554\//);
 assert.match(photo('Bette','BetteStarlet'),/\/BetteStarlet-133350\//);
 assert.equal(photo('Bette','BetteArt IV'),'');
 assert.equal(photo('Bette','BetteLux Oval'),'');
 assert.equal(photo('Bette','BetteStarlet Oval'),'');
  assert.equal(photo('Bette','BetteOcean Low-Line'),'');
 assert.equal(photo('Bette','BetteStarlet I Silhouette'),'');
 assert.equal(photo('Hidrobox','Neo Plus'),'');
 const media=win.HydroBrandCatalogs.mediaFor('Bette',{}, {family:'BetteOcean'}, {reference:'8858'});
 assert.equal(media.image,'');
 assert.equal(media.representativeImage,photo('Bette','BetteOcean'));
 assert.equal(win.HydroBrandCatalogs.mediaFor('Bette',{}, {family:'BetteOcean Low-Line'}, {reference:'TEST'}).representativeImage,'');
});
module.exports={report};
