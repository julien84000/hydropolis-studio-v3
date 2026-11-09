'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const cwd=path.resolve(__dirname,'..'),port=10079,base='http://127.0.0.1:'+port;
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-lefroy-'));
 const server=spawn(process.execPath,['server.js'],{cwd,env:{...process.env,PORT:String(port),HYDRO_DATA_DIR:data,DATABASE_URL:''},stdio:['ignore','pipe','pipe']});
 let logs='',browser;
 server.stderr.on('data',b=>logs+=String(b));
 server.stdout.on('data',b=>logs+=String(b));
 try{
  let ready=false;
  for(let i=0;i<120;i++){try{const r=await fetch(base+'/api/auth/status');if(r.ok){ready=true;break;}}catch(_){}await wait(100);}
  assert.ok(ready,'Server did not start: '+logs.slice(-1500));
  const setup=await fetch(base+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Lefroy test',username:'lefroy-e2e',password:'lefroy-e2e-test-password'})});
  const auth=await setup.json();
  assert.ok(auth.token,'Auth failed '+JSON.stringify(auth));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.HydroLefroyGuided&&typeof catalogIndex!=='undefined'&&
   catalogIndex.maker('Lefroy Brooks').length===3397&&!!state.rooms?.[0]?.id,{timeout:90000});
  await page.evaluate(()=>showView('catalog'));
  // E2E: render a model newly recovered from the manufacturer's real product gallery.
  await page.evaluate(()=>window.HydroManufacturerGuide.open('Lefroy Brooks',catalogIndex.maker('Lefroy Brooks'),state.rooms[0].id,()=>{}));
  const mediaDialog=page.locator('#manufacturerGuidedSelector');
  await mediaDialog.locator('[data-go="collection"][data-value="1900 Classic"]').waitFor({timeout:30000});
  await mediaDialog.locator('[data-go="collection"][data-value="1900 Classic"]').click();
  await mediaDialog.locator('[data-go="category"][data-value="Accessoires"]').click();
  const allModels=mediaDialog.locator('[data-go="subcategory"][data-value=""]');
  if(await allModels.count())await allModels.click();
  await mediaDialog.locator('#mgSearch').fill('BK4500');
  const recovered=mediaDialog.locator('[data-go="model"][data-value="BK4500"] img');
  await recovered.waitFor({timeout:25000});
  assert.match(await recovered.getAttribute('src'),/Lefroy-Brooks_BK-4500-NK\.jpg$/i);
  await mediaDialog.locator('[data-go="model"][data-value="BK4500"]').click();
  await mediaDialog.locator('[data-mg-finish="BK4500NK"]').click();
  assert.match(await mediaDialog.locator('.mg-detail .mg-photo img').getAttribute('src'),/Lefroy-Brooks_BK-4500-NK\.jpg$/i);
  assert.match(await mediaDialog.locator('.mg-detail .mg-photo small').innerText(),/finition NK/i);
  assert.match(await mediaDialog.locator('.mg-detail .mg-official').getAttribute('href'),/\/main-accessories\/bk-4500$/i);
  await mediaDialog.locator('.mg-close').click();

  await page.evaluate(()=>{
   document.querySelector('#manufacturerFilter').value='Lefroy Brooks';
   document.querySelector('#manufacturerFilter').dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.locator('#results .lf-direct-catalog-entry .lf-direct-catalog-button').click();
  const dialog=page.locator('#lefroyGuidedOverlay');
  await dialog.waitFor({timeout:20000});
  await dialog.locator('.lf-kind button[value="wc"]').click();
  await dialog.locator('select[data-lf="collection"]').selectOption('La Chapelle');
  await dialog.locator('[data-lf-set="la-chapelle-high-level-cistern-lavatory"]').click();
  assert.match(await dialog.innerText(),/LB7797/);
  assert.match(await dialog.innerText(),/133,00/);
  assert.match(await dialog.innerText(),/Tarif d’équivalence Hydropolis/);
  assert.equal(await dialog.locator('.lf-confirm').isDisabled(),false);
  const before=await page.evaluate(()=>state.selected.length);
  await dialog.locator('.lf-confirm').click();
  await page.waitForFunction(n=>state.selected.length===n+7,before,{timeout:15000});
  const actual=await page.evaluate(n=>state.selected.slice(n).map(p=>({ref:p.reference,price:p.price,
    linked:p.accessoryFor,photo:p.image||'',config:p.lefroyGuidedConfiguration||null,priceOverride:p.lefroyPriceOverride||null})),before);
  assert.deepEqual(actual.map(x=>x.ref),['LB7709WH','LB7711WH','LB7797','LB7787CP','LB7780CP','LB7740CP','LB1310CP']);
  assert.equal(actual.reduce((sum,x)=>sum+Number(x.price),0),3009);
  assert.ok(actual[0].config?.selectedRefs?.includes('LB7797'));
  assert.equal(actual[2].priceOverride?.pricingReference,'LB7297DF');
  assert.ok(actual.slice(1).every(x=>x.linked===actual[0].linked||x.linked),'Accessory link must exist');
  assert.ok(actual[0].photo.startsWith('/api/image-proxy?url=')||actual[0].photo.startsWith('https://'),'Official photo attached');
  const saved=await page.evaluate(async()=>{state.project.name='Lefroy guided E2E isolated';await saveCloudProject();return cloud.currentProjectId;});
  assert.ok(saved,'Missing saved cloud project');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof cloud!=='undefined'&&typeof openCloudProject==='function'&&state.rooms?.length,{timeout:90000});
  await page.evaluate(async id=>{if(cloud.currentProjectId!==id){await loadCloudProjects();await openCloudProject(id)}},saved);
  const persisted=await page.evaluate(()=>({
   refs:state.selected.filter(p=>p.lefroyGuidedConfiguration||p.lefroyGuidedChild).map(p=>p.reference),
   override:state.selected.find(p=>p.reference==='LB7797')?.lefroyPriceOverride,
   config:state.selected.find(p=>p.reference==='LB7709WH')?.lefroyGuidedConfiguration
  }));
  assert.equal(persisted.refs.length,7);
  assert.equal(persisted.override?.pricingReference,'LB7297DF');
  assert.equal(persisted.config?.kind,'wc');
  // Unpriced corner cloakroom: UI must not allow an incomplete quotation.
  // A restored cloud project can be ready before supplier catalogue chunks finish loading.
  await page.waitForFunction(()=>catalogIndex.maker('Lefroy Brooks').length===3397,{timeout:90000});
  await page.evaluate(()=>window.HydroLefroyGuided.open(null,state.rooms[0].id));
  await page.locator('#lefroyGuidedOverlay [data-lf-set="charterhouse-corner-cloakroom-basin"]').count();
  await page.locator('#lefroyGuidedOverlay select[data-lf="collection"]').selectOption('Charterhouse');
  await page.locator('#lefroyGuidedOverlay [data-lf-set="charterhouse-corner-cloakroom-basin"]').click();
  assert.equal(await page.locator('#lefroyGuidedOverlay .lf-confirm').isDisabled(),true);
  assert.match(await page.locator('#lefroyGuidedOverlay').innerText(),/LB7262/);
  await page.locator('#lefroyGuidedOverlay .lf-close').click();
  assert.ok(!errors.some(x=>/Lefroy|lefroy|SyntaxError|ReferenceError/.test(x)),JSON.stringify(errors.slice(-20)));
  console.log('Lefroy browser: official 33 sets, La Chapelle 7-line €3009 WC, persistence, and missing-tariff blocking verified.');
 }finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
  try{fs.rmSync(data,{recursive:true,force:true});}catch(_){}
 }
})().catch(err=>{console.error(err);process.exitCode=1;});