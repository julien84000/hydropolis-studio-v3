/* Verified Hidrobox 2026 LINE price-list bands: PDF printed pages 22–25.
 * SKU->width/length/shape mapping is explicit; prices stay in original imported
 * manufacturer's price rows, with the single established +4% uplift.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHidroboxLineBands2026=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const map=Object.create(null);
 const length10=['100-110','111-120','121-130','131-140','141-150','151-160','161-170','171-180','181-190','191-200'];
 const length8=length10.slice(0,8), length6=['120-130','131-140','141-150','151-160','161-170','171-180'];
 const length7=[...length6,'181-190'];
 const blocksX=[['70',length10],['71-75',length10],['76-80',length10],['81-90',length10],
   ['91-100',length8],['101-110',length6]];
 const blocksY=[['80',length6],['81-90',length6],['91-100',length6],
   ['120-130',length7],['131-140',length7],['141-150',length6.slice(0,3)]];
 function add(sku,width,length,model,material,texture,colorGroup){
  const key='SLIC'+String(sku).padStart(4,'0');
  if(map[key])throw Error('Duplicate Line source SKU '+key);
  map[key]={reference:key,width,length,model,material,finish:texture,colorGroup};
 }
 function run(start,blocks,model,material,finish,colorGroup){
  let code=start;
  for(const [width,lengths] of blocks)for(const length of lengths)
   add(code++,width,length,model,material,finish,colorGroup);
 }
 const kromatGroups=[
  ['BAS',533,624,589,680,587,678],
  ['TRE',730,821,786,877,784,875],
  ['SPE',895,986,951,1042,949,1040]
 ];
 for(const [group,xSmooth,xSlate,ySmooth,ySlate,sqSmooth,sqSlate] of kromatGroups){
  run(xSmooth,blocksX,'line-x','Kromat','Lisse',group);
  run(xSlate,blocksX,'line-x','Kromat','Ardoise',group);
  run(ySmooth,blocksY,'line-y','Kromat','Lisse',group);
  run(ySlate,blocksY.slice(0,3),'line-y','Kromat','Ardoise',group);
  for(const [code,texture] of [[sqSmooth,'Lisse'],[sqSlate,'Ardoise']]){
   add(code,'80-90','80-90','line-square','Kromat',texture,group);
   add(code+1,'91-100','91-100','line-square','Kromat',texture,group);
  }
 }
 // Scene LINE X rectangular: the source uses legacy nonconsecutive number ranges.
 const sceneX=[...Array.from({length:40},(_,i)=>i+1),...Array.from({length:14},(_,i)=>698+i)];
 const slateX=[...Array.from({length:33},(_,i)=>70+i),118,104,120,106,122,108,124,
   110,111,112,113,720,721,722,723,724,725,726,727,728,729];
 const xDimensions=blocksX.flatMap(([width,lengths])=>lengths.map(length=>[width,length]));
 if(sceneX.length!==54||slateX.length!==54)throw Error('Scene X source dimensions mismatch');
 sceneX.forEach((code,i)=>add(code,...xDimensions[i],'line-x','Scene','Lisse','BLA'));
 slateX.forEach((code,i)=>add(code,...xDimensions[i],'line-x','Scene','Ardoise','BLA'));
 // Scene LINE Y rectangular: smooth throughout, slate only first 18 length bands.
 const sceneY=[...Array.from({length:18},(_,i)=>43+i),61,62,63,712,713,714,715,
   64,65,66,716,717,718,719,67,68,69];
 const slateY=[116,117,103,119,105,121,107,123,109,125,126,127,128,129,130,131,132,133];
 const yDims=blocksY.flatMap(([width,lengths])=>lengths.map(length=>[width,length]));
 if(sceneY.length!==35||slateY.length!==18)throw Error('Scene Y source dimensions mismatch');
 sceneY.forEach((code,i)=>add(code,...yDims[i],'line-y','Scene','Lisse','BLA'));
 slateY.forEach((code,i)=>add(code,...yDims[i],'line-y','Scene','Ardoise','BLA'));
 for(const [code,finish,width] of [[41,'Lisse','80-90'],[42,'Lisse','91-100'],
   [114,'Ardoise','80-90'],[115,'Ardoise','91-100']])
  add(code,width,width,'line-square','Scene',finish,'BLA');
 function fill(row){
  const b=map[String(row?.reference||'').toUpperCase()];
  if(!b)return null;
  return {...row,width:b.width,length:b.length,model:b.model,material:b.material,
   finish:b.finish,colorGroup:b.colorGroup,sourceBandsVerified:true};
 }
 return {map,fill,blocksX,blocksY};
});
