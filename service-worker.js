const CACHE_NAME = 'agis-finance-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './chart.min.js',
  './sweetalert2.all.min.js',
  './lucide.min.js',
  './xlsx.full.min.js',
  './firebase-app.js',
  './firebase-firestore.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});
