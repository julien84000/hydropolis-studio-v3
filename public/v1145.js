/* HYDROPOLIS_STUDIO_V11_45 */
(() => {
  "use strict";
  const V = window.HydropolisV1145Pricing;
  if(!V){console.error("[V11.45] moteur de calcul absent");return;}

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
    box.classList.add("v1145-fio-qty");
    box.innerHTML=`<span>Surface</span>
      <input class="article-quantity-input v1145-fio-input" type="number" min="0.01" step="0.01" value="${fioRequested(p)}" inputmode="decimal" aria-label="Surface souhaitée en m²">
      <small class="v1145-box-summary">${line.boxes} boîte${line.boxes>1?"s":""} · ${fmt(line.orderedSqm)} m² commandés</small>`;
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
        td.classList.add("v1145-fio-quote-qty");
        td.querySelector(".v1145-quote-box-summary")?.remove();
        input.insertAdjacentHTML("afterend",`<small class="v1145-quote-box-summary">${boxes} boîte${boxes>1?"s":""} · ${fmt(ordered)} m² facturés</small>`);
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
    if(!resigresConfigPromise)resigresConfigPromise=fetch("/resigres_2026_config.json",{cache:"force-cache"}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()});
    return resigresConfigPromise;
  }
  function closeResigresConfigurator(){document.querySelector("#resigresConfigurator")?.remove()}

  function resigresCommonFields(p,config){
    const g=config.global||{};
    const colors=g.standardColors||[];
    const finishes=g.finishes||[];
    const dims=/shower-tray|basin-top|furniture-basin-top|furniture|mirror|accessory/.test(p.resigresKind||"");
    return `
      <div class="v1145-field-grid">
        <label>Finition<select id="rgFinish">${finishes.map(x=>`<option>${esc45(x)}</option>`).join("")}</select></label>
        <label>Coloris<select id="rgColor">${colors.map(x=>`<option>${esc45(x)}</option>`).join("")}<option>RAL/NCS</option></select></label>
        ${dims?'<label>Largeur (cm)<input id="rgWidth" type="number" min="1" step="0.1"></label><label>Longueur / hauteur (cm)<input id="rgLength" type="number" min="1" step="0.1"></label>':""}
        ${p.resigresKind==="bath"?'<label>Dimension / version<input id="rgSize" placeholder="ex. 170 × 80 cm"></label><label>Matériau<select id="rgMaterial"><option>Solid Surface</option><option>Laquée</option><option>Acrylique brillant</option><option>Acrylique mat</option></select></label>':""}
        <label class="v1145-span-2">Détails / options de configuration<input id="rgDetails" placeholder="ex. 2 vasques, retombée 14 cm, bonde verticale…"></label>
        <label class="v1145-span-2 rg-ral hidden">Référence RAL/NCS<input id="rgRal" placeholder="ex. RAL 7032"></label>
      </div>`;
  }

  async function openResigresConfigurator(p,roomId){
    closeResigresConfigurator();
    const config=await loadResigresConfig();
    const group=config.groups?.[p.resigresKind]||{};
    const sourcePage=p.sourcePage||config.models?.find(x=>x.name===p.resigresModel)?.sourcePage||"";
    const overlay=document.createElement("div");
    overlay.id="resigresConfigurator";overlay.className="v1145-modal-overlay";
    overlay.innerHTML=`<div class="v1145-modal" role="dialog" aria-modal="true" aria-labelledby="rgTitle">
      <div class="v1145-modal-head"><div><div class="eyebrow">Resigres 2026 · configurateur</div><h2 id="rgTitle">${esc45(p.resigresModel||p.designation)}</h2><p>Configurez la variante. Les grilles du tarif qui ne sont pas lisibles sans ambiguïté ne sont jamais extrapolées automatiquement.</p></div><button type="button" class="icon rg-close" aria-label="Fermer">×</button></div>
      <div class="v1145-source-note"><b>Source :</b> Tarif Resigres FR 2026 · page ${esc45(sourcePage||"—")} ${p.manufacturerUrl?`· <a href="${esc45(p.manufacturerUrl)}" target="_blank" rel="noopener">site fabricant ↗</a>`:""}</div>
      ${resigresCommonFields(p,config)}
      <div id="rgKnownOptions" class="v1145-known-options"></div>
      <div class="v1145-pricing-panel">
        <div><b>Prix public HT de base</b><small>À saisir depuis la grille de la page ${esc45(sourcePage||"indiquée")}. Cette saisie est obligatoire tant qu’une cellule de matrice n’est pas certifiée.</small></div>
        <input id="rgBasePrice" type="number" min="0.01" step="0.01" placeholder="0,00">
      </div>
      <div id="rgCalc" class="v1145-calc"></div>
      <div class="v1145-modal-error" aria-live="polite"></div>
      <div class="v1145-modal-actions"><button type="button" class="btn ghost rg-cancel">Annuler</button><button type="button" class="btn primary rg-confirm">Ajouter la configuration</button></div>
    </div>`;
    document.body.appendChild(overlay);
    const $r=s=>overlay.querySelector(s);
    const optionsHost=$r("#rgKnownOptions");
    const supp=Array.isArray(group.knownSupplements)?group.knownSupplements:[];
    if(supp.length){
      optionsHost.innerHTML='<b>Suppléments vérifiés</b>'+supp.map(rule=>rule.type==="perCm"
        ?`<label><span>${esc45(rule.label)} · ${fmt(rule.amount,2)} €/cm</span><input data-rule-input="${esc45(rule.input)}" type="number" min="0" step="0.1" placeholder="cm"></label>`
        :`<label><input type="checkbox" data-rule="${esc45(rule.id)}"><span>${esc45(rule.label)} · +${euro(rule.amount)} HT</span></label>`).join("");
    }
    const update=()=>{
      const selection=readSelection();
      const q=V.resigresManualQuote($r("#rgBasePrice").value,group,selection);
      $r("#rgCalc").innerHTML=`<span>Suppléments vérifiés : <b>${euro(q.supplements.total)}</b></span><strong>Total public HT : ${euro(q.total)}</strong>`;
    };
    const readSelection=()=>{
      const options=[...overlay.querySelectorAll("[data-rule]:checked")].map(x=>x.dataset.rule);
      const selection={model:p.resigresModel,finish:$r("#rgFinish")?.value||"",color:$r("#rgColor")?.value||"",widthCm:Number($r("#rgWidth")?.value)||null,lengthCm:Number($r("#rgLength")?.value)||null,size:$r("#rgSize")?.value||"",material:$r("#rgMaterial")?.value||"",details:$r("#rgDetails")?.value||"",ralNcs:$r("#rgRal")?.value||"",options};
      overlay.querySelectorAll("[data-rule-input]").forEach(x=>selection[x.dataset.ruleInput]=Number(x.value)||0);
      return selection;
    };
    $r("#rgColor")?.addEventListener("change",()=>{$r(".rg-ral")?.classList.toggle("hidden",$r("#rgColor").value!=="RAL/NCS");update()});
    overlay.querySelectorAll("input,select").forEach(x=>x.addEventListener("input",update));
    overlay.querySelectorAll("select").forEach(x=>x.addEventListener("change",update));
    const close=()=>closeResigresConfigurator();
    $r(".rg-close").onclick=close;$r(".rg-cancel").onclick=close;overlay.addEventListener("click",e=>{if(e.target===overlay)close()});
    $r(".rg-confirm").onclick=()=>{
      const err=$r(".v1145-modal-error"),base=Number($r("#rgBasePrice").value)||0;
      if(base<=0){err.textContent=`Saisissez le prix public HT lu dans le tarif Resigres 2026, page ${sourcePage||"indiquée"}.`;return;}
      const selection=readSelection();
      if(selection.color==="RAL/NCS"&&!String(selection.ralNcs||"").trim()){err.textContent="Indiquez la référence RAL/NCS.";return;}
      const quote=V.resigresManualQuote(base,group,selection);
      const dims=selection.widthCm&&selection.lengthCm?`${fmt(selection.widthCm,1)} × ${fmt(selection.lengthCm,1)} cm`:selection.size;
      const designation=[p.resigresModel,dims,selection.finish,selection.color,selection.details].filter(Boolean).join(" · ");
      const configured={...p,
        reference:`${p.reference}-CFG-${Date.now().toString(36).toUpperCase()}`,
        designation,finish:[selection.finish,selection.color].filter(Boolean).join(" · "),
        price:quote.total,totalPrice:quote.total,pricingStatus:"manual-verified-from-pdf",pricingSource:`Tarif Resigres FR 2026 · p.${sourcePage}`,
        resigresConfiguration:{...selection,basePrice:base,supplements:quote.supplements.applied,total:quote.total,sourcePage},
        configOriginReference:p.reference,configuratorType:"resigres-configured"
      };
      const record=createSelectedProductRecord(configured,roomId,"");
      if(!record){err.textContent="Impossible de préparer la configuration.";return;}
      Object.assign(record,{resigresConfiguration:configured.resigresConfiguration,pricingStatus:configured.pricingStatus,pricingSource:configured.pricingSource,price:quote.total,totalPrice:quote.total,catalogPrice:quote.total,catalogTotalPrice:quote.total,originalDesignation:designation});
      commitSelectedRecords([record],{showProject:true});
      close();
    };
    update();
    $r("#rgFinish")?.focus();
  }

  addCatalogProduct=function(ref,roomId,key=""){
    const p=productFromCatalogSources(ref,key);
    if(p?.configuratorType==="resigres"){
      openResigresConfigurator(p,normalizedRoomId(roomId)).catch(e=>{console.error("[Resigres configurator]",e);alert("Configurateur Resigres indisponible : "+e.message)});
      return;
    }
    if(p?.configuratorType==="fioranese-source"){
      const page=p.sourcePage?` pages ${p.sourcePage}`:"";
      const msg=`${p.collection} : cette collection est indexée mais ses cellules tarifaires ne sont pas encore assez sûres pour créer un prix automatique. Consultez le tarif Fioranese 2025${page}.`;
      if(p.manufacturerUrl)window.open(p.manufacturerUrl,"_blank","noopener");
      if(typeof toast==="function")toast(msg);else alert(msg);
      return;
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
      if(card.querySelector(".v1145-resigres-summary"))return;
      const host=card.querySelector(".price-total")||card;
      const c=p.resigresConfiguration;
      host.insertAdjacentHTML("beforeend",`<div class="v1145-resigres-summary"><b>Resigres configuré</b> · ${esc45([c.widthCm&&c.lengthCm?`${fmt(c.widthCm,1)} × ${fmt(c.lengthCm,1)} cm`:c.size,c.finish,c.color].filter(Boolean).join(" · "))}<small>Prix saisi depuis tarif 2026 · p.${esc45(c.sourcePage||p.sourcePage||"—")}</small></div>`);
    });
  };

  // Run bootstrap only after all V11.45 overrides are installed. The consolidation
  // installer removes the legacy direct bootstrap() call from app.js.
  Promise.resolve(bootstrap()).catch(e=>console.error("[Hydropolis V11.45 bootstrap]",e));
})();
