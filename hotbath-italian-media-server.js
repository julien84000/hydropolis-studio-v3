'use strict';
/* Manufacturer-photo validation for the Italian Hotbath product listing.
 * Published /documents/ProdCateg URLs may be HTTP 404. Never serve one to
 * the configurator until we have confirmed actual image bytes.
 */
const axios=require('axios');
const index=require('./public/hotbath-italian-product-media.json');
const clean=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
function lookup(collection,model){
 if(!Object.hasOwn(index.byCollection,collection))return null;
 const entry=index.byCollection[collection][model];
 if(!entry||!entry.image||!entry.officialProductPage)return null;
 const filename=decodeURIComponent(entry.image.split('/').pop()).toUpperCase();
 if(!filename.startsWith(String(model).toUpperCase()+'_')&&!filename.startsWith(String(model).toUpperCase()+'-')&&!filename.startsWith(String(model).toUpperCase()+'.'))return null;
 if(!/^https:\/\/(?:www\.)?hotbath\.it\/documents\/+ProdCateg\/\d+\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp)$/i.test(entry.image))return null;
 if(!/^https:\/\/(?:www\.)?hotbath\.it\/fr\/produits\/\d+\/[A-Za-z0-9-]+$/i.test(entry.officialProductPage))return null;
 if(clean(entry.officialProductPage.split('/').pop())!==clean(model))return null;
 return entry;
}
const validBytes=(bytes,mime)=>{
 if(!Buffer.isBuffer(bytes)||bytes.length<12)return false;
 if(mime.includes('jpeg')||mime.includes('jpg'))return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(mime.includes('png'))return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(mime.includes('webp'))return bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 return false;
};
function createService({get=axios.get,now=Date.now}={}){
 const cache=new Map(),pending=new Map();
 async function media(collection,model){
  const item=lookup(collection,model);
  if(!item)return null;
  const key=collection+'|'+model;
  const hit=cache.get(key);
  if(hit&&now()-hit.at<hit.ttl)return hit.value;
  if(pending.has(key))return pending.get(key);
  const promise=(async()=>{
   try{
    const response=await get(item.image,{
     timeout:6500,maxRedirects:1,responseType:'arraybuffer',maxContentLength:4*1024*1024,
     headers:{'Accept':'image/jpeg,image/png,image/webp'}
    });
    const url=new URL(response.request?.res?.responseUrl||item.image);
    if(!/^(?:www\.)?hotbath\.it$/i.test(url.hostname))return null;
    const mime=String(response.headers?.['content-type']||'').toLowerCase();
    const bytes=Buffer.from(response.data||[]);
    if(response.status!==200||!mime.startsWith('image/')||!validBytes(bytes,mime))return null;
    return {image:item.image,collection,model,scope:'model',source:'Hotbath Italie · photographie fabricant',
     productUrl:item.officialProductPage,verified:true};
   }catch{return null}
  })();
  pending.set(key,promise);
  try{const value=await promise;cache.set(key,{at:now(),ttl:value?6*3600*1000:15*60*1000,value});return value}
  finally{pending.delete(key)}
 }
 return {media};
}
function attach(app,{service=createService()}={}){
 app.get('/api/hotbath-italian-media',async(req,res)=>{
  const c=String(req.query.collection||''),m=String(req.query.model||'');
  if(!/^[A-Za-z0-9 -]{2,36}$/.test(c)||!/^[A-Za-z0-9-]{2,32}$/.test(m)||!lookup(c,m))
   return res.status(400).json({ok:false,error:'Référence italienne non répertoriée'});
  const data=await service.media(c,m);
  res.set('Cache-Control','private,max-age=300').json({ok:true,...(data||{collection:c,model:m,scope:'missing',image:''})});
 });
}
module.exports=attach;
Object.assign(module.exports,{lookup,validBytes,createService});
