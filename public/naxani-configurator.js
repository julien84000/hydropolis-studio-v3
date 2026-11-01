/* Naxani 2026 — Galassia-style catalog and priced configurations. */
(function(root,factory){
 const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HydroNaxaniConfigurator=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const eur=v=>Number(v||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
 const TABS={'Meubles':['Laqués','Bois massif','Compléments'],'Lavabos':['Plans intégrés','Vasques à poser','Plans suspendus','Plans de travail'],'Compléments':['Miroirs']};
 const type={'Laqués':'laque','Bois massif':'bois-massif','Compléments':'complement','Plans intégrés':'plan-integre','Vasques à poser':'vasque-poser','Plans suspendus':'suspendu','Miroirs':'miroir'};
 const isTop=p=>['plan-solid','plan-mdf','plan-marbre'].includes(p?.naxaniKind);
 const isFurniture=p=>['laque','bois-massif'].includes(p?.naxaniKind);
 const imageCache=new Map();
 function options(items,chosen){
  return '<option value="">Choisir une référence</option>'+items.map(p=>'<option value="'+esc(p.reference)+'"'+(p.reference===chosen?' selected':'')+'>'+esc(p.collection)+' · '+(p.naxaniWidth?p.naxaniWidth+' cm · ':'')+esc(p.reference)+' · '+eur(p.price)+'</option>').join('');
 }
 function open(rows,roomId,onAdd){
  if(!root?.HydroNaxani2026||!Array.isArray(rows)||typeof onAdd!=='function')return Promise.reject(Error('Naxani indisponible'));
  rows=rows.filter(p=>p.manufacturer==='Naxani');
  if(!rows.length)return Promise.reject(Error('Tarif Naxani 2026 non chargé'));
  const data=root.HydroNaxaniDataset||{incompatible:{}},compatible=root.HydroNaxani2026.compatible;
  document.querySelector('.naxani-modal')?.remove();
  const modal=document.createElement('div');modal.className='naxani-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
  document.body.appendChild(modal);
  const style=document.createElement('style');style.textContent=
   '.naxani-modal{position:fixed;inset:0;background:#000a;z-index:21000;display:grid;place-items:center;padding:18px;color:#272822;font:13px system-ui}' +
   '.naxani-shell{height:min(850px,94vh);width:min(1470px,98vw);background:#faf9f6;border-radius:13px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 18px 55px #0007}' +
   '.naxani-head{background:#252724;color:white;padding:17px 22px;display:flex;justify-content:space-between}.naxani-head h2{font:28px Georgia,serif;margin:3px 0}.naxani-head small{color:#c4a66f}.naxani-close{font-size:25px;color:white;background:none;border:1px solid #bbb;border-radius:50%;width:38px;height:38px;cursor:pointer}' +
   '.naxani-body{display:grid;grid-template-columns:200px minmax(300px,1fr) 345px;flex:1;overflow:hidden}.naxani-left,.naxani-main,.naxani-side{overflow:auto;padding:14px}.naxani-left{background:#f2f0eb;border-right:1px solid #ddd}.naxani-side{border-left:1px solid #ddd;background:#fff}' +
   '.naxani-btn{display:block;width:100%;text-align:left;margin:5px 0;padding:11px;background:white;border:1px solid #ddd;border-radius:7px;cursor:pointer}.naxani-btn.active{border-color:#ad7e43;background:#faf0e1}.naxani-sub{margin-left:9px;width:calc(100% - 9px);font-size:12px}' +
   '.naxani-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:9px}.naxani-tile{min-height:136px;padding:7px;border:1px solid #ddd;background:white;border-radius:7px;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:6px}.naxani-tile.active{border:2px solid #a87e46}.naxani-pic{height:95px;background:#e9e5df;display:grid;place-items:center;overflow:hidden;color:#918a80}.naxani-pic img{width:100%;height:100%;object-fit:cover}' +
   '.naxani-hero{height:185px;background:#f3f0eb;display:grid;place-items:center;overflow:hidden}.naxani-hero img{width:100%;height:100%;object-fit:cover}.naxani-side h3{font:24px Georgia,serif;margin:11px 0}' +
   '.naxani-side label{display:block;margin-top:12px;margin-bottom:5px;font-weight:bold}.naxani-side select{width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;background:white;font-size:12px}.naxani-muted{font-size:11px;color:#84796a;line-height:1.4;margin:7px 0}.naxani-error{color:#994c1f;background:#fff1e6;padding:8px;margin:6px 0;border-radius:5px}' +
   '.naxani-modes{display:flex;gap:5px}.naxani-modes button{flex:1;background:#f5f2ef;border:1px solid #ccc;border-radius:5px;padding:9px;font-size:11px;cursor:pointer}.naxani-modes button.active{background:#e7d5b8;border-color:#aa824c}.naxani-line{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #eee;padding:7px 0}.naxani-confirm{width:100%;padding:14px;background:#20503d;color:white;border:0;border-radius:7px;margin-top:12px;font-weight:bold;cursor:pointer}.naxani-confirm:disabled{background:#a1a6a2;cursor:not-allowed}' +
   '@media(max-width:900px){.naxani-body{grid-template-columns:130px 1fr;overflow:auto}.naxani-side{grid-column:1/-1}.naxani-main{min-height:200px}}';
  let section='Meubles',sub='Laqués',model='',ref='',mode='integrated',top='',basin='',drain='',busy=false,closed=false;
  const get=r=>rows.find(p=>p.reference===r);
  const subRows=()=>rows.filter(p=>sub==='Plans de travail'?isTop(p):p.naxaniKind===type[sub]);
  const models=()=>[...new Set(subRows().map(p=>p.collection))].sort((a,b)=>a.localeCompare(b,'fr'));
  const variants=()=>subRows().filter(p=>p.collection===model).sort((a,b)=>(a.naxaniWidth||0)-(b.naxaniWidth||0)||a.reference.localeCompare(b.reference));
  const selected=()=>variants().find(p=>p.reference===ref)||null;
  const matching=p=>rows.filter(x=>(mode==='integrated'?x.naxaniKind==='plan-integre':isTop(x))&&compatible(p,x,data.incompatible));
  function assembly(){
   const p=selected(),out=[],errors=[];
   if(!p){errors.push('Sélectionnez une référence tarifée.');return {out,errors}}
   out.push(p);
   if(isFurniture(p)){
    const x=matching(p).find(x=>x.reference===top);
    if(!x)errors.push('Un '+(mode==='integrated'?'plan vasque intégré':'plan de travail')+' compatible est nécessaire.');
    else out.push(x);
    if(mode==='countertop'){
     const b=get(basin);if(!b||b.naxaniKind!=='vasque-poser')errors.push('Choisissez une vasque à poser.');
     else out.push(b);
    }
   }
   if(p.naxaniKind==='suspendu'){
    const x=get(top);if(!x||x.naxaniKind!=='plan-integre'||x.naxaniWidth!==p.naxaniWidth)errors.push('Lembo : ajoutez un plan vasque de même largeur.');
    else out.push(x);
   }
   const d=get(drain);if(d?.collection==='Clic Clac')out.push(d);
   return {out,errors};
  }
  function close(){if(closed)return;closed=true;modal.remove();root.removeEventListener('keydown',escClose)}
  function escClose(e){if(e.key==='Escape')close()}
  root.addEventListener('keydown',escClose);
  async function loadPhoto(){
   const target=modal.querySelector('.naxani-hero');if(!target||!model)return;
   const m=model;
   if(imageCache.has(m)){if(imageCache.get(m))target.innerHTML='<img src="'+esc(imageCache.get(m))+'" alt="Illustration '+esc(m)+'">';return}
   imageCache.set(m,'');
   try{
    const r=await fetch('/api/naxani-collection-photo?collection='+encodeURIComponent(m));
    const d=r.ok?await r.json():null;
    if(d?.verified&&/^https:\/\/(?:www\.)?naxani\.(com|net)\/wp-content\/uploads\//.test(d.image||'')){
     imageCache.set(m,d.image);
     if(target.isConnected&&model===m)target.innerHTML='<img src="'+esc(d.image)+'" alt="Illustration de collection '+esc(m)+'">';
    }
   }catch(_){}
  }
  function render(){
   if(!models().includes(model)){model=models()[0]||'';ref='';top='';basin=''}
   if(!variants().some(x=>x.reference===ref)){ref=variants()[0]?.reference||'';top='';basin=''}
   const p=selected(),title=model||'Sélectionnez une collection';
   const allowed=p&&isFurniture(p)?matching(p):p?.naxaniKind==='suspendu'?rows.filter(x=>x.naxaniKind==='plan-integre'&&x.naxaniWidth===p.naxaniWidth):[];
   if(top&&!allowed.some(x=>x.reference===top))top='';
   const a=assembly(),price=a.out.reduce((s,x)=>s+Number(x.price),0);
   modal.innerHTML='<div class="naxani-shell"><div class="naxani-head"><div><small>NAXANI · TARIF FABRICANT 2026</small><h2>Configurer Naxani</h2><div>Collection → référence → plan vasque ou top + vasque → bonde</div></div><button class="naxani-close">×</button></div>' +
    '<div class="naxani-body"><aside class="naxani-left">'+Object.keys(TABS).map(k=>'<button class="naxani-btn '+(k===section?'active':'')+'" data-section="'+esc(k)+'">'+esc(k)+'</button>'+(k===section?TABS[k].map(v=>'<button class="naxani-btn naxani-sub '+(v===sub?'active':'')+'" data-sub="'+esc(v)+'">'+esc(v)+'</button>').join(''):'' )).join('')+
    '<p class="naxani-muted">Les visuels illustrent les collections, pas les variantes exactes.</p></aside><main class="naxani-main"><b>'+esc(sub)+'</b> · '+models().length+' collections · '+subRows().length+' références tarifées' +
    '<div class="naxani-grid" style="margin-top:12px">'+models().map(m=>'<button class="naxani-tile '+(m===model?'active':'')+'" data-model="'+esc(m)+'"><div class="naxani-pic">'+esc(m)+'</div><b>'+esc(m)+'</b><small>'+subRows().filter(x=>x.collection===m).length+' références</small></button>').join('')+'</div></main>' +
    '<aside class="naxani-side"><div class="naxani-hero">'+esc(title)+'</div><p class="naxani-muted">Photo de collection illustrative, finition non contractuelle.</p><h3>'+esc(title)+'</h3>' +
    '<label>Référence, dimensions et prix public HT</label><select data-field="ref">'+options(variants(),ref)+'</select>' +
    (p&&isFurniture(p)?'<label>Composition à ajouter</label><div class="naxani-modes"><button data-mode="integrated" class="'+(mode==='integrated'?'active':'')+'">Plan intégré</button><button data-mode="countertop" class="'+(mode==='countertop'?'active':'')+'">Top + vasque à poser</button></div>' +
    '<label>'+(mode==='integrated'?'Plan intégré compatible':'Plan de travail compatible')+'</label><select data-field="top">'+options(allowed,top)+'</select>' +
    (mode==='countertop'?'<label>Vasque à poser</label><select data-field="basin">'+options(rows.filter(x=>x.naxaniKind==='vasque-poser'),basin)+'</select>':'') +
    '<p class="naxani-muted">Un plan incompatible selon les exclusions du tarif ou une largeur différente n’est pas proposé.</p>':
    p?.naxaniKind==='suspendu'?'<label>Plan vasque Solid Surface associé</label><select data-field="top">'+options(allowed,top)+'</select>':'') +
    (p&&p.naxaniKind!=='complement'?'<label>Bonde / siphon Clic Clac (optionnel)</label><select data-field="drain">'+options(rows.filter(x=>x.collection==='Clic Clac'),drain)+'</select>':'')+
    a.out.map(x=>'<div class="naxani-line"><span>'+esc(x.designation)+'<br><small>'+esc(x.reference)+'</small></span><b>'+eur(x.price)+'</b></div>').join('')+
    '<div class="naxani-line"><strong>Total public HT</strong><strong>'+eur(price)+'</strong></div>' +
    a.errors.map(x=>'<div class="naxani-error">'+esc(x)+'</div>').join('')+
    '<p class="naxani-muted">Remise d’achat Naxani non communiquée : aucun coût d’achat inventé. Finitions exactes à confirmer pour les SKU du tarif.</p>' +
    '<button class="naxani-confirm" '+(busy||a.errors.length?'disabled':'')+'>'+(busy?'Ajout…':'Ajouter cette composition au projet')+'</button>' +
    '<p><a target="_blank" rel="noopener noreferrer" href="https://naxani.com/productos/muebles-de-bano/">Site officiel Naxani</a></p></aside></div></div>';
   modal.querySelector('.naxani-close').onclick=close;
   modal.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{section=b.dataset.section;sub=TABS[section][0];model='';ref='';top='';basin='';render()});
   modal.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{sub=b.dataset.sub;model='';ref='';top='';basin='';render()});
   modal.querySelectorAll('[data-model]').forEach(b=>b.onclick=()=>{model=b.dataset.model;ref='';top='';basin='';render()});
   modal.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;top='';basin='';render()});
   modal.querySelectorAll('[data-field]').forEach(s=>s.onchange=()=>{const k=s.dataset.field;({ref:v=>{ref=v;top='';basin=''},top:v=>{top=v},basin:v=>{basin=v},drain:v=>{drain=v}}[k])(s.value);render()});
   modal.querySelector('.naxani-confirm').onclick=async()=>{const c=assembly();if(c.errors.length||busy)return;busy=true;render();try{await onAdd(c.out,roomId,{collection:model,mode,source:'Naxani 2026'});close()}catch(e){busy=false;render();root.alert('Naxani : '+(e.message||e))}};
   loadPhoto();
  }
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  render();return Promise.resolve();
 }
 return {open,SECTIONS:TABS,compatible:(a,b,excluded)=>root.HydroNaxani2026.compatible(a,b,excluded)};
});