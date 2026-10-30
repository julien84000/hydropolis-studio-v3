/* Native manufacturer photographs: client dossier only, opt-in per article. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroSbordoniDossierPhotos=api;})(typeof window==='object'?window:null,function(){
 'use strict';let loading;
 function compositionKey(product){
  if(!/^sbordoni$/i.test(product?.manufacturer||''))return '';
  const src=product.sbordoniConfiguration?.resultImage||product.image||'';
  return String(src).match(/\/sbordoni\/compositions\/([\w-]+)\.jpg(?:\?|$)/)?.[1]||'';
 }
 function photosFor(product,photos){const key=compositionKey(product);return key?photos.filter(photo=>photo.key===key):[];}
 async function load(){
  if(!loading)loading=fetch('/sbordoni/dossier/manifest.json').then(r=>{if(!r.ok)throw Error('Photos fabricant indisponibles.');return r.json();}).then(x=>x.photos).catch(e=>{loading=null;throw e;});
  return loading;
 }
 async function open(product,apply){
  const previous=document.activeElement,dialog=document.createElement('dialog');dialog.className='sbordoni-dossier-dialog';
  const heading=document.createElement('h2');heading.textContent='Photo fabricant pour le dossier client';
  const description=document.createElement('p');description.textContent='Choisissez une photo d’ambiance du modèle. La finition et les accessoires photographiés sont précisés ci-dessous ; ils ne modifient pas votre sélection.';
  const close=document.createElement('button');close.type='button';close.className='btn ghost';close.textContent='Fermer';close.onclick=()=>dialog.close();
  const content=document.createElement('div');content.className='sbordoni-dossier-choices';content.textContent='Chargement des photos officielles…';
  dialog.append(heading,description,content,close);document.body.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();previous?.focus();},{once:true});dialog.showModal();
  try{
   const photos=photosFor(product,await load());if(!dialog.isConnected)return;content.replaceChildren();
   if(!photos.length){content.textContent='Aucune photo d’ambiance vérifiée pour cette composition. Vous pouvez importer votre photo avec « Photo du dossier ».';return;}
   for(const photo of photos){
    const card=document.createElement('article'),img=document.createElement('img'),label=document.createElement('p'),source=document.createElement('a'),button=document.createElement('button');
    img.src=photo.url;img.alt='Photo fabricant '+photo.caption;img.width=photo.width;img.height=photo.height;
    label.textContent=photo.caption+' — '+photo.finishNote+' · '+photo.width+' × '+photo.height+' px natifs';
    source.href=photo.source+'#page='+photo.captionPage;source.target='_blank';source.rel='noopener';source.textContent='Voir la référence dans le catalogue fabricant';
    button.type='button';button.className='btn primary';button.textContent='Utiliser dans le dossier';
    button.onclick=async()=>{
     button.disabled=true;
     try{await img.decode();if(!dialog.isConnected)return;await apply(photo);dialog.close();}
     catch(e){label.textContent=e.message||'Impossible d’utiliser cette image.';button.disabled=false;}
    };
    card.append(img,label,source,button);content.append(card);
   }
  }catch(e){if(dialog.isConnected)content.textContent=e.message;}
 }
 return {compositionKey,photosFor,open};
});
