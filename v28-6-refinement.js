(() => {
  'use strict';
  function protectSave(){
    const original=window.saveTransaction;
    window.saveTransaction=function(){
      try{return original.apply(this,arguments);}catch(error){Swal.fire('Belum tersimpan',error.message,'error');}
    };
  }
  function init(){
    protectSave();
    const reset=window.factoryResetV245;
    if(typeof reset==='function')window.factoryResetV245=async function(){const result=await reset.apply(this,arguments);if(result===true){for(const key of ['agis_finance_monthly_archive_v28_5','agis_finance_auto_budget_v28','agis_finance_auto_budget_applied_v28','agis_finance_spending_class_v24_4','agis_finance_heatmap_month_v28_5_1','agis_finance_heatmap_limits_v28_6_2','agis_finance_v26_decision_lab'])localStorage.removeItem(key);renderAll();}return result;};
    document.querySelectorAll('button:not([aria-label])').forEach(button=>{if(button.title)button.setAttribute('aria-label',button.title);});
    document.body.classList.toggle('light-mode',localStorage.getItem('agis_theme')==='light');
    let lastDay=localDateKey();
    setInterval(()=>{const day=localDateKey();if(day!==lastDay){lastDay=day;window.renderAll();}},60000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){window.renderAll();flushOutbox();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,700));else setTimeout(init,700);
})();
