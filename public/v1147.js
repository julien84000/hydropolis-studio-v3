/* HYDROPOLIS_STUDIO_V11_47 */
(() => {
  "use strict";

  const isResigres=p=>/^Resigres$/i.test(String(p?.manufacturer||""));
  const baseFetchManufacturerImage=fetchManufacturerImage;
  const baseAutomaticImageEligible=automaticImageEligible;
  const baseSelectedImageNeedsForcedRefresh=selectedImageNeedsForcedRefresh;
  const baseImageBadge=imageBadge;
  const baseUpdateCatalogCardVisual=updateCatalogCardVisual;
  const baseRenderCatalog=renderCatalog;
  const baseRenderRooms=renderRooms;

  function resigresKind(p){
    if(p?.resigresKind)return p.resigresKind;
    const c=String(p?.category||"").toLowerCase();
    if(c.includes("receveur"))return "shower-tray";
    if(c.includes("plan de vasque pour meuble"))return "furniture-basin-top";
    if(c.includes("plan de vasque"))return "basin-top";
    if(c.includes("vasque"))return "basin";
    if(c.includes("baignoire"))return "bath";
    if(c.includes("meuble"))return "furniture";
    if(c.includes("miroir"))return "mirror";
    return "accessory";
  }
  function resigresModel(p){return String(p?.resigresModel||p?.designation||p?.collection||"").trim()}
  function proxyImage(url){return url?`/api/image-proxy?url=${encodeURIComponent(url)}`:""}
  function isOfficialResigresCache(c){return !!(c?.src && /Site officiel Resigres/i.test(String(c?.source||"")))}

  async function fetchResigresAssets(p,force=false){
    const key=manufacturerCacheKey(p);
    const cached=manufacturerImageCache[key];
    if(!force && isOfficialResigresCache(cached))return cached;

    const qs=new URLSearchParams({model:resigresModel(p),kind:resigresKind(p)});
    const r=await fetch(`/api/resigres-assets?${qs.toString()}`,{cache:force?"no-store":"default"});
    let data={};try{data=await r.json()}catch{}
    if(!r.ok)throw new Error(data.detail||data.error||`Resigres HTTP ${r.status}`);
    if(!data.image && !data.technicalSheetUrl)throw new Error("Aucun asset officiel Resigres trouvé");

    const remoteImages=Array.isArray(data.images)?data.images.filter(Boolean):[];
    const proxied=remoteImages.map(proxyImage).filter(Boolean);
    const item={
      src:proxyImage(data.image||remoteImages[0]||""),
      images:proxied,
      remoteUrl:data.image||remoteImages[0]||"",
      remoteImages,
      source:"Site officiel Resigres",
      finishMatch:"model-exact",
      checkedAt:new Date().toISOString(),
      resolvedManufacturerUrl:data.productUrl||p.manufacturerUrl||"",
      technicalSheetUrl:data.technicalSheetUrl||"",
      technicalSheetLabel:data.technicalSheetLabel||"Fiche technique Resigres",
      technicalSheetType:data.technicalSheetUrl?"pdf":"",
      technicalSheetPage:1,
      installationGuideUrl:data.installationGuideUrl||"",
      installationGuideLabel:data.installationGuideLabel||"Guide Resigres",
      model3dUrl:data.model3dUrl||"",
      model3dLabel:data.model3dLabel||"Fichier 3D Resigres",
      resigresAssetTitle:data.title||resigresModel(p),
      resigresAssetMatch:data.match||"official"
    };
    manufacturerImageCache[key]=item;
    saveManufacturerCache();
    return item;
  }

  fetchManufacturerImage=async function(p,force=false,options={}){
    if(isResigres(p))return fetchResigresAssets(p,force);
    return baseFetchManufacturerImage(p,force,options);
  };

  automaticImageEligible=function(p){
    if(isResigres(p)){
      const c=manufacturerImageCache[manufacturerCacheKey(p)];
      const failedAt=autoPhotoFailures.get(autoPhotoGroupKey(p))||0;
      return !isOfficialResigresCache(c) && Date.now()-failedAt>5*60*1000;
    }
    return baseAutomaticImageEligible(p);
  };

  selectedImageNeedsForcedRefresh=function(p){
    if(isResigres(p))return true;
    return baseSelectedImageNeedsForcedRefresh(p);
  };

  imageBadge=function(img,p){
    if(isResigres(p) && /Site officiel Resigres/i.test(String(img?.source||""))){
      return "✓ Photo officielle Resigres · modèle exact";
    }
    return baseImageBadge(img,p);
  };

  function ensureResigresResourceLinks(card,p,img){
    if(!card||!isResigres(p)||!img)return;
    const tools=card.querySelector(".manufacturer-tools");if(!tools)return;
    const productUrl=img.resolvedManufacturerUrl||p.resolvedManufacturerUrl||p.manufacturerUrl||"";
    let fiche=tools.querySelector('a[data-v1147="product"]');
    const existing=[...tools.querySelectorAll("a.source-link")].find(a=>!/Technique|3D/i.test(a.textContent||""));
    if(productUrl){
      if(existing){existing.href=productUrl;existing.textContent="Produit ↗";existing.dataset.v1147="product";fiche=existing}
      else if(!fiche){tools.insertAdjacentHTML("beforeend",`<a class="source-link v1147-resigres-resource" data-v1147="product" target="_blank" rel="noopener" href="${esc(productUrl)}">Produit ↗</a>`)}
    }
    if(img.technicalSheetUrl && !tools.querySelector('a[data-v1147="tech"]')){
      tools.insertAdjacentHTML("beforeend",`<a class="source-link v1147-resigres-resource" data-v1147="tech" target="_blank" rel="noopener" href="${esc(img.technicalSheetUrl)}">Fiche PDF ↗</a>`);
    }
    if(img.installationGuideUrl && !tools.querySelector('a[data-v1147="guide"]')){
      tools.insertAdjacentHTML("beforeend",`<a class="source-link v1147-resigres-resource" data-v1147="guide" target="_blank" rel="noopener" href="${esc(img.installationGuideUrl)}">Guide ↗</a>`);
    }
    if(img.model3dUrl && !tools.querySelector('a[data-v1147="3d"]')){
      tools.insertAdjacentHTML("beforeend",`<a class="source-link v1147-resigres-resource is-3d" data-v1147="3d" target="_blank" rel="noopener" href="${esc(img.model3dUrl)}">3D ↗</a>`);
    }
    const status=card.querySelector(".photo-status");
    if(status)status.innerHTML='<b class="v1147-resigres-status">✓ Site officiel Resigres · photo + documents</b>';
  }

  updateCatalogCardVisual=function(p,img){
    baseUpdateCatalogCardVisual(p,img);
    if(isResigres(p))ensureResigresResourceLinks(catalogCardForProduct(p),p,img);
  };

  function decorateCachedResigresCards(){
    document.querySelectorAll("#results .result[data-key]").forEach(card=>{
      const p=productFromCompareKey(card.dataset.key||"");
      if(!isResigres(p))return;
      const c=manufacturerImageCache[manufacturerCacheKey(p)];
      if(isOfficialResigresCache(c))ensureResigresResourceLinks(card,p,c);
    });
  }

  renderCatalog=function(){
    baseRenderCatalog();
    decorateCachedResigresCards();
  };

  function copyResigresAssetsToSelected(p,img){
    if(!p||!img)return false;
    let changed=false;
    const assign=(k,v)=>{if(v && p[k]!==v){p[k]=v;changed=true}};
    assign("resolvedManufacturerUrl",img.resolvedManufacturerUrl);
    assign("technicalSheetUrl",img.technicalSheetUrl);
    assign("technicalSheetLabel",img.technicalSheetLabel);
    assign("technicalSheetType",img.technicalSheetType||"pdf");
    if(img.installationGuideUrl){assign("installationGuideUrl",img.installationGuideUrl);assign("installationGuideLabel",img.installationGuideLabel)}
    if(img.model3dUrl){assign("model3dUrl",img.model3dUrl);assign("model3dLabel",img.model3dLabel)}
    if(img.src && !p.customImage){
      assign("image",img.src);assign("pdfImage",img.src);assign("imageSource","Site officiel Resigres");assign("imageStatus","Photo officielle Resigres · modèle exact");
      p.images=img.images||[img.src];p.pdfImages=(img.images||[img.src]).slice(0,4);p.remoteImageUrl=img.remoteUrl||"";p.remoteImages=img.remoteImages||[];changed=true;
    }
    return changed;
  }

  let resigresSelectedHydrationRunning=false;
  async function hydrateSelectedResigres(){
    if(resigresSelectedHydrationRunning)return;
    const list=(state.selected||[]).filter(isResigres);
    if(!list.length)return;
    resigresSelectedHydrationRunning=true;
    let changed=false;
    try{
      for(const p of list){
        try{
          const img=await fetchResigresAssets(p,false);
          if(copyResigresAssetsToSelected(p,img))changed=true;
        }catch(e){console.warn("[Resigres V11.47 selected assets]",p.reference,e.message)}
      }
      if(changed){saveState();baseRenderRooms();if($("#view-preview")?.classList.contains("active"))buildDocument();}
    }finally{resigresSelectedHydrationRunning=false}
  }

  renderRooms=function(){
    baseRenderRooms();
    hydrateSelectedResigres().catch(e=>console.warn("[Resigres V11.47 hydrate]",e));
  };

  // Force a first official refresh in the current catalogue view, including stale generic caches.
  queueMicrotask(()=>{
    try{
      (CATALOG||[]).filter(isResigres).slice(0,8).forEach(p=>enqueueAutomaticImage(p));
      decorateCachedResigresCards();
      hydrateSelectedResigres();
    }catch(e){console.warn("[Resigres V11.47 init]",e)}
  });
})();
