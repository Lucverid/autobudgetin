const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function loadSafeToday() {
  const match = html.match(/function calculateSafeToday\(disposableNow, remainingDays, spentToday\) \{[\s\S]*?\n    \}/);
  assert.ok(match, 'calculateSafeToday helper must exist');
  const context = {};
  vm.runInNewContext(`${match[0]}; this.fn = calculateSafeToday;`, context);
  return context.fn;
}

test('Aman Hari Ini does not double-count today spending', () => {
  const calc = loadSafeToday();
  const start = calc(1_000_000, 10, 0);
  assert.equal(start.dailyLimit, 100_000);
  assert.equal(start.remaining, 100_000);

  // After Rp30k expense, current disposable is Rp970k. Full-day cap stays Rp100k.
  const after30 = calc(970_000, 10, 30_000);
  assert.equal(after30.dailyLimit, 100_000);
  assert.equal(after30.remaining, 70_000);

  // At the cap, remaining safe amount is exactly zero.
  const atLimit = calc(900_000, 10, 100_000);
  assert.equal(atLimit.dailyLimit, 100_000);
  assert.equal(atLimit.remaining, 0);
});

test('safe-today helper clamps negative spendable money and never returns negative remaining', () => {
  const calc = loadSafeToday();
  const result = calc(-50_000, 5, 20_000);
  assert.equal(result.dailyLimit, 4_000);
  assert.equal(result.remaining, 0);
});

test('automation snapshot reuses the same safe-today helper when available', () => {
  const automation = fs.readFileSync(path.join(root, 'v24-5-automation.js'), 'utf8');
  assert.match(automation, /window\.calculateSafeToday\(spendableNow,remainingDays,todayExpense\)\.dailyLimit/);
});
