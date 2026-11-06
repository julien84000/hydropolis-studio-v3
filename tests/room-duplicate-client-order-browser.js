'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10076,base='http://127.0.0.1:'+port;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-room-duplicate-'));
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
   state.project.name='Duplication et nomenclature';
   state.rooms=[{id:'r1',title:'MASTER / VERSION 1',subtitle:'Espace lavabo',manual:[]},
    {id:'r2',title:'MASTER / VERSION 1',subtitle:'Espace douche',manual:[]},
    {id:'r3',title:'Invités',subtitle:'',manual:[]}];
   state.selected=['Armoire de toilette','Mitigeur lavabo','Meuble suspendu','Siphon','Vasque','Applique','Porte-serviette','Douche'].map((designation,i)=>({
    id:'p'+i,roomId:i===7?'r2':'r1',designation,manufacturer:'Test',reference:'REF'+i,category:i===0?'WC':'Autres',
    price:100+i,totalPrice:100+i,quantity:2,hideFromDossier:i===3,accessoryFor:i===3?'p1':'',
    image:'',images:[],finish:'Inox brossé',testConfig:{finish:'BS'}
   }));
   state.presentationLayout={blocks:{},pageSize:3,assignments:{p0:'r1:WC:0'},pageTexts:{'r1:WC:0':{title:'Espace toilette'}}};
   saveState();showView('project');renderRooms();
  });
  const initial=await page.evaluate(()=>JSON.stringify({rooms:state.rooms,selected:state.selected}));
  // Cancellation never changes the project.
  page.once('dialog',d=>d.dismiss());
  await page.locator('.duplicate-room[data-id="r1"]').click();
  assert.equal(await page.evaluate(()=>JSON.stringify({rooms:state.rooms,selected:state.selected})),initial);
  page.once('dialog',d=>d.accept('MASTER / VERSION 2'));
  await page.locator('.duplicate-room[data-id="r1"]').click();
  const copied=await page.evaluate(()=>({rooms:state.rooms,selected:state.selected}));
  assert.equal(copied.rooms.length,5);assert.equal(copied.selected.length,16);
  assert.deepEqual(copied.rooms.map(r=>r.subtitle),['Espace lavabo','Espace douche','Espace lavabo','Espace douche','']);
  const newProducts=copied.selected.slice(8);
  assert.equal(newProducts[3].accessoryFor,newProducts[1].id);
  assert.equal(newProducts[3].hideFromDossier,true);
  assert.equal(newProducts[0].quantity,2);
  assert.equal(new Set(copied.selected.map(p=>p.id)).size,16);
  // Quote/editor and dossier follow the project before any manual drag.
  const result=await page.evaluate(()=>{
   showView('preview');buildDocument();
   return {quote:quoteRows().filter(p=>p.roomId==='r1').map(p=>p.sourceId),
    editor:quoteEditorRows().filter(p=>p.roomId==='r1').map(p=>state.selected[p.sourceIndex].id),
    labels:quoteRows().filter(p=>p.roomId==='r1').map(p=>p.spaceLabel),
    pages:currentDossierPlan.pages.map(p=>({room:p.group.room.id,label:p.group.label,ids:p.items.map(x=>x.id)})),
    headings:[...document.querySelectorAll('.visual-board-page .board-head h2')].map(e=>e.textContent),
    quoteGroups:[...document.querySelectorAll('.quote-space-row')].map(e=>e.textContent)};
  });
  assert.deepEqual(result.quote,['p0','p1','p2','p3','p4','p5','p6']);
  assert.deepEqual(result.editor,result.quote);
  assert(result.labels.every(s=>s==='Espace lavabo'));
  const pages=result.pages.filter(p=>p.room==='r1');assert.deepEqual(pages.map(p=>p.ids.length),[3,3]);
  assert.deepEqual(pages.flatMap(p=>p.ids),['p0','p1','p2','p4','p5','p6']);
  assert(pages.every(p=>p.label==='Espace lavabo'));
  assert(result.headings.every(s=>['Espace lavabo','Espace douche'].includes(s)));
  assert(!result.quoteGroups.some(s=>s.includes('toilette')||s.includes('Accessoires')));
  // Source and copy are independently editable; persistence uses the real local project API.
  const saved=await page.evaluate(async()=>{
   const copy=state.selected[8];copy.quantity=5;copy.testConfig.finish='CH';
   if(state.selected[0].quantity!==2||state.selected[0].testConfig.finish!=='BS')throw Error('Shared copy state');
   saveState();await saveCloudProject();
   return {id:cloud.currentProjectId,data:JSON.stringify({rooms:state.rooms,selected:state.selected})};
  });
  assert(saved.id);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof cloud!=='undefined'&&!!cloud.user&&typeof catalogIndex!=='undefined'&&catalogIndex.maker('Hotbath').length>=2554);
  const reopened=await page.evaluate(async id=>{await openCloudProject(id);return JSON.stringify({rooms:state.rooms,selected:state.selected})},saved.id);
  const expected=JSON.parse(saved.data),actual=JSON.parse(reopened);
  assert.deepEqual(actual.rooms,expected.rooms);
  assert.equal(actual.selected.length,expected.selected.length);
  expected.selected.forEach((record,i)=>Object.entries(record).forEach(([key,value])=>assert.deepEqual(actual.selected[i][key],value,'Persisted '+record.id+' '+key)));
  assert.deepEqual(errors,[]);
  console.log('Room duplication browser OK: cancel, all sub-spaces, independent data, links, visibility, exact quote/dossier names and order, pagination, save/reopen');
 }catch(e){console.error(e.stack||e,logs.slice(-2500));process.exitCode=1}
 finally{if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');await pause(150);fs.rmSync(dir,{force:true,recursive:true})}
})();
