const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const server=fs.readFileSync('server.js','utf8');
const start=server.indexOf('function ritmonioArticleCodeFromUrl');
const end=server.indexOf('function ritmonioProductLinks',start);
assert(start>=0&&end>start,'Ritmonio URL-code helper missing');

const ctx={URL};
vm.createContext(ctx);
vm.runInContext(server.slice(start,end),ctx);

assert.equal(ctx.ritmonioArticleCodeFromUrl('https://www.ritmonio.it/it/bath-shower/prodotto/?code=057985_PR50AA201&family=57984'),'PR50AA201');
assert.equal(ctx.ritmonioArticleCodeFromUrl('https://www.ritmonio.it/it/bath-shower/prodotto/?code=057985_PR50AF201&family=57984'),'PR50AF201');
assert.notEqual(ctx.ritmonioArticleCodeFromUrl('https://www.ritmonio.it/it/bath-shower/prodotto/?code=057985_PR50AA201&family=57984'),'PR50AF201');
assert(server.includes('exactByCode=links.find'),'Ritmonio resolver must prefer exact product code over broad card text');

console.log('Ritmonio V11.35 resolver OK · PR50AF201 cannot resolve to PR50AA201');
