'use strict';

// Dependency-free regression tests for the actual layout scripts. The small DOM
// below models childList observers and timers, not rendering or full browser UI.
// Run: node --test tests/planning-layout.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const IDS = {
  budget: 'v25-planning-card', simulator: 'v244-simulator-card',
  lab: 'v26-decision-lab', year: 'year-report'
};
const ORDER = Object.values(IDS);

function fixture({ order = [], lateYear = false, draft = '{}' } = {}) {
  const observers = [], pending = new Set(), timers = [], ready = [];
  const storage = new Map([['agis_finance_v26_decision_lab', draft]]);
  let now = 0, moves = 0, deliveries = 0;
  function changed(target) {
    moves++;
    for (const observer of observers) {
      if (!observer.options.childList) continue;
      let ancestor = target;
      while (ancestor) {
        if (ancestor === observer.target) { pending.add(observer); break; }
        ancestor = observer.options.subtree ? ancestor.parentElement : null;
      }
    }
  }
  class Element {
    constructor(id = '', className = '') {
      this.id = id; this.className = className; this.children = [];
      this.parentElement = null; this.dataset = {}; this.attributes = {};
      this.classList = {
        add: token => {
          const tokens = new Set(this.className.split(/\s+/).filter(Boolean));
          tokens.add(token); this.className = [...tokens].join(' ');
        }
      };
    }
    get nextElementSibling() {
      if (!this.parentElement) return null;
      const siblings = this.parentElement.children;
      return siblings[siblings.indexOf(this) + 1] || null;
    }
    appendChild(node) { return this.insertBefore(node, null); }
    insertBefore(node, before) {
      if (before && before.parentElement !== this) throw new Error('Invalid anchor');
      if (node === before) return node;
      if (node.parentElement) node.remove();
      const index = before ? this.children.indexOf(before) : this.children.length;
      this.children.splice(index, 0, node); node.parentElement = this;
      changed(this); return node;
    }
    remove() {
      const parent = this.parentElement;
      if (!parent) return;
      parent.children.splice(parent.children.indexOf(this), 1);
      this.parentElement = null; changed(parent);
    }
    descendants() { return this.children.flatMap(node => [node, ...node.descendants()]); }
    matches(selector) {
      if (selector.startsWith('#')) return this.id === selector.slice(1);
      if (selector.startsWith('.')) return this.className.split(/\s+/).includes(selector.slice(1));
      return false;
    }
    querySelectorAll(selector) { return this.descendants().filter(node => node.matches(selector)); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    addEventListener() {}
    set innerHTML(value) { this.html = value; changed(this); }
    get innerHTML() { return this.html || ''; }
  }
  const body = new Element('body'), home = new Element('home');
  const settings = new Element('settings'), planning = new Element('planning');
  const host = new Element('v2531-planning-host');
  body.appendChild(home); body.appendChild(settings); body.appendChild(planning);
  planning.appendChild(host);
  // Profile existence keeps these tests scoped to layout, without form parsing.
  settings.appendChild(new Element('v26-profile-card'));
  const cards = Object.fromEntries(Object.entries(IDS).map(([name, id]) =>
    [name, new Element(id, name === 'year' ? 'card v25-year-card' : 'card')]));
  if (order.length) {
    for (const key of order) host.appendChild(cards[key]);
  } else {
    home.appendChild(cards.budget);
    settings.appendChild(cards.simulator);
    if (!lateYear) home.appendChild(cards.year);
  }
  const document = {
    readyState: 'loading',
    getElementById: id => body.descendants().find(node => node.id === id) || null,
    querySelector: selector => body.querySelector(selector),
    querySelectorAll: selector => body.querySelectorAll(selector),
    createElement: () => new Element(),
    addEventListener: (event, callback) => { if (event === 'DOMContentLoaded') ready.push(callback); }
  };
  const context = vm.createContext({
    document, window: {},
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    setTimeout: (callback, delay = 0) => timers.push({ at: now + delay, callback }),
    MutationObserver: class {
      constructor(callback) { this.callback = callback; }
      observe(target, options) { this.target = target; this.options = options; observers.push(this); }
    }
  });
  function flush() {
    let rounds = 0;
    while (pending.size) {
      if (++rounds > 40) throw new Error('Planning observers never settle');
      const batch = [...pending]; pending.clear();
      for (const observer of batch) { deliveries++; observer.callback([]); }
    }
  }
  function run() {
    while (timers.length) {
      timers.sort((a, b) => a.at - b.at);
      const timer = timers.shift(); now = timer.at; timer.callback(); flush();
    }
    flush();
  }
  for (const name of [
    'v25-3-1-quick-transaction.js', 'v25-3-3-financial-plan.js', 'v26-decision-lab.js'
  ]) vm.runInContext(read(name), context, { filename: name, timeout: 1000 });
  for (const callback of ready) { callback(); flush(); }
  run();
  return {
    host, home, cards, document, storage, run, flush,
    order: () => host.children.map(node => node.id),
    mutateResult: () => changed(document.getElementById(IDS.lab)),
    moves: () => moves, deliveries: () => deliveries
  };
}

test('legacy startup timers and both observers converge to one order', () => {
  const app = fixture();
  assert.deepEqual(app.order(), ORDER);
  assert.ok(app.deliveries() < 30, 'bounded observer work');
  const before = app.moves(); app.run();
  assert.equal(app.moves(), before, 'idle layout must not move cards');
});

test('all six simulator/lab/year arrival orders settle', () => {
  for (const order of [
    ['simulator', 'lab', 'year'], ['simulator', 'year', 'lab'],
    ['lab', 'simulator', 'year'], ['lab', 'year', 'simulator'],
    ['year', 'simulator', 'lab'], ['year', 'lab', 'simulator']
  ]) assert.deepEqual(fixture({ order: ['budget', ...order] }).order(), ORDER);
});

test('a yearly report inserted after Decision Lab is positioned correctly', () => {
  const app = fixture({ lateYear: true });
  assert.deepEqual(app.order().filter(id => id !== IDS.budget), [IDS.simulator, IDS.lab]);
  app.home.appendChild(app.cards.year); app.run();
  assert.deepEqual(app.order(), ORDER);
});

test('repeated result updates keep card identity, draft, and layout stable', () => {
  const draft = JSON.stringify({ activeTab: 'credit', creditDraft: { name: 'Laptop', cashPrice: 6000000 } });
  const app = fixture({ draft });
  const lab = app.document.getElementById(IDS.lab);
  const before = app.moves();
  for (let i = 0; i < 50; i++) { app.mutateResult(); app.flush(); }
  assert.equal(app.moves() - before, 50, 'only the 50 intended result changes');
  assert.equal(app.document.getElementById(IDS.lab), lab);
  assert.equal(app.storage.get('agis_finance_v26_decision_lab'), draft);
  assert.deepEqual(app.order(), ORDER);
});

test('removing and reinserting the lab settles without creating duplicate cards', () => {
  const app = fixture();
  app.document.getElementById(IDS.lab).remove(); app.run();
  assert.deepEqual(app.order(), ORDER);
  assert.equal(app.host.querySelectorAll('#v26-decision-lab').length, 1);
});

test('patched scripts bypass old cache URLs and are precached for offline use', () => {
  const html = read('index.html');
  const shell = vm.runInNewContext(read('service-worker.js') + '\n({CACHE_NAME, APP_SHELL});', {
    self: { addEventListener() {} }
  });
  assert.equal(shell.CACHE_NAME, 'agis-finance-v26-1-0-business-targets');
  for (const file of ['v25-3-3-financial-plan.js', 'v26-decision-lab.js']) {
    const url = './' + file + '?v=26.1.0';
    assert.ok(html.includes('src="' + url + '"'), 'versioned HTML reference: ' + file);
    assert.ok(shell.APP_SHELL.includes(url), 'offline cache reference: ' + file);
  }
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g)) {
    assert.ok(fs.existsSync(path.join(ROOT, match[1].split('?')[0])), 'asset exists: ' + match[1]);
    assert.ok(shell.APP_SHELL.includes(match[1]), 'HTML asset is precached: ' + match[1]);
  }
  for (const url of shell.APP_SHELL) assert.ok(fs.existsSync(path.join(ROOT, url.split('?')[0])), url);
});
