'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10078,base='http://127.0.0.1:'+port;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-article-duplicate-'));
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
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1450,height:900},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof state!=='undefined'&&!!window.HydroRoomArticleDuplicate&&
   typeof window.HydroRoomArticleDuplicate.open==='function'&&
   typeof catalogIndex!=='undefined'&&catalogIndex.maker('Hotbath').length>=2554,null,{timeout:60000});
  await page.evaluate(()=>{
   state.project.name='Duplication article · suivi devis';
   state.rooms=[{id:'main',title:'SDB principale',subtitle:'Lavabo',manual:[]},
                {id:'guest',title:'SDB invités',subtitle:'Douche',manual:[]}];
   state.selected=[
    {id:'tap',roomId:'main',designation:'Mitigeur lavabo',manufacturer:'Test',reference:'TAP-001',
     price:350,totalPrice:350,quantity:2,quoteUnitOverride:490,clientDiscountOverride:10,
     configuration:{finish:'BS',options:['A']},finish:'Acier brossé',hideFromDossier:false,image:'',images:[]},
    {id:'tap-body',roomId:'main',designation:'Corps encastré obligatoire',manufacturer:'Test',reference:'BODY-001',
     accessoryFor:'tap',requiredRoughIn:true,quantity:2,price:50,totalPrice:50,hideFromDossier:true,image:'',images:[]},
    {id:'sink',roomId:'main',designation:'Vasque',manufacturer:'Test',reference:'SINK-001',price:400,totalPrice:400,quantity:1,image:'',images:[]},
    {id:'mirror',roomId:'guest',designation:'Miroir',manufacturer:'Test',reference:'MIRROR',price:150,totalPrice:150,quantity:1,image:'',images:[]},
    {id:'light',roomId:'guest',designation:'Applique',manufacturer:'Test',reference:'LIGHT',price:120,totalPrice:120,quantity:1,image:'',images:[]}
   ];
   state.presentationLayout={blocks:{},orders:{},assignments:{}};
   saveState();showView('project');renderRooms();
  });
  assert.equal(await page.locator('.duplicate-article[data-id="tap"]').count(),1);
  assert.equal(await page.locator('.duplicate-article[data-id="tap-body"]').count(),0);
  const original=await page.evaluate(()=>JSON.stringify(state.selected));
  await page.locator('.duplicate-article[data-id="tap"]').click();
  await page.locator('dialog.article-duplicate-modal').waitFor();
  await page.locator('.article-duplicate-room').selectOption('guest');
  await page.locator('.article-duplicate-position').selectOption('after:mirror');
  await page.locator('.article-duplicate-confirm').click();
  await page.locator('dialog.article-duplicate-modal').waitFor({state:'detached'});
  const result=await page.evaluate(()=>{
   const copies=state.selected.filter(p=>p.roomId==='guest'&&p.reference!=='MIRROR'&&p.reference!=='LIGHT');
   const qs=quoteRows().filter(row=>row.roomId==='guest');
   const editor=quoteEditorRows().filter(row=>row.roomId==='guest');
   buildDocument();
   return {copies,selected:state.selected,quote:qs,
    editor:editor.map(row=>state.selected[row.sourceIndex].id),
    dossier:currentDossierPlan.pages.filter(page=>page.group.room.id==='guest').flatMap(p=>p.items.map(item=>item.id)),
    rooms:state.rooms.map(r=>({id:r.id,custom:r.articleOrderCustomized})),
    stored:JSON.parse(localStorage.getItem(stateStorageKey())).selected.map(p=>p.id)};
  });
  assert.equal(result.copies.length,2);
  const mainCopy=result.copies.find(p=>p.reference==='TAP-001');
  const bodyCopy=result.copies.find(p=>p.reference==='BODY-001');
  assert(mainCopy&&bodyCopy,'Missing article or required body copy');
  assert.notEqual(mainCopy.id,'tap');
  assert.equal(bodyCopy.accessoryFor,mainCopy.id);
  assert.equal(mainCopy.quantity,2);assert.equal(mainCopy.quoteUnitOverride,490);
  assert.equal(mainCopy.clientDiscountOverride,10);
  assert.deepEqual(mainCopy.configuration,{finish:'BS',options:['A']});
  assert.deepEqual(result.quote.map(row=>row.sourceId),['mirror',mainCopy.id,bodyCopy.id,'light']);
  assert.deepEqual(result.editor,['mirror',mainCopy.id,bodyCopy.id,'light']);
  assert(result.dossier.includes(mainCopy.id)&&!result.dossier.includes(bodyCopy.id));
  assert.equal(result.quote[1].unit,490);assert.equal(result.quote[1].qty,2);
  assert.equal(result.quote[1].discount,10);
  assert.equal(result.rooms[1].custom,true);
  assert(result.stored.includes(mainCopy.id));
  assert.equal(JSON.parse(original).length,5,'Original snapshot must not change');
  // Independent quote editing and second duplication at the very beginning.
  await page.evaluate(id=>{
   const copy=state.selected.find(p=>p.id===id);
   copy.configuration.finish='CH';copy.quoteUnitOverride=700;copy.quantity=3;
   saveState();renderRooms();renderMarginDashboard();
  },mainCopy.id);
  assert.equal(await page.evaluate(()=>state.selected.find(p=>p.id==='tap').quoteUnitOverride),490);
  await page.locator('.duplicate-article[data-id="'+mainCopy.id+'"]').click();
  await page.locator('.article-duplicate-room').selectOption('main');
  await page.locator('.article-duplicate-position').selectOption('begin');
  await page.locator('.article-duplicate-confirm').click();
  await page.locator('dialog.article-duplicate-modal').waitFor({state:'detached'});
  const second=await page.evaluate(()=>{
   const a=state.selected.filter(p=>p.roomId==='main').map(p=>p.id);
   const q=quoteRows().filter(p=>p.roomId==='main').map(p=>p.sourceId);
   return {a,q,allIds:state.selected.map(p=>p.id),source:state.selected.find(p=>p.id==='tap')};
  });
  assert.equal(second.a.length,5);
  assert.deepEqual(second.q,second.a,'Devis must preserve the custom first position');
  assert.notEqual(second.a[0],mainCopy.id);
  assert.equal(new Set(second.allIds).size,second.allIds.length);
  assert.equal(second.source.configuration.finish,'BS','Nested configuration must remain independent');
  const persisted=await page.evaluate(async()=>{
    await saveCloudProject();
    return {id:cloud.currentProjectId,records:JSON.stringify(state.selected)};
  });
  assert(persisted.id,'Project save failed');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof cloud!=='undefined'&&!!cloud.user&&typeof catalogIndex!=='undefined'&&catalogIndex.maker('Hotbath').length>=2554);
  const restored=await page.evaluate(async id=>{
   await openCloudProject(id);
   return JSON.stringify(state.selected);
  },persisted.id);
  const savedRecords=JSON.parse(persisted.records),reloadedRecords=JSON.parse(restored);
  assert.deepEqual(reloadedRecords.map(p=>p.id),savedRecords.map(p=>p.id),'Persisted article sequence and IDs');
  const businessFields=['roomId','accessoryFor','reference','designation','configuration','quantity',
    'quoteUnitOverride','quoteDiscountOverride','clientDiscountOverride','price','totalPrice','finish',
    'hideFromDossier','requiredRoughIn'];
  for(let i=0;i<savedRecords.length;i++){
   for(const key of businessFields){
    if(!Object.hasOwn(savedRecords[i],key))continue;
    assert.deepEqual(reloadedRecords[i][key],savedRecords[i][key],
     'Saved article '+savedRecords[i].id+' must preserve '+key);
   }
  }
  assert.deepEqual(errors,[],'Browser page errors');
  console.log('Article duplication browser OK: cross-room/precise position, quote, linked rough-in, pricing, independence, dossier and cloud persistence');
 }catch(e){
  console.error(e.stack||e,logs.slice(-3000));process.exitCode=1;
 }finally{
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');await pause(150);fs.rmSync(dir,{recursive:true,force:true});
 }
})();
