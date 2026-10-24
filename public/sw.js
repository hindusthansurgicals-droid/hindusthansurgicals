/* Hindusthan Surgicals / Cylinder Desk service worker. Version: hs-v4.3.1.
   Deliberately does not cache Firestore data or application assets; Firebase remains source of truth. */
const CACHE_VERSION = 'hs-v4.3.1';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('hs-') && k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;
  event.respondWith(fetch(req).catch(() => new Response(
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;padding:24px;text-align:center"><h2>No internet</h2><p>இணைய இணைப்பு இல்லை. இணையம் வந்ததும் மீண்டும் முயற்சிக்கவும்.</p><button onclick="location.reload()">மீண்டும் முயற்சி</button></body>',
    {headers:{'Content-Type':'text/html; charset=utf-8'}})));
});
