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
 /* Tariff-only groups lack a dedicated orientation field. The genuine 2026 supplier
    references encode LINE X/Y and TWINS YL/YR; never infer side from dimensions. */
 function modelFromReference(raw){
  const ref=String(raw||'').toUpperCase().trim();
  const match=ref.match(/^(SLIC|STWC)(\d{4})$/);
  if(!match)return '';
  const n=Number(match[2]),between=(a,b)=>n>=a&&n<=b;
  if(match[1]==='STWC'){
   if(between(97,112)||between(129,144)||between(33,48))return 'twins-yl';
   if(between(113,128)||between(145,160)||between(81,96))return 'twins-yr';
   return '';
  }
  // LINE X: Kromat BAS/TRE/SPE (Lisse and Ardoise).
  if(between(533,588)||between(730,785)||between(895,950)||
     between(624,679)||between(821,876)||between(986,1041))return 'line-x';
  // LINE Y: Kromat BAS/TRE/SPE (Lisse and Ardoise).
  if(between(589,623)||between(786,820)||between(951,985)||
     between(680,697)||between(877,894)||between(1042,1059))return 'line-y';
  // LINE Scene Lisse and special large formats, from source 2026 PDF pages 22-25.
  if(between(1,42)||between(698,711))return 'line-x';
  if(between(43,69)||between(712,719))return 'line-y';
  // LINE Scene Ardoise uses non-contiguous codes from the printed table.
  if(between(70,102)||[104,106,108,118,120,122,124].includes(n)||
    between(110,115)||between(720,729))return 'line-x';
  if([103,105,107,109,116,117,119,121,123].includes(n)||
    between(125,133))return 'line-y';
  return '';
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
   return modelFromReference(row.reference);
  }
  if(groupName==='twins'){
   if(/\btwins?\s*yl\b|\btwins yl\b/.test(text))return 'twins-yl';
   if(/\btwins?\s*yr\b|\btwins yr\b/.test(text))return 'twins-yr';
   return modelFromReference(row.reference);
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
  return {model,typology:extra.typology||'',material,texture,color,width,length,shape:normalizedShape(row,extra)};
 }
 function eligible(s){
  const min=s?.typology&&s.typology!=='shower-tray'?20:/^spot-\d+$/.test(String(s?.model||''))?30:40;
  return !!(s?.model&&s.material&&s.texture&&s.color&&Number.isInteger(s.width)&&s.width>=min&&
    Number.isInteger(s.length)&&s.length>=min);
 }
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
  const exactSize=imageResult.match==='model-texture-color-shape-dimensions';
  record.imageFinishMatch=exactSize?'configured-verified':'configured-illustrative';
  record.imageSource=exactSize?'Configurateur officiel Hidrobox · dimensions du résultat vérifiées':
    'Configurateur officiel Hidrobox · illustration de finition, dimensions non garanties';
  record.imageStatus='Visuel configurateur Hidrobox'+(exactSize?' · dimensions vérifiées':' · dimensions illustratives')+
    (imageResult.width&&imageResult.height?' · '+imageResult.width+' × '+imageResult.height+' px':'');
  record.imageNote=(imageResult.disclaimer||'Photo du configurateur officiel.')+
    ' La photographie ne prouve pas le sens gauche/droite, les accessoires ni les dimensions finales.';
  record.hidroboxConfiguration={...(record.hidroboxConfiguration||{}),officialConfiguratorImage:imageResult.image,
   officialImageConfig:{...config},officialImageMatch:imageResult.match||'',officialImageSource:imageResult.source||''};
  return true;
 }
 async function preview(element,s,{fetcher=root?.fetch}={}){
   if(!element)return;
   const textNode=element.querySelector('[data-hb-config-status]');
   const img=element.querySelector('[data-hb-config-image]');
   const sourceLink=element.querySelector('[data-hb-config-link]');
   if(!img)return;
   if(textNode)textNode.textContent='Recherche du visuel officiel correspondant au modèle et à la finition…';
   let result;
   try{result=await lookup(s,{fetcher});}
   catch{result={ok:false,reason:'Le configurateur officiel est momentanément inaccessible.'};}
   if(!element.isConnected)return;
   if(sourceLink&&result.source){
     try{
       const u=new URL(result.source);
       if(u.protocol==='https:'&&u.hostname==='hidrobox.com'&&u.pathname.startsWith('/configurator/en/')){
         sourceLink.href=u.href;sourceLink.hidden=false;
       }
     }catch{}
   }
   if(result.ok&&trusted(result.image)){
     img.src='/api/image-proxy?url='+encodeURIComponent(result.image);
     img.hidden=false;
     img.onerror=()=>{img.hidden=true;if(textNode)textNode.textContent='Image fabricant indisponible. Photo de collection conservée.'};
     const quality=await printQuality(result);
     if(textNode)textNode.textContent=quality.ok?
       ('Photo constructeur HD '+quality.width+' × '+quality.height+' px · '+
         (result.match==='model-texture-color-shape-dimensions'?
          'dimensions confirmées sur la fiche du résultat, matière et accessoires non garantis.':
          'illustration du modèle et de la finition ; dimensions, orientation, matière et accessoires non garantis.')):
       quality.reason+' · non enregistrée automatiquement dans le dossier client.';
     result.verifiedPrintQuality=quality.ok;result.width=quality.width;result.height=quality.height;
   }else if(textNode)textNode.textContent=result.reason||'Aucune correspondance visuelle démontrée : photo de collection illustrative.';
   return result;
 }
 return {COLOR_GROUPS,colorsFor,modelFromReference,modelFor,normalizedTexture,normalizedMaterial,selection,eligible,lookup,trusted,printQuality,apply,preview};
});
