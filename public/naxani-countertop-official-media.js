/* Naxani 2026 - verified countertop-basin photographs from naxani.com.
 * Collection illustration only: a photo does not certify a variant, finish or SKU.
 * Data captured from the respective official manufacturer product galleries, Nov 2026.
 */
(function(root){
'use strict';
const media={
  '1q84':{
    page:'https://naxani.com/producto/1q84/',
    images:[
      'https://naxani.com/wp-content/uploads/2024/11/shosuba-140-fresno-1Q84-03-1-scaled.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/shosuba-140-fresno-1Q84-02-1-scaled-e1770632065788.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/roten-1q84-negro.jpg'
    ]
  },
  'hirga':{
    page:'https://naxani.com/producto/hirga/',
    images:[
      'https://naxani.com/wp-content/uploads/2024/11/hirga-02-scaled.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/hirga-01-scaled-e1770632295965.jpg'
    ]
  },
  'ovum':{
    page:'https://naxani.com/producto/ovum/',
    images:[
      'https://naxani.com/wp-content/uploads/2024/11/ovum-02-scaled.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/ovum-03-scaled-e1770632460553.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/ovum-01.jpg'
    ]
  },
  'ofali':{
    page:'https://naxani.com/producto/ofali/',
    images:['https://naxani.com/wp-content/uploads/2024/11/ofali-e1770633379695.jpg']
  },
  'oval':{
    page:'https://naxani.com/producto/oval/',
    images:[
      'https://naxani.com/wp-content/uploads/2024/11/oval-04-scaled-e1770633456183.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/oval-03.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/oval-02-scaled.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/oval-01-scaled.jpg'
    ]
  },
  'prim':{
    page:'https://naxani.com/producto/prim/',
    images:[
      'https://naxani.com/wp-content/uploads/2024/11/prim-04.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/prim-03-scaled.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/prim-01-e1770633649870.jpg'
    ]
  },
  'rodo':{
    page:'https://naxani.com/producto/rodo/',
    images:[
      'https://naxani.com/wp-content/uploads/2024/11/rodo-01.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/rodo-05-scaled.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/rodo-02.jpg'
    ]
  },
  'puma':{
    page:'https://naxani.com/producto/puma-2/',
    images:[
      'https://naxani.com/wp-content/uploads/2024/11/puma-130-01-1.jpg',
      'https://naxani.com/wp-content/uploads/2024/11/puma-130-1.jpg'
    ]
  }
};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function apply(rows){
 let count=0,models=new Set();
 for(const p of rows||[]){
  if(p?.manufacturer!=='Naxani'||p.productType!=='vasque-poser')continue;
  const source=media[norm(p.collection)];
  if(!source)continue;
  p.image=source.images[0];p.images=source.images.slice();
  p.manufacturerUrl=source.page;
  p.imageSource='Naxani · photo officielle du modèle (variante indicative)';
  p.naxaniPhotoScope='model';p.naxaniPhotoVerifiedPage=source.page;
  models.add(norm(p.collection));count++;
 }
 return {references:count,models:[...models]};
}
const result=apply(root?.HydroNaxani2026?.rows);
root.HydroNaxaniCountertopMedia={media,apply,coverage:result};
})(typeof window!=='undefined'?window:globalThis);
