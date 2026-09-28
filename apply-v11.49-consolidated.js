#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),cp=require("child_process");
const ROOT=__dirname,file=p=>path.join(ROOT,p),read=p=>fs.readFileSync(file(p),"utf8"),write=(p,v)=>fs.writeFileSync(file(p),v,"utf8"),exists=p=>fs.existsSync(file(p));
function fail(m){throw new Error(`[V11.49] ${m}`)}
function run(script){if(!exists(script))fail(`script manquant : ${script}`);const r=cp.spawnSync(process.execPath,[file(script)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`${script} a échoué (${r.status})`)}
if(!exists("public/app.js")||!exists("package.json"))fail("base Hydropolis introuvable");
if(String(JSON.parse(read("package.json")).version||"")!=="11.48.0")run("apply-v11.48-consolidated.js");
for(const p of ["public/v1149-pricing.js","public/v1149.js","public/v1149.css","public/resigres_2026_config.json","v1149-resigres-server-snippet.js"]){if(!exists(p))fail(`fichier V11.49 manquant : ${p}`)}
const cfg=JSON.parse(read("public/resigres_2026_config.json"));if(!["2026-FR-v4","2026-FR-v5"].includes(cfg.version))fail(`configuration Resigres V11.49 absente (${cfg.version||"sans version"})`);
const selene=(cfg.models||[]).find(x=>x.name==="Selene"&&x.kind==="furniture-basin-top");if(!selene?.v49Selene?.shapes?.length)fail("matrice Selene V11.49 absente");
const cosmo=(cfg.models||[]).find(x=>x.name==="Cosmo / Cosmo Contract"&&x.kind==="shower-tray");if(!cosmo?.v49ShowerConfigurator?.enabled)fail("configurateur receveur V11.49 absent");

let server=read("server.js");
const newBlock=read("v1149-resigres-server-snippet.js").trim()+"\n";
const imgAnchor='app.get("/api/image-proxy",async(req,res)=>{';
const oldMarkers=["/* V11.49_RESIGRES_OFFICIAL_ASSETS */","/* V11.47_RESIGRES_OFFICIAL_ASSETS */"];
let markerPos=-1;for(const m of oldMarkers){const i=server.indexOf(m);if(i>=0&&(markerPos<0||i<markerPos))markerPos=i}
const anchorPos=server.indexOf(imgAnchor);
if(anchorPos<0)fail("point d’insertion image-proxy introuvable");
if(markerPos>=0&&markerPos<anchorPos)server=server.slice(0,markerPos)+newBlock+server.slice(anchorPos);else server=server.slice(0,anchorPos)+newBlock+server.slice(anchorPos);
server=server.replace(/Hydropolis Studio V11\.48/g,"Hydropolis Studio V11.49").replace(/Hydropolis V11\.48/g,"Hydropolis V11.49");write("server.js",server);

let idx=read("public/index.html");
idx=idx.replace(/Hydropolis Studio V11\.48/g,"Hydropolis Studio V11.49").replace(/<em>V11\.48<\/em>/g,"<em>V11.49</em>");
idx=idx.replace(/\?v=11\.48/g,"?v=11.49");
if(!idx.includes("v1149.css"))idx=idx.replace(/<link rel="stylesheet" href="v1148\.css\?v=11\.49">/,m=>m+'\n<link rel="stylesheet" href="v1149.css?v=11.49">');
if(!idx.includes("v1149-pricing.js"))idx=idx.replace(/<script src="v1148\.js\?v=11\.49"><\/script>/,m=>m+'\n<script src="v1149-pricing.js?v=11.49"></script>\n<script src="v1149.js?v=11.49"></script>');
write("public/index.html",idx);

let sw=read("public/sw.js").replace(/hydropolis-v11-48-shell/g,"hydropolis-v11-49-shell").replace(/hydropolis-v11-48-catalogs/g,"hydropolis-v11-49-catalogs");
for(const f of ["/v1149.css","/v1149-pricing.js","/v1149.js","/resigres/selene/standard.png","/resigres/selene/circular.png","/resigres/selene/oval.png","/resigres/selene/mini.png","/resigres/selene/xl85.png","/resigres/selene/xl120.png"]){if(!sw.includes(`"${f}"`))sw=sw.replace('"/manufacturers_manifest.json"',`"/manufacturers_manifest.json","${f}"`)}
write("public/sw.js",sw);

let cm=JSON.parse(read("public/catalog_manifest.json"));cm.version="11.49.0";cm.engineVersion="11.49.0";write("public/catalog_manifest.json",JSON.stringify(cm,null,2)+"\n");
let mm=JSON.parse(read("public/manufacturers_manifest.json"));mm.version="11.49.0";for(const m of mm.manufacturers||[]){if(m.name==="Resigres"){for(const c of ["official-assets-resolver-v49","shower-tray-ceiling-dimensions","selene-dependent-configurator","selene-option-pricing"]){if(!m.capabilities.includes(c))m.capabilities.push(c)}}}write("public/manufacturers_manifest.json",JSON.stringify(mm,null,2)+"\n");
let pkg=JSON.parse(read("package.json"));pkg.version="11.49.0";pkg.description="Hydropolis Studio V11.49 - Resigres photos officielles, receveurs matriciels et Selene dépendant";pkg.scripts.start="node server.js";pkg.scripts.check="node --check server.js && node --check public/app.js && node --check public/sw.js && node --check public/v1146-pricing.js && node --check public/v1146.js && node --check public/v1147.js && node --check public/v1148-pricing.js && node --check public/v1148.js && node --check public/v1149-pricing.js && node --check public/v1149.js";
const prev=String(pkg.scripts.test||"").split(" && ").filter(Boolean).filter(x=>!x.includes("v11.49-"));pkg.scripts.test=[...prev,"node tests/v11.49-resigres-pricing.js","node tests/v11.49-static.js"].join(" && ");pkg.scripts.build="npm run check && npm test";write("package.json",JSON.stringify(pkg,null,2)+"\n");

for(const target of ["server.js","public/v1147.js","public/v1149-pricing.js","public/v1149.js"]){const r=cp.spawnSync(process.execPath,["--check",file(target)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`syntaxe invalide : ${target}`)}
if(!server.includes('RESIGRES_RESOLVER_VERSION="11.49"'))fail("resolver Resigres V11.49 non installé");
if(!idx.includes("v1149-pricing.js")||!idx.includes("v1149.js")||!idx.includes("v1149.css"))fail("assets V11.49 non chargés");
console.log("Hydropolis Studio V11.49 consolidée : OK");
console.log("- Photos Resigres : resolver 11.49 + fallback images catégorie + invalidation ancien cache");
console.log("- Receveurs certifiés : dimensions réelles et palier tarifaire supérieur");
console.log("- Selene : forme → matière → coloris → 1/XL/2 vasques → dimensions → options");
