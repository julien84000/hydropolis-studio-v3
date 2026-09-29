const fs=require('fs');
const a=fs.readFileSync('apply-v11.54-consolidated.js','utf8');
if(!a.includes("pkg.version='11.54.0'"))throw new Error('version');
if(!a.includes('purchase-discount-50'))throw new Error('capability discount');
if(!a.includes('exact-product-image-v1154'))throw new Error('Sira image capability');
console.log('V11.54 static: OK');
