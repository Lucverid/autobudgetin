const CACHE_NAME = 'agis-finance-v10'; // Versi baru agar cache diperbarui
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://unpkg.com/lucide@latest',
  'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

// Install service worker dan cache aset
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Layani aset dari cache saat offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
