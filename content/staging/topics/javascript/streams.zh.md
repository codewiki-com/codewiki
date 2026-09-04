---
title: Streams API
description: 使用 Streams API 增量处理数据
track: javascript
section: browser
difficulty: advanced
tags:
  - javascript
  - streams
  - readable-stream
  - writable-stream
status: imported
origin: old/src/content/docs/javascript/streams.zh.md
divergence: 0.206
issues:
  - title-lang-zh
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
  - title-language
legacy:
  category: javascript
  subcategory: ""
  order: 43
  lastUpdated: 2026-01-07
---

Streams API 提供了一个接口，用于增量地读写数据流，而不是将整个数据集加载到内存中。这对于处理大型文件、网络响应或实时数据处理特别有用。

## 概述

Streams 允许您在数据可用时以分块形式处理数据，提高性能并减少内存消耗。该 API 包括三种主要的流类型：ReadableStream、WritableStream 和 TransformStream。

### 主要优势

- **内存高效**：分块处理数据而不是将所有内容加载到内存中
- **性能优化**：在整个资源加载完成之前就开始处理数据
- **实时处理**：处理视频、音频或网络事件等流式数据
- **背压处理**：自动管理源和目标之间的流控制

## ReadableStream

ReadableStream 代表可以增量读取的数据源。

### 创建 ReadableStream

```javascript
const readableStream = new ReadableStream({
  start(controller) {
    // 流创建时调用
  },
  pull(controller) {
    // 流需要更多数据时调用
  },
  cancel(reason) {
    // 流被取消时调用
  }
});
```

### 基本示例

```javascript
// 创建一个简单的可读流
const readableStream = new ReadableStream({
  start(controller) {
    controller.enqueue('Hello ');
    controller.enqueue('World!');
    controller.close();
  }
});

// 从流中读取
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

### 使用 Pull 进行流式处理

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

### 流式处理 Fetch 响应

```javascript
fetch('https://example.com/large-file.json')
  .then(response => response.body) // response.body 是一个 ReadableStream
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

WritableStream 代表可以增量写入数据的目标位置。

### 创建 WritableStream

```javascript
const writableStream = new WritableStream({
  write(chunk, controller) {
    // 处理每个分块
  },
  close(controller) {
    // 流关闭时调用
  },
  abort(reason) {
    // 流被中止时调用
  }
});
```

### 基本示例

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

### 写入文件（Node.js 示例）

```javascript
const fs = require('fs');

const writableStream = fs.createWriteStream('output.txt');

const writer = writableStream.getWriter ? writableStream.getWriter() : null;

// 在 Node.js 中，可以直接写入
writableStream.write('Hello ');
writableStream.write('World!');
writableStream.end();

writableStream.on('finish', () => {
  console.log('File written successfully');
});
```

### 处理背压

```javascript
const writableStream = new WritableStream({
  write(chunk) {
    console.log('Writing:', chunk);
    // 模拟缓慢的写入操作
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

TransformStream 在数据通过时进行转换，结合了可读和可写的两个方面。

### 创建 TransformStream

```javascript
const transformStream = new TransformStream({
  transform(chunk, controller) {
    // 转换并入队分块
  },
  flush(controller) {
    // 流结束时调用
  }
});
```

### 基本示例：大写转换

```javascript
const transformStream = new TransformStream({
  transform(chunk, controller) {
    const text = new TextDecoder().decode(chunk);
    controller.enqueue(new TextEncoder().encode(text.toUpperCase()));
  }
});
```

### 使用 pipe() 连接流

```javascript
// 从可读流通过转换流管道到可写流
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

### JSON 解析转换

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

### CSV 转对象转换

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

现代 Fetch API 与流的集成可以实现高效的数据处理。

### 将响应体作为流读取

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

### 带进度跟踪的流式传输

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

  // 合并分块
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

### 流式上传

```javascript
async function uploadStream(file) {
  const response = await fetch('https://example.com/upload', {
    method: 'POST',
    body: file.stream()
  });

  return response.json();
}

// 与文件输入一起使用
document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  uploadStream(file);
});
```

## 高级模式

### Tee Stream（分流到多个消费者）

```javascript
const [stream1, stream2] = originalStream.tee();

// 消费 stream1
stream1.pipeTo(writable1);

// 消费 stream2
stream2.pipeTo(writable2);
```

### 链接转换

```javascript
fetch('data.csv')
  .then(response => response.body)
  .pipeThrough(csvTransform)
  .pipeThrough(filterTransform)
  .pipeThrough(mapTransform)
  .pipeTo(outputStream);
```

### 错误处理

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

### 取消流

```javascript
const reader = readableStream.getReader();

// 取消流
reader.cancel('Operation cancelled by user');

// 或通过 abort controller 取消
const controller = new AbortController();
// 设置流读取...
controller.abort(); // 取消操作
```

## 实际应用示例

### 逐行处理大型 JSON 数组

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

      // 处理完整的行
      for (let i = 0; i < lines.length - 1; i++) {
        try {
          const data = JSON.parse(lines[i]);
          processRecord(data);
        } catch (err) {
          console.error('Parse error:', err);
        }
      }

      // 将不完整的行保留在缓冲区中
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

### 带质量自适应的视频流

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

      // 基于带宽调整质量
      if (bandwidth < 1) {
        console.log('Low bandwidth - reduce quality');
      } else if (bandwidth > 5) {
        console.log('High bandwidth - increase quality');
      }

      // 处理视频分块
      processVideoChunk(value);
    }
  } finally {
    reader.releaseLock();
  }
}

function processVideoChunk(chunk) {
  // 发送到视频解码器或显示
}
```

## 浏览器支持

Streams API 在所有现代浏览器中都得到支持：
- Chrome 52+
- Firefox 57+
- Safari 10.1+
- Edge 79+

对于 Node.js，使用原生 `stream` 模块或 web 标准流的 polyfills。

## 最佳实践

1. **始终释放读取器**：在 finally 块中使用 `reader.releaseLock()`
2. **处理错误**：为流操作实施适当的错误处理
3. **监控背压**：在写入前检查 `writer.desiredSize`
4. **使用转换进行处理**：使用转换流保持逻辑的模块化
5. **实现取消**：为用户提供取消长时间运行流的方式
6. **内存管理**：不要不必要地在内存中累积分块

## 常见陷阱

- **未释放锁**：忘记调用 `releaseLock()` 会阻止进一步读取
- **忽略背压**：过快写入而不等待会导致内存问题
- **转换中的错误**：转换函数中未捕获的错误可能会无声地失败
- **大型分块**：创建非常大的分块会抵消流的优势

## 总结

Streams API 是在 JavaScript 中高效处理大量数据的强大工具。通过理解 ReadableStream、WritableStream 和 TransformStream，您可以构建响应更灵敏且资源管理更好的应用程序。无论是流式传输文件、处理网络响应还是实时转换数据，流提供了可扩展数据处理的基础。
