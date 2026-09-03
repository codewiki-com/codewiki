---
title: Browser APIs Complete Guide
description: Master modern browser APIs for rich web applications
track: javascript
section: browser
difficulty: intermediate
tags:
  - Browser API
  - Web API
  - DOM
  - BOM
status: imported
origin: old/src/content/docs/frontend/browser-apis.en.md
divergence: 0.187
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Frontend
  subcategory: JavaScript
  order: 12
  lastUpdated: 2026-01-07
---

Browser APIs (Application Programming Interfaces) are the foundation of modern web development, providing JavaScript with the ability to interact with the browser environment. From manipulating page elements to handling network requests, from storing data to obtaining user location, browser APIs enable us to build feature-rich, highly interactive web applications.

This comprehensive guide covers the most important and commonly used APIs in modern browsers to help you master these powerful tools.

## DOM Manipulation API

The DOM (Document Object Model) is the browser's core API. It represents an HTML document as a tree structure, allowing JavaScript to dynamically access and modify page content.

### Element Selection

```javascript
// Basic selectors
const element = document.getElementById('app');
const elements = document.getElementsByClassName('item');
const tags = document.getElementsByTagName('div');

// Modern selectors (recommended)
const single = document.querySelector('.container > .item');
const multiple = document.querySelectorAll('[data-active="true"]');

// Iterating over NodeList
multiple.forEach((el, index) => {
  console.log(`Element ${index}:`, el.textContent);
});

// Converting to array for more methods
const elementsArray = Array.from(multiple);
const filtered = elementsArray.filter(el => el.classList.contains('active'));
```

**Key Differences Between Selection Methods:**

| Method | Returns | Live/Static | Performance |
|--------|---------|-------------|-------------|
| `getElementById` | Single element | N/A | Fastest |
| `getElementsByClassName` | HTMLCollection | Live | Fast |
| `getElementsByTagName` | HTMLCollection | Live | Fast |
| `querySelector` | Single element | Static | Moderate |
| `querySelectorAll` | NodeList | Static | Moderate |

### Element Creation and Manipulation

```javascript
// Creating elements
const div = document.createElement('div');
div.className = 'card';
div.id = 'new-card';
div.textContent = 'This is a new card';

// Setting attributes
div.setAttribute('data-id', '123');
div.dataset.category = 'news'; // data-category="news"

// Setting styles
div.style.cssText = 'background: #f0f0f0; padding: 20px;';
// Or set individually
div.style.backgroundColor = '#f0f0f0';
div.style.padding = '20px';

// Inserting elements
const container = document.querySelector('.container');
container.appendChild(div);                    // Add to end
container.insertBefore(div, container.firstChild); // Add to beginning
container.append(div, 'text node');             // Can add multiple at once

// Modern insertion methods (recommended)
container.insertAdjacentHTML('beforeend', '<p>HTML string</p>');
container.insertAdjacentElement('afterbegin', div);
// Position options: 'beforebegin', 'afterbegin', 'beforeend', 'afterend'

// Removing elements
div.remove(); // Modern method
// Or
container.removeChild(div); // Traditional method

// Replacing elements
const newDiv = document.createElement('div');
div.replaceWith(newDiv); // Modern method
```

### Class and Attribute Operations

```javascript
const element = document.querySelector('.box');

// classList API
element.classList.add('active', 'highlighted');
element.classList.remove('hidden');
element.classList.toggle('collapsed');
element.classList.toggle('dark', isDarkMode); // Conditional toggle
element.classList.replace('old-class', 'new-class');
console.log(element.classList.contains('active')); // true

// Attribute operations
element.getAttribute('data-id');
element.setAttribute('aria-label', 'Description text');
element.removeAttribute('disabled');
element.hasAttribute('required');

// Getting all attributes
for (const attr of element.attributes) {
  console.log(`${attr.name}: ${attr.value}`);
}
```

### Event Handling

```javascript
const button = document.querySelector('#submit-btn');

// Adding event listeners
function handleClick(event) {
  event.preventDefault();
  console.log('Click position:', event.clientX, event.clientY);
  console.log('Target element:', event.target);
  console.log('Current element:', event.currentTarget);
}

button.addEventListener('click', handleClick);

// Event options
button.addEventListener('click', handleClick, {
  once: true,      // Execute only once
  passive: true,   // Won't call preventDefault
  capture: true    // Trigger during capture phase
});

// Removing event listeners
button.removeEventListener('click', handleClick);

// Event delegation (recommended pattern)
document.querySelector('.list').addEventListener('click', (e) => {
  if (e.target.matches('.list-item')) {
    console.log('Clicked list item:', e.target.dataset.id);
  }
});

// Custom events
const customEvent = new CustomEvent('userLogin', {
  detail: { userId: 123, username: 'john' },
  bubbles: true,
  cancelable: true
});

element.dispatchEvent(customEvent);

element.addEventListener('userLogin', (e) => {
  console.log('User logged in:', e.detail.username);
});
```

**Event Propagation Phases:**

```
                    | Capture Phase (1)
                    v
+-------------------+-------------------+
|  document                             |
|   +-------------------------------+   |
|   |  parent                       |   |
|   |   +------------------------+  |   |
|   |   |  target element       |  |   |
|   |   +------------------------+  |   |
|   +-------------------------------+   |
+---------------------------------------+
                    ^
                    | Bubbling Phase (2)
```

## Fetch API and Network Requests

The Fetch API is the modern browser's network request interface. Built on Promises, it is more concise and powerful than the traditional XMLHttpRequest.

### Basic Requests

```javascript
// GET request
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Request failed:', error.message);
    throw error;
  }
}

// POST request
async function postData(payload) {
  const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123'
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}

// Usage example
postData({ name: 'John Doe', email: 'john@example.com' })
  .then(result => console.log('Created successfully:', result))
  .catch(error => console.error('Creation failed:', error));
```

### Advanced Usage

```javascript
// Request timeout handling
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

// File upload
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', 'Uploaded file');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData // Don't set Content-Type, browser handles it automatically
  });

  return response.json();
}

// Download file with progress
async function downloadWithProgress(url) {
  const response = await fetch(url);
  const contentLength = response.headers.get('Content-Length');
  const total = parseInt(contentLength, 10);
  let loaded = 0;

  const reader = response.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    loaded += value.length;

    const progress = (loaded / total * 100).toFixed(2);
    console.log(`Download progress: ${progress}%`);
  }

  const blob = new Blob(chunks);
  return URL.createObjectURL(blob);
}

// Concurrent requests
async function fetchMultiple(urls) {
  const promises = urls.map(url => fetch(url).then(r => r.json()));

  // Wait for all to complete
  const results = await Promise.all(promises);

  // Or use allSettled to handle partial failures
  const settled = await Promise.allSettled(promises);
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Request ${index} succeeded:`, result.value);
    } else {
      console.log(`Request ${index} failed:`, result.reason);
    }
  });

  return results;
}
```

### Request Retry Pattern

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed, retrying...`);

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  throw lastError;
}
```

## Storage API

Browsers provide multiple data storage solutions suitable for different use cases.

### localStorage and sessionStorage

```javascript
// localStorage - persistent storage
localStorage.setItem('username', 'John');
localStorage.setItem('settings', JSON.stringify({ theme: 'dark', lang: 'en' }));

const username = localStorage.getItem('username');
const settings = JSON.parse(localStorage.getItem('settings'));

localStorage.removeItem('username');
localStorage.clear(); // Clear all data

// sessionStorage - session-level storage (cleared when tab closes)
sessionStorage.setItem('tempData', 'value');

// Encapsulated storage utility class
class StorageManager {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  set(key, value, expiresIn = null) {
    const item = {
      value,
      timestamp: Date.now(),
      expiresIn
    };
    this.storage.setItem(key, JSON.stringify(item));
  }

  get(key) {
    const itemStr = this.storage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);

    // Check if expired
    if (item.expiresIn && Date.now() - item.timestamp > item.expiresIn) {
      this.storage.removeItem(key);
      return null;
    }

    return item.value;
  }

  remove(key) {
    this.storage.removeItem(key);
  }
}

const storage = new StorageManager();
storage.set('token', 'abc123', 3600000); // Expires in 1 hour
```

### IndexedDB

IndexedDB is a powerful client-side database suitable for storing large amounts of structured data.

```javascript
// IndexedDB wrapper class
class Database {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async open(stores) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, {
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement
            });

            store.indexes?.forEach(index => {
              objectStore.createIndex(index.name, index.keyPath, {
                unique: index.unique
              });
            });
          }
        });
      };
    });
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query(storeName, indexName, range) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Usage example
async function initDatabase() {
  const db = new Database('MyApp', 1);

  await db.open([
    {
      name: 'users',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'email', keyPath: 'email', unique: true },
        { name: 'name', keyPath: 'name', unique: false }
      ]
    },
    {
      name: 'posts',
      keyPath: 'id',
      autoIncrement: true
    }
  ]);

  // Add data
  await db.add('users', { name: 'John', email: 'john@example.com' });

  // Query data
  const users = await db.getAll('users');
  console.log('All users:', users);
}
```

## Geolocation API

The Geolocation API allows web pages to obtain the user's geographic location information.

```javascript
// Basic usage
function getCurrentPosition() {
  if (!navigator.geolocation) {
    console.error('Geolocation is not supported by this browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;

      console.log(`Latitude: ${latitude}`);
      console.log(`Longitude: ${longitude}`);
      console.log(`Accuracy: ${accuracy} meters`);
      console.log(`Altitude: ${altitude || 'not available'}`);
      console.log(`Heading: ${heading || 'not available'}`);
      console.log(`Speed: ${speed || 'not available'}`);
      console.log(`Timestamp: ${new Date(position.timestamp)}`);
    },
    (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          console.error('User denied the geolocation request');
          break;
        case error.POSITION_UNAVAILABLE:
          console.error('Location information is unavailable');
          break;
        case error.TIMEOUT:
          console.error('The request to get location timed out');
          break;
        default:
          console.error('An unknown error occurred');
      }
    },
    {
      enableHighAccuracy: true, // High accuracy mode
      timeout: 10000,           // Timeout (milliseconds)
      maximumAge: 60000         // Cache time (milliseconds)
    }
  );
}

// Continuously monitor position changes
function watchPosition() {
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      console.log('Position updated:', position.coords);
      updateMapMarker(position.coords.latitude, position.coords.longitude);
    },
    (error) => {
      console.error('Failed to watch position:', error.message);
    },
    { enableHighAccuracy: true }
  );

  // Stop watching
  // navigator.geolocation.clearWatch(watchId);

  return watchId;
}

// Promise wrapper
function getPosition(options = {}) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

// Usage example
async function showUserLocation() {
  try {
    const position = await getPosition({ enableHighAccuracy: true });
    const { latitude, longitude } = position.coords;

    // Call map service to display location
    console.log(`User location: ${latitude}, ${longitude}`);
  } catch (error) {
    console.error('Failed to get location:', error);
  }
}
```

### Geolocation Best Practices

```javascript
// Complete geolocation service with fallback
class LocationService {
  constructor() {
    this.watchId = null;
    this.lastPosition = null;
  }

  isSupported() {
    return 'geolocation' in navigator;
  }

  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Geolocation not supported');
    }

    try {
      // Attempt to get position to trigger permission prompt
      await this.getCurrentPosition({ timeout: 5000 });
      return 'granted';
    } catch (error) {
      if (error.code === 1) {
        return 'denied';
      }
      throw error;
    }
  }

  getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lastPosition = position;
          resolve(position);
        },
        reject,
        { ...defaultOptions, ...options }
      );
    });
  }

  startWatching(callback, options = {}) {
    if (this.watchId) {
      this.stopWatching();
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.lastPosition = position;
        callback(position);
      },
      (error) => callback(null, error),
      options
    );

    return this.watchId;
  }

  stopWatching() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getLastKnownPosition() {
    return this.lastPosition;
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }
}

// Usage
const locationService = new LocationService();

async function trackUserJourney() {
  const positions = [];

  locationService.startWatching((position, error) => {
    if (error) {
      console.error('Location error:', error);
      return;
    }

    positions.push({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: position.timestamp
    });

    // Calculate total distance traveled
    if (positions.length > 1) {
      const prev = positions[positions.length - 2];
      const curr = positions[positions.length - 1];
      const distance = locationService.calculateDistance(
        prev.lat, prev.lng, curr.lat, curr.lng
      );
      console.log(`Traveled ${distance.toFixed(2)} km`);
    }
  }, { enableHighAccuracy: true });
}
```

## Web Workers and Multithreading

Web Workers allow JavaScript to run in background threads, avoiding blocking the main thread and improving application performance.

### Dedicated Workers

```javascript
// main.js - Main thread
const worker = new Worker('worker.js');

// Send message to Worker
worker.postMessage({
  type: 'CALCULATE',
  data: { numbers: [1, 2, 3, 4, 5] }
});

// Receive message from Worker
worker.onmessage = (event) => {
  console.log('Received result from Worker:', event.data);
};

// Error handling
worker.onerror = (error) => {
  console.error('Worker error:', error.message);
};

// Terminate Worker
// worker.terminate();

// worker.js - Worker thread
self.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'CALCULATE':
      // Perform heavy calculation
      const result = heavyCalculation(data.numbers);
      self.postMessage({ type: 'RESULT', result });
      break;
  }
};

function heavyCalculation(numbers) {
  // Simulate time-consuming operation
  let sum = 0;
  for (let i = 0; i < 1000000000; i++) {
    sum += numbers[i % numbers.length];
  }
  return sum;
}
```

### Creating Inline Workers with Blob

```javascript
// No separate worker.js file needed
function createInlineWorker(fn) {
  const blob = new Blob(
    [`self.onmessage = ${fn.toString()}`],
    { type: 'application/javascript' }
  );
  return new Worker(URL.createObjectURL(blob));
}

const worker = createInlineWorker((event) => {
  const { numbers } = event.data;
  const sum = numbers.reduce((a, b) => a + b, 0);
  self.postMessage(sum);
});

worker.postMessage({ numbers: [1, 2, 3, 4, 5] });
worker.onmessage = (e) => console.log('Result:', e.data);
```

### Shared Workers

```javascript
// Workers that can be shared by multiple pages
const sharedWorker = new SharedWorker('shared-worker.js');

sharedWorker.port.start();
sharedWorker.port.postMessage('Hello');

sharedWorker.port.onmessage = (event) => {
  console.log('Received message:', event.data);
};

// shared-worker.js
const connections = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);

  port.onmessage = (e) => {
    // Broadcast message to all connections
    connections.forEach(p => {
      p.postMessage(`From another page: ${e.data}`);
    });
  };

  port.start();
};
```

### Transferable Objects

For large data transfers, use transferable objects to avoid copying:

```javascript
// main.js
const largeBuffer = new ArrayBuffer(1024 * 1024 * 100); // 100MB
const uint8View = new Uint8Array(largeBuffer);

// Fill with data
for (let i = 0; i < uint8View.length; i++) {
  uint8View[i] = i % 256;
}

// Transfer ownership (not copy)
worker.postMessage({ buffer: largeBuffer }, [largeBuffer]);

// largeBuffer is now empty (transferred to worker)
console.log(largeBuffer.byteLength); // 0

// worker.js
self.onmessage = (event) => {
  const { buffer } = event.data;
  const view = new Uint8Array(buffer);

  // Process the buffer
  // ...

  // Transfer back when done
  self.postMessage({ buffer }, [buffer]);
};
```

## Notification API

The Notification API allows web pages to send system notifications to users.

```javascript
// Request notification permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Send notification
async function sendNotification(title, options = {}) {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    console.log('No notification permission');
    return;
  }

  const notification = new Notification(title, {
    body: options.body || '',
    icon: options.icon || '/icon.png',
    badge: options.badge || '/badge.png',
    tag: options.tag || 'default',      // Same tag notifications replace each other
    requireInteraction: options.requireInteraction || false, // Requires user interaction to close
    silent: options.silent || false,    // Silent mode
    data: options.data || {}            // Custom data
  });

  notification.onclick = (event) => {
    console.log('Notification clicked', notification.data);
    window.focus();
    notification.close();
  };

  notification.onclose = () => {
    console.log('Notification closed');
  };

  notification.onerror = (error) => {
    console.error('Notification error:', error);
  };

  return notification;
}

// Usage example
sendNotification('New Message', {
  body: 'You have received a new message. Click to view details.',
  icon: '/message-icon.png',
  tag: 'message',
  data: { messageId: 123 }
});
```

## Clipboard API

The Clipboard API provides the ability to read from and write to the system clipboard.

```javascript
// Write text to clipboard
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Text copied to clipboard');
    return true;
  } catch (error) {
    console.error('Copy failed:', error);

    // Fallback solution
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      console.log('Copied using fallback method');
      return true;
    } catch (err) {
      console.error('Fallback method also failed');
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// Read text from clipboard
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText();
    console.log('Clipboard content:', text);
    return text;
  } catch (error) {
    console.error('Failed to read clipboard:', error);
    return null;
  }
}

// Copy image to clipboard
async function copyImage(imageBlob) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [imageBlob.type]: imageBlob
      })
    ]);
    console.log('Image copied');
  } catch (error) {
    console.error('Failed to copy image:', error);
  }
}

// Read image from clipboard
async function pasteImage() {
  try {
    const items = await navigator.clipboard.read();

    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          const url = URL.createObjectURL(blob);
          console.log('Image URL:', url);
          return url;
        }
      }
    }
  } catch (error) {
    console.error('Failed to read image:', error);
  }
  return null;
}

// Listen to paste events
document.addEventListener('paste', async (event) => {
  const items = event.clipboardData?.items;

  if (items) {
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        console.log('Pasted image:', file);
        // Handle image...
      } else if (item.type === 'text/plain') {
        item.getAsString((text) => {
          console.log('Pasted text:', text);
        });
      }
    }
  }
});
```

## Intersection Observer

The Intersection Observer API is used to asynchronously observe changes in the intersection of a target element with an ancestor element or the viewport. It is commonly used for lazy loading, infinite scrolling, and similar scenarios.

```javascript
// Basic usage
const observer = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(entry => {
      console.log('Element:', entry.target);
      console.log('Is visible:', entry.isIntersecting);
      console.log('Visibility ratio:', entry.intersectionRatio);
      console.log('Bounds:', entry.boundingClientRect);

      if (entry.isIntersecting) {
        // Element entered viewport
        entry.target.classList.add('visible');
      }
    });
  },
  {
    root: null,           // Viewport as root element
    rootMargin: '0px',    // Root element margin
    threshold: [0, 0.5, 1] // Callback trigger thresholds
  }
);

// Observe elements
document.querySelectorAll('.observe-me').forEach(el => {
  observer.observe(el);
});

// Stop observing
// observer.unobserve(element);
// observer.disconnect(); // Stop observing all elements

// Image lazy loading implementation
function lazyLoadImages() {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px' // Load 50px before entering viewport
  });

  document.querySelectorAll('img.lazy').forEach(img => {
    imageObserver.observe(img);
  });
}

// Infinite scroll implementation
function infiniteScroll(loadMore) {
  const sentinel = document.querySelector('#scroll-sentinel');

  const scrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      loadMore();
    }
  }, {
    rootMargin: '100px'
  });

  scrollObserver.observe(sentinel);
  return scrollObserver;
}

// Animation triggering
function animateOnScroll() {
  const animationObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        } else {
          entry.target.classList.remove('animate-in');
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    animationObserver.observe(el);
  });
}
```

## ResizeObserver and MutationObserver

### ResizeObserver

ResizeObserver is used to monitor element size changes.

```javascript
const resizeObserver = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;
    console.log(`Element size changed: ${width} x ${height}`);

    // Get border box size
    if (entry.borderBoxSize) {
      const [boxSize] = entry.borderBoxSize;
      console.log(`Border box: ${boxSize.inlineSize} x ${boxSize.blockSize}`);
    }

    // Responsive handling
    const target = entry.target;
    if (width < 400) {
      target.classList.add('compact');
    } else {
      target.classList.remove('compact');
    }
  });
});

// Observe element
const container = document.querySelector('.responsive-container');
resizeObserver.observe(container);

// Stop observing
// resizeObserver.unobserve(container);
// resizeObserver.disconnect();

// Practical example: Responsive chart
function createResponsiveChart(container) {
  let chart = initChart(container);

  const observer = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    chart.resize(width, height);
  });

  observer.observe(container);

  return {
    destroy() {
      observer.disconnect();
      chart.destroy();
    }
  };
}
```

### MutationObserver

MutationObserver is used to monitor changes to the DOM tree.

```javascript
const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    switch (mutation.type) {
      case 'childList':
        console.log('Child nodes changed');
        console.log('Added nodes:', mutation.addedNodes);
        console.log('Removed nodes:', mutation.removedNodes);
        break;

      case 'attributes':
        console.log(`Attribute "${mutation.attributeName}" changed`);
        console.log('Old value:', mutation.oldValue);
        console.log('New value:', mutation.target.getAttribute(mutation.attributeName));
        break;

      case 'characterData':
        console.log('Text content changed');
        console.log('Old value:', mutation.oldValue);
        console.log('New value:', mutation.target.textContent);
        break;
    }
  });
});

// Configuration options
const config = {
  childList: true,           // Observe child node additions/removals
  attributes: true,          // Observe attribute changes
  characterData: true,       // Observe text content changes
  subtree: true,             // Observe all descendants
  attributeOldValue: true,   // Record old attribute values
  characterDataOldValue: true, // Record old text values
  attributeFilter: ['class', 'style'] // Only observe specific attributes
};

mutationObserver.observe(document.body, config);

// Stop observing
// mutationObserver.disconnect();

// Get pending mutation records
// const pendingMutations = mutationObserver.takeRecords();

// Practical example: Watch for dynamic content
function watchForDynamicContent(container, callback) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          callback(node);
        }
      });
    });
  });

  observer.observe(container, { childList: true, subtree: true });

  return () => observer.disconnect();
}

// Usage example: Auto-initialize dynamically added components
const stopWatching = watchForDynamicContent(document.body, (element) => {
  if (element.matches('[data-component="tooltip"]')) {
    initTooltip(element);
  }
});
```

## Performance Observer

The Performance Observer API allows you to monitor various performance metrics.

```javascript
// Observe performance entries
const performanceObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();

  entries.forEach(entry => {
    console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);

    // Handle different entry types
    switch (entry.entryType) {
      case 'navigation':
        console.log('Page load time:', entry.loadEventEnd - entry.startTime);
        break;

      case 'resource':
        console.log(`Resource ${entry.name} loaded in ${entry.duration}ms`);
        break;

      case 'paint':
        console.log(`${entry.name}: ${entry.startTime}ms`);
        break;

      case 'largest-contentful-paint':
        console.log('LCP:', entry.startTime);
        break;

      case 'first-input':
        console.log('FID:', entry.processingStart - entry.startTime);
        break;

      case 'layout-shift':
        console.log('CLS:', entry.value);
        break;
    }
  });
});

// Observe specific entry types
performanceObserver.observe({
  entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint']
});

// Web Vitals monitoring
function observeWebVitals(callback) {
  // Largest Contentful Paint (LCP)
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    callback({ name: 'LCP', value: lastEntry.startTime });
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay (FID)
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      callback({
        name: 'FID',
        value: entry.processingStart - entry.startTime
      });
    });
  }).observe({ entryTypes: ['first-input'] });

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });
    callback({ name: 'CLS', value: clsValue });
  }).observe({ entryTypes: ['layout-shift'] });
}

// Usage
observeWebVitals((metric) => {
  console.log(`${metric.name}: ${metric.value}`);
  // Send to analytics
});
```

## Interview Key Points

### Common Interview Questions

**Q1: What are the differences between localStorage, sessionStorage, and Cookies?**

| Feature | localStorage | sessionStorage | Cookie |
|---------|--------------|----------------|--------|
| Storage Size | 5-10MB | 5-10MB | 4KB |
| Lifetime | Permanent | Session-level | Can set expiration |
| Scope | Same-origin shared | Current tab only | Can cross subdomains |
| Sent to Server | No | No | Automatically with every request |
| API | Simple and intuitive | Simple and intuitive | More complex |

**Q2: How do you implement image lazy loading?**

```javascript
// Method 1: Intersection Observer (recommended)
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});

// Method 2: Native loading attribute
<img src="image.jpg" loading="lazy" alt="Lazy loaded image" />
```

**Q3: What are the differences between Fetch and XMLHttpRequest?**

```javascript
// XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/data');
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    console.log(JSON.parse(xhr.responseText));
  }
};
xhr.send();

// Fetch - more concise, Promise-based
const response = await fetch('/api/data');
const data = await response.json();
```

Key differences:
- Fetch is Promise-based and supports async/await
- Fetch does not reject for HTTP error status codes (like 404, 500)
- Fetch does not send cookies by default (requires credentials option)
- Fetch does not support request cancellation natively (requires AbortController)
- XMLHttpRequest supports upload progress monitoring, Fetch does not natively

**Q4: What are the use cases and limitations of Web Workers?**

Use cases:
- Complex calculations (data processing, encryption/decryption)
- Image/video processing
- Large file parsing
- Real-time data processing

Limitations:
- Cannot access the DOM
- Cannot access window, document objects
- Cannot use UI methods like alert, confirm
- Same-origin restriction

**Q5: Explain the difference between the three Observer APIs**

| Observer | Purpose | Use Case |
|----------|---------|----------|
| IntersectionObserver | Observe element visibility | Lazy loading, infinite scroll |
| ResizeObserver | Observe element size changes | Responsive components |
| MutationObserver | Observe DOM changes | Dynamic content handling |

### Performance Optimization Related

```javascript
// Use requestAnimationFrame for optimized animations
function smoothScroll(target) {
  const start = window.pageYOffset;
  const distance = target - start;
  const duration = 500;
  let startTime = null;

  function animation(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function
    const easeInOutQuad = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    window.scrollTo(0, start + distance * easeInOutQuad);

    if (elapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

// Use requestIdleCallback for low-priority tasks
function processLowPriorityTasks(tasks) {
  function processTasks(deadline) {
    while (deadline.timeRemaining() > 0 && tasks.length > 0) {
      const task = tasks.shift();
      task();
    }

    if (tasks.length > 0) {
      requestIdleCallback(processTasks);
    }
  }

  requestIdleCallback(processTasks);
}

// Debounce and throttle patterns
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage with scroll events
window.addEventListener('scroll', throttle(() => {
  console.log('Scroll position:', window.scrollY);
}, 100));

window.addEventListener('resize', debounce(() => {
  console.log('Window resized');
}, 250));
```

### Best Practices Summary

1. **DOM Operations**: Batch DOM updates, use DocumentFragment, avoid frequent reflows and repaints
2. **Event Handling**: Use event delegation, use the passive option appropriately
3. **Network Requests**: Implement request cancellation, timeout handling, error retry mechanisms
4. **Data Storage**: Choose the appropriate storage solution based on data characteristics
5. **Performance Monitoring**: Use Performance API to monitor key metrics
6. **Async Processing**: Use Web Workers for time-consuming tasks

## Modern Browser APIs

### Broadcast Channel API

For communication between same-origin contexts (tabs, windows, iframes):

```javascript
// Create a broadcast channel
const channel = new BroadcastChannel('app-channel');

// Send messages
channel.postMessage({
  type: 'USER_LOGOUT',
  timestamp: Date.now()
});

// Receive messages
channel.onmessage = (event) => {
  console.log('Received:', event.data);

  if (event.data.type === 'USER_LOGOUT') {
    // Handle logout in all tabs
    window.location.href = '/login';
  }
};

// Close when done
// channel.close();
```

### Screen Wake Lock API

Prevent the screen from dimming or locking:

```javascript
let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('Wake Lock is active');

    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock was released');
    });
  } catch (err) {
    console.error(`${err.name}: ${err.message}`);
  }
}

// Re-acquire on visibility change
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});

// Release when done
async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}
```

### File System Access API

Access the user's file system with permission:

```javascript
// Open a file
async function openFile() {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [{
      description: 'Text Files',
      accept: { 'text/plain': ['.txt'] }
    }]
  });

  const file = await fileHandle.getFile();
  const contents = await file.text();
  return contents;
}

// Save a file
async function saveFile(content) {
  const handle = await window.showSaveFilePicker({
    suggestedName: 'document.txt',
    types: [{
      description: 'Text Files',
      accept: { 'text/plain': ['.txt'] }
    }]
  });

  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

// Open a directory
async function openDirectory() {
  const dirHandle = await window.showDirectoryPicker();

  for await (const entry of dirHandle.values()) {
    console.log(entry.kind, entry.name);
  }
}
```

## Summary

Browser APIs are an essential component of web development. Mastering these APIs helps us build richer and more efficient web applications. This article has covered DOM manipulation, network requests, data storage, location services, multithreading, notifications, clipboard, and various observer patterns - all the most commonly used features in modern web development.

In practical development, keep in mind:
- Check browser compatibility for APIs
- Implement graceful degradation solutions
- Consider user privacy and security
- Use async operations appropriately to avoid blocking the main thread
- Follow performance optimization best practices

As web standards continue to evolve, browser APIs are constantly being updated and improved. Follow MDN documentation and web standards organizations for the latest API features.

**Key Takeaways:**

1. **DOM API** - The foundation of dynamic web pages, master selection, creation, and event handling
2. **Fetch API** - Modern approach to network requests with Promise support
3. **Storage APIs** - Choose between localStorage, sessionStorage, and IndexedDB based on needs
4. **Geolocation API** - Location-aware features with proper permission handling
5. **Web Workers** - Offload heavy computation to background threads
6. **Observer APIs** - Efficient monitoring of DOM, size, and intersection changes
7. **Performance API** - Monitor and optimize web vital metrics

The browser platform continues to expand with new capabilities. Stay curious and keep exploring new APIs as they become available.
