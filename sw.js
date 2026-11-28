const CACHE_NAME = 'rmi-demak-pwa-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/profil',
  '/direktori',
  '/layanan',
  '/panduan',
  '/sambang',
  '/berita',
  '/app.js',
  '/assets/js/core-utils.js',
  '/assets/js/gis-map.js',
  '/assets/js/profil-organogram.js',
  '/assets/js/pesantren-direktori.js',
  '/assets/js/berita.js',
  '/assets/js/panduan-sambang.js',
  '/manifest.json',
  '/assets/img/logo_rmi.png',
  '/assets/css/styles.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const reqUrl = event.request.url;

  // Jangan pernah cache panggilan API Google Apps Script (data live harus selalu fresh)
  if (reqUrl.includes('script.google.com') || event.request.method !== 'GET') {
    return;
  }

  // Stale-While-Revalidate untuk aset statis portal
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && reqUrl.startsWith(self.location.origin)) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
