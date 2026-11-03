'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('V11 production service and persistent DB configuration remain unchanged',()=>{
 const render=read('render.yaml'),server=read('server.js');
 assert.match(render,/name:\s*hydropolis-studio-v3\s*\n/);
 assert.doesNotMatch(render,/hydropolis-studio-v12-preview/);
 assert.match(server,/process\.env\.DATABASE_URL/);
 assert.match(server,/const USE_POSTGRES/);
 assert.match(server,/hydropolis_projects/);
 assert.match(server,/hydropolis_users/);
 assert.match(server,/app\.get\("\/api\/projects"/);
 assert.match(server,/app\.put\("\/api\/projects\/:id"/);
});

test('existing project ids and session tokens remain compatible',()=>{
 const app=read('public/app.js');
 assert.match(app,/hydropolis-auth-token/);
 assert.match(app,/hydropolis-last-project/);
 assert.match(app,/function compactStateForCloud\(/);
 assert.match(app,/function applyProjectState\(/);
 assert.match(app,/async function saveCloudProject\(/);
 assert.match(app,/method:"PUT"/);
 assert.match(app,/stateStorageKey\(/);
});

test('UI integration is additive and preserves manufacturer catalogue scripts',()=>{
 const html=read('public/index.html');
 for(const filename of [
  'catalog-index.js','app.js','radaway-configurator.js','radaway-gallery-2026.js',
  'naxani-configurator.js','galassia-configurator.js',
  'hotbath-galassia-configurator.js','v12-workspace.js','v12-dossier.js'
 ])assert.ok(html.includes(filename+'?v=__APP_VERSION__'),filename);
 const pkg=JSON.parse(read('package.json'));
 assert.match(pkg.version,/^11\.64\.\d+$/);
 assert.ok(html.includes('Hydropolis Studio V__APP_VERSION__'));
});
