/* HYDROPOLIS_STUDIO_V11_46 */
(() => {
  "use strict";
  const V = window.HydropolisV1146Pricing;
  if(!V){console.error("[V11.46] moteur de calcul absent");return;}

  const baseItemQuantity=itemQuantity;
  const baseSetProductQuantity=setProductQuantity;
  const baseEnhanceProductQuantities=enhanceProductQuantities;
  const baseRenderQuoteEditor=renderQuoteEditor;
  const baseRenderCatalog=renderCatalog;
  const baseHarmonizeSavedCatalogProducts=harmonizeSavedCatalogProducts;
  const baseAddCatalogProduct=addCatalogProduct;

  const fmt=(n,d=3)=>Number(n||0).toLocaleString("fr-FR",{maximumFractionDigits:d});
  const esc45=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const slug45=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"");

  function isFioSqm(p){return V.isFioraneseSqm(p)}
  function fioRequested(p){return V.requestedSqm(p)}
  function fioLine(p,value){return V.fioraneseLine(p,value)}

  // Important: all existing V11.42/V11.43 totals already multiply by itemQuantity().
  // For Fioranese billed by m², itemQuantity() therefore becomes the *purchased* m²,
  // rounded to whole boxes. requestedSqm remains the user's design surface.
  itemQuantity=function(p){
    return isFioSqm(p)?V.orderedSqm(p):baseItemQuantity(p);
  };
  setProductQuantity=function(id,value){
    const p=(state.selected||[]).find(x=>x.id===id);
    if(!p)return false;
    if(!isFioSqm(p))return baseSetProductQuantity(id,value);
    const requested=V.requestedSqm(p,value);
    p.requestedSqm=requested;
    p.quantity=requested;
    return true;
  };

  function enhanceFioraneseCard(card,p){
    const box=card.querySelector(".article-quantity-compact");
    if(!box||!isFioSqm(p))return;
    const line=fioLine(p);
    box.classList.add("v1146-fio-qty");
    box.innerHTML=`<span>Surface</span>
      <input class="article-quantity-input v1146-fio-input" type="number" min="0.01" step="0.01" value="${fioRequested(p)}" inputmode="decimal" aria-label="Surface souhaitée en m²">
      <small class="v1146-box-summary">${line.boxes} boîte${line.boxes>1?"s":""} · ${fmt(line.orderedSqm)} m² commandés</small>`;
    const input=box.querySelector("input");
    input.onchange=()=>{
      setProductQuantity(p.id,input.value);
      saveState();renderRooms();renderSelection();renderMarginDashboard();
    };
    const oldTotal=card.querySelector(".article-quantity-total");
    if(oldTotal)oldTotal.innerHTML=`Demandé <b>${fmt(line.requestedSqm)} m²</b> · commandé <b>${fmt(line.orderedSqm)} m²</b> · ${line.boxes} boîte${line.boxes>1?"s":""}<br>Total <b>${euro(line.total)} HT</b>`;
  }

  enhanceProductQuantities=function(){
    baseEnhanceProductQuantities();
    document.querySelectorAll(".room-product").forEach(card=>{
      const del=card.querySelector(".del-prod,.fallback-del-prod");
      const p=(state.selected||[]).find(x=>x.id===del?.dataset?.id);
      if(p)enhanceFioraneseCard(card,p);
    });
  };

  renderQuoteEditor=function(){
    baseRenderQuoteEditor();
    const host=document.querySelector("#quoteEditor");if(!host)return;
    host.querySelectorAll('.qe-qty[data-kind="product"]').forEach(input=>{
      const p=(state.selected||[])[Number(input.dataset.index)];
      if(!isFioSqm(p))return;
      input.min="0.01";input.max="99999";input.step="0.01";input.value=String(fioRequested(p));
      const boxes=V.boxCount(p), ordered=V.orderedSqm(p);
      input.title=`Surface souhaitée. Commande réelle : ${fmt(ordered)} m² (${boxes} boîte${boxes>1?"s":""}).`;
      const td=input.closest("td");
      if(td){
        td.classList.add("v1146-fio-quote-qty");
        td.querySelector(".v1146-quote-box-summary")?.remove();
        input.insertAdjacentHTML("afterend",`<small class="v1146-quote-box-summary">${boxes} boîte${boxes>1?"s":""} · ${fmt(ordered)} m² facturés</small>`);
      }
    });
  };

  // Catalog refresh used to overwrite configured finish/designation and would also
  // destroy Fioranese/Resigres runtime choices. Snapshot and restore user/runtime data.
  harmonizeSavedCatalogProducts=function(){
    const fields=[
      "designation","finish","finishCode","quantity","requestedSqm","pricingUnit","sqmPerBox","pcsPerBox",
      "resigresConfiguration","pricingStatus","pricingSource","sourcePage","price","totalPrice","priceOverride",
      "quoteReferenceOverride","quoteDesignationOverride","quoteLeadTimeOverride","quoteUnitOverride","quoteDiscountOverride",
      "leadTime","clientDiscountOverride","catalogPrice","catalogTotalPrice","originalDesignation"
    ];
    const snapshots=new Map((state.selected||[]).map(p=>[p.id,Object.fromEntries(fields.filter(k=>Object.prototype.hasOwnProperty.call(p,k)).map(k=>[k,p[k]]))]));
    baseHarmonizeSavedCatalogProducts();
    for(const p of state.selected||[]){const snap=snapshots.get(p.id);if(snap)Object.assign(p,snap)}
  };

  function postProcessCatalog(){
    document.querySelectorAll("#results .result[data-key]").forEach(card=>{
      const p=CATALOG.find(x=>productKey(x)===card.dataset.key) || serverSearchRows.find(x=>productKey(x)===card.dataset.key);
      if(!p)return;
      const price=card.querySelector(".price");
      const button=card.querySelector("button.add");
      const internal=card.querySelector(".price-box .internal");
      if(/^Fioranese$/i.test(p.manufacturer||"") && p.pricingUnit==="sqm" && Number(p.sqmPerBox)>0){
        if(price)price.innerHTML=`${euro(p.price)} HT <small>/m²</small>`;
        if(internal)internal.innerHTML=`Boîte : <b>${fmt(p.sqmPerBox)} m²</b>${p.pcsPerBox?` · ${p.pcsPerBox} pce${p.pcsPerBox>1?"s":""}`:""}`;
      }else if(/^Fioranese$/i.test(p.manufacturer||"") && p.pricingUnit==="piece"){
        if(price)price.innerHTML=`${euro(p.price)} HT <small>/pièce</small>`;
      }
      if(p.configuratorType==="fioranese-source"){
        if(price)price.textContent="Tarif PDF";
        if(button)button.textContent="Voir la collection";
        if(internal)internal.textContent=p.sourcePage?`Tarif 2025 · pages ${p.sourcePage}`:"Tarif 2025 · chiffrage depuis le PDF";
      }
      if(p.configuratorType==="resigres"){
        if(price)price.textContent="À configurer";
        if(button)button.textContent="Configurer";
        if(internal)internal.textContent=`Tarif Resigres 2026 · page ${p.sourcePage||"—"}`;
      }
    });
  }
  renderCatalog=function(){baseRenderCatalog();postProcessCatalog()};

  let resigresConfigPromise=null;
  function loadResigresConfig(){
    if(!resigresConfigPromise)resigresConfigPromise=fetch("/resigres_2026_config.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()});
    return resigresConfigPromise;
  }
  function closeResigresConfigurator(){document.querySelector("#resigresConfigurator")?.remove()}
  function optionHtml(items){return (items||[]).map(x=>`<option value="${esc45(x)}">${esc45(x)}</option>`).join("")}

  function modelCfg(config,p){return V.modelConfig(config,p.resigresModel,p.resigresKind)||null}
  function variantCfg(model,id){return V.variantConfig(model,id)||null}
  function finishOptions(model,variant){return variant?.finishOptions||model?.finishOptions||[]}
  function materialOptions(variant){return variant?.materialOptions||[]}
  function sizeOptions(variant){return variant?.sizeOptions||[]}

  async function openResigresConfigurator(p,roomId){
    closeResigresConfigurator();
    const config=await loadResigresConfig();
    const model=modelCfg(config,p)||{};
    const variants=model.variants||[{id:"default",label:p.resigresModel||p.designation}];
    const sourcePage=p.sourcePage||model.sourcePage||"";
    const isDims=/shower-tray|basin-top|furniture-basin-top|furniture|mirror|accessory/.test(p.resigresKind||"");
    const overlay=document.createElement("div");
    overlay.id="resigresConfigurator";overlay.className="v1146-modal-overlay";
    overlay.innerHTML=`<div class="v1146-modal" role="dialog" aria-modal="true" aria-labelledby="rgTitle">
      <div class="v1146-modal-head"><div><div class="eyebrow">Resigres 2026 · tarifs intégrés</div><h2 id="rgTitle">${esc45(p.resigresModel||p.designation)}</h2><p>Le tarif 2026 est calculé automatiquement quand la grille est certifiée. Aucune valeur illisible du PDF n’est extrapolée.</p></div><button type="button" class="icon rg-close" aria-label="Fermer">×</button></div>
      <div class="v1146-source-note"><b>Source :</b> Tarif Resigres FR 2026 · page ${esc45(sourcePage||"—")} ${p.manufacturerUrl?`· <a href="${esc45(p.manufacturerUrl)}" target="_blank" rel="noopener">site fabricant ↗</a>`:""}</div>
      <div class="v1146-field-grid">
        <label class="v1146-span-2">Version<select id="rgVariant">${variants.map(x=>`<option value="${esc45(x.id)}">${esc45(x.label)}</option>`).join("")}</select></label>
        <label class="rg-finish">Finition<select id="rgFinish"></select></label>
        <label class="rg-color">Coloris<select id="rgColor"></select></label>
        ${isDims?'<label>Largeur (cm)<input id="rgWidth" type="number" min="1" step="0.1"></label><label>Longueur / hauteur (cm)<input id="rgLength" type="number" min="1" step="0.1"></label>':""}
        <label class="rg-material hidden">Matière<select id="rgMaterial"></select></label>
        <label class="rg-size hidden">Dimension<select id="rgSize"></select></label>
        <label class="v1146-span-2 rg-ral hidden">Référence RAL/NCS<input id="rgRal" placeholder="ex. RAL 7031"></label>
        <label class="v1146-span-2">Détails / options de configuration<input id="rgDetails" placeholder="ex. position bonde, 2 vasques, retombée…"></label>
      </div>
      <div id="rgKnownOptions" class="v1146-known-options"></div>
      <div class="v1146-pricing-panel"><div><b id="rgPriceTitle">Prix public HT calculé</b><small id="rgPriceHelp">Calcul issu du tarif Resigres 2026.</small></div><div id="rgAutoPrice" class="v1146-auto-price">—</div><input id="rgBasePrice" class="hidden" type="number" min="0.01" step="0.01" placeholder="0,00"></div>
      <div id="rgCalc" class="v1146-calc"></div>
      <div class="v1146-modal-error" aria-live="polite"></div>
      <div class="v1146-modal-actions"><button type="button" class="btn ghost rg-cancel">Annuler</button><button type="button" class="btn primary rg-confirm">Ajouter la configuration</button></div>
    </div>`;
    document.body.appendChild(overlay);
    const $r=s=>overlay.querySelector(s);
    const global=config.global||{};

    function renderVariantFields(){
      const variant=variantCfg(model,$r("#rgVariant")?.value)||variants[0];
      let finishes=finishOptions(model,variant),materials=materialOptions(variant),sizes=sizeOptions(variant);
      if(!finishes.length&&!materials.length&&!sizes.length)finishes=global.finishes||[];
      if(!materials.length&&p.resigresKind==="bath")materials=["Solid Surface","Laquée","Acrylique brillant","Acrylique mat"];
      const finishWrap=$r(".rg-finish"),matWrap=$r(".rg-material"),sizeWrap=$r(".rg-size");
      if(finishWrap){finishWrap.classList.toggle("hidden",!finishes.length);$r("#rgFinish").innerHTML=optionHtml(finishes)}
      if(matWrap){matWrap.classList.toggle("hidden",!materials.length);$r("#rgMaterial").innerHTML=optionHtml(materials)}
      if(sizeWrap){sizeWrap.classList.toggle("hidden",!sizes.length);$r("#rgSize").innerHTML=optionHtml(sizes)}
      const colors=global.standardColors||[];$r("#rgColor").innerHTML=optionHtml(colors)+='<option value="RAL/NCS">RAL/NCS</option>';
      renderSupplements();update();
    }
    function renderSupplements(){
      const rules=model.supplements||[];const host=$r("#rgKnownOptions");
      if(!rules.length){host.innerHTML="";return}
      host.innerHTML='<b>Suppléments tarifaires</b>'+rules.filter(x=>x.autoWhen!=="ral").map(rule=>rule.type==="perCm"
        ?`<label><span>${esc45(rule.label)} · ${fmt(rule.amount,2)} €/cm</span><input data-rule-input="${esc45(rule.input)}" type="number" min="0" step="0.1" value="0"></label>`
        :`<label><input type="checkbox" data-rule="${esc45(rule.id)}"><span>${esc45(rule.label)} · +${euro(rule.amount)} HT</span></label>`).join("");
      host.querySelectorAll("input").forEach(x=>x.addEventListener("input",update));
    }
    function readSelection(){
      const options=[...overlay.querySelectorAll("[data-rule]:checked")].map(x=>x.dataset.rule);
      const selection={model:p.resigresModel,kind:p.resigresKind,variant:$r("#rgVariant")?.value||"",finish:$r("#rgFinish")?.value||"",color:$r("#rgColor")?.value||"",widthCm:Number($r("#rgWidth")?.value)||null,lengthCm:Number($r("#rgLength")?.value)||null,size:$r("#rgSize")?.value||"",material:$r("#rgMaterial")?.value||"",details:$r("#rgDetails")?.value||"",ralNcs:$r("#rgRal")?.value||"",options};
      overlay.querySelectorAll("[data-rule-input]").forEach(x=>selection[x.dataset.ruleInput]=Number(x.value)||0);
      return selection;
    }
    function update(){
      const selection=readSelection();$r(".rg-ral")?.classList.toggle("hidden",selection.color!=="RAL/NCS");
      const q=V.resigresQuote(config,selection,$r("#rgBasePrice")?.value);
      const auto=q.status==="automatic";
      $r("#rgBasePrice").classList.toggle("hidden",auto);
      $r("#rgAutoPrice").classList.toggle("hidden",!auto);
      $r("#rgPriceTitle").textContent=auto?"Prix public HT calculé":"Prix public HT de base";
      $r("#rgPriceHelp").textContent=auto?(q.breakdown+` · page ${q.rule?.sourcePage||sourcePage}`):(q.reason+`. Saisissez le prix uniquement pour cette cellule.`);
      if(auto)$r("#rgAutoPrice").textContent=euro(q.basePrice);
      $r("#rgCalc").innerHTML=`<span>Base : <b>${euro(q.basePrice||0)}</b> · suppléments : <b>${euro(q.supplements.total)}</b></span><strong>Total public HT : ${euro(q.total)}</strong>${q.supplements.applied.length?`<small>${q.supplements.applied.map(x=>esc45(x.label)+" +"+euro(x.amount)).join(" · ")}</small>`:""}`;
      overlay._rgQuote=q;
    }
    $r("#rgVariant").addEventListener("change",renderVariantFields);
    $r("#rgColor").addEventListener("change",update);
    overlay.querySelectorAll("input,select").forEach(x=>{if(x.id!=="rgVariant")x.addEventListener("input",update);if(x.tagName==="SELECT"&&x.id!=="rgVariant")x.addEventListener("change",update)});
    const close=()=>closeResigresConfigurator();$r(".rg-close").onclick=close;$r(".rg-cancel").onclick=close;overlay.addEventListener("click",e=>{if(e.target===overlay)close()});
    $r(".rg-confirm").onclick=()=>{
      const err=$r(".v1146-modal-error"),selection=readSelection();
      if(selection.color==="RAL/NCS"&&!String(selection.ralNcs||"").trim()){err.textContent="Indiquez la référence RAL/NCS.";return}
      const q=V.resigresQuote(config,selection,$r("#rgBasePrice").value);
      if(!(q.total>0)){err.textContent=q.reason||"Tarif non déterminé.";return}
      const variant=variantCfg(model,selection.variant);const dims=selection.widthCm&&selection.lengthCm?`${fmt(selection.widthCm,1)} × ${fmt(selection.lengthCm,1)} cm`:selection.size;
      const designation=[variant?.label||p.resigresModel,dims,selection.finish||selection.material,selection.color,selection.details].filter(Boolean).join(" · ");
      const configured={...p,reference:`${p.reference}-CFG-${Date.now().toString(36).toUpperCase()}`,designation,finish:[selection.finish||selection.material,selection.color].filter(Boolean).join(" · "),price:q.total,totalPrice:q.total,pricingStatus:q.pricingStatus,pricingSource:`Tarif Resigres FR 2026 · p.${q.rule?.sourcePage||sourcePage}`,resigresConfiguration:{...selection,basePrice:q.basePrice,baseBreakdown:q.breakdown||"",supplements:q.supplements.applied,total:q.total,sourcePage:q.rule?.sourcePage||sourcePage},configOriginReference:p.reference,configuratorType:"resigres-configured"};
      const record=createSelectedProductRecord(configured,roomId,"");if(!record){err.textContent="Impossible de préparer la configuration.";return}
      Object.assign(record,{resigresConfiguration:configured.resigresConfiguration,pricingStatus:configured.pricingStatus,pricingSource:configured.pricingSource,price:q.total,totalPrice:q.total,catalogPrice:q.total,catalogTotalPrice:q.total,originalDesignation:designation});commitSelectedRecords([record],{showProject:true});close();
    };
    renderVariantFields();$r("#rgVariant")?.focus();
  }

  addCatalogProduct=function(ref,roomId,key=""){
    const p=productFromCatalogSources(ref,key);
    if(p?.configuratorType==="resigres"){openResigresConfigurator(p,normalizedRoomId(roomId)).catch(e=>{console.error("[Resigres configurator]",e);alert("Configurateur Resigres indisponible : "+e.message)});return}
    if(p?.configuratorType==="fioranese-source"){
      const page=p.sourcePage?` pages ${p.sourcePage}`:"";const msg=`${p.collection} : cette collection est indexée mais ses cellules tarifaires ne sont pas encore assez sûres pour créer un prix automatique. Consultez le tarif Fioranese 2025${page}.`;
      if(p.manufacturerUrl)window.open(p.manufacturerUrl,"_blank","noopener");if(typeof toast==="function")toast(msg);else alert(msg);return;
    }
    return baseAddCatalogProduct(ref,roomId,key);
  };

  // Add an explicit note in room cards for configured Resigres lines.
  const baseRenderRooms=renderRooms;
  renderRooms=function(){
    baseRenderRooms();
    document.querySelectorAll(".room-product").forEach(card=>{
      const id=card.querySelector(".del-prod,.fallback-del-prod")?.dataset?.id;
      const p=(state.selected||[]).find(x=>x.id===id);
      if(!p?.resigresConfiguration)return;
      if(card.querySelector(".v1146-resigres-summary"))return;
      const host=card.querySelector(".price-total")||card;
      const c=p.resigresConfiguration;
      host.insertAdjacentHTML("beforeend",`<div class="v1146-resigres-summary"><b>Resigres configuré</b> · ${esc45([c.widthCm&&c.lengthCm?`${fmt(c.widthCm,1)} × ${fmt(c.lengthCm,1)} cm`:c.size,c.finish,c.color].filter(Boolean).join(" · "))}<small>Prix saisi depuis tarif 2026 · p.${esc45(c.sourcePage||p.sourcePage||"—")}</small></div>`);
    });
  };

  // Run bootstrap only after all V11.45 overrides are installed. The consolidation
  // installer removes the legacy direct bootstrap() call from app.js.
  Promise.resolve(bootstrap()).catch(e=>console.error("[Hydropolis V11.46 bootstrap]",e));
})();
