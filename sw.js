// Service worker: siden virker uden net, når den har været åbnet én gang.
// Net først (så en ny udgave vises med det samme), cachen hvis nettet svigter eller er for langsomt.
const CACHE = 'kilopris-1';
const FILER = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const VENT_MS = 3000;   // så længe venter vi på nettet, før cachen bruges (dårlig dækning i butikken)

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILER)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(navne => Promise.all(navne.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const net = fetch(req).then(svar => {
    if (svar.ok) { const kopi = svar.clone(); caches.open(CACHE).then(c => c.put(req, kopi)); }
    return svar;
  });
  e.waitUntil(net.catch(() => {}));
  const fraCache = () => caches.match(req, {ignoreSearch: true})
    .then(m => m || (req.mode === 'navigate' ? caches.match('./') : null))
    .then(m => m || net);
  const timeout = new Promise((_, nej) => setTimeout(() => nej(new Error('timeout')), VENT_MS));
  e.respondWith(Promise.race([net, timeout]).catch(fraCache));
});
