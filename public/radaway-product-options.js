/* Radaway product options: distinguish confirmed model finish, glass type, and thickness.
 * The manufacturer's full glass palette is NOT guaranteed on every model.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroRadawayOptions=api;})(typeof window==='object'?window:null,function(){
 'use strict';
 const FINISH_NAMES=['Brushed Light Gold','Brushed GunMetal','Brushed Copper','Brushed Nickel',
  'Brushed Gold','Chrome+','Chrome','Black','White','Gold'];
 const GLASSES=[
  {value:'Transparent',label:'Transparent',general:true},
  {value:'UltraClear',label:'UltraClear®',general:true},
  {value:'Satiné',label:'Satiné',general:true},
  {value:'Graphite',label:'Graphite',general:true},
  {value:'Brun',label:'Brun',general:true},
  {value:'Master-Soft',label:'Master-Soft®',general:true},
  {value:'Miroir',label:'Miroir',general:true},
  {value:'Intimato',label:'Intimato',general:true},
  {value:'Visiosun',label:'Visiosun (flûté)',general:true}
 ];
 const COLORS={'Chrome':'#c9cdd1','Chrome+':'#aeb9c2','Black':'#202122','White':'#f6f4ef',
  'Gold':'#cba75b','Brushed Gold':'#bc9963','Brushed Light Gold':'#d8bc8a',
  'Brushed Copper':'#ad7860','Brushed Nickel':'#a9a7a0','Brushed GunMetal':'#5b5e62'};
 function parseFinish(name){
  const text=String(name||'').toLowerCase();
  return FINISH_NAMES.find(f=>text.includes(f.toLowerCase()))||'À confirmer';
 }
 function thicknessFor(row,official){
  const verified=Array.isArray(official?.thicknessOptions)?
   [...new Set(official.thicknessOptions.map(Number).filter(x=>[6,8,10].includes(x)))]:[];
  if(verified.length===1)return {options:verified,selected:verified[0],verified:true,source:'Fiche produit Radaway'};
  const name=String(row?.designation||row?.collection||'');
  const named=name.match(/\b(?:Nes|Arta|Essenza|Idea|Alienta|Premium)\s+(?:Pro\s+)?(6|8|10)\b/i);
  if(named){const n=Number(named[1]);return {options:[n],selected:n,verified:false,source:'Dénomination de la gamme — à confirmer sur fiche'};}
  if(/\bModo\s+(?:X|XL)\b/i.test(name))
   return {options:[10],selected:10,verified:false,source:'Gamme Modo X/XL — à confirmer sur fiche'};
  return {options:[6,8,10],selected:null,verified:false,source:'Épaisseur non identifiée : vérifier la fiche'};
 }
 function modelFamily(name){
  let s=String(name||'');
  for(const term of FINISH_NAMES)s=s.replace(new RegExp('\\b'+term.replace(/[+]/g,'\\+')+'\\b','ig'),' ');
  s=s.replace(/\s+/g,' ').trim();
  return s.toLowerCase();
 }
 function profiles(row,all){
  const key=modelFamily(row?.designation||'');
  const same=(all||[]).filter(x=>x?.manufacturer==='Radaway'&&
   x.productType===row?.productType&&modelFamily(x.designation)===key);
  const map=new Map();
  for(const r of same){const fin=r.finish&&r.finish!=='Finition du modèle'?r.finish:parseFinish(r.designation);
   if(fin!=='À confirmer'&&!map.has(fin))map.set(fin,r);
  }
  if(row&&!map.size)map.set(row.finish||parseFinish(row.designation),row);
  return [...map.entries()].map(([finish,record])=>({finish,reference:record.reference,color:COLORS[finish]||'#ccc',
    exactManufacturerModel:true}));
 }
 function glassOptions(official){
  const verified=Array.isArray(official?.glassOptions)&&official.glassOptionsVerified===true?
    official.glassOptions.filter(x=>GLASSES.some(g=>g.value===x)):null;
  return GLASSES.map(g=>({...g,verified:!!verified&&verified.includes(g.value),
    available:!verified||verified.includes(g.value)})).filter(g=>g.available);
 }
 return {FINISH_NAMES,GLASSES,COLORS,parseFinish,thicknessFor,modelFamily,profiles,glassOptions};
});