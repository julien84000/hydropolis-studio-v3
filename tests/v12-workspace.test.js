'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('V12 project-first workspace is wired into HTML after existing app',()=>{
 const html=read('public/index.html');
 for(const f of ['v12-workspace.css','v12-workspace.js'])assert.ok(html.includes(f+'?v=__APP_VERSION__'));
 assert.ok(html.indexOf('v12-workspace.js')>html.indexOf('app.js?v='));
 assert.ok(html.indexOf('v12-workspace.css')>html.indexOf('v12-apple.css'));
});
test('V12 new views continue to use existing business handlers',()=>{
 const js=read('public/v12-workspace.js');
 assert.equal(spawnSync(process.execPath,['--check',path.join(root,'public/v12-workspace.js')],{encoding:'utf8'}).status,0);
 for(const f of ['showView','renderCatalog','renderProjectHub','renderDashboardEcosystem','buildDocument'])assert.ok(js.includes(f));
 for(const id of ['#view-dashboard','#view-catalog','#view-project','#view-preview','#v12ProjectTiles','#v12CatalogSteps'])assert.ok(js.includes(id));
 for(const dangerous of ['state.selected=','state.commercial=','supplierDiscounts=','purchasePrice=','state.rooms='])assert.equal(js.includes(dangerous),false);
});
test('V12 layout cards are generated from live catalog and project data, not fictitious examples',()=>{
 const js=read('public/v12-workspace.js');
 assert.ok(js.includes('cloud.projects'));
 assert.ok(js.includes('state.selected'));
 assert.ok(js.includes('CATALOG'));
 assert.ok(js.includes('bestImage'));
 assert.ok(!js.includes('Villa de rêve'));
});
test('page navigation stays in app; printer receives all pages',()=>{
 const css=read('public/v12-dossier.css');
 const js=read('public/v12-dossier.js');
 assert.ok(css.includes('@media print'));
 assert.ok(css.includes('body.v12-page-focus #view-preview #document > .page'));
 assert.ok(css.includes('display:block!important'));
 assert.ok(js.includes('function showPaginationPreview'));
 assert.ok(!js.includes('window.open('));
});
