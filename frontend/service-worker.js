/**
 * AgriSetu Service Worker
 * Progressive Web App (PWA) Offline Caching & Resilience
 */

const CACHE_NAME = 'agrisetu-core-v1';
const DATA_CACHE_NAME = 'agrisetu-data-v1';

// Core assets required for complete offline operation
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/i18n.js',
  '/manifest.json',
  '/assets/icon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/data/fallback_prices.json',
  '/data/fallback_weather.json',
  '/data/schemes.json',
  '/data/metadata.json'
];

// Install Event: Pre-cache core application shell & local fallback datasets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching core application shell and fallback data');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[ServiceWorker] Pre-cache failed:', err);
      })
  );
});

// Activate Event: Clean up outdated caches and take immediate control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== DATA_CACHE_NAME) {
            console.log('[ServiceWorker] Removing legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First for APIs, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Only handle GET requests in service worker cache
  if (request.method !== 'GET') {
    return;
  }

  // 2. API Routes: Network-First Strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Clone and cache successful API responses in dynamic data cache
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.warn('[ServiceWorker] Network request failed for API:', url.pathname, 'Attempting offline fallback');

          // Try dynamic API cache first
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback to pre-cached local data for core metadata/schemes
          if (url.pathname === '/api/schemes') {
            const schemesRes = await caches.match('/data/schemes.json');
            if (schemesRes) {
              const schemesData = await schemesRes.json();
              return new Response(JSON.stringify({ schemes: schemesData, is_offline: true }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }

          if (url.pathname === '/api/commodities' || url.pathname === '/api/locations' || url.pathname === '/api/demo-combinations') {
            const metaRes = await caches.match('/data/metadata.json');
            if (metaRes) {
              const metaData = await metaRes.json();
              if (url.pathname === '/api/commodities') {
                return new Response(JSON.stringify({ commodities: metaData.commodities, is_offline: true }), {
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              if (url.pathname === '/api/locations') {
                return new Response(JSON.stringify({ locations: metaData.locations, is_offline: true }), {
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              if (url.pathname === '/api/demo-combinations') {
                return new Response(JSON.stringify({ combinations: metaData.combinations, is_offline: true }), {
                  headers: { 'Content-Type': 'application/json' }
                });
              }
            }
          }

          // Let frontend handle specific price/weather lookups with its built-in fallback datasets
          return new Response(JSON.stringify({
            error: 'Network connection unavailable. Showing local offline data.',
            is_offline: true,
            data_status: 'fallback'
          }), {
            status: 503,
            statusText: 'Service Unavailable (Offline)',
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 3. Navigation Requests: Return index.html from cache if offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(async () => {
          const cachedIndex = await caches.match('/index.html') || await caches.match('/');
          return cachedIndex;
        })
    );
    return;
  }

  // 4. Static Shell Assets (HTML, CSS, JS, SVGs, PNGs, JSON): Cache-First with Network Revalidation
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Asynchronously update cache in background if online
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore background fetch failures when offline */});

        return cachedResponse;
      }

      // If not in cache, fetch from network and cache
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return networkResponse;
      });
    })
  );
});
