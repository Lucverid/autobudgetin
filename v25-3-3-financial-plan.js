(() => {
  'use strict';

  function moveWhatIfToFinancialPlan(){
    const host=document.getElementById('v2531-planning-host');
    const simulator=document.getElementById('v244-simulator-card');
    if(!host || !simulator)return;

    simulator.classList.add('v2533-whatif-card');
    simulator.setAttribute('data-v2533-location','financial-plan');

    // Shared order: Budget/Bills -> What-if -> Decision Lab -> Yearly Report.
    // Decision Lab owns the slot immediately before Yearly Report; targeting
    // that same slot here would make both MutationObservers reorder forever.
    const year=host.querySelector('.v25-year-card');
    const anchor=host.querySelector('#v26-decision-lab')||year;
    if(simulator.parentElement!==host){
      if(anchor)host.insertBefore(simulator,anchor);
      else host.appendChild(simulator);
    }else if(anchor && simulator.nextElementSibling!==anchor){
      host.insertBefore(simulator,anchor);
    }

    const loading=host.querySelector('.v2531-planning-loading');
    if(loading)loading.remove();
  }

  function init(){
    moveWhatIfToFinancialPlan();
    setTimeout(moveWhatIfToFinancialPlan,180);
    setTimeout(moveWhatIfToFinancialPlan,500);
    setTimeout(moveWhatIfToFinancialPlan,1000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  const settings=document.getElementById('settings');
  if(settings)new MutationObserver(moveWhatIfToFinancialPlan).observe(settings,{childList:true,subtree:false});

  const planning=document.getElementById('planning');
  if(planning)new MutationObserver(moveWhatIfToFinancialPlan).observe(planning,{childList:true,subtree:true});
})();
