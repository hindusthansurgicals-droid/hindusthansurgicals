/* Cylinder Desk service worker: lets Chrome offer "Install app".
   It does not cache anything — the app always loads fresh from the server,
   and data stays in Firebase. */
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||e.request.mode!=='navigate')return;
  e.respondWith(fetch(e.request).catch(()=>new Response('<meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;padding:24px;text-align:center"><h2>No internet</h2><p>இணைய இணைப்பு இல்லை. Net வந்தவுடன் மீண்டும் திறக்கவும்.</p><button onclick="location.reload()">Retry</button></body>',{headers:{'Content-Type':'text/html; charset=utf-8'}})));
});
