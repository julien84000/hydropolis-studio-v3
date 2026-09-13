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
  service:"Hydropolis Studio V3.9",
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
function unique(arr,key="url"){
  const m=new Map();
  for(const x of arr) if(x && x[key] && !m.has(x[key])) m.set(x[key],x);
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
function classify(url,base,finishCode){
  const s=String(url||"").toLowerCase();
  const b=String(base||"").toLowerCase();
  const f=String(finishCode||"").toLowerCase();
  if(b && f && s.includes(b) && (s.includes("-"+f)||s.includes("_"+f)||s.includes("."+f)||s.includes(b+f))){
    return "exact";
  }
  return "generic";
}

function decodeHtmlEntities(s){
  return String(s||"")
    .replace(/&quot;/g,'"')
    .replace(/&#039;/g,"'")
    .replace(/&amp;/g,"&")
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">");
}
function variationText(v){
  const attrs=v?.attributes||{};
  return Object.values(attrs).join(" ").toLowerCase();
}
function finishTerms(code,label){
  const map={
    BS:["bs","brushed steel","acier brossé","acciaio spazzolato"],
    BB:["bb","brushed black","black pvd","noir brossé","nero spazzolato"],
    BC:["bc","brushed copper","copper pvd","cuivre brossé","rame spazzolato"]
  };
  return [...(map[String(code||"").toUpperCase()]||[]),String(label||"").toLowerCase()].filter(Boolean);
}
function variationImageUrl(v){
  return v?.image?.full_src || v?.image?.src || v?.image?.url || "";
}


async function scrapeManufacturer({manufacturerUrl,reference,finishCode,finish}){
  const base=productBase(reference);

  // V3.9: no browser automation. Amphora is queried directly over HTTP.
  // This avoids Render/Chromium navigation timeouts and reads WooCommerce's
  // variation -> image mapping embedded in the official product page.
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
  const terms=finishTerms(finishCode,finish);

  function pushVariation(v,source="woocommerce-variation"){
    const txt=variationText(v);
    const url=variationImageUrl(v);
    if(!url || !isImageUrl(url)) return;

    const exact=terms.some(t=>{
      const x=String(t||"").trim().toLowerCase();
      if(!x) return false;
      return txt===x || txt.includes(x);
    });

    candidates.push({
      url:absoluteUrl(manufacturerUrl,url),
      source,
      score:exact?500:80,
      finishMatch:exact?"exact":"generic",
      variationId:v.variation_id||null,
      attributes:v.attributes||{}
    });
  }

  function parseVariations(raw,source){
    if(!raw) return 0;
    const attempts=[
      raw,
      decodeHtmlEntities(raw),
      decodeHtmlEntities(decodeHtmlEntities(raw))
    ];
    let count=0;

    for(const value of attempts){
      try{
        const arr=JSON.parse(value);
        if(Array.isArray(arr)){
          for(const v of arr){ pushVariation(v,source); count++; }
          if(count) return count;
        }
      }catch{}
    }
    return 0;
  }

  // 1) Canonical WooCommerce variations attribute.
  $(".variations_form, form.variations_form").each((_,el)=>{
    const raw=$(el).attr("data-product_variations");
    parseVariations(raw,"woocommerce-variation-attribute");
  });

  // 2) Parse the raw HTML too. This catches cases where Cheerio normalizes or
  // truncates entity-escaped JSON attributes.
  const rawPatterns=[
    /data-product_variations\s*=\s*"([^"]+)"/gi,
    /data-product_variations\s*=\s*'([^']+)'/gi
  ];
  for(const rx of rawPatterns){
    let m;
    while((m=rx.exec(html))){
      parseVariations(m[1],"woocommerce-variation-raw");
    }
  }

  // 3) Some WordPress/WooCommerce themes serialize the same variation array
  // inside an inline script instead of a form attribute.
  $("script").each((_,el)=>{
    const text=$(el).html()||"";
    if(!/variation_id/i.test(text) || !/"image"\s*:/i.test(text)) return;

    const arrayMatches=text.match(/\[\s*\{[\s\S]{0,250000}?"variation_id"[\s\S]{0,250000}?\}\s*\]/g)||[];
    for(const chunk of arrayMatches){
      parseVariations(chunk,"woocommerce-inline-script");
    }
  });

  // 4) Official Download area > IMAGE is kept as fallback only.
  $("a").each((_,el)=>{
    const $a=$(el);
    const text=$a.text().trim().replace(/\s+/g," ").toUpperCase();
    const href=absoluteUrl(manufacturerUrl,$a.attr("href"));
    if(!href)return;
    if(text==="IMAGE" && isImageUrl(href)){
      candidates.push({
        url:href,
        source:"official-download",
        score:100,
        finishMatch:classify(href,base,finishCode)
      });
    }
  });

  // 5) Visible official product images as a final non-certified fallback.
  $("img").each((_,el)=>{
    const $img=$(el);
    const alt=($img.attr("alt")||"").toLowerCase();
    const title=($img.attr("title")||"").toLowerCase();
    for(const attr of ["data-large_image","data-zoom-image","data-original","data-src","src"]){
      const href=absoluteUrl(manufacturerUrl,$img.attr(attr));
      if(!href || !isImageUrl(href))continue;
      const text=(href+" "+alt+" "+title).toLowerCase();
      if(/logo|icon|sprite|avatar|flag|placeholder|loading|acciaio\.jpg|nero\.jpg|rame\.jpg|swatch/.test(text))continue;
      let score=10;
      if(text.includes(base.toLowerCase()))score+=35;
      if(text.includes(String(finishCode||"").toLowerCase()))score+=20;
      candidates.push({
        url:href,
        source:"official-page",
        score,
        finishMatch:classify(href,base,finishCode)
      });
    }
  });

  const sorted=unique(candidates).filter(x=>x.url).sort((a,b)=>{
    if(a.finishMatch!==b.finishMatch)return a.finishMatch==="exact"?-1:1;
    return b.score-a.score;
  });

  // Only certify an image when the variation data itself identifies the requested finish.
  const exact=sorted.find(x=>x.finishMatch==="exact")||null;
  const fallback=sorted[0]||null;
  const best=exact||fallback;

  console.log("[manufacturer-image]",JSON.stringify({
    reference,
    finishCode,
    exact:!!exact,
    source:best?.source||null,
    variationId:best?.variationId||null,
    candidates:sorted.length
  }));

  return {
    manufacturerUrl,reference,finishCode,finish,base,
    best,
    exactFound:!!exact,
    candidates:sorted.slice(0,20),
    note:exact
      ?`Photo officielle Amphora correspondant à la finition ${finishCode} trouvée dans les données de variation WooCommerce.`
      :(best
        ?"Une photo officielle générique a été trouvée, mais la finition demandée n'est pas certifiée. Elle ne doit pas être présentée comme photo exacte."
        :"Aucune photo officielle exploitable trouvée.")
  };
}

app.post("/api/manufacturer-image",async(req,res)=>{
  const {manufacturerUrl,reference,finishCode,finish}=req.body||{};
  if(!manufacturerUrl||!reference) return res.status(400).json({error:"manufacturerUrl et reference requis"});
  try{
    res.json(await scrapeManufacturer({manufacturerUrl,reference,finishCode,finish}));
  }catch(e){
    res.status(502).json({
      error:"Impossible d'analyser la fiche fabricant",
      detail:e.message
    });
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
app.listen(PORT,"0.0.0.0",()=>console.log(`Hydropolis V3.9 on ${PORT}`));
