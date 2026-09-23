#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const f = rel => path.join(root, rel);
const read = rel => fs.readFileSync(f(rel), "utf8");
const write = (rel, data) => {
  fs.mkdirSync(path.dirname(f(rel)), {recursive:true});
  fs.writeFileSync(f(rel), data, "utf8");
};
const removeIfExists = rel => {
  try{ if(fs.existsSync(f(rel))) fs.rmSync(f(rel), {force:true}); }catch(e){}
};
function replaceOnce(src, oldText, newText, label){
  const count = src.split(oldText).length - 1;
  if(count !== 1){
    throw new Error(`V11.42 patch aborted — ${label}: expected 1 match, found ${count}. Base must be the verified V11.40 GitHub source.`);
  }
  return src.replace(oldText, newText);
}

if(!fs.existsSync(f("package.json")) || !fs.existsSync(f("public/app.js")) || !fs.existsSync(f("server.js"))){
  throw new Error("Run this script from the root of the Hydropolis Studio repository.");
}

const pkg = JSON.parse(read("package.json"));
if(pkg.version !== "11.40.0"){
  throw new Error(`V11.42 cumulative patch requires V11.40.0. Found ${pkg.version}.`);
}

let app = read("public/app.js");

// ---------------------------------------------------------------------------
// V11.41 intent retained: server-only products remain actionable after search.
// ---------------------------------------------------------------------------
app = replaceOnce(app,
`let serverSearchRows=[];
let serverSearchSignature="";`,
`let serverSearchRows=[];
const serverProductCache=new Map();
let serverSearchSignature="";`,
"server product cache");

app = replaceOnce(app,
`function productFromCompareKey(key){
  return CATALOG.find(p=>productKey(p)===key) || serverSearchRows.find(p=>productKey(p)===key) || null;
}
function productFromCatalogSources(ref,key=""){
  const wantedKey=String(key||"");
  if(wantedKey){
    const keyed=CATALOG.find(p=>productKey(p)===wantedKey) || serverSearchRows.find(p=>productKey(p)===wantedKey);
    if(keyed)return keyed;
  }
  const wantedRef=String(ref||"");
  return CATALOG.find(p=>p.reference===wantedRef) || serverSearchRows.find(p=>p.reference===wantedRef) || null;
}`,
`function productFromCompareKey(key){
  const wantedKey=String(key||"");
  return CATALOG.find(p=>productKey(p)===wantedKey) || serverProductCache.get(wantedKey) || serverSearchRows.find(p=>productKey(p)===wantedKey) || null;
}
function productFromCatalogSources(ref,key=""){
  const wantedKey=String(key||"");
  if(wantedKey){
    const keyed=CATALOG.find(p=>productKey(p)===wantedKey) || serverProductCache.get(wantedKey) || serverSearchRows.find(p=>productKey(p)===wantedKey);
    if(keyed)return keyed;
  }
  const wantedRef=String(ref||"");
  return CATALOG.find(p=>p.reference===wantedRef) || [...serverProductCache.values()].find(p=>p.reference===wantedRef) || serverSearchRows.find(p=>p.reference===wantedRef) || null;
}`,
"server product lookup");

app = replaceOnce(app,
`    serverSearchRows=Array.isArray(data.items)?data.items:[];serverSearchSignature=sig;`,
`    serverSearchRows=Array.isArray(data.items)?data.items:[];
    for(const p of serverSearchRows)serverProductCache.set(productKey(p),p);
    serverSearchSignature=sig;`,
"cache server search rows");

// ---------------------------------------------------------------------------
// V11.42 quantity model.
// ---------------------------------------------------------------------------
app = replaceOnce(app,
`.map(m=>({...m,label:String(m.label||"").trim(),price:Math.max(0,Number(m.price)||0)}))`,
`.map(m=>({...m,label:String(m.label||"").trim(),price:Math.max(0,Number(m.price)||0),quantity:normalizedQuantity(m.quantity)}))`,
"manual quantity migration");

app = replaceOnce(app,
`state.selected=(state.selected||[]).filter(Boolean).map(p=>({...p,roomId:p.roomId||state.rooms[0].id}));`,
`state.selected=(state.selected||[]).filter(Boolean).map(p=>({...p,roomId:p.roomId||state.rooms[0].id,quantity:normalizedQuantity(p.quantity)}));`,
"product quantity migration");

app = replaceOnce(app,
`  state.selected.forEach(p=>{
    if(p.clientDiscountOverride!==undefined && p.clientDiscountOverride!==null && p.clientDiscountOverride!==""){
      p.clientDiscountOverride=Math.max(0,Math.min(100,Number(p.clientDiscountOverride)||0));
    }else delete p.clientDiscountOverride;
    if(typeof p.leadTime!=="string")p.leadTime="";
    if(p.catalogTotalPrice===undefined || p.catalogTotalPrice===null)p.catalogTotalPrice=Number(p.totalPrice||0);
    if(p.catalogPrice===undefined || p.catalogPrice===null)p.catalogPrice=Number(p.price||0);
    if(typeof p.customTechnicalSheet!=="boolean")p.customTechnicalSheet=false;
  });`,
`  state.selected.forEach(p=>{
    if(p.clientDiscountOverride!==undefined && p.clientDiscountOverride!==null && p.clientDiscountOverride!==""){
      p.clientDiscountOverride=Math.max(0,Math.min(100,Number(p.clientDiscountOverride)||0));
    }else delete p.clientDiscountOverride;
    if(typeof p.leadTime!=="string")p.leadTime="";
    if(p.catalogTotalPrice===undefined || p.catalogTotalPrice===null)p.catalogTotalPrice=Number(p.totalPrice||0);
    if(p.catalogPrice===undefined || p.catalogPrice===null)p.catalogPrice=Number(p.price||0);
    if(typeof p.customTechnicalSheet!=="boolean")p.customTechnicalSheet=false;
    p.quantity=normalizedQuantity(p.quantity);
  });
  // V11.42: linked Recor feet/wastes always follow the bath quantity.
  state.selected.forEach(p=>{
    if(!p.accessoryFor)return;
    const parent=state.selected.find(x=>x.id===p.accessoryFor);
    if(parent && parent.manufacturer==="Recor")p.quantity=itemQuantity(parent);
  });`,
"linked Recor quantity migration");

app = replaceOnce(app,
`      id:p.id,roomId:p.roomId,accessoryFor:p.accessoryFor,`,
`      id:p.id,roomId:p.roomId,accessoryFor:p.accessoryFor,quantity:p.quantity,`,
"harmonize quantity");

app = replaceOnce(app,
`  const id=crypto.randomUUID?crypto.randomUUID():Math.random().toString(36);
  return {
    ...p,id,roomId:targetRoomId,`,
`  const id=crypto.randomUUID?crypto.randomUUID():Math.random().toString(36);
  const linkedParent=parentId?(state.selected||[]).find(x=>x.id===parentId):null;
  return {
    ...p,id,roomId:targetRoomId,
    quantity:linkedParent?itemQuantity(linkedParent):1,`,
"selected record quantity");

app = replaceOnce(app,
`function clampPercent(v){return Math.max(0,Math.min(100,Number(v)||0));}`,
`function normalizedQuantity(v){
  const n=Math.floor(Number(v));
  return Number.isFinite(n)&&n>=1?Math.min(999,n):1;
}
function itemQuantity(p){return normalizedQuantity(p?.quantity);}
function manualQuantity(m){return normalizedQuantity(m?.quantity);}
function setProductQuantity(id,value){
  const p=(state.selected||[]).find(x=>x.id===id);if(!p)return false;
  const q=normalizedQuantity(value);p.quantity=q;
  for(const child of state.selected||[]){
    if(child?.accessoryFor===p.id)child.quantity=q;
  }
  return true;
}
function setManualQuantity(roomId,index,value){
  const room=roomById(roomId);const item=room?.manual?.[Number(index)];
  if(!item)return false;
  item.quantity=normalizedQuantity(value);
  return true;
}
function clampPercent(v){return Math.max(0,Math.min(100,Number(v)||0));}`,
"quantity helpers");

app = replaceOnce(app,
`function recorAutomaticSupplierShipping(){
  return (state.selected||[])
    .filter(p=>isRealSelectedProduct(p) && p?.manufacturer==="Recor")
    .reduce((sum,p)=>sum+Math.max(0,Number(p?.mandatoryFreight)||0),0);
}`,
`function recorAutomaticSupplierShipping(){
  return (state.selected||[])
    .filter(p=>isRealSelectedProduct(p) && p?.manufacturer==="Recor")
    .reduce((sum,p)=>sum+Math.max(0,Number(p?.mandatoryFreight)||0)*itemQuantity(p),0);
}`,
"Recor freight quantity");

app = replaceOnce(app,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+articleListTotal(p),0);`,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+articleListTotal(p)*itemQuantity(p),0);`,
"catalog total quantity");

app = replaceOnce(app,
`return (state.rooms||[]).reduce((sum,r)=>sum+validManualItemsForRoom(r).reduce((s,m)=>s+Number(m.price||0),0),0);`,
`return (state.rooms||[]).reduce((sum,r)=>sum+validManualItemsForRoom(r).reduce((s,m)=>s+Number(m.price||0)*manualQuantity(m),0),0);`,
"manual total quantity");

app = replaceOnce(app,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+purchaseCostFor(p),0);`,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+purchaseCostFor(p)*itemQuantity(p),0);`,
"purchase total quantity");

app = replaceOnce(app,
`const productsNet=(state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+effectiveSaleValue(p),0);`,
`const productsNet=(state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+effectiveSaleValue(p)*itemQuantity(p),0);`,
"net sales quantity");

app = replaceOnce(app,
`      const list=ps.reduce((s,p)=>s+articleListTotal(p),0);
      const sale=ps.reduce((s,p)=>s+effectiveSaleValue(p),0);
      const cost=ps.reduce((s,p)=>s+purchaseCostFor(p),0);`,
`      const qty=ps.reduce((s,p)=>s+itemQuantity(p),0);
      const list=ps.reduce((s,p)=>s+articleListTotal(p)*itemQuantity(p),0);
      const sale=ps.reduce((s,p)=>s+effectiveSaleValue(p)*itemQuantity(p),0);
      const cost=ps.reduce((s,p)=>s+purchaseCostFor(p)*itemQuantity(p),0);`,
"margin maker quantity totals");

app = replaceOnce(app,
`return \`<tr><td>\${m}</td><td>\${ps.length}</td><td>\${euro(list)}</td>`,
`return \`<tr><td>\${m}</td><td>\${qty}</td><td>\${euro(list)}</td>`,
"margin maker displayed quantity");

app = replaceOnce(app,
`      const key=[p.reference,p.finish,p.manufacturer,discount,leadTime].join("|");
      if(!grouped.has(key)) grouped.set(key,{...p,qty:0,_effectiveDiscount:discount,_leadTime:leadTime});
      grouped.get(key).qty++;`,
`      const key=[p.reference,p.finish,p.manufacturer,discount,leadTime,articleListTotal(p)].join("|");
      if(!grouped.has(key)) grouped.set(key,{...p,qty:0,_effectiveDiscount:discount,_leadTime:leadTime});
      grouped.get(key).qty+=itemQuantity(p);`,
"quote product quantity");

app = replaceOnce(app,
`      if(!mg.has(key)) mg.set(key,{...m,qty:0});
      mg.get(key).qty++;`,
`      if(!mg.has(key)) mg.set(key,{...m,qty:0});
      mg.get(key).qty+=manualQuantity(m);`,
"quote manual quantity");

app = replaceOnce(app,
`      totalPrice:Math.max(0,Number(m.price)||0),
      roomId:room.id`,
`      totalPrice:Math.max(0,Number(m.price)||0),
      quantity:manualQuantity(m),
      roomId:room.id`,
"manual presentation quantity");

app = replaceOnce(app,
` const priceValue=Math.max(0,Number(p.totalPrice??p.price)||0);
 return \`<article class="board-item board-item-\${idx+1}">`,
` const priceValue=Math.max(0,Number(p.totalPrice??p.price)||0);
 const qty=itemQuantity(p);
 const lineNet=isManual?discountedValue(priceValue)*qty:effectiveSaleValue(p)*qty;
 return \`<article class="board-item board-item-\${idx+1}">`,
"board quantity variables");

app = replaceOnce(app,
`     \${state.showSupplierReferences!==false && p.reference?\`<div class="board-ref">Réf. \${esc(p.reference)}</div>\`:""}
     \${state.showClientPrices!==false?\`<div class="price commercial-price">\${isManual?\`\${euro(priceValue)} HT\`:commercialPriceHtml(p.totalPrice??p.price,p)}</div>\`:""}
   </div>`,
`     \${state.showSupplierReferences!==false && p.reference?\`<div class="board-ref">Réf. \${esc(p.reference)}</div>\`:""}
     <div class="board-quantity">Qté \${qty}</div>
     \${state.showClientPrices!==false?\`<div class="price commercial-price">\${isManual?\`\${euro(priceValue)} HT\`:commercialPriceHtml(p.totalPrice??p.price,p)}</div>\${qty>1?\`<div class="board-line-total">Total · \${euro(lineNet)} HT</div>\`:""}\`:""}
   </div>`,
"board quantity display");

app = replaceOnce(app,
`        <div class="article-leadtime-panel">`,
`        <div class="article-quantity-panel">
          <span>Quantité</span>
          <div class="article-quantity-control">
            <button class="quantity-step qty-dec" data-id="\${p.id}" type="button" aria-label="Diminuer la quantité">−</button>
            <input class="article-quantity-input" data-id="\${p.id}" type="number" min="1" max="999" step="1" value="\${itemQuantity(p)}" inputmode="numeric">
            <button class="quantity-step qty-inc" data-id="\${p.id}" type="button" aria-label="Augmenter la quantité">+</button>
          </div>
          <div class="tech">PU \${euro(articleListTotal(p))} HT · Total \${euro(articleListTotal(p)*itemQuantity(p))} HT</div>
        </div>
        <div class="article-leadtime-panel">`,
"project quantity panel");

app = replaceOnce(app,
`        <div class="price-total">\${euro(articleListTotal(p))} HT<div class="tech">\${p.imageStatus||p.imageSource||"Photo fabricant à rechercher"}</div>`,
`        <div class="price-total">\${euro(articleListTotal(p)*itemQuantity(p))} HT<div class="tech">\${itemQuantity(p)>1?\`PU \${euro(articleListTotal(p))} × \${itemQuantity(p)} · \`:""}\${p.imageStatus||p.imageSource||"Photo fabricant à rechercher"}</div>`,
"project line total");

app = replaceOnce(app,
` $$(".del-prod").forEach(b=>b.onclick=()=>removeProduct(b.dataset.id));`,
` $$(".del-prod").forEach(b=>b.onclick=()=>removeProduct(b.dataset.id));
 $$(".qty-dec").forEach(b=>b.onclick=()=>{
   const p=state.selected.find(x=>x.id===b.dataset.id);if(!p)return;
   setProductQuantity(p.id,itemQuantity(p)-1);saveState();renderRooms();renderSelection();renderMarginDashboard();
 });
 $$(".qty-inc").forEach(b=>b.onclick=()=>{
   const p=state.selected.find(x=>x.id===b.dataset.id);if(!p)return;
   setProductQuantity(p.id,itemQuantity(p)+1);saveState();renderRooms();renderSelection();renderMarginDashboard();
 });
 $$(".article-quantity-input").forEach(inp=>inp.onchange=()=>{
   if(!setProductQuantity(inp.dataset.id,inp.value))return;
   saveState();renderRooms();renderSelection();renderMarginDashboard();
 });`,
"project quantity handlers");

app = replaceOnce(app,
`<div class="manual-add"><input class="manual-label" data-id="\${r.id}" placeholder="Ex. Meuble vasque sur mesure"><input class="manual-price" data-id="\${r.id}" type="number" step="0.01" placeholder="Prix HT"><button class="btn ghost manual-btn" data-id="\${r.id}">Ajouter</button></div>`,
`<div class="manual-add"><input class="manual-label" data-id="\${r.id}" placeholder="Ex. Meuble vasque sur mesure"><input class="manual-price" data-id="\${r.id}" type="number" step="0.01" placeholder="Prix unitaire HT"><input class="manual-qty" data-id="\${r.id}" type="number" min="1" max="999" step="1" value="1" aria-label="Quantité"><button class="btn ghost manual-btn" data-id="\${r.id}">Ajouter</button></div>`,
"manual add quantity");

app = replaceOnce(app,
`<div class="manual-list">\${validManualItemsForRoom(r).map(m=>{const mi=(r.manual||[]).indexOf(m);return \`<div class="manual-item"><span>\${m.label}</span><b>\${euro(m.price)} HT</b><button class="icon del-manual" data-room="\${r.id}" data-i="\${mi}">×</button></div>\`}).join("")}</div>`,
`<div class="manual-list">\${validManualItemsForRoom(r).map(m=>{const mi=(r.manual||[]).indexOf(m);return \`<div class="manual-item"><span>\${m.label}</span><label class="manual-quantity-inline">Qté <input class="manual-qty-input" data-room="\${r.id}" data-i="\${mi}" type="number" min="1" max="999" step="1" value="\${manualQuantity(m)}"></label><b>\${euro(Number(m.price||0)*manualQuantity(m))} HT</b><button class="icon del-manual" data-room="\${r.id}" data-i="\${mi}">×</button></div>\`}).join("")}</div>`,
"manual line quantity");

app = replaceOnce(app,
`   const price=Math.max(0,parseFloat($(".manual-price",card).value||0)||0);
   if(!lab)return;`,
`   const price=Math.max(0,parseFloat($(".manual-price",card).value||0)||0);
   const quantity=normalizedQuantity($(".manual-qty",card)?.value||1);
   if(!lab)return;`,
"manual add quantity read");

app = replaceOnce(app,`   const probe={label:lab,price};`,`   const probe={label:lab,price,quantity};`,"manual quantity probe");
app = replaceOnce(app,`   r.manual.push({label:lab,price});`,`   r.manual.push({label:lab,price,quantity});`,"manual quantity persist");

app = replaceOnce(app,
` $$(".del-manual").forEach(b=>b.onclick=()=>{roomById(b.dataset.room).manual.splice(+b.dataset.i,1);saveState();renderRooms();renderMarginDashboard();});`,
` $$(".manual-qty-input").forEach(inp=>inp.onchange=()=>{
   if(!setManualQuantity(inp.dataset.room,inp.dataset.i,inp.value))return;
   saveState();renderRooms();renderSelection();renderMarginDashboard();
 });
 $$(".del-manual").forEach(b=>b.onclick=()=>{roomById(b.dataset.room).manual.splice(+b.dataset.i,1);saveState();renderRooms();renderSelection();renderMarginDashboard();});`,
"manual quantity handler");

app = replaceOnce(app,
`function renderSelection(){
 $("#selectionCount").textContent=state.rooms.length+" pièce"+(state.rooms.length>1?"s":"")+" · "+state.selected.length+" produit"+(state.selected.length>1?"s":"");
 $("#selectionMini").innerHTML=state.rooms.map(r=>{let ps=state.selected.filter(p=>p.roomId===r.id);return \`<div class="mini"><b>\${r.title}</b><div class="mini-room">\${ps.length} produit\${ps.length>1?"s":""}</div>\${ps.slice(0,3).map(p=>\`<div>\${p.reference} · \${euro(articleMerchandisePrice(p))}</div>\`).join("")}</div>\`}).join("");
}`,
`function renderSelection(){
 const visible=(state.selected||[]).filter(p=>!isRecorBathLinkedAccessory(p));
 const units=visible.reduce((sum,p)=>sum+itemQuantity(p),0);
 $("#selectionCount").textContent=state.rooms.length+" pièce"+(state.rooms.length>1?"s":"")+" · "+visible.length+" référence"+(visible.length>1?"s":"")+" · "+units+" unité"+(units>1?"s":"");
 $("#selectionMini").innerHTML=state.rooms.map(r=>{let ps=visible.filter(p=>p.roomId===r.id);const roomUnits=ps.reduce((sum,p)=>sum+itemQuantity(p),0);return \`<div class="mini"><b>\${r.title}</b><div class="mini-room">\${ps.length} réf. · \${roomUnits} unité\${roomUnits>1?"s":""}</div>\${ps.slice(0,3).map(p=>\`<div>\${p.reference} · Qté \${itemQuantity(p)} · \${euro(articleMerchandisePrice(p)*itemQuantity(p))}</div>\`).join("")}</div>\`}).join("");
}`,
"selection quantity summary");

app = replaceOnce(app,
`<div><b>\${p.designation||p.reference||"Produit"}</b><div class="tech">\${p.manufacturer||""} · \${p.reference||""} · \${p.finish||""}</div></div>
          <div class="price-total">\${euro(articleListTotal(p))} HT</div>`,
`<div><b>\${p.designation||p.reference||"Produit"}</b><div class="tech">\${p.manufacturer||""} · \${p.reference||""} · \${p.finish||""} · Qté \${itemQuantity(p)}</div></div>
          <div class="price-total">\${euro(articleListTotal(p)*itemQuantity(p))} HT</div>`,
"fallback quantity");

// ---------------------------------------------------------------------------
// V11.42 security: finish-simulation now uses the same allowlist + SSRF guard.
// ---------------------------------------------------------------------------
let server = read("server.js");
server = replaceOnce(server,
`    const r=await axios.get(url,{
      responseType:"arraybuffer",timeout:18000,maxRedirects:5,
      headers:{"User-Agent":"Mozilla/5.0","Referer":new URL(url).origin+"/"}
    });`,
`    assertAllowedHydropolisRemote(url);
    const r=await safeRemoteGet(url,{
      responseType:"arraybuffer",timeout:18000,
      maxContentLength:15*1024*1024,maxBodyLength:15*1024*1024,
      headers:{"User-Agent":"Mozilla/5.0","Referer":new URL(url).origin+"/"}
    });`,
"finish simulation SSRF hardening");

// ---------------------------------------------------------------------------
// V11.42 styles appended last to override accumulated historical CSS safely.
// ---------------------------------------------------------------------------
let css = read("public/styles.css");
css += `

/* =========================================================
   V11.42 — quantités par article / unité
   ========================================================= */
.room-product{
  grid-template-columns:85px minmax(320px,1fr) 132px 165px 165px 140px 38px !important;
}
.article-quantity-panel{
  min-width:0;width:100%;box-sizing:border-box;align-self:start;
  padding:9px 10px;border:1px solid var(--line);background:#f7f6f2;
  display:grid;gap:6px;border-radius:9px;
}
.article-quantity-panel>span{
  font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);
}
.article-quantity-control{
  display:grid;grid-template-columns:30px minmax(46px,1fr) 30px;gap:5px;align-items:center;
}
.quantity-step{
  height:32px;border:1px solid var(--line);border-radius:8px;background:#fff;
  cursor:pointer;font-size:18px;line-height:1;color:#403a32;
}
.quantity-step:hover{background:#f4efe6}
.article-quantity-input{
  width:100%;min-width:0!important;height:32px;box-sizing:border-box;
  text-align:center;font-weight:750;padding:5px!important;
}
.manual-add{
  grid-template-columns:minmax(180px,1fr) 120px 70px auto !important;
}
.manual-item{
  grid-template-columns:minmax(0,1fr) auto auto auto !important;
  align-items:center;
}
.manual-quantity-inline{
  display:flex!important;grid-template-columns:none!important;align-items:center;gap:5px;
  font-size:9px!important;text-transform:none!important;letter-spacing:0!important;
}
.manual-quantity-inline input{
  width:58px!important;min-width:58px!important;padding:5px 6px!important;text-align:center;
}
.board-quantity{
  display:inline-flex;margin-top:1.5mm;padding:.8mm 1.6mm;border-radius:999px;
  background:#f2eee7;color:#77654f;font-size:5.5pt;font-weight:700;letter-spacing:.03em;
}
.board-line-total{
  margin-top:1.2mm;font-size:6pt;color:#5e5549;font-weight:650;
}
@media(max-width:1500px){
  .room-product{
    grid-template-columns:85px minmax(260px,1fr) 118px 150px 150px 128px 38px !important;
    gap:9px;
  }
}
@media(max-width:1260px){
  .room-product{
    grid-template-columns:85px minmax(0,1fr) 150px 38px !important;
  }
  .article-quantity-panel,
  .article-leadtime-panel,
  .article-discount-panel,
  .room-product .price-total{
    grid-column:2 / 4 !important;
    justify-self:start;text-align:left;max-width:360px;
  }
  .manual-add{grid-template-columns:1fr 110px 68px auto!important}
}
@media(max-width:900px){
  .article-quantity-panel,
  .article-leadtime-panel,
  .article-discount-panel,
  .room-product .price-total{
    grid-column:auto!important;max-width:none;width:100%;
  }
  .manual-add{grid-template-columns:1fr!important}
  .manual-item{grid-template-columns:1fr auto auto!important}
  .manual-item .icon{grid-column:3}
}
`;

// ---------------------------------------------------------------------------
// Version metadata.
// ---------------------------------------------------------------------------
pkg.version = "11.42.0";
pkg.description = "Hydropolis Studio V11.42 - article quantities, server-result stability and security hardening";
const extraTests = [
  "node tests/v11.42-server-search.js",
  "node tests/v11.42-quantity.js",
  "node tests/v11.42-security.js"
];
for(const t of extraTests){
  if(!pkg.scripts.test.includes(t)){
    pkg.scripts.test = pkg.scripts.test.replace("node tests/v11-smoke.js", `node tests/v11-smoke.js && ${t}`);
  }
}

let build = JSON.parse(read("BUILD_INFO.json"));
build.version = "11.42.0";
build.build = "V11.42";
build.releaseNotes = "RELEASE_NOTES_V11.42.md";
build.notes = "Native article quantities in project/client outputs, cumulative server-search action persistence, and finish-simulation SSRF hardening.";
build.quantityManagementV1142 = {
  range: "1..999",
  projectProducts: "native quantity field; no duplicate rows required",
  manualItems: "native quantity field",
  recalculates: ["public total","net sale","purchase cost","margin","supplier freight","quote","Excel"],
  recor: "linked feet/wastes inherit bath quantity",
  clientDossier: "quantity shown on product board; quote keeps unit price and line total",
  legacyProjects: "missing quantities migrate to 1"
};
build.serverSearchActionsV1142 = {
  cache: "server-only products kept by manufacturer+reference productKey for the browser session",
  actions: ["add","favorites","compare","photo refresh"]
};
build.securityV1142 = {
  finishSimulation: "remote image URL must match Hydropolis allowlist and pass safeRemoteGet SSRF checks",
  publicCleanup: "stale public copies of backend/package metadata removed"
};
build.validation = {
  ...(build.validation||{}),
  v1142TransformSyntax: "prevalidated against GitHub V11.40 source",
  postApply: "run npm run check && npm test"
};

// README.
let readme = read("README.md");
readme = replaceOnce(readme, "# Hydropolis Studio V11.40", "# Hydropolis Studio V11.42", "README version");
readme = replaceOnce(readme,
"Hydropolis Studio V11.40 est construit sur **V11.39**.",
"Hydropolis Studio V11.42 est construit cumulativement sur la base GitHub **V11.40** et reprend le correctif d’actions serveur prévu en V11.41.",
"README base");
const section = `## V11.42 — quantités natives et stabilisation

Chaque produit du **Projet par pièce** possède désormais une quantité explicite de 1 à 999, modifiable avec − / saisie directe / +. Les éléments libres disposent du même mécanisme.

La quantité recalcule automatiquement le tarif public, la vente nette, le coût d’achat, la marge, le port Recor lié aux unités, le devis client et l’export Excel. Dans le dossier client, le produit reste présenté une seule fois avec sa quantité ; le récapitulatif conserve le prix unitaire et le total de ligne.

Pour les baignoires Recor, les pieds et vidages liés reprennent automatiquement la quantité de la baignoire.

Cette version conserve aussi les produits provenant de l’index serveur dans un cache de session afin que Favoris, Comparateur, ajout au projet et actualisation photo restent utilisables après changement de recherche. La route de simulation de finition utilise désormais l’allowlist distante et la protection SSRF commune.

`;
readme = replaceOnce(readme, "## V11.40 — images automatiques dans les projets\n", section + "## V11.40 — images automatiques dans les projets\n", "README V11.42 section");

// Visible version markers.
let index = read("public/index.html").replace(/V11\.40/g,"V11.42");
let sw = read("public/sw.js")
  .replace(/hydropolis-v11-40-shell/g,"hydropolis-v11-42-shell")
  .replace(/hydropolis-v11-40-catalogs/g,"hydropolis-v11-42-catalogs");

let cat = JSON.parse(read("public/catalog_manifest.json"));
cat.version = "11.42.0";
cat.engineVersion = "11.42.0";

let makers = JSON.parse(read("public/manufacturers_manifest.json"));
makers.version = "11.42.0";

server = server.replace(/Hydropolis Studio V11\.40/g,"Hydropolis Studio V11.42");
server = server.replace(/Hydropolis V11\.40/g,"Hydropolis V11.42");

let smoke = read("tests/v11-smoke.js");
smoke = replaceOnce(smoke,
"assert.equal(json('package.json').version,'11.40.0');",
"assert.equal(json('package.json').version,'11.42.0');",
"smoke package version");
smoke = smoke.replace(/hydropolis-v11-40-shell/g,"hydropolis-v11-42-shell")
             .replace(/V11\.40 SW cache missing/g,"V11.42 SW cache missing");

// Regression tests written by the patch.
const testSearch = `const fs=require('fs');
const assert=require('assert');
const app=fs.readFileSync('public/app.js','utf8');
for(const s of [
  'const serverProductCache=new Map()',
  'serverProductCache.get(wantedKey)',
  'serverProductCache.set(productKey(p),p)',
  'productFromCatalogSources(ref,key="")'
]) assert(app.includes(s),'V11.42 server-search regression: '+s);
console.log('V11.42 server-search actions OK');
`;

const testQuantity = `const fs=require('fs');
const assert=require('assert');
const app=fs.readFileSync('public/app.js','utf8');
for(const s of [
  'function normalizedQuantity(v)',
  'function setProductQuantity(id,value)',
  'child?.accessoryFor===p.id',
  'quantity:linkedParent?itemQuantity(linkedParent):1',
  'articleListTotal(p)*itemQuantity(p)',
  'effectiveSaleValue(p)*itemQuantity(p)',
  'purchaseCostFor(p)*itemQuantity(p)',
  'grouped.get(key).qty+=itemQuantity(p)',
  'mg.get(key).qty+=manualQuantity(m)',
  'class="article-quantity-input"',
  'class="manual-qty-input"',
  '<div class="board-quantity">Qté \${qty}</div>'
]) assert(app.includes(s),'V11.42 quantity regression: '+s);

function normalizedQuantity(v){
  const n=Math.floor(Number(v));
  return Number.isFinite(n)&&n>=1?Math.min(999,n):1;
}
assert.equal(normalizedQuantity(undefined),1);
assert.equal(normalizedQuantity(0),1);
assert.equal(normalizedQuantity(3.9),3);
assert.equal(normalizedQuantity(1000),999);
console.log('V11.42 quantities OK');
`;

const testSecurity = `const fs=require('fs');
const assert=require('assert');
const server=fs.readFileSync('server.js','utf8');
const start=server.indexOf('app.get("/api/finish-simulation"');
const end=server.indexOf('app.post("/api/ritmonio-docs"',start);
assert(start>=0&&end>start,'finish-simulation route missing');
const block=server.slice(start,end);
assert(block.includes('assertAllowedHydropolisRemote(url)'),'finish-simulation allowlist guard missing');
assert(block.includes('safeRemoteGet(url'),'finish-simulation safeRemoteGet missing');
assert(!block.includes('axios.get(url'),'finish-simulation still performs direct axios URL fetch');
for(const stale of ['public/server.js','public/package.json','public/BUILD_INFO.json']){
  assert(!fs.existsSync(stale),'stale public backend file remains: '+stale);
}
console.log('V11.42 security hardening OK');
`;

// Release notes.
const release = `# Hydropolis Studio V11.42

Base de patch : **V11.40 GitHub**, commit de référence audité \`5be697dc941916c49eb5d89c3f2c368fb161ab50\`.

## Quantités
- quantité native 1–999 par article dans Projet par pièce ;
- boutons − / + et saisie directe ;
- quantité native pour les éléments libres ;
- recalcul du tarif, prix net, coût achat, marge, port Recor, devis et Excel ;
- dossier client : une seule carte produit avec Qté, devis avec PU et total de ligne ;
- migration automatique des anciens projets vers quantité 1 ;
- pieds et vidages Recor synchronisés sur la quantité de la baignoire.

## Stabilisation
- conservation en session des produits issus de l’index serveur : Favoris, Comparateur, ajout et photo restent actionnables ;
- durcissement SSRF de la simulation de finition ;
- suppression des copies backend/package obsolètes exposées sous /public.

## Validation
Après application :
\`\`\`bash
npm run check
npm test
\`\`\`
`;

write("public/app.js", app);
write("public/styles.css", css);
write("server.js", server);
write("package.json", JSON.stringify(pkg,null,2)+"\n");
write("BUILD_INFO.json", JSON.stringify(build,null,2)+"\n");
write("README.md", readme);
write("public/index.html", index);
write("public/sw.js", sw);
write("public/catalog_manifest.json", JSON.stringify(cat,null,2)+"\n");
write("public/manufacturers_manifest.json", JSON.stringify(makers,null,2)+"\n");
write("tests/v11-smoke.js", smoke);
write("tests/v11.42-server-search.js", testSearch);
write("tests/v11.42-quantity.js", testQuantity);
write("tests/v11.42-security.js", testSecurity);
write("RELEASE_NOTES_V11.42.md", release);

// Remove stale server/package copies accidentally exposed as static public files.
for(const stale of [
  "public/server.js",
  "public/package.json",
  "public/BUILD_INFO.json",
  "public/render.yaml",
  "public/README.md"
]) removeIfExists(stale);

console.log("Hydropolis Studio V11.42 patch applied.");
console.log("Next: npm run check && npm test");
