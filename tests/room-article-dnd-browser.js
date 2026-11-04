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
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof state!=='undefined'&&!!window.HydroRoomArticleDnD&&typeof window.HydroRoomArticleDnD.mount==='function'&&
   typeof catalogIndex!=='undefined'&&catalogIndex.maker('Hotbath').length>=2554,{timeout:60000});
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
  await page.evaluate(()=>{
   window.dragEvents=[];
   for(const type of ['pointerdown','pointerup','mousedown','mouseup','dragstart','dragover','drop','dragend'])document.addEventListener(type,e=>window.dragEvents.push({type,target:e.target.className,id:e.target.closest?.('[data-product-id]')?.dataset.productId,x:e.clientX,y:e.clientY}),true);
  });
  await zone1.locator('[data-product-id="gamma"] .article-drag-handle').dragTo(
   zone1.locator('[data-product-id="alpha"] .article-drag-handle'),
   {sourcePosition:{x:12,y:12},targetPosition:{x:10,y:2},steps:24}
  );
  console.log('EVENTS',await page.evaluate(()=>window.dragEvents));
  const observed=await page.evaluate(()=>({
    stateOrder:state.selected.filter(p=>p.roomId==='r1').map(p=>p.id),
    domOrder:[...document.querySelectorAll('#roomsEditor .room-products[data-room-id="r1"] > .room-product[data-product-id]')].map(p=>p.dataset.productId),
    customized:state.rooms[0].articleOrderCustomized,
    sortableAvailable:typeof window.Sortable,
    sortableAttached:typeof window.Sortable?.get==='function'?!!window.Sortable.get(document.querySelector('#roomsEditor .room-products[data-room-id="r1"]')):false,
    globalDnd:!!window.HydroRoomArticleDnD,
    handleDraggable:document.querySelector('#roomsEditor [data-product-id="gamma"] .article-drag-handle')?.draggable,
    dragStatus:document.body.classList.contains('room-article-dragging')
  }));
  console.log('Room reorder drag diagnostic:',JSON.stringify(observed));
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
  await zone1.locator('[data-product-id="alpha"] .article-drag-handle').dragTo(
   zone2.locator('[data-product-id="delta"] .article-drag-handle'),
   {sourcePosition:{x:12,y:12},targetPosition:{x:10,y:20},steps:26}
  );
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
  assert.deepEqual(errors.filter(s=>/RoomArticle|reorderSelected|project article sorting/i.test(s)),[]);
  console.log('Room article drag browser OK: in-room, cross-room, quotation, photo dossier and persisted order');
 }catch(e){console.error(e.stack||e,logs.slice(-2500));process.exitCode=1}
 finally{if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');await pause(150);fs.rmSync(dir,{force:true,recursive:true})}
})();
