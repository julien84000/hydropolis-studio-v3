(function(root){
  "use strict";

  const SUPPORTED_COLLECTIONS=["Romana","Palladio","Neoclassica","Masaccio"];
  const DIMENSIONS={
    Romana:{9200:1350,9090:900,9065:650},
    Palladio:{7200:1500,7100:1000,7070:715,7064:645,7050:0},
    Neoclassica:{5700:1050,5775:730,5770:690,5765:650,5758:580},
    Masaccio:{5369:680,5365:640,5359:595,5352:525,5304:650,5305:580}
  };

  const NE0CLASSICA_SHARED_PEDESTAL=new Set(["5775","5770","5765","5758"]);
  const FINISH_ORDER=["CR","NI","OL","BR","ON","RA","NN"];

  const CURATED_RESULT_IMAGES={
    "Romana|9065|9001":"https://data.bobool.it/imgprodotto/colonna-classica-per-lavabo-in-ceramica-bianca-romana-sbordoni_17587_zoom.jpg"
  };

  function resultImage(collection,family,support){
    const supportRef=String(support?.reference||"");
    const curated=CURATED_RESULT_IMAGES[`${collection}|${family}|${supportRef}`];
    return curated || support?.image || canonicalImage(collection,family) || "";
  }

  function norm(value){
    return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  }

  function familyFrom(p){
    if(!p || !/^Sbordoni$/i.test(String(p.manufacturer||"")))return "";
    const m=String(p.reference||"").match(/^(\d{4})\/([13])$/);
    return m?m[1]:"";
  }

  function holesFrom(p){
    const m=String(p?.reference||"").match(/\/([13])$/);
    return m?m[1]:"";
  }

  function collectionRows(collection){
    try{return CATALOG.filter(x=>/^Sbordoni$/i.test(String(x.manufacturer||"")) && x.collection===collection);}
    catch{return [];}
  }

  function familyRows(collection,family){
    return collectionRows(collection).filter(x=>new RegExp(`^${family}/[13]$`).test(String(x.reference||"")));
  }

  function directSupportCandidates(collection,family){
    const token=String(family);
    return collectionRows(collection).filter(x=>{
      const ref=String(x.reference||"");
      if(/^\d{4}\/[13]$/.test(ref))return false;
      const d=norm(x.designation);
      if(!d.includes(token))return false;
      return /structure metallique|supports? ceramiques?|pieds? ceramiques?|brackets?|legs?/.test(d);
    });
  }

  function specialSupportCandidates(collection,family){
    const out=[];
    const ref=String(family);
    const add=(reference)=>{
      const p=collectionRows(collection).find(x=>String(x.reference||"")===reference) ||
        CATALOG.find(x=>/^Sbordoni$/i.test(String(x.manufacturer||"")) && String(x.reference||"")===reference);
      if(p)out.push(p.collection===collection?p:{...p,collection});
    };
    if(collection==="Neoclassica" && NE0CLASSICA_SHARED_PEDESTAL.has(ref))add("5771");
    if(collection==="Masaccio" && ["5369","5365","5359"].includes(ref))add("5771");
    if(collection==="Palladio" && ["7100","7070","7064"].includes(ref))add("7001");
    if(collection==="Romana" && ref==="9065")add("9001");
    return out;
  }

  function supportCandidates(collection,family){
    const seen=new Set();
    return [...directSupportCandidates(collection,family),...specialSupportCandidates(collection,family)].filter(x=>{
      const key=String(x.reference||"");
      if(!key||seen.has(key))return false;
      seen.add(key);return true;
    });
  }

  function familyIsBasin(collection,family){
    const rows=familyRows(collection,family);
    const hasLavabo=rows.some(x=>/^Lavabo$/i.test(String(x.category||"")));
    return hasLavabo || supportCandidates(collection,family).length>0;
  }

  function familiesForCollection(collection){
    const set=new Set();
    for(const p of collectionRows(collection)){
      const m=String(p.reference||"").match(/^(\d{4})\/([13])$/);
      if(m)set.add(m[1]);
    }
    return [...set].filter(f=>familyIsBasin(collection,f)).sort((a,b)=>{
      const da=dimensionFor(collection,a)||0,db=dimensionFor(collection,b)||0;
      return db-da || a.localeCompare(b);
    });
  }

  function collections(){
    return SUPPORTED_COLLECTIONS.filter(c=>familiesForCollection(c).length);
  }

  function dimensionFor(collection,family){
    const explicit=Number(DIMENSIONS?.[collection]?.[family]||0);
    if(explicit)return explicit;
    for(const p of familyRows(collection,family)){
      const m=String(p.designation||"").match(/(\d{3,4})\s*mm/i);
      if(m)return Number(m[1]);
    }
    return 0;
  }

  function canonicalBasinRow(collection,family){
    const rows=familyRows(collection,family);
    return rows.find(x=>String(x.reference||"")===`${family}/3`) || rows.find(x=>x.image) || rows[0] || null;
  }

  function canonicalImage(collection,family){
    const rows=familyRows(collection,family);
    const preferred=rows.find(x=>String(x.reference||"")===`${family}/3` && x.image) || rows.find(x=>x.image);
    return preferred?.image||"";
  }

  function catalogImage(p){
    const family=familyFrom(p);
    if(!family)return p?.image||"";
    return canonicalImage(p.collection,family) || p?.image || "";
  }

  function eligible(p){
    const family=familyFrom(p);
    return !!family && SUPPORTED_COLLECTIONS.includes(String(p?.collection||"")) && familyIsBasin(p.collection,family);
  }

  function supportGroupKey(p){
    if(!p)return "";
    return String(p.base||p.reference||"").replace(/(?:CR|BR|NI|OL|NN|ON|RA)$/i,"");
  }

  function supportLabel(item){
    const d=norm(item?.designation);
    const ref=String(item?.reference||"");
    if(ref==="5771")return "Piédestal";
    if(/pieds? ceramiques?/.test(d))return "Pieds céramiques";
    if(/supports? ceramiques?/.test(d))return "Supports céramiques";
    if(/avec grille/.test(d))return "Structure métallique avec grille";
    if(/etagere en verre/.test(d))return "Structure métallique avec étagère en verre";
    if(/structure metallique/.test(d)){
      const prefix=String(item?.base||ref).match(/^([A-Z]+)/)?.[1]||"";
      return prefix?`Structure métallique ${prefix}`:"Structure métallique";
    }
    return item?.designation||ref;
  }

  function supportGroups(collection,family){
    const map=new Map();
    for(const item of supportCandidates(collection,family)){
      const key=supportGroupKey(item);
      if(!map.has(key))map.set(key,{key,label:supportLabel(item),items:[]});
      map.get(key).items.push(item);
    }
    const groups=[...map.values()];
    for(const g of groups){
      g.items.sort((a,b)=>{
        const ia=FINISH_ORDER.indexOf(String(a.finishCode||"").toUpperCase());
        const ib=FINISH_ORDER.indexOf(String(b.finishCode||"").toUpperCase());
        return (ia<0?99:ia)-(ib<0?99:ib) || String(a.reference||"").localeCompare(String(b.reference||""));
      });
      g.representative=g.items.find(x=>String(x.finishCode||"").toUpperCase()==="CR") || g.items[0];
    }
    return groups;
  }

  function basinVariant(collection,family,holes){
    return familyRows(collection,family).find(x=>String(x.reference||"")===`${family}/${holes}`) || null;
  }

  function basinDesignation(collection,family,holes){
    const dim=dimensionFor(collection,family);
    const canonical=canonicalBasinRow(collection,family);
    const d=norm(canonical?.designation);
    const kind=/double/.test(d)?"Console double":/console/.test(d)?"Console lavabo":/angulaire/.test(d)?"Lavabo angulaire":"Lavabo";
    return `${kind} ${collection}${dim?` ${dim} mm`:""} — ${holes} trou${holes==="1"?"":"s"} robinetterie`;
  }
  function configuredDesignation(collection,family,holes,support){
    const base=basinDesignation(collection,family,holes);
    if(!support)return base;
    const label=supportLabel(support)
      .replace(/\s+pour\s+(?:console\s+)?lavabo.*$/i,"")
      .replace(/\s+pour\s+console.*$/i,"")
      .trim();
    const finish=String(support.finish||"").trim();
    return [base,label,finish].filter(Boolean).join(" · ");
  }

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
    const state={
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
      if(!cols.includes(state.collection))state.collection=cols[0]||"";
      const fams=familiesForCollection(state.collection);
      if(!fams.includes(state.family))state.family=fams[0]||"";
      const variants=["1","3"].filter(h=>basinVariant(state.collection,state.family,h));
      if(!variants.includes(state.holes))state.holes=variants[0]||"";
      const groups=supportGroups(state.collection,state.family);
      if(state.supportKey && !groups.some(g=>g.key===state.supportKey)){
        state.supportKey="";state.supportRef="";
      }
      if(state.supportKey){
        const group=groups.find(g=>g.key===state.supportKey);
        if(group && !group.items.some(x=>x.reference===state.supportRef)){
          state.supportRef=group.representative?.reference||group.items[0]?.reference||"";
        }
      }
    }

    function render(){
      normalizeState();
      const cols=collections();
      const fams=familiesForCollection(state.collection);
      const variants=["1","3"].map(h=>basinVariant(state.collection,state.family,h)).filter(Boolean);
      const basin=basinVariant(state.collection,state.family,state.holes) || variants[0] || null;
      const groups=supportGroups(state.collection,state.family);
      const selectedGroup=groups.find(g=>g.key===state.supportKey)||null;
      const selectedSupport=selectedGroup?.items.find(x=>x.reference===state.supportRef) || selectedGroup?.representative || null;
      const basinImg=canonicalImage(state.collection,state.family);
      const finalImg=resultImage(state.collection,state.family,selectedSupport) || basinImg;
      const total=Number(basin?.totalPrice??basin?.price??0)+Number(selectedSupport?.totalPrice??selectedSupport?.price??0);
      const dim=dimensionFor(state.collection,state.family);

      overlay.innerHTML=`<div class="recor-configurator" role="dialog" aria-modal="true" aria-labelledby="sbordoniConfigTitle">
        <div class="recor-config-head">
          <div>
            <div class="eyebrow">Sbordoni · ${editing?"modifier la configuration":"configurateur de collection"}</div>
            <h2 id="sbordoniConfigTitle">${esc(state.collection||"Sbordoni")}</h2>
            <p>Choisissez le lavabo, le perçage puis, si souhaité, son piètement. Le perçage 1 ou 3 trous conserve le même visuel de vasque.</p>
          </div>
          <button type="button" class="icon sbordoni-config-close" aria-label="Fermer">×</button>
        </div>

        <div class="recor-config-section">
          <div class="recor-config-title"><b>1. Collection</b><span>Choix de la collection Sbordoni</span></div>
          <label>Collection
            <select class="sbordoni-collection-select">${cols.map(c=>`<option value="${esc(c)}" ${c===state.collection?"selected":""}>${esc(c)}</option>`).join("")}</select>
          </label>
        </div>

        <div class="recor-config-section">
          <div class="recor-config-title"><b>2. Lavabo / dimension</b><span>Référence de base et largeur</span></div>
          <div class="recor-choice-list">
            ${fams.map(f=>{
              const img=canonicalImage(state.collection,f);
              const d=dimensionFor(state.collection,f);
              return `<label class="recor-choice recor-choice-visual">
                <input type="radio" name="sbordoniFamily" value="${esc(f)}" ${f===state.family?"checked":""}>
                ${imageHtml(img,`${state.collection} ${f}`)}
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
                <input type="radio" name="sbordoniHoles" value="${h}" ${h===state.holes?"checked":""}>
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
              <input type="radio" name="sbordoniSupport" value="" ${!state.supportKey?"checked":""}>
              ${imageHtml(basinImg,`Lavabo ${state.family}`)}
              <span class="recor-choice-main"><b>Sans piètement</b><small>Lavabo seul</small></span>
            </label>
            ${groups.map(g=>`<label class="recor-choice recor-choice-visual">
              <input type="radio" name="sbordoniSupport" value="${esc(g.key)}" ${g.key===state.supportKey?"checked":""}>
              ${imageHtml(g.representative?.image,g.label)}
              <span class="recor-choice-main"><b>${esc(g.label)}</b><small>${esc(g.representative?.reference||"")}</small></span>
              <strong>${euro(Number(g.representative?.totalPrice??g.representative?.price??0))} HT</strong>
            </label>`).join("")}
          </div>
        </div>

        ${selectedGroup && selectedGroup.items.length>1?`<div class="recor-config-section">
          <div class="recor-config-title"><b>5. Finition du piètement</b><span>La référence et le prix suivent la finition</span></div>
          <div class="recor-choice-list">
            ${selectedGroup.items.map(x=>`<label class="recor-choice">
              <input type="radio" name="sbordoniFinish" value="${esc(x.reference)}" ${x.reference===state.supportRef?"checked":""}>
              <span class="recor-choice-main"><b>${esc(x.finish||x.finishCode||x.reference)}</b><small>${esc(x.reference)}</small></span>
              <strong>${euro(Number(x.totalPrice??x.price??0))} HT</strong>
            </label>`).join("")}
          </div>
        </div>`:""}

        <div class="recor-config-summary">
          <div>${finalImg?`<img src="${esc(finalImg)}" alt="${esc(state.family)}" style="width:110px;height:90px;object-fit:contain;background:#fff;border-radius:12px;margin-right:12px">`:""}</div>
          <div><b>${euro(total)} HT</b><span>${esc(basinDesignation(state.collection,state.family,state.holes))}${selectedSupport?` + ${esc(supportLabel(selectedSupport))}`:""}</span></div>
        </div>

        <div class="recor-config-error" aria-live="polite"></div>
        <div class="recor-config-actions">
          <button type="button" class="btn ghost sbordoni-config-cancel">Annuler</button>
          <button type="button" class="btn primary sbordoni-config-confirm" ${basin?"":"disabled"}>${editing?"Mettre à jour la configuration":"Ajouter la configuration"}</button>
        </div>
      </div>`;

      overlay.querySelector(".sbordoni-config-close").onclick=close;
      overlay.querySelector(".sbordoni-config-cancel").onclick=close;
      overlay.querySelector(".sbordoni-collection-select").onchange=e=>{
        state.collection=e.target.value;
        state.family=familiesForCollection(state.collection)[0]||"";
        state.holes="1";state.supportKey="";state.supportRef="";
        render();
      };
      overlay.querySelectorAll('input[name="sbordoniFamily"]').forEach(el=>el.onchange=()=>{
        state.family=el.value;state.holes="1";state.supportKey="";state.supportRef="";render();
      });
      overlay.querySelectorAll('input[name="sbordoniHoles"]').forEach(el=>el.onchange=()=>{
        state.holes=el.value;render();
      });
      overlay.querySelectorAll('input[name="sbordoniSupport"]').forEach(el=>el.onchange=()=>{
        state.supportKey=el.value;
        if(state.supportKey){
          const g=supportGroups(state.collection,state.family).find(x=>x.key===state.supportKey);
          state.supportRef=g?.representative?.reference||g?.items?.[0]?.reference||"";
        }else state.supportRef="";
        render();
      });
      overlay.querySelectorAll('input[name="sbordoniFinish"]').forEach(el=>el.onchange=()=>{
        state.supportRef=el.value;render();
      });

      const confirm=overlay.querySelector(".sbordoni-config-confirm");
      if(confirm)confirm.onclick=()=>{
        const err=overlay.querySelector(".recor-config-error");
        try{
          const selectedBasin=basinVariant(state.collection,state.family,state.holes);
          if(!selectedBasin)throw new Error("La variante de lavabo sélectionnée est introuvable.");
          const targetRoomId=normalizedRoomId(roomId);
          const baseImg=canonicalImage(state.collection,state.family);
          const resultImg=resultImage(state.collection,state.family,selectedSupport)||baseImg||selectedBasin.image||"";
          const basinPrice=Number(selectedBasin.totalPrice??selectedBasin.price??0);
          const supportPrice=Number(selectedSupport?.totalPrice??selectedSupport?.price??0);
          const total=basinPrice+supportPrice;
          const components=[
            {
              role:"lavabo",
              reference:selectedBasin.reference,
              designation:selectedBasin.designation,
              finish:selectedBasin.finish||"",
              price:basinPrice
            },
            ...(selectedSupport?[{
              role:"pietement",
              reference:selectedSupport.reference,
              designation:selectedSupport.designation,
              finish:selectedSupport.finish||"",
              price:supportPrice
            }]:[])
          ];
          const normalized={
            ...selectedBasin,
            category:"Lavabo",
            designation:configuredDesignation(state.collection,state.family,state.holes,selectedSupport),
            price:total,
            totalPrice:total,
            image:resultImg,
            images:[resultImg].filter(Boolean),
            imageSource:selectedSupport?"Catalogue Sbordoni 2023 — composition lavabo + piètement":"Catalogue Sbordoni 2023 — visuel lavabo",
            finish:selectedSupport?.finish||selectedBasin.finish||""
          };
          const groupedRecord=createSelectedProductRecord(normalized,targetRoomId,"");
          if(!groupedRecord)throw new Error("La configuration Sbordoni n’a pas pu être préparée.");
          groupedRecord.catalogPrice=total;
          groupedRecord.catalogTotalPrice=total;
          groupedRecord.totalPrice=total;
          groupedRecord.price=total;
          groupedRecord.sbordoniGrouped=true;
          groupedRecord.sbordoniConfiguration={
            collection:state.collection,
            family:state.family,
            holes:Number(state.holes||0),
            supportRef:selectedSupport?.reference||"",
            componentReferences:components.map(x=>x.reference),
            components,
            resultImage:resultImg,
            totalPrice:total,
            grouped:true
          };
          groupedRecord.image=resultImg;
          groupedRecord.images=[resultImg].filter(Boolean);
          groupedRecord.pdfImage=resultImg;
          groupedRecord.pdfImages=[resultImg].filter(Boolean);
          groupedRecord.imageStatus="Visuel final configuré Sbordoni";
          groupedRecord.imageSource=normalized.imageSource;

          if(editing){
            const current=state.selected.find(x=>x.id===p.id);
            if(!current)throw new Error("La configuration à modifier est introuvable.");
            const preserved={
              id:current.id,
              roomId:current.roomId,
              quantity:current.quantity,
              leadTime:current.leadTime,
              clientDiscountOverride:current.clientDiscountOverride,
              priceOverride:current.priceOverride,
              includeDrawing:current.includeDrawing,
              includeTechnicalSheet:current.includeTechnicalSheet,
              includeInstallationGuide:current.includeInstallationGuide
            };
            Object.assign(groupedRecord,preserved);
            state.selected=state.selected.filter(x=>x.id!==current.id && !(x.accessoryFor===current.id && x.sbordoniConfigurationAccessory));
            state.selected.push(groupedRecord);
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
