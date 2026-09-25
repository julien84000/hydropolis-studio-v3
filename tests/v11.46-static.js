"use strict";
const fs=require("fs"),assert=require("assert");
for(const f of ["public/v1146-pricing.js","public/v1146.js","public/v1146.css","public/resigres_2026_config.json","apply-v11.46-consolidated.js"]){assert(fs.existsSync(f),`missing ${f}`)}
const cfg=JSON.parse(fs.readFileSync("public/resigres_2026_config.json","utf8"));assert.equal(cfg.version,"2026-FR-v2");assert((cfg.verifiedAutomaticPricing?.showerTrayFamilies||[]).includes("Cosmo / Cosmo Contract"));
const js=fs.readFileSync("public/v1146.js","utf8");assert(js.includes("Prix public HT calculé"));assert(js.includes("HydropolisV1146Pricing"));
console.log("V11.46 static: OK");
