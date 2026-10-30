'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const api=require('../public/galassia-accessories.js');
const tree=require('../public/galassia-tree.js');
const manufacturer=require('../public/galassia/official-tree.json');
const prices=require('../public/galassia/sanitary-accessory-prices.json');
const colors=require('../public/galassia/pricelist-core-next-colors.json');
const rows=api.makeRows(prices,[],manufacturer,colors);
const sku=s=>rows.find(p=>p.reference===s);
test('Galassia: model-specific verified finish/prices, never override source catalog pricing',()=>{
 const existing=[{manufacturer:'Galassia',reference:'2062MK',price:1001}];
 const seed=api.makeRows(prices,existing,manufacturer,colors);
 assert(!seed.some(p=>p.reference==='2062MK'));
 assert.equal(sku('2062MK').price,1124);
 assert.equal(sku('2063BM').price,1224);
 assert.equal(sku('2064NM').price,1363);
 assert.equal(sku('2085BM').price,1430);
 assert.equal(sku('2084MK').price,1639);
 assert.equal(sku('2083MK').price,1760);
 assert.equal(sku('7520RO').price,1209);
 assert.equal(sku('7533RO').price,1355);
 assert.equal(sku('7502NEMT').price,1020);
});
test('Galassia Core and Next: expose supplementary compatible models in their source tariff collections',()=>{
 const core=tree.collectionFor(manufacturer,'core');
 const group=tree.familySections(manufacturer,core,rows).find(x=>x.crossListed);
 assert(group);
 const models=tree.models(manufacturer,core,group,rows);
 assert(models.some(x=>x.base==='2083'&&x.variants.some(p=>p.reference==='2083BM')));
 assert(models.some(x=>x.base==='2096'&&x.variants.some(p=>p.reference==='2096')));
 const next=tree.collectionFor(manufacturer,'next');
 const nextFamily=tree.familySections(manufacturer,next,rows).find(x=>x.crossListed);
 assert(nextFamily);
 assert(tree.models(manufacturer,next,nextFamily,rows).some(x=>x.base==='7502'&&x.variants.some(p=>p.reference==='7502NEMT')));
 assert.equal(sku('2085BM').collection,'Tabulae');
});
test('WC Core: exact graphite seat, fixation stated separately and correct outlet',()=>{
 const wc={manufacturer:'Galassia',manufacturerCollection:'Core',base:'7353',reference:'7353NEMT',finishCode:'NEMT',productType:'Vaso sospeso'};
 const result=api.compatible(wc,rows);
 assert.equal(result.kind,'wc');
 assert.deepEqual(result.groups.find(g=>g.id==='seat').options.map(p=>p.reference),['7330NEMT']);
 assert(result.included.some(v=>v.includes('Fixation')));
 assert(result.groups.find(g=>g.id==='connection').options.some(p=>p.reference==='9053'&&p.price===20));
});
test('Bidet: graphite-matching ceramic click-clack waste plus optional separate bracket',()=>{
 const bidet={manufacturer:'Galassia',manufacturerCollection:'Core',base:'7354',reference:'7354NEMT',finishCode:'NEMT',productType:'Bidet sospeso'};
 const result=api.compatible(bidet,rows);
 assert.equal(result.kind,'bidet');
 assert.deepEqual(result.groups.find(g=>g.id==='drain').options.map(p=>p.reference),['9916NEMT']);
 assert.equal(result.groups.find(g=>g.id==='bracket').options[0].reference,'9051');
 assert(result.included.some(v=>v.includes('incluse')));
});
test('Urinal Core: actual catalogue drain, inlet pipe and fixing kit, correct PDF prices',()=>{
 const urinal={manufacturer:'Galassia',manufacturerCollection:'Core',base:'7380',reference:'7380MT',finishCode:'MT'};
 const {kind,groups}=api.compatible(urinal,rows);
 assert.equal(kind,'urinal');
 assert.deepEqual(groups.map(g=>g.options[0].reference),['9088','9087','9086']);
 assert.deepEqual(groups.map(g=>g.options[0].price),[32,82,36]);
});
test('Urinal Meg11 Pro: flush/fixing included, separate drain and siphon; Dream drain extra',()=>{
 const meg=api.compatible({manufacturer:'Galassia',manufacturerCollection:'Meg11 Pro',base:'5408',reference:'5408SB'},rows);
 assert.deepEqual(meg.groups.map(g=>g.options[0].reference),['6069','6059']);
 assert(meg.included.some(x=>x.includes('inclus')));
 const dream=api.compatible({manufacturer:'Galassia',manufacturerCollection:'Dream',base:'7116',reference:'7116'},rows);
 assert.deepEqual(dream.groups.map(g=>g.options[0].reference),['6069']);
 assert(dream.included.some(x=>x.includes('pas incluse')));
});
test('No invented equivalent when the same finish seat or bidet drain does not exist',()=>{
 const eth={manufacturer:'Galassia',manufacturerCollection:'Ethos',base:'8438M',reference:'8438MOC',finishCode:'OC'};
 const options=api.compatible(eth,rows);
 assert(!options.groups.some(g=>g.id==='seat'));
 const b=api.compatible({manufacturer:'Galassia',manufacturerCollection:'Core',base:'7354',reference:'7354OC',finishCode:'OC'},rows);
 assert(!b.groups.some(g=>g.id==='drain'));
 assert(b.included.some(x=>x.includes('non confirmée')));
});
test('Non-sanitary products cannot trigger WC accessory assumptions',()=>{
 const p={manufacturer:'Galassia',collection:'Core',base:'2062',reference:'2062MK',productType:'Mobile 30x46'};
 assert.equal(api.kind(p),'');
 assert.equal(api.compatible(p,rows).groups.length,0);
});
