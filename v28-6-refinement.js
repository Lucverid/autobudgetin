(() => {
  'use strict';
  const month=()=>localDateKey().slice(0,7);
  function renderPeriod(){
    const home=document.getElementById('home');if(!home)return;
    let card=document.getElementById('active-period-toolbar');
    if(!card){
      card=document.createElement('div');card.id='active-period-toolbar';card.className='active-period-toolbar';
      card.innerHTML='<div><span class="period-eyebrow">RINGKASAN KEUANGAN</span><label for="active-period-input">Periode aktif</label></div><div class="period-controls"><input id="active-period-input" type="month" aria-label="Pilih periode aktif"><button id="active-period-current" type="button">Bulan ini</button></div>';
      const target=home.querySelector('.header');if(target)target.after(card);else home.prepend(card);
      card.querySelector('input').onchange=e=>{if(FinanceCore.validMonth(e.target.value))setActivePeriodV285(e.target.value);};
      card.querySelector('button').onclick=()=>setActivePeriodV285(month(),false);
    }
    const input=card.querySelector('input');if(document.activeElement!==input)input.value=window.getActivePeriodV285?.()||month();
  }
  function protectSave(){
    const original=window.saveTransaction;
    window.saveTransaction=function(){
      try{return original.apply(this,arguments);}catch(error){Swal.fire('Belum tersimpan',error.message,'error');}
    };
  }
  function init(){
    renderPeriod();protectSave();
    const reset=window.factoryResetV245;
    if(typeof reset==='function')window.factoryResetV245=async function(){const result=await reset.apply(this,arguments);if(result===true){for(const key of ['agis_finance_monthly_archive_v28_5','agis_finance_auto_budget_v28','agis_finance_auto_budget_applied_v28','agis_finance_spending_class_v24_4','agis_finance_heatmap_month_v28_5_1','agis_finance_v26_decision_lab'])localStorage.removeItem(key);renderAll();}return result;};
    const old=window.renderAll;window.renderAll=function(){const result=old.apply(this,arguments);renderPeriod();return result;};
    document.querySelectorAll('button:not([aria-label])').forEach(button=>{if(button.title)button.setAttribute('aria-label',button.title);});
    document.body.classList.toggle('light-mode',localStorage.getItem('agis_theme')==='light');
    let lastDay=localDateKey();
    setInterval(()=>{const day=localDateKey();if(day!==lastDay){lastDay=day;window.renderAll();}},60000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){window.renderAll();flushOutbox();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,700));else setTimeout(init,700);
})();
