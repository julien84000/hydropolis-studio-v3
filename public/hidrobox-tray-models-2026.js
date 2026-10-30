/* Hidrobox shower-tray primary form selector.
 * The 2026 supplier pricelist defines shapes and the exact references.
 * This module chooses only the submodel/shape; dimensions, price and finish
 * always remain sourced from the matching imported tariff row.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHidroboxTrayModels2026=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const squareLine=new Set([
  'SLIC0587','SLIC0588','SLIC0678','SLIC0679','SLIC0784','SLIC0785',
  'SLIC0875','SLIC0876','SLIC0949','SLIC0950','SLIC1040','SLIC1041',
  'SLIC0041','SLIC0042','SLIC0114','SLIC0115'
 ]);
 const names={
  'twins-yl':'Twins YL','twins-yr':'Twins YR',
  'line-x':'Line X','line-y':'Line Y','line-square':'Line carré',
  'one-rectangle':'One rectangulaire','one-square':'One carré','one-angular':'One angulaire',
  'iconik-rectangle':'Iconik rectangulaire','iconik-square':'Iconik carré',
  'loovers-share':'Loovers To Share','loovers-round-c':'Loovers Round C',
  'loovers-round-l':'Loovers Round L','loovers-round-r':'Loovers Round R',
  'loovers-round-rect':'Loovers Round Rect.','loovers-single-l':'Loovers Single L','loovers-single-r':'Loovers Single R',
  'pure-rectangle':'Pure rectangulaire','quadro-rectangle':'Quadro rectangulaire',
  'arq-rectangle':'Arq rectangulaire','unique-rectangle':'Unique rectangulaire'
 };
 const groups={
  twins:['twins-yl','twins-yr'],
  line:['line-x','line-y','line-square'],
  one:['one-rectangle','one-square','one-angular'],
  iconik:['iconik-rectangle','iconik-square'],
  loovers:['loovers-share','loovers-round-c','loovers-round-l','loovers-round-r',
    'loovers-round-rect','loovers-single-l','loovers-single-r'],
  pure:['pure-rectangle'],quadro:['quadro-rectangle'],arq:['arq-rectangle'],unique:['unique-rectangle']
 };
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 function submodel(group,row,official){
  const g=norm(typeof group==='string'?group:group?.collection||group?.id);
  const ref=String(row?.reference||'').toUpperCase();
  if(g==='line'&&['line-x','line-y','line-square'].includes(row?.model))return row.model;
  if(g==='line'&&squareLine.has(ref))return 'line-square';
  if((g==='line'||g==='twins')&&official?.modelFromReference)return official.modelFromReference(ref);
  const m=ref.match(/^([A-Z]+)(\d{4})$/),n=m?Number(m[2]):NaN;
  if(g==='one'&&m?.[1]==='SONC'){
    if([463,478].includes(n))return 'one-square';
    if([464,479].includes(n))return 'one-angular';
    if((n>=439&&n<=511)||(n>=585&&n<=643))return 'one-rectangle';
  }
  if(g==='iconik'&&m?.[1]==='SICC'&&n>=1&&n<=10)return n<=8?'iconik-rectangle':'iconik-square';
  if(g==='loovers'&&m?.[1]==='SLOC'&&n>=1&&n<=9){
    const models=['','loovers-share','loovers-share','loovers-share','loovers-round-c',
      'loovers-round-l','loovers-round-r','loovers-round-rect','loovers-single-l','loovers-single-r'];
    return models[n];
  }
  const oneShape={pure:'SPUC',quadro:'SQUC',arq:'SARC',unique:'SUNC'};
  if(oneShape[g]&&ref.startsWith(oneShape[g]))return g+'-rectangle';
  return '';
 }
 function variants(group,rows,official){
  const g=norm(group?.collection||group?.id);
  if(!groups[g])return [];
  const ids=new Set((rows||[]).map(r=>submodel(group,r,official)).filter(Boolean));
  return groups[g].filter(id=>ids.has(id)).map(id=>({id,label:names[id]}));
 }
 function filter(group,rows,selected,official){
  if(!selected)return rows;
  return (rows||[]).filter(row=>submodel(group,row,official)===selected);
 }
 function shapeSvg(id){
  if(!names[id])return '';
  const left=id==='twins-yl',right=id==='twins-yr';
  const square=id==='line-square'||id==='one-square'||id==='iconik-square';
  const x=id==='line-x';
  const w=square?62:118,h=63,x0=square?37:10,y0=9;
  const body='<rect x="'+x0+'" y="'+y0+'" width="'+w+'" height="'+h+'" fill="none" stroke="currentColor" stroke-width="2.4"/>';
  let drain='';
  if(left||right){
   const dx=left?x0+8:x0+w-8;
   drain='<path d="M'+dx+' '+(y0+7)+'V'+(y0+h-8)+'" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>'+
     '<path d="M'+(left?dx+6:dx-6)+' '+(y0+11)+'V'+(y0+h-12)+'" stroke="currentColor" opacity=".35"/>';
  }else if(id==='one-angular'){
   drain='<path d="M'+(x0+10)+' '+(y0+h-8)+' Q'+(x0+w-10)+' '+(y0+h-8)+' '+(x0+w-7)+' '+(y0+9)+'" fill="none" stroke="currentColor" stroke-width="3"/>';
  }else if(x||square){
   drain='<path d="M'+(x0+6)+' '+(y0+10)+'V'+(y0+h-10)+'" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>';
  }else{
   drain='<path d="M'+(x0+12)+' '+(y0+7)+'H'+(x0+w-12)+'" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>';
  }
  return '<svg viewBox="0 0 138 82" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">'+body+drain+'</svg>';
 }
 function summarize(group,rows,selected,official){
  const filtered=filter(group,rows,selected,official);
  return {model:selected,records:filtered.length,materials:[...new Set(filtered.map(r=>String(r.material||'')).filter(Boolean))],
   textures:[...new Set(filtered.map(r=>String(r.finish||'')).filter(Boolean))],
   references:filtered.map(r=>r.reference)};
 }
 return {submodel,variants,filter,shapeSvg,summarize,squareLine};
});
