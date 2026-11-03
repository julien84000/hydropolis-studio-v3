/* Verified Coalbrook furniture product images by exact manufacturer SKU.
 * Compiled from official product-variant pages (Decimal, Shepherd, Farnolls).
 * Some producer pages use a different image code for Light Oak. We deliberately
 * do not certify those pictures as finish-exact; PDF images provide fallback.
 */
(function(root){
 'use strict';
 const paths=Array.from({length:5},(_,i)=>'/coalbrook-furniture-media-part-'+String(i).padStart(2,'0')+'.json');
 const records=new Map();
 function getSync(ref){
  const entry=records.get(String(ref||'').toUpperCase());
  return entry?{src:entry.url,finishMatch:'exact',imageSource:'Coalbrook · vue officielle du meuble '+entry.finish,
    illustratedWith:entry.illustratedWith||'',manufacturerUrl:entry.manufacturerUrl,finish:entry.finish}:null;
 }
 function apply(rows){
  let changed=0;
  for(const product of rows||[]){
   if(product?.manufacturer!=='Coalbrook')continue;
   const image=getSync(product.reference);
   if(!image)continue;
   product.image=image.src;
   product.imageFinishMatch='exact';
   product.imageSource=image.imageSource+(image.illustratedWith?' · vasque illustrative '+image.illustratedWith:'');
   product.manufacturerUrl=image.manufacturerUrl;
   product.coalbrookFurnitureIllustratedBasin=image.illustratedWith;
   changed++;
  }
  return changed;
 }
 const ready=Promise.all(paths.map(async path=>{
  const res=await fetch(path,{cache:'force-cache'});
  if(!res.ok)throw Error('Coalbrook furniture photo index '+path+' HTTP '+res.status);
  const json=await res.json();return json.images||{};
 })).then(parts=>{
  for(const part of parts)for(const [ref,data] of Object.entries(part)){
   if(!/^(?:DV|DT|SV|ST|FV|FT)[A-Z0-9]{4,10}$/.test(ref)||!data.url?.startsWith('https://coalbrook-bathrooms.transforms.svdcdn.com/production/images/'))continue;
   records.set(ref.toUpperCase(),data);
  }
  try{
   if(typeof CATALOG!=='undefined'&&Array.isArray(CATALOG))apply(CATALOG);
   if(typeof catalogIndex!=='undefined'&&typeof catalogIndex.maker==='function')apply(catalogIndex.maker('Coalbrook'));
   if(document.querySelector('#manufacturerFilter')?.value==='Coalbrook'&&typeof renderCatalog==='function')renderCatalog();
  }catch(e){console.warn('[Coalbrook furniture] Catalogue update deferred',e)}
  return records.size;
 }).catch(error=>{console.warn('[Coalbrook furniture] Official images unavailable',error);return 0});
 root.HydroCoalbrookFurnitureMedia={ready,getSync,get:ref=>ready.then(()=>getSync(ref)),apply,count:()=>records.size};
})(window);
