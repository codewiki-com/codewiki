---
title: JavaScript 异步编程完全指南
description: 掌握JavaScript异步编程模式，从回调到async/await
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - 异步
  - Promise
  - async/await
status: imported
origin: old/src/content/docs/frontend/async-javascript.zh.md
divergence: 0.19
issues: []
legacy:
  category: Frontend
  subcategory: JavaScript
  order: 8
  lastUpdated: 2026-01-07
---

## 同步 vs 异步编程

### 什么是同步编程

同步编程是指代码按照书写顺序依次执行，每一行代码必须等待上一行代码执行完成后才能执行。这种执行方式简单直观，但在处理耗时操作时会造成程序阻塞。

```javascript
// 同步代码示例
console.log('开始');
const result = calculateSum(1000000); // 假设这是一个耗时计算
console.log('计算结果:', result);
console.log('结束');

// 输出顺序：开始 → 计算结果 → 结束
```

### 什么是异步编程

异步编程允许程序在等待某个操作完成的同时继续执行其他代码。当异步操作完成时，通过回调函数、Promise 或 async/await 来处理结果。

```javascript
// 异步代码示例
console.log('开始');

setTimeout(() => {
  console.log('异步操作完成');
}, 1000);

console.log('结束');

// 输出顺序：开始 → 结束 → 异步操作完成
```

### 为什么需要异步编程

JavaScript 是单线程语言，如果所有操作都是同步的，那么在进行网络请求、文件读取等耗时操作时，整个程序都会被阻塞，用户界面会无响应。异步编程解决了这个问题：

```javascript
// 如果 fetch 是同步的（假设场景）
const data = fetch('/api/users'); // 网络请求可能需要几秒钟
// 在这几秒钟内，用户无法进行任何操作

// 实际的异步 fetch
fetch('/api/users')
  .then(response => response.json())
  .then(data => console.log(data));
// 用户可以继续与页面交互
```

## 回调函数与回调地狱

### 回调函数基础

回调函数是 JavaScript 中最早的异步处理方式。它是一个作为参数传递给另一个函数的函数，在异步操作完成后被调用。

```javascript
// 基本回调函数示例
function fetchData(callback) {
  setTimeout(() => {
    const data = { id: 1, name: '张三' };
    callback(data);
  }, 1000);
}

fetchData((data) => {
  console.log('获取到数据:', data);
});
```

### 错误优先回调

Node.js 风格的回调函数约定将错误作为第一个参数：

```javascript
function readFile(path, callback) {
  setTimeout(() => {
    if (path === '') {
      callback(new Error('路径不能为空'), null);
    } else {
      callback(null, '文件内容');
    }
  }, 1000);
}

readFile('data.txt', (error, data) => {
  if (error) {
    console.error('读取失败:', error.message);
    return;
  }
  console.log('读取成功:', data);
});
```

### 回调地狱

当多个异步操作需要按顺序执行时，回调函数会层层嵌套，形成所谓的"回调地狱"（Callback Hell）：

```javascript
// 回调地狱示例
getUser(userId, (error, user) => {
  if (error) {
    handleError(error);
    return;
  }
  getOrders(user.id, (error, orders) => {
    if (error) {
      handleError(error);
      return;
    }
    getOrderDetails(orders[0].id, (error, details) => {
      if (error) {
        handleError(error);
        return;
      }
      getProductInfo(details.productId, (error, product) => {
        if (error) {
          handleError(error);
          return;
        }
        console.log('商品信息:', product);
      });
    });
  });
});
```

这种代码存在几个严重问题：

1. **可读性差**：代码向右不断缩进，难以阅读
2. **维护困难**：修改中间的逻辑需要小心处理嵌套关系
3. **错误处理复杂**：每一层都需要单独处理错误
4. **代码复用困难**：逻辑紧密耦合，难以提取复用

## Promise 详解

### Promise 的概念

Promise 是 ES6 引入的异步编程解决方案，它代表一个异步操作的最终完成或失败及其结果值。Promise 让异步代码的编写和理解更加清晰。

```javascript
// 创建一个 Promise
const promise = new Promise((resolve, reject) => {
  // 异步操作
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve('操作成功');
    } else {
      reject(new Error('操作失败'));
    }
  }, 1000);
});
```

### Promise 的三种状态

Promise 有且只有三种状态：

1. **Pending（待定）**：初始状态，既没有被兑现也没有被拒绝
2. **Fulfilled（已兑现）**：操作成功完成
3. **Rejected（已拒绝）**：操作失败

```javascript
// 状态转换示例
const pendingPromise = new Promise(() => {});
console.log(pendingPromise); // Promise { <pending> }

const fulfilledPromise = Promise.resolve('成功');
console.log(fulfilledPromise); // Promise { '成功' }

const rejectedPromise = Promise.reject(new Error('失败'));
console.log(rejectedPromise); // Promise { <rejected> Error: 失败 }
```

状态转换的重要规则：

- 状态只能从 Pending 转换到 Fulfilled 或 Rejected
- 状态一旦改变，就不会再变化
- 状态改变后，Promise 的值也固定不变

### 链式调用

Promise 的核心优势之一是支持链式调用，这解决了回调地狱的问题：

```javascript
// 使用 Promise 改写之前的回调地狱
getUser(userId)
  .then(user => getOrders(user.id))
  .then(orders => getOrderDetails(orders[0].id))
  .then(details => getProductInfo(details.productId))
  .then(product => {
    console.log('商品信息:', product);
  })
  .catch(error => {
    console.error('发生错误:', error);
  });
```

### then、catch、finally 方法

```javascript
// then 方法 - 处理成功和失败
promise.then(
  value => console.log('成功:', value),
  error => console.log('失败:', error)
);

// catch 方法 - 专门处理失败
promise
  .then(value => console.log('成功:', value))
  .catch(error => console.log('失败:', error));

// finally 方法 - 无论成功失败都执行
promise
  .then(value => console.log('成功:', value))
  .catch(error => console.log('失败:', error))
  .finally(() => console.log('清理工作'));
```

### 值的传递和穿透

```javascript
// then 返回值会被包装成 Promise
Promise.resolve(1)
  .then(value => value + 1)
  .then(value => value * 2)
  .then(value => console.log(value)); // 4

// then 返回 Promise 会等待其完成
Promise.resolve(1)
  .then(value => {
    return new Promise(resolve => {
      setTimeout(() => resolve(value + 1), 1000);
    });
  })
  .then(value => console.log(value)); // 1秒后输出 2

// 值穿透 - 如果 then 的参数不是函数
Promise.resolve('穿透值')
  .then(null)
  .then(value => console.log(value)); // '穿透值'
```

## Promise 静态方法

### Promise.all

`Promise.all` 接收一个 Promise 数组，当所有 Promise 都成功时返回结果数组，任何一个失败则整体失败：

```javascript
// 并发请求多个 API
const promises = [
  fetch('/api/users').then(r => r.json()),
  fetch('/api/products').then(r => r.json()),
  fetch('/api/orders').then(r => r.json())
];

Promise.all(promises)
  .then(([users, products, orders]) => {
    console.log('用户:', users);
    console.log('商品:', products);
    console.log('订单:', orders);
  })
  .catch(error => {
    console.error('至少一个请求失败:', error);
  });

// 实际应用：批量上传文件
async function uploadFiles(files) {
  const uploadPromises = files.map(file => uploadFile(file));
  const results = await Promise.all(uploadPromises);
  console.log('所有文件上传完成:', results);
}
```

### Promise.race

`Promise.race` 返回第一个完成的 Promise 的结果（无论成功或失败）：

```javascript
// 实现请求超时
function fetchWithTimeout(url, timeout = 5000) {
  const fetchPromise = fetch(url);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('请求超时')), timeout);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

fetchWithTimeout('/api/data', 3000)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error.message));

// 从多个源获取数据，使用最快的响应
const sources = [
  fetch('https://api1.example.com/data'),
  fetch('https://api2.example.com/data'),
  fetch('https://api3.example.com/data')
];

Promise.race(sources)
  .then(response => console.log('最快的响应来自:', response.url));
```

### Promise.allSettled

`Promise.allSettled` 等待所有 Promise 完成，无论成功或失败，返回每个 Promise 的状态和结果：

```javascript
const promises = [
  Promise.resolve('成功1'),
  Promise.reject(new Error('失败1')),
  Promise.resolve('成功2'),
  Promise.reject(new Error('失败2'))
];

Promise.allSettled(promises).then(results => {
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Promise ${index}: 成功 - ${result.value}`);
    } else {
      console.log(`Promise ${index}: 失败 - ${result.reason.message}`);
    }
  });
});

// 输出：
// Promise 0: 成功 - 成功1
// Promise 1: 失败 - 失败1
// Promise 2: 成功 - 成功2
// Promise 3: 失败 - 失败2

// 实际应用：批量操作并统计结果
async function batchProcess(items) {
  const results = await Promise.allSettled(
    items.map(item => processItem(item))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  console.log(`成功: ${succeeded.length}, 失败: ${failed.length}`);
  return { succeeded, failed };
}
```

### Promise.any

`Promise.any` 返回第一个成功的 Promise，只有当所有 Promise 都失败时才会失败：

```javascript
// 从多个源获取数据，只要有一个成功即可
const promises = [
  fetch('https://primary-api.com/data').then(r => r.json()),
  fetch('https://backup-api.com/data').then(r => r.json()),
  fetch('https://fallback-api.com/data').then(r => r.json())
];

Promise.any(promises)
  .then(data => {
    console.log('获取到数据:', data);
  })
  .catch(error => {
    // AggregateError 包含所有失败原因
    console.error('所有请求都失败了:', error.errors);
  });

// 实际应用：CDN 资源加载
function loadScript(urls) {
  const loadPromises = urls.map(url => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve(url);
      script.onerror = () => reject(new Error(`加载失败: ${url}`));
      document.head.appendChild(script);
    });
  });

  return Promise.any(loadPromises);
}
```

## async/await 语法

### 基本语法

`async/await` 是 ES2017 引入的语法糖，让异步代码看起来像同步代码：

```javascript
// async 函数声明
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data;
}

// async 箭头函数
const fetchUserData = async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data;
};

// async 方法
const user = {
  async getData() {
    const response = await fetch('/api/user');
    return response.json();
  }
};

// async 类方法
class UserService {
  async getUser(id) {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }
}
```

### async/await 的本质

`async` 函数总是返回一个 Promise，`await` 会暂停函数执行直到 Promise 完成：

```javascript
// async 函数返回 Promise
async function example() {
  return '结果';
}
example().then(result => console.log(result)); // '结果'

// 等价于
function example() {
  return Promise.resolve('结果');
}

// await 等待 Promise 完成
async function demo() {
  console.log('开始');
  const result = await Promise.resolve('异步结果');
  console.log('结果:', result);
  console.log('结束');
}

// await 非 Promise 值会立即返回
async function demo2() {
  const value = await 42;
  console.log(value); // 42
}
```

### 顺序执行 vs 并行执行

```javascript
// 顺序执行（耗时较长）
async function sequential() {
  const user = await fetchUser();      // 等待完成
  const posts = await fetchPosts();    // 再等待完成
  const comments = await fetchComments(); // 再等待完成
  return { user, posts, comments };
}

// 并行执行（推荐方式）
async function parallel() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments()
  ]);
  return { user, posts, comments };
}

// 部分并行（有依赖关系时）
async function partialParallel() {
  const user = await fetchUser();
  // 获取用户后，同时获取该用户的帖子和评论
  const [posts, comments] = await Promise.all([
    fetchPosts(user.id),
    fetchComments(user.id)
  ]);
  return { user, posts, comments };
}
```

### 循环中的 async/await

```javascript
// for...of 循环 - 顺序执行
async function processSequentially(items) {
  const results = [];
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  return results;
}

// map + Promise.all - 并行执行
async function processInParallel(items) {
  const results = await Promise.all(
    items.map(item => processItem(item))
  );
  return results;
}

// 注意：forEach 不能正确处理 async/await
async function wrongWay(items) {
  items.forEach(async (item) => {
    await processItem(item); // 这些不会按预期等待
  });
  console.log('完成'); // 会在所有处理完成前打印
}
```

## 错误处理策略

### try/catch 处理

```javascript
// 基本 try/catch
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取数据失败:', error.message);
    throw error; // 可选：继续向上抛出
  }
}

// 多个 await 的错误处理
async function complexOperation() {
  try {
    const user = await fetchUser();
    const profile = await fetchProfile(user.id);
    const settings = await fetchSettings(user.id);
    return { user, profile, settings };
  } catch (error) {
    // 处理任何一个步骤的错误
    console.error('操作失败:', error);
    return null;
  }
}
```

### 单独处理每个 Promise

```javascript
// 使用 .catch() 为每个 Promise 提供默认值
async function fetchWithDefaults() {
  const user = await fetchUser().catch(() => ({ name: '访客' }));
  const posts = await fetchPosts().catch(() => []);
  const comments = await fetchComments().catch(() => []);

  return { user, posts, comments };
}

// 封装安全的 await
async function safeAwait(promise) {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error, null];
  }
}

// 使用封装函数
async function example() {
  const [error, data] = await safeAwait(fetchData());
  if (error) {
    console.error('错误:', error);
    return;
  }
  console.log('数据:', data);
}
```

### 全局错误处理

```javascript
// 监听未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', event => {
  console.error('未处理的 Promise 拒绝:', event.reason);
  // 可以上报错误到监控系统
  reportError(event.reason);
  // 阻止默认行为（控制台报错）
  event.preventDefault();
});

// Node.js 环境
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
```

### 重试机制

```javascript
// 带重试的请求函数
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      console.warn(`第 ${attempt} 次尝试失败:`, error.message);

      if (attempt < maxRetries) {
        // 指数退避
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`${maxRetries} 次重试后仍然失败: ${lastError.message}`);
}

// 使用
try {
  const data = await fetchWithRetry('/api/data');
  console.log('成功获取数据:', data);
} catch (error) {
  console.error('最终失败:', error.message);
}
```

## 并发控制

### 限制并发数量

当需要处理大量异步任务时，一次性启动所有任务可能会导致资源耗尽。需要限制并发数量：

```javascript
// 简单的并发控制器
class ConcurrencyController {
  constructor(maxConcurrency = 5) {
    this.maxConcurrency = maxConcurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(task) {
    if (this.running >= this.maxConcurrency) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    }
  }
}

// 使用示例
const controller = new ConcurrencyController(3);
const urls = ['url1', 'url2', 'url3', 'url4', 'url5', 'url6'];

const results = await Promise.all(
  urls.map(url => controller.add(() => fetch(url)))
);
```

### p-limit 风格实现

```javascript
// 更简洁的并发限制函数
function pLimit(concurrency) {
  const queue = [];
  let active = 0;

  const next = () => {
    if (queue.length > 0 && active < concurrency) {
      active++;
      const { fn, resolve, reject } = queue.shift();
      fn().then(resolve).catch(reject).finally(() => {
        active--;
        next();
      });
    }
  };

  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
}

// 使用
const limit = pLimit(2);
const tasks = [
  () => fetchData(1),
  () => fetchData(2),
  () => fetchData(3),
  () => fetchData(4)
];

const results = await Promise.all(tasks.map(task => limit(task)));
```

### 批量处理

```javascript
// 分批处理大量数据
async function processBatch(items, batchSize = 10, processor) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    console.log(`已处理 ${Math.min(i + batchSize, items.length)}/${items.length}`);
  }

  return results;
}

// 使用
const userIds = Array.from({ length: 100 }, (_, i) => i + 1);
const users = await processBatch(userIds, 10, fetchUser);
```

## 常见异步模式

### 防抖（Debounce）

```javascript
// 防抖函数 - 适用于搜索框输入
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 带 Promise 的防抖
function debounceAsync(fn, delay) {
  let timeoutId;
  let pendingPromise = null;

  return function(...args) {
    if (pendingPromise) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn.apply(this, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

// 使用示例
const debouncedSearch = debounce(async (query) => {
  const response = await fetch(`/api/search?q=${query}`);
  return response.json();
}, 300);
```

### 节流（Throttle）

```javascript
// 节流函数 - 适用于滚动事件
function throttle(fn, interval) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      return fn.apply(this, args);
    }
  };
}

// 带异步支持的节流
function throttleAsync(fn, interval) {
  let lastTime = 0;
  let pending = false;

  return async function(...args) {
    const now = Date.now();
    if (pending) return;

    if (now - lastTime >= interval) {
      lastTime = now;
      pending = true;
      try {
        return await fn.apply(this, args);
      } finally {
        pending = false;
      }
    }
  };
}
```

### 取消请求

```javascript
// 使用 AbortController 取消 fetch 请求
function createCancelableRequest(url) {
  const controller = new AbortController();

  const request = fetch(url, { signal: controller.signal })
    .then(response => response.json())
    .catch(error => {
      if (error.name === 'AbortError') {
        console.log('请求已取消');
        return null;
      }
      throw error;
    });

  return {
    request,
    cancel: () => controller.abort()
  };
}

// 使用示例
const { request, cancel } = createCancelableRequest('/api/data');

// 3秒后取消请求
setTimeout(cancel, 3000);

const data = await request;

// 封装可取消的异步函数
function makeCancelable(asyncFn) {
  let controller;

  const wrappedFn = async (...args) => {
    controller = new AbortController();
    return asyncFn(...args, controller.signal);
  };

  wrappedFn.cancel = () => controller?.abort();

  return wrappedFn;
}
```

### 轮询

```javascript
// 基本轮询
async function poll(fn, interval, maxAttempts = Infinity) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const result = await fn();
      if (result.done) {
        return result.data;
      }
    } catch (error) {
      console.error('轮询出错:', error);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('轮询超过最大次数');
}

// 可取消的轮询
function createPolling(fn, interval) {
  let isRunning = true;

  const polling = async () => {
    while (isRunning) {
      try {
        await fn();
      } catch (error) {
        console.error('轮询出错:', error);
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  };

  return {
    start: () => {
      isRunning = true;
      polling();
    },
    stop: () => {
      isRunning = false;
    }
  };
}

// 使用
const { start, stop } = createPolling(async () => {
  const status = await checkStatus();
  if (status === 'complete') {
    stop();
  }
}, 2000);

start();
```

## 性能考虑

### 避免不必要的 await

```javascript
// 不好：不必要的 await
async function example() {
  const result = await doSomething();
  return await Promise.resolve(result); // 多余的 await
}

// 好：直接返回 Promise
async function example() {
  const result = await doSomething();
  return result;
}

// 更好：如果只是转发
function example() {
  return doSomething();
}
```

### 合理使用并行

```javascript
// 性能对比
async function sequential() {
  console.time('sequential');
  const a = await delay(1000);
  const b = await delay(1000);
  const c = await delay(1000);
  console.timeEnd('sequential'); // ~3000ms
}

async function parallel() {
  console.time('parallel');
  const [a, b, c] = await Promise.all([
    delay(1000),
    delay(1000),
    delay(1000)
  ]);
  console.timeEnd('parallel'); // ~1000ms
}
```

### 内存考虑

```javascript
// 不好：一次性创建大量 Promise
async function bad(items) {
  // 如果 items 有 10000 个，会同时创建 10000 个 Promise
  const results = await Promise.all(
    items.map(item => process(item))
  );
  return results;
}

// 好：分批处理
async function good(items) {
  const results = [];
  const batchSize = 100;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => process(item))
    );
    results.push(...batchResults);
  }

  return results;
}
```

### 缓存异步结果

```javascript
// 简单的异步缓存
function createAsyncCache(fn, ttl = 60000) {
  const cache = new Map();

  return async function(key, ...args) {
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const value = await fn(key, ...args);
    cache.set(key, { value, timestamp: Date.now() });
    return value;
  };
}

// 使用
const cachedFetch = createAsyncCache(async (url) => {
  const response = await fetch(url);
  return response.json();
}, 5000);

const data1 = await cachedFetch('/api/data'); // 实际请求
const data2 = await cachedFetch('/api/data'); // 从缓存返回
```

## 面试要点

### 常见面试题

#### Promise 执行顺序

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// 输出顺序：1, 4, 3, 2
// 解释：同步代码先执行(1, 4)，然后微任务(3)，最后宏任务(2)
```

#### 实现 Promise.all

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError('参数必须是数组'));
    }

    const results = [];
    let completed = 0;
    const total = promises.length;

    if (total === 0) {
      return resolve([]);
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;
          completed++;
          if (completed === total) {
            resolve(results);
          }
        })
        .catch(reject);
    });
  });
}
```

#### 实现 Promise.race

```javascript
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError('参数必须是数组'));
    }

    promises.forEach(promise => {
      Promise.resolve(promise).then(resolve).catch(reject);
    });
  });
}
```

#### async/await 和 Promise 的关系

```javascript
// async 函数总是返回 Promise
async function foo() {
  return 1;
}
// 等价于
function foo() {
  return Promise.resolve(1);
}

// await 会暂停 async 函数执行
async function bar() {
  const result = await Promise.resolve(2);
  return result;
}
// 类似于
function bar() {
  return Promise.resolve(2).then(result => result);
}
```

#### 如何让 Promise 串行执行

```javascript
// 方法1：for...of 循环
async function serial(tasks) {
  const results = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

// 方法2：reduce
function serial(tasks) {
  return tasks.reduce(
    (promise, task) => promise.then(results =>
      task().then(result => [...results, result])
    ),
    Promise.resolve([])
  );
}
```

### 关键概念总结

1. **Promise 三种状态**：pending、fulfilled、rejected，状态不可逆
2. **微任务 vs 宏任务**：Promise 回调是微任务，setTimeout 是宏任务
3. **async/await 本质**：语法糖，基于 Promise 实现
4. **错误处理**：try/catch 或 .catch()，记得处理未捕获的 rejection
5. **并发控制**：合理使用 Promise.all、限流、分批处理
6. **取消机制**：AbortController 可以取消 fetch 请求

### 最佳实践

1. 优先使用 async/await 而非 then 链
2. 独立的异步操作应并行执行
3. 始终处理 Promise 的错误
4. 避免在循环中使用 await（除非需要顺序执行）
5. 使用 Promise.allSettled 处理允许部分失败的场景
6. 大量并发请求时要限制并发数
7. 考虑请求超时和重试机制

## 总结

JavaScript 异步编程从回调函数发展到 Promise，再到 async/await，每一次进化都让异步代码更加清晰和易于维护。掌握这些概念和模式，能够帮助你编写高效、健壮的异步代码。

关键要点：

- 理解同步和异步的区别，以及为什么需要异步
- 熟练使用 Promise 及其静态方法
- 掌握 async/await 语法及其与 Promise 的关系
- 注重错误处理，确保程序的健壮性
- 合理控制并发，避免资源耗尽
- 了解常见的异步模式，如防抖、节流、轮询等

通过不断实践和思考，你将能够优雅地处理各种异步场景。
