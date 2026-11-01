'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../public');
const rows=require('../public/catalog_catalano.json');
const accessories=require('../public/catalano-accessories.js');
const config=require('../public/catalano-configurator.js');
const gallery=require('../public/catalano-gallery.js');
const get=ref=>rows.find(p=>p.reference===ref);

test('Catalano PRICE LIST 57 is preserved: 1430 references, source prices and distinct supplier collection',()=>{
 assert.equal(rows.length,1430);
 assert.equal(new Set(rows.map(p=>p.reference)).size,rows.length);
 assert.equal(config.groupCollections(rows).length,14);
 assert.equal(config.groupCollections(rows).includes('Zero'),true);
 assert.equal(rows.filter(p=>p.manufacturer==='Catalano').length,1430);
 assert.equal(config.eligible(get('0111460001')),true);
 assert.equal(config.eligible({...get('0111460001'),price:0}),false);
});
test('Zero 46 wall-hung WC gets an exact Zero seat and manufacturer hidden fixing kit',()=>{
 const wc=get('0111460001');assert.equal(accessories.kind(wc),'wc');
 const r=accessories.compatible(wc,rows);
 assert.equal(r.groups.length,2);
 const seat=r.groups.find(x=>x.id==='seat'),kit=r.groups.find(x=>x.id==='mount');
 assert(seat.options.some(p=>p.reference==='0151200001'),'Zero 46 specific seat');
 assert.equal(seat.suggested,'0151200001');
 assert.equal(kit.suggested,'9056060000');
 assert.equal(get(kit.suggested).price,22);
 assert.equal(get(seat.suggested).price,153);
 assert(r.groups.every(x=>x.options.every(p=>p.category==='Accessoires'&&p.price>0)));
});
test('Zero 55 satin/Up-fix WC only offers genuine matching suffix and 905616 mounting kit',()=>{
 const wc=get('0111750021'),r=accessories.compatible(wc,rows);
 assert.equal(r.kind,'wc');
 const seat=r.groups.find(x=>x.id==='seat'),kit=r.groups.find(x=>x.id==='mount');
 assert.equal(kit.suggested,'9056160000');
 assert(seat.options.length>0);
 assert(seat.options.some(p=>p.reference==='0551250021'));
 assert(seat.options.every(p=>p.finishCode==='0021'),'Never swap colour 0021 for another finish');
 assert(!seat.options.some(p=>p.reference==='0551200001'),'White seat not compatible with satin WC');
 assert(!kit.options.some(p=>p.reference==='9056070000'),'No floor fixing for wall-hung WC');
});
test('Wall-hung Elice Up-fix and floorstanding Elice use distinct fixing menus, not invented SKUs',()=>{
 const wall=accessories.compatible(get('0411540021'),rows);
 assert(wall.groups.find(g=>g.id==='seat').options.some(x=>x.reference==='0451250021'));
 assert.equal(wall.groups.find(g=>g.id==='mount').suggested,'9056160000');
 const floor=accessories.compatible(get('0414540021'),rows);
 assert.equal(floor.groups.find(g=>g.id==='mount').suggested,'','Floor fitting cannot be guessed without the installation note');
 assert.deepEqual(floor.groups.find(g=>g.id==='mount').options.map(x=>x.reference),['9056080000','9056070000']);
 assert.equal(floor.groups.find(g=>g.id==='seat').suggested,'0451250021');
});
test('Specific manufacturer WC seat references are proposed for Sfera 63, Alvea, Italy and Comfort',()=>{
 for(const [wc,seat] of [['0515630001','0551210001'],['0611530001','0651100001'],
  ['0711520001','0751100001'],['0911700001','0951500001']]){
  const x=accessories.compatible(get(wc),rows);
  assert(x.groups.find(g=>g.id==='seat').options.some(y=>y.reference===seat),wc+' seat '+seat);
 }
});
test('Bidets, seat sets and flush cisterns are not configured as WCs',()=>{
 for(const id of ['0118501001','0151200001','0533010001','9056160000']){
  const item=get(id);assert(item,'Missing manufacturer SKU '+id);
  assert.notEqual(accessories.kind(item),'wc',id);
  assert.equal(accessories.compatible(item,rows).groups.length,0,id);
 }
});
test('No accessory may be invented from a similar description or a mismatched finish',()=>{
 const fake={...get('0551250021'),price:0,reference:'0551259999'};
 const extra=accessories.compatible(get('0111750021'),[...rows,fake]);
 assert(!extra.groups.some(g=>g.options.some(x=>x.reference===fake.reference)));
 const wrong={...get('0111750021'),finishCode:'9999',reference:'0111759999'};
 const unknown=accessories.compatible(wrong,rows);
 assert.equal(unknown.groups.find(g=>g.id==='seat').options.length,0);
 assert.equal(unknown.groups.find(g=>g.id==='seat').suggested,'');
});
test('Catalano model selector keeps real manufacturer base + finish, preserves collection and category',()=>{
 const zero=rows.filter(x=>x.collection==='Zero');
 const grouped=config.modelCards(zero,'Zero','WC','55');
 assert(grouped.length>0);
 assert(grouped.every(p=>p.collection==='Zero'&&p.category==='WC'));
 const selected=get('0111750001');
 assert.equal(config.variantsFor(rows,selected).length,5);
 assert(config.variantsFor(rows,selected).every(x=>x.base==='011175'));
});
test('Collection gallery only uses manufacturer URLs and never mislabels a collection as an exact SKU photo',()=>{
 for(const name of ['Zero','Sfera','Elice','Premium','Alvea','Italy','Comfort']){
  const item=gallery.family(name);
  assert(item&&gallery.verifiedPhoto(item.image),name);
  assert.equal(item.scope,'collection',name);
 }
 assert.equal(gallery.family('Accessori Vari'),null);
 assert.equal(gallery.verifiedPhoto('https://evil.example/image.webp'),false);
 const p={...get('0111460001'),image:''};
 const image=config.imageFor(p,()=>null);
 assert.equal(image.scope,'collection');
 assert.equal(image.src,gallery.family('Zero').image);
});
test('Hydropolis hooks offer both direct internal launchers and save Catalano seat/kit linked to WC',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),css=fs.readFileSync(path.join(root,'catalano-configurator.css'),'utf8');
 assert.match(app,/bette-direct-open/);
 assert.match(app,/catalano-open/);
 assert.match(app,/HydroBetteConfigurator\?\.open\?\.\(\{manufacturer:"Bette"\}/);
 assert.match(app,/launchCatalanoConfigurator\(null/);
 assert.match(app,/launchCatalanoConfigurator\(p,targetRoomId\)/);
 assert.match(app,/record\.accessoryFor=main\.id/);
 assert.match(app,/record\.catalanoLinkedAccessory=true/);
 assert.match(app,/commitSelectedRecords\(records\)/);
 for(const name of ['catalano-gallery.js','catalano-accessories.js','catalano-configurator.js','catalano-configurator.css']){
  assert(html.includes(name+'?v=__APP_VERSION__'));
  assert(sw.includes(name));
 }
 assert.match(css,/\.catalano-shell/);
 const builder=fs.readFileSync(path.join(root,'catalano-configurator.js'),'utf8');
 assert.match(builder,/galassia-modal catalano-modal/);
 assert.match(builder,/data-catalano-collection/);
 assert.match(builder,/data-catalano-category/);
 assert.match(builder,/data-catalano-model/);
 assert.match(builder,/data-accessory/);
});
