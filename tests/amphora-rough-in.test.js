'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const body=require('../public/amphora-rough-in.js');
const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'../public/amphora_catalog.json'),'utf8'));
const byRef=r=>rows.find(p=>p.reference===r);

test('Amphora all 54 external trims have one priced matching rough-in',()=>{
 const trims=rows.filter(p=>/\.EXT\.(BS|BB|BC)$/.test(p.reference));
 assert.equal(trims.length,54);
 for(const p of trims){
  const result=body.resolve(p,rows);
  assert.equal(result.required,true,p.reference);
  assert.equal(result.priced,true,p.reference+': '+(result.reason||''));
  assert.match(result.reference,/^INT\.\d{2}$/);
  assert.ok(result.price>0,p.reference);
  const linked=body.bodyRecord(p,result);
  assert.equal(linked.reference,result.reference);
  assert.equal(linked.totalPrice,result.price);
  assert.equal(linked.purchaseDiscount,50);
  assert.equal(linked.requiredRoughIn,true);
  assert.equal(Number(p.price)+Number(linked.price),Number(p.price)+Number(result.price));
 }
});
test('RE018 and RE019 official concealed references backed by internal tariff prices',()=>{
 assert.deepEqual([body.resolve(byRef('RE018.EXT.BS'),rows).reference,body.resolve(byRef('RE018.EXT.BS'),rows).price],['INT.05',175]);
 assert.deepEqual([body.resolve(byRef('RE019.EXT.BS'),rows).reference,body.resolve(byRef('RE019.EXT.BS'),rows).price],['INT.01',125]);
});
test('Standalone REEL articles do not receive an invented body',()=>{
 assert.deepEqual(body.resolve(byRef('RE001.BB'),rows),{required:false});
 assert.deepEqual(body.resolve(byRef('RE049.BS'),rows),{required:false});
});
test('Missing or conflicting body price is blocked, never priced at zero',()=>{
 const p=byRef('RE003.EXT.BB');
 const r=body.resolve({...p,internalPrice:0},[]);
 assert.equal(r.priced,false);
 const conflict=body.resolve({...p,internalPrice:125},[
  {...p,internalPrice:125},{...p,internalPrice:150}
 ]);
 assert.equal(conflict.priced,false);
});
test('Amphora configurator inserts two separate records without double counting the 2024 combined total',()=>{
 const js=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
 const conf=fs.readFileSync(path.join(__dirname,'../public/amphora-configurator.js'),'utf8');
 const server=fs.readFileSync(path.join(__dirname,'../amphora-media-server.js'),'utf8');
 const section=js.slice(js.indexOf('function launchAmphoraConfigurator('),js.indexOf('function launchDornbrachtConfigurator('));
 assert.match(section,/totalPrice:Number\(source\.price\)/);
 assert.match(section,/accessoryFor=main.id/);
 assert.match(section,/commitSelectedRecords\(records/);
 assert.match(conf,/Corps d.encastrement nécessaire/);
 assert.match(conf,/bodyRecord\(p,roughIn\)/);
 assert.match(server,/\.EXT/);
});
