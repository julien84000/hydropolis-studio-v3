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
 async function importFile(file){
  if(!file)throw Error('Choisir le fichier tarif Radaway JSON.');
  const parsed=JSON.parse(await file.text());
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
 return {load,importFile,exact,variants,status,validate,use};
});