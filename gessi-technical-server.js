'use strict';
// Gessi Area Pro: official PRODUCT specifications only. Never return BIM/CAD resources,
// supplier prices, packaging dimensions or unverified PDFs.
const UPSTREAM='https://g-ecatalogue-be-prod-we.azurewebsites.net/public/product/GetProductDetails';
const VALID=/^\d{5}$/;
function normalise(raw,code){
 const payload=raw?.data&&raw.data.success!==undefined?raw.data:raw;
 if(payload?.success!==true||String(payload.message||'')!==code)return null;
 const product=payload.data?.product;
 if(!product||typeof product!=='object')return null;
 const official=String(product.productId||product.pimId||'');
 if(official&&official!==code)return null;
 const items=Array.isArray(product.technical)?product.technical:[];
 const seen=new Set(),technical=[];
 for(const item of items.slice(0,100)){
   const name=String(item?.technicalName||'').trim().slice(0,120);
   const value=String(item?.technicalValue||'').trim().slice(0,240);
   if(!name||!value||seen.has(name.toLocaleLowerCase('fr')))continue;
   seen.add(name.toLocaleLowerCase('fr'));
   technical.push({name,value});
 }
 return {code,technical,source:'https://areapro.gessi.com/fr/product/'+code,
   // A technical data record is NOT proof of a downloadable technical-sheet PDF.
   documentPdf:null,sourceKind:'official-product-details'};
}
function createService({get,clock=()=>Date.now(),max=240,ttlMs=12*60*60*1000}={}){
 if(typeof get!=='function')throw new TypeError('HTTP client requis');
 const cache=new Map(),inFlight=new Map();
 async function load(code){
  if(!VALID.test(String(code)))throw Object.assign(new Error('Référence Gessi invalide'),{status:400});
  const key=String(code),t=clock(),hit=cache.get(key);
  if(hit&&hit.expires>t){cache.delete(key);cache.set(key,hit);return hit.value;}
  if(inFlight.has(key))return inFlight.get(key);
  const request=(async()=>{
   const url=UPSTREAM+'?country=FR&language=fr&productCode='+key;
   const response=await get(url,{timeout:9000,maxRedirects:0,maxContentLength:1024*1024,
     headers:{Accept:'application/json'}});
   const result=normalise(response,key);
   if(!result)throw Object.assign(new Error('Fiche technique Gessi introuvable'),{status:404});
   cache.delete(key);cache.set(key,{value:result,expires:clock()+ttlMs});
   if(cache.size>max)cache.delete(cache.keys().next().value);
   return result;
  })();
  inFlight.set(key,request);
  try{return await request;}finally{inFlight.delete(key);}
 }
 return {load,normalise,cache};
}
function register(app,{get}={}){
 const httpGet=get||require('axios').get;
 const service=createService({get:httpGet});
 app.get('/api/gessi/technical/:code',async(req,res)=>{
  try{
   const sheet=await service.load(req.params.code);
   res.set('Cache-Control','public, max-age=3600, must-revalidate').json(sheet);
  }catch(error){
   const status=error.status===400?400:error.status===404?404:502;
   if(status===502)console.warn('[gessi-technical] official API unavailable:',error.message);
   res.status(status).json({error:status===400?'Référence invalide':status===404?'Fiche indisponible':'Service Gessi temporairement indisponible'});
  }
 });
 return service;
}
module.exports=register;
module.exports.createService=createService;
module.exports.normalise=normalise;
