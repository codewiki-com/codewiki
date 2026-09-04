---
title: Async Iterators and Async Generators
description: Master JavaScript async iterators and async generators. Learn Symbol.asyncIterator, for-await-of loops, async functions*, and advanced patterns for handling asynchronous data streams like paginated APIs, real-time data, and file streaming.
track: javascript
section: async
difficulty: advanced
tags:
  - JavaScript
  - async iterators
  - async generators
  - Symbol.asyncIterator
  - for-await-of
  - async iteration
status: imported
origin: old/src/content/docs/javascript/async-iterators.en.md
divergence: 0.226
issues: []
legacy:
  category: JavaScript
  subcategory: Asynchronous Programming
  order: 15
  lastUpdated: 2026-01-07
---

Async iterators (Async Iterator) and async generators (Async Generator) are powerful tools for handling asynchronous data streams in JavaScript. They extend the concepts of synchronous iterators and generators, enabling elegant handling of asynchronously-produced data sequences such as paginated API responses, real-time data feeds, file streaming, and more.

## Concept Introduction

### What Are Async Iterators?

Async iterators are the asynchronous counterpart to sync iterators. While synchronous iterator's `next()` method returns `{ value, done }` objects directly, async iterator's `next()` method returns a Promise that resolves to `{ value, done }` objects.

```javascript
// Synchronous iterator
const syncIterator = {
  next() {
    return { value: 1, done: false }; // Returns object directly
  }
};

// Asynchronous iterator
const asyncIterator = {
  next() {
    return Promise.resolve({ value: 1, done: false }); // Returns Promise
  }
};
```

### Historical Context

Async iterators were formally introduced in ES2018 (ES9), solving several key problems:

1. **Handling asynchronous data sequences**: Before this, processing asynchronously-produced data required complex callbacks or Promise chains
2. **Stream-based data processing**: Provided a standardized way to handle streaming data
3. **Unified async iteration interface**: Maintained consistency with the synchronous iterator API design

### Problems Solved

Traditional approaches to handling async data sequences revealed several pain points:

```javascript
// Pain point 1: Callback hell
function fetchAllPages(callback) {
  fetchPage(1, (page1) => {
    processPage(page1);
    fetchPage(2, (page2) => {
      processPage(page2);
      fetchPage(3, (page3) => {
        processPage(page3);
        callback();
      });
    });
  });
}

// Pain point 2: Complex Promise chains
function fetchAllPagesPromise() {
  return fetchPage(1)
    .then(page1 => {
      processPage(page1);
      return fetchPage(2);
    })
    .then(page2 => {
      processPage(page2);
      return fetchPage(3);
    })
    .then(page3 => {
      processPage(page3);
    });
}

// Solution: Async iterators
async function fetchAllPagesAsync() {
  for await (const page of fetchPages()) {
    processPage(page);
  }
}
```

## Core Principles

### The Async Iteration Protocol

The async iteration protocol defines two key concepts:

1. **Async Iterable Protocol**: Objects must implement `[Symbol.asyncIterator]()` method
2. **Async Iterator Protocol**: Objects must implement `next()` method returning a Promise

```javascript
// Complete async iterable object implementation
const asyncIterable = {
  // Implements async iterable protocol
  [Symbol.asyncIterator]() {
    let count = 0;
    const max = 3;

    // Returns async iterator
    return {
      // Implements async iterator protocol
      async next() {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));

        if (count < max) {
          return { value: count++, done: false };
        }
        return { value: undefined, done: true };
      },

      // Optional: return method to terminate iteration early
      async return(value) {
        console.log('Iteration terminated early');
        return { value, done: true };
      },

      // Optional: throw method to inject errors into iterator
      async throw(error) {
        console.log('Error received:', error);
        throw error;
      }
    };
  }
};
```

### How Symbol.asyncIterator Works

`Symbol.asyncIterator` is a built-in Symbol value used to define an object's default async iterator.

```javascript
// Nature of Symbol.asyncIterator
console.log(typeof Symbol.asyncIterator); // 'symbol'
console.log(Symbol.asyncIterator.description); // 'Symbol.asyncIterator'

// Check if object is async iterable
function isAsyncIterable(obj) {
  return obj != null && typeof obj[Symbol.asyncIterator] === 'function';
}

// Built-in async iterable objects (Node.js environment)
// - ReadableStream
// - Node.js Readable streams
// - Objects returned by async generator functions
```

### How for-await-of Loops Work

The `for-await-of` loop is specialized syntax for iterating async iterable objects:

```javascript
// Internal working principle of for-await-of
async function forAwaitOfExample() {
  const asyncIterable = getAsyncIterable();

  // for await (const value of asyncIterable) { ... }
  // Is equivalent to:

  const iterator = asyncIterable[Symbol.asyncIterator]();

  while (true) {
    // Waits for Promise returned by next()
    const { value, done } = await iterator.next();

    if (done) break;

    // Process value
    console.log(value);
  }
}

// Actual usage
async function consumeAsyncIterable() {
  for await (const value of asyncIterable) {
    console.log(value);
  }
}
```

### Async Generator Functions

Async generator functions combine the characteristics of `async` functions and generator functions:

```javascript
// Declaring an async generator function
async function* asyncGeneratorFunction() {
  yield 1;                    // Can yield plain values
  yield await fetchData();    // Can yield awaited results
  yield* anotherAsyncGen();   // Can delegate to other async generators
}

// Execution flow of async generator function
async function* example() {
  console.log('Start');
  yield 1;
  console.log('After first yield');
  yield 2;
  console.log('After second yield');
  return 'done';
}

const gen = example();

// Each next() call returns a Promise
gen.next().then(result => console.log(result));
// Output: 'Start'
// Output: { value: 1, done: false }

gen.next().then(result => console.log(result));
// Output: 'After first yield'
// Output: { value: 2, done: false }

gen.next().then(result => console.log(result));
// Output: 'After second yield'
// Output: { value: 'done', done: true }
```

## Key Points

### Three Methods of Async Iterators

```javascript
const asyncIterator = {
  // Required: returns a Promise of the next value
  async next(value) {
    return { value: 'data', done: false };
  },

  // Optional: called when iteration ends early (break, return)
  async return(value) {
    // Clean up resources
    return { value, done: true };
  },

  // Optional: handle errors
  async throw(error) {
    throw error;
  }
};
```

### Special Capabilities of Async Generators

```javascript
async function* asyncGenerator() {
  // Capability 1: Use await between yields
  const data = await fetchData();
  yield data;

  // Capability 2: yield await combination
  yield await anotherAsyncOperation();

  // Capability 3: Use yield* for delegation
  yield* anotherAsyncGenerator();

  // Capability 4: try-finally for resource cleanup
  try {
    yield 'value';
  } finally {
    console.log('Clean up resources');
  }
}
```

### When to Use for-await-of

```javascript
async function examples() {
  // Iterate async iterable objects
  for await (const chunk of readableStream) {
    console.log(chunk);
  }

  // Iterate Promise arrays
  const promises = [
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3)
  ];
  for await (const value of promises) {
    console.log(value); // 1, 2, 3
  }

  // Iterate sync iterables with for-await-of (also works, but usually unnecessary)
  for await (const value of [1, 2, 3]) {
    console.log(value);
  }
}
```

### Async Generators with return/throw

```javascript
async function* gen() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } finally {
    console.log('Clean up');
  }
}

async function testReturn() {
  const g = gen();
  console.log(await g.next());   // { value: 1, done: false }
  console.log(await g.return()); // Output 'Clean up', { value: undefined, done: true }
}

async function testThrow() {
  const g = gen();
  console.log(await g.next()); // { value: 1, done: false }
  try {
    await g.throw(new Error('Error occurred'));
  } catch (e) {
    console.log(e.message); // 'Error occurred'
  }
  // finally block still executes
}
```

## Code Examples

### Basic Example: Creating Async Iterables

```javascript
// Method 1: Object literal
const asyncNumbers = {
  max: 5,
  delay: 500,

  [Symbol.asyncIterator]() {
    let current = 0;
    const { max, delay } = this;

    return {
      async next() {
        await new Promise(resolve => setTimeout(resolve, delay));

        if (current < max) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
};

// Usage
async function main() {
  for await (const num of asyncNumbers) {
    console.log(num); // 0, 1, 2, 3, 4 (every 500ms)
  }
}
```

### Class-Based Async Iterable

```javascript
class AsyncQueue {
  constructor() {
    this.queue = [];
    this.resolvers = [];
    this.closed = false;
  }

  // Add data to queue
  push(value) {
    if (this.closed) {
      throw new Error('Queue is closed');
    }

    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift();
      resolve({ value, done: false });
    } else {
      this.queue.push(value);
    }
  }

  // Close the queue
  close() {
    this.closed = true;
    // Notify all waiting consumers
    for (const resolve of this.resolvers) {
      resolve({ value: undefined, done: true });
    }
    this.resolvers = [];
  }

  // Implement async iterator
  [Symbol.asyncIterator]() {
    return {
      next: () => {
        if (this.queue.length > 0) {
          return Promise.resolve({
            value: this.queue.shift(),
            done: false
          });
        }

        if (this.closed) {
          return Promise.resolve({ value: undefined, done: true });
        }

        return new Promise(resolve => {
          this.resolvers.push(resolve);
        });
      },

      return: () => {
        this.close();
        return Promise.resolve({ value: undefined, done: true });
      }
    };
  }
}

// Usage example
async function demo() {
  const queue = new AsyncQueue();

  // Producer
  setTimeout(() => queue.push('Message 1'), 100);
  setTimeout(() => queue.push('Message 2'), 200);
  setTimeout(() => queue.push('Message 3'), 300);
  setTimeout(() => queue.close(), 400);

  // Consumer
  for await (const message of queue) {
    console.log('Received:', message);
  }
  console.log('Queue closed');
}
```

### Async Generator Basics

```javascript
// Simple async generator
async function* countAsync(max, delay = 1000) {
  for (let i = 0; i < max; i++) {
    await new Promise(resolve => setTimeout(resolve, delay));
    yield i;
  }
}

// Usage
async function main() {
  for await (const num of countAsync(5, 500)) {
    console.log(num); // 0, 1, 2, 3, 4
  }
}

// Async generator with error handling
async function* fetchDataSequence(urls) {
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      yield await response.json();
    } catch (error) {
      // Can choose to skip failed requests
      console.error(`Failed to fetch ${url}:`, error.message);
      yield { error: error.message, url };
    }
  }
}
```

### Delegating with yield*

```javascript
// Child generator
async function* getUsers() {
  yield await fetchUser(1);
  yield await fetchUser(2);
}

async function* getPosts() {
  yield await fetchPost(1);
  yield await fetchPost(2);
}

// Main generator using yield* delegation
async function* getAllData() {
  console.log('Fetching users...');
  yield* getUsers();

  console.log('Fetching posts...');
  yield* getPosts();

  console.log('Done');
}

// Usage
async function main() {
  for await (const data of getAllData()) {
    console.log(data);
  }
}
```

### Passing Values to Async Generators

```javascript
async function* bidirectionalGen() {
  const input1 = yield 'First output';
  console.log('Received input 1:', input1);

  const input2 = yield 'Second output';
  console.log('Received input 2:', input2);

  return 'Complete';
}

async function main() {
  const gen = bidirectionalGen();

  // First next, starts generator
  const result1 = await gen.next();
  console.log(result1); // { value: 'First output', done: false }

  // Second next, passes value to first yield
  const result2 = await gen.next('Input value 1');
  // Output: 'Received input 1: Input value 1'
  console.log(result2); // { value: 'Second output', done: false }

  // Third next, passes value to second yield
  const result3 = await gen.next('Input value 2');
  // Output: 'Received input 2: Input value 2'
  console.log(result3); // { value: 'Complete', done: true }
}
```

## Best Practices

### Encapsulating Paginated APIs

```javascript
// Recommended paginated data iterator implementation
async function* fetchPaginatedData(baseUrl, options = {}) {
  const { pageSize = 20, maxPages = Infinity } = options;
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    const url = `${baseUrl}?page=${page}&pageSize=${pageSize}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Yield individual items rather than entire pages
      for (const item of data.items) {
        yield item;
      }

      hasMore = data.hasNextPage;
      page++;
    } catch (error) {
      console.error(`Failed to fetch page ${page}:`, error);
      throw error;
    }
  }
}

// Usage
async function loadAllUsers() {
  const users = [];

  for await (const user of fetchPaginatedData('/api/users', { pageSize: 50 })) {
    users.push(user);

    // Can interrupt at any time
    if (users.length >= 100) {
      break;
    }
  }

  return users;
}
```

### Resource Cleanup Pattern

```javascript
async function* createDatabaseIterator(query) {
  const connection = await database.connect();

  try {
    const cursor = await connection.query(query);

    while (await cursor.hasNext()) {
      yield await cursor.next();
    }
  } finally {
    // Ensure resources are cleaned up regardless of how iteration ends
    await connection.close();
    console.log('Database connection closed');
  }
}

// Usage
async function processRecords() {
  for await (const record of createDatabaseIterator('SELECT * FROM users')) {
    console.log(record);

    if (record.id === 100) {
      break; // finally block still executes
    }
  }
}
```

### Error Handling Strategies

```javascript
// Strategy 1: Skip error items and continue iteration
async function* resilientIterator(items) {
  for (const item of items) {
    try {
      yield await processItem(item);
    } catch (error) {
      console.error(`Failed to process ${item}, skipping`);
      continue;
    }
  }
}

// Strategy 2: Collect errors and handle together
async function* iteratorWithErrorCollection(items) {
  const errors = [];

  for (const item of items) {
    try {
      yield await processItem(item);
    } catch (error) {
      errors.push({ item, error });
    }
  }

  if (errors.length > 0) {
    // Yield error summary at the end
    yield { type: 'errors', errors };
  }
}

// Strategy 3: Retry mechanism
async function* iteratorWithRetry(items, maxRetries = 3) {
  for (const item of items) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        yield await processItem(item);
        break;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }

    if (lastError) {
      throw new Error(`Failed to process ${item} after ${maxRetries} retries`);
    }
  }
}
```

### Concurrency Control

```javascript
// Async iterator controlling concurrency
async function* concurrentIterator(items, processFn, concurrency = 3) {
  const executing = new Set();
  const results = [];

  for (const item of items) {
    const promise = processFn(item).then(result => {
      executing.delete(promise);
      return result;
    });

    executing.add(promise);
    results.push(promise);

    if (executing.size >= concurrency) {
      // Wait for any one to complete
      const completed = await Promise.race(executing);
      yield completed;
    }
  }

  // Handle remaining
  for (const promise of results) {
    if (!promise.isFulfilled) {
      yield await promise;
    }
  }
}
```

### Combining Multiple Async Iterators

```javascript
// Merge multiple async iterators (interleaved output)
async function* merge(...iterables) {
  const iterators = iterables.map(iterable =>
    iterable[Symbol.asyncIterator]()
  );

  const pending = new Map();

  // Initialize next Promise for all iterators
  for (let i = 0; i < iterators.length; i++) {
    pending.set(i, iterators[i].next().then(result => ({ index: i, result })));
  }

  while (pending.size > 0) {
    const { index, result } = await Promise.race(pending.values());

    if (result.done) {
      pending.delete(index);
    } else {
      yield result.value;
      pending.set(
        index,
        iterators[index].next().then(result => ({ index, result }))
      );
    }
  }
}

// Usage
async function main() {
  const iter1 = asyncGenerator1();
  const iter2 = asyncGenerator2();

  for await (const value of merge(iter1, iter2)) {
    console.log(value);
  }
}
```

## Common Pitfalls

### Pitfall 1: Forgetting to Use for-await-of

```javascript
// Wrong: Using regular for-of with async iterators
async function wrong() {
  for (const value of asyncIterable) { // Iterates over Promise objects!
    console.log(value); // Promise { ... }
  }
}

// Correct: Use for-await-of
async function correct() {
  for await (const value of asyncIterable) {
    console.log(value); // Actual value
  }
}
```

### Pitfall 2: Using for-await-of Outside Async Context

```javascript
// Wrong: for-await-of must be in async function
function notAsync() {
  for await (const value of asyncIterable) { // SyntaxError!
    console.log(value);
  }
}

// Correct
async function isAsync() {
  for await (const value of asyncIterable) {
    console.log(value);
  }
}

// Or use top-level await (ES2022+, in module context)
for await (const value of asyncIterable) {
  console.log(value);
}
```

### Pitfall 3: Unhandled Errors in Async Generators

```javascript
// Problem: Errors cause iterator to fail permanently
async function* riskyGenerator() {
  yield await fetchData1(); // If this fails...
  yield await fetchData2(); // This never executes
}

// Solution 1: Handle errors inside generator
async function* safeGenerator() {
  try {
    yield await fetchData1();
  } catch (e) {
    yield { error: e.message };
  }

  try {
    yield await fetchData2();
  } catch (e) {
    yield { error: e.message };
  }
}

// Solution 2: Handle errors on consumption side
async function consume() {
  const gen = riskyGenerator();

  while (true) {
    try {
      const { value, done } = await gen.next();
      if (done) break;
      console.log(value);
    } catch (e) {
      console.error('Iteration error:', e);
      break;
    }
  }
}
```

### Pitfall 4: Resource Leaks

```javascript
// Problem: Resources not cleaned up after break
async function* leakyGenerator() {
  const connection = await db.connect();
  yield* fetchRecords(connection);
  connection.close(); // Won't execute after break
}

// Solution: Use try-finally
async function* safeGenerator() {
  const connection = await db.connect();
  try {
    yield* fetchRecords(connection);
  } finally {
    connection.close(); // Executes even after break
  }
}
```

### Pitfall 5: Misusing yield and return

```javascript
// Problem: return value is not yielded by for-await-of
async function* generator() {
  yield 1;
  yield 2;
  return 3; // This value is lost
}

async function test() {
  for await (const value of generator()) {
    console.log(value); // Only outputs 1, 2
  }
}

// To get return value, iterate manually
async function testManual() {
  const gen = generator();
  let result;

  while (!(result = await gen.next()).done) {
    console.log(result.value);
  }

  console.log('Return value:', result.value); // 3
}
```

### Pitfall 6: Confusing Symbol.asyncIterator with Symbol.iterator

```javascript
// Problem: Implementing wrong Symbol
const wrongIterable = {
  [Symbol.iterator]() { // This is a sync iterator!
    return {
      async next() {
        return { value: 1, done: false };
      }
    };
  }
};

// for-await-of might work but behavior may be unexpected
// Correct approach
const correctIterable = {
  [Symbol.asyncIterator]() {
    return {
      async next() {
        return { value: 1, done: false };
      }
    };
  }
};
```

## Performance Considerations

### Memory Efficiency

```javascript
// Inefficient: Loads all data into memory at once
async function loadAllDataBad() {
  const allData = [];
  let page = 1;

  while (true) {
    const data = await fetchPage(page++);
    allData.push(...data.items);
    if (!data.hasNextPage) break;
  }

  return allData; // Could contain millions of records
}

// Efficient: Stream data with async generator
async function* loadDataStream() {
  let page = 1;

  while (true) {
    const data = await fetchPage(page++);

    for (const item of data.items) {
      yield item; // Yields individually, no accumulation
    }

    if (!data.hasNextPage) break;
  }
}

// Usage: Constant memory footprint
async function processData() {
  for await (const item of loadDataStream()) {
    await processItem(item);
    // One item processed and released at a time
  }
}
```

### Request Optimization

```javascript
// Prefetch next page to improve responsiveness
async function* prefetchingIterator(baseUrl) {
  let page = 1;
  let currentPagePromise = fetchPage(baseUrl, page);
  let nextPagePromise = null;

  while (true) {
    const currentPage = await currentPagePromise;

    // Start prefetching next page
    if (currentPage.hasNextPage) {
      nextPagePromise = fetchPage(baseUrl, ++page);
    }

    for (const item of currentPage.items) {
      yield item;
    }

    if (!currentPage.hasNextPage) break;

    currentPagePromise = nextPagePromise;
  }
}
```

### Backpressure Handling

```javascript
// Handle when consumer is slower than producer
async function* backpressureAwareIterator(source, options = {}) {
  const { highWaterMark = 10 } = options;
  const buffer = [];
  let waitingForDrain = null;

  // Fill buffer
  async function fillBuffer() {
    for await (const item of source) {
      buffer.push(item);

      if (buffer.length >= highWaterMark) {
        // Wait for buffer to be consumed
        await new Promise(resolve => {
          waitingForDrain = resolve;
        });
      }
    }
  }

  // Start filling
  const filling = fillBuffer();

  // Yield from buffer
  while (true) {
    if (buffer.length > 0) {
      yield buffer.shift();

      // Signal can continue filling
      if (waitingForDrain && buffer.length < highWaterMark / 2) {
        waitingForDrain();
        waitingForDrain = null;
      }
    } else {
      // Wait for new data
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Check if done
    // ...
  }
}
```

### Performance Comparison

```javascript
// Benchmark testing
async function benchmark() {
  const iterations = 10000;

  // Method 1: Direct array
  console.time('Array');
  const arr = [];
  for (let i = 0; i < iterations; i++) {
    arr.push(await getValue(i));
  }
  console.timeEnd('Array');

  // Method 2: Async generator
  console.time('AsyncGenerator');
  async function* gen() {
    for (let i = 0; i < iterations; i++) {
      yield await getValue(i);
    }
  }
  for await (const _ of gen()) {}
  console.timeEnd('AsyncGenerator');

  // Results: Async generators have slight overhead, but better memory efficiency
}
```

## Real-world Scenarios

### Scenario 1: Paginated API Data Fetching

```javascript
// Generic paginated API iterator
class PaginatedAPI {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.pageSize = options.pageSize || 20;
    this.headers = options.headers || {};
  }

  async *items() {
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const url = new URL(this.baseUrl);
      url.searchParams.set('limit', this.pageSize);
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      for (const item of data.items) {
        yield item;
      }

      cursor = data.nextCursor;
      hasMore = !!cursor;
    }
  }

  async *pages() {
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const url = new URL(this.baseUrl);
      url.searchParams.set('limit', this.pageSize);
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      const response = await fetch(url, { headers: this.headers });
      const data = await response.json();

      yield data;

      cursor = data.nextCursor;
      hasMore = !!cursor;
    }
  }

  [Symbol.asyncIterator]() {
    return this.items();
  }
}

// Usage
async function fetchAllUsers() {
  const api = new PaginatedAPI('https://api.example.com/users', {
    pageSize: 100,
    headers: { 'Authorization': 'Bearer token' }
  });

  const users = [];
  for await (const user of api) {
    users.push(user);

    // Progress reporting
    if (users.length % 100 === 0) {
      console.log(`Loaded ${users.length} users`);
    }
  }

  return users;
}
```

### Scenario 2: Real-time Data Stream Processing

```javascript
// WebSocket message stream
class WebSocketStream {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.queue = [];
    this.resolvers = [];
    this.closed = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (this.resolvers.length > 0) {
          const resolve = this.resolvers.shift();
          resolve({ value: data, done: false });
        } else {
          this.queue.push(data);
        }
      };

      this.ws.onclose = () => {
        this.closed = true;
        for (const resolve of this.resolvers) {
          resolve({ value: undefined, done: true });
        }
      };
    });
  }

  [Symbol.asyncIterator]() {
    return {
      next: () => {
        if (this.queue.length > 0) {
          return Promise.resolve({
            value: this.queue.shift(),
            done: false
          });
        }

        if (this.closed) {
          return Promise.resolve({ value: undefined, done: true });
        }

        return new Promise(resolve => {
          this.resolvers.push(resolve);
        });
      },

      return: () => {
        this.ws.close();
        return Promise.resolve({ value: undefined, done: true });
      }
    };
  }
}

// Usage
async function processRealTimeData() {
  const stream = new WebSocketStream('wss://api.example.com/stream');
  await stream.connect();

  for await (const message of stream) {
    console.log('Received message:', message);

    if (message.type === 'end') {
      break;
    }
  }
}
```

### Scenario 3: Chunked File Reading

```javascript
// Node.js environment: File stream reading in chunks
async function* readFileInChunks(filePath, chunkSize = 64 * 1024) {
  const fs = require('fs').promises;
  const fileHandle = await fs.open(filePath, 'r');

  try {
    const buffer = Buffer.alloc(chunkSize);
    let position = 0;

    while (true) {
      const { bytesRead } = await fileHandle.read(
        buffer,
        0,
        chunkSize,
        position
      );

      if (bytesRead === 0) break;

      yield buffer.slice(0, bytesRead);
      position += bytesRead;
    }
  } finally {
    await fileHandle.close();
  }
}

// Usage
async function processLargeFile() {
  let totalBytes = 0;

  for await (const chunk of readFileInChunks('/path/to/large-file.txt')) {
    totalBytes += chunk.length;
    // Process data chunk
    await processChunk(chunk);
  }

  console.log(`Processed total ${totalBytes} bytes`);
}
```

### Scenario 4: Database Cursor Iteration

```javascript
// Database query result iterator
class DatabaseCursor {
  constructor(connection, query, batchSize = 100) {
    this.connection = connection;
    this.query = query;
    this.batchSize = batchSize;
  }

  async *[Symbol.asyncIterator]() {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const rows = await this.connection.query(
        `${this.query} LIMIT ${this.batchSize} OFFSET ${offset}`
      );

      if (rows.length === 0) {
        hasMore = false;
        break;
      }

      for (const row of rows) {
        yield row;
      }

      hasMore = rows.length === this.batchSize;
      offset += this.batchSize;
    }
  }
}

// Usage
async function exportUsers() {
  const connection = await db.connect();
  const cursor = new DatabaseCursor(
    connection,
    'SELECT * FROM users WHERE active = true',
    500
  );

  const output = fs.createWriteStream('users.json');
  output.write('[\n');

  let first = true;
  for await (const user of cursor) {
    if (!first) output.write(',\n');
    output.write(JSON.stringify(user));
    first = false;
  }

  output.write('\n]');
  output.end();
}
```

### Scenario 5: Polling with Retry

```javascript
// Polling iterator with retry mechanism
async function* pollWithRetry(fetchFn, options = {}) {
  const {
    interval = 5000,
    maxRetries = 3,
    retryDelay = 1000,
    shouldStop = () => false
  } = options;

  while (true) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = await fetchFn();
        yield data;

        if (shouldStop(data)) {
          return;
        }

        break;
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          console.warn(`Attempt ${attempt} failed, retrying after ${retryDelay}ms`);
          await new Promise(r => setTimeout(r, retryDelay));
        }
      }
    }

    if (lastError) {
      yield { error: lastError.message };
    }

    await new Promise(r => setTimeout(r, interval));
  }
}

// Usage
async function monitorJobStatus(jobId) {
  const poll = pollWithRetry(
    () => fetch(`/api/jobs/${jobId}`).then(r => r.json()),
    {
      interval: 2000,
      shouldStop: (data) => data.status === 'completed' || data.status === 'failed'
    }
  );

  for await (const status of poll) {
    console.log('Job status:', status);
  }
}
```

## Interview Points

### Difference Between Async and Sync Iterators

**Question: Explain the differences between async iterators and sync iterators?**

```javascript
// Sync iterator
const syncIterable = {
  [Symbol.iterator]() {
    return {
      next() {
        return { value: 1, done: false }; // Direct return
      }
    };
  }
};

// Async iterator
const asyncIterable = {
  [Symbol.asyncIterator]() {
    return {
      next() {
        return Promise.resolve({ value: 1, done: false }); // Returns Promise
      }
    };
  }
};

// Key differences:
// 1. Symbol: Symbol.iterator vs Symbol.asyncIterator
// 2. Return value: Object vs Promise<Object>
// 3. Iteration method: for-of vs for-await-of
// 4. Use case: Sync data vs Async data streams
```

### What Objects Can for-await-of Iterate?

**Question: What types of objects can be iterated with for-await-of?**

```javascript
async function examples() {
  // 1. Async iterable objects (implementing Symbol.asyncIterator)
  for await (const x of asyncIterable) {}

  // 2. Sync iterable objects (implementing Symbol.iterator)
  for await (const x of [1, 2, 3]) {}

  // 3. Promise arrays
  for await (const x of [Promise.resolve(1), Promise.resolve(2)]) {}

  // 4. Async generator returns
  for await (const x of asyncGeneratorFunction()) {}

  // Note: Plain objects cannot be iterated
  // for await (const x of { a: 1 }) {} // TypeError
}
```

### Difference Between async function and async function*

**Question: What is the difference between async function and async function*?**

```javascript
// async function: returns Promise<value>
async function asyncFn() {
  return 'value'; // Returns single value
}

// async function*: returns AsyncGenerator, can yield multiple values
async function* asyncGenFn() {
  yield 1;
  yield 2;
  yield 3;
  return 'done'; // return value obtained via next() with done: true
}

// Invocation difference
asyncFn().then(value => console.log(value)); // 'value'

const gen = asyncGenFn();
gen.next().then(r => console.log(r)); // { value: 1, done: false }
gen.next().then(r => console.log(r)); // { value: 2, done: false }
```

### Error Handling in Async Iteration

**Question: How do you handle errors in for-await-of loops?**

```javascript
// Method 1: try-catch around entire loop
async function method1() {
  try {
    for await (const item of asyncIterable) {
      processItem(item);
    }
  } catch (error) {
    console.error('Iteration error:', error);
  }
}

// Method 2: Handle inside loop
async function method2() {
  for await (const item of asyncIterable) {
    try {
      await processItem(item);
    } catch (error) {
      console.error('Processing error:', error);
      continue; // Continue to next item
    }
  }
}

// Method 3: Handle inside generator
async function* safeGenerator() {
  for (const item of items) {
    try {
      yield await fetchItem(item);
    } catch (error) {
      yield { error: error.message };
    }
  }
}
```

### Using yield* in Async Generators

**Question: How does yield* work in async generators?**

```javascript
async function* innerGen() {
  yield await Promise.resolve(1);
  yield await Promise.resolve(2);
}

async function* outerGen() {
  yield 0;

  // yield* does:
  // 1. Gets iterator from innerGen
  // 2. Automatically traverses and forwards all yielded values
  // 3. Awaits each value's Promise resolution
  yield* innerGen();

  yield 3;
}

// Results: 0, 1, 2, 3
for await (const value of outerGen()) {
  console.log(value);
}

// yield* also works with sync iterables
async function* mixed() {
  yield* [1, 2, 3]; // Sync array
  yield* asyncIterable; // Async iterable
}
```

### Implementing a Simple Async Iterator

**Question: Write a simple async iterator that simulates fetching data from multiple URLs?**

```javascript
function createAsyncIterator(urls) {
  let index = 0;

  return {
    [Symbol.asyncIterator]() {
      return this;
    },

    async next() {
      if (index >= urls.length) {
        return { value: undefined, done: true };
      }

      const url = urls[index++];
      const response = await fetch(url);
      const data = await response.json();

      return { value: data, done: false };
    },

    async return() {
      console.log('Iterator terminated early');
      return { value: undefined, done: true };
    }
  };
}

// Usage
async function test() {
  const urls = ['/api/1', '/api/2', '/api/3'];
  const iterator = createAsyncIterator(urls);

  for await (const data of iterator) {
    console.log(data);
  }
}
```

## Further Reading

### Official Documentation

- [MDN: for await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)
- [MDN: async function*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*)
- [MDN: Symbol.asyncIterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator)
- [ECMAScript Specification: AsyncIterator](https://tc39.es/ecma262/#sec-asynciterator-interface)

### Proposals and Specifications

- [TC39 Async Iteration Proposal](https://github.com/tc39/proposal-async-iteration)
- [Async Generators Proposal Documentation](https://github.com/tc39/proposal-async-iteration/blob/master/README.md)

### Advanced Learning Resources

- [JavaScript.info: Async Iterators and Generators](https://javascript.info/async-iterators-generators)
- [Exploring JS: Asynchronous Iteration](https://exploringjs.com/es2018-es2019/ch_asynchronous-iteration.html)
- [Node.js Streams with Async Iterators](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators)

### Practical Libraries

- [IxJS (Interactive Extensions for JavaScript)](https://github.com/ReactiveX/IxJS) - Async iterator utilities
- [p-queue](https://github.com/sindresorhus/p-queue) - Promise concurrency control
- [async-iterator-to-array](https://www.npmjs.com/package/async-iterator-to-array) - Convert async iterators to arrays

### Related Topics

- [Iterators and Generators](/javascript/iterators-generators) - Sync iterator fundamentals
- [async/await](/javascript/async-await) - Async function basics
- [Promises](/javascript/promises) - Deep dive into Promises
- [Event Loop](/javascript/event-loop) - JavaScript async model
