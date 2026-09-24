#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const file = rel => path.join(root, rel);
const read = rel => fs.readFileSync(file(rel), "utf8");
const write = (rel, data) => fs.writeFileSync(file(rel), data, "utf8");

function replaceOnce(src, oldText, newText, label){
  if(src.includes(newText)) return src;
  const n = src.split(oldText).length - 1;
  if(n !== 1){
    throw new Error(`V11.42 quantity patch — ${label}: attendu 1 bloc, trouvé ${n}`);
  }
  return src.replace(oldText, newText);
}

if(!fs.existsSync(file("public/app.js")) ||
   !fs.existsSync(file("public/styles.css")) ||
   !fs.existsSync(file("public/index.html")) ||
   !fs.existsSync(file("server.js"))){
  throw new Error("V11.42 quantity patch : lancer depuis la racine du dépôt Hydropolis.");
}

let app = read("public/app.js");

if(app.includes("/* V11.42_NATIVE_QUANTITY */")){
  console.log("Hydropolis V11.42 quantity patch déjà appliqué.");
  process.exit(0);
}

app = replaceOnce(app,
`function articleListTotal(p){
  return articleMerchandisePrice(p);
}`,
`function articleListTotal(p){
  return articleMerchandisePrice(p);
}

/* V11.42_NATIVE_QUANTITY */
function normalizedQuantity(v){
  const n=Math.floor(Number(v));
  return Number.isFinite(n)&&n>=1?Math.min(999,n):1;
}
function itemQuantity(p){return normalizedQuantity(p?.quantity);}
function setProductQuantity(id,value){
  const p=(state.selected||[]).find(x=>x.id===id);
  if(!p)return false;
  const q=normalizedQuantity(value);
  p.quantity=q;
  for(const child of (state.selected||[])){
    if(child?.accessoryFor===p.id)child.quantity=q;
  }
  return true;
}
function enhanceProductQuantities(){
  $$(".room-product").forEach(card=>{
    const id=$(".del-prod",card)?.dataset?.id;
    const p=(state.selected||[]).find(x=>x.id===id);
    const host=$(".price-total",card);
    if(!p||!host||$(".article-quantity-compact",host))return;

    host.insertAdjacentHTML("afterbegin",\`
      <div class="article-quantity-compact">
        <span>Qté</span>
        <button class="quantity-step qty-dec" data-id="\${p.id}" type="button" aria-label="Diminuer la quantité">−</button>
        <input class="article-quantity-input" data-id="\${p.id}" type="number" min="1" max="999" step="1" value="\${itemQuantity(p)}" inputmode="numeric">
        <button class="quantity-step qty-inc" data-id="\${p.id}" type="button" aria-label="Augmenter la quantité">+</button>
      </div>
      <div class="article-quantity-total">\${itemQuantity(p)>1?\`PU \${euro(articleListTotal(p))} · \`:""}Total \${euro(articleListTotal(p)*itemQuantity(p))} HT</div>
    \`);
  });

  $$(".qty-dec").forEach(b=>b.onclick=()=>{
    const p=(state.selected||[]).find(x=>x.id===b.dataset.id);if(!p)return;
    setProductQuantity(p.id,itemQuantity(p)-1);
    saveState();renderRooms();renderSelection();renderMarginDashboard();
  });

  $$(".qty-inc").forEach(b=>b.onclick=()=>{
    const p=(state.selected||[]).find(x=>x.id===b.dataset.id);if(!p)return;
    setProductQuantity(p.id,itemQuantity(p)+1);
    saveState();renderRooms();renderSelection();renderMarginDashboard();
  });

  $$(".article-quantity-input").forEach(inp=>inp.onchange=()=>{
    if(!setProductQuantity(inp.dataset.id,inp.value))return;
    saveState();renderRooms();renderSelection();renderMarginDashboard();
  });
}`,
"helpers quantité");

app = replaceOnce(app,
`    .reduce((sum,p)=>sum+Math.max(0,Number(p?.mandatoryFreight)||0),0);`,
`    .reduce((sum,p)=>sum+Math.max(0,Number(p?.mandatoryFreight)||0)*itemQuantity(p),0);`,
"port Recor");

app = replaceOnce(app,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+articleListTotal(p),0);`,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+articleListTotal(p)*itemQuantity(p),0);`,
"total catalogue");

app = replaceOnce(app,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+purchaseCostFor(p),0);`,
`return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+purchaseCostFor(p)*itemQuantity(p),0);`,
"coût achat");

app = replaceOnce(app,
`const productsNet=(state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+effectiveSaleValue(p),0);`,
`const productsNet=(state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+effectiveSaleValue(p)*itemQuantity(p),0);`,
"vente nette");

app = replaceOnce(app,
`      const list=ps.reduce((s,p)=>s+articleListTotal(p),0);
      const sale=ps.reduce((s,p)=>s+effectiveSaleValue(p),0);
      const cost=ps.reduce((s,p)=>s+purchaseCostFor(p),0);`,
`      const qty=ps.reduce((s,p)=>s+itemQuantity(p),0);
      const list=ps.reduce((s,p)=>s+articleListTotal(p)*itemQuantity(p),0);
      const sale=ps.reduce((s,p)=>s+effectiveSaleValue(p)*itemQuantity(p),0);
      const cost=ps.reduce((s,p)=>s+purchaseCostFor(p)*itemQuantity(p),0);`,
"marge fabricant");

app = replaceOnce(app,
`return \`<tr><td>\${m}</td><td>\${ps.length}</td><td>\${euro(list)}</td>`,
`return \`<tr><td>\${m}</td><td>\${qty}</td><td>\${euro(list)}</td>`,
"quantité tableau marge");

app = replaceOnce(app,
`      grouped.get(key).qty++;`,
`      grouped.get(key).qty+=itemQuantity(p);`,
"quantité devis Excel");

app = replaceOnce(app,
`function renderRooms(){
  try{
    renderRoomsCore();
  }catch(e){
    renderRoomsFallback(e);
  }
}`,
`function renderRooms(){
  try{
    renderRoomsCore();
    enhanceProductQuantities();
  }catch(e){
    console.error("[V11.42 quantity enhancement]",e);
    renderRoomsFallback(e);
  }
}`,
"hook rendu");

app = replaceOnce(app,
` const priceValue=Math.max(0,Number(p.totalPrice??p.price)||0);
 return \`<article class="board-item board-item-\${idx+1}">`,
` const priceValue=Math.max(0,Number(p.totalPrice??p.price)||0);
 const qty=itemQuantity(p);
 return \`<article class="board-item board-item-\${idx+1}">`,
"quantité présentation");

app = replaceOnce(app,
`     \${state.showSupplierReferences!==false && p.reference?\`<div class="board-ref">Réf. \${esc(p.reference)}</div>\`:""}
     \${state.showClientPrices!==false?\`<div class="price commercial-price">\${isManual?\`\${euro(priceValue)} HT\`:commercialPriceHtml(p.totalPrice??p.price,p)}</div>\`:""}`,
`     \${state.showSupplierReferences!==false && p.reference?\`<div class="board-ref">Réf. \${esc(p.reference)}</div>\`:""}
     <div class="board-quantity">Qté \${qty}</div>
     \${state.showClientPrices!==false?\`<div class="price commercial-price">\${isManual?\`\${euro(priceValue)} HT\`:commercialPriceHtml(p.totalPrice??p.price,p)}</div>\`:""}`,
"affichage quantité présentation");

write("public/app.js", app);

let css = read("public/styles.css");
if(!css.includes("/* V11.42_NATIVE_QUANTITY */")){
  css += `

/* V11.42_NATIVE_QUANTITY */
.article-quantity-compact{
  display:grid;
  grid-template-columns:auto 24px 44px 24px;
  gap:4px;
  align-items:center;
  justify-content:end;
  margin:0 0 5px auto;
  font-size:9px;
  color:var(--muted);
  font-weight:700
}
.article-quantity-compact .quantity-step{
  width:24px;height:24px;padding:0;
  border:1px solid var(--line);
  background:#fff;border-radius:6px;
  cursor:pointer;font-size:15px;line-height:1;color:var(--ink)
}
.article-quantity-compact input{
  width:44px;height:24px;
  box-sizing:border-box;
  padding:2px 3px;
  text-align:center;
  border:1px solid var(--line);
  border-radius:6px;
  font-size:10px;
  font-weight:800;
  background:#fff
}
.article-quantity-total{
  margin-bottom:4px;
  font-size:9px;
  font-weight:700;
  color:#5e5549
}
.board-quantity{
  display:inline-flex;
  margin-top:1mm;
  padding:.6mm 1.4mm;
  border-radius:999px;
  background:#f2eee7;
  color:#77654f;
  font-size:5.5pt;
  font-weight:700
}
`;
}
write("public/styles.css", css);

let index = read("public/index.html");
index = index
  .replace(/Hydropolis Studio V11\.41 · Render/g, "Hydropolis Studio V11.42 · Render")
  .replace(/<em>V11\.41<\/em>/g, "<em>V11.42</em>")
  .replace('href="styles.css"', 'href="styles.css?v=11.42-native"')
  .replace('src="app.js"', 'src="app.js?v=11.42-native"');
write("public/index.html", index);

let server = read("server.js");
server = server
  .replace(/Hydropolis Studio V11\.41/g, "Hydropolis Studio V11.42")
  .replace(/Hydropolis V11\.41/g, "Hydropolis V11.42");
write("server.js", server);

let sw = read("public/sw.js");
sw = sw
  .replace(/hydropolis-v11-41-shell/g, "hydropolis-v11-42-native-shell")
  .replace(/hydropolis-v11-41-catalogs/g, "hydropolis-v11-42-native-catalogs");
write("public/sw.js", sw);

new Function(app);
new Function(server);
new Function(sw);

for(const marker of [
  "function enhanceProductQuantities()",
  "renderRoomsCore();\n    enhanceProductQuantities();",
  "articleListTotal(p)*itemQuantity(p)",
  "purchaseCostFor(p)*itemQuantity(p)",
  "effectiveSaleValue(p)*itemQuantity(p)",
  "grouped.get(key).qty+=itemQuantity(p)",
  'class="article-quantity-input"'
]){
  if(!app.includes(marker)){
    throw new Error("V11.42 quantity patch : contrôle absent — " + marker);
  }
}

console.log("Hydropolis Studio V11.42 quantity patch natif OK.");
console.log("Renderer V11.41 conservé ; quantités injectées après rendu.");
