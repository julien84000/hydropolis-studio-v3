'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const rows=require('../public/catalog_galassia.json');
const official=require('../public/galassia/official-tree.json');
const tree=require('../public/galassia-tree');
test('Galassia: official manufacturer order and 17 distinct collections, not guessed catalogue headings',()=>{
 const cols=tree.collections(official);
 assert.equal(cols.length,17);
 assert.deepEqual(cols.map(x=>x.name),['T65','R70','SUSI','Nextnarrow','Next','Lola','Core','Core Freestanding','Tabulae','Meg11 Pro','Dream','Hygea','SmartB','M2','Eden','Ethos','Folia']);
 assert.equal(new Set(cols.map(x=>x.slug)).size,17);
 assert.notEqual(tree.collectionFor(official,'next').slug,tree.collectionFor(official,'next-narrow').slug);
 assert.notEqual(tree.collectionFor(official,'core').slug,tree.collectionFor(official,'core-freestanding').slug);
});
test('Galassia: preserve original family labels, group order and source model membership',()=>{
 const r70=tree.collectionFor(official,'r70');
 assert.deepEqual(r70.groups.map(g=>g.name),['LAVABI','Mobili','ACCESSORI']);
 assert.deepEqual(r70.groups[0].items.map(x=>x.base),['7701SF','7701']);
 const susi=tree.collectionFor(official,'susi');
 assert.deepEqual(susi.groups.map(g=>g.name),['Sanitari a terra','Sanitari sospesi','Vasche']);
 assert.deepEqual(susi.groups.flatMap(g=>g.items.map(x=>x.base)),['7811','7812','7813','7814','1220']);
 const meg=tree.collectionFor(official,'meg11');
 assert.deepEqual(meg.groups.map(g=>g.name),['Lavabi appoggio sospesi','STRUTTURE','LAVATOI','LAVABI INCASSO','MONOLITE','SANITARI SOSPESI','SANITARI A TERRA','Monoblocco','Orinatoi','Vasche']);
 assert(meg.groups.find(g=>g.name==='LAVABI INCASSO').items.length===0,'Do not invent missing products for an empty official family');
});
test('Galassia: subgroup displays only correctly classified product models, one price per exact SKU',()=>{
 const r70=tree.collectionFor(official,'r70');
 const lavabi=tree.familySections(official,r70,rows).find(x=>x.name==='LAVABI');
 const models=tree.models(official,r70,lavabi,rows);
 assert.equal(models.length,2);
 const withTap=models.find(m=>m.base==='7701');
 const withoutTap=models.find(m=>m.base==='7701SF');
 assert(withTap.variants.some(v=>v.reference==='7701MT'&&v.price===585));
 assert(withoutTap.variants.some(v=>v.reference==='7701SFMT'&&v.price===585));
 assert(!withoutTap.variants.some(v=>v.reference==='7701MT'));
 assert(withTap.variants.every(v=>v.manufacturerFamily==='LAVABI'&&v.collection==='R70'));
});
test('Galassia: 619 individually linked references, 471 visibly separated, no guessed maker groups',()=>{
 const data=tree.coverage(official,rows);
 assert.equal(data.collections,17);
 assert.equal(data.sections,69);
 assert.equal(data.matched,619);
 assert.equal(data.unmatched,471);
 assert.equal(data.matched+data.unmatched,rows.length);
 const unclassified=tree.unmatchedRows(rows);
 assert(unclassified.every(x=>!x.manufacturerFamily||!x.officialStructureVerified));
 assert(rows.filter(x=>x.officialStructureVerified).every(x=>Boolean(x.manufacturerFamily)&&Boolean(x.manufacturerCollectionSlug)));
});
test('Galassia: an official product without a verified tariff remains visible but cannot be added or priced',()=>{
 const c=tree.collectionFor(official,'meg11');
 const group=tree.familySections(official,c,rows).find(g=>g.name==='STRUTTURE');
 assert(group);
 const models=tree.models(official,c,group,rows);
 assert.equal(models.length,2);
 assert(models.every(x=>x.name&&x.url.startsWith('https://www.ceramicagalassia.it/catalogo/')));
 assert(models.every(x=>Array.isArray(x.variants)));
});
test('Galassia: manufacturer families are loaded before the configurator, without modifying other brands',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 const a=html.indexOf('galassia-tree.js'),b=html.indexOf('galassia-configurator.js');
 assert(a>0&&b>a);
 const js=fs.readFileSync(path.join(__dirname,'../public/galassia-configurator.js'),'utf8');
 assert(js.includes('galassia-subfamilies'));
 assert(js.includes('Rubrique à rapprocher'));
 assert(js.includes('Modèle officiel · aucun prix importé'));
 assert(js.includes('Prix public HT'));
 assert(js.includes('Remise d’achat fournisseur'));
 const all=require('../public/catalog_manifest.json');
 assert(all.chunks.some(chunk=>chunk.file==='catalog_galassia.json'&&chunk.count===1090));
});
