const assert=require('node:assert/strict');
const fs=require('node:fs');
const zlib=require('node:zlib');

const readGz=file=>JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
const rows=readGz('public/catalog_nicolazzi.json.gz');
const assets=readGz('public/nicolazzi_pdf_assets.json.gz');
const byRef=new Map(rows.map(row=>[row.reference,row]));

const expected={
  '2308CR45IN':['Agorà','Lavabo',743.75],
  '2308GO18IN':['Agorà','Lavabo',1002.50],
  '3308CR44':['Arena','Lavabo',600],
  '1208CR36':['Impero','Lavabo',1128.75],
  '2508CR01':['Nuova Brenta','Lavabo',381.25],
  '2608CR60':['Mac Kinley','Lavabo',410],
  '3452CR75C':['Cinquanta','Lavabo',521.25],
  '3704CR97W':['Cucina','Cuisine',423.75],
};

for(const [reference,[collection,category,price]] of Object.entries(expected)){
  const row=byRef.get(reference);
  assert(row,`missing restored Nicolazzi reference ${reference}`);
  assert.equal(row.collection,collection,`wrong collection for ${reference}`);
  assert.equal(row.category,category,`wrong category for ${reference}`);
  assert.equal(row.price,price,`wrong +25% public price for ${reference}`);
  assert(assets.models[row.base],`missing official PDF visual for ${row.base}`);
}

const agora=rows.filter(row=>row.collection==='Agorà');
assert(agora.some(row=>row.category==='Lavabo'),'Agorà still contains accessories only');
assert(agora.some(row=>row.category==='Bain'),'Agorà bathtub products missing');
assert(agora.some(row=>row.category==='Douche'),'Agorà shower products missing');
assert.equal(new Set(rows.map(row=>row.base)).size,1089,'restored base count mismatch');
assert.equal(rows.length,36303,'restored Nicolazzi row count mismatch');

console.log('Nicolazzi V11.39 completeness OK · 608 bases / 21 280 rows restored');
