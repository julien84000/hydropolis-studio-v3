/* Verified Recor.pt product photographs and 2024-2026 manufacturer PDFs.
 * The live WordPress site frequently fails when fetched from Render; use
 * known exact manufacturer assets, never synthetic or unrelated images.
 * Accessible in Node and in the browser; curated images are examples of a
 * model, not verified photographs of an individual priced finish.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroRecorCurated=api;})(typeof window==='object'?window:null,function(){
'use strict';
const ORIGIN='https://recor.pt';
const UPLOADS=ORIGIN+'/wp-content/uploads/';
const data=`COLLINS|collins|2024/06/Collins-900x900-1.jpg|2025/09/Collins-PDF-Technical-Drawing-2025.pdf|2025/09/Collins-leaflet.pdf
HUDSON|hudson-2|2024/06/Hudson-900X900.jpg|2025/09/Hudson-PDF-Technical-Drawing-2025.pdf|2024/10/Hudson-leaflet.pdf
CARLTON|carlton-en|2024/06/Carlton-with-white-feet-900X900.jpg|2025/09/Carlton-PDF-Technical-Drawing-2025.pdf|2024/05/Carlton-leaflet.pdf
ANTIQUE|antique-en|2024/06/Antique1800-BW-900X900.jpg|2024/05/Antique-PDF-Technical-Drawing.pdf|2024/05/Antique-leaflet.pdf
SLIPPER|slipper-en|2024/06/Slipper-900X900.jpg|2025/09/Slipper-PDF-Technical-Drawing-2025.pdf|2024/05/Slipper-leaflet.pdf
DUAL|dual-en|2024/06/Dual-with-Aster-feet-900X900.jpg|2025/09/Dual-PDF-Technical-Drawing-2025.pdf|2024/05/Dual-leaflet.pdf
ROLL-TOP|roll-top-en|2024/06/Roll-Top-with-Aster-feet-900X900.jpg|2025/09/Roll-Top-PDF-Technical-Drawing-2025.pdf|2024/05/Roll-Top-leaflet.pdf
PRIMROSE|primrose-en|2024/06/Primrose-900X900.jpg|2025/09/Primrose-PDF-Technical-Drawing-2025.pdf|2024/05/Primrose-leaflet.pdf
LYRA|lyra-en|2024/06/Lyra-with-wood-feet-900X900.jpg|2025/09/Lyra-PDF-Technical-Drawing-2025.pdf|2024/10/Lyra-leaflet.pdf
GIBSON|gibson-en|2024/06/Gibson-900x900-1.jpg|2024/05/Gibson-PDF-Technical-Drawing.pdf|2024/05/Gibson-leaflet.pdf
CROSBY|crosby-en|2024/06/Crosby-900x900-1.jpg|2025/09/Crosby-PDF-Technical-Drawing-2025.pdf|2024/05/Crosby-leaflet.pdf
ALLEN|allen-en|2024/06/Allen-900X900.jpg|2025/09/Allen-PDF-Technical-Drawing-2025.pdf|2024/10/Allen-leaflet.pdf
CANOVA|canova-en|2024/06/Canova-900X900.jpg|2025/09/Canova-PDF-Technical-Drawing-2025.pdf|2024/10/Canova-leaflet.pdf
SIENA|siena-en|2024/06/Siena-BW-900X900.jpg|2025/09/Siena-PDF-Technical-Drawing-2025.pdf|2024/05/Siena-leaflet.pdf
MORGAN|morgan-en|2024/06/Morgan-900X900.jpg|2025/09/Morgan-PDF-Technical-Drawing-2025.pdf|2026/02/Morgan-leaflet-2026.pdf
DAKOTA|dakota-en|2024/06/Dakota-900X900.jpg|2025/09/Dakota-PDF-Technical-Drawing-2025.pdf|2026/02/Dakota-leaflet-2026.pdf
EIFFEL|eiffel-en|2024/06/Eiffel-with-exterior-painted-900X900.jpg|2025/09/Eiffel-PDF-Technical-Drawing-2025.pdf|2024/05/Eiffel-leaflet.pdf
EPOQUE|epoque-en|2024/06/Epoque-with-exterior-in-Leather-900X900.jpg|2024/05/Epoque-PDF-Technical-Drawing.pdf|2024/05/Epoque-leaflet.pdf
GRAND-EPOQUE|grand-epoque-en|2024/06/Grand-Epoque-900X900.jpg|2025/09/Grand-Epoque-PDF-Technical-Drawing-2025.pdf|2024/05/Grand-Epoque-leaflet.pdf
IRIS|iris-en|2024/06/Iris-White-BW-900X900.jpg|2025/09/Iris-PDF-Technical-Drawing-2025.pdf|2024/05/Iris-leaflet.pdf
CHATEAU|chateau-en|2024/06/Chateau-900X900.jpg|2025/09/Chateau-PDF-Technical-Drawing-2025.pdf|2024/05/Chateau-leaflet.pdf
CAMILE|camile|2026/06/Camile-decor-900x900-1.jpg|2026/06/Camile-PDF-Technical-Drawing-2026.pdf|2026/06/Camile-leaflet.pdf
FLEMING|fleming-en|2024/06/Fleming-900X900.jpg|2025/09/Fleming-PDF-Technical-Drawing-2025.pdf|2024/05/Fleming-leaflet.pdf
MORITZ|moritz-en|2024/06/Moritz-900x900-1.jpg|2025/09/Moritz-PDF-Technical-Drawing-2025.pdf|2024/05/Moritz-leaflet.pdf
BAVARIA|bavaria-en|2024/06/Bavaria-900X900.jpg|2025/09/Bavaria-PDF-Technical-Drawing-2025.pdf|2024/05/Bavaria-leaflet.pdf
CLASSIC|classic-en|2024/06/Classic-900X900.jpg|2025/09/Classic-PDF-Technical-Drawing-2025.pdf|2024/05/Classic-leaflet.pdf
BALI|bali-en|2024/06/Bali-900X900.jpg|2025/09/Bali-PDF-Technical-Drawing-2025.pdf|2024/05/Bali-leaflet.pdf
SHOWER-TRAYS|shower-trays-en|2024/06/Base-900X900.jpg|2025/09/Shower-Trays-PDF-Technical-Drawing-2025.pdf|2024/05/Shower-trays-leaflet.pdf
HAND-GILDED|hand-gilded|2024/06/Folheado-900x900-1.jpg||
MOSAIC-EXTERIOR|mosaic-exterior|2024/06/Mosaico-900X900.jpg||
HAND-POLISHED|hand-polished|2024/06/Polido-900X900.jpg||
SOLID-COPPER|solid-copper|2024/06/Cobre-900X900.jpg||
SOLID-BRASS|solid-brass|2024/06/Latao-900X900.jpg||
SOLID-ALUMINIUM|solid-aluminium|2024/06/Aluminio-900X900.jpg||
STAINLESS-STEEL|stainless-steel|2024/06/Inox-900X900.jpg||
LEATHER|leather|2024/06/Pele-900X900.jpg||
NATURAL-RUSTIC|natural-rustic|2025/09/Natural-Rustic-900x900-1.jpg||
BRONZE-RUSTIC|bronze-rustic-finish|2025/09/Bronze-Rustic-900x900-1.jpg||`;
const extra={
 "SLIPPER": [
  "2024/06/Slipper-BW-900x900-1.jpg",
  "2024/06/Aster-Chromed-feet-on-SL-Detail-900X900.jpg",
  "2024/06/BC-FEET-SL-900X900.jpg"
 ],
 "HUDSON": [
  "2024/06/Hudson-BW-900X900.jpg",
  "2024/06/Hudson-Carlton-feet-detail-900X900.jpg"
 ],
 "CARLTON": [
  "2024/06/Carlton-Chrome-BW-900X900.jpg",
  "2024/06/Carlton-with-chromed-feet-900X900.png"
 ],
 "DUAL": [
  "2024/06/Dual1700-Imperial-BW-900X900.jpg",
  "2024/06/Dual1700-Aster-BW-900X900.jpg"
 ],
 "LYRA": [
  "2024/06/Lyra-DarkBeech-BW-900X900.jpg",
  "2024/06/Lyra-with-Lyra-feet-900X900.jpg"
 ],
 "ROLL-TOP": [
  "2024/06/RollTop1700-BW-900X900.jpg"
 ],
 "PRIMROSE": [
  "2024/06/Primrose-BW-900X900.jpg"
 ],
 "CAMILE": [
  "2026/06/Camile_bw-900x900-1.png"
 ]
};
const media=Object.create(null);
for(const line of data.trim().split('\n')){
 const [model,slug,photo,technical,brochure]=line.split('|');
 if(!model||!photo)continue;
 const images=[photo,...(extra[model]||[])].map(x=>UPLOADS+x);
 media[model]=Object.freeze({model,productUrl:ORIGIN+'/product/'+slug+'/',image:images[0],images,
  technicalSheetUrl:technical?UPLOADS+technical:'',
  brochureUrl:brochure?UPLOADS+brochure:'',
  verifiedModel:true,verifiedExactFinish:false,source:'Recor · photographie officielle vérifiée'});
}
function get(model){return media[String(model||'').toUpperCase()]||null}
function photo(model,index=0){return get(model)?.images[index]||''}
return Object.freeze({get,photo,models:Object.freeze(Object.keys(media))});
});
