(() => {
  'use strict';

  const KEY='agis_finance_v26_decision_lab';
  const DEFAULTS={
    activeTab:'business',
    profile:{salary:0,food:0,fuel:0,otherEssential:0,existingDebt:0,savingTarget:0},
    businessDraft:{
      name:'',capitalAvailable:0,setupCost:0,fixedMonthly:0,initialStock:30,
      material:0,packaging:0,labor:0,operational:0,otherUnit:0,
      salePrice:0,unitsPerDay:10,daysPerMonth:26,targetMargin:30
    },
    creditDraft:{name:'',cashPrice:0,downPayment:0,adminFee:0,interest:0,months:12,method:'flat'},
    businesses:[],credits:[]
  };

  const clone=v=>JSON.parse(JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=v=>{
    if(typeof v==='number')return Math.max(0,Number.isFinite(v)?v:0);
    const raw=String(v??'').trim();
    const normalized=/^\d{1,3}(\.\d{3})+$/.test(raw)?raw.replace(/\./g,''):raw.replace(/[^0-9.-]/g,'');
    return Math.max(0,Number(normalized)||0);
  };
  const rp=v=>typeof fmt==='function'?fmt(Math.round(Number(v)||0)):`Rp ${Math.round(Number(v)||0).toLocaleString('id-ID')}`;
  const moneyValue=v=>Number(v)?Math.round(Number(v)).toLocaleString('id-ID'):'';
  const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;

  function state(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY)||'{}');
      return {
        ...clone(DEFAULTS),...raw,
        profile:{...DEFAULTS.profile,...(raw.profile||{})},
        businessDraft:{...DEFAULTS.businessDraft,...(raw.businessDraft||{})},
        creditDraft:{...DEFAULTS.creditDraft,...(raw.creditDraft||{})},
        businesses:Array.isArray(raw.businesses)?raw.businesses:[],
        credits:Array.isArray(raw.credits)?raw.credits:[]
      };
    }catch{return clone(DEFAULTS)}
  }
  function persist(s){localStorage.setItem(KEY,JSON.stringify(s));}
  function setState(mutator){const s=state();mutator(s);persist(s);return s;}
  function currentMonth(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
  function v25Budget(){
    try{return JSON.parse(localStorage.getItem('agis_finance_v25_planning')||'{}')?.budgets?.[currentMonth()]||{}}
    catch{return {}}
  }
  function freeCash(){
    const appStore=typeof store!=='undefined'?store:null;
    const wallets=Object.values(appStore?.wallets||{}).reduce((sum,v)=>sum+(Number(v)||0),0);
    let floor=0;
    try{floor=Number(JSON.parse(localStorage.getItem('agis_finance_smart_controls_v24_4')||'{}').safeFloor)||0}catch{}
    return Math.max(0,wallets-(Number(appStore?.goal)||0)-floor);
  }

  function calcBusiness(d){
    const hpp=num(d.material)+num(d.packaging)+num(d.labor)+num(d.operational)+num(d.otherUnit);
    const units=Math.round(num(d.unitsPerDay)*num(d.daysPerMonth));
    const revenue=num(d.salePrice)*units;
    const variable=hpp*units;
    const marginUnit=num(d.salePrice)-hpp;
    const gross=marginUnit*units;
    const net=gross-num(d.fixedMonthly);
    const marginPct=num(d.salePrice)>0?(marginUnit/num(d.salePrice))*100:0;
    const capitalNeeded=num(d.setupCost)+num(d.fixedMonthly)+(hpp*num(d.initialStock));
    const capitalGap=num(d.capitalAvailable)-capitalNeeded;
    const bepUnits=marginUnit>0?Math.ceil(num(d.fixedMonthly)/marginUnit):0;
    const bepDays=num(d.unitsPerDay)>0?bepUnits/num(d.unitsPerDay):0;
    const payback=net>0?capitalNeeded/net:0;
    const target=Math.min(90,num(d.targetMargin));
    const suggestedPrice=target<100&&hpp>0?hpp/(1-target/100):0;
    let tone='warn',title='Lengkapi angka utama',reason='Isi HPP, harga jual, dan target penjualan agar analisis bisa menilai usaha.';
    if(hpp>0&&num(d.salePrice)>0&&units>0){
      if(marginUnit<=0){tone='bad';title='Belum layak dijual';reason='Harga jual lebih rendah atau sama dengan HPP per unit.';}
      else if(net<=0){tone='bad';title='Usaha masih merugi';reason='Margin penjualan belum cukup untuk menutup biaya tetap bulanan.';}
      else if(capitalGap<0){tone='warn';title='Potensial, modal belum cukup';reason=`Masih kurang ${rp(Math.abs(capitalGap))} untuk persiapan, stok awal, dan biaya tetap.`;}
      else if(marginPct+0.01<target){tone='warn';title='Layak dengan margin tipis';reason=`Laba positif, tetapi margin ${marginPct.toFixed(1)}% masih di bawah target ${target}%.`;}
      else {tone='good';title='Skenario usaha layak diuji';reason='Modal mencukupi, laba bulanan positif, dan target margin tercapai. Tetap mulai dari uji pasar kecil.';}
    }
    return {hpp,units,revenue,variable,marginUnit,gross,net,marginPct,capitalNeeded,capitalGap,bepUnits,bepDays,payback,suggestedPrice,tone,title,reason};
  }

  function monthlyInstallment(d){
    const principal=Math.max(0,num(d.cashPrice)-num(d.downPayment));
    const months=Math.max(1,Math.round(num(d.months)||1));
    const annual=num(d.interest)/100;
    if(d.method==='annuity'){
      const r=annual/12;
      return r>0?principal*(r*Math.pow(1+r,months))/(Math.pow(1+r,months)-1):principal/months;
    }
    return (principal/months)+(principal*annual/12);
  }
  function calcCredit(d,p){
    const principal=Math.max(0,num(d.cashPrice)-num(d.downPayment));
    const months=Math.max(1,Math.round(num(d.months)||1));
    const installment=monthlyInstallment(d);
    const totalCredit=num(d.downPayment)+num(d.adminFee)+(installment*months);
    const financeCost=Math.max(0,totalCredit-num(d.cashPrice));
    const essentials=num(p.food)+num(p.fuel)+num(p.otherEssential)+num(p.savingTarget);
    const totalDebt=num(p.existingDebt)+installment;
    const remaining=num(p.salary)-essentials-totalDebt;
    const newRatio=num(p.salary)>0?installment/num(p.salary)*100:0;
    const dsr=num(p.salary)>0?totalDebt/num(p.salary)*100:0;
    const cash=freeCash();
    const buffer=num(p.salary)*.15;
    const maxInstallment=Math.max(0,Math.min(
      (num(p.salary)*.25)-num(p.existingDebt),
      num(p.salary)-essentials-num(p.existingDebt)-buffer
    ));
    let tone='warn',title='Lengkapi data kredit',reason='Isi harga barang, gaji, bunga, dan tenor untuk melihat kemampuan cicilan.';
    if(num(d.cashPrice)>0&&num(p.salary)>0){
      if(num(d.downPayment)>cash){tone='bad';title='DP mengganggu uang aman';reason=`DP melebihi uang bebas saat ini sebesar ${rp(num(d.downPayment)-cash)}.`;}
      else if(remaining<0){tone='bad';title='Cicilan tidak terjangkau';reason=`Kebutuhan bulanan akan defisit ${rp(Math.abs(remaining))}.`;}
      else if(dsr>35){tone='bad';title='Rasio utang terlalu tinggi';reason=`Total cicilan memakai ${dsr.toFixed(1)}% gaji; batas konservatif aplikasi adalah 35%.`;}
      else if(installment<=maxInstallment&&remaining>=buffer){tone='good';title='Cicilan relatif aman';reason='Cicilan berada dalam batas konservatif dan masih menyisakan buffer minimal 15% dari gaji.';}
      else {tone='warn';title='Bisa, tetapi ruangnya sempit';reason='Cicilan belum defisit, namun melebihi batas nyaman atau menyisakan buffer kurang dari 15% gaji.';}
    }
    return {principal,months,installment,totalCredit,financeCost,essentials,totalDebt,remaining,newRatio,dsr,cash,maxInstallment,tone,title,reason};
  }

  function input(name,label,value,type='money',extra=''){
    const val=type==='money'?moneyValue(value):esc(value);
    return `<div class="v26-field"><label for="v26-${name}">${label}</label><input id="v26-${name}" data-v26-field="${name}" data-v26-type="${type}" value="${val}" ${type==='money'?'inputmode="numeric"':'inputmode="decimal"'} ${extra}></div>`;
  }

  function businessPanel(d){return `
    <div id="v26-business" class="v26-panel active" data-v26-panel="business">
      <div class="v26-section">
        <div class="v26-section-title"><i data-lucide="store"></i> Rencana usaha <span>Modal & persiapan</span></div>
        <div class="v26-grid v26-wide">
          <div class="v26-field full"><label for="v26-name">Nama/ide bisnis</label><input id="v26-name" data-v26-field="name" data-v26-type="text" value="${esc(d.name)}" placeholder="Contoh: es kopi literan"></div>
          ${input('capitalAvailable','Modal tersedia',d.capitalAvailable)}
          ${input('setupCost','Alat & biaya persiapan',d.setupCost)}
          ${input('fixedMonthly','Biaya tetap / bulan',d.fixedMonthly)}
          ${input('initialStock','Stok awal (unit)',d.initialStock,'number','min="0" step="1"')}
        </div>
        <div class="v26-helper">Modal minimum dihitung dari alat/persiapan + biaya tetap 1 bulan + HPP stok awal.</div>
      </div>
      <div class="v26-section">
        <div class="v26-section-title"><i data-lucide="package-open"></i> HPP per unit <span>Rinci biar akurat</span></div>
        <div class="v26-grid v26-wide">
          ${input('material','Bahan baku',d.material)}
          ${input('packaging','Kemasan',d.packaging)}
          ${input('labor','Tenaga kerja',d.labor)}
          ${input('operational','Gas/listrik/ongkir',d.operational)}
          ${input('otherUnit','Biaya unit lainnya',d.otherUnit)}
        </div>
      </div>
      <div class="v26-section">
        <div class="v26-section-title"><i data-lucide="badge-dollar-sign"></i> Target penjualan <span>Omzet & laba</span></div>
        <div class="v26-grid v26-wide">
          ${input('salePrice','Harga jual / unit',d.salePrice)}
          ${input('unitsPerDay','Target unit / hari',d.unitsPerDay,'number','min="0" step="1"')}
          ${input('daysPerMonth','Hari jual / bulan',d.daysPerMonth,'number','min="1" max="31" step="1"')}
          ${input('targetMargin','Target margin (%)',d.targetMargin,'number','min="0" max="90" step="1"')}
        </div>
      </div>
      <div id="v26-business-result" class="v26-result"></div>
      <div class="v26-actions"><button class="btn-primary" type="button" onclick="saveBusinessV26()"><i data-lucide="bookmark-plus"></i> Simpan skenario</button><button class="btn-small" type="button" onclick="resetBusinessV26()" aria-label="Kosongkan simulasi" title="Kosongkan"><i data-lucide="rotate-ccw"></i></button></div>
      <div class="v26-saved"><div class="v26-saved-head">Skenario bisnis tersimpan</div><div id="v26-business-saved" class="v26-saved-list"></div></div>
    </div>`;}

  function creditPanel(d){return `
    <div id="v26-credit" class="v26-panel" data-v26-panel="credit">
      <div class="v26-section">
        <div class="v26-section-title"><i data-lucide="shopping-bag"></i> Barang & pembiayaan <span>Hitung biaya nyata</span></div>
        <div class="v26-grid v26-wide">
          <div class="v26-field full"><label for="v26-credit-name">Nama barang</label><input id="v26-credit-name" data-v26-credit="name" data-v26-type="text" value="${esc(d.name)}" placeholder="Contoh: HP / laptop / motor"></div>
          ${creditInput('cashPrice','Harga tunai',d.cashPrice)}
          ${creditInput('downPayment','Uang muka (DP)',d.downPayment)}
          ${creditInput('adminFee','Admin/asuransi awal',d.adminFee)}
          ${creditInput('interest','Bunga per tahun (%)',d.interest,'number','min="0" step="0.01"')}
          ${creditInput('months','Tenor (bulan)',d.months,'number','min="1" max="120" step="1"')}
          <div class="v26-field"><label for="v26-credit-method">Metode bunga</label><select id="v26-credit-method" data-v26-credit="method" data-v26-type="text"><option value="flat" ${d.method!=='annuity'?'selected':''}>Flat</option><option value="annuity" ${d.method==='annuity'?'selected':''}>Efektif / anuitas</option></select></div>
        </div>
        <div class="v26-helper">Bunga flat dihitung dari pokok awal. Anuitas memakai bunga efektif bulanan dengan cicilan tetap.</div>
      </div>
      <div id="v26-credit-profile-strip" class="v26-helper"></div>
      <div id="v26-credit-result" class="v26-result"></div>
      <div class="v26-actions"><button class="btn-primary" type="button" onclick="saveCreditV26()"><i data-lucide="bookmark-plus"></i> Simpan simulasi</button><button class="btn-small" type="button" onclick="resetCreditV26()" aria-label="Kosongkan simulasi" title="Kosongkan"><i data-lucide="rotate-ccw"></i></button></div>
      <div class="v26-saved"><div class="v26-saved-head">Simulasi kredit tersimpan</div><div id="v26-credit-saved" class="v26-saved-list"></div></div>
    </div>`;}
  function creditInput(name,label,value,type='money',extra=''){
    const val=type==='money'?moneyValue(value):esc(value);
    return `<div class="v26-field"><label for="v26-credit-${name}">${label}</label><input id="v26-credit-${name}" data-v26-credit="${name}" data-v26-type="${type}" value="${val}" ${type==='money'?'inputmode="numeric"':'inputmode="decimal"'} ${extra}></div>`;
  }

  function injectLab(){
    const host=document.getElementById('v2531-planning-host');
    if(!host)return false;
    const existing=document.getElementById('v26-decision-lab');
    if(existing){
      // What-if anchors itself before this card, never before the year report.
      // Only move the existing node when needed: preserve input/focus/drafts.
      const year=host.querySelector('.v25-year-card');
      if(year&&existing.nextElementSibling!==year)host.insertBefore(existing,year);
      return false;
    }
    const s=state(),card=document.createElement('section');
    card.className='card v26-lab';card.id='v26-decision-lab';
    card.innerHTML=`<div class="v26-head"><div><span class="v26-eyebrow">DECISION LAB</span><h3>Uji keputusan sebelum keluar uang</h3><p>Hitung kelayakan usaha dan kemampuan kredit dari kondisi keuanganmu.</p></div><div class="v26-head-icon"><i data-lucide="chart-no-axes-combined"></i></div></div><div class="v26-tabs" role="tablist"><button class="v26-tab" data-v26-tab="business" type="button"><i data-lucide="briefcase-business"></i> Analisis Bisnis</button><button class="v26-tab" data-v26-tab="credit" type="button"><i data-lucide="credit-card"></i> Simulasi Kredit</button></div>${businessPanel(s.businessDraft)}${creditPanel(s.creditDraft)}`;
    const year=host.querySelector('.v25-year-card');
    if(year)host.insertBefore(card,year);else host.appendChild(card);
    bindLab();switchTab(s.activeTab||'business',false);renderResults();
    if(window.lucide?.createIcons)lucide.createIcons();
    return true;
  }

  function profileInput(name,label,value){return `<div><label for="v26-profile-${name}">${label}</label><input id="v26-profile-${name}" data-v26-profile="${name}" inputmode="numeric" value="${moneyValue(value)}" placeholder="0"></div>`;}
  function injectProfile(){
    const page=document.getElementById('settings');
    if(!page||document.getElementById('v26-profile-card'))return false;
    const p=state().profile,card=document.createElement('section');
    card.className='card v26-profile-card';card.id='v26-profile-card';
    card.innerHTML=`<div class="v26-profile-head"><div><div class="section-title"><i data-lucide="wallet-cards"></i> Profil Perhitungan</div><p>Dipakai otomatis oleh Simulasi Kredit supaya makan, bensin, kebutuhan wajib, dan tabungan tidak terlupakan.</p></div><div class="v26-profile-icon"><i data-lucide="scan-line"></i></div></div><div class="v26-profile-grid">${profileInput('salary','Gaji / pendapatan bulanan',p.salary)}${profileInput('food','Budget makan / bulan',p.food)}${profileInput('fuel','Bensin & transport / bulan',p.fuel)}${profileInput('otherEssential','Kebutuhan wajib lain',p.otherEssential)}${profileInput('existingDebt','Cicilan aktif lain',p.existingDebt)}${profileInput('savingTarget','Target tabungan / bulan',p.savingTarget)}</div><div class="v26-profile-actions"><button class="btn-primary" type="button" onclick="saveV26Profile()">Simpan Profil</button><button class="btn-small" type="button" onclick="syncV26ProfileFromBudget()">Ambil Budget Bulan Ini</button></div><div id="v26-profile-summary" class="v26-profile-summary"></div>`;
    const smart=document.getElementById('v244-controls-card');
    if(smart)page.insertBefore(card,smart);else page.insertBefore(card,page.children[1]||null);
    card.querySelectorAll('[data-v26-profile]').forEach(el=>el.addEventListener('input',()=>formatField(el)));
    renderProfileSummary();if(window.lucide?.createIcons)lucide.createIcons();return true;
  }

  function formatField(el){
    if(el.dataset.v26Type==='text')return;
    const value=num(el.value);
    if((el.dataset.v26Type||'money')==='money')el.value=value?Math.round(value).toLocaleString('id-ID'):'';
  }
  function bindLab(){
    const lab=document.getElementById('v26-decision-lab');if(!lab||lab.dataset.bound)return;lab.dataset.bound='1';
    lab.addEventListener('click',e=>{const tab=e.target.closest('[data-v26-tab]');if(tab)switchTab(tab.dataset.v26Tab);});
    lab.addEventListener('input',e=>{
      const el=e.target,field=el.dataset.v26Field,credit=el.dataset.v26Credit;
      if(!field&&!credit)return;
      if(el.dataset.v26Type==='money')formatField(el);
      setState(s=>{const target=field?s.businessDraft:s.creditDraft;const key=field||credit;target[key]=el.dataset.v26Type==='text'?el.value:num(el.value);});
      renderResults();
    });
    lab.addEventListener('change',e=>{
      const el=e.target,field=el.dataset.v26Field,credit=el.dataset.v26Credit;if(!field&&!credit)return;
      setState(s=>{const target=field?s.businessDraft:s.creditDraft;const key=field||credit;target[key]=el.dataset.v26Type==='text'?el.value:num(el.value);});renderResults();
    });
  }
  function switchTab(name,save=true){
    const active=name==='credit'?'credit':'business';
    document.querySelectorAll('[data-v26-tab]').forEach(x=>{x.classList.toggle('active',x.dataset.v26Tab===active);x.setAttribute('aria-selected',String(x.dataset.v26Tab===active));});
    document.querySelectorAll('[data-v26-panel]').forEach(x=>x.classList.toggle('active',x.dataset.v26Panel===active));
    if(save)setState(s=>s.activeTab=active);
  }

  function renderBusiness(){
    const s=state(),r=calcBusiness(s.businessDraft),el=document.getElementById('v26-business-result');if(!el)return;
    const gapTone=r.capitalGap>=0?'good':'bad';
    el.innerHTML=`<div class="v26-verdict ${r.tone}"><span class="v26-verdict-dot"></span><div><b>${esc(r.title)}</b><p>${esc(r.reason)}</p></div></div><div class="v26-result-grid"><div class="v26-metric"><small>HPP / unit</small><b class="v26-money">${rp(r.hpp)}</b></div><div class="v26-metric"><small>Omzet / bulan</small><b class="v26-money">${rp(r.revenue)}</b></div><div class="v26-metric ${r.net>0?'good':'bad'}"><small>Laba bersih / bulan</small><b class="v26-money">${rp(r.net)}</b></div><div class="v26-metric ${gapTone}"><small>Selisih modal</small><b class="v26-money">${r.capitalGap>=0?'+ ': '- '}${rp(Math.abs(r.capitalGap))}</b></div><div class="v26-metric"><small>Modal minimum</small><b class="v26-money">${rp(r.capitalNeeded)}</b></div><div class="v26-metric"><small>Margin kotor</small><b>${r.marginPct.toFixed(1)}%</b></div><div class="v26-metric"><small>BEP operasional</small><b>${r.bepUnits?r.bepUnits+' unit':'—'}</b></div><div class="v26-metric"><small>Balik modal</small><b>${r.payback?`${r.payback.toFixed(1)} bulan`:'—'}</b></div></div><div class="v26-breakdown"><div><span>Harga rekomendasi sesuai target margin</span><b class="v26-money">${rp(r.suggestedPrice)}</b></div><div><span>Perkiraan BEP tercapai</span><b>${r.bepDays?`${r.bepDays.toFixed(1)} hari jual`:'Belum tercapai'}</b></div><div><span>Laba kotor sebelum biaya tetap</span><b class="v26-money">${rp(r.gross)}</b></div></div>`;
  }
  function renderCredit(){
    const s=state(),r=calcCredit(s.creditDraft,s.profile),el=document.getElementById('v26-credit-result');if(!el)return;
    const pct=Math.min(100,r.dsr/35*100),progressTone=r.dsr>35?'bad':r.dsr>25?'warn':'';
    const strip=document.getElementById('v26-credit-profile-strip');if(strip)strip.innerHTML=`Memakai profil: gaji <b class="v26-money">${rp(s.profile.salary)}</b> · makan <b class="v26-money">${rp(s.profile.food)}</b> · bensin <b class="v26-money">${rp(s.profile.fuel)}</b>. <button class="mini-action primary" type="button" onclick="nav('settings')">Ubah di Settings</button>`;
    el.innerHTML=`<div class="v26-verdict ${r.tone}"><span class="v26-verdict-dot"></span><div><b>${esc(r.title)}</b><p>${esc(r.reason)}</p></div></div><div class="v26-result-grid"><div class="v26-metric"><small>Cicilan / bulan</small><b class="v26-money">${rp(r.installment)}</b></div><div class="v26-metric ${r.remaining>=0?'good':'bad'}"><small>Sisa setelah semua</small><b class="v26-money">${rp(r.remaining)}</b></div><div class="v26-metric"><small>Total dibayar</small><b class="v26-money">${rp(r.totalCredit)}</b></div><div class="v26-metric"><small>Biaya kredit</small><b class="v26-money">${rp(r.financeCost)}</b></div><div class="v26-metric"><small>Pokok dibiayai</small><b class="v26-money">${rp(r.principal)}</b></div><div class="v26-metric"><small>Rasio cicilan baru</small><b>${r.newRatio.toFixed(1)}%</b></div><div class="v26-metric ${r.dsr>35?'bad':r.dsr>25?'warn':'good'}"><small>Total rasio utang</small><b>${r.dsr.toFixed(1)}%</b></div><div class="v26-metric"><small>Batas cicilan nyaman</small><b class="v26-money">${rp(r.maxInstallment)}</b></div></div><div class="v26-progress ${progressTone}"><span style="width:${pct}%"></span></div><div class="v26-breakdown"><div><span>Gaji bulanan</span><b class="v26-money">${rp(s.profile.salary)}</b></div><div><span>Makan + bensin + wajib + tabungan</span><b class="v26-money">${rp(r.essentials)}</b></div><div><span>Cicilan lama + cicilan baru</span><b class="v26-money">${rp(r.totalDebt)}</b></div><div><span>Uang bebas untuk DP saat ini</span><b class="v26-money">${rp(r.cash)}</b></div></div>`;
  }
  function renderSaved(){
    const s=state(),b=document.getElementById('v26-business-saved'),c=document.getElementById('v26-credit-saved');
    if(b)b.innerHTML=s.businesses.length?s.businesses.map(x=>`<div class="v26-saved-item"><button type="button" onclick="loadBusinessV26('${esc(x.id)}')"><b>${esc(x.data.name||'Bisnis tanpa nama')}</b><small>${rp(x.summary.net)} laba/bln · modal ${rp(x.summary.capitalNeeded)}</small></button><button class="v26-delete" type="button" onclick="deleteBusinessV26('${esc(x.id)}')" aria-label="Hapus"><i data-lucide="trash-2"></i></button></div>`).join(''):'<div class="v26-empty">Belum ada skenario bisnis tersimpan.</div>';
    if(c)c.innerHTML=s.credits.length?s.credits.map(x=>`<div class="v26-saved-item"><button type="button" onclick="loadCreditV26('${esc(x.id)}')"><b>${esc(x.data.name||'Kredit tanpa nama')}</b><small>${rp(x.summary.installment)}/bln · DSR ${Number(x.summary.dsr||0).toFixed(1)}%</small></button><button class="v26-delete" type="button" onclick="deleteCreditV26('${esc(x.id)}')" aria-label="Hapus"><i data-lucide="trash-2"></i></button></div>`).join(''):'<div class="v26-empty">Belum ada simulasi kredit tersimpan.</div>';
    if(window.lucide?.createIcons)lucide.createIcons();
  }
  function renderProfileSummary(){
    const p=state().profile,el=document.getElementById('v26-profile-summary');if(!el)return;
    const essentials=num(p.food)+num(p.fuel)+num(p.otherEssential)+num(p.existingDebt)+num(p.savingTarget);
    el.innerHTML=`Total komitmen dasar <b class="v26-money">${rp(essentials)}</b> · ruang sebelum cicilan baru <b class="v26-money">${rp(num(p.salary)-essentials)}</b>.`;
  }
  function renderResults(){renderBusiness();renderCredit();renderSaved();renderProfileSummary();}
  function refillDraft(kind){
    const s=state(),data=kind==='business'?s.businessDraft:s.creditDraft;
    const attr=kind==='business'?'data-v26-field':'data-v26-credit';
    document.querySelectorAll(`[${attr}]`).forEach(el=>{const key=el.getAttribute(attr),v=data[key];el.value=el.dataset.v26Type==='money'?moneyValue(v):v;});
    renderResults();
  }

  window.saveV26Profile=()=>{
    const values={};document.querySelectorAll('[data-v26-profile]').forEach(el=>values[el.dataset.v26Profile]=num(el.value));
    setState(s=>s.profile={...s.profile,...values});renderResults();
    if(typeof auditEvent==='function')auditEvent('Profil perhitungan diperbarui','Gaji dan kebutuhan wajib untuk simulasi kredit');
    Swal.fire({title:'Profil disimpan',text:'Simulasi Kredit langsung memakai angka terbaru.',icon:'success',timer:1300,showConfirmButton:false});
  };
  window.syncV26ProfileFromBudget=()=>{
    const b=v25Budget();
    if(!Object.keys(b).length)return Swal.fire('Budget belum ada','Atur Budget Planning bulan ini terlebih dahulu.','info');
    const p=setState(s=>{s.profile.food=num(b['Makan & Minum']);s.profile.fuel=num(b['Transportasi']);s.profile.otherEssential=num(b['Tagihan']);}).profile;
    ['food','fuel','otherEssential'].forEach(k=>{const el=document.getElementById(`v26-profile-${k}`);if(el)el.value=moneyValue(p[k]);});renderResults();
    Swal.fire({title:'Budget dimuat',text:'Makan, transportasi, dan tagihan wajib sudah diperbarui.',icon:'success',timer:1400,showConfirmButton:false});
  };
  window.saveBusinessV26=()=>{
    const s=state(),r=calcBusiness(s.businessDraft);
    if(!s.businessDraft.name.trim()||!r.hpp||!num(s.businessDraft.salePrice))return Swal.fire('Belum lengkap','Isi nama bisnis, komponen HPP, dan harga jual.','warning');
    setState(x=>x.businesses=[{id:uid('biz'),savedAt:Date.now(),data:clone(x.businessDraft),summary:{net:r.net,capitalNeeded:r.capitalNeeded,marginPct:r.marginPct}},...x.businesses].slice(0,25));renderSaved();
    Swal.fire({title:'Skenario bisnis disimpan',icon:'success',timer:1200,showConfirmButton:false});
  };
  window.saveCreditV26=()=>{
    const s=state(),r=calcCredit(s.creditDraft,s.profile);
    if(!s.creditDraft.name.trim()||!num(s.creditDraft.cashPrice)||!num(s.profile.salary))return Swal.fire('Belum lengkap','Isi nama barang, harga tunai, dan gaji di Profil Perhitungan.','warning');
    setState(x=>x.credits=[{id:uid('credit'),savedAt:Date.now(),data:clone(x.creditDraft),summary:{installment:r.installment,dsr:r.dsr,totalCredit:r.totalCredit}},...x.credits].slice(0,25));renderSaved();
    Swal.fire({title:'Simulasi kredit disimpan',icon:'success',timer:1200,showConfirmButton:false});
  };
  window.loadBusinessV26=id=>{const item=state().businesses.find(x=>x.id===id);if(!item)return;setState(s=>{s.businessDraft={...DEFAULTS.businessDraft,...item.data};s.activeTab='business';});refillDraft('business');switchTab('business');document.getElementById('v26-decision-lab')?.scrollIntoView({behavior:'smooth',block:'start'});};
  window.loadCreditV26=id=>{const item=state().credits.find(x=>x.id===id);if(!item)return;setState(s=>{s.creditDraft={...DEFAULTS.creditDraft,...item.data};s.activeTab='credit';});refillDraft('credit');switchTab('credit');document.getElementById('v26-decision-lab')?.scrollIntoView({behavior:'smooth',block:'start'});};
  window.deleteBusinessV26=async id=>{const r=await Swal.fire({title:'Hapus skenario?',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal'});if(!r.isConfirmed)return;setState(s=>s.businesses=s.businesses.filter(x=>x.id!==id));renderSaved();};
  window.deleteCreditV26=async id=>{const r=await Swal.fire({title:'Hapus simulasi?',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal'});if(!r.isConfirmed)return;setState(s=>s.credits=s.credits.filter(x=>x.id!==id));renderSaved();};
  window.resetBusinessV26=()=>{setState(s=>s.businessDraft=clone(DEFAULTS.businessDraft));refillDraft('business');};
  window.resetCreditV26=()=>{setState(s=>s.creditDraft=clone(DEFAULTS.creditDraft));refillDraft('credit');};
  window.getV26DecisionData=()=>state();

  function wrapFactoryReset(){
    const old=window.factoryResetV245;if(typeof old!=='function'||old.__v26)return;
    const fn=async function(){const r=await old.apply(this,arguments);if(r===true)localStorage.removeItem(KEY);return r;};fn.__v26=true;window.factoryResetV245=fn;
  }
  function init(){
    const done=()=>{injectLab();injectProfile();};done();setTimeout(done,280);setTimeout(done,850);wrapFactoryReset();
    // Only direct card additions/removals affect ordering. Result/input updates
    // inside the lab do not need another layout pass.
    const host=document.getElementById('v2531-planning-host');if(host)new MutationObserver(()=>injectLab()).observe(host,{childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,220),{once:true});else setTimeout(init,220);
})();
