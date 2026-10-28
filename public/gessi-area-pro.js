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
function buildIndex(rows,data){
 const areas=data?.areas||[],byName=new Map(),unmapped=[];
 for(const p of rows||[]){
   if(p?.manufacturer!=='Gessi')continue;
   const name=officialName(p.collection,areas);
   if(!name){unmapped.push(p);continue}
   const key=norm(name);
   if(!byName.has(key))byName.set(key,[]);
   byName.get(key).push(p);
 }
 return {areas,byName,unmapped,total:(rows||[]).filter(p=>p?.manufacturer==='Gessi').length};
}
function listAreaCollections(index,area){
 const entries=(area?.collections||[]).map(name=>({name,rows:index.byName.get(norm(name))||[]}));
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
 const body=overlay.querySelector('.gessi-body'),menu=overlay.querySelector('.gessi-menu');
 const close=()=>{overlay.remove();root.removeEventListener('keydown',onKey)};
 const onKey=e=>{if(e.key==='Escape')close()};
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
    return card({key:a.id,action:'area',name:a.name,note:a.note+' · '+groups.filter(g=>g.rows.length).length+' collections du tarif',image:bestPhoto(rows,data)});
   }).join('')+'</div>';
  }else if(stage==='collections'){
   heading=area.name;sub='Collections Gessi · photographies de produits représentatifs lorsque disponibles';
   html='<div class="gessi-grid gessi-collections">'+listAreaCollections(index,area).map(c=>card({
    action:'collection',key:c.name,name:c.name,note:c.rows.length?modelsFor(c.rows).length+' modèles du tarif':'Pas de référence tarifée',image:bestPhoto(c.rows,data),unavailable:!c.rows.length
   })).join('')+'</div><a class="gessi-site-link" href="'+esc(areaUrl(area))+'" target="_blank" rel="noopener noreferrer">Voir toutes les collections sur Area Pro ↗</a>';
  }else if(stage==='types'){
   heading=collection.name;sub='Sélectionnez une famille de produits';
   html='<div class="gessi-grid gessi-types">'+typesFor(collectionRows()).map(c=>card({
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
    '<div class="gessi-reference-list"><label for="gessi-finishes">Finition &amp; référence tarifée</label><select id="gessi-finishes">'+variants.map(v=>'<option value="'+esc(v.reference)+'" '+(v.reference===reference?'selected':'')+'>'+esc(v.finish||v.finishCode||'Standard')+' — '+esc(v.reference)+'</option>').join('')+'</select></div>'+
    '<div class="gessi-swatchbox">'+(code?'<span class="gessi-swatch"><img alt="" src="https://gessistorage.azureedge.net/finiturethumb/'+encodeURIComponent(code)+'.jpg" onerror="this.style.display=\'none\'"></span>':'')+
    '<div><small>FINITION SÉLECTIONNÉE</small><b>'+esc(p.finish||code||'Standard')+'</b></div></div>'+
    '<div class="gessi-selection">Référence finale <b>'+esc(p.reference)+'</b></div>'+
    (hasPrice(p)?'<strong class="gessi-price">'+money(p.totalPrice??p.price)+' <small>HT · tarif Hydropolis</small></strong>':'<p class="gessi-no-price">Prix public non disponible : ajout impossible</p>')+
    (p.internalReference?'<p class="gessi-required">Corps / complément : '+esc(p.internalReference)+' · '+money(Number(p.internalPrice||0))+' HT'+(Number(p.totalPrice)>Number(p.price)?' (prix total indiqué ci-dessus)':'')+'</p>':'')+
    '<a class="gessi-site-link" href="'+esc(productPage(p))+'" target="_blank" rel="noopener noreferrer">Fiche fabricant, plans et documents techniques ↗</a>'+
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
  const select=body.querySelector('#gessi-finishes');if(select)select.onchange=()=>{reference=select.value;render()};
  const add=body.querySelector('#gessi-add');
  if(add)add.onclick=()=>{
    const p=model.variants.find(v=>v.reference===reference);
    if(!p||!hasPrice(p))return;
    try{onAdd(p);close()}catch(e){root.alert?.('Ajout impossible : '+(e?.message||String(e)))}
  };
 }
 fetch('/gessi-area-pro-data.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Gessi '+r.status);return r.json()}).then(x=>{
   if(!overlay.isConnected)return;
   data=x;index=buildIndex(source,data);render();
 }).catch(e=>{if(overlay.isConnected)body.innerHTML='<p class="gessi-error">Impossible de charger le menu Gessi : '+esc(e.message)+'</p><a href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">Ouvrir Area Pro ↗</a>'});
 return {brand:'Gessi',rows:source,roomId,close};
}
root.HydroGessiAreaPro={open,buildIndex,listAreaCollections,modelsFor,typesFor,modelBase,finishCode,findImage,productPage,officialName};
})(window);
