(() => {
  'use strict';

  function moveWhatIfToFinancialPlan(){
    const host=document.getElementById('v2531-planning-host');
    const simulator=document.getElementById('v244-simulator-card');
    if(!host || !simulator)return;

    simulator.classList.add('v2533-whatif-card');
    simulator.setAttribute('data-v2533-location','financial-plan');

    // Let Budget Planning + Bill Calendar stay first, then the decision simulator,
    // while Yearly Report remains the closing summary.
    const year=host.querySelector('.v25-year-card');
    if(simulator.parentElement!==host){
      if(year)host.insertBefore(simulator,year);
      else host.appendChild(simulator);
    }else if(year && simulator.nextElementSibling!==year){
      host.insertBefore(simulator,year);
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
