'use strict';
/* Hydropolis Studio V11.55 — ALPI France 2025
   - Catalogue tarif public HT issu du tarif ALPI France du 1er mars 2025
   - Remise achat Hydropolis : 55 %
   - Visuels officiels ALPI chargés automatiquement et progressivement
*/
(function(){
  const ALPI_MARKER='V11.55_ALPI_2025';
  if(window[ALPI_MARKER])return;
  window[ALPI_MARKER]=true;

  const CATALOG_URL='/alpi_catalog_2025.json?v=11.55.0';
  const MAKER='Alpi';
  const DISCOUNT=55;
  const attemptedPhotos=new Set();
  const inflightPhotos=new Set();
  let observer=null;
  let baseFetchManufacturerImage=null;

  function alpi(p){return /^alpi$/i.test(String(p&&p.manufacturer||''));}
  function normalizeRef(v){return String(v||'').replace(/\s+/g,'').toUpperCase();}
  function ensureDiscount(){
    try{
      if(typeof state==='undefined')return;
      state.commercial=state.commercial||{};
      state.commercial.supplierDiscounts=state.commercial.supplierDiscounts||{};
      if(!Number.isFinite(Number(state.commercial.supplierDiscounts[MAKER]))){
        state.commercial.supplierDiscounts[MAKER]=DISCOUNT;
      }
      if(typeof renderMarginDashboard==='function')renderMarginDashboard();
    }catch(e){console.warn('[ALPI discount]',e);}
  }

  function installImageResolver(){
    if(baseFetchManufacturerImage || typeof fetchManufacturerImage!=='function')return;
    baseFetchManufacturerImage=fetchManufacturerImage;
    fetchManufacturerImage=async function(p,force=false,options={}){
      if(!alpi(p))return baseFetchManufacturerImage(p,force,options);

      // Reuse a photo already cached under the real commercial reference.
      try{
        if(!force && typeof cachedManufacturerImage==='function'){
          const existing=cachedManufacturerImage(p);
          if(existing&&existing.src)return existing;
        }
      }catch(e){}

      const lookup=String(p.imageLookupReference||p.base||p.reference||'').trim();
      const probe=lookup&&normalizeRef(lookup)!==normalizeRef(p.reference)
        ? {...p,reference:lookup,base:lookup}
        : p;

      const result=await baseFetchManufacturerImage(probe,force,options);
      if(result&&result.src&&probe!==p){
        try{
          const mapped={...result,lookupReference:lookup,resolvedManufacturerUrl:result.resolvedManufacturerUrl||p.manufacturerUrl||''};
          if(typeof manufacturerCacheKey==='function' && typeof manufacturerImageCache!=='undefined'){
            manufacturerImageCache[manufacturerCacheKey(p)]=mapped;
            if(typeof manufacturerSharedCacheKey==='function'){
              manufacturerImageCache[manufacturerSharedCacheKey(p)]=mapped;
            }
            if(typeof saveManufacturerCache==='function')saveManufacturerCache();
          }
          return mapped;
        }catch(e){console.warn('[ALPI image cache]',e);}
      }
      return result;
    };
  }

  function productForCard(card){
    try{
      const key=String(card?.dataset?.key||'');
      if(!key.startsWith(MAKER+'|'))return null;
      if(typeof CATALOG==='undefined')return null;
      return CATALOG.find(p=>alpi(p) && (typeof productKey==='function'?productKey(p):`${p.manufacturer}|${p.reference}`)===key)||null;
    }catch{return null;}
  }

  async function hydrateCard(card){
    const p=productForCard(card);
    if(!p)return;
    const key=`${p.manufacturer}|${p.reference}`;
    if(attemptedPhotos.has(key)||inflightPhotos.has(key))return;
    try{
      if(p.image || (typeof cachedManufacturerImage==='function'&&cachedManufacturerImage(p)))return;
    }catch(e){}
    const button=card.querySelector('.lookup-photo');
    if(!button || typeof lookupCatalogPhoto!=='function')return;
    attemptedPhotos.add(key);inflightPhotos.add(key);
    try{
      await lookupCatalogPhoto(p.reference,button,key);
    }catch(e){
      console.warn('[ALPI auto photo]',p.reference,e);
    }finally{
      inflightPhotos.delete(key);
    }
  }

  function armCard(card){
    const p=productForCard(card);if(!p)return;
    try{if(p.image || (typeof cachedManufacturerImage==='function'&&cachedManufacturerImage(p)))return;}catch(e){}
    if(observer){observer.observe(card);return;}
    const rect=card.getBoundingClientRect();
    if(rect.top<window.innerHeight+500 && rect.bottom>-500)hydrateCard(card);
  }

  function scanVisibleAlpi(){
    document.querySelectorAll('#results article.result[data-key]').forEach(armCard);
  }

  function installPhotoObserver(){
    if('IntersectionObserver' in window){
      observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting)return;
          observer.unobserve(entry.target);
          hydrateCard(entry.target);
        });
      },{rootMargin:'500px 0px',threshold:0.01});
    }
    const results=document.querySelector('#results');
    if(results){
      new MutationObserver(()=>setTimeout(scanVisibleAlpi,0))
        .observe(results,{childList:true,subtree:true});
    }
    scanVisibleAlpi();
  }

  async function loadCatalog(){
    const response=await fetch(CATALOG_URL,{cache:'force-cache'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const rows=await response.json();
    if(!Array.isArray(rows)||rows.length<3000)throw new Error('catalogue ALPI incomplet');

    const known=new Set((typeof CATALOG!=='undefined'?CATALOG:[]).map(p=>`${p.manufacturer||''}|${p.reference||''}`));
    let added=0;
    rows.forEach(p=>{
      const k=`${p.manufacturer||''}|${p.reference||''}`;
      if(!known.has(k)){CATALOG.push(p);known.add(k);added++;}
    });

    ensureDiscount();
    installImageResolver();

    if(typeof refreshCatalogUiAfterChunk==='function')refreshCatalogUiAfterChunk();
    else{
      if(typeof initFilters==='function')initFilters();
      if(typeof renderCatalog==='function')renderCatalog();
    }

    setTimeout(ensureDiscount,400);
    setTimeout(ensureDiscount,1500);
    setTimeout(scanVisibleAlpi,50);
    console.log(`[Hydropolis ${ALPI_MARKER}] ${added} références ALPI ajoutées · remise ${DISCOUNT}% · visuels officiels automatiques.`);
  }

  installImageResolver();
  installPhotoObserver();
  loadCatalog().catch(e=>console.error('[Hydropolis ALPI 2025]',e));
})();
