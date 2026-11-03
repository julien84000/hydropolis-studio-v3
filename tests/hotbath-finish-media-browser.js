'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10059,base='http://127.0.0.1:'+port;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YVXaT0AAAAASUVORK5CYII=','base64');
(async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-hotbath-finish-'));
 const server=spawn(process.execPath,['server.js'],{cwd,env:{...process.env,PORT:String(port),DATABASE_URL:'',HYDRO_DATA_DIR:data},stdio:['ignore','pipe','pipe']});
 let browser,logs='';
 server.stdout.on('data',v=>logs+=String(v));server.stderr.on('data',v=>logs+=String(v));
 try{
  let ready=false;
  for(let i=0;i<120;i++){try{if((await fetch(base+'/api/auth/status')).ok){ready=true;break}}catch{}await wait(100)}
  assert(ready,'Server did not start: '+logs.slice(-700));
  const setup=await fetch(base+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:'Finish Test',username:'finish-test',password:'finish-test-long-password'})});
  const auth=await setup.json();assert(auth.token,'Missing isolated login token');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1550,height:1000},serviceWorkers:'block'});
  await page.route(/https:\/\/hotbath\.com\/images\/compano\//,route=>route.fulfill({status:200,contentType:'image/png',body:png}));
  await page.route(/\/api\/finish-simulation\?/,route=>route.fulfill({status:200,contentType:'image/png',body:png}));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof catalogIndex!=='undefined'&&catalogIndex.maker('Hotbath').length>=2554
    &&!!window.HydroHotbathFinishMedia&&!!window.HydroHotbathProjectVisual,{timeout:60000});
  await page.evaluate(()=>window.HydroHotbathFinishMedia.load());
  const created=await page.evaluate(()=>{
   const room=state.rooms[0];
   const product=catalogIndex.maker('Hotbath').find(p=>p.reference==='CB003C.GN');
   if(!product)throw Error('Test Hotbath product not in catalog');
   const record=createSelectedProductRecord(product,room.id);
   if(!record)throw Error('Cannot prepare Hotbath product');
   state.selected.push(record);saveState();
   showView('project');renderRooms();
   return {id:record.id,ref:record.reference,price:record.price,src:record.image,
     discount:record.purchaseDiscount};
  });
  assert.equal(created.ref,'CB003C.GN');
  assert.match(created.src,/CB003C/);
  const tabs=page.locator('#roomsEditor .hotbath-photo-tabs');
  await tabs.first().waitFor({timeout:12000});
  assert.equal(await tabs.count(),1);
  const sim=tabs.locator('[data-mode="simulation"]');
  const photo=tabs.locator('[data-mode="photo"]');
  assert.equal(await sim.isDisabled(),false,'Finish simulation should be offered for same-model asset');
  assert.equal(await photo.getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('.hotbath-photo-caption').innerText(),/Photo générique du même modèle/);
  await sim.click();
  // The preview checks a real image response asynchronously before
  // committing the reversible mode. Wait for the persisted UI state, not
  // merely for Playwright to dispatch the click event.
  await page.waitForFunction(()=>document.querySelector(
    '#roomsEditor .hotbath-photo-tabs [data-mode="simulation"]'
  )?.getAttribute('aria-pressed')==='true',null,{timeout:12000});
  assert.equal(await page.locator('.hotbath-photo-tabs [data-mode="simulation"]').getAttribute('aria-pressed'),'true');
  const mid=await page.evaluate(id=>{
   const p=state.selected.find(x=>x.id===id);
   const stored=JSON.parse(localStorage.getItem(stateStorageKey())).selected.find(x=>x.id===id);
   return {mode:p.hotbathVisualMode,flag:p.imageSimulation,image:p.image,
     price:p.price,reference:p.reference,discount:p.purchaseDiscount,
     storedMode:stored.hotbathVisualMode,sim:productVisuals(p)[0],
     documentNote:hotbathDossierPhotoDisclaimer(p),documentHtml:boardItemHtml(p,0)};
  },created.id);
  assert.equal(mid.mode,'simulation');
  assert.equal(mid.flag,true);
  assert.equal(mid.image,created.src,'Original photograph cannot be overwritten by the simulation');
  assert.equal(mid.price,created.price);
  assert.equal(mid.reference,created.ref);
  assert.equal(mid.discount,created.discount);
  assert.equal(mid.storedMode,'simulation','Project storage must persist visual mode');
  assert.match(mid.sim,/\/api\/finish-simulation\?/);
  assert.match(mid.documentNote,/Simulation de finition — rendu indicatif non contractuel/);
  assert.match(mid.documentHtml,/Simulation de finition — rendu indicatif non contractuel/);
  await page.locator('.hotbath-photo-tabs [data-mode="photo"]').click();
  const restored=await page.evaluate(id=>{
   const p=state.selected.find(x=>x.id===id);
   return {mode:p.hotbathVisualMode,image:p.image,src:productVisuals(p)[0],
     price:p.price,reference:p.reference,documentNote:hotbathDossierPhotoDisclaimer(p)};
  },created.id);
  assert.equal(restored.mode,'photo');
  assert.equal(restored.image,created.src);
  assert.equal(restored.src,created.src);
  assert.equal(restored.price,created.price);
  assert.equal(restored.reference,created.ref);
  assert.match(restored.documentNote,/Photo générique du modèle/);
  assert.deepEqual(errors.filter(x=>/Hotbath|hotbath|finish-simulation/i.test(x)),[]);
  console.log('Hotbath finish browser OK: generic same-model photo, simulation tab, saved mode, dossier and original restore');
 }catch(e){console.error(e.stack||e,logs.slice(-2500));process.exitCode=1}
 finally{if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');await wait(200);fs.rmSync(data,{force:true,recursive:true})}
})();
