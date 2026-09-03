---
title: JavaScript 事件循环
description: 深入理解 JavaScript 事件循环：调用栈、任务队列、宏任务与微任务
track: javascript
section: async
difficulty: intermediate
tags:
  - JavaScript
  - 事件循环
  - 宏任务
  - 微任务
status: imported
origin: old/src/content/docs/javascript/event-loop.zh.md
divergence: 0.284
issues: []
legacy:
  category: JavaScript
  subcategory: 异步编程
  order: 8
  lastUpdated: 2026-01-07
---

## 概述

JavaScript 是一门单线程语言,这意味着在任何给定时刻,只有一个任务在执行。事件循环(Event Loop)是 JavaScript 处理异步操作的核心机制,它协调着调用栈、任务队列和 Web APIs 之间的交互,确保代码按照正确的顺序执行。

理解事件循环对于编写高性能、无阻塞的 JavaScript 应用至关重要。

## 核心概念

### 调用栈 (Call Stack)

调用栈是一个 LIFO(后进先出)的数据结构,用于跟踪函数的执行上下文。当函数被调用时,会被推入栈中;当函数执行完毕后,会从栈中弹出。

```javascript
function first() {
  console.log('第一个函数');
  second();
  console.log('第一个函数结束');
}

function second() {
  console.log('第二个函数');
  third();
  console.log('第二个函数结束');
}

function third() {
  console.log('第三个函数');
}

first();

// 输出:
// 第一个函数
// 第二个函数
// 第三个函数
// 第二个函数结束
// 第一个函数结束
```

**调用栈的执行过程:**

1. `first()` 被推入栈
2. 执行 `console.log('第一个函数')`
3. `second()` 被推入栈
4. 执行 `console.log('第二个函数')`
5. `third()` 被推入栈
6. 执行 `console.log('第三个函数')`
7. `third()` 从栈中弹出
8. 继续执行 `second()` 的剩余部分
9. `second()` 从栈中弹出
10. 继续执行 `first()` 的剩余部分
11. `first()` 从栈中弹出

### Web APIs

浏览器提供的 Web APIs(如 `setTimeout`、`fetch`、DOM 事件等)在主线程之外处理异步操作。当调用这些 API 时,它们会在后台执行,完成后将回调函数放入任务队列。

```javascript
console.log('开始');

setTimeout(() => {
  console.log('setTimeout 回调');
}, 0);

console.log('结束');

// 输出:
// 开始
// 结束
// setTimeout 回调
```

尽管 `setTimeout` 的延迟设为 0,回调函数仍然会在同步代码执行完成后才执行。

### 任务队列 (Task Queue)

任务队列用于存储待执行的回调函数。事件循环会不断检查调用栈是否为空,如果为空,就会从任务队列中取出任务并执行。

## 宏任务与微任务

JavaScript 中的异步任务分为两种类型:宏任务(Macro Task)和微任务(Micro Task)。它们的执行优先级不同。

### 宏任务 (Macro Task)

宏任务包括:

- `setTimeout`
- `setInterval`
- `setImmediate` (Node.js)
- I/O 操作
- UI 渲染
- `MessageChannel`
- `requestAnimationFrame` (严格来说不是宏任务,但在微任务之后执行)

### 微任务 (Micro Task)

微任务包括:

- `Promise.then/catch/finally`
- `MutationObserver`
- `queueMicrotask`
- `process.nextTick` (Node.js,优先级高于其他微任务)

### 执行顺序

事件循环的执行顺序如下:

1. 执行同步代码(调用栈中的任务)
2. 执行所有微任务队列中的任务
3. 执行一个宏任务
4. 再次执行所有微任务
5. 重复步骤 3-4

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
}).then(() => {
  console.log('5');
});

setTimeout(() => {
  console.log('6');
}, 0);

console.log('7');

// 输出:
// 1
// 7
// 4
// 5
// 2
// 3
// 6
```

**执行过程分析:**

1. 执行同步代码:`console.log('1')` 和 `console.log('7')`
2. 执行所有微任务:`console.log('4')` 和 `console.log('5')`
3. 执行第一个宏任务:`console.log('2')`,并产生新的微任务
4. 执行新的微任务:`console.log('3')`
5. 执行第二个宏任务:`console.log('6')`

### 复杂示例

```javascript
console.log('脚本开始');

setTimeout(() => {
  console.log('setTimeout 1');
  Promise.resolve().then(() => {
    console.log('Promise 1 in setTimeout 1');
  });
}, 0);

Promise.resolve()
  .then(() => {
    console.log('Promise 2');
    setTimeout(() => {
      console.log('setTimeout 2 in Promise 2');
    }, 0);
  })
  .then(() => {
    console.log('Promise 3');
  });

setTimeout(() => {
  console.log('setTimeout 3');
  Promise.resolve().then(() => {
    console.log('Promise 4 in setTimeout 3');
  });
}, 0);

console.log('脚本结束');

// 输出:
// 脚本开始
// 脚本结束
// Promise 2
// Promise 3
// setTimeout 1
// Promise 1 in setTimeout 1
// setTimeout 3
// Promise 4 in setTimeout 3
// setTimeout 2 in Promise 2
```

## queueMicrotask

`queueMicrotask` 是一个用于直接向微任务队列添加任务的 API,它比 `Promise.resolve().then()` 更加明确和高效。

```javascript
console.log('开始');

queueMicrotask(() => {
  console.log('微任务 1');
});

Promise.resolve().then(() => {
  console.log('Promise 微任务');
});

queueMicrotask(() => {
  console.log('微任务 2');
});

console.log('结束');

// 输出:
// 开始
// 结束
// 微任务 1
// Promise 微任务
// 微任务 2
```

### 使用场景

`queueMicrotask` 适用于需要在当前同步代码执行完毕后、但在任何宏任务之前执行的操作:

```javascript
function processData(data) {
  // 同步验证
  if (!data) {
    throw new Error('数据无效');
  }

  // 异步处理,但优先级高于宏任务
  queueMicrotask(() => {
    console.log('处理数据:', data);
    // 执行一些清理或后续操作
  });

  return data;
}

const result = processData({ id: 1, name: '测试' });
console.log('返回结果:', result);

// 输出:
// 返回结果: { id: 1, name: '测试' }
// 处理数据: { id: 1, name: '测试' }
```

## requestAnimationFrame

`requestAnimationFrame` (rAF) 是浏览器提供的用于执行动画的 API。它在浏览器下一次重绘之前执行,通常以每秒 60 帧的速率运行。

### 执行时机

`requestAnimationFrame` 的执行时机在微任务之后、浏览器渲染之前:

```javascript
console.log('1');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise');
});

requestAnimationFrame(() => {
  console.log('rAF');
});

console.log('2');

// 输出:
// 1
// 2
// Promise
// rAF
// setTimeout
```

**注意:** 实际执行顺序可能因浏览器实现而略有不同,但通常 rAF 在微任务之后执行。

### 使用示例

```javascript
let count = 0;

function animate() {
  count++;
  console.log('帧:', count);

  if (count < 5) {
    requestAnimationFrame(animate);
  }
}

// 启动动画
requestAnimationFrame(animate);
```

### 与 setTimeout 的区别

```javascript
// 使用 setTimeout (不精确,可能导致丢帧)
let frame = 0;
function animateWithTimeout() {
  frame++;
  console.log('setTimeout 帧:', frame);

  if (frame < 60) {
    setTimeout(animateWithTimeout, 16.67); // 约 60fps
  }
}

// 使用 requestAnimationFrame (更精确,与浏览器刷新率同步)
let rafFrame = 0;
function animateWithRAF() {
  rafFrame++;
  console.log('rAF 帧:', rafFrame);

  if (rafFrame < 60) {
    requestAnimationFrame(animateWithRAF);
  }
}

// requestAnimationFrame 的优势:
// 1. 自动与浏览器刷新率同步
// 2. 页面不可见时自动暂停,节省资源
// 3. 避免丢帧和过度渲染
```

### 实际应用场景

```javascript
function smoothScroll(element, target, duration) {
  const start = element.scrollTop;
  const distance = target - start;
  const startTime = performance.now();

  function animation(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 缓动函数
    const easeInOutQuad = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    element.scrollTop = start + distance * easeInOutQuad;

    if (progress < 1) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

// 使用示例
// smoothScroll(document.documentElement, 1000, 500);
```

## Node.js 事件循环差异

Node.js 的事件循环与浏览器有所不同,它使用 libuv 库实现,分为多个阶段。

### Node.js 事件循环的阶段

1. **timers (定时器阶段)**: 执行 `setTimeout` 和 `setInterval` 的回调
2. **pending callbacks**: 执行延迟到下一个循环迭代的 I/O 回调
3. **idle, prepare**: 仅内部使用
4. **poll (轮询阶段)**: 检索新的 I/O 事件,执行 I/O 回调
5. **check (检查阶段)**: 执行 `setImmediate` 回调
6. **close callbacks**: 执行关闭回调,如 `socket.on('close', ...)`

### process.nextTick

`process.nextTick` 的优先级高于所有其他微任务,会在当前阶段结束后立即执行:

```javascript
console.log('开始');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

setImmediate(() => {
  console.log('setImmediate');
});

Promise.resolve().then(() => {
  console.log('Promise');
});

process.nextTick(() => {
  console.log('nextTick');
});

console.log('结束');

// Node.js 输出:
// 开始
// 结束
// nextTick
// Promise
// setTimeout
// setImmediate
```

### setImmediate vs setTimeout

在 Node.js 中,`setImmediate` 和 `setTimeout(fn, 0)` 的执行顺序取决于调用的上下文:

```javascript
// 在主模块中,顺序不确定
setTimeout(() => {
  console.log('setTimeout');
}, 0);

setImmediate(() => {
  console.log('setImmediate');
});

// 在 I/O 循环中,setImmediate 总是先执行
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('setTimeout in I/O');
  }, 0);

  setImmediate(() => {
    console.log('setImmediate in I/O');
  });
});

// 输出:
// setImmediate in I/O
// setTimeout in I/O
```

### Node.js 完整示例

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
  process.nextTick(() => {
    console.log('3');
  });
  Promise.resolve().then(() => {
    console.log('4');
  });
}, 0);

setImmediate(() => {
  console.log('5');
  process.nextTick(() => {
    console.log('6');
  });
  Promise.resolve().then(() => {
    console.log('7');
  });
});

process.nextTick(() => {
  console.log('8');
});

Promise.resolve().then(() => {
  console.log('9');
});

console.log('10');

// 输出:
// 1
// 10
// 8
// 9
// 2
// 5
// 3
// 6
// 4
// 7
```

## 实践建议

### 避免阻塞事件循环

```javascript
// ❌ 不好的做法 - 阻塞事件循环
function heavyComputation() {
  let result = 0;
  for (let i = 0; i < 1e9; i++) {
    result += i;
  }
  return result;
}

// ✅ 好的做法 - 分块处理
function heavyComputationAsync(callback) {
  let result = 0;
  let i = 0;
  const chunkSize = 1e6;

  function processChunk() {
    const end = Math.min(i + chunkSize, 1e9);

    for (; i < end; i++) {
      result += i;
    }

    if (i < 1e9) {
      setTimeout(processChunk, 0);
    } else {
      callback(result);
    }
  }

  processChunk();
}
```

### 合理使用微任务

```javascript
// ❌ 不好的做法 - 创建无限微任务循环
function badMicrotask() {
  Promise.resolve().then(() => {
    console.log('微任务');
    badMicrotask(); // 永远不会执行宏任务
  });
}

// ✅ 好的做法 - 使用宏任务给予浏览器渲染机会
function goodAsyncTask(count = 0) {
  console.log('任务', count);

  if (count < 100) {
    setTimeout(() => goodAsyncTask(count + 1), 0);
  }
}
```

### Promise 错误处理

```javascript
// 确保 Promise 链中的错误被捕获
Promise.resolve()
  .then(() => {
    throw new Error('错误');
  })
  .catch((error) => {
    console.error('捕获错误:', error.message);
  });

// 使用 async/await
async function handleAsync() {
  try {
    const result = await fetchData();
    return result;
  } catch (error) {
    console.error('错误:', error);
  }
}
```

### 性能优化

```javascript
// 批量处理 DOM 更新
function batchDOMUpdates(items) {
  requestAnimationFrame(() => {
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
      const div = document.createElement('div');
      div.textContent = item;
      fragment.appendChild(div);
    });

    document.body.appendChild(fragment);
  });
}

// 使用微任务进行状态更新
class StateManager {
  constructor() {
    this.state = {};
    this.listeners = [];
    this.updateScheduled = false;
  }

  setState(newState) {
    Object.assign(this.state, newState);

    if (!this.updateScheduled) {
      this.updateScheduled = true;
      queueMicrotask(() => {
        this.notifyListeners();
        this.updateScheduled = false;
      });
    }
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

## 总结

JavaScript 事件循环是理解异步编程的关键:

1. **调用栈**负责同步代码的执行
2. **微任务**在每个宏任务之后、下一个宏任务之前执行
3. **宏任务**包括 setTimeout、setInterval 等
4. **requestAnimationFrame** 用于动画,在浏览器渲染前执行
5. **Node.js** 有独特的事件循环机制和 `process.nextTick`

掌握事件循环机制,能够帮助你:
- 编写更高效的异步代码
- 避免性能问题
- 更好地理解代码执行顺序
- 优化用户体验

通过合理使用宏任务、微任务和 requestAnimationFrame,可以构建流畅、响应迅速的 JavaScript 应用。
