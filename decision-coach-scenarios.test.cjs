'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'agis_finance_v26_decision_lab';
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');

function runtime(seed = {}) {
  const storage = new Map([[KEY, JSON.stringify(seed)]]);
  const swal = [];
  const document = {
    readyState: 'loading',
    addEventListener() {},
    querySelectorAll() { return []; },
    getElementById() { return null; }
  };
  const context = {
    window: {}, document, console, JSON, Math, Number, String, Date, Intl,
    setTimeout() {}, clearTimeout() {},
    localStorage: {
      getItem(k) { return storage.get(k) ?? null; },
      setItem(k,v) { storage.set(k, String(v)); },
      removeItem(k) { storage.delete(k); }
    },
    Swal: { fire(...args) { swal.push(args); return Promise.resolve({isConfirmed:true}); } }
  };
  vm.createContext(context);
  vm.runInContext(read('v26-decision-lab.js'), context, {filename:'v26-decision-lab.js'});
  return { w: context.window, state: () => JSON.parse(storage.get(KEY)), set: v => storage.set(KEY, JSON.stringify(v)), swal };
}

const businessDraft = {
  name:'Kopi Susu',capitalAvailable:500000,setupCost:100000,fixedMonthly:100000,initialStock:20,
  material:2500,packaging:500,labor:0,operational:500,otherUnit:0,
  salePrice:8000,unitsPerDay:15,daysPerMonth:26,targetMargin:30
};
const creditDraft = {name:'Laptop',cashPrice:6000000,downPayment:1000000,adminFee:100000,interest:12,months:12,method:'flat'};
const profile = {salary:5000000,food:1000000,fuel:300000,otherEssential:500000,existingDebt:0,savingTarget:500000};

test('new business save clears form and saved scenario can be reloaded then updated in place', () => {
  const app = runtime({ businessDraft, profile });
  app.w.saveBusinessV26();
  let s = app.state();
  assert.equal(s.businesses.length, 1);
  const id = s.businesses[0].id;
  assert.equal(s.businesses[0].data.name, 'Kopi Susu');
  assert.equal(s.businessDraft.name, '');
  assert.equal(s.businessDraft.salePrice, '');
  assert.equal(s.businessDraft.unitsPerDay, '');
  assert.equal(s.businessDraft.daysPerMonth, '');
  assert.equal(s.businessDraft.targetMargin, '');
  assert.equal(s.editingBusinessId, '');

  app.w.loadBusinessV26(id);
  s = app.state();
  assert.equal(s.editingBusinessId, id);
  assert.equal(s.businessDraft.name, 'Kopi Susu');
  assert.equal(s.businessDraft.salePrice, 8000);

  s.businessDraft.salePrice = 9000;
  app.set(s);
  app.w.saveBusinessV26();
  s = app.state();
  assert.equal(s.businesses.length, 1, 'edit must not create duplicate');
  assert.equal(s.businesses[0].id, id, 'editing preserves source ID for tracking links');
  assert.equal(s.businesses[0].data.salePrice, 9000);
  assert.ok(s.businesses[0].updatedAt > 0);
  assert.equal(s.businessDraft.name, '');
  assert.equal(s.editingBusinessId, '');
});

test('credit scenario follows the same save-clear-load-edit-update flow', () => {
  const app = runtime({ creditDraft, profile });
  app.w.saveCreditV26();
  let s = app.state();
  assert.equal(s.credits.length, 1);
  const id = s.credits[0].id;
  assert.equal(s.creditDraft.name, '');
  assert.equal(s.creditDraft.months, '');
  app.w.loadCreditV26(id);
  s = app.state();
  assert.equal(s.editingCreditId, id);
  assert.equal(s.creditDraft.cashPrice, 6000000);
  s.creditDraft.downPayment = 1500000;
  app.set(s);
  app.w.saveCreditV26();
  s = app.state();
  assert.equal(s.credits.length, 1);
  assert.equal(s.credits[0].id, id);
  assert.equal(s.credits[0].data.downPayment, 1500000);
  assert.equal(s.creditDraft.name, '');
  assert.equal(s.editingCreditId, '');
});

test('Decision Coach is present for business and credit and CSS includes responsive coach layout', () => {
  const js = read('v26-decision-lab.js');
  const css = read('v26-decision-lab.css');
  assert.match(js, /DECISION COACH/);
  assert.match(js, /businessCoach\(/);
  assert.match(js, /creditCoach\(/);
  assert.match(js, /v26-business-coach/);
  assert.match(js, /v26-credit-coach/);
  assert.match(css, /\.v26-coach-actions/);
  assert.match(css, /@media \(min-width:760px\)/);
  assert.match(css, /@media \(max-width:350px\)/);
});

test('Decision Lab v26.0.5 JS and CSS are cache-busted and available offline', () => {
  const html = read('index.html');
  const shell = vm.runInNewContext(read('service-worker.js') + '\n({CACHE_NAME, APP_SHELL});', { self:{addEventListener(){}} });
  for (const asset of ['./v26-decision-lab.js?v=26.0.5','./v26-decision-lab.css?v=26.0.5']) {
    assert.ok(html.includes(asset));
    assert.ok(shell.APP_SHELL.includes(asset));
  }
  assert.equal(shell.CACHE_NAME, 'agis-finance-v26-0-5-decision-coach');
});

test('Decision Coach reacts to scenario quality instead of returning static advice', () => {
  let src = read('v26-decision-lab.js');
  src = src.replace(/\}\)\(\);\s*$/, "window.__calcBusiness=calcBusiness;window.__businessCoach=businessCoach;window.__calcCredit=calcCredit;window.__creditCoach=creditCoach;})();");
  const storage = new Map();
  const context = {
    window:{}, document:{readyState:'loading',addEventListener(){}}, console, JSON, Math, Number, String, Date, Intl,
    setTimeout(){}, clearTimeout(){},
    localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}
  };
  vm.createContext(context); vm.runInContext(src, context);
  const good = {...businessDraft};
  const bad = {...businessDraft, capitalAvailable:50000, salePrice:2500};
  const gc = context.window.__businessCoach(good, context.window.__calcBusiness(good));
  const bc = context.window.__businessCoach(bad, context.window.__calcBusiness(bad));
  assert.ok(gc.score > bc.score);
  assert.equal(gc.tone, 'good');
  assert.equal(bc.tone, 'bad');
  assert.ok(bc.actions.length >= 1);
});
