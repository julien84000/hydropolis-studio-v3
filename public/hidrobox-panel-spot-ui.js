/* Hidrobox guided UI for manufacturer-priced Panneaux + Spot.
 * No generic image is labelled as an exact model image.
 * Data and options are from the French 2026 manufacturer price-list tables.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHidroboxPanelSpotUI=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const EUR=v=>Number(v).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
 let kind='',state=null;
 function reset(){kind='';state=null;}
 function init(next,ctx){
   if(next===kind&&state)return;
   kind=next;const old=ctx.original?.hidroboxConfiguration||{};
   if(next==='panel')state=old.type==='panels-2026'?{
    texture:old.finish||'Lisse',color:old.color||'Blanc',width:old.widthCm||80,length:old.lengthCm||120,
    extras:[...(old.accessories||[])]}:{texture:'Lisse',color:'Blanc',width:80,length:120,extras:[]};
   else state=old.type==='spot-2026'?{
     ref:old.reference||ctx.original.reference,color:old.color||'Blanc',extras:[...(old.accessories||[])]}:
    {ref:'WSPC0001',color:'Blanc',extras:[]};
 }
 function input(title,key,value,min,max){
  return '<label>'+E(title)+'<input class="hb-source-number" data-hb-source-input="'+key+
   '" type="number" min="'+min+'" max="'+max+'" step="1" value="'+E(value)+'"></label>';
 }
 function select(title,key,choices,value){
  return '<label>'+E(title)+'<select data-hb-source-select="'+key+'">'+choices.map(o=>
    '<option value="'+E(o)+'"'+(String(o)===String(value)?' selected':'')+'>'+E(o)+'</option>').join('')+'</select></label>';
 }
 function closeAndAdd(ctx,item,config){
  if(!ctx.save)throw Error('Enregistrement Hydropolis indisponible');
  ctx.save(item,config);
 }
 function shell(ctx,title,html){
  ctx.shell(title,html);
  const view=ctx.overlay();
  view.querySelector('.hidrobox-back')?.addEventListener('click',ctx.back);
  return view;
 }
 function panel(g,ctx){
  if(!root?.HydroHidroboxPanels2026)return false;
  init('panel',ctx);
  const m=root.HydroHidroboxPanels2026,s=state;
  const allowedColors=Object.values(m.COLORS).flat();
  if(!allowedColors.includes(s.color))s.color='Blanc';
  const q=m.quote({material:'Scene',texture:s.texture,color:s.color,width:Number(s.width),length:Number(s.length)},{accessories:s.extras});
  const textures=m.TEXTURES.map(t=>'<button type="button" data-hb-texture="'+E(t)+'" class="hidrobox-tray-model" aria-pressed="'+(s.texture===t)+'"><span class="hb-texture-sample hb-texture-'+E(t.toLowerCase())+'"></span><strong>'+E(t)+'</strong></button>').join('');
  const colors='<div class="hidrobox-fields">'+select('Couleur du panneau','color',allowedColors,s.color)+'</div>';
  const optionRows=Object.entries(m.extra).map(([ref,opt])=>
    '<label class="hb-source-option"><input type="checkbox" data-hb-extra="'+E(ref)+'"'+(s.extras.includes(ref)?' checked':'')+'>'+
    '<span>'+E(opt.label)+' · '+(opt.percent?'+'+opt.percent+' %':EUR(opt.rawPrice)+' HT source')+' <small>'+E(ref)+'</small></span></label>').join('');
  const hero=ctx.image?'<img src="'+E(ctx.image)+'" alt="Photographie de la collection Panneaux Hidrobox, illustrative">':'';
  const html='<button class="hidrobox-back" type="button">← Collections</button>'+
   '<div class="hidrobox-neo-hero">'+hero+'<div><h3>Panneaux muraux · tarif fabricant 2026</h3><p>Modèle panneau rectangulaire · Scene (matière fixe) · épaisseur constructeur 1 cm</p>'+
   '<small>Photographie de collection : texture et couleur exactes non garanties sur cette illustration.</small></div></div>'+
   '<h4 class="hidrobox-universal-subtitle">1 · Modèle</h4><p><strong>Panneau rectangulaire</strong> · découpe au cm dans la plage fabricant.</p>'+
   '<h4 class="hidrobox-universal-subtitle">2 · Matière</h4><div class="hidrobox-fixed-attribute"><strong>Scene</strong><span>Matière de ce tarif 2026</span></div>'+
   '<h4 class="hidrobox-universal-subtitle">3 · Texture</h4><div class="hidrobox-tray-model-grid">'+textures+'</div>'+
   '<h4 class="hidrobox-universal-subtitle">4 · Finition couleur</h4>'+colors+
   '<p class="hidrobox-guide-note">Blanc, Plus Colour Basics, Trends et Specials : la référence est choisie dans la colonne fabricant correspondante.</p>'+
   '<h4 class="hidrobox-universal-subtitle">5 · Dimensions réelles</h4><div class="hidrobox-fields">'+
   input('Largeur du panneau (cm)','width',s.width,70,120)+input('Longueur du panneau (cm)','length',s.length,80,240)+'</div>'+
   '<p class="hidrobox-guide-note">La tranche applicable est déterminée automatiquement et sans arrondi vers une dimension voisine.</p>'+
   '<h4 class="hidrobox-universal-subtitle">6 · Options et accessoires</h4><div class="hb-source-options">'+optionRows+'</div>'+
   '<p class="hidrobox-guide-note">Niches : implantation et faisabilité à confirmer par plan technique. Découpe spéciale : +10 % du panneau. Panel Box 2W/3W : remise conditionnelle à valider lors de la commande conjointe avec le receveur, non déduite automatiquement.</p>'+
   '<h4 class="hidrobox-universal-subtitle">7 · Référence et chiffrage</h4>'+
   (q.ok?'<table class="hp-breakdown"><thead><tr><th>Élément</th><th>Référence</th><th>Tarif HT source</th></tr></thead><tbody>'+
    q.components.map(c=>'<tr><td>'+E(c.label)+'</td><td>'+E(c.reference)+'</td><td>'+EUR(c.rawPrice)+'</td></tr>').join('')+
    '</tbody></table><p>Tranche : largeur '+E(q.width)+' cm × longueur '+E(q.length)+' cm.</p>':
    '<p role="alert">'+E(q.reason)+'</p>')+
   '<div class="hidrobox-result"><div><b>'+(q.ok?EUR(q.price)+' HT':'Prix indisponible')+'</b>'+
   '<span>Réf. '+E(q.reference||'—')+'</span><small>'+(q.ok?'Total du tarif source + 4 % une seule fois. Remise fournisseur de 50 % séparée.':'Aucun devis sans référence exacte.')+
   '</small></div><button id="huAdd" type="button" class="btn primary"'+(q.ok?'':' disabled')+'>Ajouter au projet</button></div>';
  const view=shell(ctx,'Panneaux muraux · configuration',html);
  const refresh=()=>panel(g,ctx);
  view.querySelectorAll('[data-hb-texture]').forEach(b=>b.onclick=()=>{s.texture=b.dataset.hbTexture;refresh()});
  view.querySelectorAll('[data-hb-source-input]').forEach(e=>e.onchange=()=>{s[e.dataset.hbSourceInput]=e.value===''?'':Number(e.value);refresh()});
  view.querySelector('[data-hb-source-select="color"]').onchange=e=>{s.color=e.target.value;refresh()};
  view.querySelectorAll('[data-hb-extra]').forEach(e=>e.onchange=()=>{s.extras=e.checked?[...new Set([...s.extras,e.dataset.hbExtra])]:s.extras.filter(x=>x!==e.dataset.hbExtra);refresh()});
  view.querySelector('#huAdd').onclick=()=>{
    const result=m.quote({material:'Scene',texture:s.texture,color:s.color,width:Number(s.width),length:Number(s.length)},{accessories:s.extras});
    if(!result.ok)return;
    const config={type:'panels-2026',reference:result.reference,widthCm:result.widthCm,lengthCm:result.lengthCm,
      material:'Scene',finish:result.finish,color:result.color,colorGroup:result.colorGroup,
      accessories:result.accessories,components:result.components};
    closeAndAdd(ctx,{manufacturer:'Hidrobox',collection:'Panneaux muraux',
      category:'Panneaux',reference:result.reference,base:result.reference,
      designation:'Panneau Scene · '+result.finish+' · '+result.color+' · '+result.widthCm+' × '+result.lengthCm+' cm'+
        (s.extras.length?' · options '+s.extras.join(', '):''),
      price:result.price,totalPrice:result.price,rawTariffPrice:result.rawPrice,
      purchaseDiscount:50,listPriceUpliftPct:4,currency:'€',vat:'HT',
      source:result.source,sourceYear:2026,manufacturerUrl:'https://hidrobox.com/fr/collections/paneles/',
      image:ctx.image||'',imageSource:'Image de collection Hidrobox · panneau illustratif, pas la configuration exacte',
      imageFinishMatch:'collection'},config);
  };
  return true;
 }
 function spot(g,ctx){
  if(!root?.HydroHidroboxSpot2026)return false;
  init('spot',ctx);
  const m=root.HydroHidroboxSpot2026,s=state;
  if(!m.byRef.has(s.ref))s.ref=m.rows[0].reference;
  const current=m.byRef.get(s.ref);
  const colors=m.COLORS[current.colorGroup];if(!colors.includes(s.color))s.color=colors[0];
  s.extras=s.extras.filter(x=>m.optionsFor(current).some(o=>o.reference===x));
  const q=m.quote({reference:s.ref,color:s.color},{accessories:s.extras});
  const models=[...new Set(m.rows.map(x=>x.model))].sort((a,b)=>Number(a.match(/\d+/)?.[0])-Number(b.match(/\d+/)?.[0]));
  const tiles=models.map(name=>{
    const first=m.rows.find(x=>x.model===name);
    const selected=name===current.model;
    const diameter=first.width===first.length;
    return '<button type="button" class="hidrobox-tray-model hb-spot-tile" data-hb-spot-model="'+E(name)+'" aria-pressed="'+selected+'">'+
      '<div class="hb-spot-diagram '+(diameter?'hb-spot-round':'')+'" aria-hidden="true"></div>'+
      '<strong>'+E(name)+'</strong><small>'+E(first.width+' × '+first.length+' × '+first.height+' cm')+'</small></button>';
  }).join('');
  const variant=m.rows.filter(x=>x.model===current.model);
  const optionRows=m.optionsFor(current).map(o=>
    '<label class="hb-source-option"><input type="checkbox" data-hb-extra="'+E(o.reference)+'"'+(s.extras.includes(o.reference)?' checked':'')+'>'+
    '<span>'+E(o.label)+' · '+EUR(o.rawPrice)+' <small>'+E(o.reference)+'</small></span></label>').join('');
  const html='<button type="button" class="hidrobox-back">← Collections</button>'+
    '<div class="hidrobox-neo-hero">'+(ctx.image?'<img src="'+E(ctx.image)+'" alt="Photographie illustrative de la collection Spot">':'')+
    '<div><h3>Spot · modèles distincts</h3><p>Choisissez le modèle, puis sa matière, sa couleur et ses accessoires.</p>'+
    '<small>Les dessins des cartes indiquent le format, pas la forme exacte du fabricant. Photographies par modèle uniquement après association certifiée.</small></div></div>'+
    '<h4 class="hidrobox-universal-subtitle">1 · Modèle</h4><div class="hidrobox-tray-model-grid hb-spot-grid">'+tiles+'</div>'+
    '<h4 class="hidrobox-universal-subtitle">2 · Matière et finition</h4><div class="hidrobox-fields">'+
       select('Version du modèle','ref',variant.map(x=>x.reference),s.ref)+
       '<div class="hidrobox-fixed-attribute"><strong>'+E(current.material)+'</strong><span>Texture Lisse</span></div></div>'+
    '<h4 class="hidrobox-universal-subtitle">3 · Couleur</h4><div class="hidrobox-fields">'+select('Couleur','color',colors,s.color)+'</div>'+
    '<h4 class="hidrobox-universal-subtitle">4 · Dimensions fabricant</h4><p>'+E(current.width+' × '+current.length+' × '+current.height)+' cm · modèle '+E(current.model)+'. Dimensions fixes correspondant à la référence choisie.</p>'+
    '<h4 class="hidrobox-universal-subtitle">5 · Bondes, perçages et couleurs extérieures</h4><div class="hb-source-options">'+optionRows+'</div>'+
    '<h4 class="hidrobox-universal-subtitle">6 · Références et chiffrage</h4>'+
    (q.ok?'<table class="hp-breakdown"><thead><tr><th>Élément</th><th>Référence</th><th>Prix HT source</th></tr></thead><tbody>'+
    q.components.map(c=>'<tr><td>'+E(c.label)+'</td><td>'+E(c.reference)+'</td><td>'+EUR(c.rawPrice)+'</td></tr>').join('')+'</tbody></table>':
      '<p role="alert">'+E(q.reason)+'</p>')+
    '<div class="hidrobox-result"><div><b>'+(q.ok?EUR(q.price)+' HT':'Prix indisponible')+'</b><span>Réf. '+E(q.reference||'—')+
    '</span><small>Référence exacte du tarif Spot 2026 ; majoration de 4 % appliquée une seule fois.</small></div>'+
    '<button class="btn primary" id="huAdd" type="button"'+(q.ok?'':' disabled')+'>Ajouter au projet</button></div>';
  const view=shell(ctx,'Spot · modèles et tarifs',html),refresh=()=>spot(g,ctx);
  view.querySelectorAll('[data-hb-spot-model]').forEach(b=>b.onclick=()=>{
    const row=m.rows.find(x=>x.model===b.dataset.hbSpotModel);
    if(!row)return;s.ref=row.reference;s.color=m.COLORS[row.colorGroup][0];s.extras=[];refresh();
  });
  view.querySelector('[data-hb-source-select="ref"]').onchange=e=>{s.ref=e.target.value;s.color=m.COLORS[m.byRef.get(s.ref).colorGroup][0];s.extras=[];refresh()};
  view.querySelector('[data-hb-source-select="color"]').onchange=e=>{s.color=e.target.value;refresh()};
  view.querySelectorAll('[data-hb-extra]').forEach(e=>e.onchange=()=>{s.extras=e.checked?[...new Set([...s.extras,e.dataset.hbExtra])]:s.extras.filter(x=>x!==e.dataset.hbExtra);refresh()});
  view.querySelector('#huAdd').onclick=()=>{
    const result=m.quote({reference:s.ref,color:s.color},{accessories:s.extras});if(!result.ok)return;
    const config={type:'spot-2026',reference:result.reference,model:result.model,material:result.material,
      finish:'Lisse',colorGroup:result.colorGroup,color:result.color,widthCm:result.width,lengthCm:result.length,
      heightCm:result.height,accessories:result.accessories,components:result.components};
    closeAndAdd(ctx,{manufacturer:'Hidrobox',collection:'Spot',category:'Vasque à poser',
      reference:result.reference,base:result.reference,
      designation:result.model+' · '+result.material+' · Lisse · '+result.color+' · '+
        result.width+' × '+result.length+' × '+result.height+' cm',
      price:result.price,totalPrice:result.price,rawTariffPrice:result.rawPrice,
      listPriceUpliftPct:4,purchaseDiscount:50,currency:'€',vat:'HT',
      source:'HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf',sourceYear:2026,
      manufacturerUrl:'https://hidrobox.com/fr/collections/spot/',
      image:'',imageSource:'Photographie spécifique du modèle non vérifiée ; aucune photo de collection présentée comme exacte',
      imageFinishMatch:'unavailable'},config);
  };
  return true;
 }
 return {panel,spot,reset};
});
