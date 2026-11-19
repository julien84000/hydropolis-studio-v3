'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10079,base='http://127.0.0.1:'+port;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-free-storage-'));
 const server=spawn(process.execPath,['server.js'],{
  cwd,env:{...process.env,PORT:String(port),DATABASE_URL:'',HYDRO_DATA_DIR:dir},
  stdio:['ignore','pipe','pipe']
 });
 let logs='',browser;
 server.stdout.on('data',v=>logs+=String(v));
 server.stderr.on('data',v=>logs+=String(v));
 try{
  let ready=false;
  for(let i=0;i<140;i++){
   try{if((await fetch(base+'/api/auth/status')).ok){ready=true;break}}catch{}
   await pause(100);
  }
  assert(ready,'Server not ready: '+logs.slice(-1000));
  const setup=await fetch(base+'/api/auth/setup',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:'Article Duplicate Test',username:'duplicate-articles',password:'test-articles-long-password'})
  });
  const auth=await setup.json();assert(auth.token,'No authorization token');
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  const page=await browser.newPage({viewport:{width:1450,height:900},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  if(process.env.HYDRO_BASELINE_APP)await page.route('**/app.js?*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.HYDRO_BASELINE_APP,'utf8')}));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof state!=='undefined'&&!!window.HydroRoomArticleDuplicate&&
   typeof window.HydroRoomArticleDuplicate.open==='function'&&
   typeof catalogIndex!=='undefined'&&catalogIndex.maker('Hotbath').length>=2554,null,{timeout:60000});

  await page.route('**/api/resigres-assets?*',async route=>{
   await pause(100);
   await route.fulfill({json:{image:'https://example.com/resigres.jpg',images:['https://example.com/resigres.jpg'],technicalSheetUrl:'https://example.com/resigres.pdf',productUrl:'https://example.com/resigres',title:'Receveur test'}});
  });
  await page.route('**/api/image-proxy?*',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'}));
  await page.evaluate(async()=>{
   state.project.name='Regression articles libres';state.rooms=[{id:'main',title:'SDB MASTER',manual:[]}];state.selected=[];
   await saveCloudProject();
   state.selected=[{id:'resigres',roomId:'main',manufacturer:'Resigres',designation:'Receveur test',resigresModel:'Neo',resigresKind:'shower-tray',price:277,totalPrice:277,quantity:1}];
   showView('project');renderRooms();
  });
  await page.waitForFunction(()=>state.selected[0]?.technicalSheetUrl==='https://example.com/resigres.pdf');
  await pause(500);
  const freeButtons=await page.locator('.free-create').count();
  if(process.env.HYDRO_BASELINE_APP){
   assert.equal(freeButtons,0,'Baseline should reproduce stale manual form');
   console.log('BASELINE reproduced: Resigres refresh removes free article editor');
  }else{
   assert.equal(freeButtons,1,'Resigres refresh must retain the free article editor');
   assert.equal(await page.locator('.manual-btn').count(),0);
   await page.locator('.free-create').click();
   await page.locator('#freeArticleModal [name=designation]').fill('Meuble sur mesure');
   await page.locator('#freeArticleModal [name=price]').fill('1934');
   await page.locator('#freeArticleModal [type=submit]').click();
   await page.locator('#freeArticleModal').waitFor({state:'detached'});
   assert.equal(await page.evaluate(()=>state.selected.filter(p=>p.isFreeArticle&&p.designation==='Meuble sur mesure').length),1);
  }
  // A photo occupies four URL fields per article. One fits, its raw duplicate exceeds Chrome's quota.
  await page.evaluate(()=>{
   const data='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="beige"/><!--'+'A'.repeat(700000)+'--></svg>');
   state.selected=[HydropolisFreeArticles.create({id:'photo-article',designation:'Colonne double',price:1934,quantity:1,image:data},'main')];
   state.presentationLayout={blocks:{},orders:{},assignments:{}};
   if(!saveState())throw Error('Initial single photo must fit');renderRooms();
  });
  const before=await page.evaluate(()=>({size:localStorage.getItem(stateStorageKey()).length,photo:state.selected[0].image.length}));
  await page.locator('.duplicate-article[data-id="photo-article"]').click();
  await page.locator('.article-duplicate-confirm').click();
  if(process.env.HYDRO_BASELINE_APP){
   await page.locator('.article-duplicate-error:not([hidden])').waitFor();
   assert.match(await page.locator('.article-duplicate-error').innerText(),/Impossible de sauvegarder la duplication|stockage local est plein/);
   assert.equal(await page.evaluate(()=>state.selected.length),1);
   console.log('BASELINE reproduced: photo duplication exceeds local quota, copy is rolled back');
  }else{
   await page.locator('dialog.article-duplicate-modal').waitFor({state:'detached'});
   const result=await page.evaluate(async()=>{
    const packed=localStorage.getItem(stateStorageKey());const original=state.selected[0].image;
    loadState();
    const localOK=state.selected.length===2&&state.selected.every(p=>p.image===original&&p.images[0]===original&&p.pdfImage===original&&p.pdfImages[0]===original);
    await saveCloudProject();
    const remote=await apiFetch('/api/projects/'+cloud.currentProjectId);
    await openCloudProject(cloud.currentProjectId,{ignoreLocalDraft:true});
    return {size:packed.length,localOK,remoteOK:remote.project.data.selected.every(p=>p.image===original),cloudOK:state.selected.length===2&&state.selected.every(p=>p.image===original),ids:state.selected.map(p=>p.id),prices:state.selected.map(p=>p.price),dirty:cloud.dirty};
   });
   assert(result.localOK&&result.remoteOK&&result.cloudOK,'Photos must survive local reload and cloud round-trip');
   assert.equal(new Set(result.ids).size,2);assert.deepEqual(result.prices,[1934,1934]);
   assert(result.size<before.photo+20000,'Duplicating a photo must not duplicate its local bytes');
   console.log('PASS: Resigres refresh, free article creation, large-photo duplication, exact photo restoration locally and in cloud',JSON.stringify({before:before.size,after:result.size}));
  }
  assert.deepEqual(errors,[],'Browser page errors');
 }catch(e){
  console.error(e.stack||e,logs.slice(-3000));process.exitCode=1;
 }finally{
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');await pause(150);fs.rmSync(dir,{recursive:true,force:true});
 }
})();
