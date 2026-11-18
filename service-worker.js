/* غيّر رقم النسخة عند نشر تحديث */
const CACHE = 'calc-v1';
const FILES = ['./', 'index.html', 'manifest.json', 'themes.css', 'style.css', 'responsive.css',
  'storage.js', 'settings.js', 'history.js', 'calculator.js', 'scientific.js',
  'percentage.js', 'converter.js', 'app.js', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* الشبكة أولًا (ليظهر تعديلك فورًا)، ثم الكاش عند انقطاع الإنترنت */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request)));
});
