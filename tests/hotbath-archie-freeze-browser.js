'use strict';
// Regression: selecting Archie must remain interactive even when every
// manufacturer image fails and the media resolver answers asynchronously.
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10069,base='http://127.0.0.1:'+port;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-hotbath-archie-'));
 const server=spawn(process.execPath,['server.js'],{
  cwd,env:{...process.env,PORT:String(port),DATABASE_URL:'',HYDRO_DATA_DIR:dir},stdio:['ignore','pipe','pipe']
 });
 let browser,logs='';
 server.stdout.on('data',v=>logs+=String(v));server.stderr.on('data',v=>logs+=String(v));
 try{
  let ready=false;
  for(let k=0;k<120;k++){
   try{if((await fetch(base+'/api/auth/status')).ok){ready=true;break}}catch{}
   await wait(100);
  }
  assert(ready,'Hotbath Archie test server failed: '+logs.slice(-700));
  const setup=await fetch(base+'/api/auth/setup',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:'Hotbath Archie Test',username:'archie-test',password:'archie-test-long-password'})
  });
  const auth=await setup.json();assert(auth.token,'Missing isolated auth token');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1540,height:980},serviceWorkers:'block'});
  const errors=[],attempts=new Map();
  page.on('pageerror',e=>errors.push(e.message));
  const manufacturer=/https:\/\/(?:hotbath\.com\/images\/compano\/|img\.edilportale\.com\/product-thumbs\/|www\.hotbath\.it\/documents\/ProdCateg\/)/;
  await page.route(manufacturer,route=>{
   const url=route.request().url();
   attempts.set(url,(attempts.get(url)||0)+1);
   return route.fulfill({status:404,contentType:'text/plain',body:'not found'});
  });
  await page.route(/\/api\/hotbath-(?:live|italian)-media\?/,route=>{
   const url=new URL(route.request().url());
   return route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({ok:true,collection:url.searchParams.get('collection'),
     model:url.searchParams.get('model'),scope:'missing',image:''})});
  });
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof catalogIndex!=='undefined'&&catalogIndex.maker('Hotbath').length>=2554&&!!window.HydroHotbathGalassia,{timeout:60000});
  await page.evaluate(()=>window.HydroHotbathGalassia.open(catalogIndex.maker('Hotbath'),'r1',()=>{}));
  await page.locator('.hotbath-collections [data-collection="Archie"]').click({timeout:12000});
  assert.match(await page.locator('.hotbath-selection').innerText(),/ARCHIE/i);
  await page.waitForTimeout(900); // Allow a representative wave of broken thumbnails.
  const models=page.locator('.hotbath-models [data-model]');
  assert((await models.count())>=2,'Archie model gallery did not render');
  await models.nth(1).click({timeout:8000});
  await page.locator('.hotbath-categories [data-category]').nth(1).click({timeout:8000});
  await page.locator('.hotbath-categories [data-category]').first().click({timeout:8000});
  await page.locator('.galassia-search').fill('AR003',{timeout:8000});
  assert((await page.locator('.hotbath-models [data-model="AR003"]').count())>0,
   'Search did not remain functional after image errors');
  await page.locator('.hotbath-models [data-model="AR003"]').click({timeout:8000});
  await page.locator('.galassia-close').click({timeout:8000});
  assert.equal(await page.locator('.hotbath-galassia-modal').count(),0,'Close must remain usable');
  const repeated=[...attempts].filter(([,count])=>count>5);
  assert.equal(repeated.length,0,'Failed photos re-requested repeatedly: '+JSON.stringify(repeated.slice(0,3)));
  assert(!errors.some(e=>/hotbath|galassia|too much recursion|maximum call stack/i.test(e)),errors.join('\n'));
  console.log('Hotbath Archie browser OK: 404 media, collection, category, card, search and close stay responsive');
 }catch(e){console.error(e.stack||e,logs.slice(-1700));process.exitCode=1}
 finally{if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');await wait(150);fs.rmSync(dir,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
