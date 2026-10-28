/* Hydropolis Visual Manufacturer Guide — V11.62.3
 * Official collection navigation, catalogue-backed models, exact priced finishes.
 * Source prices/references always come from the existing Hydropolis catalogue.
 */
(function(root){
'use strict';
const BRANDS=['Zucchetti','Hotbath','Lefroy Brooks','Gessi'];
const OFFICIAL={
  Zucchetti:'https://www.zucchettidesign.it/en/products',
  Hotbath:'https://hotbath.it/fr/home',
  'Lefroy Brooks':'https://uk.lefroybrooks.com/'
};
const ORDER={
 Zucchetti:['Octo X','Veloce','Pan S','Sablier','Isy22','Helm','Octo','Medameda','Bellagio','Agorà','Jingle','Hoop','Bar 59'],
 Hotbath:['Gent','Archie','Guy','Chap','Ace','Gal','Cobber','Cobber X','Fellow','Tron','Mate','Ray'],
 'Lefroy Brooks':['1900 Classic','1910 La Chapelle','1920 Ten Ten','1930 Mackintosh','1935 Janey Mac','1940 Fifth','1950 Belle Aire','XO']
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const nrm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const euro=v=>Number(v).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const safeUrl=(url)=>/^(https:\/\/|\/(?!\/)|images\/)/i.test(String(url||''))?String(url):'';
function displayCollection(brand,value){
 const val=String(value||'').trim();
 if(!val)return 'Autres collections';
 const normal=nrm(val);
 if(brand==='Lefroy Brooks'){
   for(const label of ORDER[brand])if(nrm(label)===normal||nrm(label).includes(normal)&&normal.length>=3)return label;
   if(normal==='tenten')return '1920 Ten Ten';
   if(normal==='classic')return '1900 Classic';
   if(normal==='lachapelle')return '1910 La Chapelle';
   if(normal==='mackintosh')return '1930 Mackintosh';
   if(normal==='janeymac')return '1935 Janey Mac';
   if(normal==='fifth')return '1940 Fifth';
   if(normal==='belleaire')return '1950 Belle Aire';
 }
 if(brand==='Zucchetti'){
   // The imported tariff uses "Zucchetti" as an umbrella label for parts and
   // uncategorised SKUs. It is not a manufacturer collection; keep these rows
   // available without incorrectly presenting them as a named collection.
   if(normal==='zucchetti')return 'Références sans collection attribuée';
   for(const label of ORDER[brand])if(nrm(label)===normal)return label;
 }
 if(brand==='Hotbath'){
   for(const label of ORDER[brand])if(nrm(label)===normal)return label;
 }
 return val;
}
function modelBase(p){
 const base=String(p?.base||'').trim();
 if(base)return base;
 const ref=String(p?.reference||'').trim(),finish=String(p?.finishCode||'').trim();
 if(finish&&ref.endsWith('.'+finish))return ref.slice(0,-finish.length-1);
 return ref;
}
function groupProducts(rows,brand){
 const indexed=new Map();
 for(const p of rows||[]){
   if(p?.manufacturer!==brand)continue;
   const name=displayCollection(brand,p.collection);
   if(!indexed.has(name))indexed.set(name,[]);
   indexed.get(name).push(p);
 }
 const weight=x=>{const i=ORDER[brand].indexOf(x);return i<0?1000:i};
 return [...indexed].sort((a,b)=>weight(a[0])-weight(b[0])||a[0].localeCompare(b[0],'fr')).map(([name,products])=>({name,products}));
}
function groupModels(rows){
 const grouped=new Map();
 for(const p of rows||[]){
   const key=modelBase(p);
   if(!key)continue;
   if(!grouped.has(key))grouped.set(key,[]);
   grouped.get(key).push(p);
 }
 return [...grouped].map(([base,variants])=>({base,variants})).sort((a,b)=>a.base.localeCompare(b.base,'fr',{numeric:true}));
}
function typeLabel(p){return String(p?.productType||p?.type||'').trim();}
function subtypeLabel(p){
 const named=typeLabel(p);
 if(named)return named;
 if(p.manufacturer!=='Lefroy Brooks')return '';
 const d=String(p.designation||'').toLowerCase();
 if(/\b(wall[\s-]?mounted|mural|encastr[eé])\b/.test(d))return 'Montage mural / encastré';
 if(/\b(deck[\s-]?mounted|sur plage|sur plan|sur gorge)\b/.test(d))return 'Montage sur plage';
 return '';
}
const validPrice=p=>Number.isFinite(Number(p?.totalPrice??p?.price))&&Number(p?.totalPrice??p?.price)>0;
let mediaPromise=null;
async function getMedia(){
 if(!mediaPromise){
   let failed=false;
   // Zucchetti/Lefroy Brooks must retain their own photos if Hotbath media
   // is temporarily unavailable (and vice versa). Retry failed indexes next time.
   const request=(url,label,fallback)=>fetch(url,{cache:'force-cache'})
     .then(r=>{if(!r.ok)throw Error(label+' '+r.status);return r.json()})
     .catch(e=>{failed=true;console.warn('[ManufacturerGuide] '+label+' index unavailable',e);return fallback});
   mediaPromise=Promise.all([
     request('/brand-guide-collections.json','Collections',{collections:{},models:{}}),
     request('/brand-guide-hotbath-media.json','Hotbath',{models:{},collections:{}})
   ]).then(([collections,hotbath])=>{
     if(failed)mediaPromise=null;
     return {collections,hotbath};
   });
 }
 return mediaPromise;
}
function findCollectionVisual(brand,name,media){
 const dict=brand==='Hotbath'?media.hotbath.collections:media.collections.collections?.[brand]||{};
 const normal=nrm(name);
 let entry=Object.entries(dict||{}).find(([label])=>nrm(label)===normal);
 if(!entry)return {image:'',url:OFFICIAL[brand]};
 const data=entry[1],img=brand==='Hotbath'?(media.hotbath.collectionImages?.[entry[0]]||''):(typeof data==='string'?data:data?.image);
 return {image:safeUrl(img),url:typeof data==='string'?OFFICIAL[brand]:safeUrl(data?.url)||OFFICIAL[brand]};
}
function findModelVisual(brand,p,base,media){
 const rawBase=String(base||'').trim(), upper=rawBase.toUpperCase().replace(/\s+/g,'').replace(/_/g,'-');
 const reduced=upper.replace(/[^A-Z0-9]/g,'');
 const dict=brand==='Hotbath'
   ?(media.hotbath.byCollection?.[displayCollection('Hotbath',p?.collection)]||{})
   :(media.collections.models?.[brand]||{});
 const lookup=key=>safeUrl(dict?.[key]);
 // Supplier catalogues often share a generic base photo across finishes.
 // Prefer a verified official model photo, scoped to the current collection.
 const official=lookup(upper)||lookup(reduced)||lookup(reduced.replace(/^([A-Z]{2})(\d{4})$/,'$1-$2'));
 // Curated product-page image must match the exact model + finish code.
 // Never transfer an image between different product references or finishes.
 const finish=String(p?.finishCode||'').trim().toUpperCase();
 const exactOfficial=safeUrl(media.collections.finishModels?.[brand]?.[reduced]?.[finish]);
 if(exactOfficial)return {image:exactOfficial,caption:'Photographie fabricant de la finition '+finish,match:'exact'};
 const owned=safeUrl(p?.image)||(Array.isArray(p?.images)?safeUrl(p.images[0]):'');
 const exactFlag=String(p?.imageSource||'').toLowerCase();
 const finishCode=String(p?.finishCode||'').replace(/[^a-z0-9]/gi,'');
 const finishPattern=finishCode?new RegExp('(?:[._-])'+finishCode+'(?:[._-]|$)','i'):null;
 const filename=owned.split('?')[0].split('/').pop()||'';
 const exactImage=owned&&(/\b(exact|référence précise|finish-specific)\b/i.test(exactFlag)
   ||(finishCode&&finishPattern.test(filename)&&filename.toUpperCase().includes(reduced)));
 if(exactImage)return {image:owned,caption:'Visuel catalogue de la finition sélectionnée',match:'exact'};
 if(official)return {image:official,caption:'Photographie officielle du modèle · finition illustrative',match:'model'};
 if(owned)return {image:owned,caption:'Illustration catalogue · finition à vérifier',match:'catalogue'};
 return {image:'',caption:'Visuel du modèle non disponible',match:'missing'};
}
/* Shared Gessi-style visual finish selector. Only proven exact-finish images are shown
 * inside finish tiles; representative model photos remain on the main visual only. */
function finishTiles(brand,variants,active,base,media){
 return '<div class="mg-visual-finishes" role="group" aria-label="Choisir la finition et la référence">'+
  (variants||[]).map(p=>{
   const visual=findModelVisual(brand,p,base,media);
   const exact=visual.match==='exact'?safeUrl(visual.image):'';
   const pressed=p.reference===active;
   return '<button type="button" class="mg-visual-finish'+(pressed?' is-current':'')+'" data-mg-finish="'+esc(p.reference)+'" aria-pressed="'+pressed+'">'+
    (exact?'<img src="'+esc(exact)+'" alt="" loading="lazy" decoding="async" onerror="this.style.display=\\'none\\'">':'<span class="mg-finish-image-missing" aria-hidden="true">Finition à confirmer sur photo</span>')+
    '<span>'+esc(p.finish||p.finishCode||'Standard')+'</span><small>'+esc(p.reference)+'</small></button>';
  }).join('')+'</div>';
}
function isSupported(brand){return BRANDS.includes(brand)}
function open(brand,rows,roomId,onAdd){
 if(!isSupported(brand))return;
 if(brand==='Gessi')return root.HydroGessiAreaPro?.open?.(rows,roomId,onAdd);
 const source=Array.isArray(rows)?rows.filter(p=>p?.manufacturer===brand):[];
 let stage='collections',collection=null,category='',subcategory='',model=null,finishRef='',modelSearch='',modelPage=0,media={collections:{collections:{},models:{}},hotbath:{models:{},collections:{}}},overlay;
 const state={brand,rows:source,roomId,media};
 const groups=groupProducts(source,brand);
 const shown=()=>collection?.products||[];
 const filtered=()=>shown().filter(p=>(!category||String(p.category||'Autres')===category)&&(!subcategory||subtypeLabel(p)===subcategory));
 const tiles=(items,cls)=>'<div class="mg-grid '+cls+'">'+items.map(x=>{
   const name=esc(x.name),description=esc(x.note||'');
   const photo=x.image?'<span class="mg-tile-photo"><img loading="lazy" decoding="async" src="'+esc(x.image)+'" alt="'+name+'" onerror="this.parentNode.classList.add(\'mg-image-broken\')"><span class="mg-photo-unavailable" aria-hidden="true">Photographie indisponible</span></span>'
     :'<span class="mg-tile-photo mg-image-broken"><span class="mg-photo-unavailable">Photographie indisponible</span></span>';
   return '<button class="mg-tile '+(x.selected?'selected':'')+'" type="button" data-go="'+esc(x.action)+'" data-value="'+esc(x.key)+'" title="'+description+'" aria-label="'+name+(description?' · '+description:'')+'">'+
     photo+'<span class="mg-tile-meta"><strong>'+name+'</strong><small>'+description+'</small></span></button>';
 }).join('')+'</div>';
 const breadcrumb=()=>'<nav class="mg-breadcrumb" aria-label="Parcours du configurateur">'+[
  {name:brand,step:'collections'},...(collection?[{name:collection.name,step:'categories'}]:[]),
  ...(category?[{name:category,step:'subcategories'}]:[]),...(model?[{name:model.base,step:'models'}]:[])
 ].map((x,i)=>'<button type="button" data-step="'+esc(x.step)+'">'+esc(x.name)+'</button>').join('<span aria-hidden="true">›</span>')+'</nav>';
 function render(){
   let content='',header='',selected=null;
   if(stage==='collections'){
     header='Choisir une collection';
     const options=groups.map(g=>{const official=findCollectionVisual(brand,g.name,media);
       const firstImage=g.products.map(p=>findModelVisual(brand,p,modelBase(p),media).image).find(Boolean);
       return {name:g.name,key:g.name,action:'collection',image:official.image||firstImage||'',note:groupModels(g.products).length+' modèles'};
     });
     content=tiles(options,'mg-collections');
     if(!options.length)content='<p class="mg-empty">Le catalogue de cette marque est en cours de chargement. Revenez après la fin du chargement des tarifs.</p>';
   }else if(stage==='categories'){
     header=collection.name+' · Choisir un espace';
     const by=new Map();
     for(const p of shown()){const key=String(p.category||'Autres').trim()||'Autres';if(!by.has(key))by.set(key,[]);by.get(key).push(p);}
     const out=[...by].sort((a,b)=>a[0].localeCompare(b[0],'fr')).map(([name,list])=>{
       const hero=findCollectionVisual(brand,collection.name,media);
       const img=list.map(p=>findModelVisual(brand,p,modelBase(p),media).image).find(Boolean)||hero.image;
       return {name,key:name,action:'category',image:img,note:groupModels(list).length+' modèles · visuel illustratif'};
     });content=tiles(out,'mg-categories');
   }else if(stage==='subcategories'){
     header=collection.name+' · '+category;
     const subgroups=[...new Set(filtered().map(subtypeLabel).filter(Boolean))];
     if(subgroups.length>1){
       const choices=[{name:'Tous les modèles',key:'',action:'subcategory',note:'Voir toute la catégorie',image:''},
         ...subgroups.sort().map(n=>({name:n,key:n,action:'subcategory',note:'Filtre de type de produit',image:''}))];
       content=tiles(choices,'mg-subcategories');
     }else{stage='models';return render();}
   }else if(stage==='models'){
     header=collection.name+' · '+category;
     const models=groupModels(filtered()), term=nrm(modelSearch);
     const choices=models.filter(g=>!term||nrm(g.base+' '+g.variants[0]?.designation).includes(term));
     const PAGE=48,visible=choices.slice(modelPage*PAGE,(modelPage+1)*PAGE);
     content='<div class="mg-search"><label>Rechercher un modèle <input type="search" id="mgSearch" placeholder="Référence, désignation…" value="'+esc(modelSearch)+'"></label><span>'+choices.length+' modèles</span></div>'+
      tiles(visible.map(g=>{const p=g.variants.find(x=>safeUrl(x.image))||g.variants[0],v=findModelVisual(brand,p,g.base,media);
       return {name:g.base,key:g.base,action:'model',image:v.image,note:String(p?.designation||'').slice(0,100)};
      }),'mg-products mg-official-gallery')+(choices.length>PAGE?'<div class="mg-pagination"><button type="button" id="mgPrev" '+(modelPage===0?'disabled':'')+'>Précédent</button> Page '+(modelPage+1)+' / '+Math.ceil(choices.length/PAGE)+' <button type="button" id="mgNext" '+((modelPage+1)*PAGE>=choices.length?'disabled':'')+'>Suivant</button></div>':'');
     if(!choices.length)content='<div class="mg-empty">Aucun modèle ne correspond à cette recherche.</div>';
   }else if(stage==='finish'){
     header=collection.name+' · '+model.base;
     const variants=model.variants,first=variants[0];
     if(!variants.some(p=>p.reference===finishRef))finishRef=first.reference;
     selected=variants.find(p=>p.reference===finishRef)||first;
     const imageResult=findModelVisual(brand,selected,model.base,media);
     const official=findCollectionVisual(brand,collection.name,media);
     const sku=nrm(model.base);
     const supplierPage=Object.entries(media.collections.modelPages?.[brand]||{})
       .find(([candidate])=>nrm(candidate)===sku)?.[1];
     // A verified model detail is more useful than the supplier homepage.
     const link=safeUrl(supplierPage)||safeUrl(selected.manufacturerUrl)||official.url;
     content='<section class="mg-detail"><div class="mg-photo">'+
       (imageResult.image?'<img src="'+esc(imageResult.image)+'" alt="'+esc(model.base)+'" onerror="this.style.display=\'none\'">':'<div class="mg-noimage">Image de référence indisponible</div>')+
       '<small>'+esc(imageResult.caption)+'</small></div><div class="mg-config"><div class="mg-ref">Référence de base : '+esc(model.base)+'</div><h3>'+esc(selected.designation||model.base)+'</h3>'+
       '<div class="mg-finish-caption">Choisir une finition · référence tarifée</div>'+finishTiles(brand,variants,finishRef,model.base,media)+
       '<div class="mg-finalref">Référence finale : <b>'+esc(selected.reference)+'</b></div>'+
       (validPrice(selected)?'<strong class="mg-price">'+euro(Number(selected.totalPrice??selected.price))+' HT</strong>':'<strong>Prix à confirmer</strong>')+
       (selected.internalReference?'<p class="mg-roughin">Corps / complément requis : '+esc(selected.internalReference)+' · '+euro(Number(selected.internalPrice||0))+' HT'+(Number(selected.totalPrice)>Number(selected.price)?' (inclus dans le prix affiché)':'')+'</p>':'')+
       '<a class="mg-official" target="_blank" rel="noopener noreferrer" href="'+esc(link)+'">Voir chez le fabricant</a>'+
       '<button type="button" class="btn primary" id="mgAdd" '+(validPrice(selected)?'':'disabled')+'>Ajouter au projet</button></div></section>';
   }
   overlay.querySelector('.mg-content').innerHTML='<div class="mg-section-head"><h2>'+esc(header)+'</h2><small>Visuels fabricants · références et prix issus du catalogue Hydropolis</small></div>'+breadcrumb()+content;
   overlay.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{
     const next=b.dataset.step;
     if(next==='collections'){stage='collections';collection=null;category='';subcategory='';model=null;}
     else if(next==='categories'){stage='categories';category='';subcategory='';model=null;}
     else if(next==='subcategories'){stage='subcategories';subcategory='';model=null;}
     else if(next==='models'){stage='models';model=null;}
     render();
   });
   overlay.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{
     const key=b.dataset.value,act=b.dataset.go;
     if(act==='collection'){collection=groups.find(g=>g.name===key);category='';subcategory='';stage='categories';}
     else if(act==='category'){category=key;subcategory='';stage='subcategories';}
     else if(act==='subcategory'){subcategory=key;stage='models';modelPage=0;modelSearch='';}
     else if(act==='model'){model=groupModels(filtered()).find(g=>g.base===key);finishRef='';stage='finish';}
     render();
   });
   const search=overlay.querySelector('#mgSearch');
   if(search)search.oninput=()=>{modelSearch=search.value;modelPage=0;const sel=search.selectionStart;render();const again=overlay.querySelector('#mgSearch');again?.focus();if(again)again.setSelectionRange(sel,sel);};
   const prev=overlay.querySelector('#mgPrev'),next=overlay.querySelector('#mgNext');
   if(prev)prev.onclick=()=>{modelPage=Math.max(0,modelPage-1);render()};
   if(next)next.onclick=()=>{modelPage+=1;render()};
   overlay.querySelectorAll('[data-mg-finish]').forEach(button=>button.onclick=()=>{
     finishRef=button.dataset.mgFinish;render();
     [...overlay.querySelectorAll('[data-mg-finish]')].find(b=>b.dataset.mgFinish===finishRef)?.focus();
   });
   const add=overlay.querySelector('#mgAdd');
   if(add)add.onclick=()=>{if(!selected||!validPrice(selected))return;try{onAdd(selected);close()}catch(err){alert('Impossible d’ajouter la référence : '+(err?.message||String(err)))}};
 }
 function close(){overlay?.remove();root.removeEventListener('keydown',keyListener);}
 function keyListener(e){if(e.key==='Escape')close();}
 overlay=document.createElement('div');
 overlay.className='mg-overlay';overlay.id='manufacturerGuidedSelector';
 overlay.innerHTML='<div class="mg-dialog" role="dialog" aria-modal="true" aria-label="Configurateur '+esc(brand)+'"><div class="mg-header"><span class="mg-brand">'+esc(brand)+'</span><button class="mg-close" type="button" aria-label="Fermer">×</button></div><div class="mg-content"></div></div>';
 document.body.appendChild(overlay);
 overlay.querySelector('.mg-close').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 root.addEventListener('keydown',keyListener);
 render();
 getMedia().then(m=>{if(!overlay.isConnected)return;media=m;state.media=m;render()});
 return state;
}
root.HydroManufacturerGuide={isSupported,open,displayCollection,modelBase,groupProducts,groupModels,findCollectionVisual,findModelVisual,finishTiles,getMedia};
})(window);
