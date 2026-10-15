// Service worker: siden skal virke i en butik uden net (eller med én streg dækning).
// Cache først: alt vises straks fra telefonens egen kopi, og nettet bruges kun i baggrunden
// til at hente en nyere udgave, som så vises næste gang siden åbnes.
const CACHE = 'kilopris-2';
const FILER = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' går uden om browserens HTTP-cache, så kopien er den nyeste udgave.
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILER.map(f => new Request(f, {cache: 'reload'}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(navne => Promise.all(navne.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Hent en frisk kopi i baggrunden. 'no-cache' spørger serveren (GitHub Pages lader ellers
  // browseren genbruge en gammel kopi i 10 minutter). Kun hele, gode svar gemmes, aldrig fx
  // en omdirigering til et butiks-wifis loginside.
  const frisk = fetch(req.url, {cache: 'no-cache'}).then(svar => {
    if (svar.ok && svar.type === 'basic' && !svar.redirected) {
      const kopi = svar.clone();
      e.waitUntil(caches.open(CACHE).then(c => c.put(req, kopi)));
    }
  });
  e.waitUntil(frisk.catch(() => {}));
  e.respondWith(caches.match(req, {ignoreSearch: true})
    .then(m => m || (req.mode === 'navigate' ? caches.match('./') : undefined))
    .then(m => m || fetch(req)));
});
