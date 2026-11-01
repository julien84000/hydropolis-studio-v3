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
return {applies,band,dimensions,resolve};
});