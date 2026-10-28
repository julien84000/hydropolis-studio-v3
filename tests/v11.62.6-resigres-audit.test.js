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
const knownAuto=new Set(['Extraplano Central / 1/4 rond|shower-tray','Extraplano Contract|shower-tray','Vento / Vento Contract|shower-tray','Cosmo / Cosmo Contract|shower-tray','Urban|shower-tray','Nix / Nix Contract|shower-tray','Vento CF|basin-top','Cosmo CF|basin-top','Gea CF|basin-top','Urban CF|basin-top','Contract CF|basin-top','Atenea|basin-top','Selene|furniture-basin-top','Vento SF|furniture-basin-top','Cosmo SF|furniture-basin-top','Gea SF|furniture-basin-top','Urban SF|furniture-basin-top','Contract SF|furniture-basin-top','Tiroirs sur mesure|furniture','Frame|furniture','Gesto|furniture','Nalu|bath','Delia|bath','RD / SQ|mirror','FS / FL|mirror','Nesta|bath','Vento|bath','Axis|basin','Ares|basin','Crono|basin','Kos / Neo|basin','Gesto / Frame|basin','Urban|basin','Porte-serviettes|accessory','Panneaux / étagères|accessory']);
const pendingMatrix=new Set(['Extraplano Latéral|shower-tray','Portes, vides et colonnes|furniture']);
const key=m=>m.name+'|'+m.kind;
test('Resigres: 38 model configurations match every imported catalogue article and all 8 categories',()=>{
 assert.equal(cfg.models.length,38);
 assert.equal(catalog.length,38);
 const configNames=new Set(cfg.models.map(key)),productNames=new Set(catalog.map(p=>p.resigresModel+'|'+p.resigresKind));
 assert.equal(configNames.size,38);assert.equal(productNames.size,38);
 assert.deepEqual([...productNames].sort(),[...configNames].sort());
 const counts={};for(const m of cfg.models)counts[m.category]=(counts[m.category]||0)+1;
 assert.deepEqual(counts,categoryCounts);
 assert.equal(cfg.version,'2026-FR-v10');
 assert.ok(cfg.models.every(m=>/^\d{1,2}(?:-\d{1,2})?$/.test(String(m.sourcePage||''))));
});
test('Resigres: classify all 38 models by pricing evidence, never assume missing matrices are priced',()=>{
 const uncoded=cfg.models.filter(m=>!knownAuto.has(key(m))&&!pendingMatrix.has(key(m)));
 assert.equal(knownAuto.size,35);
 assert.equal(pendingMatrix.size,2);
 assert.equal(uncoded.length,1);
 for(const model of cfg.models){
   const name=key(model);
   if(knownAuto.has(name)){
     assert.ok((model.pricingRules||[]).length||model.v50BasinTop?.pricingMode?.startsWith('automatic')||['automatic','partial-automatic'].includes(model.v50Furniture?.pricingMode)||model.dependencyMatrix?.type==='dependent-combinations','Expected a pricing rule for '+name);
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
       assert.ok(amounts.every(x=>x===null||Number.isFinite(x)&&x>0),m.name+' invalid '+material+' price');
     }
   }
   for(const [mat,amounts] of Object.entries(m.v50Furniture?.prices||{})){
     assert.ok(amounts.every(x=>x===null||Number.isFinite(x)&&x>0),m.name+' invalid '+mat+' price');
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


test('V11.62.7: Selene offers a one-click recovery for swapped length/depth while retaining source prices',()=>{
 assert.match(app,/id="rg50SwapHint"/);
 assert.match(app,/id="rg50SwapButton"/);
 assert.match(app,/s\.widthCm>maxDepth&&s\.lengthCm>=minDepth&&s\.lengthCm<=maxDepth/);
 assert.match(app,/previousLength=length\.value/);
 assert.match(app,/length\.value=depth\.value;depth\.value=previousLength;update\(\)/);
 assert.match(app,/Exemple Selene : <strong>150 × 51 cm<\/strong>/);
 const swapped={model:'Selene',kind:'furniture-basin-top',shape:'standard',material:'solid-surface',
   color:'S-Blanco',basinGroup:'one',widthCm:150,lengthCm:51,paidOptions:{}};
 assert.equal(V50.basinQuote(cfg,swapped).status,'pending');
 const repaired=V50.basinQuote(cfg,{...swapped,widthCm:51,lengthCm:150});
 assert.equal(repaired.status,'automatic');
 assert.equal(repaired.total,907);
});
test('V11.62.7 warns on stale running frontend without silent reload of unsaved projects',()=>{
 assert.match(app,/function checkForNewVersion\(/);
 assert.match(app,/fetch\("\/api\/version",\{cache:"no-store"/);
 assert.match(app,/hydroVersionUpdate/);
 assert.match(app,/hydroVersionReload/);
 assert.match(app,/location\.reload\(\)/);
 assert.match(app,/serviceWorker\.register\("\/sw\.js",\{updateViaCache:"none"\}\)/);
 const css=fs.readFileSync(path.join(pub,'styles.css'),'utf8');
 assert.match(css,/\.rg50-swap-hint/);
 assert.match(css,/#hydroVersionUpdate/);
});


test('V11.62.8: Gea CF wood Nogal US 140 × 45 × 5 cm automatically prices at 986 EUR HT, tier 141 cm (supplier p.22)',()=>{
 const selection={model:'Gea CF',kind:'basin-top',shape:'gea',material:'wood',color:'Nogal US',
   basinGroup:'slab',lengthCm:140,widthCm:45,heightCm:5,paidOptions:{}};
 const q=V50.basinQuote(cfg,selection);
 assert.equal(q.status,'automatic');assert.equal(q.pricingStatus,'automatic-verified');
 assert.equal(q.total,986);assert.equal(q.pricedLength,141);assert.equal(q.rule.sourcePage,'22');
 assert.equal(V50.basinQuote(cfg,{...selection,lengthCm:141}).total,986);
 assert.equal(V50.basinQuote(cfg,{...selection,lengthCm:142}).total,1094);
 assert.equal(V50.basinQuote(cfg,{...selection,paidOptions:{'towel-rail':1}}).total,1106);
 assert.equal(V50.basinQuote(cfg,{...selection,material:'lisa',color:'Ártico'}).total,796);
 assert.equal(V50.basinQuote(cfg,{...selection,material:'solid-surface',color:'S-Blanco'}).total,859);
 assert.equal(V50.basinQuote(cfg,{...selection,material:'gpc',color:'Onix'}).total,1645);
 assert.equal(V50.basinQuote(cfg,{...selection,material:'lisa',color:'RAL/NCS'}).total,891);
 assert.equal(V50.basinQuote(cfg,{...selection,widthCm:29}).status,'pending');
 assert.equal(V50.basinQuote(cfg,{...selection,widthCm:52}).status,'pending');
 assert.equal(V50.basinQuote(cfg,{...selection,heightCm:4}).status,'pending');
 assert.equal(V50.basinQuote(cfg,{...selection,heightCm:15}).status,'pending');
 assert.equal(V50.basinQuote(cfg,{...selection,lengthCm:49}).status,'pending');
 assert.equal(V50.basinQuote(cfg,{...selection,material:'wood',color:'S-Blanco'}).status,'pending');
});
test('V11.62.8: Gea SF source p.34, distinct material tariffs and fixed thickness, no GPC',()=>{
 const selection={model:'Gea SF',kind:'furniture-basin-top',shape:'gea',material:'wood',
  color:'Nogal US',basinGroup:'slab',lengthCm:140,widthCm:45,heightCm:1.5,paidOptions:{}};
 const q=V50.basinQuote(cfg,selection);
 assert.equal(q.status,'automatic');assert.equal(q.total,627);assert.equal(q.pricedLength,141);
 assert.equal(q.rule.sourcePage,'34');
 assert.equal(V50.basinQuote(cfg,{...selection,lengthCm:142}).total,681);
 assert.equal(V50.basinQuote(cfg,{...selection,material:'lisa',color:'Arena'}).total,480);
 assert.equal(V50.basinQuote(cfg,{...selection,material:'solid-surface',color:'S-Blanco'}).total,572);
 assert.equal(V50.basinQuote(cfg,{...selection,heightCm:5}).status,'pending');
 assert.equal(V50.basinQuote(cfg,{...selection,material:'gpc',color:'Onix'}).status,'pending');
});

test('V11.62.9: Atenea official 2026 p.14: Standard Solid Surface S-Blanco 140 × 51 cm is 1098 EUR HT',()=>{
 const sel={model:'Atenea',kind:'basin-top',shape:'standard',material:'solid-surface',color:'S-Blanco',
  basinGroup:'one',widthCm:51,lengthCm:140,paidOptions:{}};
 const q=V50.basinQuote(cfg,sel);
 assert.equal(q.status,'automatic');assert.equal(q.total,1098);assert.equal(q.pricedLength,141);assert.equal(q.rule.sourcePage,'14');
 assert.equal(V50.basinQuote(cfg,{...sel,lengthCm:142}).total,1228);
 assert.equal(V50.basinQuote(cfg,{...sel,material:'lisa',color:'Arena'}).total,938);
 assert.equal(V50.basinQuote(cfg,{...sel,material:'gpc',color:'Onix'}).status,'pending'); // Unreadable glyph p.14: never guess
 assert.equal(V50.basinQuote(cfg,{...sel,shape:'oval',material:'gpc',color:'Onix'}).status,'pending');
 assert.equal(V50.basinQuote(cfg,{...sel,widthCm:52}).status,'pending');
 assert.equal(V50.basinQuote(cfg,{...sel,paidOptions:{'towel-rail':1}}).total,1218);
});
test('V11.62.9: Cosmo CF and SF tariffs by basin number and XL version, no unsupported automatic price',()=>{
 const base={model:'Cosmo CF',kind:'basin-top',shape:'cosmo-standard',material:'lisa',color:'Arena',
  basinGroup:'one',widthCm:51,lengthCm:140,paidOptions:{}};
 const q=V50.basinQuote(cfg,base);
 assert.equal(q.status,'automatic');assert.equal(q.total,1100);assert.equal(q.pricedLength,141);
 assert.equal(V50.basinQuote(cfg,{...base,lengthCm:90}).status,'pending'); // PDF digit damaged for resin 82–101 cm
 assert.equal(V50.basinQuote(cfg,{...base,material:'gpc',color:'Onix'}).total,2798);
 assert.equal(V50.basinQuote(cfg,{...base,basinGroup:'two',lengthCm:140}).total,1175);
 assert.equal(V50.basinQuote(cfg,{...base,shape:'cosmo-xl85',basinGroup:'one-xl85',lengthCm:140}).total,1073);
 assert.equal(V50.basinQuote(cfg,{...base,shape:'cosmo-xl120',basinGroup:'one-xl120',lengthCm:160}).total,1540);
 const sf={...base,model:'Cosmo SF',kind:'furniture-basin-top'};
 assert.equal(V50.basinQuote(cfg,sf).total,871);
 assert.equal(V50.basinQuote(cfg,{...sf,shape:'cosmo-xl120',basinGroup:'one-xl120',lengthCm:160}).total,1305);
 assert.equal(V50.basinQuote(cfg,{...sf,material:'gpc',color:'Onix'}).status,'pending');
});
test('V11.62.9: classify every source price slot on three imported models, recording unverified cells as null',()=>{
 const expected={'Atenea':54,'Cosmo CF':42,'Cosmo SF':21};
 let imported=0,unknown=0;
 for(const [name,slots] of Object.entries(expected)){
  const m=cfg.models.find(x=>x.name===name),groups=m.v50BasinTop.groups;
  assert.equal(m.v50BasinTop.pricingMode,'automatic');
  let count=0;
  for(const g of groups)for(const [mat,prices]of Object.entries(g.prices)){assert.equal(prices.length,g.lengthTiers.length);count+=prices.length;unknown+=prices.filter(x=>x===null).length;}
  assert.equal(count,slots);imported+=count;
 }
 assert.equal(imported,117);
 assert.equal(unknown,5);
});

test('V11.62.9: cross-category supplier variant tariffs and commercial options, without invented cells',()=>{
 const linked={module:{exports:{}},window:{}};
 for(const part of ['v1146-pricing','v1148-pricing']){
  const begin=app.indexOf('/* SOURCE public/'+part+'.js */'),end=app.indexOf('/* SOURCE public/',begin+12);
  assert(begin>=0&&end>begin);
  linked.module={exports:{}};
  vm.runInNewContext(app.slice(begin,end),linked);
 }
 const V48=linked.module.exports;
 const cases=[
  ['Ares','basin','se','resin','Ártico',299],
  ['Crono','basin','mini','resin','Ártico',199],
  ['Kos / Neo','basin','kos','solid','S-Blanco',390],
  ['Gesto / Frame','basin','gesto-recto','resin','Ártico',376],
  ['Urban','basin','urban','solid','S-Blanco',518],
  ['Porte-serviettes','accessory','frame-mini','lacquer','Ártico',48],
  ['Panneaux / étagères','accessory','shelf-80','solid','S-Blanco',246],
  ['Nesta','bath','80x160','solid-surface','S-Blanco',3556],
  ['Vento','bath','80x170','solid-surface','S-Blanco',3794]
 ];
 for(const [model,kind,size,material,color,price]of cases){
  const q=V48.dependentQuote(cfg,{model,kind,size,material,color,options:[]});
  assert.equal(q.status,'automatic',model);assert.equal(q.total,price,model);
 }
 const waste=V48.dependentQuote(cfg,{model:'Crono',kind:'basin',size:'mini',material:'resin',color:'Ártico',options:['colored-waste']});
 assert.equal(waste.total,265);
 assert.equal(V48.dependentQuote(cfg,{model:'Ares',kind:'basin',size:'h90',material:'resin',color:'Ártico'}).status,'pending');
 assert.equal(V48.dependentQuote(cfg,{model:'Panneaux / étagères',kind:'accessory',size:'shelf-80',material:'resin',color:'RAL/NCS'}).total,226);
});

test('V11.62.10: source p4 receveur Extraplano 1/4 rond uniquement aux dimensions standards',()=>{
 const config=(w,l,finish)=>({model:'Extraplano Central / 1/4 rond',kind:'shower-tray',variant:'quarter',finish,color:'Ártico',widthCm:w,lengthCm:l,options:[]});
 assert.equal(V49.showerQuote(cfg,config(80,80,'Pizarra standard')).total,310);
 assert.equal(V49.showerQuote(cfg,config(90,90,'Pizarra standard')).total,381);
 assert.equal(V49.showerQuote(cfg,config(100,100,'Solid Surface')).total,859);
 assert.equal(V49.showerQuote(cfg,config(90,90,'Pizarra sur mesure')).total,416);
 assert.equal(V49.showerQuote(cfg,config(85,85,'Pizarra standard')).status,'pending');
 assert.equal(V49.showerQuote(cfg,config(90,100,'Pizarra standard')).status,'pending');
 assert.equal(V49.showerQuote(cfg,config(100,100,'Lisa')).status,'pending');
});
test('V11.62.10: Frame H45 avec plan et Gesto par hauteur : grilles fabricant et protections',()=>{
 const frame={model:'Frame',kind:'furniture',type:'h45-1d-1b',material:'lacquer',color:'Arena',topFinish:'lisa',topColor:'Ártico',widthCm:48,depthCm:48,heightCm:45,lengthCm:100,paidOptions:{}};
 const q=V50.furnitureQuote(cfg,frame);
 assert.equal(q.status,'automatic');assert.equal(q.total,2380);assert.equal(q.pricedLength,100);
 assert.equal(V50.furnitureQuote(cfg,{...frame,material:'wood',color:'Nogal US'}).total,2595);
 assert.equal(V50.furnitureQuote(cfg,{...frame,topFinish:'gpc',topColor:'Onix'}).total,4431);
 assert.equal(V50.furnitureQuote(cfg,{...frame,topColor:'RAL/NCS'}).status,'pending');
 assert.equal(V50.furnitureQuote(cfg,{...frame,heightCm:60}).status,'pending');
 assert.equal(V50.furnitureQuote(cfg,{...frame,lengthCm:210}).status,'pending');
 assert.equal(V50.furnitureQuote(cfg,{...frame,type:'h90-doors-1b'}).status,'pending');
 const gesto={model:'Gesto',kind:'furniture',type:'h30',material:'lacquer',color:'Arena',widthCm:50,depthCm:50,heightCm:30,lengthCm:80,paidOptions:{}};
 assert.equal(V50.furnitureQuote(cfg,gesto).total,1198);
 assert.equal(V50.furnitureQuote(cfg,{...gesto,type:'h60',heightCm:60}).total,1579);
 assert.equal(V50.furnitureQuote(cfg,{...gesto,type:'h75',heightCm:75,lengthCm:50}).total,1536);
 assert.equal(V50.furnitureQuote(cfg,{...gesto,type:'h60',heightCm:60,lengthCm:100}).status,'pending');
 assert.equal(V50.furnitureQuote(cfg,{...gesto,widthCm:52}).status,'pending');
});
test('V11.62.10: Axis source p38 and panels/socles source p71 use exact finish/size prices',()=>{
 const linked={module:{exports:{}},window:{}};
 for(const part of ['v1146-pricing','v1148-pricing']){
  const begin=app.indexOf('/* SOURCE public/'+part+'.js */'),end=app.indexOf('/* SOURCE public/',begin+12);
  assert(begin>=0&&end>begin);linked.module={exports:{}};vm.runInNewContext(app.slice(begin,end),linked);
 }
 const V48=linked.module.exports;
 const axis=(size,material,color,options=[])=>V48.dependentQuote(cfg,{model:'Axis',kind:'basin',size,material,color,options});
 assert.equal(axis('axis-free','lisa','Ártico').total,390);
 assert.equal(axis('axis-free','solid','S-Blanco').total,470);
 assert.equal(axis('axis-wall','solid','S-Blanco').total,780);
 assert.equal(axis('axis-floor','solid','S-Blanco').total,1763);
 assert.equal(axis('axis-free','lisa','Ártico',['colored-waste']).total,445);
 assert.equal(axis('axis-wall','lisa','Ártico').status,'pending');
 const panel=(size,material,color,w,l,opts=[])=>V48.dependentQuote(cfg,{model:'Panneaux / étagères',kind:'accessory',size,material,color,widthCm:w,lengthCm:l,options:opts});
 assert.equal(panel('panel-area','resin','Ártico',120,200).total,696);
 assert.equal(panel('panel-area','solid','S-Blanco',100,100).total,395);
 assert.equal(panel('plinth-area','resin','RAL/NCS',20,50,['finished-edge']).total,157.5);
 assert.equal(panel('panel-area','resin','Ártico',130,200).status,'pending');
 assert.equal(panel('plinth-area','solid','S-Blanco',21,100).status,'pending');
 assert.equal(panel('shelf-40','resin','Ártico',0,0).total,140);
});
test('V11.62.10: all new furniture price tables are dimensionally consistent and do not contain invented zero prices',()=>{
 for(const m of cfg.models)for(const [type,table] of Object.entries(m.v50Furniture?.priceTablesByType||{})){
  assert.ok(m.v50Furniture.types.some(t=>t.id===type));
  assert.ok(table.lengthTiers.length);
  for(const [key,prices]of Object.entries(table.prices)){
   assert.equal(table.lengthTiers.length,prices.length,m.name+':'+key);
   assert.ok(prices.every(x=>x===null||Number.isInteger(x)&&x>0),m.name+':'+key);
  }
 }
});
