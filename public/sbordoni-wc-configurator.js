(function(root){
  "use strict";

  const model=root.HydroSbordoniModel;
  const COLLECTIONS=["Romana","Palladio","Neoclassica","Masaccio"];
  const FINISH_ORDER=["CR","ON","NI","OL","BR","RA","NN"];

  const CONFIG={
    Romana:[
      {id:"floor",label:"WC au sol",bowls:[["9020","Sortie verticale"],["9021","Sortie horizontale"]],flush:[
        {id:"high",label:"Réservoir haut",tank:"9028",mechanisms:["MC01","MC01n"],pipe:"TB01",optional:["ST01"]},
        {id:"low-top",label:"Réservoir bas · bouton supérieur",tank:"9029",mechanisms:["MC06"]},
        {id:"low",label:"Réservoir bas",tank:"9029L",mechanisms:["MC06L","MC06Ln"]}
      ],seats:["S920","S920cs","S930","S930cs","S936","S936cs","S939","S939cs","S944","S944cs","S949","S949cs"]},
      {id:"close",label:"WC monobloc",bowls:[["9024","Sortie verticale"],["9025","Sortie horizontale"]],flush:[
        {id:"top",label:"Commande supérieure",tank:"9030",mechanisms:["MC08"]},
        {id:"side",label:"Commande latérale",tank:"9030LL",mechanisms:["MC08LL","MC08LLn"]}
      ],seats:["S920","S920cs","S930","S930cs","S936","S936cs","S939","S939cs","S944","S944cs","S949","S949cs"]},
      {id:"wall",label:"WC suspendu",bowls:[["9026","Suspendu"]],flush:[],seats:["S920","S920cs","S930","S930cs","S936","S936cs","S939","S939cs","S944","S944cs","S949","S949cs"]}
    ],
    Palladio:[
      {id:"floor",label:"WC au sol",bowls:[["7020","Sortie verticale"],["7021","Sortie horizontale"]],flush:[
        {id:"high",label:"Réservoir haut",tank:"7028",mechanisms:["MC01","MC01n"],pipe:"TB01",optional:["ST01"]},
        {id:"low-top",label:"Réservoir bas · bouton supérieur",tank:"7029",mechanisms:["MC06"]},
        {id:"low",label:"Réservoir bas",tank:"7029L",mechanisms:["MC06L","MC06Ln"]}
      ],seats:["S020","S020cs","S030","S030cs","S036","S036cs","S039","S039cs","S044","S044cs","S049","S049cs"]},
      {id:"close",label:"WC monobloc",bowls:[["7032","Sortie verticale"],["7034","Sortie horizontale"]],flush:[
        {id:"top",label:"Commande supérieure",tank:"7030",mechanisms:["MC08"]},
        {id:"front",label:"Commande frontale",tank:"7030L",mechanisms:["MC08L","MC08Ln"]},
        {id:"side",label:"Commande latérale",tank:"7030LL",mechanisms:["MC08LL","MC08LLn"]}
      ],seats:["S020","S020cs","S030","S030cs","S036","S036cs","S039","S039cs","S044","S044cs","S049","S049cs"]},
      {id:"wall",label:"WC suspendu",bowls:[["7024","Suspendu"]],flush:[],seats:["S020","S020cs","S030","S030cs","S036","S036cs","S039","S039cs","S044","S044cs","S049","S049cs"]}
    ],
    Neoclassica:[
      {id:"floor",label:"WC au sol",bowls:[["5107","Sortie verticale"],["5109","Sortie horizontale"]],flush:[
        {id:"high",label:"Réservoir haut",tank:"5128",mechanisms:["MC01","MC01n"],pipe:"TB01",optional:["ST01"]},
        {id:"low-top",label:"Réservoir bas · bouton supérieur",tank:"5129",mechanisms:["MC06"]},
        {id:"low",label:"Réservoir bas",tank:"5129L",mechanisms:["MC06L","MC06Ln"]}
      ],seats:["S107","S107cs","S117","S117cs","S120","S120cs","S123","S123cs","S114","S114cs","S141","S141cs"]},
      {id:"close",label:"WC monobloc",bowls:[["5177","Sortie verticale"],["5179","Sortie horizontale"]],flush:[
        {id:"top",label:"Commande supérieure",tank:"5130",mechanisms:["MC08"]},
        {id:"front",label:"Commande frontale",tank:"5130L",mechanisms:["MC08L","MC08Ln"]},
        {id:"side",label:"Commande latérale",tank:"5130LL",mechanisms:["MC08LL","MC08LLn"]}
      ],seats:["S107","S107cs","S117","S117cs","S120","S120cs","S123","S123cs","S114","S114cs","S141","S141cs"]},
      {id:"back-en",label:"WC back-to-wall anglais",bowls:[["5022","Sortie horizontale"]],flush:[],seats:["S107","S107cs","S117","S117cs","S120","S120cs","S123","S123cs","S114","S114cs","S141","S141cs"]},
      {id:"back",label:"WC back-to-wall unifié",bowls:[["5033","Sortie sol / mur"]],flush:[],seats:["S060","S060cs","S061","S061cs","S062","S062cs","S063","S063cs","S064","S064cs","S065","S065cs"]},
      {id:"wall",label:"WC suspendu",bowls:[["5309","Suspendu"]],flush:[],seats:["S127","S127cs","S127L","S127Lcs","S130","S130cs","S138","S138cs","S136","S136cs","S152","S152cs"]}
    ],
    Masaccio:[
      {id:"floor",label:"WC au sol",bowls:[["5520","Sortie verticale"],["5521","Sortie horizontale"]],flush:[],seats:["S520","S520cs","S530","S530cs","S536","S536cs","S539","S539cs","S544","S544cs","S549","S549cs"]},
      {id:"wall",label:"WC suspendu",bowls:[["5324","Suspendu"]],flush:[],seats:["S324","S324cs","S330","S330cs","S336","S336cs","S342","S342cs","S348","S348cs","S354","S354cs"]}
    ]
  };

  function allRows(){
    try{return CATALOG.filter(x=>/^Sbordoni$/i.test(String(x.manufacturer||"")));}
    catch{return [];}
  }
  function rows(collection){return allRows().filter(x=>x.collection===collection);}
  function byRef(collection,ref){
    return rows(collection).find(x=>String(x.reference||"")===String(ref)) ||
      allRows().find(x=>String(x.reference||"")===String(ref)) || null;
  }
  function variants(collection,base){
    const seen=new Set();
    return allRows().filter(x=>{
      if(String(x.base||"")!==String(base))return false;
      const ref=String(x.reference||"");
      if(!ref||seen.has(ref))return false;
      seen.add(ref);return true;
    }).sort((a,b)=>{
      const ia=FINISH_ORDER.indexOf(String(a.finishCode||"").toUpperCase());
      const ib=FINISH_ORDER.indexOf(String(b.finishCode||"").toUpperCase());
      return (ia<0?99:ia)-(ib<0?99:ib) || String(a.reference||"").localeCompare(String(b.reference||""));
    });
  }
  function groups(collection,bases){
    return (bases||[]).map(base=>{
      const items=variants(collection,base);
      return items.length?{base,items,rep:items.find(x=>String(x.finishCode||"").toUpperCase()==="CR")||items[0]}:null;
    }).filter(Boolean);
  }
  function systemFor(collection,ref){
    return (CONFIG[collection]||[]).find(s=>s.bowls.some(([r])=>r===String(ref))) || (CONFIG[collection]||[])[0] || null;
  }
  function eligible(p){
    return /^Sbordoni$/i.test(String(p?.manufacturer||"")) &&
      COLLECTIONS.includes(String(p?.collection||"")) &&
      /^WC$/i.test(String(p?.category||"")) &&
      !!systemFor(p.collection,p.reference)?.bowls.some(([r])=>r===String(p.reference||""));
  }
  function close(){document.getElementById("sbordoniWCConfigurator")?.remove();}
  function thumb(item,label){
    return item?.image
      ? `<span class="recor-choice-thumb"><img src="${esc(item.image)}" alt="${esc(label||item.reference||"")}" loading="eager"></span>`
      : '<span class="recor-choice-thumb recor-choice-thumb-empty">WC</span>';
  }
  function seatLabel(base,item){
    const raw=String(item?.designation||"Abattant").replace(/\s+/g," ").trim();
    return raw + (/cs$/i.test(base)?" · soft-close":"");
  }
  function mechLabel(base,item){
    const raw=String(item?.designation||"Mécanisme").replace(/\s+/g," ").trim();
    return raw + (/n$/i.test(base)?" · commande noire":"");
  }
  function itemPrice(item){return Number(item?.totalPrice??item?.price??0)||0;}

  function open(p,roomId){
    const initialCollection=COLLECTIONS.includes(p?.collection)?p.collection:"Romana";
    const initialSystem=systemFor(initialCollection,p?.reference);
    const state={
      collection:initialCollection,
      systemId:initialSystem?.id||"",
      bowlRef:String(p?.reference||initialSystem?.bowls?.[0]?.[0]||""),
      flushId:initialSystem?.flush?.[0]?.id||"",
      mechBase:"",
      mechRef:"",
      pipeRef:"",
      optionalRefs:new Set(),
      seatBase:"",
      seatRef:""
    };

    const overlay=document.createElement("div");
    overlay.id="sbordoniWCConfigurator";
    overlay.className="recor-configurator-overlay sbordoni-configurator-overlay";
    document.body.appendChild(overlay);

    function sys(){
      return (CONFIG[state.collection]||[]).find(x=>x.id===state.systemId) || (CONFIG[state.collection]||[])[0] || null;
    }
    function flush(){
      const s=sys();
      return s?.flush?.find(x=>x.id===state.flushId) || s?.flush?.[0] || null;
    }
    function normalize(){
      const systems=CONFIG[state.collection]||[];
      if(!systems.some(x=>x.id===state.systemId))state.systemId=systems[0]?.id||"";
      const s=sys();
      if(!s?.bowls.some(([r])=>r===state.bowlRef))state.bowlRef=s?.bowls?.[0]?.[0]||"";
      if(s?.flush?.length){
        if(!s.flush.some(x=>x.id===state.flushId))state.flushId=s.flush[0].id;
      }else state.flushId="";
      const f=flush();
      const mg=groups(state.collection,f?.mechanisms||[]);
      if(!mg.some(g=>g.base===state.mechBase))state.mechBase=mg[0]?.base||"";
      const selectedMg=mg.find(g=>g.base===state.mechBase);
      if(selectedMg && !selectedMg.items.some(x=>x.reference===state.mechRef))state.mechRef=selectedMg.rep?.reference||"";
      if(!selectedMg)state.mechRef="";
      const pg=f?.pipe?groups(state.collection,[f.pipe])[0]:null;
      if(pg && !pg.items.some(x=>x.reference===state.pipeRef)){
        const finish=byRef(state.collection,state.mechRef)?.finishCode;
        state.pipeRef=(pg.items.find(x=>x.finishCode===finish)||pg.rep)?.reference||"";
      }
      if(!pg)state.pipeRef="";
      const sg=groups(state.collection,s?.seats||[]);
      if(!sg.some(g=>g.base===state.seatBase))state.seatBase=sg[0]?.base||"";
      const selectedSg=sg.find(g=>g.base===state.seatBase);
      if(selectedSg && !selectedSg.items.some(x=>x.reference===state.seatRef))state.seatRef=selectedSg.rep?.reference||"";
      if(!selectedSg)state.seatRef="";
      const allowed=new Set((f?.optional||[]).flatMap(base=>groups(state.collection,[base]).flatMap(g=>g.items.map(x=>x.reference))));
      state.optionalRefs=new Set([...state.optionalRefs].filter(x=>allowed.has(x)));
    }

    function render(){
      normalize();
      const s=sys(),f=flush();
      const bowl=byRef(state.collection,state.bowlRef);
      const tank=f?.tank?byRef(state.collection,f.tank):null;
      const mg=groups(state.collection,f?.mechanisms||[]);
      const selectedMg=mg.find(g=>g.base===state.mechBase)||null;
      const mechanism=state.mechRef?byRef(state.collection,state.mechRef):null;
      const pg=f?.pipe?groups(state.collection,[f.pipe])[0]:null;
      const pipe=state.pipeRef?byRef(state.collection,state.pipeRef):null;
      const optionalGroups=groups(state.collection,f?.optional||[]);
      const optionals=[...state.optionalRefs].map(ref=>byRef(state.collection,ref)).filter(Boolean);
      const sg=groups(state.collection,s?.seats||[]);
      const selectedSg=sg.find(g=>g.base===state.seatBase)||null;
      const seat=state.seatRef?byRef(state.collection,state.seatRef):null;
      const resultImg=model.wcImage({bowlRef:state.bowlRef,flush:state.flushId});
      const total=[bowl,tank,mechanism,pipe,seat,...optionals].filter(Boolean).reduce((sum,x)=>sum+itemPrice(x),0);

      overlay.innerHTML=`<div class="recor-configurator" role="dialog" aria-modal="true" aria-labelledby="sbWcTitle">
        <div class="recor-config-head">
          <div><div class="eyebrow">Sbordoni · configurateur WC</div><h2 id="sbWcTitle">${esc(state.collection)}</h2><p>Cuvette, évacuation, chasse et abattant sont combinés selon les compositions du catalogue Sbordoni.</p></div>
          <button type="button" class="icon sb-wc-close" aria-label="Fermer">×</button>
        </div>

        <div class="recor-config-section">
          <div class="recor-config-title"><b>1. Collection</b><span>Romana · Palladio · Neoclassica · Masaccio</span></div>
          <label>Collection<select class="sb-wc-collection">${COLLECTIONS.map(c=>`<option value="${esc(c)}" ${c===state.collection?"selected":""}>${esc(c)}</option>`).join("")}</select></label>
        </div>

        <div class="recor-config-section">
          <div class="recor-config-title"><b>2. Type de WC</b><span>Famille sanitaire</span></div>
          <div class="recor-choice-list">${(CONFIG[state.collection]||[]).map(x=>`<label class="recor-choice"><input type="radio" name="sbWcSystem" value="${esc(x.id)}" ${x.id===state.systemId?"checked":""}><span class="recor-choice-main"><b>${esc(x.label)}</b></span></label>`).join("")}</div>
        </div>

        <div class="recor-config-section">
          <div class="recor-config-title"><b>3. Cuvette / évacuation</b><span>Sortie ou pose selon la collection</span></div>
          <div class="recor-choice-list">${(s?.bowls||[]).map(([ref,label])=>{const item=byRef(state.collection,ref);return `<label class="recor-choice recor-choice-visual"><input type="radio" name="sbWcBowl" value="${esc(ref)}" ${ref===state.bowlRef?"checked":""}>${thumb(item,label)}<span class="recor-choice-main"><b>${esc(label)}</b><small>${esc(ref)}</small></span><strong>${item?euro(itemPrice(item))+" HT":""}</strong></label>`}).join("")}</div>
        </div>

        ${s?.flush?.length?`<div class="recor-config-section">
          <div class="recor-config-title"><b>4. Chasse</b><span>Réservoir et commande compatibles</span></div>
          <div class="recor-choice-list">${s.flush.map(x=>{const item=byRef(state.collection,x.tank);return `<label class="recor-choice recor-choice-visual"><input type="radio" name="sbWcFlush" value="${esc(x.id)}" ${x.id===state.flushId?"checked":""}>${thumb(item,x.label)}<span class="recor-choice-main"><b>${esc(x.label)}</b><small>${esc(x.tank||"")}</small></span><strong>${item?euro(itemPrice(item))+" HT":""}</strong></label>`}).join("")}</div>
        </div>`:""}

        ${mg.length?`<div class="recor-config-section">
          <div class="recor-config-title"><b>5. Mécanisme de chasse</b><span>Type de commande puis finition</span></div>
          <div class="recor-choice-list">${mg.map(g=>`<label class="recor-choice"><input type="radio" name="sbWcMechBase" value="${esc(g.base)}" ${g.base===state.mechBase?"checked":""}><span class="recor-choice-main"><b>${esc(mechLabel(g.base,g.rep))}</b><small>${esc(g.base)}</small></span></label>`).join("")}</div>
          ${selectedMg?`<div class="recor-choice-list" style="margin-top:8px">${selectedMg.items.map(x=>`<label class="recor-choice"><input type="radio" name="sbWcMechRef" value="${esc(x.reference)}" ${x.reference===state.mechRef?"checked":""}><span class="recor-choice-main"><b>${esc(x.finish||x.finishCode||x.reference)}</b><small>${esc(x.reference)}</small></span><strong>${euro(itemPrice(x))} HT</strong></label>`).join("")}</div>`:""}
        </div>`:""}

        ${pg?`<div class="recor-config-section">
          <div class="recor-config-title"><b>Tuyau de chasse</b><span>Finition coordonnée</span></div>
          <div class="recor-choice-list">${pg.items.map(x=>`<label class="recor-choice"><input type="radio" name="sbWcPipe" value="${esc(x.reference)}" ${x.reference===state.pipeRef?"checked":""}><span class="recor-choice-main"><b>${esc(x.finish||x.finishCode||x.reference)}</b><small>${esc(x.reference)}</small></span><strong>${euro(itemPrice(x))} HT</strong></label>`).join("")}</div>
        </div>`:""}

        ${optionalGroups.length?`<div class="recor-config-section">
          <div class="recor-config-title"><b>Accessoires complémentaires</b><span>Optionnels</span></div>
          <div class="recor-choice-list">${optionalGroups.map(g=>{const x=g.rep;return `<label class="recor-choice"><input type="checkbox" name="sbWcOptional" value="${esc(x.reference)}" ${state.optionalRefs.has(x.reference)?"checked":""}><span class="recor-choice-main"><b>${esc(x.designation||x.reference)}</b><small>${esc(x.reference)}</small></span><strong>${euro(itemPrice(x))} HT</strong></label>`}).join("")}</div>
        </div>`:""}

        <div class="recor-config-section">
          <div class="recor-config-title"><b>6. Abattant</b><span>Modèle puis finition des charnières</span></div>
          <div class="recor-choice-list">${sg.map(g=>`<label class="recor-choice recor-choice-visual"><input type="radio" name="sbWcSeatBase" value="${esc(g.base)}" ${g.base===state.seatBase?"checked":""}>${thumb(g.rep,seatLabel(g.base,g.rep))}<span class="recor-choice-main"><b>${esc(seatLabel(g.base,g.rep))}</b><small>${esc(g.base)}</small></span></label>`).join("")}</div>
          ${selectedSg?`<div class="recor-choice-list" style="margin-top:8px">${selectedSg.items.map(x=>`<label class="recor-choice"><input type="radio" name="sbWcSeatRef" value="${esc(x.reference)}" ${x.reference===state.seatRef?"checked":""}><span class="recor-choice-main"><b>${esc(x.finish||x.finishCode||x.reference)}</b><small>${esc(x.reference)}</small></span><strong>${euro(itemPrice(x))} HT</strong></label>`).join("")}</div>`:""}
        </div>

        <div class="recor-config-summary">
          ${resultImg?`<img src="${esc(resultImg)}" alt="${esc(bowl.reference)}" style="width:110px;height:90px;object-fit:contain;background:#fff;border-radius:12px;margin-right:12px">`:""}
          <div><b>${euro(total)} HT</b><span>${esc(s?.label||"WC")} · ${esc(bowl?.reference||"")}${tank?` + ${esc(tank.reference)}`:""}${mechanism?` + ${esc(mechanism.reference)}`:""}${seat?` + ${esc(seat.reference)}`:""}</span></div>
        </div>
        <p class="sbordoni-image-note">Composition de référence du catalogue. Le coloris d’abattant et la commande suivent les références sélectionnées.</p><div class="recor-config-error" aria-live="polite"></div>
        <div class="recor-config-actions"><button type="button" class="btn ghost sb-wc-cancel">Annuler</button><button type="button" class="btn primary sb-wc-confirm">Ajouter le WC configuré</button></div>
      </div>`;

      overlay.querySelector(".sb-wc-close").onclick=close;
      overlay.querySelector(".sb-wc-cancel").onclick=close;
      overlay.querySelector(".sb-wc-collection").onchange=e=>{
        state.collection=e.target.value;
        const first=(CONFIG[state.collection]||[])[0];
        state.systemId=first?.id||"";state.bowlRef=first?.bowls?.[0]?.[0]||"";state.flushId=first?.flush?.[0]?.id||"";
        state.mechBase="";state.mechRef="";state.pipeRef="";state.optionalRefs=new Set();state.seatBase="";state.seatRef="";render();
      };
      overlay.querySelectorAll('input[name="sbWcSystem"]').forEach(el=>el.onchange=()=>{
        state.systemId=el.value;const x=sys();state.bowlRef=x?.bowls?.[0]?.[0]||"";state.flushId=x?.flush?.[0]?.id||"";
        state.mechBase="";state.mechRef="";state.pipeRef="";state.optionalRefs=new Set();state.seatBase="";state.seatRef="";render();
      });
      overlay.querySelectorAll('input[name="sbWcBowl"]').forEach(el=>el.onchange=()=>{state.bowlRef=el.value;render();});
      overlay.querySelectorAll('input[name="sbWcFlush"]').forEach(el=>el.onchange=()=>{state.flushId=el.value;state.mechBase="";state.mechRef="";state.pipeRef="";state.optionalRefs=new Set();render();});
      overlay.querySelectorAll('input[name="sbWcMechBase"]').forEach(el=>el.onchange=()=>{state.mechBase=el.value;state.mechRef="";render();});
      overlay.querySelectorAll('input[name="sbWcMechRef"]').forEach(el=>el.onchange=()=>{state.mechRef=el.value;state.pipeRef="";render();});
      overlay.querySelectorAll('input[name="sbWcPipe"]').forEach(el=>el.onchange=()=>{state.pipeRef=el.value;render();});
      overlay.querySelectorAll('input[name="sbWcOptional"]').forEach(el=>el.onchange=()=>{
        if(el.checked)state.optionalRefs.add(el.value);else state.optionalRefs.delete(el.value);render();
      });
      overlay.querySelectorAll('input[name="sbWcSeatBase"]').forEach(el=>el.onchange=()=>{state.seatBase=el.value;state.seatRef="";render();});
      overlay.querySelectorAll('input[name="sbWcSeatRef"]').forEach(el=>el.onchange=()=>{state.seatRef=el.value;render();});

      overlay.querySelector(".sb-wc-confirm").onclick=()=>{
        const err=overlay.querySelector(".recor-config-error");
        try{
          const currentSystem=sys(),currentFlush=flush();
          const selected=[
            byRef(state.collection,state.bowlRef),
            currentFlush?.tank?byRef(state.collection,currentFlush.tank):null,
            state.mechRef?byRef(state.collection,state.mechRef):null,
            state.pipeRef?byRef(state.collection,state.pipeRef):null,
            ...[...state.optionalRefs].map(ref=>byRef(state.collection,ref)),
            state.seatRef?byRef(state.collection,state.seatRef):null
          ].filter(Boolean);
          if(!byRef(state.collection,state.bowlRef) || !byRef(state.collection,state.seatRef) ||
            (currentFlush && (!byRef(state.collection,currentFlush.tank)||!byRef(state.collection,state.mechRef))) ||
            (currentFlush?.pipe && !byRef(state.collection,state.pipeRef)))throw new Error("La composition WC est incomplète : référence obligatoire indisponible.");
          const targetRoomId=normalizedRoomId(roomId);
          const main=createSelectedProductRecord(selected[0],targetRoomId,"");
          if(!main)throw new Error("La cuvette n’a pas pu être préparée.");
          main.sbordoniWCConfiguration={schemaVersion:1,collection:state.collection,bowlRef:state.bowlRef,system:currentSystem?.id||"",flush:currentFlush?.id||"",references:selected.map(x=>x.reference)};
          Object.assign(main,model.imageFields(model.wcImage(main.sbordoniWCConfiguration)));
          main.imageNote="Composition de référence du catalogue ; abattant et commande selon sélection.";
          const records=[main];
          for(const item of selected.slice(1)){
            const child=createSelectedProductRecord(item,targetRoomId,main.id);
            if(!child)continue;
            child.hideFromDossier=true;
            child.sbordoniWCConfigurationAccessory=true;
            records.push(child);
          }
          const ids=commitSelectedRecords(records,{showProject:false});
          if(!ids.length)throw new Error("La configuration WC n’a pas pu être ajoutée.");
          close();showView("project");
        }catch(e){
          console.error("[Sbordoni WC configurator]",e);
          if(err)err.textContent=e.message||"Impossible d’ajouter la configuration WC.";
        }
      };
    }

    overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
    render();
  }

  root.HydroSbordoniWCConfigurator={open,close,eligible,collections:()=>[...COLLECTIONS],config:CONFIG};
})(window);
