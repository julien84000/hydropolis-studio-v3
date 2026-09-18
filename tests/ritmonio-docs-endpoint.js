const assert=require('node:assert/strict');
const fs=require('node:fs');

const server=fs.readFileSync('server.js','utf8');
const app=fs.readFileSync('public/app.js','utf8');

assert(server.includes('const directSearch=`https://www.ritmonio.it/it/ricerca/?code=${encodeURIComponent(base)}`'),'exact-code search URL missing');
assert(server.includes('const exact=links.find(x=>String(x.articleCode||"").toUpperCase()===wanted)'),'exact product-code selection missing');
assert(server.includes('async function resolveRitmonioDocuments'),'dedicated Ritmonio document resolver missing');
assert(server.includes('if(!docs.technicalSheet)'),'technical-sheet presence guard missing');
assert(server.includes('app.post("/api/ritmonio-docs"'),'dedicated document API missing');
assert(app.includes('fetch("/api/ritmonio-docs"'),'client does not call dedicated document API');
assert(app.includes('p.technicalSheetType="pdf"'),'Ritmonio technical sheet must be marked PDF');
assert(app.includes('Inclure la Scheda tecnica'),'Ritmonio include checkbox label missing');

console.log('Ritmonio V11.36 docs flow OK · exact official search -> product page -> Scheda tecnica -> include checkbox');
