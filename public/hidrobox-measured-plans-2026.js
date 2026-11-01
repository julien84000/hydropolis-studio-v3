/* Hidrobox Program Colour / Lom / Artop — exact dimensions from actual 2026 tariff rows.
 * A dimensional band is only accepted if it is explicit in the imported supplier row.
 * Both dimensions must belong to the SAME priced row; never interpolate between rows.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroHidroboxMeasuredPlans2026=api;})(typeof window==='object'?window:null,function(){
'use strict';
const COLLECTIONS=['program colour','lom','artop'];
const key=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const applies=name=>COLLECTIONS.includes(key(name));
function band(value){
 if(typeof value==='number'&&Number.isInteger(value)&&value>=1&&value<=260)return {first:value,last:value};
 const raw=String(value??'').trim().replace(/[\u2012-\u2015]/g,'-');
 // Explicit centimetre bands only. Never mistake a list of dimensions for a range.
 const match=raw.match(/^(?:de\s*)?(\d{1,3})(?:\s*(?:-|à|a|to)\s*(\d{1,3}))?\s*(?:cm)?$/i);
 if(!match)return null;
 const first=Number(match[1]),last=Number(match[2]||match[1]);
 if(!Number.isInteger(first)||!Number.isInteger(last)||first<1||last>260||first>last)return null;
 return {first,last};
}
const dimensions=row=>{const width=band(row?.width),length=band(row?.length);return width&&length?{width,length}:null};
function resolve(rows,exactWidth,exactLength,requestedReference=''){
 const priced=(rows||[]).filter(r=>r&&r.reference&&Number(r.rawPrice)>0).map(row=>({row,bounds:dimensions(row)})).filter(x=>x.bounds);
 if(!priced.length)return {available:false,ready:false,reason:'Le tarif importé ne contient pas les deux plages dimensionnelles vérifiables pour ce modèle.',rows:[],bounds:null,matching:[],selected:null};
 const bounds={width:{first:Math.min(...priced.map(x=>x.bounds.width.first)),last:Math.max(...priced.map(x=>x.bounds.width.last))},
               length:{first:Math.min(...priced.map(x=>x.bounds.length.first)),last:Math.max(...priced.map(x=>x.bounds.length.last))}};
 const width=exactWidth===undefined||exactWidth===null?priced[0].bounds.width.first:Number(exactWidth);
 const length=exactLength===undefined||exactLength===null?priced[0].bounds.length.first:Number(exactLength);
 const matching=Number.isInteger(width)&&Number.isInteger(length)?
   priced.filter(x=>width>=x.bounds.width.first&&width<=x.bounds.width.last&&length>=x.bounds.length.first&&length<=x.bounds.length.last).map(x=>x.row):[];
 const selected=matching.find(r=>r.reference===requestedReference)||(matching.length===1?matching[0]:null);
 return {available:true,ready:!!selected,reason:!matching.length?'Aucune référence tarifée ne couvre ce couple largeur × longueur.':!selected?'Plusieurs références correspondent : sélectionner la référence fabricant.':'',
   rows:priced.map(x=>x.row),bounds,matching,selected,width,length};
}

/* Supplier PDF FR V0226: Artop p.92-95, Lom p.96-99.
 * The compressed importer omits many repeated column values. Reconstruct
 * coordinates ONLY from published 2026 manufacturer SKU code blocks.
 * Never infer a price; the imported rawPrice remains authoritative.
 */
const ART_LENGTHS=[[60,81],[82,101],[102,121],[122,141],[142,161],[162,181],[182,201]];
const ART_WIDTHS=[[40,50],[51,60]];
const ART_HEIGHTS=[[1.2,1.2],[3,10],[11,20],[21,40]];
const LOM_LENGTHS=[71,81,101,121,141],LOM_WIDTHS=[45.5,50.5],LOM_HEIGHTS=[1.2,15];
const HEX4=n=>'CARC'+String(n).padStart(4,'0');
const decodeIndex=(n,first)=>n>=first&&n<first+56?n-first:null;
function artIndex(reference){
 const code=Number(String(reference||'').replace(/^CARC/,''));
 if(!/^CARC\d{4}$/.test(reference))return null;
 for(const [material,finish,group,start] of [
  ['Kromat','Lisse','BAS',921],['Kromat','Lisse','TRE',977],['Kromat','Lisse','SPE',1033],
  ['Kromat','Microtex','BAS',505],['Kromat','Microtex','TRE',673]
 ]){
  const idx=decodeIndex(code,start);
  if(idx!==null)return {material,finish,group,index:idx};
 }
 // Supplier special Microtex groups use four separated reference blocks.
 for(let h=0;h<4;h++){
  const start=[15,43,71,323][h];
  const idx=decodeIndex(code,start);
  if(idx!==null&&idx<14)return {material:'Kromat',finish:'Microtex',group:'SPE',index:h*14+idx};
 }
 // Manufacturer Scene Lisse white SKU groups are indexed in tens, not by 56 contiguous codes.
 for(let h=0;h<4;h++)for(let w=0;w<2;w++){
  const start=841+h*20+w*10;
  if(code>=start&&code<=start+6)return {material:'Scene',finish:'Lisse',group:'BLA',index:h*14+w*7+code-start};
 }
 return null;
}
function detail(name,row){
 const coll=key(name);
 if(coll==='lom'){
  const n=Number(String(row.reference||'').replace(/^WLOS/,''));
  if(!/^WLOS\d{4}$/.test(String(row.reference||''))||n<1||n>20)return null;
  const k=n-1,h=Math.floor(k/10),w=Math.floor((k%10)/5),l=k%5;
  return {...row,material:'Scene',finish:'Lisse',colorGroup:'BLA',
   widthMin:LOM_WIDTHS[w],widthMax:LOM_WIDTHS[w],lengthMin:LOM_LENGTHS[l],lengthMax:LOM_LENGTHS[l],
   heightMin:LOM_HEIGHTS[h],heightMax:LOM_HEIGHTS[h],width:LOM_WIDTHS[w],length:LOM_LENGTHS[l],height:LOM_HEIGHTS[h]};
 }
 if(coll==='artop'){
  const d=artIndex(row.reference);if(!d)return null;
  const h=Math.floor(d.index/14),w=Math.floor((d.index%14)/7),l=d.index%7;
  return {...row,...d,colorGroup:d.group,
   widthMin:ART_WIDTHS[w][0],widthMax:ART_WIDTHS[w][1],
   lengthMin:ART_LENGTHS[l][0],lengthMax:ART_LENGTHS[l][1],
   heightMin:ART_HEIGHTS[h][0],heightMax:ART_HEIGHTS[h][1],
   width:ART_WIDTHS[w].join('-'),length:ART_LENGTHS[l].join('-'),height:ART_HEIGHTS[h].join('-')};
 }
 return null;
}
const DEFAULTS={lom:{width:45.5,length:71,height:1.2,material:'Scene',finish:'Lisse',group:'BLA',color:'Blanc'},
 artop:{width:45,length:100,height:1.2,material:'Kromat',finish:'Lisse',group:'BAS',color:'Beige',specialCode:''}};
function resolveExact(name,rows,state={}){
 const collection=key(name),fallback=DEFAULTS[collection];
 if(!fallback)return {ready:false,reason:'Collection de plans non reconnue'};
 const config={...fallback,...Object.fromEntries(Object.entries(state).filter(([k,v])=>v!==undefined&&v!==null&&v!==''))};
 const matched=(rows||[]).map(row=>detail(name,row)).filter(r=>r&&Number(r.rawPrice)>0);
 const required=collection==='lom'?20:392;
 const primary=matched.length===required;
 const w=Number(config.width),l=Number(config.length),h=Number(config.height);
 const special=collection==='artop'&&config.group==='SPE';
 const specialOK=!special||/^(RAL|NCS)\s*[-\w .]{2,25}$/i.test(String(config.specialCode||'').trim());
 const matching=matched.filter(row=>
  row.material===config.material&&row.finish===config.finish&&row.colorGroup===config.group&&
  w>=row.widthMin&&w<=row.widthMax&&l>=row.lengthMin&&l<=row.lengthMax&&h>=row.heightMin&&h<=row.heightMax);
 const selected=matching.length===1&&specialOK&&primary?matching[0]:null;
 let reason='';
 if(!primary)reason='Références tarifaires fabricant incomplètes : '+matched.length+'/'+required+' pour '+name+'.';
 else if(!specialOK)reason='Saisir la teinte RAL/NCS demandée.';
 else if(matching.length!==1)reason='Couple de dimensions / épaisseur / matière / texture non tarifé pour '+name+'.';
 return {ready:!!selected,available:primary,selected,matching,reason,
  width:w,length:l,height:h,config,price:selected?Number(selected.price):null,
  candidates:matched.length,source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf'};
}
const appliesExact=name=>['lom','artop'].includes(key(name));

return {applies,band,dimensions,resolve,appliesExact,detail,resolveExact,ART_LENGTHS,ART_WIDTHS,ART_HEIGHTS,LOM_LENGTHS,LOM_WIDTHS,LOM_HEIGHTS};
});