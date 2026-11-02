'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('V12 is versioned consistently',()=>{
  const pkg=JSON.parse(read('package.json'));
  const lock=JSON.parse(read('package-lock.json'));
  const manifest=JSON.parse(read('public/manifest.webmanifest'));
  assert.equal(pkg.version,'12.0.0');
  assert.equal(lock.version,pkg.version);
  assert.equal(lock.packages[''].version,pkg.version);
  assert.match(manifest.name,/V12/);
});
test('premium layer is loaded after existing manufacturer themes',()=>{
  const html=read('public/index.html');
  const base=html.indexOf('styles.css?v=');
  const legacy=html.indexOf('gessi-area-pro.css?v=');
  const premium=html.indexOf('v12-theme.css?v=');
  assert.ok(base>0&&legacy>base&&premium>legacy);
  assert.match(html,/@tabler\/core@1\.6\.0\/dist\/css\/tabler\.min\.css/);
  assert.match(html,/lucide@0\.468\.0\/dist\/umd\/lucide\.min\.js/);
  assert.match(html,/motion@11\.11\.13\/dist\/motion\.js/);
  assert.ok(html.indexOf('sira-configurator.js?v=')<html.indexOf('v12-ui.js?v='));
  assert.ok(html.indexOf('v12-theme.css?v=')<html.indexOf('</head>'));
});
test('progressive enhancements preserve navigation and have an offline fallback',()=>{
  const js=read('public/v12-ui.js');
  for(const id of ['dashboard','catalog','projects','favorites','compare','exports','project','margin','preview'])
    assert.match(js,new RegExp('\\b'+id+':'));
  assert.match(js,/classList\.add\('v12-ui'\)/);
  assert.match(js,/MutationObserver/);
  assert.match(js,/window\.lucide/);
  assert.match(js,/window\.Motion/);
  assert.match(js,/svgFor\(icon\)/);
  assert.match(js,/prefers-reduced-motion/);
  for(const forbidden of ['purchasePrice','localStorage','fetch(','innerHTML=event.target'])
    assert.equal(js.includes(forbidden),false,'Unexpected business/data manipulation: '+forbidden);
});
test('premium CSS is scoped and respects dossier printing and reduced motion',()=>{
  const css=read('public/v12-theme.css');
  assert.match(css,/body\.v12-ui\s*\{/);
  assert.match(css,/body\.v12-ui #view-dashboard/);
  assert.match(css,/body\.v12-ui #view-catalog/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/@media print/);
  assert.ok(!css.includes('#document .page{'),'Do not override the exported PDF pages');
});
