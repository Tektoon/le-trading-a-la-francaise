const CACHE_NAME = 'ltaf-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Installation — mise en cache des fichiers essentiels
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activation — suppression des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — réseau en priorité, cache en fallback
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes Supabase
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache les réponses réussies
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback sur le cache si pas de réseau
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Retourner index.html pour les routes SPA
          return caches.match('/index.html');
        });
      })
  );
});
