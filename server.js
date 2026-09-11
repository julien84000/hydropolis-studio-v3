const express = require("express");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 10000;
app.use(express.json({limit:"2mb"}));
app.use(express.static(path.join(__dirname,"public")));

app.get("/api/health", (req,res) => res.json({
  ok:true, service:"Hydropolis Studio V3", time:new Date().toISOString()
}));

function absoluteUrl(base, value) {
  try { return new URL(value, base).href; } catch { return null; }
}
function scoreImage(url, alt, reference, finish) {
  const s = `${url||""} ${alt||""}`.toLowerCase();
  let score = 0;
  const ref = String(reference||"").toLowerCase().replace(/\.(ext|int).*$/,"").split(".")[0];
  if (ref && s.includes(ref)) score += 20;
  const f = String(finish||"").toLowerCase();
  if (f && s.includes(f)) score += 10;
  if (/product|prodot|gallery|zoom|large|hd/.test(s)) score += 3;
  if (/logo|icon|sprite|avatar/.test(s)) score -= 20;
  return score;
}

// Test endpoint: inspect an official manufacturer product page and return likely images.
// This deliberately does not use Google Images: official manufacturer is priority 1.
app.post("/api/manufacturer-images", async (req,res) => {
  const {manufacturerUrl, reference, finish} = req.body || {};
  if (!manufacturerUrl) return res.status(400).json({error:"manufacturerUrl requis"});
  try {
    const r = await axios.get(manufacturerUrl,{
      timeout:15000,
      headers:{"User-Agent":"Mozilla/5.0 HydropolisProductResearch/1.0"}
    });
    const $ = cheerio.load(r.data);
    const candidates = [];
    $("img").each((_,el)=>{
      const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src");
      const srcset = $(el).attr("srcset");
      const alt = $(el).attr("alt") || "";
      let u = src;
      if (srcset) {
        const last = srcset.split(",").pop().trim().split(/\s+/)[0];
        if (last) u = last;
      }
      const abs = absoluteUrl(manufacturerUrl,u);
      if (abs) candidates.push({url:abs,alt,score:scoreImage(abs,alt,reference,finish)});
    });
    const unique = [...new Map(candidates.map(x=>[x.url,x])).values()]
      .sort((a,b)=>b.score-a.score).slice(0,12);
    res.json({source:"manufacturer",manufacturerUrl,reference,finish,candidates:unique});
  } catch(e) {
    res.status(502).json({error:"Impossible d'analyser la fiche fabricant",detail:e.message});
  }
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log(`Hydropolis V3 on ${PORT}`));
