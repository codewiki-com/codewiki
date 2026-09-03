---
title: JavaScript Observer and Publish-Subscribe Patterns
description: Deep dive into the principles, differences, implementations, and applications of Observer and Publish-Subscribe patterns in modern JavaScript development
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - JavaScript
  - design-patterns
  - observer-pattern
  - publish-subscribe
  - EventEmitter
  - RxJS
  - interview
status: imported
origin: old/src/content/docs/javascript/observer-pubsub.en.md
divergence: 0.226
issues: []
legacy:
  category: JavaScript
  subcategory: Design Patterns
  order: 25
  lastUpdated: 2026-01-07
---

The Observer Pattern and Publish-Subscribe Pattern (Pub/Sub Pattern) are among the most commonly used design patterns in frontend development. They form the foundation for implementing inter-component communication, event handling, and reactive programming. We'll analyze the principles, differences, and implementations of these two patterns in depth, as well as their applications in modern JavaScript frameworks and libraries.

## Concept Explanation

### Observer Pattern

The Observer Pattern is a behavioral design pattern that defines a one-to-many dependency relationship, allowing multiple observer objects to simultaneously monitor a subject object. When the subject's state changes, all observers are notified, enabling them to update automatically.

**Core Roles**:
- **Subject (Observable)**: Maintains a list of observers, provides methods to add and remove observers, and notifies observers when state changes
- **Observer**: Defines an update interface for receiving notifications from the subject

```javascript
// Basic structure of Observer Pattern
class Subject {
  constructor() {
    this.observers = [];
  }

  addObserver(observer) {
    this.observers.push(observer);
  }

  removeObserver(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(data) {
    this.observers.forEach(observer => observer.update(data));
  }
}

class Observer {
  update(data) {
    console.log('Received update:', data);
  }
}
```

### Publish-Subscribe Pattern (Pub/Sub Pattern)

The Publish-Subscribe Pattern is a variant of the Observer Pattern that introduces an "Event Channel" or "Message Broker" as an intermediary layer. Publishers and subscribers don't communicate directly but are decoupled through an event center.

**Core Roles**:
- **Publisher**: Publishes messages to the event center
- **Subscriber**: Subscribes to messages of interest from the event center
- **Event Channel (Event Center)**: Manages message subscription and publishing, achieving decoupling between publishers and subscribers

```javascript
// Basic structure of Publish-Subscribe Pattern
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  emit(eventName, data) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off(eventName, callback) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter(cb => cb !== callback);
    }
  }
}
```

### Key Differences Between the Two Patterns

| Feature | Observer Pattern | Publish-Subscribe Pattern |
|---------|-----------------|--------------------------|
| Coupling | Subject and observers are directly associated | Publishers and subscribers are completely decoupled |
| Intermediary Layer | None | Has event center/message broker |
| Communication Method | Subject directly calls observer methods | Indirect communication through event center |
| Flexibility | Relatively lower | Higher, supports event naming and filtering |
| Use Cases | Scenarios with tight object relationships | Complex systems requiring complete decoupling |

```
Observer Pattern:
┌──────────┐         ┌──────────┐
│  Subject │ ──────► │ Observer │
│          │ ──────► │ Observer │
│          │ ──────► │ Observer │
└──────────┘         └──────────┘

Publish-Subscribe Pattern:
┌───────────┐    ┌─────────────┐    ┌────────────┐
│ Publisher │ ──►│ Event Center│ ──►│ Subscriber │
│           │    │             │ ──►│ Subscriber │
│ Publisher │ ──►│             │ ──►│ Subscriber │
└───────────┘    └─────────────┘    └────────────┘
```

## Core Principles

### How the Observer Pattern Works

The Observer Pattern is implemented based on "dependency injection" and "callback mechanism". Its core principle is:

1. **Registration Phase**: Observers register themselves in the subject's observer list
2. **State Change**: The subject's internal state changes
3. **Notification Phase**: The subject iterates through the observer list and calls each observer's update method
4. **Response Phase**: Observers receive notifications and perform corresponding operations

```javascript
// Observer Pattern execution flow
class WeatherStation {
  constructor() {
    this.observers = [];
    this.temperature = 0;
  }

  // Register observer
  addObserver(observer) {
    this.observers.push(observer);
  }

  // Remove observer
  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  // Notify all observers when state changes
  setTemperature(temp) {
    console.log(`Temperature change: ${this.temperature}°C -> ${temp}°C`);
    this.temperature = temp;
    this.notifyObservers();
  }

  notifyObservers() {
    this.observers.forEach(observer => {
      observer.update(this.temperature);
    });
  }
}

// Observer interface
class TemperatureDisplay {
  constructor(name) {
    this.name = name;
  }

  update(temperature) {
    console.log(`${this.name} displays temperature: ${temperature}°C`);
  }
}

// Usage example
const station = new WeatherStation();
const display1 = new TemperatureDisplay('Living Room Display');
const display2 = new TemperatureDisplay('Bedroom Display');

station.addObserver(display1);
station.addObserver(display2);
station.setTemperature(25); // Both displays will update
```

### How the Publish-Subscribe Pattern Works

The Publish-Subscribe Pattern implements message routing and distribution through an event center:

1. **Subscription Phase**: Subscribers register their interest in specific events with the event center
2. **Publishing Phase**: Publishers send messages to the event center
3. **Distribution Phase**: The event center distributes messages to corresponding subscribers based on event type
4. **Processing Phase**: Subscribers receive and process messages

```javascript
// Detailed Publish-Subscribe Pattern execution flow
class EventBus {
  constructor() {
    // Store events and their corresponding callback function lists
    this.events = new Map();
  }

  // Subscribe to event
  subscribe(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(callback);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(eventName, callback);
    };
  }

  // Publish event
  publish(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback.apply(null, args);
        } catch (error) {
          console.error(`Event handling error [${eventName}]:`, error);
        }
      });
    }
  }

  // Unsubscribe
  unsubscribe(eventName, callback) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}

// Usage example
const eventBus = new EventBus();

// Subscriber A - Subscribe to user login event
eventBus.subscribe('user:login', (user) => {
  console.log('Subscriber A: User logged in', user.name);
});

// Subscriber B - Subscribe to user login event
eventBus.subscribe('user:login', (user) => {
  console.log('Subscriber B: Recording login log', user.name);
});

// Publisher publishes event
eventBus.publish('user:login', { name: 'Tom', id: 1 });
// Output:
// Subscriber A: User logged in Tom
// Subscriber B: Recording login log Tom
```

### Event-Driven Architecture

The Observer/Publish-Subscribe patterns are the foundation of event-driven architecture. In JavaScript, event-driven is ubiquitous:

- **DOM Events**: `element.addEventListener('click', handler)`
- **Node.js Events**: `emitter.on('data', handler)`
- **Framework State Management**: Vue's reactive system, Redux's dispatch/subscribe

```javascript
// Event-driven architecture examples in JavaScript
// 1. DOM Events (browser's native Observer Pattern implementation)
document.querySelector('#btn').addEventListener('click', function(event) {
  console.log('Button clicked');
});

// 2. Node.js EventEmitter
const EventEmitter = require('events');
const emitter = new EventEmitter();

emitter.on('message', (msg) => {
  console.log('Message received:', msg);
});

emitter.emit('message', 'Hello World');
```

## Core Concepts

### Complete EventEmitter Implementation

A fully-featured EventEmitter needs to support the following features:

```javascript
class EventEmitter {
  constructor() {
    this.events = new Map();
    this.maxListeners = 10;
  }

  // Set maximum number of listeners
  setMaxListeners(n) {
    this.maxListeners = n;
    return this;
  }

  // Add event listener
  on(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listeners = this.events.get(eventName);

    // Check listener count
    if (listeners.length >= this.maxListeners) {
      console.warn(`Warning: ${eventName} event has more than ${this.maxListeners} listeners`);
    }

    listeners.push(listener);
    return this;
  }

  // Add one-time listener
  once(eventName, listener) {
    const onceWrapper = (...args) => {
      this.off(eventName, onceWrapper);
      listener.apply(this, args);
    };

    // Save original listener reference for matching during off
    onceWrapper.listener = listener;
    return this.on(eventName, onceWrapper);
  }

  // Remove event listener
  off(eventName, listener) {
    const listeners = this.events.get(eventName);
    if (!listeners) return this;

    const index = listeners.findIndex(
      l => l === listener || l.listener === listener
    );

    if (index > -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.events.delete(eventName);
    }

    return this;
  }

  // Remove all listeners
  removeAllListeners(eventName) {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
    return this;
  }

  // Emit event
  emit(eventName, ...args) {
    const listeners = this.events.get(eventName);
    if (!listeners || listeners.length === 0) {
      return false;
    }

    // Copy array to prevent modification during iteration
    const listenersCopy = [...listeners];
    listenersCopy.forEach(listener => {
      listener.apply(this, args);
    });

    return true;
  }

  // Get event listener list
  listeners(eventName) {
    return this.events.get(eventName) || [];
  }

  // Get event listener count
  listenerCount(eventName) {
    const listeners = this.events.get(eventName);
    return listeners ? listeners.length : 0;
  }

  // Get all event names
  eventNames() {
    return Array.from(this.events.keys());
  }

  // Add listener to the beginning of array
  prependListener(eventName, listener) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).unshift(listener);
    return this;
  }

  // Add one-time listener to the beginning of array
  prependOnceListener(eventName, listener) {
    const onceWrapper = (...args) => {
      this.off(eventName, onceWrapper);
      listener.apply(this, args);
    };
    onceWrapper.listener = listener;
    return this.prependListener(eventName, onceWrapper);
  }
}
```

### Publish-Subscribe with Wildcard Support

In practical applications, wildcard matching is often needed:

```javascript
class WildcardEventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(pattern, callback) {
    if (!this.events.has(pattern)) {
      this.events.set(pattern, []);
    }
    this.events.get(pattern).push(callback);
    return this;
  }

  emit(eventName, ...args) {
    this.events.forEach((callbacks, pattern) => {
      if (this.matchPattern(pattern, eventName)) {
        callbacks.forEach(cb => cb(...args));
      }
    });
  }

  // Wildcard matching
  matchPattern(pattern, eventName) {
    // Exact match
    if (pattern === eventName) return true;

    // * matches single level
    // user.* matches user.login, user.logout
    // ** matches multiple levels
    // user.** matches user.login, user.profile.update

    const patternParts = pattern.split('.');
    const eventParts = eventName.split('.');

    let pi = 0;
    let ei = 0;

    while (pi < patternParts.length && ei < eventParts.length) {
      if (patternParts[pi] === '**') {
        return true; // ** matches all remaining
      }
      if (patternParts[pi] === '*' || patternParts[pi] === eventParts[ei]) {
        pi++;
        ei++;
      } else {
        return false;
      }
    }

    return pi === patternParts.length && ei === eventParts.length;
  }

  off(pattern, callback) {
    const callbacks = this.events.get(pattern);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
    return this;
  }
}

// Usage example
const emitter = new WildcardEventEmitter();

// Subscribe to all user events
emitter.on('user.*', (data) => {
  console.log('User event:', data);
});

// Subscribe to all events
emitter.on('**', (data) => {
  console.log('Any event:', data);
});

emitter.emit('user.login', { name: 'Tom' });     // Triggers user.* and **
emitter.emit('user.logout', { name: 'Tom' });    // Triggers user.* and **
emitter.emit('order.create', { id: 1 });         // Only triggers **
```

### Async Event Handling

Support for async event handling and sequential execution:

```javascript
class AsyncEventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(callback);
    return this;
  }

  // Execute all listeners in parallel
  async emitParallel(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return [];

    return Promise.all(
      callbacks.map(cb => Promise.resolve(cb(...args)))
    );
  }

  // Execute all listeners in serial
  async emitSerial(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return [];

    const results = [];
    for (const cb of callbacks) {
      results.push(await cb(...args));
    }
    return results;
  }

  // Pipeline execution (output of previous becomes input of next)
  async emitPipe(eventName, initialData) {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return initialData;

    let data = initialData;
    for (const cb of callbacks) {
      data = await cb(data);
    }
    return data;
  }

  // Race execution (returns result of fastest completion)
  async emitRace(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    if (!callbacks || callbacks.length === 0) return undefined;

    return Promise.race(
      callbacks.map(cb => Promise.resolve(cb(...args)))
    );
  }

  off(eventName, callback) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
    return this;
  }
}

// Usage example
const asyncEmitter = new AsyncEventEmitter();

asyncEmitter.on('process', async (data) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('Handler 1:', data);
  return data + 10;
});

asyncEmitter.on('process', async (data) => {
  await new Promise(resolve => setTimeout(resolve, 50));
  console.log('Handler 2:', data);
  return data + 20;
});

// Pipeline processing
(async () => {
  const result = await asyncEmitter.emitPipe('process', 0);
  console.log('Final result:', result); // 30
})();
```

### Reactive Observer Pattern

Combining Proxy for automatically triggered reactive system:

```javascript
class ReactiveObserver {
  constructor(data) {
    this.observers = new Map();
    this.data = this.makeReactive(data);
  }

  makeReactive(obj, path = '') {
    const self = this;

    return new Proxy(obj, {
      get(target, key) {
        const value = target[key];
        const currentPath = path ? `${path}.${key}` : key;

        // If it's an object, recursively create proxy
        if (value && typeof value === 'object') {
          return self.makeReactive(value, currentPath);
        }

        return value;
      },

      set(target, key, value) {
        const currentPath = path ? `${path}.${key}` : key;
        const oldValue = target[key];

        if (oldValue !== value) {
          target[key] = value;
          self.notify(currentPath, value, oldValue);
        }

        return true;
      }
    });
  }

  // Watch changes on specific path
  observe(path, callback) {
    if (!this.observers.has(path)) {
      this.observers.set(path, []);
    }
    this.observers.get(path).push(callback);

    return () => {
      const callbacks = this.observers.get(path);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  notify(path, newValue, oldValue) {
    // Notify observers on exact path
    const callbacks = this.observers.get(path);
    if (callbacks) {
      callbacks.forEach(cb => cb(newValue, oldValue, path));
    }

    // Notify observers on parent paths
    const parts = path.split('.');
    while (parts.length > 1) {
      parts.pop();
      const parentPath = parts.join('.');
      const parentCallbacks = this.observers.get(parentPath);
      if (parentCallbacks) {
        parentCallbacks.forEach(cb => cb(newValue, oldValue, path));
      }
    }
  }
}

// Usage example
const state = new ReactiveObserver({
  user: {
    name: 'Tom',
    profile: {
      age: 25
    }
  },
  count: 0
});

// Watch user name changes
state.observe('user.name', (newVal, oldVal) => {
  console.log(`Username changed from "${oldVal}" to "${newVal}"`);
});

// Watch entire user object changes
state.observe('user', (newVal, oldVal, path) => {
  console.log(`User object changed: ${path} = ${newVal}`);
});

state.data.user.name = 'Jerry';
// Output:
// Username changed from "Tom" to "Jerry"
// User object changed: user.name = Jerry

state.data.user.profile.age = 26;
// Output:
// User object changed: user.profile.age = 26
```

## Code Examples

### Example 1: Complete Message Bus Implementation

```javascript
/**
 * Enterprise-grade Message Bus implementation
 * Supports namespaces, priorities, middleware, error handling, etc.
 */
class MessageBus {
  constructor(options = {}) {
    this.events = new Map();
    this.middlewares = [];
    this.errorHandler = options.errorHandler || console.error;
    this.debug = options.debug || false;
  }

  // Add middleware
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  // Subscribe to event with priority support
  subscribe(eventName, callback, options = {}) {
    const { priority = 0, context = null } = options;

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const subscription = {
      callback,
      priority,
      context,
      createdAt: Date.now()
    };

    const listeners = this.events.get(eventName);
    listeners.push(subscription);

    // Sort by priority (higher priority executes first)
    listeners.sort((a, b) => b.priority - a.priority);

    if (this.debug) {
      console.log(`[MessageBus] Subscribe: ${eventName}, priority: ${priority}`);
    }

    // Return unsubscribe function
    return () => this.unsubscribe(eventName, callback);
  }

  // Unsubscribe
  unsubscribe(eventName, callback) {
    const listeners = this.events.get(eventName);
    if (!listeners) return false;

    const index = listeners.findIndex(sub => sub.callback === callback);
    if (index > -1) {
      listeners.splice(index, 1);
      if (this.debug) {
        console.log(`[MessageBus] Unsubscribe: ${eventName}`);
      }
      return true;
    }
    return false;
  }

  // Publish event
  async publish(eventName, payload) {
    if (this.debug) {
      console.log(`[MessageBus] Publish: ${eventName}`, payload);
    }

    // Create message context
    let context = {
      eventName,
      payload,
      timestamp: Date.now(),
      stopped: false
    };

    // Execute middleware
    for (const middleware of this.middlewares) {
      try {
        context = await middleware(context) || context;
        if (context.stopped) {
          if (this.debug) {
            console.log(`[MessageBus] Message stopped by middleware: ${eventName}`);
          }
          return;
        }
      } catch (error) {
        this.errorHandler(error, eventName, 'middleware');
        return;
      }
    }

    const listeners = this.events.get(eventName);
    if (!listeners || listeners.length === 0) {
      if (this.debug) {
        console.log(`[MessageBus] No subscribers: ${eventName}`);
      }
      return;
    }

    // Execute all listeners
    for (const subscription of listeners) {
      try {
        const { callback, context: ctx } = subscription;
        await callback.call(ctx, context.payload, context);
      } catch (error) {
        this.errorHandler(error, eventName, 'listener');
      }
    }
  }

  // Publish and wait for all handlers to complete
  async publishAndWait(eventName, payload) {
    const listeners = this.events.get(eventName);
    if (!listeners) return [];

    const promises = listeners.map(sub =>
      Promise.resolve(sub.callback.call(sub.context, payload))
    );

    return Promise.all(promises);
  }

  // Request-Response pattern
  async request(eventName, payload, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const responseEvent = `${eventName}:response:${Date.now()}`;

      const timer = setTimeout(() => {
        this.unsubscribe(responseEvent, handler);
        reject(new Error(`Request timeout: ${eventName}`));
      }, timeout);

      const handler = (response) => {
        clearTimeout(timer);
        resolve(response);
      };

      this.subscribe(responseEvent, handler);
      this.publish(eventName, { ...payload, responseEvent });
    });
  }

  // Respond to request
  respond(eventName, handler) {
    return this.subscribe(eventName, async (payload) => {
      const { responseEvent, ...data } = payload;
      const response = await handler(data);
      if (responseEvent) {
        this.publish(responseEvent, response);
      }
    });
  }

  // Clear all subscriptions
  clear() {
    this.events.clear();
    if (this.debug) {
      console.log('[MessageBus] Cleared all subscriptions');
    }
  }

  // Get event statistics
  getStats() {
    const stats = {};
    this.events.forEach((listeners, eventName) => {
      stats[eventName] = listeners.length;
    });
    return stats;
  }
}

// Usage example
const bus = new MessageBus({ debug: true });

// Add logging middleware
bus.use(async (context) => {
  console.log(`[Middleware] Processing event: ${context.eventName}`);
  return context;
});

// Add validation middleware
bus.use(async (context) => {
  if (context.eventName.startsWith('admin:') && !context.payload.isAdmin) {
    context.stopped = true;
    console.log('[Middleware] Non-admin operation blocked');
  }
  return context;
});

// Subscribe to event (high priority)
bus.subscribe('user:created', (payload) => {
  console.log('Sending welcome email:', payload.email);
}, { priority: 10 });

// Subscribe to event (low priority)
bus.subscribe('user:created', (payload) => {
  console.log('Recording log:', payload);
}, { priority: 1 });

// Publish event
bus.publish('user:created', {
  id: 1,
  name: 'Tom',
  email: 'tom@example.com'
});

// Request-Response pattern
bus.respond('user:get', async (data) => {
  // Simulate database query
  return { id: data.id, name: 'Tom', email: 'tom@example.com' };
});

(async () => {
  const user = await bus.request('user:get', { id: 1 });
  console.log('Retrieved user:', user);
})();
```

### Example 2: DOM Event Delegation Pattern

```javascript
/**
 * DOM Event Delegation based on Observer Pattern
 */
class EventDelegator {
  constructor(rootElement) {
    this.root = typeof rootElement === 'string'
      ? document.querySelector(rootElement)
      : rootElement;
    this.handlers = new Map();
    this.setupDelegation();
  }

  setupDelegation() {
    // Set up single listener for all supported event types
    const eventTypes = ['click', 'dblclick', 'mouseenter', 'mouseleave',
                        'keydown', 'keyup', 'focus', 'blur', 'input', 'change'];

    eventTypes.forEach(type => {
      this.root.addEventListener(type, (event) => {
        this.handleEvent(type, event);
      }, type === 'focus' || type === 'blur');
    });
  }

  handleEvent(eventType, event) {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;

    // Traverse up from event target to find matching selectors
    let element = event.target;

    while (element && element !== this.root) {
      handlers.forEach((callbacks, selector) => {
        if (element.matches(selector)) {
          callbacks.forEach(cb => {
            cb.call(element, event, element);
          });
        }
      });
      element = element.parentElement;
    }
  }

  // Add delegated event
  on(eventType, selector, callback) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Map());
    }

    const typeHandlers = this.handlers.get(eventType);

    if (!typeHandlers.has(selector)) {
      typeHandlers.set(selector, []);
    }

    typeHandlers.get(selector).push(callback);

    return () => this.off(eventType, selector, callback);
  }

  // Remove delegated event
  off(eventType, selector, callback) {
    const typeHandlers = this.handlers.get(eventType);
    if (!typeHandlers) return;

    const selectorHandlers = typeHandlers.get(selector);
    if (!selectorHandlers) return;

    const index = selectorHandlers.indexOf(callback);
    if (index > -1) {
      selectorHandlers.splice(index, 1);
    }
  }

  // One-time event
  once(eventType, selector, callback) {
    const wrapper = (event, element) => {
      this.off(eventType, selector, wrapper);
      callback.call(element, event, element);
    };
    return this.on(eventType, selector, wrapper);
  }
}

// Usage example
const delegator = new EventDelegator('#app');

// Delegate all button clicks
delegator.on('click', '.btn', function(event) {
  console.log('Button clicked:', this.textContent);
});

// Delegate list item clicks
delegator.on('click', '.list-item', function(event, element) {
  console.log('List item:', element.dataset.id);
});

// Input events
delegator.on('input', 'input[type="text"]', function(event) {
  console.log('Input:', this.value);
});
```

### Example 3: Simple RxJS Observable Implementation

```javascript
/**
 * Simple Observable implementation
 * Demonstrates core concepts of RxJS reactive programming
 */
class Observable {
  constructor(subscribe) {
    this._subscribe = subscribe;
  }

  subscribe(observerOrNext, error, complete) {
    // Normalize observer format
    const observer = typeof observerOrNext === 'function'
      ? { next: observerOrNext, error: error || (() => {}), complete: complete || (() => {}) }
      : observerOrNext;

    // Create subscription
    const subscription = {
      unsubscribed: false,
      unsubscribe() {
        this.unsubscribed = true;
      }
    };

    // Wrap observer with unsubscribe check
    const safeObserver = {
      next: (value) => {
        if (!subscription.unsubscribed) {
          try {
            observer.next(value);
          } catch (err) {
            observer.error(err);
            subscription.unsubscribe();
          }
        }
      },
      error: (err) => {
        if (!subscription.unsubscribed) {
          observer.error(err);
          subscription.unsubscribe();
        }
      },
      complete: () => {
        if (!subscription.unsubscribed) {
          observer.complete();
          subscription.unsubscribe();
        }
      }
    };

    // Execute subscribe function
    this._subscribe(safeObserver);

    return subscription;
  }

  // Creation operators

  // map - transform each value
  map(fn) {
    return new Observable(observer => {
      this.subscribe({
        next: value => observer.next(fn(value)),
        error: err => observer.error(err),
        complete: () => observer.complete()
      });
    });
  }

  // filter - filter values
  filter(predicate) {
    return new Observable(observer => {
      this.subscribe({
        next: value => {
          if (predicate(value)) {
            observer.next(value);
          }
        },
        error: err => observer.error(err),
        complete: () => observer.complete()
      });
    });
  }

  // take - only take first n values
  take(count) {
    return new Observable(observer => {
      let taken = 0;
      const subscription = this.subscribe({
        next: value => {
          if (taken < count) {
            taken++;
            observer.next(value);
            if (taken >= count) {
              observer.complete();
              subscription.unsubscribe();
            }
          }
        },
        error: err => observer.error(err),
        complete: () => observer.complete()
      });
    });
  }

  // debounceTime - debounce
  debounceTime(ms) {
    return new Observable(observer => {
      let timer = null;
      this.subscribe({
        next: value => {
          clearTimeout(timer);
          timer = setTimeout(() => observer.next(value), ms);
        },
        error: err => observer.error(err),
        complete: () => {
          clearTimeout(timer);
          observer.complete();
        }
      });
    });
  }

  // throttleTime - throttle
  throttleTime(ms) {
    return new Observable(observer => {
      let lastTime = 0;
      this.subscribe({
        next: value => {
          const now = Date.now();
          if (now - lastTime >= ms) {
            lastTime = now;
            observer.next(value);
          }
        },
        error: err => observer.error(err),
        complete: () => observer.complete()
      });
    });
  }

  // scan - accumulator
  scan(accumulator, seed) {
    return new Observable(observer => {
      let acc = seed;
      this.subscribe({
        next: value => {
          acc = accumulator(acc, value);
          observer.next(acc);
        },
        error: err => observer.error(err),
        complete: () => observer.complete()
      });
    });
  }

  // Static creation methods

  static from(iterable) {
    return new Observable(observer => {
      try {
        for (const item of iterable) {
          observer.next(item);
        }
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  static fromEvent(element, eventName) {
    return new Observable(observer => {
      const handler = (event) => observer.next(event);
      element.addEventListener(eventName, handler);

      return {
        unsubscribe() {
          element.removeEventListener(eventName, handler);
        }
      };
    });
  }

  static interval(ms) {
    return new Observable(observer => {
      let count = 0;
      const timer = setInterval(() => observer.next(count++), ms);

      return {
        unsubscribe() {
          clearInterval(timer);
        }
      };
    });
  }

  static merge(...observables) {
    return new Observable(observer => {
      let completed = 0;
      const subscriptions = observables.map(obs =>
        obs.subscribe({
          next: value => observer.next(value),
          error: err => observer.error(err),
          complete: () => {
            completed++;
            if (completed === observables.length) {
              observer.complete();
            }
          }
        })
      );

      return {
        unsubscribe() {
          subscriptions.forEach(sub => sub.unsubscribe());
        }
      };
    });
  }
}

// Usage examples
// Basic usage
const numbers$ = Observable.from([1, 2, 3, 4, 5]);
numbers$
  .filter(x => x % 2 === 0)
  .map(x => x * 10)
  .subscribe({
    next: value => console.log(value),
    complete: () => console.log('Complete')
  });
// Output: 20, 40, Complete

// Event stream handling
const input = document.querySelector('#search');
if (input) {
  Observable.fromEvent(input, 'input')
    .map(e => e.target.value)
    .debounceTime(300)
    .filter(text => text.length >= 2)
    .subscribe(searchText => {
      console.log('Search:', searchText);
    });
}

// Timer
const timer$ = Observable.interval(1000)
  .take(5)
  .scan((acc, curr) => acc + curr, 0);

timer$.subscribe({
  next: value => console.log('Accumulated:', value),
  complete: () => console.log('Timer complete')
});
// Output: Accumulated: 0, Accumulated: 1, Accumulated: 3, Accumulated: 6, Accumulated: 10, Timer complete
```

### Example 4: Vue-Style Reactive System

```javascript
/**
 * Vue-style Reactive System
 * Demonstrates Vue 2/3 reactivity principles
 */
class Dep {
  static target = null;

  constructor() {
    this.subscribers = new Set();
  }

  depend() {
    if (Dep.target) {
      this.subscribers.add(Dep.target);
    }
  }

  notify() {
    this.subscribers.forEach(sub => sub());
  }
}

function reactive(obj) {
  // Create dependency collector for each property
  const deps = new Map();

  return new Proxy(obj, {
    get(target, key) {
      // Dependency collection
      if (!deps.has(key)) {
        deps.set(key, new Dep());
      }
      deps.get(key).depend();

      const value = target[key];
      // Recursively handle nested objects
      if (value && typeof value === 'object') {
        return reactive(value);
      }
      return value;
    },

    set(target, key, value) {
      const oldValue = target[key];
      if (oldValue !== value) {
        target[key] = value;
        // Trigger update
        if (deps.has(key)) {
          deps.get(key).notify();
        }
      }
      return true;
    }
  });
}

function watchEffect(effect) {
  const wrappedEffect = () => {
    Dep.target = wrappedEffect;
    effect();
    Dep.target = null;
  };
  wrappedEffect();
}

function computed(getter) {
  let value;
  let dirty = true;

  const effect = () => {
    dirty = true;
  };

  return {
    get value() {
      if (dirty) {
        Dep.target = effect;
        value = getter();
        Dep.target = null;
        dirty = false;
      }
      return value;
    }
  };
}

function watch(source, callback) {
  let oldValue;

  const getter = typeof source === 'function'
    ? source
    : () => source.value;

  const effect = () => {
    const newValue = getter();
    if (newValue !== oldValue) {
      callback(newValue, oldValue);
      oldValue = newValue;
    }
  };

  watchEffect(effect);
}

// Usage example
const state = reactive({
  count: 0,
  name: 'Vue',
  nested: {
    value: 100
  }
});

// Computed property
const double = computed(() => state.count * 2);

// Side effect
watchEffect(() => {
  console.log(`Count: ${state.count}, Double: ${double.value}`);
});

// Watcher
watch(
  () => state.count,
  (newVal, oldVal) => {
    console.log(`count changed from ${oldVal} to ${newVal}`);
  }
);

state.count++; // Automatically triggers update
state.count++; // Automatically triggers update
```

## Best Practices

### Choosing the Right Pattern

```javascript
// Observer Pattern: Suitable for tightly related subject-observer scenarios
class UserModel {
  constructor() {
    this.observers = [];
    this.data = {};
  }

  // Directly notify observers
  setData(newData) {
    this.data = { ...this.data, ...newData };
    this.observers.forEach(obs => obs.update(this.data));
  }
}

// Pub/Sub Pattern: Suitable for complex systems requiring decoupling
const eventBus = new EventEmitter();

// User module
class UserModule {
  login(user) {
    // Login logic...
    eventBus.emit('user:login', user);
  }
}

// Analytics module (completely decoupled)
eventBus.on('user:login', (user) => {
  analytics.track('login', user.id);
});

// Notification module (completely decoupled)
eventBus.on('user:login', (user) => {
  notification.show(`Welcome ${user.name}`);
});
```

### Error Handling Strategy

```javascript
class RobustEventEmitter {
  constructor(options = {}) {
    this.events = new Map();
    this.errorHandler = options.errorHandler || this.defaultErrorHandler;
    this.continueOnError = options.continueOnError !== false;
  }

  defaultErrorHandler(error, eventName, listener) {
    console.error(`[EventEmitter] Error in "${eventName}":`, error);
  }

  on(eventName, listener) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(listener);
    return () => this.off(eventName, listener);
  }

  emit(eventName, ...args) {
    const listeners = this.events.get(eventName);
    if (!listeners) return;

    let hasError = false;

    for (const listener of listeners) {
      try {
        listener(...args);
      } catch (error) {
        hasError = true;
        this.errorHandler(error, eventName, listener);

        if (!this.continueOnError) {
          throw error;
        }
      }
    }

    return !hasError;
  }

  off(eventName, listener) {
    const listeners = this.events.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

// Usage
const emitter = new RobustEventEmitter({
  errorHandler: (error, eventName) => {
    // Can report to error monitoring system
    reportError({ error, eventName, timestamp: Date.now() });
  },
  continueOnError: true // Continue executing other listeners even on error
});
```

### Memory Management

```javascript
class ManagedEventEmitter {
  constructor() {
    this.events = new Map();
    this.subscriptionCount = 0;
    this.maxSubscriptions = 1000;
  }

  on(eventName, callback, options = {}) {
    if (this.subscriptionCount >= this.maxSubscriptions) {
      console.warn('Subscription limit reached, check for memory leaks');
      return null;
    }

    const subscription = {
      callback,
      eventName,
      createdAt: Date.now(),
      context: options.context || null
    };

    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    this.events.get(eventName).add(subscription);
    this.subscriptionCount++;

    // Return trackable unsubscribe function
    const unsubscribe = () => {
      const listeners = this.events.get(eventName);
      if (listeners && listeners.has(subscription)) {
        listeners.delete(subscription);
        this.subscriptionCount--;
      }
    };

    // If lifecycle is specified, auto-unsubscribe
    if (options.lifecycle) {
      options.lifecycle.onDestroy?.(() => unsubscribe());
    }

    return unsubscribe;
  }

  // Diagnostic methods
  getStats() {
    const stats = {
      totalSubscriptions: this.subscriptionCount,
      events: {}
    };

    this.events.forEach((listeners, eventName) => {
      stats.events[eventName] = {
        count: listeners.size,
        subscriptions: Array.from(listeners).map(sub => ({
          createdAt: sub.createdAt,
          age: Date.now() - sub.createdAt
        }))
      };
    });

    return stats;
  }

  // Clean up long-unused subscriptions
  cleanup(maxAge = 3600000) { // Default 1 hour
    const now = Date.now();
    let cleaned = 0;

    this.events.forEach((listeners, eventName) => {
      listeners.forEach(sub => {
        if (now - sub.createdAt > maxAge) {
          listeners.delete(sub);
          this.subscriptionCount--;
          cleaned++;
        }
      });

      if (listeners.size === 0) {
        this.events.delete(eventName);
      }
    });

    return cleaned;
  }
}
```

### Type-Safe Event System (TypeScript)

```typescript
// TypeScript type-safe event system
interface EventMap {
  'user:login': { userId: string; timestamp: number };
  'user:logout': { userId: string };
  'message:received': { from: string; content: string };
  'error': Error;
}

class TypedEventEmitter<Events extends Record<string, unknown>> {
  private events = new Map<keyof Events, Set<(data: unknown) => void>>();

  on<K extends keyof Events>(
    eventName: K,
    callback: (data: Events[K]) => void
  ): () => void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName)!.add(callback as (data: unknown) => void);

    return () => this.off(eventName, callback);
  }

  emit<K extends keyof Events>(eventName: K, data: Events[K]): void {
    const listeners = this.events.get(eventName);
    if (listeners) {
      listeners.forEach(cb => cb(data));
    }
  }

  off<K extends keyof Events>(
    eventName: K,
    callback: (data: Events[K]) => void
  ): void {
    const listeners = this.events.get(eventName);
    if (listeners) {
      listeners.delete(callback as (data: unknown) => void);
    }
  }
}

// Usage
const emitter = new TypedEventEmitter<EventMap>();

// Type-safe - auto-infers parameter types
emitter.on('user:login', (data) => {
  console.log(data.userId); // Type correct
  // console.log(data.name); // Type error
});

// Type-safe - emit parameter type checking
emitter.emit('user:login', { userId: '123', timestamp: Date.now() });
// emitter.emit('user:login', { wrong: 'data' }); // Type error
```

### Modular Organization

```javascript
// events/index.js - Unified event definition and management
export const Events = {
  USER: {
    LOGIN: 'user:login',
    LOGOUT: 'user:logout',
    PROFILE_UPDATE: 'user:profile:update'
  },
  CART: {
    ADD_ITEM: 'cart:add',
    REMOVE_ITEM: 'cart:remove',
    CHECKOUT: 'cart:checkout'
  },
  NOTIFICATION: {
    SHOW: 'notification:show',
    HIDE: 'notification:hide'
  }
};

// Create singleton event bus
class EventBus {
  static instance = null;

  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventEmitter();
    }
    return EventBus.instance;
  }
}

export const eventBus = EventBus.getInstance();

// Usage
import { Events, eventBus } from './events';

// Subscribe
eventBus.on(Events.USER.LOGIN, (user) => {
  console.log('User logged in:', user);
});

// Publish
eventBus.emit(Events.USER.LOGIN, { id: 1, name: 'Tom' });
```

## Common Pitfalls

### Memory Leaks

```javascript
// Bad example: Forgetting to unsubscribe
class LeakyComponent {
  constructor(eventBus) {
    this.eventBus = eventBus;

    // New listener added every time component is created
    eventBus.on('data:update', (data) => {
      this.handleUpdate(data);
    });
  }

  handleUpdate(data) {
    console.log('Update data:', data);
  }

  // No destroy method provided!
}

// Good example: Save reference and clean up at appropriate time
class SafeComponent {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.unsubscribers = [];

    // Save unsubscribe function
    this.unsubscribers.push(
      eventBus.on('data:update', this.handleUpdate.bind(this))
    );
  }

  handleUpdate(data) {
    console.log('Update data:', data);
  }

  // Clean up on destroy
  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}

// Correct usage in React
function MyComponent() {
  useEffect(() => {
    const unsubscribe = eventBus.on('event', handler);

    // Cleanup function
    return () => unsubscribe();
  }, []);
}
```

### `this` Binding Issues

```javascript
// Bad example
class Handler {
  constructor(name) {
    this.name = name;
  }

  handle(data) {
    console.log(`${this.name} handling:`, data);
  }
}

const handler = new Handler('Handler');
eventBus.on('event', handler.handle); // `this` is lost!
eventBus.emit('event', 'data'); // Error: this.name is undefined

// Good examples
// Method 1: Use bind
eventBus.on('event', handler.handle.bind(handler));

// Method 2: Use arrow function
eventBus.on('event', (data) => handler.handle(data));

// Method 3: Define method as arrow function in class
class BetterHandler {
  constructor(name) {
    this.name = name;
  }

  handle = (data) => {
    console.log(`${this.name} handling:`, data);
  }
}
```

### Event Name Conflicts

```javascript
// Bad example: Using simple event names
eventBus.on('update', handler1); // Module A
eventBus.on('update', handler2); // Module B - Conflict!

// Good example: Using namespaces
eventBus.on('moduleA:update', handler1);
eventBus.on('moduleB:update', handler2);

// Better approach: Create scoped event emitters
function createScopedEmitter(namespace, globalEmitter) {
  return {
    on(event, callback) {
      return globalEmitter.on(`${namespace}:${event}`, callback);
    },
    emit(event, data) {
      globalEmitter.emit(`${namespace}:${event}`, data);
    },
    off(event, callback) {
      globalEmitter.off(`${namespace}:${event}`, callback);
    }
  };
}

const moduleAEvents = createScopedEmitter('moduleA', eventBus);
moduleAEvents.on('update', handler1); // Actually 'moduleA:update'
```

### Infinite Loops

```javascript
// Bad example: Triggering same event in listener
eventBus.on('data:change', (data) => {
  // Process data
  const newData = processData(data);

  // Danger! Triggers infinite loop
  eventBus.emit('data:change', newData);
});

// Good example: Use different events or add guards
eventBus.on('data:change', (data) => {
  // Prevent loop
  if (data._processed) return;

  const newData = {
    ...processData(data),
    _processed: true
  };

  // Use different event
  eventBus.emit('data:processed', newData);
});

// Better approach: Clearly distinguish input and output events
eventBus.on('data:raw', (data) => {
  const processed = processData(data);
  eventBus.emit('data:processed', processed);
});
```

### Execution Order Dependency

```javascript
// Bad example: Depending on specific execution order
let value = 0;

eventBus.on('event', () => {
  value = 10;
});

eventBus.on('event', () => {
  console.log(value * 2); // Depends on first handler executing first
});

// Good example: Use priority or explicit flow control
class OrderedEventEmitter extends EventEmitter {
  on(event, callback, priority = 0) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event);
    listeners.push({ callback, priority });
    listeners.sort((a, b) => b.priority - a.priority);

    return () => this.off(event, callback);
  }
}

// Or use async/await to ensure order
eventBus.on('event', async () => {
  const result = await step1();
  eventBus.emit('step1:complete', result);
});

eventBus.on('step1:complete', async (result) => {
  await step2(result);
});
```

## Performance Considerations

### Optimizing Large Numbers of Event Listeners

```javascript
class OptimizedEventEmitter {
  constructor() {
    // Use Map instead of plain object for better performance
    this.events = new Map();
    // Cache event arrays to avoid repeated creation
    this.listenersCache = new Map();
  }

  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set()); // Set's delete operation is O(1)
    }
    this.events.get(eventName).add(callback);
    this.listenersCache.delete(eventName); // Clear cache

    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    let listeners = this.listenersCache.get(eventName);

    if (!listeners) {
      const set = this.events.get(eventName);
      if (!set || set.size === 0) return;

      // Convert to array and cache
      listeners = Array.from(set);
      this.listenersCache.set(eventName, listeners);
    }

    // for loop is faster than forEach
    for (let i = 0; i < listeners.length; i++) {
      listeners[i](data);
    }
  }

  off(eventName, callback) {
    const listeners = this.events.get(eventName);
    if (listeners) {
      listeners.delete(callback);
      this.listenersCache.delete(eventName);
    }
  }
}
```

### Batch Event Processing

```javascript
class BatchEventEmitter {
  constructor(options = {}) {
    this.events = new Map();
    this.pendingEvents = [];
    this.batchSize = options.batchSize || 100;
    this.batchDelay = options.batchDelay || 16; // About one frame
    this.processing = false;
  }

  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(callback);
    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    this.pendingEvents.push({ eventName, data });
    this.scheduleProcessing();
  }

  scheduleProcessing() {
    if (this.processing) return;

    this.processing = true;
    requestAnimationFrame(() => this.processBatch());
  }

  processBatch() {
    const batch = this.pendingEvents.splice(0, this.batchSize);

    for (const { eventName, data } of batch) {
      const listeners = this.events.get(eventName);
      if (listeners) {
        listeners.forEach(cb => cb(data));
      }
    }

    if (this.pendingEvents.length > 0) {
      requestAnimationFrame(() => this.processBatch());
    } else {
      this.processing = false;
    }
  }

  // Process immediately (bypass batching)
  emitImmediate(eventName, data) {
    const listeners = this.events.get(eventName);
    if (listeners) {
      listeners.forEach(cb => cb(data));
    }
  }

  off(eventName, callback) {
    const listeners = this.events.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}
```

### Using WeakMap to Avoid Memory Leaks

```javascript
class WeakEventEmitter {
  constructor() {
    this.events = new Map();
    // Use WeakMap to store association between objects and their listeners
    this.objectListeners = new WeakMap();
  }

  // Associate listener with object; when object is garbage collected, listeners are also cleaned
  onWithContext(eventName, context, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    const boundCallback = callback.bind(context);
    this.events.get(eventName).add(boundCallback);

    // Store association
    if (!this.objectListeners.has(context)) {
      this.objectListeners.set(context, []);
    }
    this.objectListeners.get(context).push({
      eventName,
      callback: boundCallback
    });

    return () => {
      this.events.get(eventName).delete(boundCallback);
    };
  }

  // Clean up all listeners associated with specific object
  cleanupContext(context) {
    const listeners = this.objectListeners.get(context);
    if (listeners) {
      listeners.forEach(({ eventName, callback }) => {
        const eventListeners = this.events.get(eventName);
        if (eventListeners) {
          eventListeners.delete(callback);
        }
      });
    }
  }

  emit(eventName, data) {
    const listeners = this.events.get(eventName);
    if (listeners) {
      listeners.forEach(cb => cb(data));
    }
  }
}
```

### Performance Monitoring

```javascript
class MonitoredEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      emitCount: {},
      emitDuration: {},
      listenerCount: {}
    };
  }

  emit(eventName, ...args) {
    const start = performance.now();

    // Count
    this.metrics.emitCount[eventName] =
      (this.metrics.emitCount[eventName] || 0) + 1;

    super.emit(eventName, ...args);

    // Record duration
    const duration = performance.now() - start;
    if (!this.metrics.emitDuration[eventName]) {
      this.metrics.emitDuration[eventName] = [];
    }
    this.metrics.emitDuration[eventName].push(duration);

    // Only keep last 100 records
    if (this.metrics.emitDuration[eventName].length > 100) {
      this.metrics.emitDuration[eventName].shift();
    }
  }

  on(eventName, callback) {
    const result = super.on(eventName, callback);
    this.metrics.listenerCount[eventName] =
      (this.metrics.listenerCount[eventName] || 0) + 1;
    return result;
  }

  off(eventName, callback) {
    super.off(eventName, callback);
    if (this.metrics.listenerCount[eventName] > 0) {
      this.metrics.listenerCount[eventName]--;
    }
  }

  getMetrics() {
    const result = {};

    for (const eventName in this.metrics.emitDuration) {
      const durations = this.metrics.emitDuration[eventName];
      result[eventName] = {
        emitCount: this.metrics.emitCount[eventName],
        listenerCount: this.metrics.listenerCount[eventName] || 0,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations)
      };
    }

    return result;
  }

  // Identify slow events
  getSlowEvents(threshold = 10) {
    return Object.entries(this.getMetrics())
      .filter(([, stats]) => stats.avgDuration > threshold)
      .sort((a, b) => b[1].avgDuration - a[1].avgDuration);
  }
}
```

## Real-World Scenarios

### Cross-Component Communication

```javascript
// Using event bus for cross-component communication in large applications
// eventBus.js
export const eventBus = new EventEmitter();

// HeaderComponent.js
class HeaderComponent {
  constructor() {
    this.cartCount = 0;

    // Listen for cart changes
    eventBus.on('cart:updated', (cart) => {
      this.cartCount = cart.items.length;
      this.render();
    });
  }

  render() {
    return `<header>Cart (${this.cartCount})</header>`;
  }
}

// ProductComponent.js
class ProductComponent {
  addToCart(product) {
    // Add product to cart...

    // Notify other components
    eventBus.emit('cart:updated', {
      items: this.cartItems,
      total: this.calculateTotal()
    });
  }
}

// CartComponent.js
class CartComponent {
  constructor() {
    eventBus.on('cart:updated', (cart) => {
      this.items = cart.items;
      this.render();
    });
  }
}
```

### State Management

```javascript
// Simple state management based on Publish-Subscribe
class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.emitter = new EventEmitter();
  }

  getState() {
    return { ...this.state };
  }

  setState(updater) {
    const prevState = this.state;
    const newState = typeof updater === 'function'
      ? updater(prevState)
      : { ...prevState, ...updater };

    this.state = newState;

    // Notify all subscribers
    this.emitter.emit('change', {
      prevState,
      nextState: newState
    });

    // Notify specific field subscribers
    for (const key in newState) {
      if (prevState[key] !== newState[key]) {
        this.emitter.emit(`change:${key}`, {
          prevValue: prevState[key],
          nextValue: newState[key]
        });
      }
    }
  }

  subscribe(callback) {
    return this.emitter.on('change', callback);
  }

  subscribeKey(key, callback) {
    return this.emitter.on(`change:${key}`, callback);
  }
}

// Usage example
const store = new Store({
  user: null,
  theme: 'light',
  count: 0
});

// Subscribe to all changes
store.subscribe(({ prevState, nextState }) => {
  console.log('State changed:', prevState, '->', nextState);
});

// Only subscribe to theme changes
store.subscribeKey('theme', ({ nextValue }) => {
  document.body.className = `theme-${nextValue}`;
});

store.setState({ theme: 'dark' });
store.setState(prev => ({ count: prev.count + 1 }));
```

### Plugin System

```javascript
// Event-based plugin system
class PluginSystem {
  constructor() {
    this.plugins = [];
    this.hooks = new EventEmitter();
  }

  // Register plugin
  use(plugin) {
    this.plugins.push(plugin);

    // Call plugin's install method
    if (typeof plugin.install === 'function') {
      plugin.install(this.hooks);
    }

    return this;
  }

  // Trigger hook
  async trigger(hookName, context) {
    const listeners = this.hooks.listeners(hookName);

    for (const listener of listeners) {
      const result = await listener(context);

      // Allow plugins to modify context
      if (result !== undefined) {
        Object.assign(context, result);
      }
    }

    return context;
  }
}

// Define plugins
const loggingPlugin = {
  name: 'logging',
  install(hooks) {
    hooks.on('beforeRequest', (ctx) => {
      console.log(`[${new Date().toISOString()}] Request: ${ctx.url}`);
    });

    hooks.on('afterResponse', (ctx) => {
      console.log(`[${new Date().toISOString()}] Response: ${ctx.status}`);
    });
  }
};

const authPlugin = {
  name: 'auth',
  install(hooks) {
    hooks.on('beforeRequest', (ctx) => {
      // Add auth header
      return {
        headers: {
          ...ctx.headers,
          'Authorization': `Bearer ${getToken()}`
        }
      };
    });
  }
};

// Using plugin system
const system = new PluginSystem();
system.use(loggingPlugin).use(authPlugin);

// Trigger hooks when making requests
async function request(url, options = {}) {
  let ctx = { url, ...options };

  // Trigger before request hook
  ctx = await system.trigger('beforeRequest', ctx);

  // Make request
  const response = await fetch(ctx.url, ctx);

  ctx.status = response.status;
  ctx.response = response;

  // Trigger after response hook
  await system.trigger('afterResponse', ctx);

  return response;
}
```

### Real-Time Data Sync

```javascript
// Real-time sync with WebSocket + event system
class RealtimeSync {
  constructor(wsUrl) {
    this.emitter = new EventEmitter();
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.wsUrl = wsUrl;

    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emitter.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emitter.emit(message.type, message.payload);
        this.emitter.emit('message', message);
      } catch (e) {
        console.error('Message parsing error:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.emitter.emit('disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emitter.emit('error', error);
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`Attempting reconnect in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  // Subscribe to specific message types
  on(type, callback) {
    return this.emitter.on(type, callback);
  }

  // Send message
  send(type, payload) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  // Disconnect
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage example
const sync = new RealtimeSync('wss://api.example.com/ws');

// Monitor connection status
sync.on('connected', () => {
  console.log('Connected to server');
});

// Monitor specific message types
sync.on('user:online', (payload) => {
  console.log('User online:', payload.userId);
});

sync.on('chat:message', (payload) => {
  console.log('Message received:', payload);
});

// Send message
sync.send('chat:message', { content: 'Hello!', to: 'user123' });
```

### Form Validation System

```javascript
// Observer pattern-based form validation
class FormValidator {
  constructor(form) {
    this.form = form;
    this.fields = new Map();
    this.emitter = new EventEmitter();
    this.errors = {};

    this.setupForm();
  }

  setupForm() {
    this.form.addEventListener('submit', (e) => {
      if (!this.validate()) {
        e.preventDefault();
        this.emitter.emit('validation:failed', this.errors);
      } else {
        this.emitter.emit('validation:passed');
      }
    });
  }

  // Register field validation rules
  registerField(fieldName, rules = []) {
    const field = this.form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    this.fields.set(fieldName, { field, rules });

    // Real-time validation
    field.addEventListener('blur', () => {
      this.validateField(fieldName);
    });

    field.addEventListener('input', () => {
      // Clear error state
      if (this.errors[fieldName]) {
        delete this.errors[fieldName];
        this.emitter.emit('field:valid', { fieldName });
      }
    });

    return this;
  }

  validateField(fieldName) {
    const config = this.fields.get(fieldName);
    if (!config) return true;

    const { field, rules } = config;
    const value = field.value;

    for (const rule of rules) {
      const result = rule.validator(value);
      if (!result) {
        this.errors[fieldName] = rule.message;
        this.emitter.emit('field:invalid', {
          fieldName,
          message: rule.message
        });
        return false;
      }
    }

    delete this.errors[fieldName];
    this.emitter.emit('field:valid', { fieldName });
    return true;
  }

  validate() {
    let isValid = true;

    this.fields.forEach((_, fieldName) => {
      if (!this.validateField(fieldName)) {
        isValid = false;
      }
    });

    return isValid;
  }

  // Listen to validation events
  on(eventName, callback) {
    return this.emitter.on(eventName, callback);
  }
}

// Validation rules
const validators = {
  required: (message = 'This field is required') => ({
    validator: (value) => value.trim().length > 0,
    message
  }),

  email: (message = 'Please enter a valid email address') => ({
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),

  minLength: (min, message) => ({
    validator: (value) => value.length >= min,
    message: message || `At least ${min} characters required`
  }),

  pattern: (regex, message = 'Invalid format') => ({
    validator: (value) => regex.test(value),
    message
  })
};

// Usage example
const form = document.querySelector('#registerForm');
const validator = new FormValidator(form);

validator
  .registerField('username', [
    validators.required(),
    validators.minLength(3)
  ])
  .registerField('email', [
    validators.required(),
    validators.email()
  ])
  .registerField('password', [
    validators.required(),
    validators.minLength(8, 'Password must be at least 8 characters'),
    validators.pattern(/[A-Z]/, 'Password must contain an uppercase letter')
  ]);

// Listen to validation results
validator.on('field:invalid', ({ fieldName, message }) => {
  const errorEl = document.querySelector(`[data-error="${fieldName}"]`);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
});

validator.on('field:valid', ({ fieldName }) => {
  const errorEl = document.querySelector(`[data-error="${fieldName}"]`);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
});

validator.on('validation:failed', (errors) => {
  console.log('Validation failed:', errors);
});
```

## Interview Key Points

### Common Interview Questions

**1. What's the difference between Observer Pattern and Publish-Subscribe Pattern?**

Answer: The main differences are in coupling degree and presence of an intermediary layer:
- Observer Pattern: Subject and Observer are directly associated; Subject directly calls Observer methods
- Pub/Sub Pattern: Decoupled through event center; Publisher and Subscriber don't know about each other

```javascript
// Observer Pattern: Direct call
subject.addObserver(observer);
subject.notify(); // Directly calls observer.update()

// Pub/Sub: Through intermediary
eventBus.subscribe('event', handler);
eventBus.publish('event', data); // Distributed through event center
```

**2. Write an EventEmitter by hand**

```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(cb => cb(...args));
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}
```

**3. How to avoid memory leaks in Publish-Subscribe pattern?**

Answer:
- Unsubscribe all subscriptions when component is destroyed
- Use WeakMap to store object-associated listeners
- Set listener limit and emit warnings
- Provide cleanup methods and diagnostic tools

```javascript
// Best practice in React
useEffect(() => {
  const unsubscribe = eventBus.on('event', handler);
  return () => unsubscribe(); // Cleanup
}, []);
```

**4. Implement an EventEmitter that supports `once`**

```javascript
class EventEmitter {
  // ...other methods

  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback.apply(this, args);
    };
    wrapper.listener = callback; // Save original reference
    this.on(event, wrapper);
  }

  off(event, callback) {
    const listeners = this.events[event];
    if (!listeners) return;

    this.events[event] = listeners.filter(
      l => l !== callback && l.listener !== callback
    );
  }
}
```

**5. Explain Observable and Observer in RxJS**

Answer:
- Observable: Represents a collection of values or event stream
- Observer: Contains three methods: next, error, complete
- Subscription: Can be used to unsubscribe
- Operators: Used to transform, filter, combine data streams

```javascript
import { Observable } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';

const observable = new Observable(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.complete();
});

observable.pipe(
  filter(x => x > 1),
  map(x => x * 2)
).subscribe({
  next: value => console.log(value),
  complete: () => console.log('Complete')
});
```

**6. How does Vue's reactive system utilize Observer Pattern?**

Answer: Vue uses dependency collection (Dep) and observers (Watcher) to implement reactivity:
- Dep: Dependency collector; each reactive property has a Dep
- Watcher: Observers including render Watcher, computed Watcher, user Watcher
- Collect dependencies in getter, trigger updates in setter

```javascript
// Vue 2 simplified principle
class Dep {
  constructor() {
    this.subs = [];
  }

  depend() {
    if (Dep.target) {
      this.subs.push(Dep.target);
    }
  }

  notify() {
    this.subs.forEach(watcher => watcher.update());
  }
}

function defineReactive(obj, key, val) {
  const dep = new Dep();

  Object.defineProperty(obj, key, {
    get() {
      dep.depend(); // Collect dependency
      return val;
    },
    set(newVal) {
      val = newVal;
      dep.notify(); // Trigger update
    }
  });
}
```

### Interview Answer Tips

When asked about Observer/Publish-Subscribe patterns, answer from these perspectives:

1. **Definition and Differences**: Clearly distinguish between the two patterns
2. **Implementation Principles**: Be able to write basic implementations by hand
3. **Application Scenarios**: DOM events, framework principles, component communication
4. **Pros and Cons**: Decoupling vs debugging difficulty, flexibility vs performance overhead
5. **Practical Experience**: Explain usage scenarios combined with project experience

## Further Reading

### Official Resources

- [Node.js EventEmitter Documentation](https://nodejs.org/api/events.html)
- [RxJS Official Documentation](https://rxjs.dev/)
- [Vue.js Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [MDN - EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)

### Recommended Books

- "JavaScript Design Patterns and Development Practices" - Zeng Tan
- "Learning JavaScript Design Patterns" - Addy Osmani
- "RxJS in Action" - Paul Daniels

### Related Libraries

- **mitt** - Lightweight EventEmitter (200b)
- **eventemitter3** - High-performance EventEmitter
- **RxJS** - Reactive programming library
- **@vue/reactivity** - Vue 3 reactivity core

### Advanced Topics

- Reactive programming and functional programming
- Event Sourcing
- CQRS (Command Query Responsibility Segregation)
- Message Queues (RabbitMQ, Kafka)

## Summary

The Observer Pattern and Publish-Subscribe Pattern are indispensable design patterns in modern JavaScript development. Understanding these two patterns helps you better use existing frameworks and libraries, and design more loosely coupled, maintainable system architectures.

**Core Takeaways**:

1. **Observer Pattern**: Subject and Observer are directly associated, suitable for simple dependency relationships
2. **Publish-Subscribe Pattern**: Decoupled through event center, suitable for complex component communication
3. **EventEmitter**: Node.js-style event emitter, a typical implementation of Pub/Sub pattern
4. **RxJS**: Reactive programming library, abstracts event streams as Observable
5. **Memory Management**: Always remember to unsubscribe to avoid memory leaks
6. **Performance Optimization**: Consider batch processing, caching, and other optimization strategies for large numbers of events

**Practical Suggestions**:

- Prefer Publish-Subscribe pattern for scenarios requiring decoupling
- Always clean up all subscriptions when components are destroyed
- Use TypeScript to enhance type safety
- Add namespaces to events to avoid conflicts
- Add performance monitoring in production environments

With these patterns, you can build more flexible, scalable JavaScript applications.
