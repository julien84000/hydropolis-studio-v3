"use strict";
const fs=require("fs"),assert=require("assert");
const cfg=JSON.parse(fs.readFileSync("public/resigres_2026_config.json","utf8"));assert.equal(cfg.version,"2026-FR-v6");
const contracts=cfg.models.filter(m=>m.kind==="shower-tray").flatMap(m=>(m.pricingRules||[]).filter(r=>r.type==="sqm"));assert(contracts.length>=4);for(const r of contracts){assert.equal(r.billingMode,"actual-sqm");assert.equal(r.noTierRounding,true);assert(r.minSqm>=0.5);}
const ex=cfg.models.find(m=>m.name==="Extraplano Contract");assert.deepEqual(ex.variants[0].finishOptions,["Lisa","Solid Surface"]);
const ui=fs.readFileSync("public/v1149.js","utf8");assert(ui.includes("Aucun palier supérieur"));console.log("V11.51 static: OK");
