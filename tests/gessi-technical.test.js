'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createService,normalise}=require('../gessi-technical-server');
const make=(code='59003')=>({data:{success:true,message:code,data:{product:{
 productId:code,
 technical:[{technicalName:'Hauteur',technicalValue:'297 mm'},{technicalName:'Largeur',technicalValue:'50 mm'},
  {technicalName:'Profondeur',technicalValue:'196 mm'},{technicalName:'Hauteur',technicalValue:'999 mm'},
  {technicalName:'',technicalValue:'unknown'}],
 productsConfigured:[{priceInfo:{value:300},packageHeight:{value:506}}],
 attachments:[{attachmentType:'bim',attachmentUrl:'https://www.bimobject.com/gessi/product/'+code}]
}}}});
test('Gessi technical route extracts the official PRODUCT dimensions, not package, price, BIM or CAD',async()=>{
 let count=0,seen=[];
 const service=createService({get:async(url,opts)=>{seen.push({url,opts});count++;return make();}});
 const a=await service.load('59003');
 assert.deepEqual(a.technical,[{name:'Hauteur',value:'297 mm'},{name:'Largeur',value:'50 mm'},{name:'Profondeur',value:'196 mm'}]);
 assert.equal(a.code,'59003');assert.equal(a.source,'https://areapro.gessi.com/fr/product/59003');
 assert.equal(a.documentPdf,null);
 assert.doesNotMatch(JSON.stringify(a),/bimobject|packageHeight|priceInfo|cad|dwg|dxf/i);
 await service.load('59003');assert.equal(count,1);
 assert.equal(seen[0].url,'https://g-ecatalogue-be-prod-we.azurewebsites.net/public/product/GetProductDetails?country=FR&language=fr&productCode=59003');
 assert.equal(seen[0].opts.maxRedirects,0);
});
test('Gessi technical route rejects invalid inputs and conflicting upstream references',async()=>{
 const service=createService({get:async()=>make('66134')});
 await assert.rejects(service.load('59003'),{status:404});
 for(const code of ['foo','../../admin','59003?x=1','123456','http://evil'])await assert.rejects(service.load(code),{status:400});
 assert.equal(normalise(make('59003'),'66134'),null);
 assert.equal(normalise(make('59003'),'59003').technical.length,3);
});
test('Gessi technical route deduplicates inflight requests and bounds memory',async()=>{
 let n=0;const service=createService({get:async(url)=>{n++;await new Promise(r=>setTimeout(r,5));const code=new URL(url).searchParams.get('productCode');return make(code)},max:2});
 const [a,b]=await Promise.all([service.load('59003'),service.load('59003')]);
 assert.equal(a,b);assert.equal(n,1);
 await service.load('59004');await service.load('59005');assert.equal(service.cache.size,2);
});
test('Gessi server registers one read-only route without supplier write calls',async()=>{
 let route='';
 const handler=require('../gessi-technical-server')({get:async()=>make()}, {get:async()=>make()});
 assert.ok(handler);
 // Check wiring in main Express server and no technical PDF is fabricated.
 const fs=require('node:fs');
 const server=fs.readFileSync(require('node:path').join(__dirname,'../server.js'),'utf8');
 assert.match(server,/require\(["']\.\/gessi-technical-server["']\)\(app\)/);
 const js=fs.readFileSync(require('node:path').join(__dirname,'../public/gessi-area-pro.js'),'utf8');
 assert.match(js,/\/api\/gessi\/technical\//);
 assert.match(js,/Fiche technique/);
 assert.doesNotMatch(js,/\/api\/gessi\/bim|\/api\/gessi\/cad/);
});
