"use strict";
const fs=require("fs"),path=require("path"),root=path.join(__dirname,"..");
const must=(c,m)=>{if(!c)throw new Error(m)};
const js=fs.readFileSync(path.join(root,"public/v1153.js"),"utf8"),server=fs.readFileSync(path.join(root,"v1153-configurators-server-snippet.js"),"utf8"),sira=JSON.parse(fs.readFileSync(path.join(root,"public/catalog_sira_web.json"),"utf8"));
must(sira.length===5,"5 familles Sira attendues");must(sira.every(x=>x.purchaseDiscount===50),"remise Sira 50 % absente");
for(const m of ["TDA","Vismaravetro","Sira Concrete"])must(js.includes(m),`${m} absent du configurateur client`);
for(const e of ["/api/shower-configurator-collection","/api/shower-configurator-model","/api/sira-category","/api/sira-product"])must(server.includes(e),`${e} absent du serveur`);
must(js.includes("purchaseDiscount:50"),"remise Sira non copiée dans le produit sélectionné");must(js.includes("configuratorType:\"shower-screen-v1153\""),"configuration paroi non persistée");
console.log("V11.53 configurators: OK");
