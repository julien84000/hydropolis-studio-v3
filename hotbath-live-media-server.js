'use strict';
/* Exact manufacturer model/finish photos from hotbath.com/fr-be/produit/.
 * Keep manufacturer tariff rows separate. Never reuse a photograph across model
 * codes. A photo of another finish is explicitly labelled "model" only.
 */
const axios=require('axios'),cheerio=require('cheerio');
const taxonomy=require('./public/brand-guide-hotbath-taxonomy.json');
const products=require('./public/catalog_hotbath.json');
const ORIGIN='https://hotbath.com';
const clean=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const SLUG={'Cobber X':'cobber-x','Guy':'guy','Ray':'ray'};
const COLLECTIONS=Object.keys(taxonomy.collections);
const VALID=new Map(COLLECTIONS.map(c=>[c,new Set(taxonomy.collections[c].flatMap(g=>g.refs).map(clean))]));
for(const p of products){
 if(p.manufacturer!=='Hotbath')continue;
 const base=clean(p.base);if(!base)continue;
 for(const c of String(p.collection||'').split('/')){
  const name=COLLECTIONS.find(x=>clean(x)===clean(c));
  if(name)VALID.get(name).add(base);
 }
}
function permitted(collection,model,finish=''){
 return VALID.has(collection)&&/^[A-Z0-9-]{2,30}$/i.test(String(model))&&
 VALID.get(collection).has(clean(model))&&
 (!finish||/^[A-Z0-9]{1,5}$/i.test(String(finish)));
}
function productUrl(collection,model,finish=''){
 const col=SLUG[collection]||collection.toLowerCase().replace(/[^a-z0-9]+/g,'-');
 return ORIGIN+'/fr-be/produit/'+col+'-'+String(model).toLowerCase()+'/'+(finish?String(finish).toLowerCase()+'/':'');
}
function trustedImage(source,model){
 try{
  const u=new URL(source,ORIGIN);
  if(u.protocol!=='https:'||u.hostname!=='hotbath.com'||!u.pathname.startsWith('/images/compano/'))return false;
  const a=u.pathname.match(/^\/images\/compano\/([^/]+)\/([^/?#]+)\.(?:png|jpe?g|webp)$/i);
  if(!a||clean(decodeURIComponent(a[1]))!==clean(model))return false;
  const filename=decodeURIComponent(a[2]).replace(/_\d+$/,'');
  return /^[a-z0-9-]+$/i.test(filename)&&clean(filename).startsWith(clean(model));
 }catch{return false}
}
function imageFinish(source,model){
 if(!trustedImage(source,model))return null;
 const filename=decodeURIComponent(new URL(source,ORIGIN).pathname.split('/').pop()).replace(/\.[^.]+$/,'').replace(/_\d+$/,'');
 const stem=clean(filename),base=clean(model);
 return stem.startsWith(base)?stem.slice(base.length):null;
}
function extract(html,{collection,model,finish='',url}){
 const $=cheerio.load(html);
 const heading=$('h1').map((_,el)=>$(el).text().replace(/\s+/g,' ').trim()).get().join(' ');
 const title=$('title').first().text();
 const expected=clean(model)+clean(finish);
 const titleCheck=clean(title+' '+heading);
 if(!titleCheck.includes(clean(model))||!titleCheck.includes(clean(collection)))return null;
 const sources=[];
 $('main img[src], main source[srcset], img[src*="/images/compano/"]').each((_,el)=>{
   const src=$(el).attr('src')||$(el).attr('srcset')?.split(',')[0]?.trim()?.split(/\s+/)[0]||'';
   if(trustedImage(src,model))sources.push(src);
 });
 const unique=[...new Set(sources)];
 const exact=unique.find(src=>imageFinish(src,model)===clean(finish));
 const approximate=unique.find(src=>imageFinish(src,model)!==null);
 const image=finish?exact||approximate:approximate;
 if(!image)return null;
 const discoveredFinish=imageFinish(image,model);
 // A finish-specific URL must actually exhibit the requested SKU in the
 // primary product image. Other finishes are only a model-level preview.
 const scope=finish&&titleCheck.includes(expected)&&discoveredFinish===clean(finish)?'exact':'model';
 return {image,scope,collection,model,finish:discoveredFinish||'',productUrl:url,
  source:'hotbath.com official product page; model identity and photo filename'};
}
function makeService({get=axios.get,now=Date.now}={}){
 const cache=new Map(),inflight=new Map();
 async function resolve(collection,model,finish=''){
  if(!permitted(collection,model,finish))throw new Error('Référence Hotbath inconnue');
  const key=collection+'|'+clean(model)+'|'+clean(finish),cached=cache.get(key);
  if(cached&&now()-cached.at<cached.ttl)return cached.value;
  if(inflight.has(key))return inflight.get(key);
  const task=(async()=>{
   // Manufacturer variants first; the base page is a valid model-only fallback.
   const urls=[productUrl(collection,model,finish),...(finish?[productUrl(collection,model)]:[])];
   let result=null;
   for(const url of [...new Set(urls)]){
    try{
     const response=await get(url,{timeout:8500,maxRedirects:2,maxContentLength:2*1024*1024,headers:{
      'User-Agent':'Mozilla/5.0','Accept':'text/html','Accept-Language':'fr-BE,fr;q=0.9'}});
     const html=String(response.data||'');
     if(html.length<250||html.length>2*1024*1024)continue;
     const candidate=extract(html,{collection,model,finish,url});
     if(candidate?.scope==='exact')return candidate;
     if(candidate&&!result)result=candidate;
    }catch(e){/* Missing/discontinued official product pages are expected. */}
   }
   return result;
  })();
  inflight.set(key,task);
  try{
   const value=await task;
   cache.set(key,{at:now(),ttl:value?4*3600*1000:10*60*1000,value});
   return value;
  }finally{inflight.delete(key)}
 }
 return {resolve};
}
function attach(app,{service=makeService()}={}){
 app.get('/api/hotbath-live-media',async(req,res)=>{
  const collection=String(req.query.collection||''),model=String(req.query.model||''),finish=String(req.query.finish||'');
  if(!permitted(collection,model,finish))return res.status(400).json({ok:false,error:'Référence non reconnue'});
  try{
   const match=await service.resolve(collection,model,finish);
   return res.set('Cache-Control','private,max-age=300').json({ok:true,...(match||{scope:'missing',image:'',model,collection})});
  }catch{return res.status(503).json({ok:false,error:'Images fabricant temporairement indisponibles'})}
 });
}
module.exports=attach;
Object.assign(module.exports,{clean,permitted,productUrl,trustedImage,imageFinish,extract,makeService,VALID});
