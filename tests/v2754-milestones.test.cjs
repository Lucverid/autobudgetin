'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'v27-tracking.js'), 'utf8');

function runtime(initialState, formValues = {}) {
  const data = new Map([['agis_finance_v27_tracking', JSON.stringify(initialState)], ['agis_finance_v26_decision_lab', '{}']]);
  const popups = [];
  const inputs = new Map();
  const document = {
    readyState: 'loading',
    addEventListener() {},
    getElementById(id) {
      if (id === 'v27-tracking' || id === 'v26-decision-lab' || id === 'v2531-planning-host') return null;
      if (!inputs.has(id)) inputs.set(id, { value: String(formValues[id] ?? '') });
      return inputs.get(id);
    },
    documentElement: {}
  };
  const localStorage = {
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(k, String(v)); },
    removeItem(k) { data.delete(k); }
  };
  const window = { persistLocalSnapshot() {} };
  const Swal = {
    async fire(...args) {
      popups.push(args);
      const opts = args[0];
      if (opts && typeof opts === 'object' && typeof opts.preConfirm === 'function') {
        return { isConfirmed: true, value: opts.preConfirm() };
      }
      return { isConfirmed: true, value: null };
    }
  };
  const sandbox = {
    window, document, localStorage, Swal, console,
    store: { wallets: {}, goal: 0, incomes: [] },
    Chart: undefined,
    MutationObserver: function(){ this.observe = () => {}; },
    requestAnimationFrame: fn => fn(),
    setTimeout: () => 0,
    clearTimeout() {},
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    Date, Math, Number, String, Object, Array, JSON, Intl
  };
  window.window = window;
  Object.assign(window, { document, localStorage, Swal });
  vm.runInNewContext(SRC, sandbox, { filename: 'v27-tracking.js' });
  return {
    window,
    popups,
    setForm(values) { for (const [k,v] of Object.entries(values)) { const id='sw-'+k; if (!inputs.has(id)) inputs.set(id,{value:''}); inputs.get(id).value=String(v); } },
    state() { return JSON.parse(localStorage.getItem('agis_finance_v27_tracking')); }
  };
}

test('credit locks after payoff and reopens after correcting history', async () => {
  const rt = runtime({
    activeTab:'credit', activeCreditId:'c1', businesses:[], settings:{}, calendarMonths:{}, selectedDates:{}, chartMetrics:{},
    credits:[{id:'c1',name:'Laptop',startDate:'2026-09-01',dueDay:10,installment:100000,months:2,payments:[{id:'p1',date:'2026-09-01',amount:100000}],active:true}]
  });
  rt.setForm({ date:'2026-09-14', amount:'100000', note:'Cicilan terakhir' });
  await rt.window.addPaymentV27('c1');
  let c = rt.state().credits[0];
  assert.equal(c.payments.length, 2);
  assert.ok(c.milestones.paidAt);
  const before = c.payments.length;
  await rt.window.addPaymentV27('c1');
  assert.equal(rt.state().credits[0].payments.length, before, 'cannot add after payoff');
  await rt.window.deletePaymentV27('c1', 'p1');
  c = rt.state().credits[0];
  assert.equal(c.payments.length, 1);
  assert.equal(Boolean(c.milestones.paidAt), false, 'payoff milestone resets after correction reopens credit');
});

test('business celebrates daily target and BEP once', async () => {
  const rt = runtime({
    activeTab:'business', activeBusinessId:'b1', credits:[], settings:{}, calendarMonths:{b1:'2026-09'}, selectedDates:{b1:'2026-09-14'}, chartMetrics:{b1:'qty'},
    businesses:[{id:'b1',name:'Kopi',startDate:'2026-09-14',salePrice:10000,hpp:5000,unitsPerDay:10,originalUnitsPerDay:10,targetProfit:50000,initialStock:30,capitalNeeded:50000,sales:[],stockAdds:[],targetAdjustments:[],active:true}]
  });
  rt.setForm({ date:'2026-09-14', qty:'10', revenue:'100000', reason:'ramai', note:'Tes' });
  await rt.window.addSaleV27('b1','2026-09-14');
  let b=rt.state().businesses[0];
  assert.ok(b.milestones.dailyTargetDates['2026-09-14']);
  assert.ok(b.milestones.bepReachedAt);
  assert.equal(Boolean(b.milestones.targetProfitReachedAt), false);
  const firstMilestones = { ...b.milestones, dailyTargetDates:{...b.milestones.dailyTargetDates} };
  rt.setForm({ date:'2026-09-14', qty:'1', revenue:'10000', reason:'', note:'Tambah' });
  await rt.window.addSaleV27('b1','2026-09-14');
  b=rt.state().businesses[0];
  assert.equal(b.milestones.dailyTargetDates['2026-09-14'], firstMilestones.dailyTargetDates['2026-09-14'], 'daily target is not re-celebrated');
  assert.equal(b.milestones.bepReachedAt, firstMilestones.bepReachedAt, 'BEP is not re-celebrated');
});
