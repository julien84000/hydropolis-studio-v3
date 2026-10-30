/* HIDROBOX Neo Plus: exact 2026 price tiers and supplier reference ranges.
 * Source: HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf, PDF pages 7-10.
 * List prices are HT; Hydropolis applies +4% once, after option surcharges.
 * The selected finished dimensions are preserved independently of the tariff tier.
 */
(function(root){
'use strict';
const W=[[70,70],[71,75],[76,80],[81,90],[91,100],[101,110],[111,120],[121,130],[131,140]];
const L=Array.from({length:13},(_,i)=>[i===0?80:i*10+81,i===0?90:i*10+90]);
const K=[
[522,546,571,598,627,660,706,753,803,852,902,953,1006],
[555,579,605,630,659,694,740,788,835,887,937,989,1041],
[581,607,630,658,687,722,768,816,865,916,967,1018,1070],
[640,666,692,720,749,784,832,883,933,985,1037,1092,1147],
[null,null,766,794,827,862,913,967,1020,1073,1128,1184,1240],
[null,null,891,920,953,992,1044,1100,1155,1212,1269,1327,1388],
[null,null,null,null,1030,1143,1201,1258,1315,1376,null,null,null],
[null,null,null,null,1271,1314,1372,1433,1495,1556,null,null,null],
[null,null,null,null,1467,1513,null,null,null,null,null,null,null]
];
const S=[
[679,710,742,777,816,858,918,980,1043,1107,1173,1239,1307],
[721,753,786,820,857,902,962,1025,1087,1153,1218,1286,1354],
[755,789,820,856,893,938,998,1061,1124,1191,1257,1323,1391],
[831,866,900,936,974,1020,1082,1147,1213,1280,1349,1420,1491],
[null,null,995,1033,1075,1120,1187,1257,1326,1395,1466,1540,1612],
[null,null,1158,1196,1239,1289,1358,1430,1502,1575,1649,1726,1804],
[null,null,null,null,1340,1486,1562,1635,1710,1789,null,null,null],
[null,null,null,null,1652,1709,1785,1862,1944,2022,null,null,null],
[null,null,null,null,1907,1967,null,null,null,null,null,null,null]
];
const COLORS={
 BLA:['Blanc'],BAS:['Bianco','Beige','Pietra','Cement','Iron','Graphite'],
 TRE:['Crema','Cappuccino','Terra','Brownie','Cotta','Golden','Sandstone','Blush','Ocean','Lake','Ombra','Dark Liquen','Metropoli','Herbal'],
 SPE:['RAL / NCS — à préciser']
};
const FORMATS=[
 {key:'rectangle',label:'Rectangulaire',widthMin:70,widthMax:140,lengthMin:80,lengthMax:210},
 {key:'square',label:'Carré',widthMin:80,widthMax:100,lengthMin:80,lengthMax:100},
 {key:'angular',label:'Angulaire',widths:[80,90,100],lengths:[80,90,100]},
 {key:'angularR',label:'Angulaire droit',widths:[80,90],lengths:[120]},
 {key:'angularL',label:'Angulaire gauche',widths:[80,90],lengths:[120]},
 {key:'pentagonal',label:'Pentagonal',widths:[90,100],lengths:[90,100]},
 {key:'pentagonalR',label:'Pentagonal droit',widths:[80,90],lengths:[120]},
 {key:'pentagonalL',label:'Pentagonal gauche',widths:[80,90],lengths:[120]}
];
const SHAPES={
 square:{K:[640,666,707,741],S:[831,866,919,964],B:[75,76,77,78],A:[172,173,174,175],T:[451,452,453,454],TA:[548,549,550,551],P:[639,640,641,642],PA:[736,737,738,739],SB:[263,264,265,266],SA:[360,361,362,363]},
 angular:{K:[558,640,741],S:[725,831,964],B:[79,80,81],A:[176,177,178],T:[455,456,457],TA:[552,553,554],P:[643,644,645],PA:[740,741,742],SB:[267,268,269],SA:[364,365,366]},
 angularR:{K:[658,720],S:[856,936],A:[179,180],TA:[555,556],PA:[743,744],SA:[367,368]},
 angularL:{K:[658,720],S:[856,936],A:[181,182],TA:[557,558],PA:[745,746],SA:[369,370]},
 pentagonal:{K:[640,741],S:[831,964],B:[82,83],A:[183,184],T:[458,459],TA:[559,560],P:[646,647],PA:[747,748],SB:[270,271],SA:[371,372]},
 pentagonalR:{K:[658,720],S:[856,936],A:[185,186],TA:[561,562],PA:[749,750],SA:[373,374]},
 pentagonalL:{K:[658,720],S:[856,936],A:[187,188],TA:[563,564],PA:[751,752],SA:[375,376]}
};
const sku=n=>n==null?'':"SNEC"+String(n).padStart(4,'0');
function rowFor(form,width,length){
 if(form==='rectangle'){
   const w=W.findIndex(x=>width>=x[0]&&width<=x[1]);
   let l=L.findIndex(x=>length>=x[0]&&length<=x[1]);
   if(w>=4&&length===100)l=2;
   if(w>=6&&length===120)l=4;
   if(w<0||l<0||K[w][l]==null)return null;
   let n=0;for(let i=0;i<w;i++)for(const x of K[i])if(x!=null)n++;
   for(let j=0;j<l;j++)if(K[w][j]!=null)n++;
   const lisse=n<74;
   return {k:K[w][l],s:S[w][l],ref:{B:lisse?1+n:null,A:84+n,T:lisse?377+n:null,TA:460+n,P:lisse?565+n:null,PA:648+n,SB:lisse?189+n:null,SA:272+n},tier:W[w].join('-')+' × '+[(w>=6&&l===4)?120:(w>=4&&l===2)?100:L[l][0],L[l][1]].join('-')};
 }
 const x=SHAPES[form];if(!x)return null;
 let i=-1;
 if(form==='square')i=(width<=90?0:2)+(length<=90?0:1);
 else if(form==='angular'&&width===length)i=[80,90,100].indexOf(width);
 else if(form==='pentagonal'&&width===length)i=[90,100].indexOf(width);
 else if(/^(angularR|angularL|pentagonalR|pentagonalL)$/.test(form)&&length===120)i=[80,90].indexOf(width);
 if(i<0||!Number.isFinite(x.K[i]))return null;
 return {k:x.K[i],s:x.S[i],ref:Object.fromEntries(['B','A','T','TA','P','PA','SB','SA'].map(k=>[k,x[k]?.[i]??null])),tier:'Tarif '+form+' '+width+' × '+length};
}
function lookup({form='rectangle',width,length,material='Kromat',texture='Lisse',group='BAS',color='',grille='Point Inox',bonde='Horizontale standard'}){
 width=Number(width);length=Number(length);
 if(!['Kromat','Scene'].includes(material)||!['Lisse','Ardoise'].includes(texture))return {ok:false,reason:'Matière ou texture non proposée'};
 const fmt=FORMATS.find(f=>f.key===form);
 if(!fmt)return {ok:false,reason:'Forme non disponible'};
 const validW=fmt.widths?fmt.widths.includes(width):width>=fmt.widthMin&&width<=fmt.widthMax;
 const validL=fmt.lengths?fmt.lengths.includes(length):length>=fmt.lengthMin&&length<=fmt.lengthMax;
 if(!validW||!validL||!Number.isInteger(width)||!Number.isInteger(length))return {ok:false,reason:'Dimensions hors plage fabricant'};
 const c=group;
 // Neo Plus Scene standard is Blanc only per official current collection sheet.
 if(material==='Scene'&&(c!=='BLA'||color!=='Blanc'))return {ok:false,reason:'Neo Plus Scene est proposé uniquement en Blanc.'};
 if(material==='Kromat'&&c==='BLA')return {ok:false,reason:'Pour Kromat choisir Basics, Trends ou Special.'};
 if(!COLORS[c]?.includes(color))return {ok:false,reason:'Couleur à préciser'};
 const row=rowFor(form,width,length);if(!row)return {ok:false,reason:'Format sans tarif publié pour ces dimensions'};
 const key=material==='Scene'?(texture==='Ardoise'?'SA':'SB'):(c==='BAS'?(texture==='Ardoise'?'A':'B'):c==='TRE'?(texture==='Ardoise'?'TA':'T'):(texture==='Ardoise'?'PA':'P'));
 const reference=sku(row.ref[key]);
 if(!reference)return {ok:false,reason:'Texture non proposée pour ces dimensions'};
 // For Specials the PDF has independently rounded row amounts. Do not infer
 // a value from ×1.25 when the source uses a different half-cent rounding.
 const rawBase=material==='Scene'?row.s:row.k;
 if(c==='SPE')return {ok:false,reference,reason:'Tarif exact couleur Special à confirmer dans la ligne de prix fournisseur'};
 const grilleOptions={'Point Inox':0,'Point Basic':0,'Point Trend':25,'Point Special':36,'Star Inox':0,'Star Basic':0,'Star Trend':25,'Star Special':36,'Radiance Steel':62,'Radiance Gunmetal':62,'Radiance Gold':62,'Radiance Rame':62};
 const bondeOptions={'Horizontale standard':0,'Verticale':51,'Horizontale extraplate':26,'Horizontale Plus':38};
 if(!(grille in grilleOptions)||!(bonde in bondeOptions))return {ok:false,reason:'Option non tarifée'};
 const rawPrice=rawBase+grilleOptions[grille]+bondeOptions[bonde];
 return {ok:true,reference,rawBasePrice:rawBase,grilleRawPrice:grilleOptions[grille],bondeRawPrice:bondeOptions[bonde],rawPrice,price:Math.round(rawPrice*104)/100,purchaseDiscount:50,referenceDimensions:width+' × '+length+' cm',tier:row.tier,material,texture,group:c,color,form,grille,bonde,source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf',priceYear:2026};
}
root.HydroNeoPlus2026={FORMATS,COLORS,lookup};
})(window);
