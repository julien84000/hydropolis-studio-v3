#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),cp=require("child_process");
const ROOT=__dirname,file=p=>path.join(ROOT,p),read=p=>fs.readFileSync(file(p),"utf8"),write=(p,v)=>fs.writeFileSync(file(p),v,"utf8"),exists=p=>fs.existsSync(file(p));
function fail(m){throw new Error(`[V11.47] ${m}`)}
function run(script){if(!exists(script))fail(`script manquant : ${script}`);const r=cp.spawnSync(process.execPath,[file(script)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`${script} a échoué (${r.status})`)}
if(!exists("public/app.js")||!exists("package.json"))fail("base Hydropolis introuvable");
if(String(JSON.parse(read("package.json")).version||"")!=="11.46.1")run("apply-v11.46-consolidated.js");
for(const p of ["public/v1147.js","public/v1147.css"]){if(!exists(p))fail(`fichier V11.47 manquant : ${p}`)}

let server=read("server.js");
const marker="/* V11.47_RESIGRES_OFFICIAL_ASSETS */";
if(!server.includes(marker)){
  const anchor='app.get("/api/image-proxy",async(req,res)=>{';
  if(!server.includes(anchor))fail("point d’insertion image-proxy introuvable dans server.js");
  const block=read("v1147-resigres-server-snippet.js")+"\n";
  server=server.replace(anchor,block+anchor);
}
server=server.replace(/Hydropolis Studio V11\.46\.1/g,"Hydropolis Studio V11.47").replace(/Hydropolis V11\.46\.1/g,"Hydropolis V11.47");
write("server.js",server);

let idx=read("public/index.html");
idx=idx.replace(/Hydropolis Studio V11\.46\.1/g,"Hydropolis Studio V11.47").replace(/<em>V11\.46\.1<\/em>/g,"<em>V11.47</em>");
idx=idx.replace(/v1146\.css\?v=11\.46\.1/g,"v1146.css?v=11.47").replace(/app\.js\?v=11\.46\.1/g,"app.js?v=11.47").replace(/v1146-pricing\.js\?v=11\.46\.1/g,"v1146-pricing.js?v=11.47").replace(/v1146\.js\?v=11\.46\.1/g,"v1146.js?v=11.47");
if(!idx.includes("v1147.css"))idx=idx.replace(/<link rel="stylesheet" href="v1146\.css\?v=11\.47">/,m=>m+'\n<link rel="stylesheet" href="v1147.css?v=11.47">');
if(!idx.includes("v1147.js"))idx=idx.replace(/<script src="v1146\.js\?v=11\.47"><\/script>/,m=>m+'\n<script src="v1147.js?v=11.47"></script>');
write("public/index.html",idx);

let sw=read("public/sw.js").replace(/hydropolis-v11-46-1-shell/g,"hydropolis-v11-47-shell").replace(/hydropolis-v11-46-1-catalogs/g,"hydropolis-v11-47-catalogs");
for(const f of ["/v1147.css","/v1147.js"]){if(!sw.includes(`"${f}"`))sw=sw.replace('"/manufacturers_manifest.json"',`"/manufacturers_manifest.json","${f}"`)}
write("public/sw.js",sw);

let cm=JSON.parse(read("public/catalog_manifest.json"));cm.version="11.47.0";cm.engineVersion="11.47.0";write("public/catalog_manifest.json",JSON.stringify(cm,null,2)+"\n");
let mm=JSON.parse(read("public/manufacturers_manifest.json"));mm.version="11.47.0";for(const m of mm.manufacturers||[]){if(m.name==="Resigres"){for(const c of ["official-product-images","official-technical-pdf","official-3d-assets"]){if(!m.capabilities.includes(c))m.capabilities.push(c)}}}write("public/manufacturers_manifest.json",JSON.stringify(mm,null,2)+"\n");
let pkg=JSON.parse(read("package.json"));pkg.version="11.47.0";pkg.description="Hydropolis Studio V11.47 - assets officiels Resigres : photos, fiches techniques et 3D";pkg.scripts.start="node server.js";pkg.scripts.check="node --check server.js && node --check public/app.js && node --check public/sw.js && node --check public/v1146-pricing.js && node --check public/v1146.js && node --check public/v1147.js";
const prev=String(pkg.scripts.test||"").split(" && ").filter(Boolean).filter(x=>!x.includes("v11.47-"));pkg.scripts.test=[...prev,"node tests/v11.47-resigres-assets.js","node tests/v11.47-static.js"].join(" && ");pkg.scripts.build="npm run check && npm test";write("package.json",JSON.stringify(pkg,null,2)+"\n");

for(const target of ["server.js","public/v1147.js"]){const r=cp.spawnSync(process.execPath,["--check",file(target)],{cwd:ROOT,stdio:"inherit"});if(r.status!==0)fail(`syntaxe invalide : ${target}`)}
if(!server.includes("/api/resigres-assets"))fail("endpoint Resigres assets absent");if(!idx.includes("v1147.js")||!idx.includes("v1147.css"))fail("assets V11.47 non chargés");
console.log("Hydropolis Studio V11.47 consolidée : OK");
console.log("- Photos Resigres récupérées sur les pages produit officielles");
console.log("- Fiches techniques PDF Resigres intégrées automatiquement");
console.log("- Fichiers 3D et guides officiels exposés quand disponibles");
