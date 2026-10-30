/* Galassia: authoritative technical PDF resolver.
   SSRF-safe: accepts a listed manufacturer SKU only, never a client-supplied URL. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const axios=require('axios');
const cheerio=require('cheerio');
const official=JSON.parse(fs.readFileSync(path.join(__dirname,'public/galassia/official-index.json'),'utf8'));
const allowed=new Map();
for(const group of official.collections||[]){
 for(const entry of group.items||[]){
  if(/^[0-9A-Z]{4,12}$/.test(entry.base)&&/^https:\/\/www\.ceramicagalassia\.it\/catalogo\//i.test(entry.url||'')){
   allowed.set(entry.base,entry.url);
  }
 }
}
// New Core furniture and Tabulae models are verified against their exact official product pages.
const tree=JSON.parse(fs.readFileSync(path.join(__dirname,'public/galassia/official-tree.json'),'utf8'));
for(const collection of tree.collections||[]){
 for(const family of collection.groups||[])for(const model of family.items||[]){
  if(!/^[0-9A-Z]{4,12}$/.test(model.base||''))continue;
  if(!/^https:\/\/www\.ceramicagalassia\.(?:it\/catalogo|com\/catalogue)\/[^?#]+\.html$/i.test(model.url||''))continue;
  if(!allowed.has(model.base))allowed.set(model.base,model.url);
 }
}
const cache=new Map();
function fromPage(html,pageUrl){
 const $=cheerio.load(html);let href='';
 $('a[href]').each((_,el)=>{
  if(href)return;
  const txt=$(el).text().replace(/\s+/g,' ').trim();
  const candidate=$(el).attr('href')||'';
  if(/scheda\s*tecnica|technical\s*sheet|fiche\s*technique/i.test(txt)&&/\.pdf(?:$|[?#])/i.test(candidate))href=candidate;
 });
 if(!href)return null;
 let uri;try{uri=new URL(href,pageUrl)}catch{return null}
 if(!['www.ceramicagalassia.it','www.ceramicagalassia.com','ceramicagalassia.it','ceramicagalassia.com'].includes(uri.hostname.toLowerCase()))return null;
 if(uri.protocol!=='https:'||!/\.pdf$/i.test(uri.pathname))return null;
 return uri.href;
}
function register(app){
 app.get('/api/galassia-technical',async(req,res)=>{
  const code=String(req.query.reference||'').trim().toUpperCase();
  if(!/^[0-9A-Z]{4,12}$/.test(code))return res.status(400).json({error:'Référence Galassia invalide'});
  const roots=[...allowed.keys()].filter(k=>code.startsWith(k)).sort((a,b)=>b.length-a.length);
  const base=roots.find(k=>k===code||/^(?:MT|NEMT|GM|SB|SA|SV|OC|PE|VI|BM|NE|BI|CR|NS|FA|MK|NM|RO|BIMT)$/.test(code.slice(k.length)));
  if(!base)return res.status(404).json({error:'Aucune fiche fabricant indexée pour cette référence'});
  const previous=cache.get(base);
  if(previous&&Date.now()-previous.at<6*60*60*1000)return previous.url?res.json({url:previous.url,source:'fiche officielle'}):res.status(404).json({error:'Fiche indisponible'});
  try{
   const result=await axios.get(allowed.get(base),{timeout:10000,maxRedirects:0,maxContentLength:2e6,
    headers:{'User-Agent':'HydropolisStudio/1.0 (manufacturer document lookup)','Accept':'text/html'}});
   const url=fromPage(String(result.data||''),allowed.get(base));
   cache.set(base,{url,at:Date.now()});
   if(!url)return res.status(404).json({error:'Lien technique indisponible sur le site officiel'});
   return res.json({url,source:'fiche officielle',base});
  }catch(error){
   return res.status(503).json({error:'Fiche fabricant temporairement indisponible'});
  }
 });
}
module.exports=register;
module.exports.fromPage=fromPage;
module.exports.allowed=allowed;
