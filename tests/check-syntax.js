'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const files=['server.js','assets-server.js','official-assets-server.js','metadata-cache.js','memory-safe-server.js','packed-assets.js','tariff-server.js',...fs.readdirSync('public').filter(x=>x.endsWith('.js')).map(x=>'public/'+x),...fs.readdirSync('tests').filter(x=>/consolidated|v11.57|pdf-readiness|live-assets|check-syntax|fixture-server/.test(x)&&x.endsWith('.js')).map(x=>'tests/'+x)];
for(const file of files){const r=cp.spawnSync(process.execPath,['--check',path.resolve(file)],{encoding:'utf8'});assert.equal(r.status,0,file+'\n'+r.stderr);}
console.log(`${files.length} fichiers JavaScript : syntaxe valide`);
