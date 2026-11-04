'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10062,base='http://127.0.0.1:'+port;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YVXaT0AAAAASUVORK5CYII=','base64');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-hotbath-curated-'));
 const server=spawn(process.execPath,['server.js'],{cwd,env:{...process.env,PORT:String(port),DATABASE_URL:'',HYDRO_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
 let browser,logs='';
 server.stdout.on('data',v=>logs+=String(v));server.stderr.on('data',v=>logs+=String(v));
 try{
  let ready=false;
  for(let k=0;k<120;k++){try{if((await fetch(base+'/api/auth/status')).ok){ready=true;break}}catch{}await wait(100)}
  assert(ready,'Hotbath test server failed '+logs.slice(-700));
  const setup=await fetch(base+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:'Hotbath Curated Test',username:'hotbath-curated',password:'hotbath-curated-long-password'})});
  const auth=await setup.json();assert(auth.token,'Missing isolated auth token');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1540,height:980},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/https:\/\/hotbath\.com\/images\/compano\//,route=>route.fulfill({status:200,contentType:'image/png',body:png}));
  await page.route(/\/api\/hotbath-(?:live|italian)-media\?/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,image:'',scope:'missing'})}));
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof catalogIndex!=='undefined'&&catalogIndex.maker('Hotbath').length>=2554&&!!window.HydroHotbathGalassia,{timeout:60000});
  await page.evaluate(()=>{window.HydroHotbathGalassia.open(catalogIndex.maker('Hotbath'),'r1',(p,r)=>{window.__hotbathSelected={p,r}});});
  await page.locator('.hotbath-collections [data-collection="Mate"]').waitFor({timeout:15000});
  const summaries=await page.locator('.hotbath-collections button').allTextContents();
  assert(summaries.some(s=>s.includes('Mate')&&s.includes('Nickel brossé')));
  assert(summaries.some(s=>s.includes('Cobber X')&&s.includes('Laiton brossé PVD')));
  const cover=await page.locator('.hotbath-collections [data-collection="Mate"] img').getAttribute('src');
  assert.match(cover,/\/M100\/M100GN_02\.png/);
  await page.locator('.hotbath-collections [data-collection="Cobber"]').click();
  const taxonomy=await (await fetch(base+'/brand-guide-hotbath-taxonomy.json')).json();
  const group=taxonomy.collections.Cobber.find(g=>g.refs?.includes('CB003C'));
  assert(group,'CB003C is absent from official Cobber taxonomy');
  await page.locator('.hotbath-categories [data-category="'+(group.id||group.label)+'"]').click();
  await page.locator('.hotbath-models [data-model="CB003C"]').click();
  await page.locator('.hotbath-variant').selectOption('CB003C.BCP');
  const exact=await page.locator('.hotbath-selection .galassia-image-note').innerText();
  assert.match(exact,/finition exacte/i);
  assert.match(await page.locator('.hotbath-selection .galassia-photo img').getAttribute('src'),/\/CB003C\/CB003CBCP_02\.png/);
  await page.locator('.hotbath-variant').selectOption('CB003C.GN');
  const alternate=await page.locator('.hotbath-selection .galassia-image-note').innerText();
  assert.match(alternate,/finition illustrative/i);
  assert.match(await page.locator('.hotbath-selection .galassia-photo img').getAttribute('src'),/\/CB003C\/CB003CBCP_02\.png/);
  assert(!errors.some(e=>/Hotbath.*curated|Cannot read properties/i.test(e)),errors.join('\n'));
  console.log('Hotbath curated browser OK: preferred finish covers and exact/illustrative model image rules');
 }catch(e){console.error(e.stack||e,logs.slice(-1800));process.exitCode=1}
 finally{if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');await wait(150);fs.rmSync(dir,{recursive:true,force:true})}
})();
