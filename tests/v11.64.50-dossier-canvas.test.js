'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const m=require('../public/dossier-canvas-model.js');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('A4 overlay blocks stay bounded and cannot overwrite quote metadata',()=>{
 const c=m.normalizeCanvas({});const b=m.add(c,'cover',{type:'text',x:92,y:88,w:40,h:30,text:'Texte libre'});
 assert.equal(b.x,60);assert.equal(b.y,70);
 assert.equal(b.w,40);assert.equal(b.h,30);
 assert.equal(b.text,'Texte libre');
 assert.equal(Object.hasOwn(c,'selected'),false);
 assert.equal(Object.hasOwn(c,'commercial'),false);
 m.update(c,'cover',b.id,{x:101,w:96,y:-20,opacity:200});
 assert.ok(b.x+b.w<=100 && b.y>=0);
 assert.equal(b.opacity,100);
});
test('Layers are independently added, reordered, locked, hidden and duplicated',()=>{
 const c=m.normalizeCanvas({});
 const first=m.add(c,'space:r1:0',{type:'text',text:'Plan de vasque'});
 const second=m.add(c,'space:r1:0',{type:'rectangle',background:'#ccaa88'});
 assert.equal(c.pages['space:r1:0'].length,2);
 assert.equal(first.z,1);assert.equal(second.z,2);
 m.layer(c,'space:r1:0',first.id,'up');assert.ok(first.z>second.z);
 const copy=m.duplicate(c,'space:r1:0',first.id);
 assert.notEqual(copy.id,first.id);
 m.update(c,'space:r1:0',copy.id,{locked:true,hidden:true});
 assert.throws(()=>m.remove(c,'space:r1:0',copy.id),/verrouillé/);
 assert.throws(()=>m.update(c,'space:r1:0',copy.id,{text:'Modifié'}),/verrouillé/);
 m.update(c,'space:r1:0',copy.id,{locked:false});
 assert.equal(m.remove(c,'space:r1:0',copy.id),true);
});
test('Templates act on one page and preserve other rooms and product slots',()=>{
 const c=m.normalizeCanvas({});
 m.add(c,'space:r2:0',{type:'text',text:'À conserver'});
 m.applyPreset(c,'cover','editorial');assert.equal(c.pages.cover.length,3);
 m.applyPreset(c,'cover','signature');assert.equal(c.pages.cover.length,3);
 assert.equal(c.pages['space:r2:0'][0].text,'À conserver');
 assert.throws(()=>m.applyPreset(c,'cover','unknown'),/inconnu/);
});
test('Unknown or malformed overlay data is normalized without executable HTML',()=>{
 const c=m.normalizeCanvas({pages:{cover:[
  {type:'text',id:'!!block',text:'<img onerror="alert(1)">',x:-300,y:300,w:9,h:3,src:'javascript:alert(1)'},
  {type:'unknown',id:'bad',color:'red',src:'https://example.com/other.jpg'}
 ]}});
 assert.equal(c.pages.cover[0].src,'');
 assert.match(c.pages.cover[0].text,/onerror/);
 assert.equal(c.pages.cover[1].type,'text');
 assert.equal(c.pages.cover[1].color,'#292e34');
 assert.equal(c.pages.cover[0].x,0);
 assert.ok(c.pages.cover[0].y<=97);
});
test('Only graphic editor assets are loaded; server and existing catalog engine retained',()=>{
 const html=read('public/index.html');
 for(const f of ['dossier-canvas-editor.css','dossier-canvas-model.js','dossier-canvas-editor.js'])
   assert.ok(html.includes(f+'?v=__APP_VERSION__'),f);
 assert.ok(html.indexOf('dossier-canvas-editor.js')>html.indexOf('v12-workspace.js'));
 const packageJson=JSON.parse(read('package.json'));
 assert.match(packageJson.version,/^11\.64\.\d+$/);
 const app=read('public/app.js');
 assert.ok(app.includes('project:{...state.project}'),'Cloud save keeps dossierCanvas and presets within the project');
 assert.match(app,/async function saveCloudProject\(\)/);
 assert.match(read('server.js'),/hydropolis_projects/);
 assert.match(read('render.yaml'),/hydropolis-studio-v3/);
 assert.doesNotMatch(read('render.yaml'),/hydropolis-studio-v12-preview/);
});
test('Browser editor is parseable, layer CSS prints but omits editing chrome',()=>{
 for(const f of ['public/dossier-canvas-editor.js','public/dossier-canvas-model.js']){
  const r=spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});
  assert.equal(r.status,0,f+': '+r.stderr);
 }
 const css=read('public/dossier-canvas-editor.css');
 assert.match(css,/#document \.page > \.v12-canvas-layer/);
 assert.match(css,/\.is-hidden\{display:none!important\}/);
 assert.match(css,/@media print/);
 assert.match(css,/\.v12-canvas-studio,#document \.v12-canvas-handle\{display:none!important\}/);
 const js=read('public/dossier-canvas-editor.js');
 assert.match(js,/saveCloudProject\(\)/);
 assert.match(js,/state\.project\.dossierCanvasPresets/);
 assert.ok(!js.includes('state.selected='));
 assert.ok(!js.includes('state.commercial='));
 assert.ok(!js.includes('window.open('));
});