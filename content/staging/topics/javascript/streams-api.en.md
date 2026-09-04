---
title: JavaScript Streams API Guide
description: "Understanding Streams API: ReadableStream, WritableStream, TransformStream, piping operations, and backpressure mechanisms"
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Streams
  - Async
  - Data Flow
  - Backpressure
status: imported
origin: old/src/content/docs/javascript/streams-api.en.md
divergence: 0.205
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 17
  lastUpdated: 2026-01-07
---

## Concept Explanation

The Streams API is a set of Web APIs for processing streaming data, allowing JavaScript to handle data progressively in chunks rather than loading all data into memory at once. This approach is particularly suitable for handling large files, network responses, and real-time data.

### What is a Stream?

A stream is an abstract data structure representing a sequence of data chunks arranged in order. Unlike traditional all-at-once data loading, streams allow you to:

- **Process data chunk by chunk**: Handle data immediately upon arrival without waiting for complete data
- **Reduce memory consumption**: Keep only the current processing chunk in memory
- **Improve response speed**: Begin processing and displaying data as soon as it arrives
- **Support infinite data**: Handle theoretically infinite-length data streams

### Historical Background

The Streams API was first proposed by WHATWG in 2014, inspired by Node.js's Stream module. As web applications handle increasingly large amounts of data, the traditional all-at-once loading model became insufficient. The Streams API filled the gap in browser-side streaming, integrating closely with the Fetch API and becoming a crucial part of modern web development.

### Problems Solved

1. **Large file handling**: Stream reading and processing of videos, audio, and large JSON files
2. **Real-time data**: Stream processing of WebSocket messages and server-sent events
3. **Memory optimization**: Preventing memory overflow from loading large amounts of data at once
4. **User experience**: Display while downloading, improving perceived performance

## Core Principles

### Three Basic Stream Types

The Streams API defines three basic stream types:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ ReadableStream  │────▶│ TransformStream │────▶│ WritableStream  │
│  (readable)     │     │   (transform)    │     │   (writable)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
    Data Source          Data Transform          Data Destination
```

1. **ReadableStream**: Data source where data can only be read
2. **WritableStream**: Data destination where data can only be written
3. **TransformStream**: Has both readable and writable ends for data transformation

### Internal Queue and Backpressure Mechanism

Each stream has an internal queue to buffer data chunks:

```
Producer ──▶ [Queue: chunk1, chunk2, chunk3, ...] ──▶ Consumer
              ▲                                      │
              └──────────── Backpressure Signal ─────────────┘
```

**Backpressure** is a core concept in stream processing:

- When the consumer processes slower than the producer, the queue grows continuously
- When the queue reaches the high water mark, a backpressure signal is sent to the producer
- The producer pauses production upon receiving the signal until the queue has space
- This mechanism prevents memory overflow and ensures stable system operation

### Queuing Strategy

The queuing strategy defines how the queue manages data chunks:

```javascript
// Count strategy: Calculate by number of data chunks
const countStrategy = new CountQueuingStrategy({ highWaterMark: 10 });

// Byte length strategy: Calculate by byte size
const byteStrategy = new ByteLengthQueuingStrategy({ highWaterMark: 1024 * 16 });
```

## Core Concepts

### ReadableStream Core Concepts

| Concept | Description |
|---------|-------------|
| Underlying Source | Actual data source defining start, pull, cancel methods |
| Controller | Controls stream state, provides enqueue, close, error methods |
| Reader | Used to read data from stream, includes default and BYOB readers |
| Locked | Stream enters locked state after being acquired by a reader, preventing creation of new readers |

### WritableStream Core Concepts

| Concept | Description |
|---------|-------------|
| Underlying Sink | Actual data target defining start, write, close, abort methods |
| Writer | Used to write data into the stream |
| Ready State | Indicates whether the stream is ready to receive the next data chunk |

### TransformStream Core Concepts

| Concept | Description |
|---------|-------------|
| Transformer | Defines data transformation logic, includes start, transform, flush methods |
| Readable End | Output end of transformed data |
| Writable End | Input end of original data |

## Code Examples

### Creating a ReadableStream

```javascript
// Create a simple readable stream
const readableStream = new ReadableStream({
  // Called when stream is initialized
  start(controller) {
    console.log('Stream started');
  },

  // Called when consumer requests data
  pull(controller) {
    // Generate data and enqueue
    const chunk = generateData();

    if (chunk === null) {
      // Data complete, close stream
      controller.close();
    } else {
      // Enqueue data chunk
      controller.enqueue(chunk);
    }
  },

  // Called when consumer cancels stream
  cancel(reason) {
    console.log('Stream cancelled:', reason);
  }
});

// Create a counter stream example
function createCounterStream(max) {
  let count = 0;

  return new ReadableStream({
    pull(controller) {
      if (count < max) {
        controller.enqueue(count);
        count++;
      } else {
        controller.close();
      }
    }
  });
}

// Use the counter stream
const counterStream = createCounterStream(5);
const reader = counterStream.getReader();

async function readAll() {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log('Read:', value); // 0, 1, 2, 3, 4
  }
}

readAll();
```

### Creating a WritableStream

```javascript
// Create a simple writable stream
const writableStream = new WritableStream({
  // Called when stream is initialized
  start(controller) {
    console.log('Writable stream started');
  },

  // Called when data is written
  write(chunk, controller) {
    console.log('Writing data:', chunk);
    // Can return Promise for asynchronous write
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Data processed:', chunk);
        resolve();
      }, 100);
    });
  },

  // Called when stream closes
  close() {
    console.log('Writable stream closed');
  },

  // Called when stream aborts
  abort(reason) {
    console.log('Writable stream aborted:', reason);
  }
});

// Use the writable stream
async function writeData() {
  const writer = writableStream.getWriter();

  try {
    await writer.write('Hello');
    await writer.write('World');
    await writer.close();
  } catch (error) {
    console.error('Write failed:', error);
  }
}

writeData();
```

### Creating a TransformStream

```javascript
// Create a transform stream that converts text to uppercase
const uppercaseTransform = new TransformStream({
  transform(chunk, controller) {
    // Transform data and output
    controller.enqueue(chunk.toUpperCase());
  }
});

// Create a JSON parsing transform stream
const jsonParseTransform = new TransformStream({
  transform(chunk, controller) {
    try {
      const parsed = JSON.parse(chunk);
      controller.enqueue(parsed);
    } catch (error) {
      controller.error(error);
    }
  }
});

// Create a line-splitting transform stream with buffering
function createLineSplitter() {
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const lines = buffer.split('\n');
      // Keep the last incomplete line
      buffer = lines.pop();
      // Output complete lines
      for (const line of lines) {
        if (line.trim()) {
          controller.enqueue(line);
        }
      }
    },

    flush(controller) {
      // Process remaining data when stream ends
      if (buffer.trim()) {
        controller.enqueue(buffer);
      }
    }
  });
}
```

### Piping Operations

```javascript
// Use pipeTo to connect readable stream to writable stream
async function pipeExample() {
  const readable = createCounterStream(10);

  const writable = new WritableStream({
    write(chunk) {
      console.log('Processing:', chunk);
    }
  });

  // pipeTo returns a Promise that resolves when stream completes or errors
  await readable.pipeTo(writable);
  console.log('Piping complete');
}

// Use pipeThrough for data transformation
async function pipeTransformExample() {
  const response = await fetch('/api/data.txt');

  // Text decoder transform
  const textDecoder = new TextDecoderStream();

  // Custom transformation
  const customTransform = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(`[Processed] ${chunk}`);
    }
  });

  // Chained piping
  const transformedStream = response.body
    .pipeThrough(textDecoder)
    .pipeThrough(customTransform);

  const reader = transformedStream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(value);
  }
}
```

### Fetch API and Streams Integration

```javascript
// Stream-based fetch response reading
async function streamFetch(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let result = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      console.log('Stream reading complete');
      break;
    }

    // value is Uint8Array
    const text = decoder.decode(value, { stream: true });
    result += text;
    console.log('Received chunk, current length:', result.length);
  }

  return result;
}

// Show download progress
async function downloadWithProgress(url, onProgress) {
  const response = await fetch(url);
  const contentLength = +response.headers.get('Content-Length');

  const reader = response.body.getReader();
  let receivedLength = 0;
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    onProgress({
      loaded: receivedLength,
      total: contentLength,
      percent: contentLength ? Math.round((receivedLength / contentLength) * 100) : 0
    });
  }

  // Merge all chunks
  const allChunks = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  return allChunks;
}

// Usage example
downloadWithProgress('/large-file.zip', ({ percent }) => {
  console.log(`Download progress: ${percent}%`);
});
```

### Stream-based Upload

```javascript
// Create a readable stream for uploading
function createUploadStream(data, chunkSize = 1024) {
  let offset = 0;

  return new ReadableStream({
    pull(controller) {
      if (offset >= data.length) {
        controller.close();
        return;
      }

      const chunk = data.slice(offset, offset + chunkSize);
      offset += chunkSize;
      controller.enqueue(chunk);
    }
  });
}

// Stream-based file upload
async function streamUpload(url, file) {
  const stream = file.stream();

  const response = await fetch(url, {
    method: 'POST',
    body: stream,
    headers: {
      'Content-Type': file.type,
      'Content-Length': file.size
    },
    // Note: Not all environments support streamed request bodies
    duplex: 'half'
  });

  return response.json();
}
```

### Async Iterator Pattern

```javascript
// Convert ReadableStream to async iterator
async function* streamToAsyncIterator(stream) {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

// Use for-await-of to iterate through stream
async function processStream(stream) {
  for await (const chunk of streamToAsyncIterator(stream)) {
    console.log('Processing chunk:', chunk);
  }
}

// Create ReadableStream from async iterator
function asyncIteratorToStream(asyncIterator) {
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await asyncIterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    }
  });
}
```

### Stream Branching (Tee)

```javascript
// Split one stream into two identical streams
async function teeExample() {
  const response = await fetch('/api/data');

  // tee() returns an array with two ReadableStreams
  const [stream1, stream2] = response.body.tee();

  // Two streams can be consumed independently
  const [result1, result2] = await Promise.all([
    processStream(stream1),
    cacheStream(stream2)
  ]);

  return result1;
}

async function processStream(stream) {
  const reader = stream.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return new Blob(chunks);
}

async function cacheStream(stream) {
  const reader = stream.getReader();
  const cache = await caches.open('my-cache');

  // Save stream to cache
  // ...
}
```

## Best Practices

### Always Release Reader Lock

```javascript
async function safeRead(stream) {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Process data
    }
  } finally {
    // Ensure lock is released even if an error occurs
    reader.releaseLock();
  }
}
```

### Set Appropriate High Water Mark

```javascript
// Set appropriate high water mark based on data characteristics
const stream = new ReadableStream(
  {
    pull(controller) {
      // Data production logic
    }
  },
  // For large data chunks, use byte length strategy
  new ByteLengthQueuingStrategy({ highWaterMark: 1024 * 64 }) // 64KB
);

// For small data chunks, use count strategy
const countStream = new ReadableStream(
  {
    pull(controller) {
      // Data production logic
    }
  },
  new CountQueuingStrategy({ highWaterMark: 10 }) // 10 chunks
);
```

### Handle Backpressure Correctly

```javascript
const writableStream = new WritableStream({
  async write(chunk, controller) {
    // Simulate slow processing
    await slowProcess(chunk);
    // The stream only requests the next chunk after the Promise resolves
  }
});

// Producers should respect backpressure signals
async function respectBackpressure(readable, writable) {
  const reader = readable.getReader();
  const writer = writable.getWriter();

  try {
    while (true) {
      // Wait for writable stream to be ready
      await writer.ready;

      const { done, value } = await reader.read();
      if (done) break;

      await writer.write(value);
    }

    await writer.close();
  } catch (error) {
    await writer.abort(error);
  } finally {
    reader.releaseLock();
    writer.releaseLock();
  }
}
```

### Use Piping to Simplify Code

```javascript
// Not recommended: manual reading and writing
async function manualTransfer(readable, writable) {
  const reader = readable.getReader();
  const writer = writable.getWriter();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writer.write(value);
    }
    await writer.close();
  } catch (error) {
    await writer.abort(error);
  }
}

// Recommended: use piping
async function pipeTransfer(readable, writable) {
  await readable.pipeTo(writable);
}
```

### Error Handling and Resource Cleanup

```javascript
async function robustStreamProcessing(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await processChunk(value);
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timeout');
    } else {
      console.error('Processing failed:', error);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
```

## Common Pitfalls

### Forgetting That Streams Can Only Be Consumed Once

```javascript
// Wrong example
async function wrongUsage() {
  const response = await fetch('/api/data');

  // First read
  const text = await response.text();

  // Error! Stream already consumed
  const json = await response.json(); // Throws error
}

// Correct example
async function correctUsage() {
  const response = await fetch('/api/data');

  // Clone response for multiple uses
  const clonedResponse = response.clone();

  const text = await response.text();
  const json = await clonedResponse.json();
}

// Or use tee()
async function teeUsage() {
  const response = await fetch('/api/data');
  const [stream1, stream2] = response.body.tee();

  // Both streams can be consumed independently
}
```

### Lock State Errors

```javascript
// Wrong example
async function lockError() {
  const stream = createReadableStream();

  const reader1 = stream.getReader(); // Stream is locked
  const reader2 = stream.getReader(); // Error! Stream is locked
}

// Correct example
async function correctLocking() {
  const stream = createReadableStream();

  const reader = stream.getReader();

  // Release lock after use
  reader.releaseLock();

  // Now we can create a new reader
  const newReader = stream.getReader();
}
```

### Unhandled Stream Cancellation

```javascript
// Potential resource leak
async function potentialLeak(stream) {
  const reader = stream.getReader();

  for (let i = 0; i < 10; i++) {
    const { value } = await reader.read();
    if (someCondition(value)) {
      return value; // Stream not closed, reader lock not released
    }
  }
}

// Correct handling
async function noLeak(stream) {
  const reader = stream.getReader();

  try {
    for (let i = 0; i < 10; i++) {
      const { value } = await reader.read();
      if (someCondition(value)) {
        // Cancel stream and release lock
        await reader.cancel();
        return value;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

### Error Propagation in Transform Streams

```javascript
// Wrong example: Errors not properly propagated
const badTransform = new TransformStream({
  transform(chunk, controller) {
    try {
      const result = riskyOperation(chunk);
      controller.enqueue(result);
    } catch (error) {
      console.error(error); // Error is silently swallowed
    }
  }
});

// Correct example: Use controller.error() to propagate errors
const goodTransform = new TransformStream({
  transform(chunk, controller) {
    try {
      const result = riskyOperation(chunk);
      controller.enqueue(result);
    } catch (error) {
      controller.error(error); // Error properly propagated
    }
  }
});
```

### Ignoring Backpressure Signals

```javascript
// Wrong example: Ignoring backpressure
async function ignoreBackpressure(readable, writable) {
  const reader = readable.getReader();
  const writer = writable.getWriter();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Error: Continue reading without waiting for write to complete
    writer.write(value); // No await
  }
}

// Correct example: Respect backpressure
async function respectBackpressure(readable, writable) {
  const reader = readable.getReader();
  const writer = writable.getWriter();

  while (true) {
    // Wait for writable stream to be ready
    await writer.ready;

    const { done, value } = await reader.read();
    if (done) {
      await writer.close();
      break;
    }

    // Wait for write to complete
    await writer.write(value);
  }
}
```

## Performance Considerations

### Memory Optimization

```javascript
// Processing large files with streams significantly reduces memory usage
async function processLargeFile(file) {
  // Traditional way: Load entire file into memory at once
  // const content = await file.text(); // Memory = file size

  // Stream-based way: Process chunk by chunk
  const stream = file.stream();
  const reader = stream.getReader();

  let processedSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Only process current chunk, constant memory usage
    await processChunk(value);
    processedSize += value.length;
  }

  return processedSize;
}
```

### High Water Mark Tuning

```javascript
// High water mark too low: Frequent pause/resume increases overhead
const tooLow = new ReadableStream(source, {
  highWaterMark: 1 // Each chunk may trigger backpressure
});

// High water mark too high: Increased memory consumption
const tooHigh = new ReadableStream(source, {
  highWaterMark: 1024 * 1024 * 100 // 100MB, may cause memory issues
});

// Balanced high water mark: Balance performance and memory
const balanced = new ReadableStream(source, {
  highWaterMark: 1024 * 64 // 64KB, suitable for most network scenarios
});
```

### Avoid Unnecessary Data Copying

```javascript
// Inefficient: Multiple transforms copy data
async function inefficient(stream) {
  const reader = stream.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Create new Uint8Array each time
    const copy = new Uint8Array(value);
    chunks.push(copy);
  }

  // Copy again to merge
  return concatenate(chunks);
}

// Efficient: Use BYOB reader to avoid copying
async function efficient(stream) {
  const reader = stream.getReader({ mode: 'byob' });
  const chunks = [];

  let buffer = new ArrayBuffer(1024 * 64);

  while (true) {
    const { done, value } = await reader.read(new Uint8Array(buffer));
    if (done) break;

    chunks.push(value);
    // Reuse buffer
    buffer = value.buffer;
  }

  return chunks;
}
```

### Batch Processing Optimization

```javascript
// Create batch processing transform stream
function createBatchTransform(batchSize = 10) {
  let batch = [];

  return new TransformStream({
    transform(chunk, controller) {
      batch.push(chunk);

      if (batch.length >= batchSize) {
        // Batch processing reduces function call overhead
        controller.enqueue(batch);
        batch = [];
      }
    },

    flush(controller) {
      if (batch.length > 0) {
        controller.enqueue(batch);
      }
    }
  });
}
```

## Real-world Scenarios

### Scenario One: Real-time Log Viewer

```javascript
class LogViewer {
  constructor(url) {
    this.url = url;
    this.abortController = null;
  }

  async start(onLog) {
    this.abortController = new AbortController();

    try {
      const response = await fetch(this.url, {
        signal: this.abortController.signal
      });

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(this.createLineSplitter())
        .getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const logEntry = this.parseLogLine(value);
        onLog(logEntry);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    }
  }

  stop() {
    this.abortController?.abort();
  }

  createLineSplitter() {
    let buffer = '';

    return new TransformStream({
      transform(chunk, controller) {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim()) {
            controller.enqueue(line);
          }
        }
      },

      flush(controller) {
        if (buffer.trim()) {
          controller.enqueue(buffer);
        }
      }
    });
  }

  parseLogLine(line) {
    // Parse log line
    const match = line.match(/\[(\w+)\] \[(.+)\] (.+)/);
    if (match) {
      return {
        level: match[1],
        timestamp: match[2],
        message: match[3]
      };
    }
    return { level: 'INFO', timestamp: new Date().toISOString(), message: line };
  }
}

// Usage example
const viewer = new LogViewer('/api/logs/stream');
viewer.start(log => {
  console.log(`[${log.level}] ${log.message}`);
});

// Stop viewing
// viewer.stop();
```

### Scenario Two: Large File Chunked Upload

```javascript
class ChunkedUploader {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1024 * 1024; // 1MB
    this.concurrency = options.concurrency || 3;
    this.onProgress = options.onProgress || (() => {});
  }

  async upload(file, uploadUrl) {
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    let uploadedChunks = 0;

    // Create chunk stream
    const chunkStream = this.createChunkStream(file);
    const reader = chunkStream.getReader();

    const uploadPromises = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const { index, data } = value;

      const uploadPromise = this.uploadChunk(uploadUrl, index, data, totalChunks)
        .then(() => {
          uploadedChunks++;
          this.onProgress({
            uploaded: uploadedChunks,
            total: totalChunks,
            percent: Math.round((uploadedChunks / totalChunks) * 100)
          });
        });

      uploadPromises.push(uploadPromise);

      // Control concurrency
      if (uploadPromises.length >= this.concurrency) {
        await Promise.race(uploadPromises);
        // Remove completed Promises
        const completed = uploadPromises.findIndex(p =>
          p.then(() => true).catch(() => true)
        );
        if (completed !== -1) {
          uploadPromises.splice(completed, 1);
        }
      }
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Notify server to merge file
    return this.completeUpload(uploadUrl, file.name, totalChunks);
  }

  createChunkStream(file) {
    const chunkSize = this.chunkSize;
    let offset = 0;
    let index = 0;

    return new ReadableStream({
      async pull(controller) {
        if (offset >= file.size) {
          controller.close();
          return;
        }

        const chunk = file.slice(offset, offset + chunkSize);
        const data = await chunk.arrayBuffer();

        controller.enqueue({
          index: index++,
          data: new Uint8Array(data)
        });

        offset += chunkSize;
      }
    });
  }

  async uploadChunk(url, index, data, total) {
    const response = await fetch(`${url}/chunk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Chunk-Index': index,
        'X-Total-Chunks': total
      },
      body: data
    });

    if (!response.ok) {
      throw new Error(`Failed to upload chunk ${index}`);
    }

    return response.json();
  }

  async completeUpload(url, filename, totalChunks) {
    const response = await fetch(`${url}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename, totalChunks })
    });

    return response.json();
  }
}

// Usage example
const uploader = new ChunkedUploader({
  chunkSize: 2 * 1024 * 1024, // 2MB
  concurrency: 5,
  onProgress: ({ percent }) => {
    console.log(`Upload progress: ${percent}%`);
  }
});

const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  await uploader.upload(file, '/api/upload');
});
```

### Scenario Three: Video Stream Processing

```javascript
class VideoStreamProcessor {
  constructor() {
    this.mediaSource = new MediaSource();
    this.sourceBuffer = null;
  }

  async init(videoElement) {
    return new Promise((resolve, reject) => {
      videoElement.src = URL.createObjectURL(this.mediaSource);

      this.mediaSource.addEventListener('sourceopen', () => {
        this.sourceBuffer = this.mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E"');
        resolve();
      });

      this.mediaSource.addEventListener('error', reject);
    });
  }

  async stream(url) {
    const response = await fetch(url);
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      await this.appendBuffer(value);
    }

    this.mediaSource.endOfStream();
  }

  appendBuffer(data) {
    return new Promise((resolve, reject) => {
      if (this.sourceBuffer.updating) {
        this.sourceBuffer.addEventListener('updateend', () => {
          this.appendBuffer(data).then(resolve).catch(reject);
        }, { once: true });
        return;
      }

      try {
        this.sourceBuffer.appendBuffer(data);
        this.sourceBuffer.addEventListener('updateend', resolve, { once: true });
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Usage example
const processor = new VideoStreamProcessor();
const video = document.querySelector('video');

await processor.init(video);
await processor.stream('/api/video/stream');
```

### Scenario Four: Server-Sent Events Parsing

```javascript
function createSSEParser() {
  let buffer = '';
  let event = { data: [], event: '', id: '' };

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line

      for (const line of lines) {
        if (line === '') {
          // Empty line marks event end
          if (event.data.length > 0) {
            controller.enqueue({
              type: event.event || 'message',
              data: event.data.join('\n'),
              id: event.id
            });
          }
          event = { data: [], event: '', id: '' };
        } else if (line.startsWith('data:')) {
          event.data.push(line.slice(5).trim());
        } else if (line.startsWith('event:')) {
          event.event = line.slice(6).trim();
        } else if (line.startsWith('id:')) {
          event.id = line.slice(3).trim();
        }
      }
    },

    flush(controller) {
      if (event.data.length > 0) {
        controller.enqueue({
          type: event.event || 'message',
          data: event.data.join('\n'),
          id: event.id
        });
      }
    }
  });
}

// Use custom SSE parser
async function connectSSE(url, onMessage) {
  const response = await fetch(url);

  const eventStream = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(createSSEParser());

  const reader = eventStream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    onMessage(value);
  }
}

// Usage example
connectSSE('/api/events', (event) => {
  console.log(`Received ${event.type} event:`, event.data);
});
```

## Interview Questions

### What is the Streams API and what problems does it solve?

**Answer Points**:
- Streams API is a Web API for processing streaming data
- Solves memory issues during large data transfers
- Supports streaming download and processing, improving user experience
- Coordinates producer and consumer speed through backpressure mechanism

### Explain the differences between ReadableStream, WritableStream, and TransformStream

**Answer Points**:
- ReadableStream: Data source, read-only
- WritableStream: Data destination, write-only
- TransformStream: Has both readable and writable ends for data transformation
- Three types can be connected via pipes to form a data processing chain

### What is backpressure and why is it important?

**Answer Points**:
- Backpressure is a flow control mechanism when consumer processes slower than producer
- Triggered by high water mark
- Prevents memory overflow and ensures system stability
- Implementation: Consumer controls producer pace through Promise return value

### How to implement streaming download progress display?

```javascript
async function downloadWithProgress(url) {
  const response = await fetch(url);
  const total = +response.headers.get('Content-Length');
  const reader = response.body.getReader();
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    loaded += value.length;
    console.log(`Progress: ${Math.round((loaded / total) * 100)}%`);
  }
}
```

### What is the difference between pipeTo and pipeThrough?

**Answer Points**:
- `pipeTo(writable)`: Connect readable stream to writable stream, returns Promise
- `pipeThrough(transform)`: Connect readable stream to transform stream, returns transformed readable stream
- pipeTo is for final destination, pipeThrough is for intermediate transformation
- pipeThrough supports chaining

### What does stream being locked mean and how to handle it?

**Answer Points**:
- Stream enters locked state when getReader() is called
- Cannot create new readers while locked
- Release lock via reader.releaseLock()
- Or create two independent streams using tee()

## Further Reading

### Official Documentation
- [WHATWG Streams Specification](https://streams.spec.whatwg.org/)
- [MDN Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
- [MDN ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [MDN WritableStream](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream)
- [MDN TransformStream](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream)

### Deep Learning
- [web.dev: Streams Guide](https://web.dev/streams/)
- [Jake Archibald: 2016 - the year of web streams](https://jakearchibald.com/2016/streams-ftw/)
- [Node.js Stream vs Web Streams Comparison](https://nodejs.org/api/webstreams.html)

### Related APIs
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API)
- [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
- [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)

### Browser Compatibility
- [Can I use: Streams](https://caniuse.com/streams)
- [Chrome Platform Status: Streams API](https://chromestatus.com/feature/5804334163951616)
