'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');

test('planning feature switcher exposes the four compact tools', () => {
  const js = read('v26-feature-switcher.js');
  for (const label of ['Decision Lab', 'Realisasi', 'What-if', 'Laporan']) {
    assert.ok(js.includes(label), label);
  }
  assert.match(js, /agis_finance_feature_switcher_v26/);
  assert.match(js, /v26-stable-tracking/);
  assert.match(js, /v26fs-tracking-mode/);
  assert.match(js, /refreshStableTracking/);
});

test('feature switcher is additive and precached for offline mode', () => {
  const html = read('index.html');
  const shell = Function('self', read('service-worker.js') + '\nreturn {CACHE_NAME, APP_SHELL};')({ addEventListener() {} });
  for (const asset of ['./v26-feature-switcher.css?v=26.0.3', './v26-feature-switcher.js?v=26.0.3']) {
    assert.ok(html.includes(asset), 'HTML reference: ' + asset);
    assert.ok(shell.APP_SHELL.includes(asset), 'offline cache: ' + asset);
  }
  assert.equal(shell.CACHE_NAME, 'agis-finance-v26-0-4-nominal-fix');
});

test('database and Decision Lab storage remain untouched by the UI switcher', () => {
  const js = read('v26-feature-switcher.js');
  assert.doesNotMatch(js, /firebase|firestore|setDoc|updateDoc|deleteDoc/i);
  assert.doesNotMatch(js, /agis_finance_v26_decision_lab/);
  assert.doesNotMatch(js, /trackingStable/);
});
