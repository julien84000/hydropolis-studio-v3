'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const media=require('../public/hotbath-finish-media.js');
const renderer=require('../hotbath-finish-render.js');
const rows=require('../public/catalog_hotbath.json');
const ray=require('../public/hotbath-ray-2026.js');
const base='https://hotbath.com/images/compano/CB003C/';
const cbImage=base+'CB003CBCP_02.png?resolution=600x600&quality=85&isLogo=true';
const other='https://hotbath.com/images/compano/CB003HC/CB003HCBCP_02.png';

test('Only exact Hotbath model SKU images are eligible for generic fallback',()=>{
 assert(media.sameModel(cbImage,'CB003C'));
 assert(!media.sameModel(other,'CB003C'),'Different HC type must be rejected');
 assert(!media.sameModel('https://hotbath.com/images/compano/CB003/CB003CBCP_02.png','CB003C'));
 assert(!media.sameModel('https://hotbath.com/collection-cover.jpg','CB003C'));
 assert(!media.sameModel('https://bad.example.net/CB003C.png','CB003C'));
 assert(!media.sameModel('http://hotbath.com/images/compano/CB003C/CB003CBCP.png','CB003C'));
 assert(!media.sameModel('https://hotbath.it/documents/ProdCateg/100/OTHER_01.jpg','CB003C'));
 assert(media.sameModel('https://hotbath.it/documents/ProdCateg/123/CB003C_1.jpg','CB003C'));
 assert.equal(media.originalRemote('/api/image-proxy?url='+encodeURIComponent(cbImage)),cbImage);
});

test('Exact finish is preserved; otherwise a model-accurate generic photo is selected',()=>{
 media.registerMedia({byCollection:{Cobber:{CB003C:cbImage},Ray:{}}});
 const exact={manufacturer:'Hotbath',base:'CB003C',reference:'CB003C.BCP',finishCode:'BCP',
   image:cbImage,imageFinishMatch:'exact',hotbathPhotoOriginal:cbImage};
 assert.equal(media.view(exact).scope,'exact');
 assert.match(media.view(exact).caption,/finition exacte/);
 const generic={manufacturer:'Hotbath',base:'CB003C',reference:'CB003C.GN',finishCode:'GN',
   image:other,imageFinishMatch:'exact',collection:'Cobber'};
 const view=media.view(generic);
 assert.equal(view.src,cbImage,'Reject cached image of another model');
 assert.equal(view.scope,'model');
 assert.match(view.caption,/finition illustrative/);
 const noPhoto={manufacturer:'Hotbath',base:'NOT-REAL',reference:'NOT-REAL.GN',finishCode:'GN',image:other};
 assert.equal(media.view(noPhoto).scope,'none');
 const custom={...generic,customImage:true,image:'data:image/png;base64,aGVsbG8='};
 assert.equal(media.view(custom).scope,'custom');
 assert.equal(media.supports(custom),false);
});

test('Simulation is a reversible, project-serialized view choice; original price and image are never altered',()=>{
 media.registerMedia({byCollection:{Cobber:{CB003C:cbImage}}});
 const row=rows.find(x=>x.reference==='CB003C.GN');
 assert(row,'Hotbath Cobber model must exist in 2026 catalogue');
 const product={...row,id:'p1',base:'CB003C',image:cbImage,
   imageFinishMatch:'model-only',remoteImageUrl:cbImage,
   internalReference:'HB-BODY-CHECK',internalPrice:900,price:1500,totalPrice:2400};
 const before=JSON.stringify([product.image,product.reference,product.price,product.totalPrice,product.internalReference,product.internalPrice]);
 assert(media.supports(product));
 assert.equal(media.setMode(product,'simulation'),true);
 assert.match(media.view(product).src,/^\/api\/finish-simulation\?/);
 assert(media.isSimulation(product));
 assert.match(media.view(product).caption,/non contractuel/);
 const saved=JSON.parse(JSON.stringify(product));
 assert.equal(media.view(saved).scope,'simulation','Simulation must survive save/reopen');
 assert.equal(media.setMode(saved,'photo'),true);
 assert.equal(media.view(saved).src,cbImage);
 assert.equal(media.isSimulation(saved),false);
 assert.equal(JSON.stringify([saved.image,saved.reference,saved.price,saved.totalPrice,saved.internalReference,saved.internalPrice]),before);
 assert.equal(media.setMode(saved,'other'),false);
});

test('All nine RAY finishes including IX TB BGP map to the simulation endpoint',()=>{
 const p={manufacturer:'Hotbath',base:'RARH50-1',reference:'RARH50-1EXT.IX',finishCode:'IX'};
 media.registerMedia({byCollection:{Ray:{'RARH50-1':ray.models['RARH50-1'].photo}}});
 for(const f of ['IX','CR','GN','WH','TB','BBP','BCP','MBP','BGP']){
  p.reference='RARH50-1EXT.'+f;p.finishCode=f;
  assert.equal(media.supports(p),true,f);
  assert.match(media.urlFor(p),new RegExp('finish='+f+'$'));
 }
 const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
 for(const f of ['IX','TB','BGP'])assert.match(server,new RegExp(f+':\\{rgb:'));
});

function frame(w,h,background,foreground,x0=8,y0=8,x1=12,y1=12,alpha=false){
 const a=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,part=x>=x0&&x<x1&&y>=y0&&y<y1;
  const c=part?foreground:background;
  a.set([c[0],c[1],c[2],part?255:(alpha?0:255)],i);
 }
 return a;
}
test('Finish segmentation recolours the isolated product but not the white studio background',()=>{
 const w=20,h=20,data=frame(w,h,[255,255,255],[130,135,140]);
 const prepared=renderer.prepareMask(data,w,h);
 assert.equal(prepared.mode,'studio');
 assert(prepared.mask);
 const corner=Array.from(data.slice(0,4)),centerBefore=Array.from(data.slice((9*w+9)*4,(9*w+9)*4+4));
 const changed=renderer.recolor(data,prepared.mask,{rgb:[70,40,20],strength:.85});
 assert(changed>0);
 assert.deepEqual(Array.from(data.slice(0,4)),corner,'White background must remain identical');
 assert.notDeepEqual(Array.from(data.slice((9*w+9)*4,(9*w+9)*4+4)),centerBefore);
});
test('Finish simulator refuses lifestyle photos and supports transparent cutout assets safely',()=>{
 const w=20,h=20;
 const lifestyle=frame(w,h,[90,24,40],[130,135,140]);
 assert.equal(renderer.prepareMask(lifestyle,w,h).mask,null);
 const alpha=frame(w,h,[255,255,255],[125,133,145],8,8,12,12,true);
 const parsed=renderer.prepareMask(alpha,w,h);
 assert.equal(parsed.mode,'alpha');
 assert(parsed.mask);
 assert.equal(parsed.mask[0],0);
 assert.equal(parsed.mask[9*w+9],1);
 assert.equal(renderer.prepareMask(frame(w,h,[25,31,43],[250,249,240]),w,h).mask,null);
});
test('Client tabs, dossier disclaimer and original project fields are wired into main app',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
 const index=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 assert(index.includes('hotbath-finish-media.js'));
 assert(index.includes('hotbath-project-visual.js'));
 assert(index.includes('hotbath-finish-media.css'));
 assert(app.includes('HydroHotbathProjectVisual?.mount'));
 assert(app.includes('hotbathResolver.view(p)')&&app.includes('HydroHotbathFinishMedia'));
 assert(app.includes('hotbathDossierPhotoDisclaimer'));
 assert(app.includes('Simulation de finition — rendu indicatif non contractuel'));
 assert(app.includes('Photo générique du modèle — finition illustrative'));
});
