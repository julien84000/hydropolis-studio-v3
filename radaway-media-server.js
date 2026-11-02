'use strict';
// Official Radaway model image and glass specification resolver, with bounded caching.
// A supplier page provides model imagery and thickness; never infer SKU or prices.
module.exports=function installRadawayMedia(app){
 const axios=require('axios'),cheerio=require('cheerio');
 const cache=new Map(),pending=new Map();
 const valid=s=>/^[a-z0-9][a-z0-9-]{2,100}$/.test(s);
 const classifyImage=(value,base)=>{
  try{
   const u=new URL(String(value||'').replace(/&amp;/g,'&'),base);
   if(u.protocol!=='https:'||u.hostname!=='www.radaway.fr'||!u.pathname.startsWith('/wp-content/uploads/'))return '';
   if(!/\.(?:jpe?g|png|webp)$/i.test(u.pathname))return '';
   if(/logo|kolor-|sample|avatar|icon|placeholder|banner|ikona|favicon|colour|color|flag|transparent-glass|easyclean/i.test(u.pathname))return '';
   return u.href;
  }catch{return ''}
 };
 function fromHtml(html,slug,url){
  const $=cheerio.load(html);
  const candidates=[];
  const add=(value,weight)=>{
   const src=classifyImage(value,url);if(src&&!candidates.some(x=>x.src===src))candidates.push({src,weight});
  };
  // Prefer the selected product's media area over a generic social preview.
  $('[class*="gallery"] img, [class*="product"] img, [class*="slide"] img, .single-product img, img.wp-post-image').each((_,el)=>{
   const e=$(el);
   for(const attr of ['data-large_image','data-src','data-lazy-src','src'])add(e.attr(attr),100);
   const srcset=e.attr('srcset')||e.attr('data-srcset')||'';
   for(const match of srcset.matchAll(/(https?:\/\/[^\s,]+\.(?:jpg|jpeg|webp|png))(?:\s+\d+w)?/gi))add(match[1],96);
  });
  $('a[href*="/wp-content/uploads/"]').each((_,el)=>add($(el).attr('href'),85));
  $('[style*="background-image"]').each((_,el)=>{
   const style=$(el).attr('style')||'';
   const image=style.match(/background-image\s*:\s*url\(\s*['"]?([^)'"]+)/i)?.[1];add(image,65);
  });
  add($('meta[property="og:image"]').attr('content'),35);
  add($('meta[name="twitter:image"]').attr('content'),25);
  $('img[src*="/wp-content/uploads/"]').slice(0,60).each((_,el)=>add($(el).attr('src'),15));
  // Reject global/non-product assets when there are better product-specific images.
  const tokens=slug.split('-').filter(x=>x.length>2&&!['chrome','black','gold','brushed','plus','walk','ii','iii'].includes(x));
  for(const c of candidates){
   const normalized=c.src.toLowerCase();
   const hits=tokens.filter(t=>normalized.includes(t)).length;
   c.weight+=Math.min(45,hits*12);
   if(/-\d+x\d+\.(?:jpg|webp|png)/i.test(normalized))c.weight-=4;
  }
  candidates.sort((a,b)=>b.weight-a.weight);
  const image=candidates[0]?.src||'';
  const body=$('body').text().replace(/\s+/g,' ').slice(0,180000);
  let thicknessOptions=[...body.matchAll(/(?:VERRE|GLASS|EPAISSEUR|ÉPAISSEUR)\s*(?:DE|D['’])?\s*(6|8|10)\s*MM/gi)]
   .map(m=>Number(m[1]));
  const contextual=[...body.matchAll(/(?:verre\s+(?:de\s+)?sécurité|verre\s+trempé|épaisseur\s+du\s+verre)[^.;]{0,80}?(6|8|10)\s*mm/gi)].map(m=>Number(m[1]));
  thicknessOptions=[...new Set(thicknessOptions.concat(contextual))].sort((a,b)=>a-b);
  // Some pages advertise multiple products in footer; only use a thickness if unambiguous.
  if(thicknessOptions.length!==1)thicknessOptions=[];
  const glassLabels=['Transparent','UltraClear','Satiné','Graphite','Brun','Master-Soft','Miroir','Intimato','Visiosun'];
  // Availability from a specific page cannot be confidently determined from general navigation.
  const glassOptions=['Transparent'];
  return {image,thicknessOptions,glassOptions,manufacturerUrl:url,
   imageVerified:!!image,glassOptionsVerified:false,source:'Fiche officielle Radaway'};
 }
 async function photo(slug){
  if(!valid(slug))throw Error('Invalid model slug');
  const cached=cache.get(slug);
  if(cached&&Date.now()-cached.ts<24*3600000)return cached.data;
  if(pending.has(slug))return pending.get(slug);
  const task=(async()=>{
   const url='https://www.radaway.fr/kategoria/'+slug+'/';
   const response=await axios.get(url,{timeout:12000,maxRedirects:2,maxContentLength:3000000,
     headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'fr-FR,fr;q=0.9'}});
   const extracted=fromHtml(String(response.data||''),slug,url);
   const data={ok:extracted.imageVerified,slug,photo:extracted.image,
     exactFinish:extracted.imageVerified,manufacturerUrl:url,
     thicknessOptions:extracted.thicknessOptions,glassOptions:extracted.glassOptions,
     glassOptionsVerified:false,source:extracted.source};
   cache.set(slug,{ts:Date.now(),data});
   if(cache.size>800)cache.delete(cache.keys().next().value);
   return data;
  })().finally(()=>pending.delete(slug));
  pending.set(slug,task);return task;
 }
 app.get('/api/radaway-model-media',(req,res)=>{
  const slug=String(req.query.slug||'').trim().toLowerCase();
  if(!valid(slug))return res.status(400).json({ok:false,error:'Modèle invalide'});
  photo(slug).then(data=>{res.set('Cache-Control','public,max-age=7200');res.json(data)})
   .catch(()=>res.json({ok:false,slug,photo:'',exactFinish:false,thicknessOptions:[],glassOptions:['Transparent'],
     error:'Photo ou données fabricant temporairement indisponibles'}));
 });
 return {photo,valid,fromHtml};
};