(() => {
  'use strict';

  const KEY = 'agis_finance_auto_budget_v28';
  const BUCKETS = ['Makan Pokok','Jajan','Transportasi','Tagihan','Pemberian','Belanja','Hiburan','Lainnya'];
  const DEFAULT_WEIGHTS = {'Makan Pokok':35,'Jajan':10,'Transportasi':10,'Tagihan':15,'Pemberian':10,'Belanja':8,'Hiburan':5,'Lainnya':7};
  const ICONS = {'Makan Pokok':'utensils','Jajan':'coffee','Transportasi':'bike','Tagihan':'receipt','Pemberian':'gift','Belanja':'shopping-bag','Hiburan':'gamepad-2','Lainnya':'package'};
  const DAY = 86400000;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money = n => typeof fmt === 'function' ? fmt(Math.round(Number(n)||0)) : `Rp ${Math.round(Number(n)||0).toLocaleString('id-ID')}`;
  const monthKey = () => typeof localDateKey === 'function' ? localDateKey().slice(0,7) : new Date().toISOString().slice(0,7);
  const todayKey = () => typeof localDateKey === 'function' ? localDateKey() : new Date().toISOString().slice(0,10);
  const icon = (name, cls='') => `<i data-lucide="${name}"${cls?` class="${cls}"`:''}></i>`;
  const bucketIcon = b => icon(ICONS[b] || 'circle-dollar-sign','v283-bucket-icon');

  function defaults(){return {mode:'auto',enabled:true,manualIncome:0,savingAmount:0,savingPct:15,useBonus:false,weights:{...DEFAULT_WEIGHTS},manualBuckets:{},hardBufferPct:0}}
  function read(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY)||'{}');
      const d=defaults(), mode=raw.mode || (raw.enabled===false?'manual':'auto');
      return {...d,...raw,mode,enabled:mode==='auto',weights:{...DEFAULT_WEIGHTS,...(raw.weights||{})},manualBuckets:{...(raw.manualBuckets||{})}};
    }catch{return defaults()}
  }
  function write(v){localStorage.setItem(KEY,JSON.stringify(v));try{persistLocalSnapshot?.()}catch{}}

  function detectedIncome(){
    const cfg=read(),mk=monthKey();
    return (store?.incomes||[]).filter(x=>String(x.tanggal||'').startsWith(mk)).filter(x=>x.kategori==='Gaji'||(cfg.useBonus&&x.kategori==='Bonus')).reduce((s,x)=>s+(Number(x.nominal)||0),0);
  }
  function sourceIncome(){const c=read(),manual=Math.max(0,Number(c.manualIncome)||0),detected=detectedIncome();return manual>0?manual:detected}
  function normalizeWeights(raw){const out={};BUCKETS.forEach(b=>out[b]=Math.max(0,Number(raw?.[b]??DEFAULT_WEIGHTS[b]??0)));return out}
  function savingsValue(cfg,income){
    const direct=Math.max(0,Number(cfg.savingAmount)||0);
    if(direct>0)return Math.min(income,direct);
    return Math.min(income,Math.round(income*Math.max(0,Number(cfg.savingPct)||0)/100));
  }
  function allocations(){
    const cfg=read(),income=sourceIncome(),save=savingsValue(cfg,income),spendable=Math.max(0,income-save),buckets={};
    if(cfg.mode==='manual'){
      BUCKETS.forEach(b=>buckets[b]=Math.max(0,Math.round(Number(cfg.manualBuckets?.[b])||0)));
      return {income,save,spendable,buckets,cfg,assigned:Object.values(buckets).reduce((a,n)=>a+n,0)};
    }
    const weights=normalizeWeights(cfg.weights),total=Object.values(weights).reduce((s,n)=>s+n,0)||1;
    BUCKETS.forEach(b=>buckets[b]=Math.round(spendable*(weights[b]/total)));
    return {income,save,spendable,buckets,cfg,assigned:Object.values(buckets).reduce((a,n)=>a+n,0)};
  }
  function bucketOf(t){
    if(t?.budgetBucket&&BUCKETS.includes(t.budgetBucket))return t.budgetBucket;
    const c=String(t?.kategori||''),note=String(t?.catatan||t?.note||'').toLowerCase();
    if(c==='Makan & Minum')return /(jajan|snack|kopi|coffee|es |boba|cafe|café|minuman)/i.test(note)?'Jajan':'Makan Pokok';
    if(c==='Transportasi')return 'Transportasi';if(c==='Tagihan')return 'Tagihan';if(c==='Keluarga & Pemberian')return 'Pemberian';if(c==='Belanja')return 'Belanja';if(c==='Hiburan')return 'Hiburan';return 'Lainnya';
  }

  function normalizeUsageText(v){return String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
  function usageKey(t){const note=normalizeUsageText(t?.catatan||t?.note||'');if(note)return `note:${note}`;return `fallback:${normalizeUsageText(t?.kategori||'lainnya')}|${normalizeUsageText(t?.budgetBucket||bucketOf(t))}`}
  function dayNumber(dateStr){const m=String(dateStr||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return NaN;return Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3]))/DAY}
  function rowOrder(t){return [dayNumber(t?.tanggal),Number(t?.createdAt)||0]}
  function isAfter(a,b){const A=rowOrder(a),B=rowOrder(b);return A[0]>B[0]||(A[0]===B[0]&&A[1]>B[1])}
  function usageInfo(t,allRows){
    if(!t?.autoUsage)return {enabled:false,days:0,active:false,perDay:0,key:''};
    const rows=Array.isArray(allRows)?allRows:(store?.trans||[]),key=usageKey(t),start=dayNumber(t.tanggal);
    if(!Number.isFinite(start))return {enabled:true,days:1,active:true,perDay:Number(t.nominal)||0,key};
    const next=rows.filter(x=>x&&x.id!==t.id&&usageKey(x)===key&&isAfter(x,t)).sort((a,b)=>{const A=rowOrder(a),B=rowOrder(b);return A[0]-B[0]||A[1]-B[1]})[0];
    const end=next?dayNumber(next.tanggal):dayNumber(todayKey()),days=Math.max(1,Math.round((Number.isFinite(end)?end:start)-start));
    return {enabled:true,days,active:!next,perDay:(Number(t.nominal)||0)/days,key,next,nextDate:next?.tanggal||''};
  }
  window.getAutoUsageInfoV282=t=>usageInfo(t,store?.trans||[]);

  function baseBudgetsFromBuckets(b){return {'Makan & Minum':(b['Makan Pokok']||0)+(b['Jajan']||0),'Transportasi':b['Transportasi']||0,'Tagihan':b['Tagihan']||0,'Keluarga & Pemberian':b['Pemberian']||0,'Belanja':b['Belanja']||0,'Hiburan':b['Hiburan']||0,'Lainnya':b['Lainnya']||0}}
  function applyBudget(silent=false){
    const a=allocations();if(a.income<=0&&a.cfg.mode==='auto')return false;
    const mk=monthKey(),v25=(()=>{try{return JSON.parse(localStorage.getItem('agis_finance_v25_planning')||'{}')}catch{return {}}})();
    v25.budgets=v25.budgets||{};v25.budgets[mk]=baseBudgetsFromBuckets(a.buckets);localStorage.setItem('agis_finance_v25_planning',JSON.stringify(v25));
    const hardFactor=1+Math.max(0,Number(a.cfg.hardBufferPct)||0)/100,hard={};Object.entries(v25.budgets[mk]).forEach(([k,v])=>hard[k]=Math.round(Number(v||0)*hardFactor));
    if(typeof store==='object'&&store){store.limits={...(store.limits||{}),...hard};try{persistLocalSnapshot?.()}catch{};Object.entries(hard).forEach(([category,amount])=>{try{const now=Date.now();enqueueSync?.({opId:`v283-limit:${category}:${mk}:${amount}`,type:'setLimit',category,amount,createdAt:now,updatedAt:now})}catch{}})}
    localStorage.setItem('agis_finance_auto_budget_applied_v28',JSON.stringify({month:mk,income:a.income,signature:signature(a),at:Date.now()}));
    try{window.renderV25?.();window.renderAll?.();window.scheduleAutomationSyncV245?.()}catch{}
    if(!silent&&window.Swal)Swal.fire({icon:'success',title:a.cfg.mode==='auto'?'Budget otomatis diterapkan':'Budget manual diterapkan',text:`Pendapatan ${money(a.income)} · tabungan ${money(a.save)} · tersedia ${money(a.spendable)}.`,confirmButtonText:'Selesai'});
    return true;
  }
  function signature(a){return `${monthKey()}:${a.cfg.mode}:${a.income}:${a.save}:${JSON.stringify(a.cfg.mode==='auto'?a.cfg.weights:a.cfg.manualBuckets)}`}
  function maybeAutoApply(){const a=allocations();if(a.cfg.mode!=='auto'||a.income<=0)return;let last={};try{last=JSON.parse(localStorage.getItem('agis_finance_auto_budget_applied_v28')||'{}')}catch{};if(last.signature!==signature(a))setTimeout(()=>applyBudget(true),80)}

  function reviewRows(){const mk=monthKey();return (store?.trans||[]).filter(t=>String(t.tanggal||'').startsWith(mk)&&t.kategori!=='Penyesuaian Saldo').sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0))}
  function spentByBucket(){const out={};BUCKETS.forEach(b=>out[b]=0);reviewRows().forEach(t=>out[bucketOf(t)]=(out[bucketOf(t)]||0)+(Number(t.nominal)||0));return out}
  function stats(){
    const rows=reviewRows(),total=rows.reduce((s,t)=>s+(Number(t.nominal)||0),0),groups={},days={};
    rows.forEach(t=>{const b=bucketOf(t);groups[b]=(groups[b]||0)+(Number(t.nominal)||0);if(t.tanggal)days[t.tanggal]=(days[t.tanggal]||0)+(Number(t.nominal)||0)});
    const biggest=rows.reduce((m,t)=>Number(t.nominal||0)>Number(m?.nominal||0)?t:m,null),activeDays=Object.keys(days).length;
    const coverage=rows.map(t=>({t,info:usageInfo(t,store?.trans||[])})).filter(x=>x.info.enabled||Number(x.t.usageDays)>0);
    const effective=coverage.length?coverage.reduce((s,x)=>s+(x.info.enabled?x.info.perDay:(Number(x.t.nominal)||0)/Math.max(1,Number(x.t.usageDays)||1)),0):0;
    return {rows,total,groups,biggest,activeDays,coverage,effective};
  }
  function durationLine(t){const info=usageInfo(t,store?.trans||[]);if(info.enabled)return `${info.days} hari${info.active?' berjalan':' selesai'} · ${money(info.perDay)}/hari`;if(Number(t.usageDays)>0)return `${Number(t.usageDays)} hari · ${money((Number(t.nominal)||0)/Number(t.usageDays))}/hari`;return 'Durasi otomatis nonaktif'}

  function render(){
    const card=document.getElementById('v28-auto-budget-card'),review=document.getElementById('v28-spending-review');if(!card||!review)return;
    const a=allocations(),spent=spentByBucket(),st=stats(),remain=Math.max(0,a.spendable-a.assigned);
    document.getElementById('v28-income-source').textContent=a.income?money(a.income):'Belum diisi';
    document.getElementById('v28-saving-value').textContent=money(a.save);document.getElementById('v28-spendable-value').textContent=money(a.spendable);document.getElementById('v28-auto-state').textContent=a.cfg.mode==='auto'?'OTOMATIS':'MANUAL';
    const status=document.getElementById('v283-budget-status');if(status)status.textContent=a.cfg.mode==='auto'?'Sisa setelah tabungan dibagi otomatis berdasarkan proporsi kebutuhan.':`Dialokasikan ${money(a.assigned)}${remain?` · belum dialokasikan ${money(remain)}`:''}.`;
    const grid=document.getElementById('v28-budget-grid');
    grid.innerHTML=BUCKETS.map(b=>{const lim=a.buckets[b]||0,u=spent[b]||0,p=lim?Math.round(u/lim*100):0,clamped=Math.max(0,Math.min(100,p));return `<div class="v283-budget-item"><div class="v283-iconbox">${bucketIcon(b)}</div><div class="v283-budget-body"><div class="v283-budget-line"><b>${esc(b)}</b><span class="${p>100?'is-danger':p>=80?'is-warning':'is-safe'}">${lim?p:0}%</span></div><small>${money(u)} / ${money(lim)}</small><div class="v283-progress"><i style="width:${clamped}%" class="${p>100?'is-danger':p>=80?'is-warning':'is-safe'}"></i></div></div></div>`}).join('');
    const tops=Object.entries(st.groups).sort((x,y)=>y[1]-x[1]).slice(0,4),big=st.biggest;
    review.innerHTML=`<div class="v283-section-head"><div><span class="v283-kicker">MONEY REVIEW</span><h3>Ringkasan pemakaian uang</h3><p>${st.rows.length} transaksi bulan ini · ${money(st.total)}</p></div><button class="v283-icon-button" onclick="openSpendingReviewV28()" aria-label="Buka detail">${icon('arrow-up-right')}</button></div><div class="v283-metrics"><div>${icon('wallet-cards')}<span>Total keluar</span><b>${money(st.total)}</b></div><div>${icon('calendar-days')}<span>Hari aktif</span><b>${st.activeDays} hari</b></div><div>${icon('arrow-up-right')}<span>Terbesar</span><b>${big?money(big.nominal):money(0)}</b></div><div>${icon('timer-reset')}<span>Efektif / hari</span><b>${st.coverage.length?money(st.effective):'—'}</b></div></div><div class="v283-review-columns"><section><div class="v283-subhead">Pemakaian terbesar</div>${tops.map(([b,n])=>`<div class="v283-list-row"><span>${bucketIcon(b)}<span>${esc(b)}</span></span><b>${money(n)}</b></div>`).join('')||'<div class="v283-empty">Belum ada pengeluaran bulan ini.</div>'}</section><section><div class="v283-subhead">Durasi pemakaian</div>${st.coverage.length?st.coverage.slice(0,4).map(({t,info})=>{const d=info.enabled?info.days:Number(t.usageDays),pd=info.enabled?info.perDay:(Number(t.nominal)||0)/Math.max(1,d);return `<div class="v283-list-row"><span>${icon('timer')}<span>${esc(t.catatan||t.kategori)}<small>${d} hari${info.enabled&&info.active?' berjalan':' selesai'}</small></span></span><b>${money(pd)}<small>/hari</small></b></div>`}).join(''):'<div class="v283-empty">Aktifkan durasi otomatis pada transaksi yang ingin ditinjau.</div>'}</section></div>`;
    window.lucide?.createIcons?.();
  }

  function modeTabs(c){return `<div class="v283-mode-tabs"><button type="button" data-mode="auto" class="${c.mode==='auto'?'active':''}">${icon('sparkles')}<span><b>Otomatis</b><small>Bagi sisa uang secara otomatis</small></span></button><button type="button" data-mode="manual" class="${c.mode==='manual'?'active':''}">${icon('sliders-horizontal')}<span><b>Manual</b><small>Tentukan setiap batas sendiri</small></span></button></div>`}
  function autoFields(c){return `<div class="v283-config-block" data-v283-mode-panel="auto"><div class="v283-field"><label>Pendapatan bulan ini</label><input id="v283-income" inputmode="numeric" value="${c.manualIncome?Number(c.manualIncome).toLocaleString('id-ID'):''}" placeholder="0" oninput="formatMoneyField(this)"><small>Kosongkan untuk memakai transaksi Gaji bulan berjalan (${money(detectedIncome())}).</small></div><div class="v283-field"><label>Target tabungan</label><input id="v283-saving" inputmode="numeric" value="${c.savingAmount?Number(c.savingAmount).toLocaleString('id-ID'):''}" placeholder="0" oninput="formatMoneyField(this)"><small>Sisa pendapatan setelah tabungan akan dibagi otomatis.</small></div><details class="v283-advanced"><summary>Atur proporsi pembagian</summary><div class="v283-weight-grid">${BUCKETS.map(b=>`<label><span>${bucketIcon(b)} ${esc(b)}</span><input class="v283-weight" data-bucket="${esc(b)}" type="number" min="0" max="100" value="${Number(c.weights?.[b]??DEFAULT_WEIGHTS[b])}"></label>`).join('')}</div><small>Bobot akan dinormalisasi otomatis menjadi 100%.</small></details></div>`}
  function manualFields(c){return `<div class="v283-config-block" data-v283-mode-panel="manual"><div class="v283-field"><label>Pendapatan bulan ini</label><input id="v283-manual-income" inputmode="numeric" value="${c.manualIncome?Number(c.manualIncome).toLocaleString('id-ID'):''}" placeholder="0" oninput="formatMoneyField(this)"></div><div class="v283-field"><label>Target tabungan</label><input id="v283-manual-saving" inputmode="numeric" value="${c.savingAmount?Number(c.savingAmount).toLocaleString('id-ID'):''}" placeholder="0" oninput="formatMoneyField(this)"></div><div class="v283-manual-grid">${BUCKETS.map(b=>`<label><span>${bucketIcon(b)} ${esc(b)}</span><input class="v283-manual-value" data-bucket="${esc(b)}" inputmode="numeric" value="${Number(c.manualBuckets?.[b])?Number(c.manualBuckets[b]).toLocaleString('id-ID'):''}" placeholder="0" oninput="formatMoneyField(this)"></label>`).join('')}</div><small>Manual tidak membagi sisa uang otomatis. Nilai yang lu isi langsung menjadi batas kategori.</small></div>`}

  window.configureAutoBudgetV28=async()=>{
    const c=read();
    const html=`<div class="v283-config">${modeTabs(c)}${autoFields(c)}${manualFields(c)}<label class="v283-inline-check"><input id="v283-bonus" type="checkbox" ${c.useBonus?'checked':''}><span>Masukkan Bonus sebagai pendapatan terdeteksi</span></label></div>`;
    const r=await Swal.fire({title:'Atur batas penggunaan uang',html,showCancelButton:true,confirmButtonText:'Simpan & Terapkan',cancelButtonText:'Batal',width:760,customClass:{popup:'v283-swal'},didOpen:()=>{
      let mode=c.mode;const refresh=()=>{document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));document.querySelectorAll('[data-v283-mode-panel]').forEach(p=>p.hidden=p.dataset.v283ModePanel!==mode);window.lucide?.createIcons?.()};
      document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelector('.v283-config').dataset.mode=mode;refresh()}));document.querySelector('.v283-config').dataset.mode=mode;refresh();
    },preConfirm:()=>{
      const root=document.querySelector('.v283-config'),mode=root?.dataset.mode||c.mode,parse=id=>Number(String(document.getElementById(id)?.value||'').replace(/\D/g,''))||0,weights={},manualBuckets={};
      document.querySelectorAll('.v283-weight').forEach(i=>weights[i.dataset.bucket]=Math.max(0,Number(i.value)||0));document.querySelectorAll('.v283-manual-value').forEach(i=>manualBuckets[i.dataset.bucket]=Math.max(0,Number(String(i.value||'').replace(/\D/g,''))||0));
      return {...c,mode,enabled:mode==='auto',manualIncome:parse(mode==='auto'?'v283-income':'v283-manual-income'),savingAmount:parse(mode==='auto'?'v283-saving':'v283-manual-saving'),weights,manualBuckets,useBonus:!!document.getElementById('v283-bonus')?.checked};
    }});
    if(!r.isConfirmed)return;write(r.value);applyBudget(false);render();
  };

  window.openSpendingReviewV28=async()=>{
    const st=stats(),rows=st.rows;
    const html=`<div class="v283-detail"><div class="v283-detail-metrics"><div><span>Total bulan ini</span><b>${money(st.total)}</b></div><div><span>Transaksi</span><b>${rows.length}</b></div><div><span>Hari aktif</span><b>${st.activeDays}</b></div></div><div class="v283-detail-list">${rows.map(t=>{const b=bucketOf(t),info=usageInfo(t,store?.trans||[]);return `<div class="v283-detail-row"><div class="v283-detail-main"><span class="v283-iconbox">${bucketIcon(b)}</span><span><b>${esc(t.catatan||t.kategori)}</b><small>${esc(t.tanggal||'')} · ${esc(b)} · ${esc(t.dompet||'')}</small></span></div><div class="v283-detail-value"><b>${money(t.nominal)}</b><small class="${info.enabled&&info.active?'v282-running':''}">${esc(durationLine(t))}</small></div></div>`}).join('')||'<div class="v283-empty">Belum ada transaksi.</div>'}</div></div>`;
    await Swal.fire({title:'Review pemakaian uang',html,width:820,confirmButtonText:'Tutup',customClass:{popup:'v283-swal'},didOpen:()=>window.lucide?.createIcons?.()});
  };

  function goPage(id){try{window.nav?.(id,null)}catch{};setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}),120)}
  function planningFeature(id){goPage('planning');setTimeout(()=>{window.selectPlanningFeatureV2754?.(id,true);window.selectPlanningFeatureV26?.(id,true)},250)}
  const SHORTCUTS=[
    ['home','Dashboard','layout-dashboard',()=>goPage('home')],['add','Catat transaksi','circle-plus',()=>goPage('add')],['history','Riwayat','history',()=>goPage('history')],['planning','Budget & tagihan','calendar-range',()=>goPage('planning')],
    ['auto','Auto Budget','wallet-cards',()=>configureAutoBudgetV28()],['review','Money Review','chart-no-axes-combined',()=>openSpendingReviewV28()],['decision','Decision Lab','flask-conical',()=>planningFeature('decision')],['tracking','Realisasi','activity',()=>planningFeature('tracking')],
    ['whatif','What-if','sliders-horizontal',()=>planningFeature('whatif')],['report','Laporan','file-chart-column',()=>planningFeature('report')],['settings','Automation','bot',()=>goPage('settings')],['backup','Backup & Restore','archive-restore',()=>goPage('settings')]
  ];
  window.openFinanceShortcutV283=async()=>{
    const html=`<div class="v283-shortcut-grid">${SHORTCUTS.map(([id,label,ic])=>`<button type="button" data-shortcut="${id}">${icon(ic)}<span>${label}</span></button>`).join('')}</div>`;
    await Swal.fire({title:'Shortcut Information',html,showConfirmButton:false,showCloseButton:true,width:680,customClass:{popup:'v283-swal v283-shortcut-swal'},didOpen:()=>{document.querySelectorAll('[data-shortcut]').forEach(b=>b.addEventListener('click',()=>{const x=SHORTCUTS.find(s=>s[0]===b.dataset.shortcut);Swal.close();setTimeout(()=>x?.[3]?.(),80)}));window.lucide?.createIcons?.()}});
  };

  function injectShortcutButton(){
    if(document.getElementById('v283-shortcut-button'))return;const home=document.getElementById('home');if(!home)return;const header=home.querySelector('.header');if(!header)return;
    const btn=document.createElement('button');btn.id='v283-shortcut-button';btn.className='v283-shortcut-button';btn.type='button';btn.setAttribute('aria-label','Shortcut Information');btn.title='Shortcut Information';btn.innerHTML=icon('grid-2x2');btn.onclick=window.openFinanceShortcutV283;header.appendChild(btn);
  }
  function inject(){
    const settings=document.getElementById('settings'),home=document.getElementById('home');if(!settings)return;
    let card=document.getElementById('v28-auto-budget-card');if(!card){const old=settings.querySelector('.limit-guard-card');card=document.createElement('div');card.id='v28-auto-budget-card';card.className='card v28-auto-card';settings.insertBefore(card,old||settings.children[3]||null)}
    card.innerHTML=`<div class="v283-section-head"><div><span class="v283-kicker">BUDGET CONTROL</span><h3>Batas penggunaan uang</h3><p id="v283-budget-status">Pendapatan dikurangi tabungan, lalu dibagi ke kebutuhan.</p></div><span id="v28-auto-state" class="v283-mode-badge">OTOMATIS</span></div><div class="v283-summary"><div><span>Pendapatan</span><b id="v28-income-source">Rp 0</b></div><div><span>Tabungan</span><b id="v28-saving-value">Rp 0</b></div><div><span>Untuk kebutuhan</span><b id="v28-spendable-value">Rp 0</b></div></div><div id="v28-budget-grid" class="v283-budget-grid"></div><div class="v283-actions"><button type="button" onclick="configureAutoBudgetV28()">${icon('settings-2')}<span>Atur budget</span></button><button type="button" onclick="openSpendingReviewV28()">${icon('chart-no-axes-combined')}<span>Review pemakaian</span></button></div>`;
    if(home&&!document.getElementById('v28-spending-review')){const r=document.createElement('div');r.id='v28-spending-review';r.className='card v28-review-card';const chart=home.querySelector('.home-chart-card');home.insertBefore(r,chart||null)}
    injectShortcutButton();window.lucide?.createIcons?.();render();
  }
  function wrapRender(){const old=window.renderAll;if(typeof old==='function'&&!old.__v283){const fn=function(){const r=old.apply(this,arguments);setTimeout(()=>{injectShortcutButton();render();maybeAutoApply()},0);return r};fn.__v283=true;window.renderAll=fn}}
  function init(){inject();wrapRender();maybeAutoApply();render()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,350));else setTimeout(init,350);
})();
