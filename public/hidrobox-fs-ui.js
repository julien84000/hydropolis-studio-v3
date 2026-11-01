/* Hidrobox FS · interactive model → material → texture → colour → size.
 * Every actionable price and reference comes from imported 2026 manufacturer SKUs.
 */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroHidroboxFSUI=api;})(typeof window==='object'?window:null,function(root){
'use strict';
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EUR=n=>Number(n).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
let state=null,groupKey='';
function reset(){state=null;groupKey='';}
function fs(g,ctx){
 const m=root.HydroHidroboxFS2026;if(!m)return false;
 const rows=m.available(g.variants||[]);
 if(!rows.length){ctx.shell('FS · tarif indisponible','<p role="alert">Aucune correspondance des références FS avec le tarif importé. Aucun prix inventé.</p>');return true;}
 if(!state||groupKey!==g.id){
   groupKey=g.id;const old=ctx.original?.hidroboxConfiguration||{};
   const existing=old.type==='fs-2026'&&rows.find(r=>r.reference===old.reference);
   const first=existing||rows[0];
   state={ref:first.reference,color:old.type==='fs-2026'?old.color:m.COLORS[first.colorGroup][0],code:old.colorCode||'',
     exterior:old.type==='fs-2026'?(old.exterior||'none'):'none',exteriorColor:old.exteriorColor||'Blush',exteriorCode:old.exteriorCode||''};
 }
 const s=state;
 if(!rows.some(r=>r.reference===s.ref))s.ref=rows[0].reference;
 const selected=rows.find(r=>r.reference===s.ref);
 if(!m.COLORS[selected.colorGroup].includes(s.color))s.color=m.COLORS[selected.colorGroup][0];
 const q=m.quote(g.variants,{reference:s.ref,color:s.color,code:s.code,
    exterior:s.exterior,exteriorColor:s.exteriorColor,exteriorCode:s.exteriorCode});
 const names=m.names(rows);
 const materialRows=rows.filter(r=>r.model===selected.model);
 const materials=[...new Set(materialRows.map(r=>r.material))];
 const groupRows=materialRows.filter(r=>r.material===selected.material);
 const uniqueGroups=[...new Set(groupRows.map(r=>r.colorGroup))];
 const svg=root.HydroHidroboxOfficialMinis2026?.get('fs',selected.thumbnail)||'';
 const palette=root.HydroProgramColour2026?.SWATCHES||{};
 const swatches='<div class="hb-fs-swatches hb-pc-palette" role="group" aria-label="Teinte Hidrobox">'+
   m.COLORS[selected.colorGroup].map(c=>'<button type="button" class="hb-fs-swatch hb-pc-swatch" data-fs-color="'+E(c)+'" aria-pressed="'+(s.color===c)+'">'+
     '<span class="hb-pc-colour" style="background:'+E(c==='Blanc'?'#FFFFFF':palette[c]||'#dddddd')+'" aria-hidden="true"></span>'+
     '<strong>'+E(c)+'</strong></button>').join('')+'</div>';
 const icon=name=>{const v=rows.find(r=>r.model===name);return root.HydroHidroboxOfficialMinis2026?.get('fs',v?.thumbnail)||'';};
 const cards=names.map(name=>'<button type="button" class="hb-fs-model-card" data-fs-model="'+E(name)+'" aria-pressed="'+(selected.model===name)+'">'+
   '<span class="hb-fs-icon" aria-hidden="true">'+icon(name)+'</span><strong>'+E(name)+'</strong><small>'+E(rows.find(r=>r.model===name)?.length||'')+' cm · '+E(rows.find(r=>r.model===name)?.material||'')+'</small></button>').join('');
 const materialCards=materials.map(material=>'<button type="button" class="hb-fs-axis-choice" data-fs-material="'+E(material)+'" aria-pressed="'+(selected.material===material)+'">'+
   '<strong>'+E(material)+'</strong><small>'+(material==='Scene'?'Solid Surface · Blanc':'Kromat · couleurs fabricant')+'</small></button>').join('');
 const tiers=uniqueGroups.map(code=>'<button type="button" class="hb-fs-axis-choice" data-fs-group="'+E(code)+'" aria-pressed="'+(selected.colorGroup===code)+'"><strong>'+
   ({BLA:'Blanc',BAS:'Basics',TRE:'Trends',SPE:'Special RAL / NCS'}[code]||code)+'</strong><small>Tarif '+E(code)+'</small></button>').join('');
 const fallbackSvg=svg?'<div class="hb-fs-preview-svg">'+svg+'</div>':'<p>Schéma constructeur indisponible.</p>';
 const configuredColor=selected.material==='Scene'&&s.exterior!=='none'?
   (s.exterior==='special'?'':s.exteriorColor):s.color;
 const spec=m.spec(selected,configuredColor);
 const exteriorOptions=selected.material==='Scene'?'<h4 class="hidrobox-universal-subtitle">Couleur extérieure du lavabo Scene</h4>'+
   '<div class="hb-fs-axis-grid">'+
    [['none','Blanc extérieur · sans option'],['standard','Basics / Trends · +492 € HT source'],['special','Special RAL / NCS · +564 € HT source']].map(([id,label])=>
      '<button type="button" class="hb-fs-axis-choice" data-fs-exterior="'+id+'" aria-pressed="'+(s.exterior===id)+'"><strong>'+E(label)+'</strong></button>').join('')+
   '</div>'+
   (s.exterior==='standard'?'<label class="hb-fs-code-label">Teinte extérieure Basics / Trends<select id="hbFsExteriorColor">'+
     [...m.COLORS.BAS,...m.COLORS.TRE].map(c=>'<option value="'+E(c)+'"'+(s.exteriorColor===c?' selected':'')+'>'+E(c)+'</option>').join('')+'</select></label>':'')+
   (s.exterior==='special'?'<label class="hb-fs-code-label">Teinte extérieure RAL / NCS<input id="hbFsExteriorCode" type="text" placeholder="RAL 9010" value="'+E(s.exteriorCode)+'"></label>':'')+
   '<p class="hidrobox-guide-note">La couleur extérieure est une option indépendante de la référence blanche Scene. La coloration Kromat intégrale est déjà comprise dans son tarif BAS/TRE/SPE.</p>':'';
 const html='<button class="hidrobox-back" type="button">← Collections</button>'+
   '<div class="hidrobox-neo-hero hb-fs-hero"><div class="hb-fs-configured-image">'+fallbackSvg+
     '<img data-hb-config-image hidden alt="Visuel officiel du modèle FS configuré">'+
     '<p data-hb-config-status>Schéma officiel du modèle '+E(selected.model)+' · photo par matière et teinte recherchée.</p></div>'+
     '<div><h3>FS · lavabos sur pied</h3><p>Choisissez votre forme, puis la matière, la texture et la couleur. La référence et le prix suivent exactement le tarif fabricant.</p>'+
     '<a href="https://hidrobox.com/fr/collections/fs/" target="_blank" rel="noopener noreferrer">Fiche collection FS</a>'+
     '<small>Les modèles R/L restent distincts pour la commande ; une photo constructeur ne prouve pas systématiquement son orientation.</small></div></div>'+
   '<h4 class="hidrobox-universal-subtitle">1 · Forme de vasque FS</h4><div class="hb-fs-model-grid">'+cards+'</div>'+
   '<h4 class="hidrobox-universal-subtitle">2 · Matière</h4><div class="hb-fs-axis-grid">'+materialCards+'</div>'+
   '<p class="hidrobox-guide-note">Kromat coloré : uniquement FS 19 et FS 23 selon les références WFSC du tarif France 2026. Les autres FS sont en Scene blanc ; leurs teintes extérieures sont une option distincte.</p>'+
   '<h4 class="hidrobox-universal-subtitle">3 · Texture</h4><div class="hidrobox-fixed-attribute"><strong>Lisse</strong><span>Texture constructeur FS</span></div>'+
   '<h4 class="hidrobox-universal-subtitle">4 · Couleur</h4><div class="hb-fs-axis-grid">'+tiers+'</div>'+swatches+
   (selected.colorGroup==='SPE'?'<label class="hb-fs-code-label">Référence couleur exacte RAL / NCS<input type="text" id="hbFsSpecialCode" placeholder="RAL 9001 ou NCS S 0500-N" value="'+E(s.code)+'"></label>':'')+
   exteriorOptions+
   '<h4 class="hidrobox-universal-subtitle">5 · Dimensions</h4><p>'+E(selected.width+' × '+selected.length+' × '+selected.height)+' cm · format fabricant fixe pour '+E(selected.model)+'.</p>'+
   '<h4 class="hidrobox-universal-subtitle">6 · Référence et tarification</h4>'+
   (q.ok?'<div class="hidrobox-fixed-attribute"><strong>Réf. '+E(q.reference)+'</strong><span>'+E(q.model+' · '+q.material+' · '+(q.colorCode||q.color))+' · fournisseur '+EUR(q.rawPrice)+' HT</span></div>':
     '<p role="alert">'+E(q.reason)+'</p>')+
   '<div class="hidrobox-result"><div><b>'+(q.ok?EUR(q.price)+' HT':'Prix non disponible')+'</b>'+
   (q.ok&&q.components.length>1?'<small>Options : '+q.components.slice(1).map(c=>E(c.label)+' · '+EUR(c.rawPrice)).join(', ')+'</small>':'')+
   '<small>Tarif source +4 % une seule fois · remise d’achat 50 % distincte.</small></div>'+
   '<button type="button" class="btn primary" id="huAdd"'+(q.ok?'':' disabled')+'>Ajouter au projet</button></div>';
 ctx.shell('FS · formes et matières',html);
 const view=ctx.overlay();view.querySelector('.hidrobox-back')?.addEventListener('click',ctx.back);
 const official=root.HydroHidroboxOfficialVisual;
 if(spec&&official?.preview)void official.preview(view,spec);
 const refresh=()=>fs(g,ctx);
 view.querySelectorAll('[data-fs-model]').forEach(b=>b.onclick=()=>{const v=rows.find(r=>r.model===b.dataset.fsModel);if(v){s.ref=v.reference;s.color=m.COLORS[v.colorGroup][0];s.code='';refresh()}});
 view.querySelectorAll('[data-fs-material]').forEach(b=>b.onclick=()=>{const v=materialRows.find(r=>r.material===b.dataset.fsMaterial);if(v){s.ref=v.reference;s.color=m.COLORS[v.colorGroup][0];s.code='';refresh()}});
 view.querySelectorAll('[data-fs-group]').forEach(b=>b.onclick=()=>{const v=groupRows.find(r=>r.colorGroup===b.dataset.fsGroup);if(v){s.ref=v.reference;s.color=m.COLORS[v.colorGroup][0];s.code='';refresh()}});
 view.querySelectorAll('[data-fs-color]').forEach(b=>b.onclick=()=>{s.color=b.dataset.fsColor;refresh()});
 view.querySelector('#hbFsSpecialCode')?.addEventListener('change',e=>{s.code=e.target.value.trim();refresh()});
 view.querySelectorAll('[data-fs-exterior]').forEach(b=>b.onclick=()=>{s.exterior=b.dataset.fsExterior;refresh()});
 view.querySelector('#hbFsExteriorColor')?.addEventListener('change',e=>{s.exteriorColor=e.target.value;refresh()});
 view.querySelector('#hbFsExteriorCode')?.addEventListener('change',e=>{s.exteriorCode=e.target.value.trim();refresh()});
 view.querySelector('#huAdd')?.addEventListener('click',async()=>{
   const result=m.quote(g.variants,{reference:s.ref,color:s.color,code:s.code,
     exterior:s.exterior,exteriorColor:s.exteriorColor,exteriorCode:s.exteriorCode});if(!result.ok)return;
   const btn=view.querySelector('#huAdd');if(btn){btn.disabled=true;btn.textContent='Vérification photo fabricant…';}
   const config={type:'fs-2026',reference:result.reference,model:result.model,material:result.material,finish:'Lisse',
      colorGroup:result.colorGroup,color:result.color,colorCode:result.colorCode,
      exterior:result.exterior,exteriorColor:result.exteriorColor,
      exteriorCode:result.exterior==='special'?result.exteriorColor:'',
      components:result.components,widthCm:result.width,lengthCm:result.length,
      heightCm:result.height};
   const item={manufacturer:'Hidrobox',collection:'FS',category:'Vasque sur pied',
     reference:result.reference,base:result.reference,designation:result.model+' · '+result.material+' · '+(result.colorCode||result.color)+
      (result.exterior!=='none'?' · extérieur '+result.exteriorColor:'')+
      ' · '+result.width+' × '+result.length+' × '+result.height+' cm',
     price:result.price,totalPrice:result.price,rawTariffPrice:result.rawPrice,purchaseDiscount:50,listPriceUpliftPct:4,
     currency:'€',vat:'HT',source:result.source,sourceYear:2026,
     manufacturerUrl:'https://hidrobox.com/fr/collections/fs/',
     image:ctx.image||'',imageSource:ctx.image?'Photo de collection FS, non contractuelle':'Photographie exacte indisponible',
     imageFinishMatch:ctx.image?'collection':'unavailable'};
   const selectedSpec=m.spec(result,result.material==='Scene'&&result.exterior!=='none'?
      (result.exterior==='special'?'':result.exteriorColor):result.color);
   if(selectedSpec&&official?.lookup&&official?.printQuality&&official?.apply){
     try{const picture=await official.lookup(selectedSpec),quality=await official.printQuality(picture);
       if(picture?.ok&&quality.ok){official.apply(item,{...picture,verifiedPrintQuality:true,width:quality.width,height:quality.height},selectedSpec);
         Object.assign(config,item.hidroboxConfiguration||{});}
     }catch(err){item.imageNote='Photo fabricant non certifiée : '+String(err?.message||err).slice(0,100);}
   }
   ctx.save(item,config);
 });
 return true;
}
return {fs,reset};
});