// Service Worker for ACCESS PAL PWA
const CACHE_NAME = 'access-pal-v3';
const urlsToCache = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install service worker and cache static assets only
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// NETWORK FIRST strategy - always try network, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response to cache for offline use
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

// Update service worker and take control immediately
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event);
  
  // Default notification data
  let title = 'ACCESS PAL';
  let options = {
    body: 'Someone is at your door!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'visitor-call',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: '/dashboard'
    }
  };

  // Parse payload from server
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('📦 Push payload:', payload);
      
      // Extract title and body from payload
      if (payload.title) title = payload.title;
      if (payload.body) options.body = payload.body;
      if (payload.icon) options.icon = payload.icon;
      if (payload.badge) options.badge = payload.badge;
      if (payload.tag) options.tag = payload.tag;
      if (payload.requireInteraction !== undefined) options.requireInteraction = payload.requireInteraction;
      if (payload.vibrate) options.vibrate = payload.vibrate;
      if (payload.data) options.data = payload.data;
    } catch (e) {
      console.error('❌ Error parsing push payload:', e);
    }
  }

  console.log('📣 Showing notification:', title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if dashboard is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
