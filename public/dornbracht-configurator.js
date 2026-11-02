/* Hydropolis · Dornbracht visual configurator (Hotbath / Galassia interaction pattern).
 * Only catalog 2026 authorizes product references/prices. Manufacturer fr-fr
 * product pages authorize photos and required accessories; unknown FR items blocked.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroDornbrachtConfigurator=api;
})(typeof window==='object'?window:null,function(root){
'use strict';
const COLL_IMAGES={
 'TARA':'https://media.cdn.dornbracht.com/v/Eos9BWx5/crop:6656x11832,fp:2573,0/fit-in:480x10000/quality:65/TARA_Champagne_01_V1.webp',
 'VAIA':'https://media.cdn.dornbracht.com/v/9SRLJ3GT/crop:6644x11812,fp:2652,0/fit-in:480x10000/quality:65/VAIA_Dark-Platinum_01_V1.webp',
 'META':'https://media.cdn.dornbracht.com/v/0y5liLFm/crop:4913x8734,fp:3367,0//fit-in:480x10000/quality:65/META_Chrome_02_V2.webp',
 'MEM':'https://media.cdn.dornbracht.com/v/i31MZyfD/crop:6551x11646,fp:2148,0/fit-in:480x10000/quality:65/MEM_Champagne_01_V1.webp',
 'CYO':'https://media.cdn.dornbracht.com/v/IAL1j2wd/crop:8532x11376,fp:101,0//fit-in:350x10000/quality:65/CYO_Dark-Platinum_01.webp',
 'IMO':'https://media.cdn.dornbracht.com/v/YhNfHqtF/crop:6551x11646,fp:2831,0/fit-in:480x10000/quality:65/IMO_new_Chrome_01_V1.webp',
 'MADISON':'https://media.cdn.dornbracht.com/v/8ipEDHH7/crop:6548x11640,fp:2895,0/fit-in:480x10000/quality:65/MADISON_Durabrass_01_V2.webp',
 'LISSÉ':'https://media.cdn.dornbracht.com/v/qjKXVfAx/crop:4960x6613,fp:0,304//fit-in:350x10000/quality:65/Lisse_5_035.webp'
};
const COLLECTION_ORDER=['TARA','TARA ULTRA','TARA CLASSIC','VAIA','META','META SQUARE','MEM','CYO','CL.1','IMO','LISSÉ','MADISON','LULU','ELIO','LOT','ENO','SYMETRICS','SYNC','CULT','JUST','SERIES SPECIFIC','ARTICLES GÉNÉRIQUES'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const euro=n=>Number(n||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const good=p=>p?.manufacturer==='Dornbracht'&&p.reference&&Number(p.price)>0;
function family(p){
 const cat=String(p.category||'Autres');
 const d=normalize(p.designation);
 if(cat==='Lavabo'){
  if(/bec (deverseur|déverseur)|bec lavabo/.test(d))return 'Becs de lavabo';
  if(/mitigeur|melangeur|mélangeur|robinet/.test(d))return 'Mitigeurs et mélangeurs';
 }
 if(cat==='Douche'){
  if(/douchette|pomme de douche|douche de tete|douche de tête|pomme de tete/.test(d))return 'Douchettes et pommes';
  if(/thermostat|mitigeur|melangeur|mélangeur/.test(d))return 'Commandes et thermostatiques';
  if(/barre|flexible|bras de douche/.test(d))return 'Barres, bras et flexibles';
 }
 return cat;
}
function mayNeedBody(p){
 const name=normalize(p?.designation);
 if(/corps (?:d.encastrement|encastre)|montage (?:encastre|encastré)|mitigeur.+(?:a encastrer|à encastrer)/.test(name)&&
   !/corps|mitigeur monocommande mural a encastrer$|mitigeur monocommande mural à encastrer$/.test(name))return true;
 return /(?:mitigeur|melangeur|mélangeur|robinet|thermostat|bec).{0,100}(?:mural|encastre|encastré)/.test(name) &&
  !/^\s*(?:mitigeur|mélangeur).*(?:à encastrer|a encastrer)$/.test(name);
}
function indexRows(rows){
 const originals=(rows||[]).filter(good),byRef=new Map(originals.map(p=>[p.reference,p])),collections=new Map();
 for(const p of originals){
  let c=collections.get(p.collection);if(!c){c={name:p.collection,rows:[],categories:new Map()};collections.set(p.collection,c)}
  c.rows.push(p);
  const cat=family(p);let fam=c.categories.get(cat);if(!fam){fam={label:cat,models:new Map()};c.categories.set(cat,fam)}
  const key=String(p.base||p.reference);
  let model=fam.models.get(key);
  if(!model){model={base:key,variants:[]};fam.models.set(key,model)}
  model.variants.push(p);
 }
 return {originals,byRef,collections};
}
function accessoryOptions(info,byRef){
 return (info?.accessories||[]).map(a=>{
  const row=byRef.get(a.reference);
  return {...a,row,priced:!!row&&Number.isFinite(Number(row.price))&&Number(row.price)>0,
   selectable:a.francePageVerified===true&&!!row&&Number(row.price)>0};
 });
}
function open(rows,roomId,onAdd,initial){
 if(typeof document==='undefined'||!Array.isArray(rows)||!rows.some(good)||typeof onAdd!=='function')
  return Promise.reject(Error('Dornbracht : tarif ou callback indisponible'));
 const index=indexRows(rows),$dummy=null;
 const sorted=[...index.collections.keys()].sort((a,b)=>
  (COLLECTION_ORDER.indexOf(a)<0?999:COLLECTION_ORDER.indexOf(a))-
  (COLLECTION_ORDER.indexOf(b)<0?999:COLLECTION_ORDER.indexOf(b))||a.localeCompare(b,'fr'));
 let collection=initial?.collection&&index.collections.has(initial.collection)?initial.collection:(sorted.includes('TARA')?'TARA':sorted[0]);
 let category=initial?.manufacturer==='Dornbracht'?family(initial):'',base=initial?.manufacturer==='Dornbracht'?String(initial.base||initial.reference):'',
 reference=initial?.reference||'',search='',selectedBody='',page=0,busy=false,closed=false;
 const media=new Map(),loading=new Set(),tasks=[],maxParallel=3;let parallel=0;
 document.querySelector('.dornbracht-modal')?.remove();
 const overlay=document.createElement('div');overlay.className='galassia-modal dornbracht-modal';
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Configurateur Dornbracht');
 overlay.innerHTML='<div class="galassia-shell dornbracht-shell">'+
  '<header class="galassia-top"><div><span class="galassia-eyebrow">DORNBRACHT · FAB-DIS 2026</span><h2>Configurer Dornbracht</h2>'+
  '<p>Collection → famille → modèle → finition → accessoires nécessaires pour la France</p></div>'+
  '<button type="button" class="galassia-close" aria-label="Fermer">×</button></header>'+
  '<div class="galassia-body dornbracht-body"><aside class="galassia-collections dornbracht-collections"></aside>'+
  '<main class="galassia-browser dornbracht-browser"><div class="galassia-filters"><div class="galassia-path">Références exactes · photos fabricant · prix publics HT</div>'+
  '<label>Rechercher<input type="search" class="galassia-search" placeholder="Référence, catégorie, désignation…"></label></div>'+
  '<div class="galassia-subfamilies dornbracht-categories"></div><div class="galassia-models dornbracht-models"></div>'+
  '<nav class="dornbracht-pages"></nav></main><section class="galassia-selection dornbracht-selection"></section></div></div>';
 document.body.append(overlay);
 const $=s=>overlay.querySelector(s),$$=s=>[...overlay.querySelectorAll(s)];
 const close=()=>{closed=true;document.removeEventListener('keydown',key);overlay.remove()};
 const key=e=>{if(e.key==='Escape')close()};
 document.addEventListener('keydown',key);$('.galassia-close').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 function fetchMedia(ref){
  if(!ref||media.has(ref)||loading.has(ref))return;
  loading.add(ref);tasks.push(ref);drain();
 }
 function drain(){
  while(parallel<maxParallel&&tasks.length){
   const ref=tasks.shift();parallel++;
   fetch('/api/dornbracht-product-config?reference='+encodeURIComponent(ref),{credentials:'same-origin'})
    .then(r=>r.ok?r.json():null).then(info=>{
     if(info?.ok&&info.reference===ref)media.set(ref,info);
     else media.set(ref,{ok:false,reference:ref,image:'',accessories:[],error:'Fiche France indisponible'});
    }).catch(()=>media.set(ref,{ok:false,reference:ref,image:'',accessories:[],error:'Fiche France non vérifiée'}))
    .finally(()=>{
     loading.delete(ref);parallel--;
     if(!closed&&overlay.isConnected){renderModels();if(reference===ref)renderSelection();}
     drain();
    });
  }
 }
 const available=()=>index.collections.get(collection);
 const categories=()=>[...(available()?.categories.values()||[])].sort((a,b)=>a.label.localeCompare(b.label,'fr'));
 function activeCategory(){
  const values=categories();if(!values.some(c=>c.label===category))category=values[0]?.label||'';
  return values.find(c=>c.label===category);
 }
 function models(){
  const needle=normalize(search.trim()),list=[...(activeCategory()?.models.values()||[])];
  return list.filter(m=>!needle||[m.base,...m.variants.flatMap(p=>[p.reference,p.designation,p.finish])].some(x=>normalize(x).includes(needle)))
   .sort((a,b)=>a.base.localeCompare(b.base,'fr',{numeric:true}));
 }
 function activeModel(){
  const list=models();if(!list.some(m=>m.base===base)){
   base=list[0]?.base||'';reference='';selectedBody='';page=0;
  }
  return list.find(m=>m.base===base);
 }
 function variant(){
  const m=activeModel();if(!m)return null;
  if(!m.variants.some(p=>p.reference===reference))reference=m.variants[0]?.reference||'';
  return m.variants.find(p=>p.reference===reference)||null;
 }
 function modelPhoto(m){
  const refs=m.variants.map(v=>v.reference);
  return refs.map(r=>media.get(r)?.image).find(Boolean)||'';
 }
 function renderCollections(){
  $('.dornbracht-collections').innerHTML=sorted.map(name=>{
   const total=index.collections.get(name).rows.length,url=COLL_IMAGES[name]||'';
   return '<button type="button" class="galassia-family'+(collection===name?' active':'')+'" data-collection="'+esc(name)+'">'+
    (url?'<img src="'+esc(url)+'" loading="lazy" alt="Photo de collection '+esc(name)+'">':'<span class="galassia-no-photo">D</span>')+
    '<span>'+esc(name==='SERIES SPECIFIC'?'Autres produits de séries':name==='ARTICLES GÉNÉRIQUES'?'Articles génériques':name)+
    '<small>'+total.toLocaleString('fr-FR')+' références</small></span></button>';
  }).join('');
  $$('[data-collection]').forEach(b=>b.onclick=()=>{
   collection=b.dataset.collection;category='';base='';reference='';selectedBody='';search='';page=0;$('.galassia-search').value='';render();
  });
 }
 function renderCategories(){
  const cats=categories();activeCategory();
  $('.dornbracht-categories').innerHTML=cats.map(c=>'<button type="button" class="galassia-section'+(category===c.label?' active':'')+
   '" data-category="'+esc(c.label)+'"><strong>'+esc(c.label)+'</strong><small>'+c.models.size+' modèles</small></button>').join('');
  $$('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;base='';reference='';selectedBody='';page=0;render(false)});
 }
 function renderModels(){
  const list=models();activeModel();
  if(page>Math.floor(Math.max(0,list.length-1)/36))page=0;
  const visible=list.slice(page*36,page*36+36);
  $('.dornbracht-models').innerHTML=visible.map(m=>{
   const photo=modelPhoto(m),min=Math.min(...m.variants.map(v=>Number(v.price)));
   const label=m.variants[0]?.designation||m.base;
   return '<button type="button" class="galassia-model'+(m.base===base?' active':'')+'" data-model="'+esc(m.base)+'">'+
    '<span class="galassia-model-photo">'+(photo?'<img src="'+esc(photo)+'" alt="Modèle '+esc(m.base)+'" loading="lazy" onerror="this.style.display=\'none\'">':
    '<span class="galassia-no-photo">Photo à vérifier</span>')+'</span><strong>'+esc(label)+'</strong><small>'+
    esc(m.base)+' · '+m.variants.length+' finition(s)</small><small>Dès '+euro(min)+' HT</small></button>';
  }).join('')||'<p class="galassia-empty">Aucune référence dans cette famille.</p>';
  $$('[data-model]').forEach(b=>b.onclick=()=>{base=b.dataset.model;reference='';selectedBody='';renderSelection();renderModels()});
  // Bounded progressive manufacturer image discovery; not a 9,000-SKU blast.
  for(const m of visible.slice(0,12))if(!modelPhoto(m))fetchMedia(m.variants[0]?.reference);
  $('.dornbracht-pages').innerHTML=list.length>36?
   '<button type="button" data-page="-1" '+(!page?'disabled':'')+'>Précédent</button><span>Page '+(page+1)+' / '+Math.ceil(list.length/36)+'</span>'+
   '<button type="button" data-page="1" '+((page+1)*36>=list.length?'disabled':'')+'>Suivant</button>':'';
  $$('[data-page]').forEach(b=>b.onclick=()=>{page+=Number(b.dataset.page);renderModels()});
 }
 function renderSelection(){
  const item=variant(),m=activeModel();
  if(!item){$('.dornbracht-selection').innerHTML='<p class="galassia-empty">Choisissez un modèle Dornbracht.</p>';return}
  const info=media.get(item.reference),options=accessoryOptions(info,index.byRef);
  const usable=options.filter(o=>o.selectable);
  if(!usable.some(x=>x.reference===selectedBody))selectedBody=usable[0]?.reference||'';
  const body=usable.find(x=>x.reference===selectedBody)?.row;
  const hasNecessary=options.length>0;
  const needsChecking=mayNeedBody(item);
  const pending=(!info||loading.has(item.reference));
  const missing=!!info&&!info.ok,unconfirmed=options.filter(o=>!o.francePageVerified||!o.priced);
  // A failed photo lookup is not a reason to block a standalone priced item.
  // Concealed trims do require an official FR accessory check before sale.
  const blocked=(hasNecessary&&!body)||(needsChecking&&(!info||missing||!hasNecessary));
  const photo=info?.image||modelPhoto(m);
  const price=Number(item.price),sum=price+(body?Number(body.price):0);
  const accessoryCards=hasNecessary?'<div class="dornbracht-accessory-options">'+options.map(o=>
   '<button type="button" data-body="'+esc(o.reference)+'" class="dornbracht-body-option'+(o.reference===selectedBody?' active':'')+
   '" '+(!o.selectable?'disabled':'')+'><b>'+esc(o.label||o.row?.designation||'Corps encastré')+'</b>'+
   '<span>Réf. '+esc(o.reference)+'</span><small>'+(o.francePageVerified?(o.priced?euro(o.row.price)+' HT':'Prix non présent dans le tarif 2026'):
     'Fiche produit France non vérifiée · non sélectionnable')+'</small></button>').join('')+'</div>':
   '<p class="dornbracht-missing">'+(pending?'Vérification des accessoires de la fiche officielle…':
      needsChecking?'Fiche fabricant : corps d’encastrement à confirmer avant ajout.':'Aucun accessoire nécessaire identifié pour cet article.')+'</p>';
  const content='<div class="galassia-photo">'+(photo?'<img src="'+esc(photo)+'" alt="Photo du modèle Dornbracht" loading="lazy" onerror="this.style.display=\'none\'">':
   '<div class="galassia-no-photo">Photo de la référence non disponible</div>')+'</div>'+
   '<div class="galassia-image-note">'+(info?.image?'Photo sur la fiche officielle de la référence choisie':
      'Photo du modèle illustrative ou absente · finition exacte non certifiée')+'</div>'+
   '<span class="galassia-eyebrow">'+esc(collection)+' · '+esc(category)+'</span><h3>'+esc(item.designation)+'</h3>'+
   '<label>Finition et référence<select class="dornbracht-variant">'+m.variants.map(p=>
    '<option value="'+esc(p.reference)+'"'+(p.reference===reference?' selected':'')+'>'+
     esc(p.finish||'Sans finition')+' · '+esc(p.reference)+' · '+euro(p.price)+' HT</option>').join('')+'</select></label>'+
   '<div class="galassia-summary"><div><span>Référence</span><b>'+esc(item.reference)+'</b></div>'+
    '<div><span>Prix public HT</span><b>'+euro(price)+'</b></div>'+
    (body?'<div><span>Corps '+esc(body.reference)+'</span><b>'+euro(body.price)+'</b></div>':'')+
    '<div><span>Total public HT</span><b>'+euro(sum)+'</b></div>'+
    '<div><span>Remise d’achat</span><b>50 %</b></div>'+
    '<div><span>Coût d’achat estimé HT</span><b>'+euro(sum*.5)+'</b></div></div>'+
   '<div class="dornbracht-accessory"><strong>Accessoires nécessaires · marché français</strong>'+
    (missing?'<p class="dornbracht-missing">Fiche fabricant France indisponible : complément obligatoire non vérifié.</p>':'')+
    accessoryCards+
    (unconfirmed.length?'<small>Les références sans fiche française vérifiée ne sont pas disponibles à la sélection.</small>':'')+
    '</div>'+
   '<div class="galassia-docs"><a target="_blank" rel="noopener noreferrer" href="'+esc(info?.manufacturerUrl||item.manufacturerUrl)+'">Voir la fiche Dornbracht France</a>'+
    '<small>Prix et références : FAB-DIS 2026 · complément rattaché à la commande si nécessaire.</small></div>'+
   '<button type="button" class="galassia-add dornbracht-add" '+(busy||pending||blocked?'disabled':'')+'>'+
    (busy?'Ajout…':pending?'Vérification fabricant…':blocked?'Vérifier le corps compatible':'Ajouter la configuration au projet')+'</button>';
  $('.dornbracht-selection').innerHTML=content;
  $('.dornbracht-variant').onchange=e=>{reference=e.target.value;selectedBody='';fetchMedia(reference);renderSelection()};
  $$('[data-body]').forEach(b=>b.onclick=()=>{selectedBody=b.dataset.body;renderSelection()});
  $('.dornbracht-add').onclick=async()=>{
   if(busy||blocked||pending)return;
   busy=true;renderSelection();
   try{
    const selected={...item,dornbrachtConfigured:true,dornbrachtSelectedCollection:collection,
     dornbrachtVerifiedBody:body?.reference||'',dornbrachtManufacturerPage:info.manufacturerUrl,
     purchaseDiscount:50,...(info.image?{image:info.image,imageSource:'Dornbracht officiel · référence exacte'}:{})};
    await onAdd(selected,body?{...body,dornbrachtRequiredBody:true,requiredRoughIn:true,purchaseDiscount:50}:null,roomId);
    close();
   }catch(e){busy=false;renderSelection();alert('Dornbracht : '+(e.message||e))}
  };
  if(!info)fetchMedia(item.reference);
 }
 function render(resetSearch=true){
  if(closed||!overlay.isConnected)return;
  renderCollections();renderCategories();renderModels();renderSelection();
  if(resetSearch)$('.galassia-search').value=search;
 }
 $('.galassia-search').oninput=e=>{
  const input=e.target,position=input.selectionStart;
  search=input.value;page=0;base='';reference='';selectedBody='';
  render(false);
  input.focus();
  try{input.setSelectionRange(position,position)}catch{}
 };
 render();
 return Promise.resolve(true);
}
return {open,indexRows,family,mayNeedBody,accessoryOptions,COLL_IMAGES};
});