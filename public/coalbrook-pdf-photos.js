/* Coalbrook August 2026 official brochure photo bundle.
   Shipped with Hydropolis as eight static binary pieces; automatically indexed in
   this browser. Photos are keyed to an exact source SKU, never guessed from a
   neighbouring collection. No login or manual ZIP upload is required. */
(function(root){
'use strict';
const DB='hydropolis-coalbrook-pdf-photos-v1',STORE='photos';
let pending=null;const urls=new Map();let bundledPromise=null;
const BUNDLE_KEY='__coalbrook_2026_bundle_v1__',BUNDLE_PARTS=8,BUNDLE_BYTES=5084838;
function bundlePath(i){return '/coalbrook-2026-photo-data/part-'+String(i).padStart(2,'0')+'.bin'}
async function ensureBundled(){
 if(bundledPromise)return bundledPromise;
 bundledPromise=(async()=>{
  const db=await openDb();
  const present=await request(db.transaction(STORE,'readonly').objectStore(STORE).get(BUNDLE_KEY));
  if(present?.complete&&present?.count===785)return present.count;
  const parts=await Promise.all(Array.from({length:BUNDLE_PARTS},async(_,i)=>{
   const res=await fetch(bundlePath(i),{cache:'force-cache'});
   if(!res.ok)throw Error('Photo bundle part '+i+' HTTP '+res.status);
   return new Uint8Array(await res.arrayBuffer());
  }));
  const size=parts.reduce((sum,part)=>sum+part.byteLength,0);
  if(size!==BUNDLE_BYTES)throw Error('Coalbrook 2026 image bundle corrupted ('+size+')');
  const merged=new Uint8Array(size);let offset=0;
  for(const part of parts){merged.set(part,offset);offset+=part.byteLength}
  const entries=entriesFromStoredZip(merged.buffer);
  if(entries.length!==785)throw Error('Coalbrook 2026 image list incomplete ('+entries.length+')');
  await writePhotos(entries);
  return entries.length;
 })().catch(e=>{bundledPromise=null;console.warn('[Coalbrook 2026 PDF images]',e);return 0});
 return bundledPromise;
}

function openDb(){
 if(pending)return pending;
 pending=new Promise((resolve,reject)=>{
  const q=indexedDB.open(DB,1);
  q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE,{keyPath:'reference'});};
  q.onerror=()=>reject(q.error||new Error('IndexedDB indisponible'));
  q.onsuccess=()=>resolve(q.result);
 });
 return pending;
}
function request(q){
 return new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error||new Error('Lecture impossible'))});
}
async function get(reference){
 const ref=String(reference||'').toUpperCase();
 if(urls.has(ref))return urls.get(ref);
 const db=await openDb();
 let row=await request(db.transaction(STORE,'readonly').objectStore(STORE).get(ref));
 if(!row?.image){
  await ensureBundled();
  row=await request(db.transaction(STORE,'readonly').objectStore(STORE).get(ref));
 }
 if(!row?.image)return null;
 const data={src:URL.createObjectURL(row.image),finishMatch:row.finishMatch,
  imageSource:'Photographie du tarif Coalbrook août 2026 · intégrée',reference:ref};
 urls.set(ref,data);return data;
}
function entriesFromStoredZip(buffer){
 if(buffer.byteLength>35*1024*1024)throw Error('Archive trop volumineuse (maximum 35 Mo).');
 const view=new DataView(buffer),bytes=new Uint8Array(buffer),decoder=new TextDecoder();
 let offset=0;const images=[],other=[];
 while(offset+30<=view.byteLength){
  const signature=view.getUint32(offset,true);
  if(signature===0x02014b50||signature===0x06054b50)break;
  if(signature!==0x04034b50)throw Error('Archive ZIP invalide.');
  const flags=view.getUint16(offset+6,true),method=view.getUint16(offset+8,true);
  const size=view.getUint32(offset+18,true);
  const nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true);
  if(flags&8)throw Error('ZIP avec descripteur de données non pris en charge.');
  if(method!==0)throw Error('Archive compressée non compatible. Utiliser le ZIP Hydropolis fourni.');
  const nameOffset=offset+30,dataOffset=nameOffset+nameLength+extraLength,end=dataOffset+size;
  if(end>buffer.byteLength)throw Error('Archive ZIP tronquée.');
  const name=decoder.decode(bytes.subarray(nameOffset,nameOffset+nameLength));
  if(/^photos\/[A-Z0-9]{6,16}\.jpg$/i.test(name)){
   const ref=name.split('/')[1].replace(/\.jpg$/i,'').toUpperCase();
   images.push({reference:ref,image:new Blob([buffer.slice(dataOffset,end)],{type:'image/jpeg'})});
  }else if(name==='index.json')other.push(decoder.decode(bytes.subarray(dataOffset,end)));
  offset=end;
 }
 if(!images.length||images.length>2000)throw Error('Aucune photo Coalbrook reconnue dans le ZIP.');
 const manifest=other[0]?JSON.parse(other[0]):{};
 const uncertain=new Set((manifest.excludedDuplicates||[]).map(x=>x.ref));
 return images.map(x=>({...x,finishMatch:uncertain.has(x.reference)||manifest.images?.[x.reference]?.finishVerified!==true?'model-only':'exact'}));
}
async function writePhotos(entries){
 const db=await openDb();
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Enregistrement local impossible'));
  tx.onabort=()=>reject(tx.error||new Error('Import interrompu'));
  entries.forEach(e=>store.put(e));
  store.put({reference:BUNDLE_KEY,complete:true,count:entries.length});
 });
 urls.forEach(v=>URL.revokeObjectURL(v.src));urls.clear();
 return entries.length;
}
async function importZip(file){
 if(!file)throw Error('Aucun fichier sélectionné.');
 return writePhotos(entriesFromStoredZip(await file.arrayBuffer()));
}
function chooseZip(){
 return new Promise((resolve,reject)=>{
  const input=document.createElement('input');input.type='file';input.accept='.zip,application/zip';
  input.style.display='none';document.body.append(input);
  input.onchange=async()=>{
   try{if(!input.files?.length){resolve(0);return}resolve(await importZip(input.files[0]))}
   catch(e){reject(e)}finally{input.remove()}
  };
  input.click();
 });
}
root.HydroCoalbrookPdfPhotos={get,importZip,chooseZip,ensureBundled,bundlePath};
})(window);
