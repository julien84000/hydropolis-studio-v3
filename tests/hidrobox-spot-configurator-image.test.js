'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const x=require('../hidrobox-configurator-server.js');
const SPOT_URL='https://hidrobox.com/configurator/wp-content/uploads/cfg-recursos/images/Hidrobox_Washbasin_Spot-62_Blush.png';
const input={model:'spot-62',material:'Kromat',texture:'Lisse',color:'Blush',width:32,length:52,shape:'rectangle'};
test('Official Spot-62 Kromat Blush metadata and collection/typology are exact',()=>{
 const canonical=x.canonical(input);
 assert.equal(canonical.unsupported,undefined);
 const u=new URL(x.urlFor(canonical));
 assert.equal(u.searchParams.get('fltr-collection'),'929');
 assert.equal(u.searchParams.get('fltr-typology'),'1180');
 assert.equal(u.searchParams.get('fltr-material'),'729');
 assert.equal(u.searchParams.get('fltr-texture'),'803');
 assert.equal(x.exactFilename(SPOT_URL,canonical)?.assetType,'washbasin');
 assert.equal(x.exactFilename(SPOT_URL,{...canonical,model:'spot-125'}),null);
 assert.equal(x.exactFilename(SPOT_URL,{...canonical,color:'Brownie'}),null);
});
test('Exact manufacturer washbasin result matches model, colour AND dimensions',()=>{
 const title='19339 - Spot-62 RECTANGULAR 32x52';
 const html='<div class="configuratorpage__item">'+
 '<a class="modal-image-btn" href="'+SPOT_URL+'"><img src="'+SPOT_URL+'"></a>'+
 '<h3 class="configuratorpage__item__title">'+title+'</h3></div>';
 assert.equal(x.parse(html,x.canonical(input))?.url,SPOT_URL);
 assert.equal(x.parse(html,x.canonical({...input,width:33})),null);
 assert.equal(x.parse(html,x.canonical({...input,color:'Ocean'})),null);
});
test('Spot 62 uses vessel-washbasin AJAX, not shower-tray typology',async()=>{
 let sent='';
 const original='<div class="configuratorpage__item">'+
  '<a class="modal-image-btn" href="'+SPOT_URL+'">View image</a>'+
  '<h3 class="configuratorpage__item__title">19339 - Spot-62 RECTANGULAR 32x52</h3></div>';
 const output=await x.lookup(input,{sizeId:'111',post:async(_url,body)=>{sent=body;return{data:{data:{grid:original}}}}});
 assert.equal(output.ok,true,JSON.stringify(output));
 assert.equal(output.image,SPOT_URL);
 const p=new URLSearchParams(sent);
 assert.equal(p.get('fltr-typology[]'),'1180');
 assert.equal(p.get('fltr-collection[]'),'929');
 assert.equal(p.get('fltr-color[]'),'570');
 assert.equal(p.get('fltr-material[]'),'729');
 assert.equal(p.get('fltr-texture[]'),'803');
 assert.equal(p.get('fltr-size[]'),'111');
});
test('Spot exact manufacturer image match declines unrelated collections',()=>{
 const title='19339 - Spot-62 RECTANGULAR 32x52';
 const html='<div class="configuratorpage__item"><a class="modal-image-btn" href="'+
 SPOT_URL+'"></a><h3 class="configuratorpage__item__title">'+title+'</h3></div>';
 const check=x.canonical({...input,model:'spot-125'});
 assert.equal(x.parse(html,check),null);
 assert.equal(x.canonical({...input,model:'spot-999'}).unsupported,true);
});
