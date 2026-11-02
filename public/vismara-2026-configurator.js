/* Vismaravetro 2026: price-matrix configurator with explicit manual review for unindexed pages. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroVismara2026=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 let tariffPromise;
 const $esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const euro=n=>Number(n||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const uniq=a=>[...new Set(a)];
 function load(){
  if(!tariffPromise)tariffPromise=fetch('/vismara_tariff_2026.json',{credentials:'same-origin'})
   .then(r=>{if(!r.ok)throw Error('Tarif 2026 inaccessible (HTTP '+r.status+')');return r.json()})
   .then(d=>{if(!Array.isArray(d.pages)||!d.pages.length)throw Error('Pages du tarif indisponibles');return d})
   .catch(e=>{tariffPromise=null;throw e});
  return tariffPromise;
 }
 function rangeKey(r){return JSON.stringify([r.type,r.range]);}
 function matches(page,key,profile,glass){
  return (page?.matrix||[]).filter(r=>rangeKey(r)===key&&r.profiles.includes(profile)&&r.glasses.includes(glass));
 }
 function prices(page,key,profile,glass){return uniq(matches(page,key,profile,glass).map(r=>Number(r.price)).filter(x=>Number.isFinite(x)&&x>0));}
 function choosePricing(page,key,profile,glass,selectedPrice){
  if(!page)return {ok:false,reason:'Aucun modèle'};
  if(!page.matrix.length)return {ok:false,manual:true,reason:'Correspondance tarifaire manuelle obligatoire'};
  const values=prices(page,key,profile,glass);
  if(!values.length)return {ok:false,reason:'Aucune combinaison tarifée pour cette finition et ce verre'};
  if(values.length>1&&(!Number.isFinite(selectedPrice)||!values.includes(selectedPrice)))
   return {ok:false,ambiguous:true,prices:values,reason:'Plusieurs tarifs possibles : sélectionner la ligne exacte dans le tarif'};
  return {ok:true,price:values.length===1?values[0]:selectedPrice,ambiguous:values.length>1,prices:values};
 }
 async function open(source,roomId,save){
  if(typeof document==='undefined'||typeof save!=='function')throw Error('Configurateur Vismaravetro indisponible');
  const data=await load();
  document.getElementById('vismaraTariffModal')?.remove();
  const ov=document.createElement('div');ov.id='vismaraTariffModal';ov.className='v1153-overlay vismara-2026-overlay';
  ov.innerHTML='<style>'+
   '.vismara-2026-overlay .v1153-modal{max-width:1160px;width:min(96vw,1160px)}'+
   '.vismara-2026-overlay .vismara-layout{display:grid;grid-template-columns:minmax(0,1fr)330px;gap:18px;padding:15px;max-height:70vh;overflow:auto}'+
   '.vismara-2026-overlay .vismara-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}'+
   '.vismara-2026-overlay label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:600}'+
   '.vismara-2026-overlay select,.vismara-2026-overlay input{width:100%;min-width:0;padding:9px;border:1px solid #ccc;border-radius:5px;background:#fff;color:#222;font:inherit}'+
   '.vismara-2026-overlay .vismara-photo img{display:block;width:100%;max-height:255px;object-fit:contain;background:#fff}'+
   '.vismara-2026-overlay .vismara-photo{background:#f8f8f8;border-radius:8px;padding:10px;text-align:center}'+
   '.vismara-2026-overlay .vismara-photo small{font-size:11px;color:#666}'+
   '.vismara-2026-overlay .vismara-price-panel{background:#f6f3ed;padding:12px;border-radius:8px;margin:12px 0}'+
   '.vismara-2026-overlay .vismara-price-panel strong{display:block;font-size:20px;margin-top:5px}'+
   '.vismara-2026-overlay .vismara-advisory{font-size:12px;color:#795627;line-height:1.5}'+
   '.vismara-2026-overlay .vismara-manual{border:1px solid #c39c6b;padding:12px;border-radius:8px;background:#fff8ed}'+
   '.vismara-2026-overlay .vismara-manual p{font-size:12px}'+
   '.vismara-2026-overlay .vismara-check{display:flex;flex-direction:row;align-items:center;gap:9px}'+
   '.vismara-2026-overlay .vismara-check input{width:auto}'+
   '.vismara-2026-overlay .vismara-error{color:#9d2525;font-size:12px;min-height:16px;margin:9px}'+
   '@media(max-width:800px){.vismara-2026-overlay .vismara-layout{grid-template-columns:1fr}.vismara-2026-overlay .vismara-photo{order:-1}}'+
   '</style>'+
   '<div class="v1153-modal vismara-modal" role="dialog" aria-modal="true" aria-label="Configurateur Vismaravetro">'+
   '<header><div><div class="eyebrow">VISMARAVETRO · TARIF 2026</div><h2>Configurer une paroi</h2><p>Collection → modèle → dimensions → profil → verre</p></div><button type="button" class="icon vismara-close" aria-label="Fermer">×</button></header>'+
   '<div class="vismara-layout"><section><div class="vismara-fields">'+
   '<label>Collection<select class="v-col"></select></label><label>Modèle<select class="v-model"></select></label>'+
   '<label>Dimensions et type<select class="v-range"></select></label><label>Profil<select class="v-profile"></select></label>'+
   '<label>Verre<select class="v-glass"></select></label><label>Dimensions exactes et sens<input class="v-dims" placeholder="Largeur × hauteur, ouverture gauche/droite"></label>'+
   '<label>Suppléments HT vérifiés<input class="v-extras" type="number" min="0" step=".01" value="0"></label>'+
   '<label>Libellé des suppléments<input class="v-extras-label" placeholder="Motif et référence tarifaire"></label>'+
   '</div><div class="v-manual-wrap"></div><div class="v-price vismara-price-panel" aria-live="polite"></div>'+
   '<p class="vismara-advisory">Prix public HT issu de la grille fabricant 2026. Les références de plages de dimensions ne constituent pas toujours une référence complète de commande.</p></section>'+
   '<aside><div class="vismara-photo"></div><p class="vismara-advisory">Photo d’ambiance officielle de la collection : elle ne garantit pas le modèle, le verre ou la finition exacts.</p>'+
   '<a class="vismara-official-link" target="_blank" rel="noopener noreferrer">Voir la collection chez Vismaravetro</a></aside></div>'+
   '<div class="vismara-error" aria-live="polite"></div><footer><button type="button" class="btn ghost vismara-close">Annuler</button><button type="button" class="btn primary v-add" disabled>Ajouter cet article au projet</button></footer></div>';
  document.body.appendChild(ov);
  const $=s=>ov.querySelector(s);
  ov.querySelectorAll('.vismara-close').forEach(el=>el.onclick=()=>ov.remove());
  const cols=uniq(data.pages.map(p=>p.collection));
  const initial=cols.find(c=>norm(c)===norm(source?.collection))||cols[0];
  let page=null,selectedPrice=null,manualConfirmed=false;
  const chooser=(selector,values,labelFn)=>{
   $(selector).innerHTML=values.map(v=>'<option value="'+$esc(v)+'">'+$esc(labelFn?labelFn(v):v)+'</option>').join('');
   $(selector).disabled=values.length===0;
  };
  function updatePhoto(){
   const col=$('.v-col').value;
   const image=root.HydroVismaraPhotos?.get?.(col)||'';
   const host=$('.vismara-photo');
   host.innerHTML=image?'<img src="'+$esc(image)+'" alt="Collection '+$esc(col)+'" loading="lazy"><small>Visuel officiel de la collection '+$esc(col)+'</small>':
    '<p>Photo collection indisponible</p>';
   const img=host.querySelector('img');
   if(img)img.onerror=()=>{host.textContent='Image indisponible. Consulter la fiche fabricant.'};
   const refs={'serie 7200':'VIS-SERIE-7200','frame':'VIS-FRAME','smack':'VIS-SMACK','supersintesi':'VIS-SUPERSINTESI',
    'serie 8000':'VIS-SERIE-8000','sk-in':'VIS-SK-IN','link':'VIS-LINK','gliss':'VIS-GLISS','flare 2.0':'VIS-FLARE-2-0',
    'linea':'VIS-LINEA','replay':'VIS-REPLAY','sintesi':'VIS-SINTESI','junior':'VIS-JUNIOR','serie f':'VIS-SERIE-F'};
   const urls={'frame':'https://www.vismaravetro.it/en/collection/fixed-shower-enclosure-framed-Frame'};
   const url=col===norm(source?.collection)&&source?.manufacturerUrl?source.manufacturerUrl:urls[col]||
    'https://www.vismaravetro.it/en/shower-enclosure-collections';
   $('.vismara-official-link').href=url;
  }
  const rows=()=>page?.matrix||[];
  const keyed=()=>rows().filter(r=>rangeKey(r)===$('.v-range').value);
  function priceState(){
   const extra=Number($('.v-extras').value);
   const detail=$('.v-extras-label').value.trim(),dims=$('.v-dims').value.trim();
   const manual=!!page&&!rows().length;
   const selected=manual?Number($('.v-cell').value):NaN;
   const condition=manual?{ok:!!$('.v-cell').value&&Number.isFinite(selected)&&selected>0,
      price:selected,manual:true,reason:'Sélection de prix et vérification manuelle requises'}:
     choosePricing(page,$('.v-range').value,$('.v-profile').value,$('.v-glass').value,selectedPrice);
   const ready=condition.ok&&Number.isFinite(extra)&&extra>=0&&(!extra||!!detail)&&
     (manual?(!!$('.v-manual-ref').value.trim()&&!!dims&&$('.v-verified').checked):
      ($('.v-range').value?(!$('.v-range').value.startsWith('["Sur mesure"')||!!dims):false))&&
      (!condition.ambiguous||$('.v-ambiguous-verified')?.checked);
   $('.v-add').disabled=!ready;
   const amount=condition.ok?Number(condition.price)+extra:null;
   $('.v-price').innerHTML=amount===null?'<strong>Prix indisponible</strong><small>'+$esc(condition.reason||'Compléter les choix')+'</small>':
      '<span>Prix public HT</span><strong>'+euro(amount)+'</strong><small>Coût fournisseur estimé à −50 % : '+euro(amount*.5)+' HT</small>';
   return {ready,amount,base:condition.price,manual,ambiguous:condition.ambiguous,reason:condition.reason||'',dims,detail,extra};
  }
  function renderManual(){
   const host=$('.v-manual-wrap');host.innerHTML='';
   if(!page)return;
   if(!rows().length){
    const cells=page.cells||[];
    const select=['<option value="">Choisir une cellule du tarif source</option>'].concat(cells.map((c,i)=>
     '<option value="'+$esc(c.value)+'">Case '+(i+1)+' · '+$esc(c.label)+' €</option>')).join('');
    host.innerHTML='<div class="vismara-manual"><h4>Tarif sans correspondance automatique — page '+$esc(page.printedPage)+'</h4>'+
      '<p>Choisissez le prix relevé dans votre tableau tarifaire, puis confirmez son association à la référence, au profil et au verre. Aucun prix n’est déduit automatiquement.</p>'+
      '<label>Prix extrait du tarif<select class="v-cell">'+select+'</select></label>'+
      '<label>Référence de commande vérifiée<input class="v-manual-ref" placeholder="Référence exacte vérifiée"></label>'+
      '<label>Profil et verre exacts<input class="v-manual-finish" placeholder="Codes fabricant"></label>'+
      '<label class="vismara-check"><input type="checkbox" class="v-verified">J’ai vérifié la ligne et le prix sur la page tarifaire</label></div>';
    host.querySelectorAll('select,input').forEach(el=>el.addEventListener('input',priceState));
   }else {
    const vals=prices(page,$('.v-range').value,$('.v-profile').value,$('.v-glass').value);
    if(vals.length>1){
     const options='<option value="">Choisir le tarif correspondant</option>'+vals.map(v=>'<option value="'+v+'">'+euro(v)+' HT</option>').join('');
     host.innerHTML='<div class="vismara-manual"><strong>Plusieurs tarifs pour cette combinaison</strong>'+
      '<p>Le tableau comporte des prix distincts pour les mêmes codes. Vérifiez la ligne et choisissez le bon tarif.</p>'+
      '<label>Tarif<select class="v-ambiguity">'+options+'</select></label>'+
      '<label class="vismara-check"><input class="v-ambiguous-verified" type="checkbox">Ligne vérifiée dans le tarif</label></div>';
     $('.v-ambiguity').onchange=e=>{selectedPrice=e.target.value?Number(e.target.value):null;priceState()};
     $('.v-ambiguous-verified').onchange=priceState;
    }
   }
   priceState();
  }
  function onGlass(){selectedPrice=null;renderManual()}
  function onProfile(){
   chooser('.v-glass',uniq(keyed().filter(r=>r.profiles.includes($('.v-profile').value)).flatMap(r=>r.glasses)),
     v=>v+' · '+(data.glassLabels?.[v]||''));
   onGlass();
  }
  function onRange(){
   chooser('.v-profile',uniq(keyed().flatMap(r=>r.profiles)),v=>v+' · '+(data.profileLabels?.[v]||''));
   onProfile();
  }
  function onModel(){
   page=data.pages.find(p=>String(p.pdfPage)===$('.v-model').value)||null;selectedPrice=null;
   if(!page)return;
   const groups=uniq(rows().map(rangeKey));
   chooser('.v-range',groups,v=>{const a=JSON.parse(v);return a[0]+' · '+a[1]});
   $('.v-range').hidden=!groups.length;
   $('.v-profile').hidden=!groups.length;$('.v-glass').hidden=!groups.length;
   $('.v-dims').value='';$('.v-extras').value='0';$('.v-extras-label').value='';
   onRange();renderManual();
  }
  function onCollection(){
   updatePhoto();
   const ps=data.pages.filter(p=>p.collection===$('.v-col').value);
   chooser('.v-model',ps.map(p=>String(p.pdfPage)),v=>{const p=ps.find(x=>String(x.pdfPage)===v);return p.model+' · p. '+p.printedPage});
   onModel();
  }
  chooser('.v-col',cols);
  $('.v-col').value=initial;
  $('.v-col').onchange=onCollection;
  $('.v-model').onchange=onModel;
  $('.v-range').onchange=onRange;
  $('.v-profile').onchange=onProfile;
  $('.v-glass').onchange=onGlass;
  for(const sel of ['.v-dims','.v-extras','.v-extras-label'])$(sel).addEventListener('input',priceState);
  onCollection();
  $('.v-add').onclick=()=>{
   const q=priceState();
   if(!q.ready||!page){$('.vismara-error').textContent='Compléter les données et confirmer le tarif avant ajout.';return}
   const key=$('.v-range').value;
   const pair=q.manual?null:JSON.parse(key);
   const ref=q.manual?$('.v-manual-ref').value.trim():pair[1];
   const finish=q.manual?$('.v-manual-finish').value.trim():
     $('.v-profile').value+' '+(data.profileLabels?.[$('.v-profile').value]||'')+' · '+
     $('.v-glass').value+' '+(data.glassLabels?.[$('.v-glass').value]||'');
   if(!ref||!finish){$('.vismara-error').textContent='Référence, profil et verre obligatoires.';return}
   const photo=root.HydroVismaraPhotos?.get?.(page.collection)||'';
   const record={
    ...source,manufacturer:'Vismaravetro',collection:page.collection,reference:ref,
    designation:page.collection+' '+page.model+' · '+ref+(q.dims?' · '+q.dims:''),
    finish,price:q.amount,totalPrice:q.amount,purchaseDiscount:50,
    image:photo,imageSource:'Vismaravetro officiel · visuel de collection illustratif',
    imageFinishMatch:'collection-only',
    pricingStatus:q.manual?'vismara-2026-manual-cell-confirmed':q.ambiguous?'vismara-2026-ambiguous-cell-confirmed':'vismara-2026-matrix',
    pricingSource:data.source+' · p. '+page.printedPage,
    technicalSheetUrl:page.technicalSheetUrl||'',technicalSheetType:page.technicalSheetUrl?'pdf':'',
    technicalSheetLabel:'Fiche Vismaravetro '+page.model,
    showerConfiguration:{model:page.model,collection:page.collection,sourcePdfPage:page.pdfPage,
     basePrice:q.base,supplements:q.extra,supplementDescription:q.detail,reference:ref,finish,dimensions:q.dims,
     manualPriceReview:q.manual||q.ambiguous},
    configuratorType:'vismara-2026'
   };
   try{save(record,roomId);ov.remove()}catch(e){$('.vismara-error').textContent=e.message||String(e)}
  };
  return ov;
 }
 return {open,load,choosePricing,prices,matches};
});