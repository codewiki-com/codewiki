---
title: 异步迭代器与异步生成器
description: 深入理解 JavaScript 异步迭代器与异步生成器，掌握 Symbol.asyncIterator、for-await-of、async generators 以及分页 API 迭代等高级异步编程技术
track: javascript
section: async
difficulty: advanced
tags:
  - JavaScript
  - 异步迭代器
  - 异步生成器
  - Symbol.asyncIterator
  - for-await-of
status: imported
origin: old/src/content/docs/javascript/async-iterators.zh.md
divergence: 0.226
issues: []
legacy:
  category: JavaScript
  subcategory: 异步编程
  order: 15
  lastUpdated: 2026-01-07
---

异步迭代器（Async Iterator）和异步生成器（Async Generator）是 JavaScript 中处理异步数据流的强大工具。它们扩展了同步迭代器和生成器的概念，使我们能够以优雅的方式处理异步产生的数据序列，如分页 API 响应、实时数据流、文件读取等场景。

## 概念解释

### 什么是异步迭代器

异步迭代器是同步迭代器的异步版本。与同步迭代器的 `next()` 方法返回 `{ value, done }` 对象不同，异步迭代器的 `next()` 方法返回一个 Promise，该 Promise 解析为 `{ value, done }` 对象。

```javascript
// 同步迭代器
const syncIterator = {
  next() {
    return { value: 1, done: false }; // 直接返回对象
  }
};

// 异步迭代器
const asyncIterator = {
  next() {
    return Promise.resolve({ value: 1, done: false }); // 返回 Promise
  }
};
```

### 历史背景

异步迭代器在 ES2018（ES9）中被正式引入，它的出现解决了以下问题：

1. **处理异步数据序列**：在此之前，处理异步产生的数据序列需要复杂的回调或 Promise 链
2. **流式数据处理**：提供了一种标准化的方式来处理流式数据
3. **统一的异步迭代接口**：与同步迭代器保持一致的 API 设计

### 解决的问题

传统方式处理异步数据序列的痛点：

```javascript
// 痛点1：回调地狱
function fetchAllPages(callback) {
  fetchPage(1, (page1) => {
    processPage(page1);
    fetchPage(2, (page2) => {
      processPage(page2);
      fetchPage(3, (page3) => {
        processPage(page3);
        callback();
      });
    });
  });
}

// 痛点2：复杂的 Promise 链
function fetchAllPagesPromise() {
  return fetchPage(1)
    .then(page1 => {
      processPage(page1);
      return fetchPage(2);
    })
    .then(page2 => {
      processPage(page2);
      return fetchPage(3);
    })
    .then(page3 => {
      processPage(page3);
    });
}

// 解决方案：异步迭代器
async function fetchAllPagesAsync() {
  for await (const page of fetchPages()) {
    processPage(page);
  }
}
```

## 核心原理

### 异步迭代协议

异步迭代协议定义了两个概念：

1. **异步可迭代协议（Async Iterable Protocol）**：对象必须实现 `[Symbol.asyncIterator]()` 方法
2. **异步迭代器协议（Async Iterator Protocol）**：对象必须实现 `next()` 方法，返回 Promise

```javascript
// 完整的异步可迭代对象实现
const asyncIterable = {
  // 实现异步可迭代协议
  [Symbol.asyncIterator]() {
    let count = 0;
    const max = 3;

    // 返回异步迭代器
    return {
      // 实现异步迭代器协议
      async next() {
        // 模拟异步操作
        await new Promise(resolve => setTimeout(resolve, 100));

        if (count < max) {
          return { value: count++, done: false };
        }
        return { value: undefined, done: true };
      },

      // 可选：return 方法，用于提前终止迭代
      async return(value) {
        console.log('迭代被提前终止');
        return { value, done: true };
      },

      // 可选：throw 方法，用于向迭代器抛出错误
      async throw(error) {
        console.log('收到错误:', error);
        throw error;
      }
    };
  }
};
```

### Symbol.asyncIterator 工作机制

`Symbol.asyncIterator` 是一个内置的 Symbol 值，用于定义对象的默认异步迭代器。

```javascript
// Symbol.asyncIterator 的本质
console.log(typeof Symbol.asyncIterator); // 'symbol'
console.log(Symbol.asyncIterator.description); // 'Symbol.asyncIterator'

// 检查对象是否是异步可迭代的
function isAsyncIterable(obj) {
  return obj != null && typeof obj[Symbol.asyncIterator] === 'function';
}

// 内置的异步可迭代对象（Node.js 环境）
// - ReadableStream
// - Node.js 的 Readable streams
// - 异步生成器函数返回的对象
```

### for-await-of 循环原理

`for-await-of` 循环是专门用于遍历异步可迭代对象的语法：

```javascript
// for-await-of 的内部工作原理
async function forAwaitOfExample() {
  const asyncIterable = getAsyncIterable();

  // for await (const value of asyncIterable) { ... }
  // 等价于：

  const iterator = asyncIterable[Symbol.asyncIterator]();

  while (true) {
    // 等待 next() 返回的 Promise
    const { value, done } = await iterator.next();

    if (done) break;

    // 处理 value
    console.log(value);
  }
}

// 实际使用
async function consumeAsyncIterable() {
  for await (const value of asyncIterable) {
    console.log(value);
  }
}
```

### 异步生成器函数原理

异步生成器函数结合了 `async` 函数和生成器函数的特性：

```javascript
// 异步生成器函数的声明
async function* asyncGeneratorFunction() {
  yield 1;                    // 可以 yield 普通值
  yield await fetchData();    // 可以 yield await 的结果
  yield* anotherAsyncGen();   // 可以委托给其他异步生成器
}

// 异步生成器函数的执行流程
async function* example() {
  console.log('开始');
  yield 1;
  console.log('第一个 yield 之后');
  yield 2;
  console.log('第二个 yield 之后');
  return 'done';
}

const gen = example();

// 每次调用 next() 返回 Promise
gen.next().then(result => console.log(result));
// 输出: '开始'
// 输出: { value: 1, done: false }

gen.next().then(result => console.log(result));
// 输出: '第一个 yield 之后'
// 输出: { value: 2, done: false }

gen.next().then(result => console.log(result));
// 输出: '第二个 yield 之后'
// 输出: { value: 'done', done: true }
```

## 核心要点

### 异步迭代器的三个方法

```javascript
const asyncIterator = {
  // 必需：返回下一个值的 Promise
  async next(value) {
    return { value: 'data', done: false };
  },

  // 可选：提前结束迭代（如 break、return）
  async return(value) {
    // 清理资源
    return { value, done: true };
  },

  // 可选：处理错误
  async throw(error) {
    throw error;
  }
};
```

### 异步生成器的特殊能力

```javascript
async function* asyncGenerator() {
  // 能力1：在 yield 之间使用 await
  const data = await fetchData();
  yield data;

  // 能力2：yield await 组合
  yield await anotherAsyncOperation();

  // 能力3：使用 yield* 委托
  yield* anotherAsyncGenerator();

  // 能力4：try-finally 进行资源清理
  try {
    yield 'value';
  } finally {
    console.log('清理资源');
  }
}
```

### for-await-of 的适用范围

```javascript
async function examples() {
  // 遍历异步可迭代对象
  for await (const chunk of readableStream) {
    console.log(chunk);
  }

  // 遍历 Promise 数组
  const promises = [
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3)
  ];
  for await (const value of promises) {
    console.log(value); // 1, 2, 3
  }

  // 遍历同步可迭代对象（也可以，但通常没必要）
  for await (const value of [1, 2, 3]) {
    console.log(value);
  }
}
```

### 异步生成器与 return/throw

```javascript
async function* gen() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } finally {
    console.log('清理');
  }
}

async function testReturn() {
  const g = gen();
  console.log(await g.next());   // { value: 1, done: false }
  console.log(await g.return()); // 输出 '清理', { value: undefined, done: true }
}

async function testThrow() {
  const g = gen();
  console.log(await g.next()); // { value: 1, done: false }
  try {
    await g.throw(new Error('错误'));
  } catch (e) {
    console.log(e.message); // '错误'
  }
  // finally 块仍会执行
}
```

## 代码示例

### 基础示例：创建异步可迭代对象

```javascript
// 方法1：对象字面量
const asyncNumbers = {
  max: 5,
  delay: 500,

  [Symbol.asyncIterator]() {
    let current = 0;
    const { max, delay } = this;

    return {
      async next() {
        await new Promise(resolve => setTimeout(resolve, delay));

        if (current < max) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
};

// 使用
async function main() {
  for await (const num of asyncNumbers) {
    console.log(num); // 0, 1, 2, 3, 4 (每隔 500ms)
  }
}
```

### 类实现异步可迭代对象

```javascript
class AsyncQueue {
  constructor() {
    this.queue = [];
    this.resolvers = [];
    this.closed = false;
  }

  // 添加数据到队列
  push(value) {
    if (this.closed) {
      throw new Error('Queue is closed');
    }

    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift();
      resolve({ value, done: false });
    } else {
      this.queue.push(value);
    }
  }

  // 关闭队列
  close() {
    this.closed = true;
    // 通知所有等待的消费者
    for (const resolve of this.resolvers) {
      resolve({ value: undefined, done: true });
    }
    this.resolvers = [];
  }

  // 实现异步迭代器
  [Symbol.asyncIterator]() {
    return {
      next: () => {
        if (this.queue.length > 0) {
          return Promise.resolve({
            value: this.queue.shift(),
            done: false
          });
        }

        if (this.closed) {
          return Promise.resolve({ value: undefined, done: true });
        }

        return new Promise(resolve => {
          this.resolvers.push(resolve);
        });
      },

      return: () => {
        this.close();
        return Promise.resolve({ value: undefined, done: true });
      }
    };
  }
}

// 使用示例
async function demo() {
  const queue = new AsyncQueue();

  // 生产者
  setTimeout(() => queue.push('消息1'), 100);
  setTimeout(() => queue.push('消息2'), 200);
  setTimeout(() => queue.push('消息3'), 300);
  setTimeout(() => queue.close(), 400);

  // 消费者
  for await (const message of queue) {
    console.log('收到:', message);
  }
  console.log('队列已关闭');
}
```

### 异步生成器基础

```javascript
// 简单的异步生成器
async function* countAsync(max, delay = 1000) {
  for (let i = 0; i < max; i++) {
    await new Promise(resolve => setTimeout(resolve, delay));
    yield i;
  }
}

// 使用
async function main() {
  for await (const num of countAsync(5, 500)) {
    console.log(num); // 0, 1, 2, 3, 4
  }
}

// 带错误处理的异步生成器
async function* fetchDataSequence(urls) {
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      yield await response.json();
    } catch (error) {
      // 可以选择跳过错误的请求
      console.error(`获取 ${url} 失败:`, error.message);
      yield { error: error.message, url };
    }
  }
}
```

### yield* 委托异步生成器

```javascript
// 子生成器
async function* getUsers() {
  yield await fetchUser(1);
  yield await fetchUser(2);
}

async function* getPosts() {
  yield await fetchPost(1);
  yield await fetchPost(2);
}

// 主生成器使用 yield* 委托
async function* getAllData() {
  console.log('获取用户...');
  yield* getUsers();

  console.log('获取文章...');
  yield* getPosts();

  console.log('完成');
}

// 使用
async function main() {
  for await (const data of getAllData()) {
    console.log(data);
  }
}
```

### 向异步生成器传递值

```javascript
async function* bidirectionalGen() {
  const input1 = yield '第一次输出';
  console.log('收到输入1:', input1);

  const input2 = yield '第二次输出';
  console.log('收到输入2:', input2);

  return '完成';
}

async function main() {
  const gen = bidirectionalGen();

  // 第一次 next，启动生成器
  const result1 = await gen.next();
  console.log(result1); // { value: '第一次输出', done: false }

  // 第二次 next，传入值给第一个 yield
  const result2 = await gen.next('输入值1');
  // 输出: '收到输入1: 输入值1'
  console.log(result2); // { value: '第二次输出', done: false }

  // 第三次 next，传入值给第二个 yield
  const result3 = await gen.next('输入值2');
  // 输出: '收到输入2: 输入值2'
  console.log(result3); // { value: '完成', done: true }
}
```

## 最佳实践

### 使用异步生成器封装分页 API

```javascript
// 推荐的分页迭代器实现
async function* fetchPaginatedData(baseUrl, options = {}) {
  const { pageSize = 20, maxPages = Infinity } = options;
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    const url = `${baseUrl}?page=${page}&pageSize=${pageSize}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // 逐个 yield 数据项，而不是整个页面
      for (const item of data.items) {
        yield item;
      }

      hasMore = data.hasNextPage;
      page++;
    } catch (error) {
      console.error(`第 ${page} 页获取失败:`, error);
      throw error;
    }
  }
}

// 使用
async function loadAllUsers() {
  const users = [];

  for await (const user of fetchPaginatedData('/api/users', { pageSize: 50 })) {
    users.push(user);

    // 可以随时中断
    if (users.length >= 100) {
      break;
    }
  }

  return users;
}
```

### 资源清理模式

```javascript
async function* createDatabaseIterator(query) {
  const connection = await database.connect();

  try {
    const cursor = await connection.query(query);

    while (await cursor.hasNext()) {
      yield await cursor.next();
    }
  } finally {
    // 确保资源被清理，无论是正常结束还是提前终止
    await connection.close();
    console.log('数据库连接已关闭');
  }
}

// 使用
async function processRecords() {
  for await (const record of createDatabaseIterator('SELECT * FROM users')) {
    console.log(record);

    if (record.id === 100) {
      break; // finally 块仍会执行
    }
  }
}
```

### 错误处理策略

```javascript
// 策略1：跳过错误项继续迭代
async function* resilientIterator(items) {
  for (const item of items) {
    try {
      yield await processItem(item);
    } catch (error) {
      console.error(`处理 ${item} 失败，跳过`);
      continue;
    }
  }
}

// 策略2：收集错误后统一处理
async function* iteratorWithErrorCollection(items) {
  const errors = [];

  for (const item of items) {
    try {
      yield await processItem(item);
    } catch (error) {
      errors.push({ item, error });
    }
  }

  if (errors.length > 0) {
    // 最后 yield 错误摘要
    yield { type: 'errors', errors };
  }
}

// 策略3：重试机制
async function* iteratorWithRetry(items, maxRetries = 3) {
  for (const item of items) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        yield await processItem(item);
        break;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }

    if (lastError) {
      throw new Error(`处理 ${item} 失败，已重试 ${maxRetries} 次`);
    }
  }
}
```

### 并发控制

```javascript
// 控制并发数量的异步迭代器
async function* concurrentIterator(items, processFn, concurrency = 3) {
  const executing = new Set();
  const results = [];

  for (const item of items) {
    const promise = processFn(item).then(result => {
      executing.delete(promise);
      return result;
    });

    executing.add(promise);
    results.push(promise);

    if (executing.size >= concurrency) {
      // 等待任意一个完成
      const completed = await Promise.race(executing);
      yield completed;
    }
  }

  // 处理剩余的
  for (const promise of results) {
    if (!promise.isFulfilled) {
      yield await promise;
    }
  }
}
```

### 组合多个异步迭代器

```javascript
// 合并多个异步迭代器（交替输出）
async function* merge(...iterables) {
  const iterators = iterables.map(iterable =>
    iterable[Symbol.asyncIterator]()
  );

  const pending = new Map();

  // 初始化所有迭代器的 next Promise
  for (let i = 0; i < iterators.length; i++) {
    pending.set(i, iterators[i].next().then(result => ({ index: i, result })));
  }

  while (pending.size > 0) {
    const { index, result } = await Promise.race(pending.values());

    if (result.done) {
      pending.delete(index);
    } else {
      yield result.value;
      pending.set(
        index,
        iterators[index].next().then(result => ({ index, result }))
      );
    }
  }
}

// 使用
async function main() {
  const iter1 = asyncGenerator1();
  const iter2 = asyncGenerator2();

  for await (const value of merge(iter1, iter2)) {
    console.log(value);
  }
}
```

## 常见陷阱

### 陷阱1：忘记使用 for-await-of

```javascript
// 错误：使用普通 for-of 遍历异步迭代器
async function wrong() {
  for (const value of asyncIterable) { // 这会遍历 Promise 对象！
    console.log(value); // Promise { ... }
  }
}

// 正确：使用 for-await-of
async function correct() {
  for await (const value of asyncIterable) {
    console.log(value); // 实际的值
  }
}
```

### 陷阱2：在非异步上下文中使用 for-await-of

```javascript
// 错误：for-await-of 必须在 async 函数中
function notAsync() {
  for await (const value of asyncIterable) { // SyntaxError!
    console.log(value);
  }
}

// 正确
async function isAsync() {
  for await (const value of asyncIterable) {
    console.log(value);
  }
}

// 或者使用顶层 await（ES2022+，模块环境）
for await (const value of asyncIterable) {
  console.log(value);
}
```

### 陷阱3：未处理异步生成器中的错误

```javascript
// 问题：错误会导致迭代器永久失败
async function* riskyGenerator() {
  yield await fetchData1(); // 如果这里失败...
  yield await fetchData2(); // 这里永远不会执行
}

// 解决方案1：在生成器内部处理
async function* safeGenerator() {
  try {
    yield await fetchData1();
  } catch (e) {
    yield { error: e.message };
  }

  try {
    yield await fetchData2();
  } catch (e) {
    yield { error: e.message };
  }
}

// 解决方案2：在消费端处理
async function consume() {
  const gen = riskyGenerator();

  while (true) {
    try {
      const { value, done } = await gen.next();
      if (done) break;
      console.log(value);
    } catch (e) {
      console.error('迭代出错:', e);
      break;
    }
  }
}
```

### 陷阱4：忘记清理资源

```javascript
// 问题：break 后资源未清理
async function* leakyGenerator() {
  const connection = await db.connect();
  yield* fetchRecords(connection);
  connection.close(); // break 后不会执行到这里
}

// 解决方案：使用 try-finally
async function* safeGenerator() {
  const connection = await db.connect();
  try {
    yield* fetchRecords(connection);
  } finally {
    connection.close(); // break 后也会执行
  }
}
```

### 陷阱5：误用 yield 和 return

```javascript
// 问题：return 的值不会被 for-await-of 遍历到
async function* generator() {
  yield 1;
  yield 2;
  return 3; // 这个值会丢失
}

async function test() {
  for await (const value of generator()) {
    console.log(value); // 只输出 1, 2
  }
}

// 如果需要获取 return 值，手动迭代
async function testManual() {
  const gen = generator();
  let result;

  while (!(result = await gen.next()).done) {
    console.log(result.value);
  }

  console.log('Return value:', result.value); // 3
}
```

### 陷阱6：Symbol.asyncIterator 与 Symbol.iterator 混淆

```javascript
// 问题：实现了错误的 Symbol
const wrongIterable = {
  [Symbol.iterator]() { // 这是同步迭代器！
    return {
      async next() {
        return { value: 1, done: false };
      }
    };
  }
};

// for-await-of 可以用，但行为可能不符合预期
// 正确做法
const correctIterable = {
  [Symbol.asyncIterator]() {
    return {
      async next() {
        return { value: 1, done: false };
      }
    };
  }
};
```

## 性能考量

### 内存效率

```javascript
// 低效：一次性加载所有数据到内存
async function loadAllDataBad() {
  const allData = [];
  let page = 1;

  while (true) {
    const data = await fetchPage(page++);
    allData.push(...data.items);
    if (!data.hasNextPage) break;
  }

  return allData; // 可能包含数百万条记录
}

// 高效：使用异步生成器流式处理
async function* loadDataStream() {
  let page = 1;

  while (true) {
    const data = await fetchPage(page++);

    for (const item of data.items) {
      yield item; // 逐个 yield，不累积
    }

    if (!data.hasNextPage) break;
  }
}

// 使用：内存占用恒定
async function processData() {
  for await (const item of loadDataStream()) {
    await processItem(item);
    // 处理完一个就释放一个
  }
}
```

### 请求优化

```javascript
// 预取下一页数据提高响应速度
async function* prefetchingIterator(baseUrl) {
  let page = 1;
  let currentPagePromise = fetchPage(baseUrl, page);
  let nextPagePromise = null;

  while (true) {
    const currentPage = await currentPagePromise;

    // 开始预取下一页
    if (currentPage.hasNextPage) {
      nextPagePromise = fetchPage(baseUrl, ++page);
    }

    for (const item of currentPage.items) {
      yield item;
    }

    if (!currentPage.hasNextPage) break;

    currentPagePromise = nextPagePromise;
  }
}
```

### 背压处理

```javascript
// 当消费者处理速度慢于生产者时的处理
async function* backpressureAwareIterator(source, options = {}) {
  const { highWaterMark = 10 } = options;
  const buffer = [];
  let waitingForDrain = null;

  // 填充缓冲区
  async function fillBuffer() {
    for await (const item of source) {
      buffer.push(item);

      if (buffer.length >= highWaterMark) {
        // 等待缓冲区被消费
        await new Promise(resolve => {
          waitingForDrain = resolve;
        });
      }
    }
  }

  // 开始填充
  const filling = fillBuffer();

  // 从缓冲区 yield
  while (true) {
    if (buffer.length > 0) {
      yield buffer.shift();

      // 通知可以继续填充
      if (waitingForDrain && buffer.length < highWaterMark / 2) {
        waitingForDrain();
        waitingForDrain = null;
      }
    } else {
      // 等待新数据
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // 检查是否完成
    // ...
  }
}
```

### 性能对比

```javascript
// 基准测试
async function benchmark() {
  const iterations = 10000;

  // 方法1：直接数组
  console.time('Array');
  const arr = [];
  for (let i = 0; i < iterations; i++) {
    arr.push(await getValue(i));
  }
  console.timeEnd('Array');

  // 方法2：异步生成器
  console.time('AsyncGenerator');
  async function* gen() {
    for (let i = 0; i < iterations; i++) {
      yield await getValue(i);
    }
  }
  for await (const _ of gen()) {}
  console.timeEnd('AsyncGenerator');

  // 结果：异步生成器有轻微开销，但内存效率更高
}
```

## 实战场景

### 场景1：分页 API 数据获取

```javascript
// 通用的分页 API 迭代器
class PaginatedAPI {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.pageSize = options.pageSize || 20;
    this.headers = options.headers || {};
  }

  async *items() {
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const url = new URL(this.baseUrl);
      url.searchParams.set('limit', this.pageSize);
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        throw new Error(`API 错误: ${response.status}`);
      }

      const data = await response.json();

      for (const item of data.items) {
        yield item;
      }

      cursor = data.nextCursor;
      hasMore = !!cursor;
    }
  }

  async *pages() {
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const url = new URL(this.baseUrl);
      url.searchParams.set('limit', this.pageSize);
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      const response = await fetch(url, { headers: this.headers });
      const data = await response.json();

      yield data;

      cursor = data.nextCursor;
      hasMore = !!cursor;
    }
  }

  [Symbol.asyncIterator]() {
    return this.items();
  }
}

// 使用
async function fetchAllUsers() {
  const api = new PaginatedAPI('https://api.example.com/users', {
    pageSize: 100,
    headers: { 'Authorization': 'Bearer token' }
  });

  const users = [];
  for await (const user of api) {
    users.push(user);

    // 进度报告
    if (users.length % 100 === 0) {
      console.log(`已加载 ${users.length} 个用户`);
    }
  }

  return users;
}
```

### 场景2：实时数据流处理

```javascript
// WebSocket 消息流
class WebSocketStream {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.queue = [];
    this.resolvers = [];
    this.closed = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (this.resolvers.length > 0) {
          const resolve = this.resolvers.shift();
          resolve({ value: data, done: false });
        } else {
          this.queue.push(data);
        }
      };

      this.ws.onclose = () => {
        this.closed = true;
        for (const resolve of this.resolvers) {
          resolve({ value: undefined, done: true });
        }
      };
    });
  }

  [Symbol.asyncIterator]() {
    return {
      next: () => {
        if (this.queue.length > 0) {
          return Promise.resolve({
            value: this.queue.shift(),
            done: false
          });
        }

        if (this.closed) {
          return Promise.resolve({ value: undefined, done: true });
        }

        return new Promise(resolve => {
          this.resolvers.push(resolve);
        });
      },

      return: () => {
        this.ws.close();
        return Promise.resolve({ value: undefined, done: true });
      }
    };
  }
}

// 使用
async function processRealTimeData() {
  const stream = new WebSocketStream('wss://api.example.com/stream');
  await stream.connect();

  for await (const message of stream) {
    console.log('收到消息:', message);

    if (message.type === 'end') {
      break;
    }
  }
}
```

### 场景3：文件分块读取

```javascript
// Node.js 环境下的文件流式读取
async function* readFileInChunks(filePath, chunkSize = 64 * 1024) {
  const fs = require('fs').promises;
  const fileHandle = await fs.open(filePath, 'r');

  try {
    const buffer = Buffer.alloc(chunkSize);
    let position = 0;

    while (true) {
      const { bytesRead } = await fileHandle.read(
        buffer,
        0,
        chunkSize,
        position
      );

      if (bytesRead === 0) break;

      yield buffer.slice(0, bytesRead);
      position += bytesRead;
    }
  } finally {
    await fileHandle.close();
  }
}

// 使用
async function processLargeFile() {
  let totalBytes = 0;

  for await (const chunk of readFileInChunks('/path/to/large-file.txt')) {
    totalBytes += chunk.length;
    // 处理数据块
    await processChunk(chunk);
  }

  console.log(`总共处理 ${totalBytes} 字节`);
}
```

### 场景4：数据库游标迭代

```javascript
// 数据库查询结果迭代器
class DatabaseCursor {
  constructor(connection, query, batchSize = 100) {
    this.connection = connection;
    this.query = query;
    this.batchSize = batchSize;
  }

  async *[Symbol.asyncIterator]() {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const rows = await this.connection.query(
        `${this.query} LIMIT ${this.batchSize} OFFSET ${offset}`
      );

      if (rows.length === 0) {
        hasMore = false;
        break;
      }

      for (const row of rows) {
        yield row;
      }

      hasMore = rows.length === this.batchSize;
      offset += this.batchSize;
    }
  }
}

// 使用
async function exportUsers() {
  const connection = await db.connect();
  const cursor = new DatabaseCursor(
    connection,
    'SELECT * FROM users WHERE active = true',
    500
  );

  const output = fs.createWriteStream('users.json');
  output.write('[\n');

  let first = true;
  for await (const user of cursor) {
    if (!first) output.write(',\n');
    output.write(JSON.stringify(user));
    first = false;
  }

  output.write('\n]');
  output.end();
}
```

### 场景5：轮询与重试

```javascript
// 带重试的轮询迭代器
async function* pollWithRetry(fetchFn, options = {}) {
  const {
    interval = 5000,
    maxRetries = 3,
    retryDelay = 1000,
    shouldStop = () => false
  } = options;

  while (true) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = await fetchFn();
        yield data;

        if (shouldStop(data)) {
          return;
        }

        break;
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          console.warn(`尝试 ${attempt} 失败，${retryDelay}ms 后重试`);
          await new Promise(r => setTimeout(r, retryDelay));
        }
      }
    }

    if (lastError) {
      yield { error: lastError.message };
    }

    await new Promise(r => setTimeout(r, interval));
  }
}

// 使用
async function monitorJobStatus(jobId) {
  const poll = pollWithRetry(
    () => fetch(`/api/jobs/${jobId}`).then(r => r.json()),
    {
      interval: 2000,
      shouldStop: (data) => data.status === 'completed' || data.status === 'failed'
    }
  );

  for await (const status of poll) {
    console.log('任务状态:', status);
  }
}
```

## 面试要点

### 异步迭代器与同步迭代器的区别

**问：请解释异步迭代器和同步迭代器的区别？**

```javascript
// 同步迭代器
const syncIterable = {
  [Symbol.iterator]() {
    return {
      next() {
        return { value: 1, done: false }; // 直接返回结果
      }
    };
  }
};

// 异步迭代器
const asyncIterable = {
  [Symbol.asyncIterator]() {
    return {
      next() {
        return Promise.resolve({ value: 1, done: false }); // 返回 Promise
      }
    };
  }
};

// 关键区别：
// 1. Symbol：Symbol.iterator vs Symbol.asyncIterator
// 2. next() 返回值：对象 vs Promise<对象>
// 3. 遍历方式：for-of vs for-await-of
// 4. 使用场景：同步数据 vs 异步数据流
```

### for-await-of 可以遍历哪些对象

**问：for-await-of 可以遍历哪些类型的对象？**

```javascript
async function examples() {
  // 1. 异步可迭代对象（实现 Symbol.asyncIterator）
  for await (const x of asyncIterable) {}

  // 2. 同步可迭代对象（实现 Symbol.iterator）
  for await (const x of [1, 2, 3]) {}

  // 3. Promise 数组
  for await (const x of [Promise.resolve(1), Promise.resolve(2)]) {}

  // 4. 异步生成器返回的对象
  for await (const x of asyncGeneratorFunction()) {}

  // 注意：普通对象不能直接遍历
  // for await (const x of { a: 1 }) {} // TypeError
}
```

### 异步生成器与普通异步函数的区别

**问：async function* 和 async function 有什么区别？**

```javascript
// async function：返回 Promise<value>
async function asyncFn() {
  return 'value'; // 返回单个值
}

// async function*：返回 AsyncGenerator，可以 yield 多个值
async function* asyncGenFn() {
  yield 1;
  yield 2;
  yield 3;
  return 'done'; // return 值通过 next() 的 done: true 获取
}

// 调用区别
asyncFn().then(value => console.log(value)); // 'value'

const gen = asyncGenFn();
gen.next().then(r => console.log(r)); // { value: 1, done: false }
gen.next().then(r => console.log(r)); // { value: 2, done: false }
```

### 如何处理异步迭代中的错误

**问：在 for-await-of 循环中如何处理错误？**

```javascript
// 方法1：try-catch 包裹整个循环
async function method1() {
  try {
    for await (const item of asyncIterable) {
      processItem(item);
    }
  } catch (error) {
    console.error('迭代错误:', error);
  }
}

// 方法2：在循环内部处理
async function method2() {
  for await (const item of asyncIterable) {
    try {
      await processItem(item);
    } catch (error) {
      console.error('处理错误:', error);
      continue; // 继续下一项
    }
  }
}

// 方法3：在生成器内部处理
async function* safeGenerator() {
  for (const item of items) {
    try {
      yield await fetchItem(item);
    } catch (error) {
      yield { error: error.message };
    }
  }
}
```

### yield* 在异步生成器中的作用

**问：yield* 在异步生成器中是如何工作的？**

```javascript
async function* innerGen() {
  yield await Promise.resolve(1);
  yield await Promise.resolve(2);
}

async function* outerGen() {
  yield 0;

  // yield* 会：
  // 1. 获取 innerGen 的迭代器
  // 2. 自动遍历并转发所有 yield 的值
  // 3. 等待每个值的 Promise 解析
  yield* innerGen();

  yield 3;
}

// 结果：0, 1, 2, 3
for await (const value of outerGen()) {
  console.log(value);
}

// yield* 还可以委托给同步可迭代对象
async function* mixed() {
  yield* [1, 2, 3]; // 同步数组
  yield* asyncIterable; // 异步可迭代
}
```

### 实现一个简单的异步迭代器

**问：请手写一个异步迭代器，模拟网络请求获取数据？**

```javascript
function createAsyncIterator(urls) {
  let index = 0;

  return {
    [Symbol.asyncIterator]() {
      return this;
    },

    async next() {
      if (index >= urls.length) {
        return { value: undefined, done: true };
      }

      const url = urls[index++];
      const response = await fetch(url);
      const data = await response.json();

      return { value: data, done: false };
    },

    async return() {
      console.log('迭代器提前终止');
      return { value: undefined, done: true };
    }
  };
}

// 使用
async function test() {
  const urls = ['/api/1', '/api/2', '/api/3'];
  const iterator = createAsyncIterator(urls);

  for await (const data of iterator) {
    console.log(data);
  }
}
```

## 延伸阅读

### 官方文档

- [MDN: for await...of](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/for-await...of)
- [MDN: async function*](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function*)
- [MDN: Symbol.asyncIterator](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator)
- [ECMAScript 规范：AsyncIterator](https://tc39.es/ecma262/#sec-asynciterator-interface)

### 相关提案和规范

- [TC39 Async Iteration 提案](https://github.com/tc39/proposal-async-iteration)
- [Async Generators 提案说明](https://github.com/tc39/proposal-async-iteration/blob/master/README.md)

### 进阶学习资源

- [JavaScript Info: Async Iterators and Generators](https://javascript.info/async-iterators-generators)
- [Exploring JS: Asynchronous Iteration](https://exploringjs.com/es2018-es2019/ch_asynchronous-iteration.html)
- [Node.js Streams 与异步迭代器](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators)

### 实用库

- [IxJS (Interactive Extensions for JavaScript)](https://github.com/ReactiveX/IxJS) - 异步迭代工具库
- [p-queue](https://github.com/sindresorhus/p-queue) - Promise 并发控制
- [async-iterator-to-array](https://www.npmjs.com/package/async-iterator-to-array) - 异步迭代器转数组

### 相关主题

- [迭代器与生成器](/javascript/iterators-generators) - 同步迭代器基础
- [async/await](/javascript/async-await) - 异步函数基础
- [Promises](/javascript/promises) - Promise 深入理解
- [事件循环](/javascript/event-loop) - JavaScript 异步模型
