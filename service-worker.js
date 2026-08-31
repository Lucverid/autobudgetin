const CACHE_NAME = 'agis-finance-v19.8';

// Pre-cache semua file lokal yang ada di repository Anda
const PRE_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './chart.min.js',
  './firebase-app.js',
  './firebase-firestore.js',
  './lucide.min.js',
  './sweetalert2.all.min.js',
  './xlsx.full.min.js'
];

// 1. Install Stage
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// 2. Activate Stage: Hapus cache versi lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// 3. Fetch Stage: Cache First, lalu Network
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cachedRes => {
      if (cachedRes) return cachedRes;

      return fetch(e.request).then(networkRes => {
        // Izinkan simpan respon opaque/CORS dari CDN (type 'cors' atau 'opaque')
        if (!networkRes || networkRes.status !== 200 && networkRes.type !== 'opaque') {
          return networkRes;
        }

        const responseToCache = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseToCache);
        });

        return networkRes;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
