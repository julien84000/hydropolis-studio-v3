'use strict';
/**
 * Source-based audit of the already-imported supplier files.
 * Never fabricates absent variants or substitutes a neighbouring price.
 * Run: node scripts/audit-brand-pricing.js
 */
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const root=path.join(__dirname,'..','public','brand-data');
const INPUTS={
  Bette:['bette-config-01.b64','bette-config-02.b64','bette-config-03.b64'],
  Carrodrain:['carrodrain-config-01.b64'],
  Hidrobox:['hidrobox-config-01.b64']
};
function load(brand){
  const parts=INPUTS[brand];
  if(!parts)throw new Error('Unknown supplier '+brand);
  const b64=parts.map(file=>fs.readFileSync(path.join(root,file),'utf8').trim()).join('');
  return JSON.parse(zlib.gunzipSync(Buffer.from(b64,'base64')).toString('utf8'));
}
function money(value){return typeof value==='number'&&Number.isFinite(value)&&value>0;}
function inspect(brand,data){
 const groups=data.groups||[];
 const refs=new Map(),issues=[],examples=[],categorised={};
 let variants=0,priced=0,noPrice=0,rawCount=0,incorrectUplift=0,duplicateExact=0;
 const fail=(kind,group,row,extra={})=>{
   categorised[kind]=(categorised[kind]||0)+1;
   if(examples.length<50)examples.push({kind,group,reference:row?.reference,...extra});
 };
 for(const g of groups){
   if(!g.id||!Array.isArray(g.variants)||!g.variants.length)fail('empty-group',g.id,g);
   const groupKeys=new Set();
   for(const row of g.variants||[]){
     variants++;
     const ref=String(row.reference||'').trim();
     if(!ref)fail('blank-reference',g.id,row);
     if(!money(row.price)){noPrice++;fail('invalid-price',g.id,row,{price:row.price})}else priced++;
     const dedupe=JSON.stringify([g.id,ref,row.model,row.version,row.length,row.width,row.finish,row.color,row.option,row.material,row.colorGroup]);
     if(groupKeys.has(dedupe)){duplicateExact++;fail('duplicate-exact-row',g.id,row)}
     groupKeys.add(dedupe);
     if(ref){const k=ref.toUpperCase();refs.set(k,(refs.get(k)||0)+1)}
     if(brand==='Hidrobox'){
       const raw=Number(row.rawPrice);
       if(!money(raw)){fail('missing-raw-price',g.id,row,{rawPrice:row.rawPrice});continue}
       rawCount++;
       const expected=Math.round(raw*104)/100;
       if(row.price!==expected){
         incorrectUplift++;
         fail('uplift-not-exactly-4pct',g.id,row,{rawPrice:raw,price:row.price,expected});
       }
     }
   }
 }
 const repeatedReferences=[...refs].filter(([,count])=>count>1);
 return {
   brand,sourcePriceRule:brand==='Hidrobox'?data.priceRule||null:null,
   groups:groups.length,variants,priced,noPrice,rawCount,incorrectUplift,duplicateExact,
   repeatedReferenceCount:repeatedReferences.length,repeatedReferenceExamples:repeatedReferences.slice(0,12),
   issues:categorised,issueExamples:examples,
   _data:data
 };
}
function auditAll(){
 const list=Object.keys(INPUTS).map(b=>inspect(b,load(b)));
 return list;
}
if(require.main===module){
 const result=auditAll().map(({_data,...publicFields})=>publicFields);
 console.log(JSON.stringify({source:'public/brand-data/*-config-*.b64',date:'2026-10-28',reports:result},null,2));
 // Fail only if a supposedly priced selection is wrong; repeated supplier refs
 // require separate semantic review and are intentionally NOT rejected blindly.
 if(result.some(x=>x.duplicateExact||x.incorrectUplift||x.issues['blank-reference']||x.issues['invalid-price']))process.exitCode=1;
}
module.exports={INPUTS,load,inspect,auditAll};
