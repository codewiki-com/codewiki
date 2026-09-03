---
title: WebSocket 实时通信指南
description: 掌握WebSocket协议，实现实时双向通信应用
track: foundations
section: networking
difficulty: intermediate
tags:
  - WebSocket
  - 实时通信
  - Socket.IO
  - 长连接
status: imported
origin: old/src/content/docs/backend/websocket.zh.md
divergence: 0.229
issues: []
legacy:
  category: Backend
  subcategory: Protocol
  order: 18
  lastUpdated: 2026-01-07
---

## 概念解释：WebSocket 是什么

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。它使得客户端和服务器之间可以建立持久连接，双方可以随时相互发送数据，无需像传统 HTTP 那样每次通信都要建立新连接。

### 核心特性

WebSocket 的核心特性包括：

- **全双工通信**：客户端和服务器可以同时发送和接收数据
- **持久连接**：连接建立后保持打开状态，直到任一方关闭
- **低延迟**：消除了 HTTP 请求/响应的开销
- **轻量级协议**：数据帧头部开销小，最小只有 2 字节
- **跨域支持**：原生支持跨域通信

### 适用场景

WebSocket 特别适合以下场景：

```
1. 实时聊天应用（即时通讯、在线客服）
2. 协作编辑工具（在线文档、白板）
3. 实时游戏（多人在线游戏）
4. 金融交易系统（股票行情、加密货币）
5. 物联网设备通信
6. 实时通知系统（消息推送）
7. 直播弹幕系统
```

## WebSocket vs HTTP 轮询

### 传统轮询（Polling）

传统轮询是客户端定期向服务器发送 HTTP 请求，询问是否有新数据：

```javascript
// 传统轮询示例
function polling() {
  setInterval(async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      if (data.messages.length > 0) {
        handleNewMessages(data.messages);
      }
    } catch (error) {
      console.error('轮询失败:', error);
    }
  }, 3000); // 每3秒轮询一次
}

// 问题：
// 1. 大量无效请求（服务器可能没有新数据）
// 2. 延迟高（最坏情况下延迟等于轮询间隔）
// 3. 服务器压力大（频繁建立/关闭连接）
// 4. 浪费带宽（每次请求都有完整的HTTP头）
```

### 长轮询（Long Polling）

长轮询改进了传统轮询，服务器在没有数据时不立即响应，而是保持连接直到有数据或超时：

```javascript
// 长轮询示例
async function longPolling() {
  while (true) {
    try {
      // 服务器会阻塞请求直到有新数据或超时
      const response = await fetch('/api/messages/long-poll', {
        timeout: 30000 // 30秒超时
      });

      if (response.ok) {
        const data = await response.json();
        handleNewMessages(data.messages);
      }
    } catch (error) {
      if (error.name === 'TimeoutError') {
        // 超时后重新发起请求
        continue;
      }
      console.error('长轮询失败:', error);
      // 出错后等待一段时间再重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// 服务端实现（Express）
app.get('/api/messages/long-poll', async (req, res) => {
  const timeout = 30000;
  const startTime = Date.now();

  // 检查是否有新消息
  const checkMessages = async () => {
    const messages = await getNewMessages(req.query.lastId);

    if (messages.length > 0) {
      return res.json({ messages });
    }

    if (Date.now() - startTime >= timeout) {
      return res.json({ messages: [] });
    }

    // 没有消息，等待后再检查
    setTimeout(checkMessages, 500);
  };

  checkMessages();
});
```

### Server-Sent Events (SSE)

SSE 是一种服务器向客户端推送数据的技术，但只支持单向通信：

```javascript
// 客户端 SSE
const eventSource = new EventSource('/api/events');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE 错误:', error);
};

// 服务端 SSE（Express）
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 发送心跳
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  // 模拟推送数据
  const pushData = setInterval(() => {
    const data = { time: new Date().toISOString() };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 1000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clearInterval(pushData);
  });
});
```

### WebSocket 优势对比

| 特性 | 传统轮询 | 长轮询 | SSE | WebSocket |
|------|---------|--------|-----|-----------|
| 通信方向 | 单向 | 单向 | 服务器->客户端 | 双向 |
| 连接数 | 每次请求新建 | 请求时建立 | 保持一个 | 保持一个 |
| 实时性 | 低 | 中 | 高 | 最高 |
| 服务器开销 | 高 | 中 | 低 | 最低 |
| 带宽消耗 | 高 | 中 | 低 | 最低 |
| 浏览器支持 | 全部 | 全部 | IE不支持 | 现代浏览器 |
| 复杂度 | 低 | 中 | 低 | 中 |

```javascript
// WebSocket 示例（对比优势）
const ws = new WebSocket('ws://example.com/socket');

ws.onopen = () => {
  console.log('连接已建立');
  // 可以立即发送数据
  ws.send(JSON.stringify({ type: 'subscribe', channel: 'chat' }));
};

ws.onmessage = (event) => {
  // 实时接收服务器推送
  const data = JSON.parse(event.data);
  handleMessage(data);
};

// 优势：
// 1. 一次连接，持续使用
// 2. 双向通信，随时发送
// 3. 数据帧开销小（2-14字节头部）
// 4. 真正的实时性
```

## WebSocket 协议详解

### 协议结构

WebSocket 协议定义在 RFC 6455 中，使用 `ws://`（非加密）或 `wss://`（TLS 加密）作为 URI 方案：

```
ws://host:port/path?query
wss://host:port/path?query

# 示例
ws://localhost:8080/chat
wss://example.com/socket?token=abc123
```

### 数据帧格式

WebSocket 数据以帧（Frame）为单位传输：

```
  0                   1                   2                   3
  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-------+-+-------------+-------------------------------+
 |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
 |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
 |N|V|V|V|       |S|             |   (if payload len==126/127)   |
 | |1|2|3|       |K|             |                               |
 +-+-+-+-+-------+-+-------------+-------------------------------+
 |     Extended payload length continued, if payload len == 127  |
 +-------------------------------+-------------------------------+
 |                               |Masking-key, if MASK set to 1  |
 +-------------------------------+-------------------------------+
 | Masking-key (continued)       |          Payload Data         |
 +-------------------------------+-------------------------------+
 |                     Payload Data continued ...                |
 +---------------------------------------------------------------+
```

```javascript
// 帧类型说明
const OPCODES = {
  CONTINUATION: 0x0,  // 延续帧
  TEXT: 0x1,          // 文本帧
  BINARY: 0x2,        // 二进制帧
  CLOSE: 0x8,         // 关闭连接
  PING: 0x9,          // Ping
  PONG: 0xA           // Pong
};

// 解析 WebSocket 帧（简化版）
function parseFrame(buffer) {
  const firstByte = buffer[0];
  const secondByte = buffer[1];

  const fin = (firstByte & 0x80) !== 0;      // 是否是最后一帧
  const opcode = firstByte & 0x0F;            // 操作码
  const masked = (secondByte & 0x80) !== 0;   // 是否有掩码
  let payloadLength = secondByte & 0x7F;      // 负载长度

  let offset = 2;

  // 扩展长度处理
  if (payloadLength === 126) {
    payloadLength = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (payloadLength === 127) {
    payloadLength = buffer.readBigUInt64BE(offset);
    offset += 8;
  }

  // 解码掩码
  let maskingKey;
  if (masked) {
    maskingKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  // 提取负载数据
  let payload = buffer.slice(offset, offset + Number(payloadLength));

  // 如果有掩码，需要解码
  if (masked) {
    payload = unmask(payload, maskingKey);
  }

  return { fin, opcode, payload };
}

// 掩码解码
function unmask(payload, maskingKey) {
  const result = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) {
    result[i] = payload[i] ^ maskingKey[i % 4];
  }
  return result;
}
```

### 控制帧

```javascript
// Ping/Pong 心跳机制
// 服务端发送 Ping
function sendPing(ws) {
  const pingFrame = Buffer.from([0x89, 0x00]); // Ping 帧
  ws.send(pingFrame);
}

// 客户端自动回复 Pong
// 浏览器 WebSocket API 会自动处理 Pong 响应

// 关闭帧
function sendClose(ws, code, reason) {
  const codeBuffer = Buffer.alloc(2);
  codeBuffer.writeUInt16BE(code);
  const reasonBuffer = Buffer.from(reason);
  const payload = Buffer.concat([codeBuffer, reasonBuffer]);

  // 构造关闭帧
  // opcode = 0x8 (关闭)
  ws.close(code, reason);
}

// 常见关闭码
const CLOSE_CODES = {
  NORMAL: 1000,           // 正常关闭
  GOING_AWAY: 1001,       // 端点离开（如页面关闭）
  PROTOCOL_ERROR: 1002,   // 协议错误
  UNSUPPORTED: 1003,      // 不支持的数据类型
  NO_STATUS: 1005,        // 没有收到状态码
  ABNORMAL: 1006,         // 异常关闭
  INVALID_DATA: 1007,     // 数据类型不一致
  POLICY_VIOLATION: 1008, // 策略违规
  TOO_LARGE: 1009,        // 消息过大
  EXTENSION_REQUIRED: 1010, // 需要扩展
  INTERNAL_ERROR: 1011    // 内部错误
};
```

## 握手与连接管理

### HTTP 升级握手

WebSocket 连接通过 HTTP 升级机制建立：

```javascript
// 客户端握手请求
/*
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Sec-WebSocket-Protocol: chat, superchat
Sec-WebSocket-Extensions: permessage-deflate
*/

// 服务端握手响应
/*
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocol: chat
*/

// Node.js 实现 WebSocket 服务器（底层实现）
const http = require('http');
const crypto = require('crypto');

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const server = http.createServer();

server.on('upgrade', (req, socket, head) => {
  // 验证升级请求
  if (req.headers['upgrade'] !== 'websocket') {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    return;
  }

  // 计算 Sec-WebSocket-Accept
  const key = req.headers['sec-websocket-key'];
  const acceptKey = crypto
    .createHash('sha1')
    .update(key + GUID)
    .digest('base64');

  // 发送握手响应
  const response = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '\r\n'
  ].join('\r\n');

  socket.write(response);

  // 连接建立，开始处理 WebSocket 帧
  handleWebSocket(socket);
});

server.listen(8080);
```

### 使用 ws 库

实际开发中，通常使用成熟的库如 `ws`：

```javascript
// 安装: npm install ws

const WebSocket = require('ws');

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 8080 });

// 连接管理
const clients = new Map();

wss.on('connection', (ws, req) => {
  // 获取客户端信息
  const clientId = generateId();
  const clientIp = req.socket.remoteAddress;

  console.log(`新连接: ${clientId} from ${clientIp}`);

  // 存储客户端
  clients.set(clientId, {
    ws,
    ip: clientIp,
    connectedAt: new Date(),
    isAlive: true
  });

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    message: '连接成功'
  }));

  // 处理消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(clientId, message);
    } catch (error) {
      ws.send(JSON.stringify({ error: '无效的消息格式' }));
    }
  });

  // 处理心跳
  ws.on('pong', () => {
    const client = clients.get(clientId);
    if (client) {
      client.isAlive = true;
    }
  });

  // 处理关闭
  ws.on('close', (code, reason) => {
    console.log(`连接关闭: ${clientId}, 代码: ${code}, 原因: ${reason}`);
    clients.delete(clientId);
  });

  // 处理错误
  ws.on('error', (error) => {
    console.error(`WebSocket 错误 (${clientId}):`, error);
  });
});

// 心跳检测
const heartbeatInterval = setInterval(() => {
  clients.forEach((client, clientId) => {
    if (!client.isAlive) {
      console.log(`客户端无响应，断开连接: ${clientId}`);
      client.ws.terminate();
      clients.delete(clientId);
      return;
    }

    client.isAlive = false;
    client.ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}
```

### 客户端连接管理

```javascript
// 浏览器客户端
class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnect: true,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      maxReconnectAttempts: null,
      ...options
    };

    this.ws = null;
    this.reconnectAttempts = 0;
    this.handlers = new Map();
    this.messageQueue = [];

    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket 连接已建立');
        this.reconnectAttempts = 0;

        // 发送队列中的消息
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.send(message);
        }

        this.emit('open');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);

          // 触发特定类型的事件
          if (data.type) {
            this.emit(data.type, data);
          }
        } catch (error) {
          console.error('消息解析失败:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket 连接关闭: ${event.code}`);
        this.emit('close', event);

        if (this.options.reconnect && !event.wasClean) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('创建 WebSocket 失败:', error);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.options.maxReconnectAttempts !== null &&
        this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.log('达到最大重连次数');
      return;
    }

    const interval = Math.min(
      this.options.reconnectInterval *
        Math.pow(this.options.reconnectDecay, this.reconnectAttempts),
      this.options.maxReconnectInterval
    );

    console.log(`${interval}ms 后重连...`);

    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`重连尝试 #${this.reconnectAttempts}`);
      this.connect();
    }, interval);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      // 连接未就绪，加入队列
      this.messageQueue.push(data);
    }
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.handlers.has(event)) {
      const handlers = this.handlers.get(event);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('事件处理器错误:', error);
        }
      });
    }
  }

  close(code = 1000, reason = '') {
    this.options.reconnect = false;
    if (this.ws) {
      this.ws.close(code, reason);
    }
  }
}

// 使用示例
const client = new WebSocketClient('ws://localhost:8080', {
  reconnect: true,
  maxReconnectAttempts: 10
});

client.on('open', () => {
  console.log('已连接');
});

client.on('message', (data) => {
  console.log('收到消息:', data);
});

client.send({ type: 'chat', content: 'Hello!' });
```

## 心跳与重连机制

### 服务端心跳实现

```javascript
const WebSocket = require('ws');

class HeartbeatServer {
  constructor(options = {}) {
    this.options = {
      port: 8080,
      heartbeatInterval: 30000,  // 心跳间隔
      heartbeatTimeout: 10000,   // 心跳超时
      ...options
    };

    this.wss = new WebSocket.Server({ port: this.options.port });
    this.clients = new Map();

    this.setupServer();
    this.startHeartbeat();
  }

  setupServer() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();

      const clientInfo = {
        ws,
        id: clientId,
        isAlive: true,
        lastPing: Date.now(),
        lastPong: Date.now()
      };

      this.clients.set(clientId, clientInfo);

      // 发送连接确认
      this.sendToClient(ws, {
        type: 'connected',
        clientId,
        heartbeatInterval: this.options.heartbeatInterval
      });

      // 处理 Pong 响应
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.isAlive = true;
          client.lastPong = Date.now();
        }
      });

      // 处理自定义心跳消息
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);

          if (message.type === 'ping') {
            // 响应客户端心跳
            this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
            return;
          }

          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('消息处理错误:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`客户端断开: ${clientId}`);
      });
    });
  }

  startHeartbeat() {
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          // 客户端无响应，断开连接
          console.log(`客户端心跳超时: ${clientId}`);
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }

        // 标记为待验证，发送 Ping
        client.isAlive = false;
        client.lastPing = Date.now();

        // 使用 WebSocket 协议的 Ping
        client.ws.ping();

        // 也可以发送应用层心跳
        // this.sendToClient(client.ws, { type: 'heartbeat' });
      });
    }, this.options.heartbeatInterval);
  }

  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  handleMessage(clientId, message) {
    // 处理业务消息
    console.log(`来自 ${clientId} 的消息:`, message);
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

const server = new HeartbeatServer({
  port: 8080,
  heartbeatInterval: 30000
});
```

### 客户端心跳与重连

```javascript
class RobustWebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      // 心跳配置
      heartbeatInterval: 25000,
      heartbeatTimeout: 5000,

      // 重连配置
      reconnect: true,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      maxReconnectAttempts: Infinity,

      ...options
    };

    this.ws = null;
    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
    this.reconnectAttempts = 0;
    this.manualClose = false;
    this.handlers = new Map();

    this.connect();
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] 连接已建立');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('open');
      };

      this.ws.onmessage = (event) => {
        // 收到任何消息，重置心跳计时
        this.resetHeartbeat();

        try {
          const data = JSON.parse(event.data);

          // 处理心跳响应
          if (data.type === 'pong' || data.type === 'heartbeat') {
            this.handlePong();
            return;
          }

          this.emit('message', data);
        } catch (error) {
          // 非 JSON 消息
          this.emit('message', event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[WebSocket] 连接关闭: ${event.code} - ${event.reason}`);
        this.stopHeartbeat();
        this.emit('close', event);

        if (!this.manualClose && this.options.reconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] 错误:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('[WebSocket] 创建失败:', error);
      this.scheduleReconnect();
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('[WebSocket] 发送心跳');
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));

        // 设置心跳超时检测
        this.heartbeatTimeoutTimer = setTimeout(() => {
          console.log('[WebSocket] 心跳超时，关闭连接');
          this.ws.close(4000, 'Heartbeat timeout');
        }, this.options.heartbeatTimeout);
      }
    }, this.options.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  resetHeartbeat() {
    // 收到消息，重置心跳计时
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  handlePong() {
    // 收到 Pong，清除超时计时器
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.log('[WebSocket] 达到最大重连次数');
      this.emit('maxReconnectAttempts');
      return;
    }

    const delay = Math.min(
      this.options.reconnectInterval *
        Math.pow(this.options.reconnectDecay, this.reconnectAttempts),
      this.options.maxReconnectInterval
    );

    console.log(`[WebSocket] ${delay}ms 后进行第 ${this.reconnectAttempts + 1} 次重连`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnecting', this.reconnectAttempts);
      this.connect();
    }, delay);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    }
    return false;
  }

  close(code = 1000, reason = 'Manual close') {
    this.manualClose = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(code, reason);
    }
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
    return this;
  }

  emit(event, ...args) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  get state() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  get isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// 使用示例
const ws = new RobustWebSocketClient('ws://localhost:8080', {
  heartbeatInterval: 25000,
  reconnect: true,
  maxReconnectAttempts: 10
});

ws.on('open', () => console.log('连接成功'));
ws.on('close', () => console.log('连接关闭'));
ws.on('reconnecting', (attempt) => console.log(`重连中... 第${attempt}次`));
ws.on('message', (data) => console.log('收到消息:', data));
```

## Socket.IO 使用

Socket.IO 是一个基于 WebSocket 的实时通信库，提供了更高级的功能和更好的兼容性。

### 服务端配置

```javascript
// 安装: npm install socket.io

const { Server } = require('socket.io');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);

// 创建 Socket.IO 服务器
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  // 传输配置
  transports: ['websocket', 'polling'],
  // 心跳配置
  pingInterval: 25000,
  pingTimeout: 20000,
  // 连接配置
  connectTimeout: 45000,
  // 允许升级
  allowUpgrades: true,
  // 每个消息的最大缓冲区大小
  maxHttpBufferSize: 1e6
});

// 中间件：认证
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('认证失败：缺少token'));
  }

  try {
    // 验证 token
    const user = verifyToken(token);
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('认证失败：token无效'));
  }
});

// 连接事件
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.user.id}, socketId: ${socket.id}`);

  // 加入用户个人房间
  socket.join(`user:${socket.user.id}`);

  // 处理聊天消息
  socket.on('chat:message', async (data, callback) => {
    try {
      const { roomId, content } = data;

      // 验证用户是否在房间中
      if (!socket.rooms.has(roomId)) {
        return callback({ success: false, error: '未加入该房间' });
      }

      // 保存消息到数据库
      const message = await saveMessage({
        roomId,
        userId: socket.user.id,
        content,
        timestamp: new Date()
      });

      // 广播消息到房间
      io.to(roomId).emit('chat:message', {
        id: message.id,
        userId: socket.user.id,
        username: socket.user.name,
        content,
        timestamp: message.timestamp
      });

      callback({ success: true, messageId: message.id });
    } catch (error) {
      console.error('消息处理错误:', error);
      callback({ success: false, error: '发送失败' });
    }
  });

  // 加入房间
  socket.on('room:join', async (roomId, callback) => {
    try {
      // 验证房间访问权限
      const hasAccess = await checkRoomAccess(socket.user.id, roomId);

      if (!hasAccess) {
        return callback({ success: false, error: '无权访问该房间' });
      }

      socket.join(roomId);

      // 通知房间其他成员
      socket.to(roomId).emit('room:userJoined', {
        userId: socket.user.id,
        username: socket.user.name
      });

      // 获取房间信息
      const roomInfo = await getRoomInfo(roomId);
      callback({ success: true, room: roomInfo });
    } catch (error) {
      callback({ success: false, error: '加入房间失败' });
    }
  });

  // 离开房间
  socket.on('room:leave', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('room:userLeft', {
      userId: socket.user.id,
      username: socket.user.name
    });
  });

  // 正在输入状态
  socket.on('typing:start', (roomId) => {
    socket.to(roomId).emit('typing:update', {
      userId: socket.user.id,
      username: socket.user.name,
      isTyping: true
    });
  });

  socket.on('typing:stop', (roomId) => {
    socket.to(roomId).emit('typing:update', {
      userId: socket.user.id,
      username: socket.user.name,
      isTyping: false
    });
  });

  // 断开连接
  socket.on('disconnect', (reason) => {
    console.log(`用户断开: ${socket.user.id}, 原因: ${reason}`);

    // 通知用户所在的所有房间
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        io.to(room).emit('room:userLeft', {
          userId: socket.user.id,
          username: socket.user.name
        });
      }
    });
  });
});

server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

### 客户端配置

```javascript
// 安装: npm install socket.io-client

import { io } from 'socket.io-client';

class ChatClient {
  constructor(serverUrl, token) {
    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.currentRoom = null;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // 连接事件
    this.socket.on('connect', () => {
      console.log('已连接到服务器');
      this.onConnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('连接错误:', error.message);
      this.onConnectError?.(error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('断开连接:', reason);
      this.onDisconnect?.(reason);
    });

    // 聊天消息
    this.socket.on('chat:message', (message) => {
      this.onMessage?.(message);
    });

    // 房间事件
    this.socket.on('room:userJoined', (data) => {
      this.onUserJoined?.(data);
    });

    this.socket.on('room:userLeft', (data) => {
      this.onUserLeft?.(data);
    });

    // 输入状态
    this.socket.on('typing:update', (data) => {
      this.onTypingUpdate?.(data);
    });
  }

  // 加入房间
  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('room:join', roomId, (response) => {
        if (response.success) {
          this.currentRoom = roomId;
          resolve(response.room);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  // 离开房间
  leaveRoom() {
    if (this.currentRoom) {
      this.socket.emit('room:leave', this.currentRoom);
      this.currentRoom = null;
    }
  }

  // 发送消息
  sendMessage(content) {
    return new Promise((resolve, reject) => {
      if (!this.currentRoom) {
        return reject(new Error('未加入任何房间'));
      }

      this.socket.emit('chat:message', {
        roomId: this.currentRoom,
        content
      }, (response) => {
        if (response.success) {
          resolve(response.messageId);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  // 开始输入
  startTyping() {
    if (this.currentRoom) {
      this.socket.emit('typing:start', this.currentRoom);
    }
  }

  // 停止输入
  stopTyping() {
    if (this.currentRoom) {
      this.socket.emit('typing:stop', this.currentRoom);
    }
  }

  // 断开连接
  disconnect() {
    this.socket.disconnect();
  }
}

// 使用示例
const chat = new ChatClient('http://localhost:3000', 'your-auth-token');

chat.onConnect = () => {
  console.log('连接成功！');
  chat.joinRoom('room-123').then(room => {
    console.log('加入房间:', room);
  });
};

chat.onMessage = (message) => {
  console.log(`${message.username}: ${message.content}`);
};

chat.onTypingUpdate = ({ username, isTyping }) => {
  if (isTyping) {
    console.log(`${username} 正在输入...`);
  }
};
```

## 消息广播与房间

### 广播类型

```javascript
const { Server } = require('socket.io');
const io = new Server(server);

io.on('connection', (socket) => {

  // 1. 发送给当前客户端
  socket.emit('private', { message: '只有你能收到' });

  // 2. 广播给所有其他客户端（不包括发送者）
  socket.broadcast.emit('broadcast', { message: '除了你，所有人都能收到' });

  // 3. 广播给所有客户端（包括发送者）
  io.emit('global', { message: '所有人都能收到' });

  // 4. 发送给指定房间（包括发送者）
  io.to('room-1').emit('room', { message: '房间内所有人' });

  // 5. 发送给指定房间（不包括发送者）
  socket.to('room-1').emit('room', { message: '房间内除了你' });

  // 6. 发送给多个房间
  io.to('room-1').to('room-2').emit('rooms', { message: '两个房间' });

  // 7. 发送给指定 socket id
  io.to(socketId).emit('direct', { message: '指定用户' });

  // 8. 发送给除了某些房间的所有客户端
  socket.broadcast.except('room-1').emit('except', { message: '除了room-1' });
});
```

### 房间管理

```javascript
class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> { name, users, createdAt, ... }
  }

  // 创建房间
  async createRoom(roomId, options = {}) {
    if (this.rooms.has(roomId)) {
      throw new Error('房间已存在');
    }

    const room = {
      id: roomId,
      name: options.name || roomId,
      maxUsers: options.maxUsers || 100,
      isPrivate: options.isPrivate || false,
      password: options.password || null,
      owner: options.owner,
      users: new Set(),
      createdAt: new Date()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  // 加入房间
  async joinRoom(socket, roomId, password = null) {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error('房间不存在');
    }

    if (room.users.size >= room.maxUsers) {
      throw new Error('房间已满');
    }

    if (room.isPrivate && room.password !== password) {
      throw new Error('密码错误');
    }

    // 加入 Socket.IO 房间
    socket.join(roomId);
    room.users.add(socket.user.id);

    // 通知房间其他成员
    socket.to(roomId).emit('room:userJoined', {
      userId: socket.user.id,
      username: socket.user.name,
      userCount: room.users.size
    });

    return {
      room: this.getRoomInfo(roomId),
      users: await this.getRoomUsers(roomId)
    };
  }

  // 离开房间
  async leaveRoom(socket, roomId) {
    const room = this.rooms.get(roomId);

    if (!room) return;

    socket.leave(roomId);
    room.users.delete(socket.user.id);

    // 通知房间其他成员
    socket.to(roomId).emit('room:userLeft', {
      userId: socket.user.id,
      username: socket.user.name,
      userCount: room.users.size
    });

    // 如果房间为空，删除房间
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  // 获取房间信息
  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: room.id,
      name: room.name,
      userCount: room.users.size,
      maxUsers: room.maxUsers,
      isPrivate: room.isPrivate,
      createdAt: room.createdAt
    };
  }

  // 获取房间用户列表
  async getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    // 获取房间内的所有 socket
    const sockets = await this.io.in(roomId).fetchSockets();

    return sockets.map(socket => ({
      id: socket.user.id,
      name: socket.user.name,
      socketId: socket.id
    }));
  }

  // 广播消息到房间
  broadcastToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  // 踢出用户
  async kickUser(roomId, userId) {
    const sockets = await this.io.in(roomId).fetchSockets();
    const targetSocket = sockets.find(s => s.user.id === userId);

    if (targetSocket) {
      targetSocket.leave(roomId);
      targetSocket.emit('room:kicked', { roomId, reason: '被管理员踢出' });

      const room = this.rooms.get(roomId);
      if (room) {
        room.users.delete(userId);
      }
    }
  }
}

// 使用示例
const roomManager = new RoomManager(io);

io.on('connection', (socket) => {
  // 创建房间
  socket.on('room:create', async (options, callback) => {
    try {
      const room = await roomManager.createRoom(
        `room_${Date.now()}`,
        { ...options, owner: socket.user.id }
      );
      callback({ success: true, room });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // 加入房间
  socket.on('room:join', async ({ roomId, password }, callback) => {
    try {
      const result = await roomManager.joinRoom(socket, roomId, password);
      callback({ success: true, ...result });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // 离开房间
  socket.on('room:leave', async (roomId) => {
    await roomManager.leaveRoom(socket, roomId);
  });

  // 断开连接时离开所有房间
  socket.on('disconnect', async () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        await roomManager.leaveRoom(socket, roomId);
      }
    }
  });
});
```

## 扩展性（集群环境）

### 使用 Redis Adapter

在多服务器环境下，需要使用 Redis adapter 来同步消息：

```javascript
// 安装: npm install @socket.io/redis-adapter redis

const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

async function createClusterServer(httpServer) {
  const io = new Server(httpServer);

  // 创建 Redis 客户端
  const pubClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  const subClient = pubClient.duplicate();

  // 连接 Redis
  await Promise.all([
    pubClient.connect(),
    subClient.connect()
  ]);

  // 设置 Redis adapter
  io.adapter(createAdapter(pubClient, subClient));

  console.log('Socket.IO Redis adapter 已配置');

  return io;
}

// 使用
const http = require('http');
const server = http.createServer();

createClusterServer(server).then(io => {
  io.on('connection', (socket) => {
    console.log('新连接:', socket.id);

    // 现在消息会自动同步到所有服务器实例
    socket.on('chat:message', (data) => {
      io.to(data.roomId).emit('chat:message', data);
    });
  });

  server.listen(3000);
});
```

### 使用 Redis Streams Adapter

```javascript
// 安装: npm install @socket.io/redis-streams-adapter

const { createAdapter } = require('@socket.io/redis-streams-adapter');
const { createClient } = require('redis');

async function setupRedisStreamsAdapter(io) {
  const client = createClient({
    url: process.env.REDIS_URL
  });

  await client.connect();

  io.adapter(createAdapter(client));
}
```

### 水平扩展架构

```javascript
// cluster.js - 多进程部署
const cluster = require('cluster');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const { setupMaster, setupWorker } = require('@socket.io/sticky');

const numCPUs = require('os').cpus().length;

if (cluster.isPrimary) {
  console.log(`主进程 ${process.pid} 正在运行`);

  // 创建 HTTP 服务器用于 sticky session
  const httpServer = http.createServer();
  setupMaster(httpServer, {
    loadBalancingMethod: 'least-connection' // 或 'round-robin'
  });

  httpServer.listen(3000);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出`);
    // 自动重启
    cluster.fork();
  });
} else {
  console.log(`工作进程 ${process.pid} 已启动`);

  const httpServer = http.createServer();
  const io = new Server(httpServer);

  // 设置 worker
  setupWorker(io);

  // 设置 Redis adapter
  (async () => {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));

    io.on('connection', (socket) => {
      console.log(`[Worker ${process.pid}] 新连接: ${socket.id}`);

      socket.on('chat:message', (data) => {
        // 消息会通过 Redis 同步到所有 worker
        io.to(data.roomId).emit('chat:message', data);
      });
    });
  })();

  httpServer.listen(0, 'localhost');
}
```

### 负载均衡配置（Nginx）

```nginx
# nginx.conf
upstream socketio_nodes {
    ip_hash;  # 确保同一客户端始终连接到同一服务器
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    server 127.0.0.1:3004;
}

server {
    listen 80;
    server_name example.com;

    location /socket.io/ {
        proxy_pass http://socketio_nodes;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 超时配置
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

## 安全性考虑

### 认证与授权

```javascript
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const io = new Server(server);

// 认证中间件
io.use((socket, next) => {
  const token = socket.handshake.auth.token ||
                socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('认证失败：缺少令牌'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('认证失败：令牌已过期'));
    }
    return next(new Error('认证失败：无效令牌'));
  }
});

// 权限检查中间件
io.use((socket, next) => {
  // 检查用户是否被封禁
  if (socket.user.isBanned) {
    return next(new Error('账号已被封禁'));
  }
  next();
});

// 事件级别的权限检查
io.on('connection', (socket) => {
  socket.on('admin:action', async (data, callback) => {
    // 检查管理员权限
    if (socket.user.role !== 'admin') {
      return callback({ error: '无权限执行此操作' });
    }

    // 执行管理员操作
    // ...
  });
});
```

### 输入验证

```javascript
const Joi = require('joi');

// 消息验证 schema
const messageSchema = Joi.object({
  roomId: Joi.string().required().max(50),
  content: Joi.string().required().min(1).max(5000),
  type: Joi.string().valid('text', 'image', 'file').default('text')
});

// 创建验证中间件
function validateEvent(schema) {
  return (data, callback) => {
    const { error, value } = schema.validate(data);

    if (error) {
      return callback({
        success: false,
        error: `验证失败: ${error.details[0].message}`
      });
    }

    return { validated: value, callback };
  };
}

io.on('connection', (socket) => {
  socket.on('chat:message', (data, callback) => {
    // 验证输入
    const { error, value } = messageSchema.validate(data);

    if (error) {
      return callback({
        success: false,
        error: error.details[0].message
      });
    }

    // 使用验证后的数据
    processMessage(socket, value, callback);
  });
});

// XSS 防护
const sanitizeHtml = require('sanitize-html');

function sanitizeMessage(content) {
  return sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {}
  });
}
```

### 速率限制

```javascript
const rateLimit = new Map();

// 速率限制配置
const RATE_LIMIT = {
  windowMs: 60000,    // 1分钟窗口
  maxRequests: 100,   // 最大请求数
  blockDuration: 300000 // 封禁5分钟
};

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimit.get(userId);

  if (!userLimit) {
    rateLimit.set(userId, {
      count: 1,
      firstRequest: now,
      blocked: false,
      blockedUntil: 0
    });
    return true;
  }

  // 检查是否被封禁
  if (userLimit.blocked) {
    if (now < userLimit.blockedUntil) {
      return false;
    }
    // 封禁已过期，重置
    userLimit.blocked = false;
    userLimit.count = 1;
    userLimit.firstRequest = now;
    return true;
  }

  // 检查是否在时间窗口内
  if (now - userLimit.firstRequest < RATE_LIMIT.windowMs) {
    userLimit.count++;

    if (userLimit.count > RATE_LIMIT.maxRequests) {
      // 触发封禁
      userLimit.blocked = true;
      userLimit.blockedUntil = now + RATE_LIMIT.blockDuration;
      return false;
    }
  } else {
    // 重置计数
    userLimit.count = 1;
    userLimit.firstRequest = now;
  }

  return true;
}

// 应用速率限制
io.on('connection', (socket) => {
  socket.use(([event, ...args], next) => {
    if (!checkRateLimit(socket.user.id)) {
      return next(new Error('请求过于频繁，请稍后再试'));
    }
    next();
  });
});
```

### CORS 和 Origin 验证

```javascript
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://example.com',
        'https://www.example.com',
        'https://app.example.com'
      ];

      // 开发环境
      if (process.env.NODE_ENV === 'development') {
        allowedOrigins.push('http://localhost:3000');
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('不允许的来源'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Origin 验证中间件
io.use((socket, next) => {
  const origin = socket.handshake.headers.origin;

  if (!isValidOrigin(origin)) {
    return next(new Error('非法来源'));
  }

  next();
});
```

## 实战案例

### 聊天应用完整实现

```javascript
// server/chat-server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// MongoDB 消息模型
const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ roomId: 1, createdAt: -1 });
const Message = mongoose.model('Message', messageSchema);

// 在线用户管理
class OnlineUsers {
  constructor() {
    this.users = new Map(); // socketId -> userInfo
    this.userSockets = new Map(); // oderId -> Set<socketId>
  }

  addUser(socketId, user) {
    this.users.set(socketId, user);

    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, new Set());
    }
    this.userSockets.get(user.id).add(socketId);
  }

  removeUser(socketId) {
    const user = this.users.get(socketId);
    if (user) {
      this.users.delete(socketId);
      const sockets = this.userSockets.get(user.id);
      if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.userSockets.delete(user.id);
        }
      }
    }
    return user;
  }

  getUser(socketId) {
    return this.users.get(socketId);
  }

  isOnline(userId) {
    return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
  }

  getUserSockets(userId) {
    return this.userSockets.get(userId) || new Set();
  }

  getOnlineCount() {
    return this.userSockets.size;
  }
}

const onlineUsers = new OnlineUsers();

// 认证中间件
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('认证失败'));
  }
});

io.on('connection', (socket) => {
  console.log(`用户 ${socket.user.username} 已连接`);

  // 添加到在线用户
  onlineUsers.addUser(socket.id, socket.user);

  // 广播在线人数
  io.emit('users:online', { count: onlineUsers.getOnlineCount() });

  // 加入房间
  socket.on('room:join', async (roomId, callback) => {
    try {
      socket.join(roomId);

      // 获取历史消息
      const messages = await Message.find({ roomId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // 发送系统消息
      const systemMessage = {
        type: 'system',
        content: `${socket.user.username} 加入了聊天室`,
        createdAt: new Date()
      };

      socket.to(roomId).emit('chat:message', systemMessage);

      callback({
        success: true,
        messages: messages.reverse()
      });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // 发送消息
  socket.on('chat:message', async (data, callback) => {
    try {
      const { roomId, content, type = 'text' } = data;

      // 创建消息
      const message = new Message({
        roomId,
        userId: socket.user.id,
        username: socket.user.username,
        content,
        type
      });

      await message.save();

      // 广播消息
      const messageData = {
        id: message._id,
        userId: socket.user.id,
        username: socket.user.username,
        content,
        type,
        createdAt: message.createdAt
      };

      io.to(roomId).emit('chat:message', messageData);

      callback({ success: true, messageId: message._id });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // 正在输入
  let typingTimeout;
  socket.on('typing:start', (roomId) => {
    socket.to(roomId).emit('typing:update', {
      userId: socket.user.id,
      username: socket.user.username,
      isTyping: true
    });

    // 自动停止输入状态
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.to(roomId).emit('typing:update', {
        userId: socket.user.id,
        username: socket.user.username,
        isTyping: false
      });
    }, 3000);
  });

  // 断开连接
  socket.on('disconnect', () => {
    const user = onlineUsers.removeUser(socket.id);
    console.log(`用户 ${user?.username} 已断开`);

    io.emit('users:online', { count: onlineUsers.getOnlineCount() });
  });
});

server.listen(3000);
```

### 实时通知系统

```javascript
// server/notification-server.js
const { Server } = require('socket.io');
const Redis = require('ioredis');

class NotificationService {
  constructor(io, redis) {
    this.io = io;
    this.redis = redis;
    this.userSockets = new Map(); // userId -> Set<socketId>

    this.setupSubscription();
  }

  // 订阅 Redis 频道接收通知
  setupSubscription() {
    const subscriber = this.redis.duplicate();

    subscriber.subscribe('notifications', (err) => {
      if (err) console.error('Redis 订阅失败:', err);
    });

    subscriber.on('message', (channel, message) => {
      if (channel === 'notifications') {
        const notification = JSON.parse(message);
        this.deliverNotification(notification);
      }
    });
  }

  // 注册用户 socket
  registerUser(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
  }

  // 注销用户 socket
  unregisterUser(userId, socketId) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  // 发送通知
  async sendNotification(userId, notification) {
    const fullNotification = {
      id: this.generateId(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    };

    // 存储到 Redis（用于离线用户）
    await this.redis.lpush(
      `notifications:${userId}`,
      JSON.stringify(fullNotification)
    );
    await this.redis.ltrim(`notifications:${userId}`, 0, 99); // 保留最近100条

    // 发布到 Redis 频道（用于集群环境）
    await this.redis.publish('notifications', JSON.stringify({
      userId,
      notification: fullNotification
    }));

    return fullNotification;
  }

  // 投递通知到客户端
  deliverNotification({ userId, notification }) {
    const sockets = this.userSockets.get(userId);

    if (sockets && sockets.size > 0) {
      // 用户在线，直接推送
      sockets.forEach(socketId => {
        this.io.to(socketId).emit('notification', notification);
      });
    }
  }

  // 获取未读通知
  async getUnreadNotifications(userId, limit = 20) {
    const notifications = await this.redis.lrange(
      `notifications:${userId}`,
      0,
      limit - 1
    );

    return notifications
      .map(n => JSON.parse(n))
      .filter(n => !n.read);
  }

  // 标记已读
  async markAsRead(userId, notificationId) {
    const notifications = await this.redis.lrange(
      `notifications:${userId}`,
      0,
      -1
    );

    const updated = notifications.map(n => {
      const notification = JSON.parse(n);
      if (notification.id === notificationId) {
        notification.read = true;
      }
      return JSON.stringify(notification);
    });

    // 更新 Redis
    await this.redis.del(`notifications:${userId}`);
    if (updated.length > 0) {
      await this.redis.rpush(`notifications:${userId}`, ...updated);
    }
  }

  generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 使用示例
const redis = new Redis(process.env.REDIS_URL);
const notificationService = new NotificationService(io, redis);

io.on('connection', (socket) => {
  // 注册用户
  notificationService.registerUser(socket.user.id, socket.id);

  // 获取未读通知
  socket.on('notifications:get', async (callback) => {
    const notifications = await notificationService.getUnreadNotifications(
      socket.user.id
    );
    callback({ notifications });
  });

  // 标记已读
  socket.on('notifications:read', async (notificationId, callback) => {
    await notificationService.markAsRead(socket.user.id, notificationId);
    callback({ success: true });
  });

  socket.on('disconnect', () => {
    notificationService.unregisterUser(socket.user.id, socket.id);
  });
});

// 外部调用发送通知
// await notificationService.sendNotification('user123', {
//   type: 'comment',
//   title: '新评论',
//   message: '有人评论了你的文章',
//   data: { articleId: 'xxx', commentId: 'yyy' }
// });
```

## 面试要点

### 常见面试问题

```javascript
/**
 * 1. WebSocket 与 HTTP 的主要区别是什么？
 *
 * 答案要点：
 * - HTTP 是无状态、请求/响应模式，每次通信需要新建连接
 * - WebSocket 是有状态、全双工通信，连接建立后保持打开
 * - WebSocket 头部开销小（2-14字节 vs HTTP的几百字节）
 * - WebSocket 适合实时场景，HTTP 适合传统请求
 */

/**
 * 2. WebSocket 连接是如何建立的？
 *
 * 答案要点：
 * - 通过 HTTP 升级握手（Upgrade: websocket）
 * - 客户端发送 Sec-WebSocket-Key
 * - 服务端返回 Sec-WebSocket-Accept（Key + GUID 的 SHA1 Base64）
 * - 状态码 101 表示协议切换成功
 */

/**
 * 3. 如何处理 WebSocket 断线重连？
 *
 * 答案要点：
 * - 监听 close 和 error 事件
 * - 实现指数退避重连策略
 * - 设置最大重连次数
 * - 重连时恢复状态（如重新加入房间、同步数据）
 */

/**
 * 4. WebSocket 如何实现心跳机制？
 *
 * 答案要点：
 * - 使用协议层 Ping/Pong 帧
 * - 或使用应用层心跳消息
 * - 服务端定期发送 Ping，客户端响应 Pong
 * - 超时未响应则断开连接
 */

/**
 * 5. 在集群环境下如何使用 WebSocket？
 *
 * 答案要点：
 * - 使用 Redis adapter 同步消息
 * - 配置 sticky session（同一客户端连接同一服务器）
 * - 使用负载均衡（如 Nginx 的 ip_hash）
 * - 通过 Redis Pub/Sub 实现跨服务器广播
 */

/**
 * 6. WebSocket 的安全问题有哪些？如何防范？
 *
 * 答案要点：
 * - 认证：使用 JWT 或 session 验证身份
 * - 授权：检查用户权限
 * - 输入验证：防止 XSS 和注入攻击
 * - 速率限制：防止 DoS 攻击
 * - 使用 WSS（TLS加密）
 * - Origin 验证
 */
```

### 代码实现题

```javascript
/**
 * 面试题：实现一个简单的 WebSocket 服务器，支持：
 * 1. 用户认证
 * 2. 房间功能
 * 3. 消息广播
 */

const WebSocket = require('ws');

class SimpleWSServer {
  constructor(port) {
    this.wss = new WebSocket.Server({ port });
    this.rooms = new Map(); // roomId -> Set<ws>
    this.clients = new Map(); // ws -> { userId, rooms }

    this.init();
  }

  init() {
    this.wss.on('connection', (ws) => {
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (e) {
          this.send(ws, { error: '无效消息' });
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });

    // 心跳检测
    setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  handleMessage(ws, message) {
    switch (message.type) {
      case 'auth':
        this.authenticate(ws, message.token);
        break;
      case 'join':
        this.joinRoom(ws, message.roomId);
        break;
      case 'leave':
        this.leaveRoom(ws, message.roomId);
        break;
      case 'message':
        this.broadcast(ws, message.roomId, message.content);
        break;
    }
  }

  authenticate(ws, token) {
    // 简化的认证逻辑
    const userId = this.verifyToken(token);
    if (userId) {
      this.clients.set(ws, { userId, rooms: new Set() });
      this.send(ws, { type: 'auth', success: true });
    } else {
      this.send(ws, { type: 'auth', success: false });
      ws.close();
    }
  }

  joinRoom(ws, roomId) {
    const client = this.clients.get(ws);
    if (!client) return;

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    this.rooms.get(roomId).add(ws);
    client.rooms.add(roomId);

    this.send(ws, { type: 'joined', roomId });
  }

  leaveRoom(ws, roomId) {
    const client = this.clients.get(ws);
    if (!client) return;

    this.rooms.get(roomId)?.delete(ws);
    client.rooms.delete(roomId);
  }

  broadcast(ws, roomId, content) {
    const client = this.clients.get(ws);
    if (!client || !client.rooms.has(roomId)) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const message = {
      type: 'message',
      userId: client.userId,
      content,
      timestamp: Date.now()
    };

    room.forEach(clientWs => {
      this.send(clientWs, message);
    });
  }

  handleDisconnect(ws) {
    const client = this.clients.get(ws);
    if (client) {
      client.rooms.forEach(roomId => {
        this.rooms.get(roomId)?.delete(ws);
      });
      this.clients.delete(ws);
    }
  }

  send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  verifyToken(token) {
    // 实际项目中应该验证 JWT
    return token ? `user_${token.slice(0, 8)}` : null;
  }
}

// 启动服务器
new SimpleWSServer(8080);
```

### 性能优化建议

```javascript
/**
 * WebSocket 性能优化要点：
 *
 * 1. 消息压缩
 *    - 使用 permessage-deflate 扩展
 *    - 对大消息进行压缩
 *
 * 2. 消息批处理
 *    - 合并多个小消息
 *    - 设置发送间隔
 *
 * 3. 连接池管理
 *    - 限制最大连接数
 *    - 及时清理无效连接
 *
 * 4. 内存优化
 *    - 避免存储大量消息历史
 *    - 使用流式处理大文件
 *
 * 5. 负载均衡
 *    - 使用 sticky session
 *    - 配置适当的连接超时
 */

// 消息压缩配置
const WebSocket = require('ws');

const wss = new WebSocket.Server({
  port: 8080,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024 // 仅压缩大于1KB的消息
  }
});

// 消息批处理
class MessageBatcher {
  constructor(ws, interval = 50) {
    this.ws = ws;
    this.queue = [];
    this.interval = interval;
    this.timer = null;
  }

  send(message) {
    this.queue.push(message);

    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.interval);
    }
  }

  flush() {
    if (this.queue.length > 0 && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'batch',
        messages: this.queue
      }));
      this.queue = [];
    }
    this.timer = null;
  }
}
```

## 总结

WebSocket 是现代实时应用的核心技术，本文介绍了：

1. **协议基础**：WebSocket 的工作原理、握手过程和帧格式
2. **连接管理**：心跳机制、断线重连、状态维护
3. **Socket.IO**：高级封装库的使用，简化开发
4. **房间与广播**：实现群聊、频道等功能
5. **集群扩展**：Redis adapter、负载均衡配置
6. **安全防护**：认证授权、输入验证、速率限制
7. **实战案例**：聊天应用、通知系统的完整实现

掌握这些知识，你就能构建高性能、可扩展的实时通信应用。在实际项目中，建议使用成熟的库（如 Socket.IO）来简化开发，同时注意安全性和性能优化。
