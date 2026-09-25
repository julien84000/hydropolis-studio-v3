/* HYDROPOLIS_V11_45_PRICING */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.HydropolisV1145Pricing=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const round=(v,d=4)=>{const f=10**d;return Math.round((Number(v)+Number.EPSILON)*f)/f};
  function positive(v,fallback=0){const n=Number(v);return Number.isFinite(n)&&n>0?n:fallback}
  function requestedSqm(product,value){
    return round(positive(value,positive(product?.requestedSqm,positive(product?.quantity,1))),3);
  }
  function isFioraneseSqm(product){
    return /^Fioranese$/i.test(String(product?.manufacturer||"")) && product?.pricingUnit==="sqm" && positive(product?.sqmPerBox)>0;
  }
  function boxCount(product,value){
    if(!isFioraneseSqm(product))return 0;
    const sqm=requestedSqm(product,value), per=positive(product.sqmPerBox);
    return Math.max(1,Math.ceil((sqm-1e-9)/per));
  }
  function orderedSqm(product,value){
    if(!isFioraneseSqm(product))return requestedSqm(product,value);
    return round(boxCount(product,value)*positive(product.sqmPerBox),4);
  }
  function fioraneseLine(product,value){
    const requested=requestedSqm(product,value);
    const boxes=boxCount(product,requested);
    const ordered=orderedSqm(product,requested);
    const unitPrice=Math.max(0,Number(product?.priceOverride??product?.price??product?.totalPrice??0)||0);
    return {requestedSqm:requested,boxes,orderedSqm:ordered,unitPrice,total:round(ordered*unitPrice,2),wasteSqm:round(Math.max(0,ordered-requested),4)};
  }
  function supplementTotal(config,selection){
    const rules=Array.isArray(config?.knownSupplements)?config.knownSupplements:[];
    let total=0;const applied=[];
    for(const rule of rules){
      if(Array.isArray(rule.appliesTo)&&rule.appliesTo.length&& !rule.appliesTo.includes(selection?.model))continue;
      const active=selection?.options?.includes(rule.id) || (rule.input && positive(selection?.[rule.input])>0) || (rule.id==="ral" && String(selection?.ralNcs||"").trim());
      if(!active)continue;
      let amount=0;
      if(rule.type==="fixed")amount=Number(rule.amount)||0;
      else if(rule.type==="perCm")amount=(Number(rule.amount)||0)*positive(selection?.[rule.input]);
      if(amount){total+=amount;applied.push({id:rule.id,label:rule.label,amount:round(amount,2),sourcePage:rule.sourcePage||""});}
    }
    return {total:round(total,2),applied};
  }
  function resigresManualQuote(basePrice,groupConfig,selection){
    const base=Math.max(0,Number(basePrice)||0);
    const supplements=supplementTotal(groupConfig,selection||{});
    return {basePrice:base,supplements,total:round(base+supplements.total,2),pricingStatus:base>0?"manual-verified-from-pdf":"pending"};
  }
  return {round,positive,requestedSqm,isFioraneseSqm,boxCount,orderedSqm,fioraneseLine,supplementTotal,resigresManualQuote};
});
