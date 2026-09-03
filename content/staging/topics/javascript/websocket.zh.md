---
title: JavaScript WebSocket 实时通信
description: 掌握 WebSocket API 进行实时双向通信，包括连接管理、消息处理和重连策略
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - WebSocket
  - 实时通信
  - 网络
status: imported
origin: old/src/content/docs/javascript/websocket.zh.md
divergence: 0.297
issues: []
legacy:
  category: JavaScript
  subcategory: 网络
  order: 27
  lastUpdated: 2026-01-07
---

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。与传统的 HTTP 请求-响应模式不同，WebSocket 允许服务器主动向客户端推送数据，非常适合需要实时数据更新的应用场景，如聊天应用、实时协作工具、在线游戏和股票行情等。

## WebSocket 基础

### 什么是 WebSocket

WebSocket 协议在 2011 年被 IETF 标准化为 RFC 6455，它提供了浏览器与服务器之间的持久化连接。主要特点包括：

- **全双工通信**：客户端和服务器可以同时发送和接收消息
- **低延迟**：建立连接后，数据传输无需 HTTP 请求头开销
- **持久连接**：连接一旦建立，保持打开状态直到任一方关闭
- **跨域支持**：原生支持跨域通信

### WebSocket vs HTTP

```javascript
// HTTP 轮询 - 频繁请求，资源浪费
setInterval(async () => {
  const response = await fetch('/api/messages');
  const messages = await response.json();
  updateUI(messages);
}, 1000);

// WebSocket - 实时推送，高效节能
const ws = new WebSocket('wss://api.example.com/messages');
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  updateUI(message);
};
```

## 创建 WebSocket 连接

### 基本连接

使用 `WebSocket` 构造函数创建连接：

```javascript
// 创建 WebSocket 连接
const socket = new WebSocket('wss://api.example.com/ws');

// ws:// 用于非加密连接（不推荐）
// wss:// 用于加密连接（推荐，类似 HTTPS）
```

### 带协议的连接

WebSocket 构造函数的第二个参数可以指定子协议：

```javascript
// 指定单个子协议
const socket = new WebSocket('wss://api.example.com/ws', 'chat');

// 指定多个子协议，服务器选择其一
const socket = new WebSocket('wss://api.example.com/ws', ['chat', 'json']);

// 检查服务器选择的协议
socket.onopen = () => {
  console.log('使用的协议:', socket.protocol);
};
```

### 连接状态

WebSocket 对象有一个 `readyState` 属性表示连接状态：

```javascript
const socket = new WebSocket('wss://api.example.com/ws');

// readyState 的可能值
console.log(WebSocket.CONNECTING); // 0 - 正在连接
console.log(WebSocket.OPEN);       // 1 - 连接已建立
console.log(WebSocket.CLOSING);    // 2 - 正在关闭
console.log(WebSocket.CLOSED);     // 3 - 连接已关闭

// 检查当前状态
function checkConnection() {
  switch (socket.readyState) {
    case WebSocket.CONNECTING:
      console.log('正在连接...');
      break;
    case WebSocket.OPEN:
      console.log('连接已建立');
      break;
    case WebSocket.CLOSING:
      console.log('正在关闭...');
      break;
    case WebSocket.CLOSED:
      console.log('连接已关闭');
      break;
  }
}
```

## 连接生命周期

### 事件处理

WebSocket 提供四个核心事件来管理连接生命周期：

```javascript
const socket = new WebSocket('wss://api.example.com/ws');

// 1. 连接成功建立
socket.onopen = (event) => {
  console.log('WebSocket 连接已建立');
  console.log('事件类型:', event.type);
};

// 2. 接收到消息
socket.onmessage = (event) => {
  console.log('收到消息:', event.data);
};

// 3. 连接关闭
socket.onclose = (event) => {
  console.log('连接已关闭');
  console.log('关闭码:', event.code);
  console.log('关闭原因:', event.reason);
  console.log('是否正常关闭:', event.wasClean);
};

// 4. 发生错误
socket.onerror = (event) => {
  console.error('WebSocket 错误:', event);
};
```

### 使用 addEventListener

除了 `on*` 属性，也可以使用 `addEventListener`：

```javascript
const socket = new WebSocket('wss://api.example.com/ws');

socket.addEventListener('open', (event) => {
  console.log('连接已建立');
});

socket.addEventListener('message', (event) => {
  console.log('收到消息:', event.data);
});

socket.addEventListener('close', (event) => {
  console.log('连接已关闭');
});

socket.addEventListener('error', (event) => {
  console.error('发生错误');
});

// 可以添加多个监听器
socket.addEventListener('message', (event) => {
  // 另一个消息处理器
  logMessage(event.data);
});
```

### 关闭码说明

WebSocket 关闭时会返回一个关闭码，常见的关闭码包括：

```javascript
// 常见关闭码
const CLOSE_CODES = {
  1000: '正常关闭',
  1001: '端点离开（如页面关闭）',
  1002: '协议错误',
  1003: '不支持的数据类型',
  1005: '没有收到关闭码',
  1006: '异常关闭（未发送关闭帧）',
  1007: '无效的数据',
  1008: '违反策略',
  1009: '消息太大',
  1010: '客户端期望扩展协商',
  1011: '服务器遇到意外情况',
  1015: 'TLS 握手失败'
};

socket.onclose = (event) => {
  const reason = CLOSE_CODES[event.code] || '未知原因';
  console.log(`连接关闭: ${event.code} - ${reason}`);
};
```

## 发送和接收消息

### 发送文本消息

```javascript
const socket = new WebSocket('wss://api.example.com/ws');

socket.onopen = () => {
  // 发送简单文本
  socket.send('你好，服务器！');

  // 发送 JSON 数据
  const message = {
    type: 'chat',
    content: '这是一条聊天消息',
    timestamp: Date.now()
  };
  socket.send(JSON.stringify(message));
};
```

### 接收和解析消息

```javascript
socket.onmessage = (event) => {
  // event.data 可能是字符串或二进制数据
  const data = event.data;

  // 如果是 JSON 字符串
  try {
    const message = JSON.parse(data);
    handleMessage(message);
  } catch (e) {
    // 普通文本消息
    console.log('收到文本:', data);
  }
};

function handleMessage(message) {
  switch (message.type) {
    case 'chat':
      displayChatMessage(message);
      break;
    case 'notification':
      showNotification(message);
      break;
    case 'update':
      updateData(message.payload);
      break;
    default:
      console.log('未知消息类型:', message.type);
  }
}
```

### 检查发送缓冲区

使用 `bufferedAmount` 属性可以检查待发送数据的大小：

```javascript
function sendWithFlowControl(socket, data) {
  const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB

  if (socket.bufferedAmount > MAX_BUFFER_SIZE) {
    console.warn('发送缓冲区已满，等待发送...');
    // 延迟发送
    setTimeout(() => sendWithFlowControl(socket, data), 100);
    return;
  }

  socket.send(data);
}

// 监控缓冲区状态
function monitorBuffer(socket) {
  setInterval(() => {
    console.log('待发送数据:', socket.bufferedAmount, 'bytes');
  }, 1000);
}
```

## 二进制数据处理

### 设置二进制类型

WebSocket 支持两种二进制数据类型：

```javascript
const socket = new WebSocket('wss://api.example.com/ws');

// 设置接收二进制数据的类型
socket.binaryType = 'arraybuffer'; // ArrayBuffer（默认）
// 或
socket.binaryType = 'blob';        // Blob
```

### 发送二进制数据

```javascript
const socket = new WebSocket('wss://api.example.com/ws');

socket.onopen = () => {
  // 发送 ArrayBuffer
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setInt32(0, 12345);
  view.setFloat32(4, 3.14);
  socket.send(buffer);

  // 发送 TypedArray
  const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
  socket.send(uint8Array);

  // 发送 Blob
  const blob = new Blob(['二进制内容'], { type: 'application/octet-stream' });
  socket.send(blob);
};
```

### 接收二进制数据

```javascript
const socket = new WebSocket('wss://api.example.com/ws');
socket.binaryType = 'arraybuffer';

socket.onmessage = (event) => {
  if (event.data instanceof ArrayBuffer) {
    // 处理 ArrayBuffer
    const view = new DataView(event.data);
    const value = view.getInt32(0);
    console.log('收到整数:', value);
  } else if (typeof event.data === 'string') {
    // 处理文本消息
    console.log('收到文本:', event.data);
  }
};

// 使用 Blob 类型
socket.binaryType = 'blob';

socket.onmessage = async (event) => {
  if (event.data instanceof Blob) {
    // 读取 Blob 内容
    const text = await event.data.text();
    console.log('Blob 内容:', text);

    // 或转换为 ArrayBuffer
    const buffer = await event.data.arrayBuffer();
    processBuffer(buffer);
  }
};
```

### 文件传输示例

```javascript
// 发送文件
async function sendFile(socket, file) {
  // 发送文件元信息
  socket.send(JSON.stringify({
    type: 'file_start',
    name: file.name,
    size: file.size,
    mimeType: file.type
  }));

  // 分块发送文件内容
  const CHUNK_SIZE = 64 * 1024; // 64KB
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await chunk.arrayBuffer();

    // 等待缓冲区清空
    while (socket.bufferedAmount > CHUNK_SIZE * 2) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    socket.send(buffer);
    offset += CHUNK_SIZE;

    // 报告进度
    const progress = Math.round((offset / file.size) * 100);
    console.log(`上传进度: ${progress}%`);
  }

  // 发送结束标记
  socket.send(JSON.stringify({ type: 'file_end' }));
}

// 接收文件
class FileReceiver {
  constructor() {
    this.chunks = [];
    this.fileInfo = null;
  }

  handleMessage(event) {
    if (typeof event.data === 'string') {
      const message = JSON.parse(event.data);

      if (message.type === 'file_start') {
        this.fileInfo = message;
        this.chunks = [];
      } else if (message.type === 'file_end') {
        this.assembleFile();
      }
    } else if (event.data instanceof ArrayBuffer) {
      this.chunks.push(event.data);
    }
  }

  assembleFile() {
    const blob = new Blob(this.chunks, { type: this.fileInfo.mimeType });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = this.fileInfo.name;
    link.click();

    URL.revokeObjectURL(url);
  }
}
```

## 心跳机制

### 为什么需要心跳

心跳机制用于检测连接是否仍然活跃，防止连接因长时间无活动而被中间代理或防火墙关闭。

```javascript
class WebSocketWithHeartbeat {
  constructor(url, options = {}) {
    this.url = url;
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 30秒
    this.heartbeatTimeout = options.heartbeatTimeout || 10000;   // 10秒超时
    this.pingMessage = options.pingMessage || JSON.stringify({ type: 'ping' });
    this.pongMessage = options.pongMessage || 'pong';

    this.socket = null;
    this.heartbeatTimer = null;
    this.timeoutTimer = null;

    this.connect();
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('连接已建立');
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      // 收到任何消息都重置心跳
      this.resetHeartbeat();

      // 检查是否是心跳响应
      if (event.data === this.pongMessage) {
        console.log('收到心跳响应');
        return;
      }

      // 处理其他消息
      this.onMessage(event);
    };

    this.socket.onclose = () => {
      this.stopHeartbeat();
      console.log('连接已关闭');
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket.readyState === WebSocket.OPEN) {
        console.log('发送心跳');
        this.socket.send(this.pingMessage);

        // 设置超时检测
        this.timeoutTimer = setTimeout(() => {
          console.warn('心跳超时，关闭连接');
          this.socket.close();
        }, this.heartbeatTimeout);
      }
    }, this.heartbeatInterval);
  }

  resetHeartbeat() {
    // 清除超时计时器
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.resetHeartbeat();
  }

  onMessage(event) {
    // 子类或回调处理消息
    console.log('收到消息:', event.data);
  }

  send(data) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.warn('连接未就绪，无法发送消息');
    }
  }

  close() {
    this.stopHeartbeat();
    this.socket.close();
  }
}

// 使用
const ws = new WebSocketWithHeartbeat('wss://api.example.com/ws', {
  heartbeatInterval: 25000,
  heartbeatTimeout: 5000
});
```

### 服务器端心跳

如果服务器支持 WebSocket 原生的 ping/pong 帧，浏览器会自动响应 pong 帧：

```javascript
// 注意：浏览器 WebSocket API 不直接暴露 ping/pong 帧
// 但服务器发送的 ping 帧会被浏览器自动响应

// 某些服务器使用应用层心跳
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'ping') {
    // 响应服务器的心跳
    socket.send(JSON.stringify({ type: 'pong' }));
    return;
  }

  // 处理其他消息
  handleMessage(data);
};
```

## 重连策略

### 简单重连

```javascript
function createWebSocket(url) {
  let socket = new WebSocket(url);

  socket.onclose = (event) => {
    if (!event.wasClean) {
      console.log('连接异常关闭，3秒后重连...');
      setTimeout(() => {
        createWebSocket(url);
      }, 3000);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket 错误:', error);
  };

  return socket;
}
```

### 指数退避重连

更智能的重连策略，避免在服务器故障时造成重连风暴：

```javascript
class ReconnectingWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;

    // 重连配置
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.baseDelay = options.baseDelay || 1000;       // 基础延迟 1 秒
    this.maxDelay = options.maxDelay || 30000;        // 最大延迟 30 秒
    this.jitter = options.jitter !== false;           // 随机抖动

    this.socket = null;
    this.isManualClose = false;
    this.messageQueue = [];

    // 事件回调
    this.onOpen = null;
    this.onMessage = null;
    this.onClose = null;
    this.onError = null;
    this.onReconnect = null;

    this.connect();
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = (event) => {
      console.log('WebSocket 连接已建立');
      this.reconnectAttempts = 0;

      // 发送队列中的消息
      this.flushMessageQueue();

      if (this.onOpen) {
        this.onOpen(event);
      }
    };

    this.socket.onmessage = (event) => {
      if (this.onMessage) {
        this.onMessage(event);
      }
    };

    this.socket.onclose = (event) => {
      if (this.onClose) {
        this.onClose(event);
      }

      if (!this.isManualClose) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (event) => {
      if (this.onError) {
        this.onError(event);
      }
    };
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('已达到最大重连次数，停止重连');
      return;
    }

    // 计算延迟（指数退避）
    let delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay
    );

    // 添加随机抖动
    if (this.jitter) {
      delay = delay * (0.5 + Math.random());
    }

    this.reconnectAttempts++;

    console.log(`第 ${this.reconnectAttempts} 次重连，${Math.round(delay / 1000)} 秒后执行...`);

    setTimeout(() => {
      if (this.onReconnect) {
        this.onReconnect(this.reconnectAttempts);
      }
      this.connect();
    }, delay);
  }

  send(data) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      // 连接未就绪时，将消息加入队列
      console.log('连接未就绪，消息已加入队列');
      this.messageQueue.push(data);
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.socket.send(message);
    }
  }

  close(code = 1000, reason = '') {
    this.isManualClose = true;
    this.socket.close(code, reason);
  }

  // 手动触发重连
  reconnect() {
    this.isManualClose = false;
    this.reconnectAttempts = 0;

    if (this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.close();
    } else {
      this.connect();
    }
  }
}

// 使用示例
const ws = new ReconnectingWebSocket('wss://api.example.com/ws', {
  maxReconnectAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000
});

ws.onOpen = () => {
  console.log('连接成功');
};

ws.onMessage = (event) => {
  console.log('收到消息:', event.data);
};

ws.onReconnect = (attempt) => {
  console.log(`正在进行第 ${attempt} 次重连...`);
};
```

### 网络状态检测

结合浏览器的网络状态 API 优化重连：

```javascript
class SmartReconnectingWebSocket extends ReconnectingWebSocket {
  constructor(url, options) {
    super(url, options);
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    // 网络恢复时立即尝试重连
    window.addEventListener('online', () => {
      console.log('网络已恢复');
      if (this.socket.readyState === WebSocket.CLOSED) {
        this.reconnectAttempts = 0; // 重置重连计数
        this.connect();
      }
    });

    // 网络断开时停止重连尝试
    window.addEventListener('offline', () => {
      console.log('网络已断开');
    });

    // 页面可见性变化时检查连接
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (this.socket.readyState !== WebSocket.OPEN) {
          console.log('页面变为可见，检查连接状态');
          this.reconnect();
        }
      }
    });
  }
}
```

## 安全考虑

### 使用 WSS 协议

始终使用 `wss://`（WebSocket Secure）而非 `ws://`：

```javascript
// 不安全（不推荐）
const unsafeSocket = new WebSocket('ws://api.example.com/ws');

// 安全（推荐）
const secureSocket = new WebSocket('wss://api.example.com/ws');

// 根据当前页面协议自动选择
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(`${protocol}//api.example.com/ws`);
```

### 身份验证

WebSocket 不支持自定义请求头，常见的认证方式：

```javascript
// 方式 1：通过 URL 参数传递令牌（简单但不够安全）
const token = 'your-auth-token';
const socket = new WebSocket(`wss://api.example.com/ws?token=${token}`);

// 方式 2：连接后发送认证消息（推荐）
const socket = new WebSocket('wss://api.example.com/ws');

socket.onopen = () => {
  // 发送认证消息
  socket.send(JSON.stringify({
    type: 'auth',
    token: localStorage.getItem('authToken')
  }));
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'auth_success') {
    console.log('认证成功');
    // 开始正常通信
  } else if (message.type === 'auth_failed') {
    console.error('认证失败');
    socket.close();
  }
};

// 方式 3：使用 Cookie（自动发送）
// 服务器需要配置 CORS 允许凭证
// Cookie 会在握手时自动发送
```

### 消息验证

```javascript
class SecureWebSocket {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.messageHandlers = new Map();

    this.socket.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  handleMessage(event) {
    let message;

    try {
      message = JSON.parse(event.data);
    } catch (e) {
      console.error('无效的 JSON 消息');
      return;
    }

    // 验证消息结构
    if (!this.validateMessage(message)) {
      console.error('消息验证失败');
      return;
    }

    // 处理消息
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  validateMessage(message) {
    // 检查必需字段
    if (!message.type || typeof message.type !== 'string') {
      return false;
    }

    // 检查时间戳（防止重放攻击）
    if (message.timestamp) {
      const now = Date.now();
      const messageTime = new Date(message.timestamp).getTime();
      const MAX_AGE = 5 * 60 * 1000; // 5 分钟

      if (Math.abs(now - messageTime) > MAX_AGE) {
        console.warn('消息时间戳过期');
        return false;
      }
    }

    return true;
  }

  registerHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  send(type, payload) {
    const message = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    this.socket.send(JSON.stringify(message));
  }
}
```

### 防止 XSS 和注入攻击

```javascript
// 对接收的消息进行净化处理
function sanitizeMessage(message) {
  if (typeof message === 'string') {
    // 使用 DOM API 转义 HTML
    const div = document.createElement('div');
    div.textContent = message;
    return div.innerHTML;
  }
  return message;
}

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'chat') {
    // 净化用户输入的内容
    const safeContent = sanitizeMessage(message.content);
    displayMessage(safeContent);
  }
};

// 使用 DOMPurify 库进行更强的净化
// import DOMPurify from 'dompurify';
// const safeHtml = DOMPurify.sanitize(message.content);
```

## 完整示例：聊天应用

```javascript
class ChatClient {
  constructor(url, username) {
    this.url = url;
    this.username = username;
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatInterval = 30000;
    this.heartbeatTimer = null;

    this.onMessageCallback = null;
    this.onStatusChangeCallback = null;

    this.connect();
  }

  connect() {
    this.updateStatus('connecting');
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.updateStatus('connected');

      // 发送加入消息
      this.sendMessage('join', { username: this.username });

      // 启动心跳
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      this.stopHeartbeat();

      if (event.wasClean) {
        this.updateStatus('disconnected');
      } else {
        this.updateStatus('error');
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'pong':
          // 心跳响应
          break;
        case 'chat':
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'chat',
              username: message.username,
              content: message.content,
              timestamp: message.timestamp
            });
          }
          break;
        case 'user_joined':
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'system',
              content: `${message.username} 加入了聊天室`
            });
          }
          break;
        case 'user_left':
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'system',
              content: `${message.username} 离开了聊天室`
            });
          }
          break;
        case 'error':
          console.error('服务器错误:', message.content);
          break;
        default:
          console.log('未知消息类型:', message.type);
      }
    } catch (e) {
      console.error('解析消息失败:', e);
    }
  }

  sendMessage(type, payload) {
    if (!this.isConnected) {
      console.warn('未连接，无法发送消息');
      return false;
    }

    const message = {
      type,
      ...payload,
      timestamp: new Date().toISOString()
    };

    this.socket.send(JSON.stringify(message));
    return true;
  }

  sendChatMessage(content) {
    return this.sendMessage('chat', {
      username: this.username,
      content: content
    });
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage('ping', {});
      }
    }, this.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`${delay / 1000} 秒后进行第 ${this.reconnectAttempts} 次重连`);
    this.updateStatus('reconnecting');

    setTimeout(() => this.connect(), delay);
  }

  updateStatus(status) {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  onStatusChange(callback) {
    this.onStatusChangeCallback = callback;
  }

  disconnect() {
    this.stopHeartbeat();
    this.maxReconnectAttempts = 0; // 阻止重连

    if (this.socket) {
      this.sendMessage('leave', { username: this.username });
      this.socket.close(1000, '用户主动断开');
    }
  }
}

// 使用示例
const chat = new ChatClient('wss://chat.example.com/ws', '张三');

chat.onStatusChange((status) => {
  const statusText = {
    connecting: '正在连接...',
    connected: '已连接',
    disconnected: '已断开',
    reconnecting: '正在重连...',
    error: '连接错误'
  };
  document.getElementById('status').textContent = statusText[status];
});

chat.onMessage((message) => {
  const messagesDiv = document.getElementById('messages');

  if (message.type === 'chat') {
    messagesDiv.innerHTML += `
      <div class="message">
        <span class="username">${message.username}</span>
        <span class="content">${message.content}</span>
        <span class="time">${new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>
    `;
  } else if (message.type === 'system') {
    messagesDiv.innerHTML += `
      <div class="system-message">${message.content}</div>
    `;
  }
});

// 发送消息
document.getElementById('sendBtn').onclick = () => {
  const input = document.getElementById('messageInput');
  if (input.value.trim()) {
    chat.sendChatMessage(input.value);
    input.value = '';
  }
};

// 页面关闭时断开连接
window.onbeforeunload = () => {
  chat.disconnect();
};
```

## 最佳实践

### 连接管理

```javascript
// 使用单例模式管理 WebSocket 连接
class WebSocketManager {
  static instance = null;

  static getInstance(url) {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(url);
    }
    return WebSocketManager.instance;
  }

  constructor(url) {
    this.url = url;
    this.socket = null;
    this.subscribers = new Map();
    this.connect();
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.notifySubscribers(message.type, message);
    };
  }

  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);

    // 返回取消订阅函数
    return () => {
      this.subscribers.get(type).delete(callback);
    };
  }

  notifySubscribers(type, message) {
    const callbacks = this.subscribers.get(type);
    if (callbacks) {
      callbacks.forEach(callback => callback(message));
    }
  }

  send(type, payload) {
    this.socket.send(JSON.stringify({ type, ...payload }));
  }
}
```

### 错误处理

```javascript
function createRobustWebSocket(url) {
  const socket = new WebSocket(url);

  socket.onerror = (error) => {
    // WebSocket 错误事件不包含详细信息
    // 通常后跟 close 事件
    console.error('WebSocket 错误发生');
  };

  socket.onclose = (event) => {
    // 根据关闭码判断错误类型
    if (event.code === 1006) {
      console.error('连接异常关闭，可能是网络问题');
    } else if (event.code === 1002) {
      console.error('协议错误');
    } else if (event.code === 1003) {
      console.error('数据类型不支持');
    }
  };

  return socket;
}
```

### 消息队列

```javascript
class MessageQueue {
  constructor(socket) {
    this.socket = socket;
    this.queue = [];
    this.isProcessing = false;
    this.retryDelay = 1000;
  }

  enqueue(message) {
    this.queue.push({
      data: message,
      attempts: 0,
      maxAttempts: 3
    });
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      if (this.socket.readyState !== WebSocket.OPEN) {
        // 等待连接恢复
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        continue;
      }

      try {
        this.socket.send(JSON.stringify(item.data));
        this.queue.shift(); // 发送成功，移除消息
      } catch (error) {
        item.attempts++;

        if (item.attempts >= item.maxAttempts) {
          console.error('消息发送失败，已达最大重试次数:', item.data);
          this.queue.shift();
        } else {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    this.isProcessing = false;
  }
}
```

### 性能优化

```javascript
// 消息批处理
class BatchedWebSocket {
  constructor(url, options = {}) {
    this.socket = new WebSocket(url);
    this.batchInterval = options.batchInterval || 100;
    this.maxBatchSize = options.maxBatchSize || 10;
    this.pendingMessages = [];
    this.batchTimer = null;
  }

  send(message) {
    this.pendingMessages.push(message);

    if (this.pendingMessages.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), this.batchInterval);
    }
  }

  flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.pendingMessages.length === 0) {
      return;
    }

    if (this.socket.readyState === WebSocket.OPEN) {
      // 批量发送
      this.socket.send(JSON.stringify({
        type: 'batch',
        messages: this.pendingMessages
      }));
    }

    this.pendingMessages = [];
  }
}
```

## 浏览器兼容性

WebSocket API 在现代浏览器中得到广泛支持：

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 16+ |
| Firefox | 11+ |
| Safari | 7+ |
| Edge | 12+ |
| Opera | 12.1+ |
| IE | 10+ |

```javascript
// 检查浏览器支持
if ('WebSocket' in window) {
  console.log('浏览器支持 WebSocket');
} else {
  console.log('浏览器不支持 WebSocket，请升级浏览器');
  // 可以考虑使用 Socket.IO 等库作为降级方案
}
```

## 总结

WebSocket 为 Web 应用提供了强大的实时双向通信能力。在实际应用中，需要注意以下几点：

1. **始终使用 WSS**：确保数据传输的安全性
2. **实现心跳机制**：保持连接活跃，及时检测断线
3. **使用重连策略**：采用指数退避算法，避免重连风暴
4. **处理离线消息**：使用消息队列存储待发送的消息
5. **验证消息内容**：防止 XSS 和注入攻击
6. **优化性能**：考虑消息批处理和压缩

WebSocket 结合现代 JavaScript 的异步编程能力，可以构建出响应迅速、用户体验优秀的实时应用。
