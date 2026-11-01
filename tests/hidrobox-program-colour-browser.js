'use strict';
// Standalone Chromium test of the REAL Program Colour UI, not just CSS or string checks.
// The supplier's imported 2026 reference matrix is provided as the browser fixture.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:950}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
  await page.setContent('<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body><main id="view"></main></body></html>');
  await page.addStyleTag({path:path.join(root,'hidrobox-program.css')});
  for(const file of ['hidrobox-program-colour-2026.js','hidrobox-program-colour-ui.js'])await page.addScriptTag({path:path.join(root,file)});
  const db=JSON.parse(zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(root,'brand-data/hidrobox-config-01.b64'),'utf8').trim(),'base64')).toString('utf8'));
  const group=db.groups.find(g=>g.collection==='Program Colour');
  assert(group,'Program Colour SKU import');
  await page.evaluate(g=>{
   window.__group=g;window.__saved=null;
   window.__context={image:'',original:null,overlay:()=>document.querySelector('#view'),
    shell:(_title,html)=>{document.querySelector('#view').innerHTML=html;},
    save:(item,configuration)=>{window.__saved={item,configuration}},back:()=>{}};
   window.HydroProgramColourUI.programColour(g,window.__context);
  },group);
  assert.equal(await page.locator('[data-pc-basin]').count(),2,'S41 and S42 buttons visible');
  assert.equal(await page.locator('[data-pc-color]').count(),6,'Basics manufacturer colours shown');
  assert.equal(await page.locator('.hb-pc-render svg').count(),1,'real visual schematic, not blank');
  assert(await page.locator('#pcAdd').isEnabled(),'Basic S41 default is priced');
  let text=await page.locator('.hidrobox-result').innerText();
  assert(text.includes('WPCC0147')&&text.includes('853,84'),'Basic quote uses 2026 source and +4% once: '+text);

  await page.locator('#pcGroup').selectOption('TRE');
  assert.equal(await page.locator('[data-pc-color]').count(),14,'Trends colour chips');
  await page.locator('[data-pc-color="Blush"]').click();
  await page.locator('[data-pc-basin="S42"]').click();
  assert(!(await page.locator('#pcAdd').isEnabled()),'Double requires 135cm length');
  await page.locator('#pcLength').fill('140');await page.locator('#pcLength').press('Tab');
  assert(await page.locator('#pcAdd').isEnabled(),'S42 can be priced at 140cm');
  text=await page.locator('.hidrobox-result').innerText();
  assert(text.includes('WPCC0176')&&text.includes('1 224,08')||text.includes('WPCC0176')&&text.includes('1 224,08')||text.includes('WPCC0176')&&text.includes('1224,08'),'S42 price and reference match supplier: '+text);
  await page.locator('#pcAdd').click();
  const saved=await page.evaluate(()=>window.__saved);
  assert(saved&&saved.item.reference==='WPCC0176'&&saved.configuration.basin==='S42');
  assert.equal(saved.item.price,1224.08);
  assert.equal(saved.configuration.color,'Blush');
  assert.equal(saved.configuration.type,'program-colour-2026');
  
  await page.locator('#pcGroup').selectOption('SPE');
  assert(!(await page.locator('#pcAdd').isEnabled()),'No special code, no order');
  await page.locator('#pcSpecial').fill('RAL 9010');await page.locator('#pcSpecial').press('Tab');
  assert(await page.locator('#pcAdd').isEnabled(),'Validated RAL code');
  text=await page.locator('.hidrobox-result').innerText();
  assert(text.includes('WPCC0204'),'Special correct SKU '+text);
  await page.locator('#pcHeight').selectOption('10');
  await page.locator('#pcDepth').fill('56');await page.locator('#pcDepth').press('Tab');
  assert(!(await page.locator('#pcAdd').isEnabled()),'No pricing outside correct 3–15h depth band');
  assert((await page.locator('[role="alert"]').innerText()).includes('Dimensions'));
  assert.equal(errors.length,0,'No uncaught browser exceptions: '+errors.join('; '));
  console.log('Chromium Program Colour: S41/S42, 20 colours, RAL validation, real dimensions and prices OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
