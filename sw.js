// Offline cache for Ếch Nhảy Sen. Bump CACHE when shipping a new version.
const CACHE = 'frog-v4';
const CORE = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// pages: network-first (always the newest game when online, cached copy when offline)
// other files: stale-while-revalidate
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html') || url.pathname.endsWith('sw.js')) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(r => { if (r.ok && !url.pathname.endsWith('sw.js')) { const c = r.clone(); caches.open(CACHE).then(ch => ch.put(req, c)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(h => h || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
