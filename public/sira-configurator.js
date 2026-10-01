/* Sira: tariff calculation and finish-aware official photography are independent. */
const HydroSiraConfigurator=(()=>{
  'use strict';let tariffPromise,modelsPromise;
  const escape=esc,options=rows=>rows.map(([v,l])=>`<option value="${escape(v)}">${escape(l)}</option>`).join('');
  async function open(p,roomId){
    tariffPromise ||=fetch('/sira_tariff_2024.json').then(r=>{if(!r.ok)throw Error('Tarif Sira indisponible');return r.json()}).catch(e=>{tariffPromise=null;throw e});
    modelsPromise ||=fetch('/sira_models.json').then(r=>{if(!r.ok)throw Error('Modèles Sira indisponibles');return r.json()}).catch(e=>{modelsPromise=null;throw e});
    const [tariff,modelData]=await Promise.all([tariffPromise,modelsPromise]);
    const officialModels=modelData.models.filter(x=>x.collection===p.collection),isArctic=p.siraKind==='countertop'||/Arctic/i.test(p.collection),products=tariff.products.filter(x=>x.collection===p.collection);
    const o=document.createElement('div');o.className='v1153-overlay';o.id='siraTariffModal';
    o.innerHTML=`<div class="v1153-modal" role="dialog" aria-modal="true" aria-label="Configurer Sira Concrete"><header><div><div class="eyebrow">SIRA CONCRETE · TARIF 2024/25 T006</div><h2>${escape(p.collection)}</h2><p>Produit → dimensions → pigment → options</p></div><button class="icon close-sira" aria-label="Fermer">×</button></header><div class="v1153-body"><div class="sira-models" role="group" aria-label="Modèles ${escape(p.collection)}">${officialModels.map(m=>`<button type="button" class="sira-model" data-model="${escape(m.code)}" aria-pressed="false"><img src="${escape(m.image)}" alt="${escape(m.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span>${escape(m.name)}</span></button>`).join('')}</div><div class="v1153-grid"><label>Produit<select class="sira-product">${options(isArctic?Object.entries(tariff.arcticLabels):products.map(x=>[x.code,x.name]))}</select></label><label>Pigment<select class="sira-color">${options(Object.entries(tariff.colors).map(([k,v])=>[k,v+' · '+k]))}</select></label>${isArctic?`<label>Largeur (cm)<select class="sira-width">${options(Object.keys(tariff.arctic.AR1).map(v=>[v,v+' cm']))}</select></label><label>Position de la vasque<select class="sira-position">${options([['C','Centrée'],['L','Gauche'],['R','Droite'],['0','Sans vasque']])}</select></label>`:''}<label>Trous de robinet<select class="sira-holes">${options([0,1,2,3].map(n=>[n,String(n)]))}</select></label><label class="free-check"><input type="checkbox" class="sira-supports"> Ajouter les supports préconisés</label><label class="free-check"><input type="checkbox" class="sira-waste"> Ajouter la bonde assortie</label></div><div class="sira-preview" aria-live="polite"></div><div class="sira-details v1153-info"></div><div class="v1153-price-panel"><b>Prix public HT</b><strong class="sira-price"></strong></div><p class="v1153-note">Tarif fourni 2024/25. Supports vendus séparément. Pour une largeur intermédiaire, utiliser un prix confirmé par Sira.</p></div><footer><button class="btn ghost close-sira">Annuler</button><button class="btn primary sira-add">Ajouter la configuration</button></footer></div>`;
    document.body.appendChild(o);const $=s=>o.querySelector(s);let selected,media=null,mediaKey='',sequence=0;
    o.querySelectorAll('.close-sira').forEach(b=>b.onclick=()=>{sequence++;o.remove()});
    const productUrl=()=>officialModels.find(x=>x.code===selected.code)?.productUrl||'';
    o.querySelectorAll('.sira-model').forEach(b=>b.onclick=()=>{$('.sira-product').value=b.dataset.model;calc();});
    o.querySelectorAll('.sira-model img').forEach(im=>im.onerror=()=>{im.replaceWith(Object.assign(document.createElement('span'),{textContent:'Visuel indisponible'}));});
    async function updatePhoto(){
      const key=selected.code+'|'+$('.sira-color').value;if(key===mediaKey)return;mediaKey=key;media=null;
      const seq=++sequence;$('.sira-preview').textContent='Recherche du visuel officiel…';
      const params=new URLSearchParams({modelCode:selected.code,color:$('.sira-color').value});
      try{
        const r=await fetch('/api/sira-assets?'+params),data=await r.json();if(seq!==sequence||!o.isConnected)return;
        if(!r.ok)throw Error('Non disponible sur le site fabricant');
        media=data;
        const src=data.image&&HydroOfficialMedia.allowed(data.image,{manufacturer:'Sira Concrete'})?data.image:'';
        $('.sira-preview').innerHTML=`${src?`<img referrerpolicy="no-referrer" src="${escape(src)}" alt="${escape(selected.name+' · '+tariff.colors[$('.sira-color').value])}">`:''}<div>${src?(data.finishMatch==='exact'?'Photo officielle · '+escape(tariff.colors[$('.sira-color').value]):'Visuel officiel générique · pigment non garanti'):'Non disponible sur le site fabricant'}${data.technicalSheetUrl?`<br><a target="_blank" rel="noopener" href="${escape(data.technicalSheetUrl)}">Fiche technique Sira ↗</a>`:''}</div>`;
        const im=$('.sira-preview img');if(im)im.onerror=()=>{media=null;$('.sira-preview').textContent='Non disponible sur le site fabricant';};
      }catch{if(seq===sequence&&o.isConnected)$('.sira-preview').textContent='Non disponible sur le site fabricant';}
    }
    function calc(){
      const code=$('.sira-product').value,width=isArctic?Number($('.sira-width').value):0;
      selected=isArctic?{code,name:'Arctic · '+tariff.arcticLabels[code],price:tariff.arctic[code][width],page:9,supports:width>=120?2:1}:products.find(x=>x.code===code);if(!selected)return;
      const holes=$('.sira-holes'),allowed=selected.name==='Tundra'?[0,2,4,6]:isArctic?[0,1,2,3,4,5,6]:[0,1,2,3],old=holes.value;
      holes.innerHTML=options(allowed.map(n=>[n,String(n)]));holes.value=allowed.map(String).includes(old)?old:'0';
      if(isArctic){const pos=$('.sira-position');pos.disabled=['AR3','AR4'].includes(code);if(pos.disabled)pos.value='0';else if(pos.value==='0')pos.value='C';}
      $('.sira-supports').disabled=!selected.supports;if(!selected.supports)$('.sira-supports').checked=false;
      const wasteCode=selected.collection==='Bathtub Collection'?'VB2':'VL1',supportCost=$('.sira-supports').checked?selected.supports*108:0,wasteCost=$('.sira-waste').checked?tariff.extras[wasteCode].price:0,total=selected.price+supportCost+wasteCost;
      $('.sira-price').textContent=euro(total)+' HT';$('.sira-details').innerHTML=`<b>${escape(selected.name)}</b><br>Réf. ${escape(code)}${isArctic?' · '+width+' cm':''}<br>Prix produit : ${euro(selected.price)} HT${supportCost?`<br>Supports : ${selected.supports} × 108 € HT`:''}${wasteCost?`<br>Bonde : ${euro(wasteCost)} HT`:''}<br>Remise achat : 50 % · coût ${euro(total*.5)} HT`;
      o.querySelectorAll('.sira-model').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.model===code)));
      updatePhoto();
    }
    o.querySelectorAll('select,input').forEach(x=>x.addEventListener('change',calc));calc();
    $('.sira-add').onclick=()=>{
      if(!selected)return;
      const color=$('.sira-color').value,width=isArctic?$('.sira-width').value:'',position=isArctic?$('.sira-position').value:'',holes=$('.sira-holes').value;
      const ref=[selected.code,isArctic?String(width).padStart(3,'0'):'',position,color,holes].filter(x=>x!=='').join(' '),price=selected.price,url=productUrl();
      const rec=createSelectedProductRecord({...p,image:'',images:[],reference:ref,designation:[selected.name,width?width+' cm':'',tariff.colors[color]].filter(Boolean).join(' · '),finish:tariff.colors[color],finishCode:color,price,totalPrice:price,purchaseDiscount:50,manufacturerUrl:url},roomId);
      Object.assign(rec,{price,totalPrice:price,catalogPrice:price,catalogTotalPrice:price,purchaseDiscount:50,pricingStatus:'verified-sira-2024-25',pricingSource:tariff.source+' · p. '+selected.page,siraConfiguration:{product:isArctic?'':selected.name,productUrl:url,code:selected.code,color,widthCm:Number(width)||null,sinkPosition:position,tapHoles:Number(holes)},configuratorType:'sira-2024-tariff',customImage:false,image:'',images:[],pdfImage:'',pdfImages:[],mediaVersion:HydroOfficialMedia.VERSION});
      if(media?.image&&HydroOfficialMedia.allowed(media.image,rec)){
        const src=media.image,images=media.images.filter(u=>HydroOfficialMedia.allowed(u,rec));
        Object.assign(rec,{image:src,pdfImage:src,images,pdfImages:images.slice(0,2),remoteImageUrl:media.image,remoteImages:media.images,imageSource:media.imageSource,imageFinishMatch:media.finishMatch,imageStatus:media.finishMatch==='exact'?'Photo officielle · '+rec.finish:'Photo officielle générique · pigment non garanti',technicalSheetUrl:media.technicalSheetUrl,technicalSheetType:media.technicalSheetUrl?'pdf':'',resolvedManufacturerUrl:url});
      }
      const records=[rec],extra=(code,qty)=>{const x=tariff.extras[code],item=createSelectedProductRecord({manufacturer:'Sira Concrete',reference:code,designation:x.name,collection:'Compléments',price:x.price,totalPrice:x.price,purchaseDiscount:50},roomId,rec.id);Object.assign(item,{quantity:qty,quantityPerParent:qty,purchaseDiscount:50,pricingStatus:'verified-sira-2024-25',pricingSource:tariff.source+' · p. '+x.page});records.push(item);};
      if($('.sira-supports').checked)extra('SP1',selected.supports);if($('.sira-waste').checked)extra(selected.collection==='Bathtub Collection'?'VB2':'VL1',1);
      sequence++;commitSelectedRecords(records,{showProject:true});o.remove();
    };
  }
  return {open,async models(){modelsPromise ||=fetch('/sira_models.json').then(r=>r.json()).catch(e=>{modelsPromise=null;throw e});return (await modelsPromise).models;}};
})();
