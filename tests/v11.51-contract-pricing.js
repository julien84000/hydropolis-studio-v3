"use strict";
const fs=require("fs"),assert=require("assert");
const cfg=JSON.parse(fs.readFileSync("public/resigres_2026_config.json","utf8"));
const P=require("../public/v1149-pricing.js");
function q(model,variant,finish,widthCm,lengthCm,color="S-Blanco"){return P.showerQuote(cfg,{model,kind:"shower-tray",variant,finish,color,widthCm,lengthCm,options:[]});}
let x=q("Extraplano Contract","contract","Lisa",100,200,"Ártico");assert.equal(x.status,"automatic");assert.equal(x.basePrice,1600);assert.equal(x.rule.type,"sqm");
x=q("Extraplano Contract","contract","Lisa",50,50,"Ártico");assert.equal(x.basePrice,400);assert.equal(x.rule.actualSqm,0.25);assert.equal(x.rule.billedSqm,0.5);
x=q("Cosmo / Cosmo Contract","cosmo-contract","Solid Surface",93,167,"S-Blanco");assert.equal(x.basePrice,1540.68);assert.equal(x.rule.ratePerSqm,992);
x=q("Vento / Vento Contract","vento-contract","Lisa",100,200,"Ártico");assert.equal(x.basePrice,1690);
x=q("Nix / Nix Contract","nix-contract","Lisa",110,220,"Ártico");assert.equal(x.basePrice,2044.9);
x=q("Cosmo / Cosmo Contract","cosmo","Lisa",73,150,"Ártico");assert.equal(x.pricedWidth,80);assert.equal(x.pricedLength,160);assert.equal(x.basePrice,843);
const ccf=cfg.models.find(m=>m.name==="Contract CF").v50BasinTop;assert.equal(ccf.ratesPerLengthCm.solid,6);assert.equal(ccf.ratesPerLengthCm.resin,7);
const csf=cfg.models.find(m=>m.name==="Contract SF").v50BasinTop;assert.equal(csf.ratesPerLengthCm.solid,5.6);assert.equal(csf.ratesPerLengthCm.resin,6.6);
console.log("V11.51 Contract pricing: OK");
