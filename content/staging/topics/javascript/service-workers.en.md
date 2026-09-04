---
title: JavaScript Service Workers
description: 学习 Service Workers 实现离线应用、缓存策略和推送通知
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Service Workers
  - PWA
  - 离线
status: imported
origin: old/src/content/docs/javascript/service-workers.en.md
divergence: 0.195
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 26
  lastUpdated: 2026-01-07
---

## Overview

A Service Worker is a script that runs in the background of the browser, independent of the web page. It acts as a proxy server between web applications, the browser, and the network. As a core technology of Progressive Web Apps (PWAs), Service Workers give web applications capabilities close to native apps, including advanced features like offline access, background sync, and push notifications.

### Why Do We Need Service Workers

In traditional web development, applications are completely dependent on network connectivity. Once users go offline, the application cannot function properly. Service Workers have fundamentally changed this situation:

```javascript
// Network request without Service Worker
fetch('/api/data')
  .then(response => response.json())
  .then(data => renderUI(data))
  .catch(error => {
    // Network error, user sees blank page or error message
    showError('Unable to load data, please check your network connection');
  });

// With Service Worker, cached responses can be provided even when offline
// Service Worker intercepts requests and returns cached content
```

### Core Capabilities of Service Workers

| Capability | Description | Use Case |
|------------|-------------|----------|
| Network Proxy | Intercept and handle network requests | Implement custom caching strategies |
| Offline Support | Provide content without network | Offline-first applications |
| Background Sync | Sync data when network recovers | Form submission, message sending |
| Push Notifications | Receive server push messages | Real-time message alerts |
| Resource Pre-caching | Cache critical resources in advance | Improve initial load speed |

---

## Service Worker Lifecycle

Service Workers have their own lifecycle independent of the web page, which is key to enabling offline functionality. Understanding the lifecycle is crucial for using Service Workers correctly.

### Lifecycle Stages

```
Download → Parse → Installing → Waiting → Activating → Activated → Idle/Terminated
                      ↓                       ↓
               install event            activate event
```

### Registration Phase

Registration is the starting point of the Service Worker lifecycle. The browser downloads and parses the Service Worker script.

```javascript
// Register Service Worker in the main thread
// main.js

// First check if the browser supports it
if ('serviceWorker' in navigator) {
  // Register after page load to avoid affecting initial render performance
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',                    // Control scope, defaults to SW file directory
        updateViaCache: 'none'         // Don't use HTTP cache for update checks
      });

      console.log('Service Worker registered successfully');
      console.log('Scope:', registration.scope);

      // Check Service Worker status
      if (registration.installing) {
        console.log('Service Worker is installing');
      } else if (registration.waiting) {
        console.log('Service Worker is installed, waiting to activate');
      } else if (registration.active) {
        console.log('Service Worker is activated');
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}
```

### Installing Phase

When a Service Worker is first registered or an update is detected, the `install` event is triggered. This is the best time to pre-cache static resources.

```javascript
// sw.js

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;

// Core resources to pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/images/logo.png',
  '/offline.html',          // Offline fallback page
  '/manifest.json'
];

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');

  // event.waitUntil() tells the browser when installation is complete
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching resources');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        // skipWaiting() skips waiting and activates immediately
        // Note: This may cause old pages to use the new Service Worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Pre-caching failed:', error);
        // Pre-cache failure will cause installation to fail
        throw error;
      })
  );
});
```

### Waiting Phase

A newly installed Service Worker enters the waiting state until all pages using the old version are closed.

```javascript
// Detect new version waiting to activate
navigator.serviceWorker.ready.then(registration => {
  // Listen for Service Worker state changes
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // Old Service Worker exists, new version waiting to activate
          console.log('New version ready, waiting to activate');
          showUpdateNotification();
        } else {
          // First installation
          console.log('App is now available offline');
        }
      }
    });
  });
});

// Show update notification
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.textContent = 'New version available';

  const button = document.createElement('button');
  button.textContent = 'Update now';
  button.onclick = updateServiceWorker;
  notification.appendChild(button);

  document.body.appendChild(notification);
}

// Trigger update
function updateServiceWorker() {
  navigator.serviceWorker.ready.then(registration => {
    if (registration.waiting) {
      // Tell the waiting Service Worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}

// Listen for controller change and reload page
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});
```

### Activating Phase

When no pages are using the old version, the new Service Worker activates. This is the best time to clean up old caches.

```javascript
// sw.js

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete all caches that are not the current version
              return cacheName.startsWith('app-cache-') &&
                     cacheName !== CACHE_NAME;
            })
            .map(cacheName => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),

      // Immediately take control of all pages
      self.clients.claim()
    ])
    .then(() => {
      console.log('[Service Worker] Activation complete');
    })
  );
});

// Listen for skip waiting message in install event
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

### Activated State

Once activated, the Service Worker starts controlling pages and can respond to fetch, push, sync, and other events.

```javascript
// sw.js

// Respond to network requests
self.addEventListener('fetch', event => {
  // Intercept all network requests
  event.respondWith(handleFetch(event.request));
});

// Respond to push messages
self.addEventListener('push', event => {
  // Handle push notifications
  event.waitUntil(handlePush(event));
});

// Respond to background sync
self.addEventListener('sync', event => {
  // Handle background sync
  event.waitUntil(handleSync(event));
});
```

---

## Registration and Scope

### Registration Details

```javascript
// Complete registration options
const registrationOptions = {
  scope: '/',                  // Scope path
  type: 'classic',             // 'classic' or 'module'
  updateViaCache: 'none'       // 'all', 'imports', 'none'
};

// Advanced registration example
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Browser does not support Service Worker');
    return null;
  }

  // HTTPS check (except localhost)
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    console.warn('Service Worker requires HTTPS');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Registration successful, scope:', registration.scope);

    // Periodically check for updates
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Check every hour

    return registration;

  } catch (error) {
    console.error('Registration failed:', error);
    return null;
  }
}
```

### Scope Rules

A Service Worker can only control pages within its scope and subdirectories.

```javascript
// Scope examples

// sw.js located at /app/sw.js
navigator.serviceWorker.register('/app/sw.js');
// Default scope: /app/
// Can control: /app/, /app/page.html, /app/sub/page.html
// Cannot control: /, /other/

// Explicitly specify scope
navigator.serviceWorker.register('/sw.js', { scope: '/blog/' });
// Scope: /blog/
// Can control: /blog/, /blog/posts/1
// Cannot control: /, /app/

// Scope limitation
// Scope cannot exceed the directory containing the Service Worker file
// Unless the server sets the Service-Worker-Allowed response header

// Error example
navigator.serviceWorker.register('/scripts/sw.js', { scope: '/' });
// Will fail because /scripts/sw.js cannot control /

// Solution: Server configuration
// Response header: Service-Worker-Allowed: /
```

### Multiple Service Workers

```javascript
// A domain can have multiple Service Workers with different scopes

// Main site Service Worker
navigator.serviceWorker.register('/sw-main.js', { scope: '/' });

// Blog-specific Service Worker
navigator.serviceWorker.register('/blog/sw-blog.js', { scope: '/blog/' });

// Admin panel Service Worker
navigator.serviceWorker.register('/admin/sw-admin.js', { scope: '/admin/' });

// Note: More specific scopes take priority
// /blog/post/1 will be controlled by the /blog/ scope SW, not /
```

---

## Fetch Event and Request Interception

The fetch event is the most powerful capability of Service Workers, allowing you to intercept and handle all network requests.

### Basic Interception

```javascript
// sw.js

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  console.log('[Service Worker] Intercepting request:', request.url);
  console.log('Request method:', request.method);
  console.log('Request mode:', request.mode);           // 'cors', 'no-cors', 'same-origin', 'navigate'
  console.log('Credentials mode:', request.credentials);    // 'omit', 'same-origin', 'include'
  console.log('Destination type:', request.destination);    // 'document', 'image', 'script', 'style', etc.

  // respondWith() must be called synchronously
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  // Try to get from cache
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[Service Worker] Returning from cache:', request.url);
    return cachedResponse;
  }

  // Cache miss, make network request
  console.log('[Service Worker] Fetching from network:', request.url);
  return fetch(request);
}
```

### Request Filtering

```javascript
// sw.js

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return; // Don't call respondWith, let browser handle normally
  }

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip API requests (use different strategy)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Skip WebSocket requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Handle other requests
  event.respondWith(handleStaticRequest(request));
});
```

### Modifying Requests and Responses

```javascript
// sw.js

self.addEventListener('fetch', event => {
  const request = event.request;

  event.respondWith(
    (async () => {
      // Modify request: add custom headers
      const modifiedRequest = new Request(request, {
        headers: new Headers({
          ...Object.fromEntries(request.headers.entries()),
          'X-Custom-Header': 'ServiceWorker',
          'X-Request-Time': Date.now().toString()
        })
      });

      try {
        const response = await fetch(modifiedRequest);

        // Modify response: add custom headers
        const modifiedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers({
            ...Object.fromEntries(response.headers.entries()),
            'X-Served-By': 'ServiceWorker',
            'X-Cache-Status': 'MISS'
          })
        });

        return modifiedResponse;

      } catch (error) {
        // Network error, return custom error response
        return new Response(
          JSON.stringify({ error: 'Network request failed', message: error.message }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    })()
  );
});
```

### Routing Strategy

```javascript
// sw.js

// Define routing rules
const routes = [
  {
    match: /^\/api\//,
    handler: networkFirst
  },
  {
    match: /\.(js|css)$/,
    handler: staleWhileRevalidate
  },
  {
    match: /\.(png|jpg|jpeg|gif|svg|webp)$/,
    handler: cacheFirst
  },
  {
    match: /^\/$/,
    handler: networkFirst
  }
];

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Find matching route
  const route = routes.find(r => {
    if (r.match instanceof RegExp) {
      return r.match.test(url.pathname);
    }
    return url.pathname === r.match;
  });

  if (route) {
    event.respondWith(route.handler(event.request));
  }
});
```

---

## Caching Strategies

Caching strategies determine how Service Workers handle requests. Choosing the right strategy is crucial for application performance and user experience.

### Cache Only

Only fetch from cache, suitable for static resources that never change.

```javascript
// sw.js

async function cacheOnly(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Cache miss, return error
  return new Response('Resource not cached', {
    status: 404,
    statusText: 'Not Found'
  });
}

// Use cases
// - Pre-cached App Shell resources
// - Versioned static resources (files with hash in name)
// - Font files
```

### Network Only

Only fetch from network, don't use cache.

```javascript
// sw.js

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response('Network unavailable', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Use cases
// - Non-GET requests (POST, PUT, DELETE)
// - Real-time data (stock prices, chat messages)
// - Authentication-related requests
```

### Cache First

Check cache first, fetch from network on cache miss.

```javascript
// sw.js

async function cacheFirst(request, cacheName = 'static-cache') {
  // 1. Check cache
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // 2. Cache miss, request from network
  try {
    const networkResponse = await fetch(request);

    // 3. Cache new response
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    // 4. Network also failed, return offline page
    return caches.match('/offline.html');
  }
}

// Use cases
// - Static resources (CSS, JS, images)
// - Content that doesn't change often
// - Performance-priority scenarios
```

### Network First

Request from network first, use cache on failure.

```javascript
// sw.js

async function networkFirst(request, cacheName = 'dynamic-cache', timeout = 3000) {
  const cache = await caches.open(cacheName);

  try {
    // 1. Network request with timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeout);
    });

    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);

    // 2. Cache successful response
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    // 3. Network failed, use cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 4. Cache also empty, return offline page
    return caches.match('/offline.html');
  }
}

// Use cases
// - HTML pages
// - API requests
// - Content that needs to be fresh
```

### Stale While Revalidate

Return cached response immediately while updating cache in background.

```javascript
// sw.js

async function staleWhileRevalidate(request, cacheName = 'swr-cache') {
  const cache = await caches.open(cacheName);

  // 1. Get from cache (immediately)
  const cachedResponse = await cache.match(request);

  // 2. Simultaneously make network request to update cache
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(error => {
      console.log('[SW] Background update failed:', error);
      return null;
    });

  // 3. Return cache immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Use cases
// - Content that changes frequently but doesn't need to be immediately fresh
// - User avatars, comment lists
// - News articles, blog content
```

### Versioned Caching Strategy

```javascript
// sw.js

const CACHE_CONFIG = {
  static: {
    name: 'static-v1',
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
    maxEntries: 100
  },
  dynamic: {
    name: 'dynamic-v1',
    maxAge: 24 * 60 * 60 * 1000,        // 1 day
    maxEntries: 50
  },
  images: {
    name: 'images-v1',
    maxAge: 7 * 24 * 60 * 60 * 1000,    // 7 days
    maxEntries: 200
  }
};

async function cacheWithExpiry(request, config) {
  const cache = await caches.open(config.name);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Check if expired
    const cachedTime = cachedResponse.headers.get('sw-cache-time');
    if (cachedTime && Date.now() - parseInt(cachedTime) < config.maxAge) {
      return cachedResponse;
    }
  }

  // Request fresh data
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    // Add cache timestamp
    const headers = new Headers(networkResponse.headers);
    headers.set('sw-cache-time', Date.now().toString());

    const responseToCache = new Response(await networkResponse.clone().blob(), {
      status: networkResponse.status,
      statusText: networkResponse.statusText,
      headers
    });

    await cache.put(request, responseToCache);

    // Clean up expired entries
    await trimCache(config.name, config.maxEntries);
  }

  return networkResponse;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    // Delete oldest entries
    const deleteCount = keys.length - maxEntries;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}
```

### Complete Caching Strategy Routing

```javascript
// sw.js

const CACHE_NAME = 'app-v1';

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // Select strategy based on request type
  if (request.mode === 'navigate') {
    // HTML pages: network first
    event.respondWith(networkFirst(request, 'pages-cache'));
  } else if (request.destination === 'image') {
    // Images: cache first
    event.respondWith(cacheFirst(request, 'images-cache'));
  } else if (request.destination === 'script' || request.destination === 'style') {
    // JS/CSS: stale while revalidate
    event.respondWith(staleWhileRevalidate(request, 'static-cache'));
  } else if (url.pathname.startsWith('/api/')) {
    // API: network first with short timeout
    event.respondWith(networkFirst(request, 'api-cache', 2000));
  } else {
    // Others: cache first
    event.respondWith(cacheFirst(request, CACHE_NAME));
  }
});
```

---

## Background Sync

The Background Sync API allows web applications to automatically sync data when the network recovers, even if the user has left the page.

### Registering Sync Tasks

```javascript
// main.js

// Check if Background Sync is supported
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  // Background Sync supported
  console.log('Background Sync supported');
}

// Form submission example
async function submitForm(formData) {
  try {
    // First try to submit directly
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      showSuccess('Submission successful');
      return;
    }

    throw new Error('Submission failed');

  } catch (error) {
    // Network error, store data and register sync
    await saveToOutbox(formData);
    await registerSync('sync-forms');
    showNotification('Data saved, will be submitted automatically when network recovers');
  }
}

// Save data to IndexedDB
async function saveToOutbox(data) {
  const db = await openDatabase();
  const tx = db.transaction('outbox', 'readwrite');
  const store = tx.objectStore('outbox');

  await store.add({
    id: Date.now(),
    data: data,
    timestamp: new Date().toISOString()
  });
}

// Register sync task
async function registerSync(tag) {
  const registration = await navigator.serviceWorker.ready;

  try {
    await registration.sync.register(tag);
    console.log('Background sync registered:', tag);
  } catch (error) {
    console.error('Failed to register background sync:', error);
  }
}

// Open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('app-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id' });
      }
    };
  });
}
```

### Handling Sync Events

```javascript
// sw.js

self.addEventListener('sync', event => {
  console.log('[Service Worker] Received sync event:', event.tag);

  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncForms() {
  const db = await openDatabase();
  const tx = db.transaction('outbox', 'readonly');
  const store = tx.objectStore('outbox');
  const items = await getAllFromStore(store);

  console.log('[Service Worker] Items to sync:', items.length);

  for (const item of items) {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(item.data),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Submission successful, delete from outbox
        await deleteFromOutbox(item.id);
        console.log('[Service Worker] Sync successful:', item.id);

        // Notify page
        await notifyClients({
          type: 'SYNC_SUCCESS',
          id: item.id
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('[Service Worker] Sync failed:', error);
      // Throwing error triggers retry
      throw error;
    }
  }
}

// Read all data from IndexedDB
function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Delete synced data from outbox
async function deleteFromOutbox(id) {
  const db = await openDatabase();
  const tx = db.transaction('outbox', 'readwrite');
  const store = tx.objectStore('outbox');
  await store.delete(id);
}

// Notify all clients
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}
```

### Periodic Background Sync

```javascript
// main.js

// Register periodic sync (requires permission)
async function registerPeriodicSync() {
  const registration = await navigator.serviceWorker.ready;

  // Check permission
  const status = await navigator.permissions.query({
    name: 'periodic-background-sync'
  });

  if (status.state === 'granted') {
    try {
      await registration.periodicSync.register('update-content', {
        minInterval: 24 * 60 * 60 * 1000  // Minimum interval 24 hours
      });
      console.log('Periodic sync registered');
    } catch (error) {
      console.error('Failed to register periodic sync:', error);
    }
  }
}

// sw.js

self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  // Update cached content
  const cache = await caches.open('content-cache');

  const urls = [
    '/api/articles',
    '/api/notifications',
    '/data/config.json'
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.error('Update failed:', url, error);
    }
  }
}
```

---

## Push Notifications

The Push API allows servers to send messages to users, even when the web page is not open. This is an important feature for maintaining user engagement.

### Requesting Notification Permission

```javascript
// main.js

async function requestNotificationPermission() {
  // Check browser support
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (!('PushManager' in window)) {
    console.warn('Browser does not support push');
    return false;
  }

  // Check current permission status
  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('User has denied notification permission');
    return false;
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}
```

### Subscribing to Push Service

```javascript
// main.js

// VAPID public key (obtained from server)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

async function subscribeToPush() {
  try {
    // Ensure we have notification permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      throw new Error('No notification permission');
    }

    // Get Service Worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('Subscription already exists');
      return subscription;
    }

    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,  // Must show notifications
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('Push subscription successful:', subscription);

    // Send subscription info to server
    await sendSubscriptionToServer(subscription);

    return subscription;

  } catch (error) {
    console.error('Subscription failed:', error);
    throw error;
  }
}

// Base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Send subscription to server
async function sendSubscriptionToServer(subscription) {
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error('Failed to save subscription');
  }
}

// Unsubscribe
async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();

    // Notify server to delete subscription
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    });

    console.log('Unsubscribed');
  }
}
```

### Handling Push Events

```javascript
// sw.js

self.addEventListener('push', event => {
  console.log('[Service Worker] Received push message');

  let data = {
    title: 'New Message',
    body: 'You have a new notification',
    icon: '/images/icon-192.png',
    badge: '/images/badge.png'
  };

  // Parse push data
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/icon-192.png',
    badge: data.badge || '/images/badge.png',
    image: data.image,                           // Large image
    tag: data.tag || 'default',                  // Notification tag (same tag replaces)
    renotify: data.renotify || false,            // Whether to re-notify for same tag
    requireInteraction: data.requireInteraction || false,  // Whether user interaction required to dismiss
    silent: data.silent || false,                // Whether silent
    vibrate: data.vibrate || [200, 100, 200],    // Vibration pattern
    data: {                                       // Custom data
      url: data.url || '/',
      timestamp: Date.now(),
      ...data.data
    },
    actions: data.actions || [                   // Action buttons
      { action: 'open', title: 'View', icon: '/images/open.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/images/dismiss.png' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
```

### Handling Notification Clicks

```javascript
// sw.js

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked');

  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  // Close notification
  notification.close();

  if (action === 'dismiss') {
    // User clicked "Dismiss", do nothing
    return;
  }

  // Open corresponding page
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already an open window
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // No open window, open new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', event => {
  console.log('[Service Worker] Notification closed');

  // Can record analytics here
  const data = event.notification.data;

  fetch('/api/analytics/notification-closed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag: event.notification.tag,
      timestamp: data.timestamp,
      closedAt: Date.now()
    })
  }).catch(() => {
    // Ignore analytics request failure
  });
});
```

### Server-Side Push Example (Node.js)

```javascript
// server.js

const webpush = require('web-push');

// Configure VAPID
webpush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Store subscriptions (should use database in production)
const subscriptions = new Map();

// Save subscription
app.post('/api/push/subscribe', (req, res) => {
  const { subscription, userAgent } = req.body;

  subscriptions.set(subscription.endpoint, {
    subscription,
    userAgent,
    createdAt: new Date()
  });

  res.status(201).json({ message: 'Subscription successful' });
});

// Send push
async function sendPushNotification(endpoint, payload) {
  const data = subscriptions.get(endpoint);

  if (!data) {
    throw new Error('Subscription does not exist');
  }

  try {
    await webpush.sendNotification(
      data.subscription,
      JSON.stringify(payload)
    );

    console.log('Push sent successfully');

  } catch (error) {
    if (error.statusCode === 410) {
      // Subscription expired, delete it
      subscriptions.delete(endpoint);
    }
    throw error;
  }
}

// Broadcast push
async function broadcastNotification(payload) {
  const results = [];

  for (const [endpoint, data] of subscriptions) {
    try {
      await webpush.sendNotification(
        data.subscription,
        JSON.stringify(payload)
      );
      results.push({ endpoint, success: true });

    } catch (error) {
      results.push({ endpoint, success: false, error: error.message });

      if (error.statusCode === 410) {
        subscriptions.delete(endpoint);
      }
    }
  }

  return results;
}

// API to send notifications
app.post('/api/push/send', async (req, res) => {
  const { title, body, url, tag } = req.body;

  const payload = {
    title,
    body,
    url,
    tag,
    icon: '/images/icon-192.png',
    actions: [
      { action: 'open', title: 'View' }
    ]
  };

  const results = await broadcastNotification(payload);

  res.json({
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  });
});
```

---

## Practical Examples

### Complete PWA Service Worker

```javascript
// sw.js - Production-grade Service Worker

const VERSION = '2.0.0';
const CACHE_PREFIX = 'my-app-';
const CACHES = {
  static: `${CACHE_PREFIX}static-${VERSION}`,
  dynamic: `${CACHE_PREFIX}dynamic-${VERSION}`,
  images: `${CACHE_PREFIX}images-${VERSION}`,
  api: `${CACHE_PREFIX}api-${VERSION}`
};

// Pre-cache resource list
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/main.css',
  '/css/offline.css',
  '/js/app.js',
  '/js/offline.js',
  '/images/logo.svg',
  '/images/offline.svg',
  '/manifest.json'
];

// API configuration
const API_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes
const API_CACHE_MAX_ENTRIES = 50;

// ==================== Install Event ====================

self.addEventListener('install', event => {
  console.log(`[SW v${VERSION}] Installing...`);

  event.waitUntil(
    caches.open(CACHES.static)
      .then(cache => {
        console.log(`[SW v${VERSION}] Pre-caching resources`);
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log(`[SW v${VERSION}] Installation complete`);
        return self.skipWaiting();
      })
  );
});

// ==================== Activate Event ====================

self.addEventListener('activate', event => {
  console.log(`[SW v${VERSION}] Activating...`);

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        const currentCaches = Object.values(CACHES);
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith(CACHE_PREFIX) && !currentCaches.includes(name))
            .map(name => {
              console.log(`[SW v${VERSION}] Deleting old cache:`, name);
              return caches.delete(name);
            })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ]).then(() => {
      console.log(`[SW v${VERSION}] Activation complete`);
    })
  );
});

// ==================== Fetch Event ====================

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip non-same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Route based on request type
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Check if image request
function isImageRequest(request) {
  return request.destination === 'image' ||
         /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname);
}

// Check if static asset
function isStaticAsset(pathname) {
  return /\.(js|css|woff2?|ttf|eot)$/i.test(pathname);
}

// Handle API requests - Network First
async function handleApiRequest(request) {
  const cache = await caches.open(CACHES.api);

  try {
    const response = await fetch(request);

    if (response.ok) {
      // Add cache timestamp
      const responseToCache = await addCacheTimestamp(response);
      await cache.put(request, responseToCache);
      await trimCache(CACHES.api, API_CACHE_MAX_ENTRIES);
    }

    return response;

  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if expired
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (cacheTime && Date.now() - parseInt(cacheTime) < API_CACHE_MAX_AGE) {
        return cachedResponse;
      }
    }

    // Return offline response
    return new Response(JSON.stringify({ error: 'offline', message: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle image requests - Cache First
async function handleImageRequest(request) {
  const cache = await caches.open(CACHES.images);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;

  } catch (error) {
    // Return placeholder image
    return caches.match('/images/offline.svg');
  }
}

// Handle static resources - Cache First
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHES.static);
      cache.put(request, response.clone());
    }

    return response;

  } catch (error) {
    return new Response('Resource not available', { status: 404 });
  }
}

// Handle navigation requests - Network First + Offline Fallback
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHES.dynamic);
      cache.put(request, response.clone());
    }

    return response;

  } catch (error) {
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    return caches.match('/offline.html');
  }
}

// Add cache timestamp
async function addCacheTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-time', Date.now().toString());

  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Trim cache
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    for (let i = 0; i < keys.length - maxEntries; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// ==================== Message Event ====================

self.addEventListener('message', event => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.source.postMessage({ type: 'VERSION', version: VERSION });
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(names =>
          Promise.all(names.map(name => caches.delete(name)))
        ).then(() => {
          event.source.postMessage({ type: 'CACHE_CLEARED' });
        })
      );
      break;

    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(CACHES.dynamic).then(cache =>
          cache.addAll(payload.urls)
        ).then(() => {
          event.source.postMessage({ type: 'URLS_CACHED' });
        })
      );
      break;
  }
});

// ==================== Push Event ====================

self.addEventListener('push', event => {
  let data = {
    title: 'New Message',
    body: 'You have a new notification',
    icon: '/images/icon-192.png',
    badge: '/images/badge.png',
    url: '/'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag || 'default',
      data: { url: data.url },
      actions: [
        { action: 'open', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// ==================== Notification Click ====================

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Find already open window
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

// ==================== Background Sync ====================

self.addEventListener('sync', event => {
  console.log(`[SW v${VERSION}] Background sync:`, event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement data sync logic
  const db = await openDatabase();
  const tx = db.transaction('outbox', 'readonly');
  const store = tx.objectStore('outbox');
  const items = await getAllItems(store);

  for (const item of items) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });

      await deleteItem(item.id);

    } catch (error) {
      console.error('Sync failed:', error);
      throw error; // Trigger retry
    }
  }
}

// IndexedDB helper functions
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('app-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllItems(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteItem(id) {
  const db = await openDatabase();
  const tx = db.transaction('outbox', 'readwrite');
  return tx.objectStore('outbox').delete(id);
}
```

### Main Thread Management Code

```javascript
// sw-manager.js - Service Worker Management Class

class ServiceWorkerManager {
  constructor(swPath = '/sw.js') {
    this.swPath = swPath;
    this.registration = null;
    this.updateCallbacks = [];
  }

  // Register Service Worker
  async register() {
    if (!this.isSupported()) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register(this.swPath, {
        scope: '/'
      });

      console.log('Service Worker registered successfully');

      // Set up update listener
      this.setupUpdateListener();

      // Set up message listener
      this.setupMessageListener();

      return this.registration;

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // Check support
  isSupported() {
    return 'serviceWorker' in navigator;
  }

  // Listen for updates
  setupUpdateListener() {
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New version available
            this.updateCallbacks.forEach(cb => cb());
          }
        }
      });
    });

    // Listen for controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  // Message listener
  setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', event => {
      console.log('Received message from Service Worker:', event.data);
    });
  }

  // Register update callback
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  // Check for updates
  async checkForUpdate() {
    if (this.registration) {
      await this.registration.update();
    }
  }

  // Skip waiting
  skipWaiting() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Post message
  postMessage(message) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  // Get version
  async getVersion() {
    return new Promise(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = event => {
        if (event.data.type === 'VERSION') {
          resolve(event.data.version);
        }
      };

      navigator.serviceWorker.controller?.postMessage(
        { type: 'GET_VERSION' },
        [channel.port2]
      );
    });
  }

  // Clear cache
  async clearCache() {
    return new Promise(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();

      navigator.serviceWorker.controller?.postMessage(
        { type: 'CLEAR_CACHE' },
        [channel.port2]
      );
    });
  }

  // Unregister
  async unregister() {
    if (this.registration) {
      const success = await this.registration.unregister();
      if (success) {
        this.registration = null;
      }
      return success;
    }
    return false;
  }
}

// Usage example
const swManager = new ServiceWorkerManager('/sw.js');

// Register after page load
window.addEventListener('load', async () => {
  await swManager.register();

  // Listen for updates
  swManager.onUpdate(() => {
    if (confirm('New version available, would you like to update?')) {
      swManager.skipWaiting();
    }
  });
});
```

---

## Common Issues and Debugging

### Debugging Tips

```javascript
// 1. Use Chrome DevTools
// Application -> Service Workers

// 2. Force update
// Check "Update on reload"

// 3. View cache
// Application -> Cache Storage

// 4. Clear all data
// Application -> Clear storage

// 5. Add logging in Service Worker
self.addEventListener('fetch', event => {
  console.log('[SW]', event.request.method, event.request.url);
  // ...
});
```

### Common Error Handling

```javascript
// 1. Registration failure
navigator.serviceWorker.register('/sw.js')
  .catch(error => {
    if (error.name === 'SecurityError') {
      console.error('HTTPS environment required');
    } else if (error.message.includes('unsupported MIME type')) {
      console.error('Service Worker file type error, needs application/javascript');
    } else {
      console.error('Registration failed:', error);
    }
  });

// 2. Cache failure
cache.addAll(urls).catch(error => {
  console.error('Pre-caching failed:', error);
  // Possibly a URL doesn't exist
  // Use cache.add() individually to locate the problem
});

// 3. Response clone error
fetch(request).then(response => {
  // Response can only be read once, need to clone
  const clonedResponse = response.clone();
  cache.put(request, clonedResponse);
  return response;
});
```

### Performance Optimization Tips

1. **Reduce Service Worker file size**
   - Avoid importing large libraries in SW
   - Use dynamic imports

2. **Use pre-caching wisely**
   - Only pre-cache core resources
   - Cache other resources at runtime

3. **Set cache expiration policies**
   - Periodically clean old caches
   - Limit cache entry count

4. **Use Navigation Preload**
   - Reduce wait time for navigation requests

```javascript
// Enable Navigation Preload
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );
});

// Use preload response
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }
        return fetch(event.request);
      })()
    );
  }
});
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | 40+ | 44+ | 11.1+ | 17+ |
| Push API | 42+ | 44+ | 16+ | 17+ |
| Background Sync | 49+ | Not supported | Not supported | 79+ |
| Navigation Preload | 59+ | Not supported | Not supported | 79+ |

### Feature Detection

```javascript
// Complete feature detection
const features = {
  serviceWorker: 'serviceWorker' in navigator,
  push: 'PushManager' in window,
  notification: 'Notification' in window,
  backgroundSync: 'serviceWorker' in navigator && 'SyncManager' in window,
  periodicSync: 'serviceWorker' in navigator && 'PeriodicSyncManager' in window,
  cacheAPI: 'caches' in window
};

console.log('Supported features:', features);
```

---

## Summary

Service Workers are an important technology in modern web development, giving web applications the following capabilities:

1. **Offline Support** - Enable offline access through caching strategies
2. **Performance Optimization** - Reduce network requests and speed up loading
3. **Background Processing** - Support background sync and push notifications
4. **Reliability** - Work properly even in unstable network conditions

### Best Practices

- Progressive Enhancement: Ensure the app works properly even when Service Worker is not supported
- Version Management: Use version numbers to manage caches and ensure updates are delivered correctly
- Error Handling: Handle various error conditions gracefully
- User Experience: Notify users promptly when new versions are available
- Performance Monitoring: Monitor the performance impact of Service Workers

### Further Reading

- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google Developers - Service Workers](https://developers.google.com/web/fundamentals/primers/service-workers)
- [Workbox](https://developers.google.com/web/tools/workbox) - Google's Service Worker toolkit
- [PWA Learning Path](https://web.dev/learn/pwa/)
