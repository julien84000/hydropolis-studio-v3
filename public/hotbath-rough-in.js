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

// The 2026 tariff holds concealed bodies as independent supplier SKUs.
// Some exterior rows were imported without their HB.xxx link; derive that
// link exclusively from the exact model codes in the body tariff descriptions.
const norm=s=>String(s||'').toUpperCase().replace(/\s+/g,'');
const trim=p=>/EXT(?:\.|$)/i.test(String(p?.reference||''))&&
  /(trim parts?|external parts?|parties extérieures|without concealed body)/i.test(
    [p?.originalDescription,p?.designation].filter(Boolean).join(' '));
const modelCode=p=>norm(p?.base||p?.reference?.split('.')[0]).replace(/EXT.*$/,'');
function bodyAliases(body){
 const description=String(body?.originalDescription||body?.designation||'').toUpperCase()
   // "CB/CX105" means two official model codes, not a product named "CX105" invented from the trim.
   .replace(/\b([A-Z]{1,3})\/([A-Z]{1,3})(\d+[A-Z0-9]*)\b/g,
     (_,a,b,n)=>a+n+' '+b+n);
 return [...new Set(description.match(/\b[A-Z]{1,3}\d{2,5}[A-Z0-9]*\b/g)||[])];
}
function isBody(p){
 return /^(?:HB\.|HB\d)/i.test(String(p?.reference||''))&&
   /concealed (?:body|part)/i.test(String(p?.originalDescription||p?.designation||''));
}
function bodyIndex(rows){
 const result=new Map();
 for(const b of rows||[]){
  if(b?.manufacturer!=='Hotbath'||!isBody(b)||!Number.isFinite(Number(b.price))||Number(b.price)<=0)continue;
  for(const alias of bodyAliases(b)){
   const options=result.get(alias)||[];
   if(!options.some(x=>x.reference===b.reference))options.push(b);
   result.set(alias,options);
  }
 }
 return result;
}
// Commercial agreement: standard Hotbath 55%; Archie 50% + 10% + 10%
// successively, i.e. 59.5% effective discount, not 70% additive.
function purchaseDiscount(p,chosenCollection=''){
 const selected=String(chosenCollection||p?.hotbathSelectedCollection||'').trim();
 const scope=String(p?.collection||'').trim();
 return /^Archie$/i.test(selected||scope)?59.5:55;
}

function linkCatalog(rows){
 const index=bodyIndex(rows),report={linked:0,already:0,ambiguous:0,unresolved:0};
 for(const p of rows||[]){
  if(p?.manufacturer!=='Hotbath'||!trim(p))continue;
  if(p.internalReference&&Number(p.internalPrice)>0){report.already++;continue}
  const candidates=index.get(modelCode(p))||[];
  // When multiple manufacturer body descriptions list the same trim model,
  // compatibility is ambiguous; never infer from a similar body code.
  const unique=candidates.length===1?candidates[0]:null;
  if(!unique){
   p.roughInRequirement={required:true,reference:'',reason:candidates.length>1?'ambiguous':'not-listed'};
   if(candidates.length>1)report.ambiguous++;else report.unresolved++;
   continue;
  }
  const bodyPrice=Number(unique.price),mainPrice=Number(p.price);
  if(!Number.isFinite(mainPrice)||mainPrice<=0)continue;
  p.internalReference=unique.reference;
  p.sourceInternalReference=unique.sourceReference||unique.reference;
  p.internalPrice=bodyPrice;
  p.internalPurchaseDiscount=purchaseDiscount(p);
  p.totalPrice=Math.round((mainPrice+bodyPrice)*100)/100;
  p.roughInRequirement={required:true,reference:unique.reference,source:'supplier-2026',verified:true};
  p.supplierNote='Corps d’encastrement obligatoire '+unique.reference+' ('+
    bodyPrice.toFixed(2)+' € HT), rattaché à la référence modèle exacte dans le tarif fabricant 2026.';
  report.linked++;
 }
 return report;
}

function resolve(p){
 if(p?.manufacturer!=='Hotbath')return {kind:'none',required:false,verified:false};
 const ref=String(p.internalReference||'').trim();
 const amount=Number(p.internalPrice);
 const base=Number(p.price);
 const declaredTotal=Number(p.totalPrice);
 const requirement=p.roughInRequirement||null;
 const required=Boolean(ref||requirement?.required||requirement?.reference||trim(p)||suggestsConcealed(p));
 if(ref&&Number.isFinite(amount)&&amount>0){
   const priceAgrees=Number.isFinite(base)&&Number.isFinite(declaredTotal)&&Math.abs(declaredTotal-base-amount)<0.03;
   return {kind:'verified',required:true,verified:true,reference:ref,price:amount,
    mainPrice:base,declaredTotal:declaredTotal,priceAgrees,bodyDiscount:purchaseDiscount(p),
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
return {resolve,summary,suggestsConcealed,linkCatalog,bodyIndex,bodyAliases,trim,modelCode,purchaseDiscount};
});
