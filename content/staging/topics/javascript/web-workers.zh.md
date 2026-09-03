---
title: Web Workers 多线程编程
description: 深入理解Web Workers实现前端多线程编程
track: javascript
section: browser
difficulty: intermediate
tags:
  - Web Workers
  - 多线程
  - Service Worker
  - SharedWorker
status: imported
origin: old/src/content/docs/frontend/web-workers.zh.md
divergence: 0.287
issues: []
legacy:
  category: Frontend
  subcategory: Browser
  order: 31
  lastUpdated: 2026-01-07
---

## 概述

### 什么是 Web Workers

JavaScript 是单线程语言，所有代码都在主线程（也称为 UI 线程）上运行。当执行复杂的计算或处理大量数据时，主线程会被阻塞，导致页面无法响应用户交互，出现卡顿甚至"假死"现象。

Web Workers 是 HTML5 引入的一项技术，它允许在后台线程中运行 JavaScript 代码，从而实现真正的多线程编程。Worker 线程与主线程并行运行，互不干扰，可以将耗时的计算任务转移到 Worker 中，保持主线程的流畅响应。

```javascript
// 主线程
const worker = new Worker('worker.js');

worker.postMessage({ type: 'calculate', data: [1, 2, 3, 4, 5] });

worker.onmessage = (event) => {
  console.log('计算结果:', event.data);
};

// worker.js
self.onmessage = (event) => {
  const { type, data } = event.data;
  if (type === 'calculate') {
    const result = data.reduce((sum, num) => sum + num, 0);
    self.postMessage(result);
  }
};
```

### 为什么需要 Web Workers

在以下场景中，Web Workers 尤为重要：

1. **复杂计算**：数学运算、数据处理、加密解密等 CPU 密集型任务
2. **大数据处理**：解析大型 JSON、处理图像/视频数据
3. **后台任务**：轮询服务器、预加载资源、实时数据同步
4. **保持 UI 响应**：确保 60fps 的流畅动画和交互体验

```javascript
// 不使用 Worker - 页面会卡顿
function heavyComputation() {
  let result = 0;
  for (let i = 0; i < 1e9; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

// 使用 Worker - 页面保持流畅
const worker = new Worker('compute-worker.js');
worker.postMessage('start');
worker.onmessage = (e) => console.log('结果:', e.data);
```

### Web Workers 的限制

Worker 运行在独立的线程中，有一些重要的限制：

| 限制项 | 说明 |
|--------|------|
| 无法访问 DOM | 不能操作 `document`、`window` 对象 |
| 无法访问页面全局变量 | 与主线程作用域完全隔离 |
| 同源策略 | Worker 脚本必须与主页面同源 |
| 文件协议限制 | 本地 `file://` 协议下可能无法使用 |

Worker 中可以使用的 API：

- `navigator` 对象
- `location` 对象（只读）
- `XMLHttpRequest` / `fetch`
- `setTimeout` / `setInterval`
- `WebSocket`
- `IndexedDB`
- `importScripts()` 加载外部脚本

## Worker 类型

### Dedicated Worker（专用 Worker）

Dedicated Worker 是最常用的 Worker 类型，它只能被创建它的脚本访问。每个 Dedicated Worker 与创建它的页面之间是一对一的关系。

```javascript
// main.js - 主线程
const worker = new Worker('dedicated-worker.js');

// 发送消息给 Worker
worker.postMessage({ action: 'process', payload: [1, 2, 3] });

// 接收 Worker 的消息
worker.onmessage = (event) => {
  console.log('收到 Worker 消息:', event.data);
};

// 处理错误
worker.onerror = (error) => {
  console.error('Worker 错误:', error.message);
};

// 终止 Worker
// worker.terminate();
```

```javascript
// dedicated-worker.js
self.onmessage = (event) => {
  const { action, payload } = event.data;

  switch (action) {
    case 'process':
      const result = payload.map(n => n * 2);
      self.postMessage({ status: 'success', data: result });
      break;
    default:
      self.postMessage({ status: 'error', message: '未知操作' });
  }
};

// Worker 也可以终止自己
// self.close();
```

### Shared Worker（共享 Worker）

Shared Worker 可以被多个同源的浏览上下文（页面、iframe、其他 Worker）共享访问。它通过端口（port）进行通信。

```javascript
// main.js - 页面 A 和页面 B 都可以使用
const sharedWorker = new SharedWorker('shared-worker.js');

// 必须通过 port 进行通信
sharedWorker.port.start();

sharedWorker.port.postMessage({ from: 'pageA', message: 'Hello' });

sharedWorker.port.onmessage = (event) => {
  console.log('收到消息:', event.data);
};
```

```javascript
// shared-worker.js
const connections = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);

  port.onmessage = (e) => {
    const { from, message } = e.data;
    console.log(`收到来自 ${from} 的消息:`, message);

    // 广播给所有连接的客户端
    connections.forEach(p => {
      p.postMessage({
        from,
        message,
        totalConnections: connections.length
      });
    });
  };

  port.start();
};
```

Shared Worker 的使用场景：

- 多个标签页共享 WebSocket 连接
- 多页面间的数据同步
- 共享缓存和状态管理

### Service Worker

Service Worker 是一种特殊的 Worker，主要用于：

- 离线缓存和 PWA（渐进式 Web 应用）
- 网络请求拦截和代理
- 后台同步和推送通知

Service Worker 有独立的生命周期，即使页面关闭也可以在后台运行。

```javascript
// 注册 Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker 注册成功:', registration.scope);
    })
    .catch(error => {
      console.error('Service Worker 注册失败:', error);
    });
}
```

```javascript
// sw.js - Service Worker 脚本
const CACHE_NAME = 'my-app-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/logo.png'
];

// 安装阶段 - 缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 激活阶段 - 清理旧缓存
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

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // 返回缓存
        }
        return fetch(event.request); // 发起网络请求
      })
  );
});
```

### 三种 Worker 对比

| 特性 | Dedicated Worker | Shared Worker | Service Worker |
|------|------------------|---------------|----------------|
| 创建方式 | `new Worker()` | `new SharedWorker()` | `navigator.serviceWorker.register()` |
| 通信对象 | 单个页面 | 多个同源页面 | 所有同源页面 |
| 生命周期 | 随页面关闭而终止 | 所有连接关闭后终止 | 独立于页面 |
| 主要用途 | 后台计算 | 跨页面通信 | 离线缓存、推送通知 |
| 浏览器支持 | 广泛 | 较好（Safari 较晚支持） | 广泛 |

## 创建与通信

### 创建 Worker

有两种方式创建 Worker：

**方式一：外部脚本文件**

```javascript
// 最常用的方式
const worker = new Worker('worker.js');

// 可以指定 Worker 类型和名称
const worker = new Worker('worker.js', {
  type: 'classic', // 或 'module'（支持 ES 模块）
  name: 'my-worker' // Worker 的名称，便于调试
});
```

**方式二：内联 Worker（使用 Blob）**

```javascript
// 适用于简单的 Worker 或不想创建额外文件的场景
const workerCode = `
  self.onmessage = (e) => {
    const result = e.data * 2;
    self.postMessage(result);
  };
`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);
const worker = new Worker(workerUrl);

// 使用完毕后释放 URL
// URL.revokeObjectURL(workerUrl);
```

**方式三：ES 模块 Worker**

```javascript
// 现代浏览器支持模块化 Worker
const worker = new Worker('worker.js', { type: 'module' });
```

```javascript
// worker.js - 可以使用 import
import { processData } from './utils.js';

self.onmessage = (event) => {
  const result = processData(event.data);
  self.postMessage(result);
};
```

### 消息通信

Worker 与主线程之间通过消息传递进行通信，使用 `postMessage` 发送消息，通过 `onmessage` 事件接收消息。

```javascript
// 主线程
const worker = new Worker('worker.js');

// 发送简单消息
worker.postMessage('Hello Worker');

// 发送复杂对象
worker.postMessage({
  type: 'PROCESS_DATA',
  payload: {
    items: [1, 2, 3, 4, 5],
    options: { sort: true, filter: x => x > 2 }
  }
});

// 接收消息
worker.onmessage = (event) => {
  console.log('主线程收到:', event.data);
};

// 也可以使用 addEventListener
worker.addEventListener('message', (event) => {
  console.log('主线程收到:', event.data);
});
```

```javascript
// worker.js
self.onmessage = (event) => {
  console.log('Worker 收到:', event.data);

  // 处理数据
  const result = processData(event.data);

  // 发送结果回主线程
  self.postMessage(result);
};

function processData(data) {
  if (typeof data === 'string') {
    return `Worker 回复: ${data}`;
  }

  if (data.type === 'PROCESS_DATA') {
    let items = data.payload.items;
    if (data.payload.options.sort) {
      items = items.sort((a, b) => a - b);
    }
    return { type: 'RESULT', data: items };
  }

  return data;
}
```

### 错误处理

```javascript
// 主线程中处理 Worker 错误
worker.onerror = (error) => {
  console.error('Worker 错误:');
  console.error('  消息:', error.message);
  console.error('  文件:', error.filename);
  console.error('  行号:', error.lineno);
  console.error('  列号:', error.colno);

  // 阻止错误继续传播
  error.preventDefault();
};

// 处理消息错误
worker.onmessageerror = (event) => {
  console.error('消息反序列化失败:', event);
};
```

```javascript
// Worker 内部错误处理
self.onerror = (error) => {
  console.error('Worker 内部错误:', error);
};

self.onmessage = (event) => {
  try {
    const result = riskyOperation(event.data);
    self.postMessage({ success: true, data: result });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message
    });
  }
};
```

### 终止 Worker

```javascript
// 从主线程终止 Worker（立即停止）
worker.terminate();

// 从 Worker 内部关闭（允许完成当前任务）
self.close();
```

最佳实践：

```javascript
// 封装 Worker 管理器
class WorkerManager {
  constructor(scriptUrl) {
    this.worker = new Worker(scriptUrl);
    this.callbacks = new Map();
    this.messageId = 0;

    this.worker.onmessage = (event) => {
      const { id, result, error } = event.data;
      const callback = this.callbacks.get(id);

      if (callback) {
        if (error) {
          callback.reject(new Error(error));
        } else {
          callback.resolve(result);
        }
        this.callbacks.delete(id);
      }
    };
  }

  send(data) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      this.callbacks.set(id, { resolve, reject });
      this.worker.postMessage({ id, data });
    });
  }

  terminate() {
    this.worker.terminate();
    this.callbacks.clear();
  }
}

// 使用
const manager = new WorkerManager('worker.js');
const result = await manager.send({ type: 'calculate', value: 100 });
```

## Transferable Objects

### 数据传输机制

Worker 与主线程之间传递数据默认使用**结构化克隆算法**（Structured Clone Algorithm），这意味着数据会被复制一份传递给对方。对于大型数据，这种复制操作会带来性能开销。

```javascript
// 传递大数组 - 会被复制
const largeArray = new Float64Array(1000000);
worker.postMessage(largeArray);
// 复制后，主线程和 Worker 各有一份数据
```

### 使用 Transferable Objects

Transferable Objects 允许**转移**数据的所有权，而不是复制数据。转移后，原始上下文中的数据将不再可用，从而实现零拷贝传输。

支持转移的对象类型：

- `ArrayBuffer`
- `MessagePort`
- `ImageBitmap`
- `OffscreenCanvas`
- `ReadableStream` / `WritableStream` / `TransformStream`

```javascript
// 创建大型 ArrayBuffer
const buffer = new ArrayBuffer(1024 * 1024 * 100); // 100MB
const array = new Uint8Array(buffer);

// 填充数据
for (let i = 0; i < array.length; i++) {
  array[i] = i % 256;
}

console.log('转移前 buffer 大小:', buffer.byteLength); // 104857600

// 转移 ArrayBuffer 到 Worker
worker.postMessage(buffer, [buffer]);

console.log('转移后 buffer 大小:', buffer.byteLength); // 0（已转移）
```

```javascript
// worker.js
self.onmessage = (event) => {
  const buffer = event.data;
  console.log('Worker 收到 buffer 大小:', buffer.byteLength);

  // 处理数据
  const array = new Uint8Array(buffer);
  const sum = array.reduce((a, b) => a + b, 0);

  // 将结果转移回主线程
  const resultBuffer = new ArrayBuffer(8);
  const resultView = new Float64Array(resultBuffer);
  resultView[0] = sum;

  self.postMessage(resultBuffer, [resultBuffer]);
};
```

### 性能对比

```javascript
// 性能测试：复制 vs 转移
async function benchmark() {
  const size = 100 * 1024 * 1024; // 100MB

  // 测试复制
  const copyBuffer = new ArrayBuffer(size);
  console.time('复制传输');
  await sendToWorker(copyBuffer, false);
  console.timeEnd('复制传输');

  // 测试转移
  const transferBuffer = new ArrayBuffer(size);
  console.time('转移传输');
  await sendToWorker(transferBuffer, true);
  console.timeEnd('转移传输');
}

function sendToWorker(buffer, transfer) {
  return new Promise(resolve => {
    const worker = new Worker('benchmark-worker.js');
    worker.onmessage = () => {
      worker.terminate();
      resolve();
    };

    if (transfer) {
      worker.postMessage(buffer, [buffer]);
    } else {
      worker.postMessage(buffer);
    }
  });
}

// 结果示例：
// 复制传输: 150ms
// 转移传输: 1ms
```

### SharedArrayBuffer

`SharedArrayBuffer` 允许多个线程共享同一块内存，实现真正的共享内存多线程编程。

```javascript
// 创建共享内存
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedArray = new Int32Array(sharedBuffer);

// 传递给 Worker（共享，不是复制也不是转移）
worker.postMessage(sharedBuffer);

// 主线程和 Worker 可以同时访问和修改
sharedArray[0] = 42;
```

```javascript
// worker.js
self.onmessage = (event) => {
  const sharedBuffer = event.data;
  const sharedArray = new Int32Array(sharedBuffer);

  // Worker 可以看到主线程的修改
  console.log('Worker 读取:', sharedArray[0]); // 42

  // Worker 的修改主线程也能看到
  sharedArray[1] = 100;
};
```

使用 `Atomics` 进行同步操作：

```javascript
// 避免竞态条件
const sharedBuffer = new SharedArrayBuffer(4);
const sharedArray = new Int32Array(sharedBuffer);

// 原子操作
Atomics.store(sharedArray, 0, 123);
const value = Atomics.load(sharedArray, 0);
Atomics.add(sharedArray, 0, 1);
Atomics.sub(sharedArray, 0, 1);

// 等待和唤醒
// Worker 中等待
Atomics.wait(sharedArray, 0, 0); // 等待直到值不为 0

// 主线程唤醒
Atomics.store(sharedArray, 0, 1);
Atomics.notify(sharedArray, 0, 1); // 唤醒一个等待的 Worker
```

注意：`SharedArrayBuffer` 由于安全原因（Spectre 漏洞），需要特定的 HTTP 头才能使用：

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## 实际应用场景

### 图像处理

```javascript
// 主线程
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const imageWorker = new Worker('image-worker.js');

async function applyFilter(filterType) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 转移像素数据到 Worker
  const buffer = imageData.data.buffer;

  return new Promise((resolve) => {
    imageWorker.onmessage = (event) => {
      const processedData = new Uint8ClampedArray(event.data);
      const newImageData = new ImageData(
        processedData,
        canvas.width,
        canvas.height
      );
      ctx.putImageData(newImageData, 0, 0);
      resolve();
    };

    imageWorker.postMessage({
      type: filterType,
      data: buffer,
      width: canvas.width,
      height: canvas.height
    }, [buffer]);
  });
}
```

```javascript
// image-worker.js
self.onmessage = (event) => {
  const { type, data, width, height } = event.data;
  const pixels = new Uint8ClampedArray(data);

  switch (type) {
    case 'grayscale':
      applyGrayscale(pixels);
      break;
    case 'blur':
      applyBlur(pixels, width, height);
      break;
    case 'sharpen':
      applySharpen(pixels, width, height);
      break;
  }

  self.postMessage(pixels.buffer, [pixels.buffer]);
};

function applyGrayscale(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    pixels[i] = avg;     // R
    pixels[i + 1] = avg; // G
    pixels[i + 2] = avg; // B
    // pixels[i + 3] 是 Alpha，保持不变
  }
}

function applyBlur(pixels, width, height) {
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];
  const kernelSum = 16;

  const output = new Uint8ClampedArray(pixels.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += pixels[idx] * kernel[ky + 1][kx + 1];
          }
        }
        output[(y * width + x) * 4 + c] = sum / kernelSum;
      }
      output[(y * width + x) * 4 + 3] = pixels[(y * width + x) * 4 + 3];
    }
  }

  pixels.set(output);
}
```

### 大数据解析

```javascript
// 主线程 - 解析大型 CSV 文件
const parseWorker = new Worker('parse-worker.js');

async function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      parseWorker.postMessage({
        type: 'parseCSV',
        data: e.target.result
      });
    };

    parseWorker.onmessage = (event) => {
      if (event.data.success) {
        resolve(event.data.result);
      } else {
        reject(new Error(event.data.error));
      }
    };

    reader.readAsText(file);
  });
}

// 使用进度报告
parseWorker.onmessage = (event) => {
  const { type, progress, result } = event.data;

  if (type === 'progress') {
    updateProgressBar(progress);
  } else if (type === 'complete') {
    displayData(result);
  }
};
```

```javascript
// parse-worker.js
self.onmessage = (event) => {
  const { type, data } = event.data;

  if (type === 'parseCSV') {
    try {
      const result = parseCSV(data);
      self.postMessage({ success: true, result });
    } catch (error) {
      self.postMessage({ success: false, error: error.message });
    }
  }
};

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;

    const values = lines[i].split(',');
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim();
    });

    result.push(row);

    // 每处理 1000 行报告一次进度
    if (i % 1000 === 0) {
      self.postMessage({
        type: 'progress',
        progress: Math.round((i / lines.length) * 100)
      });
    }
  }

  self.postMessage({ type: 'complete', result });
  return result;
}
```

### 加密解密

```javascript
// 主线程
const cryptoWorker = new Worker('crypto-worker.js');

async function encryptData(data, key) {
  return new Promise((resolve, reject) => {
    cryptoWorker.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.encrypted);
      }
    };

    cryptoWorker.postMessage({
      action: 'encrypt',
      data,
      key
    });
  });
}

async function decryptData(encryptedData, key) {
  return new Promise((resolve, reject) => {
    cryptoWorker.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.decrypted);
      }
    };

    cryptoWorker.postMessage({
      action: 'decrypt',
      data: encryptedData,
      key
    });
  });
}
```

```javascript
// crypto-worker.js
self.onmessage = async (event) => {
  const { action, data, key } = event.data;

  try {
    const cryptoKey = await importKey(key);

    if (action === 'encrypt') {
      const encrypted = await encrypt(data, cryptoKey);
      self.postMessage({ encrypted });
    } else if (action === 'decrypt') {
      const decrypted = await decrypt(data, cryptoKey);
      self.postMessage({ decrypted });
    }
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};

async function importKey(keyString) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);

  return crypto.subtle.importKey(
    'raw',
    keyData.slice(0, 32), // AES-256 需要 32 字节
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(data, key) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(data))
  );

  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}

async function decrypt(encryptedData, key) {
  const iv = new Uint8Array(encryptedData.iv);
  const data = new Uint8Array(encryptedData.data);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}
```

### 实时数据处理

```javascript
// 主线程 - WebSocket 数据处理
const dataWorker = new Worker('data-worker.js');
const socket = new WebSocket('wss://api.example.com/stream');

socket.onmessage = (event) => {
  // 将原始数据转发给 Worker 处理
  dataWorker.postMessage({
    type: 'process',
    data: event.data
  });
};

dataWorker.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'update':
      updateChart(data);
      break;
    case 'alert':
      showNotification(data);
      break;
  }
};
```

```javascript
// data-worker.js
const buffer = [];
const BUFFER_SIZE = 100;
const ALERT_THRESHOLD = 0.95;

self.onmessage = (event) => {
  if (event.data.type === 'process') {
    processData(JSON.parse(event.data.data));
  }
};

function processData(data) {
  buffer.push(data);

  if (buffer.length > BUFFER_SIZE) {
    buffer.shift();
  }

  // 计算统计数据
  const stats = calculateStats(buffer);

  // 发送更新
  self.postMessage({
    type: 'update',
    data: {
      current: data,
      stats
    }
  });

  // 异常检测
  if (data.value > ALERT_THRESHOLD * stats.max) {
    self.postMessage({
      type: 'alert',
      data: {
        message: '检测到异常值',
        value: data.value,
        threshold: ALERT_THRESHOLD * stats.max
      }
    });
  }
}

function calculateStats(data) {
  const values = data.map(d => d.value);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    count: values.length
  };
}
```

## 性能考虑

### 何时使用 Web Workers

**适合使用 Worker 的场景**：

- 计算时间超过 50ms 的任务（影响一帧的渲染）
- 需要处理大量数据的操作
- 需要保持 UI 响应的后台任务
- CPU 密集型计算

**不适合使用 Worker 的场景**：

- 简单快速的操作（Worker 创建和通信有开销）
- 需要频繁访问 DOM 的操作
- 需要与主线程紧密交互的任务

### Worker 池

为了避免频繁创建和销毁 Worker 带来的开销，可以使用 Worker 池：

```javascript
class WorkerPool {
  constructor(workerScript, poolSize = navigator.hardwareConcurrency || 4) {
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    this.workerStatus = [];

    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      this.workers.push(worker);
      this.workerStatus.push('idle');

      worker.onmessage = (event) => {
        this.handleWorkerResponse(i, event);
      };
    }
  }

  run(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };

      const idleWorkerIndex = this.workerStatus.indexOf('idle');

      if (idleWorkerIndex !== -1) {
        this.runTask(idleWorkerIndex, task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  runTask(workerIndex, task) {
    this.workerStatus[workerIndex] = 'busy';
    this.workers[workerIndex].currentTask = task;
    this.workers[workerIndex].postMessage(task.data);
  }

  handleWorkerResponse(workerIndex, event) {
    const worker = this.workers[workerIndex];
    const task = worker.currentTask;

    if (event.data.error) {
      task.reject(new Error(event.data.error));
    } else {
      task.resolve(event.data.result);
    }

    // 处理队列中的下一个任务
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      this.runTask(workerIndex, nextTask);
    } else {
      this.workerStatus[workerIndex] = 'idle';
    }
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
  }
}

// 使用
const pool = new WorkerPool('compute-worker.js', 4);

// 并行处理多个任务
const tasks = [1, 2, 3, 4, 5, 6, 7, 8].map(n =>
  pool.run({ type: 'compute', value: n })
);

const results = await Promise.all(tasks);
console.log('结果:', results);
```

### 减少通信开销

```javascript
// 不好：频繁发送小消息
for (let i = 0; i < 1000; i++) {
  worker.postMessage({ index: i, value: data[i] });
}

// 好：批量发送
worker.postMessage({
  type: 'batch',
  items: data.slice(0, 1000)
});

// 更好：使用 Transferable Objects
const buffer = new Float64Array(data).buffer;
worker.postMessage(buffer, [buffer]);
```

### 内存管理

```javascript
// Worker 内存管理示例
class ManagedWorker {
  constructor(scriptUrl) {
    this.worker = new Worker(scriptUrl);
    this.memoryWarningThreshold = 100 * 1024 * 1024; // 100MB

    // 定期检查内存使用
    if (performance.memory) {
      setInterval(() => {
        this.checkMemory();
      }, 10000);
    }
  }

  checkMemory() {
    const memory = performance.memory;
    const usedMemory = memory.usedJSHeapSize;

    if (usedMemory > this.memoryWarningThreshold) {
      console.warn('Worker 内存使用过高:',
        Math.round(usedMemory / 1024 / 1024) + 'MB');

      // 通知 Worker 清理内存
      this.worker.postMessage({ type: 'cleanup' });
    }
  }

  terminate() {
    this.worker.terminate();
  }
}

// worker.js
let cache = new Map();

self.onmessage = (event) => {
  if (event.data.type === 'cleanup') {
    cache.clear();
    // 强制垃圾回收（如果可能）
    if (typeof gc !== 'undefined') {
      gc();
    }
    return;
  }

  // 处理其他消息...
};
```

### 调试技巧

1. **Chrome DevTools**：可以在 Sources 面板中调试 Worker 脚本
2. **命名 Worker**：便于在 DevTools 中识别

```javascript
const worker = new Worker('worker.js', { name: 'DataProcessor' });
```

3. **日志代理**：

```javascript
// worker.js
const originalConsole = { ...console };

['log', 'warn', 'error', 'info'].forEach(method => {
  console[method] = (...args) => {
    self.postMessage({
      type: 'console',
      method,
      args: args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : arg
      )
    });
    originalConsole[method](...args);
  };
});
```

```javascript
// 主线程
worker.onmessage = (event) => {
  if (event.data.type === 'console') {
    const { method, args } = event.data;
    console[method]('[Worker]', ...args);
  }
};
```

## 面试要点

### 常见面试题

#### Web Workers 和主线程的区别

```javascript
// 主线程特点
- 可以访问 DOM
- 单线程，长任务会阻塞 UI
- 可以访问 window 对象

// Web Workers 特点
- 不能访问 DOM
- 独立线程，不会阻塞主线程
- 使用 self 代替 window
- 通过 postMessage 通信
```

#### 如何在 Worker 中使用外部库

```javascript
// 方式一：importScripts（传统方式）
importScripts('lodash.min.js', 'moment.min.js');

// 方式二：ES 模块（现代浏览器）
// main.js
const worker = new Worker('worker.js', { type: 'module' });

// worker.js
import _ from './lodash-es.js';
```

#### 三种 Worker 的选择

```javascript
// Dedicated Worker：一对一通信，后台计算
const worker = new Worker('compute.js');

// Shared Worker：跨页面共享，多标签页通信
const sharedWorker = new SharedWorker('shared.js');

// Service Worker：离线缓存，网络代理
navigator.serviceWorker.register('sw.js');
```

#### 如何处理 Worker 中的错误

```javascript
// 主线程捕获错误
worker.onerror = (error) => {
  console.error('Worker 错误:', error.message);
  error.preventDefault(); // 阻止默认处理
};

// Worker 内部 try-catch
self.onmessage = (event) => {
  try {
    const result = process(event.data);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
```

### 关键概念总结

1. **多线程实现**：Web Workers 是 JavaScript 实现多线程的唯一方式
2. **通信机制**：使用 postMessage 和 onmessage 进行消息传递
3. **数据传输**：默认复制，可使用 Transferable Objects 转移所有权
4. **共享内存**：SharedArrayBuffer 配合 Atomics 实现真正的共享内存
5. **Worker 类型**：Dedicated、Shared、Service 各有适用场景
6. **性能优化**：Worker 池、批量通信、合理使用转移对象

### 最佳实践

1. **评估是否需要 Worker**：只对耗时任务使用
2. **减少通信频率**：批量传输数据
3. **使用 Transferable Objects**：大数据量时避免复制
4. **实现 Worker 池**：复用 Worker 实例
5. **优雅降级**：检测 Worker 支持并提供回退方案
6. **内存管理**：及时清理不再使用的数据
7. **错误处理**：完善的错误捕获和上报机制

```javascript
// 检测 Worker 支持
if (typeof Worker !== 'undefined') {
  // 使用 Worker
  const worker = new Worker('worker.js');
} else {
  // 回退到主线程执行
  console.warn('Web Workers 不受支持，将在主线程执行');
}
```

## 延伸阅读

### 推荐资源

1. **MDN 文档**
   - [Web Workers API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API)
   - [使用 Web Workers](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Using_web_workers)
   - [Service Worker API](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)

2. **规范文档**
   - [HTML Living Standard - Web Workers](https://html.spec.whatwg.org/multipage/workers.html)
   - [Service Workers 规范](https://w3c.github.io/ServiceWorker/)

3. **工具库**
   - [Comlink](https://github.com/GoogleChromeLabs/comlink) - 简化 Worker 通信
   - [workerpool](https://github.com/josdejong/workerpool) - Worker 池实现
   - [workerize](https://github.com/developit/workerize) - 将模块移入 Worker

### 相关概念

- **事件循环**：理解 JavaScript 单线程模型
- **异步编程**：Promise、async/await 与 Worker 配合使用
- **PWA**：Service Worker 是 PWA 的核心技术
- **WebAssembly**：可在 Worker 中运行，获得更高性能

---

Web Workers 是实现高性能 Web 应用的重要工具。通过合理使用多线程技术，可以显著提升用户体验，处理更复杂的计算任务，同时保持 UI 的流畅响应。掌握 Worker 的使用方法和最佳实践，将帮助你构建更加强大的 Web 应用。
