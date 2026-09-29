#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=__dirname,file=p=>path.join(ROOT,p),read=p=>fs.readFileSync(file(p),'utf8'),write=(p,v)=>fs.writeFileSync(file(p),v,'utf8'),exists=p=>fs.existsSync(file(p));
function fail(m){throw new Error(`[V11.54] ${m}`)}
function run(script){if(!exists(script))fail(`script manquant : ${script}`);const r=cp.spawnSync(process.execPath,[file(script)],{cwd:ROOT,stdio:'inherit'});if(r.status!==0)fail(`${script} a échoué (${r.status})`)}
if(!exists('public/app.js')||!exists('package.json'))fail('base Hydropolis introuvable');
if(String(JSON.parse(read('package.json')).version||'')!=='11.53.0')run('apply-v11.53-consolidated.js');
for(const p of ['public/v1154.js','public/v1154.css','v1154-sira-assets-server-snippet.js'])if(!exists(p))fail(`fichier manquant : ${p}`);
let server=read('server.js'), marker='/* V11.54_SIRA_EXACT_ASSETS */', anchor='app.get("/api/image-proxy",async(req,res)=>{';
if(!server.includes(marker)){if(!server.includes(anchor))fail('point insertion serveur introuvable');server=server.replace(anchor,read('v1154-sira-assets-server-snippet.js').trim()+'\n'+anchor)}
write('server.js',server);
let idx=read('public/index.html').replace(/Hydropolis Studio V11\.53/g,'Hydropolis Studio V11.54').replace(/<em>V11\.53<\/em>/g,'<em>V11.54</em>').replace(/\?v=11\.53/g,'?v=11.54');
if(!idx.includes('v1154.css'))idx=idx.replace(/<\/head>/,'<link rel="stylesheet" href="v1154.css?v=11.54">\n</head>');
if(!idx.includes('v1154.js'))idx=idx.replace(/<\/body>/,'<script src="v1154.js?v=11.54"></script>\n</body>');
write('public/index.html',idx);
let mm=JSON.parse(read('public/manufacturers_manifest.json'));for(const m of (mm.manufacturers||[])){if(['Sira Concrete','TDA','Vismaravetro'].includes(m.name)){m.purchaseDiscount=50;m.capabilities=[...new Set([...(m.capabilities||[]),'purchase-discount-50'])]}if(m.name==='Sira Concrete')m.capabilities=[...new Set([...(m.capabilities||[]),'exact-product-image-v1154'])]};mm.version='11.54.0';write('public/manufacturers_manifest.json',JSON.stringify(mm,null,2)+'\n');
let cm=JSON.parse(read('public/catalog_manifest.json'));cm.version='11.54.0';cm.engineVersion='11.54.0';write('public/catalog_manifest.json',JSON.stringify(cm,null,2)+'\n');
let sw=read('public/sw.js').replace(/hydropolis-v11-53-shell/g,'hydropolis-v11-54-shell').replace(/hydropolis-v11-53-catalogs/g,'hydropolis-v11-54-catalogs');for(const f of ['/v1154.css','/v1154.js'])if(!sw.includes(`"${f}"`))sw=sw.replace('"/manufacturers_manifest.json"',`"/manufacturers_manifest.json","${f}"`);write('public/sw.js',sw);
let pkg=JSON.parse(read('package.json'));pkg.version='11.54.0';pkg.description='Hydropolis Studio V11.54 - Sira images exactes + remises achat 50% Sira/TDA/Vismaravetro + intégrité tarifaire';pkg.scripts.start='node server.js';let checks=String(pkg.scripts.check||'').split(' && ').filter(Boolean).filter(x=>!x.includes('v1154.js'));checks.push('node --check public/v1154.js');pkg.scripts.check=checks.join(' && ');let tests=String(pkg.scripts.test||'').split(' && ').filter(Boolean).filter(x=>!x.includes('v11.54-'));tests.push('node tests/v11.54-suppliers.js','node tests/v11.54-static.js');pkg.scripts.test=tests.join(' && ');write('package.json',JSON.stringify(pkg,null,2)+'\n');
for(const t of ['server.js','public/v1153.js','public/v1154.js']){const r=cp.spawnSync(process.execPath,['--check',file(t)],{cwd:ROOT,stdio:'inherit'});if(r.status!==0)fail(`syntaxe ${t}`)}
for(const t of ['tests/v11.54-suppliers.js','tests/v11.54-static.js']){const r=cp.spawnSync(process.execPath,[file(t)],{cwd:ROOT,stdio:'inherit'});if(r.status!==0)fail(`test ${t}`)}
console.log('Hydropolis Studio V11.54 consolidée : OK');
console.log('- remises achat : Sira 50 %, TDA 50 %, Vismaravetro 50 %');
console.log('- Sira : visuel exact prioritaire depuis la fiche produit officielle');
console.log('- prix 0 : explicitement traité comme tarif non résolu, jamais comme tarif fabricant valide');
