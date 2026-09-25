"use strict";
const fs=require("fs");
const app=fs.readFileSync("public/v1147.js","utf8");
const server=fs.readFileSync("server.js","utf8");
const idx=fs.readFileSync("public/index.html","utf8");
for(const s of ["HYDROPOLIS_STUDIO_V11_47","/api/resigres-assets","Site officiel Resigres","Fiche PDF","3D ↗"]){if(!app.includes(s)&&!server.includes(s))throw new Error("V11.47 absent: "+s)}
if(!server.includes("V11.47_RESIGRES_OFFICIAL_ASSETS"))throw new Error("endpoint officiel Resigres non installé");
if(!idx.includes("v1147.js")||!idx.includes("v1147.css"))throw new Error("assets V11.47 non chargés");
console.log("V11.47 static: OK");
