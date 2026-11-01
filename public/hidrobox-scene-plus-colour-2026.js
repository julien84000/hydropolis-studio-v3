/* Hidrobox Scene Plus Colour for shower trays — French February 2026 supplier PDF.
 * LOOVERS: p.47 (PDF page 25) Specials (RAL/NCS) +25 %.
 * UNIQUE: p.51 (PDF page 27) Basics/Trends/Specials +10 %.
 * ICONIK: p.55 (PDF page 29) Basics/Trends/Specials +15 %, OPSH0073
 * already present in manufacturer accessory price schedule.
 * NEO PLUS: current manufacturer catalogue lists Scene blanc only; no priced
 * arbitrary Plus Colour option is fabricated from its white SNEC references.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroHidroboxSceneColour2026=api;})(typeof window==='object'?window:null,function(){
'use strict';
const BAS=['Bianco','Beige','Pietra','Cement','Iron','Graphite'];
const TRE=['Crema','Cappuccino','Terra','Brownie','Cotta','Golden','Sandstone','Blush','Ocean','Lake','Ombra','Dark Liquen','Metropoli','Herbal'];
const COLORS={BLA:['Blanc'],BAS,TRE,SPE:['RAL / NCS']};
const RATES=Object.freeze({loovers:{SPE:25},unique:{BAS:10,TRE:10,SPE:10},iconik:{BAS:15,TRE:15,SPE:15}});
const normalize=c=>String(c||'').toLowerCase().replace(/[^a-z0-9]/g,'');
function quote({collection,material='Scene',group='BLA',color='Blanc',code='',baseRawPrice}={}){
 const name=normalize(collection),rate=RATES[name];
 if(!rate||material!=='Scene')return {ok:false,reason:'Cette collection ou matière n’a pas de supplément Scene Plus Colour vérifié.'};
 const price=Number(baseRawPrice);
 if(!Number.isFinite(price)||price<=0)return {ok:false,reason:'Prix du receveur Scene absent du tarif.'};
 if(group==='BLA'){
   return {ok:true,group,color:'Blanc',percent:0,extraRaw:0,alreadyInFittings:false,
     label:'Scene blanc',supplierOptionReference:''};
 }
 const pct=rate[group];
 if(!pct)return {ok:false,reason:'Tarif Scene Plus Colour '+group+' non publié pour '+name+'. Demander un devis Hidrobox.'};
 if(group==='SPE'){
   if(!/^(?:RAL|NCS)\s*[-\w .]{2,25}$/i.test(String(code).trim()))
     return {ok:false,reason:'Préciser le code RAL/NCS pour la couleur spéciale.'};
   color=String(code).trim();
 }else if(!COLORS[group]?.includes(color)){
   return {ok:false,reason:'La teinte sélectionnée ne correspond pas à '+group+'.'};
 }
 return {ok:true,group,color,percent:pct,
    extraRaw:Math.round(price*pct)/100,
    // ICONIK option OPSH0073 must be charged by accessories.quote, not twice.
    alreadyInFittings:name==='iconik',
    supplierOptionReference:name==='iconik'?'OPSH0073':'',
    label:'Scene Plus Colour '+group+' · '+color+' · +'+pct+' %'};
}
return {COLORS,RATES,quote};
});