#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),cp=require("child_process");
const ROOT=__dirname,file=p=>path.join(ROOT,p),read=p=>fs.readFileSync(file(p),"utf8"),write=(p,v)=>fs.writeFileSync(file(p),v,"utf8"),exists=p=>fs.existsSync(file(p));
function fail(m){throw new Error(`[V11.51] ${m}`)}
function run(script){if(!exists(script))fail(`script manquant : ${script}`);const r=cp.spawnSync(process.execPath,[file(script)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`${script} a échoué (${r.status})`)}
if(!exists("public/app.js")||!exists("package.json"))fail("base Hydropolis introuvable");
if(String(JSON.parse(read("package.json")).version||"")!=="11.50.0")run("apply-v11.50-consolidated.js");
for(const p of ["public/v1149-pricing.js","public/v1149.js","public/v1151.css","public/resigres_2026_config.json"]){if(!exists(p))fail(`fichier V11.51 manquant : ${p}`)}
const cfg=JSON.parse(read("public/resigres_2026_config.json"));if(cfg.version!=="2026-FR-v6")fail(`configuration Resigres V11.51 absente (${cfg.version||"sans version"})`);
const contracts=(cfg.models||[]).filter(x=>x.kind==="shower-tray").flatMap(x=>(x.pricingRules||[]).filter(r=>r.type==="sqm"));if(contracts.length<4||contracts.some(r=>r.billingMode!=="actual-sqm"||r.noTierRounding!==true))fail("règles Contract €/m² incomplètes");
let idx=read("public/index.html");idx=idx.replace(/Hydropolis Studio V11\.50/g,"Hydropolis Studio V11.51").replace(/<em>V11\.50<\/em>/g,"<em>V11.51</em>").replace(/\?v=11\.50/g,"?v=11.51");if(!idx.includes("v1151.css"))idx=idx.replace(/<link rel="stylesheet" href="v1150\.css\?v=11\.51">/,m=>m+'\n<link rel="stylesheet" href="v1151.css?v=11.51">');write("public/index.html",idx);
let sw=read("public/sw.js").replace(/hydropolis-v11-50-shell/g,"hydropolis-v11-51-shell").replace(/hydropolis-v11-50-catalogs/g,"hydropolis-v11-51-catalogs");if(!sw.includes('"/v1151.css"'))sw=sw.replace('"/manufacturers_manifest.json"','"/manufacturers_manifest.json","/v1151.css"');write("public/sw.js",sw);
let cm=JSON.parse(read("public/catalog_manifest.json"));cm.version="11.51.0";cm.engineVersion="11.51.0";write("public/catalog_manifest.json",JSON.stringify(cm,null,2)+"\n");
let mm=JSON.parse(read("public/manufacturers_manifest.json"));mm.version="11.51.0";for(const m of mm.manufacturers||[]){if(m.name==="Resigres"){m.capabilities=m.capabilities||[];for(const c of ["contract-actual-sqm-pricing","contract-minimum-billing","contract-no-tier-rounding","contract-basin-top-per-cm-pricing"]){if(!m.capabilities.includes(c))m.capabilities.push(c)}}}write("public/manufacturers_manifest.json",JSON.stringify(mm,null,2)+"\n");
let pkg=JSON.parse(read("package.json"));pkg.version="11.51.0";pkg.description="Hydropolis Studio V11.51 - Resigres Contract pricing corrigé (€/m² réel et plans vasque €/cm)";pkg.scripts.start="node server.js";const prev=String(pkg.scripts.test||"").split(" && ").filter(Boolean).filter(x=>!x.includes("v11.51-"));pkg.scripts.test=[...prev,"node tests/v11.51-contract-pricing.js","node tests/v11.51-static.js"].join(" && ");pkg.scripts.build="npm run check && npm test";write("package.json",JSON.stringify(pkg,null,2)+"\n");
for(const target of ["public/v1149-pricing.js","public/v1149.js"]){const r=cp.spawnSync(process.execPath,["--check",file(target)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`syntaxe invalide : ${target}`)}
for(const t of ["tests/v11.51-contract-pricing.js","tests/v11.51-static.js"]){const r=cp.spawnSync(process.execPath,[file(t)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`${t} a échoué`)}
console.log("Hydropolis Studio V11.51 consolidée : OK");
console.log("- Receveurs Contract : surface réelle × €/m², minimum tarifaire, aucun palier");
console.log("- Plans vasque Contract : €/cm + intégration vasque + options");
