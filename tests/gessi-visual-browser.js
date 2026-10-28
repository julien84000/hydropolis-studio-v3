'use strict';
// Standalone explorer UI test: real menu and tariff, deterministic image responses.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const page=await browser.newPage();const root=path.join(__dirname,'../public');
  const rows=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'catalog_gessi.json.gz'))));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://hydropolis.test/**',route=>{
   const pathName=new URL(route.request().url()).pathname;
   if(pathName.startsWith('/api/gessi/technical/')){
    const code=pathName.split('/').pop();
    return route.fulfill({contentType:'application/json',body:JSON.stringify({code,source:'https://areapro.gessi.com/fr/product/'+code,technical:[{name:'Hauteur',value:'297 mm'},{name:'Largeur',value:'50 mm'}],documentPdf:null})});
   }
   const name=pathName.slice(1);
   if(!name)return route.fulfill({contentType:'text/html; charset=utf-8',body:'<html><head><meta charset="utf-8"><link rel="stylesheet" href="/gessi-area-pro.css"></head><body><button id="opener">Gessi</button><script src="/gessi-area-pro.js"></script></body></html>'});
   return route.fulfill({path:path.join(root,name)});
  });
  const png=require('@napi-rs/canvas').createCanvas(8,8).toBuffer('image/png');
  await page.route(/^https:\/\/(?:gwebassets.gessi.com|gessistorage.blob.core.windows.net|gessistorage.azureedge.net)\//,r=>r.fulfill({contentType:'image/png',body:png}));
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
   await page.setViewportSize(viewport);await page.goto('https://hydropolis.test/');
   await page.locator('#opener').focus();
   await page.evaluate(rows=>{window.originalRows=rows;window.HydroGessiAreaPro.open(rows,'test',p=>{window.added=p;window.sameObject=rows.includes(p)})},rows);
   await page.waitForSelector('.gessi-univers .gessi-card');
   assert.equal(await page.locator('.gessi-univers .gessi-card').count(),9);
   await page.locator('[data-area="bathroom"]').click();
   assert.equal(await page.locator('.gessi-collections .gessi-card img').count(),18);
   await page.locator('[data-action="collection"][data-key="ORIGINI"]').click();
   await page.locator('[data-action="type"]').first().click();
   await page.locator('[data-action="model"]').first().click();
   const choices=page.locator('[data-finish]');assert.ok(await choices.count()>0);
   const chosen=choices.last(),ref=await chosen.getAttribute('data-finish');await chosen.click();
   assert.equal(await page.locator('[data-finish][aria-pressed="true"]').count(),1);
   assert.equal(await page.locator('.gessi-selection b').textContent(),ref);
   assert.ok(await page.locator('.gessi-large-photo img').count()<=1);
   await page.locator('.gessi-tech-list dt').first().waitFor();
   assert.equal(await page.locator('.gessi-tech-list dd').first().textContent(),'297 mm');
   assert.equal(await page.locator('.gessi-tech-list').count(),1);
   assert.equal(await page.locator('.gessi-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
   await page.locator('#gessi-add').click();
   assert.equal(await page.evaluate(()=>window.sameObject),true);
   assert.equal(await page.evaluate(()=>window.added.reference),ref);
   assert.equal(await page.locator('#opener').evaluate(el=>el===document.activeElement),true);
  }
  // A collection with no tariff remains consultable, without inventing products/prices.
  await page.evaluate(()=>window.HydroGessiAreaPro.open([],'test',()=>{throw Error('Unpriced add')}));
  await page.waitForSelector('.gessi-univers .gessi-card');
  await page.locator('[data-area="haute-culture"]').click();
  await page.locator('[data-action="collection"]').first().click();
  assert.match(await page.locator('.gessi-empty').textContent(),/pas encore intégrés/);
  assert.equal(await page.locator('#gessi-add').count(),0);
  await page.locator('.gessi-close').focus();await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('gessi-site-link')),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.gessi-overlay').count(),0);
  assert.deepEqual(errors,[]);console.log('Gessi: desktop/mobile, menu officiel, finitions, prix/objets inchangés, non tarifés et clavier OK');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
