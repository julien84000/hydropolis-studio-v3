'use strict';
const fs=require('fs'),path=require('path');
const {pipeline}=require('stream/promises');
const {packedStream,collectDocument}=require('./packed-assets');
const assetTypes=require('./assets_metadata.json');
const packageInfo=require('./package.json');
const root=__dirname,indexPath=path.join(root,'assets_index.json'),publicIndexPath=path.join(root,'public','index.html');
const index=fs.existsSync(indexPath)?JSON.parse(fs.readFileSync(indexPath,'utf8')):{};
const APP_VERSION=String(packageInfo.version);
function versionedIndexHtml(){
 return fs.readFileSync(publicIndexPath,'utf8').replaceAll('__APP_VERSION__',APP_VERSION);
}

function runtimeDatabase(){
 return /^postgres(?:ql)?:\/\//i.test(String(process.env.DATABASE_URL||''))?'postgresql':'local-fallback';
}
function getAsset(url){
 const pack=index[url];
 if(pack){
  return {mime:assetTypes[url]||'application/octet-stream',stream:()=>packedStream(path.join(root,pack),[url],'data')};
 }
 if(!/^\/(?:assets|images|resigres)\/[a-zA-Z0-9_./-]+$/.test(url)||url.includes('..'))return null;
 const local=path.join(root,'public',url);if(!fs.existsSync(local))return null;
 return {mime:/\.pdf$/i.test(url)?'application/pdf':/\.webp$/i.test(url)?'image/webp':/\.png$/i.test(url)?'image/png':'image/jpeg',stream:()=>fs.createReadStream(local)};
}
module.exports=function(app){
 app.locals.versionedIndexHtml=versionedIndexHtml;
 require('./memory-safe-server')(app);
 app.locals.packCacheStats=()=>({entries:0,mode:'streamed-values'});
 app.get('/runtime-config.js',(req,res)=>res.type('js').set('Cache-Control','no-cache').send(`globalThis.HYDROPOLIS_VERSION=${JSON.stringify(APP_VERSION)};`));
 app.get('/sw.js',(req,res)=>res.type('js').set('Cache-Control','no-cache').send(fs.readFileSync(path.join(root,'public/sw.js'),'utf8').replaceAll('__APP_VERSION__',APP_VERSION)));
 for(const name of ['catalog_manifest.json','manufacturers_manifest.json'])app.get('/'+name,(req,res)=>{
   const data=JSON.parse(fs.readFileSync(path.join(root,'public',name),'utf8'));
   res.set('Cache-Control','no-cache').json({...data,version:APP_VERSION,...(name==='catalog_manifest.json'?{engineVersion:APP_VERSION}:{})});
 });

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

 app.use(async(req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method)||!index[req.path])return next();
  try{const a=getAsset(req.path);if(!a)return next();res.type(a.mime);res.set('Cache-Control','public,max-age=86400');return await pipeline(a.stream(),res);}catch(e){if(!res.headersSent&&!res.destroyed)res.status(500).send('Ressource indisponible');}
 });
 app.get('/api/catalog-pdf-page',async(req,res)=>{
  const file=String(req.query.file||'');if(!/^\/assets\/vismara\/tech-\d+\.pdf$/.test(file))return res.status(400).send('Document inconnu');let pdf;
  try{
   const asset=getAsset(file);if(!asset)return res.status(404).send('Document introuvable');
   const [{getDocument},{createCanvas}]=await Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'),import('@napi-rs/canvas')]);
   pdf=await getDocument({data:new Uint8Array(await collectDocument(asset.stream())),disableWorker:true,useSystemFonts:true}).promise;
   const page=await pdf.getPage(1),base=page.getViewport({scale:1}),view=page.getViewport({scale:Math.min(1.8,1800/Math.max(base.width,base.height))});
   const canvas=createCanvas(Math.ceil(view.width),Math.ceil(view.height)),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);await page.render({canvasContext:ctx,viewport:view}).promise;
   res.type('image/png');res.set('Cache-Control','public,max-age=86400');res.send(await canvas.encode('png'));
  }catch(e){console.error('[catalog PDF]',e.message);res.status(500).send('Document non lisible');}finally{if(pdf)await pdf.destroy().catch(()=>{});}
 });
};
