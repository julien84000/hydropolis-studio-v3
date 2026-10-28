/* V11.62.5 — Hotbath official collections → real manufacturer categories → article references.
 * The manufacturer taxonomy drives discovery. Only Hydropolis tariff rows drive prices.
 * Photos use the contemporary Hotbath CDN index. Never guess a price or photo.
 */
(function(root){
'use strict';
const guide=root.HydroManufacturerGuide;
if(!guide)return;
const originalOpen=guide.open;
const ORDER=['Gent','Archie','Guy','Chap','Ace','Gal','Cobber','Cobber X','Fellow','Tron','Mate','Ray'];
const clean=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validURL=s=>/^https:\/\/(?:hotbath\.com|hotbath\.it)\//.test(String(s||''))?s:'';
const price=p=>Number(p?.totalPrice??p?.price);
const euro=n=>Number(n).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
function modelKey(p){
 const base=String(p?.base||'').trim();
 if(base)return clean(base);
 const ref=String(p?.reference||''),finish=String(p?.finishCode||'');
 return clean(finish&&ref.endsWith('.'+finish)?ref.slice(0,-finish.length-1):ref.split('.')[0]);
}
function tariffIndex(rows){
 const index=new Map();
 for(const p of rows||[]){
   if(p?.manufacturer!=='Hotbath')continue;
   const col=String(p.collection||'');
   const key=modelKey(p);
   if(!col||!key)continue;
   const collection=index.get(col)||new Map();
   if(!index.has(col))index.set(col,collection);
   const records=collection.get(key)||[];
   if(!records.some(v=>v.reference===p.reference))records.push(p);
   collection.set(key,records);
 }
 return index;
}
function officialModels(collection,category,index){
 const priced=index.get(collection)||new Map();
 if(category?.extra){
   const refs=new Set((category.all||[]).map(clean));
   return [...priced].filter(([code])=>!refs.has(code)).map(([base,variants])=>({base:variants[0]?.base||base,variants,source:'tariff'}));
 }
 return (category?.refs||[]).map(base=>({base,variants:priced.get(clean(base))||[],source:'official'}));
}
function photo(model,collection,photos){
 // Always select by collection AND exact catalogue model code.
 // Older official Hotbath imagery is served from hotbath.it; the historical
 // filename must still identify the requested model. No generic fallback.
 const dict=photos?.byCollection?.[collection]||{};
 const key=clean(model?.base);
 if(!key)return '';
 for(const [ref,url] of Object.entries(dict)){
  if(clean(ref)!==key||typeof url!=='string')continue;
  const current=url.match(/^https:\/\/hotbath\.com\/images\/compano\/([^/?#]+)\//i);
  if(current&&clean(current[1])===key)return url;
  const historical=url.match(/^https:\/\/(?:www\.)?hotbath\.it\/documents\/ProdCateg\/\d+\/([^/?#]+\.(?:jpe?g|png))(?:\?.*)?$/i);
  if(historical){
   const code=decodeURIComponent(historical[1]).replace(/\.[^.]+$/,'').split('_')[0];
   if(clean(code)===key)return url;
  }
 }
 return '';
}
function categories(collection,taxonomy,index){
 const items=(taxonomy?.collections?.[collection]||[]).filter(x=>Array.isArray(x.refs));
 const all=items.flatMap(x=>x.refs);
 const indexed=index.get(collection)||new Map();
 const present=new Set(all.map(clean));
 const unmatched=[...indexed.keys()].filter(x=>!present.has(x));
 if(unmatched.length)items.push({label:'Autres références du tarif',extra:true,all,refs:unmatched,source:'Hydropolis'});
 return items;
}
function openHotbath(rows,roomId,onAdd){
 let overlay=null,phase='collections',collection='',category=null,current=null,chosen=null,search='',offset=0;
 const prices=tariffIndex(rows),ALL=48;
 let taxonomy=null,photos=null,loadFailed=false;
 const mount=()=>{
   overlay=document.createElement('div');overlay.className='mg-overlay mg-hotbath-official';overlay.id='manufacturerGuidedSelector';
   overlay.innerHTML='<div class="mg-dialog" role="dialog" aria-modal="true" aria-label="Catalogue Hotbath">'+
      '<div class="mg-header"><span class="mg-brand">Hotbath</span><button type="button" class="mg-close" aria-label="Fermer">×</button></div>'+
      '<div class="mg-content"></div></div>';
   document.body.appendChild(overlay);
   overlay.querySelector('.mg-close').onclick=close;
   overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
   root.addEventListener('keydown',keys);
 };
 const keys=e=>{if(e.key==='Escape')close()};
 const close=()=>{overlay?.remove();overlay=null;root.removeEventListener('keydown',keys)};
 const image=(url,name)=>url?'<span class="mg-tile-photo"><img src="'+esc(url)+'" alt="'+esc(name)+'" loading="lazy" decoding="async" onerror="this.parentNode.classList.add(\'mg-image-broken\')"><span class="mg-photo-unavailable">Photographie indisponible</span></span>'
   :'<span class="mg-tile-photo mg-image-broken"><span class="mg-photo-unavailable">Photographie indisponible</span></span>';
 const cards=(items,css)=>'<div class="mg-grid '+css+'">'+items.map(x=>
   '<button class="mg-tile" type="button" data-choose="'+esc(x.action)+'" data-value="'+esc(x.id)+'"'+(x.priced?' data-priced="true"':'')+' title="'+esc(x.note||'')+'">'+
   image(x.image,x.name)+'<span class="mg-tile-meta"><strong>'+esc(x.name)+'</strong><small>'+esc(x.note||'')+'</small></span></button>'
 ).join('')+'</div>';
 const list=()=>categories(collection,taxonomy,prices);
 const models=()=>officialModels(collection,category,prices);
 const repr=m=>m.variants?.find(p=>p.image)||m.variants?.[0]||null;
 const supplierLink=()=>validURL(category?.url)||'https://hotbath.com/en-gb/';
 const imageDetail=(model,variant)=>photo(model,collection,photos)||(variant&&/^https?:\/\//.test(variant.image||'')?variant.image:'');
 const breadcrumb=()=>{
   const levels=[{title:'Hotbath',phase:'collections'}];
   if(collection)levels.push({title:collection,phase:'categories'});
   if(category)levels.push({title:category.label,phase:'models'});
   if(current)levels.push({title:current.base,phase:'detail'});
   return '<nav class="mg-breadcrumb" aria-label="Étapes">'+levels.map(x=>
     '<button type="button" data-step="'+x.phase+'">'+esc(x.title)+'</button>').join('<span>›</span>')+'</nav>';
 };
 const missing=(label)=>'<div class="mg-empty">'+esc(label)+'</div>';
 function render(){
   if(!overlay?.isConnected)return;
   overlay.dataset.stage=phase;
   const target=overlay.querySelector('.mg-content');
   if(!taxonomy||!photos){
     target.innerHTML='<div class="mg-section-head"><h2>Catalogue Hotbath</h2></div>'+missing(loadFailed?'Index fabricant indisponible, réessayez plus tard.':'Chargement des collections et références du fabricant…');
     return;
   }
   let head='',body='';
   if(phase==='collections'){
     head='Les 12 collections de Hotbath';
     body=cards(ORDER.map(name=>{
       const cats=categories(name,taxonomy,prices);
       const entry=photos?.collectionImages?.[name];
       const first=Object.values(photos?.byCollection?.[name]||{}).find(Boolean);
       return {name,id:name,action:'collection',image:validURL(entry)||first||'',
         note:cats.filter(x=>!x.extra).length+' catégories · '+new Set(cats.filter(x=>!x.extra).flatMap(x=>x.refs)).size+' articles'};
     }),'mg-collections');
   }else if(phase==='categories'){
     head=collection+' · Catégories officielles';
     body='<p class="mg-guide-note">Les rubriques correspondent aux catégories réelles du site Hotbath, indépendamment du classement tarifaire Hydropolis.</p>'+
        cards(list().map(c=>{
         const model=officialModels(collection,c,prices);
         const v=model.map(m=>photo(m,collection,photos)).find(Boolean);
         return {name:c.label,id:c.id||c.label,action:'category',image:v||photos?.collectionImages?.[collection]||'',
           note:model.length+' références'+(c.extra?' · tarif uniquement':' · fabricant')};
        }),'mg-categories');
   }else if(phase==='models'){
     head=collection+' · '+category.label;
     const all=models(),term=clean(search);
     const filtered=all.filter(x=>!term||clean(x.base+' '+String(repr(x)?.designation||'')).includes(term));
     const paged=filtered.slice(offset*ALL,(offset+1)*ALL);
    const pictured=filtered.filter(x=>Boolean(photo(x,collection,photos))).length;
     body='<div class="mg-search"><label>Rechercher une référence<input id="hb-ref-search" type="search" placeholder="Référence ou désignation…" value="'+esc(search)+'"></label><span>'+pictured+' photos / '+filtered.length+' références</span></div>'+
        cards(paged.map(m=>({name:m.base,id:m.base,action:'model',image:photo(m,collection,photos),priced:m.variants.some(v=>price(v)>0),note:m.variants.some(v=>price(v)>0)
          ?'Tarif disponible · finition à choisir'
          :'Tarif non importé'})),'mg-products mg-official-gallery')+
        (filtered.length>ALL?'<div class="mg-pagination"><button type="button" id="hb-prev" '+(offset===0?'disabled':'')+'>Précédent</button><span>Page '+(offset+1)+' / '+Math.ceil(filtered.length/ALL)+'</span><button type="button" id="hb-next" '+((offset+1)*ALL>=filtered.length?'disabled':'')+'>Suivant</button></div>':'')+
        '<p class="mg-guide-note">Source : <a href="'+esc(supplierLink())+'" target="_blank" rel="noopener noreferrer">catalogue Hotbath · '+esc(category.label)+'</a>. Les articles absents du tarif restent consultables, sans prix estimé.</p>';
   }else if(phase==='detail'){
     head=collection+' · '+current.base;
     const variants=current.variants||[];
     if(!variants.some(p=>p.reference===chosen))chosen=variants[0]?.reference||'';
     const p=variants.find(x=>x.reference===chosen)||variants[0]||null;
     const url=imageDetail(current,p),hasPrice=Boolean(p&&price(p)>0&&Number.isFinite(price(p)));
     body='<section class="mg-detail"><div class="mg-photo">'+
       (url?'<img src="'+esc(url)+'" alt="'+esc(current.base)+'" onerror="this.style.display=\'none\'">':'<div class="mg-noimage">Image exacte indisponible</div>')+
       '<small>'+(photo(current,collection,photos)?'Photo fabricant du modèle · finition illustrative':'Image non vérifiée pour la finition')+'</small></div>'+
       '<div class="mg-config"><div class="mg-ref">Référence : '+esc(current.base)+'</div>'+
       '<h3>'+esc(p?.designation||current.base)+'</h3>'+
       (variants.length?'<label class="mg-finishes">Référence et finition<select id="hb-finish">'+variants.map(v=>
         '<option value="'+esc(v.reference)+'" '+(chosen===v.reference?'selected':'')+'>'+esc(v.finish||v.finishCode||'Standard')+' · '+esc(v.reference)+'</option>').join('')+'</select></label>':'')+
       (hasPrice?'<div class="mg-finalref">Référence tarif : <b>'+esc(p.reference)+'</b></div><strong class="mg-price">'+euro(price(p))+' HT</strong>':
        '<strong class="mg-price">Tarif à importer</strong><p class="mg-guide-note">Cette référence figure dans le catalogue officiel Hotbath, mais aucune correspondance tarifaire sûre n’est disponible dans Hydropolis. Aucun montant n’a été inventé.</p>')+
       (p?.internalReference?'<p class="mg-roughin">Corps technique : '+esc(p.internalReference)+' · '+euro(p.internalPrice||0)+' HT</p>':'')+
       '<a href="'+esc(supplierLink())+'" target="_blank" rel="noopener noreferrer" class="mg-official">Voir la catégorie sur Hotbath</a>'+
       (hasPrice?'<button type="button" class="btn primary" id="hb-add">Ajouter au projet</button>':'<button type="button" class="btn primary" disabled>Ajout indisponible · tarif absent</button>')+
       '</div></section>';
   }
   target.innerHTML='<div class="mg-section-head"><h2>'+esc(head)+'</h2><small>Catégories et articles du fabricant · prix issus du tarif Hydropolis</small></div>'+breadcrumb()+body;
   target.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{
     const stage=button.dataset.step;
     if(stage==='collections'){phase=stage;collection='';category=null;current=null;}
     if(stage==='categories'){phase=stage;category=null;current=null;}
     if(stage==='models'){phase=stage;current=null;}
     if(stage==='detail'){phase='detail';}
     offset=0;search='';render();
   });
   target.querySelectorAll('[data-choose]').forEach(button=>button.onclick=()=>{
     const a=button.dataset.choose,key=button.dataset.value;
     if(a==='collection'){collection=key;phase='categories';category=null;current=null;}
     if(a==='category'){category=list().find(c=>(c.id||c.label)===key);phase='models';offset=0;search='';current=null;}
     if(a==='model'){current=models().find(m=>m.base===key);phase='detail';chosen='';}
     render();
   });
   const finder=target.querySelector('#hb-ref-search');
   if(finder)finder.oninput=()=>{search=finder.value;offset=0;const at=finder.selectionStart;render();const next=target.querySelector('#hb-ref-search');next?.focus();if(next)next.setSelectionRange(at,at)};
   const previous=target.querySelector('#hb-prev'),next=target.querySelector('#hb-next');
   if(previous)previous.onclick=()=>{offset=Math.max(0,offset-1);render()};
   if(next)next.onclick=()=>{offset+=1;render()};
   const finish=target.querySelector('#hb-finish');
   if(finish)finish.onchange=()=>{chosen=finish.value;render()};
   const add=target.querySelector('#hb-add');
   if(add)add.onclick=()=>{const rec=(current.variants||[]).find(p=>p.reference===chosen);if(!rec||!(price(rec)>0))return;try{onAdd(rec);close()}catch(e){alert('Impossible d’ajouter : '+e.message)}};
 }
 mount();
 Promise.all([
  fetch('/brand-guide-hotbath-taxonomy.json?v=11.63.2',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Taxonomy '+r.status);return r.json()}),
  fetch('/brand-guide-hotbath-media.json?v=11.63.2',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Photos '+r.status);return r.json()})
 ]).then(([t,p])=>{taxonomy=t;photos=p;render()})
 .catch(e=>{console.warn('[HydroHotbathOfficialGuide]',e);loadFailed=true;render()});
 render();
}
guide.open=function(brand,rows,roomId,onAdd){
 if(brand==='Hotbath')return openHotbath(rows,roomId,onAdd);
 return originalOpen(brand,rows,roomId,onAdd);
};
root.HydroHotbathOfficialGuide={modelKey,tariffIndex,officialModels,categories,photo,open:openHotbath};
})(window);
