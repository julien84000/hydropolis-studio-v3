#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),cp=require("child_process");
const ROOT=__dirname,file=p=>path.join(ROOT,p),read=p=>fs.readFileSync(file(p),"utf8"),write=(p,v)=>fs.writeFileSync(file(p),v,"utf8"),exists=p=>fs.existsSync(file(p));
function fail(m){throw new Error(`[V11.50] ${m}`)}
function run(script){if(!exists(script))fail(`script manquant : ${script}`);const r=cp.spawnSync(process.execPath,[file(script)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`${script} a échoué (${r.status})`)}
if(!exists("public/app.js")||!exists("package.json"))fail("base Hydropolis introuvable");
if(String(JSON.parse(read("package.json")).version||"")!=="11.49.0")run("apply-v11.49-consolidated.js");
for(const p of ["public/v1150-pricing.js","public/v1150.js","public/v1150.css","public/resigres_2026_config.json"]){if(!exists(p))fail(`fichier V11.50 manquant : ${p}`)}
const cfg=JSON.parse(read("public/resigres_2026_config.json"));if(cfg.version!=="2026-FR-v5")fail(`configuration Resigres V11.50 absente (${cfg.version||"sans version"})`);
const target=cfg.models||[];
const showers=target.filter(x=>x.kind==="shower-tray"),basins=target.filter(x=>["basin-top","furniture-basin-top"].includes(x.kind)),furniture=target.filter(x=>x.kind==="furniture");
if(showers.length!==7||showers.some(x=>!x.v49ShowerConfigurator?.enabled))fail("couverture complète receveurs absente");
if(basins.length!==12||basins.some(x=>!x.v50BasinTop))fail("couverture complète plans vasque absente");
if(furniture.length!==4||furniture.some(x=>!x.v50Furniture))fail("couverture complète meubles absente");
let idx=read("public/index.html");idx=idx.replace(/Hydropolis Studio V11\.49/g,"Hydropolis Studio V11.50").replace(/<em>V11\.49<\/em>/g,"<em>V11.50</em>").replace(/\?v=11\.49/g,"?v=11.50");
if(!idx.includes("v1150.css"))idx=idx.replace(/<link rel="stylesheet" href="v1149\.css\?v=11\.50">/,m=>m+'\n<link rel="stylesheet" href="v1150.css?v=11.50">');
if(!idx.includes("v1150-pricing.js"))idx=idx.replace(/<script src="v1149\.js\?v=11\.50"><\/script>/,m=>m+'\n<script src="v1150-pricing.js?v=11.50"></script>\n<script src="v1150.js?v=11.50"></script>');
write("public/index.html",idx);
let sw=read("public/sw.js").replace(/hydropolis-v11-49-shell/g,"hydropolis-v11-50-shell").replace(/hydropolis-v11-49-catalogs/g,"hydropolis-v11-50-catalogs");for(const f of ["/v1150.css","/v1150-pricing.js","/v1150.js","/resigres/shapes/standard.png","/resigres/shapes/circular.png","/resigres/shapes/oval.png","/resigres/shapes/mini.png","/resigres/shapes/xl85.png","/resigres/shapes/xl120.png"]){if(!sw.includes(`"${f}"`))sw=sw.replace('"/manufacturers_manifest.json"',`"/manufacturers_manifest.json","${f}"`)}write("public/sw.js",sw);
let cm=JSON.parse(read("public/catalog_manifest.json"));cm.version="11.50.0";cm.engineVersion="11.50.0";write("public/catalog_manifest.json",JSON.stringify(cm,null,2)+"\n");
let mm=JSON.parse(read("public/manufacturers_manifest.json"));mm.version="11.50.0";for(const m of mm.manufacturers||[]){if(m.name==="Resigres"){m.capabilities=m.capabilities||[];for(const c of ["full-shower-tray-dependent-configurator","all-basin-top-dependent-configurator","all-furniture-basin-top-configurator","all-furniture-dependent-configurator","upper-tier-dimension-pricing","paid-and-included-options"]){if(!m.capabilities.includes(c))m.capabilities.push(c)}}}write("public/manufacturers_manifest.json",JSON.stringify(mm,null,2)+"\n");
let pkg=JSON.parse(read("package.json"));pkg.version="11.50.0";pkg.description="Hydropolis Studio V11.50 - Resigres Full Matrix receveurs, plans vasque et meubles";pkg.scripts.start="node server.js";pkg.scripts.check="node --check server.js && node --check public/app.js && node --check public/sw.js && node --check public/v1146-pricing.js && node --check public/v1146.js && node --check public/v1147.js && node --check public/v1148-pricing.js && node --check public/v1148.js && node --check public/v1149-pricing.js && node --check public/v1149.js && node --check public/v1150-pricing.js && node --check public/v1150.js";const prev=String(pkg.scripts.test||"").split(" && ").filter(Boolean).filter(x=>!x.includes("v11.50-"));pkg.scripts.test=[...prev,"node tests/v11.50-resigres-full-matrix.js","node tests/v11.50-static.js"].join(" && ");pkg.scripts.build="npm run check && npm test";write("package.json",JSON.stringify(pkg,null,2)+"\n");
for(const target of ["public/v1150-pricing.js","public/v1150.js"]){const r=cp.spawnSync(process.execPath,["--check",file(target)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`syntaxe invalide : ${target}`)}
if(!idx.includes("v1150-pricing.js")||!idx.includes("v1150.js")||!idx.includes("v1150.css"))fail("assets V11.50 non chargés");
console.log("Hydropolis Studio V11.50 consolidée : OK");
console.log("- 7/7 familles de receveurs : configurateur dépendant");
console.log("- 12/12 familles de plans vasque CF/SF : configurateur dépendant");
console.log("- 4/4 familles de meubles : configurateur dépendant");
console.log("- Dimensions intermédiaires : palier supérieur quand la grille est certifiée");
