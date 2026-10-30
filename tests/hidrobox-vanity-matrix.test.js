'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const catalog=JSON.parse(zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(__dirname,'../public/brand-data/hidrobox-config-01.b64'),'utf8').trim(),'base64')).toString('utf8'));
const names=['Program Colour','Artop','Lom','Guest','Swap','Titan','Soul','Civit','Intim','Program'];
test('Hidrobox imported vanity lines remain accessible and inspectable against supplier pages',()=>{
 const matrix=[];
 for(const name of names){
  const g=catalog.groups.find(x=>x.collection===name);
  if(!g)continue;
  const rows=g.variants||[];
  const products=rows.filter(x=>/^[A-Z]{3,5}\d{4}$/.test(x.reference)&&!/^OP/.test(x.reference));
  const histogram={};for(const v of products){const prefix=v.reference.replace(/\d+$/,'');histogram[prefix]=(histogram[prefix]||0)+1;}
  const distinct=key=>[...new Set(products.map(x=>x[key]).filter(x=>x!==null&&x!==undefined&&String(x)!=='').map(String))].slice(0,35);
  matrix.push({name,count:rows.length,primary:products.length,prefixes:histogram,materials:distinct('material'),textures:distinct('finish'),
    colorGroups:distinct('colorGroup'),widths:distinct('width'),lengths:distinct('length'),models:distinct('model'),types:distinct('type'),
    samples:products.slice(0,7).map(x=>({ref:x.reference,price:x.rawPrice,material:x.material,finish:x.finish,
      width:x.width,length:x.length,colorGroup:x.colorGroup,sourcePage:x.sourcePage}))});
 }
 console.log('HIDROBOX_VANITY_MATRIX '+JSON.stringify(matrix));
 assert(matrix.find(x=>x.name==='Program Colour')?.primary>0);
 assert(matrix.find(x=>x.name==='Artop')?.primary>0);
});
