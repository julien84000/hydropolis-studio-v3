/* Diagrammatic navigation pictograms; the category tree follows Radaway France taxonomy. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroRadawayHierarchy=api;})(typeof window==='object'?window:null,function(){
 'use strict';
 const sets={"paroi":[["angle-one","En angle · ouverture 1 côté","https://www.radaway.fr/typ/prostokatne-wejscie-z-boku/","M8 12H14V5H8 M82 12H68V5H82 M8 12L45 50L82 12 M45 50V67"],["angle-two","En angle · ouverture 2 côtés","https://www.radaway.fr/typ/prostokatne-wejscie-z-naroznika/","M8 12H14V5H8 M82 12H68V5H82 M8 12L45 50L82 12 M45 50L24 32 M45 50L65 32"],["round","Quart de rond","https://www.radaway.fr/typ/kabiny-polokragle/","M9 14H15V6H9 M81 14H75V6H81 M9 14Q45 76 81 14 M45 71V64"],["round-asym","Quart de rond asymétrique","https://www.radaway.fr/typ/kabiny-polokragle-asymetryczne/","M9 14H15V6H9 M82 14H76V6H82 M9 14Q25 74 82 14"],["round-b","Quart de rond type B","https://www.radaway.fr/typ/kabiny-polokragle-typu-b/","M9 14H15V6H9 M82 14H76V6H82 M9 14Q45 65 82 14 M46 44L53 57"],["u-round","En U · arrondi, milieu de mur","https://www.radaway.fr/typ/przyscienne-polokragle/","M20 14H76 M20 14V39 Q20 68 48 68Q76 68 76 39V14 M36 14V53"],["u-rect","Carré / rectangle · milieu de mur","https://www.radaway.fr/typ/kabiny-przyscienne/","M17 14H79 M17 14V67H79V14 M49 14V67"],["pentagon","Pentagone","https://www.radaway.fr/typ/pieciokatne/","M8 14H17V6H8 M82 14H73V6H82 M8 14L27 62H62L82 14 M27 62L40 48H49"]],"walk":[["mono","Monobloc · 1 verre","https://www.radaway.fr/typ/jednoczesciowe-walk-in/","M12 11V69 M12 11H20 M20 11L74 24V63L20 50Z M20 50V64 M74 24L82 18"],["multi","En plusieurs parties","https://www.radaway.fr/typ/wieloczesciowe-walk-in/","M8 11V69 M8 11H18 M18 11L49 24V63L18 50Z M49 24L80 37V75L49 63Z"]],"doors":[["in","Ouverture intérieure","https://www.radaway.fr/typ/do-wewnatrz/","M18 8H78V72H18Z M18 8L60 26V59L18 72 M42 42L61 39L51 28 M61 39L53 52"],["out","Ouverture extérieure","https://www.radaway.fr/typ/na-zewnatrz/","M18 8H78V72H18Z M18 8L50 25V57L18 72 M50 40L74 41L65 29 M74 41L64 53"],["swing","Pivotante","https://www.radaway.fr/typ/wahadlowo/","M18 8V72 M18 8H78V72H18 M18 8L58 24V57L18 72 M59 17Q86 43 59 68"],["slide","Coulissante","https://www.radaway.fr/typ/przesuwne/","M13 10H83V70H13Z M47 10V70 M20 58H40 M54 58H76 M38 41L60 41 M53 34L60 41L53 48"],["fold","Pliante","https://www.radaway.fr/typ/bifold/","M12 9H84V71H12Z M12 9L40 39L12 71 M40 39L64 14L84 71 M40 39L69 39"]],"bath":[["static","Monobloc fixe","https://www.radaway.fr/typ/parawany-jednoczesciowe-nieskladane/","M10 60H85 M17 58V11H57V58"],["hinge1","Une partie rabattable","https://www.radaway.fr/typ/parawany-jednoczesciowe-skladane/","M10 60H85 M17 58V11H57V58 M17 11L76 20"],["hinge2","Deux parties dont une rabattable","https://www.radaway.fr/typ/parawany-dwuczesciowe-skladany-jeden-element/","M10 60H85 M17 58V11H47V58 M47 11L74 23"],["hinge-both","Deux parties rabattables","https://www.radaway.fr/typ/parawany-dwuczesciowe-skladane/","M10 60H85 M17 58V11L44 39L70 11V58"],["hinge-many","Plusieurs parties rabattables","https://www.radaway.fr/typ/parawany-wieloczesciowe-skladane/","M10 60H85 M17 58V11L38 35L59 11L80 35V58"],["bath-slide","Coulissante","https://www.radaway.fr/typ/parawany-przesuwne/","M10 60H85 M17 58V11H73V58 M45 11V58 M39 35H58"],["bath-door","Porte de douche sur baignoire","https://www.radaway.fr/typ/parawany-zabudowy/","M10 60H85 M17 58V11H73V58 M47 11L64 19V51L47 58"]]};
 const byGroup=group=>(sets[group]||[]).map(([id,label,url,path])=>({id,label,url,path}));
 function pictogram(option){
  const p=option?.path||'';
  return '<svg viewBox="0 0 96 80" width="84" height="72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+
   '<path d="'+String(p).replace(/"/g,'')+'" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'+
   '<path d="M6 74H90" stroke="currentColor" stroke-width=".8" opacity=".18"/></svg>';
 }
 const groups=[
  {id:'paroi',label:'Parois de douche',menuLabel:'Forme',type:'Paroi de douche',url:'https://www.radaway.fr/typ/kabiny-prysznicowe/'},
  {id:'walk',label:'Walk-in',menuLabel:'Composition',type:'Walk-in',url:'https://www.radaway.fr/typ/walk-in/'},
  {id:'doors',label:'Portes de niche',menuLabel:'Type d’ouverture',type:'Porte de niche',url:'https://www.radaway.fr/typ/drzwi-wnekowe/'},
  {id:'bath',label:'Pare-baignoires',menuLabel:'Type de pare-baignoire',type:'Pare-baignoire',url:'https://www.radaway.fr/typ/zabudowy-nawannowe/'}
 ];
 function groupFor(p){return p?.productType==='Walk-in'?'walk':p?.productType==='Porte de niche'?'doors':p?.productType==='Pare-baignoire'?'bath':'paroi'}
 function shapeFor(p){
  const name=(p?.designation||'')+' '+(p?.form||'');
  const group=groupFor(p),form=String(p?.form||'').toLowerCase();
  if(group==='walk')return /plusieurs|kdd| iii\b/i.test(name)?'multi':'mono';
  if(group==='doors')return /pliante|dwb\b/i.test(name)?'fold':/coulissante|dwjs|dwd\b/i.test(name)?'slide':/pivotante/i.test(name)?'swing':/intérieure/i.test(name)?'in':'out';
  if(group==='bath')return /coulissante/i.test(form)?'bath-slide':/rabattable/i.test(form)?'hinge1':'static';
  if(/pentagon|ptj\b/i.test(name))return 'pentagon';
  if(/quart de rond|polokrag/i.test(name))return 'round';
  if(/milieu de mur|kds\b/i.test(name))return 'u-rect';
  if(/2 côtés|kdd\b/i.test(name))return 'angle-two';
  return 'angle-one';
 }
 return {groups,byGroup,pictogram,groupFor,shapeFor};
});