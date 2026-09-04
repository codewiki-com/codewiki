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
origin: old/src/content/docs/frontend/js-event-loop.en.md
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

The event loop is the heart of JavaScript's asynchronous programming model. Understanding how it works is essential for writing efficient, bug-free code and is a common topic in technical interviews. This comprehensive guide will take you from the fundamentals to advanced concepts, equipping you with the knowledge to master JavaScript concurrency.

## JavaScript's Single-Threaded Nature

### Why Single-Threaded?

JavaScript was designed as a single-threaded language, meaning it can only execute one piece of code at a time. This design decision was made for good reasons:

1. **Simplicity**: Single-threaded execution eliminates complex synchronization issues like race conditions and deadlocks that plague multi-threaded programming.

2. **DOM Safety**: JavaScript was originally created to manipulate the DOM in browsers. If multiple threads could modify the DOM simultaneously, it would lead to unpredictable behavior and conflicts.

3. **Easier Debugging**: With only one execution thread, the flow of code is more predictable and easier to trace.

```javascript
// JavaScript executes code sequentially in a single thread
console.log('First');
console.log('Second');
console.log('Third');

// Output (always in this order):
// First
// Second
// Third
```

### The Problem with Single-Threaded Execution

While single-threading simplifies many things, it creates a significant challenge: **blocking operations**. If JavaScript had to wait for every slow operation (network requests, file I/O, timers) to complete before moving on, the entire application would freeze.

```javascript
// Hypothetical synchronous network request (would block everything)
const data = fetchDataSync('https://api.example.com/data'); // Browser freezes here
console.log(data); // User can't interact until this completes
```

This is where the event loop comes to the rescue, enabling non-blocking asynchronous operations within a single-threaded environment.

## Call Stack and Heap

### The Call Stack

The call stack is a LIFO (Last In, First Out) data structure that tracks the execution of functions. When a function is called, it's pushed onto the stack. When the function returns, it's popped off the stack.

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

The call stack evolves as follows:

```
Step 1: [printSquare]
Step 2: [printSquare, square]
Step 3: [printSquare, square, multiply]
Step 4: [printSquare, square]           // multiply returns
Step 5: [printSquare]                   // square returns
Step 6: [printSquare, console.log]
Step 7: [printSquare]                   // console.log returns
Step 8: []                              // printSquare returns
```

### Stack Overflow

When too many functions are pushed onto the stack (usually due to infinite recursion), you get a stack overflow error:

```javascript
function recurseForever() {
  recurseForever(); // Infinite recursion
}

recurseForever();
// Error: Maximum call stack size exceeded
```

### The Heap

The heap is a large, unstructured region of memory where objects are stored. When you create an object, array, or function, memory is allocated from the heap.

```javascript
// These are stored in the heap
const user = { name: 'Alice', age: 30 };
const numbers = [1, 2, 3, 4, 5];
const greet = function() { console.log('Hello'); };
```

The call stack contains references (pointers) to objects in the heap, not the objects themselves. This is why modifying an object through different references affects the same underlying data.

## Event Loop Mechanism

### What is the Event Loop?

The event loop is a continuously running process that monitors the call stack and task queues. Its primary job is to check if the call stack is empty and, if so, push the first available task from the queue onto the stack for execution.

### How the Event Loop Works

Here's a simplified view of the event loop cycle:

```
   +-----------------------+
   |      Call Stack       |
   |   (Execute sync code) |
   +-----------+-----------+
               |
               v
   +-----------+-----------+
   |  Is Call Stack Empty? |
   +-----+-----+-----+-----+
         |           |
        Yes          No (wait)
         |           |
         v           |
   +-----+-----+     |
   |  Execute  |     |
   |  All      |     |
   | Microtasks|     |
   +-----+-----+     |
         |           |
         v           |
   +-----+-----+     |
   |  Render   |     |
   | (if needed)|    |
   +-----+-----+     |
         |           |
         v           |
   +-----+-----+     |
   |  Execute  |     |
   |  One      |     |
   | Macrotask +-----+
   +-----------+
```

### The Complete Picture

The event loop coordinates several components:

1. **Call Stack**: Executes synchronous code
2. **Web APIs**: Browser-provided APIs (setTimeout, fetch, DOM events) that handle async operations
3. **Callback Queue (Task Queue)**: Holds callbacks from completed async operations
4. **Microtask Queue**: Holds microtasks (Promise callbacks, queueMicrotask)
5. **Event Loop**: Orchestrates everything

```javascript
console.log('Start');

setTimeout(() => {
  console.log('Timeout callback');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise callback');
});

console.log('End');

// Output:
// Start
// End
// Promise callback
// Timeout callback
```

## Task Queue and Microtask Queue

### Macrotasks (Task Queue)

Macrotasks are scheduled for execution in the next event loop iteration. Common macrotasks include:

| Macrotask Type | Description |
|----------------|-------------|
| `script` (initial execution) | The main script being executed |
| `setTimeout` | Timer callbacks |
| `setInterval` | Interval timer callbacks |
| `setImmediate` | Node.js specific |
| `I/O operations` | Network requests, file operations |
| `UI rendering` | Browser painting |
| `MessageChannel` | Message channel callbacks |

```javascript
console.log('Script start');

setTimeout(() => {
  console.log('setTimeout 1');
}, 0);

setTimeout(() => {
  console.log('setTimeout 2');
}, 0);

console.log('Script end');

// Output:
// Script start
// Script end
// setTimeout 1
// setTimeout 2
```

### Microtasks (Microtask Queue)

Microtasks have higher priority than macrotasks. After each macrotask (or after the initial script), ALL microtasks are executed before the next macrotask.

| Microtask Type | Description |
|----------------|-------------|
| `Promise.then/catch/finally` | Promise callbacks |
| `queueMicrotask` | Explicitly queued microtasks |
| `MutationObserver` | DOM mutation callbacks |
| `process.nextTick` | Node.js specific (highest priority) |

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

// Output:
// Script start
// Script end
// Promise 1
// queueMicrotask
// Promise 2
// setTimeout
```

### Key Difference: Execution Order

The critical difference is **when** they execute:

- **Microtasks**: Execute immediately after the current task completes, before any rendering or next macrotask
- **Macrotasks**: Execute one at a time, with microtask queue clearing between each

```javascript
// Complex example showing the interaction
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

// Output:
// Sync code
// Promise 1
// Nested microtask
// Promise 2
// Timeout 1
// Promise inside Timeout 1
// Timeout 2
```

## setTimeout and setInterval Behavior

### setTimeout Misconceptions

`setTimeout(fn, delay)` does NOT guarantee execution after exactly `delay` milliseconds. It schedules the callback to be added to the task queue after at least `delay` milliseconds.

```javascript
console.log('Start');

setTimeout(() => {
  console.log('Timeout executed');
}, 1000);

// Heavy computation that takes 2 seconds
const start = Date.now();
while (Date.now() - start < 2000) {
  // Blocking loop
}

console.log('End');

// Output:
// Start
// (2 second pause)
// End
// Timeout executed (appears immediately after "End", not 1 second later)
```

### Minimum Delay

Browsers enforce a minimum delay for nested setTimeout calls (typically 4ms after 5 levels of nesting):

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
// Possible output: [1, 1, 1, 1, 4, 9, 14, 19, 24, 29]
```

### setInterval Considerations

`setInterval` schedules repeated execution, but callbacks can stack up if execution takes longer than the interval:

```javascript
// Problem: Callbacks can overlap
setInterval(() => {
  // If this takes > 100ms, callbacks will queue up
  heavyOperation();
}, 100);

// Better: Use recursive setTimeout for guaranteed gaps
function betterInterval() {
  heavyOperation();
  setTimeout(betterInterval, 100);
}
setTimeout(betterInterval, 100);
```

### Zero Delay Pattern

`setTimeout(fn, 0)` is useful for deferring execution until the current call stack is clear:

```javascript
function processData(data) {
  console.log('Processing started');

  // Defer heavy work to allow UI to update
  setTimeout(() => {
    console.log('Heavy processing');
    // ... process data
  }, 0);

  console.log('Processing scheduled');
}

processData([1, 2, 3]);
// Output:
// Processing started
// Processing scheduled
// Heavy processing
```

## Promise and async/await Execution Order

### Promise Execution Basics

Understanding Promise execution is crucial for predicting code behavior:

```javascript
console.log('1');

const promise = new Promise((resolve) => {
  console.log('2'); // Executor runs synchronously!
  resolve();
  console.log('3'); // Still runs, resolve doesn't exit
});

promise.then(() => {
  console.log('4'); // Microtask
});

console.log('5');

// Output: 1, 2, 3, 5, 4
```

Key insight: The Promise executor function runs **synchronously**. Only `.then()`, `.catch()`, and `.finally()` callbacks are scheduled as microtasks.

### Chained Promises

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

// Output: then 1, then 3, then 2, then 4
```

Note: When a `.then()` returns a Promise, it requires additional microtask ticks to unwrap.

### async/await Under the Hood

`async/await` is syntactic sugar over Promises. An `await` expression pauses the async function and schedules the rest as a microtask:

```javascript
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end'); // This becomes a microtask
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

// Output:
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout
```

### Complex async/await Example

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

// Output:
// start
// foo start
// bar start
// end
// bar end
// foo end
```

## requestAnimationFrame

### What is requestAnimationFrame?

`requestAnimationFrame` (rAF) is a browser API designed for smooth animations. It schedules a callback to run before the next repaint, typically at 60fps (every ~16.7ms).

```javascript
function animate() {
  // Update animation state
  element.style.left = (parseFloat(element.style.left) || 0) + 1 + 'px';

  // Schedule next frame
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

### rAF vs setTimeout for Animations

```javascript
// Bad: setTimeout-based animation
function animateWithTimeout() {
  element.style.left = (parseFloat(element.style.left) || 0) + 1 + 'px';
  setTimeout(animateWithTimeout, 16); // Approximate 60fps
}

// Good: requestAnimationFrame-based animation
function animateWithRAF() {
  element.style.left = (parseFloat(element.style.left) || 0) + 1 + 'px';
  requestAnimationFrame(animateWithRAF);
}
```

Benefits of requestAnimationFrame:
- Synchronized with browser repaint cycle
- Pauses when tab is inactive (saves battery)
- Provides timestamp for precise animations
- Smoother animations with no frame drops

### Where rAF Fits in the Event Loop

requestAnimationFrame callbacks run:
1. After all microtasks are processed
2. Before the browser paints
3. But NOT in the task queue

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

// Typical output:
// Start
// End
// Promise
// rAF (runs before paint)
// setTimeout
```

### Using rAF for DOM Measurements

```javascript
// Read DOM, then write in next frame to avoid layout thrashing
function optimizedDOMOperation() {
  const height = element.offsetHeight; // Read

  requestAnimationFrame(() => {
    element.style.height = height * 2 + 'px'; // Write
  });
}
```

## Web Workers

### Breaking Free from Single-Threaded Limitations

While the main JavaScript thread is single-threaded, Web Workers provide true parallelism by running scripts in background threads.

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

### Web Worker Limitations

Workers have their own event loop but cannot:
- Access the DOM
- Access the `window` object
- Use some Web APIs (alert, confirm, etc.)

### Types of Workers

1. **Dedicated Workers**: Owned by a single script
2. **Shared Workers**: Can be accessed by multiple scripts
3. **Service Workers**: Act as proxies between web apps and the network

```javascript
// Shared Worker example
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

### When to Use Web Workers

- Heavy computations (image processing, data parsing)
- Complex algorithms that would block the UI
- Background data synchronization
- Any CPU-intensive work

```javascript
// Example: Offloading Fibonacci calculation
// main.js
const worker = new Worker('fib-worker.js');

worker.postMessage(45); // Calculate fib(45)

worker.onmessage = (event) => {
  console.log('Result:', event.data);
};

// User can still interact with the page while computing

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

## Interview Key Points

### Classic Interview Question 1

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

// Answer: 1, 6, 4, 2, 3, 5
```

**Explanation:**
1. Sync: log '1', schedule setTimeout, schedule Promise.then, log '6'
2. Microtasks: log '4', schedule another setTimeout
3. Macrotask (first setTimeout): log '2', schedule Promise.then
4. Microtasks: log '3'
5. Macrotask (second setTimeout): log '5'

### Classic Interview Question 2

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

// Answer: script start, async1 start, async2, promise1,
//         script end, async1 end, promise2, setTimeout
```

### Key Concepts Summary

1. **Execution Order**: Synchronous code -> Microtasks -> Macrotasks

2. **Microtask Priority**: All microtasks execute before the next macrotask

3. **Promise Executor**: Runs synchronously; only callbacks are async

4. **async/await**: Sugar for Promises; await schedules a microtask

5. **setTimeout(fn, 0)**: Not immediate; minimum ~4ms in browsers

### Common Pitfalls

**Pitfall 1: Assuming setTimeout(fn, 0) is immediate**
```javascript
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
// promise always logs first!
```

**Pitfall 2: Forgetting Promise executor is synchronous**
```javascript
new Promise((resolve) => {
  console.log('sync'); // This runs immediately!
  resolve();
});
```

**Pitfall 3: Microtask starvation of macrotasks**
```javascript
function recursiveMicrotask() {
  Promise.resolve().then(recursiveMicrotask);
}
recursiveMicrotask();
// setTimeout callbacks will NEVER run!
```

### Interview Answer Template

When asked "How does the JavaScript event loop work?", structure your answer:

1. **Single-threaded**: JavaScript has one main thread for execution
2. **Call Stack**: Tracks function execution (LIFO)
3. **Web APIs**: Handle async operations outside the main thread
4. **Task Queues**: Macrotask queue and Microtask queue
5. **Event Loop**: Continuously checks if stack is empty, then processes microtasks, then one macrotask
6. **Priority**: Sync code > Microtasks > Macrotasks

## Further Reading

### Official Documentation

- [MDN: Concurrency model and Event Loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
- [HTML Living Standard: Event Loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [ECMAScript Specification: Jobs and Job Queues](https://tc39.es/ecma262/#sec-jobs)
- [Node.js: The Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)

### Essential Articles and Videos

- Jake Archibald: [Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) - Interactive visualization
- Philip Roberts: [What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ) - JSConf talk
- Lydia Hallie: [JavaScript Visualized: Event Loop](https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif)

### Related Concepts to Explore

- **Promises and Async Patterns**: Master Promise chaining, error handling, and async/await
- **Service Workers**: Understand background scripts and offline capabilities
- **requestIdleCallback**: Learn to schedule low-priority work during browser idle time
- **Performance API**: Measure and optimize your async code performance

### Practice Recommendations

1. **Use visualization tools**: Loupe (http://latentflip.com/loupe/) helps visualize the event loop
2. **Write prediction exercises**: Practice predicting output of complex async code
3. **Debug with Performance tab**: Chrome DevTools shows task timing
4. **Build real projects**: Implement debounce, throttle, and other patterns from scratch

### Books

- *You Don't Know JS: Async & Performance* by Kyle Simpson
- *JavaScript: The Definitive Guide* by David Flanagan (Chapter on Async)
- *Eloquent JavaScript* by Marijn Haverbeke (Async Programming chapter)

---

Understanding the event loop transforms you from someone who uses JavaScript to someone who truly understands how JavaScript works. This knowledge is invaluable for writing performant applications, debugging async issues, and acing technical interviews. Keep practicing with complex examples, and soon predicting async behavior will become second nature.
