/* Radaway verified showroom tariff 02/02/2026.
 * The user can import the exact 2026 JSON extracted from the signed Excel.
 * IndexedDB persists the supplier tariff locally without exposing purchase conditions.
 */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroRadawayTariff=api;})(typeof window==='object'?window:null,function(root){
 'use strict';
 let data=null,byRef=new Map(),readyPromise=null;
 const DB='hydropolis-radaway-tariff-v2026',STORE='files',KEY='radaway-2026';
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 function validate(parsed){
  if(!parsed||parsed.source!=='RADAWAY_SHOWROOMS_TARIF 02022026.xlsx'||!Array.isArray(parsed.prices)||parsed.prices.length<8500)
   throw Error('Fichier tarif Radaway 2026 invalide : importer le fichier JSON extrait du classeur fourni.');
  const seen=new Set();
  for(const p of parsed.prices){
   if(typeof p.r!=='string'||typeof p.d!=='string'||!Number.isFinite(p.p)||p.p<=0||!Number.isFinite(p.a)||p.a<=0)
    throw Error('Ligne tarifaire invalide.');
   const key=p.r+'|'+p.d;
   if(seen.has(key))continue;seen.add(key);
   if(Math.ceil(p.p*.5)!==p.a)throw Error('Prix d’achat incohérent pour '+p.r);
  }
  return parsed;
 }
 function use(parsed){data=validate(parsed);byRef=new Map();for(const x of data.prices){const prev=byRef.get(x.r);if(!prev||x.p>prev.p)byRef.set(x.r,x)}return {rows:data.prices.length,unique:byRef.size,date:data.date}}
 function db(){
  return new Promise((resolve,reject)=>{
   if(typeof indexedDB==='undefined'){reject(Error('Stockage IndexedDB indisponible'));return}
   const req=indexedDB.open(DB,1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
   req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Erreur IndexedDB'));
  });
 }
 async function store(parsed){
  const database=await db();
  return new Promise((resolve,reject)=>{
   const tx=database.transaction(STORE,'readwrite'),request=tx.objectStore(STORE).put(parsed,KEY);
   request.onsuccess=()=>resolve(true);request.onerror=()=>reject(request.error);
   tx.oncomplete=()=>database.close();tx.onerror=()=>database.close();
  });
 }
 async function load(){
  if(data)return data;
  if(!readyPromise)readyPromise=(async()=>{
   let database;
   try{
    database=await db();
    const parsed=await new Promise((resolve,reject)=>{
     const tx=database.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(KEY);
     req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    if(parsed)use(parsed);
   }finally{database?.close()}
   return data;
  })().catch(()=>null);
  return readyPromise;
 }
 async function parseXlsx(file){
  const utf8=new TextDecoder('utf-8');
  // Native modern-browser ZIP reader. No external service receives customer
  // price files; the original Excel stays in browser/IndexedDB.
  const raw=await file.arrayBuffer(),view=new DataView(raw),bytes=new Uint8Array(raw);
  let eocd=-1;
  for(let p=raw.byteLength-22;p>=Math.max(0,raw.byteLength-65557);p--){
   if(view.getUint32(p,true)===0x06054b50){eocd=p;break}
  }
  if(eocd<0)throw Error('Archive Excel non reconnue.');
  const entries=view.getUint16(eocd+10,true),offset=view.getUint32(eocd+16,true);
  const archive=new Map();let pos=offset;
  for(let n=0;n<entries;n++){
   if(view.getUint32(pos,true)!==0x02014b50)throw Error('Structure XLSX invalide.');
   const method=view.getUint16(pos+10,true),compressed=view.getUint32(pos+20,true),
     fnlen=view.getUint16(pos+28,true),extralen=view.getUint16(pos+30,true),
     comlen=view.getUint16(pos+32,true),loc=view.getUint32(pos+42,true);
   const name=utf8.decode(bytes.slice(pos+46,pos+46+fnlen));
   archive.set(name,{method,compressed,loc});
   pos+=46+fnlen+extralen+comlen;
  }
  async function xml(name){
   const file=archive.get(name);
   if(!file)throw Error('Fichier requis absent du classeur : '+name);
   const p=file.loc;
   if(view.getUint32(p,true)!==0x04034b50)throw Error('Fichier ZIP endommagé');
   const start=p+30+view.getUint16(p+26,true)+view.getUint16(p+28,true);
   const compressed=bytes.slice(start,start+file.compressed);
   let data=compressed;
   if(file.method===8){
    if(typeof DecompressionStream==='undefined')throw Error('Navigateur incompatible. Utilisez le fichier JSON préparé.');
    try{
     const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
     data=new Uint8Array(await new Response(stream).arrayBuffer());
    }catch{throw Error('Décompression XLSX indisponible dans ce navigateur ; utilisez le JSON fourni.')}
   }else if(file.method!==0)throw Error('Compression XLSX non prise en charge.');
   const doc=new DOMParser().parseFromString(utf8.decode(data),'application/xml');
   if(doc.querySelector('parsererror'))throw Error('XML Excel invalide');
   return doc;
  }
  const shared=await xml('xl/sharedStrings.xml');
  const strings=Array.from(shared.getElementsByTagName('si'),item=>item.textContent||'');
  const sheet=await xml('xl/worksheets/sheet1.xml');
  const rows=sheet.getElementsByTagName('row'),priced=[];
  for(let n=1;n<rows.length;n++){
   const values={};
   for(const cell of rows[n].getElementsByTagName('c')){
    const col=(cell.getAttribute('r')||'').match(/^[A-Z]+/)?.[0];
    const raw=cell.getElementsByTagName('v')[0]?.textContent||'';
    if(col)values[col]=cell.getAttribute('t')==='s'?strings[Number(raw)]||'':raw;
   }
   const reference=values.C,publicPrice=Number(values.H),purchase=Number(values.I);
   if(!reference||!Number.isFinite(publicPrice)||publicPrice<=0||
      !Number.isFinite(purchase)||purchase<=0)continue;
   priced.push({s:values.A||'',u:values.B||'',r:reference,e:values.D||'',d:values.E||'',
     t:values.F||'',p:publicPrice,a:purchase});
  }
  return {source:'RADAWAY_SHOWROOMS_TARIF 02022026.xlsx',date:'2026-02-02',discount:50,prices:priced};
 }
 async function importFile(file){
  if(!file)throw Error('Choisir le fichier tarif Radaway JSON.');
  const parsed=/\.xlsx$/i.test(file.name)?await parseXlsx(file):JSON.parse(await file.text());
  const info=use(parsed);
  await store(parsed);return info;
 }
 function exact(ref){return byRef.get(String(ref||''))||null}
 function variants(row){
  if(!data||!row)return [];
  const name=norm(row.designation),mapped=data.prices.filter(x=>{
   const text=norm(x.d);
   // Manufacturer descriptions have a dimension suffix. Match longest named
   // product string exactly, never a looser series-only or profile-only match.
   return text===name||text.startsWith(name+' ')||
    text.startsWith('s '+name+' ')||text.startsWith('nt '+name+' ');
  });
  return mapped.sort((a,b)=>a.p-b.p||a.r.localeCompare(b.r));
 }
 function status(){return {ready:!!data,rows:data?.prices?.length||0,date:data?.date||''}}
 return {load,importFile,exact,variants,status,validate,use,parseXlsx};
});