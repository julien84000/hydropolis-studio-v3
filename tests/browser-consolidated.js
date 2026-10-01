'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict'),{spawn}=require('child_process');
const {chromium}=require('playwright');
const root=path.resolve(process.env.TEST_REPO||path.join(__dirname,'..')),port=10019,base=`http://127.0.0.1:${port}`,baseline=!!process.env.TEST_REPO;
const executablePath=process.env.CHROMIUM_PATH;
const report={version:require(path.join(root,'package.json')).version,errors:[],checks:[]};
const check=(name,value)=>{assert(value,name);report.checks.push(name);};
(async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydropolis-browser-'));
  const server=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port),HYDRO_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
  let logs='';server.stderr.on('data',b=>{logs+=b;});
  let browser;
  try{
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup: '+logs)),10000);server.stdout.on('data',b=>{if(String(b).includes(' on ')){clearTimeout(timer);resolve();}});server.on('error',reject);});
    const auth=await fetch(base+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Validation locale',username:'testlocal',password:'test-local-11561'})}).then(r=>r.json());check('auth locale',!!auth.token);
    browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
    const page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'});
    page.on('pageerror',e=>report.errors.push(e.message));
    await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
    // Deterministic API responses exercise UI logic with snapshots of official data.
    const assets=require('../official-assets-server'),fixture=path.join(__dirname,'fixtures/official');
    const modelData=require('../public/sira_models.json');
    if(process.env.TEST_IMAGE_DIR)await page.route(/^https:\/\/(?:siraconcrete\.com|alpirubinetterie\.com|gessistorage\.blob\.core\.windows\.net)\//,async route=>{
      const url=route.request().url(),file=path.join(process.env.TEST_IMAGE_DIR,require('crypto').createHash('sha256').update(url).digest('hex')+'.img');
      if(fs.existsSync(file))return route.fulfill({body:fs.readFileSync(file),contentType:/\.png(?:$|\?)/.test(url)?'image/png':'image/jpeg'});
      return route.abort();
    });
    await page.route('**/api/manufacturer-image',async route=>{
      const p=route.request().postDataJSON();let result={best:null,images:[]};
      if(p.manufacturer==='Gessi'){const article=p.reference.split('#')[0],f=path.join(fixture,'gessi-'+article+'.json');if(fs.existsSync(f))result=assets.legacyResult(assets.selectGessi(assets.parseGessiArticle(JSON.parse(fs.readFileSync(f)),article),p));}
      if(p.manufacturer==='Alpi'){const item=assets.matchAlpi(p);if(item){const f=path.join(fixture,'alpi-popup-'+item.id+'.html');const data=fs.existsSync(f)?assets.parseAlpiPopup(fs.readFileSync(f,'utf8'),item):{image:item.image,images:[item.image],productUrl:item.productUrl};result=assets.legacyResult({...data,finishMatch:item.finishMatch,imageSource:'Site officiel ALPI',version:require('../package.json').version});}}
      await route.fulfill({json:result});
    });
    await page.route('**/api/sira-assets?*',async route=>{
      const q=Object.fromEntries(new URL(route.request().url()).searchParams),model=modelData.models.find(m=>m.code===q.modelCode);
      const data=assets.parseSiraPage(fs.readFileSync(path.join(fixture,'sira-'+model.code+'.html'),'utf8'),model.productUrl);
      await route.fulfill({json:assets.selectSira(data,q)});
    });
    const started=Date.now();await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof CATALOG!=='undefined'&&CATALOG.filter(x=>x.manufacturer==='Nicolazzi').length===36303,{timeout:60000});
    await page.waitForFunction(()=>CATALOG.some(x=>x.manufacturer==='Alpi'),{timeout:30000});
    await page.waitForFunction(()=>CATALOG.filter(x=>x.manufacturer==='Zucchetti').length===12053,{timeout:60000});
    report.loadMs=Date.now()-started;
    report.counts=await page.evaluate(()=>{let counts={};for(const p of CATALOG)counts[p.manufacturer]=(counts[p.manufacturer]||0)+1;return counts;});
    await page.evaluate(()=>{document.querySelector('#manufacturerFilter').value='Gessi';document.querySelector('#manufacturerFilter').dispatchEvent(new Event('change'));});
    if(process.env.PROFILE_ONLY){
      const session=await page.context().newCDPSession(page);await session.send('Profiler.enable');await session.send('Profiler.start');await page.evaluate(()=>renderCatalog());
      const {profile}=await session.send('Profiler.stop');report.profile=profile.nodes.filter(x=>x.hitCount).sort((a,b)=>b.hitCount-a.hitCount).slice(0,20).map(x=>({fn:x.callFrame.functionName,line:x.callFrame.lineNumber+1,url:x.callFrame.url,hits:x.hitCount}));
    }
    report.renderMs=await page.evaluate(()=>[0,1,2].map(()=>{const t=performance.now();renderCatalog();return +(performance.now()-t).toFixed(1)}));
    report.cards=await page.locator('#results .result').count();
    if(baseline||process.env.PROFILE_ONLY){console.log(JSON.stringify(report,null,2));return;}
    check('pagination 48 cartes maximum',report.cards<=48);
    await page.evaluate(()=>{document.querySelector('#searchInput').value='baignoire';document.querySelector('#manufacturerFilter').value='Resigres';document.querySelector('#manufacturerFilter').dispatchEvent(new Event('change'));});
    check('changement fabricant efface le texte',await page.locator('#searchInput').inputValue()==='');
    check('Resigres : résultats visibles',await page.locator('#results .result').count()>0);
    const resigres=await page.evaluate(()=>{const p=CATALOG.find(x=>x.manufacturer==='Resigres'&&/^selene$/i.test(x.resigresModel||''));return p?{reference:p.reference,key:productKey(p)}:null;});
    check('parent plan vasque Resigres',!!resigres);
    await page.evaluate(p=>addCatalogProduct(p.reference,state.rooms[0]?.id,p.key),resigres);
    await page.waitForSelector('#resigresConfigurator .v1149-shape');
    check('Resigres : formes de vasques présentes',await page.locator('#resigresConfigurator .v1149-shape').count()>=6);
    await page.locator('#resigresConfigurator .v1149-shape').first().click();
    const firstOption=async selector=>{const value=await page.locator(selector+' option').evaluateAll(xs=>xs.find(x=>x.value)?.value);assert(value,selector);await page.locator(selector).selectOption(value);};
    const selene49=await page.locator('#rg49SelMat').count()>0;
    const ids=selene49?{mat:'rg49SelMat',color:'rg49SelColor',group:'rg49SelGroup',width:'rg49SelWidth',length:'rg49SelLength',tag:'rg49'}:{mat:'rg50Mat',color:'rg50Color',group:'rg50Group',width:'rg50Width',length:'rg50Length',tag:'rg50'};
    await firstOption('#'+ids.mat);await firstOption('#'+ids.color);await firstOption('#'+ids.group);
    await page.locator('#'+ids.width).fill('50');await page.locator('#'+ids.length).fill('100');
    const quote=()=>page.evaluate(()=>document.querySelector('#resigresConfigurator')._q);
    const baseQuote=await quote();check('Resigres : prix calculé',baseQuote.status==='automatic'&&baseQuote.total>0);
    await page.locator('#resigresConfigurator details').evaluateAll(xs=>xs.forEach(x=>x.open=true));
    await page.locator('[data-'+ids.tag+'-included]').first().check();
    check('Resigres : option comprise sans supplément',(await quote()).total===baseQuote.total);
    await page.locator('[data-'+ids.tag+'-paid-check]').first().check();await page.locator('[data-'+ids.tag+'-paid]').first().fill('1');
    const paidQuote=await quote();check('Resigres : option payante',paidQuote.total>baseQuote.total);
    await page.locator('.'+ids.tag+'-confirm').click();
    const configured=await page.evaluate(()=>state.selected.filter(x=>x.manufacturer==='Resigres').at(-1));
    check('Resigres : configuration et prix conservés au projet',configured.resigresConfiguration?.total===paidQuote.total&&configured.price===paidQuote.total);
    report.resigres={basePrice:baseQuote.total,withPaidOption:paidQuote.total,configuration:configured.resigresConfiguration};
    const recor=await page.evaluate(()=>{const p=CATALOG.find(x=>isRecorBathRequiringFeet(x)&&recorCompatibleFeet(x).length);return {reference:p.reference,key:productKey(p)};});
    await page.evaluate(p=>addCatalogProduct(p.reference,state.rooms[0]?.id,p.key),recor);
    await page.waitForSelector('#recorConfigurator input[name="recorFeet"]');
    await page.locator('#recorConfigurator input[name="recorFeet"]').first().check();
    await page.locator('.recor-config-confirm').click();
    const bath=await page.evaluate(ref=>{const p=state.selected.find(x=>x.manufacturer==='Recor'&&x.reference===ref);return {exists:!!p,feet:state.selected.filter(x=>x.accessoryFor===p?.id&&x.collection==='Pieds Recor').length};},recor.reference);
    check('Recor : baignoire et pieds compatibles',bath.exists&&bath.feet===1);
    const families=await page.evaluate(()=>CATALOG.filter(x=>x.manufacturer==='Sira Concrete').map(x=>({reference:x.reference,key:productKey(x),collection:x.collection})));
    report.sira=[];
    for(const family of families){
      await page.evaluate(p=>addCatalogProduct(p.reference,state.rooms[0]?.id,p.key),family);
      await page.waitForSelector('#siraTariffModal .sira-model');
      const n=await page.locator('#siraTariffModal .sira-model').count();const expected=modelData.models.filter(m=>m.collection===family.collection).length;check('miniatures Sira '+family.collection,n===expected&&n>0);
      await page.waitForFunction(()=>document.querySelector('#siraTariffModal .sira-preview img'));
      const before=await page.locator('#siraTariffModal .sira-preview img').getAttribute('src');
      await page.locator('#siraTariffModal .sira-color').selectOption('OB');
      await page.waitForFunction(previous=>document.querySelector('#siraTariffModal .sira-preview img')?.getAttribute('src')!==previous,before);
      const after=await page.locator('#siraTariffModal .sira-preview img').getAttribute('src');check('pigment Sira '+family.collection,before!==after&&after.includes('siraconcrete.com/'));
      report.sira.push({family:family.collection,models:n,before,after});
      await page.locator('#siraTariffModal .sira-add').click();
      const selected=await page.evaluate(()=>state.selected.filter(x=>x.manufacturer==='Sira Concrete'&&!x.accessoryFor).at(-1));check('Sira conserve finition au projet '+family.collection,selected.finishCode==='OB'&&selected.remoteImageUrl===after);
    }
    const roughIn=await page.evaluate(()=>{
      const p=CATALOG.find(p=>p.manufacturer==='Alpi'&&p.internalReference);const rec=createSelectedProductRecord(p,state.rooms[0]?.id);commitSelectedRecords([rec]);setProductQuantity(rec.id,3);const children=state.selected.filter(x=>x.accessoryFor===rec.id);const purchase=children.reduce((sum,x)=>sum+purchaseCostFor(x),purchaseCostFor(rec));const total=children.reduce((sum,x)=>sum+Number(x.price),Number(rec.price));const before=state.selected.length;reconcileProjectRoughIns();const idempotent=state.selected.length===before;removeProduct(rec.id);return {children:children.length,quantity:children[0]?.quantity,total,purchase,expected:Number(p.price)+Number(p.internalPrice),idempotent,removed:!state.selected.some(x=>x.id===rec.id||x.accessoryFor===rec.id)};
    });report.roughIn=roughIn;check('corps ALPI natif, quantité, prix, suppression',roughIn.children===1&&roughIn.quantity===3&&roughIn.total===roughIn.expected&&roughIn.idempotent&&roughIn.removed);
    check('aucune erreur JavaScript',report.errors.length===0);
    await page.evaluate(()=>{document.querySelector('#manufacturerFilter').value='Sira Concrete';document.querySelector('#manufacturerFilter').dispatchEvent(new Event('change'));});
    await page.evaluate(()=>{const p=CATALOG.find(x=>x.manufacturer==='Sira Concrete'&&x.collection==='Wall Collection');addCatalogProduct(p.reference,state.rooms[0]?.id,productKey(p));});
    await page.waitForSelector('#siraTariffModal .sira-model');await page.screenshot({path:path.join(root,'docs/sira-configurator.png'),fullPage:false});
    console.log(JSON.stringify(report,null,2));
  }catch(e){report.failure=e.stack;console.error(JSON.stringify(report,null,2));process.exitCode=1;}
  finally{fs.writeFileSync(path.join(root,baseline?'../audit/browser-baseline-11560.json':process.env.PROFILE_ONLY?'../audit/profile-validation.json':'docs/browser-validation.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();fs.rmSync(dir,{recursive:true,force:true});}
})();
