'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/brand-data/hidrobox-config-01.b64'),'utf8').trim();
const groups=JSON.parse(zlib.gunzipSync(Buffer.from(source,'base64')).toString('utf8')).groups;
const defs={Line:'SLIC',Twins:'STWC',Quadro:'SQUC',One:'SONC',Pure:'SPUC',Arq:'SARC',Loovers:'SLOC',Unique:'SUNC',Iconik:'SICC','Neo Plus':'SNEC'};
test('Audit dimensional coverage and sample manufacturer SKU matrix of all shower trays',()=>{
 const out=[];
 for(const [name,prefix] of Object.entries(defs)){
  const g=groups.find(g=>g.collection===name);
  assert(g,'Missing '+name);
  const rows=g.variants.filter(v=>v.reference?.startsWith(prefix));
  const uniq=key=>[...new Set(rows.map(v=>String(v[key]??'')).filter(Boolean))];
  const missing={};for(const k of ['width','length','material','finish','colorGroup'])missing[k]=rows.filter(v=>!String(v[k]??'').trim()).length;
  const samples=['SLIC0533','SLIC0589','SLIC0951','STWC0097','STWC0113','SQUC0001','SONC0439','SPUC0001','SARC0001','SLOC0001','SUNC0001','SICC0001','SNEC0001']
    .filter(k=>k.startsWith(prefix)).map(k=>rows.find(v=>v.reference===k)).filter(Boolean);
  const first=rows.slice(0,2),last=rows.slice(-2);
  const examples=[...first,...samples,...last].map(x=>({reference:x.reference,width:x.width,length:x.length,
   material:x.material,finish:x.finish,colorGroup:x.colorGroup,rawPrice:x.rawPrice,price:x.price,page:x.sourcePage}));
  out.push({name,count:rows.length,missing,widths:uniq('width').slice(0,30),lengths:uniq('length').slice(0,30),
   materials:uniq('material'),finishes:uniq('finish'),colors:uniq('colorGroup'),examples});
 }
 console.log('HIDROBOX_SHOWER_MEASURE_MATRIX '+JSON.stringify(out));
 assert(out.length===10);
});
