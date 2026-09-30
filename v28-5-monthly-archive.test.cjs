'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const js=fs.readFileSync('v28-5-monthly-archive.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const auto=fs.readFileSync('v24-5-automation.js','utf8');
const tg=fs.readFileSync('telegram-database-backend.gs','utf8');
const checks=[
 ['archive is non destructive',/archives:\{\},closed:\{\},openingBalances:\{\}/],
 ['same-period comparison',/prevStart=shiftMonthDate\(start,-1\).*prevEnd=shiftMonthDate\(end,-1\)/s],
 ['7 14 mtd modes',/mode==='7d'.*mode==='14d'.*Bulan berjalan/s],
 ['monthly close',/closeCurrentMonthV285/],
 ['opening balance',/setOpeningBalanceV285/],
 ['archive UI',/openMonthlyArchiveV285/],
 ['responsive assets linked',/v28-5-monthly-archive\.css\?v=28\.5\.0/.test(html)&&/v28-5-monthly-archive\.js\?v=28\.5\.0/.test(html)],
 ['automation snapshots archive',/monthlyArchive:/.test(auto)&&/periodComparison:/.test(auto)],
 ['telegram comparison shortcut',/fin:compare/.test(tg)&&/financeComparisonMessage_/.test(tg)]
];
let bad=0;for(const [n,ok] of checks){console.log((ok?'PASS ':'FAIL ')+n);if(!ok)bad++;}
const storage=new Map();
const context={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null}},console,Date,Intl,Math,Number,String,JSON,Set,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))},localDateKey:()=> '2026-09-14',fmt:n=>'Rp '+Math.round(Number(n)||0),store:{trans:[
 {id:'cur',tanggal:'2026-09-05',kategori:'Makan & Minum',budgetBucket:'Makan Pokok',nominal:250000,createdAt:2},
 {id:'prev',tanggal:'2026-08-05',kategori:'Makan & Minum',budgetBucket:'Makan Pokok',nominal:200000,createdAt:1}
],incomes:[],transfers:[],wallets:{Tunai:0,Bank:0,'E-Wallet':0}},setTimeout(){},clearTimeout(){}};
context.window=context;vm.createContext(context);vm.runInContext(js,context,{filename:'v28-5-monthly-archive.js'});
const c=context.getPeriodComparisonV285('mtd');
try{assert.equal(c.totalCurrent,250000);assert.equal(c.totalPrevious,200000);assert.equal(c.current['Makan Pokok'],250000);assert.equal(c.previous['Makan Pokok'],200000);console.log('PASS comparison logic 250k vs 200k = +25% source totals')}catch(e){console.error('FAIL comparison logic',e);bad++;}
process.exitCode=bad?1:0;
