/* Hotbath 2026 — Galassia-style visual configurator.
 * Tariff references/prices and required concealed bodies are never invented.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHotbathGalassia=api;
})(typeof window==='object'?window:null,function(root){
'use strict';
const ORDER=['Gent','Archie','Guy','Chap','Ace','Gal','Cobber','Cobber X','Fellow','Tron','Mate','Ray'];
const clean=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const modelLabel=m=>m?.variants?.[0]?.designation||m?.variants?.[0]?.originalDescription||m?.base||'';
const publicPrice=p=>Number(p?.totalPrice??p?.price);
function totalFor(p,rough){
 if(!p)return 0;
 if(rough?.verified&&rough.priceAgrees)return Number(p.price)+Number(rough.price);
 return publicPrice(p);
}
function open(rows,roomId,onAdd){
 const supplier=root?.HydroHotbathOfficialGuide,rough=root?.HydroHotbathRoughIn;
 if(!supplier||!rough||!Array.isArray(rows)||!rows.some(r=>r?.manufacturer==='Hotbath')||typeof onAdd!=='function')
  return Promise.reject(new Error('Données du configurateur Hotbath indisponibles'));
 const indexed=supplier.tariffIndex(rows);
 return new Promise(resolve=>{
  document.querySelector('.hotbath-galassia-modal')?.remove();
  const ov=document.createElement('div');
  ov.className='galassia-modal hotbath-galassia-modal';
  ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Configurer Hotbath');
  ov.innerHTML='<div class="galassia-shell hotbath-galassia-shell">'+
   '<header class="galassia-top"><div><span class="galassia-eyebrow">HOTBATH · ROBINETTERIE DESIGN</span>'+
   '<h2>Configurer Hotbath</h2><p>Collection → famille → modèle → finition → corps d’encastrement</p></div>'+
   '<button class="galassia-close" aria-label="Fermer" type="button">×</button></header>'+
   '<div class="galassia-body hotbath-galassia-body">'+
   '<aside class="galassia-collections hotbath-collections"></aside>'+
   '<main class="galassia-browser hotbath-browser"><div class="galassia-filters">'+
   '<div class="galassia-path">Collections → familles officielles → références tarifées</div>'+
   '<label>Rechercher<input class="galassia-search" type="search" placeholder="Modèle, référence, description…"></label></div>'+
   '<div class="galassia-subfamilies hotbath-categories"></div><div class="galassia-models hotbath-models"></div></main>'+
   '<section class="galassia-selection hotbath-selection"></section></div></div>';
  document.body.appendChild(ov);
  const $=q=>ov.querySelector(q),$$=q=>Array.from(ov.querySelectorAll(q));
  const previous=document.activeElement;
  let taxonomy=null,media=null,collection='Gent',categoryKey='',base='',ref='',search='',closed=false,busy=false;
  const images=new Map(),asked=new Set(),failed=new Set(),queue=[],pending={count:0};
  function mediaKey(c,m,finish=''){return c+'|'+clean(m)+'|'+clean(finish)}
  function knownImage(c,m){return images.get(mediaKey(c,m))?.image||supplier.photo({base:m},c,media)||''}
  function selectedImage(m,p){
   const variant=images.get(mediaKey(collection,m,p?.finishCode||''));
   if(variant?.scope==='exact')return {url:variant.image,caption:'Photo fabricant de la finition '+(p?.finishCode||'')};
   return {url:knownImage(collection,m)||variant?.image||'',
     caption:'Photo du modèle vérifié · la finition illustrée peut différer'};
  }
  function flushImages(){
   while(pending.count<3&&queue.length){
    const task=queue.shift();pending.count++;
    const url='/api/hotbath-live-media?collection='+encodeURIComponent(task.collection)+'&model='+
     encodeURIComponent(task.model)+'&finish='+encodeURIComponent(task.finish);
    fetch(url,{credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(data=>{
     const match=String(data?.image||'').match(/^https:\/\/hotbath\.com\/images\/compano\/([^/?#]+)\//i);
     if(data?.ok&&match&&clean(match[1])===clean(task.model)&&
       data.collection===task.collection&&clean(data.model)===clean(task.model)&&
       (data.scope==='model'||data.scope==='exact')){
       images.set(task.key,data);
     }else failed.add(task.key);
    }).catch(()=>failed.add(task.key)).finally(()=>{
      pending.count--;flushImages();
      if(!closed&&ov.isConnected&&collection===task.collection)render(false);
    });
   }
  }
  function requestImage(c,m,finish=''){
   const key=mediaKey(c,m,finish);
   if(!m||asked.has(key)||images.has(key)||failed.has(key))return;
   asked.add(key);queue.push({key,collection:c,model:m,finish});flushImages();
  }
  const categories=()=>supplier.categories(collection,taxonomy,indexed);
  function activeCategory(){
   const all=categories();return all.find(x=>(x.id||x.label)===categoryKey)||all[0]||null;
  }
  function activeModels(){
   const cat=activeCategory();
   if(!cat)return [];
   const list=supplier.officialModels(collection,cat,indexed);
   const needle=clean(search);
   return list.filter(m=>!needle||[m.base,modelLabel(m),...m.variants.map(v=>v.reference)].some(x=>clean(x).includes(needle)));
  }
  function close(){
   if(closed)return;
   closed=true;ov.remove();document.removeEventListener('keydown',onKey);
   previous?.focus?.();resolve(true);
  }
  function onKey(e){if(e.key==='Escape'){e.preventDefault();close()}}
  document.addEventListener('keydown',onKey);
  $('.galassia-close').onclick=close;
  ov.addEventListener('click',e=>{if(e.target===ov)close()});
  function renderCollections(){
   $('.hotbath-collections').innerHTML=ORDER.map(c=>{
    const items=taxonomy.collections?.[c]||[],count=new Set(items.flatMap(x=>x.refs||[])).size;
    const url=media.modernCollectionImages?.[c]||media.collectionImages?.[c]||'';
    return '<button type="button" class="galassia-family'+(c===collection?' active':'')+
      '" data-collection="'+esc(c)+'">'+(url?'<img src="'+esc(url)+'" alt="" loading="lazy">':
      '<span class="galassia-no-photo">H</span>')+
      '<span>'+esc(c)+'<small>'+count+' modèles</small></span></button>';
   }).join('');
   $$('[data-collection]').forEach(button=>button.onclick=()=>{
    collection=button.dataset.collection;categoryKey='';base='';ref='';search='';render();
   });
  }
  function renderCategories(){
   const groups=categories(),selected=activeCategory();
   categoryKey=selected?.id||selected?.label||'';
   $('.hotbath-categories').innerHTML=groups.map(g=>
    '<button type="button" class="galassia-section'+(g===selected?' active':'')+
    '" data-category="'+esc(g.id||g.label)+'"><strong>'+esc(g.label)+'</strong><small>'+
    (g.refs?.length||0)+' modèles'+(g.extra?' · tarif':'')+'</small></button>').join('');
   $$('[data-category]').forEach(button=>button.onclick=()=>{
    categoryKey=button.dataset.category;base='';ref='';render(false);
   });
  }
  function renderModels(){
   const models=activeModels();
   if(!models.some(m=>m.base===base)){base=models.find(m=>m.variants.length)?.base||models[0]?.base||'';ref=''}
   $('.hotbath-models').innerHTML=models.length?models.map(m=>{
    const url=knownImage(collection,m.base);
    const minimum=m.variants.length?Math.min(...m.variants.map(publicPrice)):0;
    return '<button type="button" class="galassia-model'+(m.base===base?' active':'')+
     '" data-model="'+esc(m.base)+'"><span class="galassia-model-photo">'+
     (url?'<img loading="lazy" alt="'+esc(m.base)+'" src="'+esc(url)+'">':
     '<span class="galassia-no-photo">Photo du modèle indisponible</span>')+
     '</span><strong>'+esc(modelLabel(m))+'</strong><span>'+esc(m.base)+' · '+
     m.variants.length+' déclinaison(s)</span><small>'+
     (minimum>0?'À partir de '+money(minimum)+' HT':'Tarif non importé')+'</small></button>';
   }).join(''):'<p class="galassia-empty">Aucun modèle dans cette famille.</p>';
   $$('[data-model]').forEach(button=>button.onclick=()=>{
     base=button.dataset.model;ref='';render(false);
   });
   // Discover missing photos progressively, avoiding a fanout to all 647 models.
   models.slice(0,48).forEach(m=>{if(!knownImage(collection,m.base))requestImage(collection,m.base)});
   $$('.hotbath-models .galassia-model').forEach(button=>{
    button.querySelector('img')?.addEventListener('error',()=>requestImage(collection,button.dataset.model),{once:true});
   });
  }
  function renderSelection(){
   const m=activeModels().find(x=>x.base===base);
   if(!m?.variants?.length){
    $('.hotbath-selection').innerHTML='<p class="galassia-empty">Choisissez un modèle tarifé pour configurer ses finitions.</p>';
    return;
   }
   if(!m.variants.some(x=>x.reference===ref))ref=m.variants[0].reference;
   const p=m.variants.find(v=>v.reference===ref)||m.variants[0],r=rough.resolve(p);
   const photo=selectedImage(m.base,p);
   const priceLines=r.verified&&r.priceAgrees?
    '<div><span>Produit apparent HT</span><b>'+money(p.price)+'</b></div>'+
    '<div><span>Corps obligatoire HT</span><b>'+money(r.price)+'</b></div>':
    '<div><span>Prix tarif public HT</span><b>'+money(publicPrice(p))+'</b></div>';
   const bodyMarkup=r.kind==='verified'?
     '<div class="hotbath-rough-in verified"><b>Corps d’encastrement obligatoire</b>'+
       '<span>Référence fournisseur : '+esc(r.reference)+'</span><strong>'+money(r.price)+' HT</strong>'+
       '<small>Ajout automatique en ligne distincte dans le projet et le devis. '+esc(r.note)+'</small></div>':
     r.kind==='unverified'?
       '<div class="hotbath-rough-in missing"><b>Corps d’encastrement à confirmer</b>'+
       '<span>'+(r.reference?'Référence non tarifée : '+esc(r.reference):
       'Référence et prix non vérifiés')+'</span><small>'+esc(r.note)+'</small></div>':'';
   $('.hotbath-selection').innerHTML=
    '<div class="galassia-photo">'+(photo.url?'<img src="'+esc(photo.url)+'" alt="'+esc(p.reference)+'">':
     '<span>Photo produit indisponible</span>')+'</div>'+
    '<div class="galassia-image-note">'+esc(photo.url?photo.caption:'Aucun visuel vérifié pour ce modèle')+'</div>'+
    '<span class="galassia-eyebrow">'+esc(collection)+' · '+esc(activeCategory()?.label||'')+'</span>'+
    '<h3>'+esc(modelLabel(m))+'</h3>'+
    '<label class="galassia-variant-label">Référence et finition<select class="hotbath-variant">'+
    m.variants.map(v=>'<option value="'+esc(v.reference)+'"'+(v.reference===ref?' selected':'')+'>'+
      esc(v.reference)+' · '+esc(v.finish||v.finishCode||'Standard')+' · '+
      money(publicPrice(v))+' HT</option>').join('')+'</select></label>'+
    '<div class="galassia-summary"><div><span>Référence fabricant</span><b>'+esc(p.reference)+'</b></div>'+
      priceLines+'<div><span>Total public HT</span><b>'+money(totalFor(p,r))+'</b></div>'+
      '<div><span>Remise d’achat fournisseur</span><b>50 %</b></div>'+
      '<div><span>Coût d’achat théorique HT</span><b>'+money(totalFor(p,r)*.5)+'</b></div></div>'+
    bodyMarkup+
    '<div class="galassia-docs"><a href="https://hotbath.com/fr-be/produits/" target="_blank" rel="noopener noreferrer">Catalogue officiel Hotbath</a>'+
    '<span>Tarifs : base importée 2026 · référence sans suffixe IT.</span></div>'+
    '<button type="button" class="galassia-add hotbath-add"'+(busy?' disabled':'')+'>'+
      (busy?'Ajout…':'Ajouter cette configuration au projet')+'</button>';
   $('.hotbath-variant').onchange=e=>{ref=e.target.value;renderSelection()};
   $('.hotbath-add').onclick=async()=>{
    if(busy)return;
    busy=true;$('.hotbath-add').disabled=true;
    try{
     // createSelectedProductRecord and HydroRoughIn.reconcile already handle the
     // verified p.internalReference as a separate mandatory child of this line.
     // No second copy of the body may be inserted by this dialog.
     await onAdd(p,roomId);
     close();
    }catch(e){
     busy=false;renderSelection();alert('Ajout Hotbath impossible : '+(e?.message||String(e)));
    }
   };
   if(p.finishCode)requestImage(collection,m.base,p.finishCode);
   if(!knownImage(collection,m.base))requestImage(collection,m.base);
  }
  function render(resetSearch=true){
   if(!ov.isConnected||!taxonomy||!media)return;
   const focus=$('.galassia-search')===document.activeElement;
   const pos=focus?$('.galassia-search').selectionStart:null;
   if(resetSearch)$('.galassia-search').value=search;
   renderCollections();renderCategories();renderModels();renderSelection();
   if(focus){const input=$('.galassia-search');input.focus();input.setSelectionRange(pos,pos)}
  }
  $('.galassia-search').oninput=e=>{search=e.target.value;base='';ref='';render(false)};
  Promise.all([
   fetch('/brand-guide-hotbath-taxonomy.json?v=__APP_VERSION__',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Taxonomy');return r.json()}),
   fetch('/brand-guide-hotbath-media.json?v=__APP_VERSION__',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Photos');return r.json()})
  ]).then(([a,b])=>{taxonomy=a;media=b;render()}).catch(e=>{
   $('.hotbath-models').textContent='Catalogue Hotbath indisponible : '+(e.message||e);
  });
 });
}
function install(){
 if(!root?.HydroManufacturerGuide)return false;
 const guide=root.HydroManufacturerGuide;
 const prior=guide.open;
 if(prior.__hotbathGalassia)return true;
 const override=function(brand,rows,roomId,onAdd){
  if(brand==='Hotbath')return open(rows,roomId,onAdd);
  return prior(brand,rows,roomId,onAdd);
 };
 override.__hotbathGalassia=true;
 guide.open=override;
 return true;
}
if(root)install();
return {open,install,ORDER,totalFor};
});
