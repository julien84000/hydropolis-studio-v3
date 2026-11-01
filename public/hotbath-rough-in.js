/* Hotbath 2026 — only the supplier price list authorizes a concealed body.
 * No inferred body reference, finish or zero-priced product may be generated.
 * The existing HydroRoughIn.reconcile inserts mandatory bodies separately.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHotbathRoughIn=api;
})(typeof window==='object'?window:null,function(){
'use strict';
const text=p=>[p?.designation,p?.originalDescription,p?.originalDescriptionIT,p?.productType,p?.category,p?.supplierNote].filter(Boolean).join(' ');
const suggestsConcealed=p=>/(encastr|encastable|encastrable|\binbouw\b|\bconcealed\b|\bbuilt[ -]?in\b|\brecessed\b|\bin[ -]?wall\b)/i.test(text(p));
function resolve(p){
 if(p?.manufacturer!=='Hotbath')return {kind:'none',required:false,verified:false};
 const ref=String(p.internalReference||'').trim();
 const amount=Number(p.internalPrice);
 const base=Number(p.price);
 const declaredTotal=Number(p.totalPrice);
 const requirement=p.roughInRequirement||null;
 const required=Boolean(ref||requirement?.reference||suggestsConcealed(p));
 if(ref&&Number.isFinite(amount)&&amount>0){
   const priceAgrees=Number.isFinite(base)&&Number.isFinite(declaredTotal)&&Math.abs(declaredTotal-base-amount)<0.03;
   return {kind:'verified',required:true,verified:true,reference:ref,price:amount,
    mainPrice:base,declaredTotal:declaredTotal,priceAgrees,
    separateLine:true,mandatory:true,
    note:priceAgrees?'Corps obligatoire sélectionné, ajouté automatiquement en ligne distincte.':
     'Corps identifié au tarif, vérifier la ventilation des prix avant commande.'};
 }
 if(required)return {kind:'unverified',required:true,verified:false,
   reference:ref||String(requirement?.reference||''),price:null,
   separateLine:false,mandatory:true,
   note:'Corps d’encastrement à identifier et à tarifer avec la fiche technique fabricant.'};
 return {kind:'none',required:false,verified:false};
}
function summary(p){
 const r=resolve(p);
 return {status:r.kind,principal:Number(p?.price)||0,body:r.verified?r.price:0,
  total:r.verified&&r.priceAgrees?r.declaredTotal:Number(p?.totalPrice)||Number(p?.price)||0,
  reference:r.reference||'',mandatory:r.required};
}
return {resolve,summary,suggestsConcealed};
});
