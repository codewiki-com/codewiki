---
title: JavaScript Event Loop Complete Guide
description: Master the JavaScript event loop, call stack, and async execution
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Event Loop
  - Async
  - Concurrency
status: imported
origin: old/src/content/docs/frontend/js-event-loop.zh.md
divergence: 0.203
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Frontend
  subcategory: JavaScript
  order: 7
  lastUpdated: 2026-01-07
---

事件循环是 JavaScript 异步编程模型的核心。理解其工作原理对于编写高效、无 bug 的代码至关重要，也是技术面试中的常见话题。本完全指南将带你从基础概念到进阶知识，帮助你掌握 JavaScript 并发机制。

## JavaScript 的单线程特性

### 为什么是单线程？

JavaScript 被设计为单线程语言，这意味着它同一时间只能执行一段代码。这个设计决策有充分的理由：

1. **简单性**：单线程执行消除了多线程编程中常见的复杂同步问题，如竞态条件和死锁。

2. **DOM 安全性**：JavaScript 最初是为了在浏览器中操作 DOM 而创建的。如果多个线程可以同时修改 DOM，将导致不可预测的行为和冲突。

3. **更易调试**：只有一个执行线程时，代码流程更加可预测，更容易追踪。

```javascript
// JavaScript 在单线程中按顺序执行代码
console.log('First');
console.log('Second');
console.log('Third');

// 输出（始终按此顺序）：
// First
// Second
// Third
```

### 单线程执行的问题

虽然单线程简化了很多事情，但它也带来了一个重大挑战：**阻塞操作**。如果 JavaScript 必须等待每个慢速操作（网络请求、文件 I/O、定时器）完成后才能继续，整个应用程序就会冻结。

```javascript
// 假设的同步网络请求（会阻塞一切）
const data = fetchDataSync('https://api.example.com/data'); // 浏览器在此冻结
console.log(data); // 用户在完成前无法交互
```

这就是事件循环发挥作用的地方，它使得在单线程环境中实现非阻塞的异步操作成为可能。

## 调用栈和堆

### 调用栈

调用栈是一个 LIFO（后进先出）数据结构，用于跟踪函数的执行。当函数被调用时，它被压入栈中。当函数返回时，它被弹出栈。

```javascript
function multiply(a, b) {
  return a * b;
}

function square(n) {
  return multiply(n, n);
}

function printSquare(n) {
  const result = square(n);
  console.log(result);
}

printSquare(4);
```

调用栈的变化过程如下：

```
步骤 1: [printSquare]
步骤 2: [printSquare, square]
步骤 3: [printSquare, square, multiply]
步骤 4: [printSquare, square]           // multiply 返回
步骤 5: [printSquare]                   // square 返回
步骤 6: [printSquare, console.log]
步骤 7: [printSquare]                   // console.log 返回
步骤 8: []                              // printSquare 返回
```

### 栈溢出

当太多函数被压入栈中时（通常由于无限递归），你会得到栈溢出错误：

```javascript
function recurseForever() {
  recurseForever(); // 无限递归
}

recurseForever();
// Error: Maximum call stack size exceeded
```

### 堆

堆是一个大型的、非结构化的内存区域，用于存储对象。当你创建对象、数组或函数时，内存是从堆中分配的。

```javascript
// 这些存储在堆中
const user = { name: 'Alice', age: 30 };
const numbers = [1, 2, 3, 4, 5];
const greet = function() { console.log('Hello'); };
```

调用栈包含对堆中对象的引用（指针），而不是对象本身。这就是为什么通过不同引用修改对象会影响相同的底层数据。

## 事件循环机制

### 什么是事件循环？

事件循环是一个持续运行的进程，用于监控调用栈和任务队列。它的主要工作是检查调用栈是否为空，如果为空，则将队列中的第一个可用任务压入栈中执行。

### 事件循环如何工作

这是事件循环周期的简化视图：

```
   +-----------------------+
   |        调用栈         |
   |    (执行同步代码)     |
   +-----------+-----------+
               |
               v
   +-----------+-----------+
   |    调用栈是否为空？    |
   +-----+-----+-----+-----+
         |           |
        是           否 (等待)
         |           |
         v           |
   +-----+-----+     |
   |   执行    |     |
   |   所有    |     |
   |  微任务   |     |
   +-----+-----+     |
         |           |
         v           |
   +-----+-----+     |
   |   渲染    |     |
   | (如需要)  |     |
   +-----+-----+     |
         |           |
         v           |
   +-----+-----+     |
   |   执行    |     |
   |   一个    |     |
   |  宏任务   +-----+
   +-----------+
```

### 完整的图景

事件循环协调多个组件：

1. **调用栈**：执行同步代码
2. **Web APIs**：浏览器提供的 API（setTimeout、fetch、DOM 事件）处理异步操作
3. **回调队列（任务队列）**：保存已完成异步操作的回调
4. **微任务队列**：保存微任务（Promise 回调、queueMicrotask）
5. **事件循环**：协调一切

```javascript
console.log('Start');

setTimeout(() => {
  console.log('Timeout callback');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise callback');
});

console.log('End');

// 输出：
// Start
// End
// Promise callback
// Timeout callback
```

## 任务队列和微任务队列

### 宏任务（任务队列）

宏任务被安排在下一个事件循环迭代中执行。常见的宏任务包括：

| 宏任务类型 | 描述 |
|------------|------|
| `script`（初始执行） | 正在执行的主脚本 |
| `setTimeout` | 定时器回调 |
| `setInterval` | 间隔定时器回调 |
| `setImmediate` | Node.js 特有 |
| `I/O 操作` | 网络请求、文件操作 |
| `UI 渲染` | 浏览器绑定 |
| `MessageChannel` | 消息通道回调 |

```javascript
console.log('Script start');

setTimeout(() => {
  console.log('setTimeout 1');
}, 0);

setTimeout(() => {
  console.log('setTimeout 2');
}, 0);

console.log('Script end');

// 输出：
// Script start
// Script end
// setTimeout 1
// setTimeout 2
```

### 微任务（微任务队列）

微任务的优先级高于宏任务。在每个宏任务之后（或初始脚本之后），所有微任务都会在下一个宏任务之前执行。

| 微任务类型 | 描述 |
|------------|------|
| `Promise.then/catch/finally` | Promise 回调 |
| `queueMicrotask` | 显式排队的微任务 |
| `MutationObserver` | DOM 变更回调 |
| `process.nextTick` | Node.js 特有（最高优先级） |

```javascript
console.log('Script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

Promise.resolve()
  .then(() => console.log('Promise 1'))
  .then(() => console.log('Promise 2'));

queueMicrotask(() => {
  console.log('queueMicrotask');
});

console.log('Script end');

// 输出：
// Script start
// Script end
// Promise 1
// queueMicrotask
// Promise 2
// setTimeout
```

### 关键区别：执行顺序

关键区别在于**何时**执行：

- **微任务**：在当前任务完成后立即执行，在任何渲染或下一个宏任务之前
- **宏任务**：一次执行一个，每个宏任务之间清空微任务队列

```javascript
// 展示交互的复杂示例
setTimeout(() => {
  console.log('Timeout 1');
  Promise.resolve().then(() => console.log('Promise inside Timeout 1'));
}, 0);

setTimeout(() => {
  console.log('Timeout 2');
}, 0);

Promise.resolve()
  .then(() => {
    console.log('Promise 1');
    queueMicrotask(() => console.log('Nested microtask'));
  })
  .then(() => console.log('Promise 2'));

console.log('Sync code');

// 输出：
// Sync code
// Promise 1
// Nested microtask
// Promise 2
// Timeout 1
// Promise inside Timeout 1
// Timeout 2
```

## setTimeout 和 setInterval 的行为

### setTimeout 的误解

`setTimeout(fn, delay)` 并**不**保证在恰好 `delay` 毫秒后执行。它只是安排回调在至少 `delay` 毫秒后被添加到任务队列。

```javascript
console.log('Start');

setTimeout(() => {
  console.log('Timeout executed');
}, 1000);

// 耗时 2 秒的重度计算
const start = Date.now();
while (Date.now() - start < 2000) {
  // 阻塞循环
}

console.log('End');

// 输出：
// Start
// (2 秒暂停)
// End
// Timeout executed（在 "End" 之后立即出现，而不是 1 秒后）
```

### 最小延迟

浏览器对嵌套的 setTimeout 调用强制执行最小延迟（通常在 5 层嵌套后为 4ms）：

```javascript
let start = Date.now();
let times = [];

function callback() {
  times.push(Date.now() - start);
  if (times.length < 10) {
    setTimeout(callback, 0);
  } else {
    console.log(times);
  }
}

setTimeout(callback, 0);
// 可能的输出：[1, 1, 1, 1, 4, 9, 14, 19, 24, 29]
```

### setInterval 的注意事项

`setInterval` 安排重复执行，但如果执行时间超过间隔时间，回调可能会堆积：

```javascript
// 问题：回调可能重叠
setInterval(() => {
  // 如果这需要 > 100ms，回调会排队
  heavyOperation();
}, 100);

// 更好的方式：使用递归 setTimeout 保证间隔
function betterInterval() {
  heavyOperation();
  setTimeout(betterInterval, 100);
}
setTimeout(betterInterval, 100);
```

### 零延迟模式

`setTimeout(fn, 0)` 用于将执行推迟到当前调用栈清空后：

```javascript
function processData(data) {
  console.log('Processing started');

  // 推迟重度工作以允许 UI 更新
  setTimeout(() => {
    console.log('Heavy processing');
    // ... 处理数据
  }, 0);

  console.log('Processing scheduled');
}

processData([1, 2, 3]);
// 输出：
// Processing started
// Processing scheduled
// Heavy processing
```

## Promise 和 async/await 执行顺序

### Promise 执行基础

理解 Promise 执行对于预测代码行为至关重要：

```javascript
console.log('1');

const promise = new Promise((resolve) => {
  console.log('2'); // 执行器同步运行！
  resolve();
  console.log('3'); // 仍然运行，resolve 不会退出
});

promise.then(() => {
  console.log('4'); // 微任务
});

console.log('5');

// 输出：1, 2, 3, 5, 4
```

关键洞察：Promise 执行器函数是**同步**运行的。只有 `.then()`、`.catch()` 和 `.finally()` 回调被安排为微任务。

### 链式 Promise

```javascript
Promise.resolve()
  .then(() => {
    console.log('then 1');
    return Promise.resolve();
  })
  .then(() => {
    console.log('then 2');
  });

Promise.resolve()
  .then(() => {
    console.log('then 3');
  })
  .then(() => {
    console.log('then 4');
  });

// 输出：then 1, then 3, then 2, then 4
```

注意：当 `.then()` 返回一个 Promise 时，需要额外的微任务周期来解包。

### async/await 的底层原理

`async/await` 是 Promise 的语法糖。`await` 表达式暂停 async 函数并将其余部分安排为微任务：

```javascript
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end'); // 这成为微任务
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

async1();

new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => {
  console.log('promise2');
});

console.log('script end');

// 输出：
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout
```

### 复杂的 async/await 示例

```javascript
async function foo() {
  console.log('foo start');
  await bar();
  console.log('foo end');
}

async function bar() {
  console.log('bar start');
  await Promise.resolve();
  console.log('bar end');
}

console.log('start');
foo();
console.log('end');

// 输出：
// start
// foo start
// bar start
// end
// bar end
// foo end
```

## requestAnimationFrame

### 什么是 requestAnimationFrame？

`requestAnimationFrame`（rAF）是一个为流畅动画设计的浏览器 API。它安排一个回调在下次重绘之前运行，通常以 60fps（大约每 16.7ms）运行。

```javascript
function animate() {
  // 更新动画状态
  element.style.left = (parseFloat(element.style.left) || 0) + 1 + 'px';

  // 安排下一帧
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

### rAF vs setTimeout 用于动画

```javascript
// 不好：基于 setTimeout 的动画
function animateWithTimeout() {
  element.style.left = (parseFloat(element.style.left) || 0) + 1 + 'px';
  setTimeout(animateWithTimeout, 16); // 近似 60fps
}

// 好：基于 requestAnimationFrame 的动画
function animateWithRAF() {
  element.style.left = (parseFloat(element.style.left) || 0) + 1 + 'px';
  requestAnimationFrame(animateWithRAF);
}
```

requestAnimationFrame 的优点：
- 与浏览器重绘周期同步
- 标签页不活跃时暂停（节省电量）
- 提供时间戳用于精确动画
- 更流畅的动画，无掉帧

### rAF 在事件循环中的位置

requestAnimationFrame 回调运行在：
1. 所有微任务处理完之后
2. 浏览器绑定之前
3. 但**不在**任务队列中

```javascript
console.log('Start');

requestAnimationFrame(() => {
  console.log('rAF');
});

Promise.resolve().then(() => {
  console.log('Promise');
});

setTimeout(() => {
  console.log('setTimeout');
}, 0);

console.log('End');

// 典型输出：
// Start
// End
// Promise
// rAF（在绑定之前运行）
// setTimeout
```

### 使用 rAF 进行 DOM 测量

```javascript
// 读取 DOM，然后在下一帧写入以避免布局抖动
function optimizedDOMOperation() {
  const height = element.offsetHeight; // 读取

  requestAnimationFrame(() => {
    element.style.height = height * 2 + 'px'; // 写入
  });
}
```

## Web Workers

### 突破单线程限制

虽然主 JavaScript 线程是单线程的，但 Web Workers 通过在后台线程中运行脚本提供了真正的并行性。

```javascript
// main.js
const worker = new Worker('worker.js');

worker.postMessage({ numbers: [1, 2, 3, 4, 5] });

worker.onmessage = (event) => {
  console.log('Sum:', event.data.sum);
};

// worker.js
self.onmessage = (event) => {
  const sum = event.data.numbers.reduce((a, b) => a + b, 0);
  self.postMessage({ sum });
};
```

### Web Worker 的限制

Workers 有自己的事件循环，但不能：
- 访问 DOM
- 访问 `window` 对象
- 使用某些 Web API（alert、confirm 等）

### Worker 的类型

1. **专用 Worker**：由单个脚本拥有
2. **共享 Worker**：可被多个脚本访问
3. **Service Worker**：作为 Web 应用和网络之间的代理

```javascript
// 共享 Worker 示例
// main.js
const sharedWorker = new SharedWorker('shared-worker.js');
sharedWorker.port.start();
sharedWorker.port.postMessage('Hello from page');

// shared-worker.js
self.onconnect = (event) => {
  const port = event.ports[0];
  port.onmessage = (e) => {
    port.postMessage('Received: ' + e.data);
  };
};
```

### 何时使用 Web Workers

- 重度计算（图像处理、数据解析）
- 会阻塞 UI 的复杂算法
- 后台数据同步
- 任何 CPU 密集型工作

```javascript
// 示例：卸载斐波那契计算
// main.js
const worker = new Worker('fib-worker.js');

worker.postMessage(45); // 计算 fib(45)

worker.onmessage = (event) => {
  console.log('Result:', event.data);
};

// 计算时用户仍可与页面交互

// fib-worker.js
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

self.onmessage = (event) => {
  const result = fibonacci(event.data);
  self.postMessage(result);
};
```

## 面试重点

### 经典面试题 1

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
  Promise.resolve().then(() => {
    console.log('3');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('4');
  setTimeout(() => {
    console.log('5');
  }, 0);
});

console.log('6');

// 答案：1, 6, 4, 2, 3, 5
```

**解释：**
1. 同步：输出 '1'，安排 setTimeout，安排 Promise.then，输出 '6'
2. 微任务：输出 '4'，安排另一个 setTimeout
3. 宏任务（第一个 setTimeout）：输出 '2'，安排 Promise.then
4. 微任务：输出 '3'
5. 宏任务（第二个 setTimeout）：输出 '5'

### 经典面试题 2

```javascript
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

async1();

new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => {
  console.log('promise2');
});

console.log('script end');

// 答案：script start, async1 start, async2, promise1,
//       script end, async1 end, promise2, setTimeout
```

### 关键概念总结

1. **执行顺序**：同步代码 -> 微任务 -> 宏任务

2. **微任务优先级**：所有微任务在下一个宏任务之前执行

3. **Promise 执行器**：同步运行；只有回调是异步的

4. **async/await**：Promise 的语法糖；await 安排微任务

5. **setTimeout(fn, 0)**：不是立即执行；浏览器中最小约 4ms

### 常见陷阱

**陷阱 1：假设 setTimeout(fn, 0) 是立即执行的**
```javascript
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
// promise 总是先输出！
```

**陷阱 2：忘记 Promise 执行器是同步的**
```javascript
new Promise((resolve) => {
  console.log('sync'); // 这立即运行！
  resolve();
});
```

**陷阱 3：微任务对宏任务的饥饿问题**
```javascript
function recursiveMicrotask() {
  Promise.resolve().then(recursiveMicrotask);
}
recursiveMicrotask();
// setTimeout 回调永远不会运行！
```

### 面试回答模板

当被问到"JavaScript 事件循环是如何工作的？"时，按以下结构回答：

1. **单线程**：JavaScript 有一个主执行线程
2. **调用栈**：跟踪函数执行（后进先出）
3. **Web APIs**：在主线程之外处理异步操作
4. **任务队列**：宏任务队列和微任务队列
5. **事件循环**：持续检查栈是否为空，然后处理微任务，再处理一个宏任务
6. **优先级**：同步代码 > 微任务 > 宏任务

## 延伸阅读

### 官方文档

- [MDN：并发模型与事件循环](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
- [HTML Living Standard：事件循环](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [ECMAScript 规范：作业与作业队列](https://tc39.es/ecma262/#sec-jobs)
- [Node.js：事件循环](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)

### 必读文章和视频

- Jake Archibald：[Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) - 交互式可视化
- Philip Roberts：[What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ) - JSConf 演讲
- Lydia Hallie：[JavaScript Visualized: Event Loop](https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif)

### 相关概念探索

- **Promise 和异步模式**：掌握 Promise 链式调用、错误处理和 async/await
- **Service Workers**：了解后台脚本和离线功能
- **requestIdleCallback**：学习在浏览器空闲时安排低优先级工作
- **Performance API**：测量和优化异步代码性能

### 练习建议

1. **使用可视化工具**：Loupe（http://latentflip.com/loupe/）帮助可视化事件循环
2. **编写预测练习**：练习预测复杂异步代码的输出
3. **使用 Performance 标签调试**：Chrome DevTools 显示任务时序
4. **构建真实项目**：从零实现防抖、节流和其他模式

### 书籍推荐

- Kyle Simpson 的《你不知道的 JavaScript：异步与性能》
- David Flanagan 的《JavaScript 权威指南》（异步章节）
- Marijn Haverbeke 的《JavaScript 编程精解》（异步编程章节）

---

理解事件循环将使你从一个使用 JavaScript 的人转变为真正理解 JavaScript 如何工作的人。这些知识对于编写高性能应用程序、调试异步问题和通过技术面试都是无价的。继续练习复杂的示例，很快预测异步行为就会成为你的第二本能。
