/* Dornbracht 2026: official France-localized product visuals and necessary accessories.
 * Market guard: only accessory SKUs whose own fr-fr product pages resolve are selectable.
 * Price & saleable SKU are sourced independently from Hydropolis FAB-DIS 2026.
 */
'use strict';
module.exports=function installDornbrachtMedia(app){
 const axios=require('axios'),cheerio=require('cheerio');
 const cache=new Map(),pending=new Map(),accessoryCache=new Map();
 const rawPages=new Map(),rawPending=new Map();
 const safeSku=ref=>/^[0-9A-Z]{7,14}(?:-[0-9A-Z]{2,3})?$/i.test(String(ref||''));
 function safeImage(input){
  try{const u=new URL(String(input||'').trim());
   return u.protocol==='https:'&&u.hostname==='media.cdn.dornbracht.com'?u.href:'';
  }catch{return ''}
 }
 const normalize=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 const base='https://www.dornbracht.com';
 function validRefPage($,url,ref){
  const title=String($('meta[property="og:title"]').attr('content')||$('title').text()).trim();
  const pageRef=normalize($('body').text().match(/(?:Référence article|N° d'art\.|Art\.? No\.?)[\s:|]*([0-9\s-]{8,23})/i)?.[1]||'');
  const hrefMatch=String(url||'').toUpperCase().includes('/PRODUITS/'+ref.toUpperCase());
  const ogRef=normalize(title);
  const textRef=normalize($('body').text()).includes(normalize(ref));
  return (pageRef===normalize(ref)||hrefMatch&&textRef||hrefMatch&&ogRef.includes(normalize(ref)))&&
    !/^(?:Dornbracht|Accueil|Home)\s*[\|\-]/i.test(title);
 }
 function accessoriesFromHtml($){
  const refs=new Map();
  const headings=$('h2,h3,h4,h5,[role="heading"]').toArray();
  for(const node of headings){
   if(!/accessoires nécessaires|accessoires requis|necessary accessories|required accessories/i.test($(node).text()))continue;
   let block=$(node).nextAll().first();
   // Dornbracht sections can nest their cards under a wrapper immediately following the heading.
   if(!block.length||!block.find('a[href*="/produits/"]').length){
    const parent=$(node).parent();
    const following=parent.next();
    block=following.find('a[href*="/produits/"]').length?following:parent;
   }
   const scope=block.clone();
   scope.find('h2,h3,h4,h5').each((_,el)=>{if(/informations techniques|technical information/i.test($(el).text()))$(el).nextAll().remove()});
   scope.find('a[href*="/produits/"]').each((_,a)=>{
    let u;try{u=new URL($(a).attr('href'),base)}catch{return}
    if(u.hostname!=='www.dornbracht.com'||!u.pathname.startsWith('/fr-fr/produits/'))return;
    const m=u.pathname.match(/\/produits\/([0-9A-Z-]{7,20})(?:\/|$)/i);
    if(!m||!safeSku(m[1]))return;
    const ref=m[1].toUpperCase();
    const label=String($(a).text()||$(a).parent().text()||'Accessoire nécessaire').replace(/\s+/g,' ').trim().slice(0,160);
    if(!refs.has(ref))refs.set(ref,{reference:ref,label,officialUrl:u.href});
   });
   if(refs.size)break;
  }
  return [...refs.values()];
 }
 async function loadOfficial(ref,includeAccessories){
  const requested=base+'/fr-fr/produits/'+encodeURIComponent(ref);
  const response=await axios.get(requested,{timeout:12000,maxRedirects:3,maxContentLength:5*1024*1024,
   headers:{'User-Agent':'Mozilla/5.0 (compatible; HydropolisCatalog/1.0)','Accept-Language':'fr-FR,fr;q=0.9'}});
  const $=cheerio.load(String(response.data||''));
  const page=String($('link[rel="canonical"]').attr('href')||response.request?.res?.responseUrl||requested);
  if(!validRefPage($,page,ref))throw Error('La fiche ne confirme pas cette référence');
  const imageCandidates=[
   ...$('img[src*="media.cdn.dornbracht.com"],img[data-src*="media.cdn.dornbracht.com"]').toArray().map(el=>$(el).attr('src')||$(el).attr('data-src')),
   $('meta[property="og:image"]').attr('content')
  ].map(safeImage);
  const image=imageCandidates.find(Boolean)||'';
  const title=String($('meta[property="og:title"]').attr('content')||$('title').text()).trim();
  return {ok:true,reference:ref,image,manufacturerUrl:page,title,source:'Dornbracht officiel · page de la référence',
   scope:'reference',accessories:includeAccessories?accessoriesFromHtml($):[]};
 }
 async function rawPage(ref){
  const prior=rawPages.get(ref);
  if(prior&&Date.now()-prior.timestamp<6*3600000)return prior.data;
  if(rawPending.has(ref))return rawPending.get(ref);
  const task=loadOfficial(ref,true).then(data=>{
   rawPages.set(ref,{timestamp:Date.now(),data});
   if(rawPages.size>450)rawPages.delete(rawPages.keys().next().value);
   return data;
  }).finally(()=>rawPending.delete(ref));
  rawPending.set(ref,task);
  return task;
 }
 async function lookupImage(ref){
  const prior=cache.get(ref);
  if(prior&&Date.now()-prior.timestamp<6*3600000)return {...prior.result,accessories:[]};
  const info=await rawPage(ref);
  return {ok:true,reference:ref,image:info.image,manufacturerUrl:info.manufacturerUrl,
   title:info.title,source:info.source,scope:'reference',accessories:[]};
 }
 async function verifyFrance(ref){
  const prior=accessoryCache.get(ref);
  if(prior&&Date.now()-prior.time<12*3600000)return prior.ok;
  let verified=false;
  try{await loadOfficial(ref,false);verified=true}catch{}
  accessoryCache.set(ref,{ok:verified,time:Date.now()});
  if(accessoryCache.size>500)accessoryCache.delete(accessoryCache.keys().next().value);
  return verified;
 }
 async function lookup(ref){
  const prior=cache.get(ref);
  if(prior&&Date.now()-prior.timestamp<6*3600000)return prior.result;
  if(pending.has(ref))return pending.get(ref);
  const task=(async()=>{
   const data=await rawPage(ref);
   // Exact manufacturer list from the French product page. Never synthesize compatibility.
   const options=await Promise.all(data.accessories.slice(0,12).map(async item=>({
    ...item,francePageVerified:await verifyFrance(item.reference)
   })));
   const result={...data,accessories:options,accessorySource:'Fiche fabricant /fr-fr/ · Accessoires nécessaires'};
   cache.set(ref,{timestamp:Date.now(),result});
   if(cache.size>450)cache.delete(cache.keys().next().value);
   return result;
  })().finally(()=>pending.delete(ref));
  pending.set(ref,task);
  return task;
 }
 function route(loader){
  return (req,res)=>{
   const ref=String(req.query.reference||'').trim().toUpperCase();
   if(!safeSku(ref))return res.status(400).json({ok:false,error:'Référence Dornbracht invalide'});
   loader(ref).then(data=>{
    res.set('Cache-Control','private,max-age=1800');res.json(data);
   }).catch(()=>res.status(404).json({ok:false,reference:ref,image:'',accessories:[],error:'Fiche française de cette référence non vérifiée'}));
  };
 }
 // Miniature: one French manufacturer page, zero accessory-market validation calls.
 app.get('/api/dornbracht-product-media',route(lookupImage));
 // Configurator detail: validate only the chosen model's required French parts.
 app.get('/api/dornbracht-product-config',route(lookup));
 return {lookup,lookupImage,rawPage,safeSku,safeImage,accessoriesFromHtml,validRefPage,verifyFrance};
};