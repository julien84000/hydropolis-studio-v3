/* Hydropolis Naxani 2026 - multi-module vanity + visual basin selection.
 * Uses only exact tariff references. Pictograms are explicitly schematic until PDF crops are imported.
 */
(function(root){
'use strict';
const previous=root.HydroNaxaniConfigurator;
const E=root.HydroNaxaniEnhancements;
if(!previous||!E||!root.HydroNaxani2026)return;
const catalog=root.HydroNaxani2026;
E.annotate(catalog.rows);
root.HydroNaxaniPlanMedia?.apply?.(catalog.rows);
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const euro=n=>Number(n||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const width=p=>E.width(p);
const eq=(a,b)=>Math.abs(Number(a)-Number(b))<.06;
const furniture=p=>['bois-massif','laque'].includes(p?.productType);
const groups=[
 ['Meubles','laque','Laqués'],['Meubles','bois-massif','Bois massif'],['Meubles','complement','Compléments'],
 ['Lavabos','plan-integre','Plans vasque intégrés'],['Lavabos','vasque-poser','Vasques à poser'],
 ['Lavabos','suspendu','Lavabos suspendus'],['Lavabos','tops','Plans de travail']
];
const familyTypes=f=>f==='tops'?['plan-solid','plan-mdf']:[f];
const variant=p=>(p?.naVariant||'Meuble')+(p?.naPrepricedJoin?' · composition 2 caissons':' · 1 caisson');
const photo=p=>E.picture(p);
const img=p=>photo(p)?'<img src="'+esc(photo(p))+'" alt="Photo illustrative '+esc(p.collection)+'" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'"><span class="nax-photo-fallback" style="display:none">Photo indisponible</span>':'<span class="nax-photo-fallback">Photo non disponible · schéma ci-dessous</span>';
const pict=p=>E.pictogram(p);
const topDrawing=p=>p?.productType==='plan-integre'&&root.HydroNaxaniPlanDrawings?.html?.(p.collection)||pict(p);
const topPair=p=>{
 if(p?.productType!=='plan-integre')return pict(p);
 return '<div class="nax-top-pair" data-naxani-paired-model="'+esc(p.collection)+'">'+
  '<div class="nax-top-photo"><span class="nax-media-title">Photo Naxani</span>'+
    (photo(p)?img(p):'<span class="nax-photo-fallback">Photographie de collection à confirmer</span>')+'</div>'+
  '<div class="nax-top-plan"><span class="nax-media-title">Plan technique</span>'+topDrawing(p)+'</div>'+
  '</div>';
};
// Official manufacturer examples, never a promise that the illustrated SKU/width is exact.
const woodGallery={
 'Suró':{
  '31':{
   Honey:'https://naxani.com/wp-content/uploads/2024/11/suro-31-200-honey-1-lav.jpg',
   Smoked:'https://naxani.com/wp-content/uploads/2024/11/suro-31-140-smoked.jpg'
  },
  '64':{Smoked:'https://naxani.com/wp-content/uploads/2024/11/suro-64-160-smoked.jpg'}
 },
 Prenn:{
  '31':{
   Iroko:'https://naxani.com/wp-content/uploads/2024/11/prenn-31-140-iroko.jpg',
   'Érable':'https://naxani.com/wp-content/uploads/2024/11/prenn-31-130-maple.jpg',
   Noyer:'https://naxani.com/wp-content/uploads/2024/11/prenn-31-140-nogal.jpg',
   'Chêne':'https://naxani.com/wp-content/uploads/2024/11/prenn-31-140-roble-marmol.jpg'
  },
  '64':{
   Iroko:'https://naxani.com/wp-content/uploads/2024/11/prenn-64-140-iroko.jpg',
   'Chêne':'https://naxani.com/wp-content/uploads/2024/11/prenn-64-160-roble.jpg'
  }
 },
 Slat:{
  '1C':{
   Frêne:'https://naxani.com/wp-content/uploads/2024/11/Slat_1C_120_fresno-scaled.jpg',
   Iroko:'https://naxani.com/wp-content/uploads/2024/11/slat-1c-160-iroko.jpg',
   'Érable':'https://naxani.com/wp-content/uploads/2024/11/slat-1c-100-maple.jpg',
   Noyer:'https://naxani.com/wp-content/uploads/2024/11/slat-1c-140-nogal.jpg',
   'Chêne':'https://naxani.com/wp-content/uploads/2024/11/slat-1c-140-roble.jpg'
  },
  '2C':{
   Iroko:'https://naxani.com/wp-content/uploads/2024/11/slat-2c-140-iroko.jpg',
   Noyer:'https://naxani.com/wp-content/uploads/2024/11/slat-2c-180-nogal.jpg'
  }
 }
};
const woodPhoto=(p,finish)=>{
 const model=String(p?.naVariant||'').match(/^(\d{2}|1C|2C)/)?.[0]||'';
 return woodGallery[p?.collection]?.[model]?.[finish]||'';
};
function compatible(meuble,plan,data=catalog,composedWidth){
 if(!meuble||!plan||plan.productType!=='plan-integre')return false;
 const total=Number.isFinite(Number(composedWidth))?Number(composedWidth):width(meuble);
 const gap=width(plan)-total;
 const excluded=data.compatibilities?.[norm(meuble.collection)]?.excluded||[];
 return gap>=-.06&&gap<=10.06&&!excluded.some(c=>norm(c)===norm(plan.collection));
}
function open(rows,roomId,onAdd,initial){
 if(!root.document||!Array.isArray(rows)||!rows.length)return Promise.reject(Error('Tarif Naxani indisponible'));
 root.HydroNaxaniFurnitureMedia?.apply?.(rows);
 E.annotate(rows);
 root.HydroNaxaniPlanMedia?.apply?.(rows);
 root.HydroNaxaniWoodFinishes?.annotate?.(rows);
 const byRef=new Map(rows.map(p=>[p.reference,p]));
 let family=familyTypes('bois-massif')[0],collection='',reference='',moduleRefs=[];
 let mode='integrated',basinCount=1,planCollection='',planRef='',topRef='',basinRef='',drainRef='',search='',busy=false;
 if(initial?.manufacturer==='Naxani'){
   family=['plan-solid','plan-mdf'].includes(initial.productType)?'tops':initial.productType||'bois-massif';
   collection=initial.collection||'';reference=initial.reference||'';
   if(['plan-integre','suspendu'].includes(initial.productType))basinCount=Number(initial.naSinkCount||1);
 }
 const prior=document.querySelector('.nax-modal');if(prior)prior.remove();
 const ov=document.createElement('div');ov.className='nax-modal';
 ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Configurateur Naxani');
 ov.innerHTML='<div class="nax-shell"><header class="nax-header"><div><span class="nax-eyebrow">NAXANI · COMPOSITION MODULAIRE</span><h2>Configurer Naxani</h2><p>Collection → caissons → dimensions → plan → 1 ou 2 vasques → accessoires</p></div><button type="button" class="nax-close" aria-label="Fermer">×</button></header><div class="nax-body"><aside class="nax-nav"></aside><main class="nax-catalogue"><div class="nax-toolbar"><strong class="nax-crumb"></strong><input class="nax-search" type="search" placeholder="Collection ou référence"></div><div class="nax-cards"></div></main><section class="nax-detail"></section></div></div>';
 document.body.append(ov);
 const $=q=>ov.querySelector(q),$$=q=>[...ov.querySelectorAll(q)];
 const stopKey=e=>{if(e.key==='Escape')close()};
 const close=()=>{document.removeEventListener('keydown',stopKey);ov.remove()};
 document.addEventListener('keydown',stopKey);
 $('.nax-close').onclick=close;
 const categoryRows=()=>rows.filter(p=>familyTypes(family).includes(p.productType));
 const collectionRows=()=>categoryRows().filter(p=>p.collection===collection);
 const current=()=>byRef.get(reference);
 const resetOptions=()=>{planRef='';topRef='';basinRef='';drainRef='';planCollection=''};
 const beginMain=(ref,preserveCount=false)=>{reference=ref;moduleRefs=[ref];if(!preserveCount)basinCount=1;resetOptions()};
 const basinSelectable=p=>['plan-integre','suspendu'].includes(p?.productType);
 const pricedBasinVariants=p=>collectionRows().filter(x=>x.productType===p.productType&&Number(x.naSinkCount||1)===basinCount);
 const suspendedPair=p=>p?.productType==='suspendu'&&basinCount===2&&!pricedBasinVariants(p).length;
 function selectCollection(){
   if(!collectionRows().length){collection=categoryRows()[0]?.collection||'';reference='';moduleRefs=[];resetOptions()}
   if(!collectionRows().some(p=>p.reference===reference)){
      beginMain(collectionRows()[0]?.reference||'',family==='plan-integre'||family==='suspendu');
   }
   if(!moduleRefs.length)moduleRefs=[reference];
 }
 function option(p,sel){
  const w=width(p),shown=Number.isFinite(w)&&w>0?w.toLocaleString('fr-FR')+' cm · ':'';
  return '<option value="'+esc(p.reference)+'"'+(p.reference===sel?' selected':'')+'>'+esc(p.collection)+' · '+shown+(p.naPosition||p.naWood||'')+' · '+esc(p.reference)+' · '+euro(p.price)+'</option>';
 }
 function selectOptions(items,selected){return items.map(p=>option(p,selected)).join('')}
 function renderNav(){
  $('.nax-nav').innerHTML=['Meubles','Lavabos'].map(t=>'<div class="nax-menu-title">'+t+'</div>'+groups.filter(g=>g[0]===t).map(g=>'<button type="button" data-family="'+g[1]+'" class="'+(family===g[1]?'selected':'')+'">'+g[2]+'</button>').join('')).join('');
  $$('[data-family]').forEach(b=>b.onclick=()=>{family=b.dataset.family;collection='';reference='';moduleRefs=[];search='';resetOptions();render()});
 }
 function renderCards(){
  const needle=norm(search),all=categoryRows(),names=[...new Set(all.map(p=>p.collection))].filter(x=>!needle||norm(x).includes(needle)||all.some(p=>p.collection===x&&p.reference.includes(search)));
  $('.nax-crumb').textContent=groups.find(g=>g[1]===family)?.[2]||family;
  $('.nax-cards').innerHTML=names.map(name=>{
   const variants=all.filter(p=>p.collection===name),sample=variants.find(p=>photo(p))||variants[0],price=Math.min(...variants.map(p=>Number(p.price)).filter(Number.isFinite));
   return '<button type="button" class="nax-card '+(name===collection?'active':'')+'" data-collection="'+esc(name)+'"><div class="nax-card-image">'+(family==='plan-integre'?topPair(sample):img(sample))+'</div><div class="nax-card-picto">'+(family==='plan-integre'?'':pict(sample))+'</div><b>'+esc(name)+'</b><small>'+variants.length+' références du tarif</small><span>Dès '+euro(price)+' HT</span></button>'
  }).join('')||'<p class="nax-empty">Aucune collection trouvée.</p>';
  $$('[data-collection]').forEach(b=>b.onclick=()=>{collection=b.dataset.collection;reference='';moduleRefs=[];resetOptions();render()});
 }
 function topMatch(p,total){const delta=width(p)-total;return delta>=-.06&&delta<=10.06}
 function mainRowsLike(p){return collectionRows().filter(x=>variant(x)===variant(p)&&(!p.naWood||x.naWood===p.naWood));}
 function getModuleRows(p){
  if(p.naPrepricedJoin)return [];
  return collectionRows().filter(x=>!x.naPrepricedJoin&&(!p.naVariant||x.naVariant===p.naVariant)&&(!p.naWood||x.naWood===p.naWood)&&Number.isFinite(width(x))&&width(x)>0);
 }
 function bundle(p){
  if(!furniture(p)){
  const isPair=suspendedPair(p);
  const valid=!basinSelectable(p)||isPair||Number(p.naSinkCount||1)===basinCount;
  const units=isPair?[p,p]:[p];
  const drains=drainRef&&byRef.has(drainRef)?Array.from({length:basinSelectable(p)?basinCount:1},()=>byRef.get(drainRef)):[];
  return {items:[...units,...drains],valid,reason:valid?'':'Aucune référence '+basinCount+' vasque(s) n’est tarifée pour ce modèle. Demander un devis Naxani.',totalWidth:isPair?2*width(p):width(p)};
 }
  const modules=moduleRefs.map(ref=>byRef.get(ref)).filter(Boolean);
  const totalWidth=modules.reduce((s,m)=>s+width(m),0);
  const count=p.naPrepricedJoin?2:modules.length;
  if(modules.length!==moduleRefs.length||!modules.length||(!p.naPrepricedJoin&&modules.some(m=>m.collection!==p.collection||variant(m)!==variant(p)||m.naWood!==p.naWood)))
   return {items:modules,valid:false,reason:'Les caissons doivent appartenir à une configuration cohérente.',totalWidth};
  if(p.collection==='Linjer'&&count>1)return {items:modules,valid:false,reason:'Les meubles Linjer ne peuvent pas être assemblés.',totalWidth};
  if(p.naPrepricedJoin&&modules.length!==1)return {items:modules,valid:false,reason:'Cette référence Bacall correspond déjà à une composition de deux caissons.',totalWidth};
  if(count>1&&totalWidth<=150&&p.collection!=='Bacall'){} // assembly is permitted even below 150 cm
  const plan=mode==='integrated'?byRef.get(planRef):byRef.get(topRef);
  const basin=mode==='separate'?byRef.get(basinRef):null;
  const items=modules.slice();
  if(plan)items.push(plan);
  if(basin)for(let i=0;i<basinCount;i++)items.push(basin);
  if(drainRef&&byRef.has(drainRef))for(let i=0;i<basinCount;i++)items.push(byRef.get(drainRef));
  let reason='';
  if(!Number.isFinite(totalWidth)||totalWidth<=0)reason='Largeur de composition invalide.';
  else if(!plan)reason='Sélectionnez un plan dont la longueur est adaptée aux caissons.';
  else if(!topMatch(plan,totalWidth))reason='Le plan doit couvrir toute la composition, avec un débord conforme au modèle.';
  else if(mode==='integrated'&&(!compatible(p,plan,catalog,totalWidth)||Number(plan.naSinkCount||1)!==basinCount))reason='Plan vasque incompatible avec la collection, la longueur ou le nombre de vasques.';
  else if(mode==='separate'&&(!basin||basin.productType!=='vasque-poser'))reason='Choisissez une vasque à poser.';
  return {items,valid:!reason,reason,totalWidth,count,planWidth:plan?width(plan):null};
 }
 function visual(p){
  const exactFinishPhoto=woodPhoto(p,p?.naWood);
  const illustration=exactFinishPhoto?{...p,image:exactFinishPhoto}:p;
  const note=exactFinishPhoto?'Photo fabricant illustrant l’essence ou la teinte '+esc(p.naWood)+' (dimensions non contractuelles).':
   (p?.naWood?'Photo de collection, pas nécessairement la finition '+esc(p.naWood)+'.':'Photo de collection illustrative, finition non contractuelle.');
  if(p.productType==='plan-integre')
   return '<div class="nax-standalone-top">'+topPair(p)+'</div><div class="nax-photonote">Photo de collection illustrative et dessin technique issu du tarif Naxani 2026. Nombre de vasques et dimensions selon référence.</div>';
  return '<div class="nax-mainphoto">'+img(illustration)+'</div><div class="nax-picto-main">'+pict(p)+'</div><div class="nax-photonote">'+note+' Pictogramme schématique.</div>';
 }
 function renderDetail(){
   const p=current();
   if(!p){$('.nax-detail').innerHTML='<p class="nax-empty">Choisissez une collection.</p>';return}
   const variants=collectionRows(),kinds=[...new Set(variants.map(variant))],woods=[...new Set(variants.filter(x=>variant(x)===variant(p)).map(x=>x.naWood).filter(Boolean))];
   const alternatives=basinSelectable(p)?mainRowsLike(p).filter(x=>suspendedPair(p)||Number(x.naSinkCount||1)===basinCount):mainRowsLike(p);
   const widths=[...new Set(alternatives.map(width).filter(n=>Number.isFinite(n)&&n>0))].sort((a,b)=>a-b);
   let html=visual(p)+'<span class="nax-eyebrow">'+esc(groups.find(g=>g[1]===family)?.[2]||'')+'</span><h3>'+esc(collection)+'</h3>';
   if(kinds.length>1)html+='<label>Type de caisson / composition<select data-input="variant">'+kinds.map(x=>'<option value="'+esc(x)+'"'+(x===variant(p)?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label>';
   if(woods.length){
     const finishType=p.naFinishType==='teinte'?'Teinte du bois':p.naFinishType==='finition'?'Finition du meuble':p.naFinishType==='non-precise'?'Essence non précisée':'Essence du bois';
     html+='<div class="nax-wood-group"><label>'+finishType+'<select data-input="wood" '+(woods.length===1?'disabled':'')+'>'+woods.map(x=>'<option value="'+esc(x)+'"'+(p.naWood===x?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label>';
     if(woods.length>1){
       const sameVariant=variants.filter(x=>variant(x)===variant(p));
       html+='<div class="nax-wood-hint">'+(p.naFinishType==='teinte'?'Ces choix sont des teintes du bois, et non des essences différentes.':'Choisissez une essence pour afficher les références et prix correspondants.')+'</div>'+
        '<div class="nax-wood-options" role="group" aria-label="'+finishType+'">'+woods.map(wood=>{
         const found=sameVariant.filter(x=>x.naWood===wood);
         const atWidth=found.find(x=>eq(width(x),width(p)))||found[0];
         const example=woodPhoto(p,wood);
         const selected=wood===p.naWood;
         return '<button type="button" class="nax-wood-choice '+(selected?'active':'')+'" data-wood-finish="'+esc(wood)+'" aria-pressed="'+selected+'" aria-label="Choisir '+esc(wood)+'">'+
           (example?'<img loading="lazy" src="'+esc(example)+'" alt="Exemple fabricant '+esc(wood)+'" onerror="this.style.display=\'none\'">':'<span class="nax-wood-no-photo">Visuel de finition non disponible</span>')+
           '<b>'+esc(wood)+'</b>'+(atWidth?'<small>À '+Number(width(atWidth)).toLocaleString('fr-FR')+' cm : '+euro(atWidth.price)+' HT</small>':'')+
           (selected?'<span class="nax-wood-selected">✓ Choisi</span>':'')+'</button>';
        }).join('')+'</div>';
     }
     html+='</div>';
   }
   if(basinSelectable(p)){
    const exactDoubles=collectionRows().filter(x=>Number(x.naSinkCount||1)===2);
    const pair=suspendedPair(p);
    const forCount=collectionRows().filter(x=>pair||Number(x.naSinkCount||1)===basinCount);
    html+='<div class="nax-plan-count"><label>Nombre de vasques du plan<select data-input="standaloneSinkCount">'+
      '<option value="1"'+(basinCount===1?' selected':'')+'>1 vasque</option>'+
      '<option value="2"'+(basinCount===2?' selected':'')+'>2 vasques</option></select></label>'+
      '<small>'+(pair?'Deux lavabos suspendus indépendants : 2 références identiques, largeur totale indicative '+(2*width(p)).toLocaleString('fr-FR')+' cm. Pas un plan monobloc double vasque.':forCount.length+' références '+(basinCount===2?'double vasque':'simple vasque')+' tarifées pour '+esc(collection))+'</small></div>';
    if(forCount.length)html+='<div class="nax-plan-variants nax-standalone-variants" role="group" aria-label="Dimensions et références du plan">'+
      forCount.map(x=>'<button type="button" class="nax-plan-variant '+(reference===x.reference?'active':'')+
       '" data-standalone-plan-ref="'+esc(x.reference)+'" aria-pressed="'+(reference===x.reference)+'">'+
       '<div class="nax-plan-variant-pict">'+topDrawing(x)+'</div><b>'+width(x).toLocaleString('fr-FR')+' cm</b>'+
       '<small>'+esc(x.naPosition||'')+'</small><small>Réf. '+esc(x.reference)+'</small><strong>'+euro(x.price)+' HT</strong></button>').join('')+'</div>';
    else html+='<p class="nax-warning">Double vasque '+esc(collection)+' : aucune référence et aucun prix confirmés dans le tarif 2026. Consultation Naxani nécessaire.</p>';
   }
   if(widths.length)html+='<label>Largeur du module / assemblage<select data-input="width">'+widths.map(w=>'<option value="'+w+'"'+(eq(w,width(p))?' selected':'')+'>'+w.toLocaleString('fr-FR')+' cm</option>').join('')+'</select></label>';
   html+='<label>Référence tarifée'+(p.naWood?' — '+esc(p.naWood):'')+'<select data-input="reference">'+selectOptions(alternatives.filter(x=>eq(width(x),width(p))),reference)+'</select></label>'+
     '<p class="nax-supplier">Référence '+esc(p.reference)+' · '+euro(p.price)+' HT · tarif PDF p. '+(p.sourcePage||'?')+'</p>';
   if(furniture(p)){
    const mods=getModuleRows(p),count=p.naPrepricedJoin?2:moduleRefs.length,total=moduleRefs.reduce((s,r)=>s+width(byRef.get(r)),0);
    html+='<div class="nax-assembly"><h4>1. Composer les caissons</h4>';
    if(p.naPrepricedJoin){
      const combos=collectionRows().filter(x=>x.naPrepricedJoin&&x.naVariant===p.naVariant&&x.naWood===p.naWood&&Array.isArray(x.naModules)&&eq(width(x),width(p)));
      html+='<div class="nax-combo-title">'+combos.length+' composition'+(combos.length>1?'s':'')+' disponible'+(combos.length>1?'s':'')+' pour '+Number(width(p)).toLocaleString('fr-FR')+' cm. Cliquer sur un pictogramme pour choisir les caissons gauche et droit.</div><div class="nax-combo-grid">'+combos.map(x=>{
       const left=x.naModules[0],right=x.naModules[1],chosen=x.reference===p.reference;
       const number=n=>Number(n).toLocaleString('fr-FR');
       return '<button type="button" class="nax-combo-item '+(chosen?'active':'')+'" data-bacall-combo="'+esc(x.reference)+'" aria-pressed="'+chosen+'" aria-label="Choisir Bacall '+esc(p.naVariant)+' '+number(left)+' cm à gauche plus '+number(right)+' cm à droite, référence '+esc(x.reference)+', '+euro(x.price)+' HT">'+
       '<div class="nax-combo-picto">'+pict(x)+'</div><strong>'+number(left)+' cm <span>+</span> '+number(right)+' cm</strong>'+
       '<small>Gauche '+number(left)+' · droite '+number(right)+'</small>'+
       '<b>Total '+number(width(x))+' cm</b><small>Réf. '+esc(x.reference)+'</small><em>'+euro(x.price)+' HT</em></button>'
      }).join('')+'</div>';
      html+='<div class="nax-module-fixed"><b>Bacall '+esc(p.naVariant)+' · deux caissons tarifés ensemble</b><small>Caisson gauche '+Number(p.naModules?.[0]).toLocaleString('fr-FR')+' cm · caisson droit '+Number(p.naModules?.[1]).toLocaleString('fr-FR')+' cm</small></div>';
    }else{
      moduleRefs.forEach((r,i)=>{
       const q=byRef.get(r);
       html+='<div class="nax-module-line"><div class="nax-mini-picto">'+pict(q)+'</div><label>Caisson '+(i+1)+'<select data-module="'+i+'" '+(i===0?'disabled':'')+'>'+selectOptions(mods,r)+'</select></label>'+(i?'<button type="button" data-remove-module="'+i+'" aria-label="Supprimer le caisson '+(i+1)+'">×</button>':'')+'</div>';
      });
      if(collection!=='Linjer'&&moduleRefs.length<4)html+='<button class="nax-plus-module" type="button">+ Ajouter un caisson</button>';
    }
    html+='<div class="nax-total-width">'+count+' caisson'+(count>1?'s':'')+' · largeur totale : <b>'+total.toLocaleString('fr-FR')+' cm</b></div>';
    if(count>1)html+='<small class="nax-detail-note">Assemblage de modules à mentionner sur la commande fabricant. Certaines collections ont des compositions déjà tarifées : choisir la variante correspondante ci-dessus.</small>';
    html+='</div>';
    // Filter on exact corrected widths, known 2026 references and manufacturer exclusions.
    const integrated=rows.filter(x=>x.productType==='plan-integre'&&Number(x.naSinkCount||1)===basinCount&&topMatch(x,total)&&compatible(p,x,catalog,total));
    // Keep every compatible model visible so a collection does not disappear when
    // its DOUBLE variant is unpriced or unavailable at the chosen width.
    const allIntegratedModels=[...new Map(rows.filter(x=>x.productType==='plan-integre'&&
      !(catalog.compatibilities?.[norm(p.collection)]?.excluded||[]).some(y=>norm(y)===norm(x.collection)))
      .map(x=>[x.collection,x])).values()];
    const worktops=rows.filter(x=>['plan-solid','plan-mdf'].includes(x.productType)&&topMatch(x,total));
    const basinRows=rows.filter(x=>x.productType==='vasque-poser');
    const plans=mode==='integrated'?integrated:worktops;
    if(!plans.some(x=>x.reference===(mode==='integrated'?planRef:topRef))){if(mode==='integrated')planRef=plans[0]?.reference||'';else topRef=plans[0]?.reference||''}
    if(!planCollection||!(mode==='integrated'?allIntegratedModels:plans).some(x=>x.collection===planCollection))
      planCollection=plans[0]?.collection||allIntegratedModels[0]?.collection||'';
    const chosenPlan=plans.filter(x=>x.collection===planCollection);
    if(!chosenPlan.some(x=>x.reference===(mode==='integrated'?planRef:topRef))){
     if(mode==='integrated')planRef=chosenPlan[0]?.reference||'';else topRef=chosenPlan[0]?.reference||'';
    }
    if(!basinRows.some(x=>x.reference===basinRef))basinRef=basinRows[0]?.reference||'';
    html+='<div class="nax-assembly"><h4>2. Choisir le plan et les vasques</h4><div class="nax-modes"><button type="button" data-mode="integrated" class="'+(mode==='integrated'?'active':'')+'">Plan vasque intégré</button><button type="button" data-mode="separate" class="'+(mode==='separate'?'active':'')+'">Plan + vasque à poser</button></div>';
    html+='<label>Nombre de vasques<select data-input="basinCount"><option value="1"'+(basinCount===1?' selected':'')+'>1 vasque</option><option value="2"'+(basinCount===2?' selected':'')+'>2 vasques</option></select></label>';
    // Each family pictogram is an actionable model selector. The second level shows
    // exact tariffed widths / positions as clickable pictograms too.
    const activePlanRef=mode==='integrated'?planRef:topRef;
    html+='<div class="nax-plan-hint">Sélectionnez un modèle en cliquant sur son pictogramme :</div>'+
     '<div class="nax-plan-cards" role="group" aria-label="Modèles de plans vasques">'+
    (mode==='integrated'?allIntegratedModels:[...new Map(plans.map(x=>[x.collection,x])).values()]).map(sample=>{
      const name=sample.collection,selected=name===planCollection;
      const available=plans.filter(x=>x.collection===name).length;
      return '<button type="button" class="nax-plan-card '+(selected?'active':'')+'" data-plan-collection="'+esc(name)+'" aria-pressed="'+selected+'" aria-label="Choisir le plan '+esc(name)+'">'+
       '<div class="nax-plan-pict">'+(mode==='integrated'?topPair(sample):pict(sample))+'</div><span>'+esc(name)+'</span>'+
       (mode==='integrated'&&basinCount===2&&!available?'<small>Double vasque : sur devis</small>':
        '<small>'+available+' référence'+(available>1?'s':'')+' tarifée'+(available>1?'s':'')+'</small>')+
       (selected?'<strong class="nax-plan-check">✓ Sélectionné</strong>':'')+'</button>';
    }).join('')+'</div>';
    if(chosenPlan.length){
      html+='<div class="nax-plan-hint">Choisissez la dimension et la position des vasques :</div>'+
       '<div class="nax-plan-variants" role="group" aria-label="Références et dimensions de '+esc(planCollection)+'">'+chosenPlan.map(x=>{
        const selected=x.reference===activePlanRef;
        return '<button type="button" class="nax-plan-variant '+(selected?'active':'')+'" data-plan-ref="'+esc(x.reference)+'" aria-pressed="'+selected+'" aria-label="'+esc(planCollection)+' '+width(x).toLocaleString('fr-FR')+' cm '+esc(x.naPosition||'')+' référence '+esc(x.reference)+'">'+
         '<div class="nax-plan-variant-pict">'+(mode==='integrated'?topPair(x):pict(x))+'</div><b>'+width(x).toLocaleString('fr-FR')+' cm</b>'+
         (mode==='integrated'?'<small>'+esc(x.naPosition|| (Number(x.naSinkCount||1)===2?'Double vasque':'Simple vasque'))+'</small>':'')+
         '<small>Réf. '+esc(x.reference)+'</small><strong>'+euro(x.price)+' HT</strong>'+
         (selected?'<span class="nax-plan-check">✓ Sélectionné</span>':'')+'</button>';
       }).join('')+'</div>';
      html+='<label>Référence du plan sélectionné<select data-input="plan">'+selectOptions(chosenPlan,activePlanRef)+'</select></label>';
    }else html+='<p class="nax-warning">'+
     (mode==='integrated'&&basinCount===2?'Double vasque '+esc(planCollection||'')+' : pas de référence et de prix public confirmés pour '+total.toLocaleString('fr-FR')+' cm dans le tarif Naxani 2026. Configuration sur devis fabricant ; vous pouvez également sélectionner un plan de travail avec 2 vasques à poser.':
      'Aucune référence tarifée compatible à cette longueur dans le tarif importé.')+'</p>';
    const displayPlan=byRef.get(mode==='integrated'?planRef:topRef);
    if(displayPlan)html+='<div class="nax-selected-plan">'+(mode==='integrated'?topPair(displayPlan):pict(displayPlan))+(mode==='integrated'?'':'<div>'+img(displayPlan)+'</div>')+'<small>Plan '+width(displayPlan).toLocaleString('fr-FR')+' cm · caissons '+total.toLocaleString('fr-FR')+' cm · débord total : '+(width(displayPlan)-total).toLocaleString('fr-FR')+' cm</small></div>';
    if(mode==='separate'){
     const selectedBasin=byRef.get(basinRef);
     const basinModels=[...new Map(basinRows.map(x=>[x.collection,x])).values()];
     html+='<div class="nax-plan-hint">Vasque à poser — cliquez sur la photo du modèle :</div><div class="nax-countertop-grid" role="group" aria-label="Vasques à poser Naxani">'+
      basinModels.map(x=>{
       const chosen=x.collection===selectedBasin?.collection;
       const hasPhoto=!!photo(x);
       return '<button type="button" data-countertop-basin="'+esc(x.reference)+'" class="nax-countertop-card '+(chosen?'active':'')+'" aria-pressed="'+chosen+'" aria-label="Choisir la vasque à poser '+esc(x.collection)+'">'+
        '<div class="nax-countertop-photo">'+(hasPhoto?img(x):pict(x))+'</div><b>'+esc(x.collection)+'</b>'+
        '<small>'+(hasPhoto?'Photo fabricant Naxani':'Photo fabricant non disponible')+'</small>'+
        (chosen?'<strong class="nax-plan-check">✓ Sélectionnée</strong>':'')+'</button>';
      }).join('')+'</div>';
     if(selectedBasin){
      const variants=basinRows.filter(x=>x.collection===selectedBasin.collection);
      html+='<label>Référence de '+esc(selectedBasin.collection)+'<select data-input="basin">'+selectOptions(variants,basinRef)+'</select></label>';
      const images=(selectedBasin.images||[]).filter((u,i,a)=>typeof u==='string'&&a.indexOf(u)===i).slice(0,4);
      if(images.length)html+='<div class="nax-countertop-gallery" aria-label="Photos officielles de la vasque '+esc(selectedBasin.collection)+'">'+images.map((u,i)=>
       '<img loading="lazy" src="'+esc(u)+'" alt="'+esc(selectedBasin.collection)+' · photo fabricant '+(i+1)+'" onerror="this.style.display=\'none\'">').join('')+'</div><small class="nax-detail-note">Photos du modèle Naxani ; finition ou dimensions illustratives.</small>';
     }
    }
    html+='<small class="nax-detail-note">Le débord du plan dépend du modèle Naxani. Vérifier le plan technique avant commande, notamment pour les dimensions sur mesure.</small></div>';
   }
   if(furniture(p)||['plan-integre','vasque-poser','suspendu'].includes(p.productType)){
    const drains=rows.filter(x=>x.productType==='bonde');
    html+='<label>Bonde (optionnelle, selon nombre de vasques)<select data-input="drain"><option value="">Sans bonde</option>'+selectOptions(drains,drainRef)+'</select></label>';
   }
   const b=bundle(p),sum=b.items.reduce((s,x)=>s+Number(x.price),0);
   html+='<div class="nax-totals"><strong>3. Composition et tarif HT</strong>'+b.items.map(x=>'<div><span>'+esc(x.collection)+' '+esc(x.reference)+'</span><b>'+euro(x.price)+'</b></div>').join('')+
    '<div class="nax-grand"><span>Total public HT</span><b>'+euro(sum)+'</b></div><small>Tarifs 2026 par références exactes. Remise fournisseur Naxani non renseignée.</small></div>'+
    (b.reason?'<div class="nax-warning">'+esc(b.reason)+'</div>':'')+
    '<button type="button" class="nax-add" '+(!b.valid||busy?'disabled':'')+'>'+(busy?'Enregistrement…':'Ajouter la composition au projet')+'</button>';
   const detailPanel=$('.nax-detail'),detailScroll=detailPanel.scrollTop;
   detailPanel.innerHTML=html;
   detailPanel.scrollTop=detailScroll;
   $$('[data-input]').forEach(el=>el.onchange=()=>{
    const k=el.dataset.input,v=el.value;
    if(['variant','wood','width','reference'].includes(k)){
      let possible=collectionRows();
      if(basinSelectable(p))possible=possible.filter(x=>suspendedPair(p)||Number(x.naSinkCount||1)===basinCount);
      if(k==='variant'){const matching=possible.filter(x=>variant(x)===v);possible=matching.filter(x=>!p.naWood||x.naWood===p.naWood);if(!possible.length)possible=matching;}
      if(k==='wood')possible=possible.filter(x=>variant(x)===variant(p)&&x.naWood===v);
      if(k==='width')possible=possible.filter(x=>variant(x)===variant(p)&&(!p.naWood||x.naWood===p.naWood)&&eq(width(x),Number(v)));
      const next=k==='reference'?v:(possible.find(x=>eq(width(x),width(p)))||possible[0])?.reference;
      if(next)beginMain(next,basinSelectable(p));
    }
    if(k==='standaloneSinkCount'){
      basinCount=Number(v);
      const exact=collectionRows().filter(x=>x.productType===p.productType&&Number(x.naSinkCount||1)===basinCount);
      const choices=exact.length?exact:(p.productType==='suspendu'?collectionRows().filter(x=>x.productType==='suspendu'&&Number(x.naSinkCount||1)===1):[]);
      const chosen=choices.find(x=>eq(width(x),width(p)))||choices[0];
      if(chosen)beginMain(chosen.reference,true);
    }
    if(k==='basinCount'){basinCount=Number(v);planRef='';planCollection=''}
    if(k==='plan'){if(mode==='integrated')planRef=v;else topRef=v}
    if(k==='basin')basinRef=v;
    if(k==='drain')drainRef=v;
    render(false);
   });
   $$('[data-standalone-plan-ref]').forEach(el=>el.onclick=()=>{beginMain(el.dataset.standalonePlanRef,true);render(false)});
   $$('[data-bacall-combo]').forEach(el=>el.onclick=()=>{beginMain(el.dataset.bacallCombo);render(false)});
   $$('[data-module]').forEach(el=>el.onchange=()=>{moduleRefs[Number(el.dataset.module)]=el.value;resetOptions();render(false)});
   $$('[data-remove-module]').forEach(el=>el.onclick=()=>{moduleRefs.splice(Number(el.dataset.removeModule),1);resetOptions();render(false)});
   $('.nax-plus-module')?.addEventListener('click',()=>{const available=getModuleRows(p);if(available.length&&moduleRefs.length<4){moduleRefs.push(available[0].reference);resetOptions();render(false)}});
   // Delegate clicks to the actual plan buttons, including taps directly on SVG paths.
   $('.nax-detail').onclick=event=>{
     const woodCard=event.target.closest('button[data-wood-finish]');
     if(woodCard){
       const finish=woodCard.dataset.woodFinish;
       if(finish!==p.naWood){
         const matching=collectionRows().filter(x=>variant(x)===variant(p)&&x.naWood===finish);
         const next=(matching.find(x=>eq(width(x),width(p)))||matching[0])?.reference;
         if(next){beginMain(next);render(false);}
       }
       return;
     }
     const card=event.target.closest('button[data-plan-collection]');
     if(card){
       const chosen=card.dataset.planCollection;
       if(chosen!==planCollection){planCollection=chosen;planRef='';topRef='';render(false);}
       return;
     }
     const basinCard=event.target.closest('button[data-countertop-basin]');
     if(basinCard){
       const newRef=basinCard.dataset.countertopBasin;
       if(newRef!==basinRef){basinRef=newRef;render(false);}
       return;
     }
     const option=event.target.closest('button[data-plan-ref]');
     if(option){
       const ref=option.dataset.planRef;
       if(mode==='integrated'){if(ref!==planRef){planRef=ref;render(false);}}
       else if(ref!==topRef){topRef=ref;render(false);}
     }
   };
   $$('[data-mode]').forEach(el=>el.onclick=()=>{mode=el.dataset.mode;planCollection='';planRef='';topRef='';render(false)});
   $('.nax-add').onclick=async()=>{
    if(busy||!b.valid)return;
    busy=true;$('.nax-add').disabled=true;
    try{
     const chosen={...p,naxaniAssembly:{
       references:b.items.map(x=>x.reference),moduleRefs:furniture(p)?moduleRefs.slice():[],
       mode:furniture(p)?mode:'standalone',basinCount:furniture(p)?basinCount:Number(p.naSinkCount||1),
       totalWidth:b.totalWidth,planWidth:b.planWidth,total:sum,
       woodFinish:p.naWood||null,woodFinishType:p.naFinishType||'essence',cabinetType:p.naVariant||null,
       source:'Tarif officiel Naxani 2026',
       drawingStatus:'Photo de collection et dessin fabricant Naxani 2026 (forme indicative)',
       planMedia:(()=>{const selected=furniture(p)?byRef.get(mode==='integrated'?planRef:topRef):p;
        const media=selected?.productType==='plan-integre'?root.HydroNaxaniPlanMedia?.get?.(selected.collection):null;
        return media?{model:selected.collection,reference:selected.reference,photo:media.image,drawingUrl:media.drawingUrl,sourceUrl:media.sourceUrl,scope:media.scope}:null;
       })()
     }};
     await onAdd(chosen,roomId);close();
    }catch(err){busy=false;render(false);root.alert('Naxani : '+(err?.message||err))}
   };
 }
 function render(reset=true){
  selectCollection();renderNav();renderCards();renderDetail();
  $('.nax-search').value=reset?'':search;
  $('.nax-search').oninput=e=>{search=e.target.value;renderCards()};
 }
 render();
 return Promise.resolve(true);
}
previous.open=open;
previous.compatible=compatible;
if(root.HydroManufacturerGuide){
 const guide=root.HydroManufacturerGuide,prior=guide.open;
 guide.open=(brand,rows,roomId,onAdd)=>brand==='Naxani'?open(rows,roomId,onAdd):prior(brand,rows,roomId,onAdd);
}
root.HydroNaxaniModular={version:1,open,compatible};
})(typeof window!=='undefined'?window:globalThis);
