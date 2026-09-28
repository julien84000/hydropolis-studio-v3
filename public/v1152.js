/* HYDROPOLIS_STUDIO_V11_52 */
(() => {
  "use strict";
  const V52="11.52";
  const isShowerBrand=p=>/^(Vismaravetro|TDA)$/i.test(String(p?.manufacturer||""));
  const isResigres=p=>/^Resigres$/i.test(String(p?.manufacturer||""));
  const baseFetch52=fetchManufacturerImage;
  const baseAuto52=automaticImageEligible;
  const baseBadge52=imageBadge;
  const baseRenderCatalog52=renderCatalog;
  const baseRenderRooms52=renderRooms;
  const proxy=u=>u?`/api/image-proxy?url=${encodeURIComponent(u)}`:"";
  const showerCacheOK=c=>!!(c?.src&&c?.hydroShowerAssetVersion===V52);

  async function fetchShowerAssets52(p,force=false){
    const key=manufacturerCacheKey(p),cached=manufacturerImageCache[key];
    if(!force&&showerCacheOK(cached))return cached;
    const url=String(p?.resolvedManufacturerUrl||p?.manufacturerUrl||"");
    const q=new URLSearchParams({manufacturer:p.manufacturer||"",collection:p.collection||p.designation||"",url});
    const r=await fetch(`/api/shower-screen-assets?${q.toString()}`,{cache:force?"no-store":"default"});let data={};try{data=await r.json()}catch{}
    if(!r.ok)throw new Error(data.detail||data.error||`HTTP ${r.status}`);
    const rem=Array.isArray(data.images)?data.images.filter(Boolean):[],imgs=rem.map(proxy).filter(Boolean);
    const item={src:proxy(data.image||rem[0]||""),images:imgs,remoteUrl:data.image||rem[0]||"",remoteImages:rem,source:`Site officiel ${p.manufacturer}`,finishMatch:"collection-exact",checkedAt:new Date().toISOString(),resolvedManufacturerUrl:data.productUrl||url,technicalSheetUrl:data.technicalSheetUrl||"",technicalSheetLabel:data.technicalSheetLabel||`Fiche technique ${p.manufacturer}`,technicalSheetType:data.technicalSheetUrl?"pdf":"",technicalSheetPage:1,installationGuideUrl:data.installationGuideUrl||"",installationGuideLabel:data.installationGuideLabel||"Notice installation",model3dUrl:data.model3dUrl||"",model3dLabel:data.model3dLabel||"Fichier 3D",hydroShowerAssetVersion:data.resolverVersion||V52};manufacturerImageCache[key]=item;saveManufacturerCache();return item;
  }
  fetchManufacturerImage=async function(p,force=false,options={}){if(isShowerBrand(p))return fetchShowerAssets52(p,force);return baseFetch52(p,force,options)};
  automaticImageEligible=function(p){if(isShowerBrand(p)){const c=manufacturerImageCache[manufacturerCacheKey(p)];return !showerCacheOK(c)}return baseAuto52(p)};
  imageBadge=function(img,p){if(isShowerBrand(p)&&showerCacheOK(img))return `✓ Visuel officiel ${p.manufacturer} · ${p.collection||"collection"}`;return baseBadge52(img,p)};

  function decorateShowerCards52(){
    document.querySelectorAll("#results .result[data-key]").forEach(card=>{const p=productFromCompareKey(card.dataset.key||"");if(!isShowerBrand(p))return;const price=card.querySelector(".price-box .price");if(price)price.textContent="À chiffrer";const internal=card.querySelector(".price-box .internal");if(internal)internal.textContent="Visuel et documentation : site officiel";const c=manufacturerImageCache[manufacturerCacheKey(p)];if(!showerCacheOK(c)){try{enqueueAutomaticImage(p)}catch{}}});
  }
  renderCatalog=function(){baseRenderCatalog52();decorateShowerCards52()};

  let resigresDocsBusy=false;
  function resigresModel52(p){return String(p?.resigresModel||p?.configOriginDesignation||p?.designation||p?.collection||"").split(" · ")[0].trim()}
  function resigresKind52(p){if(p?.resigresKind)return p.resigresKind;const c=String(p?.category||"").toLowerCase();if(c.includes("receveur"))return "shower-tray";if(c.includes("plan de vasque pour meuble"))return "furniture-basin-top";if(c.includes("plan de vasque"))return "basin-top";if(c.includes("vasque"))return "basin";if(c.includes("baignoire"))return "bath";if(c.includes("meuble"))return "furniture";if(c.includes("miroir"))return "mirror";return "accessory"}
  async function fetchResigresDoc52(p){const q=new URLSearchParams({model:resigresModel52(p),kind:resigresKind52(p),productUrl:p.resolvedManufacturerUrl||p.manufacturerUrl||"",v:"11.52"});const r=await fetch(`/api/resigres-assets?${q.toString()}`,{cache:"no-store"});let d={};try{d=await r.json()}catch{};if(!r.ok)throw new Error(d.detail||d.error||`HTTP ${r.status}`);if(!d.technicalSheetUrl)throw new Error("Fiche technique PDF non trouvée sur la page Resigres");p.resolvedManufacturerUrl=d.productUrl||p.resolvedManufacturerUrl||p.manufacturerUrl||"";p.technicalSheetUrl=d.technicalSheetUrl;p.technicalSheetLabel=d.technicalSheetLabel||"Fiche technique Resigres";p.technicalSheetType="pdf";p.technicalSheetPage=1;if(d.installationGuideUrl){p.installationGuideUrl=d.installationGuideUrl;p.installationGuideLabel=d.installationGuideLabel||"Notice installation Resigres"}saveState();return true}
  function decorateResigresTech52(){
    (state.selected||[]).filter(isResigres).forEach(p=>{const anchor=document.querySelector(`.enrich-btn[data-id="${CSS.escape(p.id)}"]`);const card=anchor?.closest(".room-product");const actions=card?.querySelector(".image-actions");if(!actions)return;if(p.technicalSheetUrl)return;if(actions.querySelector(`[data-v1152-resigres-tech="${CSS.escape(p.id)}"]`))return;const b=document.createElement("button");b.type="button";b.className="tiny";b.dataset.v1152ResigresTech=p.id;b.textContent="Récupérer la fiche technique Resigres";b.onclick=async()=>{b.disabled=true;b.textContent="Recherche de la fiche…";try{await fetchResigresDoc52(p);renderRooms()}catch(e){b.disabled=false;b.textContent="Réessayer la fiche technique";alert(`Fiche technique Resigres : ${e.message}`)}};actions.appendChild(b)});
  }
  async function hydrateResigresDocs52(){if(resigresDocsBusy)return;const list=(state.selected||[]).filter(p=>isResigres(p)&&!p.technicalSheetUrl);if(!list.length)return;resigresDocsBusy=true;let changed=false;try{for(const p of list){try{await fetchResigresDoc52(p);changed=true}catch{}}}finally{resigresDocsBusy=false}if(changed)baseRenderRooms52();decorateResigresTech52()}
  renderRooms=function(){baseRenderRooms52();decorateResigresTech52();queueMicrotask(()=>hydrateResigresDocs52().catch(e=>console.warn("[V11.52 Resigres docs]",e)))};

  try{let dirty=false;for(const k of Object.keys(manufacturerImageCache||{})){const row=manufacturerImageCache[k];if(/^Resigres\|/i.test(k)&&row?.src&&!row?.technicalSheetUrl){delete manufacturerImageCache[k];dirty=true}}if(dirty)saveManufacturerCache()}catch(e){console.warn("[V11.52 cache tech reset]",e)}
  queueMicrotask(()=>{decorateShowerCards52();decorateResigresTech52();hydrateResigresDocs52().catch(()=>{})});
})();
