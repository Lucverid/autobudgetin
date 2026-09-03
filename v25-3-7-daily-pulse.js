(() => {
  'use strict';

  // v25.3.7: warna/label tetap merepresentasikan Financial Score,
  // sementara tempo heartbeat/ECG mengikuti pace pengeluaran HARI INI.
  // Jadi transaksi hari ini langsung terasa di Health Pulse walau skor bulanan belum berubah banyak.

  function scoreCondition(score) {
    if (score >= 80) return { key: 'healthy', label: 'SEHAT' };
    if (score >= 60) return { key: 'okay', label: 'CUKUP' };
    if (score >= 40) return { key: 'warn', label: 'WASPADA' };
    return { key: 'critical', label: 'KRITIS' };
  }

  function parseRupiah(text) {
    const raw = String(text || '').trim();
    if (!raw) return 0;
    // Tampilan aplikasi memakai format Indonesia, contoh: Rp 33.000.
    const digits = raw.replace(/[^0-9-]/g, '');
    const n = Number(digits);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }

  function readDailySafeLimit() {
    const note = document.getElementById('home-safe-note')?.textContent || '';
    // Contoh: "Batas Rp 33.000 · sudah keluar Rp 20.000"
    const match = note.match(/Batas\s+(?:Rp\s*)?([0-9][0-9.]*)/i);
    if (match) return parseRupiah(match[1]);

    // Fallback: selama belum over-budget, batas = sisa aman + keluar hari ini.
    const remaining = parseRupiah(document.getElementById('home-safe-today')?.textContent);
    const spent = parseRupiah(document.getElementById('home-spent-today')?.textContent);
    return remaining + spent;
  }

  function dailyPulseProfile(spent, safeLimit, fallbackScore) {
    if (safeLimit <= 0) {
      if (spent <= 0) {
        return { ratio: 0, key: 'calm', heart: 1.90, ecg: 4.00 };
      }
      return { ratio: Infinity, key: 'over', heart: 0.70, ecg: 1.35 };
    }

    const ratio = Math.max(0, spent / safeLimit);
    let key = 'calm';
    if (ratio > 1) key = 'over';
    else if (ratio >= 0.80) key = 'warn';
    else if (ratio >= 0.50) key = 'normal';

    // Kurva kontinu: makin mendekati/melewati batas aman harian, makin cepat.
    // 0% => ~1.90s, 100% => ~1.15s, >=160% => ~0.70s.
    const stress = Math.min(1.6, ratio) / 1.6;
    const heart = 1.90 - (1.20 * stress);
    const ecg = 4.00 - (2.65 * stress);

    // Jika DOM harian belum siap, jangan membuat pulse salah: gunakan skor sebagai fallback.
    if (!Number.isFinite(ratio) && Number.isFinite(fallbackScore)) {
      const normalized = Math.max(0, Math.min(100, fallbackScore)) / 100;
      return {
        ratio,
        key,
        heart: 0.76 + normalized * 1.04,
        ecg: 1.45 + normalized * 2.35
      };
    }

    return { ratio, key, heart, ecg };
  }

  function syncPulse() {
    const card = document.getElementById('v244-score-card');
    const scoreEl = document.getElementById('v244-score');
    const labelEl = document.getElementById('v253-condition-label');
    if (!card || !scoreEl) return;

    const rawScore = Number(String(scoreEl.textContent || '').replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(rawScore)) return;
    const score = Math.max(0, Math.min(100, rawScore));
    const scoreState = scoreCondition(score);

    const spentToday = parseRupiah(document.getElementById('home-spent-today')?.textContent);
    const safeLimit = readDailySafeLimit();
    const pulse = dailyPulseProfile(spentToday, safeLimit, score);

    // Label + warna tetap kondisi keuangan keseluruhan.
    card.dataset.grade = scoreState.key;
    if (labelEl) labelEl.textContent = scoreState.label;

    // Tempo khusus mengikuti pengeluaran hari ini.
    card.dataset.dailyPulse = pulse.key;
    card.style.setProperty('--v253-heart-duration', `${pulse.heart.toFixed(2)}s`);
    card.style.setProperty('--v253-ecg-duration', `${pulse.ecg.toFixed(2)}s`);
    card.dataset.pulseSpeed = pulse.heart.toFixed(2);

    const dailyText = safeLimit > 0
      ? `${Math.round((spentToday / safeLimit) * 100)}% dari batas aman harian`
      : (spentToday > 0 ? 'melewati batas aman harian' : 'belum ada pengeluaran hari ini');
    card.setAttribute(
      'aria-label',
      `Kondisi keuangan ${scoreState.label}, skor ${Math.round(score)} dari 100. Pengeluaran hari ini ${dailyText}.`
    );
  }

  function observe(el) {
    if (!el || el.dataset.v2537PulseObserver) return;
    el.dataset.v2537PulseObserver = '1';
    new MutationObserver(syncPulse).observe(el, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  function init() {
    const scoreEl = document.getElementById('v244-score');
    if (!scoreEl) return;

    syncPulse();
    observe(scoreEl);
    observe(document.getElementById('home-spent-today'));
    observe(document.getElementById('home-safe-today'));
    observe(document.getElementById('home-safe-note'));

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncPulse();
    });

    // Firestore/offline render bisa terjadi sangat rapat; satu sync tambahan memastikan
    // state final setelah rangkaian render tetap memakai angka hari ini yang terbaru.
    window.addEventListener('online', () => setTimeout(syncPulse, 80));
    window.addEventListener('offline', () => setTimeout(syncPulse, 80));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 650));
  } else {
    setTimeout(init, 650);
  }
})();
