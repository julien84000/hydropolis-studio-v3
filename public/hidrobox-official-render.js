/* Hidrobox official configurator selection -> image in project/client dossier.
   A real configured photo is used only when the official result matches the checked options.
   Never replace an existing customer-uploaded image or invent a manufacturer SKU. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHidroboxOfficialVisual=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 const COLOR_GROUPS={
  scene:['Blanc'],
  basics:['Bianco','Beige','Pietra','Cement','Iron','Graphite'],
  trends:['Crema','Cappuccino','Terra','Brownie','Cotta','Golden','Sandstone','Blush','Ocean','Lake','Ombra','Dark Liquen','Metropoli','Herbal']
 };
 const slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const title=v=>String(v||'').trim();
 function colorsFor(row){
  const material=slug(row.material);
  const family=slug(row.colorGroup||row.group||'');
  if(row.color && !/standard|basics|trends|specials|ral|ncs/i.test(row.color))return [row.color];
  if(/scene/.test(material))return COLOR_GROUPS.scene.slice();
  if(/bas|standard basic/.test(family))return COLOR_GROUPS.basics.slice();
  if(/trend/.test(family))return COLOR_GROUPS.trends.slice();
  if(row.color&& !/standard|basics|trends|specials|ral|ncs/i.test(row.color))return [row.color];
  return [];
 }
 function modelFor(group,row={}){
  const groupName=slug(group?.collection||group?.family||group?.model||'');
  const haystack=slug([row.model,row.type,row.shape,row.form,row.designation,row.collection].filter(Boolean).join(' '));
  const text=groupName+' '+haystack;
  const single=['neo plus','quadro','one','pure','arq','iconik','unique','loovers','falcon'];
  for(const s of single)if(groupName===s)return s.replaceAll(' ','-');
  if(groupName==='line x')return 'line-x';
  if(groupName==='line y')return 'line-y';
  if(groupName==='twins yl'||groupName==='twin yl')return 'twins-yl';
  if(groupName==='twins yr'||groupName==='twin yr')return 'twins-yr';
  if(groupName==='line'){
   if(/\bline\s*x\b|\bline-x\b|\bline x\b/.test(text))return 'line-x';
   if(/\bline\s*y\b|\bline-y\b/.test(text))return 'line-y';
   return '';
  }
  if(groupName==='twins'){
   if(/\btwins?\s*yl\b|\btwins yl\b/.test(text))return 'twins-yl';
   if(/\btwins?\s*yr\b|\btwins yr\b/.test(text))return 'twins-yr';
   return '';
  }
  return '';
 }
 function normalizedTexture(row,extra={}){
  const t=slug(extra.texture||row.texture||row.finish||'');
  if(/microtex/.test(t))return 'Microtex';
  if(/ardoi|pizarra|slate/.test(t))return 'Slate';
  if(/ciment|cement/.test(t))return 'Cement';
  if(/liss|smooth|liso/.test(t))return 'Smooth';
  return '';
 }
 function normalizedMaterial(row,extra={}){
  const t=slug(extra.material||row.material||'');
  return /kromat/.test(t)?'Kromat':/scene/.test(t)?'Scene':'';
 }
 function normalizedShape(row,extra={}){
  const t=slug(extra.shape||row.shape||row.form||'');
  return /pentag/.test(t)?'pentagonal':/angul/.test(t)?'angular':/carr|square/.test(t)?'square':
   /rect/.test(t)?'rectangle':'rectangle';
 }
 function selection(group,row,extra={}){
  const model=extra.model||modelFor(group,row);
  const material=normalizedMaterial(row,extra),texture=normalizedTexture(row,extra);
  const color=title(extra.color||row.color||'');
  const width=Number(extra.width||row.widthCm||''),length=Number(extra.length||row.lengthCm||'');
  return {model,material,texture,color,width,length,shape:normalizedShape(row,extra)};
 }
 function eligible(s){return !!(s.model&&s.material&&s.texture&&s.color&&Number.isInteger(s.width)&&s.width>=40&&Number.isInteger(s.length)&&s.length>=40);}
 async function lookup(s,{fetcher=root?.fetch}={}){
  if(!eligible(s)||!fetcher)return {ok:false,reason:'Les choix exacts de matière, texture, couleur ou dimension sont incomplets.'};
  const url='/api/hidrobox-configurator-image?'+Object.entries(s).map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&');
  const response=await fetcher(url,{credentials:'same-origin'});
  if(!response.ok)return {ok:false,reason:'Service photo configurateur indisponible'};
  return response.json();
 }
 const trusted=v=>{
   try{
    const u=new URL(String(v||''),root?.location?.origin||'https://hydropolis.local');
    return u.protocol==='https:'&&u.hostname==='hidrobox.com'&&u.pathname.startsWith('/configurator/wp-content/uploads/cfg-recursos/images/');
   }catch{return false;}
 };
 function printQuality(imageResult,{ImageClass=root?.Image}={}){
   if(!imageResult?.ok||!trusted(imageResult.image)||!ImageClass)return Promise.resolve({ok:false,reason:'Résolution impossible à vérifier'});
   return new Promise(resolve=>{
     const img=new ImageClass();let complete=false;
     const timer=setTimeout(()=>end({ok:false,reason:'Chargement de la photo fabricant expiré'}),10000);
     function end(v){if(complete)return;complete=true;clearTimeout(timer);img.onload=null;img.onerror=null;resolve(v);}
     img.onload=()=>{
       const width=img.naturalWidth||0,height=img.naturalHeight||0;
       end({ok:Math.min(width,height)>=900,width,height,reason:Math.min(width,height)>=900?'Photo HD native vérifiée':
        'Image officielle '+width+' × '+height+' px, résolution insuffisante pour un grand visuel imprimé'});
     };
     img.onerror=()=>end({ok:false,reason:'Image officielle indisponible'});
     img.src='/api/image-proxy?url='+encodeURIComponent(imageResult.image);
   });
 }
 function apply(record,imageResult,config){
  if(!record||record.customImage||record.dossierImage||!imageResult?.ok||!trusted(imageResult.image)||imageResult.verifiedPrintQuality===false)return false;
  const src='/api/image-proxy?url='+encodeURIComponent(imageResult.image);
  record.image=src;record.images=[src];record.pdfImage=src;record.pdfImages=[src];
  record.remoteImageUrl=imageResult.image;record.remoteImages=[imageResult.image];
  record.imageFinishMatch='configured-verified';record.imageSource='Configurateur officiel Hidrobox · choix vérifiés';
  record.imageStatus='Visuel configurateur Hidrobox'+(imageResult.width&&imageResult.height?' · '+imageResult.width+' × '+imageResult.height+' px':'');
  record.imageNote=(imageResult.disclaimer||'Photo du configurateur officiel.')+
    ' Certains accessoires (grille ou bonde) peuvent ne pas être visibles.';
  record.hidroboxConfiguration={...(record.hidroboxConfiguration||{}),officialConfiguratorImage:imageResult.image,
   officialImageConfig:{...config},officialImageMatch:imageResult.match||'',officialImageSource:imageResult.source||''};
  return true;
 }
 async function preview(element,s,{fetcher=root?.fetch}={}){
   if(!element)return;
   const textNode=element.querySelector('[data-hb-config-status]');
   const img=element.querySelector('[data-hb-config-image]');
   if(!img)return;
   if(textNode)textNode.textContent='Recherche du visuel exact sur le configurateur Hidrobox…';
   let result;
   try{result=await lookup(s,{fetcher});}
   catch{result={ok:false,reason:'Le configurateur officiel est momentanément inaccessible.'};}
   if(!element.isConnected)return;
   if(result.ok&&trusted(result.image)){
     img.src='/api/image-proxy?url='+encodeURIComponent(result.image);
     img.hidden=false;
     img.onerror=()=>{img.hidden=true;if(textNode)textNode.textContent='Image fabricante indisponible. Photo de collection conservée.'};
     const quality=await printQuality(result);
     if(textNode)textNode.textContent=quality.ok?
       'Photo constructeur HD '+quality.width+' × '+quality.height+' px · modèle, couleur, texture et dimensions contrôlés ; accessoires non garantis.':
       quality.reason+' · non enregistrée automatiquement dans le dossier client.';
     result.verifiedPrintQuality=quality.ok;result.width=quality.width;result.height=quality.height;
   }else if(textNode)textNode.textContent=result.reason||'Correspondance visuelle non démontrée : photo de collection illustrative.';
   return result;
 }
 return {COLOR_GROUPS,colorsFor,modelFor,normalizedTexture,normalizedMaterial,selection,eligible,lookup,trusted,printQuality,apply,preview};
});
