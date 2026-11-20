// Apna Class Plus — minimal service worker (offline shell cache)
const CACHE = 'apna-class-plus-v1';
const SHELL = ['/', '/index.html', '/runtimeConfig.js', '/favicon.svg', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // API/Firestore calls: network-first
  if (url.pathname.startsWith('/v1/') || url.pathname.startsWith('/v2/') || url.pathname.startsWith('/v3/') || url.pathname.startsWith('/lp/') || url.pathname.startsWith('/store')) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  // static: cache-first, fallback to shell
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const clone = res.clone();
      caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
      return res;
    }).catch(() => caches.match('/index.html'))),
  );
});
