/* Bette official MODEL photography in Hydropolis.
 * No model-level photo or manufacturer default 3D link is proof of an exact
 * Hydropolis colour, dimension, finish or supplier SKU match. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroBetteOfficialMedia=api;})(typeof window==='object'?window:null,function(root){
'use strict';
const cache=new Map();
function trustedPhoto(value){
 try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='content.my-bette.com'&&
  u.pathname.startsWith('/produkt_bilder/')&&/\.(webp|png|jpe?g)$/i.test(u.pathname);}
 catch{return false;}
}
function trustedPage(value){
 try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='www.my-bette.com'&&
  /^\/fr\/produit\/[a-z0-9-]+\/[a-z0-9-]+\/?$/.test(u.pathname);}
 catch{return false;}
}
function trustedConfigurator(value){
 try{
  const u=new URL(value);return u.protocol==='https:'&&u.hostname==='www.my-bette.com'&&u.pathname==='/fr/configurator'&&
   /^\d+$/.test(u.searchParams.get('product')||'')&&/^\d+$/.test(u.searchParams.get('variant')||'');
 }catch{return false}
}
function normalize(value){
 if(!value||value.ok!==true||value.scope!=='model-only'||value.skuExact!==false||
  !trustedPhoto(value.image)||!trustedPage(value.page))return null;
 return {name:String(value.name||'').slice(0,120),image:value.image,page:value.page,scope:'model-only',skuExact:false,
  configurator:trustedConfigurator(value.configurator)?value.configurator:'',warning:String(value.warning||'').slice(0,200)};
}
async function lookup(category,model,family='',{fetcher=root?.fetch}={}){
 if(!['baths','showers','basins'].includes(category)||!model||model.length>110||family.length>110||!fetcher)return null;
 const key=[category,model,family].join('|');
 if(cache.has(key))return cache.get(key);
 const promise=(async()=>{
  try{
   const url='/api/bette-model-media?category='+encodeURIComponent(category)+'&model='+encodeURIComponent(model)+'&family='+encodeURIComponent(family);
   const response=await fetcher(url,{credentials:'same-origin'});
   if(!response.ok)return null;
   return normalize(await response.json());
  }catch{return null;}
 })();
 cache.set(key,promise);
 const result=await promise;
 if(!result)cache.delete(key);
 return result;
}
function reset(){cache.clear();}
return {lookup,normalize,trustedPhoto,trustedPage,trustedConfigurator,reset};
});