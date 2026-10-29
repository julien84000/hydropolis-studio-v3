/* Hidrobox SPACE FR February 2026, printed pages 132–137 (PDF pages 68 & 70).
 * Only verified SKU references, dimensions, overflow variants and source prices.
 * The supplier's Plus Colour price INCLUDES its colour; never add OPBT0008/9.
 */
(function(root){
'use strict';
const SIZES=Object.freeze([
 {id:'155',length:155,width:78,height:50},
 {id:'170',length:170,width:80,height:53.5},
 {id:'180',length:180,width:85,height:53.5}
]);
const prices={
 BLA:[[3477,3747],[3754,4024],[4030,4302]],
 BAS:[[5014,5285],[5291,5562],[5568,5839]],
 TRE:[[5014,5285],[5291,5562],[5568,5839]],
 SPE:[[5373,5644],[5650,5920],[5927,6198]]
};
const refs={
 BLA:[1,4,2,5,3,6],
 BAS:[7,8,9,10,11,12],
 TRE:[13,14,15,16,17,18],
 SPE:[19,20,21,22,23,24]
};
const reference=n=>'BSPC'+String(n).padStart(4,'0');
const VARIANTS=Object.entries(prices).flatMap(([colour,bySize])=>
 SIZES.flatMap((size,i)=>[false,true].map((overflow,j)=>Object.freeze({
  reference:reference(refs[colour][i*2+j]),
  length:size.length,width:size.width,height:size.height,sizeId:size.id,colour,overflow,
  rawPrice:bySize[i][j],material:'Scene',finish:'Lisse'
 }))));
const OPTIONS=Object.freeze({
 OPBT0001:{label:'Bonde click-clack Scene blanc',price:0},
 OPBT0005:{label:'Bonde click-clack chromé',price:0},
 OPBT0023:{label:'Bonde click-clack couleur Basics',price:0},
 OPBT0024:{label:'Bonde click-clack couleur Trends',price:0},
 OPBT0025:{label:'Bonde click-clack couleur Specials',price:0},
 OPBT0006:{label:'Bonde pressurisée H2 blanc (sans trop-plein uniquement)',price:231},
 OPBT0007:{label:'Bonde pressurisée H2 chromé (sans trop-plein uniquement)',price:194},
 OPBT0008:{label:'Couleur extérieure Basics/Trends sur baignoire blanche',price:666},
 OPBT0009:{label:'Couleur extérieure Special sur baignoire blanche',price:984},
 OPBT0015:{label:'Appuie-tête C12 blanc',price:123},
 OPBT0016:{label:'Appuie-tête C12 graphite',price:123}
});
const DEFAULT=()=>({sizeId:'155',colour:'BLA',overflow:false,drain:'OPBT0001',exterior:'',headrest:''});
const allowedDrain=(colour,overflow)=>[
 'OPBT0001','OPBT0005',
 ...(colour==='BAS'?['OPBT0023']:colour==='TRE'?['OPBT0024']:colour==='SPE'?['OPBT0025']:[]),
 ...(!overflow?['OPBT0006','OPBT0007']:[])
];
function quote(input){
 const state={...DEFAULT(),...input};
 const errors=[],components=[];
 const colour=String(state.colour||''),overflow=state.overflow===true;
 const size=SIZES.find(s=>s.id===String(state.sizeId));
 const variant=VARIANTS.find(v=>size&&v.sizeId===size.id&&v.colour===colour&&v.overflow===overflow);
 if(!variant)errors.push('Format, finition ou trop-plein absent du tarif Space 2026.');
 else components.push({reference:variant.reference,label:'Space '+variant.length+' × '+variant.width+' × '+variant.height+' cm · '+(colour==='BLA'?'Blanc':'Plus Colour '+colour)+' · '+(overflow?'Trop-plein intégré':'Sans trop-plein'),rawPrice:variant.rawPrice});
 if(!allowedDrain(colour,overflow).includes(state.drain))errors.push('Cette bonde est incompatible avec le trop-plein ou le groupe de couleur choisi.');
 else components.push({reference:state.drain,label:OPTIONS[state.drain].label,rawPrice:OPTIONS[state.drain].price});
 if(state.exterior){
  if(colour!=='BLA')errors.push('Plus Colour intègre déjà sa couleur : ne pas facturer une deuxième coloration extérieure.');
  if(!['OPBT0008','OPBT0009'].includes(state.exterior))errors.push('Code de couleur extérieure non prévu pour Space.');
  else components.push({reference:state.exterior,label:OPTIONS[state.exterior].label,rawPrice:OPTIONS[state.exterior].price});
 }
 if(state.headrest){
  if(!['OPBT0015','OPBT0016'].includes(state.headrest))errors.push('Appuie-tête inconnu au tarif.');
  else components.push({reference:state.headrest,label:OPTIONS[state.headrest].label,rawPrice:OPTIONS[state.headrest].price});
 }
 const rawTotal=components.reduce((sum,p)=>sum+p.rawPrice,0);
 const price=Math.round(rawTotal*104)/100;
 return {
  ok:!errors.length,errors,reference:variant?.reference||'',variant,
  components,configuration:state,rawPrice:errors.length?null:rawTotal,
  price:errors.length?null:price,purchasePrice:errors.length?null:Math.round(price*50)/100,
  upliftPct:4,purchaseDiscount:50,
  source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf',printedPages:[132,133,136,137]
 };
}
root.HydroSpace2026={SIZES,VARIANTS,OPTIONS,DEFAULT,allowedDrain,quote};
})(window);
