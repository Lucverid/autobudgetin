(() => {
  'use strict';

  const STORAGE_KEY = 'agis_finance_feature_switcher_v26';
  const FEATURES = [
    { id: 'decision', label: 'Decision Lab', icon: 'flask-conical', desc: 'Analisis bisnis dan kredit sebelum uang keluar.' },
    { id: 'tracking', label: 'Realisasi', icon: 'activity', desc: 'Pantau penjualan, profit, stok, target, dan cicilan.' },
    { id: 'whatif', label: 'What-if', icon: 'wand-sparkles', desc: 'Uji dampak pengeluaran sebelum benar-benar dicatat.' },
    { id: 'report', label: 'Laporan', icon: 'chart-column', desc: 'Lihat ringkasan perjalanan keuangan tahunan.' }
  ];

  let active = 'decision';
  let applying = false;
  let observer = null;
  let labObserver = null;
  let navWrapped = false;
  let retries = 0;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (FEATURES.some(item => item.id === saved)) active = saved;
  } catch (_) {}

  function host() { return document.getElementById('v2531-planning-host'); }
  function feature(id) { return FEATURES.find(item => item.id === id) || FEATURES[0]; }
  function nodes() {
    const h = host();
    return {
      host: h,
      budget: document.getElementById('v25-planning-card'),
      lab: document.getElementById('v26-decision-lab'),
      tracking: document.getElementById('v26-stable-tracking'),
      whatif: document.getElementById('v244-simulator-card'),
      report: h?.querySelector('.v25-year-card') || document.querySelector('.v25-year-card')
    };
  }

  function save(id) {
    active = id;
    try { localStorage.setItem(STORAGE_KEY, id); } catch (_) {}
  }

  function buildSwitcher() {
    const h = host();
    if (!h) return null;
    let bar = document.getElementById('v26-feature-switcher');
    if (!bar) {
      bar = document.createElement('section');
      bar.id = 'v26-feature-switcher';
      bar.className = 'v26fs-wrap';
      bar.setAttribute('aria-label', 'Pilih fitur planning');
      bar.innerHTML = `
        <div class="v26fs-heading">
          <div class="v26fs-copy">
            <span class="v26fs-kicker">PLANNING TOOLS</span>
            <b id="v26fs-current">${feature(active).label}</b>
            <small id="v26fs-description">${feature(active).desc}</small>
          </div>
          <span class="v26fs-active-icon" aria-hidden="true"><i id="v26fs-active-lucide" data-lucide="${feature(active).icon}"></i></span>
        </div>
        <div class="v26fs-tabs" role="tablist" aria-label="Fitur planning">
          ${FEATURES.map(item => `<button type="button" role="tab" data-v26fs="${item.id}" aria-selected="false" onclick="selectFeatureV26('${item.id}')"><i data-lucide="${item.icon}" aria-hidden="true"></i><span>${item.label}</span></button>`).join('')}
        </div>`;
    }

    const budget = document.getElementById('v25-planning-card');
    if (budget && budget.parentElement === h && bar.previousElementSibling !== budget) {
      h.insertBefore(bar, budget.nextElementSibling);
    } else if (!bar.parentElement) {
      h.insertBefore(bar, h.firstChild || null);
    }
    window.lucide?.createIcons?.();
    return bar;
  }

  function setVisible(el, visible) {
    if (!el) return;
    el.classList.toggle('v26fs-hidden', !visible);
    el.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function updateSwitcher(id, shouldScroll) {
    const item = feature(id);
    const current = document.getElementById('v26fs-current');
    const description = document.getElementById('v26fs-description');
    if (current) current.textContent = item.label;
    if (description) description.textContent = item.desc;

    const iconWrap = document.querySelector('.v26fs-active-icon');
    if (iconWrap) iconWrap.innerHTML = `<i data-lucide="${item.icon}" aria-hidden="true"></i>`;

    document.querySelectorAll('[data-v26fs]').forEach(button => {
      const on = button.dataset.v26fs === id;
      button.classList.toggle('active', on);
      button.setAttribute('aria-selected', on ? 'true' : 'false');
      button.tabIndex = on ? 0 : -1;
      if (on && shouldScroll) button.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
    window.lucide?.createIcons?.();
  }

  function apply(id, shouldScroll = false) {
    if (applying) return;
    if (!FEATURES.some(item => item.id === id)) id = 'decision';
    applying = true;
    try {
      save(id);
      buildSwitcher();
      const n = nodes();
      if (!n.host) return;

      // Realisasi tetap memakai modul Stable+ yang sama. Saat dipilih, Decision
      // Lab hanya bertindak sebagai host sehingga state/database tidak berubah.
      if (n.lab) n.lab.classList.toggle('v26fs-tracking-mode', id === 'tracking');

      if (id === 'decision') {
        if (n.tracking) n.tracking.open = false;
        setVisible(n.lab, true);
        setVisible(n.tracking, false);
        setVisible(n.whatif, false);
        setVisible(n.report, false);
      } else if (id === 'tracking') {
        setVisible(n.lab, true);
        setVisible(n.tracking, true);
        setVisible(n.whatif, false);
        setVisible(n.report, false);
        if (n.tracking) {
          n.tracking.open = true;
          window.refreshStableTracking?.();
        }
      } else if (id === 'whatif') {
        if (n.tracking) n.tracking.open = false;
        setVisible(n.lab, false);
        setVisible(n.tracking, false);
        setVisible(n.whatif, true);
        setVisible(n.report, false);
      } else {
        if (n.tracking) n.tracking.open = false;
        setVisible(n.lab, false);
        setVisible(n.tracking, false);
        setVisible(n.whatif, false);
        setVisible(n.report, true);
      }

      updateSwitcher(id, shouldScroll);
      requestAnimationFrame?.(() => {
        try { window.dispatchEvent(new Event('resize')); } catch (_) {}
      });
    } finally {
      applying = false;
    }
  }

  function arrange() {
    const h = host();
    if (!h) return false;
    buildSwitcher();
    apply(active, false);
    h.querySelector('.v2531-planning-loading')?.remove();
    return Boolean(document.getElementById('v26-decision-lab') && document.getElementById('v244-simulator-card'));
  }

  function installObserver() {
    const h = host();
    if (h && !observer) {
      observer = new MutationObserver(() => {
        if (applying) return;
        setTimeout(() => arrange(), 0);
      });
      observer.observe(h, { childList: true, subtree: false });
    }
    const lab = document.getElementById('v26-decision-lab');
    if (lab && !labObserver) {
      labObserver = new MutationObserver(() => {
        if (applying) return;
        setTimeout(() => apply(active, false), 0);
      });
      // Direct children only: catches the late Stable+ tracking mount without
      // reacting to every metric/result render inside Decision Lab.
      labObserver.observe(lab, { childList: true, subtree: false });
    }
  }

  function wrapNav() {
    if (navWrapped || typeof window.nav !== 'function') return;
    const original = window.nav;
    window.nav = function(id, el) {
      const result = original.apply(this, arguments);
      if (id === 'planning') setTimeout(() => arrange(), 80);
      return result;
    };
    navWrapped = true;
  }

  window.selectFeatureV26 = id => apply(id, true);
  window.getActivePlanningFeatureV26 = () => active;

  function boot() {
    wrapNav();
    const ready = arrange();
    installObserver();
    const trackingReady = Boolean(document.getElementById('v26-stable-tracking'));
    if ((!ready || !trackingReady) && retries++ < 18) setTimeout(boot, 220);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 180), { once: true });
  } else {
    setTimeout(boot, 180);
  }
})();
