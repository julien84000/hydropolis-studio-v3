/* Hydropolis Hotbath: same-model photographic fallback and reversible finish preview.
 * Never changes supplier references, list prices, item images or customer uploads.
 * Original and simulated view are chosen on demand for project and client dossier.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHotbathFinishMedia=api;
})(typeof window==='object'?window:null,function(root){
'use strict';
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const SUPPORTED=new Set(['IX','CR','GN','WH','TB','BBP','BCP','MBP','BGP','AB','BB','AI']);
let index=null,loaded=false;
const own=Object.prototype.hasOwnProperty;
function hotbath(p){return /^Hotbath$/i.test(String(p?.manufacturer||''))}
function model(p){return String(p?.base||p?.reference||'').replace(/EXT\..*$/i,'').replace(/\.[A-Z0-9]{2,4}(?:\.IT)?$/i,'').trim()}
function finish(p){return String(p?.finishCode||String(p?.reference||'').match(/\.([A-Z0-9]{2,4})(?:\.IT)?$/i)?.[1]||'').toUpperCase()}
function isRemote(url){
 try{const u=new URL(String(url||''));return u.protocol==='https:'&&/(^|\.)hotbath\.(?:com|it)$|(^|\.)edilportale\.com$/i.test(u.hostname)}catch{return false}
}
function originalRemote(src){
 const s=String(src||'');
 if(isRemote(s))return s;
 if(s.startsWith('/api/image-proxy?')||s.startsWith('/api/finish-simulation?')){
  try{const raw=new URL('http://local.invalid'+s).searchParams.get('url');return isRemote(raw)?raw:''}catch{return ''}
 }
 return '';
}
function sameModel(url,modelCode){
 if(!url||!modelCode)return false;
 const s=originalRemote(url),m=clean(modelCode);
 if(!s||!m)return false;
 let u;try{u=new URL(s)}catch{return false}
 const name=decodeURIComponent(u.pathname.split('/').pop()||'');
 const stem=name.replace(/\.(?:jpe?g|png|webp|avif)$/i,'');
 if(/hotbath\.com$/i.test(u.hostname)){
  // Manufacturer's modern CDN includes the model folder. Reject neighbouring
  // references (CB010 vs CB010A), even if their finish looks identical.
  const a=u.pathname.match(/\/images\/compano\/([^/]+)\//i);
  return !!a&&clean(a[1])===m&&clean(stem).startsWith(m);
 }
 if(/hotbath\.it$/i.test(u.hostname)){
  if(!/\/documents\/+ProdCateg\/\d+\//i.test(u.pathname))return false;
  const id=String(modelCode).toUpperCase();
  return stem.toUpperCase()===id||stem.toUpperCase().startsWith(id+'_')||
    stem.toUpperCase().startsWith(id+'-');
 }
 if(/edilportale\.com$/i.test(u.hostname))
  return /^B_HOTBATH_/i.test(stem)&&
    stem.toUpperCase().includes('-'+String(modelCode).toUpperCase()+'_');
 return false;
}
function registerMedia(json){
 if(!json||typeof json!=='object')return false;
 index=json;loaded=true;return true;
}
function candidates(p){
 if(!hotbath(p))return [];
 const code=model(p),wanted=[String(p.hotbathSelectedCollection||''),...String(p.collection||'').split('/')].map(x=>x.trim()).filter(Boolean);
 const out=[],seen=new Set();
 const add=(src,scope)=>{
  const s=typeof src==='string'?src:String(src?.url||'');
  if(!sameModel(s,code)||seen.has(s))return;
  seen.add(s);out.push({src:s,scope});
 };
 // This supplier-specific RAY mapping is exact at model level, but can show
 // another finish; no finish is promoted to exact by filename alone.
 const ray=root?.HydroHotbathRay2026?.specification?.(code);
 if(ray?.photo)add(ray.photo,'model');
 for(const series of [...wanted,'Ray']){
  const label=Object.keys(index?.byCollection||{}).find(x=>clean(x)===clean(series));
  if(!label)continue;
  const dict=index.byCollection[label]||{};
  for(const [key,src] of Object.entries(dict))if(clean(key)===clean(code))add(src,'model');
  const overrides=index?.modernImageOverrides?.[label]||{};
  for(const [key,src] of Object.entries(overrides))if(clean(key)===clean(code))add(src,'model');
 }
 // Cross-collection reuse is permitted only for the identical manufacturer
 // model code. Do not fall back to a collection-cover or a similar family.
 for(const dict of Object.values(index?.byCollection||{}))
  for(const [key,src] of Object.entries(dict))if(clean(key)===clean(code))add(src,'model');
 return out;
}
function original(p){
 if(!hotbath(p))return null;
 const requested=String(p?.hotbathPhotoOriginal||'');
 // Customer-uploaded images stay untouched, even if they are not a supplier image.
 if(p.customImage&&typeof p.image==='string'&&p.image)
  return {src:p.image,scope:'custom',source:'Photo personnalisée'};
 if(requested&&(sameModel(requested,model(p))||requested.startsWith('data:')))
  return {src:requested,scope:p.imageFinishMatch==='exact'?'exact':'model',source:'Photo conservée du projet'};
 if(p.imageSimulation===true&&p.remoteImageUrl&&sameModel(p.remoteImageUrl,model(p)))
  return {src:p.remoteImageUrl,scope:'model',source:'Photo avant simulation'};
 if(p.image&&p.imageFinishMatch==='exact'&&sameModel(p.image,model(p)))
  return {src:p.image,scope:'exact',source:'Photo fabricant — finition exacte'};
 // A non-exact historic image is allowed only if its filename and supplier
 // folder unambiguously match this model; never use imageSource alone as proof.
 if(p.image&&!p.image.includes('/api/finish-simulation?')&&sameModel(p.image,model(p)))
  return {src:p.image,scope:'model',source:'Photo générique du même modèle'};
 const from=p.remoteImageUrl||'';
 if(sameModel(from,model(p)))return {src:from,scope:'model',source:'Photo générique du même modèle'};
 const chosen=candidates(p)[0];
 return chosen?{src:chosen.src,scope:'model',source:'Photo générique du même modèle'}:null;
}
function simulationSource(p){
 const o=original(p);
 return o&&!p.customImage?originalRemote(o.src):'';
}
function supports(p){
 return hotbath(p)&&SUPPORTED.has(finish(p))&&!!simulationSource(p);
}
function urlFor(p){
 if(!supports(p))return '';
 return '/api/finish-simulation?url='+encodeURIComponent(simulationSource(p))+
   '&finish='+encodeURIComponent(finish(p));
}
function isSimulation(p){
 return hotbath(p)&&(p.hotbathVisualMode==='simulation'||(p.hotbathVisualMode==null&&p.imageSimulation===true));
}
function view(p){
 const photo=original(p);
 if(!photo)return {src:'',simulated:false,scope:'none',caption:'Aucune photo vérifiée du modèle'};
 if(isSimulation(p)&&supports(p))
  return {src:urlFor(p),originalSrc:photo.src,scope:'simulation',simulated:true,
    caption:'Simulation de finition — rendu indicatif non contractuel'};
 const exact=photo.scope==='exact';
 return {src:photo.src,originalSrc:photo.src,scope:photo.scope,simulated:false,
   caption:exact?'Photo fabricant — finition exacte':photo.scope==='custom'?'Photo personnalisée':
    'Photo générique du même modèle — finition illustrative'};
}
function setMode(p,mode){
 if(!hotbath(p)||!['photo','simulation'].includes(mode))return false;
 if(mode==='simulation'&&!supports(p))return false;
 p.hotbathVisualMode=mode;
 // Legacy flag is used by the dossier disclaimer; it does not mean that
 // p.image itself was changed.
 p.imageSimulation=mode==='simulation';
 return true;
}
async function load(){
 if(loaded)return true;
 if(!root||typeof root.fetch!=='function')return false;
 try{
  const r=await root.fetch('/brand-guide-hotbath-media.json?v=__APP_VERSION__',{cache:'force-cache'});
  if(!r.ok)throw Error('Hotbath photo index '+r.status);
  registerMedia(await r.json());
  try{root.dispatchEvent(new Event('hydro-hotbath-media-ready'))}catch{}
  return true;
 }catch(e){try{console.warn('[Hotbath generic photos]',e)}catch{}return false}
}
if(root&&typeof document!=='undefined')void load();
return {hotbath,model,finish,sameModel,registerMedia,load,original,view,simulationSource,
  supports,urlFor,isSimulation,setMode,candidates,originalRemote,SUPPORTED};
});
