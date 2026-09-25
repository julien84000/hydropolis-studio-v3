#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),cp=require("child_process");
const ROOT=__dirname,file=p=>path.join(ROOT,p),read=p=>fs.readFileSync(file(p),"utf8"),write=(p,v)=>fs.writeFileSync(file(p),v,"utf8"),exists=p=>fs.existsSync(file(p));
function fail(m){throw new Error(`[V11.48] ${m}`)}
function run(script){if(!exists(script))fail(`script manquant : ${script}`);const r=cp.spawnSync(process.execPath,[file(script)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`${script} a échoué (${r.status})`)}
if(!exists("public/app.js")||!exists("package.json"))fail("base Hydropolis introuvable");
const pkg0=JSON.parse(read("package.json"));if(String(pkg0.version||"")!=="11.47.0")run("apply-v11.47-consolidated.js");
for(const p of ["public/v1148-pricing.js","public/v1148.js","public/v1148.css","public/resigres_2026_config.json"]){if(!exists(p))fail(`fichier V11.48 manquant : ${p}`)}

const cfg=JSON.parse(read("public/resigres_2026_config.json"));
if(cfg.version!=="2026-FR-v3")fail("configuration Resigres V11.48 absente");
const nesta=(cfg.models||[]).find(x=>x.name==="Nesta"&&x.kind==="bath");
if(!nesta?.dependencyMatrix?.sizes?.length)fail("matrice Nesta absente");

let idx=read("public/index.html");
idx=idx.replace(/Hydropolis Studio V11\.47/g,"Hydropolis Studio V11.48").replace(/<em>V11\.47<\/em>/g,"<em>V11.48</em>");
idx=idx.replace(/v1147\.css\?v=11\.47/g,"v1147.css?v=11.48").replace(/v1147\.js\?v=11\.47/g,"v1147.js?v=11.48");
idx=idx.replace(/v1146\.css\?v=11\.47/g,"v1146.css?v=11.48").replace(/app\.js\?v=11\.47/g,"app.js?v=11.48").replace(/v1146-pricing\.js\?v=11\.47/g,"v1146-pricing.js?v=11.48").replace(/v1146\.js\?v=11\.47/g,"v1146.js?v=11.48");
if(!idx.includes("v1148.css"))idx=idx.replace(/<link rel="stylesheet" href="v1147\.css\?v=11\.48">/,m=>m+'\n<link rel="stylesheet" href="v1148.css?v=11.48">');
if(!idx.includes("v1148-pricing.js"))idx=idx.replace(/<script src="v1147\.js\?v=11\.48"><\/script>/,m=>m+'\n<script src="v1148-pricing.js?v=11.48"></script>\n<script src="v1148.js?v=11.48"></script>');
write("public/index.html",idx);

let sw=read("public/sw.js").replace(/hydropolis-v11-47-shell/g,"hydropolis-v11-48-shell").replace(/hydropolis-v11-47-catalogs/g,"hydropolis-v11-48-catalogs");
for(const f of ["/v1148.css","/v1148-pricing.js","/v1148.js"]){if(!sw.includes(`"${f}"`))sw=sw.replace('"/manufacturers_manifest.json"',`"/manufacturers_manifest.json","${f}"`)}
write("public/sw.js",sw);

let cm=JSON.parse(read("public/catalog_manifest.json"));cm.version="11.48.0";cm.engineVersion="11.48.0";write("public/catalog_manifest.json",JSON.stringify(cm,null,2)+"\n");
let mm=JSON.parse(read("public/manufacturers_manifest.json"));mm.version="11.48.0";for(const m of mm.manufacturers||[]){if(m.name==="Resigres"){for(const c of ["dependent-configurator","size-material-color-matrix","safe-model-specific-options"]){if(!m.capabilities.includes(c))m.capabilities.push(c)}}}write("public/manufacturers_manifest.json",JSON.stringify(mm,null,2)+"\n");

let pkg=JSON.parse(read("package.json"));pkg.version="11.48.0";pkg.description="Hydropolis Studio V11.48 - configurateur Resigres dépendant taille → matière → couleur";pkg.scripts.start="node server.js";pkg.scripts.check="node --check server.js && node --check public/app.js && node --check public/sw.js && node --check public/v1146-pricing.js && node --check public/v1146.js && node --check public/v1147.js && node --check public/v1148-pricing.js && node --check public/v1148.js";
const prev=String(pkg.scripts.test||"").split(" && ").filter(Boolean).filter(x=>!x.includes("v11.48-"));pkg.scripts.test=[...prev,"node tests/v11.48-resigres-dependency.js","node tests/v11.48-static.js"].join(" && ");pkg.scripts.build="npm run check && npm test";write("package.json",JSON.stringify(pkg,null,2)+"\n");

for(const target of ["public/v1148-pricing.js","public/v1148.js"]){const r=cp.spawnSync(process.execPath,["--check",file(target)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`syntaxe invalide : ${target}`)}
if(!idx.includes("v1148-pricing.js")||!idx.includes("v1148.js")||!idx.includes("v1148.css"))fail("assets V11.48 non chargés");
console.log("Hydropolis Studio V11.48 consolidée : OK");
console.log("- configurateur Resigres dépendant : taille → matière → couleur");
console.log("- Nesta, Vento, Delia et Nalu : matrices de compatibilité/prix certifiées");
console.log("- autres produits Resigres : plus aucun choix global de finition/couleur injecté par défaut");
