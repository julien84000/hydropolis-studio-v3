const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const json=f=>JSON.parse(read(f));

assert.equal(json('package.json').version,'11.18.0');
for(const f of ['public/sw.js','public/manifest.webmanifest','public/manufacturers_manifest.json'])assert(fs.existsSync(path.join(root,f)),`${f} missing`);

const manifest=json('public/catalog_manifest.json');
const files=['amphora_catalog.json',...manifest.chunks.map(c=>c.file)];
let total=0;const makers=new Set();const unique=new Set();
for(const file of files){
  const rows=json('public/'+file);total+=rows.length;
  for(const p of rows){makers.add(p.manufacturer);unique.add(`${p.manufacturer}|${p.reference}`)}
}
assert.equal(total,21284,'catalog row count changed unexpectedly');
for(const maker of ['Amphora','Catalano','Coalbrook','Hotbath','Lefroy Brooks','Recor','Zucchetti'])assert(makers.has(maker),`missing maker ${maker}`);
assert(unique.size>=21280,'unexpected catalog deduplication regression');

const app=read('public/app.js');
for(const symbol of ['renderCompareDock','renderCompareView','renderDashboardEcosystem','renderFavoritesView','toggleFavorite','smartAlternativesFor','requestServerSearch','exportExcel','exportMoodboard','registerOfflineSupport','offlineProjectListKey','hotbathDrawingProxyUrl'])assert(app.includes(symbol),`missing V11 app feature ${symbol}`);
const server=read('server.js');
for(const symbol of ['/api/catalog/search','session_version','storeCopyAssets','safeRemoteGet','REMOTE_HOST_SUFFIXES','/api/hotbath-drawing-image','lefroy-squarespace-variant','images.squarespace-cdn.com','catalano-official-exact-preview','catalano-official-product-gallery'])assert(server.includes(symbol),`missing V11 server feature ${symbol}`);
assert(!app.includes('Number(saved.settings?.vatRate)||20'),'VAT 0% regression guard failed');
assert(app.includes('raw=p?.purchasePrice') && app.includes('raw===null||raw===undefined||raw===""'),'null purchasePrice regression guard missing');
assert(app.includes('return (room?.manual||[]).filter(m=>m && String(m.label||"").trim())'),'manual-line preservation guard missing');
assert(app.includes('technical-pdf-page-3') || read('public/manufacturers_manifest.json').includes('technical-pdf-page-3'),'Zucchetti page 3 capability missing');
assert(app.includes('isRecorBathRequiringFeet'),'Recor feet configurator missing');
assert(app.includes('sanitairkamer'),'Hotbath Sanitairkamer fallback missing');
console.log(`V11 smoke OK · ${total.toLocaleString('fr-FR')} lignes · ${unique.size.toLocaleString('fr-FR')} références uniques · ${makers.size} fabricants`);

const html=read('public/index.html');
for(const anchor of ['view-dashboard','view-favorites','view-compare','view-exports','dashboardSearchInput','favoritesGrid','compareViewGrid'])assert(html.includes(anchor),`missing V11.18 UI anchor ${anchor}`);
const css=read('public/styles.css');
for(const cls of ['dashboard-hero','dashboard-category-grid','ecosystem-card','favorite-toggle','compare-view-table','exports-grid-v11'])assert(css.includes(cls),`missing V11.18 style ${cls}`);

assert(app.includes('catalanoClientGalleryPages'),'Catalano full client gallery pages missing');
assert(app.includes('catalanoGalleryComplete'),'Catalano gallery completeness tracking missing');
assert(app.includes('resolvedImages=(data.images||[])'),'mixed embedded/proxy Catalano image preservation missing');


const recorRows=json('public/catalog_recor.json');
const recorFeet=recorRows.filter(x=>x.collection==='Pieds Recor');
assert.equal(recorFeet.length,50,'Recor feet row count changed unexpectedly');
assert.equal(recorFeet.filter(x=>x.image).length,45,'Recor feet visual mapping count changed unexpectedly');
for(const f of ['aster.jpg','ball-claw.jpg','wood.jpg','imperial.jpg','lion.jpg','pedestal.jpg','princess.jpg','carlton.jpg']){
  assert(fs.existsSync(path.join(root,'public/assets/recor-feet',f)),`missing Recor visual ${f}`);
}
assert(app.includes('recorChoiceVisual'),'Recor visual chooser helper missing');
assert(css.includes('recor-choice-thumb'),'Recor visual chooser styles missing');
