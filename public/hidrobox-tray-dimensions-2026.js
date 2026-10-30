/* Hidrobox 2026. Exact measured size -> original manufacturer price-list band.
   A real centimeter choice is NEVER priced with interpolation or nearest match.
   Groups/categories are filtered separately before calling resolve(). */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHidroboxTrayDimensions2026=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 function band(v){
  const m=String(v??'').trim().replace(/[\u2012-\u2015]/g,'-')
    .replace(/\s+/g,'').match(/^(\d{2,3})(?:-(\d{2,3}))?$/);
  if(!m)return null;
  const first=Number(m[1]),last=Number(m[2]||m[1]);
  return first>=40&&first<=last&&last<=260?{first,last}:null;
 }
 function bounds(rows,key){
  const bands=rows.map(r=>band(r[key])).filter(Boolean);
  if(!bands.length)return null;
  return {first:Math.min(...bands.map(b=>b.first)),last:Math.max(...bands.map(b=>b.last))};
 }
 function accepts(row,width,length){
  const w=band(row?.width),l=band(row?.length);
  if(!w||!l||!Number.isInteger(width)||!Number.isInteger(length))return false;
  return width>=w.first&&width<=w.last&&length>=l.first&&length<=l.last;
 }
 function defaultSize(rows){
  const possible=rows.map(r=>({row:r,w:band(r.width),l:band(r.length)}))
    .filter(x=>x.w&&x.l&&Number.isFinite(Number(x.row.rawPrice))&&Number(x.row.rawPrice)>0)
    .sort((a,b)=>a.w.first-b.w.first||a.l.first-b.l.first||String(a.row.reference).localeCompare(String(b.row.reference)));
  if(!possible.length)return null;
  return {width:possible[0].w.first,length:possible[0].l.first};
 }
 function resolve(rows,requestedWidth,requestedLength){
  const wLimit=bounds(rows,'width'),lLimit=bounds(rows,'length');
  if(!wLimit||!lLimit)return {ok:false,error:'Le tarif importé ne comporte pas des tranches largeur et longueur suffisantes pour cette sélection.',
    widthBounds:wLimit,lengthBounds:lLimit,width:null,length:null,matches:[]};
  const defaultDims=defaultSize(rows);
  const width=requestedWidth==null||requestedWidth===''?defaultDims?.width:Number(requestedWidth);
  const length=requestedLength==null||requestedLength===''?defaultDims?.length:Number(requestedLength);
  if(!Number.isInteger(width)||!Number.isInteger(length))
    return {ok:false,error:'Les dimensions doivent être saisies en centimètres entiers.',
     widthBounds:wLimit,lengthBounds:lLimit,width,length,matches:[]};
  // The minimum/maximum is guidance only. Gaps between legal sizes stay unavailable.
  const matches=rows.filter(r=>accepts(r,width,length)&&Number(r.rawPrice)>0);
  const unique=new Map(matches.map(r=>[r.reference,r]));
  const priced=[...unique.values()];
  if(!priced.length)return {ok:false,error:'Aucune référence tarifaire du fabricant pour '+width+' × '+length+
    ' cm avec ce modèle, cette matière, cette texture et cette couleur.',widthBounds:wLimit,lengthBounds:lLimit,width,length,matches:[]};
  return {ok:true,widthBounds:wLimit,lengthBounds:lLimit,width,length,matches:priced,error:'',
    tiers:priced.map(r=>({reference:r.reference,width:r.width,length:r.length,rawPrice:Number(r.rawPrice),
       price:Math.round(Number(r.rawPrice)*104)/100}))};
 }
 return {band,bounds,accepts,defaultSize,resolve};
});
