/* Program FR 02/2026, printed pp.76–83. Source prices only; +4% once. */
(function(root){
'use strict';
const band=(v,r)=>Number.isFinite(v)&&v>=r[0]&&v<=r[1];
const defaults=()=>({basin:'S15',additional:'',curve:'none',length:120,depth:50,height:10,tap:'',overflow:'',drain:'',backsplash:0,backTap:false,wallBacksplash:false,shelf:'',drawer:'',underShelf:false,towel:'',visibleBrackets:false,specialCut:false});
function quote(input){
 const d=root.HydroProgramData,s={...defaults(),...input},errors=[],components=[];
 const length=Number(s.length),depth=Number(s.depth),height=Number(s.height);
 if(!Number.isInteger(length)||!Number.isInteger(depth)||!(height===1.2||Number.isInteger(height)))errors.push('Dimensions au centimètre : hauteur 1,2 cm ou de 3 à 40 cm.');
 const row=d.rows.find(r=>band(length,r.length)&&band(depth,r.depth)&&band(height,r.height));
 if(!row)errors.push('Dimensions sans tranche publiée : longueur 60–201 cm, profondeur 40–60 cm, hauteur 1,2 ou 3–40 cm.');
 const push=(label,reference,rawPrice)=>components.push({label,reference:reference||'',rawPrice});
 const opt=(ref,label)=>{if(!ref)return;const o=d.options[ref];if(!o||o.rawPrice===null){errors.push('Option sans prix confirmé : '+ref);return;}push(label||o.label,ref,o.rawPrice)};
 if(row)push('Plan Program Scene blanc lisse',row.reference,row.rawPrice);
 const basin=d.basins.find(b=>b.id===s.basin),extra=d.basins.find(b=>b.id===s.additional);
 if(!basin)errors.push('Choisir une vasque du tarif.');
 else{push('Vasque principale '+basin.id,basin.reference,basin.rawPrice);if(basin.depth>depth||basin.length>length)errors.push('La vasque principale dépasse les dimensions du plan.');}
 if(s.additional){
  if(!extra)errors.push('Vasque additionnelle inconnue.');
  else{
   const type=[0,82,103,144,185,226].indexOf(extra.rawPrice);
   if(type<0)errors.push('Supplément de vasque additionnelle non vérifié.');else opt('OPWB'+String(type+1).padStart(4,'0'),'Vasque additionnelle '+extra.id+' · type '+type);
   if(extra.depth>depth||(basin&&extra.length+basin.length>length))errors.push('Les deux vasques ne tiennent pas dans les dimensions du plan.');
  }
 }
 if(!['none','L','R','LR'].includes(s.curve))errors.push('Option Curve inconnue.');
 else if(s.curve!=='none'){
  if(depth<45||depth>50||height>20)errors.push('Curve : profondeur 45–50 cm, hauteur 1,2 ou 3–20 cm (p.76).');
  push('Curve '+s.curve.replace('LR','L+R')+' · p.79','',123);
 }
 const allowed={tap:['','OPWB0007','OPWB0008','OPWB0009','OPWB0010'],overflow:['','OPWB0011','OPWB0012'],drain:['','OPWB0050','OPWB0051','OPWB0052','OPWB0053','OPWB0054','OPWB0055'],shelf:['','OPWB0127','OPWB0128','OPWB0129'],drawer:['','OPWB0130','OPWB0131','OPWB0132'],towel:['',...Array.from({length:23},(_,i)=>'OPWB'+String(104+i).padStart(4,'0'))]};
 for(const [key,list] of Object.entries(allowed)){
  if(!list.includes(s[key]))errors.push('Option '+key+' invalide.');
  else if(s[key]){
   if(key==='towel'&&s[key]!=='OPWB0104')errors.push('Porte-serviettes : montants contradictoires entre p.81 et p.83, confirmation fabricant requise.');
   else opt(s[key]);
  }
 }
 if(s.towel==='OPWB0104'&&(height<10||height>40))errors.push('Porte-serviettes intégré : jupe frontale 10–15 cm ou 16–40 cm (p.81).');
 if(s.shelf&&height!==20)errors.push('Étagère intégrée latérale : jupe de 20 cm requise.');
 if(s.drawer&&(height!==20||depth<40))errors.push('Tiroir : jupe de 20 cm et profondeur au moins 40 cm requises.');
 if(s.shelf&&s.drawer)errors.push('Combinaison étagère/tiroir : implantation à faire confirmer.');
 if((s.shelf||s.drawer)&&basin){
  const availableWidth=s.shelf?{OPWB0127:30,OPWB0128:40,OPWB0129:50}[s.shelf]:{OPWB0130:30,OPWB0131:40,OPWB0132:50}[s.drawer];
  if(basin.length+(extra?.length||0)+availableWidth>length)errors.push('L’espace latéral sélectionné dépasse la longueur disponible.');
 }
 if(s.underShelf){
  if(height!==40)errors.push('Étagère sous plan : hauteur de 40 cm requise.');
  if(row){const i=d.rows.slice(0,7).findIndex(r=>band(length,r.length));if(i>5||i<0)errors.push('Étagère sous plan : pas de prix publié au-delà de 181 cm.');else opt('OPWB'+String(133+i).padStart(4,'0'));}
 }
 const backsplash=Number(s.backsplash);
 if(backsplash){
  const ranges=[[5,10,62],[11,15,70],[16,30,80]],range=ranges.find(r=>band(backsplash,r));
  if(!range||!Number.isInteger(backsplash))errors.push('Crédence : hauteur entière de 5 à 30 cm.');
  else if(row){const i=d.rows.slice(0,7).findIndex(r=>band(length,r.length));opt('OPWB'+String(range[2]+i).padStart(4,'0'));}
 }
 if(s.backTap){if(backsplash<15)errors.push('Préparation robinetterie de crédence : hauteur 15–30 cm.');else opt('OPWB0102');}
 if(s.wallBacksplash)errors.push('Crédence murale robinetterie : incohérences tarifaires p.80/p.83, confirmation fabricant requise.');
 if(s.visibleBrackets)push('Fixations visibles · p.80','',110);
 if(s.specialCut)errors.push('Découpe spéciale +10 % : dessin et assiette du supplément à confirmer par Hidrobox.');
 const rawPrice=components.reduce((n,c)=>n+c.rawPrice,0),price=Math.round(rawPrice*104)/100;
 return {ok:!errors.length,errors,components,reference:row?.reference||'',rawPrice:errors.length?null:rawPrice,price:errors.length?null:price,purchasePrice:errors.length?null:Math.round(price*50)/100,purchaseDiscount:50,source:d.source,sourcePages:d.printedPages,configuration:s,basin,extra,tier:row||null};
}
root.HydroProgram2026={defaults,quote};
})(window);
