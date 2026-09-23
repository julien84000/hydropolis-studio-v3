#!/usr/bin/env node
"use strict";

const fs=require("fs");
const path=require("path");
const root=process.cwd();
const f=rel=>path.join(root,rel);
const read=rel=>fs.readFileSync(f(rel),"utf8");
const write=(rel,data)=>{fs.mkdirSync(path.dirname(f(rel)),{recursive:true});fs.writeFileSync(f(rel),data,"utf8")};

function replaceOnce(src,oldText,newText,label){
  const count=src.split(oldText).length-1;
  if(count!==1)throw new Error(`V11.42: ${label} — attendu 1 bloc, trouvé ${count}. La base doit être la V11.41 actuelle.`);
  return src.replace(oldText,newText);
}

if(!fs.existsSync(f("package.json"))||!fs.existsSync(f("public/app.js"))||!fs.existsSync(f("public/styles.css"))){
  throw new Error("Lancer depuis la racine du dépôt Hydropolis Studio.");
}

let pkg=JSON.parse(read("package.json"));
let current=String(pkg.version||"");

if(current==="11.42.0" && read("public/app.js").includes('class="article-quantity-input"')){
  console.log("Hydropolis Studio V11.42 déjà appliquée.");
  process.exit(0);
}
if(current!=="11.41.0"){
  throw new Error(`La V11.42 auto-deploy attend la V11.41.0. Version trouvée : ${current}`);
}

let app=read("public/app.js");

// Migration des anciens projets : quantité absente => 1.
app=replaceOnce(app,
`.map(m=>({...m,label:String(m.label||"").trim(),price:Math.max(0,Number(m.price)||0)}))`,
`.map(m=>({...m,label:String(m.label||"").trim(),price:Math.max(0,Number(m.price)||0),quantity:normalizedQuantity(m.quantity)}))`,
"migration quantité éléments libres");

app=replaceOnce(app,
`state.selected=(state.selected||[]).filter(Boolean).map(p=>({...p,roomId:p.roomId||state.rooms[0].id}));`,
`state.selected=(state.selected||[]).filter(Boolean).map(p=>({...p,roomId:p.roomId||state.rooms[0].id,quantity:normalizedQuantity(p.quantity)}));`,
"migration quantité produits");

app=replaceOnce(app,
`    if(typeof p.customTechnicalSheet!=="boolean")p.customTechnicalSheet=false;
  });

  // V11: never delete a free line solely because its label/price resembles a catalogue product.`,
`    if(typeof p.customTechnicalSheet!=="boolean")p.customTechnicalSheet=false;
    p.quantity=normalizedQuantity(p.quantity);
  });
  // V11.42 — les accessoires Recor liés suivent toujours la quantité de la baignoire.
  state.selected.forEach(p=>{
    if(!p.accessoryFor)return;
    const parent=state.selected.find(x=>x.id===p.accessoryFor);
    if(parent && parent.manufacturer==="Recor")p.quantity=itemQuantity(parent);
  });

  // V11: never delete a free line solely because its label/price resembles a catalogue product.`,
"migration quantité Recor liée");

app=replaceOnce(app,
`      id:p.id,roomId:p.roomId,accessoryFor:p.accessoryFor,`,
`      id:p.id,roomId:p.roomId,accessoryFor:p.accessoryFor,quantity:p.quantity,`,
"conservation quantité harmonisation catalogue");

// Tout nouveau produit démarre à 1 unité.
app=replaceOnce(app,
`  const id=crypto.randomUUID?crypto.randomUUID():Math.random().toString(36);
  return {
    ...p,id,roomId:targetRoomId,`,
`  const id=crypto.randomUUID?crypto.randomUUID():Math.random().toString(36);
  const linkedParent=parentId?(state.selected||[]).find(x=>x.id===parentId):null;
  return {
    ...p,id,roomId:targetRoomId,
    quantity:linkedParent?itemQuantity(linkedParent):1,`,
"quantité nouveau produit");

// Helpers quantité.
app=replaceOnce(app,
`function clampPercent(v){return Math.max(0,Math.min(100,Number(v)||0));}`,
`function normalizedQuantity(v){
  const n=Math.floor(Number(v));
  return Number.isFinite(n)&&n>=1?Math.min(999,n):1;
}
function itemQuantity(p){return normalizedQuantity(p?.quantity);}
function manualQuantity(m){return normalizedQuantity(m?.quantity);}
function setProductQuantity(id,value){
  const p=(state.selected||[]).find(x=>x.id===id);if(!p)return false;
  const q=normalizedQuantity(value);
  p.quantity=q;
  // Une configuration Recor constitue un ensemble : pieds/vidages suivent la baignoire.
  for(const child of state.selected||[]){
    if(child?.accessoryFor===p.id)child.quantity=q;
  }
  return true;
}
function setManualQuantity(roomId,index,value){
  const room=roomById(roomId);
  const item=room?.manual?.[Number(index)];
  if(!item)return false;
  item.quantity=normalizedQuantity(value);
  return true;
}
function clampPercent(v){return Math.max(0,Math.min(100,Number(v)||0));}`,
"helpers quantité");

// Calculs financiers.
app=replaceOnce(app,
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
"port Recor × quantité");

app=replaceOnce(app,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+articleListTotal(p),0);`,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+articleListTotal(p)*itemQuantity(p),0);`,
"tarif public × quantité");

app=replaceOnce(app,
`return (state.rooms||[]).reduce((sum,r)=>sum+validManualItemsForRoom(r).reduce((s,m)=>s+Number(m.price||0),0),0);`,
`return (state.rooms||[]).reduce((sum,r)=>sum+validManualItemsForRoom(r).reduce((s,m)=>s+Number(m.price||0)*manualQuantity(m),0),0);`,
"éléments libres × quantité");

app=replaceOnce(app,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+purchaseCostFor(p),0);`,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+purchaseCostFor(p)*itemQuantity(p),0);`,
"coût achat × quantité");

app=replaceOnce(app,
`const productsNet=(state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+effectiveSaleValue(p),0);`,
`const productsNet=(state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+effectiveSaleValue(p)*itemQuantity(p),0);`,
"vente nette × quantité");

// Tableau marge fabricant.
app=replaceOnce(app,
`      const list=ps.reduce((s,p)=>s+articleListTotal(p),0);
      const sale=ps.reduce((s,p)=>s+effectiveSaleValue(p),0);
      const cost=ps.reduce((s,p)=>s+purchaseCostFor(p),0);`,
`      const qty=ps.reduce((s,p)=>s+itemQuantity(p),0);
      const list=ps.reduce((s,p)=>s+articleListTotal(p)*itemQuantity(p),0);
      const sale=ps.reduce((s,p)=>s+effectiveSaleValue(p)*itemQuantity(p),0);
      const cost=ps.reduce((s,p)=>s+purchaseCostFor(p)*itemQuantity(p),0);`,
"marge fabricant × quantité");

app=replaceOnce(app,
`return \`<tr><td>\${m}</td><td>\${ps.length}</td><td>\${euro(list)}</td>`,
`return \`<tr><td>\${m}</td><td>\${qty}</td><td>\${euro(list)}</td>`,
"quantité tableau marge");

// Devis et Excel : la quantité native alimente row.qty.
app=replaceOnce(app,
`      const key=[p.reference,p.finish,p.manufacturer,discount,leadTime].join("|");
      if(!grouped.has(key)) grouped.set(key,{...p,qty:0,_effectiveDiscount:discount,_leadTime:leadTime});
      grouped.get(key).qty++;`,
`      const key=[p.reference,p.finish,p.manufacturer,discount,leadTime,articleListTotal(p)].join("|");
      if(!grouped.has(key)) grouped.set(key,{...p,qty:0,_effectiveDiscount:discount,_leadTime:leadTime});
      grouped.get(key).qty+=itemQuantity(p);`,
"quantité devis catalogue");

app=replaceOnce(app,
`      if(!mg.has(key)) mg.set(key,{...m,qty:0});
      mg.get(key).qty++;`,
`      if(!mg.has(key)) mg.set(key,{...m,qty:0});
      mg.get(key).qty+=manualQuantity(m);`,
"quantité devis éléments libres");

// Présentation client.
app=replaceOnce(app,
`      totalPrice:Math.max(0,Number(m.price)||0),
      roomId:room.id`,
`      totalPrice:Math.max(0,Number(m.price)||0),
      quantity:manualQuantity(m),
      roomId:room.id`,
"quantité élément libre dossier client");

app=replaceOnce(app,
` const priceValue=Math.max(0,Number(p.totalPrice??p.price)||0);
 return \`<article class="board-item board-item-\${idx+1}">`,
` const priceValue=Math.max(0,Number(p.totalPrice??p.price)||0);
 const qty=itemQuantity(p);
 const lineNet=isManual?discountedValue(priceValue)*qty:effectiveSaleValue(p)*qty;
 return \`<article class="board-item board-item-\${idx+1}">`,
"variables quantité dossier client");

app=replaceOnce(app,
`     \${state.showSupplierReferences!==false && p.reference?\`<div class="board-ref">Réf. \${esc(p.reference)}</div>\`:""}
     \${state.showClientPrices!==false?\`<div class="price commercial-price">\${isManual?\`\${euro(priceValue)} HT\`:commercialPriceHtml(p.totalPrice??p.price,p)}</div>\`:""}
   </div>`,
`     \${state.showSupplierReferences!==false && p.reference?\`<div class="board-ref">Réf. \${esc(p.reference)}</div>\`:""}
     <div class="board-quantity">Qté \${qty}</div>
     \${state.showClientPrices!==false?\`<div class="price commercial-price">\${isManual?\`\${euro(priceValue)} HT\`:commercialPriceHtml(p.totalPrice??p.price,p)}</div>\${qty>1?\`<div class="board-line-total">Total · \${euro(lineNet)} HT</div>\`:""}\`:""}
   </div>`,
"affichage quantité dossier client");

// Projet par pièce : commande compacte directement dans la colonne prix.
app=replaceOnce(app,
`        <div class="price-total">\${euro(articleListTotal(p))} HT<div class="tech">\${p.imageStatus||p.imageSource||"Photo fabricant à rechercher"}</div>\${p.imageNote?\`<div class="tech">\${p.imageNote}</div>\`:""}</div>`,
`        <div class="price-total">
          <div class="article-quantity-compact">
            <span>Qté</span>
            <button class="quantity-step qty-dec" data-id="\${p.id}" type="button" aria-label="Diminuer">−</button>
            <input class="article-quantity-input" data-id="\${p.id}" type="number" min="1" max="999" step="1" value="\${itemQuantity(p)}" inputmode="numeric">
            <button class="quantity-step qty-inc" data-id="\${p.id}" type="button" aria-label="Augmenter">+</button>
          </div>
          <strong class="article-line-total">\${euro(articleListTotal(p)*itemQuantity(p))} HT</strong>
          <div class="tech">\${itemQuantity(p)>1?\`PU \${euro(articleListTotal(p))} × \${itemQuantity(p)} · \`:""}\${p.imageStatus||p.imageSource||"Photo fabricant à rechercher"}</div>
          \${p.imageNote?\`<div class="tech">\${p.imageNote}</div>\`:""}
        </div>`,
"commande quantité article");

app=replaceOnce(app,
` $$(".del-prod").forEach(b=>b.onclick=()=>removeProduct(b.dataset.id));`,
` $$(".del-prod").forEach(b=>b.onclick=()=>removeProduct(b.dataset.id));
 $$(".qty-dec").forEach(b=>b.onclick=()=>{
   const p=state.selected.find(x=>x.id===b.dataset.id);if(!p)return;
   setProductQuantity(p.id,itemQuantity(p)-1);
   saveState();renderRooms();renderSelection();renderMarginDashboard();
 });
 $$(".qty-inc").forEach(b=>b.onclick=()=>{
   const p=state.selected.find(x=>x.id===b.dataset.id);if(!p)return;
   setProductQuantity(p.id,itemQuantity(p)+1);
   saveState();renderRooms();renderSelection();renderMarginDashboard();
 });
 $$(".article-quantity-input").forEach(inp=>inp.onchange=()=>{
   if(!setProductQuantity(inp.dataset.id,inp.value))return;
   saveState();renderRooms();renderSelection();renderMarginDashboard();
 });`,
"événements quantité article");

// Éléments libres.
app=replaceOnce(app,
`<div class="manual-add"><input class="manual-label" data-id="\${r.id}" placeholder="Ex. Meuble vasque sur mesure"><input class="manual-price" data-id="\${r.id}" type="number" step="0.01" placeholder="Prix HT"><button class="btn ghost manual-btn" data-id="\${r.id}">Ajouter</button></div>`,
`<div class="manual-add"><input class="manual-label" data-id="\${r.id}" placeholder="Ex. Meuble vasque sur mesure"><input class="manual-price" data-id="\${r.id}" type="number" step="0.01" placeholder="Prix unitaire HT"><input class="manual-qty" data-id="\${r.id}" type="number" min="1" max="999" step="1" value="1" aria-label="Quantité"><button class="btn ghost manual-btn" data-id="\${r.id}">Ajouter</button></div>`,
"champ quantité élément libre");

app=replaceOnce(app,
`<div class="manual-list">\${validManualItemsForRoom(r).map(m=>{const mi=(r.manual||[]).indexOf(m);return \`<div class="manual-item"><span>\${m.label}</span><b>\${euro(m.price)} HT</b><button class="icon del-manual" data-room="\${r.id}" data-i="\${mi}">×</button></div>\`}).join("")}</div>`,
`<div class="manual-list">\${validManualItemsForRoom(r).map(m=>{const mi=(r.manual||[]).indexOf(m);return \`<div class="manual-item"><span>\${m.label}</span><label class="manual-quantity-inline">Qté <input class="manual-qty-input" data-room="\${r.id}" data-i="\${mi}" type="number" min="1" max="999" step="1" value="\${manualQuantity(m)}"></label><b>\${euro(Number(m.price||0)*manualQuantity(m))} HT</b><button class="icon del-manual" data-room="\${r.id}" data-i="\${mi}">×</button></div>\`}).join("")}</div>`,
"ligne quantité élément libre");

app=replaceOnce(app,
`   const price=Math.max(0,parseFloat($(".manual-price",card).value||0)||0);
   if(!lab)return;`,
`   const price=Math.max(0,parseFloat($(".manual-price",card).value||0)||0);
   const quantity=normalizedQuantity($(".manual-qty",card)?.value||1);
   if(!lab)return;`,
"lecture quantité élément libre");

app=replaceOnce(app,`   const probe={label:lab,price};`,`   const probe={label:lab,price,quantity};`,"probe élément libre");
app=replaceOnce(app,`   r.manual.push({label:lab,price});`,`   r.manual.push({label:lab,price,quantity});`,"sauvegarde quantité élément libre");

app=replaceOnce(app,
` $$(".del-manual").forEach(b=>b.onclick=()=>{roomById(b.dataset.room).manual.splice(+b.dataset.i,1);saveState();renderRooms();renderMarginDashboard();});`,
` $$(".manual-qty-input").forEach(inp=>inp.onchange=()=>{
   if(!setManualQuantity(inp.dataset.room,inp.dataset.i,inp.value))return;
   saveState();renderRooms();renderSelection();renderMarginDashboard();
 });
 $$(".del-manual").forEach(b=>b.onclick=()=>{roomById(b.dataset.room).manual.splice(+b.dataset.i,1);saveState();renderRooms();renderSelection();renderMarginDashboard();});`,
"événement quantité élément libre");

// Résumé projet.
app=replaceOnce(app,
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
"résumé quantités");

// Affichage simplifié de secours.
app=replaceOnce(app,
`<div><b>\${p.designation||p.reference||"Produit"}</b><div class="tech">\${p.manufacturer||""} · \${p.reference||""} · \${p.finish||""}</div></div>
          <div class="price-total">\${euro(articleListTotal(p))} HT</div>`,
`<div><b>\${p.designation||p.reference||"Produit"}</b><div class="tech">\${p.manufacturer||""} · \${p.reference||""} · \${p.finish||""} · Qté \${itemQuantity(p)}</div></div>
          <div class="price-total">\${euro(articleListTotal(p)*itemQuantity(p))} HT</div>`,
"fallback quantité");

// CSS.
let css=read("public/styles.css");
css+=`

/* =========================================================
   V11.42 — quantité par article
   ========================================================= */
.article-quantity-compact{
  display:grid;grid-template-columns:auto 25px 42px 25px;gap:4px;align-items:center;
  justify-content:end;margin-bottom:7px;font-size:9px;color:var(--muted);font-weight:650
}
.article-quantity-compact .quantity-step{
  width:25px;height:25px;padding:0;border:1px solid var(--line);background:#fff;
  border-radius:7px;cursor:pointer;font-size:15px;line-height:1;color:var(--ink)
}
.article-quantity-compact .article-quantity-input{
  width:42px;height:25px;box-sizing:border-box;padding:3px 2px;border:1px solid var(--line);
  border-radius:7px;text-align:center;font-size:10px;font-weight:800;background:#fff
}
.article-line-total{display:block;font-size:12px}
.manual-add{grid-template-columns:minmax(180px,1fr) 105px 62px auto!important}
.manual-item{grid-template-columns:minmax(0,1fr) auto auto auto!important;align-items:center}
.manual-quantity-inline{display:flex!important;align-items:center;gap:4px;font-size:9px!important;color:var(--muted)}
.manual-quantity-inline input{width:52px!important;padding:4px 5px!important;text-align:center}
.board-quantity{
  display:inline-flex;margin-top:1.5mm;padding:.7mm 1.5mm;border-radius:999px;
  background:#f2eee7;color:#77654f;font-size:5.4pt;font-weight:700;letter-spacing:.03em
}
.board-line-total{margin-top:1mm;font-size:6pt;color:#5e5549;font-weight:650}
@media(max-width:900px){
  .article-quantity-compact{justify-content:start}
  .manual-add{grid-template-columns:1fr!important}
  .manual-item{grid-template-columns:1fr auto auto!important}
}
`;

// Version.
pkg.version="11.42.0";
pkg.description="Hydropolis Studio V11.42 - gestion native des quantités par article";
if(!pkg.scripts.test.includes("tests/v11.42-quantity.js")){
  pkg.scripts.test += " && node tests/v11.42-quantity.js";
}

let build=JSON.parse(read("BUILD_INFO.json"));
build.version="11.42.0";
build.build="V11.42";
build.releaseNotes="RELEASE_NOTES_V11.42.md";
build.notes="Gestion native des quantités par article et élément libre dans le projet client.";
build.quantityManagementV1142={
  range:"1..999",
  project:"commande − / saisie / + directement dans chaque article",
  calculations:["tarif public","vente nette","coût achat","marge","port Recor","devis","Excel"],
  recor:"pieds et vidages liés synchronisés à la quantité de la baignoire",
  manualItems:"quantité native",
  legacy:"quantité absente => 1"
};

let index=read("public/index.html").replace(/V11\.41/g,"V11.42");
let sw=read("public/sw.js")
  .replace(/hydropolis-v11-41-shell/g,"hydropolis-v11-42-shell")
  .replace(/hydropolis-v11-41-catalogs/g,"hydropolis-v11-42-catalogs");
let server=read("server.js")
  .replace(/Hydropolis Studio V11\.41/g,"Hydropolis Studio V11.42")
  .replace(/Hydropolis V11\.41/g,"Hydropolis V11.42");

let cat=JSON.parse(read("public/catalog_manifest.json"));
cat.version="11.42.0";cat.engineVersion="11.42.0";
let makers=JSON.parse(read("public/manufacturers_manifest.json"));
makers.version="11.42.0";

let smoke=read("tests/v11-smoke.js");
smoke=replaceOnce(smoke,
"assert.equal(json('package.json').version,'11.41.0');",
"assert.equal(json('package.json').version,'11.42.0');",
"version smoke test");
smoke=smoke.replace(/hydropolis-v11-41-shell/g,"hydropolis-v11-42-shell").replace(/V11\.41 SW cache missing/g,"V11.42 SW cache missing");

const quantityTest=`const fs=require('fs');
const assert=require('assert');
const app=fs.readFileSync('public/app.js','utf8');
for(const symbol of [
  'function normalizedQuantity(v)',
  'function setProductQuantity(id,value)',
  'child?.accessoryFor===p.id',
  'class="article-quantity-input"',
  'class="manual-qty-input"',
  'grouped.get(key).qty+=itemQuantity(p)',
  'mg.get(key).qty+=manualQuantity(m)',
  'effectiveSaleValue(p)*itemQuantity(p)',
  'purchaseCostFor(p)*itemQuantity(p)'
]) assert(app.includes(symbol),'V11.42 quantity guard missing: '+symbol);
function normalizedQuantity(v){const n=Math.floor(Number(v));return Number.isFinite(n)&&n>=1?Math.min(999,n):1}
assert.equal(normalizedQuantity(undefined),1);
assert.equal(normalizedQuantity(0),1);
assert.equal(normalizedQuantity(2),2);
assert.equal(normalizedQuantity(1000),999);
console.log('V11.42 quantity guards OK');
`;

const notes=`# Hydropolis Studio V11.42

Base : **V11.41 actuellement déployée**.

## Quantités
- commande Qté **− / saisie directe / +** sur chaque article dans Projet par pièce ;
- quantité de 1 à 999, valeur par défaut 1 ;
- éléments libres avec quantité ;
- recalcul du tarif public, vente nette, coût d'achat, marge, port Recor, devis et Excel ;
- pieds et vidages Recor synchronisés avec la quantité de la baignoire ;
- quantité visible dans la présentation client ;
- anciens projets migrés automatiquement à quantité 1 lorsqu'aucune quantité n'était enregistrée.

## Déploiement
Le fichier \`render.yaml\` de ce pack exécute automatiquement le patch V11.42 pendant le build Render.
`;

write("public/app.js",app);
write("public/styles.css",css);
write("server.js",server);
write("package.json",JSON.stringify(pkg,null,2)+"\n");
write("BUILD_INFO.json",JSON.stringify(build,null,2)+"\n");
write("public/index.html",index);
write("public/sw.js",sw);
write("public/catalog_manifest.json",JSON.stringify(cat,null,2)+"\n");
write("public/manufacturers_manifest.json",JSON.stringify(makers,null,2)+"\n");
write("tests/v11-smoke.js",smoke);
write("tests/v11.42-quantity.js",quantityTest);
write("RELEASE_NOTES_V11.42.md",notes);

// Parse guards before allowing the deploy to continue.
new Function(app);
new Function(server);
new Function(sw);

for(const marker of [
  'class="article-quantity-input"',
  'class="manual-qty-input"',
  'effectiveSaleValue(p)*itemQuantity(p)',
  'purchaseCostFor(p)*itemQuantity(p)'
]){
  if(!app.includes(marker))throw new Error("V11.42 guard absent: "+marker);
}

console.log("Hydropolis Studio V11.42 appliquée depuis V11.41.");
console.log("Quantités article + éléments libres + calculs + devis + Excel : OK.");
