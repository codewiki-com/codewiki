---
title: Streams API
description: Process data incrementally with the Streams API
track: javascript
section: browser
difficulty: advanced
tags:
  - javascript
  - streams
  - readable-stream
  - writable-stream
status: imported
origin: old/src/content/docs/javascript/streams.en.md
divergence: 0.206
issues:
  - title-lang-zh
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
  - title-language
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 43
  lastUpdated: 2026-01-07
---

The Streams API provides an interface for reading and writing data streams incrementally, rather than loading entire datasets into memory. This is particularly useful for handling large files, network responses, or real-time data processing.

## Overview

Streams allow you to process data in chunks as they become available, improving performance and reducing memory consumption. The API consists of three main stream types: ReadableStream, WritableStream, and TransformStream.

### Key Benefits

- **Memory Efficiency**: Process data in chunks instead of loading everything into memory
- **Performance**: Start processing data before the entire resource is loaded
- **Real-time Processing**: Handle streaming data like video, audio, or network events
- **Backpressure Handling**: Automatically manage flow control between source and destination

## ReadableStream

A ReadableStream represents a source of data that can be read incrementally.

### Creating a ReadableStream

```javascript
const readableStream = new ReadableStream({
  start(controller) {
    // Called when stream is created
  },
  pull(controller) {
    // Called when stream needs more data
  },
  cancel(reason) {
    // Called when stream is cancelled
  }
});
```

### Basic Example

```javascript
// Create a simple readable stream
const readableStream = new ReadableStream({
  start(controller) {
    controller.enqueue('Hello ');
    controller.enqueue('World!');
    controller.close();
  }
});

// Read from the stream
const reader = readableStream.getReader();

async function read() {
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log(value);
    }
  } finally {
    reader.releaseLock();
  }
}

read();
```

### Streaming with Pull

```javascript
let count = 0;

const readableStream = new ReadableStream({
  pull(controller) {
    if (count < 5) {
      controller.enqueue(`Data chunk ${count}\n`);
      count++;
    } else {
      controller.close();
    }
  }
});

const reader = readableStream.getReader();

async function consume() {
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log(value);
    }
  } finally {
    reader.releaseLock();
  }
}

consume();
```

### Streaming Fetch Response

```javascript
fetch('https://example.com/large-file.json')
  .then(response => response.body) // response.body is a ReadableStream
  .then(stream => stream.getReader())
  .then(async (reader) => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log('Received chunk:', new TextDecoder().decode(value));
      }
    } finally {
      reader.releaseLock();
    }
  });
```

## WritableStream

A WritableStream represents a destination for data that can be written incrementally.

### Creating a WritableStream

```javascript
const writableStream = new WritableStream({
  write(chunk, controller) {
    // Process each chunk
  },
  close(controller) {
    // Called when stream is closed
  },
  abort(reason) {
    // Called when stream is aborted
  }
});
```

### Basic Example

```javascript
const writableStream = new WritableStream({
  write(chunk) {
    console.log('Writing chunk:', chunk);
  },
  close() {
    console.log('Stream closed');
  }
});

const writer = writableStream.getWriter();

async function write() {
  try {
    await writer.write('Hello ');
    await writer.write('World!');
    await writer.close();
  } catch (err) {
    console.error('Write error:', err);
  }
}

write();
```

### Writing to a File (Node.js Example)

```javascript
const fs = require('fs');

const writableStream = fs.createWriteStream('output.txt');

const writer = writableStream.getWriter ? writableStream.getWriter() : null;

// In Node.js, you can write directly
writableStream.write('Hello ');
writableStream.write('World!');
writableStream.end();

writableStream.on('finish', () => {
  console.log('File written successfully');
});
```

### Handling Backpressure

```javascript
const writableStream = new WritableStream({
  write(chunk) {
    console.log('Writing:', chunk);
    // Simulate slow write operation
    return new Promise(resolve => setTimeout(resolve, 100));
  }
});

const writer = writableStream.getWriter();

async function writeWithBackpressure() {
  try {
    for (let i = 0; i < 10; i++) {
      const desiredSize = writer.desiredSize;
      console.log(`Writing chunk ${i}, desired size: ${desiredSize}`);
      await writer.write(`Chunk ${i}\n`);
    }
    await writer.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

writeWithBackpressure();
```

## TransformStream

A TransformStream transforms data as it passes through, combining readable and writable sides.

### Creating a TransformStream

```javascript
const transformStream = new TransformStream({
  transform(chunk, controller) {
    // Transform and enqueue the chunk
  },
  flush(controller) {
    // Called at the end of the stream
  }
});
```

### Basic Example: Uppercase Transform

```javascript
const transformStream = new TransformStream({
  transform(chunk, controller) {
    const text = new TextDecoder().decode(chunk);
    controller.enqueue(new TextEncoder().encode(text.toUpperCase()));
  }
});
```

### Using pipe() with Streams

```javascript
// Pipe data from readable to transform to writable
readableStream
  .pipeThrough(transformStream)
  .pipeTo(writableStream)
  .then(() => {
    console.log('Piping complete');
  })
  .catch(err => {
    console.error('Pipe error:', err);
  });
```

### JSON Parsing Transform

```javascript
const jsonParseTransform = new TransformStream({
  transform(chunk, controller) {
    const text = new TextDecoder().decode(chunk);
    try {
      const json = JSON.parse(text);
      controller.enqueue(json);
    } catch (err) {
      controller.error(err);
    }
  }
});
```

### CSV to Objects Transform

```javascript
const csvTransform = new TransformStream({
  transform(chunk, controller) {
    const lines = new TextDecoder().decode(chunk).split('\n');
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index].trim();
      });
      controller.enqueue(obj);
    }
  }
});
```

## Streaming Fetch

Modern fetch API integration with streams enables efficient data handling.

### Reading Response Body as Stream

```javascript
async function fetchAndStream(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      console.log('Received:', text);
    }
  } finally {
    reader.releaseLock();
  }
}

fetchAndStream('https://example.com/data.json');
```

### Streaming with Progress Tracking

```javascript
async function fetchWithProgress(url) {
  const response = await fetch(url);
  const contentLength = parseInt(response.headers.get('content-length'), 10);
  let receivedLength = 0;

  const reader = response.body.getReader();
  const chunks = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      const progress = (receivedLength / contentLength) * 100;
      console.log(`Progress: ${progress.toFixed(2)}%`);
    }
  } finally {
    reader.releaseLock();
  }

  // Combine chunks
  const chunksAll = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }

  return chunksAll;
}

fetchWithProgress('https://example.com/large-file.zip');
```

### Streaming Upload

```javascript
async function uploadStream(file) {
  const response = await fetch('https://example.com/upload', {
    method: 'POST',
    body: file.stream()
  });

  return response.json();
}

// Usage with file input
document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  uploadStream(file);
});
```

## Advanced Patterns

### Tee Stream (Split Into Multiple Consumers)

```javascript
const [stream1, stream2] = originalStream.tee();

// Consume stream1
stream1.pipeTo(writable1);

// Consume stream2
stream2.pipeTo(writable2);
```

### Chaining Transforms

```javascript
fetch('data.csv')
  .then(response => response.body)
  .pipeThrough(csvTransform)
  .pipeThrough(filterTransform)
  .pipeThrough(mapTransform)
  .pipeTo(outputStream);
```

### Error Handling

```javascript
const reader = readableStream.getReader();

async function readWithErrorHandling() {
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log(value);
    }
  } catch (err) {
    console.error('Read error:', err);
  } finally {
    reader.releaseLock();
  }
}
```

### Cancelling Streams

```javascript
const reader = readableStream.getReader();

// Cancel the stream
reader.cancel('Operation cancelled by user');

// Or cancel via abort controller
const controller = new AbortController();
// Setup stream reading...
controller.abort(); // Cancel the operation
```

## Real-World Examples

### Processing Large JSON Arrays Line by Line

```javascript
async function processLargeJSON(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value);
      const lines = buffer.split('\n');

      // Process complete lines
      for (let i = 0; i < lines.length - 1; i++) {
        try {
          const data = JSON.parse(lines[i]);
          processRecord(data);
        } catch (err) {
          console.error('Parse error:', err);
        }
      }

      // Keep incomplete line in buffer
      buffer = lines[lines.length - 1];
    }
  } finally {
    reader.releaseLock();
  }
}

function processRecord(data) {
  console.log('Processing:', data);
}
```

### Video Streaming with Quality Adaptation

```javascript
async function adaptiveVideoStream(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();

  let bytesReceived = 0;
  const startTime = Date.now();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytesReceived += value.length;
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const bandwidth = bytesReceived / elapsedSeconds / 1024 / 1024; // MB/s

      // Adapt quality based on bandwidth
      if (bandwidth < 1) {
        console.log('Low bandwidth - reduce quality');
      } else if (bandwidth > 5) {
        console.log('High bandwidth - increase quality');
      }

      // Process video chunk
      processVideoChunk(value);
    }
  } finally {
    reader.releaseLock();
  }
}

function processVideoChunk(chunk) {
  // Send to video decoder or display
}
```

## Browser Support

The Streams API is supported in all modern browsers:
- Chrome 52+
- Firefox 57+
- Safari 10.1+
- Edge 79+

For Node.js, use the native `stream` module or polyfills for web standard streams.

## Best Practices

1. **Always Release Readers**: Use `reader.releaseLock()` in a finally block
2. **Handle Errors**: Implement proper error handling for stream operations
3. **Monitor Backpressure**: Check `writer.desiredSize` before writing
4. **Use Transforms for Processing**: Keep logic modular with transform streams
5. **Implement Cancellation**: Provide ways for users to cancel long-running streams
6. **Memory Management**: Don't accumulate chunks in memory unnecessarily

## Common Pitfalls

- **Not Releasing Locks**: Forgetting to call `releaseLock()` can prevent further reading
- **Ignoring Backpressure**: Writing too fast without waiting can cause memory issues
- **Error in Transform**: Uncaught errors in transform functions can silently fail
- **Large Chunks**: Creating very large chunks can defeat the purpose of streaming

## Conclusion

The Streams API is a powerful tool for handling large amounts of data efficiently in JavaScript. By understanding ReadableStream, WritableStream, and TransformStream, you can build applications that handle data more responsively and with better resource management. Whether streaming files, processing network responses, or transforming data in real-time, streams provide the foundation for scalable data handling.
