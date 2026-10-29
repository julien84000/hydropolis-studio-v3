/* V11.64.16 — dossier-only editing and quote section subtotals.
   Deliberately does not write product, quotation or catalogue data. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.HydroDossierEditor=api;
})(typeof window==="object"?window:null,function(){
  "use strict";
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  function quoteSectionTotals(rows){
    const totals=new Map();
    for(const row of rows||[]){
      const key=String(row.room||"").trim().replace(/\s+/g," ").toLocaleUpperCase("fr-FR");
      totals.set(key,(totals.get(key)||0)+Number(row.netUnit||0)*Number(row.qty||0));
    }
    return totals;
  }
  function renderQuoteRoomSubtotals(){
    if(typeof document==="undefined"||typeof quoteRows!=="function")return;
    const table=document.querySelector("#document .quote-table");
    if(!table)return;
    const totals=quoteSectionTotals(quoteRows());
    const headers=[...document.querySelectorAll("#document .quote-page .quote-room-row")];
    const last=new Map();
    headers.forEach((row,index)=>{
      const td=row.querySelector("td");
      if(!td)return;
      const label=td.querySelector(".quote-room-title")?.textContent||td.textContent;
      const key=String(label||"").trim().replace(/\s+/g," ").toLocaleUpperCase("fr-FR");
      row.dataset.quoteSection=key;
      last.set(key,index);
    });
    headers.forEach((row,index)=>{
      const td=row.querySelector("td");
      if(!td)return;
      const key=row.dataset.quoteSection;
      const original=td.querySelector(".quote-room-title")?.textContent||td.textContent;
      const line=document.createElement("div");
      line.className="quote-room-line";
      const title=document.createElement("span");
      title.className="quote-room-title";
      title.textContent=original;
      const amount=document.createElement("span");
      amount.className="quote-room-amount";
      amount.textContent="SOUS-TOTAL HT  ·  "+euro(totals.get(key)||0);
      amount.hidden=index!==last.get(key);
      line.append(title,amount);
      td.replaceChildren(line);
    });
  }
  function pageRemovalAssignments(pages,key){
    const source=(pages||[]).find(page=>page.key===key);
    if(!source)return null;
    const assignments={};
    const candidates=pages.filter(page=>page.key!==key).map(page=>({
      key:page.key,group:page.group,items:[...page.items]
    }));
    for(const page of pages){
      if(page.key!==key)for(const item of page.items)assignments[String(item.id)]=page.key;
    }
    const groupKey=source.group.key;
    const usedKeys=new Set(pages.map(page=>page.key));
    let nextIndex=Math.max(-1,...pages.filter(page=>page.group.key===groupKey)
      .map(page=>Number(page.key.slice(groupKey.length+1))).filter(Number.isFinite))+1;
    const moves=[];
    for(const item of source.items){
      let target=candidates.find(page=>page.group.key===groupKey&&page.items.length<6);
      if(!target)target=candidates.find(page=>page.items.length<6);
      if(!target){
        let newKey;
        do{newKey=groupKey+":"+(nextIndex++);}while(usedKeys.has(newKey));
        usedKeys.add(newKey);
        target={key:newKey,group:source.group,items:[]};
        candidates.push(target);
      }
      target.items.push(item);
      assignments[String(item.id)]=target.key;
      moves.push({id:String(item.id),from:key,to:target.key});
    }
    return {assignments,moves,remainingPages:candidates.filter(page=>page.items.length).length};
  }
  function persistPresentation(mutator){
    const before=JSON.stringify(ensurePresentationLayoutState());
    const layout=ensurePresentationLayoutState();
    mutator(layout);
    if(!saveState()){
      state.presentationLayout=JSON.parse(before);
      alert("Sauvegarde impossible. Aucune modification n'a été conservée.");
      return false;
    }
    buildDocument();
    return true;
  }
  function removeDossierPage(pageKey){
    if(!presentationLayoutEditing)return false;
    const page=currentDossierPlan.pages.find(p=>p.key===pageKey);
    if(!page)return false;
    const count=page.items.length;
    const warning=count===0
      ?"Supprimer cette page vide du dossier photo ?"
      :"Supprimer cette page du dossier photo ? Ses "+count+" vignette(s) seront déplacées sur d'autres pages, sans modifier le devis ni les articles du projet. Si nécessaire, une page de remplacement sera créée.";
    if(!confirm(warning))return false;
    const plan=pageRemovalAssignments(currentDossierPlan.pages,pageKey);
    if(!plan)return false;
    return persistPresentation(layout=>{
      layout.assignments=plan.assignments;
      layout.pageTexts=layout.pageTexts||{};
      delete layout.pageTexts[pageKey];
      layout.blocks=layout.blocks||{};
      for(const blockKey of Object.keys(layout.blocks)){
        if(blockKey.startsWith(pageKey+"|")||plan.moves.some(move=>
          blockKey===move.from+"|item:"+move.id||blockKey===move.to+"|item:"+move.id)){
          delete layout.blocks[blockKey];
        }
      }
    });
  }
  function openTextDialog(kind,key,fields){
    document.querySelector(".dossier-text-backdrop")?.remove();
    const backdrop=document.createElement("div");
    backdrop.className="dossier-text-backdrop";
    const form=document.createElement("form");
    form.className="dossier-text-panel";
    form.setAttribute("role","dialog");
    form.setAttribute("aria-modal","true");
    form.setAttribute("aria-label","Modifier les textes du dossier");
    const heading=document.createElement("h3");
    heading.textContent=kind==="item"?"Modifier les textes de l'article":"Modifier les textes de la page";
    const help=document.createElement("p");
    help.textContent="Ces textes sont propres au dossier photo : le produit et le devis ne sont pas modifiés.";
    form.append(heading,help);
    const controls=[];
    for(const field of fields){
      const label=document.createElement("label");
      label.textContent=field.label;
      const input=document.createElement("textarea");
      input.rows=field.name==="intro"?3:2;
      input.maxLength=field.name==="intro"?1200:500;
      input.name=field.name;
      input.value=String(field.value??"");
      label.append(input);
      form.append(label);
      controls.push(input);
    }
    const footer=document.createElement("div");
    footer.className="dossier-text-actions";
    const cancel=document.createElement("button");
    cancel.type="button";cancel.textContent="Annuler";
    const reset=document.createElement("button");
    reset.type="button";reset.textContent="Texte d'origine";
    const save=document.createElement("button");
    save.type="submit";save.textContent="Enregistrer";save.className="primary";
    footer.append(cancel,reset,save);
    form.append(footer);backdrop.append(form);document.body.append(backdrop);
    const close=()=>backdrop.remove();
    cancel.onclick=close;
    backdrop.addEventListener("click",e=>{if(e.target===backdrop)close();});
    const escape=e=>{if(e.key==="Escape"){e.preventDefault();close();document.removeEventListener("keydown",escape);}};
    document.addEventListener("keydown",escape);
    const done=()=>{document.removeEventListener("keydown",escape);close();};
    const bucket=kind==="item"?"itemTexts":"pageTexts";
    const update=(resetValue)=>{
      const success=persistPresentation(layout=>{
        layout[bucket]=layout[bucket]||{};
        if(resetValue){
          const remaining={...(layout[bucket][key]||{})};
          controls.forEach(input=>{delete remaining[input.name];});
          if(Object.keys(remaining).length)layout[bucket][key]=remaining;
          else delete layout[bucket][key];
        }else{
          const original=layout[bucket][key]||{};
          const next={...original};
          controls.forEach(input=>{next[input.name]=input.value.trim();});
          layout[bucket][key]=next;
        }
      });
      if(success)done();
    };
    reset.onclick=()=>update(true);
    form.addEventListener("submit",e=>{e.preventDefault();update(false);});
    controls[0]?.focus();
  }
  function decorateDossierPages(){
    if(!presentationLayoutEditing||typeof document==="undefined")return;
    for(const page of document.querySelectorAll("#document .visual-board-page[data-layout-page]")){
      if(!page.querySelector(".layout-delete-page")){
        const del=document.createElement("button");
        del.type="button";
        del.className="layout-delete-page";
        del.textContent="Supprimer la page";
        del.setAttribute("aria-label","Supprimer la page du dossier photo");
        del.onclick=()=>removeDossierPage(page.dataset.layoutPage);
        page.append(del);
      }
      const key=page.dataset.layoutPage;
      const head=page.querySelector(".board-head .layout-controls");
      const intro=page.querySelector(".board-intro .layout-controls");
      const itemNodes=[...page.querySelectorAll(".board-item[data-dossier-item]")];
      const addButton=(controls,onClick)=>{
        if(!controls||controls.querySelector(".layout-text-edit"))return;
        const button=document.createElement("button");
        button.type="button";button.className="layout-text-edit";
        button.textContent="✎";button.title="Modifier les textes";
        button.setAttribute("aria-label","Modifier les textes");
        button.onclick=e=>{e.preventDefault();e.stopPropagation();onClick();};
        controls.append(button);
      };
      addButton(head,()=>{
        const kicker=page.querySelector(".board-head .section-kicker")?.textContent||"";
        const title=page.querySelector(".board-head h2")?.textContent||"";
        openTextDialog("page",key,[
          {name:"kicker",label:"Sur-titre",value:kicker},
          {name:"title",label:"Titre de l'espace",value:title}
        ]);
      });
      addButton(intro,()=>openTextDialog("page",key,[{
        name:"intro",label:"Texte de présentation",
        value:page.querySelector(".board-intro")?.firstChild?.textContent||""
      }]));
      itemNodes.forEach(item=>{
        const controls=item.querySelector(".layout-controls");
        addButton(controls,()=>{
          const p=dossierItemById(item.dataset.dossierItem);
          const brand=item.querySelector(".board-brand")?.textContent||"";
          openTextDialog("item",item.dataset.dossierItem,[
            {name:"designation",label:"Désignation affichée",value:item.querySelector(".board-copy h3")?.textContent||""},
            {name:"brand",label:"Marque / collection affichées",value:brand},
            {name:"finish",label:"Finition ou précision complémentaire",value:p?.finish||""}
          ]);
        });
      });
    }
  }
  return {quoteSectionTotals,renderQuoteRoomSubtotals,pageRemovalAssignments,decorateDossierPages,removeDossierPage};
});
