/* Amphora REEL configurator — references and amounts from stored supplier catalogue. */
(function(root){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro=n=>Number(n).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const finishes=['BS','BB','BC'];
const officialImages=new Map(),requests=new Map();
function loadOfficialPhoto(ref){
 if(officialImages.has(ref))return Promise.resolve(officialImages.get(ref));
 if(requests.has(ref))return requests.get(ref);
 const task=fetch('/api/amphora-finish-media?reference='+encodeURIComponent(ref))
  .then(r=>r.ok?r.json():null).then(data=>{
   const image=data?.exactFinish===true&&data.reference===ref?data.image:'';
   officialImages.set(ref,image||'');return image||'';
  }).catch(()=>{officialImages.set(ref,'');return ''}).finally(()=>requests.delete(ref));
 requests.set(ref,task);return task;
}
function indexRows(rows){
 const models=new Map(),categories=new Map();
 for(const p of rows.filter(x=>x.manufacturer==='Amphora'&&Number(x.price)>0)){
  const key=String(p.base||p.reference.split('.')[0]);
  if(!models.has(key))models.set(key,{base:key,variants:[],category:p.category,designation:p.designation});
  models.get(key).variants.push(p);
  if(!categories.has(p.category))categories.set(p.category,[]);
  if(!categories.get(p.category).includes(key))categories.get(p.category).push(key);
 }
 return {models,categories};
}
function open(rows,roomId,onAdd,initial){
 if(typeof document==='undefined'||typeof onAdd!=='function')return Promise.reject(Error('Interface indisponible'));
 const idx=indexRows(rows);
 if(!idx.models.size)return Promise.reject(Error('Catalogue Amphora indisponible'));
 document.querySelector('.amphora-overlay')?.remove();
 const overlay=document.createElement('div');overlay.className='amphora-overlay';
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Configurateur Amphora');
 const style=document.createElement('style');style.textContent=`
 .amphora-overlay{position:fixed;inset:0;background:#000a;z-index:999999;display:flex;align-items:center;justify-content:center;padding:18px;font:14px Arial,sans-serif}
 .amphora-shell{background:#fff;color:#222;width:min(1170px,98vw);height:min(790px,95vh);display:flex;flex-direction:column;border-radius:12px;overflow:hidden}
 .amphora-head{background:#20201f;color:white;padding:19px 24px;display:flex;justify-content:space-between;align-items:center}
 .amphora-head h2{margin:3px 0;font-size:24px}.amphora-head small{color:#ddd}.amphora-close{font-size:26px;background:transparent;color:#fff;border:0;cursor:pointer}
 .amphora-body{display:grid;grid-template-columns:160px minmax(0,1fr) 340px;min-height:0;flex:1}
 .amphora-cats{border-right:1px solid #ddd;padding:12px;overflow:auto}
 .amphora-cats button{display:block;width:100%;text-align:left;margin:0 0 8px;padding:12px;border:1px solid #ddd;border-radius:7px;background:white;cursor:pointer}
 .amphora-cats button.active,.amphora-tile.active{border-color:#bd8654;background:#fff5ec}
 .amphora-center{padding:16px;overflow:auto}.amphora-search{width:100%;padding:11px;border:1px solid #ccc;border-radius:6px;margin-bottom:12px}
 .amphora-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
 .amphora-tile{cursor:pointer;border:1px solid #ddd;border-radius:8px;background:white;padding:10px;text-align:left;color:#222}
 .amphora-tile img{height:125px;max-width:100%;object-fit:contain;display:block;margin:auto}
 .amphora-tile strong,.amphora-tile small{display:block;margin-top:6px}
 .amphora-detail{border-left:1px solid #ddd;background:#faf9f7;padding:18px;overflow:auto}
 .amphora-photo{height:205px;width:100%;object-fit:contain;background:white;border-radius:8px}
 .amphora-finish{display:block;width:100%;padding:11px;border:1px solid #ddd;background:white;text-align:left;margin:7px 0;border-radius:7px;cursor:pointer}
 .amphora-finish.active{border:2px solid #9b6c42;background:#fff5ec}
 .amphora-add{width:100%;background:#245747;color:white;padding:15px;border:0;border-radius:7px;cursor:pointer;margin-top:14px}
 .amphora-note{color:#775b42;font-size:12px;line-height:1.45}
 .amphora-rough-in{border:1px solid #b88853;background:#fff5ec;border-radius:8px;padding:12px;margin:12px 0}
 .amphora-rough-in p{margin:8px 0}
 .amphora-rough-in small{color:#6d4d35}
 @media(max-width:850px){.amphora-body{grid-template-columns:110px minmax(0,1fr)}.amphora-detail{grid-column:1/-1;max-height:44vh;border-top:1px solid #ddd}.amphora-shell{overflow:auto}}
 `;
 overlay.append(style);
 const shell=document.createElement('div');shell.className='amphora-shell';
 shell.innerHTML='<header class="amphora-head"><div><small>AMPHORA · COLLECTION REEL</small><h2>Configurateur Amphora</h2></div><button type="button" class="amphora-close" aria-label="Fermer">×</button></header><div class="amphora-body"><aside class="amphora-cats"></aside><main class="amphora-center"><input class="amphora-search" placeholder="Rechercher un modèle ou une référence…" type="search"><div class="amphora-grid"></div></main><section class="amphora-detail"></section></div>';
 overlay.append(shell);document.body.append(overlay);
 const $=s=>overlay.querySelector(s);
 const close=()=>overlay.remove();
 $('.amphora-close').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 const cats=[...idx.categories.keys()];
 let category=initial?.category&&cats.includes(initial.category)?initial.category:cats[0];
 let base=initial?.base&&idx.models.has(initial.base)?initial.base:idx.categories.get(category)[0];
 let ref=initial?.reference||'',search='',busy=false;
 const photo=p=>{const path=p?.image||p?.fallbackImage||'';return /^https:\/\//.test(path)||/^(?:images|assets)\//.test(path)?path:''};
 function render(){
  $('.amphora-cats').innerHTML=cats.map(c=>'<button class="'+(c===category?'active':'')+'" data-cat="'+esc(c)+'">'+esc(c)+' <small>('+idx.categories.get(c).length+')</small></button>').join('');
  overlay.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{category=b.dataset.cat;base=idx.categories.get(category)[0];ref='';render()});
  const allowed=idx.categories.get(category).map(k=>idx.models.get(k)).filter(m=>!search||[m.base,m.designation,...m.variants.map(x=>x.reference)].join(' ').toLowerCase().includes(search.toLowerCase()));
  $('.amphora-grid').innerHTML=allowed.map(m=>{const p=m.variants[0],src=photo(p);
   return '<button class="amphora-tile '+(m.base===base?'active':'')+'" data-base="'+esc(m.base)+'">'+(src?'<img loading="lazy" src="'+esc(src)+'" alt="">':'<div style="height:125px">Visuel indisponible</div>')+'<strong>'+esc(m.base)+'</strong><small>'+esc(m.designation)+'</small><small>Dès '+euro(Math.min(...m.variants.map(x=>x.price)))+' HT</small></button>';
  }).join('')||'<p>Aucun modèle trouvé.</p>';
  overlay.querySelectorAll('[data-base]').forEach(b=>b.onclick=()=>{base=b.dataset.base;ref='';render()});
  const m=idx.models.get(base);
  if(!m){$('.amphora-detail').textContent='Choisissez un modèle.';return;}
  if(!m.variants.some(x=>x.reference===ref))ref=m.variants.find(x=>x.finishCode==='BS')?.reference||m.variants[0].reference;
  const p=m.variants.find(x=>x.reference===ref),img=officialImages.get(ref)||'';
  const roughIn=root?.HydroAmphoraRoughIn?.resolve?.(p,rows)||{required:/\\.EXT\\./.test(p.reference),priced:false,reason:'Correspondance fabricant non chargée'};
  const requiredBody=roughIn.required&&roughIn.priced?root.HydroAmphoraRoughIn.bodyRecord(p,roughIn):null;
  const compositePrice=Number(p.price)+(requiredBody?Number(requiredBody.price):0);
  const sorted=[...m.variants].sort((a,b)=>finishes.indexOf(a.finishCode)-finishes.indexOf(b.finishCode));
  $('.amphora-detail').innerHTML=(img?'<img class="amphora-photo" src="'+esc(img)+'" alt="'+esc(m.base)+'">':'<p>Photo non disponible</p>')+
   '<h3>'+esc(m.designation)+'</h3><p>Modèle '+esc(m.base)+'</p>'+
   '<strong>Finition et tarif public HT</strong>'+
   sorted.map(v=>'<button class="amphora-finish '+(v.reference===ref?'active':'')+'" data-ref="'+esc(v.reference)+'"><b>'+esc(v.finish)+'</b><br><small>'+esc(v.reference)+'</small><br><strong>'+euro(v.price)+' HT</strong></button>').join('')+
   '<p><b>Référence :</b> '+esc(p.reference)+'</p><p><b>Partie extérieure public HT :</b> '+euro(p.price)+'</p>'+
   (roughIn.required?
    '<div class="amphora-rough-in"><strong>Corps d’encastrement nécessaire</strong>'+
     '<p>Référence '+esc(roughIn.reference||'à confirmer')+'</p>'+
     (requiredBody?'<p>Prix public HT : <b>'+euro(requiredBody.price)+'</b></p><small>Inclus automatiquement dans la configuration · ligne séparée au devis</small>':
       '<p class="amphora-note">'+esc(roughIn.reason||'Prix fabricant non vérifié')+'</p>')+'</div>':'')+
   '<p><b>Total configuration HT :</b> '+euro(compositePrice)+'</p><p><b>Remise fournisseur :</b> 50 %</p><p><b>Coût d’achat total HT :</b> '+euro(compositePrice*.5)+'</p>'+
   '<p class="amphora-note amphora-image-status">'+(img?'Photo fabricant vérifiée pour cette finition.':'Recherche de la photo exacte de cette finition…')+'</p><p class="amphora-note">Franco de port dès 500 € HT d’achat fournisseur cumulé ; sinon 50 € de port par commande. Tarif REEL 2024 à actualiser. Aucun accessoire ajouté sans justification fabricant.</p>'+
   (p.manufacturerUrl?'<a href="'+esc(p.manufacturerUrl)+'" target="_blank" rel="noopener noreferrer">Voir la fiche fabricant</a>':'')+
   '<button class="amphora-add" '+(busy||roughIn.required&&!requiredBody?'disabled':'')+'>'+
     (roughIn.required&&!requiredBody?'Corps obligatoire à confirmer':'Ajouter la configuration au projet')+'</button>';
  overlay.querySelectorAll('[data-ref]').forEach(b=>b.onclick=()=>{ref=b.dataset.ref;render()});
  // Update the selected image only: never replace a newer selection with a stale request.
  if(!officialImages.has(ref)){
   const requested=ref;
   loadOfficialPhoto(requested).then(image=>{
    if(!overlay.isConnected||ref!==requested)return;
    const status=$('.amphora-image-status');
    if(image){
     const detail=$('.amphora-detail');
     let el=detail.querySelector('.amphora-photo');
     if(!el){el=document.createElement('img');el.className='amphora-photo';detail.prepend(el);}
     el.src=image;el.alt='Amphora '+requested;
     if(status)status.textContent='Photo fabricant vérifiée pour cette finition.';
    }else if(status)status.textContent='Photo de cette finition indisponible chez le fabricant ; aucun visuel générique affiché.';
   });
  }else if(!img){const status=$('.amphora-image-status');if(status)status.textContent='Photo de cette finition indisponible chez le fabricant ; aucun visuel générique affiché.';}

  $('.amphora-add').onclick=async()=>{
   if(busy||roughIn.required&&!requiredBody)return;
   busy=true;$('.amphora-add').disabled=true;
   try{
    await onAdd({...p,totalPrice:Number(p.price),purchaseDiscount:50,amphoraShippingThresholdHT:500,amphoraShippingBelowThresholdHT:50,
      ...officialImages.get(p.reference)?{image:officialImages.get(p.reference),imageSource:'Amphora officiel · finition exacte'}:{image:'',imageSource:'Photo de finition non vérifiée'}},
     requiredBody,roomId);
    close();
   }catch(e){busy=false;alert('Amphora : '+(e.message||e));render()}
  };
 }
 $('.amphora-search').oninput=e=>{search=e.target.value;render()};
 render();return Promise.resolve(true);
}
root.HydroAmphoraConfigurator={open,indexRows};
})(window);
