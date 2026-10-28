'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const g=require('../gessi-official-series-server');
const menu=require('../public/gessi-area-pro-menu.json');
const area=menu.areas.find(a=>a.id==='bathroom'),col=area.collections.find(c=>c.series.length),serie=col.series[0];
const input={area:area.id,collection:col.id,serie:serie.id};
const product={productId:'73651',productName:'Mitigeur lavabo',productDescription:'Inverso Diamantato',
 productMainImage:'https://gessistorage.blob.core.windows.net/zil/PF73651.jpg',
 productsConfigured:[{finiture:{finitureId:'726',finitureName:'WARM BRONZE',finitureImage:'https://gessistorage.azureedge.net/finiturethumb/726.jpg'},
 specificFeatureProductImg:'https://gessistorage.blob.core.windows.net/zi4/73651%23726.png',version:'G000',priceInfo:{value:9999}}],
 productTags:[{tagName:'TIPO_PRODOTTO',tagValue:'Mitigeur lavabo'}]};
test('Only official Area Pro ambient, collection and series IDs are accepted',()=>{
 assert.equal(g.resolveSelection(input).series.id,serie.id);
 assert.equal(g.resolveSelection({...input,serie:'UNKNOWN'}),null);
 assert.equal(g.resolveSelection({...input,collection:area.collections[0].id,serie:'UNKNOWN'}),null);
 assert.equal(g.resolveSelection({...input,area:'https://evil.test'}),null);
});
test('Official variants remain distinct and never expose a supplier price or invented PDF',()=>{
 const out=g.normaliseResponse({success:true,data:{products:[product],totCount:10,nextPageToken:'cursor'}},g.resolveSelection(input));
 assert.equal(out.products[0].code,'73651');assert.equal(out.products[0].finishes[0].code,'726');
 assert.equal(out.products[0].finishes[0].image,'https://gessistorage.blob.core.windows.net/zi4/73651%23726.png');
 assert.equal(out.incomplete,true);assert.equal(out.total,10);
 assert.equal(out.pricing,'hydropolis-only');
 assert.doesNotMatch(JSON.stringify(out),/9999|priceInfo|documentPdf|bimObject/i);
 assert.equal(g.officialImage('https://attacker.test/pic.png'),'');
});
test('Live catalogue route uses vetted supplier IDs, bounded cache and valid country',async()=>{
 let calls=0,lastUrl='';
 const service=g.createService({request:async url=>{calls++;lastUrl=url;
  return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify({success:true,data:{products:[product],totCount:1}})};},now:()=>42});
 const a=await service.load(input),b=await service.load(input);
 assert.equal(calls,1);assert.deepEqual(a,b);
 const u=new URL(lastUrl);assert.equal(u.hostname,'g-ecatalogue-be-prod-we.azurewebsites.net');
 assert.equal(u.searchParams.get('ambient'),area.officialId);
 assert.equal(u.searchParams.get('serie'),serie.id);
 assert.equal(u.searchParams.get('country'),'FR');
 await assert.rejects(()=>service.load({area:'wrong',collection:col.id}),/Unknown Gessi/);
});
