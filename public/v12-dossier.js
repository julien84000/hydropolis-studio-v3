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
 cleanup();apply();activateSorting();activateResize();
 const b=one('#v12AdvancedResize');
 if(b){
  b.disabled=typeof window.interact!=='function';
  b.setAttribute('aria-pressed',String(advanced&&presentationLayoutEditing));
  b.textContent=advanced&&presentationLayoutEditing?'Terminer les ajustements':'Redimensionnement avancé';
 }
}
function showPaginationPreview(){
 // Never replaces the existing A4 / browser-print production workflow.
 const doc=one('#document');
 if(!doc||!doc.children.length){announce('Ouvrez un dossier avant l’aperçu.');return;}
 const w=window.open('','_blank');
 if(!w){announce('Autorisez les fenêtres pour afficher cet aperçu expérimental.');return;}
 const styles=all('link[rel="stylesheet"],style',document.head).map(el=>el.outerHTML).join('\n');
 const content=doc.innerHTML;
 w.document.open();
 w.document.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Hydropolis V12 · Aperçu paginé</title>'+
  styles+
  '<style>body{margin:0;background:#f1f2f3}#document{display:block}#document>.page{margin:0 auto 12mm;break-after:page;page-break-after:always}'+
  '@page{size:A4 landscape;margin:0}.preview-only{padding:12px;text-align:center;font:14px Arial}</style>'+
  '</head><body><div class="preview-only">Aperçu expérimental Paged.js — le PDF officiel reste inchangé.</div><div id="document"></div>'+
  '<script src="https://cdn.jsdelivr.net/npm/pagedjs@0.4.3/dist/paged.polyfill.js"><\/script></body></html>');
 w.document.close();
 const target=w.document.getElementById('document');
 target.dataset.v12Template=config().template;
 target.style.cssText=doc.style.cssText;
 // Transfer nodes through a document-owned template, no event code from source.
 const template=w.document.createElement('template');
 template.innerHTML=content;
 template.content.querySelectorAll('.layout-controls,.v12-sort-grip,.v12-resize-grip').forEach(el=>el.remove());
 target.append(template.content);
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
 '<button type="button" id="v12PagedPreview">Aperçu pagination (bêta)</button></div>'+
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
