'use strict';
/* Hydropolis Studio V11.55.1 — ALPI France 2025
   - Catalogue tarif public HT issu du tarif ALPI France du 1er mars 2025
   - Remise achat Hydropolis : 55 %
   - Photos/documents : source ALPI officielle uniquement
   - Aucun visuel tiers accepté pour ALPI
*/
(function(){
  const ALPI_MARKER='V11.55.1_ALPI_OFFICIAL_ONLY';
  if(window[ALPI_MARKER])return;
  window[ALPI_MARKER]=true;

  const CATALOG_URL='/alpi_catalog_2025.json?v=11.55.1';
  const MAKER='Alpi';
  const DISCOUNT=55;
  const OFFICIAL_HOST='alpirubinetterie.com';
  const OFFICIAL_PRODUCTS='https://alpirubinetterie.com/fr/produits/';
  const attemptedPhotos=new Set();
  const inflightPhotos=new Set();
  let observer=null;
  let baseFetchManufacturerImage=null;

  const COLLECTION_PAGES={
    allen:'https://alpirubinetterie.com/fr/collezioni/allen/',
    vero:'https://alpirubinetterie.com/fr/collezioni/vero/',
    nu:'https://alpirubinetterie.com/fr/collezioni/nu/',
    portofino:'https://alpirubinetterie.com/fr/collezioni/portofino/',
    london:'https://alpirubinetterie.com/fr/collezioni/london/',
    ginger:'https://alpirubinetterie.com/fr/collezioni/ginger/',
    gum:'https://alpirubinetterie.com/fr/collezioni/gum/',
    blue:'https://alpirubinetterie.com/fr/collezioni/blue/',
    steele:'https://alpirubinetterie.com/fr/collezioni/steele/',
    una18:'https://alpirubinetterie.com/fr/collezioni/una18/'
  };

  function alpi(p){return /^alpi$/i.test(String(p&&p.manufacturer||''));}
  function normalizeRef(v){return String(v||'').replace(/[^A-Z0-9]/gi,'').toUpperCase();}
  function officialCollectionPage(p){
    const r=normalizeRef(p&&p.reference);
    if(/^AL/.test(r))return COLLECTION_PAGES.allen;
    if(/^VR/.test(r))return COLLECTION_PAGES.vero;
    if(/^NU/.test(r))return COLLECTION_PAGES.nu;
    if(/^PO/.test(r))return COLLECTION_PAGES.portofino;
    if(/^LO/.test(r))return COLLECTION_PAGES.london;
    if(/^GN/.test(r))return COLLECTION_PAGES.ginger;
    if(/^GUM/.test(r))return COLLECTION_PAGES.gum;
    if(/^(BU|BPR)/.test(r))return COLLECTION_PAGES.blue;
    if(/^TEE/.test(r))return COLLECTION_PAGES.steele;
    if(/^UN/.test(r))return COLLECTION_PAGES.una18;
    return OFFICIAL_PRODUCTS;
  }
  function isOfficialUrl(value){
    const raw=String(value||'').trim();
    if(!raw)return true;
    if(/^data:/i.test(raw))return true;
    try{
      const u=new URL(raw,location.origin);
      if(u.pathname==='/api/image-proxy'){
        const inner=u.searchParams.get('url');
        return inner?isOfficialUrl(inner):false;
      }
      const h=String(u.hostname||'').toLowerCase();
      return h===OFFICIAL_HOST||h.endsWith('.'+OFFICIAL_HOST)||h===location.hostname;
    }catch{return false;}
  }
  function resultIsOfficial(result){
    if(!result)return false;
    const urls=[];
    if(result.remoteUrl)urls.push(result.remoteUrl);
    if(result.resolvedManufacturerUrl)urls.push(result.resolvedManufacturerUrl);
    if(Array.isArray(result.remoteImages))urls.push(...result.remoteImages);
    if(result.drawingUrl)urls.push(result.drawingUrl);
    if(result.technicalSheetUrl)urls.push(result.technicalSheetUrl);
    if(result.installationGuideUrl)urls.push(result.installationGuideUrl);
    return urls.length>0 && urls.every(isOfficialUrl);
  }
  function purgeNonOfficialCache(){
    try{
      if(typeof manufacturerImageCache==='undefined')return;
      let changed=false;
      for(const key of Object.keys(manufacturerImageCache||{})){
        if(!/^Alpi\|/i.test(key))continue;
        const row=manufacturerImageCache[key];
        if(!resultIsOfficial(row)){
          delete manufacturerImageCache[key];
          changed=true;
        }
      }
      if(changed&&typeof saveManufacturerCache==='function')saveManufacturerCache();
    }catch(e){console.warn('[ALPI cache purge]',e);}
  }
  function ensureDiscount(){
    try{
      if(typeof state==='undefined')return;
      state.commercial=state.commercial||{};
      state.commercial.supplierDiscounts=state.commercial.supplierDiscounts||{};
      state.commercial.supplierDiscounts[MAKER]=DISCOUNT;
      if(typeof renderMarginDashboard==='function')renderMarginDashboard();
    }catch(e){console.warn('[ALPI discount]',e);}
  }

  function installImageResolver(){
    if(baseFetchManufacturerImage || typeof fetchManufacturerImage!=='function')return;
    baseFetchManufacturerImage=fetchManufacturerImage;
    fetchManufacturerImage=async function(p,force=false,options={}){
      if(!alpi(p))return baseFetchManufacturerImage(p,force,options);

      purgeNonOfficialCache();

      try{
        if(!force && typeof cachedManufacturerImage==='function'){
          const existing=cachedManufacturerImage(p);
          if(existing&&existing.src&&resultIsOfficial(existing))return existing;
        }
      }catch(e){}

      const lookup=String(p.imageLookupReference||p.base||p.reference||'').trim();
      const page=officialCollectionPage(p);
      const probe={
        ...p,
        manufacturer:'Alpi',
        manufacturerUrl:page,
        reference:lookup||p.reference,
        base:lookup||p.base||p.reference
      };

      const result=await baseFetchManufacturerImage(probe,true,{...options,imageOnly:options.imageOnly===true});
      if(!resultIsOfficial(result)){
        console.warn('[ALPI official-only] résultat tiers rejeté',p.reference,result&&result.remoteUrl);
        return {
          src:'',images:[],remoteUrl:'',remoteImages:[],resolvedManufacturerUrl:page,
          lookupReference:lookup||p.reference,
          source:'Site officiel ALPI uniquement',
          note:'Aucun visuel officiel ALPI exploitable trouvé. Les sources tierces sont désactivées pour ALPI.'
        };
      }

      const mapped={
        ...result,
        lookupReference:lookup||p.reference,
        resolvedManufacturerUrl:page,
        source:'Site officiel ALPI'
      };
      try{
        if(typeof manufacturerCacheKey==='function'&&typeof manufacturerImageCache!=='undefined'){
          manufacturerImageCache[manufacturerCacheKey(p)]=mapped;
          if(typeof saveManufacturerCache==='function')saveManufacturerCache();
        }
      }catch(e){console.warn('[ALPI image cache]',e);}
      return mapped;
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
      const cached=typeof cachedManufacturerImage==='function'?cachedManufacturerImage(p):null;
      if(p.image||(cached&&resultIsOfficial(cached)))return;
    }catch(e){}
    const button=card.querySelector('.lookup-photo');
    if(!button||typeof lookupCatalogPhoto!=='function')return;
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
    try{
      const cached=typeof cachedManufacturerImage==='function'?cachedManufacturerImage(p):null;
      if(p.image||(cached&&resultIsOfficial(cached)))return;
    }catch(e){}
    if(observer){observer.observe(card);return;}
    const rect=card.getBoundingClientRect();
    if(rect.top<window.innerHeight+500&&rect.bottom>-500)hydrateCard(card);
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
      new MutationObserver(()=>setTimeout(scanVisibleAlpi,0)).observe(results,{childList:true,subtree:true});
    }
    scanVisibleAlpi();
  }

  async function loadCatalog(){
    const response=await fetch(CATALOG_URL,{cache:'no-cache'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const rows=await response.json();
    if(!Array.isArray(rows)||rows.length<3000)throw new Error('catalogue ALPI incomplet');

    const known=new Set((typeof CATALOG!=='undefined'?CATALOG:[]).map(p=>`${p.manufacturer||''}|${p.reference||''}`));
    let added=0;
    rows.forEach(p=>{
      p.manufacturer='Alpi';
      p.manufacturerUrl=officialCollectionPage(p);
      p.imageSource='Alpi Rubinetterie · site officiel uniquement';
      const k=`${p.manufacturer||''}|${p.reference||''}`;
      if(!known.has(k)){CATALOG.push(p);known.add(k);added++;}
    });

    purgeNonOfficialCache();
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
    console.log(`[Hydropolis ${ALPI_MARKER}] ${added} références ALPI · remise ${DISCOUNT}% · source officielle ALPI uniquement.`);
  }

  purgeNonOfficialCache();
  installImageResolver();
  installPhotoObserver();
  loadCatalog().catch(e=>console.error('[Hydropolis ALPI 2025]',e));
})();
