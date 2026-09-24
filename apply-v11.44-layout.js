#!/usr/bin/env node
"use strict";
// V11.44_LAYOUT_FIX2 — geometry priority fix

const fs=require("fs");
const path=require("path");
const root=process.cwd();
const file=r=>path.join(root,r);
const read=r=>fs.readFileSync(file(r),"utf8");
const write=(r,d)=>fs.writeFileSync(file(r),d,"utf8");

function replaceOnce(src,a,b,label){
  if(src.includes(b))return src;
  const n=src.split(a).length-1;
  if(n!==1)throw new Error(`V11.44 — ${label}: attendu 1 bloc, trouvé ${n}`);
  return src.replace(a,()=>b);
}
function insertBefore(src,anchor,text,label){
  const i=src.indexOf(anchor);
  if(i<0)throw new Error(`V11.44 — ${label}: point d'insertion introuvable`);
  return src.slice(0,i)+text+src.slice(i);
}

for(const p of ["public/app.js","public/styles.css","public/index.html","public/sw.js","server.js","package.json"]){
  if(!fs.existsSync(file(p)))throw new Error("Fichier manquant : "+p);
}

let app=read("public/app.js");
let css=read("public/styles.css");
let index=read("public/index.html");
let sw=read("public/sw.js");
let server=read("server.js");
let pkg=JSON.parse(read("package.json"));

if(app.includes("/* V11.44_PRESENTATION_LAYOUT */")){
  console.log("Hydropolis V11.44 déjà appliquée.");
  process.exit(0);
}

if(!app.includes("V11.42_NATIVE_QUANTITY_V4")){
  throw new Error("V11.44 attend la V11.42 V4 avant application.");
}
if(!app.includes("function renderQuoteEditor()")){
  throw new Error("V11.44 attend la V11.43 devis modifiable avant application.");
}

app=replaceOnce(app,
`    showClientPrices:true,
    showSupplierReferences:true`,
`    showClientPrices:true,
    showSupplierReferences:true,
    presentationLayout:{blocks:{}}`,
"état par défaut");

app=replaceOnce(app,
`    commercial:JSON.parse(JSON.stringify(state.commercial||{})),
    showClientPrices:state.showClientPrices!==false,`,
`    commercial:JSON.parse(JSON.stringify(state.commercial||{})),
    presentationLayout:JSON.parse(JSON.stringify(state.presentationLayout||{blocks:{}})),
    showClientPrices:state.showClientPrices!==false,`,
"sauvegarde cloud");

app=replaceOnce(app,
`  state.showClientPrices=true;
  state.showSupplierReferences=true;`,
`  state.showClientPrices=true;
  state.showSupplierReferences=true;
  state.presentationLayout={blocks:{}};`,
"initialisation chargement");

app=replaceOnce(app,
`      state.showClientPrices=typeof s.showClientPrices==="boolean"?s.showClientPrices:true;
      state.showSupplierReferences=typeof s.showSupplierReferences==="boolean"?s.showSupplierReferences:true;`,
`      state.showClientPrices=typeof s.showClientPrices==="boolean"?s.showClientPrices:true;
      state.showSupplierReferences=typeof s.showSupplierReferences==="boolean"?s.showSupplierReferences:true;
      state.presentationLayout=(s.presentationLayout&&typeof s.presentationLayout==="object")
        ?JSON.parse(JSON.stringify(s.presentationLayout))
        :{blocks:{}};`,
"restauration mise en page");

app=replaceOnce(app,
`  if(typeof state.showClientPrices!=="boolean")state.showClientPrices=true;
  if(typeof state.showSupplierReferences!=="boolean")state.showSupplierReferences=true;`,
`  if(typeof state.showClientPrices!=="boolean")state.showClientPrices=true;
  if(typeof state.showSupplierReferences!=="boolean")state.showSupplierReferences=true;
  if(!state.presentationLayout||typeof state.presentationLayout!=="object")state.presentationLayout={blocks:{}};
  if(!state.presentationLayout.blocks||typeof state.presentationLayout.blocks!=="object")state.presentationLayout.blocks={};`,
"validation mise en page");

app=replaceOnce(app,
` const priceValue=Math.max(0,Number(p.totalPrice??p.price)||0);
 return \`<article class="board-item board-item-\${idx+1}">`,
` const priceValue=Math.max(0,Number(p.totalPrice??p.price)||0);
 const layoutId=esc(String(p.id||((p.roomId||"room")+"-"+idx)));
 return \`<article class="board-item board-item-\${idx+1}" data-layout-block="item:\${layoutId}">`,
"identifiant bloc produit");

app=replaceOnce(app,
`       html+=\`<section class="page editorial-page room-page visual-board-page board-\${group.space.toLowerCase()}" data-parallax-page>`,
`       html+=\`<section class="page editorial-page room-page visual-board-page board-\${group.space.toLowerCase()}" data-parallax-page data-layout-page="\${esc(String(r.id)+":"+group.space+":"+i)}">`,
"identifiant page");

app=replaceOnce(app,
`         <div class="board-head"><div><div class="section-kicker">\${esc(r.title)}\${continuation}</div><h2>\${group.label}</h2></div><div class="editorial-brand">Hydropolis</div></div>
         <div class="board-intro">\${group.intro}</div>`,
`         <div class="board-head" data-layout-block="head"><div><div class="section-kicker">\${esc(r.title)}\${continuation}</div><h2>\${group.label}</h2></div><div class="editorial-brand">Hydropolis</div></div>
         <div class="board-intro" data-layout-block="intro">\${group.intro}</div>`,
"blocs titre et introduction");

const layoutFunctions=`
/* V11.44_PRESENTATION_LAYOUT */
let presentationLayoutEditing=false;

function ensurePresentationLayoutState(){
  if(!state.presentationLayout||typeof state.presentationLayout!=="object")state.presentationLayout={blocks:{}};
  if(!state.presentationLayout.blocks||typeof state.presentationLayout.blocks!=="object")state.presentationLayout.blocks={};
  return state.presentationLayout;
}
function presentationLayoutKey(el){
  const page=el.closest(".visual-board-page[data-layout-page]");
  const block=el.dataset.layoutBlock||"";
  return page&&block?page.dataset.layoutPage+"|"+block:"";
}
function presentationLayoutParent(el){
  return el.classList.contains("board-item")?el.closest(".visual-board"):el.closest(".visual-board-page");
}
function presentationLayoutRecord(el){
  const key=presentationLayoutKey(el);
  return key?ensurePresentationLayoutState().blocks[key]||null:null;
}
function presentationLayoutSnap(v){return Math.round(v/4)*4}
function presentationLayoutClamp(v,min,max){return Math.max(min,Math.min(max,v))}
function presentationLayoutGeometry(el,parent){
  const er=el.getBoundingClientRect(),pr=parent.getBoundingClientRect();
  return {x:er.left-pr.left,y:er.top-pr.top,w:er.width,h:er.height,pw:pr.width,ph:pr.height};
}
function presentationLayoutApplyBox(el,x,y,w,h,unit="px"){
  el.dataset.layoutCustom="1";
  el.style.setProperty("position","absolute","important");
  el.style.setProperty("inset","auto","important");
  el.style.setProperty("left",x+unit,"important");
  el.style.setProperty("top",y+unit,"important");
  el.style.setProperty("width",w+unit,"important");
  el.style.setProperty("height",h+unit,"important");
  el.style.setProperty("right","auto","important");
  el.style.setProperty("bottom","auto","important");
  el.style.setProperty("grid-column","auto","important");
  el.style.setProperty("grid-row","auto","important");
  el.style.setProperty("display","block","important");
  el.style.setProperty("transform","none","important");
}
function presentationLayoutMakeAbsolute(el,parent){
  const g=presentationLayoutGeometry(el,parent);
  presentationLayoutApplyBox(el,g.x,g.y,g.w,g.h,"px");
  return g;
}
function presentationLayoutSaveGeometry(el){
  const parent=presentationLayoutParent(el),key=presentationLayoutKey(el);
  if(!parent||!key)return;
  const g=presentationLayoutGeometry(el,parent);
  const current=ensurePresentationLayoutState().blocks[key]||{};
  ensurePresentationLayoutState().blocks[key]={
    ...current,
    x:+(g.x/Math.max(g.pw,1)*100).toFixed(3),
    y:+(g.y/Math.max(g.ph,1)*100).toFixed(3),
    w:+(g.w/Math.max(g.pw,1)*100).toFixed(3),
    h:+(g.h/Math.max(g.ph,1)*100).toFixed(3)
  };
  el.dataset.layoutCustom="1";
  syncPresentationBlockMedia(el);
  saveState();
}
function applyPresentationLayoutGeometry(el,rec){
  const parent=presentationLayoutParent(el);
  if(!parent||!rec||![rec.x,rec.y,rec.w,rec.h].every(Number.isFinite))return;
  presentationLayoutApplyBox(el,rec.x,rec.y,rec.w,rec.h,"%");
  syncPresentationBlockMedia(el);
}
function syncPresentationBlockMedia(el){
  if(!el?.classList?.contains("board-item"))return;
  const rect=el.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const visual=$(".board-visual",el),copy=$(".board-copy",el);
  if(!visual||!copy)return;

  const scale=Math.max(.68,Math.min(1.18,Math.min(rect.width/260,rect.height/190)));
  el.style.setProperty("--layout-title-size",(8.2*scale).toFixed(2)+"pt");
  el.style.setProperty("--layout-maker-size",(5.2*scale).toFixed(2)+"pt");
  el.style.setProperty("--layout-meta-size",(5.5*scale).toFixed(2)+"pt");

  copy.style.height="auto";
  copy.style.minHeight="0";
  const measured=Math.max(38,copy.scrollHeight+6);
  const copyH=Math.min(rect.height*.46,measured);
  el.style.setProperty("--layout-copy-height",copyH+"px");

  copy.style.setProperty("position","absolute","important");
  copy.style.setProperty("left","0","important");
  copy.style.setProperty("right","0","important");
  copy.style.setProperty("bottom","0","important");
  copy.style.setProperty("top","auto","important");
  copy.style.setProperty("height",copyH+"px","important");
  copy.style.setProperty("min-height","0","important");
  copy.style.setProperty("overflow","hidden","important");

  visual.style.setProperty("position","absolute","important");
  visual.style.setProperty("left","0","important");
  visual.style.setProperty("right","0","important");
  visual.style.setProperty("top","0","important");
  visual.style.setProperty("bottom",copyH+"px","important");
  visual.style.setProperty("height","auto","important");
  visual.style.setProperty("min-height","0","important");
  visual.style.setProperty("overflow","hidden","important");

  visual.querySelectorAll("img").forEach(img=>{
    img.style.setProperty("width","100%","important");
    img.style.setProperty("height","100%","important");
    img.style.setProperty("max-width","100%","important");
    img.style.setProperty("max-height","100%","important");
    img.style.setProperty("object-fit","contain","important");
  });
}
function presentationLayoutAttachObserver(el){
  if(!el.classList.contains("board-item")||el._hydroLayoutObserver||typeof ResizeObserver!=="function")return;
  const obs=new ResizeObserver(()=>{
    if(el.dataset.layoutCustom==="1")syncPresentationBlockMedia(el);
  });
  obs.observe(el);
  el._hydroLayoutObserver=obs;
}
function presentationLayoutControlHtml(locked){
  return '<div class="layout-controls">'+
    '<button type="button" class="layout-drag-handle" title="Déplacer">✥</button>'+ 
    '<button type="button" class="layout-lock-handle" title="'+(locked?"Déverrouiller":"Verrouiller")+'">'+(locked?"🔒":"🔓")+'</button>'+ 
    '<button type="button" class="layout-resize-handle" title="Redimensionner">↘</button>'+ 
  '</div>';
}
function presentationLayoutBindPointer(el,control,mode){
  control.onpointerdown=e=>{
    e.preventDefault();
    e.stopPropagation();

    const key=presentationLayoutKey(el),parent=presentationLayoutParent(el);
    if(!key||!parent)return;

    const rec=ensurePresentationLayoutState().blocks[key]||{};
    if(rec.locked)return;

    const start=presentationLayoutMakeAbsolute(el,parent);
    const sx=e.clientX,sy=e.clientY;
    const minW=el.classList.contains("board-item")?110:140;
    const minH=el.classList.contains("board-item")?90:38;

    control.setPointerCapture?.(e.pointerId);
    document.body.classList.add("presentation-layout-dragging");

    const move=ev=>{
      const dx=ev.clientX-sx,dy=ev.clientY-sy;

      if(mode==="drag"){
        const minY=el.classList.contains("board-item")?-start.ph*.12:0;
        const x=presentationLayoutSnap(
          presentationLayoutClamp(start.x+dx,0,start.pw-start.w)
        );
        const y=presentationLayoutSnap(
          presentationLayoutClamp(start.y+dy,minY,start.ph-start.h)
        );
        el.style.setProperty("left",x+"px","important");
        el.style.setProperty("top",y+"px","important");
      }else{
        const w=presentationLayoutSnap(
          presentationLayoutClamp(start.w+dx,minW,start.pw-start.x)
        );
        const h=presentationLayoutSnap(
          presentationLayoutClamp(start.h+dy,minH,start.ph-start.y)
        );
        el.style.setProperty("width",w+"px","important");
        el.style.setProperty("height",h+"px","important");
        el.dataset.layoutCustom="1";
        syncPresentationBlockMedia(el);
      }
    };

    const up=()=>{
      window.removeEventListener("pointermove",move);
      window.removeEventListener("pointerup",up);
      window.removeEventListener("pointercancel",up);
      document.body.classList.remove("presentation-layout-dragging");
      presentationLayoutSaveGeometry(el);
    };

    window.addEventListener("pointermove",move);
    window.addEventListener("pointerup",up,{once:true});
    window.addEventListener("pointercancel",up,{once:true});
  };
}
function presentationLayoutDecorate(el){
  const key=presentationLayoutKey(el);
  if(!key)return;

  const rec=presentationLayoutRecord(el);
  if(rec)applyPresentationLayoutGeometry(el,rec);
  presentationLayoutAttachObserver(el);

  $(".layout-controls",el)?.remove();

  if(!presentationLayoutEditing)return;

  el.classList.add("layout-editable-block");
  el.insertAdjacentHTML("beforeend",presentationLayoutControlHtml(!!rec?.locked));

  const controls=$(".layout-controls",el);
  const drag=$(".layout-drag-handle",controls);
  const resize=$(".layout-resize-handle",controls);
  const lock=$(".layout-lock-handle",controls);

  presentationLayoutBindPointer(el,drag,"drag");
  presentationLayoutBindPointer(el,resize,"resize");

  lock.onclick=e=>{
    e.preventDefault();
    e.stopPropagation();

    const current=ensurePresentationLayoutState().blocks[key]||{};
    if(![current.x,current.y,current.w,current.h].every(Number.isFinite)){
      presentationLayoutMakeAbsolute(el,presentationLayoutParent(el));
      presentationLayoutSaveGeometry(el);
    }

    const next=ensurePresentationLayoutState().blocks[key]||{};
    next.locked=!next.locked;
    ensurePresentationLayoutState().blocks[key]=next;

    saveState();
    initPresentationLayoutEditor();
  };

  el.classList.toggle("layout-locked",!!presentationLayoutRecord(el)?.locked);
}
function presentationCurrentLayoutPage(){
  const pages=[...document.querySelectorAll("#document .visual-board-page[data-layout-page]")];
  if(!pages.length)return null;

  const host=$(".preview-bg"),hr=host?.getBoundingClientRect();
  const cy=hr?(hr.top+hr.bottom)/2:window.innerHeight/2;

  return pages.sort((a,b)=>{
    const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
    return Math.abs((ar.top+ar.bottom)/2-cy)-Math.abs((br.top+br.bottom)/2-cy);
  })[0];
}
function resetPresentationLayoutPage(){
  const page=presentationCurrentLayoutPage();
  if(!page)return;

  const prefix=page.dataset.layoutPage+"|";
  const blocks=ensurePresentationLayoutState().blocks;

  Object.keys(blocks).forEach(k=>{
    if(k.startsWith(prefix))delete blocks[k];
  });

  saveState();
  buildDocument();
}
function resetPresentationLayoutAll(){
  if(!confirm("Réinitialiser toute la mise en page de la présentation client ?"))return;
  state.presentationLayout={blocks:{}};
  saveState();
  buildDocument();
}
function updatePresentationLayoutToolbar(){
  const edit=$("#layoutEditBtn"),page=$("#layoutResetPageBtn"),all=$("#layoutResetAllBtn");

  if(edit){
    edit.textContent=presentationLayoutEditing
      ?"Terminer la mise en page"
      :"Modifier la mise en page";
    edit.classList.toggle("primary",presentationLayoutEditing);
  }

  if(page)page.disabled=!presentationLayoutEditing;
  if(all)all.disabled=!Object.keys(ensurePresentationLayoutState().blocks).length;

  document.body.classList.toggle("presentation-layout-editing",presentationLayoutEditing);
}
function bindPresentationLayoutToolbar(){
  const edit=$("#layoutEditBtn"),page=$("#layoutResetPageBtn"),all=$("#layoutResetAllBtn");

  if(edit)edit.onclick=()=>{
    presentationLayoutEditing=!presentationLayoutEditing;
    initPresentationLayoutEditor();
  };
  if(page)page.onclick=resetPresentationLayoutPage;
  if(all)all.onclick=resetPresentationLayoutAll;

  updatePresentationLayoutToolbar();
}
function initPresentationLayoutEditor(){
  ensurePresentationLayoutState();

  const doc=$("#document");
  if(!doc){
    bindPresentationLayoutToolbar();
    return;
  }

  doc.querySelectorAll(".layout-controls").forEach(x=>x.remove());
  doc.querySelectorAll(".layout-editable-block").forEach(x=>{
    x.classList.remove("layout-editable-block","layout-locked");
  });

  doc.querySelectorAll(".visual-board-page[data-layout-page]").forEach(page=>{
    const head=$(".board-head",page),intro=$(".board-intro",page);

    if(head)head.dataset.layoutBlock="head";
    if(intro)intro.dataset.layoutBlock="intro";

    [head,intro].filter(Boolean).forEach(presentationLayoutDecorate);
    $$(".board-item",page).forEach(presentationLayoutDecorate);
  });

  bindPresentationLayoutToolbar();
}
`;

app=insertBefore(app,"function buildDocument(){",layoutFunctions+"\n","fonctions mise en page");

app=replaceOnce(app,
` $("#document").innerHTML=html;
 initPreviewParallax();`,
` $("#document").innerHTML=html;
 initPresentationLayoutEditor();
 initPreviewParallax();`,
"réapplication mise en page");

index=replaceOnce(index,
`    <button class="btn primary" id="printBtn">Exporter PDF</button>`,
`    <div class="preview-layout-actions">
      <button class="btn ghost" id="layoutEditBtn" type="button">Modifier la mise en page</button>
      <button class="btn ghost" id="layoutResetPageBtn" type="button" disabled>Réinitialiser cette page</button>
      <button class="btn ghost" id="layoutResetAllBtn" type="button">Réinitialiser tout</button>
      <button class="btn primary" id="printBtn">Exporter PDF</button>
    </div>`,
"barre outils présentation");

css+=`

/* V11.44 — édition mise en page de la présentation client */
.preview-layout-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.presentation-layout-editing #document .visual-board-page[data-layout-page]{background-image:linear-gradient(rgba(185,138,77,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(185,138,77,.07) 1px,transparent 1px);background-size:4mm 4mm}
.presentation-layout-editing #document .layout-editable-block{outline:1.5px dashed rgba(185,138,77,.75)!important;outline-offset:2px}
.presentation-layout-editing #document .layout-editable-block.layout-locked{outline-color:rgba(90,90,90,.45)!important}
.presentation-layout-editing #document .board-item:hover{transform:none!important;filter:none!important}
#document .layout-controls{position:absolute;right:2px;top:2px;z-index:999;display:flex;gap:3px;pointer-events:auto}
#document .layout-controls button{width:24px;height:24px;border:1px solid rgba(185,138,77,.5);border-radius:6px;background:rgba(255,255,255,.94);padding:0;display:grid;place-items:center;font-size:12px;cursor:pointer;box-shadow:0 2px 7px rgba(0,0,0,.08)}
#document .layout-drag-handle{cursor:grab!important;touch-action:none}
#document .layout-resize-handle{cursor:nwse-resize!important;touch-action:none}
.presentation-layout-dragging,.presentation-layout-dragging *{user-select:none!important}
#document .board-item[data-layout-custom="1"] .board-visual{overflow:hidden}
#document .board-item[data-layout-custom="1"] .board-visual img{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important}
#document .board-item[data-layout-custom="1"] .board-copy .board-brand,#document .board-item[data-layout-custom="1"] .board-copy .maker{font-size:var(--layout-maker-size,5.2pt)!important}
#document .board-item[data-layout-custom="1"] .board-copy h3,#document .board-item[data-layout-custom="1"] .board-copy .title{font-size:var(--layout-title-size,8.2pt)!important}
#document .board-item[data-layout-custom="1"] .board-copy .board-finish,#document .board-item[data-layout-custom="1"] .board-copy .board-ref,#document .board-item[data-layout-custom="1"] .board-copy .price,#document .board-item[data-layout-custom="1"] .board-copy .finish,#document .board-item[data-layout-custom="1"] .board-copy .refsmall{font-size:var(--layout-meta-size,5.5pt)!important}
.pdf-exporting #document .layout-controls{display:none!important}
.pdf-exporting #document .layout-editable-block{outline:none!important}
@media print{#document .layout-controls{display:none!important}#document .layout-editable-block{outline:none!important}.presentation-layout-editing #document .visual-board-page[data-layout-page]{background-image:none!important}}
`;

index=index
  .replace(/V11\.43/g,"V11.44")
  .replace(/styles\.css\?v=11\.43-quote/g,"styles.css?v=11.44-layout")
  .replace(/app\.js\?v=11\.43-quote/g,"app.js?v=11.44-layout");
server=server.replace(/V11\.43/g,"V11.44");
sw=sw
  .replace(/hydropolis-v11-43-quote-shell/g,"hydropolis-v11-44-layout-shell")
  .replace(/hydropolis-v11-43-quote-catalogs/g,"hydropolis-v11-44-layout-catalogs");

pkg.version="11.44.0";
pkg.description="Hydropolis Studio V11.44 - présentation client déplaçable et redimensionnable";
pkg.scripts.start="node server.js";

write("public/app.js",app);
write("public/styles.css",css);
write("public/index.html",index);
write("public/sw.js",sw);
write("server.js",server);
write("package.json",JSON.stringify(pkg,null,2)+"\n");

new Function(app);
new Function(server);
new Function(sw);

for(const marker of [
  "V11.44_PRESENTATION_LAYOUT",
  "function initPresentationLayoutEditor()",
  "function syncPresentationBlockMedia(el)",
  'data-layout-page="',
  'data-layout-block="item:',
  'id="layoutEditBtn"',
  "presentationLayout:JSON.parse(JSON.stringify(state.presentationLayout"
]){
  if(!(app.includes(marker)||index.includes(marker))){
    throw new Error("Contrôle V11.44 absent : "+marker);
  }
}

console.log("Hydropolis Studio V11.44 OK.");
console.log("Présentation client : blocs déplaçables/redimensionnables + photos auto-adaptatives.");
