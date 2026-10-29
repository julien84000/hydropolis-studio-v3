/* Hidrobox Beta Essential FR 2026 — printed pages 142–145, PDF pages 73–74.
 * Exact 96 BBEC0001–0103 entries applicable to Beta Essential (24 white
 * and 72 Plus Colour); BBEC0025–31 are Beta Fusion and must NEVER be mixed in.
 * All dimensions in centimetres, prices in supplier's EUR ex VAT.
 * The 96 SKU map is generated only from the exact reference/price grids
 * individually verified against the two source tables (not guessed by dimensions).
 */
(function(root){
'use strict';
const FORMS=Object.freeze([
 {key:'oval-v1',name:'Ovale V1',kind:'ovale',sizes:[{id:'170x80',length:170,width:80,height:56,label:'170 × 80 × 56 cm'}],refs:{BLA:[1,5],BAS:[32,33]}},
 {key:'oval-v2',name:'Ovale V2',kind:'ovale',sizes:[{id:'185x95',length:185,width:95,height:56,label:'185 × 95 × 56 cm'}],refs:{BLA:[2,6],BAS:[34,35]}},
 {key:'oval-v3',name:'Ovale V3',kind:'ovale',sizes:[{id:'170x74',length:170,width:74,height:56,label:'170 × 74 × 56 cm'}],refs:{BLA:[3,7],BAS:[36,37]}},
 {key:'oval-v4',name:'Ovale V4',kind:'ovale',sizes:[{id:'157x74',length:157,width:74,height:50,label:'157 × 74 × 50 cm'}],refs:{BLA:[4,8],BAS:[38,39]}},
 {key:'circle-v1',name:'Circular V1',kind:'circular',sizes:[
  {id:'d140',diameter:140,height:56,label:'Ø 140 × 56 cm'},
  {id:'d150',diameter:150,height:56,label:'Ø 150 × 56 cm'}],refs:{BLA:[9,13,17,21],BAS:[40,41,42,43]}},
 {key:'circle-v3',name:'Circular V3',kind:'circular',sizes:[
  {id:'127x140',length:140,width:127,height:56,label:'140 × 127 × 56 cm'},
  {id:'140x150',length:150,width:140,height:56,label:'150 × 140 × 56 cm'}],refs:{BLA:[10,14,18,22],BAS:[44,45,46,47]}},
 {key:'circle-v4',name:'Circular V4',kind:'circular',sizes:[
  {id:'d127',diameter:127,height:50,label:'Ø 127 × 50 cm'},
  {id:'d140',diameter:140,height:50,label:'Ø 140 × 50 cm'}],refs:{BLA:[11,15,19,23],BAS:[48,49,50,51]}},
 {key:'circle-v5',name:'Circular V5',kind:'circular',sizes:[
  {id:'d140',diameter:140,height:56,label:'Ø 140 × 56 cm'},
  {id:'d150',diameter:150,height:56,label:'Ø 150 × 56 cm'}],refs:{BLA:[12,16,20,24],BAS:[52,53,54,55]}}
].map(o=>Object.freeze({...o,sizes:Object.freeze(o.sizes.map(s=>Object.freeze(s)))})));
const FINISH=Object.freeze([
 {id:'BLA',name:'Scene blanc',kind:'white',offset:0},
 {id:'BAS',name:'Plus Colour · Basics',kind:'colour',offset:0},
 {id:'TRE',name:'Plus Colour · Trends',kind:'colour',offset:24},
 {id:'SPE',name:'Plus Colour · Specials',kind:'special',offset:48}
]);
const PRICES=Object.freeze({
 BLA:{ovale:[[4266,4538]],circular:[[4709,4978],[5150,5421]]},
 BAS:{ovale:[[5804,6075]],circular:[[6503,6772],[6943,7215]]},
 TRE:{ovale:[[5804,6075]],circular:[[6503,6772],[6943,7215]]},
 SPE:{ovale:[[6162,6434]],circular:[[6861,7131],[7302,7574]]}
});
const reference=n=>'BBEC'+String(n).padStart(4,'0');
const rows=[];
for(const form of FORMS){
 for(let sizeIndex=0;sizeIndex<form.sizes.length;sizeIndex++){
  for(const finish of FINISH){
   for(let ov=0;ov<2;ov++){
    // White references list the size's no-overflow / overflow in non-consecutive 4-item layout.
    // Plus Colour references list each size's pair consecutively.
    const pairIndex=finish.id==='BLA'&&form.sizes.length===2
     ?sizeIndex*2+ov: sizeIndex*2+ov;
    const n=finish.id==='BLA'?
     form.refs.BLA[pairIndex]:form.refs.BAS[pairIndex]+finish.offset;
    const rawPrice=PRICES[finish.id][form.kind][form.kind==='ovale'?0:sizeIndex][ov];
    rows.push(Object.freeze({
     reference:reference(n),form:form.key,shape:form.name,kind:form.kind,
     sizeId:form.sizes[sizeIndex].id,dimensions:form.sizes[sizeIndex],
     colour:finish.id,overflow:!!ov,rawPrice,material:'Scene Solid Surface',texture:'Lisse',
     finishLabel:finish.name
    }));
   }
  }
 }
}
const VARIANTS=Object.freeze(rows);
const OPTIONS=Object.freeze({
 OPBT0001:{label:'Bonde click-clack blanc Scene',price:0},
 OPBT0005:{label:'Bonde click-clack chromée',price:0},
 OPBT0023:{label:'Bonde click-clack couleur Basics',price:0},
 OPBT0024:{label:'Bonde click-clack couleur Trends',price:0},
 OPBT0025:{label:'Bonde click-clack couleur Specials',price:0},
 OPBT0006:{label:'Bonde pressurisée H2 blanc (sans trop-plein)',price:231},
 OPBT0007:{label:'Bonde pressurisée H2 chromée (sans trop-plein)',price:194},
 OPBT0008:{label:'Couleur extérieure sur baignoire blanche · Basics ou Trends',price:666},
 OPBT0009:{label:'Couleur extérieure sur baignoire blanche · Special RAL/NCS',price:984},
 OPBT0015:{label:'Appuie-tête C12 blanc',price:123},
 OPBT0016:{label:'Appuie-tête C12 graphite',price:123},
 OPBT0029:{label:'Préparation technique à la robinetterie (plans de perçage à fournir)',price:68}
});
const defaults=()=>({form:'oval-v1',sizeId:'170x80',colour:'BLA',overflow:false,drain:'OPBT0001',exterior:'',headrest:'',tapPrep:false,technicalPlanProvided:false});
const availableDrains=(colour,overflow)=>[
 'OPBT0001','OPBT0005',
 ...(colour==='BAS'?['OPBT0023']:colour==='TRE'?['OPBT0024']:colour==='SPE'?['OPBT0025']:[]),
 ...(!overflow?['OPBT0006','OPBT0007']:[])
];
function quote(input){
 const s={...defaults(),...input},errors=[],components=[];
 const form=FORMS.find(f=>f.key===s.form);
 const validSize=form?.sizes.find(size=>size.id===s.sizeId);
 if(typeof s.overflow!=='boolean')errors.push('Le choix de trop-plein est invalide.');
 const variant=VARIANTS.find(v=>validSize&&v.form===s.form&&v.sizeId===validSize.id&&v.colour===s.colour&&v.overflow===s.overflow);
 if(!variant)errors.push('Forme, taille ou couleur absente de la grille Beta Essential 2026.');
 if(variant)components.push({
  reference:variant.reference,label:'Beta Essential '+variant.shape+' · '+validSize.label+' · '+variant.finishLabel+' · '+(variant.overflow?'Avec trop-plein':'Sans trop-plein'),rawPrice:variant.rawPrice
 });
 const add=(ref,allowed)=>{
  if(!ref)return;
  if(!allowed.includes(ref)||!OPTIONS[ref])errors.push('Option incompatible ou inconnue : '+ref);
  else components.push({reference:ref,label:OPTIONS[ref].label,rawPrice:OPTIONS[ref].price});
 };
 add(s.drain,availableDrains(s.colour,s.overflow===true));
 if(!s.drain)errors.push('Une bonde doit être sélectionnée.');
 if(s.exterior&&s.colour!=='BLA')errors.push('Plus Colour inclut déjà la couleur ; aucune seconde facturation de coloration extérieure.');
 add(s.exterior,['OPBT0008','OPBT0009']);
 add(s.headrest,['OPBT0015','OPBT0016']);
 if(typeof s.tapPrep!=='boolean'||typeof s.technicalPlanProvided!=='boolean')errors.push('Indicateur de préparation technique invalide.');
 if(s.tapPrep){
  if(!s.technicalPlanProvided)errors.push('Préparation robinetterie : des plans cotés de perçage sont nécessaires avant chiffrage.');
  components.push({reference:'OPBT0029',label:OPTIONS.OPBT0029.label,rawPrice:OPTIONS.OPBT0029.price});
 }
 const raw=components.reduce((n,c)=>n+c.rawPrice,0),price=Math.round(raw*104)/100;
 const ok=errors.length===0;
 return {ok,errors,reference:variant?.reference||'',variant,configuration:s,
  components,rawPrice:ok?raw:null,price:ok?price:null,purchasePrice:ok?Math.round(price*50)/100:null,
  upliftPct:4,purchaseDiscount:50,source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf',printedPages:[142,143,144,145]};
}
root.HydroBetaEssential2026={FORMS,FINISH,VARIANTS,OPTIONS,defaults,availableDrains,quote};
})(window);
