/* Gessi Area Pro-inspired visual explorer. All priced articles are the ORIGINAL Hydropolis tariff objects. */
(function(root){
'use strict';
const SOURCE='https://areapro.gessi.com/fr';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const money=v=>Number(v).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const trusted=v=>/^(https:\/\/|\/(?!\/)|images\/)/i.test(String(v||''))?String(v):'';
const uniq=items=>[...new Set(items)];
function modelBase(p){
 const raw=String(p?.base||p?.reference||'').trim();
 const numeric=/^(\d{5})(?:[.#/_-]?\d{3})?$/.exec(raw);
 if(numeric)return numeric[1];
 const reference=String(p?.reference||'').trim(), m=/^(\d{5})(?:[.#/_-]?\d{3})?$/.exec(reference);
 return m?m[1]:raw;
}
function finishCode(p){
 const explicit=String(p?.finishCode||'').trim();
 if(explicit)return explicit;
 const ref=String(p?.reference||'');
 const b=modelBase(p);
 if(/^\d{5}$/.test(b)&&ref.startsWith(b)){
   const rest=ref.slice(b.length).replace(/^[.#/_-]/,'');
   if(/^\d{3}$/.test(rest))return rest;
 }
 return '';
}
function exactImage(p,data){const b=modelBase(p),code=finishCode(p);return trusted(data?.exactFinishImages?.[b]?.[code])}
function findImage(p,data){const exact=exactImage(p,data);if(exact)return {src:exact,match:'exact'};const fromCatalog=trusted(p?.image)||(Array.isArray(p?.images)?trusted(p.images[0]):'');return {src:fromCatalog,match:fromCatalog?'illustrative':'missing'};}
function productPage(p){
 const base=modelBase(p),code=finishCode(p);
 if(!/^\d{5}$/.test(base))return SOURCE;
 return SOURCE+'/product/'+base+(code?'?finId='+encodeURIComponent(code):'');
}
function areaUrl(area){return SOURCE+'/'+encodeURIComponent(area?.id||'bathroom')}
function collectionUrl(area,name){
 if(!area||!name)return SOURCE;
 const slug=norm(name)==='gessi316'?'gessi316':String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 return areaUrl(area)+'/collections/'+slug;
}
// Keep the existing tariff index compatible while adding verified menu metadata.
function withOfficialMenu(data,menu){
 if(!Array.isArray(menu?.areas)||!menu.areas.length)return data;
 return {...data,areas:menu.areas.map(a=>({id:a.id,name:a.name,note:'Menu officiel Gessi',
   collections:a.collections.map(c=>c.name),collectionDetails:a.collections}))};
}
function collectionDetails(area,name){return area?.collectionDetails?.find(c=>norm(c.name)===norm(name))||null}
function officialPhoto(area,name){return trusted(collectionDetails(area,name)?.image)}
function officialName(source,areas){
 const key=norm(source);
 if(!key)return '';
 let found='';
 for(const a of areas)for(const name of a.collections){
   const n=norm(name);
   if(n===key)return name;
   // Real supplier tariff descriptions occasionally append a series or a catalogue type.
   if(key.startsWith(n)&&key.length>n.length&&n.length>=5&&!found)found=name;
 }
 return found;
}
// Several official collections span multiple universes (e.g. Inciso / Kitchen / Sensor Taps).
// Partition the original tariff objects: never duplicate an SKU across universes.
function selectArea(p,name,areas){
 const allowed=areas.filter(a=>a.collections.some(c=>norm(c)===norm(name)));
 if(allowed.length<=1)return allowed[0];
 const explicit=norm(p?.universe||p?.univers||p?.areaProArea||p?.environment||p?.catalogue||p?.catalog||p?.section||'');
 const chosen=allowed.find(a=>norm(a.id)===explicit||norm(a.name)===explicit);
 if(chosen)return chosen;
 const detail=norm([p?.category,p?.productType,p?.subcategory,p?.family,p?.collection,p?.designation].filter(Boolean).join(' '));
 if(allowed.some(a=>a.id==='kitchen')&&/(cuisine|kitchen|evier|sink)/.test(detail))return allowed.find(a=>a.id==='kitchen');
 if(allowed.some(a=>a.id==='sensor-taps')&&/(electronique|sensor|capteur|infrarouge)/.test(detail))return allowed.find(a=>a.id==='sensor-taps');
 if(allowed.some(a=>a.id==='private-wellness')&&/(wellness|hammam|sauna|spa)/.test(detail))return allowed.find(a=>a.id==='private-wellness');
 // Ambiguous records stay in their default catalogue instead of being copied everywhere.
 return allowed.find(a=>a.id==='bathroom')||allowed[0];
}
function buildIndex(rows,data){
 const areas=data?.areas||[],byName=new Map(),byAreaName=new Map(),unmapped=[];
 for(const p of rows||[]){
   if(p?.manufacturer!=='Gessi')continue;
   const name=officialName(p.collection,areas);
   if(!name){unmapped.push(p);continue}
   const area=selectArea(p,name,areas);
   if(!area){unmapped.push(p);continue}
   const key=norm(name),areaKey=area.id+'|'+key;
   if(!byName.has(key))byName.set(key,[]);
   if(!byAreaName.has(areaKey))byAreaName.set(areaKey,[]);
   byName.get(key).push(p);
   byAreaName.get(areaKey).push(p);
 }
 return {areas,byName,byAreaName,unmapped,total:(rows||[]).filter(p=>p?.manufacturer==='Gessi').length};
}
function listAreaCollections(index,area){
 const entries=(area?.collections||[]).map(name=>({name,details:collectionDetails(area,name),rows:index.byAreaName?.get(area.id+'|'+norm(name))||[]}));
 if(area?.id==='bathroom'&&index.unmapped.length)entries.push({name:'Autres références du tarif',rows:index.unmapped,notOfficial:true});
 return entries;
}
function modelsFor(rows){
 const grouped=new Map();
 for(const p of rows||[]){
   const base=modelBase(p);if(!base)continue;
   if(!grouped.has(base))grouped.set(base,[]);
   grouped.get(base).push(p);
 }
 return [...grouped].map(([base,variants])=>({base,variants})).sort((a,b)=>a.base.localeCompare(b.base,'fr',{numeric:true}));
}
function typesFor(rows){
 const groups=new Map();
 for(const p of rows||[]){
   const name=String(p.productType||p.category||'Autres produits').trim()||'Autres produits';
   if(!groups.has(name))groups.set(name,[]);
   groups.get(name).push(p);
 }
 return [...groups].map(([name,items])=>({name,rows:items})).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
}
function bestPhoto(rows,data){for(const p of rows||[]){const m=findImage(p,data);if(m.src)return m.src}return '';}
function hasPrice(p){const v=Number(p?.totalPrice??p?.price);return Number.isFinite(v)&&v>0}
function card(o){
 const image=o.image?'<img src="'+esc(o.image)+'" alt="" loading="lazy" decoding="async" onerror="this.parentNode.classList.add(\'gessi-image-error\')">':'';
 const unavailable=o.unavailable?' gessi-no-tariff':'';
 return '<button type="button" class="gessi-card'+unavailable+'" data-action="'+esc(o.action)+'" data-key="'+esc(o.key)+'" '+(o.unavailable?'disabled title="Aucune référence de ce groupe dans le tarif Hydropolis"':'')+'>'+
 '<span class="gessi-card-image">'+image+'<span class="gessi-card-placeholder">Visuel non disponible</span></span>'+
 '<span class="gessi-card-info"><strong>'+esc(o.name)+'</strong><small>'+esc(o.note||'')+'</small></span></button>';
}
function technicalMarkup(record){
 const fields=Array.isArray(record?.technical)?record.technical:[];
 if(!fields.length)return '<p class="gessi-tech-empty">Caractéristiques détaillées non communiquées par le service officiel. Consultez la fiche du fabricant pour les PDF disponibles.</p>';
 return '<dl class="gessi-tech-list">'+fields.slice(0,60).map(x=>'<div><dt>'+esc(x.name)+'</dt><dd>'+esc(x.value)+'</dd></div>').join('')+'</dl>'+
 '<p class="gessi-tech-source">Source : caractéristiques du produit Gessi · les dimensions d’emballage sont exclues.</p>';
}
function open(rows,roomId,onAdd){
 const source=(rows||[]).filter(p=>p?.manufacturer==='Gessi');
 if(typeof document==='undefined')throw Error('Navigateur requis');
 const overlay=document.createElement('div');overlay.className='gessi-overlay';overlay.id='gessiAreaProOverlay';
 overlay.innerHTML='<section role="dialog" aria-modal="true" aria-label="Explorateur visuel Gessi" class="gessi-dialog">'+
 '<header class="gessi-top"><div><small>HYDROPOLIS STUDIO · GESSI</small><h2>Area Pro <span>Collections</span></h2></div><button type="button" class="gessi-close" aria-label="Fermer">×</button></header>'+
 '<div class="gessi-layout"><nav class="gessi-menu" aria-label="Univers Gessi"></nav><main class="gessi-main"><div class="gessi-body"><p>Chargement des collections…</p></div></main></div>'+
 '</section>';
 document.body.appendChild(overlay);
 let data=null,index=null,area=null,collection=null,type='',model=null,reference='',stage='areas',search='',page=0;
 const technicalCache=new Map();
 async function loadTechnical(base){
   if(!/^\d{5}$/.test(base))return;
   let record=technicalCache.get(base);
   if(!record){
     try{
       const response=await fetch('/api/gessi/technical/'+base,{headers:{Accept:'application/json'}});
       if(!response.ok)throw Error('Gessi '+response.status);
       const payload=await response.json();
       if(payload.code!==base)throw Error('Référence technique non concordante');
       record=payload;technicalCache.set(base,record);
     }catch(error){
       record={technical:[]};
       // An upstream failure must not disable pricing, configuration or adding an item.
     }
   }
   if(stage==='finish'&&model?.base===base){
     const target=body.querySelector('#gessi-tech-content');
     if(target)target.innerHTML=technicalMarkup(record);
   }
 }
 const body=overlay.querySelector('.gessi-body'),menu=overlay.querySelector('.gessi-menu');
 const previousFocus=document.activeElement;
 const close=()=>{overlay.remove();root.removeEventListener('keydown',onKey);previousFocus?.focus?.()};
 const onKey=e=>{
  if(e.key==='Escape'){e.preventDefault();close()}
  if(e.key==='Tab'){
   const controls=[...overlay.querySelectorAll('button:not([disabled]),a[href],input,select')].filter(el=>el.getClientRects().length);
   const first=controls[0],last=controls[controls.length-1];
   if(e.shiftKey&&(document.activeElement===first||!overlay.contains(document.activeElement))){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&(document.activeElement===last||!overlay.contains(document.activeElement))){e.preventDefault();first?.focus()}
  }
 };
 overlay.querySelector('.gessi-close').focus();
 overlay.querySelector('.gessi-close').onclick=close;
 overlay.onclick=e=>{if(e.target===overlay)close()};
 root.addEventListener('keydown',onKey);
 function collectionRows(){return collection?.rows||[]}
 function typeRows(){return type?collectionRows().filter(p=>String(p.productType||p.category||'Autres produits').trim()===type):collectionRows()}
 function renderMenu(){
   menu.innerHTML='<small class="gessi-menu-heading">EXPLOREZ LES UNIVERS</small>'+index.areas.map(a=>{
     const count=listAreaCollections(index,a).reduce((n,g)=>n+g.rows.length,0);
     return '<button type="button" class="'+(area?.id===a.id?'active':'')+'" data-area="'+esc(a.id)+'">'+esc(a.name)+'<small>'+count.toLocaleString('fr-FR')+'</small></button>';
   }).join('')+'<a href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">Site officiel Gessi Area Pro ↗</a>';
   menu.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>{area=index.areas.find(a=>a.id===b.dataset.area);collection=null;model=null;type='';stage='collections';search='';page=0;render()});
 }
 function render(){
  if(!overlay.isConnected)return;
  renderMenu();
  const back='<nav class="gessi-crumb" aria-label="Navigation">'+
    '<button type="button" data-stage="areas">Gessi</button>'+
    (area?' <span>›</span> <button type="button" data-stage="collections">'+esc(area.name)+'</button>':'')+
    (collection?' <span>›</span> <button type="button" data-stage="types">'+esc(collection.name)+'</button>':'')+
    (type?' <span>›</span> <button type="button" data-stage="models">'+esc(type)+'</button>':'')+
    (model?' <span>›</span> <span>'+esc(model.base)+'</span>':'')+'</nav>';
  let html='',heading='',sub='';
  if(stage==='areas'){
   heading='Choisissez votre univers';sub='L’architecture officielle du menu Gessi Area Pro';
   html='<div class="gessi-grid gessi-univers">'+index.areas.map(a=>{
    const groups=listAreaCollections(index,a),rows=groups.flatMap(g=>g.rows);
    return card({key:a.id,action:'area',name:a.name,note:groups.filter(g=>!g.notOfficial).length+' collections officielles',image:a.collectionDetails?.find(c=>trusted(c.image))?.image||bestPhoto(rows,data)});
   }).join('')+'</div>';
  }else if(stage==='collections'){
   heading=area.name;sub='Collections officielles Gessi · choisissez une collection illustrée';
   html='<div class="gessi-grid gessi-collections">'+listAreaCollections(index,area).map(c=>card({
    action:'collection',key:c.name,name:c.name,note:c.rows.length?modelsFor(c.rows).length+' modèles du tarif':'Pas de référence tarifée',image:officialPhoto(area,c.name)||bestPhoto(c.rows,data)
   })).join('')+'</div><a class="gessi-site-link" href="'+esc(areaUrl(area))+'" target="_blank" rel="noopener noreferrer">Voir toutes les collections sur Area Pro ↗</a>';
  }else if(stage==='types'){
   heading=collection.name;sub=collectionRows().length?'Sélectionnez une famille de produits':'Collection officielle · tarif Hydropolis non disponible';
   html=(!collectionRows().length?'<p class="gessi-empty">Les articles de cette collection ne sont pas encore intégrés au tarif Hydropolis. Consultez les références et configurations sur le site officiel Gessi.</p>':'')+'<div class="gessi-grid gessi-types">'+typesFor(collectionRows()).map(c=>card({
    action:'type',key:c.name,name:c.name,note:modelsFor(c.rows).length+' modèles',image:bestPhoto(c.rows,data)
   })).join('')+'</div><a class="gessi-site-link" href="'+esc(collection.notOfficial?areaUrl(area):collectionUrl(area,collection.name))+'" target="_blank" rel="noopener noreferrer">Voir la collection chez Gessi ↗</a>';
  }else if(stage==='models'){
   heading=type||collection.name;sub=collection.name+' · choisissez un produit avant sa finition';
   const models=modelsFor(typeRows());
   const matching=models.filter(m=>!search||norm(m.base+' '+m.variants[0]?.designation).includes(norm(search)));
   const PAGE=36;page=Math.min(page,Math.max(0,Math.ceil(matching.length/PAGE)-1));
   html='<div class="gessi-searchbar"><label>Rechercher une référence ou un produit <input id="gessi-search" type="search" placeholder="Référence, description…" value="'+esc(search)+'"></label><span>'+matching.length.toLocaleString('fr-FR')+' modèles</span></div>'+
    '<div class="gessi-grid gessi-products">'+matching.slice(page*PAGE,(page+1)*PAGE).map(m=>card({
    action:'model',key:m.base,name:m.base,note:String(m.variants[0]?.designation||m.variants[0]?.category||'Gessi').slice(0,95),image:bestPhoto(m.variants,data)
    })).join('')+'</div>'+
    (matching.length>PAGE?'<div class="gessi-pager"><button id="gessi-prev" '+(page===0?'disabled':'')+'>Précédent</button><span>Page '+(page+1)+' / '+Math.ceil(matching.length/PAGE)+'</span><button id="gessi-next" '+((page+1)*PAGE>=matching.length?'disabled':'')+'>Suivant</button></div>':'');
   if(!matching.length)html+='<p class="gessi-empty">Aucun résultat dans ce groupe.</p>';
  }else if(stage==='finish'){
   heading='Configurez votre référence';sub=collection.name+' · produit '+model.base;
   const variants=model.variants;
   if(!variants.some(p=>p.reference===reference))reference=variants[0]?.reference||'';
   const p=variants.find(x=>x.reference===reference)||variants[0],pic=findImage(p,data),code=finishCode(p);
   const img=pic.src?'<img src="'+esc(pic.src)+'" alt="Produit '+esc(model.base)+'" onerror="this.parentNode.classList.add(\'gessi-image-error\')">':'';
   html='<div class="gessi-detail"><div class="gessi-large-photo">'+img+'<div class="gessi-image-placeholder">Visuel exact indisponible</div>'+
    '<small>'+(pic.match==='exact'?'Photographie Gessi correspondant au code finition '+esc(code):pic.match==='illustrative'?'Visuel catalogue : la finition représentée peut différer':'Aucune photographie vérifiée pour cette référence')+'</small></div>'+
    '<div class="gessi-configuration"><span class="gessi-kicker">RÉFÉRENCE DE BASE · '+esc(model.base)+'</span><h3>'+esc(p.designation||p.productType||model.base)+'</h3>'+
    '<div class="gessi-reference-list"><span>Finition &amp; référence tarifée</span><div class="gessi-finish-grid" role="group" aria-label="Choisir la finition">'+variants.map(v=>{
      const code=finishCode(v),photo=exactImage(v,data);
      return '<button type="button" class="gessi-finish-choice" data-finish="'+esc(v.reference)+'" aria-pressed="'+(v.reference===reference)+'">'+
       (photo?'<img class="gessi-finish-product" src="'+esc(photo)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':code?'<img class="gessi-finish-swatch" src="https://gessistorage.azureedge.net/finiturethumb/'+encodeURIComponent(code)+'.jpg" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'')+
       '<span>'+esc(v.finish||code||'Standard')+'</span><small>'+esc(v.reference)+'</small></button>';
    }).join('')+'</div></div>'+
    '<div class="gessi-swatchbox">'+(code?'<span class="gessi-swatch"><img alt="" src="https://gessistorage.azureedge.net/finiturethumb/'+encodeURIComponent(code)+'.jpg" onerror="this.style.display=\'none\'"></span>':'')+
    '<div><small>FINITION SÉLECTIONNÉE</small><b>'+esc(p.finish||code||'Standard')+'</b></div></div>'+
    '<div class="gessi-selection">Référence finale <b>'+esc(p.reference)+'</b></div>'+
    (hasPrice(p)?'<strong class="gessi-price">'+money(p.totalPrice??p.price)+' <small>HT · tarif Hydropolis</small></strong>':'<p class="gessi-no-price">Prix public non disponible : ajout impossible</p>')+
    (p.internalReference?'<p class="gessi-required">Corps / complément : '+esc(p.internalReference)+' · '+money(Number(p.internalPrice||0))+' HT'+(Number(p.totalPrice)>Number(p.price)?' (prix total indiqué ci-dessus)':'')+'</p>':'')+
    '<section class="gessi-tech-panel" aria-label="Fiche technique Gessi"><h4>Fiche technique du produit</h4><div id="gessi-tech-content" aria-live="polite">Chargement des données fabricant…</div></section>'+ 
    '<a class="gessi-site-link" href="'+esc(productPage(p))+'" target="_blank" rel="noopener noreferrer">Consulter la fiche Gessi et ses éventuels PDF ↗</a>'+
    '<button id="gessi-add" type="button" class="gessi-add" '+(hasPrice(p)?'':'disabled')+'>Ajouter cette référence au projet</button></div></div>';
  }
  body.innerHTML=back+'<div class="gessi-heading"><span>GESSI · AREA PRO</span><h2>'+esc(heading)+'</h2><p>'+esc(sub)+'</p></div>'+html;
  body.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{const st=b.dataset.stage;stage=st;if(st==='areas'){area=null;collection=null;model=null;type=''}else if(st==='collections'){collection=null;model=null;type=''}else if(st==='types'){model=null;type=''}else if(st==='models'){model=null}page=0;search='';render()});
  body.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{
    const action=b.dataset.action,key=b.dataset.key;
    if(action==='area'){area=index.areas.find(a=>a.id===key);stage='collections';collection=null;model=null;type=''}
    if(action==='collection'){collection=listAreaCollections(index,area).find(c=>c.name===key);stage='types';model=null;type=''}
    if(action==='type'){type=key;stage='models';model=null}
    if(action==='model'){model=modelsFor(typeRows()).find(m=>m.base===key);reference='';stage='finish'}
    page=0;search='';render();
  });
  const inp=body.querySelector('#gessi-search');if(inp)inp.oninput=()=>{search=inp.value;page=0;const pos=inp.selectionStart;render();const next=body.querySelector('#gessi-search');if(next){next.focus();if(pos!==null)next.setSelectionRange(pos,pos)}};
  const prev=body.querySelector('#gessi-prev'),next=body.querySelector('#gessi-next');
  if(prev)prev.onclick=()=>{page=Math.max(0,page-1);render()};
  if(next)next.onclick=()=>{page+=1;render()};
  body.querySelectorAll('[data-finish]').forEach(button=>button.onclick=()=>{
    reference=button.dataset.finish;render();
    [...body.querySelectorAll('[data-finish]')].find(b=>b.dataset.finish===reference)?.focus();
  });
  if(stage==='finish')loadTechnical(model?.base||'');
  const add=body.querySelector('#gessi-add');
  if(add)add.onclick=()=>{
    const p=model.variants.find(v=>v.reference===reference);
    if(!p||!hasPrice(p))return;
    try{onAdd(p);close()}catch(e){root.alert?.('Ajout impossible : '+(e?.message||String(e)))}
  };
 }
 Promise.all([
  fetch('/gessi-area-pro-data.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Gessi '+r.status);return r.json()}),
  fetch('/gessi-area-pro-menu.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Menu '+r.status);return r.json()}).catch(()=>null)
 ]).then(([legacy,official])=>{
   const x=withOfficialMenu(legacy,official);
   if(!overlay.isConnected)return;
   data=x;index=buildIndex(source,data);render();
 }).catch(e=>{if(overlay.isConnected)body.innerHTML='<p class="gessi-error">Impossible de charger le menu Gessi : '+esc(e.message)+'</p><a href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">Ouvrir Area Pro ↗</a>'});
 return {brand:'Gessi',rows:source,roomId,close};
}
root.HydroGessiAreaPro= {technicalMarkup,withOfficialMenu,collectionDetails,officialPhoto,open,buildIndex,listAreaCollections,selectArea,modelsFor,typesFor,modelBase,finishCode,findImage,productPage,officialName};
})(window);
