---
title: JavaScript Memory Management and Garbage Collection
description: Comprehensive guide to memory management, garbage collection algorithms, and optimization techniques in JavaScript
track: javascript
section: core
difficulty: advanced
tags:
  - memory management
  - garbage collection
  - performance
  - memory leaks
  - V8 engine
status: imported
origin: old/src/content/docs/javascript/memory-management.en.md
divergence: 0.294
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 20
  lastUpdated: 2026-01-07
---

JavaScript abstracts away most memory management details from developers, but understanding how memory allocation, garbage collection (GC), and heap management work is crucial for writing performant applications. We'll cover the internals of JavaScript memory management, different garbage collection algorithms, common memory pitfalls, and optimization strategies for building efficient applications.

---

## Concept Explanation

### What is Memory Management?

Memory management in JavaScript involves allocating memory for variables, objects, and functions when they are created, and deallocating that memory when it's no longer needed. Unlike languages like C or C++, JavaScript developers don't manually manage memory—the JavaScript engine handles this automatically through garbage collection.

### Memory Hierarchy in JavaScript

JavaScript divides memory into three main areas:

**Stack**: Stores primitive values (numbers, booleans, strings, symbols, null, undefined) and references to objects. Stack memory is automatically freed when variables go out of scope.

**Heap**: Stores objects and arrays. Heap memory persists until no longer referenced by the application, at which point it becomes a candidate for garbage collection.

**Global Object**: Properties added to the global object (window in browsers, global in Node.js) persist for the lifetime of the program.

### Garbage Collection

Garbage collection is the process of automatically identifying and reclaiming memory occupied by objects that are no longer reachable by the program. Modern JavaScript engines use sophisticated algorithms to detect unreachable objects and free their memory, allowing developers to focus on application logic rather than memory management.

---

## Core Principles

### Reachability-based Garbage Collection

The fundamental principle behind modern garbage collection is **reachability**. An object is considered "reachable" if:

- It's referenced by a variable in scope
- It's referenced by another reachable object
- It's referenced by the global object

Objects that are unreachable (not referenced by any reachable object) are candidates for garbage collection.

### Reference Counting (Legacy Approach)

Early garbage collectors used reference counting: each object maintains a count of references pointing to it. When the count reaches zero, the memory is reclaimed.

**Limitation**: Reference counting cannot handle circular references (two objects referencing each other but unreachable from the root).

### Mark-and-Sweep Algorithm

Modern engines use mark-and-sweep:

1. **Mark Phase**: Starting from root objects (global scope, call stack), traverse all reachable objects and mark them
2. **Sweep Phase**: Iterate through all objects; if unmarked, reclaim their memory
3. **Compact Phase** (optional): Defragment heap by moving live objects together

This approach handles circular references and is the basis for V8 (Chrome/Node.js) and SpiderMonkey (Firefox).

### Generational Garbage Collection

Objects are segregated by age:

- **Young Generation**: Frequently collected; most objects die young
- **Old Generation**: Infrequently collected; objects that survived multiple GC cycles

Focusing collection effort on the young generation is more efficient, as most objects become unreachable quickly.

### Incremental and Concurrent Collection

Instead of stopping the entire program (stop-the-world pauses), modern engines:

- **Incremental GC**: Perform garbage collection in small incremental steps between program execution
- **Concurrent GC**: Run collection in parallel threads without blocking the main thread

---

## Key Points

### Memory Lifecycle

1. **Allocation**: Memory is allocated when variables are declared
2. **Using**: Memory is accessed and modified during variable usage
3. **Deallocation**: Memory is freed when objects become unreachable

### Stack vs. Heap Allocation

| Aspect | Stack | Heap |
|--------|-------|------|
| **Storage** | Primitive values and references | Objects and arrays |
| **Allocation** | Automatic and fast | Slower, managed by GC |
| **Deallocation** | Automatic when scope exits | Via garbage collection |
| **Size** | Limited, smaller | Larger, configurable |
| **Speed** | Very fast access | Slower due to indirection |

### Memory Leaks

A memory leak occurs when:
- Objects become unreachable but aren't freed (rare in modern JS with proper GC)
- Global references retain objects unnecessarily
- Event listeners aren't removed
- Timers aren't cleared
- Circular references (in older engines with reference counting)

### GC Pause Times

GC pauses are periods when the main thread stops to collect garbage. These pauses affect:

- **User-perceived latency**: Noticeable jank in animations or interactions
- **Frame rate**: Can cause frame drops in animations/games
- **Responsiveness**: Input lag during interactive sessions

Modern engines minimize pause times through:
- Generational collection
- Incremental marking
- Concurrent and parallel collection

### Heap Size Limits

JavaScript engines have heap size limits:

- **V8** (Node.js): ~1.4 GB on 64-bit systems by default
- **Browsers**: Vary by implementation, typically 1-2 GB
- **Can be configured** via engine flags

Exceeding heap limits causes out-of-memory errors.

---

## Code Examples

### Understanding Reachability

```javascript
// Example 1: Simple reachability
let user = { name: "Alice" };
let admin = user;
user = null;

// 'admin' still references the object, so it's reachable and NOT garbage collected
console.log(admin.name); // "Alice"

// Example 2: When an object becomes unreachable
function createUser() {
  let user = { name: "Bob", email: "bob@example.com" };
  return user.name; // Only the string is returned, not the object
}

let name = createUser();
// The user object is unreachable after function execution and eligible for GC
```

### Memory Allocation on Stack and Heap

```javascript
// Stack allocation (primitive values and references)
function stackExample() {
  let num = 42;           // Stack: primitive value
  let str = "hello";      // Stack: primitive value
  let ref = { x: 10 };    // Stack: reference; Heap: object

  // When stackExample ends, num, str, ref are removed from stack
  // The object on heap becomes unreachable if no other reference exists
}

// Heap allocation (objects)
let globalObj = {}; // Heap allocation, Stack: reference to globalObj

function heapExample() {
  let localObj = { name: "test" }; // Heap allocation
  globalObj.nested = localObj;      // localObj is now reachable via globalObj
} // localObj variable removed from stack, but object still reachable via globalObj
```

### Memory Leak Example: Accidental Globals

```javascript
// BAD: Creates unintended global reference (memory leak)
function badFunction() {
  email = "user@example.com"; // No 'let', 'const', or 'var' creates global variable
}
badFunction();
// 'email' persists globally until window is closed

// GOOD: Proper scoping
function goodFunction() {
  const email = "user@example.com"; // Block scoped, cleaned up after function
}

// Use strict mode to prevent accidental globals
"use strict";
function strictFunction() {
  // email = "user@example.com"; // Error: email is not defined
}
```

### Memory Leak: Event Listeners

```javascript
// BAD: Event listener creating memory leak
class Component {
  constructor(name) {
    this.name = name;
    this.data = new Array(1000000).fill("data"); // Large data

    // Event listener holds reference to 'this'
    document.addEventListener("click", () => {
      console.log(this.name);
    });
  }
}

let comp = new Component("Component1");
comp = null; // Component can't be garbage collected due to event listener

// GOOD: Remove event listeners
class GoodComponent {
  constructor(name) {
    this.name = name;
    this.data = new Array(1000000).fill("data");

    this.handleClick = () => console.log(this.name);
    document.addEventListener("click", this.handleClick);
  }

  destroy() {
    document.removeEventListener("click", this.handleClick);
    this.data = null; // Help GC by explicitly clearing
  }
}

let goodComp = new GoodComponent("Component1");
goodComp.destroy(); // Properly cleaned up
goodComp = null;    // Now garbage collectable
```

### Memory Leak: Circular References

```javascript
// Modern engines handle this, but worth understanding
function createCircular() {
  let obj1 = {};
  let obj2 = {};

  obj1.ref = obj2;
  obj2.ref = obj1; // Circular reference

  return [obj1, obj2];
}

let [a, b] = createCircular();
a = null;
b = null;
// Both objects become unreachable despite circular references
// Modern GC (Mark-and-Sweep) handles this correctly
```

### Memory Leak: Timers and Intervals

```javascript
// BAD: Timer holds reference
let data = new Array(1000000).fill("important");

let timerId = setInterval(() => {
  console.log(data[0]); // Interval keeps 'data' reachable
}, 1000);

// Even if 'data' goes out of scope, it's still referenced by the interval
// data = null; // Won't help; interval still holds reference

// GOOD: Clear timers
let goodData = new Array(1000000).fill("important");

let goodTimerId = setInterval(() => {
  console.log(goodData[0]);
}, 1000);

// Clean up
clearInterval(goodTimerId);
goodData = null;
```

### Memory Leak: Detached DOM Nodes

```javascript
// BAD: Keeping reference to removed DOM nodes
let detachedElements = [];

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove")) {
    let element = e.target;
    element.remove(); // Removed from DOM but still referenced
    detachedElements.push(element); // Memory leak!
  }
});

// GOOD: Don't keep references to removed elements
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove")) {
    e.target.remove(); // No lingering reference
  }
});
```

### Weak References: WeakMap and WeakSet

```javascript
// Regular Map keeps objects alive
const map = new Map();
let obj = { id: 1, data: "important" };

map.set("key", obj);
obj = null;
console.log(map.get("key")); // { id: 1, data: "important" } - Still alive!

// GOOD: WeakMap doesn't prevent garbage collection
const weakMap = new WeakMap();
let obj2 = { id: 2, data: "important" };

weakMap.set(obj2, "metadata");
obj2 = null;
console.log(weakMap.get(obj2)); // undefined - Object was garbage collected

// Practical use: Cache with automatic cleanup
class Cache {
  constructor() {
    this.cache = new WeakMap(); // Keys are automatically cleaned up
  }

  set(key, value) {
    if (typeof key === "object") {
      this.cache.set(key, value);
    }
  }

  get(key) {
    return this.cache.get(key);
  }
}

const cache = new Cache();
let user = { id: 1, name: "Alice" };
cache.set(user, { role: "admin" });

user = null; // Object can be garbage collected, cache entry is cleaned up
```

### Memory Profiling in Browser and Node.js

```javascript
// Simulating memory usage patterns
class MemoryAnalysis {
  constructor() {
    this.smallObjects = [];
    this.largeObjects = [];
  }

  createSmallObjects(count) {
    for (let i = 0; i < count; i++) {
      this.smallObjects.push({
        id: i,
        name: `object_${i}`,
        value: i * 2
      });
    }
  }

  createLargeObjects(count) {
    for (let i = 0; i < count; i++) {
      this.largeObjects.push({
        id: i,
        data: new Array(10000).fill("data"),
        buffer: new ArrayBuffer(1024 * 100) // 100 KB each
      });
    }
  }

  cleanup() {
    this.smallObjects = [];
    this.largeObjects = [];
  }
}

const analysis = new MemoryAnalysis();
analysis.createSmallObjects(1000);
analysis.createLargeObjects(10);

// Use Chrome DevTools or node --inspect to capture heap snapshots
// Can see memory allocation patterns and identify leaks
```

### Optimizing for Garbage Collection

```javascript
// SUBOPTIMAL: Creating many intermediate objects
function processDataBad(array) {
  return array
    .map(x => ({ value: x * 2 }))    // Creates array of objects
    .filter(obj => obj.value > 10)    // Creates new array
    .map(obj => obj.value)             // Creates new array
    .reduce((sum, val) => sum + val, 0);
}

// OPTIMIZED: Reduce intermediate allocations
function processDataGood(array) {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    const value = array[i] * 2;
    if (value > 10) {
      sum += value;
    }
  }
  return sum;
}

// GOOD: Reuse arrays with object pooling pattern
class ObjectPool {
  constructor(factory, resetFn) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.available = [];
    this.inUse = new Set();
  }

  acquire() {
    let obj = this.available.length > 0
      ? this.available.pop()
      : this.factory();
    this.inUse.add(obj);
    return obj;
  }

  release(obj) {
    this.resetFn(obj);
    this.inUse.delete(obj);
    this.available.push(obj);
  }
}

// Usage
const vectorPool = new ObjectPool(
  () => ({ x: 0, y: 0, z: 0 }),
  (vec) => { vec.x = vec.y = vec.z = 0; }
);

const v1 = vectorPool.acquire();
v1.x = 10; v1.y = 20;
// Use v1...
vectorPool.release(v1); // Reuse instead of creating new
```

---

## Best Practices

### Avoid Unintended Globals

```javascript
// Use strict mode
"use strict";

// Use variable declarations
const user = { name: "Alice" };
let count = 0;
var legacy = "value"; // Even var is scoped in functions

// Avoid this
window.globalVar = "bad";
```

### Clean Up Event Listeners

```javascript
class Manager {
  constructor() {
    this.handler = this.handleEvent.bind(this);
    document.addEventListener("click", this.handler);
  }

  handleEvent(e) {
    // Handle event
  }

  destroy() {
    document.removeEventListener("click", this.handler);
  }
}
```

### Clear Timers and Intervals

```javascript
const timerId = setInterval(() => {
  // Do something
}, 1000);

// Don't forget to clear
clearInterval(timerId);
```

### Release Large Objects When Done

```javascript
let largeArray = new Array(1000000).fill(0);
// Use largeArray...
largeArray = null; // Signal to GC that this can be collected
```

### Use Weak References for Caches and Private Data

```javascript
// Cache using WeakMap
const privateData = new WeakMap();

class User {
  constructor(name) {
    this.name = name;
    privateData.set(this, { internal: "data" });
  }

  getPrivate() {
    return privateData.get(this);
  }
}
```

### Avoid Creating Functions Inside Loops

```javascript
// BAD: Creates new function each iteration
const handlers = [];
for (let i = 0; i < 100; i++) {
  handlers.push(() => console.log(i)); // New function each time
}

// GOOD: Create function once, use closure for data
function createHandler(index) {
  return () => console.log(index);
}

const goodHandlers = [];
for (let i = 0; i < 100; i++) {
  goodHandlers.push(createHandler(i));
}

// BEST: Use event delegation instead of many listeners
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn")) {
    console.log(e.target.dataset.index);
  }
});
```

### Monitor Memory in Production

```javascript
// Check available memory (browsers)
if (performance.memory) {
  console.log("Used JS heap size:", performance.memory.usedJSHeapSize);
  console.log("JS heap size limit:", performance.memory.jsHeapSizeLimit);
  console.log("Heap utilization:",
    (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2) + "%"
  );
}

// In Node.js
console.log(process.memoryUsage());
// {
//   rss: 23505920,       // Resident set size
//   heapTotal: 6291456,  // Total heap size allocated
//   heapUsed: 3346088,   // Actual heap used
//   external: 24360      // C++ objects bound to JS
// }
```

### Optimize for V8 Engine

```javascript
// Maintain consistent object shapes for better optimization
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
    this.age = 0; // Define all properties in constructor
  }
}

// Good: All instances have same shape
const user1 = new User("Alice", "alice@example.com");
const user2 = new User("Bob", "bob@example.com");

// Avoid: Changing shapes
user1.phone = "123-456-7890"; // Changes the shape, hurts optimization

// Avoid: Hidden classes
class BadExample {
  constructor(x) {
    this.x = x;
  }
}

const b1 = new BadExample(1);
b1.y = 2; // Adds property, changes shape

const b2 = new BadExample(2);
// Now b1 and b2 have different shapes, no optimization
```

---

## Common Pitfalls

### Keeping References to Removed DOM Nodes

**Problem**:
```javascript
let button = document.getElementById("btn");
button.remove();
// button still references the removed element
// The entire DOM subtree is kept in memory
```

**Solution**: Delete references after removal
```javascript
let button = document.getElementById("btn");
button.remove();
button = null;
```

### Forgetting to Remove Event Listeners

**Problem**:
```javascript
class Widget {
  constructor(element) {
    element.addEventListener("click", this.onClick.bind(this));
    // No cleanup method
  }
}
```

**Solution**: Implement cleanup
```javascript
class Widget {
  constructor(element) {
    this.element = element;
    this.onClick = this.onClick.bind(this);
    element.addEventListener("click", this.onClick);
  }

  destroy() {
    this.element.removeEventListener("click", this.onClick);
  }
}
```

### Using Global Variables Excessively

**Problem**:
```javascript
window.globalData = new Array(1000000); // Lives forever
window.globalCounter = 0;
```

**Solution**: Use module scope
```javascript
const globalData = new Array(1000000); // Scoped to module
let globalCounter = 0;

export { globalData };
```

### Not Understanding Closure Scope

**Problem**:
```javascript
function createFunctions() {
  const largeData = new Array(1000000);

  return [
    () => largeData[0], // Closure keeps largeData alive
    () => largeData[1]
  ];
}

let funcs = createFunctions();
// largeData can't be garbage collected while funcs exists
```

**Solution**: Limit closure scope
```javascript
function createFunctions() {
  const largeData = new Array(1000000);
  const firstValue = largeData[0];
  const secondValue = largeData[1];

  return [
    () => firstValue,   // Only captures specific values
    () => secondValue
  ];
}
```

### Creating Accidental Closures

**Problem**:
```javascript
const handlers = [];

for (var i = 0; i < 100; i++) {  // var is function-scoped
  handlers.push(() => console.log(i));
}

handlers.forEach(h => h()); // All print 100
```

**Solution**: Use block scoping
```javascript
const handlers = [];

for (let i = 0; i < 100; i++) {  // let is block-scoped
  handlers.push(() => console.log(i));
}

handlers.forEach(h => h()); // Prints 0-99
```

### Detached Observers and Subscriptions

**Problem**:
```javascript
class Component {
  constructor(observable) {
    observable.subscribe(data => {
      this.update(data);
    });
  }

  destroy() {
    // Forgot to unsubscribe!
  }
}
```

**Solution**: Unsubscribe on cleanup
```javascript
class Component {
  constructor(observable) {
    this.subscription = observable.subscribe(data => {
      this.update(data);
    });
  }

  destroy() {
    this.subscription.unsubscribe();
  }
}
```

### Storing Entire Objects When You Need One Property

**Problem**:
```javascript
class DataCache {
  constructor(users) {
    this.allUsers = users; // Stores entire user objects
    this.nameIndex = {};

    users.forEach(user => {
      this.nameIndex[user.name] = user; // Double reference
    });
  }
}
```

**Solution**: Store only what you need
```javascript
class DataCache {
  constructor(users) {
    this.nameIndex = {};

    users.forEach(user => {
      this.nameIndex[user.name] = user.id;
    });
  }
}
```

---

## Performance Considerations

### Understanding GC Pause Times

```javascript
// Monitor GC impact in Node.js
const perfObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`GC pause: ${entry.duration}ms`);
  }
});

perfObserver.observe({ entryTypes: ["gc"] });

// Simulate memory allocation
function allocateMemory() {
  const arrays = [];
  for (let i = 0; i < 100; i++) {
    arrays.push(new Array(10000).fill(Math.random()));
  }
  return arrays;
}

const data = allocateMemory();
// GC pauses would be logged when garbage collection occurs
```

### Heap Size and Configuration

```javascript
// Node.js: Set heap size
// node --max-old-space-size=4096 app.js (4GB)

// Check current limits
console.log(v8.getHeapStatistics());
// Returns heap limits and current usage

// Monitor heap growth
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(`Heap used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)}MB`);
}, 1000);
```

### Garbage Collection Tuning

```javascript
// V8 optimizations
const v8 = require("v8");

// Write heap snapshot for analysis
const snapshot = v8.writeHeapSnapshot();
console.log(`Heap snapshot written to ${snapshot}`);

// Force garbage collection (use sparingly)
// --expose-gc flag required
if (global.gc) {
  gc();
  console.log("Garbage collection triggered");
}
```

### Memory Profiling Best Practices

1. **Establish Baseline**: Measure memory in idle state
2. **Measure Under Load**: Track memory with realistic data volumes
3. **Look for Growth**: Linear vs. unbounded memory growth
4. **Identify Leaks**: Compare snapshots before and after operations
5. **Use DevTools**: Chrome DevTools Memory tab, Node.js --inspect

```javascript
// Memory profiling helper
class MemoryProfiler {
  constructor() {
    this.snapshots = [];
  }

  snapshot(label) {
    const mem = process.memoryUsage();
    this.snapshots.push({
      label,
      timestamp: Date.now(),
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss
    });
  }

  report() {
    console.log("Memory Snapshots:");
    this.snapshots.forEach((s, i) => {
      console.log(`${i}: ${s.label}`);
      console.log(`   Heap used: ${(s.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   RSS: ${(s.rss / 1024 / 1024).toFixed(2)}MB`);
    });
  }
}

const profiler = new MemoryProfiler();
profiler.snapshot("start");
// ... do work ...
profiler.snapshot("after processing");
profiler.report();
```

---

## Real-world Scenarios

### Scenario 1: Memory Leak in a Web Application

**Situation**: A dashboard application that loads user data and displays charts. After navigating between users several times, the page becomes sluggish.

**Root Cause**: Previous chart instances aren't being destroyed
```javascript
// BAD: Memory leaks in chart library
class Dashboard {
  constructor(userId) {
    this.chart = null;
  }

  loadUser(userId) {
    // Previous chart not destroyed
    this.chart = new Chart(userId);
    this.chart.render();
  }
}

// GOOD: Proper cleanup
class GoodDashboard {
  constructor(userId) {
    this.chart = null;
  }

  loadUser(userId) {
    if (this.chart) {
      this.chart.destroy(); // Cleanup before creating new
    }
    this.chart = new Chart(userId);
    this.chart.render();
  }
}
```

### Scenario 2: Node.js Server Memory Leak

**Situation**: A Node.js API server gradually consumes more memory over hours, eventually running out of memory.

**Root Cause**: Caching without expiration policy
```javascript
// BAD: Unbounded cache growth
const cache = {};

function cacheResponse(key, value) {
  cache[key] = value; // Never cleared
}

// GOOD: Implement expiration
class ExpiringCache {
  constructor(ttlMs = 60000) {
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
}
```

### Scenario 3: Memory Growth in Long-Running Processes

**Situation**: A WebSocket server handling multiple connections shows steady memory growth.

**Root Cause**: Connection data not being properly released
```javascript
// BAD: Holding connections in memory
const connections = [];

server.on("connection", (socket) => {
  const connectionData = {
    socket,
    messages: [], // Array grows unbounded
    metadata: {}
  };

  connections.push(connectionData);

  socket.on("close", () => {
    // Forgot to remove from connections array!
  });
});

// GOOD: Proper connection management
const connections = new Map();

server.on("connection", (socket) => {
  const connectionId = generateId();
  const connectionData = {
    socket,
    messages: [],
    metadata: {}
  };

  connections.set(connectionId, connectionData);

  socket.on("close", () => {
    connections.delete(connectionId);
    // Optional: clear messages array
    connectionData.messages = null;
  });
});
```

### Scenario 4: Memory Issues with Heavy DOM Manipulation

**Situation**: A single-page application that dynamically creates thousands of DOM nodes causes memory bloat.

**Root Cause**: Virtual scrolling not implemented
```javascript
// BAD: Rendering all items at once
function renderAllItems(items) {
  const container = document.getElementById("list");
  const html = items
    .map(item => `<div class="item">${item.name}</div>`)
    .join("");
  container.textContent = ""; // Clear safely
  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = item.name;
    fragment.appendChild(div);
  });
  container.appendChild(fragment);
}

// GOOD: Virtual scrolling for large lists
class VirtualList {
  constructor(container, items, itemHeight, visibleCount) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleCount = visibleCount;

    this.renderVisibleItems(0);
    this.container.addEventListener("scroll", () => {
      const scrollTop = this.container.scrollTop;
      const startIndex = Math.floor(scrollTop / itemHeight);
      this.renderVisibleItems(startIndex);
    });
  }

  renderVisibleItems(startIndex) {
    const endIndex = Math.min(
      startIndex + this.visibleCount,
      this.items.length
    );

    this.container.textContent = "";
    const fragment = document.createDocumentFragment();

    this.items.slice(startIndex, endIndex).forEach(item => {
      const div = document.createElement("div");
      div.className = "item";
      div.textContent = item.name;
      fragment.appendChild(div);
    });

    this.container.appendChild(fragment);
  }
}
```

---

## Interview Points

### Explain Garbage Collection to Someone Who Doesn't Know Programming

"Garbage collection is like a janitor in a building. The janitor walks around and removes trash (unused objects) from rooms (memory). In JavaScript, the engine automatically does this work, so you don't have to manually clean up."

### What's the Difference Between Stack and Heap?

**Stack**:
- Stores primitive values and references
- Last-in-first-out structure
- Automatically freed when scope ends
- Limited in size but very fast
- No fragmentation

**Heap**:
- Stores objects and arrays
- Dynamically allocated
- Freed by garbage collection
- Larger but slower
- Can become fragmented

### Describe the Mark-and-Sweep Algorithm

"Mark-and-sweep works in two phases:
1. Mark: Starting from root objects, traverse all reachable objects and mark them.
2. Sweep: Iterate through memory and free all unmarked objects.
3. Optionally, compact: Move live objects together to reduce fragmentation."

### What's a Memory Leak and How Do You Detect It?

"A memory leak is when objects that are no longer needed remain in memory. Common causes:
- Unreleased event listeners
- Uncleared timers
- Circular references (in old engines)
- Detached DOM nodes still referenced

Detection: Use Chrome DevTools (Heap snapshots, Memory profiler) or Node.js profiling tools. Compare snapshots before and after operations."

### Explain Weak References and When to Use Them

"Weak references (WeakMap, WeakSet) don't prevent garbage collection. Keys/values are automatically removed when no other references exist. Useful for:
- Caches that should allow GC
- Private data on objects
- Associating data with DOM elements"

### What's the Difference Between Global and Local Variables in Terms of Memory?

"Global variables persist for the program's lifetime and are referenced from the global object, preventing garbage collection. Local variables are freed when they go out of scope. This makes globals problematic for memory management—use modules and avoid global scope."

### How Do Closures Affect Memory Management?

"Closures capture variables from their enclosing scope, keeping them in memory even after the function returns. This can prevent garbage collection of large objects if they're captured by long-lived closures."

### How Would You Optimize Memory for a Real-time Game?

"Strategies:
- Object pooling: Reuse objects instead of creating new ones
- Minimal allocations: Preallocate arrays and avoid creating temp objects
- Efficient data structures: Use typed arrays for large datasets
- Monitor GC pauses: Ensure frame times stay under 16ms (60 FPS)
- Profile regularly: Use DevTools to identify memory hotspots"

### What Happens When You Exceed the Heap Size Limit?

"The application throws an out-of-memory error and crashes. The exact error depends on the environment (RangeError in Node.js, crash in browsers). This is prevented by:
- Monitoring memory usage
- Implementing memory limits
- Fixing leaks
- Configuring larger heap (if appropriate)"

### How Does Generational Garbage Collection Work?

"Objects are grouped by age. Young objects are collected frequently, old objects less frequently. This is efficient because:
- Most objects die young (quickly become unreachable)
- Focusing effort on young generation reduces pause times
- Old objects rarely become unreachable"

---

## Further Reading

### Key Concepts to Explore
- **V8 Engine Architecture**: Understanding how Chrome and Node.js optimize code
- **Incremental GC**: How modern engines do garbage collection without full pauses
- **Concurrent GC**: Parallel garbage collection in advanced engines
- **Memory Pressure API**: Browser APIs for detecting memory constraints
- **Heap Snapshots**: Deep analysis tools in browser DevTools

### Tools and Resources
- **Chrome DevTools Memory Tab**: Heap snapshots, allocation tracking
- **Node.js Inspector**: `node --inspect` for profiling
- **V8 Profiler**: `v8.writeHeapSnapshot()` for analysis
- **Performance Observer**: Monitor GC in code
- **Memory API**: `performance.memory` in browsers

### Related Topics
- **Virtual DOM and Reconciliation**: How frameworks optimize memory
- **Event Delegation**: Reducing event listener overhead
- **Code Splitting**: Managing bundle size and memory
- **Worker Threads**: Offloading work to reduce main thread pressure
- **Service Workers**: Caching strategies and memory management

### Recommended Learning Path
1. Understand memory model (stack vs heap)
2. Learn garbage collection basics (reachability, mark-and-sweep)
3. Practice identifying memory leaks
4. Profile applications with DevTools
5. Implement optimization techniques
6. Study engine-specific optimizations (V8, SpiderMonkey)
7. Apply knowledge to architecture decisions

### Important Articles and Documentation
- MDN: Memory Management in JavaScript
- V8 Engine Blog: Posts on GC improvements
- Chrome DevTools Documentation: Memory profiling
- Node.js Documentation: Process memory usage
- ECMAScript Specifications: Execution context and scope
