/* Recor 2026 · Guided bathroom catalogue configurator.
 * Prices and references from existing catalog_recor.json only.
 * Manufacturer pictures & technical sheets: /api/recor-model-media.
 * Custom RAL/material artwork is a visualization, not an invented price SKU.
 */
(function(root){
'use strict';
const M=root.HydroRecorModel;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>(Number(v)||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const photo=model=>'/api/recor-model-photo?model='+encodeURIComponent(model)+'&index=0';
const isBath=p=>p?.manufacturer==='Recor'&&p.category==='Bain';
const externalFinish=p=>String(p?.finishCode||'').startsWith('WHITE')?'WHITE':'RAW';
const DIMCATEGORY=['Baignoires sur pieds','Baignoires îlot','Baignoires rectangulaires'];
const includesFeet=p=>p?.collection==='Baignoires sur pieds'&&!/COLLINS/.test(p?.base||'');
function open(args={}){
 if(!M)throw Error('Module Recor 2026 non chargé');
 const rows=(args.rows||[]).filter(p=>p.manufacturer==='Recor');
 if(!rows.length)throw Error('Tarif Recor 2026 introuvable');
 const editing=!!args.initial?.id;
 const initial=isBath(args.initial)?args.initial:null;
 const first=initial||rows.find(p=>p.category==='Bain'&&M.modelCode(p)==='SLIPPER')||rows.find(isBath);
 const state={
  category:initial?.collection||first?.collection||'Baignoires sur pieds',
  model:M.modelCode(first),dimension:M.dimension(first)?.label||'',
  finish:externalFinish(first),holes:String(first?.finishCode||'').endsWith('-TH'),
  feet:args.existingFootRef||'',waste:args.existingWasteRef||'',
  finishMode:args.initial?.recorConfiguration?.finishMode||'standard',
  ral:args.initial?.recorConfiguration?.ral||'',
  material:args.initial?.recorConfiguration?.material||'',
  customColor:args.initial?.recorConfiguration?.previewColor||'#84949a',
  antiSlip:!!args.initial?.recorConfiguration?.antiSlip,
  photoIndex:0,media:new Map(),photoObjects:new Map(),closed:false,
  photoError:false,premiumTarget:''
 };
 let previewSnapshot='';
 const overlay=document.createElement('div');
 overlay.className='recor-guided-overlay';overlay.id='recorGuidedConfigurator';
 overlay.innerHTML='<section class="recor-guided-dialog" role="dialog" aria-modal="true" aria-label="Configurateur Recor 2026"></section>';
 document.body.appendChild(overlay);
 const dlg=overlay.querySelector('.recor-guided-dialog');
 function current(){
  const options=M.pricedOptions(rows,state.model);
  const main=M.findVariant(rows,state.model,state.dimension,state.finish,state.holes);
  const allFeet=main?M.feetFor(rows,main):[];
  const allWaste=main?M.wastesFor(rows,main):[];
  const foot=allFeet.find(x=>x.reference===state.feet)||null;
  const waste=allWaste.find(x=>x.reference===state.waste)||null;
  return {options,main,foot,waste,allFeet,allWaste};
 }
 function ensureState(){
  const groups=M.groupByModel(rows,state.category);
  if(state.category==='Finitions premium'){
   if(!M.PREMIUM_FINISHES.some(x=>x.id===state.model))state.model=M.PREMIUM_FINISHES[0].id;
   const allowed=M.PREMIUM_ELIGIBILITY[state.model]||[];
   if(!allowed.includes(state.premiumTarget))state.premiumTarget=allowed[0]||'';
  }
  if(DIMCATEGORY.includes(state.category)){
   if(!groups.some(x=>x.model===state.model))state.model=groups[0]?.model||'';
   const o=M.pricedOptions(rows,state.model);
   if(!o.dimensions.some(x=>x.label===state.dimension))state.dimension=o.dimensions[0]?.label||'';
   if(!o.finishes.some(x=>x.key===state.finish))state.finish=o.finishes[0]?.key||'RAW';
   if(!o.tapHoles)state.holes=false;
   const p=M.findVariant(rows,state.model,state.dimension,state.finish,state.holes);
   if(!M.feetFor(rows,p).some(x=>x.reference===state.feet))state.feet='';
   if(!M.wastesFor(rows,p).some(x=>x.reference===state.waste))state.waste='';
  }
 }
 const categoryCards=()=>M.CATEGORIES.map(x=>'<button type="button" class="recor-cat'+(state.category===x.id?' active':'')+
  '" data-recor-category="'+esc(x.id)+'"><strong>'+esc(x.label)+'</strong><small>'+esc(x.sub)+'</small></button>').join('');
 function modelCards(){
  if(state.category==='Finitions premium')return M.PREMIUM_FINISHES.map(m=>'<button type="button" class="recor-model'+
    (state.model===m.id?' active':'')+'" data-recor-premium="'+esc(m.id)+'">'+
    '<span class="recor-model-visual"><img loading="lazy" src="'+esc(photo(m.id))+'" alt="'+esc(m.original)+
    '" onerror="this.style.visibility=\'hidden\'"></span>'+
    '<span class="recor-model-text"><strong>'+esc(m.label)+'</strong><small>'+esc(m.original)+' · '+esc(m.description)+'</small>'+
    '<b>Sur devis</b></span></button>').join('');
  const models=M.groupByModel(rows,state.category);
  return models.map(x=>{
   const first=x.items[0],bath=isBath(first),p=M.pricedOptions(rows,x.model);
   const cheapest=x.items.length?Math.min(...x.items.map(a=>Number(a.price||0))):null;
   const src=photo(x.model);
   return '<button type="button" class="recor-model'+(state.model===x.model?' active':'')+'" data-recor-model="'+esc(x.model)+'">'+
    '<span class="recor-model-visual">'+(src?'<img loading="lazy" src="'+esc(src)+'" alt="'+esc(x.label)+'" onerror="this.style.visibility=\'hidden\'">':'')+'</span>'+
    '<span class="recor-model-text"><strong>'+esc(x.label)+'</strong><small>'+esc(x.quoteOnly?
      'Présent au catalogue fabricant · prix à confirmer':
      (p.dimensions.length+' dimension(s) · '+p.finishes.length+' finition(s)'))+'</small>'+
    '<b>'+(cheapest===null?'Sur devis':'À partir de '+money(cheapest)+' HT')+'</b></span></button>';
  }).join('');
 }
 const selector=(field,values,selected)=>'<select class="recor-field" data-recor-select="'+field+'">'+
  values.map(x=>'<option value="'+esc(x.value)+'"'+(String(selected)===String(x.value)?' selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select>';
 function detail(){
  const {main,options,foot,waste,allFeet,allWaste}=current();
  if(!main)return unpricedDetail();
  const feetNeeded=includesFeet(main),source=state.media.get(state.model);
  const dim=options.dimensions.map(x=>({label:x.label,value:x.label}));
  const finishes=options.finishes.map(x=>({label:x.label,value:x.key}));
  const selectItem=(items,value,field,empty)=>selector(field,
   [{label:empty,value:''},...items.map(x=>({label:x.designation+' · '+x.finish+' · '+money(x.price)+' HT',value:x.reference}))],value);
  const footThumb=foot?.image||foot?.images?.[0]||'';
  const custom=state.finishMode!=='standard'&&(state.ral||state.material);
  const needsQuote=!!custom||state.antiSlip;
  const sourceURL=source?.productUrl||main.manufacturerUrl||'https://recor.pt/en/';
  const tech=source?.technicalSheetUrl||'';
  const brochure=source?.brochureUrl||'';
  const dimInfo=M.PDF_MODEL_PAGES[state.model];
  return '<div class="recor-configuration">'+
   '<h3>'+esc(M.modelName(state.model))+'</h3><span class="recor-meta">'+esc(main.collection)+' · catalogue Recor 2026</span>'+
   '<div class="recor-preview-box"><canvas class="recor-preview-canvas" width="740" height="510" aria-label="Aperçu de la baignoire"></canvas>'+
   '<div class="recor-foot-overlay">'+(footThumb?'<img src="'+esc(footThumb)+'" alt="Pieds sélectionnés">':'')+
   (foot?'<span>'+esc(foot.designation)+'</span>':'<span>Support à sélectionner</span>')+'</div></div>'+
   '<div class="recor-preview-hint">Simulation visuelle indicative : la teinte et la matière ne constituent pas une photographie fabricant de la finition exacte.</div>'+
   (source?.images?.length>1?'<div class="recor-gallery">'+source.images.slice(0,5).map((img,i)=>'<button type="button" data-recor-photo="'+i+'" class="'+(state.photoIndex===i?'active':'')+'"><img src="/api/recor-model-photo?model='+encodeURIComponent(state.model)+'&index='+i+'" alt="Vue '+(i+1)+'"></button>').join('')+'</div>':'')+
   '<div class="recor-fields">'+
   '<label><span>1. Dimensions</span>'+selector('dimension',dim,state.dimension)+'</label>'+
   '<label><span>2. Finition de base tarifée</span>'+selector('finish',finishes,state.finish)+'</label>'+
   (options.tapHoles?'<label><span>3. Perçages robinetterie</span>'+selector('holes',[{label:'Sans perçage',value:'no'},{label:'Avec perçages',value:'yes'}],state.holes?'yes':'no')+'</label>':'')+
   (feetNeeded?'<label><span>4. Pieds ou socle (obligatoire)</span>'+selectItem(allFeet,state.feet,'feet','Choisir les pieds ou le socle')+'</label>':'')+
   '<label><span>5. Vidage (option)</span>'+selectItem(allWaste,state.waste,'waste','Sans vidage Recor ajouté')+'</label>'+
   '<label><span>6. Finition extérieure personnalisée</span>'+selector('finishMode',[
      {label:'Finition de base du tarif',value:'standard'},
      {label:'Peinture RAL (sur devis si hors tarif)',value:'ral'},
      ...M.METALS.map(m=>({label:m+' · sur devis',value:m}))],state.finishMode)+'</label>'+
   (state.finishMode==='ral'?'<label><span>Référence RAL ou code HEX</span><input class="recor-ral" placeholder="RAL 7016, RAL 9005, #8F8F8F…" value="'+esc(state.ral)+'"></label>'+
    '<label><span>Ajuster la couleur d’aperçu</span><input class="recor-pick-color" type="color" value="'+esc(state.customColor)+'"></label>':
    state.finishMode!=='standard'?'<label><span>Matière / finition de simulation</span><input class="recor-material" placeholder="Cuivre, laiton, inox, bronze…" value="'+esc(state.material||state.finishMode)+'"></label>':'')+
   '<label class="recor-check"><input type="checkbox" data-recor-check="antiSlip" '+(state.antiSlip?'checked':'')+'> Fond antidérapant · sur devis</label>'+
   '</div>'+
   '<div class="recor-price-lines"><div><span>Baignoire · '+esc(main.reference)+'</span><b>'+money(main.price)+' HT</b></div>'+
   (foot?'<div><span>Pieds · '+esc(foot.reference)+'</span><b>'+money(foot.price)+' HT</b></div>':'')+
   (waste?'<div><span>Vidage · '+esc(waste.reference)+'</span><b>'+money(waste.price)+' HT</b></div>':'')+
   ''+
   '<div class="recor-price-total"><b>Total produits HT (hors port fournisseur)</b><strong>'+money(M.selectedTotal(main,foot,waste))+' HT</strong></div>'+
   (needsQuote?'<p class="recor-alert">Option personnalisée : supplément non chiffré par le tarif 2026. Total provisoire hors supplément, à confirmer avant devis définitif.</p>':'')+
   '</div>'+
   '<div class="recor-technical-links">'+
   '<a href="'+esc(sourceURL)+'" rel="noopener noreferrer" target="_blank">Fiche produit Recor</a>'+
   (tech?'<a href="'+esc(tech)+'" rel="noopener noreferrer" target="_blank">Plan technique officiel (PDF)</a>':'')+
   (brochure?'<a href="'+esc(brochure)+'" rel="noopener noreferrer" target="_blank">Brochure officielle (PDF)</a>':'')+
   (dimInfo?'<small>Catalogue produits 2026 : p. '+dimInfo[0]+' · catalogue de plans 2026 : p. '+dimInfo[1]+'</small>':'')+
   '</div>'+
   '<button type="button" class="recor-add-btn"'+(feetNeeded&&!foot?' disabled':'')+'>'+esc(editing?'Mettre à jour la configuration':'Ajouter la configuration au projet')+'</button>'+
   '<p class="recor-error" aria-live="polite"></p>'+
   '</div>';
 }
 function unpricedDetail(){
  const model=state.model,source=state.media.get(model)||{};
  const pages=M.PDF_MODEL_PAGES[model]||[];
  const official=model==='CAMILE'?'https://recor.pt/product/camile-en/':
   model==='SHOWER-TRAYS'?'https://recor.pt/product/shower-trays-en/':'https://recor.pt/en/';
  const sizes=model==='CAMILE'?'154 × 75 × 74 · 170 × 76 × 75 · 181,5 × 76,5 × 77 cm':
   model==='SHOWER-TRAYS'?'72 × 72 × 10 · 80 × 80 × 10 cm':'';
  return '<div class="recor-configuration"><h3>'+esc(M.modelName(model))+'</h3>'+
   '<span class="recor-meta">Modèle du catalogue Recor 2026 · prix non importé</span>'+
   '<div class="recor-preview-box"><canvas class="recor-preview-canvas" width="740" height="510" aria-label="Photo officielle Recor"></canvas></div>'+
   '<p class="recor-warn">Ce modèle est présent dans le catalogue Recor 2026 mais aucune référence tarifée n’est disponible dans Hydropolis. Aucun prix ni référence ne sont créés artificiellement.</p>'+
   '<p>Dimensions constructeur : '+esc(sizes)+'</p>'+
   '<div class="recor-technical-links"><a href="'+esc(source.productUrl||official)+'" rel="noopener noreferrer" target="_blank">Fiche produit officielle</a>'+
   (source.technicalSheetUrl?'<a href="'+esc(source.technicalSheetUrl)+'" rel="noopener noreferrer" target="_blank">Plan technique constructeur (PDF)</a>':'')+
   (pages.length?'<small>Catalogue produits 2026 : p. '+pages[0]+' · plans techniques 2026 : p. '+pages[1]+'</small>':'')+
   '</div><p class="recor-alert">Chiffrage préalable requis avant ajout au devis.</p></div>';
 }
 function premiumDetail(){
  const finish=M.PREMIUM_FINISHES.find(x=>x.id===state.model)||M.PREMIUM_FINISHES[0];
  const source=state.media.get(finish.id)||{};
  const compatible=M.PREMIUM_ELIGIBILITY[finish.id]||[];
  const allowed=compatible.filter(m=>rows.some(p=>p.category==='Bain'&&M.modelCode(p)===m));
  const target=allowed.includes(state.premiumTarget)?state.premiumTarget:(allowed[0]||'');
  state.premiumTarget=target;
  return '<div class="recor-configuration"><h3>'+esc(finish.label)+'</h3>'+
   '<span class="recor-meta">'+esc(finish.original)+' · catalogue Recor 2026, pp. 54–57</span>'+
   '<div class="recor-preview-box"><canvas class="recor-preview-canvas" width="740" height="510" aria-label="Illustration fabricant de la finition premium"></canvas></div>'+
   '<p class="recor-preview-hint">Exemple de finition Recor. Chaque application est soumise à validation fabricant.</p>'+
   '<p>'+esc(finish.description)+'. Supplément et faisabilité sur devis.</p>'+
   (allowed.length?
    '<label class="recor-premium-target"><span>Appliquer à une baignoire compatible</span>'+
      selector('premiumTarget',allowed.map(x=>({value:x,label:M.modelName(x)})),target)+'</label>'+
    '<button type="button" class="recor-apply-premium">Configurer la baignoire avec cette finition</button>':
    '<p class="recor-warn">La brochure ne précise pas les modèles compatibles avec cette finition. Vérification fabricant indispensable.</p>')+
   '<div class="recor-technical-links"><a href="'+esc(source.productUrl||'https://recor.pt/en/')+
    '" rel="noopener noreferrer" target="_blank">Voir la finition sur le site Recor</a></div></div>';
 }
 function standalone(){
  const models=M.groupByModel(rows,state.category);
  const group=models.find(g=>g.model===state.model)||models[0];
  if(!group)return '<p>Aucune référence dans cette catégorie.</p>';
  return '<div class="recor-configuration"><h3>'+esc(group.label)+'</h3><p>Choisir une finition et ajouter l’accessoire séparément au projet.</p>'+
   group.items.map(p=>'<button type="button" class="recor-standalone" data-recor-standalone="'+esc(p.reference)+'">'+
    (p.image?'<img src="'+esc(p.image)+'" alt="">':'')+
    '<span>'+esc(p.designation)+' · '+esc(p.finish)+'</span><b>'+money(p.price)+' HT</b></button>').join('')+'</div>';
 }
 function render(){
  if(state.closed)return;
  ensureState();
  dlg.innerHTML='<header class="recor-top"><div><small>RECOR · FONTE ÉMAILLÉE</small><h2>Configurer Recor</h2><p>Catégorie → modèle → dimensions → pieds → finition → vidage</p></div>'+
   '<button type="button" class="recor-close" aria-label="Fermer">×</button></header>'+
   '<div class="recor-layout"><nav class="recor-sidebar">'+categoryCards()+'</nav>'+
   '<main class="recor-browser"><div class="recor-browser-title"><b>'+esc(state.category)+'</b><small>Références du tarif Recor janvier 2026</small></div>'+
   '<div class="recor-model-grid">'+modelCards()+'</div></main>'+
   '<aside class="recor-detail">'+(DIMCATEGORY.includes(state.category)?detail():premiumDetail())+'</aside></div>';
  renderPreview();
  if(state.model)requestMedia(state.model);
 }
 function close(){state.closed=true;overlay.remove();document.removeEventListener('keydown',onKey)}
 function onKey(e){if(e.key==='Escape')close()}
 function selectionReset(model){
  state.model=model;state.dimension='';state.finish='RAW';state.holes=false;
  state.feet='';state.waste='';state.finishMode='standard';state.ral='';state.material='';
  state.photoIndex=0;render();
 }
 function paintColor(){
  if(state.finishMode==='standard')return null;
  if(state.finishMode==='ral')return M.ralColor(state.ral)||state.customColor;
  const mat=M.materialFromText(state.material||state.finishMode);
  return mat?.color||null;
 }
 async function requestMedia(model){
  if(!model||state.media.has(model))return;
  try{
   const response=await fetch('/api/recor-model-media?model='+encodeURIComponent(model),{credentials:'same-origin'});
   if(!response.ok)throw Error('Fiche fabricant indisponible');
   const m=await response.json();if(!m.ok)throw Error('Média indisponible');
   state.media.set(model,m);
   if(state.model===model&&!state.closed)render();
  }catch(e){
   state.media.set(model,{image:'',images:[],verifiedModel:false});
   if(!state.closed&&state.model===model)renderPreview();
  }
 }
 async function renderPreview(){
  const canvas=dlg.querySelector('.recor-preview-canvas');if(!canvas)return;
  const model=state.model,index=state.photoIndex,ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)return;
  const w=canvas.width,h=canvas.height;ctx.fillStyle='#f8f8f7';ctx.fillRect(0,0,w,h);
  const key=model+'|'+index;
  let image=state.photoObjects.get(key);
  if(!image){
   image=new Image();image.crossOrigin='anonymous';
   state.photoObjects.set(key,image);
   image.onload=()=>{if(!state.closed&&state.model===model&&state.photoIndex===index)renderPreview()};
   image.onerror=()=>{if(!state.closed&&state.model===model)canvas.setAttribute('data-photo-failed','true')};
   image.src='/api/recor-model-photo?model='+encodeURIComponent(model)+'&index='+index;
   return;
  }
  if(!image.complete||!image.naturalWidth)return;
  const scale=Math.min(w/image.naturalWidth,h/image.naturalHeight);
  const pw=image.naturalWidth*scale,ph=image.naturalHeight*scale;
  const dx=(w-pw)/2,dy=(h-ph)/2;
  ctx.drawImage(image,dx,dy,pw,ph);
  const chosen=paintColor();if(!chosen)return;
  // Photograph-based indicative exterior tint. Preserve near-white enamel,
  // the background and the separate accessories; do not claim exact RAL.
  try{
   const source=ctx.getImageData(0,0,w,h);
   const img=source.data,r=parseInt(chosen.slice(1,3),16),g=parseInt(chosen.slice(3,5),16),
    b=parseInt(chosen.slice(5,7),16);
   const x0=Math.max(0,Math.floor(dx)),x1=Math.min(w,Math.ceil(dx+pw));
   const y0=Math.max(0,Math.floor(dy+ph*.36)),y1=Math.min(h,Math.ceil(dy+ph*.83));
   const bgAt=(x,y)=>{const a=(y*w+x)*4;return [img[a],img[a+1],img[a+2]]};
   const corners=[bgAt(x0,Math.max(0,Math.floor(dy+8))),bgAt(Math.max(x0,x1-8),Math.max(0,Math.floor(dy+8)))];
   const bg=corners[0].map((v,i)=>(v+corners[1][i])/2);
   const material=M.materialFromText(state.material||state.finishMode);
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const i=(y*w+x)*4,rr=img[i],gg=img[i+1],bb=img[i+2];
    const light=(rr+gg+bb)/3;
    const difference=Math.hypot(rr-bg[0],gg-bg[1],bb-bg[2]);
    const span=(y-dy)/ph;
    if(difference<32||light>232||span>.82)continue;
    const strength=Math.min(.73,Math.max(0,(difference-25)/145))*(light<95?.86:1);
    if(strength<.03)continue;
    const shine=material?.type==='metal'?Math.sin(x*.035+y*.012)*13:0;
    // Material cues are illustrative only; exact manufacturer texture is not asserted.
    const texture=material?.type==='texture'?(
     /mosa/i.test(material.label)?(((x%31)<2||(y%31)<2)?-38:((Math.floor(x/31)+Math.floor(y/31))%3-1)*19):
     /cuir/i.test(material.label)?Math.sin(x*1.18+y*.73)*Math.cos(y*1.57)*7:
     /rustique/i.test(material.label)?Math.sin(x*.28+y*.49)*Math.cos(x*.67-y*.18)*17:0
    ):0;
    const shade=.55+.5*(light/255);
    img[i]=Math.max(0,Math.min(255,rr*(1-strength)+(r*shade+shine+texture)*strength));
    img[i+1]=Math.max(0,Math.min(255,gg*(1-strength)+(g*shade+shine+texture)*strength));
    img[i+2]=Math.max(0,Math.min(255,bb*(1-strength)+(b*shade+shine+texture)*strength));
   }
   ctx.putImageData(source,0,0);
  }catch(e){
   // Manufacturer thumbnails can be displayed without pixel access if a
   // browser refuses CORS despite same-origin server media.
   console.warn('[Recor simulation couleur]',e.message);
  }
 }
 function capture(){
  const canvas=dlg.querySelector('.recor-preview-canvas');
  try{return canvas&&canvas.toDataURL('image/jpeg',.83)||''}catch{return ''}
 }
 async function confirm(){
  const {main,foot,waste}=current();
  const error=dlg.querySelector('.recor-error');
  if(!main){if(error)error.textContent='Référence tarifée introuvable';return}
  if(includesFeet(main)&&!foot){if(error)error.textContent='Choisissez des pieds ou un socle compatible.';return}
  const configuration={
   model:state.model,dimensions:state.dimension,
   holes:state.holes,baseFinish:state.finish,
   feetReference:foot?.reference||'',wasteReference:waste?.reference||'',
   finishMode:state.finishMode,ral:state.ral,material:state.material,
   previewColor:paintColor(),antiSlip:state.antiSlip,
   pricingPending:state.finishMode!=='standard'||state.antiSlip,
   pricingNote:'Finition personnelle ou antidérapant : supplément non tarifé, prix à confirmer',
   catalogue2026Page:M.PDF_MODEL_PAGES[state.model]?.[0]||null,
   technicalCatalogue2026Page:M.PDF_MODEL_PAGES[state.model]?.[1]||null
  };
  const media=state.media.get(state.model)||{};
  const btn=dlg.querySelector('.recor-add-btn');if(btn)btn.disabled=true;
  try{
   if(typeof args.onAdd!=='function')throw Error('Enregistrement projet Recor non relié');
   await args.onAdd({main,foot,waste,configuration,media,
     preview:paintColor()?capture():'',
     roomId:args.roomId||'',editing});
   close();
  }catch(e){if(error)error.textContent=e.message||'Ajout Recor impossible';if(btn)btn.disabled=false}
 }
 overlay.addEventListener('click',e=>{
  const closeBtn=e.target.closest('.recor-close');
  if(closeBtn){close();return}
  if(e.target===overlay){close();return}
  const cat=e.target.closest('[data-recor-category]');if(cat){
   state.category=cat.dataset.recorCategory;state.model='';state.photoIndex=0;
   state.feet='';state.waste='';state.finishMode='standard';render();return;
  }
  const mod=e.target.closest('[data-recor-model]');if(mod){selectionReset(mod.dataset.recorModel);return}
  const premium=e.target.closest('[data-recor-premium]');if(premium){
   state.model=premium.dataset.recorPremium;state.photoIndex=0;state.finishMode='standard';
   state.premiumTarget='';render();return;
  }
  if(e.target.closest('.recor-apply-premium')){
   const finish=M.PREMIUM_FINISHES.find(x=>x.id===state.model);
   const target=state.premiumTarget;
   if(!finish||!(M.PREMIUM_ELIGIBILITY[finish.id]||[]).includes(target))return;
   const bath=rows.find(x=>x.category==='Bain'&&M.modelCode(x)===target);
   if(!bath)return;
   state.category=bath.collection;
   selectionReset(target);
   const options=M.pricedOptions(rows,target);
   if(options.finishes.some(x=>x.key==='WHITE'))state.finish='WHITE';
   state.finishMode=finish.label;state.material=finish.label;
   render();return;
  }
  const gallery=e.target.closest('[data-recor-photo]');if(gallery){state.photoIndex=Number(gallery.dataset.recorPhoto)||0;render();return}
  const standalone=e.target.closest('[data-recor-standalone]');if(standalone){
   const item=rows.find(x=>x.reference===standalone.dataset.recorStandalone);
   if(item&&args.onStandalone)Promise.resolve(args.onStandalone(item,args.roomId)).then(close).catch(e=>alert(e.message));
   return;
  }
  if(e.target.closest('.recor-add-btn'))confirm();
 });
 overlay.addEventListener('change',e=>{
  const f=e.target.dataset.recorSelect;
  if(f==='dimension'){state.dimension=e.target.value;state.feet='';state.waste='';render()}
  if(f==='finish'){state.finish=e.target.value;render()}
  if(f==='holes'){state.holes=e.target.value==='yes';render()}
  if(f==='feet'){state.feet=e.target.value;render()}
  if(f==='waste'){state.waste=e.target.value;render()}
  if(f==='premiumTarget'){state.premiumTarget=e.target.value;return}
  if(f==='finishMode'){
   state.finishMode=e.target.value;
   if(state.finishMode!=='standard'&&state.finish!=='WHITE'&&M.pricedOptions(rows,state.model).finishes.some(x=>x.key==='WHITE'))
      state.finish='WHITE';
   if(state.finishMode!=='ral'&&state.finishMode!=='standard')state.material=state.finishMode;
   render();
  }
  if(e.target.dataset.recorCheck==='antiSlip'){state.antiSlip=e.target.checked;render()}
  if(e.target.matches('.recor-pick-color')){state.customColor=e.target.value;renderPreview()}
 });
 overlay.addEventListener('input',e=>{
  if(e.target.matches('.recor-ral')){
   state.ral=e.target.value;const known=M.ralColor(state.ral);
   if(known)state.customColor=known;
   const col=dlg.querySelector('.recor-pick-color');if(col)col.value=state.customColor;
   renderPreview();
  }
  if(e.target.matches('.recor-material')){state.material=e.target.value;renderPreview()}
 });
 document.addEventListener('keydown',onKey);
 render();
 return {close,getState:()=>({...state}),current};
}
root.HydroRecorConfigurator={open};
})(window);
