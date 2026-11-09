/* Hydropolis 11.64.74 — independent article copies with exact room and quote order.
 * Pure operation shared by project UI and regression tests.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.HydroRoomArticleDuplicate=api;
})(typeof window==='object'?window:null,function(){
'use strict';
function duplicateSelected(selected,roomIds,articleId,targetRoomId,beforeId,makeId){
  if(!Array.isArray(selected)||!Array.isArray(roomIds)||typeof makeId!=='function')
    throw Error('Sélection ou pièces invalides.');
  const target=String(targetRoomId);
  if(!roomIds.some(id=>String(id)===target))throw Error('Pièce de destination introuvable.');
  const byId=new Map(),used=new Set();
  for(const p of selected){
    if(!p||p.id===undefined||p.id===null||!String(p.id)||used.has(String(p.id)))
      throw Error('Identifiants d’articles invalides.');
    byId.set(String(p.id),p);used.add(String(p.id));
  }
  const source=byId.get(String(articleId));
  if(!source)throw Error('Article à dupliquer introuvable.');
  if(source.accessoryFor||source.requiredRoughIn||source.sbordoniConfigurationAccessory)
    throw Error('Dupliquez le produit principal : ses composants liés sont inclus.');
  const anchor=beforeId===undefined||beforeId===null||beforeId===''?null:String(beforeId);
  if(anchor && (!byId.has(anchor)||String(byId.get(anchor).roomId)!==target))
    throw Error('Emplacement de destination invalide.');
  const children=new Map();
  for(const p of selected){
    const parent=String(p.accessoryFor||'');
    if(!parent||!byId.has(parent))continue;
    if(!children.has(parent))children.set(parent,[]);
    children.get(parent).push(p);
  }
  const ordered=[],seen=new Set();
  function visit(p){
    const id=String(p.id);
    if(seen.has(id))throw Error('Liaisons d’articles circulaires.');
    seen.add(id);ordered.push(p);
    for(const child of children.get(id)||[])visit(child);
  }
  visit(source);
  const ids=new Map();
  for(const p of ordered){
    const id=String(makeId());
    if(!id||id==='undefined'||id==='null'||used.has(id))
      throw Error('Impossible de créer un identifiant unique.');
    used.add(id);ids.set(String(p.id),id);
  }
  const copies=ordered.map(p=>{
    const c=JSON.parse(JSON.stringify(p));
    c.id=ids.get(String(p.id));
    c.roomId=targetRoomId;
    if(c.accessoryFor){
      const parentId=ids.get(String(c.accessoryFor));
      if(!parentId)throw Error('Lien de composant non copiable.');
      c.accessoryFor=parentId;
    }
    return c;
  });
  let insertAt;
  if(anchor)insertAt=selected.findIndex(p=>String(p.id)===anchor);
  else{
    insertAt=selected.length;
    for(let i=selected.length-1;i>=0;i--){
      if(String(selected[i].roomId)===target){insertAt=i+1;break;}
    }
  }
  return {
    selected:[...selected.slice(0,insertAt),...copies,...selected.slice(insertAt)],
    copies,
    originals:ordered,
    sourceId:String(source.id),
    duplicateId:copies[0].id
  };
}

async function cloneAttachmentData(result,ctx){
  let missing=0;
  for(let i=0;i<result.copies.length;i++){
    const source=result.originals[i],copy=result.copies[i];
    if(source.customImage && !/^data:image\//i.test(String(source.image||''))){
      try{
        let photo=await ctx.assetGet('photo:'+source.id);
        if(!photo && /^blob:/i.test(String(source.image||''))){
          const response=await fetch(source.image);
          if(response.ok)photo=await response.blob();
        }
        if(photo)await ctx.assetSet('photo:'+copy.id,photo);
        else{copy.customImage=false;copy.image='';copy.images=[];copy.pdfImage='';copy.pdfImages=[];missing++;}
      }catch(_){
        copy.customImage=false;copy.image='';copy.images=[];copy.pdfImage='';copy.pdfImages=[];missing++;
      }
    }
    if(source.customTechnicalSheet){
      let copied=false;
      if(source.technicalSheetAsset?.file && ctx.cloud.currentProjectId && ctx.cloud.token){
        try{
          const response=await fetch(ctx.technicalSheetHref(source));
          if(!response.ok)throw Error('Fiche source indisponible');
          const blob=await response.blob();
          const name=source.technicalSheetLabel||'fiche-technique.pdf';
          const dataBase64=await ctx.fileToBase64(new File([blob],name,{type:'application/pdf'}));
          const uri='/api/projects/'+encodeURIComponent(ctx.cloud.currentProjectId)+'/assets/'+encodeURIComponent(copy.id)+'/technical-sheet';
          const payload=await ctx.apiFetch(uri,{method:'POST',body:JSON.stringify({
            fileName:name,mime:'application/pdf',dataBase64,previousFile:''
          })});
          if(!payload?.asset?.file)throw Error('Copie de la fiche technique impossible');
          copy.technicalSheetAsset=payload.asset;
          copy.technicalSheetUrl='';
          copied=true;
        }catch(e){console.warn('[duplicate article technical PDF]',e);}
      }else{
        try{
          const blob=await ctx.assetGet('tech:'+source.id);
          if(blob){await ctx.assetSet('tech:'+copy.id,blob);copied=true;}
        }catch(e){console.warn('[duplicate article local technical PDF]',e);}
      }
      if(!copied){
        delete copy.technicalSheetAsset;
        copy.customTechnicalSheet=false;
        copy.technicalSheetUrl='';
        copy.includeTechnicalSheet=false;
        missing++;
      }
    }
  }
  return missing;
}
function open(articleId,ctx){
  if(typeof document==='undefined'||!ctx?.state)return;
  const state=ctx.state,source=(state.selected||[]).find(p=>String(p.id)===String(articleId));
  if(!source||source.accessoryFor||source.requiredRoughIn){
    ctx.toast('Dupliquez le produit principal avec ses composants.');return;
  }
  document.querySelector('.article-duplicate-modal')?.close();
  const dialog=document.createElement('dialog');
  dialog.className='article-duplicate-modal';
  dialog.innerHTML='<form class="article-duplicate-form" method="dialog">'+
    '<h3>Dupliquer un article</h3><p class="article-duplicate-description"></p>'+
    '<label>Pièce de destination<select class="article-duplicate-room" required></select></label>'+
    '<label>Emplacement dans la pièce<select class="article-duplicate-position" required></select></label>'+
    '<p class="article-duplicate-help">La copie conserve les références, options, quantités et prix. Elle sera une ligne indépendante du devis.</p>'+
    '<p class="article-duplicate-error" role="alert" hidden></p>'+
    '<div class="article-duplicate-actions"><button type="button" class="btn ghost article-duplicate-cancel">Annuler</button>'+
    '<button type="submit" class="btn primary article-duplicate-confirm">Dupliquer</button></div></form>';
  const roomSelect=dialog.querySelector('.article-duplicate-room');
  const positionSelect=dialog.querySelector('.article-duplicate-position');
  const form=dialog.querySelector('form');
  const error=dialog.querySelector('.article-duplicate-error');
  const confirm=dialog.querySelector('.article-duplicate-confirm');
  dialog.querySelector('.article-duplicate-description').textContent=(source.designation||source.reference||'Article')+
    ' · '+(source.reference||'sans référence');
  const positionOptions=()=>{
    const roomId=roomSelect.value;
    const products=(state.selected||[]).filter(p=>String(p.roomId)===roomId&&!p.accessoryFor&&!p.requiredRoughIn&&!p.sbordoniConfigurationAccessory);
    positionSelect.replaceChildren();
    positionSelect.add(new Option('Au début de la pièce','begin'));
    products.forEach(p=>positionSelect.add(new Option('Après : '+(p.designation||p.reference||'Article')+' · '+(p.reference||''),'after:'+p.id)));
    positionSelect.add(new Option('À la fin de la pièce','end'));
    const own=products.some(p=>String(p.id)===String(articleId));
    positionSelect.value=own?'after:'+articleId:'end';
  };
  (state.rooms||[]).forEach(room=>roomSelect.add(new Option(room.title+(room.subtitle?' · '+room.subtitle:''),room.id)));
  roomSelect.value=source.roomId;
  roomSelect.addEventListener('change',positionOptions);
  positionOptions();
  dialog.querySelector('.article-duplicate-cancel').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const target=roomSelect.value;
    const options=(state.selected||[]).filter(p=>String(p.roomId)===target&&!p.accessoryFor&&!p.requiredRoughIn&&!p.sbordoniConfigurationAccessory);
    const place=positionSelect.value;
    let beforeId=null;
    if(place==='begin')beforeId=options[0]?.id||null;
    else if(place.startsWith('after:')){
      const anchor=place.slice(6),index=options.findIndex(p=>String(p.id)===anchor);
      if(index<0){error.textContent='Emplacement introuvable, réessayez.';error.hidden=false;return;}
      beforeId=options[index+1]?.id||null;
    }else if(place!=='end'){error.textContent='Choisissez un emplacement.';error.hidden=false;return;}
    confirm.disabled=true;error.hidden=true;
    const previous=state.selected;
    const layoutBefore=JSON.parse(JSON.stringify(state.presentationLayout||{blocks:{}}));
    const flags=(state.rooms||[]).map(room=>room.articleOrderCustomized);
    try{
      const result=duplicateSelected(previous,state.rooms.map(room=>room.id),articleId,target,beforeId,()=>crypto.randomUUID());
      const attachmentWarnings=await cloneAttachmentData(result,ctx);
      state.selected=result.selected;
      const room=state.rooms.find(room=>String(room.id)===String(target));
      if(room)room.articleOrderCustomized=true;
      // A previous hand-arranged client page cannot override the new project order.
      const layout=ctx.ensurePresentationLayoutState();
      const prefix=String(target)+':';
      for(const [id,page] of Object.entries(layout.assignments||{}))
        if(result.copies.some(p=>String(p.id)===String(id))||String(page).startsWith(prefix))delete layout.assignments[id];
      for(const key of Object.keys(layout.orders||{}))if(String(key).startsWith(prefix))delete layout.orders[key];
      for(const key of Object.keys(layout.blocks||{}))if(String(key).startsWith(prefix))delete layout.blocks[key];
      if(!ctx.saveState())throw Error('Impossible de sauvegarder la duplication.');
      ctx.renderRooms();ctx.renderSelection();ctx.renderMarginDashboard();
      dialog.close();
      ctx.toast(attachmentWarnings
        ?'Article ajouté au devis. '+attachmentWarnings+' pièce(s) jointe(s) à réimporter.'
        :'Article dupliqué : le devis reprend sa pièce, son prix et son emplacement.');
    }catch(e){
      state.selected=previous;state.presentationLayout=layoutBefore;
      state.rooms.forEach((room,i)=>{
        if(flags[i]===undefined)delete room.articleOrderCustomized;
        else room.articleOrderCustomized=flags[i];
      });
      error.textContent=e.message||'Duplication impossible';error.hidden=false;confirm.disabled=false;
    }
  });
  document.body.append(dialog);
  dialog.showModal();
}

return {duplicateSelected,open};
});
