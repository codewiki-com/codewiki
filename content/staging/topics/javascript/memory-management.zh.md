---
title: JavaScript 内存管理与垃圾回收
description: 深入理解 JavaScript 内存管理机制：内存生命周期、垃圾回收算法、内存泄漏检测与 WeakRef/FinalizationRegistry
track: javascript
section: core
difficulty: advanced
tags:
  - JavaScript
  - 内存管理
  - 垃圾回收
  - 性能优化
  - WeakRef
status: imported
origin: old/src/content/docs/javascript/memory-management.zh.md
divergence: 0.294
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: 性能优化
  order: 20
  lastUpdated: 2026-01-07
---

## 概念解释

内存管理是编程中的核心概念之一。在 JavaScript 中,内存管理是自动进行的,开发者不需要像 C/C++ 那样手动分配和释放内存。然而,理解 JavaScript 的内存管理机制对于编写高性能应用、避免内存泄漏至关重要。

JavaScript 使用垃圾回收(Garbage Collection, GC)机制自动管理内存。垃圾回收器会定期检查不再使用的对象并释放其占用的内存。虽然这简化了开发过程,但不当的代码仍可能导致内存泄漏和性能问题。

### 历史背景

早期的编程语言如 C 和 C++ 要求开发者手动管理内存,这容易导致内存泄漏和悬垂指针等问题。JavaScript 从诞生之初就采用了自动垃圾回收机制,最初使用引用计数算法,后来演进为更高效的标记-清除算法。随着 Web 应用日益复杂,JavaScript 引擎(如 V8)不断优化垃圾回收策略,引入了分代回收、增量标记等技术。

## 核心原理

### 内存生命周期

JavaScript 中的内存生命周期包含三个阶段:

```javascript
// 1. 分配内存 (Allocation)
const num = 123;                    // 为数值分配内存
const str = "hello";                // 为字符串分配内存
const obj = { a: 1, b: 2 };         // 为对象及其属性分配内存
const arr = [1, 2, 3];              // 为数组及其元素分配内存
const fn = function() {};           // 为函数分配内存

// 2. 使用内存 (Usage)
console.log(num);                   // 读取变量
obj.a = 10;                         // 写入属性
arr.push(4);                        // 修改数组

// 3. 释放内存 (Release)
// 当变量不再被引用时,垃圾回收器会自动释放内存
```

### 栈内存与堆内存

JavaScript 引擎使用两种类型的内存:

```javascript
// 栈内存 (Stack)
// - 存储原始类型值和函数调用的执行上下文
// - 大小固定,访问速度快
// - 自动分配和释放
let a = 10;           // 原始类型存储在栈中
let b = true;         // 布尔值存储在栈中
let c = "hello";      // 字符串(不可变)存储在栈中

// 堆内存 (Heap)
// - 存储引用类型(对象、数组、函数)
// - 大小不固定,动态分配
// - 需要垃圾回收器管理
let obj = { x: 1 };   // 对象存储在堆中,变量 obj 存储引用地址
let arr = [1, 2, 3];  // 数组存储在堆中
let fn = () => {};    // 函数存储在堆中
```

**内存布局示意:**

```
栈内存 (Stack)              堆内存 (Heap)
+----------------+         +------------------------+
| a = 10         |         |                        |
| b = true       |         |  { x: 1 }  ← obj 指向  |
| c = "hello"    |         |                        |
| obj = 0x001    | ------> |  [1, 2, 3] ← arr 指向  |
| arr = 0x002    | ------> |                        |
| fn  = 0x003    | ------> |  () => {} ← fn 指向    |
+----------------+         +------------------------+
```

### 垃圾回收算法

#### 引用计数 (Reference Counting)

早期的垃圾回收算法,通过计数对象被引用的次数来决定是否回收:

```javascript
// 引用计数的工作原理
let obj1 = { name: 'object1' };  // 引用计数: 1
let obj2 = obj1;                  // 引用计数: 2

obj1 = null;                      // 引用计数: 1
obj2 = null;                      // 引用计数: 0 -> 可以被回收

// 引用计数的致命缺陷: 循环引用
function circularReference() {
  const objA = {};
  const objB = {};

  objA.ref = objB;  // objA 引用 objB
  objB.ref = objA;  // objB 引用 objA

  // 即使函数执行完毕,两个对象的引用计数都不为 0
  // 在纯引用计数算法中,这会导致内存泄漏
}

circularReference();
// 现代浏览器使用标记-清除算法,能正确处理循环引用
```

#### 标记-清除 (Mark and Sweep)

现代 JavaScript 引擎使用的主要垃圾回收算法:

```javascript
/*
 * 标记-清除算法分为两个阶段:
 *
 * 1. 标记阶段 (Mark):
 *    - 从根对象(全局对象、当前执行栈中的变量)开始
 *    - 遍历所有可达的对象,标记为"存活"
 *
 * 2. 清除阶段 (Sweep):
 *    - 遍历堆内存中的所有对象
 *    - 回收未被标记的对象
 */

// 根对象示例
// - 全局变量 (window/global)
// - 当前执行栈中的局部变量和参数
// - 闭包引用的变量

let globalVar = { data: 'global' };  // 根对象,始终可达

function example() {
  let localVar = { data: 'local' };  // 函数执行时可达

  return function closure() {
    return localVar;  // 闭包使 localVar 保持可达
  };
}

const myClosure = example();
// localVar 通过闭包保持可达,不会被回收
```

### V8 引擎的分代垃圾回收

V8 引擎将堆内存分为新生代和老生代,采用不同的回收策略:

```javascript
/*
 * 新生代 (Young Generation / New Space)
 * - 存储生命周期短的对象
 * - 空间较小 (1-8MB)
 * - 使用 Scavenge 算法 (复制算法)
 * - 分为 From 空间和 To 空间
 *
 * 老生代 (Old Generation / Old Space)
 * - 存储生命周期长的对象
 * - 空间较大
 * - 使用标记-清除和标记-整理算法
 */

// 对象晋升条件:
// 1. 对象经历过一次 Scavenge 回收后仍然存活
// 2. To 空间使用率超过 25%

// 新生代对象
function createShortLivedObjects() {
  for (let i = 0; i < 1000; i++) {
    const temp = { index: i };  // 短命对象,很快被回收
  }
}

// 老生代对象
const longLivedCache = new Map();
function addToCache(key, value) {
  longLivedCache.set(key, value);  // 长期存活,晋升到老生代
}
```

**V8 垃圾回收策略:**

```javascript
/*
 * 1. Scavenge 算法 (新生代)
 *    - 将 From 空间中存活的对象复制到 To 空间
 *    - 复制完成后交换 From 和 To
 *    - 优点: 速度快,无碎片
 *    - 缺点: 空间利用率只有 50%
 *
 * 2. Mark-Sweep 标记-清除 (老生代)
 *    - 标记所有存活对象
 *    - 清除未标记对象
 *    - 缺点: 会产生内存碎片
 *
 * 3. Mark-Compact 标记-整理 (老生代)
 *    - 标记存活对象
 *    - 将存活对象移动到内存一端
 *    - 清理边界外的内存
 *    - 解决碎片问题,但速度较慢
 */
```

### 增量标记与并发回收

为了减少垃圾回收对应用的影响,V8 采用了多种优化技术:

```javascript
/*
 * 1. 增量标记 (Incremental Marking)
 *    - 将标记过程分成多个小步骤
 *    - 与 JavaScript 执行交替进行
 *    - 减少单次停顿时间
 *
 * 2. 并发标记 (Concurrent Marking)
 *    - 在独立线程中进行标记
 *    - 不阻塞主线程
 *
 * 3. 并行清除 (Parallel Sweeping)
 *    - 使用多个线程同时清除垃圾
 *
 * 4. 惰性清除 (Lazy Sweeping)
 *    - 不立即清除所有垃圾
 *    - 按需清除,延迟释放内存
 */

// 主线程与 GC 的交互
//
// 传统方式 (Stop-the-world):
// |----JS执行----|--------GC--------|----JS执行----|
//                 ↑ 完全停顿
//
// 增量标记:
// |--JS--|--GC--|--JS--|--GC--|--JS--|--GC--|--JS--|
//         ↑ 多次小停顿
//
// 并发标记:
// 主线程: |--------JS执行--------|
// GC线程:    |------GC标记------|
//            ↑ 几乎不停顿
```

## 核心要点

### 内存分配规则

| 类型 | 存储位置 | 示例 |
|------|----------|------|
| 原始类型 | 栈内存 | `number`, `string`, `boolean`, `null`, `undefined`, `symbol`, `bigint` |
| 引用类型 | 堆内存 | `Object`, `Array`, `Function`, `Map`, `Set` |
| 函数参数 | 栈内存(值)/堆引用(对象) | 原始类型复制值,引用类型复制引用 |
| 闭包变量 | 堆内存 | 闭包引用的外部变量 |

### 垃圾回收触发条件

```javascript
// GC 触发的常见场景:

// 1. 内存分配时空间不足
const largeArray = new Array(1000000).fill({ data: 'test' });

// 2. 定期检查 (V8 会根据内存使用情况调度 GC)

// 3. 手动触发 (仅在 Node.js 中可用,不推荐)
if (global.gc) {
  global.gc();  // 需要 --expose-gc 标志启动 Node.js
}

// 4. 页面卸载或标签页切换时,浏览器可能触发 GC
```

### 可达性判断

```javascript
// 对象可达性示例

// 1. 全局可达
window.globalData = { value: 1 };  // 始终可达

// 2. 局部可达
function test() {
  const localData = { value: 2 };  // 函数执行期间可达
  console.log(localData);
}
test();  // 函数执行完毕,localData 不可达

// 3. 闭包可达
function createCounter() {
  let count = 0;  // 通过闭包保持可达
  return {
    increment: () => ++count,
    getCount: () => count
  };
}
const counter = createCounter();

// 4. 链式可达
const root = {
  child: {
    grandchild: {
      value: 'deep'
    }
  }
};
// grandchild 通过 root -> child -> grandchild 链可达

root.child = null;  // grandchild 不再可达,可被回收
```

## 代码示例

### 内存分配与释放

```javascript
// 基本的内存管理模式
class ResourceManager {
  constructor() {
    this.resources = new Map();
  }

  // 分配资源
  allocate(id, data) {
    if (this.resources.has(id)) {
      console.warn(`资源 ${id} 已存在`);
      return false;
    }

    this.resources.set(id, {
      data,
      createdAt: Date.now(),
      size: this.estimateSize(data)
    });

    console.log(`已分配资源 ${id},估计大小: ${this.resources.get(id).size} 字节`);
    return true;
  }

  // 释放资源
  release(id) {
    if (!this.resources.has(id)) {
      console.warn(`资源 ${id} 不存在`);
      return false;
    }

    this.resources.delete(id);
    console.log(`已释放资源 ${id}`);
    return true;
  }

  // 释放所有资源
  releaseAll() {
    const count = this.resources.size;
    this.resources.clear();
    console.log(`已释放 ${count} 个资源`);
  }

  // 估算对象大小 (简化版)
  estimateSize(obj) {
    const seen = new WeakSet();

    function sizeOf(value) {
      if (value === null) return 0;

      const type = typeof value;

      switch (type) {
        case 'undefined': return 0;
        case 'boolean': return 4;
        case 'number': return 8;
        case 'string': return value.length * 2;
        case 'symbol': return 0;
        case 'bigint': return 8;
        case 'function': return 0;
        case 'object':
          if (seen.has(value)) return 0;
          seen.add(value);

          let size = 0;
          if (Array.isArray(value)) {
            size = value.reduce((acc, item) => acc + sizeOf(item), 0);
          } else {
            for (const key in value) {
              if (Object.prototype.hasOwnProperty.call(value, key)) {
                size += key.length * 2 + sizeOf(value[key]);
              }
            }
          }
          return size;
        default:
          return 0;
      }
    }

    return sizeOf(obj);
  }
}

// 使用示例
const manager = new ResourceManager();

manager.allocate('cache-1', { users: [1, 2, 3], data: 'test' });
manager.allocate('cache-2', new Array(1000).fill('item'));

console.log('当前资源数:', manager.resources.size);

manager.release('cache-1');
manager.releaseAll();
```

### WeakRef 弱引用

ES2021 引入的 `WeakRef` 允许创建对象的弱引用,不会阻止垃圾回收:

```javascript
// WeakRef 基础用法
class Cache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value) {
    // 存储对象的弱引用
    this.cache.set(key, new WeakRef(value));
  }

  get(key) {
    const ref = this.cache.get(key);
    if (!ref) return undefined;

    // deref() 返回原始对象,如果已被回收则返回 undefined
    const value = ref.deref();

    if (value === undefined) {
      // 对象已被垃圾回收,清理缓存条目
      this.cache.delete(key);
      return undefined;
    }

    return value;
  }

  has(key) {
    const ref = this.cache.get(key);
    if (!ref) return false;

    const value = ref.deref();
    if (value === undefined) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// 使用示例
const cache = new Cache();

(function() {
  const largeObject = {
    data: new Array(10000).fill('x'),
    name: 'temporary'
  };

  cache.set('temp', largeObject);
  console.log('设置缓存:', cache.get('temp')?.name);  // 'temporary'
})();

// largeObject 离开作用域后可能被回收
// 之后 cache.get('temp') 可能返回 undefined
```

### FinalizationRegistry 清理注册

`FinalizationRegistry` 允许在对象被垃圾回收时执行清理回调:

```javascript
// FinalizationRegistry 基础用法
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`对象已被回收,关联值: ${heldValue}`);
  // 执行清理操作,如关闭文件句柄、释放外部资源等
});

class ManagedResource {
  constructor(name) {
    this.name = name;
    this.resource = this.acquireResource();

    // 注册清理回调
    // 参数: 要跟踪的对象, 传递给回调的值, 可选的注销令牌
    registry.register(this, `resource-${name}`, this);
  }

  acquireResource() {
    console.log(`获取资源: ${this.name}`);
    return { handle: Math.random() };
  }

  dispose() {
    // 手动释放时注销注册
    registry.unregister(this);
    console.log(`手动释放资源: ${this.name}`);
  }
}

// 使用示例
function createTemporaryResource() {
  const resource = new ManagedResource('temp');
  // resource 在函数结束后不再可达
}

createTemporaryResource();
// 当 GC 运行时,会触发 FinalizationRegistry 的回调
```

### 综合示例:带自动清理的缓存系统

```javascript
class SmartCache {
  #cache = new Map();
  #weakRefs = new Map();
  #registry;
  #maxSize;
  #hitCount = 0;
  #missCount = 0;

  constructor(maxSize = 100) {
    this.#maxSize = maxSize;

    // 设置清理注册表
    this.#registry = new FinalizationRegistry((key) => {
      console.log(`缓存项 "${key}" 已被垃圾回收`);
      this.#weakRefs.delete(key);
    });
  }

  // 设置强引用缓存项
  set(key, value) {
    // 如果缓存已满,移除最旧的项
    if (this.#cache.size >= this.#maxSize) {
      const firstKey = this.#cache.keys().next().value;
      this.#cache.delete(firstKey);
    }

    this.#cache.set(key, value);
  }

  // 设置弱引用缓存项 (可被 GC 回收)
  setWeak(key, value) {
    const ref = new WeakRef(value);
    this.#weakRefs.set(key, ref);
    this.#registry.register(value, key, ref);
  }

  // 获取缓存项
  get(key) {
    // 先检查强引用缓存
    if (this.#cache.has(key)) {
      this.#hitCount++;
      return this.#cache.get(key);
    }

    // 再检查弱引用缓存
    const ref = this.#weakRefs.get(key);
    if (ref) {
      const value = ref.deref();
      if (value !== undefined) {
        this.#hitCount++;
        return value;
      }
      // 对象已被回收
      this.#weakRefs.delete(key);
    }

    this.#missCount++;
    return undefined;
  }

  // 获取缓存统计
  getStats() {
    return {
      strongCacheSize: this.#cache.size,
      weakCacheSize: this.#weakRefs.size,
      hitCount: this.#hitCount,
      missCount: this.#missCount,
      hitRate: this.#hitCount / (this.#hitCount + this.#missCount) || 0
    };
  }

  // 清除所有缓存
  clear() {
    this.#cache.clear();

    // 注销所有弱引用
    for (const [key, ref] of this.#weakRefs) {
      this.#registry.unregister(ref);
    }
    this.#weakRefs.clear();
  }
}

// 使用示例
const cache = new SmartCache(50);

// 强引用缓存 - 不会被自动回收
cache.set('config', { theme: 'dark', language: 'zh-CN' });

// 弱引用缓存 - 可能被 GC 回收
const tempData = { large: new Array(10000).fill('data') };
cache.setWeak('temp-data', tempData);

console.log('Config:', cache.get('config'));
console.log('Temp Data:', cache.get('temp-data'));
console.log('Stats:', cache.getStats());
```

## 最佳实践

### 及时解除引用

```javascript
// 好的做法: 不再需要时解除引用
class DataProcessor {
  constructor() {
    this.data = null;
  }

  processLargeData(largeData) {
    // 处理数据
    const result = this.transform(largeData);

    // 处理完成后,清空引用
    largeData = null;

    return result;
  }

  transform(data) {
    return data.map(item => item * 2);
  }

  // 在不需要时清理
  dispose() {
    this.data = null;
  }
}
```

### 避免全局变量

```javascript
// 不好的做法: 污染全局作用域
window.myData = { huge: new Array(1000000) };

// 好的做法: 使用模块或 IIFE
(function() {
  const myData = { huge: new Array(1000000) };
  // myData 只在此作用域内可用

  // 使用完后会自动被回收
})();

// 更好的做法: 使用 ES 模块
// module.js
const privateData = new Map();

export function setData(key, value) {
  privateData.set(key, value);
}

export function clearData(key) {
  privateData.delete(key);
}
```

### 正确管理事件监听器

```javascript
class Component {
  constructor(element) {
    this.element = element;
    this.handlers = new Map();
  }

  // 添加事件监听器并保存引用
  addEventListener(event, handler) {
    this.element.addEventListener(event, handler);

    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }

  // 移除特定事件的所有监听器
  removeEventListeners(event) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        this.element.removeEventListener(event, handler);
      });
      this.handlers.delete(event);
    }
  }

  // 清理所有监听器
  destroy() {
    for (const [event, handlers] of this.handlers) {
      handlers.forEach(handler => {
        this.element.removeEventListener(event, handler);
      });
    }
    this.handlers.clear();
    this.element = null;
  }
}

// 使用示例
const component = new Component(document.getElementById('myElement'));

component.addEventListener('click', () => console.log('clicked'));
component.addEventListener('mouseover', () => console.log('hovered'));

// 组件销毁时清理
component.destroy();
```

### 使用 WeakMap 存储私有数据

```javascript
// WeakMap 的键是弱引用,不会阻止 GC
const privateData = new WeakMap();

class User {
  constructor(name, password) {
    this.name = name;

    // 使用 WeakMap 存储敏感数据
    privateData.set(this, {
      password: this.hashPassword(password),
      sessions: []
    });
  }

  hashPassword(password) {
    // 简化的哈希示例
    return btoa(password);
  }

  validatePassword(password) {
    const data = privateData.get(this);
    return data.password === this.hashPassword(password);
  }

  addSession(sessionId) {
    const data = privateData.get(this);
    data.sessions.push(sessionId);
  }

  getSessions() {
    return [...privateData.get(this).sessions];
  }
}

// 使用示例
let user = new User('张三', 'secret123');
console.log(user.validatePassword('secret123'));  // true

// 当 user 被回收时,privateData 中对应的条目也会被自动清理
user = null;
```

### 定时器管理

```javascript
class TimerManager {
  constructor() {
    this.timers = new Set();
    this.intervals = new Set();
  }

  setTimeout(callback, delay, ...args) {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      callback(...args);
    }, delay);

    this.timers.add(id);
    return id;
  }

  clearTimeout(id) {
    if (this.timers.has(id)) {
      window.clearTimeout(id);
      this.timers.delete(id);
    }
  }

  setInterval(callback, delay, ...args) {
    const id = window.setInterval(callback, delay, ...args);
    this.intervals.add(id);
    return id;
  }

  clearInterval(id) {
    if (this.intervals.has(id)) {
      window.clearInterval(id);
      this.intervals.delete(id);
    }
  }

  // 清理所有定时器
  clearAll() {
    for (const id of this.timers) {
      window.clearTimeout(id);
    }
    this.timers.clear();

    for (const id of this.intervals) {
      window.clearInterval(id);
    }
    this.intervals.clear();
  }
}

// 使用示例
const timerManager = new TimerManager();

const timeoutId = timerManager.setTimeout(() => {
  console.log('延迟执行');
}, 1000);

const intervalId = timerManager.setInterval(() => {
  console.log('定期执行');
}, 2000);

// 组件卸载时清理所有定时器
// timerManager.clearAll();
```

## 常见陷阱

### 意外的全局变量

```javascript
// 陷阱: 未声明的变量成为全局变量
function createLeak() {
  // 没有使用 var/let/const
  leakedData = new Array(1000000).fill('leak');  // 成为 window.leakedData
}

createLeak();
console.log(window.leakedData);  // 全局可访问,不会被回收

// 解决方案: 使用严格模式
'use strict';

function noLeak() {
  // 这会抛出 ReferenceError
  // leakedData = 'test';

  const data = 'test';  // 正确做法
}
```

### 被遗忘的定时器

```javascript
// 陷阱: 定时器持有对象引用
function startPolling() {
  const heavyData = new Array(1000000).fill('data');

  // 这个 setInterval 永远不会停止
  setInterval(() => {
    // heavyData 被闭包引用,永远不会被回收
    console.log(heavyData.length);
  }, 1000);
}

startPolling();
// heavyData 永远无法被回收

// 解决方案: 保存定时器 ID 并在适当时机清除
class PollingService {
  constructor() {
    this.intervalId = null;
    this.data = null;
  }

  start() {
    this.data = new Array(1000000).fill('data');

    this.intervalId = setInterval(() => {
      console.log(this.data.length);
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.data = null;  // 释放数据引用
  }
}
```

### 闭包引起的内存泄漏

```javascript
// 陷阱: 闭包意外持有大对象引用
function createClosure() {
  const largeData = new Array(1000000).fill('x');
  const smallValue = largeData.length;

  // 虽然只使用了 smallValue,但 largeData 也被闭包持有
  return function() {
    return smallValue;
  };
}

// 解决方案: 只在闭包中保留必要的数据
function createOptimizedClosure() {
  let largeData = new Array(1000000).fill('x');
  const smallValue = largeData.length;

  // 明确释放不需要的引用
  largeData = null;

  return function() {
    return smallValue;
  };
}
```

### DOM 引用

```javascript
// 陷阱: 保留已移除的 DOM 元素引用
class Widget {
  constructor() {
    this.element = document.createElement('div');
    document.body.appendChild(this.element);

    // 存储引用
    this.button = this.element.querySelector('button');
  }

  remove() {
    // 从 DOM 中移除
    this.element.remove();

    // 但 this.element 和 this.button 仍然持有引用
    // DOM 元素及其子元素无法被回收
  }
}

// 解决方案: 清空所有 DOM 引用
class OptimizedWidget {
  constructor() {
    this.element = document.createElement('div');
    document.body.appendChild(this.element);
    this.button = this.element.querySelector('button');
  }

  destroy() {
    // 从 DOM 中移除
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    // 清空引用
    this.element = null;
    this.button = null;
  }
}
```

### 循环引用中的事件监听器

```javascript
// 陷阱: 对象和 DOM 元素之间的循环引用
function setupCircularReference() {
  const element = document.getElementById('myButton');
  const data = {
    element: element,  // data 引用 element
    onClick: function() {
      console.log(this.element);
    }
  };

  // element 通过事件监听器引用 data
  element.addEventListener('click', data.onClick.bind(data));

  // 即使 element 从 DOM 移除,data 仍然引用它
  // element 也通过事件监听器引用 data
}

// 解决方案: 使用 WeakRef 或正确清理
function setupProperReference() {
  const element = document.getElementById('myButton');

  const handler = function() {
    console.log('clicked');
  };

  element.addEventListener('click', handler);

  // 返回清理函数
  return function cleanup() {
    element.removeEventListener('click', handler);
  };
}
```

## 性能考量

### 内存使用监控

```javascript
// 使用 Performance API 监控内存
if (performance.memory) {
  function logMemoryUsage() {
    const memory = performance.memory;
    console.log('内存使用情况:', {
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      usage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)}%`
    });
  }

  // 定期监控
  setInterval(logMemoryUsage, 5000);
}

// Node.js 环境
if (typeof process !== 'undefined' && process.memoryUsage) {
  function logNodeMemory() {
    const usage = process.memoryUsage();
    console.log('Node.js 内存使用:', {
      rss: `${(usage.rss / 1048576).toFixed(2)} MB`,
      heapTotal: `${(usage.heapTotal / 1048576).toFixed(2)} MB`,
      heapUsed: `${(usage.heapUsed / 1048576).toFixed(2)} MB`,
      external: `${(usage.external / 1048576).toFixed(2)} MB`,
      arrayBuffers: `${(usage.arrayBuffers / 1048576).toFixed(2)} MB`
    });
  }
}
```

### 对象池模式

```javascript
// 对象池可以减少 GC 压力
class ObjectPool {
  constructor(factory, reset, initialSize = 10) {
    this.factory = factory;
    this.reset = reset;
    this.pool = [];

    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.factory();
  }

  release(obj) {
    this.reset(obj);
    this.pool.push(obj);
  }

  get size() {
    return this.pool.length;
  }
}

// 使用示例: 粒子系统
const particlePool = new ObjectPool(
  // 工厂函数
  () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, active: false }),
  // 重置函数
  (particle) => {
    particle.x = 0;
    particle.y = 0;
    particle.vx = 0;
    particle.vy = 0;
    particle.life = 0;
    particle.active = false;
  },
  // 初始大小
  100
);

// 获取粒子
const particle = particlePool.acquire();
particle.x = Math.random() * 800;
particle.y = Math.random() * 600;
particle.vx = Math.random() * 2 - 1;
particle.vy = Math.random() * 2 - 1;
particle.life = 100;
particle.active = true;

// 使用完毕后归还
particlePool.release(particle);
```

### 避免频繁创建对象

```javascript
// 不好的做法: 在循环中创建对象
function badPractice(items) {
  return items.map(item => {
    // 每次迭代都创建新对象
    return {
      x: item.x,
      y: item.y,
      transform: { rotate: 0, scale: 1 }  // 每次都创建
    };
  });
}

// 好的做法: 重用对象
const tempTransform = { rotate: 0, scale: 1 };

function goodPractice(items) {
  const results = new Array(items.length);

  for (let i = 0; i < items.length; i++) {
    results[i] = {
      x: items[i].x,
      y: items[i].y,
      // 如果 transform 只是临时使用,可以共享
      transform: tempTransform
    };
  }

  return results;
}

// 更好的做法: 使用类型化数组处理大量数值数据
function processWithTypedArray(points) {
  // 每个点包含 x, y, z 三个值
  const coords = new Float32Array(points.length * 3);

  for (let i = 0; i < points.length; i++) {
    coords[i * 3] = points[i].x;
    coords[i * 3 + 1] = points[i].y;
    coords[i * 3 + 2] = points[i].z;
  }

  return coords;
}
```

### 内存泄漏检测

```javascript
// 简单的内存泄漏检测器
class MemoryLeakDetector {
  constructor(options = {}) {
    this.snapshots = [];
    this.threshold = options.threshold || 10;  // MB
    this.interval = options.interval || 10000;  // ms
    this.onLeak = options.onLeak || console.warn;
    this.timerId = null;
  }

  start() {
    if (typeof performance === 'undefined' || !performance.memory) {
      console.warn('performance.memory 不可用');
      return;
    }

    this.timerId = setInterval(() => {
      this.takeSnapshot();
      this.analyze();
    }, this.interval);

    console.log('内存泄漏检测已启动');
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      console.log('内存泄漏检测已停止');
    }
  }

  takeSnapshot() {
    const memory = performance.memory;
    this.snapshots.push({
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize
    });

    // 只保留最近 10 个快照
    if (this.snapshots.length > 10) {
      this.snapshots.shift();
    }
  }

  analyze() {
    if (this.snapshots.length < 2) return;

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    const growth = (last.usedJSHeapSize - first.usedJSHeapSize) / 1048576;
    const timeSpan = (last.timestamp - first.timestamp) / 1000;

    if (growth > this.threshold) {
      this.onLeak({
        message: `检测到可能的内存泄漏: 在 ${timeSpan.toFixed(1)} 秒内增长了 ${growth.toFixed(2)} MB`,
        growth: growth,
        timeSpan: timeSpan,
        snapshots: [...this.snapshots]
      });
    }
  }
}

// 使用示例
const detector = new MemoryLeakDetector({
  threshold: 5,  // 5MB 阈值
  interval: 5000,  // 5秒检查一次
  onLeak: (info) => {
    console.error('内存泄漏警告:', info.message);
    // 可以发送到监控系统
  }
});

// detector.start();
// detector.stop();
```

## 实战场景

### 场景一: SPA 应用的内存管理

```javascript
// 单页应用中的组件内存管理
class SPAComponentManager {
  constructor() {
    this.components = new Map();
    this.subscriptions = new Map();
  }

  // 注册组件
  register(name, component) {
    // 如果已存在同名组件,先销毁
    if (this.components.has(name)) {
      this.unregister(name);
    }

    this.components.set(name, component);
    this.subscriptions.set(name, []);

    console.log(`组件 ${name} 已注册`);
  }

  // 添加订阅
  addSubscription(name, subscription) {
    const subs = this.subscriptions.get(name);
    if (subs) {
      subs.push(subscription);
    }
  }

  // 注销组件
  unregister(name) {
    const component = this.components.get(name);

    if (component) {
      // 调用组件的清理方法
      if (typeof component.destroy === 'function') {
        component.destroy();
      }

      this.components.delete(name);
    }

    // 取消所有订阅
    const subs = this.subscriptions.get(name);
    if (subs) {
      subs.forEach(sub => {
        if (typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        } else if (typeof sub === 'function') {
          sub();  // 假设是清理函数
        }
      });

      this.subscriptions.delete(name);
    }

    console.log(`组件 ${name} 已注销`);
  }

  // 页面切换时的清理
  onPageChange(newPage) {
    // 获取需要销毁的组件
    const componentsToDestroy = [];

    for (const [name, component] of this.components) {
      if (!component.persistent) {
        componentsToDestroy.push(name);
      }
    }

    // 销毁非持久化组件
    componentsToDestroy.forEach(name => this.unregister(name));

    console.log(`页面切换到 ${newPage},清理了 ${componentsToDestroy.length} 个组件`);
  }

  // 应用退出时的清理
  destroy() {
    for (const name of this.components.keys()) {
      this.unregister(name);
    }

    console.log('所有组件已清理');
  }
}

// 使用示例
const componentManager = new SPAComponentManager();

// 创建一个示例组件
class UserListComponent {
  constructor() {
    this.data = [];
    this.timerId = setInterval(() => this.refresh(), 30000);
    this.persistent = false;  // 页面切换时销毁
  }

  refresh() {
    console.log('刷新用户列表');
  }

  destroy() {
    clearInterval(this.timerId);
    this.data = null;
    console.log('UserListComponent 已销毁');
  }
}

componentManager.register('userList', new UserListComponent());

// 页面切换
// componentManager.onPageChange('settings');
```

### 场景二: 大数据处理

```javascript
// 处理大型数据集时的内存优化
class LargeDataProcessor {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 10000;
    this.processedCount = 0;
    this.totalCount = 0;
  }

  // 流式处理大数据
  async *processStream(dataSource) {
    let chunk = [];

    for await (const item of dataSource) {
      chunk.push(item);

      if (chunk.length >= this.chunkSize) {
        // 处理当前块
        const result = this.processChunk(chunk);
        yield result;

        // 清空块,让 GC 回收
        chunk = [];

        // 给其他任务执行机会
        await this.yieldToEventLoop();
      }
    }

    // 处理剩余数据
    if (chunk.length > 0) {
      yield this.processChunk(chunk);
    }
  }

  processChunk(chunk) {
    this.processedCount += chunk.length;

    // 处理逻辑...
    const result = chunk.map(item => ({
      id: item.id,
      processed: true,
      value: item.value * 2
    }));

    return result;
  }

  // 让出事件循环
  yieldToEventLoop() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  // 分块处理数组
  async processArray(array) {
    this.totalCount = array.length;
    this.processedCount = 0;

    const results = [];

    for (let i = 0; i < array.length; i += this.chunkSize) {
      const chunk = array.slice(i, i + this.chunkSize);
      const processed = this.processChunk(chunk);
      results.push(...processed);

      // 报告进度
      console.log(`处理进度: ${this.processedCount}/${this.totalCount}`);

      // 让出事件循环,避免阻塞
      await this.yieldToEventLoop();
    }

    return results;
  }
}

// 使用示例
async function processLargeData() {
  const processor = new LargeDataProcessor({ chunkSize: 5000 });

  // 模拟大数据
  const largeData = Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    value: Math.random() * 100
  }));

  console.log('开始处理大数据...');
  const results = await processor.processArray(largeData);
  console.log('处理完成,结果数量:', results.length);

  // 处理完成后清空引用
  largeData.length = 0;
}

// processLargeData();
```

### 场景三: 图片资源管理

```javascript
// 图片资源的内存管理
class ImageResourceManager {
  constructor(maxCacheSize = 50) {
    this.cache = new Map();
    this.maxCacheSize = maxCacheSize;
    this.loadingPromises = new Map();

    // 使用 FinalizationRegistry 追踪图片对象
    this.registry = new FinalizationRegistry((url) => {
      console.log(`图片资源已被回收: ${url}`);
    });
  }

  async load(url) {
    // 检查缓存
    if (this.cache.has(url)) {
      const cached = this.cache.get(url);
      // 更新访问时间
      cached.lastAccessed = Date.now();
      return cached.image;
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    // 开始加载
    const loadPromise = this.loadImage(url);
    this.loadingPromises.set(url, loadPromise);

    try {
      const image = await loadPromise;

      // 清理过期缓存
      this.evictIfNeeded();

      // 添加到缓存
      this.cache.set(url, {
        image,
        lastAccessed: Date.now(),
        size: this.estimateImageSize(image)
      });

      // 注册清理追踪
      this.registry.register(image, url);

      return image;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`加载图片失败: ${url}`));
      img.src = url;
    });
  }

  evictIfNeeded() {
    if (this.cache.size >= this.maxCacheSize) {
      // 找到最旧的条目
      let oldestUrl = null;
      let oldestTime = Infinity;

      for (const [url, entry] of this.cache) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestUrl = url;
        }
      }

      if (oldestUrl) {
        this.remove(oldestUrl);
      }
    }
  }

  remove(url) {
    const entry = this.cache.get(url);
    if (entry) {
      // 清理图片资源
      if (entry.image.src) {
        entry.image.src = '';
      }
      this.cache.delete(url);
      console.log(`已从缓存移除图片: ${url}`);
    }
  }

  estimateImageSize(img) {
    // 估算图片内存占用 (width * height * 4 bytes for RGBA)
    return img.width * img.height * 4;
  }

  clear() {
    for (const [url, entry] of this.cache) {
      if (entry.image.src) {
        entry.image.src = '';
      }
    }
    this.cache.clear();
    console.log('图片缓存已清空');
  }

  getStats() {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    return {
      count: this.cache.size,
      totalSize: `${(totalSize / 1048576).toFixed(2)} MB`,
      maxSize: this.maxCacheSize
    };
  }
}

// 使用示例
const imageManager = new ImageResourceManager(30);

async function loadGallery(urls) {
  for (const url of urls) {
    try {
      const img = await imageManager.load(url);
      console.log(`加载成功: ${img.width}x${img.height}`);
    } catch (error) {
      console.error(error.message);
    }
  }

  console.log('缓存状态:', imageManager.getStats());
}
```

## 面试要点

### 常见面试问题

**1. 什么是垃圾回收?JavaScript 使用什么垃圾回收算法?**

JavaScript 使用自动垃圾回收机制,主要采用标记-清除(Mark and Sweep)算法。现代引擎如 V8 还使用分代垃圾回收,将堆分为新生代和老生代,对不同生命周期的对象采用不同的回收策略。

**2. 什么情况下会发生内存泄漏?如何避免?**

常见的内存泄漏场景:
- 意外的全局变量
- 未清除的定时器和回调
- 闭包中的意外引用
- 脱离 DOM 的引用
- 事件监听器未移除

避免方法:使用严格模式、及时清理定时器和事件监听器、使用 WeakMap/WeakSet、注意闭包中的引用。

**3. WeakMap 和 Map 的区别是什么?**

```javascript
// Map: 键可以是任意类型,强引用
const map = new Map();
let obj = { name: 'test' };
map.set(obj, 'value');
obj = null;  // map 仍然持有对原对象的引用

// WeakMap: 键只能是对象,弱引用
const weakMap = new WeakMap();
let obj2 = { name: 'test' };
weakMap.set(obj2, 'value');
obj2 = null;  // 对象可以被 GC 回收,weakMap 中的条目自动消失
```

**4. 什么是 V8 引擎的分代垃圾回收?**

V8 将堆内存分为:
- 新生代:存放生命周期短的对象,使用 Scavenge 算法(复制算法)
- 老生代:存放生命周期长的对象,使用标记-清除和标记-整理算法

对象晋升条件:经历一次 Scavenge 后仍存活,或 To 空间使用率超过 25%。

**5. 如何检测内存泄漏?**

```javascript
// 浏览器开发者工具
// 1. Performance 面板录制内存使用
// 2. Memory 面板拍摄堆快照
// 3. 比较不同时间点的快照

// 代码中监控
if (performance.memory) {
  console.log('Used heap:', performance.memory.usedJSHeapSize);
}

// Node.js
console.log(process.memoryUsage());
```

**6. WeakRef 和 FinalizationRegistry 的使用场景是什么?**

- WeakRef:创建对象的弱引用,适用于缓存系统,允许缓存的对象在内存压力下被回收
- FinalizationRegistry:在对象被回收时执行清理逻辑,适用于管理外部资源(如文件句柄、网络连接)

### 编码题示例

```javascript
// 题目: 实现一个不会阻止对象被垃圾回收的缓存
class WeakValueCache {
  constructor() {
    this.cache = new Map();
    this.registry = new FinalizationRegistry((key) => {
      this.cache.delete(key);
    });
  }

  set(key, value) {
    const ref = new WeakRef(value);
    this.cache.set(key, ref);
    this.registry.register(value, key, ref);
  }

  get(key) {
    const ref = this.cache.get(key);
    if (!ref) return undefined;

    const value = ref.deref();
    if (value === undefined) {
      this.cache.delete(key);
    }

    return value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }
}
```

## 延伸阅读

### 官方文档
- [MDN - Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
- [MDN - WeakRef](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
- [MDN - FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)
- [V8 Blog - Trash talk: the Orinoco garbage collector](https://v8.dev/blog/trash-talk)

### 经典书籍
- 《JavaScript 高级程序设计》第四版 - 内存管理章节
- 《你不知道的 JavaScript》- 作用域与闭包
- 《高性能 JavaScript》- 内存管理与优化

### 优质文章
- [A tour of V8: Garbage Collection](https://jayconrod.com/posts/55/a-tour-of-v8-garbage-collection)
- [Visualizing memory management in V8 Engine](https://deepu.tech/memory-management-in-v8/)
- [解读 V8 GC Log](https://juejin.cn/post/6844903614986067982)
- [JavaScript 内存泄漏教程](https://www.ruanyifeng.com/blog/2017/04/memory-leak.html)

### 调试工具
- Chrome DevTools Memory Panel
- Node.js --inspect 标志
- heapdump 模块 (Node.js)
- v8-profiler-next (Node.js)
