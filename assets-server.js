'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const packageInfo=require('./package.json');
const root=__dirname,indexPath=path.join(root,'assets_index.json'),publicIndexPath=path.join(root,'public','index.html');
const index=fs.existsSync(indexPath)?JSON.parse(fs.readFileSync(indexPath,'utf8')):{};
const cache=new Map();
const APP_VERSION=String(packageInfo.version||'11.56.0');
const PACK_CACHE_TTL=45*1000;
const PACK_CACHE_MAX_COMPRESSED_BYTES=Math.round(1.5*1024*1024);

function versionedIndexHtml(){
 let html=fs.readFileSync(publicIndexPath,'utf8');
 html=html.replace(/Hydropolis Studio V\d+\.\d+(?:\.\d+)? · Render/g,`Hydropolis Studio V${APP_VERSION} · Render`);
 html=html.replace(/<em>V\d+\.\d+(?:\.\d+)?<\/em>/g,`<em>V${APP_VERSION}</em>`);
 html=html.replace(/styles\.css\?v=[^"']+/g,`styles.css?v=${APP_VERSION}`);
 return html;
}
function runtimeDatabase(){
 return /^postgres(?:ql)?:\/\//i.test(String(process.env.DATABASE_URL||''))?'postgresql':'local-fallback';
}
function readPack(pack){
 const now=Date.now(),hit=cache.get(pack);
 if(hit&&now-hit.at<PACK_CACHE_TTL)return hit.data;
 if(hit)cache.delete(pack);
 const packPath=path.join(root,pack),raw=fs.readFileSync(packPath);
 const data=JSON.parse(zlib.gunzipSync(raw));
 // Les gros packs sont utilisés ponctuellement puis immédiatement libérés : on ne
 // les conserve jamais dans le heap Node. Un seul petit pack peut rester 45 s.
 if(raw.length<=PACK_CACHE_MAX_COMPRESSED_BYTES){
  cache.set(pack,{at:now,data});
  while(cache.size>1)cache.delete(cache.keys().next().value);
 }
 return data;
}
function getAsset(url){
 const pack=index[url];
 if(pack){
  const data=readPack(pack),a=data[url];
  return a?{mime:a.mime,data:Buffer.from(a.data,'base64')}:null;
 }
 if(!/^\/(?:assets|images|resigres)\/[a-zA-Z0-9_./-]+$/.test(url)||url.includes('..'))return null;
 const local=path.join(root,'public',url);if(!fs.existsSync(local))return null;
 return {mime:/\.pdf$/i.test(url)?'application/pdf':/\.webp$/i.test(url)?'image/webp':/\.png$/i.test(url)?'image/png':'image/jpeg',data:fs.readFileSync(local)};
}
module.exports=function(app){
 require('./official-assets-server')(app);
 require('./memory-safe-server')(app);

 // package.json est la source unique de version runtime.
 app.get(['/','/index.html'],(req,res)=>{
  try{
   res.type('html');
   res.set('Cache-Control','no-cache');
   return res.send(versionedIndexHtml());
  }catch(e){
   console.error('[versioned index]',e.message);
   return res.status(500).send('Interface indisponible');
  }
 });
 app.get('/api/version',(req,res)=>res.set('Cache-Control','no-store').json({version:APP_VERSION}));
 app.get('/api/health',(req,res)=>res.set('Cache-Control','no-store').json({
  ok:true,
  service:`Hydropolis Studio V${APP_VERSION}`,
  version:APP_VERSION,
  database:runtimeDatabase(),
  time:new Date().toISOString()
 }));

 app.use((req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method)||!index[req.path])return next();
  try{const a=getAsset(req.path);if(!a)return next();res.type(a.mime);res.set('Cache-Control','public,max-age=86400');return res.send(a.data);}catch(e){console.error('[assets]',e.message);res.status(500).send('Ressource indisponible');}
 });
 app.get('/api/catalog-pdf-page',async(req,res)=>{
  const file=String(req.query.file||'');if(!/^\/assets\/vismara\/tech-\d+\.pdf$/.test(file))return res.status(400).send('Document inconnu');let pdf;
  try{
   const asset=getAsset(file);if(!asset)return res.status(404).send('Document introuvable');
   const [{getDocument},{createCanvas}]=await Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'),import('@napi-rs/canvas')]);
   pdf=await getDocument({data:new Uint8Array(asset.data),disableWorker:true,useSystemFonts:true}).promise;
   const page=await pdf.getPage(1),base=page.getViewport({scale:1}),view=page.getViewport({scale:Math.min(1.8,1800/Math.max(base.width,base.height))});
   const canvas=createCanvas(Math.ceil(view.width),Math.ceil(view.height)),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);await page.render({canvasContext:ctx,viewport:view}).promise;
   res.type('image/png');res.set('Cache-Control','public,max-age=86400');res.send(await canvas.encode('png'));
  }catch(e){console.error('[catalog PDF]',e.message);res.status(500).send('Document non lisible');}finally{if(pdf)await pdf.destroy().catch(()=>{});}
 });
};
