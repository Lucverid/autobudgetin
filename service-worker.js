const CACHE_NAME = 'agis-finance-v18';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './libs/chart.min.js',
  './libs/sweetalert2.all.min.js',
  './libs/lucide.min.js',
  './libs/xlsx.full.min.js',
  './libs/firebase-app.js',
  './libs/firebase-firestore.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
