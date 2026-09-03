/**
 * Agis Finance v25.3.5 — Google Apps Script backend
 * 100% usable on a normal Google account without enabling Cloud Billing.
 * Bind this script to a Google Sheet, then deploy as Web App.
 */
const DB = {
  config: 'Config', snapshot: 'Snapshot', expenses: 'Expenses', incomes: 'Incomes',
  transfers: 'Transfers', goals: 'Goals', recurring: 'Recurring', budgets: 'Budgets', bills: 'Bills', logs: 'Notification Log'
};

function onOpen(){ SpreadsheetApp.getUi().createMenu('Agis Finance').addItem('Setup database','setupAgisFinance').addItem('Aktifkan ulang pengingat','installReminderTrigger').addItem('Simpan secret dari Config','saveSecretsFromConfig').addItem('Tes Telegram','testTelegramFromSheet').addToUi(); }

function setupAgisFinance(){
  const ss=SpreadsheetApp.getActive();
  Object.values(DB).forEach(n=>{if(!ss.getSheetByName(n))ss.insertSheet(n)});
  const cfg=ss.getSheetByName(DB.config); cfg.clear();
  cfg.getRange('A1:B7').setValues([
    ['AGIS FINANCE v25.3.5','AUTOMATION CONFIG'],
    ['BOT_TOKEN','tempel token bot di B2 lalu jalankan "Simpan secret"'],
    ['CHAT_ID','tempel chat id di B3'],
    ['APP_KEY','buat password acak sendiri di B4'],
    ['WEEKLY_DAY','MONDAY'],['WEEKLY_HOUR','8'],['CHECK_EVERY_HOUR','ACTIVE']
  ]);
  cfg.setFrozenRows(1); styleHeader_(cfg,2);
  ensureHeaders_();
  installReminderTrigger(false);
  SpreadsheetApp.getUi().alert('Setup selesai. Isi B2–B4 di Config, lalu menu Agis Finance → Simpan secret dari Config.');
}

function installReminderTrigger(showAlert=true){
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='scheduledCheck').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('scheduledCheck').timeBased().everyHours(1).create();
  if(showAlert)SpreadsheetApp.getUi().alert('Pengingat aktif. Bot akan mengecek tagihan tiap jam dan mengirim ringkasan harian sekitar pukul 20.00.');
}

function saveSecretsFromConfig(){
  const sh=SpreadsheetApp.getActive().getSheetByName(DB.config); if(!sh)throw new Error('Jalankan setupAgisFinance dulu.');
  const token=String(sh.getRange('B2').getValue()).trim(), chat=String(sh.getRange('B3').getValue()).trim(), key=String(sh.getRange('B4').getValue()).trim();
  if(!token||!chat||!key)throw new Error('BOT_TOKEN, CHAT_ID, dan APP_KEY wajib diisi.');
  PropertiesService.getScriptProperties().setProperties({BOT_TOKEN:token,CHAT_ID:chat,APP_KEY:key});
  sh.getRange('B2').setValue('TERSIMPAN DI SCRIPT PROPERTIES'); sh.getRange('B4').setValue('TERSIMPAN DI SCRIPT PROPERTIES');
  SpreadsheetApp.getUi().alert('Secret tersimpan. Token bot tidak lagi diletakkan di sel.');
}

function doGet(){return json_({ok:true,service:'Agis Finance Automation',time:new Date().toISOString()});}
function doPost(e){
  try{
    const body=JSON.parse(e.postData?.contents||'{}'); auth_(body.appKey);
    if(body.action==='syncSnapshot'){saveSnapshot_(body.snapshot);checkSnapshot_(body.snapshot,false);return json_({ok:true,syncedAt:new Date().toISOString()});}
    if(body.action==='testTelegram'){sendTelegram_('✅ '+(body.message||'Agis Finance backend aktif.'));return json_({ok:true});}
    if(body.action==='wipeDatabase'){wipeDatabase_();return json_({ok:true});}
    return json_({ok:false,error:'Action tidak dikenal.'});
  }catch(err){return json_({ok:false,error:String(err.message||err)});}
}
function auth_(key){const expected=PropertiesService.getScriptProperties().getProperty('APP_KEY');if(!expected||String(key)!==expected)throw new Error('APP_KEY salah atau belum disetel.');}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}

function ensureHeaders_(){
  const ss=SpreadsheetApp.getActive();
  setHeader_(ss.getSheetByName(DB.snapshot),['Synced At','Device','Wallet Total','Reserved','Available','Safe Floor','Score','Carry Over','Snapshot JSON']);
  setHeader_(ss.getSheetByName(DB.expenses),['ID','Tanggal','Kategori','Nominal','Dompet','Catatan','Spending Type','Updated At']);
  setHeader_(ss.getSheetByName(DB.incomes),['ID','Tanggal','Kategori','Nominal','Dompet','Catatan','Updated At']);
  setHeader_(ss.getSheetByName(DB.transfers),['ID','Tanggal','Nominal','Dari','Ke','Catatan','Updated At']);
  setHeader_(ss.getSheetByName(DB.goals),['ID','Nama','Target','Saved','Deadline','Updated At']);
  setHeader_(ss.getSheetByName(DB.recurring),['ID','Nama','Type','Nominal','Kategori','Dompet','Frequency','Next Date','Active']);
  setHeader_(ss.getSheetByName(DB.budgets),['Bulan','Kategori','Budget']);
  setHeader_(ss.getSheetByName(DB.bills),['ID','Nama','Nominal','Kategori','Frequency','Start Date','Day','Active','Updated At']);
  setHeader_(ss.getSheetByName(DB.logs),['Timestamp','Event ID','Message']);
}
function setHeader_(sh,headers){if(!sh)return;sh.clear();sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);styleHeader_(sh,headers.length)}
function styleHeader_(sh,cols){sh.getRange(1,1,1,cols).setFontWeight('bold');sh.autoResizeColumns(1,cols)}
function rewrite_(name,headers,rows){const sh=SpreadsheetApp.getActive().getSheetByName(name);sh.clearContents();sh.getRange(1,1,1,headers.length).setValues([headers]);if(rows.length)sh.getRange(2,1,rows.length,headers.length).setValues(rows);sh.setFrozenRows(1);}

function saveSnapshot_(snap){
  if(!snap||!snap.data)throw new Error('Snapshot kosong.'); ensureSheetsSafe_(); const d=snap.data,s=snap.summary||{};
  const snapshotSh=SpreadsheetApp.getActive().getSheetByName(DB.snapshot);snapshotSh.clearContents();snapshotSh.getRange(1,1,1,9).setValues([['Synced At','Device','Wallet Total','Reserved','Available','Safe Floor','Score','Carry Over','Snapshot JSON']]);snapshotSh.getRange(2,1,1,9).setValues([[snap.syncedAt||new Date(),snap.deviceId||'',s.walletTotal||0,s.reservedSavings||0,s.available||0,s.safeFloor||0,s.score||0,s.carryOver||0,JSON.stringify(snap)]]);
  rewrite_(DB.expenses,['ID','Tanggal','Kategori','Nominal','Dompet','Catatan','Spending Type','Updated At'],(d.trans||[]).map(x=>[x.id||'',x.tanggal||'',x.kategori||'',Number(x.nominal)||0,x.dompet||'',x.catatan||x.note||'',x.spendingType||'',x.updatedAt||x.createdAt||'']));
  rewrite_(DB.incomes,['ID','Tanggal','Kategori','Nominal','Dompet','Catatan','Updated At'],(d.incomes||[]).map(x=>[x.id||'',x.tanggal||'',x.kategori||'',Number(x.nominal)||0,x.dompet||'',x.catatan||x.note||'',x.updatedAt||x.createdAt||'']));
  rewrite_(DB.transfers,['ID','Tanggal','Nominal','Dari','Ke','Catatan','Updated At'],(d.transfers||[]).map(x=>[x.id||'',x.tanggal||'',Number(x.nominal)||0,x.dari||x.from||'',x.ke||x.to||'',x.catatan||x.note||'',x.updatedAt||x.createdAt||'']));
  rewrite_(DB.goals,['ID','Nama','Target','Saved','Deadline','Updated At'],(d.goals||[]).map(x=>[x.id||'',x.name||'',Number(x.target)||0,Number(x.saved)||0,x.deadline||'',x.updatedAt||x.createdAt||'']));
  rewrite_(DB.recurring,['ID','Nama','Type','Nominal','Kategori','Dompet','Frequency','Next Date','Active'],(d.recurring||[]).map(x=>[x.id||'',x.name||'',x.type||'',Number(x.nominal)||0,x.kategori||'',x.dompet||'',x.frequency||'',x.nextDate||'',x.active!==false]));
  const v25=d.v25||{};
  const budgetRows=[];Object.entries(v25.budgets||{}).forEach(([month,cats])=>Object.entries(cats||{}).forEach(([cat,amount])=>budgetRows.push([month,cat,Number(amount)||0])));
  rewrite_(DB.budgets,['Bulan','Kategori','Budget'],budgetRows);
  rewrite_(DB.bills,['ID','Nama','Nominal','Kategori','Frequency','Start Date','Day','Active','Updated At'],(v25.bills||[]).map(x=>[x.id||'',x.name||'',Number(x.amount)||0,x.category||'Tagihan',x.frequency||'monthly',x.startDate||'',Number(x.day)||'',x.active!==false,x.updatedAt||'']));
}
function ensureSheetsSafe_(){const ss=SpreadsheetApp.getActive();Object.values(DB).forEach(n=>{if(!ss.getSheetByName(n))ss.insertSheet(n)});}
function latestSnapshot_(){const sh=SpreadsheetApp.getActive().getSheetByName(DB.snapshot);if(!sh||sh.getLastRow()<2)return null;const raw=sh.getRange(2,9).getValue();try{return JSON.parse(raw)}catch{return null}}

function scheduledCheck(){const snap=latestSnapshot_();if(snap)checkSnapshot_(snap,true);}
function checkSnapshot_(snap,scheduled){
  const s=snap.summary||{}, tz=Session.getScriptTimeZone()||'Asia/Jakarta', now=new Date();
  const today=Utilities.formatDate(now,tz,'yyyy-MM-dd');
  if(Number(s.safeFloor)>0&&Number(s.available)<Number(s.safeFloor))notifyOnce_('floor:'+today,`⚠️ Safe Floor terlewati\nSaldo tersedia Rp ${fmt_(s.available)}\nSafe Floor Rp ${fmt_(s.safeFloor)}`);
  if(Number(s.score)<40)notifyOnce_('score:'+today,`🔴 Financial Score kritis: ${Math.round(Number(s.score)||0)}/100`);
  if(s.recovery&&Number(s.recovery.pct)>=100)notifyOnce_('recovery:'+(s.recovery.createdAt||s.recovery.startDate||s.recovery.name),`🎯 Recovery selesai\n${s.recovery.name||'Target'} sudah 100% pulih.`);

  const last=s.latestExpense;
  if(last&&last.id){
    const key='latest-expense-notified', props=PropertiesService.getScriptProperties();
    if(props.getProperty(key)!==String(last.id)&&Number(last.nominal)>0){
      sendTelegram_(expenseMessage_(snap,last));
      props.setProperty(key,String(last.id));
      log_('expense:'+String(last.id),expenseMessage_(snap,last));
    }
  }

  if(scheduled){
    checkBills_(snap);
    const hour=Number(Utilities.formatDate(now,tz,'H'));
    const dow=Utilities.formatDate(now,tz,'EEEE').toUpperCase();
    if(hour===20)notifyOnce_('daily:'+today,dailyReminderMessage_(snap));
    if(dow==='MONDAY'&&hour===8){
      const week=Utilities.formatDate(now,tz,'YYYY-ww');
      notifyOnce_('weekly:'+week,weeklyMessage_(snap));
    }
  }
}

function expenseMessage_(snap,last){
  const s=snap.summary||{}, amount=Number(last.nominal)||0, category=String(last.kategori||'Pengeluaran');
  const note=String(last.catatan||last.note||'').trim();
  const todayExpense=Number(s.todayExpense)||todayExpenseFromRows_(snap);
  const dailySafe=Number(s.dailySafe)||dailySafeFallback_(snap);
  const lines=[
    '💸 Pengeluaran baru',
    `Rp ${fmt_(amount)} · ${category}`,
    `Untuk: ${note||category}`,
    `${last.dompet?`Dari: ${last.dompet} · `:''}${humanDate_(last.tanggal||s.date||'')}`
  ];
  if(String(last.tanggal||'')===String(s.date||'')){
    if(dailySafe>0){
      const diff=todayExpense-dailySafe;
      lines.push(`Hari ini: Rp ${fmt_(todayExpense)} / batas aman Rp ${fmt_(dailySafe)}`);
      if(diff>0)lines.push(`🚨 Batas aman harian terlewati Rp ${fmt_(diff)}.`);
      else if(amount>=dailySafe*.5)lines.push(`⚠️ Transaksi ini memakai ${Math.round(amount/dailySafe*100)}% jatah aman harian.`);
      else lines.push(`Sisa aman hari ini Rp ${fmt_(Math.max(0,dailySafe-todayExpense))}.`);
    }else if(amount>0){
      lines.push('🚨 Tidak ada jatah aman harian tersisa. Pengeluaran ini langsung mengurangi buffer.');
    }
  }
  const catWarn=categoryWarning_(snap,category);
  if(catWarn)lines.push(catWarn);
  return lines.join('\n');
}

function categoryWarning_(snap,category){
  if(!category||category==='Penyesuaian Saldo')return '';
  const s=snap.summary||{}, month=String(s.date||'').slice(0,7), rows=snap.data?.trans||[];
  const spent=rows.filter(x=>x.kategori===category&&String(x.tanggal||'').startsWith(month)).reduce((sum,x)=>sum+(Number(x.nominal)||0),0);
  const hard=Number(snap.data?.limits?.[category])||0;
  const plan=Number(snap.data?.v25?.budgets?.[month]?.[category])||0;
  if(hard>0&&spent>hard)return `🚨 Limit ${category} terlewati Rp ${fmt_(spent-hard)} (Rp ${fmt_(spent)} / Rp ${fmt_(hard)}).`;
  if(plan>0&&spent>plan)return `⚠️ Target alokasi ${category} terlewati Rp ${fmt_(spent-plan)}.`;
  if(plan>0&&spent>=plan*.8)return `🟡 Target alokasi ${category} sudah ${Math.round(spent/plan*100)}%.`;
  return '';
}

function dailyReminderMessage_(snap){
  const s=snap.summary||{}, spent=Number(s.todayExpense)||todayExpenseFromRows_(snap), safe=Number(s.dailySafe)||dailySafeFallback_(snap);
  const lines=['⏰ Pengingat keuangan malam',`Hari ini keluar Rp ${fmt_(spent)}`];
  if(safe>0){
    if(spent>safe)lines.push(`🚨 Lewat batas aman Rp ${fmt_(spent-safe)} · batas harian Rp ${fmt_(safe)}`);
    else lines.push(`Sisa aman hari ini Rp ${fmt_(safe-spent)} · batas harian Rp ${fmt_(safe)}`);
  }else if(spent>0){
    lines.push('🚨 Jatah aman harian sudah Rp 0. Pengeluaran hari ini memakai buffer.');
  }
  lines.push(`Saldo tersedia Rp ${fmt_(s.available||0)} · Tabungan Rp ${fmt_(s.reservedSavings||0)}`);
  const next=nearestBill_(snap);
  if(next)lines.push(`🧾 Tagihan terdekat: ${next.name||'Tagihan'} Rp ${fmt_(next.amount)} · ${next.date}`);
  if(!spent)lines.push('✅ Belum ada pengeluaran tercatat hari ini.');
  return lines.join('\n');
}

function todayExpenseFromRows_(snap){
  const day=String(snap.summary?.date||''), rows=snap.data?.trans||[];
  return rows.filter(x=>x.tanggal===day&&x.kategori!=='Penyesuaian Saldo').reduce((sum,x)=>sum+(Number(x.nominal)||0),0);
}
function dailySafeFallback_(snap){
  const s=snap.summary||{}, available=Math.max(0,Number(s.available)||0), floor=Math.max(0,Number(s.safeFloor)||0), days=Math.max(1,Number(s.remainingDays)||1);
  return Math.floor(Math.max(0,available-floor)/days);
}
function humanDate_(key){
  const p=String(key||'').split('-').map(Number); if(p.length!==3||!p[0])return String(key||'');
  const d=new Date(p[0],p[1]-1,p[2]);
  return Utilities.formatDate(d,Session.getScriptTimeZone()||'Asia/Jakarta','dd MMM yyyy');
}
function nearestBill_(snap){
  const bills=(snap.data?.v25?.bills||[]).filter(b=>b.active!==false); if(!bills.length)return null;
  const tz=Session.getScriptTimeZone()||'Asia/Jakarta', todayStr=Utilities.formatDate(new Date(),tz,'yyyy-MM-dd'), today=new Date(todayStr+'T00:00:00');
  return bills.map(b=>({bill:b,due:nextBillDate_(b,today)})).filter(x=>x.due).sort((a,b)=>a.due-b.due).map(x=>({name:x.bill.name,amount:Number(x.bill.amount)||0,date:Utilities.formatDate(x.due,tz,'dd MMM yyyy')}))[0]||null;
}

function checkBills_(snap){
  const bills=snap.data?.v25?.bills||[]; if(!bills.length)return;
  const tz=Session.getScriptTimeZone()||'Asia/Jakarta';
  const now=new Date(); const todayStr=Utilities.formatDate(now,tz,'yyyy-MM-dd');
  const today=new Date(todayStr+'T00:00:00');
  bills.filter(b=>b.active!==false).forEach(b=>{
    const due=nextBillDate_(b,today); if(!due)return;
    const dueStr=Utilities.formatDate(due,tz,'yyyy-MM-dd');
    const diff=Math.round((due-today)/86400000);
    if([3,1,0].includes(diff)){
      const when=diff===0?'hari ini':`H-${diff}`;
      notifyOnce_(`bill:${b.id||b.name}:${dueStr}:${diff}`,`🧾 Tagihan ${when}\n${b.name||'Tagihan'} · Rp ${fmt_(b.amount)}\nJatuh tempo ${dueStr}`);
    }
  });
}
function nextBillDate_(b,ref){
  const parts=String(b.startDate||'').split('-').map(Number); if(parts.length!==3)return null;
  const start=new Date(parts[0],parts[1]-1,parts[2]);
  if((b.frequency||'monthly')==='once')return start>=ref?start:null;
  const wanted=Number(b.day)||start.getDate();
  const cap=(y,m)=>Math.min(wanted,new Date(y,m+1,0).getDate());
  let d=new Date(ref.getFullYear(),ref.getMonth(),cap(ref.getFullYear(),ref.getMonth()));
  if(d<ref){const nm=ref.getMonth()+1,ny=ref.getFullYear()+Math.floor(nm/12),m=nm%12;d=new Date(ny,m,cap(ny,m));} return d;
}

function weeklyMessage_(snap){const rows=snap.data?.trans||[],now=new Date(),cut=new Date(now.getTime()-7*86400000);let total=0;const cats={};rows.forEach(x=>{const d=new Date((x.tanggal||'1970-01-01')+'T00:00:00');if(d>=cut){const n=Number(x.nominal)||0;total+=n;cats[x.kategori||'Lainnya']=(cats[x.kategori||'Lainnya']||0)+n}});const top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];return `📊 Weekly Review\n7 hari keluar Rp ${fmt_(total)}${top?`\nTerbesar: ${top[0]} Rp ${fmt_(top[1])}`:''}\nScore ${Math.round(Number(snap.summary?.score)||0)}/100 · Carry-over Rp ${fmt_(snap.summary?.carryOver||0)}`;}
function notifyOnce_(id,msg){const p=PropertiesService.getScriptProperties();if(p.getProperty('N:'+id))return;sendTelegram_(msg);p.setProperty('N:'+id,new Date().toISOString());log_(id,msg)}
function sendTelegram_(text){const p=PropertiesService.getScriptProperties(),token=p.getProperty('BOT_TOKEN'),chat=p.getProperty('CHAT_ID');if(!token||!chat)throw new Error('BOT_TOKEN/CHAT_ID belum disimpan.');const r=UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'post',contentType:'application/json',payload:JSON.stringify({chat_id:chat,text}),muteHttpExceptions:true});if(r.getResponseCode()>=300)throw new Error('Telegram HTTP '+r.getResponseCode()+': '+r.getContentText());}
function testTelegramFromSheet(){sendTelegram_('✅ Agis Finance v25.3.5 backend aktif. Notifikasi transaksi, peringatan, tagihan, dan pengingat harian siap.');SpreadsheetApp.getUi().alert('Pesan tes dikirim.');}
function log_(id,msg){const sh=SpreadsheetApp.getActive().getSheetByName(DB.logs);sh.appendRow([new Date(),id,msg]);}
function wipeDatabase_(){ensureSheetsSafe_();[DB.snapshot,DB.expenses,DB.incomes,DB.transfers,DB.goals,DB.recurring,DB.budgets,DB.bills].forEach(n=>{const sh=SpreadsheetApp.getActive().getSheetByName(n);if(sh)sh.clearContents()});ensureHeaders_();}
function fmt_(n){return Math.round(Number(n)||0).toLocaleString('id-ID');}
