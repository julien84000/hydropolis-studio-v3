'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),zlib=require('zlib');
const read=n=>JSON.parse(fs.readFileSync(path.join(__dirname,n),'utf8'));

// V11.54.3 — corps d'encastrement automatiques pour les références qui déclarent internalReference.
// Exception : Lefroy Brooks, dont les corps sont déjà intégrés à la logique catalogue.
const indexPath=path.join(__dirname,'public/index.html');
const HOTFIX_MARKER='V11.54.3_ROUGHIN_AUTO';
const hotfix=String.raw`<script>
/* V11.54.3_ROUGHIN_AUTO */
(function(){
'use strict';
function roughRef(p){return String((p&&p.internalReference)||'').trim();}
function isLefroy(p){return /lefroy\s*brooks/i.test(String((p&&p.manufacturer)||''));}
function eligible(p){return !!(p&&!p.accessoryFor&&!p.requiredRoughIn&&roughRef(p)&&!isLefroy(p));}
function qty(v){var n=Math.floor(Number(v));return Number.isFinite(n)&&n>=1?Math.min(999,n):1;}
function uid(){return (typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():('rough-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));}
function bodyPrice(p){var n=Number(p&&p.internalPrice);return Number.isFinite(n)&&n>=0?n:0;}
function splitEmbeddedBodyPrice(p){
  if(!eligible(p))return false;
  var ip=bodyPrice(p),base=Number(p.price),total=Number(p.totalPrice),changed=false;
  if(Number.isFinite(base)&&Number.isFinite(total)&&total>=base+ip-0.02){p.totalPrice=Math.max(0,total-ip);changed=true;}
  var ct=Number(p.catalogTotalPrice),cp=Number(p.catalogPrice);
  if(Number.isFinite(cp)&&Number.isFinite(ct)&&ct>=cp+ip-0.02){p.catalogTotalPrice=Math.max(0,ct-ip);changed=true;}
  return changed;
}
function hasBody(parent,extra){
  var ref=roughRef(parent),all=[];
  if(typeof state!=='undefined'&&Array.isArray(state.selected))all=all.concat(state.selected);
  if(Array.isArray(extra))all=all.concat(extra);
  return all.some(function(x){return x&&x.accessoryFor===parent.id&&(x.requiredRoughIn===true||String(x.reference||'').trim()===ref);});
}
function makeBody(parent){
  var ref=roughRef(parent),ip=bodyPrice(parent);
  return {id:uid(),roomId:parent.roomId,manufacturer:parent.manufacturer,collection:parent.collection||'',category:parent.category||'Robinetterie',reference:ref,designation:'Corps d’encastrement obligatoire',originalDesignation:'Corps d’encastrement obligatoire',finish:'',currency:parent.currency||'€',vat:parent.vat||'HT',price:ip,totalPrice:ip,catalogPrice:ip,catalogTotalPrice:ip,priceOverride:null,quantity:qty(parent.quantity),quantityPerParent:1,accessoryFor:parent.id,requiredRoughIn:true,mandatoryAccessory:true,hideFromDossier:false,leadTime:parent.leadTime||'',image:'',images:[],pdfImage:'',pdfImages:[],customImage:false,includeDrawing:false,includeTechnicalSheet:false,includeInstallationGuide:false,source:parent.source||'',sourceYear:parent.sourceYear||'',supplierNote:'Corps d’encastrement requis pour '+String(parent.reference||'')};
}
function expand(records){
  var out=[];
  (records||[]).forEach(function(rec){
    if(!rec)return;
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
      if(!eligible(p))return;
      if(splitEmbeddedBodyPrice(p))changed=true;
      if(!hasBody(p,add))add.push(makeBody(p));
    });
    if(add.length){baseCommit(add);return;}
    if(changed){if(typeof saveState==='function')saveState();if(typeof renderSelection==='function')renderSelection();if(typeof renderRooms==='function')renderRooms();if(typeof renderMarginDashboard==='function')renderMarginDashboard();}
  }
  setTimeout(repair,0);setTimeout(repair,500);setTimeout(repair,1800);setTimeout(repair,4000);
  if(typeof window!=='undefined')window.addEventListener('load',function(){setTimeout(repair,250);setTimeout(repair,1500);});
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
console.log('V11.54.3 : catalogues vérifiés + corps d’encastrement automatiques activés (Lefroy Brooks exclu).');
