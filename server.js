const express = require("express");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({limit:"4mb"}));
app.use(express.static(path.join(__dirname,"public")));

app.get("/api/health",(req,res)=>res.json({
  ok:true,
  service:"Hydropolis Studio V3.8",
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
let browserLaunchLock=Promise.resolve();

async function getBrowser(){
  if(browserPromise) return browserPromise;

  browserLaunchLock=browserLaunchLock.then(async()=>{
    if(browserPromise) return browserPromise;
    const executablePath=await chromium.executablePath();

    // Small retry loop helps on Render if Chromium is momentarily locked (ETXTBSY).
    let lastError=null;
    for(let attempt=1;attempt<=3;attempt++){
      try{
        browserPromise=await puppeteer.launch({
          executablePath,
          headless:"shell",
          args:[
            ...chromium.args,
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--single-process"
          ],
          defaultViewport:{width:1440,height:1200}
        });
        browserPromise.on("disconnected",()=>{browserPromise=null;});
        return browserPromise;
      }catch(e){
        lastError=e;
        if(String(e?.message||"").includes("ETXTBSY")){
          await new Promise(r=>setTimeout(r,1200*attempt));
          continue;
        }
        throw e;
      }
    }
    throw lastError||new Error("Impossible de lancer Chromium");
  });

  return browserLaunchLock;
}

async function dynamicFinishImage({manufacturerUrl,reference,finishCode,finish}){
  const browser=await getBrowser();
  const page=await browser.newPage();

  try{
    await page.setViewport({width:1440,height:1200,deviceScaleFactor:1});
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36");
    page.setDefaultNavigationTimeout(25000);
    page.setDefaultTimeout(12000);

    // Amphora keeps background requests alive, so networkidle2 can time out forever.
    // DOMContentLoaded is enough; then we wait only for the controls we actually need.
    await page.goto(manufacturerUrl,{
      waitUntil:"domcontentloaded",
      timeout:25000
    });

    // Give late product scripts a brief moment to attach.
    await new Promise(r=>setTimeout(r,1200));

    // Wait until at least one select with a matching finish option exists.
    await page.waitForFunction(({finishCode,finish})=>{
      const norm=s=>String(s||"").trim().toLowerCase();
      const targets=[norm(finishCode),norm(finish)].filter(Boolean);
      const selects=[...document.querySelectorAll("select")];
      return selects.some(sel=>[...sel.options].some(o=>{
        const t=norm(o.textContent);
        return targets.some(x=>t===x||t.startsWith(x+" ")||t.includes(x));
      }));
    },{timeout:10000},{finishCode,finish});

    const before=await page.evaluate(()=>{
      const visible=el=>{
        const s=getComputedStyle(el),r=el.getBoundingClientRect();
        return s.display!=="none"&&s.visibility!=="hidden"&&r.width>80&&r.height>80;
      };
      return [...document.querySelectorAll("img")]
        .filter(visible)
        .map(img=>({
          src:img.currentSrc||img.src||"",
          w:img.naturalWidth||0,
          h:img.naturalHeight||0,
          area:(img.getBoundingClientRect().width||0)*(img.getBoundingClientRect().height||0)
        }))
        .filter(x=>x.src)
        .sort((a,b)=>b.area-a.area)
        .slice(0,8);
    });

    const chosen=await page.evaluate(({finishCode,finish})=>{
      const norm=s=>String(s||"").trim().toLowerCase();
      const targets=[norm(finishCode),norm(finish)].filter(Boolean);
      const visible=el=>{
        const s=getComputedStyle(el),r=el.getBoundingClientRect();
        return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0;
      };

      const selects=[...document.querySelectorAll("select")].filter(visible);
      let sel=null,opt=null;

      for(const s of selects){
        const found=[...s.options].find(o=>{
          const t=norm(o.textContent);
          return targets.some(x=>t===x||t.startsWith(x+" ")||t.includes(x));
        });
        if(found){sel=s;opt=found;break;}
      }

      if(!sel||!opt) return {error:"Aucun sélecteur de finition correspondant trouvé."};

      sel.value=opt.value;
      sel.dispatchEvent(new Event("input",{bubbles:true}));
      sel.dispatchEvent(new Event("change",{bubbles:true}));

      // Amphora/WordPress often relies on jQuery handlers.
      if(window.jQuery){
        try{
          window.jQuery(sel).val(opt.value).trigger("change");
          window.jQuery(sel).trigger("woocommerce_variation_select_change");
        }catch(e){}
      }

      return {
        option:opt.textContent.trim(),
        value:opt.value,
        name:sel.name||"",
        id:sel.id||""
      };
    },{finishCode,finish});

    if(chosen.error) throw new Error(chosen.error);

    // Wait for the product visual to repaint. Do not wait for the whole page/network.
    let changed=false;
    const beforeSet=new Set(before.map(x=>x.src));
    try{
      await page.waitForFunction((beforeUrls)=>{
        const visible=el=>{
          const s=getComputedStyle(el),r=el.getBoundingClientRect();
          return s.display!=="none"&&s.visibility!=="hidden"&&r.width>100&&r.height>100;
        };
        const imgs=[...document.querySelectorAll("img")].filter(visible);
        return imgs.some(img=>{
          const src=img.currentSrc||img.src||"";
          return src && !beforeUrls.includes(src);
        });
      },{timeout:4500},[...beforeSet]);
      changed=true;
    }catch{
      // Many product sites repaint the same image element or URL; a screenshot still captures the rendered result.
    }

    await new Promise(r=>setTimeout(r,1800));

    // Select the most likely product visual after the finish has been applied.
    const handle=await page.evaluateHandle(()=>{
      const visible=el=>{
        const s=getComputedStyle(el),r=el.getBoundingClientRect();
        return s.display!=="none"&&s.visibility!=="hidden"&&r.width>100&&r.height>100;
      };
      const bad=el=>{
        const t=((el.currentSrc||el.src||"")+" "+(el.alt||"")+" "+(el.className||"")).toLowerCase();
        return /logo|icon|flag|avatar|acciaio\.jpg|nero\.jpg|rame\.jpg|swatch|thumb|related|other-product/.test(t);
      };

      const imgs=[...document.querySelectorAll("img")]
        .filter(visible)
        .filter(img=>!bad(img));

      imgs.sort((a,b)=>{
        const ar=a.getBoundingClientRect(), br=b.getBoundingClientRect();
        const aScore=(ar.width*ar.height)+(a.naturalWidth*a.naturalHeight*0.05);
        const bScore=(br.width*br.height)+(b.naturalWidth*b.naturalHeight*0.05);
        return bScore-aScore;
      });

      return imgs[0]||null;
    });

    const el=handle.asElement();
    if(!el) throw new Error("Visuel produit rendu introuvable après sélection de la finition.");

    const png=await el.screenshot({type:"png",encoding:"base64"});
    await handle.dispose();

    return {
      dataUrl:`data:image/png;base64,${png}`,
      option:chosen.option,
      method:changed?"rendered-element-screenshot-after-src-change":"rendered-element-screenshot-after-selection"
    };
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
    if(dyn && dyn.dataUrl){
      return {
        manufacturerUrl,reference,finishCode,finish,base,
        best:{
          dataUrl:dyn.dataUrl,
          source:"manufacturer-browser-selection",
          score:500,
          finishMatch:"exact",
          selectedOption:dyn.option,
          method:dyn.method
        },
        candidates:[],
        note:`Visuel officiel capturé après sélection automatique de la finition ${dyn.option}.`
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
app.listen(PORT,"0.0.0.0",()=>console.log(`Hydropolis V3.8 on ${PORT}`));
