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
let dialog=null,selection=null;
function chooseText(select,items,preserve=true){
 const value=preserve?select.value:'';
 select.replaceChildren();
 for(const item of items){const opt=make('option');opt.value=item;opt.textContent=item;select.append(opt)}
 select.value=allowed(value,items);
}
function safeUrl(value){return /^https:\/\//i.test(value||'')?value:''}
function variants(rows,base){return rows.filter(r=>T.base(r)===base).sort((a,b)=>(a.finishCode||'').localeCompare(b.finishCode||''))}
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
 header.append(heading,close);body.append(header);
 const grid=make('div','coalbrook-modal-grid'),filters=make('div','coalbrook-fields'),view=make('div','coalbrook-product-card');
 body.append(grid);grid.append(filters,view);
 const selects={};
 const fields=[['family','01 · Catégorie'],['range','02 · Collection'],['sub','03 · Sous-catégorie'],['model','04 · Article'],['finish','05 · Finition']];
 for(const [key,label] of fields){
  const row=make('label','coalbrook-field');row.append(make('span','',label));
  const select=make('select');select.setAttribute('aria-label',label);row.append(select);filters.append(row);selects[key]=select;
 }
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
  const p=selection,info=p&&T.detail(p),rough=p&&p.internalReference?products.find(x=>x.reference===p.internalReference):null;
  add.disabled=!p||!!p?.internalReference&&!rough;
  if(!p){view.append(make('p','','Aucun article disponible pour ces filtres.'));return}
  const preview=make('div','coalbrook-product-media');
  if(p.image&&/^(https?:|\/)/.test(p.image)){
   const img=make('img');img.src=p.image;img.loading='lazy';img.alt=(p.designation||'Coalbrook')+' · '+T.finish(p);
   img.addEventListener('error',()=>{preview.replaceChildren(make('span','','Visuel fabricant à associer à cette référence.'))},{once:true});preview.append(img);
  }else preview.append(make('div','coalbrook-media-pending','Visuel fabricant non encore associé'));
  view.append(preview);
  const d=make('div','coalbrook-product-description');
  d.append(make('span','coalbrook-breadcrumb',info.hierarchy.join('  /  ')),make('h3','',p.designation||p.originalDescription||p.reference),
    make('div','coalbrook-reference',p.reference),make('div','coalbrook-amount',fmt(Number(p.price))+' HT'));
  const props=make('dl','coalbrook-properties');
  for(const [name,value] of [['Finition',T.finish(p)],['Référence',p.reference],['Prix source','EUR HT'],['Pages spécifications',info.specificationPages.length?info.specificationPages.join(', ')+' (tarif 2026)':'À indexer']]){
   const row=make('div');row.append(make('dt','',name),make('dd','',value));props.append(row);
  }
  d.append(props);
  const technical=make('div','coalbrook-technical-alert',info.specificationPages.length?
   'Dessin coté repéré p. '+info.specificationPages.join(', ')+' dans le PDF fabricant. La fiche PDF individuelle reste à importer.':
   'Fiche technique à associer depuis le tarif fabricant.');
  d.append(technical);
  if(p.internalReference){
   const box=make('div','coalbrook-rough');
   box.append(make('strong','','Corps encastré obligatoire · '+p.internalReference),
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
  const rough=p.internalReference?products.find(r=>r.reference===p.internalReference):null;
  if(p.internalReference&&!rough)return;
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
function attach(){
 const catalog=document.querySelector('#view-catalog');
 if(!catalog||document.querySelector('#coalbrookLaunch'))return;
 const trigger=make('button','coalbrook-launch','Configurer Coalbrook');trigger.id='coalbrookLaunch';trigger.type='button';
 const head=catalog.querySelector('#v12CatalogHead')||catalog.querySelector('.search-card');
 head?.before(trigger);
 trigger.addEventListener('click',()=>{
  const roomId=document.querySelector('#targetRoom')?.value||state.rooms[0]?.id||'';
  const items=catalogIndex.maker('Coalbrook');
  show(items,roomId,(main,rough,room)=>{
   const parent=createSelectedProductRecord({...main,vat:'HT'},room);
   if(!parent)throw Error('Référence principale introuvable.');
   const records=[parent];
   if(rough){
    const child=createSelectedProductRecord({...rough,vat:'HT'},room,parent.id);
    if(!child)throw Error('Corps encastré introuvable.');
    child.accessoryFor=parent.id;child.quantityPerParent=1;
    records.push(child);
   }
   commitSelectedRecords(records,{showProject:true});
  });
 });
 const mf=document.querySelector('#manufacturerFilter');
 const update=()=>{trigger.hidden=!!mf?.value&&mf.value!=='Coalbrook'};
 mf?.addEventListener('change',update);update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
window.HydroCoalbrookConfigurator={open:show};
})();