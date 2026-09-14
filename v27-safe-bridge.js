(() => {
  'use strict';
  const TRACKING_KEY='agis_finance_v27_tracking';
  const DECISION_KEY='agis_finance_v26_decision_lab';

  function install(){
    const canonical=window.__v2754CanonicalBackup||window.__v2753CanonicalBackup;
    if(typeof canonical==='function')window.exportBackup=canonical;

    const old=window.factoryResetV245;
    if(typeof old==='function'&&!old.__v2754FsSafe){
      const wrapped=async function(){
        const result=await old.apply(this,arguments);
        if(result===true){
          try{localStorage.removeItem(TRACKING_KEY)}catch{}
          try{localStorage.removeItem(DECISION_KEY)}catch{}
          try{window.refreshTrackingV27?.()}catch{}
        }
        return result;
      };
      wrapped.__v2754FsSafe=true;
      window.factoryResetV245=wrapped;
    }
  }

  install();
  const boot=()=>[180,520,1100].forEach(ms=>setTimeout(install,ms));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
