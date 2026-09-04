---
title: JavaScript 观察者模式与发布订阅模式
description: 深入理解观察者模式与发布订阅模式的原理、区别、实现方式及在现代 JavaScript 开发中的应用
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - JavaScript
  - 设计模式
  - 观察者模式
  - 发布订阅
  - EventEmitter
  - RxJS
  - 面试
status: imported
origin: old/src/content/docs/javascript/observer-pubsub.zh.md
divergence: 0.226
issues: []
legacy:
  category: JavaScript
  subcategory: 设计模式
  order: 25
  lastUpdated: 2026-01-07
---

观察者模式（Observer Pattern）和发布订阅模式（Pub/Sub Pattern）是前端开发中最常用的设计模式之一。它们是实现组件间通信、事件处理、响应式编程的基础。本文将深入剖析这两种模式的原理、区别、实现方式，以及在现代 JavaScript 框架和工具库中的应用。

## 概念解释

### 观察者模式（Observer Pattern）

观察者模式是一种行为设计模式，它定义了一种一对多的依赖关系，让多个观察者对象同时监听某一个主题对象。当主题对象的状态发生变化时，会通知所有观察者对象，使它们能够自动更新。

**核心角色**：
- **Subject（主题/被观察者）**：维护观察者列表，提供添加、删除观察者的方法，状态变化时通知观察者
- **Observer（观察者）**：定义一个更新接口，用于接收主题的通知

```javascript
// 观察者模式的基本结构
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
    console.log('收到更新:', data);
  }
}
```

### 发布订阅模式（Pub/Sub Pattern）

发布订阅模式是观察者模式的一种变体，它引入了一个"事件通道"（Event Channel）或"消息代理"（Message Broker）作为中间层。发布者和订阅者不直接通信，而是通过事件中心进行解耦。

**核心角色**：
- **Publisher（发布者）**：发布消息到事件中心
- **Subscriber（订阅者）**：向事件中心订阅感兴趣的消息
- **Event Channel（事件中心）**：管理消息的订阅与发布，实现发布者与订阅者的解耦

```javascript
// 发布订阅模式的基本结构
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

### 两种模式的关键区别

| 特性 | 观察者模式 | 发布订阅模式 |
|------|-----------|-------------|
| 耦合度 | 主题与观察者直接关联 | 发布者与订阅者完全解耦 |
| 中间层 | 无 | 有事件中心/消息代理 |
| 通信方式 | 主题直接调用观察者方法 | 通过事件中心间接通信 |
| 灵活性 | 相对较低 | 更高，支持事件命名和过滤 |
| 适用场景 | 对象间紧密关联的场景 | 需要完全解耦的复杂系统 |

```
观察者模式：
┌──────────┐         ┌──────────┐
│  Subject │ ──────► │ Observer │
│          │ ──────► │ Observer │
│          │ ──────► │ Observer │
└──────────┘         └──────────┘

发布订阅模式：
┌───────────┐    ┌─────────────┐    ┌────────────┐
│ Publisher │ ──►│ Event Center│ ──►│ Subscriber │
│           │    │             │ ──►│ Subscriber │
│ Publisher │ ──►│             │ ──►│ Subscriber │
└───────────┘    └─────────────┘    └────────────┘
```

## 核心原理

### 观察者模式的工作原理

观察者模式基于"依赖注入"和"回调机制"实现。其核心原理是：

1. **注册阶段**：观察者将自己注册到主题的观察者列表中
2. **状态变化**：主题内部状态发生改变
3. **通知阶段**：主题遍历观察者列表，逐一调用观察者的更新方法
4. **响应阶段**：观察者接收通知并执行相应操作

```javascript
// 观察者模式执行流程
class WeatherStation {
  constructor() {
    this.observers = [];
    this.temperature = 0;
  }

  // 注册观察者
  addObserver(observer) {
    this.observers.push(observer);
  }

  // 移除观察者
  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  // 状态变化时通知所有观察者
  setTemperature(temp) {
    console.log(`温度变化: ${this.temperature}°C -> ${temp}°C`);
    this.temperature = temp;
    this.notifyObservers();
  }

  notifyObservers() {
    this.observers.forEach(observer => {
      observer.update(this.temperature);
    });
  }
}

// 观察者接口
class TemperatureDisplay {
  constructor(name) {
    this.name = name;
  }

  update(temperature) {
    console.log(`${this.name} 显示温度: ${temperature}°C`);
  }
}

// 使用示例
const station = new WeatherStation();
const display1 = new TemperatureDisplay('客厅显示器');
const display2 = new TemperatureDisplay('卧室显示器');

station.addObserver(display1);
station.addObserver(display2);
station.setTemperature(25); // 两个显示器都会更新
```

### 发布订阅模式的工作原理

发布订阅模式通过事件中心实现消息的路由和分发：

1. **订阅阶段**：订阅者向事件中心注册对特定事件的兴趣
2. **发布阶段**：发布者向事件中心发布消息
3. **分发阶段**：事件中心根据事件类型将消息分发给相应的订阅者
4. **处理阶段**：订阅者接收并处理消息

```javascript
// 发布订阅模式执行流程详解
class EventBus {
  constructor() {
    // 存储事件及其对应的回调函数列表
    this.events = new Map();
  }

  // 订阅事件
  subscribe(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(callback);

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(eventName, callback);
    };
  }

  // 发布事件
  publish(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback.apply(null, args);
        } catch (error) {
          console.error(`事件处理错误 [${eventName}]:`, error);
        }
      });
    }
  }

  // 取消订阅
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

// 使用示例
const eventBus = new EventBus();

// 订阅者 A - 订阅用户登录事件
eventBus.subscribe('user:login', (user) => {
  console.log('订阅者A: 用户登录', user.name);
});

// 订阅者 B - 订阅用户登录事件
eventBus.subscribe('user:login', (user) => {
  console.log('订阅者B: 记录登录日志', user.name);
});

// 发布者发布事件
eventBus.publish('user:login', { name: 'Tom', id: 1 });
// 输出:
// 订阅者A: 用户登录 Tom
// 订阅者B: 记录登录日志 Tom
```

### 事件驱动架构

观察者/发布订阅模式是事件驱动架构的基础。在 JavaScript 中，事件驱动无处不在：

- **DOM 事件**：`element.addEventListener('click', handler)`
- **Node.js 事件**：`emitter.on('data', handler)`
- **框架状态管理**：Vue 的响应式系统、Redux 的 dispatch/subscribe

```javascript
// JavaScript 中的事件驱动架构示例
// 1. DOM 事件（浏览器原生观察者模式实现）
document.querySelector('#btn').addEventListener('click', function(event) {
  console.log('按钮被点击');
});

// 2. Node.js EventEmitter
const EventEmitter = require('events');
const emitter = new EventEmitter();

emitter.on('message', (msg) => {
  console.log('收到消息:', msg);
});

emitter.emit('message', 'Hello World');
```

## 核心要点

### 完整的 EventEmitter 实现

一个功能完整的 EventEmitter 需要支持以下特性：

```javascript
class EventEmitter {
  constructor() {
    this.events = new Map();
    this.maxListeners = 10;
  }

  // 设置最大监听器数量
  setMaxListeners(n) {
    this.maxListeners = n;
    return this;
  }

  // 添加事件监听器
  on(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('监听器必须是函数');
    }

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listeners = this.events.get(eventName);

    // 检查监听器数量
    if (listeners.length >= this.maxListeners) {
      console.warn(`警告: ${eventName} 事件监听器超过 ${this.maxListeners} 个`);
    }

    listeners.push(listener);
    return this;
  }

  // 添加一次性监听器
  once(eventName, listener) {
    const onceWrapper = (...args) => {
      this.off(eventName, onceWrapper);
      listener.apply(this, args);
    };

    // 保存原始监听器引用，用于 off 时匹配
    onceWrapper.listener = listener;
    return this.on(eventName, onceWrapper);
  }

  // 移除事件监听器
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

  // 移除所有监听器
  removeAllListeners(eventName) {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
    return this;
  }

  // 触发事件
  emit(eventName, ...args) {
    const listeners = this.events.get(eventName);
    if (!listeners || listeners.length === 0) {
      return false;
    }

    // 复制数组，防止在遍历时修改
    const listenersCopy = [...listeners];
    listenersCopy.forEach(listener => {
      listener.apply(this, args);
    });

    return true;
  }

  // 获取事件监听器列表
  listeners(eventName) {
    return this.events.get(eventName) || [];
  }

  // 获取事件监听器数量
  listenerCount(eventName) {
    const listeners = this.events.get(eventName);
    return listeners ? listeners.length : 0;
  }

  // 获取所有事件名
  eventNames() {
    return Array.from(this.events.keys());
  }

  // 将监听器添加到数组开头
  prependListener(eventName, listener) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).unshift(listener);
    return this;
  }

  // 添加一次性监听器到数组开头
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

### 支持通配符的发布订阅

实际应用中，常需要支持通配符匹配：

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

  // 通配符匹配
  matchPattern(pattern, eventName) {
    // 精确匹配
    if (pattern === eventName) return true;

    // * 匹配单层
    // user.* 匹配 user.login, user.logout
    // ** 匹配多层
    // user.** 匹配 user.login, user.profile.update

    const patternParts = pattern.split('.');
    const eventParts = eventName.split('.');

    let pi = 0;
    let ei = 0;

    while (pi < patternParts.length && ei < eventParts.length) {
      if (patternParts[pi] === '**') {
        return true; // ** 匹配剩余所有
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

// 使用示例
const emitter = new WildcardEventEmitter();

// 订阅所有用户事件
emitter.on('user.*', (data) => {
  console.log('用户事件:', data);
});

// 订阅所有事件
emitter.on('**', (data) => {
  console.log('任意事件:', data);
});

emitter.emit('user.login', { name: 'Tom' });     // 触发 user.* 和 **
emitter.emit('user.logout', { name: 'Tom' });    // 触发 user.* 和 **
emitter.emit('order.create', { id: 1 });         // 只触发 **
```

### 异步事件处理

支持异步事件处理和顺序执行：

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

  // 并行执行所有监听器
  async emitParallel(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return [];

    return Promise.all(
      callbacks.map(cb => Promise.resolve(cb(...args)))
    );
  }

  // 串行执行所有监听器
  async emitSerial(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return [];

    const results = [];
    for (const cb of callbacks) {
      results.push(await cb(...args));
    }
    return results;
  }

  // 管道式执行（前一个的输出作为后一个的输入）
  async emitPipe(eventName, initialData) {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return initialData;

    let data = initialData;
    for (const cb of callbacks) {
      data = await cb(data);
    }
    return data;
  }

  // 竞态执行（返回最快完成的结果）
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

// 使用示例
const asyncEmitter = new AsyncEventEmitter();

asyncEmitter.on('process', async (data) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('处理器1:', data);
  return data + 10;
});

asyncEmitter.on('process', async (data) => {
  await new Promise(resolve => setTimeout(resolve, 50));
  console.log('处理器2:', data);
  return data + 20;
});

// 管道式处理
(async () => {
  const result = await asyncEmitter.emitPipe('process', 0);
  console.log('最终结果:', result); // 30
})();
```

### 响应式观察者模式

结合 Proxy 实现自动触发的响应式系统：

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

        // 如果是对象，递归创建代理
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

  // 监听特定路径的变化
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
    // 通知精确路径的观察者
    const callbacks = this.observers.get(path);
    if (callbacks) {
      callbacks.forEach(cb => cb(newValue, oldValue, path));
    }

    // 通知父路径的观察者
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

// 使用示例
const state = new ReactiveObserver({
  user: {
    name: 'Tom',
    profile: {
      age: 25
    }
  },
  count: 0
});

// 监听用户名变化
state.observe('user.name', (newVal, oldVal) => {
  console.log(`用户名从 "${oldVal}" 变为 "${newVal}"`);
});

// 监听整个 user 对象的变化
state.observe('user', (newVal, oldVal, path) => {
  console.log(`user 对象变化: ${path} = ${newVal}`);
});

state.data.user.name = 'Jerry';
// 输出:
// 用户名从 "Tom" 变为 "Jerry"
// user 对象变化: user.name = Jerry

state.data.user.profile.age = 26;
// 输出:
// user 对象变化: user.profile.age = 26
```

## 代码示例

### 示例一：实现一个完整的消息总线

```javascript
/**
 * 企业级消息总线实现
 * 支持命名空间、优先级、中间件、错误处理等特性
 */
class MessageBus {
  constructor(options = {}) {
    this.events = new Map();
    this.middlewares = [];
    this.errorHandler = options.errorHandler || console.error;
    this.debug = options.debug || false;
  }

  // 添加中间件
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  // 订阅事件，支持优先级
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

    // 按优先级排序（高优先级先执行）
    listeners.sort((a, b) => b.priority - a.priority);

    if (this.debug) {
      console.log(`[MessageBus] 订阅: ${eventName}, 优先级: ${priority}`);
    }

    // 返回取消订阅函数
    return () => this.unsubscribe(eventName, callback);
  }

  // 取消订阅
  unsubscribe(eventName, callback) {
    const listeners = this.events.get(eventName);
    if (!listeners) return false;

    const index = listeners.findIndex(sub => sub.callback === callback);
    if (index > -1) {
      listeners.splice(index, 1);
      if (this.debug) {
        console.log(`[MessageBus] 取消订阅: ${eventName}`);
      }
      return true;
    }
    return false;
  }

  // 发布事件
  async publish(eventName, payload) {
    if (this.debug) {
      console.log(`[MessageBus] 发布: ${eventName}`, payload);
    }

    // 创建消息上下文
    let context = {
      eventName,
      payload,
      timestamp: Date.now(),
      stopped: false
    };

    // 执行中间件
    for (const middleware of this.middlewares) {
      try {
        context = await middleware(context) || context;
        if (context.stopped) {
          if (this.debug) {
            console.log(`[MessageBus] 消息被中间件停止: ${eventName}`);
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
        console.log(`[MessageBus] 无订阅者: ${eventName}`);
      }
      return;
    }

    // 执行所有监听器
    for (const subscription of listeners) {
      try {
        const { callback, context: ctx } = subscription;
        await callback.call(ctx, context.payload, context);
      } catch (error) {
        this.errorHandler(error, eventName, 'listener');
      }
    }
  }

  // 发布并等待所有处理完成
  async publishAndWait(eventName, payload) {
    const listeners = this.events.get(eventName);
    if (!listeners) return [];

    const promises = listeners.map(sub =>
      Promise.resolve(sub.callback.call(sub.context, payload))
    );

    return Promise.all(promises);
  }

  // 请求-响应模式
  async request(eventName, payload, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const responseEvent = `${eventName}:response:${Date.now()}`;

      const timer = setTimeout(() => {
        this.unsubscribe(responseEvent, handler);
        reject(new Error(`请求超时: ${eventName}`));
      }, timeout);

      const handler = (response) => {
        clearTimeout(timer);
        resolve(response);
      };

      this.subscribe(responseEvent, handler);
      this.publish(eventName, { ...payload, responseEvent });
    });
  }

  // 响应请求
  respond(eventName, handler) {
    return this.subscribe(eventName, async (payload) => {
      const { responseEvent, ...data } = payload;
      const response = await handler(data);
      if (responseEvent) {
        this.publish(responseEvent, response);
      }
    });
  }

  // 清除所有订阅
  clear() {
    this.events.clear();
    if (this.debug) {
      console.log('[MessageBus] 已清除所有订阅');
    }
  }

  // 获取事件统计信息
  getStats() {
    const stats = {};
    this.events.forEach((listeners, eventName) => {
      stats[eventName] = listeners.length;
    });
    return stats;
  }
}

// 使用示例
const bus = new MessageBus({ debug: true });

// 添加日志中间件
bus.use(async (context) => {
  console.log(`[中间件] 处理事件: ${context.eventName}`);
  return context;
});

// 添加验证中间件
bus.use(async (context) => {
  if (context.eventName.startsWith('admin:') && !context.payload.isAdmin) {
    context.stopped = true;
    console.log('[中间件] 非管理员操作被拦截');
  }
  return context;
});

// 订阅事件（高优先级）
bus.subscribe('user:created', (payload) => {
  console.log('发送欢迎邮件:', payload.email);
}, { priority: 10 });

// 订阅事件（低优先级）
bus.subscribe('user:created', (payload) => {
  console.log('记录日志:', payload);
}, { priority: 1 });

// 发布事件
bus.publish('user:created', {
  id: 1,
  name: 'Tom',
  email: 'tom@example.com'
});

// 请求-响应模式
bus.respond('user:get', async (data) => {
  // 模拟数据库查询
  return { id: data.id, name: 'Tom', email: 'tom@example.com' };
});

(async () => {
  const user = await bus.request('user:get', { id: 1 });
  console.log('获取到用户:', user);
})();
```

### 示例二：实现 DOM 事件委托模式

```javascript
/**
 * 基于观察者模式的 DOM 事件委托
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
    // 为所有支持的事件类型设置单一监听器
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

    // 从事件目标向上遍历，查找匹配的选择器
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

  // 添加委托事件
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

  // 移除委托事件
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

  // 一次性事件
  once(eventType, selector, callback) {
    const wrapper = (event, element) => {
      this.off(eventType, selector, wrapper);
      callback.call(element, event, element);
    };
    return this.on(eventType, selector, wrapper);
  }
}

// 使用示例
const delegator = new EventDelegator('#app');

// 委托所有按钮的点击事件
delegator.on('click', '.btn', function(event) {
  console.log('按钮被点击:', this.textContent);
});

// 委托列表项的点击事件
delegator.on('click', '.list-item', function(event, element) {
  console.log('列表项:', element.dataset.id);
});

// 输入框事件
delegator.on('input', 'input[type="text"]', function(event) {
  console.log('输入:', this.value);
});
```

### 示例三：实现简易版 RxJS Observable

```javascript
/**
 * 简易版 Observable 实现
 * 展示 RxJS 响应式编程的核心概念
 */
class Observable {
  constructor(subscribe) {
    this._subscribe = subscribe;
  }

  subscribe(observerOrNext, error, complete) {
    // 统一观察者格式
    const observer = typeof observerOrNext === 'function'
      ? { next: observerOrNext, error: error || (() => {}), complete: complete || (() => {}) }
      : observerOrNext;

    // 创建订阅
    const subscription = {
      unsubscribed: false,
      unsubscribe() {
        this.unsubscribed = true;
      }
    };

    // 包装观察者，添加取消订阅检查
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

    // 执行订阅函数
    this._subscribe(safeObserver);

    return subscription;
  }

  // 创建操作符

  // map - 转换每个值
  map(fn) {
    return new Observable(observer => {
      this.subscribe({
        next: value => observer.next(fn(value)),
        error: err => observer.error(err),
        complete: () => observer.complete()
      });
    });
  }

  // filter - 过滤值
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

  // take - 只取前 n 个值
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

  // debounceTime - 防抖
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

  // throttleTime - 节流
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

  // scan - 累积器
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

  // 静态创建方法

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

// 使用示例
// 基础用法
const numbers$ = Observable.from([1, 2, 3, 4, 5]);
numbers$
  .filter(x => x % 2 === 0)
  .map(x => x * 10)
  .subscribe({
    next: value => console.log(value),
    complete: () => console.log('完成')
  });
// 输出: 20, 40, 完成

// 事件流处理
const input = document.querySelector('#search');
if (input) {
  Observable.fromEvent(input, 'input')
    .map(e => e.target.value)
    .debounceTime(300)
    .filter(text => text.length >= 2)
    .subscribe(searchText => {
      console.log('搜索:', searchText);
    });
}

// 定时器
const timer$ = Observable.interval(1000)
  .take(5)
  .scan((acc, curr) => acc + curr, 0);

timer$.subscribe({
  next: value => console.log('累计:', value),
  complete: () => console.log('定时器完成')
});
// 输出: 累计: 0, 累计: 1, 累计: 3, 累计: 6, 累计: 10, 定时器完成
```

### 示例四：Vue 风格的响应式系统

```javascript
/**
 * Vue 风格的响应式系统
 * 展示 Vue 2/3 响应式原理
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
  // 为每个属性创建依赖收集器
  const deps = new Map();

  return new Proxy(obj, {
    get(target, key) {
      // 依赖收集
      if (!deps.has(key)) {
        deps.set(key, new Dep());
      }
      deps.get(key).depend();

      const value = target[key];
      // 递归处理嵌套对象
      if (value && typeof value === 'object') {
        return reactive(value);
      }
      return value;
    },

    set(target, key, value) {
      const oldValue = target[key];
      if (oldValue !== value) {
        target[key] = value;
        // 触发更新
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

// 使用示例
const state = reactive({
  count: 0,
  name: 'Vue',
  nested: {
    value: 100
  }
});

// 计算属性
const double = computed(() => state.count * 2);

// 副作用
watchEffect(() => {
  console.log(`Count: ${state.count}, Double: ${double.value}`);
});

// 侦听器
watch(
  () => state.count,
  (newVal, oldVal) => {
    console.log(`count 从 ${oldVal} 变为 ${newVal}`);
  }
);

state.count++; // 自动触发更新
state.count++; // 自动触发更新
```

## 最佳实践

### 选择合适的模式

```javascript
// 观察者模式：适合主题与观察者关系紧密的场景
class UserModel {
  constructor() {
    this.observers = [];
    this.data = {};
  }

  // 直接通知观察者
  setData(newData) {
    this.data = { ...this.data, ...newData };
    this.observers.forEach(obs => obs.update(this.data));
  }
}

// 发布订阅模式：适合需要解耦的复杂系统
const eventBus = new EventEmitter();

// 用户模块
class UserModule {
  login(user) {
    // 登录逻辑...
    eventBus.emit('user:login', user);
  }
}

// 统计模块（完全解耦）
eventBus.on('user:login', (user) => {
  analytics.track('login', user.id);
});

// 通知模块（完全解耦）
eventBus.on('user:login', (user) => {
  notification.show(`欢迎 ${user.name}`);
});
```

### 错误处理策略

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

// 使用
const emitter = new RobustEventEmitter({
  errorHandler: (error, eventName) => {
    // 可以上报到错误监控系统
    reportError({ error, eventName, timestamp: Date.now() });
  },
  continueOnError: true // 即使出错也继续执行其他监听器
});
```

### 内存管理

```javascript
class ManagedEventEmitter {
  constructor() {
    this.events = new Map();
    this.subscriptionCount = 0;
    this.maxSubscriptions = 1000;
  }

  on(eventName, callback, options = {}) {
    if (this.subscriptionCount >= this.maxSubscriptions) {
      console.warn('订阅数量已达上限，请检查是否有内存泄漏');
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

    // 返回可追踪的取消订阅函数
    const unsubscribe = () => {
      const listeners = this.events.get(eventName);
      if (listeners && listeners.has(subscription)) {
        listeners.delete(subscription);
        this.subscriptionCount--;
      }
    };

    // 如果指定了生命周期，自动取消订阅
    if (options.lifecycle) {
      options.lifecycle.onDestroy?.(() => unsubscribe());
    }

    return unsubscribe;
  }

  // 诊断方法
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

  // 清理长时间未使用的订阅
  cleanup(maxAge = 3600000) { // 默认1小时
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

### 类型安全的事件系统（TypeScript）

```typescript
// TypeScript 类型安全的事件系统
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

// 使用
const emitter = new TypedEventEmitter<EventMap>();

// 类型安全 - 自动推断参数类型
emitter.on('user:login', (data) => {
  console.log(data.userId); // 类型正确
  // console.log(data.name); // 类型错误
});

// 类型安全 - emit 参数类型检查
emitter.emit('user:login', { userId: '123', timestamp: Date.now() });
// emitter.emit('user:login', { wrong: 'data' }); // 类型错误
```

### 模块化组织

```javascript
// events/index.js - 统一的事件定义和管理
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

// 创建单例事件总线
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

// 使用
import { Events, eventBus } from './events';

// 订阅
eventBus.on(Events.USER.LOGIN, (user) => {
  console.log('用户登录:', user);
});

// 发布
eventBus.emit(Events.USER.LOGIN, { id: 1, name: 'Tom' });
```

## 常见陷阱

### 内存泄漏

```javascript
// 错误示例：忘记取消订阅
class LeakyComponent {
  constructor(eventBus) {
    this.eventBus = eventBus;

    // 每次创建组件都会添加新的监听器
    eventBus.on('data:update', (data) => {
      this.handleUpdate(data);
    });
  }

  handleUpdate(data) {
    console.log('更新数据:', data);
  }

  // 没有提供销毁方法！
}

// 正确示例：保存引用并在适当时候清理
class SafeComponent {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.unsubscribers = [];

    // 保存取消订阅函数
    this.unsubscribers.push(
      eventBus.on('data:update', this.handleUpdate.bind(this))
    );
  }

  handleUpdate(data) {
    console.log('更新数据:', data);
  }

  // 销毁时清理
  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}

// 在 React 中的正确用法
function MyComponent() {
  useEffect(() => {
    const unsubscribe = eventBus.on('event', handler);

    // 清理函数
    return () => unsubscribe();
  }, []);
}
```

### this 绑定问题

```javascript
// 错误示例
class Handler {
  constructor(name) {
    this.name = name;
  }

  handle(data) {
    console.log(`${this.name} 处理:`, data);
  }
}

const handler = new Handler('处理器');
eventBus.on('event', handler.handle); // this 丢失！
eventBus.emit('event', 'data'); // 错误：this.name is undefined

// 正确示例
// 方法一：使用 bind
eventBus.on('event', handler.handle.bind(handler));

// 方法二：使用箭头函数
eventBus.on('event', (data) => handler.handle(data));

// 方法三：在类中使用箭头函数定义方法
class BetterHandler {
  constructor(name) {
    this.name = name;
  }

  handle = (data) => {
    console.log(`${this.name} 处理:`, data);
  }
}
```

### 事件名冲突

```javascript
// 错误示例：使用简单的事件名
eventBus.on('update', handler1); // 模块 A
eventBus.on('update', handler2); // 模块 B - 冲突！

// 正确示例：使用命名空间
eventBus.on('moduleA:update', handler1);
eventBus.on('moduleB:update', handler2);

// 更好的方式：创建作用域事件发射器
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
moduleAEvents.on('update', handler1); // 实际是 'moduleA:update'
```

### 无限循环

```javascript
// 错误示例：监听器中触发同一事件
eventBus.on('data:change', (data) => {
  // 处理数据
  const newData = processData(data);

  // 危险！触发无限循环
  eventBus.emit('data:change', newData);
});

// 正确示例：使用不同的事件或添加防护
eventBus.on('data:change', (data) => {
  // 防止循环
  if (data._processed) return;

  const newData = {
    ...processData(data),
    _processed: true
  };

  // 使用不同的事件
  eventBus.emit('data:processed', newData);
});

// 更好的方式：明确区分输入和输出事件
eventBus.on('data:raw', (data) => {
  const processed = processData(data);
  eventBus.emit('data:processed', processed);
});
```

### 执行顺序依赖

```javascript
// 错误示例：依赖特定的执行顺序
let value = 0;

eventBus.on('event', () => {
  value = 10;
});

eventBus.on('event', () => {
  console.log(value * 2); // 依赖第一个处理器先执行
});

// 正确示例：使用优先级或显式的流程控制
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

// 或者使用 async/await 确保顺序
eventBus.on('event', async () => {
  const result = await step1();
  eventBus.emit('step1:complete', result);
});

eventBus.on('step1:complete', async (result) => {
  await step2(result);
});
```

## 性能考量

### 大量事件监听器的优化

```javascript
class OptimizedEventEmitter {
  constructor() {
    // 使用 Map 而不是普通对象，性能更好
    this.events = new Map();
    // 缓存事件数组，避免重复创建
    this.listenersCache = new Map();
  }

  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set()); // Set 的删除操作是 O(1)
    }
    this.events.get(eventName).add(callback);
    this.listenersCache.delete(eventName); // 清除缓存

    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    let listeners = this.listenersCache.get(eventName);

    if (!listeners) {
      const set = this.events.get(eventName);
      if (!set || set.size === 0) return;

      // 转换为数组并缓存
      listeners = Array.from(set);
      this.listenersCache.set(eventName, listeners);
    }

    // 使用 for 循环比 forEach 快
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

### 批量事件处理

```javascript
class BatchEventEmitter {
  constructor(options = {}) {
    this.events = new Map();
    this.pendingEvents = [];
    this.batchSize = options.batchSize || 100;
    this.batchDelay = options.batchDelay || 16; // 约一帧
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

  // 立即处理（绕过批处理）
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

### 使用 WeakMap 避免内存泄漏

```javascript
class WeakEventEmitter {
  constructor() {
    this.events = new Map();
    // 使用 WeakMap 存储对象与其监听器的关联
    this.objectListeners = new WeakMap();
  }

  // 将监听器与对象关联，当对象被垃圾回收时，监听器也会被清理
  onWithContext(eventName, context, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    const boundCallback = callback.bind(context);
    this.events.get(eventName).add(boundCallback);

    // 存储关联
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

  // 清理与特定对象关联的所有监听器
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

### 性能监控

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

    // 计数
    this.metrics.emitCount[eventName] =
      (this.metrics.emitCount[eventName] || 0) + 1;

    super.emit(eventName, ...args);

    // 记录耗时
    const duration = performance.now() - start;
    if (!this.metrics.emitDuration[eventName]) {
      this.metrics.emitDuration[eventName] = [];
    }
    this.metrics.emitDuration[eventName].push(duration);

    // 只保留最近 100 条记录
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

  // 识别慢事件
  getSlowEvents(threshold = 10) {
    return Object.entries(this.getMetrics())
      .filter(([, stats]) => stats.avgDuration > threshold)
      .sort((a, b) => b[1].avgDuration - a[1].avgDuration);
  }
}
```

## 实战场景

### 组件间通信

```javascript
// 在大型应用中使用事件总线进行跨组件通信
// eventBus.js
export const eventBus = new EventEmitter();

// HeaderComponent.js
class HeaderComponent {
  constructor() {
    this.cartCount = 0;

    // 监听购物车变化
    eventBus.on('cart:updated', (cart) => {
      this.cartCount = cart.items.length;
      this.render();
    });
  }

  render() {
    return `<header>购物车 (${this.cartCount})</header>`;
  }
}

// ProductComponent.js
class ProductComponent {
  addToCart(product) {
    // 添加商品到购物车...

    // 通知其他组件
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

### 状态管理

```javascript
// 基于发布订阅的简易状态管理
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

    // 通知所有订阅者
    this.emitter.emit('change', {
      prevState,
      nextState: newState
    });

    // 通知特定字段的订阅者
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

// 使用示例
const store = new Store({
  user: null,
  theme: 'light',
  count: 0
});

// 订阅所有变化
store.subscribe(({ prevState, nextState }) => {
  console.log('状态变化:', prevState, '->', nextState);
});

// 只订阅 theme 变化
store.subscribeKey('theme', ({ nextValue }) => {
  document.body.className = `theme-${nextValue}`;
});

store.setState({ theme: 'dark' });
store.setState(prev => ({ count: prev.count + 1 }));
```

### 插件系统

```javascript
// 基于事件的插件系统
class PluginSystem {
  constructor() {
    this.plugins = [];
    this.hooks = new EventEmitter();
  }

  // 注册插件
  use(plugin) {
    this.plugins.push(plugin);

    // 调用插件的 install 方法
    if (typeof plugin.install === 'function') {
      plugin.install(this.hooks);
    }

    return this;
  }

  // 触发钩子
  async trigger(hookName, context) {
    const listeners = this.hooks.listeners(hookName);

    for (const listener of listeners) {
      const result = await listener(context);

      // 允许插件修改上下文
      if (result !== undefined) {
        Object.assign(context, result);
      }
    }

    return context;
  }
}

// 定义插件
const loggingPlugin = {
  name: 'logging',
  install(hooks) {
    hooks.on('beforeRequest', (ctx) => {
      console.log(`[${new Date().toISOString()}] 请求: ${ctx.url}`);
    });

    hooks.on('afterResponse', (ctx) => {
      console.log(`[${new Date().toISOString()}] 响应: ${ctx.status}`);
    });
  }
};

const authPlugin = {
  name: 'auth',
  install(hooks) {
    hooks.on('beforeRequest', (ctx) => {
      // 添加认证头
      return {
        headers: {
          ...ctx.headers,
          'Authorization': `Bearer ${getToken()}`
        }
      };
    });
  }
};

// 使用插件系统
const system = new PluginSystem();
system.use(loggingPlugin).use(authPlugin);

// 发起请求时触发钩子
async function request(url, options = {}) {
  let ctx = { url, ...options };

  // 触发请求前钩子
  ctx = await system.trigger('beforeRequest', ctx);

  // 发起请求
  const response = await fetch(ctx.url, ctx);

  ctx.status = response.status;
  ctx.response = response;

  // 触发响应后钩子
  await system.trigger('afterResponse', ctx);

  return response;
}
```

### 实时数据同步

```javascript
// WebSocket + 事件系统实现实时同步
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
      console.log('WebSocket 已连接');
      this.reconnectAttempts = 0;
      this.emitter.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emitter.emit(message.type, message.payload);
        this.emitter.emit('message', message);
      } catch (e) {
        console.error('消息解析错误:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket 已断开');
      this.emitter.emit('disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      this.emitter.emit('error', error);
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`${delay}ms 后尝试重连...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  // 订阅特定类型的消息
  on(type, callback) {
    return this.emitter.on(type, callback);
  }

  // 发送消息
  send(type, payload) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket 未连接');
    }
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 使用示例
const sync = new RealtimeSync('wss://api.example.com/ws');

// 监听连接状态
sync.on('connected', () => {
  console.log('已连接到服务器');
});

// 监听特定消息类型
sync.on('user:online', (payload) => {
  console.log('用户上线:', payload.userId);
});

sync.on('chat:message', (payload) => {
  console.log('收到消息:', payload);
});

// 发送消息
sync.send('chat:message', { content: 'Hello!', to: 'user123' });
```

### 表单验证系统

```javascript
// 基于观察者模式的表单验证
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

  // 注册字段验证规则
  registerField(fieldName, rules = []) {
    const field = this.form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    this.fields.set(fieldName, { field, rules });

    // 实时验证
    field.addEventListener('blur', () => {
      this.validateField(fieldName);
    });

    field.addEventListener('input', () => {
      // 清除错误状态
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

  // 监听验证事件
  on(eventName, callback) {
    return this.emitter.on(eventName, callback);
  }
}

// 验证规则
const validators = {
  required: (message = '此字段必填') => ({
    validator: (value) => value.trim().length > 0,
    message
  }),

  email: (message = '请输入有效的邮箱地址') => ({
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),

  minLength: (min, message) => ({
    validator: (value) => value.length >= min,
    message: message || `至少需要 ${min} 个字符`
  }),

  pattern: (regex, message = '格式不正确') => ({
    validator: (value) => regex.test(value),
    message
  })
};

// 使用示例
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
    validators.minLength(8, '密码至少需要 8 个字符'),
    validators.pattern(/[A-Z]/, '密码需要包含大写字母')
  ]);

// 监听验证结果
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
  console.log('验证失败:', errors);
});
```

## 面试要点

### 常见面试问题

**1. 观察者模式和发布订阅模式有什么区别？**

答：主要区别在于耦合度和是否有中间层：
- 观察者模式：Subject 和 Observer 直接关联，Subject 直接调用 Observer 的方法
- 发布订阅模式：通过事件中心解耦，Publisher 和 Subscriber 互不知道对方的存在

```javascript
// 观察者模式：直接调用
subject.addObserver(observer);
subject.notify(); // 直接调用 observer.update()

// 发布订阅：通过中间层
eventBus.subscribe('event', handler);
eventBus.publish('event', data); // 通过事件中心分发
```

**2. 手写一个 EventEmitter**

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

**3. 如何避免发布订阅模式中的内存泄漏？**

答：
- 组件销毁时取消所有订阅
- 使用 WeakMap 存储对象关联的监听器
- 设置监听器数量上限并发出警告
- 提供清理方法和诊断工具

```javascript
// React 中的最佳实践
useEffect(() => {
  const unsubscribe = eventBus.on('event', handler);
  return () => unsubscribe(); // 清理
}, []);
```

**4. 实现一个支持 once 的 EventEmitter**

```javascript
class EventEmitter {
  // ...其他方法

  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback.apply(this, args);
    };
    wrapper.listener = callback; // 保存原始引用
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

**5. 解释 RxJS 中的 Observable 和 Observer**

答：
- Observable：可观察对象，代表一个值的集合或事件流
- Observer：观察者，包含 next、error、complete 三个方法
- Subscription：订阅，可用于取消订阅
- Operators：操作符，用于转换、过滤、组合数据流

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
  complete: () => console.log('完成')
});
```

**6. Vue 的响应式系统如何利用观察者模式？**

答：Vue 使用依赖收集（Dep）和观察者（Watcher）实现响应式：
- Dep：依赖收集器，每个响应式属性都有一个 Dep
- Watcher：观察者，包括渲染 Watcher、计算属性 Watcher、用户 Watcher
- 在 getter 中收集依赖，在 setter 中触发更新

```javascript
// Vue 2 简化原理
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
      dep.depend(); // 收集依赖
      return val;
    },
    set(newVal) {
      val = newVal;
      dep.notify(); // 触发更新
    }
  });
}
```

### 面试回答技巧

当被问到观察者/发布订阅模式时，可以从以下几个角度回答：

1. **定义与区别**：清晰区分两种模式
2. **实现原理**：能手写基础实现
3. **应用场景**：DOM 事件、框架原理、组件通信
4. **优缺点**：解耦 vs 调试困难、灵活 vs 性能开销
5. **实际经验**：结合项目经历说明使用场景

## 延伸阅读

### 官方资源

- [Node.js EventEmitter 文档](https://nodejs.org/api/events.html)
- [RxJS 官方文档](https://rxjs.dev/)
- [Vue.js 响应式原理](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [MDN - EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)

### 推荐书籍

- 《JavaScript 设计模式与开发实践》- 曾探
- 《Learning JavaScript Design Patterns》- Addy Osmani
- 《RxJS in Action》- Paul Daniels

### 相关库

- **mitt** - 轻量级 EventEmitter (200b)
- **eventemitter3** - 高性能 EventEmitter
- **RxJS** - 响应式编程库
- **@vue/reactivity** - Vue 3 响应式核心

### 进阶主题

- 响应式编程与函数式编程
- 事件溯源（Event Sourcing）
- CQRS（命令查询职责分离）
- 消息队列（RabbitMQ、Kafka）

## 总结

观察者模式和发布订阅模式是现代 JavaScript 开发中不可或缺的设计模式。理解这两种模式不仅有助于我们更好地使用现有框架和库，还能帮助我们设计出更加松耦合、可维护的系统架构。

**核心要点回顾**：

1. **观察者模式**：Subject 与 Observer 直接关联，适合简单的依赖关系
2. **发布订阅模式**：通过事件中心解耦，适合复杂的组件通信
3. **EventEmitter**：Node.js 风格的事件发射器，是发布订阅模式的典型实现
4. **RxJS**：响应式编程库，将事件流抽象为 Observable
5. **内存管理**：使用时务必注意取消订阅，避免内存泄漏
6. **性能优化**：大量事件时考虑批处理、缓存等优化策略

**实践建议**：

- 在需要解耦的场景优先考虑发布订阅模式
- 组件销毁时必须清理所有订阅
- 使用 TypeScript 增强类型安全
- 为事件添加命名空间避免冲突
- 在生产环境中添加性能监控

掌握这些模式，能够帮助你构建更加灵活、可扩展的 JavaScript 应用程序。
