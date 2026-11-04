'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const model=require('../public/lefroy-guided-model.js');
const catalog=require('../public/catalog_lefroy_brooks.json');
const root=path.join(__dirname,'..','public');
const dataFiles=[
  'lefroy-official-basin-sets-01.json',
  'lefroy-official-basin-sets-02.json',
  'lefroy-official-basin-sets-03.json',
  'lefroy-official-wc-sets.json',
  'lefroy-official-bidet-items.json'
];
const official=Object.assign({},...dataFiles.map(file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8')).records));
const BASE_CHOSEN={finish:'CP'};
test('all official sanitary families and 33 unique set pages are indexed',()=>{
 assert.equal(model.BASINS.length,21);
 assert.equal(model.WC.length,9);
 assert.equal(model.BIDETS.length,3);
 assert.equal(model.ALL.length,33);
 assert.equal(new Set(model.ALL.map(x=>x.slug)).size,33);
 for(const set of model.ALL){
   assert.ok(official[set.slug],'Missing official media index for '+set.slug);
   assert.ok(official[set.slug].url.startsWith('https://uk.lefroybrooks.com/'));
   assert.ok(official[set.slug].images.length>0,'Missing official product photo for '+set.slug);
 }
});
test('official media paths are genuine Squarespace CDN images, never generated URLs',()=>{
 for(const [slug,set] of Object.entries(official)){
  for(const img of set.images){
   assert.match(img.url,/^https:\/\/images\.squarespace-cdn\.com\/content\/v1\/.+/);
   assert.match(img.label,/Lefroy.Brooks/i,'Wrong media attribution for '+slug);
  }
 }
});
test('main catalog prices are preserved, with the 2026 source and existing discount',()=>{
 assert.equal(catalog.length,3397);
 const sample=catalog.find(x=>x.reference==='LB7207WH');
 assert.equal(sample.price,654);
 assert.match(sample.source,/2026/);
 assert.equal(sample.purchaseDiscount,55);
});
test('all 9 WC configurations include a separate priced pan and cistern',()=>{
 for(const set of model.WC){
  const assembly=model.assemble(catalog,set,BASE_CHOSEN);
  assert.ok(assembly.parts.some(x=>x.role==='Cuvette'&&x.item));
  assert.ok(assembly.parts.some(x=>x.role==='Réservoir'&&x.item));
  assert.ok(assembly.parts.some(x=>x.role==='Abattant'&&x.item));
  assert.equal(new Set(assembly.parts.filter(x=>x.item).map(x=>x.item.reference)).size,assembly.parts.filter(x=>x.item).length);
 }
});
test('Classic close coupled auto-adds exact 2026 double flush mechanism, seat and lever',()=>{
 const set=model.WC.find(x=>x.slug==='classic-close-coupled-lavatory');
 const parts=model.assemble(catalog,set,BASE_CHOSEN);
 assert.deepEqual(parts.missing,[]);
 assert.deepEqual(parts.parts.map(x=>x.item.reference),
  ['LB7207WH','LB7208WH','LB7299DF','LB7240CP','LB1307CP']);
 assert.equal(parts.total,654+455+133+579+147);
});
test('Classic high level requires flush pipe, brackets and pull chain (no lever double count)',()=>{
 const set=model.WC.find(x=>x.slug==='classic-high-level-lavatory');
 const parts=model.assemble(catalog,set,BASE_CHOSEN);
 assert.deepEqual(parts.missing,[]);
 assert.deepEqual(parts.parts.map(x=>x.role),
 ['Cuvette','Réservoir','Mécanisme de chasse','Tube de chasse','Supports du réservoir','Abattant','Chaîne et poignée de chasse']);
});
test('Belle Aire flush mechanism includes chrome lever, no second lever line',()=>{
 const set=model.WC.find(x=>x.slug==='belle-aire-close-coupled-lavatory');
 const parts=model.assemble(catalog,set,BASE_CHOSEN);
 assert.deepEqual(parts.missing,[]);
 assert.ok(parts.parts.find(x=>x.item?.reference==='LB7789'));
 assert.ok(!parts.parts.some(x=>x.role==='Commande de chasse'));
});
test('La Chapelle high level is blocked without missing 2026 tariff for LB7797',()=>{
 const set=model.WC.find(x=>x.slug==='la-chapelle-high-level-cistern-lavatory');
 const parts=model.assemble(catalog,set,BASE_CHOSEN);
 assert.deepEqual(parts.missing,['Mécanisme de chasse (LB7797)']);
});
test('Charterhouse wall mounted left hand is tariffed; corner and right-hand variants require verification',()=>{
 const left=model.BASINS.find(x=>x.slug==='charterhouse-wall-mounted-cloakroom-basin');
 assert.deepEqual(model.assemble(catalog,left,{basin:'LB7251L',finish:'CP'}).missing,[]);
 assert.deepEqual(model.assemble(catalog,left,{basin:'LB7251R',finish:'CP'}).missing,['Lavabo (LB7251R)']);
 const corner=model.BASINS.find(x=>x.slug==='charterhouse-corner-cloakroom-basin');
 assert.deepEqual(model.assemble(catalog,corner,{basin:'LB7262',finish:'CP'}).missing,['Lavabo (LB7262)']);
});
test('official but non-priced PPW040 waste cannot leak a fake price into a quote',()=>{
 const set=model.BASINS.find(x=>x.slug==='la-chapelle-standard-basin-with-pedestal-72-cm');
 const parts=model.assemble(catalog,set,{basin:'LB7701',finish:'CP',waste:'PPW040'});
 assert.ok(parts.missing.some(x=>x.includes('PPW040')));
 assert.ok(parts.total>0);
});
test('mandatory basins stand/columns are separately itemized and summated',()=>{
 for(const set of model.BASINS.filter(s=>s.support)){
  const chosen=set.basins.find(base=>model.variants(catalog,base).length)||set.basins[0];
  const parts=model.assemble(catalog,set,{basin:chosen,finish:'CP'});
  assert.deepEqual(parts.missing,[],set.slug+': '+parts.missing.join(', '));
  assert.equal(parts.parts.length,2,set.slug);
  assert.equal(parts.total,parts.parts[0].item.price+parts.parts[1].item.price);
 }
});
test('accessory selections never silently reuse a price for a different variant',()=>{
 const set=model.BASINS.find(s=>s.slug==='la-chapelle-narrow-basin-with-ball-jointed-stand-57-cm');
 const parts=model.assemble(catalog,set,{basin:'LB7721',finish:'AG'});
 assert.ok(parts.missing.some(x=>x.includes('LB3226')));
 assert.equal(parts.parts.filter(x=>x.item).length,1);
});
test('Lefroy frontend is loaded after the main app and without modifying other configurators',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(html.includes('lefroy-guided-model.js?v=__APP_VERSION__'));
 assert.ok(html.includes('lefroy-guided-configurator.js?v=__APP_VERSION__'));
 assert.ok(html.indexOf('app.js?v=__APP_VERSION__')<html.indexOf('lefroy-guided-model.js?v=__APP_VERSION__'));
 assert.ok(html.includes('lefroy-guided-configurator.css?v=__APP_VERSION__'));
});
