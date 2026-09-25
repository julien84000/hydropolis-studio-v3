"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path");
const ROOT=path.join(__dirname,"..");
const js=fs.readFileSync(path.join(ROOT,"public/v1148.js"),"utf8"),pricing=fs.readFileSync(path.join(ROOT,"public/v1148-pricing.js"),"utf8"),cfg=JSON.parse(fs.readFileSync(path.join(ROOT,"public/resigres_2026_config.json"),"utf8"));
assert(js.includes("Chaque choix filtre le suivant"));
assert(js.includes("Commencez par choisir la dimension"));
assert(!js.includes('global.finishes||[]'),"V11.48 ne doit jamais réinjecter toutes les finitions globales");
assert(pricing.includes("dependentQuote"));
assert.strictEqual(cfg.version,"2026-FR-v3");
for(const name of ["Nalu","Delia","Nesta","Vento"]){const m=cfg.models.find(x=>x.name===name&&x.kind==="bath");assert(m?.dependencyMatrix,`matrice ${name} absente`)}
console.log("V11.48 static: OK");
