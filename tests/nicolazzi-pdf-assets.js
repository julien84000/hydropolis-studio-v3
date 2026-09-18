const assert=require('node:assert/strict');
const fs=require('node:fs');
const zlib=require('node:zlib');
const crypto=require('node:crypto');
const readGz=p=>JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString('utf8'));
const pack=readGz('public/nicolazzi_pdf_assets.json.gz');
const rows=readGz('public/catalog_nicolazzi.json.gz');
assert.equal(pack.version,'11.31.0');
assert.equal(pack.sourcePages,434);
assert.equal(pack.modelCount,481);
assert.equal(Object.keys(pack.models).length,481);
assert.equal(rows.length,15023);
const bases=[...new Set(rows.map(x=>String(x.base||'').trim()).filter(Boolean))];
assert.equal(bases.length,481,'Nicolazzi model/base count changed unexpectedly');
for(const base of bases){
  const item=pack.models[base];
  assert(item,`missing local PDF asset ${base}`);
  assert(item.page>=1&&item.page<=434,`bad PDF page for ${base}`);
  assert.equal(item.mime,'image/webp');
  assert(Buffer.from(item.image,'base64').length>1000,`empty image for ${base}`);
}
for(const base of ['4808STC..A1','4808STC..91','1487IN..','S2207D..'])assert(pack.models[base],`required Nicolazzi model missing: ${base}`);
assert.equal(pack.models['4808STC..A1'].collection,'Star');
assert.equal(pack.models['4808STC..91'].collection,'Flag');
assert.notEqual(crypto.createHash('sha1').update(Buffer.from(pack.models['4808STC..A1'].image,'base64')).digest('hex'),crypto.createHash('sha1').update(Buffer.from(pack.models['4808STC..91'].image,'base64')).digest('hex'),'Star and Flag must retain distinct catalogue visuals');
assert.equal(pack.models['1487IN..'].collection,'Agorà');
assert.equal(pack.models['S2207D..'].externalHandleSelection,true,'Festival separate handle selection marker missing');
console.log(`Nicolazzi PDF assets OK · ${bases.length} modèles · ${rows.length.toLocaleString('fr-FR')} variantes · ${pack.sourcePages} pages source`);
