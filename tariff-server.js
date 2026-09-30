'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib');
module.exports=function(app){
  let data=null;
  const load=()=>data||(data=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'tda_tariff_2026.json.gz')))));
  const value=(d,row,col)=>col===2||col===10?row[col]:d.dicts[col][row[col]];
  app.get('/api/tda-tariff', (req,res)=>{
    try{
      const d=load(),fields={gamme:0,model:1,base:3,profile:5,glass:8,reference:2};
      let rows=d.rows;
      for(const [key,col] of Object.entries(fields))if(req.query[key]!==undefined&&req.query[key]!==''){
        const raw=String(req.query[key]),wanted=col===2?raw:d.dicts[col].indexOf(raw);rows=rows.filter(r=>r[col]===wanted);
      }
      const options=(c,label)=>{const seen=new Map();for(const row of rows){const v=value(d,row,c);if(!seen.has(v))seen.set(v,{value:v,label:label?label(row):v});}return [...seen.values()];};
      const matches=rows.length<=200?rows.map(r=>Object.fromEntries(d.columns.map((k,i)=>[k,value(d,r,i)]))):[];
      res.json({source:d.source,year:d.year,total:d.count,count:rows.length,gammes:options(0),models:options(1),bases:options(3,r=>`${value(d,r,4)} · ${value(d,r,11)} · ${value(d,r,3)}`),profiles:options(5,r=>`${value(d,r,6)} (${value(d,r,5)})`),glasses:options(8,r=>`${value(d,r,9)} (${value(d,r,8)})`),matches});
    }catch(e){console.error('[TDA tariff]',e.message);res.status(500).json({error:'Tarif TDA indisponible'});}
  });
};
