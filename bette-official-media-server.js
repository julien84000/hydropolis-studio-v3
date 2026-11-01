'use strict';
/* Bette official product-level photos and manufacturer 3D deeplinks.
 * Do not confuse an official MODEL photograph/3D default with an exact
 * SKU in a particular colour, size or equipment configuration.
 * No external request is constructed from an arbitrary user-supplied URL.
 */
const axios=require('axios');
const cheerio=require('cheerio');
const ORIGIN='https://www.my-bette.com';
const MEDIA_ORIGIN='https://content.my-bette.com';
const CATEGORIES=Object.freeze({
 baths:'/fr/produits/baignoires',
 showers:'/fr/produits/receveurs-de-douche',
 basins:'/fr/produits/vasques'
});
const PRODUCT_PATHS=Object.freeze({
 baths:'/fr/produit/baignoires/',
 showers:'/fr/produit/receveurs-de-douche-receveurs-ultra-plats/',
 basins:'/fr/produit/vasques/'
});
const officialCandidate=(category,slug)=>CATEGORIES[category]&&/^[a-z0-9][a-z0-9-]{2,90}$/.test(String(slug||''))?
  ORIGIN+PRODUCT_PATHS[category]+slug:'';
const CACHE_MS=6*60*60*1000;
const indexCache=new Map(),productCache=new Map();
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const norm=s=>String(s||'').trim().replace(/\s+/g,' ');
const trustedProductPage=value=>{
 try{const u=new URL(value,ORIGIN);return u.protocol==='https:'&&u.hostname==='www.my-bette.com'&&
  /^\/fr\/produit\/[a-z0-9-]+\/[a-z0-9-]+\/?$/.test(u.pathname)?u.toString():'';}
 catch{return '';}
};
const trustedPhoto=value=>{
 try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='content.my-bette.com'&&
   u.pathname.startsWith('/produkt_bilder/')&&/\.(?:webp|png|jpe?g)$/i.test(u.pathname)?u.toString():'';}
 catch{return '';}
};
const trustedConfigurator=value=>{
 try{
  const u=new URL(value,ORIGIN);if(u.protocol!=='https:'||u.hostname!=='www.my-bette.com'||u.pathname!=='/fr/configurator')return '';
  if(!/^\d+$/.test(u.searchParams.get('product')||'')||!/^\d+$/.test(u.searchParams.get('variant')||''))return '';
  const result=new URL('/fr/configurator',ORIGIN);
  result.searchParams.set('product',u.searchParams.get('product'));result.searchParams.set('variant',u.searchParams.get('variant'));
  return result.href;
 }catch{return ''}
};
function parseListing(html,category){
 if(!CATEGORIES[category])return [];
 const $=cheerio.load(html),found=new Map();
 $('article.productteaser').each((_,node)=>{
  const $card=$(node);
  const name=norm($card.attr('aria-label')||$card.find('.productteaser__headline').first().text());
  const href=trustedProductPage($card.find('a[href*="/fr/produit/"]').first().attr('href'));
  const image=trustedPhoto($card.find('img').first().attr('src')||'');
  if(!name||!href||!image)return;
  found.set(href,{name,page:href,image,category});
 });
 return [...found.values()];
}
function matchModel(entries,model,family=''){
 // Exact model name matches ONLY. Never substitute BetteStarlet for BetteStarlet I,
 // BetteArt countertop for the freestanding monolith, etc.
 const wanted=[model,family].map(clean).filter(x=>x.startsWith('bette')&&x.length>=7);
 for(const value of wanted){
  const exact=entries.filter(e=>clean(e.name)===value);
  if(exact.length===1)return exact[0];
 }
 return null;
}
function parseProduct(html,entry){
 const $=cheerio.load(html);
 const name=norm($('h1.product__headline').first().text()||$('h1').first().text());
 if(clean(name)!==clean(entry.name))return null;
 const photos=$('img').toArray().flatMap(el=>{
  const $el=$(el),data=[$el.attr('src'),$el.attr('data-src')];
  return data.map(trustedPhoto).filter(Boolean);
 });
 const image=photos.find(x=>x.includes('ProductEntryThumbImage'))||
   photos.find(x=>x.includes('ProductEntryGalleryImage'))||entry.image;
 if(!trustedPhoto(image))return null;
 const links=$('a[href*="/fr/configurator?"]').toArray().map(el=>trustedConfigurator($(el).attr('href'))).filter(Boolean);
 return {name:entry.name,category:entry.category,page:entry.page,image:trustedPhoto(image)||entry.image,
  // Manufacturer page supplies a default variant. Its SKU, dimensions and colour
  // are NOT assumed to match the chosen Hydropolis reference.
  configurator:links[0]||'',scope:'model-only',skuExact:false};
}
function makeService({get=axios.get,now=Date.now}={}){
 const pendingIndex=new Map(),pendingProduct=new Map();
 async function retrieve(url){
  const response=await get(url,{timeout:10000,maxRedirects:2,maxContentLength:6*1024*1024,headers:{'Accept':'text/html'}});
  if(typeof response.data!=='string'||response.data.length>6*1024*1024)throw Error('Réponse Bette invalide');
  return response.data;
 }
 async function listing(category){
  const hit=indexCache.get(category);if(hit&&now()-hit.at<CACHE_MS)return hit.value;
  if(pendingIndex.has(category))return pendingIndex.get(category);
  const promise=retrieve(ORIGIN+CATEGORIES[category]).then(html=>{
   const value=parseListing(html,category);indexCache.set(category,{at:now(),value});return value;
  }).finally(()=>pendingIndex.delete(category));
  pendingIndex.set(category,promise);return promise;
 }
 async function modelImage(category,model,family='',slug=''){
  if(!CATEGORIES[category]||String(model).length>110||String(family).length>110||String(slug).length>100)
    return {ok:false,reason:'Catégorie ou nom de modèle Bette invalide'};
  // The product slug comes from the supplier catalogue group ID, not from a
  // guessed manufacturer product or variant number. This URL is ONLY exposed
  // after the manufacturer H1 title and its image have been verified.
  const candidate=officialCandidate(category,slug);
  if(candidate){
    const cached=productCache.get(candidate);
    if(cached&&now()-cached.at<CACHE_MS)return {ok:true,...cached.value};
    try{
      const value=parseProduct(await retrieve(candidate),{name:family||model,category,page:candidate,image:''});
      if(value&&([model,family].some(x=>clean(x)===clean(value.name)))){
        productCache.set(candidate,{at:now(),value});return {ok:true,...value};
      }
    }catch{} // fallback to indexed official category; do not assert a match
  }
  const entries=await listing(category),entry=matchModel(entries,model,family);
  if(!entry)return {ok:false,reason:'Aucune correspondance de nom de modèle exacte dans le catalogue officiel Bette'};
  const cached=productCache.get(entry.page);
  if(cached&&now()-cached.at<CACHE_MS)return {ok:true,...cached.value};
  if(pendingProduct.has(entry.page))return pendingProduct.get(entry.page);
  const promise=retrieve(entry.page).then(html=>{
   const value=parseProduct(html,entry);
   if(!value)return {ok:false,reason:'Fiche Bette non concordante avec le nom du modèle'};
   productCache.set(entry.page,{at:now(),value});return {ok:true,...value};
  }).catch(()=>({
    // Even if the product detail page is unavailable, the listing photograph
    // has an exact manufacturer model label; not an exact colour/size.
    ok:true,name:entry.name,category,page:entry.page,image:entry.image,
    configurator:'',scope:'model-only',skuExact:false,warning:'Lien de configuration de ce modèle temporairement non vérifiable.'
  })).finally(()=>pendingProduct.delete(entry.page));
  pendingProduct.set(entry.page,promise);return promise;
 }
 return {modelImage};
}
function attach(app,{service=makeService()}={}){
 app.get('/api/bette-model-media',async(req,res)=>{
  const category=String(req.query.category||''),model=String(req.query.model||''),family=String(req.query.family||''),slug=String(req.query.slug||'');
  if(!CATEGORIES[category]||!model||model.length>110||family.length>110||slug.length>100)
   return res.status(400).json({ok:false,reason:'Catégorie et modèle Bette requis'});
  try{
   const result=await service.modelImage(category,model,family,slug);
   res.set('Cache-Control','private, max-age=900');return res.json(result);
  }catch{return res.status(503).json({ok:false,reason:'Catalogue Bette momentanément inaccessible'});}
 });
}
module.exports=attach;
Object.assign(module.exports,{CATEGORIES,PRODUCT_PATHS,officialCandidate,parseListing,matchModel,parseProduct,makeService,trustedConfigurator,trustedPhoto,trustedProductPage});
