'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const {createCanvas}=require('@napi-rs/canvas');
const root=path.join(__dirname,'..');
const rows=JSON.parse(fs.readFileSync(path.join(root,'public/catalog_recor.json'),'utf8')).filter(x=>x.manufacturer==='Recor');
const img=createCanvas(900,900),ctx=img.getContext('2d');
ctx.fillStyle='#eceae6';ctx.fillRect(0,0,900,900);
ctx.fillStyle='#282729';ctx.beginPath();ctx.moveTo(115,390);ctx.lineTo(785,390);ctx.lineTo(700,715);ctx.lineTo(210,715);ctx.closePath();ctx.fill();
ctx.fillStyle='#f9f9f9';ctx.beginPath();ctx.ellipse(450,390,350,62,0,0,Math.PI*2);ctx.fill();
const png=img.toBuffer('image/png');
let server,browser;
(async()=>{
 server=http.createServer((req,res)=>{
  const url=String(req.url||'');
  if(url.startsWith('/api/recor-model-photo')){
   res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});res.end(png);return;
  }
  if(url.startsWith('/api/recor-model-media')){
   res.writeHead(200,{'Content-Type':'application/json'});
   res.end(JSON.stringify({ok:true,model:'SLIPPER',images:['/api/recor-model-photo?model=SLIPPER&index=0'],image:'/api/recor-model-photo?model=SLIPPER&index=0',verifiedModel:true}));return;
  }
  res.writeHead(200,{'Content-Type':'text/html'});
  res.end('<!doctype html><html><head><meta charset="utf-8"></head><body><main id="test"></main></body></html>');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1050}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  for(const name of ['recor-guided-model.js','recor-configurator.js'])
   await page.addScriptTag({content:fs.readFileSync(path.join(root,'public',name),'utf8')});
  await page.evaluate(items=>{
   window.__added=null;
   window.HydroRecorConfigurator.open({rows:items,roomId:'room-recor',onAdd:(v)=>{window.__added=v;return 'ok';}});
  },rows);
  const dialog=page.locator('#recorGuidedConfigurator');
  await dialog.waitFor();
  const pixels=()=>page.evaluate(()=>{
   const canvas=document.querySelector('.recor-preview-canvas');
   return Array.from(canvas.getContext('2d',{willReadFrequently:true}).getImageData(370,320,1,1).data).slice(0,3);
  });
  await page.waitForFunction(()=>{
   const c=document.querySelector('.recor-preview-canvas');
   const p=c?.getContext('2d')?.getImageData(370,320,1,1).data;
   return p && p[0]<100&&p[1]<100&&p[2]<100;
  });
  const before=await pixels();
  await dialog.locator('[data-recor-select="finishMode"]').selectOption('ral-classic');
  await dialog.locator('.recor-ral').fill('RAL 3012');
  await page.waitForFunction(()=>{
   const p=document.querySelector('.recor-preview-canvas')?.getContext('2d')?.getImageData(370,320,1,1).data;
   return p&&p[0]>90&&p[0]>p[1];
  });
  const classic=await pixels();
  assert.notDeepEqual(classic,before,'RAL Classic must recolor bathtub pixels');
  assert.match(await dialog.locator('.recor-priced-addon').first().innerText(),/RAL Classic/);
  await dialog.locator('[data-recor-select="finishMode"]').selectOption('ral-design');
  await dialog.locator('.recor-ral').fill('RAL 5003');
  await page.waitForFunction(()=>{
   const p=document.querySelector('.recor-preview-canvas')?.getContext('2d')?.getImageData(370,320,1,1).data;
   return p&&p[2]>p[0]+10;
  });
  const design=await pixels();
  assert.notDeepEqual(classic,design,'RAL Design must repaint exterior');
  assert.match(await dialog.locator('.recor-priced-addon').first().innerText(),/RAL Design/);
  await dialog.locator('[data-recor-select="feet"]').selectOption({index:1});
  await dialog.locator('[data-recor-check="antiSlip"]').check();
  const total=await dialog.locator('.recor-price-total strong').innerText();
  assert.ok(total.includes('€'),'Total HT missing');
  await dialog.locator('.recor-add-btn').click();
  await page.waitForFunction(()=>!!window.__added);
  const saved=await page.evaluate(()=>({
   reference:window.__added.main.reference,
   code:window.__added.configuration.ral,
   mode:window.__added.configuration.finishMode,
   options:window.__added.configuration.extraLines,
   price:window.__added.configuration.extraPriceHt,
   purchase:window.__added.configuration.extraPurchaseHt,
   preview:window.__added.preview
  }));
  assert.match(saved.reference,/WHITE/);
  assert.equal(saved.code,'RAL 5003');
  assert.equal(saved.mode,'ral-design');
  assert.deepEqual(saved.options.map(x=>x.id),['ral-design','anti-slip']);
  assert.equal(saved.price,1183.75+41.99);
  assert.equal(saved.purchase,455.29+16.15);
  assert.ok(saved.preview.startsWith('data:image/jpeg;base64,'),'Saved preview should contain selected colour');
  assert.deepEqual(errors,[],'Browser JS errors');
  console.log('Recor RAL Classic / RAL Design: photo recolored, priced, and saved with white bath.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
