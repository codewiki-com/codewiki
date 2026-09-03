---
title: JavaScript Streams API 详解
description: 深入理解 Streams API：ReadableStream、WritableStream、TransformStream、管道操作与背压机制
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Streams
  - 异步
  - 数据流
  - 背压
status: imported
origin: old/src/content/docs/javascript/streams-api.zh.md
divergence: 0.205
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 17
  lastUpdated: 2026-01-07
---

## 概念解释

Streams API 是一组用于处理流式数据的 Web API，允许 JavaScript 以分块（chunk）的方式逐步处理数据，而不是一次性将所有数据加载到内存中。这种方式特别适合处理大文件、网络响应、实时数据等场景。

### 什么是流（Stream）

流是一种抽象的数据结构，代表一系列按顺序排列的数据块。与传统的一次性读取整个数据不同，流允许你：

- **逐块处理数据**：数据到达时立即处理，无需等待完整数据
- **减少内存占用**：只在内存中保留当前处理的数据块
- **提高响应速度**：数据一到达就可以开始处理和展示
- **支持无限数据**：可以处理理论上无限长的数据流

### 历史背景

Streams API 最初由 WHATWG 在 2014 年提出，灵感来源于 Node.js 的 Stream 模块。随着 Web 应用处理的数据量越来越大，传统的一次性加载模式已无法满足需求。Streams API 填补了浏览器端流式处理的空白，与 Fetch API 紧密集成，成为现代 Web 开发的重要组成部分。

### 解决的问题

1. **大文件处理**：视频、音频、大型 JSON 文件的流式读取和处理
2. **实时数据**：WebSocket 消息、服务器推送事件的流式处理
3. **内存优化**：避免一次性加载大量数据导致的内存溢出
4. **用户体验**：边下载边显示，提升感知性能

## 核心原理

### 流的三种基本类型

Streams API 定义了三种基本的流类型：

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  ReadableStream │────▶│ TransformStream │────▶│  WritableStream │
│     (可读流)     │     │    (转换流)      │     │     (可写流)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       数据源                 数据转换                 数据目标
```

1. **ReadableStream（可读流）**：数据的来源，只能从中读取数据
2. **WritableStream（可写流）**：数据的目标，只能向其写入数据
3. **TransformStream（转换流）**：同时具有可读端和可写端，用于数据转换

### 内部队列与背压机制

每个流都有一个内部队列来缓存数据块：

```
生产者 ──▶ [队列: chunk1, chunk2, chunk3, ...] ──▶ 消费者
              ▲                                      │
              └──────────── 背压信号 ─────────────────┘
```

**背压（Backpressure）** 是流处理中的核心概念：

- 当消费者处理速度慢于生产者时，队列会不断增长
- 队列达到高水位线（highWaterMark）时，向生产者发送背压信号
- 生产者收到信号后暂停生产，直到队列有空间
- 这种机制防止内存溢出，确保系统稳定运行

### 分块策略（Queuing Strategy）

分块策略定义了队列如何管理数据块：

```javascript
// 计数策略：按数据块数量计算
const countStrategy = new CountQueuingStrategy({ highWaterMark: 10 });

// 字节策略：按字节大小计算
const byteStrategy = new ByteLengthQueuingStrategy({ highWaterMark: 1024 * 16 });
```

## 核心要点

### ReadableStream 核心概念

| 概念 | 说明 |
|------|------|
| 底层源（Underlying Source） | 实际的数据来源，定义 start、pull、cancel 方法 |
| 控制器（Controller） | 控制流的状态，提供 enqueue、close、error 方法 |
| 读取器（Reader） | 用于从流中读取数据，分为默认读取器和 BYOB 读取器 |
| 锁定（Locked） | 流被读取器获取后进入锁定状态，不能再创建其他读取器 |

### WritableStream 核心概念

| 概念 | 说明 |
|------|------|
| 底层接收器（Underlying Sink） | 实际的数据目标，定义 start、write、close、abort 方法 |
| 写入器（Writer） | 用于向流中写入数据 |
| 就绪状态（Ready） | 表示流是否准备好接收下一个数据块 |

### TransformStream 核心概念

| 概念 | 说明 |
|------|------|
| 转换器（Transformer） | 定义数据转换逻辑，包含 start、transform、flush 方法 |
| 可读端（Readable） | 转换后数据的输出端 |
| 可写端（Writable） | 原始数据的输入端 |

## 代码示例

### 创建 ReadableStream

```javascript
// 创建一个简单的可读流
const readableStream = new ReadableStream({
  // 流初始化时调用
  start(controller) {
    console.log('流已启动');
  },

  // 消费者请求数据时调用
  pull(controller) {
    // 生成数据并加入队列
    const chunk = generateData();

    if (chunk === null) {
      // 数据结束，关闭流
      controller.close();
    } else {
      // 将数据块加入队列
      controller.enqueue(chunk);
    }
  },

  // 消费者取消流时调用
  cancel(reason) {
    console.log('流被取消:', reason);
  }
});

// 创建一个计数流示例
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

// 使用计数流
const counterStream = createCounterStream(5);
const reader = counterStream.getReader();

async function readAll() {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log('读取到:', value); // 0, 1, 2, 3, 4
  }
}

readAll();
```

### 创建 WritableStream

```javascript
// 创建一个简单的可写流
const writableStream = new WritableStream({
  // 流初始化时调用
  start(controller) {
    console.log('可写流已启动');
  },

  // 写入数据时调用
  write(chunk, controller) {
    console.log('写入数据:', chunk);
    // 可以返回 Promise 表示异步写入
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('数据已处理:', chunk);
        resolve();
      }, 100);
    });
  },

  // 流关闭时调用
  close() {
    console.log('可写流已关闭');
  },

  // 流中止时调用
  abort(reason) {
    console.log('可写流被中止:', reason);
  }
});

// 使用可写流
async function writeData() {
  const writer = writableStream.getWriter();

  try {
    await writer.write('Hello');
    await writer.write('World');
    await writer.close();
  } catch (error) {
    console.error('写入失败:', error);
  }
}

writeData();
```

### 创建 TransformStream

```javascript
// 创建一个文本转大写的转换流
const uppercaseTransform = new TransformStream({
  transform(chunk, controller) {
    // 转换数据并输出
    controller.enqueue(chunk.toUpperCase());
  }
});

// 创建一个 JSON 解析转换流
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

// 创建一个带缓冲的行分割转换流
function createLineSplitter() {
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const lines = buffer.split('\n');
      // 保留最后一个不完整的行
      buffer = lines.pop();
      // 输出完整的行
      for (const line of lines) {
        if (line.trim()) {
          controller.enqueue(line);
        }
      }
    },

    flush(controller) {
      // 流结束时处理剩余数据
      if (buffer.trim()) {
        controller.enqueue(buffer);
      }
    }
  });
}
```

### 管道操作（Piping）

```javascript
// 使用 pipeTo 将可读流连接到可写流
async function pipeExample() {
  const readable = createCounterStream(10);

  const writable = new WritableStream({
    write(chunk) {
      console.log('处理:', chunk);
    }
  });

  // pipeTo 返回一个 Promise，在流完成或出错时解析
  await readable.pipeTo(writable);
  console.log('管道传输完成');
}

// 使用 pipeThrough 进行数据转换
async function pipeTransformExample() {
  const response = await fetch('/api/data.txt');

  // 文本解码转换
  const textDecoder = new TextDecoderStream();

  // 自定义转换
  const customTransform = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(`[处理] ${chunk}`);
    }
  });

  // 链式管道
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

### Fetch API 与 Streams 集成

```javascript
// 流式读取 Fetch 响应
async function streamFetch(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let result = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      console.log('流读取完成');
      break;
    }

    // value 是 Uint8Array
    const text = decoder.decode(value, { stream: true });
    result += text;
    console.log('收到数据块，当前长度:', result.length);
  }

  return result;
}

// 显示下载进度
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

  // 合并所有块
  const allChunks = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  return allChunks;
}

// 使用示例
downloadWithProgress('/large-file.zip', ({ percent }) => {
  console.log(`下载进度: ${percent}%`);
});
```

### 流式上传

```javascript
// 创建一个可读流用于上传
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

// 流式上传文件
async function streamUpload(url, file) {
  const stream = file.stream();

  const response = await fetch(url, {
    method: 'POST',
    body: stream,
    headers: {
      'Content-Type': file.type,
      'Content-Length': file.size
    },
    // 注意：并非所有环境都支持流式请求体
    duplex: 'half'
  });

  return response.json();
}
```

### 异步迭代器模式

```javascript
// 将 ReadableStream 转换为异步迭代器
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

// 使用 for-await-of 遍历流
async function processStream(stream) {
  for await (const chunk of streamToAsyncIterator(stream)) {
    console.log('处理数据块:', chunk);
  }
}

// 从异步迭代器创建 ReadableStream
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

### 流的分支（Tee）

```javascript
// 将一个流分成两个相同的流
async function teeExample() {
  const response = await fetch('/api/data');

  // tee() 返回包含两个 ReadableStream 的数组
  const [stream1, stream2] = response.body.tee();

  // 两个流可以独立消费
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

  // 将流保存到缓存
  // ...
}
```

## 最佳实践

### 始终释放读取器锁

```javascript
async function safeRead(stream) {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // 处理数据
    }
  } finally {
    // 确保释放锁，即使发生错误
    reader.releaseLock();
  }
}
```

### 合理设置高水位线

```javascript
// 根据数据特性设置合适的高水位线
const stream = new ReadableStream(
  {
    pull(controller) {
      // 数据生产逻辑
    }
  },
  // 对于大数据块，使用字节长度策略
  new ByteLengthQueuingStrategy({ highWaterMark: 1024 * 64 }) // 64KB
);

// 对于小数据块，使用计数策略
const countStream = new ReadableStream(
  {
    pull(controller) {
      // 数据生产逻辑
    }
  },
  new CountQueuingStrategy({ highWaterMark: 10 }) // 10个数据块
);
```

### 正确处理背压

```javascript
const writableStream = new WritableStream({
  async write(chunk, controller) {
    // 模拟慢速处理
    await slowProcess(chunk);
    // 写入方法返回的 Promise 解析后，
    // 流才会请求下一个数据块
  }
});

// 生产者应该尊重背压信号
async function respectBackpressure(readable, writable) {
  const reader = readable.getReader();
  const writer = writable.getWriter();

  try {
    while (true) {
      // 等待可写流准备好
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

### 使用管道简化代码

```javascript
// 不推荐：手动读写
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

// 推荐：使用管道
async function pipeTransfer(readable, writable) {
  await readable.pipeTo(writable);
}
```

### 错误处理与资源清理

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
      console.error('请求超时');
    } else {
      console.error('处理失败:', error);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
```

## 常见陷阱

### 忘记流只能消费一次

```javascript
// 错误示例
async function wrongUsage() {
  const response = await fetch('/api/data');

  // 第一次读取
  const text = await response.text();

  // 错误！流已经被消费
  const json = await response.json(); // 抛出错误
}

// 正确示例
async function correctUsage() {
  const response = await fetch('/api/data');

  // 克隆响应以便多次使用
  const clonedResponse = response.clone();

  const text = await response.text();
  const json = await clonedResponse.json();
}

// 或者使用 tee()
async function teeUsage() {
  const response = await fetch('/api/data');
  const [stream1, stream2] = response.body.tee();

  // 两个流可以独立消费
}
```

### 锁定状态导致的错误

```javascript
// 错误示例
async function lockError() {
  const stream = createReadableStream();

  const reader1 = stream.getReader(); // 流被锁定
  const reader2 = stream.getReader(); // 错误！流已被锁定
}

// 正确示例
async function correctLocking() {
  const stream = createReadableStream();

  const reader = stream.getReader();

  // 使用完毕后释放锁
  reader.releaseLock();

  // 现在可以创建新的读取器
  const newReader = stream.getReader();
}
```

### 未处理的流取消

```javascript
// 可能导致资源泄漏
async function potentialLeak(stream) {
  const reader = stream.getReader();

  for (let i = 0; i < 10; i++) {
    const { value } = await reader.read();
    if (someCondition(value)) {
      return value; // 流未关闭，读取器锁未释放
    }
  }
}

// 正确处理
async function noLeak(stream) {
  const reader = stream.getReader();

  try {
    for (let i = 0; i < 10; i++) {
      const { value } = await reader.read();
      if (someCondition(value)) {
        // 取消流并释放锁
        await reader.cancel();
        return value;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

### 转换流中的错误传播

```javascript
// 错误示例：错误未正确传播
const badTransform = new TransformStream({
  transform(chunk, controller) {
    try {
      const result = riskyOperation(chunk);
      controller.enqueue(result);
    } catch (error) {
      console.error(error); // 错误被吞掉
    }
  }
});

// 正确示例：使用 controller.error() 传播错误
const goodTransform = new TransformStream({
  transform(chunk, controller) {
    try {
      const result = riskyOperation(chunk);
      controller.enqueue(result);
    } catch (error) {
      controller.error(error); // 错误正确传播
    }
  }
});
```

### 背压信号被忽略

```javascript
// 错误示例：忽略背压
async function ignoreBackpressure(readable, writable) {
  const reader = readable.getReader();
  const writer = writable.getWriter();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 错误：不等待写入完成就继续读取
    writer.write(value); // 没有 await
  }
}

// 正确示例：尊重背压
async function respectBackpressure(readable, writable) {
  const reader = readable.getReader();
  const writer = writable.getWriter();

  while (true) {
    // 等待可写流准备好接收数据
    await writer.ready;

    const { done, value } = await reader.read();
    if (done) {
      await writer.close();
      break;
    }

    // 等待写入完成
    await writer.write(value);
  }
}
```

## 性能考量

### 内存优化

```javascript
// 使用流处理大文件可以显著减少内存占用
async function processLargeFile(file) {
  // 传统方式：一次性读取整个文件到内存
  // const content = await file.text(); // 内存占用 = 文件大小

  // 流式方式：逐块处理
  const stream = file.stream();
  const reader = stream.getReader();

  let processedSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 只处理当前块，内存占用恒定
    await processChunk(value);
    processedSize += value.length;
  }

  return processedSize;
}
```

### 高水位线调优

```javascript
// 高水位线过低：频繁暂停/恢复，增加开销
const tooLow = new ReadableStream(source, {
  highWaterMark: 1 // 每个数据块都可能触发背压
});

// 高水位线过高：内存占用增加
const tooHigh = new ReadableStream(source, {
  highWaterMark: 1024 * 1024 * 100 // 100MB，可能导致内存问题
});

// 合理的高水位线：平衡性能和内存
const balanced = new ReadableStream(source, {
  highWaterMark: 1024 * 64 // 64KB，适合大多数网络场景
});
```

### 避免不必要的数据复制

```javascript
// 低效：多次转换复制数据
async function inefficient(stream) {
  const reader = stream.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 每次都创建新的 Uint8Array
    const copy = new Uint8Array(value);
    chunks.push(copy);
  }

  // 再次复制合并
  return concatenate(chunks);
}

// 高效：使用 BYOB 读取器避免复制
async function efficient(stream) {
  const reader = stream.getReader({ mode: 'byob' });
  const chunks = [];

  let buffer = new ArrayBuffer(1024 * 64);

  while (true) {
    const { done, value } = await reader.read(new Uint8Array(buffer));
    if (done) break;

    chunks.push(value);
    // 重用 buffer
    buffer = value.buffer;
  }

  return chunks;
}
```

### 批量处理优化

```javascript
// 创建批量处理转换流
function createBatchTransform(batchSize = 10) {
  let batch = [];

  return new TransformStream({
    transform(chunk, controller) {
      batch.push(chunk);

      if (batch.length >= batchSize) {
        // 批量处理减少函数调用开销
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

## 实战场景

### 场景一：实时日志查看器

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
    // 解析日志行
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

// 使用示例
const viewer = new LogViewer('/api/logs/stream');
viewer.start(log => {
  console.log(`[${log.level}] ${log.message}`);
});

// 停止查看
// viewer.stop();
```

### 场景二：大文件分块上传

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

    // 创建分块流
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

      // 控制并发数
      if (uploadPromises.length >= this.concurrency) {
        await Promise.race(uploadPromises);
        // 移除已完成的 Promise
        const completed = uploadPromises.findIndex(p =>
          p.then(() => true).catch(() => true)
        );
        if (completed !== -1) {
          uploadPromises.splice(completed, 1);
        }
      }
    }

    // 等待所有上传完成
    await Promise.all(uploadPromises);

    // 通知服务器合并文件
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
      throw new Error(`上传分块 ${index} 失败`);
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

// 使用示例
const uploader = new ChunkedUploader({
  chunkSize: 2 * 1024 * 1024, // 2MB
  concurrency: 5,
  onProgress: ({ percent }) => {
    console.log(`上传进度: ${percent}%`);
  }
});

const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  await uploader.upload(file, '/api/upload');
});
```

### 场景三：视频流处理

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

// 使用示例
const processor = new VideoStreamProcessor();
const video = document.querySelector('video');

await processor.init(video);
await processor.stream('/api/video/stream');
```

### 场景四：Server-Sent Events 解析

```javascript
function createSSEParser() {
  let buffer = '';
  let event = { data: [], event: '', id: '' };

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 保留不完整的行

      for (const line of lines) {
        if (line === '') {
          // 空行表示事件结束
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

// 使用自定义 SSE 解析器
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

// 使用示例
connectSSE('/api/events', (event) => {
  console.log(`收到 ${event.type} 事件:`, event.data);
});
```

## 面试要点

### 什么是 Streams API？它解决了什么问题？

**答案要点**：
- Streams API 是用于处理流式数据的 Web API
- 解决大数据传输时的内存问题
- 支持边下载边处理，提升用户体验
- 通过背压机制协调生产者和消费者速度

### 解释 ReadableStream、WritableStream 和 TransformStream 的区别

**答案要点**：
- ReadableStream：数据源，只能读取
- WritableStream：数据目标，只能写入
- TransformStream：同时具有可读端和可写端，用于数据转换
- 三者可以通过管道（pipe）连接形成数据处理链

### 什么是背压（Backpressure）？为什么重要？

**答案要点**：
- 背压是当消费者处理速度慢于生产者时的流量控制机制
- 通过高水位线（highWaterMark）触发背压信号
- 防止内存溢出，确保系统稳定
- 实现方式：消费者通过 Promise 返回值控制生产者节奏

### 如何实现流式下载进度显示？

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
    console.log(`进度: ${Math.round((loaded / total) * 100)}%`);
  }
}
```

### pipeTo 和 pipeThrough 的区别是什么？

**答案要点**：
- `pipeTo(writable)`：将可读流连接到可写流，返回 Promise
- `pipeThrough(transform)`：将可读流连接到转换流，返回转换后的可读流
- pipeTo 用于最终目标，pipeThrough 用于中间转换
- pipeThrough 支持链式调用

### 流被锁定（locked）是什么意思？如何处理？

**答案要点**：
- 当 getReader() 被调用时，流进入锁定状态
- 锁定期间不能创建新的读取器
- 通过 reader.releaseLock() 释放锁
- 或使用 tee() 创建两个独立的流

## 延伸阅读

### 官方文档
- [WHATWG Streams 规范](https://streams.spec.whatwg.org/)
- [MDN Streams API](https://developer.mozilla.org/zh-CN/docs/Web/API/Streams_API)
- [MDN ReadableStream](https://developer.mozilla.org/zh-CN/docs/Web/API/ReadableStream)
- [MDN WritableStream](https://developer.mozilla.org/zh-CN/docs/Web/API/WritableStream)
- [MDN TransformStream](https://developer.mozilla.org/zh-CN/docs/Web/API/TransformStream)

### 深入学习
- [web.dev: Streams 指南](https://web.dev/streams/)
- [Jake Archibald: 2016 - the year of web streams](https://jakearchibald.com/2016/streams-ftw/)
- [Node.js Stream 与 Web Streams 的比较](https://nodejs.org/api/webstreams.html)

### 相关 API
- [Fetch API](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)
- [File API](https://developer.mozilla.org/zh-CN/docs/Web/API/File_API)
- [Blob](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob)
- [ArrayBuffer](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)

### 浏览器兼容性
- [Can I use: Streams](https://caniuse.com/streams)
- [Chrome Platform Status: Streams API](https://chromestatus.com/feature/5804334163951616)
