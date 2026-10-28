'use strict';
// Official Gessi catalogue discovery. Never infer prices or PDF links from this feed.
const menu=require('./public/gessi-area-pro-menu.json');
const ORIGIN='https://g-ecatalogue-be-prod-we.azurewebsites.net';
const SOURCE='https://areapro.gessi.com/fr/product/';
const IMAGE_HOSTS=new Set(['gessistorage.blob.core.windows.net','gessistorage.azureedge.net']);
const clean=v=>String(v??'').trim().slice(0,240);
function officialImage(v){
 try{const url=new URL(String(v||''));return url.protocol==='https:'&&IMAGE_HOSTS.has(url.hostname)?url.href:''}
 catch{return ''}
}
function resolveSelection({area,collection,serie}={}){
 const a=menu.areas.find(x=>x.id===area);if(!a)return null;
 const c=a.collections.find(x=>x.id===collection);if(!c)return null;
 const s=serie?c.series.find(x=>x.id===serie):null;
 if(serie&&!s)return null;
 return {area:a,collection:c,series:s};
}
function normaliseProduct(item){
 const code=clean(item?.productId);
 if(!/^\d{5}$/.test(code))return null;
 const images=item.productsConfigured||[];
 const finishes=[],seen=new Set();
 for(const entry of (Array.isArray(images)?images:[]).slice(0,120)){
  const finish=clean(entry?.finiture?.finitureId);
  const version=clean(entry?.version);
  const key=finish+'|'+version;
  if(!/^\d{3}$/.test(finish)||seen.has(key))continue;
  seen.add(key);
  finishes.push({code:finish,name:clean(entry.finiture.finitureName),version,
   image:officialImage(entry.specificFeatureProductImg||entry.specificFeatureProductImgCDN),
   swatch:officialImage(entry.finiture.finitureImage)});
 }
 const type=Array.isArray(item.productTags)?item.productTags.find(x=>x.tagName==='TIPO_PRODOTTO')?.tagValue:'';
 return {code,name:clean(item?.productName),description:clean(item?.productDescription),
  type:clean(type),image:officialImage(item?.productMainImage||item?.productMainImageCDN),
  page:SOURCE+code,finishes};
}
function normaliseResponse(raw,selection){
 if(raw?.success!==true||!Array.isArray(raw?.data?.products))throw Error('Invalid Gessi product list');
 const products=raw.data.products.map(normaliseProduct).filter(Boolean);
 const reported=Number(raw.data.totCount);
 const total=Number.isSafeInteger(reported)&&reported>=0?reported:products.length;
 return {source:'Gessi Area Pro officiel',area:selection.area.name,collection:selection.collection.name,
  series:selection.series?.name||null,products,total,returned:products.length,
  incomplete:total>products.length||Boolean(raw.data.nextPageToken),
  // No price: even when the supplier returns priceInfo it is NOT the Hydropolis tariff.
  pricing:'hydropolis-only',nextPageToken:raw.data.nextPageToken?true:false};
}
function createService({request=globalThis.fetch,now=()=>Date.now(),ttl=600000}={}){
 const cache=new Map();
 async function load(input={}){
  const selection=resolveSelection(input);if(!selection)throw Object.assign(Error('Unknown Gessi collection or series'),{status:400});
  const key=[selection.area.id,selection.collection.id,selection.series?.id||''].join('/');
  const stored=cache.get(key);if(stored&&now()-stored.at<ttl)return stored.value;
  const q=new URLSearchParams({country:'FR',language:'fr',collection:selection.collection.id,
   ambient:selection.area.officialId,page:'1'});
  if(selection.series)q.set('serie',selection.series.id);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  let raw;
  try{
   const response=await request(ORIGIN+'/public/product/GetProductList?'+q,{signal:controller.signal,
    headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Gessi HTTP '+response.status);
   const len=Number(response.headers?.get?.('content-length'));
   if(Number.isFinite(len)&&len>12000000)throw Error('Gessi response too large');
   const body=await response.text();
   if(body.length>12000000)throw Error('Gessi response too large');
   raw=JSON.parse(body);
  }finally{clearTimeout(timer)}
  const value=normaliseResponse(raw,selection);
  if(cache.size>=60)cache.delete(cache.keys().next().value);
  cache.set(key,{at:now(),value});
  return value;
 }
 return {load};
}
function register(app){
 const service=createService();
 app.get('/api/gessi/official-products',async(req,res)=>{
  try{res.json(await service.load(req.query))}
  catch(error){res.status(error.status||502).json({error:error.status===400?'Collection Gessi inconnue':'Catalogue Gessi indisponible'})}
 });
}
module.exports=Object.assign(register,{createService,normaliseProduct,normaliseResponse,resolveSelection,officialImage});
