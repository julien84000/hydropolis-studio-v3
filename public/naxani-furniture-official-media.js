/* Manufacturer-verified Naxani 2026 wood vanity collection photos.
 * Every image is an illustration of the family / model shown, not the exact finish or width.
 * Source pages:
 * https://naxani.com/producto/prenn-4/
 * https://naxani.com/producto/suro-3/
 * https://naxani.com/producto/slat-1c/
 * https://naxani.com/producto/slat-2c/
 */
(function(root){
'use strict';
const base='https://naxani.com/wp-content/uploads/';
const photo=(year,file)=>base+year+'/'+file;
const families={
 Prenn:{
  url:'https://naxani.com/producto/prenn-4/',
  variants:{
   '31':[
    photo('2024/11','prenn-31-140-nogal-marmol.jpg'),
    photo('2024/11','prenn-31-140-roble-marmol.jpg'),
    photo('2024/11','prenn-31-130-maple.jpg')
   ],
   '64':[
    photo('2024/11','prenn-64-160-roble.jpg'),
    photo('2024/11','prenn-64-140-iroko.jpg')
   ]
  }
 },
 'Suró':{
  url:'https://naxani.com/producto/suro-3/',
  variants:{
   '31':[
    photo('2024/11','suro-31-140-smoked.jpg'),
    photo('2024/11','suro-31-200-honey-1-lav.jpg')
   ],
   '64':[
    photo('2024/11','suro-64-160-smoked.jpg'),
    photo('2024/11','suro-64-160-smoked-01.jpg')
   ]
  }
 },
 Slat:{
  url:'https://naxani.com/producto/slat-1c/',
  variants:{
   '1C':[
    photo('2024/11','slat-1c-140-nogal.jpg'),
    photo('2024/11','slat-1c-140-roble.jpg'),
    photo('2024/11','Slat_1C_120_fresno-scaled.jpg')
   ],
   '2C':[
    photo('2024/11','slat-2c-140-iroko.jpg'),
    photo('2024/11','slat-2c-180-nogal.jpg')
   ]
  }
 }
};
function getFamily(row){
 if(!row||row.manufacturer!=='Naxani'||row.productType!=='bois-massif')return null;
 const p=Number(row.sourcePage);
 if(row.collection==='Prenn')return {name:'Prenn',variant:p===17?'64':'31'};
 if(row.collection==='Suró')return {name:'Suró',variant:p===26?'64':'31'};
 if(row.collection==='Slat')return {name:'Slat',variant:(p===23||p===24)?'2C':'1C'};
 return null;
}
function apply(rows){
 let applied=0;
 const coverage={};
 for(const p of rows||[]){
  const f=getFamily(p);
  if(!f)continue;
  const data=families[f.name];
  const photos=data?.variants[f.variant];
  if(!photos?.length)continue;
  p.image=photos[0];
  p.images=photos.slice();
  p.manufacturerUrl=f.name==='Slat'&&f.variant==='2C'?'https://naxani.com/producto/slat-2c/':data.url;
  p.imageSource='Naxani · galerie officielle de collection (visuel illustratif)';
  p.naxaniPhotoScope='collection';
  p.naIllustratedVariant=f.variant;
  applied++;
  coverage[f.name]=(coverage[f.name]||0)+1;
 }
 return {applied,coverage};
}
const initial=apply(root?.HydroNaxani2026?.rows);
root.HydroNaxaniFurnitureMedia={families,apply,initial};
})(typeof window!=='undefined'?window:globalThis);
