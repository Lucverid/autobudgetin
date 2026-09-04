(() => {
  'use strict';

  // v25.3.10 — deterministic monthly Health Pulse engine.
  // One source of truth: the same monthly pace object used by the Home STATUS card.
  // The visible score is deterministic and is re-applied after every app render so
  // legacy Financial Score rendering cannot overwrite it.

  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  let currentPace = null;
  let internalScoreWrite = false;
  let syncQueued = false;

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

  function effectiveStatus(pace) {
    // END only means the actual available balance shown on Home is exhausted.
    // A negative forecast alone remains KRITIS, not END.
    if (pace.disposable <= 0) return 'END';
    if (pace.status === 'KRITIS') return 'KRITIS';
    if (pace.status === 'WASPADA') return 'WASPADA';
    return 'AMAN';
  }

  function deterministicScore(pace, status) {
    if (status === 'END') return 0;

    const pressure = pace.safeDaily > 0
      ? pace.avg7 / pace.safeDaily
      : (pace.avg7 > 0 ? Infinity : 0);

    if (status === 'AMAN') {
      // Fixed AMAN band: 80–100. Reserve + 7-day pace decide the exact point.
      const reserve = pace.disposable > 0
        ? clamp(pace.predictedEnd / pace.disposable, 0, 1)
        : 0;
      const paceRoom = pace.avg7 <= 0
        ? 1
        : (pace.safeDaily > 0 ? clamp(1 - (pressure / 1.15), 0, 1) : 0);
      return clamp(80 + (20 * ((reserve * 0.65) + (paceRoom * 0.35))), 80, 100);
    }

    if (status === 'WASPADA') {
      // Fixed WASPADA band: 40–79. It cannot accidentally display an AMAN score.
      const reserve = pace.disposable > 0
        ? clamp(pace.predictedEnd / pace.disposable, 0, 1)
        : 0;
      const overPace = Number.isFinite(pressure)
        ? clamp((pressure - 1.15) / 0.85, 0, 1)
        : 1;
      return clamp(40 + (39 * ((reserve * 0.55) + ((1 - overPace) * 0.45))), 40, 79);
    }

    // Fixed KRITIS band: 1–39 while money still exists.
    if (pace.predictedEnd < 0 && pace.disposable > 0) {
      const deficit = Math.abs(pace.predictedEnd);
      const severity = clamp(deficit / Math.max(1, pace.disposable + deficit), 0, 1);
      return clamp(39 * (1 - severity), 1, 39);
    }

    if (!Number.isFinite(pressure)) return 5;
    const severity = clamp((pressure - 1) / 1.5, 0, 1);
    return clamp(39 - (34 * severity), 1, 39);
  }

  function viewState(status) {
    if (status === 'END') return { grade: 'end', label: 'END', icon: '⚫' };
    if (status === 'KRITIS') return { grade: 'critical', label: 'KRITIS', icon: '🔴' };
    if (status === 'WASPADA') return { grade: 'warn', label: 'WASPADA', icon: '🟡' };
    return { grade: 'healthy', label: 'AMAN', icon: '🟢' };
  }

  function writeScore(scoreEl, score) {
    const value = String(Math.round(score));
    if (String(scoreEl.textContent || '').trim() === value) return;
    internalScoreWrite = true;
    scoreEl.textContent = value;
    queueMicrotask(() => { internalScoreWrite = false; });
  }

  function applyHomeEndState(pace, status) {
    const statusEl = document.getElementById('home-fin-status');
    const noteEl = document.getElementById('home-fin-status-note');
    if (!statusEl) return;

    if (status === 'END') {
      statusEl.textContent = '⚫ END';
      statusEl.style.color = 'var(--text-dim)';
      if (noteEl) noteEl.textContent = pace.disposable < 0
        ? 'Saldo tersedia sudah minus.'
        : 'Saldo tersedia sudah habis.';
      return;
    }

    // Core render already owns normal AMAN/WASPADA/KRITIS text. This branch only
    // repairs a stale END display if money becomes available again before a full render.
    if (/\bEND\b/i.test(statusEl.textContent || '')) {
      const state = viewState(status);
      statusEl.textContent = `${state.icon} ${state.label}`;
      statusEl.style.color = status === 'AMAN'
        ? 'var(--success)'
        : status === 'WASPADA' ? 'var(--warning)' : 'var(--danger)';
      if (noteEl) noteEl.textContent = pace.predictedEnd >= 0
        ? 'Pace bulan ini masih tertahan.'
        : 'Prediksi akhir bulan mulai defisit.';
    }
  }

  function syncHealth(rawPace) {
    const sourcePace = rawPace || currentPace || window.__agisFinancialPace;
    if (!sourcePace || typeof sourcePace !== 'object') return false;
    const card = document.getElementById('v244-score-card');
    const scoreEl = document.getElementById('v244-score');
    const labelEl = document.getElementById('v253-condition-label');
    if (!card || !scoreEl) return false;

    const pace = normalizePace(sourcePace);
    currentPace = pace;
    const status = effectiveStatus(pace);
    const state = viewState(status);
    const score = deterministicScore(pace, status);

    // Keep this exact legacy value so v25.3-health-pulse.js knows not to remap
    // the label to SEHAT/CUKUP based on its old score bands.
    card.dataset.healthSource = 'monthly-status';
    card.dataset.healthEngine = 'v25.3.10';
    card.dataset.grade = state.grade;
    card.dataset.monthlyStatus = status;
    card.dataset.monthlyScore = String(Math.round(score));

    writeScore(scoreEl, score);
    if (labelEl) labelEl.textContent = state.label;

    const ring = document.getElementById('v244-score-ring');
    if (ring) ring.style.setProperty('--score', `${score * 3.6}deg`);

    if (status === 'END') {
      card.style.setProperty('--v253-heart-duration', '0s');
      card.style.setProperty('--v253-ecg-duration', '0s');
      card.dataset.pulseSpeed = '0';
    } else {
      // Same smooth tempo behavior, now driven by the stable monthly score.
      const heartDuration = 0.76 + (score / 100) * 1.04;
      const ecgDuration = 1.45 + (score / 100) * 2.35;
      card.style.setProperty('--v253-heart-duration', `${heartDuration.toFixed(2)}s`);
      card.style.setProperty('--v253-ecg-duration', `${ecgDuration.toFixed(2)}s`);
      card.dataset.pulseSpeed = heartDuration.toFixed(2);
    }

    applyHomeEndState(pace, status);

    const paceText = pace.avg7 > 0 && pace.safeDaily > 0
      ? `pace tujuh hari ${Math.round((pace.avg7 / pace.safeDaily) * 100)} persen dari batas aman`
      : 'pace bulanan belum punya cukup data';
    const endText = status === 'END' ? ', detak berhenti karena saldo tersedia habis' : '';
    card.setAttribute(
      'aria-label',
      `Kondisi keuangan ${state.label}, skor ${Math.round(score)} dari 100, ${paceText}${endText}.`
    );
    return true;
  }

  function queueSync(rawPace) {
    if (rawPace) currentPace = normalizePace(rawPace);
    if (syncQueued) return;
    syncQueued = true;
    setTimeout(() => {
      syncQueued = false;
      const sourcePace = currentPace || window.__agisFinancialPace;
      if (sourcePace) syncHealth(sourcePace);
    }, 0);
  }

  function installScoreGuard() {
    const scoreEl = document.getElementById('v244-score');
    if (!scoreEl || scoreEl.dataset.v25310Guard === '1') return;
    scoreEl.dataset.v25310Guard = '1';
    new MutationObserver(() => {
      if (internalScoreWrite || !currentPace) return;
      const expected = Math.round(deterministicScore(currentPace, effectiveStatus(currentPace)));
      const visible = Number(String(scoreEl.textContent || '').replace(/[^0-9.-]/g, ''));
      if (visible !== expected) queueSync();
    }).observe(scoreEl, { childList: true, characterData: true, subtree: true });
  }

  function installStatusGuard() {
    const statusEl = document.getElementById('home-fin-status');
    if (!statusEl || statusEl.dataset.v25310Guard === '1') return;
    statusEl.dataset.v25310Guard = '1';
    new MutationObserver(() => {
      if (currentPace) queueSync();
    }).observe(statusEl, { childList: true, characterData: true, subtree: true });
  }

  function installRenderWrapper() {
    if (typeof window.renderAll !== 'function' || window.renderAll.__v25310) return;
    const original = window.renderAll;
    const wrapped = function () {
      const result = original.apply(this, arguments);
      // v24.4 schedules its old score renderer with setTimeout(0). Queueing ours
      // afterwards guarantees the monthly Health Pulse wins without a reload.
      queueSync(window.__agisFinancialPace);
      setTimeout(() => queueSync(window.__agisFinancialPace), 12);
      return result;
    };
    wrapped.__v25310 = true;
    window.renderAll = wrapped;
  }

  function install() {
    installRenderWrapper();
    installScoreGuard();
    installStatusGuard();

    if (window.__agisFinancialPace) {
      currentPace = normalizePace(window.__agisFinancialPace);
      queueSync(currentPace);
    }

    document.addEventListener('agis:financial-pace', event => {
      currentPace = normalizePace(event.detail);
      // Event fires in the middle of core render; apply just after it finishes.
      queueSync(currentPace);
      requestAnimationFrame(() => queueSync(currentPace));
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) queueSync(window.__agisFinancialPace);
    });
    window.addEventListener('online', () => queueSync(window.__agisFinancialPace));
    window.addEventListener('offline', () => queueSync(window.__agisFinancialPace));

    // Covers late card injection / Firestore hydrate without changing the score formula.
    setTimeout(() => { installScoreGuard(); installStatusGuard(); queueSync(window.__agisFinancialPace); }, 700);
    setTimeout(() => { installScoreGuard(); installStatusGuard(); queueSync(window.__agisFinancialPace); }, 1600);
  }

  // Small read-only debug surface for deterministic verification.
  window.__agisHealthEngineV25310 = {
    compute(rawPace) {
      const pace = normalizePace(rawPace);
      const status = effectiveStatus(pace);
      return { status, score: Math.round(deterministicScore(pace, status)) };
    },
    sync: () => queueSync(window.__agisFinancialPace)
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(install, 40));
  } else {
    setTimeout(install, 40);
  }
})();
