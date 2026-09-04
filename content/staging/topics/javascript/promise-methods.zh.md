---
title: Promise 静态方法详解
description: 深入解析 JavaScript Promise 的静态方法：Promise.all、Promise.race、Promise.allSettled、Promise.any、Promise.resolve 和 Promise.reject，掌握异步编程的核心工具
track: javascript
section: async
difficulty: intermediate
tags:
  - Promise
  - 异步编程
  - ES6
  - 并发控制
  - 错误处理
status: imported
origin: old/src/content/docs/javascript/promise-methods.zh.md
divergence: 0.098
issues:
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 7
  lastUpdated: 2026-01-07
---

## 概念解释

Promise 静态方法是直接挂载在 Promise 构造函数上的方法，无需创建 Promise 实例即可调用。这些方法为处理多个异步操作提供了强大的工具，是现代 JavaScript 异步编程的核心组成部分。

### 历史背景

Promise 最初由社区提出（如 Q、Bluebird 库），后被 ES6（ECMAScript 2015）标准化。随着异步编程需求的增长，ES2020 和 ES2021 分别引入了 `Promise.allSettled` 和 `Promise.any`，进一步完善了 Promise API。

### 解决的问题

- **并发控制**：同时发起多个异步操作并统一处理结果
- **竞态处理**：多个异步操作中选取最快完成的结果
- **错误聚合**：统一处理多个异步操作的成功与失败状态
- **值的 Promise 化**：将同步值或 thenable 对象转换为标准 Promise

## 核心原理

### Promise 状态机制

每个 Promise 都有三种状态：
- **pending**（待定）：初始状态
- **fulfilled**（已兑现）：操作成功完成
- **rejected**（已拒绝）：操作失败

```
     ┌─────────────────────────────────────────┐
     │              pending                     │
     │         (初始状态)                       │
     └─────────────┬───────────────┬───────────┘
                   │               │
          resolve(value)    reject(reason)
                   │               │
                   ▼               ▼
     ┌─────────────────┐   ┌─────────────────┐
     │   fulfilled     │   │    rejected     │
     │  (已兑现)       │   │   (已拒绝)      │
     └─────────────────┘   └─────────────────┘
```

### 静态方法分类

```
Promise 静态方法
├── 组合方法（处理多个 Promise）
│   ├── Promise.all()        - 全部成功才成功
│   ├── Promise.race()       - 取最快的结果
│   ├── Promise.allSettled() - 等待全部完成
│   └── Promise.any()        - 任一成功即成功
│
└── 转换方法（创建 Promise）
    ├── Promise.resolve()    - 创建已兑现的 Promise
    └── Promise.reject()     - 创建已拒绝的 Promise
```

## 核心要点

### Promise.all(iterable)

| 特性 | 说明 |
|------|------|
| 输入 | 可迭代对象（通常是 Promise 数组） |
| 成功条件 | 所有 Promise 都成功 |
| 失败条件 | 任一 Promise 失败 |
| 返回值 | 成功时返回结果数组（顺序与输入一致） |
| 短路行为 | 遇到第一个失败立即拒绝 |

### Promise.race(iterable)

| 特性 | 说明 |
|------|------|
| 输入 | 可迭代对象 |
| 成功条件 | 第一个完成的 Promise 成功 |
| 失败条件 | 第一个完成的 Promise 失败 |
| 返回值 | 第一个完成的 Promise 的值或原因 |
| 特点 | 只关心速度，不关心成功或失败 |

### Promise.allSettled(iterable)

| 特性 | 说明 |
|------|------|
| 输入 | 可迭代对象 |
| 完成条件 | 所有 Promise 都完成（无论成功或失败） |
| 返回值 | 对象数组，每个对象包含 status 和 value/reason |
| 特点 | 永不拒绝，适合需要知道所有结果的场景 |

### Promise.any(iterable)

| 特性 | 说明 |
|------|------|
| 输入 | 可迭代对象 |
| 成功条件 | 任一 Promise 成功 |
| 失败条件 | 所有 Promise 都失败 |
| 返回值 | 第一个成功的值，或 AggregateError |
| 特点 | 与 Promise.all 互补 |

### Promise.resolve(value) / Promise.reject(reason)

| 方法 | 说明 |
|------|------|
| Promise.resolve | 将值包装为已兑现的 Promise |
| Promise.reject | 创建一个以指定原因拒绝的 Promise |

## 代码示例

### Promise.all 基础用法

```javascript
// 并行请求多个 API
async function fetchUserData(userId) {
  const [profile, posts, followers] = await Promise.all([
    fetch(`/api/users/${userId}/profile`).then(r => r.json()),
    fetch(`/api/users/${userId}/posts`).then(r => r.json()),
    fetch(`/api/users/${userId}/followers`).then(r => r.json())
  ]);

  return { profile, posts, followers };
}

// 结果顺序与输入顺序一致，不受完成时间影响
const results = await Promise.all([
  delay(300).then(() => 'A'),  // 最后完成
  delay(100).then(() => 'B'),  // 最先完成
  delay(200).then(() => 'C')   // 中间完成
]);
console.log(results); // ['A', 'B', 'C'] - 保持输入顺序
```

### Promise.all 错误处理

```javascript
// 任一失败会导致整体失败
async function fetchAllOrFail() {
  try {
    const results = await Promise.all([
      fetch('/api/data1').then(r => r.json()),
      fetch('/api/data2').then(r => r.json()),
      Promise.reject(new Error('强制失败'))
    ]);
    return results;
  } catch (error) {
    // 只能捕获第一个失败的错误
    console.error('请求失败:', error.message);
    throw error;
  }
}

// 如果需要部分成功，可以给每个 Promise 添加错误处理
const safeResults = await Promise.all([
  fetch('/api/data1').then(r => r.json()).catch(e => ({ error: e.message })),
  fetch('/api/data2').then(r => r.json()).catch(e => ({ error: e.message })),
  fetch('/api/data3').then(r => r.json()).catch(e => ({ error: e.message }))
]);
```

### Promise.race 实现超时控制

```javascript
// 创建超时 Promise
function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`操作超时: ${ms}ms`)), ms);
  });
}

// 为任意异步操作添加超时
async function fetchWithTimeout(url, ms = 5000) {
  return Promise.race([
    fetch(url),
    timeout(ms)
  ]);
}

// 使用示例
try {
  const response = await fetchWithTimeout('/api/slow-endpoint', 3000);
  const data = await response.json();
  console.log(data);
} catch (error) {
  if (error.message.includes('超时')) {
    console.log('请求超时，请稍后重试');
  } else {
    console.log('请求失败:', error.message);
  }
}
```

### Promise.race 实现资源竞争

```javascript
// 从多个镜像源获取资源，使用最快响应的
async function fetchFromFastestMirror(resourcePath) {
  const mirrors = [
    'https://mirror1.example.com',
    'https://mirror2.example.com',
    'https://mirror3.example.com'
  ];

  return Promise.race(
    mirrors.map(mirror =>
      fetch(`${mirror}${resourcePath}`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r;
      })
    )
  );
}
```

### Promise.allSettled 获取所有结果

```javascript
// 批量操作，需要知道每个操作的结果
async function batchProcess(items) {
  const results = await Promise.allSettled(
    items.map(item => processItem(item))
  );

  // 分析结果
  const succeeded = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason);

  console.log(`成功: ${succeeded.length}, 失败: ${failed.length}`);

  return { succeeded, failed };
}

// 结果格式示例
const results = await Promise.allSettled([
  Promise.resolve('成功'),
  Promise.reject(new Error('失败')),
  Promise.resolve('另一个成功')
]);

// results:
// [
//   { status: 'fulfilled', value: '成功' },
//   { status: 'rejected', reason: Error('失败') },
//   { status: 'fulfilled', value: '另一个成功' }
// ]
```

### Promise.any 实现容错请求

```javascript
// 尝试多个 API 端点，任一成功即可
async function fetchWithFallback(endpoints) {
  try {
    const result = await Promise.any(
      endpoints.map(endpoint =>
        fetch(endpoint).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      )
    );
    return result;
  } catch (error) {
    // 所有请求都失败时，error 是 AggregateError
    if (error instanceof AggregateError) {
      console.error('所有端点都失败了:');
      error.errors.forEach((e, i) => {
        console.error(`  端点 ${i + 1}: ${e.message}`);
      });
    }
    throw error;
  }
}

// 使用示例
const data = await fetchWithFallback([
  '/api/primary/data',
  '/api/backup/data',
  '/api/emergency/data'
]);
```

### Promise.resolve 和 Promise.reject

```javascript
// Promise.resolve 的多种用法

// 1. 包装普通值
const p1 = Promise.resolve(42);
p1.then(v => console.log(v)); // 42

// 2. 传入 Promise 会直接返回该 Promise
const original = new Promise(resolve => resolve('hello'));
const p2 = Promise.resolve(original);
console.log(p1 === original); // true

// 3. 处理 thenable 对象
const thenable = {
  then(resolve, reject) {
    resolve('from thenable');
  }
};
Promise.resolve(thenable).then(v => console.log(v)); // 'from thenable'

// 4. 用于函数返回值的统一化
function maybeAsync(useAsync) {
  if (useAsync) {
    return fetch('/api/data').then(r => r.json());
  }
  // 即使是同步值，也返回 Promise 保持接口一致
  return Promise.resolve({ cached: true });
}

// Promise.reject 用法
const rejected = Promise.reject(new Error('出错了'));
rejected.catch(e => console.error(e.message)); // '出错了'

// 注意：Promise.reject 不会像 Promise.resolve 那样特殊处理 Promise
const p3 = Promise.reject(Promise.resolve('value'));
// p3 会被拒绝，reason 是一个 Promise 对象
```

### 组合使用示例

```javascript
// 实现带重试的请求
async function fetchWithRetry(url, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await Promise.race([
        fetch(url).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('超时')), 5000)
        )
      ]);
      return result;
    } catch (error) {
      console.log(`尝试 ${i + 1}/${maxRetries} 失败: ${error.message}`);
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
      }
    }
  }
  throw new Error(`${maxRetries} 次重试后仍然失败`);
}

// 并发限制的批量请求
async function batchFetchWithLimit(urls, limit = 5) {
  const results = [];
  const executing = [];

  for (const url of urls) {
    const promise = fetch(url)
      .then(r => r.json())
      .catch(e => ({ error: e.message }));

    results.push(promise);

    if (urls.length >= limit) {
      const e = promise.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}
```

## 最佳实践

### 选择正确的方法

```javascript
// 场景：所有请求必须成功
// 使用 Promise.all
const [user, settings, notifications] = await Promise.all([
  fetchUser(),
  fetchSettings(),
  fetchNotifications()
]);

// 场景：需要知道所有结果（包括失败）
// 使用 Promise.allSettled
const results = await Promise.allSettled([
  sendEmail(email1),
  sendEmail(email2),
  sendEmail(email3)
]);
const failedEmails = results
  .filter(r => r.status === 'rejected')
  .length;

// 场景：只需要最快的成功结果
// 使用 Promise.any
const fastestCDN = await Promise.any([
  fetchFromCDN1(),
  fetchFromCDN2(),
  fetchFromCDN3()
]);

// 场景：需要超时控制
// 使用 Promise.race
const result = await Promise.race([
  fetchData(),
  timeout(5000)
]);
```

### 始终处理错误

```javascript
// 不好的做法
Promise.all([fetch1(), fetch2(), fetch3()]); // 未处理的 rejection

// 好的做法
Promise.all([fetch1(), fetch2(), fetch3()])
  .then(results => processResults(results))
  .catch(error => handleError(error));

// 或者使用 async/await
try {
  const results = await Promise.all([fetch1(), fetch2(), fetch3()]);
  processResults(results);
} catch (error) {
  handleError(error);
}
```

### 避免创建不必要的 Promise

```javascript
// 不必要的包装
async function bad() {
  return Promise.resolve(await fetchData()); // 多余的 Promise.resolve
}

// 简洁的写法
async function good() {
  return fetchData(); // async 函数已经返回 Promise
}

// 不必要的 Promise.resolve
function alsoGood(value) {
  // 如果 value 已经是 Promise，直接返回
  return Promise.resolve(value);
}
```

### 使用 Promise.allSettled 处理可选数据

```javascript
async function loadDashboard() {
  const results = await Promise.allSettled([
    fetchUserProfile(),      // 必需
    fetchRecentActivity(),   // 可选
    fetchRecommendations()   // 可选
  ]);

  const [profileResult, activityResult, recommendationsResult] = results;

  // 必需数据失败则抛出错误
  if (profileResult.status === 'rejected') {
    throw profileResult.reason;
  }

  return {
    profile: profileResult.value,
    // 可选数据使用默认值
    activity: activityResult.status === 'fulfilled'
      ? activityResult.value
      : [],
    recommendations: recommendationsResult.status === 'fulfilled'
      ? recommendationsResult.value
      : []
  };
}
```

## 常见陷阱

### Promise.all 的短路行为

```javascript
// 问题：一个失败导致全部失败，其他成功的结果丢失
const promises = [
  fetch('/api/data1'),
  fetch('/api/data2'),
  Promise.reject(new Error('失败'))
];

try {
  await Promise.all(promises);
} catch (error) {
  // 即使 data1 和 data2 成功了，也无法获取它们的结果
}

// 解决方案：使用 Promise.allSettled 或单独捕获错误
const results = await Promise.allSettled(promises);
```

### Promise.race 不会取消其他 Promise

```javascript
// 问题：超时后，原始请求仍在继续
async function fetchWithTimeout(url, ms) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('超时')), ms)
    )
  ]);
}

// 解决方案：使用 AbortController
async function fetchWithProperTimeout(url, ms) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw error;
  }
}
```

### 空数组的行为差异

```javascript
// Promise.all 对空数组立即 resolve
Promise.all([]).then(r => console.log(r)); // []

// Promise.race 对空数组永远 pending
Promise.race([]).then(r => console.log(r)); // 永远不会执行

// Promise.any 对空数组立即 reject
Promise.any([]).catch(e => console.log(e));
// AggregateError: All promises were rejected

// 最佳实践：检查数组是否为空
async function safeBatchFetch(urls) {
  if (urls.length === 0) {
    return [];
  }
  return Promise.all(urls.map(url => fetch(url)));
}
```

### 顺序执行误用 Promise.all

```javascript
// 错误：这些请求是并行的，不是顺序的
const results = await Promise.all([
  step1(),
  step2(), // 不会等待 step1 完成
  step3()  // 不会等待 step2 完成
]);

// 正确：顺序执行应该用 await
const result1 = await step1();
const result2 = await step2(result1);
const result3 = await step3(result2);

// 或者使用 reduce
const steps = [step1, step2, step3];
const finalResult = await steps.reduce(
  async (prevPromise, step) => step(await prevPromise),
  Promise.resolve(initialValue)
);
```

### 忘记 Promise.any 需要 polyfill

```javascript
// Promise.any 是 ES2021 特性，旧环境可能不支持
// 简单的 polyfill
if (!Promise.any) {
  Promise.any = function(promises) {
    return new Promise((resolve, reject) => {
      let errors = [];
      let remaining = promises.length;

      if (remaining === 0) {
        reject(new AggregateError([], 'All promises were rejected'));
        return;
      }

      promises.forEach((promise, index) => {
        Promise.resolve(promise).then(resolve).catch(error => {
          errors[index] = error;
          remaining--;
          if (remaining === 0) {
            reject(new AggregateError(errors, 'All promises were rejected'));
          }
        });
      });
    });
  };
}
```

## 性能考量

### 并发数量控制

```javascript
// 问题：同时发起大量请求可能导致性能问题
const urls = Array(1000).fill('/api/data');
await Promise.all(urls.map(url => fetch(url))); // 同时 1000 个请求！

// 解决方案：使用并发池
async function parallelLimit(tasks, limit) {
  const results = [];
  const executing = new Set();

  for (const [index, task] of tasks.entries()) {
    const promise = Promise.resolve().then(() => task());
    results[index] = promise;
    executing.add(promise);

    const clean = () => executing.delete(promise);
    promise.then(clean, clean);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

// 使用示例：最多同时 5 个请求
const results = await parallelLimit(
  urls.map(url => () => fetch(url)),
  5
);
```

### 避免不必要的 Promise 创建

```javascript
// 低效：每次调用都创建新 Promise
function getValue() {
  return Promise.resolve(42);
}

// 高效：缓存不变的 Promise
const cachedValue = Promise.resolve(42);
function getValue() {
  return cachedValue;
}

// 更高效：对于静态值，考虑是否真的需要 Promise
function getValue() {
  return 42; // 调用者可以自己决定是否包装
}
```

### Promise.allSettled 的内存考量

```javascript
// 大量 Promise 时，allSettled 会保存所有结果
const results = await Promise.allSettled(
  Array(10000).fill(null).map(() => heavyOperation())
);
// results 数组占用大量内存

// 如果只需要统计，可以流式处理
async function processWithStats(operations) {
  let succeeded = 0;
  let failed = 0;

  for (const op of operations) {
    try {
      await op();
      succeeded++;
    } catch {
      failed++;
    }
  }

  return { succeeded, failed };
}
```

## 实战场景

### 场景一：页面数据聚合

```javascript
// 电商商品详情页需要聚合多个服务的数据
async function getProductPage(productId) {
  const [
    productInfo,
    reviews,
    relatedProducts,
    inventory
  ] = await Promise.all([
    productService.getProduct(productId),
    reviewService.getReviews(productId),
    recommendationService.getRelated(productId),
    inventoryService.getStock(productId)
  ]);

  return {
    ...productInfo,
    reviews,
    relatedProducts,
    inStock: inventory.quantity > 0
  };
}
```

### 场景二：健康检查

```javascript
// 微服务健康检查，需要知道每个服务的状态
async function healthCheck(services) {
  const checks = await Promise.allSettled(
    services.map(async service => {
      const start = Date.now();
      await fetch(`${service.url}/health`);
      return {
        name: service.name,
        latency: Date.now() - start
      };
    })
  );

  return checks.map((result, index) => ({
    service: services[index].name,
    status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    latency: result.status === 'fulfilled' ? result.value.latency : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }));
}
```

### 场景三：首次渲染优化

```javascript
// 优先显示核心内容，次要内容延迟加载
async function loadAppData() {
  // 核心数据必须加载
  const coreData = await Promise.all([
    fetchUserProfile(),
    fetchMainContent()
  ]);

  // 渲染核心内容
  renderCore(coreData);

  // 异步加载次要内容，不阻塞渲染
  Promise.allSettled([
    fetchSidebar(),
    fetchRecommendations(),
    fetchNotifications()
  ]).then(results => {
    renderSecondary(results);
  });
}
```

### 场景四：多源数据获取

```javascript
// 从多个来源获取数据，使用最快返回的有效结果
async function getExchangeRate(from, to) {
  const providers = [
    `https://api.provider1.com/rate?from=${from}&to=${to}`,
    `https://api.provider2.com/rate?from=${from}&to=${to}`,
    `https://api.provider3.com/rate?from=${from}&to=${to}`
  ];

  try {
    const rate = await Promise.any(
      providers.map(async url => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Provider error');
        const data = await response.json();
        return data.rate;
      })
    );
    return rate;
  } catch (error) {
    if (error instanceof AggregateError) {
      throw new Error('所有汇率提供商都不可用');
    }
    throw error;
  }
}
```

## 面试要点

### 常见面试题

**Q1: Promise.all 和 Promise.allSettled 的区别是什么？**

A: 主要区别在于错误处理：
- `Promise.all`：任一 Promise 失败就立即拒绝，只返回第一个错误
- `Promise.allSettled`：等待所有 Promise 完成，返回每个 Promise 的状态和结果

**Q2: 如何实现一个简单的 Promise.all？**

```javascript
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    const promiseArray = Array.from(promises);

    if (promiseArray.length === 0) {
      resolve([]);
      return;
    }

    promiseArray.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;
          completed++;
          if (completed === promiseArray.length) {
            resolve(results);
          }
        })
        .catch(reject);
    });
  });
}
```

**Q3: Promise.race 有什么实际应用场景？**

A: 主要应用场景：
1. 请求超时控制
2. 多源竞速（选择最快响应）
3. 取消长时间运行的操作
4. 实现用户可中断的操作

**Q4: 如何处理 Promise.all 中部分失败的情况？**

```javascript
// 方法1：使用 Promise.allSettled
const results = await Promise.allSettled(promises);

// 方法2：给每个 Promise 添加错误处理
const results = await Promise.all(
  promises.map(p => p.catch(e => ({ error: e })))
);

// 方法3：使用 reflect 模式
const reflect = p => p
  .then(value => ({ status: 'fulfilled', value }))
  .catch(reason => ({ status: 'rejected', reason }));

const results = await Promise.all(promises.map(reflect));
```

**Q5: Promise.any 和 Promise.race 的区别？**

A:
- `Promise.race`：返回最快完成的 Promise（无论成功或失败）
- `Promise.any`：返回最快成功的 Promise；只有全部失败才拒绝

```javascript
// Promise.race: 第一个完成的是失败的，整体失败
Promise.race([
  Promise.reject('fast error'),
  Promise.resolve('slow success')
]).catch(e => console.log(e)); // 'fast error'

// Promise.any: 会等待成功的
Promise.any([
  Promise.reject('fast error'),
  Promise.resolve('slow success')
]).then(v => console.log(v)); // 'slow success'
```

## 延伸阅读

- [MDN - Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [ECMAScript 规范 - Promise](https://tc39.es/ecma262/#sec-promise-objects)
- [JavaScript Info - Promise API](https://javascript.info/promise-api)
- [V8 Blog - Fast async](https://v8.dev/blog/fast-async)
- [Promise/A+ 规范](https://promisesaplus.com/)
