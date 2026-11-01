'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const js=name=>fs.readFileSync(path.join(__dirname,'../public',name),'utf8');

test('Neo Plus only offers manufacturer-priced size pairs for shape, material and texture',()=>{
 const ctx={window:{}};vm.runInNewContext(js('hidrobox-neo-plus-2026.js'),ctx);
 const api=ctx.window.HydroNeoPlus2026;
 for(const form of ['rectangle','square','angular','angularR','angularL','pentagonal','pentagonalR']){
  for(const material of ['Kromat','Scene']){
   const texture='Lisse',group=material==='Scene'?'BLA':'BAS',color=material==='Scene'?'Blanc':'Bianco';
   const sizes=api.allowedSizes({form,material,texture,group,color});
   for(const width of sizes.widths)for(const length of sizes.lengthsByWidth[width]||[]){
     const row=api.lookup({form,material,texture,group,color,width,length});
     assert.equal(row.ok,true,form+' '+material+' '+width+'x'+length+' '+row.reason);
   }
   if(sizes.widths.length){
     assert.equal(sizes.widthMin,Math.min(...sizes.widths));
     assert.equal(sizes.widthMax,Math.max(...sizes.widths));
   }
  }
 }
 const angular=api.allowedSizes({form:'angularR',material:'Kromat',texture:'Lisse',group:'BAS',color:'Bianco'});
 assert(angular.widthMax<=90&&angular.lengthMax<=120,'Angular R must not inherit rectangle maxima');
});
test('All shower tray collection ranges are displayed, without assuming every max pair is valid',()=>{
 const guide=js('hidrobox-guided.js');
 assert.match(guide,/data-hb-dimension-limits/);
 assert.match(guide,/Seuls les couples largeur × longueur effectivement tarifés sont proposés/);
 assert.match(guide,/toute combinaison non tarifée reste refusée/);
 assert.match(guide,/catalogue\.allowedSizes\?\.\(neo\)/);
});
test('Authentic Spot and FS manufacturer thumbnails are present and card layout is bounded',()=>{
 const ctx={window:{}};
 vm.runInNewContext(js('hidrobox-official-minis-2026.js'),ctx);
 const art=ctx.window.HydroHidroboxOfficialMinis2026;
 assert.equal(art.list('spot').length,31);
 assert(art.list('fs').length>=19);
 assert.equal(art.list('beta-essential').length,8);
 assert.equal(art.list('beta-evoque').length,3);
 assert.equal(art.list('beta-fusion').length,6);
 for(const name of ['Spot 1','Spot 62','Spot 186','FS 9 R/L']){
   const graphic=art.get(name.startsWith('Spot')?'spot':'fs',name);
   assert.match(graphic,/<svg\b/);
   assert.doesNotMatch(graphic,/<script\b|<foreignObject\b/i);
 }
 const spot=js('hidrobox-panel-spot-ui.js'),css=js('styles.css');
 assert.match(spot,/HydroHidroboxOfficialMinis2026\?\.get\('spot',name\)/);
 assert.match(css,/\.hb-spot-grid/);
 assert.match(css,/\.hb-spot-thumb\[hidden\]/);
 assert.match(css,/\.hb-spot-diagram svg/);
});
test('Space real colour names are saved without inventing colour-specific supplier prices',()=>{
 const guide=js('hidrobox-guided.js');
 const start=guide.indexOf('function spacePage('),end=guide.indexOf('function loadBetaEvoqueModel(',start);
 const section=guide.slice(start,end);
 assert.match(section,/data-hs-color-name/);
 assert.match(section,/s\.colourName/);
 assert.match(section,/BAS/);
 assert.match(section,/TRE/);
 assert.match(section,/SPE/);
 assert.match(section,/colourReady/);
 assert.match(section,/selectedColor:s\.colourName/);
 assert.match(section,/colourName:s\.colourName/);
 const bath=js('hidrobox-space-2026.js');
 assert.match(bath,/Plus Colour price INCLUDES its colour/);
 assert.match(bath,/state\.colour/);
 assert.doesNotMatch(bath,/state\.colourName\s*\*/,'colour label must not multiply price');
});
test('Bette visuals and Galassia Explorer fixes remain present after branch port',()=>{
 assert.match(js('brand-configurators.js'),/BETTE_3D_URL='https:\/\/www\.my-bette\.com\/fr\/configurator\/products'/);
 assert.match(js('index.html'),/bette-showcase\.css/);
 assert.match(js('index.html'),/hidrobox-official-minis-2026\.js/);
 assert.match(js('galassia-configurator.css'),/galassia-launcher button/);
});
