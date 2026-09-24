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
  if(n !== 1) throw new Error(`V11.42 V3 — ${label}: attendu 1 bloc, trouvé ${n}`);
  return src.replace(oldText, newText);
}

for(const required of ["public/app.js","public/styles.css","public/index.html","public/sw.js","server.js"]){
  if(!fs.existsSync(file(required))) throw new Error("Fichier manquant : "+required);
}

let app = read("public/app.js");

if(app.includes("/* V11.42_NATIVE_QUANTITY_V3 */")){
  console.log("Hydropolis V11.42 V3 déjà appliquée.");
  process.exit(0);
}

/*
  V3 : correctif précis du bug trouvé sur la V2.
  $() = querySelector (un élément)
  $$() = querySelectorAll (tableau)
  La V2 appelait $(".room-product").forEach(...), donc la quantité ne pouvait jamais s'afficher.
*/
app = replaceOnce(app,
`function articleListTotal(p){
  return articleMerchandisePrice(p);
}`,
`function articleListTotal(p){
  return articleMerchandisePrice(p);
}

/* V11.42_NATIVE_QUANTITY_V3 */
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
    try{
      if($(".article-quantity-compact",card))return;

      const deleteButton=$(".del-prod",card)||$(".fallback-del-prod",card);
      const id=deleteButton?.dataset?.id;
      const p=(state.selected||[]).find(x=>x.id===id);
      const host=$(".price-total",card);
      if(!p||!host)return;

      const box=document.createElement("div");
      box.className="article-quantity-compact";
      box.innerHTML=\`<span>Qté</span>
        <button class="quantity-step" type="button" aria-label="Diminuer la quantité">−</button>
        <input class="article-quantity-input" type="number" min="1" max="999" step="1" value="\${itemQuantity(p)}" inputmode="numeric">
        <button class="quantity-step" type="button" aria-label="Augmenter la quantité">+</button>\`;

      const dec=box.children[1], input=box.children[2], inc=box.children[3];

      dec.onclick=()=>{
        setProductQuantity(p.id,itemQuantity(p)-1);
        saveState();renderRooms();renderSelection();renderMarginDashboard();
      };
      inc.onclick=()=>{
        setProductQuantity(p.id,itemQuantity(p)+1);
        saveState();renderRooms();renderSelection();renderMarginDashboard();
      };
      input.onchange=()=>{
        setProductQuantity(p.id,input.value);
        saveState();renderRooms();renderSelection();renderMarginDashboard();
      };

      host.prepend(box);

      const total=document.createElement("div");
      total.className="article-quantity-total";
      total.textContent=(itemQuantity(p)>1?\`PU \${euro(articleListTotal(p))} · \`:"")+
        \`Total \${euro(articleListTotal(p)*itemQuantity(p))} HT\`;
      box.insertAdjacentElement("afterend",total);
    }catch(err){
      console.warn("[quantity UI]",err);
    }
  });
}`,
"helpers quantité");

// Calculs quantité.
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
`      grouped.get(key).qty++;`,
`      grouped.get(key).qty+=itemQuantity(p);`,
"devis Excel");

// Rendre le renderer détaillé plus tolérant aux anciennes données de projet.
app = replaceOnce(app,
`value="${(p.designation||"").replace(/"/g,"&quot;")}"`,
`value="${String(p.designation||"").replace(/"/g,"&quot;")}"`,
"désignation robuste");

app = replaceOnce(app,
`value="${((p.technicalSheetUrl||"").startsWith("blob:")?"":(p.technicalSheetUrl||"")).replace(/"/g,"&quot;")}"`,
`value="${(String(p.technicalSheetUrl||"").startsWith("blob:")?"":String(p.technicalSheetUrl||"")).replace(/"/g,"&quot;")}"`,
"URL fiche technique robuste");

app = replaceOnce(app,
`value="${(p.leadTime||"").replace(/"/g,"&quot;")}"`,
`value="${String(p.leadTime||"").replace(/"/g,"&quot;")}"`,
"délai robuste");

// La quantité est ajoutée après le renderer. Elle ne peut pas provoquer le fallback.
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
  }catch(e){
    renderRoomsFallback(e);
  }
  try{enhanceProductQuantities()}catch(e){console.warn("[V11.42 quantity enhancement]",e)}
}`,
"rendu sécurisé");

// Si un fallback subsiste, afficher la vraie erreur afin qu'elle soit immédiatement identifiable.
app = replaceOnce(app,
`    <span>Une donnée produit a empêché l’affichage détaillé ; les produits du projet restent accessibles ci-dessous.</span>`,
`    <span>Une donnée produit a empêché l’affichage détaillé ; les produits du projet restent accessibles ci-dessous.</span>
    <small class="project-render-error">${'${'}esc(error?.message||"Erreur inconnue")}</small>`,
"diagnostic fallback");

write("public/app.js", app);

// CSS minimal.
let css = read("public/styles.css");
if(!css.includes("/* V11.42_NATIVE_QUANTITY_V3 */")){
  css += `

/* V11.42_NATIVE_QUANTITY_V3 */
.article-quantity-compact{
  display:grid;grid-template-columns:auto 24px 44px 24px;gap:4px;
  align-items:center;justify-content:end;margin:0 0 5px auto;
  font-size:9px;color:var(--muted);font-weight:700
}
.article-quantity-compact .quantity-step{
  width:24px;height:24px;padding:0;border:1px solid var(--line);
  background:#fff;border-radius:6px;cursor:pointer;font-size:15px;line-height:1
}
.article-quantity-compact input{
  width:44px;height:24px;box-sizing:border-box;padding:2px 3px;
  text-align:center;border:1px solid var(--line);border-radius:6px;
  font-size:10px;font-weight:800;background:#fff
}
.article-quantity-total{margin-bottom:4px;font-size:9px;font-weight:700;color:#5e5549}
.project-render-error{display:block;margin-top:5px;font-size:9px;color:#8b4a38}
`;
}
write("public/styles.css", css);

// Version + cache-busting unique V3.
let index = read("public/index.html");
index = index
  .replace(/Hydropolis Studio V11\.41 · Render/g, "Hydropolis Studio V11.42 · Render")
  .replace(/<em>V11\.41<\/em>/g, "<em>V11.42</em>")
  .replace('href="styles.css"', 'href="styles.css?v=11.42-v3"')
  .replace('src="app.js"', 'src="app.js?v=11.42-v3"');
write("public/index.html", index);

let server = read("server.js");
server = server
  .replace(/Hydropolis Studio V11\.41/g, "Hydropolis Studio V11.42")
  .replace(/Hydropolis V11\.41/g, "Hydropolis V11.42");
write("server.js", server);

let sw = read("public/sw.js");
sw = sw
  .replace(/hydropolis-v11-41-shell/g, "hydropolis-v11-42-v3-shell")
  .replace(/hydropolis-v11-41-catalogs/g, "hydropolis-v11-42-v3-catalogs");
write("public/sw.js", sw);

// Vérifications.
new Function(app);
new Function(server);
new Function(sw);

for(const marker of [
  "V11.42_NATIVE_QUANTITY_V3",
  '$$(".room-product").forEach',
  'class="article-quantity-input"',
  "grouped.get(key).qty+=itemQuantity(p)",
  "try{enhanceProductQuantities()}",
  "project-render-error"
]){
  if(!app.includes(marker)) throw new Error("Contrôle V11.42 V3 absent : "+marker);
}

if(app.includes('$(".room-product").forEach')){
  throw new Error("Ancien bug querySelector encore présent.");
}

console.log("Hydropolis Studio V11.42 V3 OK.");
console.log("Bug quantité corrigé : querySelectorAll ($$) utilisé.");
