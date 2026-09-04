---
title: 类私有字段
description: JavaScript 类私有字段完全指南：# 私有语法、私有方法、静态私有成员、WeakMap 替代方案与封装最佳实践
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - 私有字段
  - 封装
  - OOP
  - ES2022
status: imported
origin: old/src/content/docs/javascript/private-fields.zh.md
divergence: 0.121
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: JavaScript
  subcategory: 面向对象
  order: 13
  lastUpdated: 2026-01-07
---

在面向对象编程中，封装是最重要的原则之一。ES2022 正式引入了使用 `#` 前缀的私有字段语法，为 JavaScript 类提供了真正的私有成员支持，彻底解决了长期以来只能依赖命名约定（如 `_` 前缀）来模拟私有性的问题。

## 概念解释

### 什么是私有字段

私有字段是类中只能被类内部代码访问的成员，外部代码无法直接读取或修改。在 JavaScript 中，私有字段使用 `#` 前缀声明：

```javascript
class Person {
  // 私有字段
  #name;
  #age;

  constructor(name, age) {
    this.#name = name;
    this.#age = age;
  }

  introduce() {
    return `我叫${this.#name}，今年${this.#age}岁。`;
  }
}

const person = new Person('张三', 25);
console.log(person.introduce()); // "我叫张三，今年25岁。"

// 尝试访问私有字段会报错
// console.log(person.#name); // SyntaxError: Private field '#name' must be declared in an enclosing class
```

### 历史背景

在 ES2022 之前，JavaScript 没有真正的私有成员机制。开发者通常采用以下方式模拟私有性：

```javascript
// 1. 命名约定（下划线前缀）- 仅为约定，实际可访问
class OldStyle {
  constructor(value) {
    this._privateValue = value; // 约定私有，但实际可从外部访问
  }
}

// 2. 闭包方式 - 真正私有，但无法在原型方法中访问
function createPerson(name) {
  let _name = name; // 真正私有
  return {
    getName() { return _name; }
  };
}

// 3. Symbol 作为键 - 较安全，但仍可通过 Object.getOwnPropertySymbols 访问
const _secret = Symbol('secret');
class SymbolStyle {
  constructor(secret) {
    this[_secret] = secret;
  }
}

// 4. WeakMap 方式 - 真正私有，但语法繁琐
const privateData = new WeakMap();
class WeakMapStyle {
  constructor(value) {
    privateData.set(this, { value });
  }
  getValue() {
    return privateData.get(this).value;
  }
}
```

### 私有字段解决的问题

1. **真正的封装**：外部代码无法访问或修改私有字段
2. **命名冲突避免**：私有字段名与公共字段名可以相同
3. **子类隔离**：子类无法访问父类的私有字段，确保类的内部实现细节被隐藏
4. **API 稳定性**：内部实现可以自由变更，不影响公共接口

## 核心原理

### 私有字段的内部机制

私有字段在 JavaScript 引擎中的实现与普通属性完全不同：

```javascript
class Example {
  #privateField = 'private';
  publicField = 'public';
}

const obj = new Example();

// 私有字段不会出现在对象的属性列表中
console.log(Object.keys(obj)); // ['publicField']
console.log(Object.getOwnPropertyNames(obj)); // ['publicField']
console.log(Reflect.ownKeys(obj)); // ['publicField']

// 私有字段也不能通过 in 操作符检测（对于普通字符串键）
console.log('publicField' in obj); // true
// console.log('#privateField' in obj); // SyntaxError
```

私有字段的关键特性：

1. **词法作用域绑定**：私有字段名在编译时解析，而非运行时
2. **硬性封装**：无法通过任何反射 API 访问私有字段
3. **按类区分**：每个类的私有字段是独立的命名空间

### 私有字段与属性访问的区别

```javascript
class Comparison {
  #private = 1;
  public = 2;

  test() {
    // 私有字段使用特殊的内部槽访问
    console.log(this.#private); // 直接从内部槽读取

    // 公共属性遵循原型链查找
    console.log(this.public); // 沿原型链查找
  }
}

// 私有字段访问更快，因为不需要原型链查找
// 但这种性能差异在大多数场景下可以忽略
```

### 类型检查与品牌检查

私有字段可用于实现"品牌检查"（brand check），验证对象是否为特定类的实例：

```javascript
class AuthToken {
  #token;

  constructor(token) {
    this.#token = token;
  }

  // 使用 in 操作符进行品牌检查
  static isAuthToken(obj) {
    return #token in obj;
  }

  static getToken(obj) {
    if (!this.isAuthToken(obj)) {
      throw new TypeError('参数必须是 AuthToken 实例');
    }
    return obj.#token;
  }
}

const realToken = new AuthToken('abc123');
const fakeToken = { token: 'fake' };

console.log(AuthToken.isAuthToken(realToken)); // true
console.log(AuthToken.isAuthToken(fakeToken)); // false
console.log(AuthToken.getToken(realToken)); // 'abc123'
// AuthToken.getToken(fakeToken); // TypeError
```

## 核心要点

### 私有字段语法规则

| 特性 | 语法 | 说明 |
|------|------|------|
| 私有实例字段 | `#field` | 每个实例独立拥有 |
| 私有实例方法 | `#method() {}` | 类原型上的私有方法 |
| 私有静态字段 | `static #field` | 属于类本身 |
| 私有静态方法 | `static #method() {}` | 属于类本身 |
| 私有 Getter | `get #prop() {}` | 私有访问器 |
| 私有 Setter | `set #prop(v) {}` | 私有访问器 |

### 声明位置

私有字段必须在类体顶层声明，不能在构造函数或方法中声明：

```javascript
class Correct {
  // 正确：在类体顶层声明
  #field1;
  #field2 = 'default';

  constructor() {
    this.#field1 = 'value';
    // 错误：不能在这里声明新的私有字段
    // this.#newField = 'error'; // SyntaxError
  }
}
```

### 访问限制

私有字段只能在声明它的类内部访问：

```javascript
class Parent {
  #secret = 'parent secret';

  getSecret() {
    return this.#secret;
  }
}

class Child extends Parent {
  tryAccessParentSecret() {
    // 错误：子类无法访问父类的私有字段
    // return this.#secret; // SyntaxError
    return this.getSecret(); // 必须通过父类提供的公共方法
  }
}
```

## 代码示例

### 私有实例字段

```javascript
class BankAccount {
  // 私有字段声明
  #balance;
  #accountNumber;
  #transactions = [];

  constructor(accountNumber, initialBalance = 0) {
    this.#accountNumber = accountNumber;
    this.#balance = initialBalance;

    if (initialBalance > 0) {
      this.#recordTransaction('初始存款', initialBalance);
    }
  }

  // 私有方法
  #recordTransaction(type, amount) {
    this.#transactions.push({
      type,
      amount,
      balance: this.#balance,
      timestamp: new Date()
    });
  }

  #validateAmount(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new TypeError('金额必须是有效数字');
    }
    if (amount <= 0) {
      throw new RangeError('金额必须大于零');
    }
  }

  // 公共方法
  deposit(amount) {
    this.#validateAmount(amount);
    this.#balance += amount;
    this.#recordTransaction('存款', amount);
    return this;
  }

  withdraw(amount) {
    this.#validateAmount(amount);
    if (amount > this.#balance) {
      throw new Error('余额不足');
    }
    this.#balance -= amount;
    this.#recordTransaction('取款', -amount);
    return this;
  }

  // 公共 getter
  get balance() {
    return this.#balance;
  }

  get accountNumber() {
    // 返回脱敏的账号
    return this.#accountNumber.replace(/\d(?=\d{4})/g, '*');
  }

  getTransactionHistory() {
    // 返回副本以保护内部数据
    return this.#transactions.map(t => ({ ...t }));
  }
}

const account = new BankAccount('1234567890123456', 1000);
account.deposit(500).withdraw(200);

console.log(account.balance); // 1300
console.log(account.accountNumber); // ************3456
console.log(account.getTransactionHistory().length); // 3
```

### 私有方法

```javascript
class DataProcessor {
  #data = [];
  #isProcessing = false;

  // 私有方法：数据验证
  #validate(item) {
    if (item === null || item === undefined) {
      return false;
    }
    if (typeof item === 'object' && Object.keys(item).length === 0) {
      return false;
    }
    return true;
  }

  // 私有方法：数据转换
  #transform(item) {
    if (typeof item === 'string') {
      return item.trim().toLowerCase();
    }
    if (typeof item === 'number') {
      return Math.round(item * 100) / 100;
    }
    if (typeof item === 'object') {
      return JSON.parse(JSON.stringify(item));
    }
    return item;
  }

  // 私有方法：处理流程
  #processItem(item) {
    if (!this.#validate(item)) {
      return null;
    }
    return this.#transform(item);
  }

  // 公共方法
  add(item) {
    const processed = this.#processItem(item);
    if (processed !== null) {
      this.#data.push(processed);
    }
    return this;
  }

  addBatch(items) {
    if (this.#isProcessing) {
      throw new Error('正在处理中，请稍后再试');
    }

    this.#isProcessing = true;
    try {
      items.forEach(item => this.add(item));
    } finally {
      this.#isProcessing = false;
    }
    return this;
  }

  get data() {
    return [...this.#data];
  }

  get count() {
    return this.#data.length;
  }

  clear() {
    this.#data = [];
    return this;
  }
}

const processor = new DataProcessor();
processor
  .add('  Hello World  ')
  .add(3.14159)
  .add({ name: 'test' })
  .add(null) // 会被过滤掉
  .add({}); // 会被过滤掉

console.log(processor.data);
// ['hello world', 3.14, { name: 'test' }]
```

### 静态私有字段和方法

```javascript
class Logger {
  // 静态私有字段
  static #instance = null;
  static #logLevel = 'info';
  static #logs = [];
  static #maxLogs = 1000;

  // 日志级别优先级
  static #levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  // 私有构造函数模式（单例）
  constructor() {
    if (Logger.#instance) {
      return Logger.#instance;
    }
    Logger.#instance = this;
  }

  // 静态私有方法
  static #shouldLog(level) {
    return this.#levels[level] >= this.#levels[this.#logLevel];
  }

  static #formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined
    };
  }

  static #addLog(entry) {
    this.#logs.push(entry);
    if (this.#logs.length > this.#maxLogs) {
      this.#logs.shift();
    }
  }

  // 公共静态方法
  static setLevel(level) {
    if (!(level in this.#levels)) {
      throw new Error(`无效的日志级别: ${level}`);
    }
    this.#logLevel = level;
  }

  static debug(message, data) {
    if (this.#shouldLog('debug')) {
      const entry = this.#formatMessage('debug', message, data);
      this.#addLog(entry);
      console.debug(`[DEBUG] ${entry.timestamp}: ${message}`, data || '');
    }
  }

  static info(message, data) {
    if (this.#shouldLog('info')) {
      const entry = this.#formatMessage('info', message, data);
      this.#addLog(entry);
      console.info(`[INFO] ${entry.timestamp}: ${message}`, data || '');
    }
  }

  static warn(message, data) {
    if (this.#shouldLog('warn')) {
      const entry = this.#formatMessage('warn', message, data);
      this.#addLog(entry);
      console.warn(`[WARN] ${entry.timestamp}: ${message}`, data || '');
    }
  }

  static error(message, data) {
    if (this.#shouldLog('error')) {
      const entry = this.#formatMessage('error', message, data);
      this.#addLog(entry);
      console.error(`[ERROR] ${entry.timestamp}: ${message}`, data || '');
    }
  }

  static getLogs(level = null) {
    if (level) {
      return this.#logs.filter(log => log.level === level);
    }
    return [...this.#logs];
  }

  static clearLogs() {
    this.#logs = [];
  }

  static get currentLevel() {
    return this.#logLevel;
  }
}

// 使用示例
Logger.setLevel('debug');
Logger.debug('调试信息', { userId: 1 });
Logger.info('用户登录成功');
Logger.warn('API 响应较慢', { latency: 2000 });
Logger.error('数据库连接失败', { error: 'timeout' });

console.log(Logger.getLogs('error'));
```

### 私有访问器（Getter/Setter）

```javascript
class SecureConfig {
  #settings = new Map();
  #encryptionKey;
  #lastModified = null;

  constructor(encryptionKey) {
    this.#encryptionKey = encryptionKey;
  }

  // 私有 getter - 解密值
  get #decryptedSettings() {
    const result = {};
    for (const [key, value] of this.#settings) {
      result[key] = this.#decrypt(value);
    }
    return result;
  }

  // 私有 setter - 更新修改时间
  set #modified(value) {
    this.#lastModified = value ? new Date() : null;
  }

  // 私有方法 - 简化的加密/解密模拟
  #encrypt(value) {
    // 实际应用中应使用真正的加密算法
    return Buffer.from(JSON.stringify(value)).toString('base64');
  }

  #decrypt(value) {
    return JSON.parse(Buffer.from(value, 'base64').toString());
  }

  // 公共方法
  set(key, value) {
    const encrypted = this.#encrypt(value);
    this.#settings.set(key, encrypted);
    this.#modified = true;
    return this;
  }

  get(key) {
    if (!this.#settings.has(key)) {
      return undefined;
    }
    return this.#decrypt(this.#settings.get(key));
  }

  has(key) {
    return this.#settings.has(key);
  }

  delete(key) {
    const result = this.#settings.delete(key);
    if (result) {
      this.#modified = true;
    }
    return result;
  }

  // 公共 getter
  get all() {
    return this.#decryptedSettings;
  }

  get lastModified() {
    return this.#lastModified;
  }

  get size() {
    return this.#settings.size;
  }
}

const config = new SecureConfig('my-secret-key');
config.set('apiKey', 'sk-1234567890');
config.set('database', { host: 'localhost', port: 5432 });

console.log(config.get('apiKey')); // 'sk-1234567890'
console.log(config.all); // { apiKey: 'sk-1234567890', database: {...} }
```

### 私有字段与继承

```javascript
class Animal {
  #name;
  #energy = 100;

  constructor(name) {
    this.#name = name;
  }

  // 私有方法
  #consumeEnergy(amount) {
    this.#energy = Math.max(0, this.#energy - amount);
  }

  #restoreEnergy(amount) {
    this.#energy = Math.min(100, this.#energy + amount);
  }

  // 受保护的接口（供子类使用）
  get name() {
    return this.#name;
  }

  get energy() {
    return this.#energy;
  }

  eat(food) {
    console.log(`${this.#name}正在吃${food}`);
    this.#restoreEnergy(20);
    return this;
  }

  sleep(hours) {
    console.log(`${this.#name}睡了${hours}小时`);
    this.#restoreEnergy(hours * 10);
    return this;
  }

  move(distance) {
    const energyCost = distance * 0.5;
    if (this.#energy < energyCost) {
      console.log(`${this.#name}太累了，无法移动`);
      return this;
    }
    console.log(`${this.#name}移动了${distance}米`);
    this.#consumeEnergy(energyCost);
    return this;
  }
}

class Dog extends Animal {
  // 子类有自己的私有字段
  #breed;
  #tricks = [];

  constructor(name, breed) {
    super(name);
    this.#breed = breed;
  }

  // 子类的私有方法
  #performTrick(trick) {
    console.log(`${this.name}表演：${trick}`);
  }

  get breed() {
    return this.#breed;
  }

  learnTrick(trick) {
    this.#tricks.push(trick);
    console.log(`${this.name}学会了${trick}`);
    return this;
  }

  showTricks() {
    if (this.#tricks.length === 0) {
      console.log(`${this.name}还没学会任何技能`);
      return this;
    }
    console.log(`${this.name}的技能：`);
    this.#tricks.forEach(trick => this.#performTrick(trick));
    return this;
  }

  bark() {
    console.log(`${this.name}汪汪叫`);
    return this;
  }
}

const dog = new Dog('旺财', '金毛');
dog.eat('骨头')
   .move(50)
   .learnTrick('握手')
   .learnTrick('打滚')
   .showTricks()
   .bark();

console.log(dog.energy); // 80
console.log(dog.breed); // '金毛'
```

## 最佳实践

### 明确区分公共和私有接口

```javascript
class UserService {
  // 私有状态
  #users = new Map();
  #currentUser = null;

  // 私有辅助方法
  #hashPassword(password) {
    // 实际应使用 bcrypt 等库
    return `hashed_${password}`;
  }

  #validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  #validatePassword(password) {
    return password.length >= 8;
  }

  #generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 公共 API
  register(email, password) {
    if (!this.#validateEmail(email)) {
      throw new Error('无效的邮箱格式');
    }
    if (!this.#validatePassword(password)) {
      throw new Error('密码至少需要8个字符');
    }

    const id = this.#generateId();
    const user = {
      id,
      email,
      passwordHash: this.#hashPassword(password),
      createdAt: new Date()
    };

    this.#users.set(id, user);
    return { id, email };
  }

  login(email, password) {
    const user = [...this.#users.values()].find(u => u.email === email);
    if (!user || user.passwordHash !== this.#hashPassword(password)) {
      throw new Error('邮箱或密码错误');
    }
    this.#currentUser = user;
    return { id: user.id, email: user.email };
  }

  logout() {
    this.#currentUser = null;
  }

  get isLoggedIn() {
    return this.#currentUser !== null;
  }

  get currentUser() {
    if (!this.#currentUser) return null;
    return { id: this.#currentUser.id, email: this.#currentUser.email };
  }
}
```

### 使用私有字段实现不可变状态

```javascript
class ImmutablePoint {
  #x;
  #y;

  constructor(x, y) {
    this.#x = x;
    this.#y = y;
    Object.freeze(this);
  }

  get x() {
    return this.#x;
  }

  get y() {
    return this.#y;
  }

  // 返回新实例而非修改当前实例
  add(other) {
    return new ImmutablePoint(this.#x + other.x, this.#y + other.y);
  }

  subtract(other) {
    return new ImmutablePoint(this.#x - other.x, this.#y - other.y);
  }

  scale(factor) {
    return new ImmutablePoint(this.#x * factor, this.#y * factor);
  }

  distanceTo(other) {
    const dx = this.#x - other.x;
    const dy = this.#y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  equals(other) {
    return this.#x === other.x && this.#y === other.y;
  }

  toString() {
    return `Point(${this.#x}, ${this.#y})`;
  }
}

const p1 = new ImmutablePoint(3, 4);
const p2 = new ImmutablePoint(6, 8);
const p3 = p1.add(p2);

console.log(p1.toString()); // Point(3, 4) - 原对象不变
console.log(p3.toString()); // Point(9, 12)
```

### 合理使用私有静态字段

```javascript
class DatabaseConnection {
  static #pool = [];
  static #maxConnections = 10;
  static #connectionCount = 0;

  #id;
  #isActive = false;
  #lastUsed = null;

  constructor() {
    if (DatabaseConnection.#pool.length >= DatabaseConnection.#maxConnections) {
      throw new Error('连接池已满');
    }

    this.#id = `conn_${++DatabaseConnection.#connectionCount}`;
    DatabaseConnection.#pool.push(this);
  }

  // 私有实例方法
  #updateLastUsed() {
    this.#lastUsed = new Date();
  }

  // 公共实例方法
  connect() {
    this.#isActive = true;
    this.#updateLastUsed();
    console.log(`${this.#id} 已连接`);
    return this;
  }

  disconnect() {
    this.#isActive = false;
    console.log(`${this.#id} 已断开`);
    return this;
  }

  query(sql) {
    if (!this.#isActive) {
      throw new Error('连接未激活');
    }
    this.#updateLastUsed();
    console.log(`${this.#id} 执行查询: ${sql}`);
    return this;
  }

  get id() {
    return this.#id;
  }

  get isActive() {
    return this.#isActive;
  }

  // 静态方法
  static getPoolSize() {
    return this.#pool.length;
  }

  static getActiveConnections() {
    return this.#pool.filter(conn => conn.isActive).length;
  }

  static closeAll() {
    this.#pool.forEach(conn => conn.disconnect());
  }

  static setMaxConnections(max) {
    if (max < this.#pool.length) {
      throw new Error('不能小于当前连接数');
    }
    this.#maxConnections = max;
  }
}
```

### 私有字段与依赖注入

```javascript
class HttpClient {
  #baseUrl;
  #headers;
  #timeout;

  constructor({ baseUrl = '', headers = {}, timeout = 5000 } = {}) {
    this.#baseUrl = baseUrl;
    this.#headers = headers;
    this.#timeout = timeout;
  }

  async #fetch(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get(endpoint) {
    const response = await this.#fetch(`${this.#baseUrl}${endpoint}`, {
      headers: this.#headers
    });
    return response.json();
  }

  async post(endpoint, data) {
    const response = await this.#fetch(`${this.#baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { ...this.#headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

class UserRepository {
  #httpClient;

  // 依赖注入
  constructor(httpClient) {
    this.#httpClient = httpClient;
  }

  async findAll() {
    return this.#httpClient.get('/users');
  }

  async findById(id) {
    return this.#httpClient.get(`/users/${id}`);
  }

  async create(userData) {
    return this.#httpClient.post('/users', userData);
  }
}

// 使用
const client = new HttpClient({ baseUrl: 'https://api.example.com' });
const userRepo = new UserRepository(client);
```

## 常见陷阱

### 在子类中尝试访问父类私有字段

```javascript
class Parent {
  #secret = 'parent secret';

  getSecret() {
    return this.#secret;
  }
}

class Child extends Parent {
  // 错误示例
  revealSecret() {
    // return this.#secret; // SyntaxError!
    return this.getSecret(); // 正确做法
  }

  // 子类可以有同名的私有字段，但它是独立的
  #secret = 'child secret';

  getChildSecret() {
    return this.#secret; // 返回 'child secret'
  }
}

const child = new Child();
console.log(child.getSecret()); // 'parent secret'
console.log(child.getChildSecret()); // 'child secret'
```

### 忘记声明私有字段

```javascript
class Wrong {
  constructor(value) {
    // 错误：私有字段必须先声明
    // this.#value = value; // SyntaxError
  }
}

class Correct {
  #value; // 必须在类体中声明

  constructor(value) {
    this.#value = value; // 现在可以使用
  }
}
```

### 在对象字面量中使用私有字段

```javascript
// 私有字段只能在类中使用
const obj = {
  // #private: 'value' // SyntaxError!
};

// 必须使用类
class Container {
  #private = 'value';
}
```

### this 上下文丢失

```javascript
class Button {
  #label;
  #clickCount = 0;

  constructor(label) {
    this.#label = label;
  }

  // 问题：作为回调时 this 丢失
  handleClick() {
    this.#clickCount++; // 如果 this 不正确，会报错
    console.log(`${this.#label} 被点击了 ${this.#clickCount} 次`);
  }

  // 解决方案1：使用箭头函数
  handleClickArrow = () => {
    this.#clickCount++;
    console.log(`${this.#label} 被点击了 ${this.#clickCount} 次`);
  };

  // 解决方案2：在构造函数中绑定
  constructor2(label) {
    this.#label = label;
    this.handleClick = this.handleClick.bind(this);
  }

  mount(element) {
    // 使用箭头函数版本更安全
    element.addEventListener('click', this.handleClickArrow);
  }
}
```

### 序列化问题

```javascript
class User {
  #password;

  constructor(name, password) {
    this.name = name;
    this.#password = password;
  }

  // JSON.stringify 不会包含私有字段
  // 需要自定义 toJSON 方法
  toJSON() {
    return {
      name: this.name
      // 不暴露密码
    };
  }

  // 如果需要完整序列化（谨慎使用）
  toFullJSON() {
    return {
      name: this.name,
      password: this.#password // 仅限内部使用
    };
  }

  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new User(data.name, data.password);
  }
}

const user = new User('张三', 'secret123');
console.log(JSON.stringify(user)); // {"name":"张三"}
```

### 私有字段与 Proxy

```javascript
class Original {
  #private = 'secret';

  getPrivate() {
    return this.#private;
  }
}

const original = new Original();

// Proxy 无法拦截私有字段访问
const proxy = new Proxy(original, {
  get(target, prop) {
    console.log(`访问属性: ${prop}`);
    return Reflect.get(target, prop);
  }
});

// 这会导致错误，因为 this 指向 proxy 而非 original
try {
  proxy.getPrivate(); // TypeError
} catch (e) {
  console.log('Proxy 与私有字段不兼容');
}

// 解决方案：绑定方法
const boundProxy = new Proxy(original, {
  get(target, prop) {
    const value = Reflect.get(target, prop);
    if (typeof value === 'function') {
      return value.bind(target);
    }
    return value;
  }
});

console.log(boundProxy.getPrivate()); // 'secret'
```

## 性能考量

### 私有字段的访问速度

```javascript
class PrivateFieldClass {
  #value = 0;

  increment() {
    this.#value++;
  }

  get value() {
    return this.#value;
  }
}

class PublicFieldClass {
  value = 0;

  increment() {
    this.value++;
  }
}

// 在现代 JavaScript 引擎中，私有字段访问通常与公共属性访问速度相当
// 甚至可能更快，因为不需要原型链查找
```

### 内存使用

```javascript
class WithPrivateField {
  #data;

  constructor(data) {
    this.#data = data;
  }
}

class WithWeakMap {
  constructor(data) {
    privateData.set(this, data);
  }
}
const privateData = new WeakMap();

// 私有字段方案：
// - 内存使用更直接
// - 垃圾回收更简单

// WeakMap 方案：
// - 需要额外的 Map 开销
// - 但在某些场景下更灵活（如添加到现有对象）
```

### 大量实例时的考虑

```javascript
class OptimizedClass {
  // 静态私有字段用于共享数据
  static #sharedConfig = { /* ... */ };

  // 实例私有字段只存储必要数据
  #id;

  constructor(id) {
    this.#id = id;
  }

  getConfig() {
    // 访问静态共享配置
    return OptimizedClass.#sharedConfig;
  }
}
```

## 实战场景

### 场景一：状态机实现

```javascript
class StateMachine {
  #state;
  #transitions = new Map();
  #onStateChange = null;

  static #validateTransition(from, to, transitions) {
    const allowed = transitions.get(from);
    return allowed && allowed.includes(to);
  }

  constructor(initialState, transitions) {
    this.#state = initialState;

    // 构建转换映射
    for (const [from, toStates] of Object.entries(transitions)) {
      this.#transitions.set(from, toStates);
    }
  }

  get state() {
    return this.#state;
  }

  #canTransition(to) {
    return StateMachine.#validateTransition(this.#state, to, this.#transitions);
  }

  transition(to) {
    if (!this.#canTransition(to)) {
      throw new Error(`无法从 ${this.#state} 转换到 ${to}`);
    }

    const from = this.#state;
    this.#state = to;

    if (this.#onStateChange) {
      this.#onStateChange(from, to);
    }

    return this;
  }

  onStateChange(callback) {
    this.#onStateChange = callback;
    return this;
  }

  getAvailableTransitions() {
    return this.#transitions.get(this.#state) || [];
  }
}

// 订单状态机示例
const orderMachine = new StateMachine('pending', {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['returned'],
  cancelled: [],
  returned: []
});

orderMachine.onStateChange((from, to) => {
  console.log(`订单状态从 ${from} 变更为 ${to}`);
});

orderMachine.transition('confirmed'); // 订单状态从 pending 变更为 confirmed
orderMachine.transition('shipped'); // 订单状态从 confirmed 变更为 shipped
console.log(orderMachine.getAvailableTransitions()); // ['delivered']
```

### 场景二：缓存管理器

```javascript
class CacheManager {
  #cache = new Map();
  #maxSize;
  #ttl;
  #stats = { hits: 0, misses: 0 };

  constructor({ maxSize = 100, ttl = 60000 } = {}) {
    this.#maxSize = maxSize;
    this.#ttl = ttl;
  }

  #isExpired(entry) {
    return Date.now() - entry.timestamp > this.#ttl;
  }

  #evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.#cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.#cache.delete(oldestKey);
    }
  }

  #cleanup() {
    for (const [key, entry] of this.#cache) {
      if (this.#isExpired(entry)) {
        this.#cache.delete(key);
      }
    }
  }

  set(key, value) {
    // 定期清理过期条目
    if (Math.random() < 0.1) {
      this.#cleanup();
    }

    // 如果超过最大容量，驱逐最旧的
    while (this.#cache.size >= this.#maxSize) {
      this.#evictOldest();
    }

    this.#cache.set(key, {
      value,
      timestamp: Date.now()
    });

    return this;
  }

  get(key) {
    const entry = this.#cache.get(key);

    if (!entry) {
      this.#stats.misses++;
      return undefined;
    }

    if (this.#isExpired(entry)) {
      this.#cache.delete(key);
      this.#stats.misses++;
      return undefined;
    }

    this.#stats.hits++;
    return entry.value;
  }

  has(key) {
    const entry = this.#cache.get(key);
    return entry && !this.#isExpired(entry);
  }

  delete(key) {
    return this.#cache.delete(key);
  }

  clear() {
    this.#cache.clear();
    this.#stats = { hits: 0, misses: 0 };
  }

  get size() {
    return this.#cache.size;
  }

  get stats() {
    const total = this.#stats.hits + this.#stats.misses;
    return {
      ...this.#stats,
      hitRate: total > 0 ? (this.#stats.hits / total * 100).toFixed(2) + '%' : '0%'
    };
  }
}

const cache = new CacheManager({ maxSize: 3, ttl: 5000 });
cache.set('a', 1).set('b', 2).set('c', 3);
console.log(cache.get('a')); // 1
console.log(cache.stats); // { hits: 1, misses: 0, hitRate: '100.00%' }
```

### 场景三：事件发射器

```javascript
class EventEmitter {
  #events = new Map();
  #maxListeners = 10;

  #getListeners(event) {
    if (!this.#events.has(event)) {
      this.#events.set(event, []);
    }
    return this.#events.get(event);
  }

  #checkMaxListeners(event) {
    const listeners = this.#getListeners(event);
    if (listeners.length >= this.#maxListeners) {
      console.warn(`事件 "${event}" 的监听器数量超过 ${this.#maxListeners}`);
    }
  }

  on(event, listener) {
    this.#checkMaxListeners(event);
    this.#getListeners(event).push({ callback: listener, once: false });
    return this;
  }

  once(event, listener) {
    this.#checkMaxListeners(event);
    this.#getListeners(event).push({ callback: listener, once: true });
    return this;
  }

  off(event, listener) {
    const listeners = this.#getListeners(event);
    const index = listeners.findIndex(l => l.callback === listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    return this;
  }

  emit(event, ...args) {
    const listeners = this.#getListeners(event);
    const toRemove = [];

    listeners.forEach((listener, index) => {
      listener.callback.apply(this, args);
      if (listener.once) {
        toRemove.push(index);
      }
    });

    // 从后往前删除，避免索引问题
    for (let i = toRemove.length - 1; i >= 0; i--) {
      listeners.splice(toRemove[i], 1);
    }

    return listeners.length > 0;
  }

  removeAllListeners(event) {
    if (event) {
      this.#events.delete(event);
    } else {
      this.#events.clear();
    }
    return this;
  }

  listenerCount(event) {
    return this.#getListeners(event).length;
  }

  setMaxListeners(n) {
    this.#maxListeners = n;
    return this;
  }
}

// 使用示例
const emitter = new EventEmitter();

emitter.on('message', (msg) => console.log('收到消息:', msg));
emitter.once('connect', () => console.log('首次连接'));

emitter.emit('connect'); // 首次连接
emitter.emit('connect'); // 无输出（once 只触发一次）
emitter.emit('message', 'Hello!'); // 收到消息: Hello!
```

## WeakMap 替代方案

在 ES2022 私有字段之前，WeakMap 是实现真正私有性的主要方法。了解这种模式有助于维护旧代码。

### WeakMap 实现私有字段

```javascript
// 传统 WeakMap 方式
const privateData = new WeakMap();

class PersonWeakMap {
  constructor(name, age) {
    privateData.set(this, {
      name,
      age,
      secrets: []
    });
  }

  getName() {
    return privateData.get(this).name;
  }

  getAge() {
    return privateData.get(this).age;
  }

  addSecret(secret) {
    privateData.get(this).secrets.push(secret);
  }

  getSecrets() {
    return [...privateData.get(this).secrets];
  }
}

// 现代私有字段方式 - 更简洁
class PersonPrivate {
  #name;
  #age;
  #secrets = [];

  constructor(name, age) {
    this.#name = name;
    this.#age = age;
  }

  getName() {
    return this.#name;
  }

  getAge() {
    return this.#age;
  }

  addSecret(secret) {
    this.#secrets.push(secret);
  }

  getSecrets() {
    return [...this.#secrets];
  }
}
```

### WeakMap 的优势场景

```javascript
// 场景：为现有对象添加私有数据（无法修改类定义时）
const metadata = new WeakMap();

function addMetadata(obj, key, value) {
  if (!metadata.has(obj)) {
    metadata.set(obj, {});
  }
  metadata.get(obj)[key] = value;
}

function getMetadata(obj, key) {
  const data = metadata.get(obj);
  return data ? data[key] : undefined;
}

// 可以为任何对象添加私有元数据
const user = { name: '张三' };
addMetadata(user, 'createdAt', new Date());
addMetadata(user, 'permissions', ['read', 'write']);

console.log(getMetadata(user, 'permissions')); // ['read', 'write']
console.log(Object.keys(user)); // ['name'] - 元数据不可见
```

### 两种方式的对比

| 特性 | 私有字段 (#) | WeakMap |
|------|------------|---------|
| 语法简洁性 | 高 | 低 |
| 性能 | 略优 | 略差 |
| 为现有对象添加 | 不支持 | 支持 |
| 继承中的隔离 | 自动 | 需手动处理 |
| 工具支持 | 好 | 好 |
| 浏览器兼容性 | ES2022+ | ES6+ |

## 面试要点

### 问题 1：私有字段与下划线约定有什么区别？

**答案：**
- 下划线前缀只是命名约定，外部仍可访问
- 私有字段 (`#`) 是语言层面的强制封装，外部无法访问
- 私有字段不会出现在 `Object.keys()`、`for...in` 等枚举中
- 私有字段在子类中不可访问，而下划线前缀属性可以

### 问题 2：如何检查一个对象是否具有某个私有字段？

**答案：**
```javascript
class Example {
  #private;

  static hasPrivateField(obj) {
    return #private in obj;
  }
}

// #private in obj 语法仅在类内部有效
```

### 问题 3：私有字段能被继承吗？

**答案：**
```javascript
// 私有字段不能被继承
// 子类无法直接访问父类的私有字段
// 但子类可以定义同名的私有字段，它是完全独立的
class Parent {
  #value = 'parent';
  getValue() { return this.#value; }
}

class Child extends Parent {
  #value = 'child'; // 独立的私有字段
  getChildValue() { return this.#value; }
}

const c = new Child();
c.getValue(); // 'parent' - 父类的 #value
c.getChildValue(); // 'child' - 子类的 #value
```

### 问题 4：私有方法和私有字段有什么性能差异？

**答案：**
- 私有字段直接存储在对象上，访问速度快
- 私有方法可以存储在原型上（共享）或作为私有字段存储（每个实例一份）
- 使用箭头函数语法的私有方法会为每个实例创建新函数，内存开销更大
- 普通私有方法语法更高效，因为方法可以共享

### 问题 5：私有字段与 Proxy 的兼容性问题如何解决？

**答案：**
```javascript
class Target {
  #data = 'secret';
  getData() { return this.#data; }
}

const target = new Target();

// 问题：直接代理会导致私有字段访问失败
const badProxy = new Proxy(target, {});
// badProxy.getData(); // TypeError!

// 解决方案：绑定方法的 this
const goodProxy = new Proxy(target, {
  get(target, prop) {
    const value = Reflect.get(target, prop);
    return typeof value === 'function' ? value.bind(target) : value;
  }
});

goodProxy.getData(); // 'secret'
```

## 延伸阅读

### 官方文档
- [MDN - Private class features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields)
- [TC39 - Class Fields Proposal](https://github.com/tc39/proposal-class-fields)
- [ECMAScript 2022 Language Specification](https://262.ecma-international.org/13.0/)

### 深入文章
- [JavaScript.info - Private and protected properties and methods](https://javascript.info/private-protected-properties-methods)
- [V8 Blog - Private brand checks](https://v8.dev/features/private-brand-checks)
- [2ality - ES2022 class features](https://2ality.com/2022/02/class-fields-and-static-class-features.html)

### 相关书籍
- 《JavaScript 高级程序设计（第4版）》- 类与继承章节
- 《深入理解 ES6》- 类章节
- 《You Don't Know JS: ES6 & Beyond》- 类章节

### 工具和兼容性
- [Can I use - Private class fields](https://caniuse.com/mdn-javascript_classes_private_class_fields)
- [Babel - @babel/plugin-proposal-private-methods](https://babeljs.io/docs/en/babel-plugin-proposal-private-methods)
- [TypeScript - Private Fields](https://www.typescriptlang.org/docs/handbook/2/classes.html#private-fields)
