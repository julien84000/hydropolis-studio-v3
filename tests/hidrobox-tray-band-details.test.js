'use strict';
const {test}=require('node:test'),fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
const groups=JSON.parse(zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(__dirname,'../public/brand-data/hidrobox-config-01.b64'),'utf8').trim(),'base64')).toString('utf8')).groups;
test('Print tariff row order for measured shower-tray size-band validation',()=>{
 for(const name of ['Twins','Quadro','One','Pure','Arq','Loovers','Unique','Iconik']){
  const g=groups.find(x=>x.collection===name),rows=g?.variants?.filter(v=>!/^OPS/.test(v.reference))||[];
  console.log('MEASURE_DETAIL '+JSON.stringify({name,rows:rows.map(x=>[x.reference,x.width,x.length,x.material,x.finish,x.colorGroup,x.rawPrice])}));
 }
});
