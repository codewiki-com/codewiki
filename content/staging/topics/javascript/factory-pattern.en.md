---
title: JavaScript Factory Pattern Complete Guide
description: "Deep dive into JavaScript factory pattern: Simple Factory, Factory Method, Abstract Factory with practical examples and real-world applications"
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - JavaScript
  - Design Patterns
  - Factory Pattern
  - Creational Patterns
  - OOP
status: imported
origin: old/src/content/docs/javascript/factory-pattern.en.md
divergence: 0.149
issues: []
legacy:
  category: JavaScript
  subcategory: Design Patterns
  order: 18
  lastUpdated: 2026-01-07
---

The Factory Pattern is one of the most commonly used creational design patterns in software development. It provides a way to create objects while decoupling the creation logic from the usage logic, making code more flexible, maintainable, and extensible. This comprehensive guide explores factory patterns in JavaScript with practical examples and real-world scenarios.

## Concept Introduction

### What is the Factory Pattern?

The Factory Pattern is a creational design pattern that provides an interface for creating objects while allowing the client code to delegate the instantiation logic. The core idea is to **encapsulate object creation logic**, keeping client code independent of the specific classes being instantiated.

Rather than directly using `new` to create objects, you ask a factory to create them for you:

```javascript
// Without factory (tightly coupled)
const userPlain = new User({ type: 'admin', name: 'Alice' });
const userAdmin = new AdminUser({ name: 'Alice' });

// With factory (loosely coupled)
const user = UserFactory.create('admin', { name: 'Alice' });
```

### Historical Context

The factory pattern concept originates from the classic "Design Patterns: Elements of Reusable Object-Oriented Software" (Gang of Four, 1994). The book identifies two main factory-related patterns:

- **Factory Method Pattern**: Defines an interface for creating objects, letting subclasses decide which class to instantiate
- **Abstract Factory Pattern**: Provides an interface for creating families of related objects

In the JavaScript community, due to the language's dynamic nature, a simpler variant called **Simple Factory** has become widely used.

### Problems the Factory Pattern Solves

| Problem | Solution |
|---------|----------|
| Object creation logic is complex | Encapsulate logic in a factory |
| Creation logic scattered across codebase | Centralize object creation |
| Client code tightly coupled to concrete classes | Client depends only on interfaces |
| Need to create different objects based on conditions | Factory returns appropriate type |
| Object creation requires complex configuration | Factory handles setup logic |

### Factory Pattern Family Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Factory Pattern Family                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌─────────────┐   ┌────────────────────┐   │
│  │ Simple       │   │ Factory     │   │ Abstract Factory   │   │
│  │ Factory      │   │ Method      │   │                    │   │
│  └──────────────┘   └─────────────┘   └────────────────────┘   │
│        │                 │                     │                │
│        ▼                 ▼                     ▼                │
│   Single factory    One factory per    Creates family of       │
│   creates all       product type       related objects         │
│   products                                                      │
│                                                                 │
│   Complexity: ★☆☆  Complexity: ★★☆  Complexity: ★★★         │
│   Flexibility: ★☆☆ Flexibility: ★★☆ Flexibility: ★★★        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Principles

### Simple Factory Pattern

The Simple Factory is the most straightforward implementation, though technically not one of the GoF patterns. It's widely used in JavaScript due to its simplicity.

**Structure:**

```javascript
// Product interface (base class or type)
class DatabaseConnector {
  connect() {
    throw new Error('connect() must be implemented');
  }

  query(sql) {
    throw new Error('query() must be implemented');
  }
}

// Concrete products
class MySQLConnector extends DatabaseConnector {
  connect() {
    console.log('Connecting to MySQL...');
  }

  query(sql) {
    return `MySQL: ${sql}`;
  }
}

class PostgresConnector extends DatabaseConnector {
  connect() {
    console.log('Connecting to PostgreSQL...');
  }

  query(sql) {
    return `PostgreSQL: ${sql}`;
  }
}

class MongoConnector extends DatabaseConnector {
  connect() {
    console.log('Connecting to MongoDB...');
  }

  query(query) {
    return `MongoDB: ${JSON.stringify(query)}`;
  }
}

// Simple Factory
class DatabaseFactory {
  static create(type, config) {
    switch (type.toLowerCase()) {
      case 'mysql':
        return new MySQLConnector();
      case 'postgres':
        return new PostgresConnector();
      case 'mongodb':
        return new MongoConnector();
      default:
        throw new Error(`Unknown database type: ${type}`);
    }
  }
}

// Usage
const db = DatabaseFactory.create('mysql');
db.connect();
console.log(db.query('SELECT * FROM users'));
```

**Advantages:**
- Simple to understand and implement
- Centralizes creation logic
- Easy to add new types

**Disadvantages:**
- Factory method becomes bloated as more types are added
- All creation logic in one place (tight coupling)
- Violates Single Responsibility Principle

### Factory Method Pattern

Factory Method delegates the instantiation to subclasses, making the pattern more flexible and extensible.

**Structure:**

```javascript
// Abstract creator
class PaymentProcessorFactory {
  abstract() {
    throw new Error('createPaymentProcessor() must be implemented');
  }

  processPayment(amount) {
    const processor = this.createPaymentProcessor();
    return processor.process(amount);
  }

  createPaymentProcessor() {
    throw new Error('createPaymentProcessor() must be implemented');
  }
}

// Concrete product
class PayPalPaymentProcessor {
  process(amount) {
    console.log(`Processing ${amount} via PayPal`);
    return { success: true, gateway: 'PayPal', amount };
  }
}

class StripePaymentProcessor {
  process(amount) {
    console.log(`Processing ${amount} via Stripe`);
    return { success: true, gateway: 'Stripe', amount };
  }
}

// Concrete creators
class PayPalPaymentFactory extends PaymentProcessorFactory {
  createPaymentProcessor() {
    return new PayPalPaymentProcessor();
  }
}

class StripePaymentFactory extends PaymentProcessorFactory {
  createPaymentProcessor() {
    return new StripePaymentProcessor();
  }
}

// Usage
const paypalFactory = new PayPalPaymentFactory();
paypalFactory.processPayment(99.99);

const stripeFactory = new StripePaymentFactory();
stripeFactory.processPayment(49.99);
```

**Advantages:**
- Decouples creator from concrete products
- Follows Open/Closed Principle
- Easy to extend with new types
- Each type has its own factory

**Disadvantages:**
- More complex than Simple Factory
- Requires creating multiple factory classes
- Can lead to class explosion with many types

### Abstract Factory Pattern

Abstract Factory creates families of related objects without specifying their concrete classes.

**Structure:**

```javascript
// Abstract UI components
class Button {
  render() {
    throw new Error('render() must be implemented');
  }
}

class TextInput {
  render() {
    throw new Error('render() must be implemented');
  }
}

class Dialog {
  render() {
    throw new Error('render() must be implemented');
  }
}

// Windows UI components
class WindowsButton extends Button {
  render() {
    return '<button style="windows">Click me</button>';
  }
}

class WindowsInput extends TextInput {
  render() {
    return '<input style="windows" />';
  }
}

class WindowsDialog extends Dialog {
  render() {
    return '<div style="windows">Dialog</div>';
  }
}

// macOS UI components
class MacButton extends Button {
  render() {
    return '<button style="mac">Click me</button>';
  }
}

class MacInput extends TextInput {
  render() {
    return '<input style="mac" />';
  }
}

class MacDialog extends Dialog {
  render() {
    return '<div style="mac">Dialog</div>';
  }
}

// Abstract UI Factory
class UIFactory {
  createButton() {
    throw new Error('createButton() must be implemented');
  }

  createInput() {
    throw new Error('createInput() must be implemented');
  }

  createDialog() {
    throw new Error('createDialog() must be implemented');
  }
}

// Concrete factories
class WindowsUIFactory extends UIFactory {
  createButton() {
    return new WindowsButton();
  }

  createInput() {
    return new WindowsInput();
  }

  createDialog() {
    return new WindowsDialog();
  }
}

class MacUIFactory extends UIFactory {
  createButton() {
    return new MacButton();
  }

  createInput() {
    return new MacInput();
  }

  createDialog() {
    return new MacDialog();
  }
}

// Usage
function createUI(factory) {
  const button = factory.createButton();
  const input = factory.createInput();
  const dialog = factory.createDialog();

  return { button, input, dialog };
}

const windowsUI = createUI(new WindowsUIFactory());
const macUI = createUI(new MacUIFactory());

console.log(windowsUI.button.render());
console.log(macUI.button.render());
```

**Advantages:**
- Ensures consistency among related products
- Isolates concrete classes
- Makes switching between families easy
- Good for theming and platform-specific UI

**Disadvantages:**
- High complexity
- Many classes to manage
- Difficult to extend with new product types

## Key Points

- **Encapsulation**: Factory patterns hide creation complexity from client code
- **Loose Coupling**: Client code depends on interfaces, not concrete implementations
- **Centralization**: Object creation logic is centralized in one location
- **Extensibility**: New types can be added with minimal changes to existing code
- **Consistency**: Abstract Factory ensures related objects work well together
- **Flexibility**: Factory Method allows subclasses to override object creation
- **DRY Principle**: Factory eliminates duplication of object creation code
- **Type Agnostic**: JavaScript's dynamic nature allows for simple factory implementations
- **Configuration**: Factories can accept configuration to customize products
- **Validation**: Factories can validate inputs before creating objects

## Code Examples

### E-Commerce Product Factory

```javascript
// Product base class
class Product {
  constructor(name, price) {
    this.name = name;
    this.price = price;
    this.createdAt = new Date();
  }

  getPrice() {
    return this.price;
  }

  getDescription() {
    throw new Error('getDescription() must be implemented');
  }
}

// Concrete products
class PhysicalProduct extends Product {
  constructor(name, price, weight, dimensions) {
    super(name, price);
    this.weight = weight;
    this.dimensions = dimensions;
  }

  getDescription() {
    return `${this.name} (Physical) - Weight: ${this.weight}kg`;
  }

  calculateShipping() {
    return this.weight * 5; // $5 per kg
  }
}

class DigitalProduct extends Product {
  constructor(name, price, fileSize, fileFormat) {
    super(name, price);
    this.fileSize = fileSize;
    this.fileFormat = fileFormat;
  }

  getDescription() {
    return `${this.name} (Digital) - ${this.fileFormat}`;
  }

  calculateShipping() {
    return 0; // Free shipping for digital products
  }
}

class ServiceProduct extends Product {
  constructor(name, price, duration, serviceName) {
    super(name, price);
    this.duration = duration;
    this.serviceName = serviceName;
  }

  getDescription() {
    return `${this.name} - ${this.serviceName} (${this.duration} hours)`;
  }

  calculateShipping() {
    return 0; // Services have no shipping
  }
}

// Product Factory
class ProductFactory {
  static create(type, data) {
    switch (type) {
      case 'physical':
        return new PhysicalProduct(
          data.name,
          data.price,
          data.weight,
          data.dimensions
        );

      case 'digital':
        return new DigitalProduct(
          data.name,
          data.price,
          data.fileSize,
          data.fileFormat
        );

      case 'service':
        return new ServiceProduct(
          data.name,
          data.price,
          data.duration,
          data.serviceName
        );

      default:
        throw new Error(`Unknown product type: ${type}`);
    }
  }
}

// Usage
const laptop = ProductFactory.create('physical', {
  name: 'MacBook Pro',
  price: 1999,
  weight: 1.6,
  dimensions: '34x24x1.6cm'
});

const ebook = ProductFactory.create('digital', {
  name: 'JavaScript Guide',
  price: 29.99,
  fileSize: '5MB',
  fileFormat: 'PDF'
});

const consulting = ProductFactory.create('service', {
  name: 'Tech Consulting',
  price: 150,
  duration: 2,
  serviceName: 'Architecture Design'
});

console.log(laptop.getDescription());
console.log('Shipping:', laptop.calculateShipping());

console.log(ebook.getDescription());
console.log('Shipping:', ebook.calculateShipping());

console.log(consulting.getDescription());
console.log('Shipping:', consulting.calculateShipping());
```

### HTTP Client Factory

```javascript
class HTTPClient {
  get(url) {
    throw new Error('get() must be implemented');
  }

  post(url, data) {
    throw new Error('post() must be implemented');
  }

  setAuthToken(token) {
    throw new Error('setAuthToken() must be implemented');
  }
}

// Fetch-based HTTP client
class FetchHTTPClient extends HTTPClient {
  constructor() {
    super();
    this.baseURL = '';
    this.authToken = null;
    this.defaultHeaders = { 'Content-Type': 'application/json' };
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  getHeaders() {
    const headers = { ...this.defaultHeaders };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  async get(url) {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return response.json();
  }

  async post(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// Axios-based HTTP client
class AxiosHTTPClient extends HTTPClient {
  constructor() {
    super();
    this.baseURL = '';
    this.authToken = null;
    this.defaultHeaders = { 'Content-Type': 'application/json' };
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  getHeaders() {
    const headers = { ...this.defaultHeaders };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  async get(url) {
    // Simulated axios call
    return { data: await this._mockRequest('GET', url) };
  }

  async post(url, data) {
    // Simulated axios call
    return { data: await this._mockRequest('POST', url, data) };
  }

  async _mockRequest(method, url, data) {
    console.log(`${method} ${url}`);
    if (data) console.log('Data:', data);
    return { success: true };
  }
}

// HTTP Client Factory
class HTTPClientFactory {
  static create(type, config = {}) {
    const client = type === 'fetch'
      ? new FetchHTTPClient()
      : new AxiosHTTPClient();

    if (config.baseURL) client.baseURL = config.baseURL;
    if (config.authToken) client.setAuthToken(config.authToken);

    return client;
  }
}

// Usage
const fetchClient = HTTPClientFactory.create('fetch', {
  baseURL: 'https://api.example.com',
  authToken: 'token123'
});

fetchClient.get('https://api.example.com/users');
fetchClient.post('https://api.example.com/users', { name: 'Alice' });
```

### Logger Factory

```javascript
class Logger {
  log(level, message, meta) {
    throw new Error('log() must be implemented');
  }
}

class ConsoleLogger extends Logger {
  log(level, message, meta) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta || '');
  }
}

class FileLogger extends Logger {
  constructor(filename) {
    super();
    this.filename = filename;
    this.logs = [];
  }

  log(level, message, meta) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      meta
    };
    this.logs.push(logEntry);
    console.log(`Logged to ${this.filename}:`, logEntry);
  }

  getLogs() {
    return this.logs;
  }
}

class RemoteLogger extends Logger {
  constructor(endpoint) {
    super();
    this.endpoint = endpoint;
  }

  async log(level, message, meta) {
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta
    };

    try {
      // Simulate sending to remote endpoint
      console.log(`Sending to ${this.endpoint}:`, logData);
    } catch (error) {
      console.error('Failed to send log:', error);
    }
  }
}

// Logger Factory
class LoggerFactory {
  static create(type, config = {}) {
    switch (type) {
      case 'console':
        return new ConsoleLogger();

      case 'file':
        return new FileLogger(config.filename || 'app.log');

      case 'remote':
        return new RemoteLogger(config.endpoint || 'https://logs.example.com');

      default:
        throw new Error(`Unknown logger type: ${type}`);
    }
  }
}

// Usage
const consoleLogger = LoggerFactory.create('console');
consoleLogger.log('info', 'Application started');

const fileLogger = LoggerFactory.create('file', { filename: 'debug.log' });
fileLogger.log('debug', 'Processing user data', { userId: 123 });

const remoteLogger = LoggerFactory.create('remote', {
  endpoint: 'https://api.loggly.com'
});
remoteLogger.log('error', 'Critical error occurred', { code: 500 });
```

## Best Practices

### Use Clear Naming Conventions

```javascript
// Good: Clear naming indicates factory purpose
class UserRepositoryFactory {
  static create(type) { }
}

const userRepo = UserRepositoryFactory.create('mongodb');

// Poor: Unclear naming
class Factory {
  static create(type) { }
}

const obj = Factory.create('mongodb');
```

### Validate Inputs and Throw Meaningful Errors

```javascript
class DatabaseFactory {
  static create(type, config) {
    // Validate type
    if (!type || typeof type !== 'string') {
      throw new TypeError('Type must be a non-empty string');
    }

    // Validate config
    if (config && typeof config !== 'object') {
      throw new TypeError('Config must be an object');
    }

    const supportedTypes = ['mysql', 'postgres', 'mongodb'];
    if (!supportedTypes.includes(type.toLowerCase())) {
      throw new Error(
        `Unsupported database type: ${type}. ` +
        `Supported types: ${supportedTypes.join(', ')}`
      );
    }

    // Create and return instance
    // ...
  }
}
```

### Support Configuration Objects

```javascript
class DataStoreFactory {
  static create(type, options = {}) {
    const defaults = {
      timeout: 5000,
      retries: 3,
      debug: false,
      ...options
    };

    switch (type) {
      case 'redis':
        return new RedisDataStore(defaults);
      case 'memcached':
        return new MemcachedDataStore(defaults);
      default:
        throw new Error(`Unknown data store: ${type}`);
    }
  }
}

const store = DataStoreFactory.create('redis', {
  timeout: 10000,
  debug: true
});
```

### Use Static Methods for Simple Factories

```javascript
// Prefer static methods for simple factories
class UserFactory {
  static createAdmin(data) {
    return new User({ ...data, role: 'admin' });
  }

  static createGuest(data) {
    return new User({ ...data, role: 'guest' });
  }

  static createModerator(data) {
    return new User({ ...data, role: 'moderator' });
  }
}

const admin = UserFactory.createAdmin({ name: 'Alice' });
const guest = UserFactory.createGuest({ name: 'Bob' });
```

### Combine with Singleton Pattern

```javascript
class CacheFactory {
  static getInstance() {
    if (!this.instance) {
      this.instance = new CacheStore();
    }
    return this.instance;
  }
}

// Always returns the same instance
const cache1 = CacheFactory.getInstance();
const cache2 = CacheFactory.getInstance();
console.log(cache1 === cache2); // true
```

### Document Factory Methods

```javascript
class NotificationFactory {
  /**
   * Creates a notification instance based on the specified type.
   *
   * @param {string} type - The notification type ('email', 'sms', 'push')
   * @param {Object} config - Configuration object for the notification
   * @param {string} config.recipient - The recipient of the notification
   * @param {string} config.message - The message content
   * @param {Object} config.metadata - Optional metadata
   *
   * @returns {Notification} The created notification instance
   * @throws {Error} If type is not supported or required config is missing
   *
   * @example
   * const notification = NotificationFactory.create('email', {
   *   recipient: 'user@example.com',
   *   message: 'Welcome to our service'
   * });
   */
  static create(type, config) {
    // Implementation...
  }
}
```

## Common Pitfalls

### Over-Engineering with Factory Method

```javascript
// Bad: Using Factory Method for simple cases
class SimpleValueFactory {
  createValue() {
    throw new Error('createValue() must be implemented');
  }
}

class NumberFactory extends SimpleValueFactory {
  createValue() {
    return 42;
  }
}

// Good: Simple factory for simple cases
class SimpleFactory {
  static createNumber() {
    return 42;
  }
}
```

### Tight Coupling in Factory Implementation

```javascript
// Bad: Factory depends on concrete implementations
class ProductFactory {
  create(type) {
    if (type === 'laptop') {
      return new Laptop(); // Direct dependency
    }
    if (type === 'phone') {
      return new Phone(); // Direct dependency
    }
  }
}

// Good: Factory registration pattern
class ProductFactory {
  constructor() {
    this.registry = new Map();
  }

  register(type, creator) {
    this.registry.set(type, creator);
  }

  create(type, ...args) {
    const creator = this.registry.get(type);
    if (!creator) {
      throw new Error(`Unknown type: ${type}`);
    }
    return creator(...args);
  }
}

const factory = new ProductFactory();
factory.register('laptop', (config) => new Laptop(config));
factory.register('phone', (config) => new Phone(config));
```

### Ignoring Initialization Logic

```javascript
// Bad: Factory doesn't handle initialization
class ConnectionFactory {
  static create(type) {
    return new DatabaseConnection(type);
  }
}

const conn = ConnectionFactory.create('mysql');
conn.connect(); // Must be called separately

// Good: Factory handles full initialization
class ConnectionFactory {
  static async create(type, config) {
    const conn = new DatabaseConnection(type);
    await conn.connect(config);
    return conn;
  }
}

const conn = await ConnectionFactory.create('mysql', { host: 'localhost' });
// Connection is ready to use
```

### Making Factory Decisions in Client Code

```javascript
// Bad: Client code makes type decisions
function getUser(id, databaseType) {
  let repository;
  if (databaseType === 'mongodb') {
    repository = new MongoUserRepository();
  } else if (databaseType === 'postgres') {
    repository = new PostgresUserRepository();
  }
  return repository.findById(id);
}

// Good: Factory makes type decisions
function getUser(id) {
  const repository = UserRepositoryFactory.create();
  return repository.findById(id);
}
```

### Not Handling Invalid Inputs

```javascript
// Bad: No validation
class ConfigFactory {
  static create(type) {
    switch (type) {
      case 'dev': return new DevConfig();
      case 'prod': return new ProdConfig();
    }
    // Returns undefined for invalid types
  }
}

// Good: Proper validation
class ConfigFactory {
  static create(type) {
    const validTypes = ['dev', 'prod', 'test'];

    if (!type || !validTypes.includes(type)) {
      throw new Error(
        `Invalid environment: ${type}. Valid options: ${validTypes.join(', ')}`
      );
    }

    const configMap = {
      'dev': () => new DevConfig(),
      'prod': () => new ProdConfig(),
      'test': () => new TestConfig()
    };

    return configMap[type]();
  }
}
```

## Performance Considerations

### Object Pooling

```javascript
class ConnectionPool {
  constructor(factory, size = 10) {
    this.factory = factory;
    this.available = [];
    this.inUse = new Set();

    // Pre-create connections
    for (let i = 0; i < size; i++) {
      this.available.push(factory.create());
    }
  }

  acquire() {
    if (this.available.length === 0) {
      throw new Error('No available connections');
    }

    const connection = this.available.pop();
    this.inUse.add(connection);
    return connection;
  }

  release(connection) {
    if (this.inUse.has(connection)) {
      this.inUse.delete(connection);
      this.available.push(connection);
    }
  }

  size() {
    return this.inUse.size + this.available.length;
  }
}

// Usage
class ConnectionFactory {
  create() {
    return new DatabaseConnection();
  }
}

const pool = new ConnectionPool(new ConnectionFactory(), 20);
const conn = pool.acquire();
// Use connection...
pool.release(conn);
```

### Lazy Initialization

```javascript
class ServiceFactory {
  constructor() {
    this.services = new Map();
  }

  create(type) {
    // Return cached instance if exists
    if (this.services.has(type)) {
      return this.services.get(type);
    }

    // Create on first access
    let service;
    switch (type) {
      case 'email':
        service = new EmailService();
        break;
      case 'sms':
        service = new SMSService();
        break;
      default:
        throw new Error(`Unknown service: ${type}`);
    }

    this.services.set(type, service);
    return service;
  }
}
```

### Caching Strategies

```javascript
class CachedFactory {
  constructor(factory, cacheTime = 60000) {
    this.factory = factory;
    this.cache = new Map();
    this.cacheTime = cacheTime;
    this.timestamps = new Map();
  }

  create(type, config) {
    const key = JSON.stringify({ type, config });
    const now = Date.now();

    // Check cache validity
    if (this.cache.has(key)) {
      const cachedTime = this.timestamps.get(key);
      if (now - cachedTime < this.cacheTime) {
        return this.cache.get(key);
      }
      // Cache expired
      this.cache.delete(key);
      this.timestamps.delete(key);
    }

    // Create new instance
    const instance = this.factory.create(type, config);
    this.cache.set(key, instance);
    this.timestamps.set(key, now);

    return instance;
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }
}
```

## Real-world Scenarios

### Framework Component Registration

```javascript
class ComponentFactory {
  constructor() {
    this.components = new Map();
  }

  register(name, ComponentClass) {
    this.components.set(name, ComponentClass);
  }

  create(name, props = {}) {
    const ComponentClass = this.components.get(name);

    if (!ComponentClass) {
      throw new Error(`Component not found: ${name}`);
    }

    return new ComponentClass(props);
  }
}

// Usage in a framework
const componentFactory = new ComponentFactory();

// Register built-in components
componentFactory.register('button', ButtonComponent);
componentFactory.register('input', InputComponent);
componentFactory.register('card', CardComponent);

// User-defined component
class CustomModal {
  constructor(props) {
    this.props = props;
  }
}

componentFactory.register('modal', CustomModal);

// Create components
const button = componentFactory.create('button', { text: 'Click me' });
const modal = componentFactory.create('modal', { title: 'Confirm' });
```

### Plugin System

```javascript
class PluginFactory {
  constructor() {
    this.plugins = new Map();
  }

  registerPlugin(name, plugin) {
    if (!plugin.init || typeof plugin.init !== 'function') {
      throw new Error(`Plugin must have an init method: ${name}`);
    }

    this.plugins.set(name, plugin);
  }

  loadPlugin(name, config = {}) {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    return plugin.init(config);
  }

  getLoadedPlugins() {
    return Array.from(this.plugins.keys());
  }
}

// Define plugins
const analyticsPlugin = {
  init(config) {
    return {
      track(event) {
        console.log(`Tracking event: ${event}`, config);
      }
    };
  }
};

const authPlugin = {
  init(config) {
    return {
      login(credentials) {
        console.log(`Logging in with`, credentials);
      }
    };
  }
};

// Usage
const factory = new PluginFactory();
factory.registerPlugin('analytics', analyticsPlugin);
factory.registerPlugin('auth', authPlugin);

const analytics = factory.loadPlugin('analytics', { apiKey: '12345' });
analytics.track('user_signup');
```

### API Client Factory

```javascript
class APIClientFactory {
  constructor(baseURL, defaultConfig = {}) {
    this.baseURL = baseURL;
    this.defaultConfig = defaultConfig;
  }

  create(resource, operations = {}) {
    return {
      ...this._defaultOperations(),
      ...operations,
      resource,
      baseURL: this.baseURL,
      config: this.defaultConfig
    };
  }

  _defaultOperations() {
    return {
      list() {
        return `GET ${this.baseURL}/${this.resource}`;
      },
      get(id) {
        return `GET ${this.baseURL}/${this.resource}/${id}`;
      },
      create(data) {
        return `POST ${this.baseURL}/${this.resource}`;
      },
      update(id, data) {
        return `PUT ${this.baseURL}/${this.resource}/${id}`;
      },
      delete(id) {
        return `DELETE ${this.baseURL}/${this.resource}/${id}`;
      }
    };
  }
}

// Usage
const factory = new APIClientFactory('https://api.example.com');

const userAPI = factory.create('users');
console.log(userAPI.list());
console.log(userAPI.get(123));

const postAPI = factory.create('posts', {
  archive(id) {
    return `POST ${this.baseURL}/${this.resource}/${id}/archive`;
  }
});
console.log(postAPI.archive(456));
```

## Interview Points

### Common Interview Questions

**Q: What are the differences between Simple Factory and Factory Method?**

A:
- Simple Factory uses a single factory class with a switch/if-else statement
- Factory Method creates an abstract factory class with subclasses
- Simple Factory is simpler but violates Open/Closed Principle
- Factory Method is more flexible and extensible

**Q: When should you use Abstract Factory instead of Factory Method?**

A: Use Abstract Factory when:
- You need to create families of related objects
- You want to ensure consistency among related products
- Different themes or platform-specific implementations needed
- Example: UI libraries with different themes (light/dark)

**Q: What are the advantages of using factories?**

A:
1. Decouples client code from concrete classes
2. Centralizes object creation logic
3. Makes code more maintainable
4. Facilitates dependency injection
5. Supports polymorphism and extensibility
6. Simplifies complex initialization logic

**Q: How would you implement a factory with lazy loading?**

A:
```javascript
class LazyFactory {
  constructor() {
    this.instances = new Map();
  }

  create(type) {
    if (!this.instances.has(type)) {
      this.instances.set(type, this._createInstance(type));
    }
    return this.instances.get(type);
  }

  _createInstance(type) {
    // Expensive creation logic here
    return new (this._getClass(type))();
  }
}
```

### How to Explain Factory Pattern in an Interview

1. **Start with the problem**: Explain why factories are needed (decoupling, centralization)
2. **Give a simple example**: Show how to use a factory vs direct instantiation
3. **Explain the three types**: Simple Factory, Factory Method, Abstract Factory
4. **Discuss advantages**: Loose coupling, maintainability, extensibility
5. **Mention use cases**: Framework components, API clients, configuration management
6. **Code example**: Write a simple factory to demonstrate understanding

### Follow-up Questions to Expect

- How would you combine Factory with Singleton?
- What's the difference between Factory and Builder patterns?
- How would you implement a factory registry?
- How do factories relate to dependency injection?
- Can you use factories with generics in TypeScript?

## Further Reading

### Related Design Patterns

- **Builder Pattern**: For creating complex objects step-by-step
- **Singleton Pattern**: For ensuring only one instance exists
- **Prototype Pattern**: For creating objects through cloning
- **Dependency Injection**: For managing object dependencies

### Advanced Topics

- Factory registry for dynamic plugin loading
- Combining factories with decorators
- Factory pattern in reactive frameworks
- Async factory patterns for remote object creation
- Factory pattern with generics in TypeScript

### Recommended Resources

**Books:**
- "Design Patterns: Elements of Reusable Object-Oriented Software" by Gang of Four
- "Head First Design Patterns" by Freeman & Freeman
- "JavaScript Patterns" by Stoyan Stefanov

**Online Resources:**
- Refactoring Guru - Factory Patterns
- MDN Web Docs - Design Patterns
- JavaScript.info - Advanced Programming
- PatternCraft - JavaScript Design Patterns

### Modern Framework Usage

Factory patterns are heavily used in modern frameworks:

- **React**: Component factories and hooks factories
- **Vue**: Plugin factories and composition API
- **Angular**: Service factory pattern
- **Express.js**: Middleware factories
- **Jest**: Mock factories

## Summary

The Factory Pattern is a fundamental design pattern that solves the problem of creating objects without specifying their exact classes. By encapsulating object creation logic, factories promote loose coupling, enhance maintainability, and make code more extensible.

**Key Takeaways:**

1. **Three variants exist**: Simple Factory (simplest), Factory Method (flexible), Abstract Factory (family of objects)

2. **Core benefits**: Loose coupling, centralized creation logic, easy extension, polymorphism support

3. **Best practices**: Clear naming, input validation, configuration support, proper documentation

4. **Common pitfalls**: Over-engineering, tight coupling, ignoring initialization, poor error handling

5. **Real-world applications**: Framework components, plugin systems, API clients, configuration management

6. **Performance**: Consider object pooling, lazy initialization, and caching strategies

7. **Interview readiness**: Understand differences between variants, be able to implement and explain them, know when to use each

With the Factory Pattern, you can write more maintainable, flexible, and scalable JavaScript code, especially in large-scale applications and frameworks.
