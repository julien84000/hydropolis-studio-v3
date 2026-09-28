"use strict";
(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;if(root)root.HydropolisV1149Pricing=api;})(typeof window!=="undefined"?window:globalThis,function(){
  const round2=n=>Math.round((Number(n)||0)*100)/100;
  const modelConfig=(config,name,kind)=>((config&&config.models)||[]).find(x=>x.name===name&&(!kind||x.kind===kind))||null;
  const ceilTier=(value,tiers)=>{const n=Number(value),arr=(tiers||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);if(!Number.isFinite(n)||!arr.length)return null;return arr.find(x=>n<=x)??null};
  function optionSupplements(model,s){
    const applied=[];let total=0;
    const chosen=new Set(Array.isArray(s.options)?s.options:[]);
    for(const rule of model?.supplements||[]){
      if(rule.autoWhen==="ral"){
        if(String(s.color||"").toUpperCase()==="RAL/NCS"){total+=Number(rule.amount)||0;applied.push({id:rule.id,label:rule.label,amount:round2(rule.amount)});}
        continue;
      }
      if(rule.type==="perCm"){
        const qty=Number(s[rule.input]||0);if(qty>0){const a=qty*(Number(rule.amount)||0);total+=a;applied.push({id:rule.id,label:rule.label,amount:round2(a),quantity:qty});}
      }else if(chosen.has(rule.id)){
        const a=Number(rule.amount)||0;total+=a;applied.push({id:rule.id,label:rule.label,amount:round2(a)});
      }
    }
    return {total:round2(total),applied};
  }
  function showerQuote(config,s){
    const model=modelConfig(config,s.model,"shower-tray");if(!model)return {status:"pending",pricingStatus:"manual",reason:"Modèle receveur introuvable",total:0};
    const variant=(model.variants||[]).find(v=>v.id===s.variant)||(model.variants||[])[0];if(!variant)return {status:"pending",pricingStatus:"manual",reason:"Version non sélectionnée",total:0};
    const finish=String(s.finish||"");
    const ruleId=variant.pricingRuleByFinish?.[finish]||variant.pricingRule;
    const rule=(model.pricingRules||[]).find(r=>r.id===ruleId);
    if(!rule)return {status:"pending",pricingStatus:"manual",reason:"Grille tarifaire non certifiée pour cette matière",total:0};
    const w=Number(s.widthCm),l=Number(s.lengthCm);if(!(w>0&&l>0))return {status:"pending",pricingStatus:"manual",reason:"Indiquez largeur et longueur",total:0,rule};
    let basePrice=0,breakdown="",pricedWidth=null,pricedLength=null;
    if(rule.type==="matrix"){
      const widths=(rule.widths||[]).map(Number),lengths=(rule.lengths||[]).map(Number);
      const minW=Math.min(...widths),maxW=Math.max(...widths),minL=Math.min(...lengths),maxL=Math.max(...lengths);
      if(w<minW||w>maxW||l<minL||l>maxL)return {status:"pending",pricingStatus:"manual",reason:`Dimensions hors grille certifiée (${minW}–${maxW} × ${minL}–${maxL} cm)`,total:0,rule};
      pricedWidth=ceilTier(w,widths);pricedLength=ceilTier(l,lengths);
      const wi=widths.indexOf(pricedWidth),li=lengths.indexOf(pricedLength);basePrice=Number(rule.matrix?.[wi]?.[li]);
      if(!(basePrice>0))return {status:"pending",pricingStatus:"manual",reason:`Cellule ${pricedWidth} × ${pricedLength} non certifiée : vérifier le tarif`,total:0,rule,pricedWidth,pricedLength};
      breakdown=`${w} × ${l} cm → palier tarifaire ${pricedWidth} × ${pricedLength} cm · ${finish}`;
    }else if(rule.type==="sqm"){
      const [minW,maxW]=rule.widthRange||[0,Infinity],[minL,maxL]=rule.lengthRange||[0,Infinity];
      if(w<minW||w>maxW||l<minL||l>maxL)return {status:"pending",pricingStatus:"manual",reason:`Dimensions hors plage Contract (${minW}–${maxW} × ${minL}–${maxL} cm)`,total:0,rule};
      const rate=Number(rule.rates?.[finish]);if(!(rate>0))return {status:"pending",pricingStatus:"manual",reason:"Tarif au m² absent pour cette matière",total:0,rule};
      const sqm=Math.max(Number(rule.minSqm)||0,(w*l)/10000);basePrice=round2(sqm*rate);breakdown=`${round2(sqm)} m² × ${rate} €/m² · ${finish}`;
    }else return {status:"pending",pricingStatus:"manual",reason:"Règle tarifaire non prise en charge",total:0,rule};
    const supplements=optionSupplements(model,s);const total=round2(basePrice+supplements.total);
    return {status:"automatic",pricingStatus:"automatic-verified",basePrice:round2(basePrice),supplements,total,breakdown,rule,pricedWidth,pricedLength};
  }
  function seleneQuote(config,s){
    const model=modelConfig(config,"Selene","furniture-basin-top"),v=model?.v49Selene;if(!v)return {status:"pending",pricingStatus:"manual",reason:"Matrice Selene absente",total:0};
    const shape=(v.shapes||[]).find(x=>x.id===s.shape);if(!shape)return {status:"pending",pricingStatus:"manual",reason:"Choisissez la forme de vasque",total:0};
    const material=(v.materials||[]).find(x=>x.id===s.material);if(!material)return {status:"pending",pricingStatus:"manual",reason:"Choisissez la matière",total:0};
    if(!(material.colors||[]).includes(s.color))return {status:"pending",pricingStatus:"manual",reason:"Coloris non disponible pour cette matière",total:0};
    const group=(v.groups||[]).find(x=>x.id===s.basinGroup);if(!group||!(shape.groups||[]).includes(group.id))return {status:"pending",pricingStatus:"manual",reason:"Configuration de vasque incompatible avec la forme choisie",total:0};
    const w=Number(s.widthCm),l=Number(s.lengthCm);if(!(w>0&&l>0))return {status:"pending",pricingStatus:"manual",reason:"Indiquez les dimensions du plan",total:0};
    if(w>Number(v.maxWidthCm||51))return {status:"pending",pricingStatus:"manual",reason:`Largeur maximale ${v.maxWidthCm} cm`,total:0};
    if(l>Number(v.maxLengthCm||201))return {status:"pending",pricingStatus:"manual",reason:`Longueur maximale ${v.maxLengthCm} cm`,total:0};
    const pricedLength=ceilTier(l,group.lengthTiers);if(pricedLength==null)return {status:"pending",pricingStatus:"manual",reason:"Longueur hors grille tarifaire",total:0};
    const li=(group.lengthTiers||[]).map(Number).indexOf(pricedLength),priceClass=material.priceClass||"resin";const basePrice=Number(group.prices?.[priceClass]?.[li]);
    if(!(basePrice>0))return {status:"pending",pricingStatus:"manual",reason:"Tarif Selene non certifié pour cette combinaison",total:0};
    const applied=[];let extra=0;
    if(String(s.color||"").toUpperCase()==="RAL/NCS"){extra+=Number(v.ralSupplement)||0;applied.push({id:"ral",label:"Coloris RAL/NCS",amount:Number(v.ralSupplement)||0});}
    const paid=s.paidOptions||{};
    for(const rule of v.paidOptions||[]){const q=Number(paid[rule.id]||0);if(!(q>0))continue;const a=(Number(rule.amount)||0)*q;extra+=a;applied.push({id:rule.id,label:rule.label,amount:round2(a),quantity:q,unit:rule.unit||""});}
    const supplements={total:round2(extra),applied};
    return {status:"automatic",pricingStatus:"automatic-verified",basePrice:round2(basePrice),supplements,total:round2(basePrice+extra),pricedLength,breakdown:`${group.label} · ${material.label} · largeur ${w} cm · longueur ${l} cm → palier ${pricedLength} cm`,rule:{sourcePage:v.sourcePage||model.sourcePage}};
  }
  return {round2,ceilTier,modelConfig,showerQuote,seleneQuote};
});
