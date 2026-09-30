/**
 * Agis Finance v28.4.2 — Google Apps Script backend
 * 100% usable on a normal Google account without enabling Cloud Billing.
 * Bind this script to a Google Sheet, then deploy as Web App.
 */
const DB = {
  config: 'Config', snapshot: 'Snapshot', expenses: 'Expenses', incomes: 'Incomes',
  transfers: 'Transfers', goals: 'Goals', recurring: 'Recurring', budgets: 'Budgets', bills: 'Bills', logs: 'Notification Log'
};

function onOpen(){ SpreadsheetApp.getUi().createMenu('Agis Finance').addItem('Setup database','setupAgisFinance').addItem('Aktifkan ulang pengingat','installReminderTrigger').addItem('Aktifkan Telegram Shortcut','installTelegramWebhook').addItem('Kirim Shortcut Information','sendTelegramMenuFromSheet').addItem('Simpan secret dari Config','saveSecretsFromConfig').addItem('Tes Telegram','testTelegramFromSheet').addToUi(); }

function setupAgisFinance(){
  const ss=SpreadsheetApp.getActive();
  Object.values(DB).forEach(n=>{if(!ss.getSheetByName(n))ss.insertSheet(n)});
  const cfg=ss.getSheetByName(DB.config); cfg.clear();
  cfg.getRange('A1:B7').setValues([
    ['AGIS FINANCE v28.4.2','AUTOMATION CONFIG'],
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

function doGet(){return json_({ok:true,service:'Agis Finance v28.4.2 Single Message Finance Center',time:new Date().toISOString()});}
function doPost(e){
  try{
    const body=JSON.parse(e.postData?.contents||'{}');

    // Request dari AutoBudgetin selalu membawa `action`. Proses ini lebih dulu
    // supaya payload testTelegram yang juga punya field `message` tidak keliru
    // dianggap sebagai update webhook Telegram.
    if(body.action){
      auth_(body.appKey);
      if(body.action==='syncSnapshot'){saveSnapshot_(body.snapshot);checkSnapshot_(body.snapshot,false);return json_({ok:true,syncedAt:new Date().toISOString()});}
      if(body.action==='testTelegram'){const hook=ensureTelegramWebhook_(body.webAppUrl||'');removeLegacyKeyboard_();sendTelegram_(body.message||'AutoBudgetin v28.4.2 backend aktif.',true);return json_({ok:true,webhookOk:!!hook.ok,webhookUrl:hook.url||''});}
      if(body.action==='wipeDatabase'){wipeDatabase_();return json_({ok:true});}
      return json_({ok:false,error:'Action tidak dikenal.'});
    }

    // Telegram webhook tidak membawa APP_KEY. Terima hanya payload yang benar-benar
    // menyerupai Telegram Update, bukan sekadar memiliki properti bernama `message`.
    const isTelegramUpdate = body.update_id != null || !!body.callback_query || !!(body.message && typeof body.message==='object' && body.message.chat);
    if(isTelegramUpdate){handleTelegramUpdate_(body);return json_({ok:true,telegram:true});}

    return json_({ok:false,error:'Payload tidak dikenal.'});
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
      sendTelegram_(expenseMessage_(snap,last),true);
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
  const bucket=String(last.budgetBucket||bucketFor_(last)||category), usage=autoUsageInfo_(last,snap.data?.trans||[]), usageDays=Math.max(0,Number(last.usageDays)||0);
  const lines=[
    '💸 PENGELUARAN BARU',
    `💰 Rp ${fmt_(amount)}`,
    `🏷️ ${bucket} · ${category}`,
    `📝 ${note||category}`,
    `${last.dompet?`👛 ${last.dompet} · `:''}📅 ${humanDate_(last.tanggal||s.date||'')}`
  ];
  if(usage.enabled)lines.push(`⏳ Durasi otomatis: ${usage.days} hari${usage.active?' berjalan':' selesai'} · ≈ Rp ${fmt_(usage.perDay)}/hari`);
  else if(usageDays>0)lines.push(`⏳ Durasi lama: ${usageDays} hari · ≈ Rp ${fmt_(amount/usageDays)}/hari`);
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
  const todayRows=(snap.data?.trans||[]).filter(x=>x.tanggal===String(s.date||'')&&x.kategori!=='Penyesuaian Saldo');
  const buckets={}; todayRows.forEach(x=>{const b=String(x.budgetBucket||bucketFor_(x));buckets[b]=(buckets[b]||0)+(Number(x.nominal)||0)});
  Object.entries(buckets).sort((a,b)=>b[1]-a[1]).slice(0,4).forEach(([b,n])=>lines.push(`${bucketIcon_(b)} ${b}: Rp ${fmt_(n)}`));
  lines.push(`💳 Saldo tersedia Rp ${fmt_(s.available||0)} · 💾 Tabungan Rp ${fmt_(s.reservedSavings||0)}`);
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
    if(diff>=0 && diff<=7){
      const when=diff===0?'jatuh tempo hari ini':diff===1?'jatuh tempo besok':`H-${diff}`;
      const icon=diff===0?'🔴':diff===1?'⚠️':'🧾';
      notifyOnce_(`bill:${b.id||b.name}:${dueStr}:${diff}`,`${icon} Tagihan ${when}\n${b.name||'Tagihan'} · Rp ${fmt_(b.amount)}\nJatuh tempo ${humanDate_(dueStr)}`);
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

function weeklyMessage_(snap){
  const rows=snap.data?.trans||[],now=new Date(),cut=new Date(now.getTime()-7*86400000);let total=0;const buckets={},coverage=[];
  rows.forEach(x=>{const d=new Date((x.tanggal||'1970-01-01')+'T00:00:00');if(d>=cut){const n=Number(x.nominal)||0,b=String(x.budgetBucket||bucketFor_(x));total+=n;buckets[b]=(buckets[b]||0)+n;const u=autoUsageInfo_(x,rows);if(u.enabled||Number(x.usageDays)>0)coverage.push({x,u})}});
  const lines=['📊 WEEKLY MONEY REVIEW',`💸 7 hari keluar Rp ${fmt_(total)}`];
  Object.entries(buckets).sort((a,b)=>b[1]-a[1]).slice(0,6).forEach(([b,n])=>lines.push(`${bucketIcon_(b)} ${b}: Rp ${fmt_(n)}`));
  if(coverage.length){lines.push('','⏳ DAYA TAHAN PEMBELIAN');coverage.sort((a,b)=>(b.u.enabled?b.u.perDay:(Number(b.x.nominal)||0)/Math.max(1,Number(b.x.usageDays)||1))-(a.u.enabled?a.u.perDay:(Number(a.x.nominal)||0)/Math.max(1,Number(a.x.usageDays)||1))).slice(0,4).forEach(({x,u})=>{const days=u.enabled?u.days:Number(x.usageDays),per=u.enabled?u.perDay:(Number(x.nominal)||0)/Math.max(1,days);lines.push(`• ${x.catatan||x.kategori}: ${days} hari${u.enabled&&u.active?' berjalan':''} · ≈ Rp ${fmt_(per)}/hari`)})}
  lines.push('',`❤️ Score ${Math.round(Number(snap.summary?.score)||0)}/100 · 💾 Carry-over Rp ${fmt_(snap.summary?.carryOver||0)}`);return lines.join('\n');
}
function normalizeUsageText_(v){return String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');}
function usageKey_(x){const n=normalizeUsageText_(x?.catatan||x?.note||'');if(n)return 'note:'+n;return 'fallback:'+normalizeUsageText_(x?.kategori||'lainnya')+'|'+normalizeUsageText_(x?.budgetBucket||bucketFor_(x));}
function usageDayNumber_(d){const m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return NaN;return Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3]))/86400000;}
function usageAfter_(a,b){const ad=usageDayNumber_(a?.tanggal),bd=usageDayNumber_(b?.tanggal),ac=Number(a?.createdAt)||0,bc=Number(b?.createdAt)||0;return ad>bd||(ad===bd&&ac>bc);}
function autoUsageInfo_(x,rows){if(!x?.autoUsage)return {enabled:false,days:0,active:false,perDay:0};const key=usageKey_(x),all=Array.isArray(rows)?rows:[],start=usageDayNumber_(x.tanggal),next=all.filter(r=>r&&r.id!==x.id&&usageKey_(r)===key&&usageAfter_(r,x)).sort((a,b)=>usageDayNumber_(a.tanggal)-usageDayNumber_(b.tanggal)||(Number(a.createdAt)||0)-(Number(b.createdAt)||0))[0];const tz=Session.getScriptTimeZone()||'Asia/Jakarta',today=Utilities.formatDate(new Date(),tz,'yyyy-MM-dd'),end=next?usageDayNumber_(next.tanggal):usageDayNumber_(today),days=Math.max(1,Math.round((isNaN(end)?start:end)-start));return {enabled:true,days,active:!next,perDay:(Number(x.nominal)||0)/days,nextDate:next?.tanggal||''};}
function bucketFor_(x){const c=String(x?.kategori||''),n=String(x?.catatan||x?.note||'').toLowerCase();if(c==='Makan & Minum')return /(jajan|snack|kopi|coffee|es |boba|cafe|café|minuman)/i.test(n)?'Jajan':'Makan Pokok';if(c==='Transportasi')return 'Transportasi';if(c==='Tagihan')return 'Tagihan';if(c==='Keluarga & Pemberian')return 'Pemberian';if(c==='Belanja')return 'Belanja';if(c==='Hiburan')return 'Hiburan';return 'Lainnya';}
function bucketIcon_(b){return ({'Makan Pokok':'·','Jajan':'·','Transportasi':'·','Tagihan':'·','Pemberian':'·','Belanja':'·','Hiburan':'·','Lainnya':'·'})[b]||'·';}
function notifyOnce_(id,msg){const p=PropertiesService.getScriptProperties();if(p.getProperty('N:'+id))return;sendTelegram_(msg,true);p.setProperty('N:'+id,new Date().toISOString());log_(id,msg)}
function telegramMenu_(){return {inline_keyboard:[
  [{text:'Ringkasan',callback_data:'fin:summary'},{text:'Hari ini',callback_data:'fin:today'}],
  [{text:'Pemakaian',callback_data:'fin:usage'},{text:'Budget',callback_data:'fin:budget'}],
  [{text:'Tabungan',callback_data:'fin:savings'},{text:'Durasi',callback_data:'fin:durability'}],
  [{text:'Terbesar',callback_data:'fin:largest'},{text:'Kategori',callback_data:'fin:categories'}],
  [{text:'Refresh',callback_data:'fin:summary'}]
]};}
function telegramCategoryMenu_(){return {inline_keyboard:[
  [{text:'Makan',callback_data:'fin:bucket:Makan Pokok'},{text:'Jajan',callback_data:'fin:bucket:Jajan'}],
  [{text:'Transport',callback_data:'fin:bucket:Transportasi'},{text:'Tagihan',callback_data:'fin:bucket:Tagihan'}],
  [{text:'Pemberian',callback_data:'fin:bucket:Pemberian'},{text:'Belanja',callback_data:'fin:bucket:Belanja'}],
  [{text:'Hiburan',callback_data:'fin:bucket:Hiburan'},{text:'Lainnya',callback_data:'fin:bucket:Lainnya'}],
  [{text:'Kembali',callback_data:'fin:back'}]
]};}
function sendTelegram_(text,withMenu){const p=PropertiesService.getScriptProperties(),token=p.getProperty('BOT_TOKEN'),chat=p.getProperty('CHAT_ID');if(!token||!chat)throw new Error('BOT_TOKEN/CHAT_ID belum disimpan.');const payload={chat_id:chat,text:String(text||'')};if(withMenu)payload.reply_markup=telegramMenu_();const r=telegramApi_('sendMessage',payload);if(r.getResponseCode()>=300)throw new Error('Telegram HTTP '+r.getResponseCode()+': '+r.getContentText());return r;}
function telegramApi_(method,payload){const token=PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');if(!token)throw new Error('BOT_TOKEN belum disimpan.');return UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'post',contentType:'application/json',payload:JSON.stringify(payload||{}),muteHttpExceptions:true});}
function telegramJson_(response){try{return JSON.parse(response.getContentText()||'{}')}catch{return {}}}
function editTelegramShortcut_(chatId,messageId,text,markup){
  const payload={chat_id:chatId,message_id:messageId,text:String(text||''),reply_markup:markup||telegramMenu_()};
  const r=telegramApi_('editMessageText',payload),code=r.getResponseCode(),body=telegramJson_(r),desc=String(body.description||'');
  // Refresh pada tampilan yang belum berubah bisa menghasilkan HTTP 400
  // "message is not modified". Itu bukan kegagalan dan tidak boleh membuat
  // pesan baru karena Finance Center memakai satu pesan yang sama.
  if(code<300||/message is not modified/i.test(desc))return {ok:true,unchanged:/message is not modified/i.test(desc)};
  return {ok:false,error:desc||('Telegram HTTP '+code)};
}
function editTelegramMarkup_(chatId,messageId,markup){const r=telegramApi_('editMessageReplyMarkup',{chat_id:chatId,message_id:messageId,reply_markup:markup});return r.getResponseCode()<300;}
function normalizeWebAppUrl_(url){url=String(url||'').trim();if(!url)return '';url=url.replace(/\/dev(?:[?#].*)?$/,'/exec').replace(/[?#].*$/,'');return url;}
function ensureTelegramWebhook_(preferredUrl){const url=normalizeWebAppUrl_(preferredUrl)||normalizeWebAppUrl_(ScriptApp.getService().getUrl());if(!url||!/\/exec$/.test(url))throw new Error('Web App URL /exec tidak valid. Isi URL Apps Script yang aktif di AutoBudgetin lalu Tes Telegram lagi.');const r=telegramApi_('setWebhook',{url,allowed_updates:['message','callback_query'],drop_pending_updates:false});const parsed=telegramJson_(r);if(!parsed.ok)throw new Error('Webhook gagal: '+r.getContentText());try{telegramApi_('setMyCommands',{commands:[{command:'start',description:'Buka Shortcut Information'},{command:'menu',description:'Buka Shortcut Information'}]})}catch{};const info=telegramJson_(telegramApi_('getWebhookInfo',{}));if(!info.ok||String(info.result?.url||'')!==url)throw new Error('Webhook belum mengarah ke deployment aktif. '+JSON.stringify(info.result||{}));return {ok:true,url,info:info.result||{}};}
function installTelegramWebhook(){const url=normalizeWebAppUrl_(ScriptApp.getService().getUrl());const hook=ensureTelegramWebhook_(url);removeLegacyKeyboard_();SpreadsheetApp.getUi().alert('Telegram Shortcut Center aktif.\n\nWebhook: '+hook.url+'\n\nShortcut lama juga sudah dibersihkan.');}
function removeLegacyKeyboard_(){const p=PropertiesService.getScriptProperties(),token=p.getProperty('BOT_TOKEN'),chat=p.getProperty('CHAT_ID');if(!token||!chat)return false;try{const r=telegramApi_('sendMessage',{chat_id:chat,text:'Shortcut diperbarui.',reply_markup:{remove_keyboard:true}});return r.getResponseCode()<300}catch(e){return false}}
function sendTelegramMenuFromSheet(){removeLegacyKeyboard_();sendTelegram_('SHORTCUT INFORMATION\nPilih informasi yang ingin ditinjau dari snapshot AutoBudgetin terbaru.',true);SpreadsheetApp.getUi().alert('Shortcut Information dikirim ke Telegram.');}
function testTelegramFromSheet(){const hook=ensureTelegramWebhook_('');removeLegacyKeyboard_();sendTelegram_('AutoBudgetin v28.4.2 aktif.\nFinance Center siap digunakan melalui tombol di bawah.',true);SpreadsheetApp.getUi().alert('Tes berhasil. Webhook aktif di: '+hook.url);}
function normalizeShortcutText_(text){return String(text||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function shortcutActionFromText_(text){const t=normalizeShortcutText_(text);const aliases={
  'ringkasan':'fin:summary','hari ini':'fin:today','pemakaian':'fin:usage','budget':'fin:budget','tabungan':'fin:savings','durasi':'fin:durability','daya tahan':'fin:durability','terbesar':'fin:largest','refresh':'fin:summary',
  'makan':'fin:bucket:Makan Pokok','jajan':'fin:bucket:Jajan','transport':'fin:bucket:Transportasi','transportasi':'fin:bucket:Transportasi','tagihan':'fin:bucket:Tagihan','pemberian':'fin:bucket:Pemberian','belanja':'fin:bucket:Belanja','hiburan':'fin:bucket:Hiburan','lainnya':'fin:bucket:Lainnya'
};return aliases[t]||'';}
function handleTelegramUpdate_(u){
  const p=PropertiesService.getScriptProperties(),allowed=String(p.getProperty('CHAT_ID')||''),q=u.callback_query,msg=u.message;
  const chat=String(q?.message?.chat?.id||msg?.chat?.id||'');if(!allowed||chat!==allowed)return;
  if(q){
    const data=String(q.data||''),messageId=q?.message?.message_id;
    let result={ok:false,error:'Pesan Finance Center tidak ditemukan.'};
    if(messageId){
      if(data==='fin:categories'){
        result=editTelegramShortcut_(chat,messageId,'KATEGORI PEMAKAIAN\nPilih kategori yang ingin ditinjau.',telegramCategoryMenu_());
      }else if(data==='fin:back'){
        result=editTelegramShortcut_(chat,messageId,'FINANCE CENTER\nPilih informasi yang ingin ditinjau.',telegramMenu_());
      }else{
        const snap=latestSnapshot_(),out=telegramShortcutText_(data,snap);
        result=editTelegramShortcut_(chat,messageId,out,data.indexOf('fin:bucket:')===0?telegramCategoryMenu_():telegramMenu_());
      }
    }
    // Callback selalu dijawab agar loading tombol berhenti. Error edit ditampilkan
    // sebagai toast kecil, bukan mengirim pesan baru yang menumpuk chat.
    try{telegramApi_('answerCallbackQuery',{callback_query_id:q.id,text:result.ok?'':('Gagal memperbarui: '+String(result.error||'unknown')).slice(0,180),show_alert:!result.ok})}catch{}
    return;
  }
  const raw=String(msg?.text||'').trim(),text=normalizeShortcutText_(raw);
  if(['/start','/menu'].includes(raw.toLowerCase())||['menu','shortcut','shortcut information'].includes(text)){sendTelegram_('SHORTCUT INFORMATION\nPilih informasi yang ingin ditinjau.',true);return;}
  const action=shortcutActionFromText_(raw);if(action){sendTelegram_(telegramShortcutText_(action,latestSnapshot_()),true);}
}
function telegramShortcutText_(action,snap){if(!snap)return 'Belum ada snapshot AutoBudgetin. Buka aplikasi dan tunggu sinkronisasi Automation terlebih dahulu.';if(action==='fin:summary')return financeSummaryMessage_(snap);if(action==='fin:today')return financeTodayMessage_(snap);if(action==='fin:usage')return financeUsageMessage_(snap);if(action==='fin:budget')return financeBudgetMessage_(snap);if(action==='fin:savings')return financeSavingsMessage_(snap);if(action==='fin:durability')return financeDurabilityMessage_(snap);if(action==='fin:largest')return financeLargestMessage_(snap);if(action.indexOf('fin:bucket:')===0)return financeBucketMessage_(snap,action.slice('fin:bucket:'.length));return 'Pilih Shortcut Information di bawah.';}
function monthRows_(snap){const month=String(snap.summary?.date||Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM-dd')).slice(0,7);return (snap.data?.trans||[]).filter(x=>String(x.tanggal||'').startsWith(month)&&x.kategori!=='Penyesuaian Saldo');}
function financeSummaryMessage_(snap){const s=snap.summary||{},rows=monthRows_(snap),total=rows.reduce((a,x)=>a+(Number(x.nominal)||0),0),today=todayExpenseFromRows_(snap),safe=Number(s.dailySafe)||dailySafeFallback_(snap);const lines=['RINGKASAN KEUANGAN','',`Saldo tersedia  Rp ${fmt_(s.available||0)}`,`Tabungan        Rp ${fmt_(s.reservedSavings||0)}`,`Keluar bulan ini Rp ${fmt_(total)}`,`Hari ini         Rp ${fmt_(today)}`];if(safe>0)lines.push(`Batas aman hari ini Rp ${fmt_(safe)}`);lines.push(`Financial score ${Math.round(Number(s.score)||0)}/100`);return lines.join('\n');}
function financeTodayMessage_(snap){const s=snap.summary||{},rows=(snap.data?.trans||[]).filter(x=>String(x.tanggal||'')===String(s.date||'')),total=rows.reduce((a,x)=>a+(Number(x.nominal)||0),0),safe=Number(s.dailySafe)||dailySafeFallback_(snap);const lines=['PEMAKAIAN HARI INI','',`Total  Rp ${fmt_(total)}`,safe>0?`Batas aman  Rp ${fmt_(safe)}`:'Batas aman belum tersedia'];rows.slice(0,8).forEach(x=>lines.push(`· ${x.catatan||x.kategori} — Rp ${fmt_(x.nominal)}`));if(!rows.length)lines.push('Belum ada pengeluaran hari ini.');return lines.join('\n');}
function financeSavingsMessage_(snap){const s=snap.summary||{},goals=snap.data?.goals||[];const lines=['TABUNGAN & GOAL','',`Tabungan dicadangkan  Rp ${fmt_(s.reservedSavings||0)}`];goals.slice(0,8).forEach(g=>{const saved=Number(g.saved)||0,target=Number(g.target)||0,p=target?Math.round(saved/target*100):0;lines.push(`· ${g.name||'Goal'} — Rp ${fmt_(saved)} / Rp ${fmt_(target)} (${p}%)`)});if(!goals.length)lines.push('Belum ada goal tersimpan.');return lines.join('\n');}
function financeUsageMessage_(snap){const rows=monthRows_(snap),groups={};rows.forEach(x=>{const b=String(x.budgetBucket||bucketFor_(x));groups[b]=(groups[b]||0)+(Number(x.nominal)||0)});const total=Object.values(groups).reduce((a,n)=>a+n,0);const lines=['PEMAKAIAN BULAN INI',`Total Rp ${fmt_(total)}`,''];Object.entries(groups).sort((a,b)=>b[1]-a[1]).forEach(([b,n])=>lines.push(`· ${b}: Rp ${fmt_(n)}${total?` · ${Math.round(n/total*100)}%`:''}`));if(!rows.length)lines.push('Belum ada pengeluaran bulan ini.');return lines.join('\n');}
function financeBucketMessage_(snap,bucket){const rows=monthRows_(snap).filter(x=>String(x.budgetBucket||bucketFor_(x))===bucket).sort((a,b)=>Number(b.nominal||0)-Number(a.nominal||0)),total=rows.reduce((a,x)=>a+(Number(x.nominal)||0),0);const lines=[String(bucket).toUpperCase(),`Total Rp ${fmt_(total)} · ${rows.length} transaksi`,''];rows.slice(0,10).forEach(x=>lines.push(`· ${x.catatan||x.kategori}: Rp ${fmt_(x.nominal)} · ${humanDate_(x.tanggal)}`));if(rows.length>10)lines.push(`+${rows.length-10} transaksi lainnya`);if(!rows.length)lines.push('Belum ada transaksi di kategori ini.');return lines.join('\n');}
function financeBudgetMessage_(snap){const rows=monthRows_(snap),limits=snap.data?.limits||{},byCat={};rows.forEach(x=>byCat[x.kategori]=(byCat[x.kategori]||0)+(Number(x.nominal)||0));const entries=Object.entries(limits).filter(([,n])=>Number(n)>0);const lines=['BUDGET VS REALISASI',''];entries.forEach(([cat,lim])=>{const used=byCat[cat]||0,p=Math.round(used/Number(lim)*100);lines.push(`· ${cat}: Rp ${fmt_(used)} / Rp ${fmt_(lim)} · ${p}%`)});if(!entries.length)lines.push('Belum ada limit budget tersimpan.');return lines.join('\n');}
function financeDurabilityMessage_(snap){const all=snap.data?.trans||[],rows=monthRows_(snap).map(x=>({x,u:autoUsageInfo_(x,all)})).filter(o=>o.u.enabled||Number(o.x.usageDays)>0).sort((a,b)=>(b.u.enabled?b.u.perDay:(Number(b.x.nominal)||0)/Math.max(1,Number(b.x.usageDays)||1))-(a.u.enabled?a.u.perDay:(Number(a.x.nominal)||0)/Math.max(1,Number(a.x.usageDays)||1)));const lines=['DURASI PEMAKAIAN',''];rows.slice(0,10).forEach(({x,u})=>{const days=u.enabled?u.days:Number(x.usageDays),per=u.enabled?u.perDay:(Number(x.nominal)||0)/Math.max(1,days);lines.push(`· ${x.catatan||x.kategori}: ${days} hari${u.enabled&&u.active?' berjalan':' selesai'} · Rp ${fmt_(per)}/hari`)});if(!rows.length)lines.push('Belum ada transaksi dengan durasi otomatis.');return lines.join('\n');}
function financeLargestMessage_(snap){const rows=monthRows_(snap).sort((a,b)=>Number(b.nominal||0)-Number(a.nominal||0));const lines=['TRANSAKSI TERBESAR',''];rows.slice(0,10).forEach((x,i)=>lines.push(`${i+1}. ${x.catatan||x.kategori} — Rp ${fmt_(x.nominal)} · ${humanDate_(x.tanggal)}`));if(!rows.length)lines.push('Belum ada transaksi bulan ini.');return lines.join('\n');}
function log_(id,msg){const sh=SpreadsheetApp.getActive().getSheetByName(DB.logs);sh.appendRow([new Date(),id,msg]);}
function wipeDatabase_(){ensureSheetsSafe_();[DB.snapshot,DB.expenses,DB.incomes,DB.transfers,DB.goals,DB.recurring,DB.budgets,DB.bills].forEach(n=>{const sh=SpreadsheetApp.getActive().getSheetByName(n);if(sh)sh.clearContents()});ensureHeaders_();}
function fmt_(n){return Math.round(Number(n)||0).toLocaleString('id-ID');}
