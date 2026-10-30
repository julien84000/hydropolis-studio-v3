/* Tariff-led Hidrobox shower trays: model -> material -> texture -> colour -> dimensions -> exact SKU.
 * Never create a new SKU, silently replace a material, or assume every collection has the same axes.
 * Missing source width/length remains missing and is not reconstructed from an unrelated reference.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHidroboxTrayCascade2026=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const BASE=['Bianco','Beige','Pietra','Cement','Iron','Graphite'];
 const TRENDS=['Crema','Cappuccino','Terra','Brownie','Cotta','Golden','Sandstone',
  'Blush','Ocean','Lake','Ombra','Dark Liquen','Metropoli','Herbal'];
 const SINGLE='Couleur RAL/NCS spéciale (devis fabricant)';
 const FIXED={
  twins:{material:'Kromat',texture:'Microtex'},
  quadro:{material:'Kromat',texture:'Ardoise'},
  one:{material:'Kromat'},
  pure:{material:'Kromat',texture:'Microtex'},
  arq:{material:'Kromat',texture:'Ciment'},
  loovers:{material:'Scene',texture:'Lisse'},
  unique:{material:'Scene',texture:'Lisse'},
  iconik:{material:'Scene',texture:'Lisse'}
 };
 const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const section=g=>norm(typeof g==='string'?g:g?.collection||g?.id).replace(/ /g,'-');
 function enrich(group,row){
  const id=section(group),rules=FIXED[id]||{};
  const ref=String(row?.reference||'').toUpperCase();
  const number=Number(ref.match(/\d{4}$/)?.[0]||0);
  let material=row?.material||rules.material||'';
  let texture=row?.finish||row?.texture||rules.texture||'';
  if(id==='line'&&!material&&/^SLIC\d{4}$/.test(ref))
    material=number>=533?'Kromat':'Scene';
  if(id==='one'&&/^SONC\d{4}$/.test(ref))
    texture=number>=585&&number<=643?'Microtex':'Ardoise';
  return {...row,material,finish:texture};
 }
 const belongs=(g,row)=>({
  twins:'STWC',line:'SLIC',quadro:'SQUC',one:'SONC',pure:'SPUC',
  arq:'SARC',loovers:'SLOC',unique:'SUNC',iconik:'SICC','neo-plus':'SNEC'
 })[section(g)]?.length?String(row?.reference||'').startsWith(({
  twins:'STWC',line:'SLIC',quadro:'SQUC',one:'SONC',pure:'SPUC',
  arq:'SARC',loovers:'SLOC',unique:'SUNC',iconik:'SICC','neo-plus':'SNEC'
 })[section(g)]):false;
 function colorsForGroup(group){
  const key=norm(group);
  if(key==='bla')return ['Blanc',...BASE,...TRENDS];
  if(key==='bas'||key==='basic')return BASE.slice();
  if(key==='tre'||key==='trend')return TRENDS.slice();
  if(key==='spe'||key==='special')return [SINGLE];
  return [];
 }
 const groupForColor=(color,material,allowedGroups)=>{
  if(color==='Blanc'&&allowedGroups.includes('BLA'))return 'BLA';
  if(color===SINGLE)return allowedGroups.includes('SPE')?'SPE':'';
  const base=BASE.includes(color),trend=TRENDS.includes(color);
  if(norm(material)==='scene'&&allowedGroups.includes('BLA'))return 'BLA';
  if(base&&allowedGroups.includes('BAS'))return 'BAS';
  if(trend&&allowedGroups.includes('TRE'))return 'TRE';
  return '';
 };
 const sortNumbers=(values)=>values.sort((a,b)=>{
  const n=x=>Number(String(x).match(/^\d+/)?.[0]||0);
  return n(a)-n(b)||String(a).localeCompare(String(b),'fr');
 });
 function arrange(group,items,draft={},selector,official){
  const raw=items.filter(x=>belongs(group,x));
  const models=selector?.variants(group,raw,official)||[];
  const model=models.some(x=>x.id===draft.traySubmodel)?draft.traySubmodel:models[0]?.id||'';
  let rows=model?selector.filter(group,raw,model,official):raw;
  const fields=[];
  // Exactly the user-requested order: material, texture, color, dimensions.
  for(const [key,label] of [['material','Matière'],['finish','Finition / texture']]){
   const options=[...new Set(rows.map(r=>String(enrich(group,r)[key]||'')).filter(Boolean))];
   const chosen=options.includes(draft[key])?draft[key]:options[0]||'';
   if(chosen)rows=rows.filter(r=>enrich(group,r)[key]===chosen);
   fields.push({key,label,options,chosen,static:options.length<=1,missing:!chosen});
  }
  const material=fields.find(f=>f.key==='material')?.chosen||'';
  const groups=[...new Set(rows.map(x=>String(x.colorGroup||'').toUpperCase()).filter(Boolean))];
  const available=[...new Set(groups.flatMap(colorsForGroup))];
  const selectedColor=available.includes(draft.showerColor)?draft.showerColor:available[0]||'';
  const matchedGroup=groupForColor(selectedColor,material,groups);
  if(matchedGroup)rows=rows.filter(r=>String(r.colorGroup||'').toUpperCase()===matchedGroup);
  fields.push({key:'color',label:'Finition / couleur',options:available,chosen:selectedColor,
   static:available.length<=1,missing:!selectedColor});
  for(const [key,label] of [['width','Largeur / tranche tarifaire'],['length','Longueur / tranche tarifaire']]){
   const options=sortNumbers([...new Set(rows.map(r=>String(r[key]||'')).filter(Boolean))]);
   const chosen=options.includes(draft[key])?draft[key]:options[0]||'';
   if(chosen)rows=rows.filter(r=>String(r[key]||'')===chosen);
   fields.push({key,label,options,chosen,static:options.length<=1,missing:!chosen});
  }
  const refs=[...new Set(rows.map(r=>String(r.reference||'')).filter(Boolean))];
  const reference=refs.includes(draft.reference)?draft.reference:refs[0]||'';
  const original=rows.find(r=>r.reference===reference);
  const selected=original?enrich(group,original):null;
  // Scene is physically available in more colours than the BLA-price-row describes.
  // A colour upgrade without a supplier price MUST be quoted before adding it.
  const needsColorQuote=material==='Scene'&&selectedColor&&selectedColor!=='Blanc';
  const missingAttributes=fields.filter(f=>f.missing).map(f=>f.label);
  return {model,models,fields,rows,refs,selected,reference,color:selectedColor,
    needsColorQuote,missingAttributes,ready:!!(selected&&!missingAttributes.length&&!needsColorQuote)};
 }
 return {BASE,TRENDS,SINGLE,FIXED,enrich,belongs,colorsForGroup,groupForColor,arrange};
});
