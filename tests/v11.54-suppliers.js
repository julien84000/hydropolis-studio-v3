const fs=require('fs');
const app=fs.readFileSync('public/v1153.js','utf8'),v=fs.readFileSync('public/v1154.js','utf8'),srv=fs.readFileSync('v1154-sira-assets-server-snippet.js','utf8');
for(const maker of ['Sira Concrete','TDA','Vismaravetro']){if(!v.includes(maker))throw new Error('remise absente '+maker)}
if(!v.includes("'Sira Concrete':50")||!v.includes('TDA:50')||!v.includes('Vismaravetro:50'))throw new Error('50% incomplet');
if(!app.includes('/api/sira-product-v1154'))throw new Error('endpoint Sira V11.54 non utilisé');
if(!app.includes('productData.primaryImage||productData.images?.[0]'))throw new Error('image Sira exacte non prioritaire');
if(!app.includes('purchaseDiscount:50,configuratorType:"shower-screen-v1153"'))throw new Error('remise parois non persistée');
if(!srv.includes('v54SiraExactImages')||!srv.includes('woocommerce-product-gallery'))throw new Error('resolver image exact absent');
console.log('V11.54 suppliers: OK');
