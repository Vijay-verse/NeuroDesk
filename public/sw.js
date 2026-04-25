// NeuroDesk Service Worker — Offline-first PWA
const CACHE_NAME = 'neurodesk-v1';
const RUNTIME_CACHE = 'neurodesk-runtime-v1';

// Assets to precache on install (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/icon-192.svg',
  '/manifest.json',
];

// ─── Install: precache app shell ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately without waiting
  self.skipWaiting();
});

// ─── Activate: clean old caches ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// ─── Fetch: Network-first with offline fallback ───
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls to external services (Groq AI, Railway backend, etc.)
  if (
    url.hostname === 'api.groq.com' ||
    url.hostname.includes('railway.app') ||
    url.hostname === 'wttr.in' ||
    url.pathname.startsWith('/api/')
  ) {
    return; // Let these go to network normally, don't cache
  }

  // Skip Chrome extensions and other non-http schemes
  if (!url.protocol.startsWith('http')) return;

  // For navigation requests (page loads): Network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh page
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Offline: serve from cache
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // For Google Fonts — Cache first (they rarely change)
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // For all other assets (JS, CSS, images): Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          // Only cache valid responses
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Network failed, cached version (if any) is already being returned
          return cached;
        });

      // Return cached immediately, update in background
      return cached || fetchPromise;
    })
  );
});

// ─── Background Sync placeholder (future use) ───
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
