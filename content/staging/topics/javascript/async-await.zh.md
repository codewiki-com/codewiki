---
title: JavaScript async/await
description: 掌握 async/await：异步函数、错误处理与并发执行模式
track: javascript
section: async
difficulty: intermediate
tags:
  - JavaScript
  - async
  - await
  - 异步
status: imported
origin: old/src/content/docs/javascript/async-await.zh.md
divergence: 0.289
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: 异步编程
  order: 6
  lastUpdated: 2026-01-07
---

async/await 是 ES2017 引入的语法糖，它让异步代码的编写和理解变得更加简单直观。通过 async/await，我们可以用同步代码的风格编写异步逻辑，避免回调地狱和复杂的 Promise 链。

## 基础概念

### async 函数

async 函数是一个返回 Promise 的函数。在 async 函数内部，可以使用 await 关键字等待 Promise 完成。

```javascript
// 基本的 async 函数
async function fetchData() {
  return "数据";
}

// 等同于
function fetchDataPromise() {
  return Promise.resolve("数据");
}

// 使用
fetchData().then(data => console.log(data)); // "数据"
```

### await 表达式

await 只能在 async 函数内部使用，它会暂停函数执行，等待 Promise 完成，然后返回结果。

```javascript
async function getUserData() {
  // 等待 Promise 完成
  const response = await fetch('https://api.example.com/user');
  const data = await response.json();
  return data;
}

// 调用 async 函数
getUserData().then(user => {
  console.log('用户数据:', user);
});
```

## async 函数的声明方式

async 关键字可以用于多种函数声明方式：

```javascript
// 1. 函数声明
async function fetchUser() {
  return { name: '张三' };
}

// 2. 函数表达式
const getUser = async function() {
  return { name: '李四' };
};

// 3. 箭头函数
const loadUser = async () => {
  return { name: '王五' };
};

// 4. 对象方法
const api = {
  async getUserInfo() {
    return { name: '赵六' };
  }
};

// 5. 类方法
class UserService {
  async fetchUser(id) {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }
}
```

## 错误处理

### 使用 try-catch

在 async 函数中，使用 try-catch 捕获错误是最常见的做法：

```javascript
async function fetchUserWithErrorHandling(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.status}`);
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('获取用户失败:', error.message);
    // 可以选择重新抛出错误或返回默认值
    return null;
  }
}
```

### 多个 await 的错误处理

```javascript
async function processUserData(userId) {
  try {
    // 如果任何一个 await 失败，都会被 catch 捕获
    const user = await fetchUser(userId);
    const posts = await fetchUserPosts(userId);
    const comments = await fetchUserComments(userId);

    return {
      user,
      posts,
      comments
    };
  } catch (error) {
    console.error('处理用户数据时出错:', error);
    throw error; // 重新抛出以便上层处理
  }
}
```

### 使用 .catch() 方法

也可以对返回的 Promise 使用 .catch() 方法：

```javascript
async function loadData() {
  const data = await fetch('/api/data').catch(error => {
    console.error('请求失败:', error);
    return { default: true }; // 返回默认数据
  });

  return data;
}

// 或者在调用时捕获
loadData().catch(error => {
  console.error('加载数据失败:', error);
});
```

### 优雅的错误处理模式

```javascript
// 包装函数，返回 [error, data] 元组
function to(promise) {
  return promise
    .then(data => [null, data])
    .catch(error => [error, null]);
}

// 使用
async function getUserProfile(userId) {
  const [error, user] = await to(fetchUser(userId));

  if (error) {
    console.error('获取用户失败:', error);
    return null;
  }

  console.log('用户信息:', user);
  return user;
}
```

## 并发执行

### 串行执行 vs 并行执行

```javascript
// ❌ 串行执行 - 效率低下
async function fetchAllDataSerial() {
  const user = await fetchUser();      // 等待 1 秒
  const posts = await fetchPosts();    // 再等待 1 秒
  const comments = await fetchComments(); // 再等待 1 秒
  // 总共需要 3 秒

  return { user, posts, comments };
}

// ✅ 并行执行 - 高效
async function fetchAllDataParallel() {
  // 同时发起所有请求
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments()
  ]);
  // 总共只需要 1 秒（最慢的请求的时间）

  return { user, posts, comments };
}
```

### Promise.all() - 全部成功才成功

```javascript
async function loadMultipleResources() {
  try {
    const [users, products, orders] = await Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/orders').then(r => r.json())
    ]);

    return { users, products, orders };
  } catch (error) {
    // 如果任何一个请求失败，整个 Promise.all 都会失败
    console.error('加载资源失败:', error);
    throw error;
  }
}
```

### Promise.allSettled() - 等待所有完成

```javascript
async function loadResourcesSafely() {
  const results = await Promise.allSettled([
    fetchUsers(),
    fetchProducts(),
    fetchOrders()
  ]);

  // 处理结果
  const [usersResult, productsResult, ordersResult] = results;

  const users = usersResult.status === 'fulfilled'
    ? usersResult.value
    : [];

  const products = productsResult.status === 'fulfilled'
    ? productsResult.value
    : [];

  const orders = ordersResult.status === 'fulfilled'
    ? ordersResult.value
    : [];

  return { users, products, orders };
}
```

### Promise.race() - 竞速执行

```javascript
// 实现超时机制
async function fetchWithTimeout(url, timeout = 5000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('请求超时')), timeout);
  });

  try {
    const response = await Promise.race([
      fetch(url),
      timeoutPromise
    ]);

    return await response.json();
  } catch (error) {
    console.error('请求失败:', error.message);
    throw error;
  }
}

// 使用
async function loadData() {
  try {
    const data = await fetchWithTimeout('/api/data', 3000);
    console.log('数据:', data);
  } catch (error) {
    console.error('加载失败:', error.message);
  }
}
```

### Promise.any() - 任一成功即成功

```javascript
async function fetchFromMultipleSources() {
  try {
    // 从多个镜像源获取数据，使用最快返回成功的结果
    const data = await Promise.any([
      fetch('https://cdn1.example.com/data.json'),
      fetch('https://cdn2.example.com/data.json'),
      fetch('https://cdn3.example.com/data.json')
    ]);

    return await data.json();
  } catch (error) {
    // 只有当所有 Promise 都失败时才会进入这里
    console.error('所有源都失败了:', error);
    throw error;
  }
}
```

## 并发控制

### 控制并发数量

```javascript
// 限制并发请求数量
async function batchFetch(urls, concurrency = 3) {
  const results = [];
  const executing = [];

  for (const url of urls) {
    const promise = fetch(url).then(r => r.json());
    results.push(promise);

    if (urls.length >= concurrency) {
      const e = promise.then(() => {
        executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}

// 使用
async function loadManyResources() {
  const urls = [
    '/api/data1',
    '/api/data2',
    '/api/data3',
    '/api/data4',
    '/api/data5'
  ];

  // 最多同时发起 3 个请求
  const data = await batchFetch(urls, 3);
  console.log('所有数据:', data);
}
```

### 顺序处理异步任务

```javascript
// 使用 for...of 循环顺序处理
async function processItemsSequentially(items) {
  const results = [];

  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
    console.log(`处理完成: ${item}`);
  }

  return results;
}

// 使用 reduce 实现顺序处理
async function processItemsWithReduce(items) {
  return items.reduce(async (previousPromise, item) => {
    const results = await previousPromise;
    const result = await processItem(item);
    return [...results, result];
  }, Promise.resolve([]));
}
```

## 顶层 await

ES2022 引入了顶层 await，允许在模块的顶层直接使用 await，无需包装在 async 函数中。

```javascript
// config.js - 在模块顶层使用 await
const response = await fetch('/api/config');
const config = await response.json();

export default config;

// main.js - 导入时会等待 config.js 完成
import config from './config.js';

console.log('配置:', config);
```

### 顶层 await 的使用场景

```javascript
// 1. 动态依赖加载
const messages = await import(`./i18n/${navigator.language}.js`);

// 2. 资源初始化
const connection = await dbConnector.connect();

// 3. 条件导入
let module;
if (condition) {
  module = await import('./moduleA.js');
} else {
  module = await import('./moduleB.js');
}

// 4. 依赖回退
let data;
try {
  data = await fetch('https://primary.example.com/data');
} catch {
  data = await fetch('https://backup.example.com/data');
}

export { data };
```

### 顶层 await 的注意事项

```javascript
// ⚠️ 注意：顶层 await 会阻塞模块执行

// moduleA.js
console.log('A: 开始');
await new Promise(resolve => setTimeout(resolve, 1000));
console.log('A: 完成');
export const a = 1;

// moduleB.js
console.log('B: 开始');
import { a } from './moduleA.js'; // 会等待 moduleA 完成
console.log('B: 完成', a);

// 输出顺序：
// A: 开始
// (等待 1 秒)
// A: 完成
// B: 开始
// B: 完成 1
```

## 实际应用示例

### 数据获取和处理

```javascript
class UserService {
  async getUserWithDetails(userId) {
    try {
      // 首先获取用户基本信息
      const user = await this.fetchUser(userId);

      // 并行获取用户的相关数据
      const [posts, followers, following] = await Promise.all([
        this.fetchUserPosts(userId),
        this.fetchUserFollowers(userId),
        this.fetchUserFollowing(userId)
      ]);

      // 组合数据
      return {
        ...user,
        posts,
        followers,
        following,
        stats: {
          postsCount: posts.length,
          followersCount: followers.length,
          followingCount: following.length
        }
      };
    } catch (error) {
      console.error('获取用户详情失败:', error);
      throw new Error(`无法加载用户 ${userId} 的详细信息`);
    }
  }

  async fetchUser(userId) {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('用户不存在');
    return response.json();
  }

  async fetchUserPosts(userId) {
    const response = await fetch(`/api/users/${userId}/posts`);
    return response.json();
  }

  async fetchUserFollowers(userId) {
    const response = await fetch(`/api/users/${userId}/followers`);
    return response.json();
  }

  async fetchUserFollowing(userId) {
    const response = await fetch(`/api/users/${userId}/following`);
    return response.json();
  }
}

// 使用
const service = new UserService();
const userDetails = await service.getUserWithDetails(123);
console.log(userDetails);
```

### 重试机制

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const { retryDelay = 1000, ...fetchOptions } = options;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;

      if (isLastAttempt) {
        throw new Error(`请求失败，已重试 ${maxRetries} 次: ${error.message}`);
      }

      console.warn(`请求失败，${retryDelay}ms 后重试... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// 使用
async function loadData() {
  try {
    const data = await fetchWithRetry('/api/data', {
      retryDelay: 2000
    }, 5);
    console.log('数据加载成功:', data);
  } catch (error) {
    console.error('最终失败:', error.message);
  }
}
```

### 缓存机制

```javascript
class CachedAPI {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  async fetch(url, ttl = 60000) {
    // 检查缓存
    if (this.cache.has(url)) {
      const cached = this.cache.get(url);
      if (Date.now() - cached.timestamp < ttl) {
        console.log('从缓存返回:', url);
        return cached.data;
      }
    }

    // 检查是否有正在进行的相同请求
    if (this.pendingRequests.has(url)) {
      console.log('等待正在进行的请求:', url);
      return this.pendingRequests.get(url);
    }

    // 发起新请求
    const promise = this.performFetch(url);
    this.pendingRequests.set(url, promise);

    try {
      const data = await promise;

      // 存入缓存
      this.cache.set(url, {
        data,
        timestamp: Date.now()
      });

      return data;
    } finally {
      this.pendingRequests.delete(url);
    }
  }

  async performFetch(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  clearCache() {
    this.cache.clear();
  }
}

// 使用
const api = new CachedAPI();

async function loadUserData(userId) {
  // 多次调用相同 URL 会复用缓存或等待正在进行的请求
  const user = await api.fetch(`/api/users/${userId}`, 30000);
  return user;
}
```

### 数据分页加载

```javascript
class PaginatedDataLoader {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async loadPage(page = 1, pageSize = 20) {
    const url = `${this.baseUrl}?page=${page}&pageSize=${pageSize}`;
    const response = await fetch(url);
    return response.json();
  }

  async loadAllPages(pageSize = 20) {
    const allData = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.loadPage(page, pageSize);
      allData.push(...result.data);

      console.log(`加载第 ${page} 页，获取 ${result.data.length} 条数据`);

      hasMore = result.hasMore;
      page++;
    }

    return allData;
  }

  async *loadPagesIterator(pageSize = 20) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.loadPage(page, pageSize);
      yield result.data;

      hasMore = result.hasMore;
      page++;
    }
  }
}

// 使用方式 1：一次性加载所有数据
const loader = new PaginatedDataLoader('/api/users');
const allUsers = await loader.loadAllPages();
console.log(`总共加载 ${allUsers.length} 个用户`);

// 使用方式 2：使用异步迭代器逐页处理
for await (const users of loader.loadPagesIterator()) {
  console.log(`处理这一页的 ${users.length} 个用户`);
  // 处理当前页的数据
}
```

## 常见陷阱和最佳实践

### 陷阱 1：忘记 await

```javascript
// ❌ 错误：忘记 await
async function badExample() {
  const data = fetchData(); // 返回 Promise，不是数据
  console.log(data); // Promise { <pending> }
  return data;
}

// ✅ 正确
async function goodExample() {
  const data = await fetchData();
  console.log(data); // 实际的数据
  return data;
}
```

### 陷阱 2：在循环中不必要地串行执行

```javascript
// ❌ 低效：串行执行
async function processUsersBad(userIds) {
  const users = [];
  for (const id of userIds) {
    const user = await fetchUser(id); // 一个接一个
    users.push(user);
  }
  return users;
}

// ✅ 高效：并行执行
async function processUsersGood(userIds) {
  const promises = userIds.map(id => fetchUser(id));
  const users = await Promise.all(promises);
  return users;
}
```

### 陷阱 3：在 map/filter/forEach 中使用 async

```javascript
// ❌ 错误：forEach 不会等待
async function badExample(items) {
  items.forEach(async (item) => {
    await processItem(item); // 不会等待
  });
  console.log('完成'); // 会立即执行
}

// ✅ 正确：使用 for...of
async function goodExample(items) {
  for (const item of items) {
    await processItem(item);
  }
  console.log('完成'); // 在所有项处理完后执行
}

// ✅ 或者并行处理
async function parallelExample(items) {
  await Promise.all(items.map(item => processItem(item)));
  console.log('完成');
}
```

### 最佳实践

```javascript
// 1. 合理组织 async 函数
class DataService {
  // 将相关的异步操作组织在一起
  async fetchAndProcessData(id) {
    const raw = await this.fetchRaw(id);
    const processed = await this.process(raw);
    const validated = await this.validate(processed);
    return validated;
  }

  // 提供清晰的错误处理
  async fetchRaw(id) {
    try {
      const response = await fetch(`/api/data/${id}`);
      if (!response.ok) throw new Error('获取失败');
      return await response.json();
    } catch (error) {
      throw new Error(`获取数据失败: ${error.message}`);
    }
  }
}

// 2. 使用 Promise.all 优化性能
async function optimizedDataLoad() {
  // 识别可以并行执行的操作
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments()
  ]);

  return { users, posts, comments };
}

// 3. 提供超时保护
async function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('超时')), ms)
  );
  return Promise.race([promise, timeout]);
}

// 4. 优雅的错误处理
async function safeOperation() {
  try {
    const result = await riskyOperation();
    return { success: true, data: result };
  } catch (error) {
    console.error('操作失败:', error);
    return { success: false, error: error.message };
  }
}
```

## 总结

async/await 是现代 JavaScript 异步编程的基石，主要优势包括：

1. **可读性强**：代码看起来像同步代码，更容易理解
2. **错误处理简单**：可以使用 try-catch 处理错误
3. **调试友好**：调用栈更清晰，断点调试更方便
4. **组合灵活**：配合 Promise 方法实现各种并发模式

关键要点：

- async 函数总是返回 Promise
- await 只能在 async 函数内使用（除了顶层 await）
- 合理使用并行执行提升性能
- 注意错误处理和超时控制
- 避免在循环中不必要地串行执行

掌握 async/await 能让你写出更优雅、更高效的异步 JavaScript 代码。
