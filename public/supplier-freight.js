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
 function radawayShipping(rows,department){
  const eligible=(rows||[]).filter(p=>p?.manufacturer==='Radaway'&&Number(p.quantity??1)>0);
  if(!eligible.length)return {hasItems:false,freightHT:0,status:'not-applicable'};
  const purchaseHT=eligible.reduce((sum,p)=>sum+Number(p.netPurchase||0)*Number(p.quantity||1),0);
  const dept=String(department||'').trim().toUpperCase();
  const special=['04','05','13','2A','2B'].includes(dept);
  if(!dept)return {hasItems:true,purchaseHT,freightHT:0,status:'department-required',
    warning:'Radaway : département de livraison à renseigner pour appliquer le tarif de transport.'};
  let classLevel=0;
  for(const p of eligible){
    const h=Number(p.heightCm),w=Number(p.fixedPanelWidthCm||0);
    const isFixed=!!p.isFixedPanel;
    if(!(h>0))return {hasItems:true,purchaseHT,freightHT:0,status:'dimensions-required',
      warning:'Radaway : hauteur non renseignée, frais de port à confirmer.'};
    if(isFixed&&!(w>0))return {hasItems:true,purchaseHT,freightHT:0,status:'dimensions-required',
      warning:'Radaway : largeur d’une paroi fixe manquante, frais de port à confirmer.'};
    if(h>220||(isFixed&&w>160)){classLevel=2;break}
    if(h>200||(isFixed&&w>=140))classLevel=Math.max(classLevel,1);
  }
  if(classLevel===2)return {hasItems:true,purchaseHT,freightHT:0,status:'real-costs',
    warning:'Radaway : au moins un produit hors gabarit, transport au coût réel à demander.'};
  const threshold=classLevel===0?(special?750:500):(special?1000:750);
  const freight=classLevel===0?(special?130:80):(special?180:130);
  return {hasItems:true,purchaseHT,thresholdHT:threshold,freightHT:purchaseHT>=threshold?0:freight,
    status:purchaseHT>=threshold?'franco':'priced',shippingClass:classLevel,specialDepartment:special};
 }
 function calculate(rows,opts={}){
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
  const radaway=radawayShipping(rows,opts.department);
  if(radaway.hasItems){
    byManufacturer.Radaway=radaway;
    total+=radaway.freightHT;
  }
  const naxaniHasItems=(quantities.get('Naxani')||0)>0;
  return {total,byManufacturer,radawayFreightPending:!!radaway.warning,
    radawayWarning:radaway.warning||'',naxaniFreightPending:naxaniHasItems,
    naxaniWarning:naxaniHasItems?'Naxani : mémo contradictoire (franco 1 000 € ; texte « si > 1 000 € »). Frais à valider.':''};
 }
 return {RULES,calculate,radawayShipping};
});
