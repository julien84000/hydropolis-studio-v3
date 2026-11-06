/* Naxani tariff 2026 — verified modular families and basin/top metadata.
 * Drawings below are technical schematic placeholders pending manufacturer's original pictogram assets.
 */
(function(root){
 'use strict';
 const bc={
  '1C':{
    single:{Iroko:'504161 504178 504185 504192',Noyer:'504444 504451 504468 504475',Erable:'504307 504314 504321 504338'},
    joined:{Iroko:'504208 504215 504222 504246 504239 504253 504260 504291 504277 504284',Noyer:'504482 504499 504505 504529 504512 504536 504543 504574 504550 504567',Erable:'504345 504352 504369 504383 504376 504390 504406 504437 504413 504420'}
  },
  '2C':{
    single:{Iroko:'504581 504598 504604 504611',Noyer:'504864 504871 504888 504895',Erable:'504727 504734 504741 504758'},
    joined:{Iroko:'504628 504635 504642 504666 504659 504673 504680 504710 504697 504703',Noyer:'504901 504918 504925 504949 504932 504956 504963 504994 504970 504987',Erable:'504765 504772 504789 504802 504796 504819 504826 504857 504833 504840'}
  }
 };
 const pairWidths=[[62.5,62.5],[62.5,82.5],[82.5,62.5],[82.5,82.5],[62.5,102.5],[102.5,62.5],[62.5,122.5],[122.5,62.5],[82.5,102.5],[102.5,82.5]];
 const pairTotals=[122.5,142.5,142.5,162.5,162.5,162.5,182.5,182.5,182.5,182.5];
 const indexed=new Map();
 for(const [variant,sets] of Object.entries(bc))for(const [kind,woodSets] of Object.entries(sets))for(const [wood,refs] of Object.entries(woodSets))
 refs.split(' ').forEach((ref,i)=>indexed.set(ref,{naVariant:variant,naWood:wood,naPrepricedJoin:kind==='joined',naModules:kind==='joined'?pairWidths[i]:null,naDisplayWidth:kind==='joined'?pairTotals[i]:[62.5,82.5,102.5,122.5][i]}));
 // PDF "Tarifa 2026" pp.55–60: 95 exact DOUBLE basin SKU/size/price tuples.
 // Never infer extra basin positions or SKUs from the adjacent single-basin table.
 const doublePlans=Object.freeze({
  // ALMA · PDF p. 55
  '571162':{naSinkCount:2,naDisplayWidth:149,naPosition:'Double vasque',naVerifiedTariffPrice:1989,naVerifiedSourcePage:55},
  '571209':{naSinkCount:2,naDisplayWidth:150,naPosition:'Double vasque',naVerifiedTariffPrice:1989,naVerifiedSourcePage:55},
  '571247':{naSinkCount:2,naDisplayWidth:160,naPosition:'Double vasque',naVerifiedTariffPrice:2122,naVerifiedSourcePage:55},
  '571278':{naSinkCount:2,naDisplayWidth:162.5,naPosition:'Double vasque',naVerifiedTariffPrice:2138,naVerifiedSourcePage:55},
  '571308':{naSinkCount:2,naDisplayWidth:170,naPosition:'Double vasque',naVerifiedTariffPrice:2138,naVerifiedSourcePage:55},
  '571339':{naSinkCount:2,naDisplayWidth:180,naPosition:'Double vasque',naVerifiedTariffPrice:2355,naVerifiedSourcePage:55},
  '571360':{naSinkCount:2,naDisplayWidth:182.5,naPosition:'Double vasque',naVerifiedTariffPrice:2949,naVerifiedSourcePage:55},
  '571391':{naSinkCount:2,naDisplayWidth:190,naPosition:'Double vasque',naVerifiedTariffPrice:2949,naVerifiedSourcePage:55},
  '571421':{naSinkCount:2,naDisplayWidth:200,naPosition:'Double vasque',naVerifiedTariffPrice:2973,naVerifiedSourcePage:55},
  // ALPOS · PDF p. 55
  '571889':{naSinkCount:2,naDisplayWidth:149,naPosition:'Double vasque',naVerifiedTariffPrice:2035,naVerifiedSourcePage:55},
  '571926':{naSinkCount:2,naDisplayWidth:150,naPosition:'Double vasque',naVerifiedTariffPrice:2035,naVerifiedSourcePage:55},
  '571964':{naSinkCount:2,naDisplayWidth:160,naPosition:'Double vasque',naVerifiedTariffPrice:2169,naVerifiedSourcePage:55},
  '571995':{naSinkCount:2,naDisplayWidth:162.5,naPosition:'Double vasque',naVerifiedTariffPrice:2183,naVerifiedSourcePage:55},
  '572022':{naSinkCount:2,naDisplayWidth:170,naPosition:'Double vasque',naVerifiedTariffPrice:2183,naVerifiedSourcePage:55},
  '572053':{naSinkCount:2,naDisplayWidth:180,naPosition:'Double vasque',naVerifiedTariffPrice:2400,naVerifiedSourcePage:55},
  '572084':{naSinkCount:2,naDisplayWidth:182.5,naPosition:'Double vasque',naVerifiedTariffPrice:2813,naVerifiedSourcePage:55},
  '572114':{naSinkCount:2,naDisplayWidth:190,naPosition:'Double vasque',naVerifiedTariffPrice:3040,naVerifiedSourcePage:55},
  '572145':{naSinkCount:2,naDisplayWidth:200,naPosition:'Double vasque',naVerifiedTariffPrice:3063,naVerifiedSourcePage:55},
  '572176':{naSinkCount:2,naDisplayWidth:210,naPosition:'Double vasque',naVerifiedTariffPrice:3195,naVerifiedSourcePage:55},
  '572206':{naSinkCount:2,naDisplayWidth:220,naPosition:'Double vasque',naVerifiedTariffPrice:3246,naVerifiedSourcePage:55},
  '572237':{naSinkCount:2,naDisplayWidth:230,naPosition:'Double vasque',naVerifiedTariffPrice:3276,naVerifiedSourcePage:55},
  '572268':{naSinkCount:2,naDisplayWidth:240,naPosition:'Double vasque',naVerifiedTariffPrice:3298,naVerifiedSourcePage:55},
  // ARAN · PDF p. 56
  '572527':{naSinkCount:2,naDisplayWidth:120,naPosition:'Double vasque',naVerifiedTariffPrice:635,naVerifiedSourcePage:56},
  '572626':{naSinkCount:2,naDisplayWidth:130,naPosition:'Double vasque',naVerifiedTariffPrice:680,naVerifiedSourcePage:56},
  '572695':{naSinkCount:2,naDisplayWidth:140,naPosition:'Double vasque',naVerifiedTariffPrice:867,naVerifiedSourcePage:56},
  '572817':{naSinkCount:2,naDisplayWidth:150,naPosition:'Double vasque',naVerifiedTariffPrice:874,naVerifiedSourcePage:56},
  // ARES · PDF p. 56
  '573197':{naSinkCount:2,naDisplayWidth:120,naPosition:'Double vasque',naVerifiedTariffPrice:1391,naVerifiedSourcePage:56},
  '573234':{naSinkCount:2,naDisplayWidth:122.5,naPosition:'Double vasque',naVerifiedTariffPrice:1454,naVerifiedSourcePage:56},
  '573272':{naSinkCount:2,naDisplayWidth:124,naPosition:'Double vasque',naVerifiedTariffPrice:1454,naVerifiedSourcePage:56},
  '573319':{naSinkCount:2,naDisplayWidth:130,naPosition:'Double vasque',naVerifiedTariffPrice:1454,naVerifiedSourcePage:56},
  '573357':{naSinkCount:2,naDisplayWidth:133,naPosition:'Double vasque',naVerifiedTariffPrice:1714,naVerifiedSourcePage:56},
  '573395':{naSinkCount:2,naDisplayWidth:140,naPosition:'Double vasque',naVerifiedTariffPrice:1714,naVerifiedSourcePage:56},
  '573432':{naSinkCount:2,naDisplayWidth:141,naPosition:'Double vasque',naVerifiedTariffPrice:1726,naVerifiedSourcePage:56},
  '573470':{naSinkCount:2,naDisplayWidth:142.5,naPosition:'Double vasque',naVerifiedTariffPrice:1726,naVerifiedSourcePage:56},
  '573500':{naSinkCount:2,naDisplayWidth:149,naPosition:'Double vasque',naVerifiedTariffPrice:1726,naVerifiedSourcePage:56},
  '573548':{naSinkCount:2,naDisplayWidth:150,naPosition:'Double vasque',naVerifiedTariffPrice:1726,naVerifiedSourcePage:56},
  '573586':{naSinkCount:2,naDisplayWidth:160,naPosition:'Double vasque',naVerifiedTariffPrice:1877,naVerifiedSourcePage:56},
  '573616':{naSinkCount:2,naDisplayWidth:162.5,naPosition:'Double vasque',naVerifiedTariffPrice:1888,naVerifiedSourcePage:56},
  '573647':{naSinkCount:2,naDisplayWidth:170,naPosition:'Double vasque',naVerifiedTariffPrice:1888,naVerifiedSourcePage:56},
  '573678':{naSinkCount:2,naDisplayWidth:180,naPosition:'Double vasque',naVerifiedTariffPrice:1907,naVerifiedSourcePage:56},
  '573708':{naSinkCount:2,naDisplayWidth:182.5,naPosition:'Double vasque',naVerifiedTariffPrice:2611,naVerifiedSourcePage:56},
  '573739':{naSinkCount:2,naDisplayWidth:190,naPosition:'Double vasque',naVerifiedTariffPrice:2611,naVerifiedSourcePage:56},
  '573760':{naSinkCount:2,naDisplayWidth:200,naPosition:'Double vasque',naVerifiedTariffPrice:2632,naVerifiedSourcePage:56},
  // BORVO · PDF p. 57
  '574224':{naSinkCount:2,naDisplayWidth:140,naPosition:'Double vasque',naVerifiedTariffPrice:1479,naVerifiedSourcePage:57},
  '574262':{naSinkCount:2,naDisplayWidth:141,naPosition:'Double vasque',naVerifiedTariffPrice:1483,naVerifiedSourcePage:57},
  '574309':{naSinkCount:2,naDisplayWidth:142.5,naPosition:'Double vasque',naVerifiedTariffPrice:1483,naVerifiedSourcePage:57},
  '574330':{naSinkCount:2,naDisplayWidth:149,naPosition:'Double vasque',naVerifiedTariffPrice:1483,naVerifiedSourcePage:57},
  '574378':{naSinkCount:2,naDisplayWidth:150,naPosition:'Double vasque',naVerifiedTariffPrice:1483,naVerifiedSourcePage:57},
  '574415':{naSinkCount:2,naDisplayWidth:160,naPosition:'Double vasque',naVerifiedTariffPrice:1692,naVerifiedSourcePage:57},
  '574446':{naSinkCount:2,naDisplayWidth:162.5,naPosition:'Double vasque',naVerifiedTariffPrice:1720,naVerifiedSourcePage:57},
  '574477':{naSinkCount:2,naDisplayWidth:170,naPosition:'Double vasque',naVerifiedTariffPrice:1720,naVerifiedSourcePage:57},
  '574507':{naSinkCount:2,naDisplayWidth:180,naPosition:'Double vasque',naVerifiedTariffPrice:1735,naVerifiedSourcePage:57},
  '574538':{naSinkCount:2,naDisplayWidth:182.5,naPosition:'Double vasque',naVerifiedTariffPrice:2611,naVerifiedSourcePage:57},
  '574569':{naSinkCount:2,naDisplayWidth:190,naPosition:'Double vasque',naVerifiedTariffPrice:2611,naVerifiedSourcePage:57},
  '574590':{naSinkCount:2,naDisplayWidth:200,naPosition:'Double vasque',naVerifiedTariffPrice:2667,naVerifiedSourcePage:57},
  '574026':{naSinkCount:2,naDisplayWidth:120,naPosition:'Double vasque',naVerifiedTariffPrice:1100,naVerifiedSourcePage:57},
  '574620':{naSinkCount:2,naDisplayWidth:210,naPosition:'Double vasque',naVerifiedTariffPrice:2859,naVerifiedSourcePage:57},
  '574064':{naSinkCount:2,naDisplayWidth:122.5,naPosition:'Double vasque',naVerifiedTariffPrice:1169,naVerifiedSourcePage:57},
  '574651':{naSinkCount:2,naDisplayWidth:220,naPosition:'Double vasque',naVerifiedTariffPrice:2921,naVerifiedSourcePage:57},
  '574101':{naSinkCount:2,naDisplayWidth:124,naPosition:'Double vasque',naVerifiedTariffPrice:1169,naVerifiedSourcePage:57},
  '574682':{naSinkCount:2,naDisplayWidth:230,naPosition:'Double vasque',naVerifiedTariffPrice:2957,naVerifiedSourcePage:57},
  '574149':{naSinkCount:2,naDisplayWidth:130,naPosition:'Double vasque',naVerifiedTariffPrice:1169,naVerifiedSourcePage:57},
  '574712':{naSinkCount:2,naDisplayWidth:240,naPosition:'Double vasque',naVerifiedTariffPrice:2999,naVerifiedSourcePage:57},
  '574187':{naSinkCount:2,naDisplayWidth:133,naPosition:'Double vasque',naVerifiedTariffPrice:1479,naVerifiedSourcePage:57},
  // DARO · PDF p. 57
  '574996':{naSinkCount:2,naDisplayWidth:140,naPosition:'Double vasque',naVerifiedTariffPrice:1304,naVerifiedSourcePage:57},
  '575115':{naSinkCount:2,naDisplayWidth:150,naPosition:'Double vasque',naVerifiedTariffPrice:1359,naVerifiedSourcePage:57},
  '575153':{naSinkCount:2,naDisplayWidth:160,naPosition:'Double vasque',naVerifiedTariffPrice:1541,naVerifiedSourcePage:57},
  '575221':{naSinkCount:2,naDisplayWidth:180,naPosition:'Double vasque',naVerifiedTariffPrice:2090,naVerifiedSourcePage:57},
  // INIS · PDF p. 59
  '576433':{naSinkCount:2,naDisplayWidth:140,naPosition:'Double vasque',naVerifiedTariffPrice:893,naVerifiedSourcePage:59},
  '576556':{naSinkCount:2,naDisplayWidth:150,naPosition:'Double vasque',naVerifiedTariffPrice:900,naVerifiedSourcePage:59},
  '576266':{naSinkCount:2,naDisplayWidth:120,naPosition:'Double vasque',naVerifiedTariffPrice:650,naVerifiedSourcePage:59},
  '576365':{naSinkCount:2,naDisplayWidth:130,naPosition:'Double vasque',naVerifiedTariffPrice:691,naVerifiedSourcePage:59},
  // LATU · PDF p. 59
  '577201':{naSinkCount:2,naDisplayWidth:140,naPosition:'Double vasque',naVerifiedTariffPrice:885,naVerifiedSourcePage:59},
  '577041':{naSinkCount:2,naDisplayWidth:120,naPosition:'Double vasque',naVerifiedTariffPrice:631,naVerifiedSourcePage:59},
  // ORBIT · PDF p. 60
  '579892':{naSinkCount:2,naDisplayWidth:120,naPosition:'Double vasque',naVerifiedTariffPrice:1270,naVerifiedSourcePage:60},
  '579908':{naSinkCount:2,naDisplayWidth:122.5,naPosition:'Double vasque',naVerifiedTariffPrice:1339,naVerifiedSourcePage:60},
  '579915':{naSinkCount:2,naDisplayWidth:124,naPosition:'Double vasque',naVerifiedTariffPrice:1339,naVerifiedSourcePage:60},
  '579922':{naSinkCount:2,naDisplayWidth:130,naPosition:'Double vasque',naVerifiedTariffPrice:1339,naVerifiedSourcePage:60},
  '579939':{naSinkCount:2,naDisplayWidth:133,naPosition:'Double vasque',naVerifiedTariffPrice:1647,naVerifiedSourcePage:60},
  '579946':{naSinkCount:2,naDisplayWidth:140,naPosition:'Double vasque',naVerifiedTariffPrice:1647,naVerifiedSourcePage:60},
  '579953':{naSinkCount:2,naDisplayWidth:141,naPosition:'Double vasque',naVerifiedTariffPrice:1662,naVerifiedSourcePage:60},
  '579960':{naSinkCount:2,naDisplayWidth:142.5,naPosition:'Double vasque',naVerifiedTariffPrice:1662,naVerifiedSourcePage:60},
  '578130':{naSinkCount:2,naDisplayWidth:149,naPosition:'Double vasque',naVerifiedTariffPrice:1662,naVerifiedSourcePage:60},
  '578178':{naSinkCount:2,naDisplayWidth:150,naPosition:'Double vasque',naVerifiedTariffPrice:1662,naVerifiedSourcePage:60},
  '578215':{naSinkCount:2,naDisplayWidth:160,naPosition:'Double vasque',naVerifiedTariffPrice:1862,naVerifiedSourcePage:60},
  '578246':{naSinkCount:2,naDisplayWidth:162.5,naPosition:'Double vasque',naVerifiedTariffPrice:1895,naVerifiedSourcePage:60},
  '578277':{naSinkCount:2,naDisplayWidth:170,naPosition:'Double vasque',naVerifiedTariffPrice:1895,naVerifiedSourcePage:60},
  '578307':{naSinkCount:2,naDisplayWidth:180,naPosition:'Double vasque',naVerifiedTariffPrice:1911,naVerifiedSourcePage:60},
  '578338':{naSinkCount:2,naDisplayWidth:182.5,naPosition:'Double vasque',naVerifiedTariffPrice:2740,naVerifiedSourcePage:60},
  '578369':{naSinkCount:2,naDisplayWidth:190,naPosition:'Double vasque',naVerifiedTariffPrice:2740,naVerifiedSourcePage:60},
  '578390':{naSinkCount:2,naDisplayWidth:200,naPosition:'Double vasque',naVerifiedTariffPrice:2796,naVerifiedSourcePage:60},
  '578420':{naSinkCount:2,naDisplayWidth:210,naPosition:'Double vasque',naVerifiedTariffPrice:3046,naVerifiedSourcePage:60},
  '578451':{naSinkCount:2,naDisplayWidth:220,naPosition:'Double vasque',naVerifiedTariffPrice:3109,naVerifiedSourcePage:60},
  '578482':{naSinkCount:2,naDisplayWidth:230,naPosition:'Double vasque',naVerifiedTariffPrice:3150,naVerifiedSourcePage:60},
  '578512':{naSinkCount:2,naDisplayWidth:240,naPosition:'Double vasque',naVerifiedTariffPrice:3235,naVerifiedSourcePage:60},
 });
 function annotate(rows){
  for(const p of rows||[]){
   if(p.manufacturer!=='Naxani')continue;
   Object.assign(p,indexed.get(p.reference)||{},doublePlans[p.reference]||{});
   // The generic importer sometimes copied the preceding left-table width.
   // Correct the actual model size without rewriting the immutable source CSV.
   if(doublePlans[p.reference]){
    if(Math.abs(Number(p.naWidth)-Number(doublePlans[p.reference].naDisplayWidth))>.06)
      p.naImportedWidth=Number(p.naWidth);
    p.naWidth=doublePlans[p.reference].naDisplayWidth;
   }
   if(p.collection==='Batz'){
    p.naVariant=Number(p.reference)<505083?'1C':'2C';
    p.naWood='Chêne américain';
   }
   if(p.collection==='Aalto'){
    p.naVariant='1 tiroir + tiroir intérieur';
    p.naWood=Number(p.reference)>=504086?'Chêne américain':'Noyer américain';
   }
   if(p.collection==='Grid'||p.collection==='Igi'){
    const num=Number(p.reference);
    p.naVariant=(p.collection==='Grid'?(num<505525):(num<505679))?'1C':'2C';
   }
   if(p.productType==='plan-integre'&&!p.naSinkCount){
    p.naSinkCount=1;
    if(p.naPosition==='Centrée ou double (voir tableau)')p.naPosition='Centrée (à vérifier sur le tarif)';
   }
  }
  return rows;
 }
 const width=p=>Number(p?.naDisplayWidth??p?.naWidth);
 const safe=s=>String(s||'').replace(/[&<>"']/g,'');
 function picture(p){
  const u=String(p?.image||'');
  if(!u||/simenta-200-wevet-001/i.test(u))return '';
  return u;
 }
 function pictogram(p){
  const basin=p?.productType==='plan-integre'||p?.productType==='vasque-poser'||p?.productType==='suspendu';
  const isTop=basin||/plan-/.test(p?.productType||'');
  const dbl=p?.naSinkCount===2,joined=p?.naPrepricedJoin;
  const v=String(p?.naVariant||'');
  const drawerCount=v==='2C'?2:v==='1C'?1:1;
  let pic='';
  if(isTop){
   const ellipse=(x)=>'<ellipse cx="'+x+'" cy="45" rx="'+(p?.collection==='Forma Large'?22:14)+'" ry="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="'+x+'" cy="45" r="2.2" fill="currentColor"/>';
   pic='<rect x="20" y="19" width="160" height="51" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>'+ellipse(dbl?70:100)+(dbl?ellipse(130):'')+'<path d="M20 80H180" stroke="currentColor" stroke-width="1.4"/>';
  }else{
   const panel=(x,w)=>Array.from({length:drawerCount},(_,i)=>'<rect x="'+x+'" y="'+(25+i*40/drawerCount)+'" width="'+w+'" height="'+(40/drawerCount-1)+'" fill="none" stroke="currentColor" stroke-width="1.4"/>').join('');
   pic='<path d="M17 19h166l-9 10H25z" fill="none" stroke="currentColor" stroke-width="1.4"/>'+ (joined?panel(23,73)+panel(104,73):panel(23,154))+'<path d="M23 68h154M25 68v8m149-8v8" stroke="currentColor" fill="none" stroke-width="1.5"/>';
  }
  return '<svg class="nax-pictogram" viewBox="0 0 200 95" aria-label="Schéma technique '+safe(p?.collection)+'" role="img" xmlns="http://www.w3.org/2000/svg">'+pic+'</svg>';
 }
 root.HydroNaxaniEnhancements={annotate,width,picture,pictogram,metadataByRef:indexed,doublePlans};
})(typeof window!=='undefined'?window:globalThis);
