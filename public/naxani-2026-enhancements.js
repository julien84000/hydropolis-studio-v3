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
 const doublePlans={};
 const addDoubles=(refs,widths)=>refs.split(' ').forEach((ref,i)=>{if(ref)doublePlans[ref]={naSinkCount:2,naDisplayWidth:widths[i],naPosition:'Double'};});
 addDoubles('571162 571209 571247 571278 571308 571339 571360 571391 571421',[149,150,160,162.5,170,180,182.5,190,200]);
 addDoubles('571889 571926 571964 571995 572022 572053 572084 572114 572145 572176 572206 572237 572268',[149,150,160,162.5,170,180,182.5,190,200,210,220,230,240]);
 addDoubles('572527 572626 572695 572817',[120,130,140,150]);
 addDoubles('573197 573234 573272 573319 573357 573395 573432 573470 573500 573548 573586 573616 573647 573678 573708 573739 573760',[120,122.5,124,130,133,140,141,142.5,149,150,160,162.5,170,180,182.5,190,200]);
 addDoubles('576266 576365 576433 576556',[120,130,140,150]);
 addDoubles('577041 577201',[120,140]);
 addDoubles('579892 579908 579915 579922 579939 579946 579953 579960 578130 578178 578215 578246 578277 578307 578338 578369 578390 578420 578451 578482 578512',[120,122.5,124,130,133,140,141,142.5,149,150,160,162.5,170,180,182.5,190,200,210,220,230,240]);
 function annotate(rows){
  for(const p of rows||[]){
   if(p.manufacturer!=='Naxani')continue;
   Object.assign(p,indexed.get(p.reference)||{},doublePlans[p.reference]||{});
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
