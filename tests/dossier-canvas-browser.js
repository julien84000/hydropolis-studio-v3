'use strict';
const assert=require('node:assert/strict');
const fs=require('fs'),os=require('os'),path=require('path');
const {spawn}=require('child_process');
const {chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10041,base='http://127.0.0.1:'+port;
const wait=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-canvas-'));
 const server=spawn(process.execPath,['server.js'],{
  cwd,env:{...process.env,PORT:String(port),HYDRO_DATA_DIR:data,DATABASE_URL:''},
  stdio:['ignore','pipe','pipe']
 });
 let output='',browser;
 server.stderr.on('data',b=>{output+=String(b)});
 server.stdout.on('data',b=>{output+=String(b)});
 try{
  for(let n=0;n<100;n++){
   try{const r=await fetch(base+'/api/auth/status');if(r.ok)break}catch(_){}
   await wait(100);
  }
  const response=await fetch(base+'/api/auth/setup',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:'Test Canvas',username:'canvas-test',password:'canvas-test-password'})
  });
  const auth=await response.json();assert.ok(auth.token,'Authentication: '+JSON.stringify(auth));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:950},serviceWorkers:'block'});
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof state!=='undefined' && !!state.rooms?.length && !!window.HydroDossierCanvas,{timeout:60000});
  await page.evaluate(()=>showView('preview'));
  await page.locator('#canvasStudio').waitFor();
  await page.locator('#canvasEdit').click();
  await page.locator('[data-add="text"]').click();
  assert.equal(await page.locator('#document .cover-page .v12-canvas-block.canvas-text').count(),1);
  await page.locator('#canvasText').fill('Proposition personnalisée');
  await page.locator('#canvasText').press('Tab');
  assert.match(await page.locator('#document .cover-page .v12-canvas-text').first().innerText(),/Proposition personnalisée/);
  const originalX=await page.evaluate(()=>state.project.dossierCanvas.pages.cover[0].x);
  const handle=page.locator('#document .cover-page .canvas-drag').first();
  await handle.scrollIntoViewIfNeeded();
  const box=await handle.boundingBox();assert.ok(box,'Missing drag handle');
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+70,box.y+box.height/2+18,{steps:5});
  await page.mouse.up();
  const movedX=await page.evaluate(()=>state.project.dossierCanvas.pages.cover[0].x);
  assert.ok(movedX>originalX,'Canvas drag must change saved relative coordinates: '+originalX+' -> '+movedX);
  await page.locator('#canvasDuplicate').click();
  assert.equal(await page.locator('#document .cover-page .v12-canvas-block.canvas-text').count(),2);
  await page.locator('#canvasUndo').click();
  assert.equal(await page.locator('#document .cover-page .v12-canvas-block.canvas-text').count(),1);
  await page.locator('#canvasSave').click();
  await page.waitForFunction(()=>!!cloud.currentProjectId&&!cloud.dirty,{timeout:30000});
  const beforeReload=await page.evaluate(()=>({
   project:cloud.currentProjectId,
   text:state.project.dossierCanvas.pages.cover[0].text,
   x:state.project.dossierCanvas.pages.cover[0].x
  }));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof state!=='undefined'&&!!window.HydroDossierCanvas,{timeout:60000});
  await page.evaluate(async id=>{
   if(!cloud.currentProjectId || cloud.currentProjectId!==id){
    await loadCloudProjects();await openCloudProject(id);
   }
   showView('preview');
  },beforeReload.project);
  await page.locator('#document .cover-page .v12-canvas-text').first().waitFor();
  const afterReload=await page.evaluate(()=>state.project.dossierCanvas.pages.cover[0]);
  assert.equal(afterReload.text,beforeReload.text);
  assert.equal(afterReload.x,beforeReload.x);
  await page.emulateMedia({media:'print'});
  const statePrint=await page.evaluate(()=>({
   overlay: getComputedStyle(document.querySelector('#document .cover-page .v12-canvas-layer')).display,
   block:getComputedStyle(document.querySelector('#document .cover-page .v12-canvas-text')).display,
   studio:getComputedStyle(document.querySelector('#canvasStudio')).display
  }));
  assert.notEqual(statePrint.overlay,'none','Canvas graphic layers must print');
  assert.notEqual(statePrint.block,'none','Text must print');
  assert.equal(statePrint.studio,'none','Editor buttons must not print');
  assert.deepEqual(errors.filter(x=>/dossier-canvas|canvas-editor/i.test(x)),[]);
  console.log('Canvas E2E OK: text editing, drag, undo/duplicate, cloud save, reload and print');
 }catch(err){console.error(err.stack||err);console.error(output.slice(-2200));process.exitCode=1}
 finally{
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
  await wait(150);
  fs.rmSync(data,{recursive:true,force:true})
 }
})();