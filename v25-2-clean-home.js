(() => {
  'use strict';
  function cleanHome(){
    const advisor=document.querySelector('#home .advisor');
    if(advisor){advisor.hidden=true;advisor.setAttribute('aria-hidden','true');}
    const score=document.getElementById('v244-score-card');
    if(score){
      score.classList.remove('v251-secondary');
      const title=score.querySelector('.section-title');
      if(title) title.innerHTML='<i data-lucide="activity"></i> Kondisi Keuangan';
      const note=document.getElementById('v244-score-note');
      if(note) note.title='Ringkasan Financial Score. Detail Essential dan Non-essential tetap tersedia di laporan/fitur terkait.';
    }
    if(window.lucide?.createIcons) lucide.createIcons();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(cleanHome,450));
  else setTimeout(cleanHome,450);
  const observer=new MutationObserver(()=>cleanHome());
  setTimeout(()=>{const home=document.getElementById('home');if(home)observer.observe(home,{childList:true,subtree:false});},500);
})();
