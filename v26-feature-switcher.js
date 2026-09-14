(() => {
  'use strict';

  const KEY='agis_finance_feature_switcher_v26';
  const FEATURES=[
    {id:'decision',label:'Decision Lab',icon:'flask-conical',desc:'Analisis bisnis & kredit sebelum keluar uang.'},
    {id:'tracking',label:'Realisasi',icon:'activity',desc:'Pantau penjualan, stok, profit, target, dan cicilan.'},
    {id:'whatif',label:'What-if',icon:'wand-sparkles',desc:'Coba skenario pengeluaran sebelum dilakukan.'},
    {id:'report',label:'Laporan',icon:'chart-column',desc:'Lihat ringkasan perjalanan keuangan tahunan.'}
  ];
  let active='decision', attempts=0, observer=null, applying=false, navWrapped=false;
  try{const saved=localStorage.getItem(KEY);if(FEATURES.some(x=>x.id===saved))active=saved}catch{}

  const qs=(s,r=document)=>r.querySelector(s);
  function saveActive(id){active=id;try{localStorage.setItem(KEY,id)}catch{}}
  function host(){return document.getElementById('v2531-planning-host')}
  function nodes(){return{
    budget:document.getElementById('v25-planning-card'),
    lab:document.getElementById('v26-decision-lab'),
    tracking:document.getElementById('v27-tracking'),
    whatif:document.getElementById('v244-simulator-card'),
    report:document.querySelector('#v2531-planning-host .v25-year-card')||document.querySelector('.v25-year-card')
  }}
  function makeSwitcher(){
    const h=host();if(!h)return null;
    let bar=document.getElementById('v26-feature-switcher');if(bar)return bar;
    bar=document.createElement('section');bar.id='v26-feature-switcher';bar.className='v26fs-wrap';
    bar.innerHTML=`<div class="v26fs-head"><div><span>FITUR</span><b id="v26fs-current">Pilih yang dibutuhkan</b></div><button type="button" class="v26fs-all" onclick="openFeatureSheetV26()"><i data-lucide="layout-grid"></i><span>Semua</span></button></div><div class="v26fs-tabs" role="tablist" aria-label="Fitur Planning">${FEATURES.map(f=>`<button type="button" role="tab" data-v26fs="${f.id}" onclick="selectFeatureV26('${f.id}')"><i data-lucide="${f.icon}"></i><span>${f.label}</span></button>`).join('')}</div>`;
    h.insertBefore(bar,h.firstChild);window.lucide?.createIcons?.();return bar;
  }
  function makeSheet(){
    if(document.getElementById('v26fs-sheet'))return;
    const overlay=document.createElement('div');overlay.id='v26fs-sheet';overlay.className='v26fs-sheet';overlay.hidden=true;
    overlay.innerHTML=`<button class="v26fs-backdrop" aria-label="Tutup" onclick="closeFeatureSheetV26()"></button><div class="v26fs-sheet-card" role="dialog" aria-modal="true" aria-label="Semua fitur"><div class="v26fs-sheet-handle"></div><div class="v26fs-sheet-title"><div><span>SEMUA FITUR</span><b>Pilih satu untuk dibuka</b></div><button type="button" onclick="closeFeatureSheetV26()"><i data-lucide="x"></i></button></div><div class="v26fs-sheet-list">${FEATURES.map(f=>`<button type="button" onclick="selectFeatureV26('${f.id}');closeFeatureSheetV26()"><span class="v26fs-sheet-icon"><i data-lucide="${f.icon}"></i></span><span><b>${f.label}</b><small>${f.desc}</small></span><i data-lucide="chevron-right"></i></button>`).join('')}</div></div>`;
    document.body.appendChild(overlay);window.lucide?.createIcons?.();
  }
  function setVisible(el,visible){if(!el)return;el.classList.toggle('v26fs-hidden',!visible);el.setAttribute('aria-hidden',visible?'false':'true')}
  function apply(id,scroll=true){
    if(applying)return;if(!FEATURES.some(x=>x.id===id))id='decision';applying=true;
    try{
      saveActive(id);const n=nodes();
      setVisible(n.lab,id==='decision');setVisible(n.tracking,id==='tracking');setVisible(n.whatif,id==='whatif');setVisible(n.report,id==='report');
      document.querySelectorAll('[data-v26fs]').forEach(btn=>{const on=btn.dataset.v26fs===id;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',on?'true':'false');if(on&&scroll)btn.scrollIntoView?.({behavior:'smooth',block:'nearest',inline:'center'})});
      const cur=document.getElementById('v26fs-current'),f=FEATURES.find(x=>x.id===id);if(cur&&f)cur.textContent=f.label;
      if(id==='tracking'){window.refreshTrackingV27?.();if(!n.tracking)setTimeout(()=>{arrange();apply('tracking',false)},260)}
      window.lucide?.createIcons?.();
      requestAnimationFrame?.(()=>{try{window.dispatchEvent(new Event('resize'))}catch{}});
    }finally{applying=false}
  }
  function arrange(){
    const h=host();if(!h)return false;const n=nodes();
    if(n.budget&&n.budget.parentElement!==h)h.insertBefore(n.budget,h.firstChild);
    const bar=makeSwitcher();if(n.budget&&bar&&bar.previousElementSibling!==n.budget)h.insertBefore(bar,n.budget.nextSibling);
    if(n.report&&n.report.parentElement!==h)h.appendChild(n.report);
    qs('.v2531-planning-loading',h)?.remove();makeSheet();apply(active,false);return !!(n.lab&&n.whatif);
  }
  function installObserver(){const h=host();if(!h||observer)return;observer=new MutationObserver(()=>{if(!applying)setTimeout(()=>apply(active,false),0)});observer.observe(h,{childList:true,subtree:false})}
  window.selectFeatureV26=id=>apply(id,true);
  window.openFeatureSheetV26=()=>{const el=document.getElementById('v26fs-sheet');if(!el)return;el.hidden=false;document.body.classList.add('v26fs-sheet-open')};
  window.closeFeatureSheetV26=()=>{const el=document.getElementById('v26fs-sheet');if(!el)return;el.hidden=true;document.body.classList.remove('v26fs-sheet-open')};
  function wrapNav(){if(navWrapped||typeof window.nav!=='function')return;const orig=window.nav;window.nav=function(id,el){const out=orig.apply(this,arguments);if(id==='planning')setTimeout(()=>{arrange();apply(active,false)},90);return out};navWrapped=true}
  function boot(){wrapNav();const ok=arrange();installObserver();if(!ok&&attempts++<16)setTimeout(boot,220)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,120),{once:true});else setTimeout(boot,120);
})();
