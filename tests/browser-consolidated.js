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
    // UI tests use a synthetic image payload; live source availability is tested separately.
    if(!process.env.TEST_IMAGE_DIR)await page.route(/^https:\/\/(?:siraconcrete\.com|alpirubinetterie\.com|gessistorage\.blob\.core\.windows\.net)\//,route=>route.fulfill({body:require('@napi-rs/canvas').createCanvas(8,8).toBuffer('image/png'),contentType:'image/png'}));
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
    await page.evaluate(()=>window.HydroSbordoniDocuments.open());
    check('98 fiches Sbordoni consultables',await page.locator('.sbordoni-document-list a').count()===98);
    await page.locator('.sbordoni-documents input').fill('7200');
    check('recherche de fiches par référence',await page.locator('.sbordoni-document-list a').count()>0);
    const suppliedLink=await page.locator('.sbordoni-document-list a').first().getAttribute('href');
    const suppliedPDF=await page.request.get(base+suppliedLink);
    check('PDF Sbordoni fourni accessible',suppliedPDF.ok()&&(await suppliedPDF.body()).subarray(0,4).toString()==='%PDF');
    await page.keyboard.press('Escape');
    await page.locator('.sbordoni-documents').waitFor({state:'detached'});
    check('fermeture clavier fiches Sbordoni',await page.locator('.sbordoni-documents').count()===0);
    // Real HTTP and image decode regression, not just source-file presence.
    const hdImageResponse=await page.request.get(base+'/sbordoni/compositions/5700-G571.jpg');
    check('Composition Sbordoni HD consultable',hdImageResponse.ok()&&String(hdImageResponse.headers()['content-type']||'').includes('image/jpeg'));
    const hdDimensions=await page.evaluate(()=>new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>resolve([img.naturalWidth,img.naturalHeight]);
      img.onerror=()=>reject(new Error('Impossible de charger image 5700-G571'));
      img.src='/sbordoni/compositions/5700-G571.jpg';
    }));
    check('Composition 5700-G571 : dimensions du PDF haute résolution',hdDimensions[0]>=400&&hdDimensions[1]>=390);
    const hdManifestResponse=await page.request.get(base+'/sbordoni/compositions/hd-manifest.json');
    check('Audit HD Sbordoni accessible',hdManifestResponse.ok()&&(await hdManifestResponse.json()).count===99);


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
    // Gea CF and SF must price in the actual UI, not only in the isolated pricing engine.
    const openGea=async model=>{
      const product=await page.evaluate(model=>{
        const p=CATALOG.find(x=>x.manufacturer==='Resigres'&&x.resigresModel===model);
        return p?{reference:p.reference,key:productKey(p)}:null;
      },model);
      check('Catalogue Resigres : '+model+' présent',!!product);
      await page.evaluate(p=>addCatalogProduct(p.reference,state.rooms[0]?.id,p.key),product);
      await page.waitForSelector('#resigresConfigurator #rg50Height');
      await page.locator('#resigresConfigurator .v1149-shape').first().click();
      await page.locator('#rg50Mat').selectOption('wood');
      await page.locator('#rg50Color').selectOption('Nogal US');
      await page.locator('#rg50Group').selectOption('slab');
      await page.locator('#rg50Length').fill('140');
      await page.locator('#rg50Width').fill('45');
      await page.locator('#rg50Height').fill(model==='Gea CF'?'5':'1.5');
      await page.waitForFunction(()=>document.querySelector('#resigresConfigurator')?._q?.status==='automatic');
    };
    await openGea('Gea CF');
    const geaCfPrice=await page.evaluate(()=>document.querySelector('#resigresConfigurator')._q);
    check('Gea CF : Nogal US 140 × 45 × 5 cm = 986 € HT, palier 141',geaCfPrice.total===986&&geaCfPrice.pricedLength===141);
    check('Gea CF : aucune saisie manuelle de prix',await page.locator('#rg50ManualWrap').evaluate(x=>x.classList.contains('hidden')));
    await page.locator('#rg50Length').fill('142');
    check('Gea CF : palier 161 cm = 1094 € HT',(await page.evaluate(()=>document.querySelector('#resigresConfigurator')._q)).total===1094);
    await page.locator('#rg50Length').fill('140');
    await page.locator('#rg50Height').fill('4');
    check('Gea CF : épaisseur hors tarif refusée',(await page.evaluate(()=>document.querySelector('#resigresConfigurator')._q)).status==='pending');
    await page.locator('#rg50Height').fill('5');
    await page.locator('.rg50-confirm').click();
    const geaSaved=await page.evaluate(()=>state.selected.filter(x=>x.manufacturer==='Resigres'&&x.resigresModel==='Gea CF').at(-1));
    check('Gea CF : 986 € conservés dans la sélection projet',geaSaved?.price===986&&geaSaved.resigresConfiguration?.total===986);

    await openGea('Gea SF');
    const geaSfPrice=await page.evaluate(()=>document.querySelector('#resigresConfigurator')._q);
    check('Gea SF : Nogal US 140 × 45 × 1,5 cm = 627 € HT',geaSfPrice.total===627&&geaSfPrice.pricedLength===141);
    await page.locator('.rg50-confirm').click();
    const geaSfSaved=await page.evaluate(()=>state.selected.filter(x=>x.manufacturer==='Resigres'&&x.resigresModel==='Gea SF').at(-1));
    check('Gea SF : 627 € conservés dans la sélection projet',geaSfSaved?.price===627&&geaSfSaved.resigresConfiguration?.total===627);
    report.gea={cf:geaCfPrice.total,sf:geaSfPrice.total};


    // Screenshot regression V11.62.9: Atenea must never ask for a manual price for an official priced cell.
    const atenea=await page.evaluate(()=>{
      const p=CATALOG.find(x=>x.manufacturer==='Resigres'&&x.resigresModel==='Atenea');
      return p?{reference:p.reference,key:productKey(p)}:null;
    });
    check('Atenea visible dans le catalogue',!!atenea);
    await page.evaluate(p=>addCatalogProduct(p.reference,state.rooms[0]?.id,p.key),atenea);
    await page.waitForSelector('#resigresConfigurator .rg50-shape');
    await page.locator('#resigresConfigurator .rg50-shape').first().click();
    await page.locator('#rg50Mat').selectOption('solid-surface');
    await page.locator('#rg50Color').selectOption('S-Blanco');
    await page.locator('#rg50Group').selectOption('one');
    await page.locator('#rg50Length').fill('140');
    await page.locator('#rg50Width').fill('51');
    await page.waitForFunction(()=>document.querySelector('#resigresConfigurator')?._q?.total===1098);
    const ateneaQuote=await page.evaluate(()=>document.querySelector('#resigresConfigurator')._q);
    check('Atenea 140 × 51 Standard S-Blanco = 1098 EUR HT / palier 141',ateneaQuote.total===1098&&ateneaQuote.pricedLength===141);
    check('Atenea : prix HT 1098 visible sans saisie manuelle',
      (await page.locator('#rg50Price').innerText()).replace(/\D/g,'').startsWith('1098')&&
      await page.locator('#rg50ManualWrap').evaluate(el=>el.classList.contains('hidden')));
    await page.locator('#rg50Length').fill('142');
    check('Atenea : palier 161 => 1228 EUR HT',(await page.evaluate(()=>document.querySelector('#resigresConfigurator')._q)).total===1228);
    await page.locator('#rg50Length').fill('140');
    await page.locator('.rg50-confirm').click();
    const ateneaSaved=await page.evaluate(()=>state.selected.filter(x=>x.manufacturer==='Resigres'&&x.resigresModel==='Atenea').at(-1));
    check('Atenea : prix 1098 HT sauvegardé dans le projet',ateneaSaved?.price===1098&&ateneaSaved.resigresConfiguration?.total===1098);

    // Exact-source fixed variants across basins and accessories, exercised in the actual dependent configurator.
    const fixedChecks=[
      {name:'Ares',kind:'basin',size:'se',material:'resin',color:'Ártico',expected:299},
      {name:'Crono',kind:'basin',size:'mini',material:'resin',color:'Ártico',expected:199,extra:66},
      {name:'Kos / Neo',kind:'basin',size:'kos',material:'resin',color:'Ártico',expected:295},
      {name:'Gesto / Frame',kind:'basin',size:'gesto-recto',material:'resin',color:'Ártico',expected:376},
      {name:'Urban',kind:'basin',size:'urban',material:'resin',color:'Ártico',expected:395},
      {name:'Porte-serviettes',kind:'accessory',size:'frame',material:'wood',color:'Roble',expected:790},
      {name:'Panneaux / étagères',kind:'accessory',size:'shelf-40',material:'resin',color:'Ártico',expected:140}
    ];
    for(const row of fixedChecks){
      const p=await page.evaluate(item=>{
        const x=CATALOG.find(x=>x.manufacturer==='Resigres'&&x.resigresModel===item.name&&x.resigresKind===item.kind);
        return x?{reference:x.reference,key:productKey(x)}:null;
      },row);
      check('Catalogue variante Resigres '+row.name,!!p);
      await page.evaluate(p=>addCatalogProduct(p.reference,state.rooms[0]?.id,p.key),p);
      await page.waitForSelector('#resigresConfigurator #rg48Size');
      await page.locator('#rg48Size').selectOption(row.size);
      await page.locator('#rg48Material').selectOption(row.material);
      await page.locator('#rg48Color').selectOption(row.color);
      await page.waitForFunction(expected=>document.querySelector('#resigresConfigurator')?._rg48Quote?.total===expected,row.expected);
      check('Prix fournisseur automatique '+row.name,(await page.evaluate(()=>document.querySelector('#resigresConfigurator')._rg48Quote)).total===row.expected);
      if(row.extra){
        await page.locator('[data-rg48-extra="colored-waste"]').check();
        check('Supplément bonde '+row.name,(await page.evaluate(()=>document.querySelector('#resigresConfigurator')._rg48Quote)).total===row.expected+row.extra);
      }
      await page.locator('.rg-confirm').click();
      const saved=await page.evaluate(item=>state.selected.filter(x=>x.manufacturer==='Resigres'&&x.resigresModel===item.name&&x.resigresKind===item.kind).at(-1),row);
      check('Ajout au projet et prix conservé '+row.name,saved?.price===row.expected+(row.extra||0));
    }

    // V11.62.10: browser regression across newly priced families (not just isolated calculator).
    const resProduct=async (model,kind)=>{
      const p=await page.evaluate(({model,kind})=>{
        const item=CATALOG.find(x=>x.manufacturer==='Resigres'&&x.resigresModel===model&&x.resigresKind===kind);
        return item?{reference:item.reference,key:productKey(item)}:null;
      },{model,kind});
      check('Resigres catalogue '+model+' '+kind,!!p);
      await page.evaluate(x=>addCatalogProduct(x.reference,state.rooms[0]?.id,x.key),p);
      await page.waitForSelector('#resigresConfigurator');
    };

    await resProduct('Axis','basin');
    await page.locator('#rg48Size').selectOption('axis-free');
    await page.locator('#rg48Material').selectOption('lisa');
    await page.locator('#rg48Color').selectOption('Ártico');
    await page.waitForFunction(()=>document.querySelector('#resigresConfigurator')?._rg48Quote?.total===390);
    check('Axis : vasque seule Lisa standard 390 EUR HT',await page.locator('#rg48Price').innerText()!=='—');
    await page.locator('.rg-confirm').click();
    const axisSaved=await page.evaluate(()=>state.selected.filter(x=>x.manufacturer==='Resigres'&&x.resigresModel==='Axis').at(-1));
    check('Axis : tarif enregistré dans le projet',axisSaved?.price===390);

    await resProduct('Panneaux / étagères','accessory');
    await page.locator('#rg48Size').selectOption('panel-area');
    check('Panneau : dimensions spécifiques affichées',await page.locator('#rg48AreaWidth').isVisible()&&await page.locator('#rg48AreaLength').isVisible());
    await page.locator('#rg48Material').selectOption('resin');
    await page.locator('#rg48Color').selectOption('Ártico');
    await page.locator('#rg48AreaWidth').fill('120');
    await page.locator('#rg48AreaLength').fill('200');
    await page.waitForFunction(()=>document.querySelector('#resigresConfigurator')?._rg48Quote?.total===696);
    await page.locator('#rg48AreaWidth').fill('130');
    check('Panneau : dimension hors gamme refusée',(await page.evaluate(()=>document.querySelector('#resigresConfigurator')._rg48Quote)).status==='pending');
    await page.locator('#rg48AreaWidth').fill('120');
    await page.locator('.rg-confirm').click();
    const panelSaved=await page.evaluate(()=>state.selected.filter(x=>x.manufacturer==='Resigres'&&x.resigresModel==='Panneaux / étagères').at(-1));
    check('Panneau : tarif 696 EUR HT enregistré dans le projet',panelSaved?.price===696);

    await resProduct('Frame','furniture');
    await page.locator('#rg50FType').selectOption('h45-1d-1b');
    await page.locator('#rg50FMat').selectOption('lacquer');
    await page.locator('#rg50FColor').selectOption('Arena');
    await page.locator('#rg50FWidth').fill('48');
    await page.locator('#rg50FLength').fill('100');
    await page.locator('#rg50FHeight').fill('45');
    await page.locator('#rg50FDepth').fill('48');
    check('Frame : finition plan obligatoire, pas de saisie prix manuel',await page.locator('#rg50FManualWrap').evaluate(e=>e.classList.contains('hidden')));
    await page.locator('#rg50FTop').selectOption('lisa');
    await page.locator('#rg50FTopColor').selectOption('Ártico');
    await page.waitForFunction(()=>document.querySelector('#resigresConfigurator')?._q?.total===2380);
    await page.locator('#rg50FWidth').fill('60');
    check('Frame : 60 cm profondeur refusé',(await page.evaluate(()=>document.querySelector('#resigresConfigurator')._q)).status==='pending');
    await page.locator('#rg50FWidth').fill('48');
    await page.locator('.rg50-confirm').click();
    const frameSaved=await page.evaluate(()=>state.selected.filter(x=>x.manufacturer==='Resigres'&&x.resigresModel==='Frame').at(-1));
    check('Frame H45 : plan + meuble total 2380 EUR HT dans le projet',frameSaved?.price===2380);

    await resProduct('Gesto','furniture');
    await page.locator('#rg50FType').selectOption('h30');
    await page.locator('#rg50FMat').selectOption('lacquer');
    await page.locator('#rg50FColor').selectOption('Arena');
    await page.locator('#rg50FWidth').fill('50');
    await page.locator('#rg50FLength').fill('80');
    await page.locator('#rg50FHeight').fill('30');
    await page.locator('#rg50FDepth').fill('50');
    await page.waitForFunction(()=>document.querySelector('#resigresConfigurator')?._q?.total===1198);
    await page.locator('.rg50-confirm').click();
    const gestoSaved=await page.evaluate(()=>state.selected.filter(x=>x.manufacturer==='Resigres'&&x.resigresModel==='Gesto').at(-1));
    check('Gesto H30 : meuble total 1198 EUR HT dans le projet',gestoSaved?.price===1198);


    // V11.62.11 : parcours pictographique réel de la gamme Tiroirs sur mesure.
    await resProduct('Tiroirs sur mesure','furniture');
    await page.waitForSelector('#rgdrawHeights');
    check('Tiroirs sur mesure : trois hauteurs proposées',(await page.locator('[data-rgdraw-height]').count())===3);
    await page.locator('[data-rgdraw-height="50"]').click();
    check('Tiroirs H50 : 4 configurations graphiques',(await page.locator('[data-rgdraw-variant]').count())===4);
    check('Tiroirs : pictogrammes exacts du catalogue présents',
      (await page.locator('[data-rgdraw-variant="h50-inner-double"] .rgdraw-picto').getAttribute('style')).includes('data:image/png;base64,'));
    await page.locator('[data-rgdraw-variant="h50-inner-double"]').click();
    await page.locator('#rgdrawLength').fill('150');
    await page.locator('#rgdrawDepth').fill('49');
    await page.locator('[data-rgdraw-material="wood-other"]').click();
    await page.locator('#rgdrawColor').selectOption('Nogal US');
    await page.locator('[data-rgdraw-top="separate"]').click();
    await page.locator('#rgdrawTopMaterial').selectOption('wood');
    await page.locator('#rgdrawClassifier').fill('2');
    await page.waitForFunction(()=>document.querySelector('#resigresConfigurator')?._q?.total===3749);
    const drawersQuote=await page.evaluate(()=>document.querySelector('#resigresConfigurator')._q);
    check('Tiroirs H50 double intérieur : caisson 2910 + top 641 + classeurs 198',
      drawersQuote.status==='automatic'&&drawersQuote.basePrice===2910&&drawersQuote.topPrice===641&&drawersQuote.total===3749);
    await page.locator('#rgdrawDepth').fill('52');
    check('Tiroirs : profondeur au-delà de 51 cm refusée',
      (await page.evaluate(()=>document.querySelector('#resigresConfigurator')._q)).status==='pending');
    await page.locator('#rgdrawDepth').fill('49');
    await page.locator('.rg50-confirm').click();
    const drawerSaved=await page.evaluate(()=>state.selected.filter(x=>x.manufacturer==='Resigres'&&x.resigresModel==='Tiroirs sur mesure').at(-1));
    check('Tiroirs avec top : prix total exact enregistré dans le projet',
      drawerSaved?.price===3749&&drawerSaved.resigresConfiguration?.topType==='separate');

    await resProduct('Tiroirs sur mesure','furniture');
    await page.locator('[data-rgdraw-height="30"]').click();
    await page.locator('[data-rgdraw-variant="h30-single"]').click();
    await page.locator('#rgdrawLength').fill('100');
    await page.locator('#rgdrawDepth').fill('50');
    await page.locator('[data-rgdraw-material="lacquer"]').click();
    await page.locator('#rgdrawColor').selectOption('Arena');
    await page.locator('[data-rgdraw-top="integrated"]').click();
    await page.locator('#rgdrawTopMaterial').selectOption('lacquer');
    await page.waitForFunction(()=>document.querySelector('#resigresConfigurator')?._q?.total===848);
    check('Tiroirs H30 simple : caisson 718 + top intégré 130',
      (await page.evaluate(()=>document.querySelector('#resigresConfigurator')._q)).topPrice===130);
    await page.locator('.rg50-confirm').click();
    report.resigresDrawers={doubleTotal:drawersQuote.total,singleTotal:848};

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

    // V11.62.3: exercise actual browser route, beyond static unit checks.
    const guideDocs=await page.evaluate(()=>{
      const synthetic={manufacturer:'Hotbath',reference:'TEST-DOCUMENTS',base:'TEST-DOCUMENTS',
        designation:'Test conservation fichiers fabricant',category:'Lavabo',price:555,totalPrice:555,
        technicalSheetUrl:'https://hotbath.it/tests/specs.pdf',installationGuideUrl:'https://hotbath.it/tests/installation.pdf',
        drawingUrl:'https://hotbath.it/tests/drawing.pdf'};
      const rec=createSelectedProductRecord(synthetic,state.rooms[0]?.id||'');
      return {sheet:rec.technicalSheetUrl,installation:rec.installationGuideUrl,drawing:rec.drawingUrl};
    });
    check('PDF fabricant conservé à ajout',guideDocs.sheet.endsWith('/specs.pdf')&&guideDocs.installation.endsWith('/installation.pdf')&&guideDocs.drawing.endsWith('/drawing.pdf'));
    await page.waitForFunction(()=>CATALOG.some(p=>p.manufacturer==='Hotbath'&&p.collection==='Archie'),{timeout:20000});
    await page.evaluate(()=>{
      showView('catalog');
      const select=document.querySelector('#manufacturerFilter');
      select.value='Hotbath';select.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await page.waitForSelector('.manufacturer-guide-open');
    await page.locator('.manufacturer-guide-open').click();
    await page.waitForSelector('#manufacturerGuidedSelector');

    await page.waitForSelector('#manufacturerGuidedSelector [data-choose="collection"][data-value="Cobber"]');
    check('galerie Hotbath : 12 collections officielles',await page.locator('#manufacturerGuidedSelector [data-choose="collection"]').count()===12);
    await page.locator('#manufacturerGuidedSelector [data-choose="collection"][data-value="Cobber"]').click();
    await page.waitForSelector('#manufacturerGuidedSelector [data-choose="category"][data-value="3593"]');
    check('Cobber : catégories officielles présentes',await page.locator('#manufacturerGuidedSelector [data-choose="category"]').count()>=6);
    await page.locator('#manufacturerGuidedSelector [data-choose="category"][data-value="3593"]').click();
    await page.waitForSelector('#manufacturerGuidedSelector [data-choose="model"][data-value="CB003C"]');
    for(const code of ['CB003C','CB003S','CB003MC','CB003MS']){
      check('Référence officielle Cobber '+code,await page.locator('#manufacturerGuidedSelector [data-choose="model"][data-value="'+code+'"]').count()===1);
    }
    const cobberImages=await page.locator('#manufacturerGuidedSelector .mg-official-gallery img').count();
    check('Galerie officielle Cobber contient plusieurs visuels',cobberImages>=5);
    const cobberPhoto=page.locator('#manufacturerGuidedSelector [data-choose="model"][data-value="CB003C"] img');
    const cobberLoaded=await cobberPhoto.evaluate(async img=>{
      if(!img.complete)await Promise.race([new Promise(resolve=>{
        img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});
      }),new Promise(resolve=>setTimeout(resolve,12000))]);
      return img.complete&&img.naturalWidth>0;
    });
    check('CB003C : photo constructeur chargée dans Chromium',cobberLoaded);
    await page.locator('#manufacturerGuidedSelector [data-step="collections"]').click();
    await page.locator('#manufacturerGuidedSelector [data-choose="collection"][data-value="Archie"]').click();
    await page.waitForSelector('#manufacturerGuidedSelector [data-choose="category"][data-value="3570"]');
    await page.locator('#manufacturerGuidedSelector [data-choose="category"][data-value="3570"]').click();
    await page.waitForSelector('#manufacturerGuidedSelector [data-choose="model"][data-value="AR088"] img');
    const arPhoto=page.locator('#manufacturerGuidedSelector [data-choose="model"][data-value="AR088"] img');
    const src=await arPhoto.getAttribute('src');
    check('Archie AR088 : nouvelle source officielle',src?.includes('hotbath.com/images/compano/AR088/'));
    const arLoaded=await arPhoto.evaluate(async img=>{
      if(!img.complete)await Promise.race([new Promise(resolve=>{
        img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});
      }),new Promise(resolve=>setTimeout(resolve,12000))]);
      return img.complete&&img.naturalWidth>0;
    });
    check('Archie AR088 : photo chargée',arLoaded);
    await page.locator('#manufacturerGuidedSelector [data-step="categories"]').click();
    await page.locator('#manufacturerGuidedSelector [data-choose="category"][data-value="3521"]').click();
    await page.waitForSelector('#manufacturerGuidedSelector [data-choose="model"]');
    // V11.63.2 — test image actuelle du fabricant, pas un ancien lien historique susceptible de répondre 404.
    check('Hotbath : grille photographique spécifique, sans bandeau opaque',
      await page.locator('#manufacturerGuidedSelector').evaluate(x=>x.classList.contains('mg-hotbath-official')&&x.dataset.stage==='models'));
    const modelCard=page.locator('#manufacturerGuidedSelector [data-choose="model"][data-value="AR033"]');
    const srcAR033=await modelCard.locator('img').getAttribute('src');
    check('Archie AR033 : photographie réellement vérifiée sur le CDN actuel',srcAR033?.includes('hotbath.com/images/compano/AR033/')&&/AR033IX/.test(srcAR033));
    const productLoaded=await modelCard.locator('img').evaluate(async img=>{
      if(!img.complete)await Promise.race([new Promise(resolve=>{
        img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});
      }),new Promise(resolve=>setTimeout(resolve,15000))]);
      return img.complete&&img.naturalWidth>0;
    });
    check('Archie AR033 : photo fabricant réellement affichée',productLoaded);
    const styleCheck=await modelCard.evaluate(el=>{
      const meta=getComputedStyle(el.querySelector('.mg-tile-meta'));
      const img=getComputedStyle(el.querySelector('.mg-tile-photo img'));
      return meta.position==='static'&&img.objectFit==='contain';
    });
    check('Hotbath : référence sous image, objet non recadré',styleCheck);
    check('Archie AR003M et AR014 toujours présents, sans prétendre que les anciens liens sont accessibles',
      await page.locator('#manufacturerGuidedSelector [data-choose="model"][data-value="AR003M"]').count()===1&&
      await page.locator('#manufacturerGuidedSelector [data-choose="model"][data-value="AR014"]').count()===1);
    const pricedCards=await page.locator('#manufacturerGuidedSelector [data-choose="model"][data-priced="true"]').count();
    check('Au moins une référence Archie a un tarif importé',pricedCards>0);
    await page.locator('#manufacturerGuidedSelector [data-choose="model"][data-priced="true"]').first().click();
    await page.waitForSelector('#manufacturerGuidedSelector #hb-finish');
    const ref=await page.locator('#manufacturerGuidedSelector #hb-finish').inputValue();
    const detail=await page.locator('#manufacturerGuidedSelector .mg-finalref').innerText();
    check('Référence tarifaire Hotbath conservée',ref&&detail.includes(ref));
    await page.locator('#manufacturerGuidedSelector .mg-close').click();

    // V11.64 — Gessi-inspired guide validation in a REAL Chromium DOM on desktop/mobile.
    // Synthetic tariff rows are used so the exact selected object and price can be asserted
    // without mutating a user project. Official finish imagery is resolved by existing assets.
    for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
      await page.setViewportSize(viewport);
      for(const spec of [
        {brand:'Lefroy Brooks',collection:'1900 Classic',base:'BL1185',first:'BL1185-CP',second:'BL1185-NK',finish1:'CP',finish2:'NK'},
        {brand:'Zucchetti',collection:'Octo',base:'ZOC564',first:'ZOC564.C40',second:'ZOC564.C50',finish1:'C40',finish2:'C50'}
      ]){
        await page.evaluate(spec=>{
          const rows=[
            {manufacturer:spec.brand,collection:spec.collection,base:spec.base,reference:spec.first,finishCode:spec.finish1,finish:'Finition 1',designation:'Mitigeur d’essai',category:'Lavabo',price:411,totalPrice:411},
            {manufacturer:spec.brand,collection:spec.collection,base:spec.base,reference:spec.second,finishCode:spec.finish2,finish:'Finition 2',designation:'Mitigeur d’essai',category:'Lavabo',price:522,totalPrice:522}
          ];
          window.__visualGuideRows=rows;window.__visualGuideAdded=null;
          HydroManufacturerGuide.open(spec.brand,rows,'browser-test',p=>{
            window.__visualGuideAdded={same:rows.includes(p),reference:p.reference,price:p.price};
          });
        },spec);
        await page.locator('#manufacturerGuidedSelector [data-go="collection"]').first().click();
        await page.locator('#manufacturerGuidedSelector [data-go="category"]').first().click();
        await page.locator('#manufacturerGuidedSelector [data-go="model"]').first().click();
        const tiles=page.locator('#manufacturerGuidedSelector [data-mg-finish]');
        await tiles.first().waitFor();
        check('V11.64 deux variantes visuelles '+spec.brand+' '+viewport.width,await tiles.count()===2);
        const first=page.locator('#manufacturerGuidedSelector [data-mg-finish]').first();
        const second=page.locator('#manufacturerGuidedSelector [data-mg-finish]').last();
        check('V11.64 sélection initiale '+spec.brand,await first.getAttribute('aria-pressed')==='true');
        await second.click();
        check('V11.64 finition/référence mise à jour '+spec.brand,
          await second.getAttribute('aria-pressed')==='true'&&
          (await page.locator('#manufacturerGuidedSelector .mg-finalref').innerText()).includes(spec.second));
        check('V11.64 prix original '+spec.brand,(await page.locator('#manufacturerGuidedSelector .mg-price').innerText()).includes('522'));
        check('V11.64 une photographie principale maximum '+spec.brand,
          await page.locator('#manufacturerGuidedSelector .mg-photo img').count()<=1);
        const layout=await page.locator('#manufacturerGuidedSelector').evaluate(x=>({
          overflow:x.querySelector('.mg-dialog').scrollWidth>x.querySelector('.mg-dialog').clientWidth,
          background:getComputedStyle(x.querySelector('.mg-header')).backgroundColor,
          grid:getComputedStyle(x.querySelector('.mg-visual-finishes')).display
        }));
        check('V11.64 présentation harmonisée sans débordement '+spec.brand+' '+viewport.width,
          !layout.overflow&&layout.background==='rgb(33, 36, 32)'&&layout.grid==='grid');
        await page.locator('#manufacturerGuidedSelector #mgAdd').click();
        const added=await page.evaluate(()=>window.__visualGuideAdded);
        check('V11.64 ajout conserve objet et prix '+spec.brand,
          added?.same&&added.reference===spec.second&&added.price===522);
      }
    }
    await page.setViewportSize({width:1440,height:1000});


    // V11.64.8 — entrypoint visible in the catalogue, before choosing a priced SKU.
    await page.evaluate(()=>{
      const selector=document.querySelector('#manufacturerFilter');
      selector.value='Hidrobox';
      selector.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await page.waitForSelector('.hidrobox-catalog-launcher .hidrobox-category-open',{timeout:20000});
    check('Hidrobox visible catalogue launcher: nine clickable product types',
      await page.locator('.hidrobox-catalog-categories .hidrobox-category-open').count()===9);
    await page.locator('.hidrobox-catalog-categories [data-hidrobox-category="vasques-a-poser"]').click();
    await page.waitForSelector('#hidroboxGuided [data-kind="collection"][data-choice="spot"]',{timeout:20000});
    check('Hidrobox direct category opens the official Spot washbasin collection',
      await page.locator('#hidroboxGuided [data-kind="collection"]').count()===1);
    await page.locator('#hidroboxGuided [data-hidrobox-home]').click();
    await page.locator('#hidroboxGuided [data-kind="family"][data-choice="bains-encastres"]').click();
    check('Hidrobox navigation changes from washbasins to two built-in bathtub collections',
      JSON.stringify(await page.locator('#hidroboxGuided [data-kind="collection"]').evaluateAll(xs=>xs.map(x=>x.dataset.choice)))===
      JSON.stringify(['beta-fusion','beta-evoque']));
    await page.locator('#hidroboxGuided .hidrobox-close').click();
    await page.evaluate(()=>{
      const selector=document.querySelector('#manufacturerFilter');
      selector.value='';
      selector.dispatchEvent(new Event('change',{bubbles:true}));
    });

    // V11.63.3 — real Chromium navigation to the official manufacturer CAD links.
    await page.evaluate(()=>HydroHidroboxConfigurator.open({manufacturer:'Hidrobox'},state.rooms[0]?.id||''));
    await page.waitForSelector('#hidroboxGuided [data-kind="family"][data-choice="receveurs"]',{timeout:20000});
    check('Hidrobox official : nine product classes, in website order',
      JSON.stringify(await page.locator('#hidroboxGuided [data-kind="family"]').evaluateAll(xs=>xs.map(x=>x.dataset.choice)))===
      JSON.stringify(['receveurs','panneaux','accessoires','vasques-suspendues','vasques-a-poser','vasques-sur-pied','plans','bains-ilot','bains-encastres']));
    await page.locator('#hidroboxGuided [data-kind="family"][data-choice="receveurs"]').click();
    check('Hidrobox official : 11 shower collections and real site order',
      JSON.stringify(await page.locator('#hidroboxGuided [data-kind="collection"]').evaluateAll(xs=>xs.map(x=>x.dataset.choice)))===
      JSON.stringify(['neo-plus','line','twins','one','pure','quadro','arq','unique','iconik','loovers','falcon']));
    // V11.64.7 — each photograph belongs to one verified official collection, never all SKUs.
    check('Hidrobox 30 photos officielles vérifiées, Falcon en repli neutre',
      await page.evaluate(()=>Object.keys(HydroManufacturerMediaIndex.files.Hidrobox).length)===30&&
      await page.locator('#hidroboxGuided [data-kind="collection"] img').count()===10&&
      await page.locator('#hidroboxGuided [data-kind="collection"][data-choice="falcon"] img').count()===0);
    check('Hidrobox Neo Plus et Line : deux photos constructeur distinctes',
      (await page.locator('#hidroboxGuided [data-kind="collection"][data-choice="neo-plus"] img').getAttribute('src'))?.includes('Neo-Plus_Thumbnail')&&
      (await page.locator('#hidroboxGuided [data-kind="collection"][data-choice="line"] img').getAttribute('src'))?.includes('Line_Thumbnail')&&
      await page.locator('#hidroboxGuided .hidrobox-photo-scope').count()===10);
    await page.locator('#hidroboxGuided [data-kind="collection"]').filter({hasText:'Neo Plus'}).first().click();
    await page.waitForSelector('#hidroboxGuided a[href$="BIMobject-Shower-tray-Neo-Plus.zip"]');
    check('Hidrobox Neo Plus : lien BIM officiel visible',
      await page.locator('#hidroboxGuided a[href$="BIMobject-Shower-tray-Neo-Plus.zip"]').getAttribute('target')==='_blank');
    check('Hidrobox Neo Plus : exemple 3D de la bonne taille identifié',
      await page.locator('#hidroboxGuided a[href$="Neo-Plus-80x140x3-1.zip"]').innerText().then(s=>s.includes('80 × 140 × 3 cm')));
    check('Hidrobox Neo Plus : photo de collection et non catégorie',
      (await page.locator('#hidroboxGuided .hidrobox-neo-hero img').getAttribute('src'))?.includes('Neo-Plus_Thumbnail')&&
      (await page.locator('#hidroboxGuided .hidrobox-neo-hero small').innerText()).includes('non contractuelles'));
    // V11.64.4 visual choice controls: real DOM and existing Neo Plus tariff engine.
    const neoMaterial=page.locator('#hidroboxGuided [data-hidrobox-target="hnMaterial"]');
    check('Hidrobox Neo Plus : matière par cartes visuelles',await neoMaterial.count()===2);
    const neoScene=page.locator('#hidroboxGuided [data-hidrobox-target="hnMaterial"][data-hidrobox-value="Scene"]');
    await neoScene.click();
    check('Hidrobox Neo Plus : carte met à jour le select tarifaire et le groupe de couleur',
      (await page.locator('#hidroboxGuided #hnMaterial').inputValue())==='Scene'&&
      (await page.locator('#hidroboxGuided #hnGroup').inputValue())==='BLA'&&
      (await page.locator('#hidroboxGuided [data-hidrobox-target="hnMaterial"][aria-pressed="true"]').count())===1);
    await page.locator('#hidroboxGuided [data-hidrobox-target="hnMaterial"][data-hidrobox-value="Kromat"]').click();
    check('Hidrobox Neo Plus : retour à Kromat rétablit sa matrice de couleurs',
      (await page.locator('#hidroboxGuided #hnMaterial').inputValue())==='Kromat'&&
      (await page.locator('#hidroboxGuided #hnGroup').inputValue())==='BAS');
    await page.locator('[data-hidrobox-target="hnForm"][data-hidrobox-value="angularL"]').click();
    check('Neo Plus Angular L only offers the published Ardoise texture and exact reference',
      await page.locator('#hnTexture').inputValue()==='Ardoise'&&
      await page.locator('#hnTexture option').count()===1&&
      (await page.locator('#hidroboxGuided .hidrobox-result').innerText()).includes('SNEC0181')&&
      await page.locator('#hnAdd').isEnabled());
    await page.locator('#hidroboxGuided .hidrobox-back').click();
    await page.locator('#hidroboxGuided [data-kind="collection"]').filter({hasText:'Line'}).first().click();
    await page.waitForSelector('#hidroboxGuided a[href$="STL-Line-Hidrobox.zip"]');
    check('Hidrobox Line : BIM et modèle 3D de famille affichés',
      await page.locator('#hidroboxGuided a[href$="BIMobject-Shower-tray-Line-X-Scene-Smooth.zip"]').count()===1 &&
      await page.locator('#hidroboxGuided a[href$="STL-Line-Hidrobox.zip"]').count()===1);
    check('Hidrobox Line : options de dimensions et de matière conservées',
      await page.locator('#hidroboxGuided [data-facet]').count()>0&&
      await page.locator('#hidroboxGuided .hidrobox-neo-hero img').count()<=1);
    // Product tree must branch into actual supplier collections, not a flat tariff list.
    await page.locator('#hidroboxGuided [data-hidrobox-home]').click();
    await page.locator('#hidroboxGuided [data-kind="family"][data-choice="vasques-suspendues"]').click();
    check('Hidrobox official : 9 wall-mounted washbasin collections',
      await page.locator('#hidroboxGuided [data-kind="collection"]').count()===9);
    await page.locator('#hidroboxGuided [data-kind="collection"][data-choice="program"]').click();
    await page.waitForSelector('#hidroboxGuided [data-hp-number="length"]',{timeout:20000});
    check('Hidrobox Program : dedicated dimension-based tariff and options',
      await page.locator('#hidroboxGuided [data-hp-number]').count()>0&&
      await page.locator('#hidroboxGuided #huAdd').isEnabled()&&
      (await page.locator('#hidroboxGuided .hidrobox-tree-path').innerText()).includes('Program'));
    check('Program uses a plan reference, never a standalone option as the complete product',
      (await page.locator('#hidroboxGuided .hp-breakdown').innerText()).includes('WPRC0043'));
    await page.locator('[data-hp-number="length"]').fill('140');
    await page.locator('[data-hp-number="length"]').press('Tab');
    await page.locator('[data-hp-select="additional"]').selectOption('S25');
    await page.locator('[data-hp="curve"][data-value="LR"]').click();
    await page.locator('[data-hp-select="tap"]').selectOption('OPWB0007');
    check('Program additive pricing and single uplift are visible',
      (await page.locator('#hidroboxGuided .hidrobox-result b').innerText()).replace(/[\s\u202f\u00a0]/g,'').includes('1526,72'));
    await page.locator('[data-hp-number="depth"]').fill('60');
    await page.locator('[data-hp-number="depth"]').press('Tab');
    check('Curve rejects an incompatible depth',await page.locator('#huAdd').isDisabled());
    await page.locator('[data-hp-number="depth"]').fill('50');
    await page.locator('[data-hp-number="depth"]').press('Tab');
    check('Hidrobox Program : photo liée à la collection, sans fausse finition exacte',
      (await page.locator('#hidroboxGuided .hidrobox-neo-hero img').getAttribute('src'))?.includes('Washbasin_Program_Thumbnail')&&
      (await page.locator('#hidroboxGuided .hidrobox-neo-hero small').innerText()).includes('non contractuelles'));
    await page.locator('#hidroboxGuided #huAdd').click();
    const programSaved=await page.evaluate(()=>{
      const p=state.selected.findLast(p=>p.hidroboxConfiguration?.type==='program-2026');
      return JSON.parse(JSON.stringify(p));
    });
    check('Program composition preserves dimensions, source components, reference and total',
      programSaved.reference==='WPRC0044'&&programSaved.price===1526.72&&
      programSaved.hidroboxConfiguration.length===140&&programSaved.hidroboxConfiguration.depth===50&&
      programSaved.hidroboxConfiguration.additional==='S25'&&programSaved.hidroboxConfiguration.curve==='LR'&&
      programSaved.hidroboxConfiguration.components.some(c=>c.reference==='OPWB0001'&&c.rawPrice===215));
    await page.evaluate(p=>HydroHidroboxConfigurator.open(p,p.roomId),programSaved);
    await page.locator('#hidroboxGuided [data-kind="collection"][data-choice="program"]').click();
    check('Saved Program configuration reopens without resetting dimensions or options',
      await page.locator('[data-hp-number="length"]').inputValue()==='140'&&
      await page.locator('[data-hp-select="additional"]').inputValue()==='S25'&&
      await page.locator('[data-hp="curve"][data-value="LR"]').getAttribute('aria-pressed')==='true');
    await page.locator('#hidroboxGuided .hidrobox-back').click();
    await page.locator('#hidroboxGuided [data-kind="collection"][data-choice="intim"]').click();
    check('Hidrobox Intim : private site collection has no fictitious quote item',
      await page.locator('#hidroboxGuided .hidrobox-unpriced-collection').count()===1&&
      await page.locator('#hidroboxGuided #huAdd').count()===0);
    check('Hidrobox Intim : photo officielle conservée malgré tarif non importé',
      (await page.locator('#hidroboxGuided .hidrobox-unpriced-photo img').getAttribute('src'))?.includes('Washbasin_Intim_Thumbnail')&&
      await page.locator('#hidroboxGuided #huAdd').count()===0);
    await page.locator('#hidroboxGuided [data-hidrobox-home]').click();
    await page.locator('#hidroboxGuided [data-kind="family"][data-choice="bains-ilot"]').click();
    await page.locator('#hidroboxGuided [data-kind="collection"][data-choice="space"]').click();
    await page.waitForSelector('#hidroboxGuided .hidrobox-space [data-hs="sizeId"]',{timeout:20000});
    check('Hidrobox Space : only three catalogue dimensions (not 40 × 50)',
      JSON.stringify(await page.locator('#hidroboxGuided [data-hs="sizeId"]').evaluateAll(xs=>xs.map(x=>x.dataset.value)))===
      JSON.stringify(['155','170','180'])&&
      await page.locator('#hidroboxGuided [data-hs="sizeId"]').count()===3);
    check('Hidrobox Space : exact white 155 × 78 × 50, no overflow reference',
      (await page.locator('#hidroboxGuided .hidrobox-result').innerText()).includes('BSPC0001')&&
      (await page.locator('#hidroboxGuided .hidrobox-result').innerText()).replace(/[\s\u202f\u00a0]/g,'').includes('3616,08'));
    await page.locator('[data-hs="sizeId"][data-value="170"]').click();
    await page.locator('[data-hs="colour"][data-value="BAS"]').click();
    await page.locator('[data-hs="overflow"][data-value="true"]').click();
    check('Hidrobox Space : 170 Plus Colour Basics with overflow price and ref',
      (await page.locator('#hidroboxGuided .hidrobox-result').innerText()).includes('BSPC0010')&&
      (await page.locator('#hidroboxGuided .hidrobox-result').innerText()).replace(/[\s\u202f\u00a0]/g,'').includes('5784,48'));
    check('Hidrobox Space : no additional exterior colour on Plus Colour',
      await page.locator('#hidroboxGuided [data-hs-select="exterior"]').count()===0);
    await page.locator('#hidroboxGuided #huAdd').click();
    const savedSpace=await page.evaluate(()=>JSON.parse(JSON.stringify(state.selected.findLast(p=>p.hidroboxConfiguration?.type==='space-2026'))));
    check('Hidrobox Space : saves correct reference, dimensions and public tariff',
      savedSpace.reference==='BSPC0010'&&savedSpace.rawTariffPrice===5562&&
      savedSpace.price===5784.48&&savedSpace.hidroboxConfiguration.dimensions.length===170&&
      savedSpace.hidroboxConfiguration.dimensions.width===80&&
      savedSpace.hidroboxConfiguration.overflow===true);
    await page.evaluate(p=>HydroHidroboxConfigurator.open(p,p.roomId),savedSpace);
    await page.locator('#hidroboxGuided [data-kind="collection"][data-choice="space"]').click();
    await page.waitForSelector('#hidroboxGuided [data-hs="sizeId"][data-value="170"]');
    check('Hidrobox Space : saved composition reopens unchanged',
      await page.locator('[data-hs="sizeId"][data-value="170"]').getAttribute('aria-pressed')==='true'&&
      await page.locator('[data-hs="colour"][data-value="BAS"]').getAttribute('aria-pressed')==='true'&&
      await page.locator('[data-hs="overflow"][data-value="true"]').getAttribute('aria-pressed')==='true');
    await page.locator('#hidroboxGuided .hidrobox-back').click();
    // Previously checked: Beta Evoque in freestanding category.

    check('Hidrobox official : Beta Evoque appears in the freestanding bath branch',
      await page.locator('#hidroboxGuided [data-kind="collection"][data-choice="beta-evoque"]').count()===1);
    await page.locator('#hidroboxGuided [data-kind="collection"][data-choice="beta-evoque"]').click();
    await page.waitForSelector('#hidroboxGuided .hidrobox-beta-evoque [data-hbev="position"]',{timeout:20000});
    check('Hidrobox Beta Evoque : three visual positions, six published base refs',
      await page.locator('#hidroboxGuided [data-hbev="position"]').count()===3&&
      (await page.locator('#hidroboxGuided .hidrobox-result').innerText()).includes('BBEC0104')&&
      await page.locator('#hidroboxGuided #huAdd').isEnabled());
    await page.locator('[data-hbev="position"][data-value="C"]').click();
    await page.locator('[data-hbev="overflow"][data-value="true"]').click();
    await page.locator('#hidroboxGuided [data-hbev-select="exterior"]').selectOption('OPBT0008');
    check('Hidrobox Beta Evoque : contradictory 650/666 source price blocks quoting',
      await page.locator('#hidroboxGuided #huAdd').isDisabled()&&
      (await page.locator('#hidroboxGuided .hp-errors').innerText()).includes('650')&&
      (await page.locator('#hidroboxGuided .hp-errors').innerText()).includes('666'));
    await page.locator('#hidroboxGuided [data-hbev-select="exterior"]').selectOption('OPBT0009');
    await page.locator('#hidroboxGuided [data-hbev-select="headrest"]').selectOption('OPBT0016');
    check('Hidrobox Beta Evoque : C with overflow plus Special colour and graphite headrest',
      (await page.locator('#hidroboxGuided .hidrobox-result').innerText()).includes('BBEC0108')&&
      (await page.locator('#hidroboxGuided .hidrobox-result b').innerText()).replace(/[\\s\\u202f\\u00a0]/g,'').includes('5870,80')&&
      await page.locator('#hidroboxGuided #huAdd').isEnabled());
    await page.locator('#hidroboxGuided #huAdd').click();
    const evoqueSaved=await page.evaluate(()=>JSON.parse(JSON.stringify(state.selected.findLast(p=>p.hidroboxConfiguration?.type==='beta-evoque-2026'))));
    check('Hidrobox Beta Evoque : exact source reference, sum and options survive project save',
      evoqueSaved.reference==='BBEC0108'&&evoqueSaved.price===5870.8&&
      evoqueSaved.hidroboxConfiguration.position==='C'&&evoqueSaved.hidroboxConfiguration.overflow===true&&
      evoqueSaved.hidroboxConfiguration.components.some(c=>c.reference==='OPBT0009'&&c.rawPrice===984));
    await page.evaluate(p=>HydroHidroboxConfigurator.open(p,p.roomId),evoqueSaved);
    await page.locator('#hidroboxGuided [data-kind="collection"][data-choice="beta-evoque"]').click();
    await page.waitForSelector('#hidroboxGuided .hidrobox-beta-evoque');
    check('Hidrobox Beta Evoque : saved C/overflow/Special colour restores correctly',
      await page.locator('[data-hbev="position"][data-value="C"]').getAttribute('aria-pressed')==='true'&&
      await page.locator('[data-hbev="overflow"][data-value="true"]').getAttribute('aria-pressed')==='true'&&
      await page.locator('[data-hbev-select="exterior"]').inputValue()==='OPBT0009');
    await page.locator('#hidroboxGuided [data-hidrobox-home]').click();
    await page.locator('#hidroboxGuided [data-kind="family"][data-choice="bains-encastres"]').click();
    check('Hidrobox official : Beta Evoque also appears in built-in baths',
      JSON.stringify(await page.locator('#hidroboxGuided [data-kind="collection"]').evaluateAll(xs=>xs.map(x=>x.dataset.choice)))===
      JSON.stringify(['beta-fusion','beta-evoque']));
    await page.locator('#hidroboxGuided [data-hidrobox-home]').click();
    await page.setViewportSize({width:390,height:844});
    const mobile=await page.locator('#hidroboxGuided .hidrobox-guide').evaluate(x=>({
      clientWidth:x.clientWidth,scrollWidth:x.scrollWidth,
      offenders:[...x.querySelectorAll('*')].filter(el=>el.getBoundingClientRect().right>x.getBoundingClientRect().right+2).slice(0,5).map(el=>({tag:el.tagName,cls:el.className,right:Math.round(el.getBoundingClientRect().right)}))
    }));
    if(mobile.scrollWidth>mobile.clientWidth)console.error('HIDROBOX_MOBILE_OVERFLOW',JSON.stringify(mobile));
    check('Hidrobox official tree : no horizontal overflow on mobile 390',mobile.scrollWidth<=mobile.clientWidth);
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('#hidroboxGuided .hidrobox-close').click();

    // V11.64.4 — Sbordoni photographic collection selection without touching composition prices.
    await page.waitForFunction(()=>CATALOG.some(p=>p.manufacturer==='Sbordoni'&&p.reference==='9065/1'),{timeout:20000});
    await page.evaluate(()=>{
      const p=CATALOG.find(p=>p.manufacturer==='Sbordoni'&&p.reference==='9065/1');
      HydroSbordoniConfigurator.open(p,state.rooms[0]?.id||'');
    });
    await page.locator('#sbordoniConfigurator [data-sbordoni-collection="Palladio"]').waitFor();
    check('Sbordoni : 4 collections photographiques',await page.locator('#sbordoniConfigurator .sbordoni-collection-card').count()===4);
    check('Sbordoni : une seule photo du résultat',await page.locator('#sbordoniConfigurator .sbordoni-result-photo img').count()<=1);
    await page.locator('#sbordoniConfigurator [data-sbordoni-collection="Palladio"]').click();
    check('Sbordoni : clic collection actualise la configuration',
      (await page.locator('#sbordoniConfigurator .sbordoni-collection-select').inputValue())==='Palladio'&&
      (await page.locator('#sbordoniConfigurator [data-sbordoni-collection="Palladio"]').getAttribute('aria-pressed'))==='true'&&
      await page.locator('#sbordoniConfigurator .sbordoni-config-summary').count()===0);
    await page.locator('#sbordoniConfigurator .sbordoni-config-close').click();

    const mobileTreeOverflow=async()=>{
      const d=await page.locator('#brandConfigurator .recor-configurator').evaluate(x=>({
        ok:x.scrollWidth<=x.clientWidth,client:x.clientWidth,scroll:x.scrollWidth,
        offenders:[...x.querySelectorAll('*')].filter(n=>n.getBoundingClientRect().right>x.getBoundingClientRect().right+2).slice(0,6).map(n=>({tag:n.tagName,cls:String(n.className).slice(0,55),right:Math.round(n.getBoundingClientRect().right)}))
      }));
      if(!d.ok)console.error('BRAND_TREE_MOBILE_OVERFLOW',JSON.stringify(d));
      return d.ok;
    };
    // V11.64.6 — Bette official taxonomy before the existing 62,264-variant selector.
    await page.evaluate(()=>HydroBetteConfigurator.open({manufacturer:'Bette'},state.rooms[0]?.id||''));
    await page.waitForSelector('#brandConfigurator [data-bette-family="showers"]');
    check('Bette : 6 rubriques fabricant',await page.locator('#brandConfigurator [data-bette-family]').count()===6);
    await page.setViewportSize({width:390,height:844});
    check('Bette : arborescence sans débordement mobile 390',
      await mobileTreeOverflow());
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('#brandConfigurator [data-bette-family="baths"]').click();
    check('Bette : filtres officiels Type, Forme et Fonction disponibles',
      await page.locator('#brandConfigurator .brand-official-facets h3').allTextContents().then(a=>['Type','Forme','Fonction'].every(x=>a.includes(x))));
    check('Bette : aucune classification fictive des variantes comme officielles',
      await page.locator('#brandConfigurator .brand-note').first().innerText().then(x=>x.includes('aucune correspondance')));
    await page.locator('#brandConfigurator [data-bette-facet="baignoires-ilot"]').click();
    check('Bette : vraie navigation interne catégorie puis type',
      await page.locator('#brandConfigurator [data-bette-back="sections"]').count()===1&&
      await page.locator('#brandConfigurator .brand-category-grid [data-bette-group]').count()>0);
    check('Bette : pas de filtre de type inventé si le tarif est non renseigné',
      await page.locator('#brandConfigurator .brand-note').first().innerText().then(x=>x.includes('sans prétendre à un filtrage exact')));
    await page.locator('#brandConfigurator [data-bette-back="sections"]').click();
    await page.locator('#brandConfigurator [data-bette-back="families"]').click();
    await page.locator('#brandConfigurator [data-bette-family="design"]').click();
    check('Bette : six gammes design officielles',await page.locator('#brandConfigurator [data-bette-facet-group="Gammes officielles"]').count()===6);
    await page.locator('#brandConfigurator [data-bette-facet="bettelux"]').click();
    check('Bette : BetteLux donne accès aux vraies familles tarifées de la gamme',
      await page.locator('#brandConfigurator [data-bette-group]').count()>0);
    await page.locator('#brandConfigurator [data-bette-back="sections"]').click();
    await page.locator('#brandConfigurator [data-bette-back="families"]').click();
    await page.locator('#brandConfigurator [data-bette-family="showers"]').click();
    await page.locator('#brandConfigurator [data-bette-unclassified]').click();
    check('Bette : les familles sans classement restent accessibles',await page.locator('#brandConfigurator [data-bette-back="sections"]').count()===1);
    await page.locator('#brandConfigurator .brand-config-close').click();

    // V11.63.4 — Carrodrain: choose real LOW/PRO variants and check
    // manufacturer-page PDF mapping without substituting neighbouring versions.
    await page.evaluate(()=>HydroCarrodrainConfigurator.open({manufacturer:'Carrodrain'},state.rooms[0]?.id||''));
    await page.waitForSelector('#brandConfigurator [data-carrodrain-family="Essentials"]',{timeout:20000});
    check('Carrodrain : Essentials, Invisibles, Liquids et accessoires distincts',await page.locator('#brandConfigurator [data-carrodrain-family]').count()===4);
    await page.setViewportSize({width:390,height:844});
    check('Carrodrain : familles sans débordement mobile 390',
      await mobileTreeOverflow());
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('#brandConfigurator [data-carrodrain-family="Essentials"]').click();
    await page.waitForSelector('#brandConfigurator [data-carrodrain-group="quattro-100"]');
    await page.locator('#brandConfigurator [data-carrodrain-group="quattro-100"]').click();
    await page.waitForSelector('#brandConfigurator #ccVersion');
    check('Carrodrain : versions LOW et PRO présentées en cartes',await page.locator('#brandConfigurator [data-brand-choice="ccVersion"]').count()===2);
    await page.locator('#brandConfigurator #ccVersion').selectOption('LOW');
    await page.waitForSelector('#brandConfigurator a[href*="Quattro_100_LOW_Technical_Specifications_2025.pdf"]');
    check('Carrodrain Quattro LOW : bonne fiche technique',
      await page.locator('#brandConfigurator a[href*="Quattro_100_LOW_Technical_Specifications_2025.pdf"]').count()===1);
    await page.locator('#brandConfigurator #ccVersion').selectOption('PRO');
    await page.waitForSelector('#brandConfigurator a[href*="Quattro_100_PRO_Technical_Specifications_2025.pdf"]');
    check('Carrodrain Quattro PRO : pas de fiche LOW substituée',
      await page.locator('#brandConfigurator a[href*="Quattro_100_PRO_Technical_Specifications_2025.pdf"]').count()===1 &&
      await page.locator('#brandConfigurator a[href*="Quattro_100_LOW_Technical_Specifications_2025.pdf"]').count()===0);
    await page.locator('#brandConfigurator .brand-config-close').click();

    // V11.62.6 — browser regression on actual Resigres Selene: verify
    // price on the visible product configuration and invalid dimension protection.
    await page.waitForFunction(()=>CATALOG.some(p=>p.manufacturer==='Resigres'&&p.resigresModel==='Selene'),{timeout:25000});
    await page.evaluate(()=>{
      showView('catalog');
      const p=CATALOG.find(x=>x.manufacturer==='Resigres'&&x.resigresModel==='Selene');
      addCatalogProduct(p.reference,state.rooms[0]?.id,productKey(p));
    });
    await page.waitForSelector('#resigresConfigurator .rg50-shape[data-shape="standard"]',{timeout:15000});
    await page.locator('#resigresConfigurator .rg50-shape[data-shape="standard"]').click();
    await page.locator('#rg50Mat').selectOption('solid-surface');
    await page.locator('#rg50Color').selectOption('S-Blanco');
    await page.locator('#rg50Group').selectOption('one');
    const orientation=await page.locator('#resigresConfigurator .v1146-field-grid').innerText();
    check('Selene : longueur puis profondeur correctement libellées',orientation.includes('Longueur du plan')&&orientation.includes('Profondeur du plan')&&orientation.indexOf('Longueur du plan')<orientation.indexOf('Profondeur du plan'));
    await page.locator('#rg50Length').fill('51');
    await page.locator('#rg50Width').fill('150');
    check('Selene : dimensions inversées ne sont pas tarifées',await page.locator('#rg50Price').innerText()==='—');
    check('Selene : saisie de prix manuel cachée sur dimension hors limite',await page.locator('#rg50ManualWrap').evaluate(x=>x.classList.contains('hidden')));
    check('Selene : bouton de récupération visible pour les dimensions inversées',await page.locator('#rg50SwapButton').isVisible());
    await page.locator('#rg50SwapButton').click();
    check('Selene : inversion rétablit bien longueur 150 / profondeur 51',
      await page.locator('#rg50Length').inputValue()==='150'&&await page.locator('#rg50Width').inputValue()==='51');
    const validPrice=await page.locator('#rg50Price').innerText();
    check('Selene : prix automatique 907 € HT en 51 × 150 cm',validPrice.includes('907'));
    check('Selene : aucun prix manuel demandé sur matrice certifiée',await page.locator('#rg50ManualWrap').evaluate(x=>x.classList.contains('hidden')));
    check('Selene : bouton de permutation masqué après correction',!(await page.locator('#rg50SwapButton').isVisible()));
    await page.locator('#resigresConfigurator .rg50-close').click();
    check('aucune erreur JavaScript',report.errors.length===0);
    await page.evaluate(()=>{document.querySelector('#manufacturerFilter').value='Sira Concrete';document.querySelector('#manufacturerFilter').dispatchEvent(new Event('change'));});
    await page.evaluate(()=>{const p=CATALOG.find(x=>x.manufacturer==='Sira Concrete'&&x.collection==='Wall Collection');addCatalogProduct(p.reference,state.rooms[0]?.id,productKey(p));});
    await page.waitForSelector('#siraTariffModal .sira-model');await page.screenshot({path:path.join(root,'docs/sira-configurator.png'),fullPage:false});
    console.log(JSON.stringify(report,null,2));
  }catch(e){report.failure=e.stack;console.error(JSON.stringify(report,null,2));process.exitCode=1;}
  finally{fs.writeFileSync(path.join(root,baseline?'../audit/browser-baseline-11560.json':process.env.PROFILE_ONLY?'../audit/profile-validation.json':'docs/browser-validation.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();fs.rmSync(dir,{recursive:true,force:true});}
})();
