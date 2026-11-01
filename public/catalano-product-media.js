/* Client-side Catalano manufacturer SKU photos.
 * Only exact reference, or same manufacturer base + same type + same collection.
 * No arbitrary model search or editorial photos on product cards.
 */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroCatalanoProductMedia=api;})(typeof window==='object'?window:null,function(root){
'use strict';
const cached=new Map(),inflight=new Map();
function trustedImage(url){
 try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='www.catalano.it'&&
  /^\/wp-content\/uploads\/\d{4}\/\d{2}\/[^?#]+\.(webp|png|jpe?g)$/i.test(u.pathname);}
 catch{return false}
}
function imageCode(url){
 if(!trustedImage(url))return '';
 const filename=decodeURIComponent(new URL(url).pathname.split('/').pop()).replace(/-\d{2,4}x\d{2,4}(?=\.)/,'');
 const m=filename.match(/(?:^|[_-])(\d{10})(?=\.(webp|png|jpe?g)$)/i);
 if(m)return m[1];
 const dashed=filename.match(/(?:^|[_-])(\d{2})-(\d{4})-(\d{4})(?=\.(webp|png|jpe?g)$)/i);
 return dashed?dashed[1]+dashed[2]+dashed[3]:'';
}
const cleanRow=row=>row?.manufacturer==='Catalano'&&/^\d{10}$/.test(String(row.reference||''))&&row.base&&row.collection&&row.category;
function verify(value,row,scope){
 if(!value||!cleanRow(row)||!trustedImage(value.image))return null;
 if(value.collection!==row.collection||value.category!==row.category||value.base!==row.base)return null;
 if(scope==='exact'){
  if(value.reference!==row.reference||imageCode(value.image)!==row.reference)return null;
 }else if(scope==='model'){
  if(!String(value.reference).startsWith(row.base)||imageCode(value.image)!==value.reference)return null;
 }else return null;
 return {src:value.image,image:value.image,scope,sourceReference:value.reference,productUrl:value.productUrl||''};
}
function get(row){
 if(!cleanRow(row))return {src:'',scope:'missing'};
 const collection=cached.get(row.collection);
 if(!collection)return {src:'',scope:'missing'};
 return verify(collection.exact?.[row.reference],row,'exact')||
  verify(collection.models?.[row.base+'|'+row.category],row,'model')||
  {src:'',scope:'missing'};
}
async function load(collection,{fetcher=root?.fetch}={}){
 if(!collection||typeof collection!=='string'||collection.length>100||!fetcher)return false;
 if(cached.has(collection))return true;
 if(inflight.has(collection))return inflight.get(collection);
 const promise=(async()=>{
  try{
   const r=await fetcher('/api/catalano-product-media?collection='+encodeURIComponent(collection),{credentials:'same-origin'});
   if(!r.ok)return false;
   const data=await r.json();
   if(data?.ok!==true||data.collection!==collection||!data.exact||!data.models)return false;
   cached.set(collection,data);return true;
  }catch{return false}
 })();
 inflight.set(collection,promise);
 try{return await promise}finally{inflight.delete(collection)}
}
function setFixture(collection,data){cached.set(collection,data)}
function clear(){cached.clear();inflight.clear()}
return {get,load,verify,trustedImage,imageCode,setFixture,clear};
});