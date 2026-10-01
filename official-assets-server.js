'use strict';
const axios=require('axios');
const cheerio=require('cheerio');

const CACHE=new Map();
const TTL=2*60*60*1000;
const MAX_CACHE_ENTRIES=120;
const UA='Mozilla/5.0 (compatible; HydropolisStudio/11.56.0; +https://hydropolis-studio-v3.onrender.com)';
const ALPI_HOST='alpirubinetterie.com';
const SIRA_HOST='siraconcrete.com';
const GESSI_HOSTS=new Set(['areapro.gessi.com','gessi.com','www.gessi.com','gessistorage.blob.core.windows.net','gwebassets.gessi.com']);

function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]/gi,'').toUpperCase();}
function hostAllowed(raw,family){
  try{
    const h=new URL(raw).hostname.toLowerCase();
    if(family==='alpi')return h===ALPI_HOST||h.endsWith('.'+ALPI_HOST);
    if(family==='sira')return h===SIRA_HOST||h.endsWith('.'+SIRA_HOST);
    if(family==='gessi')return GESSI_HOSTS.has(h)||h.endsWith('.gessi.com');
    return false;
  }catch{return false;}
}
function officialFamilyForUrl(raw){
  if(hostAllowed(raw,'alpi'))return 'alpi';
  if(hostAllowed(raw,'sira'))return 'sira';
  if(hostAllowed(raw,'gessi'))return 'gessi';
  return '';
}
function abs(raw,base){try{return new URL(String(raw||'').trim(),base).toString();}catch{return '';}}
function uniq(rows){return [...new Set((rows||[]).filter(Boolean))];}
function cacheGet(key){const hit=CACHE.get(key);if(hit&&Date.now()-hit.at<TTL)return hit.value;if(hit)CACHE.delete(key);return null;}
function cacheSet(key,value){
  CACHE.set(key,{at:Date.now(),value});
  while(CACHE.size>MAX_CACHE_ENTRIES)CACHE.delete(CACHE.keys().next().value);
  return value;
}
async function fetchHtml(url){
  const r=await axios.get(url,{timeout:15000,maxRedirects:4,maxContentLength:4*1024*1024,maxBodyLength:4*1024*1024,headers:{'User-Agent':UA,'Accept-Language':'fr-FR,fr;q=0.9,it;q=0.8,en;q=0.6','Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'}});
  return String(r.data||'');
}
function badImage(url){return /(logo|favicon|icon|sprite|placeholder|loader|loading|flag|swatch|campion|texture|cookie|social)/i.test(String(url||''));}
function imageUrls($,node,base){
  const out=[];
  $(node).find('img').addBack('img').each((_,el)=>{
    const e=$(el);
    for(const a of ['data-large_image','data-original','data-lazy-src','data-src','src']){const v=e.attr(a);if(v)out.push(abs(v,base));}
    for(const a of ['srcset','data-srcset']){const v=e.attr(a);if(v)String(v).split(',').forEach(x=>out.push(abs(x.trim().split(/\s+/)[0],base)));}
  });
  return uniq(out);
}
function documentUrls($,node,base,family){
  const out=[];
  $(node).find('a[href]').addBack('a[href]').each((_,el)=>{
    const e=$(el),href=abs(e.attr('href'),base),label=norm(`${e.text()} ${e.attr('title')||''} ${href}`);
    if(!hostAllowed(href,family))return;
    if(/\.pdf(?:$|[?#])/i.test(href)||/(TECH|TECN|SCHEM|DRAW|INSTALL|MONTAG|ISTRUZ|FICHE|DOWNLOAD)/.test(label))out.push(href);
  });
  return uniq(out);
}
function nearestReferenceBlock($,reference){
  const wanted=norm(reference);if(!wanted)return null;
  let best=null,bestScore=-Infinity;
  $('body *').each((_,el)=>{
    const text=norm($(el).text());
    if(!text||!text.includes(wanted))return;
    let node=el;
    for(let depth=0;node&&depth<8;depth++,node=$(node).parent()[0]){
      const textNode=norm($(node).text());
      const imgs=$(node).find('img').length;
      const links=$(node).find('a[href]').length;
      let score=120-depth*10+Math.min(imgs,6)*8+Math.min(links,6)*2-Math.min(textNode.length/1800,25);
      if(textNode===wanted)score+=35;
      if(imgs===0)score-=20;
      if(score>bestScore){bestScore=score;best=node;}
    }
  });
  return best;
}

const ALPI_COLLECTIONS={
  allen:'allen',vero:'vero',nu:'nu',portofino:'portofino','le grand':'le-grand',legrand:'le-grand',london:'london',ginger:'ginger',gum:'gum',blue:'blue',steele:'steele',"steel'e":'steele',una18:'una18',aura:'aura',samon:'samon',shower:'shower-set','shower set':'shower-set','wc toilet':'wc-toilet'
};
function alpiCollectionUrl(collection,reference){
  const raw=String(collection||'').trim().toLowerCase();
  let slug=ALPI_COLLECTIONS[raw]||ALPI_COLLECTIONS[raw.replace(/[^a-z0-9]+/g,' ')]||'';
  const ref=norm(reference);
  if(!slug){
    if(/^AL/.test(ref))slug='allen';else if(/^VR/.test(ref))slug='vero';else if(/^NU/.test(ref))slug='nu';else if(/^PO/.test(ref))slug='portofino';else if(/^LG/.test(ref))slug='le-grand';else if(/^LO/.test(ref))slug='london';else if(/^GN/.test(ref))slug='ginger';else if(/^GUM/.test(ref))slug='gum';else if(/^(BU|BPR)/.test(ref))slug='blue';else if(/^TEE/.test(ref))slug='steele';else if(/^UN/.test(ref))slug='una18';
  }
  return slug?`https://alpirubinetterie.com/fr/collezioni/${slug}/`:'';
}
function alpiCandidatePages({manufacturerUrl,collection,reference}){
  const out=[];
  if(hostAllowed(manufacturerUrl,'alpi'))out.push(manufacturerUrl);
  out.push(alpiCollectionUrl(collection,reference));
  out.push('https://alpirubinetterie.com/fr/produits/');
  out.push('https://alpirubinetterie.com/prodotti/');
  return uniq(out.filter(x=>hostAllowed(x,'alpi')));
}
function scoreAlpiImage(url,context,reference,finishCode){
  const ref=norm(reference),base=ref.replace(/[A-Z]{2,4}$/,'');
  const hay=norm(`${url} ${context}`),u=String(url||'');
  let s=0;
  if(ref&&hay.includes(ref))s+=120;
  if(base&&base.length>=4&&hay.includes(base))s+=55;
  if(finishCode&&hay.includes(norm(finishCode)))s+=30;
  if(/wp-content\/uploads/i.test(u))s+=12;
  if(/product|prodot|rubinet|lavab|mixer|basin|shower|vasc|bath/i.test(`${u} ${context}`))s+=8;
  if(/(?:150x|300x|thumb|thumbnail|small)/i.test(u))s-=12;
  if(badImage(u))s-=200;
  return s;
}
async function alpiResolve(input){
  const reference=String(input.reference||'').trim();
  const ref=norm(reference),finishCode=norm(input.finishCode||input.finish||'');
  if(!ref)throw new Error('Référence ALPI manquante');
  const key=`alpi|${ref}|${finishCode}|${norm(input.collection)}`;const cached=cacheGet(key);if(cached)return cached;
  let found=null;
  for(const page of alpiCandidatePages(input)){
    try{
      const html=await fetchHtml(page),$=cheerio.load(html),node=nearestReferenceBlock($,reference);
      if(!node)continue;
      const context=$(node).text();
      let images=imageUrls($,node,page).filter(u=>hostAllowed(u,'alpi')&&!badImage(u));
      images=images.map(url=>({url,source:'alpi-official-reference-block',score:scoreAlpiImage(url,context,reference,finishCode)})).filter(x=>x.score>=45).sort((a,b)=>b.score-a.score);
      const links=[];$(node).find('a[href]').addBack('a[href]').each((_,el)=>{const u=abs($(el).attr('href'),page);if(hostAllowed(u,'alpi'))links.push(u);});
      const productUrl=uniq(links).find(u=>/specifiche_tecniche|schede|prodot|product/i.test(u))||page;
      let docs=documentUrls($,node,page,'alpi');
      if(productUrl!==page){
        try{
          const detailHtml=await fetchHtml(productUrl),$d=cheerio.load(detailHtml);
          const detailNode=nearestReferenceBlock($d,reference)||$d('body');
          const extraImages=imageUrls($d,detailNode,productUrl).filter(u=>hostAllowed(u,'alpi')&&!badImage(u)).map(url=>({url,source:'alpi-official-detail',score:scoreAlpiImage(url,$d(detailNode).text(),reference,finishCode)+20}));
          images=[...images,...extraImages].sort((a,b)=>b.score-a.score);
          docs=uniq([...docs,...documentUrls($d,detailNode,productUrl,'alpi')]);
        }catch(e){console.warn('[ALPI detail]',reference,e.message);}
      }
      const seen=new Set();images=images.filter(x=>x.url&&!seen.has(x.url)&&(seen.add(x.url),true)).slice(0,8);
      if(images.length||docs.length){found={page,productUrl,images,docs};break;}
    }catch(e){console.warn('[ALPI page]',page,e.message);}
  }
  if(!found)return cacheSet(key,{manufacturerUrl:alpiCollectionUrl(input.collection,reference)||'https://alpirubinetterie.com/fr/produits/',reference,finishCode,best:null,images:[],technicalSheet:null,exactFound:false,note:'Aucun visuel officiel ALPI exploitable trouvé pour cette référence.'});
  const images=found.images.slice(0,6).map(x=>({...x,finishMatch:finishCode&&norm(x.url).includes(finishCode)?'exact':'generic'}));
  const best=images[0]||null;
  const technicalSheet=found.docs[0]?{url:found.docs[0],label:'Fiche technique ALPI',type:/\.pdf(?:$|[?#])/i.test(found.docs[0])?'pdf':'link'}:null;
  return cacheSet(key,{manufacturerUrl:found.productUrl||found.page,reference,finishCode,best,images,technicalSheet,exactFound:!!best,note:best?'Visuel officiel ALPI résolu sans mise en mémoire de l’image.':'Référence ALPI trouvée, mais aucun visuel officiel exploitable n’a été extrait.'});
}

function scoreGessiImage(url,article,finish){
  const hay=norm(url);let s=0;
  if(article&&hay.includes(norm(article)))s+=120;
  if(finish&&hay.includes(norm(finish)))s+=50;
  if(/gessistorage|gwebassets/i.test(url))s+=25;
  if(/thumb320/i.test(url))s-=5;
  if(badImage(url))s-=200;
  return s;
}
async function gessiResolve(input){
  const raw=String(input.reference||input.base||'').trim();
  const parts=raw.split('#');
  const article=String(parts[0]||'').replace(/\D/g,'');
  const finish=String(input.finishCode||parts[1]||'').replace(/\D/g,'');
  if(!article)throw new Error('Référence Gessi manquante');
  const page=`https://areapro.gessi.com/fr/product/${article}${finish?`?finId=${encodeURIComponent(finish)}`:''}`;
  const key=`gessi|${article}|${finish}`;const cached=cacheGet(key);if(cached)return cached;
  const body=await fetchHtml(page),$=cheerio.load(body),candidates=[];
  const add=rawUrl=>{const url=abs(String(rawUrl||'').replace(/\\\//g,'/'),page);if(url&&hostAllowed(url,'gessi')&&!badImage(url))candidates.push(url);};
  if(finish)add(`https://gessistorage.blob.core.windows.net/zi4/thumb320/${article}%23${finish}.webp`);
  $('img').each((_,el)=>{const e=$(el);for(const a of ['data-large_image','data-src','src'])add(e.attr(a));for(const a of ['srcset','data-srcset'])String(e.attr(a)||'').split(',').forEach(x=>add(x.trim().split(/\s+/)[0]));});
  const rx=/https?:\\?\/\\?\/[^"'<>\s]+\.(?:jpe?g|png|webp)(?:\?[^"'<>\s]*)?/gi;for(const m of body.match(rx)||[])add(m);
  const images=uniq(candidates).map(url=>({url,source:/gessistorage/i.test(url)?'gessi-official-storage':'gessi-area-pro',score:scoreGessiImage(url,article,finish)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>({...x,finishMatch:finish&&norm(x.url).includes(norm(finish))?'exact':'generic'}));
  const docs=documentUrls($,$('body'),page,'gessi');
  const best=images[0]||null;
  const technicalSheet=docs[0]?{url:docs[0],label:'Fiche technique Gessi',type:/\.pdf(?:$|[?#])/i.test(docs[0])?'pdf':'link'}:null;
  return cacheSet(key,{manufacturerUrl:page,reference:raw,finishCode:finish,best,images,technicalSheet,exactFound:!!best,note:best?'Visuel officiel Gessi résolu sans mise en mémoire de l’image.':'Aucun visuel Gessi exploitable trouvé sur la fiche Area Pro.'});
}

function parseWooVariations($,base){
  const out=[];
  $('[data-product_variations]').each((_,el)=>{
    let raw=$(el).attr('data-product_variations');if(!raw)return;
    raw=raw.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&');
    try{for(const row of JSON.parse(raw)||[]){const label=Object.values(row.attributes||{}).join(' '),im=row.image||{},src=abs(im.full_src||im.src||'',base);if(src)out.push({label,code:norm(label),src});}}catch{}
  });
  return out;
}
async function siraResolve(url){
  if(!hostAllowed(url,'sira'))throw new Error('URL Sira non officielle');
  const key=`sira|${url}`;const cached=cacheGet(key);if(cached)return cached;
  const body=await fetchHtml(url),$=cheerio.load(body),title=($('h1').first().text()||$('title').text()).trim();
  const variations=parseWooVariations($,url);
  const main=$('.woocommerce-product-gallery, .product-images, .product-gallery, main .product, article.product').first();
  const images=uniq([...variations.map(v=>v.src),...imageUrls($,main.length?main:$('main').first(),url)]).filter(x=>hostAllowed(x,'sira')&&!badImage(x));
  const imagesByColor={};
  for(const v of variations){const m=String(v.label||'').match(/\(([A-Z]{2})\)/i);if(m)imagesByColor[m[1].toUpperCase()]=v.src;const code=norm(v.label);if(code)imagesByColor[code]=v.src;}
  const colors=[];$('select option, .variations option').each((_,el)=>{const label=$(el).text().trim(),value=$(el).attr('value')||'';if(!label||/choose|elige|scegli|choisir/i.test(label))return;const m=label.match(/\(([A-Z]{2})\)/);colors.push({code:m?m[1].toUpperCase():value||label,label});});
  const docs=documentUrls($,$('main, body').first(),url,'sira');
  return cacheSet(key,{url,title,primaryImage:images[0]||'',images:images.slice(0,16),imagesByColor,colors:colors.filter((x,i,a)=>a.findIndex(y=>y.code===x.code)===i),technicalSheetUrl:docs[0]||'',technicalSheetLabel:'Fiche technique Sira',options:[],source:'Sira Concrete officiel'});
}

async function streamOfficialImage(rawUrl,req,res,next){
  const family=officialFamilyForUrl(rawUrl);
  if(!family)return next();
  try{
    const upstream=await axios.get(rawUrl,{responseType:'stream',timeout:15000,maxRedirects:4,headers:{'User-Agent':UA,'Accept':'image/avif,image/webp,image/apng,image/*,*/*;q=0.8','Referer':req.get('referer')||undefined}});
    const ct=String(upstream.headers?.['content-type']||'').split(';')[0].toLowerCase();
    if(!ct.startsWith('image/')){upstream.data?.destroy?.();return res.status(415).send('Ressource distante non image');}
    res.type(ct);
    res.set('Cache-Control','public,max-age=86400,stale-while-revalidate=604800');
    if(upstream.headers?.['content-length'])res.set('Content-Length',String(upstream.headers['content-length']));
    upstream.data.on('error',err=>{console.warn(`[official-image-stream ${family}]`,err.message);if(!res.headersSent)res.status(502).end();else res.destroy();});
    upstream.data.pipe(res);
  }catch(e){
    console.warn(`[official-image-stream ${family}]`,e.message);
    if(!res.headersSent)res.status(e.response?.status===404?404:502).send('Image officielle indisponible');
  }
}

module.exports=function installOfficialAssets(app){
  // Intercepte uniquement les domaines officiels pris en charge et streame l'image :
  // aucun Buffer/Base64 n'est conservé dans le heap Node.
  app.get('/api/image-proxy',(req,res,next)=>{
    const raw=String(req.query.url||'').trim();
    if(!raw||!/^https?:\/\//i.test(raw))return next();
    return streamOfficialImage(raw,req,res,next);
  });

  app.post('/api/manufacturer-image',async(req,res,next)=>{
    const maker=String(req.body?.manufacturer||'').trim().toLowerCase();
    if(maker!=='alpi'&&maker!=='gessi')return next();
    try{
      const input={...req.body,reference:req.body?.lookupReference||req.body?.reference};
      const result=maker==='alpi'?await alpiResolve(input):await gessiResolve(input);
      result.displayReference=req.body?.reference||input.reference;
      result.lookupReference=input.reference;
      res.set('Cache-Control','no-store').json(result);
    }catch(e){
      console.error(`[official-assets ${maker}]`,e.message);
      res.status(502).json({error:`Resolver officiel ${maker} indisponible`,detail:e.message});
    }
  });

  app.get('/api/sira-product-v1154',async(req,res,next)=>{
    const url=String(req.query.url||'').trim();
    if(!url)return next();
    try{res.set('Cache-Control','no-store').json(await siraResolve(url));}
    catch(e){console.error('[official-assets sira]',e.message);res.status(502).json({error:'Visuel Sira officiel indisponible',detail:e.message,images:[]});}
  });
};
