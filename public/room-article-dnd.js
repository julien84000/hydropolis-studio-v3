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
let cleanup=[];
let pointerHeld=false,refreshPostponed=false;
// Hotbath's asynchronous media-ready event otherwise rebuilds the room cards
// while a pointer owns a drag, invalidating pointer capture and its source node.
if(typeof window!=='undefined'){
 window.addEventListener('hydro-hotbath-media-ready',e=>{
  if(!pointerHeld)return;
  refreshPostponed=true;
  e.stopImmediatePropagation();
 },true);
}
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
 for(const remove of cleanup){try{remove()}catch{}}
 cleanup=[];
}
function mount(host,options={}){
 destroy();
 if(!host||typeof window==='undefined')return false;
 const zones=[...host.querySelectorAll('.room-products[data-room-id]')];
 if(!zones.length)return false;
 const cards=zone=>[...zone.querySelectorAll(':scope > .room-product[data-product-id]')];
 const collect=()=>Object.fromEntries(zones.map(zone=>[zone.dataset.roomId,cards(zone).map(el=>el.dataset.productId)]));
 const bind=(element,name,fn,opts)=>{
  element.addEventListener(name,fn,opts);
  cleanup.push(()=>element.removeEventListener(name,fn,opts));
 };
 const commit=(item,zone,before)=>{
  zone.insertBefore(item,before);
  try{options.onReorder?.(collect(),item.dataset.productId,zone.dataset.roomId)}
  catch(e){console.error('[room article order]',e);options.onError?.(e);options.onCancel?.();}
 };
 let gesture=null,frame=0;
 const clearMarkers=()=>{
  for(const zone of zones){
   zone.classList.remove('article-drop-zone');
   for(const card of cards(zone))card.classList.remove('article-drop-before','article-drop-after');
  }
 };
 function finish(){
  const previous=gesture;
  gesture=null;
  pointerHeld=false;
  if(previous&&refreshPostponed){
   refreshPostponed=false;
   queueMicrotask(()=>window.dispatchEvent(new Event('hydro-hotbath-media-ready')));
  }
  cancelAnimationFrame(frame);frame=0;
  clearMarkers();
  document.body.classList.remove('room-article-dragging');
  if(previous){
   previous.item.classList.remove('article-drag-chosen');
   previous.badge?.remove();
   try{previous.handle.releasePointerCapture(previous.pointerId)}catch{}
  }
  return previous;
 }
 cleanup.push(finish);
 // The source stays in place until release. Pointer capture delivers both mouse
 // and touch gestures even outside the small grip, without HTML5 drag or a CDN.
 function locate(){
  const g=gesture;
  if(!g?.active)return;
  clearMarkers();g.destination=null;
  const hit=document.elementFromPoint(g.x,g.y);
  const zone=hit?.closest('.room-products[data-room-id]')||hit?.closest('.room-card')?.querySelector('.room-products[data-room-id]');
  if(!zones.includes(zone))return;
  const peers=cards(zone).filter(card=>card!==g.item&&!card.classList.contains('article-linked-card'));
  const before=peers.find(card=>{const box=card.getBoundingClientRect();return g.y<box.top+box.height/2})||null;
  g.destination={zone,before};
  zone.classList.add('article-drop-zone');
  if(before)before.classList.add('article-drop-before');
  else peers.at(-1)?.classList.add('article-drop-after');
 }
 function scrollFrame(){
  const g=gesture;
  if(!g?.active)return;
  // Scroll the nearest overflowing ancestor, then the page, for long projects.
  let scroller=document.elementFromPoint(g.x,g.y);
  while(scroller&&scroller!==document.body){
   if(/auto|scroll/.test(getComputedStyle(scroller).overflowY)&&scroller.scrollHeight>scroller.clientHeight)break;
   scroller=scroller.parentElement;
  }
  const isPage=!scroller||scroller===document.body;
  const box=isPage?{top:0,bottom:window.innerHeight}:scroller.getBoundingClientRect();
  const speed=g.y<box.top+65?-Math.ceil(18*(1-Math.max(0,g.y-box.top)/65)):
   g.y>box.bottom-65?Math.ceil(18*(1-Math.max(0,box.bottom-g.y)/65)):0;
  if(speed){
   if(isPage)window.scrollBy(0,speed);else scroller.scrollTop+=speed;
   locate();
  }
  frame=requestAnimationFrame(scrollFrame);
 }
 bind(host,'pointerdown',e=>{
  const handle=e.target.closest?.('.article-drag-handle');
  if(!handle||!host.contains(handle)||!e.isPrimary||e.button!==0||gesture)return;
  const item=handle.closest('.room-product[data-product-id]');
  if(!item||item.classList.contains('article-linked-card'))return;
  e.preventDefault();
  gesture={handle,item,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:false};
  pointerHeld=true;
  handle.setPointerCapture(e.pointerId);
 });
 bind(document,'pointermove',e=>{
  const g=gesture;
  if(!g||g.pointerId!==e.pointerId)return;
  g.x=e.clientX;g.y=e.clientY;
  if(!g.active&&Math.hypot(g.x-g.startX,g.y-g.startY)<6)return;
  e.preventDefault();
  if(!g.active){
   g.active=true;
   document.body.classList.add('room-article-dragging');
   g.item.classList.add('article-drag-chosen');
   g.badge=document.createElement('div');g.badge.className='article-drag-badge';
   g.badge.textContent=g.handle.getAttribute('aria-label')||'Déplacer cet article';
   document.body.append(g.badge);
   frame=requestAnimationFrame(scrollFrame);
  }
  g.badge.style.left=Math.min(g.x+14,window.innerWidth-220)+'px';
  g.badge.style.top=Math.max(8,g.y-40)+'px';
  locate();
 },{passive:false});
 bind(document,'pointerup',e=>{
  if(!gesture||gesture.pointerId!==e.pointerId)return;
  gesture.x=e.clientX;gesture.y=e.clientY;locate();
  const g=finish();
  if(g.active&&g.destination)commit(g.item,g.destination.zone,g.destination.before);
 });
 const cancel=e=>{if(gesture&&gesture.pointerId===e.pointerId)finish()};
 bind(document,'pointercancel',cancel);
 bind(host,'lostpointercapture',cancel);
 bind(window,'blur',finish);
 bind(document,'keydown',e=>{
  if(e.key==='Escape'&&gesture){e.preventDefault();finish();}
 });
 // Arrow keys offer precise reordering and a non-drag alternative. Alt+arrow
 // transfers the entire group to the adjacent room, including an empty room.
 bind(host,'keydown',e=>{
  const handle=e.target.closest?.('.article-drag-handle');
  if(!handle||!['ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();
  const item=handle.closest('.room-product[data-product-id]'),zone=item.parentElement;
  const direction=e.key==='ArrowUp'?-1:1;
  if(e.altKey){
   const target=zones[zones.indexOf(zone)+direction];
   if(target)commit(item,target,null);
  }else{
   const peers=cards(zone).filter(card=>!card.classList.contains('article-linked-card'));
   const index=peers.indexOf(item),other=peers[index+direction];
   if(other)commit(item,zone,direction<0?other:peers[index+2]||null);
  }
  // The callback re-renders cards; restore keyboard focus by stable product ID.
  const replacement=[...host.querySelectorAll('.room-product[data-product-id]')].find(card=>card.dataset.productId===item.dataset.productId);
  replacement?.querySelector('.article-drag-handle')?.focus();
 });
 for(const handle of host.querySelectorAll('.article-drag-handle')){
  handle.draggable=false;
  handle.setAttribute('aria-keyshortcuts','ArrowUp ArrowDown Alt+ArrowUp Alt+ArrowDown');
  handle.title='Glisser pour déplacer · ↑ / ↓ : ordre · Alt + ↑ / ↓ : changer de pièce';
 }
 bind(host,'dragstart',e=>{if(e.target.closest?.('.article-drag-handle'))e.preventDefault()});
 return true;
}
return {reorderSelected,mount,destroy};
});
