---
title: JavaScript Server-Sent Events (SSE)
description: 掌握 SSE：实时单向通信、事件流处理与服务器推送的完整指南
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - SSE
  - EventSource
  - 实时通信
  - 服务器推送
status: imported
origin: old/src/content/docs/javascript/server-sent-events.zh.md
divergence: 0.171
issues:
  - title-lang-zh
  - missing-subcategory-en
  - title-language
legacy:
  category: JavaScript
  subcategory: 实时通信
  order: 45
  lastUpdated: 2026-01-07
---

Server-Sent Events（简称 SSE）是一种实现服务器向客户端实时推送数据的技术。与 WebSocket 的双向通信不同，SSE 提供单向的、基于 HTTP 的事件流传输方案。它具有实现简单、自动重连、事件路由等优势，适合用于实时通知、数据更新推送等场景。

## 概念解释

### 什么是 Server-Sent Events

Server-Sent Events 是一种基于 HTTP 的单向通信协议，允许服务器主动向客户端浏览器推送消息。与 WebSocket 的双向实时通信不同，SSE 采用单工通信模式：客户端通过 HTTP 建立连接，服务器源源不断地向客户端发送事件流。

### SSE 的特点

1. **单向通信**：只能由服务器向客户端推送数据，客户端无法直接向服务器发送数据
2. **基于 HTTP**：使用标准的 HTTP 协议，无需特殊的网络配置
3. **自动重连**：客户端连接断开时会自动尝试重新连接
4. **事件驱动**：支持不同类型的事件，通过事件名称区分
5. **纯文本格式**：消息采用简单的文本格式，易于解析

### SSE vs WebSocket vs Polling

```
┌─────────────────────────────────────────────────────────┐
│          通信方式对比                                    │
├─────────────┬──────────────┬──────────────┬─────────────┤
│   特性      │     SSE      │  WebSocket   │   Polling   │
├─────────────┼──────────────┼──────────────┼─────────────┤
│ 通信方向    │   单向推送   │   双向通信   │   单向拉取  │
│ 协议        │   HTTP       │   WS/WSS     │   HTTP      │
│ 延迟        │   低         │   低         │   高        │
│ 服务器负载  │   中         │   高         │   很高      │
│ 自动重连    │   是         │   否         │   否        │
│ 消息格式    │   纯文本     │   纯文本     │   灵活      │
│ 穿透代理    │   优         │   差         │   好        │
└─────────────┴──────────────┴──────────────┴─────────────┘
```

## 核心原理

### EventSource API

EventSource 是客户端用于连接 SSE 服务的 JavaScript API。

```javascript
// 创建 EventSource 连接
const eventSource = new EventSource('/api/events');

// 或者带有配置参数
const eventSource = new EventSource(url, {
  withCredentials: true  // 允许跨域请求时发送 Cookie
});
```

### SSE 消息格式

SSE 消息采用简单的文本格式，由行分隔。每条消息由以下字段组成：

```
field: value
event: message
data: {"id": 1, "name": "示例"}
id: 123
retry: 5000

: 这是注释
data: 多行数据第一行
data: 多行数据第二行

```

**字段说明：**

- `data`：消息内容（必需），可以指定多次来发送多行数据
- `event`：事件类型（可选），默认为 "message"
- `id`：消息 ID（可选），客户端会自动记录以支持断点续传
- `retry`：重连等待时间，单位毫秒（可选）
- `:` 开头的行被视为注释

### 服务器端实现原理

```javascript
// Node.js Express 示例
app.get('/api/events', (req, res) => {
  // 1. 设置响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // 2. 发送初始消息
  res.write(':server-sent-events\n\n');

  // 3. 定期向客户端发送消息
  const interval = setInterval(() => {
    res.write('data: ' + JSON.stringify({
      timestamp: new Date().toISOString(),
      message: '实时数据'
    }) + '\n\n');
  }, 1000);

  // 4. 处理连接关闭
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});
```

## 核心要点

### EventSource 的生命周期

```javascript
const eventSource = new EventSource('/api/events');

// 连接打开时触发
eventSource.addEventListener('open', (event) => {
  console.log('连接已建立');
});

// 接收消息
eventSource.addEventListener('message', (event) => {
  console.log('收到消息:', event.data);
});

// 接收特定事件类型
eventSource.addEventListener('custom-event', (event) => {
  console.log('收到自定义事件:', event.data);
});

// 发生错误时触发
eventSource.addEventListener('error', (event) => {
  if (event.readyState === EventSource.CLOSED) {
    console.log('连接已关闭');
  } else {
    console.log('连接出错，将自动重连');
  }
});

// 手动关闭连接
eventSource.close();
```

### readyState 状态

```javascript
// EventSource 的三种状态
// EventSource.CONNECTING (0) - 连接中
// EventSource.OPEN (1) - 已连接
// EventSource.CLOSED (2) - 已关闭

const eventSource = new EventSource('/api/events');

console.log(eventSource.readyState); // 初始状态

eventSource.addEventListener('open', () => {
  console.log(eventSource.readyState); // 1 - OPEN
});

eventSource.addEventListener('close', () => {
  console.log(eventSource.readyState); // 2 - CLOSED
});
```

### 消息事件对象

```javascript
eventSource.addEventListener('message', (event) => {
  // event 属性说明
  console.log(event.data);      // 消息数据（字符串）
  console.log(event.type);      // 事件类型
  console.log(event.lastEventId); // 最后一个消息的 ID
});
```

## 代码示例

### 基础 SSE 客户端

```javascript
// client.js
class SSEClient {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
  }

  // 建立连接
  connect() {
    this.eventSource = new EventSource(this.url);

    // 连接打开
    this.eventSource.addEventListener('open', () => {
      console.log('[SSE] 连接已建立');
    });

    // 接收消息
    this.eventSource.addEventListener('message', (event) => {
      console.log('[SSE] 收到消息:', event.data);
      this.handleMessage(JSON.parse(event.data));
    });

    // 错误处理
    this.eventSource.addEventListener('error', (event) => {
      console.error('[SSE] 连接出错:', event);
      if (event.readyState === EventSource.CLOSED) {
        console.log('[SSE] 连接已关闭');
      }
    });
  }

  // 处理消息（可被子类覆盖）
  handleMessage(data) {
    console.log('处理消息:', data);
  }

  // 断开连接
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      console.log('[SSE] 连接已断开');
    }
  }
}

// 使用
const client = new SSEClient('/api/events');
client.connect();
```

### 服务器端实现（Node.js）

```javascript
// server.js
const express = require('express');
const app = express();

// 存储所有连接的客户端
const clients = new Set();

// SSE 路由
app.get('/api/events', (req, res) => {
  // 设置响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream;charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  // 发送连接成功消息
  res.write(': connected\n\n');

  // 将客户端加入集合
  clients.add(res);

  // 处理断开连接
  req.on('close', () => {
    clients.delete(res);
    console.log(`客户端断开连接，剩余 ${clients.size} 个客户端`);
  });

  // 向新客户端发送欢迎消息
  res.write(`id: ${Date.now()}\n`);
  res.write('event: welcome\n');
  res.write(`data: 欢迎连接到 SSE 服务\n\n`);
});

// 向所有客户端广播消息
function broadcast(eventType, data) {
  const message = `id: ${Date.now()}\n` +
                  `event: ${eventType}\n` +
                  `data: ${JSON.stringify(data)}\n\n`;

  clients.forEach(client => {
    client.write(message);
  });
}

// 定期发送消息
setInterval(() => {
  broadcast('tick', {
    timestamp: new Date().toISOString(),
    activeClients: clients.size
  });
}, 5000);

// 示例：接收 POST 请求并广播
app.post('/api/broadcast', express.json(), (req, res) => {
  const { message } = req.body;
  broadcast('custom', { message });
  res.json({ success: true, clients: clients.size });
});

app.listen(3000, () => {
  console.log('SSE 服务运行在 http://localhost:3000');
});
```

### 实时数据更新示例

```javascript
// 股票行情实时推送示例
app.get('/api/stock-prices', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // 模拟股票价格更新
  let messageId = 0;
  const interval = setInterval(() => {
    const stockData = {
      symbol: 'AAPL',
      price: (150 + Math.random() * 10).toFixed(2),
      change: (Math.random() - 0.5).toFixed(2),
      timestamp: new Date().toISOString()
    };

    res.write(`id: ${messageId++}\n`);
    res.write('event: price-update\n');
    res.write(`data: ${JSON.stringify(stockData)}\n\n`);
  }, 1000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// 客户端处理
const eventSource = new EventSource('/api/stock-prices');

eventSource.addEventListener('price-update', (event) => {
  const stock = JSON.parse(event.data);
  console.log(`${stock.symbol}: ${stock.price}（${stock.change}）`);
  updateUI(stock);
});
```

### 自动重连机制

```javascript
class RobustSSEClient {
  constructor(url, options = {}) {
    this.url = url;
    this.eventSource = null;
    this.maxRetries = options.maxRetries || 5;
    this.retryCount = 0;
    this.baseDelay = options.baseDelay || 1000;
    this.messageId = null;
  }

  connect() {
    try {
      const url = this.messageId
        ? `${this.url}?lastEventId=${this.messageId}`
        : this.url;

      this.eventSource = new EventSource(url);

      this.eventSource.addEventListener('open', () => {
        console.log('[SSE] 连接成功');
        this.retryCount = 0; // 重置重试计数
      });

      this.eventSource.addEventListener('message', (event) => {
        this.messageId = event.lastEventId;
        console.log('[SSE] 收到消息:', event.data);
      });

      this.eventSource.addEventListener('error', (event) => {
        this.handleError(event);
      });
    } catch (error) {
      console.error('[SSE] 连接错误:', error);
      this.retry();
    }
  }

  handleError(event) {
    if (event.readyState === EventSource.CLOSED) {
      console.log('[SSE] 连接已关闭');
    } else {
      console.warn('[SSE] 连接出错，准备重连...');
      this.eventSource.close();
      this.retry();
    }
  }

  retry() {
    if (this.retryCount >= this.maxRetries) {
      console.error('[SSE] 达到最大重试次数，停止重连');
      return;
    }

    this.retryCount++;
    const delay = this.baseDelay * Math.pow(2, this.retryCount - 1);
    const jitter = Math.random() * 0.1 * delay; // 添加抖动避免雷群效应

    console.log(`[SSE] ${(delay + jitter) / 1000}s 后进行第 ${this.retryCount} 次重连...`);
    setTimeout(() => this.connect(), delay + jitter);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      console.log('[SSE] 连接已断开');
    }
  }
}

// 使用
const client = new RobustSSEClient('/api/events', {
  maxRetries: 5,
  baseDelay: 1000
});
client.connect();
```

### 带心跳检测的 SSE

```javascript
// 服务器端：发送心跳
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // 发送心跳以保持连接活动
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n'); // 注释行，不会被事件处理器接收
  }, 30000); // 每 30 秒发送一次

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// 客户端：检测心跳超时
class HeartbeatSSEClient {
  constructor(url, heartbeatTimeout = 60000) {
    this.url = url;
    this.eventSource = null;
    this.heartbeatTimeout = heartbeatTimeout;
    this.heartbeatTimer = null;
  }

  connect() {
    this.eventSource = new EventSource(this.url);

    this.eventSource.addEventListener('open', () => {
      this.resetHeartbeatTimer();
    });

    this.eventSource.addEventListener('message', (event) => {
      this.resetHeartbeatTimer();
      console.log('收到消息:', event.data);
    });

    this.eventSource.addEventListener('error', () => {
      this.clearHeartbeatTimer();
    });
  }

  resetHeartbeatTimer() {
    this.clearHeartbeatTimer();
    this.heartbeatTimer = setTimeout(() => {
      console.warn('心跳超时，连接可能已断开');
      this.eventSource.close();
      // 尝试重新连接
      this.connect();
    }, this.heartbeatTimeout);
  }

  clearHeartbeatTimer() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  disconnect() {
    this.clearHeartbeatTimer();
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
```

### 不同事件类型处理

```javascript
// 服务器端：发送不同类型的事件
app.get('/api/dashboard', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  });

  // 发送欢迎事件
  res.write('event: welcome\n');
  res.write('data: 欢迎连接到仪表板\n\n');

  // 发送数据更新
  setTimeout(() => {
    res.write('event: data-update\n');
    res.write(`data: ${JSON.stringify({ value: 42 })}\n\n`);
  }, 1000);

  // 发送警告
  setTimeout(() => {
    res.write('event: warning\n');
    res.write('data: 检测到异常活动\n\n');
  }, 2000);

  // 发送默认消息
  setTimeout(() => {
    res.write('data: 这是默认消息类型\n\n');
  }, 3000);

  req.on('close', () => {
    res.end();
  });
});

// 客户端：分别处理不同事件
const eventSource = new EventSource('/api/dashboard');

eventSource.addEventListener('welcome', (event) => {
  console.log('📌 欢迎:', event.data);
});

eventSource.addEventListener('data-update', (event) => {
  const data = JSON.parse(event.data);
  console.log('📊 数据更新:', data);
});

eventSource.addEventListener('warning', (event) => {
  console.warn('⚠️ 警告:', event.data);
});

eventSource.addEventListener('message', (event) => {
  console.log('ℹ️ 消息:', event.data);
});

eventSource.addEventListener('error', (event) => {
  console.error('❌ 错误:', event);
});
```

## 最佳实践

### 正确设置响应头

```javascript
// 重要的响应头设置
const responseHeaders = {
  // SSE 必需
  'Content-Type': 'text/event-stream;charset=utf-8',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',

  // 跨域支持
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',

  // 可选但推荐
  'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲
  'Transfer-Encoding': 'chunked' // 分块传输
};
```

### 实现消息 ID 和断点续传

```javascript
// 服务器端：记录消息 ID
let messageId = req.query.lastEventId ? parseInt(req.query.lastEventId) : 0;

res.write(`id: ${messageId}\n`);
res.write('event: message\n');
res.write(`data: ${JSON.stringify({ id: messageId, data: 'content' })}\n\n`);
messageId++;

// 客户端：自动断点续传
const eventSource = new EventSource('/api/events');
// 浏览器自动发送 Last-Event-ID 请求头，无需手动处理
```

### 内存和资源管理

```javascript
class ManagedSSEClient {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.listeners = new Map();
    this.maxMessageBuffer = 100;
    this.messageBuffer = [];
  }

  addEventListener(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(handler);

    if (this.eventSource) {
      this.eventSource.addEventListener(eventType, handler);
    }
  }

  removeEventListener(eventType, handler) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(handler);
      if (this.eventSource) {
        this.eventSource.removeEventListener(eventType, handler);
      }
    }
  }

  connect() {
    this.eventSource = new EventSource(this.url);

    // 重新注册所有监听器
    for (const [eventType, handlers] of this.listeners) {
      handlers.forEach(handler => {
        this.eventSource.addEventListener(eventType, handler);
      });
    }

    this.eventSource.addEventListener('message', (event) => {
      this.bufferMessage(event.data);
    });
  }

  bufferMessage(data) {
    this.messageBuffer.push({
      data,
      timestamp: Date.now()
    });

    // 防止缓冲区过大
    if (this.messageBuffer.length > this.maxMessageBuffer) {
      this.messageBuffer.shift();
    }
  }

  getMessageHistory(limit = 10) {
    return this.messageBuffer.slice(-limit);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    this.listeners.clear();
    this.messageBuffer = [];
  }

  destroy() {
    this.disconnect();
    this.listeners = null;
    this.messageBuffer = null;
  }
}
```

### 错误恢复策略

```javascript
class ResilientSSEClient {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.isExplicitlyClosed = false;
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 10;
  }

  connect() {
    this.isExplicitlyClosed = false;
    this.eventSource = new EventSource(this.url);

    this.eventSource.addEventListener('open', () => {
      console.log('连接成功');
      this.consecutiveErrors = 0;
    });

    this.eventSource.addEventListener('error', (event) => {
      if (this.isExplicitlyClosed) return;

      this.consecutiveErrors++;
      console.warn(`错误 ${this.consecutiveErrors}/${this.maxConsecutiveErrors}`);

      if (this.consecutiveErrors > this.maxConsecutiveErrors) {
        console.error('错误过多，放弃重连');
        this.disconnect();
      }
    });
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
```

### 性能优化

```javascript
// 1. 批量发送消息而不是逐个发送
class BatchedSSEServer {
  constructor(res, batchSize = 10, batchDelay = 100) {
    this.res = res;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
    this.queue = [];
    this.batchTimer = null;
  }

  enqueue(event, data) {
    this.queue.push({ event, data });

    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), this.batchDelay);
    }
  }

  flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    batch.forEach(({ event, data }) => {
      this.res.write(`event: ${event}\n`);
      this.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

// 2. 客户端去抖动
class DebouncedSSEClient {
  constructor(url, debounceDelay = 100) {
    this.url = url;
    this.debounceDelay = debounceDelay;
    this.pendingUpdate = null;
    this.eventSource = null;
  }

  connect() {
    this.eventSource = new EventSource(this.url);

    this.eventSource.addEventListener('message', (event) => {
      clearTimeout(this.pendingUpdate);
      this.pendingUpdate = setTimeout(() => {
        this.handleMessage(JSON.parse(event.data));
      }, this.debounceDelay);
    });
  }

  handleMessage(data) {
    console.log('处理消息:', data);
  }

  disconnect() {
    clearTimeout(this.pendingUpdate);
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
```

## 常见陷阱

### 陷阱 1：忘记设置正确的 Content-Type

```javascript
// ❌ 错误
res.writeHead(200, {
  'Content-Type': 'application/json' // 错误的内容类型
});

// ✅ 正确
res.writeHead(200, {
  'Content-Type': 'text/event-stream;charset=utf-8'
});
```

### 陷阱 2：未正确格式化 SSE 消息

```javascript
// ❌ 错误：缺少换行符
res.write('data: hello');

// ✅ 正确：两个换行符结束消息
res.write('data: hello\n\n');

// ❌ 错误：JSON 直接写入
res.write(data);

// ✅ 正确：在 data 字段中包含
res.write(`data: ${JSON.stringify(data)}\n\n`);
```

### 陷阱 3：忽视连接超时

```javascript
// ❌ 容易导致僵尸连接
app.get('/api/events', (req, res) => {
  setInterval(() => {
    res.write(`data: message\n\n`);
  }, 1000);
});

// ✅ 添加超时和心跳检测
app.get('/api/events', (req, res) => {
  const timeout = setTimeout(() => {
    res.end();
  }, 24 * 60 * 60 * 1000); // 24 小时超时

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n'); // 心跳消息
  }, 30000);

  req.on('close', () => {
    clearTimeout(timeout);
    clearInterval(heartbeat);
  });
});
```

### 陷阱 4：未处理多行数据

```javascript
// ❌ 错误：多行数据被当作单个消息
res.write('data: line1\n');
res.write('data: line2\n');
res.write('\n'); // 结束符在最后

// 接收到: "line1\nline2"

// ✅ 正确方式
res.write('data: line1\n');
res.write('data: line2\n');
res.write('\n'); // 正确

// 或者
res.write('data: ' + JSON.stringify({
  line1: 'value1',
  line2: 'value2'
}) + '\n\n');
```

### 陷阱 5：忽视浏览器的连接限制

```javascript
// ❌ 错误：一个域名最多 6 个连接
for (let i = 0; i < 10; i++) {
  new EventSource(`/api/events?id=${i}`);
}

// ✅ 正确：复用单个连接
const eventSource = new EventSource('/api/events');

eventSource.addEventListener('event1', handler1);
eventSource.addEventListener('event2', handler2);
eventSource.addEventListener('event3', handler3);
```

### 陷阱 6：跨域请求处理不当

```javascript
// ❌ 错误：跨域时未发送凭证
const eventSource = new EventSource('https://other-domain.com/api/events');

// ✅ 正确：跨域时传递凭证
const eventSource = new EventSource('https://other-domain.com/api/events', {
  withCredentials: true
});

// 服务器端也需要正确配置
res.setHeader('Access-Control-Allow-Credentials', 'true');
res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
```

## 性能考量

### 服务器资源占用

```javascript
// 监控连接数
let activeConnections = 0;

app.get('/api/events', (req, res) => {
  activeConnections++;
  console.log(`活跃连接数: ${activeConnections}`);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream'
  });

  req.on('close', () => {
    activeConnections--;
    console.log(`活跃连接数: ${activeConnections}`);
  });
});

// 定期报告统计信息
setInterval(() => {
  console.log(`当前有 ${activeConnections} 个活跃连接`);
  if (activeConnections > 1000) {
    console.warn('连接数过多，可能影响性能');
  }
}, 60000);
```

### 消息发送频率

```javascript
// ✅ 最佳实践：根据实际需求调整发送频率
class AdaptiveSSEServer {
  constructor() {
    this.clients = new Set();
    this.messageQueue = [];
    this.minDelay = 100;  // 最小延迟
    this.maxDelay = 5000; // 最大延迟
  }

  broadcast(data) {
    this.messageQueue.push(data);
    this.tryFlush();
  }

  tryFlush() {
    // 根据连接数动态调整批处理间隔
    const delay = Math.min(
      this.maxDelay,
      Math.max(this.minDelay, 1000 / this.clients.size)
    );

    setTimeout(() => {
      this.flush();
    }, delay);
  }

  flush() {
    if (this.messageQueue.length === 0) return;

    const batch = this.messageQueue.splice(0);
    const message = `data: ${JSON.stringify(batch)}\n\n`;

    this.clients.forEach(res => {
      try {
        res.write(message);
      } catch (error) {
        this.clients.delete(res);
      }
    });
  }
}
```

### 带宽优化

```javascript
// 1. 压缩响应
const compression = require('compression');
app.use(compression());

// 2. 选择合适的消息格式
// 相比完整 JSON，使用更紧凑的格式
res.write('data: ' + JSON.stringify({u: 123, p: 45.6}) + '\n\n');

// 3. 限制消息大小
function writeMessage(res, data, maxSize = 4096) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  if (Buffer.byteLength(message) > maxSize) {
    console.warn('消息过大，可能影响性能');
  }
  res.write(message);
}

// 4. 实现消息去重
class DeduplicatedSSEServer {
  constructor() {
    this.lastMessageHash = new Map();
  }

  shouldSendMessage(clientId, data) {
    const hash = JSON.stringify(data);
    const lastHash = this.lastMessageHash.get(clientId);

    if (hash === lastHash) {
      return false; // 消息未改变，不发送
    }

    this.lastMessageHash.set(clientId, hash);
    return true;
  }
}
```

## 实战场景

### 场景 1：实时通知系统

```javascript
// 服务器端
const notificationManager = new Map(); // userId -> Set<response>

app.get('/api/notifications/:userId', (req, res) => {
  const userId = req.params.userId;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  });

  res.write('event: connected\n');
  res.write(`data: 用户 ${userId} 已连接\n\n`);

  if (!notificationManager.has(userId)) {
    notificationManager.set(userId, new Set());
  }
  notificationManager.get(userId).add(res);

  req.on('close', () => {
    notificationManager.get(userId).delete(res);
    if (notificationManager.get(userId).size === 0) {
      notificationManager.delete(userId);
    }
  });
});

// 发送通知 API
app.post('/api/send-notification', express.json(), (req, res) => {
  const { userId, title, message, type = 'info' } = req.body;

  const notification = { userId, title, message, type, timestamp: Date.now() };

  if (notificationManager.has(userId)) {
    const clientResponses = notificationManager.get(userId);
    const data = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;

    clientResponses.forEach(response => {
      response.write(data);
    });
  }

  res.json({ sent: notificationManager.get(userId)?.size || 0 });
});

// 客户端
class NotificationManager {
  constructor(userId) {
    this.userId = userId;
    this.eventSource = null;
    this.callbacks = {
      onNotification: null,
      onConnected: null,
      onError: null
    };
  }

  connect() {
    this.eventSource = new EventSource(`/api/notifications/${this.userId}`);

    this.eventSource.addEventListener('connected', (event) => {
      console.log(event.data);
      this.callbacks.onConnected?.();
    });

    this.eventSource.addEventListener('notification', (event) => {
      const notification = JSON.parse(event.data);
      this.showNotification(notification);
      this.callbacks.onNotification?.(notification);
    });

    this.eventSource.addEventListener('error', (event) => {
      this.callbacks.onError?.(event);
    });
  }

  showNotification(notification) {
    const { title, message, type } = notification;
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);

    // 使用 Notification API
    if (Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
```

### 场景 2：实时日志流

```javascript
// 服务器端：流式日志
const LogStreamManager = {
  subscribers: new Map(),

  subscribe(id) {
    if (!this.subscribers.has(id)) {
      this.subscribers.set(id, new Set());
    }
    return this.subscribers.get(id);
  },

  log(id, level, message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      id: Math.random().toString(36).substr(2, 9)
    };

    const subscribers = this.subscribers.get(id);
    if (subscribers) {
      const data = `event: log\ndata: ${JSON.stringify(logEntry)}\n\n`;
      subscribers.forEach(res => {
        res.write(data);
      });
    }
  }
};

app.get('/api/logs/:jobId', (req, res) => {
  const jobId = req.params.jobId;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no'
  });

  const subscribers = LogStreamManager.subscribe(jobId);
  subscribers.add(res);

  req.on('close', () => {
    subscribers.delete(res);
  });
});

// 模拟长时间运行的任务
app.post('/api/jobs/:id/start', (req, res) => {
  const jobId = req.params.id;

  LogStreamManager.log(jobId, 'info', '任务已启动');

  // 模拟任务执行
  setTimeout(() => {
    LogStreamManager.log(jobId, 'info', '正在处理数据...');
  }, 1000);

  setTimeout(() => {
    LogStreamManager.log(jobId, 'warning', '检测到异常数据');
  }, 2000);

  setTimeout(() => {
    LogStreamManager.log(jobId, 'info', '任务完成');
  }, 3000);

  res.json({ jobId, status: 'running' });
});

// 客户端
class LogViewer {
  constructor(jobId) {
    this.jobId = jobId;
    this.logs = [];
    this.eventSource = null;
  }

  start() {
    this.eventSource = new EventSource(`/api/logs/${this.jobId}`);

    this.eventSource.addEventListener('log', (event) => {
      const logEntry = JSON.parse(event.data);
      this.logs.push(logEntry);
      this.displayLog(logEntry);
    });

    this.eventSource.addEventListener('error', () => {
      console.log('日志流已关闭');
    });
  }

  displayLog(entry) {
    const color = {
      'info': '#0066cc',
      'warning': '#ff9900',
      'error': '#cc0000'
    }[entry.level] || '#000000';

    console.log(`%c[${entry.level}] ${entry.timestamp}: ${entry.message}`,
                `color: ${color}`);
  }

  stop() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
```

### 场景 3：实时仪表板

```javascript
// 服务器端：多指标推送
class DashboardManager {
  constructor() {
    this.clients = new Set();
    this.metrics = {
      cpu: 0,
      memory: 0,
      requests: 0,
      errors: 0
    };
  }

  addClient(res) {
    this.clients.add(res);
  }

  removeClient(res) {
    this.clients.delete(res);
  }

  broadcast(event, data) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(res => {
      try {
        res.write(message);
      } catch (error) {
        this.removeClient(res);
      }
    });
  }

  updateMetrics(newMetrics) {
    this.metrics = { ...this.metrics, ...newMetrics };
    this.broadcast('metrics-update', this.metrics);
  }
}

const dashboardManager = new DashboardManager();

app.get('/api/dashboard', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream'
  });

  dashboardManager.addClient(res);

  // 发送初始数据
  res.write(`data: ${JSON.stringify(dashboardManager.metrics)}\n\n`);

  req.on('close', () => {
    dashboardManager.removeClient(res);
  });
});

// 模拟指标更新
setInterval(() => {
  dashboardManager.updateMetrics({
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    requests: Math.floor(Math.random() * 1000),
    errors: Math.floor(Math.random() * 50)
  });
}, 1000);

// 客户端
class Dashboard {
  constructor() {
    this.eventSource = null;
    this.elements = {
      cpu: document.getElementById('cpu'),
      memory: document.getElementById('memory'),
      requests: document.getElementById('requests'),
      errors: document.getElementById('errors')
    };
  }

  start() {
    this.eventSource = new EventSource('/api/dashboard');

    this.eventSource.addEventListener('message', (event) => {
      const metrics = JSON.parse(event.data);
      this.updateUI(metrics);
    });

    this.eventSource.addEventListener('metrics-update', (event) => {
      const metrics = JSON.parse(event.data);
      this.updateUI(metrics);
    });
  }

  updateUI(metrics) {
    Object.keys(metrics).forEach(key => {
      if (this.elements[key]) {
        this.elements[key].textContent =
          typeof metrics[key] === 'number'
            ? metrics[key].toFixed(2)
            : metrics[key];
      }
    });
  }

  stop() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
```

## 面试要点

### 基础概念题

**Q: SSE 和 WebSocket 有什么区别？**

A: 主要区别包括：
- SSE 是单向的（服务器→客户端），WebSocket 是双向的
- SSE 基于 HTTP，WebSocket 使用独立的 WS 协议
- SSE 自动重连，WebSocket 需要手动实现
- SSE 纯文本，WebSocket 支持二进制数据
- SSE 更简单，WebSocket 功能更强大

**Q: EventSource 的 readyState 有哪些值？**

A: 三个值：
- 0: CONNECTING（连接中）
- 1: OPEN（已连接）
- 2: CLOSED（已关闭）

**Q: SSE 消息必须以什么结尾？**

A: 两个换行符（\n\n），用于标记消息边界

### 实现题

**Q: 如何实现 SSE 的自动重连？**

```javascript
class AutoReconnectSSE {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.retryCount = 0;
  }

  connect() {
    this.eventSource = new EventSource(this.url);

    this.eventSource.addEventListener('error', () => {
      this.eventSource.close();
      this.retry();
    });
  }

  retry() {
    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
    this.retryCount++;
    setTimeout(() => this.connect(), delay);
  }
}
```

**Q: 如何实现消息分页加载？**

```javascript
class PaginatedSSE {
  constructor(url) {
    this.url = url;
    this.pageSize = 100;
    this.currentPage = 1;
  }

  loadNextPage() {
    const url = `${this.url}?page=${this.currentPage}&pageSize=${this.pageSize}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.hasMore) {
        this.currentPage++;
      }
    });
  }
}
```

### 性能优化题

**Q: 如何处理大量 SSE 连接的性能问题？**

A:
1. 使用连接池而不是无限增长
2. 实现消息批处理
3. 添加断线重连限制
4. 监控内存占用
5. 使用负载均衡分散连接
6. 实现心跳检测清理僵尸连接

**Q: 如何优化 SSE 的消息大小？**

A:
1. 使用紧凑的 JSON 格式
2. 只发送必要字段
3. 启用 gzip 压缩
4. 考虑使用消息去重
5. 批量发送多个消息

### 故障处理题

**Q: 如何检测 SSE 连接是否真的活跃？**

```javascript
class HealthCheckSSE {
  constructor(url) {
    this.url = url;
    this.lastMessageTime = Date.now();
    this.timeout = 60000; // 60 秒
  }

  start() {
    const eventSource = new EventSource(this.url);

    eventSource.addEventListener('message', () => {
      this.lastMessageTime = Date.now();
    });

    setInterval(() => {
      if (Date.now() - this.lastMessageTime > this.timeout) {
        console.log('连接超时');
        eventSource.close();
      }
    }, 10000);
  }
}
```

## 延伸阅读

### 相关技术

1. **WebSocket** - 用于需要双向通信的场景
2. **Fetch API** - SSE 的替代方案（流式响应）
3. **Message Queue** - 用于异步消息处理
4. **WebRTC Data Channel** - 点对点实时通信

### 标准文档

- [Server-Sent Events 规范](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [EventSource MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [HTTP/2 推送](https://tools.ietf.org/html/rfc7540)

### 实战库

1. **EventSource Polyfill** - 向后兼容支持
2. **eventsource npm 包** - Node.js 客户端
3. **Server-Sent Events 框架** - Express.js 中间件

### 学习路线

1. 掌握基础 EventSource API 使用
2. 理解 SSE 消息格式和协议
3. 学习服务器端实现（Node.js、Python、Go 等）
4. 实现自动重连和错误处理
5. 优化性能（连接管理、消息批处理）
6. 对比 SSE、WebSocket、Polling 的选择
7. 实战项目（通知系统、实时仪表板、日志流）

## 总结

Server-Sent Events 是一种强大而简单的实时通信技术，特别适合以下场景：

- **单向数据推送**：服务器主动向客户端发送数据
- **实时通知**：消息、警告、状态更新
- **流式数据**：日志、指标、事件序列
- **简单部署**：基于 HTTP，无需特殊配置

关键要点：

1. SSE 提供简单的单向实时通信
2. 自动重连和事件类型支持开箱即用
3. 需要正确设置 Content-Type 和格式
4. 适合服务器推送场景，不适合双向通信
5. 性能优化需要考虑连接数和消息频率
6. 心跳检测和超时处理很重要

选择合适的实时通信技术：
- **SSE**：单向推送、自动重连、简单部署
- **WebSocket**：双向通信、低延迟、全双工
- **Polling**：简单可靠、支持率高、但低效

掌握 SSE 能让你构建高效的实时应用，为用户提供流畅的实时体验。
