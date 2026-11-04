/* Hydropolis 11.64.61: drag individual catalogue article cards between rooms.
 * Pure reorder function is shared with tests. Linked priced children stay with
 * their parent; no price or configuration field is changed.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroRoomArticleDnD=api;
})(typeof window==='object'?window:null,function(){
'use strict';
let widgets=[];
const same=(a,b)=>String(a)===String(b);
function reorderSelected(selected,roomIds,visibleOrder,movedId,destinationRoomId,isVisible){
 const list=Array.isArray(selected)?selected:[];
 const rooms=Array.isArray(roomIds)?roomIds.map(String):[];
 const roomSet=new Set(rooms);
 if(roomSet.size!==rooms.length||rooms.length===0)throw Error('Pièces invalides');
 const byId=new Map();
 for(const record of list){
  if(!record||!record.id||byId.has(String(record.id)))throw Error('Identifiants d’articles invalides');
  byId.set(String(record.id),record);
 }
 const moving=byId.get(String(movedId));
 if(!moving||!roomSet.has(String(destinationRoomId)))throw Error('Déplacement inconnu');
 if(moving.accessoryFor||moving.requiredRoughIn||moving.sbordoniConfigurationAccessory)
  throw Error('Déplacez le produit principal : les composants liés le suivent.');
 const show=typeof isVisible==='function'?isVisible:()=>true;
 const expected=new Set(list.filter(show).map(p=>String(p.id)));
 const seen=new Set();
 for(const roomId of rooms){
  const values=visibleOrder?.[roomId];
  if(!Array.isArray(values))throw Error('Liste de pièces incomplète');
  for(const id of values){
   const key=String(id);
   if(!expected.has(key)||seen.has(key))throw Error('Ordre d’articles incohérent');
   seen.add(key);
  }
 }
 if(expected.size!==seen.size)throw Error('Articles manquants après déplacement');
 const linked=new Set([String(moving.id)]);
 let changed=true;
 while(changed){
  changed=false;
  for(const p of list){
   if(p.accessoryFor&&linked.has(String(p.accessoryFor))&&!linked.has(String(p.id))){
    linked.add(String(p.id));changed=true;
   }
  }
 }
 const dest=String(destinationRoomId);
 const updated=list.map(p=>linked.has(String(p.id))&&String(p.roomId)!==dest?{...p,roomId:dest}:p);
 const current=new Map(updated.map(p=>[String(p.id),p]));
 const children=new Map();
 for(const p of updated){
  const parent=String(p.accessoryFor||'');
  if(!parent||!current.has(parent))continue;
  if(!children.has(parent))children.set(parent,[]);
  children.get(parent).push(p);
 }
 const output=[],added=new Set();
 function pushGroup(p,roomId){
  if(!p||added.has(String(p.id))||!same(p.roomId,roomId))return;
  added.add(String(p.id));output.push(p);
  for(const child of children.get(String(p.id))||[])pushGroup(child,roomId);
 }
 for(const roomId of rooms){
  for(const id of visibleOrder[roomId]){
   const p=current.get(String(id));
   if(!p||!same(p.roomId,roomId)){
    if(linked.has(String(id)))continue;
    throw Error('Article dans une pièce incorrecte');
   }
   // Keep linked components immediately after the principal in quote and exports.
   if(p.accessoryFor){
    const parent=current.get(String(p.accessoryFor));
    if(parent&&same(parent.roomId,roomId))continue;
   }
   pushGroup(p,roomId);
  }
  // Hidden components and historic orphan lines must never be dropped.
  for(const p of updated)if(same(p.roomId,roomId)&&!added.has(String(p.id)))pushGroup(p,roomId);
 }
 if(output.length!==list.length||added.size!==list.length)throw Error('Réorganisation incomplète');
 return output;
}
function destroy(){
 for(const w of widgets){try{w.destroy()}catch{}}
 widgets=[];
}
function mount(host,options={}){
 destroy();
 if(!host||typeof window==='undefined'||typeof window.Sortable!=='function')return false;
 const zones=[...host.querySelectorAll('.room-products[data-room-id]')];
 if(!zones.length)return false;
 const collect=()=>{
  const order={};
  for(const zone of zones)order[zone.dataset.roomId]=[...zone.querySelectorAll(':scope > .room-product[data-product-id]')].map(el=>el.dataset.productId);
  return order;
 };
 const done=event=>{
  document.body.classList.remove('room-article-dragging');
  const movedId=event.item?.dataset.productId||'';
  const targetRoom=event.to?.dataset.roomId||'';
  if(!movedId||!targetRoom||typeof options.onReorder!=='function'){
   options.onCancel?.();return;
  }
  try{options.onReorder(collect(),movedId,targetRoom)}
  catch(e){console.error('[room article order]',e);options.onError?.(e);options.onCancel?.();}
 };
 for(const zone of zones){
  widgets.push(new window.Sortable(zone,{
   group:{name:'hydropolis-room-articles',pull:true,put:true},
   animation:170,handle:'.article-drag-handle',draggable:'.room-product[data-product-id]:not(.article-linked-card)',
   ghostClass:'article-drag-ghost',chosenClass:'article-drag-chosen',dragClass:'article-drag-moving',
   swapThreshold:0.68,scroll:true,scrollSensitivity:70,scrollSpeed:17,
   onStart:()=>document.body.classList.add('room-article-dragging'),onEnd:done,
   onUnchoose:()=>document.body.classList.remove('room-article-dragging')
  }));
 }
 return true;
}
return {reorderSelected,mount,destroy};
});
