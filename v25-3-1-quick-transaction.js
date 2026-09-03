(() => {
  'use strict';

  function movePlanningToItsPage(){
    const host=document.getElementById('v2531-planning-host');
    if(!host)return;
    const plan=document.getElementById('v25-planning-card');
    const year=document.querySelector('.v25-year-card');
    if(plan && plan.parentElement!==host)host.appendChild(plan);
    if(year && year.parentElement!==host)host.appendChild(year);
    if((plan||year) && host.querySelector('.v2531-planning-loading'))host.querySelector('.v2531-planning-loading').remove();
  }

  function enhanceQuickAdd(){
    const add=document.querySelector('.v2531-nav .nav-add');
    if(!add || add.dataset.v2531)return;
    add.dataset.v2531='1';
    add.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();nav('add',add);}
    });
    document.querySelectorAll('.v2531-nav .nav-item:not(.nav-add)').forEach(item=>{
      item.addEventListener('keydown',e=>{
        if(e.key!=='Enter'&&e.key!==' ')return;
        e.preventDefault();item.click();
      });
    });
  }

  function init(){
    movePlanningToItsPage();
    enhanceQuickAdd();
    if(window.lucide?.createIcons)lucide.createIcons();
    setTimeout(movePlanningToItsPage,260);
    setTimeout(movePlanningToItsPage,700);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,260));
  else setTimeout(init,260);

  const home=document.getElementById('home');
  if(home)new MutationObserver(movePlanningToItsPage).observe(home,{childList:true});
})();
