/* Hydropolis Radaway visual selection based on exact manufacturer page images, no fabricated prices. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroRadawayConfigurator=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const euro=n=>Number(n).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
 const types=['Angle','Walk-in','Porte de niche','Pare-baignoire'];
 const targets={
   'Angle':'https://konfigurator.radaway.eu/shower-enclosures',
   'Walk-in':'https://konfigurator.radaway.eu/walk-in',
   'Porte de niche':'https://konfigurator.radaway.eu/shower-doors',
   'Pare-baignoire':'https://konfigurator.radaway.eu/parawany-nawannowe'
 };
 const eligible=p=>p?.manufacturer==='Radaway';
 const tree=()=>root?.HydroRadawayHierarchy;
 const family=p=>tree()?.groupFor(p)||'paroi';
 const validModelPhoto=src=>typeof src==='string'&&/^https:\/\/www\.radaway\.(?:fr|pl|eu)\/wp-content\/uploads\//.test(src);
 function open(rows,roomId,onAdd,initial=null){
  if(typeof document==='undefined'||typeof onAdd!=='function')return Promise.reject(Error('Interface Radaway indisponible'));
  rows=(rows?.length?rows:root.HydroRadawayCatalog?.rows||[]).filter(eligible);
  if(!rows.length)return Promise.reject(Error('Catalogue Radaway non chargé'));
  document.querySelector('.radaway-overlay')?.remove();
  const ov=document.createElement('div');ov.className='radaway-overlay';
  ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Configurateur Radaway');
  const css='.radaway-overlay{position:fixed;inset:0;z-index:999999;background:#000b;display:flex;align-items:center;justify-content:center;padding:15px;font:14px Arial,sans-serif;color:#222}' +
   '.radaway-shell{width:min(1250px,99vw);height:min(840px,96vh);display:flex;flex-direction:column;background:white;border-radius:12px;overflow:hidden}' +
   '.radaway-head{padding:18px 23px;color:white;background:#202020;display:flex;justify-content:space-between;align-items:center}' +
   '.radaway-head h2{font-size:24px;margin:4px 0}.radaway-head small{color:#ddd}.radaway-close{font-size:26px;color:white;border:0;background:transparent;cursor:pointer}' +
   '.radaway-columns{display:grid;grid-template-columns:156px minmax(0,1fr)355px;flex:1;min-height:0}' +
   '.radaway-types{border-right:1px solid #ddd;padding:12px;overflow:auto}' +
   '.radaway-types button{display:block;padding:13px;width:100%;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;text-align:left;background:white;cursor:pointer}' +
   '.radaway-types button.active,.radaway-model.active{border-color:#a36a33;background:#fff3e7}' +
   '.radaway-main{overflow:auto;padding:14px}.radaway-controls{display:flex;gap:10px;margin-bottom:12px}' +
   '.radaway-controls input,.radaway-controls select{padding:9px;min-width:0;border:1px solid #ccc;border-radius:5px;background:white;color:#222}' +
   '.radaway-controls input{flex:1}.radaway-controls select{width:145px}' +
   '.radaway-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}' +
   '.radaway-model{text-align:left;color:#222;padding:10px;background:white;border:1px solid #ddd;border-radius:8px;cursor:pointer}' +
   '.radaway-model img{display:block;width:100%;height:145px;object-fit:contain}' +
   '.radaway-model strong{display:block;margin-top:8px;font-size:13px}.radaway-model small{display:block;margin-top:5px;font-size:11px;color:#846037}' +
   '.radaway-detail{padding:17px;background:#fafafa;border-left:1px solid #ddd;overflow:auto}' +
   '.radaway-image{width:100%;height:205px;object-fit:contain;background:white;border:1px solid #eee;border-radius:7px}' +
   '.radaway-detail h3{font-size:16px;margin:12px 0}.radaway-detail p,.radaway-detail a{font-size:12px;line-height:1.5}' +
   '.radaway-fields{display:grid;grid-template-columns:1fr 1fr;gap:9px}' +
   '.radaway-fields label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:bold}' +
   '.radaway-fields input,.radaway-fields select{width:100%;padding:9px;box-sizing:border-box;color:#222;background:white;border:1px solid #ccc;border-radius:6px}' +
   '.radaway-fields .wide{grid-column:1/-1}.radaway-note{background:#fff5e7;border:1px solid #e6cda5;border-radius:7px;padding:10px;margin-top:9px;font-size:11px;line-height:1.5}' +
   '.radaway-add{background:#265849;color:#fff;border:0;width:100%;padding:14px;margin-top:12px;border-radius:6px;cursor:pointer}' +
   '.radaway-add:disabled{opacity:.5;cursor:default}.radaway-error{color:#a12b2b;min-height:18px}' +
   '@media(max-width:890px){.radaway-columns{grid-template-columns:105px minmax(0,1fr)}.radaway-detail{grid-column:1/-1;max-height:45vh}.radaway-shell{overflow:auto}}';

  const extraCss=
   '.radaway-types button{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:650}'+
   '.radaway-types button svg{height:40px;width:40px;flex-shrink:0;stroke:#666}'+
   '.radaway-crumbs{font-size:12px;color:#8c653a;min-height:18px;margin:0 0 9px;font-weight:650}'+
   '.radaway-shapes{display:grid;grid-template-columns:repeat(auto-fill,minmax(123px,1fr));gap:10px;margin-bottom:15px}'+
   '.radaway-shapes button{min-height:138px;color:#333;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:5px;padding:9px;border:1px solid #ddd;background:#fff;border-radius:8px;cursor:pointer}'+
   '.radaway-shapes button.active{background:#fff4e8;border-color:#a36a33}'+
   '.radaway-shapes svg{max-width:100%;color:#353535}'+
   '.radaway-shapes small{font-size:11px;color:#777}'+
   '.radaway-model-image-pending{height:145px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#777;font-size:11px}'+
   '.radaway-guide{background:#f7f5f1;padding:15px;border:1px solid #e9e2d6;border-radius:8px;font-size:13px;line-height:1.55;margin:10px 0}'+
   '.radaway-guide a{display:inline-block;margin-top:8px}'+
   '.radaway-hidden-filter{display:none!important}'+
   '.radaway-image-status{color:#75572a;font-size:11px}';
  ov.innerHTML='<style>'+css+extraCss+'</style><div class="radaway-shell"><header class="radaway-head"><div><small>RADAWAY · VISUELS FABRICANT</small><h2>Configurer une paroi Radaway</h2><small>Catégorie → collection → modèle → dimensions et chiffrage</small></div><button class="radaway-close" type="button">×</button></header><div class="radaway-columns"><aside class="radaway-types"></aside><main class="radaway-main"><div class="radaway-crumbs"></div><div class="radaway-shapes"></div><div class="radaway-controls"><select class="radaway-series"></select><input type="search" class="radaway-search" placeholder="Rechercher modèle ou finition"></div><div class="radaway-grid"></div></main><aside class="radaway-detail"></aside></div></div>';
  document.body.appendChild(ov);
  const $=s=>ov.querySelector(s),close=()=>ov.remove();
  $('.radaway-close').onclick=close;ov.addEventListener('click',e=>{if(e.target===ov)close()});
  let selected=null,group='paroi',form='',type='Paroi de douche',series='',search='',busy=false;
  const hierarchy=tree();
  if(!hierarchy)throw Error('Arborescence Radaway non chargée');
  const preselected=rows.find(p=>p.reference===initial?.reference);
  if(preselected){selected=preselected;group=family(preselected);form=hierarchy.shapeFor(preselected);type=preselected.productType}
  const mediaCache=new Map(),mediaPending=new Map(),metaCache=new Map();
  let tarifNotice='',mediaActive=0;
  const mediaJobs=[],queuedMedia=new Map();
  function pumpMedia(){
   while(mediaActive<6&&mediaJobs.length){
    const {p,resolve}=mediaJobs.shift();
    mediaActive++;
    officialPhoto(p).then(resolve,()=>resolve('')).finally(()=>{
      mediaActive--;queuedMedia.delete(p.reference);pumpMedia();
    });
   }
  }
  function scheduledPhoto(p){
   if(queuedMedia.has(p.reference))return queuedMedia.get(p.reference);
   const task=new Promise(resolve=>mediaJobs.push({p,resolve}));
   queuedMedia.set(p.reference,task);pumpMedia();return task;
  }
  const productOptions=()=>root.HydroRadawayOptions;
  const tariff=()=>root.HydroRadawayTariff;
  const modelVariants=()=>tariff()?.variants(selected)||[];
  const metaFor=p=>metaCache.get(p?.reference)||{};
  // Restores previous locally imported tariff without slowing down initial presentation.
  tariff()?.load().then(()=>{if(ov.isConnected&&selected)renderDetail()}).catch(()=>{});

  function photoSlug(p){return String(p?.manufacturerUrl||'').match(/\/kategoria\/([a-z0-9-]+)\/?/i)?.[1]||''}
  // Same-origin fallback prevents blocked manufacturer hotlinks from becoming blank cards.
  function bindPhotoFallback(img,p){
   if(!img)return;
   const slug=photoSlug(p);
   img.onerror=()=>{
    if(slug&&img.dataset.radawayProxy!=='1'){
     img.dataset.radawayProxy='1';
     img.src='/api/radaway-product-photo?slug='+encodeURIComponent(slug);
     return;
    }
    const collection=gallery()?.illustrationFor(p);
     if(collection?.url&&img.dataset.radawayIllustration!=='1'){
      img.dataset.radawayIllustration='1';
      img.src=collection.url;
      const note=img.closest('.radaway-model')?.querySelector('.radaway-image-status');
      if(note)note.textContent='Visuel illustratif de la collection';
      else{
       const model=img.closest('.radaway-model');
       if(model){const text=document.createElement('small');text.className='radaway-image-status';
        text.textContent='Visuel illustratif de la collection';model.appendChild(text)}
      }
      return;
     }
     img.style.display='none';
    const item=img.closest('.radaway-model');
    if(item&&!item.querySelector('.radaway-model-image-pending')){
     const label=document.createElement('div');
     label.className='radaway-model-image-pending';label.textContent='Photo Radaway indisponible';
     img.after(label);
    }
    const status=$('.radaway-image-status');
    if(img.classList.contains('radaway-image')&&status)
     status.textContent='Photo fabricant indisponible pour cette variante.';
   };
  }
  const gallery=()=>root.HydroRadawayGallery;
  function exactPhoto(p){
   if(!p)return '';
   return validModelPhoto(mediaCache.get(p.reference))?mediaCache.get(p.reference):
    validModelPhoto(p.image)?p.image:gallery()?.exactFor(p)||'';
  }
  function previewFor(p){
   const url=exactPhoto(p);
   return url?{url,exact:true}:gallery()?.illustrationFor(p)||null;
  }
  function photoFor(p){return previewFor(p)?.url||''}
  function officialPhoto(p){
   if(!p)return Promise.resolve('');
   const known=exactPhoto(p);
   if(known)return Promise.resolve(known);
   const ref=p.reference;
   if(mediaCache.has(ref))return Promise.resolve('');
   if(mediaPending.has(ref))return mediaPending.get(ref);
   const slug=String(p.manufacturerUrl||'').match(/\/kategoria\/([a-z0-9-]+)\/?/i)?.[1];
   if(!slug)return Promise.resolve('');
   const task=fetch('/api/radaway-model-media?slug='+encodeURIComponent(slug))
    .then(r=>r.ok?r.json():null)
    .then(data=>{
      const src=data?.exactFinish===true&&data.slug===slug&&validModelPhoto(data.photo)?data.photo:'';
      mediaCache.set(ref,src);
      if(data&&typeof data==='object')metaCache.set(ref,data);
      if(src){p.image=src;p.imageSource='Radaway.fr · photo officielle du modèle';}
      return src;
    }).catch(()=>{mediaCache.set(ref,'');return ''})
      .finally(()=>mediaPending.delete(ref));
   mediaPending.set(ref,task);return task;
  }
  function filterModels(){
   return rows.filter(p=>family(p)===group&&(!form||hierarchy.shapeFor(p)===form));
  }
  function renderType(){
   $('.radaway-types').innerHTML=hierarchy.groups.map(g=>
    '<button type="button" class="'+(g.id===group?'active':'')+'" data-group="'+esc(g.id)+'">'+
    hierarchy.pictogram(hierarchy.byGroup(g.id)[0])+'<span>'+esc(g.label)+'</span></button>'
   ).join('');
   ov.querySelectorAll('[data-group]').forEach(btn=>btn.onclick=()=>{
     group=btn.dataset.group;type=hierarchy.groups.find(g=>g.id===group)?.type||'Paroi de douche';
     form='';selected=null;series='';search='';render();
   });
  }
  function renderShapes(){
   const g=hierarchy.groups.find(x=>x.id===group),shapes=hierarchy.byGroup(group);
   const current=shapes.find(x=>x.id===form);
   $('.radaway-crumbs').textContent=g.label+(current?' / '+current.label+' / Collections':' / Choisir '+g.menuLabel.toLowerCase());
   $('.radaway-shapes').innerHTML=shapes.map(opt=>{
    const n=rows.filter(p=>family(p)===group&&hierarchy.shapeFor(p)===opt.id).length;
    return '<button type="button" data-shape="'+esc(opt.id)+'" class="'+(form===opt.id?'active':'')+'">'+
      hierarchy.pictogram(opt)+'<strong>'+esc(opt.label)+'</strong><small>'+n+' modèle(s) indexé(s)</small></button>';
   }).join('');
   ov.querySelectorAll('[data-shape]').forEach(btn=>btn.onclick=()=>{
     form=btn.dataset.shape;selected=null;series='';search='';render();
   });
  }
  function renderGrid(){
   const listing=filterModels();
   const show=!!form;
   $('.radaway-controls').classList.toggle('radaway-hidden-filter',!show);
   if(!show){
    $('.radaway-grid').innerHTML='<div class="radaway-guide">Choisis d’abord une '+esc(group==='paroi'?'forme':group==='doors'?'typologie d’ouverture':'configuration')+' dans les pictogrammes ci-dessus.</div>';
    return;
   }
   const names=[...new Set(listing.map(p=>p.collection))].sort((a,b)=>a.localeCompare(b,'fr'));
   if(!names.includes(series))series='';
   $('.radaway-series').innerHTML='<option value="">Toutes les collections</option>'+names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');
   $('.radaway-series').value=series;
   $('.radaway-series').onchange=e=>{series=e.target.value;selected=null;renderGrid();renderDetail()};
   $('.radaway-search').value=search;
   $('.radaway-search').oninput=e=>{search=e.target.value;renderGrid()};
   const shown=listing.filter(p=>(!series||p.collection===series)&&(!search||[p.designation,p.finish,p.collection].join(' ').toLowerCase().includes(search.toLowerCase())));
   const official=hierarchy.byGroup(group).find(x=>x.id===form);
   $('.radaway-grid').innerHTML=shown.map(p=>{
    const src=photoFor(p);
    return '<button type="button" class="radaway-model '+(p.reference===selected?.reference?'active':'')+'" data-model="'+esc(p.reference)+'">'+
    (src?'<img loading="lazy" src="'+esc(src)+'" alt="'+esc(p.designation)+'">':
      '<div class="radaway-model-image-pending" data-photo-ref="'+esc(p.reference)+'">Photo fabricant à charger</div>')+
    '<strong>'+esc(p.designation)+'</strong><small>'+esc(p.finish)+'</small>'+(previewFor(p)?.exact?'':'<small class="radaway-image-status">Visuel illustratif de la collection</small>')+'</button>';
   }).join('')||'<div class="radaway-guide">Aucune référence indexée pour cette forme et ces filtres. <a href="'+esc(official?.url||'https://www.radaway.fr/')+
    '" target="_blank" rel="noopener noreferrer">Consulter les modèles de cette forme chez Radaway</a></div>';
   ov.querySelectorAll('.radaway-model img').forEach(img=>{
      const ref=img.closest('.radaway-model')?.getAttribute('data-model');
      bindPhotoFallback(img,rows.find(p=>p.reference===ref));
    });
    ov.querySelectorAll('[data-model]').forEach(btn=>btn.onclick=()=>{
     selected=rows.find(p=>p.reference===btn.dataset.model);renderGrid();renderDetail();
   });
   // Every displayed model is queued. Limit concurrency rather than skipping
   // images after the twelfth tile. Deduplicate requests with mediaPending.
   shown.filter(p=>!exactPhoto(p)).forEach(p=>{
    const requested=p.reference;
    scheduledPhoto(p).then(src=>{
     if(!ov.isConnected)return;
     if(!src){
      ov.querySelectorAll('.radaway-model [data-photo-ref]').forEach(place=>{
       if(place.getAttribute('data-photo-ref')===requested)place.textContent='Photo fabricant indisponible';
      });
      return;
     }
     const card=Array.from(ov.querySelectorAll('.radaway-model'))
      .find(el=>el.getAttribute('data-model')===requested);
     if(card){
      const img=card.querySelector('img');
      if(img){img.src=src;img.style.display='block';bindPhotoFallback(img,p)}
      card.querySelectorAll('.radaway-image-status').forEach(el=>el.remove());
     }
     ov.querySelectorAll('.radaway-model [data-photo-ref]').forEach(place=>{
      if(place.getAttribute('data-photo-ref')!==requested)return;
      const el=document.createElement('img');
      el.loading='lazy';el.alt=p.designation;el.src=src;
      bindPhotoFallback(el,p);place.replaceWith(el);
     });
     if(selected?.reference===requested){updateSelectedPhoto(src);updateMetadata()}
    });
   });
  }
  function updateSelectedPhoto(src){
    if(!src||!selected||!ov.isConnected)return;
    const el=$('.radaway-detail .radaway-image');
    if(el){el.src=src;el.style.display='block';bindPhotoFallback(el,selected)}
    const note=$('.radaway-image-status');
    if(note)note.textContent='Photo issue de la fiche fabricant de ce modèle';
  }
  function renderDetail(){
   if(!selected){
    const current=hierarchy.byGroup(group).find(x=>x.id===form);
    $('.radaway-detail').innerHTML='<div class="radaway-guide">'+
       (form?'Choisis un modèle de la collection.':'Sélectionne d’abord le pictogramme correspondant à ton installation.')+
       '<p>Les photos proviennent des fiches fabricant et les références de commande seront confirmées au chiffrage.</p>'+
       (current?'<a href="'+esc(current.url)+'" target="_blank" rel="noopener noreferrer">Voir la gamme officielle</a>':'')+
       '</div>';
    return;
   }
   const url=targets[selected.productType]||'https://konfigurator.radaway.eu/';
   $('.radaway-detail').innerHTML='<img class="radaway-image" '+(photoFor(selected)?'src="'+esc(photoFor(selected))+'" ':'')+'alt="'+esc(selected.designation)+'">'+
    '<div class="radaway-image-status">'+(previewFor(selected)?.exact?'Photo du modèle Radaway':photoFor(selected)?'Photo illustrative de la collection — modèle ou finition à vérifier':'Chargement de la photo officielle…')+'</div>'+
    '<h3>'+esc(selected.designation)+'</h3><p>Collection : <b>'+esc(selected.collection)+'</b><br>Finition du modèle photographié : <b>'+esc(selected.finish)+'</b></p>'+
    '<p><a target="_blank" rel="noopener noreferrer" href="'+esc(selected.manufacturerUrl)+'">Voir le produit sur radaway.fr</a><br>'+
    '<a target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">Ouvrir le configurateur officiel Radaway</a></p>'+
    '<div class="radaway-fields">'+
    '<label>Largeur (cm)<input class="radaway-width" type="number" min="30" max="350" step=".1" placeholder="À confirmer"></label>'+
    '<label>Hauteur (cm)<input class="radaway-height" type="number" min="50" max="350" step=".1" placeholder="À confirmer"></label>'+
    '<label>Paroi fixe incluse (transport)<input class="radaway-fixed-panel" type="checkbox" '+(selected.productType==='Walk-in'?'checked':'')+'></label>'+
    '<label>Largeur de la plus grande paroi fixe (cm)<input class="radaway-fixed-width" type="number" min="20" max="350" step=".1" placeholder="Si présente"></label>'+
    '<label>Sens d’ouverture<select class="radaway-side"><option>À confirmer</option><option>Gauche</option><option>Droite</option></select></label>'+
    '<label>Finition des profilés<select class="radaway-profile"></select></label>'+
    '<label>Épaisseur du verre<select class="radaway-thickness"></select></label>'+
    '<label>Type de verre<select class="radaway-glass"></select></label>'+
    '<label>Nombre de côtés vitrés<input type="number" class="radaway-glass-sides" min="1" max="8" value="1"></label>'+
    '<div class="wide radaway-glass-extra">Plus-value éventuelle : sélectionnez le verre et son épaisseur.</div>'+
    '<p class="wide radaway-spec-note"></p>'+
    '<label class="wide">Référence et dimension du tarif 2026<select class="radaway-tariff-variant"><option value="">Choisir une référence tarifée</option></select></label>'+
    '<div class="wide radaway-file-import"><span class="radaway-tariff-status">Tarif Radaway 2026 non chargé</span>'+
    '<label>Importer le tarif Excel Radaway 2026<input type="file" class="radaway-tariff-file" accept=".xlsx,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json"></label></div>'+
    '<label class="wide">Référence fabricant vérifiée<input class="radaway-sku" placeholder="Référence de la gamme Radaway"></label>'+
    '<label class="wide">Prix public HT vérifié (€)<input type="number" min="0" step=".01" class="radaway-price" placeholder="À chiffrer"></label>'+
    '</div><div class="radaway-note">Sans prix fabricant confirmé, la paroi sera ajoutée au projet <b>en attente de chiffrage</b> et masquée dans le dossier client. Les codes RAD-SÉLECTION sont uniquement des identifiants internes. La remise fournisseur de 50 % est appliquée aux articles chiffrés, sans modifier le prix public.</div>'+
    '<button class="radaway-add" type="button">Ajouter au projet</button><p class="radaway-error" aria-live="polite"></p>';
   const photo=$('.radaway-image');
   bindPhotoFallback(photo,selected);
   // Fetch manufacturer specs even when a legacy thumbnail was already stored.
   if(!metaCache.has(selected.reference)&&!mediaPending.has(selected.reference)){
     const wanted=selected.reference;
     const slug=String(selected.manufacturerUrl||'').match(/\/kategoria\/([a-z0-9-]+)\/?/i)?.[1];
     if(slug)fetch('/api/radaway-model-media?slug='+encodeURIComponent(slug)).then(r=>r.json()).then(data=>{
       if(data?.slug===slug)metaCache.set(wanted,data);
       if(data?.photo&&validModelPhoto(data.photo)){mediaCache.set(wanted,data.photo);selected?.reference===wanted&&updateSelectedPhoto(data.photo)}
       if(selected?.reference===wanted&&ov.isConnected)updateMetadata();
     }).catch(()=>{});
   }
   if(!photoFor(selected)){
     const request=selected.reference;
     officialPhoto(selected).then(src=>{
       if(selected?.reference!==request||!ov.isConnected)return;
       if(src)updateSelectedPhoto(src);
       else $('.radaway-image-status').textContent='Photo fabricant non accessible pour cette variante.';
     });
   }
   const opts=productOptions();
   const availableProfiles=opts?.profiles(selected,rows)||[{finish:selected.finish,reference:selected.reference}];
   $('.radaway-profile').innerHTML=availableProfiles.map(v=>
    '<option value="'+esc(v.reference)+'">'+esc(v.finish)+'</option>').join('');
   $('.radaway-profile').value=selected.reference;
   $('.radaway-profile').onchange=()=>{
    const next=rows.find(v=>v.reference===$('.radaway-profile').value);
    if(next){selected=next;renderGrid();renderDetail()}
   };
   $('.radaway-thickness').onchange=()=>updateGlassNote();
   $('.radaway-glass').onchange=()=>updateGlassNote();
   $('.radaway-glass-sides').oninput=()=>updateGlassNote();
   updateMetadata();
   updateTariff();
   $('.radaway-tariff-file').onchange=async e=>{
     const file=e.target.files?.[0];
     if(!file)return;
     $('.radaway-tariff-status').textContent='Vérification du tarif en cours…';
     try{const info=await tariff().importFile(file);
       tarifNotice=info.rows+' références 2026 chargées';
       updateTariff();
     }catch(err){$('.radaway-tariff-status').textContent='Import impossible : '+(err.message||err)}
   };
   $('.radaway-tariff-variant').onchange=()=>{
    const matched=tariff()?.exact($('.radaway-tariff-variant').value);
    if(matched){
      $('.radaway-sku').value=matched.r;
      $('.radaway-price').value=matched.p;
      $('.radaway-price').dataset.excelPublic=String(matched.p);
      $('.radaway-price').dataset.excelPurchase=String(matched.a);
      $('.radaway-price').dataset.manuallyEdited='false';
      updateGlassNote();
    }else {
      $('.radaway-price').dataset.excelPurchase='';
      $('.radaway-price').dataset.excelPublic='';
    }
   };
   $('.radaway-width').oninput=()=>updateTariff();
   $('.radaway-height').oninput=()=>updateTariff();
   $('.radaway-price').oninput=()=>{
     $('.radaway-price').dataset.manuallyEdited='true';
     $('.radaway-price').dataset.excelPurchase='';
   };
   $('.radaway-add').onclick=async()=>{
    if(busy)return;
    const input=$('.radaway-price').value.trim(),hasPrice=!!input,price=hasPrice?Number(input):0;
    const sku=$('.radaway-sku').value.trim();
    const thickness=Number($('.radaway-thickness').value),profile=$('.radaway-profile').selectedOptions[0]?.textContent||'À confirmer',
      glass=$('.radaway-glass').value||'À confirmer',
      pricedSource=tariff()?.exact(sku),sides=Number($('.radaway-glass-sides').value)||1,
      surcharge=productOptions()?.glassSurcharge(glass,thickness,sides)||{verified:false,publicHT:0,purchaseHT:0},
      exactPrice=pricedSource&&surcharge.verified&&
        Math.abs(Number(pricedSource.p)+surcharge.publicHT-price)<.001;
    if(!Number.isFinite(thickness)||![6,8,10].includes(thickness)||!glass||!profile||sides<1||sides>8){
     $('.radaway-error').textContent='Indiquer l’épaisseur, la finition du profilé et le type de verre.';return;
    }
    const w=$('.radaway-width').value.trim(),h=$('.radaway-height').value.trim();
    const fixedPanel=$('.radaway-fixed-panel').checked,
      fixedPanelWidthCm=fixedPanel?Number($('.radaway-fixed-width').value||w||0):0;
    if(hasPrice&&(!Number.isFinite(price)||price<=0||!sku)){ $('.radaway-error').textContent='Pour un article chiffré, renseigner un prix HT positif et une référence fabricant.';return}
    if((w&&(!Number.isFinite(+w)||+w<30||+w>350))||(h&&(!Number.isFinite(+h)||+h<50||+h>350))||
      (fixedPanelWidthCm&&(!Number.isFinite(fixedPanelWidthCm)||fixedPanelWidthCm<20||fixedPanelWidthCm>350))){
     $('.radaway-error').textContent='Vérifier les dimensions saisies.';return;
    }
    if(glass!=='Transparent'&&!surcharge.verified&&hasPrice){
      $('.radaway-error').textContent='Plus-value '+glass+' '+thickness+' mm absente du tarif. Demander le prix au fabricant avant de chiffrer.';return;
    }
    const pending=!hasPrice;
    const record={...selected,reference:sku||selected.reference,manufacturerReference:sku,
     radawayInternalSelectionId:selected.reference,
     designation:selected.designation+(w?' · L '+w+' cm':'')+(h?' · H '+h+' cm':''),
     price,totalPrice:price,purchaseDiscount:50,
     purchasePrice:exactPrice?pricedSource.a+surcharge.purchaseHT:Math.ceil(price*.5),
     pricingStatus:pending?'quote-required':exactPrice?'radaway-excel-2026':'manufacturer-quote-manual',
     pricingSource:pending?'Radaway : devis à obtenir':exactPrice?'RADAWAY_SHOWROOMS_TARIF 02022026.xlsx':'Chiffrage fabricant saisi manuellement',
     radawayPendingQuote:pending,hideFromDossier:pending,
     image:photoFor(selected)||'',
     imageSource:previewFor(selected)?.exact?'Radaway · photo du modèle':'Radaway · illustration de collection (modèle ou finition à vérifier)',
     imageFinishMatch:previewFor(selected)?.exact?'manufacturer-model':'collection-illustration',
     radawayConfiguration:{model:selected.designation,type:selected.productType,collection:selected.collection,
      finish:selected.finish,profileFinish:profile,glassType:glass,glassThicknessMm:thickness,
      glassSides:sides,glassSupplementHT:surcharge.verified?surcharge.publicHT:0,
      glassSupplementPurchaseHT:surcharge.verified?surcharge.purchaseHT:0,
      manufacturerGlassVerified:(metaFor(selected).thicknessOptions||[]).includes(thickness),
      tariffSource:exactPrice?'RADAWAY_SHOWROOMS_TARIF 02022026.xlsx':'Prix vérifié manuellement',
      widthCm:w?Number(w):null,heightCm:h?Number(h):null,
      fixedPanel,fixedPanelWidthCm:fixedPanel?fixedPanelWidthCm:null,opening:$('.radaway-side').value,
      glass,officialConfiguratorUrl:url,
      manufacturerPage:selected.manufacturerUrl,manufacturerSku:sku||null,priceVerified:!pending}};
    busy=true;$('.radaway-add').disabled=true;
    try{await onAdd(record,roomId);close()}catch(e){busy=false;$('.radaway-add').disabled=false;$('.radaway-error').textContent=e.message||String(e)}
   };
  }
  function updateGlassNote(){
   if(!selected)return;
   const meta=metaFor(selected),opts=productOptions();
   const thick=Number($('.radaway-thickness')?.value||0),glass=$('.radaway-glass')?.value;
   const note=$('.radaway-spec-note');
   if(!note)return;
   note.textContent=(meta?.thicknessOptions?.includes(thick)?'Épaisseur confirmée par la fiche fabricant. ':'Épaisseur à confirmer pour cette référence. ')+
     (meta?.glassOptionsVerified?'Type de verre disponible sur le modèle.':'Type de verre à faire confirmer sur le configurateur officiel ou le tarif.');
   const sides=Number($('.radaway-glass-sides')?.value)||1;
   const extra=opts?.glassSurcharge(glass,thick,sides);
   const line=$('.radaway-glass-extra');
   if(line)line.textContent=extra?.verified?
    ('Plus-value verre : '+euro(extra.publicHT)+' HT public · '+euro(extra.purchaseHT)+' HT achat'+
      (extra.publicHT?' ('+sides+' côté(s))':' — sans supplément')) :
    (extra?.reason||'Plus-value du verre à confirmer.');
   const priceField=$('.radaway-price');
   const source=tariff()?.exact($('.radaway-tariff-variant')?.value);
   if(priceField&&source&&priceField.dataset.manuallyEdited!=='true'&&extra?.verified){
     priceField.value=(Number(source.p)+extra.publicHT).toFixed(2);
     priceField.dataset.excelPurchase=String(Number(source.a)+extra.purchaseHT);
     priceField.dataset.excelPublic=String(source.p);
     if(note)note.textContent+=' Référence tarifaire : '+source.r+' · '+euro(source.p)+' HT public de base.';
   }
  }
  function updateMetadata(){
   if(!selected||!$('.radaway-thickness'))return;
   const meta=metaFor(selected),opts=productOptions();
   const thickness=opts?.thicknessFor(selected,meta)||{options:[6,8,10],selected:null,verified:false};
   const glass=opts?.glassOptions(meta)||[{value:'Transparent',label:'Transparent'}];
   const prevThickness=$('.radaway-thickness').value,prevGlass=$('.radaway-glass').value;
   $('.radaway-thickness').innerHTML='<option value="">À confirmer</option>'+thickness.options.map(n=>
    '<option value="'+n+'">'+n+' mm'+(!thickness.verified?' · vérifier':'')+'</option>').join('');
   $('.radaway-thickness').value=thickness.options.includes(Number(prevThickness))?prevThickness:(thickness.selected||'');
   $('.radaway-glass').innerHTML=glass.map(g=>
    '<option value="'+esc(g.value)+'">'+esc(g.label)+(g.verified?'':' · disponibilité à vérifier')+'</option>').join('');
   if(glass.some(g=>g.value===prevGlass))$('.radaway-glass').value=prevGlass;
   updateGlassNote();
  }
  function updateTariff(){
   if(!selected||!$('.radaway-tariff-variant'))return;
   const list=modelVariants(),status=tariff()?.status();
   $('.radaway-tariff-status').textContent=status?.ready?
    (status.rows+' lignes du tarif 2026 chargées'+(list.length?' · '+list.length+' références compatibles':' · référence à vérifier')) :
    'Tarif Radaway 2026 : import initial requis (Excel ou JSON)';
   $('.radaway-tariff-variant').innerHTML='<option value="">Choisir une référence tarifée</option>'+
    list.map(p=>'<option value="'+esc(p.r)+'">'+esc(p.r+' · '+p.d+' · '+euro(p.p)+' HT')+'</option>').join('');
   const width=Number($('.radaway-width')?.value),height=Number($('.radaway-height')?.value);
   const matching=(width>0&&height>0)?list.filter(p=>{
    const range=String(p.d||'').match(/(\d+)\s*-\s*(\d+)\s*[x×]\s*(\d+)\s*-\s*(\d+)/i);
    if(!range)return false;
    return width>=Number(range[1])&&width<=Number(range[2])&&
     height>=Number(range[3])&&height<=Number(range[4]);
   }):[];
   // Never guess a price when several articles cover the same measurements.
   const auto=matching.length===1?matching[0]:null;
   const current=$('.radaway-sku').value;
   const chosen=auto||list.find(p=>p.r===current)||null;
   if(!chosen)return;
   $('.radaway-tariff-variant').value=chosen.r;
   const price=$('.radaway-price');
   if(auto||price.dataset.manuallyEdited!=='true'){
    $('.radaway-sku').value=chosen.r;
    price.dataset.manuallyEdited='false';
    price.dataset.excelPublic=String(chosen.p);
    price.dataset.excelPurchase=String(chosen.a);
    updateGlassNote();
   }
  }
  function render(){renderType();renderShapes();renderGrid();renderDetail()}
  render();return Promise.resolve(true);
 }
 return {open,eligible,targets};
});