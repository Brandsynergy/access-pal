// Service Worker for ACCESS PAL PWA - v4.1 Duplicate Fix
const CACHE_NAME = 'access-pal-v4-1-duplicate-fix';
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

// Handle push notifications - CRITICAL for iOS!
self.addEventListener('push', (event) => {
  console.log('🔔🔔🔔 PUSH RECEIVED IN SERVICE WORKER!');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📱 Event data:', event.data);
  
  // Default notification data with iOS-optimized settings
  let title = '🚪 ACCESS PAL - Visitor at Door!';
  let options = {
    body: 'Someone is at your door! Tap to answer.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'visitor-call', // STATIC tag - replaces previous notification
    requireInteraction: true,
    renotify: true, // CRITICAL: Force show even if similar notification exists
    silent: false, // CRITICAL: Must not be silent
    vibrate: [300, 200, 300, 200, 300], // Stronger vibration
    timestamp: Date.now(),
    data: {
      url: '/dashboard',
      timestamp: Date.now()
    },
    // iOS-specific: Actions for notification
    actions: [
      {
        action: 'open',
        title: 'Answer',
        icon: '/icon-192.png'
      }
    ]
  };

  // Parse payload from server
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('📦 Parsed payload:', payload);
      
      // Extract title and body from payload
      if (payload.title) title = payload.title;
      if (payload.body) options.body = payload.body;
      if (payload.icon) options.icon = payload.icon;
      if (payload.badge) options.badge = payload.badge;
      if (payload.tag) options.tag = payload.tag; // Use tag from payload if provided
      if (payload.requireInteraction !== undefined) options.requireInteraction = payload.requireInteraction;
      if (payload.vibrate) options.vibrate = payload.vibrate;
      if (payload.data) options.data = { ...options.data, ...payload.data };
    } catch (e) {
      console.error('❌ Error parsing push payload:', e);
      // Continue with default notification even if parsing fails
    }
  }

  console.log('📣 SHOWING NOTIFICATION NOW:', title);
  console.log('📣 Options:', JSON.stringify(options));

  // CRITICAL: Must use event.waitUntil to keep service worker alive
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('✅✅✅ NOTIFICATION DISPLAYED SUCCESSFULLY!');
        return self.registration.getNotifications();
      })
      .then(notifications => {
        console.log('📋 Active notifications:', notifications.length);
        notifications.forEach(n => console.log('  -', n.title, n.tag));
      })
      .catch(err => {
        console.error('❌❌❌ NOTIFICATION FAILED:', err);
      })
  );
});

// Handle notification click - iOS optimized
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked!');
  console.log('🎯 Action:', event.action);
  console.log('📦 Data:', event.notification.data);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
    .then((clientList) => {
      console.log('📋 Found', clientList.length, 'open windows');
      
      // Try to focus existing dashboard window
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        console.log('  - Window', i, ':', client.url);
        if (client.url.includes('/dashboard') && 'focus' in client) {
          console.log('✅ Focusing existing dashboard');
          return client.focus();
        }
      }
      
      // No dashboard open, open new window
      if (clients.openWindow) {
        console.log('🆕 Opening new window:', urlToOpen);
        return clients.openWindow(urlToOpen);
      }
    })
    .then(windowClient => {
      console.log('✅ Window opened/focused:', windowClient?.url);
    })
    .catch(err => {
      console.error('❌ Error opening window:', err);
    })
  );
});
