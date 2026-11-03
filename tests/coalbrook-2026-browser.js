'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10043,base='http://127.0.0.1:'+port;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-coalbrook-'));
 const server=spawn(process.execPath,['server.js'],{cwd,env:{...process.env,PORT:String(port),HYDRO_DATA_DIR:data,DATABASE_URL:''},stdio:['ignore','pipe','pipe']});
 let logs='',browser;
 server.stderr.on('data',b=>logs+=String(b));
 server.stdout.on('data',b=>logs+=String(b));
 try{
  let ready=false;
  for(let i=0;i<100;i++){try{const r=await fetch(base+'/api/auth/status');if(r.ok){ready=true;break}}catch(_){}await wait(100)}
  assert.ok(ready,'Test server did not start: '+logs.slice(-1200));
  const setup=await fetch(base+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Coalbrook Test',username:'coalbrook-test',password:'coalbrook-test-password'})});
  const auth=await setup.json();assert.ok(auth.token,'Auth: '+JSON.stringify(auth));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:950},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.HydroCoalbrookConfigurator&&!!window.HydroCoalbrook2026,{timeout:60000});
  const rows=JSON.parse(fs.readFileSync(path.join(cwd,'public/catalog_coalbrook.json'),'utf8'));
  for(const reference of ['DO1000CP','DO1007CP']){
   await page.evaluate(({rows,reference})=>{
    window.__coalbrookAdded=null;
    window.HydroCoalbrookConfigurator.open(rows,'test-room',(main,rough,room)=>{
     window.__coalbrookAdded={main:main.reference,rough:rough?.reference||null,room,mainHT:Number(main.price),roughHT:rough?Number(rough.price):0};
    },{reference});
   },{rows,reference});
   await page.locator('#coalbrookConfig').waitFor();
   assert.equal(await page.locator('.coalbrook-reference').innerText(),reference);
   assert.match(await page.locator('.coalbrook-amount').innerText(),/HT/);
   assert.equal(await page.locator('#coalbrookConfig select[aria-label="05 · Finition"]').inputValue(),reference);
   if(reference==='DO1007CP'){
    await page.locator('.coalbrook-rough').waitFor();
    assert.match(await page.locator('.coalbrook-rough').innerText(),/CO1201/);
    assert.match(await page.locator('.coalbrook-rough').innerText(),/355,22/);
   }
   await page.locator('.coalbrook-add').click();
   const added=await page.evaluate(()=>window.__coalbrookAdded);
   assert.equal(added.main,reference);
   assert.equal(added.room,'test-room');
   if(reference==='DO1007CP'){
    assert.equal(added.rough,'CO1201');
    assert.equal(Number((added.mainHT+added.roughHT).toFixed(2)),355.22);
   }else assert.equal(added.rough,null);
   assert.equal(await page.locator('#coalbrookConfig').count(),0);
  }
  // Official finish-specific images must not be presented as generic substitutions.
  const withPhoto=rows.find(p=>p.image&&p.imageFinishMatch==='exact'&&p.technicalSheetUrl);
  assert.ok(withPhoto,'Missing verified Coalbrook SKU with photo and PDF');
  await page.evaluate(({rows,reference})=>{
   window.HydroCoalbrookConfigurator.open(rows,'test-room',()=>{},{reference});
  },{rows,reference:withPhoto.reference});
  assert.equal(await page.locator('.coalbrook-reference').innerText(),withPhoto.reference);
  const src=await page.locator('.coalbrook-product-media img').getAttribute('src');
  assert.equal(src,withPhoto.image,'Exact SKU must use its verified photo');
  assert.match(await page.locator('.coalbrook-media-source').innerText(),/finition/);
  const doc=page.locator('a.coalbrook-doc-link').first();
  assert.equal(await doc.getAttribute('href'),withPhoto.technicalSheetUrl);
  // Real application path: selection must become TWO linked quote records.
  await page.waitForFunction(()=>typeof catalogIndex!=='undefined'&&
    catalogIndex.maker('Coalbrook').some(p=>p.reference==='DO1007CP')&&
    !!state.rooms?.[0]?.id,{timeout:60000});
  await page.evaluate(()=>{
    document.querySelector('#manufacturerFilter').value='Coalbrook';
    document.querySelector('#manufacturerFilter').dispatchEvent(new Event('change'));
    document.querySelector('#coalbrookLaunch').click();
  });
  await page.locator('#coalbrookConfig').waitFor();
  await page.locator('select[aria-label="01 · Catégorie"]').selectOption('Robinetterie');
  await page.locator('select[aria-label="02 · Collection"]').selectOption('Domo');
  await page.locator('select[aria-label="03 · Sous-catégorie"]').selectOption('Lavabo');
  await page.locator('select[aria-label="04 · Article"]').selectOption('DO1007');
  await page.locator('select[aria-label="05 · Finition"]').selectOption('DO1007CP');
  const countBefore=await page.evaluate(()=>state.selected.length);
  await page.locator('.coalbrook-add').click();
  const actual=await page.evaluate(()=>state.selected.slice(-2).map(p=>({
    ref:p.reference,id:p.id,accessoryFor:p.accessoryFor||null,
    price:Number(p.price),totalPrice:Number(p.totalPrice||0),vat:p.vat
  })));
  assert.equal(await page.evaluate(()=>state.selected.length),countBefore+2);
  assert.deepEqual(actual.map(x=>x.ref),['DO1007CP','CO1201']);
  assert.equal(actual[1].accessoryFor,actual[0].id);
  assert.equal(Number((actual[0].price+actual[1].price).toFixed(2)),355.22);
  assert.notEqual(actual[0].id,actual[1].id);
  // Isolated temporary test database: persist the two real project lines, reload and verify no duplicate body.
  const saved=await page.evaluate(async()=>{
    state.project.name='COALBROOK E2E ISOLATED';
    await saveCloudProject();
    return {id:cloud.currentProjectId,number:state.selected.length};
  });
  assert.ok(saved.id,'Project was not persisted');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof cloud!=='undefined'&&typeof openCloudProject==='function'&&!!state.rooms?.length,{timeout:60000});
  await page.evaluate(async id=>{
    if(cloud.currentProjectId!==id){await loadCloudProjects();await openCloudProject(id)}
  },saved.id);
  const persisted=await page.evaluate(()=>({
    id:cloud.currentProjectId,
    rows:state.selected.filter(p=>['DO1007CP','CO1201'].includes(p.reference))
      .map(p=>({ref:p.reference,id:p.id,accessoryFor:p.accessoryFor||null,price:Number(p.price),vat:p.vat}))
  }));
  assert.equal(persisted.id,saved.id,'Project did not reopen');
  assert.equal(persisted.rows.length,2,'Duplicate or missing linked Coalbrook project records');
  const parent=persisted.rows.find(p=>p.ref==='DO1007CP'),child=persisted.rows.find(p=>p.ref==='CO1201');
  assert.equal(child.accessoryFor,parent.id);
  assert.equal(Number((parent.price+child.price).toFixed(2)),355.22);
  assert.equal(parent.vat,'HT');

  // A generic V11 cached image must be shown first but upgraded when an exact SKU becomes available.
  const missingExact=rows.find(p=>p.manufacturer==='Coalbrook'&&!p.image&&p.designation&&!p.internalReference);
  assert.ok(missingExact,'Missing a non-illustrated SKU for the cache upgrade test');
  const upgraded=await page.evaluate(async ({rows,reference})=>{
    const originalCache=window.cachedManufacturerImage,originalFetcher=window.fetchManufacturerImage;
    const generic='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><rect width="12" height="12" fill="gray"/></svg>');
    const exact='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><rect width="12" height="12" fill="green"/></svg>');
    let called=false;
    window.cachedManufacturerImage=()=>({src:generic,finishMatch:'collection-only'});
    window.fetchManufacturerImage=()=>{called=true;return Promise.resolve({src:exact,finishMatch:'exact'})};
    window.HydroCoalbrookConfigurator.open(rows,'test-room',()=>{},{reference});
    for(let i=0;i<100;i++){
      if(document.querySelector('.coalbrook-product-media img')?.src===exact)break;
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    const image=document.querySelector('.coalbrook-product-media img');
    const label=document.querySelector('.coalbrook-media-source');
    const result={called,src:image?.src||'',label:label?.textContent||'',exact};
    window.cachedManufacturerImage=originalCache;
    window.fetchManufacturerImage=originalFetcher;
    return result;
  },{rows,reference:missingExact.reference});
  assert.ok(upgraded.called,'A generic cached photo failed to trigger relookup');
  assert.equal(upgraded.src,upgraded.exact,'Exact image did not replace uncertain cached visual');
  assert.match(upgraded.label,/finition exacte/);


  
  // Regression: real brand rail selection never emits select.change, but the
  // dedicated Coalbrook CTA must become visible after catalogue rendering.
  await page.evaluate(()=>{
    document.querySelector('#coalbrookConfig .coalbrook-close')?.click();
    showView('catalog');
    const mf=document.querySelector('#manufacturerFilter');
    mf.value='';
    mf.dispatchEvent(new Event('change'));
  });
  await page.locator('#brandRail [data-maker="Coalbrook"]').waitFor();
  await page.locator('#brandRail [data-maker="Coalbrook"]').click();
  await page.locator('#coalbrookLaunch').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#manufacturerFilter').inputValue(),'Coalbrook');
  const explorer=page.locator('#results .coalbrook-explorer-launcher');
  await explorer.waitFor({state:'visible'});
  assert.match(await explorer.locator('h3').innerText(),/Explorer les collections Coalbrook/);
  await explorer.locator('button.coalbrook-explorer-open').click();
  await page.locator('#coalbrookConfig').waitFor();
  assert.match(await page.locator('#coalbrookConfig h2').innerText(),/Coalbrook/);
  // The collection explorer must expose genuine selectable model-photo cards.
  const tiles=page.locator('#coalbrookConfig .coalbrook-model-tile');
  assert.ok(await tiles.count()>0,'Coalbrook model gallery must be present');
  assert.ok(await tiles.first().locator('.coalbrook-model-tile-photo').count()===1);
  await page.locator('#coalbrookConfig select[aria-label="01 · Catégorie"]').selectOption('Robinetterie');
  await page.locator('#coalbrookConfig select[aria-label="02 · Collection"]').selectOption('Domo');
  await page.locator('#coalbrookConfig select[aria-label="03 · Sous-catégorie"]').selectOption('Lavabo');
  const selectedModel=await page.locator('#coalbrookConfig .coalbrook-model-tile').first().getAttribute('data-model');
  await page.locator('#coalbrookConfig .coalbrook-model-tile').first().click();
  assert.equal(await page.locator('#coalbrookConfig select[aria-label="04 · Article"]').inputValue(),selectedModel);
  await page.locator('#coalbrookConfig .coalbrook-close').click();
  // Product cards must route to the modal rather than silently inserting a
  // raw item lacking its required CO1201 rough-in.
  const countBeforeCard=await page.evaluate(()=>state.selected.length);
  await page.evaluate(()=>{
    const item=CATALOG.find(p=>p.manufacturer==='Coalbrook'&&p.reference==='DO1007CP');
    if(!item)throw Error('DO1007CP not loaded');
    addCatalogProduct(item.reference,state.rooms[0].id,productKey(item));
  });
  await page.locator('#coalbrookConfig').waitFor();
  assert.equal(await page.locator('.coalbrook-reference').innerText(),'DO1007CP');
  assert.equal(await page.evaluate(()=>state.selected.length),countBeforeCard,'Card incorrectly bypassed Coalbrook configurator');
  await page.locator('#coalbrookConfig .coalbrook-add').click();
  const cardSelection=await page.evaluate(()=>state.selected.slice(-2).map(p=>({reference:p.reference,id:p.id,accessoryFor:p.accessoryFor||null})));
  assert.deepEqual(cardSelection.map(p=>p.reference),['DO1007CP','CO1201']);
  assert.equal(cardSelection[1].accessoryFor,cardSelection[0].id);

  // The 785 real August 2026 brochure photos are now shipped with the app:
  // no user-supplied ZIP or manual action is necessary.
  const photoCount=await page.evaluate(()=>window.HydroCoalbrookPdfPhotos.ensureBundled());
  assert.equal(photoCount,785,'Deployed PDF photo archive incomplete');
  const maestroPhoto=await page.evaluate(()=>window.HydroCoalbrookPdfPhotos.get('ZU3052BN'));
  assert.ok(maestroPhoto?.src?.startsWith('blob:'),'Missing exact Maestro ZU3052BN PDF photograph');
  assert.equal(maestroPhoto.finishMatch,'exact');
  const maestroExpected=await page.evaluate(()=>{
    const c=window.HydroCoalbrookConfigurator;
    return ['ZU3052BN','DO3050GM','DC3051CP','BA3053BB','DO3061CP','ZU3062BN','CO3065CP','ZU3005BN']
     .map(reference=>({reference,rough:c.mandatoryRoughReference({reference,internalReference:''})}));
  });
  assert.deepEqual(maestroExpected.map(x=>x.rough),['CO3052','CO3050','CO3051','CO3053','CO3061','CO3062','CO3064','']);
  const maestroRows=rows.filter(p=>['ZU3052BN','CO3052'].includes(p.reference));
  assert.equal(maestroRows.length,2,'Maestro trim or required rough-in absent from source catalogue');
  await page.evaluate(rows=>{
    window.__maestroSelection=null;
    window.HydroCoalbrookConfigurator.open(rows,'maestro-room',(main,rough)=>{
      window.__maestroSelection={reference:main.reference,price:Number(main.price),rough:rough?.reference,roughPrice:Number(rough?.price)};
    },{reference:'ZU3052BN'});
  },rows);
  await page.locator('#coalbrookConfig .coalbrook-rough').waitFor();
  assert.match(await page.locator('#coalbrookConfig .coalbrook-rough').innerText(),/CO3052/);
  assert.match(await page.locator('#coalbrookConfig .coalbrook-rough').innerText(),/725,00/);
  await page.waitForFunction(()=>{
    const el=document.querySelector('#coalbrookConfig .coalbrook-product-media .coalbrook-media-source');
    return !!el&&/tarif Coalbrook 2026/.test(el.textContent);
  },{timeout:30000});
  await page.locator('#coalbrookConfig .coalbrook-add').click();
  const maestroAdded=await page.evaluate(()=>window.__maestroSelection);
  assert.deepEqual(maestroAdded,{reference:'ZU3052BN',price:775,rough:'CO3052',roughPrice:950});

  // Browser-local archive ingestion: one exact manufacturer photo must survive
  // a reload in the isolated test profile (no server or project data changed).
  const rawJpeg=Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAgEAACAQMDBQAAAAAAAAAAAAABAgMABBEFIRIxQWGR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAwT/xAAaEQACAgMAAAAAAAAAAAAAAAAAAQIDEiEx/9oADAMBAAIRAxEAPwBbQpp6kZZsQCiGz4CqqkebnU5dJbrEwFw4TjmgUJ6r1kyZcMBK5RNDExJgoBgAadQ4P12SDOf0hrVrc7rh93drQRuLjXv//Z','base64');
  const imageName=Buffer.from('photos/DO1007CP.jpg','utf8');
  const header=Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);
  header.writeUInt16LE(0,6);header.writeUInt16LE(0,8);
  header.writeUInt32LE(rawJpeg.length,18);header.writeUInt32LE(rawJpeg.length,22);
  header.writeUInt16LE(imageName.length,26);
  const zip=Buffer.concat([header,imageName,rawJpeg]).toString('base64');
  const imported=await page.evaluate(async base64=>{
    const data=Uint8Array.from(atob(base64),x=>x.charCodeAt(0));
    const count=await window.HydroCoalbrookPdfPhotos.importZip(new File([data],'coalbrook-pdf-photos.zip',{type:'application/zip'}));
    const photo=await window.HydroCoalbrookPdfPhotos.get('DO1007CP');
    return {count,src:photo?.src,finishMatch:photo?.finishMatch};
  },zip);
  assert.equal(imported.count,1);
  assert.ok(imported.src.startsWith('blob:'),'Image ZIP not loaded into browser');
  assert.equal(imported.finishMatch,'exact');

  assert.deepEqual(errors.filter(x=>/coalbrook/i.test(x)),[]);
  console.log('Coalbrook Chromium E2E OK: model, finish, HT prices, linked rough-in, exact photo, official PDF');
 }catch(e){console.error(e.stack||e,logs.slice(-1800));process.exitCode=1}
 finally{if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');await wait(150);fs.rmSync(data,{recursive:true,force:true})}
})();