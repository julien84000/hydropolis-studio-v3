/* Hidrobox FR V0226 — 29 supplier options not represented as independent-priced
 * stock products. Source PDF page numbers and exact terms are preserved.
 * Included options are 0€ when part of the configured original product.
 * Do not mistake an option code for an independently orderable product.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHidroboxAdditionalOptions2026=api;
})(typeof window==='object'?window:null,function(){
'use strict';
const source=[{"reference":"OPBT0001","page":70,"label":"Bonde click-clack Scene blanche","family":"bain","rule":"included","rawPrice":0},{"reference":"OPBT0005","page":70,"label":"Bonde click-clack chromée","family":"bain","rule":"included","rawPrice":0},{"reference":"OPBT0023","page":70,"label":"Bonde Scene Plus Colour Basic","family":"bain","rule":"included","rawPrice":0},{"reference":"OPBT0024","page":70,"label":"Bonde Scene Plus Colour Trend","family":"bain","rule":"included","rawPrice":0},{"reference":"OPBT0025","page":70,"label":"Bonde Scene Plus Colour Special","family":"bain","rule":"included","rawPrice":0},{"reference":"OPSH0001","page":10,"label":"Grille Point inox","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0002","page":10,"label":"Grille Point Basic","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0005","page":10,"label":"Grille Star inox","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0006","page":10,"label":"Grille Star Basic","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0018","page":10,"label":"Découpe spéciale (plan technique à confirmer)","family":"receveur/panneau","rule":"percent","percent":10},{"reference":"OPSH0019","page":10,"label":"Rebord Neo Plus","family":"receveur","rule":"manufacturer_quote","printedRate":"0,9"},{"reference":"OPSH0020","page":10,"label":"Rebord Neo Plus en configuration spéciale","family":"receveur","rule":"manufacturer_quote","printedRate":"0,9 + 10 %"},{"reference":"OPSH0022","page":14,"label":"Caniveau LINE L60 inox","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0023","page":14,"label":"Caniveau LINE L70 inox","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0024","page":14,"label":"Caniveau LINE L80 inox","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0049","page":14,"label":"Bonde horizontale Viega D50 Domoplex","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0051","page":16,"label":"Cache-bonde TWINS Basic","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0052","page":16,"label":"Cache-bonde TWINS Trend","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0053","page":16,"label":"Cache-bonde TWINS Special","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0054","page":20,"label":"Grille ONE inox","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0056","page":24,"label":"Cache-bonde ARQ Basic","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0057","page":22,"label":"Cache-bonde PURE Basic","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0058","page":30,"label":"Cache-bonde ICONIK blanc","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPSH0073","page":30,"label":"Plus Colour ICONIK","family":"receveur","rule":"percent","percent":15},{"reference":"OPSH0078","page":10,"label":"Bonde horizontale Viega Ø90 Tempoplex","family":"receveur","rule":"included","rawPrice":0},{"reference":"OPWB0139","page":46,"label":"Vasque Program Colour S41 Basic","family":"plan-vasque","rule":"included","rawPrice":0},{"reference":"OPWB0140","page":46,"label":"Vasque Program Colour S41 Trend","family":"plan-vasque","rule":"included","rawPrice":0},{"reference":"OPWB0141","page":46,"label":"Vasque Program Colour S41 Special","family":"plan-vasque","rule":"included","rawPrice":0},{"reference":"OPWB0229","page":58,"label":"Spot Colour finition Special","family":"vasque","rule":"embedded_percent","percent":25}];
const byRef=new Map(source.map(x=>[x.reference,Object.freeze(x)]));
function quote(reference,baseRaw,{embeddedInSupplierPrice=false}={}){
 const item=byRef.get(reference);
 if(!item)return {ok:false,reason:'Référence fournisseur introuvable dans le tarif 2026.'};
 if(item.rule==='manufacturer_quote')
  return {ok:false,requiresManufacturerQuote:true,reference,printedRate:item.printedRate,
   reason:'Le tarif indique « '+item.printedRate+' » sans unité de prix directement exploitable. Confirmation Hidrobox indispensable avant devis.'};
 if(!Number.isFinite(Number(baseRaw))||Number(baseRaw)<0)
  return {ok:false,reason:'Prix de base fabricant indisponible.'};
 if(item.rule==='embedded_percent'&&!embeddedInSupplierPrice)
  return {ok:false,reason:'La surcharge '+item.percent+' % ne doit pas être ajoutée à une référence sans vérification du prix source Spot Colour.'};
 const extraRawPrice=item.rule==='percent'?Math.round(Number(baseRaw)*item.percent)/100:0;
 return {ok:true,reference,rule:item.rule,extraRawPrice,
   extraListPrice:Math.round(extraRawPrice*104)/100,
   embeddedInSupplierPrice:item.rule==='embedded_percent',sourcePage:item.page};
}
if(byRef.size!==29)throw Error('Inventaire des 29 options du PDF Hidrobox 2026 incomplet');
return {rows:source,byRef,quote};
});
