(() => {
  'use strict';

  const STORAGE_KEY = 'agis_finance_v2754_feature_switcher';
  const FEATURES = [
    { id: 'decision', label: 'Decision Lab', icon: 'flask-conical' },
    { id: 'tracking', label: 'Realisasi', icon: 'activity' },
    { id: 'whatif', label: 'What-if', icon: 'sliders-horizontal' },
    { id: 'report', label: 'Laporan', icon: 'chart-no-axes-combined' }
  ];

  let active = 'decision';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (FEATURES.some(item => item.id === saved)) active = saved;
  } catch {}

  function getHost() {
    return document.getElementById('v2531-planning-host');
  }

  function getNodes() {
    const host = getHost();
    return {
      budget: document.getElementById('v25-planning-card'),
      decision: document.getElementById('v26-decision-lab'),
      tracking: document.getElementById('v27-tracking'),
      whatif: document.getElementById('v244-simulator-card'),
      report: host?.querySelector('.v25-year-card') || null
    };
  }

  function saveActive(id) {
    active = FEATURES.some(item => item.id === id) ? id : 'decision';
    try { localStorage.setItem(STORAGE_KEY, active); } catch {}
  }

  function createSwitcher() {
    const host = getHost();
    if (!host) return null;

    let switcher = document.getElementById('v2754-feature-switcher');
    if (switcher) return switcher;

    switcher = document.createElement('section');
    switcher.id = 'v2754-feature-switcher';
    switcher.className = 'v2754fs';
    switcher.setAttribute('aria-label', 'Fitur Planning');
    switcher.innerHTML = `
      <div class="v2754fs-head">
        <div>
          <span>FITUR PLANNING</span>
          <b id="v2754fs-active-label">Decision Lab</b>
        </div>
        <small>Pilih satu fitur supaya halaman tetap ringkas.</small>
      </div>
      <div class="v2754fs-tabs" role="tablist" aria-label="Pilih fitur Planning">
        ${FEATURES.map(item => `
          <button type="button"
                  role="tab"
                  data-v2754-feature="${item.id}"
                  aria-selected="false">
            <i data-lucide="${item.icon}" aria-hidden="true"></i>
            <span>${item.label}</span>
          </button>`).join('')}
      </div>`;

    switcher.addEventListener('click', event => {
      const button = event.target.closest('[data-v2754-feature]');
      if (!button) return;
      selectFeature(button.dataset.v2754Feature, true);
    });

    host.insertBefore(switcher, host.firstChild);
    try { window.lucide?.createIcons?.(); } catch {}
    return switcher;
  }

  function placeSwitcher() {
    const host = getHost();
    const switcher = createSwitcher();
    if (!host || !switcher) return false;

    const budget = document.getElementById('v25-planning-card');
    if (budget?.parentElement === host) {
      if (budget.nextElementSibling !== switcher) {
        host.insertBefore(switcher, budget.nextElementSibling);
      }
    } else if (host.firstElementChild !== switcher) {
      host.insertBefore(switcher, host.firstElementChild);
    }
    return true;
  }

  function setPanelVisible(node, visible) {
    if (!node) return;
    node.classList.toggle('v2754fs-hidden', !visible);
    node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function applyActive(scrollTab = false) {
    const switcher = createSwitcher();
    if (!switcher) return false;

    const nodes = getNodes();
    setPanelVisible(nodes.decision, active === 'decision');
    setPanelVisible(nodes.tracking, active === 'tracking');
    setPanelVisible(nodes.whatif, active === 'whatif');
    setPanelVisible(nodes.report, active === 'report');

    switcher.querySelectorAll('[data-v2754-feature]').forEach(button => {
      const selected = button.dataset.v2754Feature === active;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      button.tabIndex = selected ? 0 : -1;
      if (selected && scrollTab) {
        try { button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } catch {}
      }
    });

    const label = document.getElementById('v2754fs-active-label');
    const feature = FEATURES.find(item => item.id === active);
    if (label && feature) label.textContent = feature.label;

    if (active === 'tracking') {
      setTimeout(() => {
        try { window.refreshTrackingV27?.(); } catch {}
      }, 40);
    }

    requestAnimationFrame(() => {
      try { window.dispatchEvent(new Event('resize')); } catch {}
    });

    try { window.lucide?.createIcons?.(); } catch {}
    return !!(nodes.decision || nodes.tracking || nodes.whatif || nodes.report);
  }

  function selectFeature(id, scrollTab = false) {
    saveActive(id);
    placeSwitcher();
    applyActive(scrollTab);
  }

  function install() {
    placeSwitcher();
    applyActive(false);
  }

  // Fixed startup retries only; the script does not hook global navigation
  // and does not watch the whole DOM continuously.
  function boot() {
    [80, 260, 560, 950, 1450, 2200].forEach(ms => setTimeout(install, ms));
  }

  window.selectPlanningFeatureV2754 = selectFeature;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
