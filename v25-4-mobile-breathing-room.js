/* v25.4 — remove the old Ringkas/Lengkap switch; presentation only. */
(()=>{
  function cleanMobileFocus(){
    document.querySelectorAll('.mobile-focus-switch').forEach(el=>el.remove());
    document.body.classList.remove('v251-compact');
    try{localStorage.setItem('agis_mobile_focus_v25_1','full')}catch{}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(cleanMobileFocus,0));
  else setTimeout(cleanMobileFocus,0);
  window.addEventListener('resize',cleanMobileFocus,{passive:true});
})();
