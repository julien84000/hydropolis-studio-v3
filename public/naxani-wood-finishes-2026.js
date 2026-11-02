/* Naxani Tarifa 2026 — reference-exact species/finish and cabinet-model map.
 * Verified against printed tariff tables pp. 4–31 (PDF page = sourcePage).
 * Never infer the species from the generic collection photograph.
 */
(function(root){
'use strict';
const lookup=new Map(), warnings=[];
function register(collection,finish,model,refs,finishType='essence'){
 const list=String(refs).split(/\s+/).filter(Boolean);
 for(const token of list){
  const m=token.match(/^(\d{6})(?:-(\d{6}))?$/);
  if(!m)throw Error('Invalid Naxani tariff reference '+token);
  const a=Number(m[1]),b=Number(m[2]||m[1]);
  for(let n=a;n<=b;n++){
   const key=collection+'|'+n;
   const next={naWood:finish,naVariant:model,naFinishType:finishType};
   const prior=lookup.get(key);
   if(prior&&(prior.naWood!==finish||prior.naVariant!==model))throw Error('Conflicting Naxani wood mapping '+key);
   lookup.set(key,next);
  }
 }
}
const R=register;
// Collections with one documented species
R('Batz','Chêne américain','1C','505007-505076');
R('Batz','Chêne américain','2C','505083-505151');
R('Grid','Chêne américain','1C','505441-505519');
R('Grid','Chêne américain','2C','505526-505595');
R('Igi','Chêne américain','1C','505601-505670');
R('Igi','Chêne américain','2C','505687-505755');
R('Linjer','Frêne','1C','506011-506080');
R('Linjer','Frêne','2C','506097-506165');
R('Linjer','Frêne','Module complémentaire','506172');
R('Dumbo','Bois teinté','2 tiroirs','505205-505267','finition');
R('Roten','Frêne massif','1 tiroir','507841-507940');
R('Roten','Frêne massif','Complément','507957 507964');
R('Valnöt','Noyer américain','1 tiroir','510162-510230');
R('Walden','Chêne américain','1 tiroir','511190-511268');
R('Walden','Burned','1 tiroir','511275-511343','teinte');
R('Puma','Essence non précisée au tarif','Meuble / complément','507827 507834 579281','non-precise');
// Gentle: walnut/oak, including modular cabinets & inside drawers
R('Gentle','Noyer américain','Meuble / complément','505304-505366 515884 515891 515907 515914');
R('Gentle','Chêne américain','Meuble / complément','505373-505434 515921 515938 515945 515952');
// Materia: the printed distinction is the wood colour, not the botanical species
R('Materia','Dark','Meuble 1 tiroir','506189-506257','teinte');
R('Materia','Honey','Meuble 1 tiroir','506325-506394','teinte');
R('Materia','Dark','Complément','506264 506301 506318','teinte');
R('Materia','Honey','Complément','506400 506448 506455','teinte');
// Modùl
R('Mòdul','Chêne américain','1 tiroir','506523 515730 506530 515747 506547 515754 506554 506561 506578 515761');
R('Mòdul','Noyer américain','1 tiroir','506462 515693 506479 515709 506486 515716 506493 506509 506516 515723');
// PRENN 31: bare cabinet / integrated wooden top; 64: 2 drawers + door
R('Prenn','Iroko','31 · 1 tiroir','506585-506653');
R('Prenn','Érable','31 · 1 tiroir','506820-506899');
R('Prenn','Noyer','31 · 1 tiroir','507063-507131');
R('Prenn','Chêne','31 · 1 tiroir','507308-507377');
R('Prenn','Iroko','31 · plateau bois','506660-506738');
R('Prenn','Érable','31 · plateau bois','506905-506974');
R('Prenn','Noyer','31 · plateau bois','507148-507216');
R('Prenn','Chêne','31 · plateau bois','507384-507452');
R('Prenn','Iroko','64 · 2 tiroirs + porte','507544-507605');
R('Prenn','Érable','64 · 2 tiroirs + porte','507612-507674');
R('Prenn','Noyer','64 · 2 tiroirs + porte','507681-507742');
R('Prenn','Chêne','64 · 2 tiroirs + porte','507759-507810');
R('Prenn','Iroko','Demi-colonne','506806 506813');
R('Prenn','Érable','Demi-colonne','507049 507056');
R('Prenn','Noyer','Demi-colonne','507285 507292');
R('Prenn','Chêne','Demi-colonne','507520 507537');
// SLAT 1C and 2C, with optional wood tops and half-height accessory units
R('Slat','Frêne','1C · 1 tiroir','508152-508213');
R('Slat','Iroko','1C · 1 tiroir','508275-508336');
R('Slat','Érable','1C · 1 tiroir','508398-508459');
R('Slat','Noyer','1C · 1 tiroir','508510-508572');
R('Slat','Chêne','1C · 1 tiroir','508633-508695');
R('Slat','Frêne','1C · plateau bois','520130-520192');
R('Slat','Iroko','1C · plateau bois','520208-520260');
R('Slat','Érable','1C · plateau bois','520710-520772');
R('Slat','Noyer','1C · plateau bois','520277-520338');
R('Slat','Chêne','1C · plateau bois','520345-520406');
R('Slat','Frêne','2C · 2 tiroirs','508756-508817');
R('Slat','Iroko','2C · 2 tiroirs','508862-508923');
R('Slat','Érable','2C · 2 tiroirs','508978-509036');
R('Slat','Noyer','2C · 2 tiroirs','509081-509142');
R('Slat','Chêne','2C · 2 tiroirs','509197-509258');
R('Slat','Frêne','Complément','508824');
R('Slat','Iroko','Complément','508930');
R('Slat','Érable','Complément','509043');
R('Slat','Noyer','Complément','509159');
R('Slat','Chêne','Complément','509265');
R('Slat','Frêne','Demi-colonne','508251 508268');
R('Slat','Iroko','Demi-colonne','508374 508381');
R('Slat','Érable','Demi-colonne','508497 508503');
R('Slat','Noyer','Demi-colonne','508619 508626');
R('Slat','Chêne','Demi-colonne','508732 508749');
// SURÓ: Honey, Smoked, Burned and Dark are wood stains, not species.
for(const [f,standard,woodTop,tall,half] of [
 ['Honey','509302-509371','509388-509432','509784-509845','509449 509456'],
 ['Smoked','509623-509692','509708-509753','509852-509913','509760 509777'],
 ['Burned','509463-509531','509548-509593','514603-514665','509609 509616'],
 ['Dark','514436-514504','514672-514726','514535-514597','514511 514528']
]){
 R('Suró',f,'31 · 1 tiroir',standard,'teinte');
 R('Suró',f,'31 · plateau bois',woodTop,'teinte');
 R('Suró',f,'64 · 2 tiroirs + porte',tall,'teinte');
 R('Suró',f,'Demi-colonne',half,'teinte');
}
// TABA 1C and 2C with five documented wood species
for(const [f,single,single150,double,double150,side,half] of [
 ['Frêne','510292-510353','511862','510742-510803','511916','510810','510360 510377'],
 ['Érable','510476-510537','511909','510902-510964','511954','510971','510544 510551'],
 ['Noyer','510568-510629','511886','510988-511046','511930','511053','510636 510643'],
 ['Chêne','510650-510711','511893','511060-511121','511947','511138','510728 510735'],
 ['Iroko','510384-510445','511879','510827-510889','511923','510896','510452 510469']
]){
 R('Taba',f,'1C · 1 tiroir',single+' '+single150);
 R('Taba',f,'2C · 2 tiroirs',double+' '+double150);
 R('Taba',f,'Complément',side);
 R('Taba',f,'Demi-colonne',half);
}
R('Unda','Frêne massif','1 tiroir','509920-509999');
R('Unda','Noyer américain','1 tiroir','510087-510155');
R('Unda','Érable','1 tiroir','510001-510070');
// SHOSUBA: two types of wood worktop vs finished cabinet: not two wood species
R('Shosuba','Frêne massif','Plan bois','507971-508053');
R('Shosuba','Frêne brûlé','Plan bois','508060-508145','teinte');
R('Shosuba','Laqué','Caisson 1 tiroir','502495-502570','finition');
R('Shosuba','TEX','Caisson 1 tiroir','502587-502662','finition');
function annotate(rows){
 let mapped=0,unmapped=[];
 for(const p of rows||[]){
  if(p?.manufacturer!=='Naxani'||p.productType!=='bois-massif')continue;
  const match=lookup.get(p.collection+'|'+p.reference);
  if(match){Object.assign(p,match);mapped++;}
  else if(!p.naWood)unmapped.push(p.reference);
 }
 return {mapped,unmapped};
}
root.HydroNaxaniWoodFinishes={annotate,lookup,initial:annotate(root?.HydroNaxani2026?.rows),source:'Naxani Tarifa 2026, pages 4–31'};
})(typeof window!=='undefined'?window:globalThis);
