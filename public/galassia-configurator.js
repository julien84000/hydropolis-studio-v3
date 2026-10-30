/* GALASSIA — price-list driven collection/model/finish configurator.
   Never fabricate a price, reference, finish-specific image or technical document. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroGalassiaConfigurator=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>Number(v).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const eligible=p=>p?.manufacturer==='Galassia'&&p.reference&&Number(p.price)>0;
 const modelId=p=>String(p?.base||p?.reference||'');
 const variantsFor=(rows,p)=>rows.filter(q=>q.collection===p.collection&&modelId(q)===modelId(p)).sort((a,b)=>String(a.reference).localeCompare(b.reference,'fr'));
 const familyList=rows=>[...new Set(rows.map(p=>p.collection))].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true}));
 const modelList=(rows,collection,category,search)=>{
  const s=norm(search).trim();
  const selected=rows.filter(p=>p.collection===collection&&(!category||p.category===category)
   &&(!s||[p.reference,p.base,p.designation,p.productType,p.collection,p.finish].some(v=>norm(v).includes(s))));
  const map=new Map();
  for(const item of selected){const k=modelId(item);if(!map.has(k))map.set(k,item);}
  return [...map.values()].sort((a,b)=>modelId(a).localeCompare(modelId(b),'fr',{numeric:true}));
 };
 const suffixFinish=(reference,base)=>{
  const v=String(reference||'').slice(String(base||'').length);
  return ({MT:'Blanc mat',NEMT:'Graphite',GM:'Gris mat',SB:'Noir satiné',SA:'Sable',SV:'Sauge',
   BI:'Blanc',BIMT:'Blanc mat',NE:'Noir',CR:'Chrome',NS:'Nickel satiné',RO:'Rouge',
   OC:'Ocre',PE:'Pétrole',VI:'Violet',SFSB:'Noir satiné',SFSA:'Sable',SFMT:'Blanc mat',SFGM:'Gris mat'}[v]||'');
 };
 const finishName=p=>suffixFinish(p.reference,p.base)||p.finish||'Finition de référence';
 const technicalLink=p=>p?.technicalSheetUrl&&/^https:\/\//i.test(p.technicalSheetUrl)?p.technicalSheetUrl:'';
 let indexJob;
 async function index(){
  if(!indexJob)indexJob=fetch('/galassia/official-index.json',{cache:'force-cache'}).then(r=>{
   if(!r.ok)throw Error('Index photographique indisponible');return r.json();
  }).catch(e=>{indexJob=null;return {collections:[]};});
  return indexJob;
 }
 function imageFor(p,official){
  if(p?.image&&/^https:\/\//.test(p.image))return p.image;
  return official.collections?.find(c=>c.name===p.collection)?.hero||'';
 }
 function buildOverlay(){
  document.querySelector('.galassia-modal')?.remove();
  const overlay=document.createElement('div');overlay.className='galassia-modal';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Configurateur Galassia');
  overlay.innerHTML='<div class="galassia-shell"><div class="galassia-top"><div><span class="galassia-eyebrow">GALASSIA · LA CERAMICA CONTEMPORANEA</span><h2>Configurer la sélection</h2><p>Collection → catégorie → modèle → finition et référence exacte</p></div><button type="button" class="galassia-close" aria-label="Fermer">×</button></div><div class="galassia-body"><aside class="galassia-collections" aria-label="Collections Galassia"></aside><div class="galassia-browser"><div class="galassia-filters"><label>Type de produit<select class="galassia-category"><option value="">Tous les types</option></select></label><label>Rechercher<input class="galassia-search" placeholder="Modèle, dimension ou référence…" type="search" autocomplete="off"></label></div><div class="galassia-models"></div></div><section class="galassia-selection" aria-label="Configuration sélectionnée"></section></div></div>';
  document.body.append(overlay);
  return overlay;
 }
 function open(initial,roomId,rows,onAdd){
  const dataset=(rows||[]).filter(eligible);if(!dataset.length)return Promise.resolve(false);
  return index().then(official=>new Promise(resolve=>{
   const overlay=buildOverlay(),prev=document.activeElement;
   let collection=dataset.some(p=>p.collection===initial?.collection)?initial.collection:familyList(dataset)[0];
   let category='',model=initial&&eligible(initial)?modelId(initial):'',reference=initial&&eligible(initial)?initial.reference:'';
   let pending=false;
   const $=selector=>overlay.querySelector(selector);
   const close=()=>{overlay.remove();document.removeEventListener('keydown',escListener);prev?.focus?.();resolve(true);};
   const escListener=e=>{if(e.key==='Escape'){e.preventDefault();close();}};
   document.addEventListener('keydown',escListener);
   $('.galassia-close').onclick=close;
   overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
   const refresh=()=>{
    const here=dataset.filter(p=>p.collection===collection);
    const families=familyList(dataset);
    $('.galassia-collections').innerHTML=families.map(name=>{
      const hero=official.collections?.find(c=>c.name===name)?.hero||'';
      const count=dataset.filter(p=>p.collection===name).length;
      return '<button type="button" class="galassia-family'+(name===collection?' active':'')+'" data-family="'+escape(name)+'">'+(hero?'<img loading="lazy" src="'+escape(hero)+'" alt="">':'<span class="galassia-no-photo">G</span>')+'<span>'+escape(name)+'<small>'+count+' références</small></span></button>';
    }).join('');
    overlay.querySelectorAll('.galassia-family').forEach(btn=>btn.onclick=()=>{
      collection=btn.dataset.family;category='';model='';reference='';$('.galassia-search').value='';refresh();
    });
    const cats=[...new Set(here.map(p=>p.category))].sort();
    $('.galassia-category').innerHTML='<option value="">Tous les types</option>'+cats.map(x=>'<option value="'+escape(x)+'" '+(category===x?'selected':'')+'>'+escape(x)+'</option>').join('');
    const models=modelList(dataset,collection,category,$('.galassia-search').value);
    if(!models.some(p=>modelId(p)===model)){model=models[0]?modelId(models[0]):'';reference='';}
    $('.galassia-models').innerHTML=models.length?models.map(p=>{
     const im=imageFor(p,official),n=variantsFor(dataset,p);
     const low=Math.min(...n.map(x=>x.price));
     return '<button type="button" class="galassia-model'+(modelId(p)===model?' active':'')+'" data-model="'+escape(modelId(p))+'">'+(im?'<img src="'+escape(im)+'" alt="" loading="lazy">':'<div class="galassia-no-photo">Visuel indisponible</div>')+'<strong>'+escape(p.productType||p.base)+'</strong><span>'+escape(p.base)+' · '+n.length+' finition(s)</span><small>À partir de '+money(low)+' HT</small></button>';
    }).join(''):'<p class="galassia-empty">Aucun modèle tarifé avec ces critères.</p>';
    overlay.querySelectorAll('.galassia-model').forEach(btn=>btn.onclick=()=>{
     model=btn.dataset.model;reference='';refresh();
    });
    const m=dataset.find(p=>p.collection===collection&&modelId(p)===model);
    if(!m){$('.galassia-selection').innerHTML='<p>Sélectionnez une collection puis un modèle.</p>';return;}
    const variants=variantsFor(dataset,m);
    if(!variants.some(p=>p.reference===reference))reference=variants[0].reference;
    const p=variants.find(x=>x.reference===reference)||variants[0],img=imageFor(p,official);
    const title=p.productType||p.designation;
    const sourcePage=p.sourcePage?'Page '+p.sourcePage+' du tarif PDF fourni':'Page source non identifiée';
    $('.galassia-selection').innerHTML=
      '<div class="galassia-photo">'+(img?'<img src="'+escape(img)+'" alt="'+escape(title)+'">':'<span>Photo de la référence indisponible</span>')+'</div>'+
      '<div class="galassia-image-note">'+(p.image?'Photographie officielle du modèle · la finition peut différer':'Photo de collection illustrative · ne représente pas nécessairement le modèle')+'</div>'+
      '<span class="galassia-eyebrow">'+escape(p.collection)+' · '+escape(p.category)+'</span><h3>'+escape(title)+'</h3>'+
      '<label class="galassia-variant-label">Référence et finition<select class="galassia-variant">'+variants.map(v=>
         '<option value="'+escape(v.reference)+'" '+(v.reference===reference?'selected':'')+'>'+escape(v.reference)+' · '+escape(finishName(v))+' · '+money(v.price)+' HT</option>').join('')+'</select></label>'+
      '<div class="galassia-summary"><div><span>Référence fabricant</span><b>'+escape(p.reference)+'</b></div><div><span>Prix public HT</span><b>'+money(p.price)+'</b></div><div><span>Remise d’achat fournisseur</span><b>50 %</b></div><div><span>Coût d’achat théorique HT</span><b>'+money(p.price*.5)+'</b></div></div>'+
      '<div class="galassia-docs"><span>'+escape(sourcePage)+' · dessins et dimensions dans le tarif source</span>'+
      (technicalLink(p)?'<a href="'+escape(technicalLink(p))+'" target="_blank" rel="noopener noreferrer">Fiche technique officielle PDF</a>':'')+
      (p.manufacturerUrl?'<a href="'+escape(p.manufacturerUrl)+'" target="_blank" rel="noopener noreferrer">Produit fabricant · fiche technique et CAO</a>':'')+
      '</div><p class="galassia-doc-warning">Seules les références portant un prix non ambigu ont été importées. Les accessoires ne sont pas inclus automatiquement.</p>'+
      '<button type="button" class="galassia-add">Ajouter cette référence au projet</button>';
    $('.galassia-variant').onchange=e=>{reference=e.target.value;refresh();};
    $('.galassia-add').onclick=async()=>{
      if(pending)return;pending=true;const btn=$('.galassia-add');btn.disabled=true;btn.textContent='Ajout…';
      try{await onAdd(p,roomId);close();}
      catch(err){alert(err?.message||"L'article n'a pas pu être ajouté.");pending=false;btn.disabled=false;btn.textContent='Ajouter cette référence au projet';}
    };
   };
   $('.galassia-category').onchange=e=>{category=e.target.value;model='';reference='';refresh();};
   $('.galassia-search').oninput=()=>{model='';reference='';refresh();};
   refresh();$('.galassia-search').focus();
  }));
 }
 return {eligible,modelId,variantsFor,familyList,modelList,finishName,technicalLink,open};
});