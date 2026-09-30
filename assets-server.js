'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const root=__dirname,indexPath=path.join(root,'assets_index.json');
const index=fs.existsSync(indexPath)?JSON.parse(fs.readFileSync(indexPath,'utf8')):{};
const cache=new Map();
function getAsset(url){
 const pack=index[url];
 if(pack){
  if(!cache.has(pack)){cache.set(pack,JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,pack)))));while(cache.size>2)cache.delete(cache.keys().next().value);}
  const a=cache.get(pack)[url];return a?{mime:a.mime,data:Buffer.from(a.data,'base64')}:null;
 }
 if(!/^\/(?:assets|images|resigres)\/[a-zA-Z0-9_./-]+$/.test(url)||url.includes('..'))return null;
 const local=path.join(root,'public',url);if(!fs.existsSync(local))return null;
 return {mime:/\.pdf$/i.test(url)?'application/pdf':/\.webp$/i.test(url)?'image/webp':/\.png$/i.test(url)?'image/png':'image/jpeg',data:fs.readFileSync(local)};
}
module.exports=function(app){
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
