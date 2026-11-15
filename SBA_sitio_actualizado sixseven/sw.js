// Sistema de Billares Ángel (S.B.A) · Trabajador de servicio (permite instalar la app y que abra rápido).
// Guarda SOLO los archivos de la aplicación (pantallas, estilos, íconos).
// Los datos del negocio NUNCA se guardan aquí: siempre se piden al servidor.
// Por eso, sin conexión la app abre y avisa, pero no registra operaciones.
const VERSION = '202611151800';
const CACHE = 'sba-' + VERSION;
const ARCHIVOS = ["app.css","app.js","fuentes/inter-Bold.woff","fuentes/inter-Medium.woff","fuentes/inter-Regular.woff","fuentes/inter-SemiBold.woff","fuentes/poppins-Bold.woff","fuentes/poppins-BoldItalic.woff","fuentes/poppins-Medium.woff","iconos/favicon.ico","iconos/icono-180.png","iconos/icono-192.png","iconos/icono-32.png","iconos/icono-512.png","iconos/icono-maskable-512.png","index.html","manifest.webmanifest","ticket.js","instalar.js","tema.js","sonidos.js","partes/chunk-NYAKAUGY.js","partes/exportar-TJ5PBKIQ.js","partes/jszip.min-F2I4M63A.js"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => (k.startsWith('bej-') || k.startsWith('sba-')) && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // el servidor de datos no se toca
  // La configuración: siempre la de la red; la copia guardada solo sirve si no hay conexión.
  if (url.pathname.endsWith('/config.js')) {
    e.respondWith(caches.open(CACHE).then((c) => fetch(req).then((r) => { if (r.ok) c.put('config.js', r.clone()); return r; }).catch(() => c.match('config.js').then((r) => r || Response.error()))));
    return;
  }

  // Páginas: primero la red (para tener la última versión); si no hay conexión, la copia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('index.html', { ignoreSearch: true }).then((r) => r || Response.error())));
    return;
  }
  // Archivos de la app: copia guardada al instante y se actualiza por detrás.
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const guardado = await c.match(req, { ignoreSearch: true });
      const red = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => guardado || Response.error());
      return guardado || red;
    }),
  );
});
