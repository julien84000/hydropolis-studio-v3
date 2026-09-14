const express = require("express");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({limit:"4mb"}));
app.use(express.static(path.join(__dirname,"public")));

app.get("/api/health",(req,res)=>res.json({
  ok:true,
  service:"Hydropolis Studio V4.4",
  time:new Date().toISOString()
}));

function absoluteUrl(base,value){
  try{return new URL(value,base).href}catch{return null}
}
function productBase(reference){
  return String(reference||"")
    .toUpperCase()
    .replace(/\.(EXT|INT).*$/,"")
    .split(".")[0];
}
function isImageUrl(url){
  return /\.(jpe?g|png|webp)(?:\?|$)/i.test(String(url||""));
}
function uniqueBest(arr,key="url"){
  const m=new Map();
  for(const x of arr){
    if(!x || !x[key]) continue;
    const prev=m.get(x[key]);
    if(!prev || Number(x.score||0)>Number(prev.score||0)) m.set(x[key],x);
  }
  return [...m.values()];
}
async function imageExists(url,referer){
  try{
    const r=await axios.get(url,{
      responseType:"arraybuffer",
      timeout:9000,
      maxRedirects:4,
      validateStatus:s=>s>=200&&s<300,
      headers:{
        "User-Agent":"Mozilla/5.0",
        "Referer":referer||new URL(url).origin+"/"
      }
    });
    const ct=String(r.headers["content-type"]||"");
    return ct.startsWith("image/") && r.data && r.data.byteLength>3000;
  }catch{return false}
}
function decodeHtmlEntities(s){
  return String(s||"")
    .replace(/&quot;/g,'"')
    .replace(/&#039;/g,"'")
    .replace(/&amp;/g,"&")
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">");
}
function normalizeToken(s){
  return String(s||"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/&nbsp;/g," ")
    .replace(/[^a-z0-9]+/g," ")
    .trim();
}
function finishProfiles(){
  return {
    BS:["bs","brushed steel","acier brosse","acciaio spazzolato","stainless steel brushed"],
    BB:["bb","brushed black","black pvd","noir brosse","nero spazzolato","nero spazzolato pvd"],
    BC:["bc","brushed copper","copper pvd","cuivre brosse","rame spazzolato","rame spazzolato pvd"]
  };
}
function detectFinishCode(text){
  const n=" "+normalizeToken(text)+" ";
  const profiles=finishProfiles();
  for(const [code,terms] of Object.entries(profiles)){
    if(n.includes(" "+code.toLowerCase()+" ")) return code;
    for(const t of terms){
      const nt=normalizeToken(t);
      if(nt && n.includes(" "+nt+" ")) return code;
    }
  }
  return "";
}
function buildFinishOptionMap($){
  const valueToCode=new Map();
  const keyToCode=new Map();

  $("select").each((_,sel)=>{
    const name=$(sel).attr("name")||"";
    const id=$(sel).attr("id")||"";
    $(sel).find("option").each((__,opt)=>{
      const value=String($(opt).attr("value")||"").trim();
      const text=String($(opt).text()||"").trim();
      const code=detectFinishCode(text+" "+value);
      if(!code || !value) return;
      valueToCode.set(normalizeToken(value),code);
      if(name) keyToCode.set(normalizeToken(name)+"|"+normalizeToken(value),code);
      if(id) keyToCode.set(normalizeToken(id)+"|"+normalizeToken(value),code);
    });
  });
  return {valueToCode,keyToCode};
}
function variationFinishCode(v,finishOptionMap){
  const attrs=v?.attributes||{};
  for(const [key,value] of Object.entries(attrs)){
    const nk=normalizeToken(key);
    const nv=normalizeToken(value);
    if(!nv) continue;

    // Strongest signal: WooCommerce option value maps to visible option label BS/BB/BC.
    const mapped=finishOptionMap.keyToCode.get(nk+"|"+nv) || finishOptionMap.valueToCode.get(nv);
    if(mapped) return mapped;

    // Direct code / translated finish text in variation attributes.
    const direct=detectFinishCode(key+" "+value);
    if(direct) return direct;
  }
  return "";
}
function variationImageUrl(v){
  return v?.image?.full_src || v?.image?.src || v?.image?.url || "";
}
function productBase(reference){
  return String(reference||"")
    .toUpperCase()
    .replace(/\.(EXT|INT).*$/,"")
    .split(".")[0];
}
function isImageUrl(url){
  return /\.(jpe?g|png|webp)(?:\?|$)/i.test(String(url||""));
}
function isPdfUrl(url){
  return /\.pdf(?:\?|$)/i.test(String(url||""));
}



function productWords(s){
  const stop=new Set(["coalbrook","bank","domo","decca","zurich","chrome","brushed","nickel","brass","gunmetal","bathroom","uk","with","and","the","for","fixed","spout"]);
  return normalizeToken(s).split(/[^a-z0-9]+/).filter(x=>x.length>2&&!stop.has(x));
}
function similarityScore(a,b){
  const A=new Set(productWords(a)), B=new Set(productWords(b));
  if(!A.size||!B.size) return 0;
  let hit=0; for(const x of A) if(B.has(x)) hit++;
  return hit/Math.max(1,Math.min(A.size,B.size));
}
async function resolveManufacturerProductUrl(manufacturerUrl,reference,originalDescription,designation){
  if(!/coalbrookuk\.co\.uk/i.test(manufacturerUrl)) return manufacturerUrl;
  try{
    // Coalbrook's WordPress-style ?s= URL returns 404. Resolve from its official product catalogue instead.
    const catalogue="https://coalbrookuk.co.uk/products";
    const r=await axios.get(catalogue,{timeout:22000,headers:{"User-Agent":"Mozilla/5.0","Accept-Language":"en-GB,en;q=0.9"}});
    const $=cheerio.load(String(r.data||""));
    const target=originalDescription||designation||"";
    let best={url:"",score:0};
    $("a[href*='/product/']").each((_,el)=>{
      const href=absoluteUrl(catalogue,$(el).attr("href"));
      if(!href) return;
      const card=$(el).closest("article,li,.product,.card,div");
      const text=(($(el).attr("aria-label")||"")+" "+($(el).attr("title")||"")+" "+$(el).text()+" "+card.text()).trim();
      const score=similarityScore(target,text);
      if(score>best.score) best={url:href,score};
    });
    if(best.url && best.score>=0.45) return best.url;
    return catalogue;
  }catch{
    return "https://coalbrookuk.co.uk/products";
  }
}
function finishExactInText(text,finishCode,finish,reference){
  const n=normalizeToken(text);
  const f=normalizeToken(finish);
  const ref=normalizeToken(reference);
  if(ref && n.includes(ref)) return true;
  if(f && f.length>3 && n.includes(f)) return true;
  const aliases={
    CP:["chrome","chromed"],
    BN:["brushed nickel"],
    BB:["brushed brass"],
    GM:["gunmetal"],
    C3:["brushed nickel"],
    C50:["metal black"],
    C51:["brushed metal black"],
    N6:["matt black","matte black"],
    N1:["embossed matt black"],
    P21:["brushed pvd chocolate","pvd brushed chocolate"],
    P31:["brushed pvd british gold"],
    P41:["pvd brushed gold","brushed pvd gold"],
    P81:["brushed total black pvd","pvd brushed total black"],
    P91:["brushed pvd copper"]
  };
  return (aliases[String(finishCode||"").toUpperCase()]||[]).some(x=>n.includes(normalizeToken(x)));
}

async function scrapeManufacturer({manufacturerUrl,reference,finishCode,finish,designation,originalDescription,collection,manufacturer}){
  const base=productBase(reference);
  const requested=String(finishCode||"").toUpperCase();
  manufacturerUrl=await resolveManufacturerProductUrl(manufacturerUrl,reference,originalDescription,designation);

  const page=await axios.get(manufacturerUrl,{
    timeout:22000,
    maxRedirects:5,
    validateStatus:s=>s>=200&&s<400,
    headers:{
      "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36",
      "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language":"en-US,en;q=0.9,it;q=0.8,fr;q=0.7",
      "Cache-Control":"no-cache"
    }
  });

  const html=String(page.data||"");
  const $=cheerio.load(html);
  const candidates=[];
  const variationDebug=[];
  const finishOptionMap=buildFinishOptionMap($);

  function pushVariation(v,source="woocommerce-variation"){
    const url=variationImageUrl(v);
    if(!url || !isImageUrl(url)) return;

    const detected=variationFinishCode(v,finishOptionMap);
    const exact=!!requested && detected===requested;

    const item={
      url:absoluteUrl(manufacturerUrl,url),
      source,
      score:exact?1000:120,
      finishMatch:exact?"exact":"generic",
      detectedFinishCode:detected||null,
      variationId:v.variation_id||null,
      attributes:v.attributes||{}
    };
    candidates.push(item);

    variationDebug.push({
      variationId:v.variation_id||null,
      detectedFinishCode:detected||null,
      attributes:v.attributes||{},
      image:url
    });
  }

  function parseVariations(raw,source){
    if(!raw) return 0;
    const attempts=[raw,decodeHtmlEntities(raw),decodeHtmlEntities(decodeHtmlEntities(raw))];
    for(const value of attempts){
      try{
        const arr=JSON.parse(value);
        if(Array.isArray(arr)){
          for(const v of arr) pushVariation(v,source);
          return arr.length;
        }
      }catch{}
    }
    return 0;
  }

  $(".variations_form, form.variations_form").each((_,el)=>{
    parseVariations($(el).attr("data-product_variations"),"woocommerce-variation-attribute");
  });

  const rawPatterns=[
    /data-product_variations\s*=\s*"([^"]+)"/gi,
    /data-product_variations\s*=\s*'([^']+)'/gi
  ];
  for(const rx of rawPatterns){
    let m;
    while((m=rx.exec(html))) parseVariations(m[1],"woocommerce-variation-raw");
  }

  $("script").each((_,el)=>{
    const text=$(el).html()||"";
    if(!/variation_id/i.test(text) || !/"image"\s*:/i.test(text)) return;
    const chunks=text.match(/\[\s*\{[\s\S]{0,250000}?"variation_id"[\s\S]{0,250000}?\}\s*\]/g)||[];
    for(const chunk of chunks) parseVariations(chunk,"woocommerce-inline-script");
  });

  // Official product image/download are fallback only. They can never certify a finish.
  $("a").each((_,el)=>{
    const text=normalizeToken($(el).text());
    const href=absoluteUrl(manufacturerUrl,$(el).attr("href"));
    if(!href) return;
    if(text==="image" && isImageUrl(href)){
      candidates.push({
        url:href,
        source:"official-download",
        score:80,
        finishMatch:"generic",
        detectedFinishCode:null,
        variationId:null,
        attributes:{}
      });
    }
  });

  $("img").each((_,el)=>{
    const $img=$(el);
    const alt=($img.attr("alt")||"").toLowerCase();
    const title=($img.attr("title")||"").toLowerCase();
    for(const attr of ["data-large_image","data-zoom-image","data-original","data-src","src"]){
      const href=absoluteUrl(manufacturerUrl,$img.attr(attr));
      if(!href || !isImageUrl(href)) continue;
      const text=(href+" "+alt+" "+title).toLowerCase();
      if(/logo|icon|sprite|avatar|flag|placeholder|loading|acciaio\.jpg|nero\.jpg|rame\.jpg|swatch/.test(text)) continue;
      let score=10;
      if(text.includes(base.toLowerCase())) score+=35;
      const imageExact=finishExactInText(text,requested,finish,reference);
      if(imageExact) score+=700;
      candidates.push({
        url:href,
        source:"official-page",
        score,
        finishMatch:imageExact?"exact":"generic",
        detectedFinishCode:null,
        variationId:null,
        attributes:{}
      });
    }
  });


  // Modern manufacturer sites (notably Zucchetti) keep product images in JSON/script payloads.
  // Extract official asset URLs even when there is no rendered <img> in the server-side HTML.
  const rawUrlRx=/https?:\\?\/\\?\/[^"'<>\\\s]+?\.(?:jpe?g|png|webp)(?:\\?[^"'<>\\\s]*)?/gi;
  const rawMatches=html.match(rawUrlRx)||[];
  for(const raw of rawMatches){
    let href=raw.replace(/\\\//g,"/").replace(/&amp;/g,"&");
    try{href=decodeURIComponent(href)}catch{}
    if(!isImageUrl(href)) continue;
    const low=href.toLowerCase();
    if(/logo|icon|sprite|avatar|flag|placeholder|loading|swatch|favicon/.test(low)) continue;
    let score=25;
    if(/assets\.zucchettidesign\.it/i.test(href)) score+=70;
    if(low.includes(base.toLowerCase())) score+=120;
    if(low.includes(String(reference||"").toLowerCase())) score+=500;
    const exact=finishExactInText(href,requested,finish,reference);
    if(exact) score+=700;
    candidates.push({
      url:href,source:"official-script-asset",score,
      finishMatch:exact?"exact":"generic",
      detectedFinishCode:exact?requested:null,variationId:null,attributes:{}
    });
  }

  // Coalbrook: once the correct official product page is resolved, its four main product
  // images contain the exact SKU (e.g. BA1005BB-2000.png). This is a reliable finish match.
  if(/coalbrookuk\.co\.uk/i.test(manufacturerUrl)){
    $("img").each((_,el)=>{
      const $img=$(el);
      const attrs=["src","data-src","srcset","data-srcset"];
      for(const attr of attrs){
        const raw=$img.attr(attr)||"";
        for(const part of raw.split(",")){
          const candidate=part.trim().split(/\s+/)[0];
          const href=absoluteUrl(manufacturerUrl,candidate);
          if(!href || !/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(href)) continue;
          const low=href.toLowerCase();
          if(!low.includes(String(reference||"").toLowerCase())) continue;
          candidates.push({
            url:href,source:"coalbrook-sku-image",score:2000,
            finishMatch:"exact",detectedFinishCode:requested||null,
            variationId:null,attributes:{}
          });
        }
      }
    });
  }

  // DRAWING / DISEGNO / DESSIN TECHNIQUE.
  let drawing=null;
  $("a").each((_,el)=>{
    if(drawing) return;
    const label=normalizeToken($(el).text());
    const href=absoluteUrl(manufacturerUrl,$(el).attr("href"));
    if(!href) return;
    const isDrawing=/\b(2d drawing|drawing|disegno|dessin|technical drawing|plan technique)\b/.test(label);
    if(isDrawing && (isPdfUrl(href)||isImageUrl(href))){
      drawing={
        url:href,
        label:$(el).text().trim()||"DRAWING",
        type:isPdfUrl(href)?"pdf":"image",
        source:"official-download"
      };
    }
  });

  const sorted=uniqueBest(candidates).filter(x=>x.url).sort((a,b)=>{
    if(a.finishMatch!==b.finishMatch) return a.finishMatch==="exact"?-1:1;
    return b.score-a.score;
  });

  const isAmphora=/amphoradesign\.it/i.test(manufacturerUrl);
  const exact=sorted.find(x=>x.finishMatch==="exact" && (!isAmphora || x.source.startsWith("woocommerce-variation")))||null;
  const fallback=sorted.find(x=>x.finishMatch!=="exact")||null;
  const best=exact||fallback;

  console.log("[manufacturer-image]",JSON.stringify({
    reference,
    finishCode:requested,
    exact:!!exact,
    source:best?.source||null,
    variationId:best?.variationId||null,
    detectedFinishCode:best?.detectedFinishCode||null,
    drawing:!!drawing,
    candidates:sorted.length
  }));

  if(!exact){
    console.log("[manufacturer-variation-debug]",JSON.stringify({
      reference,
      finishCode:requested,
      optionValues:[...finishOptionMap.valueToCode.entries()].slice(0,20),
      variations:variationDebug.slice(0,12)
    }));
  }

  return {
    manufacturerUrl,reference,finishCode:requested,finish,base,
    best,
    exactFound:!!exact,
    drawing,
    candidates:sorted.slice(0,20),
    note:exact
      ?`Photo officielle fabricant correspondant à la finition ${requested}, associée à la variation fabricant.`
      :(best
        ?"Visuel officiel trouvé, mais aucune donnée fabricant ne permet de certifier cette finition."
        :"Aucune photo officielle exploitable trouvée.")
  };
}

app.post("/api/manufacturer-image",async(req,res)=>{
  const {manufacturerUrl,reference,finishCode,finish,designation,originalDescription,collection,manufacturer}=req.body||{};
  if(!manufacturerUrl||!reference) return res.status(400).json({error:"manufacturerUrl et reference requis"});
  try{
    res.json(await scrapeManufacturer({manufacturerUrl,reference,finishCode,finish,designation,originalDescription,collection,manufacturer}));
  }catch(e){
    res.status(502).json({
      error:"Impossible d'analyser la fiche fabricant",
      detail:e.message
    });
  }
});

app.get("/api/pdf-page-image",async(req,res)=>{
  const url=req.query.url;
  if(!url||!/^https?:\/\//i.test(url)) return res.status(400).send("URL invalide");
  try{
    const r=await axios.get(url,{
      responseType:"arraybuffer",
      timeout:22000,
      maxRedirects:5,
      headers:{
        "User-Agent":"Mozilla/5.0",
        "Referer":new URL(url).origin+"/"
      }
    });
    const ct=String(r.headers["content-type"]||"");
    if(!ct.includes("pdf") && !isPdfUrl(url)) return res.status(415).send("Ressource non PDF");

    const [{getDocument},{createCanvas}] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("@napi-rs/canvas")
    ]);

    const loadingTask=getDocument({
      data:new Uint8Array(r.data),
      disableWorker:true,
      useSystemFonts:true
    });
    const pdf=await loadingTask.promise;
    const page=await pdf.getPage(1);
    const baseViewport=page.getViewport({scale:1});
    const scale=Math.min(2.4, 2200/Math.max(baseViewport.width,baseViewport.height));
    const viewport=page.getViewport({scale});
    const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    await page.render({canvasContext:ctx,viewport}).promise;
    const png=await canvas.encode("png");
    res.set("Content-Type","image/png");
    res.set("Cache-Control","public, max-age=86400");
    res.send(png);
  }catch(e){
    console.error("[drawing-render]",e.message);
    res.status(502).send("Impossible de convertir le drawing");
  }
});

app.get("/api/image-proxy",async(req,res)=>{
  const url=req.query.url;
  if(!url||!/^https?:\/\//i.test(url)) return res.status(400).send("URL invalide");
  try{
    const r=await axios.get(url,{
      responseType:"arraybuffer",
      timeout:18000,
      maxRedirects:5,
      headers:{
        "User-Agent":"Mozilla/5.0",
        "Referer":new URL(url).origin+"/"
      }
    });
    const ct=String(r.headers["content-type"]||"image/jpeg");
    if(!ct.startsWith("image/")) return res.status(415).send("Ressource non image");
    res.set("Content-Type",ct);
    res.set("Cache-Control","public, max-age=86400");
    res.send(r.data);
  }catch(e){
    res.status(502).send("Image inaccessible");
  }
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log(`Hydropolis V4.4 on ${PORT}`));
