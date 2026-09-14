(() => {
  'use strict';

  function arrangeFinancialPlan(){
    const host=document.getElementById('v2531-planning-host');
    const simulator=document.getElementById('v244-simulator-card');
    if(!host||!simulator)return;

    simulator.classList.add('v2533-whatif-card');
    simulator.setAttribute('data-v2533-location','financial-plan');

    // v26.0.4: Budget/Tagihan -> Decision Lab -> What-if -> Laporan tahunan.
    // Semua modul sepakat pada urutan yang sama supaya tidak ada tarik-menarik DOM.
    const year=host.querySelector('.v25-year-card');
    if(simulator.parentElement!==host){
      if(year)host.insertBefore(simulator,year);else host.appendChild(simulator);
    }else if(year&&simulator.nextElementSibling!==year){
      host.insertBefore(simulator,year);
    }

    const lab=host.querySelector('#v26-decision-lab');
    if(lab&&lab.nextElementSibling!==simulator)host.insertBefore(lab,simulator);

    const loading=host.querySelector('.v2531-planning-loading');
    if(loading)loading.remove();
  }

  function init(){
    arrangeFinancialPlan();
    setTimeout(arrangeFinancialPlan,180);
    setTimeout(arrangeFinancialPlan,500);
    setTimeout(arrangeFinancialPlan,1000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  const settings=document.getElementById('settings');
  if(settings)new MutationObserver(arrangeFinancialPlan).observe(settings,{childList:true,subtree:false});
  const host=document.getElementById('v2531-planning-host');
  if(host)new MutationObserver(arrangeFinancialPlan).observe(host,{childList:true,subtree:false});
})();
