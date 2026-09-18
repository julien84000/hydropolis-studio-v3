const assert=require('node:assert/strict');
const fs=require('node:fs');

const server=fs.readFileSync('server.js','utf8');
const app=fs.readFileSync('public/app.js','utf8');

assert(server.includes('function ritmonioOfficialDownloads'),'Ritmonio document helper missing');
assert(server.includes(".bottonieraScheda a[href*='/download/']"),'Ritmonio official download-tab selector missing');
assert(server.includes('/\\bscheda tecnica\\b/.test(label)'),'Scheda tecnica label recognition missing');
assert(server.includes('source:"ritmonio-scheda-tecnica"'),'Scheda tecnica source marker missing');
assert(server.includes('label:"Scheda tecnica Ritmonio",type:"pdf"'),'Scheda tecnica must be exposed as PDF');
assert(server.includes('/\\bistruzioni di montaggio\\b/.test(label)'),'Istruzioni di montaggio recognition missing');
assert(server.includes('source:"ritmonio-istruzioni-montaggio"'),'Installation guide source marker missing');
assert(app.includes('hydropolis-ritmonio-docs-v134'),'Ritmonio old-cache migration missing');
assert(app.includes('refreshLegacyRitmonioTechnicalSheets'),'Legacy Ritmonio selected-product refresh missing');
assert(app.includes('isRitmonio=/^Ritmonio$/i.test'),'New Ritmonio products must request documents automatically');

console.log('Ritmonio V11.34 docs OK · official Scheda tecnica + Istruzioni di montaggio PDF flow guarded');
