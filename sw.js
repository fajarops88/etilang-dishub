/* Service worker E-Tilang Dishub.
 * Tujuan: aplikasi dapat dipasang dan kerangkanya (HTML/CSS/JS/font/ikon) terbuka cepat, bahkan saat sinyal lemah.
 * TIDAK pernah menyimpan panggilan API (alamat Apps Script, lintas-origin) maupun foto/data kasus.
 * Setiap rilis: naikkan VERSI agar cache lama dibuang. */
const VERSI = 'etl-v1.2.0';
const CACHE = VERSI + '-shell';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'css/tailwind.css', 'css/app.css', 'vendor/leaflet.css', 'vendor/leaflet.js', 'vendor/qrcode.js',
  'js/config.js', 'js/icons.js', 'js/util.js', 'js/api.js', 'js/charts.js', 'js/app.js', 'js/pwa.js',
  'js/p-publik.js', 'js/p-petugas.js', 'js/p-kasus.js', 'js/p-laporan.js', 'js/p-admin.js', 'js/p-wa-crm.js',
  'assets/inter-latin.woff2', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const nama = await caches.keys();
    await Promise.all(nama.filter((n) => n.startsWith('etl-') && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', (e) => { if (e.data === 'ambil-alih') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // API Apps Script, peta, dll: langsung ke jaringan
  // Navigasi: jaringan dulu (agar rilis baru cepat terlihat), cadangan dari cache bila offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const salin = r.clone(); caches.open(CACHE).then((c) => c.put('index.html', salin)); return r; })
      .catch(() => caches.match('index.html').then((r) => r || caches.match('./'))));
    return;
  }
  // Berkas statis: stale-while-revalidate
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const ada = await c.match(req);
    const ambil = fetch(req).then((r) => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return ada || (await ambil) || new Response('', { status: 504, statusText: 'Offline' });
  }));
});
