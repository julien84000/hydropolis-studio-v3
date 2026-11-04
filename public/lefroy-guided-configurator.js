/* Hydropolis Studio — Lefroy Brooks official guided ceramic and WC configurator.
   Lists/manufacturer photographs are sourced from the official UK Lefroy Brooks site;
   all price calculations come from the pre-existing local 2026 EUR catalogue. */
(function(root){
'use strict';
const model=root.HydroLefroyGuidedData;
if(!model)return;
const IMAGE_INDEX=['lefroy-official-basin-sets-01.json','lefroy-official-basin-sets-02.json','lefroy-official-basin-sets-03.json','lefroy-official-wc-sets.json','lefroy-official-bidet-items.json'];
const VALID_IMAGE=/^https:\/\/images\.squarespace-cdn\.com\/content\/v1\/[a-zA-Z0-9/_.%-]+$/i;
const VALID_DOC=/^https:\/\/uk\.lefroybrooks\.com\/s\/[a-zA-Z0-9/_.%-]+\.pdf(?:\?.*)?$/i;
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euros=n=>Number(n).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
let media={},mediaJob=null,modal=null;
function loadMedia(){
 if(mediaJob)return mediaJob;
 mediaJob=Promise.all(IMAGE_INDEX.map(async path=>{
   try{
     const r=await fetch('/'+path,{cache:'force-cache'});
     if(!r.ok)throw Error('HTTP '+r.status);
     return (await r.json()).records||{};
   }catch(err){console.warn('[Lefroy photos]',path,err.message);return {};}
 })).then(chunks=>{media=Object.assign({},...chunks);return media;});
 return mediaJob;
}
function rows(){
 try{return typeof catalogIndex!=='undefined'?catalogIndex.maker('Lefroy Brooks'):[];}
 catch{return [];}
}
function firstAvailable(set,products){
 return (set.basins||[]).find(base=>model.variants(products,base).length)||set.basins?.[0]||'';
}
function getSet(slug){return model.ALL.find(s=>s.slug===slug)||null;}
function indexFor(set){return media[set?.slug]||null;}
function productCode(base){return String(base||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
function fileName(item){return String(item?.label||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
function bestImage(set,chosen){
 const group=indexFor(set);
 if(!group||!group.images?.length)return null;
 const main=productCode(chosen.basin||set.bowl||set.basins?.[0]||'');
 const support=productCode(set.support||set.tank||'');
 const seat=productCode(chosen.seat||'');
 const finish=String(chosen.finish||'').toUpperCase();
 const scored=group.images.filter(x=>VALID_IMAGE.test(x.url)).map(x=>{
   const n=fileName(x),matchMain=!!main&&n.includes(main),matchSupport=!!support&&n.includes(support);
   const matchSeat=!!seat&&n.includes(seat.replace(/BL$/,'').replace(/WH$/,''));
   const matchFinish=!!finish&&new RegExp(finish+'(?:JPG|JPEG|PNG|WEBP)$').test(n);
   const sc=(matchMain?100:0)+(matchSupport?90:0)+(matchSeat?25:0)+(matchFinish?15:0)
     -(/WEB|COLLECTION|DETAIL/.test(n)?10:0);
   return {src:x.url,label:x.label,score:sc,matchMain,matchSupport,matchSeat,matchFinish};
 }).sort((a,b)=>b.score-a.score);
 const found=scored[0];
 if(!found)return null;
 const exact=found.matchMain&&(!support||found.matchSupport)&&(!seat||found.matchSeat)&&(!finish||found.matchFinish);
 return {...found,exact,scope:exact?'Photo officielle de la composition et finition':'Photographie officielle · variante illustrée non contractuelle'};
}
function sheetFor(set,choices){
 const docs=(indexFor(set)?.docs||[]).filter(url=>VALID_DOC.test(url));
 const main=productCode(choices.basin||set.bowl||set.basins?.[0]||'');
 const support=productCode(set.support||set.tank||'');
 const ranked=docs.map(url=>{
   const n=productCode(decodeURIComponent(url.split('/').pop()));
   return {url,score:(main&&n.includes(main)?10:0)+(support&&n.includes(support)?5:0)};
 }).sort((a,b)=>b.score-a.score);
 return ranked[0]&&ranked[0].score>=10?ranked[0].url:'';
}
function safeElement(html){const template=document.createElement('template');template.innerHTML=html;return template.content;}
function setOptions(items,selected){
 return items.map(([val,label,disabled])=>'<option value="'+e(val)+'"'+(val===selected?' selected':'')+(disabled?' disabled':'')+'>'+e(label)+'</option>').join('');
}
function inputLine(name,label,options,selected,hint){
 return '<label class="lf-field"><span>'+e(label)+'</span><select data-lf="'+e(name)+'">'+setOptions(options,selected)+'</select>'+(hint?'<small>'+e(hint)+'</small>':'')+'</label>';
}
function namesForComponents(bases,products,includeNone){
 const options=includeNone?[['','Aucun · à définir séparément',false]]:[];
 for(const base of bases){
   const candidates=model.variants(products,base);
   const p=candidates.find(x=>model.metalCode(x)==='CP')||candidates[0];
   const name=p?.designation||base;
   options.push([base,name+' · '+base+(p?'':' · tarif 2026 absent'),!p]);
 }
 return options;
}
function pickDefault(set,products){
 return {basin:firstAvailable(set,products),finish:'CP',seat:set.seats?.[0]||'',lever:set.levers?.[0]||'',
   chain:set.chains?.[0]||'',brackets:set.brackets?.[0]||'',waste:'',trap:'',extension:false,mounting:false,rod:''};
}
function open(initial,roomId){
 if(modal)modal.remove();
 const products=rows();
 if(!products.length){alert('Chargement du tarif Lefroy Brooks en cours : réessayez après chargement du catalogue.');return;}
 const starting=model.initialSet(initial)||model.BASINS[0];
 const state={kind:starting.type,collection:starting.collection,slug:starting.slug,
   choice:pickDefault(starting,products),roomId:roomId||document.querySelector('#targetRoom')?.value||''};
 const el=document.createElement('div');
 el.className='lf-overlay';el.id='lefroyGuidedOverlay';
 el.addEventListener('click',ev=>{if(ev.target===el)close();});
 document.body.appendChild(el);modal=el;
 function close(){el.remove();if(modal===el)modal=null;document.removeEventListener('keydown',escapeKey);}
 function escapeKey(ev){if(ev.key==='Escape')close();}
 document.addEventListener('keydown',escapeKey);
 function current(){return getSet(state.slug);}
 function resetSet(slug){
   const set=getSet(slug);if(!set)return;
   state.slug=slug;state.collection=set.collection;state.kind=set.type;state.choice=pickDefault(set,products);
 }
 function selectChanges(){
   el.querySelectorAll('[data-lf]').forEach(control=>{
     control.addEventListener('change',()=>{
       const key=control.getAttribute('data-lf');
       if(key==='kind'){
         state.kind=control.value;
         const first=model.group(state.kind)[0];resetSet(first.slug);
       }else if(key==='collection'){
         state.collection=control.value;
         const first=model.group(state.kind).find(s=>s.collection===control.value);if(first)resetSet(first.slug);
       }else{
         state.choice[key]=(control.type==='checkbox'?control.checked:control.value);
         if(key==='waste'&&!['FR1383','LB1383'].includes(state.choice.waste))state.choice.rod='';
         if(key==='trap'&&state.choice.trap!=='LB1302')state.choice.extension=false;
       }
       render();
     });
   });
   el.querySelectorAll('[data-lf-set]').forEach(btn=>{
     btn.addEventListener('click',()=>{resetSet(btn.dataset.lfSet);render();});
   });
   el.querySelector('.lf-close')?.addEventListener('click',close);
   el.querySelector('.lf-cancel')?.addEventListener('click',close);
   el.querySelector('.lf-confirm')?.addEventListener('click',commit);
 }
 function render(){
   const set=current();if(!set)return;
   const choices=state.choice;
   const currentCollections=[...new Set(model.group(state.kind).map(s=>s.collection))];
   const list=model.group(state.kind).filter(s=>s.collection===state.collection);
   const selectedRef=(set.type==='wc'?set.bowl:choices.basin);
   const metalFinishes=Object.entries(model.FINISHES).map(([code,label])=>[code,label,false]);
   const assembled=model.assemble(products,set,choices);
   const illustration=bestImage(set,choices);
   const selectedDoc=sheetFor(set,choices);
   const cover=illustration?.src||'';
   const missing=assembled.missing;
   const photoCards=list.map(s=>{
     const visual=bestImage(s,{...choices,basin:s.basins?.[0]||'',seat:s.seats?.[0]||''});
     const selected=s.slug===state.slug;
     return '<button type="button" class="lf-set-card'+(selected?' active':'')+'" data-lf-set="'+e(s.slug)+'" aria-pressed="'+selected+'">'+
       (visual?.src?'<img src="'+e(visual.src)+'" loading="lazy" alt="'+e('Collection '+s.collection+', '+s.label)+'">':'<span class="lf-no-photo">Image officielle indisponible</span>')+
       '<span>'+e(s.label)+'</span></button>';
   }).join('');
   let fields='';
   if(set.type==='basin'||set.type==='bidet'){
     fields+=inputLine('basin','Modèle et perçage',
       (set.basins||[]).map(base=>{
         const p=model.variants(products,base)[0];
         return [base,(p?p.designation:base)+ ' · '+base+(p?'':' (non tarifé)'),false];
       }),choices.basin,'Le tarif 2026 est utilisé pour le prix ; une référence non tarifée bloquera l’ajout.');
     if(set.support)fields+='<div class="lf-static-field"><span>Support requis</span><strong>'+e(set.support)+'</strong><small>La colonne ou le piètement est facturé séparément.</small></div>';
     const wasteOptions=namesForComponents(
       model.WASTES.concat(model.OPTIONAL_DRAINS[set.collection]||[]),
       products,true
     );
     fields+=inputLine('waste','Bonde / vidage',wasteOptions,choices.waste,
       'Sélectionner un vidage compatible avec le trop-plein du lavabo ; PPW 040 reste indisponible sans tarif.');
     fields+=inputLine('trap','Siphon',namesForComponents(['LB1302'],products,true),choices.trap);
     if(choices.trap==='LB1302')fields+='<label class="lf-check"><input type="checkbox" data-lf="extension"'+(choices.extension?' checked':'')+'> Rallonge de siphon LB 1303 (500 mm)</label>';
     if(set.basins.includes('XO6000'))fields+='<label class="lf-check"><input type="checkbox" data-lf="mounting"'+(choices.mounting?' checked':'')+'> Kit XO 6010 pour installation murale (pas obligatoire pour une pose sur plan)</label>';
     if(['FR1383','LB1383'].includes(choices.waste)){
       const rods=['PPW017'].concat(choices.waste==='FR1383'?['PPW032']:['PPW004','PPW007','PPW011']);
       fields+=inputLine('rod','Allonge de tirette (facultative)',namesForComponents(rods,products,true),choices.rod);
     }
   }
   if(set.type==='wc'){
     fields+='<div class="lf-static-field"><span>Cuvette et réservoir</span><strong>'+e(set.bowl)+' + '+e(set.tank)+'</strong><small>Les mécanismes et tuyaux compatibles sont intégrés automatiquement.</small></div>';
     fields+=inputLine('seat','Abattant',namesForComponents(set.seats,products,false),choices.seat);
     if(set.levers?.length)fields+=inputLine('lever','Commande de chasse',namesForComponents(set.levers,products,false),choices.lever);
     if(set.chains?.length)fields+=inputLine('chain','Chaîne et tirette',namesForComponents(set.chains,products,false),choices.chain);
     if(set.brackets?.length)fields+=inputLine('brackets','Supports obligatoires',namesForComponents(set.brackets,products,false),choices.brackets);
     if(set.mechanism==='LB7789')fields+='<div class="lf-info">Le mécanisme Belle Aire LB 7789 comprend déjà la commande chromée. Aucun levier supplémentaire n’est ajouté.</div>';
   }
   const finishRelevant=!!set.support||set.type==='wc'||!!choices.waste||!!choices.trap;
   if(finishRelevant)fields=inputLine('finish','Finition des éléments métalliques',metalFinishes,choices.finish,
     'Les finitions sans prix dans le tarif 2026 ne peuvent pas être ajoutées.')+fields;
   const lines=assembled.parts.map(p=>
     '<div class="lf-line'+(p.missing?' missing':'')+'"><span>'+e(p.role)+' <small>'+e(p.item?.reference||p.base)+(p.item?.priceOverride?' · Tarif d’équivalence Hydropolis':'')+'</small></span>'+
     '<strong>'+(p.item?euros(p.item.price)+' HT':'Prix indisponible')+'</strong></div>'
   ).join('');
   el.innerHTML='<section class="lf-modal" role="dialog" aria-modal="true" aria-label="Configurateur Lefroy Brooks">'+
    '<header class="lf-head"><div><small>HYDROPOLIS STUDIO · LEFROY BROOKS · TARIF EUR 2026</small><h2>Explorer les collections</h2><p>Compositions certifiées par le site fabricant · prix publics HT du tarif Hydropolis.</p></div><button class="lf-close" type="button" aria-label="Fermer">×</button></header>'+
    '<nav class="lf-kind" aria-label="Type de sanitaire">'+
    [['basin','Lavabos · 21'],['wc','WC · 9'],['bidet','Bidets · 3']].map(([key,label])=>
      '<button type="button" data-lf="kind" value="'+key+'" class="'+(state.kind===key?'selected':'')+'">'+e(label)+'</button>').join('')+'</nav>'+
    '<div class="lf-body"><div class="lf-left"><label class="lf-collection-label">01 · Collection <select data-lf="collection">'+setOptions(currentCollections.map(x=>[x,x,false]),state.collection)+'</select></label>'+
    '<div class="lf-gallery">'+photoCards+'</div></div>'+
    '<div class="lf-center"><div class="lf-hero">'+(cover?'<img src="'+e(cover)+'" alt="'+e(set.collection+' '+set.label)+'">':'<div class="lf-image-empty">Photo fabricant indisponible</div>')+'</div>'+
    '<div class="lf-photo-note">'+e(illustration?.scope||'Visuel exact à rechercher sur le site fabricant')+'</div>'+
    '<h3>'+e(set.collection)+' · '+e(set.label)+'</h3>'+
    '<div class="lf-fields">'+fields+'</div>'+
    '<a target="_blank" rel="noopener noreferrer" href="'+e(indexFor(set)?.url||set.url||'https://uk.lefroybrooks.com/all-basin-sets')+'">Voir la composition officielle</a>'+
    (selectedDoc?'<a target="_blank" rel="noopener noreferrer" href="'+e(selectedDoc)+'">Fiche technique de cette configuration</a>':'')+
    '</div><aside class="lf-right"><h3>Composition du projet</h3>'+
    '<p>Chaque pièce est tarifée séparément, sans double comptage.</p>'+
    '<div class="lf-lines">'+lines+'</div>'+
    (missing.length?'<div class="lf-warning"><strong>Articles obligatoires sans prix :</strong> '+e(missing.join(', '))+'. Ajout bloqué.</div>':'')+
    '<div class="lf-total"><span>Prix public total HT</span><strong>'+euros(assembled.total)+'</strong></div>'+
    '<p class="lf-discount">Remise Lefroy Brooks du projet : 55 % selon conditions Hydropolis existantes.</p>'+
    '<button type="button" class="lf-confirm"'+(missing.length?' disabled':'')+'>Ajouter la composition au projet</button>'+
    '<button type="button" class="lf-cancel">Annuler</button></aside></div></section>';
   const kindButtons=el.querySelectorAll('.lf-kind [data-lf="kind"]');
   kindButtons.forEach(b=>b.addEventListener('click',()=>{
     const kind=b.value;state.kind=kind;resetSet(model.group(kind)[0].slug);render();
   }));
   selectChanges();
 }
 function commit(){
   const set=current(),composition=model.assemble(products,set,state.choice);
   if(composition.missing.length){alert('Composition incomplète : '+composition.missing.join(', '));return;}
   if(!composition.parts.length||!composition.parts[0].item)throw Error('Produit principal introuvable');
   try{
     const target=typeof normalizedRoomId==='function'?normalizedRoomId(state.roomId):state.roomId;
     const photo=bestImage(set,state.choice);
     const sheet=sheetFor(set,state.choice);
     const refs=composition.parts.map(p=>p.item.reference);
     const cfg={schemaVersion:1,set:set.slug,collection:set.collection,kind:set.type,
       selectedRefs:refs,finish:state.choice.finish,publicTotalHT:composition.total,
       priceExceptions:composition.parts.filter(p=>p.item?.priceOverride).map(p=>({reference:p.item.reference,...p.item.priceOverride,price:p.item.price})),
       sourceUrl:indexFor(set)?.url||set.url||'',photoScope:photo?.scope||''};
     const original=composition.parts[0].item;
     const main=createSelectedProductRecord(original,target);
     if(!main)throw Error('Impossible de créer le produit principal.');
     main.lefroyGuidedConfiguration=cfg;
     main.manufacturerUrl=cfg.sourceUrl||main.manufacturerUrl;
     main.technicalSheetUrl=sheet||main.technicalSheetUrl||'';
     if(photo?.src){
       const proxied='/api/image-proxy?url='+encodeURIComponent(photo.src);
       main.image=proxied;main.images=[proxied];main.pdfImage=proxied;main.pdfImages=[proxied];main.remoteImageUrl=photo.src;
       main.imageSource='Site officiel Lefroy Brooks — '+photo.scope;
       main.imageNote=photo.scope;main.imageFinishMatch=photo.exact?'exact':'collection';
     }
     const selected=[main];
     for(const part of composition.parts.slice(1)){
       const item=createSelectedProductRecord(part.item,target,main.id);
       if(!item)throw Error('Impossible de créer '+part.item.reference);
       item.accessoryFor=main.id;
       item.lefroyGuidedChild=true;
       if(part.item.priceOverride){item.lefroyPriceOverride=part.item.priceOverride;item.supplierNote=(item.supplierNote||'')+' · Prix d’équivalence approuvé Hydropolis';}
       item.hideFromDossier=true;
       selected.push(item);
     }
     const saved=commitSelectedRecords(selected,{showProject:true});
     if(!saved?.length)throw Error('L’ajout au projet a échoué.');
     close();
   }catch(err){console.error('[Lefroy guided]',err);alert('Lefroy Brooks : '+(err.message||err));}
 }
 render();
 loadMedia().then(()=>{if(modal===el&&document.contains(el))render();});
}
function launch(initial,roomId){open(initial||null,roomId);}
/* Reuse verified manufacturer files to populate missing individual catalogue images.
   Use isolated product views first, otherwise an explicitly labelled composition view.
   Never overwrite already-cached/user-authored photographs. */
let indexedPhotos=null;
function photoCatalogIndex(){
 if(indexedPhotos)return indexedPhotos;
 const idx=new Map();
 for(const group of Object.values(media)){
  for(const img of (group.images||[])){
   if(!VALID_IMAGE.test(img.url))continue;
   const matches=[...String(img.label||'').toUpperCase().matchAll(/(?:LB|BK|MK|XO|FR|PPW)[ _-]?[0-9]{3,4}/g)];
   const codes=[...new Set(matches.map(m=>m[0].replace(/[^A-Z0-9]/g,'')))];
   if(!codes.length)continue;
   const suffix=(String(img.label||'').toUpperCase().match(/(?:[_-])(AG|CP|NK|PB)\.(?:JPG|JPEG|PNG|WEBP)$/)||[])[1]||'';
   const record={img,codes,suffix};
   for(const code of codes){
    if(!idx.has(code))idx.set(code,[]);
    idx.get(code).push(record);
   }
  }
 }
 indexedPhotos=idx;
 return idx;
}
function missingCatalogPhotos(){
 if(!Object.keys(media).length)return {catalog:0,project:0};
 const idx=photoCatalogIndex();
 function apply(p){
  if(!p||p.manufacturer!=='Lefroy Brooks'||p.image||p.customImage)return false;
  const base=String(p.base||p.reference||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const aliases=[base,base.replace(/(?:BL|WH|[LR])$/,'')];
  const entries=[...new Set(aliases.flatMap(k=>idx.get(k)||[]))];
  if(!entries.length)return false;
  const finish=String(p.finishCode||'').toUpperCase();
  const selected=entries.map(x=>{
    const isIsolated=x.codes.length===1;
    const finishExact=!!finish&&['AG','CP','NK','PB'].includes(finish)&&finish===x.suffix;
    const finishWrong=!!finish&&['AG','CP','NK','PB'].includes(finish)&&x.suffix&&finish!==x.suffix;
    return {...x,score:(isIsolated?60:20)+(finishExact?75:0)-(finishWrong?70:0)+(x.codes.includes(base)?20:0),isIsolated,finishExact,finishWrong};
  }).sort((a,b)=>b.score-a.score)[0];
  if(!selected)return false;
  const proxy='/api/image-proxy?url='+encodeURIComponent(selected.img.url);
  p.image=proxy;p.images=[proxy];p.remoteImageUrl=selected.img.url;
  const scope=selected.isIsolated?(selected.finishExact?'référence et finition exactes':'référence exacte, finition non certifiée'):'composition fabricant, finition non contractuelle';
  p.imageSource='Site officiel Lefroy Brooks · '+scope;
  p.imageNote=scope;p.imageFinishMatch=selected.isIsolated&&selected.finishExact?'exact':'model';
  if(p.id){p.pdfImage=proxy;p.pdfImages=[proxy];}
  return true;
 }
 let count=0,projects=0;
 for(const p of rows())if(apply(p))count++;
 try{
  if(typeof state!=='undefined'&&Array.isArray(state.selected)){
   for(const p of state.selected)if(apply(p))projects++;
  }
 }catch{}
 return {catalog:count,project:projects};
}
function attach(){
 const catalog=document.querySelector('#view-catalog');
 if(!catalog)return;
 const card=document.createElement('section');
 card.className='lf-launcher';
 card.innerHTML='<div><small>LEFROY BROOKS · CÉRAMIQUE 2026</small><h3>Explorer les collections Lefroy Brooks</h3><p>21 lavabos · 9 WC · 3 bidets · composants obligatoires et photos fabricant.</p></div><button type="button" class="lf-launch-button">Explorer les collections</button>';
 const search=catalog.querySelector('.search-card');
 if(search)search.appendChild(card);else catalog.prepend(card);
 card.querySelector('.lf-launch-button').addEventListener('click',()=>launch(null,document.querySelector('#targetRoom')?.value||''));
 function visibility(){
   const maker=document.querySelector('#manufacturerFilter')?.value;
   const query=document.querySelector('#searchInput')?.value||'';
   const on=maker==='Lefroy Brooks'||(!maker&&/^lefroy(\s|$)/i.test(query.trim()));
   card.hidden=!on;
   if(on)document.querySelectorAll('#results button.add').forEach(btn=>{
     const ref=btn.dataset.ref;
     const product=rows().find(p=>p.reference===ref);
     if(product&&model.eligible(product))btn.textContent='Configurer ce produit';
   });
 }
 const previous=window.renderCatalog;
 if(typeof previous==='function'){
   window.renderCatalog=function(){const res=previous.apply(this,arguments);const x=missingCatalogPhotos();if(x.catalog)previous.apply(this,arguments);if(x.project){saveState();renderRooms();}visibility();return res;};
 }
 document.addEventListener('click',event=>{
   const button=event.target.closest?.('#results button.add');
   if(!button)return;
   const source=rows().find(p=>p.reference===button.dataset.ref);
   if(!source||!model.eligible(source))return;
   event.preventDefault();event.stopImmediatePropagation();
   open(source,document.querySelector('#targetRoom')?.value||'');
 },true);
 document.querySelector('#manufacturerFilter')?.addEventListener('change',visibility);
 document.querySelector('#searchInput')?.addEventListener('input',visibility);
 visibility();
 loadMedia().then(()=>{const added=missingCatalogPhotos();if(added.project){saveState();renderRooms();}if(added.catalog&&typeof window.renderCatalog==='function')window.renderCatalog();}).catch(err=>console.warn('[Lefroy media index]',err));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
root.HydroLefroyGuided={open,launch,model,loadMedia,bestImage,sheetFor,missingCatalogPhotos};
})(window);
