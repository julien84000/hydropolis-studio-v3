/* HYDROPOLIS_V11_48_PRICING */
(function(root,factory){
  const api=factory(root&&root.HydropolisV1146Pricing);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.HydropolisV1148Pricing=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(V46){
  "use strict";
  const round=(v,d=2)=>{const f=10**d;return Math.round((Number(v)+Number.EPSILON)*f)/f};
  const list=v=>Array.isArray(v)?v:[];
  function modelConfig(config,name,kind){
    const rows=list(config?.models).filter(x=>x.name===name);
    return (kind?rows.find(x=>x.kind===kind):null)||rows[0]||null;
  }
  function dependencyMatrix(config,selection){
    return modelConfig(config,selection?.model,selection?.kind)?.dependencyMatrix||null;
  }
  function sizeOption(matrix,id){return list(matrix?.sizes).find(x=>x.id===id)||null}
  function materialOption(size,id){return list(size?.materials).find(x=>x.id===id)||null}
  function colorOption(material,id){return list(material?.colors).find(x=>x.id===id)||null}
  function availableSizes(config,selection){return list(dependencyMatrix(config,selection)?.sizes)}
  function availableMaterials(config,selection){return list(sizeOption(dependencyMatrix(config,selection),selection?.size)?.materials)}
  function availableColors(config,selection){
    const matrix=dependencyMatrix(config,selection), size=sizeOption(matrix,selection?.size), material=materialOption(size,selection?.material);
    return list(material?.colors);
  }
  function dependentQuote(config,selection){
    const matrix=dependencyMatrix(config,selection);
    if(!matrix)return {status:"not-dependent",reason:"Pas de matrice dépendante"};
    const size=sizeOption(matrix,selection?.size);
    if(!size)return {status:"pending",reason:"Choisissez d’abord la dimension",matrix};
    const material=materialOption(size,selection?.material);
    if(!material)return {status:"pending",reason:"Choisissez ensuite la matière",matrix,size};
    const color=colorOption(material,selection?.color);
    if(!color)return {status:"pending",reason:"Choisissez enfin la finition / couleur",matrix,size,material};
    const base=Number(color.price)||0;
    if(!(base>0))return {status:"pending",reason:"Tarif non certifié pour cette combinaison",matrix,size,material,color};
    const supp=V46?.supplements?V46.supplements(config,selection):{total:0,applied:[]};
    const label=[size.label,material.label,color.label].filter(Boolean).join(" · ");
    return {status:"automatic",pricingStatus:"automatic-verified",basePrice:base,total:round(base+(Number(supp.total)||0),2),supplements:supp,breakdown:label,matrix,size,material,color,rule:{sourcePage:matrix.sourcePage||modelConfig(config,selection?.model,selection?.kind)?.sourcePage||""}};
  }
  function finishColors(config,finish){
    const map=config?.global?.finishColorMap||{};
    return list(map[finish]);
  }
  function genericFinishes(config,model,variant){
    const vs=list(model?.variants);const v=variant?(vs.find(x=>x.id===variant)||null):null;
    const fromVariant=list(v?.finishOptions);if(fromVariant.length)return fromVariant;
    return list(model?.finishOptions);
  }
  function quote(config,selection,manualBase=0){
    if(dependencyMatrix(config,selection))return dependentQuote(config,selection);
    return V46?.resigresQuote?V46.resigresQuote(config,selection,manualBase):{status:"pending",basePrice:Number(manualBase)||0,total:Number(manualBase)||0,supplements:{total:0,applied:[]},reason:"Moteur V11.46 absent"};
  }
  return {modelConfig,dependencyMatrix,sizeOption,materialOption,colorOption,availableSizes,availableMaterials,availableColors,dependentQuote,finishColors,genericFinishes,quote};
});
