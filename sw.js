// Service Worker for Kinly PWA
const CACHE_NAME = 'kinly-v2.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const CACHE_FILES = [
  '/',
  '/index.html',
  '/app.html',
  '/signup.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Kinly Service Worker: Installing v2.0.0...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Kinly Service Worker: Caching files');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => {
        console.log('Kinly Service Worker: Files cached successfully');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('Kinly Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Kinly Service Worker: Activating v2.0.0...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Kinly Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Kinly Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached files when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external URLs
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle Netlify functions differently
  if (event.request.url.includes('/.netlify/functions/')) {
    // Don't cache function calls, but provide fallback
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({ 
            error: 'You appear to be offline. Please check your connection and try again.' 
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Kinly Service Worker: Serving from cache', event.request.url);
          return response;
        }

        // Try to fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache for future use (only cache GET requests for same origin)
            if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // If network fails and we're requesting a page, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // For other requests, return a basic offline response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Kinly Service Worker: Skipping waiting');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME
    });
  }
});

// Push notifications for Kinly (when implemented)
self.addEventListener('push', (event) => {
  console.log('Kinly Service Worker: Push notification received');
  
  let notificationData = {
    title: 'Kinly',
    body: 'You have a new message from your AI friend!',
    tag: 'kinly-message',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: '/app.html'
    },
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
        icon: '/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Kinly Service Worker: Failed to parse push data', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Kinly Service Worker: Notification clicked', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/app.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if Kinly is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // If app is open, focus and navigate to chat
            client.focus();
            if (client.url !== self.location.origin + urlToOpen) {
              return client.navigate(urlToOpen);
            }
            return client;
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle background sync (for when offline messages need to be sent)
self.addEventListener('sync', (event) => {
  console.log('Kinly Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'kinly-chat-sync') {
    event.waitUntil(
      // Future: Handle offline message queue
      Promise.resolve()
    );
  }
});

// Periodic background sync (for usage limit resets, etc.)
self.addEventListener('periodicsync', (event) => {
  console.log('Kinly Service Worker: Periodic sync triggered', event.tag);
  
  if (event.tag === 'kinly-usage-check') {
    event.waitUntil(
      // Future: Check if usage limits should reset
      Promise.resolve()
    );
  }
});
