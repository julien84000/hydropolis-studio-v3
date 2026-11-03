/* Hydropolis — Canva-style A4 client dossier layer.
   Content stored only in state.project.dossierCanvas; quotes and catalog untouched. */
(function(){
'use strict';
const M=window.HydroDossierCanvasModel;
if(!M)return;
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>Array.from(p.querySelectorAll(s));
const elt=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const button=(txt,cb,cls='v12-canvas-btn')=>{const e=elt('button',cls,txt);e.type='button';e.addEventListener('click',cb);return e};
let editing=false,key='',selected='',project='',undo=[],redo=[],ready=false;
const maxHistory=35;
function canvas(){const p=state.project;if(!p.dossierCanvas||p.dossierCanvas.version!==1)p.dossierCanvas=M.normalizeCanvas(p.dossierCanvas);return p.dossierCanvas}
function projectIdentity(){return String(cloud?.currentProjectId||'local')+'|'+String(state.project?.name||'')}
function syncIdentity(){const id=projectIdentity();if(project!==id){project=id;key='';selected='';undo=[];redo=[]}}
function pageKey(page,i){
 if(page.classList.contains('cover-page'))return 'cover';
 if(page.dataset.layoutPage)return 'space:'+page.dataset.layoutPage.replace(/[^a-zA-Z0-9:_|-]/g,'_').slice(0,120);
 const kind=['quote-page','contact-page','technical-page','room-page','editorial-page'].find(x=>page.classList.contains(x))||'page';
 return kind+':'+$$('#document > .page').slice(0,i+1).filter(x=>x.classList.contains(kind)).length;
}
function pages(){const ps=$$('#document > .page');ps.forEach((p,i)=>p.dataset.canvasPageKey=pageKey(p,i));return ps}
function setStatus(msg,bad=false){const el=$('#canvasNotice');if(el){el.textContent=msg;el.dataset.error=String(bad)}}
function snapshot(){return JSON.stringify(canvas())}
function store(message){
 if(!saveState()){setStatus('Impossible de sauvegarder dans le navigateur (stockage saturé).',true);return false}
 setStatus(message||'Modifications locales enregistrées. Cliquez sur Enregistrer le projet.');return true
}
function mutation(callback,message){
 syncIdentity();const before=snapshot();
 try{callback(canvas())}catch(err){setStatus(err.message||'Action impossible.',true);return false}
 if(before===snapshot())return true;
 if(!store(message)){state.project.dossierCanvas=JSON.parse(before);render();return false}
 undo.push(before);if(undo.length>maxHistory)undo.shift();redo=[];render();return true
}
function timeTravel(source,target){
 if(!source.length)return;
 target.push(snapshot());state.project.dossierCanvas=M.normalizeCanvas(JSON.parse(source.pop()));
 selected='';store('Modification restaurée localement : enregistrez le projet.');render()
}
function block(){return (canvas().pages[key]||[]).find(x=>x.id===selected)||null}
function selectBlock(id){selected=id;updateUI();$$('.v12-canvas-block').forEach(n=>n.classList.toggle('is-selected',n.dataset.canvasId===id&&n.closest('[data-canvas-layer]')?.dataset.canvasLayer===key))}
function setEditing(value){
 editing=!!value;document.body.classList.toggle('canvas-editing',editing);
 const b=$('#canvasEdit');if(b){b.textContent=editing?'Quitter la composition':'Composer librement';b.setAttribute('aria-pressed',String(editing))}
 render()
}
function savePatch(patch){
 if(!block())return;
 mutation(c=>M.update(c,key,selected,patch),'Propriétés mises à jour localement.')
}
function addType(type){
 if(!key){setStatus('Ouvrez d’abord un dossier client.',true);return}
 if(!editing)setEditing(true);
 if(type==='image'){$('#canvasFile')?.click();return}
 const opts={
  text:{text:'Votre texte',size:29,w:38,h:11},
  label:{text:'LÉGENDE',size:17,w:28,h:6},
  rectangle:{w:24,h:9,background:'#dbd7d0'},
  line:{w:40,h:.35,background:'#b38a4d'}
 };
 mutation(c=>{const b=M.add(c,key,{type,x:18,y:20,...opts[type]});selected=b.id},'Bloc créé localement.')
}
function applyBlockStyle(el,b){
 el.className='v12-canvas-block canvas-'+b.type+(b.id===selected?' is-selected':'')+(b.hidden?' is-hidden':'');
 el.dataset.canvasId=b.id;el.style.left=b.x+'%';el.style.top=b.y+'%';
 el.style.width=b.w+'%';el.style.height=b.h+'%';el.style.zIndex=String(b.z);
 el.style.opacity=String(b.opacity/100);el.style.display=b.hidden?'none':'block';
 el.style.borderRadius=b.radius+'px';
 el.style.setProperty('--canvas-color',b.color);el.style.setProperty('--canvas-background',b.background);
 el.style.setProperty('--canvas-size',b.size+'px');el.style.setProperty('--canvas-align',b.align);
 el.style.setProperty('--canvas-font',b.font==='serif'?'Georgia,"Times New Roman",serif':'-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif')
}
function gesture(e,el,b,action){
 if(!editing||b.locked||e.button!==0)return;
 e.preventDefault();e.stopPropagation();selectBlock(b.id);
 const page=el.closest('.page'),rect=page.getBoundingClientRect();
 if(!rect.width||!rect.height)return;
 const orig={...b},before=snapshot(),handle=e.currentTarget;
 let changed=false;handle.setPointerCapture(e.pointerId);
 const move=ev=>{
  const dx=(ev.clientX-e.clientX)/rect.width*100,dy=(ev.clientY-e.clientY)/rect.height*100;
  if(Math.abs(dx)+Math.abs(dy)>.25)changed=true;
  const snap=v=>Math.round(v*2)/2;
  if(action==='move'){
   b.x=M.limit(snap(orig.x+dx),0,100-b.w);b.y=M.limit(snap(orig.y+dy),0,100-b.h)
  }else{
   b.w=M.limit(snap(orig.w+dx),b.type==='line'?5:8,100-b.x);
   b.h=M.limit(snap(orig.h+dy),b.type==='line'?.25:2,100-b.y)
  }
  applyBlockStyle(el,b)
 };
 const cleanup=()=>{
  handle.removeEventListener('pointermove',move);
  handle.removeEventListener('pointerup',up);
  handle.removeEventListener('pointercancel',cancel);
  try{handle.releasePointerCapture(e.pointerId)}catch(_){}
 };
 const up=()=>{
  cleanup();
  if(changed&&snapshot()!==before){
   if(store('Position enregistrée localement. Enregistrez le projet.')){
    undo.push(before);if(undo.length>maxHistory)undo.shift();redo=[]
   }else state.project.dossierCanvas=M.normalizeCanvas(JSON.parse(before));
   render()
  }
 };
 const cancel=()=>{cleanup();state.project.dossierCanvas=M.normalizeCanvas(JSON.parse(before));render()};
 handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',up);handle.addEventListener('pointercancel',cancel)
}
function drawBlock(layer,b){
 const node=elt('div');applyBlockStyle(node,b);
 if(b.type==='image'){
  if(b.src){const img=elt('img','v12-canvas-photo');img.src=b.src;img.alt='Image personnalisée';node.append(img)}
  else node.append(elt('span','v12-canvas-placeholder','Image'))
 }else if(b.type==='text'||b.type==='label'){
  node.append(elt('div','v12-canvas-text',b.text))
 }
 if(editing){
  node.tabIndex=0;node.setAttribute('role','button');node.setAttribute('aria-label','Sélectionner '+(b.text||b.type).slice(0,45));
  node.addEventListener('click',ev=>{if(!ev.target.closest('.v12-canvas-handle'))selectBlock(b.id)});
  const drag=button('✥',()=>{},'v12-canvas-handle canvas-drag');
  drag.title='Déplacer';drag.setAttribute('aria-label','Déplacer le bloc');
  drag.addEventListener('pointerdown',ev=>gesture(ev,node,b,'move'));node.append(drag);
  const resize=button('↘',()=>{},'v12-canvas-handle canvas-resize');
  resize.title='Redimensionner';resize.setAttribute('aria-label','Redimensionner le bloc');
  resize.addEventListener('pointerdown',ev=>gesture(ev,node,b,'resize'));node.append(resize)
 }
 layer.append(node)
}
function drawDocument(){
 syncIdentity();const c=canvas(),ps=pages();
 if(!ps.some(p=>p.dataset.canvasPageKey===key))key=ps[0]?.dataset.canvasPageKey||'';
 for(const page of ps){
  $(':scope > .v12-canvas-layer',page)?.remove();
  const layer=elt('div','v12-canvas-layer');layer.dataset.canvasLayer=page.dataset.canvasPageKey;
  const items=c.pages[page.dataset.canvasPageKey]||[];
  items.slice().sort((a,b)=>a.z-b.z).forEach(b=>drawBlock(layer,b));page.append(layer)
 }
 const select=$('#canvasPage');
 if(select){
  select.replaceChildren();
  ps.forEach((page,i)=>{
   const opt=elt('option');
   opt.value=page.dataset.canvasPageKey;
   const title=$('h2',page)?.textContent?.trim()||'Page '+(i+1);
   opt.textContent=(i+1)+' · '+(page.classList.contains('cover-page')?'Couverture':title.slice(0,46));
   select.append(opt)
  });
  select.value=key;
 }
}
function layersPanel(){
 const list=$('#canvasLayers');if(!list)return;list.replaceChildren();
 const items=(canvas().pages[key]||[]).slice().sort((a,b)=>b.z-a.z);
 if(!items.length)list.append(elt('p','canvas-muted','Aucun bloc sur cette page.'));
 items.forEach(b=>{
  const row=elt('div','canvas-layer-row'+(selected===b.id?' active':''));
  row.append(button((b.type==='text'?'T':b.type==='image'?'▧':b.type==='line'?'—':'▭')+' '+(b.text||b.type).slice(0,25),()=>selectBlock(b.id),'canvas-layer-name'));
  const toggle=button(b.hidden?'○':'◉',()=>mutation(c=>M.update(c,key,b.id,{hidden:!b.hidden}),'Visibilité enregistrée.'),'canvas-layer-icon');
  toggle.title=b.hidden?'Afficher':'Masquer';
  const lock=button(b.locked?'🔒':'🔓',()=>mutation(c=>M.update(c,key,b.id,{locked:!b.locked}),'Verrouillage enregistré.'),'canvas-layer-icon');
  lock.title=b.locked?'Déverrouiller':'Verrouiller';row.append(toggle,lock);list.append(row)
 })
}
function inspector(){
 const b=block(),root=$('#canvasInspector');if(!root)return;
 root.classList.toggle('canvas-disabled',!b);
 for(const [id,prop] of Object.entries({
  canvasText:'text',canvasFont:'font',canvasAlign:'align',canvasSize:'size',canvasOpacity:'opacity',
  canvasColor:'color',canvasFill:'background',canvasRadius:'radius',canvasX:'x',canvasY:'y',
  canvasW:'w',canvasH:'h',canvasLocked:'locked',canvasHidden:'hidden'
 })){
  const el=$('#'+id);if(!el)continue;
  const value=b?.[prop];
  if(el.type==='checkbox')el.checked=!!value;else el.value=value??'';
  el.disabled=!b||(b.locked&&!['canvasLocked','canvasHidden'].includes(id))||
   (['canvasText','canvasFont','canvasAlign','canvasSize'].includes(id)&&!['text','label'].includes(b?.type))
 }
 for(const id of ['canvasUp','canvasDown','canvasDelete','canvasDuplicate']){
  const el=$('#'+id);if(el)el.disabled=!b||b.locked
 }
}
function render(){drawDocument();updateUI()}
function updateUI(){
 if(!$('#canvasStudio'))return;
 const select=$('#canvasPage');if(select&&key)select.value=key;
 layersPanel();inspector();
 const u=$('#canvasUndo'),r=$('#canvasRedo');if(u)u.disabled=!undo.length;if(r)r.disabled=!redo.length;
}
function bindInput(id,prop){
 const input=$('#'+id);if(!input)return;
 input.addEventListener('change',()=>savePatch({[prop]:input.type==='checkbox'?input.checked:input.value}))
}
function savePreset(){
 if(!key)return;
 const name=window.prompt('Nom du modèle','Mon modèle');
 if(name===null)return;
 const label=name.trim().slice(0,54);if(!label)return;
 const presets=state.project.dossierCanvasPresets||{};
 if(Object.keys(presets).length>=20&&!presets[label]){setStatus('20 modèles par projet maximum.',true);return}
 presets[label]=(canvas().pages[key]||[]).map(x=>({...x,id:M.makeId()}));
 state.project.dossierCanvasPresets=presets;store('Modèle enregistré localement : enregistrez le projet.');refreshPresets()
}
function refreshPresets(){
 const el=$('#canvasPreset');if(!el)return;
 const previous=el.value;el.replaceChildren();
 for(const [value,label] of [['minimal','Minimal · Apple'],['editorial','Éditorial · Magazine'],['signature','Signature · Luxe']]){
  const opt=elt('option');opt.value='built:'+value;opt.textContent=label;el.append(opt)
 }
 Object.keys(state.project?.dossierCanvasPresets||{}).forEach(k=>{
  const opt=elt('option');opt.value='custom:'+k;opt.textContent='Personnel · '+k;el.append(opt)
 });
 if([...el.options].some(x=>x.value===previous))el.value=previous
}
function applyPreset(){
 if(!key)return;
 const value=$('#canvasPreset')?.value;
 if((canvas().pages[key]||[]).length&&!confirm('Remplacer les blocs de cette page ? Les fiches produits et le devis restent inchangés.'))return;
 if(value?.startsWith('built:'))mutation(c=>{M.applyPreset(c,key,value.slice(6));selected=''},'Modèle appliqué.');
 else if(value?.startsWith('custom:')){
  const saved=state.project.dossierCanvasPresets?.[value.slice(7)];
  if(!Array.isArray(saved))return;
  mutation(c=>{
   if((c.pages[key]||[]).some(b=>b.locked))throw Error('Déverrouillez les calques.');
   c.pages[key]=saved.map(b=>M.normalizeBlock({...b,id:M.makeId(),locked:false}));
   selected='';
  },'Modèle personnel appliqué.')
 }
}
async function loadPicture(file){
 if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('Fichier PNG, JPEG ou WebP requis.');
 if(file.size>12*1024*1024)throw Error('Photo supérieure à 12 Mo.');
 const url=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{
   const el=new Image();el.onload=()=>resolve(el);el.onerror=()=>reject(Error('Image illisible.'));el.src=url
  });
  const ratio=Math.min(1,1800/img.naturalWidth,1800/img.naturalHeight),c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(img.naturalWidth*ratio));c.height=Math.max(1,Math.round(img.naturalHeight*ratio));
  c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  let data=c.toDataURL('image/jpeg',.76);
  if(data.length>1900000)data=c.toDataURL('image/jpeg',.54);
  if(data.length>1900000)throw Error('Photo trop volumineuse après compression.');
  return data
 }finally{URL.revokeObjectURL(url)}
}
async function addImage(file){
 try{
  const data=await loadPicture(file);
  mutation(c=>{const b=M.add(c,key,{type:'image',src:data,x:18,y:20,w:39,h:36});selected=b.id},'Photo enregistrée localement.')
 }catch(e){setStatus(e.message,true)}
}
function install(){
 if(ready)return;ready=true;
 const host=$('#view-preview'),anchor=$('#v12DossierStudio')||$('#view-preview .preview-toolbar');
 if(!host||!anchor)return;
 const panel=elt('section','v12-canvas-studio');panel.id='canvasStudio';
 panel.innerHTML=[
 '<div class="canvas-title-row"><div><span class="canvas-kicker">HYDROPOLIS · STUDIO CRÉATIF</span>',
 '<h3>Composition libre des pages</h3><p>Ajoutez, déplacez et superposez textes, images et formes sur vos pages A4.</p></div>',
 '<button type="button" id="canvasEdit" aria-pressed="false" class="canvas-main">Composer librement</button></div>',
 '<div class="canvas-tools"><label>Page<select id="canvasPage"></select></label>',
 '<button data-add="text" type="button">+ Texte</button><button data-add="label" type="button">+ Légende</button>',
 '<button data-add="rectangle" type="button">+ Rectangle</button><button data-add="line" type="button">+ Ligne</button>',
 '<button data-add="image" type="button">+ Photo</button><input id="canvasFile" type="file" accept="image/png,image/jpeg,image/webp" hidden>',
 '<button id="canvasUndo" type="button">↶ Annuler</button><button id="canvasRedo" type="button">↷ Refaire</button></div>',
 '<div class="canvas-panels"><div class="canvas-panel"><b>Modèles et calques</b><div class="canvas-template-row">',
 '<select id="canvasPreset" aria-label="Modèle de page"></select><button id="canvasApply" type="button">Appliquer</button></div>',
 '<button id="canvasSavePreset" type="button" class="canvas-wide">Enregistrer cette page comme modèle</button>',
 '<div id="canvasLayers" class="canvas-layers"></div><div class="canvas-layer-actions">',
 '<button id="canvasUp" type="button">Monter</button><button id="canvasDown" type="button">Descendre</button>',
 '<button id="canvasDuplicate" type="button">Dupliquer</button><button id="canvasDelete" type="button">Supprimer</button></div></div>',
 '<div class="canvas-panel" id="canvasInspector"><b>Propriétés du bloc</b>',
 '<label class="canvas-full">Texte<textarea id="canvasText" rows="2" maxlength="700"></textarea></label>',
 '<div class="canvas-fields">',
 '<label>Police<select id="canvasFont"><option value="sans">Moderne</option><option value="serif">Éditoriale</option></select></label>',
 '<label>Alignement<select id="canvasAlign"><option value="left">Gauche</option><option value="center">Centré</option><option value="right">Droite</option></select></label>',
 '<label>Corps<input id="canvasSize" type="number" min="8" max="100"></label>',
 '<label>Opacité<input id="canvasOpacity" type="number" min="10" max="100"></label>',
 '<label>Couleur<input id="canvasColor" type="color"></label><label>Fond<input id="canvasFill" type="color"></label>',
 '<label>Arrondi<input id="canvasRadius" type="number" min="0" max="30"></label>',
 '<label>X (%)<input id="canvasX" type="number" min="0" max="100" step=".5"></label>',
 '<label>Y (%)<input id="canvasY" type="number" min="0" max="100" step=".5"></label>',
 '<label>Largeur (%)<input id="canvasW" type="number" min="5" max="96" step=".5"></label>',
 '<label>Hauteur (%)<input id="canvasH" type="number" min=".25" max="80" step=".5"></label>',
 '</div><div class="canvas-checks"><label><input id="canvasLocked" type="checkbox"> Verrouillé</label>',
 '<label><input id="canvasHidden" type="checkbox"> Masqué</label></div></div></div>',
 '<div class="canvas-bottom"><span id="canvasNotice" role="status" aria-live="polite">Les modifications sont locales avant l’enregistrement du projet.</span>',
 '<button type="button" id="canvasSave" class="canvas-main">Enregistrer le projet</button></div>'
 ].join('');
 anchor.after(panel);
 $('#canvasEdit').addEventListener('click',()=>setEditing(!editing));
 $('#canvasPage').addEventListener('change',e=>{key=e.target.value;selected='';updateUI();pages().find(p=>p.dataset.canvasPageKey===key)?.scrollIntoView({block:'center',behavior:'auto'})});
 $$('[data-add]',panel).forEach(b=>b.addEventListener('click',()=>addType(b.dataset.add)));
 $('#canvasFile').addEventListener('change',e=>{if(e.target.files[0])addImage(e.target.files[0]);e.target.value=''});
 $('#canvasUndo').addEventListener('click',()=>timeTravel(undo,redo));
 $('#canvasRedo').addEventListener('click',()=>timeTravel(redo,undo));
 $('#canvasApply').addEventListener('click',applyPreset);
 $('#canvasSavePreset').addEventListener('click',savePreset);
 $('#canvasUp').addEventListener('click',()=>mutation(c=>M.layer(c,key,selected,'up'),'Calque déplacé.'));
 $('#canvasDown').addEventListener('click',()=>mutation(c=>M.layer(c,key,selected,'down'),'Calque déplacé.'));
 $('#canvasDuplicate').addEventListener('click',()=>mutation(c=>{selected=M.duplicate(c,key,selected).id},'Bloc dupliqué.'));
 $('#canvasDelete').addEventListener('click',()=>mutation(c=>{M.remove(c,key,selected);selected=''},'Bloc supprimé.'));
 for(const [id,prop] of Object.entries({canvasText:'text',canvasFont:'font',canvasAlign:'align',canvasSize:'size',canvasOpacity:'opacity',canvasColor:'color',canvasFill:'background',canvasRadius:'radius',canvasX:'x',canvasY:'y',canvasW:'w',canvasH:'h',canvasLocked:'locked',canvasHidden:'hidden'}))bindInput(id,prop);
 $('#canvasSave').addEventListener('click',async e=>{
  const b=e.currentTarget;b.disabled=true;
  try{await saveCloudProject();setStatus('Projet synchronisé sur le serveur.')}
  catch(err){setStatus(err.message,true)}finally{b.disabled=false}
 });
 document.addEventListener('keydown',e=>{
  if(!editing||!$('#view-preview')?.classList.contains('active'))return;
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||''))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();timeTravel(e.shiftKey?redo:undo,e.shiftKey?undo:redo);return}
  if(e.key==='Delete'&&selected){e.preventDefault();$('#canvasDelete').click()}
  if(e.key==='Escape'){selectBlock('')}
  const arrows={ArrowUp:[0,-.5],ArrowDown:[0,.5],ArrowLeft:[-.5,0],ArrowRight:[.5,0]};
  if(arrows[e.key]&&block()&&!block().locked){
   e.preventDefault();
   const b=block(),d=arrows[e.key];
   savePatch({x:M.limit(b.x+d[0],0,100-b.w),y:M.limit(b.y+d[1],0,100-b.h)})
  }
 });
 const oldBuild=buildDocument;
 buildDocument=function(){const result=oldBuild.apply(this,arguments);syncIdentity();render();refreshPresets();return result};
 const oldView=showView;
 showView=function(v){const result=oldView.apply(this,arguments);if(v==='preview'){render();refreshPresets()}return result};
 refreshPresets();setEditing(false)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.HydroDossierCanvas={render,setEditing};
})();