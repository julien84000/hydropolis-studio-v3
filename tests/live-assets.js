'use strict';
// Run explicitly: this integration test contacts official manufacturer services.
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict'),{spawn}=require('child_process');
const root=path.join(__dirname,'..'),port=10029,base=`http://127.0.0.1:${port}`;
const fixtures=path.join(__dirname,'fixtures/official');
const fixtureMode=process.argv.includes('--fixtures');
const report={mode:fixtureMode?'official-fixtures':'live-network',version:require('../package.json').version,startedAt:new Date().toISOString(),memory:[],assets:[],errors:[]};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydropolis-live-'));
  const server=spawn(process.execPath,[fixtureMode?'tests/fixture-server.js':'server.js'],{cwd:root,env:{...process.env,PORT:String(port),HYDRO_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
  let logs='';server.stderr.on('data',x=>logs+=x);
  const measure=async phase=>{const data=await fetch(base+'/api/health/memory').then(r=>r.json());report.memory.push({phase,...data});console.log(phase,data.rssMB,data.heapUsedMB);};
  try{
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(logs)),10000);server.stdout.on('data',b=>{if(String(b).includes(' on ')){clearTimeout(timer);resolve();}});});
    await measure('startup');
    const manifest=await fetch(base+'/catalog_manifest.json').then(r=>r.json());assert.equal(manifest.version,report.version);
    for(const chunk of manifest.chunks){const r=await fetch(base+'/'+chunk.file);assert(r.ok);await r.arrayBuffer();}
    await measure('catalogues');
    const packedUrls=['/assets/recor-feet/aster.jpg','/assets/vismara/tech-137.pdf','/resigres/shapes/xl85.png','/api/nicolazzi-pdf-asset?base=1493..15C'];
    report.packedAssets=[];
    for(const url of packedUrls){const r=await fetch(base+url);assert(r.ok,url);report.packedAssets.push({url,bytes:(await r.arrayBuffer()).byteLength,type:r.headers.get('content-type')});}
    await measure('assets locaux streamés');
    const jobs=[];
    for(const name of fs.readdirSync(fixtures).filter(x=>/^gessi-\d+\.json/.test(x))){const p=JSON.parse(fs.readFileSync(path.join(fixtures,name))).data.product;for(const v of p.productsConfigured.slice(0,3))jobs.push({manufacturer:'Gessi',reference:p.productId+'#'+v.finiture.finitureId,finishCode:v.finiture.finitureId});}
    const alpi=JSON.parse(fs.readFileSync(path.join(fixtures,'alpi-samples.json')));for(const p of alpi)jobs.push({...p,manufacturer:'Alpi'});
    for(const m of require('../public/sira_models.json').models)for(const color of ['PW','OB'])jobs.push({manufacturer:'Sira Concrete',reference:m.code+'.'+color,finishCode:color,manufacturerUrl:m.productUrl});
    while(jobs.length<100)jobs.push({...jobs[jobs.length%30]});
    for(let i=0;i<100;i+=5){
      await Promise.all(jobs.slice(i,i+5).map(async p=>{
        try{const r=await fetch(base+'/api/manufacturer-image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p),signal:AbortSignal.timeout(60000)});const data=await r.json();report.assets.push({manufacturer:p.manufacturer,reference:p.reference,status:r.status,image:data.image||'',finishMatch:data.finishMatch||'',technicalSheetUrl:data.technicalSheetUrl||'',documentStatus:data.documentStatus||'',note:data.note||'',error:data.error||''});assert(r.ok&&data.image,p.manufacturer+' '+p.reference+' '+JSON.stringify(data));assert(!JSON.stringify(data).includes('data:image'));}
        catch(e){report.errors.push({manufacturer:p.manufacturer,reference:p.reference,error:e.message});}
      }));
      if(i===45)await measure('50 recherches');if(i===95)await measure('100 recherches');
    }
    const tda=await fetch(base+'/api/tda-tariff').then(r=>r.json());assert(tda.count>300000);report.tda={count:tda.count,gammes:tda.gammes.length};await measure('TDA chargé');
    for(const seconds of [30,60,90,120,150,180]){await pause(30000);await measure('repos '+seconds+' s');}
    assert.equal(report.memory.at(-1).caches.tda.loaded,false,'TDA doit être libéré');
    report.completedAt=new Date().toISOString();report.passed=report.errors.length===0;
    console.log('Live assets',report.assets.length,'errors',report.errors.length);
  }catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;}
  finally{if(report.errors.length)process.exitCode=1;fs.writeFileSync(path.join(root,fixtureMode?'docs/memory-validation.json':'docs/live-validation.json'),JSON.stringify(report,null,2)+'\n');server.kill();fs.rmSync(dir,{recursive:true,force:true});}
})();
