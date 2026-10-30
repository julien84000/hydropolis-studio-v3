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
 const technicalCache=new Map();
 async function resolveTechnical(product){
  if(technicalLink(product))return technicalLink(product);
  if(!product?.manufacturerUrl||!/^https:\/\/www\.ceramicagalassia\.(?:it\/catalogo|com\/catalogue)\//.test(product.manufacturerUrl))return '';
  const reference=product.reference;
  if(!technicalCache.has(reference)){
   technicalCache.set(reference,fetch('/api/galassia-technical?reference='+encodeURIComponent(reference))
      .then(r=>r.ok?r.json():null).then(d=>d?.url||'').catch(()=>''));
  }
  const link=await technicalCache.get(reference);
  if(link){product.technicalSheetUrl=link;product.technicalSheetLabel='Fiche technique officielle Galassia';}
  return link;
 }
 let indexJob;
 async function index(){
  if(!indexJob)indexJob=(window.HydroGalassiaTree?.load?.()||fetch('/galassia/official-tree.json',{cache:'no-cache'}).then(r=>{
   if(!r.ok)throw Error('Index photographique indisponible');return r.json();
  })).catch(e=>{indexJob=null;console.error('[Galassia hierarchy]',e);return {collections:[]};});
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
  overlay.innerHTML='<div class="galassia-shell"><div class="galassia-top"><div><span class="galassia-eyebrow">GALASSIA · LA CERAMICA CONTEMPORANEA</span><h2>Configurer la sélection</h2><p>Collection → famille fabricant → modèle → finition et référence exacte</p></div><button type="button" class="galassia-close" aria-label="Fermer">×</button></div><div class="galassia-body"><aside class="galassia-collections" aria-label="Collections Galassia"></aside><div class="galassia-browser"><div class="galassia-filters"><div class="galassia-path">Collections → familles officielles → modèles → finitions</div><label>Rechercher<input class="galassia-search" placeholder="Modèle, dimension ou référence…" type="search" autocomplete="off"></label></div><div class="galassia-subfamilies" aria-label="Familles officielles du fabricant"></div><div class="galassia-models"></div></div><section class="galassia-selection" aria-label="Configuration sélectionnée"></section></div></div>';
  document.body.append(overlay);
  return overlay;
 }

 function open(initial,roomId,rows,onAdd){
  const all=(rows||[]).filter(eligible);
  if(!all.length)return Promise.resolve(false);
  return index().then(tree=>new Promise(resolve=>{
   const source=window.HydroGalassiaTree;
   if(!source||!Array.isArray(tree.collections)||!tree.collections.length)throw Error("Arborescence officielle Galassia indisponible");
   const overlay=buildOverlay(),prev=document.activeElement;
   const official=source.collections(tree),unmatched=source.unmatchedRows(all);
   const matchInitial=initial?.officialStructureVerified===true;
   let slug=matchInitial?initial.manufacturerCollectionSlug:(initial?.manufacturerCollectionSlug||source.unknown);
   if(!official.some(x=>x.slug===slug)&&slug!==source.unknown)slug=official[0].slug;
   let sectionIndex=0,model=matchInitial?modelId(initial):'',reference=initial?.reference||'',pending=false;
   const $=q=>overlay.querySelector(q), $$=q=>[...overlay.querySelectorAll(q)];
   const close=()=>{overlay.remove();document.removeEventListener('keydown',escListener);prev?.focus?.();resolve(true);};
   const escListener=e=>{if(e.key==='Escape'){e.preventDefault();close();}};
   document.addEventListener('keydown',escListener);$('.galassia-close').onclick=close;
   overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
   const collectionRef=()=>official.find(c=>c.slug===slug)||null;
   const groupsFor=()=>{
    if(slug===source.unknown)return [{name:'Autres références du tarif · non rapprochées',prices:unmatched.length,official:false,global:true,items:[]}];
    return source.familySections(tree,collectionRef(),all);
   };
   const getModels=section=>{
    if(!section)return[];
    if(section.global){
      const by=new Map();
      for(const p of unmatched){
       const key=String(p.base||p.reference);
       if(!by.has(key))by.set(key,{base:key,name:p.productType||p.designation||key,image:p.image||'',url:p.manufacturerUrl||'',variants:[]});
       by.get(key).variants.push(p);
      }
      return [...by.values()].sort((a,b)=>a.base.localeCompare(b.base,'fr',{numeric:true}));
    }
    return source.models(tree,collectionRef(),section,all);
   };
   const refresh=()=>{
    const collection=collectionRef();
    $('.galassia-collections').innerHTML=official.map(c=>{
     const priced=all.filter(p=>p.officialStructureVerified===true&&p.manufacturerCollectionSlug===c.slug).length;
     return '<button type="button" class="galassia-family'+(c.slug===slug?' active':'')+'" data-family="'+escape(c.name)+'" data-collection-slug="'+escape(c.slug)+'">'+
       (c.hero?'<img src="'+escape(c.hero)+'" alt="" loading="lazy">':'<span class="galassia-no-photo">G</span>')+
       '<span>'+escape(c.name)+'<small>'+priced+' références rapprochées</small></span></button>';
    }).join('')+(unmatched.length?'<div class="galassia-unmatched-label">À VÉRIFIER</div><button type="button" class="galassia-family galassia-unmatched'+(slug===source.unknown?' active':'')+'" data-collection-slug="'+source.unknown+'"><span>Autres références du tarif<small>'+unmatched.length+' sans famille vérifiée</small></span></button>':'');
    $$('.galassia-family').forEach(button=>button.onclick=()=>{
      slug=button.dataset.collectionSlug;sectionIndex=0;model='';reference='';$('.galassia-search').value='';refresh();
    });
    const groups=groupsFor();
    if(!groups.length)sectionIndex=0;
    if(sectionIndex>=groups.length)sectionIndex=0;
    const active=groups[sectionIndex];
    $('.galassia-subfamilies').innerHTML=groups.map((g,i)=>
      '<button type="button" class="galassia-section'+(i===sectionIndex?' active':'')+'" data-section-index="'+i+'"><strong>'+escape(g.name)+'</strong><small>'+(g.prices||0)+' réf. tarifées</small></button>'
    ).join('');
    $$('.galassia-section').forEach(b=>b.onclick=()=>{
      sectionIndex=Number(b.dataset.sectionIndex);model='';reference='';$('.galassia-search').value='';refresh();
    });
    const query=norm($('.galassia-search').value.trim());
    const entries=getModels(active).filter(m=>!query||[m.base,m.name,...m.variants.map(x=>x.reference)].some(x=>norm(x).includes(query)));
    if(!entries.some(m=>m.base===model)){
      model=entries.find(m=>m.variants.length)?.base||entries[0]?.base||'';
      reference='';
    }
    $('.galassia-models').innerHTML=entries.length?entries.map(m=>{
      const hasPrice=m.variants.length>0;
      const photo=m.image||m.variants[0]?.image||'';
      const shared='<span class="galassia-model-photo">'+(photo?'<img src="'+escape(photo)+'" alt="" loading="lazy">':'<span class="galassia-no-photo">Photo fabricant non disponible</span>')+'</span><strong>'+escape(m.name||m.base)+'</strong><span>'+escape(m.base)+(hasPrice?' · '+m.variants.length+' déclinaison(s)':'')+'</span>';
      if(!hasPrice)return '<a class="galassia-model galassia-unpriced" href="'+escape(/^https:\/\/www\.ceramicagalassia\.(?:it\/catalogo|com\/catalogue)\//.test(m.url||'')?m.url:(collection?.url||'https://www.ceramicagalassia.it/catalogo/'))+'" target="_blank" rel="noopener noreferrer">'+shared+'<small>Modèle officiel · aucun prix importé</small></a>';
      return '<button type="button" class="galassia-model'+(m.base===model?' active':'')+'" data-model="'+escape(m.base)+'">'+shared+'<small>À partir de '+money(Math.min(...m.variants.map(v=>v.price)))+' HT</small></button>';
    }).join(''):'<p class="galassia-empty">Aucun modèle dans cette rubrique. Le site fabricant conserve cette famille dans son arborescence.</p>';
    $$('.galassia-model[data-model]').forEach(b=>b.onclick=()=>{model=b.dataset.model;reference='';refresh();});
    const m=entries.find(x=>x.base===model&&x.variants.length);
    if(!m){$('.galassia-selection').innerHTML='<p class="galassia-empty">Choisissez un modèle tarifé. Les produits non chiffrés restent accessibles sur le site Galassia, sans prix supposé.</p>';return;}
    const variants=m.variants;
    if(!variants.some(x=>x.reference===reference))reference=variants[0].reference;
    const p=variants.find(x=>x.reference===reference)||variants[0];
    const image=m.image||p.image||'';
    const title=m.name||p.productType||p.designation;
    const pdfSource=p.sourcePdfPage||p.sourcePage;
    const optionSet=window.HydroGalassiaAccessories?.compatible?.(p,all)||{kind:'',groups:[],included:[]};
    const extraMarkup=optionSet.kind?'<section class="galassia-accessories"><h4>'+({wc:'Accessoires du WC',bidet:'Accessoires du bidet',urinal:"Options de l’urinoir"}[optionSet.kind]||'Accessoires compatibles')+'</h4>'+
      optionSet.included.map(note=>'<div class="galassia-included">'+escape(note)+'</div>').join('')+
      optionSet.groups.map(group=>'<label class="galassia-accessory-row"><span>'+escape(group.title)+'</span><select class="galassia-option-select" data-option-group="'+escape(group.id)+'"><option value="">Ne pas ajouter</option>'+
        group.options.map(x=>'<option value="'+escape(x.reference)+'">'+escape(x.designation.split(' · ')[0])+' · '+escape(x.reference)+' · '+money(x.price)+' HT</option>').join('')+
      '</select>'+(group.notice?'<small>'+escape(group.notice)+'</small>':'')+'</label>').join('')+
      '<p class="galassia-accessories-help">Les accessoires sélectionnés sont ajoutés séparément au projet et au devis ; aucun kit déjà inclus n’est facturé automatiquement.</p></section>':'';
    $('.galassia-selection').innerHTML=
      '<div class="galassia-photo">'+(image?'<img src="'+escape(image)+'" alt="'+escape(title)+'">':'<span>Photo fabricant indisponible</span>')+'</div>'+
      '<div class="galassia-image-note">'+(image?'Photographie du modèle · la finition illustrée peut différer':'Aucune photographie exacte du modèle vérifiée')+'</div>'+
      '<span class="galassia-eyebrow">'+escape(p.manufacturerCollection||p.collection)+' · '+escape(p.manufacturerFamily||'Rubrique à rapprocher')+'</span><h3>'+escape(title)+'</h3>'+
      '<label class="galassia-variant-label">Référence et finition<select class="galassia-variant">'+variants.map(v=>
       '<option value="'+escape(v.reference)+'" '+(v.reference===reference?'selected':'')+'>'+escape(v.reference)+' · '+escape(finishName(v))+' · '+money(v.price)+' HT</option>').join('')+'</select></label>'+
      '<div class="galassia-summary"><div><span>Référence fabricant</span><b>'+escape(p.reference)+'</b></div><div><span>Prix public HT</span><b>'+money(p.price)+'</b></div><div><span>Remise d’achat fournisseur</span><b>50 %</b></div><div><span>Coût d’achat théorique HT</span><b>'+money(p.price*.5)+'</b></div></div>'+
      '<div class="galassia-docs"><span>'+(pdfSource?'Tarif Galassia · page '+pdfSource+' (dessin technique dans le PDF source)':'Page du tarif non identifiée')+'</span>'+
      (technicalLink(p)?'<a href="'+escape(technicalLink(p))+'" target="_blank" rel="noopener noreferrer">Fiche technique PDF officielle</a>':'')+
      (/^https:\/\/www\.ceramicagalassia\.(?:it\/catalogo|com\/catalogue)\//.test(p.manufacturerUrl||'')?'<a href="'+escape(p.manufacturerUrl)+'" target="_blank" rel="noopener noreferrer">Fiche produit chez Galassia</a>':'')+'</div>'+
      (!p.officialStructureVerified?'<p class="galassia-doc-warning">Famille non confirmée sur le site fabricant : vérifier avant commande.</p>':'')+
      extraMarkup+'<button type="button" class="galassia-add">Ajouter la référence exacte au projet</button>';
    if(!technicalLink(p))resolveTechnical(p).then(url=>{
      if(!url||reference!==p.reference||!overlay.isConnected)return;
      const docs=$('.galassia-docs');
      if(docs&&!docs.querySelector('.galassia-technical-pdf')){
        const a=document.createElement('a');a.className='galassia-technical-pdf';a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Fiche technique PDF officielle';docs.append(a);
      }
    });
    $('.galassia-variant').onchange=e=>{reference=e.target.value;refresh();};
    $('.galassia-add').onclick=async()=>{
      if(pending)return;pending=true;const button=$('.galassia-add');button.disabled=true;button.textContent='Ajout…';
      try{
        const accessories=[...overlay.querySelectorAll('.galassia-option-select')].map(el=>{
          const ref=el.value;
          return ref?all.find(x=>x.manufacturer==='Galassia'&&x.reference===ref):null;
        }).filter(Boolean);
        await resolveTechnical(p);
        await onAdd(p,roomId,accessories);
        close();
      }
      catch(error){alert(error?.message||"Impossible d'ajouter l'article.");pending=false;button.disabled=false;button.textContent='Ajouter la référence exacte au projet';}
    };
   };
   $('.galassia-search').oninput=()=>{model='';reference='';refresh();};
   if(matchInitial&&initial.manufacturerFamily){
    const found=groupsFor().findIndex(x=>x.name===initial.manufacturerFamily);
    if(found>=0)sectionIndex=found;
   }else if(!matchInitial){
    const found=groupsFor().findIndex(x=>!x.official);
    if(found>=0)sectionIndex=found;
   }
   refresh();$('.galassia-search').focus();
  }));
 }
 return {eligible,modelId,variantsFor,familyList,modelList,finishName,technicalLink,open};
});