(() => {
  'use strict';
  const KEY='agis_finance_auto_budget_v28';
  const BUCKETS=['Makan Pokok','Jajan','Transportasi','Tagihan','Pemberian','Belanja','Hiburan','Lainnya'];
  const DEFAULT_WEIGHTS={
    'Makan Pokok':25,'Jajan':10,'Transportasi':10,'Tagihan':15,'Pemberian':5,'Belanja':5,'Hiburan':5,'Lainnya':5
  };
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>typeof fmt==='function'?fmt(Math.round(Number(n)||0)):`Rp ${Math.round(Number(n)||0).toLocaleString('id-ID')}`;
  const monthKey=()=>typeof localDateKey==='function'?localDateKey().slice(0,7):new Date().toISOString().slice(0,7);
  const read=()=>{try{return {enabled:true,manualIncome:0,savingPct:15,hardBufferPct:10,useBonus:false,weights:{...DEFAULT_WEIGHTS},...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {enabled:true,manualIncome:0,savingPct:15,hardBufferPct:10,useBonus:false,weights:{...DEFAULT_WEIGHTS}}}};
  const write=v=>{localStorage.setItem(KEY,JSON.stringify(v)); try{persistLocalSnapshot?.()}catch{}};
  function sourceIncome(){
    const cfg=read(), mk=monthKey();
    const rows=(store?.incomes||[]).filter(x=>String(x.tanggal||'').startsWith(mk));
    const salary=rows.filter(x=>x.kategori==='Gaji'||(cfg.useBonus&&x.kategori==='Bonus')).reduce((s,x)=>s+(Number(x.nominal)||0),0);
    return salary>0?salary:Math.max(0,Number(cfg.manualIncome)||0);
  }
  function normalizeWeights(raw){const out={};BUCKETS.forEach(b=>out[b]=Math.max(0,Number(raw?.[b]??DEFAULT_WEIGHTS[b]??0)));return out}
  function allocations(){
    const cfg=read(), income=sourceIncome(), save=Math.round(income*Math.max(0,Number(cfg.savingPct)||0)/100), spendable=Math.max(0,income-save);
    const weights=normalizeWeights(cfg.weights), total=Object.values(weights).reduce((s,n)=>s+n,0)||1;
    const buckets={};BUCKETS.forEach(b=>buckets[b]=Math.round(spendable*(weights[b]/total)));
    return {income,save,spendable,buckets,cfg};
  }
  function bucketOf(t){
    if(t?.budgetBucket&&BUCKETS.includes(t.budgetBucket))return t.budgetBucket;
    const c=String(t?.kategori||''), note=String(t?.catatan||t?.note||'').toLowerCase();
    if(c==='Makan & Minum') return /(jajan|snack|kopi|coffee|es |boba|cafe|café|minuman)/i.test(note)?'Jajan':'Makan Pokok';
    if(c==='Transportasi')return 'Transportasi'; if(c==='Tagihan')return 'Tagihan'; if(c==='Keluarga & Pemberian')return 'Pemberian'; if(c==='Belanja')return 'Belanja'; if(c==='Hiburan')return 'Hiburan'; return 'Lainnya';
  }
  function baseBudgetsFromBuckets(b){return {
    'Makan & Minum':(b['Makan Pokok']||0)+(b['Jajan']||0),
    'Transportasi':b['Transportasi']||0,'Tagihan':b['Tagihan']||0,'Keluarga & Pemberian':b['Pemberian']||0,
    'Belanja':b['Belanja']||0,'Hiburan':b['Hiburan']||0,'Lainnya':b['Lainnya']||0
  }}
  function applyAutoBudget(silent=false){
    const a=allocations(); if(!a.cfg.enabled||a.income<=0)return false;
    const mk=monthKey(), v25=(()=>{try{return JSON.parse(localStorage.getItem('agis_finance_v25_planning')||'{}')}catch{return {}}})();
    v25.budgets=v25.budgets||{}; v25.budgets[mk]=baseBudgetsFromBuckets(a.buckets); localStorage.setItem('agis_finance_v25_planning',JSON.stringify(v25));
    const hardFactor=1+Math.max(0,Number(a.cfg.hardBufferPct)||0)/100;
    const hard={};Object.entries(v25.budgets[mk]).forEach(([k,v])=>hard[k]=Math.round(Number(v||0)*hardFactor));
    if(typeof store==='object'&&store){store.limits={...(store.limits||{}),...hard};try{persistLocalSnapshot?.()}catch{};
      Object.entries(hard).forEach(([category,amount])=>{try{const now=Date.now();enqueueSync?.({opId:`auto-limit:${category}:${mk}:${amount}`,type:'setLimit',category,amount,createdAt:now,updatedAt:now})}catch{}});
    }
    localStorage.setItem('agis_finance_auto_budget_applied_v28',JSON.stringify({month:mk,income:a.income,signature:`${mk}:${a.income}:${a.save}:${JSON.stringify(a.cfg.weights)}`,at:Date.now()}));
    try{window.renderV25?.();window.renderAll?.();window.scheduleAutomationSyncV245?.()}catch{}
    if(!silent&&window.Swal)Swal.fire('Budget otomatis diterapkan',`Pendapatan ${money(a.income)} · tabungan ${money(a.save)} · budget variabel ${money(a.spendable)}.`,'success');
    return true;
  }
  function maybeAutoApply(){const a=allocations();if(!a.cfg.enabled||a.income<=0)return;let last={};try{last=JSON.parse(localStorage.getItem('agis_finance_auto_budget_applied_v28')||'{}')}catch{};const sig=`${monthKey()}:${a.income}:${a.save}:${JSON.stringify(a.cfg.weights)}`;if(last.signature!==sig)setTimeout(()=>applyAutoBudget(true),80)}
  function spentByBucket(){const mk=monthKey(), out={};BUCKETS.forEach(b=>out[b]=0);(store?.trans||[]).filter(t=>String(t.tanggal||'').startsWith(mk)&&t.kategori!=='Penyesuaian Saldo').forEach(t=>out[bucketOf(t)]=(out[bucketOf(t)]||0)+(Number(t.nominal)||0));return out}
  function reviewRows(){const mk=monthKey();return (store?.trans||[]).filter(t=>String(t.tanggal||'').startsWith(mk)&&t.kategori!=='Penyesuaian Saldo').sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0))}
  function render(){
    const card=document.getElementById('v28-auto-budget-card'), review=document.getElementById('v28-spending-review');if(!card||!review)return;
    const a=allocations(), spent=spentByBucket();
    document.getElementById('v28-income-source').textContent=a.income?money(a.income):'Belum ada gaji';
    document.getElementById('v28-saving-value').textContent=money(a.save);
    document.getElementById('v28-auto-state').textContent=a.cfg.enabled?'OTOMATIS':'MANUAL';
    const grid=document.getElementById('v28-budget-grid');grid.innerHTML=BUCKETS.map(b=>{const lim=a.buckets[b]||0,u=spent[b]||0,p=lim?Math.round(u/lim*100):0;return `<div class="v28-budget-row"><div><b>${esc(b)}</b><small>${money(u)} dari ${money(lim)}</small></div><span class="${p>100?'bad':p>=80?'warn':'good'}">${lim?p:0}%</span></div>`}).join('');
    const rows=reviewRows(), total=rows.reduce((s,t)=>s+(Number(t.nominal)||0),0), groups={};rows.forEach(t=>{const b=bucketOf(t);groups[b]=(groups[b]||0)+(Number(t.nominal)||0)});const tops=Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,4);
    const covered=rows.filter(t=>Number(t.usageDays)>0).slice(0,6);
    review.innerHTML=`<div class="v28-review-head"><div><b>Spending Review</b><small>${rows.length} transaksi · total ${money(total)}</small></div><button class="btn-small" onclick="openSpendingReviewV28()">Detail</button></div><div class="v28-mini-list">${tops.map(([b,n])=>`<div><span>${iconForBucket(b)} ${esc(b)}</span><b>${money(n)}</b></div>`).join('')||'<div class="mini-muted">Belum ada pengeluaran bulan ini.</div>'}</div>${covered.length?`<div class="v28-coverage"><small>Pembayaran yang punya durasi manfaat</small>${covered.map(t=>`<div><span>${esc(t.catatan||t.kategori)} · ${Number(t.usageDays)} hari</span><b>${money((Number(t.nominal)||0)/Number(t.usageDays))}/hari</b></div>`).join('')}</div>`:''}`;
  }
  function iconForBucket(b){return ({'Makan Pokok':'🍚','Jajan':'🧋','Transportasi':'⛽','Tagihan':'🧾','Pemberian':'🎁','Belanja':'🛍️','Hiburan':'🎮','Lainnya':'📦'})[b]||'💸'}
  window.configureAutoBudgetV28=async()=>{const c=read();const html=`<div class="v28-config"><label><span>Mode otomatis</span><input id="v28-c-enabled" type="checkbox" ${c.enabled?'checked':''}></label><label><span>Gaji manual (dipakai jika belum ada transaksi Gaji bulan ini)</span><input id="v28-c-income" inputmode="numeric" value="${c.manualIncome?Number(c.manualIncome).toLocaleString('id-ID'):''}" oninput="formatMoneyField(this)"></label><label><span>Tabungan otomatis (%)</span><input id="v28-c-save" type="number" min="0" max="80" value="${Number(c.savingPct)||0}"></label><label><span>Buffer hard limit (%)</span><input id="v28-c-hard" type="number" min="0" max="100" value="${Number(c.hardBufferPct)||0}"></label><label class="v28-check"><input id="v28-c-bonus" type="checkbox" ${c.useBonus?'checked':''}><span>Bonus ikut dihitung sebagai pendapatan budget</span></label><hr>${BUCKETS.map(b=>`<label><span>${iconForBucket(b)} ${b} · bobot</span><input class="v28-weight" data-bucket="${b}" type="number" min="0" max="100" value="${Number(c.weights?.[b]??DEFAULT_WEIGHTS[b])}"></label>`).join('')}<small>Total bobot bebas; sistem otomatis menormalisasi proporsinya.</small></div>`;const r=await Swal.fire({title:'Auto Budget Engine',html,showCancelButton:true,confirmButtonText:'Simpan & Terapkan',cancelButtonText:'Batal',preConfirm:()=>{const weights={};document.querySelectorAll('.v28-weight').forEach(i=>weights[i.dataset.bucket]=Math.max(0,Number(i.value)||0));return {enabled:!!document.getElementById('v28-c-enabled').checked,manualIncome:Number(String(document.getElementById('v28-c-income').value||'').replace(/\D/g,''))||0,savingPct:Math.max(0,Number(document.getElementById('v28-c-save').value)||0),hardBufferPct:Math.max(0,Number(document.getElementById('v28-c-hard').value)||0),useBonus:!!document.getElementById('v28-c-bonus').checked,weights}}});if(!r.isConfirmed)return;write(r.value);applyAutoBudget(false);render()};
  window.openSpendingReviewV28=async()=>{const rows=reviewRows();const html=`<div class="v28-detail">${rows.map(t=>{const days=Math.max(0,Number(t.usageDays)||0),b=bucketOf(t);return `<div class="v28-detail-row"><div><b>${iconForBucket(b)} ${esc(t.catatan||t.kategori)}</b><small>${esc(t.tanggal||'')} · ${esc(b)} · ${esc(t.dompet||'')}</small></div><div><strong>${money(t.nominal)}</strong>${days?`<small>${days} hari · ${money((Number(t.nominal)||0)/days)}/hari</small>`:'<small>durasi belum diisi</small>'}</div></div>`}).join('')||'<div class="mini-muted">Belum ada transaksi.</div>'}</div>`;await Swal.fire({title:'Review Pemakaian Uang',html,width:720,confirmButtonText:'Tutup'})};
  function inject(){
    const settings=document.getElementById('settings'), home=document.getElementById('home');if(!settings||document.getElementById('v28-auto-budget-card'))return;
    const old=settings.querySelector('.limit-guard-card');const card=document.createElement('div');card.id='v28-auto-budget-card';card.className='card v28-auto-card';card.innerHTML=`<div class="v28-head"><div><div class="section-title"><i data-lucide="wand-sparkles"></i> Auto Budget Engine</div><div class="mini-muted">Batas budget dibagi otomatis dari gaji, tetap bisa ditinjau dan diubah.</div></div><span id="v28-auto-state" class="v28-badge">OTOMATIS</span></div><div class="v28-summary"><div><small>Sumber budget</small><b id="v28-income-source">Rp 0</b></div><div><small>Tabungan otomatis</small><b id="v28-saving-value">Rp 0</b></div></div><div id="v28-budget-grid" class="v28-budget-grid"></div><button class="btn-small" style="width:100%;margin-top:12px" onclick="configureAutoBudgetV28()">Atur Mode Otomatis</button>`;settings.insertBefore(card,old||settings.children[3]||null);
    if(home){const r=document.createElement('div');r.id='v28-spending-review';r.className='card v28-review-card';const chart=home.querySelector('.home-chart-card');home.insertBefore(r,chart||null)}
    window.lucide?.createIcons?.();render();
  }
  function wrapRender(){const old=window.renderAll;if(typeof old==='function'&&!old.__v28){const fn=function(){const r=old.apply(this,arguments);setTimeout(()=>{render();maybeAutoApply()},0);return r};fn.__v28=true;window.renderAll=fn}}
  function init(){inject();wrapRender();maybeAutoApply();render()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,350));else setTimeout(init,350);
})();
