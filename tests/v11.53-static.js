"use strict";
const fs=require("fs"),path=require("path"),root=path.join(__dirname,"..");const must=(c,m)=>{if(!c)throw new Error(m)};
const apply=fs.readFileSync(path.join(root,"apply-v11.53-consolidated.js"),"utf8"),js=fs.readFileSync(path.join(root,"public/v1153.js"),"utf8"),css=fs.readFileSync(path.join(root,"public/v1153.css"),"utf8");
must(apply.includes('apply-v11.52-consolidated.js'),"héritage V11.52 absent");must(apply.includes('siraconcrete.com'),"allowlist Sira absente");must(js.includes('Configurer + ajouter'),"CTA configurateur absent");must(js.includes('Prix public HT 2026'),"prix paroi absent");must(js.includes('Coût achat calculé'),"coût Sira absent");must(css.includes('.v1153-modal'),"CSS configurateur absent");console.log("V11.53 static: OK");
