/* Hidrobox 2026 Panneaux muraux. Matrix transcribed from the printed FR
 * price list, pages 60-61. All codes & source prices are manufacturer codes.
 * Do not conflate with shower tray Scene / Kromat finish restrictions. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHidroboxPanels2026=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const bands=[
  ['70-80',['80-100','101-120','121-140','141-160','161-180','181-200','201-220','221-240'],
   [361,433,504,577,648,721,839,971],[451,541,630,722,810,901,1050,1214]],
  ['81-90',['81-100','101-120','121-140','141-160','161-180','181-200','201-220','221-240'],
   [406,486,568,648,731,811,946,1091],[507,608,710,810,913,1014,1183,1363]],
  ['91-100',['91-100','101-120','121-140','141-160','161-180','181-200','201-220','221-240'],
   [451,541,646,736,845,937,1114,1285],[564,677,808,920,1056,1172,1393,1607]],
  ['101-120',['101-120','121-140','141-160','161-180','181-200','201-220','221-240'],
   [648,785,899,1033,1146,1361,1568],[810,982,1123,1292,1433,1702,1961]]
 ];
 const COLORS={BLA:['Blanc'],BAS:['Bianco','Beige','Pietra','Cement','Iron','Graphite'],
 TRE:['Crema','Cappuccino','Terra','Brownie','Cotta','Golden','Sandstone','Blush',
  'Ocean','Lake','Ombra','Dark Liquen','Metropoli','Herbal'],
 SPE:['RAL / NCS (teinte à préciser)']};
 const BASE_CODES={
  BLA:{Lisse:1,Ardoise:32,Microtex:559,Ciment:528},
  BAS:{Lisse:590,Ardoise:683,Microtex:869,Ciment:776},
  TRE:{Lisse:621,Ardoise:714,Microtex:900,Ciment:807},
  SPE:{Lisse:652,Ardoise:745,Microtex:931,Ciment:838}
 };
 const mapped=[];
 let bandIndex=0;
 for(const [width,lengths,standard,special] of bands){
  for(let j=0;j<lengths.length;j++){
   const length=lengths[j];
   for(const [group,columns] of Object.entries(BASE_CODES))
    for(const [texture,start] of Object.entries(columns)){
     const sku='PPAC'+String(start+bandIndex).padStart(4,'0');
     const rawPrice=(group==='SPE'?special:standard)[j];
     mapped.push(Object.freeze({reference:sku,model:'Panneau rectangulaire',material:'Scene',
      finish:texture,colorGroup:group,width,length,rawPrice,price:Math.round(rawPrice*104)/100,
      source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf',sourcePage:bandIndex<16?60:61}));
    }
   bandIndex++;
  }
 }
 const refIndex=new Map(mapped.map(x=>[x.reference,x]));
 if(mapped.length!==496||refIndex.size!==496)throw Error('Matrix 2026 panels incomplete');
 const extra=Object.freeze({
  'OPSH0059':{label:'Niche pour panneau 60 cm',rawPrice:969},
  'OPSH0060':{label:'Niche pour panneau 90 cm',rawPrice:1258},
  'OPSH0061':{label:'Niche pour panneau 140 cm',rawPrice:1833},
  'OPSH0062':{label:'Caisson robinetterie pour niche',rawPrice:530},
  'OPSH0063':{label:'Préparation robinetterie pour niche',rawPrice:82},
  'OPSH0018':{label:'Découpe spéciale · plan technique requis',percent:10}
 });
 const span=v=>{const a=String(v).split('-').map(Number);return a.length===1?[a[0],a[0]]:a;};
 const valid=(v,b)=>Number.isInteger(Number(v))&&Number(v)>=span(b)[0]&&Number(v)<=span(b)[1];
 const GROUPS=Object.keys(COLORS),TEXTURES=['Lisse','Ardoise','Microtex','Ciment'];
 function select({material='Scene',texture='Lisse',color='Blanc',width,length}={}){
  const group=GROUPS.find(k=>COLORS[k].includes(color));
  if(material!=='Scene'||!TEXTURES.includes(texture)||!group)return {ok:false,reason:'Matière, texture ou couleur panneau non proposée dans le tarif 2026.'};
  if(!Number.isInteger(Number(width))||!Number.isInteger(Number(length))||width<70||width>120||length<80||length>240)
   return {ok:false,reason:'Saisir une largeur entière de 70 à 120 cm et une longueur entière de 80 à 240 cm.'};
  const found=mapped.filter(x=>x.material===material&&x.finish===texture&&x.colorGroup===group&&
    valid(width,x.width)&&valid(length,x.length));
  if(found.length!==1)return {ok:false,reason:'Aucune tranche tarifaire unique pour '+width+' × '+length+' cm. Vérifier la faisabilité fabricant.'};
  return {ok:true,...found[0],color,widthCm:Number(width),lengthCm:Number(length)};
 }
 function quote(input,opts={}){
  const base=select(input);if(!base.ok)return base;
  const selected=[...new Set((opts.accessories||[]).filter(x=>extra[x]))];
  let addon=0;const components=[{reference:base.reference,label:'Panneau '+base.widthCm+' × '+base.lengthCm+' cm · '+base.finish+' · '+base.color,rawPrice:base.rawPrice}];
  for(const ref of selected){
   const option=extra[ref],charge=option.percent?Math.round(base.rawPrice*option.percent)/100:option.rawPrice;
   addon+=charge;components.push({reference:ref,label:option.label,rawPrice:charge});
  }
  const rawPrice=base.rawPrice+addon;
  return {...base,ok:true,rawPrice,optionRawPrice:addon,price:Math.round(rawPrice*104)/100,
    components,sourcePrice:base.rawPrice,accessories:selected,sourceDiscountPct:50,sourceUpliftPct:4};
 }
 function verifyImported(rows){
  const actual=new Map((rows||[]).filter(r=>/^PPAC\d{4}$/.test(r.reference)).map(r=>[r.reference,r]));
  const priceConflicts=[];
  for(const [ref,entry] of actual){const candidate=refIndex.get(ref);if(!candidate||Number(entry.rawPrice)!==candidate.rawPrice)
    priceConflicts.push({ref,expected:candidate?.rawPrice,imported:entry.rawPrice});}
  return {sourceRows:mapped.length,importedRows:actual.size,missingFromImport:mapped.filter(x=>!actual.has(x.reference)).map(x=>x.reference),priceConflicts};
 }
 return {mapped,refIndex,COLORS,TEXTURES,extra,select,quote,verifyImported};
});
