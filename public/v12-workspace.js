/* V12 Workspace — project-first interaction layer.
   Uses existing Hydropolis project, catalogue and configurator functions.
   Does not change quotes, manufacturer pricing or saved product records. */
(function(){
'use strict';
const one=(q,r=document)=>r.querySelector(q);
const all=(q,r=document)=>Array.from(r.querySelectorAll(q));
let ready=false;
const q=(name,klass='',txt='')=>{
 const el=document.createElement(name);
 if(klass)el.className=klass;if(txt)el.textContent=txt;
 return el;
};
function button(text,handler,klass=''){
 const el=q('button','v12-action '+klass,text);el.type='button';
 el.addEventListener('click',handler);return el;
}
function goto(view){showView(view)}
function bestImage(p){
 const src=p?.pdfImage||p?.image||p?.images?.[0]||'';
 return typeof src==='string'&&/^(https?:\/\/|\/(?!\/)|data:image\/|blob:)/i.test(src)?src:'';
}
function captionProduct(parent,product){
 if(!product)return;
 const title=q('strong','v12-product-maker',(product.manufacturer||'Fabricant')+' · '+(product.collection||'Collection'));
 const subtitle=q('span','v12-product-ref',product.designation||product.reference||'Découvrir la sélection');
 parent.append(title,subtitle);
}
function heroImages(){
 const host=one('#view-dashboard .dashboard-hero-visual');
 if(!host)return;
 host.replaceChildren();host.classList.add('v12-real-gallery');
 const gallery=q('div','v12-hero-gallery');
 const candidates=[];
 const chosen=new Set();
 function take(predicate){
  for(const p of (Array.isArray(state.selected)?state.selected:[])){
   if(predicate(p)&&bestImage(p)&&!chosen.has(bestImage(p))){candidates.push(p);chosen.add(bestImage(p));return}
  }
  for(const p of CATALOG.slice(0,4500)){
   if(predicate(p)&&bestImage(p)&&!chosen.has(bestImage(p))){candidates.push(p);chosen.add(bestImage(p));return}
  }
 }
 take(p=>/lavabo|vasque|bain/i.test((p.category||'')+' '+(p.designation||'')));
 take(p=>/robinet|douche|receveur/i.test((p.category||'')+' '+(p.designation||'')));
 if(candidates.length<2)take(p=>!!bestImage(p));
 if(candidates.length<2)take(p=>!!bestImage(p));
 for(let i=0;i<2;i++){
  const p=candidates[i];
  const tile=q('button','v12-hero-product v12-product-'+(i+1));
  tile.type='button';
  if(p){
   const img=q('img');img.alt='Visuel catalogue '+(p.manufacturer||'');img.loading='lazy';img.src=bestImage(p);
   img.referrerPolicy='no-referrer';tile.append(img);
   img.addEventListener('error',()=>{img.remove();tile.classList.add('v12-no-photo')},{once:true});
  }else tile.classList.add('v12-no-photo');
  const label=q('div','v12-hero-caption');
  label.append(q('small','',i?'COMPOSER':'SÉLECTION FABRICANT'));
  if(p)captionProduct(label,p);
  else label.append(q('strong','','Votre prochain projet'));
  tile.append(label);
  tile.addEventListener('click',()=>{
   if(!p){goto('catalog');return}
   goto('catalog');const input=one('#searchInput');
   if(input){input.value=p.reference||p.designation||'';renderCatalog();}
  });
  gallery.append(tile);
 }
 const floating=q('div','v12-hero-flag');floating.append(q('span','','✦'),q('span','','Catalogue & conception réunis'));
 gallery.append(floating);host.append(gallery);
}
function renderRecentProjects(){
 const host=one('#v12ProjectTiles');if(!host)return;
 host.replaceChildren();
 const projects=Array.isArray(cloud.projects)?cloud.projects.slice(0,3):[];
 if(!projects.length){
  const empty=q('article','v12-project-card v12-current');
  empty.append(q('div','v12-project-kicker','PROJET ACTIF'));
  empty.append(q('h3','',String(state.project?.name||'Nouveau projet').trim()||'Nouveau projet'));
  empty.append(q('p','',state.project?.client||'Commencez par définir votre projet et ses pièces.'));
  const bottom=q('div','v12-project-bottom');
  bottom.append(q('span','',String((state.rooms||[]).length)+' pièce(s) · '+String((state.selected||[]).length)+' produit(s)'));
  bottom.append(button('Continuer',()=>goto('project'),'v12-dark'));empty.append(bottom);
  host.append(empty);
 }else{
  projects.forEach((project,index)=>{
   const item=q('article','v12-project-card '+(project.id===cloud.currentProjectId?'v12-current':''));
   item.append(q('div','v12-project-kicker',project.id===cloud.currentProjectId?'PROJET OUVERT':'PROJET RÉCENT'));
   item.append(q('h3','',project.name||'Projet sans nom'));
   item.append(q('p','',project.client||'Client non renseigné'));
   const footer=q('div','v12-project-bottom');
   footer.append(q('span','','Dossier client · Projet '+(index+1)));
   footer.append(button('Ouvrir',()=>{
    if(typeof openCloudProject==='function')openCloudProject(project.id).catch(e=>alert(e.message));
    else goto('projects');
   },'v12-dark'));
   item.append(footer);host.append(item);
  });
 }
 const more=q('article','v12-project-card v12-create-project');
 more.append(q('span','v12-plus','+'),q('h3','','Nouveau projet'),q('p','','Créez une nouvelle proposition sur mesure.'));
 more.append(button('Créer un projet',()=>{
   goto('projects');one('#newCloudProjectBtn')?.click();
 },'v12-plain'));
 host.append(more);
}
function dashboard(){
 const view=one('#view-dashboard'),shell=one('#view-dashboard .dashboard-shell');
 if(!view||!shell)return;
 const hero=one('.dashboard-hero',shell);
 if(hero){
  const copy=one('.dashboard-copy',hero);
  if(copy){
   one('.eyebrow',copy).textContent='ATELIER DE CONCEPTION · V12';
   one('h2',copy).textContent='Des projets qui prennent forme.';
   one('.dashboard-lead',copy).textContent='Sélectionnez, configurez et présentez des salles de bains d’exception, de la première idée au dossier client.';
   const search=one('.dashboard-search-shortcut',copy);
   if(search && !one('.v12-hero-actions',copy)){
    const actions=q('div','v12-hero-actions');
    actions.append(button('Commencer un projet',()=>{goto('projects');one('#newCloudProjectBtn')?.click()},'v12-dark'));
    actions.append(button('Explorer le catalogue',()=>goto('catalog'),'v12-outline'));
    search.before(actions);
   }
  }
 }
 if(!one('#v12ProjectHub',shell)){
  const section=q('section','v12-project-hub');section.id='v12ProjectHub';
  const heading=q('div','v12-section-heading');
  const left=q('div');left.append(q('span','v12-kicker','VOTRE ATELIER'),q('h2','','Vos projets'));
  heading.append(left,button('Tous les projets',()=>goto('projects'),'v12-inline'));
  section.append(heading);
  const tiles=q('div','v12-project-tiles');tiles.id='v12ProjectTiles';
  section.append(tiles);
  const categories=one('.dashboard-categories',shell);
  if(categories)shell.insertBefore(section,categories);else shell.append(section);
 }
 const existing=one('.dashboard-categories .section-head b',shell);
 if(existing)existing.textContent='Composer votre salle de bains';
 heroImages();renderRecentProjects();
}
function setCatalogSearch(text){
 goto('catalog');
 const manufacturer=one('#manufacturerFilter');
 if(manufacturer)manufacturer.value='';
 if(typeof updateDependentFilters==='function')updateDependentFilters(true,true,true);
 const input=one('#searchInput');
 if(input){input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));}
 renderCatalog();
}
function renderGuide(){
 const manufacturer=one('#manufacturerFilter');
 const collection=one('#collectionFilter');
 const target=one('#targetRoom');
 const root=one('#v12CatalogSteps');
 if(!root)return;
 const s=all('.v12-step',root);
 const labels=[manufacturer?.selectedOptions[0]?.textContent||'Tous les fabricants',
   collection?.selectedOptions[0]?.textContent||'Toutes les collections',
   target?.selectedOptions[0]?.textContent||'Pièce du projet'];
 s.forEach((step,i)=>{
  const b=one('small',step);if(b)b.textContent=labels[i];
  step.classList.toggle('v12-step-current',i===0&&!manufacturer?.value||i===1&&!!manufacturer?.value&&!collection?.value||i===2&&!!collection?.value);
 });
}
function catalog(){
 const view=one('#view-catalog'),card=one('#view-catalog .search-card');
 if(!view||!card)return;
 if(!one('#v12CatalogHead',view)){
  const heading=q('div','v12-catalog-heading');heading.id='v12CatalogHead';
  const h=q('div');h.append(q('span','v12-kicker','BIBLIOTHÈQUE FABRICANTS'),q('h2','','Explorez les collections.'),q('p','','Sélectionnez une famille, affinez les finitions et configurez vos produits dans le moteur fabricant.'));
  heading.append(h,button('Voir mon projet',()=>goto('project'),'v12-dark'));
  view.insertBefore(heading,card);
  const chips=q('div','v12-category-chips');
  const options=[['Tout voir',''],['Robinetterie','robinetterie'],['Vasques','vasque'],['Douche','douche'],['Receveurs','receveur'],['Baignoires','baignoire'],['Meubles','meuble']];
  options.forEach(([label,term],i)=>{
   const item=button(label,()=>{all('.v12-category-chips button').forEach(b=>b.setAttribute('aria-pressed','false'));item.setAttribute('aria-pressed','true');setCatalogSearch(term)},'v12-chip');
   item.setAttribute('aria-pressed',i===0?'true':'false');chips.append(item);
  });
  heading.after(chips);
 }
 if(!one('#v12CatalogSteps',card)){
  const steps=q('div','v12-catalog-steps');steps.id='v12CatalogSteps';
  [
   ['01','Choisir un fabricant'],
   ['02','Affiner la collection'],
   ['03','Configurer dans la pièce']
  ].forEach(([no,label])=>{
    const step=q('div','v12-step');
    step.append(q('span','v12-step-number',no));
    const d=q('div');d.append(q('b','',label),q('small','','—'));step.append(d);steps.append(step);
  });
  const filters=one('.filters',card);
  if(filters)filters.before(steps);else card.append(steps);
  for(const id of ['manufacturerFilter','collectionFilter','targetRoom']){
   one('#'+id)?.addEventListener('change',renderGuide);
  }
 }
 renderGuide();
}
function project(){
 const root=one('#view-project');if(!root||one('#v12ProjectActions',root))return;
 const bar=q('div','v12-project-actions');bar.id='v12ProjectActions';
 const title=q('div','v12-project-action-title');
 title.append(q('span','v12-kicker','WORKFLOW DU PROJET'),q('strong','','Concevoir, sélectionner, présenter'));
 bar.append(title);
 bar.append(button('01 · Sélection produits',()=>goto('catalog'),'v12-outline'),
   button('02 · Calcul du devis',()=>goto('margin'),'v12-outline'),
   button('03 · Dossier client',()=>goto('preview'),'v12-dark'));
 root.insertBefore(bar,root.firstChild);
}
function preview(){
 const view=one('#view-preview');if(!view)return;
 if(!one('#v12PreviewHead',view)){
  const head=q('div','v12-preview-head');head.id='v12PreviewHead';
  const text=q('div');
  text.append(q('span','v12-kicker','STUDIO ÉDITORIAL'),q('h2','','Votre présentation client'),q('p','','Composez les pages et choisissez une identité visuelle sans modifier les montants du devis.'));
  head.append(text,button('Retour au projet',()=>goto('project'),'v12-outline'));
  view.insertBefore(head,view.firstChild);
 }
 let rail=one('#v12PageRail',view);
 if(!rail){rail=q('nav','v12-page-rail');rail.id='v12PageRail';rail.setAttribute('aria-label','Navigation entre les pages du dossier');const bg=one('.preview-bg',view);if(bg)bg.before(rail);}
 const pages=all('#document > .page');
 rail.replaceChildren();
 const title=q('span','v12-page-rail-title','NAVIGUER DANS LE DOSSIER');
 rail.append(title);
 pages.forEach((page,i)=>{
  if(i>=32)return;
  page.id='v12-document-page-'+i;
  const heading=one('h2',page)?.textContent||one('.section-kicker',page)?.textContent||'Page '+(i+1);
  const btn=button((i+1)+' · '+String(heading).trim().slice(0,28),()=>{
    page.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  },'v12-page-link');
  rail.append(btn);
 });
 if(pages.length>32)rail.append(q('small','',String(pages.length-32)+' pages supplémentaires dans le document'));
}
function init(){
 if(ready)return;ready=true;
 dashboard();catalog();project();preview();
 // Call original application render paths before workspace decorations.
 const oldDashboard=renderDashboardEcosystem;
 renderDashboardEcosystem=function(){
  const result=oldDashboard.apply(this,arguments);heroImages();renderRecentProjects();return result;
 };
 const oldHub=renderProjectHub;
 renderProjectHub=function(){
  const result=oldHub.apply(this,arguments);renderRecentProjects();return result;
 };
 const oldCatalog=renderCatalog;
 renderCatalog=function(){const result=oldCatalog.apply(this,arguments);renderGuide();return result;};
 const oldDocument=buildDocument;
 buildDocument=function(){const result=oldDocument.apply(this,arguments);preview();return result;};
 const oldView=showView;
 showView=function(v){
  const result=oldView.apply(this,arguments);
  if(v==='dashboard'){heroImages();renderRecentProjects()}
  if(v==='catalog')renderGuide();
  if(v==='preview')preview();
  return result;
 };
 if(typeof renderDashboardEcosystem==='function')renderDashboardEcosystem();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
window.HydroV12Workspace={init,refresh:()=>{heroImages();renderRecentProjects();renderGuide();preview();}};
})();
