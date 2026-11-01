'use strict';
/* Source: Catalano official product cards. The tile attribute data-codes and
 * data-thumbs jointly bind a photograph to an exact manufacturer SKU.
 * No editorial images, type/collection guesswork or search-result photos.
 * An exact photo is never assigned to an unrelated model or finish.
 */
const axios=require('axios');
const cheerio=require('cheerio');
const path=require('path');
const fs=require('fs');
const ROOT='https://www.catalano.it';
// Catalano nests shower trays and bathtubs under a combined parent collection.
// The flat URLs imported from the price-list are NOT live collection pages.
const OFFICIAL_URLS={
 'H3 Ceramic':ROOT+'/en/all-collections/shower-trays-bathtubs/h3-ceramic/',
 'H3 Planar':ROOT+'/en/all-collections/shower-trays-bathtubs/h3-planar-ceramic/',
 'H3 Solid':ROOT+'/en/all-collections/shower-trays-bathtubs/h3-solid/',
 'H 4,5 Ceramic':ROOT+'/en/all-collections/shower-trays-bathtubs/shower-tray-h4-5/',
 'Vasca':ROOT+'/en/all-collections/shower-trays-bathtubs/solid-bathtubs/'
};
const PRODUCTS=JSON.parse(fs.readFileSync(path.join(__dirname,'public/catalog_catalano.json'),'utf8'));
const COLLECTIONS=Object.fromEntries([...new Set(PRODUCTS.map(x=>x.collection))].map(name=>{
 const p=PRODUCTS.find(x=>x.collection===name);
 const catalog=String(p.manufacturerUrl||'');
 return [name,OFFICIAL_URLS[name]||(catalog.startsWith(ROOT+'/en/all-collections/')?catalog:
  name==='Vasca'?ROOT+'/en/bathtubs/':
  name==='Accessori Vari'?ROOT+'/en/accessories/':'')];
}));
const BY_REF=new Map(PRODUCTS.map(p=>[p.reference,p]));
// Accessories and frames are listed by product type, not on the Sfera/Zero/etc.
// collection pages. Index these *official product grids* as supplementary
// sources and still require a literal SKU match in both card and photo URL.
const SUPPLEMENTARY_URLS={
 accessories:[
  ROOT+'/en/accessories/seats-and-covers/',
  ROOT+'/en/accessories/towel-rail/',
  ROOT+'/en/accessories/drains/',
  ROOT+'/en/accessories/various-accessories/'
 ],
 frames:[ROOT+'/en/structures/']
};
function supplementalSources(name){
 const rows=PRODUCTS.filter(p=>p.collection===name);
 if(!rows.some(p=>p.category==='Accessoires')&&name!=='Accessori Vari'&&name!=='Ceramic Top')return [];
 return [...SUPPLEMENTARY_URLS.accessories,...SUPPLEMENTARY_URLS.frames];
}
const TTL=6*60*60*1000;
const seeds={
 '0519501001':'https://www.catalano.it/wp-content/uploads/2025/03/SFERA_bidet_terra_50x35_0519501001-600x600.webp',
 '0519501021':'https://www.catalano.it/wp-content/uploads/2025/03/SFERA_bidet_terra_50x35_0519501021-600x600.webp',
 '0518501001':'https://www.catalano.it/wp-content/uploads/2025/03/SFERA_bidet_sospeso_50x35_0518501001-600x600.webp',
 '0511550001':'https://www.catalano.it/wp-content/uploads/2025/03/SFERA_wc_sospeso_55x35_0511550001-600x600.webp',
 '0511500001':'https://www.catalano.it/wp-content/uploads/2025/03/SFERA_wc_sospeso_50x35_0511500001-600x600.webp',
 '0511650001':'https://www.catalano.it/wp-content/uploads/2025/03/SFERA_wc_sospeso_55x35_0511650001-600x600.webp',
 '0515630001':'https://www.catalano.it/wp-content/uploads/2025/03/SFERA_wc_monoblocco_0515630001.webp',
 '0521260001':'https://www.catalano.it/wp-content/uploads/2025/03/SFERA_lavabo_sospeso_125x50_0521260001-600x600.webp',
 '0521010001':'https://www.catalano.it/wp-content/uploads/2025/03/SFERA_lavabo_sospeso_100x50_0521010001-600x600.webp',
 '0520760001':'https://www.catalano.it/wp-content/uploads/2025/03/SFERA_lavabo_sospeso_75x50_0520760001-600x600.webp',
 '0520610001':'https://www.catalano.it/wp-content/uploads/2025/03/SFERA_lavabo_sospeso_60x50_0520610001-600x600.webp',
 '0121522001':'https://www.catalano.it/wp-content/uploads/2025/02/ZERO_lavabo_sospeso_150x50_0121522001-600x600.webp',
 '0121272001':'https://www.catalano.it/wp-content/uploads/2025/03/ZERO_lavabo_sospeso_125x50_0121272001-600x600.webp',
 '0121261001':'https://www.catalano.it/wp-content/uploads/2025/03/ZERO_lavabo_sospeso_125x50_0121261001-600x600.webp',
 '0121011001':'https://www.catalano.it/wp-content/uploads/2025/03/ZERO_lavabo_sospeso_100x50_0121011001-600x600.webp',
 '0551200001':'https://www.catalano.it/wp-content/uploads/2025/03/SEDILE_SFERA_ZERO_soft_close_0551200001-600x600.webp',
 '9056080000':'https://www.catalano.it/wp-content/uploads/2025/04/KIT-fissaggio_sanitari-terra-9056080000-600x600.webp'
};
function allowedPhoto(url){
 try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='www.catalano.it'&&
 /^\/wp-content\/uploads\/\d{4}\/\d{2}\/[^?#]+\.(?:webp|png|jpe?g)$/i.test(u.pathname);}
 catch{return false;}
}
function photoReference(url){
 if(!allowedPhoto(url))return '';
 const name=decodeURIComponent(new URL(url).pathname.split('/').pop()||'').replace(/-\d{2,4}x\d{2,4}(?=\.)/,'');
 const normal=name.match(/(?:^|[_-])(\d{10})(?=\.(?:webp|png|jpe?g)$)/i);
 if(normal)return normal[1];
 const dashed=name.match(/(?:^|[_-])(\d{2})-(\d{4})-(\d{4})(?=\.(?:webp|png|jpe?g)$)/i);
 return dashed?dashed[1]+dashed[2]+dashed[3]:'';
}
function parseCollection(html,collection){
 const exact={},models={};
 const $=cheerio.load(html);
 $('.products-grid-item').each((_,node)=>{
  const box=$(node),codes=String(box.attr('data-codes')||'').split(',').map(x=>x.replace(/\D/g,'')).filter(x=>x.length===10);
  const href=box.find('a[href*="/en/products/"]').first().attr('href')||'';
  const thumb=box.find('.product-thumb').first();
  let variants=[];try{variants=JSON.parse(thumb.attr('data-thumbs')||'[]')}catch{}
  // Official static tiles sometimes expose only the reference-stamped default
  // product image; the same SKU-on-card AND SKU-in-filename check applies.
  if(!variants.length){
   const fallback=thumb.attr('data-default-thumb')||thumb.find('img').first().attr('data-src')||thumb.find('img').first().attr('src')||'';
   if(fallback)variants=[{image_url:fallback}];
  }
  if(!variants.length)return;
  if(!href.startsWith(ROOT+'/en/products/'))return;
  for(const item of variants){
   const image=String(item?.image_url||'');
   const ref=photoReference(image),row=BY_REF.get(ref);
   if(!ref||!codes.includes(ref)||!row||row.collection!==collection)continue;
   const value={reference:ref,base:row.base,collection,category:row.category,
    image,productUrl:href,scope:'exact'};
   if(!exact[ref])exact[ref]=value;
   const key=row.base+'|'+row.category;
   if(!models[key])models[key]={...value,scope:'model'};
  }
 });
 return {exact,models,collection,source:'Catalano official product thumbnails; strict SKU reference in data-codes and photo filename'};
}
function seedsFor(collection){
 const exact={},models={};
 for(const [reference,image] of Object.entries(seeds)){
  const row=BY_REF.get(reference);
  if(!row||row.collection!==collection||photoReference(image)!==reference)continue;
  const value={reference,base:row.base,collection,category:row.category,image,productUrl:COLLECTIONS[collection],scope:'exact'};
  exact[reference]=value;
  const key=row.base+'|'+row.category;if(!models[key])models[key]={...value,scope:'model'};
 }
 return {exact,models,collection,source:'Verified Catalano reference-stamped product thumbnails'};
}
const merge=(a,b)=>({
 ...a,exact:{...a.exact,...b.exact},models:{...a.models,...b.models},
 countExact:Object.keys({...a.exact,...b.exact}).length,
 countModels:Object.keys({...a.models,...b.models}).length
});
function createService({get=axios.get,now=Date.now}={}){
 // Per-service caches prevent different fetchers/deployments from sharing stale data.
 const cache=new Map(),inflight=new Map();
 const pageCache=new Map(),pageInflight=new Map();
 async function readPage(url){
  const cached=pageCache.get(url);
  if(cached&&now()-cached.at<TTL)return cached.html;
  if(pageInflight.has(url))return pageInflight.get(url);
  const task=(async()=>{
   try{
    const response=await get(url,{timeout:12000,maxRedirects:3,headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'en-GB,en;q=0.9','Accept':'text/html'},maxContentLength:4*1024*1024});
    const html=String(response.data||'');
    if(html.length<500||html.length>4*1024*1024)return '';
    pageCache.set(url,{at:now(),html});
    return html;
   }catch(err){console.warn('[Catalano media] source unavailable',url,String(err?.message||err));return ''}
  })();
  pageInflight.set(url,task);
  try{return await task}finally{pageInflight.delete(url)}
 }
 async function collection(name){
  if(!Object.hasOwn(COLLECTIONS,name))throw Error('Collection Catalano inconnue');
  const hit=cache.get(name);if(hit&&now()-hit.at<(hit.ttl||TTL))return hit.data;
  if(inflight.has(name))return inflight.get(name);
  const promise=(async()=>{
   const primaryUrl=COLLECTIONS[name];
   // Fetch the primary manufacturer collection before indexing supplemental
   // categories. Throttling many parallel sources can otherwise drop it.
   const primaryHtml=primaryUrl?await readPage(primaryUrl):'';
   let main=seedsFor(name);
   if(primaryHtml)main=merge(main,parseCollection(primaryHtml,name));
   const extras=supplementalSources(name);
   const htmls=await Promise.all(extras.map(readPage));
   let supplemental=seedsFor(name);
   for(const html of htmls){if(html)supplemental=merge(supplemental,parseCollection(html,name))}
   // Give the exact photo on the main collection precedence over a duplicate
   // on a category list, and never reduce coverage if an auxiliary page fails.
   return {data:merge(supplemental,main),primaryLoaded:!!primaryHtml};
  })();
  inflight.set(name,promise);
  try{
   const {data,primaryLoaded}=await promise;
   // A partial index must recover after a temporary manufacturer outage,
   // rather than remaining cached for six hours.
   cache.set(name,{at:now(),ttl:primaryLoaded?TTL:60*1000,data});
   return data;
  }finally{inflight.delete(name)}
 }
 return {collection};
}
function attach(app,{service=createService()}={}){
 app.get('/api/catalano-product-media',async(req,res)=>{
  const name=String(req.query.collection||'');
  if(!Object.hasOwn(COLLECTIONS,name))return res.status(400).json({ok:false,error:'Collection Catalano non reconnue'});
  try{
   const data=await service.collection(name);
   return res.set('Cache-Control','private, max-age=600').json({ok:true,...data});
  }catch{return res.status(503).json({ok:false,error:'Images fabricant indisponibles'})}
 });
}
module.exports=attach;
Object.assign(module.exports,{allowedPhoto,photoReference,parseCollection,seedsFor,createService,COLLECTIONS,supplementalSources});
