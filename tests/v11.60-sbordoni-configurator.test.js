'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function loadCatalog(){
  const files=fs.readdirSync(path.join(__dirname,'..','public')).filter(x=>/^catalog_sbordoni_\d+\.json$/.test(x));
  return files.flatMap(file=>JSON.parse(fs.readFileSync(path.join(__dirname,'..','public',file),'utf8')));
}

test('Sbordoni configurator groups 1/3-hole basin variants and keeps a shared basin visual',()=>{
  const CATALOG=loadCatalog();
  const context={
    window:{},
    CATALOG,
    console,
    esc:v=>String(v??''),
    euro:v=>String(v??0),
    document:{}
  };
  vm.createContext(context);
  const code=fs.readFileSync(path.join(__dirname,'..','public','sbordoni-configurator.js'),'utf8');
  vm.runInContext(code,context,{filename:'sbordoni-configurator.js'});

  const cfg=context.window.HydroSbordoniConfigurator;
  assert.ok(cfg,'configurator exported');

  const one=CATALOG.find(x=>x.manufacturer==='Sbordoni'&&x.collection==='Neoclassica'&&x.reference==='5700/1');
  const three=CATALOG.find(x=>x.manufacturer==='Sbordoni'&&x.collection==='Neoclassica'&&x.reference==='5700/3');
  assert.ok(one&&three,'Neoclassica 5700 variants exist');
  assert.equal(cfg.eligible(one),true);
  assert.equal(cfg.eligible(three),true);
  assert.equal(cfg.catalogImage(one),three.image);
  assert.equal(cfg.catalogImage(three),three.image);

  const families=cfg.familiesForCollection('Neoclassica');
  for(const ref of ['5700','5775','5770','5765','5758'])assert.ok(families.includes(ref),`missing family ${ref}`);

  const supports5700=cfg.supportGroups('Neoclassica','5700');
  const keys5700=new Set(supports5700.map(x=>x.key));
  for(const key of ['P5700','N5700','Y5700','G571'])assert.ok(keys5700.has(key),`missing support ${key}`);

  const supports5775=cfg.supportGroups('Neoclassica','5775');
  assert.ok(supports5775.some(x=>x.items.some(i=>i.reference==='5771')),'shared pedestal 5771 offered for 5775');

  assert.ok(cfg.supportGroups('Masaccio','5359').some(x=>x.items.some(i=>i.reference==='5771')),'Masaccio 5359 offers pedestal 5771');
  assert.ok(cfg.supportGroups('Palladio','7064').some(x=>x.items.some(i=>i.reference==='7001')),'Palladio 7064 offers pedestal 7001');
  assert.ok(cfg.supportGroups('Romana','9065').some(x=>x.items.some(i=>i.reference==='9001')),'Romana 9065 offers pedestal 9001');

  const romanaPedestal=cfg.supportGroups('Romana','9065').flatMap(g=>Array.from(g.items)).find(i=>i.reference==='9001');
  assert.ok(romanaPedestal,'Romana 9065 pedestal 9001 exists');
  const romanaResultImage=cfg.resultImage('Romana','9065',romanaPedestal);
  assert.equal(
    romanaResultImage,
    'https://data.bobool.it/imgprodotto/colonna-classica-per-lavabo-in-ceramica-bianca-romana-sbordoni_17587_zoom.jpg'
  );
  assert.notEqual(romanaResultImage,romanaPedestal.image,'configured result must not reuse the isolated 9001 visual');
});

test('app routes configurable Sbordoni basins through the configurator',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
  assert.match(app,/HydroSbordoniConfigurator\?\.eligible/);
  assert.match(app,/HydroSbordoniConfigurator\.open/);
  assert.match(app,/HydroSbordoniConfigurator\?\.catalogImage/);
});


test('Sbordoni basin configurator is limited to the four requested collections',()=>{
  const CATALOG=loadCatalog();
  const context={window:{},CATALOG,console,esc:v=>String(v??''),euro:v=>String(v??0),document:{}};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','public','sbordoni-configurator.js'),'utf8'),context);
  assert.deepEqual(Array.from(context.window.HydroSbordoniConfigurator.supportedCollections),['Romana','Palladio','Neoclassica','Masaccio']);
});

test('Sbordoni WC configurator exposes the catalogue combinations for all four collections',()=>{
  const CATALOG=loadCatalog();
  const context={window:{},CATALOG,console,esc:v=>String(v??''),euro:v=>String(v??0),document:{}};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','public','sbordoni-wc-configurator.js'),'utf8'),context,{filename:'sbordoni-wc-configurator.js'});
  const cfg=context.window.HydroSbordoniWCConfigurator;
  assert.ok(cfg,'WC configurator exported');
  assert.deepEqual(Array.from(cfg.collections()),['Romana','Palladio','Neoclassica','Masaccio']);

  const cases=[
    ['Romana','9020','9028','S920'],
    ['Palladio','7020','7028','S020'],
    ['Neoclassica','5107','5128','S107'],
    ['Masaccio','5520',null,'S520']
  ];
  for(const [collection,ref,tank,seat] of cases){
    const p=CATALOG.find(x=>x.manufacturer==='Sbordoni'&&x.collection===collection&&x.reference===ref);
    assert.ok(p,`missing ${collection} ${ref}`);
    assert.equal(cfg.eligible(p),true,`${collection} ${ref} should open WC configurator`);
    const system=cfg.config[collection].find(s=>s.bowls.some(([r])=>r===ref));
    assert.ok(system,`missing WC system for ${collection} ${ref}`);
    if(tank)assert.ok(system.flush.some(f=>f.tank===tank),`missing tank ${tank}`);
    assert.ok(system.seats.includes(seat),`missing seat family ${seat}`);
  }

  const palladio=cfg.config.Palladio.find(s=>s.id==='floor');
  assert.ok(palladio.flush.some(f=>f.tank==='7029L'&&f.mechanisms.includes('MC06L')));
  const neoclassica=cfg.config.Neoclassica.find(s=>s.id==='wall');
  assert.ok(neoclassica.bowls.some(([r])=>r==='5309'));
  assert.ok(neoclassica.seats.includes('S127'));
});

test('app routes Sbordoni WC products through the WC configurator',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
  assert.match(app,/HydroSbordoniWCConfigurator\?\.eligible/);
  assert.match(app,/HydroSbordoniWCConfigurator\.open/);
});


test('V11.60.1 stores a configured Sbordoni basin as one grouped visible product',()=>{
  const configurator=fs.readFileSync(path.join(__dirname,'..','public','sbordoni-configurator.js'),'utf8');
  const app=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
  assert.match(configurator,/sbordoniGrouped=true/);
  assert.match(configurator,/commitSelectedRecords\(\[groupedRecord\]/);
  assert.doesNotMatch(configurator,/supportRecord=createSelectedProductRecord/);
  assert.match(configurator,/resultImage:resultImg/);
  assert.match(app,/migrateLegacySbordoniGroupedConfigurations/);
  assert.match(app,/sbordoni-edit-config/);
  assert.match(app,/Configurer ce produit/);
  assert.match(app,/p\.sbordoniConfiguration\?"":safeBasinAccessorySuggestions/);
});

test('V11.60.3 repairs the saved Romana 9065 + 9001 image in existing projects',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
  assert.ok(app.includes('SBORDONI_CURATED_RESULT_IMAGES'));
  assert.ok(app.includes('"Romana|9065|9001"'));
  assert.ok(app.includes('if(parent.sbordoniGrouped){'));
  assert.ok(app.includes('parent.sbordoniConfiguration={...parent.sbordoniConfiguration,resultImage:curated};'));
  assert.ok(app.includes('curatedSbordoniResultImage(parent.sbordoniConfiguration,support&&support.reference)'));
});


test('V11.60.4 Palladio compatibility matrix follows the catalogue contact sheet',()=>{
  const CATALOG=loadCatalog();
  const context={window:{},CATALOG,console,esc:v=>String(v??''),euro:v=>String(v??0),document:{}};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','public','sbordoni-configurator.js'),'utf8'),context);
  const cfg=context.window.HydroSbordoniConfigurator;
  const keys=f=>Array.from(cfg.supportGroups('Palladio',f),g=>g.key);
  assert.deepEqual(keys('7200').sort(),['G720','P7200'].sort());
  assert.deepEqual(keys('7100').sort(),['7001','7100M','G720','P7100'].sort());
  assert.deepEqual(keys('7070').sort(),['7001','7070M','P7070'].sort());
  assert.deepEqual(keys('7064').sort(),['7001','P7064'].sort());
  const support7100=cfg.supportGroups('Palladio','7100').flatMap(g=>Array.from(g.items)).find(x=>x.reference==='7100M');
  assert.equal(cfg.resultImage('Palladio','7100',support7100),'https://img.archiexpo.fr/images_ae/photo-mg/52045-15167347.jpg');
  assert.equal(cfg.catalogImage(CATALOG.find(x=>x.manufacturer==='Sbordoni'&&x.collection==='Palladio'&&x.reference==='7100/3')),'https://img.archiexpo.fr/images_ae/photo-m2/52045-15167309.jpg');
});

test('V11.60.4 puts the Sbordoni configurator before product cards',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
  assert.match(app,/sbordoni-catalog-launcher/);
  assert.match(app,/sbordoni-launch-basin/);
  assert.match(app,/HydroSbordoniConfigurator\?\.open\?\.\(null/);
  assert.match(app,/sbordoni-launch-wc/);
});


test("catalog add handlers use the multi-selector",()=>{\n  const app=fs.readFileSync(path.join(__dirname,"..","public","app.js"),"utf8");\n  assert.ok(app.includes('$$(\".add\",results).forEach'));\n  assert.equal(app.includes('$(\".add\",results).forEach'),false);\n});\n