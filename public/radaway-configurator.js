/* Hydropolis Radaway visual selection based on exact manufacturer page images, no fabricated prices. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroRadawayConfigurator=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const euro=n=>Number(n).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
 const types=['Angle','Walk-in','Porte de niche','Pare-baignoire'];
 const targets={
   'Angle':'https://konfigurator.radaway.eu/shower-enclosures',
   'Walk-in':'https://konfigurator.radaway.eu/walk-in',
   'Porte de niche':'https://konfigurator.radaway.eu/shower-doors',
   'Pare-baignoire':'https://konfigurator.radaway.eu/parawany-nawannowe'
 };
 const eligible=p=>p?.manufacturer==='Radaway';
 function open(rows,roomId,onAdd,initial=null){
  if(typeof document==='undefined'||typeof onAdd!=='function')return Promise.reject(Error('Interface Radaway indisponible'));
  rows=(rows?.length?rows:root.HydroRadawayCatalog?.rows||[]).filter(eligible);
  if(!rows.length)return Promise.reject(Error('Catalogue Radaway non chargé'));
  document.querySelector('.radaway-overlay')?.remove();
  const ov=document.createElement('div');ov.className='radaway-overlay';
  ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Configurateur Radaway');
  const css='.radaway-overlay{position:fixed;inset:0;z-index:999999;background:#000b;display:flex;align-items:center;justify-content:center;padding:15px;font:14px Arial,sans-serif;color:#222}' +
   '.radaway-shell{width:min(1250px,99vw);height:min(840px,96vh);display:flex;flex-direction:column;background:white;border-radius:12px;overflow:hidden}' +
   '.radaway-head{padding:18px 23px;color:white;background:#202020;display:flex;justify-content:space-between;align-items:center}' +
   '.radaway-head h2{font-size:24px;margin:4px 0}.radaway-head small{color:#ddd}.radaway-close{font-size:26px;color:white;border:0;background:transparent;cursor:pointer}' +
   '.radaway-columns{display:grid;grid-template-columns:156px minmax(0,1fr)355px;flex:1;min-height:0}' +
   '.radaway-types{border-right:1px solid #ddd;padding:12px;overflow:auto}' +
   '.radaway-types button{display:block;padding:13px;width:100%;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;text-align:left;background:white;cursor:pointer}' +
   '.radaway-types button.active,.radaway-model.active{border-color:#a36a33;background:#fff3e7}' +
   '.radaway-main{overflow:auto;padding:14px}.radaway-controls{display:flex;gap:10px;margin-bottom:12px}' +
   '.radaway-controls input,.radaway-controls select{padding:9px;min-width:0;border:1px solid #ccc;border-radius:5px;background:white;color:#222}' +
   '.radaway-controls input{flex:1}.radaway-controls select{width:145px}' +
   '.radaway-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}' +
   '.radaway-model{text-align:left;color:#222;padding:10px;background:white;border:1px solid #ddd;border-radius:8px;cursor:pointer}' +
   '.radaway-model img{display:block;width:100%;height:145px;object-fit:contain}' +
   '.radaway-model strong{display:block;margin-top:8px;font-size:13px}.radaway-model small{display:block;margin-top:5px;font-size:11px;color:#846037}' +
   '.radaway-detail{padding:17px;background:#fafafa;border-left:1px solid #ddd;overflow:auto}' +
   '.radaway-image{width:100%;height:205px;object-fit:contain;background:white;border:1px solid #eee;border-radius:7px}' +
   '.radaway-detail h3{font-size:16px;margin:12px 0}.radaway-detail p,.radaway-detail a{font-size:12px;line-height:1.5}' +
   '.radaway-fields{display:grid;grid-template-columns:1fr 1fr;gap:9px}' +
   '.radaway-fields label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:bold}' +
   '.radaway-fields input,.radaway-fields select{width:100%;padding:9px;box-sizing:border-box;color:#222;background:white;border:1px solid #ccc;border-radius:6px}' +
   '.radaway-fields .wide{grid-column:1/-1}.radaway-note{background:#fff5e7;border:1px solid #e6cda5;border-radius:7px;padding:10px;margin-top:9px;font-size:11px;line-height:1.5}' +
   '.radaway-add{background:#265849;color:#fff;border:0;width:100%;padding:14px;margin-top:12px;border-radius:6px;cursor:pointer}' +
   '.radaway-add:disabled{opacity:.5;cursor:default}.radaway-error{color:#a12b2b;min-height:18px}' +
   '@media(max-width:890px){.radaway-columns{grid-template-columns:105px minmax(0,1fr)}.radaway-detail{grid-column:1/-1;max-height:45vh}.radaway-shell{overflow:auto}}';
  ov.innerHTML='<style>'+css+'</style><div class="radaway-shell"><header class="radaway-head"><div><small>RADAWAY · VISUELS FABRICANT</small><h2>Configurer une paroi Radaway</h2><small>Catégorie → collection → modèle → dimensions et chiffrage</small></div><button class="radaway-close" type="button">×</button></header><div class="radaway-columns"><aside class="radaway-types"></aside><main class="radaway-main"><div class="radaway-controls"><select class="radaway-series"></select><input type="search" class="radaway-search" placeholder="Rechercher modèle ou finition"></div><div class="radaway-grid"></div></main><aside class="radaway-detail"></aside></div></div>';
  document.body.appendChild(ov);
  const $=s=>ov.querySelector(s),close=()=>ov.remove();
  $('.radaway-close').onclick=close;ov.addEventListener('click',e=>{if(e.target===ov)close()});
  let selected=rows.find(p=>p.reference===initial?.reference)||rows[0],type=selected.productType,series='',search='',busy=false;
  function renderType(){
   $('.radaway-types').innerHTML=types.map(t=>'<button type="button" class="'+(t===type?'active':'')+'" data-type="'+esc(t)+'">'+esc(t)+' <small>('+rows.filter(x=>x.productType===t).length+')</small></button>').join('');
   ov.querySelectorAll('[data-type]').forEach(btn=>btn.onclick=()=>{type=btn.dataset.type;selected=rows.find(x=>x.productType===type);series='';render()});
  }
  function renderGrid(){
   const listing=rows.filter(p=>p.productType===type);
   const seriesNames=[...new Set(listing.map(p=>p.collection))].sort((a,b)=>a.localeCompare(b,'fr'));
   $('.radaway-series').innerHTML='<option value="">Toutes les collections</option>'+seriesNames.map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join('');
   $('.radaway-series').value=series;
   $('.radaway-series').onchange=e=>{series=e.target.value;renderGrid()};
   $('.radaway-search').value=search;
   $('.radaway-search').oninput=e=>{search=e.target.value;renderGrid()};
   const shown=listing.filter(p=>(!series||p.collection===series)&&(!search||[p.designation,p.finish,p.collection].join(' ').toLowerCase().includes(search.toLowerCase())));
   $('.radaway-grid').innerHTML=shown.map(p=>'<button type="button" class="radaway-model '+(p.reference===selected?.reference?'active':'')+'" data-model="'+esc(p.reference)+'">'+
    '<img loading="lazy" src="'+esc(p.image)+'" alt="'+esc(p.designation)+'"><strong>'+esc(p.designation)+'</strong><small>'+esc(p.finish)+'</small></button>').join('')||'<p>Aucun modèle trouvé.</p>';
   ov.querySelectorAll('[data-model]').forEach(btn=>btn.onclick=()=>{selected=rows.find(p=>p.reference===btn.dataset.model);renderGrid();renderDetail()});
   ov.querySelectorAll('.radaway-model img').forEach(img=>img.onerror=()=>{img.style.display='none'});
  }
  function renderDetail(){
   if(!selected){$('.radaway-detail').textContent='Choisir un modèle.';return}
   const url=targets[selected.productType]||'https://konfigurator.radaway.eu/';
   $('.radaway-detail').innerHTML='<img class="radaway-image" src="'+esc(selected.image)+'" alt="'+esc(selected.designation)+'">'+
    '<h3>'+esc(selected.designation)+'</h3><p>Collection : <b>'+esc(selected.collection)+'</b><br>Finition du modèle photographié : <b>'+esc(selected.finish)+'</b></p>'+
    '<p><a target="_blank" rel="noopener noreferrer" href="'+esc(selected.manufacturerUrl)+'">Voir le produit sur radaway.fr</a><br>'+
    '<a target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">Ouvrir le configurateur officiel Radaway</a></p>'+
    '<div class="radaway-fields">'+
    '<label>Largeur (cm)<input class="radaway-width" type="number" min="30" max="350" step=".1" placeholder="À confirmer"></label>'+
    '<label>Hauteur (cm)<input class="radaway-height" type="number" min="50" max="350" step=".1" placeholder="À confirmer"></label>'+
    '<label>Sens d’ouverture<select class="radaway-side"><option>À confirmer</option><option>Gauche</option><option>Droite</option></select></label>'+
    '<label>Verre<input class="radaway-glass" placeholder="À confirmer"></label>'+
    '<label class="wide">Référence fabricant vérifiée<input class="radaway-sku" placeholder="Vide si devis non reçu"></label>'+
    '<label class="wide">Prix public HT vérifié (€)<input type="number" min="0" step=".01" class="radaway-price" placeholder="À chiffrer"></label>'+
    '</div><div class="radaway-note">Sans prix fabricant confirmé, la paroi sera ajoutée au projet <b>en attente de chiffrage</b> et masquée dans le dossier client. Les codes RAD-SÉLECTION sont uniquement des identifiants internes.</div>'+
    '<button class="radaway-add" type="button">Ajouter au projet</button><p class="radaway-error" aria-live="polite"></p>';
   const photo=$('.radaway-image');photo.onerror=()=>{photo.style.display='none';$('.radaway-error').textContent='Image officielle temporairement indisponible.'};
   $('.radaway-add').onclick=async()=>{
    if(busy)return;
    const input=$('.radaway-price').value.trim(),hasPrice=!!input,price=hasPrice?Number(input):0;
    const sku=$('.radaway-sku').value.trim();
    const w=$('.radaway-width').value.trim(),h=$('.radaway-height').value.trim();
    if(hasPrice&&(!Number.isFinite(price)||price<=0||!sku)){ $('.radaway-error').textContent='Pour un article chiffré, renseigner un prix HT positif et une référence fabricant.';return}
    if((w&&(!Number.isFinite(+w)||+w<30||+w>350))||(h&&(!Number.isFinite(+h)||+h<50||+h>350))){
     $('.radaway-error').textContent='Vérifier les dimensions saisies.';return;
    }
    const pending=!hasPrice;
    const record={...selected,reference:sku||selected.reference,manufacturerReference:sku,
     radawayInternalSelectionId:selected.reference,
     designation:selected.designation+(w?' · L '+w+' cm':'')+(h?' · H '+h+' cm':''),
     price,totalPrice:price,purchaseDiscount:undefined,
     pricingStatus:pending?'quote-required':'manufacturer-quote-manual',
     pricingSource:pending?'Radaway : devis à obtenir':'Chiffrage fabricant saisi manuellement',
     radawayPendingQuote:pending,hideFromDossier:pending,
     imageSource:'radaway.fr · photo du modèle et de sa finition',imageFinishMatch:'manufacturer-model',
     radawayConfiguration:{model:selected.designation,type:selected.productType,collection:selected.collection,finish:selected.finish,
      widthCm:w?Number(w):null,heightCm:h?Number(h):null,opening:$('.radaway-side').value,
      glass:$('.radaway-glass').value.trim()||'À confirmer',officialConfiguratorUrl:url,
      manufacturerPage:selected.manufacturerUrl,manufacturerSku:sku||null,priceVerified:!pending}};
    busy=true;$('.radaway-add').disabled=true;
    try{await onAdd(record,roomId);close()}catch(e){busy=false;$('.radaway-add').disabled=false;$('.radaway-error').textContent=e.message||String(e)}
   };
  }
  function render(){renderType();renderGrid();renderDetail()}
  render();return Promise.resolve(true);
 }
 return {open,eligible,targets};
});