/* V11.49_RESIGRES_OFFICIAL_ASSETS */
/* V11.47_RESIGRES_OFFICIAL_ASSETS compatibility marker */
const RESIGRES_RESOLVER_VERSION="11.49";
const RESIGRES_ASSET_CACHE=new Map();
const RESIGRES_CATEGORY_INDEX_CACHE=new Map();
const RESIGRES_CATEGORY_URLS={
  "shower-tray":"https://resigres.com/productos-platos-ducha.php",
  "basin-top":"https://resigres.com/productos-encimeras-suspendidas.php",
  "furniture-basin-top":"https://resigres.com/productos-encimeras-mueble.php",
  "basin":"https://resigres.com/productos-lavabos.php",
  "bath":"https://resigres.com/productos-banyeras.php",
  "furniture":"https://resigres.com/productos-mobiliario.php",
  "mirror":"https://resigres.com/productos-espejos.php",
  "accessory":"https://resigres.com/productos-complementos.php"
};
const RESIGRES_KNOWN_PRODUCT_URLS={
  "bath|delia":"https://resigres.com/producto.php?id=53&origen=productos-banyeras.php",
  "basin-top|atenea":"https://resigres.com/producto.php?id=6&origen=productos-encimeras-suspendidas.php",
  "basin-top|cosmo cf":"https://resigres.com/producto.php?id=9&origen=productos-encimeras-suspendidas.php",
  "shower-tray|nix nix contract":"https://resigres.com/producto.php?id=52&origen=productos-platos-ducha.php"
};
const RESIGRES_MODEL_ALIASES={
  "extraplano lateral":["plato extraplano lateral"],
  "extraplano central 1 4 rond":["plato extraplano central","plato extraplano semicircular"],
  "vento vento contract":["plato de ducha vento","plato vento"],
  "cosmo cosmo contract":["plato cosmo","plato de ducha cosmo"],
  "nix nix contract":["plato nix","plato de ducha nix"],
  "atenea":["encimera atenea","encimera atena"],
  "vento cf":["encimera vento cf","encimera cf vento"],
  "cosmo cf":["encimera cosmo cf","encimera cf cosmo"],
  "urban cf":["encimera urban cf","encimera cf urban"],
  "gea cf":["encimera gea cf","encimera cf gea"],
  "selene":["encimera selene"],
  "vento sf":["encimera vento sf","encimera sf vento"],
  "cosmo sf":["encimera cosmo sf","encimera sf cosmo"],
  "urban sf":["encimera urban sf","encimera sf urban"],
  "gea sf":["encimera gea sf","encimera sf gea"],
  "axis":["lavabo axis"],
  "ares":["lavabo ares"],
  "crono":["lavabo crono"],
  "kos neo":["lavabo kos","lavabo neo"],
  "gesto frame":["lavabo gesto","lavabo frame"],
  "urban":["lavabo urban","plato urban","plato de ducha urban"],
  "nalu":["banera nalu"],
  "delia":["banera delia"],
  "nesta":["banera nesta"],
  "vento":["banera vento"],
  "tiroirs sur mesure":["cajones a medida"],
  "portes vides et colonnes":["puertas a medida","huecos a medida","columnas a medida"],
  "rd sq":["espejo rd","espejo sq","espejos a medida"],
  "fs fl":["espejo fs","espejo fl","espejos a medida"],
  "frame gesto":["espejo frame","espejo gesto"],
  "porte serviettes":["toallero","porta toallas"],
  "panneaux etageres":["paneles","estantes"]
};
function rgNorm(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&amp;/g," ").replace(/[^a-z0-9]+/g," ").trim()}
function rgCore(v){
  const stop=new Set(["resigres","receveur","plato","ducha","extraplano","plan","vasque","encimera","bano","suspendida","suspendidas","mueble","lavabo","banera","baignoire","mobiliario","meuble","espejo","miroir","complemento","contract","cf","sf","standard","estandar","sur","mesure","de","pour","et"]);
  return rgNorm(v).split(/\s+/).filter(x=>x&&!stop.has(x));
}
function rgTerms(model){const n=rgNorm(model);return [model,...(RESIGRES_MODEL_ALIASES[n]||[])].filter(Boolean)}
function rgScoreOne(title,model){
  const hay=rgNorm(title),tokens=rgCore(model);if(!tokens.length)return 0;
  let score=0;for(const t of tokens){if(new RegExp(`(^|\\s)${t}(\\s|$)`).test(hay))score+=38;else if(hay.includes(t))score+=24;else score-=14}
  const full=rgNorm(model).replace(/\b(contract|cf|sf)\b/g,"").replace(/\s+/g," ").trim();if(full&&hay.includes(full))score+=80;
  return score;
}
function rgScore(title,model){return Math.max(...rgTerms(model).map(term=>rgScoreOne(title,term)),0)}
function rgAbs(base,href){try{return new URL(String(href||"").replace(/&amp;/g,"&"),base).href}catch{return ""}}
function rgAllowed(url){try{const u=new URL(url);return /^https?:$/.test(u.protocol)&&/(^|\.)resigres\.com$/i.test(u.hostname)}catch{return false}}
function rgProductUrl(url){return rgAllowed(url)&&/\/producto\.php\?[^#]*\bid=\d+/i.test(url)}
function rgExtractProductCandidates(html,base){
  const $=cheerio.load(String(html||""));const map=new Map();
  function add(raw,label=""){
    const abs=rgAbs(base,raw);if(!abs||!rgProductUrl(abs))return;
    const prev=map.get(abs);const clean=String(label||"").replace(/\s+/g," ").trim().slice(0,500);
    if(!prev||clean.length>prev.label.length)map.set(abs,{url:abs,label:clean});
  }
  $("*").each((_,el)=>{
    const e=$(el);let label=[e.text(),e.attr("title"),e.attr("aria-label"),e.find("img").attr("alt")].filter(Boolean).join(" ");
    const parent=e.closest("article,li,.producto,.product,.item,.card,div");if(parent?.length)label+=" "+parent.first().text();
    for(const attr of ["href","data-href","data-url","data-link","data-target","onclick"]){
      const raw=String(e.attr(attr)||"");if(!raw)continue;
      for(const m of raw.matchAll(/producto\.php\?[^'\"<>\s)]*\bid=\d+[^'\"<>\s)]*/gi))add(m[0],label);
      const m2=raw.match(/producto\.php\?id=\d+(?:[^'\"<>\s)]*)?/i);if(m2)add(m2[0],label);
    }
  });
  const raw=String(html||"");
  for(const m of raw.matchAll(/producto\.php\?id=\d+(?:(?:&amp;|&)[^'\"<>\s)]*)?/gi))add(m[0],"");
  return [...map.values()];
}
async function rgGet(url,timeout=16000){return safeRemoteGet(url,{timeout,maxContentLength:6*1024*1024,maxBodyLength:6*1024*1024,headers:{"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36","Accept-Language":"es-ES,es;q=0.9,fr;q=0.8,en;q=0.6","Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Cache-Control":"no-cache"}})}
function rgExtractCategoryImages(html,base){
  const $=cheerio.load(String(html||""));const out=[];
  $("img").each((_,el)=>{const e=$(el),raw=e.attr("src")||e.attr("data-src")||e.attr("data-lazy-src")||e.attr("data-original");if(!raw)return;const url=rgAbs(base,raw);if(!rgAllowed(url)||!/\.(?:jpe?g|png|webp|avif)(?:\?|$)/i.test(url))return;let label=[e.attr("alt"),e.attr("title")].filter(Boolean).join(" ");const block=e.closest("a,article,li,.producto,.product,.item,.card,div").first();if(block?.length)label+=" "+block.text();out.push({url,label:String(label||"").replace(/\s+/g," ").trim()})});
  return out;
}
async function rgCategoryIndex(kind){
  const category=RESIGRES_CATEGORY_URLS[kind]||RESIGRES_CATEGORY_URLS.accessory;
  const cached=RESIGRES_CATEGORY_INDEX_CACHE.get(category);if(cached&&Date.now()-cached.at<6*60*60*1000)return cached.data;
  const page=await rgGet(category),html=String(page.data||""),candidates=rgExtractProductCandidates(html,category),categoryImages=rgExtractCategoryImages(html,category),rows=[];
  for(let i=0;i<candidates.length;i+=6){
    const batch=candidates.slice(i,i+6);
    const found=await Promise.all(batch.map(async c=>{try{const p=await rgGet(c.url,14000),$p=cheerio.load(String(p.data||"")),title=$p("h1").first().text().trim()||$p("title").text().trim();return {...c,title}}catch(e){return {...c,title:"",error:e.message}}}));
    rows.push(...found);
  }
  const data={category,rows,categoryImages};RESIGRES_CATEGORY_INDEX_CACHE.set(category,{at:Date.now(),data});return data;
}
async function rgResolveProductUrl(model,kind,directUrl=""){
  const direct=rgAbs("https://resigres.com/",directUrl);if(rgProductUrl(direct))return {url:direct,match:"catalog-direct",category:RESIGRES_CATEGORY_URLS[kind]||""};
  const known=RESIGRES_KNOWN_PRODUCT_URLS[`${kind}|${rgNorm(model)}`];if(known)return {url:known,match:"verified-map",category:RESIGRES_CATEGORY_URLS[kind]||""};
  const index=await rgCategoryIndex(kind);let best=null;
  for(const row of index.rows){const combined=[row.title,row.label].filter(Boolean).join(" "),score=rgScore(combined,model);if(!best||score>best.score)best={...row,score}}
  if(best?.score>=20)return {url:best.url,match:"category-index",category:index.category,title:best.title,score:best.score};
  let bestImage=null;for(const row of index.categoryImages||[]){const score=rgScore(row.label+" "+row.url,model);if(!bestImage||score>bestImage.score)bestImage={...row,score}}
  if(bestImage?.score>=20)return {url:"",assetImage:bestImage.url,match:"category-image",category:index.category,title:model,score:bestImage.score};
  throw new Error(`Produit Resigres introuvable pour ${model} (${index.rows.length} pages produit, ${(index.categoryImages||[]).length} images catégorie)`);
}
function rgImageScore(url,label,model){
  const n=rgNorm(url+" "+label),tokens=rgCore(model);let s=0;
  for(const t of tokens)if(n.includes(t))s+=24;
  if(/producto|product|galeria|gallery|foto|imagen|uploads/i.test(n))s+=15;
  if(/logo|icon|bandera|flag|social|cookie|spinner|arrow|flecha|menu/i.test(n))s-=150;
  return s;
}
function rgExtractImages($,html,pageUrl,model){
  const map=new Map();
  function add(raw,label=""){
    if(!raw)return;const first=String(raw).split(/\s*,\s*/)[0].trim().split(/\s+/)[0];const u=rgAbs(pageUrl,first);if(!rgAllowed(u)||!(/\.(?:jpe?g|png|webp|avif)(?:\?|$)/i.test(u)))return;
    const score=rgImageScore(u,label,model);const prev=map.get(u);if(!prev||score>prev.score)map.set(u,{url:u,label,score});
  }
  const og=$("meta[property='og:image']").attr("content");if(og)add(og,"og image");
  $("img").each((_,el)=>{const e=$(el),label=[e.attr("alt"),e.attr("title"),e.closest("figure,.gallery,.producto,.product,.item,div").first().text()].filter(Boolean).join(" ");for(const a of ["src","data-src","data-lazy-src","data-original","srcset","data-srcset"])add(e.attr(a),label)});
  $("source").each((_,el)=>{const e=$(el);add(e.attr("srcset")||e.attr("data-srcset"),"")});
  const raw=String(html||"");for(const m of raw.matchAll(/(?:https?:\/\/[^'\"<>\s]+|(?:\.\.\/|\.\/|\/)?[^'\"<>\s]+)\.(?:jpe?g|png|webp|avif)(?:\?[^'\"<>\s]*)?/gi))add(m[0],"");
  return [...map.values()].sort((a,b)=>b.score-a.score).map(x=>x.url);
}
async function rgAssets(model,kind,directUrl=""){
  const cacheKey=rgNorm(kind+"|"+model+"|"+directUrl);const hit=RESIGRES_ASSET_CACHE.get(cacheKey);if(hit&&Date.now()-hit.at<12*60*60*1000)return hit.data;
  const resolved=await rgResolveProductUrl(model,kind,directUrl);
  if(!resolved.url){
    const data={resolverVersion:RESIGRES_RESOLVER_VERSION,title:resolved.title||model,productUrl:"",categoryUrl:resolved.category,match:resolved.match,image:resolved.assetImage||"",images:resolved.assetImage?[resolved.assetImage]:[],technicalSheetUrl:"",technicalSheetLabel:"",installationGuideUrl:"",installationGuideLabel:"",model3dUrl:"",model3dLabel:""};
    if(!data.image)throw new Error(`Image Resigres introuvable pour ${model}`);RESIGRES_ASSET_CACHE.set(cacheKey,{at:Date.now(),data});return data;
  }
  const page=await rgGet(resolved.url),html=String(page.data||""),$=cheerio.load(html);
  const title=$("h1").first().text().trim()||String(model||"");const images=rgExtractImages($,html,resolved.url,model),pdfs=[],models=[],guides=[];
  $("a[href]").each((_,el)=>{const a=$(el),u=rgAbs(resolved.url,a.attr("href")),label=a.text().replace(/\s+/g," ").trim();if(!rgAllowed(u))return;if(/\.pdf(?:\?|$)/i.test(u)){const row={url:u,label:label||decodeURIComponent(u.split("/").pop()||"Fiche technique")};(/guia|guide|manual|instal|mantenimiento/i.test(row.label+" "+u)?guides:pdfs).push(row)}else if(/\.(?:zip|dwg|dxf|stp|step|skp|3ds)(?:\?|$)/i.test(u))models.push({url:u,label:label||decodeURIComponent(u.split("/").pop()||"Fichier 3D")})});
  const technical=pdfs[0]||guides[0]||null,guide=guides[0]||null,model3d=models[0]||null;
  if(!images.length){const idx=await rgCategoryIndex(kind);let bestImage=null;for(const row of idx.categoryImages||[]){const score=rgScore(row.label+" "+row.url,model);if(!bestImage||score>bestImage.score)bestImage={...row,score}}if(bestImage?.score>=20)images.push(bestImage.url)}
  const data={resolverVersion:RESIGRES_RESOLVER_VERSION,title,productUrl:resolved.url,categoryUrl:resolved.category,match:resolved.match,image:images[0]||"",images:images.slice(0,12),technicalSheetUrl:technical?.url||"",technicalSheetLabel:technical?.label||"",installationGuideUrl:guide?.url||"",installationGuideLabel:guide?.label||"",model3dUrl:model3d?.url||"",model3dLabel:model3d?.label||""};
  if(!data.image&&!data.technicalSheetUrl&&!data.model3dUrl)throw new Error(`Page Resigres trouvée mais aucun asset exploitable pour ${model}`);
  RESIGRES_ASSET_CACHE.set(cacheKey,{at:Date.now(),data});return data;
}
app.get("/api/resigres-assets",async(req,res)=>{
  const model=String(req.query.model||"").trim(),kind=String(req.query.kind||"").trim(),productUrl=String(req.query.productUrl||"").trim();if(!model)return res.status(400).json({error:"Modèle Resigres requis"});
  try{const data=await rgAssets(model,kind,productUrl);res.set("Cache-Control","no-store");res.json(data)}catch(e){console.warn("[resigres-assets-v11.49]",model,kind,e.message);res.status(404).json({error:"Assets Resigres introuvables",detail:e.message})}
});
