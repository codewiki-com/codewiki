---
title: "JavaScript Server-Sent Events (SSE): Real-time Communication Guide"
description: "Master Server-Sent Events for one-way real-time communication in JavaScript: implementation, best practices, and advanced patterns"
track: javascript
section: browser
difficulty: intermediate
tags:
  - server-sent events
  - SSE
  - real-time
  - WebSockets
  - EventSource
  - streaming
  - HTTP
status: imported
origin: old/src/content/docs/javascript/server-sent-events.en.md
divergence: 0.171
issues:
  - title-lang-zh
  - missing-subcategory-en
  - title-language
legacy:
  category: JavaScript
  subcategory: ""
  order: 45
  lastUpdated: 2026-01-07
---

Server-Sent Events (SSE) is a web API that enables servers to push data to clients over a single HTTP connection in real-time. Unlike WebSockets (which provide bidirectional communication) or traditional polling (which wastes bandwidth), SSE offers an efficient, one-way channel for server-to-client updates. This makes SSE ideal for scenarios like live notifications, stock tickers, activity feeds, and status updates where the client primarily receives data from the server.

## Concept Explanation

### What Are Server-Sent Events?

Server-Sent Events (SSE) is a standard web API that establishes a persistent HTTP connection where the server can send messages to the client whenever needed. The connection remains open until explicitly closed, allowing the server to push updates without the client having to repeatedly request data.

**Key Characteristics:**
- One-way communication (server to client only)
- Built on HTTP (no special protocols needed)
- Automatic reconnection on disconnect
- Event-based architecture
- Efficient bandwidth usage
- Simple implementation with native browser API

### SSE vs. Alternatives

Understanding when to use SSE requires comparing it with other real-time technologies:

**SSE vs. WebSockets:**
- SSE: One-way, HTTP-based, simpler implementation
- WebSockets: Bidirectional, requires separate protocol, more complex but more flexible

**SSE vs. Long Polling:**
- SSE: Efficient persistent connection, server initiates updates
- Long Polling: Client repeatedly requests, creates unnecessary server load

**SSE vs. Short Polling:**
- SSE: Native browser support, standardized format, automatic reconnection
- Short Polling: Simple but inefficient, wastes bandwidth with frequent requests

### How SSE Works

The connection flow is straightforward:

1. Client creates an EventSource connection to server endpoint
2. Server accepts connection and sends HTTP 200 response
3. Server sends data in special text/event-stream format
4. Connection remains open for subsequent server messages
5. Client receives and processes messages via event listeners
6. Connection closes when client or server disconnects

## Core Principles

### The EventSource API

The EventSource API is the client-side interface for consuming server-sent events:

```javascript
// Basic EventSource creation
const eventSource = new EventSource('/api/events');

// Listen for messages
eventSource.onmessage = (event) => {
  console.log('Received message:', event.data);
};

// Listen for errors
eventSource.onerror = (event) => {
  console.error('SSE error:', event);
};

// Close connection
eventSource.close();
```

### Server-side Event Streaming Format

The server must send data in the text/event-stream MIME type with specific formatting:

```
data: message content\n\n
```

For multiple fields:

```
event: customEventType\n
data: {"key": "value"}\n
id: 1\n
retry: 5000\n\n
```

### Event Types and IDs

SSE supports multiple event types and automatic tracking:

```
// Generic message event
data: Some data\n\n

// Named event
event: notification\n
data: You have a new message\n\n

// Event with ID for reconnection
id: 12345\n
data: Important update\n\n

// Retry configuration
retry: 10000\n
data: Reconnect after 10 seconds if disconnected\n\n
```

### Connection Management

SSE includes automatic reconnection with exponential backoff:

- Default reconnection: 1 second to several seconds
- Customizable via `retry` field
- Last-Event-ID sent on reconnection allows servers to resume from last message
- Ready states: CONNECTING (0), OPEN (1), CLOSED (2)

## Key Points

### EventSource Ready States

```javascript
const eventSource = new EventSource('/stream');

// Check connection status
console.log(eventSource.readyState);
// 0 = CONNECTING (connection not yet established)
// 1 = OPEN (connected and ready)
// 2 = CLOSED (not connected)

// Monitor state changes
eventSource.onopen = () => {
  console.log('Connection established');
};
```

### Event Parsing Behavior

SSE automatically parses messages with specific rules:

```javascript
// Single-line message
eventSource.onmessage = (event) => {
  console.log(event.data); // String
};

// Multi-line message (joined with newlines)
// Server sends:
// data: line 1\n
// data: line 2\n\n
// Client receives:
// event.data = "line 1\nline 2"
```

### Named Events

Listen to specific event types instead of generic messages:

```javascript
const eventSource = new EventSource('/stream');

// Listen to specific event type
eventSource.addEventListener('notification', (event) => {
  console.log('Notification:', event.data);
});

eventSource.addEventListener('status-update', (event) => {
  console.log('Status:', event.data);
});

// Generic message listener (catches unnamed 'message' events)
eventSource.onmessage = (event) => {
  console.log('Generic message:', event.data);
};
```

### Reconnection Mechanics

SSE automatically handles disconnections:

```javascript
const eventSource = new EventSource('/stream');

// Server can recommend retry timeout
// retry: 5000\n\n (retry after 5 seconds)

eventSource.onerror = (event) => {
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log('Connection permanently closed');
  } else if (eventSource.readyState === EventSource.CONNECTING) {
    console.log('Attempting to reconnect...');
  }
};

// Manual reconnection
setTimeout(() => {
  eventSource.close();
  const newSource = new EventSource('/stream');
}, 30000);
```

### Cross-Origin Requests

SSE respects CORS policies:

```javascript
// Standard cross-origin request
const eventSource = new EventSource('https://api.example.com/stream', {
  withCredentials: true // Include cookies in requests
});

// Server must send appropriate CORS headers:
// Access-Control-Allow-Origin: https://client.example.com
// Access-Control-Allow-Credentials: true
```

## Code Examples

### Basic SSE Implementation

**Client-side:**

```javascript
// Create connection
const eventSource = new EventSource('/api/notifications');

// Set up listeners
eventSource.onopen = () => {
  console.log('Connected to server');
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = 'Connected';
};

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('New notification:', notification);
  displayNotification(notification);
};

eventSource.onerror = (error) => {
  console.error('Connection error:', error);
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = 'Disconnected';
};

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  eventSource.close();
});

function displayNotification(notification) {
  const div = document.createElement('div');
  div.className = 'notification';
  // Use textContent to avoid XSS vulnerabilities
  div.textContent = notification.message;
  document.body.appendChild(div);
}
```

**Server-side (Node.js/Express):**

```javascript
const express = require('express');
const app = express();

// Broadcast list for connected clients
const connectedClients = [];

app.get('/api/notifications', (req, res) => {
  // Set appropriate headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Create client object
  const client = {
    id: Date.now(),
    response: res
  };

  // Add to connected clients
  connectedClients.push(client);
  console.log(`Client ${client.id} connected. Total: ${connectedClients.length}`);

  // Send welcome message
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    message: 'Successfully connected to notification stream'
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    const index = connectedClients.findIndex(c => c.id === client.id);
    if (index !== -1) {
      connectedClients.splice(index, 1);
    }
    console.log(`Client ${client.id} disconnected. Remaining: ${connectedClients.length}`);
    res.end();
  });
});

// Broadcast message to all connected clients
function broadcastNotification(notification) {
  connectedClients.forEach(client => {
    client.response.write(
      `data: ${JSON.stringify(notification)}\n\n`
    );
  });
}

// Example: Send notification when endpoint is called
app.post('/api/send-notification', express.json(), (req, res) => {
  const notification = {
    timestamp: new Date(),
    message: req.body.message
  };
  broadcastNotification(notification);
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Named Events and Custom Event Handling

**Client-side:**

```javascript
const eventSource = new EventSource('/api/events');

// Handle different event types
eventSource.addEventListener('user-login', (event) => {
  const data = JSON.parse(event.data);
  console.log(`User ${data.username} logged in`);
  updateUI('login', data);
});

eventSource.addEventListener('stock-update', (event) => {
  const data = JSON.parse(event.data);
  console.log(`Stock ${data.symbol}: $${data.price}`);
  updateChart(data);
});

eventSource.addEventListener('system-alert', (event) => {
  const data = JSON.parse(event.data);
  console.log(`Alert: ${data.message}`);
  showAlert(data.level, data.message);
});

eventSource.addEventListener('progress', (event) => {
  const { completed, total } = JSON.parse(event.data);
  updateProgressBar(completed, total);
});

// Generic fallback
eventSource.onmessage = (event) => {
  console.log('Unhandled event:', event.data);
};

eventSource.onerror = (error) => {
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log('SSE connection closed');
  }
};
```

**Server-side:**

```javascript
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send user login event
  res.write('event: user-login\n');
  res.write(`data: ${JSON.stringify({
    username: 'john_doe',
    timestamp: new Date()
  })}\n\n`);

  // Send stock update event
  res.write('event: stock-update\n');
  res.write(`data: ${JSON.stringify({
    symbol: 'AAPL',
    price: 150.25,
    change: 2.5
  })}\n\n`);

  // Send progress event
  res.write('event: progress\n');
  res.write(`data: ${JSON.stringify({
    completed: 50,
    total: 100
  })}\n\n`);

  req.on('close', () => res.end());
});
```

### SSE with Automatic Reconnection and Message ID

**Client-side:**

```javascript
class SSEConnection {
  constructor(url, options = {}) {
    this.url = url;
    this.options = { reconnectInterval: 5000, ...options };
    this.eventSource = null;
    this.lastEventId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.isIntentionallyClosed = false;
    this._onConnect = null;
    this._onMessage = null;
    this._onError = null;
    this._onMaxRetriesExceeded = null;

    this.connect();
  }

  connect() {
    const params = new URLSearchParams();
    if (this.lastEventId) {
      params.append('lastEventId', this.lastEventId);
    }

    const url = `${this.url}?${params}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('Connected to SSE stream');
      this.reconnectAttempts = 0;
      if (this._onConnect) this._onConnect();
    };

    this.eventSource.onmessage = (event) => {
      // Store last event ID for reconnection
      if (event.lastEventId) {
        this.lastEventId = event.lastEventId;
      }
      if (this._onMessage) this._onMessage(event.data);
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      if (this._onError) this._onError(error);

      if (!this.isIntentionallyClosed) {
        this.reconnect();
      }
    };
  }

  reconnect() {
    this.eventSource?.close();

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      if (this._onMaxRetriesExceeded) this._onMaxRetriesExceeded();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => this.connect(), delay);
  }

  close() {
    this.isIntentionallyClosed = true;
    this.eventSource?.close();
  }

  // Event callbacks
  onConnect(callback) {
    this._onConnect = callback;
    return this;
  }

  onMessage(callback) {
    this._onMessage = callback;
    return this;
  }

  onError(callback) {
    this._onError = callback;
    return this;
  }

  onMaxRetriesExceeded(callback) {
    this._onMaxRetriesExceeded = callback;
    return this;
  }
}

// Usage
const connection = new SSEConnection('/api/stream');

connection
  .onConnect(() => console.log('Stream connected'))
  .onMessage((data) => console.log('Message:', data))
  .onError((error) => console.log('Error:', error))
  .onMaxRetriesExceeded(() => console.log('Connection failed permanently'));
```

**Server-side:**

```javascript
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const lastEventId = parseInt(req.query.lastEventId || '0', 10);
  let messageId = Math.max(lastEventId, 1);

  // Send initial sync
  if (lastEventId > 0) {
    res.write(`: Last received: ${lastEventId}\n\n`);
  }

  // Send messages
  const interval = setInterval(() => {
    res.write(`id: ${messageId}\n`);
    res.write(`data: ${JSON.stringify({
      message: `Message ${messageId}`,
      timestamp: new Date()
    })}\n\n`);
    messageId++;
  }, 2000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});
```

### Advanced: Real-time Activity Feed

**Client-side:**

```javascript
class ActivityFeed {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.activities = [];
    this.eventSource = new EventSource('/api/activity-feed');
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventSource.addEventListener('activity', (event) => {
      const activity = JSON.parse(event.data);
      this.addActivity(activity);
    });

    this.eventSource.addEventListener('activity-delete', (event) => {
      const { id } = JSON.parse(event.data);
      this.removeActivity(id);
    });

    this.eventSource.onerror = () => {
      this.showConnectionStatus('disconnected');
    };

    this.eventSource.onopen = () => {
      this.showConnectionStatus('connected');
    };
  }

  addActivity(activity) {
    this.activities.unshift(activity);
    this.render();
  }

  removeActivity(id) {
    this.activities = this.activities.filter(a => a.id !== id);
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.activities.forEach(activity => {
      const element = this.createActivityElement(activity);
      this.container.appendChild(element);
    });
  }

  createActivityElement(activity) {
    const div = document.createElement('div');
    div.className = 'activity-item';

    // Create elements safely without innerHTML
    const headerDiv = document.createElement('div');
    headerDiv.className = 'activity-header';

    const userSpan = document.createElement('span');
    userSpan.className = 'user';
    userSpan.textContent = activity.user;

    const actionSpan = document.createElement('span');
    actionSpan.className = 'action';
    actionSpan.textContent = activity.action;

    const timeEl = document.createElement('time');
    timeEl.textContent = new Date(activity.timestamp).toLocaleTimeString();

    headerDiv.appendChild(userSpan);
    headerDiv.appendChild(actionSpan);
    headerDiv.appendChild(timeEl);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'activity-content';
    contentDiv.textContent = activity.content;

    div.appendChild(headerDiv);
    div.appendChild(contentDiv);

    return div;
  }

  showConnectionStatus(status) {
    const statusEl = document.querySelector('#connection-status');
    if (statusEl) {
      statusEl.textContent = status;
      statusEl.className = `status ${status}`;
    }
  }

  destroy() {
    this.eventSource.close();
  }
}

// Initialize
const feed = new ActivityFeed('#activity-container');
```

**Server-side:**

```javascript
const activities = [];
let activityId = 0;

app.get('/api/activity-feed', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send recent activities on connection
  activities.slice(-20).forEach(activity => {
    res.write(`event: activity\n`);
    res.write(`data: ${JSON.stringify(activity)}\n\n`);
  });

  // Keep connection open and send new activities
  req.on('close', () => res.end());
});

// When activity occurs elsewhere in your app
function broadcastActivity(user, action, content) {
  const activity = {
    id: ++activityId,
    user,
    action,
    content,
    timestamp: new Date()
  };

  activities.push(activity);

  // Broadcast to all connected clients
  connectedClients.forEach(client => {
    client.response.write('event: activity\n');
    client.response.write(`data: ${JSON.stringify(activity)}\n\n`);
  });
}

app.post('/api/perform-action', express.json(), (req, res) => {
  const { user, action, content } = req.body;
  broadcastActivity(user, action, content);
  res.json({ success: true });
});
```

## Best Practices

### Proper Header Configuration

Always set correct HTTP headers for SSE to work reliably:

```javascript
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in proxies

// Optional: set transfer encoding
res.setHeader('Transfer-Encoding', 'chunked');
```

### Graceful Error Handling

```javascript
const eventSource = new EventSource('/api/stream');

eventSource.onerror = (error) => {
  if (eventSource.readyState === EventSource.CLOSED) {
    // Connection closed permanently
    console.log('SSE connection closed');
    // Show user message, suggest refresh
  } else if (eventSource.readyState === EventSource.CONNECTING) {
    // Automatic reconnection in progress
    console.log('Attempting to reconnect...');
  }
};

// Add timeout for stale connections
const connectionTimeout = setTimeout(() => {
  if (eventSource.readyState === EventSource.OPEN) {
    console.warn('Connection appears stale, reconnecting...');
    eventSource.close();
    // Reconnect logic
  }
}, 30000);
```

### Data Validation and Sanitization

Always validate server messages before processing:

```javascript
eventSource.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    // Validate data structure
    if (!data || typeof data !== 'object') {
      console.warn('Invalid message format');
      return;
    }

    // Use textContent or createElement for safe DOM insertion
    const message = data.message;
    displayMessageSafely(message);
  } catch (error) {
    console.error('Failed to parse message:', error);
  }
};

function displayMessageSafely(text) {
  const div = document.createElement('div');
  div.textContent = text;  // Safe: uses textContent
  document.body.appendChild(div);
}
```

### Connection Pooling and Limits

Manage multiple SSE connections efficiently:

```javascript
class SSEConnectionPool {
  constructor(maxConnections = 5) {
    this.maxConnections = maxConnections;
    this.connections = new Map();
  }

  addConnection(key, url) {
    if (this.connections.size >= this.maxConnections) {
      console.warn('Maximum SSE connections reached');
      return null;
    }

    const eventSource = new EventSource(url);
    this.connections.set(key, eventSource);
    return eventSource;
  }

  removeConnection(key) {
    const eventSource = this.connections.get(key);
    if (eventSource) {
      eventSource.close();
      this.connections.delete(key);
    }
  }

  closeAll() {
    this.connections.forEach(es => es.close());
    this.connections.clear();
  }

  getConnection(key) {
    return this.connections.get(key);
  }
}

// Usage
const pool = new SSEConnectionPool(3);
pool.addConnection('notifications', '/api/notifications');
pool.addConnection('updates', '/api/updates');
```

### Memory Management

Prevent memory leaks from long-lived connections:

```javascript
class ManagedSSEConnection {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.messageHandler = this.onMessage.bind(this);
    this.errorHandler = this.onError.bind(this);
    this.connect();
  }

  connect() {
    this.eventSource = new EventSource(this.url);
    this.eventSource.addEventListener('message', this.messageHandler);
    this.eventSource.addEventListener('error', this.errorHandler);
  }

  onMessage(event) {
    // Handle message
    console.log('Message:', event.data);
  }

  onError(error) {
    console.error('Connection error:', error);
  }

  dispose() {
    if (this.eventSource) {
      this.eventSource.removeEventListener('message', this.messageHandler);
      this.eventSource.removeEventListener('error', this.errorHandler);
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Clean up when component is destroyed
const connection = new ManagedSSEConnection('/api/stream');

// Later, when cleaning up
connection.dispose();
```

## Common Pitfalls

### Not Handling Reconnections

SSE automatically reconnects, but you should handle logic carefully:

```javascript
// Bad: Duplicate handlers on each reconnection
eventSource.onmessage = () => {
  // Handler gets added multiple times
};

// Good: Attach handlers once
const eventSource = new EventSource('/api/stream');
eventSource.onmessage = (event) => {
  // Handler attached once
};
```

### Ignoring Proxy/Load Balancer Issues

Many proxies buffer SSE responses. Disable buffering:

```javascript
// Server-side (Express)
res.setHeader('X-Accel-Buffering', 'no');

// Nginx configuration
location /api/stream {
  proxy_buffering off;
  proxy_request_buffering off;
}
```

### Not Using Fallbacks for Older Browsers

SSE isn't supported in older browsers (IE, Opera Mini):

```javascript
if (typeof EventSource !== 'undefined') {
  // Use SSE
  const eventSource = new EventSource('/api/stream');
} else {
  // Fallback to WebSocket or polling
  console.warn('SSE not supported, falling back to alternative');
  useFallbackConnection();
}
```

### Sending Invalid Event Stream Format

Malformed messages break parsing:

```javascript
// Bad: Incorrect format
res.write('data: message\n');  // Missing final newline

// Good: Correct format
res.write('data: message\n\n');  // Two newlines required

// Bad: Unescaped JSON data
res.write(`data: ${JSON.stringify(obj)}\n\n`);  // May contain newlines

// Good: Properly encoded
const line = JSON.stringify(obj).replace(/\n/g, ' ');
res.write(`data: ${line}\n\n`);
```

### Not Managing Server Resources

Connections consume server resources:

```javascript
// Bad: No connection limit
app.get('/api/stream', (req, res) => {
  // Each connection takes memory
  setupStream(res);
});

// Good: Implement connection limits
const maxConnections = 1000;
let activeConnections = 0;

app.get('/api/stream', (req, res) => {
  if (activeConnections >= maxConnections) {
    return res.status(503).send('Service unavailable');
  }

  activeConnections++;

  req.on('close', () => {
    activeConnections--;
  });

  setupStream(res);
});
```

### Blocking Event Loop with Synchronous Operations

```javascript
// Bad: Synchronous file read blocks event loop
app.get('/api/stream', (req, res) => {
  const data = fs.readFileSync('large-file.json');  // Blocks!
  res.write(`data: ${data}\n\n`);
});

// Good: Use asynchronous operations
app.get('/api/stream', (req, res) => {
  fs.readFile('large-file.json', (err, data) => {
    if (err) return;
    res.write(`data: ${data}\n\n`);
  });
});
```

## Performance Considerations

### Message Size and Frequency

Large or frequent messages impact performance:

```javascript
// Bad: Sending large objects frequently
setInterval(() => {
  const largeData = JSON.stringify(complexObject);
  res.write(`data: ${largeData}\n\n`);  // Every 100ms
}, 100);

// Good: Send only necessary data, adjust frequency
setInterval(() => {
  const minimalData = JSON.stringify({
    id: update.id,
    status: update.status,
    change: update.change
  });
  res.write(`data: ${minimalData}\n\n`);  // Every 500ms
}, 500);
```

### Network Bandwidth Optimization

Minimize data transfer:

```javascript
// Bad: Duplicate data in each message
const fullObject = {
  id: item.id,
  name: item.name,
  status: item.status,
  metadata: item.metadata,
  ...item.fullData
};
res.write(`data: ${JSON.stringify(fullObject)}\n\n`);

// Good: Send delta updates
const update = {
  id: item.id,
  status: item.status  // Only changed field
};
res.write(`data: ${JSON.stringify(update)}\n\n`);
```

### Connection Pooling

Reuse connections efficiently:

```javascript
// Bad: New connection for each data type
new EventSource('/api/notifications');
new EventSource('/api/updates');
new EventSource('/api/logs');

// Good: Single multiplexed connection
const eventSource = new EventSource('/api/all-events');

eventSource.addEventListener('notification', handleNotification);
eventSource.addEventListener('update', handleUpdate);
eventSource.addEventListener('log', handleLog);
```

### CPU and Memory Usage

Monitor performance with metrics:

```javascript
class PerformanceMonitor {
  constructor(eventSource) {
    this.eventSource = eventSource;
    this.messageCount = 0;
    this.startTime = Date.now();
    this.messageBytes = 0;

    // Monitor messages
    const originalOnmessage = eventSource.onmessage;
    eventSource.onmessage = (event) => {
      this.messageCount++;
      this.messageBytes += new Blob([event.data]).size;

      if (originalOnmessage) {
        originalOnmessage(event);
      }
    };

    // Log metrics periodically
    setInterval(() => this.logMetrics(), 5000);
  }

  logMetrics() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = this.messageCount / elapsed;
    const throughput = this.messageBytes / elapsed / 1024; // KB/s

    console.log(`
      Messages: ${this.messageCount}
      Rate: ${rate.toFixed(2)} msg/s
      Throughput: ${throughput.toFixed(2)} KB/s
      Avg size: ${(this.messageBytes / this.messageCount).toFixed(0)} bytes
    `);
  }
}
```

## Real-world Scenarios

### Live Notification System

Real-time notifications for user actions across the platform:

```javascript
// Client
class NotificationCenter {
  constructor() {
    this.eventSource = new EventSource('/api/notifications');
    this.notifications = [];
    this.setupListeners();
  }

  setupListeners() {
    this.eventSource.addEventListener('notification', (event) => {
      const notification = JSON.parse(event.data);
      this.addNotification(notification);
      this.showNotificationUI(notification);
    });

    this.eventSource.addEventListener('notification-read', (event) => {
      const { id } = JSON.parse(event.data);
      this.markAsRead(id);
    });
  }

  addNotification(notification) {
    this.notifications.unshift(notification);
    this.notifications = this.notifications.slice(0, 100);  // Keep last 100
  }

  showNotificationUI(notification) {
    // Browser notification if permitted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        tag: notification.id
      });
    }

    // Also show in-app notification
    this.displayInApp(notification);
  }

  markAsRead(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
  }

  displayInApp(notification) {
    const container = document.getElementById('notifications');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `notification ${notification.type}`;

    // Create elements safely
    const titleEl = document.createElement('strong');
    titleEl.textContent = notification.title;

    const bodyEl = document.createElement('p');
    bodyEl.textContent = notification.body;

    div.appendChild(titleEl);
    div.appendChild(bodyEl);

    container.insertBefore(div, container.firstChild);

    setTimeout(() => div.remove(), 5000);
  }
}

// Server
app.get('/api/notifications', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = req.user.id;
  const client = { id: clientId, response: res };

  connectedClients.push(client);

  req.on('close', () => {
    const index = connectedClients.findIndex(c => c.id === clientId);
    if (index !== -1) connectedClients.splice(index, 1);
  });
});

function notifyUser(userId, notification) {
  connectedClients
    .filter(c => c.id === userId)
    .forEach(client => {
      client.response.write(`event: notification\n`);
      client.response.write(`data: ${JSON.stringify(notification)}\n\n`);
    });
}

// Example: When user receives message
app.post('/api/messages', express.json(), (req, res) => {
  const message = createMessage(req.body);
  notifyUser(message.recipientId, {
    title: `New message from ${message.sender}`,
    body: message.preview,
    type: 'message',
    id: message.id
  });
  res.json({ success: true });
});
```

### Stock Price Ticker

Real-time stock price updates:

```javascript
// Client
class StockTicker {
  constructor(symbols = []) {
    this.eventSource = new EventSource(
      `/api/stock-ticker?symbols=${symbols.join(',')}`
    );
    this.prices = new Map();
    this.setupListeners();
  }

  setupListeners() {
    this.eventSource.addEventListener('price-update', (event) => {
      const update = JSON.parse(event.data);
      this.updatePrice(update);
      this.updateUI(update);
    });
  }

  updatePrice(update) {
    const prev = this.prices.get(update.symbol) || {};
    this.prices.set(update.symbol, {
      price: update.price,
      previousPrice: prev.price || update.price,
      timestamp: new Date(),
      change: update.price - (prev.price || update.price)
    });
  }

  updateUI(update) {
    const element = document.querySelector(`[data-symbol="${update.symbol}"]`);
    if (!element) return;

    const price = this.prices.get(update.symbol);
    const changeClass = price.change > 0 ? 'positive' : 'negative';

    // Create elements safely
    const symbolSpan = document.createElement('span');
    symbolSpan.className = 'symbol';
    symbolSpan.textContent = update.symbol;

    const priceSpan = document.createElement('span');
    priceSpan.className = 'price';
    priceSpan.textContent = `$${update.price.toFixed(2)}`;

    const changeSpan = document.createElement('span');
    changeSpan.className = `change ${changeClass}`;
    changeSpan.textContent = `${price.change > 0 ? '+' : ''}${price.change.toFixed(2)}`;

    element.innerHTML = '';
    element.appendChild(symbolSpan);
    element.appendChild(priceSpan);
    element.appendChild(changeSpan);
  }
}

// Server
app.get('/api/stock-ticker', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const symbols = req.query.symbols.split(',');

  const interval = setInterval(async () => {
    for (const symbol of symbols) {
      const price = await getStockPrice(symbol);
      res.write('event: price-update\n');
      res.write(`data: ${JSON.stringify({
        symbol,
        price,
        timestamp: new Date()
      })}\n\n`);
    }
  }, 1000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});
```

### Progress Tracking for Long Operations

Monitor progress of server-side operations:

```javascript
// Client
class ProgressTracker {
  constructor(operationId) {
    this.operationId = operationId;
    this.progress = 0;
    this.status = 'pending';
    this.eventSource = new EventSource(
      `/api/progress/${operationId}`
    );
    this.setupListeners();
  }

  setupListeners() {
    this.eventSource.addEventListener('progress', (event) => {
      const { completed, total, currentStep } = JSON.parse(event.data);
      this.progress = (completed / total) * 100;
      this.updateProgressBar(this.progress, currentStep);
    });

    this.eventSource.addEventListener('complete', (event) => {
      const { result } = JSON.parse(event.data);
      this.status = 'complete';
      this.onComplete(result);
      this.eventSource.close();
    });

    this.eventSource.addEventListener('error', (event) => {
      const { message } = JSON.parse(event.data);
      this.status = 'error';
      this.onError(message);
      this.eventSource.close();
    });
  }

  updateProgressBar(percentage, step) {
    const bar = document.querySelector('#progress-bar');
    if (bar) {
      bar.style.width = `${percentage}%`;
      bar.textContent = `${percentage.toFixed(0)}% - ${step}`;
    }
  }

  onComplete(result) {
    console.log('Operation complete:', result);
  }

  onError(message) {
    console.error('Operation error:', message);
  }
}

// Server
app.get('/api/progress/:operationId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const operationId = req.params.operationId;

  async function processWithProgress() {
    try {
      const items = await getItems();
      const total = items.length;

      for (let i = 0; i < total; i++) {
        await processItem(items[i]);

        res.write('event: progress\n');
        res.write(`data: ${JSON.stringify({
          completed: i + 1,
          total,
          currentStep: `Processing ${i + 1} of ${total}`
        })}\n\n`);
      }

      res.write('event: complete\n');
      res.write(`data: ${JSON.stringify({
        result: 'All items processed successfully'
      })}\n\n`);
      res.end();
    } catch (error) {
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({
        message: error.message
      })}\n\n`);
      res.end();
    }
  }

  processWithProgress();
});
```

## Interview Points

### "What are the main differences between SSE and WebSockets?"

**Answer Structure:**

SSE and WebSockets are both real-time communication technologies but serve different purposes:

**SSE (Server-Sent Events):**
- One-way communication (server to client)
- Built on HTTP protocol
- Automatic reconnection
- Simpler to implement
- Lower bandwidth overhead
- Better for server-to-client streaming

**WebSockets:**
- Bidirectional communication
- Separate protocol upgrade from HTTP
- Manual connection management
- More complex implementation
- Higher overhead but more flexible
- Better for gaming, chat, real-time collaboration

**Use Cases:**
- Choose SSE when client primarily receives updates (notifications, feeds, live data)
- Choose WebSockets when you need bidirectional interaction or frequent client-to-server messages

### "How does SSE handle reconnection and recovery?"

**Answer:**

SSE provides automatic reconnection with configurable retry intervals:

```javascript
// Server can set retry timeout
res.write('retry: 5000\n\n');  // Retry after 5 seconds

// Server can set event ID for recovery
res.write('id: 123\n');
res.write('data: message\n\n');

// Client automatically sends Last-Event-ID on reconnection
// Server can then resume from where connection dropped

// Browser automatically reconnects using exponential backoff
// Developers can customize with event listeners
```

### "What are performance bottlenecks with SSE?"

**Answer:**

Key performance concerns:

1. **Connection Limits:** Each connection consumes server memory. Monitor and limit concurrent connections.

2. **Message Size:** Large messages consume bandwidth. Send only necessary data.

3. **Message Frequency:** Too many messages create CPU/network overhead. Balance frequency with requirements.

4. **Proxy Buffering:** Some proxies buffer SSE responses. Disable with `X-Accel-Buffering: no`.

5. **Memory Leaks:** Improper cleanup can cause memory leaks. Always detach event listeners and close connections.

6. **Data Parsing:** Large JSON payloads require parsing. Minify JSON, consider binary formats.

**Optimization Strategies:**
- Implement connection pooling
- Use delta updates instead of full objects
- Compress data with gzip
- Implement message batching
- Monitor and limit message frequency

### "How would you implement SSE with database updates?"

**Answer:**

```javascript
// Option 1: Poll database periodically
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');

  const interval = setInterval(async () => {
    const updates = await db.query('SELECT * FROM updates WHERE timestamp > ?', [lastCheck]);
    updates.forEach(update => {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    });
    lastCheck = new Date();
  }, 1000);

  req.on('close', () => clearInterval(interval));
});

// Option 2: Database change streams (MongoDB, Postgres)
const changeStream = db.collection('updates').watch();

changeStream.on('change', (change) => {
  connectedClients.forEach(client => {
    client.response.write(`data: ${JSON.stringify(change)}\n\n`);
  });
});

// Option 3: Event-based with message queue (Redis, RabbitMQ)
const subscriber = redis.createClient();
subscriber.subscribe('updates', (message) => {
  connectedClients.forEach(client => {
    client.response.write(`data: ${message}\n\n`);
  });
});
```

### "What happens if the network drops during SSE transmission?"

**Answer:**

When network connectivity is lost:

1. **Client-side:** EventSource fires `error` event, enters `CONNECTING` state
2. **Automatic Retry:** Browser automatically attempts to reconnect
3. **Exponential Backoff:** Retry interval increases with each attempt (1s, 2s, 4s, etc.)
4. **Last-Event-ID:** Browser sends `Last-Event-ID` header so server can resume from that point
5. **Message Recovery:** Server can store messages since `Last-Event-ID` and resend them

```javascript
// Client automatically handles this, but you can customize:
eventSource.onerror = (error) => {
  if (eventSource.readyState === EventSource.CONNECTING) {
    console.log('Reconnecting...');
  }
};

// Server can use Last-Event-ID to recover
app.get('/api/stream', (req, res) => {
  const lastId = parseInt(req.headers['last-event-id'] || '0', 10);

  // Send messages since lastId
  const missedMessages = getMessagesSince(lastId);
  missedMessages.forEach(msg => {
    res.write(`id: ${msg.id}\n`);
    res.write(`data: ${JSON.stringify(msg)}\n\n`);
  });
});
```

## Further Reading

### Official Specifications and Documentation

- [MDN Web Docs: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [WHATWG: Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [W3C EventSource API](https://www.w3.org/TR/eventsource/)

### Browser Support and Polyfills

- [Can I Use: Server-Sent Events](https://caniuse.com/eventsource)
- [EventSource Polyfill GitHub](https://github.com/Yaffle/EventSource)
- [Browser Compatibility Table](https://developer.mozilla.org/en-US/docs/Web/API/EventSource#browser_compatibility)

### Server Implementations

**Node.js:**
- [Express SSE Middleware](https://www.npmjs.com/package/express-sse)
- [sse Package](https://www.npmjs.com/package/sse)

**Python:**
- [Flask-CORS with SSE](https://flask-cors.readthedocs.io/)
- [Quart SSE](https://quart.palletsprojects.com/)

**Ruby:**
- [Rails ActionController::Live](https://guides.rubyonrails.org/action_controller_overview.html#streaming)

**Go:**
- [Go http.Flusher](https://golang.org/pkg/net/http/#Flusher)

### Related Technologies

- **WebSockets:** For bidirectional real-time communication
- **HTTP/2 Server Push:** For initial page resource delivery
- **Message Queues:** Redis, RabbitMQ for scalable broadcasting
- **Stream Processing:** Kafka for high-volume event streaming

### Performance and Scalability Resources

- [Scaling SSE Applications](https://www.ably.io/topic/server-sent-events)
- [Real-time Web Technologies](https://www.html5rocks.com/en/tutorials/eventsource/basics/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance-best-practices/)

### Security Considerations

- [OWASP: Real-time Web Apps](https://owasp.org/www-community/attacks/Real-time_Web_Apps)
- [CORS and SSE Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Content Security Policy with SSE](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)

---

**Last Updated:** January 2025

**Difficulty Level:** Intermediate

**Prerequisites:** Understanding of HTTP, JavaScript basics, async programming

**Next Topics to Explore:**
- WebSockets for bidirectional communication
- Message brokers for scaling real-time applications
- Streaming with HTTP/2
- State management with real-time updates
