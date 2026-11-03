'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10058,base='http://127.0.0.1:'+port;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-hotbath-ray-'));
 const server=spawn(process.execPath,['server.js'],{
  cwd,env:{...process.env,PORT:String(port),DATABASE_URL:'',HYDRO_DATA_DIR:data},stdio:['ignore','pipe','pipe']
 });
 let browser,logs='';
 server.stdout.on('data',b=>logs+=String(b));server.stderr.on('data',b=>logs+=String(b));
 try{
  let ready=false;
  for(let i=0;i<100;i++){try{if((await fetch(base+'/api/auth/status')).ok){ready=true;break}}catch(_){}await wait(100)}
  assert(ready,'Hotbath test server did not start: '+logs.slice(-500));
  const setup=await fetch(base+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:'Hotbath Ray Test',username:'ray-test',password:'ray-test-long-password'})});
  const auth=await setup.json();assert(auth.token,'Missing isolated auth');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1550,height:960},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof catalogIndex!=='undefined'&&
   catalogIndex.maker('Hotbath').length>=2554&&!!window.HydroHotbathGalassia,{timeout:60000});
  const open=async()=>{
   await page.evaluate(()=>{
    window.__raySelected=null;
    window.HydroHotbathGalassia.open(catalogIndex.maker('Hotbath'),'r1',(p,roomId)=>{
     window.__raySelected={reference:p.reference,roomId,price:p.price,
      internalReference:p.internalReference,internalPrice:p.internalPrice,totalPrice:p.totalPrice};
    });
   });
   await page.locator('.hotbath-galassia-modal').waitFor({timeout:15000});
   await page.locator('.hotbath-collections [data-collection="Ray"]').click();
   await page.locator('.hotbath-categories [data-category="4128"]').waitFor({timeout:15000});
  };
  await open();
  await page.locator('.hotbath-categories [data-category="4128"]').click();
  const horizontal=page.locator('.hotbath-models [data-model="RARH50-2"]');
  await horizontal.waitFor();
  await horizontal.click();
  await page.locator('.hotbath-variant').selectOption('RARH50-2EXT.GN');
  const main=page.locator('.hotbath-selection');
  assert.match(await main.innerText(),/31 W/);
  assert.match(await main.innerText(),/MBASES3/);
  assert.match(await main.innerText(),/222,00/);
  assert.match(await main.innerText(),/1[\s\u00a0\u202f]?017,00/);
  assert.match(await main.locator('.galassia-image-note').innerText(),/finition illustrative/i);
  await main.locator('.hotbath-add').click();
  const horizontalAdded=await page.evaluate(()=>window.__raySelected);
  assert.deepEqual(horizontalAdded,{reference:'RARH50-2EXT.GN',roomId:'r1',price:795,
   internalReference:'MBASES3',internalPrice:222,totalPrice:1017});
  await open();
  await page.locator('.hotbath-categories [data-category="4133"]').click();
  await page.locator('.hotbath-models [data-model="RARV135-3"]').click();
  await page.locator('.hotbath-variant').selectOption('RARV135-3EXT.BBP');
  const vert=await page.locator('.hotbath-selection').innerText();
  assert.match(vert,/187 W/);
  assert.match(vert,/MBASES4/);
  assert.match(vert,/277,00/);
  assert.match(vert,/2[\s\u00a0\u202f]?939,00/);
  await page.locator('.hotbath-add').click();
  const verticalAdded=await page.evaluate(()=>window.__raySelected);
  assert.equal(verticalAdded.reference,'RARV135-3EXT.BBP');
  assert.equal(verticalAdded.internalReference,'MBASES4');
  assert.equal(verticalAdded.totalPrice,2939);
  await open();
  await page.locator('.hotbath-categories [data-category="ray-accessories"]').click();
  await page.locator('.hotbath-models [data-model="RAAR"]').click();
  await page.locator('.hotbath-variant').selectOption('RAAR.BBP');
  const accessory=await page.locator('.hotbath-selection').innerText();
  assert.match(accessory,/98,00/);
  assert.equal(await page.locator('.hotbath-selection .hotbath-rough-in').count(),0);
  await page.locator('.hotbath-add').click();
  const hook=await page.evaluate(()=>window.__raySelected);
  assert.equal(hook.reference,'RAAR.BBP');assert.equal(hook.price,98);
  assert.equal(hook.internalReference,null);
  assert.deepEqual(errors.filter(x=>/hotbath.*ray/i.test(x)),[]);
  console.log('Hotbath RAY browser OK: 6 models, 3 body references, exact HT totals, images, technical cards, optional RAAR');
 }catch(e){console.error(e.stack||e,logs.slice(-2000));process.exitCode=1}
 finally{if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');await wait(150);fs.rmSync(data,{recursive:true,force:true})}
})();
