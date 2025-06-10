/**
 * Service Worker for Sandquake PWA
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'sandquake-v1.0.0';
const STATIC_CACHE_NAME = 'sandquake-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'sandquake-dynamic-v1.0.0';

// Define what files to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.js',
  '/src/core/SandPile.js',
  '/src/core/SandSource.js',
  '/src/core/Simulation.js',
  '/src/graphics/Camera.js',
  '/src/graphics/HeatmapRenderer.js',
  '/src/graphics/SandRenderer.js',
  '/src/graphics/Scene.js',
  '/src/controls/KeyboardHandler.js',
  '/src/controls/SourcesControl.js',
  '/src/controls/SpeedControl.js',
  '/src/utils/MathUtils.js'
];

// Files that should be cached dynamically
const DYNAMIC_ASSETS = [
  '/src/controls/MouseHandler.js',
  '/src/controls/TouchHandler.js',
  '/src/controls/RandomnessControl.js',
  '/src/core/SeismographData.js',
  '/src/graphics/SeismographRenderer.js',
  '/src/graphics/SpectrumRenderer.js',
  '/src/audio/FFTProcessor.js',
  '/src/audio/AudioAnalyzer.js',
  '/src/utils/SignalUtils.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Otherwise fetch from network
        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache failed responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response since it can only be consumed once
            const responseToCache = networkResponse.clone();

            // Determine which cache to use
            const url = event.request.url;
            let cacheName = DYNAMIC_CACHE_NAME;
            
            if (STATIC_ASSETS.some(asset => url.endsWith(asset))) {
              cacheName = STATIC_CACHE_NAME;
            }

            // Cache the response
            caches.open(cacheName)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('Service Worker: Network fetch failed:', error);
            
            // Return offline fallback for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // For other requests, just reject
            throw error;
          });
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      static: STATIC_CACHE_NAME,
      dynamic: DYNAMIC_CACHE_NAME
    });
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Handle any offline actions here
  }
});

// Push notifications (placeholder for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('Service Worker: Push notification received:', data);
    
    // Show notification
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'sandquake-notification'
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

console.log('Service Worker: Script loaded successfully');