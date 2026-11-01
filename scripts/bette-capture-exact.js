'use strict';
/* Controlled 3D product capture. Run on CI with Chromium, never on the Render
 * request path. Reject mismatched SKU, size, colour, or blank WebGL canvas.
 * Original manufacturer rendering only, no synthetic recolouring. */
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),out=path.join(root,'public/bette-renders');
const reqFile=path.join(root,'bette-render-requests.json');
const source=JSON.parse(fs.readFileSync(reqFile,'utf8'));
const tariff=JSON.parse(zlib.gunzipSync(Buffer.from(['01','02','03'].map(n=>
 fs.readFileSync(path.join(root,'public/brand-data/bette-config-'+n+'.b64'),'utf8').trim()
).join(''),'base64')).toString('utf8'));
const same=(a,b)=>String(a||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function verifiedRequest(request){
 assert(/^\d{3,8}-[\dA-Z]{3,10}$/.test(request.reference),'Exact supplier article code required');
 assert(/^\d+$/.test(request.productId)&&/^\d+$/.test(request.variantId));
 assert(/^https:\/\/www\.my-bette\.com\/fr\/configurator\?/.test(request.sourceUrl));
 const url=new URL(request.sourceUrl);
 assert.equal(url.searchParams.get('product'),request.productId);
 assert.equal(url.searchParams.get('variant'),request.variantId);
 assert.equal(url.searchParams.size,2);
 const found=tariff.groups.flatMap(group=>group.variants.filter(v=>v.reference===request.reference).map(variant=>({group,variant})));
 assert.equal(found.length,1,'SKU absent or ambiguous in imported Bette tariff: '+request.reference);
 const {group,variant}=found[0];
 assert.equal(Number(variant.lengthMm),request.lengthMm,'Supplier length does not match');
 assert.equal(Number(variant.widthMm),request.widthMm,'Supplier width does not match');
 assert(same(group.family).includes(same(request.model)),'Product label mismatch with tariff');
 assert(Number(variant.price)>0,'Supplier price absent');
 return {group,variant};
}
async function imageHasDetail(bytes){
 const image=await loadImage(bytes);
 assert(image.width>=350&&image.height>=220,'Canvas too small');
 const board=createCanvas(image.width,image.height),ctx=board.getContext('2d');
 ctx.drawImage(image,0,0);
 const {data}=ctx.getImageData(0,0,image.width,image.height);
 let inspected=0,changed=0,sum=0,sum2=0;
 for(let y=10;y<image.height-10;y+=13)for(let x=10;x<image.width-10;x+=13){
  const i=(y*image.width+x)*4,r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
  if(a===0)continue;
  const brightness=(r+g+b)/3;sum+=brightness;sum2+=brightness*brightness;
  if(brightness<235||Math.max(r,g,b)-Math.min(r,g,b)>15)changed++;
  inspected++;
 }
 const sigma=Math.sqrt(Math.max(0,sum2/inspected-Math.pow(sum/inspected,2)));
 assert(inspected>500&&changed/inspected>.025&&sigma>6,'WebGL image blank/unchanged: not approved for supplier SKU');
 return {imageWidth:image.width,imageHeight:image.height,detailRatio:+(changed/inspected).toFixed(3),contrast:+sigma.toFixed(2)};
}
async function run(){
 assert.equal(tariff.manufacturer,'Bette');
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const manifest={},results=[];
 try{
  for(const request of source.requests){
   verifiedRequest(request);
   const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,locale:'fr-FR'});
   try{
    await page.goto(request.sourceUrl,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.body&&document.body.innerText.length>250,{timeout:45000});
    await page.waitForFunction(({reference,model,colour,size})=>{
      const t=document.body.innerText.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      return t.includes(reference.toLowerCase())&&t.includes(model.toLowerCase())&&t.includes(colour.toLowerCase())&&t.includes(size);
    },{reference:request.reference,model:request.model,colour:request.color,size:String(request.lengthMm)}, {timeout:65000});
    // WebGL viewer stage: pick the largest visible canvas, never an icon or chart.
    const canvas=page.locator('canvas').filter({visible:true});
    await page.waitForFunction(()=>{
      return [...document.querySelectorAll('canvas')].some(c=>{
       const b=c.getBoundingClientRect();return b.width>=400&&b.height>=260&&getComputedStyle(c).display!=='none';
      });
    },{timeout:30000});
    await page.waitForTimeout(2200);
    const selected=canvas.first();
    const boxes=await canvas.evaluateAll(elements=>elements.map((el,index)=>{
      const r=el.getBoundingClientRect();return {index,area:r.width*r.height,width:r.width,height:r.height};
    }));
    boxes.sort((a,b)=>b.area-a.area);
    assert(boxes[0]&&boxes[0].width>=400&&boxes[0].height>=260,'3D canvas not visible');
    const shot=await canvas.nth(boxes[0].index).screenshot({type:'png',animations:'disabled',timeout:20000});
    const quality=await imageHasDetail(shot);
    fs.mkdirSync(out,{recursive:true});
    const imageName=request.reference.replace(/[^A-Z0-9-]/gi,'_')+'.png';
    fs.writeFileSync(path.join(out,imageName),shot);
    manifest[request.reference]={
      reference:request.reference,model:request.model,lengthMm:request.lengthMm,widthMm:request.widthMm,
      color:request.color,colorCode:request.colorCode,
      image:'/bette-renders/'+imageName,scope:'verified-3d-screenshot',
      sourceUrl:request.sourceUrl,verifiedAt:new Date().toISOString(),quality
    };
    results.push({reference:request.reference,ok:true,...quality});
   }catch(e){throw Error('Bette '+request.reference+' image NOT imported: '+e.message)}
   finally{await page.close()}
  }
 }finally{await browser.close()}
 fs.mkdirSync(out,{recursive:true});
 // Don't discard previously accepted exact captures on new batch runs.
 const manifestPath=path.join(out,'manifest.json');
 const previous=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{};
 fs.writeFileSync(manifestPath,JSON.stringify({...previous,...manifest},null,2)+'\n');
 console.log(JSON.stringify({status:'validated',count:results.length,results},null,2));
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
module.exports={verifiedRequest,imageHasDetail};
