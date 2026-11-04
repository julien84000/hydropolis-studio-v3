/* Recor 2026 — catalogue-backed configuration without guessed prices.
 * Product brochure and technical drawing PDF page numbers refer to the
 * user-provided 72-page and 37-page 2026 documents (cover = page 1).
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroRecorModel=api;})(typeof window==='object'?window:null,function(){
'use strict';
const CATEGORIES=Object.freeze([
 {id:'Baignoires sur pieds',label:'Baignoires sur pieds',sub:'Fonte émaillée · pieds au choix'},
 {id:'Baignoires îlot',label:'Baignoires îlot',sub:'Baignoires autoportantes'},
 {id:'Baignoires rectangulaires',label:'Baignoires encastrées',sub:'Baignoires rectangulaires'},
 {id:'Finitions premium',label:'Finitions premium',sub:'Métaux, dorures, mosaïques et matières'},
 {id:'Pieds Recor',label:'Pieds',sub:'Jeux de pieds compatibles'},
 {id:'Socles Recor',label:'Socles',sub:'Supports et piédestaux'},
 {id:'Accessoires Recor',label:'Vidages et accessoires',sub:'Vidages, siphons, accessoires'}
]);
const PDF_MODEL_PAGES=Object.freeze({
 COLLINS:[7,6],HUDSON:[9,7],CARLTON:[11,8],ANTIQUE:[13,9],SLIPPER:[15,10],
 DUAL:[17,11],'ROLL-TOP':[19,12],PRIMROSE:[21,13],LYRA:[23,14],
 CAMILE:[27,16],GIBSON:[29,17],CROSBY:[31,18],ALLEN:[33,19],
 CANOVA:[35,20],SIENA:[37,21],MORGAN:[39,22],DAKOTA:[41,23],
 EIFFEL:[43,24],EPOQUE:[45,25],'GRAND-EPOQUE':[47,26],IRIS:[49,27],
 CHATEAU:[51,28],FLEMING:[61,30],MORITZ:[63,31],BAVARIA:[65,32],
 CLASSIC:[67,33],BALI:[69,34]
});
const TAPHOLABLE=new Set(['CARLTON','ANTIQUE','SLIPPER','DUAL','ROLL-TOP','SIENA','MORGAN','DAKOTA','FLEMING','MORITZ','BAVARIA','CLASSIC','BALI']);
const PREMIUM=new Set(['HUDSON','CARLTON','ANTIQUE','SLIPPER','DUAL','ROLL-TOP','PRIMROSE','LYRA','SIENA','MORGAN','DAKOTA','EPOQUE','GRAND-EPOQUE','IRIS']);
const METALS=['Cuivre','Laiton','Inox','Aluminium','Bronze rustique','Finition naturelle rustique','Dorure','Argenture','Mosaïque','Cuir'];
const RALS=Object.freeze({
 '9005':'#0a0a0a','9010':'#f5f2e9','9016':'#f6f6f6','7016':'#383e42','7021':'#303438',
 '7035':'#c5c7c4','7032':'#b5b0a1','7039':'#6b665e','7044':'#cac4b0','1013':'#e7dfcb',
 '1015':'#e6d2b5','1024':'#b89d55','3005':'#5f2530','3012':'#d69d8f','5003':'#20395a',
 '5014':'#6a8093','6005':'#154734','6009':'#244b3c','6011':'#769479','8004':'#8b4c39',
 '8017':'#442f29','9001':'#eee9dd','9002':'#dddcd3'
});
const MATERIALS=Object.freeze({
 'cuivre':{color:'#ae6a49',label:'Cuivre',type:'metal'},'laiton':{color:'#b79754',label:'Laiton',type:'metal'},
 'inox':{color:'#8e9799',label:'Inox',type:'metal'},'acier':{color:'#8e9799',label:'Inox',type:'metal'},
 'aluminium':{color:'#b4b9bc',label:'Aluminium',type:'metal'},'bronze':{color:'#67503d',label:'Bronze rustique',type:'metal'},
 'or':{color:'#b99c52',label:'Dorure',type:'metal'},'argent':{color:'#bdc4c9',label:'Argenture',type:'metal'},
 'mosaique':{color:'#7f9c9e',label:'Mosaïque',type:'texture'},'mosaic':{color:'#7f9c9e',label:'Mosaïque',type:'texture'},
 'cuir':{color:'#76543b',label:'Cuir',type:'texture'},'rustique':{color:'#695f50',label:'Finition rustique',type:'texture'},
 'bois':{color:'#966b4b',label:'Bois (simulation)',type:'texture'}
});
const safe=(v)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function modelCode(p){return String(p?.base||'').replace(/^RECOR-/i,'').toUpperCase();}
function modelName(code){return String(code||'').replace(/-/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());}
function dimension(p){
 const m=String(p?.reference||'').match(/-(\d{2,4})-X-(\d{2,4})(?=-|$)/);
 return m?{length:Number(m[1]),width:Number(m[2]),label:m[1]+' × '+m[2]+' cm'}:null;
}
function pricedOptions(rows,model){
 const available=(rows||[]).filter(p=>p.manufacturer==='Recor'&&p.base==='RECOR-'+model&&p.category==='Bain');
 const lengths=[...new Map(available.map(p=>{const d=dimension(p);return d?[d.label,d]:['standard',{label:'Dimensions catalogue'}]})).values()];
 const finishes=[...new Map(available.map(p=>[finishFamily(p),{key:finishFamily(p),label:finishFamily(p)==='RAW'?'Fonte brute extérieure':finishFamily(p)==='WHITE'?'Extérieur peint blanc':p.finish}])).values()];
 const hasHoles=available.some(p=>String(p.finishCode||'').endsWith('-TH'));
 const withoutHoles=available.some(p=>String(p.finishCode||'').endsWith('-NH'));
 return {rows:available,dimensions:lengths,finishes,tapHoles:hasHoles&&withoutHoles,
  technicalPage:PDF_MODEL_PAGES[model]?.[1]||null,brochurePage:PDF_MODEL_PAGES[model]?.[0]||null,
  premium:PREMIUM.has(model),antiSlip:!!PDF_MODEL_PAGES[model],customExterior:finishes.some(f=>f.key==='WHITE')};
}
function finishFamily(p){const v=String(p?.finishCode||'');return v.split('-')[0].toUpperCase()}
function findVariant(rows,model,dim,finish,holes){
 let options=pricedOptions(rows,model).rows.filter(p=>finishFamily(p)===finish);
 if(dim){options=options.filter(p=>dimension(p)?.label===dim)}
 if(options.some(p=>/-(?:NH|TH)$/.test(String(p.finishCode||''))))
   options=options.filter(p=>String(p.finishCode||'').endsWith(holes?'-TH':'-NH'));
 return options[0]||null;
}
function groupByModel(rows,category){
 const groups=new Map();
 for(const p of rows||[]){
  if(p?.manufacturer!=='Recor'||p.collection!==category)continue;
  const key=modelCode(p);
  if(!groups.has(key))groups.set(key,{model:key,label:modelName(key),category,items:[]});
  groups.get(key).items.push(p);
 }
 return [...groups.values()].sort((a,b)=>a.label.localeCompare(b.label,'fr'));
}
function feetFor(rows,bath){
 const model=modelName(modelCode(bath));
 const needle=safe(model).replace(/[^A-Z0-9]/g,'');
 return (rows||[]).filter(p=>p?.manufacturer==='Recor'&&p.collection==='Pieds Recor'&&
   safe(p.supplierNote).replace(/[^A-Z0-9]/g,'').includes(needle));
}
function wastesFor(rows,bath){
 const model=modelCode(bath);
 const excluded=['GIBSON','COLLINS','CARLTON','SIENA','EPOQUE','EIFFEL','CHATEAU','MORITZ','HUDSON'];
 return (rows||[]).filter(p=>p?.manufacturer==='Recor'&&p.collection==='Accessoires Recor'&&
  /vidage|waste/i.test([p.designation,p.originalDescription].join(' '))&&
  !(/classic|classique/i.test(p.designation||'')&&excluded.includes(model)));
}
function ralColor(text){
 const value=String(text||'').trim().toUpperCase().replace(/^RAL\s*/,'');
 if(/^\d{4}$/.test(value))return RALS[value]||null;
 return /^#[\da-f]{6}$/i.test(value)?value:null;
}
function materialFromText(text){
 const v=safe(text).toLowerCase();
 const hit=Object.keys(MATERIALS).find(k=>v.includes(k));return hit?MATERIALS[hit]:null;
}
function productOptions(p){const key=modelCode(p);return {model:key,...pricedOptions([p],key)};}
function selectedTotal(main,foot,waste){
 return [main,foot,waste].reduce((n,p)=>n+Number(p?.price||0),0);
}
return {CATEGORIES,PDF_MODEL_PAGES,TAPHOLABLE,PREMIUM,METALS,RALS,MATERIALS,
 modelCode,modelName,dimension,finishFamily,pricedOptions,findVariant,groupByModel,feetFor,wastesFor,
 ralColor,materialFromText,selectedTotal};
});