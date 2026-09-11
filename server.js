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
  service:"Hydropolis Studio V3.2",
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

async function scrapeManufacturer({manufacturerUrl,reference,finishCode,finish}){
  const base=productBase(reference);
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

  // 1) Amphora and similar manufacturer sites: prioritize the official DOWNLOAD AREA > IMAGE link.
  $("a").each((_,el)=>{
    const $a=$(el);
    const text=$a.text().trim().replace(/\s+/g," ").toUpperCase();
    const href=absoluteUrl(manufacturerUrl,$a.attr("href"));
    if(!href) return;
    if(text==="IMAGE" && isImageUrl(href)){
      candidates.push({
        url:href,
        source:"official-download",
        score:100,
        finishMatch:classify(href,base,finishCode)
      });
    }
  });

  // 2) Product-page images. Exclude finish swatches/logos.
  $("img").each((_,el)=>{
    const $img=$(el);
    const alt=($img.attr("alt")||"").toLowerCase();
    const title=($img.attr("title")||"").toLowerCase();
    const attrs=["data-large_image","data-zoom-image","data-original","data-src","src"];
    for(const attr of attrs){
      const href=absoluteUrl(manufacturerUrl,$img.attr(attr));
      if(!href || !isImageUrl(href)) continue;
      const text=(href+" "+alt+" "+title).toLowerCase();
      if(/logo|icon|sprite|avatar|flag|placeholder|loading|acciaio\.jpg|nero\.jpg|rame\.jpg/.test(text)) continue;
      let score=10;
      if(text.includes(base.toLowerCase())) score+=35;
      if(text.includes(String(finishCode||"").toLowerCase())) score+=20;
      if(/product|prodot|zoom|large|gallery/.test(text)) score+=5;
      candidates.push({
        url:href,
        source:"official-page",
        score,
        finishMatch:classify(href,base,finishCode)
      });
    }
  });

  // 3) If the official download is generic, probe conservative filename variants
  // in the SAME manufacturer upload directory. We only accept a real image response.
  const official=candidates.sort((a,b)=>b.score-a.score)[0];
  if(official && official.url){
    try{
      const u=new URL(official.url);
      const dir=u.href.slice(0,u.href.lastIndexOf("/")+1);
      const ext=(u.pathname.match(/\.(jpe?g|png|webp)$/i)||["",".jpg"])[1];
      const probes=[
        `${base}-${finishCode}${ext}`,
        `${base}_${finishCode}${ext}`,
        `${base}.${finishCode}${ext}`,
        `${base}${finishCode}${ext}`
      ];
      for(const name of probes){
        const url=dir+name;
        if(await imageExists(url,manufacturerUrl)){
          candidates.push({
            url,
            source:"official-finish-file",
            score:140,
            finishMatch:"exact"
          });
          break;
        }
      }
    }catch{}
  }

  const sorted=unique(candidates).sort((a,b)=>{
    if(a.finishMatch!==b.finishMatch) return a.finishMatch==="exact"?-1:1;
    return b.score-a.score;
  });

  const best=sorted[0]||null;
  return {
    manufacturerUrl,reference,finishCode,finish,base,
    best,
    candidates:sorted.slice(0,12),
    note: best
      ? (best.finishMatch==="exact"
          ? "Photo officielle correspondant à la finition détectée."
          : "Photo officielle du produit trouvée, mais la finition exacte n'est pas explicitement identifiable dans le fichier fabricant.")
      : "Aucune photo officielle exploitable trouvée."
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
app.listen(PORT,"0.0.0.0",()=>console.log(`Hydropolis V3.2 on ${PORT}`));
