'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.join(__dirname,'../public');
const source=require('../naxani-plan-media-server');
const scripts=['naxani-2026-catalog.js','naxani-2026-enhancements.js','naxani-plan-drawings.js','naxani-plan-media.js','naxani-configurator.js','naxani-modular-configurator.js'];
let browser,server;
(async()=>{
 server=http.createServer(async(req,res)=>{
  const u=new URL(req.url||'/', 'http://localhost');
  if(u.pathname==='/api/naxani-plan-drawing'){
   try{const png=await source.render(u.searchParams.get('model'));if(!png){res.writeHead(404);res.end('Not found');return}
    res.writeHead(200,{'Content-Type':'image/png'});res.end(png);return
   }catch(err){res.writeHead(500);res.end(String(err));return}
  }
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1480,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const onePixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO/JR5kAAAAASUVORK5CYII=','base64');
  await page.route(/^https:\/\/naxani\.com\//,route=>route.fulfill({body:onePixel,contentType:'image/png'}));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.addStyleTag({content:fs.readFileSync(path.join(root,'naxani-configurator.css'),'utf8')});
  for(const file of scripts)await page.addScriptTag({content:fs.readFileSync(path.join(root,file),'utf8')});
  const ready=await page.evaluate(()=>({
   available:window.HydroNaxaniPlanMedia.collections.length,
   doubles:window.HydroNaxani2026.rows.filter(p=>p.productType==='plan-integre'&&p.naSinkCount===2).length
  }));
  assert.equal(ready.available,15);
  assert.equal(ready.doubles,95);
  const pResponse=await page.request.get(base+'/api/naxani-plan-drawing?model=Alpos');
  assert.equal(pResponse.status(),200);
  assert.equal((await pResponse.body()).subarray(0,4).toString('hex'),'89504e47');
  // The direct integrated-top journey had no double-basin selection in V11.64.68.
  await page.evaluate(()=>{
   const rows=window.HydroNaxani2026.rows;
   const first=rows.find(x=>x.productType==='plan-integre'&&x.collection==='Alpos'&&x.naSinkCount===1);
   window.__added=null;
   window.HydroNaxaniConfigurator.open(rows,'room-test',value=>{window.__added=value;},first);
  });
  const modal=page.locator('.nax-modal');
  await modal.waitFor();
  const count=modal.locator('[data-input="standaloneSinkCount"]');
  assert.equal(await count.count(),1,'Direct top must offer one or two basins');
  await count.selectOption('2');
  assert.equal(await modal.locator('.nax-standalone-variants button').count(),13,'Alpos has 13 double-basin tariff references');
  await modal.locator('button[data-standalone-plan-ref="572268"]').click();
  assert.match(await modal.locator('.nax-supplier').innerText(),/572268/);
  assert.equal(await modal.locator('.nax-top-pair').count()>0,true);
  // The manufacturer's Alma/Alpos family page does not provide a verified
  // Alpos-specific photograph. Show the real cropped technical plan instead
  // of incorrectly using a Walden furniture photo.
  assert.equal(await modal.locator('.nax-standalone-top .nax-plan-technical').count(),1);
  assert.equal(await modal.locator('.nax-standalone-top .nax-photo-fallback').count(),1);
  await modal.locator('.nax-add').click();
  await page.waitForFunction(()=>!!window.__added);
  const saved=await page.evaluate(()=>({
   ref:window.__added.reference,
   refs:window.__added.naxaniAssembly.references,
   count:window.__added.naxaniAssembly.basinCount,
   media:window.__added.naxaniAssembly.planMedia
  }));
  assert.equal(saved.ref,'572268');
  assert.equal(saved.count,2);
  assert.equal(saved.refs[0],'572268');
  assert.equal(saved.media.reference,'572268');
  assert.equal(saved.media.model,'Alpos');
  assert.match(saved.media.drawingUrl,/api\/naxani-plan-drawing\?model=Alpos/);
  // Furniture + integrated double basin journey: 149 cm Grid with Alpos double.
  await page.evaluate(()=>{
   const rows=window.HydroNaxani2026.rows;
   const first=rows.find(x=>x.reference==='505519');
   window.HydroNaxaniConfigurator.open(rows,'room-test',value=>{window.__addedFurniture=value;},first);
  });
  await modal.waitFor();
  await modal.locator('[data-input="basinCount"]').selectOption('2');
  await modal.locator('button[data-plan-collection="Alpos"]').click();
  assert.equal((await modal.locator('button[data-plan-ref="571889"]').count())>0,true,'149 cm Alpos double should be compatible with 149 cm Grid');
  await modal.locator('button[data-plan-ref="571889"]').click();
  const selected=modal.locator('.nax-selected-plan');
  assert.match(await selected.innerText(),/149 cm/);
  assert.equal(await selected.locator('.nax-top-pair').count(),1);
  const chosen=await modal.locator('.nax-add').isDisabled();
  assert.equal(chosen,false,'Compatible Grid/Alpos composition should be addable');
  // Lembo has 34 official single suspended SKUs and no manufacturer
  // double SKU. Two sinks must remain two separate priced catalogue lines.
  await page.evaluate(()=>{
    const rows=window.HydroNaxani2026.rows;
    const first=rows.find(x=>x.reference==='515341');
    window.__suspended=null;
    window.HydroNaxaniConfigurator.open(rows,'room-test',value=>{window.__suspended=value},first);
  });
  await modal.waitFor();
  const suspendedCount=modal.locator('[data-input="standaloneSinkCount"]');
  assert.equal(await suspendedCount.count(),1,'Suspended basins must expose the 1/2 selector');
  assert.match(await modal.locator('.nax-plan-count').innerText(),/Nombre de lavabos suspendus/);
  await suspendedCount.selectOption('2');
  assert.match(await modal.locator('.nax-plan-count').innerText(),/Deux lavabos suspendus indépendants/);
  assert.match(await modal.locator('.nax-plan-count').innerText(),/Pas un plan monobloc double vasque/);
  assert.equal(await modal.locator('[data-input="width"] option').count(),34,'Do not lose priced Lembo widths');
  await modal.locator('[data-input="width"]').selectOption('149');
  assert.match(await modal.locator('.nax-supplier').innerText(),/515556/);
  assert.match(await modal.locator('.nax-grand').innerText(),/1\\s?910/);
  assert.equal(await modal.locator('.nax-add').isDisabled(),false);
  await modal.locator('.nax-add').click();
  await page.waitForFunction(()=>!!window.__suspended);
  const pair=await page.evaluate(()=>window.__suspended);
  assert.equal(pair.reference,'515556');
  assert.deepEqual(pair.naxaniAssembly.references,['515556','515556']);
  assert.equal(pair.naxaniAssembly.basinCount,2);
  assert.equal(pair.naxaniAssembly.totalWidth,298);
  assert.equal(pair.naxaniAssembly.total,1910);
  // A saved two-basin configuration must reopen with two basins selected.
  await page.evaluate(()=>{
    const rows=window.HydroNaxani2026.rows;
    window.HydroNaxaniConfigurator.open(rows,'room-test',()=>{},window.__suspended);
  });
  await modal.waitFor();
  assert.equal(await modal.locator('[data-input="standaloneSinkCount"]').inputValue(),'2');
  assert.match(await modal.locator('.nax-grand').innerText(),/1\\s?910/);
  assert.deepEqual(errors,[],'JavaScript runtime errors');
  console.log('Naxani V11.64.69: 15 paired photos/drawings, standalone double 572268, Grid 149 + double Alpos 571889: OK');
 }finally{
  await browser?.close();
  await new Promise(ok=>server.close(ok));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
