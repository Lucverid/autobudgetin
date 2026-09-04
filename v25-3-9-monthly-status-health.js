(() => {
  'use strict';

  // v25.3.9 — Health Pulse follows the exact same MONTHLY pace state as Home STATUS.
  // Primary source: buildSmartInsight() -> AMAN / WASPADA / KRITIS.
  // Score only adds granularity inside that status band; it never contradicts the status.

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function normalizePace(raw) {
    const pace = raw || window.__agisFinancialPace || {};
    return {
      safeDaily: Math.max(0, Number(pace.safeDaily) || 0),
      avg7: Math.max(0, Number(pace.avg7) || 0),
      predictedEnd: Number(pace.predictedEnd) || 0,
      disposable: Number(pace.disposable) || 0,
      remainingDays: Math.max(0, Number(pace.remainingDays) || 0),
      status: String(pace.status || 'AMAN').toUpperCase()
    };
  }

  function scoreForPace(pace) {
    const { status, safeDaily, avg7, predictedEnd, disposable } = pace;
    const pressure = safeDaily > 0 ? avg7 / safeDaily : (avg7 > 0 ? Infinity : 0);

    if (status === 'AMAN') {
      // AMAN always stays in the green 80–100 band.
      // The closer the 7-day pace gets to the warning threshold (115% of safe pace),
      // the closer the score moves toward 80.
      if (avg7 <= 0 || safeDaily <= 0) return 100;
      const normalized = clamp(pressure / 1.15, 0, 1);
      return 100 - (20 * normalized);
    }

    if (status === 'WASPADA') {
      // WASPADA stays inside 45–79. More pace pressure = lower score.
      if (!Number.isFinite(pressure)) return 45;
      const excess = clamp((pressure - 1.15) / 0.85, 0, 1);
      return 79 - (34 * excess);
    }

    // KRITIS stays inside 0–39 and becomes harsher as predicted deficit grows.
    if (disposable <= 0) return 0;
    if (predictedEnd < 0) {
      const deficit = Math.abs(predictedEnd);
      const severity = clamp(deficit / Math.max(1, disposable + deficit), 0, 1);
      return 39 * (1 - severity);
    }
    if (!Number.isFinite(pressure)) return 5;
    const severity = clamp((pressure - 1) / 1.5, 0, 1);
    return 39 - (34 * severity);
  }

  function visualState(status) {
    if (status === 'KRITIS') return { grade: 'critical', label: 'KRITIS' };
    if (status === 'WASPADA') return { grade: 'warn', label: 'WASPADA' };
    return { grade: 'healthy', label: 'AMAN' };
  }

  function syncMonthlyHealth(rawPace) {
    const card = document.getElementById('v244-score-card');
    const scoreEl = document.getElementById('v244-score');
    const labelEl = document.getElementById('v253-condition-label');
    if (!card || !scoreEl) return;

    const pace = normalizePace(rawPace);
    const state = visualState(pace.status);
    const score = clamp(scoreForPace(pace), 0, 100);

    // Mark ownership BEFORE writing score so the legacy score observer cannot
    // replace AMAN/WASPADA/KRITIS with SEHAT/CUKUP.
    card.dataset.healthSource = 'monthly-status';
    card.dataset.grade = state.grade;
    card.dataset.monthlyStatus = pace.status;
    card.dataset.monthlyScore = String(Math.round(score));

    scoreEl.textContent = String(Math.round(score));
    if (labelEl) labelEl.textContent = state.label;

    // Higher monthly health = calmer pulse. Lower monthly health = faster pulse.
    const heartDuration = 0.76 + (score / 100) * 1.04;
    const ecgDuration = 1.45 + (score / 100) * 2.35;
    card.style.setProperty('--v253-heart-duration', `${heartDuration.toFixed(2)}s`);
    card.style.setProperty('--v253-ecg-duration', `${ecgDuration.toFixed(2)}s`);
    card.dataset.pulseSpeed = heartDuration.toFixed(2);

    const paceText = pace.avg7 > 0 && pace.safeDaily > 0
      ? `pace 7 hari ${Math.round((pace.avg7 / pace.safeDaily) * 100)}% dari batas aman bulanan`
      : 'pace bulanan belum punya cukup data';

    card.setAttribute(
      'aria-label',
      `Kondisi keuangan ${state.label}, skor ${Math.round(score)} dari 100, ${paceText}.`
    );
  }

  function init() {
    syncMonthlyHealth(window.__agisFinancialPace);

    document.addEventListener('agis:financial-pace', (event) => {
      syncMonthlyHealth(event.detail);
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncMonthlyHealth(window.__agisFinancialPace);
    });
    window.addEventListener('online', () => setTimeout(() => syncMonthlyHealth(window.__agisFinancialPace), 80));
    window.addEventListener('offline', () => setTimeout(() => syncMonthlyHealth(window.__agisFinancialPace), 80));

    // Late Firestore/local render safety.
    setTimeout(() => syncMonthlyHealth(window.__agisFinancialPace), 900);
    setTimeout(() => syncMonthlyHealth(window.__agisFinancialPace), 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 650));
  } else {
    setTimeout(init, 650);
  }
})();
