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
 assert.equal(server.matchCard(jpg,'35987 - Twins-YR RECTANGULAR 90x120',s),null);
 assert.equal(server.matchCard(jpg.replace('Brownie','Cotta'),'35987 - Twins-YR RECTANGULAR 90x100',s),null);
 assert.equal(server.matchCard(jpg.replace('Twins-YR','Twins-YL'),'35987 - Twins-YR RECTANGULAR 90x100',s),null);
 assert.equal(server.matchCard(jpg.replace('_Mic_','_Smo_'),'35987 - Twins-YR RECTANGULAR 90x100',s),null);
 assert.equal(server.matchCard('https://evil.example.net/impostor.png','35987 - Twins-YR RECTANGULAR 90x100',s),null);
 assert.equal(server.parse(card() + card(),s),null,'ambiguous duplicate must not be accepted');
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
