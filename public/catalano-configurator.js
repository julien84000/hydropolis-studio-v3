/* Catalano — collection-first visual configurator, analogous to Galassia.
 * Uses imported Catalano PRICE LIST 57, never guesses a price or SKU.
 * WC ancillary items are shown as separate selectable references and the user
 * must validate the final equipment/packaging with the installation notice.
 */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroCatalanoConfigurator=api;})(typeof window==='object'?window:null,function(root){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const price=v=>Number(v).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const eligible=p=>p?.manufacturer==='Catalano'&&!!p.reference&&Number(p.price)>0;
const galleryApi=root?.HydroCatalanoGallery||(typeof require==='function'?require('./catalano-gallery.js'):null);
const modelKey=p=>String(p.base||p.reference)+'|'+String(p.category||'');
const groupCollections=rows=>[...new Set(rows.filter(eligible).map(p=>p.collection))].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true}));
const categories=rows=>[...new Set(rows.map(p=>p.category))].sort((a,b)=>['WC','Lavabo','Douche','Bain','Accessoires'].indexOf(a)-['WC','Lavabo','Douche','Bain','Accessoires'].indexOf(b));
function variantsFor(rows,p){
 return rows.filter(r=>r.collection===p.collection&&modelKey(r)===modelKey(p))
  .sort((a,b)=>String(a.reference).localeCompare(String(b.reference),'fr',{numeric:true}));
}
function modelCards(rows,collection,category,query){
 const q=norm(query).trim(),found=new Map();
 for(const p of rows){
  if(p.collection!==collection||(category&&p.category!==category))continue;
  if(q&&![p.reference,p.base,p.designation,p.originalDescription,p.finish,p.collection,p.category].some(v=>norm(v).includes(q)))continue;
  const id=modelKey(p);
  if(!found.has(id))found.set(id,p);
 }
 return [...found.values()].sort((a,b)=>
  String(a.designation||'').localeCompare(String(b.designation||''),'fr',{numeric:true})||
  String(a.base||'').localeCompare(String(b.base||''),'fr',{numeric:true}));
}
function imageFor(p,photoResolver){
 const photo=typeof photoResolver==='function'?photoResolver(p):'';
 if(typeof photo==='string'&&/^(?:https:\/\/|\/api\/|\/images\/)/.test(photo))return {src:photo,scope:'model'};
 if(typeof p?.image==='string'&&/^(?:https:\/\/|\/api\/|\/images\/)/.test(p.image))return {src:p.image,scope:'model'};
 const fallback=root?.HydroCatalanoGallery?.family?.(p?.collection);
 return fallback?{src:fallback.image,scope:'collection'}:{src:'',scope:'missing'};
}
function open(initial,roomId,rows,onAdd,photoResolver,photoLoader){
 const all=(rows||[]).filter(eligible);
 if(!all.length)return Promise.reject(new Error('Aucune référence Catalano tarifée chargée'));
 if(typeof onAdd!=='function')return Promise.reject(new Error('Action de sauvegarde Catalano indisponible'));
 return new Promise(resolve=>{
  document.querySelector('.catalano-modal')?.remove();
  const overlay=document.createElement('div');
  overlay.className='galassia-modal catalano-modal';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Configurateur Catalano');
  overlay.innerHTML='<div class="galassia-shell catalano-shell"><div class="galassia-top"><div>'+
   '<span class="galassia-eyebrow">CATALANO · CERAMIC DESIGN</span><h2>Configurer Catalano</h2>'+
   '<p>Collection → type de produit → modèle → finition → WC et accessoires compatibles</p></div>'+
   '<button type="button" class="galassia-close" aria-label="Fermer">×</button></div>'+
   '<div class="galassia-body"><aside class="galassia-collections catalano-collections" aria-label="Collections Catalano"></aside>'+
   '<div class="galassia-browser"><div class="galassia-filters"><div class="galassia-path">Collections → familles → références tarifées</div>'+
   '<label>Rechercher dans cette collection<input class="galassia-search" type="search" placeholder="Référence, modèle, dimension…"></label></div>'+
   '<div class="galassia-subfamilies catalano-categories"></div><div class="galassia-models catalano-models"></div></div>'+
   '<section class="galassia-selection catalano-selection" aria-label="Référence Catalano sélectionnée"></section></div></div>';
  document.body.appendChild(overlay);
  const $=s=>overlay.querySelector(s),$$=s=>[...overlay.querySelectorAll(s)];
  const prev=document.activeElement;
  const collections=groupCollections(all);
  let collection=initial?.manufacturer==='Catalano'&&collections.includes(initial.collection)?initial.collection:collections.includes('Zero')?'Zero':collections[0];
  let category=initial?.manufacturer==='Catalano'?initial.category:'';
  let model=initial?.manufacturer==='Catalano'?modelKey(initial):'';
  let reference=initial?.manufacturer==='Catalano'?String(initial.reference):'';
  let query='',extras={},pending=false,closed=false;
  const photoCache=new Map(),photoPending=new Set();
  const close=()=>{
   if(closed)return;closed=true;overlay.remove();document.removeEventListener('keydown',escapeClose);
   prev?.focus?.();resolve(true);
  };
  const escapeClose=e=>{if(e.key==='Escape'){e.preventDefault();close()}};
  document.addEventListener('keydown',escapeClose);
  $('.galassia-close').onclick=close;
  overlay.onclick=e=>{if(e.target===overlay)close()};
  const getImage=p=>photoCache.get(p.reference)||imageFor(p,photoResolver);
  function loadExact(p){
   if(typeof photoLoader!=='function'||photoPending.has(p.reference))return;
   if(photoCache.get(p.reference)?.scope==='model')return;
   photoPending.add(p.reference);
   Promise.resolve().then(()=>photoLoader(p)).then(data=>{
    const url=typeof data==='string'?data:(data?.src||'');
    if(!url||!/^(https:\/\/|\/api\/|\/images\/)/.test(url)||closed)return;
    photoCache.set(p.reference,{src:url,scope:'model'});
    if(reference===p.reference){
     const holder=$('.catalano-selection .galassia-photo');
     if(holder){
      const img=document.createElement('img');img.src=url;img.alt='Photo du produit Catalano '+p.reference;
      holder.replaceChildren(img);
      const note=$('.catalano-selection .galassia-image-note');
      if(note)note.textContent='Photo fabricant du modèle. La finition exacte doit être contrôlée sur la fiche du produit.';
     }
    }
   }).catch(()=>{}).finally(()=>photoPending.delete(p.reference));
  }
  function resetSelection(){model='';reference='';extras={};}
  function selection(){
   const source=all.filter(p=>p.collection===collection&&(!category||p.category===category));
   const entries=modelCards(source,collection,category,query);
   if(!entries.some(p=>modelKey(p)===model))model=entries[0]?modelKey(entries[0]):'';
   const primary=entries.find(p=>modelKey(p)===model);
   if(!primary){
    $('.catalano-selection').innerHTML='<p class="galassia-empty">Aucune référence dans ce filtre. Essayez une autre collection ou une autre catégorie.</p>';
    return;
   }
   const variants=variantsFor(all,primary);
   if(!variants.some(v=>v.reference===reference)){reference=variants[0].reference;extras={};}
   const p=variants.find(v=>v.reference===reference)||variants[0];
   const meta=root?.HydroCatalanoAccessories?.compatible?.(p,all)||{kind:'',groups:[],warnings:[],included:[]};
   const image=getImage(p),label=(p.designation||p.originalDescription||p.reference);
   const sourceImage=image.src?'<img src="'+esc(image.src)+'" alt="Illustration Catalano '+esc(p.collection)+'" loading="lazy">':
    '<span>Photographie fabricant non disponible</span>';
   const accessoryUI=meta.kind==='wc'?'<div class="galassia-accessories catalano-accessories">'+
    '<h4>WC · abattant et fixation à prévoir</h4>'+
    (meta.included||[]).map(x=>'<p class="catalano-included">'+esc(x)+'</p>').join('')+
    meta.groups.map(group=>{
     const selected=extras[group.id]===undefined?group.suggested:extras[group.id];
     return '<label class="galassia-accessory-row"><span>'+esc(group.title)+'</span>'+
      '<select class="catalano-accessory-select" data-accessory="'+esc(group.id)+'">'+
      '<option value="">Ne pas ajouter / à vérifier</option>'+
      group.options.map(a=>'<option value="'+esc(a.reference)+'"'+(a.reference===selected?' selected':'')+'>'+
       esc(root.HydroCatalanoAccessories.label(a))+' · '+esc(a.reference)+' · '+price(a.price)+' HT'+
       '</option>').join('')+'</select><small>'+esc(group.notice)+'</small></label>';
    }).join('')+
    (meta.warnings||[]).map(x=>'<small role="status" class="catalano-warning">'+esc(x)+'</small>').join('')+
    '<p class="galassia-accessories-help">Accessoires en lignes séparées dans le projet et le devis. Vérifiez le colisage pour éviter toute double facturation.</p></div>':
    meta.kind==='bidet'?'<p class="catalano-warning">Bidet : vérifier la bonde et les fixations compatibles dans la notice fabricant ; aucune pièce non documentée n’est proposée.</p>':'';
   const accessoryRefs=meta.groups.map(g=>(extras[g.id]===undefined?g.suggested:extras[g.id])||'').filter(Boolean);
   const accessories=accessoryRefs.map(ref=>all.find(x=>x.reference===ref)).filter(Boolean);
   const sum=accessories.reduce((n,a)=>n+Number(a.price),Number(p.price));
   $('.catalano-selection').innerHTML='<div class="galassia-photo">'+sourceImage+'</div>'+
    '<div class="galassia-image-note">'+(image.scope==='model'?
      'Photo fabricant du modèle · finition non contractuelle':
      image.scope==='collection'?'Illustration officielle de la collection · pas une photographie de la référence':
      'Illustration du modèle indisponible')+'</div>'+
    '<span class="galassia-eyebrow">'+esc(p.collection)+' · '+esc(p.category)+'</span>'+
    '<h3>'+esc(label)+'</h3>'+
    '<label class="galassia-variant-label">Référence et finition exactes<select class="catalano-variant">'+
    variants.map(v=>'<option value="'+esc(v.reference)+'"'+(v.reference===reference?' selected':'')+'>'+
      esc(v.reference)+' · '+esc(v.finish||v.finishCode||'Standard')+' · '+price(v.price)+' HT</option>').join('')+
    '</select></label>'+
    '<div class="galassia-summary">'+
    '<div><span>Référence fournisseur</span><b>'+esc(p.reference)+'</b></div>'+
    '<div><span>Prix public HT de l’article</span><b>'+price(p.price)+'</b></div>'+
    '<div><span>Options retenues · '+accessories.length+'</span><b>'+price(sum-Number(p.price))+'</b></div>'+
    '<div><span>Total public HT sélectionné</span><b>'+price(sum)+'</b></div>'+
    '<div><span>Remise d’achat Catalano</span><b>64 %</b></div>'+
    '<div><span>Coût d’achat théorique HT</span><b>'+price(sum*.36)+'</b></div></div>'+
    '<div class="galassia-docs">'+
    '<span>Catalogue : '+esc(p.source||'Catalano PRICE LIST 57')+'</span>'+
    (/^https:\/\/www\.catalano\.it\/en\//.test(p.manufacturerUrl||'')?
      '<a href="'+esc(p.manufacturerUrl)+'" target="_blank" rel="noopener noreferrer">Voir la collection chez Catalano</a>':'')+
    '</div>'+accessoryUI+
    '<button type="button" class="galassia-add catalano-add">Ajouter cette configuration au projet</button>';
   $('.catalano-variant').onchange=e=>{reference=e.target.value;extras={};refresh();};
   $$('.catalano-accessory-select').forEach(select=>select.onchange=e=>{
    extras[e.target.dataset.accessory]=e.target.value;selection();
   });
   $('.catalano-add').onclick=async()=>{
    if(pending)return;
    const chosenRefs=meta.groups.map(g=>(extras[g.id]===undefined?g.suggested:extras[g.id])||'').filter(Boolean);
    const linked=[];
    for(const ref of new Set(chosenRefs)){
      const options=meta.groups.flatMap(g=>g.options);
      const found=options.find(a=>a.reference===ref&&all.some(x=>x.reference===ref));
      if(!found){alert('Accessoire non confirmé dans le tarif : '+ref);return;}
      linked.push(found);
    }
    pending=true;const button=$('.catalano-add');button.disabled=true;button.textContent='Ajout…';
    try{await onAdd(p,roomId,linked);close();}
    catch(e){pending=false;button.disabled=false;button.textContent='Ajouter cette configuration au projet';
      alert('Catalano : '+(e?.message||String(e)));}
   };
   loadExact(p);
  }
  function refresh(){
   if(closed)return;
   $('.catalano-collections').innerHTML=collections.map(name=>{
     const hero=root?.HydroCatalanoGallery?.family?.(name),count=all.filter(p=>p.collection===name).length;
     return '<button type="button" class="galassia-family'+(name===collection?' active':'')+'" data-catalano-collection="'+esc(name)+'">'+
      (hero?'<img src="'+esc(hero.image)+'" alt="" loading="lazy" decoding="async">':
       '<span class="galassia-no-photo">C</span>')+
      '<span>'+esc(name)+'<small>'+count+' références au tarif</small></span></button>';
   }).join('');
   $$('[data-catalano-collection]').forEach(button=>button.onclick=()=>{
    collection=button.dataset.catalanoCollection;category='';query='';resetSelection();$('.galassia-search').value='';refresh();
   });
   const collRows=all.filter(p=>p.collection===collection);
   const types=categories(collRows);
   if(category&&!types.includes(category))category='';
   $('.catalano-categories').innerHTML='<button type="button" class="galassia-section'+(!category?' active':'')+'" data-catalano-category=""><strong>Tous</strong><small>'+collRows.length+' réf.</small></button>'+
   types.map(cat=>'<button type="button" class="galassia-section'+(category===cat?' active':'')+'" data-catalano-category="'+esc(cat)+'">'+
     '<strong>'+esc(cat)+'</strong><small>'+collRows.filter(p=>p.category===cat).length+' réf.</small></button>').join('');
   $$('[data-catalano-category]').forEach(button=>button.onclick=()=>{
    category=button.dataset.catalanoCategory;resetSelection();refresh();
   });
   const entries=modelCards(collRows,collection,category,query);
   $('.catalano-models').innerHTML=entries.length?entries.slice(0,220).map(p=>{
    const id=modelKey(p),photo=getImage(p),variants=variantsFor(all,p),minimum=Math.min(...variants.map(v=>Number(v.price)));
    return '<button type="button" class="galassia-model'+(id===model?' active':'')+'" data-catalano-model="'+esc(id)+'">'+
      '<span class="galassia-model-photo">'+(photo.src?'<img src="'+esc(photo.src)+'" alt="" loading="lazy">':
      '<span class="galassia-no-photo">Photo à rechercher</span>')+'</span>'+
      '<strong>'+esc(p.designation||p.originalDescription||p.base)+'</strong>'+
      '<span>'+esc(p.base||p.reference)+' · '+esc(p.category)+'</span>'+
      '<small>'+price(minimum)+' HT · '+variants.length+' finition(s)</small></button>';
   }).join(''):(query?'<p class="galassia-empty">Aucun modèle ne correspond à votre recherche.</p>':
    '<p class="galassia-empty">Aucune référence tarifée dans cette rubrique.</p>');
   $$('[data-catalano-model]').forEach(button=>button.onclick=()=>{
    model=button.dataset.catalanoModel;reference='';extras={};selection();
    $$('.galassia-model').forEach(el=>el.classList.toggle('active',el.dataset.catalanoModel===model));
   });
   selection();
  }
  $('.galassia-search').oninput=e=>{query=e.target.value;model='';reference='';extras={};refresh();$('.galassia-search').value=query;};
  refresh();$('.galassia-search').focus();
 });
}
return {eligible,groupCollections,categories,modelKey,variantsFor,modelCards,imageFor,open};
});