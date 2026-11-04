/* Recor 2026 — catalogue-backed configuration without guessed prices.
 * Product brochure and technical drawing PDF page numbers refer to the
 * user-provided 72-page and 37-page 2026 documents (cover = page 1).
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroRecorModel=api;})(typeof window==='object'?window:null,function(){
'use strict';
// The four public Recor 2026 ranges, in the exact manufacturer website / PDF order.
const CATEGORIES=Object.freeze([
 {id:'Baignoires îlot',label:'Baignoires îlot',sub:'Freestanding Bathtubs · 13 modèles'},
 {id:'Baignoires sur pieds',label:'Baignoires sur pieds',sub:'Bathtubs with Feet · 9 modèles'},
 {id:'Finitions premium',label:'Finitions premium',sub:'Premium Finishes · 10 finitions'},
 {id:'Baignoires rectangulaires',label:'Baignoires rectangulaires',sub:'Built-In Bathtubs · baignoires et receveurs'}
]);
const FAMILY_MODELS=Object.freeze({
 'Baignoires îlot':['GIBSON','CROSBY','ALLEN','CANOVA','SIENA','MORGAN','DAKOTA','EIFFEL','EPOQUE','GRAND-EPOQUE','IRIS','CHATEAU','CAMILE'],
 'Baignoires sur pieds':['COLLINS','HUDSON','CARLTON','ANTIQUE','SLIPPER','DUAL','ROLL-TOP','PRIMROSE','LYRA'],
 'Baignoires rectangulaires':['FLEMING','MORITZ','BAVARIA','CLASSIC','BALI','SHOWER-TRAYS']
});
// IDs mirror the official Recor website; premium photos are resolved from their own page.
const PREMIUM_FINISHES=Object.freeze([
 {id:'HAND-GILDED',label:'Dorure à la feuille',original:'Hand Gilded',description:'Feuille d’or, d’argent ou de cuivre'},
 {id:'MOSAIC-EXTERIOR',label:'Mosaïque extérieure',original:'Mosaic Exterior',description:'Nacre ou mosaïque émaillée'},
 {id:'HAND-POLISHED',label:'Polissage à la main',original:'Hand Polished',description:'Métal poli à la main'},
 {id:'SOLID-COPPER',label:'Cuivre massif',original:'Solid Copper',description:'Revêtement extérieur en cuivre'},
 {id:'SOLID-BRASS',label:'Laiton massif',original:'Solid Brass',description:'Revêtement extérieur en laiton'},
 {id:'SOLID-ALUMINIUM',label:'Aluminium massif',original:'Solid Aluminium',description:'Revêtement extérieur en aluminium'},
 {id:'STAINLESS-STEEL',label:'Acier inoxydable',original:'Stainless Steel',description:'Revêtement extérieur en inox'},
 {id:'LEATHER',label:'Cuir',original:'Leather',description:'Revêtement extérieur en cuir'},
 {id:'NATURAL-RUSTIC',label:'Rustique naturel',original:'Natural Rustic',description:'Finition rustique naturelle'},
 {id:'BRONZE-RUSTIC',label:'Bronze rustique',original:'Bronze Rustic',description:'Finition rustique bronze'}
]);
const PREMIUM_ELIGIBILITY=Object.freeze({
 'HAND-GILDED':['HUDSON','CARLTON','ANTIQUE','SLIPPER','DUAL','ROLL-TOP','PRIMROSE','LYRA','SIENA','MORGAN','DAKOTA','EPOQUE','GRAND-EPOQUE','IRIS'],
 'MOSAIC-EXTERIOR':['HUDSON','CARLTON','ANTIQUE','SLIPPER','DUAL','ROLL-TOP','PRIMROSE','LYRA','SIENA'],
 'HAND-POLISHED':['HUDSON','CARLTON','ANTIQUE','SLIPPER','DUAL','ROLL-TOP','PRIMROSE','LYRA','SIENA'],
 'SOLID-COPPER':['DAKOTA','EIFFEL','EPOQUE','IRIS'],
 'SOLID-BRASS':['EPOQUE','IRIS'],
 'SOLID-ALUMINIUM':['EPOQUE','IRIS'],
 'STAINLESS-STEEL':['EPOQUE','IRIS'],
 'LEATHER':['MORGAN','EPOQUE','IRIS'],
 // The two rustic catalog illustrations don't specify eligible bath models.
 'NATURAL-RUSTIC':[],
 'BRONZE-RUSTIC':[]
});
const PDF_MODEL_PAGES=Object.freeze({
 COLLINS:[7,6],HUDSON:[9,7],CARLTON:[11,8],ANTIQUE:[13,9],SLIPPER:[15,10],
 DUAL:[17,11],'ROLL-TOP':[19,12],PRIMROSE:[21,13],LYRA:[23,14],
 CAMILE:[27,16],GIBSON:[29,17],CROSBY:[31,18],ALLEN:[33,19],
 CANOVA:[35,20],SIENA:[37,21],MORGAN:[39,22],DAKOTA:[41,23],
 EIFFEL:[43,24],EPOQUE:[45,25],'GRAND-EPOQUE':[47,26],IRIS:[49,27],
 CHATEAU:[51,28],FLEMING:[61,30],MORITZ:[63,31],BAVARIA:[65,32],
 CLASSIC:[67,33],BALI:[69,34],'SHOWER-TRAYS':[71,35]
});
const TAPHOLABLE=new Set(['CARLTON','ANTIQUE','SLIPPER','DUAL','ROLL-TOP','SIENA','MORGAN','DAKOTA','FLEMING','MORITZ','BAVARIA','CLASSIC','BALI']);
const PREMIUM=new Set(['HUDSON','CARLTON','ANTIQUE','SLIPPER','DUAL','ROLL-TOP','PRIMROSE','LYRA','SIENA','MORGAN','DAKOTA','EPOQUE','GRAND-EPOQUE','IRIS']);
const METALS=PREMIUM_FINISHES.map(x=>x.label);
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
 'bois':{color:'#966b4b',label:'Bois (simulation)',type:'texture'},
 'polissage':{color:'#a6a8a7',label:'Polissage à la main',type:'metal'},
 'feuille':{color:'#c6ac65',label:'Dorure à la feuille',type:'metal'},
 'nacre':{color:'#bcc2c2',label:'Mosaïque nacrée',type:'texture'}
});
const safe=(v)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function modelCode(p){return String(p?.base||'').replace(/^RECOR-/i,'').toUpperCase();}
function modelName(code){if(code==='SHOWER-TRAYS')return 'Receveurs de douche';return String(code||'').replace(/-/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());}
// Precise manufacturer dimensions (mm), distinct from rounded internal tariff SKUs.
const TECHNICAL_SIZES=Object.freeze({
 SLIPPER:{137:'137 × 76,5 × 78 cm',154:'154 × 75 × 77 cm',170:'170 × 76 × 79,5 cm'},
 ANTIQUE:{154:'154 × 75 × 76 cm',170:'170 × 76 × 77 cm',181:'181,5 × 76,5 × 79 cm'},
 DUAL:{154:'154 × 78 × 63,5 cm',170:'170 × 78 × 65 cm'},
 'ROLL-TOP':{137:'137 × 76 × 59 cm',154:'154,7 × 77,5 × 59 cm',170:'171 × 77,5 × 59 cm'}
});
function technicalDimension(model,nominal){
 const mm=String(nominal||'').match(/\d{2,4}/);
 return (TECHNICAL_SIZES[model]||{})[mm?Number(mm[0]):0]||String(nominal||'')+' cm';
}
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
 const listed=FAMILY_MODELS[category]||[];
 const groups=new Map(listed.map(key=>[key,{model:key,label:modelName(key),category,items:[],quoteOnly:false}]));
 for(const p of rows||[]){
  if(p?.manufacturer!=='Recor'||p.collection!==category)continue;
  const key=modelCode(p);
  if(groups.has(key))groups.get(key).items.push(p);
 }
 for(const group of groups.values())group.quoteOnly=group.items.length===0;
 return [...groups.values()];
}
function feetFor(rows,bath){
 if(!bath)return [];
 const model=modelName(modelCode(bath));
 const needle=safe(model).replace(/[^A-Z0-9]/g,'');
 const nominalLength=dimension(bath)?.length||0;
 return (rows||[]).filter(p=>{
  if(p?.manufacturer!=='Recor'||!['Pieds Recor','Socles Recor'].includes(p.collection))return false;
  if(!safe(p.supplierNote).replace(/[^A-Z0-9]/g,'').includes(needle))return false;
  if(p.collection==='Socles Recor'){
   const fixedSize=String(p.designation||'').match(/\b(1540|1700|1800)\s*mm\b/i);
   if(fixedSize&&Math.abs(Number(fixedSize[1])/10-nominalLength)>3)return false;
  }
  return true;
 });
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
return {CATEGORIES,FAMILY_MODELS,PREMIUM_FINISHES,PREMIUM_ELIGIBILITY,PDF_MODEL_PAGES,TECHNICAL_SIZES,technicalDimension,TAPHOLABLE,PREMIUM,METALS,RALS,MATERIALS,
 modelCode,modelName,dimension,finishFamily,pricedOptions,findVariant,groupByModel,feetFor,wastesFor,
 ralColor,materialFromText,selectedTotal};
});