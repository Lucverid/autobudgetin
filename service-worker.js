const CACHE_PREFIX = 'agis-finance-';
const CACHE_NAME = 'agis-finance-v28-8-0-refined-ui';

const APP_SHELL = [
  './',
  './index.html',
  './finance-core.js?v=28.7.0',
  './v28-6-refinement.js?v=28.7.1',
  './v28-6-refinement.css?v=28.7.0',
  './v28-7-professional.css?v=28.7.0',
  './v28-8-ui.css?v=28.8.0',
  './manifest.json',
  './chart.min.js',
  './sweetalert2.all.min.js',
  './lucide.min.js',
  './xlsx.full.min.js',
  './firebase-app.js',
  './firebase-firestore.js',
  './v24-4-features.css?rev=28.7.0',
  './v24-4-features.js?rev=28.7.0', './v24-5-automation.js', './v24-5-automation.css', './v24-6-layout.css', './v25-features.js?rev=28.7.0', './v25-features.css', './v25-1-mobile.js', './v25-1-mobile.css', './v25-2-clean-home.js', './v25-2-clean-home.css', './v25-3-health-pulse.js', './v25-3-health-pulse.css', './v25-3-1-quick-transaction.js', './v25-3-1-quick-transaction.css',
  './v25-3-2-ui-polish.css', './v25-5-17-easter-egg.css', './v25-5-17-easter-egg.js?rev=28.7.0', './cat-idle-strip.png', './cat-walk-strip.png', './cat-run-strip.png', './cat-sleep-strip.png', './cat-pet-strip.png', './mouse-run-strip.png', './v25-3-3-financial-plan.js?v=26.0.1', './v25-3-3-financial-plan.css', './v25-3-4-balance-wallet.css', './v25-3-5-balance-savings.css', './v25-3-6-health-balance.css', './v25-3-10-health-engine.js?v=28.8.0', './v25-3-10-health-engine.css', './v26-decision-lab.js?v=26.0.5', './v26-decision-lab.css?v=26.0.5', './v26-feature-switcher.css?v=26.0.3', './v26-stable-tracking.js?v=26.0.2', './v26-stable-tracking.css?v=26.0.2', './v26-tracking-money-format.js?v=26.0.2', './v26-feature-switcher.js?v=26.0.3', './v28-auto-budget-review.js?v=28.4.0&rev=28.7.0', './v28-auto-budget-review.css?v=28.4.0', './v28-5-monthly-archive.js?v=28.5.2&rev=28.7.0', './v28-5-monthly-archive.css?v=28.5.0',
  './icon-192.png',
  './icon-512.png'
];

async function putIfOk(cache, request, response) {
  if (response && response.ok) {
    try { await cache.put(request, response.clone()); } catch (_) {}
  }
  return response;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // An incomplete update must leave the previous offline shell in place.
    await Promise.all(APP_SHELL.map(async asset => {
      const response = await fetch(asset, { cache: 'reload' });
      if (!response.ok) throw new Error('Offline asset unavailable: ' + asset);
      await cache.put(asset, response);
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigasi selalu coba network lebih dulu supaya HTML deploy terbaru cepat terbaca.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request, { cache: 'no-cache' });
        if (response && response.ok) await cache.put('./index.html', response.clone());
        if (response && response.ok) return response;
        return (await cache.match('./index.html')) || response;
      } catch (_) {
        return (await cache.match('./index.html')) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  const isCodeAsset = request.destination === 'script' || request.destination === 'style' || /\.(?:js|css|json)$/i.test(url.pathname);

  if (isCodeAsset) {
    // Online: cari versi terbaru. Offline/network error: pakai cache.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request, { cache: 'no-cache' });
        if (response && response.ok) return await putIfOk(cache, request, response);
        return (await cache.match(request)) || response;
      } catch (_) {
        return (await cache.match(request)) || (await caches.match(request)) || Response.error();
      }
    })());
    return;
  }

  // Gambar/icon: cache-first agar ringan, lalu fetch jika belum ada.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request) || await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      return await putIfOk(cache, request, response);
    } catch (_) {
      return Response.error();
    }
  })());
});
