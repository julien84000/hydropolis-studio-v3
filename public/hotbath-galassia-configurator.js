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
 const ray=root?.HydroHotbathRay2026;
 const manufacturerCatalogue=root?.HydroHotbathCatalogue2026;
 ray?.apply(rows);
 if(!supplier||!rough||!Array.isArray(rows)||!rows.some(r=>r?.manufacturer==='Hotbath')||typeof onAdd!=='function')
  return Promise.reject(new Error('Données du configurateur Hotbath indisponibles'));
 const linkAudit=rough.linkCatalog(rows);
 manufacturerCatalogue?.apply?.(rows);
 const indexed=ray?.extendTariffIndex(supplier.tariffIndex(rows),rows)||supplier.tariffIndex(rows);
 return new Promise(resolve=>{
  document.querySelector('.hotbath-galassia-modal')?.remove();
  const ov=document.createElement('div');
  ov.id='manufacturerGuidedSelector';
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
  let taxonomy=null,media=null,italian=null,supplemental=null,curated=null,collection='Gent',categoryKey='',base='',ref='',search='',closed=false,busy=false;
  const images=new Map(),documents=new Map(),bodyChoiceByRef=new Map(),asked=new Set(),failed=new Set(),queue=[],pending={count:0};
  let imageObserver=null;
  function mediaKey(c,m,finish=''){return c+'|'+clean(m)+'|'+clean(finish)}
  // The Italian index contains links copied from manufacturer HTML; it does
  // NOT prove that remote JPG bytes exist (some return HTTP 404).
  // Only the server-side byte-validated image may be presented as verified.
  const brokenItalian=new Set(),brokenUrls=new Set();
  const validUrl=url=>url&&!brokenUrls.has(url)?url:'';
  function italianPhoto(c,m){
   const item=images.get(mediaKey(c,m));
   if(!item?.verified||!item?.image||item.source?.indexOf('Hotbath Italie')!==0)return '';
   return validUrl(item.image);
  }
  function supplementalPhoto(c,m){
   const item=supplemental?.byCollection?.[c]?.[m];
   const file=String(item?.image||'').split('/').pop();
   const prefix='b_Hotbath_'+c.toUpperCase().replace(/\s+/g,'-')+'-'+String(m).toUpperCase()+'_';
   if(!item||item.status!=='manufacturer-model-code-matched'||
      !/^https:\/\/img\.edilportale\.com\/product-thumbs\/b_Hotbath_[A-Za-z0-9_-]+\.jpe?g$/i.test(item.image)||
      !file.toUpperCase().startsWith(prefix.toUpperCase())||
      !String(item.officialProductPage||'').toUpperCase().endsWith('/'+String(m).toUpperCase()))return '';
   return validUrl(item.image);
  }
  function curatedModel(c,m){
    const all=curated?.collections?.[c]?.models||{};
    const key=clean(m);
    const found=Object.entries(all).find(([code])=>clean(code)===key);
    return found?validUrl(found[1]):'';
  }
  function curatedExact(c,m,finish){
    const preferred=curated?.collections?.[c];
    return preferred&&clean(preferred.finishCode)===clean(finish)?curatedModel(c,m):'';
  }
  function knownImage(c,m){
    const verified=root?.HydroHotbathFinishMedia;
    const urls=[];
    urls.push(italianPhoto(c,m)); // Exact manufacturer product-page model before curated imagery
    if(curatedModel(c,m))urls.push(curatedModel(c,m));
    if(c==='Ray'){
      const rayPhoto=ray?.specification(m)?.photo;
      if(rayPhoto)urls.push(rayPhoto);
    }
    const key=mediaKey(c,m),checked=images.get(key)?.image||'';
    // Maintain the legacy Italian-first priority while validating that the
    // resulting asset actually depicts the selected manufacturer model.
    urls.push(validUrl(checked));
    urls.push(validUrl(supplier.photo({base:m},c,media)||''));
    urls.push(supplementalPhoto(c,m));
    const saved=verified?.candidates({manufacturer:'Hotbath',collection:c,base:m})||[];
    saved.forEach(v=>urls.push(v.src));
    return urls.find(url=>url&&(!verified||verified.sameModel(url,m)))||'';
  }
  function onItalianError(c,m,url=''){
   const key=mediaKey(c,m);
   if(url)brokenUrls.add(url);
   if(!asked.has(key))requestImage(c,m);
   if(!closed&&ov.isConnected&&c===collection)render(false);
  }
  function selectedImage(m,p){
    const resolver=root?.HydroHotbathFinishMedia;
    const modelUrl=url=>!!url&&(!resolver||resolver.sameModel(url,m));
    const variant=images.get(mediaKey(collection,m,p?.finishCode||''));
    if(variant?.scope==='exact'&&modelUrl(validUrl(variant.image)))
      return {url:variant.image,caption:'Photo fabricant — finition exacte '+(p.finishCode||''),scope:'exact'};
    const curatedPhoto=curatedExact(collection,m,p?.finishCode||'');
    if(curatedPhoto&&modelUrl(curatedPhoto))
      return {url:curatedPhoto,caption:'Photo fabricant — finition exacte '+(p.finishCode||''),scope:'exact'};
    if(collection==='Ray'){
      const manufacturer=ray?.media(p);
      if(manufacturer?.src&&modelUrl(manufacturer.src))
        return {url:manufacturer.src,caption:manufacturer.exact?
          'Photo fabricant — finition exacte '+(p.finishCode||''):
          'Photo générique du même modèle — finition illustrative',scope:manufacturer.exact?'exact':'model-only'};
    }
    const official=italianPhoto(collection,m);
    if(official&&modelUrl(official))return {url:official,caption:
      'Photo du modèle sur le site officiel Hotbath · finition indicative',scope:'model-only'};
    const generic=knownImage(collection,m);
    return {url:generic||'',caption:generic?
      'Photo générique du même modèle — finition illustrative':
      'Photo du modèle indisponible',scope:generic?'model-only':'none'};
  }
  function flushImages(){
   while(pending.count<3&&queue.length){
    const task=queue.shift();pending.count++;
    const italianUrl='/api/hotbath-italian-media?collection='+encodeURIComponent(task.collection)+
      '&model='+encodeURIComponent(task.model);
    const modernUrl='/api/hotbath-live-media?collection='+encodeURIComponent(task.collection)+
      '&model='+encodeURIComponent(task.model)+'&finish='+encodeURIComponent(task.finish);
    // Prefer verified original Italian catalogue photography, except when a
    // newly checked photo of the selected finish is available on hotbath.com.
    const requestJson=url=>fetch(url,{credentials:'same-origin'}).then(r=>r.ok?r.json():null).catch(()=>null);
    requestJson(italianUrl).then(async official=>{
      const docKey=mediaKey(task.collection,task.model);
      if(official?.ok&&official.collection===task.collection&&clean(official.model)===clean(task.model)&&
         (official.technicalSheetUrl||official.drawingUrl)){
       documents.set(docKey,{technicalSheetUrl:official.technicalSheetUrl||'',
        drawingUrl:official.drawingUrl||'',productUrl:official.productUrl||''});
      }
      const modern=task.finish?await requestJson(modernUrl):null;
      // Official product photos outrank generic model photos. Exact finish
      // verified by the modern site is the only higher-priority source.
      const data=modern?.scope==='exact'&&modern?.image?modern:
       official?.image?official:modern?.image?modern:await requestJson(modernUrl);
      const matchItalian=String(data?.image||'').match(/^https:\/\/(?:www\.)?hotbath\.it\/documents\/+ProdCateg\/\d+\/([^/?#]+)$/i);
      const matchModern=String(data?.image||'').match(/^https:\/\/hotbath\.com\/images\/compano\/([^/?#]+)\//i);
      const italianValid=matchItalian&&data.verified===true&&
       matchItalian[1].toUpperCase().startsWith(task.model.toUpperCase()+'_');
      const modernValid=matchModern&&clean(matchModern[1])===clean(task.model);
      if(data?.ok&&(italianValid||modernValid)&&data.collection===task.collection&&
       clean(data.model)===clean(task.model)&&(data.scope==='model'||data.scope==='exact')){
       images.set(task.key,data);
       if(!task.finish&&!images.has(docKey))images.set(docKey,data);
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
   closed=true;imageObserver?.disconnect();ov.remove();document.removeEventListener('keydown',onKey);
   previous?.focus?.();resolve(true);
  }
  function onKey(e){if(e.key==='Escape'){e.preventDefault();close()}}
  document.addEventListener('keydown',onKey);
  $('.galassia-close').onclick=close;
  ov.addEventListener('click',e=>{if(e.target===ov)close()});
  function renderCollections(){
   $('.hotbath-collections').innerHTML=ORDER.map(c=>{
    const items=taxonomy.collections?.[c]||[],count=new Set(items.flatMap(x=>x.refs||[])).size;
    const preference=curated?.collections?.[c];
    const url=validUrl(preference?.heroImage)||media.modernCollectionImages?.[c]||media.collectionImages?.[c]||'';
    return '<button type="button" class="galassia-family'+(c===collection?' active':'')+
      '" data-collection="'+esc(c)+'">'+(url?'<img src="'+esc(url)+'" alt="" loading="lazy">':
      '<span class="galassia-no-photo">H</span>')+
      '<span>'+esc(c)+'<small>'+count+' modèles'+(preference?' · '+esc(preference.finishName):'')+'</small></span></button>';
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
     '<span class="galassia-no-photo">Photo produit indisponible</span>')+
     '</span><strong>'+esc(modelLabel(m))+'</strong><span>'+esc(m.base)+' · '+
     m.variants.length+' déclinaison(s)</span><small>'+
     (minimum>0?'À partir de '+money(minimum)+' HT':'Tarif non importé')+'</small></button>';
   }).join(''):'<p class="galassia-empty">Aucun modèle dans cette famille.</p>';
   $$('[data-model]').forEach(button=>button.onclick=()=>{
     base=button.dataset.model;ref='';render(false);
   });
   // Lazy-load ALL indexed supplier models, including those below the first
   // 24 cards. Only visible products request the external manufacturer's page.
   imageObserver?.disconnect();imageObserver=null;
   const cards=$$('.hotbath-models .galassia-model');
   if(typeof IntersectionObserver==='function'){
    imageObserver=new IntersectionObserver(entries=>{
     for(const entry of entries){
      if(!entry.isIntersecting)continue;
      const m=entry.target.dataset.model;
      requestImage(collection,m);
      imageObserver?.unobserve(entry.target);
     }
    },{rootMargin:'180px'});
    cards.forEach(el=>imageObserver.observe(el));
   }else{
    cards.slice(0,24).forEach(el=>requestImage(collection,el.dataset.model));
   }
   if(base)requestImage(collection,base);
   $$('.hotbath-models .galassia-model').forEach(button=>{
    button.querySelector('img')?.addEventListener('error',e=>{
     const c=collection,m=button.dataset.model;
     onItalianError(c,m,e.currentTarget?.getAttribute('src')||'');
    },{once:true});
   });
  }
  function renderSelection(){
   const m=activeModels().find(x=>x.base===base);
   if(!m?.variants?.length){
    $('.hotbath-selection').innerHTML='<p class="galassia-empty">Choisissez un modèle tarifé pour configurer ses finitions.</p>';
    return;
   }
   if(!m.variants.some(x=>x.reference===ref))ref=m.variants[0].reference;
   const sourceVariant=m.variants.find(v=>v.reference===ref)||m.variants[0];
   // A chosen installation orientation belongs to this dialog selection.
   // Never mutate the global supplier tariff row: different projects may
   // require different H/V bodies for the same visible finish SKU.
   const p={...sourceVariant};
   const chosenRef=bodyChoiceByRef.get(p.reference)||'';
   if(chosenRef)rough.chooseBody?.(p,chosenRef,rows);
   const r=rough.resolve(p);
   const orientationOptions=rough.bodyOptions?.(p,rows)||[];
   const orientationMarkup=orientationOptions.length>1?
    '<label class="hotbath-rough-in-choice"><strong>Corps d’encastrement · orientation obligatoire</strong>'+
    '<select class="hotbath-body-orientation"><option value="">Choisir horizontal ou vertical</option>'+
    orientationOptions.map(x=>'<option value="'+esc(x.reference)+'"'+
     (r.reference===x.reference?' selected':'')+'>'+esc(x.label)+' · '+esc(x.reference)+
      ' · '+money(x.price)+' HT</option>').join('')+'</select>'+
     '<small>Deux corps distincts au tarif et sur le plan fabricant 2026. Sélectionnez selon la pose.</small></label>':'';
   const raySpec=collection==='Ray'?ray?.specification(p):null;
   const rayDetails=raySpec?'<section class="hotbath-ray-tech"><b>Caractéristiques techniques</b>'+
     '<span>'+(raySpec.orientation==='horizontal'?'Horizontal':'Vertical')+' · '+raySpec.elements+
     ' élément(s) · '+raySpec.powerW+' W · '+raySpec.voltage+' · '+raySpec.ip+'</span>'+
     '<span>Longueur élément : '+raySpec.barLengthMm+' mm · câble '+raySpec.cableLengthMm+' mm</span>'+
     '<span>Support obligatoire : '+esc(raySpec.base)+' · tarifé séparément</span>'+
     (raySpec.technicalSheetUrl?'<a target="_blank" rel="noopener noreferrer" href="'+esc(raySpec.technicalSheetUrl)+'">Fiche technique officielle PDF</a>':'')+
     '</section>':'';
   const negotiatedDiscount=rough.purchaseDiscount(p,collection);
   const negotiatedCost=totalFor(p,r)*(1-negotiatedDiscount/100);
   const photo=selectedImage(m.base,p);
   const cataloguePage=manufacturerCatalogue?.entry?.(p);
   const docs=documents.get(mediaKey(collection,m.base))||{};
   const productPdf=docs.technicalSheetUrl?
    '<a href="'+esc(docs.technicalSheetUrl)+'" target="_blank" rel="noopener noreferrer">Fiche technique officielle · '+esc(m.base)+'</a>':'';
   const catalogueDocument=cataloguePage?
    '<a href="'+esc(cataloguePage.url)+'" target="_blank" rel="noopener noreferrer">Plan coté catalogue 2026 · page '+
    cataloguePage.page+'</a>':'';
   const priceLines=r.verified&&r.priceAgrees?
    '<div><span>Produit apparent HT</span><b>'+money(p.price)+'</b></div>'+
    '<div><span>Corps obligatoire HT</span><b>'+money(r.price)+'</b></div>':
    '<div><span>Prix tarif public HT</span><b>'+money(publicPrice(p))+'</b></div>';
   const bodyMarkup=r.kind==='verified'?
     '<div class="hotbath-rough-in verified"><b>Corps d’encastrement obligatoire</b>'+
       '<span>Référence fournisseur : '+esc(r.reference)+'</span><strong>'+money(r.price)+' HT</strong>'+
       '<small>Remise d’achat sur corps : '+esc(String(r.bodyDiscount??p.purchaseDiscount??50))+' % · ajout automatique en ligne distincte au projet et devis. '+esc(r.note)+'</small></div>':
     r.kind==='unverified'?
       '<div class="hotbath-rough-in missing"><b>Corps d’encastrement à confirmer</b>'+
       '<span>'+(r.reference?'Référence non tarifée : '+esc(r.reference):
       'Référence et prix non vérifiés')+'</span><small>'+esc(r.note)+' · Référence extérieure exclue de l’ajout tant que le corps obligatoire n’est pas identifié.</small></div>':'';
   $('.hotbath-selection').innerHTML=
    '<div class="galassia-photo">'+(photo.url?'<img src="'+esc(photo.url)+'" alt="'+esc(p.reference)+'">':
     '<span>Photo produit indisponible</span>')+'</div>'+
    '<div class="galassia-image-note">'+esc(photo.url?photo.caption:'Photo exacte indisponible · voir la fiche Hotbath')+'</div>'+
    '<span class="galassia-eyebrow">'+esc(collection)+' · '+esc(activeCategory()?.label||'')+'</span>'+
    '<h3>'+esc(modelLabel(m))+'</h3>'+
    '<label class="galassia-variant-label">Référence et finition<select class="hotbath-variant">'+
    m.variants.map(v=>'<option value="'+esc(v.reference)+'"'+(v.reference===ref?' selected':'')+'>'+
      esc(v.reference)+' · '+esc(v.finish||v.finishCode||'Standard')+' · '+
      money(publicPrice(v))+' HT</option>').join('')+'</select></label>'+
    '<div class="galassia-summary"><div><span>Référence fabricant</span><b>'+esc(p.reference)+'</b></div>'+
      priceLines+'<div><span>Total public HT</span><b>'+money(totalFor(p,r))+'</b></div>'+
      '<div><span>Remise d’achat fournisseur</span><b>'+esc(negotiatedDiscount===59.5?'50 % + 10 % + 10 % (59,5 %)':'55 %')+'</b></div>'+
      '<div><span>Coût d’achat théorique HT</span><b>'+money(negotiatedCost)+'</b></div></div>'+
    orientationMarkup+bodyMarkup+rayDetails+
    '<div class="galassia-docs"><a href="'+esc(italian?.byCollection?.[collection]?.[m.base]?.officialProductPage||'https://hotbath.it/fr/prods/')+'" target="_blank" rel="noopener noreferrer">Voir le modèle sur Hotbath Italie</a>'+
    ''+productPdf+catalogueDocument+(cataloguePage?
     '<a href="'+esc(cataloguePage.reproduction)+'" target="_blank" rel="noopener noreferrer">Catalogue 2026 · copie consultable</a>':'')+
     '<span>Tarifs : base importée 2026 · référence sans suffixe IT.</span></div>'+
    '<button type="button" class="galassia-add hotbath-add"'+(busy||r.required&&!r.verified?' disabled':'')+'>'+
      (busy?'Ajout…':r.required&&!r.verified?'Corps d’encastrement à confirmer':'Ajouter cette configuration au projet')+'</button>';
   $('.hotbath-selection .galassia-photo img')?.addEventListener('error',e=>{
      onItalianError(collection,m.base,e.currentTarget?.getAttribute('src')||'');
      if(p.finishCode)requestImage(collection,m.base,p.finishCode);
    },{once:true});
   $('.hotbath-body-orientation')?.addEventListener('change',e=>{
    if(e.target.value&&orientationOptions.some(option=>option.reference===e.target.value))
      bodyChoiceByRef.set(p.reference,e.target.value);
    else bodyChoiceByRef.delete(p.reference);
    renderSelection();
   });
   $('.hotbath-variant').onchange=e=>{ref=e.target.value;renderSelection()};
   $('.hotbath-add').onclick=async()=>{
    if(busy||r.required&&!r.verified)return;
    busy=true;$('.hotbath-add').disabled=true;
    try{
     // createSelectedProductRecord and HydroRoughIn.reconcile already handle the
     // verified p.internalReference as a separate mandatory child of this line.
     // No second copy of the body may be inserted by this dialog.
     // Forward the exact or generic same-model photo chosen in the visual
     // configurator to the project. Never change the tariff reference or price.
     const selectedPhoto=selectedImage(m.base,p);
     await onAdd({...p,hotbathSelectedCollection:collection,purchaseDiscount:negotiatedDiscount,
        catalogue2026Page:cataloguePage?.page||null,catalogue2026Url:cataloguePage?.url||'',
        technicalSheetUrl:docs.technicalSheetUrl||p.technicalSheetUrl||'',
        technicalSheetLabel:docs.technicalSheetUrl?'Fiche technique produit Hotbath · '+m.base:p.technicalSheetLabel||'',
       image:selectedPhoto.url||'',images:selectedPhoto.url?[selectedPhoto.url]:[],
       pdfImage:selectedPhoto.url||'',imageSource:selectedPhoto.caption,
       imageFinishMatch:selectedPhoto.scope==='exact'?'exact':'model-only',
       hotbathPhotoOriginal:selectedPhoto.url||'',hotbathVisualMode:'photo'},roomId);
     close();
    }catch(e){
     busy=false;renderSelection();alert('Ajout Hotbath impossible : '+(e?.message||String(e)));
    }
   };
   if(p.finishCode&&!curatedExact(collection,m.base,p.finishCode))requestImage(collection,m.base,p.finishCode);
   requestImage(collection,m.base);
  }
  function render(resetSearch=true){
   if(!ov.isConnected||!taxonomy||!media)return;
   const browserScroll=$('.hotbath-browser')?.scrollTop||0;
   const modelScroll=$('.hotbath-models')?.scrollTop||0;
   const focus=$('.galassia-search')===document.activeElement;
   const pos=focus?$('.galassia-search').selectionStart:null;
   if(resetSearch)$('.galassia-search').value=search;
   renderCollections();renderCategories();renderModels();renderSelection();
   if($('.hotbath-browser'))$('.hotbath-browser').scrollTop=browserScroll;
   if($('.hotbath-models'))$('.hotbath-models').scrollTop=modelScroll;
   if(focus){const input=$('.galassia-search');input.focus();input.setSelectionRange(pos,pos)}
  }
  $('.galassia-search').oninput=e=>{search=e.target.value;base='';ref='';render(false)};
  Promise.all([
   fetch('/brand-guide-hotbath-taxonomy.json?v=__APP_VERSION__',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Taxonomy');return r.json()}),
   fetch('/brand-guide-hotbath-media.json?v=__APP_VERSION__',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Photos');return r.json()}),
   fetch('/hotbath-italian-product-media.json?v=__APP_VERSION__',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Catalogue Italie');return r.json()}),
   fetch('/hotbath-exact-alternative-media.json?v=__APP_VERSION__',{cache:'no-cache'}).then(r=>r.ok?r.json():{byCollection:{}}).catch(()=>({byCollection:{}})),
   fetch('/hotbath-curated-finishes-2026.json?v=__APP_VERSION__',{cache:'no-cache'}).then(r=>r.ok?r.json():{collections:{}}).catch(()=>({collections:{}}))
  ]).then(([a,b,c,d,e])=>{taxonomy=a;media=b;italian=c;supplemental=d;curated=e;render()}).catch(e=>{
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
