---
title: Web Storage API
description: Complete guide to JavaScript Web Storage, localStorage, sessionStorage and IndexedDB
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - Storage
  - localStorage
  - IndexedDB
status: imported
origin: old/src/content/docs/javascript/web-storage.en.md
divergence: 0.229
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 19
  lastUpdated: 2026-01-07
---

The Web Storage API provides mechanisms for browsers to store key-value pairs in a much more intuitive fashion than using cookies. We'll cover localStorage, sessionStorage, storage events, and IndexedDB for handling client-side data persistence.

## Understanding Web Storage

Web Storage offers two main mechanisms for storing data in the browser: `localStorage` and `sessionStorage`. Both provide a simple key-value store interface but differ in their persistence and scope.

### Key Characteristics

- **Simple API**: Easy-to-use synchronous methods for storing and retrieving data
- **Larger Capacity**: Typically 5-10MB per origin, compared to 4KB for cookies
- **No Server Transmission**: Data stays on the client, unlike cookies which are sent with every HTTP request
- **Origin-Bound**: Storage is isolated per origin (protocol + domain + port)
- **String-Only Values**: All values are stored as strings

## localStorage

localStorage provides persistent storage that survives browser restarts and system reboots. Data remains until explicitly cleared by the user or the application.

### Basic Operations

```javascript
// Storing data
localStorage.setItem('username', 'john_doe');
localStorage.setItem('theme', 'dark');

// Retrieving data
const username = localStorage.getItem('username');
console.log(username); // 'john_doe'

// Removing a single item
localStorage.removeItem('theme');

// Clearing all data for this origin
localStorage.clear();

// Getting the number of stored items
console.log(localStorage.length); // 1

// Getting key by index
const firstKey = localStorage.key(0);
console.log(firstKey); // 'username'
```

### Alternative Syntax

You can also use object-like syntax, though the explicit methods are preferred for clarity.

```javascript
// Setting values (works but not recommended)
localStorage.username = 'john_doe';
localStorage['email'] = 'john@example.com';

// Getting values
console.log(localStorage.username); // 'john_doe'
console.log(localStorage['email']); // 'john@example.com'

// Checking existence
if (localStorage.getItem('username') !== null) {
  console.log('User is stored');
}

// Preferred approach for checking
if ('username' in localStorage) {
  console.log('User exists');
}
```

### Storing Complex Data

Since localStorage only stores strings, you need to serialize objects.

```javascript
// Storing objects
const user = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  preferences: {
    theme: 'dark',
    language: 'en'
  }
};

localStorage.setItem('user', JSON.stringify(user));

// Retrieving objects
const storedUser = JSON.parse(localStorage.getItem('user'));
console.log(storedUser.name); // 'John Doe'
console.log(storedUser.preferences.theme); // 'dark'

// Storing arrays
const recentSearches = ['javascript', 'web storage', 'indexeddb'];
localStorage.setItem('searches', JSON.stringify(recentSearches));

// Retrieving arrays
const searches = JSON.parse(localStorage.getItem('searches'));
console.log(searches[0]); // 'javascript'
```

### Safe Storage Wrapper

A utility class for safer localStorage operations with automatic serialization.

```javascript
class StorageManager {
  constructor(prefix = 'app_') {
    this.prefix = prefix;
    this.storage = localStorage;
  }

  // Generate prefixed key
  getKey(key) {
    return `${this.prefix}${key}`;
  }

  // Set item with automatic serialization
  set(key, value, expiresIn = null) {
    const item = {
      value: value,
      timestamp: Date.now(),
      expires: expiresIn ? Date.now() + expiresIn : null
    };

    try {
      this.storage.setItem(this.getKey(key), JSON.stringify(item));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
        this.cleanup();
        // Retry once after cleanup
        try {
          this.storage.setItem(this.getKey(key), JSON.stringify(item));
          return true;
        } catch {
          return false;
        }
      }
      throw error;
    }
  }

  // Get item with automatic deserialization
  get(key, defaultValue = null) {
    try {
      const item = this.storage.getItem(this.getKey(key));

      if (item === null) {
        return defaultValue;
      }

      const parsed = JSON.parse(item);

      // Check expiration
      if (parsed.expires && Date.now() > parsed.expires) {
        this.remove(key);
        return defaultValue;
      }

      return parsed.value;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return defaultValue;
    }
  }

  // Remove item
  remove(key) {
    this.storage.removeItem(this.getKey(key));
  }

  // Check if key exists and is not expired
  has(key) {
    return this.get(key) !== null;
  }

  // Get all keys with this prefix
  keys() {
    const allKeys = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key.startsWith(this.prefix)) {
        allKeys.push(key.substring(this.prefix.length));
      }
    }
    return allKeys;
  }

  // Clear all items with this prefix
  clear() {
    this.keys().forEach(key => this.remove(key));
  }

  // Remove expired items
  cleanup() {
    this.keys().forEach(key => {
      const item = this.storage.getItem(this.getKey(key));
      if (item) {
        try {
          const parsed = JSON.parse(item);
          if (parsed.expires && Date.now() > parsed.expires) {
            this.remove(key);
          }
        } catch {
          // Remove corrupted items
          this.remove(key);
        }
      }
    });
  }
}

// Usage
const storage = new StorageManager('myapp_');

// Store with 1 hour expiration
storage.set('session', { token: 'abc123' }, 60 * 60 * 1000);

// Retrieve
const session = storage.get('session');
console.log(session?.token); // 'abc123'

// Store without expiration
storage.set('preferences', { theme: 'dark' });
```

## sessionStorage

sessionStorage is similar to localStorage but with a shorter lifespan. Data is cleared when the page session ends (when the browser tab is closed).

### Session vs Local Storage

```javascript
// sessionStorage - cleared when tab closes
sessionStorage.setItem('tempData', 'This will not persist');

// localStorage - persists until explicitly cleared
localStorage.setItem('permanentData', 'This will persist');

// Both have identical APIs
const sessionValue = sessionStorage.getItem('tempData');
const localValue = localStorage.getItem('permanentData');
```

### Use Cases for sessionStorage

```javascript
// Form data preservation during navigation
class FormPersistence {
  constructor(formId) {
    this.formId = formId;
    this.storageKey = `form_${formId}`;
  }

  // Save form state
  save(formData) {
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    sessionStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Restore form state
  restore(form) {
    const saved = sessionStorage.getItem(this.storageKey);
    if (!saved) return false;

    try {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([name, value]) => {
        const field = form.elements[name];
        if (field) {
          field.value = value;
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  // Clear saved state
  clear() {
    sessionStorage.removeItem(this.storageKey);
  }
}

// Usage
const form = document.getElementById('registrationForm');
const persistence = new FormPersistence('registration');

// Restore on page load
persistence.restore(form);

// Save on input
form.addEventListener('input', () => {
  persistence.save(new FormData(form));
});

// Clear on successful submission
form.addEventListener('submit', () => {
  persistence.clear();
});
```

### Tab-Specific State

```javascript
// Generate unique tab ID
function getTabId() {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
}

// Tab-specific storage wrapper
class TabStorage {
  constructor() {
    this.tabId = getTabId();
  }

  set(key, value) {
    const tabKey = `${this.tabId}_${key}`;
    sessionStorage.setItem(tabKey, JSON.stringify(value));
  }

  get(key) {
    const tabKey = `${this.tabId}_${key}`;
    const value = sessionStorage.getItem(tabKey);
    return value ? JSON.parse(value) : null;
  }
}

// Each tab has isolated storage
const tabStorage = new TabStorage();
tabStorage.set('scrollPosition', 500);
console.log(tabStorage.get('scrollPosition')); // 500
```

### Comparing localStorage and sessionStorage

| Feature | localStorage | sessionStorage |
|---------|--------------|----------------|
| Persistence | Until cleared | Until tab closes |
| Shared across tabs | Yes (same origin) | No (tab-specific) |
| Available after restart | Yes | No |
| Typical use case | User preferences | Form data, temp state |
| Storage limit | ~5-10MB | ~5-10MB |

## Storage Events

The `storage` event fires when localStorage is modified from another document (different tab or window) of the same origin.

### Basic Storage Event Listening

```javascript
// This event fires in OTHER tabs/windows, not the one making the change
window.addEventListener('storage', (event) => {
  console.log('Storage changed:');
  console.log('Key:', event.key);
  console.log('Old Value:', event.oldValue);
  console.log('New Value:', event.newValue);
  console.log('URL:', event.url);
  console.log('Storage Area:', event.storageArea);
});

// Making a change (this tab won't receive the event)
localStorage.setItem('sharedData', 'new value');
```

### Cross-Tab Communication

Storage events enable communication between tabs of the same origin.

```javascript
// Tab Communication Manager
class TabCommunicator {
  constructor(channel = 'tab_comm') {
    this.channel = channel;
    this.handlers = new Map();
    this.tabId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    window.addEventListener('storage', this.handleStorageEvent.bind(this));
  }

  handleStorageEvent(event) {
    if (!event.key || !event.key.startsWith(this.channel)) {
      return;
    }

    if (event.newValue === null) {
      return; // Item was removed
    }

    try {
      const message = JSON.parse(event.newValue);

      // Ignore messages from self
      if (message.senderId === this.tabId) {
        return;
      }

      const handler = this.handlers.get(message.type);
      if (handler) {
        handler(message.data, message.senderId);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  // Send message to other tabs
  broadcast(type, data) {
    const message = {
      type,
      data,
      senderId: this.tabId,
      timestamp: Date.now()
    };

    const key = `${this.channel}_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(message));

    // Clean up after a short delay
    setTimeout(() => localStorage.removeItem(key), 100);
  }

  // Register message handler
  on(type, handler) {
    this.handlers.set(type, handler);
  }

  // Unregister handler
  off(type) {
    this.handlers.delete(type);
  }
}

// Usage
const comm = new TabCommunicator();

// Listen for logout events
comm.on('logout', (data, senderId) => {
  console.log(`User logged out in tab ${senderId}`);
  window.location.href = '/login';
});

// Listen for data updates
comm.on('dataUpdate', (data) => {
  console.log('Data updated:', data);
  refreshDisplay(data);
});

// Broadcast logout to all tabs
function logout() {
  comm.broadcast('logout', { reason: 'user_action' });
  // Also handle current tab
  window.location.href = '/login';
}
```

### Synchronized State Across Tabs

```javascript
// Reactive storage that syncs across tabs
class SyncedStorage {
  constructor() {
    this.subscribers = new Map();

    window.addEventListener('storage', (event) => {
      if (event.key && this.subscribers.has(event.key)) {
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        this.subscribers.get(event.key).forEach(callback => {
          callback(newValue, JSON.parse(event.oldValue));
        });
      }
    });
  }

  get(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  set(key, value) {
    const oldValue = this.get(key);
    localStorage.setItem(key, JSON.stringify(value));

    // Notify local subscribers (storage event only fires in other tabs)
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).forEach(callback => {
        callback(value, oldValue);
      });
    }
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key).delete(callback);
    };
  }
}

// Usage
const syncedStorage = new SyncedStorage();

// Subscribe to changes
const unsubscribe = syncedStorage.subscribe('theme', (newValue, oldValue) => {
  console.log(`Theme changed from ${oldValue} to ${newValue}`);
  document.body.className = newValue;
});

// This change will be reflected in all tabs
syncedStorage.set('theme', 'dark');
```

## Storage Limits and Quota Management

### Checking Available Storage

```javascript
// Estimate available storage (modern browsers)
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota) * 100;

    console.log(`Used: ${formatBytes(estimate.usage)}`);
    console.log(`Quota: ${formatBytes(estimate.quota)}`);
    console.log(`Percent used: ${percentUsed.toFixed(2)}%`);

    return {
      used: estimate.usage,
      quota: estimate.quota,
      available: estimate.quota - estimate.usage,
      percentUsed
    };
  }

  return null;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check current localStorage usage
function getLocalStorageSize() {
  let total = 0;

  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      total += key.length + value.length;
    }
  }

  // Approximate bytes (UTF-16 encoding)
  return total * 2;
}

console.log(`localStorage size: ${formatBytes(getLocalStorageSize())}`);
```

### Handling Quota Errors

```javascript
class SafeStorage {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  set(key, value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    try {
      this.storage.setItem(key, stringValue);
      return { success: true };
    } catch (error) {
      if (this.isQuotaError(error)) {
        return {
          success: false,
          error: 'QUOTA_EXCEEDED',
          message: 'Storage quota exceeded. Please clear some data.'
        };
      }
      throw error;
    }
  }

  isQuotaError(error) {
    return (
      error instanceof DOMException &&
      (error.code === 22 || // Legacy
        error.code === 1014 || // Firefox
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
  }

  setWithEviction(key, value, evictionStrategy = 'lru') {
    let result = this.set(key, value);

    if (!result.success && result.error === 'QUOTA_EXCEEDED') {
      // Try to make room
      const evicted = this.evict(evictionStrategy);
      console.log(`Evicted ${evicted} items`);

      // Retry
      result = this.set(key, value);
    }

    return result;
  }

  evict(strategy) {
    let evictedCount = 0;

    if (strategy === 'lru') {
      // Evict oldest items first (requires timestamp tracking)
      const items = this.getAllWithMetadata();
      items.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 20%
      const toRemove = Math.ceil(items.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.storage.removeItem(items[i].key);
        evictedCount++;
      }
    } else if (strategy === 'largest') {
      // Evict largest items first
      const items = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        const value = this.storage.getItem(key);
        items.push({ key, size: key.length + value.length });
      }

      items.sort((a, b) => b.size - a.size);

      // Remove largest items until we free 20% space
      const targetReduction = items.reduce((sum, i) => sum + i.size, 0) * 0.2;
      let freed = 0;

      for (const item of items) {
        if (freed >= targetReduction) break;
        this.storage.removeItem(item.key);
        freed += item.size;
        evictedCount++;
      }
    }

    return evictedCount;
  }

  getAllWithMetadata() {
    const items = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      const value = this.storage.getItem(key);

      try {
        const parsed = JSON.parse(value);
        items.push({
          key,
          timestamp: parsed._timestamp || 0,
          size: key.length + value.length
        });
      } catch {
        items.push({
          key,
          timestamp: 0,
          size: key.length + value.length
        });
      }
    }
    return items;
  }
}
```

## IndexedDB Basics

IndexedDB is a low-level API for storing significant amounts of structured data, including files and blobs. It provides indexed database functionality for complex queries.

### Key Concepts

- **Database**: Contains one or more object stores
- **Object Store**: Similar to tables in SQL databases
- **Index**: Enables efficient querying by specific properties
- **Transaction**: All data access happens through transactions
- **Cursor**: Iterates over object stores or indexes

### Opening a Database

```javascript
function openDatabase(dbName, version = 1) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', {
          keyPath: 'id',
          autoIncrement: true
        });

        // Create indexes for querying
        userStore.createIndex('email', 'email', { unique: true });
        userStore.createIndex('name', 'name', { unique: false });
        userStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('posts')) {
        const postStore = db.createObjectStore('posts', {
          keyPath: 'id',
          autoIncrement: true
        });

        postStore.createIndex('userId', 'userId', { unique: false });
        postStore.createIndex('published', 'published', { unique: false });
      }
    };
  });
}

// Usage
const db = await openDatabase('myApp', 1);
console.log('Database opened:', db.name);
```

### CRUD Operations

```javascript
class IndexedDBStore {
  constructor(db, storeName) {
    this.db = db;
    this.storeName = storeName;
  }

  // Create or Update
  put(data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.put({
        ...data,
        updatedAt: new Date().toISOString()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Read by key
  get(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Read all
  getAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete by key
  delete(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data
  clear() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Query by index
  getByIndex(indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Count records
  count() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Usage
const db = await openDatabase('myApp', 1);
const userStore = new IndexedDBStore(db, 'users');

// Create
const userId = await userStore.put({
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date().toISOString()
});

// Read
const user = await userStore.get(userId);
console.log(user);

// Query by index
const johns = await userStore.getByIndex('name', 'John Doe');
console.log('Users named John:', johns);

// Update
await userStore.put({ ...user, name: 'John Smith' });

// Delete
await userStore.delete(userId);
```

### Using Cursors for Complex Queries

```javascript
class AdvancedStore extends IndexedDBStore {
  // Paginated query
  getPaginated(pageSize, offset = 0) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const results = [];
      let skipped = 0;

      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          if (skipped < offset) {
            skipped++;
            cursor.continue();
          } else if (results.length < pageSize) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Range query
  getByRange(indexName, lowerBound, upperBound) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      const range = IDBKeyRange.bound(lowerBound, upperBound);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Filter with callback
  filter(predicate) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const results = [];

      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          if (predicate(cursor.value)) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Bulk insert
  bulkPut(items) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const results = [];

      items.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => results.push(request.result);
      });

      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Usage examples
const store = new AdvancedStore(db, 'users');

// Pagination
const page1 = await store.getPaginated(10, 0);
const page2 = await store.getPaginated(10, 10);

// Range query (e.g., users created in last week)
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const today = new Date().toISOString();
const recentUsers = await store.getByRange('createdAt', lastWeek, today);

// Custom filter
const activeUsers = await store.filter(user => user.status === 'active');

// Bulk insert
await store.bulkPut([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
  { name: 'User 3', email: 'user3@example.com' }
]);
```

### Complete IndexedDB Wrapper

```javascript
class Database {
  constructor(name, version, schemas) {
    this.name = name;
    this.version = version;
    this.schemas = schemas;
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;

        this.db.onerror = (event) => {
          console.error('Database error:', event.target.error);
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        this.schemas.forEach(schema => {
          if (schema.version > oldVersion) {
            this.applySchema(db, schema);
          }
        });
      };
    });
  }

  applySchema(db, schema) {
    schema.stores.forEach(storeConfig => {
      if (storeConfig.drop && db.objectStoreNames.contains(storeConfig.name)) {
        db.deleteObjectStore(storeConfig.name);
      }

      if (!db.objectStoreNames.contains(storeConfig.name)) {
        const store = db.createObjectStore(storeConfig.name, {
          keyPath: storeConfig.keyPath,
          autoIncrement: storeConfig.autoIncrement
        });

        if (storeConfig.indexes) {
          storeConfig.indexes.forEach(index => {
            store.createIndex(index.name, index.keyPath, {
              unique: index.unique || false,
              multiEntry: index.multiEntry || false
            });
          });
        }
      }
    });
  }

  store(name) {
    return new AdvancedStore(this.db, name);
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async delete() {
    await this.close();
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Schema definition
const schemas = [
  {
    version: 1,
    stores: [
      {
        name: 'users',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'email', keyPath: 'email', unique: true },
          { name: 'name', keyPath: 'name' }
        ]
      },
      {
        name: 'posts',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'userId', keyPath: 'userId' },
          { name: 'createdAt', keyPath: 'createdAt' }
        ]
      }
    ]
  },
  {
    version: 2,
    stores: [
      {
        name: 'comments',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'postId', keyPath: 'postId' },
          { name: 'userId', keyPath: 'userId' }
        ]
      }
    ]
  }
];

// Usage
const database = new Database('myApp', 2, schemas);
await database.open();

const users = database.store('users');
await users.put({ name: 'John', email: 'john@example.com' });

const posts = database.store('posts');
await posts.put({ userId: 1, title: 'Hello World', createdAt: new Date().toISOString() });
```

## Security Considerations

### Data Exposure Risks

```javascript
// Storage data is accessible to any script on the same origin
// This includes third-party scripts loaded on your page

// NEVER store sensitive data in plain text
// Bad - storing sensitive data directly
localStorage.setItem('authToken', 'secret_token_123');
localStorage.setItem('creditCard', '4111111111111111');

// Better - encrypt sensitive data
class SecureStorage {
  constructor(encryptionKey) {
    this.key = encryptionKey;
  }

  // Simple XOR encryption (use a proper library in production)
  encrypt(text) {
    return btoa(
      text.split('').map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length))
      ).join('')
    );
  }

  decrypt(encoded) {
    const text = atob(encoded);
    return text.split('').map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length))
    ).join('');
  }

  set(key, value) {
    const encrypted = this.encrypt(JSON.stringify(value));
    localStorage.setItem(key, encrypted);
  }

  get(key) {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    return JSON.parse(this.decrypt(encrypted));
  }
}

// Usage with Web Crypto API for proper encryption
async function generateKey() {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}

async function decryptData(key, encryptedObj) {
  const iv = new Uint8Array(encryptedObj.iv);
  const data = new Uint8Array(encryptedObj.data);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
}
```

### XSS Protection

```javascript
// Sanitize data before storing and after retrieving
class SanitizedStorage {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  // Basic HTML escaping
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Validate and sanitize input
  sanitize(value) {
    if (typeof value === 'string') {
      // Remove potential script tags
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return value;
  }

  set(key, value) {
    const sanitized = this.sanitize(value);
    this.storage.setItem(key, JSON.stringify(sanitized));
  }

  get(key) {
    const value = this.storage.getItem(key);
    if (value === null) return null;

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}

// Content Security Policy considerations
// Add to your HTML headers:
// Content-Security-Policy: default-src 'self'; script-src 'self'
```

### Storage Availability

```javascript
// Check if storage is available (private browsing mode may disable it)
function isStorageAvailable(type) {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      (e.code === 22 ||
        e.code === 1014 ||
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      storage &&
      storage.length !== 0
    );
  }
}

// Fallback storage for when Web Storage is unavailable
class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.get(key) ?? null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }

  removeItem(key) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }

  get length() {
    return this.data.size;
  }

  key(index) {
    return Array.from(this.data.keys())[index] ?? null;
  }
}

// Universal storage accessor
const storage = isStorageAvailable('localStorage')
  ? localStorage
  : new MemoryStorage();
```

## Practical Examples

### Shopping Cart Persistence

```javascript
class ShoppingCart {
  constructor() {
    this.storageKey = 'shopping_cart';
    this.items = this.load();
  }

  load() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : [];
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.items));
  }

  addItem(product, quantity = 1) {
    const existingIndex = this.items.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity
      });
    }

    this.save();
    return this.items;
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.save();
    return this.items;
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(0, quantity);
      if (item.quantity === 0) {
        return this.removeItem(productId);
      }
      this.save();
    }
    return this.items;
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  clear() {
    this.items = [];
    localStorage.removeItem(this.storageKey);
  }
}

// Usage
const cart = new ShoppingCart();
cart.addItem({ id: 1, name: 'Widget', price: 9.99 }, 2);
cart.addItem({ id: 2, name: 'Gadget', price: 24.99 });
console.log(`Total: $${cart.getTotal().toFixed(2)}`);
```

### User Preferences Manager

```javascript
class PreferencesManager {
  constructor() {
    this.storageKey = 'user_preferences';
    this.defaults = {
      theme: 'light',
      language: 'en',
      fontSize: 16,
      notifications: true,
      autoSave: true,
      sidebarCollapsed: false
    };
    this.preferences = this.load();

    // Apply preferences on load
    this.apply();
  }

  load() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? { ...this.defaults, ...JSON.parse(saved) } : { ...this.defaults };
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    this.apply();
  }

  get(key) {
    return this.preferences[key];
  }

  set(key, value) {
    if (key in this.defaults) {
      this.preferences[key] = value;
      this.save();
    }
  }

  setMultiple(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      if (key in this.defaults) {
        this.preferences[key] = value;
      }
    });
    this.save();
  }

  reset() {
    this.preferences = { ...this.defaults };
    this.save();
  }

  apply() {
    // Apply theme
    document.documentElement.setAttribute('data-theme', this.preferences.theme);

    // Apply font size
    document.documentElement.style.fontSize = `${this.preferences.fontSize}px`;

    // Apply language
    document.documentElement.setAttribute('lang', this.preferences.language);

    // Toggle sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed', this.preferences.sidebarCollapsed);
    }
  }

  export() {
    return JSON.stringify(this.preferences, null, 2);
  }

  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.preferences = { ...this.defaults, ...imported };
      this.save();
      return true;
    } catch {
      return false;
    }
  }
}

// Usage
const prefs = new PreferencesManager();
prefs.set('theme', 'dark');
prefs.setMultiple({ fontSize: 18, notifications: false });
```

### Offline Data Cache

```javascript
class OfflineCache {
  constructor(dbName = 'offlineCache') {
    this.dbName = dbName;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const store = db.createObjectStore('cache', { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('type', 'type');
      };
    });
  }

  async set(url, data, type = 'api') {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');

      const request = store.put({
        url,
        data,
        type,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(url, maxAge = Infinity) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;

        if (!result) {
          resolve(null);
          return;
        }

        // Check if cache is still valid
        if (Date.now() - result.timestamp > maxAge) {
          this.delete(url);
          resolve(null);
          return;
        }

        resolve(result.data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async delete(url) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(url);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearOld(maxAge) {
    const cutoff = Date.now() - maxAge;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoff);
      let deleted = 0;

      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deleted++;
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Fetch with cache
  async fetchWithCache(url, options = {}) {
    const { maxAge = 5 * 60 * 1000, forceRefresh = false } = options;

    // Try cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = await this.get(url, maxAge);
      if (cached) {
        return { data: cached, fromCache: true };
      }
    }

    // Fetch from network
    try {
      const response = await fetch(url);
      const data = await response.json();

      // Cache the response
      await this.set(url, data, 'api');

      return { data, fromCache: false };
    } catch (error) {
      // On network error, try cache even if expired
      const cached = await this.get(url, Infinity);
      if (cached) {
        return { data: cached, fromCache: true, stale: true };
      }
      throw error;
    }
  }
}

// Usage
const cache = new OfflineCache();
await cache.init();

// Fetch with automatic caching
const { data, fromCache } = await cache.fetchWithCache('/api/users', {
  maxAge: 10 * 60 * 1000 // 10 minutes
});

console.log(`Data ${fromCache ? 'from cache' : 'from network'}:`, data);

// Clean up old cache entries daily
setInterval(() => cache.clearOld(24 * 60 * 60 * 1000), 24 * 60 * 60 * 1000);
```

## Summary

The Web Storage API provides powerful mechanisms for client-side data persistence:

- **localStorage** offers persistent storage that survives browser restarts, ideal for user preferences and cached data
- **sessionStorage** provides tab-specific temporary storage, perfect for form data and navigation state
- **Storage events** enable cross-tab communication and synchronized state
- **IndexedDB** handles complex structured data with indexing and efficient queries
- Always consider storage limits (typically 5-10MB for Web Storage, larger for IndexedDB)
- Security is critical: never store sensitive data unencrypted, and be aware of XSS risks
- Provide fallbacks for private browsing modes where storage may be unavailable

When choosing a storage mechanism:
- Use **localStorage** for small amounts of persistent data (preferences, tokens)
- Use **sessionStorage** for temporary, tab-specific state
- Use **IndexedDB** for large datasets, complex queries, or offline-first applications
- Consider using a library like idb, localForage, or Dexie.js for more ergonomic IndexedDB access

Proper client-side storage implementation significantly enhances user experience through faster load times, offline capabilities, and persistent user preferences.
