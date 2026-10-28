'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.join(__dirname,'..','public');

function guide(){
 const window={};
 vm.runInNewContext(fs.readFileSync(path.join(dir,'manufacturer-guide.js'),'utf8'),{window});
 return window.HydroManufacturerGuide;
}

test('V11.63.3 Lefroy Brooks Classic: 24 official finish-specific photos match exact tariff SKUs',()=>{
 const media=JSON.parse(fs.readFileSync(path.join(dir,'brand-guide-collections.json'),'utf8'));
 // Lefroy Brooks is distributed as a flat JSON catalogue (not one of the
 // gzip-configurator matrices). The imported price list remains authoritative.
 const catalogue=JSON.parse(fs.readFileSync(path.join(dir,'catalog_lefroy_brooks.json'),'utf8'));
 const expected=['CL1220','WL9007','LB1230','CH1230','LB1224','WL1224'];
 const api=guide();
 assert.ok(Object.keys(media.finishModels['Lefroy Brooks']).length>=expected.length);
 for(const base of expected){
   const variants=catalogue.filter(row=>row.base===base);
   assert.equal(variants.length,4,base+' must have four imported tariff finishes');
   const supplierPage=media.modelPages['Lefroy Brooks'][base];
   assert.equal(supplierPage,'https://uk.lefroybrooks.com/classic-basin-taps/'+base.slice(0,2).toLowerCase()+'-'+base.slice(2));
   for(const finish of ['AG','CP','NK','PB']){
     const p=variants.find(x=>x.finishCode===finish);
     assert.ok(p,base+finish+' must remain in the price list');
     const exact=media.finishModels['Lefroy Brooks'][base][finish];
     assert.ok(exact.startsWith('https://images.squarespace-cdn.com/'),base+finish+' must be official media');
     const filename=decodeURIComponent(exact.split('/').pop().split('?')[0]).toUpperCase().replace(/[^A-Z0-9]/g,'');
     assert.equal(filename,'LEFROYBROOKS'+base+finish+'JPG','Photo file must identify the exact model and finish');
     const selected=api.findModelVisual('Lefroy Brooks',p,base,{collections:media,hotbath:{collections:{}}});
     assert.equal(selected.image,exact);
     assert.equal(selected.match,'exact');
     assert.equal(selected.caption.includes(finish),true);
     assert.ok(p.price>0,'existing supplier public price is unchanged');
   }
 }
});
