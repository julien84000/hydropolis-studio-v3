/* V11.53_CONFIGURATORS_SIRA */
const V1153_CONFIG_CACHE=new Map();
function v53Norm(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()}
function v53Abs(base,href){try{return new URL(String(href||"").replace(/&amp;/g,"&"),base).href}catch{return ""}}
function v53Allowed(url,brand=""){
  try{
    const h=new URL(url).hostname.toLowerCase();
    if(/^TDA$/i.test(brand))return /(^|\.)tda\.it$/.test(h);
    if(/^Vismaravetro$/i.test(brand))return /(^|\.)vismaravetro\.it$/.test(h);
    if(/^Sira Concrete$/i.test(brand)||/^Sira$/i.test(brand))return /(^|\.)siraconcrete\.com$/.test(h);
    return /(^|\.)(tda\.it|vismaravetro\.it|siraconcrete\.com)$/.test(h);
  }catch{return false}
}
async function v53Get(url){
  return safeRemoteGet(url,{timeout:18000,maxContentLength:8*1024*1024,maxBodyLength:8*1024*1024,headers:{"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36","Accept-Language":"fr-FR,fr;q=0.9,en;q=0.8,it;q=0.7,es;q=0.6","Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Cache-Control":"no-cache"}})
}
function v53Images($,base,brand){
  const out=[],seen=new Set();
  function add(raw,label=""){
    if(!raw)return;const first=String(raw).split(",")[0].trim().split(/\s+/)[0];const u=v53Abs(base,first);if(!u||!v53Allowed(u,brand)||!/\.(?:jpe?g|png|webp|avif)(?:\?|$)/i.test(u)||seen.has(u))return;
    const txt=(u+" "+label).toLowerCase();if(/logo|icon|flag|bandera|social|cookie|spinner|arrow|flecha|placeholder/.test(txt))return;seen.add(u);out.push(u);
  }
  add($("meta[property='og:image']").attr("content"),"og");
  $("img").each((_,el)=>{const e=$(el),label=[e.attr("alt"),e.attr("title"),e.closest("figure,.gallery,.product,.item,.card,div").first().text()].filter(Boolean).join(" ");for(const a of ["src","data-src","data-lazy-src","data-original","srcset","data-srcset"])add(e.attr(a),label)});
  return out.slice(0,24);
}
function v53Docs($,base,brand){
  const pdf=[],other=[];const seen=new Set();
  $("a[href]").each((_,el)=>{const a=$(el),u=v53Abs(base,a.attr("href"));if(!u||!v53Allowed(u,brand)||seen.has(u))return;const label=v53Norm([a.text(),a.attr("title"),a.attr("aria-label")].filter(Boolean).join(" "));if(/\.pdf(?:\?|$)/i.test(u)){seen.add(u);pdf.push({url:u,label:label||decodeURIComponent(u.split("/").pop()||"PDF")})}else if(/\.(?:zip|dwg|dxf|stp|step|skp|3ds|rfa|ifc)(?:\?|$)/i.test(u)){seen.add(u);other.push({url:u,label:label||decodeURIComponent(u.split("/").pop()||"Fichier")})}});
  return {pdf,other};
}
function v53SectionList($,needles){
  const wanted=(needles||[]).map(x=>v53Norm(x).toLowerCase()),out=[];let start=null;
  $("h1,h2,h3,h4,h5,h6,strong,.title,.heading").each((_,el)=>{if(start)return;const t=v53Norm($(el).text()).toLowerCase();if(wanted.some(n=>t===n||t.includes(n)))start=$(el)});
  if(!start)return out;
  let n=start.next();let hops=0;
  while(n?.length&&hops++<16){if(/^H[1-6]$/i.test(n[0]?.tagName||"")&&v53Norm(n.text()))break;n.find("li,h5,h6,p,span").addBack("li,h5,h6,p").each((_,el)=>{const t=v53Norm($(el).text());if(t&&t.length<180&&!out.includes(t))out.push(t)});n=n.next()}
  return out.slice(0,30);
}
function v53TdaModels($,base){
  const rows=[],seen=new Set(),basePath=new URL(base).pathname.replace(/\/$/,"")+"/";
  $("a[href]").each((_,el)=>{const a=$(el),u=v53Abs(base,a.attr("href"));if(!u||!v53Allowed(u,"TDA"))return;let p;try{p=new URL(u).pathname}catch{return}if(!p.startsWith(basePath)||p===basePath)return;const rest=p.slice(basePath.length).replace(/^\/|\/$/g,"");if(!rest||rest.includes("/"))return;const label=v53Norm(a.text()||a.closest("article,.item,.card,li,div").first().text());if(seen.has(u))return;seen.add(u);rows.push({url:u,label:label||rest.replace(/-/g," "),code:(label.match(/\b[A-Z]{1,4}[-+][A-Z0-9+\-]+\b/)||[])[0]||""})});
  return rows;
}
function v53VismaraModels($,base){
  const rows=[],seen=new Set();
  $("a[href]").each((_,el)=>{const a=$(el),u=v53Abs(base,a.attr("href"));if(!u||!v53Allowed(u,"Vismaravetro")||!/\/model\//i.test(new URL(u).pathname)||seen.has(u))return;seen.add(u);let label=v53Norm([a.text(),a.attr("title"),a.find("img").attr("alt"),a.closest("article,.item,.card,li,div").first().text()].filter(Boolean).join(" "));const slug=decodeURIComponent(new URL(u).pathname.split("/").filter(Boolean).pop()||"");rows.push({url:u,label:label||slug.replace(/-/g," "),code:""})});
  return rows;
}
function v53SiraProducts($,base){
  const rows=[],seen=new Set();
  $("a[href]").each((_,el)=>{const a=$(el),u=v53Abs(base,a.attr("href"));if(!u||!v53Allowed(u,"Sira Concrete")||!/\/producto\//i.test(new URL(u).pathname)||seen.has(u))return;const path=new URL(u).pathname;if(/\/producto\/?$/i.test(path))return;let label=v53Norm(a.text()||a.closest("article,.product,.type-product,li,div").first().find("h2,h3,h4").first().text());if(!label||/seleccionar|select|choisir|ver mas|voir/i.test(label)){label=v53Norm(a.closest("article,.product,.type-product,li,div").first().find("h2,h3,h4").first().text())}if(!label)return;seen.add(u);rows.push({url:u,label})});
  return rows;
}
app.get("/api/shower-configurator-collection",async(req,res)=>{
  const manufacturer=String(req.query.manufacturer||"").trim(),url=String(req.query.url||"").trim();if(!/^(TDA|Vismaravetro)$/i.test(manufacturer)||!v53Allowed(url,manufacturer))return res.status(400).json({error:"Collection paroi invalide"});
  const key=`collection|${manufacturer}|${url}`,hit=V1153_CONFIG_CACHE.get(key);if(hit&&Date.now()-hit.at<6*60*60*1000)return res.json(hit.data);
  try{const page=await v53Get(url),html=String(page.data||""),$=cheerio.load(html),models=/^TDA$/i.test(manufacturer)?v53TdaModels($,url):v53VismaraModels($,url),images=v53Images($,url,manufacturer);const data={manufacturer,collection:v53Norm($("h1,h2").first().text())||"",url,models,images};V1153_CONFIG_CACHE.set(key,{at:Date.now(),data});res.set("Cache-Control","no-store").json(data)}catch(e){res.status(502).json({error:"Impossible de lire la collection fabricant",detail:e.message})}
});
app.get("/api/shower-configurator-model",async(req,res)=>{
  const manufacturer=String(req.query.manufacturer||"").trim(),url=String(req.query.url||"").trim();if(!/^(TDA|Vismaravetro)$/i.test(manufacturer)||!v53Allowed(url,manufacturer))return res.status(400).json({error:"Modèle paroi invalide"});
  const key=`model|${manufacturer}|${url}`,hit=V1153_CONFIG_CACHE.get(key);if(hit&&Date.now()-hit.at<6*60*60*1000)return res.json(hit.data);
  try{
    const page=await v53Get(url),html=String(page.data||""),$=cheerio.load(html),txt=v53Norm($.root().text()),images=v53Images($,url,manufacturer),docs=v53Docs($,url,manufacturer);
    const h1=v53Norm($("h1").first().text()),h2=v53Norm($("h2").first().text()),title=[h2,h1].filter(Boolean).join(" · ")||v53Norm($("title").text());
    let minWidth=null,maxWidth=null,minHeight=null,maxHeight=null,standardHeight=null,installations=[],profiles=[],glasses=[],extras=[],characteristics=[];
    if(/^Vismaravetro$/i.test(manufacturer)){
      let m=txt.match(/L\s*:\s*Min\s*([0-9.,]+)\s*-\s*Max\s*([0-9.,]+)\s*cm/i);if(m){minWidth=Number(m[1].replace(",","."));maxWidth=Number(m[2].replace(",","."))}
      m=txt.match(/H\s*:\s*Min\s*([0-9.,]+)\s*-\s*Max\s*([0-9.,]+)\s*cm/i);if(m){minHeight=Number(m[1].replace(",","."));maxHeight=Number(m[2].replace(",","."))}
      m=txt.match(/H\s*standard\s*:\s*([0-9.,]+)\s*cm/i);if(m)standardHeight=Number(m[1].replace(",","."));
      const profileCandidates=["09 Matt Black","21 Bright Silver","23 Bright Gold","31 Satin Silver","32 Satin Bronze","33 Satin Gold","38 Moka","39 Metal Gun","84 Bond Copper","White","Grey","Black","Dove grey","Mocha"];
      profiles=profileCandidates.filter(x=>txt.toLowerCase().includes(x.replace(/^\d+\s*/,"").toLowerCase()));
      const glassCandidates=["Timeless 05","Clear 04","Reflecting 06","Clear grey 07","Satin 08","Extra-light 12","Bronze 03","Kathedral","Nuvola","Personal Glass"];
      glasses=glassCandidates.filter(x=>txt.toLowerCase().includes(x.replace(/\s\d+$/,"").toLowerCase()));
      extras=[...new Set([...(txt.match(/TPA Treatment[^.]{0,100}/ig)||[]),...(txt.match(/black rubber seals[^.]{0,100}/ig)||[]),...(txt.match(/Custom Made[^.]{0,80}/ig)||[])].map(v53Norm))].slice(0,12);
      characteristics=v53SectionList($,["CHARACTERISTICS","CARACTÉRISTIQUES","CARATTERISTICHE"]);
      const low=txt.toLowerCase();if(low.includes("recess"))installations.push("Niche");if(low.includes("corner"))installations.push("Angle");if(low.includes("wall"))installations.push("Mur");if(low.includes("small wall"))installations.push("Muret");
    }else{
      let m=txt.match(/(?:Height|Hauteur|Altezza)\s*:\s*([0-9.,]+)\s*cm/i);if(m){standardHeight=Number(m[1].replace(",","."));minHeight=standardHeight;maxHeight=standardHeight}
      const installCandidates=["NICHE","RECESS","ANGLE","CORNER","3 SIDES","3 CÔTÉS","SIDE","CENTRAL","CENTRE","WALK-IN"];
      installations=[...new Set(installCandidates.filter(x=>txt.toUpperCase().includes(x)).map(x=>x.replace("RECESS","NICHE").replace("CORNER","ANGLE").replace("3 SIDES","3 CÔTÉS").replace("SIDE","LATÉRAL").replace("CENTRAL","CENTRAL")))];
      const profileCandidates=["RAL9010","TCROM®","TCROM","TINOX®","TINOX","BIANCO","BLANC","NERO","NOIR","NCS S 9000-N","ORIGIN","INOX"];
      profiles=[...new Set(profileCandidates.filter(x=>txt.toUpperCase().includes(x.toUpperCase())))];
      const glassCandidates=["CLEAR","TRANSPARENT","SATINATO","SATINÉ","ACRYLIC SATIN","ACRYLIQUE SATIN","CINCILLA'","FLACK","FROZEN","BRONZE","GREY","GRIS"];
      glasses=[...new Set(glassCandidates.filter(x=>txt.toUpperCase().includes(x.toUpperCase())))];
      extras=v53SectionList($,["EXTRA AVAILABLE","EXTRA DISPONIBLES","EXTRA DISPONIBILI"]);
      characteristics=v53SectionList($,["CHARACTERISTICS","CARACTÉRISTIQUES","CARATTERISTICHE"]);
    }
    if(!profiles.length)profiles=["Standard fabricant"];
    if(!glasses.length)glasses=["Verre standard fabricant"];
    if(!installations.length)installations=["Configuration selon fiche fabricant"];
    const technical=docs.pdf.find(x=>/sheet|fiche|scheda|form|tech/i.test(x.label+x.url))||docs.pdf[0]||null;
    const installDoc=docs.pdf.find(x=>/install|montage|assembly/i.test(x.label+x.url))||null;
    const data={manufacturer,url,title,images,installations,profiles,glasses,extras,characteristics,minWidth,maxWidth,minHeight,maxHeight,standardHeight,technicalSheetUrl:technical?.url||"",technicalSheetLabel:technical?.label||"Fiche technique",installationGuideUrl:installDoc?.url||"",installationGuideLabel:installDoc?.label||"Notice installation",otherFiles:docs.other};
    V1153_CONFIG_CACHE.set(key,{at:Date.now(),data});res.set("Cache-Control","no-store").json(data)
  }catch(e){res.status(502).json({error:"Impossible de lire le modèle fabricant",detail:e.message})}
});
app.get("/api/sira-category",async(req,res)=>{
  const url=String(req.query.url||"").trim();if(!v53Allowed(url,"Sira Concrete"))return res.status(400).json({error:"Catégorie Sira invalide"});const key=`sira-cat|${url}`,hit=V1153_CONFIG_CACHE.get(key);if(hit&&Date.now()-hit.at<6*60*60*1000)return res.json(hit.data);
  try{const page=await v53Get(url),html=String(page.data||""),$=cheerio.load(html),products=v53SiraProducts($,url),images=v53Images($,url,"Sira Concrete"),data={url,title:v53Norm($("h1,h2").first().text()),products,images};V1153_CONFIG_CACHE.set(key,{at:Date.now(),data});res.set("Cache-Control","no-store").json(data)}catch(e){res.status(502).json({error:"Impossible de lire la catégorie Sira",detail:e.message})}
});
app.get("/api/sira-product",async(req,res)=>{
  const url=String(req.query.url||"").trim();if(!v53Allowed(url,"Sira Concrete")||!/\/producto\//i.test(url))return res.status(400).json({error:"Produit Sira invalide"});const key=`sira-product|${url}`,hit=V1153_CONFIG_CACHE.get(key);if(hit&&Date.now()-hit.at<6*60*60*1000)return res.json(hit.data);
  try{
    const page=await v53Get(url),html=String(page.data||""),$=cheerio.load(html),txt=v53Norm($.root().text()),images=v53Images($,url,"Sira Concrete"),docs=v53Docs($,url,"Sira Concrete"),title=v53Norm($("h1").first().text())||v53Norm($("title").text());
    const colors=[{code:"CH",label:"Charcoal"},{code:"CG",label:"Concrete Grey"},{code:"DC",label:"Dark Clay"},{code:"FG",label:"Fog Grey"},{code:"LS",label:"Light Sun"},{code:"MI",label:"Mint"},{code:"MG",label:"Moss Green"},{code:"OB",label:"Ocean Blue"},{code:"PW",label:"Pearl White"},{code:"SP",label:"Salt Pink"},{code:"SA",label:"Sand"},{code:"TE",label:"Terracota"}].filter(c=>txt.toLowerCase().includes(c.label.toLowerCase())||txt.includes(`(${c.code})`));
    const specs=[];$("h4,h5,h6").each((_,el)=>{const k=v53Norm($(el).text());if(!k||k.length>80)return;const n=$(el).next();const v=v53Norm(n.text());if(v&&v.length<160&&!specs.some(x=>x.label===k))specs.push({label:k,value:v})});
    const optionTexts=[];$("h5,h6,p,strong").each((_,el)=>{const t=v53Norm($(el).text());if(t&&t.length>10&&t.length<240&&/(monta|mount|support|grifo|faucet|trou|hole|personali|custom|inclu|include)/i.test(t)&&!optionTexts.includes(t))optionTexts.push(t)});
    const technical=docs.pdf.find(x=>/spec|tech|ficha|fiche|sheet/i.test(x.label+x.url))||docs.pdf[0]||null;
    const dimMatch=txt.match(/(?:MEDIDAS|SIZES|DIMENSIONS?)\s+([Ø0-9][0-9 x×Ø.,\-–]+MM)/i);
    const weightMatch=txt.match(/(?:PESO|WEIGHT|POIDS)\s+([0-9.,]+\s*KG)/i),capacityMatch=txt.match(/(?:CAPACIDAD|CAPACITY|CAPACITÉ)\s+([0-9.,]+\s*L)/i);
    const data={url,title,images,colors:colors.length?colors:[{code:"CH",label:"Charcoal"},{code:"CG",label:"Concrete Grey"},{code:"DC",label:"Dark Clay"},{code:"FG",label:"Fog Grey"},{code:"LS",label:"Light Sun"},{code:"MI",label:"Mint"},{code:"MG",label:"Moss Green"},{code:"OB",label:"Ocean Blue"},{code:"PW",label:"Pearl White"},{code:"SP",label:"Salt Pink"},{code:"SA",label:"Sand"},{code:"TE",label:"Terracota"}],specs:specs.slice(0,16),options:optionTexts.slice(0,12),dimensions:dimMatch?.[1]||"",weight:weightMatch?.[1]||"",capacity:capacityMatch?.[1]||"",technicalSheetUrl:technical?.url||"",technicalSheetLabel:technical?.label||"Fiche technique Sira",otherFiles:docs.other};
    V1153_CONFIG_CACHE.set(key,{at:Date.now(),data});res.set("Cache-Control","no-store").json(data)
  }catch(e){res.status(502).json({error:"Impossible de lire le produit Sira",detail:e.message})}
});
