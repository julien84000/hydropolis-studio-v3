const express = require("express");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({limit:"4mb"}));
app.use(express.static(path.join(__dirname,"public")));

app.get("/api/health",(req,res)=>res.json({
  ok:true,
  service:"Hydropolis Studio V3.4",
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


let browserPromise=null;
async function getBrowser(){
  if(!browserPromise){
    browserPromise=puppeteer.launch({
      headless:true,
      args:[
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--no-zygote",
        "--disable-gpu"
      ]
    }).catch(e=>{browserPromise=null;throw e;});
  }
  return browserPromise;
}

async function dynamicFinishImage({manufacturerUrl,reference,finishCode,finish}){
  const browser=await getBrowser();
  const page=await browser.newPage();
  try{
    await page.setViewport({width:1440,height:1200,deviceScaleFactor:1});
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36");
    await page.goto(manufacturerUrl,{waitUntil:"networkidle2",timeout:30000});

    const result=await page.evaluate(async ({finishCode,finish})=>{
      const visible = el => {
        const s=getComputedStyle(el), r=el.getBoundingClientRect();
        return s.display!=="none" && s.visibility!=="hidden" && r.width>0 && r.height>0;
      };
      const norm=s=>String(s||"").trim().toLowerCase();
      const targets=[norm(finishCode),norm(finish)];

      const selects=[...document.querySelectorAll("select")].filter(visible);
      let chosen=null;
      for(const sel of selects){
        const options=[...sel.options];
        const opt=options.find(o=>{
          const t=norm(o.textContent);
          return targets.some(x=>x && (t===x || t.startsWith(x+" ") || t.includes(x)));
        });
        if(opt){chosen={sel,opt};break;}
      }
      if(!chosen) return {error:"Aucun sélecteur de finition correspondant n'a été trouvé."};

      const imageSnapshot=()=>[...document.images]
        .filter(visible)
        .map(img=>({
          src:img.currentSrc||img.src||"",
          w:img.naturalWidth||0,h:img.naturalHeight||0,
          area:(img.getBoundingClientRect().width||0)*(img.getBoundingClientRect().height||0)
        }))
        .filter(x=>x.src);

      const before=imageSnapshot();
      const beforeSet=new Set(before.map(x=>x.src));

      chosen.sel.value=chosen.opt.value;
      chosen.sel.dispatchEvent(new Event("input",{bubbles:true}));
      chosen.sel.dispatchEvent(new Event("change",{bubbles:true}));

      await new Promise(r=>setTimeout(r,2200));

      const after=imageSnapshot();
      const changed=after.filter(x=>!beforeSet.has(x.src) && x.w>=350 && x.h>=350)
        .sort((a,b)=>(b.area+b.w*b.h)-(a.area+a.w*a.h));

      if(changed[0]) return {url:changed[0].src,method:"changed-image",option:chosen.opt.textContent.trim()};

      // If WordPress/WooCommerce reuses the same element, find the largest current product image,
      // excluding finish swatches/icons and tiny UI images.
      const candidates=after
        .filter(x=>x.w>=500 && x.h>=500)
        .filter(x=>!/logo|icon|acciaio|nero\.jpg|rame\.jpg|flag|avatar/i.test(x.src))
        .sort((a,b)=>(b.area+b.w*b.h)-(a.area+a.w*a.h));

      if(candidates[0]) return {url:candidates[0].src,method:"largest-after-selection",option:chosen.opt.textContent.trim()};
      return {error:"La finition a été sélectionnée mais aucune grande image produit n'a été détectée."};
    },{finishCode,finish});

    if(result.error) throw new Error(result.error);
    return result;
  }finally{
    await page.close().catch(()=>{});
  }
}

async function scrapeManufacturer({manufacturerUrl,reference,finishCode,finish}){
  const base=productBase(reference);

  // Priority 1: reproduce the user's real action on the official site:
  // open the product page, select the requested finish, then read the updated product image.
  try{
    const dyn=await dynamicFinishImage({manufacturerUrl,reference,finishCode,finish});
    if(dyn && dyn.url){
      return {
        manufacturerUrl,reference,finishCode,finish,base,
        best:{
          url:dyn.url,
          source:"manufacturer-browser-selection",
          score:500,
          finishMatch:"exact",
          selectedOption:dyn.option,
          method:dyn.method
        },
        candidates:[{
          url:dyn.url,
          source:"manufacturer-browser-selection",
          score:500,
          finishMatch:"exact",
          selectedOption:dyn.option,
          method:dyn.method
        }],
        note:`Photo officielle obtenue après sélection automatique de la finition ${dyn.option}.`
      };
    }
  }catch(browserError){
    console.warn("Dynamic finish lookup failed:",browserError.message);
  }
  const page=await axios.get(manufacturerUrl,{
    timeout:18000,
    maxRedirects:5,
    headers:{
      "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36",
      "Accept-Language":"en-US,en;q=0.9,it;q=0.8,fr;q=0.7"
    }
  });
  const $=cheerio.load(page.data);
  const candidates=[];

  // 1) WooCommerce variation data: this is the important part for Amphora.
  // The image shown by the page changes only after selecting BS / BB / BC.
  // WooCommerce normally embeds the variation -> image map in data-product_variations.
  $(".variations_form, form.variations_form").each((_,el)=>{
    let raw=$(el).attr("data-product_variations");
    if(!raw)return;
    try{
      raw=decodeHtmlEntities(raw);
      const variations=JSON.parse(raw);
      const terms=finishTerms(finishCode,finish);
      for(const v of variations){
        const txt=variationText(v);
        const url=variationImageUrl(v);
        if(!url || !isImageUrl(url))continue;
        const exact=terms.some(t=>txt===t || txt.includes(t));
        candidates.push({
          url:absoluteUrl(manufacturerUrl,url),
          source:"woocommerce-variation",
          score:exact?250:70,
          finishMatch:exact?"exact":"generic",
          variationId:v.variation_id||null,
          attributes:v.attributes||{}
        });
      }
    }catch(e){
      // Some WP setups escape the JSON twice.
      try{
        const variations=JSON.parse(decodeHtmlEntities(decodeURIComponent(raw)));
        const terms=finishTerms(finishCode,finish);
        for(const v of variations){
          const txt=variationText(v), url=variationImageUrl(v);
          if(!url || !isImageUrl(url))continue;
          const exact=terms.some(t=>txt===t || txt.includes(t));
          candidates.push({
            url:absoluteUrl(manufacturerUrl,url),
            source:"woocommerce-variation",
            score:exact?250:70,
            finishMatch:exact?"exact":"generic",
            variationId:v.variation_id||null,
            attributes:v.attributes||{}
          });
        }
      }catch{}
    }
  });

  // 2) Official Download area > IMAGE.
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

  // 3) Visible product images on the official page.
  $("img").each((_,el)=>{
    const $img=$(el);
    const alt=($img.attr("alt")||"").toLowerCase();
    const title=($img.attr("title")||"").toLowerCase();
    for(const attr of ["data-large_image","data-zoom-image","data-original","data-src","src"]){
      const href=absoluteUrl(manufacturerUrl,$img.attr(attr));
      if(!href || !isImageUrl(href))continue;
      const text=(href+" "+alt+" "+title).toLowerCase();
      if(/logo|icon|sprite|avatar|flag|placeholder|loading|acciaio\.jpg|nero\.jpg|rame\.jpg/.test(text))continue;
      let score=10;
      if(text.includes(base.toLowerCase()))score+=35;
      if(text.includes(String(finishCode||"").toLowerCase()))score+=20;
      if(/product|prodot|zoom|large|gallery/.test(text))score+=5;
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

  const best=sorted[0]||null;
  return {
    manufacturerUrl,reference,finishCode,finish,base,
    best,
    candidates:sorted.slice(0,16),
    note:best
      ?(best.finishMatch==="exact"
        ?"Photo officielle de la variation correspondant à la finition sélectionnée."
        :"Photo officielle trouvée, mais la finition exacte n'a pas pu être certifiée.")
      :"Aucune photo officielle exploitable trouvée."
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
app.listen(PORT,"0.0.0.0",()=>console.log(`Hydropolis V3.4 on ${PORT}`));
