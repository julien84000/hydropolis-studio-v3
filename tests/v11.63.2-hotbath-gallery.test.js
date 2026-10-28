'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','public');
const taxonomy=JSON.parse(fs.readFileSync(path.join(root,'brand-guide-hotbath-taxonomy.json'),'utf8'));
const images=JSON.parse(fs.readFileSync(path.join(root,'brand-guide-hotbath-media.json'),'utf8'));
const clean=x=>String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,'');

test('Hotbath: 53 exact supplier galleries and 631 verified photos, no cross-collection substitution',()=>{
 const cats=Object.entries(taxonomy.collections);
 assert.equal(cats.length,12);
 assert.equal(cats.reduce((sum,[,rows])=>sum+rows.length,0),53);
 let count=0,total=0,missing=[];
 for(const [collection,rows]of cats){
  const refs=[...new Set(rows.flatMap(row=>row.refs.map(clean)))];
  const photos=new Map(Object.entries(images.byCollection[collection]||{}).map(([ref,url])=>[clean(ref),url]));
  for(const ref of refs){
   total++;
   const img=photos.get(ref);
   if(!img){missing.push(collection+':'+ref);continue}
   count++;
   assert.match(img,/^https:\/\/hotbath\.(?:it|com)\//,collection+':'+ref);
   assert(!/placeholder/i.test(img),collection+':'+ref);
  }
 }
 assert.equal(total,647);
 assert.equal(count,631);
 assert.equal(missing.length,16);
 assert.equal(Object.keys(images.officialHistoricalSources).length,367);
 for(const [id,spec]of Object.entries(images.officialHistoricalSources)){
   const [collection,ref]=id.split('|');
   assert.ok(taxonomy.collections[collection],id);
   const expected=clean(ref);
   const filename=decodeURIComponent(spec.verifiedImage.split('?')[0].split('/').at(-1)).split('_')[0].replace(/\.[^.]+$/,'');
   assert.equal(clean(filename),expected,id+' must match exact photo filename');
   assert.match(spec.page,/^https:\/\/hotbath\.it\/fr\/prods\//);
   assert.equal(images.byCollection[collection][ref],spec.verifiedImage);
   assert.equal(spec.match,'exact supplier filename');
 }
 console.log('HOTBATH_IMAGE_COVERAGE',JSON.stringify({verified:count,total,missing}));
});

test('Hotbath: product-grid styling matches supplier approach and does not impact other manufacturers',()=>{
 const js=fs.readFileSync(path.join(root,'hotbath-official-guide.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
 assert.match(js,/mg-overlay mg-hotbath-official/);
 assert.match(js,/pictured\+' photos \/ '\+filtered.length/);
 assert.match(css,/\.mg-hotbath-official \.mg-official-gallery \.mg-tile-meta/);
 assert.match(css,/\.mg-hotbath-official \.mg-official-gallery \.mg-tile-photo img/);
 assert.match(css,/position:static;display:flex;flex-direction:column/);
 assert.match(css,/object-fit:contain/);
 assert.doesNotMatch(css,/\.mg-official-gallery \.mg-tile\{[^}]*background:#fff/);
});

test('Hotbath official image selector accepts double slash from manufacturer and refuses unrelated models',()=>{
 const vm=require('node:vm'),win={HydroManufacturerGuide:{open:()=>{}}};
 const file=fs.readFileSync(path.join(root,'hotbath-official-guide.js'),'utf8');
 vm.runInNewContext(file,{window:win});
 const finder=win.HydroHotbathOfficialGuide.photo;
 const a=finder({base:'AR003'},'Archie',images);
 assert.match(a,/^https:\/\/hotbath\.it\/documents\/\/ProdCateg\/3522\/AR003_1_2023\.jpg/);
 assert.equal(finder({base:'AR003M'},'Archie',images),images.byCollection.Archie.AR003M);
 assert.equal(finder({base:'AR003'},'Cobber',images),'');
 assert.equal(finder({base:'AR999-UNKNOWN'},'Archie',images),'');
});
