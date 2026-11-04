'use strict';
/* Recor manufacturer visual + technical PDFs.
 * Every image is resolved from its exact product page. Generic brand images
 * and guessed technical sheets are deliberately rejected.
 */
const axios=require('axios'),cheerio=require('cheerio');
const rows=require('./public/catalog_recor.json');
const cache=new Map(),pending=new Map();
const supported=new Map();
for(const item of rows)if(item.category==='Bain'){
 const model=String(item.base||'').replace(/^RECOR-/,'').toUpperCase();
 if(model&&!supported.has(model))supported.set(model,String(item.manufacturerUrl||''));
}
// Official Recor 2026 catalogue also illustrates Camile, shower trays and ten
// finish families absent from the priced SKU import. Show them without inventing prices.
const EXTRA_OFFICIAL_PAGES=Object.freeze({
 'CAMILE':'/product/camile/',
 'SHOWER-TRAYS':'/product/shower-trays-en/',
 'HAND-GILDED':'/product/hand-gilded/',
 'MOSAIC-EXTERIOR':'/product/mosaic-exterior/',
 'HAND-POLISHED':'/product/hand-polished/',
 'SOLID-COPPER':'/product/solid-copper/',
 'SOLID-BRASS':'/product/solid-brass/',
 'SOLID-ALUMINIUM':'/product/solid-aluminium/',
 'STAINLESS-STEEL':'/product/stainless-steel/',
 'LEATHER':'/product/leather/',
 'NATURAL-RUSTIC':'/product/natural-rustic/',
 'BRONZE-RUSTIC':'/product/bronze-rustic-finish/'
});
for(const [model,pathname] of Object.entries(EXTRA_OFFICIAL_PAGES))
 if(!supported.has(model))supported.set(model,'https://recor.pt'+pathname);
const ORIGIN='https://recor.pt';
const validModel=model=>/^[A-Z][A-Z0-9-]{2,38}$/.test(model)&&supported.has(model);
const allowedURL=(input,kind='image')=>{
 try{
  const u=new URL(input,ORIGIN);
  if(u.protocol!=='https:'||u.hostname!=='recor.pt'||u.username||u.password)return '';
  if(!/^\/wp-content\/uploads\/\d{4}\/\d{2}\//.test(u.pathname))return '';
  if(kind==='image'&&!/\.(?:jpe?g|png|webp)$/i.test(u.pathname))return '';
  if(kind==='pdf'&&!/\.pdf$/i.test(u.pathname))return '';
  u.hash='';return u.href;
 }catch{return ''}
};
function pageCandidates(model){
 const slug=String(model).toLowerCase();
 const stored=supported.get(model)||'';
 const urls=[stored,ORIGIN+'/product/'+slug+'-en/',ORIGIN+'/product/'+slug+'/'];
 return [...new Set(urls.filter(u=>{
  try{const x=new URL(u);return x.hostname==='recor.pt'&&x.protocol==='https:'&&/^\/product\/[\w-]+\/$/.test(x.pathname)}catch{return false}
 }))];
}
function parseProduct(html,pageUrl,model){
 const $=cheerio.load(String(html||''));
 const title=($('h1').first().text()||$('title').first().text()||'').trim();
 const compact=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
 if(!title||!compact(title).includes(compact(model)))return null;
 const images=[],docs=[];
 const addImage=raw=>{const u=allowedURL(raw,'image');if(u&&!images.includes(u)&&
   !/logo|icon|banner|recor-branco|newsletter/i.test(u))images.push(u)};
 const addDoc=(raw,text)=>{const u=allowedURL(raw,'pdf');if(u&&!docs.some(x=>x.url===u))docs.push({url:u,text:String(text||'')})};
 $('.woocommerce-product-gallery a[href],.woocommerce-product-gallery img[data-large_image],.woocommerce-product-gallery img[src],.product-gallery a[href],.product-gallery img[src]').each((_,el)=>{
  const e=$(el);addImage(e.attr('data-large_image')||e.attr('href')||e.attr('src')||'');
 });
 // Recor's product gallery can use a custom WordPress carousel.
 $('img[src],img[data-src],a[href]').each((_,el)=>{
  const e=$(el),raw=e.attr('data-src')||e.attr('src')||e.attr('href')||'';
  if(/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(raw)){
   const url=allowedURL(raw);
   // Accept original manufacturer photography only where the filename
   // belongs to the selected product/gallery rather than another brand model.
   const filename=decodeURIComponent(new URL(url||ORIGIN).pathname.split('/').pop()||'');
   const tokens=compact(model).split(' ').filter(Boolean);
   if(url&&(compact(filename).includes(compact(model))||
      (model==='ROLL-TOP'&&/roll.?top/i.test(filename))||
      (model==='GRAND-EPOQUE'&&/grand.?epoque/i.test(filename))))addImage(url);
  }else if(/\.pdf(?:\?|$)/i.test(raw))addDoc(raw,e.text());
 });
 addImage($('meta[property="og:image"]').attr('content'));
 // Keep only large images / original filename, not WordPress resized thumbs.
 const full=images.filter(u=>!/-\d{2,4}x\d{2,4}\.(?:jpe?g|png|webp)$/i.test(new URL(u).pathname));
 const ordered=(full.length?full:images).slice(0,15);
 const technical=docs.find(d=>/technical|drawing|desenho|dessin|plan|fiche/i.test(d.text))
  ||docs.find(d=>/technical|drawing/i.test(d.url));
 const brochure=docs.find(d=>/brochure|leaflet|folheto|catalog/i.test(d.text+' '+d.url));
 return {model,title,productUrl:pageUrl,images:ordered,
  image:ordered[0]||'',technicalSheetUrl:technical?.url||'',
  brochureUrl:brochure?.url||'',source:'Recor · site officiel',
  verifiedModel:true,verifiedExactFinish:false};
}
function service({get=axios.get,now=Date.now}={}){
 async function getMedia(model){
  if(!validModel(model))return null;
  const cached=cache.get(model);
  if(cached&&now()-cached.at<8*3600000)return cached.value;
  if(pending.has(model))return pending.get(model);
  const promise=(async()=>{
   for(const url of pageCandidates(model)){
    try{
     const r=await get(url,{timeout:12000,maxRedirects:3,maxContentLength:2*1024*1024,
      headers:{'Accept':'text/html','User-Agent':'Mozilla/5.0','Accept-Language':'en'}});
     if(r.status!==200)continue;
     const data=parseProduct(String(r.data||''),url,model);
     if(data){cache.set(model,{at:now(),value:data});return data}
    }catch{/* Try only another exact manufacturer's product URL. */}
   }
   const missing={model,image:'',images:[],technicalSheetUrl:'',brochureUrl:'',
    productUrl:pageCandidates(model)[0]||'',verifiedModel:false};
   cache.set(model,{at:now(),value:missing});return missing;
  })();
  pending.set(model,promise);try{return await promise}finally{pending.delete(model)}
 }
 async function image(model,index){
  const media=await getMedia(model),photo=media?.images?.[index];
  if(!photo||!allowedURL(photo))return null;
  const r=await get(photo,{timeout:12000,responseType:'arraybuffer',maxRedirects:3,
   maxContentLength:8*1024*1024,headers:{'Accept':'image/jpeg,image/png,image/webp'}});
  const final=String(r.request?.res?.responseUrl||photo);
  if(!allowedURL(final)||r.status!==200)return null;
  const bytes=Buffer.from(r.data||[]),type=String(r.headers?.['content-type']||'').split(';')[0].toLowerCase();
  const valid=(type==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)||
   (type==='image/png'&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))||
   (type==='image/webp'&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP');
  return valid?{bytes,type}:null;
 }
 return {getMedia,image};
}
function attach(app,{mediaService=service()}={}){
 app.get('/api/recor-model-media',async(req,res)=>{
  const model=String(req.query.model||'').trim().toUpperCase();
  if(!validModel(model))return res.status(400).json({ok:false,error:'Modèle Recor inconnu'});
  try{
   const data=await mediaService.getMedia(model);
   res.set('Cache-Control','private,max-age=900').json({ok:true,...data});
  }catch(e){res.status(502).json({ok:false,error:'Fiche Recor indisponible'})}
 });
 app.get('/api/recor-model-photo',async(req,res)=>{
  const model=String(req.query.model||'').trim().toUpperCase();
  const index=Number(req.query.index||0);
  if(!validModel(model)||!Number.isInteger(index)||index<0||index>14)
   return res.status(400).end();
  try{
   const result=await mediaService.image(model,index);
   if(!result)return res.status(404).end();
   res.set('Content-Type',result.type);
   res.set('Cache-Control','public,max-age=86400');
   res.send(result.bytes);
  }catch(e){res.status(502).end()}
 });
}
module.exports=attach;
Object.assign(module.exports,{service,parseProduct,pageCandidates,supported,validModel,allowedURL,EXTRA_OFFICIAL_PAGES});
