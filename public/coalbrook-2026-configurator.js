/* Coalbrook 2026 guided configuration over the existing EUR HT catalogue.
   Does not rewrite quotations or product prices. */
(function(){
'use strict';
const T=window.HydroCoalbrook2026;
if(!T)return;
const $=(q,r=document)=>r.querySelector(q);
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
const fmt=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n);
const allowed=(str,list)=>list.includes(str)?str:(list[0]||'');
let dialog=null,selection=null,mediaToken=0;
// Preserve manufacturer photos already recovered by the V11 resolver/cache.
// An old generic image must never be described as an exact finish.
function coalbrookPreviousMedia(p){
 if(typeof cachedManufacturerImage!=='function')return null;
 try{return cachedManufacturerImage(p)||null}catch(_){return null}
}
function coalbrookPreferredMedia(p){
 const previous=coalbrookPreviousMedia(p);
 if(previous?.src&&previous.finishMatch==='exact')
   return {src:previous.src,label:'Photo Coalbrook déjà enregistrée · finition exacte',record:previous};
 if(p?.image&&/^(https?:|\/)/i.test(p.image))
   return {src:p.image,label:p.imageFinishMatch==='exact'?
    'Photo officielle · finition exacte '+T.finish(p):'Photo fabricant · finition à vérifier',record:previous};
 if(previous?.src)
   return {src:previous.src,label:'Photo enregistrée · finition à vérifier',record:previous};
 return {src:'',label:'Photo à rechercher',record:previous};
}
function chooseText(select,items,preserve=true){
 const value=preserve?select.value:'';
 select.replaceChildren();
 for(const item of items){const opt=make('option');opt.value=item;opt.textContent=item;select.append(opt)}
 select.value=allowed(value,items);
}
function safeUrl(value){return /^https:\/\//i.test(value||'')?value:''}
function variants(rows,base){return rows.filter(r=>T.base(r)===base).sort((a,b)=>(a.finishCode||'').localeCompare(b.finishCode||''))}
// Mandatory Maestro rough-ins: verified on Coalbrook August 2026 PDF pages 174–186.
function mandatoryRoughReference(p){
 const code=T.base(p).toUpperCase();
 if(/^(?:DO|DC|BA|ZU)30(?:5[0-4]|6[12])$/.test(code))return 'CO'+code.slice(-4);
 if(code==='CO3065')return 'CO3064';
 return String(p?.internalReference||'');
}
function isMaestro(p){return T.classification(p)[1]==='Maestro'||/maestro/i.test(String(p?.designation||''))}
function roughFor(p,products){const ref=mandatoryRoughReference(p);return {ref,product:ref?products.find(row=>row.reference===ref)||null:null}}
function groupModels(rows){
 const used=new Map();
 for(const row of rows){
  const base=T.base(row);if(!used.has(base))used.set(base,row);
 }
 return [...used.values()].sort((a,b)=>String(a.designation||'').localeCompare(String(b.designation||''),'fr'));
}
function show(rows,roomId,onAdd,initial){
 const products=(rows||[]).filter(p=>p.manufacturer==='Coalbrook'&&Number.isFinite(Number(p.price)));
 if(!products.length){alert('Catalogue Coalbrook non chargé. Ouvrez à nouveau le configurateur après le chargement du catalogue.');return}
 dialog?.remove();
 const overlay=make('div','coalbrook-modal-overlay');overlay.id='coalbrookConfig';
 const body=make('section','coalbrook-modal');body.setAttribute('role','dialog');body.setAttribute('aria-modal','true');body.setAttribute('aria-labelledby','coalbrook-modal-title');
 overlay.append(body);
 const header=make('header','coalbrook-modal-head');
 const heading=make('div');
 heading.append(make('span','coalbrook-eyebrow','COALBROOK · EUR HT · TARIF AOÛT 2026'),make('h2','', 'Configurateur Coalbrook'),make('p','','Collections officielles, références exactes et corps d’encastrement associés.'));
 const close=make('button','coalbrook-close','×');close.type='button';close.setAttribute('aria-label','Fermer le configurateur');close.addEventListener('click',()=>{overlay.remove();dialog=null});
 const importPhotos=make('button','coalbrook-import-photos','Importer les photos du tarif (ZIP)');
 importPhotos.type='button';importPhotos.title='Import local dans ce navigateur, aucune modification des projets ni du serveur';
 importPhotos.addEventListener('click',async()=>{
  const importer=window.HydroCoalbrookPdfPhotos;
  if(!importer){alert('Module d’import PDF indisponible.');return}
  importPhotos.disabled=true;importPhotos.textContent='Import des photos…';
  try{
   const count=await importer.chooseZip();
   if(count){importPhotos.textContent=count+' photos disponibles localement';setupDown(4);}
   else importPhotos.textContent='Importer les photos du tarif (ZIP)';
  }catch(e){importPhotos.textContent='Importer les photos du tarif (ZIP)';alert('Import des visuels : '+(e.message||e))}
  finally{importPhotos.disabled=false}
 });
 header.append(heading,importPhotos,close);body.append(header);
 const grid=make('div','coalbrook-modal-grid'),filters=make('div','coalbrook-fields'),view=make('div','coalbrook-product-card');
 body.append(grid);grid.append(filters,view);
 const selects={};
 const fields=[['family','01 · Catégorie'],['range','02 · Collection'],['sub','03 · Sous-catégorie'],['model','04 · Article'],['finish','05 · Finition']];
 for(const [key,label] of fields){
  const row=make('label','coalbrook-field');row.append(make('span','',label));
  const select=make('select');select.setAttribute('aria-label',label);row.append(select);filters.append(row);selects[key]=select;
 }
 const gallery=make('div','coalbrook-model-gallery');
 gallery.setAttribute('aria-label','Explorer les modèles Coalbrook');
 filters.append(gallery);
 const foot=make('footer','coalbrook-modal-foot');
 const note=make('span','', 'Prix exprimés HT. Remise Coalbrook existante conservée dans le calcul du projet.');
 const add=make('button','coalbrook-add','Ajouter au projet');add.type='button';foot.append(note,add);body.append(foot);
 const rowsByHierarchy=(family,range,sub)=>products.filter(p=>{
  const path=T.classification(p);
  return (!family||path[0]===family)&&(!range||path[1]===range)&&(!sub||path[2]===sub);
 });
 function setupDown(from){
  const {family,range,sub,model,finish}=selects;
  if(from<=0)chooseText(family,Object.keys(T.menus),true);
  const fam=family.value,available=rowsByHierarchy(fam);
  const ranges=[...new Set(available.map(p=>T.classification(p)[1]))];
  const official=Object.keys(T.menus[fam]||{}),ordered=[...official.filter(x=>ranges.includes(x)),...ranges.filter(x=>!official.includes(x)).sort()];
  if(from<=1)chooseText(range,ordered,true);
  const byRange=rowsByHierarchy(fam,range.value);
  const subs=[...new Set(byRange.map(p=>T.classification(p)[2]))];
  const order=T.menus[fam]?.[range.value]||[];
  const sorted=[...order.filter(x=>subs.includes(x)),...subs.filter(x=>!order.includes(x)).sort()];
  if(from<=2)chooseText(sub,sorted,true);
  const models=groupModels(rowsByHierarchy(fam,range.value,sub.value));
  if(from<=3){
   const last=model.value;
   model.replaceChildren();
   for(const item of models){const opt=make('option');opt.value=T.base(item);opt.textContent=(item.designation||'Article')+' · '+T.base(item);model.append(opt)}
   if(last&&models.some(p=>T.base(p)===last))model.value=last;
  }
  // Galassia-style model exploration: selectable photo tiles by model.
  // These are only previews; the exact finish is selected separately below.
  gallery.replaceChildren();
  const previewModels=models.slice(0,64);
  for(const item of previewModels){
   const base=T.base(item);
   const card=make('button','coalbrook-model-tile');card.type='button';
   card.dataset.model=base;card.setAttribute('aria-label',(item.designation||base)+' · '+base);
   card.setAttribute('aria-pressed',model.value===base?'true':'false');
   const previews=variants(products,base);
   const exact=previews.find(p=>p.image&&p.imageFinishMatch==='exact');
   const photo=exact||previews.find(p=>p.image)||null;
   const verifiedCache=!photo&&previews.map(coalbrookPreviousMedia).find(c=>c?.src&&c.finishMatch==='exact');
   const uncertainCache=!photo&&!verifiedCache&&previews.map(coalbrookPreviousMedia).find(c=>c?.src);
   const frame=make('span','coalbrook-model-tile-photo');
   const imageSrc=photo?.image||verifiedCache?.src||uncertainCache?.src||'';
   if(imageSrc){
    const img=make('img');img.src=imageSrc;img.loading='lazy';img.alt=(item.designation||base)+' · aperçu du modèle';
    img.addEventListener('error',()=>frame.replaceChildren(make('span','','Visuel indisponible')),{once:true});
    frame.append(img);
   }else frame.append(make('span','','Photo à compléter'));
   const label=make('small','coalbrook-model-photo-status',exact||verifiedCache?'Photo fabricant · finition exacte':'Photo à vérifier');
   card.append(frame,make('b','',base),make('small','',(item.designation||'Modèle Coalbrook').slice(0,76)),label);
   // Only unresolved thumbnails are queried, with a small per-view budget.
   // The manufacturer's V11 cache is consulted before fetching again.
   if(!imageSrc&&window.HydroCoalbrookPdfPhotos?.get){
    window.HydroCoalbrookPdfPhotos.get(previews[0].reference).then(found=>{
     if(!card.isConnected||!found?.src)return;
     const img=make('img');img.src=found.src;img.loading='lazy';img.alt=(item.designation||base)+' · photo du tarif 2026';frame.replaceChildren(img);
     label.textContent=found.finishMatch==='exact'?'Photo du tarif 2026 · finition exacte':'Photo du tarif 2026 · modèle à vérifier';
    }).catch(()=>{});
   }
   if(!imageSrc&&gallery.childElementCount<12&&typeof fetchManufacturerImage==='function'){
    Promise.resolve(fetchManufacturerImage(previews[0],false,{imageOnly:true})).then(res=>{
     if(!card.isConnected||!res?.src)return;
     const img=make('img');img.src=res.src;img.loading='lazy';
     img.alt=(item.designation||base)+' · visuel fabricant';
     frame.replaceChildren(img);
     label.textContent=res.finishMatch==='exact'?'Photo fabricant · finition exacte':'Photo fabricant · finition à vérifier';
    }).catch(()=>{});
   }
   card.addEventListener('click',()=>{model.value=base;setupDown(4)});
   gallery.append(card);
  }
  if(models.length>64)gallery.append(make('small','coalbrook-more-models',String(models.length-64)+' autres modèles : affinez la catégorie'));
  const variantsForModel=variants(products,model.value);
  const chosenFinish=finish.value;
  finish.replaceChildren();
  for(const item of variantsForModel){
   const opt=make('option');opt.value=item.reference;opt.textContent=T.finish(item)+' · '+item.reference;finish.append(opt);
  }
  if(chosenFinish&&variantsForModel.some(p=>p.reference===chosenFinish))finish.value=chosenFinish;
  selection=variantsForModel.find(p=>p.reference===finish.value)||variantsForModel[0]||null;
  display();
 }
 function display(){
  view.replaceChildren();
  const p=selection,info=p&&T.detail(p),required=p?roughFor(p,products):{ref:'',product:null},rough=required.product;
  add.disabled=!p||!!required.ref&&!rough;
  if(!p){view.append(make('p','','Aucun article disponible pour ces filtres.'));return}
  const preview=make('div','coalbrook-product-media');
  const media=coalbrookPreferredMedia(p), request=++mediaToken;
  function renderPhoto(src,label){
   if(!src)return false;
   const img=make('img');img.src=src;img.loading='lazy';
   img.alt=(p.designation||'Coalbrook')+' · '+T.finish(p);
   const note=make('small','coalbrook-media-source',label);
   img.addEventListener('error',()=>{
    if(request!==mediaToken||!document.contains(preview))return;
    preview.replaceChildren(make('span','','Photo momentanément indisponible.'));
   },{once:true});
   preview.replaceChildren(img,note);return true;
  }
  let pdfResolvedExact=false;
  const displayed=renderPhoto(media.src,media.label);
  if(!displayed)preview.append(make('div','coalbrook-media-pending','Recherche parmi les photos Coalbrook déjà enregistrées…'));
  // A previous generic/uncertain cached image is not a definitive match:
  // show it immediately, but continue looking for an exact official SKU finish.
  // Never downgrade an exact source photo to an unverified fallback.
  const needsSearch=!displayed||(p.imageFinishMatch!=='exact'&&media.record?.finishMatch!=='exact');
  if(needsSearch&&typeof fetchManufacturerImage==='function'){
   Promise.resolve(fetchManufacturerImage(p,false,{imageOnly:false})).then(result=>{
    if(request!==mediaToken||selection?.reference!==p.reference||!document.contains(preview))return;
    if(result?.src&&(!displayed||result.finishMatch==='exact')&&(!pdfResolvedExact||result.finishMatch==='exact')){
     renderPhoto(result.src,result.finishMatch==='exact'?
      'Photo retrouvée · finition exacte':'Photo fabricant · finition à vérifier');
    }else if(!displayed&&!pdfResolvedExact)preview.replaceChildren(make('span','','Photo non trouvée pour cette référence.'));
   }).catch(()=>{
    if(!displayed&&!pdfResolvedExact&&request===mediaToken&&document.contains(preview))
     preview.replaceChildren(make('span','','Photo temporairement indisponible.'));
   });
  }else if(!displayed)preview.replaceChildren(make('span','','Photo non identifiée pour cette référence.'));
  view.append(preview);
  // User-supplied 2026 brochure photos are exact only for uniquely keyed SKUs.
  // They remain local to this browser; official web images keep precedence.
  if(p.imageFinishMatch!=='exact'&&media.record?.finishMatch!=='exact'&&window.HydroCoalbrookPdfPhotos?.get){
   window.HydroCoalbrookPdfPhotos.get(p.reference).then(photo=>{
    if(!photo?.src||request!==mediaToken||selection?.reference!==p.reference||!document.contains(preview))return;
    pdfResolvedExact=photo.finishMatch==='exact';
    renderPhoto(photo.src,photo.finishMatch==='exact'?
     'Photo extraite du tarif août 2026 · référence exacte · stockage local':
     'Photo extraite du tarif août 2026 · modèle à vérifier · stockage local');
   }).catch(()=>{});
  }
  const d=make('div','coalbrook-product-description');
  d.append(make('span','coalbrook-breadcrumb',info.hierarchy.join('  /  ')),make('h3','',p.designation||p.originalDescription||p.reference),
    make('div','coalbrook-reference',p.reference),make('div','coalbrook-amount',fmt(Number(p.price))+' HT'));
  const props=make('dl','coalbrook-properties');
  for(const [name,value] of [['Finition',T.finish(p)],['Référence',p.reference],['Prix source','EUR HT'],['Pages spécifications',info.specificationPages.length?info.specificationPages.join(', ')+' (tarif 2026)':'À indexer']]){
   const row=make('div');row.append(make('dt','',name),make('dd','',value));props.append(row);
  }
  d.append(props);
  const technical=make('div','coalbrook-technical-alert');
  const previousDocs=coalbrookPreviousMedia(p);
  const specLink=safeUrl(p.technicalSheetUrl||previousDocs?.technicalSheetUrl),guideLink=safeUrl(p.installationGuideUrl||previousDocs?.installationGuideUrl);
  if(specLink){
   const link=make('a','coalbrook-doc-link','Ouvrir la fiche technique PDF officielle');
   link.href=specLink;link.target='_blank';link.rel='noopener noreferrer';technical.append(link);
  }else technical.append(make('span','','Fiche PDF individuelle indisponible sur la fiche produit officielle.'));
  if(guideLink){
   const guide=make('a','coalbrook-doc-link','Notice d’installation PDF');
   guide.href=guideLink;guide.target='_blank';guide.rel='noopener noreferrer';technical.append(guide);
  }
  if(info.specificationPages.length)technical.append(make('small','', 'Dessins et cotes : pages '+info.specificationPages.join(', ')+' du tarif Coalbrook 2026.'));
  d.append(technical);
  if(required.ref){
   const box=make('div','coalbrook-rough');
   box.append(make('strong','','Corps encastré obligatoire · '+required.ref),
    make('span','',rough?fmt(Number(rough.price))+' HT · ajouté en ligne liée':'Référence absente du catalogue : ajout bloqué'));
   if(rough)box.append(make('b','', 'Total articles : '+fmt(Number(p.price)+Number(rough.price))+' HT'));
   d.append(box);
  }
  const url=safeUrl(p.manufacturerUrl);
  if(url){const link=make('a','coalbrook-official-link','Consulter Coalbrook');link.href=url;link.target='_blank';link.rel='noopener noreferrer';d.append(link)}
  view.append(d);
 }
 selects.family.addEventListener('change',()=>setupDown(1));
 selects.range.addEventListener('change',()=>setupDown(2));
 selects.sub.addEventListener('change',()=>setupDown(3));
 selects.model.addEventListener('change',()=>setupDown(4));
 selects.finish.addEventListener('change',()=>{selection=products.find(p=>p.reference===selects.finish.value)||null;display()});
 add.addEventListener('click',()=>{
  const p=selection;
  if(!p)return;
  const required=roughFor(p,products),rough=required.product;
  if(required.ref&&!rough)return;
  if(!onAdd){alert('Aucune salle du projet cible.');return}
  try{onAdd(p,rough,roomId);overlay.remove();dialog=null}
  catch(e){alert('Impossible d’ajouter la sélection : '+(e.message||e))}
 });
 overlay.addEventListener('click',e=>{if(e.target===overlay){overlay.remove();dialog=null}});
 document.addEventListener('keydown',function escape(e){
  if(e.key==='Escape'&&document.contains(overlay)){overlay.remove();dialog=null;document.removeEventListener('keydown',escape)}
 },{once:false});
 document.body.append(overlay);dialog=overlay;
 const initialRow=initial&&products.find(p=>p.reference===initial.reference);
 if(initialRow){
  const path=T.classification(initialRow);
  setupDown(0);
  selects.family.value=path[0];setupDown(1);
  selects.range.value=path[1];setupDown(2);
  selects.sub.value=path[2];setupDown(3);
  selects.model.value=T.base(initialRow);setupDown(4);
  selects.finish.value=initialRow.reference;selection=initialRow;display()
 }else setupDown(0);
 setTimeout(()=>selects.family.focus(),0);
}
function commitCoalbrookSelection(main,rough,room){
 // The source catalogue totalPrice already includes the rough-in, so the
 // linked line must be subtracted from the parent to avoid double billing.
 const parent=createSelectedProductRecord({...main,vat:'HT',
  totalPrice:Number(main.price),internalPrice:0,internalReference:'',
  coalbrookConfiguration:{reference:main.reference,finish:main.finishCode||'',roughIn:rough?.reference||''}
 },room);
 if(!parent)throw Error('Référence principale introuvable.');
 const records=[parent];
 if(rough){
  const child=createSelectedProductRecord({...rough,vat:'HT'},room,parent.id);
  if(!child)throw Error('Corps encastré introuvable.');
  child.accessoryFor=parent.id;child.quantityPerParent=1;
  records.push(child);
 }
 commitSelectedRecords(records,{showProject:true});
}
function launch(initial,roomId){
 const items=catalogIndex.maker('Coalbrook');
 if(initial&&!items.some(p=>p.reference===initial.reference)){
  alert('Référence Coalbrook indisponible dans le catalogue chargé : '+initial.reference);
  return;
 }
 show(items,roomId,commitCoalbrookSelection,initial||null);
}
function currentRoomId(){
 return document.querySelector('#targetRoom')?.value||state.rooms[0]?.id||'';
}
function attach(){
 const catalog=document.querySelector('#view-catalog');
 if(!catalog||document.querySelector('#coalbrookLaunch'))return;
 const trigger=make('button','coalbrook-launch','Configurer Coalbrook');
 trigger.id='coalbrookLaunch';trigger.type='button';
 trigger.title='Ouvrir le configurateur Coalbrook 2026 · références et prix HT';
 const target=catalog.querySelector('.search-card .target-row');
 if(target)target.after(trigger);
 else (catalog.querySelector('.search-card')||catalog).prepend(trigger);
 trigger.addEventListener('click',()=>launch(null,currentRoomId()));
 const mf=document.querySelector('#manufacturerFilter');
 const update=()=>{
  const coalbrook=mf?.value==='Coalbrook';
  trigger.hidden=!coalbrook;
  trigger.setAttribute('aria-hidden',coalbrook?'false':'true');
 };
 mf?.addEventListener('change',update);
 // Brand chips change the select programmatically without emitting change.
 // Synchronise the button after EVERY catalogue render, including those
 // triggered by the brand rail and the V12 workspace.
 const previousRender=window.renderCatalog;
 if(typeof previousRender==='function'){
  window.renderCatalog=function(){
   const result=previousRender.apply(this,arguments);
   update();
   return result;
  };
 }
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
window.HydroCoalbrookConfigurator={open:show,openProduct:(product,roomId)=>launch(product,roomId),launch,mandatoryRoughReference};
})();