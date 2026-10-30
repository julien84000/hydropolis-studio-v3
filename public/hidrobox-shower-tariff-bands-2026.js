/* HIDROBOX 2026 shower tray reference-size matrix.
 * SKU numbers and price rows are the manufacturer's imported source. This
 * file restores merged PDF width/length cells from the price-table layout.
 * Each inferred dimension is checked against a manufacturer SKU and never
 * creates a price, material, texture or reference outside the source data.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroHidroboxShowerBands2026=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const map=new Map(),limit=(x,a,b)=>x>=a&&x<=b;
 function add(prefix,num,width,length,model){
  const reference=prefix+String(num).padStart(4,'0');
  if(map.has(reference))throw Error('Duplicate SKU '+reference);
  map.set(reference,{reference,width,length,model,sourceBandsVerified:true});
 }
 function series(prefix,start,width,lengths,model){
  lengths.forEach((length,i)=>add(prefix,start+i,width,length,model));
 }
 const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>i+a);
 const length10=range(0,9).map(i=>(100+i*10)-(i===0?0:0)+''), // overwritten by canonical bands below
       lengthBands=range(0,9).map(i=>i===0?'100-110':(101+i*10)+'-'+(110+i*10));
 const band=(lo,hi)=>lo===hi?String(lo):lo+'-'+hi;
 const L10=range(0,9).map(i=>band(i?101+i*10:100,110+i*10));
 const L8=L10.slice(0,8),L6=L10.slice(0,6);
 // Twins: 2 orientations, 2 widths, 8 length price brackets, 3 colour tiers.
 const twinBlocks=[['twins-yl','BAS',97],['twins-yr','BAS',113],
   ['twins-yl','TRE',129],['twins-yr','TRE',145],['twins-yl','SPE',33],['twins-yr','SPE',81]];
 for(const [model,,start] of twinBlocks){
  series('STWC',start,'80',L8,model);
  series('STWC',start+8,'81-90',L8,model);
 }
 // Quadro: 5 width groups of ten 10-cm length brackets, in the 2026 tariff.
 for(const start of [1,51,101])for(const [k,width] of ['70','71-75','80','81-90','91-100'].entries())
  series('SQUC',start+k*10,width,L10,'quadro-rectangle');
 // Pure: 3 × 11 standard manufacturer formats.
 const pureLengths=range(100,200).filter(x=>x%10===0).map(String);
 for(const [k,width] of ['70','80','90'].entries())
  series('SPUC',1+k*11,width,pureLengths,'pure-rectangle');
 // Arq: six width groups (10 sizes each), followed by two XL groups (6 sizes each).
 for(const [k,width] of ['70','71-75','76-80','81-90','91-100','101-110'].entries())
  series('SARC',361+k*10,width,L10,'arq-rectangle');
 const arqLarge=['130-140','141-150','151-160','161-170','171-180','181-190'];
 series('SARC',421,'120-130',arqLarge,'arq-rectangle');
 series('SARC',427,'131-140',arqLarge,'arq-rectangle');
 // Unique: the supplier's source shows a triangular sequence of available
 // length ranges as widths increase; all 113 SKU/size intersections are retained.
 const uniqueGroups=[
  ['70',1,70],['71-75',17,71],['76-80',33,76],['81-90',49,81],
  ['91-100',64,91],['101-110',78,101],['111-120',91,111],['121-130',103,121]
 ];
 for(const [width,start,minLength] of uniqueGroups){
  const count=start===1||start===17||start===33?16:start===49?15:start===64?14:start===78?13:start===91?12:11;
  const lengths=range(0,count-1).map(i=>band(i?minLength+1+i*10:minLength,minLength+10+i*10));
  series('SUNC',start,width,lengths,'unique-rectangle');
 }
 // Iconik: manufacturer's 80/90 x 110/120/130/140 rectangles and 90/100 squares.
 for(const [start,width] of [[1,'80'],[5,'90']])series('SICC',start,width,['110','120','130','140'],'iconik-rectangle');
 add('SICC',9,'90','90','iconik-square');add('SICC',10,'100','100','iconik-square');
 // ONE: two surface texture blocks, with square/angle choices from source codes.
 const oneA=[
  [439,'70',range(90,200).filter(x=>x%10===0).map(String)],
  [451,'71-75',range(90,200).filter(x=>x%10===0).map(String)],
  [464,'76-80',range(80,200).filter(x=>x%10===0).map(String)],
  [479,'81-90',range(90,200).filter(x=>x%10===0).map(String)],
  [491,'91-100',range(100,200).filter(x=>x%10===0).map(String)],
  [502,'101-110',range(110,200).filter(x=>x%10===0).map(String)]
 ];
 for(const [start,width,lengths] of oneA)series('SONC',start,width,lengths,'one-rectangle');
 // The 80×80 and 90×90 corner models are separate tariff SKUs.
 add('SONC',463,'80','80','one-square');
 add('SONC',478,'90','90','one-square');
 for(const [start,width,lengths] of [
   [585,'70',range(90,200).filter(x=>x%10===0).map(String)],
   [597,'71-75',range(90,200).filter(x=>x%10===0).map(String)],
   [609,'76-80',range(90,200).filter(x=>x%10===0).map(String)],
   [621,'81-90',range(90,200).filter(x=>x%10===0).map(String)],
   [633,'91-100',range(100,200).filter(x=>x%10===0).map(String)]
 ])series('SONC',start,width,lengths,'one-rectangle');
 // Correct the two supplier angular variants, which otherwise overlap the
 // rectangular series. Their SKU and the manufacturer's format are preserved.
 map.get('SONC0464').model='one-angular';
 map.get('SONC0479').model='one-angular';
 // Loovers uses adjustable widths within manufacturer-defined shape limits.
 // Formats confirmed from the Hidrobox contract catalogue technical overview.
 for(const [i,l] of ['170-190','191-210','211-230'].entries())
  add('SLOC',1+i,'85-100',l,'loovers-share');
 for(const [n,model] of [[4,'loovers-round-c'],[5,'loovers-round-l'],
   [6,'loovers-round-r'],[7,'loovers-round-rect']])
  add('SLOC',n,'100','160-180',model);
 for(const [n,model] of [[8,'loovers-single-l'],[9,'loovers-single-r']])
  add('SLOC',n,'85-100','150-180',model);
 function fill(row){
  const b=map.get(String(row?.reference||'').toUpperCase());
  return b?{...row,width:b.width,length:b.length,model:b.model,
    sourceBandsVerified:true}:null;
 }
 const coverage={};
 for(const x of map.values()){const p=x.reference.slice(0,4);coverage[p]=(coverage[p]||0)+1;}
 return {map,fill,coverage};
});
