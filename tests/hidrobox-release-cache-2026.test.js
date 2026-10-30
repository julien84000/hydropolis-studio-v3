'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
test('Hidrobox release: browser script URLs and service-worker caches use the current package version',()=>{
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
 const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'public/sw.js'),'utf8');
 assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
 const parts=pkg.version.split('.').map(Number);
 assert(parts[0]>11||(parts[0]===11&&(parts[1]>64||(parts[1]===64&&parts[2]>=26))),
  'Minimum required release 11.64.26');
 assert.equal(lock.version,pkg.version);
 assert.equal(lock.packages[''].version,pkg.version);
 assert.match(sw,/const VERSION='__APP_VERSION__'/);
 assert.match(sw,/hydropolis-v\$\{VERSION\}-shell/);
 assert.match(sw,/\/hidrobox-special-parts-2026\.js/);
 assert.match(sw,/\/hidrobox-spares-2026\.js/);
 const special='hidrobox-special-parts-2026.js?v=__APP_VERSION__';
 const spares='hidrobox-spares-2026.js?v=__APP_VERSION__';
 const guide='hidrobox-guided.js?v=__APP_VERSION__';
 assert(html.includes(special)&&html.includes(spares)&&html.includes(guide));
 assert(html.indexOf(special)<html.indexOf(guide));
 assert(html.indexOf(spares)<html.indexOf(guide));
});
