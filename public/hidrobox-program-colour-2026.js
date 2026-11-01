/* HIDROBOX PROGRAM COLOUR — French supplier price list V0226 pp.84–89.
 * Exact published WPCC SKUs, supplier prices and 2026 options. No inferred price.
 * Price in SPE SKU ALREADY includes +25%: do not apply a second percentage.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroProgramColour2026=api;})(typeof window==='object'?window:null,function(){
'use strict';
const LENGTHS=[[70,81],[82,101],[102,121],[122,141],[142,161],[162,181],[182,201]];
const DEPTHS=[[40,50],[51,60],[40,50],[51,55]];
const HEIGHTS=[[1.2,1.2],[1.2,1.2],[3,15],[3,15]];
const PRICES=[
 [[604,675,821,962,1090,1273,1482],[604,675,821,962,1090,1273,1482],[754,845,1026,1203,1362,1592,1853]],
 [[709,790,955,1119,1270,1546,1725],[709,790,955,1119,1270,1546,1725],[887,988,1194,1399,1588,1932,2157]],
 [[803,885,1052,1217,1400,1613,1893],[803,885,1052,1217,1400,1613,1893],[1003,1106,1315,1521,1751,2017,2367]],
 [[923,1018,1211,1399,1610,1854,2178],[923,1018,1211,1399,1610,1854,2178],[1153,1272,1513,1749,2013,2318,2722]]
];
const STARTS=[[145,173,201],[152,180,208],[159,187,215],[166,194,222]];
const GROUPS=['BAS','TRE','SPE'];
const BAS=['Bianco','Beige','Pietra','Cement','Iron','Graphite'];
const TRE=['Crema','Cappuccino','Terra','Brownie','Cotta','Golden','Sandstone','Blush','Ocean','Lake','Ombra','Dark Liquen','Metropoli','Herbal'];
const COLORS={BAS,TRE,SPE:['RAL / NCS']};
const SWATCHES={Bianco:'#f4f1e9',Beige:'#d6c6ae',Pietra:'#b4ad9c',Cement:'#adaeaa',Iron:'#646b69',Graphite:'#48494b',Crema:'#efe2c4',Cappuccino:'#a99479',Terra:'#b0775d',Brownie:'#775b4f',Cotta:'#be7455',Golden:'#c7a36a',Sandstone:'#cbb9a1',Blush:'#cc9b94',Ocean:'#58798e',Lake:'#879f96',Ombra:'#828185','Dark Liquen':'#626d5b',Metropoli:'#8c898a',Herbal:'#8d9882'};
const money=n=>Math.round(n*100)/100;
const SOURCE='HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf · pages 84–89';
const BASE_ROWS=Object.freeze(PRICES.flatMap((depths,bandIndex)=>depths.flatMap((prices,groupIndex)=>prices.map((rawPrice,lengthIndex)=>({
 reference:'WPCC'+String(STARTS[bandIndex][groupIndex]+lengthIndex).padStart(4,'0'),
 rawPrice,group:GROUPS[groupIndex],
 lengthMin:LENGTHS[lengthIndex][0],lengthMax:LENGTHS[lengthIndex][1],
 depthMin:DEPTHS[bandIndex][0],depthMax:DEPTHS[bandIndex][1],
 heightMin:HEIGHTS[bandIndex][0],heightMax:HEIGHTS[bandIndex][1]
})))));
const defaultState=()=>({length:120,depth:50,height:1.2,group:'BAS',color:'Beige',specialCode:'',basin:'S41',position:'center',tap:'none',overflow:false,drain:'none',towel:'none',backsplashHeight:0,specialCut:false});
const validCode=code=>/^(?:RAL|NCS)\s*[-\w .]{2,25}$/i.test(String(code||'').trim());
const groupColors=group=>COLORS[group]||[];
const inBand=(v,min,max)=>v>=min&&v<=max;
const exact=(rows,reference)=>rows.find(r=>r.reference===reference);
const OPTIONS=Object.freeze({
 tap:{none:['',0],H1:['OPWB0007',23],H3:['OPWB0009',23],other:['OPWB0010',56]},
 overflow:{true:['OPWB0012',62]},
 drain:{none:['',0],clickKromatBAS:['OPWB0056',72],clickKromatTRE:['OPWB0057',72],clickKromatSPE:['OPWB0058',110],
   clickChrome:['OPWB0052',47],clickWhite:['OPWB0053',62],clickBlack:['OPWB0054',62],
   free:['OPWB0055',25],fixedBAS:['OPWB0059',47],fixedTRE:['OPWB0060',47],fixedSPE:['OPWB0061',87]},
 towel:{none:['',0],under30Steel:['OPWB0106',98],under30White:['OPWB0107',134],under30Black:['OPWB0108',134],
   under40Steel:['OPWB0109',110],under40White:['OPWB0110',146],under40Black:['OPWB0111',146],
   under50Steel:['OPWB0112',121],under50White:['OPWB0113',157],under50Black:['OPWB0114',157],
   frontTwo30:['OPWB0115',110],frontTwo40:['OPWB0116',123],frontTwo50:['OPWB0117',134],
   frontOne30Steel:['OPWB0118',110],frontOne30White:['OPWB0119',146],frontOne30Black:['OPWB0120',146],
   frontOne40Steel:['OPWB0121',123],frontOne40White:['OPWB0122',157],frontOne40Black:['OPWB0123',157],
   frontOne50Steel:['OPWB0124',134],frontOne50White:['OPWB0125',168],frontOne50Black:['OPWB0126',168]}
});
const BACKSPLASH={
 BAS:[{first:142,prices:[98,125,151,178,205,232,257]},{first:150,prices:[125,151,166,192,218,245,272]},{first:160,prices:[166,192,218,245,272,298,325]}],
 TRE:[{first:170,prices:[98,125,151,178,205,232,257]},{first:178,prices:[125,151,166,192,218,245,272]},{first:188,prices:[166,192,218,245,272,298,325]}],
 SPE:[{first:198,prices:[123,157,189,223,256,290,322]},{first:206,prices:[157,189,208,240,273,306,339]},{first:216,prices:[208,240,273,306,339,373,406]}]
};
function quote(input,importedRows=[]){
 const s={...defaultState(),...(input||{})},errors=[],components=[];
 const length=Number(s.length),depth=Number(s.depth),height=Number(s.height);
 if(!Number.isInteger(length)||!Number.isInteger(depth)||!(height===1.2||Number.isInteger(height)))
   errors.push('Longueur, profondeur et hauteur invalides : mesures entières sauf hauteur 1,2 cm.');
 const group=s.group;
 if(!GROUPS.includes(group))errors.push('Groupe couleur non tarifé.');
 if(group==='SPE'){if(!validCode(s.specialCode))errors.push('Indiquer la couleur spéciale RAL/NCS exacte.');}
 else if(!groupColors(group).includes(s.color))errors.push('Choisir une teinte fabricant dans le groupe '+group+'.');
 const candidates=BASE_ROWS.filter(r=>r.group===group&&inBand(length,r.lengthMin,r.lengthMax)&&
   inBand(depth,r.depthMin,r.depthMax)&&inBand(height,r.heightMin,r.heightMax));
 if(candidates.length!==1)errors.push('Dimensions hors plages combinées du tarif Program Colour (L 70–201, P 40–60, H 1,2 / 3–15 cm).');
 const base=candidates[0]||null;
 if(!['S41','S42'].includes(s.basin))errors.push('Forme S41 ou double S42 obligatoire.');
 if(s.basin==='S42'&&(length<135||depth<45))errors.push('S42 double : longueur au moins 135 cm et profondeur au moins 45 cm (implantation fabricant).');
 if(!['left','center','right'].includes(s.position))errors.push('Position de vasque inconnue.');
 if(base){
   const imported=importedRows.find(x=>String(x.reference||'')===base.reference);
   if(importedRows.length&&!imported)errors.push('Référence '+base.reference+' manquante dans le tarif importé Hydropolis.');
   if(imported&&Number(imported.rawPrice)!==base.rawPrice)
     errors.push('Prix fournisseur incohérent pour '+base.reference+' : source '+base.rawPrice+' €, import '+imported.rawPrice+' €.');
   components.push({reference:base.reference,label:'Program Colour '+group+' · '+length+' × '+depth+' × '+height+' cm',rawPrice:base.rawPrice});
 }
 const basinOption=s.basin==='S42'?{BAS:'OPWB0240',TRE:'OPWB0241',SPE:'OPWB0242'}[group]:
   {BAS:'OPWB0139',TRE:'OPWB0140',SPE:'OPWB0141'}[group];
 components.push({reference:basinOption,label:s.basin==='S42'?'Vasque double S42, entraxe 25 cm':'Vasque intégrée S41 (incluse)',rawPrice:s.basin==='S42'?215:0});
 function add(key,choice,label){
   const option=OPTIONS[key]?.[choice];if(!option){errors.push('Option '+key+' '+choice+' non vérifiée.');return;}
   if(option[0])components.push({reference:option[0],label:label||key+' '+choice,rawPrice:option[1]});
 }
 add('tap',s.tap||'none','Préparation robinetterie '+s.tap);
 if(s.overflow)add('overflow','true','Trop-plein rond chromé');
 const drain=s.drain||'none';
 if(/(?:BAS|TRE|SPE)$/.test(drain)&&!drain.endsWith(group))errors.push('Bonde Kromat non assortie à la gamme couleur.');
 add('drain',drain,'Bonde '+drain);
 add('towel',s.towel||'none','Porte-serviettes '+s.towel);
 const backsplash=Number(s.backsplashHeight||0);
 if(backsplash){
   const rowIndex=backsplash>=5&&backsplash<=10?0:backsplash>=11&&backsplash<=15?1:backsplash>=16&&backsplash<=30?2:-1;
   const lengthIndex=LENGTHS.findIndex(([a,b])=>inBand(length,a,b));
   if(!Number.isInteger(backsplash)||rowIndex<0||lengthIndex<0||!BACKSPLASH[group])errors.push('Crédence hors plage tarifaire (5–30 cm).');
   else{
     const priceRow=BACKSPLASH[group][rowIndex],ref='OPWB'+String(priceRow.first+lengthIndex).padStart(4,'0');
     components.push({reference:ref,label:'Crédence Kromat '+backsplash+' cm · '+group,rawPrice:priceRow.prices[lengthIndex]});
   }
 }
 // Manufacturer quotes special cuts at +10%, no known stable line-item SKU for this geometry.
 if(s.specialCut)errors.push('Découpe spéciale +10% : dessin technique et base du supplément à valider par fabricant avant commande.');
 const rawPrice=components.reduce((a,c)=>a+c.rawPrice,0);
 const ok=errors.length===0&&!!base;
 return {ok,errors,reference:base?.reference||'',components,rawPrice:ok?rawPrice:null,
   price:ok?money(rawPrice*1.04):null,purchasePrice:ok?money(rawPrice*1.04*.5):null,
   source:SOURCE,configuration:s,colour:group==='SPE'?s.specialCode:s.color,base};
}
return {SOURCE,BASE_ROWS,COLORS,SWATCHES,OPTIONS,defaultState,quote,validCode};
});