(() => {
  'use strict';
  const KEY='agis_finance_v25_1_home_mode';
  const isMobile=()=>window.matchMedia('(max-width:759px)').matches;
  function markSecondary(){
    const home=document.getElementById('home'); if(!home)return;
    ['.home-cashflow-card','.advisor','.home-chart-card','.v25-year-card'].forEach(sel=>home.querySelector(sel)?.classList.add('v251-secondary'));
  }
  function setMode(mode){
    const compact=mode!=='full';
    document.body.classList.toggle('v251-compact',compact&&isMobile());
    document.querySelectorAll('.mobile-focus-switch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===(compact?'compact':'full')));
    try{localStorage.setItem(KEY,compact?'compact':'full')}catch{}
  }
  function injectSwitch(){
    const home=document.getElementById('home'); if(!home||home.querySelector('.mobile-focus-switch'))return;
    const target=home.querySelector('.wallet-container'); if(!target)return;
    const box=document.createElement('div'); box.className='mobile-focus-switch';
    box.innerHTML='<button type="button" data-mode="compact">Ringkas</button><button type="button" data-mode="full">Lengkap</button>';
    box.addEventListener('click',e=>{const b=e.target.closest('button[data-mode]');if(b)setMode(b.dataset.mode)});
    home.insertBefore(box,target);
  }
  function enhance(){injectSwitch();markSecondary();let saved='compact';try{saved=localStorage.getItem(KEY)||'compact'}catch{}setMode(saved);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,350));else setTimeout(enhance,350);
  window.addEventListener('resize',()=>setTimeout(enhance,80));
  const old=window.renderV25; if(typeof old==='function'&&!old.__v251){const fn=function(){const r=old.apply(this,arguments);setTimeout(enhance,30);return r};fn.__v251=true;window.renderV25=fn}
})();
