---
title: Node.js Event Loop Complete Guide
description: Master Node.js asynchronous programming and event-driven architecture
track: javascript
section: node
difficulty: intermediate
tags:
  - Node.js
  - Event Loop
  - Async
  - Non-blocking
status: imported
origin: old/src/content/docs/backend/nodejs-fundamentals.en.md
divergence: 0.189
issues: []
legacy:
  category: Backend
  subcategory: Node.js
  order: 1
  lastUpdated: 2026-01-07
---

## Concept Overview: What is Node.js?

Node.js is a JavaScript runtime environment built on Chrome's V8 JavaScript engine. It enables developers to write server-side applications using JavaScript, breaking the traditional limitation of JavaScript running only in browsers.

### Core Characteristics

Node.js is distinguished by several fundamental characteristics:

- **Single-Threaded Event Loop**: Uses a single thread to handle requests, achieving high concurrency through the event loop mechanism
- **Non-Blocking I/O**: All I/O operations are asynchronous and do not block the main thread
- **Cross-Platform**: Runs on Windows, Linux, macOS, and other platforms
- **NPM Ecosystem**: Has the world's largest open-source library ecosystem

### Ideal Use Cases

Node.js excels in specific scenarios:

```
1. High-concurrency, I/O-intensive applications (API servers, real-time chat)
2. Microservices architecture
3. Frontend build tools (Webpack, Vite)
4. Command-line tool development
5. Streaming applications
```

## Node.js Architecture

Understanding Node.js architecture is fundamental to mastering its event-driven model. The architecture consists of several key components working together to enable non-blocking I/O operations.

### The V8 Engine

V8 is Google's high-performance JavaScript engine, written in C++. Its primary responsibilities include:

```javascript
// V8 Engine workflow illustration
/**
 * 1. Parse JavaScript code to generate AST (Abstract Syntax Tree)
 * 2. Compile AST into bytecode
 * 3. Generate optimized machine code through TurboFan optimizer
 * 4. Execute machine code
 */

// V8's Just-In-Time (JIT) compilation example
function hotFunction(x) {
  return x * 2;
}

// When a function is called frequently, V8 marks it as a "hot" function
// and uses TurboFan for optimized compilation
for (let i = 0; i < 100000; i++) {
  hotFunction(i);
}
```

### Node.js Runtime Components

The Node.js runtime consists of several interconnected layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Your JavaScript Code                      │
├─────────────────────────────────────────────────────────────┤
│                     Node.js Bindings                         │
│              (Process, Buffer, Crypto, etc.)                 │
├──────────────────────┬──────────────────────────────────────┤
│       V8 Engine      │              libuv                    │
│   (JS Execution)     │   (Event Loop, Thread Pool, I/O)     │
├──────────────────────┴──────────────────────────────────────┤
│                    Operating System                          │
└─────────────────────────────────────────────────────────────┘
```

## libuv and Thread Pool

libuv is a cross-platform asynchronous I/O library that forms the foundation of Node.js's non-blocking I/O capabilities. It provides:

- **Event Loop**: The core implementation of Node.js event loop
- **Thread Pool**: Handles blocking operations like file I/O
- **Asynchronous TCP/UDP sockets**
- **Asynchronous DNS resolution**
- **File system operations**
- **Child process management**

### Thread Pool Configuration

```javascript
// libuv thread pool configuration
// Default pool size is 4, can be modified via environment variable
process.env.UV_THREADPOOL_SIZE = 8;

// Demonstrating thread pool behavior
const crypto = require('crypto');
const start = Date.now();

// Create multiple CPU-intensive tasks
for (let i = 0; i < 8; i++) {
  crypto.pbkdf2('password', 'salt', 100000, 512, 'sha512', () => {
    console.log(`Task ${i + 1} completed, time: ${Date.now() - start}ms`);
  });
}
```

### Understanding Which Operations Use the Thread Pool

```javascript
// Operations that use the thread pool:
// - fs module operations (most)
// - crypto.pbkdf2, crypto.randomBytes
// - zlib compression
// - dns.lookup()

// Operations that DON'T use the thread pool (use OS async primitives):
// - Network I/O (TCP, UDP)
// - Pipes
// - dns.resolve()
// - timers

const fs = require('fs');
const https = require('https');

// This uses the thread pool
fs.readFile('./large-file.txt', (err, data) => {
  console.log('File read complete (thread pool)');
});

// This uses OS async primitives (epoll/kqueue/IOCP)
https.get('https://api.example.com', (res) => {
  console.log('HTTP request complete (OS async)');
});
```

## Event Loop Phases

The event loop is Node.js's core mechanism for handling asynchronous operations. It operates in distinct phases:

```
   ┌───────────────────────────┐
┌─>│           timers          │  Execute setTimeout/setInterval callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │  Execute I/O callbacks deferred to next loop
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │  Internal use only
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │  Retrieve new I/O events, execute I/O callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │  Execute setImmediate callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │  Execute close event callbacks (socket.on('close'))
   └───────────────────────────┘
```

### Phase Details

**1. Timers Phase**
Executes callbacks scheduled by `setTimeout()` and `setInterval()`. Timers specify a threshold after which a callback may be executed, not the exact time.

**2. Pending Callbacks Phase**
Executes I/O callbacks deferred to the next loop iteration, such as TCP error callbacks.

**3. Poll Phase**
The most important phase. It:
- Calculates how long to block and poll for I/O
- Processes events in the poll queue

**4. Check Phase**
Executes `setImmediate()` callbacks immediately after the poll phase.

**5. Close Callbacks Phase**
Executes close callbacks, e.g., `socket.on('close', ...)`.

### Event Loop Execution Order

```javascript
// Event loop phase demonstration
console.log('1. Synchronous code starts');

setTimeout(() => {
  console.log('4. setTimeout callback (timers phase)');
}, 0);

setImmediate(() => {
  console.log('5. setImmediate callback (check phase)');
});

process.nextTick(() => {
  console.log('3. process.nextTick (executes after current phase)');
});

Promise.resolve().then(() => {
  console.log('3.5 Promise.then (microtask queue)');
});

console.log('2. Synchronous code ends');

// Output order:
// 1. Synchronous code starts
// 2. Synchronous code ends
// 3. process.nextTick
// 3.5 Promise.then
// 4. setTimeout callback (timers phase)
// 5. setImmediate callback (check phase)
```

### Microtasks vs Macrotasks

```javascript
// Microtasks: process.nextTick, Promise callbacks
// Macrotasks: setTimeout, setInterval, setImmediate, I/O callbacks

// Microtasks are processed between each phase of the event loop
// and after each macrotask completes

console.log('Start');

setTimeout(() => {
  console.log('setTimeout 1');
  Promise.resolve().then(() => console.log('Promise inside setTimeout'));
}, 0);

setTimeout(() => {
  console.log('setTimeout 2');
}, 0);

Promise.resolve().then(() => console.log('Promise 1'));
Promise.resolve().then(() => console.log('Promise 2'));

console.log('End');

// Output:
// Start
// End
// Promise 1
// Promise 2
// setTimeout 1
// Promise inside setTimeout
// setTimeout 2
```

### setTimeout vs setImmediate

```javascript
// In the main module, the order is non-deterministic
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
// Could be either order!

// Within an I/O callback, setImmediate is always first
const fs = require('fs');

fs.readFile('./file.txt', () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// Output: immediate, then timeout (always in this order)
```

## Async Patterns

### Callbacks (Traditional Pattern)

```javascript
const fs = require('fs');

// Error-first callback pattern
fs.readFile('./config.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  console.log('File contents:', data);
});

// Callback hell example (avoid this!)
fs.readFile('./file1.txt', 'utf8', (err, data1) => {
  if (err) return console.error(err);
  fs.readFile('./file2.txt', 'utf8', (err, data2) => {
    if (err) return console.error(err);
    fs.readFile('./file3.txt', 'utf8', (err, data3) => {
      if (err) return console.error(err);
      console.log(data1, data2, data3);
    });
  });
});
```

### Promises

```javascript
const fs = require('fs').promises;

// Basic Promise usage
fs.readFile('./config.json', 'utf8')
  .then(data => {
    console.log('File contents:', data);
    return JSON.parse(data);
  })
  .then(config => {
    console.log('Parsed config:', config);
  })
  .catch(err => {
    console.error('Error:', err);
  });

// Promise.all - parallel execution
async function readMultipleFiles() {
  const [file1, file2, file3] = await Promise.all([
    fs.readFile('./file1.txt', 'utf8'),
    fs.readFile('./file2.txt', 'utf8'),
    fs.readFile('./file3.txt', 'utf8')
  ]);
  return { file1, file2, file3 };
}

// Promise.allSettled - wait for all, regardless of rejection
const results = await Promise.allSettled([
  fetch('/api/endpoint1'),
  fetch('/api/endpoint2'),
  fetch('/api/endpoint3')
]);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`Request ${index} succeeded:`, result.value);
  } else {
    console.log(`Request ${index} failed:`, result.reason);
  }
});

// Promise.race - first to resolve/reject wins
const timeout = (ms) => new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), ms)
);

const result = await Promise.race([
  fetch('/api/data'),
  timeout(5000)
]);
```

### Async/Await (Modern Pattern)

```javascript
const fs = require('fs').promises;

// Clean async/await syntax
async function processConfig() {
  try {
    const data = await fs.readFile('./config.json', 'utf8');
    const config = JSON.parse(data);

    // Sequential operations
    const result1 = await processStep1(config);
    const result2 = await processStep2(result1);

    return result2;
  } catch (err) {
    console.error('Processing failed:', err);
    throw err;
  }
}

// Concurrent execution with async/await
async function fetchAllData() {
  // These run concurrently
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments()
  ]);

  return { users, posts, comments };
}

// Error handling patterns
async function robustOperation() {
  // Pattern 1: try-catch
  try {
    const result = await riskyOperation();
    return result;
  } catch (err) {
    return defaultValue;
  }

  // Pattern 2: .catch() with await
  const result = await riskyOperation().catch(() => defaultValue);
}

// Async iteration
async function* asyncGenerator() {
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    yield i;
  }
}

async function consumeGenerator() {
  for await (const value of asyncGenerator()) {
    console.log(value);
  }
}
```

### Converting Callbacks to Promises

```javascript
const { promisify } = require('util');
const fs = require('fs');

// Using promisify
const readFileAsync = promisify(fs.readFile);
const data = await readFileAsync('./file.txt', 'utf8');

// Manual promisification
function readFilePromise(path, encoding) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, encoding, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Promisifying an entire module
const dns = require('dns');
const dnsPromises = require('dns').promises;
// or
const { Resolver } = require('dns').promises;
```

## Streams

Streams are collections of data that might not be available all at once and don't have to fit in memory. There are four types: Readable, Writable, Duplex, and Transform.

### Readable Streams

```javascript
const fs = require('fs');
const { Readable } = require('stream');

// Create a readable stream from a file
const readStream = fs.createReadStream('./large-file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024 // 64KB buffer
});

readStream.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data`);
});

readStream.on('end', () => {
  console.log('File reading complete');
});

readStream.on('error', (err) => {
  console.error('Read error:', err);
});

// Custom readable stream
class CounterStream extends Readable {
  constructor(max) {
    super({ objectMode: true });
    this.max = max;
    this.count = 0;
  }

  _read() {
    if (this.count < this.max) {
      this.push({ count: ++this.count });
    } else {
      this.push(null); // Signal end of stream
    }
  }
}

const counter = new CounterStream(5);
counter.on('data', (data) => {
  console.log(data); // { count: 1 }, { count: 2 }, ...
});
```

### Writable Streams

```javascript
const fs = require('fs');
const { Writable } = require('stream');

// File write stream
const writeStream = fs.createWriteStream('./output.txt', {
  encoding: 'utf8',
  highWaterMark: 16 * 1024
});

// Writing data
writeStream.write('First line\n');
writeStream.write('Second line\n');
writeStream.end('Final line');

writeStream.on('finish', () => {
  console.log('Write complete');
});

writeStream.on('error', (err) => {
  console.error('Write error:', err);
});

// Custom writable stream
class LoggerStream extends Writable {
  _write(chunk, encoding, callback) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${chunk.toString()}`);
    callback();
  }
}

const logger = new LoggerStream();
logger.write('Application started');
logger.write('Processing user request');
```

### Transform Streams

```javascript
const { Transform } = require('stream');
const fs = require('fs');

// Transform stream for uppercase conversion
class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    const upperCased = chunk.toString().toUpperCase();
    this.push(upperCased);
    callback();
  }
}

// Chain streams with pipe
fs.createReadStream('./input.txt')
  .pipe(new UpperCaseTransform())
  .pipe(fs.createWriteStream('./output-upper.txt'));

// JSON line parser transform
class JSONLineParser extends Transform {
  constructor() {
    super({ objectMode: true });
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          this.push(JSON.parse(line));
        } catch (err) {
          this.emit('error', new Error(`Invalid JSON: ${line}`));
        }
      }
    }
    callback();
  }

  _flush(callback) {
    if (this.buffer.trim()) {
      try {
        this.push(JSON.parse(this.buffer));
      } catch (err) {
        this.emit('error', new Error(`Invalid JSON: ${this.buffer}`));
      }
    }
    callback();
  }
}
```

### Pipeline and Backpressure

```javascript
const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const zlib = require('zlib');

const pipelineAsync = promisify(pipeline);

// Using pipeline for automatic error handling and cleanup
async function compressFile(input, output) {
  try {
    await pipelineAsync(
      fs.createReadStream(input),
      zlib.createGzip(),
      fs.createWriteStream(output)
    );
    console.log('Compression complete');
  } catch (err) {
    console.error('Compression failed:', err);
  }
}

// Manual backpressure handling
function copyWithBackpressure(src, dest) {
  const readStream = fs.createReadStream(src);
  const writeStream = fs.createWriteStream(dest);

  readStream.on('data', (chunk) => {
    const canContinue = writeStream.write(chunk);
    if (!canContinue) {
      // Buffer is full, pause reading
      readStream.pause();
    }
  });

  writeStream.on('drain', () => {
    // Buffer is empty, resume reading
    readStream.resume();
  });

  readStream.on('end', () => {
    writeStream.end();
  });
}

// Modern approach with pipeline
const { pipeline: pipelineCallback } = require('stream');

pipelineCallback(
  fs.createReadStream('./large-file.txt'),
  zlib.createGzip(),
  fs.createWriteStream('./large-file.txt.gz'),
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
    } else {
      console.log('Pipeline succeeded');
    }
  }
);
```

## Error Handling

### Synchronous Error Handling

```javascript
// try-catch for synchronous errors
function parseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('JSON parse failed:', err.message);
    return null;
  }
}

// Input validation
function divide(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Arguments must be numbers');
  }
  if (b === 0) {
    throw new RangeError('Cannot divide by zero');
  }
  return a / b;
}
```

### Asynchronous Error Handling

```javascript
const fs = require('fs').promises;

// Promise error handling with async/await
async function readConfig(path) {
  try {
    const data = await fs.readFile(path, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('Config file not found');
      return getDefaultConfig();
    }
    throw err; // Re-throw unknown errors
  }
}

// Error-first callback pattern
function readFileCallback(path, callback) {
  fs.readFile(path, 'utf8')
    .then(data => callback(null, data))
    .catch(err => callback(err, null));
}

// Global unhandled exception handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Log error, clean up resources
  process.exit(1); // Must exit the process
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  // Log error
});
```

### Custom Error Classes

```javascript
// Custom error hierarchy
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

class DatabaseError extends AppError {
  constructor(message, query) {
    super(message, 500, false); // Not operational - programming error
    this.name = 'DatabaseError';
    this.query = query;
  }
}

// Usage
function findUser(id) {
  const user = database.find(u => u.id === id);
  if (!user) {
    throw new NotFoundError('User');
  }
  return user;
}

// Centralized error handler
function errorHandler(err, req, res, next) {
  if (err.isOperational) {
    // Operational error: send to client
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  } else {
    // Programming error: log and send generic message
    console.error('PROGRAMMING ERROR:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
```

### EventEmitter Error Handling

```javascript
const EventEmitter = require('events');

const emitter = new EventEmitter();

// MUST listen to error events - otherwise process crashes
emitter.on('error', (err) => {
  console.error('Event error:', err.message);
});

emitter.emit('error', new Error('Something went wrong'));

// Stream error handling
const fs = require('fs');
const readStream = fs.createReadStream('./nonexistent.txt');

readStream.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('File not found');
  } else {
    console.error('Read error:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');

  // Close server, database connections, etc.
  await server.close();
  await database.disconnect();

  process.exit(0);
});
```

## Performance Optimization

### Memory Management

```javascript
// View memory usage
function printMemoryUsage() {
  const usage = process.memoryUsage();
  console.log({
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`, // Resident set size
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`, // Total heap
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`, // Used heap
    external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`, // C++ objects
    arrayBuffers: `${(usage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`
  });
}

// Adjust heap size
// node --max-old-space-size=4096 app.js // Set max heap to 4GB
```

### Avoiding Memory Leaks

```javascript
// 1. Avoid global variable accumulation
// BAD
global.cache = [];
function addToCache(item) {
  global.cache.push(item); // Grows indefinitely
}

// GOOD: Use LRU cache
const LRU = require('lru-cache');
const cache = new LRU({
  max: 500, // Maximum entries
  ttl: 1000 * 60 * 5 // 5 minute TTL
});

// 2. Avoid closure memory leaks
// BAD
function createHandler() {
  const largeData = new Array(1000000).fill('x');
  return function handler() {
    console.log(largeData.length); // Holds reference to largeData
  };
}

// GOOD: Only keep necessary data
function createHandler() {
  const largeData = new Array(1000000).fill('x');
  const length = largeData.length; // Only keep what's needed
  return function handler() {
    console.log(length);
  };
}

// 3. Clean up event listeners
const EventEmitter = require('events');
const emitter = new EventEmitter();

// Check listener count
emitter.setMaxListeners(20);
console.log(emitter.listenerCount('data'));

// Remove listeners when done
function cleanup() {
  emitter.removeAllListeners('data');
}

// 4. Clear timers
let timer = setInterval(() => {
  // Some operation
}, 1000);

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

// 5. Use WeakMap/WeakSet for automatic cleanup
const weakCache = new WeakMap();

function cacheResult(obj, result) {
  weakCache.set(obj, result);
  // When obj is garbage collected, cache entry is automatically removed
}
```

### Performance Best Practices

```javascript
// 1. Use streams for large files
const fs = require('fs');

// BAD - loads entire file into memory
const data = fs.readFileSync('./large-file.txt');

// GOOD - streams data in chunks
const readStream = fs.createReadStream('./large-file.txt');
readStream.pipe(process.stdout);

// 2. Avoid blocking the event loop
// BAD - synchronous CPU-intensive operation
function processData(data) {
  // Complex computation that blocks
  for (let i = 0; i < 1e9; i++) {
    // ...
  }
}

// GOOD - break up work or use worker threads
const { Worker } = require('worker_threads');

function processDataAsync(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', { workerData: data });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

// 3. Use connection pooling
const { Pool } = require('pg');
const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// 4. Implement caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minute default TTL

async function getUserById(id) {
  const cached = cache.get(`user:${id}`);
  if (cached) return cached;

  const user = await database.findUser(id);
  cache.set(`user:${id}`, user);
  return user;
}

// 5. Use async/await over callbacks (cleaner, easier to optimize)
// 6. Compress responses
const compression = require('compression');
app.use(compression());
```

## Clustering

Node.js runs in a single thread, but you can leverage multiple CPU cores using the cluster module.

### Basic Clustering

```javascript
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Restart worker
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });
} else {
  // Workers share TCP connection
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Hello from worker ${process.pid}\n`);
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}
```

### Production Clustering with PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api-server',
    script: './server.js',
    instances: 'max', // Use all available CPUs
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '1G',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};

// Start with: pm2 start ecosystem.config.js
```

### Worker Threads for CPU-Intensive Tasks

```javascript
// main.js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // Main thread
  function runWorker(data) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, { workerData: data });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  async function main() {
    const results = await Promise.all([
      runWorker({ start: 0, end: 1e7 }),
      runWorker({ start: 1e7, end: 2e7 }),
      runWorker({ start: 2e7, end: 3e7 }),
      runWorker({ start: 3e7, end: 4e7 })
    ]);
    console.log('Total:', results.reduce((a, b) => a + b, 0));
  }

  main();
} else {
  // Worker thread
  const { start, end } = workerData;
  let sum = 0;
  for (let i = start; i < end; i++) {
    sum += i;
  }
  parentPort.postMessage(sum);
}
```

### Shared Memory with Worker Threads

```javascript
const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // Create shared buffer
  const sharedBuffer = new SharedArrayBuffer(4);
  const sharedArray = new Int32Array(sharedBuffer);

  const worker = new Worker(__filename, {
    workerData: { sharedBuffer }
  });

  // Main thread can read/write
  setInterval(() => {
    console.log('Main thread sees:', sharedArray[0]);
  }, 1000);
} else {
  const { sharedBuffer } = require('worker_threads').workerData;
  const sharedArray = new Int32Array(sharedBuffer);

  // Worker increments shared value
  setInterval(() => {
    Atomics.add(sharedArray, 0, 1);
  }, 100);
}
```

## Interview Key Points

### Core Concept Questions

**1. Explain the Node.js event loop mechanism?**

The event loop is Node.js's mechanism for handling non-blocking I/O operations. It consists of six phases: timers, pending callbacks, idle/prepare, poll, check, and close callbacks. Each phase has a FIFO queue, and the event loop executes callbacks in each phase sequentially. Microtasks (process.nextTick, Promise callbacks) are processed between phases.

**2. What's the difference between process.nextTick() and setImmediate()?**

- `process.nextTick()` executes immediately after the current phase ends, with highest priority
- `setImmediate()` executes in the check phase
- `nextTick` can block the event loop; overuse may cause I/O starvation
- `setImmediate` is generally preferred for deferring work

**3. How does Node.js handle high concurrency?**

Through the single-threaded event loop combined with non-blocking I/O. Time-consuming I/O operations are delegated to the system kernel or libuv thread pool, while the main thread continues processing other requests. This model avoids multi-threading context switch overhead and is ideal for I/O-intensive applications.

**4. What operations use the thread pool?**

File system operations, DNS lookup, crypto operations (pbkdf2, randomBytes), and zlib compression use the thread pool. Network I/O uses OS async primitives (epoll/kqueue/IOCP) and doesn't use the thread pool.

**5. How do you prevent memory leaks in Node.js?**

- Use caching with size limits (LRU cache)
- Remove event listeners when no longer needed
- Clear timers and intervals
- Avoid closures holding references to large objects
- Use WeakMap/WeakSet for cache entries
- Monitor memory usage with process.memoryUsage()

### Practical Coding Questions

```javascript
// Implement a simple event emitter
class MyEventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event, ...args) {
    if (!this.events[event]) return false;
    this.events[event].forEach(listener => listener(...args));
    return true;
  }

  off(event, listener) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter(l => l !== listener);
    return this;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
    return this;
  }
}

// Implement Promise.all
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;

    if (promises.length === 0) {
      resolve([]);
      return;
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;
          completed++;
          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(reject);
    });
  });
}

// Implement async task executor with concurrency limit
async function asyncPool(limit, items, iteratorFn) {
  const results = [];
  const executing = new Set();

  for (const [index, item] of items.entries()) {
    const promise = Promise.resolve().then(() => iteratorFn(item, index));
    results.push(promise);

    const e = promise.then(() => executing.delete(e));
    executing.add(e);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

// Usage
const urls = ['url1', 'url2', 'url3', 'url4', 'url5'];
const results = await asyncPool(2, urls, async (url) => {
  const response = await fetch(url);
  return response.json();
});
```

### Performance Optimization Tips

1. **Use streams for large files** - avoid loading entire files into memory
2. **Implement caching wisely** - reduce repeated computation and I/O
3. **Use cluster module** to leverage multi-core CPUs
4. **Avoid synchronous operations** - especially in request handlers
5. **Use connection pooling** for database connections
6. **Monitor memory usage** and detect leaks early
7. **Profile your application** using built-in profiler or clinic.js

## Further Reading

### Official Resources

- [Node.js Official Documentation](https://nodejs.org/docs/latest/api/)
- [Node.js Best Practices Guide](https://github.com/goldbergyoni/nodebestpractices)
- [V8 Blog](https://v8.dev/blog)
- [libuv Documentation](http://docs.libuv.org/)

### Advanced Topics

- **Worker Threads**: Node.js multi-threading solution for CPU-intensive tasks
- **Cluster Module**: Utilize multi-core processors by creating child processes
- **Child Process**: Create child processes to execute system commands or run other programs
- **N-API**: Stable API for writing C/C++ native modules
- **AsyncLocalStorage**: Maintain context across async operations

### Related Frameworks

- **Express.js**: The most popular Node.js web framework
- **Koa.js**: Next-generation framework from the Express team
- **Fastify**: High-performance web framework
- **NestJS**: Enterprise-grade TypeScript framework
- **Hono**: Ultrafast web framework for the edge

### Debugging and Performance Tools

- **Node.js built-in debugger**: `node --inspect app.js`
- **Chrome DevTools**: Connect to Node.js process for debugging
- **clinic.js**: Performance diagnostic toolkit
- **0x**: Flame graph generation tool
- **heapdump**: Memory snapshot for analysis

### Books and Courses

- "Node.js Design Patterns" by Mario Casciaro
- "Distributed Systems with Node.js" by Thomas Hunter II
- "Node Cookbook" by Bethany Griggs

---

> We've covered the essential concepts and practical aspects of Node.js development. Deep understanding of the event loop, non-blocking I/O, and streams is key to mastering Node.js. Combine this theoretical knowledge with hands-on practice to solidify your understanding and build high-performance applications.
