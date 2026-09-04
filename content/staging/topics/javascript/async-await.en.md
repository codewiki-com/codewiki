---
title: JavaScript async/await
description: "Master async/await: async functions, error handling and concurrent execution patterns"
track: javascript
section: async
difficulty: intermediate
tags:
  - JavaScript
  - async
  - await
  - Asynchronous
status: imported
origin: old/src/content/docs/javascript/async-await.en.md
divergence: 0.289
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Async Programming
  order: 6
  lastUpdated: 2026-01-07
---

Async/await is a modern JavaScript syntax that makes asynchronous code look and behave more like synchronous code. Built on top of Promises, it provides a cleaner and more intuitive way to handle asynchronous operations.

## What is async/await?

Async/await is syntactic sugar over Promises that allows you to write asynchronous code in a synchronous-looking manner. It consists of two keywords:

- **async**: Declares an asynchronous function that always returns a Promise
- **await**: Pauses execution until a Promise is resolved or rejected

## Async Functions

An async function is declared using the `async` keyword. It automatically wraps the return value in a Promise.

### Basic Syntax

```javascript
async function fetchData() {
  return 'Hello, World!';
}

// Equivalent to:
function fetchData() {
  return Promise.resolve('Hello, World!');
}

// Usage
fetchData().then(data => console.log(data)); // "Hello, World!"
```

### Async Function Expressions

```javascript
// Function expression
const getData = async function() {
  return 'data';
};

// Arrow function
const fetchUser = async () => {
  return { id: 1, name: 'John' };
};

// Method in object
const api = {
  async getUsers() {
    return ['Alice', 'Bob', 'Charlie'];
  }
};

// Class method
class UserService {
  async fetchUser(id) {
    return { id, name: 'User' };
  }
}
```

## The await Keyword

The `await` keyword can only be used inside async functions. It pauses execution until the Promise resolves and returns the resolved value.

### Basic Usage

```javascript
async function fetchUserData() {
  const response = await fetch('https://api.example.com/user');
  const data = await response.json();
  return data;
}

// Without async/await (using Promises)
function fetchUserData() {
  return fetch('https://api.example.com/user')
    .then(response => response.json())
    .then(data => data);
}
```

### Sequential Operations

```javascript
async function processData() {
  console.log('Starting...');

  const step1 = await performStep1();
  console.log('Step 1 complete:', step1);

  const step2 = await performStep2(step1);
  console.log('Step 2 complete:', step2);

  const step3 = await performStep3(step2);
  console.log('Step 3 complete:', step3);

  return step3;
}

function performStep1() {
  return new Promise(resolve => {
    setTimeout(() => resolve('Result 1'), 1000);
  });
}

function performStep2(input) {
  return new Promise(resolve => {
    setTimeout(() => resolve(`${input} -> Result 2`), 1000);
  });
}

function performStep3(input) {
  return new Promise(resolve => {
    setTimeout(() => resolve(`${input} -> Result 3`), 1000);
  });
}
```

## Error Handling

Async/await makes error handling more intuitive using try/catch blocks, similar to synchronous code.

### Try/Catch Blocks

```javascript
async function fetchUserWithErrorHandling(userId) {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error.message);
    throw error; // Re-throw if needed
  }
}
```

### Multiple Error Types

```javascript
async function complexOperation() {
  try {
    const data = await fetchData();
    const processed = await processData(data);
    const saved = await saveData(processed);
    return saved;
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('Network error:', error.message);
      // Retry logic
    } else if (error instanceof ValidationError) {
      console.error('Validation error:', error.message);
      // Handle validation
    } else {
      console.error('Unexpected error:', error);
      // Generic error handling
    }
    throw error;
  }
}
```

### Finally Block

```javascript
async function fetchWithCleanup() {
  const connection = await openConnection();

  try {
    const data = await connection.fetchData();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  } finally {
    // Always executed, even if error occurs
    await connection.close();
    console.log('Connection closed');
  }
}
```

### Error Handling without Try/Catch

```javascript
async function fetchData() {
  const result = await fetch('https://api.example.com/data')
    .catch(error => {
      console.error('Fetch failed:', error);
      return null; // Return default value
    });

  return result;
}

// Or using Promise methods
async function getData() {
  const data = await someAsyncOperation();
  return data;
}

getData()
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

## Concurrent Execution

When operations don't depend on each other, you can execute them concurrently for better performance.

### Promise.all() - Wait for All

```javascript
async function fetchAllUsers() {
  try {
    // All requests start simultaneously
    const [users, posts, comments] = await Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/posts').then(r => r.json()),
      fetch('/api/comments').then(r => r.json())
    ]);

    return { users, posts, comments };
  } catch (error) {
    // If any promise rejects, Promise.all rejects
    console.error('One or more requests failed:', error);
    throw error;
  }
}
```

### Promise.allSettled() - Wait for All (Success or Failure)

```javascript
async function fetchMultipleSources() {
  const results = await Promise.allSettled([
    fetch('/api/source1').then(r => r.json()),
    fetch('/api/source2').then(r => r.json()),
    fetch('/api/source3').then(r => r.json())
  ]);

  const successful = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  const failed = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);

  console.log(`Successful: ${successful.length}, Failed: ${failed.length}`);

  return successful;
}
```

### Promise.race() - First to Complete

```javascript
async function fetchWithTimeout(url, timeout = 5000) {
  const fetchPromise = fetch(url).then(r => r.json());

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });

  try {
    const result = await Promise.race([fetchPromise, timeoutPromise]);
    return result;
  } catch (error) {
    console.error('Request failed or timed out:', error);
    throw error;
  }
}
```

### Promise.any() - First to Succeed

```javascript
async function fetchFromMultipleServers(urls) {
  try {
    // Returns the first successful response
    const data = await Promise.any(
      urls.map(url => fetch(url).then(r => r.json()))
    );
    return data;
  } catch (error) {
    // All promises rejected
    console.error('All servers failed:', error);
    throw error;
  }
}

// Usage
const servers = [
  'https://server1.example.com/api/data',
  'https://server2.example.com/api/data',
  'https://server3.example.com/api/data'
];

fetchFromMultipleServers(servers);
```

### Parallel vs Sequential Execution

```javascript
// Sequential (slower - total time: 3 seconds)
async function sequentialFetch() {
  const user = await fetchUser();      // 1 second
  const posts = await fetchPosts();    // 1 second
  const comments = await fetchComments(); // 1 second
  return { user, posts, comments };
}

// Parallel (faster - total time: 1 second)
async function parallelFetch() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),      // All start simultaneously
    fetchPosts(),
    fetchComments()
  ]);
  return { user, posts, comments };
}
```

## Top-Level await

Modern JavaScript (ES2022+) supports await at the top level of modules, outside of async functions.

### Module-Level Usage

```javascript
// data-loader.js
const data = await fetch('https://api.example.com/config.json')
  .then(r => r.json());

export const config = data;

// Other modules can import this
// import { config } from './data-loader.js';
```

### Dynamic Imports

```javascript
// Conditional module loading
const language = navigator.language;

const translations = await import(`./i18n/${language}.js`)
  .catch(() => import('./i18n/en.js')); // Fallback to English

export default translations;
```

### Loading Dependencies

```javascript
// Load multiple resources before module initialization
const [database, cache, logger] = await Promise.all([
  import('./database.js'),
  import('./cache.js'),
  import('./logger.js')
]);

await database.connect();
await cache.initialize();
logger.info('Application initialized');

export { database, cache, logger };
```

### Fallback Pattern

```javascript
// Try different CDNs
let library;

try {
  library = await import('https://cdn1.example.com/library.js');
} catch {
  try {
    library = await import('https://cdn2.example.com/library.js');
  } catch {
    library = await import('./local-fallback.js');
  }
}

export default library;
```

## Common Patterns and Best Practices

### Retry Logic

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;
      if (isLastAttempt) throw error;

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Batch Processing

```javascript
async function processBatch(items, batchSize = 10) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
    console.log(`Processed ${Math.min(i + batchSize, items.length)}/${items.length}`);
  }

  return results;
}

async function processItem(item) {
  // Process individual item
  return await fetch(`/api/process`, {
    method: 'POST',
    body: JSON.stringify(item)
  }).then(r => r.json());
}
```

### Rate Limiting

```javascript
async function rateLimit(fn, maxConcurrent = 3) {
  const queue = [];
  let active = 0;

  return async function(...args) {
    while (active >= maxConcurrent) {
      await new Promise(resolve => queue.push(resolve));
    }

    active++;
    try {
      return await fn(...args);
    } finally {
      active--;
      const resolve = queue.shift();
      if (resolve) resolve();
    }
  };
}

// Usage
const limitedFetch = rateLimit(fetch, 3);

const urls = Array.from({ length: 20 }, (_, i) => `/api/item/${i}`);
const results = await Promise.all(urls.map(url => limitedFetch(url)));
```

### Async Iteration

```javascript
async function* asyncGenerator() {
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield i;
  }
}

async function consumeAsyncGenerator() {
  for await (const value of asyncGenerator()) {
    console.log(value); // 0, 1, 2, 3, 4 (one per second)
  }
}
```

### Memoization

```javascript
function asyncMemoize(fn) {
  const cache = new Map();

  return async function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = await fn(...args);
    cache.set(key, result);
    return result;
  };
}

const cachedFetch = asyncMemoize(async (url) => {
  const response = await fetch(url);
  return response.json();
});

// First call: fetches from network
await cachedFetch('/api/user/1');

// Second call: returns cached result
await cachedFetch('/api/user/1');
```

## Common Pitfalls and How to Avoid Them

### Forgetting await

```javascript
// Wrong - returns a Promise, not the value
async function wrongExample() {
  const data = fetchData(); // Missing await!
  console.log(data); // Promise { <pending> }
  return data;
}

// Correct
async function correctExample() {
  const data = await fetchData();
  console.log(data); // Actual data
  return data;
}
```

### Using await in Loops (Performance Issue)

```javascript
// Slow - sequential execution
async function slowExample(ids) {
  const results = [];
  for (const id of ids) {
    const result = await fetchUser(id); // Waits for each
    results.push(result);
  }
  return results;
}

// Fast - parallel execution
async function fastExample(ids) {
  const promises = ids.map(id => fetchUser(id));
  const results = await Promise.all(promises);
  return results;
}
```

### Not Handling Rejections

```javascript
// Dangerous - unhandled promise rejection
async function riskyFunction() {
  await mightFail(); // If this throws, error propagates
}

// Safe - proper error handling
async function safeFunction() {
  try {
    await mightFail();
  } catch (error) {
    console.error('Error handled:', error);
  }
}

// Also safe - handle at call site
safeFunction().catch(error => {
  console.error('Caught at call site:', error);
});
```

### Mixing async/await with .then()

```javascript
// Inconsistent - mixed styles
async function mixedStyle() {
  const data = await fetchData();
  return processData(data).then(result => {
    return result;
  });
}

// Better - consistent async/await
async function consistentStyle() {
  const data = await fetchData();
  const result = await processData(data);
  return result;
}
```

## Real-World Examples

### API Request with Authentication

```javascript
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = null;
  }

  async authenticate(username, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const { token } = await response.json();
    this.token = token;
    return token;
  }

  async request(endpoint, options = {}) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  }

  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
  }
}

// Usage
const api = new APIClient('https://api.example.com');
await api.authenticate('user', 'password');
const users = await api.getUsers();
```

### File Upload with Progress

```javascript
async function uploadFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });

    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

// Usage
async function handleFileUpload(file) {
  try {
    const result = await uploadFileWithProgress(file, (progress) => {
      console.log(`Upload progress: ${progress.toFixed(2)}%`);
    });
    console.log('Upload complete:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### Database Operations

```javascript
class Database {
  async transaction(callback) {
    await this.beginTransaction();

    try {
      const result = await callback();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  async createUser(userData) {
    return this.transaction(async () => {
      // Insert user
      const user = await this.query(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        [userData.name, userData.email]
      );

      // Create associated profile
      await this.query(
        'INSERT INTO profiles (user_id, bio) VALUES (?, ?)',
        [user.id, userData.bio || '']
      );

      // Create initial settings
      await this.query(
        'INSERT INTO settings (user_id) VALUES (?)',
        [user.id]
      );

      return user;
    });
  }
}
```

## Summary

Async/await provides a powerful and readable way to handle asynchronous operations in JavaScript:

- **async** functions always return Promises
- **await** pauses execution until a Promise resolves
- Error handling uses familiar try/catch blocks
- Concurrent execution improves performance with Promise.all, Promise.race, etc.
- Top-level await enables module-level async operations
- Proper error handling and performance optimization are essential

By mastering async/await, you can write cleaner, more maintainable asynchronous code that's easier to understand and debug.
