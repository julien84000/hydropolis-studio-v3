'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const server=require('../hidrobox-configurator-server.js');
const visual=require('../public/hidrobox-official-render.js');
const IMAGE='https://hidrobox.com/configurator/wp-content/uploads/cfg-recursos/images/';
const example={model:'twins-yr',material:'Kromat',texture:'Microtex',color:'Brownie',width:90,length:100,shape:'rectangle'};
const jpg=IMAGE+'Hidrobox_Shower-tray_Twins-YR_Per_Mic_Rec_Brownie.png';
const card=(src=jpg,title='35987 - Twins-YR RECTANGULAR 90x100')=>'<div class="configuratorpage__item"><a class="modal-image-btn" href="'+src+'">Photo</a><h3 class="configuratorpage__item__title">'+title+'</h3></div>';
test('Supplier URL must be the real configured product image, not the collection or a mismatched variant',()=>{
 const s=server.canonical(example);
 assert.equal(server.matchCard(jpg,'35987 - Twins-YR RECTANGULAR 90x100',s)?.url,jpg);
 const illustrative=server.matchCard(jpg,'35987 - Twins-YR RECTANGULAR 90x120',s);
 assert.equal(illustrative?.dimensionsVerified,false,'same genuine image may illustrate other sizes');
 assert.equal(illustrative?.selectionMatch,'model-texture-color-shape');
 assert.equal(server.matchCard(jpg.replace('Brownie','Cotta'),'35987 - Twins-YR RECTANGULAR 90x100',s),null);
 assert.equal(server.matchCard(jpg.replace('Twins-YR','Twins-YL'),'35987 - Twins-YR RECTANGULAR 90x100',s),null);
 assert.equal(server.matchCard(jpg.replace('_Mic_','_Smo_'),'35987 - Twins-YR RECTANGULAR 90x100',s),null);
 assert.equal(server.matchCard('https://evil.example.net/impostor.png','35987 - Twins-YR RECTANGULAR 90x100',s),null);
 assert.equal(server.parse(card() + card(),s)?.url,jpg,'duplicate identical supplier image is unambiguous');
 assert.equal(server.parse(card(jpg) + card(jpg.replace('Brownie','Brownie').replace('Twins-YR','Twins-YL')),s)?.url,jpg,'different model is excluded');
 const alt=IMAGE+'Hidrobox_Shower-tray_Twins-YR_Per_Mic_Rec_Brownie.webp';
 assert.equal(server.parse(card(jpg)+card(alt),s),null,'two distinct matching official images are ambiguous');
});
test('Safe color translation: manufacturer uses White for Bianco/Blanc and Sand-stone for Sandstone',()=>{
 const a={...example,model:'neo-plus',texture:'Smooth',color:'Bianco'};
 assert(server.exactFilename(IMAGE+'Hidrobox_Shower-tray_Neo-Plus_Per_Smo_Rec_White.png',server.canonical(a)));
 const b={...example,color:'Sandstone'};
 assert(server.exactFilename(IMAGE+'Hidrobox_Shower-tray_Twins-YR_Per_Mic_Rec_Sand-stone.png',server.canonical(b)));
});
test('Manufacturer AJAX must receive every selected term (not read unrelated static product cards)',async()=>{
 let posted='',endpoint='';
 const source=await server.lookup(example,{sizeId:'817',post:async(url,body)=>{
   endpoint=url;posted=body;return {data:{data:{grid:card(),counter:1}}};
 }});
 assert.equal(source.ok,true);
 assert.equal(source.image,jpg);
 assert.equal(source.match,'model-texture-color-shape-dimensions');
 assert.equal(new URL(source.source).searchParams.get('fltr-size'),'817');
 assert.equal(new URL(source.source).searchParams.get('fltr-color'),'571');
 assert.match(endpoint,/admin-ajax\.php$/);
 const p=new URLSearchParams(posted);
 for(const [key,val] of Object.entries({'action':'_listado_results','fltr-typology[]':'1057','fltr-collection[]':'851',
  'fltr-material[]':'729','fltr-texture[]':'725','fltr-color[]':'571','fltr-size[]':'817'}))assert.equal(p.get(key),val,key);
});
test('Never add guessed image to client project when selected configuration cannot be verified',()=>{
 const row={manufacturer:'Hidrobox',collection:'Twins',reference:'TWIN0001',hidroboxConfiguration:{group:'twins'}};
 assert.equal(visual.apply(row,{ok:false},example),false);
 assert.equal(row.image,undefined);
 assert.equal(visual.apply({...row,customImage:true},{ok:true,image:jpg},example),false);
 assert.equal(visual.apply(row,{ok:true,image:jpg,source:'Official',match:'model-texture-color-shape-dimensions'},example),true);
 assert.equal(row.pdfImage,row.image);
 assert.equal(row.images.length,1);assert.match(row.image,/^\/api\/image-proxy/);
 assert.equal(row.hidroboxConfiguration.officialImageConfig.model,'twins-yr');
 assert.equal(row.reference,'TWIN0001');
});
test('Explicit source color and invalid/missing selections cannot produce a purported exact photo',()=>{
 assert.deepEqual(visual.colorsFor({material:'Kromat',colorGroup:'BAS',color:'Bianco'}),['Bianco']);
 assert.equal(visual.modelFor({collection:'Line'},{model:'Line X'}),'line-x');
 assert.equal(visual.modelFor({collection:'Line'},{model:'Line Y'}),'line-y');
 assert.equal(visual.modelFor({collection:'Line'},{model:'Line'}),'');
 assert.equal(visual.modelFor({collection:'Twins'},{model:'Twins YR'}),'twins-yr');
 assert.equal(visual.eligible({model:'quadro',material:'Kromat',texture:'Slate',color:'Blanc',width:90,length:120}),true);
 assert.equal(visual.eligible({model:'quadro',material:'Kromat',texture:'',color:'Blanc',width:90,length:120}),false);
});


test('Native manufacturer print resolution is verified, never upscaled or described as HD without pixels',async()=>{
 class FakeHD{
  get naturalWidth(){return 1600}get naturalHeight(){return 1100}
  set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}
 }
 class FakeLow{
  get naturalWidth(){return 650}get naturalHeight(){return 550}
  set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}
 }
 const result={ok:true,image:jpg};
 const hd=await visual.printQuality(result,{ImageClass:FakeHD});
 assert.equal(hd.ok,true);assert.equal(hd.width,1600);
 const low=await visual.printQuality(result,{ImageClass:FakeLow});
 assert.equal(low.ok,false);
 assert.match(low.reason,/insuffisante/);
 assert.equal(visual.apply({manufacturer:'Hidrobox'},{...result,verifiedPrintQuality:false},example),false);
});


test('Official Neo Plus non-dimensional images retain true texture/shape/color with honest illustrative status',()=>{
 const config=server.canonical({model:'neo-plus',material:'Kromat',texture:'Slate',color:'Bianco',width:80,length:120,shape:'angularR'});
 const angular=IMAGE+'Hidrobox_Shower-tray_Neo-Plus_Per_Sla_Ang_White.png';
 const rectangular=IMAGE+'Hidrobox_Shower-tray_Neo-Plus_Per_Sla_Rec_White.png';
 assert.equal(server.matchCard(rectangular,'Neo-Plus RECTANGULAR 80x120',config),null,
  'angular right must not receive a rectangular tray image');
 const result=server.matchCard(angular,'Neo-Plus ANGULAR 90x120',config);
 assert.equal(result?.selectionMatch,'model-texture-color-shape');
 assert.equal(result?.dimensionsVerified,false);
 assert.equal(server.parse(card(angular,'Neo-Plus ANGULAR 90x120'),config)?.url,angular);
 assert.equal(server.matchCard(angular.replace('White','Ocean'),'Neo-Plus ANGULAR 90x120',config),null);
 const rec={manufacturer:'Hidrobox',collection:'Neo Plus'};
 assert.equal(visual.apply(rec,{ok:true,image:angular,match:result.selectionMatch,disclaimer:'Dimensions non garanties'},config),true);
 assert.equal(rec.imageFinishMatch,'configured-illustrative');
 assert.match(rec.imageSource,/dimensions non garanties/);
 assert.match(rec.imageNote,/Dimensions non garanties|dimensions finales/);
 assert.equal(rec.pdfImage,rec.image);
});
test('Official configured photo UI must link to actual manufacturer filters, never a guessed file path',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const guide=fs.readFileSync(path.join(__dirname,'../public/hidrobox-guided.js'),'utf8');
 const visualSource=fs.readFileSync(path.join(__dirname,'../public/hidrobox-official-render.js'),'utf8');
 assert.match(guide,/data-hb-config-link/);
 assert.match(visualSource,/hostname==='hidrobox.com'/);
 assert.match(visualSource,/configured-illustrative/);
});

test('Manufacturer retry without size still requires real Neo Plus image, exact finish, shape and colour',async()=>{
 const selected={model:'neo-plus',material:'Kromat',texture:'Ardoise',color:'Bianco',
   width:80,length:120,shape:'angularR'};
 const angular=IMAGE+'Hidrobox_Shower-tray_Neo-Plus_Per_Sla_Ang_White.png';
 const wrong=IMAGE+'Hidrobox_Shower-tray_Twins-YR_Per_Mic_Rec_Brownie.png';
 const requests=[];
 const result=await server.lookup(selected,{sizeId:'751',post:async(url,body)=>{
   requests.push(new URLSearchParams(body));
   return {data:{data:{grid:requests.length===1?card(wrong,'Twins-YR RECTANGULAR 90x100'):
     card(angular,'Neo-Plus ANGULAR 90x120')}}};
 }});
 assert.equal(requests.length,2);
 assert.equal(requests[0].get('fltr-size[]'),'751');
 assert.equal(requests[1].get('fltr-size[]'),null);
 for(const key of ['typology','collection','material','texture','color'])
   assert.equal(requests[0].get('fltr-'+key+'[]'),requests[1].get('fltr-'+key+'[]'),key);
 assert.equal(result.ok,true);
 assert.equal(result.image,angular);
 assert.equal(result.match,'model-texture-color-shape');
 assert.match(result.disclaimer,/dimensions/);
 assert.equal(new URL(result.source).searchParams.get('fltr-size'),'751');
});

test('Neo Plus Quadrant is encoded Qua, not Ang, in observed official images',()=>{
 const angular='https://hidrobox.com/configurator/wp-content/uploads/cfg-recursos/images/Hidrobox_Shower-tray_Neo-Plus_Per_Sla_Qua_Terra.png';
 const canonical=server.canonical({model:'neo-plus',material:'Kromat',texture:'Slate',
   color:'Terra',width:80,length:120,shape:'angularR'});
 const match=server.matchCard(angular,'32589 - Neo-Plus QUADRANT 80x120',canonical);
 assert.equal(match?.url,angular,'actual supplier Quadrant image must be accepted');
 assert.equal(match?.dimensionsVerified,true);
 assert.equal(server.matchCard(angular.replace('_Qua_','_Rec_'),'32589 - Neo-Plus RECTANGULAR 80x120',canonical),null);
 assert.equal(server.matchCard(angular.replace('Terra','Ocean'),'32589 - Neo-Plus QUADRANT 80x120',canonical),null);
});
test('Official Neo Plus images on later results pages are discovered with same supplier identity filters',async()=>{
 const selected={model:'neo-plus',material:'Kromat',texture:'Slate',color:'Herbal',width:80,length:120,shape:'angular'};
 const official='https://hidrobox.com/configurator/wp-content/uploads/cfg-recursos/images/Hidrobox_Shower-tray_Neo-Plus_Per_Sla_Qua_Herbal.png';
 const distractor='https://hidrobox.com/configurator/wp-content/uploads/cfg-recursos/images/Hidrobox_Shower-tray_Neo-Plus_Per_Sla_Rec_Herbal.png';
 const cards=Array.from({length:48},(_,i)=>card(distractor,'Neo-Plus RECTANGULAR 80x'+(130+i))).join('');
 const calls=[];
 const result=await server.lookup(selected,{sizeId:'751',post:async(_url,body)=>{
   const params=new URLSearchParams(body);calls.push(params);
   if(params.get('offset')==='0')return {data:{data:{grid:cards}}};
   if(params.get('offset')==='48')return {data:{data:{grid:card(official,'Neo-Plus QUADRANT 80x120')}}};
   throw Error('Pagination out of bounds');
 }});
 assert.equal(result.ok,true);
 assert.equal(result.image,official);
 assert.equal(result.match,'model-texture-color-shape-dimensions');
 assert.equal(calls.length,2);
 assert.deepEqual(calls.map(x=>x.get('offset')),['0','48']);
 assert.equal(calls[1].get('fltr-collection[]'),'827');
 assert.equal(calls[1].get('fltr-color[]'),'577');
 assert.equal(calls[1].get('fltr-size[]'),'751');
});
