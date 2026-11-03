/* Hydropolis Studio V12 — presentation-only progressive enhancement.
 * Never changes products, prices, project data, configurators or PDF output.
 * Lucide & Motion are optional: navigation remains usable when CDN is offline.
 */
(function(){
  'use strict';
  function init(){
    const body=document.body;
    const sidebar=document.querySelector('.shell > .sidebar');
    const topbar=document.querySelector('.v11-topbar');
    const nav=document.querySelector('.v11-nav-stack');
    if(!sidebar||!topbar||!nav)return;
    body.classList.add('v12-ui');

    const icons={
      dashboard:'layout-dashboard',catalog:'search',projects:'folders',
      favorites:'heart',compare:'arrow-left-right',exports:'download',
      project:'panels-top-left',margin:'chart-no-axes-combined',preview:'file-text'
    };
    // Local fallback glyphs are traced from simple line geometry; external
    // Lucide is preferred when available and not required for navigation.
    const fallback={
      'layout-dashboard':'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
      search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      folders:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2"/><rect x="3" y="9" width="18" height="12" rx="2"/>',
      heart:'<path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8z"/>',
      'arrow-left-right':'<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
      download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
      'panels-top-left':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>',
      'chart-no-axes-combined':'<path d="M3 20V14m6 6V9m6 11v-5m6 5V4M3 10l6-4 5 4 7-7"/>',
      'file-text':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
      menu:'<path d="M4 7h16M4 12h16M4 17h16"/>'
    };
    function svgFor(name){
      const content=fallback[name]||fallback['layout-dashboard'];
      return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+content+'</svg>';
    }
    nav.querySelectorAll('button.nav[data-view]').forEach(btn=>{
      const symbol=btn.querySelector('.nav-symbol');
      const icon=icons[btn.dataset.view];
      if(!symbol||!icon)return;
      symbol.setAttribute('aria-hidden','true');
      if(window.lucide&&typeof window.lucide.createIcons==='function'){
        symbol.innerHTML='<i data-lucide="'+icon+'"></i>';
      }else symbol.innerHTML=svgFor(icon);
    });
    if(window.lucide&&typeof window.lucide.createIcons==='function'){
      try{window.lucide.createIcons({attrs:{'stroke-width':1.8}})}catch(_error){
        nav.querySelectorAll('button.nav[data-view]').forEach(btn=>{
          const symbol=btn.querySelector('.nav-symbol');
          if(symbol)symbol.innerHTML=svgFor(icons[btn.dataset.view]);
        });
      }
    }
    function syncNav(){
      nav.querySelectorAll('button.nav').forEach(btn=>{
        if(btn.classList.contains('active'))btn.setAttribute('aria-current','page');
        else btn.removeAttribute('aria-current');
      });
    }
    syncNav();
    new MutationObserver(syncNav).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});

    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='v12-menu-toggle';
    toggle.setAttribute('aria-label','Ouvrir le menu');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls','v12Navigation');
    toggle.innerHTML=svgFor('menu');
    sidebar.id='v12Navigation';
    topbar.insertBefore(toggle,topbar.firstChild);
    function closeMenu(){
      body.classList.remove('v12-nav-open');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Ouvrir le menu');
    }
    toggle.addEventListener('click',()=>{
      const open=body.classList.toggle('v12-nav-open');
      toggle.setAttribute('aria-expanded',String(open));
      toggle.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');
    });
    nav.addEventListener('click',event=>{if(event.target.closest('button.nav'))closeMenu()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
    document.addEventListener('pointerdown',event=>{
      if(body.classList.contains('v12-nav-open')&&!sidebar.contains(event.target)&&!toggle.contains(event.target))closeMenu();
    });
    window.matchMedia('(min-width: 851px)').addEventListener('change',event=>{if(event.matches)closeMenu()});

    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const main=document.querySelector('.shell main');
    if(main){
      const viewObserver=new MutationObserver(records=>{
        if(reduced.matches)return;
        records.forEach(record=>{
          const node=record.target;
          if(!node.classList||!node.classList.contains('view')||!node.classList.contains('active'))return;
          // Optional Motion library. CSS always handles hover and focus.
          try{
            if(window.Motion&&typeof window.Motion.animate==='function')
              window.Motion.animate(node,{opacity:[.75,1],transform:['translateY(7px)','translateY(0px)']},{duration:.3,ease:'easeOut'});
          }catch(_error){/* Animation must never affect app behavior. */}
        });
      });
      viewObserver.observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
