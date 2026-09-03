---
title: 迭代器与生成器
description: JavaScript迭代器与生成器完全指南，Symbol.iterator与yield
track: javascript
section: core
difficulty: advanced
tags:
  - JavaScript
  - 迭代器
  - 生成器
  - Symbol
status: imported
origin: old/src/content/docs/javascript/iterators-generators.zh.md
divergence: 0.368
issues:
  - divergent
legacy:
  category: JavaScript
  subcategory: 高级特性
  order: 14
  lastUpdated: 2026-01-07
---

迭代器（Iterator）和生成器（Generator）是 JavaScript 中强大的特性，它们提供了一种统一的方式来遍历各种数据结构，并能够创建自定义的可迭代对象。本文将深入探讨这两个概念的原理、用法和实际应用场景。

## 迭代器协议

### 什么是迭代器

迭代器是一个对象，它定义了一个序列，并在终止时可能返回一个值。具体来说，迭代器是任何实现了 `next()` 方法的对象，该方法返回一个包含两个属性的对象：

- `value`：迭代器返回的下一个值
- `done`：如果迭代器已经迭代完毕，则为 `true`；否则为 `false`

```javascript
// 手动创建一个简单的迭代器
function createIterator(items) {
  let index = 0;

  return {
    next() {
      if (index < items.length) {
        return {
          value: items[index++],
          done: false
        };
      } else {
        return {
          value: undefined,
          done: true
        };
      }
    }
  };
}

const iterator = createIterator([1, 2, 3]);

console.log(iterator.next()); // { value: 1, done: false }
console.log(iterator.next()); // { value: 2, done: false }
console.log(iterator.next()); // { value: 3, done: false }
console.log(iterator.next()); // { value: undefined, done: true }
```

### 迭代器的工作原理

迭代器的核心思想是**惰性求值**（Lazy Evaluation）。这意味着值只在需要时才被计算，而不是一次性计算所有值。这种方式在处理大型数据集或无限序列时特别有用。

```javascript
// 创建一个无限序列的迭代器
function createInfiniteIterator() {
  let value = 0;

  return {
    next() {
      return {
        value: value++,
        done: false  // 永远不会结束
      };
    }
  };
}

const infiniteIterator = createInfiniteIterator();

console.log(infiniteIterator.next().value); // 0
console.log(infiniteIterator.next().value); // 1
console.log(infiniteIterator.next().value); // 2
// 可以无限继续...
```

## Symbol.iterator

### 可迭代协议

可迭代协议定义了一种标准方式，使对象能够定义或自定义其迭代行为。要成为可迭代对象，对象必须实现 `@@iterator` 方法，这意味着对象（或其原型链上的某个对象）必须有一个键为 `Symbol.iterator` 的属性。

```javascript
// 内置可迭代对象示例
const array = [1, 2, 3];
const string = "hello";
const set = new Set([1, 2, 3]);
const map = new Map([['a', 1], ['b', 2]]);

// 获取迭代器
const arrayIterator = array[Symbol.iterator]();
const stringIterator = string[Symbol.iterator]();

console.log(arrayIterator.next()); // { value: 1, done: false }
console.log(stringIterator.next()); // { value: 'h', done: false }
```

### 创建自定义可迭代对象

```javascript
// 创建一个范围对象，使其可迭代
const range = {
  start: 1,
  end: 5,

  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;

    return {
      next() {
        if (current <= end) {
          return { value: current++, done: false };
        } else {
          return { value: undefined, done: true };
        }
      }
    };
  }
};

// 使用 for...of 遍历
for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// 使用展开运算符
console.log([...range]); // [1, 2, 3, 4, 5]

// 使用 Array.from
console.log(Array.from(range)); // [1, 2, 3, 4, 5]
```

### 类中的迭代器实现

```javascript
class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  append(value) {
    const node = { value, next: null };

    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }

    this.size++;
    return this;
  }

  // 实现迭代器
  [Symbol.iterator]() {
    let current = this.head;

    return {
      next() {
        if (current) {
          const value = current.value;
          current = current.next;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

const list = new LinkedList();
list.append(1).append(2).append(3);

for (const value of list) {
  console.log(value); // 1, 2, 3
}

console.log([...list]); // [1, 2, 3]
```

## 生成器函数

### 基本语法

生成器函数使用 `function*` 语法定义，它返回一个生成器对象（Generator），该对象同时实现了迭代器协议和可迭代协议。

```javascript
// 生成器函数的基本形式
function* simpleGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = simpleGenerator();

console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: undefined, done: true }

// 生成器对象是可迭代的
for (const value of simpleGenerator()) {
  console.log(value); // 1, 2, 3
}
```

### yield 关键字详解

`yield` 关键字用于暂停和恢复生成器函数。每次调用 `next()` 方法时，生成器函数会执行到下一个 `yield` 表达式，然后暂停。

```javascript
function* countingGenerator() {
  console.log('开始执行');
  yield 1;
  console.log('继续执行');
  yield 2;
  console.log('最后一步');
  yield 3;
  console.log('执行结束');
}

const counter = countingGenerator();

counter.next();
// 输出: '开始执行'
// 返回: { value: 1, done: false }

counter.next();
// 输出: '继续执行'
// 返回: { value: 2, done: false }

counter.next();
// 输出: '最后一步'
// 返回: { value: 3, done: false }

counter.next();
// 输出: '执行结束'
// 返回: { value: undefined, done: true }
```

### 向生成器传值

`next()` 方法可以接受一个参数，该参数会成为上一个 `yield` 表达式的返回值。

```javascript
function* twoWayGenerator() {
  const a = yield '第一个 yield';
  console.log('接收到:', a);

  const b = yield '第二个 yield';
  console.log('接收到:', b);

  return a + b;
}

const gen = twoWayGenerator();

console.log(gen.next());      // { value: '第一个 yield', done: false }
console.log(gen.next(10));    // 输出: '接收到: 10'
                              // { value: '第二个 yield', done: false }
console.log(gen.next(20));    // 输出: '接收到: 20'
                              // { value: 30, done: true }
```

### yield* 委托

`yield*` 表达式用于将执行委托给另一个生成器或可迭代对象。

```javascript
function* innerGenerator() {
  yield 'a';
  yield 'b';
}

function* outerGenerator() {
  yield 1;
  yield* innerGenerator();  // 委托给内部生成器
  yield 2;
  yield* [3, 4, 5];         // 委托给数组
  yield 6;
}

console.log([...outerGenerator()]);
// [1, 'a', 'b', 2, 3, 4, 5, 6]
```

### 生成器的 return 和 throw

生成器对象还有 `return()` 和 `throw()` 方法：

```javascript
function* generatorWithCleanup() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } finally {
    console.log('清理资源');
  }
}

const gen1 = generatorWithCleanup();
console.log(gen1.next()); // { value: 1, done: false }
console.log(gen1.return('提前结束'));
// 输出: '清理资源'
// { value: '提前结束', done: true }

const gen2 = generatorWithCleanup();
console.log(gen2.next()); // { value: 1, done: false }
try {
  gen2.throw(new Error('出错了'));
} catch (e) {
  console.log('捕获错误:', e.message);
}
// 输出: '清理资源'
// 输出: '捕获错误: 出错了'
```

## for...of 循环

`for...of` 语句创建一个迭代循环，遍历可迭代对象。

### 基本用法

```javascript
// 遍历数组
const fruits = ['苹果', '香蕉', '橙子'];
for (const fruit of fruits) {
  console.log(fruit);
}

// 遍历字符串
for (const char of '你好') {
  console.log(char); // '你', '好'
}

// 遍历 Map
const map = new Map([
  ['name', '张三'],
  ['age', 25]
]);
for (const [key, value] of map) {
  console.log(`${key}: ${value}`);
}

// 遍历 Set
const set = new Set([1, 2, 3, 2, 1]);
for (const value of set) {
  console.log(value); // 1, 2, 3
}
```

### for...of 与 for...in 的区别

```javascript
const array = ['a', 'b', 'c'];
array.customProperty = 'custom';

// for...in 遍历对象的可枚举属性（包括原型链）
for (const index in array) {
  console.log(index); // '0', '1', '2', 'customProperty'
}

// for...of 遍历可迭代对象的值
for (const value of array) {
  console.log(value); // 'a', 'b', 'c'
}
```

### 使对象支持 for...of

普通对象默认不可迭代，但我们可以让它可迭代：

```javascript
const person = {
  name: '李四',
  age: 30,
  city: '北京',

  [Symbol.iterator]() {
    const entries = Object.entries(this).filter(
      ([key]) => key !== Symbol.iterator.toString()
    );
    let index = 0;

    return {
      next() {
        if (index < entries.length) {
          return { value: entries[index++], done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
};

for (const [key, value] of person) {
  console.log(`${key}: ${value}`);
}
// name: 李四
// age: 30
// city: 北京
```

## 展开运算符与迭代

展开运算符 `...` 可以用于任何可迭代对象。

```javascript
// 数组展开
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];
console.log(combined); // [1, 2, 3, 4, 5, 6]

// 字符串展开
const chars = [...'JavaScript'];
console.log(chars); // ['J', 'a', 'v', 'a', 'S', 'c', 'r', 'i', 'p', 't']

// Set 展开（去重）
const numbers = [1, 2, 2, 3, 3, 3];
const unique = [...new Set(numbers)];
console.log(unique); // [1, 2, 3]

// Map 展开
const map = new Map([['a', 1], ['b', 2]]);
const mapArray = [...map];
console.log(mapArray); // [['a', 1], ['b', 2]]

// 自定义迭代器展开
function* range(start, end) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}
console.log([...range(1, 5)]); // [1, 2, 3, 4, 5]
```

### 函数参数中的展开

```javascript
function sum(...numbers) {
  return numbers.reduce((acc, num) => acc + num, 0);
}

function* generateNumbers() {
  yield 1;
  yield 2;
  yield 3;
}

console.log(sum(...generateNumbers())); // 6
console.log(Math.max(...range(1, 10))); // 10
```

## 异步迭代器

### 异步迭代协议

异步迭代器与同步迭代器类似，但 `next()` 方法返回的是 Promise。

```javascript
// 异步迭代器对象
const asyncIterator = {
  current: 0,
  max: 3,

  async next() {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (this.current < this.max) {
      return { value: this.current++, done: false };
    }
    return { value: undefined, done: true };
  }
};

// 手动迭代
(async () => {
  console.log(await asyncIterator.next()); // { value: 0, done: false }
  console.log(await asyncIterator.next()); // { value: 1, done: false }
  console.log(await asyncIterator.next()); // { value: 2, done: false }
  console.log(await asyncIterator.next()); // { value: undefined, done: true }
})();
```

### Symbol.asyncIterator

使用 `Symbol.asyncIterator` 创建异步可迭代对象：

```javascript
const asyncRange = {
  start: 1,
  end: 5,

  [Symbol.asyncIterator]() {
    let current = this.start;
    const end = this.end;

    return {
      async next() {
        // 模拟网络请求延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        if (current <= end) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
};

// 使用 for await...of 遍历
(async () => {
  for await (const num of asyncRange) {
    console.log(num); // 每隔 500ms 输出 1, 2, 3, 4, 5
  }
})();
```

### 异步生成器

使用 `async function*` 定义异步生成器：

```javascript
async function* asyncGenerator() {
  const urls = [
    'https://api.example.com/data/1',
    'https://api.example.com/data/2',
    'https://api.example.com/data/3'
  ];

  for (const url of urls) {
    // 模拟 fetch 请求
    const response = await fakeFetch(url);
    yield response;
  }
}

// 模拟 fetch
async function fakeFetch(url) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { url, data: `Data from ${url}` };
}

// 使用异步生成器
(async () => {
  for await (const response of asyncGenerator()) {
    console.log(response);
  }
})();
```

### 实际应用：分页数据获取

```javascript
async function* fetchPaginatedData(baseUrl, pageSize = 10) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${baseUrl}?page=${page}&size=${pageSize}`);
    const data = await response.json();

    yield* data.items;  // 逐个产出每一项

    hasMore = data.hasNextPage;
    page++;
  }
}

// 使用示例
(async () => {
  const users = fetchPaginatedData('/api/users', 20);

  for await (const user of users) {
    console.log(user.name);

    // 可以在任何时候中断
    if (user.name === '特定用户') {
      break;
    }
  }
})();
```

## 实际应用案例

### 案例一：无限滚动数据流

```javascript
class InfiniteScroll {
  constructor(fetchFn, pageSize = 20) {
    this.fetchFn = fetchFn;
    this.pageSize = pageSize;
    this.page = 0;
    this.exhausted = false;
  }

  async *[Symbol.asyncIterator]() {
    while (!this.exhausted) {
      const items = await this.fetchFn(this.page, this.pageSize);

      if (items.length < this.pageSize) {
        this.exhausted = true;
      }

      for (const item of items) {
        yield item;
      }

      this.page++;
    }
  }
}

// 使用示例
const scroll = new InfiniteScroll(async (page, size) => {
  // 模拟 API 调用
  const response = await fetch(`/api/posts?page=${page}&size=${size}`);
  return response.json();
});

(async () => {
  let count = 0;
  for await (const post of scroll) {
    console.log(post.title);
    count++;

    // 控制加载数量
    if (count >= 100) break;
  }
})();
```

### 案例二：深度优先遍历树结构

```javascript
function* traverseTree(node) {
  yield node;

  if (node.children) {
    for (const child of node.children) {
      yield* traverseTree(child);
    }
  }
}

const tree = {
  value: 'root',
  children: [
    {
      value: 'a',
      children: [
        { value: 'a1' },
        { value: 'a2' }
      ]
    },
    {
      value: 'b',
      children: [
        { value: 'b1' }
      ]
    }
  ]
};

for (const node of traverseTree(tree)) {
  console.log(node.value);
}
// root, a, a1, a2, b, b1
```

### 案例三：数据转换管道

```javascript
function* filter(iterable, predicate) {
  for (const item of iterable) {
    if (predicate(item)) {
      yield item;
    }
  }
}

function* map(iterable, transform) {
  for (const item of iterable) {
    yield transform(item);
  }
}

function* take(iterable, count) {
  let taken = 0;
  for (const item of iterable) {
    if (taken >= count) return;
    yield item;
    taken++;
  }
}

// 创建一个惰性求值的管道
function* range(start, end) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

const pipeline = take(
  map(
    filter(range(1, 100), x => x % 2 === 0),  // 偶数
    x => x * x                                 // 平方
  ),
  5  // 只取前 5 个
);

console.log([...pipeline]); // [4, 16, 36, 64, 100]
```

### 案例四：状态机

```javascript
function* trafficLight() {
  while (true) {
    yield '红灯';
    yield '绿灯';
    yield '黄灯';
  }
}

function* trafficLightWithDuration() {
  while (true) {
    yield { color: '红灯', duration: 30000 };
    yield { color: '绿灯', duration: 25000 };
    yield { color: '黄灯', duration: 5000 };
  }
}

// 使用
const light = trafficLight();
console.log(light.next().value); // 红灯
console.log(light.next().value); // 绿灯
console.log(light.next().value); // 黄灯
console.log(light.next().value); // 红灯（循环）
```

### 案例五：协程模式

```javascript
function runCoroutine(generatorFn) {
  const generator = generatorFn();

  function handle(result) {
    if (result.done) return Promise.resolve(result.value);

    return Promise.resolve(result.value)
      .then(res => handle(generator.next(res)))
      .catch(err => handle(generator.throw(err)));
  }

  return handle(generator.next());
}

// 使用协程处理异步流程
runCoroutine(function* () {
  try {
    const user = yield fetch('/api/user').then(r => r.json());
    console.log('用户:', user);

    const posts = yield fetch(`/api/posts?userId=${user.id}`).then(r => r.json());
    console.log('文章:', posts);

    return { user, posts };
  } catch (error) {
    console.error('错误:', error);
  }
});
```

### 案例六：自定义集合类

```javascript
class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(element, priority) {
    const item = { element, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (item.priority < this.items[i].priority) {
        this.items.splice(i, 0, item);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(item);
    }
  }

  dequeue() {
    return this.items.shift()?.element;
  }

  *[Symbol.iterator]() {
    for (const item of this.items) {
      yield item.element;
    }
  }

  *entries() {
    for (const item of this.items) {
      yield [item.element, item.priority];
    }
  }
}

const pq = new PriorityQueue();
pq.enqueue('低优先级任务', 3);
pq.enqueue('高优先级任务', 1);
pq.enqueue('中优先级任务', 2);

console.log([...pq]);
// ['高优先级任务', '中优先级任务', '低优先级任务']

for (const [task, priority] of pq.entries()) {
  console.log(`${task} (优先级: ${priority})`);
}
```

## 性能考虑

### 迭代器的优势

1. **内存效率**：惰性求值意味着不需要一次性将所有数据加载到内存中
2. **可组合性**：可以轻松组合多个迭代器操作
3. **无限序列**：可以表示无限序列而不会耗尽内存

```javascript
// 内存效率对比
// 不好的做法：一次性创建大数组
function getEvenNumbers(max) {
  const result = [];
  for (let i = 0; i <= max; i += 2) {
    result.push(i);
  }
  return result;
}

// 好的做法：使用生成器
function* getEvenNumbersGen(max) {
  for (let i = 0; i <= max; i += 2) {
    yield i;
  }
}

// 处理大量数据时，生成器版本更节省内存
const max = 1000000;

// 数组版本会分配大量内存
// const evens = getEvenNumbers(max);

// 生成器版本几乎不占用额外内存
for (const even of getEvenNumbersGen(max)) {
  if (even > 100) break;  // 可以提前终止
}
```

### 注意事项

```javascript
// 1. 迭代器只能迭代一次
const gen = (function* () {
  yield 1;
  yield 2;
})();

console.log([...gen]); // [1, 2]
console.log([...gen]); // [] - 已经耗尽

// 2. 如果需要多次迭代，使用工厂函数
function createGenerator() {
  return (function* () {
    yield 1;
    yield 2;
  })();
}

console.log([...createGenerator()]); // [1, 2]
console.log([...createGenerator()]); // [1, 2]

// 3. 生成器有轻微的性能开销
// 对于简单的循环，直接使用 for 循环可能更快
```

## 总结

迭代器和生成器是 JavaScript 中非常强大的特性：

1. **迭代器协议**提供了一种统一的方式来遍历各种数据结构
2. **Symbol.iterator**允许自定义对象成为可迭代的
3. **生成器函数**简化了迭代器的创建，通过 `yield` 实现暂停和恢复
4. **yield***允许委托给其他可迭代对象
5. **for...of**循环提供了简洁的迭代语法
6. **展开运算符**可以将任何可迭代对象转换为数组
7. **异步迭代器**和**异步生成器**支持异步数据流的处理

掌握这些概念将帮助你编写更优雅、更高效的 JavaScript 代码，特别是在处理复杂数据流、实现惰性求值以及处理异步操作时。
