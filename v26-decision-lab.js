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
    businesses:[],credits:[],editingBusinessId:'',editingCreditId:''
  };

  const BLANK_BUSINESS={name:'',capitalAvailable:'',setupCost:'',fixedMonthly:'',initialStock:'',material:'',packaging:'',labor:'',operational:'',otherUnit:'',salePrice:'',unitsPerDay:'',daysPerMonth:'',targetMargin:''};
  const BLANK_CREDIT={name:'',cashPrice:'',downPayment:'',adminFee:'',interest:'',months:'',method:'flat'};
  const clone=v=>JSON.parse(JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=v=>{
    if(typeof v==='number')return Math.max(0,Number.isFinite(v)?v:0);
    const raw=String(v??'').trim();
    const normalized=/^\d{1,3}(\.\d{3})+$/.test(raw)?raw.replace(/\./g,''):raw.replace(/[^0-9.-]/g,'');
    return Math.max(0,Number(normalized)||0);
  };
  const moneyNum=v=>{
    if(typeof v==='number')return Math.max(0,Number.isFinite(v)?v:0);
    const digits=String(v??'').replace(/\D/g,'');
    return digits?Number(digits):0;
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

  const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,Number(v)||0));
  function businessCoach(d,r){
    const complete=r.hpp>0&&num(d.salePrice)>0&&num(d.unitsPerDay)>0&&num(d.daysPerMonth)>0;
    if(!complete)return {tone:'idle',score:0,label:'BUTUH DATA',title:'Lengkapi angka utama dulu',summary:'Decision Coach akan membaca margin, modal, laba, dan BEP secara otomatis saat data utama sudah terisi.',actions:['Isi komponen HPP per unit.','Masukkan harga jual dan target unit per hari.','Lengkapi modal tersedia agar risiko modal bisa dinilai.']};
    const target=Math.min(90,num(d.targetMargin));
    let score=45;
    score+=r.marginUnit>0?15:-35;
    score+=r.net>0?20:-25;
    score+=r.capitalGap>=0?15:-10;
    if(r.marginPct>=target)score+=10;
    if(r.payback>0&&r.payback<=6)score+=10;else if(r.payback>0&&r.payback<=12)score+=5;
    score=Math.round(clamp(score));
    const actions=[];
    if(r.marginUnit<=0)actions.push(`Harga jual harus di atas HPP ${rp(r.hpp)}. Naikkan harga atau turunkan biaya per unit.`);
    else if(r.marginPct+0.01<target)actions.push(`Untuk mendekati margin ${target}%, harga jual referensi sekitar ${rp(r.suggestedPrice)}.`);
    if(r.capitalGap<0)actions.push(`Modal masih kurang ${rp(Math.abs(r.capitalGap))}. Kurangi biaya awal/stok atau tambah modal tanpa mengorbankan dana aman.`);
    if(r.net<=0&&r.marginUnit>0){const daily=Math.max(1,Math.ceil(r.bepUnits/Math.max(1,num(d.daysPerMonth))));actions.push(`Minimal sekitar ${daily} unit/hari dibutuhkan untuk menutup biaya tetap pada struktur harga sekarang.`);}
    if(r.net>0&&r.payback>12)actions.push(`Balik modal sekitar ${r.payback.toFixed(1)} bulan. Uji cara menaikkan volume atau margin sebelum memperbesar modal.`);
    if(r.net>0&&r.capitalGap>=0&&r.marginPct>=target){const pilot=Math.max(3,Math.min(20,Math.round(num(d.unitsPerDay)||5)));actions.push(`Mulai pilot 7 hari sekitar ${pilot} unit/hari, lalu bandingkan penjualan aktual dengan target sebelum scale up.`);}
    if(actions.length<2&&r.marginUnit>0)actions.push(`Jaga HPP maksimal ${rp(r.hpp)} per unit agar margin tidak turun saat harga bahan berubah.`);
    const tone=score>=78?'good':score>=52?'warn':'bad';
    const label=score>=78?'GO TERBATAS':score>=52?'REVISI DULU':'JANGAN DIPAKSA';
    const title=score>=78?'Layak diuji dengan skala kecil':score>=52?'Ada potensi, tapi masih ada titik lemah':'Risikonya masih terlalu tinggi';
    const summary=score>=78?`Skenario menghasilkan laba ${rp(r.net)}/bulan dengan margin ${r.marginPct.toFixed(1)}%. Validasi dulu lewat penjualan nyata.`:score>=52?`Skenario belum ideal. Fokus perbaiki faktor yang paling menekan margin, modal, atau arus kas.`:`Jangan keluarkan modal dulu sebelum struktur harga dan biaya menghasilkan laba yang sehat.`;
    return {tone,score,label,title,summary,actions:actions.slice(0,3)};
  }
  function suggestedDpForComfort(d,targetInstallment){
    if(targetInstallment<=0||num(d.cashPrice)<=0)return 0;
    const price=num(d.cashPrice);let lo=clamp(num(d.downPayment),0,price),hi=price;
    if(monthlyInstallment({...d,downPayment:lo})<=targetInstallment)return lo;
    for(let i=0;i<32;i++){const mid=(lo+hi)/2;if(monthlyInstallment({...d,downPayment:mid})>targetInstallment)lo=mid;else hi=mid;}
    return Math.min(price,Math.ceil(hi/10000)*10000);
  }
  function creditCoach(d,p,r){
    const complete=num(d.cashPrice)>0&&num(p.salary)>0&&num(d.months)>0;
    if(!complete)return {tone:'idle',score:0,label:'BUTUH DATA',title:'Lengkapi profil dan data kredit',summary:'Decision Coach akan membandingkan cicilan dengan pendapatan, kebutuhan wajib, utang aktif, serta dana bebas untuk DP.',actions:['Isi harga barang dan tenor.','Pastikan gaji/pendapatan bulanan sudah ada di Profil Perhitungan.','Masukkan DP dan bunga untuk melihat total biaya kredit.']};
    const buffer=num(p.salary)*.15, premium=num(d.cashPrice)>0?r.financeCost/num(d.cashPrice)*100:0;
    let score=100;
    if(num(d.downPayment)>r.cash)score-=40;
    if(r.remaining<0)score-=50;else if(r.remaining<buffer)score-=18;
    if(r.dsr>35)score-=40;else if(r.dsr>25)score-=15;
    if(r.installment>r.maxInstallment)score-=15;
    if(premium>25)score-=12;else if(premium>15)score-=6;
    score=Math.round(clamp(score));
    const actions=[];
    if(num(d.downPayment)>r.cash)actions.push(`DP melebihi uang bebas sekitar ${rp(num(d.downPayment)-r.cash)}. Jangan ambil DP dari dana yang sudah dialokasikan untuk kebutuhan/target.`);
    if(r.dsr>35)actions.push(`Total rasio utang ${r.dsr.toFixed(1)}% terlalu tinggi. Turunkan cicilan sampai mendekati atau di bawah 35% pendapatan.`);
    if(r.installment>r.maxInstallment&&r.maxInstallment>0){const dp=suggestedDpForComfort(d,r.maxInstallment);actions.push(dp>num(d.downPayment)&&dp<num(d.cashPrice)?`Agar cicilan mendekati batas nyaman ${rp(r.maxInstallment)}/bulan, DP kira-kira perlu ${rp(dp)} atau pilih tenor/harga yang lebih ringan.`:`Cari harga/tenor yang menekan cicilan ke sekitar ${rp(r.maxInstallment)}/bulan.`);}
    if(r.remaining>=0&&r.remaining<buffer)actions.push(`Sisa bulanan ${rp(r.remaining)} masih di bawah buffer 15% gaji (${rp(buffer)}). Sisakan ruang untuk kejadian tak terduga.`);
    if(premium>15)actions.push(`Biaya kredit menambah sekitar ${premium.toFixed(1)}% dari harga tunai. Bandingkan lagi dengan menabung lalu beli tunai.`);
    if(actions.length===0)actions.push(`Cicilan berada dalam batas konservatif. Tetap pertahankan buffer dan jangan menambah cicilan baru bersamaan.`);
    const tone=score>=78?'good':score>=52?'warn':'bad';
    const label=score>=78?'CUKUP AMAN':score>=52?'PERTIMBANGKAN':'TUNDA DULU';
    const title=score>=78?'Kredit masih masuk batas nyaman':score>=52?'Masih bisa, tapi ruang keuangan sempit':'Kredit ini terlalu menekan arus kas';
    const summary=score>=78?`Cicilan ${rp(r.installment)}/bulan dengan DSR ${r.dsr.toFixed(1)}% masih menyisakan ${rp(r.remaining)} setelah komitmen utama.`:score>=52?`Ada satu atau lebih indikator yang mendekati batas. Perbaiki DP, tenor, atau harga sebelum ambil keputusan.`:`Risiko defisit atau beban utang terlalu tinggi dibanding kondisi keuangan saat ini.`;
    return {tone,score,label,title,summary,actions:actions.slice(0,3)};
  }
  function coachMarkup(c){
    return `<div class="v26-coach-head"><div class="v26-coach-title"><span class="v26-coach-icon"><i data-lucide="sparkles"></i></span><div><small>DECISION COACH</small><b>${esc(c.title)}</b></div></div><span class="v26-coach-score ${c.tone}">${c.score}/100</span></div><div class="v26-coach-status ${c.tone}">${esc(c.label)}</div><p class="v26-coach-summary">${esc(c.summary)}</p><div class="v26-coach-actions">${c.actions.map((x,i)=>`<div><span>${i+1}</span><p>${esc(x)}</p></div>`).join('')}</div>`;
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
      <div id="v26-business-coach" class="v26-coach"></div>
      <div id="v26-business-edit-state" class="v26-edit-state"></div>
      <div class="v26-actions"><button id="v26-business-save" class="btn-primary" type="button" onclick="saveBusinessV26()"><i data-lucide="bookmark-plus"></i> <span>Simpan skenario</span></button><button class="btn-small" type="button" onclick="resetBusinessV26()" aria-label="Kosongkan simulasi" title="Kosongkan"><i data-lucide="rotate-ccw"></i></button></div>
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
      <div id="v26-credit-coach" class="v26-coach"></div>
      <div id="v26-credit-edit-state" class="v26-edit-state"></div>
      <div class="v26-actions"><button id="v26-credit-save" class="btn-primary" type="button" onclick="saveCreditV26()"><i data-lucide="bookmark-plus"></i> <span>Simpan simulasi</span></button><button class="btn-small" type="button" onclick="resetCreditV26()" aria-label="Kosongkan simulasi" title="Kosongkan"><i data-lucide="rotate-ccw"></i></button></div>
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
    const type=el.dataset.v26Type||'money';
    if(type==='money'){
      const value=moneyNum(el.value);
      el.value=value?Math.round(value).toLocaleString('id-ID'):'';
    }
  }
  function bindLab(){
    const lab=document.getElementById('v26-decision-lab');if(!lab||lab.dataset.bound)return;lab.dataset.bound='1';
    lab.addEventListener('click',e=>{const tab=e.target.closest('[data-v26-tab]');if(tab)switchTab(tab.dataset.v26Tab);});
    lab.addEventListener('input',e=>{
      const el=e.target,field=el.dataset.v26Field,credit=el.dataset.v26Credit;
      if(!field&&!credit)return;
      if(el.dataset.v26Type==='money')formatField(el);
      setState(s=>{const target=field?s.businessDraft:s.creditDraft;const key=field||credit;target[key]=el.dataset.v26Type==='text'?el.value:(el.dataset.v26Type==='money'?moneyNum(el.value):num(el.value));});
      renderResults();
    });
    lab.addEventListener('change',e=>{
      const el=e.target,field=el.dataset.v26Field,credit=el.dataset.v26Credit;if(!field&&!credit)return;
      setState(s=>{const target=field?s.businessDraft:s.creditDraft;const key=field||credit;target[key]=el.dataset.v26Type==='text'?el.value:(el.dataset.v26Type==='money'?moneyNum(el.value):num(el.value));});renderResults();
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
    const coach=document.getElementById('v26-business-coach');if(coach)coach.innerHTML=coachMarkup(businessCoach(s.businessDraft,r));
  }
  function renderCredit(){
    const s=state(),r=calcCredit(s.creditDraft,s.profile),el=document.getElementById('v26-credit-result');if(!el)return;
    const pct=Math.min(100,r.dsr/35*100),progressTone=r.dsr>35?'bad':r.dsr>25?'warn':'';
    const strip=document.getElementById('v26-credit-profile-strip');if(strip)strip.innerHTML=`Memakai profil: gaji <b class="v26-money">${rp(s.profile.salary)}</b> · makan <b class="v26-money">${rp(s.profile.food)}</b> · bensin <b class="v26-money">${rp(s.profile.fuel)}</b>. <button class="mini-action primary" type="button" onclick="nav('settings')">Ubah di Settings</button>`;
    el.innerHTML=`<div class="v26-verdict ${r.tone}"><span class="v26-verdict-dot"></span><div><b>${esc(r.title)}</b><p>${esc(r.reason)}</p></div></div><div class="v26-result-grid"><div class="v26-metric"><small>Cicilan / bulan</small><b class="v26-money">${rp(r.installment)}</b></div><div class="v26-metric ${r.remaining>=0?'good':'bad'}"><small>Sisa setelah semua</small><b class="v26-money">${rp(r.remaining)}</b></div><div class="v26-metric"><small>Total dibayar</small><b class="v26-money">${rp(r.totalCredit)}</b></div><div class="v26-metric"><small>Biaya kredit</small><b class="v26-money">${rp(r.financeCost)}</b></div><div class="v26-metric"><small>Pokok dibiayai</small><b class="v26-money">${rp(r.principal)}</b></div><div class="v26-metric"><small>Rasio cicilan baru</small><b>${r.newRatio.toFixed(1)}%</b></div><div class="v26-metric ${r.dsr>35?'bad':r.dsr>25?'warn':'good'}"><small>Total rasio utang</small><b>${r.dsr.toFixed(1)}%</b></div><div class="v26-metric"><small>Batas cicilan nyaman</small><b class="v26-money">${rp(r.maxInstallment)}</b></div></div><div class="v26-progress ${progressTone}"><span style="width:${pct}%"></span></div><div class="v26-breakdown"><div><span>Gaji bulanan</span><b class="v26-money">${rp(s.profile.salary)}</b></div><div><span>Makan + bensin + wajib + tabungan</span><b class="v26-money">${rp(r.essentials)}</b></div><div><span>Cicilan lama + cicilan baru</span><b class="v26-money">${rp(r.totalDebt)}</b></div><div><span>Uang bebas untuk DP saat ini</span><b class="v26-money">${rp(r.cash)}</b></div></div>`;
    const coach=document.getElementById('v26-credit-coach');if(coach)coach.innerHTML=coachMarkup(creditCoach(s.creditDraft,s.profile,r));
  }
  function renderSaved(){
    const s=state(),b=document.getElementById('v26-business-saved'),c=document.getElementById('v26-credit-saved');
    if(b)b.innerHTML=s.businesses.length?s.businesses.map(x=>`<div class="v26-saved-item ${s.editingBusinessId===x.id?'active':''}"><button type="button" onclick="loadBusinessV26('${esc(x.id)}')"><b>${esc(x.data.name||'Bisnis tanpa nama')}</b><small>${rp(x.summary.net)} laba/bln · modal ${rp(x.summary.capitalNeeded)}${s.editingBusinessId===x.id?' · sedang diedit':''}</small></button><button class="v26-delete" type="button" onclick="deleteBusinessV26('${esc(x.id)}')" aria-label="Hapus"><i data-lucide="trash-2"></i></button></div>`).join(''):'<div class="v26-empty">Belum ada skenario bisnis tersimpan.</div>';
    if(c)c.innerHTML=s.credits.length?s.credits.map(x=>`<div class="v26-saved-item ${s.editingCreditId===x.id?'active':''}"><button type="button" onclick="loadCreditV26('${esc(x.id)}')"><b>${esc(x.data.name||'Kredit tanpa nama')}</b><small>${rp(x.summary.installment)}/bln · DSR ${Number(x.summary.dsr||0).toFixed(1)}%${s.editingCreditId===x.id?' · sedang diedit':''}</small></button><button class="v26-delete" type="button" onclick="deleteCreditV26('${esc(x.id)}')" aria-label="Hapus"><i data-lucide="trash-2"></i></button></div>`).join(''):'<div class="v26-empty">Belum ada simulasi kredit tersimpan.</div>';
    renderEditState(s);
    if(window.lucide?.createIcons)lucide.createIcons();
  }
  function renderEditState(s=state()){
    const biz=s.businesses.find(x=>x.id===s.editingBusinessId),credit=s.credits.find(x=>x.id===s.editingCreditId);
    const bizState=document.getElementById('v26-business-edit-state'),creditState=document.getElementById('v26-credit-edit-state');
    const bizSave=document.getElementById('v26-business-save'),creditSave=document.getElementById('v26-credit-save');
    if(bizState){bizState.classList.toggle('active',!!biz);bizState.innerHTML=biz?`<div><small>MODE EDIT</small><b>${esc(biz.data?.name||'Skenario bisnis')}</b><span>Perubahan akan memperbarui skenario ini tanpa membuat duplikat.</span></div><button type="button" onclick="cancelBusinessEditV26()">Batal edit</button>`:'';}
    if(creditState){creditState.classList.toggle('active',!!credit);creditState.innerHTML=credit?`<div><small>MODE EDIT</small><b>${esc(credit.data?.name||'Simulasi kredit')}</b><span>Perubahan akan memperbarui simulasi ini tanpa membuat duplikat.</span></div><button type="button" onclick="cancelCreditEditV26()">Batal edit</button>`:'';}
    if(bizSave)bizSave.innerHTML=`<i data-lucide="${biz?'save':'bookmark-plus'}"></i> <span>${biz?'Simpan perubahan':'Simpan skenario'}</span>`;
    if(creditSave)creditSave.innerHTML=`<i data-lucide="${credit?'save':'bookmark-plus'}"></i> <span>${credit?'Simpan perubahan':'Simpan simulasi'}</span>`;
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
    const values={};document.querySelectorAll('[data-v26-profile]').forEach(el=>values[el.dataset.v26Profile]=moneyNum(el.value));
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
    const s=state(),r=calcBusiness(s.businessDraft),editingId=s.editingBusinessId||'';
    if(!s.businessDraft.name.trim()||!r.hpp||!num(s.businessDraft.salePrice))return Swal.fire('Belum lengkap','Isi nama bisnis, komponen HPP, dan harga jual.','warning');
    let updated=false;
    setState(x=>{
      const item={id:editingId||uid('biz'),savedAt:Date.now(),data:clone(x.businessDraft),summary:{net:r.net,capitalNeeded:r.capitalNeeded,marginPct:r.marginPct}};
      const oldIndex=editingId?x.businesses.findIndex(v=>v.id===editingId):-1;
      if(oldIndex>=0){item.savedAt=x.businesses[oldIndex].savedAt||Date.now();item.updatedAt=Date.now();x.businesses.splice(oldIndex,1);updated=true;}
      x.businesses=[item,...x.businesses].slice(0,25);
      x.businessDraft=clone(BLANK_BUSINESS);x.editingBusinessId='';
    });
    refillDraft('business');
    Swal.fire({title:updated?'Perubahan skenario disimpan':'Skenario bisnis disimpan',text:'Form sudah dikosongkan dan siap untuk keputusan berikutnya.',icon:'success',timer:1450,showConfirmButton:false});
  };
  window.saveCreditV26=()=>{
    const s=state(),r=calcCredit(s.creditDraft,s.profile),editingId=s.editingCreditId||'';
    if(!s.creditDraft.name.trim()||!num(s.creditDraft.cashPrice)||!num(s.profile.salary))return Swal.fire('Belum lengkap','Isi nama barang, harga tunai, dan gaji di Profil Perhitungan.','warning');
    let updated=false;
    setState(x=>{
      const item={id:editingId||uid('credit'),savedAt:Date.now(),data:clone(x.creditDraft),summary:{installment:r.installment,dsr:r.dsr,totalCredit:r.totalCredit}};
      const oldIndex=editingId?x.credits.findIndex(v=>v.id===editingId):-1;
      if(oldIndex>=0){item.savedAt=x.credits[oldIndex].savedAt||Date.now();item.updatedAt=Date.now();x.credits.splice(oldIndex,1);updated=true;}
      x.credits=[item,...x.credits].slice(0,25);
      x.creditDraft=clone(BLANK_CREDIT);x.editingCreditId='';
    });
    refillDraft('credit');
    Swal.fire({title:updated?'Perubahan simulasi disimpan':'Simulasi kredit disimpan',text:'Form sudah dikosongkan dan siap untuk simulasi berikutnya.',icon:'success',timer:1450,showConfirmButton:false});
  };
  window.loadBusinessV26=id=>{const item=state().businesses.find(x=>x.id===id);if(!item)return;setState(s=>{s.businessDraft={...DEFAULTS.businessDraft,...item.data};s.editingBusinessId=id;s.activeTab='business';});refillDraft('business');switchTab('business');document.getElementById('v26-decision-lab')?.scrollIntoView({behavior:'auto',block:'start'});};
  window.loadCreditV26=id=>{const item=state().credits.find(x=>x.id===id);if(!item)return;setState(s=>{s.creditDraft={...DEFAULTS.creditDraft,...item.data};s.editingCreditId=id;s.activeTab='credit';});refillDraft('credit');switchTab('credit');document.getElementById('v26-decision-lab')?.scrollIntoView({behavior:'auto',block:'start'});};
  window.cancelBusinessEditV26=()=>{setState(s=>{s.businessDraft=clone(BLANK_BUSINESS);s.editingBusinessId='';});refillDraft('business');};
  window.cancelCreditEditV26=()=>{setState(s=>{s.creditDraft=clone(BLANK_CREDIT);s.editingCreditId='';});refillDraft('credit');};
  window.deleteBusinessV26=async id=>{const r=await Swal.fire({title:'Hapus skenario?',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal'});if(!r.isConfirmed)return;let cleared=false;setState(s=>{s.businesses=s.businesses.filter(x=>x.id!==id);if(s.editingBusinessId===id){s.editingBusinessId='';s.businessDraft=clone(DEFAULTS.businessDraft);cleared=true;}});cleared?refillDraft('business'):renderSaved();};
  window.deleteCreditV26=async id=>{const r=await Swal.fire({title:'Hapus simulasi?',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal'});if(!r.isConfirmed)return;let cleared=false;setState(s=>{s.credits=s.credits.filter(x=>x.id!==id);if(s.editingCreditId===id){s.editingCreditId='';s.creditDraft=clone(DEFAULTS.creditDraft);cleared=true;}});cleared?refillDraft('credit'):renderSaved();};
  window.resetBusinessV26=()=>{setState(s=>{s.businessDraft=clone(BLANK_BUSINESS);s.editingBusinessId='';});refillDraft('business');};
  window.resetCreditV26=()=>{setState(s=>{s.creditDraft=clone(BLANK_CREDIT);s.editingCreditId='';});refillDraft('credit');};
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
