'use strict';
const axios=require('axios');
const cheerio=require('cheerio');
const {pipeline}=require('stream');
const {MetadataCache,createPool}=require('./metadata-cache');
const VERSION=require('./package.json').version;
const alpiIndex=require('./public/alpi_official_products.json').products;
const siraModels=require('./public/sira_models.json').models;
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toUpperCase();
const hosts={alpi:['alpirubinetterie.com'],sira:['siraconcrete.com'],gessi:['gessi.com','gessistorage.blob.core.windows.net','g-ecatalogue-be-prod-we.azurewebsites.net']};
const badImage=url=>/(?:logo|favicon|placeholder|sprite|loading|swatch)/i.test(url);
function hostAllowed(raw,family){
  try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&(hosts[family]||[]).some(h=>u.hostname===h||u.hostname.endsWith('.'+h));}catch{return false;}
}
function official(raw,base,family){try{const url=raw&&new URL(raw,base).href;return hostAllowed(url,family)?url:'';}catch{return '';}}
function imageUrl(raw,base,family){const url=official(raw,base,family);return url&&!badImage(url)?url:'';}
function empty(family,p={}){
  return {version:VERSION,productUrl:'',image:'',images:[],imageSource:`Site officiel ${family}`,finishMatch:'unavailable',technicalSheetUrl:'',installationGuideUrl:'',drawingUrl:'',finishCode:p.finishCode||p.color||'',note:'Visuel non disponible pour cette référence et cette finition.'};
}
function stripFinish(reference,finish){
  const ref=norm(reference),code=norm(finish);if(!code)return ref;
  const pos=ref.lastIndexOf(code),after=ref.slice(pos+code.length);
  return pos>=0&&/^(?:\d*|MBO|MNO|MTL)$/.test(after)?ref.slice(0,pos)+after:ref;
}
function matchAlpi(p){
  const reference=norm(p.reference),base=stripFinish(reference,p.finishCode);
  const exact=alpiIndex.filter(x=>norm(x.reference)===reference);
  const rows=exact.length?exact:alpiIndex.filter(x=>stripFinish(x.reference,'CR')===base||norm(x.reference)===base);
  if(!rows.length||new Set(rows.map(x=>x.id)).size!==1)return null;
  return {...rows[0],finishMatch:exact.length&&p.finishCode?'exact':'generic'};
}
function parseAlpiPopup(html,item){
  const $=cheerio.load(html),reference=$('.stock__header .grid-item__codice').text().trim();
  if(norm(reference)!==norm(item.reference))throw Error('Référence de la fiche ALPI incohérente');
  const image=imageUrl(($('.stock__cover').attr('style')||'').match(/url\(['"]?([^)'"\s]+)/)?.[1],item.productUrl,'alpi')||imageUrl(item.image,item.productUrl,'alpi');
  const data={productUrl:item.productUrl,officialProductId:item.id,officialReference:reference,image,images:image?[image]:[],technicalSheetUrl:'',installationGuideUrl:'',drawingUrl:''};
  $('.product_download_list a[href]').each((_,el)=>{
    const url=official($(el).attr('href'),item.productUrl,'alpi'),label=norm($(el).text());if(!url)return;
    if(/DISEGNO|DRAWING|2D/.test(label))data.drawingUrl=url;
    if(/SCHEDA|TECNIC|TECH|FICHE/.test(label)&&/\.pdf(?:\?|$)/i.test(url))data.technicalSheetUrl=url;
    if(/INSTALL|ISTRUZ|MONTAG/.test(label))data.installationGuideUrl=url;
  });
  if(!data.technicalSheetUrl)data.technicalSheetUrl=data.drawingUrl;
  return data;
}
function parseSiraPage(html,url){
  const $=cheerio.load(html),title=$('h1.product_title,h1.entry-title').first().text().trim();
  const model=siraModels.find(x=>x.productUrl===url);
  if(!model||norm(title)!==norm(model.officialTitle||model.name))throw Error('Modèle de la fiche Sira incohérent');
  const colors=[];
  $('select[name*="color"] option[value]').each((_,el)=>{
    const label=$(el).text().trim(),code=label.match(/\(([A-Z]{2})\)/)?.[1],slug=$(el).attr('value');
    if(code&&slug)colors.push({code,label,slug});
  });
  const gallery=$('.woocommerce-product-gallery').first(),generic=imageUrl(gallery.find('img').first().attr('data-large_image')||gallery.find('img').first().attr('src'),url,'sira');
  const variants={};
  $('form.variations_form').each((_,el)=>{
    let rows=[];try{rows=JSON.parse($(el).attr('data-product_variations')||'[]');}catch{}
    if(!Array.isArray(rows))return;
    for(const v of rows){
      const color=colors.find(c=>Object.entries(v.attributes||{}).some(([key,value])=>/color/.test(key)&&value===c.slug));
      if(!color)continue;
      // WooCommerce attributes bind colour to image. Some official SKUs are duplicated (Bay/Glacier).
      const sku=String(v.sku||''),image=imageUrl(v.image?.src||v.image?.full_src,url,'sira');
      const images=[image,...(Array.isArray(v.additional_variation_images)?v.additional_variation_images:[]).map(x=>imageUrl(x.src||x.full_src,url,'sira'))].filter(Boolean);
      variants[color.code]={sku,variationId:v.variation_id,image,images:[...new Set(images)].slice(0,8),verified:!!image};
    }
  });
  // A variation must expose its own photograph, not a main image reused for every colour.
  const distinct=new Set(Object.values(variants).map(v=>v.image).filter(Boolean));
  for(const v of Object.values(variants))v.verified=v.verified&&distinct.size>1;
  const data={productUrl:url,title,code:model.code,generic,colors:colors.map(({code,label})=>({code,label})),variants,technicalSheetUrl:'',installationGuideUrl:''};
  $('a[href]').each((_,el)=>{
    const link=official($(el).attr('href'),url,'sira');if(!link||!/\.pdf(?:\?|$)/i.test(link))return;
    // Arctic sheets are shared by the four official Arctic configurations.
    const token=model.code.startsWith('AR')?'arctic':model.name.toLowerCase();
    if(!link.toLowerCase().includes(token))return;
    const label=norm($(el).text()+' '+link);
    if(/SPEC|TECH|FICHE|FICHA/.test(label))data.technicalSheetUrl=link;
    if(/INSTALL|MONTA|NOTICE/.test(label))data.installationGuideUrl=link;
  });
  return data;
}
function selectSira(data,p){
  const code=String(p.color||p.finishCode||p.siraConfiguration?.color||'').toUpperCase(),v=data.variants[code];
  const exact=!!v?.verified,image=exact?v.image:data.generic;
  return {...empty('Sira Concrete',p),productUrl:data.productUrl,title:data.title,image,images:exact?v.images:(image?[image]:[]),colors:data.colors,officialReference:v?.sku||'',variationId:exact?v.variationId:null,finishCode:code,finishMatch:image?(exact?'exact':'generic'):'unavailable',technicalSheetUrl:data.technicalSheetUrl,installationGuideUrl:data.installationGuideUrl,note:exact?'':image?'Visuel officiel générique ; pigment non garanti.':'Visuel officiel indisponible.'};
}
function parseGessiArticle(json,article){
  const product=json?.data?.product;
  if(String(product?.productId)!==article)throw Error('Article Gessi incohérent');
  const variants={};
  for(const v of product.productsConfigured||[]){
    const code=String(v.finiture?.finitureId||''),image=imageUrl(v.specificFeatureProductImg,'https://areapro.gessi.com/','gessi');
    if(code&&image)variants[code]={image,name:v.finiture?.finitureName||''};
  }
  return {article,variants};
}
function selectGessi(data,p){
  const finish=String(p.finishCode||String(p.reference||'').split('#')[1]||''),v=data.variants[finish];
  return {...empty('Gessi',p),productUrl:`https://areapro.gessi.com/fr/product/${data.article}?finId=${encodeURIComponent(finish)}`,image:v?.image||'',images:v?[v.image]:[],finishCode:finish,finish:v?.name||'',finishMatch:v?'exact':'unavailable',note:v?'':'Aucune photo officielle pour cette finition.'};
}
function legacyResult(data){
  const image=url=>({url,source:data.imageSource,finishMatch:data.finishMatch});
  const document=(url,label)=>url?{url,label,type:/\.pdf(?:\?|$)/i.test(url)?'pdf':'image'}:null;
  return {...data,source:data.imageSource,manufacturerUrl:data.productUrl,best:data.image?{...data.best,...image(data.image)}:null,images:data.images.map(image),drawing:data.drawing||document(data.drawingUrl,'Dessin coté officiel'),technicalSheet:data.technicalSheet||document(data.technicalSheetUrl,'Fiche technique officielle'),installationGuide:data.installationGuide||document(data.installationGuideUrl,'Notice officielle')};
}
class ManufacturerAssetResolver {
  constructor({request=axios.request,assertPublic=async()=>{},legacy,max=120,ttl}={}){
    this.legacy=legacy;this.request=request;this.assertPublic=assertPublic;this.pool=createPool();
    this.caches=Object.fromEntries(['alpi','gessi','sira'].map(name=>[name,new MetadataCache({max,ttl})]));
    this.adapters={alpi:this.alpi.bind(this),gessi:this.gessi.bind(this),sira:this.sira.bind(this)};
    this.sweep=setInterval(()=>Object.values(this.caches).forEach(c=>c.prune()),60000);this.sweep.unref?.();
  }
  close(){clearInterval(this.sweep);}
  stats(){return {...Object.fromEntries(Object.entries(this.caches).map(([name,c])=>[name,{entries:c.size,inFlight:c.pending.size,limit:c.max}])),requests:this.pool.stats()};}
  async read(url,family,body){
    let current=url;
    for(let redirects=0;redirects<4;redirects++){
      if(!hostAllowed(current,family))throw Error('Redirection hors du fabricant officiel');
      await this.assertPublic(current);
      const r=await this.request({url:current,method:body?'POST':'GET',data:body,timeout:18000,maxRedirects:0,maxContentLength:5*1024*1024,headers:{'User-Agent':`HydropolisStudio/${VERSION}`,'Accept':'application/json,text/html;q=0.9','Content-Type':body?'application/x-www-form-urlencoded':'text/plain'},validateStatus:s=>s>=200&&s<400});
      if(r.status>=300&&r.headers.location){current=new URL(r.headers.location,current).href;continue;}
      return r.data;
    }
    throw Error('Trop de redirections fabricant');
  }
  async resolve(family,p){
    if(this.adapters[family])return this.adapters[family](p);
    if(!this.legacy)throw Error('Fabricant non pris en charge');
    const data=await this.legacy(p);
    const clean=x=>{if(!x)return x;const {dataUrl,...metadata}=x;return metadata;};
    return {...data,version:VERSION,best:clean(data.best),productUrl:data.manufacturerUrl||p.manufacturerUrl,image:data.best?.url||'',images:(data.images||[]).map(x=>x.url).filter(Boolean),imageSource:data.best?.source||'',finishMatch:data.best?.finishMatch||'unavailable',technicalSheetUrl:data.technicalSheet?.url||'',installationGuideUrl:data.installationGuide?.url||'',drawingUrl:data.drawing?.url||''};
  }
  async alpi(p){
    const item=matchAlpi(p);if(!item)return empty('ALPI',p);
    let data={productUrl:item.productUrl,officialReference:item.reference,officialProductId:item.id,image:imageUrl(item.image,item.productUrl,'alpi')};data.images=data.image?[data.image]:[];
    if(p.imageOnly!==true){
      try{data=await this.caches.alpi.resolve(String(item.id),()=>this.pool(async()=>parseAlpiPopup(await this.read('https://alpirubinetterie.com/wp-admin/admin-ajax.php','alpi',new URLSearchParams({action:'webkolm_ajax_product_popup',post_id:item.id}).toString()),item)));}
      catch(e){data.documentStatus='unavailable';data.documentError=e.response?.status||'network';}
    }
    return {...empty('ALPI',p),...data,finishMatch:data.image?item.finishMatch:'unavailable',note:item.finishMatch==='exact'?'':'Visuel officiel générique du produit ; finition non garantie.'};
  }
  async sira(p){
    const url=p.productUrl||p.siraConfiguration?.productUrl||p.manufacturerUrl;
    const model=siraModels.find(x=>x.productUrl===url||x.code===p.modelCode);
    if(!model)return empty('Sira Concrete',p);
    const data=await this.caches.sira.resolve(model.code,()=>this.pool(async()=>parseSiraPage(await this.read(model.productUrl,'sira'),model.productUrl)));
    return selectSira(data,p);
  }
  async gessi(p){
    const article=String(p.reference||'').split('#')[0];if(!/^\d{4,8}$/.test(article))return empty('Gessi',p);
    const data=await this.caches.gessi.resolve(article,()=>this.pool(async()=>parseGessiArticle(await this.read(`https://g-ecatalogue-be-prod-we.azurewebsites.net/public/product/GetProductDetails?country=FR&language=fr&productCode=${article}`,'gessi'),article)));
    return selectGessi(data,p);
  }
}

// Optional proxy for exports/CORS; the interactive UI uses official URLs directly.
// Request cancellation and redirects are handled before any bytes are piped.
async function streamImage(url,req,res,{request=axios.request,validate=async()=>{},family}={}){
  const controller=new AbortController();let upstream;
  const abort=()=>{controller.abort();upstream?.data?.destroy();};
  req.once('aborted',abort);res.once('close',abort);
  try{
    let current=url;
    for(let i=0;i<5;i++){
      if(family&&!hostAllowed(current,family))throw Error('Redirection image hors fabricant');
      await validate(current);
      upstream=await request({url:current,responseType:'stream',signal:controller.signal,timeout:18000,maxRedirects:0,validateStatus:()=>true,headers:{'User-Agent':`HydropolisStudio/${VERSION}`,'Accept':'image/*'}});
      if(upstream.status>=300&&upstream.status<400&&upstream.headers.location){upstream.data.destroy();current=new URL(upstream.headers.location,current).href;continue;}
      if(upstream.status!==200){upstream.data.destroy();res.status(upstream.status===403?403:upstream.status===404?404:502).end();return;}
      const type=String(upstream.headers['content-type']||'').split(';')[0];
      if(!type.startsWith('image/')){upstream.data.destroy();res.status(415).end();return;}
      res.type(type).set('Cache-Control','public,max-age=86400');
      await new Promise((resolve,reject)=>pipeline(upstream.data,res,e=>e?reject(e):resolve()));return;
    }
    throw Error('Trop de redirections image');
  }catch(e){upstream?.data?.destroy();if(!res.headersSent&&!res.destroyed)res.status(502).end();}
  finally{req.off('aborted',abort);res.off('close',abort);upstream?.data?.destroy();}
}
function install(app,{assertPublic,validateRemote,legacy,request}={}){
  const resolver=new ManufacturerAssetResolver({assertPublic,legacy,request});
  app.locals.assetResolver=resolver;
  app.post('/api/manufacturer-image',async(req,res,next)=>{
    const maker=String(req.body?.manufacturer||'').toLowerCase(),family=maker==='sira concrete'?'sira':maker;
    if(!resolver.adapters[family]&&!legacy)return next();
    try{res.set('Cache-Control','no-store').json(legacyResult(await resolver.resolve(family,{...req.body,reference:req.body?.lookupReference||req.body?.reference})));}
    catch(e){res.status(e.status||502).json({error:`Source officielle ${family} indisponible`,status:e.response?.status||null});}
  });
  for(const family of ['alpi','gessi','sira'])app.get(`/api/${family}-assets`,async(req,res)=>{
    try{res.set('Cache-Control','no-store').json(await resolver.resolve(family,req.query));}
    catch(e){res.status(e.status||502).json({error:`Source officielle ${family} indisponible`,status:e.response?.status||null});}
  });
  app.get('/api/image-proxy',async(req,res)=>{
    const url=String(req.query.url||''),family=Object.keys(hosts).find(f=>hostAllowed(url,f));
    try{if(!/^https?:\/\//.test(url))return res.status(400).end();if(validateRemote)await validateRemote(url);}
    catch{return res.status(400).end();}
    return streamImage(url,req,res,{family,validate:validateRemote});
  });
  return resolver;
}
module.exports=install;
Object.assign(module.exports,{ManufacturerAssetResolver,matchAlpi,parseAlpiPopup,parseSiraPage,selectSira,parseGessiArticle,selectGessi,legacyResult,hostAllowed,streamImage});
