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
return {duplicateSelected};
});
