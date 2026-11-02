/* Supplier shipping by maker/order, calculated on discounted purchase HT totals.
 * Never append one freight charge to each individual article.
 * Naxani's memo has contradictory text (>1000 € with a 1000 € franco):
 * it is intentionally excluded until threshold direction is confirmed.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroSupplierFreight=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const RULES=Object.freeze({
  Amphora:Object.freeze({threshold:500,below:50}),
  Gessi:Object.freeze({threshold:400,below:30}),
  Galassia:Object.freeze({flat:50})
 });
 function calculate(rows){
  const totals=new Map(),quantities=new Map();
  for(const p of rows||[]){
   if(!p||typeof p.manufacturer!=='string')continue;
   const unit=Number(p.netPurchase);
   const qty=Number(p.quantity??1);
   if(!Number.isFinite(unit)||unit<0||!Number.isFinite(qty)||qty<=0)continue;
   totals.set(p.manufacturer,(totals.get(p.manufacturer)||0)+unit*qty);
   quantities.set(p.manufacturer,(quantities.get(p.manufacturer)||0)+qty);
  }
  const byManufacturer={};let total=0;
  for(const [manufacturer,rule] of Object.entries(RULES)){
   const purchaseHT=Math.round((totals.get(manufacturer)||0)*100)/100;
   const hasItems=(quantities.get(manufacturer)||0)>0;
   const freightHT=!hasItems?0:rule.flat!==undefined?rule.flat:purchaseHT>=rule.threshold?0:rule.below;
   byManufacturer[manufacturer]={purchaseHT,freightHT,thresholdHT:rule.threshold??null,hasItems};
   total+=freightHT;
  }
  const naxaniHasItems=(quantities.get('Naxani')||0)>0;
  return {total,byManufacturer,naxaniFreightPending:naxaniHasItems,
    naxaniWarning:naxaniHasItems?'Naxani : mémo contradictoire (franco 1 000 € ; texte « si > 1 000 € »). Frais à valider.':''};
 }
 return {RULES,calculate};
});
