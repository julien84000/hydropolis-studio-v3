/* HYDROPOLIS_STUDIO_V11_48 */
(() => {
  "use strict";
  const V48=window.HydropolisV1148Pricing;
  const V46=window.HydropolisV1146Pricing;
  if(!V48||!V46){console.error("[V11.48] moteur Resigres incomplet");return;}

  const baseAddCatalogProduct=addCatalogProduct;
  const esc48=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt48=(n,d=2)=>Number(n||0).toLocaleString("fr-FR",{maximumFractionDigits:d});
  let configPromise=null;
  function loadConfig(){if(!configPromise)configPromise=fetch("/resigres_2026_config.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()});return configPromise}
  function close(){document.querySelector("#resigresConfigurator")?.remove()}
  function optionHtml(items,placeholder="Choisir…"){
    return `<option value="">${esc48(placeholder)}</option>`+(items||[]).map(x=>{
      const id=typeof x==="string"?x:x.id,label=typeof x==="string"?x:(x.label||x.id);return `<option value="${esc48(id)}">${esc48(label)}</option>`
    }).join("");
  }
  function sourcePageOf(p,model,q){return q?.rule?.sourcePage||model?.dependencyMatrix?.sourcePage||model?.sourcePage||p.sourcePage||""}
  function commonShell(p,model,sourcePage,body){
    const overlay=document.createElement("div");overlay.id="resigresConfigurator";overlay.className="v1146-modal-overlay v1148-modal-overlay";
    overlay.innerHTML=`<div class="v1146-modal v1148-modal" role="dialog" aria-modal="true" aria-labelledby="rgTitle">
      <div class="v1146-modal-head"><div><div class="eyebrow">Resigres 2026 · configurateur dépendant</div><h2 id="rgTitle">${esc48(p.resigresModel||p.designation)}</h2><p>Chaque choix filtre le suivant. Une combinaison non disponible dans le tarif fabricant n’est jamais proposée.</p></div><button type="button" class="icon rg-close" aria-label="Fermer">×</button></div>
      <div class="v1146-source-note"><b>Source :</b> Tarif Resigres FR 2026 · page ${esc48(sourcePage||"—")} ${p.manufacturerUrl?`· <a href="${esc48(p.manufacturerUrl)}" target="_blank" rel="noopener">site fabricant ↗</a>`:""}</div>
      ${body}
      <div class="v1146-modal-error" aria-live="polite"></div>
      <div class="v1146-modal-actions"><button type="button" class="btn ghost rg-cancel">Annuler</button><button type="button" class="btn primary rg-confirm">Ajouter la configuration</button></div>
    </div>`;
    document.body.appendChild(overlay);
    const x=overlay.querySelector.bind(overlay);x(".rg-close").onclick=close;x(".rg-cancel").onclick=close;overlay.addEventListener("click",e=>{if(e.target===overlay)close()});return overlay;
  }
  function commitConfigured(p,roomId,selection,q,model){
    const dims=selection.sizeLabel||(selection.widthCm&&selection.lengthCm?`${fmt48(selection.widthCm,1)} × ${fmt48(selection.lengthCm,1)} cm`:selection.size||"");
    const variantLabel=(model?.variants||[]).find(x=>x.id===selection.variant)?.label||"";
    const colorLabel=selection.colorLabel||selection.color||"";
    const designation=[variantLabel||p.resigresModel,dims,selection.materialLabel||selection.material,selection.finish,colorLabel,selection.details].filter(Boolean).join(" · ");
    const finish=[selection.materialLabel||selection.material,selection.finish,colorLabel].filter(Boolean).join(" · ");
    const page=sourcePageOf(p,model,q);
    const configured={...p,reference:`${p.reference}-CFG-${Date.now().toString(36).toUpperCase()}`,designation,finish,price:q.total,totalPrice:q.total,pricingStatus:q.pricingStatus,pricingSource:`Tarif Resigres FR 2026 · p.${page}`,resigresConfiguration:{...selection,basePrice:q.basePrice,baseBreakdown:q.breakdown||"",supplements:q.supplements?.applied||[],total:q.total,sourcePage:page},configOriginReference:p.reference,configuratorType:"resigres-configured"};
    const record=createSelectedProductRecord(configured,roomId,"");if(!record)throw new Error("Impossible de préparer la configuration.");
    Object.assign(record,{resigresConfiguration:configured.resigresConfiguration,pricingStatus:configured.pricingStatus,pricingSource:configured.pricingSource,price:q.total,totalPrice:q.total,catalogPrice:q.total,catalogTotalPrice:q.total,originalDesignation:designation});
    commitSelectedRecords([record],{showProject:true});close();
  }

  function openDependent(p,roomId,config,model){
    const matrix=model.dependencyMatrix,sourcePage=matrix.sourcePage||model.sourcePage||p.sourcePage||"";
    const overlay=commonShell(p,model,sourcePage,`<div class="v1148-flow"><div class="v1148-step active"><span>1</span><b>Dimension</b></div><div class="v1148-step"><span>2</span><b>Matière</b></div><div class="v1148-step"><span>3</span><b>Finition / couleur</b></div></div>
      <div class="v1146-field-grid v1148-dependent-grid">
        <label class="v1146-span-2">1. Dimension<select id="rg48Size">${optionHtml(matrix.sizes,"Choisir une dimension…")}</select></label>
        <label class="v1146-span-2 rg48-material hidden">2. Matière<select id="rg48Material"></select></label>
        <label class="v1146-span-2 rg48-color hidden">3. Finition / couleur<select id="rg48Color"></select></label>
        <label class="v1146-span-2 rg48-ral hidden">Référence RAL/NCS<input id="rg48Ral" placeholder="ex. RAL 7031 ou NCS S 2005-Y20R"></label>
        <label class="v1146-span-2">Détails complémentaires<input id="rg48Details" placeholder="Option ou précision client éventuelle"></label>
      </div>
      <div class="v1148-compat-note" id="rg48Compat">Commencez par choisir la dimension.</div>
      <div class="v1146-pricing-panel"><div><b>Prix public HT</b><small id="rg48PriceHelp">Le tarif apparaîtra après les trois choix.</small></div><div id="rg48Price" class="v1146-auto-price">—</div></div>
      <div id="rg48Calc" class="v1146-calc"></div>`);
    const $r=s=>overlay.querySelector(s),sizeSel=$r("#rg48Size"),matSel=$r("#rg48Material"),colSel=$r("#rg48Color");
    function selection(){
      const size=V48.sizeOption(matrix,sizeSel.value),mat=V48.materialOption(size,matSel.value),col=V48.colorOption(mat,colSel.value);
      return {model:p.resigresModel,kind:p.resigresKind,size:sizeSel.value,sizeLabel:size?.label||"",widthCm:size?.widthCm||null,lengthCm:size?.lengthCm||null,material:matSel.value,materialLabel:mat?.label||"",finish:mat?.finish||"",color:colSel.value,colorLabel:col?.label||"",ralNcs:$r("#rg48Ral")?.value||"",details:$r("#rg48Details")?.value||"",options:[]};
    }
    function updatePrice(){
      const s=selection(),q=V48.quote(config,s,0);overlay._rg48Quote=q;
      const auto=q.status==="automatic";$r("#rg48Price").textContent=auto?euro(q.basePrice):"—";$r("#rg48PriceHelp").textContent=auto?`${q.breakdown} · page ${sourcePage}`:q.reason||"Choix incomplet";
      $r("#rg48Calc").innerHTML=auto?`<span>Base : <b>${euro(q.basePrice)}</b></span><strong>Total public HT : ${euro(q.total)}</strong>`:"";
      const selectedSize=V48.sizeOption(matrix,sizeSel.value),selectedMat=V48.materialOption(selectedSize,matSel.value);
      if(selectedMat)$r("#rg48Compat").innerHTML=`<b>${esc48(selectedSize.label)}</b> → ${esc48(selectedMat.label)} → ${colSel.value?esc48(V48.colorOption(selectedMat,colSel.value)?.label||colSel.value):"choisissez la finition/couleur"}`;
    }
    function onSize(){
      const size=V48.sizeOption(matrix,sizeSel.value);matSel.innerHTML=optionHtml(size?.materials||[],"Choisir la matière…");matSel.value="";colSel.innerHTML=optionHtml([],"Choisir d’abord la matière…");colSel.value="";
      $r(".rg48-material").classList.toggle("hidden",!size);$r(".rg48-color").classList.add("hidden");$r(".rg48-ral").classList.add("hidden");
      const allowed=(size?.materials||[]).map(x=>x.label).join(" / ");$r("#rg48Compat").innerHTML=size?`Pour <b>${esc48(size.label)}</b>, matières disponibles : <b>${esc48(allowed)}</b>.`:"Commencez par choisir la dimension.";updatePrice();
    }
    function onMaterial(){
      const size=V48.sizeOption(matrix,sizeSel.value),mat=V48.materialOption(size,matSel.value);colSel.innerHTML=optionHtml(mat?.colors||[],"Choisir la finition / couleur…");colSel.value="";$r(".rg48-color").classList.toggle("hidden",!mat);$r(".rg48-ral").classList.add("hidden");
      const allowed=(mat?.colors||[]).map(x=>x.label).join(" / ");$r("#rg48Compat").innerHTML=mat?`<b>${esc48(mat.label)}</b> : ${esc48(allowed)}.`:`Choisissez la matière.`;updatePrice();
    }
    function onColor(){
      const size=V48.sizeOption(matrix,sizeSel.value),mat=V48.materialOption(size,matSel.value),col=V48.colorOption(mat,colSel.value);$r(".rg48-ral").classList.toggle("hidden",!col?.customCode);if(!col?.customCode)$r("#rg48Ral").value="";updatePrice();
    }
    sizeSel.addEventListener("change",onSize);matSel.addEventListener("change",onMaterial);colSel.addEventListener("change",onColor);$r("#rg48Ral").addEventListener("input",updatePrice);$r("#rg48Details").addEventListener("input",updatePrice);
    $r(".rg-confirm").onclick=()=>{const err=$r(".v1146-modal-error"),s=selection(),q=V48.quote(config,s,0),size=V48.sizeOption(matrix,s.size),mat=V48.materialOption(size,s.material),col=V48.colorOption(mat,s.color);if(!size){err.textContent="Choisissez la dimension.";return}if(!mat){err.textContent="Choisissez la matière.";return}if(!col){err.textContent="Choisissez la finition / couleur.";return}if(col.customCode&&!String(s.ralNcs||"").trim()){err.textContent="Indiquez la référence RAL/NCS.";return}if(!(q.total>0)){err.textContent=q.reason||"Tarif non déterminé.";return}commitConfigured(p,roomId,s,q,model)};
    sizeSel.focus();
  }

  function openGeneric(p,roomId,config,model){
    const sourcePage=model.sourcePage||p.sourcePage||"",variants=model.variants||[],hasVariant=variants.length>1,kind=p.resigresKind||model.kind||"";
    const needsDims=/shower-tray|basin-top|furniture-basin-top|furniture|accessory/.test(kind),hasSize=(model.variants||[]).some(v=>Array.isArray(v.sizeOptions)&&v.sizeOptions.length);
    const overlay=commonShell(p,model,sourcePage,`<div class="v1148-safe-note">Les listes affichées sont limitées aux choix explicitement certifiés pour ce modèle. Si le tarif n’est pas encore matricé, le prix reste saisissable manuellement sans inventer de combinaison.</div>
      <div class="v1146-field-grid">
        ${hasVariant?`<label class="v1146-span-2">Version<select id="rg48Variant">${optionHtml(variants,"Choisir une version…")}</select></label>`:""}
        ${needsDims?'<label>Largeur (cm)<input id="rg48Width" type="number" min="1" step="0.1"></label><label>Longueur / hauteur (cm)<input id="rg48Length" type="number" min="1" step="0.1"></label>':""}
        ${hasSize?'<label class="v1146-span-2 rg48-size">Dimension<select id="rg48Size"></select></label>':""}
        <label class="v1146-span-2 rg48-finish hidden">Finition / matière<select id="rg48Finish"></select></label>
        <label class="v1146-span-2 rg48-color hidden">Coloris<select id="rg48Color"></select></label>
        <label class="v1146-span-2 rg48-ral hidden">Référence RAL/NCS<input id="rg48Ral" placeholder="ex. RAL 7031"></label>
        <label class="v1146-span-2">Détails / options<input id="rg48Details" placeholder="Configuration complémentaire"></label>
      </div>
      <div id="rg48Options" class="v1146-known-options"></div>
      <div class="v1146-pricing-panel"><div><b id="rg48PriceTitle">Prix public HT</b><small id="rg48PriceHelp">Calcul automatique si la grille est certifiée.</small></div><div id="rg48AutoPrice" class="v1146-auto-price hidden">—</div><input id="rg48ManualPrice" type="number" min="0.01" step="0.01" placeholder="Prix HT lu dans le tarif"></div>
      <div id="rg48Calc" class="v1146-calc"></div>`);
    const $r=s=>overlay.querySelector(s);
    function variant(){const id=$r("#rg48Variant")?.value||variants[0]?.id||"";return (variants||[]).find(x=>x.id===id)||variants[0]||null}
    function renderChoices(reset=true){
      const v=variant(),finishes=V48.genericFinishes(config,model,v?.id);const f=$r("#rg48Finish");if(f){f.innerHTML=optionHtml(finishes,"Choisir une finition…");if(reset)f.value="";$r(".rg48-finish").classList.toggle("hidden",!finishes.length)}
      const sizes=v?.sizeOptions||[];const s=$r("#rg48Size");if(s){s.innerHTML=optionHtml(sizes,"Choisir une dimension…");if(reset)s.value=""}
      renderColor(true);renderOptions();update();
    }
    function renderColor(reset=true){const finish=$r("#rg48Finish")?.value||"",colors=V48.finishColors(config,finish),c=$r("#rg48Color");if(c){c.innerHTML=optionHtml(colors,"Choisir un coloris…");if(reset)c.value="";$r(".rg48-color").classList.toggle("hidden",!finish||!colors.length)}$r(".rg48-ral")?.classList.toggle("hidden",true)}
    function renderOptions(){const host=$r("#rg48Options"),rules=model.supplements||[];if(!rules.length){host.innerHTML="";return}host.innerHTML='<b>Options tarifaires vérifiées</b>'+rules.filter(x=>x.autoWhen!=="ral").map(rule=>rule.type==="perCm"?`<label><span>${esc48(rule.label)} · ${fmt48(rule.amount)} €/cm</span><input data-rule-input="${esc48(rule.input)}" type="number" min="0" step="0.1" value="0"></label>`:`<label><input type="checkbox" data-rule="${esc48(rule.id)}"><span>${esc48(rule.label)} · +${euro(rule.amount)} HT</span></label>`).join("");host.querySelectorAll("input").forEach(x=>x.addEventListener("input",update))}
    function selection(){const opts=[...overlay.querySelectorAll("[data-rule]:checked")].map(x=>x.dataset.rule),finish=$r("#rg48Finish")?.value||"",color=$r("#rg48Color")?.value||"";const s={model:p.resigresModel,kind,variant:$r("#rg48Variant")?.value||variants[0]?.id||"",finish,color,widthCm:Number($r("#rg48Width")?.value)||null,lengthCm:Number($r("#rg48Length")?.value)||null,size:$r("#rg48Size")?.value||"",details:$r("#rg48Details")?.value||"",ralNcs:$r("#rg48Ral")?.value||"",options:opts};overlay.querySelectorAll("[data-rule-input]").forEach(x=>s[x.dataset.ruleInput]=Number(x.value)||0);return s}
    function update(){const s=selection();$r(".rg48-ral")?.classList.toggle("hidden",s.color!=="RAL/NCS");const q=V48.quote(config,s,$r("#rg48ManualPrice")?.value);overlay._rg48Quote=q;const auto=q.status==="automatic";$r("#rg48AutoPrice").classList.toggle("hidden",!auto);$r("#rg48ManualPrice").classList.toggle("hidden",auto);$r("#rg48PriceTitle").textContent=auto?"Prix public HT calculé":"Prix public HT de base";$r("#rg48PriceHelp").textContent=auto?`${q.breakdown||"Grille certifiée"} · page ${sourcePage}`:((q.reason||"Tarif automatique non certifié")+". Saisie manuelle autorisée pour cette configuration uniquement.");if(auto)$r("#rg48AutoPrice").textContent=euro(q.basePrice);$r("#rg48Calc").innerHTML=`<span>Base : <b>${euro(q.basePrice||0)}</b> · suppléments : <b>${euro(q.supplements?.total||0)}</b></span><strong>Total public HT : ${euro(q.total||0)}</strong>`}
    $r("#rg48Variant")?.addEventListener("change",()=>renderChoices(true));$r("#rg48Finish")?.addEventListener("change",()=>{renderColor(true);update()});$r("#rg48Color")?.addEventListener("change",update);overlay.querySelectorAll("input,select").forEach(el=>{if(!["rg48Variant","rg48Finish","rg48Color"].includes(el.id)){el.addEventListener("input",update);if(el.tagName==="SELECT")el.addEventListener("change",update)}});
    $r(".rg-confirm").onclick=()=>{const err=$r(".v1146-modal-error"),s=selection(),q=V48.quote(config,s,$r("#rg48ManualPrice")?.value);if(s.color==="RAL/NCS"&&!String(s.ralNcs||"").trim()){err.textContent="Indiquez la référence RAL/NCS.";return}if(!(q.total>0)){err.textContent=q.reason||"Indiquez un prix public HT pour cette configuration.";return}commitConfigured(p,roomId,s,q,model)};
    renderChoices(false);($r("#rg48Variant")||$r("#rg48Width")||$r("#rg48Finish")||$r("#rg48Details"))?.focus();
  }

  async function openConfigurator(p,roomId){close();const config=await loadConfig(),model=V48.modelConfig(config,p.resigresModel,p.resigresKind)||{};if(model.dependencyMatrix?.type==="dependent-combinations")return openDependent(p,roomId,config,model);return openGeneric(p,roomId,config,model)}

  addCatalogProduct=function(ref,roomId,key=""){
    const p=productFromCatalogSources(ref,key);
    if(p?.configuratorType==="resigres"){openConfigurator(p,normalizedRoomId(roomId)).catch(e=>{console.error("[Resigres V11.48]",e);alert("Configurateur Resigres indisponible : "+e.message)});return}
    return baseAddCatalogProduct(ref,roomId,key);
  };
})();
