const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const root = __dirname;
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const js = fs.readFileSync(path.join(root,'v28-auto-budget-review.js'),'utf8');

assert(html.includes('id="t-auto-usage"'), 'checkbox auto usage harus ada');
assert(!html.includes('id="t-usage-days"'), 'input hari manual harus dihapus');
assert(html.includes("autoUsage:!!document.getElementById('t-auto-usage')?.checked"), 'transaksi harus menyimpan flag autoUsage');

global.window = global;
global.document = { readyState:'loading', addEventListener(){} };
global.localStorage = { getItem(){return null}, setItem(){} };
global.localDateKey = () => '2026-09-25';
global.fmt = n => `Rp ${Math.round(Number(n)||0)}`;
global.store = { trans: [
  {id:'fuel-1',tanggal:'2026-09-01',createdAt:1,kategori:'Transportasi',budgetBucket:'Transportasi',catatan:'Bensin',nominal:30000,autoUsage:true},
  {id:'fuel-2',tanggal:'2026-09-06',createdAt:2,kategori:'Transportasi',budgetBucket:'Transportasi',catatan:'bensin',nominal:30000,autoUsage:true},
  {id:'fuel-3',tanggal:'2026-09-12',createdAt:3,kategori:'Transportasi',budgetBucket:'Transportasi',catatan:'BENSIN',nominal:35000,autoUsage:false},
  {id:'egg-1',tanggal:'2026-09-20',createdAt:4,kategori:'Makan & Minum',budgetBucket:'Makan Pokok',catatan:'Telur',nominal:35000,autoUsage:true},
] };
vm.runInThisContext(js, {filename:'v28-auto-budget-review.js'});

const first = global.getAutoUsageInfoV282(store.trans[0]);
assert.equal(first.days, 5, '1 Sep sampai pembelian 6 Sep harus 5 hari');
assert.equal(first.active, false, 'pembelian lama harus selesai ketika ada pembelian berikutnya');
assert.equal(Math.round(first.perDay), 6000, 'Rp30k / 5 hari harus Rp6k/hari');

const second = global.getAutoUsageInfoV282(store.trans[1]);
assert.equal(second.days, 6, 'transaksi 6 Sep harus berhenti pada transaksi bensin berikutnya 12 Sep walaupun autoUsage berikutnya tidak dicentang');
assert.equal(second.active, false);

const egg = global.getAutoUsageInfoV282(store.trans[3]);
assert.equal(egg.days, 5, 'transaksi aktif 20 Sep sampai hari ini 25 Sep harus 5 hari berjalan');
assert.equal(egg.active, true, 'transaksi terbaru tanpa pembelian berikutnya harus tetap berjalan');

console.log('auto usage duration v28.2: PASS');
