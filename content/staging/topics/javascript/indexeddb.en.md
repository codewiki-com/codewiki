---
title: "JavaScript IndexedDB: Client-Side Storage Mastery"
description: "Comprehensive guide to IndexedDB: NoSQL database for browsers, transactions, indexes, and building offline-capable web applications"
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - IndexedDB
  - NoSQL
  - Client-Side Storage
  - Web Storage
  - Offline
  - Database
  - Performance
status: imported
origin: old/src/content/docs/javascript/indexeddb.en.md
divergence: 0.292
issues:
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: Client-Side Storage
  order: 48
  lastUpdated: 2026-01-07
---

IndexedDB is a low-level API for storing large amounts of structured data in the browser. Unlike Web Storage (localStorage/sessionStorage) which is limited to about 5-10 MB, IndexedDB can store hundreds of megabytes or more depending on user settings and browser policy. It provides a NoSQL database experience with support for transactions, indexes, and complex queries, making it ideal for building offline-capable applications, caching strategies, and managing complex client-side data.

---

## Concept Explanation

### What is IndexedDB?

IndexedDB is a transactional database system for browsers that allows you to store and retrieve JavaScript objects indexed by a key. It's built on the concept of:

1. **Key-Value Store**: Data is stored as key-value pairs, but unlike objects, it's designed for large datasets
2. **NoSQL**: Uses object stores instead of tables, supporting complex data structures
3. **Indexed**: Data can be indexed by multiple properties for fast queries
4. **Transactional**: Operations are ACID-compliant with automatic rollback on errors
5. **Asynchronous**: All operations are non-blocking, using promises or callbacks
6. **Large Storage**: Typically allows gigabytes of data (browser and quota dependent)

### How IndexedDB Differs from Other Storage Methods

| Feature | localStorage | sessionStorage | IndexedDB | WebSQL |
|---------|--------------|---|-----------|--------|
| **Capacity** | 5-10 MB | 5-10 MB | 50 MB - 1+ GB | 50 MB - 1+ GB |
| **Data Types** | Strings only | Strings only | Any JavaScript object | Tables/SQL |
| **Async** | No (blocks) | No (blocks) | Yes | Yes |
| **Transactions** | No | No | Yes | Yes |
| **Indexes** | No | No | Yes | Yes |
| **Query Power** | Key lookup only | Key lookup only | Key + index ranges | Full SQL |
| **Support** | Universal | Universal | Universal | Deprecated |

---

## Core Principles

### Database Structure Hierarchy

```javascript
// IndexedDB hierarchy:
// Database
// └── Object Store (like a table)
//     ├── Index 1
//     ├── Index 2
//     └── Records (objects with keys)

// Opening a database
const request = indexedDB.open('myDatabase', 1);

request.onerror = () => console.error('Database failed to open');

request.onsuccess = () => {
  const db = request.result;
  // db contains the database instance
};

request.onupgradeneeded = (event) => {
  // Called when database version increases
  const db = event.target.result;

  // Create object store if it doesn't exist
  if (!db.objectStoreNames.contains('users')) {
    const store = db.createObjectStore('users', { keyPath: 'id' });
    store.createIndex('email', 'email', { unique: true });
  }
};
```

### Transaction Model

Every IndexedDB operation must occur within a transaction. Transactions ensure data consistency and prevent race conditions.

```javascript
// Explicit transaction
const transaction = db.transaction('users', 'readwrite');
const store = transaction.objectStore('users');

// Transaction event handlers
transaction.oncomplete = () => console.log('Transaction successful');
transaction.onerror = () => console.log('Transaction failed');
transaction.onabort = () => console.log('Transaction aborted');

// The transaction must complete before it's processed
const request = store.add({ id: 1, name: 'John', email: 'john@example.com' });
request.onsuccess = () => console.log('Data added');
request.onerror = () => console.log('Failed to add data');
```

### Request-Based API

All IndexedDB operations return IDBRequest objects with async results.

```javascript
// IDBRequest has these key properties and events:
const request = store.get(1);

// The request goes through states:
// pending -> result available or error
request.onsuccess = (event) => {
  const data = event.target.result; // The actual result
};

request.onerror = (event) => {
  const error = event.target.error;
};

request.result;  // undefined until onsuccess fires
request.error;   // Set if request fails
```

### Indexes for Fast Queries

Indexes allow querying by properties other than the primary key.

```javascript
const store = db.createObjectStore('products', { keyPath: 'id' });

// Create indexes
store.createIndex('category', 'category');              // Non-unique
store.createIndex('sku', 'sku', { unique: true });     // Unique index
store.createIndex('price', 'price');                    // For range queries

// Query using index
const index = store.index('category');
const categoryQuery = index.getAll('Electronics');

categoryQuery.onsuccess = () => {
  console.log(categoryQuery.result); // All electronics
};
```

---

## Key Points

### Object Store Configuration

```javascript
// KeyPath: identifies the key property within objects
const store1 = db.createObjectStore('users', { keyPath: 'id' });
const store2 = db.createObjectStore('posts', { keyPath: ['userId', 'postId'] }); // Compound key

// autoIncrement: generates keys automatically
const store3 = db.createObjectStore('logs', {
  autoIncrement: true  // Each log gets auto-incrementing number
});

// No keyPath or autoIncrement: you must provide keys explicitly
const store4 = db.createObjectStore('cache');
// Later: store4.add(data, 'custom-key-123');
```

### Query Methods

```javascript
const store = transaction.objectStore('users');

// Get by key
store.get(1);                          // Single record by primary key

// Get all
store.getAll();                        // All records
store.getAll(null, 5);                 // First 5 records

// Add/Put
store.add(data);                       // Fail if key exists
store.put(data);                       // Overwrite if key exists

// Delete
store.delete(key);                     // Delete single record
store.clear();                         // Clear all records

// Update
const getRequest = store.get(1);
getRequest.onsuccess = () => {
  const data = getRequest.result;
  data.name = 'Updated';
  store.put(data);                     // Update by re-putting
};

// Count
store.count();                         // Total records

// IDBIndex methods (similar to store)
const index = store.index('email');
index.get('john@example.com');        // Get by index
index.getAll('john@example.com', 10); // Multiple matches
index.getKey('john@example.com');     // Get only the key
```

### Cursor-Based Iteration

```javascript
// Cursors allow efficient iteration through large datasets
const store = transaction.objectStore('users');
const request = store.openCursor();

request.onsuccess = (event) => {
  const cursor = event.target.result;

  if (cursor) {
    const user = cursor.value;
    console.log(user.name);

    // Move to next record
    cursor.continue();
    // cursor.advance(5);           // Skip 5 records
    // cursor.continuePrimaryKey(userId, timestamp); // Continue from specific point
  } else {
    console.log('No more records');
  }
};

// Cursor direction
store.openCursor(null, 'next');        // Forward
store.openCursor(null, 'prev');        // Backward
store.openCursor(null, 'nextunique');  // Skip duplicates when on index

// Key ranges for efficient querying
const range = IDBKeyRange.bound(5, 10);           // 5 <= key <= 10
const range2 = IDBKeyRange.lowerBound(100);       // key >= 100
const range3 = IDBKeyRange.upperBound(50);        // key <= 50
const range4 = IDBKeyRange.only(42);              // key === 42

store.openCursor(range);  // Only records in range
```

### Deletion and Versioning

```javascript
// Delete entire database
const deleteRequest = indexedDB.deleteDatabase('myDatabase');

deleteRequest.onsuccess = () => console.log('Database deleted');
deleteRequest.onblocked = () => console.log('Delete blocked, close other connections');

// Version migration
const openRequest = indexedDB.open('myDatabase', 2); // Version 2

openRequest.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;
  const newVersion = event.newVersion;

  if (oldVersion < 2) {
    // Add new object store or modify existing ones
    if (!db.objectStoreNames.contains('orders')) {
      db.createObjectStore('orders', { keyPath: 'id' });
    }
  }
};
```

---

## Code Examples

### Complete CRUD Application

```javascript
class IndexedDBManager {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  // Initialize database
  async init(storeConfig) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(new Error('Database failed to open'));

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        for (const [storeName, config] of Object.entries(storeConfig)) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, config.keyPath);

            if (config.indexes) {
              config.indexes.forEach(index => {
                store.createIndex(index.name, index.keyPath, index.options);
              });
            }
          }
        }
      };
    });
  }

  // Add/Update record
  async put(storeName, data) {
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get single record
  async get(storeName, key) {
    const transaction = this.db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all records
  async getAll(storeName) {
    const transaction = this.db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Query by index
  async queryIndex(storeName, indexName, key) {
    const transaction = this.db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);

    return new Promise((resolve, reject) => {
      const request = index.getAll(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete record
  async delete(storeName, key) {
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear store
  async clear(storeName) {
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Bulk operations
  async bulkPut(storeName, dataArray) {
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const results = [];

    return new Promise((resolve, reject) => {
      const processItem = (index) => {
        if (index >= dataArray.length) {
          resolve(results);
          return;
        }

        const request = store.put(dataArray[index]);
        request.onsuccess = () => {
          results.push(request.result);
          processItem(index + 1);
        };
        request.onerror = () => reject(request.error);
      };

      processItem(0);
    });
  }

  // Cursor iteration
  async forEach(storeName, callback, range = null) {
    const transaction = this.db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.openCursor(range);
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          callback(cursor.value, cursor.key);
          count++;
          cursor.continue();
        } else {
          resolve(count);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Range query
  async rangeQuery(storeName, startKey, endKey) {
    const range = IDBKeyRange.bound(startKey, endKey);
    return this.forEach(storeName, () => {}, range);
  }

  // Transaction with multiple operations
  async transaction(operations) {
    return new Promise((resolve, reject) => {
      const storeNames = [...new Set(operations.map(op => op.store))];
      const transaction = this.db.transaction(storeNames, 'readwrite');
      const results = [];

      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(transaction.error);

      operations.forEach(op => {
        const store = transaction.objectStore(op.store);
        let request;

        switch (op.action) {
          case 'put':
            request = store.put(op.data);
            break;
          case 'delete':
            request = store.delete(op.key);
            break;
          case 'clear':
            request = store.clear();
            break;
        }

        if (request) {
          request.onsuccess = () => results.push(request.result);
          request.onerror = () => reject(request.error);
        }
      });
    });
  }
}

// Usage
(async () => {
  const db = new IndexedDBManager('AppDatabase', 1);

  const storeConfig = {
    users: {
      keyPath: { keyPath: 'id', autoIncrement: false },
      indexes: [
        { name: 'email', keyPath: 'email', options: { unique: true } },
        { name: 'name', keyPath: 'name', options: { unique: false } }
      ]
    },
    posts: {
      keyPath: { keyPath: 'id', autoIncrement: true },
      indexes: [
        { name: 'userId', keyPath: 'userId', options: { unique: false } },
        { name: 'created', keyPath: 'created', options: { unique: false } }
      ]
    }
  };

  await db.init(storeConfig);

  // Add users
  await db.put('users', { id: 1, name: 'Alice', email: 'alice@example.com' });
  await db.put('users', { id: 2, name: 'Bob', email: 'bob@example.com' });

  // Query
  const user = await db.get('users', 1);
  console.log('Found user:', user);

  // Query by index
  const users = await db.queryIndex('users', 'name', 'Alice');
  console.log('Users named Alice:', users);

  // Get all
  const allUsers = await db.getAll('users');
  console.log('All users:', allUsers);

  // Iteration
  let count = 0;
  await db.forEach('users', (user) => {
    console.log(`User ${++count}:`, user.name);
  });

  // Delete
  await db.delete('users', 1);
  console.log('User 1 deleted');

  // Bulk operations
  await db.bulkPut('posts', [
    { id: 1, userId: 1, title: 'First Post', created: Date.now() },
    { id: 2, userId: 1, title: 'Second Post', created: Date.now() },
    { id: 3, userId: 2, title: 'Post by Bob', created: Date.now() }
  ]);

  // Transaction
  await db.transaction([
    { action: 'put', store: 'users', data: { id: 3, name: 'Charlie', email: 'charlie@example.com' } },
    { action: 'put', store: 'posts', data: { id: 4, userId: 3, title: 'Charlies First Post', created: Date.now() } }
  ]);
})();
```

### Offline Synchronization Pattern

```javascript
class OfflineSync {
  constructor(db, apiBaseUrl) {
    this.db = db;
    this.apiBaseUrl = apiBaseUrl;
    this.isOnline = navigator.onLine;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async saveData(storeName, data) {
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put({
        ...data,
        _pendingSync: !this.isOnline,
        _lastModified: Date.now()
      });

      request.onsuccess = async () => {
        const id = request.result;

        if (this.isOnline) {
          await this.syncToServer(storeName, id, data);
        }

        resolve(id);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async syncToServer(storeName, id, data) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${storeName}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        // Clear pending sync flag
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const record = getRequest.result;
          record._pendingSync = false;
          store.put(record);
        };
      }
    } catch (error) {
      console.error('Sync failed:', error);
      // Data remains marked as pending
    }
  }

  async syncPendingChanges() {
    const transaction = this.db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.getAll();

    request.onsuccess = async () => {
      const allRecords = request.result;
      const pending = allRecords.filter(r => r._pendingSync);

      for (const record of pending) {
        await this.syncToServer('users', record.id, record);
      }
    };
  }

  async getWithFallback(storeName, key) {
    // Try to fetch from server if online
    if (this.isOnline) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/${storeName}/${key}`);
        if (response.ok) {
          const data = await response.json();
          // Update cache
          const transaction = this.db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          store.put({ ...data, _synced: true });
          return data;
        }
      } catch (error) {
        console.error('Failed to fetch from server:', error);
      }
    }

    // Fall back to IndexedDB
    const transaction = this.db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Usage
(async () => {
  const dbManager = new IndexedDBManager('OfflineApp', 1);
  await dbManager.init({
    users: { keyPath: { keyPath: 'id', autoIncrement: true } }
  });

  const sync = new OfflineSync(dbManager.db, 'https://api.example.com');

  // Save data (automatically syncs when online)
  const userId = await sync.saveData('users', {
    name: 'John',
    email: 'john@example.com'
  });

  // Get data (uses server if online, falls back to cache)
  const user = await sync.getWithFallback('users', userId);
  console.log('User:', user);
})();
```

### Caching Strategy with Expiration

```javascript
class CacheManager {
  constructor(db, cacheDuration = 3600000) { // 1 hour default
    this.db = db;
    this.cacheDuration = cacheDuration;
  }

  async init() {
    const request = indexedDB.open('CacheDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('cache')) {
        const store = db.createObjectStore('cache', { keyPath: 'url' });
        store.createIndex('expires', 'expires', { unique: false });
      }
    };

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        this.db = request.result;
        this.cleanupExpired();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async fetch(url, options = {}) {
    const cached = await this.getCached(url);

    if (cached) {
      console.log('Cache hit:', url);
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (response.ok) {
        await this.setCached(url, data);
      }

      return new Response(JSON.stringify(data), response);
    } catch (error) {
      // Return cached data even if expired during offline
      const expiredCache = await this.getExpired(url);
      if (expiredCache) {
        return new Response(JSON.stringify(expiredCache.data), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }
  }

  async setCached(url, data) {
    const transaction = this.db.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');

    const cacheEntry = {
      url,
      data,
      created: Date.now(),
      expires: Date.now() + this.cacheDuration
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCached(url) {
    const transaction = this.db.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.get(url);
      request.onsuccess = () => {
        const entry = request.result;
        if (entry && entry.expires > Date.now()) {
          resolve(entry);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getExpired(url) {
    const transaction = this.db.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.get(url);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cleanupExpired() {
    const transaction = this.db.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('expires');

    const range = IDBKeyRange.upperBound(Date.now());
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }
}

// Usage
(async () => {
  const cache = new CacheManager(null, 60000); // 1 minute cache
  await cache.init();

  // Fetch with caching
  const response = await cache.fetch('https://api.example.com/data');
  const data = await response.json();
  console.log('Data:', data);
})();
```

---

## Best Practices

### Always Use Promises or Async/Await Wrapper

IndexedDB's callback-based API is error-prone. Wrap it in promises:

```javascript
// Good: Promise wrapper
function dbGet(store, key) {
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Better: Use libraries or IndexedDB wrappers
// Dexie.js, IDB, localForage all provide promise-based interfaces
```

### Handle Quota Exceeded Errors

```javascript
async function saveWithQuotaCheck(db, data) {
  try {
    // Estimate usage
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota) * 100;

    if (percentUsed > 90) {
      console.warn('Storage quota nearly exceeded');
      await cleanupOldData(db);
    }

    return await db.put('data', data);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded');
      // Implement cleanup strategy
    }
    throw error;
  }
}
```

### Use Indexes Efficiently

```javascript
// Good: Create indexes for frequently queried fields
const store = db.createObjectStore('users', { keyPath: 'id' });
store.createIndex('email', 'email', { unique: true });
store.createIndex('age', 'age');
store.createIndex('active', 'active');

// Bad: Too many indexes slow down writes
store.createIndex('firstName', 'firstName');
store.createIndex('lastName', 'lastName');
store.createIndex('streetAddress', 'address.street');
// ... dozens more

// Query using indexes
const index = store.index('email');
const result = index.get('user@example.com'); // Fast!
```

### Batch Operations for Performance

```javascript
// Bad: Individual transactions
for (const item of largeArray) {
  await db.put('items', item);
}

// Good: Batch in transactions
async function batchPut(store, items) {
  const transaction = db.transaction('items', 'readwrite');
  const objectStore = transaction.objectStore('items');

  return new Promise((resolve, reject) => {
    items.forEach(item => objectStore.put(item));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
```

### Proper Error Handling

```javascript
const request = store.get(key);

request.onerror = (event) => {
  const error = event.target.error;

  if (error.name === 'NotFoundError') {
    console.log('Key not found');
  } else if (error.name === 'QuotaExceededError') {
    console.log('Storage full');
  } else if (error.name === 'AbortError') {
    console.log('Request aborted');
  } else {
    console.log('Unknown error:', error);
  }
};
```

### Schema Versioning

```javascript
const DB_VERSION = 3;

const request = indexedDB.open('AppDB', DB_VERSION);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;

  if (oldVersion < 1) {
    // Initial schema
    db.createObjectStore('users', { keyPath: 'id' });
  }

  if (oldVersion < 2) {
    // Add new object store
    db.createObjectStore('posts', { keyPath: 'id' });
  }

  if (oldVersion < 3) {
    // Modify schema: add index to users
    const transaction = event.target.transaction;
    const userStore = transaction.objectStore('users');
    userStore.createIndex('email', 'email', { unique: true });
  }
};
```

### Data Validation

```javascript
async function putValidated(store, data, schema) {
  // Validate before storing
  const errors = validateSchema(data, schema);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return new Promise((resolve, reject) => {
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function validateSchema(data, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    if (rules.required && !value) {
      errors.push(`${field} is required`);
    }

    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be ${rules.type}`);
    }

    if (rules.minLength && value?.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }
  }

  return errors;
}
```

---

## Common Pitfalls

### Forgetting to Wait for Open

```javascript
// Bad: Database not ready
const request = indexedDB.open('myDB', 1);
const store = request.objectStore('users'); // Error! request.result is undefined

// Good: Wait for success
const request = indexedDB.open('myDB', 1);
request.onsuccess = () => {
  const db = request.result;
  const transaction = db.transaction('users', 'readwrite');
  const store = transaction.objectStore('users');
};
```

### Storing Non-Serializable Objects

```javascript
// Bad: Functions and circular references cannot be stored
const user = {
  id: 1,
  name: 'John',
  greet: () => console.log('Hello'), // Functions not allowed
  self: null                          // Circular reference
};
user.self = user;

// Good: Only store serializable data
const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  metadata: { created: Date.now() }
};
```

### Not Handling Blocked/Blocked Event

```javascript
// Bad: No handling for blocked open
const request = indexedDB.open('myDB', 2);

// Good: Handle blocked database
const request = indexedDB.open('myDB', 2);

request.onblocked = () => {
  console.warn('Database upgrade blocked. Close all other tabs with this site');
};

request.onupgradeneeded = (event) => {
  // Perform upgrade
};
```

### Using Wrong Transaction Mode

```javascript
// Bad: Trying to write in readonly transaction
const transaction = db.transaction('users', 'readonly');
const store = transaction.objectStore('users');
store.put(data); // Error!

// Good: Use readwrite when modifying
const transaction = db.transaction('users', 'readwrite');
const store = transaction.objectStore('users');
store.put(data); // Works!
```

### Assuming Synchronous Operations

```javascript
// Bad: Assuming result is ready immediately
const request = store.get(1);
console.log(request.result); // undefined - not ready yet!

// Good: Use callbacks or promises
const request = store.get(1);
request.onsuccess = () => {
  console.log(request.result); // Data is ready now
};
```

### Creating Indexes on Non-Unique Data Carelessly

```javascript
// Bad: Unique index on nullable field
const store = db.createObjectStore('users', { keyPath: 'id' });
store.createIndex('phone', 'phone', { unique: true }); // Multiple users might not have phone

// Good: Handle nullable unique fields
store.createIndex('phone', 'phone', { unique: false }); // Or make it required in schema
```

### Ignoring Browser Storage Limits

```javascript
// Bad: Unbounded data growth
async function cacheAllData(apiEndpoint) {
  const response = await fetch(apiEndpoint);
  const data = await response.json();
  // Store everything without cleanup
  await db.put('cache', { endpoint: apiEndpoint, data, timestamp: Date.now() });
}

// Good: Implement size and time limits
async function cacheWithLimits(apiEndpoint) {
  const response = await fetch(apiEndpoint);
  const data = await response.json();

  await db.put('cache', {
    endpoint: apiEndpoint,
    data,
    timestamp: Date.now(),
    ttl: 3600000 // 1 hour
  });

  // Cleanup old entries
  await cleanupOldCache(3600000);
}
```

---

## Performance Considerations

### Large Dataset Handling

```javascript
// Bad: Loading entire dataset into memory
const allRecords = await db.getAll('largeStore');
allRecords.forEach(record => processRecord(record));

// Good: Use cursors for streaming
const transaction = db.transaction('largeStore', 'readonly');
const store = transaction.objectStore('largeStore');
const request = store.openCursor();

request.onsuccess = (event) => {
  const cursor = event.target.result;
  if (cursor) {
    processRecord(cursor.value);
    cursor.continue();
  }
};
```

### Index Usage for Range Queries

```javascript
// Bad: Iterate all records and filter
const store = transaction.objectStore('products');
const allProducts = store.getAll();

allProducts.onsuccess = () => {
  const expensiveProducts = allProducts.result.filter(p => p.price > 1000);
};

// Good: Use index with range
const store = transaction.objectStore('products');
const priceIndex = store.index('price');
const range = IDBKeyRange.lowerBound(1000);
const expensiveProducts = priceIndex.getAll(range);
```

### Compound Index for Multi-Property Queries

```javascript
// Single queries on different properties are slow when combined
const store = db.createObjectStore('orders', { keyPath: 'id' });
store.createIndex('customerId', 'customerId');
store.createIndex('date', 'date');

// Instead, create compound indexes for common queries
store.createIndex('customerDate', ['customerId', 'date']);

// Query
const index = store.index('customerDate');
const range = IDBKeyRange.bound(
  [customerId, startDate],
  [customerId, endDate]
);
const results = index.getAll(range);
```

### Transaction Duration

```javascript
// Bad: Long-running operations in transaction
const transaction = db.transaction('users', 'readwrite');
const store = transaction.objectStore('users');

// Long operation holding transaction
await expensiveCalculation(); // Blocks other transactions
const result = store.put(data);

// Good: Keep transactions short
await expensiveCalculation();

const transaction = db.transaction('users', 'readwrite');
const store = transaction.objectStore('users');
const result = store.put(data);
```

### Monitoring Performance

```javascript
class IndexedDBMonitor {
  static async logStats(db) {
    for (const storeName of db.objectStoreNames) {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);

      const countRequest = store.count();
      countRequest.onsuccess = () => {
        console.log(`${storeName}: ${countRequest.result} records`);
      };
    }
  }

  static async estimateSize(db) {
    let totalSize = 0;

    for (const storeName of db.objectStoreNames) {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const json = JSON.stringify(request.result);
        totalSize += new Blob([json]).size;
      };
    }

    return totalSize;
  }
}
```

---

## Real-world Scenarios

### Offline Todo Application

```javascript
class TodoApp {
  constructor() {
    this.db = null;
    this.syncQueue = [];
  }

  async init() {
    const request = indexedDB.open('TodoDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const store = db.createObjectStore('todos', { keyPath: 'id', autoIncrement: true });
      store.createIndex('completed', 'completed');
      store.createIndex('dueDate', 'dueDate');
    };

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addTodo(title, dueDate) {
    const transaction = this.db.transaction('todos', 'readwrite');
    const store = transaction.objectStore('todos');

    return new Promise((resolve, reject) => {
      const todo = {
        title,
        completed: false,
        dueDate,
        created: Date.now(),
        synced: false
      };

      const request = store.add(todo);
      request.onsuccess = () => {
        this.syncQueue.push({ action: 'add', todo: { ...todo, id: request.result } });
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async toggleTodo(id) {
    const transaction = this.db.transaction('todos', 'readwrite');
    const store = transaction.objectStore('todos');
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const todo = getRequest.result;
      todo.completed = !todo.completed;
      store.put(todo);
      this.syncQueue.push({ action: 'update', todo });
    };
  }

  async getPending() {
    const transaction = this.db.transaction('todos', 'readonly');
    const store = transaction.objectStore('todos');
    const index = store.index('completed');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async syncWithServer() {
    for (const item of this.syncQueue) {
      try {
        await fetch('https://api.example.com/todos', {
          method: 'POST',
          body: JSON.stringify(item),
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Sync failed:', error);
        break;
      }
    }
    this.syncQueue = [];
  }
}
```

### Search Index Preloading

```javascript
class SearchCache {
  constructor(db) {
    this.db = db;
    this.loaded = false;
  }

  async loadSearchIndex(apiUrl) {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      const transaction = this.db.transaction('searchIndex', 'readwrite');
      const store = transaction.objectStore('searchIndex');

      for (const item of data) {
        store.put({
          id: item.id,
          title: item.title.toLowerCase(),
          description: item.description.toLowerCase(),
          tags: item.tags.map(t => t.toLowerCase()),
          original: item
        });
      }

      this.loaded = true;
    } catch (error) {
      console.error('Failed to load search index:', error);
    }
  }

  async search(query) {
    if (!this.loaded) {
      console.warn('Search index not loaded');
      return [];
    }

    const transaction = this.db.transaction('searchIndex', 'readonly');
    const store = transaction.objectStore('searchIndex');
    const allResults = [];

    return new Promise((resolve, reject) => {
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const item = cursor.value;
          const queryLower = query.toLowerCase();

          if (
            item.title.includes(queryLower) ||
            item.description.includes(queryLower) ||
            item.tags.some(tag => tag.includes(queryLower))
          ) {
            allResults.push(item.original);
          }

          cursor.continue();
        } else {
          resolve(allResults);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}
```

### Analytics Data Collection

```javascript
class AnalyticsBuffer {
  constructor(db, flushInterval = 30000, maxBufferSize = 1000) {
    this.db = db;
    this.buffer = [];
    this.flushInterval = flushInterval;
    this.maxBufferSize = maxBufferSize;
    this.setupAutoFlush();
  }

  track(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    this.buffer.push(event);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const eventsToSend = [...this.buffer];
    this.buffer = [];

    const transaction = this.db.transaction('analytics', 'readwrite');
    const store = transaction.objectStore('analytics');

    eventsToSend.forEach(event => {
      store.add({ ...event, synced: false, createdAt: Date.now() });
    });

    return new Promise((resolve) => {
      transaction.oncomplete = async () => {
        try {
          await this.sendToServer(eventsToSend);
          await this.markAsSynced(eventsToSend);
        } catch (error) {
          console.error('Failed to send analytics:', error);
        }
        resolve();
      };
    });
  }

  async sendToServer(events) {
    const response = await fetch('https://analytics.example.com/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    });

    if (!response.ok) {
      throw new Error(`Analytics send failed: ${response.status}`);
    }
  }

  async markAsSynced(events) {
    const transaction = this.db.transaction('analytics', 'readwrite');
    const store = transaction.objectStore('analytics');
    const timestamps = events.map(e => e.timestamp);

    for (const timestamp of timestamps) {
      const getRequest = store.get(timestamp);
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        record.synced = true;
        store.put(record);
      };
    }
  }

  setupAutoFlush() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random()}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }
}
```

---

## Interview Points

### When to Use IndexedDB vs Other Storage Options?

**Answer**: Choose IndexedDB when:
- You need to store large amounts of data (> 10MB)
- You need complex queries beyond key lookups
- You need transactions for data consistency
- You're building offline-capable applications
- You need to index data on multiple properties

Choose localStorage/sessionStorage for:
- Small configuration data (< 5KB)
- Simple key-value pairs
- Data that needs to be cleared when browser closes

### How Do Transactions Ensure Data Consistency?

**Answer**: IndexedDB transactions provide ACID guarantees:
- **Atomicity**: All operations complete or all rollback
- **Consistency**: Database stays in valid state
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed data persists

```javascript
// If any operation fails, entire transaction rolls back
const transaction = db.transaction(['store1', 'store2'], 'readwrite');
transaction.objectStore('store1').put(data1);
transaction.objectStore('store2').put(data2);
// Both succeed or both fail
```

### What Are the Limitations of IndexedDB?

**Answer**:
- **Storage quota**: Browser-dependent, user can delete
- **Synchronous operations**: No blocking calls allowed (async only)
- **Single-threaded**: Within a tab (but works in Workers)
- **No SQL**: Limited query capabilities vs real databases
- **No built-in sync**: Must implement manual sync logic
- **Schema evolution**: Requires version management

### How Do You Handle Browser Storage Quota?

**Answer**:
```javascript
const estimate = await navigator.storage.estimate();
const available = estimate.quota - estimate.usage;
const percentUsed = (estimate.usage / estimate.quota) * 100;

if (percentUsed > 90) {
  // Implement cleanup strategy
  await deleteOldCachedData();
}

// Request persistent storage
if (navigator.storage && navigator.storage.persist) {
  const persistent = await navigator.storage.persist();
  console.log('Persistent storage granted:', persistent);
}
```

### Explain Index Types and When to Use Them

**Answer**:
```javascript
// Unique index: For fields that must be unique (email, username)
store.createIndex('email', 'email', { unique: true });

// Non-unique index: For frequently searched fields
store.createIndex('category', 'category');

// Compound index: For multi-property queries
store.createIndex('userCreated', ['userId', 'created']);

// When to index:
// - Frequently queried fields
// - Fields used in range queries
// - Rarely on low-cardinality data

// When not to index:
// - Rarely accessed fields
// - High-cardinality data with low query frequency
// - Fields with many null values
```

### How Do Cursors Improve Performance?

**Answer**: Cursors provide efficient iteration:
- **Memory efficient**: Don't load all data at once
- **Directional**: Can iterate forward/backward
- **Filtered iteration**: Can start at specific key
- **Lazy loading**: Data loaded incrementally

```javascript
// Bad: Loads all data
store.getAll().onsuccess = (e) => {
  e.target.result.forEach(item => process(item));
};

// Good: Streams data with cursor
const cursor = store.openCursor();
cursor.onsuccess = (e) => {
  const cursor = e.target.result;
  if (cursor) {
    process(cursor.value);
    cursor.continue();
  }
};
```

### Privacy and Security Considerations

**Answer**:
- **Per-origin storage**: Each domain has separate IndexedDB
- **Same-origin policy**: Cannot access another domain's data
- **User can clear**: User can delete all IndexedDB data
- **No encryption**: Data stored unencrypted (use for non-sensitive data)
- **Service Worker access**: Shared across all tabs for same origin

### How Does IndexedDB Compare to Service Worker Cache API?

**Answer**:
- **IndexedDB**: Best for structured data, complex queries
- **Cache API**: Best for HTTP responses, used by Service Workers
- **Both**: Can use together for comprehensive offline strategy

---

## Further Reading

### Official Documentation
- [MDN Web Docs - IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [W3C IndexedDB Specification](https://www.w3.org/TR/IndexedDB-3/)
- [Web Storage Standard](https://html.spec.whatwg.org/multipage/webstorage.html)

### Popular Libraries
- **Dexie.js**: Promise-based wrapper with excellent API
- **PouchDB**: Sync-enabled document database
- **IDB**: Minimal IndexedDB wrapper maintaining original API
- **LocalForage**: Unified storage API

### Related Topics
- Service Workers and Caching Strategies
- Web Storage API (localStorage, sessionStorage)
- File API and Blob Storage
- Cross-Origin Resource Sharing (CORS)
- Progressive Web Applications (PWA)

### Performance & Best Practices
- Use cursors for large datasets
- Batch operations in transactions
- Create appropriate indexes
- Monitor quota usage
- Implement cleanup strategies
- Handle quota exceeded errors gracefully

---

## Conclusion

IndexedDB is a powerful tool for client-side data management, enabling offline-capable, data-rich web applications. While its callback-based API requires careful handling, the asynchronous nature, transaction support, and ability to store large amounts of structured data make it invaluable for modern web development. Understanding proper usage patterns, error handling, and performance optimization is key to building robust applications that work reliably both online and offline.

The combination of IndexedDB with Service Workers and Cache API provides a comprehensive strategy for building truly resilient web applications that offer native app-like experiences to users.