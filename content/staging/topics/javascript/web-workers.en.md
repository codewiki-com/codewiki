---
title: Web Workers Multithreading
description: Deep dive into Web Workers for frontend multithreading
track: javascript
section: browser
difficulty: intermediate
tags:
  - Web Workers
  - multithreading
  - Service Worker
  - SharedWorker
status: imported
origin: old/src/content/docs/frontend/web-workers.en.md
divergence: 0.287
issues: []
legacy:
  category: Frontend
  subcategory: Browser
  order: 31
  lastUpdated: 2026-01-07
---

JavaScript is single-threaded by design, meaning all code executes on a single main thread. While this simplifies programming and prevents race conditions, it creates a significant limitation: CPU-intensive operations can block the main thread, causing the UI to freeze and become unresponsive. Web Workers provide a solution by enabling true parallel execution in separate background threads.

## Understanding the Need for Workers

### The Main Thread Bottleneck

The browser's main thread handles many responsibilities:

- JavaScript execution
- DOM rendering and layout
- User interaction events (clicks, scrolls, keyboard)
- CSS animations and transitions
- Garbage collection

When JavaScript performs heavy computation, everything else must wait:

```javascript
// This blocks the entire UI for several seconds
function calculatePrimes(limit) {
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    let isPrime = true;
    for (let j = 2; j < i; j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(i);
  }
  return primes;
}

// User clicks a button - UI freezes until complete
button.addEventListener('click', () => {
  const result = calculatePrimes(1000000); // UI is unresponsive
  console.log(result);
});
```

### What Web Workers Solve

Web Workers run JavaScript in a separate thread, completely isolated from the main thread. This allows:

- Heavy computations without blocking the UI
- Parallel processing of data
- Background tasks (syncing, prefetching)
- Responsive user interfaces during intensive operations

```javascript
// With a Web Worker - UI stays responsive
const worker = new Worker('prime-worker.js');

button.addEventListener('click', () => {
  worker.postMessage({ limit: 1000000 });
  // UI remains interactive
});

worker.onmessage = (event) => {
  console.log('Primes calculated:', event.data);
};
```

## Types of Web Workers

### Overview Comparison

| Worker Type | Scope | Use Case | Browser Support |
|-------------|-------|----------|-----------------|
| Dedicated Worker | Single script | General computation | All modern browsers |
| Shared Worker | Multiple scripts/tabs | Shared state between tabs | Limited (no Safari) |
| Service Worker | Entire origin | Offline, caching, push | All modern browsers |

### Dedicated Workers

Dedicated Workers are the most common type. They belong exclusively to the script that creates them and communicate through a simple message-passing interface.

```javascript
// main.js - Creating a dedicated worker
const worker = new Worker('worker.js');

// Send data to the worker
worker.postMessage({ task: 'process', data: [1, 2, 3, 4, 5] });

// Receive results
worker.onmessage = (event) => {
  console.log('Result:', event.data);
};

// Handle errors
worker.onerror = (error) => {
  console.error('Worker error:', error.message);
};

// Terminate when done
worker.terminate();
```

```javascript
// worker.js - The dedicated worker script
self.onmessage = (event) => {
  const { task, data } = event.data;

  if (task === 'process') {
    const result = data.map(x => x * 2);
    self.postMessage(result);
  }
};
```

### Shared Workers

Shared Workers can be accessed by multiple scripts, even across different browser tabs or iframes (same origin). They are useful for maintaining shared state or reducing resource usage.

```javascript
// main.js (can run in multiple tabs)
const sharedWorker = new SharedWorker('shared-worker.js');

// Must explicitly start the port
sharedWorker.port.start();

// Send messages through the port
sharedWorker.port.postMessage({ action: 'increment' });

// Receive messages through the port
sharedWorker.port.onmessage = (event) => {
  console.log('Shared counter:', event.data.count);
};
```

```javascript
// shared-worker.js
let counter = 0;
const connections = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);

  port.onmessage = (e) => {
    if (e.data.action === 'increment') {
      counter++;
      // Broadcast to all connected ports
      connections.forEach(p => {
        p.postMessage({ count: counter });
      });
    }
  };

  port.start();
};
```

### Service Workers

Service Workers act as a programmable network proxy between the web application and the network. They enable offline functionality, background sync, and push notifications.

```javascript
// main.js - Registering a service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
      console.log('Service Worker registered:', registration.scope);
    })
    .catch(error => {
      console.error('Registration failed:', error);
    });
}
```

```javascript
// service-worker.js
const CACHE_NAME = 'my-app-v1';
const urlsToCache = [
  '/',
  '/styles.css',
  '/script.js',
  '/offline.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return cached version
        }
        return fetch(event.request); // Fetch from network
      })
      .catch(() => {
        return caches.match('/offline.html');
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});
```

## Creating and Communicating with Workers

### Basic Worker Creation

Workers can be created from a separate file or from inline code using Blob URLs:

```javascript
// Method 1: External file
const worker = new Worker('worker.js');

// Method 2: Inline worker using Blob
const workerCode = `
  self.onmessage = (e) => {
    const result = e.data * 2;
    self.postMessage(result);
  };
`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));

// Method 3: ES Modules (modern approach)
const moduleWorker = new Worker('worker.js', { type: 'module' });
```

### Message Passing

Workers communicate with the main thread through message passing. The `postMessage` API handles serialization automatically:

```javascript
// main.js
const worker = new Worker('worker.js');

// Sending different data types
worker.postMessage('Hello'); // String
worker.postMessage(42); // Number
worker.postMessage({ name: 'Alice', age: 30 }); // Object
worker.postMessage([1, 2, 3]); // Array

// Receiving messages
worker.onmessage = (event) => {
  console.log('Received:', event.data);
};

// Alternative: addEventListener syntax
worker.addEventListener('message', (event) => {
  console.log('Received:', event.data);
});
```

```javascript
// worker.js
self.onmessage = (event) => {
  const data = event.data;

  // Process and respond
  if (typeof data === 'string') {
    self.postMessage(data.toUpperCase());
  } else if (typeof data === 'number') {
    self.postMessage(data * 2);
  } else if (Array.isArray(data)) {
    self.postMessage(data.reduce((a, b) => a + b, 0));
  } else {
    self.postMessage({ received: data });
  }
};
```

### Error Handling

Proper error handling is essential for robust worker implementations:

```javascript
// main.js
const worker = new Worker('worker.js');

worker.onerror = (error) => {
  console.error('Worker error:', {
    message: error.message,
    filename: error.filename,
    lineno: error.lineno,
    colno: error.colno
  });
  error.preventDefault(); // Prevent default error handling
};

// For unhandled rejections in module workers
worker.onmessageerror = (error) => {
  console.error('Message deserialization error:', error);
};
```

```javascript
// worker.js - Error handling inside worker
self.onmessage = async (event) => {
  try {
    const result = await processData(event.data);
    self.postMessage({ success: true, data: result });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message
    });
  }
};

// Catch unhandled errors
self.onerror = (error) => {
  console.error('Unhandled error in worker:', error);
};
```

### Bidirectional Communication Pattern

Implementing a request-response pattern with message IDs:

```javascript
// main.js - Worker wrapper with Promise-based API
class WorkerClient {
  constructor(workerPath) {
    this.worker = new Worker(workerPath);
    this.pendingRequests = new Map();
    this.messageId = 0;

    this.worker.onmessage = (event) => {
      const { id, result, error } = event.data;
      const pending = this.pendingRequests.get(id);

      if (pending) {
        this.pendingRequests.delete(id);
        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(result);
        }
      }
    };
  }

  request(action, payload) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({ id, action, payload });
    });
  }

  terminate() {
    this.worker.terminate();
  }
}

// Usage
const client = new WorkerClient('worker.js');

async function processData() {
  try {
    const result = await client.request('calculate', { numbers: [1, 2, 3] });
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

```javascript
// worker.js - Matching request-response handler
const handlers = {
  calculate: ({ numbers }) => {
    return numbers.reduce((a, b) => a + b, 0);
  },
  transform: ({ text }) => {
    return text.toUpperCase();
  }
};

self.onmessage = async (event) => {
  const { id, action, payload } = event.data;

  try {
    const handler = handlers[action];
    if (!handler) {
      throw new Error(`Unknown action: ${action}`);
    }
    const result = await handler(payload);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
```

## Transferable Objects

### The Copying Problem

By default, `postMessage` creates a deep copy of data using the structured clone algorithm. For large data, this is slow and doubles memory usage:

```javascript
// Slow: Creates a copy of the entire array
const largeArray = new Float64Array(10000000); // 80MB
worker.postMessage(largeArray); // Copies all 80MB
// Now both main thread and worker have 80MB each = 160MB total
```

### Using Transferable Objects

Transferable objects can be transferred instead of copied, moving ownership from one context to another. The original becomes unusable (neutered):

```javascript
// Fast: Transfers ownership (zero-copy)
const largeArray = new Float64Array(10000000);

worker.postMessage(largeArray, [largeArray.buffer]);
// largeArray.byteLength is now 0 - it has been transferred

console.log(largeArray.byteLength); // 0 - array is neutered
```

### Types of Transferable Objects

| Type | Description |
|------|-------------|
| ArrayBuffer | Raw binary data buffer |
| MessagePort | For port-based communication |
| ImageBitmap | Bitmap image data |
| OffscreenCanvas | Canvas for off-screen rendering |
| ReadableStream | Readable byte stream |
| WritableStream | Writable byte stream |
| TransformStream | Transform stream |

### Practical Transfer Examples

```javascript
// main.js - Transferring an ArrayBuffer
function processImageData(imageData) {
  // Convert ImageData to transferable ArrayBuffer
  const buffer = imageData.data.buffer;

  worker.postMessage({
    width: imageData.width,
    height: imageData.height,
    buffer: buffer
  }, [buffer]); // Transfer the buffer
}

// Receiving transferred data back
worker.onmessage = (event) => {
  const { width, height, buffer } = event.data;
  const processedData = new ImageData(
    new Uint8ClampedArray(buffer),
    width,
    height
  );
  ctx.putImageData(processedData, 0, 0);
};
```

```javascript
// worker.js - Working with transferred buffer
self.onmessage = (event) => {
  const { width, height, buffer } = event.data;
  const pixels = new Uint8ClampedArray(buffer);

  // Apply grayscale filter
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
    pixels[i] = gray;     // R
    pixels[i + 1] = gray; // G
    pixels[i + 2] = gray; // B
    // Alpha unchanged
  }

  // Transfer back to main thread
  self.postMessage({ width, height, buffer }, [buffer]);
};
```

### OffscreenCanvas for Graphics Workers

OffscreenCanvas allows canvas rendering entirely within a worker:

```javascript
// main.js
const canvas = document.getElementById('myCanvas');
const offscreen = canvas.transferControlToOffscreen();

const worker = new Worker('canvas-worker.js');
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

```javascript
// canvas-worker.js
let ctx;
let animationId;

self.onmessage = (event) => {
  const { canvas } = event.data;
  ctx = canvas.getContext('2d');

  // Render loop runs entirely in worker
  function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw animated particles
    const time = performance.now() / 1000;
    for (let i = 0; i < 100; i++) {
      const x = Math.sin(time + i) * 100 + canvas.width / 2;
      const y = Math.cos(time + i * 0.7) * 100 + canvas.height / 2;
      ctx.fillStyle = `hsl(${i * 3.6}, 100%, 50%)`;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    animationId = requestAnimationFrame(render);
  }

  render();
};
```

## Use Cases and Patterns

### CPU-Intensive Computations

Offload heavy calculations to prevent UI freezing:

```javascript
// main.js - Image processing example
const worker = new Worker('image-processor.js');

async function applyFilter(imageElement, filterType) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  ctx.drawImage(imageElement, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    worker.onmessage = (event) => {
      const result = new ImageData(
        new Uint8ClampedArray(event.data.buffer),
        event.data.width,
        event.data.height
      );
      resolve(result);
    };

    worker.postMessage({
      buffer: imageData.data.buffer,
      width: imageData.width,
      height: imageData.height,
      filter: filterType
    }, [imageData.data.buffer]);
  });
}
```

### Data Processing Pipelines

Process large datasets without blocking:

```javascript
// main.js - CSV parsing worker
const worker = new Worker('csv-worker.js');

async function parseCSV(csvText) {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.records);
      }
    };

    worker.postMessage({ csv: csvText });
  });
}

// Usage with progress updates
worker.onmessage = (event) => {
  if (event.data.type === 'progress') {
    updateProgressBar(event.data.percent);
  } else if (event.data.type === 'complete') {
    displayResults(event.data.records);
  }
};
```

```javascript
// csv-worker.js
self.onmessage = (event) => {
  const { csv } = event.data;
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const record = {};
    headers.forEach((header, index) => {
      record[header.trim()] = values[index]?.trim();
    });
    records.push(record);

    // Report progress every 1000 records
    if (i % 1000 === 0) {
      self.postMessage({
        type: 'progress',
        percent: Math.round((i / lines.length) * 100)
      });
    }
  }

  self.postMessage({ type: 'complete', records });
};
```

### Worker Pool Pattern

Manage multiple workers for parallel processing:

```javascript
// worker-pool.js
class WorkerPool {
  constructor(workerPath, size = navigator.hardwareConcurrency || 4) {
    this.workers = [];
    this.queue = [];
    this.activeWorkers = new Set();

    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerPath);
      this.workers.push(worker);
    }
  }

  execute(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };

      const availableWorker = this.workers.find(
        w => !this.activeWorkers.has(w)
      );

      if (availableWorker) {
        this.runTask(availableWorker, task);
      } else {
        this.queue.push(task);
      }
    });
  }

  runTask(worker, task) {
    this.activeWorkers.add(worker);

    const handleMessage = (event) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      this.activeWorkers.delete(worker);

      task.resolve(event.data);
      this.processQueue();
    };

    const handleError = (error) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      this.activeWorkers.delete(worker);

      task.reject(error);
      this.processQueue();
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage(task.data);
  }

  processQueue() {
    if (this.queue.length > 0) {
      const availableWorker = this.workers.find(
        w => !this.activeWorkers.has(w)
      );
      if (availableWorker) {
        const task = this.queue.shift();
        this.runTask(availableWorker, task);
      }
    }
  }

  terminate() {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.queue = [];
  }
}

// Usage
const pool = new WorkerPool('computation-worker.js', 4);

// Process multiple items in parallel
async function processItems(items) {
  const results = await Promise.all(
    items.map(item => pool.execute(item))
  );
  return results;
}
```

### Real-Time Data Processing

Handle streaming data in the background:

```javascript
// main.js - WebSocket data processing
const dataWorker = new Worker('data-processor.js');
const socket = new WebSocket('wss://api.example.com/stream');

socket.onmessage = (event) => {
  // Forward raw data to worker for processing
  dataWorker.postMessage(event.data);
};

dataWorker.onmessage = (event) => {
  // Display processed results
  updateDashboard(event.data);
};
```

```javascript
// data-processor.js
let buffer = [];
const BATCH_SIZE = 100;

self.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // Aggregate data
  buffer.push(data);

  // Process in batches
  if (buffer.length >= BATCH_SIZE) {
    const processed = analyzeData(buffer);
    self.postMessage(processed);
    buffer = [];
  }
};

function analyzeData(records) {
  return {
    count: records.length,
    average: records.reduce((sum, r) => sum + r.value, 0) / records.length,
    max: Math.max(...records.map(r => r.value)),
    min: Math.min(...records.map(r => r.value)),
    timestamp: Date.now()
  };
}
```

## Performance Considerations

### When to Use Workers

Workers add overhead, so they are not always the best solution:

**Use Workers When:**
- Computation takes more than 50ms
- Processing large datasets (parsing, transforming)
- Real-time data processing (audio, video, sensors)
- Complex algorithms (compression, encryption, ML inference)
- Background tasks that should not interrupt user interaction

**Avoid Workers When:**
- Simple, fast operations (< 10ms)
- Frequent small updates (message overhead dominates)
- Operations that need direct DOM access
- Simple event handling

### Measuring Worker Performance

```javascript
// main.js - Benchmarking worker vs main thread
async function benchmark() {
  const data = generateLargeDataset(1000000);

  // Main thread execution
  const mainStart = performance.now();
  processDataSync(data);
  const mainTime = performance.now() - mainStart;

  // Worker execution
  const workerStart = performance.now();
  await processDataWithWorker(data);
  const workerTime = performance.now() - workerStart;

  console.log(`Main thread: ${mainTime.toFixed(2)}ms`);
  console.log(`Worker: ${workerTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(mainTime / workerTime).toFixed(2)}x`);
}
```

### Reducing Message Overhead

```javascript
// Bad: Many small messages
for (const item of items) {
  worker.postMessage(item); // High overhead
}

// Good: Batch messages
worker.postMessage(items); // Single message with all data

// Even better: Use SharedArrayBuffer for shared memory
const shared = new SharedArrayBuffer(1024 * 1024);
const view = new Float64Array(shared);

// Both main thread and worker can access the same memory
worker.postMessage({ buffer: shared });
```

### SharedArrayBuffer and Atomics

For true shared memory between threads (requires COOP/COEP headers):

```javascript
// main.js
// Note: Requires Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers
const shared = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
const syncArray = new Int32Array(shared);

const worker = new Worker('atomic-worker.js');
worker.postMessage({ shared });

// Wait for worker to signal completion
Atomics.wait(syncArray, 0, 0); // Blocks until value changes
console.log('Worker signaled:', syncArray[1]);
```

```javascript
// atomic-worker.js
self.onmessage = (event) => {
  const { shared } = event.data;
  const syncArray = new Int32Array(shared);

  // Do work...
  syncArray[1] = 42;

  // Signal completion
  Atomics.store(syncArray, 0, 1);
  Atomics.notify(syncArray, 0, 1);
};
```

## Browser Compatibility and Debugging

### Feature Detection

```javascript
// Check for worker support
if (typeof Worker !== 'undefined') {
  // Dedicated Workers supported
}

if (typeof SharedWorker !== 'undefined') {
  // Shared Workers supported (not Safari)
}

if ('serviceWorker' in navigator) {
  // Service Workers supported
}

if (typeof SharedArrayBuffer !== 'undefined') {
  // SharedArrayBuffer supported (requires secure context + headers)
}

// Full feature detection helper
const workerFeatures = {
  dedicatedWorker: typeof Worker !== 'undefined',
  sharedWorker: typeof SharedWorker !== 'undefined',
  serviceWorker: 'serviceWorker' in navigator,
  transferable: (() => {
    try {
      const ab = new ArrayBuffer(1);
      new Worker(URL.createObjectURL(new Blob([''])))
        .postMessage(ab, [ab]);
      return ab.byteLength === 0;
    } catch {
      return false;
    }
  })(),
  sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
  atomics: typeof Atomics !== 'undefined'
};
```

### Debugging Workers

Workers can be debugged in browser DevTools:

1. **Chrome**: Sources panel > Page > Workers folder
2. **Firefox**: Debugger > Workers section
3. **Console**: Worker console output appears in main console

```javascript
// Add debugging helpers to workers
// worker.js
self.log = (...args) => {
  self.postMessage({ type: 'log', args });
};

self.error = (...args) => {
  self.postMessage({ type: 'error', args });
};

// Use in worker code
self.log('Processing started', data.length);
```

### Common Pitfalls

```javascript
// Pitfall 1: Trying to access DOM
// worker.js
document.getElementById('myElement'); // ReferenceError: document is not defined

// Pitfall 2: Forgetting to terminate workers
const worker = new Worker('worker.js');
// ... use worker ...
// Always terminate when done:
worker.terminate();

// Pitfall 3: Not handling worker errors
worker.onerror = (error) => {
  console.error('Worker failed:', error);
  // Implement fallback or retry logic
};

// Pitfall 4: Blocking worker with synchronous operations
// worker.js - Bad
const xhr = new XMLHttpRequest();
xhr.open('GET', url, false); // Synchronous - blocks worker
xhr.send();

// worker.js - Good
fetch(url).then(response => response.json());
```

## Modern Worker Patterns

### Module Workers

Use ES modules in workers for better code organization:

```javascript
// main.js
const worker = new Worker('worker.js', { type: 'module' });
```

```javascript
// worker.js (ES module)
import { processData } from './utils.js';
import { CONFIG } from './config.js';

self.onmessage = async (event) => {
  const result = await processData(event.data, CONFIG);
  self.postMessage(result);
};
```

### Comlink: Simplified Worker Communication

Using Comlink library for a more intuitive API:

```javascript
// main.js
import * as Comlink from 'comlink';

const worker = new Worker('worker.js');
const api = Comlink.wrap(worker);

// Call worker functions directly
const result = await api.calculateSum([1, 2, 3, 4, 5]);
console.log(result); // 15
```

```javascript
// worker.js
import * as Comlink from 'comlink';

const api = {
  calculateSum(numbers) {
    return numbers.reduce((a, b) => a + b, 0);
  },

  async processAsync(data) {
    // Async operations work naturally
    return await heavyComputation(data);
  }
};

Comlink.expose(api);
```

### Worklet API (Audio and Animation)

Specialized workers for high-performance audio and animation:

```javascript
// Audio Worklet for real-time audio processing
class GainProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < input.length; channel++) {
      for (let i = 0; i < input[channel].length; i++) {
        output[channel][i] = input[channel][i] * 0.5;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('gain-processor', GainProcessor);
```

## Best Practices Summary

### Worker Lifecycle Management

```javascript
// WorkerManager - Clean lifecycle handling
class WorkerManager {
  constructor() {
    this.workers = new Map();
  }

  create(name, path) {
    if (this.workers.has(name)) {
      console.warn(`Worker ${name} already exists`);
      return this.workers.get(name);
    }

    const worker = new Worker(path);
    this.workers.set(name, worker);

    worker.onerror = (error) => {
      console.error(`Worker ${name} error:`, error);
    };

    return worker;
  }

  get(name) {
    return this.workers.get(name);
  }

  terminate(name) {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
    }
  }

  terminateAll() {
    this.workers.forEach((worker, name) => {
      worker.terminate();
    });
    this.workers.clear();
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  workerManager.terminateAll();
});
```

### Key Takeaways

1. **Choose the right worker type**: Dedicated for single-script use, Shared for cross-tab state, Service for offline/caching

2. **Use transferable objects**: Avoid copying large data by transferring ArrayBuffers

3. **Implement proper error handling**: Workers fail silently without error handlers

4. **Consider message overhead**: Batch messages for better performance

5. **Clean up workers**: Always terminate workers when done to free resources

6. **Use worker pools**: For parallel processing of multiple tasks

7. **Profile before optimizing**: Measure actual performance impact before adding worker complexity

8. **Graceful degradation**: Provide fallbacks when workers are not available

---

Web Workers unlock true parallelism in JavaScript, enabling responsive applications even during intensive computations. By understanding the different worker types, mastering communication patterns, and following performance best practices, you can build web applications that remain smooth and interactive regardless of computational load. Start with simple use cases like offloading heavy calculations, then explore more advanced patterns like worker pools and shared memory as your needs grow.
