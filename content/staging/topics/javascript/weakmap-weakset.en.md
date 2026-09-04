---
title: WeakMap 与 WeakSet 深入解析
description: 深入理解 JavaScript 中的 WeakMap 和 WeakSet,掌握弱引用机制、垃圾回收原理、与 Map/Set 的区别,以及在实际开发中的应用场景
track: javascript
section: core
difficulty: intermediate
tags:
  - WeakMap
  - WeakSet
  - 弱引用
  - 垃圾回收
  - 内存管理
  - ES6
status: imported
origin: old/src/content/docs/javascript/weakmap-weakset.en.md
divergence: 0.181
issues:
  - title-lang-en
  - missing-subcategory-en
  - missing-subcategory-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: ""
  order: null
  lastUpdated: 2026-01-07
---

## Concept Explanation

### What are WeakMap and WeakSet

WeakMap and WeakSet are two special collection types introduced in ES6. Their main difference from regular Map and Set lies in their **weak reference** characteristics for keys (WeakMap) or values (WeakSet).

**WeakMap** is a collection of key-value pairs where keys must be objects (not primitive values), and the references to keys are weak references. When a key object has no other references, the key-value pair will be automatically garbage collected.

**WeakSet** is a collection of values where values must be objects, and the references to values are also weak references. When a value object has no other references, the value will be automatically garbage collected.

### Weak Reference vs Strong Reference

In JavaScript, regular object references are **strong references**. As long as a strong reference points to an object, the garbage collector will not reclaim that object.

```javascript
// Strong reference example
let obj = { name: "example" };
const map = new Map();
map.set(obj, "value");

obj = null; // Set obj to null
// But since Map still holds a strong reference to the original object, it won't be garbage collected
// map can still access this object through iteration
```

**Weak references** do not prevent garbage collection:

```javascript
// Weak reference example
let obj = { name: "example" };
const weakMap = new WeakMap();
weakMap.set(obj, "value");

obj = null; // Set obj to null
// Since WeakMap holds a weak reference to the key, when no other references point to the object
// the garbage collector can reclaim it at any time, and the key-value pair will be automatically removed
```

### Design Background and Problems Solved

WeakMap and WeakSet primarily solve the following problems:

1. **Memory leaks**: When using Map/Set to store object references, even if these objects are no longer used elsewhere, the references in Map/Set still prevent garbage collection
2. **Private data storage**: Associate private data with objects without affecting the object's lifecycle
3. **Cache management**: Automatically clean up cache entries that are no longer needed, without manual management
4. **DOM element data association**: Attach data to DOM elements, automatically cleaned up when elements are removed

## Core Principles

### Garbage Collection Mechanism

JavaScript engines use a Garbage Collector to automatically manage memory. The mainstream garbage collection algorithm is **Mark-and-Sweep**:

1. The garbage collector starts from root objects (global objects, variables in current call stack, etc.)
2. Marks all objects reachable from root objects
3. Clears all unmarked objects

```
Root object (root)
    |
    v
  ObjectA -----> ObjectB
    |
    v
  ObjectC

Unreferenced ObjectD, ObjectE will be collected
```

### Weak Reference Implementation in WeakMap/WeakSet

References in WeakMap and WeakSet are not considered "reachable" paths by the garbage collector:

```javascript
// Memory model illustration
const weakMap = new WeakMap();
let obj = { data: "important" };

weakMap.set(obj, { metadata: "info" });

// Reference relationships at this point:
// variable obj ----strong ref----> { data: "important" }
// weakMap ----weak ref----> { data: "important" }
//                              |
//                              v
//                        { metadata: "info" }

obj = null;

// Now:
// weakMap ----weak ref----> { data: "important" } (no strong ref, can be collected)
// After the key object is collected, the associated value will also be collected
```

### Non-Enumerability

Due to the uncertain timing of garbage collection, WeakMap and WeakSet **do not support iteration**:

- No `size` property
- No `keys()`, `values()`, `entries()` methods
- No `forEach()` method
- Cannot use `for...of` loop

This is because at any moment, the number of elements in the collection may change due to garbage collection, and providing iteration methods would lead to uncertain behavior.

### Underlying Implementation Principles

From an engine implementation perspective, WeakMap typically uses the **Ephemeron** mechanism:

```
Ephemeron = (weak reference key, strong reference value)

Rules:
1. If key is reachable -> entire Ephemeron survives
2. If key is unreachable -> entire Ephemeron can be collected
```

This differs from regular Map's hash table implementation, which holds strong references to both keys and values.

## Core Points

### WeakMap Core Features

| Feature | Description |
|---------|-------------|
| Key type | Only objects (including arrays, functions, etc.), not primitive values |
| Value type | Any type |
| Reference type | Keys are weak references, values are strong references |
| Iterable | No |
| size property | None |

**Supported methods**:
- `set(key, value)` - Set key-value pair
- `get(key)` - Get value
- `has(key)` - Check if key exists
- `delete(key)` - Delete key-value pair

### WeakSet Core Features

| Feature | Description |
|---------|-------------|
| Value type | Only objects, not primitive values |
| Reference type | Weak reference |
| Iterable | No |
| size property | None |

**Supported methods**:
- `add(value)` - Add value
- `has(value)` - Check if value exists
- `delete(value)` - Delete value

### WeakMap vs Map Comparison

```javascript
// Map - strong reference
const map = new Map();
let key = { id: 1 };
map.set(key, "data");
console.log(map.size);        // 1
key = null;
// key object still exists in map, won't be collected
console.log(map.size);        // Still 1

// WeakMap - weak reference
const weakMap = new WeakMap();
let weakKey = { id: 2 };
weakMap.set(weakKey, "data");
// console.log(weakMap.size); // Error! WeakMap has no size property
weakKey = null;
// weakKey object may be collected in the next GC
```

### WeakSet vs Set Comparison

```javascript
// Set - strong reference, iterable
const set = new Set();
let obj1 = { id: 1 };
set.add(obj1);
console.log([...set]);        // [{ id: 1 }]
obj1 = null;
console.log(set.size);        // 1 (object not collected)

// WeakSet - weak reference, not iterable
const weakSet = new WeakSet();
let obj2 = { id: 2 };
weakSet.add(obj2);
// console.log([...weakSet]); // Error! WeakSet is not iterable
obj2 = null;
// obj2 may be collected in the next GC
```

## Code Examples

### Basic Usage

```javascript
// ========== WeakMap Basic Usage ==========
const weakMap = new WeakMap();

// Create objects as keys
const user = { name: "Alice" };
const config = { theme: "dark" };

// Set key-value pairs
weakMap.set(user, { role: "admin", permissions: ["read", "write"] });
weakMap.set(config, { version: "1.0" });

// Get values
console.log(weakMap.get(user));    // { role: "admin", permissions: [...] }
console.log(weakMap.get(config));  // { version: "1.0" }

// Check if key exists
console.log(weakMap.has(user));    // true
console.log(weakMap.has({}));      // false (different object)

// Delete key-value pair
weakMap.delete(config);
console.log(weakMap.has(config));  // false

// ========== WeakSet Basic Usage ==========
const weakSet = new WeakSet();

const obj1 = { id: 1 };
const obj2 = { id: 2 };

// Add values
weakSet.add(obj1);
weakSet.add(obj2);

// Check if value exists
console.log(weakSet.has(obj1));    // true
console.log(weakSet.has({ id: 1 })); // false (different object reference)

// Delete value
weakSet.delete(obj1);
console.log(weakSet.has(obj1));    // false
```

### Private Data Storage

```javascript
// Using WeakMap to implement private properties for classes
const privateData = new WeakMap();

class Person {
  constructor(name, age, ssn) {
    // Public properties
    this.name = name;
    this.age = age;

    // Private data stored in WeakMap
    privateData.set(this, {
      ssn: ssn,           // Social Security Number (sensitive information)
      password: null,
      loginAttempts: 0
    });
  }

  // Method to get private data
  getSSN(authToken) {
    if (this.validateAuth(authToken)) {
      return privateData.get(this).ssn;
    }
    throw new Error("Unauthorized");
  }

  setPassword(password) {
    const data = privateData.get(this);
    data.password = this.hashPassword(password);
  }

  validateAuth(token) {
    // Validation logic
    return token === "valid-token";
  }

  hashPassword(password) {
    // Simplified hash example
    return `hashed_${password}`;
  }

  incrementLoginAttempts() {
    const data = privateData.get(this);
    data.loginAttempts++;
    return data.loginAttempts;
  }
}

const person = new Person("Alice", 30, "123-45-6789");

console.log(person.name);              // "Alice" (public)
console.log(person.ssn);               // undefined (private data not directly accessible)
console.log(privateData.get(person));  // Accessible, but only within the module

// When person object is collected, its private data will also be automatically cleaned up
```

### DOM Element Data Association

```javascript
// Associate extra data with DOM elements, automatically cleaned up when element is removed
const elementData = new WeakMap();

function setElementData(element, data) {
  const existing = elementData.get(element) || {};
  elementData.set(element, { ...existing, ...data });
}

function getElementData(element, key) {
  const data = elementData.get(element);
  return key ? data?.[key] : data;
}

// Usage example
const button = document.createElement("button");
button.textContent = "Click me";

setElementData(button, {
  clickCount: 0,
  lastClicked: null,
  handler: () => console.log("clicked")
});

button.addEventListener("click", () => {
  const data = getElementData(button);
  data.clickCount++;
  data.lastClicked = new Date();
  console.log(`Button clicked ${data.clickCount} times`);
});

document.body.appendChild(button);

// When button element is removed and has no other references
// the corresponding data in elementData will be automatically garbage collected
// document.body.removeChild(button);
// button = null; // Data will be automatically cleaned up
```

### Object Tagging and Access Tracking

```javascript
// Using WeakSet to tag processed objects
const processedObjects = new WeakSet();

function processObject(obj) {
  // Avoid duplicate processing
  if (processedObjects.has(obj)) {
    console.log("Object already processed, skipping...");
    return;
  }

  // Process object
  console.log("Processing:", obj);
  // ... execute processing logic

  // Mark as processed
  processedObjects.add(obj);
}

const data1 = { id: 1, value: "first" };
const data2 = { id: 2, value: "second" };

processObject(data1);  // Processing: { id: 1, value: "first" }
processObject(data2);  // Processing: { id: 2, value: "second" }
processObject(data1);  // Object already processed, skipping...

// When data1 is no longer referenced, it will be automatically removed from processedObjects
```

### Cache Implementation

```javascript
// Using WeakMap to implement auto-cleaning cache
const cache = new WeakMap();

function memoize(fn) {
  return function(obj, ...args) {
    // Use object as cache key
    if (!cache.has(obj)) {
      cache.set(obj, new Map());
    }

    const objCache = cache.get(obj);
    const key = JSON.stringify(args);

    if (objCache.has(key)) {
      console.log("Cache hit!");
      return objCache.get(key);
    }

    console.log("Cache miss, computing...");
    const result = fn.call(this, obj, ...args);
    objCache.set(key, result);
    return result;
  };
}

// Expensive computation function
const computeExpensiveValue = memoize((obj, multiplier) => {
  // Simulate expensive computation
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += obj.value * multiplier;
  }
  return result / 1000000;
});

const dataObj = { value: 42 };

console.log(computeExpensiveValue(dataObj, 2));  // Cache miss
console.log(computeExpensiveValue(dataObj, 2));  // Cache hit
console.log(computeExpensiveValue(dataObj, 3));  // Cache miss (different arguments)

// When dataObj is no longer referenced, its cache will also be automatically cleaned up
```

### Circular Reference Detection

```javascript
// Using WeakSet to detect circular references in objects
function hasCircularReference(obj) {
  const visited = new WeakSet();

  function detect(value) {
    // Only check object types
    if (value === null || typeof value !== "object") {
      return false;
    }

    // Circular reference found
    if (visited.has(value)) {
      return true;
    }

    // Mark as visited
    visited.add(value);

    // Recursively check all properties
    for (const key of Object.keys(value)) {
      if (detect(value[key])) {
        return true;
      }
    }

    return false;
  }

  return detect(obj);
}

// Test
const normalObj = {
  a: 1,
  b: { c: 2 },
  d: [1, 2, 3]
};
console.log(hasCircularReference(normalObj));  // false

const circularObj = { a: 1 };
circularObj.self = circularObj;
console.log(hasCircularReference(circularObj)); // true

const deepCircular = {
  level1: {
    level2: {
      level3: null
    }
  }
};
deepCircular.level1.level2.level3 = deepCircular.level1;
console.log(hasCircularReference(deepCircular)); // true
```

### Event Listener Management

```javascript
// Using WeakMap to manage event listeners, avoiding memory leaks
class EventManager {
  constructor() {
    this.listeners = new WeakMap();
  }

  addEventListener(target, event, handler) {
    if (!this.listeners.has(target)) {
      this.listeners.set(target, new Map());
    }

    const targetListeners = this.listeners.get(target);
    if (!targetListeners.has(event)) {
      targetListeners.set(event, new Set());
    }

    targetListeners.get(event).add(handler);
    target.addEventListener(event, handler);
  }

  removeEventListener(target, event, handler) {
    const targetListeners = this.listeners.get(target);
    if (targetListeners?.has(event)) {
      targetListeners.get(event).delete(handler);
      target.removeEventListener(event, handler);
    }
  }

  removeAllListeners(target, event) {
    const targetListeners = this.listeners.get(target);
    if (!targetListeners) return;

    if (event) {
      // Remove all listeners for a specific event
      const handlers = targetListeners.get(event);
      if (handlers) {
        handlers.forEach(handler => {
          target.removeEventListener(event, handler);
        });
        targetListeners.delete(event);
      }
    } else {
      // Remove all listeners for the target
      targetListeners.forEach((handlers, evt) => {
        handlers.forEach(handler => {
          target.removeEventListener(evt, handler);
        });
      });
      this.listeners.delete(target);
    }
  }
}

// Usage example
const eventManager = new EventManager();

const button = document.createElement("button");
const clickHandler = () => console.log("Clicked!");
const hoverHandler = () => console.log("Hovered!");

eventManager.addEventListener(button, "click", clickHandler);
eventManager.addEventListener(button, "mouseenter", hoverHandler);

// When button element is removed and no longer referenced
// the listener records in WeakMap will be automatically cleaned up
```

## Best Practices

### Clarify Use Cases

```javascript
// Correct: Associate data with objects without preventing object collection
const metadata = new WeakMap();
function attachMetadata(obj, data) {
  metadata.set(obj, data);
}

// Incorrect: Should not use WeakMap when you need to iterate all key-value pairs
// const config = new WeakMap(); // Cannot enumerate config items
// Should use Map instead
const config = new Map();
```

### Avoid Primitive Values as Keys

```javascript
const weakMap = new WeakMap();

// Incorrect: Primitive values cannot be WeakMap keys
// weakMap.set("string-key", "value");  // TypeError
// weakMap.set(123, "value");           // TypeError
// weakMap.set(Symbol("key"), "value"); // TypeError

// Correct: Use objects as keys
const keyObj = { id: "unique" };
weakMap.set(keyObj, "value");
```

### Modular Private Data

```javascript
// private-data.js
const privateStore = new WeakMap();

export function setPrivate(obj, key, value) {
  if (!privateStore.has(obj)) {
    privateStore.set(obj, {});
  }
  privateStore.get(obj)[key] = value;
}

export function getPrivate(obj, key) {
  return privateStore.get(obj)?.[key];
}

// user.js
import { setPrivate, getPrivate } from "./private-data.js";

class User {
  constructor(name, password) {
    this.name = name;
    setPrivate(this, "password", hashPassword(password));
    setPrivate(this, "token", null);
  }

  authenticate(password) {
    const storedPassword = getPrivate(this, "password");
    return hashPassword(password) === storedPassword;
  }
}
```

### Combining with WeakRef (Advanced)

```javascript
// ES2021 introduced WeakRef which can be used with WeakMap
class Cache {
  constructor() {
    this.cache = new Map();
    this.finalizationRegistry = new FinalizationRegistry(key => {
      // Clean up cache entry when object is collected
      console.log(`Cleaning up cache for key: ${key}`);
      this.cache.delete(key);
    });
  }

  set(key, value) {
    const ref = new WeakRef(value);
    this.cache.set(key, ref);
    this.finalizationRegistry.register(value, key);
  }

  get(key) {
    const ref = this.cache.get(key);
    if (ref) {
      const value = ref.deref();
      if (value !== undefined) {
        return value;
      }
      // Reference is stale, clean up entry
      this.cache.delete(key);
    }
    return undefined;
  }
}
```

### Type Safety (TypeScript)

```typescript
// Type definitions in TypeScript
interface UserData {
  role: string;
  permissions: string[];
  lastLogin: Date;
}

const userMetadata = new WeakMap<object, UserData>();

class User {
  constructor(public name: string) {
    userMetadata.set(this, {
      role: "user",
      permissions: [],
      lastLogin: new Date()
    });
  }

  getMetadata(): UserData | undefined {
    return userMetadata.get(this);
  }
}

// WeakSet type
const visitedNodes = new WeakSet<Node>();

function traverse(node: Node) {
  if (visitedNodes.has(node)) return;
  visitedNodes.add(node);
  // ... process node
}
```

## Common Pitfalls

### Misunderstanding Garbage Collection Timing

```javascript
const weakMap = new WeakMap();
let obj = { data: "test" };
weakMap.set(obj, "value");

obj = null;

// Pitfall: Expecting immediate collection
console.log(weakMap.has(obj)); // obj is already null here, result is false

// Correct understanding: GC timing is uncertain
// The original object may still exist in WeakMap until GC runs
// But we cannot access it through the null reference
```

### Cannot Get Collection Size

```javascript
const weakMap = new WeakMap();
const weakSet = new WeakSet();

// Pitfall: Trying to get size
// console.log(weakMap.size);      // undefined (not an error, but meaningless)
// console.log(weakMap.length);    // undefined

// Correct approach: If you need to track size, use Map/Set or maintain a counter
// But this may cause memory leaks
```

### Object Literals as Keys

```javascript
const weakMap = new WeakMap();

// Pitfall: Using new object literals each time
weakMap.set({ id: 1 }, "first");
weakMap.set({ id: 1 }, "second");

console.log(weakMap.get({ id: 1 })); // undefined!
// Because each {} is a new object, no reference saved

// Correct approach: Save object reference
const key = { id: 1 };
weakMap.set(key, "value");
console.log(weakMap.get(key)); // "value"
```

### Misunderstanding Value Strong References

```javascript
const weakMap = new WeakMap();
let key = { id: 1 };
let value = { data: "important" };

weakMap.set(key, value);

// Pitfall: Thinking values are also weak references
value = null;
// Value object won't be collected because WeakMap holds strong reference to values
console.log(weakMap.get(key)); // { data: "important" } still exists

key = null;
// Now both key and value may be collected (at next GC)
```

### Serialization Issues

```javascript
const weakMap = new WeakMap();
const obj = { id: 1 };
weakMap.set(obj, { secret: "data" });

// Pitfall: Cannot serialize WeakMap
// JSON.stringify(weakMap);  // "{}" empty object
// Because WeakMap is not enumerable

// If serialization is needed, use Map
const map = new Map();
map.set("key", "value");
const serialized = JSON.stringify([...map]);
```

### Cross-Realm Usage

```javascript
// Pitfall: Objects from iframe as keys
const weakMap = new WeakMap();

// Object from iframe
const iframe = document.createElement("iframe");
document.body.appendChild(iframe);
const iframeObject = iframe.contentWindow.Object;

// This might work, but when iframe is removed
// the object may unexpectedly be collected or retained
weakMap.set(new iframeObject(), "value");

// Best practice: Avoid using WeakMap across Realms
```

### Debugging Difficulties

```javascript
const weakMap = new WeakMap();
const key = { debug: true };
weakMap.set(key, { hidden: "data" });

// Pitfall: Cannot directly view WeakMap contents
console.log(weakMap);  // WeakMap { <items unknown> }

// Debugging tip: Save key references for debugging
const debugKeys = new Set(); // Use only in development environment

function debugSet(wm, key, value) {
  wm.set(key, value);
  if (process.env.NODE_ENV === "development") {
    debugKeys.add(key);
  }
}

function debugInspect(wm) {
  if (process.env.NODE_ENV !== "development") return;
  for (const key of debugKeys) {
    if (wm.has(key)) {
      console.log(key, "=>", wm.get(key));
    }
  }
}
```

## Performance Considerations

### Memory Efficiency

```javascript
// Scenario: Data association for many DOM elements
const elements = [];
for (let i = 0; i < 10000; i++) {
  const el = document.createElement("div");
  elements.push(el);
}

// Using Map - Data still occupies memory after element removal
const mapData = new Map();
elements.forEach((el, i) => mapData.set(el, { index: i, data: "..." }));
// Even if elements is cleared, mapData still holds all references
// elements.length = 0; // Data in mapData won't be cleaned up

// Using WeakMap - Data automatically cleaned up after element removal
const weakMapData = new WeakMap();
elements.forEach((el, i) => weakMapData.set(el, { index: i, data: "..." }));
// elements.length = 0; // Elements and corresponding data will be GC collected
```

### Lookup Performance

```javascript
// Both WeakMap and Map have O(1) lookup complexity
const iterations = 1000000;
const key = { id: 1 };

// Map performance test
const map = new Map();
map.set(key, "value");

console.time("Map.get");
for (let i = 0; i < iterations; i++) {
  map.get(key);
}
console.timeEnd("Map.get");

// WeakMap performance test
const weakMap = new WeakMap();
weakMap.set(key, "value");

console.time("WeakMap.get");
for (let i = 0; i < iterations; i++) {
  weakMap.get(key);
}
console.timeEnd("WeakMap.get");

// Both have similar performance, WeakMap may be slightly slower (weak reference handling overhead)
```

### When to Choose WeakMap/WeakSet

```javascript
// Recommended scenarios for WeakMap:
// 1. Data lifecycle should match key object lifecycle
// 2. No need to iterate all data
// 3. Key objects are managed by external code

// Recommended scenarios for Map:
// 1. Need to iterate all key-value pairs
// 2. Need to know collection size
// 3. Keys are primitive values
// 4. Need to serialize data

// Performance comparison table
/*
Operation     | Map        | WeakMap
--------------|------------|----------
set()         | O(1)       | O(1)
get()         | O(1)       | O(1)
has()         | O(1)       | O(1)
delete()      | O(1)       | O(1)
size          | O(1)       | N/A
Iteration     | O(n)       | N/A
Memory usage  | Higher     | Auto-optimized
GC impact     | Prevents   | Doesn't prevent
*/
```

### Memory Leak Prevention

```javascript
// Potential memory leak without WeakMap
class LeakyCache {
  constructor() {
    this.cache = new Map();
  }

  store(obj, data) {
    this.cache.set(obj, data);
  }

  // Problem: Even if obj is no longer needed, cache still holds reference
  // Unless clear() is manually called, memory leak occurs
  clear() {
    this.cache.clear();
  }
}

// Using WeakMap to avoid memory leaks
class SafeCache {
  constructor() {
    this.cache = new WeakMap();
  }

  store(obj, data) {
    this.cache.set(obj, data);
  }

  // No clear() method needed, automatically cleaned up when obj is no longer referenced
}
```

## Practical Scenarios

### React Component Instance Data

```javascript
// Associate private data with React class components
const componentData = new WeakMap();

class DataComponent extends React.Component {
  constructor(props) {
    super(props);
    componentData.set(this, {
      renderCount: 0,
      lastRenderTime: null,
      subscriptions: []
    });
  }

  componentDidMount() {
    const data = componentData.get(this);
    data.subscriptions.push(
      someObservable.subscribe(this.handleUpdate)
    );
  }

  componentWillUnmount() {
    const data = componentData.get(this);
    data.subscriptions.forEach(sub => sub.unsubscribe());
    // When component instance is destroyed, data is automatically cleaned up
  }

  render() {
    const data = componentData.get(this);
    data.renderCount++;
    data.lastRenderTime = Date.now();
    return <div>Rendered {data.renderCount} times</div>;
  }
}
```

### Simplified Vue Reactivity System Implementation

```javascript
// Vue 3 reactivity system uses WeakMap to store dependencies
const targetMap = new WeakMap();

function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  if (activeEffect) {
    dep.add(activeEffect);
  }
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (dep) {
    dep.forEach(effect => effect());
  }
}

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      trigger(target, key);
      return result;
    }
  });
}
```

### Handling Circular References in Deep Clone

```javascript
function deepClone(obj, visited = new WeakMap()) {
  // Handle primitive values
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Handle circular references
  if (visited.has(obj)) {
    return visited.get(obj);
  }

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // Handle RegExp
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }

  // Handle Array
  if (Array.isArray(obj)) {
    const clone = [];
    visited.set(obj, clone);
    obj.forEach((item, index) => {
      clone[index] = deepClone(item, visited);
    });
    return clone;
  }

  // Handle plain objects
  const clone = Object.create(Object.getPrototypeOf(obj));
  visited.set(obj, clone);

  for (const key of Reflect.ownKeys(obj)) {
    clone[key] = deepClone(obj[key], visited);
  }

  return clone;
}

// Test circular references
const original = { name: "test" };
original.self = original;
original.nested = { parent: original };

const cloned = deepClone(original);
console.log(cloned.self === cloned);                    // true
console.log(cloned.nested.parent === cloned);           // true
console.log(cloned !== original);                       // true
```

### Permission Verification System

```javascript
// Using WeakSet to tag verified objects
const verifiedUsers = new WeakSet();
const verifiedRequests = new WeakSet();

class AuthSystem {
  static verifyUser(user) {
    // Execute verification logic...
    if (user.token && this.validateToken(user.token)) {
      verifiedUsers.add(user);
      return true;
    }
    return false;
  }

  static isUserVerified(user) {
    return verifiedUsers.has(user);
  }

  static verifyRequest(request) {
    if (request.signature && this.validateSignature(request)) {
      verifiedRequests.add(request);
      return true;
    }
    return false;
  }

  static processRequest(user, request) {
    if (!this.isUserVerified(user)) {
      throw new Error("User not verified");
    }
    if (!verifiedRequests.has(request)) {
      throw new Error("Request not verified");
    }

    // Process request...
    return { success: true };
  }

  static validateToken(token) {
    return token.startsWith("valid_");
  }

  static validateSignature(request) {
    return request.signature === "correct";
  }
}

// Usage example
const user = { id: 1, token: "valid_abc123" };
const request = { action: "getData", signature: "correct" };

AuthSystem.verifyUser(user);
AuthSystem.verifyRequest(request);

console.log(AuthSystem.processRequest(user, request));
// { success: true }

// When user or request objects are no longer referenced
// they will be automatically removed from WeakSet
```

### Node Visit Tracking (Tree/Graph Traversal)

```javascript
class Graph {
  constructor() {
    this.adjacencyList = new Map();
  }

  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  addEdge(v1, v2) {
    this.adjacencyList.get(v1)?.push(v2);
    this.adjacencyList.get(v2)?.push(v1);
  }

  // Depth-first traversal using WeakSet
  dfs(start, callback) {
    const visited = new WeakSet();

    const traverse = (vertex) => {
      if (!vertex || visited.has(vertex)) return;

      visited.add(vertex);
      callback(vertex);

      const neighbors = this.adjacencyList.get(vertex) || [];
      neighbors.forEach(neighbor => traverse(neighbor));
    };

    traverse(start);
  }

  // Breadth-first traversal using WeakSet
  bfs(start, callback) {
    const visited = new WeakSet();
    const queue = [start];
    visited.add(start);

    while (queue.length) {
      const vertex = queue.shift();
      callback(vertex);

      const neighbors = this.adjacencyList.get(vertex) || [];
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
  }
}

// Using objects as nodes
const nodeA = { id: "A" };
const nodeB = { id: "B" };
const nodeC = { id: "C" };
const nodeD = { id: "D" };

const graph = new Graph();
graph.addVertex(nodeA);
graph.addVertex(nodeB);
graph.addVertex(nodeC);
graph.addVertex(nodeD);
graph.addEdge(nodeA, nodeB);
graph.addEdge(nodeA, nodeC);
graph.addEdge(nodeB, nodeD);
graph.addEdge(nodeC, nodeD);

graph.dfs(nodeA, node => console.log("DFS visiting:", node.id));
// DFS visiting: A, B, D, C

graph.bfs(nodeA, node => console.log("BFS visiting:", node.id));
// BFS visiting: A, B, C, D
```

## Interview Key Points

### Basic Concept Questions

**Q1: What are the main differences between WeakMap and Map?**

A: The main differences include:
1. **Key types**: WeakMap can only use objects as keys, Map can use any value
2. **Reference types**: WeakMap has weak references to keys, doesn't prevent garbage collection; Map has strong references
3. **Iterability**: WeakMap is not iterable, has no size property or traversal methods; Map is iterable
4. **Use cases**: WeakMap is suitable for associating data with objects without affecting object lifecycle; Map is suitable for scenarios requiring iteration or counting

**Q2: Why can WeakMap keys only be objects?**

A: Because weak references only make sense for objects. Primitive values (strings, numbers, etc.) are passed by value in JavaScript and don't have a concept of "reference". If primitive values were allowed as keys, the "automatically delete when no other references exist" feature couldn't be implemented.

**Q3: Can WeakMap be garbage collected? How to verify?**

A: Key-value pairs in WeakMap will be garbage collected when the key object has no other strong references. Since GC timing is uncertain, it cannot be directly verified. However, it can be indirectly verified through:
```javascript
let obj = { data: new Array(1000000).fill("x") }; // Large object
const weakMap = new WeakMap();
weakMap.set(obj, "value");

obj = null; // Remove strong reference
// Manually trigger GC (only available in specific environments)
// global.gc && global.gc();
// Memory should decrease afterwards
```

### Application Scenario Questions

**Q4: How to use WeakMap to implement private properties for classes?**

A:
```javascript
const privateProps = new WeakMap();

class MyClass {
  constructor(publicVal, privateVal) {
    this.publicVal = publicVal;
    privateProps.set(this, { privateVal });
  }

  getPrivate() {
    return privateProps.get(this).privateVal;
  }
}

const instance = new MyClass("public", "secret");
console.log(instance.publicVal);    // "public"
console.log(instance.privateVal);   // undefined
console.log(instance.getPrivate()); // "secret"
```

**Q5: What are the applications of WeakMap in Vue/React?**

A:
- **Vue 3 Reactivity System**: Uses WeakMap to store mapping between objects and their dependencies
- **React**: Can be used to store private data for component instances
- **Caching mechanisms**: Cache component computation results, automatically cleaned up when component is destroyed
- **DOM associated data**: Attach data to DOM elements, automatically cleaned up when elements are removed

**Q6: How to use WeakSet to implement "visited" marking for objects?**

A:
```javascript
const visited = new WeakSet();

function processOnce(obj) {
  if (visited.has(obj)) {
    return "already processed";
  }
  visited.add(obj);
  // Processing logic
  return "processed";
}

const obj = { id: 1 };
console.log(processOnce(obj)); // "processed"
console.log(processOnce(obj)); // "already processed"
```

### Advanced Questions

**Q7: Explain the memory model of "weak references" in WeakMap**

A: In WeakMap:
- Keys are weak references: Don't increase object's reference count, don't prevent GC
- Values are strong references: As long as key exists, value won't be collected
- When key object is collected, corresponding value is also collected
- Implementation typically uses Ephemeron mechanism

**Q8: What is the relationship between WeakRef and WeakMap?**

A:
- WeakRef (ES2021) provides weak reference to a single object
- WeakMap is a key-value pair collection where keys are weak references
- WeakRef can get original reference (via deref()), WeakMap cannot directly get keys
- Both don't prevent garbage collection, but have different use cases

**Q9: Why don't WeakMap/WeakSet support iteration?**

A: Because the weak reference characteristic means collection contents can change due to GC at any time:
1. Number of elements at iteration start is uncertain
2. Elements may be collected during iteration
3. Providing iteration methods would lead to unpredictable behavior
4. Iteration functionality is disabled by design to ensure API reliability

## Further Reading

### Official Documentation

- [MDN - WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- [MDN - WeakSet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)
- [MDN - WeakRef](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
- [ECMAScript Specification - WeakMap](https://tc39.es/ecma262/#sec-weakmap-objects)

### Deep Understanding

- [JavaScript.info - WeakMap and WeakSet](https://javascript.info/weakmap-weakset)
- [V8 Blog - Weak references and finalizers](https://v8.dev/features/weak-references)
- [Exploring ES6 - Maps and Sets](https://exploringjs.com/es6/ch_maps-sets.html)

### Related Concepts

- [MDN - Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
- [V8 - Garbage Collection](https://v8.dev/blog/trash-talk)
- [FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)

### Practical Examples

- [Vue 3 Reactivity - targetMap Implementation](https://github.com/vuejs/core/blob/main/packages/reactivity/src/effect.ts)
- [Lodash - memoize with WeakMap](https://lodash.com/docs/#memoize)
