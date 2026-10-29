'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..','public');

test('Hidrobox catalog exposes direct entry to nine official product categories',()=>{
 const code=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.match(code,/hidroboxActive=\/\^Hidrobox\$\/i/);
 assert.match(code,/hidroboxCategories=window\.HydroHidroboxConfigurator\?\.officialCategories/);
 assert.match(code,/hidrobox-catalog-categories/);
 assert.match(code,/data-hidrobox-category/);
 assert.match(code,/guide\.open\(null,roomId,button\.dataset\.hidroboxCategory\|\|""\)/);
 const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
 assert.match(css,/@media\(max-width:720px\)\{\.hidrobox-catalog-launcher/);
});

test('Hidrobox category screen opens before price loading and stays browsable without tariff',async()=>{
 let resolveGroups;
 const element={
   innerHTML:'',
   addEventListener(){},
   remove(){},
   querySelector(){return {addEventListener(){},onclick:null};},
   querySelectorAll(){return [];}
 };
 const document={
   createElement(){return element;},
   body:{appendChild(){}}
 };
 const win={
   HydroHidroboxConfigurator:{groups:()=>new Promise(resolve=>{resolveGroups=resolve;})},
   HydroNeoPlus2026:{FORMATS:[],COLORS:{},lookup(){return {ok:false};}}
 };
 vm.runInNewContext(fs.readFileSync(path.join(root,'hidrobox-guided.js'),'utf8'),{window:win,document});
 const guide=win.HydroHidroboxConfigurator;
 const pending=guide.open(null,'r1','vasques-a-poser');
 assert.match(element.innerHTML,/Vasques à poser/);
 assert.match(element.innerHTML,/data-kind="collection" data-choice="spot"/);
 assert.match(element.innerHTML,/Chargement des tarifs/);
 resolveGroups([]);
 await pending;
 assert.match(element.innerHTML,/Spot/);
 assert.match(element.innerHTML,/Tarifs momentanément indisponibles/);
 guide.close();
});
