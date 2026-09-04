(() => {
  'use strict';
  function grade(score){
    if(score>=80)return {key:'healthy',label:'SEHAT'};
    if(score>=60)return {key:'okay',label:'CUKUP'};
    if(score>=40)return {key:'warn',label:'WASPADA'};
    return {key:'critical',label:'KRITIS'};
  }
  function build(){
    const card=document.getElementById('v244-score-card');
    const row=card?.querySelector('.v244-row');
    const ring=document.getElementById('v244-score-ring');
    if(!card||!row||!ring)return;
    if(!row.querySelector('.v253-heart')){
      const heart=document.createElement('div');
      heart.className='v253-heart';
      heart.setAttribute('aria-hidden','true');
      heart.innerHTML='<i data-lucide="heart-pulse"></i>';
      row.insertBefore(heart,row.firstChild);
    }
    let copy=row.querySelector('.v244-health-copy');
    if(!copy){
      const original=row.querySelector('div:not(.v253-heart):not(.v244-score-ring)');
      if(original){copy=original;copy.classList.add('v244-health-copy');}
    }
    if(copy){
      const title=copy.querySelector('.section-title');
      if(title)title.textContent='Kondisi Keuangan';
      if(!copy.querySelector('.v253-score-wrap')){
        const wrap=document.createElement('div');
        wrap.className='v253-score-wrap';
        ring.parentNode.removeChild(ring);
        wrap.appendChild(ring);
        const max=document.createElement('span');
        max.className='v253-score-max';max.textContent='/100';
        wrap.appendChild(max);
        copy.appendChild(wrap);
      }
    }
    if(!row.querySelector('.v253-label')){
      const label=document.createElement('div');label.className='v253-label';label.id='v253-condition-label';label.textContent='—';row.appendChild(label);
    }
    if(!card.querySelector('.v253-ecg')){
      const ecg=document.createElement('div');ecg.className='v253-ecg';ecg.setAttribute('aria-hidden','true');card.appendChild(ecg);
    }
    update();
    if(window.lucide?.createIcons)lucide.createIcons();
  }
  function update(){
    const card=document.getElementById('v244-score-card');
    const scoreEl=document.getElementById('v244-score');
    const label=document.getElementById('v253-condition-label');
    if(!card||!scoreEl||!label)return;
    // v25.3.9 owns score/label/warna/tempo from the same monthly pace status.
    if(card.dataset.healthSource==='monthly-status')return;
    const n=Math.max(0,Math.min(100,Number(scoreEl.textContent)||0));
    const g=grade(n);card.dataset.grade=g.key;label.textContent=g.label;
    card.setAttribute('aria-label',`Kondisi keuangan ${g.label}, skor ${Math.round(n)} dari 100`);
  }
  function init(){build();const score=document.getElementById('v244-score');if(score)new MutationObserver(update).observe(score,{childList:true,characterData:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,520));else setTimeout(init,520);
})();
