/* Hydropolis Dossier Canvas model — project-only graphic overlays, no quote data. */
(function(root,factory){
  const model=factory();
  if(typeof module==='object'&&module.exports)module.exports=model;
  if(root)root.HydroDossierCanvasModel=model;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const limit=(v,lo,hi)=>Math.min(hi,Math.max(lo,Number.isFinite(+v)?+v:lo));
const colors={minimal:'#22272d',editorial:'#a57f4d',signature:'#c9a169'};
const types=new Set(['text','label','rectangle','line','image']);
const cleanText=value=>String(value==null?'':value).slice(0,700);
const cleanColor=(v,fallback='#292e34')=>/^#[0-9a-f]{6}$/i.test(v||'')?v:fallback;
function normalizeBlock(data){
 const type=types.has(data?.type)?data.type:'text';
 const minW=type==='line'?5:8,minH=type==='line'?0.25:2;
 const w=limit(data?.w??31,minW,96),h=limit(data?.h??(type==='line'?0.3:9),minH,80);
 return {
  id:String(data?.id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48)||makeId(),
  type,
  x:limit(data?.x??22,0,100-w),y:limit(data?.y??28,0,100-h),w,h,
  z:Math.round(limit(data?.z??1,1,999)),
  text:cleanText(data?.text??(type==='text'?'Votre texte':'')),
  color:cleanColor(data?.color,'#292e34'),
  background:cleanColor(data?.background,'#ffffff'),
  opacity:limit(data?.opacity??100,10,100),
  size:limit(data?.size??25,8,100),
  align:['left','center','right'].includes(data?.align)?data.align:'left',
  font:['sans','serif'].includes(data?.font)?data.font:'sans',
  locked:!!data?.locked,hidden:!!data?.hidden,
  src:typeof data?.src==='string'&&/^data:image\/(?:png|jpeg|webp);base64,/i.test(data.src)&&data.src.length<=2000000?data.src:'',
  radius:limit(data?.radius??0,0,30)
 };
}
let seq=0;
function makeId(){seq=(seq+1)%100000;return 'c'+Date.now().toString(36)+seq.toString(36);}
function normalizeCanvas(input){
 const pages={};
 for(const [key,items] of Object.entries(input?.pages||{}).slice(0,160)){
  if(!/^[a-zA-Z0-9:_|-]{1,160}$/.test(key)||!Array.isArray(items))continue;
  const ids=new Set();
  pages[key]=items.slice(0,80).map(normalizeBlock).filter(item=>{if(ids.has(item.id))return false;ids.add(item.id);return true;});
 }
 return {version:1,pages};
}
function pagesFor(state,key){return state.pages[key]||(state.pages[key]=[]);}
function add(state,key,input){
 const items=pagesFor(state,key);if(items.length>=80)throw Error('80 éléments maximum par page');
 const next=normalizeBlock({...input,id:makeId(),z:Math.max(0,...items.map(x=>x.z))+1});
 items.push(next);return next;
}
function update(state,key,id,patch){
 const item=pagesFor(state,key).find(x=>x.id===id);if(!item)throw Error('Élément introuvable');
 if(item.locked&&!Object.keys(patch).every(k=>['locked','hidden'].includes(k)))throw Error('Élément verrouillé');
 Object.assign(item,normalizeBlock({...item,...patch,id:item.id,type:item.type}));
 return item;
}
function remove(state,key,id){const list=pagesFor(state,key);const pos=list.findIndex(x=>x.id===id);if(pos<0)return false;if(list[pos].locked)throw Error('Élément verrouillé');list.splice(pos,1);return true;}
function duplicate(state,key,id){
 const item=pagesFor(state,key).find(x=>x.id===id);
 if(!item)throw Error('Élément introuvable');
 return add(state,key,{...item,x:limit(item.x+3,0,100-item.w),y:limit(item.y+3,0,100-item.h),locked:false});
}
function layer(state,key,id,direction){
 const list=pagesFor(state,key),item=list.find(x=>x.id===id);if(!item)throw Error('Élément introuvable');
 if(item.locked)throw Error('Élément verrouillé');
 const ordered=list.slice().sort((a,b)=>a.z-b.z);
 const pos=ordered.findIndex(x=>x.id===id),other=ordered[pos+(direction==='up'?1:-1)];
 if(!other)return item;
 const z=item.z;item.z=other.z;other.z=z;
 if(item.z===other.z){ordered.forEach((x,i)=>{x.z=i+1;});const p=ordered.findIndex(x=>x.id===id),q=ordered.findIndex(x=>x.id===other.id);ordered[p].z=ordered[q].z+1;}
 return item;
}
function preset(name){
 const tone=colors[name]||colors.minimal;
 if(name==='editorial')return [
 {type:'label',text:'LA SÉLECTION',x:7,y:10,w:25,h:5,size:17,color:tone},
 {type:'line',x:7,y:17,w:85,h:.3,color:tone},
 {type:'text',text:'Une expérience sur mesure.',x:7,y:22,w:49,h:16,size:33,font:'serif',color:'#2f2c29'}
 ];
 if(name==='signature')return [
 {type:'rectangle',x:6,y:7,w:88,h:13,background:'#292c2e',opacity:100},
 {type:'label',text:'HYDROPOLIS · SIGNATURE',x:9,y:9,w:51,h:6,size:22,color:'#f4e6d2'},
 {type:'line',x:7,y:85,w:86,h:.35,color:tone}
 ];
 return [
 {type:'label',text:'HYDROPOLIS STUDIO',x:8,y:11,w:35,h:5,size:17,color:'#667079'},
 {type:'line',x:8,y:19,w:84,h:.28,color:'#d4d9dc'},
 {type:'text',text:'Votre univers.',x:8,y:26,w:50,h:14,size:37,color:'#252a30'}
 ];
}
function applyPreset(state,key,name){
 if(!['minimal','editorial','signature'].includes(name))throw Error('Modèle inconnu');
 const list=pagesFor(state,key);if(list.some(x=>x.locked))throw Error('Déverrouillez les éléments avant de changer de modèle.');
 state.pages[key]=[];
 return preset(name).map(item=>add(state,key,item));
}
return {normalizeCanvas,normalizeBlock,makeId,add,update,remove,duplicate,layer,preset,applyPreset,limit};
});