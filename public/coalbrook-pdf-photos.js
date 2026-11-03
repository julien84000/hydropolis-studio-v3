/* Optional, local-only Coalbrook 2026 photograph import from the user's own PDF extract.
   Source images remain on this browser (IndexedDB), never posted to Hydropolis
   or attached to a cloud project. Archive must be STORE-only to avoid CDN dependencies. */
(function(root){
'use strict';
const DB='hydropolis-coalbrook-pdf-photos-v1',STORE='photos';
let pending=null;const urls=new Map();
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
 const db=await openDb(),row=await request(db.transaction(STORE,'readonly').objectStore(STORE).get(ref));
 if(!row?.image)return null;
 const data={src:URL.createObjectURL(row.image),finishMatch:row.finishMatch,
  imageSource:'Photo extraite du tarif Coalbrook août 2026 · local',reference:ref};
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
 return images.map(x=>({...x,finishMatch:uncertain.has(x.reference)?'model-only':'exact'}));
}
async function importZip(file){
 if(!file)throw Error('Aucun fichier sélectionné.');
 const entries=entriesFromStoredZip(await file.arrayBuffer());
 const db=await openDb();
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Enregistrement local impossible'));
  tx.onabort=()=>reject(tx.error||new Error('Import interrompu'));
  entries.forEach(e=>store.put(e));
 });
 urls.forEach(v=>URL.revokeObjectURL(v.src));urls.clear();
 return entries.length;
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
root.HydroCoalbrookPdfPhotos={get,importZip,chooseZip};
})(window);
