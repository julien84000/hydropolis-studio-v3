'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.join(__dirname,'..','public');
const db=JSON.parse(fs.readFileSync(path.join(dir,'brand-guide-hotbath-taxonomy.json'),'utf8'));
const media=JSON.parse(fs.readFileSync(path.join(dir,'brand-guide-hotbath-media.json'),'utf8'));
function guide(){
 const win={HydroManufacturerGuide:{open:()=>{},isSupported:()=>true}};
 vm.runInNewContext(fs.readFileSync(path.join(dir,'hotbath-official-guide.js'),'utf8'),{window:win});
 return win.HydroHotbathOfficialGuide;
}
test('manufacturer Hotbath taxonomy contains all 12 official collections, 53 categories, 647 category-reference associations',()=>{
 const cats=Object.values(db.collections).flat();
 assert.equal(Object.keys(db.collections).length,12);
 assert.equal(cats.length,53);
 assert.equal(cats.reduce((n,x)=>n+x.refs.length,0),647);
 assert.ok(cats.every(x=>x.url.startsWith('https://hotbath.it/fr/prods/')&&x.refs.length>0));
 assert.ok(db.collections.Cobber.find(x=>x.label==='Robinets et mélangeurs').refs.includes('CB003C'));
 assert.ok(db.collections.Cobber.find(x=>x.label==='Robinets et mélangeurs').refs.includes('CB003MS'));
 assert.ok(db.collections.Cobber.find(x=>x.label==='Accessoires techniques').refs.includes('P031'));
 assert.ok(db.collections.Archie.find(x=>x.label==='Mitigeurs thermostatiques').refs.includes('AR088'));
});
test('Hotbath official guide uses matching exact base references, never copies a price to manufacturer-only products',()=>{
 const g=guide();
 const priced={manufacturer:'Hotbath',collection:'Cobber',category:'Bain',base:'CB003C',reference:'CB003C.BCP',finish:'Bronze',price:355,totalPrice:355};
 const alt={manufacturer:'Hotbath',collection:'Cobber',category:'Lavabo',base:'CB003C',reference:'CB003C.CR',finish:'Chrome',price:275,totalPrice:275};
 const elsewhere={manufacturer:'Hotbath',collection:'Archie',base:'AR003',reference:'AR003.CR',price:290,totalPrice:290};
 const group=g.tariffIndex([priced,alt,elsewhere]);
 const cats=g.categories('Cobber',db,group);
 const basin=cats.find(c=>c.label==='Robinets et mélangeurs');
 const models=g.officialModels('Cobber',basin,group);
 const listed=models.find(m=>m.base==='CB003C');
 assert.equal(listed.variants.length,2);
 assert.equal(listed.variants[0].reference,'CB003C.BCP');
 assert.equal(listed.variants[0].totalPrice,355);
 assert.equal(models.find(m=>m.base==='CB003S').variants.length,0);
 assert.equal(g.photo(listed,'Cobber',media).includes('/images/compano/CB003C/'),true);
 assert.equal(g.photo({base:'CB003S'},'Archie',media),'');
 assert.equal(g.modelKey({base:'CB003C',reference:'CB003C.BCP'}),'CB003C');
});
test('Hotbath model catalogue UI loads official taxonomy and hides adding unpriced articles',()=>{
 const index=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(dir,'sw.js'),'utf8');
 const source=fs.readFileSync(path.join(dir,'hotbath-official-guide.js'),'utf8');
 assert.match(index,/hotbath-official-guide\.js\?v=__APP_VERSION__/);
 assert.match(sw,/brand-guide-hotbath-taxonomy\.json/);
 assert.match(sw,/hotbath-official-guide\.js/);
 assert.match(source,/Tarif à importer/);
 assert.match(source,/Ajout indisponible/);
 assert.match(source,/mg-official-gallery/);
 assert.match(source,/data-priced/);
 assert.match(source,/originalOpen\(brand,rows,roomId,onAdd\)/);
});
