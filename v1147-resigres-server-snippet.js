/* V11.47_RESIGRES_OFFICIAL_ASSETS */
const RESIGRES_ASSET_CACHE=new Map();
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
function rgNorm(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&amp;/g," ").replace(/[^a-z0-9]+/g," ").trim()}
function rgCore(v){
  const stop=new Set(["resigres","receveur","plato","ducha","extraplano","plan","vasque","encimera","bano","suspendida","suspendidas","mueble","lavabo","banera","baignoire","mobiliario","meuble","espejo","miroir","complemento","contract","cf","sf","standard","estandar"]);
  return rgNorm(v).split(/\s+/).filter(x=>x&&!stop.has(x));
}
function rgScore(title,model){
  const hay=rgNorm(title),tokens=rgCore(model);if(!tokens.length)return 0;
  let score=0;for(const t of tokens){if(hay.includes(t))score+=30;else score-=18}
  const full=rgNorm(model).replace(/\b(contract|cf|sf)\b/g,"").replace(/\s+/g," ").trim();if(full&&hay.includes(full))score+=80;
  if(/\bcontract\b/.test(rgNorm(model))&&/\bcontract\b/.test(hay))score+=20;
  return score;
}
function rgAbs(base,href){try{return new URL(String(href||""),base).href}catch{return ""}}
function rgAllowed(url){try{const u=new URL(url);return /^https?:$/.test(u.protocol)&&/(^|\.)resigres\.com$/i.test(u.hostname)}catch{return false}}
function rgExtractProductCandidates(html,base){
  const $=cheerio.load(String(html||""));const out=[];const seen=new Set();
  function add(url,label=""){
    const abs=rgAbs(base,url);if(!abs||!rgAllowed(abs)||!/producto\.php\?id=\d+/i.test(abs)||seen.has(abs))return;seen.add(abs);out.push({url:abs,label:String(label||"").trim()});
  }
  $("a[href]").each((_,el)=>{const a=$(el);add(a.attr("href"),[a.text(),a.attr("title"),a.find("img").attr("alt")].filter(Boolean).join(" "))});
  $("[onclick]").each((_,el)=>{const e=$(el),raw=String(e.attr("onclick")||"");const m=raw.match(/producto\.php\?id=\d+[^'\"\s)]*/i);if(m)add(m[0].replace(/&amp;/g,"&"),[e.text(),e.attr("title"),e.find("img").attr("alt")].filter(Boolean).join(" "))});
  const raw=String(html||"");for(const m of raw.matchAll(/producto\.php\?id=\d+(?:&amp;|&)origen=[^'\"\s<>]+/gi))add(m[0].replace(/&amp;/g,"&"),"");
  return out;
}
async function rgGet(url,timeout=16000){return safeRemoteGet(url,{timeout,maxContentLength:5*1024*1024,maxBodyLength:5*1024*1024,headers:{"User-Agent":"Mozilla/5.0","Accept-Language":"es-ES,es;q=0.9,fr;q=0.8,en;q=0.6","Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"}})}
async function rgResolveProductUrl(model,kind){
  const category=RESIGRES_CATEGORY_URLS[kind]||RESIGRES_CATEGORY_URLS.accessory;const page=await rgGet(category);const candidates=rgExtractProductCandidates(page.data,category);
  let ranked=candidates.map(c=>({...c,score:rgScore(c.label,model)})).sort((a,b)=>b.score-a.score);
  if(ranked[0]?.score>=30)return {url:ranked[0].url,match:"category-label",category};
  const shortlist=ranked.length?ranked.slice(0,18):candidates.slice(0,18);let best=null;
  for(let i=0;i<shortlist.length;i+=4){
    const batch=shortlist.slice(i,i+4);const results=await Promise.all(batch.map(async c=>{try{const p=await rgGet(c.url,12000),$=cheerio.load(String(p.data||"")),title=$("h1").first().text().trim()||$("title").text().trim();return {...c,title,score:rgScore(title,model)}}catch{return {...c,title:"",score:-999}}}));
    for(const x of results){if(!best||x.score>best.score)best=x}if(best?.score>=90)break;
  }
  if(best?.score>=20)return {url:best.url,match:"product-title",category};
  throw new Error(`Produit Resigres introuvable pour ${model}`);
}
function rgAssetScore(url,model){const n=rgNorm(url),tokens=rgCore(model);let s=/producto/i.test(n)?20:0;for(const t of tokens)if(n.includes(t))s+=25;if(/logo|icon|bandera|flag|social|cookie/i.test(n))s-=100;return s}
async function rgAssets(model,kind){
  const cacheKey=rgNorm(kind+"|"+model);const hit=RESIGRES_ASSET_CACHE.get(cacheKey);if(hit&&Date.now()-hit.at<12*60*60*1000)return hit.data;
  const resolved=await rgResolveProductUrl(model,kind),page=await rgGet(resolved.url),$=cheerio.load(String(page.data||""));
  const title=$("h1").first().text().trim()||String(model||"");const images=new Set(),pdfs=[],models=[],guides=[];
  const og=$("meta[property='og:image']").attr("content");if(og&&rgAllowed(rgAbs(resolved.url,og)))images.add(rgAbs(resolved.url,og));
  $("img[src]").each((_,el)=>{const u=rgAbs(resolved.url,$(el).attr("src"));if(rgAllowed(u)&&/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(u)&&/\/images\//i.test(u))images.add(u)});
  $("a[href]").each((_,el)=>{const a=$(el),u=rgAbs(resolved.url,a.attr("href")),label=a.text().replace(/\s+/g," ").trim();if(!rgAllowed(u))return;if(/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(u))images.add(u);else if(/\.pdf(?:\?|$)/i.test(u)){const row={url:u,label:label||decodeURIComponent(u.split("/").pop()||"Fiche technique")};(/guia|guide|manual|instal|mantenimiento/i.test(row.label+" "+u)?guides:pdfs).push(row)}else if(/\.(?:zip|dwg|dxf|stp|step|skp|3ds)(?:\?|$)/i.test(u))models.push({url:u,label:label||decodeURIComponent(u.split("/").pop()||"Fichier 3D")})});
  const ordered=[...images].sort((a,b)=>rgAssetScore(b,model)-rgAssetScore(a,model));const technical=pdfs[0]||guides[0]||null;const guide=guides[0]||null;const model3d=models[0]||null;
  const data={title,productUrl:resolved.url,categoryUrl:resolved.category,match:resolved.match,image:ordered[0]||"",images:ordered.slice(0,12),technicalSheetUrl:technical?.url||"",technicalSheetLabel:technical?.label||"",installationGuideUrl:guide?.url||"",installationGuideLabel:guide?.label||"",model3dUrl:model3d?.url||"",model3dLabel:model3d?.label||""};
  RESIGRES_ASSET_CACHE.set(cacheKey,{at:Date.now(),data});return data;
}
app.get("/api/resigres-assets",async(req,res)=>{const model=String(req.query.model||"").trim(),kind=String(req.query.kind||"").trim();if(!model)return res.status(400).json({error:"Modèle Resigres requis"});try{const data=await rgAssets(model,kind);res.set("Cache-Control","public, max-age=21600");res.json(data)}catch(e){console.warn("[resigres-assets]",model,kind,e.message);res.status(404).json({error:"Assets Resigres introuvables",detail:e.message})}});

