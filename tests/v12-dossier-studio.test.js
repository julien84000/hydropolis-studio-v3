'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('dossier-only layout supports ordered visual cards without modifying project item order',()=>{
 const pages=require('../public/dossier-pages.js');
 const originals=[{id:'a'},{id:'b'},{id:'c'}];
 const group={key:'room:douche',items:originals,room:{title:'Salle de bains'},label:'Douche'};
 const result=pages.plan([group],{orders:{'room:douche:0':['c','a','b']}});
 assert.deepEqual(result.pages[0].items.map(x=>x.id),['c','a','b']);
 assert.deepEqual(originals.map(x=>x.id),['a','b','c']);
});
test('dossier pagination still enforces maximum 6 per page',()=>{
 const pages=require('../public/dossier-pages.js');
 const items=Array.from({length:8},(_,i)=>({id:'product-'+i}));
 const result=pages.plan([{key:'test:lavabo',items}],{pageSize:6});
 assert.equal(result.pages.length,2);
 assert.ok(result.pages.every(p=>p.items.length<=6));
});
test('Apple theme and dossier assets are loaded in application and after original stylesheet',()=>{
 const html=read('public/index.html');
 for(const file of ['v12-theme.css','v12-apple.css','v12-dossier.css','v12-ui.js','v12-dossier.js'])assert.ok(html.includes(file+'?v=__APP_VERSION__'),file);
 assert.ok(html.indexOf('v12-apple.css')>html.indexOf('v12-theme.css'));
 for(const vendor of ['sortablejs@1.15.6','interactjs@1.10.27'])assert.ok(html.includes(vendor),vendor);
 assert.ok(html.indexOf('v12-dossier.js')>html.indexOf('app.js?v='));
});
test('dossier plugin is syntactically valid and only writes dossier presentation state',()=>{
 const result=spawnSync(process.execPath,['--check',path.join(root,'public/v12-dossier.js')],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const js=read('public/v12-dossier.js');
 assert.match(js,/state\.project\.dossierDesign/);
 assert.match(js,/layout\.orders=orders/);
 assert.match(js,/window\.Sortable/);
 assert.match(js,/window\.interact/);
 assert.match(js,/function showPaginationPreview/);
 assert.match(js,/function updatePaginationFocus/);
 assert.match(js,/v12-page-focus/);
 assert.ok(!js.includes("window.open("),'La pagination ne doit pas dépendre des popups');
 assert.ok(!js.includes('purchasePrice='));
 assert.ok(!js.includes('supplierDiscounts='));
 assert.ok(!js.includes('state.selected='));
});
