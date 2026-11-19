'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const codec=require('../public/local-project-storage');
const photo='data:image/png;base64,'+'A'.repeat(800000);
const product={id:'original',customImage:true,isFreeArticle:true,designation:'Colonne',price:1934,quantity:1,image:photo,images:[photo],pdfImage:photo,pdfImages:[photo]};
const project={project:{name:'Photo project'},rooms:[{id:'r1',manual:[]}],selected:[product,{...product,id:'copy'}]};
test('large duplicate photos fit the local quota without losing images, prices or IDs',()=>{
 const raw=JSON.stringify(project),packed=codec.encode(project);
 assert(raw.length>6000000);assert(packed.length<810000);
 assert.deepEqual(codec.decode(JSON.parse(packed)),project);
 assert.equal(product.image,photo,'Do not mutate the live project');
});
test('legacy drafts, distinct photos and remote/blob URLs remain intact',()=>{
 assert.equal(codec.decode(project),project);
 const mixed={...project,selected:[{...product,images:[photo,'data:image/jpeg;base64,Qg==','https://example.com/a.jpg','blob:local'],pdfImage:'https://example.com/b.jpg'}]};
 assert.deepEqual(codec.decode(JSON.parse(codec.encode(mixed))),mixed);
 assert.deepEqual(codec.decode(JSON.parse(codec.encode({selected:[]}))),{selected:[]});
 assert.throws(()=>codec.decode({selected:[{image:'hydropolis-local-image:9'}],localImageTableV1:[photo]}),/introuvable/);
});
const source=fs.readFileSync(require.resolve('../public/app.js'),'utf8');
const saveSource=source.slice(source.indexOf('function saveState(){'),source.indexOf('\nfunction unique(k)'));
function context(failures){
 const values=new Map([['hydropolis-v21:other:project','untouched'],['hydropolis-manufacturer-v119','cache']]);let writes=0;
 const storage={setItem(k,v){if(writes++<failures)throw Error('quota');values.set(k,v)},removeItem(k){values.delete(k)}};
 Object.defineProperty(storage,'hydropolis-manufacturer-v119',{enumerable:true,value:'cache'});
 const ctx={state:project,cloud:{user:{id:'u'},currentProjectId:'p'},HydroLocalProjectStorage:codec,localStorage:storage,stateStorageKey:()=> 'draft',markCloudDirty(){ctx.cloud.dirty=true},renderV11Overview(){},console:{warn(){}}};
 vm.createContext(ctx);vm.runInContext(saveSource,ctx);return {ctx,values};
}
test('retry after cache cleanup still dates the draft and marks the project dirty',()=>{
 const {ctx,values}=context(1);assert.equal(ctx.saveState(),true);
 assert.equal(ctx.cloud.dirty,true);assert(values.has('hydropolis-draft-at:u:p'));
 assert.equal(values.get('hydropolis-v21:other:project'),'untouched');
 assert.deepEqual(codec.decode(JSON.parse(values.get('draft'))),project);
});
test('unavailable storage reports failure instead of claiming a durable save',()=>{
 const {ctx}=context(Infinity);assert.equal(ctx.saveState(),false);
});
