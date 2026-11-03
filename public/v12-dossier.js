/* V12 Dossier Studio — visual changes are isolated from quotations and product data. */
(function(){
'use strict';
const one=(q,r=document)=>r.querySelector(q);
const all=(q,r=document)=>Array.from(r.querySelectorAll(q));
const fonts={modern:'-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif',editorial:'Georgia,"Times New Roman",serif'};
let drags=[],resizers=[],advanced=false,first=true;
function config(){
 const p=state.project.dossierDesign||{};
 return {
  template:['minimal','editorial','signature'].includes(p.template)?p.template:'editorial',
  font:['modern','editorial'].includes(p.font)?p.font:'editorial',
  accent:/^#[a-fA-F0-9]{6}$/.test(p.accent||'')?p.accent:'#b38a4d',
  subtitle:String(p.subtitle==null?'Salle de bains · Agencement · Décoration':p.subtitle).slice(0,140)
 };
}
function announce(msg){const el=one('#v12DossierStatus');if(el)el.textContent=msg;}
function apply(){
 const doc=one('#document');if(!doc)return;
 const d=config();
 doc.dataset.v12Template=d.template;
 doc.style.setProperty('--v12-doc-accent',d.accent);
 doc.style.setProperty('--v12-doc-font',fonts[d.font]);
 const p=one('.editorial-cover-card p',doc);
 if(p){p.textContent=d.subtitle;p.classList.add('v12-cover-caption');}
 for(const [id,value] of [['v12DossierTemplate',d.template],['v12DossierFont',d.font],['v12DossierAccent',d.accent],['v12DossierSubtitle',d.subtitle]]){
  const el=document.getElementById(id);if(el&&el.value!==value)el.value=value;
 }
}
function save(patch){
 const prev=state.project.dossierDesign;
 state.project.dossierDesign={...config(),...patch};
 if(!saveState()){state.project.dossierDesign=prev;announce('Enregistrement indisponible.');return;}
 buildDocument();
 announce('Présentation enregistrée dans le projet.');
}
function cleanup(){
 for(const item of drags){try{item.destroy()}catch(e){}}
 drags=[];
 for(const item of resizers){try{item.unset()}catch(e){}}
 resizers=[];
}
function items(el){return all(':scope > .board-item[data-dossier-item]',el);}
function snapshotOrder(){
 const layout=ensurePresentationLayoutState(),previous=JSON.stringify(layout);
 const pages=all('#document .visual-board-page[data-layout-page]');
 const assignments={},orders={};
 const expected=currentDossierPlan.pages.reduce((n,p)=>n+p.items.length,0);
 let count=0;
 for(const page of pages){
  const list=one('.visual-board',page),id=page.dataset.layoutPage;
  if(!list||!id)continue;
  const cardIds=items(list).map(el=>String(el.dataset.dossierItem||''));
  if(cardIds.length>6||cardIds.some(x=>!x)){announce('Déplacement refusé : maximum six articles.');buildDocument();return;}
  orders[id]=cardIds;
  for(const key of cardIds){
   if(assignments[key]){announce('Déplacement incohérent : annulé.');buildDocument();return;}
   assignments[key]=id;count++;
  }
 }
 if(count!==expected){announce('Le nombre de photos ne correspond plus : annulation.');buildDocument();return;}
 for(const page of currentDossierPlan.pages){
  for(const item of page.items){
   const key=String(item.id),next=assignments[key];
   if(next!==page.key){
    const oldKey=page.key+'|item:'+key;
    if(layout.blocks?.[oldKey]?.locked){announce('Ce visuel est verrouillé.');buildDocument();return;}
    if(layout.blocks)delete layout.blocks[oldKey];
   }
  }
 }
 layout.assignments=assignments;
 layout.orders=orders;
 if(!saveState()){state.presentationLayout=JSON.parse(previous);announce('Sauvegarde impossible : opération annulée.');buildDocument();return;}
 buildDocument();
 announce('Ordre des photos enregistré.');
}
function activateSorting(){
 if(!presentationLayoutEditing||typeof window.Sortable!=='function')return;
 all('#document .visual-board-page[data-layout-page]').forEach(page=>{
  const board=one('.visual-board',page);if(!board)return;
  items(board).forEach(item=>{
   const b=document.createElement('button');b.type='button';b.className='v12-sort-grip';
   b.textContent='↕';b.title='Réordonner ou déplacer vers une autre page';
   b.setAttribute('aria-label','Déplacer cette photo');
   item.append(b);
  });
  drags.push(window.Sortable.create(board,{
   group:'hydropolis-v12-dossier',animation:125,draggable:'.board-item[data-dossier-item]',
   handle:'.v12-sort-grip',ghostClass:'v12-sort-ghost',chosenClass:'v12-sort-chosen',
   filter:'.layout-locked',onMove:e=>{
     if(e.dragged?.classList?.contains('layout-locked'))return false;
     return e.from===e.to || items(e.to).length<6;
   },onEnd:snapshotOrder
  }));
 });
}
function activateResize(){
 document.body.classList.toggle('v12-advanced-resize',advanced&&presentationLayoutEditing);
 if(!advanced||!presentationLayoutEditing||typeof window.interact!=='function')return;
 all('#document .visual-board-page .board-item[data-dossier-item]').forEach(item=>{
  if(item.classList.contains('layout-locked'))return;
  const b=document.createElement('button');
  b.type='button';b.className='v12-resize-grip';b.textContent='↘';
  b.title='Redimensionnement avancé';b.setAttribute('aria-label','Redimensionner ce visuel');
  item.append(b);
  const ctl=window.interact(item).resizable({
   edges:{left:false,top:false,right:'.v12-resize-grip',bottom:'.v12-resize-grip'},
   inertia:false,
   listeners:{
    start(){
     const parent=presentationLayoutParent(item);
     if(parent)presentationLayoutMakeAbsolute(item,parent);
    },
    move(e){
     const parent=presentationLayoutParent(item);if(!parent)return;
     const bounds=parent.getBoundingClientRect(),r=item.getBoundingClientRect();
     const w=Math.max(110,Math.min(e.rect.width,bounds.right-r.left));
     const h=Math.max(90,Math.min(e.rect.height,bounds.bottom-r.top));
     item.style.setProperty('width',Math.round(w)+'px','important');
     item.style.setProperty('height',Math.round(h)+'px','important');
     item.dataset.layoutCustom='1';
     syncPresentationBlockMedia(item);
    },
    end(){presentationLayoutSaveGeometry(item);announce('Dimensions enregistrées.');}
   }
  });
  resizers.push(ctl);
 });
}
function refresh(){
 cleanup();apply();activateSorting();activateResize();updatePaginationFocus();
 const b=one('#v12AdvancedResize');
 if(b){
  b.disabled=typeof window.interact!=='function';
  b.setAttribute('aria-pressed',String(advanced&&presentationLayoutEditing));
  b.textContent=advanced&&presentationLayoutEditing?'Terminer les ajustements':'Redimensionnement avancé';
 }
}
let focusedPage=0;
let paginationMode=false;
function paginatedPages(){return all('#view-preview #document > .page')}
function updatePaginationFocus(){
 const pages=paginatedPages();
 const nav=one('#v12PaginationNav');
 const action=one('#v12PagedPreview');
 if(!pages.length){if(nav)nav.hidden=true;return;}
 focusedPage=Math.max(0,Math.min(focusedPage,pages.length-1));
 document.body.classList.toggle('v12-page-focus',paginationMode);
 pages.forEach((page,i)=>{
  page.classList.toggle('v12-active-page',paginationMode&&i===focusedPage);
 });
 if(action){
  action.textContent=paginationMode?'Quitter le mode page par page':'Aperçu page par page';
  action.setAttribute('aria-pressed',String(paginationMode));
 }
 if(!nav)return;
 nav.hidden=!paginationMode;
 const label=one('#v12PageCounter');
 if(label)label.textContent='Page '+(focusedPage+1)+' / '+pages.length;
 const prev=one('#v12PagePrev'),next=one('#v12PageNext');
 if(prev)prev.disabled=focusedPage===0;
 if(next)next.disabled=focusedPage===pages.length-1;
 const select=one('#v12PageSelect');
 if(select){
  if(select.options.length!==pages.length){
   select.replaceChildren();
   pages.forEach((page,i)=>{
    const option=document.createElement('option');
    option.value=String(i);
    const title=page.querySelector('.board-head h2,.pagehead h2,.brandcover h2,.quote-page h2')?.textContent?.trim()||'Page '+(i+1);
    option.textContent=(i+1)+' · '+title.slice(0,68);
    select.append(option);
   });
  }
  select.value=String(focusedPage);
 }
}
function moveFocus(delta){
 const pages=paginatedPages();
 focusedPage=Math.max(0,Math.min(focusedPage+delta,pages.length-1));
 updatePaginationFocus();
 one('#view-preview .preview-bg')?.scrollIntoView({block:'start',behavior:'auto'});
}
function showPaginationPreview(){
 if(!paginatedPages().length){announce('Aucune page à afficher : ouvrez d’abord un dossier client.');return;}
 paginationMode=!paginationMode;
 if(paginationMode)focusedPage=0;
 updatePaginationFocus();
 announce(paginationMode?'Aperçu page par page activé : les pages et leurs données originales sont conservées.':'Aperçu complet rétabli.');
}
function initPaginationNav(panel){
 if(one('#v12PaginationNav'))return;
 const nav=document.createElement('div');nav.id='v12PaginationNav';
 nav.className='v12-pagination-nav';nav.hidden=true;
 nav.setAttribute('role','navigation');nav.setAttribute('aria-label','Navigation dans le dossier paginé');
 const prev=document.createElement('button');prev.type='button';prev.id='v12PagePrev';prev.textContent='← Précédente';
 const counter=document.createElement('strong');counter.id='v12PageCounter';counter.setAttribute('aria-live','polite');
 const select=document.createElement('select');select.id='v12PageSelect';select.setAttribute('aria-label','Choisir une page');
 const next=document.createElement('button');next.type='button';next.id='v12PageNext';next.textContent='Suivante →';
 prev.addEventListener('click',()=>moveFocus(-1));
 next.addEventListener('click',()=>moveFocus(1));
 select.addEventListener('change',()=>{focusedPage=Number(select.value)||0;updatePaginationFocus();});
 nav.append(prev,counter,select,next);
 panel.after(nav);
}

function init(){
 if(!first)return;first=false;
 const toolbar=one('#view-preview .preview-toolbar');if(!toolbar)return;
 const panel=document.createElement('section');panel.id='v12DossierStudio';panel.className='v12-dossier-studio';
 panel.setAttribute('aria-label','Options de présentation client');
 panel.innerHTML='<div class="studio-title">Studio de présentation · V12</div>'+
 '<div class="studio-description">Personnaliser sans modifier les références, les prix et le devis.</div>'+
 '<label>Style<select id="v12DossierTemplate"><option value="minimal">Minimal · Apple</option><option value="editorial">Éditorial · Magazine</option><option value="signature">Signature · Luxe</option></select></label>'+
 '<label>Police<select id="v12DossierFont"><option value="modern">Moderne</option><option value="editorial">Éditoriale</option></select></label>'+
 '<label>Accent<input type="color" id="v12DossierAccent" value="#b38a4d"></label>'+
 '<label class="v12-dossier-cover-title">Sous-titre couverture<input maxlength="140" id="v12DossierSubtitle"></label>'+
 '<div class="v12-dossier-actions"><button type="button" id="v12AdvancedResize" aria-pressed="false">Redimensionnement avancé</button>'+
 '<button type="button" id="v12PagedPreview" aria-pressed="false">Aperçu page par page</button></div>'+
 '<span class="v12-help">Activer « Modifier la mise en page » pour déplacer les photos. Maximum 6 vignettes par page.</span>'+
 '<span class="v12-dossier-status" id="v12DossierStatus" aria-live="polite"></span>';
 toolbar.before(panel);
 one('#v12DossierTemplate').addEventListener('change',e=>save({template:e.target.value,font:e.target.value==='minimal'?'modern':'editorial'}));
 one('#v12DossierFont').addEventListener('change',e=>save({font:e.target.value}));
 one('#v12DossierAccent').addEventListener('change',e=>save({accent:e.target.value}));
 one('#v12DossierSubtitle').addEventListener('change',e=>save({subtitle:e.target.value.slice(0,140)}));
 one('#v12AdvancedResize').addEventListener('click',()=>{
  if(!window.interact){announce('interact.js indisponible : le redimensionnement classique reste actif.');return;}
  if(!presentationLayoutEditing)one('#layoutEditBtn')?.click();
  advanced=!advanced;refresh();
 });
 initPaginationNav(panel);
 one('#v12PagedPreview').addEventListener('click',showPaginationPreview);
 apply();
}
// Wrap document lifecycle rather than using an observer that would mutate PDF nodes.
const oldBuild=buildDocument;
buildDocument=function(){const v=oldBuild.apply(this,arguments);refresh();return v;};
const oldInit=initPresentationLayoutEditor;
initPresentationLayoutEditor=function(){const v=oldInit.apply(this,arguments);refresh();return v;};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.HydroV12Dossier={apply,refresh};
})();
