(() => {
  'use strict';

  function condition(score) {
    if (score >= 80) return { key: 'healthy', label: 'SEHAT' };
    if (score >= 60) return { key: 'okay', label: 'CUKUP' };
    if (score >= 40) return { key: 'warn', label: 'WASPADA' };
    return { key: 'critical', label: 'KRITIS' };
  }

  function syncPulse() {
    const card = document.getElementById('v244-score-card');
    const scoreEl = document.getElementById('v244-score');
    const labelEl = document.getElementById('v253-condition-label');
    if (!card || !scoreEl) return;

    const raw = Number(String(scoreEl.textContent || '').replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(raw)) return;
    const score = Math.max(0, Math.min(100, raw));
    const state = condition(score);

    // Higher financial health = calmer beat. Lower score = visibly faster pulse.
    // This is a UI metaphor, not a medical BPM reading.
    const heartDuration = 0.76 + (score / 100) * 1.04; // 0.76s .. 1.80s
    const ecgDuration = 1.45 + (score / 100) * 2.35;  // 1.45s .. 3.80s

    card.dataset.grade = state.key;
    card.style.setProperty('--v253-heart-duration', `${heartDuration.toFixed(2)}s`);
    card.style.setProperty('--v253-ecg-duration', `${ecgDuration.toFixed(2)}s`);
    card.dataset.pulseSpeed = heartDuration.toFixed(2);

    if (labelEl) labelEl.textContent = state.label;
    card.setAttribute('aria-label', `Kondisi keuangan ${state.label}, skor ${Math.round(score)} dari 100`);
  }

  function init() {
    const scoreEl = document.getElementById('v244-score');
    if (!scoreEl) return;
    syncPulse();
    new MutationObserver(syncPulse).observe(scoreEl, {
      childList: true,
      characterData: true,
      subtree: true
    });

    // renderScore can run from several app flows; this catches layout/page refreshes too.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncPulse();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 650));
  } else {
    setTimeout(init, 650);
  }
})();
