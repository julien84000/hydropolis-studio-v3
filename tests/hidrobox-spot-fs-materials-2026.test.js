'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'../public');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const data=JSON.parse(zlib.gunzipSync(Buffer.from(read('brand-data/hidrobox-config-01.b64').trim(),'base64')).toString('utf8'));
const fsRows=data.groups.find(g=>g.id==='fs').variants;
const fs2026=require('../public/hidrobox-fs-2026.js');
const spot=require('../public/hidrobox-spot-2026.js');

test('FS: all 31 manufacturer base variants are mapped one-to-one to imported tariff, never invented',()=>{
 const actual=fs2026.available(fsRows);
 assert.equal(actual.length,31);
 assert.equal(new Set(actual.map(x=>x.reference)).size,31);
 const imported=new Map(fsRows.map(x=>[x.reference,x]));
 for(const item of actual){
   assert(imported.has(item.reference),item.reference);
   assert.equal(item.rawPrice,imported.get(item.reference).rawPrice);
   assert.equal(item.colorGroup,imported.get(item.reference).colorGroup);
   assert(item.width>0&&item.length>0&&item.height>0);
 }
});
test('FS: Scene models and two Kromat choices reproduce supplier group references',()=>{
 const rows=fs2026.available(fsRows);
 const fs19=rows.filter(x=>x.model==='FS 19');
 assert.deepEqual(fs19.map(x=>x.reference),['WFSC0041','WFSC0043','WFSC0044','WFSC0045']);
 const fs23=rows.filter(x=>x.model==='FS 23');
 assert.deepEqual(fs23.map(x=>x.reference),['WFSC0046','WFSC0047','WFSC0048']);
 assert.deepEqual([...new Set(fs23.map(x=>x.material))],['Kromat']);
 assert.deepEqual(rows.filter(x=>x.model==='FS 24 L').map(x=>x.reference),['WFSC0057']);
 assert.deepEqual(rows.filter(x=>x.model==='FS 24 R').map(x=>x.reference),['WFSC0058']);
 const a=fs2026.quote(fsRows,{reference:'WFSC0044',color:'Blush'});
 assert.equal(a.ok,true);
 assert.equal(a.material,'Kromat');
 assert.equal(a.colorGroup,'TRE');
 assert.equal(a.price,Math.round(a.rawPrice*104)/100);
 assert.equal(a.purchasePrice,a.price/2);
 const b=fs2026.quote(fsRows,{reference:'WFSC0041',color:'Blush'});
 assert.equal(b.ok,false,'Scene white cannot silently become Kromat colour');
 const c=fs2026.quote(fsRows,{reference:'WFSC0045',color:'RAL / NCS'});
 assert.equal(c.ok,false,'No priced Special without actual RAL/NCS specification');
 const d=fs2026.quote(fsRows,{reference:'WFSC0045',color:'RAL / NCS',code:'RAL 9010'});
 assert.equal(d.ok,true);
});
test('FS: official render specification is exact on model, dimensions, material and user colour',()=>{
 const rows=fs2026.available(fsRows);
 const fs19=rows.find(x=>x.reference==='WFSC0044');
 assert.deepEqual(fs2026.spec(fs19,'Blush'),{
   model:'fs-19',typology:'floor-standing-basins',material:'Kromat',texture:'Lisse',
   color:'Blush',width:40,length:40,shape:''
 });
 assert.equal(fs2026.spec(rows.find(x=>x.reference==='WFSC0045'),'RAL / NCS'),null);
 const ref=fs2026.spec(rows.find(x=>x.reference==='WFSC0021'),'Blanc');
 assert.equal(ref.width,45.5);assert.equal(ref.length,50.5);
});
test('Spot: selected Kromat supplier groups and colour palette remain billable at the correct price',()=>{
 const rows=spot.rows.filter(r=>r.model==='Spot 62');
 assert.deepEqual(rows.map(r=>r.colorGroup),['BLA','BAS','TRE','SPE']);
 assert.deepEqual(rows.map(r=>r.material),['Scene','Kromat','Kromat','Kromat']);
 const trend=rows.find(r=>r.colorGroup==='TRE');
 const q=spot.quote({reference:trend.reference,color:'Blush'});
 assert.equal(q.ok,true);assert.equal(q.material,'Kromat');
 assert.equal(q.price,Math.round(q.rawPrice*104)/100);
 assert.equal(spot.quote({reference:rows[0].reference,color:'Blush'}).ok,false);
});
test('Spot and FS UIs show material choices, group colours and render exact official model previews',()=>{
 const s=read('hidrobox-panel-spot-ui.js');
 assert.match(s,/data-hb-spot-material/);
 assert.match(s,/data-hb-spot-tier/);
 assert.match(s,/hbSpotSpecialCode/);
 assert.match(s,/specialCodeReady/);
 assert.match(s,/result\.colorGroup==='SPE'\?s\.specialCode:result\.color/);
 const f=read('hidrobox-fs-ui.js'),guided=read('hidrobox-guided.js'),html=read('index.html');
 for(const token of ['data-fs-model','data-fs-material','data-fs-group','data-fs-color','data-hb-config-image','ctx.save(item,config)'])assert(f.includes(token),token);
 assert.match(guided,/familyName==='fs'\)return sourcePanelSpotPage\(g,'fs'\)/);
 assert.match(html,/hidrobox-fs-2026\.js\?v=__APP_VERSION__/);
 assert.match(html,/hidrobox-fs-ui\.js\?v=__APP_VERSION__/);
});
