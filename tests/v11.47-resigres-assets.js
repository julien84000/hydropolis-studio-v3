"use strict";
const fs=require("fs");
const server=fs.readFileSync("server.js","utf8");
for(const s of ["productos-banyeras.php","productos-platos-ducha.php","productos-encimeras-suspendidas.php","productos-lavabos.php","technicalSheetUrl","model3dUrl"]){if(!server.includes(s))throw new Error("Resolver Resigres incomplet: "+s)}
if(!/\.pdf/.test(server)||!/zip\|dwg\|dxf\|stp/.test(server))throw new Error("Types de documents Resigres incomplets");
console.log("V11.47 Resigres assets resolver: OK");
