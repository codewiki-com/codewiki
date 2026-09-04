---
title: JavaScript Event Loop
description: "Deep dive into JavaScript event loop: call stack, task queue, macro and micro tasks"
track: javascript
section: async
difficulty: intermediate
tags:
  - JavaScript
  - Event Loop
  - Macrotasks
  - Microtasks
status: imported
origin: old/src/content/docs/javascript/event-loop.en.md
divergence: 0.284
issues: []
legacy:
  category: JavaScript
  subcategory: Async Programming
  order: 8
  lastUpdated: 2026-01-07
---

The event loop is the fundamental mechanism that allows JavaScript to perform non-blocking operations despite being single-threaded. Understanding how the event loop works is crucial for writing efficient asynchronous code and avoiding common pitfalls.

## The Call Stack

The call stack is a LIFO (Last In, First Out) data structure that tracks function execution. When a function is called, it's pushed onto the stack. When it returns, it's popped off.

```javascript
function first() {
  console.log('First function');
  second();
  console.log('First function end');
}

function second() {
  console.log('Second function');
  third();
  console.log('Second function end');
}

function third() {
  console.log('Third function');
}

first();

// Output:
// First function
// Second function
// Third function
// Second function end
// First function end
```

**Call Stack Execution:**

1. `first()` is pushed onto the stack
2. `console.log('First function')` executes
3. `second()` is pushed onto the stack
4. `console.log('Second function')` executes
5. `third()` is pushed onto the stack
6. `console.log('Third function')` executes
7. `third()` completes and is popped
8. `console.log('Second function end')` executes
9. `second()` completes and is popped
10. `console.log('First function end')` executes
11. `first()` completes and is popped

### Stack Overflow

If the call stack exceeds its limit, you get a stack overflow error:

```javascript
function recursiveFunction() {
  recursiveFunction(); // No base case!
}

recursiveFunction(); // RangeError: Maximum call stack size exceeded
```

## Task Queues

JavaScript uses multiple queues to manage asynchronous operations. When asynchronous operations complete, their callbacks are placed in these queues, waiting for the call stack to be empty.

### How It Works

```javascript
console.log('Start');

setTimeout(() => {
  console.log('Timeout');
}, 0);

console.log('End');

// Output:
// Start
// End
// Timeout
```

Even with a `0ms` delay, `setTimeout` doesn't execute immediately. The callback is queued and waits for the call stack to clear.

## Macrotasks vs Microtasks

JavaScript distinguishes between two types of tasks in the event loop:

### Macrotasks (Tasks)

Macrotasks include:
- `setTimeout`
- `setInterval`
- `setImmediate` (Node.js)
- I/O operations
- UI rendering
- `MessageChannel`

### Microtasks (Jobs)

Microtasks include:
- `Promise.then()`, `Promise.catch()`, `Promise.finally()`
- `async/await`
- `queueMicrotask()`
- `MutationObserver`
- `process.nextTick()` (Node.js - technically has its own queue)

### Priority Example

```javascript
console.log('1: Sync code');

setTimeout(() => {
  console.log('2: Macrotask (setTimeout)');
}, 0);

Promise.resolve().then(() => {
  console.log('3: Microtask (Promise)');
});

console.log('4: Sync code');

// Output:
// 1: Sync code
// 4: Sync code
// 3: Microtask (Promise)
// 2: Macrotask (setTimeout)
```

**Why this order?**
1. All synchronous code executes first (call stack)
2. Microtasks are processed before the next macrotask
3. Macrotasks execute one at a time

## Event Loop Execution Order

The event loop follows a specific sequence:

1. **Execute synchronous code** on the call stack
2. **Process all microtasks** (microtask queue)
3. **Execute one macrotask** (task queue)
4. **Process all microtasks again** (created during macrotask)
5. **Render updates** (if needed)
6. **Repeat from step 3**

### Complex Example

```javascript
console.log('Script start');

setTimeout(() => {
  console.log('setTimeout 1');
  Promise.resolve().then(() => {
    console.log('Promise inside setTimeout 1');
  });
}, 0);

Promise.resolve()
  .then(() => {
    console.log('Promise 1');
  })
  .then(() => {
    console.log('Promise 2');
  });

setTimeout(() => {
  console.log('setTimeout 2');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise 3');
});

console.log('Script end');

// Output:
// Script start
// Script end
// Promise 1
// Promise 3
// Promise 2
// setTimeout 1
// Promise inside setTimeout 1
// setTimeout 2
```

### Execution Breakdown

**Phase 1: Synchronous Code**
- `console.log('Script start')` executes
- `setTimeout 1` is scheduled (macrotask queue)
- `Promise 1` chain starts (microtask queue)
- `setTimeout 2` is scheduled (macrotask queue)
- `Promise 3` is scheduled (microtask queue)
- `console.log('Script end')` executes

**Phase 2: Microtask Queue**
- `Promise 1` executes → logs "Promise 1"
- `Promise 3` executes → logs "Promise 3"
- `Promise 2` executes → logs "Promise 2" (chained from Promise 1)

**Phase 3: First Macrotask**
- `setTimeout 1` executes → logs "setTimeout 1"
- New microtask added: "Promise inside setTimeout 1"

**Phase 4: Microtask Queue (again)**
- `Promise inside setTimeout 1` executes

**Phase 5: Second Macrotask**
- `setTimeout 2` executes → logs "setTimeout 2"

## requestAnimationFrame

`requestAnimationFrame` (rAF) is a special API for animations. It runs before the browser paints, typically at 60fps (once every ~16.67ms).

```javascript
console.log('Start');

requestAnimationFrame(() => {
  console.log('rAF 1');
});

Promise.resolve().then(() => {
  console.log('Promise 1');
});

setTimeout(() => {
  console.log('setTimeout');
}, 0);

requestAnimationFrame(() => {
  console.log('rAF 2');
});

console.log('End');

// Output:
// Start
// End
// Promise 1
// rAF 1
// rAF 2
// setTimeout (may vary based on timing)
```

### Position in Event Loop

The execution order is:
1. Synchronous code
2. Microtasks
3. **requestAnimationFrame callbacks** (before paint)
4. Browser paint/render
5. Macrotasks

### Practical Use Case

```javascript
// Smooth animation example
let start = null;
const element = document.getElementById('box');

function animate(timestamp) {
  if (!start) start = timestamp;
  const progress = timestamp - start;

  element.style.transform = `translateX(${Math.min(progress / 10, 200)}px)`;

  if (progress < 2000) {
    requestAnimationFrame(animate);
  }
}

requestAnimationFrame(animate);
```

### Why not setTimeout for animations?

```javascript
// Bad: Inconsistent timing, may not sync with display refresh
function animateWithTimeout() {
  element.style.left = `${position}px`;
  position += 1;
  setTimeout(animateWithTimeout, 16); // Trying to approximate 60fps
}

// Good: Syncs with browser refresh rate
function animateWithRAF() {
  element.style.left = `${position}px`;
  position += 1;
  requestAnimationFrame(animateWithRAF);
}
```

## queueMicrotask

`queueMicrotask()` provides direct access to the microtask queue without creating a Promise.

```javascript
console.log('Start');

queueMicrotask(() => {
  console.log('Microtask 1');
});

Promise.resolve().then(() => {
  console.log('Promise');
});

queueMicrotask(() => {
  console.log('Microtask 2');
});

console.log('End');

// Output:
// Start
// End
// Microtask 1
// Promise
// Microtask 2
```

### When to Use queueMicrotask

**Use Case 1: Batching Operations**

```javascript
const updates = [];

function scheduleUpdate(data) {
  updates.push(data);

  if (updates.length === 1) {
    queueMicrotask(() => {
      // Batch all updates together
      processUpdates(updates);
      updates.length = 0;
    });
  }
}

function processUpdates(batch) {
  console.log('Processing batch:', batch);
}

scheduleUpdate('A');
scheduleUpdate('B');
scheduleUpdate('C');

// Output: Processing batch: ['A', 'B', 'C']
```

**Use Case 2: Ensuring Consistent Timing**

```javascript
class EventEmitter {
  constructor() {
    this.listeners = [];
  }

  on(callback) {
    this.listeners.push(callback);
  }

  emit(data) {
    // Ensure listeners are called asynchronously
    queueMicrotask(() => {
      this.listeners.forEach(listener => listener(data));
    });
  }
}

const emitter = new EventEmitter();

emitter.on(data => console.log('Listener:', data));
console.log('Before emit');
emitter.emit('Hello');
console.log('After emit');

// Output:
// Before emit
// After emit
// Listener: Hello
```

### queueMicrotask vs Promise.resolve()

```javascript
// Using Promise.resolve()
Promise.resolve().then(() => {
  console.log('Promise microtask');
});

// Using queueMicrotask
queueMicrotask(() => {
  console.log('queueMicrotask');
});

// Both create microtasks, but queueMicrotask is:
// 1. More explicit in intent
// 2. Slightly more efficient (no Promise overhead)
// 3. Better for batching scenarios
```

## Node.js Event Loop

The Node.js event loop is more complex than the browser's, with multiple phases:

### Event Loop Phases

1. **Timers**: Executes `setTimeout` and `setInterval` callbacks
2. **Pending callbacks**: Executes I/O callbacks deferred to the next loop iteration
3. **Idle, prepare**: Internal use only
4. **Poll**: Retrieves new I/O events; executes I/O related callbacks
5. **Check**: Executes `setImmediate` callbacks
6. **Close callbacks**: Executes close event callbacks (e.g., `socket.on('close', ...)`)

### Node.js Microtask Queues

Node.js has two types of microtasks:
- **process.nextTick queue**: Highest priority
- **Promise/queueMicrotask queue**: Second priority

```javascript
console.log('Start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

setImmediate(() => {
  console.log('setImmediate');
});

process.nextTick(() => {
  console.log('nextTick 1');
});

Promise.resolve().then(() => {
  console.log('Promise 1');
});

process.nextTick(() => {
  console.log('nextTick 2');
});

console.log('End');

// Output (Node.js):
// Start
// End
// nextTick 1
// nextTick 2
// Promise 1
// setTimeout
// setImmediate
```

### setTimeout vs setImmediate

The order can vary depending on context:

```javascript
// Outside I/O cycle - order not guaranteed
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));

// Inside I/O cycle - setImmediate always first
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => console.log('setTimeout'), 0);
  setImmediate(() => console.log('setImmediate'));

  // Output:
  // setImmediate
  // setTimeout
});
```

### process.nextTick Gotcha

```javascript
// Dangerous: Can starve the event loop
function recursiveNextTick() {
  process.nextTick(recursiveNextTick);
}

recursiveNextTick();
// I/O operations will never execute!

// Better: Use setImmediate for recursive operations
function recursiveImmediate() {
  setImmediate(recursiveImmediate);
}

recursiveImmediate();
// I/O operations can still execute between calls
```

### Node.js vs Browser Differences

```javascript
// Browser behavior
setTimeout(() => {
  console.log('timeout1');
  Promise.resolve().then(() => console.log('promise1'));
}, 0);

setTimeout(() => {
  console.log('timeout2');
  Promise.resolve().then(() => console.log('promise2'));
}, 0);

// Browser Output:
// timeout1
// promise1
// timeout2
// promise2

// Node.js (older versions) Output:
// timeout1
// timeout2
// promise1
// promise2

// Node.js 11+ aligns with browser behavior
```

## Common Patterns and Pitfalls

### Pitfall 1: Mixing Sync and Async

```javascript
// Bad: Inconsistent behavior
function getData(useCache) {
  if (useCache) {
    return cachedData; // Synchronous
  } else {
    return fetch('/api/data'); // Asynchronous (returns Promise)
  }
}

// Good: Always asynchronous
async function getData(useCache) {
  if (useCache) {
    return cachedData;
  } else {
    return await fetch('/api/data');
  }
}
```

### Pitfall 2: Long-running Microtasks

```javascript
// Bad: Blocks rendering
Promise.resolve().then(() => {
  for (let i = 0; i < 1000000000; i++) {
    // Heavy computation
  }
  console.log('Done');
});

// Good: Break into chunks
function processChunk(remaining) {
  const chunk = remaining.splice(0, 1000);

  // Process chunk...

  if (remaining.length > 0) {
    setTimeout(() => processChunk(remaining), 0);
  }
}

processChunk(largeArray);
```

### Pattern 1: Debouncing with Microtasks

```javascript
function debounce(fn, delay) {
  let timeoutId;
  let microtaskPending = false;

  return function(...args) {
    clearTimeout(timeoutId);

    if (!microtaskPending) {
      microtaskPending = true;
      queueMicrotask(() => {
        microtaskPending = false;
      });
    }

    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const debouncedSearch = debounce((query) => {
  console.log('Searching for:', query);
}, 300);
```

### Pattern 2: Task Scheduling

```javascript
class TaskScheduler {
  constructor() {
    this.tasks = [];
    this.processing = false;
  }

  addTask(task) {
    this.tasks.push(task);
    this.schedule();
  }

  schedule() {
    if (this.processing) return;

    this.processing = true;
    queueMicrotask(() => this.processTasks());
  }

  processTasks() {
    while (this.tasks.length > 0) {
      const task = this.tasks.shift();
      task();
    }
    this.processing = false;
  }
}

const scheduler = new TaskScheduler();
scheduler.addTask(() => console.log('Task 1'));
scheduler.addTask(() => console.log('Task 2'));
scheduler.addTask(() => console.log('Task 3'));
```

### Pattern 3: Cooperative Multitasking

```javascript
function* longRunningTask() {
  for (let i = 0; i < 10000; i++) {
    // Do work
    if (i % 100 === 0) {
      yield; // Yield control
    }
  }
}

async function runCooperatively(generator) {
  const gen = generator();

  function step() {
    const result = gen.next();
    if (!result.done) {
      requestIdleCallback(step); // Or setTimeout(step, 0)
    }
  }

  step();
}

runCooperatively(longRunningTask);
```

### Pattern 4: Priority Queue

```javascript
class PriorityTaskQueue {
  constructor() {
    this.highPriority = [];
    this.lowPriority = [];
  }

  addTask(task, priority = 'low') {
    if (priority === 'high') {
      this.highPriority.push(task);
      queueMicrotask(() => this.processHigh());
    } else {
      this.lowPriority.push(task);
      setTimeout(() => this.processLow(), 0);
    }
  }

  processHigh() {
    while (this.highPriority.length > 0) {
      const task = this.highPriority.shift();
      task();
    }
  }

  processLow() {
    if (this.lowPriority.length > 0) {
      const task = this.lowPriority.shift();
      task();
    }
  }
}

const queue = new PriorityTaskQueue();
queue.addTask(() => console.log('Low priority'), 'low');
queue.addTask(() => console.log('High priority'), 'high');
```

## Summary

### Key Takeaways

1. **JavaScript is single-threaded** but can handle async operations via the event loop
2. **Call stack** executes synchronous code in LIFO order
3. **Microtasks** (Promises, queueMicrotask) have higher priority than macrotasks
4. **Macrotasks** (setTimeout, setInterval) execute one at a time
5. **requestAnimationFrame** runs before paint, ideal for animations
6. **Node.js event loop** has multiple phases and `process.nextTick` has highest priority
7. Always keep the event loop responsive by breaking up long-running tasks

### Best Practices

- ✅ Use `async/await` for cleaner asynchronous code
- ✅ Use `requestAnimationFrame` for animations
- ✅ Use `queueMicrotask` for batching operations
- ✅ Break long-running operations into chunks
- ✅ Understand microtask vs macrotask timing
- ❌ Avoid blocking the event loop with heavy synchronous operations
- ❌ Don't use recursive `process.nextTick` in Node.js
- ❌ Don't rely on setTimeout(fn, 0) for precise timing

Understanding the event loop is essential for writing performant JavaScript applications and debugging timing-related issues. Master these concepts, and you'll write better asynchronous code.
