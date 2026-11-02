/* Amphora REEL: documented rough-ins, never inferred from product names alone.
 * Product tariff already carries internalReference/internalPrice for all but RE018/019.
 * Both exceptions documented in the 2026 official catalogue.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroAmphoraRoughIn=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const OFFICIAL_EXCEPTIONS=Object.freeze({RE018:'INT.05',RE019:'INT.01'});
 function resolve(product,catalogRows){
  if(!product||product.manufacturer!=='Amphora')return {required:false};
  // Only external-trim SKUs require a separate rough-in under this price-list.
  const ref=String(product.reference||'');
  if(!/\.EXT\.(?:BS|BB|BC)$/i.test(ref))return {required:false};
  const reference=String(product.internalReference||OFFICIAL_EXCEPTIONS[product.base]||'').trim().toUpperCase();
  if(!/^INT\.\d{2}$/i.test(reference))return {required:true,priced:false,reason:'Corps d’encastrement non identifié dans le tarif.'};
  const source=(catalogRows||[]).filter(x=>x?.manufacturer==='Amphora'&&x.internalReference===reference&&Number(x.internalPrice)>0);
  const priceFromOwn=Number(product.internalPrice||0);
  const values=[...new Set(source.map(x=>Number(x.internalPrice)))];
  if(values.length>1)return {required:true,priced:false,reference,reason:'Prix contradictoires pour '+reference};
  const price=priceFromOwn>0?priceFromOwn:values[0];
  if(!Number.isFinite(price)||price<=0||values.length===1&&Math.abs(price-values[0])>.001)
   return {required:true,priced:false,reference,reason:'Prix du corps '+reference+' non vérifié dans le tarif.'};
  return {required:true,priced:true,reference,price,source:'Amphora REEL tarif 2024',sourceYear:2024,
   officialCompatibility:product.internalReference?'Catalogue tarifé Amphora REEL 2024':'Catalogue officiel Amphora 2026'};
 }
 function bodyRecord(product,roughIn){
  if(!roughIn?.required||!roughIn?.priced)return null;
  const price=roughIn.price;
  return {manufacturer:'Amphora',collection:product.collection||'REEL',reference:roughIn.reference,
   base:roughIn.reference,designation:'Corps d’encastrement '+roughIn.reference+' pour '+product.base,
   category:product.category,price,totalPrice:price,internalReference:null,internalPrice:0,
   purchaseDiscount:50,amphoraRequiredRoughIn:true,requiredRoughIn:true,
   source:roughIn.source,sourceYear:roughIn.sourceYear,finish:'Sans finition apparente',
   image:'',fallbackImage:'',imageSource:'Corps technique · visuel non fourni',
   manufacturerUrl:product.manufacturerUrl||''};
 }
 return {resolve,bodyRecord,OFFICIAL_EXCEPTIONS};
});