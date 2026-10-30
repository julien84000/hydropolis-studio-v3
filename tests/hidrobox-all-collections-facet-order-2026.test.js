'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const guided=fs.readFileSync(path.join(__dirname,'../public/hidrobox-guided.js'),'utf8');
const panelSpot=fs.readFileSync(path.join(__dirname,'../public/hidrobox-panel-spot-ui.js'),'utf8');
const slice=(start,end)=>{const a=guided.indexOf(start),b=guided.indexOf(end,a+1);assert(a>=0&&b>a,start);return guided.slice(a,b)};
const order=(src,steps)=>{
 let index=-1;
 for(const step of steps){
  const next=src.indexOf(step,index+1);
  assert(next>index,'Missing or out-of-order facet '+step);
  index=next;
 }
};
test('Generic Hidrobox catalogue filters model, material, texture, colour, dimensions (no size-first)',()=>{
 const start=guided.slice(guided.indexOf('const FACE_KEYS='),guided.indexOf('const universalDraft=',guided.indexOf('const FACE_KEYS=')));
 order(start,["['model','Modèle']","['material','Matière']","['finish','Finition / texture']","['color','Couleur']","['width','Largeur / tranche tarifaire']"]);
 const generic=slice('function universalPage(','function values(arr)');
 order(generic,["title:'1 · Modèle'","title:'2 · Matière'","title:'3 · Texture'","title:'4 · Couleur'","title:'5 · Dimensions'"]);
 assert.match(generic,/genericWorkflow/);
 assert.match(generic,/sourceBacked/);
});
test('Neo Plus original supplier logic uses model material texture colour then dimensions',()=>{
 const page=slice('function neoPage(','async function open(');
 order(page,["opts('hnForm'","opts('hnMaterial'","opts('hnTexture'","opts('hnGroup'","opts('hnColor'","opts('hnWidth'","opts('hnLength'"]);
 assert.match(page,/catalogue\.lookup\(neo\)/);
 assert.match(page,/HydroHidroboxShowerOptions2026/);
});
test('Space, Beta Essential, Beta Evoque and Program keep product-specific pricing and display material and texture',()=>{
 for(const [start,end,steps] of [
 ['function spacePage(','function loadBetaEvoqueModel(',['1 · Modèle','2 · Matière et texture','3 · Couleur','4 · Dimensions']],
 ['function betaEvoquePage(','function loadBetaEssentialModel(',['1 · Modèle','2 · Matière et texture','3 · Couleur','4 · Dimensions']],
 ['function betaEssentialPage(','function restoreHidroboxSelection(',['1 · Type et forme','2 · Matière et texture','3 · Couleur','4 · Dimensions']],
 ['function programPage(','function loadSpaceModel(',['1 · Modèle','3 · Matière et texture','4 · Couleur','5 · Dimensions']]
 ]){
  const body=slice(start,end);
  order(body,steps);
  assert.match(body,/\.quote\(/,'must preserve the manufacturer quote engine: '+start);
 }
});
test('Panel and Spot explicitly show the same sequential axes and retain real tariffs',()=>{
 for(const section of ['function panel(g,ctx)','function spot(g,ctx)']){
  const body=panelSpot.slice(panelSpot.indexOf(section));
  order(body,['1 · Modèle','2 · Matière','3 · Texture','4 · Couleur','5 · Dimensions']);
  assert.match(body,/\.quote\(/,'tariff still quoted for '+section);
 }
});

test('Space and Beta bath tariff modules are loaded before guided UI to avoid asynchronous opening stalls',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 const sw=fs.readFileSync(path.join(__dirname,'../public/sw.js'),'utf8');
 const guidedAt=html.indexOf('hidrobox-guided.js?v=__APP_VERSION__');
 for(const file of ['hidrobox-space-2026.js','hidrobox-beta-essential-2026.js','hidrobox-beta-evoque-2026.js']){
   assert(html.indexOf(file+'?v=__APP_VERSION__')>0);
   assert(html.indexOf(file+'?v=__APP_VERSION__')<guidedAt);
   assert(sw.includes('/'+file));
 }
});
