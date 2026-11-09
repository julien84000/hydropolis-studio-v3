'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.resolve(__dirname,'../public'),read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const catalogue=read('catalog_lefroy_brooks.json'),index=read('lefroy-catalog-official-images.json');
const legacy=read('lefroy-general-official-media.json'),collections=read('brand-guide-collections.json');
const clean=v=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
test('Official Lefroy catalogue model galleries refer to the exact manufacturer model',()=>{
 const bases=new Set(catalogue.map(p=>clean(p.base)));
 assert.equal(catalogue.length,3397);
 assert.ok(Object.keys(index.models).length>=769);
 for(const [base,p] of Object.entries(index.models)){
  assert.ok(bases.has(base),'Unknown model '+base);
  assert.match(p.productUrl,/^https:\/\/uk\.lefroybrooks\.com\//);
  assert.equal(clean(p.productUrl.split('/').pop()),base);
  assert.match(p.image,/^https:\/\/images\.squarespace-cdn\.com\/content\/v1\//);
  assert.ok(clean(decodeURIComponent(p.image.split('/').pop())).includes(base),'Wrong image model '+base);
 }
 assert.ok([...bases].filter(base=>index.models[base]||legacy.models[base]||legacy.finishes[base]).length>=770);
});
test('Exact Lefroy finish thumbnails are attested by the manufacturer filename',()=>{
 let n=0;
 for(const [base,variants] of Object.entries(index.finishes)){
  assert.ok(index.models[base],'Orphan finish '+base);
  for(const [finish,url] of Object.entries(variants)){
   assert.ok(['AG','CP','NK','PB'].includes(finish));
   const filename=decodeURIComponent(url.split('/').pop().split('?')[0]);
   assert.match(url,/^https:\/\/images\.squarespace-cdn\.com\/content\/v1\//);
   assert.ok(clean(filename).includes(base),'Wrong finish model '+base);
   assert.ok(new RegExp('[-_]'+finish+'(?:[-_](?:CLOSED|OPEN))?\\.(?:jpe?g|png|webp)$','i').test(filename),'Wrong finish '+base+'/'+finish);
   n++;
  }
 }
 assert.ok(n>=662);
});
test('General Lefroy guide shows exact NK or transparently illustrative alternatives',()=>{
 const window={};
 vm.runInNewContext(fs.readFileSync(path.join(dir,'manufacturer-guide.js'),'utf8'),{window});
 const guide=window.HydroManufacturerGuide,media={collections,hotbath:{},lefroy:legacy,lefroyCatalogue:index};
 const nk=catalogue.find(x=>x.base==='BK4500'&&x.finishCode==='NK');
 const ag=catalogue.find(x=>x.base==='BK4500'&&x.finishCode==='AG');
 assert.ok(nk&&ag);
 const exact=guide.findModelVisual('Lefroy Brooks',nk,nk.base,media);
 assert.equal(exact.image,index.finishes.BK4500.NK);assert.equal(exact.match,'exact');
 const model=guide.findModelVisual('Lefroy Brooks',ag,ag.base,media);
 assert.equal(model.image,index.models.BK4500.image);assert.equal(model.match,'model');
 assert.match(model.caption,/finition illustrative/i);
 const tiles=guide.finishTiles('Lefroy Brooks',[nk,ag],nk.reference,nk.base,media);
 assert.match(tiles,/Lefroy-Brooks_BK-4500-NK\.jpg/);
 assert.match(tiles,/Finition à confirmer sur photo/);
 assert.equal(nk.price,catalogue.find(p=>p.reference===nk.reference).price);
});
