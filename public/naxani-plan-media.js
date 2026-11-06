/* Official Naxani photographs paired with the 15 integrated top technical drawings.
 * Photos come from the corresponding Naxani manufacturer product pages.
 * Paired product pages are explicitly flagged as family-level illustrative
 * photographs; never claim an exact width, number of bowls or finish.
 * Technical drawings are clipped from the manufacturer's 2026 tariff
 * and served as independent PNGs from /api/naxani-plan-drawing.
 */
(function(root){
 'use strict';
 const gallery={
 "Alma": {
  "sourceUrl": "https://naxani.com/producto/alma-y-alpos/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2026/02/WALDEN_180_ROBLE_04.jpg",
   "https://naxani.com/wp-content/uploads/2026/02/WALDEN_180_ROBLE_01.jpg"
  ],
  "scope": "famille commune Alma / Alpos"
 },
 "Alpos": {
  "sourceUrl": "https://naxani.com/producto/alma-y-alpos/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2026/02/WALDEN_180_ROBLE_04.jpg",
   "https://naxani.com/wp-content/uploads/2026/02/WALDEN_180_ROBLE_01.jpg"
  ],
  "scope": "famille commune Alma / Alpos"
 },
 "Aran": {
  "sourceUrl": "https://naxani.com/producto/aran-e-inis/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/aran-01-scaled-e1770205923561.jpg",
   "https://naxani.com/wp-content/uploads/2024/12/aran_02.jpg"
  ],
  "scope": "modèle Aran"
 },
 "Ares": {
  "sourceUrl": "https://naxani.com/producto/ares/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2026/02/ARES.jpg",
   "https://naxani.com/wp-content/uploads/2024/12/ares-04.jpg"
  ],
  "scope": "modèle Ares"
 },
 "Borvo": {
  "sourceUrl": "https://naxani.com/producto/prenn-y-borvo/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/prenn-003-e1770214020901.jpg",
   "https://naxani.com/wp-content/uploads/2024/11/prenn-64-160-roble-02-e1769618148979.jpg"
  ],
  "scope": "famille commune Prenn / Borvo"
 },
 "Daro": {
  "sourceUrl": "https://naxani.com/producto/daro-3/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/daro-02-scaled.jpg",
   "https://naxani.com/wp-content/uploads/2024/12/daro-01-scaled-e1770202183631.jpg"
  ],
  "scope": "modèle Daro"
 },
 "Forma Large": {
  "sourceUrl": "https://naxani.com/producto/forma-large/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/forma-large-04.jpg",
   "https://naxani.com/wp-content/uploads/2024/12/forma-large-01-scaled.jpg"
  ],
  "scope": "modèle Forma Large"
 },
 "Forma Small": {
  "sourceUrl": "https://naxani.com/producto/forma-small/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/forma-small-01.jpg",
   "https://naxani.com/wp-content/uploads/2024/12/forma-small-02-scaled-e1770214297303.jpg"
  ],
  "scope": "modèle Forma Small"
 },
 "Inis": {
  "sourceUrl": "https://naxani.com/producto/aran-e-inis/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/aran_02.jpg",
   "https://naxani.com/wp-content/uploads/2024/12/aran-01-scaled-e1770205923561.jpg"
  ],
  "scope": "famille commune Aran / Inis"
 },
 "Latu": {
  "sourceUrl": "https://naxani.com/producto/latu/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/latu-04-e1770214456932.jpg",
   "https://naxani.com/wp-content/uploads/2024/12/latu-03-e1770214932500.jpg"
  ],
  "scope": "modèle Latu"
 },
 "Orbit": {
  "sourceUrl": "https://naxani.com/producto/orbit/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/orbit-01-scaled-e1770215146238.jpg",
   "https://naxani.com/wp-content/uploads/2026/02/orbit.jpg"
  ],
  "scope": "modèle Orbit"
 },
 "Patra": {
  "sourceUrl": "https://naxani.com/producto/patra/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/patra_01-scaled-e1770215232563.jpg",
   "https://naxani.com/wp-content/uploads/2024/12/patra-03.jpg"
  ],
  "scope": "modèle Patra"
 },
 "Prenn": {
  "sourceUrl": "https://naxani.com/producto/prenn-y-borvo/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/prenn-003-e1770214020901.jpg",
   "https://naxani.com/wp-content/uploads/2024/11/prenn-64-160-roble-02-e1769618148979.jpg"
  ],
  "scope": "famille commune Prenn / Borvo"
 },
 "Tulpan": {
  "sourceUrl": "https://naxani.com/producto/tulpan/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/tulip-002-e1770215456968.jpg"
  ],
  "scope": "modèle Tulpan"
 },
 "2R": {
  "sourceUrl": "https://naxani.com/producto/2r-3/",
  "photos": [
   "https://naxani.com/wp-content/uploads/2024/12/2r-02-scaled.jpg",
   "https://naxani.com/wp-content/uploads/2024/12/2r-01-scaled.jpg"
  ],
  "scope": "modèle 2R"
 }
};
 const base='/api/naxani-plan-drawing?model=';
 const drawing=name=>gallery[name]?base+encodeURIComponent(name):'';
 const get=name=>{
   const media=gallery[String(name||'')];
   return media?{...media,collection:String(name),image:media.photos[0],drawingUrl:drawing(name)}:null;
 };
 function apply(rows){
  for(const item of rows||[]){
   if(item?.manufacturer!=='Naxani'||item.productType!=='plan-integre')continue;
   const media=get(item.collection);if(!media)continue;
   // Only catalogue items with the identical plan model get these photographs.
   const sourceNote=media.scope.includes('famille commune')?
     'Photo fabricant indicative — '+media.scope+' ; modèle précis non garanti':
     'Photo officielle de la famille '+item.collection+' ; dimensions et nombre de vasques illustratifs';
   item.image=media.image;
   item.images=[...media.photos,media.drawingUrl];
   item.imageSource=sourceNote;
   item.imageFinishMatch='model-only';
   item.manufacturerUrl=media.sourceUrl;
   item.drawingUrl=media.drawingUrl;
   item.drawingType='image/png';
   item.drawingLabel='Plan Naxani '+item.collection+' — forme du modèle (schéma non contractuel)';
   item.technicalSheetUrl='https://naxani.com/wp-content/uploads/2026/02/catalogo_naxani_2026.pdf';
   item.technicalSheetLabel='Catalogue fabricant Naxani 2026';
   item.naxaniMediaPaired=true;
   item.naxaniPhotoScope=media.scope;
  }
  return rows;
 }
 root.HydroNaxaniPlanMedia=Object.freeze({get,apply,drawing,collections:Object.freeze(Object.keys(gallery))});
})(typeof window!=='undefined'?window:globalThis);
