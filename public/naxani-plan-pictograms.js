/* Plan vasque technical pictograms traced from Naxani Tarifa 2026, pp. 54–61.
 * Schematic outlines preserve family bowl form, not scaled manufacturing drawings.
 */
(function(root){
 'use strict';
 const E=root.HydroNaxaniEnhancements;
 if(!E)return;
 const existing=E.pictogram;
 const N=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const esc=s=>String(s||'').replace(/[&<>"']/g,'');
 const shapes={
   alma:'<rect x="61" y="27" width="78" height="43" rx="1.5"/>',
   alpos:'<rect x="61" y="27" width="78" height="43" rx="1.5"/><path d="M64 66h72" stroke-width=".7"/>',
   aran:'<rect x="64" y="28" width="72" height="40" rx="12"/>',
   ares:'<rect x="66" y="28" width="68" height="40" rx="2"/>',
   borvo:'<rect x="59" y="25" width="82" height="46" rx="12"/>',
   daro:'<rect x="63" y="26" width="74" height="44" rx="8"/>',
   formalarge:'<rect x="44" y="26" width="112" height="44" rx="22"/>',
   formasmall:'<rect x="70" y="26" width="60" height="44" rx="22"/>',
   inis:'<rect x="70" y="24" width="60" height="48" rx="10"/>',
   latu:'<ellipse cx="100" cy="48" rx="44" ry="26"/>',
   orbit:'<circle cx="100" cy="48" r="26"/>',
   patra:'<rect x="49" y="19" width="102" height="58" rx="28"/>',
   prenn:'<rect x="60" y="25" width="80" height="46" rx="10"/>',
   tulpan:'<rect x="50" y="18" width="100" height="60" rx="29"/>',
   '2r':'<circle cx="100" cy="48" r="26"/>',
   square:'<rect x="66" y="24" width="68" height="48" rx="1"/><path d="M66 58h68"/>'
 };
 function pic(p){
  if(!p||p.productType!=='plan-integre')return existing(p);
  const k=N(p.collection);
  const shape=shapes[k];
  if(!shape)return existing(p);
  const doubled=Number(p.naSinkCount||1)===2;
  const bowl=(doubled?'<g transform="translate(6 0) scale(.57 1)">'+shape+'</g><g transform="translate(80 0) scale(.57 1)">'+shape+'</g>':shape);
  const tape=(doubled?'<circle cx="63" cy="17" r="2.1"/><circle cx="137" cy="17" r="2.1"/>':'<circle cx="100" cy="17" r="2.1"/>');
  return '<svg class="nax-pictogram nax-plan-original-shape" viewBox="0 0 200 95" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schéma de forme plan vasque '+esc(p.collection)+(doubled?', deux vasques':'')+'">'+
    '<rect x="11" y="11" width="178" height="74" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>'+
    '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">'+bowl+'</g>'+
    '<g fill="none" stroke="currentColor" stroke-width="1.3">'+tape+'</g>'+
    (doubled?'<circle cx="63" cy="48" r="3" fill="none" stroke="currentColor"/><circle cx="137" cy="48" r="3" fill="none" stroke="currentColor"/>':'<circle cx="100" cy="48" r="3" fill="none" stroke="currentColor"/>')+
    '</svg>';
 }
 E.pictogram=pic;
 root.HydroNaxaniPlanPictograms={families:Object.keys(shapes),pictogram:pic};
})(typeof window!=='undefined'?window:globalThis);
