---
title: Node.js 事件循环完全指南
description: 掌握 Node.js 异步编程和事件驱动架构
track: javascript
section: node
difficulty: intermediate
tags:
  - Node.js
  - Event Loop
  - Async
  - Non-blocking
status: imported
origin: old/src/content/docs/backend/nodejs-fundamentals.zh.md
divergence: 0.189
issues: []
legacy:
  category: Backend
  subcategory: Node.js
  order: 1
  lastUpdated: 2026-01-07
---

## 概念概述：什么是 Node.js？

Node.js 是一个基于 Chrome V8 JavaScript 引擎构建的 JavaScript 运行时环境。它使开发者能够使用 JavaScript 编写服务端应用程序，打破了 JavaScript 只能在浏览器中运行的传统限制。

### 核心特性

Node.js 具有以下几个基本特性：

- **单线程事件循环**：使用单线程处理请求，通过事件循环机制实现高并发
- **非阻塞 I/O**：所有 I/O 操作都是异步的，不会阻塞主线程
- **跨平台**：可在 Windows、Linux、macOS 等多个平台上运行
- **NPM 生态系统**：拥有全球最大的开源库生态系统

### 理想使用场景

Node.js 在特定场景中表现出色：

```
1. 高并发、I/O 密集型应用（API 服务器、实时聊天）
2. 微服务架构
3. 前端构建工具（Webpack、Vite）
4. 命令行工具开发
5. 流式应用
```

## Node.js 架构

理解 Node.js 架构是掌握其事件驱动模型的基础。该架构由几个关键组件协同工作，实现非阻塞 I/O 操作。

### V8 引擎

V8 是 Google 的高性能 JavaScript 引擎，用 C++ 编写。其主要职责包括：

```javascript
// V8 引擎工作流程示意
/**
 * 1. 解析 JavaScript 代码生成 AST（抽象语法树）
 * 2. 将 AST 编译为字节码
 * 3. 通过 TurboFan 优化器生成优化的机器码
 * 4. 执行机器码
 */

// V8 的即时编译（JIT）示例
function hotFunction(x) {
  return x * 2;
}

// 当函数被频繁调用时，V8 将其标记为"热点"函数
// 并使用 TurboFan 进行优化编译
for (let i = 0; i < 100000; i++) {
  hotFunction(i);
}
```

### Node.js 运行时组件

Node.js 运行时由几个相互连接的层组成：

```
┌─────────────────────────────────────────────────────────────┐
│                    你的 JavaScript 代码                      │
├─────────────────────────────────────────────────────────────┤
│                     Node.js 绑定层                           │
│              (Process、Buffer、Crypto 等)                    │
├──────────────────────┬──────────────────────────────────────┤
│       V8 引擎        │              libuv                    │
│   (JS 执行引擎)      │   (事件循环、线程池、I/O)             │
├──────────────────────┴──────────────────────────────────────┤
│                       操作系统                               │
└─────────────────────────────────────────────────────────────┘
```

## libuv 和线程池

libuv 是一个跨平台的异步 I/O 库，构成了 Node.js 非阻塞 I/O 能力的基础。它提供：

- **事件循环**：Node.js 事件循环的核心实现
- **线程池**：处理阻塞操作，如文件 I/O
- **异步 TCP/UDP 套接字**
- **异步 DNS 解析**
- **文件系统操作**
- **子进程管理**

### 线程池配置

```javascript
// libuv 线程池配置
// 默认池大小为 4，可通过环境变量修改
process.env.UV_THREADPOOL_SIZE = 8;

// 演示线程池行为
const crypto = require('crypto');
const start = Date.now();

// 创建多个 CPU 密集型任务
for (let i = 0; i < 8; i++) {
  crypto.pbkdf2('password', 'salt', 100000, 512, 'sha512', () => {
    console.log(`任务 ${i + 1} 完成，耗时: ${Date.now() - start}ms`);
  });
}
```

### 理解哪些操作使用线程池

```javascript
// 使用线程池的操作：
// - fs 模块操作（大多数）
// - crypto.pbkdf2、crypto.randomBytes
// - zlib 压缩
// - dns.lookup()

// 不使用线程池的操作（使用操作系统异步原语）：
// - 网络 I/O（TCP、UDP）
// - 管道
// - dns.resolve()
// - 定时器

const fs = require('fs');
const https = require('https');

// 这个使用线程池
fs.readFile('./large-file.txt', (err, data) => {
  console.log('文件读取完成（线程池）');
});

// 这个使用操作系统异步原语（epoll/kqueue/IOCP）
https.get('https://api.example.com', (res) => {
  console.log('HTTP 请求完成（操作系统异步）');
});
```

## 事件循环阶段

事件循环是 Node.js 处理异步操作的核心机制。它分为不同的阶段运行：

```
   ┌───────────────────────────┐
┌─>│         timers           │  执行 setTimeout/setInterval 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │  执行延迟到下一轮循环的 I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │  仅供内部使用
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │  获取新的 I/O 事件，执行 I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │  执行 setImmediate 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │  执行关闭事件回调（socket.on('close')）
   └───────────────────────────┘
```

### 阶段详情

**1. Timers 阶段**
执行由 `setTimeout()` 和 `setInterval()` 调度的回调。定时器指定的是回调可能执行的阈值，而不是确切时间。

**2. Pending Callbacks 阶段**
执行延迟到下一轮循环迭代的 I/O 回调，例如 TCP 错误回调。

**3. Poll 阶段**
最重要的阶段。它：
- 计算阻塞和轮询 I/O 的时间
- 处理轮询队列中的事件

**4. Check 阶段**
在 poll 阶段完成后立即执行 `setImmediate()` 回调。

**5. Close Callbacks 阶段**
执行关闭回调，例如 `socket.on('close', ...)`。

### 事件循环执行顺序

```javascript
// 事件循环阶段演示
console.log('1. 同步代码开始');

setTimeout(() => {
  console.log('4. setTimeout 回调（timers 阶段）');
}, 0);

setImmediate(() => {
  console.log('5. setImmediate 回调（check 阶段）');
});

process.nextTick(() => {
  console.log('3. process.nextTick（在当前阶段结束后执行）');
});

Promise.resolve().then(() => {
  console.log('3.5 Promise.then（微任务队列）');
});

console.log('2. 同步代码结束');

// 输出顺序：
// 1. 同步代码开始
// 2. 同步代码结束
// 3. process.nextTick
// 3.5 Promise.then
// 4. setTimeout 回调（timers 阶段）
// 5. setImmediate 回调（check 阶段）
```

### 微任务 vs 宏任务

```javascript
// 微任务：process.nextTick、Promise 回调
// 宏任务：setTimeout、setInterval、setImmediate、I/O 回调

// 微任务在事件循环的每个阶段之间处理
// 以及每个宏任务完成后处理

console.log('开始');

setTimeout(() => {
  console.log('setTimeout 1');
  Promise.resolve().then(() => console.log('setTimeout 内的 Promise'));
}, 0);

setTimeout(() => {
  console.log('setTimeout 2');
}, 0);

Promise.resolve().then(() => console.log('Promise 1'));
Promise.resolve().then(() => console.log('Promise 2'));

console.log('结束');

// 输出：
// 开始
// 结束
// Promise 1
// Promise 2
// setTimeout 1
// setTimeout 内的 Promise
// setTimeout 2
```

### setTimeout vs setImmediate

```javascript
// 在主模块中，顺序是不确定的
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
// 可能是任意顺序！

// 在 I/O 回调内，setImmediate 总是先执行
const fs = require('fs');

fs.readFile('./file.txt', () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// 输出：immediate，然后 timeout（总是这个顺序）
```

## 异步模式

### 回调（传统模式）

```javascript
const fs = require('fs');

// 错误优先回调模式
fs.readFile('./config.json', 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件错误:', err);
    return;
  }
  console.log('文件内容:', data);
});

// 回调地狱示例（避免这样做！）
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

### Promise

```javascript
const fs = require('fs').promises;

// 基本 Promise 用法
fs.readFile('./config.json', 'utf8')
  .then(data => {
    console.log('文件内容:', data);
    return JSON.parse(data);
  })
  .then(config => {
    console.log('解析后的配置:', config);
  })
  .catch(err => {
    console.error('错误:', err);
  });

// Promise.all - 并行执行
async function readMultipleFiles() {
  const [file1, file2, file3] = await Promise.all([
    fs.readFile('./file1.txt', 'utf8'),
    fs.readFile('./file2.txt', 'utf8'),
    fs.readFile('./file3.txt', 'utf8')
  ]);
  return { file1, file2, file3 };
}

// Promise.allSettled - 等待所有，无论是否拒绝
const results = await Promise.allSettled([
  fetch('/api/endpoint1'),
  fetch('/api/endpoint2'),
  fetch('/api/endpoint3')
]);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`请求 ${index} 成功:`, result.value);
  } else {
    console.log(`请求 ${index} 失败:`, result.reason);
  }
});

// Promise.race - 第一个解决/拒绝的获胜
const timeout = (ms) => new Promise((_, reject) =>
  setTimeout(() => reject(new Error('超时')), ms)
);

const result = await Promise.race([
  fetch('/api/data'),
  timeout(5000)
]);
```

### Async/Await（现代模式）

```javascript
const fs = require('fs').promises;

// 简洁的 async/await 语法
async function processConfig() {
  try {
    const data = await fs.readFile('./config.json', 'utf8');
    const config = JSON.parse(data);

    // 顺序操作
    const result1 = await processStep1(config);
    const result2 = await processStep2(result1);

    return result2;
  } catch (err) {
    console.error('处理失败:', err);
    throw err;
  }
}

// 使用 async/await 并发执行
async function fetchAllData() {
  // 这些并发运行
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments()
  ]);

  return { users, posts, comments };
}

// 错误处理模式
async function robustOperation() {
  // 模式 1：try-catch
  try {
    const result = await riskyOperation();
    return result;
  } catch (err) {
    return defaultValue;
  }

  // 模式 2：.catch() 与 await
  const result = await riskyOperation().catch(() => defaultValue);
}

// 异步迭代
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

### 将回调转换为 Promise

```javascript
const { promisify } = require('util');
const fs = require('fs');

// 使用 promisify
const readFileAsync = promisify(fs.readFile);
const data = await readFileAsync('./file.txt', 'utf8');

// 手动 Promise 化
function readFilePromise(path, encoding) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, encoding, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Promise 化整个模块
const dns = require('dns');
const dnsPromises = require('dns').promises;
// 或者
const { Resolver } = require('dns').promises;
```

## 流

流是可能一次性不可用且不需要完全装入内存的数据集合。有四种类型：Readable、Writable、Duplex 和 Transform。

### 可读流

```javascript
const fs = require('fs');
const { Readable } = require('stream');

// 从文件创建可读流
const readStream = fs.createReadStream('./large-file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024 // 64KB 缓冲区
});

readStream.on('data', (chunk) => {
  console.log(`接收到 ${chunk.length} 字节数据`);
});

readStream.on('end', () => {
  console.log('文件读取完成');
});

readStream.on('error', (err) => {
  console.error('读取错误:', err);
});

// 自定义可读流
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
      this.push(null); // 信号流结束
    }
  }
}

const counter = new CounterStream(5);
counter.on('data', (data) => {
  console.log(data); // { count: 1 }, { count: 2 }, ...
});
```

### 可写流

```javascript
const fs = require('fs');
const { Writable } = require('stream');

// 文件写入流
const writeStream = fs.createWriteStream('./output.txt', {
  encoding: 'utf8',
  highWaterMark: 16 * 1024
});

// 写入数据
writeStream.write('第一行\n');
writeStream.write('第二行\n');
writeStream.end('最后一行');

writeStream.on('finish', () => {
  console.log('写入完成');
});

writeStream.on('error', (err) => {
  console.error('写入错误:', err);
});

// 自定义可写流
class LoggerStream extends Writable {
  _write(chunk, encoding, callback) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${chunk.toString()}`);
    callback();
  }
}

const logger = new LoggerStream();
logger.write('应用程序启动');
logger.write('处理用户请求');
```

### 转换流

```javascript
const { Transform } = require('stream');
const fs = require('fs');

// 大写转换的转换流
class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    const upperCased = chunk.toString().toUpperCase();
    this.push(upperCased);
    callback();
  }
}

// 使用 pipe 链接流
fs.createReadStream('./input.txt')
  .pipe(new UpperCaseTransform())
  .pipe(fs.createWriteStream('./output-upper.txt'));

// JSON 行解析器转换
class JSONLineParser extends Transform {
  constructor() {
    super({ objectMode: true });
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop(); // 保留不完整的行在缓冲区

    for (const line of lines) {
      if (line.trim()) {
        try {
          this.push(JSON.parse(line));
        } catch (err) {
          this.emit('error', new Error(`无效的 JSON: ${line}`));
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
        this.emit('error', new Error(`无效的 JSON: ${this.buffer}`));
      }
    }
    callback();
  }
}
```

### 管道和背压

```javascript
const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const zlib = require('zlib');

const pipelineAsync = promisify(pipeline);

// 使用 pipeline 进行自动错误处理和清理
async function compressFile(input, output) {
  try {
    await pipelineAsync(
      fs.createReadStream(input),
      zlib.createGzip(),
      fs.createWriteStream(output)
    );
    console.log('压缩完成');
  } catch (err) {
    console.error('压缩失败:', err);
  }
}

// 手动背压处理
function copyWithBackpressure(src, dest) {
  const readStream = fs.createReadStream(src);
  const writeStream = fs.createWriteStream(dest);

  readStream.on('data', (chunk) => {
    const canContinue = writeStream.write(chunk);
    if (!canContinue) {
      // 缓冲区满，暂停读取
      readStream.pause();
    }
  });

  writeStream.on('drain', () => {
    // 缓冲区空，恢复读取
    readStream.resume();
  });

  readStream.on('end', () => {
    writeStream.end();
  });
}

// 使用 pipeline 的现代方法
const { pipeline: pipelineCallback } = require('stream');

pipelineCallback(
  fs.createReadStream('./large-file.txt'),
  zlib.createGzip(),
  fs.createWriteStream('./large-file.txt.gz'),
  (err) => {
    if (err) {
      console.error('管道失败:', err);
    } else {
      console.log('管道成功');
    }
  }
);
```

## 错误处理

### 同步错误处理

```javascript
// try-catch 处理同步错误
function parseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('JSON 解析失败:', err.message);
    return null;
  }
}

// 输入验证
function divide(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('参数必须是数字');
  }
  if (b === 0) {
    throw new RangeError('不能除以零');
  }
  return a / b;
}
```

### 异步错误处理

```javascript
const fs = require('fs').promises;

// 使用 async/await 的 Promise 错误处理
async function readConfig(path) {
  try {
    const data = await fs.readFile(path, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('配置文件未找到');
      return getDefaultConfig();
    }
    throw err; // 重新抛出未知错误
  }
}

// 错误优先回调模式
function readFileCallback(path, callback) {
  fs.readFile(path, 'utf8')
    .then(data => callback(null, data))
    .catch(err => callback(err, null));
}

// 全局未处理异常处理器
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  // 记录错误，清理资源
  process.exit(1); // 必须退出进程
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  // 记录错误
});
```

### 自定义错误类

```javascript
// 自定义错误层次结构
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
    super(`${resource} 未找到`, 404);
    this.name = 'NotFoundError';
  }
}

class DatabaseError extends AppError {
  constructor(message, query) {
    super(message, 500, false); // 非操作性错误 - 编程错误
    this.name = 'DatabaseError';
    this.query = query;
  }
}

// 使用
function findUser(id) {
  const user = database.find(u => u.id === id);
  if (!user) {
    throw new NotFoundError('User');
  }
  return user;
}

// 集中式错误处理器
function errorHandler(err, req, res, next) {
  if (err.isOperational) {
    // 操作性错误：发送给客户端
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  } else {
    // 编程错误：记录并发送通用消息
    console.error('编程错误:', err);
    res.status(500).json({
      status: 'error',
      message: '内部服务器错误'
    });
  }
}
```

### EventEmitter 错误处理

```javascript
const EventEmitter = require('events');

const emitter = new EventEmitter();

// 必须监听 error 事件 - 否则进程崩溃
emitter.on('error', (err) => {
  console.error('事件错误:', err.message);
});

emitter.emit('error', new Error('出错了'));

// 流错误处理
const fs = require('fs');
const readStream = fs.createReadStream('./nonexistent.txt');

readStream.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('文件未找到');
  } else {
    console.error('读取错误:', err);
  }
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM。正在优雅关闭...');

  // 关闭服务器、数据库连接等
  await server.close();
  await database.disconnect();

  process.exit(0);
});
```

## 性能优化

### 内存管理

```javascript
// 查看内存使用情况
function printMemoryUsage() {
  const usage = process.memoryUsage();
  console.log({
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`, // 常驻集大小
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`, // 总堆
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`, // 已用堆
    external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`, // C++ 对象
    arrayBuffers: `${(usage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`
  });
}

// 调整堆大小
// node --max-old-space-size=4096 app.js // 设置最大堆为 4GB
```

### 避免内存泄漏

```javascript
// 1. 避免全局变量累积
// 不好
global.cache = [];
function addToCache(item) {
  global.cache.push(item); // 无限增长
}

// 好：使用 LRU 缓存
const LRU = require('lru-cache');
const cache = new LRU({
  max: 500, // 最大条目数
  ttl: 1000 * 60 * 5 // 5 分钟 TTL
});

// 2. 避免闭包内存泄漏
// 不好
function createHandler() {
  const largeData = new Array(1000000).fill('x');
  return function handler() {
    console.log(largeData.length); // 持有对 largeData 的引用
  };
}

// 好：只保留必要的数据
function createHandler() {
  const largeData = new Array(1000000).fill('x');
  const length = largeData.length; // 只保留需要的
  return function handler() {
    console.log(length);
  };
}

// 3. 清理事件监听器
const EventEmitter = require('events');
const emitter = new EventEmitter();

// 检查监听器数量
emitter.setMaxListeners(20);
console.log(emitter.listenerCount('data'));

// 完成后移除监听器
function cleanup() {
  emitter.removeAllListeners('data');
}

// 4. 清除定时器
let timer = setInterval(() => {
  // 某些操作
}, 1000);

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

// 5. 使用 WeakMap/WeakSet 进行自动清理
const weakCache = new WeakMap();

function cacheResult(obj, result) {
  weakCache.set(obj, result);
  // 当 obj 被垃圾回收时，缓存条目会自动移除
}
```

### 性能最佳实践

```javascript
// 1. 对大文件使用流
const fs = require('fs');

// 不好 - 将整个文件加载到内存
const data = fs.readFileSync('./large-file.txt');

// 好 - 分块流式传输数据
const readStream = fs.createReadStream('./large-file.txt');
readStream.pipe(process.stdout);

// 2. 避免阻塞事件循环
// 不好 - 同步 CPU 密集型操作
function processData(data) {
  // 阻塞的复杂计算
  for (let i = 0; i < 1e9; i++) {
    // ...
  }
}

// 好 - 分解工作或使用 worker 线程
const { Worker } = require('worker_threads');

function processDataAsync(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', { workerData: data });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

// 3. 使用连接池
const { Pool } = require('pg');
const pool = new Pool({
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// 4. 实现缓存
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 默认 10 分钟 TTL

async function getUserById(id) {
  const cached = cache.get(`user:${id}`);
  if (cached) return cached;

  const user = await database.findUser(id);
  cache.set(`user:${id}`, user);
  return user;
}

// 5. 使用 async/await 而非回调（更清晰，更易优化）
// 6. 压缩响应
const compression = require('compression');
app.use(compression());
```

## 集群

Node.js 在单线程中运行，但你可以使用 cluster 模块利用多核 CPU。

### 基本集群

```javascript
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isPrimary) {
  console.log(`主进程 ${process.pid} 正在运行`);

  // 派生 worker
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} 死亡`);
    // 重启 worker
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} 在线`);
  });
} else {
  // Worker 共享 TCP 连接
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`来自 worker ${process.pid} 的问候\n`);
  }).listen(8000);

  console.log(`Worker ${process.pid} 已启动`);
}
```

### 使用 PM2 的生产集群

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api-server',
    script: './server.js',
    instances: 'max', // 使用所有可用 CPU
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

// 启动：pm2 start ecosystem.config.js
```

### Worker 线程用于 CPU 密集型任务

```javascript
// main.js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // 主线程
  function runWorker(data) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, { workerData: data });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker 以退出码 ${code} 停止`));
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
    console.log('总计:', results.reduce((a, b) => a + b, 0));
  }

  main();
} else {
  // Worker 线程
  const { start, end } = workerData;
  let sum = 0;
  for (let i = start; i < end; i++) {
    sum += i;
  }
  parentPort.postMessage(sum);
}
```

### Worker 线程共享内存

```javascript
const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // 创建共享缓冲区
  const sharedBuffer = new SharedArrayBuffer(4);
  const sharedArray = new Int32Array(sharedBuffer);

  const worker = new Worker(__filename, {
    workerData: { sharedBuffer }
  });

  // 主线程可以读/写
  setInterval(() => {
    console.log('主线程看到:', sharedArray[0]);
  }, 1000);
} else {
  const { sharedBuffer } = require('worker_threads').workerData;
  const sharedArray = new Int32Array(sharedBuffer);

  // Worker 增加共享值
  setInterval(() => {
    Atomics.add(sharedArray, 0, 1);
  }, 100);
}
```

## 面试要点

### 核心概念问题

**1. 解释 Node.js 事件循环机制？**

事件循环是 Node.js 处理非阻塞 I/O 操作的机制。它由六个阶段组成：timers、pending callbacks、idle/prepare、poll、check 和 close callbacks。每个阶段有一个 FIFO 队列，事件循环依次在每个阶段执行回调。微任务（process.nextTick、Promise 回调）在阶段之间处理。

**2. process.nextTick() 和 setImmediate() 有什么区别？**

- `process.nextTick()` 在当前阶段结束后立即执行，优先级最高
- `setImmediate()` 在 check 阶段执行
- `nextTick` 可能阻塞事件循环；过度使用可能导致 I/O 饥饿
- 通常推荐使用 `setImmediate` 来延迟工作

**3. Node.js 如何处理高并发？**

通过单线程事件循环结合非阻塞 I/O。耗时的 I/O 操作委托给系统内核或 libuv 线程池，而主线程继续处理其他请求。这种模型避免了多线程上下文切换开销，非常适合 I/O 密集型应用。

**4. 哪些操作使用线程池？**

文件系统操作、DNS 查找、加密操作（pbkdf2、randomBytes）和 zlib 压缩使用线程池。网络 I/O 使用操作系统异步原语（epoll/kqueue/IOCP），不使用线程池。

**5. 如何防止 Node.js 中的内存泄漏？**

- 使用带大小限制的缓存（LRU 缓存）
- 不再需要时移除事件监听器
- 清除定时器和间隔
- 避免闭包持有对大对象的引用
- 使用 WeakMap/WeakSet 存储缓存条目
- 使用 process.memoryUsage() 监控内存使用

### 实际编码问题

```javascript
// 实现一个简单的事件发射器
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

// 实现 Promise.all
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

// 实现带并发限制的异步任务执行器
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

// 使用
const urls = ['url1', 'url2', 'url3', 'url4', 'url5'];
const results = await asyncPool(2, urls, async (url) => {
  const response = await fetch(url);
  return response.json();
});
```

### 性能优化技巧

1. **对大文件使用流** - 避免将整个文件加载到内存
2. **明智地实现缓存** - 减少重复计算和 I/O
3. **使用 cluster 模块**利用多核 CPU
4. **避免同步操作** - 特别是在请求处理程序中
5. **使用连接池**处理数据库连接
6. **监控内存使用**并尽早检测泄漏
7. **分析你的应用程序**使用内置分析器或 clinic.js

## 延伸阅读

### 官方资源

- [Node.js 官方文档](https://nodejs.org/docs/latest/api/)
- [Node.js 最佳实践指南](https://github.com/goldbergyoni/nodebestpractices)
- [V8 博客](https://v8.dev/blog)
- [libuv 文档](http://docs.libuv.org/)

### 高级主题

- **Worker Threads**：Node.js 用于 CPU 密集型任务的多线程解决方案
- **Cluster 模块**：通过创建子进程利用多核处理器
- **Child Process**：创建子进程执行系统命令或运行其他程序
- **N-API**：编写 C/C++ 原生模块的稳定 API
- **AsyncLocalStorage**：在异步操作间维护上下文

### 相关框架

- **Express.js**：最流行的 Node.js Web 框架
- **Koa.js**：Express 团队的下一代框架
- **Fastify**：高性能 Web 框架
- **NestJS**：企业级 TypeScript 框架
- **Hono**：用于边缘的超快 Web 框架

### 调试和性能工具

- **Node.js 内置调试器**：`node --inspect app.js`
- **Chrome DevTools**：连接到 Node.js 进程进行调试
- **clinic.js**：性能诊断工具包
- **0x**：火焰图生成工具
- **heapdump**：用于分析的内存快照

### 书籍和课程

- "Node.js Design Patterns" by Mario Casciaro
- "Distributed Systems with Node.js" by Thomas Hunter II
- "Node Cookbook" by Bethany Griggs

---

> 本指南涵盖了 Node.js 开发的基本概念和实践方面。深入理解事件循环、非阻塞 I/O 和流是掌握 Node.js 的关键。将这些理论知识与实践练习结合起来，巩固你的理解并构建高性能应用程序。
