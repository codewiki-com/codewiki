---
title: JavaScript Async Programming Guide
description: Master async JavaScript from callbacks to async/await
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - Async
  - Promise
  - async/await
status: imported
origin: old/src/content/docs/frontend/async-javascript.en.md
divergence: 0.19
issues: []
legacy:
  category: Frontend
  subcategory: JavaScript
  order: 8
  lastUpdated: 2026-01-07
---

## Synchronous vs Asynchronous Programming

### What is Synchronous Programming

Synchronous programming means code executes in the order it is written, with each line waiting for the previous line to complete before executing. This execution model is simple and intuitive, but causes program blocking when handling time-consuming operations.

```javascript
// Synchronous code example
console.log('Start');
const result = calculateSum(1000000); // Assume this is a time-consuming calculation
console.log('Result:', result);
console.log('End');

// Output order: Start -> Result -> End
```

### What is Asynchronous Programming

Asynchronous programming allows the program to continue executing other code while waiting for an operation to complete. When the asynchronous operation finishes, the result is handled through callbacks, Promises, or async/await.

```javascript
// Asynchronous code example
console.log('Start');

setTimeout(() => {
  console.log('Async operation complete');
}, 1000);

console.log('End');

// Output order: Start -> End -> Async operation complete
```

### Why We Need Asynchronous Programming

JavaScript is a single-threaded language. If all operations were synchronous, the entire program would block during network requests, file reads, and other time-consuming operations, making the user interface unresponsive. Asynchronous programming solves this problem:

```javascript
// If fetch were synchronous (hypothetical scenario)
const data = fetch('/api/users'); // Network request might take several seconds
// During those seconds, users cannot interact with the page

// Actual asynchronous fetch
fetch('/api/users')
  .then(response => response.json())
  .then(data => console.log(data));
// Users can continue interacting with the page
```

## Callbacks and Callback Hell

### Callback Basics

Callback functions are the earliest way to handle asynchronous operations in JavaScript. A callback is a function passed as an argument to another function, which is called when the asynchronous operation completes.

```javascript
// Basic callback example
function fetchData(callback) {
  setTimeout(() => {
    const data = { id: 1, name: 'John' };
    callback(data);
  }, 1000);
}

fetchData((data) => {
  console.log('Data received:', data);
});
```

### Error-First Callbacks

Node.js style callbacks use the convention of passing errors as the first argument:

```javascript
function readFile(path, callback) {
  setTimeout(() => {
    if (path === '') {
      callback(new Error('Path cannot be empty'), null);
    } else {
      callback(null, 'File contents');
    }
  }, 1000);
}

readFile('data.txt', (error, data) => {
  if (error) {
    console.error('Read failed:', error.message);
    return;
  }
  console.log('Read successful:', data);
});
```

### Callback Hell

When multiple asynchronous operations need to execute sequentially, callbacks become deeply nested, forming what is known as "Callback Hell":

```javascript
// Callback hell example
getUser(userId, (error, user) => {
  if (error) {
    handleError(error);
    return;
  }
  getOrders(user.id, (error, orders) => {
    if (error) {
      handleError(error);
      return;
    }
    getOrderDetails(orders[0].id, (error, details) => {
      if (error) {
        handleError(error);
        return;
      }
      getProductInfo(details.productId, (error, product) => {
        if (error) {
          handleError(error);
          return;
        }
        console.log('Product info:', product);
      });
    });
  });
});
```

This code has several serious problems:

1. **Poor readability**: Code keeps indenting to the right, making it hard to read
2. **Difficult to maintain**: Modifying intermediate logic requires careful handling of nested relationships
3. **Complex error handling**: Each level needs its own error handling
4. **Hard to reuse**: Logic is tightly coupled, making it difficult to extract and reuse

## Promise Deep Dive

### The Promise Concept

Promise is an asynchronous programming solution introduced in ES6 that represents the eventual completion or failure of an asynchronous operation and its result value. Promises make asynchronous code clearer to write and understand.

```javascript
// Creating a Promise
const promise = new Promise((resolve, reject) => {
  // Asynchronous operation
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve('Operation successful');
    } else {
      reject(new Error('Operation failed'));
    }
  }, 1000);
});
```

### The Three States of a Promise

A Promise has exactly three states:

1. **Pending**: Initial state, neither fulfilled nor rejected
2. **Fulfilled**: Operation completed successfully
3. **Rejected**: Operation failed

```javascript
// State transition examples
const pendingPromise = new Promise(() => {});
console.log(pendingPromise); // Promise { <pending> }

const fulfilledPromise = Promise.resolve('Success');
console.log(fulfilledPromise); // Promise { 'Success' }

const rejectedPromise = Promise.reject(new Error('Failed'));
console.log(rejectedPromise); // Promise { <rejected> Error: Failed }
```

Important rules for state transitions:

- State can only transition from Pending to either Fulfilled or Rejected
- Once the state changes, it cannot change again
- After the state changes, the Promise value is also fixed

### Chaining Promises

One of the core advantages of Promises is support for chaining, which solves the callback hell problem:

```javascript
// Rewriting callback hell with Promises
getUser(userId)
  .then(user => getOrders(user.id))
  .then(orders => getOrderDetails(orders[0].id))
  .then(details => getProductInfo(details.productId))
  .then(product => {
    console.log('Product info:', product);
  })
  .catch(error => {
    console.error('An error occurred:', error);
  });
```

### The then, catch, and finally Methods

```javascript
// then method - handles success and failure
promise.then(
  value => console.log('Success:', value),
  error => console.log('Failure:', error)
);

// catch method - specifically handles failures
promise
  .then(value => console.log('Success:', value))
  .catch(error => console.log('Failure:', error));

// finally method - executes regardless of success or failure
promise
  .then(value => console.log('Success:', value))
  .catch(error => console.log('Failure:', error))
  .finally(() => console.log('Cleanup work'));
```

### Value Passing and Pass-Through

```javascript
// Return values from then are wrapped in a Promise
Promise.resolve(1)
  .then(value => value + 1)
  .then(value => value * 2)
  .then(value => console.log(value)); // 4

// Returning a Promise from then waits for it to complete
Promise.resolve(1)
  .then(value => {
    return new Promise(resolve => {
      setTimeout(() => resolve(value + 1), 1000);
    });
  })
  .then(value => console.log(value)); // Outputs 2 after 1 second

// Value pass-through - if then's argument is not a function
Promise.resolve('Pass-through value')
  .then(null)
  .then(value => console.log(value)); // 'Pass-through value'
```

## Promise Static Methods

### Promise.all

`Promise.all` takes an array of Promises and returns a results array when all Promises succeed. If any Promise fails, the entire operation fails:

```javascript
// Concurrent API requests
const promises = [
  fetch('/api/users').then(r => r.json()),
  fetch('/api/products').then(r => r.json()),
  fetch('/api/orders').then(r => r.json())
];

Promise.all(promises)
  .then(([users, products, orders]) => {
    console.log('Users:', users);
    console.log('Products:', products);
    console.log('Orders:', orders);
  })
  .catch(error => {
    console.error('At least one request failed:', error);
  });

// Practical application: batch file upload
async function uploadFiles(files) {
  const uploadPromises = files.map(file => uploadFile(file));
  const results = await Promise.all(uploadPromises);
  console.log('All files uploaded:', results);
}
```

### Promise.race

`Promise.race` returns the result of the first Promise to complete (whether success or failure):

```javascript
// Implementing request timeout
function fetchWithTimeout(url, timeout = 5000) {
  const fetchPromise = fetch(url);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

fetchWithTimeout('/api/data', 3000)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error.message));

// Getting data from multiple sources, using the fastest response
const sources = [
  fetch('https://api1.example.com/data'),
  fetch('https://api2.example.com/data'),
  fetch('https://api3.example.com/data')
];

Promise.race(sources)
  .then(response => console.log('Fastest response from:', response.url));
```

### Promise.allSettled

`Promise.allSettled` waits for all Promises to complete, regardless of success or failure, and returns the status and result of each:

```javascript
const promises = [
  Promise.resolve('Success 1'),
  Promise.reject(new Error('Failure 1')),
  Promise.resolve('Success 2'),
  Promise.reject(new Error('Failure 2'))
];

Promise.allSettled(promises).then(results => {
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Promise ${index}: Success - ${result.value}`);
    } else {
      console.log(`Promise ${index}: Failed - ${result.reason.message}`);
    }
  });
});

// Output:
// Promise 0: Success - Success 1
// Promise 1: Failed - Failure 1
// Promise 2: Success - Success 2
// Promise 3: Failed - Failure 2

// Practical application: batch processing with result statistics
async function batchProcess(items) {
  const results = await Promise.allSettled(
    items.map(item => processItem(item))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  console.log(`Succeeded: ${succeeded.length}, Failed: ${failed.length}`);
  return { succeeded, failed };
}
```

### Promise.any

`Promise.any` returns the first successful Promise. It only fails when all Promises fail:

```javascript
// Getting data from multiple sources, only one needs to succeed
const promises = [
  fetch('https://primary-api.com/data').then(r => r.json()),
  fetch('https://backup-api.com/data').then(r => r.json()),
  fetch('https://fallback-api.com/data').then(r => r.json())
];

Promise.any(promises)
  .then(data => {
    console.log('Data received:', data);
  })
  .catch(error => {
    // AggregateError contains all failure reasons
    console.error('All requests failed:', error.errors);
  });

// Practical application: CDN resource loading
function loadScript(urls) {
  const loadPromises = urls.map(url => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve(url);
      script.onerror = () => reject(new Error(`Load failed: ${url}`));
      document.head.appendChild(script);
    });
  });

  return Promise.any(loadPromises);
}
```

## async/await Syntax

### Basic Syntax

`async/await` is syntactic sugar introduced in ES2017 that makes asynchronous code look like synchronous code:

```javascript
// async function declaration
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data;
}

// async arrow function
const fetchUserData = async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data;
};

// async method
const user = {
  async getData() {
    const response = await fetch('/api/user');
    return response.json();
  }
};

// async class method
class UserService {
  async getUser(id) {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }
}
```

### The Nature of async/await

An `async` function always returns a Promise, and `await` pauses function execution until the Promise completes:

```javascript
// async function returns Promise
async function example() {
  return 'Result';
}
example().then(result => console.log(result)); // 'Result'

// Equivalent to
function example() {
  return Promise.resolve('Result');
}

// await waits for Promise to complete
async function demo() {
  console.log('Start');
  const result = await Promise.resolve('Async result');
  console.log('Result:', result);
  console.log('End');
}

// await on non-Promise value returns immediately
async function demo2() {
  const value = await 42;
  console.log(value); // 42
}
```

### Sequential vs Parallel Execution

```javascript
// Sequential execution (takes longer)
async function sequential() {
  const user = await fetchUser();      // Wait for completion
  const posts = await fetchPosts();    // Then wait for completion
  const comments = await fetchComments(); // Then wait for completion
  return { user, posts, comments };
}

// Parallel execution (recommended approach)
async function parallel() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments()
  ]);
  return { user, posts, comments };
}

// Partial parallel (when there are dependencies)
async function partialParallel() {
  const user = await fetchUser();
  // After getting user, fetch posts and comments in parallel
  const [posts, comments] = await Promise.all([
    fetchPosts(user.id),
    fetchComments(user.id)
  ]);
  return { user, posts, comments };
}
```

### async/await in Loops

```javascript
// for...of loop - sequential execution
async function processSequentially(items) {
  const results = [];
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  return results;
}

// map + Promise.all - parallel execution
async function processInParallel(items) {
  const results = await Promise.all(
    items.map(item => processItem(item))
  );
  return results;
}

// Warning: forEach does not handle async/await correctly
async function wrongWay(items) {
  items.forEach(async (item) => {
    await processItem(item); // These won't wait as expected
  });
  console.log('Done'); // Will print before all processing is complete
}
```

## Error Handling Strategies

### try/catch Handling

```javascript
// Basic try/catch
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error.message);
    throw error; // Optional: rethrow
  }
}

// Error handling with multiple awaits
async function complexOperation() {
  try {
    const user = await fetchUser();
    const profile = await fetchProfile(user.id);
    const settings = await fetchSettings(user.id);
    return { user, profile, settings };
  } catch (error) {
    // Handle errors from any step
    console.error('Operation failed:', error);
    return null;
  }
}
```

### Handling Each Promise Individually

```javascript
// Using .catch() to provide default values for each Promise
async function fetchWithDefaults() {
  const user = await fetchUser().catch(() => ({ name: 'Guest' }));
  const posts = await fetchPosts().catch(() => []);
  const comments = await fetchComments().catch(() => []);

  return { user, posts, comments };
}

// Encapsulating safe await
async function safeAwait(promise) {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error, null];
  }
}

// Using the wrapper function
async function example() {
  const [error, data] = await safeAwait(fetchData());
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Data:', data);
}
```

### Global Error Handling

```javascript
// Listen for unhandled Promise rejections (browser)
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled Promise rejection:', event.reason);
  // Report error to monitoring system
  reportError(event.reason);
  // Prevent default behavior (console error)
  event.preventDefault();
});

// Node.js environment
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise rejection:', reason);
});
```

### Retry Mechanism

```javascript
// Request function with retry
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} retries: ${lastError.message}`);
}

// Usage
try {
  const data = await fetchWithRetry('/api/data');
  console.log('Successfully fetched data:', data);
} catch (error) {
  console.error('Final failure:', error.message);
}
```

## Concurrency Control

### Limiting Concurrent Tasks

When processing many async tasks, starting all of them at once can exhaust resources. We need to limit concurrency:

```javascript
// Simple concurrency controller
class ConcurrencyController {
  constructor(maxConcurrency = 5) {
    this.maxConcurrency = maxConcurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(task) {
    if (this.running >= this.maxConcurrency) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    }
  }
}

// Usage example
const controller = new ConcurrencyController(3);
const urls = ['url1', 'url2', 'url3', 'url4', 'url5', 'url6'];

const results = await Promise.all(
  urls.map(url => controller.add(() => fetch(url)))
);
```

### p-limit Style Implementation

```javascript
// More concise concurrency limiting function
function pLimit(concurrency) {
  const queue = [];
  let active = 0;

  const next = () => {
    if (queue.length > 0 && active < concurrency) {
      active++;
      const { fn, resolve, reject } = queue.shift();
      fn().then(resolve).catch(reject).finally(() => {
        active--;
        next();
      });
    }
  };

  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
}

// Usage
const limit = pLimit(2);
const tasks = [
  () => fetchData(1),
  () => fetchData(2),
  () => fetchData(3),
  () => fetchData(4)
];

const results = await Promise.all(tasks.map(task => limit(task)));
```

### Batch Processing

```javascript
// Processing large amounts of data in batches
async function processBatch(items, batchSize = 10, processor) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    console.log(`Processed ${Math.min(i + batchSize, items.length)}/${items.length}`);
  }

  return results;
}

// Usage
const userIds = Array.from({ length: 100 }, (_, i) => i + 1);
const users = await processBatch(userIds, 10, fetchUser);
```

## Common Async Patterns

### Debouncing

```javascript
// Debounce function - useful for search inputs
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Debounce with Promise support
function debounceAsync(fn, delay) {
  let timeoutId;
  let pendingPromise = null;

  return function(...args) {
    if (pendingPromise) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn.apply(this, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

// Usage example
const debouncedSearch = debounce(async (query) => {
  const response = await fetch(`/api/search?q=${query}`);
  return response.json();
}, 300);
```

### Throttling

```javascript
// Throttle function - useful for scroll events
function throttle(fn, interval) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      return fn.apply(this, args);
    }
  };
}

// Throttle with async support
function throttleAsync(fn, interval) {
  let lastTime = 0;
  let pending = false;

  return async function(...args) {
    const now = Date.now();
    if (pending) return;

    if (now - lastTime >= interval) {
      lastTime = now;
      pending = true;
      try {
        return await fn.apply(this, args);
      } finally {
        pending = false;
      }
    }
  };
}
```

### Canceling Requests

```javascript
// Using AbortController to cancel fetch requests
function createCancelableRequest(url) {
  const controller = new AbortController();

  const request = fetch(url, { signal: controller.signal })
    .then(response => response.json())
    .catch(error => {
      if (error.name === 'AbortError') {
        console.log('Request was canceled');
        return null;
      }
      throw error;
    });

  return {
    request,
    cancel: () => controller.abort()
  };
}

// Usage example
const { request, cancel } = createCancelableRequest('/api/data');

// Cancel request after 3 seconds
setTimeout(cancel, 3000);

const data = await request;

// Creating a cancelable async function wrapper
function makeCancelable(asyncFn) {
  let controller;

  const wrappedFn = async (...args) => {
    controller = new AbortController();
    return asyncFn(...args, controller.signal);
  };

  wrappedFn.cancel = () => controller?.abort();

  return wrappedFn;
}
```

### Polling

```javascript
// Basic polling
async function poll(fn, interval, maxAttempts = Infinity) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const result = await fn();
      if (result.done) {
        return result.data;
      }
    } catch (error) {
      console.error('Polling error:', error);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Polling exceeded maximum attempts');
}

// Cancelable polling
function createPolling(fn, interval) {
  let isRunning = true;

  const polling = async () => {
    while (isRunning) {
      try {
        await fn();
      } catch (error) {
        console.error('Polling error:', error);
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  };

  return {
    start: () => {
      isRunning = true;
      polling();
    },
    stop: () => {
      isRunning = false;
    }
  };
}

// Usage
const { start, stop } = createPolling(async () => {
  const status = await checkStatus();
  if (status === 'complete') {
    stop();
  }
}, 2000);

start();
```

## Performance Considerations

### Avoiding Unnecessary await

```javascript
// Bad: unnecessary await
async function example() {
  const result = await doSomething();
  return await Promise.resolve(result); // Redundant await
}

// Good: return directly
async function example() {
  const result = await doSomething();
  return result;
}

// Better: if just forwarding
function example() {
  return doSomething();
}
```

### Using Parallel Execution Wisely

```javascript
// Performance comparison
async function sequential() {
  console.time('sequential');
  const a = await delay(1000);
  const b = await delay(1000);
  const c = await delay(1000);
  console.timeEnd('sequential'); // ~3000ms
}

async function parallel() {
  console.time('parallel');
  const [a, b, c] = await Promise.all([
    delay(1000),
    delay(1000),
    delay(1000)
  ]);
  console.timeEnd('parallel'); // ~1000ms
}
```

### Memory Considerations

```javascript
// Bad: creating many Promises at once
async function bad(items) {
  // If items has 10000 elements, creates 10000 Promises simultaneously
  const results = await Promise.all(
    items.map(item => process(item))
  );
  return results;
}

// Good: batch processing
async function good(items) {
  const results = [];
  const batchSize = 100;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => process(item))
    );
    results.push(...batchResults);
  }

  return results;
}
```

### Caching Async Results

```javascript
// Simple async cache
function createAsyncCache(fn, ttl = 60000) {
  const cache = new Map();

  return async function(key, ...args) {
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const value = await fn(key, ...args);
    cache.set(key, { value, timestamp: Date.now() });
    return value;
  };
}

// Usage
const cachedFetch = createAsyncCache(async (url) => {
  const response = await fetch(url);
  return response.json();
}, 5000);

const data1 = await cachedFetch('/api/data'); // Actual request
const data2 = await cachedFetch('/api/data'); // Returns from cache
```

## Interview Key Points

### Common Interview Questions

#### Promise Execution Order

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// Output order: 1, 4, 3, 2
// Explanation: Synchronous code first (1, 4), then microtasks (3), then macrotasks (2)
```

#### Implement Promise.all

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError('Argument must be an array'));
    }

    const results = [];
    let completed = 0;
    const total = promises.length;

    if (total === 0) {
      return resolve([]);
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;
          completed++;
          if (completed === total) {
            resolve(results);
          }
        })
        .catch(reject);
    });
  });
}
```

#### Implement Promise.race

```javascript
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError('Argument must be an array'));
    }

    promises.forEach(promise => {
      Promise.resolve(promise).then(resolve).catch(reject);
    });
  });
}
```

#### The Relationship Between async/await and Promise

```javascript
// async function always returns Promise
async function foo() {
  return 1;
}
// Equivalent to
function foo() {
  return Promise.resolve(1);
}

// await pauses async function execution
async function bar() {
  const result = await Promise.resolve(2);
  return result;
}
// Similar to
function bar() {
  return Promise.resolve(2).then(result => result);
}
```

#### How to Make Promises Execute Sequentially

```javascript
// Method 1: for...of loop
async function serial(tasks) {
  const results = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

// Method 2: reduce
function serial(tasks) {
  return tasks.reduce(
    (promise, task) => promise.then(results =>
      task().then(result => [...results, result])
    ),
    Promise.resolve([])
  );
}
```

### Key Concepts Summary

1. **Promise three states**: pending, fulfilled, rejected - state changes are irreversible
2. **Microtasks vs Macrotasks**: Promise callbacks are microtasks, setTimeout is a macrotask
3. **The nature of async/await**: Syntactic sugar built on top of Promises
4. **Error handling**: try/catch or .catch(), always handle unhandled rejections
5. **Concurrency control**: Use Promise.all wisely, implement rate limiting, batch processing
6. **Cancellation mechanism**: AbortController can cancel fetch requests

### Best Practices

1. Prefer async/await over then chains
2. Independent async operations should execute in parallel
3. Always handle Promise errors
4. Avoid using await in loops (unless sequential execution is required)
5. Use Promise.allSettled for scenarios where partial failure is acceptable
6. Limit concurrency when making many concurrent requests
7. Consider request timeout and retry mechanisms

## Summary

JavaScript async programming has evolved from callbacks to Promises to async/await, with each iteration making async code clearer and easier to maintain. With these concepts and patterns, you can write efficient, robust async code.

Key takeaways:

- Understand the difference between sync and async, and why we need async programming
- Be proficient with Promises and their static methods
- Master async/await syntax and its relationship with Promises
- Focus on error handling to ensure program robustness
- Control concurrency appropriately to avoid resource exhaustion
- Know common async patterns like debounce, throttle, polling, etc.

Through continuous practice and reflection, you will be able to elegantly handle various async scenarios in your applications.
