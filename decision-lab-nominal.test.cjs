'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');

function loadHelpers() {
  let src = fs.readFileSync(path.join(ROOT, 'v26-decision-lab.js'), 'utf8');
  src = src.replace(/\}\)\(\);\s*$/, "window.__moneyNum=moneyNum;window.__formatField=formatField;})();");
  const context = {
    window: {},
    document: { readyState: 'loading', addEventListener() {} },
    console,
    setTimeout() {},
    clearTimeout() {},
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    JSON, Math, Number, String, Date, Intl
  };
  vm.createContext(context);
  vm.runInContext(src, context);
  return context.window;
}

test('Decision Lab money parser treats Indonesian separators as thousands, never decimal', () => {
  const w = loadHelpers();
  assert.equal(w.__moneyNum('10.005'), 10005);
  assert.equal(w.__moneyNum('1.0005'), 10005); // transient value that previously became ~1
  assert.equal(w.__moneyNum('1.234.567'), 1234567);
});

test('typing the fifth digit after 1.000 formats to 10.005 instead of collapsing to 1', () => {
  const w = loadHelpers();
  const el = { value: '1.0005', dataset: { v26Type: 'money' } };
  w.__formatField(el);
  assert.equal(el.value, '10.005');
});

test('fixed Decision Lab asset is cache-busted and precached for offline use', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
  assert.ok(html.includes('./v26-decision-lab.js?v=26.0.5'));
  const shell = Function('self', sw + '\nreturn {CACHE_NAME, APP_SHELL};')({ addEventListener() {} });
  assert.ok(shell.APP_SHELL.includes('./v26-decision-lab.js?v=26.0.5'));
  assert.equal(shell.CACHE_NAME, 'agis-finance-v26-0-5-decision-coach');
});
