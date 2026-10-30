/* Hidrobox SPOT washbasins, tariff FR V0226 printed page 113.
 * Distinct model codes and dimensions. Photos are not invented: models without
 * an official image association get an explicit unillustrated-model state. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHidroboxSpot2026=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const scene=[
 [1,1,9,32,42,504],[2,175,13,32,42,468],[9,9,13,32,42,641],
 [17,17,13,32,72,579],[24,24,12,32,72,702],[32,32,13,33,102,764],
 [39,39,13,33,102,897],[46,46,8,32,52.5,592],[53,53,8,32,77.5,630],
 [60,60,10,32,52,504],[62,176,13,32,52,477],[63,63,15,34,54,533],
 [75,75,13,33,102,748],[76,76,15,35,104,805],[124,124,9,33,52,504],
 [125,177,13,33,52,494],[133,133,13,33,82,607],[141,141,13,33,102,748],
 [148,148,10,30,50,504],[159,178,13,36,36,458],[160,160,15,39,39,533],
 [163,163,30,42,42,846],[164,164,30,42,48,846],[167,167,9,40,40,458],
 [169,169,12.5,40,40,458],[170,170,25,38,43,754],[171,171,40,40,45,916],
 [172,172,15,34,50,478],[173,173,17,34,50,511],[174,174,9,32,52,504],
 ['163 mural',179,30,42,42,897],['164 mural',180,30,42,48,897],[186,181,12.5,32,32,412]
 ];
 const color=[ [62,32,52,13,[525,525,656]],
 [125,33,52,13,[543,543,680]],[159,36,36,13,[504,504,630]],
 [169,40,40,12.5,[504,504,630]],[186,32,32,12.5,[454,454,568]]];
 const COLORS={BLA:['Blanc'],BAS:['Bianco','Beige','Pietra','Cement','Iron','Graphite'],
 TRE:['Crema','Cappuccino','Terra','Brownie','Cotta','Golden','Sandstone','Blush','Ocean','Lake','Ombra','Dark Liquen','Metropoli','Herbal'],
 SPE:['RAL / NCS (teinte à préciser)']};
 const rows=scene.map(([model,num,h,width,length,rawPrice])=>({
  reference:'WSPC'+String(num).padStart(4,'0'),model:'Spot '+model,material:'Scene',
  finish:'Lisse',colorGroup:'BLA',width,length,height:h,rawPrice,price:Math.round(rawPrice*104)/100,
  installation:String(model).includes('mural')?'murale':'à poser'
 }));
 for(let k=0;k<color.length;k++){
  const [model,width,length,h,prices]=color[k];
  for(let j=0;j<3;j++){
   const rawPrice=prices[j],group=['BAS','TRE','SPE'][j];
   rows.push({reference:'WSCC'+String(21+k*3+j).padStart(4,'0'),model:'Spot '+model,
    material:'Kromat',finish:'Lisse',colorGroup:group,width,length,height:h,rawPrice,
    price:Math.round(rawPrice*104)/100,installation:'à poser'});
  }
 }
 const byRef=new Map(rows.map(r=>[r.reference,r]));
 if(rows.length!==48||byRef.size!==48)throw Error('Spot 2026 source rows incomplete');
 const options={
   OPWB0050:{label:'Bonde click-clack Scene blanche',rawPrice:72,materials:['Scene']},
   OPWB0051:{label:'Bonde fixe Scene blanche',rawPrice:47,materials:['Scene']},
   OPWB0052:{label:'Bonde click-clack chromée',rawPrice:47,materials:['Scene','Kromat']},
   OPWB0053:{label:'Bonde click-clack blanche',rawPrice:62,materials:['Scene','Kromat']},
   OPWB0054:{label:'Bonde click-clack noire',rawPrice:62,materials:['Scene','Kromat']},
   OPWB0055:{label:'Bonde à écoulement libre chromée',rawPrice:25,materials:['Scene','Kromat']},
   OPWB0056:{label:'Bonde click-clack Kromat Basic',rawPrice:72,materials:['Kromat'],groups:['BAS']},
   OPWB0057:{label:'Bonde click-clack Kromat Trend',rawPrice:72,materials:['Kromat'],groups:['TRE']},
   OPWB0058:{label:'Bonde click-clack Kromat Special',rawPrice:110,materials:['Kromat'],groups:['SPE']},
   OPWB0059:{label:'Bonde fixe Kromat Basic',rawPrice:47,materials:['Kromat'],groups:['BAS']},
   OPWB0060:{label:'Bonde fixe Kromat Trend',rawPrice:47,materials:['Kromat'],groups:['TRE']},
   OPWB0061:{label:'Bonde fixe Kromat Special',rawPrice:87,materials:['Kromat'],groups:['SPE']},
   OPWB0226:{label:'Couleur extérieure Spot Basic',rawPrice:169,materials:['Scene']},
   OPWB0227:{label:'Couleur extérieure Spot Trend',rawPrice:169,materials:['Scene']},
   OPWB0228:{label:'Couleur extérieure Spot Special',rawPrice:241,materials:['Scene']},
   OPWB0007:{label:'Perçage robinetterie H1',rawPrice:23,modelNumbers:[164]},
   OPWB0008:{label:'Perçage robinetterie H2',rawPrice:23,modelNumbers:[164]},
   OPWB0009:{label:'Perçage robinetterie H3',rawPrice:23,modelNumbers:[164]},
   OPWB0010:{label:'Préparation robinetterie spéciale',rawPrice:56,modelNumbers:[164]}
 };
 function optionsFor(row){
  const nr=Number(row.model.match(/\d+/)?.[0]);
  return Object.entries(options).filter(([ref,o])=>
    (!o.materials||o.materials.includes(row.material))&&
    (!o.groups||o.groups.includes(row.colorGroup))&&
    (!o.modelNumbers||o.modelNumbers.includes(nr))).map(([reference,data])=>({reference,...data}));
 }
 function resolve({reference,model,material,color}={}){
  let rowsMatching=reference?[byRef.get(reference)].filter(Boolean):rows;
  if(model)rowsMatching=rowsMatching.filter(r=>r.model===model);
  if(material)rowsMatching=rowsMatching.filter(r=>r.material===material);
  if(color)rowsMatching=rowsMatching.filter(r=>COLORS[r.colorGroup].includes(color));
  if(rowsMatching.length!==1)return {ok:false,reason:!rowsMatching.length?'Ce modèle/matière/couleur ne correspond à aucune référence Spot 2026.':'Choisir une variante exacte du modèle.'};
  return {ok:true,...rowsMatching[0],color:color||COLORS[rowsMatching[0].colorGroup][0]};
 }
 function quote(input,{accessories=[]}={}){
  const product=resolve(input);if(!product.ok)return product;
  const unique=[...new Set(accessories)].filter(ref=>options[ref]);
  const allowed=optionsFor(product),valid=new Set(allowed.map(o=>o.reference));
  if(unique.some(ref=>!valid.has(ref)))return {ok:false,reason:'Une option choisie est incompatible avec le modèle ou la matière Spot.'};
  const components=[{reference:product.reference,label:product.model+' · '+product.width+' × '+product.length+' × '+product.height+' cm',rawPrice:product.rawPrice}];
  for(const ref of unique)components.push({reference:ref,label:options[ref].label,rawPrice:options[ref].rawPrice});
  const rawPrice=components.reduce((sum,c)=>sum+c.rawPrice,0);
  return {...product,ok:true,components,rawPrice,price:Math.round(rawPrice*104)/100,
   optionRawPrice:rawPrice-product.rawPrice,accessories:unique};
 }
 function verifyImported(all){
  const imported=new Map((all||[]).filter(r=>/^W(?:SPC|SCC)\d{4}$/.test(r.reference)).map(r=>[r.reference,r]));
  return {defined:rows.length,imported:imported.size,conflicts:[...imported].filter(([ref,r])=>!byRef.has(ref)||Number(r.rawPrice)!==byRef.get(ref).rawPrice).map(([ref])=>ref)};
 }
 return {rows,byRef,COLORS,options,optionsFor,resolve,quote,verifyImported};
});
