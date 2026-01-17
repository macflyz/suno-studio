const CACHE_NAME = 'suno-studio-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;600&family=Manrope:wght@400;600;800&display=swap'
];

// Installazione - Cache delle risorse statiche
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Attivazione - Pulizia cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Rimozione cache vecchia:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Strategia Network First con fallback su Cache
self.addEventListener('fetch', event => {
  // Ignora richieste non-GET e richieste all'API di Anthropic
  if (event.request.method !== 'GET' || 
      event.request.url.includes('anthropic.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se la risposta è valida, clonala e salvala in cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Se la rete fallisce, prova a recuperare dalla cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Pagina offline personalizzata (opzionale)
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});