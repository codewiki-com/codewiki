---
title: WebSocket Real-time Communication Guide
description: Master WebSocket for bidirectional real-time applications
track: foundations
section: networking
difficulty: intermediate
tags:
  - WebSocket
  - Real-time
  - Socket.IO
  - Long Connection
status: imported
origin: old/src/content/docs/backend/websocket.en.md
divergence: 0.229
issues: []
legacy:
  category: Backend
  subcategory: Protocol
  order: 18
  lastUpdated: 2026-01-07
---

## Understanding WebSocket

WebSocket is a protocol that enables full-duplex communication over a single TCP connection. It allows clients and servers to establish persistent connections where both parties can send data to each other at any time, eliminating the need to create new connections for each communication like traditional HTTP.

### Core Features

WebSocket's key characteristics include:

- **Full-duplex Communication**: Both client and server can send and receive data simultaneously
- **Persistent Connection**: Once established, the connection remains open until either party closes it
- **Low Latency**: Eliminates the overhead of HTTP request/response cycles
- **Lightweight Protocol**: Minimal frame header overhead (as small as 2 bytes)
- **Cross-origin Support**: Native support for cross-domain communication

### Use Cases

WebSocket is particularly well-suited for:

```
1. Real-time chat applications (instant messaging, customer service)
2. Collaborative editing tools (online documents, whiteboards)
3. Real-time games (multiplayer online games)
4. Financial trading systems (stock quotes, cryptocurrency)
5. IoT device communication
6. Real-time notification systems (push notifications)
7. Live streaming comment systems
```

## WebSocket vs HTTP Polling

### Traditional Polling

Traditional polling involves the client periodically sending HTTP requests to the server to check for new data:

```javascript
// Traditional polling example
function polling() {
  setInterval(async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      if (data.messages.length > 0) {
        handleNewMessages(data.messages);
      }
    } catch (error) {
      console.error('Polling failed:', error);
    }
  }, 3000); // Poll every 3 seconds
}

// Problems:
// 1. Many wasted requests (server may have no new data)
// 2. High latency (worst case equals polling interval)
// 3. Server strain (frequent connection establishment/teardown)
// 4. Bandwidth waste (full HTTP headers on each request)
```

### Long Polling

Long polling improves upon traditional polling by having the server hold the request until data is available or timeout occurs:

```javascript
// Long polling example
async function longPolling() {
  while (true) {
    try {
      // Server blocks request until new data arrives or timeout
      const response = await fetch('/api/messages/long-poll', {
        timeout: 30000 // 30 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        handleNewMessages(data.messages);
      }
    } catch (error) {
      if (error.name === 'TimeoutError') {
        // On timeout, retry immediately
        continue;
      }
      console.error('Long polling failed:', error);
      // Wait before retrying on error
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Server-side implementation (Express)
app.get('/api/messages/long-poll', async (req, res) => {
  const timeout = 30000;
  const startTime = Date.now();

  // Check for new messages
  const checkMessages = async () => {
    const messages = await getNewMessages(req.query.lastId);

    if (messages.length > 0) {
      return res.json({ messages });
    }

    if (Date.now() - startTime >= timeout) {
      return res.json({ messages: [] });
    }

    // No messages, wait and check again
    setTimeout(checkMessages, 500);
  };

  checkMessages();
});
```

### Server-Sent Events (SSE)

SSE is a technology for server-to-client data pushing, but only supports one-way communication:

```javascript
// Client-side SSE
const eventSource = new EventSource('/api/events');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received message:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};

// Server-side SSE (Express)
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  // Simulate data pushing
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

### WebSocket Advantages Comparison

| Feature | Traditional Polling | Long Polling | SSE | WebSocket |
|---------|---------------------|--------------|-----|-----------|
| Communication Direction | One-way | One-way | Server->Client | Bidirectional |
| Connections | New per request | Per request | Single persistent | Single persistent |
| Real-time Performance | Low | Medium | High | Highest |
| Server Overhead | High | Medium | Low | Lowest |
| Bandwidth Usage | High | Medium | Low | Lowest |
| Browser Support | All | All | No IE support | Modern browsers |
| Complexity | Low | Medium | Low | Medium |

```javascript
// WebSocket example (demonstrating advantages)
const ws = new WebSocket('ws://example.com/socket');

ws.onopen = () => {
  console.log('Connection established');
  // Can send data immediately
  ws.send(JSON.stringify({ type: 'subscribe', channel: 'chat' }));
};

ws.onmessage = (event) => {
  // Receive server push in real-time
  const data = JSON.parse(event.data);
  handleMessage(data);
};

// Advantages:
// 1. Single connection, persistent usage
// 2. Bidirectional communication, send anytime
// 3. Small frame overhead (2-14 bytes header)
// 4. True real-time performance
```

## WebSocket Protocol Deep Dive

### Protocol Structure

The WebSocket protocol is defined in RFC 6455 and uses `ws://` (unencrypted) or `wss://` (TLS encrypted) as URI schemes:

```
ws://host:port/path?query
wss://host:port/path?query

# Examples
ws://localhost:8080/chat
wss://example.com/socket?token=abc123
```

### Data Frame Format

WebSocket data is transmitted in frames:

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
// Frame type descriptions
const OPCODES = {
  CONTINUATION: 0x0,  // Continuation frame
  TEXT: 0x1,          // Text frame
  BINARY: 0x2,        // Binary frame
  CLOSE: 0x8,         // Close connection
  PING: 0x9,          // Ping
  PONG: 0xA           // Pong
};

// Parse WebSocket frame (simplified)
function parseFrame(buffer) {
  const firstByte = buffer[0];
  const secondByte = buffer[1];

  const fin = (firstByte & 0x80) !== 0;      // Is this the final frame?
  const opcode = firstByte & 0x0F;            // Operation code
  const masked = (secondByte & 0x80) !== 0;   // Is it masked?
  let payloadLength = secondByte & 0x7F;      // Payload length

  let offset = 2;

  // Extended length handling
  if (payloadLength === 126) {
    payloadLength = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (payloadLength === 127) {
    payloadLength = buffer.readBigUInt64BE(offset);
    offset += 8;
  }

  // Decode masking key
  let maskingKey;
  if (masked) {
    maskingKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  // Extract payload data
  let payload = buffer.slice(offset, offset + Number(payloadLength));

  // If masked, decode the data
  if (masked) {
    payload = unmask(payload, maskingKey);
  }

  return { fin, opcode, payload };
}

// Unmask function
function unmask(payload, maskingKey) {
  const result = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) {
    result[i] = payload[i] ^ maskingKey[i % 4];
  }
  return result;
}
```

### Control Frames

```javascript
// Ping/Pong heartbeat mechanism
// Server sends Ping
function sendPing(ws) {
  const pingFrame = Buffer.from([0x89, 0x00]); // Ping frame
  ws.send(pingFrame);
}

// Client automatically responds with Pong
// Browser WebSocket API handles Pong responses automatically

// Close frame
function sendClose(ws, code, reason) {
  const codeBuffer = Buffer.alloc(2);
  codeBuffer.writeUInt16BE(code);
  const reasonBuffer = Buffer.from(reason);
  const payload = Buffer.concat([codeBuffer, reasonBuffer]);

  // Construct close frame
  // opcode = 0x8 (close)
  ws.close(code, reason);
}

// Common close codes
const CLOSE_CODES = {
  NORMAL: 1000,           // Normal closure
  GOING_AWAY: 1001,       // Endpoint going away (e.g., page closed)
  PROTOCOL_ERROR: 1002,   // Protocol error
  UNSUPPORTED: 1003,      // Unsupported data type
  NO_STATUS: 1005,        // No status code received
  ABNORMAL: 1006,         // Abnormal closure
  INVALID_DATA: 1007,     // Data type inconsistency
  POLICY_VIOLATION: 1008, // Policy violation
  TOO_LARGE: 1009,        // Message too large
  EXTENSION_REQUIRED: 1010, // Extension required
  INTERNAL_ERROR: 1011    // Internal server error
};
```

## Connection Management and Handshake

### HTTP Upgrade Handshake

WebSocket connections are established through the HTTP upgrade mechanism:

```javascript
// Client handshake request
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

// Server handshake response
/*
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocol: chat
*/

// Node.js WebSocket server implementation (low-level)
const http = require('http');
const crypto = require('crypto');

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const server = http.createServer();

server.on('upgrade', (req, socket, head) => {
  // Validate upgrade request
  if (req.headers['upgrade'] !== 'websocket') {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    return;
  }

  // Calculate Sec-WebSocket-Accept
  const key = req.headers['sec-websocket-key'];
  const acceptKey = crypto
    .createHash('sha1')
    .update(key + GUID)
    .digest('base64');

  // Send handshake response
  const response = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '\r\n'
  ].join('\r\n');

  socket.write(response);

  // Connection established, start handling WebSocket frames
  handleWebSocket(socket);
});

server.listen(8080);
```

### Using the ws Library

In practice, developers typically use mature libraries like `ws`:

```javascript
// Install: npm install ws

const WebSocket = require('ws');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// Connection management
const clients = new Map();

wss.on('connection', (ws, req) => {
  // Get client information
  const clientId = generateId();
  const clientIp = req.socket.remoteAddress;

  console.log(`New connection: ${clientId} from ${clientIp}`);

  // Store client
  clients.set(clientId, {
    ws,
    ip: clientIp,
    connectedAt: new Date(),
    isAlive: true
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    message: 'Connection successful'
  }));

  // Handle messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(clientId, message);
    } catch (error) {
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  // Handle heartbeat
  ws.on('pong', () => {
    const client = clients.get(clientId);
    if (client) {
      client.isAlive = true;
    }
  });

  // Handle close
  ws.on('close', (code, reason) => {
    console.log(`Connection closed: ${clientId}, code: ${code}, reason: ${reason}`);
    clients.delete(clientId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error (${clientId}):`, error);
  });
});

// Heartbeat detection
const heartbeatInterval = setInterval(() => {
  clients.forEach((client, clientId) => {
    if (!client.isAlive) {
      console.log(`Client unresponsive, disconnecting: ${clientId}`);
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

### Client Connection Management

```javascript
// Browser client
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
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;

        // Send queued messages
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

          // Trigger specific event types
          if (data.type) {
            this.emit(data.type, data);
          }
        } catch (error) {
          console.error('Message parsing failed:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code}`);
        this.emit('close', event);

        if (this.options.reconnect && !event.wasClean) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.options.maxReconnectAttempts !== null &&
        this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.log('Maximum reconnection attempts reached');
      return;
    }

    const interval = Math.min(
      this.options.reconnectInterval *
        Math.pow(this.options.reconnectDecay, this.reconnectAttempts),
      this.options.maxReconnectInterval
    );

    console.log(`Reconnecting in ${interval}ms...`);

    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt #${this.reconnectAttempts}`);
      this.connect();
    }, interval);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      // Connection not ready, queue the message
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
          console.error('Event handler error:', error);
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

// Usage example
const client = new WebSocketClient('ws://localhost:8080', {
  reconnect: true,
  maxReconnectAttempts: 10
});

client.on('open', () => {
  console.log('Connected');
});

client.on('message', (data) => {
  console.log('Received message:', data);
});

client.send({ type: 'chat', content: 'Hello!' });
```

## Heartbeat and Reconnection Mechanisms

### Server-side Heartbeat Implementation

```javascript
const WebSocket = require('ws');

class HeartbeatServer {
  constructor(options = {}) {
    this.options = {
      port: 8080,
      heartbeatInterval: 30000,  // Heartbeat interval
      heartbeatTimeout: 10000,   // Heartbeat timeout
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

      // Send connection confirmation
      this.sendToClient(ws, {
        type: 'connected',
        clientId,
        heartbeatInterval: this.options.heartbeatInterval
      });

      // Handle Pong response
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.isAlive = true;
          client.lastPong = Date.now();
        }
      });

      // Handle custom heartbeat messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);

          if (message.type === 'ping') {
            // Respond to client heartbeat
            this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
            return;
          }

          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Message handling error:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      });
    });
  }

  startHeartbeat() {
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          // Client unresponsive, disconnect
          console.log(`Client heartbeat timeout: ${clientId}`);
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }

        // Mark as pending verification, send Ping
        client.isAlive = false;
        client.lastPing = Date.now();

        // Use WebSocket protocol Ping
        client.ws.ping();

        // Can also send application-level heartbeat
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
    // Handle business messages
    console.log(`Message from ${clientId}:`, message);
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

### Client Heartbeat and Reconnection

```javascript
class RobustWebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      // Heartbeat configuration
      heartbeatInterval: 25000,
      heartbeatTimeout: 5000,

      // Reconnection configuration
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
        console.log('[WebSocket] Connection established');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('open');
      };

      this.ws.onmessage = (event) => {
        // Reset heartbeat timer on any message received
        this.resetHeartbeat();

        try {
          const data = JSON.parse(event.data);

          // Handle heartbeat response
          if (data.type === 'pong' || data.type === 'heartbeat') {
            this.handlePong();
            return;
          }

          this.emit('message', data);
        } catch (error) {
          // Non-JSON message
          this.emit('message', event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[WebSocket] Connection closed: ${event.code} - ${event.reason}`);
        this.stopHeartbeat();
        this.emit('close', event);

        if (!this.manualClose && this.options.reconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('[WebSocket] Creation failed:', error);
      this.scheduleReconnect();
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('[WebSocket] Sending heartbeat');
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));

        // Set heartbeat timeout detection
        this.heartbeatTimeoutTimer = setTimeout(() => {
          console.log('[WebSocket] Heartbeat timeout, closing connection');
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
    // Message received, reset heartbeat timer
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  handlePong() {
    // Pong received, clear timeout timer
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.log('[WebSocket] Maximum reconnection attempts reached');
      this.emit('maxReconnectAttempts');
      return;
    }

    const delay = Math.min(
      this.options.reconnectInterval *
        Math.pow(this.options.reconnectDecay, this.reconnectAttempts),
      this.options.maxReconnectInterval
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

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

// Usage example
const ws = new RobustWebSocketClient('ws://localhost:8080', {
  heartbeatInterval: 25000,
  reconnect: true,
  maxReconnectAttempts: 10
});

ws.on('open', () => console.log('Connected'));
ws.on('close', () => console.log('Disconnected'));
ws.on('reconnecting', (attempt) => console.log(`Reconnecting... attempt ${attempt}`));
ws.on('message', (data) => console.log('Received message:', data));
```

## Socket.IO Usage

Socket.IO is a WebSocket-based real-time communication library that provides advanced features and better compatibility.

### Server Configuration

```javascript
// Install: npm install socket.io

const { Server } = require('socket.io');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Transport configuration
  transports: ['websocket', 'polling'],
  // Heartbeat configuration
  pingInterval: 25000,
  pingTimeout: 20000,
  // Connection configuration
  connectTimeout: 45000,
  // Allow upgrades
  allowUpgrades: true,
  // Maximum buffer size per message
  maxHttpBufferSize: 1e6
});

// Middleware: Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication failed: missing token'));
  }

  try {
    // Verify token
    const user = verifyToken(token);
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed: invalid token'));
  }
});

// Connection event
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}, socketId: ${socket.id}`);

  // Join user's personal room
  socket.join(`user:${socket.user.id}`);

  // Handle chat messages
  socket.on('chat:message', async (data, callback) => {
    try {
      const { roomId, content } = data;

      // Verify user is in the room
      if (!socket.rooms.has(roomId)) {
        return callback({ success: false, error: 'Not in this room' });
      }

      // Save message to database
      const message = await saveMessage({
        roomId,
        userId: socket.user.id,
        content,
        timestamp: new Date()
      });

      // Broadcast message to room
      io.to(roomId).emit('chat:message', {
        id: message.id,
        userId: socket.user.id,
        username: socket.user.name,
        content,
        timestamp: message.timestamp
      });

      callback({ success: true, messageId: message.id });
    } catch (error) {
      console.error('Message handling error:', error);
      callback({ success: false, error: 'Send failed' });
    }
  });

  // Join room
  socket.on('room:join', async (roomId, callback) => {
    try {
      // Verify room access permission
      const hasAccess = await checkRoomAccess(socket.user.id, roomId);

      if (!hasAccess) {
        return callback({ success: false, error: 'No access to this room' });
      }

      socket.join(roomId);

      // Notify other room members
      socket.to(roomId).emit('room:userJoined', {
        userId: socket.user.id,
        username: socket.user.name
      });

      // Get room information
      const roomInfo = await getRoomInfo(roomId);
      callback({ success: true, room: roomInfo });
    } catch (error) {
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('room:leave', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('room:userLeft', {
      userId: socket.user.id,
      username: socket.user.name
    });
  });

  // Typing status
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

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.user.id}, reason: ${reason}`);

    // Notify all rooms the user was in
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
  console.log('Server running at http://localhost:3000');
});
```

### Client Configuration

```javascript
// Install: npm install socket.io-client

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
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.onConnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      this.onConnectError?.(error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      this.onDisconnect?.(reason);
    });

    // Chat messages
    this.socket.on('chat:message', (message) => {
      this.onMessage?.(message);
    });

    // Room events
    this.socket.on('room:userJoined', (data) => {
      this.onUserJoined?.(data);
    });

    this.socket.on('room:userLeft', (data) => {
      this.onUserLeft?.(data);
    });

    // Typing status
    this.socket.on('typing:update', (data) => {
      this.onTypingUpdate?.(data);
    });
  }

  // Join room
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

  // Leave room
  leaveRoom() {
    if (this.currentRoom) {
      this.socket.emit('room:leave', this.currentRoom);
      this.currentRoom = null;
    }
  }

  // Send message
  sendMessage(content) {
    return new Promise((resolve, reject) => {
      if (!this.currentRoom) {
        return reject(new Error('Not in any room'));
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

  // Start typing
  startTyping() {
    if (this.currentRoom) {
      this.socket.emit('typing:start', this.currentRoom);
    }
  }

  // Stop typing
  stopTyping() {
    if (this.currentRoom) {
      this.socket.emit('typing:stop', this.currentRoom);
    }
  }

  // Disconnect
  disconnect() {
    this.socket.disconnect();
  }
}

// Usage example
const chat = new ChatClient('http://localhost:3000', 'your-auth-token');

chat.onConnect = () => {
  console.log('Connected!');
  chat.joinRoom('room-123').then(room => {
    console.log('Joined room:', room);
  });
};

chat.onMessage = (message) => {
  console.log(`${message.username}: ${message.content}`);
};

chat.onTypingUpdate = ({ username, isTyping }) => {
  if (isTyping) {
    console.log(`${username} is typing...`);
  }
};
```

## Broadcasting and Rooms

### Broadcast Types

```javascript
const { Server } = require('socket.io');
const io = new Server(server);

io.on('connection', (socket) => {

  // 1. Send to current client only
  socket.emit('private', { message: 'Only you receive this' });

  // 2. Broadcast to all other clients (excluding sender)
  socket.broadcast.emit('broadcast', { message: 'Everyone except you receives this' });

  // 3. Broadcast to all clients (including sender)
  io.emit('global', { message: 'Everyone receives this' });

  // 4. Send to specific room (including sender)
  io.to('room-1').emit('room', { message: 'Everyone in room' });

  // 5. Send to specific room (excluding sender)
  socket.to('room-1').emit('room', { message: 'Room members except you' });

  // 6. Send to multiple rooms
  io.to('room-1').to('room-2').emit('rooms', { message: 'Both rooms' });

  // 7. Send to specific socket id
  io.to(socketId).emit('direct', { message: 'Specific user' });

  // 8. Send to all clients except certain rooms
  socket.broadcast.except('room-1').emit('except', { message: 'Except room-1' });
});
```

### Room Management

```javascript
class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> { name, users, createdAt, ... }
  }

  // Create room
  async createRoom(roomId, options = {}) {
    if (this.rooms.has(roomId)) {
      throw new Error('Room already exists');
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

  // Join room
  async joinRoom(socket, roomId, password = null) {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error('Room does not exist');
    }

    if (room.users.size >= room.maxUsers) {
      throw new Error('Room is full');
    }

    if (room.isPrivate && room.password !== password) {
      throw new Error('Incorrect password');
    }

    // Join Socket.IO room
    socket.join(roomId);
    room.users.add(socket.user.id);

    // Notify other room members
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

  // Leave room
  async leaveRoom(socket, roomId) {
    const room = this.rooms.get(roomId);

    if (!room) return;

    socket.leave(roomId);
    room.users.delete(socket.user.id);

    // Notify other room members
    socket.to(roomId).emit('room:userLeft', {
      userId: socket.user.id,
      username: socket.user.name,
      userCount: room.users.size
    });

    // Delete room if empty
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  // Get room information
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

  // Get room user list
  async getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    // Get all sockets in the room
    const sockets = await this.io.in(roomId).fetchSockets();

    return sockets.map(socket => ({
      id: socket.user.id,
      name: socket.user.name,
      socketId: socket.id
    }));
  }

  // Broadcast message to room
  broadcastToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  // Kick user
  async kickUser(roomId, userId) {
    const sockets = await this.io.in(roomId).fetchSockets();
    const targetSocket = sockets.find(s => s.user.id === userId);

    if (targetSocket) {
      targetSocket.leave(roomId);
      targetSocket.emit('room:kicked', { roomId, reason: 'Kicked by admin' });

      const room = this.rooms.get(roomId);
      if (room) {
        room.users.delete(userId);
      }
    }
  }
}

// Usage example
const roomManager = new RoomManager(io);

io.on('connection', (socket) => {
  // Create room
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

  // Join room
  socket.on('room:join', async ({ roomId, password }, callback) => {
    try {
      const result = await roomManager.joinRoom(socket, roomId, password);
      callback({ success: true, ...result });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Leave room
  socket.on('room:leave', async (roomId) => {
    await roomManager.leaveRoom(socket, roomId);
  });

  // Leave all rooms on disconnect
  socket.on('disconnect', async () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        await roomManager.leaveRoom(socket, roomId);
      }
    }
  });
});
```

## Scaling (Clustering)

### Using Redis Adapter

In multi-server environments, use the Redis adapter to synchronize messages:

```javascript
// Install: npm install @socket.io/redis-adapter redis

const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

async function createClusterServer(httpServer) {
  const io = new Server(httpServer);

  // Create Redis clients
  const pubClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  const subClient = pubClient.duplicate();

  // Connect to Redis
  await Promise.all([
    pubClient.connect(),
    subClient.connect()
  ]);

  // Set up Redis adapter
  io.adapter(createAdapter(pubClient, subClient));

  console.log('Socket.IO Redis adapter configured');

  return io;
}

// Usage
const http = require('http');
const server = http.createServer();

createClusterServer(server).then(io => {
  io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Messages now automatically sync across all server instances
    socket.on('chat:message', (data) => {
      io.to(data.roomId).emit('chat:message', data);
    });
  });

  server.listen(3000);
});
```

### Using Redis Streams Adapter

```javascript
// Install: npm install @socket.io/redis-streams-adapter

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

### Horizontal Scaling Architecture

```javascript
// cluster.js - Multi-process deployment
const cluster = require('cluster');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const { setupMaster, setupWorker } = require('@socket.io/sticky');

const numCPUs = require('os').cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);

  // Create HTTP server for sticky sessions
  const httpServer = http.createServer();
  setupMaster(httpServer, {
    loadBalancingMethod: 'least-connection' // or 'round-robin'
  });

  httpServer.listen(3000);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker process ${worker.process.pid} exited`);
    // Auto-restart
    cluster.fork();
  });
} else {
  console.log(`Worker process ${process.pid} started`);

  const httpServer = http.createServer();
  const io = new Server(httpServer);

  // Set up worker
  setupWorker(io);

  // Set up Redis adapter
  (async () => {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));

    io.on('connection', (socket) => {
      console.log(`[Worker ${process.pid}] New connection: ${socket.id}`);

      socket.on('chat:message', (data) => {
        // Messages sync across all workers via Redis
        io.to(data.roomId).emit('chat:message', data);
      });
    });
  })();

  httpServer.listen(0, 'localhost');
}
```

### Load Balancer Configuration (Nginx)

```nginx
# nginx.conf
upstream socketio_nodes {
    ip_hash;  # Ensure same client always connects to same server
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

        # WebSocket timeout configuration
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

## Security Considerations

### Authentication and Authorization

```javascript
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const io = new Server(server);

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token ||
                socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication failed: missing token'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication failed: token expired'));
    }
    return next(new Error('Authentication failed: invalid token'));
  }
});

// Permission check middleware
io.use((socket, next) => {
  // Check if user is banned
  if (socket.user.isBanned) {
    return next(new Error('Account is banned'));
  }
  next();
});

// Event-level permission checks
io.on('connection', (socket) => {
  socket.on('admin:action', async (data, callback) => {
    // Check admin permission
    if (socket.user.role !== 'admin') {
      return callback({ error: 'No permission to perform this action' });
    }

    // Execute admin action
    // ...
  });
});
```

### Input Validation

```javascript
const Joi = require('joi');

// Message validation schema
const messageSchema = Joi.object({
  roomId: Joi.string().required().max(50),
  content: Joi.string().required().min(1).max(5000),
  type: Joi.string().valid('text', 'image', 'file').default('text')
});

// Create validation middleware
function validateEvent(schema) {
  return (data, callback) => {
    const { error, value } = schema.validate(data);

    if (error) {
      return callback({
        success: false,
        error: `Validation failed: ${error.details[0].message}`
      });
    }

    return { validated: value, callback };
  };
}

io.on('connection', (socket) => {
  socket.on('chat:message', (data, callback) => {
    // Validate input
    const { error, value } = messageSchema.validate(data);

    if (error) {
      return callback({
        success: false,
        error: error.details[0].message
      });
    }

    // Use validated data
    processMessage(socket, value, callback);
  });
});

// XSS protection
const sanitizeHtml = require('sanitize-html');

function sanitizeMessage(content) {
  return sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {}
  });
}
```

### Rate Limiting

```javascript
const rateLimit = new Map();

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 60000,    // 1 minute window
  maxRequests: 100,   // Maximum requests
  blockDuration: 300000 // Block for 5 minutes
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

  // Check if blocked
  if (userLimit.blocked) {
    if (now < userLimit.blockedUntil) {
      return false;
    }
    // Block expired, reset
    userLimit.blocked = false;
    userLimit.count = 1;
    userLimit.firstRequest = now;
    return true;
  }

  // Check if within time window
  if (now - userLimit.firstRequest < RATE_LIMIT.windowMs) {
    userLimit.count++;

    if (userLimit.count > RATE_LIMIT.maxRequests) {
      // Trigger block
      userLimit.blocked = true;
      userLimit.blockedUntil = now + RATE_LIMIT.blockDuration;
      return false;
    }
  } else {
    // Reset count
    userLimit.count = 1;
    userLimit.firstRequest = now;
  }

  return true;
}

// Apply rate limiting
io.on('connection', (socket) => {
  socket.use(([event, ...args], next) => {
    if (!checkRateLimit(socket.user.id)) {
      return next(new Error('Too many requests, please try again later'));
    }
    next();
  });
});
```

### CORS and Origin Validation

```javascript
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://example.com',
        'https://www.example.com',
        'https://app.example.com'
      ];

      // Development environment
      if (process.env.NODE_ENV === 'development') {
        allowedOrigins.push('http://localhost:3000');
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Origin validation middleware
io.use((socket, next) => {
  const origin = socket.handshake.headers.origin;

  if (!isValidOrigin(origin)) {
    return next(new Error('Invalid origin'));
  }

  next();
});
```

## Practical Examples

### Complete Chat Application Implementation

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

// MongoDB message model
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

// Online user management
class OnlineUsers {
  constructor() {
    this.users = new Map(); // socketId -> userInfo
    this.userSockets = new Map(); // userId -> Set<socketId>
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

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log(`User ${socket.user.username} connected`);

  // Add to online users
  onlineUsers.addUser(socket.id, socket.user);

  // Broadcast online count
  io.emit('users:online', { count: onlineUsers.getOnlineCount() });

  // Join room
  socket.on('room:join', async (roomId, callback) => {
    try {
      socket.join(roomId);

      // Get message history
      const messages = await Message.find({ roomId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Send system message
      const systemMessage = {
        type: 'system',
        content: `${socket.user.username} joined the chat`,
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

  // Send message
  socket.on('chat:message', async (data, callback) => {
    try {
      const { roomId, content, type = 'text' } = data;

      // Create message
      const message = new Message({
        roomId,
        userId: socket.user.id,
        username: socket.user.username,
        content,
        type
      });

      await message.save();

      // Broadcast message
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

  // Typing indicator
  let typingTimeout;
  socket.on('typing:start', (roomId) => {
    socket.to(roomId).emit('typing:update', {
      userId: socket.user.id,
      username: socket.user.username,
      isTyping: true
    });

    // Auto-stop typing status
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.to(roomId).emit('typing:update', {
        userId: socket.user.id,
        username: socket.user.username,
        isTyping: false
      });
    }, 3000);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = onlineUsers.removeUser(socket.id);
    console.log(`User ${user?.username} disconnected`);

    io.emit('users:online', { count: onlineUsers.getOnlineCount() });
  });
});

server.listen(3000);
```

### Real-time Notification System

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

  // Subscribe to Redis channel for notifications
  setupSubscription() {
    const subscriber = this.redis.duplicate();

    subscriber.subscribe('notifications', (err) => {
      if (err) console.error('Redis subscription failed:', err);
    });

    subscriber.on('message', (channel, message) => {
      if (channel === 'notifications') {
        const notification = JSON.parse(message);
        this.deliverNotification(notification);
      }
    });
  }

  // Register user socket
  registerUser(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
  }

  // Unregister user socket
  unregisterUser(userId, socketId) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  // Send notification
  async sendNotification(userId, notification) {
    const fullNotification = {
      id: this.generateId(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Store in Redis (for offline users)
    await this.redis.lpush(
      `notifications:${userId}`,
      JSON.stringify(fullNotification)
    );
    await this.redis.ltrim(`notifications:${userId}`, 0, 99); // Keep latest 100

    // Publish to Redis channel (for cluster environment)
    await this.redis.publish('notifications', JSON.stringify({
      userId,
      notification: fullNotification
    }));

    return fullNotification;
  }

  // Deliver notification to client
  deliverNotification({ userId, notification }) {
    const sockets = this.userSockets.get(userId);

    if (sockets && sockets.size > 0) {
      // User is online, push directly
      sockets.forEach(socketId => {
        this.io.to(socketId).emit('notification', notification);
      });
    }
  }

  // Get unread notifications
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

  // Mark as read
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

    // Update Redis
    await this.redis.del(`notifications:${userId}`);
    if (updated.length > 0) {
      await this.redis.rpush(`notifications:${userId}`, ...updated);
    }
  }

  generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage example
const redis = new Redis(process.env.REDIS_URL);
const notificationService = new NotificationService(io, redis);

io.on('connection', (socket) => {
  // Register user
  notificationService.registerUser(socket.user.id, socket.id);

  // Get unread notifications
  socket.on('notifications:get', async (callback) => {
    const notifications = await notificationService.getUnreadNotifications(
      socket.user.id
    );
    callback({ notifications });
  });

  // Mark as read
  socket.on('notifications:read', async (notificationId, callback) => {
    await notificationService.markAsRead(socket.user.id, notificationId);
    callback({ success: true });
  });

  socket.on('disconnect', () => {
    notificationService.unregisterUser(socket.user.id, socket.id);
  });
});

// External call to send notification
// await notificationService.sendNotification('user123', {
//   type: 'comment',
//   title: 'New Comment',
//   message: 'Someone commented on your post',
//   data: { articleId: 'xxx', commentId: 'yyy' }
// });
```

## Interview Key Points

### Common Interview Questions

```javascript
/**
 * 1. What are the main differences between WebSocket and HTTP?
 *
 * Key points:
 * - HTTP is stateless, request/response model, new connection for each communication
 * - WebSocket is stateful, full-duplex communication, connection stays open
 * - WebSocket has smaller header overhead (2-14 bytes vs hundreds for HTTP)
 * - WebSocket is ideal for real-time scenarios, HTTP for traditional requests
 */

/**
 * 2. How is a WebSocket connection established?
 *
 * Key points:
 * - Through HTTP upgrade handshake (Upgrade: websocket)
 * - Client sends Sec-WebSocket-Key
 * - Server returns Sec-WebSocket-Accept (SHA1 Base64 of Key + GUID)
 * - Status code 101 indicates successful protocol switch
 */

/**
 * 3. How do you handle WebSocket disconnection and reconnection?
 *
 * Key points:
 * - Listen to close and error events
 * - Implement exponential backoff reconnection strategy
 * - Set maximum reconnection attempts
 * - Restore state on reconnection (rejoin rooms, sync data)
 */

/**
 * 4. How does WebSocket heartbeat mechanism work?
 *
 * Key points:
 * - Use protocol-level Ping/Pong frames
 * - Or use application-level heartbeat messages
 * - Server periodically sends Ping, client responds with Pong
 * - Disconnect if no response within timeout
 */

/**
 * 5. How to use WebSocket in a clustered environment?
 *
 * Key points:
 * - Use Redis adapter to sync messages
 * - Configure sticky sessions (same client connects to same server)
 * - Use load balancer (e.g., Nginx ip_hash)
 * - Cross-server broadcast via Redis Pub/Sub
 */

/**
 * 6. What are WebSocket security concerns and how to prevent them?
 *
 * Key points:
 * - Authentication: Use JWT or session to verify identity
 * - Authorization: Check user permissions
 * - Input validation: Prevent XSS and injection attacks
 * - Rate limiting: Prevent DoS attacks
 * - Use WSS (TLS encryption)
 * - Origin validation
 */
```

### Coding Challenge

```javascript
/**
 * Interview Question: Implement a simple WebSocket server that supports:
 * 1. User authentication
 * 2. Room functionality
 * 3. Message broadcasting
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
          this.send(ws, { error: 'Invalid message' });
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });

    // Heartbeat detection
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
    // Simplified authentication logic
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
    // In real projects, verify JWT here
    return token ? `user_${token.slice(0, 8)}` : null;
  }
}

// Start server
new SimpleWSServer(8080);
```

### Performance Optimization Tips

```javascript
/**
 * WebSocket Performance Optimization Key Points:
 *
 * 1. Message Compression
 *    - Use permessage-deflate extension
 *    - Compress large messages
 *
 * 2. Message Batching
 *    - Combine multiple small messages
 *    - Set send intervals
 *
 * 3. Connection Pool Management
 *    - Limit maximum connections
 *    - Clean up invalid connections promptly
 *
 * 4. Memory Optimization
 *    - Avoid storing large message histories
 *    - Use streaming for large files
 *
 * 5. Load Balancing
 *    - Use sticky sessions
 *    - Configure appropriate connection timeouts
 */

// Message compression configuration
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
    threshold: 1024 // Only compress messages larger than 1KB
  }
});

// Message batching
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

## Further Reading

To deepen your understanding of WebSocket and real-time communication, explore these resources:

### Official Documentation
- [RFC 6455 - The WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [ws Library Documentation](https://github.com/websockets/ws)

### Related Technologies
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Redis Pub/Sub](https://redis.io/docs/interact/pubsub/)
- [MQTT Protocol](https://mqtt.org/) - For IoT applications

### Architecture Patterns
- [Microservices Communication Patterns](https://microservices.io/patterns/communication-style/)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)

## Summary

WebSocket is a core technology for modern real-time applications. This guide covered:

1. **Protocol Fundamentals**: How WebSocket works, handshake process, and frame format
2. **Connection Management**: Heartbeat mechanism, disconnection recovery, state maintenance
3. **Socket.IO**: Using advanced wrapper libraries to simplify development
4. **Rooms and Broadcasting**: Implementing group chat, channels, and other features
5. **Cluster Scaling**: Redis adapter, load balancer configuration
6. **Security Protection**: Authentication, authorization, input validation, rate limiting
7. **Practical Examples**: Complete chat application and notification system implementations

With this knowledge, you can build high-performance, scalable real-time communication applications. In production projects, use mature libraries like Socket.IO to simplify development while paying attention to security and performance optimization.
