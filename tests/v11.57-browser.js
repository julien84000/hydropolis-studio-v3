'use strict';

const assert=require('node:assert/strict');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {spawn}=require('child_process');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const port=10021;
const base=`http://127.0.0.1:${port}`;
const report={checks:[],errors:[]};
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};

(async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydropolis-v1157-browser-'));
  const server=spawn(process.execPath,['server.js'],{
    cwd:root,
    env:{...process.env,PORT:String(port),HYDRO_DATA_DIR:dir},
    stdio:['ignore','pipe','pipe']
  });
  let logs='';
  server.stderr.on('data',b=>{logs+=String(b)});
  let browser;
  try{
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Server startup: '+logs)),10000);
      server.stdout.on('data',b=>{if(String(b).includes(' on ')){clearTimeout(timer);resolve();}});
      server.on('error',reject);
    });

    const auth=await fetch(base+'/api/auth/setup',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:'Validation V11.57',username:'testv1157',password:'test-v1157-local'})
    }).then(r=>r.json());
    check('auth locale',!!auth.token);

    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'});
    page.on('pageerror',e=>report.errors.push(e.message));
    await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof CATALOG!=='undefined'&&CATALOG.length>0&&state?.rooms?.length,{timeout:30000});

    const gessi=await page.evaluate(()=>{
      const manufacturer=document.querySelector('#manufacturerFilter');
      manufacturer.value='Gessi';
      updateDependentFilters(true,true,true);
      const collection=document.querySelector('#collectionFilter');
      collection.value='Anello';
      updateDependentFilters(false,true,true);
      const category=document.querySelector('#categoryFilter');
      const categories=[...category.options].map(o=>o.value).filter(Boolean);
      category.value='Lavabo';
      updateDependentFilters(false,false,true);
      const type=document.querySelector('#typeFilter');
      const types=[...type.options].map(o=>o.value).filter(Boolean);
      if(types[0])type.value=types[0];
      const selectedType=type.value;
      const finish=document.querySelector('#finishFilter');
      const finishes=[...finish.options].map(o=>o.value).filter(Boolean);
      renderCatalog();
      const matching=CATALOG.filter(p=>p.manufacturer==='Gessi'&&p.collection==='Anello'&&p.category==='Lavabo'&&(!selectedType||p.productType===selectedType));
      return {categories,types,finishes,selectedType,matching:matching.length};
    });
    check('Gessi Anello expose la catégorie Lavabo',gessi.categories.includes('Lavabo'));
    check('Gessi Lavabo expose un niveau Type',gessi.types.length>0);
    check('Gessi Anello Lavabo retourne des références',gessi.matching>0);

    const target=await page.evaluate(()=>{
      const source=CATALOG.find(x=>x.manufacturer==='Amphora')||CATALOG[0];
      const rec=createSelectedProductRecord(source,state.rooms[0].id);
      state.selected=[rec];
      saveState();
      renderRooms();
      return {id:rec.id,reference:rec.reference};
    });
    check('article test créé',!!target.id);

    const toggle=page.locator(`.dossier-visibility-check[data-id="${target.id}"]`);
    await toggle.waitFor({state:'attached'});
    const label=page.locator(`label.article-dossier-toggle:has(.dossier-visibility-check[data-id="${target.id}"])`);
    await label.waitFor({state:'attached'});
    check('contrôle dossier monté dans la vue projet',await label.count()===1);
    check('contrôle dossier présent',await toggle.count()===1);
    check('article affiché par défaut dans le dossier',await toggle.isChecked());

    const before=await page.evaluate(id=>{
      const p=state.selected.find(x=>x.id===id);
      return {
        hidden:!!p?.hideFromDossier,
        inQuote:quoteRows().some(r=>r.sourceId===id),
        inDossier:selectedProductsForDocument().some(x=>x.id===id)
      };
    },target.id);
    check('état initial cohérent',!before.hidden&&before.inQuote&&before.inDossier);

    await toggle.uncheck({force:true});
    const after=await page.evaluate(id=>{
      const p=state.selected.find(x=>x.id===id);
      return {
        hidden:!!p?.hideFromDossier,
        inQuote:quoteRows().some(r=>r.sourceId===id),
        inDossier:selectedProductsForDocument().some(x=>x.id===id)
      };
    },target.id);
    check('article masqué du dossier',after.hidden&&!after.inDossier);
    check('article toujours présent dans le devis',after.inQuote);

    await page.evaluate(()=>renderRooms());
    check('choix dossier persistant après rendu',!(await page.locator(`.dossier-visibility-check[data-id="${target.id}"]`).isChecked()));

    const quoteStructure=await page.evaluate(()=>{
      const html=quotePages(1).html;
      return {room:html.includes('quote-room-row'),space:html.includes('quote-space-row')};
    });
    check('devis structuré par pièce',quoteStructure.room);
    check('devis structuré par espace',quoteStructure.space);

    const preload=await page.evaluate(async()=>{
      let host=document.querySelector('#document');
      if(!host){host=document.createElement('div');host.id='document';document.body.appendChild(host);}
      host.innerHTML='<img id="v1157-broken" src="/definitely-missing-v1157.png">';
      const broken=await waitForDocumentImages(750);
      host.innerHTML='<img id="v1157-good" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==">';
      const good=await waitForDocumentImages(750);
      return {broken:broken.failed.length,good:good.failed.length,total:good.total};
    });
    check('image cassée détectée avant PDF',preload.broken===1);
    check('image valide acceptée avant PDF',preload.good===0&&preload.total===1);
    check('aucune erreur JavaScript',report.errors.length===0);

    console.log(JSON.stringify(report,null,2));
  }catch(e){
    report.failure=e.stack;
    console.error(JSON.stringify(report,null,2));
    process.exitCode=1;
  }finally{
    await browser?.close();
    server.kill();
    fs.rmSync(dir,{recursive:true,force:true});
  }
})();
