'use strict';
const {test}=require('node:test'),fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
const groups=JSON.parse(zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(__dirname,'../public/brand-data/hidrobox-config-01.b64'),'utf8').trim(),'base64')).toString('utf8')).groups;
test('Hidrobox 2026 wall panels exact source data audit',()=>{
 const panels=groups.filter(g=>/panel|panneau/i.test(String(g.collection||'')+' '+String(g.category||'')));
 for(const g of panels){
  console.log('HIDROBOX_PANEL_ROWS '+JSON.stringify({id:g.id,collection:g.collection,category:g.category,
   variants:(g.variants||[]).map(v=>({reference:v.reference,rawPrice:v.rawPrice,price:v.price,
    model:v.model,type:v.type,material:v.material,finish:v.finish,colorGroup:v.colorGroup,
    width:v.width,length:v.length,height:v.height,thickness:v.thickness,
    designation:v.designation,option:v.option,sourcePage:v.sourcePage}))}));
 }
 if(!panels.length)throw Error('No manufacturer panel source rows');
});