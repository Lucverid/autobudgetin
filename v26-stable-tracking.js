(() => {
  'use strict';

  // Stable add-on: all tracking data lives INSIDE the existing v26 Decision Lab state.
  // That means the existing schema-v26 backup/restore, cloud snapshot, and factory reset
  // keep working without replacing the proven core modules.
  const ROOT_KEY = 'agis_finance_v26_decision_lab';
  const TRACK_KEY = 'trackingStable';
  const REASONS = [
    ['', 'Tidak diisi'], ['normal', 'Normal'], ['ramai', 'Ramai'], ['promo', 'Promo'],
    ['hujan', 'Hujan'], ['libur', 'Libur / event'], ['stok', 'Stok terbatas'], ['lainnya', 'Lainnya']
  ];
  const DEFAULTS = {
    activeTab: 'business', activeBusinessId: '', activeCreditId: '',
    businesses: [], credits: [], selectedDates: {}, calendarMonths: {}, chartMetrics: {}, events: []
  };
  let chart = null;
  let mounted = false;
  let navWrapped = false;

  const clone = v => JSON.parse(JSON.stringify(v));
  const num = v => Math.max(0, Number(String(v ?? '').replace(/[^0-9.-]/g, '')) || 0);
  const moneyNum = v => Math.max(0, Number(String(v ?? '').replace(/\D/g, '')) || 0);
  const uid = p => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const rp = n => typeof fmt === 'function' ? fmt(Math.round(Number(n)||0)) : `Rp ${Math.round(Number(n)||0).toLocaleString('id-ID')}`;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const shiftDate = (key, delta) => { const d = new Date(`${key}T00:00:00`); d.setDate(d.getDate()+delta); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const shiftMonth = (key, delta) => { const [y,m] = String(key).split('-').map(Number), d = new Date(y,m-1+delta,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
  const humanDate = k => { const d = new Date(`${k}T00:00:00`); return Number.isNaN(d.getTime()) ? String(k||'-') : d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}); };
  const shortDate = k => { const d = new Date(`${k}T00:00:00`); return Number.isNaN(d.getTime()) ? String(k||'-') : d.toLocaleDateString('id-ID',{day:'numeric',month:'short'}); };
  const humanMonth = k => { const [y,m] = String(k||today().slice(0,7)).split('-').map(Number); return new Date(y,m-1,1).toLocaleDateString('id-ID',{month:'long',year:'numeric'}); };
  const daysBetween = (a,b) => Math.max(1, Math.ceil((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`))/86400000)+1);
  const compactMoney = n => { const v=Math.round(Number(n)||0); if(v>=1000000)return `${(v/1000000).toFixed(v%1000000?1:0)}jt`; if(v>=1000)return `${Math.round(v/1000)}k`; return String(v); };
  const reasonLabel = key => (REASONS.find(([v]) => v === String(key||'')) || REASONS[0])[1];

  function rootState(){ try { return JSON.parse(localStorage.getItem(ROOT_KEY)||'{}') || {}; } catch { return {}; } }
  function decisionState(){ return rootState(); }
  function trackingState(){
    const raw = rootState()[TRACK_KEY] || {};
    const s = {
      ...clone(DEFAULTS), ...raw,
      businesses: Array.isArray(raw.businesses)?raw.businesses:[],
      credits: Array.isArray(raw.credits)?raw.credits:[],
      selectedDates: {...(raw.selectedDates||{})}, calendarMonths: {...(raw.calendarMonths||{})},
      chartMetrics: {...(raw.chartMetrics||{})}, events: Array.isArray(raw.events)?raw.events:[]
    };
    s.businesses.forEach(b=>{
      if(!Array.isArray(b.sales)) b.sales=[]; if(!Array.isArray(b.stockAdds)) b.stockAdds=[];
      if(!Array.isArray(b.targetAdjustments)) b.targetAdjustments=[];
      if(!Object.prototype.hasOwnProperty.call(b,'originalUnitsPerDay')) b.originalUnitsPerDay=num(b.unitsPerDay);
      if(!Object.prototype.hasOwnProperty.call(b,'targetProfit')) b.targetProfit=0;
      if(!b.milestones||typeof b.milestones!=='object') b.milestones={};
      if(!b.milestones.dailyTargetDates||typeof b.milestones.dailyTargetDates!=='object') b.milestones.dailyTargetDates={};
    });
    s.credits.forEach(c=>{
      if(!Array.isArray(c.payments)) c.payments=[];
      if(!c.milestones||typeof c.milestones!=='object') c.milestones={};
    });
    return s;
  }
  function persistTracking(s){
    const root = rootState(); root[TRACK_KEY] = s; localStorage.setItem(ROOT_KEY, JSON.stringify(root));
    try { window.persistLocalSnapshot?.(); } catch {}
  }
  function setTracking(mutator){ const s=trackingState(); mutator(s); persistTracking(s); return s; }
  function addEvent(s,type,payload={}){
    s.events.push({id:uid('evt'),type,at:Date.now(),date:today(),...payload});
    if(s.events.length>80)s.events=s.events.slice(-80);
  }
  function sourceBusiness(id){ return (decisionState().businesses||[]).find(x=>x.id===id); }
  function sourceCredit(id){ return (decisionState().credits||[]).find(x=>x.id===id); }
  function hppFromData(d){ return ['material','packaging','labor','operational','otherUnit'].reduce((sum,k)=>sum+num(d?.[k]),0); }
  function installmentFromData(d){
    const principal=Math.max(0,num(d.cashPrice)-num(d.downPayment)),months=Math.max(1,Math.round(num(d.months)||1)),annual=num(d.interest)/100;
    if(d.method==='annuity'){const r=annual/12;return r>0?principal*(r*Math.pow(1+r,months))/(Math.pow(1+r,months)-1):principal/months;}
    return principal/months+(principal*annual/12);
  }
  function bizById(s,id){ return s.businesses.find(x=>x.id===id); }
  function creditById(s,id){ return s.credits.find(x=>x.id===id); }
  function saleRevenue(e,b){ return Object.prototype.hasOwnProperty.call(e||{},'revenue')?num(e.revenue):num(e?.qty)*num(b?.salePrice); }
  function stockCost(e,b){ return Object.prototype.hasOwnProperty.call(e||{},'cost')?num(e.cost):num(e?.qty)*num(b?.hpp); }
  function dailyStats(b,date){
    const rows=(b?.sales||[]).filter(x=>x.date===date), qty=rows.reduce((s,x)=>s+num(x.qty),0), revenue=rows.reduce((s,x)=>s+saleRevenue(x,b),0);
    return {date,qty,revenue,profit:revenue-(qty*num(b?.hpp)),rows};
  }
  function businessStats(b){
    const sold=(b.sales||[]).reduce((s,x)=>s+num(x.qty),0), revenue=(b.sales||[]).reduce((s,x)=>s+saleRevenue(x,b),0);
    const initial=num(b.initialStock), added=(b.stockAdds||[]).reduce((s,x)=>s+num(x.qty),0), stock=Math.max(0,initial+added-sold);
    const plannedMargin=Math.max(0,num(b.salePrice)-num(b.hpp)), avgPrice=sold?revenue/sold:num(b.salePrice), actualMargin=Math.max(0,avgPrice-num(b.hpp));
    const restockCost=(b.stockAdds||[]).reduce((s,x)=>s+stockCost(x,b),0), capital=num(b.capitalNeeded)+restockCost, targetProfit=num(b.targetProfit);
    const contribution=Math.max(0,revenue-(sold*num(b.hpp))), fallbackMargin=actualMargin>0?actualMargin:plannedMargin;
    const remainingBepMoney=Math.max(0,capital-contribution), remainingTargetMoney=Math.max(0,capital+targetProfit-contribution);
    const remainingBep=fallbackMargin>0?Math.ceil(remainingBepMoney/fallbackMargin):0, remainingTarget=fallbackMargin>0?Math.ceil(remainingTargetMoney/fallbackMargin):0;
    const elapsed=daysBetween(b.startDate||today(),today()), avg=sold/elapsed, planned=num(b.unitsPerDay), currentDay=dailyStats(b,today());
    const projectedBepDays=avg>0?Math.ceil(remainingBep/avg):0, projectedTargetDays=avg>0?Math.ceil(remainingTarget/avg):0;
    const plannedUnits=Math.max(1,num(b.unitsPerDay)*Math.max(1,num(b.daysPerMonth)||26));
    const targetPrice=num(b.hpp)+((capital+targetProfit)/plannedUnits);
    return {sold,revenue,stock,restockCost,capital,targetProfit,contribution,grossProfit:revenue-(sold*num(b.hpp)),remainingBep,remainingTarget,remainingBepMoney,remainingTargetMoney,avg,planned,projectedBepDays,projectedTargetDays,bepPct:capital?Math.min(100,contribution/capital*100):0,targetPct:(capital+targetProfit)>0?Math.min(100,contribution/(capital+targetProfit)*100):0,currentDay,targetPrice};
  }
  function creditStats(c){
    const paid=(c.payments||[]).reduce((s,x)=>s+num(x.amount),0), installment=num(c.installment), months=Math.max(1,num(c.months)), total=installment*months, remaining=Math.max(0,total-paid), paidInstallments=installment>0?Math.min(months,Math.floor((paid+1)/installment)):0, pct=total?Math.min(100,paid/total*100):0;
    const nextIndex=Math.min(months,paidInstallments+1), nextDue=nextDueDate(c.startDate||today(),num(c.dueDay)||new Date().getDate(),nextIndex-1);
    return {paid,installment,months,total,remaining,paidInstallments,pct,nextIndex,nextDue,lunas:remaining<=1};
  }
  function nextDueDate(start,dueDay,offset){ const d0=new Date(`${start}T00:00:00`),d=new Date(d0.getFullYear(),d0.getMonth()+offset,1),cap=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(Math.max(1,dueDay),cap));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function creditSafety(s){
    let wallet=0,reserved=0,monthIncome=0; try{wallet=Object.values(store?.wallets||{}).reduce((a,b)=>a+(Number(b)||0),0);reserved=Number(store?.goal)||0;const m=today().slice(0,7);monthIncome=(store?.incomes||[]).filter(x=>String(x.tanggal||'').startsWith(m)).reduce((a,x)=>a+(Number(x.nominal)||0),0);}catch{}
    const available=Math.max(0,wallet-reserved), active=(s.credits||[]).filter(c=>c.active!==false&&!creditStats(c).lunas), obligations=active.reduce((a,c)=>a+num(c.installment),0), after=available-obligations, ratio=monthIncome>0?obligations/monthIncome*100:null;
    let status='Aman',tone='good',note='Total cicilan masih punya ruang dari saldo tersedia.';
    if(after<0||(ratio!==null&&ratio>40)){status='Berisiko';tone='bad';note='Cicilan aktif terlalu besar dibanding ruang uang saat ini.';}
    else if(after<available*.25||(ratio!==null&&ratio>30)){status='Mulai berat';tone='warn';note='Masih bisa jalan, tapi ruang setelah cicilan mulai sempit.';}
    if(!active.length){status='Belum ada cicilan aktif';tone='neutral';note='Mulai pantau cicilan untuk melihat indikator keamanan.';}
    return {status,tone,note,available,obligations,after,ratio};
  }
  function trimDailyMilestones(map,keep=60){const keys=Object.keys(map||{}).sort();while(keys.length>keep)delete map[keys.shift()];}
  function businessMilestoneCard(b,st){
    const planned=num(b.unitsPerDay),todayHit=planned>0&&st.currentDay.qty>=planned;
    if(st.targetProfit>0&&st.targetPct>=100)return `<div class="v26st-milestone ultimate"><i data-lucide="trophy"></i><div><small>MILESTONE TERCAPAI</small><b>🏆 Target keuntungan tercapai</b><span>Target ${rp(st.targetProfit)} sudah tercapai. Sisihkan dana restock dan tentukan berapa laba yang mau ditabung atau diputar lagi.</span></div></div>`;
    if(st.capital>0&&st.bepPct>=100)return `<div class="v26st-milestone bep"><i data-lucide="sparkles"></i><div><small>MILESTONE TERCAPAI</small><b>🎉 Balik modal tercapai</b><span>Modal berjalan sudah tertutup. Fokus berikutnya: jaga margin, stok, dan konsistensi penjualan.</span></div></div>`;
    if(todayHit)return `<div class="v26st-milestone daily"><i data-lucide="target"></i><div><small>TARGET HARI INI</small><b>🎯 Target ${planned} pcs tercapai</b><span>Pertahankan ritmenya. Kalau konsisten beberapa hari, target adaptif bisa dinaikkan bertahap.</span></div></div>`;
    return '';
  }
  function creditCompletionCard(c,st){
    if(!st.lunas)return '';
    return `<div class="v26st-milestone credit"><i data-lucide="party-popper"></i><div><small>SELESAI</small><b>🎉 ${esc(c.name||'Cicilan')} sudah lunas</b><span>Pembayaran baru dikunci untuk mencegah kelebihan input. Nominal cicilan ${rp(st.installment)}/bulan bisa dialihkan ke tabungan atau target berikutnya.</span></div></div>`;
  }
  function syncBusinessMilestones(id,dates=[],allowReset=true,seedOnly=false){
    const dateList=[...new Set((Array.isArray(dates)?dates:[dates]).filter(Boolean))],events=[];let info=null;
    setTracking(s=>{
      const b=bizById(s,id);if(!b)return;
      if(!b.milestones||typeof b.milestones!=='object')b.milestones={};
      if(!b.milestones.dailyTargetDates||typeof b.milestones.dailyTargetDates!=='object')b.milestones.dailyTargetDates={};
      const m=b.milestones,planned=num(b.unitsPerDay);
      dateList.forEach(date=>{
        const hit=planned>0&&dailyStats(b,date).qty>=planned;
        if(hit&&!m.dailyTargetDates[date]){m.dailyTargetDates[date]=Date.now();addEvent(s,'milestone_daily',{businessId:id,businessName:b.name,date,target:planned});if(!seedOnly)events.push({type:'daily',date});}
        else if(!hit&&allowReset&&m.dailyTargetDates[date])delete m.dailyTargetDates[date];
      });
      trimDailyMilestones(m.dailyTargetDates);
      const st=businessStats(b),bepHit=st.capital>0&&st.bepPct>=100,profitHit=st.targetProfit>0&&st.targetPct>=100;
      if(bepHit&&!m.bepReachedAt){m.bepReachedAt=Date.now();addEvent(s,'milestone_bep',{businessId:id,businessName:b.name});if(!seedOnly)events.push({type:'bep'});}
      else if(!bepHit&&allowReset&&m.bepReachedAt)delete m.bepReachedAt;
      if(profitHit&&!m.targetProfitReachedAt){m.targetProfitReachedAt=Date.now();addEvent(s,'milestone_profit',{businessId:id,businessName:b.name,targetProfit:st.targetProfit});if(!seedOnly)events.push({type:'profit'});}
      else if(!profitHit&&allowReset&&m.targetProfitReachedAt)delete m.targetProfitReachedAt;
      info={name:b.name||'Usaha',planned,st};
    });
    return {events,info};
  }
  function syncCreditMilestone(id,allowReset=true,seedOnly=false){
    let result={newlyPaid:false,info:null};
    setTracking(s=>{
      const c=creditById(s,id);if(!c)return;
      if(!c.milestones||typeof c.milestones!=='object')c.milestones={};
      const st=creditStats(c),paid=st.lunas;
      if(paid&&!c.milestones.paidAt){c.milestones.paidAt=Date.now();addEvent(s,'milestone_credit_paid',{creditId:id,creditName:c.name});result.newlyPaid=!seedOnly;}
      else if(!paid&&allowReset&&c.milestones.paidAt)delete c.milestones.paidAt;
      result.info={name:c.name||'Cicilan',st};
    });
    return result;
  }
  function showBusinessMilestonePopup(result){
    if(!result?.events?.length||!result.info)return;
    const hasProfit=result.events.some(x=>x.type==='profit'),hasBep=result.events.some(x=>x.type==='bep'),daily=result.events.find(x=>x.type==='daily');
    const title=hasProfit?'🏆 Target keuntungan tercapai!':hasBep?'🎉 Balik modal tercapai!':'🎯 Target penjualan tercapai!';
    const lines=[];
    if(daily)lines.push(`<p><b>Target ${result.info.planned} pcs tercapai${daily.date?` pada ${esc(humanDate(daily.date))}`:''}.</b><br><span>Pertahankan ritme beberapa hari sebelum menaikkan target.</span></p>`);
    if(hasBep)lines.push('<p><b>Modal berjalan sudah kembali.</b><br><span>Mulai pisahkan dana restock dari uang bebas.</span></p>');
    if(hasProfit)lines.push(`<p><b>Target keuntungan ${rp(result.info.st.targetProfit)} sudah tercapai.</b><br><span>Pertimbangkan mengunci sebagian laba sebagai tabungan atau modal cadangan.</span></p>`);
    Swal.fire({icon:'success',title,html:`<div class="v26st-swal-copy">${lines.join('')}</div>`,confirmButtonText:'Mantap!'});
  }
  function showCreditPaidPopup(result){
    if(!result?.newlyPaid||!result.info)return;
    Swal.fire({icon:'success',title:'🎉 Cicilan lunas!',html:`<div class="v26st-swal-copy"><p><b>${esc(result.info.name)} sudah selesai dibayar.</b></p><p>Pembayaran baru dikunci supaya tidak terjadi kelebihan catat. Riwayat tetap bisa diedit atau dihapus.</p><p>Nominal sekitar <b>${rp(result.info.st.installment)}/bulan</b> bisa dialihkan ke tabungan atau target berikutnya.</p></div>`,confirmButtonText:'Sip!'});
  }
  function seedExistingMilestones(){
    const s=trackingState();
    s.businesses.forEach(b=>syncBusinessMilestones(b.id,(b.sales||[]).map(x=>x.date),false,true));
    s.credits.forEach(c=>syncCreditMilestone(c.id,false,true));
  }

  function adaptiveTarget(b){
    const dates=[...new Set((b.sales||[]).map(x=>x.date).filter(Boolean))].sort().reverse().slice(0,7).sort(), rows=dates.map(d=>dailyStats(b,d)), current=num(b.unitsPerDay);
    if(rows.length<3)return {ready:false,rows,current,avg:0,suggested:current,meaningful:false};
    const avg=rows.reduce((s,x)=>s+x.qty,0)/rows.length, suggested=Math.max(1,Math.round(avg)), diff=current?Math.abs((suggested-current)/current*100):100;
    return {ready:true,rows,current,avg,suggested,meaningful:Math.abs(suggested-current)>=1&&diff>=12};
  }
  function weeklyStats(b,end=today()){
    const dates=Array.from({length:7},(_,i)=>shiftDate(end,i-6)),rows=dates.map(d=>dailyStats(b,d)),withData=rows.filter(x=>x.rows.length);
    const qty=rows.reduce((s,x)=>s+x.qty,0),revenue=rows.reduce((s,x)=>s+x.revenue,0),profit=rows.reduce((s,x)=>s+x.profit,0),planned=num(b.unitsPerDay);
    const best=withData.length?[...withData].sort((a,z)=>z.qty-a.qty||z.revenue-a.revenue)[0]:null,worst=withData.length?[...withData].sort((a,z)=>a.qty-z.qty||a.revenue-z.revenue)[0]:null;
    return {dates,rows,qty,revenue,profit,best,worst,targetHits:planned?rows.filter(x=>x.qty>=planned).length:0};
  }
  function reasonInsight(b){
    const cutoff=shiftDate(today(),-29),map=new Map();(b.sales||[]).filter(x=>x.date>=cutoff&&x.date<=today()).forEach(x=>{const d=map.get(x.date)||{qty:0,reasons:[]};d.qty+=num(x.qty);if(x.reason)d.reasons.push(x.reason);map.set(x.date,d);});
    const days=[...map.values()];if(days.length<3)return null;const avg=days.reduce((s,d)=>s+d.qty,0)/days.length,counts={};days.filter(d=>d.qty>=avg).forEach(d=>[...new Set(d.reasons)].forEach(r=>counts[r]=(counts[r]||0)+1));const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];return top?reasonLabel(top[0]):null;
  }
  function paceText(days){ if(!days)return 'Belum bisa diproyeksikan'; if(days<7)return `± ${days} hari`; if(days<45)return `± ${(days/7).toFixed(1)} minggu`; return `± ${(days/30).toFixed(1)} bulan`; }

  function createBusiness(sourceId){
    const src=sourceBusiness(sourceId); if(!src)return null; let created=null;
    setTracking(s=>{
      created=s.businesses.find(x=>x.sourceId===sourceId);
      if(!created){const d=src.data||{},hpp=hppFromData(d),capital=num(d.setupCost)+num(d.fixedMonthly)+(hpp*num(d.initialStock));created={id:uid('biztrack'),sourceId,name:d.name||'Bisnis',startDate:today(),salePrice:num(d.salePrice),hpp,unitsPerDay:num(d.unitsPerDay)||1,originalUnitsPerDay:num(d.unitsPerDay)||1,daysPerMonth:num(d.daysPerMonth)||26,targetProfit:0,initialStock:num(d.initialStock),capitalNeeded:capital,sales:[],stockAdds:[],targetAdjustments:[],active:true,createdAt:Date.now()};s.businesses.unshift(created);addEvent(s,'business_start',{businessId:created.id,businessName:created.name});}
      s.activeBusinessId=created.id;s.activeTab='business';s.selectedDates[created.id]=s.selectedDates[created.id]||today();s.calendarMonths[created.id]=s.calendarMonths[created.id]||today().slice(0,7);s.chartMetrics[created.id]=s.chartMetrics[created.id]||'qty';
    }); render(); return created;
  }
  function createCredit(sourceId){
    const src=sourceCredit(sourceId); if(!src)return null; let created=null;
    setTracking(s=>{created=s.credits.find(x=>x.sourceId===sourceId);if(!created){const d=src.data||{};created={id:uid('credittrack'),sourceId,name:d.name||'Kredit',startDate:today(),dueDay:new Date().getDate(),installment:installmentFromData(d),months:Math.max(1,Math.round(num(d.months)||1)),cashPrice:num(d.cashPrice),downPayment:num(d.downPayment),payments:[],active:true,createdAt:Date.now()};s.credits.unshift(created);addEvent(s,'credit_start',{creditId:created.id,creditName:created.name});}s.activeCreditId=created.id;s.activeTab='credit';});render();return created;
  }

  function mount(){
    const lab=document.getElementById('v26-decision-lab'); if(!lab)return false;
    if(document.getElementById('v26-stable-tracking')){mounted=true;return true;}
    const shell=document.createElement('details');shell.id='v26-stable-tracking';shell.className='v26st-shell';
    shell.innerHTML=`<summary><div><span>REALISASI & TRACKING</span><b>Pantau bisnis & cicilan</b><small>Terbuka hanya saat kamu butuh — tidak bekerja berat di Home.</small></div><i data-lucide="chevron-down"></i></summary><div id="v26st-body" class="v26st-body"></div>`;
    lab.appendChild(shell); shell.addEventListener('toggle',()=>{if(shell.open)render();else destroyChart();}); mounted=true; if(window.lucide?.createIcons)lucide.createIcons(); return true;
  }
  function ensureMount(){ if(mount())return; setTimeout(mount,500); setTimeout(mount,1400); }
  function wrapNav(){
    if(navWrapped||typeof window.nav!=='function')return;const original=window.nav;window.nav=function(id,el){const out=original.apply(this,arguments);if(id==='planning')setTimeout(ensureMount,80);else destroyChart();return out;};navWrapped=true;
  }
  function destroyChart(){if(chart){try{chart.destroy();}catch{}chart=null;}}

  function render(){
    const shell=document.getElementById('v26-stable-tracking');if(!shell||!shell.open)return;const body=document.getElementById('v26st-body');if(!body)return;const s=trackingState();
    body.innerHTML=`<div class="v26st-tabs"><button class="${s.activeTab==='business'?'active':''}" onclick="switchStableTracking('business')"><i data-lucide="store"></i> Penjualan</button><button class="${s.activeTab==='credit'?'active':''}" onclick="switchStableTracking('credit')"><i data-lucide="credit-card"></i> Cicilan</button></div>${s.activeTab==='credit'?renderCredit(s):renderBusiness(s)}`;
    if(window.lucide?.createIcons)lucide.createIcons();if(s.activeTab==='business')requestAnimationFrame(drawChart);else destroyChart();
  }
  function renderBusiness(s){
    const saved=decisionState().businesses||[], b=bizById(s,s.activeBusinessId)||s.businesses[0];
    const picker=`<div class="v26st-picker"><select id="v26st-biz-source"><option value="">Pilih skenario bisnis tersimpan…</option>${saved.map(x=>`<option value="${esc(x.id)}">${esc(x.data?.name||'Bisnis')}</option>`).join('')}</select><button onclick="startStableBusiness()">Mulai pantau</button></div>`;
    if(!b)return `${picker}<div class="v26st-empty"><b>Belum ada bisnis yang dipantau</b><span>Simpan skenario di Analisis Bisnis, lalu mulai tracking di sini.</span></div>`;
    const st=businessStats(b),selected=s.selectedDates[b.id]||today(),month=s.calendarMonths[b.id]||selected.slice(0,7),d=dailyStats(b,selected),prev=dailyStats(b,shiftDate(selected,-1)),next=dailyStats(b,shiftDate(selected,1)),adaptive=adaptiveTarget(b),week=weeklyStats(b),reason=reasonInsight(b),metric=s.chartMetrics[b.id]||'qty';
    return `${picker}<div class="v26st-switcher">${s.businesses.map(x=>`<button class="${x.id===b.id?'active':''}" onclick="selectStableBusiness('${esc(x.id)}')">${esc(x.name)}</button>`).join('')}</div>
      <div class="v26st-kpis"><div><small>Hari ini</small><b>${st.currentDay.qty} / ${st.planned} pcs</b><span>${st.currentDay.qty>=st.planned?'Target tercapai':`Kurang ${Math.max(0,st.planned-st.currentDay.qty)} pcs`}</span></div><div><small>Profit hari ini</small><b>${rp(st.currentDay.profit)}</b><span>Omzet ${rp(st.currentDay.revenue)}</span></div><div><small>Sisa stok</small><b>${st.stock} unit</b><span>Restock ${st.restockCost?rp(st.restockCost):'belum ada'}</span></div><div><small>Balik modal</small><b>${st.bepPct.toFixed(0)}%</b><span>${st.remainingBep?`${st.remainingBep} unit lagi`:'Sudah tercapai'}</span></div></div>
      ${businessMilestoneCard(b,st)}
      <div class="v26st-target-card"><div><small>TARGET KEUNTUNGAN</small><b>${st.targetProfit?rp(st.targetProfit):'Belum diatur'}</b><span>${st.targetProfit?`Dengan pace aktual: ${paceText(st.projectedTargetDays)} · saran harga di volume target ${rp(st.targetPrice)}`:'Atur target profit supaya aplikasi bisa menghitung kapan target tercapai.'}</span></div><button onclick="setStableBusinessTarget('${esc(b.id)}')">Atur target</button></div>
      ${adaptive.ready?`<div class="v26st-adaptive ${adaptive.meaningful?'active':''}"><div><small>TARGET ADAPTIF</small><b>${adaptive.meaningful?`Saran ${adaptive.suggested} pcs/hari`:'Target sekarang masih masuk akal'}</b><span>Rata-rata ${adaptive.rows.length} hari tercatat ${adaptive.avg.toFixed(1)} pcs/hari.</span></div>${adaptive.meaningful?`<button onclick="applyStableAdaptive('${esc(b.id)}',${adaptive.suggested})">Pakai saran</button>`:''}</div>`:'<div class="v26st-adaptive"><div><small>TARGET ADAPTIF</small><b>Butuh minimal 3 hari data</b><span>Hari 0 pcs tetap boleh dicatat supaya rata-rata jujur.</span></div></div>'}
      ${renderCalendar(b,month,selected)}
      <div class="v26st-day"><div class="v26st-day-head"><div><small>DATA TANGGAL TERPILIH</small><b>${humanDate(selected)}</b></div></div><div class="v26st-day-kpis"><div><small>Terjual</small><b>${d.qty} pcs</b></div><div><small>Omzet aktual</small><b>${rp(d.revenue)}</b></div><div><small>Profit produk</small><b>${rp(d.profit)}</b></div></div><div class="v26st-compare">${compareCard(d,prev,'H-1')}${compareCard(d,next,'H+1')}</div><div class="v26st-rows">${d.rows.length?d.rows.map(x=>`<div class="v26st-row"><div><b>${num(x.qty)} pcs · ${rp(saleRevenue(x,b))}</b><span>${esc(reasonLabel(x.reason))}${x.note?` · ${esc(x.note)}`:''}</span></div><button onclick="editStableSale('${esc(b.id)}','${esc(x.id)}')"><i data-lucide="pencil"></i></button><button onclick="deleteStableSale('${esc(b.id)}','${esc(x.id)}')"><i data-lucide="trash-2"></i></button></div>`).join(''):'<div class="v26st-empty small">Belum ada catatan di tanggal ini.</div>'}</div></div>
      <details class="v26st-week"><summary><div><small>RINGKASAN 7 HARI</small><b>${week.qty} pcs · ${rp(week.revenue)}</b></div><span>${rp(week.profit)}</span></summary><div class="v26st-week-grid"><div><small>Profit produk</small><b>${rp(week.profit)}</b></div><div><small>Target tercapai</small><b>${week.targetHits}/7 hari</b></div><div><small>Terbaik</small><b>${week.best?`${shortDate(week.best.date)} · ${week.best.qty} pcs`:'-'}</b></div><div><small>Terendah tercatat</small><b>${week.worst?`${shortDate(week.worst.date)} · ${week.worst.qty} pcs`:'-'}</b></div></div>${reason?`<p>Catatan yang paling sering muncul pada hari di atas rata-rata: <b>${esc(reason)}</b>.</p>`:''}</details>
      <div class="v26st-chart"><div class="v26st-chart-head"><div><small>TREN 7 HARI</small><b>Sampai ${shortDate(selected)}</b></div><div><button class="${metric==='qty'?'active':''}" onclick="setStableMetric('${esc(b.id)}','qty')">Pcs</button><button class="${metric==='revenue'?'active':''}" onclick="setStableMetric('${esc(b.id)}','revenue')">Omzet</button><button class="${metric==='profit'?'active':''}" onclick="setStableMetric('${esc(b.id)}','profit')">Profit</button></div></div><div class="v26st-canvas"><canvas id="v26st-chart"></canvas></div></div>
      <div class="v26st-actions"><button onclick="addStableSale('${esc(b.id)}','${selected}')"><i data-lucide="plus"></i> Catat penjualan</button><button class="secondary" onclick="addStableStock('${esc(b.id)}')"><i data-lucide="package-plus"></i> Restock</button><button class="danger" onclick="deleteStableBusiness('${esc(b.id)}')"><i data-lucide="trash-2"></i></button></div>
      ${(b.stockAdds||[]).length?`<details class="v26st-restock"><summary>Riwayat restock</summary>${[...b.stockAdds].sort((a,z)=>String(z.date).localeCompare(String(a.date))).map(x=>`<div class="v26st-row"><div><b>+${num(x.qty)} unit · ${humanDate(x.date)}</b><span>${rp(stockCost(x,b))}${x.note?` · ${esc(x.note)}`:''}</span></div><button onclick="editStableStock('${esc(b.id)}','${esc(x.id)}')"><i data-lucide="pencil"></i></button><button onclick="deleteStableStock('${esc(b.id)}','${esc(x.id)}')"><i data-lucide="trash-2"></i></button></div>`).join('')}</details>`:''}`;
  }
  function renderCalendar(b,month,selected){
    const [y,m]=month.split('-').map(Number),first=new Date(y,m-1,1),count=new Date(y,m,0).getDate(),offset=(first.getDay()+6)%7,planned=Math.max(1,num(b.unitsPerDay));const cells=[];for(let i=0;i<offset;i++)cells.push('<span></span>');
    for(let day=1;day<=count;day++){const date=`${month}-${String(day).padStart(2,'0')}`,d=dailyStats(b,date),has=d.rows.length>0,ratio=has?d.qty/planned:0,heat=ratio>=1.5?4:ratio>=1?3:ratio>=.5?2:has?1:0;cells.push(`<button class="v26st-cal-day heat-${heat} ${date===selected?'selected':''} ${date===today()?'today':''}" onclick="selectStableDate('${esc(b.id)}','${date}')"><span>${day}</span>${has?`<b>${d.qty}</b><small>${compactMoney(d.revenue)}</small>`:'<em>·</em>'}</button>`);}
    return `<div class="v26st-calendar"><div class="v26st-cal-head"><button onclick="shiftStableMonth('${esc(b.id)}',-1)"><i data-lucide="chevron-left"></i></button><div><small>KALENDER PENJUALAN</small><b>${humanMonth(month)}</b></div><div><button onclick="todayStableDate('${esc(b.id)}')">Hari ini</button><button onclick="shiftStableMonth('${esc(b.id)}',1)"><i data-lucide="chevron-right"></i></button></div></div><div class="v26st-weekdays">${['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(x=>`<span>${x}</span>`).join('')}</div><div class="v26st-cal-grid">${cells.join('')}</div><div class="v26st-heat"><span>Rendah</span><i class="heat-1"></i><i class="heat-2"></i><i class="heat-3"></i><i class="heat-4"></i><span>Tinggi</span></div></div>`;
  }
  function compareCard(cur,other,label){if(!(other.rows||[]).length)return `<div><small>vs ${label}</small><b>Belum ada data</b><span>Belum bisa dibandingkan.</span></div>`;const dq=cur.qty-other.qty,dr=cur.revenue-other.revenue;return `<div class="${dq>0?'up':dq<0?'down':''}"><small>vs ${label}</small><b>${dq===0?'Sama':dq>0?`+${dq} pcs`:`${dq} pcs`}</b><span>${dr>=0?'+':'-'}${rp(Math.abs(dr))}</span></div>`;}
  function renderCredit(s){
    const saved=decisionState().credits||[],c=creditById(s,s.activeCreditId)||s.credits[0],safe=creditSafety(s);const picker=`<div class="v26st-picker"><select id="v26st-credit-source"><option value="">Pilih simulasi kredit tersimpan…</option>${saved.map(x=>`<option value="${esc(x.id)}">${esc(x.data?.name||'Kredit')}</option>`).join('')}</select><button onclick="startStableCredit()">Mulai pantau</button></div>`;
    if(!c)return `${picker}<div class="v26st-safety ${safe.tone}"><b>${safe.status}</b><span>${safe.note}</span></div><div class="v26st-empty"><b>Belum ada cicilan yang dipantau</b><span>Simpan simulasi kredit lalu mulai tracking.</span></div>`;
    const st=creditStats(c);return `${picker}<div class="v26st-switcher">${s.credits.map(x=>`<button class="${x.id===c.id?'active':''}" onclick="selectStableCredit('${esc(x.id)}')">${esc(x.name)}</button>`).join('')}</div><div class="v26st-safety ${safe.tone}"><div><small>KEAMANAN CICILAN</small><b>${safe.status}</b><span>${safe.note}${safe.ratio!==null?` · total cicilan ${safe.ratio.toFixed(0)}% pemasukan bulan ini`:''}</span></div></div><div class="v26st-kpis"><div><small>Sudah dibayar</small><b>${rp(st.paid)}</b><span>${st.paidInstallments}/${st.months} cicilan</span></div><div><small>Sisa</small><b>${rp(st.remaining)}</b><span>${(100-st.pct).toFixed(0)}% tersisa</span></div><div><small>Bulanan</small><b>${rp(st.installment)}</b><span>Target pembayaran</span></div><div><small>Jatuh tempo</small><b>${st.lunas?'Lunas':humanDate(st.nextDue)}</b><span>${st.lunas?'Selesai':`Cicilan ke-${st.nextIndex}`}</span></div></div><div class="v26st-progress"><span style="width:${st.pct}%"></span></div>${creditCompletionCard(c,st)}${st.lunas?'':`<label class="v26st-due">Tanggal jatuh tempo tiap bulan <input type="number" min="1" max="31" value="${num(c.dueDay)||1}" onchange="changeStableDue('${esc(c.id)}',this.value)"></label>`}<div class="v26st-actions">${st.lunas?`<button class="v26st-paid-lock" disabled><i data-lucide="badge-check"></i> Lunas · pembayaran dikunci</button>`:`<button onclick="addStablePayment('${esc(c.id)}')"><i data-lucide="badge-check"></i> Catat pembayaran</button>`}<button class="danger" onclick="deleteStableCredit('${esc(c.id)}')"><i data-lucide="trash-2"></i></button></div><div class="v26st-rows">${(c.payments||[]).length?[...c.payments].sort((a,z)=>String(z.date).localeCompare(String(a.date))).map(x=>`<div class="v26st-row"><div><b>${humanDate(x.date)}</b><span>${esc(x.note||'Cicilan')}</span></div><strong>${rp(x.amount)}</strong><button onclick="editStablePayment('${esc(c.id)}','${esc(x.id)}')"><i data-lucide="pencil"></i></button><button onclick="deleteStablePayment('${esc(c.id)}','${esc(x.id)}')"><i data-lucide="trash-2"></i></button></div>`).join(''):'<div class="v26st-empty small">Belum ada pembayaran.</div>'}</div>`;
  }

  function drawChart(){
    const shell=document.getElementById('v26-stable-tracking');if(!shell?.open)return;const s=trackingState(),b=bizById(s,s.activeBusinessId)||s.businesses[0],canvas=document.getElementById('v26st-chart');if(!b||!canvas||typeof Chart==='undefined')return;destroyChart();const selected=s.selectedDates[b.id]||today(),metric=s.chartMetrics[b.id]||'qty',dates=Array.from({length:7},(_,i)=>shiftDate(selected,i-6)),rows=dates.map(d=>dailyStats(b,d)),styles=getComputedStyle(document.documentElement),text=styles.getPropertyValue('--text-dim').trim()||'#94a3b8',accent=styles.getPropertyValue('--accent').trim()||'#3b82f6';chart=new Chart(canvas.getContext('2d'),{type:'line',data:{labels:dates.map(shortDate),datasets:[{data:rows.map(x=>metric==='revenue'?x.revenue:metric==='profit'?x.profit:x.qty),borderColor:accent,backgroundColor:'rgba(45,212,191,.08)',pointBackgroundColor:accent,borderWidth:2,tension:.3,fill:true,pointRadius:3}]},options:{animation:false,responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>metric==='qty'?`${c.raw} pcs`:rp(c.raw)}}},scales:{x:{grid:{display:false},ticks:{color:text,font:{size:10}}},y:{beginAtZero:metric!=='profit',ticks:{color:text,font:{size:10},callback:v=>metric==='qty'?v:compactMoney(v)},grid:{color:'rgba(148,163,184,.12)'}}}}});
  }

  async function askSale(title,b,row={},dateOverride){
    const reasonOptions=REASONS.map(([v,l])=>`<option value="${esc(v)}" ${String(row.reason||'')===v?'selected':''}>${esc(l)}</option>`).join('');const date=row.date||dateOverride||today(),qty=Object.prototype.hasOwnProperty.call(row,'qty')?num(row.qty):'',rev=Object.prototype.hasOwnProperty.call(row,'revenue')?num(row.revenue):'';
    const r=await Swal.fire({title,html:`<div class="v26st-modal"><label>Tanggal<input id="st-date" type="date" value="${esc(date)}"></label><label>Jumlah terjual (pcs)<input id="st-qty" type="number" min="0" step="1" inputmode="numeric" value="${qty}"></label><label>Omzet aktual<input id="st-revenue" type="number" min="0" inputmode="numeric" value="${rev}" placeholder="Kosong = qty × harga jual"></label><label>Faktor hari ini<select id="st-reason">${reasonOptions}</select></label><label>Catatan<input id="st-note" value="${esc(row.note||'')}"></label></div>`,showCancelButton:true,confirmButtonText:'Simpan',cancelButtonText:'Batal',focusConfirm:false,preConfirm:()=>{const q=document.getElementById('st-qty').value;if(String(q).trim()===''){Swal.showValidationMessage('Jumlah wajib diisi. Isi 0 kalau memang tidak ada penjualan.');return false;}const qty=Math.max(0,Math.round(Number(q)||0)),raw=document.getElementById('st-revenue').value;return {date:document.getElementById('st-date').value||date,qty,revenue:String(raw).trim()===''?qty*num(b.salePrice):moneyNum(raw),reason:document.getElementById('st-reason').value,note:document.getElementById('st-note').value||''};}});return r.isConfirmed?r.value:null;
  }
  async function askStock(title,b,row={}){const r=await Swal.fire({title,html:`<div class="v26st-modal"><label>Tanggal<input id="st-date" type="date" value="${esc(row.date||today())}"></label><label>Jumlah stok masuk<input id="st-qty" type="number" min="1" step="1" inputmode="numeric" value="${row.qty??''}"></label><label>Biaya restock aktual<input id="st-cost" type="number" min="0" inputmode="numeric" value="${Object.prototype.hasOwnProperty.call(row,'cost')?num(row.cost):''}" placeholder="Kosong = qty × HPP"></label><label>Catatan<input id="st-note" value="${esc(row.note||'Restock')}"></label></div>`,showCancelButton:true,confirmButtonText:'Simpan',cancelButtonText:'Batal',focusConfirm:false,preConfirm:()=>{const qty=Math.max(0,Math.round(Number(document.getElementById('st-qty').value)||0));if(!qty){Swal.showValidationMessage('Jumlah stok harus lebih dari 0.');return false;}const raw=document.getElementById('st-cost').value;return {date:document.getElementById('st-date').value||today(),qty,cost:String(raw).trim()===''?qty*num(b.hpp):moneyNum(raw),note:document.getElementById('st-note').value||''};}});return r.isConfirmed?r.value:null;}
  async function askPayment(title,c,row={}){const r=await Swal.fire({title,html:`<div class="v26st-modal"><label>Tanggal bayar<input id="st-date" type="date" value="${esc(row.date||today())}"></label><label>Nominal dibayar<input id="st-amount" type="number" min="0" inputmode="numeric" value="${Object.prototype.hasOwnProperty.call(row,'amount')?num(row.amount):Math.round(num(c.installment))}"></label><label>Catatan<input id="st-note" value="${esc(row.note||'Cicilan')}"></label></div>`,showCancelButton:true,confirmButtonText:'Simpan',cancelButtonText:'Batal',focusConfirm:false,preConfirm:()=>{const amount=moneyNum(document.getElementById('st-amount').value);if(!amount){Swal.showValidationMessage('Nominal pembayaran harus lebih dari 0.');return false;}return {date:document.getElementById('st-date').value||today(),amount,note:document.getElementById('st-note').value||''};}});return r.isConfirmed?r.value:null;}

  window.switchStableTracking=tab=>{setTracking(s=>s.activeTab=tab==='credit'?'credit':'business');render();};
  window.startStableBusiness=()=>{const id=document.getElementById('v26st-biz-source')?.value;if(id)createBusiness(id);};
  window.startStableCredit=()=>{const id=document.getElementById('v26st-credit-source')?.value;if(id)createCredit(id);};
  window.selectStableBusiness=id=>{setTracking(s=>{s.activeBusinessId=id;s.activeTab='business';s.selectedDates[id]=s.selectedDates[id]||today();s.calendarMonths[id]=s.calendarMonths[id]||s.selectedDates[id].slice(0,7);s.chartMetrics[id]=s.chartMetrics[id]||'qty';});render();};
  window.selectStableCredit=id=>{setTracking(s=>{s.activeCreditId=id;s.activeTab='credit';});render();};
  window.selectStableDate=(id,date)=>{setTracking(s=>{s.activeBusinessId=id;s.selectedDates[id]=date;s.calendarMonths[id]=date.slice(0,7);});render();};
  window.shiftStableMonth=(id,delta)=>{setTracking(s=>{const cur=s.calendarMonths[id]||today().slice(0,7),next=shiftMonth(cur,Number(delta)||0);s.calendarMonths[id]=next;if(!(s.selectedDates[id]||'').startsWith(next))s.selectedDates[id]=`${next}-01`;});render();};
  window.todayStableDate=id=>{setTracking(s=>{s.selectedDates[id]=today();s.calendarMonths[id]=today().slice(0,7);});render();};
  window.setStableMetric=(id,metric)=>{setTracking(s=>{s.chartMetrics[id]=['qty','revenue','profit'].includes(metric)?metric:'qty';});render();};
  window.setStableBusinessTarget=async id=>{
    const s=trackingState(),b=bizById(s,id);if(!b)return;
    const r=await Swal.fire({title:'Atur target bisnis',html:`<div class="v26st-modal"><label>Target keuntungan<input id="st-profit" type="number" min="0" inputmode="numeric" value="${num(b.targetProfit)}"></label><label>Target penjualan / hari<input id="st-day" type="number" min="1" step="1" value="${num(b.unitsPerDay)||1}"></label></div>`,showCancelButton:true,confirmButtonText:'Simpan',cancelButtonText:'Batal',preConfirm:()=>({profit:moneyNum(document.getElementById('st-profit').value),day:Math.max(1,Math.round(Number(document.getElementById('st-day').value)||1))})});if(!r.isConfirmed)return;
    setTracking(x=>{const z=bizById(x,id);const from=num(z.unitsPerDay);z.targetProfit=r.value.profit;z.unitsPerDay=r.value.day;z.targetAdjustments.push({at:Date.now(),from,to:r.value.day,source:'manual'});addEvent(x,'target_change',{businessId:id,businessName:z.name,targetProfit:z.targetProfit,unitsPerDay:z.unitsPerDay});});
    syncBusinessMilestones(id,[today()],true,true);render();
  };
  window.applyStableAdaptive=(id,target)=>{
    setTracking(s=>{const b=bizById(s,id);if(!b)return;const from=num(b.unitsPerDay);b.unitsPerDay=Math.max(1,Math.round(Number(target)||1));b.targetAdjustments.push({at:Date.now(),from,to:b.unitsPerDay,source:'adaptive'});addEvent(s,'target_change',{businessId:id,businessName:b.name,targetProfit:num(b.targetProfit),unitsPerDay:b.unitsPerDay,from});});
    syncBusinessMilestones(id,[today()],true,true);render();
  };
  window.addStableSale=async(id,date)=>{
    const b=bizById(trackingState(),id);if(!b)return;const v=await askSale('Catat penjualan',b,{},date);if(!v)return;
    setTracking(s=>{const x=bizById(s,id),row={id:uid('sale'),...v,createdAt:Date.now(),updatedAt:Date.now()};x.sales.push(row);s.selectedDates[id]=v.date;s.calendarMonths[id]=v.date.slice(0,7);addEvent(s,'sale_add',{businessId:id,businessName:x.name,row,profit:v.revenue-v.qty*num(x.hpp)});});
    const milestone=syncBusinessMilestones(id,[v.date],true,false);render();showBusinessMilestonePopup(milestone);
  };
  window.editStableSale=async(id,eid)=>{
    const s=trackingState(),b=bizById(s,id),row=b?.sales.find(x=>x.id===eid);if(!row)return;const oldDate=row.date;const v=await askSale('Edit penjualan',b,row,row.date);if(!v)return;
    setTracking(x=>{const biz=bizById(x,id),r=biz.sales.find(z=>z.id===eid);Object.assign(r,v,{updatedAt:Date.now()});x.selectedDates[id]=v.date;x.calendarMonths[id]=v.date.slice(0,7);addEvent(x,'sale_edit',{businessId:id,businessName:biz.name,row:clone(r),profit:v.revenue-v.qty*num(biz.hpp)});});
    const milestone=syncBusinessMilestones(id,[oldDate,v.date],true,false);render();showBusinessMilestonePopup(milestone);
  };
  window.deleteStableSale=async(id,eid)=>{
    const s=trackingState(),b=bizById(s,id),row=b?.sales.find(x=>x.id===eid);if(!row)return;const r=await Swal.fire({title:'Hapus penjualan?',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal'});if(!r.isConfirmed)return;
    setTracking(x=>{const biz=bizById(x,id);biz.sales=biz.sales.filter(z=>z.id!==eid);addEvent(x,'sale_delete',{businessId:id,businessName:biz.name,row:clone(row)});});
    syncBusinessMilestones(id,[row.date],true,true);render();
  };
  window.addStableStock=async id=>{
    const b=bizById(trackingState(),id);if(!b)return;const v=await askStock('Tambah stok',b);if(!v)return;
    setTracking(s=>{const x=bizById(s,id),row={id:uid('stock'),...v,createdAt:Date.now(),updatedAt:Date.now()};x.stockAdds.push(row);addEvent(s,'stock_add',{businessId:id,businessName:x.name,row});});
    syncBusinessMilestones(id,[],true,true);render();
  };
  window.editStableStock=async(id,eid)=>{
    const s=trackingState(),b=bizById(s,id),row=b?.stockAdds.find(x=>x.id===eid);if(!row)return;const v=await askStock('Edit restock',b,row);if(!v)return;
    setTracking(x=>{const biz=bizById(x,id),r=biz.stockAdds.find(z=>z.id===eid);Object.assign(r,v,{updatedAt:Date.now()});addEvent(x,'stock_edit',{businessId:id,businessName:biz.name,row:clone(r)});});
    syncBusinessMilestones(id,[],true,true);render();
  };
  window.deleteStableStock=async(id,eid)=>{
    const s=trackingState(),b=bizById(s,id),row=b?.stockAdds.find(x=>x.id===eid);if(!row)return;const r=await Swal.fire({title:'Hapus restock?',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal'});if(!r.isConfirmed)return;
    setTracking(x=>{const biz=bizById(x,id);biz.stockAdds=biz.stockAdds.filter(z=>z.id!==eid);addEvent(x,'stock_delete',{businessId:id,businessName:biz.name,row:clone(row)});});
    syncBusinessMilestones(id,[],true,true);render();
  };
  window.deleteStableBusiness=async id=>{
    const r=await Swal.fire({title:'Hapus tracking bisnis?',text:'Skenario asli tetap aman.',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal'});if(!r.isConfirmed)return;
    setTracking(s=>{const b=bizById(s,id);s.businesses=s.businesses.filter(x=>x.id!==id);delete s.selectedDates[id];delete s.calendarMonths[id];delete s.chartMetrics[id];s.activeBusinessId=s.businesses[0]?.id||'';if(b)addEvent(s,'business_delete',{businessId:id,businessName:b.name});});render();
  };
  window.addStablePayment=async id=>{
    const c=creditById(trackingState(),id);if(!c)return;const before=creditStats(c);if(before.lunas)return Swal.fire('Cicilan sudah lunas 🎉','Pembayaran baru dikunci. Riwayat tetap bisa diedit atau dihapus.','success');
    const v=await askPayment('Catat pembayaran',c);if(!v)return;
    const amount=moneyNum(v.amount),maxAllowed=Math.max(1,Math.ceil(before.remaining));if(amount>maxAllowed)return Swal.fire('Nominal terlalu besar',`Sisa cicilan hanya ${rp(before.remaining)}. Maksimum pembayaran terakhir ${rp(maxAllowed)}.`,'warning');
    setTracking(s=>{const x=creditById(s,id),row={id:uid('pay'),...v,amount,createdAt:Date.now(),updatedAt:Date.now()};x.payments.push(row);addEvent(s,'payment_add',{creditId:id,creditName:x.name,row});});
    const milestone=syncCreditMilestone(id,true,false);render();showCreditPaidPopup(milestone);
  };
  window.editStablePayment=async(id,eid)=>{
    const s=trackingState(),c=creditById(s,id),row=c?.payments.find(x=>x.id===eid);if(!row)return;const v=await askPayment('Edit pembayaran',c,row);if(!v)return;
    const amount=moneyNum(v.amount),st=creditStats(c),otherPaid=Math.max(0,st.paid-num(row.amount)),maxAllowed=Math.max(1,Math.ceil(st.total-otherPaid));if(amount>maxAllowed)return Swal.fire('Nominal terlalu besar',`Dengan pembayaran lain yang sudah ada, catatan ini maksimal ${rp(maxAllowed)}.`,'warning');
    setTracking(x=>{const cr=creditById(x,id),r=cr.payments.find(z=>z.id===eid);Object.assign(r,v,{amount,updatedAt:Date.now()});addEvent(x,'payment_edit',{creditId:id,creditName:cr.name,row:clone(r)});});
    const milestone=syncCreditMilestone(id,true,false);render();showCreditPaidPopup(milestone);
  };
  window.deleteStablePayment=async(id,eid)=>{
    const s=trackingState(),c=creditById(s,id),row=c?.payments.find(x=>x.id===eid);if(!row)return;const r=await Swal.fire({title:'Hapus pembayaran?',text:'Kalau cicilan jadi belum lunas, input pembayaran akan terbuka kembali otomatis.',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal'});if(!r.isConfirmed)return;
    setTracking(x=>{const cr=creditById(x,id);cr.payments=cr.payments.filter(z=>z.id!==eid);addEvent(x,'payment_delete',{creditId:id,creditName:cr.name,row:clone(row)});});
    syncCreditMilestone(id,true,true);render();
  };
  window.changeStableDue=(id,v)=>{setTracking(s=>{const c=creditById(s,id);if(c)c.dueDay=Math.max(1,Math.min(31,Number(v)||1));});};
  window.deleteStableCredit=async id=>{const r=await Swal.fire({title:'Hapus tracking cicilan?',text:'Simulasi asli tetap aman.',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal'});if(!r.isConfirmed)return;setTracking(s=>{const c=creditById(s,id);s.credits=s.credits.filter(x=>x.id!==id);s.activeCreditId=s.credits[0]?.id||'';if(c)addEvent(s,'credit_delete',{creditId:id,creditName:c.name});});render();};
  window.getStableTrackingData=()=>trackingState();
  window.refreshStableTracking=()=>{if(document.getElementById('v26-stable-tracking')?.open)render();};

  function boot(){seedExistingMilestones();wrapNav();ensureMount();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,100),{once:true});else setTimeout(boot,100);
})();
