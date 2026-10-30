'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const server=require('../hidrobox-configurator-server.js');
const family=[
 ['line-x','shower-tray','1057'],
 ['spot-62','vessel-washbasin','1180'],
 ['wall-panels','wall-panels','1059'],
 ['civit','wall-hung-washbasins','1069'],
 ['fs-1','floor-standing-basins','1172'],
 ['space','freestanding-bathtub','1061'],
 ['beta-fusion','recessed-bathtub','1063'],
 ['shelves','accessories','1080']
];
test('Official photos use the right manufacturer's typology for eight sanitary families',()=>{
 for(const [model,typology,id] of family){
  const s=server.canonical({model,typology,material:'Scene',texture:'Lisse',color:'Blanc',width:100,length:120});
  assert(!s.unsupported,model+' should be supported');
  assert.equal(new URL(server.urlFor(s)).searchParams.get('fltr-typology'),id,model);
  assert.equal(s.typology,typology);
 }
});
test('Wrong typology is rejected rather than returning a different product image',()=>{
 assert.throws(()=>server.canonical({model:'wall-panels',typology:'shower-tray',material:'Scene',texture:'Lisse',color:'Blanc',width:100,length:120}),/incohérente/);
 assert.throws(()=>server.canonical({model:'spot-62',typology:'shower-tray',material:'Scene',texture:'Lisse',color:'Blanc',width:32,length:52}),/incohérente/);
});
test('Manufacturer model ID registry includes current official collections, never guesses Program/Artop ids',()=>{
 assert.equal(server.MODEL_IDS['spot-62'],929);
 assert.equal(server.MODEL_IDS['wall-panels'],1022);
 assert.equal(server.MODEL_IDS['civit'],535);
 assert.equal(server.MODEL_IDS['space'],656);
 assert.equal(server.MODEL_IDS['beta-fusion'],634);
 assert.equal(server.MODEL_IDS['program-colour'],undefined);
 assert.equal(server.MODEL_IDS.artop,undefined);
 assert(Object.keys(server.MODEL_IDS).length>=73);
});
test('A model-specific manufacturer URL is accepted only with the model and colour embedded',()=>{
 const base='https://hidrobox.com/configurator/wp-content/uploads/cfg-recursos/images/';
 const s=server.canonical({model:'wall-panels',typology:'wall-panels',material:'Scene',texture:'Lisse',color:'Blanc',width:100,length:120});
 assert(server.exactFilename(base+'Hidrobox_WallPanel_Wall-panels_Blanc.png',s));
 assert.equal(server.exactFilename(base+'Hidrobox_WallPanel_Wall-panels_Blush.png',s),null);
 assert.equal(server.exactFilename(base+'Hidrobox_WallPanel_Amb_1.jpg',s),null);
});
test('Fractional sizes in supplier collections are kept without rounding to adjacent SKU',()=>{
 const s=server.canonical({model:'spot-62',material:'Scene',texture:'Lisse',color:'Blanc',width:32,length:52.5});
 assert.equal(s.length,52.5);
 assert.throws(()=>server.canonical({model:'spot-62',material:'Scene',texture:'Lisse',color:'Blanc',width:32,length:52.2}),/Dimensions/);
});
