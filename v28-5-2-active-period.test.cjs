const fs=require('fs'),vm=require('vm'),assert=require('assert');
const js=fs.readFileSync('v28-5-monthly-archive.js','utf8');
const html=fs.readFileSync('index.html','utf8');
function ok(x,m){if(!x)throw new Error(m)}
ok(js.includes('activePeriod'),'activePeriod missing');
ok(js.includes('getActivePeriodV285'),'getter missing');
ok(js.includes('n.activePeriod=nextMonth(mk)'),'close does not advance period');
ok(html.includes('window.getActivePeriodV285?.() || calendarMonthKey'),'dashboard not active-period aware');
ok(html.includes('currentMonthKey!==calendarMonthKey'),'future active-period note missing');
const storage=new Map();
storage.set('agis_finance_monthly_archive_v28_5', JSON.stringify({schemaVersion:1,archives:{'2026-09':{month:'2026-09'}},closed:{'2026-09':{closedAt:100}},openingBalances:{},lastSeenMonth:'2026-09'}));
const ctx={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null}},console,Date,Intl,Math,Number,String,JSON,Set,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))},localDateKey:()=> '2026-09-30',fmt:n=>'Rp '+Math.round(Number(n)||0),store:{trans:[{id:'oct',tanggal:'2026-10-01',kategori:'Makan & Minum',budgetBucket:'Makan Pokok',nominal:50000,createdAt:200}],incomes:[],transfers:[],wallets:{Tunai:250000,Bank:620000,'E-Wallet':0}},setTimeout(){},clearTimeout(){}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(js,ctx);
assert.equal(ctx.getActivePeriodV285(),'2026-10');
const c=ctx.getPeriodComparisonV285('mtd');assert.equal(c.totalCurrent,50000);assert.equal(c.month,'2026-10');
console.log('v28.5.2 active period: PASS');
