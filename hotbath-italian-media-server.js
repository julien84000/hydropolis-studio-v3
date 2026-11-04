'use strict';
/* Manufacturer-photo validation for the Italian Hotbath product listing.
 * Published /documents/ProdCateg URLs may be HTTP 404. Never serve one to
 * the configurator until we have confirmed actual image bytes.
 */
const axios=require('axios');
const cheerio=require('cheerio');
const index=require('./public/hotbath-italian-product-media.json');
const clean=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
// Product pages confirmed on the manufacturer collection listing. These
// model codes were absent from the historical photo index, although they
// are real supplier references. Never guess a manufacturer SKU or image.
const EXTRA_OFFICIAL=Object.freeze({
 Gent:{GT003:'3920'},
 Archie:{AR131:'3527',AR129:'3528','AR096-20':'3530',AR7070:'4030'},
 Ace:{AC514:'3034'},
 'Cobber X':{CX131:'3741'}
});
function lookup(collection,model){
 const listed=index.byCollection?.[collection]?.[model];
 const extra=EXTRA_OFFICIAL[collection]?.[model];
 const entry=listed||(extra?{image:'',
   officialProductPage:'https://www.hotbath.it/fr/produits/'+extra+'/'+model,
   status:'manufacturer-page-confirmed'}:null);
 if(!entry?.officialProductPage)return null;
 if(entry.image){
  const filename=decodeURIComponent(entry.image.split('/').pop()).toUpperCase();
  if(!filename.startsWith(String(model).toUpperCase()+'_')&&!filename.startsWith(String(model).toUpperCase()+'-')&&!filename.startsWith(String(model).toUpperCase()+'.'))return null;
  if(!/^https:\/\/(?:www\.)?hotbath\.it\/documents\/+ProdCateg\/\d+\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp)$/i.test(entry.image))return null;
 }
 if(!/^https:\/\/(?:www\.)?hotbath\.it\/fr\/produits\/\d+\/[A-Za-z0-9-]+$/i.test(entry.officialProductPage))return null;
 if(clean(entry.officialProductPage.split('/').pop())!==clean(model))return null;
 return entry;
}

const OFFICIAL_HOST=/^(?:www\.)?hotbath\.it$/i;
function productPageUrl(item){
 if(!item?.officialProductPage)return '';
 try{
  const u=new URL(item.officialProductPage);
  const m=u.pathname.match(/^\/fr\/produits\/(\d+)\/([A-Za-z0-9-]+)$/i);
  if(u.protocol!=='https:'||!OFFICIAL_HOST.test(u.hostname)||!m)return '';
  return 'https://www.hotbath.it/en/products/'+m[1]+'/'+m[2];
 }catch{return ''}
}
function matchesProductDocument(raw,item,model,kind='image'){
 try{
  const u=new URL(String(raw||''),'https://www.hotbath.it');
  const page=productPageUrl(item);
  if(!page||u.protocol!=='https:'||!OFFICIAL_HOST.test(u.hostname))return false;
  const id=new URL(page).pathname.split('/')[3];
  const path=decodeURIComponent(u.pathname).replace(/\/+/g,'/');
  const prefix='/documents/ProdCateg/'+id+'/';
  if(!path.startsWith(prefix))return false;
  const file=path.slice(prefix.length).toUpperCase(),code=String(model||'').toUpperCase();
  if(kind==='pdf')return file===code+'-00.PDF'||((file.startsWith(code+'-00_')||file.startsWith(code+'-00-'))&&/\.PDF$/.test(file))||file.startsWith(code+'-TECH');
  const stem=file.replace(/\.(?:JPE?G|PNG|WEBP)$/,'');
  return file!==stem && stem.startsWith(code+'_') && /^\d+(?:_\d+)?$/.test(stem.slice(code.length+1));
 }catch{return false}
}
function parseProductPage(html,item,model){
 const url=productPageUrl(item);
 if(!url||!html||typeof html!=='string')return {images:[],technicalSheetUrl:'',drawingUrl:''};
 const $=cheerio.load(html),images=[],pdfs=[],drawings=[];
 const found=new Set();
 $('[src],[data-src],[href],[data-original]').each((_,node)=>{
  const el=$(node);
  for(const attr of ['src','data-src','href','data-original']){
   const raw=String(el.attr(attr)||'');
   if(!raw||raw.startsWith('data:'))continue;
   let absolute;try{absolute=new URL(raw,url).href}catch{continue}
   if(matchesProductDocument(absolute,item,model,'image')){
    if(!found.has(absolute)){found.add(absolute);images.push(absolute)}
   }else if(matchesProductDocument(absolute,item,model,'pdf'))pdfs.push(absolute);
   else if(/^https:\/\/(?:www\.)?hotbath\.it\/documents\/+ProdCateg\/\d+\/[A-Za-z0-9-]+-LT\.jpg$/i.test(absolute)&&
     absolute.toUpperCase().includes('/'+String(model).toUpperCase()+'-LT.JPG'))drawings.push(absolute);
  }
 });
 images.sort((a,b)=>{
  const order=u=>{const m=new URL(u).pathname.match(/_(\d+)(?:_\d+)?\.(?:jpe?g|png|webp)$/i);return m?(m[1]==='2'?-100:Math.abs(Number(m[1])-2)):100};
  return order(a)-order(b);
 });
 return {images,technicalSheetUrl:pdfs[0]||'',drawingUrl:drawings[0]||'',productUrl:url};
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
 async function verifiedImage(url){
  try{
   const response=await get(url,{timeout:8000,maxRedirects:2,responseType:'arraybuffer',
    maxContentLength:6*1024*1024,headers:{'Accept':'image/jpeg,image/png,image/webp'}});
   const final=new URL(response.request?.res?.responseUrl||url);
   const mime=String(response.headers?.['content-type']||'').toLowerCase();
   return response.status===200&&OFFICIAL_HOST.test(final.hostname)&&
    mime.startsWith('image/')&&validBytes(Buffer.from(response.data||[]),mime);
  }catch{return false}
 }
 async function media(collection,model){
  const item=lookup(collection,model);
  if(!item)return null;
  const key=collection+'|'+model;
  const hit=cache.get(key);
  if(hit&&now()-hit.at<hit.ttl)return hit.value;
  if(pending.has(key))return pending.get(key);
  const promise=(async()=>{
   const url=productPageUrl(item);
   let info={images:[],technicalSheetUrl:'',drawingUrl:''};
   if(url){
    try{
     const response=await get(url,{timeout:11000,maxRedirects:2,maxContentLength:3*1024*1024,
      headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html','Accept-Language':'en'}});
     if(response.status===200&&typeof response.data==='string'&&response.data.length>100){
      info=parseProductPage(response.data,item,model);
     }
    }catch{/* Fall back to separately indexed manufacturer image URL. */}
   }
   const candidates=[...info.images];
   // If the supplier HTML is temporarily unavailable, validate the known
   // product-folder convention against ACTUAL image bytes before showing it.
   const path=new URL(url).pathname.split('/');
   const productId=path[3];
   const officialGuess='https://www.hotbath.it/documents/ProdCateg/'+productId+'/'+model+'_2.jpg';
   if(!candidates.includes(officialGuess))candidates.push(officialGuess);
   if(item.image&&!candidates.includes(item.image))candidates.push(item.image);
   for(const image of candidates.slice(0,5)){
    if(!matchesProductDocument(image,item,model,'image'))continue;
    if(!await verifiedImage(image))continue;
    return {image,collection,model,scope:'model',
     source:'Hotbath Italie · photographie fabricant vérifiée',productUrl:url||item.officialProductPage,
     technicalSheetUrl:info.technicalSheetUrl,drawingUrl:info.drawingUrl,verified:true};
   }
   return info.technicalSheetUrl?{image:'',collection,model,scope:'missing',verified:false,
    technicalSheetUrl:info.technicalSheetUrl,drawingUrl:info.drawingUrl,
    productUrl:url||item.officialProductPage,source:'Hotbath Italie · fiche technique fabricant'}:null;
  })();
  pending.set(key,promise);
  try{const value=await promise;cache.set(key,{at:now(),ttl:value?.image?6*3600*1000:5*60*1000,value});return value}
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
Object.assign(module.exports,{lookup,EXTRA_OFFICIAL,validBytes,createService,productPageUrl,matchesProductDocument,parseProductPage});
