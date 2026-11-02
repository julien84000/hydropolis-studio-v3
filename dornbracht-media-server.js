/* Dornbracht manufacturer product image resolver.
 * Resolve a SKU only against the official Dornbracht product page.
 * Avoid inferring photographs from similar model codes or finishes.
 */
'use strict';
module.exports=function installDornbrachtMedia(app){
 const axios=require('axios'),cheerio=require('cheerio');
 const cache=new Map(),pending=new Map();
 const safeSku=ref=>/^[0-9A-Z]{7,14}(?:-[0-9A-Z]{2,3})?$/i.test(ref);
 function safeImage(input){
  const url=String(input||'').trim();
  try{
   const u=new URL(url);
   if(u.protocol!=='https:'||u.hostname!=='media.cdn.dornbracht.com')return '';
   return u.href;
  }catch{return ''}
 }
 async function lookup(ref){
  const previous=cache.get(ref);
  if(previous&&Date.now()-previous.timestamp<6*3600000)return previous.result;
  if(pending.has(ref))return pending.get(ref);
  const work=(async()=>{
   const page='https://www.dornbracht.com/fr-fr/produits/'+encodeURIComponent(ref);
   const response=await axios.get(page,{timeout:8500,maxRedirects:3,maxContentLength:4*1024*1024,
    headers:{'User-Agent':'Mozilla/5.0 (compatible; HydropolisCatalog/1.0)','Accept-Language':'fr-FR,fr;q=0.9'}});
   const $=cheerio.load(String(response.data||''));
   const title=String($('meta[property="og:title"]').attr('content')||$('title').text()||'').trim();
   const html=String(response.data||'');
   const canonical=String($('link[rel="canonical"]').attr('href')||response.request?.res?.responseUrl||page);
   // Require a product response, not the manufacturer's general homepage.
   const canonicalSlug=canonical.toUpperCase();
   const skuPresent=canonicalSlug.includes('/'+ref.toUpperCase())||
     html.replace(/[\s\u00a0]/g,'').toUpperCase().includes(ref.toUpperCase());
   const isProduct=/dornbracht/i.test(title)&&
     !/^\s*(?:Dornbracht|Accueil|Home)\s*[\|\-]/i.test(title);
   if(!skuPresent||!isProduct)throw Error('Page fabricant sans correspondance exacte');
   const og=safeImage($('meta[property="og:image"]').attr('content'));
   const productImage=Array.from($('img')).map(el=>
     safeImage($(el).attr('src')||$(el).attr('data-src'))).find(Boolean)||'';
   const image=productImage||og;
   if(!image)throw Error('Photo officielle absente');
   const result={ok:true,reference:ref,image,manufacturerUrl:canonical,
    source:'Dornbracht officiel · référence produit',scope:'reference',
    note:'Photo issue de la page fabricant correspondant à la référence demandée.'};
   cache.set(ref,{timestamp:Date.now(),result});
   if(cache.size>450)cache.delete(cache.keys().next().value);
   return result;
  })().finally(()=>pending.delete(ref));
  pending.set(ref,work);
  return work;
 }
 app.get('/api/dornbracht-product-media',async(req,res)=>{
  const ref=String(req.query.reference||'').trim().toUpperCase();
  if(!safeSku(ref))return res.status(400).json({ok:false,error:'Référence Dornbracht invalide'});
  try{
   const data=await lookup(ref);
   res.set('Cache-Control','private,max-age=1800');
   res.json(data);
  }catch(error){
   // A failed lookup must never silently acquire a photo from another SKU.
   res.status(404).json({ok:false,reference:ref,image:'',error:'Photo exacte non trouvée'});
  }
 });
 return {lookup,safeSku,safeImage};
};