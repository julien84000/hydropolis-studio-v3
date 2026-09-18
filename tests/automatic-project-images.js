const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');

for(const symbol of [
  'const SELECTED_IMAGE_CONCURRENCY=3',
  'function enqueueSelectedImageSearch',
  'function pumpSelectedImageSearches',
  'enrichSelectedPhoto(job.id,job.force)',
  'selectedImageQueued.delete(job.id)'
])assert(app.includes(symbol),`missing automatic project-image queue guard: ${symbol}`);

const commitStart=app.indexOf('function commitSelectedRecords');
const commitEnd=app.indexOf('function openRecorBathConfigurator',commitStart);
assert(commitStart>=0&&commitEnd>commitStart,'commitSelectedRecords block missing');
const commitBlock=app.slice(commitStart,commitEnd);
assert(commitBlock.includes('for(const item of valid)'),'project commit must process every valid catalogue item');
assert(commitBlock.includes('enqueueSelectedImageSearch(item)'),'every committed catalogue item must queue an image lookup');
assert(!commitBlock.includes('if(!item.image'),'automatic lookup must not be limited to products without a preloaded image');

const addStart=app.indexOf('async function addProduct');
const addEnd=app.indexOf('function removeProduct',addStart);
assert(addStart>=0&&addEnd>addStart,'addProduct block missing');
const addBlock=app.slice(addStart,addEnd);
assert(addBlock.includes('commitSelectedRecords([record])'),'single-item additions must use the universal commit path');
assert(!addBlock.includes('fetchManufacturerImage('),'addProduct must not keep a second manufacturer-specific lookup path');

assert(server.includes('app.post("/api/manufacturer-image"'),'manufacturer image endpoint missing');
for(const maker of ['Amphora','Catalano','Coalbrook','Gessi','Hotbath','Lefroy Brooks','Nicolazzi','Recor','Ritmonio','Zucchetti']){
  assert(server.includes(maker),`manufacturer resolver coverage missing: ${maker}`);
}

console.log('V11.40 automatic project images OK · universal commit hook · concurrency 3 · 10 manufacturers');
