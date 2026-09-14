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
  const stop=new Set(["coalbrook","chrome","brushed","nickel","brass","gunmetal","bathroom","uk","with","and","the","for","fixed"]);
  return normalizeToken(s).split(/[^a-z0-9]+/).filter(x=>x.length>2&&!stop.has(x));
}
function similarityScore(a,b){
  const A=new Set(productWords(a)), B=new Set(productWords(b));
  if(!A.size||!B.size) return 0;
  let hit=0; for(const x of A) if(B.has(x)) hit++;
  return hit/Math.max(1,Math.min(A.size,B.size));
}
function coalbrookRangeSlug(collection){
  const map={
    bank:"bank",domo:"domo",decca:"decca",zurich:"zurich",
    "shower and bath":"shower-and-bath",accessories:"accessories",
    bay:"bay",mainstream:"mainstream"
  };
  return map[normalizeToken(collection||"")]||"";
}
async function fetchCoalbrookPage(url){
  const r=await axios.get(url,{
    timeout:22000,maxRedirects:5,validateStatus:x=>x>=200&&x<400,
    headers:{
      "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36",
      "Accept-Language":"en-GB,en;q=0.9"
    }
  });
  return String(r.data||"");
}
function coalbrookProductLinks(html,baseUrl){
  const $=cheerio.load(html), seen=new Set(), out=[];
  $("a[href*='/product/']").each((_,el)=>{
    const href=absoluteUrl(baseUrl,$(el).attr("href"));
    if(!href||seen.has(href))return;
    seen.add(href);
    const card=$(el).closest("article,li,.product,.card,.product-item,div");
    out.push({
      href,
      text:(($(el).attr("aria-label")||"")+" "+($(el).attr("title")||"")+" "+$(el).text()+" "+card.text()).trim()
    });
  });
  return out;
}

async function fetchCatalanoPage(url){
  const r=await axios.get(url,{timeout:22000,maxRedirects:5,validateStatus:x=>x>=200&&x<400,headers:{"User-Agent":"Mozilla/5.0","Accept-Language":"en-GB,en;q=0.9"}});
  return String(r.data||"");
}
function catalanoProductLinks(html,baseUrl){
  const $=cheerio.load(html),seen=new Set(),out=[];
  $("a[href*='/products/']").each((_,el)=>{
    const href=absoluteUrl(baseUrl,$(el).attr("href"));
    if(!href||seen.has(href))return; seen.add(href);
    out.push({href,text:(($(el).attr("title")||"")+" "+$(el).text()).trim()});
  });
  return out;
}
async function resolveCatalanoProductUrl(manufacturerUrl,reference,originalDescription,designation,collection){
  const ref=String(reference||"").replace(/\D/g,"");
  const base=ref.slice(0,6);
  const coll=normalizeToken(collection||"");
  const slug=coll.replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const starts=[];
  if(slug && !/accessori vari|vasca/.test(coll)) starts.push(`https://www.catalano.it/en/all-collections/${slug}/`);
  const text=normalizeToken((originalDescription||"")+" "+(designation||""));
  if(/shower tray|receveur|doccia/.test(text)) starts.push("https://www.catalano.it/en/shower-trays/");
  else if(/bathtub|baignoire|vasca/.test(text)) starts.push("https://www.catalano.it/en/bathtubs/");
  else if(/wc|bidet|toilet/.test(text)) starts.push("https://www.catalano.it/en/wc-and-bidet/");
  else if(/washbasin|lavabo|vasque/.test(text)) starts.push("https://www.catalano.it/en/washbasins/");
  starts.push(manufacturerUrl||"https://www.catalano.it/en/");
  const tried=new Set();
  for(const start of starts){
    if(!start||tried.has(start))continue; tried.add(start);
    try{
      const html=await fetchCatalanoPage(start);
      const links=catalanoProductLinks(html,start).map(x=>({...x,score:similarityScore(originalDescription||designation,x.text)})).sort((a,b)=>b.score-a.score);
      for(const item of links.slice(0,18)){
        try{
          const ph=await fetchCatalanoPage(item.href);
          const body=normalizeToken(cheerio.load(ph)("body").text());
          const digits=body.replace(/\D/g,"");
          if((ref&&digits.includes(ref)) || (base&&digits.includes(base))) return item.href;
        }catch{}
      }
    }catch{}
  }
  return manufacturerUrl;
}

async function resolveManufacturerProductUrl(manufacturerUrl,reference,originalDescription,designation,collection){
  if(/catalano\.it/i.test(manufacturerUrl)) return resolveCatalanoProductUrl(manufacturerUrl,reference,originalDescription,designation,collection);
  if(!/coalbrookuk\.co\.uk/i.test(manufacturerUrl)) return manufacturerUrl;

  const base=String(reference||"").toUpperCase().replace(/(?:CP|GM|BB|BN)$/,"");
  const wantedCollection=normalizeToken(collection||"");

  try{
    // 1) Coalbrook's own keyword search. The product page itself contains the real SKU.
    const searchUrl=`https://coalbrookuk.co.uk/products?keywords=${encodeURIComponent(base)}`;
    const searchHtml=await fetchCoalbrookPage(searchUrl);
    const searchLinks=coalbrookProductLinks(searchHtml,searchUrl);

    for(const item of searchLinks.slice(0,12)){
      try{
        const html=await fetchCoalbrookPage(item.href);
        const text=normalizeToken(cheerio.load(html)("body").text());
        if(text.includes(normalizeToken(base))){
          if(wantedCollection && ["bank","domo","decca","zurich"].includes(wantedCollection)){
            if(!text.includes(wantedCollection)) continue;
          }
          return item.href;
        }
      }catch{}
    }

    // 2) Fallback: only search inside the requested official range and compare names.
    const slug=coalbrookRangeSlug(collection);
    const catalogue=slug
      ?`https://coalbrookuk.co.uk/range/${slug}`
      :"https://coalbrookuk.co.uk/products";
    const rangeHtml=await fetchCoalbrookPage(catalogue);
    let target=String(originalDescription||designation||"")
      .replace(/^Coalbrook\s+/i,"");
    if(collection){
      const safe=String(collection).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      target=target.replace(new RegExp("^"+safe+"\\s+","i"),"");
    }
    target=target.replace(/\s*-\s*(brushed brass|brushed nickel|chrome|gunmetal|matt white)\s*$/i,"");

    const options=coalbrookProductLinks(rangeHtml,catalogue).map(x=>({
      ...x,score:similarityScore(target,x.text)
    })).sort((a,b)=>b.score-a.score);

    for(const item of options.slice(0,10)){
      if(item.score<0.52) break;
      try{
        const html=await fetchCoalbrookPage(item.href);
        const text=normalizeToken(cheerio.load(html)("body").text());
        // Exact SKU always wins. Otherwise require a strong title match in the correct range.
        if(text.includes(normalizeToken(base)) || item.score>=0.82){
          if(wantedCollection && ["bank","domo","decca","zurich"].includes(wantedCollection) && !text.includes(wantedCollection)) continue;
          return item.href;
        }
      }catch{}
    }
    return "";
  }catch(e){
    console.error("[coalbrook-resolve]",e.message);
    return "";
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
  manufacturerUrl=await resolveManufacturerProductUrl(manufacturerUrl,reference,originalDescription,designation,collection);
  if(!manufacturerUrl){
    return {
      image:null, exact:false, drawing:null, technicalSheet:null, installationGuide:null,
      note:"Aucune photo Coalbrook certifiée : la fiche produit exacte n’a pas pu être identifiée sans ambiguïté."
    };
  }

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

  // La collection Coalbrook a déjà été imposée par la page de gamme officielle.


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
    if(/logo|icon|sprite|avatar|flag|placeholder|loading|swatch|favicon|chrome2|brushed-gunmetal|brushed-brass|brushed-nickel3/.test(low)) continue;
    if(/[?&](?:w|h)=50(?:&|$)/i.test(href)) continue;
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

  // Coalbrook: first look for the exact full SKU anywhere in the official page HTML.
  // This is stricter and more reliable than guessing from image order.
  if(/coalbrookuk\.co\.uk/i.test(manufacturerUrl)){
    const fullRef=String(reference||"").toUpperCase();
    const escaped=fullRef.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const rx=new RegExp(`https?:\\\\?\\/\\\\?\\/[^"'<>\\\\s]*${escaped}[^"'<>\\\\s]*\\.(?:jpe?g|png|webp)(?:\\\\?[^"'<>\\\\s]*)?`,"gi");
    for(const raw of (html.match(rx)||[])){
      let href=raw.replace(/\\\//g,"/").replace(/&amp;/g,"&");
      try{href=decodeURIComponent(href)}catch{}
      const low=href.toLowerCase();
      if(/swatch|colour|color|chrome2|brushed-gunmetal|brushed-brass|brushed-nickel3/.test(low)) continue;
      candidates.push({
        url:href,
        source:"coalbrook-exact-sku-image",
        score:10000,
        finishMatch:"exact",
        detectedFinishCode:requested||null,
        variationId:null,
        attributes:{reference:fullRef}
      });
    }
  }

  // Coalbrook: product pages expose the four real product images first, then four
  // circular finish swatches. The Excel reference can differ from the current web SKU,
  // so map the requested finish by the SKU suffix in the official image URL (CP/GM/BB/BN),
  // not by requiring the full Excel reference to appear in the filename.
  if(/coalbrookuk\.co\.uk/i.test(manufacturerUrl)){
    const coalFinish=String(requested||"").toUpperCase();
    $("img").each((_,el)=>{
      const $img=$(el);
      const alt=normalizeToken($img.attr("alt")||"");
      const title=normalizeToken($img.attr("title")||"");
      const attrs=["src","data-src","srcset","data-srcset"];
      for(const attr of attrs){
        const raw=$img.attr(attr)||"";
        for(const part of raw.split(",")){
          const candidate=part.trim().split(/\s+/)[0];
          const href=absoluteUrl(manufacturerUrl,candidate);
          if(!href || !/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(href)) continue;

          const low=href.toLowerCase();
          // Never use Coalbrook's circular colour chips as product photography.
          if(
            /(?:chrome2|brushed-gunmetal|brushed-brass|brushed-nickel3|colour|color|swatch)/i.test(low) ||
            /\b(?:chrome|gunmetal|brushed brass|brushed nickel)\s+colour\b/i.test(alt+" "+title) ||
            /[?&](?:w|h)=50(?:&|$)/i.test(href)
          ) continue;

          // Real Coalbrook product images use filenames such as DC1009BB-2000.png.
          const pathname=(()=>{try{return new URL(href).pathname}catch{return href}})();
          const filename=pathname.split("/").pop()||"";
          const m=filename.toUpperCase().match(/([A-Z0-9]+)(CP|GM|BB|BN)(?:[-_].*)?\.(?:JPE?G|PNG|WEBP)$/i);
          if(!m) continue;

          const detected=m[2].toUpperCase();
          const exact=coalFinish && detected===coalFinish;
          candidates.push({
            url:href,
            source:"coalbrook-product-image",
            score: exact ? 5000 : 500,
            finishMatch: exact ? "exact" : "generic",
            detectedFinishCode:detected,
            variationId:null,
            attributes:{}
          });
        }
      }
    });
  }

  // FICHES TECHNIQUES / SPEC SHEETS + NOTICE D'INSTALLATION.
  // Coalbrook expose "Spec sheet" ; Zucchetti expose "Technical sheet".
  let technicalSheet=null;
  let installationGuide=null;
  $("a").each((_,el)=>{
    const labelRaw=$(el).text().trim();
    const label=normalizeToken(labelRaw);
    const href=absoluteUrl(manufacturerUrl,$(el).attr("href"));
    if(!href) return;

    if(!technicalSheet && /\b(spec sheet|technical sheet|technical data sheet|fiche technique)\b/.test(label)){
      technicalSheet={
        url:href,
        label:labelRaw||"Fiche technique",
        type:isPdfUrl(href)?"pdf":"link",
        source:"official-download"
      };
    }

    if(!installationGuide && /\b(installation guide|installation manual|installation manual warnings|instructions|notice d installation)\b/.test(label)){
      installationGuide={
        url:href,
        label:labelRaw||"Notice d'installation",
        type:isPdfUrl(href)?"pdf":"link",
        source:"official-download"
      };
    }
  });

  // Zucchetti fallback: official technical sheets use the base reference as PDF filename.
  if(!technicalSheet && /zucchettidesign\.it/i.test(manufacturerUrl)){
    const zbase=String(reference||"").split(".")[0].toUpperCase();
    if(/^Z[A-Z0-9]+$/.test(zbase)){
      const candidate=`https://assets.zucchettidesign.it/uploads/downloads/pdf/${zbase}.pdf`;
      try{
        const head=await axios.get(candidate,{
          responseType:"arraybuffer",timeout:12000,maxRedirects:3,
          validateStatus:x=>x>=200&&x<300,
          headers:{"User-Agent":"Mozilla/5.0","Referer":"https://www.zucchettidesign.it/"}
        });
        const ct=String(head.headers["content-type"]||"");
        if(ct.includes("pdf") && head.data?.length>1000){
          technicalSheet={url:candidate,label:"Technical sheet",type:"pdf",source:"official-derived"};
        }
      }catch{}
    }
  }

  // DRAWING / DISEGNO / DESSIN TECHNIQUE.
  let drawing=null;
  $("a").each((_,el)=>{
    if(drawing) return;
    const label=normalizeToken($(el).text());
    const href=absoluteUrl(manufacturerUrl,$(el).attr("href"));
    if(!href) return;
    const isDrawing=/\b(2d drawing|dwg file|drawing|disegno|dessin|technical drawing|plan technique)\b/.test(label);
    if(isDrawing){
      drawing={
        url:href,
        label:$(el).text().trim()||"Drawing 2D",
        type:isPdfUrl(href)?"pdf":(isImageUrl(href)?"image":(/\.(dwg|dxf)(?:\?|$)/i.test(href)?"cad":"link")),
        source:"official-download"
      };
    }
  });

  const sorted=uniqueBest(candidates).filter(x=>x.url).sort((a,b)=>{
    if(a.finishMatch!==b.finishMatch) return a.finishMatch==="exact"?-1:1;
    return b.score-a.score;
  });

  const isAmphora=/amphoradesign\.it/i.test(manufacturerUrl);
  const isCoalbrook=/coalbrookuk\.co\.uk/i.test(manufacturerUrl);
  const exact=sorted.find(x=>x.finishMatch==="exact" &&
    (!isAmphora || x.source.startsWith("woocommerce-variation")) &&
    (!isCoalbrook || x.source==="coalbrook-product-image" || x.source==="coalbrook-exact-sku-image")
  )||null;
  const fallback=sorted.find(x=>x.finishMatch!=="exact")||null;
  let best=exact||fallback;

  // Catalano : certaines fiches officielles présentent deux vues produit utiles.
  // On conserve jusqu’à deux images distinctes afin que le dossier client les affiche ensemble.
  const isCatalano=/catalano\.it/i.test(manufacturerUrl);
  let productImages=isCatalano ? sorted.filter(x=>x.url).slice(0,2) : (best?[best]:[]);

  // Évite les images cassées : on rapatrie l'image officielle choisie côté serveur
  // et on la renvoie directement au navigateur sous forme data URL.
  async function embedOfficialImage(item){
    if(!item) return item;
    if(!/(?:coalbrookuk\.co\.uk|zucchettidesign\.it|assets\.zucchettidesign\.it|catalano\.it)/i.test(item.url||manufacturerUrl)) return item;
    try{
      const ir=await axios.get(item.url,{
        responseType:"arraybuffer",timeout:18000,maxRedirects:5,
        headers:{"User-Agent":"Mozilla/5.0","Referer":new URL(manufacturerUrl).origin+"/"}
      });
      const ct=String(ir.headers["content-type"]||"image/jpeg");
      if(ct.startsWith("image/") && ir.data && ir.data.length<9000000){
        return {...item,dataUrl:`data:${ct};base64,${Buffer.from(ir.data).toString("base64")}`};
      }
    }catch(e){console.warn("[manufacturer-image-embed]",e.message);}
    return item;
  }
  if(best) best=await embedOfficialImage(best);
  if(isCatalano){
    productImages=await Promise.all(productImages.map(embedOfficialImage));
    if(productImages.length) best=productImages[0];
  }else productImages=best?[best]:[];

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
    images:productImages,
    exactFound:!!exact,
    drawing,
    technicalSheet,
    installationGuide,
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
