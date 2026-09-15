'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');

test('Stable+ tracking stays inside v26 Decision Lab storage', () => {
  const js = read('v26-stable-tracking.js');
  assert.match(js, /const ROOT_KEY = 'agis_finance_v26_decision_lab'/);
  assert.match(js, /const TRACK_KEY = 'trackingStable'/);
  assert.doesNotMatch(js, /agis_finance_v27_tracking/);
  assert.match(js, /window\.getStableTrackingData/);
});

test('Stable+ includes business realization and milestone protections', () => {
  const js = read('v26-stable-tracking.js');
  for (const token of [
    'KALENDER PENJUALAN', 'Omzet aktual', 'Profit produk', 'TARGET ADAPTIF',
    'RINGKASAN 7 HARI', 'Tambah stok', 'Target keuntungan',
    'Balik modal tercapai', 'Target keuntungan tercapai', 'Target penjualan tercapai'
  ]) assert.ok(js.includes(token), token);
});

test('Stable+ credit tracking locks paid loans and blocks overpayment', () => {
  const js = read('v26-stable-tracking.js');
  assert.ok(js.includes('Lunas · pembayaran dikunci'));
  assert.ok(js.includes('Nominal terlalu besar'));
  assert.ok(js.includes('Cicilan lunas!'));
  assert.ok(js.includes('input pembayaran akan terbuka kembali otomatis'));
});

test('integration only adds isolated v26 add-on assets', () => {
  const html = read('index.html');
  assert.ok(html.includes('v26-stable-tracking.css?v=26.0.2'));
  assert.ok(html.includes('v26-stable-tracking.js?v=26.0.2'));
  assert.ok(html.includes('v26-tracking-money-format.js?v=26.0.2'));
  assert.ok(!html.includes('v27-tracking.js'));
  assert.ok(!html.includes('v27-safe-bridge.js'));
});
