'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const root=__dirname, pub=path.join(root,'public');
const indexPath=path.join(pub,'index.html'), appPath=path.join(pub,'app.js');
let html=fs.readFileSync(indexPath,'utf8');
html=html.replace(/<script src="\/alpi-integration\.js\?v=[^"]+"><\/script>/g,'<script src="/alpi-integration.js?v=11.56"></script>');
if(!html.includes('/v1156-official-assets.js')) html=html.replace('</body>','<script src="/v1156-official-assets.js?v=11.56"></script>\n</body>');
fs.writeFileSync(indexPath,html,'utf8');

let app=fs.readFileSync(appPath,'utf8');
const oldSira='const remote=productData.primaryImage||productData.images?.[0]||""';
const newSira='const remote=(productData.imagesByColor&&productData.imagesByColor[color])||productData.primaryImage||productData.images?.[0]||""';
if(app.includes(oldSira)) app=app.replace(oldSira,newSira);
fs.writeFileSync(appPath,app,'utf8');

for(const f of ['official-assets-server.js','assets-server.js','public/alpi-integration.js','public/v1156-official-assets.js','public/app.js']){
 const r=cp.spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});assert.equal(r.status,0,`${f}: ${r.stderr||'erreur de syntaxe'}`);
}
html=fs.readFileSync(indexPath,'utf8');app=fs.readFileSync(appPath,'utf8');
assert(html.includes('/alpi-integration.js?v=11.56'),'ALPI V11.56 non injecté');
assert(html.includes('/v1156-official-assets.js?v=11.56'),'Resolver V11.56 non injecté');
assert(app.includes(newSira),'Sélection image Sira par pigment non appliquée');
console.log('V11.56 : ALPI officiel + Sira pigment + Gessi Area Pro + corps encastrement existant validés.');
