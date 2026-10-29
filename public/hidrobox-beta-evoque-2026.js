/* Hidrobox Beta Evoque — French February 2026 price list, printed pp.138–141.
 * Only the six published 170×90×56 Scene white references are orderable.
 * Marketing p.139 says 650 € for standard exterior colour, while OPBT0008
 * on the detailed tariff p.140 says 666 €: block pricing pending confirmation.
 * Do not invent fully-coloured SKU references or equate exterior colour to Plus Colour.
 */
(function(root){
'use strict';
const POSITIONS=Object.freeze([
 Object.freeze({id:'L',label:'Gauche',referenceWithout:'BBEC0104',referenceWith:'BBEC0107'}),
 Object.freeze({id:'C',label:'Centrée',referenceWithout:'BBEC0105',referenceWith:'BBEC0108'}),
 Object.freeze({id:'R',label:'Droite',referenceWithout:'BBEC0106',referenceWith:'BBEC0109'})
]);
const OPTIONS=Object.freeze({
 OPBT0001:Object.freeze({label:'Bonde click-clack blanc Scene',rawPrice:0}),
 OPBT0005:Object.freeze({label:'Bonde click-clack chromée',rawPrice:0}),
 OPBT0006:Object.freeze({label:'Bonde pressurisée H2 blanc · sans trop-plein seulement',rawPrice:231}),
 OPBT0007:Object.freeze({label:'Bonde pressurisée H2 chromée · sans trop-plein seulement',rawPrice:194}),
 OPBT0008:Object.freeze({label:'Couleur extérieure Basics ou Trends · montant à confirmer',rawPrice:null}),
 OPBT0009:Object.freeze({label:'Couleur extérieure Special RAL/NCS',rawPrice:984}),
 OPBT0015:Object.freeze({label:'Appuie-tête C12 blanc',rawPrice:123}),
 OPBT0016:Object.freeze({label:'Appuie-tête C12 graphite',rawPrice:123})
});
const VARIANTS=Object.freeze(POSITIONS.flatMap(position=>[false,true].map(overflow=>Object.freeze({
 position:position.id,
 reference:overflow?position.referenceWith:position.referenceWithout,
 width:90,length:170,height:56,colour:'BIA',material:'Scene Solid Surface',
 finish:'Lisse',overflow,rawPrice:overflow?4538:4266
}))));
const defaults=()=>({position:'L',overflow:false,drain:'OPBT0001',exterior:'',headrest:''});
const drains=overflow=>overflow?['OPBT0001','OPBT0005']:['OPBT0001','OPBT0005','OPBT0006','OPBT0007'];
function quote(input){
 const s={...defaults(),...input},errors=[],components=[];
 const position=POSITIONS.find(x=>x.id===s.position),overflow=s.overflow===true;
 if(typeof s.overflow!=='boolean')errors.push('Le choix du trop-plein doit être explicite.');
 const variant=VARIANTS.find(x=>position&&x.position===position.id&&x.overflow===overflow);
 if(!variant||typeof s.overflow!=='boolean')errors.push('Forme L/C/R ou trop-plein absent du tarif Beta Evoque.');
 if(variant)components.push({
  label:'Beta Evoque '+position.id+' · 170 × 90 × 56 cm · Scene blanc lisse · '+(overflow?'Trop-plein intégré':'Sans trop-plein'),
  reference:variant.reference,rawPrice:variant.rawPrice
 });
 const addOption=(ref,valid,label)=>{
  if(!ref)return;
  if(!valid.includes(ref))errors.push('Option non compatible ou inconnue : '+ref);
  else if(ref==='OPBT0008')errors.push('Coloration extérieure standard : prix contradictoires entre p.139 (650 €) et tableau OPBT0008 p.140 (666 €) ; confirmation fournisseur requise.');
  else components.push({reference:ref,label:label||OPTIONS[ref].label,rawPrice:OPTIONS[ref].rawPrice});
 };
 addOption(s.drain,drains(overflow));
 if(!s.drain)errors.push('Sélectionnez une bonde.');
 addOption(s.exterior,['OPBT0008','OPBT0009']);
 addOption(s.headrest,['OPBT0015','OPBT0016']);
 const total=components.reduce((sum,item)=>sum+item.rawPrice,0);
 const publicPrice=Math.round(total*104)/100;
 const valid=errors.length===0;
 return {
  ok:valid,errors,reference:variant?.reference||'',variant,configuration:s,components,
  rawPrice:valid?total:null,price:valid?publicPrice:null,
  purchasePrice:valid?Math.round(publicPrice*50)/100:null,purchaseDiscount:50,upliftPct:4,
  source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf',printedPages:[138,139,140,141]
 };
}
root.HydroBetaEvoque2026={POSITIONS,OPTIONS,VARIANTS,defaults,drains,quote};
})(window);
