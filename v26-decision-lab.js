(() => {
  'use strict';

  const KEY='agis_finance_v26_decision_lab';
  const DEFAULTS={
    activeTab:'business',
    profile:{salary:0,food:0,fuel:0,otherEssential:0,existingDebt:0,savingTarget:0},
    businessDraft:{
      name:'',capitalAvailable:0,setupCost:0,fixedMonthly:0,initialStock:30,
      material:0,packaging:0,labor:0,operational:0,otherUnit:0,
      salePrice:0,unitsPerDay:10,daysPerMonth:26,targetMargin:30,targetProfit:0
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
  const moneyNum=v=>{
    const digits=String(v??'').replace(/\D/g,'');
    return Math.max(0,Number(digits)||0);
  };
  const rp=v=>typeof fmt==='function'?fmt(Math.round(Number(v)||0)):`Rp ${Math.round(Number(v)||0).toLocaleString('id-ID')}`;
  const moneyValue=v=>Number(v)?Math.round(Number(v)).toLocaleString('id-ID'):'';
  const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
  const friendlyPrice=v=>{
    const n=Math.max(0,Number(v)||0);
    if(!n)return 0;
    const step=n<10000?500:n<100000?1000:n<1000000?5000:10000;
    return Math.ceil(n/step)*step;
  };
  const timingLabel=(sellingDays,months)=>{
    if(!(sellingDays>0)||!(months>0))return '—';
    const calendarDays=months*30.44;
    const weeks=calendarDays/7;
    const weekText=weeks<10?weeks.toFixed(1):Math.ceil(weeks).toLocaleString('id-ID');
    const monthText=months<10?months.toFixed(1):months.toFixed(0);
    return `${Math.ceil(sellingDays).toLocaleString('id-ID')} hari jual · ${weekText} minggu · ${monthText} bulan`;
  };

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
    const unitsPerDay=num(d.unitsPerDay);
    const daysPerMonth=Math.max(1,num(d.daysPerMonth)||1);
    const units=Math.round(unitsPerDay*daysPerMonth);
    const salePrice=num(d.salePrice);
    const fixedMonthly=num(d.fixedMonthly);
    const targetProfit=num(d.targetProfit);
    const revenue=salePrice*units;
    const variable=hpp*units;
    const marginUnit=salePrice-hpp;
    const gross=marginUnit*units;
    const net=gross-fixedMonthly;
    const marginPct=salePrice>0?(marginUnit/salePrice)*100:0;
    const capitalNeeded=num(d.setupCost)+fixedMonthly+(hpp*num(d.initialStock));
    const capitalGap=num(d.capitalAvailable)-capitalNeeded;
    const bepUnits=marginUnit>0?Math.ceil(fixedMonthly/marginUnit):0;
    const bepDays=unitsPerDay>0?bepUnits/unitsPerDay:0;
    const paybackMonths=net>0?capitalNeeded/net:0;
    const paybackSellingDays=paybackMonths>0?paybackMonths*daysPerMonth:0;
    const target=Math.min(90,num(d.targetMargin));
    const marginPrice=target<100&&hpp>0?hpp/(1-target/100):0;
    const breakEvenPrice=units>0?hpp+(fixedMonthly/units):0;
    const targetProfitPrice=units>0?hpp+((fixedMonthly+targetProfit)/units):0;
    const exactRecommendedPrice=Math.max(marginPrice,targetProfitPrice);
    const recommendedPrice=friendlyPrice(exactRecommendedPrice);
    const targetUnits=marginUnit>0?Math.ceil((fixedMonthly+targetProfit)/marginUnit):0;
    const targetUnitsPerDay=marginUnit>0?Math.ceil(targetUnits/daysPerMonth):0;
    const targetProfitGap=net-targetProfit;
    const targetMilestoneMonths=net>0?(capitalNeeded+targetProfit)/net:0;
    const targetMilestoneSellingDays=targetMilestoneMonths>0?targetMilestoneMonths*daysPerMonth:0;
    let tone='warn',title='Lengkapi angka utama',reason='Isi biaya membuat 1 produk, harga jual, target penjualan, dan target keuntungan supaya rencana usaha bisa dihitung.';
    if(hpp>0&&salePrice>0&&units>0){
      if(marginUnit<=0){tone='bad';title='Belum layak dijual';reason='Harga jual lebih rendah atau sama dengan biaya membuat 1 produk, jadi setiap penjualan belum menghasilkan keuntungan.';}
      else if(net<=0){tone='bad';title='Usaha masih merugi';reason=`Harga sekarang belum cukup untuk menutup biaya rutin bulanan. Dengan jumlah penjualan ini, harga paling rendah agar tidak rugi sekitar ${rp(breakEvenPrice)} per produk.`;}
      else if(capitalGap<0){tone='warn';title='Potensial, modal belum cukup';reason=`Masih kurang ${rp(Math.abs(capitalGap))} untuk persiapan, stok awal, dan biaya tetap.`;}
      else if(targetProfit>0&&targetProfitGap<0){tone='warn';title='Untung, tapi target belum tercapai';reason=`Masih kurang ${rp(Math.abs(targetProfitGap))}/bulan. Pada volume sekarang, harga perlu sekitar ${rp(targetProfitPrice)} per unit.`;}
      else if(marginPct+0.01<target){tone='warn';title='Usaha untung, tetapi laba kotornya di bawah target';reason=`Usaha sudah menghasilkan keuntungan, tetapi persentase laba kotor ${marginPct.toFixed(1)}% masih di bawah target ${target}%.`;}
      else {tone='good';title='Skenario usaha layak diuji';reason=targetProfit>0?'Modal mencukupi dan target keuntungan tercapai pada asumsi penjualan saat ini. Tetap mulai dari uji pasar kecil.':'Modal mencukupi, keuntungan bulanan positif, dan target laba kotor tercapai. Tetap lebih aman mulai dari uji pasar kecil.';}
    }
    return {
      hpp,units,unitsPerDay,daysPerMonth,revenue,variable,marginUnit,gross,net,marginPct,capitalNeeded,capitalGap,
      bepUnits,bepDays,payback:paybackMonths,paybackMonths,paybackSellingDays,target,marginPrice,breakEvenPrice,
      targetProfit,targetProfitPrice,exactRecommendedPrice,recommendedPrice,targetUnits,targetUnitsPerDay,targetProfitGap,
      targetMilestoneMonths,targetMilestoneSellingDays,tone,title,reason
    };
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
    let tone='warn',title='Lengkapi data cicilan',reason='Isi harga barang, pendapatan, bunga, dan lama cicilan untuk melihat apakah cicilan masih aman.';
    if(num(d.cashPrice)>0&&num(p.salary)>0){
      if(num(d.downPayment)>cash){tone='bad';title='DP terlalu besar untuk uang yang tersedia';reason=`Uang muka (DP) lebih besar dari uang bebas yang tersedia sebesar ${rp(num(d.downPayment)-cash)}.`;}
      else if(remaining<0){tone='bad';title='Cicilan tidak terjangkau';reason=`Setelah kebutuhan dan cicilan dibayar, uang bulanan akan kurang ${rp(Math.abs(remaining))}.`;}
      else if(dsr>35){tone='bad';title='Porsi pendapatan untuk cicilan terlalu tinggi';reason=`Semua cicilan akan memakai ${dsr.toFixed(1)}% pendapatan; batas aman konservatif aplikasi adalah 35%.`;}
      else if(installment<=maxInstallment&&remaining>=buffer){tone='good';title='Cicilan relatif aman';reason='Cicilan masih di batas konservatif dan diperkirakan menyisakan cadangan minimal 15% dari pendapatan.';}
      else {tone='warn';title='Bisa, tetapi ruangnya sempit';reason='Cicilan belum membuat uang bulanan minus, tetapi ruang untuk kebutuhan tak terduga mulai sempit.';}
    }
    return {principal,months,installment,totalCredit,financeCost,essentials,totalDebt,remaining,newRatio,dsr,cash,maxInstallment,tone,title,reason};
  }

  function input(name,label,value,type='money',extra='',hint=''){
    const val=type==='money'?moneyValue(value):esc(value);
    const hintHtml=hint?`<small class="v26-field-note">${hint}</small>`:'';
    return `<div class="v26-field"><label for="v26-${name}">${label}</label>${hintHtml}<input id="v26-${name}" data-v26-field="${name}" data-v26-type="${type}" value="${val}" ${type==='money'?'inputmode="numeric"':'inputmode="decimal"'} ${extra}></div>`;
  }

  function businessPanel(d){return `
    <div id="v26-business" class="v26-panel active" data-v26-panel="business">
      <div class="v26-howto" aria-label="Cara menggunakan perencana usaha">
        <div><span>1</span><b>Isi modal & biaya</b><small>Masukkan uang yang tersedia dan biaya untuk mulai.</small></div>
        <div><span>2</span><b>Isi biaya 1 produk</b><small>Jumlahkan semua biaya untuk membuat satu barang/minuman.</small></div>
        <div><span>3</span><b>Tentukan target</b><small>Isi harga, perkiraan penjualan, dan keuntungan yang diinginkan.</small></div>
      </div>
      <div class="v26-section">
        <div class="v26-section-title"><span class="v26-step">1</span><div><b>Modal untuk mulai usaha</b><small>Uang awal dan biaya rutin</small></div></div>
        <div class="v26-grid v26-wide">
          <div class="v26-field full"><label for="v26-name">Nama atau ide usaha</label><small class="v26-field-note">Bebas. Ini hanya untuk menandai skenario yang kamu simpan.</small><input id="v26-name" data-v26-field="name" data-v26-type="text" value="${esc(d.name)}" placeholder="Contoh: es kopi literan"></div>
          ${input('capitalAvailable','Uang yang siap dipakai',d.capitalAvailable,'money','','Modal yang memang boleh dipakai untuk usaha.')}
          ${input('setupCost','Biaya awal usaha',d.setupCost,'money','','Contoh: alat, meja, izin, banner, atau renovasi kecil.')}
          ${input('fixedMonthly','Biaya rutin per bulan',d.fixedMonthly,'money','','Contoh: sewa, listrik, internet, atau gaji tetap.')}
          ${input('initialStock','Jumlah stok awal',d.initialStock,'number','min="0" step="1"','Berapa produk yang ingin disiapkan saat mulai.')}
        </div>
        <div class="v26-helper"><i data-lucide="info"></i><span>Aplikasi akan menghitung berapa <b>modal minimum</b> yang dibutuhkan dari biaya awal + biaya rutin 1 bulan + stok awal.</span></div>
      </div>
      <div class="v26-section">
        <div class="v26-section-title"><span class="v26-step">2</span><div><b>Biaya membuat 1 produk</b><small>Sering disebut HPP</small></div></div>
        <div class="v26-explain"><b>HPP itu apa?</b><span>HPP adalah total biaya untuk membuat <strong>1 produk</strong>. Misalnya 1 gelas minuman butuh bahan Rp5.000 + cup Rp1.000, berarti biaya dasarnya Rp6.000 sebelum biaya lain.</span></div>
        <div class="v26-grid v26-wide">
          ${input('material','Bahan utama',d.material,'money','','Bahan yang langsung dipakai untuk 1 produk.')}
          ${input('packaging','Kemasan',d.packaging,'money','','Cup, botol, plastik, kotak, stiker, dan sejenisnya.')}
          ${input('labor','Upah per produk',d.labor,'money','','Isi 0 jika belum ingin menghitung tenaga kerja per produk.')}
          ${input('operational','Ongkos per produk',d.operational,'money','','Bagian gas, listrik, ongkir, atau biaya produksi lain per produk.')}
          ${input('otherUnit','Biaya lain per produk',d.otherUnit,'money','','Biaya kecil lain yang belum masuk di atas.')}
        </div>
      </div>
      <div class="v26-section">
        <div class="v26-section-title"><span class="v26-step">3</span><div><b>Target jual & keuntungan</b><small>Apa yang ingin dicapai tiap bulan</small></div></div>
        <div class="v26-grid v26-wide">
          ${input('salePrice','Harga jual per produk',d.salePrice,'money','','Harga yang ingin kamu pasang sekarang.')}
          ${input('unitsPerDay','Perkiraan terjual per hari',d.unitsPerDay,'number','min="0" step="1"','Gunakan perkiraan realistis, bukan angka terbaik.')}
          ${input('daysPerMonth','Hari jual per bulan',d.daysPerMonth,'number','min="1" max="31" step="1"','Berapa hari dalam sebulan usaha benar-benar buka/jualan.')}
          ${input('targetMargin','Target laba kotor (%)',d.targetMargin,'number','min="0" max="90" step="1"','Contoh 30% berarti sekitar 30% dari harga jual ingin tersisa setelah biaya per produk.')}
          ${input('targetProfit','Target keuntungan bersih per bulan',d.targetProfit,'money','','Berapa rupiah keuntungan yang ingin tersisa setelah biaya rutin dibayar.')}
        </div>
        <div class="v26-helper"><i data-lucide="sparkles"></i><span>Tidak tahu harus pasang harga berapa? Isi biaya produk, target penjualan, dan target keuntungan. Aplikasi akan memberi <b>saran harga jual</b>.</span></div>
      </div>
      <div id="v26-business-result" class="v26-result"></div>
      <div class="v26-actions"><button class="btn-primary" type="button" onclick="saveBusinessV26()"><i data-lucide="bookmark-plus"></i> Simpan rencana usaha</button><button class="btn-small" type="button" onclick="resetBusinessV26()" aria-label="Kosongkan semua isian" title="Kosongkan semua isian"><i data-lucide="rotate-ccw"></i></button></div>
      <div class="v26-saved"><div class="v26-saved-head">Rencana usaha yang disimpan</div><div id="v26-business-saved" class="v26-saved-list"></div></div>
    </div>`;}

  function creditPanel(d){return `
    <div id="v26-credit" class="v26-panel" data-v26-panel="credit">
      <div class="v26-howto v26-howto-credit" aria-label="Cara menggunakan cek cicilan">
        <div><span>1</span><b>Isi harga & DP</b><small>Masukkan harga tunai, uang muka, dan biaya awal.</small></div>
        <div><span>2</span><b>Isi bunga & lama cicilan</b><small>Pakai angka dari penjual atau aplikasi kredit.</small></div>
        <div><span>3</span><b>Lihat sisa uang</b><small>Aplikasi mengecek apakah cicilan masih nyaman untuk gaji kamu.</small></div>
      </div>
      <div class="v26-section">
        <div class="v26-section-title"><span class="v26-step">1</span><div><b>Barang yang mau dibeli</b><small>Harga dan cicilan yang ditawarkan</small></div></div>
        <div class="v26-grid v26-wide">
          <div class="v26-field full"><label for="v26-credit-name">Nama barang</label><small class="v26-field-note">Contoh: HP, laptop, motor, atau barang elektronik.</small><input id="v26-credit-name" data-v26-credit="name" data-v26-type="text" value="${esc(d.name)}" placeholder="Contoh: laptop kerja"></div>
          ${creditInput('cashPrice','Harga jika dibeli tunai',d.cashPrice,'money','','Harga barang tanpa cicilan.')}
          ${creditInput('downPayment','Bayar di awal (DP)',d.downPayment,'money','','Uang yang dibayar sebelum cicilan dimulai.')}
          ${creditInput('adminFee','Biaya admin/asuransi awal',d.adminFee,'money','','Biaya tambahan yang dibayar di luar DP.')}
          ${creditInput('interest','Bunga per tahun (%)',d.interest,'number','min="0" step="0.01"','Masukkan persentase bunga yang tertulis di penawaran.')}
          ${creditInput('months','Lama cicilan (bulan)',d.months,'number','min="1" max="120" step="1"','Contoh: 12 berarti cicilan selama 12 bulan.')}
          <div class="v26-field"><label for="v26-credit-method">Cara hitung bunga</label><small class="v26-field-note">Kalau tidak yakin, cek kontrak/penawaran kredit.</small><select id="v26-credit-method" data-v26-credit="method" data-v26-type="text"><option value="flat" ${d.method!=='annuity'?'selected':''}>Flat — bunga dari pokok awal</option><option value="annuity" ${d.method==='annuity'?'selected':''}>Anuitas — bunga dari sisa utang</option></select></div>
        </div>
        <div class="v26-helper"><i data-lucide="info"></i><span><b>Flat</b> biasanya lebih mudah dihitung. <b>Anuitas</b> menghitung bunga dari sisa utang. Pilih sesuai yang tertulis di penawaran kredit.</span></div>
      </div>
      <div id="v26-credit-profile-strip" class="v26-profile-strip"></div>
      <div id="v26-credit-result" class="v26-result"></div>
      <div class="v26-actions"><button class="btn-primary" type="button" onclick="saveCreditV26()"><i data-lucide="bookmark-plus"></i> Simpan cek cicilan</button><button class="btn-small" type="button" onclick="resetCreditV26()" aria-label="Kosongkan semua isian" title="Kosongkan semua isian"><i data-lucide="rotate-ccw"></i></button></div>
      <div class="v26-saved"><div class="v26-saved-head">Cek cicilan yang disimpan</div><div id="v26-credit-saved" class="v26-saved-list"></div></div>
    </div>`;}
  function creditInput(name,label,value,type='money',extra='',hint=''){
    const val=type==='money'?moneyValue(value):esc(value);
    const hintHtml=hint?`<small class="v26-field-note">${hint}</small>`:'';
    return `<div class="v26-field"><label for="v26-credit-${name}">${label}</label>${hintHtml}<input id="v26-credit-${name}" data-v26-credit="${name}" data-v26-type="${type}" value="${val}" ${type==='money'?'inputmode="numeric"':'inputmode="decimal"'} ${extra}></div>`;
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
    card.innerHTML=`<div class="v26-head"><div><span class="v26-eyebrow">PERENCANA KEPUTUSAN</span><h3>Hitung dulu sebelum keluar uang</h3><p>Pilih mau merencanakan usaha atau mengecek cicilan. Isi angka yang kamu tahu, hasil akan berubah otomatis.</p></div><div class="v26-head-icon"><i data-lucide="calculator"></i></div></div><div class="v26-tabs" role="tablist" aria-label="Jenis perhitungan"><button class="v26-tab" data-v26-tab="business" type="button"><i data-lucide="store"></i><span><b>Rencana Usaha</b><small>Hitung modal & untung</small></span></button><button class="v26-tab" data-v26-tab="credit" type="button"><i data-lucide="credit-card"></i><span><b>Cek Cicilan</b><small>Cek aman atau berat</small></span></button></div>${businessPanel(s.businessDraft)}${creditPanel(s.creditDraft)}`;
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
    card.innerHTML=`<div class="v26-profile-head"><div><div class="section-title"><i data-lucide="wallet-cards"></i> Data Keuangan untuk Cek Cicilan</div><p>Isi sekali. Angka ini dipakai untuk mengecek apakah cicilan baru masih aman setelah kebutuhan bulanan dan tabungan.</p></div><div class="v26-profile-icon"><i data-lucide="scan-line"></i></div></div><div class="v26-profile-grid">${profileInput('salary','Pendapatan per bulan',p.salary)}${profileInput('food','Makan per bulan',p.food)}${profileInput('fuel','Transport per bulan',p.fuel)}${profileInput('otherEssential','Kebutuhan wajib lainnya',p.otherEssential)}${profileInput('existingDebt','Cicilan lain yang masih berjalan',p.existingDebt)}${profileInput('savingTarget','Tabungan yang ingin disisihkan',p.savingTarget)}</div><div class="v26-profile-actions"><button class="btn-primary" type="button" onclick="saveV26Profile()">Simpan data</button><button class="btn-small" type="button" onclick="syncV26ProfileFromBudget()">Ambil dari budget bulan ini</button></div><div id="v26-profile-summary" class="v26-profile-summary"></div>`;
    const smart=document.getElementById('v244-controls-card');
    if(smart)page.insertBefore(card,smart);else page.insertBefore(card,page.children[1]||null);
    card.querySelectorAll('[data-v26-profile]').forEach(el=>el.addEventListener('input',()=>formatField(el)));
    renderProfileSummary();if(window.lucide?.createIcons)lucide.createIcons();return true;
  }

  function formatField(el){
    if(el.dataset.v26Type==='text')return el.value;
    if((el.dataset.v26Type||'money')!=='money')return num(el.value);
    const raw=String(el.value||'');
    const caret=typeof el.selectionStart==='number'?el.selectionStart:raw.length;
    const digitsBefore=raw.slice(0,caret).replace(/\D/g,'').length;
    const value=moneyNum(raw);
    const formatted=value?Math.round(value).toLocaleString('id-ID'):'';
    el.value=formatted;
    if(document.activeElement===el&&typeof el.setSelectionRange==='function'){
      let pos=0,seen=0;
      while(pos<formatted.length&&seen<digitsBefore){if(/\d/.test(formatted[pos]))seen++;pos++;}
      try{el.setSelectionRange(pos,pos)}catch{}
    }
    return value;
  }
  function bindLab(){
    const lab=document.getElementById('v26-decision-lab');if(!lab||lab.dataset.bound)return;lab.dataset.bound='1';
    lab.addEventListener('click',e=>{const tab=e.target.closest('[data-v26-tab]');if(tab)switchTab(tab.dataset.v26Tab);});
    lab.addEventListener('input',e=>{
      const el=e.target,field=el.dataset.v26Field,credit=el.dataset.v26Credit;
      if(!field&&!credit)return;
      const parsed=el.dataset.v26Type==='money'?formatField(el):el.dataset.v26Type==='text'?el.value:num(el.value);
      setState(s=>{const target=field?s.businessDraft:s.creditDraft;const key=field||credit;target[key]=parsed;});
      renderResults();
    });
    lab.addEventListener('change',e=>{
      const el=e.target,field=el.dataset.v26Field,credit=el.dataset.v26Credit;if(!field&&!credit)return;
      const parsed=el.dataset.v26Type==='money'?moneyNum(el.value):el.dataset.v26Type==='text'?el.value:num(el.value);
      setState(s=>{const target=field?s.businessDraft:s.creditDraft;const key=field||credit;target[key]=parsed;});renderResults();
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
    const profitTone=r.targetProfit>0?(r.targetProfitGap>=0?'good':'warn'):'';
    const targetPriceText=r.targetProfit>0?rp(r.targetProfitPrice):'Isi target untung dulu';
    const volumeText=r.targetProfit>0&&r.marginUnit>0?`${r.targetUnitsPerDay.toLocaleString('id-ID')} produk/hari · ${r.targetUnits.toLocaleString('id-ID')} produk/bulan`:'Isi target untung dulu';
    const paybackText=timingLabel(r.paybackSellingDays,r.paybackMonths);
    const targetMilestoneText=r.targetProfit>0?timingLabel(r.targetMilestoneSellingDays,r.targetMilestoneMonths):'Isi target untung dulu';
    const currentPrice=num(s.businessDraft.salePrice);
    el.innerHTML=`
      <div class="v26-result-title"><span>Hasil perhitungan</span><small>berdasarkan angka yang kamu isi</small></div>
      <div class="v26-verdict ${r.tone}"><span class="v26-verdict-dot"></span><div><b>${esc(r.title)}</b><p>${esc(r.reason)}</p></div></div>
      <div class="v26-primary-grid">
        <div class="v26-primary-card"><small>Modal yang dibutuhkan</small><b class="v26-money">${rp(r.capitalNeeded)}</b><span class="${gapTone}">${r.capitalGap>=0?`Modal cukup, sisa ${rp(r.capitalGap)}`:`Masih kurang ${rp(Math.abs(r.capitalGap))}`}</span></div>
        <div class="v26-primary-card"><small>Perkiraan uang masuk / bulan</small><b class="v26-money">${rp(r.revenue)}</b><span>${r.units.toLocaleString('id-ID')} produk/bulan</span></div>
        <div class="v26-primary-card ${r.net>0?'good':'bad'}"><small>Perkiraan keuntungan bersih / bulan</small><b class="v26-money">${rp(r.net)}</b><span>${r.targetProfit?r.targetProfitGap>=0?`Target terlewati ${rp(r.targetProfitGap)}`:`Kurang ${rp(Math.abs(r.targetProfitGap))} dari target`:'Isi target untung untuk membandingkan'}</span></div>
        <div class="v26-primary-card highlight"><small>Harga jual yang disarankan</small><b class="v26-money">${r.recommendedPrice?rp(r.recommendedPrice):'—'}</b><span>${r.recommendedPrice?'Dibulatkan ke harga yang lebih praktis':'Isi biaya produk & target penjualan'}</span></div>
      </div>
      <div class="v26-advice">
        <div class="v26-advice-head"><div><span>SUPAYA TARGET LEBIH MUDAH TERCAPAI</span><b>${r.targetProfit?`Target untung ${rp(r.targetProfit)}/bulan`:'Tentukan target keuntungan bulanan'}</b></div><i data-lucide="badge-dollar-sign"></i></div>
        <p>Aplikasi membandingkan biaya produk, biaya rutin, target keuntungan, dan jumlah penjualan. Pilih harga atau jumlah jual yang paling realistis buat usahamu.</p>
        <div class="v26-advice-grid">
          <div><small>Harga terendah agar tidak rugi</small><b class="v26-money">${rp(r.breakEvenPrice)}</b></div>
          <div><small>Harga agar target untung tercapai</small><b class="v26-money">${targetPriceText}</b></div>
          <div><small>Harga untuk target laba kotor ${r.target.toFixed(0)}%</small><b class="v26-money">${rp(r.marginPrice)}</b></div>
          <div><small>Kalau harga tetap ${currentPrice?rp(currentPrice):'belum diisi'}</small><b>${volumeText}</b></div>
        </div>
      </div>
      <div class="v26-timeline">
        <div class="v26-timeline-title"><i data-lucide="milestone"></i><span>Kapan uang kembali?</span></div>
        <p class="v26-timeline-help">Perkiraan ini memakai keuntungan bersih dari harga dan jumlah penjualan yang kamu isi sekarang.</p>
        <div class="v26-timeline-row"><span><i></i><b>Balik modal</b><small>Uang awal ${rp(r.capitalNeeded)} sudah kembali dari keuntungan</small></span><strong>${paybackText}</strong></div>
        <div class="v26-timeline-row"><span><i></i><b>Balik modal + target keuntungan</b><small>${r.targetProfit?`Total yang ingin terkumpul ${rp(r.capitalNeeded+r.targetProfit)}`:'Tentukan target keuntungan dulu'}</small></span><strong>${targetMilestoneText}</strong></div>
      </div>
      <details class="v26-details"><summary><span><i data-lucide="list-tree"></i> Lihat rincian perhitungan</span><small>Istilah teknis dijelaskan di sini</small></summary>
        <div class="v26-detail-list">
          <div><span><b>Biaya 1 produk (HPP)</b><small>Total bahan, kemasan, upah, dan ongkos untuk membuat 1 produk.</small></span><strong class="v26-money">${rp(r.hpp)}</strong></div>
          <div><span><b>Laba kotor</b><small>Uang yang tersisa dari penjualan setelah biaya per produk, sebelum biaya rutin bulanan.</small></span><strong class="v26-money">${rp(r.gross)}</strong></div>
          <div><span><b>Persentase laba kotor (margin)</b><small>Berapa persen dari harga jual yang tersisa setelah biaya 1 produk.</small></span><strong>${r.marginPct.toFixed(1)}%</strong></div>
          <div><span><b>Titik impas biaya rutin</b><small>Jumlah produk yang perlu terjual agar biaya rutin bulanan tertutup.</small></span><strong>${r.bepUnits?r.bepUnits.toLocaleString('id-ID')+' produk':'—'}</strong></div>
          <div><span><b>Perkiraan waktu menutup biaya rutin</b><small>Sering disebut BEP operasional.</small></span><strong>${r.bepDays?`${r.bepDays.toFixed(1)} hari jual`:'Belum tercapai'}</strong></div>
          <div><span><b>Selisih dari target keuntungan</b><small>Positif berarti target terlewati, negatif berarti masih kurang.</small></span><strong class="v26-money ${profitTone}">${r.targetProfit?(r.targetProfitGap>=0?'+ ':'- ')+rp(Math.abs(r.targetProfitGap)):'—'}</strong></div>
        </div>
      </details>`;
    if(window.lucide?.createIcons)lucide.createIcons();
  }

  function renderCredit(){
    const s=state(),r=calcCredit(s.creditDraft,s.profile),el=document.getElementById('v26-credit-result');if(!el)return;
    const pct=Math.min(100,r.dsr/35*100),progressTone=r.dsr>35?'bad':r.dsr>25?'warn':'';
    const strip=document.getElementById('v26-credit-profile-strip');if(strip)strip.innerHTML=`<i data-lucide="user-round-check"></i><div><b>Perhitungan memakai data keuanganmu</b><span>Pendapatan ${rp(s.profile.salary)} · makan ${rp(s.profile.food)} · transport ${rp(s.profile.fuel)}.</span></div><button class="mini-action primary" type="button" onclick="nav('settings')">Ubah data</button>`;
    el.innerHTML=`
      <div class="v26-result-title"><span>Hasil cek cicilan</span><small>lihat dampaknya ke uang bulanan</small></div>
      <div class="v26-verdict ${r.tone}"><span class="v26-verdict-dot"></span><div><b>${esc(r.title)}</b><p>${esc(r.reason)}</p></div></div>
      <div class="v26-primary-grid">
        <div class="v26-primary-card"><small>Cicilan baru per bulan</small><b class="v26-money">${rp(r.installment)}</b><span>selama ${r.months} bulan</span></div>
        <div class="v26-primary-card ${r.remaining>=0?'good':'bad'}"><small>Sisa uang tiap bulan</small><b class="v26-money">${rp(r.remaining)}</b><span>setelah kebutuhan, tabungan, dan semua cicilan</span></div>
        <div class="v26-primary-card"><small>Total uang yang akhirnya dibayar</small><b class="v26-money">${rp(r.totalCredit)}</b><span>termasuk DP, admin, dan bunga</span></div>
        <div class="v26-primary-card ${r.financeCost>0?'warn':''}"><small>Biaya tambahan karena kredit</small><b class="v26-money">${rp(r.financeCost)}</b><span>dibanding beli tunai</span></div>
      </div>
      <div class="v26-debt-meter">
        <div class="v26-debt-meter-head"><span><b>Porsi pendapatan untuk semua cicilan</b><small>${r.dsr.toFixed(1)}% dari pendapatan bulanan</small></span><strong class="${r.dsr>35?'bad':r.dsr>25?'warn':'good'}">${r.dsr<=25?'Nyaman':r.dsr<=35?'Mulai ketat':'Terlalu berat'}</strong></div>
        <div class="v26-progress ${progressTone}" aria-label="Porsi pendapatan untuk cicilan"><span style="width:${pct}%"></span></div>
        <p>Patokan konservatif aplikasi: total cicilan sebaiknya tidak lebih dari <b>35%</b> pendapatan. Ini bukan aturan bank, hanya batas aman untuk membantu mengambil keputusan.</p>
      </div>
      <details class="v26-details"><summary><span><i data-lucide="list-tree"></i> Lihat rincian perhitungan</span><small>Angka tambahan dijelaskan di sini</small></summary>
        <div class="v26-detail-list">
          <div><span><b>Jumlah yang benar-benar dicicil</b><small>Harga tunai dikurangi uang muka (DP).</small></span><strong class="v26-money">${rp(r.principal)}</strong></div>
          <div><span><b>Porsi gaji untuk cicilan baru</b><small>Persentase cicilan baru dibanding pendapatan bulanan.</small></span><strong>${r.newRatio.toFixed(1)}%</strong></div>
          <div><span><b>Total semua cicilan per bulan</b><small>Cicilan lama + cicilan baru.</small></span><strong class="v26-money">${rp(r.totalDebt)}</strong></div>
          <div><span><b>Kebutuhan & tabungan per bulan</b><small>Makan, transport, kebutuhan wajib, dan target tabungan.</small></span><strong class="v26-money">${rp(r.essentials)}</strong></div>
          <div><span><b>Batas cicilan baru yang lebih nyaman</b><small>Estimasi konservatif agar masih ada ruang untuk kebutuhan dan dana cadangan.</small></span><strong class="v26-money">${rp(r.maxInstallment)}</strong></div>
          <div><span><b>Uang bebas yang tersedia untuk DP</b><small>Saldo yang tidak sedang dipakai untuk target dan batas aman aplikasi.</small></span><strong class="v26-money">${rp(r.cash)}</strong></div>
        </div>
      </details>`;
    if(window.lucide?.createIcons)lucide.createIcons();
  }
  function renderSaved(){
    const s=state(),b=document.getElementById('v26-business-saved'),c=document.getElementById('v26-credit-saved');
    if(b)b.innerHTML=s.businesses.length?s.businesses.map(x=>`<div class="v26-saved-item"><button type="button" onclick="loadBusinessV26('${esc(x.id)}')"><b>${esc(x.data.name||'Bisnis tanpa nama')}</b><small>${rp(x.summary.net)} untung/bulan · modal ${rp(x.summary.capitalNeeded)}</small></button><button class="v26-delete" type="button" onclick="deleteBusinessV26('${esc(x.id)}')" aria-label="Hapus"><i data-lucide="trash-2"></i></button></div>`).join(''):'<div class="v26-empty">Belum ada skenario bisnis tersimpan.</div>';
    if(c)c.innerHTML=s.credits.length?s.credits.map(x=>`<div class="v26-saved-item"><button type="button" onclick="loadCreditV26('${esc(x.id)}')"><b>${esc(x.data.name||'Kredit tanpa nama')}</b><small>${rp(x.summary.installment)}/bulan · porsi pendapatan ${Number(x.summary.dsr||0).toFixed(1)}%</small></button><button class="v26-delete" type="button" onclick="deleteCreditV26('${esc(x.id)}')" aria-label="Hapus"><i data-lucide="trash-2"></i></button></div>`).join(''):'<div class="v26-empty">Belum ada simulasi kredit tersimpan.</div>';
    if(window.lucide?.createIcons)lucide.createIcons();
  }
  function renderProfileSummary(){
    const p=state().profile,el=document.getElementById('v26-profile-summary');if(!el)return;
    const essentials=num(p.food)+num(p.fuel)+num(p.otherEssential)+num(p.existingDebt)+num(p.savingTarget);
    el.innerHTML=`Kebutuhan + cicilan lama + tabungan: <b class="v26-money">${rp(essentials)}</b>. Sisa pendapatan sebelum cicilan baru: <b class="v26-money">${rp(num(p.salary)-essentials)}</b>.`;
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
    Swal.fire({title:'Profil disimpan',text:'Cek Cicilan langsung memakai angka terbaru.',icon:'success',timer:1300,showConfirmButton:false});
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
    if(!s.businessDraft.name.trim()||!r.hpp||!num(s.businessDraft.salePrice))return Swal.fire('Belum lengkap','Isi nama usaha, biaya membuat produk, dan harga jual.','warning');
    setState(x=>x.businesses=[{id:uid('biz'),savedAt:Date.now(),data:clone(x.businessDraft),summary:{net:r.net,capitalNeeded:r.capitalNeeded,marginPct:r.marginPct}},...x.businesses].slice(0,25));renderSaved();
    Swal.fire({title:'Skenario bisnis disimpan',icon:'success',timer:1200,showConfirmButton:false});
  };
  window.saveCreditV26=()=>{
    const s=state(),r=calcCredit(s.creditDraft,s.profile);
    if(!s.creditDraft.name.trim()||!num(s.creditDraft.cashPrice)||!num(s.profile.salary))return Swal.fire('Belum lengkap','Isi nama barang, harga tunai, dan pendapatan di Data Keuangan untuk Cek Cicilan.','warning');
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
