const assert=require('node:assert/strict');
const fs=require('node:fs');
const server=fs.readFileSync('server.js','utf8');
const app=fs.readFileSync('public/app.js','utf8');
const css=fs.readFileSync('public/styles.css','utf8');

assert(server.includes('function nicolazziSelectedHandle(asset)'),'exact catalogue handle resolver missing');
assert(server.includes('selectedHandle,handleOptions:selectedHandle&&!selectedHandle.required?[selectedHandle]:[]'),'server does not return the exact selected handle separately');
assert(server.includes('La photo principale ne certifie pas la poignée'),'main photo/handle truthfulness note missing');
assert(server.includes('const imageItems=[commercial.bestImage]'),'unverified alternate-handle gallery images must not enter the client dossier');
assert(server.includes('resolveOfficialNicolazziVisual'),'official Nicolazzi fallback missing');
assert(server.indexOf('const commercial=await resolveDesignerTapwareNicolazzi')<server.indexOf('const official=await resolveOfficialNicolazziVisual'),'Nicolazzi source priority regression');
assert(server.includes('hydropolis_nicolazzi_visuals'),'persistent PostgreSQL mapping table missing');
assert(server.includes('storeGetNicolazziVisual(memoKey)'),'persistent mapping read missing');
assert(server.includes('storePutNicolazziVisual(memoKey'),'validated mapping write missing');
assert(server.includes('nicolazziDesignerResolveInflight'),'concurrent lookup deduplication missing');
assert(app.includes('hydropolis-nicolazzi-composite-v138'),'old Nicolazzi browser cache migration missing');
assert(app.includes('function nicolazziHandlePreviewHtml'),'selected handle thumbnail renderer missing');
assert(app.includes('selectedHandle:data.selectedHandle'),'selected handle transport missing');
assert(app.includes('nicolazziSelectedHandle'),'selected-project handle persistence missing');
assert(css.includes('.nicolazzi-handle-preview'),'handle thumbnail styles missing');
assert(css.includes('.nicolazzi-handle-required'),'Festival handle-choice warning styles missing');

console.log('Nicolazzi V11.38 composite OK · model/finish + exact separate handle + persistent validated mapping');
