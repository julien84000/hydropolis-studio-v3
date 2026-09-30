'use strict';
const axios=require('axios');
const cheerio=require('cheerio');

const cache=new Map();
const TTL=6*60*60*1000;
const UA='Mozilla/5.0 (compatible; HydropolisStudio/11.56; +https://hydropolis-studio-v3.onrender.com)';
const ALPI='alpirubinetterie.com', SIRA='siraconcrete.com';
const GESSI_HOSTS=new Set(['areapro.gessi.com','gessi.com','www.gessi.com','gessistorage.blob.core.windows.net','gwebassets.gessi.com']);

function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]/gi,'').toUpperCase();}
function hostAllowed(raw,family){try{const h=new URL(raw).hostname.toLowerCase();if(family==='alpi')return h===ALPI||h.endsWith('.'+ALPI);if(family==='sira')return h===SIRA||h.endsWith('.'+SIRA);if(family==='gessi')return GESSI_HOSTS.has(h)||h.endsWith('.gessi.com');return false;}catch{return false;}}
function abs(raw,base){try{return new URL(String(raw||'').trim(),base).toString();}catch{return '';}}
function uniq(a){return [...new Set(a.filter(Boolean))];}
function cacheGet(k){const v=cache.get(k);if(v&&Date.now()-v.t<TTL)return v.v;if(v)cache.delete(k);return null;}
function cacheSet(k,v){cache.set(k,{t:Date.now(),v});while(cache.size>300)cache.delete(cache.keys().next().value);return v;}
async function html(url){const r=await axios.get(url,{timeout:18000,maxRedirects:4,headers:{'User-Agent':UA,'Accept-Language':'fr-FR,fr;q=0.9,en;q=0.7'}});return String(r.data||'');}
function imgUrls($,node,base){const out=[];$(node).find('img').addBack('img').each((_,el)=>{for(const a of ['src','data-src','data-lazy-src','data-original']){const v=$(el).attr(a);if(v)out.push(abs(v,base));}for(const a of ['srcset','data-srcset']){const v=$(el).attr(a);if(v)String(v).split(',').forEach(x=>out.push(abs(x.trim().split(/\s+/)[0],base)));}});return uniq(out);}
function docUrls($,node,base){const out=[];$(node).find('a[href]').addBack('a[href]').each((_,el)=>{const href=abs($(el).attr('href'),base);const txt=norm($(el).text()+' '+($(el).attr('title')||''));if(/\.pdf(?:$|\?)/i.test(href)||/(TECH|TECN|SCHEM|DRAW|INSTALL|MONTAG|ISTRUZ|FICHE)/.test(txt))out.push(href);});return uniq(out);}
function badImage(u){return /(logo|favicon|icon|sprite|placeholder|loader|flag|swatch|campion|texture)/i.test(u||'');}
function scoreImage(u,context,ref,finish){let s=0;const n=norm(u),c=norm(context);if(ref&&(n.includes(ref)||c.includes(ref)))s+=80;if(finish&&(n.includes(finish)||c.includes(finish)))s+=30;if(/product|prodot|producto|rubinet|lavab|mixer|basin|shower|vasc|bath/i.test(u+' '+context))s+=8;if(/thumb|150x|300x|small/i.test(u))s-=8;if(badImage(u))s-=100;return s;}
function nearestRefBlock($,ref){let best=null,bestScore=-1;$('body *').each((_,el)=>{const t=norm($(el).text());if(!t||!t.includes(ref))return;let node=el;for(let depth=0;node&&depth<7;depth++,node=$(node).parent()[0]){const count=$(node).find('img').length;const text=norm($(node).text());let score=100-depth*8+Math.min(count,4)*6-Math.min(text.length/1500,20);if(text===ref)score+=20;if(score>bestScore){bestScore=score;best=node;}}});return best;}

async function alpiResolve({reference,page,finish}){
 const ref=norm(reference), fin=norm(finish), url=hostAllowed(page,'alpi')?page:'https://alpirubinetterie.com/fr/produits/';
 const key='a|'+ref+'|'+fin+'|'+url;const hit=cacheGet(key);if(hit)return hit;
 const body=await html(url),$=cheerio.load(body),node=nearestRefBlock($,ref);
 if(!node)return cacheSet(key,{ok:false,source:'ALPI officiel',productUrl:url,images:[],documents:[],match:'none'});
 const context=$(node).text();let images=imgUrls($,node,url).filter(x=>hostAllowed(x,'alpi')&&!badImage(x));
 images=images.map(u=>({u,s:scoreImage(u,context,ref,fin)})).filter(x=>x.s>=60).sort((a,b)=>b.s-a.s).map(x=>x.u);
 const documents=docUrls($,node,url).filter(x=>hostAllowed(x,'alpi'));
 const allLinks=[];$(node).find('a[href]').addBack('a[href]').each((_,el)=>{const u=abs($(el).attr('href'),url);if(hostAllowed(u,'alpi'))allLinks.push(u);});
 const productUrl=uniq(allLinks).find(u=>/prodot|product|specifiche|schede/i.test(u))||url;
 return cacheSet(key,{ok:images.length>0,source:'ALPI officiel',productUrl,images:uniq(images),image:images[0]||'',documents,technicalSheetUrl:documents[0]||'',match:images.length?'exact-reference':'none'});
}

function parseWooVariations($,base){const out=[];$('[data-product_variations]').each((_,el)=>{let raw=$(el).attr('data-product_variations');if(!raw)return;raw=raw.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&');try{const rows=JSON.parse(raw);for(const r of rows||[]){const attrs=r.attributes||{},label=Object.values(attrs).join(' '),im=r.image||{};const src=abs(im.full_src||im.src||'',base);if(src)out.push({label,code:norm(label),src});}}catch{}});return out;}
async function siraResolve(url){
 if(!hostAllowed(url,'sira'))throw new Error('URL Sira non officielle');const key='s|'+url;const hit=cacheGet(key);if(hit)return hit;
 const body=await html(url),$=cheerio.load(body),title=($('h1').first().text()||$('title').text()).trim();
 const variations=parseWooVariations($,url);const images=uniq([...variations.map(v=>v.src),...imgUrls($,$('main, .product, .woocommerce-product-gallery').first(),url)]).filter(x=>hostAllowed(x,'sira')&&!badImage(x));
 const imagesByColor={};for(const v of variations){const m=String(v.label||'').match(/\(([A-Z]{2})\)/i);if(m)imagesByColor[m[1].toUpperCase()]=v.src;const code=norm(v.label);if(code)imagesByColor[code]=v.src;}
 const colors=[];$('select option, .variations option').each((_,el)=>{const label=$(el).text().trim(),value=$(el).attr('value')||'';if(!label||/choose|elige|scegli|choisir/i.test(label))return;const m=label.match(/\(([A-Z]{2})\)/);colors.push({code:m?m[1]:value||label,label});});
 const docs=docUrls($,$('main, body').first(),url).filter(x=>hostAllowed(x,'sira'));
 return cacheSet(key,{url,title,primaryImage:images[0]||'',images,imagesByColor,colors:colors.filter((x,i,a)=>a.findIndex(y=>y.code===x.code)===i),technicalSheetUrl:docs[0]||'',technicalSheetLabel:'Fiche technique Sira',options:[],source:'Sira Concrete officiel'});
}

async function gessiResolve(reference,finish){
 let article=String(reference||'').split('#')[0].replace(/\D/g,''),fin=String(finish||String(reference||'').split('#')[1]||'').replace(/\D/g,'');
 if(!article)throw new Error('Référence Gessi manquante');const page=`https://areapro.gessi.com/fr/product/${article}${fin?`?finId=${encodeURIComponent(fin)}`:''}`;const key='g|'+article+'|'+fin;const hit=cacheGet(key);if(hit)return hit;
 const body=await html(page),$=cheerio.load(body),candidates=[];
 const add=u=>{u=abs(u,page);if(u&&hostAllowed(u,'gessi')&&!badImage(u))candidates.push(u);};
 $('img').each((_,el)=>{add($(el).attr('src'));String($(el).attr('srcset')||'').split(',').forEach(x=>add(x.trim().split(/\s+/)[0]));});
 const rx=/https?:\\?\/\\?\/[^"'<>\s]+\.(?:jpe?g|png|webp)(?:\?[^"'<>\s]*)?/gi;for(const m of body.match(rx)||[])add(m.replace(/\\\//g,'/'));
 const ref=norm(article),f=norm(fin);let images=uniq(candidates).map(u=>({u,s:scoreImage(u,'',ref,f)})).sort((a,b)=>b.s-a.s).map(x=>x.u);
 const docs=docUrls($,$('body'),page).filter(x=>hostAllowed(x,'gessi'));
 return cacheSet(key,{ok:images.length>0,source:'Gessi Area Pro officiel',productUrl:page,image:images[0]||'',images,technicalSheetUrl:docs[0]||'',match:images.length?'official-product-page':'none'});
}

module.exports=function installOfficialAssets(app){
 app.get('/api/v1156/alpi-assets',async(req,res)=>{try{res.json(await alpiResolve({reference:req.query.reference,page:req.query.page,finish:req.query.finish}));}catch(e){console.error('[v1156 ALPI]',e.message);res.status(502).json({error:e.message,images:[]});}});
 app.get('/api/sira-product-v1154',async(req,res)=>{try{res.json(await siraResolve(String(req.query.url||'')));}catch(e){console.error('[v1156 SIRA]',e.message);res.status(502).json({error:e.message,images:[]});}});
 app.get('/api/v1156/gessi-assets',async(req,res)=>{try{res.json(await gessiResolve(req.query.reference,req.query.finishCode||req.query.finish));}catch(e){console.error('[v1156 GESSI]',e.message);res.status(502).json({error:e.message,images:[]});}});
 app.get('/api/v1156/official-image',async(req,res)=>{try{const u=String(req.query.url||''),family=String(req.query.family||'');if(!hostAllowed(u,family))return res.status(403).send('Source non autorisée');const r=await axios.get(u,{responseType:'arraybuffer',timeout:18000,headers:{'User-Agent':UA}});res.type(r.headers['content-type']||'image/jpeg');res.set('Cache-Control','public,max-age=86400');res.send(Buffer.from(r.data));}catch(e){res.status(502).send('Image officielle indisponible');}});
};
