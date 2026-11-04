'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10075,base='http://127.0.0.1:'+port;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-room-drag-'));
 const server=spawn(process.execPath,['server.js'],{cwd,env:{...process.env,PORT:String(port),DATABASE_URL:'',HYDRO_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
 let browser,logs='';
 server.stdout.on('data',v=>logs+=String(v));server.stderr.on('data',v=>logs+=String(v));
 try{
  let ready=false;
  for(let i=0;i<120;i++){try{if((await fetch(base+'/api/auth/status')).ok){ready=true;break}}catch{}await pause(100)}
  assert(ready,'Server unavailable '+logs.slice(-750));
  const setup=await fetch(base+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:'Room Order Test',username:'room-order-test',password:'room-order-test-long-password'})});
  const auth=await setup.json();assert(auth.token,'Missing isolated auth token');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:950},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{if(message.type()==='error'||message.text().includes('[project article sorting]'))console.log('Browser:',message.text())});
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof state!=='undefined'&&!!window.HydroRoomArticleDnD&&typeof window.HydroRoomArticleDnD.mount==='function'&&
   typeof catalogIndex!=='undefined'&&catalogIndex.maker('Hotbath').length>=2554,null,{timeout:60000});
  await page.evaluate(()=>{
   state.project.name='PROJET TRI DES PIECES';
   state.rooms=[{id:'r1',title:'Salle de bains principale',subtitle:'',manual:[]},
                {id:'r2',title:'Salle de bains invités',subtitle:'',manual:[]}];
   const picked=catalogIndex.maker('Hotbath').filter(p=>p.reference&&Number(p.price||p.totalPrice)>0).slice(0,4);
   if(picked.length!==4)throw Error('No supplier records for ordering test');
   state.selected=picked.map((p,index)=>{
    const item=createSelectedProductRecord(p,index<3?'r1':'r2');
    if(!item)throw Error('Cannot create article');
    item.id=['alpha','beta','gamma','delta'][index];
    item.image='';item.images=[];item.pdfImage='';item.hideFromDossier=false;
    return item;
   });
   saveState();showView('project');renderRooms();
  });
  const zone1=page.locator('#roomsEditor .room-products[data-room-id="r1"]');
  const zone2=page.locator('#roomsEditor .room-products[data-room-id="r2"]');
  await zone1.locator(':scope > .room-product').first().waitFor({timeout:15000});
  assert.equal(await zone1.locator(':scope > .room-product[data-product-id]').count(),3);
  assert.equal(await zone2.locator(':scope > .room-product[data-product-id]').count(),1);
  assert.equal(await page.locator('#roomsEditor .article-drag-handle').count(),4);
  // dragTo auto-scrolls source and target separately to the same viewport Y.
  // In this long form its old path was only 2 px: no dragstart / drag threshold.
  // Start an actual gesture before scrolling to an off-screen destination.
  const mouseDrag=async(source,target,{bottom=false}={})=>{
   await page.evaluate(()=>{
    if(window.pointerTrace)return;
    window.pointerTrace=[];
    for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>{
     window.pointerTrace.push({type,id:e.target.closest?.('[data-product-id]')?.dataset.productId,target:e.target.className,x:e.clientX,y:e.clientY,primary:e.isPrimary,button:e.button,dragging:document.body.classList.contains('room-article-dragging')});
     if(window.pointerTrace.length>30)window.pointerTrace.shift();
    });
   });
   await source.scrollIntoViewIfNeeded();
   const start=await source.boundingBox();assert(start,'Source grip visible');
   await page.mouse.move(start.x+12,start.y+12);await page.mouse.down();
   await page.mouse.move(start.x+28,start.y+26,{steps:5});
   const dragging=await page.locator('body.room-article-dragging').count();
   if(!dragging)console.log('Pointer failure',JSON.stringify({start,errors,trace:await page.evaluate(()=>window.pointerTrace),handle:await source.evaluate(e=>({connected:e.isConnected,draggable:e.draggable,hit:document.elementFromPoint(e.getBoundingClientRect().x+12,e.getBoundingClientRect().y+12)?.outerHTML}))}));
   assert.equal(dragging,1,'Mouse drag must start');
   await target.scrollIntoViewIfNeeded();
   const end=await target.boundingBox();assert(end,'Drop destination visible');
   await page.mouse.move(end.x+12,end.y+(bottom?end.height-8:3),{steps:12});
   await page.mouse.up();
  };
  await mouseDrag(zone1.locator('[data-product-id="gamma"] .article-drag-handle'),zone1.locator('[data-product-id="alpha"]'));
  await page.waitForFunction(()=>state.rooms[0].articleOrderCustomized===true&&
    state.selected.filter(p=>p.roomId==='r1')[0]?.id==='gamma',null,{timeout:15000});
  const within=await page.evaluate(()=>{
   buildDocument();
   const roomId='r1';
   return {
    project:state.selected.filter(p=>p.roomId===roomId).map(p=>p.id),
    quote:quoteRows().filter(row=>row.roomId===roomId).map(row=>row.sourceId),
    dossier:currentDossierPlan.pages.filter(p=>p.group.room.id===roomId).flatMap(p=>p.items.map(item=>item.id)),
    synced:state.rooms.find(r=>r.id===roomId)?.articleOrderCustomized,
    stored:JSON.parse(localStorage.getItem(stateStorageKey())).selected.filter(p=>p.roomId===roomId).map(p=>p.id)
   };
  });
  assert.deepEqual(within.project,['gamma','alpha','beta']);
  assert.deepEqual(within.quote,within.project,'Quotation must match project order');
  assert.deepEqual(within.dossier,within.project,'Client dossier must match project order');
  assert.deepEqual(within.stored,within.project,'Room order must persist in local project');
  assert.equal(within.synced,true);
  await mouseDrag(zone1.locator('[data-product-id="alpha"] .article-drag-handle'),zone2.locator('[data-product-id="delta"]'),{bottom:true});
  await page.waitForFunction(()=>state.selected.find(p=>p.id==='alpha')?.roomId==='r2',null,{timeout:15000});
  const after=await page.evaluate(()=>{
   buildDocument();
   const rooms=Object.fromEntries(state.rooms.map(room=>[room.id,{
    project:state.selected.filter(p=>p.roomId===room.id).map(p=>p.id),
    quote:quoteRows().filter(row=>row.roomId===room.id).map(row=>row.sourceId),
    dossier:currentDossierPlan.pages.filter(page=>page.group.room.id===room.id).flatMap(page=>page.items.map(p=>p.id)),
    customized:room.articleOrderCustomized
   }]));
   const stored=JSON.parse(localStorage.getItem(stateStorageKey()));
   return {rooms,stored:stored.selected.map(p=>({id:p.id,roomId:p.roomId})),docMarkup:document.querySelector('#document')?.innerHTML?.length||0};
  });
  assert.deepEqual(after.rooms.r1.project,['gamma','beta']);
  assert.deepEqual(after.rooms.r1.quote,after.rooms.r1.project);
  assert.deepEqual(after.rooms.r1.dossier,after.rooms.r1.project);
  assert.equal(after.rooms.r2.project.length,2);
  assert.deepEqual(after.rooms.r2.quote,after.rooms.r2.project);
  assert.deepEqual(after.rooms.r2.dossier,after.rooms.r2.project);
  assert.equal(after.rooms.r1.customized,true);
  assert.equal(after.rooms.r2.customized,true);
  assert(after.stored.some(p=>p.id==='alpha'&&p.roomId==='r2'));
  assert(after.docMarkup>1000,'Client dossier missing after drop');
  // Moving down, keyboard alternative, and linked components into an empty room.
  await mouseDrag(zone1.locator('[data-product-id="gamma"] .article-drag-handle'),zone1.locator('[data-product-id="beta"]'),{bottom:true});
  assert.deepEqual(await page.evaluate(()=>state.selected.filter(p=>p.roomId==='r1').map(p=>p.id)),['beta','gamma']);
  await page.evaluate(()=>{
   state.rooms.push({id:'r3',title:'Pièce vide',subtitle:'',manual:[]});
   const parent=state.selected.find(p=>p.id==='gamma');
   state.selected.push({...parent,id:'gamma-body',reference:'LINKED-BODY',accessoryFor:'gamma',requiredRoughIn:true},
    {...parent,id:'gamma-hidden',reference:'LINKED-HIDDEN',accessoryFor:'gamma-body',sbordoniConfigurationAccessory:true});
   // An old dossier arrangement must not override the next room move.
   state.presentationLayout={pageSize:5,blocks:{'r1:SELECTION:0:gamma':{x:20,y:30,w:40,h:50}},
    assignments:{gamma:'r1:SELECTION:3'},orders:{'r1:SELECTION:0':['gamma','beta']}};
   saveState();renderRooms();
   window.beforeMove=JSON.parse(JSON.stringify(state.selected));
  });
  const zone3=page.locator('#roomsEditor .room-products[data-room-id="r3"]');
  await mouseDrag(zone1.locator('[data-product-id="gamma"] .article-drag-handle'),zone3);
  await page.waitForFunction(()=>state.selected.find(p=>p.id==='gamma')?.roomId==='r3');
  const linked=await page.evaluate(()=>{
   buildDocument();
   return {before:window.beforeMove,after:state.selected,layout:state.presentationLayout,
    quote:quoteRows().filter(r=>r.roomId==='r3').map(r=>r.sourceId),
    dossier:currentDossierPlan.pages.filter(p=>p.group.room.id==='r3').flatMap(p=>p.items.map(i=>i.id))};
  });
  const group=['gamma','gamma-body','gamma-hidden'];
  assert.deepEqual(linked.after.filter(p=>p.roomId==='r3').map(p=>p.id),group);
  for(const original of linked.before){
   const moved=linked.after.find(p=>p.id===original.id);
   assert.deepEqual({...moved,roomId:original.roomId},original,'Every article field must survive a move');
  }
  assert(!linked.layout.assignments.gamma,'Obsolete dossier page assignment cleared');
  assert(!linked.layout.orders['r1:SELECTION:0'],'Obsolete dossier order cleared');
  assert(linked.quote.includes('gamma')&&linked.quote.includes('gamma-body'),'Linked body in destination quotation');
  assert(linked.dossier.includes('gamma'),'Principal in destination dossier');

  // A cancelled drag and ordinary editor clicks must not commit any reordering.
  const grip=zone3.locator('[data-product-id="gamma"] .article-drag-handle');
  await grip.scrollIntoViewIfNeeded();
  const gripBox=await grip.boundingBox();
  await page.mouse.move(gripBox.x+10,gripBox.y+10);await page.mouse.down();
  await page.mouse.move(gripBox.x+30,gripBox.y+40,{steps:4});
  await page.keyboard.press('Escape');await page.mouse.up();
  assert.deepEqual(await page.evaluate(()=>state.selected.map(p=>[p.id,p.roomId])),linked.after.map(p=>[p.id,p.roomId]));
  await zone3.locator('[data-product-id="gamma"] .article-editor summary').click();
  assert.equal(await zone3.locator('[data-product-id="gamma"] .article-editor').getAttribute('open'),'');
  assert.equal(await page.locator('.article-drag-badge').count(),0);

  // Real Chromium touch input at phone width, without Sortable or synthetic DOM events.
  await page.setViewportSize({width:390,height:844});
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const touchDrag=async(source,target)=>{
   await source.scrollIntoViewIfNeeded();
   const box=await source.boundingBox(),start={x:box.x+12,y:box.y+12};
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x,y:start.y+15,id:1}]});
   assert.equal(await page.locator('body.room-article-dragging').count(),1,'Touch drag must start');
   await target.scrollIntoViewIfNeeded();
   const end=await target.boundingBox();
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:end.x+12,y:end.y+3,id:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };
  await page.evaluate(()=>{window.Sortable=undefined});
  await touchDrag(zone2.locator('[data-product-id="alpha"] .article-drag-handle'),zone1.locator('[data-product-id="beta"] .article-drag-handle'));
  assert.deepEqual(await page.evaluate(()=>state.selected.filter(p=>p.roomId==='r1').map(p=>p.id)),['alpha','beta']);
  await touchDrag(zone1.locator('[data-product-id="beta"] .article-drag-handle'),zone1.locator('[data-product-id="alpha"] .article-drag-handle'));
  assert.deepEqual(await page.evaluate(()=>state.selected.filter(p=>p.roomId==='r1').map(p=>p.id)),['beta','alpha']);
  await page.evaluate(()=>{state.rooms.push({id:'r4',title:'Pièce tactile vide',subtitle:'',manual:[]});saveState();renderRooms()});
  await touchDrag(zone1.locator('[data-product-id="alpha"] .article-drag-handle'),page.locator('#roomsEditor .room-products[data-room-id="r4"]'));
  assert.equal(await page.evaluate(()=>state.selected.find(p=>p.id==='alpha').roomId),'r4');
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});

  // More than one page: flattening the recalculated dossier must match the quote.
  await page.evaluate(()=>{
   const model=state.selected.find(p=>p.id==='beta');
   for(let i=0;i<7;i++)state.selected.push({...model,id:'page-'+i});
   saveState();renderRooms();
  });
  await zone1.locator('[data-product-id="page-6"] .article-drag-handle').press('ArrowUp');
  const paginated=await page.evaluate(()=>{
   buildDocument();
   return {project:state.selected.filter(p=>p.roomId==='r1').map(p=>p.id),
    quote:quoteRows().filter(p=>p.roomId==='r1').map(p=>p.sourceId),
    editor:quoteEditorRows().filter(p=>p.roomId==='r1').map(p=>p.sourceId),
    pages:currentDossierPlan.pages.filter(p=>p.group.room.id==='r1').map(p=>p.items.map(i=>i.id))};
  });
  assert.equal(paginated.pages.length,2);
  assert(paginated.pages.every(p=>p.length<=6));
  assert.deepEqual(paginated.quote,paginated.project);
  assert.deepEqual(paginated.editor,paginated.project);
  assert.deepEqual(paginated.pages.flat(),paginated.project);
  // Save and reopen through the real project API using the isolated test account.
  const saved=await page.evaluate(async()=>{await saveCloudProject();return {id:cloud.currentProjectId,order:state.selected.map(p=>[p.id,p.roomId])}});
  assert(saved.id,'Cloud project must exist');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof cloud!=='undefined'&&!!cloud.user&&typeof catalogIndex!=='undefined'&&catalogIndex.maker('Hotbath').length>=2554);
  const reopened=await page.evaluate(async id=>{await openCloudProject(id);return state.selected.map(p=>[p.id,p.roomId])},saved.id);
  assert.deepEqual(reopened,saved.order,'Server reload preserves full article order and room assignments');
  assert.deepEqual(errors.filter(s=>/RoomArticle|reorderSelected|project article sorting/i.test(s)),[]);
  console.log('Room article drag browser OK: mouse, phone touch, keyboard, empty rooms, linked groups, unchanged article fields, cancellation, editing, quote/editor/dossier, pagination and server reload');
 }catch(e){console.error(e.stack||e,logs.slice(-2500));process.exitCode=1}
 finally{if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');await pause(150);fs.rmSync(dir,{force:true,recursive:true})}
})();
