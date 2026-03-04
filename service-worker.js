const CACHE_NAME = 'agis-finance-v18-8';

// Hanya pre-cache aset internal yang pasti ada di repo kamu
const PRE_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// 1. Install Stage: Pre-cache aset lokal saja
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// 2. Activate Stage: Bersihkan cache lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
});

// 3. Fetch Stage: Runtime Caching Strategy (Cache First, then Network & Store)
self.addEventListener('fetch', e => {
  // Hanya intercept request GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cachedRes => {
      // Jika ada di cache, langsung berikan
      if (cachedRes) return cachedRes;

      // Jika tidak ada, ambil dari network
      return fetch(e.request).then(networkRes => {
        // Validasi respon: jangan cache kalau error atau respon aneh
        if (!networkRes || networkRes.status !== 200 || networkRes.type !== 'basic' && !e.request.url.includes('cdn')) {
          return networkRes;
        }

        // Simpan hasil fetch ke cache secara otomatis (Runtime Caching)
        const responseToCache = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseToCache);
        });

        return networkRes;
      }).catch(() => {
        // Fallback jika offline total dan aset tidak ada di cache
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
