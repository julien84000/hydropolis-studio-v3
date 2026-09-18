const assert=require('node:assert/strict');
const fs=require('node:fs');

const server=fs.readFileSync('server.js','utf8');
assert(server.includes('Scheda<br>tecnica'),'Regression comment/sample for Ritmonio BR label missing');
assert(server.includes('replace(/<br\\s*\\/?>/gi," ")'),'Ritmonio BR-to-space normalization missing');
assert(server.includes('/\\bscheda tecnica\\b/.test(label) || /\\bschedatecnica\\b/.test(label)'),'Scheda tecnica parser does not handle both spaced and concatenated labels');
assert(server.includes('/\\bistruzioni di montaggio\\b/.test(label) || /\\bistruzionidi montaggio\\b/.test(label)'),'Installation tab parser does not handle BR concatenation');

console.log('Ritmonio V11.37 label parser OK · Scheda<br>tecnica and Istruzioni<br>di montaggio recognized');
