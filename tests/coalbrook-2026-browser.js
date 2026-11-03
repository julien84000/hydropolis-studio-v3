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
  assert.deepEqual(errors.filter(x=>/coalbrook/i.test(x)),[]);
  console.log('Coalbrook Chromium E2E OK: model, finish, HT prices, linked rough-in, exact photo, official PDF');
 }catch(e){console.error(e.stack||e,logs.slice(-1800));process.exitCode=1}
 finally{if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');await wait(150);fs.rmSync(data,{recursive:true,force:true})}
})();