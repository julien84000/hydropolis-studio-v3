'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('../public/recor-official-media.json');
const attach=require('../recor-media-server.js');
const model=require('../public/recor-guided-model.js');

const entries=data.items;
test('Recor 2026 includes local verified source images for every official model and finish',()=>{
 const configured=[
  ...model.FAMILY_MODELS['Baignoires îlot'],
  ...model.FAMILY_MODELS['Baignoires sur pieds'],
  ...model.PREMIUM_FINISHES.map(x=>x.id),
  ...model.FAMILY_MODELS['Baignoires rectangulaires']
 ];
 assert.equal(configured.length,38);
 assert.equal(new Set(configured).size,38);
 assert.equal(Object.keys(entries).length,38);
 for(const code of configured){
  const item=entries[code];
  assert.ok(item,'Missing source photo '+code);
  assert.match(item.image,/^https:\/\/recor\.pt\/wp-content\/uploads\/\d{4}\/\d{2}\//);
  assert.match(item.thumbnail,/-300x(?:300|225)\.(jpg|png|webp)$/i);
  assert.equal(item.images[0],item.image);
  assert.ok(attach.allowedURL(item.image),'Invalid photo URL for '+code);
  assert.ok(attach.allowedURL(item.thumbnail),'Invalid thumbnail URL for '+code);
  assert.ok(attach.validModel(code),'Unsupported Recor model '+code);
  assert.match(item.productUrl,/^https:\/\/recor\.pt\/product\//);
 }
});

test('Recor image metadata resolves without contacting inaccessible manufacturer HTML',async()=>{
 let calls=0;
 const svc=attach.service({get:async()=>{calls++;throw Error('Network must not be touched')}});
 for(const code of ['SLIPPER','CAMILE','GIBSON','HAND-GILDED','NATURAL-RUSTIC','SHOWER-TRAYS']){
  const m=await svc.getMedia(code);
  assert.equal(m.model,code);
  assert.ok(m.images.length>=2);
  assert.equal(m.verifiedModel,true);
  assert.equal(m.productUrl,entries[code].productUrl);
 }
 assert.equal(calls,0);
});

test('Recor thumbnails return instant direct official redirects and full photo survives failed proxy',async()=>{
 const routes={};
 const app={get:(path,handler)=>{routes[path]=handler}};
 const svc={image:async()=>null,getMedia:async m=>entries[m]};
 attach(app,{mediaService:svc});
 const handler=routes['/api/recor-model-photo'];
 for(const [model,index,expected] of [
  ['SLIPPER',1,entries.SLIPPER.thumbnail],
  ['HAND-GILDED',1,entries['HAND-GILDED'].thumbnail],
  ['GIBSON',0,entries.GIBSON.image]
 ]){
  let status=null,target=null;
  await handler({query:{model,index:String(index)}},{
   redirect:(code,u)=>{status=code;target=u},
   status:(code)=>{status=code;return {end:()=>{}}},
   end:()=>{}
  });
  assert.equal(status,302);
  assert.equal(target,expected);
 }
});

test('Recor UI always provides a manufacturer image fallback when canvas cannot load',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const ui=fs.readFileSync(path.join(__dirname,'../public/recor-configurator.js'),'utf8');
 assert.match(ui,/recor-preview-fallback/);
 assert.match(ui,/if\(fallback\)fallback\.hidden=false/);
 assert.match(ui,/\&index=1/);
 assert.match(ui,/recor-model-visual/);
});
