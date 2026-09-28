#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),cp=require("child_process");
const ROOT=__dirname,file=p=>path.join(ROOT,p),read=p=>fs.readFileSync(file(p),"utf8"),write=(p,v)=>fs.writeFileSync(file(p),v,"utf8"),exists=p=>fs.existsSync(file(p));
function fail(m){throw new Error(`[V11.53] ${m}`)}
function run(script){if(!exists(script))fail(`script manquant : ${script}`);const r=cp.spawnSync(process.execPath,[file(script)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`${script} a échoué (${r.status})`)}
if(!exists("public/app.js")||!exists("package.json"))fail("base Hydropolis introuvable");
if(String(JSON.parse(read("package.json")).version||"")!=="11.52.0")run("apply-v11.52-consolidated.js");
for(const p of ["public/v1153.js","public/v1153.css","public/catalog_sira_web.json","v1153-configurators-server-snippet.js"]){if(!exists(p))fail(`fichier V11.53 manquant : ${p}`)}
const sira=JSON.parse(read("public/catalog_sira_web.json"));if(sira.length!==5||sira.some(x=>x.manufacturer!=="Sira Concrete"||Number(x.purchaseDiscount)!==50))fail("catalogue Sira / remise 50 % incomplet");
let server=read("server.js");
if(!server.includes('"siraconcrete.com"')){
  if(server.includes('"tda.it"'))server=server.replace('"tda.it"','"tda.it","siraconcrete.com"');
  else if(server.includes('"vismaravetro.it"'))server=server.replace('"vismaravetro.it"','"vismaravetro.it","siraconcrete.com"');
  else fail("allowlist fabricant introuvable pour Sira");
}
const marker="/* V11.53_CONFIGURATORS_SIRA */",anchor='app.get("/api/image-proxy",async(req,res)=>{';
if(!server.includes(marker)){
  if(!server.includes(anchor))fail("point d’insertion image-proxy introuvable");
  server=server.replace(anchor,read("v1153-configurators-server-snippet.js").trim()+"\n"+anchor);
}
server=server.replace(/Hydropolis Studio V11\.52/g,"Hydropolis Studio V11.53").replace(/Hydropolis V11\.52/g,"Hydropolis V11.53");write("server.js",server);
let idx=read("public/index.html").replace(/Hydropolis Studio V11\.52/g,"Hydropolis Studio V11.53").replace(/<em>V11\.52<\/em>/g,"<em>V11.53</em>").replace(/\?v=11\.52/g,"?v=11.53");
if(!idx.includes("v1153.css"))idx=idx.replace(/<link rel="stylesheet" href="v1152\.css\?v=11\.53">/,m=>m+'\n<link rel="stylesheet" href="v1153.css?v=11.53">');
if(!idx.includes("v1153.js"))idx=idx.replace(/<script src="v1152\.js\?v=11\.53"><\/script>/,m=>m+'\n<script src="v1153.js?v=11.53"></script>');
write("public/index.html",idx);
let cm=JSON.parse(read("public/catalog_manifest.json"));cm.chunks=Array.isArray(cm.chunks)?cm.chunks:[];cm.chunks=cm.chunks.filter(x=>x.file!=="catalog_sira_web.json");cm.chunks.push({file:"catalog_sira_web.json",label:"Sira Concrete · vasques, plans et baignoires",count:sira.length});cm.version="11.53.0";cm.engineVersion="11.53.0";cm.total=cm.chunks.reduce((s,x)=>s+(Number(x.count)||0),0);write("public/catalog_manifest.json",JSON.stringify(cm,null,2)+"\n");
let mm=JSON.parse(read("public/manufacturers_manifest.json"));mm.manufacturers=Array.isArray(mm.manufacturers)?mm.manufacturers:[];mm.manufacturers=mm.manufacturers.filter(x=>x.name!=="Sira Concrete");mm.manufacturers.push({name:"Sira Concrete",catalog:"catalog_sira_web.json",capabilities:["catalog","official-site-configurator","official-site-image","official-technical-sheet","12-pigments","purchase-discount-50"]});for(const m of mm.manufacturers){if(m.name==="Vismaravetro"){m.capabilities=["catalog","official-site-image","official-model-configurator","dimensions-validation","profile-selection","glass-selection","options-selection","technical-doc-if-exposed","manual-2026-price-fallback"]}if(m.name==="TDA"){m.capabilities=["catalog","official-site-image","official-model-configurator","installation-selection","dimensions-validation","profile-selection","glass-selection","options-selection","technical-doc-if-exposed","manual-2026-price-fallback"]}}mm.version="11.53.0";write("public/manufacturers_manifest.json",JSON.stringify(mm,null,2)+"\n");
let sw=read("public/sw.js").replace(/hydropolis-v11-52-shell/g,"hydropolis-v11-53-shell").replace(/hydropolis-v11-52-catalogs/g,"hydropolis-v11-53-catalogs");for(const f of ["/v1153.css","/v1153.js","/catalog_sira_web.json"]){if(!sw.includes(`"${f}"`))sw=sw.replace('"/manufacturers_manifest.json"',`"/manufacturers_manifest.json","${f}"`)}write("public/sw.js",sw);
let pkg=JSON.parse(read("package.json"));pkg.version="11.53.0";pkg.description="Hydropolis Studio V11.53 - configurateurs parois TDA/Vismaravetro + Sira Concrete avec remise achat 50%";pkg.scripts.start="node server.js";const checks=String(pkg.scripts.check||"node --check server.js && node --check public/app.js && node --check public/sw.js").split(" && ").filter(Boolean).filter(x=>!x.includes("v1153.js"));checks.push("node --check public/v1153.js");pkg.scripts.check=checks.join(" && ");const prev=String(pkg.scripts.test||"").split(" && ").filter(Boolean).filter(x=>!x.includes("v11.53-"));pkg.scripts.test=[...prev,"node tests/v11.53-configurators.js","node tests/v11.53-static.js"].join(" && ");pkg.scripts.build="npm run check && npm test";write("package.json",JSON.stringify(pkg,null,2)+"\n");
for(const target of ["server.js","public/v1153.js"]){const r=cp.spawnSync(process.execPath,["--check",file(target)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`syntaxe invalide : ${target}`)}
for(const t of ["tests/v11.53-configurators.js","tests/v11.53-static.js"]){const r=cp.spawnSync(process.execPath,[file(t)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`${t} a échoué`)}
console.log("Hydropolis Studio V11.53 consolidée : OK");
console.log("- TDA : configurateur modèle / implantation / dimensions / profils / verres / options");
console.log("- Vismaravetro : configurateur modèle / dimensions / profils / verres / options");
console.log("- Sira Concrete : vasques, plans et baignoires depuis siraconcrete.com + fiches techniques + remise achat 50 %");
