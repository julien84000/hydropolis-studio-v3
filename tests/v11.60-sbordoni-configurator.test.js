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
});

test('app routes configurable Sbordoni basins through the configurator',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
  assert.match(app,/HydroSbordoniConfigurator\?\.eligible/);
  assert.match(app,/HydroSbordoniConfigurator\.open/);
  assert.match(app,/HydroSbordoniConfigurator\?\.catalogImage/);
});
