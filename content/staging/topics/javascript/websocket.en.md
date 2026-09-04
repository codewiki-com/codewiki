---
title: JavaScript WebSocket Real-time Communication
description: Master WebSocket API for real-time bidirectional communication including connection management and reconnection
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - WebSocket
  - real-time
  - networking
status: imported
origin: old/src/content/docs/javascript/websocket.en.md
divergence: 0.297
issues: []
legacy:
  category: JavaScript
  subcategory: Networking
  order: 27
  lastUpdated: 2026-01-07
---

WebSocket is a communication protocol that provides full-duplex communication channels over a single TCP connection. Unlike HTTP, which follows a request-response pattern, WebSocket enables real-time, bidirectional data exchange between clients and servers.

## Introduction to WebSocket

The WebSocket API allows web applications to maintain persistent connections with servers, enabling real-time data streaming without the overhead of repeated HTTP requests.

### What is WebSocket?

WebSocket is a protocol that:

- Provides **full-duplex communication** - both client and server can send messages independently
- Maintains a **persistent connection** - no need to repeatedly establish connections
- Has **low latency** - eliminates HTTP request/response overhead
- Uses a **lightweight frame format** - minimal header overhead (2-14 bytes)
- Supports **cross-origin communication** natively

### When to Use WebSocket

WebSocket is ideal for applications requiring real-time updates:

```javascript
// Suitable use cases for WebSocket:
// 1. Chat applications (instant messaging, customer support)
// 2. Live notifications (social media, email alerts)
// 3. Collaborative tools (real-time document editing, whiteboards)
// 4. Online gaming (multiplayer games, real-time leaderboards)
// 5. Financial applications (stock tickers, cryptocurrency prices)
// 6. IoT dashboards (sensor data, device monitoring)
// 7. Live streaming (comments, reactions, viewer counts)
```

### WebSocket vs HTTP Polling

Understanding when to use WebSocket versus HTTP polling is crucial.

```javascript
// HTTP Polling - Client repeatedly requests updates
function httpPolling() {
  setInterval(async () => {
    const response = await fetch('/api/updates');
    const data = await response.json();
    handleUpdate(data);
  }, 3000); // Poll every 3 seconds
}

// Problems with polling:
// - High latency (up to polling interval)
// - Wasted requests when no updates
// - Server load from frequent connections
// - Inefficient bandwidth usage

// WebSocket - Persistent bidirectional connection
const ws = new WebSocket('wss://example.com/socket');

ws.onmessage = (event) => {
  handleUpdate(JSON.parse(event.data));
};

// Advantages of WebSocket:
// - Instant updates (low latency)
// - No wasted requests
// - Reduced server load
// - Efficient bandwidth usage
```

## Creating a WebSocket Connection

The WebSocket API is built into modern browsers and provides a straightforward way to establish connections.

### Basic Connection

```javascript
// Create a WebSocket connection
const ws = new WebSocket('wss://example.com/socket');

// Connection opened
ws.onopen = function(event) {
  console.log('Connection established');
  ws.send('Hello Server!');
};

// Receive messages
ws.onmessage = function(event) {
  console.log('Message received:', event.data);
};

// Connection closed
ws.onclose = function(event) {
  console.log('Connection closed:', event.code, event.reason);
};

// Handle errors
ws.onerror = function(error) {
  console.error('WebSocket error:', error);
};
```

### WebSocket Constructor

```javascript
// Basic constructor
const ws = new WebSocket(url);

// Constructor with subprotocol
const ws = new WebSocket(url, 'chat-protocol');

// Constructor with multiple subprotocols
const ws = new WebSocket(url, ['chat', 'notifications']);

// URL schemes:
// ws://  - Unencrypted WebSocket (port 80)
// wss:// - Encrypted WebSocket over TLS (port 443)

// Examples
const secureWs = new WebSocket('wss://api.example.com/socket');
const localWs = new WebSocket('ws://localhost:8080/socket');
const withPath = new WebSocket('wss://example.com/v1/chat?token=abc123');
```

### Connection States

The WebSocket object has a `readyState` property indicating its current state.

```javascript
const ws = new WebSocket('wss://example.com/socket');

// Check connection state
console.log(ws.readyState);

// WebSocket.CONNECTING (0) - Connection is being established
// WebSocket.OPEN (1)       - Connection is open and ready
// WebSocket.CLOSING (2)    - Connection is closing
// WebSocket.CLOSED (3)     - Connection is closed

// Helper function to check state
function isConnected(ws) {
  return ws.readyState === WebSocket.OPEN;
}

// Wait for connection before sending
function sendWhenReady(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message);
  } else if (ws.readyState === WebSocket.CONNECTING) {
    ws.addEventListener('open', () => {
      ws.send(message);
    }, { once: true });
  } else {
    console.error('WebSocket is not available');
  }
}
```

## Sending and Receiving Messages

WebSocket supports sending various data types including strings, binary data, and JSON.

### Sending Messages

```javascript
const ws = new WebSocket('wss://example.com/socket');

ws.onopen = function() {
  // Send a text string
  ws.send('Hello, World!');

  // Send JSON data
  const data = { type: 'message', content: 'Hello' };
  ws.send(JSON.stringify(data));

  // Send binary data (ArrayBuffer)
  const buffer = new ArrayBuffer(8);
  const view = new Uint8Array(buffer);
  view.set([1, 2, 3, 4, 5, 6, 7, 8]);
  ws.send(buffer);

  // Send Blob data
  const blob = new Blob(['Hello Blob'], { type: 'text/plain' });
  ws.send(blob);
};
```

### Receiving Messages

```javascript
const ws = new WebSocket('wss://example.com/socket');

// Set binary type for incoming binary data
ws.binaryType = 'arraybuffer'; // or 'blob'

ws.onmessage = function(event) {
  // Check data type
  if (typeof event.data === 'string') {
    // Text message
    console.log('Text message:', event.data);

    // Try parsing as JSON
    try {
      const json = JSON.parse(event.data);
      handleJsonMessage(json);
    } catch (e) {
      handleTextMessage(event.data);
    }
  } else if (event.data instanceof ArrayBuffer) {
    // Binary message as ArrayBuffer
    const view = new Uint8Array(event.data);
    console.log('Binary data:', view);
  } else if (event.data instanceof Blob) {
    // Binary message as Blob
    event.data.text().then(text => {
      console.log('Blob text:', text);
    });
  }
};

function handleJsonMessage(data) {
  switch (data.type) {
    case 'message':
      console.log('Chat message:', data.content);
      break;
    case 'notification':
      console.log('Notification:', data.title);
      break;
    default:
      console.log('Unknown message type:', data);
  }
}
```

### Buffered Amount

Monitor the amount of data queued for sending.

```javascript
const ws = new WebSocket('wss://example.com/socket');

// Check buffered amount before sending large data
function sendWithBackpressure(data) {
  const maxBufferSize = 1024 * 1024; // 1MB

  if (ws.bufferedAmount > maxBufferSize) {
    console.warn('Buffer full, waiting...');
    setTimeout(() => sendWithBackpressure(data), 100);
    return;
  }

  ws.send(data);
}

// Monitor buffer status
function monitorBuffer() {
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('Buffered amount:', ws.bufferedAmount, 'bytes');
    }
  }, 1000);
}
```

## WebSocket Events

The WebSocket API provides four main events for handling connection lifecycle and data transfer.

### Event Handlers

```javascript
const ws = new WebSocket('wss://example.com/socket');

// Method 1: Using event handler properties
ws.onopen = function(event) {
  console.log('Connected');
};

ws.onmessage = function(event) {
  console.log('Received:', event.data);
};

ws.onclose = function(event) {
  console.log('Closed:', event.code, event.reason);
};

ws.onerror = function(event) {
  console.error('Error occurred');
};

// Method 2: Using addEventListener
ws.addEventListener('open', function(event) {
  console.log('Connected');
});

ws.addEventListener('message', function(event) {
  console.log('Received:', event.data);
});

ws.addEventListener('close', function(event) {
  console.log('Closed:', event.code, event.reason);
});

ws.addEventListener('error', function(event) {
  console.error('Error occurred');
});
```

### Close Event Details

The close event provides information about why the connection was closed.

```javascript
ws.onclose = function(event) {
  console.log('Close event details:');
  console.log('Code:', event.code);       // Numeric close code
  console.log('Reason:', event.reason);   // String explanation
  console.log('Was clean:', event.wasClean); // Boolean

  // Handle different close codes
  switch (event.code) {
    case 1000:
      console.log('Normal closure');
      break;
    case 1001:
      console.log('Going away (page closing/server shutdown)');
      break;
    case 1002:
      console.log('Protocol error');
      break;
    case 1003:
      console.log('Unsupported data type');
      break;
    case 1006:
      console.log('Abnormal closure (no close frame)');
      break;
    case 1007:
      console.log('Invalid frame payload data');
      break;
    case 1008:
      console.log('Policy violation');
      break;
    case 1009:
      console.log('Message too big');
      break;
    case 1010:
      console.log('Missing extension');
      break;
    case 1011:
      console.log('Internal server error');
      break;
    case 1015:
      console.log('TLS handshake failure');
      break;
    default:
      if (event.code >= 4000 && event.code < 5000) {
        console.log('Application-specific close code');
      }
  }
};
```

### Common Close Codes

```javascript
// Standard WebSocket close codes
const CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,        // Normal closure
  GOING_AWAY: 1001,            // Endpoint leaving (browser tab closed)
  PROTOCOL_ERROR: 1002,        // Protocol error
  UNSUPPORTED_DATA: 1003,      // Received unsupported data type
  NO_STATUS_RECEIVED: 1005,    // No status code provided
  ABNORMAL_CLOSURE: 1006,      // Connection closed abnormally
  INVALID_PAYLOAD: 1007,       // Invalid frame payload
  POLICY_VIOLATION: 1008,      // Policy violation
  MESSAGE_TOO_BIG: 1009,       // Message too large
  MANDATORY_EXTENSION: 1010,   // Required extension not negotiated
  INTERNAL_ERROR: 1011,        // Internal server error
  TLS_HANDSHAKE_FAILURE: 1015  // TLS handshake failure
};

// Custom application codes (4000-4999)
const APP_CLOSE_CODES = {
  AUTHENTICATION_FAILED: 4001,
  SESSION_EXPIRED: 4002,
  RATE_LIMITED: 4003,
  INVALID_MESSAGE: 4004,
  SERVER_MAINTENANCE: 4005
};
```

## Closing Connections

Properly closing WebSocket connections is important for resource management.

### Closing a Connection

```javascript
const ws = new WebSocket('wss://example.com/socket');

ws.onopen = function() {
  console.log('Connected');

  // Close after 5 seconds
  setTimeout(() => {
    // Close with optional code and reason
    ws.close(1000, 'Work complete');
  }, 5000);
};

ws.onclose = function(event) {
  if (event.wasClean) {
    console.log('Clean close:', event.code, event.reason);
  } else {
    console.log('Connection died unexpectedly');
  }
};
```

### Graceful Shutdown

```javascript
class WebSocketConnection {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.isClosing = false;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => console.log('Connected');
    this.ws.onclose = (event) => this.handleClose(event);
    this.ws.onerror = (error) => console.error('Error:', error);
  }

  handleClose(event) {
    if (this.isClosing) {
      console.log('Intentional close completed');
    } else {
      console.log('Unexpected close, may attempt reconnect');
    }
  }

  close(code = 1000, reason = 'Client closing') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.isClosing = true;
      this.ws.close(code, reason);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }
}
```

## Heartbeat Mechanism

Heartbeats keep connections alive and detect dead connections.

### Client-Side Heartbeat

```javascript
class HeartbeatWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.pingInterval = options.pingInterval || 30000; // 30 seconds
    this.pongTimeout = options.pongTimeout || 5000;    // 5 seconds
    this.ws = null;
    this.pingTimer = null;
    this.pongTimer = null;
    this.handlers = new Map();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Connected, starting heartbeat');
      this.startHeartbeat();
      this.emit('open');
    };

    this.ws.onmessage = (event) => {
      // Reset pong timer on any message
      this.resetPongTimer();

      try {
        const data = JSON.parse(event.data);

        // Handle pong response
        if (data.type === 'pong') {
          console.log('Pong received');
          return;
        }

        this.emit('message', data);
      } catch (e) {
        this.emit('message', event.data);
      }
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      this.emit('close', event);
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  startHeartbeat() {
    this.pingTimer = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        console.log('Sending ping');
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));

        // Start pong timeout
        this.pongTimer = setTimeout(() => {
          console.log('Pong timeout, closing connection');
          this.ws.close(4000, 'Heartbeat timeout');
        }, this.pongTimeout);
      }
    }, this.pingInterval);
  }

  stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.resetPongTimer();
  }

  resetPongTimer() {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  close(code, reason) {
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
  }

  emit(event, data) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

// Usage
const ws = new HeartbeatWebSocket('wss://example.com/socket', {
  pingInterval: 25000,
  pongTimeout: 5000
});

ws.on('open', () => console.log('Connected'));
ws.on('message', (data) => console.log('Message:', data));
ws.on('close', (event) => console.log('Closed:', event.code));

ws.connect();
```

### Server-Side Heartbeat Handling

```javascript
// Server should respond to ping with pong
// Example Node.js with ws library
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.isAlive = true;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'ping') {
        // Respond with pong
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
        return;
      }

      // Handle other messages
      handleMessage(ws, message);
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  // Protocol-level ping/pong
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// Server-initiated heartbeat check
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping(); // Protocol-level ping
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});
```

## Automatic Reconnection

Implementing robust reconnection logic is essential for production applications.

### Basic Reconnection

```javascript
class ReconnectingWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      maxReconnectAttempts: 10,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      ...options
    };

    this.ws = null;
    this.reconnectAttempts = 0;
    this.forceClosed = false;
    this.handlers = new Map();
    this.messageQueue = [];
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Connected');
      this.reconnectAttempts = 0;

      // Send queued messages
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.send(message);
      }

      this.emit('open');
    };

    this.ws.onmessage = (event) => {
      this.emit('message', event);
    };

    this.ws.onclose = (event) => {
      this.emit('close', event);

      if (!this.forceClosed && !event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.options.reconnectInterval *
        Math.pow(this.options.reconnectDecay, this.reconnectAttempts),
      this.options.maxReconnectInterval
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnecting', this.reconnectAttempts);
      this.connect();
    }, delay);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }

    // Queue message for later
    this.messageQueue.push(data);
    return false;
  }

  close(code = 1000, reason = '') {
    this.forceClosed = true;
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

  off(event, handler) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
    return this;
  }

  emit(event, data) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  get state() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  get isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Usage
const ws = new ReconnectingWebSocket('wss://example.com/socket', {
  maxReconnectAttempts: 5,
  reconnectInterval: 2000
});

ws.on('open', () => console.log('Connected'));
ws.on('message', (event) => console.log('Message:', event.data));
ws.on('close', (event) => console.log('Closed:', event.code));
ws.on('reconnecting', (attempt) => console.log(`Reconnecting... attempt ${attempt}`));
ws.on('maxReconnectAttemptsReached', () => console.log('Could not reconnect'));

ws.connect();
```

### Advanced Reconnection with Jitter

```javascript
class RobustWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      maxReconnectAttempts: Infinity,
      baseReconnectInterval: 1000,
      maxReconnectInterval: 30000,
      jitterFactor: 0.3,           // Add randomness to prevent thundering herd
      connectionTimeout: 10000,     // Timeout for connection attempts
      ...options
    };

    this.ws = null;
    this.reconnectAttempts = 0;
    this.forceClosed = false;
    this.connectionTimeoutId = null;
    this.handlers = new Map();
  }

  connect() {
    if (this.forceClosed) return;

    this.ws = new WebSocket(this.url);

    // Set connection timeout
    this.connectionTimeoutId = setTimeout(() => {
      if (this.ws.readyState === WebSocket.CONNECTING) {
        console.log('Connection timeout');
        this.ws.close();
      }
    }, this.options.connectionTimeout);

    this.ws.onopen = () => {
      clearTimeout(this.connectionTimeoutId);
      this.reconnectAttempts = 0;
      this.emit('open');
    };

    this.ws.onclose = (event) => {
      clearTimeout(this.connectionTimeoutId);
      this.emit('close', event);

      if (!this.forceClosed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onmessage = (event) => this.emit('message', event);
    this.ws.onerror = (error) => this.emit('error', error);
  }

  calculateReconnectDelay() {
    // Exponential backoff
    let delay = this.options.baseReconnectInterval *
      Math.pow(2, this.reconnectAttempts);

    // Cap at maximum
    delay = Math.min(delay, this.options.maxReconnectInterval);

    // Add jitter to prevent synchronized reconnection attempts
    const jitter = delay * this.options.jitterFactor * (Math.random() * 2 - 1);
    delay = Math.max(0, delay + jitter);

    return Math.floor(delay);
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    const delay = this.calculateReconnectDelay();
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
      this.connect();
    }, delay);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }

  close() {
    this.forceClosed = true;
    clearTimeout(this.connectionTimeoutId);
    if (this.ws) {
      this.ws.close(1000, 'Client closed');
    }
  }

  // Reset and reconnect
  reconnect() {
    this.forceClosed = false;
    this.reconnectAttempts = 0;
    if (this.ws) {
      this.ws.close();
    }
    this.connect();
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
    return this;
  }

  emit(event, data) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}
```

## Message Queuing

Handle messages when the connection is temporarily unavailable.

### Message Queue Implementation

```javascript
class QueuedWebSocket {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.messageQueue = [];
    this.maxQueueSize = 100;
    this.handlers = new Map();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Connected, flushing message queue');
      this.flushQueue();
      this.emit('open');
    };

    this.ws.onclose = (event) => {
      this.emit('close', event);
    };

    this.ws.onmessage = (event) => {
      this.emit('message', event);
    };
  }

  send(data, options = {}) {
    const message = {
      data,
      timestamp: Date.now(),
      priority: options.priority || 'normal',
      ttl: options.ttl || 60000  // Time to live: 60 seconds
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }

    // Queue the message
    if (this.messageQueue.length >= this.maxQueueSize) {
      // Remove oldest low-priority message
      const oldestLowPriority = this.messageQueue.findIndex(
        m => m.priority === 'low'
      );
      if (oldestLowPriority !== -1) {
        this.messageQueue.splice(oldestLowPriority, 1);
      } else {
        // Remove oldest message
        this.messageQueue.shift();
      }
    }

    this.messageQueue.push(message);
    console.log(`Message queued. Queue size: ${this.messageQueue.length}`);
    return false;
  }

  flushQueue() {
    const now = Date.now();

    // Sort by priority (high first)
    this.messageQueue.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return a.timestamp - b.timestamp;
    });

    // Send valid messages
    const validMessages = this.messageQueue.filter(
      m => now - m.timestamp < m.ttl
    );

    validMessages.forEach(message => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          typeof message.data === 'string'
            ? message.data
            : JSON.stringify(message.data)
        );
      }
    });

    // Clear queue
    this.messageQueue = [];
    console.log(`Flushed ${validMessages.length} messages`);
  }

  getQueueSize() {
    return this.messageQueue.length;
  }

  clearQueue() {
    this.messageQueue = [];
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

// Usage
const ws = new QueuedWebSocket('wss://example.com/socket');

ws.on('open', () => console.log('Connected'));
ws.connect();

// These messages will be queued if not connected
ws.send({ type: 'message', content: 'Hello' });
ws.send({ type: 'urgent', content: 'Important!' }, { priority: 'high' });
```

## Binary Data Handling

WebSocket efficiently handles binary data for applications like file transfer, gaming, and streaming.

### Sending Binary Data

```javascript
const ws = new WebSocket('wss://example.com/socket');

ws.onopen = function() {
  // Send ArrayBuffer
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, 42);
  view.setFloat64(4, 3.14159);
  ws.send(buffer);

  // Send TypedArray
  const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
  ws.send(uint8Array.buffer);

  // Send Blob
  const blob = new Blob(['Binary content'], { type: 'application/octet-stream' });
  ws.send(blob);
};
```

### Receiving Binary Data

```javascript
const ws = new WebSocket('wss://example.com/socket');

// Set binary type before receiving
ws.binaryType = 'arraybuffer'; // or 'blob'

ws.onmessage = function(event) {
  if (event.data instanceof ArrayBuffer) {
    // Process ArrayBuffer
    const view = new DataView(event.data);
    const messageType = view.getUint8(0);

    switch (messageType) {
      case 1: // Integer data
        const intValue = view.getInt32(1);
        console.log('Integer:', intValue);
        break;
      case 2: // Float data
        const floatValue = view.getFloat64(1);
        console.log('Float:', floatValue);
        break;
      case 3: // Binary payload
        const payload = new Uint8Array(event.data, 1);
        console.log('Payload:', payload);
        break;
    }
  }
};
```

### Binary Protocol Example

```javascript
// Define a simple binary protocol
class BinaryProtocol {
  static TYPES = {
    PING: 1,
    PONG: 2,
    MESSAGE: 3,
    FILE_CHUNK: 4
  };

  static encode(type, data) {
    let payload;

    if (typeof data === 'string') {
      payload = new TextEncoder().encode(data);
    } else if (data instanceof Uint8Array) {
      payload = data;
    } else {
      payload = new TextEncoder().encode(JSON.stringify(data));
    }

    // Format: [type (1 byte)] [length (4 bytes)] [payload]
    const buffer = new ArrayBuffer(5 + payload.length);
    const view = new DataView(buffer);

    view.setUint8(0, type);
    view.setUint32(1, payload.length);

    const payloadView = new Uint8Array(buffer, 5);
    payloadView.set(payload);

    return buffer;
  }

  static decode(buffer) {
    const view = new DataView(buffer);

    const type = view.getUint8(0);
    const length = view.getUint32(1);
    const payload = new Uint8Array(buffer, 5, length);

    return {
      type,
      payload: new TextDecoder().decode(payload)
    };
  }
}

// Usage
const ws = new WebSocket('wss://example.com/socket');
ws.binaryType = 'arraybuffer';

ws.onopen = function() {
  // Send binary message
  const message = BinaryProtocol.encode(
    BinaryProtocol.TYPES.MESSAGE,
    { text: 'Hello, binary!' }
  );
  ws.send(message);
};

ws.onmessage = function(event) {
  const decoded = BinaryProtocol.decode(event.data);
  console.log('Type:', decoded.type);
  console.log('Payload:', JSON.parse(decoded.payload));
};
```

### File Transfer

```javascript
class FileTransfer {
  constructor(ws) {
    this.ws = ws;
    this.chunkSize = 64 * 1024; // 64KB chunks
    this.transfers = new Map();
  }

  async sendFile(file) {
    const transferId = this.generateId();
    const totalChunks = Math.ceil(file.size / this.chunkSize);

    // Send file metadata
    this.ws.send(JSON.stringify({
      type: 'file_start',
      transferId,
      filename: file.name,
      size: file.size,
      totalChunks,
      mimeType: file.type
    }));

    // Send chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, file.size);
      const chunk = file.slice(start, end);
      const arrayBuffer = await chunk.arrayBuffer();

      // Create chunk message
      const header = new ArrayBuffer(12);
      const headerView = new DataView(header);
      headerView.setUint32(0, 4); // File chunk type
      headerView.setUint32(4, i); // Chunk index
      // Transfer ID encoded in remaining bytes

      // Combine header and chunk
      const message = new Uint8Array(header.byteLength + arrayBuffer.byteLength);
      message.set(new Uint8Array(header), 0);
      message.set(new Uint8Array(arrayBuffer), header.byteLength);

      this.ws.send(message.buffer);

      // Report progress
      const progress = ((i + 1) / totalChunks) * 100;
      this.onProgress?.(progress);
    }

    // Send completion message
    this.ws.send(JSON.stringify({
      type: 'file_complete',
      transferId
    }));
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }
}

// Usage
const ws = new WebSocket('wss://example.com/socket');
const fileTransfer = new FileTransfer(ws);

fileTransfer.onProgress = (progress) => {
  console.log(`Upload progress: ${progress.toFixed(2)}%`);
};

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await fileTransfer.sendFile(file);
    console.log('File sent successfully');
  }
});
```

## Authentication and Security

Secure WebSocket connections require proper authentication and security measures.

### Token-Based Authentication

```javascript
// Method 1: Token in URL query parameter
const token = getAuthToken();
const ws = new WebSocket(`wss://example.com/socket?token=${token}`);

// Method 2: Send token after connection
const ws = new WebSocket('wss://example.com/socket');

ws.onopen = function() {
  // Send authentication message
  ws.send(JSON.stringify({
    type: 'auth',
    token: getAuthToken()
  }));
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);

  if (data.type === 'auth_result') {
    if (data.success) {
      console.log('Authentication successful');
      startApplication();
    } else {
      console.error('Authentication failed:', data.error);
      ws.close(4001, 'Authentication failed');
    }
  }
};
```

### Secure WebSocket Client

```javascript
class SecureWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.getToken = options.getToken;
    this.onTokenExpired = options.onTokenExpired;
    this.ws = null;
    this.authenticated = false;
    this.handlers = new Map();
    this.pendingMessages = [];
  }

  async connect() {
    // Ensure HTTPS/WSS
    if (!this.url.startsWith('wss://') && !this.url.includes('localhost')) {
      throw new Error('WebSocket must use secure connection (wss://)');
    }

    const token = await this.getToken();
    this.ws = new WebSocket(`${this.url}?token=${encodeURIComponent(token)}`);

    this.ws.onopen = () => {
      console.log('Connection opened, awaiting authentication');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle authentication response
      if (data.type === 'authenticated') {
        this.authenticated = true;
        console.log('Authenticated successfully');
        this.flushPendingMessages();
        this.emit('authenticated');
        return;
      }

      // Handle token expiration
      if (data.type === 'token_expired') {
        this.handleTokenExpired();
        return;
      }

      // Handle unauthorized
      if (data.type === 'unauthorized') {
        console.error('Unauthorized:', data.message);
        this.ws.close(4001, 'Unauthorized');
        return;
      }

      this.emit('message', data);
    };

    this.ws.onclose = (event) => {
      this.authenticated = false;
      this.emit('close', event);
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  async handleTokenExpired() {
    console.log('Token expired, refreshing...');
    this.authenticated = false;

    if (this.onTokenExpired) {
      const newToken = await this.onTokenExpired();
      if (newToken) {
        this.ws.send(JSON.stringify({
          type: 'refresh_token',
          token: newToken
        }));
      }
    }
  }

  send(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);

    if (this.authenticated && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      return true;
    }

    // Queue message until authenticated
    this.pendingMessages.push(message);
    return false;
  }

  flushPendingMessages() {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      this.ws.send(message);
    }
  }

  close() {
    if (this.ws) {
      this.ws.close(1000, 'Client closing');
    }
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

// Usage
const ws = new SecureWebSocket('wss://api.example.com/socket', {
  getToken: async () => {
    return localStorage.getItem('authToken');
  },
  onTokenExpired: async () => {
    // Refresh the token
    const response = await fetch('/api/refresh-token', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    return data.token;
  }
});

ws.on('authenticated', () => {
  console.log('Ready to use WebSocket');
});

ws.connect();
```

### Security Best Practices

```javascript
// 1. Always use WSS (WebSocket Secure)
const ws = new WebSocket('wss://example.com/socket');

// 2. Validate origin on server side
// Server should check Origin header

// 3. Implement rate limiting
class RateLimitedWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.messagesPerSecond = options.messagesPerSecond || 10;
    this.messageTimestamps = [];
    this.ws = null;
  }

  connect() {
    this.ws = new WebSocket(this.url);
  }

  send(data) {
    const now = Date.now();

    // Remove timestamps older than 1 second
    this.messageTimestamps = this.messageTimestamps.filter(
      ts => now - ts < 1000
    );

    // Check rate limit
    if (this.messageTimestamps.length >= this.messagesPerSecond) {
      console.warn('Rate limit exceeded');
      return false;
    }

    this.messageTimestamps.push(now);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }
}

// 4. Sanitize incoming data
function sanitizeMessage(data) {
  // Parse and validate structure
  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch (e) {
    throw new Error('Invalid JSON');
  }

  // Validate expected fields
  if (typeof parsed.type !== 'string') {
    throw new Error('Missing message type');
  }

  // Sanitize string content (remove potential XSS)
  if (typeof parsed.content === 'string') {
    parsed.content = parsed.content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return parsed;
}

// 5. Implement connection limits
// Server should limit connections per IP/user
```

## Subprotocols

WebSocket subprotocols allow clients and servers to agree on a message format.

### Using Subprotocols

```javascript
// Request specific subprotocol
const ws = new WebSocket('wss://example.com/socket', 'json');

// Request multiple subprotocols (server chooses one)
const ws = new WebSocket('wss://example.com/socket', ['json', 'protobuf', 'msgpack']);

ws.onopen = function() {
  // Check which protocol was selected
  console.log('Selected protocol:', ws.protocol);

  // Send message using the selected protocol
  if (ws.protocol === 'json') {
    ws.send(JSON.stringify({ type: 'hello' }));
  } else if (ws.protocol === 'msgpack') {
    // Use MessagePack encoding
    ws.send(msgpack.encode({ type: 'hello' }));
  }
};
```

### Custom Protocol Handler

```javascript
class ProtocolWebSocket {
  constructor(url, protocols) {
    this.protocols = protocols;
    this.ws = new WebSocket(url, Object.keys(protocols));
    this.selectedProtocol = null;

    this.ws.onopen = () => {
      this.selectedProtocol = this.protocols[this.ws.protocol];
      if (!this.selectedProtocol) {
        console.error('Server selected unsupported protocol');
        this.ws.close(1002, 'Unsupported protocol');
        return;
      }
      console.log('Using protocol:', this.ws.protocol);
      this.onopen?.();
    };

    this.ws.onmessage = (event) => {
      const decoded = this.selectedProtocol.decode(event.data);
      this.onmessage?.(decoded);
    };
  }

  send(data) {
    if (this.selectedProtocol && this.ws.readyState === WebSocket.OPEN) {
      const encoded = this.selectedProtocol.encode(data);
      this.ws.send(encoded);
    }
  }
}

// Define protocol handlers
const protocols = {
  'json': {
    encode: (data) => JSON.stringify(data),
    decode: (data) => JSON.parse(data)
  },
  'csv': {
    encode: (data) => Object.values(data).join(','),
    decode: (data) => data.split(',')
  }
};

// Usage
const ws = new ProtocolWebSocket('wss://example.com/socket', protocols);
ws.onopen = () => console.log('Connected');
ws.onmessage = (data) => console.log('Received:', data);
ws.send({ type: 'message', content: 'Hello' });
```

## WebSocket with Frameworks

Integrating WebSocket with popular frameworks.

### React Hook

```javascript
import { useState, useEffect, useCallback, useRef } from 'react';

function useWebSocket(url, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const {
    reconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
    onOpen,
    onClose,
    onMessage,
    onError
  } = options;

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = (event) => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onOpen?.(event);
      };

      wsRef.current.onmessage = (event) => {
        const data = event.data;
        setLastMessage(data);
        onMessage?.(data);
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        onClose?.(event);

        // Attempt reconnection
        if (reconnect && !event.wasClean &&
            reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (event) => {
        setError(event);
        onError?.(event);
      };
    } catch (err) {
      setError(err);
    }
  }, [url, reconnect, maxReconnectAttempts, reconnectInterval,
      onOpen, onClose, onMessage, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        typeof message === 'string' ? message : JSON.stringify(message)
      );
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect
  };
}

// Usage in component
function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const { isConnected, lastMessage, sendMessage } = useWebSocket(
    'wss://example.com/chat',
    {
      onMessage: (data) => {
        const message = JSON.parse(data);
        setMessages(prev => [...prev, message]);
      }
    }
  );

  const handleSend = () => {
    if (input.trim()) {
      sendMessage({ type: 'chat', content: input });
      setInput('');
    }
  };

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg.content}</div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend} disabled={!isConnected}>
        Send
      </button>
    </div>
  );
}
```

### Vue Composable

```javascript
import { ref, onMounted, onUnmounted, computed } from 'vue';

export function useWebSocket(url, options = {}) {
  const ws = ref(null);
  const isConnected = ref(false);
  const lastMessage = ref(null);
  const error = ref(null);
  const messageQueue = ref([]);

  const {
    autoConnect = true,
    reconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 3000
  } = options;

  let reconnectAttempts = 0;
  let reconnectTimeout = null;

  function connect() {
    ws.value = new WebSocket(url);

    ws.value.onopen = () => {
      isConnected.value = true;
      error.value = null;
      reconnectAttempts = 0;

      // Send queued messages
      while (messageQueue.value.length > 0) {
        const msg = messageQueue.value.shift();
        ws.value.send(msg);
      }
    };

    ws.value.onmessage = (event) => {
      lastMessage.value = event.data;
    };

    ws.value.onclose = (event) => {
      isConnected.value = false;

      if (reconnect && !event.wasClean &&
          reconnectAttempts < maxReconnectAttempts) {
        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++;
          connect();
        }, reconnectInterval);
      }
    };

    ws.value.onerror = (event) => {
      error.value = event;
    };
  }

  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    if (ws.value) {
      ws.value.close(1000);
    }
  }

  function send(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);

    if (isConnected.value) {
      ws.value.send(message);
      return true;
    }

    // Queue message
    messageQueue.value.push(message);
    return false;
  }

  onMounted(() => {
    if (autoConnect) {
      connect();
    }
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected: computed(() => isConnected.value),
    lastMessage: computed(() => lastMessage.value),
    error: computed(() => error.value),
    send,
    connect,
    disconnect
  };
}

// Usage in component
// <script setup>
// import { watch } from 'vue';
// import { useWebSocket } from './useWebSocket';
//
// const { isConnected, lastMessage, send } = useWebSocket('wss://example.com/socket');
//
// watch(lastMessage, (message) => {
//   console.log('New message:', message);
// });
//
// function sendMessage() {
//   send({ type: 'chat', content: 'Hello!' });
// }
// </script>
```

## Complete Example: Chat Application

A full-featured chat application demonstrating WebSocket concepts.

### Chat Client

```javascript
class ChatClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.ws = null;
    this.userId = null;
    this.username = null;
    this.currentRoom = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.handlers = new Map();
    this.messageQueue = [];
    this.pingInterval = null;
  }

  async connect(username) {
    this.username = username;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('Connected to chat server');
        this.reconnectAttempts = 0;

        // Authenticate
        this.send({
          type: 'auth',
          username: this.username
        });

        // Start heartbeat
        this.startHeartbeat();

        // Flush queued messages
        this.flushMessageQueue();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data, resolve, reject);
      };

      this.ws.onclose = (event) => {
        console.log('Disconnected:', event.code, event.reason);
        this.stopHeartbeat();
        this.emit('disconnected', event);

        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  handleMessage(data, resolveConnect, rejectConnect) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'auth_success':
          this.userId = message.userId;
          console.log('Authenticated as:', this.username);
          this.emit('authenticated', { userId: this.userId });
          resolveConnect?.({ userId: this.userId });
          break;

        case 'auth_error':
          console.error('Authentication failed:', message.error);
          this.emit('authError', message.error);
          rejectConnect?.(new Error(message.error));
          break;

        case 'room_joined':
          this.currentRoom = message.roomId;
          this.emit('roomJoined', message);
          break;

        case 'room_left':
          this.currentRoom = null;
          this.emit('roomLeft', message);
          break;

        case 'chat_message':
          this.emit('message', message);
          break;

        case 'user_joined':
          this.emit('userJoined', message);
          break;

        case 'user_left':
          this.emit('userLeft', message);
          break;

        case 'typing':
          this.emit('typing', message);
          break;

        case 'room_users':
          this.emit('roomUsers', message.users);
          break;

        case 'error':
          this.emit('error', message.error);
          break;

        case 'pong':
          // Heartbeat response
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }

  startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Reconnecting in ${delay}ms...`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnecting', this.reconnectAttempts);
      this.connect(this.username);
    }, delay);
  }

  send(data) {
    const message = JSON.stringify(data);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      return true;
    }

    // Queue important messages
    if (data.type !== 'ping') {
      this.messageQueue.push(message);
    }
    return false;
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0 &&
           this.ws &&
           this.ws.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }

  // Room operations
  joinRoom(roomId) {
    return this.send({
      type: 'join_room',
      roomId
    });
  }

  leaveRoom() {
    if (this.currentRoom) {
      this.send({
        type: 'leave_room',
        roomId: this.currentRoom
      });
    }
  }

  // Messaging
  sendMessage(content) {
    if (!this.currentRoom) {
      console.error('Not in a room');
      return false;
    }

    return this.send({
      type: 'chat_message',
      roomId: this.currentRoom,
      content,
      timestamp: Date.now()
    });
  }

  // Typing indicator
  sendTyping(isTyping) {
    if (this.currentRoom) {
      this.send({
        type: 'typing',
        roomId: this.currentRoom,
        isTyping
      });
    }
  }

  // Get room users
  getRoomUsers() {
    if (this.currentRoom) {
      this.send({
        type: 'get_room_users',
        roomId: this.currentRoom
      });
    }
  }

  // Disconnect
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
    }
  }

  // Event handling
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
    return this;
  }

  off(event, handler) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
    return this;
  }

  emit(event, data) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

// Usage
const chat = new ChatClient('wss://chat.example.com/socket');

// Set up event handlers
chat.on('authenticated', ({ userId }) => {
  console.log('Logged in with ID:', userId);
  chat.joinRoom('general');
});

chat.on('roomJoined', ({ roomId, history }) => {
  console.log('Joined room:', roomId);
  history.forEach(msg => displayMessage(msg));
});

chat.on('message', (message) => {
  displayMessage(message);
});

chat.on('userJoined', ({ username }) => {
  displaySystemMessage(`${username} joined the room`);
});

chat.on('userLeft', ({ username }) => {
  displaySystemMessage(`${username} left the room`);
});

chat.on('typing', ({ username, isTyping }) => {
  updateTypingIndicator(username, isTyping);
});

chat.on('disconnected', () => {
  displaySystemMessage('Disconnected from server');
});

chat.on('reconnecting', (attempt) => {
  displaySystemMessage(`Reconnecting... (attempt ${attempt})`);
});

// Connect
chat.connect('JohnDoe')
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Failed to connect:', err));

// Send a message
document.getElementById('sendButton').onclick = () => {
  const input = document.getElementById('messageInput');
  if (input.value.trim()) {
    chat.sendMessage(input.value);
    input.value = '';
  }
};

// Typing indicator
let typingTimeout;
document.getElementById('messageInput').oninput = () => {
  chat.sendTyping(true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    chat.sendTyping(false);
  }, 2000);
};
```

## Best Practices

### Connection Management

```javascript
// 1. Always handle connection errors
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Log to error tracking service
  logError('websocket_error', error);
};

// 2. Implement proper cleanup
window.addEventListener('beforeunload', () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close(1000, 'Page closing');
  }
});

// 3. Use connection state checking
function safeSend(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(data);
    return true;
  }
  console.warn('Cannot send: WebSocket not open');
  return false;
}

// 4. Implement reconnection with backoff
function reconnectWithBackoff(attempt) {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  const jitter = delay * 0.2 * Math.random();
  return delay + jitter;
}
```

### Message Handling

```javascript
// 1. Always parse messages safely
ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    handleMessage(data);
  } catch (e) {
    console.error('Failed to parse message:', e);
  }
};

// 2. Implement message validation
function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    return false;
  }
  if (!message.type || typeof message.type !== 'string') {
    return false;
  }
  return true;
}

// 3. Use typed messages
const MESSAGE_TYPES = {
  CHAT: 'chat',
  NOTIFICATION: 'notification',
  SYSTEM: 'system',
  ERROR: 'error'
};

// 4. Implement message acknowledgment for important messages
let messageId = 0;
const pendingAcks = new Map();

function sendWithAck(data, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const id = ++messageId;
    const message = { ...data, _ackId: id };

    pendingAcks.set(id, {
      resolve,
      timeout: setTimeout(() => {
        pendingAcks.delete(id);
        reject(new Error('Acknowledgment timeout'));
      }, timeout)
    });

    ws.send(JSON.stringify(message));
  });
}
```

### Security

```javascript
// 1. Always use WSS in production
const wsUrl = window.location.protocol === 'https:'
  ? 'wss://api.example.com/socket'
  : 'ws://localhost:8080/socket';

// 2. Sanitize outgoing data
function sanitize(str) {
  return String(str).substring(0, 10000); // Limit length
}

// 3. Validate incoming data
function isValidChatMessage(data) {
  return (
    data &&
    typeof data.content === 'string' &&
    data.content.length > 0 &&
    data.content.length <= 10000
  );
}

// 4. Implement rate limiting
const rateLimiter = {
  messages: [],
  limit: 10,
  window: 1000,

  canSend() {
    const now = Date.now();
    this.messages = this.messages.filter(t => now - t < this.window);
    return this.messages.length < this.limit;
  },

  recordSend() {
    this.messages.push(Date.now());
  }
};
```

## Summary

WebSocket provides powerful real-time communication capabilities for modern web applications:

- **Bidirectional Communication**: Both client and server can initiate messages
- **Persistent Connections**: Single TCP connection for ongoing communication
- **Low Latency**: Minimal overhead compared to HTTP polling
- **Binary Support**: Efficient transfer of binary data
- **Event-Driven**: Clean API with open, message, close, and error events

Key implementation considerations:

- **Connection Management**: Handle connection states and implement proper cleanup
- **Heartbeat**: Keep connections alive and detect dead connections
- **Reconnection**: Implement automatic reconnection with exponential backoff
- **Message Queuing**: Handle messages during temporary disconnections
- **Security**: Use WSS, implement authentication, and validate all data
- **Error Handling**: Gracefully handle network errors and edge cases

WebSocket is essential for applications requiring real-time updates such as chat systems, live dashboards, collaborative tools, and online gaming.
