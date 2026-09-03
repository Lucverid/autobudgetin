/**
 * Agis Finance v24.5 — Google Apps Script backend
 * 100% usable on a normal Google account without enabling Cloud Billing.
 * Bind this script to a Google Sheet, then deploy as Web App.
 */
const DB = {
  config: 'Config', snapshot: 'Snapshot', expenses: 'Expenses', incomes: 'Incomes',
  transfers: 'Transfers', goals: 'Goals', recurring: 'Recurring', logs: 'Notification Log'
};

function onOpen(){ SpreadsheetApp.getUi().createMenu('Agis Finance').addItem('Setup database','setupAgisFinance').addItem('Simpan secret dari Config','saveSecretsFromConfig').addItem('Tes Telegram','testTelegramFromSheet').addToUi(); }

function setupAgisFinance(){
  const ss=SpreadsheetApp.getActive();
  Object.values(DB).forEach(n=>{if(!ss.getSheetByName(n))ss.insertSheet(n)});
  const cfg=ss.getSheetByName(DB.config); cfg.clear();
  cfg.getRange('A1:B7').setValues([
    ['AGIS FINANCE v24.5','AUTOMATION CONFIG'],
    ['BOT_TOKEN','tempel token bot di B2 lalu jalankan "Simpan secret"'],
    ['CHAT_ID','tempel chat id di B3'],
    ['APP_KEY','buat password acak sendiri di B4'],
    ['WEEKLY_DAY','MONDAY'],['WEEKLY_HOUR','8'],['CHECK_EVERY_HOUR','ACTIVE']
  ]);
  cfg.setFrozenRows(1); styleHeader_(cfg,2);
  ensureHeaders_();
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='scheduledCheck').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('scheduledCheck').timeBased().everyHours(1).create();
  SpreadsheetApp.getUi().alert('Setup selesai. Isi B2–B4 di Config, lalu menu Agis Finance → Simpan secret dari Config.');
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
}
function ensureSheetsSafe_(){const ss=SpreadsheetApp.getActive();Object.values(DB).forEach(n=>{if(!ss.getSheetByName(n))ss.insertSheet(n)});}
function latestSnapshot_(){const sh=SpreadsheetApp.getActive().getSheetByName(DB.snapshot);if(!sh||sh.getLastRow()<2)return null;const raw=sh.getRange(2,9).getValue();try{return JSON.parse(raw)}catch{return null}}

function scheduledCheck(){const snap=latestSnapshot_();if(snap)checkSnapshot_(snap,true);}
function checkSnapshot_(snap,scheduled){
  const s=snap.summary||{}, today=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM-dd');
  if(Number(s.safeFloor)>0&&Number(s.available)<Number(s.safeFloor))notifyOnce_('floor:'+today,`⚠️ Safe Floor terlewati\nSaldo tersedia Rp ${fmt_(s.available)}\nSafe Floor Rp ${fmt_(s.safeFloor)}`);
  if(Number(s.score)<40)notifyOnce_('score:'+today,`🔴 Financial Score kritis: ${Math.round(Number(s.score)||0)}/100`);
  if(s.recovery&&Number(s.recovery.pct)>=100)notifyOnce_('recovery:'+(s.recovery.createdAt||s.recovery.startDate||s.recovery.name),`🎯 Recovery selesai\n${s.recovery.name||'Target'} sudah 100% pulih.`);
  const last=s.latestExpense;if(last&&last.id){const key='latest-expense-notified';const props=PropertiesService.getScriptProperties();if(props.getProperty(key)!==String(last.id)){props.setProperty(key,String(last.id));const amount=Number(last.nominal)||0;if(amount>=50000)sendTelegram_(`💸 Transaksi baru\n${last.kategori||'Pengeluaran'} · Rp ${fmt_(amount)}\n${last.tanggal||''}`);}}
  if(scheduled){const now=new Date(),dow=Utilities.formatDate(now,Session.getScriptTimeZone()||'Asia/Jakarta','EEEE').toUpperCase(),hour=Number(Utilities.formatDate(now,Session.getScriptTimeZone()||'Asia/Jakarta','H'));if(dow==='MONDAY'&&hour===8){const week=Utilities.formatDate(now,Session.getScriptTimeZone()||'Asia/Jakarta','YYYY-ww');notifyOnce_('weekly:'+week,weeklyMessage_(snap));}}
}
function weeklyMessage_(snap){const rows=snap.data?.trans||[],now=new Date(),cut=new Date(now.getTime()-7*86400000);let total=0;const cats={};rows.forEach(x=>{const d=new Date((x.tanggal||'1970-01-01')+'T00:00:00');if(d>=cut){const n=Number(x.nominal)||0;total+=n;cats[x.kategori||'Lainnya']=(cats[x.kategori||'Lainnya']||0)+n}});const top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];return `📊 Weekly Review\n7 hari keluar Rp ${fmt_(total)}${top?`\nTerbesar: ${top[0]} Rp ${fmt_(top[1])}`:''}\nScore ${Math.round(Number(snap.summary?.score)||0)}/100 · Carry-over Rp ${fmt_(snap.summary?.carryOver||0)}`;}
function notifyOnce_(id,msg){const p=PropertiesService.getScriptProperties();if(p.getProperty('N:'+id))return;p.setProperty('N:'+id,new Date().toISOString());sendTelegram_(msg);log_(id,msg)}
function sendTelegram_(text){const p=PropertiesService.getScriptProperties(),token=p.getProperty('BOT_TOKEN'),chat=p.getProperty('CHAT_ID');if(!token||!chat)throw new Error('BOT_TOKEN/CHAT_ID belum disimpan.');const r=UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'post',contentType:'application/json',payload:JSON.stringify({chat_id:chat,text}),muteHttpExceptions:true});if(r.getResponseCode()>=300)throw new Error('Telegram HTTP '+r.getResponseCode()+': '+r.getContentText());}
function testTelegramFromSheet(){sendTelegram_('✅ Agis Finance v24.5 backend aktif. Notifikasi otomatis siap.');SpreadsheetApp.getUi().alert('Pesan tes dikirim.');}
function log_(id,msg){const sh=SpreadsheetApp.getActive().getSheetByName(DB.logs);sh.appendRow([new Date(),id,msg]);}
function wipeDatabase_(){ensureSheetsSafe_();[DB.snapshot,DB.expenses,DB.incomes,DB.transfers,DB.goals,DB.recurring].forEach(n=>{const sh=SpreadsheetApp.getActive().getSheetByName(n);if(sh)sh.clearContents()});ensureHeaders_();}
function fmt_(n){return Math.round(Number(n)||0).toLocaleString('id-ID');}
