'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.join(__dirname,'..','public');

test('V11.63.5 manufacturer-photo expansion: 50 models, 200 exactly matched finish images',()=>{
 const media=JSON.parse(fs.readFileSync(path.join(dir,'brand-guide-collections.json'),'utf8'));
 const catalogue=JSON.parse(fs.readFileSync(path.join(dir,'catalog_lefroy_brooks.json'),'utf8'));
 const window={};
 vm.runInNewContext(fs.readFileSync(path.join(dir,'manufacturer-guide.js'),'utf8'),{window});
 const api=window.HydroManufacturerGuide;
 const photos=media.finishModels?.['Lefroy Brooks']||{};
 const urls=media.modelPages?.['Lefroy Brooks']||{};
 const models=Object.keys(photos);
 assert.equal(models.length,50,'Only fully evidenced product models should be in the validated finish gallery');
 const skuIndex=new Map();
 for(const item of catalogue){
  const key=item.base+'|'+item.finishCode;
  if(!skuIndex.has(key))skuIndex.set(key,item);
 }
 const uniquePhotos=new Set();let checked=0;
 for(const model of models){
   const finishImages=photos[model];
   const page=urls[model];
   assert.match(page,/^https:\/\/uk\.lefroybrooks\.com\/(?:classic-basin-taps|ten-ten-basin-taps)\/[a-z]{2}-\d+$/);
   assert.ok(page.endsWith(model.slice(0,2).toLowerCase()+'-'+model.slice(2)));
   assert.equal(Object.keys(finishImages).length,4,model+' photo coverage should be complete');
   for(const finish of ['AG','CP','NK','PB']){
     const row=skuIndex.get(model+'|'+finish);
     assert.ok(row,model+finish+' is not present in supplier price list');
     const image=finishImages[finish];
     assert.match(image,/^https:\/\/images\.squarespace-cdn\.com\//);
     const filename=decodeURIComponent(image.split('/').pop().split('?')[0]).toUpperCase().replace(/[^A-Z0-9]/g,'');
     const exact='LEFROYBROOKS'+model+finish;
     assert.ok(filename===exact+'JPG'||filename===exact+'CLOSEDJPG',model+finish+' filename does not identify the exact variant');
     assert.equal(uniquePhotos.has(image),false,'A photo must not be reused across different finishes');
     uniquePhotos.add(image);
     const out=api.findModelVisual('Lefroy Brooks',row,model,{collections:media,hotbath:{collections:{}}});
     assert.equal(out.image,image);
     assert.equal(out.match,'exact');
     assert.ok(Number(row.totalPrice??row.price)>0,'Price still comes from supplier tariff');
     checked++;
   }
 }
 assert.equal(checked,200);
 const byFamily=Object.entries(urls).reduce((acc,[model,url])=>{
  if(!photos[model])return acc;const family=url.includes('/ten-ten-')?'Ten Ten':'Classic';
  acc[family]=(acc[family]||0)+1;return acc;
 },{});
 assert.ok(byFamily.Classic>=40);
 assert.equal(byFamily['Ten Ten'],10);
});
