/* Program Colour — interactive S41/S42 / Kromat / precise colour / cm sizes / 2026 supplier prices. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroProgramColourUI=api;})(typeof window==='object'?window:null,function(root){
'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EUR=n=>Number(n).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
// Product thumbnail from the official Program Colour collection page. NOT a shade-specific SKU image.
const COLLECTION_IMAGE='https://hidrobox.com/wp-content/uploads/2025/05/Hidrobox_Washbasin_Program-colour_Thumbnail.png';
let state=null,key='';
function reset(){state=null;key='';}
const select=(id,label,opts,value)=>'<label>'+E(label)+'<select id="'+E(id)+'">'+opts.map(o=>'<option value="'+E(o[0])+'"'+(String(o[0])===String(value)?' selected':'')+'>'+E(o[1])+'</option>').join('')+'</select></label>';
const opts=(dict)=>Object.keys(dict).map(k=>[k,k.replace(/([a-z])([A-Z])/g,'$1 $2')]);
const inputs=(s)=>'<div class="hp-grid"><label>Longueur réelle (cm)<input id="pcLength" type="number" step="1" min="70" max="201" required value="'+E(s.length)+'"></label>'+
  '<label>Profondeur réelle (cm)<input id="pcDepth" type="number" step="1" min="40" max="'+(Number(s.height)===1.2?60:55)+'" required value="'+E(s.depth)+'"></label>'+
  '<label>Hauteur du plan (cm)<select id="pcHeight">'+[1.2,...Array.from({length:13},(_,i)=>i+3)].map(v=>'<option value="'+v+'"'+(Number(s.height)===v?' selected':'')+'>'+String(v).replace('.',',')+' cm</option>').join('')+'</select></label></div>';
const preview=(s,m)=>{const colour=s.group==='SPE'?'#bebebe':m.SWATCHES[s.color]||'#ccc';
 // Schematic preview, NOT a photoshopped/fabricated manufacturer's colour photograph.
 return '<div class="hb-pc-render" aria-label="Schéma en couleur indicative du plan '+E(s.basin)+'">'+
  '<svg viewBox="0 0 420 190" role="img" aria-label="Plan avec vasque '+E(s.basin)+' et aperçu non contractuel de teinte">'+
  '<rect x="18" y="25" width="384" height="132" rx="5" fill="'+colour+'" stroke="#555" stroke-width="2"/>'+
  (s.basin==='S42'?'<rect x="63" y="59" width="120" height="64" rx="18" fill="none" stroke="#344" stroke-width="7"/>'+
                    '<rect x="239" y="59" width="120" height="64" rx="18" fill="none" stroke="#344" stroke-width="7"/>':
     '<rect x="'+(s.position==='left'?46:s.position==='right'?244:151)+'" y="57" width="128" height="69" rx="19" fill="none" stroke="#344" stroke-width="7"/>')+
  '<text x="210" y="180" fill="currentColor" font-size="12" text-anchor="middle">SCHÉMA INDICATIF · '+E(s.group==='SPE'?s.specialCode||'RAL / NCS':s.color)+'</text></svg>'+
  '</div>';
};
function programColour(g,ctx){
 const m=root.HydroProgramColour2026;
 if(!m){ctx.shell('Program Colour','<p role="alert">Module tarifaire fabricant non chargé, ajout bloqué.</p>');return true;}
 if(!state||key!==g.id){
  key=g.id;const old=ctx.original?.hidroboxConfiguration||{};
  state=old.type==='program-colour-2026'?{...m.defaultState(),...old}:m.defaultState();
 }
 const s=state,quote=m.quote(s,g.variants||[]);
 const colour=s.group==='SPE'?s.specialCode:s.color;
 const colourCards=s.group==='SPE'?'<label>Code spécial RAL ou NCS<input id="pcSpecial" type="text" placeholder="RAL 9010 / NCS S 0500-N" value="'+E(s.specialCode||'')+'"></label>':
  '<div class="hb-pc-palette" role="group" aria-label="Couleurs réelles de la gamme '+E(s.group)+'">'+m.COLORS[s.group].map(c=>
    '<button type="button" data-pc-color="'+E(c)+'" class="hb-pc-swatch" aria-pressed="'+(s.color===c)+'">'+
    '<span class="hb-pc-colour" style="background:'+m.SWATCHES[c]+'"></span><strong>'+E(c)+'</strong></button>').join('')+'</div>';
 const groupChoices=[['BAS','Basics · tarif standard'],['TRE','Trends · tarif standard'],['SPE','Specials RAL/NCS · prix dans la référence, +25 % déjà inclus']];
 const qTable=quote.components.map(c=>'<tr><td>'+E(c.reference||'—')+'</td><td>'+E(c.label)+'</td><td>'+EUR(c.rawPrice)+'</td></tr>').join('');
 const html='<button class="hidrobox-back" type="button">← Collections</button>'+
  '<div class="hidrobox-neo-hero hb-pc-hero"><div class="hb-pc-photo">'+
   '<img class="hb-pc-collection" src="'+E(COLLECTION_IMAGE)+'" alt="Photo officielle de collection Program Colour, coloris non garanti" loading="lazy">'+
   preview(s,m)+
   '<img data-hb-config-image hidden alt="Photo officielle Hidrobox configurée">'+
   '<small data-hb-config-status>Photo officielle de collection (non liée à la teinte choisie). Le configurateur en ligne Hidrobox ne répertorie pas Program Colour comme collection filtrable ; le schéma coloré est seulement indicatif.</small></div>'+
   '<div><h3>Program Colour · plan vasque sur mesure Kromat</h3><p>Configuration : forme S41 ou S42 → couleur précise → dimensions → options → référence et prix fabricant.</p>'+
   '<a href="https://hidrobox.com/fr/collections/program-colour/" target="_blank" rel="noopener noreferrer">Collection officielle Hidrobox</a></div></div>'+
  '<div class="hidrobox-program hb-pc-config">'+
  '<h4>1 · Forme et implantation de la vasque</h4><div class="hb-pc-families">'+
    [['S41','S41 · simple vasque 30 × 50 cm · incluse'],['S42','S42 · double vasque 30 × 45 cm · +215 € HT']].map(([id,title])=>
      '<button type="button" data-pc-basin="'+id+'" aria-pressed="'+(s.basin===id)+'">'+E(title)+'</button>').join('')+'</div>'+
  (s.basin==='S41'?select('pcPosition','Implantation S41',[['left','Décentrée à gauche'],['center','Centrée'],['right','Décentrée à droite']],s.position):
   '<p class="hidrobox-guide-note">S42 : deux vasques séparées de 25 cm, longueur minimale 135 cm (schéma fabricant).</p>')+
  '<h4>2 · Matière et finition</h4><div class="hidrobox-fixed-attribute"><strong>Kromat · Advanced Composite</strong><span>Lisse · finition mate fabricant</span></div>'+
  '<h4>3 · Couleur réelle du plan vasque</h4>'+select('pcGroup','Famille tarifaire',groupChoices,s.group)+colourCards+
  '<small>Les pastilles de couleur sont des approximations visuelles d’écran. Seule une photo renvoyée pour le modèle et la teinte par le configurateur officiel peut être présentée comme correspondant à la sélection.</small>'+
  '<h4>4 · Dimensions exactes</h4>'+inputs(s)+
  '<small>Tarif 2026 : longueur 70–201 cm ; profondeur 40–60 cm (hauteur 1,2 cm), 40–55 cm (hauteur 3–15 cm). Les dimensions sont au centimètre, sans interpolation entre tranches.</small>'+
  '<h4>5 · Options tarifées</h4><div class="hp-grid">'+
   select('pcTap','Préparation robinetterie', [['none','Sans préparation'],['H1','H1 · monobloc +23 €'],['H3','H3 · 3 trous +23 €'],['other','Autre préparation +56 €']],s.tap)+
   select('pcDrain','Bonde',Object.entries(m.OPTIONS.drain).filter(([k])=>!/(BAS|TRE|SPE)$/.test(k)||k.endsWith(s.group)).map(([k,v])=>[k,k==='none'?'Sans bonde':k+' · +'+v[1]+' €']),s.drain)+
   select('pcTowel','Porte-serviettes',opts(m.OPTIONS.towel).map(([k])=>[k,k==='none'?'Aucun':k+' · +'+m.OPTIONS.towel[k][1]+' €']),s.towel)+
   '<label>Hauteur crédence (cm, 0 = sans)<input id="pcBacksplash" type="number" min="0" max="30" step="1" value="'+E(s.backsplashHeight)+'"></label>'+
   '<label class="hb-pc-check"><input id="pcBacksplashTap" type="checkbox"'+(s.backsplashTap?' checked':'')+'>Préparation robinetterie sur crédence 15–30 cm · +68 € HT</label>'+
   '<label class="hb-pc-check"><input id="pcSupportsVisible" type="checkbox"'+(s.supportsVisible?' checked':'')+'>Fixations apparentes · +110 € HT</label>'+
   '<label class="hb-pc-check"><input id="pcOverflow" type="checkbox"'+(s.overflow?' checked':'')+'>Trop-plein chromé +62 € HT</label>'+
   '<label class="hb-pc-check"><input id="pcCut" type="checkbox"'+(s.specialCut?' checked':'')+'>Découpe spéciale (+10 %, validation technique obligatoire)</label>'+
  '</div>'+
  '<h4>6 · Référence fournisseur et prix détaillé</h4>'+
  (quote.errors.length?'<div class="hp-errors" role="alert">'+quote.errors.map(x=>'<p>'+E(x)+'</p>').join('')+'</div>':'')+
  '<table class="hp-breakdown"><thead><tr><th>Référence</th><th>Article / option</th><th>Prix HT</th></tr></thead><tbody>'+qTable+'</tbody></table>'+
  '<div class="hidrobox-result"><div><b>'+(quote.ok?EUR(quote.price)+' HT':'Prix non validé')+'</b>'+
    '<span>Référence plan : '+E(quote.reference||'—')+' · '+E(s.group==='SPE'?s.specialCode:s.color)+'</span>'+
    '<small>Prix public fabricant : '+(quote.ok?EUR(quote.rawPrice):'indisponible')+' HT ; majoration Hidrobox Hydropolis +4 % appliquée une seule fois ; remise achat 50 % séparée.</small>'+
   '</div><button id="pcAdd" class="btn primary" type="button"'+(quote.ok?'':' disabled')+'>Ajouter au projet</button></div></div>';
 ctx.shell('Program Colour · configuration sur mesure',html);
 const view=ctx.overlay();
 view.querySelector('.hidrobox-back').onclick=()=>{reset();ctx.back()};
 const refresh=()=>programColour(g,ctx);
 for(const btn of view.querySelectorAll('[data-pc-basin]'))btn.onclick=()=>{s.basin=btn.dataset.pcBasin;refresh()};
 for(const btn of view.querySelectorAll('[data-pc-color]'))btn.onclick=()=>{s.color=btn.dataset.pcColor;refresh()};
 for(const [id,name] of [['pcPosition','position'],['pcTap','tap'],['pcDrain','drain'],['pcTowel','towel']]){
  view.querySelector('#'+id)?.addEventListener('change',e=>{s[name]=e.target.value;refresh()});
 }
 view.querySelector('#pcGroup')?.addEventListener('change',e=>{s.group=e.target.value;s.color=m.COLORS[s.group][0];s.specialCode='';s.drain='none';refresh()});
 for(const [id,name] of [['pcLength','length'],['pcDepth','depth'],['pcHeight','height'],['pcBacksplash','backsplashHeight']])
  view.querySelector('#'+id)?.addEventListener('change',e=>{s[name]=e.target.value===''?NaN:Number(e.target.value);refresh()});
 view.querySelector('#pcSpecial')?.addEventListener('change',e=>{s.specialCode=e.target.value.trim();refresh()});
 view.querySelector('#pcBacksplashTap').onchange=e=>{s.backsplashTap=e.target.checked;refresh()};
 view.querySelector('#pcSupportsVisible').onchange=e=>{s.supportsVisible=e.target.checked;refresh()};
 view.querySelector('#pcOverflow').onchange=e=>{s.overflow=e.target.checked;refresh()};
 view.querySelector('#pcCut').onchange=e=>{s.specialCut=e.target.checked;refresh()};
 view.querySelector('#pcAdd')?.addEventListener('click',async()=>{
  const q=m.quote(s,g.variants||[]);if(!q.ok)return;
  const chosen=q.configuration,config={...chosen,type:'program-colour-2026',reference:q.reference,
   colorGroup:chosen.group,color:q.colour,material:'Kromat',finish:'Lisse',
   widthCm:Number(chosen.depth),lengthCm:Number(chosen.length),heightCm:Number(chosen.height),
   components:q.components};
  const item={manufacturer:'Hidrobox',collection:'Program Colour',category:'Plan vasque',
   reference:q.reference,base:q.reference,
   designation:'Program Colour '+chosen.basin+' · '+chosen.length+' × '+chosen.depth+' × '+chosen.height+
     ' cm · '+q.colour+(chosen.basin==='S42'?' · double vasque':''),
   material:'Kromat',finish:'Lisse · '+q.colour,price:q.price,totalPrice:q.price,rawTariffPrice:q.rawPrice,
   listPriceUpliftPct:4,purchaseDiscount:50,currency:'€',vat:'HT',source:q.source,sourceYear:2026,
   manufacturerUrl:'https://hidrobox.com/fr/collections/program-colour/',
   image:COLLECTION_IMAGE,imageSource:'Photo fabricant de collection Program Colour, coloris et implantation non contractuels',
   imageFinishMatch:'collection'};
  ctx.save(item,config);
 });
 return true;
}
return {programColour,reset};
});