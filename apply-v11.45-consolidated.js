#!/usr/bin/env node
"use strict";
const fs=require("fs");
const path=require("path");
const cp=require("child_process");
const ROOT=__dirname;
const file=p=>path.join(ROOT,p);
const read=p=>fs.readFileSync(file(p),"utf8");
const write=(p,v)=>fs.writeFileSync(file(p),v,"utf8");
const exists=p=>fs.existsSync(file(p));
function fail(msg){throw new Error(`[V11.45] ${msg}`)}
function run(script){
  if(!exists(script))fail(`script historique manquant : ${script}`);
  const r=cp.spawnSync(process.execPath,[file(script)],{cwd:ROOT,stdio:"inherit"});
  if(r.status!==0)fail(`${script} a échoué (${r.status})`);
}
function appHas(marker){return exists("public/app.js")&&read("public/app.js").includes(marker)}
function hasV1143(){return appHas("V11.43_EDITABLE_QUOTE")||appHas("function renderQuoteEditor()")}
function ensureLegacy(){
  if(!appHas("V11.42_NATIVE_QUANTITY_V4"))run("apply-v11.42-native.js");
  if(!hasV1143())run("apply-v11.43-quote.js");
  if(!appHas("V11.44_PRESENTATION_LAYOUT"))run("apply-v11.44-layout.js");
  if(!appHas("V11.42_NATIVE_QUANTITY_V4"))fail("V11.42 quantité absente après consolidation");
  if(!hasV1143())fail("V11.43 devis éditable absent après consolidation");
  if(!appHas("V11.44_PRESENTATION_LAYOUT"))fail("V11.44 mise en page absente après consolidation");
}
function requireNewFiles(){
  for(const p of ["public/v1145-pricing.js","public/v1145.js","public/v1145.css","public/catalog_fioranese_2025.json","public/catalog_resigres_2026.json","public/resigres_2026_config.json"]){if(!exists(p))fail(`fichier V11.45 manquant : ${p}`)}
}
function patchApp(){
  let app=read("public/app.js");
  if(!app.includes("V11.45_BOOTSTRAP_DEFERRED")){
    const hits=(app.match(/(^|\n)bootstrap\(\);(?=\n|$)/g)||[]).length;
    if(hits!==1)fail(`appel bootstrap attendu une seule fois, trouvé ${hits}`);
    app=app.replace(/(^|\n)bootstrap\(\);(?=\n|$)/,`$1/* V11.45_BOOTSTRAP_DEFERRED: bootstrap is called by v1145.js after overrides */`);
  }
  write("public/app.js",app);
}
function patchIndex(){
  let html=read("public/index.html");
  html=html.replace(/Hydropolis Studio V11\.\d+(?:\.\d+)?/g,"Hydropolis Studio V11.45").replace(/<em>V11\.\d+(?:\.\d+)?<\/em>/g,"<em>V11.45</em>");
  if(!/v1145\.css/.test(html)){
    html=html.replace(/<link rel="stylesheet" href="styles\.css(?:\?[^\"]*)?">/,m=>m+'\n<link rel="stylesheet" href="v1145.css?v=11.45">');
  }
  if(!/v1145-pricing\.js/.test(html)){
    const rx=/<script src="app\.js(?:\?[^\"]*)?"><\/script>/;
    if(!rx.test(html))fail("balise app.js introuvable dans index.html");
    html=html.replace(rx,'<script src="app.js?v=11.45"></script>\n<script src="v1145-pricing.js?v=11.45"></script>\n<script src="v1145.js?v=11.45"></script>');
  }else{
    html=html.replace(/<script src="app\.js(?:\?[^\"]*)?"><\/script>/,'<script src="app.js?v=11.45"></script>');
  }
  write("public/index.html",html);
}
function patchServer(){
  let server=read("server.js");
  if(!server.includes('"fioranese.it"')){
    const needle='"catalano.it","recor.pt"';
    if(!server.includes(needle))fail("allowlist fabricant introuvable dans server.js");
    server=server.replace(needle,'"catalano.it","recor.pt","fioranese.it","resigres.com"');
  }
  server=server.replace(/Hydropolis Studio V11\.\d+(?:\.\d+)?/g,"Hydropolis Studio V11.45").replace(/Hydropolis V11\.\d+(?:\.\d+)?/g,"Hydropolis V11.45");
  write("server.js",server);
}
function patchManifests(){
  const fior=JSON.parse(read("public/catalog_fioranese_2025.json"));
  const res=JSON.parse(read("public/catalog_resigres_2026.json"));
  let m=JSON.parse(read("public/catalog_manifest.json"));
  m.chunks=Array.isArray(m.chunks)?m.chunks:[];
  m.chunks=m.chunks.filter(x=>!["catalog_fioranese_2025.json","catalog_resigres_2026.json"].includes(x.file));
  m.chunks.push({file:"catalog_fioranese_2025.json",label:"Fioranese 2025",count:fior.length});
  m.chunks.push({file:"catalog_resigres_2026.json",label:"Resigres 2026",count:res.length});
  m.version="11.45.0";m.engineVersion="11.45.0";m.total=m.chunks.reduce((s,x)=>s+(Number(x.count)||0),0);
  write("public/catalog_manifest.json",JSON.stringify(m,null,2)+"\n");

  let mm=JSON.parse(read("public/manufacturers_manifest.json"));
  mm.manufacturers=Array.isArray(mm.manufacturers)?mm.manufacturers:[];
  mm.manufacturers=mm.manufacturers.filter(x=>!["Fioranese","Resigres"].includes(x.name));
  mm.manufacturers.push({name:"Fioranese",catalog:"catalog_fioranese_2025.json",capabilities:["catalog","manufacturer-image","box-rounding-sqm","source-page"]});
  mm.manufacturers.push({name:"Resigres",catalog:"catalog_resigres_2026.json",config:"resigres_2026_config.json",capabilities:["catalog","manufacturer-image","integrated-configurator","source-page","manual-safe-pricing"]});
  mm.version="11.45.0";
  write("public/manufacturers_manifest.json",JSON.stringify(mm,null,2)+"\n");
}
function patchServiceWorker(){
  let sw=read("public/sw.js");
  sw=sw.replace(/hydropolis-v11-\d+(?:-\d+)?[^\"]*-shell/g,"hydropolis-v11-45-shell").replace(/hydropolis-v11-\d+(?:-\d+)?[^\"]*-catalogs/g,"hydropolis-v11-45-catalogs");
  const shellFiles=["/v1145.css","/v1145-pricing.js","/v1145.js","/resigres_2026_config.json"];
  for(const f of shellFiles){
    if(sw.includes(`"${f}"`))continue;
    const anchor='"/manufacturers_manifest.json"';
    if(!sw.includes(anchor))fail("SHELL service worker non reconnu");
    sw=sw.replace(anchor,`${anchor},"${f}"`);
  }
  write("public/sw.js",sw);
}
function patchPackage(){
  const pkg=JSON.parse(read("package.json"));
  pkg.version="11.45.0";
  pkg.description="Hydropolis Studio V11.45 - consolidation native, Fioranese 2025 et configurateur Resigres 2026";
  pkg.scripts=pkg.scripts||{};
  pkg.scripts.start="node server.js";
  const checks=["node --check server.js","node --check public/app.js","node --check public/sw.js","node --check public/v1145-pricing.js","node --check public/v1145.js"];
  pkg.scripts.check=checks.join(" && ");
  const newTests=["node tests/v11.45-pricing.js","node tests/v11.45-catalog-data.js","node tests/v11.45-consolidation-static.js"];
  const previous=String(pkg.scripts.test||"").split(" && ").filter(Boolean).filter(x=>!x.includes("v11.45-"));
  pkg.scripts.test=[...previous,...newTests].join(" && ");
  pkg.scripts.build="npm run check && npm test";
  write("package.json",JSON.stringify(pkg,null,2)+"\n");
}
function finalChecks(){
  const app=read("public/app.js"),idx=read("public/index.html"),server=read("server.js"),pkg=JSON.parse(read("package.json"));
  if(/(^|\n)bootstrap\(\);(?=\n|$)/.test(app))fail("bootstrap direct encore présent dans app.js");
  if(!app.includes("V11.45_BOOTSTRAP_DEFERRED"))fail("bootstrap différé absent");
  if(!idx.includes("v1145-pricing.js")||!idx.includes("v1145.js")||!idx.includes("v1145.css"))fail("assets V11.45 non inclus");
  if(!server.includes('"fioranese.it"')||!server.includes('"resigres.com"'))fail("domaines fabricants absents de l’allowlist");
  if(pkg.scripts.start!=="node server.js")fail("démarrage encore dépendant d’un patch");
  JSON.parse(read("public/catalog_manifest.json"));JSON.parse(read("public/manufacturers_manifest.json"));
}

ensureLegacy();
requireNewFiles();
patchApp();patchIndex();patchServer();patchManifests();patchServiceWorker();patchPackage();finalChecks();
console.log("Hydropolis Studio V11.45 consolidée : OK");
console.log("- V11.42 quantités, V11.43 devis éditable et V11.44 mise en page intégrés dans le code livré");
console.log("- démarrage direct node server.js, sans patch runtime");
console.log("- Fioranese 2025 + calcul des boîtes au m²");
console.log("- Resigres 2026 + configurateur sécurisé contre les prix ambigus");
