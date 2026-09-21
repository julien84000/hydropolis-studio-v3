const fs=require('fs');
const assert=require('assert');
const app=fs.readFileSync('public/app.js','utf8');

const resolverStart=app.indexOf('function productFromCatalogSources');
const resolverEnd=app.indexOf('function dashboardProductImage',resolverStart);
assert(resolverStart>=0 && resolverEnd>resolverStart,'unified catalogue resolver missing');
const resolver=app.slice(resolverStart,resolverEnd);
assert(resolver.includes('CATALOG.find'),'resolver must search local catalogue');
assert(resolver.includes('serverSearchRows.find'),'resolver must search server search rows');
assert(resolver.includes('productKey(p)===wantedKey'),'resolver must prefer exact manufacturer+reference key');

const renderStart=app.indexOf('function renderCatalog()');
const renderEnd=app.indexOf('function normalizeText',renderStart);
assert(renderStart>=0 && renderEnd>renderStart,'renderCatalog block missing');
const render=app.slice(renderStart,renderEnd);
assert(render.includes('data-key="${esc(key)}"'),'catalog action buttons must carry exact product key');
assert(render.includes('addCatalogProduct(b.dataset.ref'), 'catalog add handler missing');
assert(render.includes('b.dataset.key||""'),'catalog add handler must forward server-row key');
assert(render.includes('lookupCatalogPhoto(b.dataset.ref,b,b.dataset.key||"")'),'photo refresh must work on server rows');

const addStart=app.indexOf('function addCatalogProduct');
const addEnd=app.indexOf('function removeProduct',addStart);
assert(addStart>=0 && addEnd>addStart,'catalog add block missing');
const add=app.slice(addStart,addEnd);
assert(add.includes('productFromCatalogSources(ref,key)'),'addCatalogProduct must resolve server rows');
assert(add.includes('async function addProduct(ref,roomId,parentId="",key="")'),'addProduct key-aware signature missing');
assert(add.match(/productFromCatalogSources\(ref,key\)/g)?.length>=2,'both add paths must use unified resolver');

console.log('V11.41 server-result add OK · local + federated rows · exact product key propagated');
