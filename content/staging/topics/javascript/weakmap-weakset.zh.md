---
title: WeakMap 与 WeakSet 深入解析
description: 深入理解 JavaScript 中的 WeakMap 和 WeakSet,掌握弱引用机制、垃圾回收原理、与 Map/Set 的区别,以及在实际开发中的应用场景
track: javascript
section: core
difficulty: intermediate
tags:
  - WeakMap
  - WeakSet
  - 弱引用
  - 垃圾回收
  - 内存管理
  - ES6
status: imported
origin: old/src/content/docs/javascript/weakmap-weakset.zh.md
divergence: 0.181
issues:
  - title-lang-en
  - missing-subcategory-en
  - missing-subcategory-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: ""
  order: null
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 WeakMap 和 WeakSet

WeakMap 和 WeakSet 是 ES6 引入的两种特殊集合类型,它们与普通的 Map 和 Set 最大的区别在于对键(WeakMap)或值(WeakSet)的**弱引用**特性。

**WeakMap** 是一种键值对集合,其中键必须是对象(不能是原始值),且对键的引用是弱引用。当键对象没有其他引用时,该键值对会被自动垃圾回收。

**WeakSet** 是一种值的集合,其中的值必须是对象,且对值的引用同样是弱引用。当值对象没有其他引用时,该值会被自动垃圾回收。

### 弱引用 vs 强引用

在 JavaScript 中,普通的对象引用都是**强引用**。只要存在强引用指向某个对象,垃圾回收器就不会回收该对象。

```javascript
// 强引用示例
let obj = { name: "example" };
const map = new Map();
map.set(obj, "value");

obj = null; // 将 obj 置为 null
// 但由于 Map 中仍然强引用着原对象,该对象不会被垃圾回收
// map 仍然可以通过迭代访问到这个对象
```

**弱引用**则不会阻止垃圾回收:

```javascript
// 弱引用示例
let obj = { name: "example" };
const weakMap = new WeakMap();
weakMap.set(obj, "value");

obj = null; // 将 obj 置为 null
// 由于 WeakMap 对键是弱引用,当没有其他引用指向该对象时
// 垃圾回收器可以随时回收该对象,键值对也会被自动移除
```

### 设计背景与解决的问题

WeakMap 和 WeakSet 主要解决以下问题:

1. **内存泄漏**:当使用 Map/Set 存储对象引用时,即使这些对象在其他地方已不再使用,Map/Set 中的引用仍会阻止垃圾回收
2. **私有数据存储**:为对象关联私有数据,而不影响对象的生命周期
3. **缓存管理**:自动清理不再需要的缓存项,无需手动管理
4. **DOM 元素关联数据**:为 DOM 元素附加数据,当元素被移除时自动清理

## 核心原理

### 垃圾回收机制

JavaScript 引擎使用垃圾回收器(Garbage Collector)自动管理内存。主流的垃圾回收算法是**标记-清除**(Mark-and-Sweep):

1. 垃圾回收器从根对象(全局对象、当前调用栈中的变量等)开始
2. 标记所有从根对象可达的对象
3. 清除所有未被标记的对象

```
根对象 (root)
    |
    v
  对象A -----> 对象B
    |
    v
  对象C

未被引用的对象D、E 将被回收
```

### WeakMap/WeakSet 的弱引用实现

WeakMap 和 WeakSet 中的引用不会被垃圾回收器视为"可达"的路径:

```javascript
// 内存模型示意
const weakMap = new WeakMap();
let obj = { data: "important" };

weakMap.set(obj, { metadata: "info" });

// 此时的引用关系:
// 变量 obj ----强引用----> { data: "important" }
// weakMap ----弱引用----> { data: "important" }
//                              |
//                              v
//                        { metadata: "info" }

obj = null;

// 现在:
// weakMap ----弱引用----> { data: "important" } (无强引用,可被回收)
// 键对象被回收后,关联的值也会被回收
```

### 不可枚举性

由于垃圾回收的时机不确定,WeakMap 和 WeakSet **不支持迭代**:

- 没有 `size` 属性
- 没有 `keys()`、`values()`、`entries()` 方法
- 没有 `forEach()` 方法
- 无法使用 `for...of` 循环

这是因为在任意时刻,集合中的元素数量可能因垃圾回收而改变,提供迭代方法会导致不确定的行为。

### 底层实现原理

从引擎实现角度,WeakMap 通常采用**Ephemeron**(短命对)机制:

```
Ephemeron = (弱引用键, 强引用值)

规则:
1. 如果键可达 -> 整个 Ephemeron 存活
2. 如果键不可达 -> 整个 Ephemeron 可回收
```

这与普通 Map 的哈希表实现不同,后者对键和值都持有强引用。

## 核心要点

### WeakMap 核心特性

| 特性 | 说明 |
|------|------|
| 键类型 | 只能是对象(包括数组、函数等),不能是原始值 |
| 值类型 | 任意类型 |
| 引用类型 | 键是弱引用,值是强引用 |
| 可迭代 | 否 |
| size 属性 | 无 |

**支持的方法**:
- `set(key, value)` - 设置键值对
- `get(key)` - 获取值
- `has(key)` - 检查键是否存在
- `delete(key)` - 删除键值对

### WeakSet 核心特性

| 特性 | 说明 |
|------|------|
| 值类型 | 只能是对象,不能是原始值 |
| 引用类型 | 弱引用 |
| 可迭代 | 否 |
| size 属性 | 无 |

**支持的方法**:
- `add(value)` - 添加值
- `has(value)` - 检查值是否存在
- `delete(value)` - 删除值

### WeakMap vs Map 对比

```javascript
// Map - 强引用
const map = new Map();
let key = { id: 1 };
map.set(key, "data");
console.log(map.size);        // 1
key = null;
// key 对象仍然存在于 map 中,不会被回收
console.log(map.size);        // 仍然是 1

// WeakMap - 弱引用
const weakMap = new WeakMap();
let weakKey = { id: 2 };
weakMap.set(weakKey, "data");
// console.log(weakMap.size); // 错误! WeakMap 没有 size 属性
weakKey = null;
// weakKey 对象可能在下次 GC 时被回收
```

### WeakSet vs Set 对比

```javascript
// Set - 强引用,可迭代
const set = new Set();
let obj1 = { id: 1 };
set.add(obj1);
console.log([...set]);        // [{ id: 1 }]
obj1 = null;
console.log(set.size);        // 1 (对象未被回收)

// WeakSet - 弱引用,不可迭代
const weakSet = new WeakSet();
let obj2 = { id: 2 };
weakSet.add(obj2);
// console.log([...weakSet]); // 错误! WeakSet 不可迭代
obj2 = null;
// obj2 可能在下次 GC 时被回收
```

## 代码示例

### 基础用法

```javascript
// ========== WeakMap 基础用法 ==========
const weakMap = new WeakMap();

// 创建对象作为键
const user = { name: "Alice" };
const config = { theme: "dark" };

// 设置键值对
weakMap.set(user, { role: "admin", permissions: ["read", "write"] });
weakMap.set(config, { version: "1.0" });

// 获取值
console.log(weakMap.get(user));    // { role: "admin", permissions: [...] }
console.log(weakMap.get(config));  // { version: "1.0" }

// 检查键是否存在
console.log(weakMap.has(user));    // true
console.log(weakMap.has({}));      // false (不同的对象)

// 删除键值对
weakMap.delete(config);
console.log(weakMap.has(config));  // false

// ========== WeakSet 基础用法 ==========
const weakSet = new WeakSet();

const obj1 = { id: 1 };
const obj2 = { id: 2 };

// 添加值
weakSet.add(obj1);
weakSet.add(obj2);

// 检查值是否存在
console.log(weakSet.has(obj1));    // true
console.log(weakSet.has({ id: 1 })); // false (不同的对象引用)

// 删除值
weakSet.delete(obj1);
console.log(weakSet.has(obj1));    // false
```

### 私有数据存储

```javascript
// 使用 WeakMap 实现类的私有属性
const privateData = new WeakMap();

class Person {
  constructor(name, age, ssn) {
    // 公开属性
    this.name = name;
    this.age = age;

    // 私有数据存储在 WeakMap 中
    privateData.set(this, {
      ssn: ssn,           // 社会安全号码(敏感信息)
      password: null,
      loginAttempts: 0
    });
  }

  // 获取私有数据的方法
  getSSN(authToken) {
    if (this.validateAuth(authToken)) {
      return privateData.get(this).ssn;
    }
    throw new Error("Unauthorized");
  }

  setPassword(password) {
    const data = privateData.get(this);
    data.password = this.hashPassword(password);
  }

  validateAuth(token) {
    // 验证逻辑
    return token === "valid-token";
  }

  hashPassword(password) {
    // 简化的哈希示例
    return `hashed_${password}`;
  }

  incrementLoginAttempts() {
    const data = privateData.get(this);
    data.loginAttempts++;
    return data.loginAttempts;
  }
}

const person = new Person("Alice", 30, "123-45-6789");

console.log(person.name);              // "Alice" (公开)
console.log(person.ssn);               // undefined (私有数据不可直接访问)
console.log(privateData.get(person));  // 可以访问,但只在模块内部

// 当 person 对象被回收时,其私有数据也会自动被清理
```

### DOM 元素数据关联

```javascript
// 为 DOM 元素关联额外数据,元素移除时自动清理
const elementData = new WeakMap();

function setElementData(element, data) {
  const existing = elementData.get(element) || {};
  elementData.set(element, { ...existing, ...data });
}

function getElementData(element, key) {
  const data = elementData.get(element);
  return key ? data?.[key] : data;
}

// 使用示例
const button = document.createElement("button");
button.textContent = "Click me";

setElementData(button, {
  clickCount: 0,
  lastClicked: null,
  handler: () => console.log("clicked")
});

button.addEventListener("click", () => {
  const data = getElementData(button);
  data.clickCount++;
  data.lastClicked = new Date();
  console.log(`Button clicked ${data.clickCount} times`);
});

document.body.appendChild(button);

// 当 button 元素被移除且没有其他引用时
// elementData 中对应的数据会被自动垃圾回收
// document.body.removeChild(button);
// button = null; // 数据将被自动清理
```

### 对象标记与访问追踪

```javascript
// 使用 WeakSet 标记已处理的对象
const processedObjects = new WeakSet();

function processObject(obj) {
  // 避免重复处理
  if (processedObjects.has(obj)) {
    console.log("Object already processed, skipping...");
    return;
  }

  // 处理对象
  console.log("Processing:", obj);
  // ... 执行处理逻辑

  // 标记为已处理
  processedObjects.add(obj);
}

const data1 = { id: 1, value: "first" };
const data2 = { id: 2, value: "second" };

processObject(data1);  // Processing: { id: 1, value: "first" }
processObject(data2);  // Processing: { id: 2, value: "second" }
processObject(data1);  // Object already processed, skipping...

// 当 data1 不再被引用时,它会从 processedObjects 中自动移除
```

### 缓存实现

```javascript
// 使用 WeakMap 实现自动清理的缓存
const cache = new WeakMap();

function memoize(fn) {
  return function(obj, ...args) {
    // 使用对象作为缓存键
    if (!cache.has(obj)) {
      cache.set(obj, new Map());
    }

    const objCache = cache.get(obj);
    const key = JSON.stringify(args);

    if (objCache.has(key)) {
      console.log("Cache hit!");
      return objCache.get(key);
    }

    console.log("Cache miss, computing...");
    const result = fn.call(this, obj, ...args);
    objCache.set(key, result);
    return result;
  };
}

// 复杂计算函数
const computeExpensiveValue = memoize((obj, multiplier) => {
  // 模拟耗时计算
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += obj.value * multiplier;
  }
  return result / 1000000;
});

const dataObj = { value: 42 };

console.log(computeExpensiveValue(dataObj, 2));  // Cache miss
console.log(computeExpensiveValue(dataObj, 2));  // Cache hit
console.log(computeExpensiveValue(dataObj, 3));  // Cache miss (不同参数)

// 当 dataObj 不再被引用时,其缓存也会被自动清理
```

### 循环引用检测

```javascript
// 使用 WeakSet 检测对象的循环引用
function hasCircularReference(obj) {
  const visited = new WeakSet();

  function detect(value) {
    // 只检测对象类型
    if (value === null || typeof value !== "object") {
      return false;
    }

    // 发现循环引用
    if (visited.has(value)) {
      return true;
    }

    // 标记为已访问
    visited.add(value);

    // 递归检测所有属性
    for (const key of Object.keys(value)) {
      if (detect(value[key])) {
        return true;
      }
    }

    return false;
  }

  return detect(obj);
}

// 测试
const normalObj = {
  a: 1,
  b: { c: 2 },
  d: [1, 2, 3]
};
console.log(hasCircularReference(normalObj));  // false

const circularObj = { a: 1 };
circularObj.self = circularObj;
console.log(hasCircularReference(circularObj)); // true

const deepCircular = {
  level1: {
    level2: {
      level3: null
    }
  }
};
deepCircular.level1.level2.level3 = deepCircular.level1;
console.log(hasCircularReference(deepCircular)); // true
```

### 事件监听器管理

```javascript
// 使用 WeakMap 管理事件监听器,避免内存泄漏
class EventManager {
  constructor() {
    this.listeners = new WeakMap();
  }

  addEventListener(target, event, handler) {
    if (!this.listeners.has(target)) {
      this.listeners.set(target, new Map());
    }

    const targetListeners = this.listeners.get(target);
    if (!targetListeners.has(event)) {
      targetListeners.set(event, new Set());
    }

    targetListeners.get(event).add(handler);
    target.addEventListener(event, handler);
  }

  removeEventListener(target, event, handler) {
    const targetListeners = this.listeners.get(target);
    if (targetListeners?.has(event)) {
      targetListeners.get(event).delete(handler);
      target.removeEventListener(event, handler);
    }
  }

  removeAllListeners(target, event) {
    const targetListeners = this.listeners.get(target);
    if (!targetListeners) return;

    if (event) {
      // 移除特定事件的所有监听器
      const handlers = targetListeners.get(event);
      if (handlers) {
        handlers.forEach(handler => {
          target.removeEventListener(event, handler);
        });
        targetListeners.delete(event);
      }
    } else {
      // 移除目标的所有监听器
      targetListeners.forEach((handlers, evt) => {
        handlers.forEach(handler => {
          target.removeEventListener(evt, handler);
        });
      });
      this.listeners.delete(target);
    }
  }
}

// 使用示例
const eventManager = new EventManager();

const button = document.createElement("button");
const clickHandler = () => console.log("Clicked!");
const hoverHandler = () => console.log("Hovered!");

eventManager.addEventListener(button, "click", clickHandler);
eventManager.addEventListener(button, "mouseenter", hoverHandler);

// 当 button 元素被移除且不再被引用时
// WeakMap 中对应的监听器记录会被自动清理
```

## 最佳实践

### 明确使用场景

```javascript
// 正确:关联数据到对象,且不想阻止对象被回收
const metadata = new WeakMap();
function attachMetadata(obj, data) {
  metadata.set(obj, data);
}

// 错误:需要遍历所有键值对时,不应使用 WeakMap
// const config = new WeakMap(); // 无法枚举配置项
// 应该使用 Map
const config = new Map();
```

### 避免原始值作为键

```javascript
const weakMap = new WeakMap();

// 错误:原始值不能作为 WeakMap 的键
// weakMap.set("string-key", "value");  // TypeError
// weakMap.set(123, "value");           // TypeError
// weakMap.set(Symbol("key"), "value"); // TypeError

// 正确:使用对象作为键
const keyObj = { id: "unique" };
weakMap.set(keyObj, "value");
```

### 模块化私有数据

```javascript
// private-data.js
const privateStore = new WeakMap();

export function setPrivate(obj, key, value) {
  if (!privateStore.has(obj)) {
    privateStore.set(obj, {});
  }
  privateStore.get(obj)[key] = value;
}

export function getPrivate(obj, key) {
  return privateStore.get(obj)?.[key];
}

// user.js
import { setPrivate, getPrivate } from "./private-data.js";

class User {
  constructor(name, password) {
    this.name = name;
    setPrivate(this, "password", hashPassword(password));
    setPrivate(this, "token", null);
  }

  authenticate(password) {
    const storedPassword = getPrivate(this, "password");
    return hashPassword(password) === storedPassword;
  }
}
```

### 结合 WeakRef 使用(高级)

```javascript
// ES2021 引入的 WeakRef 可以与 WeakMap 配合使用
class Cache {
  constructor() {
    this.cache = new Map();
    this.finalizationRegistry = new FinalizationRegistry(key => {
      // 当对象被回收时,清理缓存条目
      console.log(`Cleaning up cache for key: ${key}`);
      this.cache.delete(key);
    });
  }

  set(key, value) {
    const ref = new WeakRef(value);
    this.cache.set(key, ref);
    this.finalizationRegistry.register(value, key);
  }

  get(key) {
    const ref = this.cache.get(key);
    if (ref) {
      const value = ref.deref();
      if (value !== undefined) {
        return value;
      }
      // 引用已失效,清理条目
      this.cache.delete(key);
    }
    return undefined;
  }
}
```

### 类型安全(TypeScript)

```typescript
// TypeScript 中的类型定义
interface UserData {
  role: string;
  permissions: string[];
  lastLogin: Date;
}

const userMetadata = new WeakMap<object, UserData>();

class User {
  constructor(public name: string) {
    userMetadata.set(this, {
      role: "user",
      permissions: [],
      lastLogin: new Date()
    });
  }

  getMetadata(): UserData | undefined {
    return userMetadata.get(this);
  }
}

// WeakSet 类型
const visitedNodes = new WeakSet<Node>();

function traverse(node: Node) {
  if (visitedNodes.has(node)) return;
  visitedNodes.add(node);
  // ... 处理节点
}
```

## 常见陷阱

### 误解垃圾回收时机

```javascript
const weakMap = new WeakMap();
let obj = { data: "test" };
weakMap.set(obj, "value");

obj = null;

// 陷阱:期望立即回收
console.log(weakMap.has(obj)); // 这里 obj 已经是 null,结果是 false

// 正确理解:垃圾回收时机不确定
// 原对象可能还存在于 WeakMap 中,直到 GC 运行
// 但我们无法通过 null 引用访问它
```

### 无法获取集合大小

```javascript
const weakMap = new WeakMap();
const weakSet = new WeakSet();

// 陷阱:尝试获取大小
// console.log(weakMap.size);      // undefined (不是错误,但没有意义)
// console.log(weakMap.length);    // undefined

// 正确做法:如果需要追踪大小,使用 Map/Set 或维护计数器
// 但这可能导致内存泄漏
```

### 对象字面量作为键

```javascript
const weakMap = new WeakMap();

// 陷阱:每次使用新对象字面量
weakMap.set({ id: 1 }, "first");
weakMap.set({ id: 1 }, "second");

console.log(weakMap.get({ id: 1 })); // undefined!
// 因为每个 {} 都是新对象,没有保存引用

// 正确做法:保存对象引用
const key = { id: 1 };
weakMap.set(key, "value");
console.log(weakMap.get(key)); // "value"
```

### 值的强引用误解

```javascript
const weakMap = new WeakMap();
let key = { id: 1 };
let value = { data: "important" };

weakMap.set(key, value);

// 陷阱:认为值也是弱引用
value = null;
// 值对象不会被回收,因为 WeakMap 对值是强引用
console.log(weakMap.get(key)); // { data: "important" } 仍然存在

key = null;
// 现在键和值都可能被回收(在下次 GC 时)
```

### 序列化问题

```javascript
const weakMap = new WeakMap();
const obj = { id: 1 };
weakMap.set(obj, { secret: "data" });

// 陷阱:无法序列化 WeakMap
// JSON.stringify(weakMap);  // "{}" 空对象
// 因为 WeakMap 不可枚举

// 如果需要序列化,应使用 Map
const map = new Map();
map.set("key", "value");
const serialized = JSON.stringify([...map]);
```

### 跨 Realm 使用

```javascript
// 陷阱:iframe 中的对象作为键
const weakMap = new WeakMap();

// 来自 iframe 的对象
const iframe = document.createElement("iframe");
document.body.appendChild(iframe);
const iframeObject = iframe.contentWindow.Object;

// 这可能工作,但当 iframe 被移除时
// 该对象可能意外地被回收或保留
weakMap.set(new iframeObject(), "value");

// 最佳做法:避免跨 Realm 使用 WeakMap
```

### 调试困难

```javascript
const weakMap = new WeakMap();
const key = { debug: true };
weakMap.set(key, { hidden: "data" });

// 陷阱:无法直接查看 WeakMap 内容
console.log(weakMap);  // WeakMap { <items unknown> }

// 调试技巧:保存键的引用用于调试
const debugKeys = new Set(); // 仅在开发环境使用

function debugSet(wm, key, value) {
  wm.set(key, value);
  if (process.env.NODE_ENV === "development") {
    debugKeys.add(key);
  }
}

function debugInspect(wm) {
  if (process.env.NODE_ENV !== "development") return;
  for (const key of debugKeys) {
    if (wm.has(key)) {
      console.log(key, "=>", wm.get(key));
    }
  }
}
```

## 性能考量

### 内存效率

```javascript
// 场景:大量 DOM 元素的数据关联
const elements = [];
for (let i = 0; i < 10000; i++) {
  const el = document.createElement("div");
  elements.push(el);
}

// 使用 Map - 元素移除后数据仍占用内存
const mapData = new Map();
elements.forEach((el, i) => mapData.set(el, { index: i, data: "..." }));
// 即使 elements 被清空,mapData 仍持有所有引用
// elements.length = 0; // mapData 中的数据不会被清理

// 使用 WeakMap - 元素移除后数据自动清理
const weakMapData = new WeakMap();
elements.forEach((el, i) => weakMapData.set(el, { index: i, data: "..." }));
// elements.length = 0; // 元素和对应数据会被 GC 回收
```

### 查找性能

```javascript
// WeakMap 和 Map 的查找都是 O(1) 复杂度
const iterations = 1000000;
const key = { id: 1 };

// Map 性能测试
const map = new Map();
map.set(key, "value");

console.time("Map.get");
for (let i = 0; i < iterations; i++) {
  map.get(key);
}
console.timeEnd("Map.get");

// WeakMap 性能测试
const weakMap = new WeakMap();
weakMap.set(key, "value");

console.time("WeakMap.get");
for (let i = 0; i < iterations; i++) {
  weakMap.get(key);
}
console.timeEnd("WeakMap.get");

// 两者性能相近,WeakMap 可能略慢(因为弱引用处理开销)
```

### 何时选择 WeakMap/WeakSet

```javascript
// 推荐使用 WeakMap 的场景:
// 1. 数据生命周期应与键对象一致
// 2. 不需要遍历所有数据
// 3. 键对象由外部代码管理

// 推荐使用 Map 的场景:
// 1. 需要遍历所有键值对
// 2. 需要知道集合大小
// 3. 键是原始值
// 4. 需要序列化数据

// 性能对比表
/*
操作           | Map        | WeakMap
--------------|------------|----------
set()         | O(1)       | O(1)
get()         | O(1)       | O(1)
has()         | O(1)       | O(1)
delete()      | O(1)       | O(1)
size          | O(1)       | N/A
迭代          | O(n)       | N/A
内存占用       | 较高       | 自动优化
GC 影响        | 阻止回收   | 不阻止
*/
```

### 内存泄漏防范

```javascript
// 不使用 WeakMap 的潜在内存泄漏
class LeakyCache {
  constructor() {
    this.cache = new Map();
  }

  store(obj, data) {
    this.cache.set(obj, data);
  }

  // 问题:即使 obj 不再需要,缓存仍持有引用
  // 除非手动调用 clear(),否则会造成内存泄漏
  clear() {
    this.cache.clear();
  }
}

// 使用 WeakMap 避免内存泄漏
class SafeCache {
  constructor() {
    this.cache = new WeakMap();
  }

  store(obj, data) {
    this.cache.set(obj, data);
  }

  // 无需 clear() 方法,当 obj 不再被引用时自动清理
}
```

## 实战场景

### React 组件实例数据

```javascript
// 在 React 类组件中关联私有数据
const componentData = new WeakMap();

class DataComponent extends React.Component {
  constructor(props) {
    super(props);
    componentData.set(this, {
      renderCount: 0,
      lastRenderTime: null,
      subscriptions: []
    });
  }

  componentDidMount() {
    const data = componentData.get(this);
    data.subscriptions.push(
      someObservable.subscribe(this.handleUpdate)
    );
  }

  componentWillUnmount() {
    const data = componentData.get(this);
    data.subscriptions.forEach(sub => sub.unsubscribe());
    // 组件实例被销毁时,数据自动清理
  }

  render() {
    const data = componentData.get(this);
    data.renderCount++;
    data.lastRenderTime = Date.now();
    return <div>Rendered {data.renderCount} times</div>;
  }
}
```

### Vue 响应式系统简化实现

```javascript
// Vue 3 响应式系统使用 WeakMap 存储依赖
const targetMap = new WeakMap();

function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  if (activeEffect) {
    dep.add(activeEffect);
  }
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (dep) {
    dep.forEach(effect => effect());
  }
}

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      trigger(target, key);
      return result;
    }
  });
}
```

### 深拷贝中处理循环引用

```javascript
function deepClone(obj, visited = new WeakMap()) {
  // 处理原始值
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // 处理循环引用
  if (visited.has(obj)) {
    return visited.get(obj);
  }

  // 处理 Date
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // 处理 RegExp
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }

  // 处理 Array
  if (Array.isArray(obj)) {
    const clone = [];
    visited.set(obj, clone);
    obj.forEach((item, index) => {
      clone[index] = deepClone(item, visited);
    });
    return clone;
  }

  // 处理普通对象
  const clone = Object.create(Object.getPrototypeOf(obj));
  visited.set(obj, clone);

  for (const key of Reflect.ownKeys(obj)) {
    clone[key] = deepClone(obj[key], visited);
  }

  return clone;
}

// 测试循环引用
const original = { name: "test" };
original.self = original;
original.nested = { parent: original };

const cloned = deepClone(original);
console.log(cloned.self === cloned);                    // true
console.log(cloned.nested.parent === cloned);           // true
console.log(cloned !== original);                       // true
```

### 权限验证系统

```javascript
// 使用 WeakSet 标记已验证的对象
const verifiedUsers = new WeakSet();
const verifiedRequests = new WeakSet();

class AuthSystem {
  static verifyUser(user) {
    // 执行验证逻辑...
    if (user.token && this.validateToken(user.token)) {
      verifiedUsers.add(user);
      return true;
    }
    return false;
  }

  static isUserVerified(user) {
    return verifiedUsers.has(user);
  }

  static verifyRequest(request) {
    if (request.signature && this.validateSignature(request)) {
      verifiedRequests.add(request);
      return true;
    }
    return false;
  }

  static processRequest(user, request) {
    if (!this.isUserVerified(user)) {
      throw new Error("User not verified");
    }
    if (!verifiedRequests.has(request)) {
      throw new Error("Request not verified");
    }

    // 处理请求...
    return { success: true };
  }

  static validateToken(token) {
    return token.startsWith("valid_");
  }

  static validateSignature(request) {
    return request.signature === "correct";
  }
}

// 使用示例
const user = { id: 1, token: "valid_abc123" };
const request = { action: "getData", signature: "correct" };

AuthSystem.verifyUser(user);
AuthSystem.verifyRequest(request);

console.log(AuthSystem.processRequest(user, request));
// { success: true }

// 当 user 或 request 对象不再被引用时
// 它们会从 WeakSet 中自动移除
```

### 节点访问追踪(树/图遍历)

```javascript
class Graph {
  constructor() {
    this.adjacencyList = new Map();
  }

  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  addEdge(v1, v2) {
    this.adjacencyList.get(v1)?.push(v2);
    this.adjacencyList.get(v2)?.push(v1);
  }

  // 使用 WeakSet 进行深度优先遍历
  dfs(start, callback) {
    const visited = new WeakSet();

    const traverse = (vertex) => {
      if (!vertex || visited.has(vertex)) return;

      visited.add(vertex);
      callback(vertex);

      const neighbors = this.adjacencyList.get(vertex) || [];
      neighbors.forEach(neighbor => traverse(neighbor));
    };

    traverse(start);
  }

  // 使用 WeakSet 进行广度优先遍历
  bfs(start, callback) {
    const visited = new WeakSet();
    const queue = [start];
    visited.add(start);

    while (queue.length) {
      const vertex = queue.shift();
      callback(vertex);

      const neighbors = this.adjacencyList.get(vertex) || [];
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
  }
}

// 使用对象作为节点
const nodeA = { id: "A" };
const nodeB = { id: "B" };
const nodeC = { id: "C" };
const nodeD = { id: "D" };

const graph = new Graph();
graph.addVertex(nodeA);
graph.addVertex(nodeB);
graph.addVertex(nodeC);
graph.addVertex(nodeD);
graph.addEdge(nodeA, nodeB);
graph.addEdge(nodeA, nodeC);
graph.addEdge(nodeB, nodeD);
graph.addEdge(nodeC, nodeD);

graph.dfs(nodeA, node => console.log("DFS visiting:", node.id));
// DFS visiting: A, B, D, C

graph.bfs(nodeA, node => console.log("BFS visiting:", node.id));
// BFS visiting: A, B, C, D
```

## 面试要点

### 基础概念题

**Q1: WeakMap 和 Map 的主要区别是什么?**

A: 主要区别包括:
1. **键的类型**:WeakMap 只能使用对象作为键,Map 可以使用任意值
2. **引用类型**:WeakMap 对键是弱引用,不阻止垃圾回收;Map 是强引用
3. **可迭代性**:WeakMap 不可迭代,没有 size 属性和遍历方法;Map 可迭代
4. **使用场景**:WeakMap 适合关联数据到对象且不影响对象生命周期;Map 适合需要遍历或统计的场景

**Q2: 为什么 WeakMap 的键只能是对象?**

A: 因为弱引用只对对象有意义。原始值(字符串、数字等)在 JavaScript 中是按值传递的,没有"引用"的概念。如果允许原始值作为键,就无法实现"当没有其他引用时自动删除"的特性。

**Q3: WeakMap 能否被垃圾回收?如何验证?**

A: WeakMap 中的键值对会在键对象没有其他强引用时被垃圾回收。由于 GC 时机不确定,无法直接验证。但可以通过以下方式间接验证:
```javascript
let obj = { data: new Array(1000000).fill("x") }; // 大对象
const weakMap = new WeakMap();
weakMap.set(obj, "value");

obj = null; // 移除强引用
// 手动触发 GC(仅在特定环境可用)
// global.gc && global.gc();
// 之后内存应该会下降
```

### 应用场景题

**Q4: 如何使用 WeakMap 实现类的私有属性?**

A:
```javascript
const privateProps = new WeakMap();

class MyClass {
  constructor(publicVal, privateVal) {
    this.publicVal = publicVal;
    privateProps.set(this, { privateVal });
  }

  getPrivate() {
    return privateProps.get(this).privateVal;
  }
}

const instance = new MyClass("public", "secret");
console.log(instance.publicVal);    // "public"
console.log(instance.privateVal);   // undefined
console.log(instance.getPrivate()); // "secret"
```

**Q5: WeakMap 在 Vue/React 中有哪些应用?**

A:
- **Vue 3 响应式系统**:使用 WeakMap 存储对象与其依赖的映射关系
- **React**:可用于存储组件实例的私有数据
- **缓存机制**:缓存组件的计算结果,组件销毁时自动清理
- **DOM 关联数据**:为 DOM 元素附加数据,元素移除时自动清理

**Q6: 如何用 WeakSet 实现对象的"已访问"标记?**

A:
```javascript
const visited = new WeakSet();

function processOnce(obj) {
  if (visited.has(obj)) {
    return "already processed";
  }
  visited.add(obj);
  // 处理逻辑
  return "processed";
}

const obj = { id: 1 };
console.log(processOnce(obj)); // "processed"
console.log(processOnce(obj)); // "already processed"
```

### 进阶题

**Q7: 解释 WeakMap 中"弱引用"的内存模型**

A: 在 WeakMap 中:
- 键是弱引用:不增加对象的引用计数,不阻止 GC
- 值是强引用:只要键存在,值就不会被回收
- 当键对象被回收时,对应的值也会被回收
- 实现上通常使用 Ephemeron 机制

**Q8: WeakRef 和 WeakMap 的关系是什么?**

A:
- WeakRef(ES2021)提供了对单个对象的弱引用
- WeakMap 是键值对集合,键是弱引用
- WeakRef 可以获取原始引用(通过 deref()),WeakMap 不能直接获取键
- 两者都不阻止垃圾回收,但使用场景不同

**Q9: 为什么 WeakMap/WeakSet 不支持迭代?**

A: 因为弱引用的特性使得集合内容随时可能因 GC 而改变:
1. 迭代开始时的元素数量无法确定
2. 迭代过程中元素可能被回收
3. 提供迭代方法会导致不可预测的行为
4. 为保证 API 的可靠性,设计上禁用了迭代功能

## 延伸阅读

### 官方文档

- [MDN - WeakMap](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- [MDN - WeakSet](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)
- [MDN - WeakRef](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
- [ECMAScript 规范 - WeakMap](https://tc39.es/ecma262/#sec-weakmap-objects)

### 深入理解

- [JavaScript.info - WeakMap and WeakSet](https://javascript.info/weakmap-weakset)
- [V8 Blog - Weak references and finalizers](https://v8.dev/features/weak-references)
- [Exploring ES6 - Maps and Sets](https://exploringjs.com/es6/ch_maps-sets.html)

### 相关概念

- [MDN - Memory Management](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Memory_Management)
- [V8 - Garbage Collection](https://v8.dev/blog/trash-talk)
- [FinalizationRegistry](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)

### 实践案例

- [Vue 3 Reactivity - targetMap 实现](https://github.com/vuejs/core/blob/main/packages/reactivity/src/effect.ts)
- [Lodash - memoize with WeakMap](https://lodash.com/docs/#memoize)
