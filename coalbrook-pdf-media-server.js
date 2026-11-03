'use strict';
/* Coalbrook August 2026: publish PDF product photographs by exact SKU.
 * The 16 binary slices are a byte-for-byte copy of the archived 785 JPEGs.
 * No external image service, user-upload, or client-side database is required.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=path.join(__dirname,'public','coalbrook-pdf-2026');
const PART_COUNT=16;
const EXPECTED_SHA256='487b5bec0844097a4463f19fd06ad950d413d76f344693a5cbc1a83ad96f1704';
let cached=null;

function loadPhotos(){
 if(cached)return cached;
 const parts=Array.from({length:PART_COUNT},(_,i)=>
  fs.readFileSync(path.join(ROOT,'photo-archive-'+String(i).padStart(2,'0')+'.bin')));
 const binary=Buffer.concat(parts);
 const sum=crypto.createHash('sha256').update(binary).digest('hex');
 if(sum!==EXPECTED_SHA256)throw Error('Coalbrook PDF photo archive SHA256 mismatch');
 const photos=new Map();
 let manifest=null,off=0;
 while(off+30<=binary.length){
  const sig=binary.readUInt32LE(off);
  if(sig===0x02014b50||sig===0x06054b50)break;
  if(sig!==0x04034b50)throw Error('Coalbrook ZIP invalid local header');
  const flags=binary.readUInt16LE(off+6),method=binary.readUInt16LE(off+8),
    len=binary.readUInt32LE(off+18),nameLen=binary.readUInt16LE(off+26),
    extraLen=binary.readUInt16LE(off+28);
  if(flags&8||method!==0)throw Error('Coalbrook ZIP entry cannot be decoded without inflate');
  const start=off+30+nameLen+extraLen,end=start+len;
  if(end>binary.length)throw Error('Coalbrook ZIP truncated');
  const name=binary.subarray(off+30,off+30+nameLen).toString('utf8');
  if(name==='index.json')manifest=JSON.parse(binary.subarray(start,end).toString('utf8'));
  else if(/^photos\/[A-Z0-9]{6,16}\.jpg$/i.test(name)){
   const reference=name.slice(7,-4).toUpperCase();
   if(photos.has(reference))throw Error('Duplicate Coalbrook photo file '+reference);
   photos.set(reference,binary.subarray(start,end));
  }
  off=end;
 }
 if(!manifest||photos.size!==manifest.imageCount||photos.size!==785)
  throw Error('Coalbrook PDF image index incomplete: '+photos.size);
 const ambiguous=new Set((manifest.excludedDuplicates||[]).map(x=>x.ref));
 const entries={};
 for(const [reference,img] of photos){
  if(img.length<100||img[0]!==0xff||img[1]!==0xd8)throw Error('Invalid JPG '+reference);
  const meta=manifest.images?.[reference];
  if(!meta)throw Error('Missing PDF provenance for '+reference);
  entries[reference]={
   page:meta.page,
   finishMatch:meta.finishVerified&&!ambiguous.has(reference)?'exact':'model-only',
   source:'EuroBrochure August 2026 05.10.pdf',
   url:'/api/coalbrook-pdf-photo/'+reference+'.jpg'
  };
 }
 cached={photos,entries,number:photos.size,sha256:sum,maestroCount:Object.values(entries).filter(x=>x.page>=174&&x.page<=186).length};
 return cached;
}
function install(app){
 app.get('/api/coalbrook-pdf-photo-index',(req,res)=>{
  try{
   const data=loadPhotos();
   res.set('Cache-Control','public, max-age=3600');
   res.json({source:'Coalbrook EuroBrochure August 2026',count:data.number,
    maestroCount:data.maestroCount,photos:data.entries});
  }catch(e){
   console.error('[Coalbrook PDF photo index]',e.message);
   res.status(503).json({error:'Photographies Coalbrook indisponibles'});
  }
 });
 app.get('/api/coalbrook-pdf-photo/:reference.jpg',(req,res)=>{
  const ref=String(req.params.reference||'').toUpperCase();
  if(!/^[A-Z0-9]{6,16}$/.test(ref))return res.sendStatus(400);
  try{
   const data=loadPhotos(),picture=data.photos.get(ref);
   if(!picture)return res.sendStatus(404);
   res.set('Cache-Control','public, max-age=3600');
   res.type('image/jpeg').send(picture);
  }catch(e){
   console.error('[Coalbrook PDF photo]',ref,e.message);
   res.sendStatus(503);
  }
 });
}
module.exports=install;
module.exports.loadPhotos=loadPhotos;
