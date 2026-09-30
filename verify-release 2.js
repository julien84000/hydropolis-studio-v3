'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),zlib=require('zlib');
const read=n=>JSON.parse(fs.readFileSync(path.join(__dirname,n),'utf8'));

// V11.54.4 — corps d'encastrement automatiques.
// Résout la fiche catalogue d'origine même lorsque la ligne projet n'a pas conservé internalReference/internalPrice.
// Exception : Lefroy Brooks, dont les corps sont déjà intégrés à la logique catalogue.
const indexPath=path.join(__dirname,'public/index.html');
const HOTFIX_MARKER='V11.54.4_ROUGHIN_AUTO_CATALOG_LOOKUP';
const hotfix=String.raw`<script>
/* V11.54.4_ROUGHIN_AUTO_CATALOG_LOOKUP */
(function(){
'use strict';
function norm(v){return String(v||'').trim().toLowerCase();}
function isLefroy(p){return /lefroy\s*brooks/i.test(String((p&&p.manufacturer)||''));}
function qty(v){var n=Math.floor(Number(v));return Number.isFinite(n)&&n>=1?Math.min(999,n):1;}
function uid(){return (typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():('rough-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));}
function sourceFor(p){
  if(!p)return null;
  if(String(p.internalReference||'').trim())return p;
  var s=null;
  try{
    if(typeof productFromCatalogSources==='function')s=productFromCatalogSources(String(p.reference||''),'');
  }catch(e){}
  if(s&&norm(s.manufacturer)===norm(p.manufacturer))return s;
  try{
    if(typeof CATALOG!=='undefined'&&Array.isArray(CATALOG)){
      s=CATALOG.find(function(x){return norm(x.reference)===norm(p.reference)&&norm(x.manufacturer)===norm(p.manufacturer);})||null;
    }
  }catch(e){}
  return s||p;
}
function roughRef(p){var s=sourceFor(p);return String((s&&s.internalReference)||'').trim();}
function bodyPrice(p){var s=sourceFor(p),n=Number(s&&s.internalPrice);return Number.isFinite(n)&&n>=0?n:0;}
function eligible(p){return !!(p&&!p.accessoryFor&&!p.requiredRoughIn&&!isLefroy(p)&&roughRef(p));}
function hydrate(p){
  if(!p||isLefroy(p))return p;
  var s=sourceFor(p),ref=String((s&&s.internalReference)||'').trim(),ip=Number(s&&s.internalPrice);
  if(ref){p.internalReference=ref;p.internalPrice=Number.isFinite(ip)&&ip>=0?ip:0;}
  return p;
}
function splitEmbeddedBodyPrice(p){
  if(!eligible(p))return false;
  var s=sourceFor(p),ip=bodyPrice(p),base=Number(s&&s.price),full=Number(s&&s.totalPrice),changed=false;
  if(!(ip>0)||!Number.isFinite(base))return false;
  function splitField(name){
    var v=Number(p[name]);if(!Number.isFinite(v))return;
    if(Number.isFinite(full)&&Math.abs(v-full)<=0.03){p[name]=base;changed=true;return;}
    if(v>=base+ip-0.03&&Math.abs((v-ip)-base)<=0.03){p[name]=base;changed=true;}
  }
  splitField('price');splitField('totalPrice');splitField('catalogPrice');splitField('catalogTotalPrice');
  return changed;
}
function hasBody(parent,extra){
  var ref=roughRef(parent),all=[];
  if(typeof state!=='undefined'&&Array.isArray(state.selected))all=all.concat(state.selected);
  if(Array.isArray(extra))all=all.concat(extra);
  return all.some(function(x){return x&&x.accessoryFor===parent.id&&(x.requiredRoughIn===true||norm(x.reference)===norm(ref));});
}
function makeBody(parent){
  var s=sourceFor(parent),ref=roughRef(parent),ip=bodyPrice(parent);
  return {id:uid(),roomId:parent.roomId,manufacturer:parent.manufacturer,collection:parent.collection||'',category:parent.category||'Robinetterie',reference:ref,designation:'Corps d’encastrement obligatoire',originalDesignation:'Corps d’encastrement obligatoire',finish:'',currency:parent.currency||'€',vat:parent.vat||'HT',price:ip,totalPrice:ip,catalogPrice:ip,catalogTotalPrice:ip,priceOverride:null,quantity:qty(parent.quantity),quantityPerParent:1,accessoryFor:parent.id,requiredRoughIn:true,mandatoryAccessory:true,hideFromDossier:false,leadTime:parent.leadTime||'',image:'',images:[],pdfImage:'',pdfImages:[],customImage:false,includeDrawing:false,includeTechnicalSheet:false,includeInstallationGuide:false,source:(s&&s.source)||parent.source||'',sourceYear:(s&&s.sourceYear)||parent.sourceYear||'',purchaseDiscount:parent.purchaseDiscount,supplierNote:'Corps d’encastrement requis pour '+String(parent.reference||'')};
}
function expand(records){
  var out=[];
  (records||[]).forEach(function(rec){
    if(!rec)return;
    hydrate(rec);
    if(eligible(rec)){
      splitEmbeddedBodyPrice(rec);
      out.push(rec);
      if(!hasBody(rec,out))out.push(makeBody(rec));
    }else out.push(rec);
  });
  return out;
}
if(typeof commitSelectedRecords==='function'){
  var baseCommit=commitSelectedRecords;
  commitSelectedRecords=function(records,opts){return baseCommit(expand(records),opts||{});};
  function repair(){
    if(typeof state==='undefined'||!Array.isArray(state.selected))return;
    var add=[],changed=false;
    state.selected.slice().forEach(function(p){
      if(!p||p.accessoryFor||p.requiredRoughIn||isLefroy(p))return;
      var before=String(p.internalReference||'');hydrate(p);if(String(p.internalReference||'')!==before)changed=true;
      if(!eligible(p))return;
      if(splitEmbeddedBodyPrice(p))changed=true;
      if(!hasBody(p,add))add.push(makeBody(p));
    });
    if(add.length){baseCommit(add,{showProject:false});return;}
    if(changed){if(typeof saveState==='function')saveState();if(typeof renderSelection==='function')renderSelection();if(typeof renderRooms==='function')renderRooms();if(typeof renderMarginDashboard==='function')renderMarginDashboard();}
  }
  setTimeout(repair,0);setTimeout(repair,400);setTimeout(repair,1200);setTimeout(repair,3000);
  if(typeof window!=='undefined')window.addEventListener('load',function(){setTimeout(repair,200);setTimeout(repair,1000);});
}
})();
</script>`;
let html=fs.readFileSync(indexPath,'utf8');
if(!html.includes(HOTFIX_MARKER)){
  assert(html.includes('</body>'),'index.html : balise </body> introuvable');
  html=html.replace('</body>',hotfix+'\n</body>');
  fs.writeFileSync(indexPath,html,'utf8');
}

const files=fs.readdirSync(path.join(__dirname,'public'));for(const f of files.filter(x=>x.endsWith('.json')))read('public/'+f);
const v=read('public/vismara_tariff_2026.json'),kn=v.pages.find(p=>p.model==='KN');assert(kn.matrix.some(r=>r.range==='KN 67'&&r.profiles.includes('21')&&r.glasses.includes('04')&&r.price===1265));assert(kn.matrix.some(r=>r.range==='KN 68 … KN 77'&&r.profiles.includes('31')&&r.glasses.includes('05')&&r.price===1515));
const t=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'tda_tariff_2026.json.gz'))));assert(t.rows.length>300000);
const idx=read('assets_index.json');for(const pack of new Set(Object.values(idx)))assert(fs.existsSync(path.join(__dirname,pack)));
html=fs.readFileSync(indexPath,'utf8');assert.equal((html.match(/<script src=/g)||[]).length,1);assert(html.includes('app.js?v=11.54-clean-final'));assert(html.includes(HOTFIX_MARKER));
console.log('V11.54.4 : catalogues vérifiés + corps d’encastrement automatiques via résolution catalogue (Lefroy Brooks exclu).');
