'use strict';
// Input: captured public Area Pro FR menu, never a guessed list of collections.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const input=process.argv[2]||path.join(__dirname,'../tests/fixtures/gessi-areapro/menu-fr.json');
const bytes=fs.readFileSync(input),source=JSON.parse(bytes);
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const allowedImage=s=>{try{const u=new URL(s);return u.protocol==='https:'&&['gwebassets.gessi.com','gessistorage.blob.core.windows.net'].includes(u.hostname)?u.href:''}catch{return ''}};
if(!source.success||!Array.isArray(source.data))throw Error('Invalid official menu');
const areas=source.data.map(a=>({id:slug(a.ambientName),officialId:a.ambientId,name:a.ambientName,collections:a.collections.map(c=>({id:c.collectionId,name:c.collectionNameTranslated||c.collectionName,sourceName:c.collectionName,image:allowedImage(c.collectionMainImage),series:c.series.map(s=>({id:s.serieId,name:s.serieNameTranslated||s.serieName,image:allowedImage(s.serieMainImage)}))}))}));
const data={source:'https://g-ecatalogue-be-prod-we.azurewebsites.net/public/menu/get?country=FR&language=fr',site:'https://areapro.gessi.com/fr',retrievedAt:'2026-10-28',sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),areas};
fs.writeFileSync(path.join(__dirname,'../public/gessi-area-pro-menu.json'),JSON.stringify(data,null,2)+'\n');
console.log(areas.length+' univers, '+areas.reduce((n,a)=>n+a.collections.length,0)+' entrées de collections');
