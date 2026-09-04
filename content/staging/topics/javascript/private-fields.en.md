---
title: Private Class Fields and Methods in JavaScript
description: Comprehensive guide to JavaScript private class fields and methods for true encapsulation and data protection in ES2022 and beyond
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - Classes
  - Encapsulation
  - Privacy
  - ES2022
  - OOP
status: imported
origin: old/src/content/docs/javascript/private-fields.en.md
divergence: 0.121
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: javascript
  subcategory: ""
  order: 13
  lastUpdated: 2026-01-07
---

Private class fields and methods, standardized in ES2022, provide true encapsulation in JavaScript by allowing developers to define members that are only accessible within the class itself. Using the hash (`#`) prefix, you can create data and functionality that is protected from external access and modification, following principles of object-oriented design.

## Concept Introduction

JavaScript's private fields and methods represent a fundamental shift in how developers can write object-oriented code. Before ES2022, privacy in JavaScript was enforced only by convention (using underscore-prefixed properties) or complex patterns like closures and WeakMaps. Private fields, prefixed with `#`, are the first language-level mechanism for creating genuinely private class members.

When you declare a private field using the `#` symbol, the JavaScript engine creates a hard boundary around that member. It becomes completely inaccessible from outside the class definition—not just by convention, but by syntax. Attempting to access a private field from outside the class results in a `SyntaxError`, making it impossible to accidentally or intentionally breach the encapsulation.

Private fields are declared at the class level and are created fresh for each instance. They are not inherited by subclasses, do not appear in object enumeration, and are not included in JSON serialization. This makes them ideal for protecting sensitive data, storing implementation details, and creating clear contracts between the public API and internal state.

### Key Characteristics

- **Syntactic Enforcement**: Private fields are enforced by the JavaScript engine itself
- **Not Enumerable**: They don't appear in `Object.keys()`, `for...in` loops, or JSON serialization
- **Instance-Specific**: Each instance has its own private fields
- **Not Inherited**: Subclasses cannot access parent class private fields directly
- **Null-Safe Access**: Can be safely checked with `in` operator

## Core Principles

### True Privacy Through Syntax Enforcement

The cornerstone of private fields is that they are enforced at the syntax level by the JavaScript engine. This guarantees that external code cannot access them, unlike conventions that can be violated.

```javascript
class BankAccount {
  #balance = 0; // Private field
  #pin; // Declared, uninitialized

  #validateWithdrawal(amount) { // Private method
    return amount > 0 && amount <= this.#balance;
  }

  constructor(pin) {
    this.#pin = pin;
  }

  withdraw(amount) {
    if (this.#validateWithdrawal(amount)) {
      this.#balance -= amount;
      return true;
    }
    return false;
  }

  getBalance() {
    return this.#balance;
  }
}

const account = new BankAccount('1234');

// These work
console.log(account.getBalance()); // 0
console.log(account.withdraw(100)); // false (insufficient funds)

// These cause SyntaxError
try {
  console.log(account.#balance); // SyntaxError
} catch (e) {
  console.error('Cannot access private field');
}

try {
  account.#validateWithdrawal(100); // SyntaxError
} catch (e) {
  console.error('Cannot access private method');
}
```

### Encapsulation and Data Protection

Private fields enforce controlled access to critical data. All modifications must go through public methods, which allows for validation and side-effect management.

```javascript
class User {
  #password;
  #loginAttempts = 0;
  #locked = false;

  constructor(username, password) {
    this.username = username;
    this.#password = this.#hashPassword(password);
  }

  #hashPassword(pwd) {
    // Simplified hashing - use bcrypt in production
    return `hashed_${pwd}`;
  }

  #incrementLoginAttempts() {
    this.#loginAttempts++;
    if (this.#loginAttempts >= 5) {
      this.#locked = true;
    }
  }

  authenticate(password) {
    if (this.#locked) {
      throw new Error('Account locked due to failed attempts');
    }

    if (this.#hashPassword(password) === this.#password) {
      this.#loginAttempts = 0;
      return true;
    }

    this.#incrementLoginAttempts();
    return false;
  }

  isLocked() {
    return this.#locked;
  }

  resetAttempts(adminPassword) {
    if (adminPassword === 'admin-secret') {
      this.#loginAttempts = 0;
      this.#locked = false;
    }
  }
}

const user = new User('alice', 'secret123');
console.log(user.authenticate('wrong')); // false
console.log(user.isLocked()); // false

for (let i = 0; i < 4; i++) {
  user.authenticate('wrong');
}
console.log(user.isLocked()); // true
```

### Preventing Property Enumeration and Serialization

Private fields are invisible to property enumeration methods and JSON serialization, preventing accidental exposure of internal data.

```javascript
class Document {
  #internalId;
  #createdBy;
  #encryptionKey;
  title;
  content;

  constructor(title, content, createdBy) {
    this.title = title;
    this.content = content;
    this.#internalId = Math.random().toString(36);
    this.#createdBy = createdBy;
    this.#encryptionKey = 'secret-key-' + Math.random();
  }

  toJSON() {
    // Only public fields are serialized by default
    return {
      title: this.title,
      content: this.content,
      id: this.#internalId // Explicitly included if needed
    };
  }
}

const doc = new Document('Report', 'Content here', 'Alice');

console.log(Object.keys(doc)); // ['title', 'content']
console.log(JSON.stringify(doc));
// {"title":"Report","content":"Content here","id":"..."}

// Private fields are not enumerated
for (const key in doc) {
  console.log(key); // Only 'title' and 'content'
}
```

### Static Private Members for Shared State

Static private fields and methods belong to the class itself rather than instances, enabling shared private state across all instances.

```javascript
class DatabaseConnection {
  static #instance = null;
  static #connectionPool = [];
  static #maxConnections = 10;

  #connectionId;
  #createdAt;

  static #initializePool() {
    for (let i = 0; i < DatabaseConnection.#maxConnections; i++) {
      DatabaseConnection.#connectionPool.push({
        id: `conn_${i}`,
        active: false
      });
    }
  }

  static getInstance() {
    if (!DatabaseConnection.#instance) {
      DatabaseConnection.#initializePool();
      DatabaseConnection.#instance = new DatabaseConnection();
    }
    return DatabaseConnection.#instance;
  }

  static getPoolStats() {
    const active = DatabaseConnection.#connectionPool
      .filter(c => c.active).length;
    return {
      total: DatabaseConnection.#connectionPool.length,
      active
    };
  }

  constructor() {
    if (DatabaseConnection.#connectionPool.length === 0) {
      throw new Error('No available connections');
    }
    const conn = DatabaseConnection.#connectionPool.pop();
    this.#connectionId = conn.id;
    this.#createdAt = new Date();
  }

  executeQuery(sql) {
    return `Executing on ${this.#connectionId}: ${sql}`;
  }

  releaseConnection() {
    DatabaseConnection.#connectionPool.push({
      id: this.#connectionId,
      active: false
    });
  }
}

const db = DatabaseConnection.getInstance();
console.log(db.executeQuery('SELECT * FROM users'));
console.log(DatabaseConnection.getPoolStats());
```

## Key Points

### Declaration and Initialization

Private fields must be declared in the class body before use. They can be initialized with default values or left uninitialized.

```javascript
class ConfigManager {
  #apiKey; // Uninitialized - will be undefined
  #timeout = 5000; // Initialized with value
  #cache = new Map(); // Initialized with object
  #handlers = []; // Initialized as empty array
  #settings = null; // Explicitly null

  constructor(apiKey) {
    this.#apiKey = apiKey; // Can be assigned in constructor
  }

  getConfig() {
    return {
      apiKey: this.#apiKey,
      timeout: this.#timeout,
      cache: this.#cache,
      handlers: this.#handlers,
      settings: this.#settings
    };
  }
}

const config = new ConfigManager('key-123');
console.log(config.getConfig().timeout); // 5000
```

### Private Fields in Constructors

Constructors are where private fields are typically initialized with instance-specific data. This ensures each instance has its own isolated state.

```javascript
class APIClient {
  #baseURL;
  #apiKey;
  #timeout;
  #retryCount;
  #headers;

  constructor(baseURL, apiKey, timeout = 5000, retryCount = 3) {
    this.#baseURL = baseURL;
    this.#apiKey = apiKey;
    this.#timeout = timeout;
    this.#retryCount = retryCount;
    this.#headers = this.#initializeHeaders();
  }

  #initializeHeaders() {
    return {
      'Authorization': `Bearer ${this.#apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'CustomClient/1.0'
    };
  }

  #buildUrl(endpoint) {
    return `${this.#baseURL}${endpoint}`;
  }

  async get(endpoint) {
    const url = this.#buildUrl(endpoint);
    return { url, method: 'GET', timeout: this.#timeout };
  }

  async post(endpoint, data) {
    const url = this.#buildUrl(endpoint);
    return { url, method: 'POST', data, timeout: this.#timeout };
  }
}

const client = new APIClient('https://api.example.com', 'secret-key');
console.log(client.get('/users'));
```

### Relationship with Inheritance

Private fields are not inherited. Each class has its own namespace for private fields, and subclasses cannot access parent class private fields directly.

```javascript
class Animal {
  #dnaSequence;
  #bloodType;
  name;

  constructor(name) {
    this.name = name;
    this.#dnaSequence = 'ATCG' + Math.random();
    this.#bloodType = 'O+';
  }

  #getGeneticMarkers() {
    return this.#dnaSequence.split('');
  }

  getDnaLength() {
    return this.#dnaSequence.length;
  }
}

class Dog extends Animal {
  #breed;
  #trainedBehaviors = [];

  constructor(name, breed) {
    super(name);
    this.#breed = breed;
  }

  // Cannot access parent's #dnaSequence or #bloodType
  // But can call inherited public method
  describe() {
    return {
      name: this.name,
      breed: this.#breed,
      dnaLength: this.getDnaLength() // Works - public method
    };
  }
}

const dog = new Dog('Buddy', 'Golden Retriever');
console.log(dog.describe());
// { name: 'Buddy', breed: 'Golden Retriever', dnaLength: 25 }
```

### Checking for Private Field Existence

You can use the `in` operator to check if an instance has a private field, which is useful for optional private members.

```javascript
class OptionalFields {
  #optionalField;
  #requiredField = 'default';

  hasOptionalField() {
    return #optionalField in this;
  }

  setOptionalField(value) {
    this.#optionalField = value;
  }
}

const obj = new OptionalFields();
console.log(obj.hasOptionalField()); // false
obj.setOptionalField('value');
console.log(obj.hasOptionalField()); // true
```

## Code Examples

### Example 1: Secure Bank Account with Audit Trail

```javascript
class SecureBankAccount {
  #accountNumber;
  #balance;
  #transactions = [];
  #pin;
  #dailyLimit = 5000;
  #dailyWithdrawn = 0;
  #lastResetDate;

  constructor(accountNumber, pin, initialBalance = 0) {
    this.#accountNumber = accountNumber;
    this.#pin = pin;
    this.#balance = initialBalance;
    this.#lastResetDate = new Date().toDateString();

    if (initialBalance > 0) {
      this.#recordTransaction('Initial deposit', initialBalance, 'system');
    }
  }

  #recordTransaction(type, amount, initiator = 'unknown') {
    this.#transactions.push({
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount,
      initiator,
      date: new Date(),
      balanceAfter: this.#balance,
      dailyWithdrawn: this.#dailyWithdrawn
    });
  }

  #validatePin(pin) {
    return this.#pin === pin;
  }

  #validateAmount(amount) {
    return amount > 0 && Number.isFinite(amount);
  }

  #resetDailyLimit() {
    const today = new Date().toDateString();
    if (today !== this.#lastResetDate) {
      this.#dailyWithdrawn = 0;
      this.#lastResetDate = today;
    }
  }

  #canWithdraw(amount) {
    this.#resetDailyLimit();
    return this.#dailyWithdrawn + amount <= this.#dailyLimit;
  }

  deposit(amount) {
    if (!this.#validateAmount(amount)) {
      throw new Error('Invalid deposit amount');
    }
    this.#balance += amount;
    this.#recordTransaction('Deposit', amount, 'account-holder');
    return this.#balance;
  }

  withdraw(amount, pin) {
    if (!this.#validatePin(pin)) {
      throw new Error('Invalid PIN');
    }
    if (!this.#validateAmount(amount)) {
      throw new Error('Invalid withdrawal amount');
    }
    if (amount > this.#balance) {
      throw new Error('Insufficient funds');
    }
    if (!this.#canWithdraw(amount)) {
      throw new Error(`Daily limit exceeded. Remaining: ${this.#dailyLimit - this.#dailyWithdrawn}`);
    }

    this.#balance -= amount;
    this.#dailyWithdrawn += amount;
    this.#recordTransaction('Withdrawal', amount, 'account-holder');
    return this.#balance;
  }

  checkBalance(pin) {
    if (!this.#validatePin(pin)) {
      throw new Error('Invalid PIN');
    }
    return this.#balance;
  }

  getStatementSummary(pin) {
    if (!this.#validatePin(pin)) {
      throw new Error('Invalid PIN');
    }
    return {
      accountNumber: this.#accountNumber.slice(-4),
      balance: this.#balance,
      transactionCount: this.#transactions.length,
      latestTransaction: this.#transactions[this.#transactions.length - 1]
    };
  }

  getDetailedStatement(pin) {
    if (!this.#validatePin(pin)) {
      throw new Error('Invalid PIN');
    }
    return [...this.#transactions];
  }
}

// Usage
const account = new SecureBankAccount('1234567890', '1234', 10000);
try {
  console.log('Initial balance:', account.checkBalance('1234')); // 10000
  account.deposit(500);
  console.log('After deposit:', account.checkBalance('1234')); // 10500
  account.withdraw(1000, '1234');
  console.log('After withdrawal:', account.checkBalance('1234')); // 9500
  console.log('Summary:', account.getStatementSummary('1234'));
} catch (error) {
  console.error('Error:', error.message);
}
```

### Example 2: State Machine with Private State Management

```javascript
class TrafficLightSystem {
  #currentState = 'stop';
  #states = new Map([
    ['stop', { duration: 5000, next: 'prepare' }],
    ['prepare', { duration: 2000, next: 'go' }],
    ['go', { duration: 5000, next: 'stop' }]
  ]);
  #stateHistory = [];
  #stateChangeListeners = [];
  #transitionTimeout;
  #isPaused = false;

  #validateState(state) {
    return this.#states.has(state);
  }

  #notifyListeners(event) {
    this.#stateChangeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  #recordStateChange(fromState, toState) {
    this.#stateHistory.push({
      from: fromState,
      to: toState,
      timestamp: new Date(),
      duration: this.getStateDuration(fromState)
    });
  }

  #performStateTransition() {
    if (this.#isPaused) return;

    const config = this.#states.get(this.#currentState);
    const nextState = config.next;

    const prevState = this.#currentState;
    this.#currentState = nextState;
    this.#recordStateChange(prevState, nextState);

    this.#notifyListeners({
      from: prevState,
      to: nextState,
      timestamp: new Date()
    });

    // Schedule next transition
    this.#transitionTimeout = setTimeout(
      () => this.#performStateTransition(),
      config.duration
    );
  }

  start() {
    if (!this.#transitionTimeout) {
      this.#performStateTransition();
    }
  }

  stop() {
    clearTimeout(this.#transitionTimeout);
    this.#transitionTimeout = null;
  }

  pause() {
    this.#isPaused = true;
  }

  resume() {
    this.#isPaused = false;
  }

  getState() {
    return this.#currentState;
  }

  getStateDuration(state) {
    return this.#states.get(state)?.duration || 0;
  }

  onChange(listener) {
    this.#stateChangeListeners.push(listener);
    return () => {
      const idx = this.#stateChangeListeners.indexOf(listener);
      if (idx > -1) this.#stateChangeListeners.splice(idx, 1);
    };
  }

  getHistory(limit = 10) {
    return [...this.#stateHistory].slice(-limit);
  }
}

// Usage
const light = new TrafficLightSystem();
light.onChange(({ from, to }) => {
  console.log(`Traffic light: ${from} -> ${to}`);
});

light.start();
setTimeout(() => light.stop(), 15000);
```

### Example 3: Advanced Cache with TTL and LRU Eviction

```javascript
class AdvancedCache {
  #storage = new Map();
  #ttl = new Map();
  #accessLog = [];
  #accessOrder = new Map(); // For LRU
  #maxSize;
  #hitCount = 0;
  #missCount = 0;
  #accessCounter = 0;

  constructor(maxSize = 100) {
    this.#maxSize = maxSize;
  }

  #isExpired(key) {
    if (!this.#ttl.has(key)) return false;
    const isExpired = Date.now() > this.#ttl.get(key);
    if (isExpired) {
      this.#cleanup(key);
    }
    return isExpired;
  }

  #cleanup(key) {
    this.#storage.delete(key);
    this.#ttl.delete(key);
    this.#accessOrder.delete(key);
    this.#accessLog = this.#accessLog.filter(entry => entry.key !== key);
  }

  #evictLRU() {
    if (this.#storage.size === 0) return;

    let lruKey = null;
    let lruTime = Infinity;

    for (const [key, time] of this.#accessOrder) {
      if (time < lruTime) {
        lruTime = time;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.#cleanup(lruKey);
    }
  }

  #logAccess(key, type) {
    this.#accessLog.push({
      key,
      type,
      timestamp: Date.now(),
      count: ++this.#accessCounter
    });
  }

  set(key, value, ttl = null) {
    if (this.#storage.size >= this.#maxSize && !this.#storage.has(key)) {
      this.#evictLRU();
    }

    this.#storage.set(key, value);
    this.#accessOrder.set(key, this.#accessCounter);

    if (ttl !== null) {
      this.#ttl.set(key, Date.now() + ttl);
    } else {
      this.#ttl.delete(key);
    }

    this.#logAccess(key, 'set');
  }

  get(key) {
    if (this.#isExpired(key)) {
      this.#missCount++;
      this.#logAccess(key, 'miss');
      return undefined;
    }

    if (this.#storage.has(key)) {
      this.#accessOrder.set(key, this.#accessCounter);
      this.#hitCount++;
      this.#logAccess(key, 'hit');
      return this.#storage.get(key);
    }

    this.#missCount++;
    this.#logAccess(key, 'miss');
    return undefined;
  }

  has(key) {
    return this.#storage.has(key) && !this.#isExpired(key);
  }

  delete(key) {
    this.#cleanup(key);
    return this.#storage.has(key);
  }

  clear() {
    this.#storage.clear();
    this.#ttl.clear();
    this.#accessOrder.clear();
    this.#accessLog = [];
    this.#hitCount = 0;
    this.#missCount = 0;
  }

  getStats() {
    const total = this.#hitCount + this.#missCount;
    return {
      size: this.#storage.size,
      maxSize: this.#maxSize,
      utilization: ((this.#storage.size / this.#maxSize) * 100).toFixed(2) + '%',
      hits: this.#hitCount,
      misses: this.#missCount,
      hitRate: total === 0 ? '0%' : ((this.#hitCount / total) * 100).toFixed(2) + '%',
      totalAccesses: this.#accessCounter
    };
  }

  getAccessLog(limit = 20) {
    return [...this.#accessLog].slice(-limit);
  }
}

// Usage
const cache = new AdvancedCache(3);
cache.set('user:1', { id: 1, name: 'Alice' });
cache.set('user:2', { id: 2, name: 'Bob' }, 5000); // 5 second TTL
cache.set('user:3', { id: 3, name: 'Charlie' });

console.log(cache.get('user:1')); // { id: 1, name: 'Alice' }
console.log(cache.get('user:1')); // Hit
console.log(cache.get('user:2')); // Hit
console.log(cache.get('notfound')); // undefined - Miss

console.log(cache.getStats());
// { size: 3, maxSize: 3, utilization: '100.00%', hits: 2, misses: 1, hitRate: '66.67%', totalAccesses: 5 }
```

### Example 4: Pub/Sub Event System with Private Event Management

```javascript
class EventBus {
  #subscribers = new Map();
  #eventHistory = [];
  #maxHistorySize = 100;
  #eventMiddleware = [];
  #errorHandlers = [];

  #getOrCreateSubscriberList(event) {
    if (!this.#subscribers.has(event)) {
      this.#subscribers.set(event, []);
    }
    return this.#subscribers.get(event);
  }

  #validateEvent(event) {
    if (typeof event !== 'string' || event.trim().length === 0) {
      throw new TypeError('Event name must be a non-empty string');
    }
  }

  #recordEvent(event, data) {
    const record = {
      event,
      data: JSON.parse(JSON.stringify(data)), // Deep copy
      timestamp: new Date(),
      index: this.#eventHistory.length
    };

    this.#eventHistory.push(record);

    // Keep history size limited
    if (this.#eventHistory.length > this.#maxHistorySize) {
      this.#eventHistory.shift();
    }
  }

  #applyMiddleware(event, data) {
    let processedData = data;
    for (const middleware of this.#eventMiddleware) {
      processedData = middleware(event, processedData);
    }
    return processedData;
  }

  #handleError(error, event) {
    this.#errorHandlers.forEach(handler => {
      try {
        handler(error, event);
      } catch (e) {
        console.error('Error in error handler:', e);
      }
    });
  }

  subscribe(event, callback) {
    this.#validateEvent(event);

    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    const subscribers = this.#getOrCreateSubscriberList(event);
    subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const idx = subscribers.indexOf(callback);
      if (idx > -1) {
        subscribers.splice(idx, 1);
      }
      if (subscribers.length === 0) {
        this.#subscribers.delete(event);
      }
    };
  }

  subscribeOnce(event, callback) {
    this.#validateEvent(event);

    const unsubscribe = this.subscribe(event, (data) => {
      unsubscribe();
      callback(data);
    });

    return unsubscribe;
  }

  publish(event, data = null) {
    this.#validateEvent(event);

    const processedData = this.#applyMiddleware(event, data);
    this.#recordEvent(event, processedData);

    const subscribers = this.#subscribers.get(event);
    if (!subscribers || subscribers.length === 0) {
      return false;
    }

    subscribers.forEach(callback => {
      try {
        callback(processedData);
      } catch (error) {
        this.#handleError(error, event);
      }
    });

    return true;
  }

  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function');
    }
    this.#eventMiddleware.push(middleware);
    return this;
  }

  onError(handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('Error handler must be a function');
    }
    this.#errorHandlers.push(handler);
    return this;
  }

  getSubscriberCount(event) {
    this.#validateEvent(event);
    return this.#subscribers.get(event)?.length || 0;
  }

  getEventHistory(event = null, limit = 10) {
    if (event) {
      return this.#eventHistory
        .filter(record => record.event === event)
        .slice(-limit);
    }
    return this.#eventHistory.slice(-limit);
  }

  clear(event = null) {
    if (event) {
      this.#validateEvent(event);
      this.#subscribers.delete(event);
    } else {
      this.#subscribers.clear();
    }
  }
}

// Usage
const bus = new EventBus();

bus.use((event, data) => {
  return { ...data, processedAt: new Date().toISOString() };
});

bus.onError((error, event) => {
  console.error(`Error in event '${event}':`, error.message);
});

bus.subscribe('user:login', ({ username }) => {
  console.log(`User logged in: ${username}`);
});

bus.subscribe('user:logout', ({ username }) => {
  console.log(`User logged out: ${username}`);
});

bus.publish('user:login', { username: 'alice' });
console.log('Subscribers for user:login:', bus.getSubscriberCount('user:login'));
console.log('Event history:', bus.getEventHistory());
```

## Best Practices

### Use Private Fields for All Internal State

Declare every piece of data that should not be accessed externally as a private field. This makes the class contract explicit and prevents accidental misuse.

```javascript
// Good - Clear separation of public and private
class Product {
  #id;
  #cost; // Internal cost, not public price
  #markup = 1.2; // Internal markup percentage
  #stock;
  #lastModified;
  #reviewCount = 0;

  name; // Public
  description; // Public

  constructor(id, name, description, cost, stock) {
    this.#id = id;
    this.name = name;
    this.description = description;
    this.#cost = cost;
    this.#stock = stock;
    this.#lastModified = new Date();
  }

  getPrice() {
    return this.#cost * this.#markup;
  }

  updatePrice(newCost) {
    this.#cost = newCost;
    this.#lastModified = new Date();
  }

  getStock() {
    return this.#stock;
  }

  addReview() {
    this.#reviewCount++;
  }
}
```

### Create Private Helper Methods for Complex Logic

Extract complicated operations into private methods to keep public methods clean and focused on the public API.

```javascript
class EmailValidator {
  #patterns = {
    local: /^[a-zA-Z0-9._%-]+$/,
    domain: /^[a-zA-Z0-9.-]+$/,
    tld: /^[a-zA-Z]{2,}$/
  };

  #validateLocalPart(local) {
    return local.length > 0 &&
           local.length <= 64 &&
           this.#patterns.local.test(local);
  }

  #validateDomainPart(domain) {
    return domain.length > 0 &&
           domain.length <= 255 &&
           this.#patterns.domain.test(domain);
  }

  #validateTLD(tld) {
    return tld.length >= 2 && this.#patterns.tld.test(tld);
  }

  #parseDomain(domain) {
    const parts = domain.split('.');
    return {
      name: parts.slice(0, -1).join('.'),
      tld: parts[parts.length - 1]
    };
  }

  validate(email) {
    if (!email || typeof email !== 'string') return false;

    const [local, domain] = email.split('@');
    if (!local || !domain) return false;

    if (!this.#validateLocalPart(local)) return false;
    if (!this.#validateDomainPart(domain)) return false;

    const { name, tld } = this.#parseDomain(domain);
    return this.#validateTLD(tld) && name.length > 0;
  }
}

const validator = new EmailValidator();
console.log(validator.validate('user@example.com')); // true
console.log(validator.validate('invalid@')); // false
```

### Always Initialize Private Fields, Preferably in Constructor

Initialize all private fields to predictable values to avoid bugs from undefined state.

```javascript
class Configuration {
  #hostname;
  #port;
  #timeout;
  #ssl = false;
  #maxConnections = 10;
  #cache = new Map();
  #middlewares = [];

  constructor(hostname, port, options = {}) {
    this.#hostname = hostname;
    this.#port = port;
    this.#timeout = options.timeout || 5000;
    this.#ssl = options.ssl || false;
    this.#maxConnections = options.maxConnections || 10;
    this.#cache = new Map();
    this.#middlewares = [];
  }

  getConfig() {
    return {
      hostname: this.#hostname,
      port: this.#port,
      timeout: this.#timeout,
      ssl: this.#ssl,
      maxConnections: this.#maxConnections
    };
  }
}
```

### Provide Clear, Intent-Revealing Public Methods

Design your public methods to express the intended behavior clearly. Hide implementation details.

```javascript
class Queue {
  #items = [];
  #maxSize;
  #itemCount = 0;

  constructor(maxSize = Infinity) {
    this.#maxSize = maxSize;
  }

  enqueue(item) {
    if (this.isFull()) {
      throw new Error('Queue is full');
    }
    this.#items.push(item);
    this.#itemCount++;
  }

  dequeue() {
    if (this.isEmpty()) {
      throw new Error('Queue is empty');
    }
    this.#itemCount--;
    return this.#items.shift();
  }

  peek() {
    return this.#items[0];
  }

  isEmpty() {
    return this.#itemCount === 0;
  }

  isFull() {
    return this.#itemCount >= this.#maxSize;
  }

  size() {
    return this.#itemCount;
  }

  clear() {
    this.#items = [];
    this.#itemCount = 0;
  }
}
```

### Document Why Fields Are Private

Add comments explaining the privacy decision, especially for less obvious cases.

```javascript
class SecureSession {
  #sessionToken; // Private for security: tokens must never leak via public API
  #encryptionKey; // Private: cryptographic material should never be exposed
  #userPermissions; // Private: detailed permissions are implementation detail
  #auditLog; // Private: audit log is internal book-keeping
  #createdAt; // Private: creation time is internal state, use getAge() instead

  userId; // Public: part of session identity

  constructor(userId, permissions) {
    this.userId = userId;
    this.#sessionToken = this.#generateToken();
    this.#encryptionKey = this.#generateKey();
    this.#userPermissions = new Set(permissions);
    this.#auditLog = [];
    this.#createdAt = new Date();
  }

  #generateToken() {
    // Implementation
  }

  #generateKey() {
    // Implementation
  }

  hasPermission(permission) {
    return this.#userPermissions.has(permission);
  }

  getAge() {
    return Date.now() - this.#createdAt.getTime();
  }
}
```

## Common Pitfalls

### Forgetting the Hash Prefix

Omitting the `#` creates a public property instead of a private one.

```javascript
// Incorrect - Balance is public!
class BadAccount {
  balance = 0;

  deposit(amount) {
    this.balance += amount;
  }
}

const bad = new BadAccount();
console.log(bad.balance); // 0 - accessible!

// Correct
class GoodAccount {
  #balance = 0;

  deposit(amount) {
    this.#balance += amount;
  }

  getBalance() {
    return this.#balance;
  }
}

const good = new GoodAccount();
// console.log(good.#balance); // SyntaxError - truly private!
```

### Accessing Private Fields Outside the Class

Private fields cause SyntaxError when accessed from outside the class definition.

```javascript
class Secure {
  #secret = 'password';

  getSecret() {
    return this.#secret; // OK - inside the class
  }
}

const obj = new Secure();
console.log(obj.getSecret()); // OK
// console.log(obj.#secret); // SyntaxError: Private field '#secret' must be declared
```

### Forgetting Private Fields Are Not Inherited

Subclasses cannot directly access parent class private fields.

```javascript
class Parent {
  #parentSecret = 'parent';

  protectedMethod() {
    return this.#parentSecret;
  }
}

class Child extends Parent {
  revealParentSecret() {
    // This won't work:
    // return this.#parentSecret; // SyntaxError

    // Use the public method instead:
    return this.protectedMethod();
  }
}

const child = new Child();
console.log(child.revealParentSecret()); // 'parent'
```

### Uninitialized Private Fields Are Undefined

Accessing an uninitialized private field returns undefined, which can cause subtle bugs.

```javascript
// Problematic
class Example {
  #value; // undefined

  constructor(shouldInit) {
    if (shouldInit) {
      this.#value = 42;
    }
  }

  getValue() {
    return this.#value; // Could be undefined
  }
}

const ex = new Example(false);
console.log(ex.getValue()); // undefined - potential bug!

// Better
class Better {
  #value = null; // Explicitly initialized

  constructor(shouldInit) {
    if (shouldInit) {
      this.#value = 42;
    }
  }

  getValue() {
    return this.#value;
  }

  hasValue() {
    return this.#value !== null;
  }
}
```

### Private Fields Cannot Be Accessed Via Bracket Notation

Private fields cannot be accessed using bracket notation or dynamic key access.

```javascript
class Data {
  #hidden = 'secret';
  public = 'visible';
}

const obj = new Data();

// These work
console.log(obj.public); // 'visible'
console.log(obj['public']); // 'visible'

// These don't work
console.log(obj['#hidden']); // undefined (not the private field!)
for (const key in obj) {
  console.log(key); // Only 'public'
}
console.log(Object.keys(obj)); // ['public']
```

## Performance Considerations

### Memory Efficiency

Private fields are allocated once per instance and are very memory-efficient compared to closure-based privacy patterns.

```javascript
// Private fields (optimal memory usage)
class EfficientClass {
  #data;

  constructor() {
    this.#data = {};
  }
}

// vs. Closures (creates function scope per instance)
function InefficientClass() {
  const data = {}; // Closure scope allocated per instance

  this.getData = function() {
    return data;
  };
}

// Private fields use less memory and are faster to access
```

### Access Speed

Private field access is extremely fast, optimized by JavaScript engines via inline caches.

```javascript
class FastAccess {
  #counter = 0;

  increment() {
    return ++this.#counter; // Direct, optimized access
  }
}

class SlowerAccess {
  #counter = 0;

  getCounter() {
    return this.#counter;
  }

  incrementCounter() {
    return ++this.#counter;
  }
}

// Private fields are generally faster due to optimization
```

### No Reflection Overhead

Unlike property access, private fields have no reflection overhead.

```javascript
class PerformantClass {
  #value = 0;
  public = 0;

  test() {
    // This is very fast - direct access
    return this.#value;
  }
}

// vs. using Object.defineProperty or getters (slower)
class SlowerClass {
  #value = 0;

  get value() { // Getter introduces overhead
    return this.#value;
  }
}
```

## Real-world Scenarios

### Building a Secure API Client

```javascript
class SecureAPIClient {
  #baseURL;
  #apiKey;
  #timeout = 5000;
  #retries = 3;
  #retryDelay = 1000;
  #requestCache = new Map();
  #requestHistory = [];

  constructor(baseURL, apiKey) {
    if (!baseURL || !apiKey) {
      throw new Error('baseURL and apiKey are required');
    }
    this.#baseURL = baseURL;
    this.#apiKey = apiKey;
  }

  #buildHeaders() {
    return {
      'Authorization': `Bearer ${this.#apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SecureClient/1.0'
    };
  }

  #buildUrl(endpoint) {
    return `${this.#baseURL}${endpoint}`;
  }

  #getCacheKey(endpoint, params) {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  #recordRequest(endpoint, method, success) {
    this.#requestHistory.push({
      endpoint,
      method,
      timestamp: new Date(),
      success
    });
  }

  async #executeWithRetry(fn) {
    let lastError;
    for (let attempt = 0; attempt < this.#retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < this.#retries - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, this.#retryDelay * (attempt + 1))
          );
        }
      }
    }
    throw lastError;
  }

  async get(endpoint, params = {}) {
    const cacheKey = this.#getCacheKey(endpoint, params);

    if (this.#requestCache.has(cacheKey)) {
      return this.#requestCache.get(cacheKey);
    }

    const fn = async () => {
      const url = this.#buildUrl(endpoint) + '?' +
                  new URLSearchParams(params).toString();
      const response = await fetch(url, {
        method: 'GET',
        headers: this.#buildHeaders(),
        timeout: this.#timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.#requestCache.set(cacheKey, data);
      this.#recordRequest(endpoint, 'GET', true);
      return data;
    };

    return this.#executeWithRetry(fn);
  }

  async post(endpoint, body = {}) {
    const fn = async () => {
      const response = await fetch(this.#buildUrl(endpoint), {
        method: 'POST',
        headers: this.#buildHeaders(),
        body: JSON.stringify(body),
        timeout: this.#timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.#requestCache.clear();
      this.#recordRequest(endpoint, 'POST', true);
      return data;
    };

    return this.#executeWithRetry(fn);
  }

  getRequestHistory() {
    return [...this.#requestHistory];
  }

  clearCache() {
    this.#requestCache.clear();
  }
}
```

### Creating a Dependency Injection Container

```javascript
class DIContainer {
  #services = new Map();
  #singletons = new Map();
  #factories = new Map();
  #aliases = new Map();
  #resolving = new Set();

  #validateServiceName(name) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new TypeError('Service name must be a non-empty string');
    }
  }

  #resolveDependencies(fn) {
    const params = fn.toString()
      .match(/\(([^)]*)\)/)[1]
      .split(',')
      .map(p => p.trim())
      .filter(p => p && !['this', 'self'].includes(p));

    return params.map(param => this.get(param));
  }

  #detectCircularDependency(name) {
    if (this.#resolving.has(name)) {
      throw new Error(`Circular dependency detected: ${name}`);
    }
  }

  register(name, definition, options = {}) {
    this.#validateServiceName(name);

    if (options.alias) {
      this.#aliases.set(options.alias, name);
    }

    if (typeof definition === 'function') {
      this.#factories.set(name, definition);
    } else {
      this.#services.set(name, definition);
    }
  }

  singleton(name, definition) {
    this.register(name, definition, { singleton: true });
  }

  get(name) {
    this.#validateServiceName(name);

    const actualName = this.#aliases.get(name) || name;
    this.#detectCircularDependency(actualName);

    if (this.#singletons.has(actualName)) {
      return this.#singletons.get(actualName);
    }

    if (this.#services.has(actualName)) {
      return this.#services.get(actualName);
    }

    if (this.#factories.has(actualName)) {
      this.#resolving.add(actualName);
      const factory = this.#factories.get(actualName);
      const deps = this.#resolveDependencies(factory);
      const instance = factory(...deps);
      this.#resolving.delete(actualName);

      this.#singletons.set(actualName, instance);
      return instance;
    }

    throw new Error(`Service not found: ${actualName}`);
  }

  has(name) {
    const actualName = this.#aliases.get(name) || name;
    return this.#services.has(actualName) ||
           this.#factories.has(actualName) ||
           this.#singletons.has(actualName);
  }
}

// Usage
const container = new DIContainer();

container.register('logger', {
  log: (msg) => console.log(`[LOG] ${msg}`)
});

container.register('db', function(logger) {
  logger.log('Initializing database');
  return { query: () => {} };
});

container.register('userService', function(db, logger) {
  logger.log('Initializing user service');
  return { getUser: (id) => db.query(`SELECT * FROM users WHERE id = ${id}`) };
});

const userService = container.get('userService');
```

### Implementing a Plugin System

```javascript
class PluginSystem {
  #plugins = new Map();
  #hooks = new Map();
  #errorHandlers = [];

  #getOrCreateHookList(hookName) {
    if (!this.#hooks.has(hookName)) {
      this.#hooks.set(hookName, []);
    }
    return this.#hooks.get(hookName);
  }

  #validatePlugin(plugin) {
    if (!plugin || typeof plugin.name !== 'string') {
      throw new TypeError('Plugin must have a name property');
    }
  }

  #handleError(error, context) {
    this.#errorHandlers.forEach(handler => {
      try {
        handler(error, context);
      } catch (e) {
        console.error('Error in error handler:', e);
      }
    });
  }

  register(plugin) {
    this.#validatePlugin(plugin);

    if (this.#plugins.has(plugin.name)) {
      throw new Error(`Plugin already registered: ${plugin.name}`);
    }

    this.#plugins.set(plugin.name, plugin);

    if (plugin.hooks) {
      for (const [hookName, callback] of Object.entries(plugin.hooks)) {
        this.registerHook(hookName, callback, plugin.name);
      }
    }

    return this;
  }

  registerHook(hookName, callback, pluginName = 'unknown') {
    if (typeof callback !== 'function') {
      throw new TypeError('Hook callback must be a function');
    }

    const hooks = this.#getOrCreateHookList(hookName);
    hooks.push({ callback, pluginName });
  }

  async executeHook(hookName, data = {}) {
    const hooks = this.#hooks.get(hookName) || [];

    for (const { callback, pluginName } of hooks) {
      try {
        data = await callback(data) || data;
      } catch (error) {
        this.#handleError(error, { hook: hookName, plugin: pluginName });
      }
    }

    return data;
  }

  onError(handler) {
    this.#errorHandlers.push(handler);
  }

  getPlugins() {
    return Array.from(this.#plugins.values());
  }

  getPlugin(name) {
    return this.#plugins.get(name);
  }

  unregister(name) {
    return this.#plugins.delete(name);
  }
}

// Usage
const plugins = new PluginSystem();

plugins.register({
  name: 'validation-plugin',
  hooks: {
    'beforeSave': (data) => {
      if (!data.email) throw new Error('Email is required');
      return data;
    }
  }
});

plugins.register({
  name: 'logging-plugin',
  hooks: {
    'afterSave': (data) => {
      console.log('Data saved:', data);
      return data;
    }
  }
});

plugins.onError((error, context) => {
  console.error(`Error in ${context.hook} (${context.plugin}):`, error.message);
});
```

## Interview Points

### What's the Difference Between Private Fields and Underscore Convention?

Private fields (using `#`) are enforced by the JavaScript engine at the syntax level, making them truly private. Underscore-prefixed properties are just a naming convention and can still be accessed from anywhere.

```javascript
class Example {
  #private = 'truly private';
  _convention = 'fake private';
}

const obj = new Example();
console.log(obj._convention); // Accessible (convention only)
// console.log(obj.#private); // SyntaxError (truly private)
```

### How Do Private Fields Affect Object Serialization?

Private fields are not included in JSON.stringify() or Object.keys(), which means they won't be serialized automatically. This is by design for security.

```javascript
class User {
  #password = 'secret';
  name = 'Alice';
}

const user = new User();
console.log(JSON.stringify(user)); // {"name":"Alice"}
console.log(Object.keys(user)); // ["name"]
```

### Can You Use Private Fields in Static Methods?

Yes, you can use static private fields and methods. Static private members belong to the class itself, not to instances.

```javascript
class Counter {
  static #count = 0;

  static #increment() {
    return ++Counter.#count;
  }

  static getAndIncrement() {
    return Counter.#increment();
  }
}

console.log(Counter.getAndIncrement()); // 1
// console.log(Counter.#count); // SyntaxError
```

### What's the Performance Impact of Private Fields?

Private fields have minimal performance overhead and are actually faster than alternatives like closures or WeakMaps because they're optimized by JavaScript engines.

### Can Private Fields Be Conditionally Declared?

No, private fields must be declared at the class body level. They cannot be conditionally declared within methods or constructors.

```javascript
// Correct
class Example {
  #field = null; // Always declared

  constructor(shouldHaveValue) {
    if (shouldHaveValue) {
      this.#field = 'value';
    }
  }
}

// Incorrect - syntax error
class BadExample {
  constructor(shouldHaveField) {
    if (shouldHaveField) {
      this.#field = 'value'; // SyntaxError - not declared at class body
    }
  }
}
```

### How Do Private Fields Work with Destructuring?

Private fields cannot be destructured because they're not accessible outside the class. Only public properties can be destructured.

```javascript
class Data {
  #private = 'secret';
  public = 'visible';
}

const obj = new Data();
const { public: pub } = obj; // Works
// const { private: priv } = obj; // Doesn't access private field
```

## Further Reading

- MDN Web Docs: [Private class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields)
- TC39 ECMAScript Proposal: [Private Fields](https://github.com/tc39/proposal-class-fields)
- JavaScript.info: [Private and protected properties](https://javascript.info/private-protected-properties)
- Web.dev: [ES2022 Features Overview](https://web.dev/es2022-features/)
- Patterns.dev: [Module Pattern and Encapsulation](https://www.patterns.dev/posts/module-pattern/)
- Node.js Documentation: [Class Syntax](https://nodejs.org/api/classes.html)

---

## Summary

Private class fields and methods provide true encapsulation in JavaScript, enabling developers to write secure and maintainable code that follows object-oriented design principles. Key takeaways:

- **True Privacy**: The `#` prefix creates syntactically enforced privacy that cannot be bypassed
- **Encapsulation**: Private members protect internal state and implementation details from external access
- **Not Enumerable**: Private fields don't appear in object enumeration, JSON serialization, or property reflection
- **Performance**: Private fields are optimized by modern engines with minimal runtime overhead
- **No Inheritance**: Subclasses cannot directly access parent class private fields, enforcing strict encapsulation boundaries
- **Clear Contracts**: Using private members makes the public API explicit and communicates intent clearly

By properly utilizing private fields and methods, you can write JavaScript classes that are more secure, maintainable, and resistant to misuse. They represent a significant improvement in the language's ability to support true object-oriented programming principles and are now the preferred way to create private members in JavaScript classes.
