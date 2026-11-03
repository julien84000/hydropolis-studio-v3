'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10062,base='http://127.0.0.1:'+port;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-project-image-fit-'));
 const server=spawn(process.execPath,['server.js'],{cwd,env:{...process.env,PORT:String(port),DATABASE_URL:'',HYDRO_DATA_DIR:home},stdio:['ignore','pipe','pipe']});
 let browser,serverLogs='';
 server.stdout.on('data',b=>serverLogs+=String(b));
 server.stderr.on('data',b=>serverLogs+=String(b));
 try{
  let ready=false;
  for(let i=0;i<120;i++){try{if((await fetch(base+'/api/auth/status')).ok){ready=true;break}}catch{}await delay(100)}
  assert(ready,'Isolated app failed to start '+serverLogs.slice(-400));
  const setup=await fetch(base+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:'Project thumbnails',username:'thumb-test',password:'thumb-test-long-password'})});
  const auth=await setup.json();assert(auth.token,'Isolated login failed');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1550,height:900},serviceWorkers:'block'});
  const svg=(w,h)=>'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><rect width="'+w+'" height="'+h+'" fill="white"/><rect x="8" y="8" width="'+(w-16)+'" height="'+(h-16)+'" fill="#bf9e6d"/></svg>';
  await page.route('**/__test/hidrobox-wide.svg',route=>route.fulfill({status:200,contentType:'image/svg+xml',body:svg(900,200)}));
  await page.route('**/__test/hotbath-tall.svg',route=>route.fulfill({status:200,contentType:'image/svg+xml',body:svg(200,900)}));
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof state!=='undefined'&&!!state.rooms?.length&&!!window.HydroHotbathProjectVisual&&!!catalogIndex?.maker,{timeout:60000});
  await page.evaluate(()=>{
   const room=state.rooms[0];
   const hb=catalogIndex.maker('Hidrobox').find(x=>x.reference);
   const ht=catalogIndex.maker('Hotbath').find(x=>x.reference==='CB003C.GN');
   if(!hb||!ht)throw Error('Hidrobox or Hotbath catalogue unavailable');
   const h=createSelectedProductRecord(hb,room.id);
   h.id='thumb-hidrobox';
   h.image='/__test/hidrobox-wide.svg';h.images=[h.image];h.pdfImage=h.image;
   h.customImage=false;
   const t=createSelectedProductRecord(ht,room.id);
   t.id='thumb-hotbath';
   t.image='/__test/hotbath-tall.svg';
   t.images=[t.image];t.pdfImage=t.image;
   t.customImage=true;
   state.selected.push(h,t);
   showView('project');renderRooms();
  });
  const hid=page.locator('#roomsEditor .room-prod-img label[data-id="thumb-hidrobox"]');
  await hid.waitFor({timeout:12000});
  await hid.locator('img').waitFor({timeout:12000});
  const wide=await hid.evaluate(label=>{
   const container=label.closest('.room-prod-img'),img=label.querySelector('img');
   const box=container.getBoundingClientRect(),r=img.getBoundingClientRect(),sty=getComputedStyle(img);
   return {width:box.width,height:box.height,imageWidth:r.width,imageHeight:r.height,fit:sty.objectFit,position:sty.objectPosition,
     naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,visible:box.width>0&&box.height>0};
  });
  assert(wide.visible);
  assert(wide.width>=116&&wide.width<=130,'Hidrobox image must be in a legible 124 px desktop tile: '+JSON.stringify(wide));
  assert(wide.height>=108&&wide.height<=120,'Hidrobox photo height must be sized');
  assert.equal(wide.fit,'contain','Wide Hidrobox photo cannot be cropped');
  assert(wide.imageWidth<=wide.width&&wide.imageHeight<=wide.height,'Image element must stay in the thumbnail box');
  assert.equal(wide.naturalWidth,900);
  assert.equal(wide.naturalHeight,200);
  const controls=page.locator('#roomsEditor .room-product:has(label[data-id="thumb-hotbath"]) .hotbath-photo-controls');
  await controls.waitFor({timeout:10000});
  assert.equal(await page.locator('#roomsEditor .room-prod-img .hotbath-photo-controls').count(),0,
    'Hotbath photo/simulate tabs must never be trapped inside clipped thumbnail');
  assert.equal(await controls.locator('button[data-mode="photo"]').isVisible(),true);
  const location=await controls.evaluate(e=>{
   const detail=e.closest('.room-product')?.querySelector('.image-actions')?.parentElement;
   return {inDetail:detail?.contains(e),parentClass:e.parentElement?.className||''};
  });
  assert.equal(location.inDetail,true);
  await page.setViewportSize({width:580,height:920});
  const mobile=await hid.evaluate(label=>{
   const box=label.closest('.room-prod-img').getBoundingClientRect();
   return {width:box.width,height:box.height,fit:getComputedStyle(label.querySelector('img')).objectFit};
  });
  assert(mobile.width>=90&&mobile.width<=102,'Responsive thumbnail must shrink at mobile widths '+JSON.stringify(mobile));
  assert(mobile.height>=88&&mobile.height<=100);
  assert.equal(mobile.fit,'contain');
  const stateAudit=await page.evaluate(()=>({
   hid:state.selected.find(x=>x.id==='thumb-hidrobox'),
   hot:state.selected.find(x=>x.id==='thumb-hotbath')
  }));
  assert.equal(stateAudit.hid.image,'/__test/hidrobox-wide.svg');
  assert.equal(stateAudit.hot.image,'/__test/hotbath-tall.svg');
  assert.equal(stateAudit.hot.reference,'CB003C.GN');
  console.log('Project by room photo fit: Hidrobox landscape, Hotbath tall, visible controls, responsive containment OK');
 }catch(e){console.error(e.stack||e,serverLogs.slice(-2200));process.exitCode=1}
 finally{if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');await delay(150);fs.rmSync(home,{recursive:true,force:true})}
})();
