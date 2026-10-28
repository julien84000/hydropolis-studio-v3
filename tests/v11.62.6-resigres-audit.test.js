'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..'),pub=path.join(root,'public');
const cfg=JSON.parse(fs.readFileSync(path.join(pub,'resigres_2026_config.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(pub,'catalog_resigres_2026.json'),'utf8'));
const app=fs.readFileSync(path.join(pub,'app.js'),'utf8');
function engine(name){
 const start=app.indexOf('/* SOURCE public/'+name+'.js */'),end=app.indexOf('/* SOURCE public/',start+12);
 assert(start>=0&&end>start,'Pricing engine '+name+' must be bundled');
 const context={module:{exports:{}},window:{}};
 vm.runInNewContext(app.slice(start,end),context);
 return context.module.exports;
}
const V49=engine('v1149-pricing'),V50=engine('v1150-pricing');
const categoryCounts={'Receveur':7,'Plan de vasque':6,'Plan de vasque pour meuble':6,'Vasque':6,'Baignoire':4,'Meuble':4,'Miroir':3,'Complément':2};
const knownAuto=new Set(['Extraplano Contract|shower-tray','Vento / Vento Contract|shower-tray','Cosmo / Cosmo Contract|shower-tray','Urban|shower-tray','Nix / Nix Contract|shower-tray','Vento CF|basin-top','Urban CF|basin-top','Contract CF|basin-top','Selene|furniture-basin-top','Vento SF|furniture-basin-top','Urban SF|furniture-basin-top','Contract SF|furniture-basin-top','Tiroirs sur mesure|furniture','Nalu|bath','Delia|bath','RD / SQ|mirror','FS / FL|mirror']);
const pendingMatrix=new Set(['Extraplano Latéral|shower-tray','Extraplano Central / 1/4 rond|shower-tray','Atenea|basin-top','Cosmo CF|basin-top','Gea CF|basin-top','Cosmo SF|furniture-basin-top','Gea SF|furniture-basin-top','Portes, vides et colonnes|furniture','Frame|furniture','Gesto|furniture']);
const key=m=>m.name+'|'+m.kind;
test('Resigres: 38 model configurations match every imported catalogue article and all 8 categories',()=>{
 assert.equal(cfg.models.length,38);
 assert.equal(catalog.length,38);
 const configNames=new Set(cfg.models.map(key)),productNames=new Set(catalog.map(p=>p.resigresModel+'|'+p.resigresKind));
 assert.equal(configNames.size,38);assert.equal(productNames.size,38);
 assert.deepEqual([...productNames].sort(),[...configNames].sort());
 const counts={};for(const m of cfg.models)counts[m.category]=(counts[m.category]||0)+1;
 assert.deepEqual(counts,categoryCounts);
 assert.equal(cfg.version,'2026-FR-v6');
 assert.ok(cfg.models.every(m=>/^\d{1,2}(?:-\d{1,2})?$/.test(String(m.sourcePage||''))));
});
test('Resigres: classify all 38 models by pricing evidence, never assume missing matrices are priced',()=>{
 const uncoded=cfg.models.filter(m=>!knownAuto.has(key(m))&&!pendingMatrix.has(key(m)));
 assert.equal(knownAuto.size,17);
 assert.equal(pendingMatrix.size,10);
 assert.equal(uncoded.length,11);
 for(const model of cfg.models){
   const name=key(model);
   if(knownAuto.has(name)){
     assert.ok((model.pricingRules||[]).length||model.v50BasinTop?.pricingMode?.startsWith('automatic')||model.v50Furniture?.pricingMode==='automatic','Expected a pricing rule for '+name);
   }
   if(pendingMatrix.has(name)&&model.v50BasinTop){
     assert.equal(model.v50BasinTop.pricingMode,'manual-safe',name);
     assert.ok(model.v50BasinTop.groups?.every(g=>Object.keys(g.prices||{}).length===0),name);
   }
 }
});
test('Resigres: every imported positive price and grid has consistent numerical structure',()=>{
 for(const m of cfg.models){
   for(const rule of m.pricingRules||[]){
     if(rule.matrix){
       assert.equal(rule.matrix.length,rule.widths.length,m.name+' widths');
       for(const row of rule.matrix){
         assert.equal(row.length,rule.lengths.length,m.name+' lengths');
         assert.ok(row.every(x=>x===null||Number.isFinite(x)&&x>0),m.name+' malformed matrix');
       }
     }
     for(const x of Object.values(rule.rates||{}))assert(x>0,m.name+' bad square-meter rate');
   }
   for(const group of m.v50BasinTop?.groups||[]){
     for(const [material,amounts] of Object.entries(group.prices||{})){
       assert.equal(amounts.length,group.lengthTiers.length,m.name+' '+group.id+' '+material+' mismatched length');
       assert.ok(amounts.every(x=>Number.isFinite(x)&&x>0),m.name+' invalid '+material+' price');
     }
   }
   for(const [mat,amounts] of Object.entries(m.v50Furniture?.prices||{})){
     assert.ok(amounts.every(x=>Number.isFinite(x)&&x>0),m.name+' invalid '+mat+' price');
   }
 }
});
test('Selene: automatic tariff 907 EUR HT for 150 cm length x 51 cm depth, page 26; supplements updated',()=>{
 const data={model:'Selene',kind:'furniture-basin-top',shape:'standard',material:'solid-surface',
   color:'S-Blanco',basinGroup:'one',widthCm:51,lengthCm:150,paidOptions:{}};
 const quote=V50.basinQuote(cfg,data);
 assert.equal(quote.status,'automatic');
 assert.equal(quote.basePrice,907);
 assert.equal(quote.total,907);
 assert.equal(quote.pricedLength,161);
 assert.equal(quote.rule.sourcePage,'26');
 assert.equal(V50.basinQuote(cfg,{...data,paidOptions:{'colored-waste':1}}).total,973);
 const swapped=V50.basinQuote(cfg,{...data,widthCm:150,lengthCm:51});
 assert.equal(swapped.status,'pending');
 assert.match(swapped.reason,/Largeur maximale 51 cm/);
 const beyond=V50.basinQuote(cfg,{...data,widthCm:51,lengthCm:210});
 assert.equal(beyond.status,'pending');
 assert.match(beyond.reason,/Longueur maximale 201 cm/);
});
test('Other Resigres families: fixed certified examples and rules remain functional',()=>{
 const cosmo=V49.showerQuote(cfg,{model:'Cosmo / Cosmo Contract',kind:'shower-tray',variant:'cosmo',
   finish:'Lisa',color:'Ártico',widthCm:73,lengthCm:140,options:[]});
 assert.equal(cosmo.status,'automatic');assert.equal(cosmo.basePrice,764);
 const vento=V50.basinQuote(cfg,{model:'Vento CF',kind:'basin-top',shape:'vento40',material:'lisa',
   color:'Ártico',basinGroup:'one',widthCm:50,lengthCm:70,paidOptions:{}});
 assert.equal(vento.status,'automatic');assert.equal(vento.basePrice,721);
 const contract=V50.basinQuote(cfg,{model:'Contract CF',kind:'basin-top',shape:'standard',material:'solid-surface',
   color:'S-Blanco',basinGroup:'one',basinCount:1,widthCm:50,lengthCm:100,heightCm:10,paidOptions:{}});
 assert.equal(contract.status,'automatic');assert.equal(contract.basePrice,689);
 const drawers=V50.furnitureQuote(cfg,{model:'Tiroirs sur mesure',type:'drawer',material:'lacquer',
   color:'Arena',widthCm:50,lengthCm:100,paidOptions:{}});
 assert.equal(drawers.status,'automatic');assert.equal(drawers.basePrice,406);
 const pending=V50.furnitureQuote(cfg,{model:'Frame',type:'h45-1d-1b',material:'lacquer',
   color:'Arena',widthCm:48,lengthCm:100,heightCm:45,depthCm:48,paidOptions:{}});
 assert.equal(pending.status,'pending');assert.match(pending.reason,/page 60/);
});
test('Manual price cannot be entered for inverted dimensions, out-of-grid lengths or incomplete furniture/shower details',()=>{
 assert.match(app,/Longueur du plan \(cm\)<input id="rg50Length"/);
 assert.match(app,/Profondeur du plan \(cm\)<input id="rg50Width"/);
 assert.match(app,/const manualAllowed=!auto/);
 assert.match(app,/rg50ManualWrap"\)\.classList\.contains\("hidden"\)/);
 assert.match(app,/rg50FManualWrap"\)\.classList\.contains\("hidden"\)/);
 assert.match(app,/rg49ManualWrap"\)\.classList\.contains\("hidden"\)/);
 const m=cfg.models.find(x=>x.name==='Atenea').v50BasinTop;
 const quote=V50.basinQuote(cfg,{model:'Atenea',kind:'basin-top',shape:m.shapes[0].id,material:m.materials[0].id,
   color:m.materials[0].colors[0],basinGroup:m.groups[0].id,widthCm:50,lengthCm:300,paidOptions:{}});
 assert.equal(quote.status,'pending');
 assert.match(quote.reason,/Longueur maximale|Longueur hors grille tarifaire/);
});
