// Service Worker for LeleFarm PWA
const CACHE_NAME = 'lelefarm-v1';
const OFFLINE_URL = '/offline';

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/login',
  '/dashboard',
  '/manifest.json',
];

// Install event - precache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API auth requests
  if (url.pathname.startsWith('/api/auth')) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first with timeout
          const networkPromise = fetch(request);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 3000)
          );

          const response = await Promise.race([networkPromise, timeoutPromise]);
          
          // Cache successful response
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
          
          return response;
        } catch (error) {
          console.log('[SW] Network failed, trying cache:', request.url);
          
          // Try cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback to offline page
          console.log('[SW] No cache, returning offline page');
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }

          // Last resort
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        }
      })()
    );
    return;
  }

  // Handle other requests (assets, API)
  event.respondWith(
    (async () => {
      // Try cache first for static assets
      if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff|woff2)$/)
      ) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      // Try network
      try {
        const response = await fetch(request);
        
        // Cache successful responses
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        
        return response;
      } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // For API requests, return empty response
        if (url.pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({ offline: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        throw error;
      }
    })()
  );
});

// Message event - for manual cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.payload);
      })
    );
  }
});
