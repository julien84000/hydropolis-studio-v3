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

    browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
    const page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'});
    page.on('pageerror',e=>report.errors.push(e.message));
    await page.addInitScript(token=>localStorage.setItem('hydropolis-auth-token',token),auth.token);
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof CATALOG!=='undefined'&&CATALOG.length>0&&state?.rooms?.length,{timeout:30000});
    await page.waitForFunction(()=>{
      const gessiCount=CATALOG.filter(p=>p.manufacturer==='Gessi').length;
      const maker=document.querySelector('#manufacturerFilter');
      return gessiCount===16211 && !!maker && [...maker.options].some(o=>o.value==='Gessi');
    },{timeout:30000});

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
      const scoped=CATALOG.filter(p=>p.manufacturer==='Gessi'&&p.collection==='Anello'&&p.category==='Lavabo');
      const rawTypes=[...new Set(scoped.map(p=>p.productType).filter(Boolean))];
      const matching=scoped.filter(p=>!selectedType||p.productType===selectedType);
      return {manufacturer:manufacturer.value,collection:collection.value,category:category.value,categories,types,rawTypes,finishes,selectedType,matching:matching.length,scoped:scoped.length};
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
        inDossier:selectedProductsForDocument(p?.roomId).some(x=>x.id===id)
      };
    },target.id);
    check('état initial cohérent',!before.hidden&&before.inQuote&&before.inDossier);

    await page.evaluate(()=>showView("project"));
    await toggle.waitFor({state:"visible"});
    await toggle.uncheck();
    const after=await page.evaluate(id=>{
      const p=state.selected.find(x=>x.id===id);
      return {
        hidden:!!p?.hideFromDossier,
        inQuote:quoteRows().some(r=>r.sourceId===id),
        inDossier:selectedProductsForDocument(p?.roomId).some(x=>x.id===id)
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

    const layout=await page.evaluate(()=>{
      state.rooms=[{id:'wc',title:'SDB 01',manual:[{label:'Bâti support ALCA',price:250,quantity:1}]},
        {id:'shower',title:' SDB  01 ',manual:[]},{id:'basin',title:'SDB 02',manual:[]}];
      const article=(id,roomId,designation,extra={})=>({id,roomId,designation,reference:id,manufacturer:'Sélection libre',quantity:1,price:100,quoteUnitOverride:100,quoteDiscountOverride:10,...extra});
      state.selected=[
        article('brush','wc','Wall mtd toilet brush & holder'),
        article('hygiene','wc','Douchette hygiénique'),
        article('toilet','wc','WC suspendu blanc mat'),
        article('paper','wc','Paper holder'),
        article('plate','wc','plaque de commande laiton brossé'),
        article('thermo','shower','Façade thermostatique à croisillons'),
        article('hand','shower','Douchette à main'),
        article('rough','shower','Corps encastré',{requiredRoughIn:true,accessoryFor:'thermo',quantity:2}),
        article('tray','shower','Receveur de douche'),
        article('screen','shower','Paroi de douche'),
        article('tap','basin','Mitigeur lavabo'),
        article('generic','basin','Accessoire de montage'),
        article('unclear','wc','Élément sur mesure')
      ];
      const snapshot=JSON.stringify({rooms:state.rooms,selected:state.selected});
      const rows=quoteRows(),editorRows=quoteEditorRows();
      renderQuoteEditor();
      const host=document.querySelector('#document');
      host.innerHTML=quotePages(1).html;
      const roomTitles=[...host.querySelectorAll('.quote-room-row')].map(el=>el.textContent.trim());
      const wcRefs=rows.filter(row=>row.space==='WC').map(row=>row.reference);
      const manual=rows.find(row=>row.manual);
      const sameRows=rows.every((row,i)=>row.sourceIndex===editorRows[i].sourceIndex && row.manualIndex===editorRows[i].manualIndex && row.roomId===editorRows[i].roomId && row.space===editorRows[i].space);
      const totals=rows.reduce((sum,row)=>sum+row.qty*row.netUnit,0);
      const headers=[...host.querySelectorAll('.quote-room-row td,.quote-space-row td')];
      const result={roomTitles,wcRefs,manualSpace:manual.space,count:rows.length,totals,sameRows,
        unchanged:snapshot===JSON.stringify({rooms:state.rooms,selected:state.selected}),
        noOther:!host.textContent.includes('Autres éléments')&&!document.querySelector('#quoteEditor').textContent.includes('Autres éléments'),
        left:headers.every(el=>getComputedStyle(el).textAlign==='left'),
        numericRight:getComputedStyle(host.querySelector('.quote-product-row td:last-child')).textAlign==='right',
        editorRooms:document.querySelectorAll('#quoteEditor .qe-room-group').length,
        roughSpace:rows.find(row=>row.sourceId==='rough').space,
        implicitSpace:rows.find(row=>row.sourceId==='generic').space,
        pages:host.querySelectorAll('.quote-page').length,
        continuation:!!host.querySelectorAll('.quote-page')[1]?.querySelector('.quote-space-row')};
      // Editing must still target the original room/product after display regrouping.
      result.targets=editorRows.every(row=>quoteEditorTarget({dataset:row.kind==='product'?{kind:'product',index:String(row.sourceIndex)}:{kind:'manual',room:row.roomId,manual:String(row.manualIndex)}})===(row.kind==='product'?state.selected[row.sourceIndex]:state.rooms.find(r=>r.id===row.roomId).manual[row.manualIndex]));
      return result;
    });
    report.quoteLayout=layout;
    check('titres de pièce et espace alignés à gauche, montants à droite',layout.left&&layout.numericRight);
    check('pièce nommée une seule fois, y compris après saut de page et espaces dupliqués',JSON.stringify(layout.roomTitles)===JSON.stringify(['SDB 01','SDB 02'])&&layout.editorRooms===2);
    check('accessoires WC et bâti libre rattachés au WC',layout.wcRefs.includes('paper')&&layout.wcRefs.includes('plate')&&layout.wcRefs.includes('hygiene')&&layout.manualSpace==='WC');
    check('corps natif rattaché à sa douche et accessoire implicite au lavabo',layout.roughSpace==='DOUCHE'&&layout.implicitSpace==='LAVABO');
    check('aucun sous-titre Autres éléments, toutes les lignes conservées',layout.noOther&&layout.count===14);
    check('totaux, quantités et données sources préservés',layout.totals===1510&&layout.unchanged);
    check('éditeur et export cohérents, cibles des modifications préservées',layout.sameRows&&layout.targets);
    check('espace conservé en tête de la page de continuation',layout.pages===2&&layout.continuation);
    if(process.env.QUOTE_SCREENSHOT){
      await page.evaluate(()=>{document.querySelectorAll('body > *').forEach(el=>{if(!el.contains(document.querySelector('#document')))el.style.display='none';});let el=document.querySelector('#document');while(el){el.style.display='block';el=el.parentElement;}});
      await page.locator('#document .quote-page').first().screenshot({path:process.env.QUOTE_SCREENSHOT});
    }

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
