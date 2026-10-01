'use strict';
// Dependency injection is limited to this explicit test entry point. No runtime
// flags, global monkey patches or fixture paths are used by the production app.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {startServer}=require('../server');
const fixtures=path.join(__dirname,'fixtures/official');
const models=require('../public/sira_models.json').models;
async function request({url,data}){
  let filename;
  if(url.startsWith('https://g-ecatalogue-be-prod-we.azurewebsites.net/public/product/GetProductDetails?'))filename='gessi-'+new URL(url).searchParams.get('productCode')+'.json';
  else if(url==='https://alpirubinetterie.com/wp-admin/admin-ajax.php')filename='alpi-popup-'+new URLSearchParams(data).get('post_id')+'.html';
  else{const model=models.find(m=>m.productUrl===url);assert(model,'URL Sira inconnue');filename='sira-'+model.code+'.html';}
  const raw=fs.readFileSync(path.join(fixtures,filename),'utf8');
  return {status:200,headers:{},data:filename.endsWith('.json')?JSON.parse(raw):raw};
}
startServer({assets:{request,assertPublic:async url=>assert(/^https:\/\//.test(url))}}).catch(e=>{console.error(e);process.exitCode=1;});
