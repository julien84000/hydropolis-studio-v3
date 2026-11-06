/* Serve individual genuine Naxani tariff drawings (PNG) for the 15 top families.
 * The source is the verified 3×5 cropped WebP sprite in public/naxani-plan-drawings.js.
 * No external image fetches and no user-supplied paths.
 */
'use strict';
const fs=require('fs');
const path=require('path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const NAMES=['Alma','Alpos','Aran','Ares','Borvo','Daro','Forma Large','Forma Small','Inis','Latu','Orbit','Patra','Prenn','Tulpan','2R'];
const index=new Map(NAMES.map((n,i)=>[n,i]));
let spritePromise=null;
const cached=new Map();
async function loadSprite(){
 if(!spritePromise){
  const source=fs.readFileSync(path.join(__dirname,'public/naxani-plan-drawings.js'),'utf8');
  const m=source.match(/const payload="([A-Za-z0-9+/=]+)";/);
  if(!m)throw Error('Missing Naxani manufacturer cropped drawing sprite');
  spritePromise=loadImage(Buffer.from(m[1],'base64')).catch(err=>{spritePromise=null;throw err});
 }
 return spritePromise;
}
async function render(name){
 if(!index.has(name))return null;
 if(cached.has(name))return cached.get(name);
 const im=await loadSprite();
 if(im.width%3||im.height%5)throw Error('Naxani drawing grid dimensions are not divisible 3×5');
 const w=im.width/3,h=im.height/5,i=index.get(name);
 const canvas=createCanvas(w,h),ctx=canvas.getContext('2d');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
 ctx.drawImage(im,(i%3)*w,Math.floor(i/3)*h,w,h,0,0,w,h);
 const png=canvas.toBuffer('image/png');
 cached.set(name,png);
 return png;
}
module.exports=function attach(app){
 app.get('/api/naxani-plan-drawing',async(req,res)=>{
  const name=String(req.query?.model||'');
  if(!index.has(name))return res.status(404).json({error:'Modèle Naxani inconnu'});
  try{
   const body=await render(name);
   res.set('Cache-Control','public, max-age=86400, immutable');
   res.set('X-Content-Type-Options','nosniff');
   res.type('image/png').send(body);
  }catch(err){
   console.error('[naxani-plan-drawing]',name,err?.message||err);
   res.status(500).json({error:'Dessin technique indisponible'});
  }
 });
};
module.exports.render=render;
module.exports.models=NAMES;
