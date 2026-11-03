/* Hotbath RAY 2026: technical properties sourced from the supplied catalogue
 * pages, prices remain authoritative in public/catalog_hotbath.json.
 * Images are manufacturer URLs already confirmed on official Hotbath pages;
 * a different finish is always labelled illustrative.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHotbathRay2026=api;
})(typeof window==='object'?window:null,function(){
'use strict';
const finishes=['IX','CR','GN','WH','TB','BBP','BCP','MBP','BGP'];
const models={
 'RARH50-1':{orientation:'horizontal',elements:1,powerW:16,base:'MBASES2',barLengthMm:500,widthMm:500,heightMm:337,photoFinish:'CR',photo:'https://hotbath.com/images/compano/RARH50.1/RARH50-1CR_02.png?resolution=600x600&quality=85&isLogo=true',officialUrl:'https://hotbath.it/fr/produits/4129/RARH50-1'},
 'RARH50-2':{orientation:'horizontal',elements:2,powerW:31,base:'MBASES3',barLengthMm:500,widthMm:500,heightMm:567,photoFinish:'CR',photo:'https://hotbath.com/images/compano/RARH50.2/RARH50-2CR_02.png?resolution=600x600&quality=85&isLogo=true',officialUrl:'https://hotbath.it/fr/produits/4131/RARH50-2'},
 'RARH50-3':{orientation:'horizontal',elements:3,powerW:46,base:'MBASES4',barLengthMm:500,widthMm:500,heightMm:745,photoFinish:'CR',photo:'https://hotbath.com/images/compano/RARH50.3/RARH50-3CR_02.png?resolution=600x600&quality=85&isLogo=true',officialUrl:'https://hotbath.it/fr/produits/4132/RARH50-3'},
 'RARV135-1':{orientation:'vertical',elements:1,powerW:63,base:'MBASES2',barLengthMm:1350,widthMm:190,heightMm:1350,photoFinish:'BCP',photo:'https://hotbath.com/images/compano/RARV135.1/RARV135-1BCP_02.png?resolution=600x600&quality=85&isLogo=true',officialUrl:'https://hotbath.it/fr/produits/4134/RARV135-1'},
 'RARV135-2':{orientation:'vertical',elements:2,powerW:125,base:'MBASES3',barLengthMm:1350,widthMm:380,heightMm:1350,photoFinish:'BCP',photo:'https://hotbath.com/images/compano/RARV135.2/RARV135-2BCP_02.png?resolution=600x600&quality=85&isLogo=true',officialUrl:'https://hotbath.it/fr/produits/4135/RARV135-2',technicalSheetUrl:'https://hotbath.it/documents/ProdCateg/4135/RARV135-2-00.pdf'},
 'RARV135-3':{orientation:'vertical',elements:3,powerW:187,base:'MBASES4',barLengthMm:1350,widthMm:570,heightMm:1350,photoFinish:'CR',photo:'https://hotbath.com/images/compano/RARV135.3/RARV135-3CR_02.png?resolution=600x600&quality=85&isLogo=true',officialUrl:'https://hotbath.it/fr/produits/4136/RARV135-3'}
};
const common={voltage:'230 V AC / 50 Hz',ip:'IP44',cableLengthMm:1500};
const tariffs={
 'RARH50-1':{standard:518,premium:712,base:185},'RARH50-2':{standard:795,premium:1146,base:222},
 'RARH50-3':{standard:1072,premium:1581,base:277},
 'RARV135-1':{standard:665,premium:1072,base:185},'RARV135-2':{standard:1091,premium:1867,base:222},
 'RARV135-3':{standard:1516,premium:2662,base:277}
};
function baseCode(p){return String(typeof p==='string'?p:p?.base||p?.reference||'').replace(/EXT\..*$/,'').trim();}
function specification(p){
 const code=baseCode(p),m=models[code];return m?{...common,...m,model:code}:null;
}
function media(p){
 const code=baseCode(p),m=models[code];if(!m)return null;
 const ref=String(p?.reference||''),finish=ref.match(/EXT\.([A-Z]{2,3})$/)?.[1]||String(p?.finishCode||'');
 return {src:m.photo,exact:finish===m.photoFinish,
   caption:finish===m.photoFinish?'Photo Hotbath · finition '+finish:
     'Photo Hotbath du modèle '+code+' · finition illustrative '+m.photoFinish+' (référence choisie : '+finish+')'};
}
function apply(rows){
 let count=0;
 for(const p of rows||[]){
  if(p?.manufacturer!=='Hotbath')continue;
  const model=specification(p);
  if(model&&/EXT\.(IX|CR|GN|WH|TB|BBP|BCP|MBP|BGP)$/.test(String(p.reference||''))){
   const img=media(p);
   p.category='Sèche-serviettes électriques';
   p.rayTechnical=model;
   p.rayBodyReference=model.base;
   p.manufacturerUrl=model.officialUrl;
   if(model.technicalSheetUrl)p.technicalSheetUrl=model.technicalSheetUrl;
   if(!p.image&&img?.src){
    p.image=img.src;p.imageSource=img.caption;
    p.imageFinishMatch=img.exact?'exact':'model-only';
   }
   count++;
  }else if(/^RAAR\.(IX|CR|GN|WH|TB|BBP|BCP|MBP|BGP)$/.test(String(p.reference||''))){
   p.category='Accessoires sèche-serviettes';count++;
  }else if(/^MBASES[234]$/.test(String(p.reference||''))){
   p.category='Composants sèche-serviettes';count++;
  }
 }
 return count;
}
// The original manufacturer-only tariff index must remain unchanged because
// older official guides use it for cross-brand and supplier-tree parity.
function extendTariffIndex(index,rows){
 const priced=new Map(index.get('Ray')||[]);
 for(const p of rows||[]){
  if(p?.manufacturer!=='Hotbath'||!/^(?:RARH50-[123]EXT\.|RARV135-[123]EXT\.|RAAR\.)/.test(String(p.reference||'')))continue;
  const key=baseCode(p).toUpperCase();
  const group=priced.get(key)||[];
  if(!group.some(x=>x.reference===p.reference))group.push(p);
  priced.set(key,group);
 }
 index.set('Ray',priced);
 return index;
}
function checkPrice(rows){
 const missing=[],mismatches=[];
 for(const [model,tariff] of Object.entries(tariffs)){
  const support=rows.find(p=>p.reference===models[model].base);
  if(!support||Number(support.price)!==tariff.base)mismatches.push(models[model].base);
  for(const finish of finishes){
   const ref=model+'EXT.'+finish,p=rows.find(x=>x.reference===ref);
   const expected=['IX','CR','GN','WH'].includes(finish)?tariff.standard:tariff.premium;
   if(!p)missing.push(ref);else if(Number(p.price)!==expected)mismatches.push(ref);
  }
 }
 for(const finish of finishes){
  const ref='RAAR.'+finish,p=rows.find(x=>x.reference===ref);
  const expected=['IX','CR','GN','WH'].includes(finish)?75:98;
  if(!p)missing.push(ref);else if(Number(p.price)!==expected)mismatches.push(ref);
 }
 return {missing,mismatches};
}
return {models,finishes,tariffs,common,specification,media,apply,checkPrice,baseCode,extendTariffIndex};
});
