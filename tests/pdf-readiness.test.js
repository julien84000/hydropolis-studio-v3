'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../public/app.js'),'utf8');
const start=source.indexOf('async function waitForDocumentImages('),end=source.indexOf('async function exportClientPdf(',start);
class TestImage extends EventTarget{constructor(options={}){super();Object.assign(this,{complete:false,naturalWidth:0},options)}}
function wait(img,timeout=25){const ctx=vm.createContext({document:{querySelectorAll:()=>[img]},setTimeout,clearTimeout});vm.runInContext(source.slice(start,end),ctx);return ctx.waitForDocumentImages(timeout)}
test('PDF : image chargée et décodée',async()=>{const r=await wait(new TestImage({complete:true,naturalWidth:100,decode:async()=>{}}));assert.equal(r.failed.length,0)});
test('PDF : attend le chargement en cours',async()=>{const img=new TestImage(),job=wait(img);img.complete=true;img.naturalWidth=100;img.dispatchEvent(new Event('load'));assert.equal((await job).failed.length,0)});
test('PDF : complete ne suffit pas si les dimensions sont nulles',async()=>{assert.equal((await wait(new TestImage({complete:true}))).failed.length,1)});
test('PDF : erreur réseau distincte du chargement',async()=>{const img=new TestImage(),job=wait(img);img.dispatchEvent(new Event('error'));assert.equal((await job).failed.length,1)});
test('PDF : décodage rejeté bloque l’impression',async()=>{assert.equal((await wait(new TestImage({complete:true,naturalWidth:100,decode:async()=>{throw Error('image invalide')}}))).failed.length,1)});
test('PDF : décodage bloqué ne peut pas être déclaré prêt',async()=>{assert.equal((await wait(new TestImage({complete:true,naturalWidth:100,decode:()=>new Promise(()=>{})}))).failed.length,1)});
test('PDF : chargement interrompu termine sur timeout',async()=>{const r=await wait(new TestImage());assert.equal(r.failed.length,1);assert.equal(r.timedOut,true)});
