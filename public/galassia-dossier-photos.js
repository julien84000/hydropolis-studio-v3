/* Galassia client dossier images: use verified, print-capable manufacturer originals.
   Model photographs are never presented as a verified image of the selected finish. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.HydroGalassiaDossierPhotos=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 const trusted=raw=>{
   try{
     const u=new URL(String(raw||''));
     return u.protocol==='https:'&&!u.username&&!u.password&&!u.port
       &&/^(?:www\.)?ceramicagalassia\.(?:it|com)$/i.test(u.hostname)
       &&u.pathname.startsWith('/public/')?u:null;
   }catch{return null;}
 };
 const unwrap=raw=>{
   const value=String(raw||'');
   if(/^\/api\/image-proxy\?/.test(value)){
     try{return new URL(value,'https://hydropolis.local').searchParams.get('url')||'';}catch{return '';}
   }
   return value;
 };
 function candidates(raw){
   const u=trusted(unwrap(raw));if(!u)return [];
   const original=new URL(u.href);
   const m=original.pathname.match(/^(.*)\/_resized\/([^/]+?)_(\d+)X(\d+)_\d+_C\.(jpe?g|png|webp)$/i);
   if(m)original.pathname=m[1]+'/'+m[2]+'.'+m[5];
   const urls=[original.href];
   if(original.href!==u.href)urls.push(u.href);
   return [...new Set(urls)];
 }
 function proxy(url){return '/api/image-proxy?url='+encodeURIComponent(url);}
 function imageProbe(src){
   return new Promise(resolve=>{
     if(!root?.Image)return resolve(null);
     const img=new root.Image();let done=false;
     const timer=setTimeout(()=>finish(null),10000);
     function finish(value){
       if(done)return;done=true;clearTimeout(timer);
       img.onload=null;img.onerror=null;resolve(value);
     }
     img.onload=()=>finish({width:img.naturalWidth,height:img.naturalHeight});
     img.onerror=()=>finish(null);img.src=src;
   });
 }
 async function officialPhoto(p){
   if(!/^galassia$/i.test(String(p?.manufacturer||'')))return '';
   try{
     const hierarchy=root?.HydroGalassiaTree;
     if(!hierarchy?.load||!hierarchy?.verifiedModel)return '';
     const item=hierarchy.verifiedModel(await hierarchy.load(),p)?.item;
     return trusted(item?.image)?item.image:'';
   }catch{return '';}
 }
 const printReady=dimensions=>Math.min(Number(dimensions?.width)||0,Number(dimensions?.height)||0)>=900;
 async function resolve(p,{officialImage='',probe=imageProbe}={}){
   if(!/^galassia$/i.test(String(p?.manufacturer||''))||p.customImage||p.dossierImage)return null;
   const source=(trusted(officialImage)?officialImage:'')||(await officialPhoto(p))||unwrap(p.image);
   const urls=candidates(source);
   for(const url of urls){
     const src=proxy(url);
     const dims=await probe(src);
     if(!dims?.width||!dims?.height)continue;
     const quality=printReady(dims)?'original-hd':'limited';
     // A thumbnail is only used if no suitable high-resolution manufacturer file exists.
     return {src,url,width:dims.width,height:dims.height,quality,verifiedModel:true};
   }
   return null;
 }
 function fields(photo){
   if(!photo?.src)return {};
   const hd=photo.quality==='original-hd';
   return {
     image:photo.src,images:[photo.src],pdfImage:photo.src,pdfImages:[photo.src],
     remoteImageUrl:photo.url,remoteImages:[photo.url],
     galassiaPhotoQuality:photo.quality,galassiaPhotoWidth:photo.width,galassiaPhotoHeight:photo.height,
     imageSource:'Photographie officielle Galassia du modèle',
     imageStatus:hd?'Photo Galassia HD · modèle vérifié':'Photo Galassia · résolution limitée',
     imageNote:hd?'Visuel officiel du modèle, source HD '+photo.width+' × '+photo.height+' px. La finition photographiée peut différer de la référence sélectionnée.':
       'Visuel officiel du modèle '+photo.width+' × '+photo.height+' px. Résolution insuffisante pour un grand visuel imprimé ; la finition photographiée peut différer.',
     imageFinishMatch:'model'
   };
 }
 return {trusted,unwrap,candidates,proxy,printReady,resolve,fields};
});
