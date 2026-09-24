#!/usr/bin/env node
"use strict";

const fs=require("fs");
const path=require("path");
const root=process.cwd();
const file=r=>path.join(root,r);
const read=r=>fs.readFileSync(file(r),"utf8");
const write=(r,d)=>fs.writeFileSync(file(r),d,"utf8");

function replaceOnce(src,a,b,label){
  if(src.includes(b))return src;
  const n=src.split(a).length-1;
  if(n!==1)throw new Error(`V11.43 — ${label}: attendu 1 bloc, trouvé ${n}`);
  return src.replace(a,()=>b);
}
function replaceBetween(src,startMarker,endMarker,newText,label){
  const a=src.indexOf(startMarker);
  const b=src.indexOf(endMarker,a+startMarker.length);
  if(a<0||b<0)throw new Error(`V11.43 — ${label}: bornes introuvables`);
  return src.slice(0,a)+newText+"\n"+src.slice(b);
}
function insertBeforeFunctionEnd(src,startMarker,nextMarker,injection,label){
  const a=src.indexOf(startMarker), b=src.indexOf(nextMarker,a);
  if(a<0||b<0)throw new Error(`V11.43 — ${label}: fonction introuvable`);
  const block=src.slice(a,b), close=block.lastIndexOf("}");
  if(close<0)throw new Error(`V11.43 — ${label}: accolade finale introuvable`);
  return src.slice(0,a)+block.slice(0,close)+injection+block.slice(close)+src.slice(b);
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

if(app.includes("/* V11.43_EDITABLE_QUOTE */")){
  console.log("Hydropolis V11.43 déjà appliquée.");
  process.exit(0);
}

if(!app.includes("V11.42_NATIVE_QUANTITY_V4")){
  throw new Error("V11.43 attend que apply-v11.42-native.js soit exécuté avant.");
}

/* V11.43_EDITABLE_QUOTE */

const quoteHelpers=`
function quoteTextOverride(obj,key,fallback=""){
  if(obj && Object.prototype.hasOwnProperty.call(obj,key))return String(obj[key]??"");
  return String(fallback??"");
}
function quoteLineReference(p){return quoteTextOverride(p,"quoteReferenceOverride",p?.reference||"")}
function quoteLineDesignation(p){return quoteTextOverride(p,"quoteDesignationOverride",clientFacingDesignation(p))}
function quoteLineLeadTime(p){return quoteTextOverride(p,"quoteLeadTimeOverride",p?.leadTime||"")}
function quoteLineUnit(p){
  const raw=p?.quoteUnitOverride;
  if(raw!==undefined && raw!==null && raw!=="" && Number.isFinite(Number(raw)))return Math.max(0,Number(raw));
  return articleListTotal(p);
}
function quoteLineDiscount(p){
  const raw=p?.quoteDiscountOverride;
  if(raw!==undefined && raw!==null && raw!=="" && Number.isFinite(Number(raw)))return clampPercent(raw);
  return effectiveDiscountRate(p);
}
function quoteLineNetUnit(p){return quoteLineUnit(p)*(1-quoteLineDiscount(p)/100)}
function manualItemQuantity(m){return normalizedQuantity(m?.quantity)}
function manualQuoteReference(m){return quoteTextOverride(m,"quoteReferenceOverride","")}
function manualQuoteDesignation(m){return quoteTextOverride(m,"quoteDesignationOverride",m?.label||"")}
function manualQuoteLeadTime(m){return quoteTextOverride(m,"quoteLeadTimeOverride",m?.leadTime||"")}
function manualQuoteUnit(m){
  const raw=m?.quoteUnitOverride;
  if(raw!==undefined && raw!==null && raw!=="" && Number.isFinite(Number(raw)))return Math.max(0,Number(raw));
  return Math.max(0,Number(m?.price)||0);
}
function manualQuoteDiscount(m){
  const raw=m?.quoteDiscountOverride;
  if(raw!==undefined && raw!==null && raw!=="" && Number.isFinite(Number(raw)))return clampPercent(raw);
  return clientDiscountRate();
}
function manualQuoteNetUnit(m){return manualQuoteUnit(m)*(1-manualQuoteDiscount(m)/100)}
function clearQuoteLineOverrides(obj){
  ["quoteReferenceOverride","quoteDesignationOverride","quoteLeadTimeOverride","quoteUnitOverride","quoteDiscountOverride"].forEach(k=>delete obj[k]);
}
`;

app=replaceOnce(app,
  "function supplierDiscountRate(manufacturer){",
  quoteHelpers+"\nfunction supplierDiscountRate(manufacturer){",
  "helpers devis"
);

app=replaceOnce(app,
  `return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+articleListTotal(p)*itemQuantity(p),0);`,
  `return (state.selected||[]).filter(isRealSelectedProduct).reduce((sum,p)=>sum+quoteLineUnit(p)*itemQuantity(p),0);`,
  "total articles devis"
);

app=replaceOnce(app,
  `return (state.rooms||[]).reduce((sum,r)=>sum+validManualItemsForRoom(r).reduce((s,m)=>s+Number(m.price||0),0),0);`,
  `return (state.rooms||[]).reduce((sum,r)=>sum+validManualItemsForRoom(r).reduce((s,m)=>s+manualQuoteUnit(m)*manualItemQuantity(m),0),0);`,
  "total éléments libres devis"
);

const financials=`function projectFinancials(){
  const productList=selectedCatalogTotal();
  const manualList=selectedManualTotal();
  const list=productList+manualList;

  const productsNet=(state.selected||[]).filter(isRealSelectedProduct)
    .reduce((sum,p)=>sum+quoteLineNetUnit(p)*itemQuantity(p),0);
  const manualNet=(state.rooms||[]).reduce((sum,r)=>
    sum+validManualItemsForRoom(r).reduce((s,m)=>s+manualQuoteNetUnit(m)*manualItemQuantity(m),0),0);
  const netBeforeShipping=productsNet+manualNet;
  const discountAmount=list-netBeforeShipping;

  const shipping=Math.max(0,Number(state.commercial?.shippingFee)||0);
  const recorSupplierShipping=recorAutomaticSupplierShipping();
  const supplierShippingManual=manualSupplierShipping();
  const supplierShipping=supplierShippingManual+recorSupplierShipping;
  const net=netBeforeShipping+shipping+supplierShipping;

  const purchaseProducts=projectPurchaseCost();
  const purchase=purchaseProducts+shipping+supplierShipping;

  const margin=productsNet-purchaseProducts;
  const marginOnSales=productsNet>0?margin/productsNet*100:0;
  const marginOnCost=purchaseProducts>0?margin/purchaseProducts*100:0;

  const vatRate=clampPercent(state.commercial?.vatRate??20);
  const vat=net*vatRate/100;

  return {
    list,discountRate:clientDiscountRate(),discountAmount,
    productsNet,manualNet,shipping,supplierShipping,supplierShippingManual,recorSupplierShipping,net,
    purchase,purchaseProducts,margin,marginOnSales,marginOnCost,
    vatRate,vat,ttc:net+vat,catalogNet:productsNet
  };
}`;
app=replaceBetween(app,"function projectFinancials(){","function commercialPriceHtml",financials,"calculs devis");

const editorFunctions=`
function quoteEditorRows(){
  const rows=[];
  for(const room of state.rooms||[]){
    (state.selected||[]).forEach((p,sourceIndex)=>{
      if(p.roomId!==room.id || !isRealSelectedProduct(p))return;
      rows.push({
        kind:"product",sourceIndex,roomId:room.id,room:room.title,
        manufacturer:p.manufacturer||"",finish:p.finish||"",
        reference:quoteLineReference(p),designation:quoteLineDesignation(p),
        leadTime:quoteLineLeadTime(p),qty:itemQuantity(p),
        unit:quoteLineUnit(p),discount:quoteLineDiscount(p),
        total:quoteLineNetUnit(p)*itemQuantity(p)
      });
    });
    validManualItemsForRoom(room).forEach((m,manualIndex)=>{
      rows.push({
        kind:"manual",manualIndex,roomId:room.id,room:room.title,
        manufacturer:"Élément libre",finish:"",
        reference:manualQuoteReference(m),designation:manualQuoteDesignation(m),
        leadTime:manualQuoteLeadTime(m),qty:manualItemQuantity(m),
        unit:manualQuoteUnit(m),discount:manualQuoteDiscount(m),
        total:manualQuoteNetUnit(m)*manualItemQuantity(m)
      });
    });
  }
  return rows;
}
function quoteEditorTarget(el){
  if(el.dataset.kind==="product")return (state.selected||[])[Number(el.dataset.index)];
  const room=roomById(el.dataset.room);
  return room?.manual?.[Number(el.dataset.manual)]||null;
}
function quoteEditorAttributes(row){
  return row.kind==="product"
    ? 'data-kind="product" data-index="'+row.sourceIndex+'"'
    : 'data-kind="manual" data-room="'+esc(row.roomId)+'" data-manual="'+row.manualIndex+'"';
}
function renderQuoteEditor(){
  const host=$("#quoteEditor");if(!host)return;
  const rows=quoteEditorRows();

  if(!rows.length){
    host.innerHTML='<div class="margin-empty">Ajoutez des articles au projet pour construire le devis.</div>';
  }else{
    host.innerHTML='<div class="quote-editor-wrap"><table class="quote-editor-table">'+
      '<thead><tr><th>Pièce</th><th>Référence</th><th>Désignation</th><th>Délai</th><th>Qté</th><th>PU HT</th><th>Remise</th><th>Total HT</th><th></th></tr></thead>'+
      '<tbody>'+rows.map(row=>{
        const attrs=quoteEditorAttributes(row);
        return '<tr>'+
          '<td class="qe-room"><b>'+esc(row.room)+'</b><small>'+esc(row.manufacturer)+(row.finish?' · '+esc(row.finish):'')+'</small></td>'+
          '<td><input class="qe-input qe-ref" '+attrs+' value="'+esc(row.reference)+'"></td>'+
          '<td><input class="qe-input qe-designation" '+attrs+' value="'+esc(row.designation)+'"></td>'+
          '<td><input class="qe-input qe-lead" '+attrs+' value="'+esc(row.leadTime)+'" placeholder="Délai"></td>'+
          '<td><input class="qe-input qe-qty" '+attrs+' type="number" min="1" max="999" step="1" value="'+row.qty+'"></td>'+
          '<td><input class="qe-input qe-unit" '+attrs+' type="number" min="0" step="0.01" value="'+Number(row.unit||0).toFixed(2)+'"></td>'+
          '<td><div class="qe-percent"><input class="qe-input qe-discount" '+attrs+' type="number" min="0" max="100" step="0.1" value="'+Number(row.discount||0).toFixed(1)+'"><span>%</span></div></td>'+
          '<td class="qe-total">'+euro(row.total)+'</td>'+
          '<td><button type="button" class="tiny qe-reset" '+attrs+' title="Réinitialiser cette ligne">↺</button></td>'+
        '</tr>';
      }).join('')+'</tbody></table></div>';
  }

  const commit=(el,key,mode="text")=>{
    const target=quoteEditorTarget(el);if(!target)return;
    if(mode==="qty"){
      if(el.dataset.kind==="product")setProductQuantity(target.id,el.value);
      else target.quantity=normalizedQuantity(el.value);
    }else if(mode==="money"){
      target[key]=Math.max(0,Number(el.value)||0);
    }else if(mode==="percent"){
      target[key]=clampPercent(el.value);
    }else{
      target[key]=String(el.value||"");
    }
    saveState();renderMarginDashboard();
  };

  $$(".qe-ref",host).forEach(el=>el.onchange=()=>commit(el,"quoteReferenceOverride"));
  $$(".qe-designation",host).forEach(el=>el.onchange=()=>commit(el,"quoteDesignationOverride"));
  $$(".qe-lead",host).forEach(el=>el.onchange=()=>commit(el,"quoteLeadTimeOverride"));
  $$(".qe-qty",host).forEach(el=>el.onchange=()=>commit(el,"quantity","qty"));
  $$(".qe-unit",host).forEach(el=>el.onchange=()=>commit(el,"quoteUnitOverride","money"));
  $$(".qe-discount",host).forEach(el=>el.onchange=()=>commit(el,"quoteDiscountOverride","percent"));

  $$(".qe-reset",host).forEach(btn=>btn.onclick=()=>{
    const target=quoteEditorTarget(btn);if(!target)return;
    clearQuoteLineOverrides(target);saveState();renderMarginDashboard();
  });

  const reset=$("#resetQuoteEditorBtn");
  if(reset)reset.onclick=()=>{
    if(!confirm("Réinitialiser les modifications du devis ? Les quantités du projet seront conservées."))return;
    (state.selected||[]).forEach(clearQuoteLineOverrides);
    (state.rooms||[]).forEach(r=>validManualItemsForRoom(r).forEach(clearQuoteLineOverrides));
    saveState();renderMarginDashboard();
  };
}
`;

app=replaceOnce(app,
  "function renderMarginDashboard(){",
  editorFunctions+"\nfunction renderMarginDashboard(){",
  "éditeur devis"
);

app=replaceOnce(app,
`      const list=ps.reduce((s,p)=>s+articleListTotal(p),0);
      const sale=ps.reduce((s,p)=>s+effectiveSaleValue(p),0);
      const cost=ps.reduce((s,p)=>s+purchaseCostFor(p),0);`,
`      const qty=ps.reduce((s,p)=>s+itemQuantity(p),0);
      const list=ps.reduce((s,p)=>s+quoteLineUnit(p)*itemQuantity(p),0);
      const sale=ps.reduce((s,p)=>s+quoteLineNetUnit(p)*itemQuantity(p),0);
      const cost=ps.reduce((s,p)=>s+purchaseCostFor(p)*itemQuantity(p),0);`,
  "marge fabricant"
);

app=replaceOnce(app,
`return \`<tr><td>\${m}</td><td>\${ps.length}</td><td>\${euro(list)}</td>`,
`return \`<tr><td>\${m}</td><td>\${qty}</td><td>\${euro(list)}</td>`,
  "quantité marge fabricant"
);

app=insertBeforeFunctionEnd(
  app,
  "function renderMarginDashboard(){",
  "function bindCommercial(){",
  "\n  renderQuoteEditor();\n",
  "appel éditeur devis"
);

const quoteRows=`function quoteRows(){
  const rows=[];
  for(const room of state.rooms||[]){
    (state.selected||[]).forEach((p,sourceIndex)=>{
      if(p.roomId!==room.id || !isRealSelectedProduct(p))return;
      const qty=itemQuantity(p);
      const unit=quoteLineUnit(p);
      const discount=quoteLineDiscount(p);
      rows.push({
        room:room.title,reference:quoteLineReference(p),designation:quoteLineDesignation(p),finish:p.finish||"",
        manufacturer:p.manufacturer||"",qty,unit,netUnit:unit*(1-discount/100),
        freight:0,leadTime:quoteLineLeadTime(p),manual:false,discount,sourceIndex,sourceId:p.id||""
      });
    });
    validManualItemsForRoom(room).forEach((m,manualIndex)=>{
      const qty=manualItemQuantity(m);
      const unit=manualQuoteUnit(m);
      const discount=manualQuoteDiscount(m);
      rows.push({
        room:room.title,reference:manualQuoteReference(m),designation:manualQuoteDesignation(m),finish:"",
        manufacturer:"Élément libre",qty,unit,netUnit:unit*(1-discount/100),
        freight:0,leadTime:manualQuoteLeadTime(m),manual:true,discount,roomId:room.id,manualIndex
      });
    });
  }
  return rows;
}`;
app=replaceBetween(app,"function quoteRows(){","function quotePages(startNo){",quoteRows,"une ligne par article");

app=replaceOnce(app,
`const product=row.manual?null:(state.selected||[]).find(p=>p.manufacturer===row.manufacturer&&p.reference===row.reference&&String(p.finish||"")===String(row.finish||""));`,
`const product=row.manual?null:((Number.isInteger(row.sourceIndex)?(state.selected||[])[row.sourceIndex]:null) || (state.selected||[]).find(p=>p.manufacturer===row.manufacturer&&p.reference===row.reference&&String(p.finish||"")===String(row.finish||"")));`,
"Excel lié à la ligne source"
);

// Nouvelle carte dans Marge & devis.
const marginStart=index.indexOf('id="view-margin"');
const previewStart=index.indexOf('<section id="view-preview"',marginStart);
if(marginStart<0||previewStart<0)throw new Error("Sections marge/preview introuvables");
let marginBlock=index.slice(marginStart,previewStart);
const closePos=marginBlock.lastIndexOf("</section>");
if(closePos<0)throw new Error("Fermeture section marge introuvable");

const quoteCard=`
  <div class="card quote-editor-card">
    <div class="section-head quote-editor-head">
      <div>
        <div class="eyebrow">Devis</div>
        <h2>Devis modifiable</h2>
        <p>Une ligne par article. Les modifications sont reprises dans le devis client, le PDF, l’Excel et le calcul de marge.</p>
      </div>
      <button type="button" class="btn ghost" id="resetQuoteEditorBtn">Réinitialiser les modifications</button>
    </div>
    <div id="quoteEditor"></div>
  </div>
`;
marginBlock=marginBlock.slice(0,closePos)+quoteCard+marginBlock.slice(closePos);
index=index.slice(0,marginStart)+marginBlock+index.slice(previewStart);

css+=`
/* V11.43 — devis modifiable */
.quote-editor-card{margin-top:18px}
.quote-editor-head{align-items:flex-start;gap:20px}
.quote-editor-head p{margin:5px 0 0;color:var(--muted);font-size:12px;max-width:820px}
.quote-editor-wrap{overflow-x:auto;margin-top:12px}
.quote-editor-table{width:100%;min-width:1180px;border-collapse:separate;border-spacing:0}
.quote-editor-table th{padding:8px 7px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--line);white-space:nowrap}
.quote-editor-table td{padding:7px;border-bottom:1px solid var(--line);vertical-align:middle}
.quote-editor-table tbody tr:hover{background:#faf8f4}
.qe-room small{display:block;margin-top:3px;font-size:9px;color:var(--muted);font-weight:400}
.qe-input{width:100%;box-sizing:border-box;min-width:0;padding:7px 8px;border:1px solid var(--line);border-radius:7px;background:#fff;font-size:11px}
.qe-designation{min-width:260px}
.qe-percent{display:grid;grid-template-columns:1fr auto;align-items:center;gap:4px}
.qe-percent span{font-size:10px;color:var(--muted)}
.qe-total{font-weight:800;white-space:nowrap}
.qe-reset{font-size:14px;min-width:30px}
@media(max-width:900px){.quote-editor-head{display:block}.quote-editor-head button{margin-top:10px}}
`;

index=index
  .replace(/V11\.42/g,"V11.43")
  .replace(/styles\.css\?v=11\.42-v4/g,"styles.css?v=11.43-quote")
  .replace(/app\.js\?v=11\.42-v4/g,"app.js?v=11.43-quote");
server=server.replace(/V11\.42/g,"V11.43");
sw=sw
  .replace(/hydropolis-v11-42-v4-shell/g,"hydropolis-v11-43-quote-shell")
  .replace(/hydropolis-v11-42-v4-catalogs/g,"hydropolis-v11-43-quote-catalogs");

pkg.version="11.43.0";
pkg.description="Hydropolis Studio V11.43 - devis modifiable ligne par ligne";
pkg.scripts.start="node server.js";

write("public/app.js",app);
write("public/styles.css",css);
write("public/index.html",index);
write("public/sw.js",sw);
write("server.js",server);
write("package.json",JSON.stringify(pkg,null,2)+"\n");

// Contrôles bloquants.
new Function(app);
new Function(server);
new Function(sw);

const qStart=app.indexOf("function quoteRows(){");
const qEnd=app.indexOf("function quotePages(startNo){",qStart);
const qBlock=app.slice(qStart,qEnd);

for(const marker of [
  "function renderQuoteEditor()",
  "function quoteEditorRows()",
  "function quoteLineUnit(p)",
  'id="quoteEditor"',
  "quoteLineNetUnit(p)*itemQuantity(p)",
  "Number.isInteger(row.sourceIndex)"
]){
  if(!(app.includes(marker)||index.includes(marker)))throw new Error("Contrôle V11.43 absent : "+marker);
}
if(qBlock.includes("grouped"))throw new Error("V11.43 : quoteRows groupe encore des articles.");

console.log("Hydropolis Studio V11.43 OK.");
console.log("Devis modifiable : une ligne par article, PDF/Excel/marge synchronisés.");
