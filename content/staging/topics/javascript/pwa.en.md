---
title: Progressive Web Apps (PWA) Guide
description: Master PWA development for native-like web experiences
track: javascript
section: browser
difficulty: advanced
tags:
  - PWA
  - Service Worker
  - Offline
  - Mobile
status: imported
origin: old/src/content/docs/frontend/pwa.en.md
divergence: 0.202
issues: []
legacy:
  category: Frontend
  subcategory: Advanced
  order: 22
  lastUpdated: 2026-01-07
---

## What is a Progressive Web App?

Progressive Web Apps (PWAs) are web applications built using modern web technologies that combine the best features of both web and native applications. PWAs can work offline, receive push notifications, and be installed on a device's home screen while maintaining the accessibility and cross-platform nature of web applications.

### Historical Background

The PWA concept was first introduced by Google engineers Alex Russell and Frances Berriman in 2015. The core idea is to progressively enhance web applications to provide a better user experience in browsers that support these technologies.

**PWA Evolution Timeline:**
- **2015**: PWA concept introduced, Service Worker API gains adoption
- **2017**: Major browsers begin supporting PWA-related technologies
- **2018**: iOS Safari starts supporting Service Workers
- **2020**: PWA gains widespread support on desktop platforms
- **2023-Present**: PWA capabilities continue expanding with more native-like features

### The Three Pillars of PWA

```
+----------------------------------------------------------+
|                    PWA Technology Stack                   |
+----------------------------------------------------------+
|                                                           |
|  +----------------+  +----------------+  +---------------+ |
|  |     HTTPS     |  | Service Worker |  |   Web App     | |
|  | Secure Origin |  | Background     |  |   Manifest    | |
|  +----------------+  +----------------+  +---------------+ |
|         |                  |                   |          |
|         v                  v                   v          |
|  Secure Connection    Offline/Caching      App Metadata   |
|     Foundation       Push Notifications    Installation   |
|                      Background Sync       Experience     |
|                                                           |
+----------------------------------------------------------+
```

---

## Core Concepts and Advantages

### Key Characteristics of PWAs

PWAs possess the following characteristics that distinguish them from traditional web applications:

```typescript
// PWA Feature Detection Utility
class PWAFeatureDetector {
  // Check Service Worker support
  static hasServiceWorker(): boolean {
    return 'serviceWorker' in navigator;
  }

  // Check Push Notification support
  static hasPushNotification(): boolean {
    return 'PushManager' in window;
  }

  // Check Background Sync support
  static hasBackgroundSync(): boolean {
    return 'sync' in ServiceWorkerRegistration.prototype;
  }

  // Check install prompt support
  static hasBeforeInstallPrompt(): boolean {
    return 'BeforeInstallPromptEvent' in window;
  }

  // Check Network Information API
  static hasNetworkInformation(): boolean {
    return 'connection' in navigator;
  }

  // Generate comprehensive feature report
  static getFeatureReport(): Record<string, boolean> {
    return {
      serviceWorker: this.hasServiceWorker(),
      pushNotification: this.hasPushNotification(),
      backgroundSync: this.hasBackgroundSync(),
      installPrompt: this.hasBeforeInstallPrompt(),
      networkInfo: this.hasNetworkInformation(),
    };
  }
}

// Usage example
const features = PWAFeatureDetector.getFeatureReport();
console.log('PWA Feature Support:', features);
```

### Core Advantages of PWAs

| Advantage | Description | Compared to Traditional Web |
|-----------|-------------|----------------------------|
| **Offline Available** | Service Worker caching enables offline access | Traditional web requires network connection |
| **Installable** | Can be added to home screen, launches like native app | Only accessible through browser |
| **Push Notifications** | Supports background push messages | Requires user to actively visit site |
| **Fast Loading** | Smart caching strategies improve load times | Every visit requires network requests |
| **Responsive** | Adapts to all screen sizes | Usually also supported |
| **Secure** | Must use HTTPS | HTTP is also allowed |
| **Auto-Updates** | Background updates automatically | Users need to manually refresh |

### PWA Use Case Evaluation

```typescript
// PWA Suitability Assessment
interface PWAUseCaseEvaluation {
  scenario: string;
  suitability: 'high' | 'medium' | 'low';
  reasons: string[];
}

const pwaUseCases: PWAUseCaseEvaluation[] = [
  {
    scenario: 'News/Content Applications',
    suitability: 'high',
    reasons: [
      'Content can be cached for offline reading',
      'Push notifications alert users to new content',
      'Fast loading improves reading experience'
    ]
  },
  {
    scenario: 'E-commerce Applications',
    suitability: 'high',
    reasons: [
      'Offline browsing of product catalogs',
      'Push notifications for promotions',
      'Fast product page loading'
    ]
  },
  {
    scenario: 'Social Applications',
    suitability: 'medium',
    reasons: [
      'Message push notifications',
      'Offline viewing of message history',
      'Real-time chat features are limited'
    ]
  },
  {
    scenario: 'Graphics-Heavy Games',
    suitability: 'low',
    reasons: [
      'High performance requirements',
      'Complex graphics rendering needed',
      'Native apps are more suitable'
    ]
  }
];
```

---

## Web App Manifest Configuration

The Web App Manifest is a JSON file that tells the browser about your PWA and how it should behave when installed on the user's device.

### Complete Manifest Configuration

```json
{
  "name": "My PWA Application",
  "short_name": "MyPWA",
  "description": "A feature-complete progressive web application example",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#3B82F6",
  "background_color": "#ffffff",
  "lang": "en",
  "dir": "ltr",
  "categories": ["productivity", "utilities"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Home page screenshot"
    },
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Mobile home page"
    }
  ],
  "shortcuts": [
    {
      "name": "New Task",
      "short_name": "New",
      "description": "Quickly create a new task",
      "url": "/new-task",
      "icons": [
        {
          "src": "/icons/shortcut-new.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Today's Tasks",
      "url": "/today",
      "icons": [
        {
          "src": "/icons/shortcut-today.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "related_applications": [
    {
      "platform": "play",
      "url": "https://play.google.com/store/apps/details?id=com.example.app",
      "id": "com.example.app"
    }
  ],
  "prefer_related_applications": false,
  "share_target": {
    "action": "/share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "media",
          "accept": ["image/*", "video/*"]
        }
      ]
    }
  }
}
```

### Manifest Configuration Explained

```typescript
// Manifest Configuration Type Definitions
interface WebAppManifest {
  // Basic Information
  name: string;              // Full application name
  short_name: string;        // Short name for home screen
  description?: string;      // Application description

  // Launch Configuration
  start_url: string;         // Starting URL
  scope?: string;            // Application scope

  // Display Mode
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  orientation?: 'any' | 'natural' | 'landscape' | 'portrait' |
    'portrait-primary' | 'portrait-secondary' |
    'landscape-primary' | 'landscape-secondary';

  // Theme Configuration
  theme_color?: string;      // Theme color (status bar, toolbar)
  background_color?: string; // Splash screen background color

  // Icon Configuration
  icons: ManifestIcon[];

  // Shortcuts
  shortcuts?: ManifestShortcut[];

  // Share Target
  share_target?: ShareTarget;
}

// Display mode explanations
const displayModes = {
  fullscreen: 'Fullscreen mode, hides all browser UI',
  standalone: 'Standalone app mode, like native apps with its own window',
  'minimal-ui': 'Minimal UI mode, retains essential navigation controls',
  browser: 'Browser mode, opens in a regular browser tab'
};
```

### Linking the Manifest in HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Link Web App Manifest -->
  <link rel="manifest" href="/manifest.json">

  <!-- iOS Support (Safari doesn't fully support manifest) -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="My PWA">
  <link rel="apple-touch-icon" href="/icons/icon-152x152.png">

  <!-- Theme Color -->
  <meta name="theme-color" content="#3B82F6">

  <!-- Windows Tile -->
  <meta name="msapplication-TileImage" content="/icons/icon-144x144.png">
  <meta name="msapplication-TileColor" content="#3B82F6">

  <title>My PWA Application</title>
</head>
<body>
  <!-- Application Content -->
</body>
</html>
```

---

## Service Worker Deep Dive

The Service Worker is the core technology of PWAs. It is a script that runs in the background, separate from the web page, enabling features like offline caching, push notifications, and background sync.

### Service Worker Lifecycle

```
                    +------------------+
                    |  Register        |
                    +--------+---------+
                             |
                             v
                    +--------+---------+
                    |  Install         |
                    | (Download/cache  |
                    |  resources)      |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
     +--------+--------+           +--------+--------+
     | Waiting         |           | Activate        |
     | (Old SW still   |           | (Cleanup old    |
     |  in control)    |           |  caches)        |
     +-----------------+           +--------+--------+
                                            |
                                            v
                                   +--------+--------+
                                   | Idle            |
                                   +--------+--------+
                                            |
                       +--------------------+--------------------+
                       |                    |                    |
                       v                    v                    v
              +--------+--------+  +--------+--------+  +--------+--------+
              | fetch event     |  | push event      |  | sync event      |
              | (Intercept      |  | (Receive push)  |  | (Background     |
              |  requests)      |  |                 |  |  sync)          |
              +-----------------+  +-----------------+  +-----------------+
```

### Registering a Service Worker

```typescript
// src/service-worker-registration.ts

// Service Worker Registration Configuration
interface SWRegistrationConfig {
  scope?: string;
  updateViaCache?: 'imports' | 'all' | 'none';
}

// Register Service Worker
async function registerServiceWorker(
  swPath: string = '/sw.js',
  config: SWRegistrationConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  // Check browser support
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported by this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: config.scope || '/',
      updateViaCache: config.updateViaCache || 'none'
    });

    console.log('Service Worker registered successfully:', registration.scope);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('New Service Worker version found');

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New version available, prompt user to refresh
            showUpdateNotification();
          } else {
            // First installation complete
            console.log('Service Worker first installation complete');
          }
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Show update notification
function showUpdateNotification(): void {
  const shouldUpdate = confirm('A new version is available. Update now?');
  if (shouldUpdate) {
    // Notify Service Worker to skip waiting
    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
    // Reload the page
    window.location.reload();
  }
}

// Register after page load
if (document.readyState === 'complete') {
  registerServiceWorker();
} else {
  window.addEventListener('load', () => registerServiceWorker());
}
```

### Complete Service Worker Implementation

```javascript
// sw.js - Service Worker Script

const CACHE_NAME = 'pwa-cache-v1';
const STATIC_CACHE_NAME = 'static-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';

// Static assets to precache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/icons/icon-192x192.png',
  '/offline.html'  // Offline fallback page
];

// Install event - Precache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting, activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - Cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete caches that are not current version
              return cacheName !== STATIC_CACHE_NAME &&
                     cacheName !== DYNAMIC_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Immediately take control of all pages
        return self.clients.claim();
      })
  );
});

// Intercept network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Choose strategy based on request type
  if (request.destination === 'document') {
    // HTML pages - Network First strategy
    event.respondWith(networkFirst(request));
  } else if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image'
  ) {
    // Static assets - Cache First strategy
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API requests - Network Only + cache response
    event.respondWith(networkOnly(request));
  } else {
    // Other requests - Stale While Revalidate strategy
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Listen for messages from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

---

## Offline Caching Strategies

Caching strategies are crucial for PWA performance and user experience. Different resource types should employ different caching strategies.

### Five Common Caching Strategies

```javascript
// Caching Strategy Implementations

/**
 * Strategy 1: Cache First
 * Use case: Static assets (CSS, JS, images)
 * Behavior: Prioritize cache, fall back to network if cache miss
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[Cache First] Returning from cache:', request.url);
    return cachedResponse;
  }

  console.log('[Cache First] Cache miss, fetching from network:', request.url);
  const networkResponse = await fetch(request);

  // Cache the new response
  const cache = await caches.open(STATIC_CACHE_NAME);
  cache.put(request, networkResponse.clone());

  return networkResponse;
}

/**
 * Strategy 2: Network First
 * Use case: HTML pages, content that needs to be fresh
 * Behavior: Prioritize network, fall back to cache on failure
 */
async function networkFirst(request) {
  try {
    console.log('[Network First] Fetching from network:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Network First] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for document requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    throw error;
  }
}

/**
 * Strategy 3: Stale While Revalidate
 * Use case: Content that doesn't need to be real-time but should be updated
 * Behavior: Return cache immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Update cache in background (non-blocking)
  const networkResponsePromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  // Return cache immediately if available, otherwise wait for network
  if (cachedResponse) {
    console.log('[SWR] Returning cache, updating in background:', request.url);
    return cachedResponse;
  }

  console.log('[SWR] No cache, waiting for network:', request.url);
  return networkResponsePromise;
}

/**
 * Strategy 4: Network Only
 * Use case: API requests that don't need caching
 * Behavior: Always fetch from network, never use cache
 */
async function networkOnly(request) {
  console.log('[Network Only] Fetching from network:', request.url);
  return fetch(request);
}

/**
 * Strategy 5: Cache Only
 * Use case: Fully offline apps, precached resources
 * Behavior: Only use cache, never fetch from network
 */
async function cacheOnly(request) {
  console.log('[Cache Only] Fetching from cache:', request.url);
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  throw new Error('Resource not found in cache');
}
```

### Caching Strategy Selection Guide

```
+------------------+------------------+------------------+
|   Resource Type  |  Recommended     |      Reason      |
|                  |    Strategy      |                  |
+------------------+------------------+------------------+
| App Shell        | Cache First      | Framework rarely |
| (HTML skeleton)  |                  | changes          |
+------------------+------------------+------------------+
| CSS/JS Bundles   | Cache First +    | Static assets,   |
|                  | Version Control  | updated via hash |
+------------------+------------------+------------------+
| Font Files       | Cache First      | Almost never     |
|                  |                  | change           |
+------------------+------------------+------------------+
| Images           | Cache First      | Reduce bandwidth |
|                  |                  | consumption      |
+------------------+------------------+------------------+
| API Data         | Network First    | Need fresh data  |
+------------------+------------------+------------------+
| User Avatars     | Stale While      | Brief staleness  |
|                  | Revalidate       | is acceptable    |
+------------------+------------------+------------------+
| Real-time Data   | Network Only     | Must be          |
| (stocks, chat)   |                  | real-time        |
+------------------+------------------+------------------+
```

### Advanced Cache Management

```typescript
// Cache Management Utility Class
class CacheManager {
  private staticCacheName: string;
  private dynamicCacheName: string;
  private maxDynamicCacheSize: number;

  constructor(
    staticVersion: string = 'v1',
    dynamicVersion: string = 'v1',
    maxSize: number = 50
  ) {
    this.staticCacheName = `static-${staticVersion}`;
    this.dynamicCacheName = `dynamic-${dynamicVersion}`;
    this.maxDynamicCacheSize = maxSize;
  }

  // Precache static assets
  async precache(assets: string[]): Promise<void> {
    const cache = await caches.open(this.staticCacheName);
    await cache.addAll(assets);
  }

  // Dynamic caching with size limit
  async dynamicCache(request: Request, response: Response): Promise<void> {
    const cache = await caches.open(this.dynamicCacheName);

    // Check cache size
    const keys = await cache.keys();
    if (keys.length >= this.maxDynamicCacheSize) {
      // Delete oldest cache entry (FIFO)
      await cache.delete(keys[0]);
    }

    await cache.put(request, response);
  }

  // Cleanup old caches
  async cleanupOldCaches(currentCacheNames: string[]): Promise<void> {
    const cacheNames = await caches.keys();

    await Promise.all(
      cacheNames
        .filter(name => !currentCacheNames.includes(name))
        .map(name => {
          console.log('Deleting old cache:', name);
          return caches.delete(name);
        })
    );
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    name: string;
    count: number;
    size: number;
  }[]> {
    const cacheNames = await caches.keys();
    const stats = [];

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();

      let totalSize = 0;
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.clone().blob();
          totalSize += blob.size;
        }
      }

      stats.push({
        name,
        count: keys.length,
        size: totalSize
      });
    }

    return stats;
  }
}
```

---

## Push Notifications

Push notifications are an important way for PWAs to engage with users, allowing messages to be sent even when the application is not open.

### Push Notification Flow

```
+--------+        +--------+        +--------+        +--------+
|  User  |        | Web App|        |   SW   |        |  Push  |
|        |        |        |        |        |        | Server |
+---+----+        +---+----+        +---+----+        +---+----+
    |                 |                 |                 |
    | 1. Permission   |                 |                 |
    |    Request      |                 |                 |
    |<----------------|                 |                 |
    |                 |                 |                 |
    | 2. Grant        |                 |                 |
    |    Permission   |                 |                 |
    |---------------->|                 |                 |
    |                 |                 |                 |
    |                 | 3. Subscribe    |                 |
    |                 |    to Push      |                 |
    |                 |---------------->|                 |
    |                 |                 |                 |
    |                 |                 | 4. Get          |
    |                 |                 |    Subscription |
    |                 |                 |---------------->|
    |                 |                 |                 |
    |                 | 5. Send subscription to server    |
    |                 |---------------------------------->|
    |                 |                 |                 |
    |                 |                 | 6. Push Message |
    |                 |                 |<----------------|
    |                 |                 |                 |
    | 7. Display      |                 |                 |
    |    Notification |                 |                 |
    |<----------------------------------|                 |
    |                 |                 |                 |
```

### Requesting Permission and Subscribing

```typescript
// push-notification.ts

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationManager {
  private vapidPublicKey: string;

  constructor(vapidPublicKey: string) {
    this.vapidPublicKey = vapidPublicKey;
  }

  // Check notification permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported by this browser');
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission status:', permission);
    return permission;
  }

  // Subscribe to push service
  async subscribeToPush(): Promise<PushSubscriptionData | null> {
    // Check permission
    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('User denied notification permission');
        return null;
      }
    }

    // Get Service Worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,  // Must be true
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });
    }

    // Convert to sendable format
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      }
    };

    // Save to server
    await this.saveSubscriptionToServer(subscriptionData);

    return subscriptionData;
  }

  // Unsubscribe
  async unsubscribe(): Promise<boolean> {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await this.removeSubscriptionFromServer(subscription.endpoint);
      return true;
    }

    return false;
  }

  // Save subscription to server
  private async saveSubscriptionToServer(
    subscription: PushSubscriptionData
  ): Promise<void> {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(endpoint: string): Promise<void> {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint })
    });
  }

  // VAPID public key conversion
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Usage example
const pushManager = new PushNotificationManager(
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
);

// Subscribe to push
document.getElementById('subscribe-btn')?.addEventListener('click', async () => {
  const subscription = await pushManager.subscribeToPush();
  if (subscription) {
    console.log('Push subscription successful:', subscription);
  }
});
```

### Handling Push in Service Worker

```javascript
// sw.js - Handle push notifications

// Receive push messages
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Received push message');

  let notificationData = {
    title: 'New Message',
    body: 'You have a new message',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
    data: {}
  };

  // Parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      vibrate: [100, 50, 100],
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      requireInteraction: true  // Notification won't auto-close
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  // Handle different actions
  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Find already open window
          for (const client of windowClients) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Not found, open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed');
  // Can log analytics data here
});
```

---

## Installation Experience Optimization

Providing a good installation experience can increase user willingness to install your PWA.

### Custom Install Prompt

```typescript
// install-prompt.ts

class PWAInstallManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installButton: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // Listen for install prompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent default install prompt
      event.preventDefault();
      // Save event for later use
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      // Show custom install button
      this.showInstallButton();

      console.log('PWA can be installed');
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA has been installed');
      this.hideInstallButton();
      this.deferredPrompt = null;
      // Track installation event
      this.trackInstallation();
    });
  }

  // Show install button
  private showInstallButton(): void {
    this.installButton = document.getElementById('pwa-install-btn');
    if (this.installButton) {
      this.installButton.style.display = 'block';
      this.installButton.addEventListener('click', () => this.promptInstall());
    }
  }

  // Hide install button
  private hideInstallButton(): void {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  // Trigger install prompt
  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) {
      console.log('Install prompt is not available');
      return;
    }

    // Show install prompt
    this.deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await this.deferredPrompt.userChoice;

    console.log('User install choice:', outcome);

    if (outcome === 'accepted') {
      console.log('User accepted the installation');
    } else {
      console.log('User dismissed the installation');
    }

    // Clear saved prompt
    this.deferredPrompt = null;
  }

  // Check if already installed
  isInstalled(): boolean {
    // Check display-mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    // iOS Safari
    if ((navigator as any).standalone === true) {
      return true;
    }
    return false;
  }

  // Check if can install
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  // Track installation event
  private trackInstallation(): void {
    // Send to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'Installation'
      });
    }
  }
}

// BeforeInstallPromptEvent type definition
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Initialize
const pwaInstallManager = new PWAInstallManager();
```

### Install Prompt UI Component

```html
<!-- Install Prompt Banner -->
<div id="pwa-install-banner" class="install-banner hidden">
  <div class="install-banner-content">
    <img src="/icons/icon-64x64.png" alt="App Icon" class="install-icon">
    <div class="install-text">
      <h3>Install Our App</h3>
      <p>Get faster access and offline experience</p>
    </div>
    <div class="install-actions">
      <button id="pwa-install-btn" class="btn-primary">Install</button>
      <button id="pwa-dismiss-btn" class="btn-secondary">Later</button>
    </div>
  </div>
</div>

<style>
.install-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 1000;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.install-banner.visible {
  transform: translateY(0);
}

.install-banner.hidden {
  display: none;
}

.install-banner-content {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.install-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.install-text {
  flex: 1;
}

.install-text h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.install-text p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.install-actions {
  display: flex;
  gap: 8px;
}

.btn-primary {
  background: #3B82F6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
```

---

## Background Sync

Background Sync allows data to be automatically synchronized when the network is restored, ensuring user operations are not lost due to network issues.

### Background Sync Implementation

```typescript
// background-sync.ts

class BackgroundSyncManager {
  private dbName = 'offline-requests';
  private storeName = 'pending-requests';
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      };
    });
  }

  // Save request to IndexedDB
  async saveRequest(request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
  }): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const addRequest = store.add({
        ...request,
        timestamp: Date.now()
      });

      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  // Register background sync
  async registerSync(tag: string = 'sync-requests'): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
      console.warn('Background Sync is not supported');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log('Background sync registered:', tag);
  }

  // Fetch with offline support
  async fetchWithOfflineSupport(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      // Network request failed, save to queue
      if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
        await this.saveRequest({
          url,
          method: options.method,
          headers: options.headers as Record<string, string> || {},
          body: options.body as string || ''
        });

        // Register background sync
        await this.registerSync();

        // Return offline response
        return new Response(JSON.stringify({
          offline: true,
          message: 'Request saved, will sync automatically when online'
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      throw error;
    }
  }
}

// Usage example
const syncManager = new BackgroundSyncManager();

// Form submission example
async function submitForm(formData: FormData): Promise<void> {
  await syncManager.fetchWithOfflineSupport('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(formData))
  });
}
```

### Handling Sync in Service Worker

```javascript
// sw.js - Background sync handling

const DB_NAME = 'offline-requests';
const STORE_NAME = 'pending-requests';

// Listen for sync event
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

// Sync pending requests
async function syncPendingRequests() {
  const db = await openDB();
  const requests = await getAllPendingRequests(db);

  console.log('[Sync] Pending requests count:', requests.length);

  for (const request of requests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });

      if (response.ok) {
        // Sync successful, delete record
        await deleteRequest(db, request.id);
        console.log('[Sync] Request synced successfully:', request.url);
      }
    } catch (error) {
      console.error('[Sync] Request sync failed:', error);
      // Keep request, retry next time
    }
  }
}

// IndexedDB operations
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllPendingRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteRequest(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
```

---

## PWA vs Native Apps Comparison

PWAs and native apps each have their own advantages and disadvantages. The choice should be based on specific requirements.

### Feature Comparison Table

```
+------------------+------------------+------------------+
|     Feature      |       PWA        |    Native App    |
+------------------+------------------+------------------+
| Installation     | Direct from      | App store        |
| Method           | browser          | download         |
+------------------+------------------+------------------+
| Package Size     | Few KB to MB     | Tens of MB       |
|                  |                  | to GB            |
+------------------+------------------+------------------+
| Update Method    | Automatic        | Requires new     |
|                  | background       | download         |
+------------------+------------------+------------------+
| Offline          | Service Worker   | Full support     |
| Functionality    |                  |                  |
+------------------+------------------+------------------+
| Push             | Supported        | Full support     |
| Notifications    | (limited)        |                  |
+------------------+------------------+------------------+
| Device Features  | Partial          | Full support     |
|                  | support          |                  |
+------------------+------------------+------------------+
| Performance      | Near-native      | Best performance |
+------------------+------------------+------------------+
| Development Cost | One codebase     | Separate dev     |
|                  | multi-platform   | per platform     |
+------------------+------------------+------------------+
| Release Process  | Instant          | Requires review  |
+------------------+------------------+------------------+
| SEO              | Supported        | Not supported    |
+------------------+------------------+------------------+
| Link Sharing     | Direct URL       | Requires deep    |
|                  | sharing          | links            |
+------------------+------------------+------------------+
```

### Device Feature Support Comparison

```typescript
// Device feature detection
const deviceFeatureSupport = {
  // PWA supported features
  camera: 'mediaDevices' in navigator,
  geolocation: 'geolocation' in navigator,
  notifications: 'Notification' in window,
  vibration: 'vibrate' in navigator,
  bluetooth: 'bluetooth' in navigator,
  usb: 'usb' in navigator,
  nfc: 'NDEFReader' in window,
  share: 'share' in navigator,
  clipboard: 'clipboard' in navigator,

  // Storage related
  localStorage: 'localStorage' in window,
  indexedDB: 'indexedDB' in window,
  cacheStorage: 'caches' in window,

  // Network related
  onlineStatus: 'onLine' in navigator,
  networkInfo: 'connection' in navigator,

  // Payment
  paymentRequest: 'PaymentRequest' in window,

  // Biometrics
  credentials: 'credentials' in navigator,

  // Screen related
  screenOrientation: 'orientation' in screen,
  wakeLock: 'wakeLock' in navigator,
  fullscreen: 'fullscreenEnabled' in document,
};

// Output support status
Object.entries(deviceFeatureSupport).forEach(([feature, supported]) => {
  console.log(`${feature}: ${supported ? 'Supported' : 'Not supported'}`);
});
```

### When to Choose PWA vs Native App

```typescript
// Decision-making helper
interface ProjectRequirements {
  needsOffline: boolean;
  needsPush: boolean;
  needsDeepHardwareAccess: boolean;
  budgetConstrained: boolean;
  needsSEO: boolean;
  targetPlatforms: ('ios' | 'android' | 'web' | 'desktop')[];
  updateFrequency: 'high' | 'medium' | 'low';
  performanceCritical: boolean;
}

function recommendAppType(requirements: ProjectRequirements): {
  recommendation: 'PWA' | 'Native' | 'Hybrid';
  reasons: string[];
} {
  const reasons: string[] = [];
  let pwaScore = 0;
  let nativeScore = 0;

  if (requirements.needsDeepHardwareAccess) {
    nativeScore += 3;
    reasons.push('Deep hardware access requires native app');
  }

  if (requirements.budgetConstrained) {
    pwaScore += 2;
    reasons.push('Limited budget, PWA has lower development cost');
  }

  if (requirements.needsSEO) {
    pwaScore += 2;
    reasons.push('SEO requirement suits PWA');
  }

  if (requirements.targetPlatforms.length > 2) {
    pwaScore += 2;
    reasons.push('Multi-platform coverage, PWA - develop once');
  }

  if (requirements.updateFrequency === 'high') {
    pwaScore += 1;
    reasons.push('Frequent updates, PWA needs no review');
  }

  if (requirements.performanceCritical) {
    nativeScore += 2;
    reasons.push('Performance critical, native app is better');
  }

  if (requirements.needsOffline && requirements.needsPush) {
    pwaScore += 1;
    reasons.push('Offline and push, PWA already supports these');
  }

  if (pwaScore > nativeScore) {
    return { recommendation: 'PWA', reasons };
  } else if (nativeScore > pwaScore) {
    return { recommendation: 'Native', reasons };
  } else {
    return {
      recommendation: 'Hybrid',
      reasons: [...reasons, 'Hybrid approach may be the best choice']
    };
  }
}
```

---

## Practical Example: Task Management PWA

Let's build a complete task management PWA that combines all PWA technologies we've covered.

### Project Structure

```
task-pwa/
├── public/
│   ├── icons/
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── manifest.json
│   └── offline.html
├── src/
│   ├── js/
│   │   ├── app.js
│   │   ├── db.js
│   │   └── sync.js
│   ├── css/
│   │   └── main.css
│   └── sw.js
├── index.html
└── package.json
```

### IndexedDB Data Layer

```typescript
// src/js/db.ts - Task data management

interface Task {
  id?: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

class TaskDatabase {
  private dbName = 'task-pwa-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const store = db.createObjectStore('tasks', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('completed', 'completed', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // Add task
  async addTask(task: Omit<Task, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('tasks', 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.add(task);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all tasks
  async getAllTasks(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('tasks', 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Update task
  async updateTask(task: Task): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('tasks', 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.put(task);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Delete task
  async deleteTask(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('tasks', 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get unsynced tasks
  async getUnsyncedTasks(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('tasks', 'readonly');
      const store = transaction.objectStore('tasks');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const taskDB = new TaskDatabase();
```

### Complete Service Worker

```javascript
// src/sw.js - Complete Service Worker

const CACHE_VERSION = 'v1';
const STATIC_CACHE = 'static-' + CACHE_VERSION;
const DYNAMIC_CACHE = 'dynamic-' + CACHE_VERSION;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/js/db.js',
  '/offline.html',
  '/icons/icon-192x192.png'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Intercept requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            if (request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // Implement task sync logic
  console.log('Background syncing tasks...');
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'New Notification', body: 'You have a new task reminder' };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png'
    })
  );
});
```

---

## Interview Key Points

### PWA Core Concepts

**Q: What is a PWA? What are its core characteristics?**

A: A PWA is an application built using modern web technologies that combines the best of web and native apps. Core characteristics include:
- **Progressive Enhancement**: Works in all browsers, enhanced experience in supporting browsers
- **Responsive**: Adapts to all screen sizes
- **Offline Available**: Service Worker enables offline access
- **App-like Experience**: App Shell pattern provides native-like interaction
- **Installable**: Can be added to home screen
- **Discoverable**: Can be found by search engines via Web App Manifest
- **Push Notifications**: Supports background push messages
- **Secure**: Must use HTTPS

### Service Worker Lifecycle

**Q: Describe the Service Worker lifecycle**

```
1. Register
   |
   v
2. Install (Download and cache resources)
   |
   v
3. Waiting (If old SW is still in control)
   |
   v
4. Activate (Cleanup old caches)
   |
   v
5. Idle (Waiting for events)
   |
   v
6. Terminated (Browser can terminate at any time to save resources)
```

### Caching Strategy Selection

**Q: How do you choose the right caching strategy?**

| Strategy | Use Case | Characteristics |
|----------|----------|-----------------|
| Cache First | Static assets, fonts, images | Fast, but may be stale |
| Network First | HTML pages, API data | Fresh, but needs network |
| Stale While Revalidate | Avatars, infrequently changing data | Fast and updates |
| Network Only | Real-time data | Must be online |
| Cache Only | Precached static resources | Fully offline |

### Web App Manifest Key Configurations

**Q: What are the most important configuration items in Web App Manifest?**

```json
{
  "name": "Full application name",
  "short_name": "Short name (for home screen)",
  "start_url": "Starting URL",
  "display": "standalone | fullscreen | minimal-ui | browser",
  "theme_color": "Theme color",
  "background_color": "Splash screen background color",
  "icons": "Icons of various sizes"
}
```

### Common Problems and Solutions

**Q: What are common pitfalls in PWA development?**

1. **Service Worker Update Issues**
   - Problem: Users don't see the latest version
   - Solution: Implement update notification mechanism, use `skipWaiting()` and `clients.claim()`

2. **iOS Safari Limited Support**
   - Problem: Some PWA features not supported
   - Solution: Add iOS-specific meta tags, progressive enhancement

3. **Cache Size Too Large**
   - Problem: Occupies too much storage space
   - Solution: Implement cache size limits and cleanup strategies

4. **CORS Issues**
   - Problem: Cross-origin resources cannot be cached
   - Solution: Use `no-cors` mode or configure server CORS

### Performance Optimization Recommendations

```typescript
// PWA Performance Optimization Checklist
const performanceChecklist = [
  {
    item: 'App Shell Pattern',
    description: 'Cache UI skeleton, lazy load dynamic content',
    impact: 'high'
  },
  {
    item: 'Precache Critical Resources',
    description: 'Cache core resources during install event',
    impact: 'high'
  },
  {
    item: 'Lazy Load Non-Critical Resources',
    description: 'Load images, fonts on demand',
    impact: 'medium'
  },
  {
    item: 'Smart Caching Strategies',
    description: 'Choose optimal strategy based on resource type',
    impact: 'high'
  },
  {
    item: 'Limit Cache Size',
    description: 'Avoid occupying too much storage',
    impact: 'medium'
  },
  {
    item: 'Compress Resources',
    description: 'Use gzip/brotli compression',
    impact: 'high'
  }
];
```

### Debugging Tools

- **Chrome DevTools > Application**
  - Service Workers: View/debug SW
  - Manifest: Check configuration
  - Storage: View cache and storage

- **Lighthouse**
  - PWA audit
  - Performance analysis
  - Best practices check

---

## Summary

PWAs represent an important direction in modern web development, providing users with native-like experiences. We have covered:

1. **PWA Core Concepts**: Understanding the three pillars - HTTPS, Service Worker, and Web App Manifest
2. **Manifest Configuration**: Mastering complete application metadata configuration
3. **Service Worker**: Deep understanding of lifecycle and event handling
4. **Caching Strategies**: Learning to choose appropriate caching strategies based on scenarios
5. **Push Notifications**: Implementing background message push capabilities
6. **Installation Experience**: Optimizing user installation flow
7. **Background Sync**: Ensuring data consistency for offline operations
8. **Practical Application**: Connecting all knowledge points through a complete example

PWA technology continues to evolve with new APIs and capabilities being added regularly. With a solid understanding of PWA core principles, you can build better web applications and provide excellent user experiences.

The future of PWAs is bright, with features like Web Share Target, File System Access, and improved capabilities for desktop applications. By investing time in learning PWA fundamentals today, you are positioning yourself at the forefront of web development innovation.
