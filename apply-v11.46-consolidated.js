#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),cp=require("child_process");
const ROOT=__dirname,file=p=>path.join(ROOT,p),read=p=>fs.readFileSync(file(p),"utf8"),write=(p,v)=>fs.writeFileSync(file(p),v,"utf8"),exists=p=>fs.existsSync(file(p));
function fail(m){throw new Error(`[V11.46] ${m}`)}
function run(script){if(!exists(script))fail(`script manquant : ${script}`);const r=cp.spawnSync(process.execPath,[file(script)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`${script} a échoué (${r.status})`)}
if(!exists("public/app.js")||!exists("package.json"))fail("base Hydropolis introuvable");
if(!read("public/app.js").includes("V11.45_BOOTSTRAP_DEFERRED"))run("apply-v11.45-consolidated.js");
for(const p of ["public/v1146-pricing.js","public/v1146.js","public/v1146.css","public/resigres_2026_config.json","public/catalog_resigres_2026.json"]){if(!exists(p))fail(`fichier V11.46 manquant : ${p}`)}
let idx=read("public/index.html");
idx=idx.replace(/Hydropolis Studio V11\.45/g,"Hydropolis Studio V11.46.1").replace(/<em>V11\.45<\/em>/g,"<em>V11.46.1</em>");
idx=idx.replace(/<link rel="stylesheet" href="v1145\.css\?v=11\.45">\s*/g,"");
idx=idx.replace(/<script src="v1145-pricing\.js\?v=11\.45"><\/script>\s*/g,"");
idx=idx.replace(/<script src="v1145\.js\?v=11\.45"><\/script>\s*/g,"");
if(!idx.includes("v1146.css"))idx=idx.replace(/<link rel="stylesheet" href="styles\.css(?:\?[^\"]*)?">/,m=>m+'\n<link rel="stylesheet" href="v1146.css?v=11.46.1">');
if(!idx.includes("v1146-pricing.js"))idx=idx.replace(/<script src="app\.js(?:\?[^\"]*)?"><\/script>/,'<script src="app.js?v=11.46.1"></script>\n<script src="v1146-pricing.js?v=11.46.1"></script>\n<script src="v1146.js?v=11.46.1"></script>');
else idx=idx.replace(/<script src="app\.js(?:\?[^\"]*)?"><\/script>/,'<script src="app.js?v=11.46.1"></script>');
write("public/index.html",idx);
let sw=read("public/sw.js").replace(/hydropolis-v11-45-shell/g,"hydropolis-v11-46-1-shell").replace(/hydropolis-v11-45-catalogs/g,"hydropolis-v11-46-1-catalogs");
for(const f of ["/v1146.css","/v1146-pricing.js","/v1146.js"]){if(!sw.includes(`"${f}"`))sw=sw.replace('"/manufacturers_manifest.json"',`"/manufacturers_manifest.json","${f}"`)}
write("public/sw.js",sw);
let server=read("server.js").replace(/Hydropolis Studio V11\.45/g,"Hydropolis Studio V11.46.1").replace(/Hydropolis V11\.45/g,"Hydropolis V11.46.1");write("server.js",server);
let cm=JSON.parse(read("public/catalog_manifest.json"));cm.version="11.46.1";cm.engineVersion="11.46.1";write("public/catalog_manifest.json",JSON.stringify(cm,null,2)+"\n");
let mm=JSON.parse(read("public/manufacturers_manifest.json"));mm.version="11.46.1";for(const m of mm.manufacturers||[]){if(m.name==="Resigres"&&!m.capabilities.includes("automatic-pricing-2026"))m.capabilities.push("automatic-pricing-2026")}write("public/manufacturers_manifest.json",JSON.stringify(mm,null,2)+"\n");
let pkg=JSON.parse(read("package.json"));pkg.version="11.46.1";pkg.description="Hydropolis Studio V11.46.1 - tarifs Resigres 2026 intégrés et calcul automatique";pkg.scripts.start="node server.js";
pkg.scripts.check="node --check server.js && node --check public/app.js && node --check public/sw.js && node --check public/v1146-pricing.js && node --check public/v1146.js";
const prev=String(pkg.scripts.test||"").split(" && ").filter(Boolean).filter(x=>!x.includes("v11.46-"));pkg.scripts.test=[...prev,"node tests/v11.46-resigres-pricing.js","node tests/v11.46-static.js"].join(" && ");pkg.scripts.build="npm run check && npm test";write("package.json",JSON.stringify(pkg,null,2)+"\n");
const config=JSON.parse(read("public/resigres_2026_config.json"));if(config.version!=="2026-FR-v2")fail("configuration Resigres v2 absente");
if(!idx.includes("v1146-pricing.js")||!idx.includes("v1146.js"))fail("assets V11.46 non chargés");
if(read("public/v1146.js").includes("optionHtml(colors)+="))fail("régression configurateur Resigres: concaténation invalide");
for(const target of ["public/v1146-pricing.js","public/v1146.js"]){const r=cp.spawnSync(process.execPath,["--check",file(target)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`syntaxe invalide : ${target}`)}
{const r=cp.spawnSync(process.execPath,[file("tests/v11.46-resigres-pricing.js")],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail("test tarifaire V11.46 en échec")}
console.log("Hydropolis Studio V11.46.1 consolidée : OK");
console.log("- Tarifs Resigres 2026 automatiques pour les grilles certifiées");
console.log("- Cosmo/Vento/Nix Contract calculés au m² avec minimum 0,5 m²");
console.log("- Suppléments RAL/NCS et rainures calculés automatiquement");
