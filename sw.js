// Offline support: keeps the app files on the phone so it opens with no internet.
// When you upload a new version, change VERSION so phones fetch the update.
const VERSION = 'hifz-v16';
const ASR_CACHE = 'hifz-asr-1'; // speech runtime and word list, kept across app updates
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== ASR_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const path = new URL(e.request.url).pathname;
  if (/asr-model-\d\.bin$/.test(path)) return; // the model is stored by the app itself
  const keep = /\/(ort[^/]*|asr-words\.json)$/.test(path);
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => {
      if (keep && r.ok) { const copy = r.clone(); caches.open(ASR_CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match('./index.html')))
  );
});
