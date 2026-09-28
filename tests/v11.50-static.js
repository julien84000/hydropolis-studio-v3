"use strict";
const assert=require("assert"),fs=require("fs");
const cfg=JSON.parse(fs.readFileSync("public/resigres_2026_config.json","utf8"));assert.equal(cfg.version,"2026-FR-v5");
assert.equal(cfg.models.filter(x=>x.kind==="shower-tray"&&x.v49ShowerConfigurator?.enabled).length,7);
assert.equal(cfg.models.filter(x=>["basin-top","furniture-basin-top"].includes(x.kind)&&x.v50BasinTop).length,12);
assert.equal(cfg.models.filter(x=>x.kind==="furniture"&&x.v50Furniture).length,4);
const js=fs.readFileSync("public/v1150.js","utf8"),pr=fs.readFileSync("public/v1150-pricing.js","utf8");assert(js.includes("HYDROPOLIS_STUDIO_V11_50"));assert(js.includes("openBasin"));assert(js.includes("openFurniture"));assert(pr.includes("basinQuote"));assert(pr.includes("furnitureQuote"));
console.log("V11.50 static: OK");
