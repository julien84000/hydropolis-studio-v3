"use strict";
const fs=require("fs"),path=require("path"),assert=require("assert");
const root=path.join(__dirname,"..");
const fior=JSON.parse(fs.readFileSync(path.join(root,"public/catalog_fioranese_2025.json"),"utf8"));
const res=JSON.parse(fs.readFileSync(path.join(root,"public/catalog_resigres_2026.json"),"utf8"));
const cfg=JSON.parse(fs.readFileSync(path.join(root,"public/resigres_2026_config.json"),"utf8"));
assert(fior.length>=300,"Fioranese catalogue unexpectedly small");
assert(res.length>=30,"Resigres launchers unexpectedly small");
const keys=new Set();
for(const p of fior){
  const key=`${p.manufacturer}|${p.reference}`;assert(!keys.has(key),`duplicate ${key}`);keys.add(key);
  assert.strictEqual(p.manufacturer,"Fioranese");
  if(p.pricingStatus==="verified"){
    assert(Number(p.price)>0,`${p.reference}: verified price missing`);
    if(p.pricingUnit==="sqm")assert(Number(p.sqmPerBox)>0,`${p.reference}: sqmPerBox missing`);
  }
}
for(const p of res){assert.strictEqual(p.manufacturer,"Resigres");assert.strictEqual(p.configuratorType,"resigres");assert(p.sourcePage,`${p.reference}: source page missing`);assert(cfg.groups[p.resigresKind],`${p.reference}: unknown config kind`)}
assert.strictEqual(cfg.global.tolerancePercent,0.7);
console.log(`V11.45 catalog data: OK · Fioranese ${fior.length} · Resigres ${res.length}`);
