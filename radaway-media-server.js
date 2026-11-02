'use strict';
// Resolve official Radaway product photographs for manufacturer model pages only.
module.exports=function installRadawayMedia(app){
 const axios=require('axios'),cheerio=require('cheerio');
 const cache=new Map(),pending=new Map();
 const valid=s=>/^[a-z0-9][a-z0-9-]{2,100}$/.test(s);
 async function photo(slug){
  if(!valid(slug))throw Error('Invalid model slug');
  const c=cache.get(slug);
  if(c&&Date.now()-c.ts<24*3600000)return c.data;
  if(pending.has(slug))return pending.get(slug);
  const task=(async()=>{
   const url='https://www.radaway.fr/kategoria/'+slug+'/';
   const response=await axios.get(url,{timeout:11000,maxRedirects:2,maxContentLength:2500000,
     headers:{'User-Agent':'Mozilla/5.0 (compatible; HydropolisCatalog/1.0)','Accept-Language':'fr-FR,fr;q=0.9'}});
   const $=cheerio.load(String(response.data||''));
   const possible=[];
   const push=x=>{if(x&&typeof x==='string')possible.push(x.trim())};
   push($('meta[property="og:image"]').attr('content'));
   push($('meta[name="twitter:image"]').attr('content'));
   $('.single-product img, .product-gallery img, .product-images img, .woocommerce-product-gallery img, img.wp-post-image').each((_,el)=>{
     push($(el).attr('data-large_image'));push($(el).attr('data-src'));push($(el).attr('src'));
   });
   $('img[src*="/wp-content/uploads/"]').slice(0,25).each((_,el)=>push($(el).attr('src')));
   const found=possible.find(src=>{
    try{const u=new URL(src,url);return u.protocol==='https:'&&u.hostname==='www.radaway.fr'&&
       u.pathname.startsWith('/wp-content/uploads/')&&
       /\.(?:png|jpg|jpeg|webp)$/i.test(u.pathname)&&
       !/logo|transparent|kolor-|color|sample|avatar|icon|placeholder/i.test(u.pathname)
    }catch{return false}
   })||'';
   const data={ok:!!found,slug,photo:found?new URL(found,url).href:'',manufacturerUrl:url,
     exactFinish:!!found,source:'Photo de la page officielle Radaway'};
   cache.set(slug,{ts:Date.now(),data});
   if(cache.size>800)cache.delete(cache.keys().next().value);
   return data;
  })().finally(()=>pending.delete(slug));
  pending.set(slug,task);return task;
 }
 app.get('/api/radaway-model-media',(req,res)=>{
   const slug=String(req.query.slug||'').trim().toLowerCase();
   if(!valid(slug))return res.status(400).json({ok:false,error:'Model slug invalid'});
   photo(slug).then(result=>{res.set('Cache-Control','public,max-age=7200');res.json(result)})
    .catch(()=>res.json({ok:false,slug,photo:'',exactFinish:false,source:'Photo temporairement indisponible'}));
 });
 return {photo,valid};
};