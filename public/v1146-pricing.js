/* HYDROPOLIS_V11_46_PRICING */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.HydropolisV1146Pricing=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const round=(v,d=4)=>{const f=10**d;return Math.round((Number(v)+Number.EPSILON)*f)/f};
  const positive=(v,fallback=0)=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:fallback};
  function requestedSqm(product,value){return round(positive(value,positive(product?.requestedSqm,positive(product?.quantity,1))),3)}
  function isFioraneseSqm(product){return /^Fioranese$/i.test(String(product?.manufacturer||""))&&product?.pricingUnit==="sqm"&&positive(product?.sqmPerBox)>0}
  function boxCount(product,value){if(!isFioraneseSqm(product))return 0;return Math.max(1,Math.ceil((requestedSqm(product,value)-1e-9)/positive(product.sqmPerBox)))}
  function orderedSqm(product,value){if(!isFioraneseSqm(product))return requestedSqm(product,value);return round(boxCount(product,value)*positive(product.sqmPerBox),4)}
  function fioraneseLine(product,value){const requested=requestedSqm(product,value),boxes=boxCount(product,requested),ordered=orderedSqm(product,requested),unitPrice=Math.max(0,Number(product?.priceOverride??product?.price??product?.totalPrice??0)||0);return{requestedSqm:requested,boxes,orderedSqm:ordered,unitPrice,total:round(ordered*unitPrice,2),wasteSqm:round(Math.max(0,ordered-requested),4)}}

  function modelConfig(config,model,kind){const rows=(config?.models||[]).filter(x=>x.name===model);return (kind?rows.find(x=>x.kind===kind):null)||rows[0]||null}
  function variantConfig(model,variant){const vs=model?.variants||[];return vs.find(x=>x.id===variant)||vs[0]||null}
  function ruleById(model,id){return (model?.pricingRules||[]).find(x=>x.id===id)||null}
  function selectedRule(model,selection){
    const variant=variantConfig(model,selection?.variant);
    let id=variant?.pricingRule||"";
    if(!id&&variant?.pricingRuleByFinish)id=variant.pricingRuleByFinish[selection?.finish]||"";
    return {variant,rule:ruleById(model,id)};
  }
  function inRange(v,range){return !Array.isArray(range)||range.length<2||(Number(v)>=Number(range[0])&&Number(v)<=Number(range[1]))}
  function ceilIndex(values,n){for(let i=0;i<values.length;i++)if(Number(n)<=Number(values[i]))return i;return -1}
  function baseQuote(config,selection){
    const model=modelConfig(config,selection?.model,selection?.kind);if(!model)return{status:"pending",reason:"Modèle Resigres introuvable"};
    const {variant,rule}=selectedRule(model,selection||{});if(!rule)return{status:"pending",reason:"Tarif automatique non certifié pour cette variante",model,variant};
    let base=0,breakdown="";
    if(rule.type==="sqm"){
      const w=positive(selection.widthCm),l=positive(selection.lengthCm);if(!w||!l)return{status:"pending",reason:"Indiquez largeur et longueur",model,variant,rule};
      if(!inRange(w,rule.widthRange)||!inRange(l,rule.lengthRange))return{status:"pending",reason:`Dimensions hors plage tarifaire ${rule.widthRange?.join("–")||""} × ${rule.lengthRange?.join("–")||""} cm`,model,variant,rule};
      const rate=Number(rule.rates?.[selection.finish]);if(!(rate>0))return{status:"pending",reason:"Finition sans tarif automatique certifié",model,variant,rule};
      const actual=round(w*l/10000,4),billable=Math.max(actual,Number(rule.minSqm)||0);base=round(billable*rate,2);breakdown=`${round(billable,3)} m² × ${rate} €/m²`;
      return{status:"automatic",basePrice:base,breakdown,areaSqm:actual,billableSqm:billable,rate,model,variant,rule};
    }
    if(rule.type==="matrix"){
      const w=positive(selection.widthCm),l=positive(selection.lengthCm);if(!w||!l)return{status:"pending",reason:"Indiquez largeur et longueur",model,variant,rule};
      const wi=ceilIndex(rule.widths||[],w),li=ceilIndex(rule.lengths||[],l);if(wi<0||li<0)return{status:"pending",reason:"Dimensions hors grille tarifaire",model,variant,rule};
      const cell=rule.matrix?.[wi]?.[li];if(!(Number(cell)>0))return{status:"pending",reason:"Cette cellule du PDF n’est pas certifiée automatiquement",model,variant,rule,matchedWidth:rule.widths[wi],matchedLength:rule.lengths[li]};
      base=Number(cell);breakdown=`Grille ${rule.label} · ${rule.widths[wi]} × ${rule.lengths[li]} cm`;
      return{status:"automatic",basePrice:base,breakdown,matchedWidth:rule.widths[wi],matchedLength:rule.lengths[li],model,variant,rule};
    }
    if(rule.type==="option"){
      const key=String(selection?.[rule.optionField]||"");const price=Number(rule.prices?.[key]);if(!(price>0))return{status:"pending",reason:"Choisissez une matière tarifée",model,variant,rule};
      return{status:"automatic",basePrice:price,breakdown:`${rule.label} · ${key}`,model,variant,rule};
    }
    if(rule.type==="sizeMap"){
      const key=String(selection?.[rule.sizeField||"size"]||"");const price=Number(rule.prices?.[key]);if(!(price>0))return{status:"pending",reason:"Choisissez une dimension tarifée",model,variant,rule};
      return{status:"automatic",basePrice:price,breakdown:`${rule.label} · ${key}`,model,variant,rule};
    }
    return{status:"pending",reason:"Règle tarifaire non prise en charge",model,variant,rule};
  }
  function supplements(config,selection){
    const model=modelConfig(config,selection?.model,selection?.kind);const rules=model?.supplements||[];let total=0;const applied=[];
    for(const rule of rules){
      let active=false,amount=0;
      if(rule.autoWhen==="ral")active=String(selection?.color||"")==="RAL/NCS";
      else if(rule.type==="perCm")active=positive(selection?.[rule.input])>0;
      else active=Array.isArray(selection?.options)&&selection.options.includes(rule.id);
      if(!active)continue;
      if(rule.type==="fixed")amount=Number(rule.amount)||0;
      if(rule.type==="perCm")amount=(Number(rule.amount)||0)*positive(selection?.[rule.input]);
      if(amount>0){total+=amount;applied.push({id:rule.id,label:rule.label,amount:round(amount,2),sourcePage:rule.sourcePage||model?.sourcePage||""})}
    }
    return{total:round(total,2),applied};
  }
  function resigresQuote(config,selection,manualBase=0){
    const base=baseQuote(config,selection||{}),supp=supplements(config,selection||{});
    if(base.status==="automatic")return{...base,supplements:supp,total:round(base.basePrice+supp.total,2),pricingStatus:"automatic-verified"};
    const manual=Math.max(0,Number(manualBase)||0);return{...base,basePrice:manual,supplements:supp,total:round(manual+supp.total,2),pricingStatus:manual>0?"manual-verified-from-pdf":"pending"};
  }
  return{round,positive,requestedSqm,isFioraneseSqm,boxCount,orderedSqm,fioraneseLine,modelConfig,variantConfig,selectedRule,baseQuote,supplements,resigresQuote};
});
