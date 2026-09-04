---
title: JavaScript Promise Methods
description: Master Promise.all, Promise.race, Promise.allSettled, and Promise.any - key static methods for handling multiple concurrent promises
track: javascript
section: async
difficulty: intermediate
tags:
  - JavaScript
  - Promise
  - async
  - concurrency
  - Promise.all
  - Promise.race
  - Promise.allSettled
  - Promise.any
status: imported
origin: old/src/content/docs/javascript/promise-methods.en.md
divergence: 0.098
issues:
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: Async Programming
  order: 7
  lastUpdated: 2026-01-07
---

JavaScript provides several powerful static methods on the Promise object to handle multiple concurrent promises. These methods are essential for managing asynchronous operations efficiently. We'll cover Promise.all, Promise.race, Promise.allSettled, and Promise.any in depth.

## Concept Introduction

Promise methods are static functions that accept an iterable of promises and return a single promise based on specific resolution logic. They enable you to:

- **Combine multiple promises** into a single operation
- **Handle different scenarios** (all succeed, any succeeds, or wait for completion)
- **Optimize concurrent operations** by coordinating multiple async tasks
- **Implement complex control flow** patterns with multiple promises

These methods are foundational for modern JavaScript async programming and are widely used in API calls, batch processing, and concurrent task management.

## Core Principles

### Promise Composition
Promise methods enable composition of multiple promises into a higher-level construct that represents the combined outcome of all input promises. This follows functional programming principles and allows for clear, expressive code.

### Short-Circuit Behavior
Some promise methods implement short-circuit behavior:
- **Promise.all()** rejects immediately when any promise rejects (fail-fast)
- **Promise.race()** resolves/rejects immediately with the first settled promise
- **Promise.allSettled()** waits for all promises to settle (no short-circuiting)
- **Promise.any()** rejects only after all promises reject (optimistic)

### Iterable Processing
All promise methods accept iterables (arrays, Sets, Maps, generators, etc.) and process them concurrently. The order of results matches the input order, not the completion order.

## Key Points

- **Promise.all()**: Waits for all promises to resolve; rejects if any promise rejects
- **Promise.race()**: Returns the result of the first promise to settle (resolve or reject)
- **Promise.allSettled()**: Waits for all promises to settle; returns results with status (fulfilled/rejected)
- **Promise.any()**: Returns the first fulfilled promise; rejects only if all promises reject
- All methods accept any iterable of promises (arrays, Sets, generators, etc.)
- Results maintain input order, even if promises complete out of order
- If the iterable is empty, behavior varies: all() returns fulfilled empty array, race() hangs, allSettled() returns empty array, any() rejects
- Promise methods execute promises concurrently, not sequentially
- All methods return new promises that cannot be cancelled

## Code Examples

### Promise.all() - All or Nothing

Promise.all() waits for all promises to resolve or rejects immediately if any promise rejects.

```javascript
// Basic example
const promise1 = Promise.resolve(3);
const promise2 = new Promise(resolve => setTimeout(() => resolve('foo'), 100));
const promise3 = fetch('/api/data').then(r => r.json());

Promise.all([promise1, promise2, promise3])
  .then(([result1, result2, result3]) => {
    console.log('All resolved:', result1, result2, result3);
  })
  .catch(error => {
    console.error('One promise rejected:', error);
  });
```

```javascript
// Practical API example - fetch multiple resources
async function fetchUserWithDetails(userId) {
  try {
    const [user, posts, comments] = await Promise.all([
      fetch(`/api/users/${userId}`).then(r => r.json()),
      fetch(`/api/posts?userId=${userId}`).then(r => r.json()),
      fetch(`/api/comments?userId=${userId}`).then(r => r.json())
    ]);

    return { user, posts, comments };
  } catch (error) {
    console.error('Failed to fetch user details:', error);
    throw error;
  }
}
```

```javascript
// Promise.all with array of operations
const operations = [1, 2, 3, 4, 5].map(id =>
  fetch(`/api/item/${id}`).then(r => r.json())
);

Promise.all(operations)
  .then(results => {
    console.log('All items fetched:', results);
  })
  .catch(error => {
    console.error('Failed to fetch one or more items:', error);
  });
```

```javascript
// Example showing rejection
const example = Promise.all([
  Promise.resolve(1),
  Promise.reject('Error!'),
  Promise.resolve(3)
]);

example.catch(error => {
  console.error(error); // "Error!"
  // Promise.all stops immediately after the first rejection
});
```

### Promise.race() - First to Finish

Promise.race() returns as soon as the first promise settles.

```javascript
// Timeout example
function fetchWithTimeout(url, timeout = 5000) {
  const fetchPromise = fetch(url).then(r => r.json());

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), timeout)
  );

  return Promise.race([fetchPromise, timeoutPromise]);
}

// Usage
fetchWithTimeout('/api/data', 3000)
  .then(data => console.log('Data received:', data))
  .catch(error => console.error('Error or timeout:', error));
```

```javascript
// Competitive request - use whichever responds first
function fetchFromFastestServer(urls) {
  const promises = urls.map(url => fetch(url).then(r => r.json()));
  return Promise.race(promises);
}

const fastestData = await fetchFromFastestServer([
  'https://server1.example.com/data',
  'https://server2.example.com/data',
  'https://server3.example.com/data'
]);
console.log('Got data from fastest server:', fastestData);
```

```javascript
// Conditional race - user cancellation
async function downloadWithCancel(url) {
  let cancelled = false;

  const cancelPromise = new Promise((_, reject) => {
    setTimeout(() => {
      if (cancelled) reject(new Error('Download cancelled'));
    }, 100);
  });

  const downloadPromise = fetch(url).then(r => r.blob());

  try {
    const result = await Promise.race([downloadPromise, cancelPromise]);
    return result;
  } catch (error) {
    console.error('Download failed:', error);
  }
}
```

```javascript
// Race between multiple operations
const winner = await Promise.race([
  fetchFromCache(key),
  fetchFromDatabase(key),
  fetchFromAPI(key)
]);
console.log('Got result from:', winner);
```

### Promise.allSettled() - Complete Overview

Promise.allSettled() waits for all promises to settle and returns their states.

```javascript
// Basic usage
const promises = [
  Promise.resolve('success'),
  Promise.reject('error'),
  Promise.resolve('another success')
];

Promise.allSettled(promises).then(results => {
  console.log(results);
  // [
  //   { status: 'fulfilled', value: 'success' },
  //   { status: 'rejected', reason: 'error' },
  //   { status: 'fulfilled', value: 'another success' }
  // ]
});
```

```javascript
// Batch API calls with individual error handling
async function batchFetchUsers(userIds) {
  const promises = userIds.map(id =>
    fetch(`/api/users/${id}`)
      .then(r => r.json())
      .catch(error => ({ error: error.message, userId: id }))
  );

  const results = await Promise.allSettled(promises);

  const succeeded = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (!result.value.error) {
        succeeded.push(result.value);
      } else {
        failed.push(result.value);
      }
    } else {
      failed.push({
        userId: userIds[index],
        error: result.reason
      });
    }
  });

  return { succeeded, failed };
}

const { succeeded, failed } = await batchFetchUsers([1, 2, 3, 4, 5]);
console.log('Successful fetches:', succeeded);
console.log('Failed fetches:', failed);
```

```javascript
// Filtering settled results
async function tryMultipleSources(sources) {
  const results = await Promise.allSettled(
    sources.map(source => fetchData(source))
  );

  const validData = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  return validData.length > 0
    ? validData
    : Promise.reject('All sources failed');
}
```

```javascript
// Compare with Promise.all
const data = [1, 2, 3, 4, 5];
const promises = data.map(n =>
  fetch(`/api/item/${n}`).then(r => r.json())
);

// Promise.all - fails if any rejects
try {
  const results = await Promise.all(promises);
  console.log('All results:', results);
} catch (error) {
  console.log('One failed, all lost');
}

// Promise.allSettled - returns all results regardless
const results = await Promise.allSettled(promises);
console.log('Complete results:', results);
```

### Promise.any() - Optimistic Approach

Promise.any() returns as soon as any promise fulfills, rejecting only if all reject.

```javascript
// Basic usage
const promises = [
  Promise.reject('Error 1'),
  Promise.reject('Error 2'),
  Promise.resolve('Success!')
];

Promise.any(promises)
  .then(value => console.log('First success:', value))
  .catch(error => console.log('All rejected:', error));
```

```javascript
// Try multiple APIs, use first successful response
async function fetchDataFromMultipleSources(urls) {
  const fetchPromises = urls.map(url =>
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
  );

  try {
    const data = await Promise.any(fetchPromises);
    console.log('Got data from a working source:', data);
    return data;
  } catch (error) {
    console.error('All sources failed:', error.errors);
    throw new Error('Could not fetch data from any source');
  }
}

const result = await fetchDataFromMultipleSources([
  'https://primary.api.com/data',
  'https://backup1.api.com/data',
  'https://backup2.api.com/data'
]);
```

```javascript
// Race between caching layers
async function getDataWithFallbacks() {
  const sources = [
    () => cacheService.get('key').then(v => {
      if (!v) throw new Error('Cache miss');
      return v;
    }),
    () => memoryStore.get('key').then(v => {
      if (!v) throw new Error('Not in memory');
      return v;
    }),
    () => fetchFromDatabase('key'),
    () => fetchFromAPI('key')
  ];

  try {
    const data = await Promise.any(sources.map(fn => fn()));
    console.log('Got data from first available source:', data);
    return data;
  } catch (error) {
    console.error('All data sources exhausted:', error);
    throw error;
  }
}
```

```javascript
// Promise.any vs Promise.race
// Promise.any - waits for first SUCCESS
const failures = [
  Promise.reject('Error 1'),
  Promise.reject('Error 2'),
  new Promise(resolve => setTimeout(() => resolve('Success'), 100))
];

Promise.any(failures).then(v => console.log('any:', v)); // "Success"

// Promise.race - returns first SETTLED (even if rejected)
Promise.race(failures).catch(e => console.log('race:', e)); // "Error 1"
```

```javascript
// Error handling with AggregateError
async function example() {
  const promises = [
    Promise.reject(new Error('Source 1 failed')),
    Promise.reject(new Error('Source 2 failed')),
    Promise.reject(new Error('Source 3 failed'))
  ];

  try {
    await Promise.any(promises);
  } catch (error) {
    // error is AggregateError
    console.log('Errors from all promises:');
    error.errors.forEach((err, index) => {
      console.log(`${index}: ${err.message}`);
    });
  }
}
```

## Best Practices

### Use Promise.all() for Critical Dependencies
Use Promise.all() when all promises must succeed and failure of any should stop execution:

```javascript
// Good: Critical operations that must all succeed
async function initializeApp() {
  try {
    const [config, auth, database] = await Promise.all([
      loadConfig(),
      authenticateUser(),
      connectDatabase()
    ]);

    return { config, auth, database };
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
}
```

### Use Promise.race() for Timeouts and Competitive Operations
Use Promise.race() when you need the fastest response or want to implement timeouts:

```javascript
// Good: Implement request timeout
function withTimeout(promise, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
  );

  return Promise.race([promise, timeoutPromise]);
}

const data = await withTimeout(
  fetch('/slow-api').then(r => r.json()),
  5000
);
```

### Use Promise.allSettled() for Partial Success Tolerance
Use Promise.allSettled() when some failures are acceptable and you need to process all results:

```javascript
// Good: Batch operations where partial success is okay
async function sendNotificationsToMultipleUsers(userIds, message) {
  const sendPromises = userIds.map(userId =>
    sendNotification(userId, message)
      .catch(error => ({ userId, error }))
  );

  const results = await Promise.allSettled(sendPromises);

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Notifications sent: ${successful} succeeded, ${failed} failed`);
}
```

### Use Promise.any() for Multiple Fallback Options
Use Promise.any() when you have multiple sources and need any working solution:

```javascript
// Good: Try multiple cache/data sources
async function getData(key) {
  const sources = [
    () => localCache.get(key),
    () => remoteCache.get(key),
    () => database.get(key)
  ];

  try {
    const value = await Promise.any(
      sources.map(source =>
        source().then(val => {
          if (!val) throw new Error('No data');
          return val;
        })
      )
    );
    return value;
  } catch (error) {
    throw new Error('Data not found in any source');
  }
}
```

### Avoid Common Anti-Patterns

```javascript
// Bad: Using .then() chains instead of Promise.all()
async function badApproach() {
  const user = await fetchUser();
  const posts = await fetchPosts(user.id);
  const comments = await fetchComments(user.id);
  return { user, posts, comments };
}

// Good: Concurrent execution
async function goodApproach(userId) {
  const [user, posts, comments] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchComments(userId)
  ]);
  return { user, posts, comments };
}
```

```javascript
// Bad: Not handling errors in Promise.allSettled()
Promise.allSettled(promises).then(results => {
  results.forEach(result => {
    console.log(result.value); // Crashes if status is 'rejected'
  });
});

// Good: Check status before accessing value
Promise.allSettled(promises).then(results => {
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      console.log('Success:', result.value);
    } else {
      console.log('Failed:', result.reason);
    }
  });
});
```

```javascript
// Bad: Empty iterable with Promise.race()
Promise.race([]).then(console.log); // Never settles!

// Good: Handle edge cases
function safeRace(promises) {
  if (promises.length === 0) {
    return Promise.reject(new Error('No promises provided'));
  }
  return Promise.race(promises);
}
```

## Common Pitfalls

### Pitfall 1: Confusing Promise.race() with Promise.any()

```javascript
// These behave differently with rejection
const promises = [
  Promise.reject('Error 1'),
  Promise.reject('Error 2'),
  new Promise(resolve => setTimeout(() => resolve('Late success'), 100))
];

// Promise.race returns immediately with first settled (rejecting immediately)
Promise.race(promises)
  .catch(e => console.log('race result:', e)); // "Error 1" immediately

// Promise.any waits for first fulfilled (ignores rejections)
Promise.any(promises)
  .then(v => console.log('any result:', v)); // "Late success" after 100ms
```

### Pitfall 2: Assuming Order Follows Completion Order

```javascript
// Results are in INPUT order, not completion order
const promises = [
  new Promise(resolve => setTimeout(() => resolve(3), 300)),
  new Promise(resolve => setTimeout(() => resolve(1), 100)),
  new Promise(resolve => setTimeout(() => resolve(2), 200))
];

Promise.all(promises).then(results => {
  console.log(results); // [3, 1, 2] - input order, not [1, 2, 3]
});
```

### Pitfall 3: Forgetting Promises Aren't Cancelled

```javascript
// Bad: Assuming Promise.race cancels the losing promises
const slowFetch = fetch('/slow-endpoint').then(r => r.json());
const quickResolve = Promise.resolve('cached');

Promise.race([slowFetch, quickResolve])
  .then(result => console.log(result)); // "cached"

// slowFetch still completes in the background!
// This can cause memory leaks with large operations
```

### Pitfall 4: Not Handling AggregateError from Promise.any()

```javascript
// Bad: Not handling the specific error type
Promise.any([
  Promise.reject('Error 1'),
  Promise.reject('Error 2')
]).catch(error => {
  console.log(error.errors); // TypeError: cannot read errors of Error
});

// Good: Check error type
Promise.any([
  Promise.reject('Error 1'),
  Promise.reject('Error 2')
]).catch(error => {
  if (error instanceof AggregateError) {
    console.log('All errors:', error.errors);
  } else {
    console.log('Other error:', error);
  }
});
```

### Pitfall 5: Improper Error Handling in Promise.allSettled()

```javascript
// Bad: Not properly filtering results
Promise.allSettled(promises).then(results => {
  const values = results.map(r => r.value); // Includes undefined for rejected!
});

// Good: Properly separate succeeded and failed
Promise.allSettled(promises).then(results => {
  const succeeded = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason);
});
```

### Pitfall 6: Creating Promises Inside Promise.all()

```javascript
// Bad: Creates promises one at a time
async function badBatch(items) {
  const results = await Promise.all(
    items.map(async (item) => {
      const dependency = await processPrevious();
      return process(item, dependency);
    })
  );
  return results;
}

// Good: Create all promises first, then wait
async function goodBatch(items) {
  const promises = items.map(item =>
    process(item)
  );
  return Promise.all(promises);
}
```

## Performance Considerations

### Concurrency vs. Sequential Execution

```javascript
// Concurrent (fast) - all requests start immediately
async function concurrent() {
  return Promise.all([
    fetch('/api/1'),
    fetch('/api/2'),
    fetch('/api/3')
  ]);
}
// Total time: max of individual requests (~1000ms)

// Sequential (slow) - each request waits for previous
async function sequential() {
  await fetch('/api/1');
  await fetch('/api/2');
  await fetch('/api/3');
}
// Total time: sum of all requests (~3000ms)
```

### Memory Implications with Large Promise Arrays

```javascript
// Bad: Creating huge arrays of promises in memory
async function loadMillionItems(ids) {
  // All promises created in memory at once
  const promises = ids.map(id => fetch(`/api/item/${id}`).then(r => r.json()));
  return Promise.all(promises); // Potential memory spike
}

// Good: Process in batches
async function loadItemsInBatches(ids, batchSize = 100) {
  const results = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(id => fetch(`/api/item/${id}`).then(r => r.json()))
    );
    results.push(...batchResults);
  }

  return results;
}
```

### Timeout Handling Performance

```javascript
// Efficient timeout with cleanup
function fetchWithTimeout(url, timeout = 5000) {
  let timeoutId;

  const promise = fetch(url).then(r => r.json());

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${timeout}ms`));
    }, timeout);
  });

  return Promise.race([promise, timeoutPromise])
    .finally(() => clearTimeout(timeoutId)); // Clean up timer
}
```

### Promise.allSettled() for Partial Failures

```javascript
// Promise.allSettled better for resilience
async function resilientBatch(items, operation) {
  const results = await Promise.allSettled(
    items.map(item => operation(item))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - succeeded;

  // Log metrics for monitoring
  console.log(`Batch complete: ${succeeded} succeeded, ${failed} failed`);

  return results;
}
```

## Real-world Scenarios

### Scenario 1: Multi-CDN Image Loading

```javascript
async function loadImageFromFastestCDN(imagePath) {
  const cdnUrls = [
    `https://cdn1.example.com/${imagePath}`,
    `https://cdn2.example.com/${imagePath}`,
    `https://cdn3.example.com/${imagePath}`
  ];

  const imagePromises = cdnUrls.map(url =>
    fetch(url).then(response => {
      if (!response.ok) throw new Error(`Failed from ${url}`);
      return response.blob();
    })
  );

  try {
    const imageBlob = await Promise.any(imagePromises);
    const imageUrl = URL.createObjectURL(imageBlob);
    return imageUrl;
  } catch (error) {
    console.error('All CDNs failed:', error);
    throw new Error('Could not load image from any CDN');
  }
}
```

### Scenario 2: Batch Database Operations

```javascript
async function upsertMultipleRecords(records) {
  const operations = records.map(record =>
    database.upsert(record.id, record.data)
      .catch(error => ({
        recordId: record.id,
        error: error.message
      }))
  );

  const results = await Promise.allSettled(operations);

  const successful = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (value && value.error) {
        failed.push(value);
      } else {
        successful.push(result.value);
      }
    } else {
      failed.push({
        recordId: records[index].id,
        error: result.reason.message
      });
    }
  });

  return {
    successful: successful.length,
    failed: failed.length,
    details: { successful, failed }
  };
}
```

### Scenario 3: Request Timeout Protection

```javascript
async function robustApiCall(endpoint, options = {}) {
  const timeout = options.timeout || 30000;
  const retries = options.retries || 3;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const fetchPromise = fetch(endpoint).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      );

      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      if (attempt === retries) throw error;

      const backoffMs = Math.pow(2, attempt) * 1000;
      console.log(`Attempt ${attempt} failed, retrying in ${backoffMs}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
}
```

### Scenario 4: Aggregating Data from Multiple Services

```javascript
async function getDashboardData(userId) {
  const services = {
    user: fetch(`/api/users/${userId}`).then(r => r.json()),
    analytics: fetch(`/api/analytics/${userId}`).then(r => r.json()),
    notifications: fetch(`/api/notifications/${userId}`).then(r => r.json()),
    preferences: fetch(`/api/preferences/${userId}`).then(r => r.json())
  };

  // Wait for all, but collect individual failures
  const results = await Promise.allSettled(
    Object.values(services)
  );

  const data = {};
  const keys = Object.keys(services);

  results.forEach((result, index) => {
    const key = keys[index];
    if (result.status === 'fulfilled') {
      data[key] = result.value;
    } else {
      data[key] = null;
      console.warn(`Failed to load ${key}:`, result.reason);
    }
  });

  return data;
}
```

### Scenario 5: Competitive Rate Limiting

```javascript
async function fetchWithRateLimit(items, rateLimit = 10) {
  const queue = [...items];
  const results = [];

  while (queue.length > 0) {
    const batch = queue.splice(0, rateLimit);
    const batchPromises = batch.map(item =>
      fetch(`/api/item/${item}`)
        .then(r => r.json())
        .catch(error => ({ error, itemId: item }))
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (queue.length > 0) {
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
```

## Interview Points

### Key Concepts to Know

1. **Differences Between Promise Methods**
   - Promise.all() vs Promise.allSettled() vs Promise.any() vs Promise.race()
   - When to use each method based on requirements
   - Behavior with empty iterables

2. **Error Handling**
   - How each method handles rejections
   - AggregateError from Promise.any()
   - Short-circuit behavior in Promise.all()

3. **Performance and Concurrency**
   - Why Promise.all() is better than sequential awaits
   - Memory implications of large promise arrays
   - Batch processing for scale

4. **Edge Cases**
   - Empty promise arrays
   - Mixed resolved and rejected promises
   - Order of results vs. completion order
   - Promise cancellation concerns

### Common Interview Questions

**Q: What's the difference between Promise.all() and Promise.allSettled()?**

A: Promise.all() rejects immediately if any promise rejects, while Promise.allSettled() waits for all promises to settle (fulfill or reject) and returns their individual statuses. Use Promise.all() when all operations must succeed, and Promise.allSettled() when partial failures are acceptable.

**Q: How would you implement a request timeout?**

A: Use Promise.race() to race the actual promise against a timeout promise:
```javascript
Promise.race([
  fetch(url),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 5000)
  )
])
```

**Q: What happens if you pass an empty array to Promise.all()?**

A: Promise.all([]) immediately returns a resolved promise with an empty array. This is different from Promise.race([]), which never settles (hangs indefinitely).

**Q: Explain Promise.any() and its use case.**

A: Promise.any() returns as soon as any promise fulfills, rejecting only if all promises reject. It's ideal for trying multiple sources and using whichever succeeds first (e.g., multiple CDNs, cache layers, or API fallbacks).

**Q: Can you cancel a promise in Promise.race()?**

A: No, Promise.race() doesn't cancel losing promises. They continue executing in the background. For true cancellation, use AbortController with fetch or implement custom cancellation logic.

**Q: How do Promise methods handle promise order?**

A: All promise methods maintain input order in results, regardless of completion order. The first promise in input will be at index 0 in results, even if it completes last.

## Further Reading

- [MDN: Promise.all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [MDN: Promise.race()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)
- [MDN: Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [MDN: Promise.any()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)
- [MDN: Promise Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [JavaScript.info: Promise API](https://javascript.info/promise-api)
- [Concurrency in JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises)
