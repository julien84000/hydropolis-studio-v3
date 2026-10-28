(function(root){
  "use strict";
  const model=root.HydroSbordoniModel;
  const SUPPORTED_COLLECTIONS=model.collections;
  const rows=()=>typeof CATALOG!=="undefined"?CATALOG:[];
  const familyFrom=model.familyFrom;
  const holesFrom=model.holesFrom;
  const supportLabel=model.supportLabel;
  const familyRows=(c,f)=>model.familyRows(rows(),c,f);
  const familiesForCollection=c=>model.families(rows(),c);
  const collections=()=>SUPPORTED_COLLECTIONS.filter(c=>familiesForCollection(c).length);
  const dimensionFor=(c,f)=>model.spec(c,f)?.[0]||0;
  const canonicalImage=(c,f)=>model.image(c,f);
  const resultImage=(c,f,s)=>model.image(c,f,s);
  const supportGroups=(c,f)=>model.supportGroups(rows(),c,f);
  const basinVariant=(c,f,h)=>familyRows(c,f).find(p=>holesFrom(p)===String(h))||null;
  const basinDesignation=(c,f,h)=>model.designation(c,f,h);
  const catalogImage=p=>familyFrom(p)?canonicalImage(p.collection,familyFrom(p)):(p?.image||"");
  const eligible=p=>!!familyFrom(p);

  function imageHtml(src,alt){
    if(!src)return `<span class="recor-choice-thumb recor-choice-thumb-empty">Visuel</span>`;
    return `<span class="recor-choice-thumb"><img src="${esc(src)}" alt="${esc(alt||"")}" loading="eager"></span>`;
  }

  function close(){
    document.getElementById("sbordoniConfigurator")?.remove();
  }

  function open(p,roomId){
    const editing=!!(p?.id && p?.sbordoniConfiguration);
    const saved=p?.sbordoniConfiguration||{};
    const initialCollection=(saved.collection&&familiesForCollection(saved.collection).length)?saved.collection:(p?.collection&&familiesForCollection(p.collection).length?p.collection:collections()[0]);
    const initialFamily=String(saved.family||familyFrom(p)||familiesForCollection(initialCollection)[0]||"");
    const savedSupportRef=String(saved.supportRef||"");
    const initialGroup=supportGroups(initialCollection,initialFamily).find(g=>g.items.some(x=>String(x.reference||"")===savedSupportRef));
    const draft={
      collection:initialCollection,
      family:initialFamily,
      holes:String(saved.holes||holesFrom(p)||"1"),
      supportKey:initialGroup?.key||"",
      supportRef:savedSupportRef
    };
    const overlay=document.createElement("div");
    overlay.id="sbordoniConfigurator";
    overlay.className="recor-configurator-overlay sbordoni-configurator-overlay";
    document.body.appendChild(overlay);

    function normalizeState(){
      const cols=collections();
      if(!cols.includes(draft.collection))draft.collection=cols[0]||"";
      const fams=familiesForCollection(draft.collection);
      if(!fams.includes(draft.family))draft.family=fams[0]||"";
      const variants=["1","3"].filter(h=>basinVariant(draft.collection,draft.family,h));
      if(!variants.includes(draft.holes))draft.holes=variants[0]||"";
      const groups=supportGroups(draft.collection,draft.family);
      if(draft.supportKey && !groups.some(g=>g.key===draft.supportKey)){
        draft.supportKey="";draft.supportRef="";
      }
      if(draft.supportKey){
        const group=groups.find(g=>g.key===draft.supportKey);
        if(group && !group.items.some(x=>x.reference===draft.supportRef)){
          draft.supportRef=group.representative?.reference||group.items[0]?.reference||"";
        }
      }
    }

    function render(){
      normalizeState();
      const cols=collections();
      const fams=familiesForCollection(draft.collection);
      const variants=["1","3"].map(h=>basinVariant(draft.collection,draft.family,h)).filter(Boolean);
      const basin=basinVariant(draft.collection,draft.family,draft.holes) || variants[0] || null;
      const groups=supportGroups(draft.collection,draft.family);
      const selectedGroup=groups.find(g=>g.key===draft.supportKey)||null;
      const selectedSupport=selectedGroup?.items.find(x=>x.reference===draft.supportRef) || selectedGroup?.representative || null;
      const basinImg=canonicalImage(draft.collection,draft.family);
      const finalImg=resultImage(draft.collection,draft.family,selectedSupport) || basinImg;
      const total=Number(basin?.totalPrice??basin?.price??0)+Number(selectedSupport?.totalPrice??selectedSupport?.price??0);
      const dim=dimensionFor(draft.collection,draft.family);

      overlay.innerHTML=`<div class="recor-configurator" role="dialog" aria-modal="true" aria-labelledby="sbordoniConfigTitle">
        <div class="recor-config-head">
          <div>
            <div class="eyebrow">Sbordoni · ${editing?"modifier la configuration":"configurateur de collection"}</div>
            <h2 id="sbordoniConfigTitle">${esc(draft.collection||"Sbordoni")}</h2>
            <p>Choisissez le lavabo, le perçage puis, si souhaité, son piètement. Le perçage 1 ou 3 trous conserve le même visuel de vasque.</p>
          </div>
          <button type="button" class="icon sbordoni-config-close" aria-label="Fermer">×</button>
        </div>

        <div class="recor-config-section">
          <div class="recor-config-title"><b>1. Collection</b><span>Choix de la collection Sbordoni</span></div>
          <div class="sbordoni-collection-gallery" role="group" aria-label="Choisir une collection Sbordoni">
            ${cols.map(c=>{const f=familiesForCollection(c)[0];const img=f?canonicalImage(c,f):"";return `<button type="button" class="sbordoni-collection-card" data-sbordoni-collection="${esc(c)}" aria-pressed="${c===draft.collection}">${imageHtml(img,c)}<b>${esc(c)}</b></button>`}).join("")}
          </div>
          <label class="sbordoni-collection-fallback">Collection
            <select class="sbordoni-collection-select">${cols.map(c=>`<option value="${esc(c)}" ${c===draft.collection?"selected":""}>${esc(c)}</option>`).join("")}</select>
          </label>
        </div>

        <div class="recor-config-section">
          <div class="recor-config-title"><b>2. Lavabo / dimension</b><span>Référence de base et largeur</span></div>
          <div class="recor-choice-list">
            ${fams.map(f=>{
              const img=canonicalImage(draft.collection,f);
              const d=dimensionFor(draft.collection,f);
              return `<label class="recor-choice recor-choice-visual">
                <input type="radio" name="sbordoniFamily" value="${esc(f)}" ${f===draft.family?"checked":""}>
                ${imageHtml(img,`${draft.collection} ${f}`)}
                <span class="recor-choice-main"><b>${d?`${d} mm`:`Réf. ${f}`}</b><small>Famille ${esc(f)}</small></span>
              </label>`;
            }).join("")}
          </div>
        </div>

        <div class="recor-config-section">
          <div class="recor-config-title"><b>3. Perçage robinetterie</b><span>Le visuel du lavabo reste identique</span></div>
          <div class="recor-choice-list">
            ${variants.map(v=>{
              const h=holesFrom(v);
              return `<label class="recor-choice">
                <input type="radio" name="sbordoniHoles" value="${h}" ${h===draft.holes?"checked":""}>
                <span class="recor-choice-main"><b>${h} trou${h==="1"?"":"s"}</b><small>${esc(v.reference)}</small></span>
                <strong>${euro(Number(v.totalPrice??v.price??0))} HT</strong>
              </label>`;
            }).join("")}
          </div>
        </div>

        <div class="recor-config-section">
          <div class="recor-config-title"><b>4. Piètement</b><span>Optionnel — choisissez la silhouette du meuble</span></div>
          <div class="recor-choice-list">
            <label class="recor-choice recor-choice-visual">
              <input type="radio" name="sbordoniSupport" value="" ${!draft.supportKey?"checked":""}>
              ${imageHtml(basinImg,`Lavabo ${draft.family}`)}
              <span class="recor-choice-main"><b>Sans piètement</b><small>Lavabo seul</small></span>
            </label>
            ${groups.map(g=>`<label class="recor-choice recor-choice-visual">
              <input type="radio" name="sbordoniSupport" value="${esc(g.key)}" ${g.key===draft.supportKey?"checked":""}>
              ${imageHtml(g.image,g.label)}
              <span class="recor-choice-main"><b>${esc(g.label)}</b><small>${esc(g.representative?.reference||"")}</small></span>
              <strong>${euro(Number(g.representative?.totalPrice??g.representative?.price??0))} HT</strong>
            </label>`).join("")}
          </div>
        </div>

        ${selectedGroup && selectedGroup.items.length>1?`<div class="recor-config-section">
          <div class="recor-config-title"><b>5. Finition du piètement</b><span>La référence et le prix suivent la finition</span></div>
          <div class="recor-choice-list">
            ${selectedGroup.items.map(x=>`<label class="recor-choice">
              <input type="radio" name="sbordoniFinish" value="${esc(x.reference)}" ${x.reference===draft.supportRef?"checked":""}>
              <span class="recor-choice-main"><b>${esc(x.finish||x.finishCode||x.reference)}</b><small>${esc(x.reference)}</small></span>
              <strong>${euro(Number(x.totalPrice??x.price??0))} HT</strong>
            </label>`).join("")}
          </div>
        </div>`:""}

        <div class="recor-config-summary sbordoni-visual-result">
          <div class="sbordoni-result-photo">${finalImg?`<img src="${esc(finalImg)}" alt="Composition ${esc(draft.collection)} ${esc(draft.family)}" loading="lazy">`:"<span>Visuel de composition indisponible</span>"}</div>
          <div class="sbordoni-result-description"><small>Configuration sélectionnée · image de catalogue</small>
            <b>${euro(total)} HT</b>
            <span>${esc(basinDesignation(draft.collection,draft.family,draft.holes))}${selectedSupport?` + ${esc(supportLabel(selectedSupport))}`:""}</span>
            <strong>Réf. ${esc(basin?.reference||"—")}${selectedSupport?` + ${esc(selectedSupport.reference)}`:""}</strong>
          </div>
        </div>

        <p class="sbordoni-image-note">Visuel de la composition du catalogue ; le perçage et la finition suivent votre sélection.${selectedSupport && /^M\d/.test(model.supportKey(selectedSupport))?" Porte-serviettes 1P illustrés vendus séparément.":""}</p><div class="recor-config-error" aria-live="polite"></div>
        <div class="recor-config-actions">
          <button type="button" class="btn ghost sbordoni-config-cancel">Annuler</button>
          <button type="button" class="btn primary sbordoni-config-confirm" ${basin?"":"disabled"}>${editing?"Mettre à jour la configuration":"Ajouter la configuration"}</button>
        </div>
      </div>`;

      overlay.querySelector(".sbordoni-config-close").onclick=close;
      overlay.querySelector(".sbordoni-config-cancel").onclick=close;
      overlay.querySelectorAll('[data-sbordoni-collection]').forEach(button=>button.onclick=()=>{
        const select=overlay.querySelector(".sbordoni-collection-select");
        select.value=button.dataset.sbordoniCollection;
        select.dispatchEvent(new Event("change",{bubbles:true}));
      });
      overlay.querySelector(".sbordoni-collection-select").onchange=e=>{
        draft.collection=e.target.value;
        draft.family=familiesForCollection(draft.collection)[0]||"";
        draft.holes="1";draft.supportKey="";draft.supportRef="";
        render();
      };
      overlay.querySelectorAll('input[name="sbordoniFamily"]').forEach(el=>el.onchange=()=>{
        draft.family=el.value;draft.holes="1";draft.supportKey="";draft.supportRef="";render();
      });
      overlay.querySelectorAll('input[name="sbordoniHoles"]').forEach(el=>el.onchange=()=>{
        draft.holes=el.value;render();
      });
      overlay.querySelectorAll('input[name="sbordoniSupport"]').forEach(el=>el.onchange=()=>{
        draft.supportKey=el.value;
        if(draft.supportKey){
          const g=supportGroups(draft.collection,draft.family).find(x=>x.key===draft.supportKey);
          draft.supportRef=g?.representative?.reference||g?.items?.[0]?.reference||"";
        }else draft.supportRef="";
        render();
      });
      overlay.querySelectorAll('input[name="sbordoniFinish"]').forEach(el=>el.onchange=()=>{
        draft.supportRef=el.value;render();
      });

      const confirm=overlay.querySelector(".sbordoni-config-confirm");
      if(confirm)confirm.onclick=()=>{
        const err=overlay.querySelector(".recor-config-error");
        try{
          const normalized=model.buildBasin(rows(),draft);
          const targetRoomId=normalizedRoomId(roomId);
          const groupedRecord=createSelectedProductRecord(normalized,targetRoomId,"");
          if(!groupedRecord)throw new Error("La configuration Sbordoni n’a pas pu être préparée.");
          Object.assign(groupedRecord,normalized,{configuratorType:"sbordoni-basin"});

          if(editing){
            const current=state.selected.find(x=>x.id===p.id);
            if(!current)throw new Error("La configuration à modifier est introuvable.");
            const updated=model.applyEditedRecord(current,groupedRecord);
            state.selected=state.selected.filter(x=>!(x.accessoryFor===current.id && x.sbordoniConfigurationAccessory))
              .map(x=>x.id===current.id?updated:x);
            reconcileProjectRoughIns();
            saveState();
            renderSelection();
            renderRooms();
            renderMarginDashboard();
          }else{
            const ids=commitSelectedRecords([groupedRecord],{showProject:false});
            if(!ids.length)throw new Error("La configuration n’a pas pu être ajoutée.");
          }
          close();
          showView("project");
        }catch(e){
          console.error("[Sbordoni configurator]",e);
          if(err)err.textContent=e.message||"Impossible d’ajouter la configuration.";
        }
      };
    }

    overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
    render();
  }

  root.HydroSbordoniConfigurator={
    open,
    close,
    eligible,
    catalogImage,
    familyFrom,
    familiesForCollection,
    supportGroups,
    resultImage,
    collections,
    supportedCollections:[...SUPPORTED_COLLECTIONS]
  };
})(window);
