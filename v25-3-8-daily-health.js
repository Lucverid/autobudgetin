(() => {
  'use strict';

  // v25.3.8: seluruh Health Pulse mengikuti kondisi pengeluaran HARI INI.
  // Tempo, warna, angka /100, dan label sekarang berasal dari rasio
  // pengeluaran hari ini terhadap batas aman harian yang sama.

  let internalScoreWrite = false;

  function conditionFromScore(score) {
    if (score >= 80) return { key: 'healthy', label: 'SEHAT' };
    if (score >= 60) return { key: 'okay', label: 'CUKUP' };
    if (score >= 40) return { key: 'warn', label: 'WASPADA' };
    return { key: 'critical', label: 'KRITIS' };
  }

  function parseRupiah(text) {
    const raw = String(text || '').trim();
    if (!raw) return 0;
    const digits = raw.replace(/[^0-9-]/g, '');
    const n = Number(digits);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }

  function readDailySafeLimit() {
    const note = document.getElementById('home-safe-note')?.textContent || '';
    // Contoh: "Batas Rp 33.000 · sudah keluar Rp 20.000"
    const match = note.match(/Batas\s+(?:Rp\s*)?([0-9][0-9.]*)/i);
    if (match) return parseRupiah(match[1]);

    const remaining = parseRupiah(document.getElementById('home-safe-today')?.textContent);
    const spent = parseRupiah(document.getElementById('home-spent-today')?.textContent);
    return remaining + spent;
  }

  function dailyHealthScore(spent, safeLimit) {
    if (safeLimit <= 0) {
      return spent > 0 ? 0 : 100;
    }

    const ratio = Math.max(0, spent / safeLimit);

    // 0% budget terpakai   => 100/100
    // 50% budget terpakai  => 70/100
    // 100% budget terpakai => 40/100 (waspada, belum over)
    // 125%                 => 20/100
    // >=150%               => 0/100
    const score = ratio <= 1
      ? 100 - (60 * ratio)
      : 40 - (80 * (ratio - 1));

    return Math.max(0, Math.min(100, score));
  }

  function dailyPulseProfile(spent, safeLimit) {
    if (safeLimit <= 0) {
      if (spent <= 0) return { ratio: 0, key: 'calm', heart: 1.90, ecg: 4.00 };
      return { ratio: Infinity, key: 'over', heart: 0.70, ecg: 1.35 };
    }

    const ratio = Math.max(0, spent / safeLimit);
    let key = 'calm';
    if (ratio > 1) key = 'over';
    else if (ratio >= 0.80) key = 'warn';
    else if (ratio >= 0.50) key = 'normal';

    const stress = Math.min(1.6, ratio) / 1.6;
    return {
      ratio,
      key,
      heart: 1.90 - (1.20 * stress),
      ecg: 4.00 - (2.65 * stress)
    };
  }

  function setVisibleScore(scoreEl, score) {
    const value = String(Math.round(score));
    if (String(scoreEl.textContent || '').trim() === value) return;
    internalScoreWrite = true;
    scoreEl.textContent = value;
    queueMicrotask(() => { internalScoreWrite = false; });
  }

  function syncDailyHealth() {
    const card = document.getElementById('v244-score-card');
    const scoreEl = document.getElementById('v244-score');
    const labelEl = document.getElementById('v253-condition-label');
    if (!card || !scoreEl) return;

    const spentToday = parseRupiah(document.getElementById('home-spent-today')?.textContent);
    const safeLimit = readDailySafeLimit();
    const dailyScore = dailyHealthScore(spentToday, safeLimit);
    const state = conditionFromScore(dailyScore);
    const pulse = dailyPulseProfile(spentToday, safeLimit);

    // Semua indikator visual memakai sumber kondisi harian yang sama.
    setVisibleScore(scoreEl, dailyScore);
    card.dataset.grade = state.key;
    card.dataset.dailyPulse = pulse.key;
    card.style.setProperty('--v253-heart-duration', `${pulse.heart.toFixed(2)}s`);
    card.style.setProperty('--v253-ecg-duration', `${pulse.ecg.toFixed(2)}s`);
    card.dataset.pulseSpeed = pulse.heart.toFixed(2);
    card.dataset.dailyScore = String(Math.round(dailyScore));

    if (labelEl) labelEl.textContent = state.label;

    const usagePct = safeLimit > 0
      ? Math.round((spentToday / safeLimit) * 100)
      : (spentToday > 0 ? 100 : 0);

    const dailyText = safeLimit > 0
      ? `${usagePct}% dari batas aman harian`
      : (spentToday > 0 ? 'melewati batas aman harian' : 'belum ada pengeluaran hari ini');

    card.setAttribute(
      'aria-label',
      `Kondisi pengeluaran hari ini ${state.label}, skor ${Math.round(dailyScore)} dari 100. Pengeluaran hari ini ${dailyText}.`
    );
  }

  function observe(el, marker) {
    if (!el || el.dataset[marker]) return;
    el.dataset[marker] = '1';
    new MutationObserver(() => {
      if (marker === 'v2538ScoreObserver' && internalScoreWrite) return;
      // Biarkan render utama selesai dulu, lalu timpa skor lama dengan kondisi harian terbaru.
      setTimeout(syncDailyHealth, 0);
    }).observe(el, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  function init() {
    const scoreEl = document.getElementById('v244-score');
    if (!scoreEl) return;

    syncDailyHealth();
    observe(scoreEl, 'v2538ScoreObserver');
    observe(document.getElementById('home-spent-today'), 'v2538SpentObserver');
    observe(document.getElementById('home-safe-today'), 'v2538SafeObserver');
    observe(document.getElementById('home-safe-note'), 'v2538NoteObserver');

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) setTimeout(syncDailyHealth, 40);
    });
    window.addEventListener('online', () => setTimeout(syncDailyHealth, 80));
    window.addEventListener('offline', () => setTimeout(syncDailyHealth, 80));

    // Render transaksi/sync bisa datang sedikit setelah DOM berubah.
    setTimeout(syncDailyHealth, 900);
    setTimeout(syncDailyHealth, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 650));
  } else {
    setTimeout(init, 650);
  }
})();
