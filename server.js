const express = require("express");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 10000;
app.use(express.json({limit:"4mb"}));
app.use(express.static(path.join(__dirname,"public")));

app.get("/api/health", (req,res) => res.json({
  ok:true, service:"Hydropolis Studio V3.1", time:new Date().toISOString()
}));

function absoluteUrl(base, value) {
  try { return new URL(value, base).href; } catch { return null; }
}

const FINISH_TERMS = {
  BS:["bs","brushed steel","acier brossé","acciaio spazzolato","steel"],
  BB:["bb","brushed black","black brushed","noir brossé","nero spazzolato","black pvd"],
  BC:["bc","brushed copper","copper brushed","cuivre brossé","rame spazzolato","copper pvd"]
};

function normalizeReference(reference){
  return String(reference||"").toLowerCase().replace(/\.(ext|int).*$/,"").split(".")[0];
}

function scoreImage(url, alt, title, reference, finishCode, finishLabel) {
  const s = `${url||""} ${alt||""} ${title||""}`.toLowerCase();
  let score = 0;
  const ref = normalizeReference(reference);
  if (ref && s.includes(ref)) score += 35;

  const code = String(finishCode||"").toUpperCase();
  const terms = [...(FINISH_TERMS[code]||[]), String(finishLabel||"").toLowerCase()].filter(Boolean);
  if (terms.some(t => t && s.includes(t))) score += 25;

  if (/product|prodot|gallery|zoom|large|full|original|detail|hero/.test(s)) score += 5;
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url||"")) score += 3;
  if (/logo|icon|sprite|avatar|flag|placeholder|loading|footer|header/.test(s)) score -= 40;
  return score;
}

function collectCandidates($, manufacturerUrl, reference, finishCode, finishLabel){
  const candidates = [];
  const push = (raw, alt="", title="") => {
    const abs = absoluteUrl(manufacturerUrl, raw);
    if (!abs || !/^https?:/i.test(abs)) return;
    candidates.push({
      url:abs,
      alt,
      title,
      score:scoreImage(abs,alt,title,reference,finishCode,finishLabel)
    });
  };

  $('meta[property="og:image"], meta[name="twitter:image"]').each((_,el)=>push($(el).attr("content"),"social",""));
  $('link[rel="image_src"]').each((_,el)=>push($(el).attr("href"),"image_src",""));

  $("img").each((_,el)=>{
    const $el = $(el);
    const alt = $el.attr("alt") || "";
    const title = $el.attr("title") || "";
    const srcset = $el.attr("srcset") || $el.attr("data-srcset");
    if (srcset) {
      srcset.split(",").forEach(part=>push(part.trim().split(/\s+/)[0],alt,title));
    }
    ["src","data-src","data-lazy-src","data-original","data-large_image","data-zoom-image"].forEach(a=>{
      if ($el.attr(a)) push($el.attr(a),alt,title);
    });
  });

  $("a").each((_,el)=>{
    const href = $(el).attr("href");
    if (href && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(href)) push(href,$(el).attr("aria-label")||"","");
  });

  return [...new Map(candidates.map(x=>[x.url,x])).values()]
    .sort((a,b)=>b.score-a.score);
}

app.post("/api/manufacturer-images", async (req,res) => {
  const {manufacturerUrl, reference, finishCode, finish} = req.body || {};
  if (!manufacturerUrl) return res.status(400).json({error:"manufacturerUrl requis"});
  try {
    const r = await axios.get(manufacturerUrl,{
      timeout:18000,
      maxRedirects:5,
      headers:{
        "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36",
        "Accept-Language":"fr-FR,fr;q=0.9,en;q=0.8,it;q=0.7"
      }
    });
    const $ = cheerio.load(r.data);
    const candidates = collectCandidates($, manufacturerUrl, reference, finishCode, finish).slice(0,20);
    res.json({
      source:"manufacturer",
      manufacturerUrl,
      reference,
      finishCode,
      finish,
      candidates,
      best:candidates[0] || null
    });
  } catch(e) {
    res.status(502).json({error:"Impossible d'analyser la fiche fabricant",detail:e.message});
  }
});

app.get("/api/image-proxy", async (req,res) => {
  const url = req.query.url;
  if (!url || !/^https?:\/\//i.test(url)) return res.status(400).send("URL invalide");
  try {
    const r = await axios.get(url,{
      responseType:"arraybuffer",
      timeout:18000,
      maxRedirects:5,
      headers:{"User-Agent":"Mozilla/5.0","Referer":new URL(url).origin+"/"}
    });
    const ct = r.headers["content-type"] || "image/jpeg";
    if (!ct.startsWith("image/")) return res.status(415).send("La ressource n'est pas une image");
    res.set("Content-Type",ct);
    res.set("Cache-Control","public, max-age=86400");
    res.send(r.data);
  } catch(e) {
    res.status(502).send("Image inaccessible");
  }
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log(`Hydropolis V3.1 on ${PORT}`));
