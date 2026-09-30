'use strict';
/* Hydropolis Studio V11.56 — official manufacturer asset resolver */
(function(){
 const MARK='V11.56_OFFICIAL_ASSETS';if(window[MARK])return;window[MARK]=true;
 let base=null;
 function maker(p){return String(p&&p.manufacturer||'').toLowerCase();}
 function prox(u,f){return u?`/api/v1156/official-image?family=${f}&url=${encodeURIComponent(u)}`:'';}
 function cache(p,d){try{if(typeof manufacturerCacheKey==='function'&&typeof manufacturerImageCache!=='undefined'){manufacturerImageCache[manufacturerCacheKey(p)]=d;if(typeof saveManufacturerCache==='function')saveManufacturerCache();}}catch{}}
 function purge(){try{if(typeof manufacturerImageCache==='undefined')return;let ch=false;for(const k of Object.keys(manufacturerImageCache||{})){if(/^(Gessi|Sira Concrete)\|/i.test(k)){delete manufacturerImageCache[k];ch=true;}}if(ch&&typeof saveManufacturerCache==='function')saveManufacturerCache();}catch{}}
 async function gessi(p){const ref=String(p.reference||p.base||''),finish=String(p.finishCode||((ref.split('#')[1]||'')));const r=await fetch(`/api/v1156/gessi-assets?${new URLSearchParams({reference:ref,finishCode:finish})}`);if(!r.ok)throw new Error('Resolver Gessi indisponible');const d=await r.json(),remote=d.images||[];const x={src:prox(d.image||remote[0]||'','gessi'),images:remote.map(u=>prox(u,'gessi')),remoteUrl:d.image||remote[0]||'',remoteImages:remote,resolvedManufacturerUrl:d.productUrl||p.manufacturerUrl||'',technicalSheetUrl:d.technicalSheetUrl||'',source:'Gessi Area Pro officiel',match:d.match||'none'};cache(p,x);return x;}
 function install(){if(base||typeof fetchManufacturerImage!=='function')return;base=fetchManufacturerImage;fetchManufacturerImage=async function(p,force=false,opts={}){const m=maker(p);if(m==='gessi'){if(!force&&typeof cachedManufacturerImage==='function'){const c=cachedManufacturerImage(p);if(c&&c.src&&/Gessi Area Pro officiel/.test(String(c.source||'')))return c;}return gessi(p);}return base(p,force,opts);};}
 purge();install();setTimeout(install,500);
})();
