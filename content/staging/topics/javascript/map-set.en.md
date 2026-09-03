---
title: JavaScript Map and Set Collections
description: Learn JavaScript Map, Set, WeakMap and WeakSet data structures with practical examples
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - Map
  - Set
  - data structures
status: imported
origin: old/src/content/docs/javascript/map-set.en.md
divergence: 0.264
issues: []
legacy:
  category: JavaScript
  subcategory: Data Structures
  order: 22
  lastUpdated: 2026-01-07
---

ES6 introduced four new collection types that provide more powerful and flexible ways to store and manage data: Map, Set, WeakMap, and WeakSet. These data structures solve common problems that traditional objects and arrays cannot handle efficiently.

## Introduction to Collections

Before ES6, JavaScript developers relied on plain objects for key-value storage and arrays for collections. However, these had significant limitations:

### Limitations of Plain Objects

```javascript
// Problem 1: Object keys are always strings
const obj = {};
obj[1] = 'one';
obj['1'] = 'string one';
console.log(obj[1]); // 'string one' - keys are converted to strings

// Problem 2: Cannot use objects as keys
const user = { name: 'Alice' };
const permissions = {};
permissions[user] = ['read', 'write'];
console.log(Object.keys(permissions)); // ['[object Object]']

// Problem 3: No guaranteed key order (in some cases)
const ages = { '2': 'two', '1': 'one', '3': 'three' };
console.log(Object.keys(ages)); // ['1', '2', '3'] - numeric keys are sorted

// Problem 4: Prototype pollution
const dict = {};
console.log(dict.toString); // [Function: toString] - inherited property
```

### Why Use Map and Set?

```javascript
// Map allows any type as key
const map = new Map();
const objKey = { id: 1 };
map.set(objKey, 'value for object');
map.set(1, 'value for number 1');
map.set('1', 'value for string 1');

console.log(map.get(objKey)); // 'value for object'
console.log(map.get(1));      // 'value for number 1'
console.log(map.get('1'));    // 'value for string 1'

// Set automatically handles uniqueness
const numbers = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
const uniqueNumbers = new Set(numbers);
console.log([...uniqueNumbers]); // [1, 2, 3, 4]
```

## Map - Key-Value Collections

Map is an ordered collection of key-value pairs where both keys and values can be of any type.

### Creating Maps

```javascript
// Method 1: Empty Map with set()
const map1 = new Map();
map1.set('name', 'Alice');
map1.set('age', 30);

// Method 2: Initialize from array of pairs
const map2 = new Map([
  ['name', 'Bob'],
  ['age', 25],
  ['city', 'New York']
]);

// Method 3: Initialize from another Map
const map3 = new Map(map2);

// Method 4: Initialize from Object.entries()
const obj = { a: 1, b: 2, c: 3 };
const map4 = new Map(Object.entries(obj));
console.log(map4.get('b')); // 2

// Method 5: Chained set() calls (returns the Map)
const map5 = new Map()
  .set('key1', 'value1')
  .set('key2', 'value2')
  .set('key3', 'value3');
```

### Map Methods and Properties

```javascript
const map = new Map();

// set(key, value) - Add or update an entry
map.set('name', 'Alice');
map.set('name', 'Bob'); // Updates existing key

// get(key) - Retrieve a value
console.log(map.get('name')); // 'Bob'
console.log(map.get('nonexistent')); // undefined

// has(key) - Check if key exists
console.log(map.has('name')); // true
console.log(map.has('age')); // false

// delete(key) - Remove an entry
map.set('city', 'NYC');
map.delete('city');
console.log(map.has('city')); // false

// clear() - Remove all entries
map.set('a', 1);
map.set('b', 2);
map.clear();
console.log(map.size); // 0

// size - Get the number of entries
const sizedMap = new Map([['x', 1], ['y', 2], ['z', 3]]);
console.log(sizedMap.size); // 3
```

### Using Different Key Types

```javascript
const map = new Map();

// String keys
map.set('name', 'Alice');

// Number keys
map.set(42, 'the answer');
map.set(3.14, 'pi');

// Boolean keys
map.set(true, 'yes');
map.set(false, 'no');

// Object keys
const user = { id: 1 };
const config = { theme: 'dark' };
map.set(user, 'user data');
map.set(config, 'config data');

// Array keys (reference-based)
const arr = [1, 2, 3];
map.set(arr, 'array data');
console.log(map.get([1, 2, 3])); // undefined - different reference!
console.log(map.get(arr)); // 'array data' - same reference

// Function keys
const fn = () => {};
map.set(fn, 'function data');

// Symbol keys
const sym = Symbol('unique');
map.set(sym, 'symbol data');

// null and undefined keys
map.set(null, 'null key');
map.set(undefined, 'undefined key');

// NaN as key (Map treats NaN === NaN)
map.set(NaN, 'not a number');
console.log(map.get(NaN)); // 'not a number'
```

### Iterating Over Maps

```javascript
const map = new Map([
  ['apple', 5],
  ['banana', 3],
  ['orange', 7]
]);

// Method 1: forEach
map.forEach((value, key, map) => {
  console.log(`${key}: ${value}`);
});
// apple: 5
// banana: 3
// orange: 7

// Method 2: for...of with entries()
for (const [key, value] of map.entries()) {
  console.log(`${key} => ${value}`);
}

// Method 3: for...of (default iterator is entries())
for (const [key, value] of map) {
  console.log(`${key} -> ${value}`);
}

// Method 4: Iterate keys only
for (const key of map.keys()) {
  console.log(key); // apple, banana, orange
}

// Method 5: Iterate values only
for (const value of map.values()) {
  console.log(value); // 5, 3, 7
}

// Converting to arrays
const keysArray = [...map.keys()];     // ['apple', 'banana', 'orange']
const valuesArray = [...map.values()]; // [5, 3, 7]
const entriesArray = [...map.entries()]; // [['apple', 5], ['banana', 3], ['orange', 7]]
```

### Map vs Object Comparison

```javascript
// Feature comparison
const comparison = {
  // Key types
  objectKeys: 'Strings and Symbols only',
  mapKeys: 'Any type (objects, functions, primitives)',

  // Size
  objectSize: 'Must use Object.keys(obj).length',
  mapSize: 'Direct access via map.size',

  // Iteration
  objectIteration: 'Not directly iterable, use Object.keys/values/entries',
  mapIteration: 'Directly iterable with for...of',

  // Key order
  objectOrder: 'Complex rules (numeric keys sorted)',
  mapOrder: 'Insertion order guaranteed',

  // Performance
  objectPerformance: 'Better for small, static data',
  mapPerformance: 'Better for frequent additions/removals'
};

// When to use Object
const settings = {
  theme: 'dark',
  fontSize: 14,
  language: 'en'
};
// Good for: JSON serialization, fixed structure, simple key-value

// When to use Map
const userCache = new Map();
const userObj = { id: 1 };
userCache.set(userObj, { name: 'Alice', lastLogin: new Date() });
// Good for: Object keys, frequent changes, ordered iteration
```

### Converting Between Map and Object

```javascript
// Object to Map
const obj = { a: 1, b: 2, c: 3 };
const mapFromObj = new Map(Object.entries(obj));
console.log(mapFromObj.get('b')); // 2

// Map to Object (only works with string keys)
const map = new Map([
  ['name', 'Alice'],
  ['age', 30]
]);
const objFromMap = Object.fromEntries(map);
console.log(objFromMap); // { name: 'Alice', age: 30 }

// Map to JSON
function mapToJson(map) {
  return JSON.stringify([...map]);
}

function jsonToMap(jsonStr) {
  return new Map(JSON.parse(jsonStr));
}

const original = new Map([['a', 1], ['b', 2]]);
const json = mapToJson(original);
console.log(json); // '[["a",1],["b",2]]'

const restored = jsonToMap(json);
console.log(restored.get('a')); // 1

// Deep Map serialization (nested Maps)
function mapReplacer(key, value) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: [...value]
    };
  }
  return value;
}

function mapReviver(key, value) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}

const nested = new Map([
  ['outer', new Map([['inner', 'value']])]
]);

const serialized = JSON.stringify(nested, mapReplacer);
const deserialized = JSON.parse(serialized, mapReviver);
console.log(deserialized.get('outer').get('inner')); // 'value'
```

## Set - Unique Value Collections

Set is an ordered collection of unique values of any type.

### Creating Sets

```javascript
// Method 1: Empty Set with add()
const set1 = new Set();
set1.add(1);
set1.add(2);
set1.add(3);

// Method 2: Initialize from array
const set2 = new Set([1, 2, 3, 4, 5]);

// Method 3: Initialize from string (each character)
const set3 = new Set('hello');
console.log([...set3]); // ['h', 'e', 'l', 'o']

// Method 4: Initialize from another iterable
const set4 = new Set(new Map([['a', 1], ['b', 2]]).keys());
console.log([...set4]); // ['a', 'b']

// Method 5: Chained add() calls
const set5 = new Set()
  .add('first')
  .add('second')
  .add('third');

// Automatic deduplication
const numbers = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
const uniqueNumbers = new Set(numbers);
console.log([...uniqueNumbers]); // [1, 2, 3, 4]
```

### Set Methods and Properties

```javascript
const set = new Set();

// add(value) - Add a value (returns the Set)
set.add(1);
set.add(2);
set.add(1); // Duplicate, ignored
console.log(set.size); // 2

// has(value) - Check if value exists
console.log(set.has(1)); // true
console.log(set.has(5)); // false

// delete(value) - Remove a value (returns boolean)
set.add(3);
console.log(set.delete(3)); // true
console.log(set.delete(10)); // false (didn't exist)

// clear() - Remove all values
set.add(1);
set.add(2);
set.clear();
console.log(set.size); // 0

// size - Get the number of values
const sizedSet = new Set([1, 2, 3, 4, 5]);
console.log(sizedSet.size); // 5
```

### Value Equality in Sets

```javascript
// Primitive values - compared by value
const set = new Set();
set.add(1);
set.add(1);
set.add('1');
console.log(set.size); // 2 (number 1 and string '1')

// NaN handling (treated as equal to itself)
set.add(NaN);
set.add(NaN);
console.log(set.has(NaN)); // true
console.log(set.size); // 3 (1, '1', NaN)

// Object values - compared by reference
const obj1 = { id: 1 };
const obj2 = { id: 1 };
const obj3 = obj1;

const objSet = new Set();
objSet.add(obj1);
objSet.add(obj2);
objSet.add(obj3);

console.log(objSet.size); // 2 (obj1 and obj2 are different references)

// +0 and -0 are considered equal
const zeroSet = new Set();
zeroSet.add(0);
zeroSet.add(-0);
console.log(zeroSet.size); // 1
console.log(zeroSet.has(-0)); // true
```

### Iterating Over Sets

```javascript
const fruits = new Set(['apple', 'banana', 'orange', 'mango']);

// Method 1: forEach
fruits.forEach((value, valueAgain, set) => {
  console.log(value);
  // Note: valueAgain === value (for consistency with Map.forEach)
});

// Method 2: for...of (default iterator)
for (const fruit of fruits) {
  console.log(fruit);
}

// Method 3: values() iterator
for (const value of fruits.values()) {
  console.log(value);
}

// Method 4: keys() iterator (same as values() for Sets)
for (const key of fruits.keys()) {
  console.log(key);
}

// Method 5: entries() iterator
for (const [key, value] of fruits.entries()) {
  console.log(key === value); // true (key and value are the same)
}

// Converting to array
const fruitArray = [...fruits];
// or
const fruitArray2 = Array.from(fruits);
```

### Set Operations

```javascript
// Helper functions for set operations
const setA = new Set([1, 2, 3, 4, 5]);
const setB = new Set([4, 5, 6, 7, 8]);

// Union: All elements from both sets
function union(setA, setB) {
  return new Set([...setA, ...setB]);
}
console.log([...union(setA, setB)]); // [1, 2, 3, 4, 5, 6, 7, 8]

// Intersection: Elements in both sets
function intersection(setA, setB) {
  return new Set([...setA].filter(x => setB.has(x)));
}
console.log([...intersection(setA, setB)]); // [4, 5]

// Difference: Elements in A but not in B
function difference(setA, setB) {
  return new Set([...setA].filter(x => !setB.has(x)));
}
console.log([...difference(setA, setB)]); // [1, 2, 3]

// Symmetric Difference: Elements in either but not both
function symmetricDifference(setA, setB) {
  const diffA = [...setA].filter(x => !setB.has(x));
  const diffB = [...setB].filter(x => !setA.has(x));
  return new Set([...diffA, ...diffB]);
}
console.log([...symmetricDifference(setA, setB)]); // [1, 2, 3, 6, 7, 8]

// Subset: Is A a subset of B?
function isSubset(setA, setB) {
  return [...setA].every(x => setB.has(x));
}
const setC = new Set([4, 5]);
console.log(isSubset(setC, setB)); // true
console.log(isSubset(setA, setB)); // false

// Superset: Is A a superset of B?
function isSuperset(setA, setB) {
  return [...setB].every(x => setA.has(x));
}
console.log(isSuperset(setB, setC)); // true

// Disjoint: Do A and B have no common elements?
function isDisjoint(setA, setB) {
  return [...setA].every(x => !setB.has(x));
}
const setD = new Set([10, 11, 12]);
console.log(isDisjoint(setA, setD)); // true
console.log(isDisjoint(setA, setB)); // false
```

### Set vs Array Comparison

```javascript
// Feature comparison
const array = [1, 2, 3, 4, 5];
const set = new Set([1, 2, 3, 4, 5]);

// Checking for element existence
console.log(array.includes(3)); // O(n) - linear time
console.log(set.has(3));        // O(1) - constant time

// Adding elements
array.push(6);
set.add(6);

// Removing elements by value
const index = array.indexOf(3);
if (index > -1) array.splice(index, 1); // Complex
set.delete(3); // Simple

// Getting unique values
const duplicates = [1, 2, 2, 3, 3, 3];
const uniqueArray = [...new Set(duplicates)]; // Convert via Set
console.log(uniqueArray); // [1, 2, 3]

// When to use Array
// - Need index-based access
// - Need duplicate values
// - Need array methods (map, filter, reduce, etc.)
// - Need ordered operations (sort, reverse)

// When to use Set
// - Need unique values only
// - Need fast lookup (has)
// - Need fast deletion by value
// - Don't need index-based access
```

## WeakMap - Weak Key References

WeakMap is a collection of key-value pairs where keys must be objects and are held weakly (allowing garbage collection).

### WeakMap Characteristics

```javascript
// WeakMap only accepts objects as keys
const weakMap = new WeakMap();

// Valid keys (objects)
const obj = {};
const arr = [];
const func = function() {};
const date = new Date();

weakMap.set(obj, 'object value');
weakMap.set(arr, 'array value');
weakMap.set(func, 'function value');
weakMap.set(date, 'date value');

// Invalid keys (primitives) - throws TypeError
try {
  weakMap.set('string', 'value'); // TypeError
} catch (e) {
  console.error('Primitives cannot be WeakMap keys');
}

try {
  weakMap.set(42, 'value'); // TypeError
} catch (e) {
  console.error('Numbers cannot be WeakMap keys');
}

try {
  weakMap.set(Symbol('sym'), 'value'); // TypeError
} catch (e) {
  console.error('Symbols cannot be WeakMap keys');
}
```

### WeakMap Methods

```javascript
const weakMap = new WeakMap();

const key1 = { id: 1 };
const key2 = { id: 2 };

// set(key, value) - Add or update an entry
weakMap.set(key1, 'first');
weakMap.set(key2, 'second');

// get(key) - Retrieve a value
console.log(weakMap.get(key1)); // 'first'
console.log(weakMap.get({ id: 1 })); // undefined (different reference)

// has(key) - Check if key exists
console.log(weakMap.has(key1)); // true
console.log(weakMap.has({ id: 1 })); // false

// delete(key) - Remove an entry
weakMap.delete(key2);
console.log(weakMap.has(key2)); // false

// Note: WeakMap has NO:
// - size property
// - keys() method
// - values() method
// - entries() method
// - forEach() method
// - clear() method
// This is because the contents are not enumerable
```

### Garbage Collection Behavior

```javascript
// Demonstration of weak reference behavior
const weakMap = new WeakMap();

// Create an object and add to WeakMap
let user = { name: 'Alice' };
weakMap.set(user, { lastLogin: new Date() });

console.log(weakMap.has(user)); // true

// Remove the only reference to the object
user = null;

// Now the object can be garbage collected
// The WeakMap entry will be automatically removed
// (This happens asynchronously during GC)

// Practical example: Caching with automatic cleanup
const cache = new WeakMap();

function processData(dataObj) {
  if (cache.has(dataObj)) {
    console.log('Returning cached result');
    return cache.get(dataObj);
  }

  console.log('Computing result');
  const result = expensiveComputation(dataObj);
  cache.set(dataObj, result);
  return result;
}

function expensiveComputation(data) {
  // Simulate heavy computation
  return { processed: true, timestamp: Date.now() };
}

let data = { values: [1, 2, 3] };
processData(data); // Computing result
processData(data); // Returning cached result

data = null; // Object can be GC'd, cache entry automatically removed
```

### WeakMap Use Cases

```javascript
// Use Case 1: Private instance data
const privateData = new WeakMap();

class User {
  constructor(name, email, password) {
    this.name = name;
    this.email = email;
    // Store sensitive data privately
    privateData.set(this, { password });
  }

  validatePassword(input) {
    const data = privateData.get(this);
    return data.password === input;
  }

  getPublicInfo() {
    return {
      name: this.name,
      email: this.email
    };
  }
}

const user = new User('Alice', 'alice@example.com', 'secret123');
console.log(user.name); // 'Alice'
console.log(user.password); // undefined (not accessible)
console.log(user.validatePassword('secret123')); // true

// When user is garbage collected, private data is too

// Use Case 2: DOM element metadata
const elementData = new WeakMap();

function attachData(element, data) {
  elementData.set(element, data);
}

function getData(element) {
  return elementData.get(element) || {};
}

// In browser environment:
// const button = document.createElement('button');
// attachData(button, { clicks: 0, lastClick: null });
// When element is removed from DOM and dereferenced, data is cleaned up

// Use Case 3: Memoization for object arguments
const memoCache = new WeakMap();

function memoizedProcess(obj) {
  if (memoCache.has(obj)) {
    return memoCache.get(obj);
  }

  const result = {
    keys: Object.keys(obj),
    values: Object.values(obj),
    entries: Object.entries(obj),
    computed: Date.now()
  };

  memoCache.set(obj, result);
  return result;
}

const config = { theme: 'dark', fontSize: 14 };
console.log(memoizedProcess(config)); // Computes
console.log(memoizedProcess(config)); // Returns cached

// Use Case 4: Tracking object states
const objectStates = new WeakMap();

function markAsProcessed(obj) {
  objectStates.set(obj, { processed: true, timestamp: Date.now() });
}

function isProcessed(obj) {
  return objectStates.get(obj)?.processed === true;
}

const task = { id: 1, name: 'Task 1' };
console.log(isProcessed(task)); // false
markAsProcessed(task);
console.log(isProcessed(task)); // true
```

## WeakSet - Weak Value References

WeakSet is a collection of unique objects held weakly.

### WeakSet Characteristics

```javascript
// WeakSet only accepts objects
const weakSet = new WeakSet();

// Valid values (objects)
const obj1 = {};
const obj2 = [];
const obj3 = function() {};

weakSet.add(obj1);
weakSet.add(obj2);
weakSet.add(obj3);

// Invalid values (primitives) - throws TypeError
try {
  weakSet.add('string'); // TypeError
} catch (e) {
  console.error('Primitives cannot be added to WeakSet');
}

try {
  weakSet.add(42); // TypeError
} catch (e) {
  console.error('Numbers cannot be added to WeakSet');
}
```

### WeakSet Methods

```javascript
const weakSet = new WeakSet();

const obj1 = { id: 1 };
const obj2 = { id: 2 };
const obj3 = { id: 3 };

// add(value) - Add an object
weakSet.add(obj1);
weakSet.add(obj2);
weakSet.add(obj1); // Duplicate, ignored

// has(value) - Check if object exists
console.log(weakSet.has(obj1)); // true
console.log(weakSet.has(obj3)); // false
console.log(weakSet.has({ id: 1 })); // false (different reference)

// delete(value) - Remove an object
weakSet.delete(obj2);
console.log(weakSet.has(obj2)); // false

// Note: WeakSet has NO:
// - size property
// - keys() method
// - values() method
// - entries() method
// - forEach() method
// - clear() method
```

### WeakSet Use Cases

```javascript
// Use Case 1: Tracking visited/processed objects
const processed = new WeakSet();

function processOnce(obj) {
  if (processed.has(obj)) {
    console.log('Already processed:', obj.id);
    return;
  }

  console.log('Processing:', obj.id);
  // ... do processing
  processed.add(obj);
}

const item1 = { id: 1, data: 'first' };
const item2 = { id: 2, data: 'second' };

processOnce(item1); // Processing: 1
processOnce(item1); // Already processed: 1
processOnce(item2); // Processing: 2

// Use Case 2: Detecting circular references
function hasCircular(obj, seen = new WeakSet()) {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  if (seen.has(obj)) {
    return true;
  }

  seen.add(obj);

  for (const key of Object.keys(obj)) {
    if (hasCircular(obj[key], seen)) {
      return true;
    }
  }

  return false;
}

const safe = { a: 1, b: { c: 2 } };
console.log(hasCircular(safe)); // false

const circular = { a: 1 };
circular.self = circular;
console.log(hasCircular(circular)); // true

// Use Case 3: Marking DOM elements
const markedElements = new WeakSet();

function markElement(element) {
  markedElements.add(element);
}

function isMarked(element) {
  return markedElements.has(element);
}

// In browser:
// const div = document.createElement('div');
// markElement(div);
// console.log(isMarked(div)); // true
// When div is removed and dereferenced, it's auto-cleaned from WeakSet

// Use Case 4: Instance validation
const validInstances = new WeakSet();

class SecureClass {
  constructor() {
    validInstances.add(this);
  }

  static isValid(instance) {
    return validInstances.has(instance);
  }

  doSecureOperation() {
    if (!SecureClass.isValid(this)) {
      throw new Error('Invalid instance');
    }
    console.log('Performing secure operation');
  }
}

const instance = new SecureClass();
console.log(SecureClass.isValid(instance)); // true
instance.doSecureOperation(); // Performing secure operation

const fake = Object.create(SecureClass.prototype);
console.log(SecureClass.isValid(fake)); // false
// fake.doSecureOperation(); // Error: Invalid instance

// Use Case 5: Preventing duplicate event handling
const handledEvents = new WeakSet();

function handleEvent(event) {
  if (handledEvents.has(event)) {
    return; // Already handled
  }

  handledEvents.add(event);
  console.log('Handling event:', event.type);
}
```

## Performance Comparisons

### Map vs Object Performance

```javascript
// Performance test setup
function benchmark(name, fn, iterations = 100000) {
  const start = performance.now();
  fn(iterations);
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

// Insertion performance
benchmark('Object insertion', (n) => {
  const obj = {};
  for (let i = 0; i < n; i++) {
    obj[`key${i}`] = i;
  }
});

benchmark('Map insertion', (n) => {
  const map = new Map();
  for (let i = 0; i < n; i++) {
    map.set(`key${i}`, i);
  }
});

// Lookup performance
const testObj = {};
const testMap = new Map();
for (let i = 0; i < 10000; i++) {
  testObj[`key${i}`] = i;
  testMap.set(`key${i}`, i);
}

benchmark('Object lookup', (n) => {
  for (let i = 0; i < n; i++) {
    const val = testObj['key5000'];
  }
});

benchmark('Map lookup', (n) => {
  for (let i = 0; i < n; i++) {
    const val = testMap.get('key5000');
  }
});

// Deletion performance
benchmark('Object deletion', (n) => {
  const obj = { ...testObj };
  for (let i = 0; i < 1000; i++) {
    delete obj[`key${i}`];
  }
});

benchmark('Map deletion', (n) => {
  const map = new Map(testMap);
  for (let i = 0; i < 1000; i++) {
    map.delete(`key${i}`);
  }
});

// General observations:
// - Map is faster for frequent additions/deletions
// - Object is faster for small, static collections
// - Map has consistent performance regardless of key type
// - Object performance can degrade with many keys
```

### Set vs Array Performance

```javascript
// Lookup performance comparison
const testArray = Array.from({ length: 10000 }, (_, i) => i);
const testSet = new Set(testArray);

benchmark('Array includes', (n) => {
  for (let i = 0; i < n; i++) {
    const exists = testArray.includes(5000);
  }
});

benchmark('Set has', (n) => {
  for (let i = 0; i < n; i++) {
    const exists = testSet.has(5000);
  }
});

// Results typically show Set.has() is significantly faster
// Array.includes() is O(n), Set.has() is O(1)

// Deduplication performance
const duplicateArray = Array.from({ length: 10000 }, () =>
  Math.floor(Math.random() * 1000)
);

benchmark('Manual deduplication', (n) => {
  const unique = [];
  for (const item of duplicateArray) {
    if (!unique.includes(item)) {
      unique.push(item);
    }
  }
});

benchmark('Set deduplication', (n) => {
  const unique = [...new Set(duplicateArray)];
});

// Set-based deduplication is dramatically faster
```

## Real-World Applications

### Application 1: Caching System

```javascript
// LRU Cache implementation using Map
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  size() {
    return this.cache.size;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const cache = new LRUCache(3);
cache.put('a', 1);
cache.put('b', 2);
cache.put('c', 3);

console.log(cache.get('a')); // 1 (moves 'a' to most recent)
cache.put('d', 4); // Evicts 'b' (least recent)

console.log(cache.get('b')); // -1 (evicted)
console.log(cache.get('c')); // 3
```

### Application 2: Event System with Weak References

```javascript
// Memory-safe event emitter using WeakMap
class SafeEventEmitter {
  constructor() {
    this.listeners = new Map();
    this.objectListeners = new WeakMap();
  }

  on(event, listener, context = null) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listenerData = { listener, context };
    this.listeners.get(event).add(listenerData);

    // Track by context object if provided
    if (context) {
      if (!this.objectListeners.has(context)) {
        this.objectListeners.set(context, new Set());
      }
      this.objectListeners.get(context).add({ event, listenerData });
    }

    return () => this.off(event, listener, context);
  }

  off(event, listener, context = null) {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    for (const data of eventListeners) {
      if (data.listener === listener && data.context === context) {
        eventListeners.delete(data);
        break;
      }
    }
  }

  emit(event, ...args) {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    for (const { listener, context } of eventListeners) {
      listener.apply(context, args);
    }
  }

  // Remove all listeners for a specific context object
  removeAllForContext(context) {
    const contextListeners = this.objectListeners.get(context);
    if (!contextListeners) return;

    for (const { event, listenerData } of contextListeners) {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listenerData);
      }
    }

    this.objectListeners.delete(context);
  }
}

// Usage
const emitter = new SafeEventEmitter();

class Component {
  constructor(name) {
    this.name = name;
    this.unsubscribe = emitter.on('update', this.handleUpdate, this);
  }

  handleUpdate(data) {
    console.log(`${this.name} received:`, data);
  }

  destroy() {
    this.unsubscribe();
    // or: emitter.removeAllForContext(this);
  }
}

const comp = new Component('MyComponent');
emitter.emit('update', { value: 42 }); // MyComponent received: { value: 42 }
comp.destroy();
emitter.emit('update', { value: 100 }); // No output (listener removed)
```

### Application 3: Graph Data Structure

```javascript
// Graph using Map and Set
class Graph {
  constructor(directed = false) {
    this.adjacencyList = new Map();
    this.directed = directed;
  }

  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, new Set());
    }
    return this;
  }

  addEdge(vertex1, vertex2, weight = 1) {
    this.addVertex(vertex1);
    this.addVertex(vertex2);

    this.adjacencyList.get(vertex1).add({ node: vertex2, weight });

    if (!this.directed) {
      this.adjacencyList.get(vertex2).add({ node: vertex1, weight });
    }

    return this;
  }

  removeEdge(vertex1, vertex2) {
    const edges1 = this.adjacencyList.get(vertex1);
    if (edges1) {
      for (const edge of edges1) {
        if (edge.node === vertex2) {
          edges1.delete(edge);
          break;
        }
      }
    }

    if (!this.directed) {
      const edges2 = this.adjacencyList.get(vertex2);
      if (edges2) {
        for (const edge of edges2) {
          if (edge.node === vertex1) {
            edges2.delete(edge);
            break;
          }
        }
      }
    }

    return this;
  }

  removeVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) return this;

    // Remove all edges pointing to this vertex
    for (const [v, edges] of this.adjacencyList) {
      for (const edge of edges) {
        if (edge.node === vertex) {
          edges.delete(edge);
        }
      }
    }

    this.adjacencyList.delete(vertex);
    return this;
  }

  getNeighbors(vertex) {
    return this.adjacencyList.get(vertex) || new Set();
  }

  hasEdge(vertex1, vertex2) {
    const edges = this.adjacencyList.get(vertex1);
    if (!edges) return false;

    for (const edge of edges) {
      if (edge.node === vertex2) return true;
    }
    return false;
  }

  // Breadth-First Search
  bfs(start, callback) {
    const visited = new Set();
    const queue = [start];
    visited.add(start);

    while (queue.length > 0) {
      const vertex = queue.shift();
      callback(vertex);

      for (const { node } of this.getNeighbors(vertex)) {
        if (!visited.has(node)) {
          visited.add(node);
          queue.push(node);
        }
      }
    }
  }

  // Depth-First Search
  dfs(start, callback, visited = new Set()) {
    visited.add(start);
    callback(start);

    for (const { node } of this.getNeighbors(start)) {
      if (!visited.has(node)) {
        this.dfs(node, callback, visited);
      }
    }
  }

  // Find shortest path (BFS for unweighted)
  shortestPath(start, end) {
    const visited = new Set();
    const queue = [[start, [start]]];
    visited.add(start);

    while (queue.length > 0) {
      const [vertex, path] = queue.shift();

      if (vertex === end) {
        return path;
      }

      for (const { node } of this.getNeighbors(vertex)) {
        if (!visited.has(node)) {
          visited.add(node);
          queue.push([node, [...path, node]]);
        }
      }
    }

    return null; // No path found
  }
}

// Usage
const graph = new Graph();
graph
  .addEdge('A', 'B')
  .addEdge('A', 'C')
  .addEdge('B', 'D')
  .addEdge('C', 'D')
  .addEdge('D', 'E');

console.log('BFS traversal:');
graph.bfs('A', v => console.log(v)); // A, B, C, D, E

console.log('Shortest path A to E:', graph.shortestPath('A', 'E'));
// ['A', 'B', 'D', 'E'] or ['A', 'C', 'D', 'E']
```

### Application 4: Multi-Key Map

```javascript
// Map with composite keys
class MultiKeyMap {
  constructor() {
    this.map = new Map();
  }

  #getKey(keys) {
    return JSON.stringify(keys);
  }

  set(keys, value) {
    this.map.set(this.#getKey(keys), value);
    return this;
  }

  get(keys) {
    return this.map.get(this.#getKey(keys));
  }

  has(keys) {
    return this.map.has(this.#getKey(keys));
  }

  delete(keys) {
    return this.map.delete(this.#getKey(keys));
  }

  clear() {
    this.map.clear();
  }

  get size() {
    return this.map.size;
  }
}

// Usage
const cache = new MultiKeyMap();

// Cache database query results by multiple parameters
cache.set(['users', 'active', 'admin'], [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
]);

cache.set(['users', 'inactive', 'user'], [
  { id: 3, name: 'Charlie' }
]);

console.log(cache.get(['users', 'active', 'admin']));
// [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]

console.log(cache.has(['users', 'inactive', 'user'])); // true
```

### Application 5: Bidirectional Map

```javascript
// Map that allows lookup by both key and value
class BiMap {
  constructor() {
    this.keyToValue = new Map();
    this.valueToKey = new Map();
  }

  set(key, value) {
    // Remove existing mappings
    if (this.keyToValue.has(key)) {
      this.valueToKey.delete(this.keyToValue.get(key));
    }
    if (this.valueToKey.has(value)) {
      this.keyToValue.delete(this.valueToKey.get(value));
    }

    this.keyToValue.set(key, value);
    this.valueToKey.set(value, key);
    return this;
  }

  getByKey(key) {
    return this.keyToValue.get(key);
  }

  getByValue(value) {
    return this.valueToKey.get(value);
  }

  hasKey(key) {
    return this.keyToValue.has(key);
  }

  hasValue(value) {
    return this.valueToKey.has(value);
  }

  deleteByKey(key) {
    const value = this.keyToValue.get(key);
    this.keyToValue.delete(key);
    this.valueToKey.delete(value);
  }

  deleteByValue(value) {
    const key = this.valueToKey.get(value);
    this.valueToKey.delete(value);
    this.keyToValue.delete(key);
  }

  get size() {
    return this.keyToValue.size;
  }

  keys() {
    return this.keyToValue.keys();
  }

  values() {
    return this.keyToValue.values();
  }
}

// Usage: Language codes and names
const languages = new BiMap();
languages.set('en', 'English');
languages.set('es', 'Spanish');
languages.set('fr', 'French');
languages.set('de', 'German');

console.log(languages.getByKey('en'));      // 'English'
console.log(languages.getByValue('Spanish')); // 'es'
```

## Common Patterns and Recipes

### Pattern 1: Counting Occurrences

```javascript
// Count occurrences using Map
function countOccurrences(arr) {
  const counts = new Map();

  for (const item of arr) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }

  return counts;
}

const words = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];
const wordCounts = countOccurrences(words);

console.log(wordCounts.get('apple')); // 3
console.log([...wordCounts.entries()]);
// [['apple', 3], ['banana', 2], ['orange', 1]]

// Find most frequent
function mostFrequent(arr) {
  const counts = countOccurrences(arr);
  let maxCount = 0;
  let maxItem = null;

  for (const [item, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxItem = item;
    }
  }

  return { item: maxItem, count: maxCount };
}

console.log(mostFrequent(words)); // { item: 'apple', count: 3 }
```

### Pattern 2: Grouping Data

```javascript
// Group by property using Map
function groupBy(arr, keyFn) {
  const groups = new Map();

  for (const item of arr) {
    const key = keyFn(item);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(item);
  }

  return groups;
}

const people = [
  { name: 'Alice', age: 25, department: 'Engineering' },
  { name: 'Bob', age: 30, department: 'Marketing' },
  { name: 'Charlie', age: 25, department: 'Engineering' },
  { name: 'Diana', age: 35, department: 'Marketing' },
  { name: 'Eve', age: 30, department: 'Engineering' }
];

// Group by department
const byDepartment = groupBy(people, p => p.department);
console.log([...byDepartment.keys()]); // ['Engineering', 'Marketing']

// Group by age
const byAge = groupBy(people, p => p.age);
console.log(byAge.get(25)); // [{ name: 'Alice', ... }, { name: 'Charlie', ... }]

// Group by multiple keys
function multiGroupBy(arr, ...keyFns) {
  const groups = new Map();

  for (const item of arr) {
    const keys = keyFns.map(fn => fn(item));
    const compositeKey = JSON.stringify(keys);

    if (!groups.has(compositeKey)) {
      groups.set(compositeKey, []);
    }

    groups.get(compositeKey).push(item);
  }

  return groups;
}

const byAgeAndDept = multiGroupBy(
  people,
  p => p.age,
  p => p.department
);
```

### Pattern 3: Deduplication Strategies

```javascript
// Simple deduplication
const numbers = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
const unique = [...new Set(numbers)];
console.log(unique); // [1, 2, 3, 4]

// Deduplicate objects by property
function deduplicateBy(arr, keyFn) {
  const seen = new Map();

  return arr.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.set(key, true);
    return true;
  });
}

const products = [
  { id: 1, name: 'Apple', price: 1.5 },
  { id: 2, name: 'Banana', price: 0.5 },
  { id: 1, name: 'Apple', price: 2.0 }, // Duplicate id
  { id: 3, name: 'Orange', price: 1.0 }
];

const uniqueProducts = deduplicateBy(products, p => p.id);
console.log(uniqueProducts.length); // 3

// Keep last occurrence instead of first
function deduplicateByLast(arr, keyFn) {
  const map = new Map();

  for (const item of arr) {
    map.set(keyFn(item), item);
  }

  return [...map.values()];
}

const withLatestPrices = deduplicateByLast(products, p => p.id);
console.log(withLatestPrices.find(p => p.id === 1).price); // 2.0
```

### Pattern 4: Indexing Collections

```javascript
// Create index for fast lookups
function createIndex(arr, keyFn) {
  const index = new Map();

  for (const item of arr) {
    index.set(keyFn(item), item);
  }

  return {
    get(key) {
      return index.get(key);
    },
    has(key) {
      return index.has(key);
    },
    all() {
      return [...index.values()];
    },
    keys() {
      return [...index.keys()];
    }
  };
}

const users = [
  { id: 1, email: 'alice@example.com', name: 'Alice' },
  { id: 2, email: 'bob@example.com', name: 'Bob' },
  { id: 3, email: 'charlie@example.com', name: 'Charlie' }
];

const userById = createIndex(users, u => u.id);
const userByEmail = createIndex(users, u => u.email);

console.log(userById.get(2)); // { id: 2, email: 'bob@example.com', name: 'Bob' }
console.log(userByEmail.get('alice@example.com')); // { id: 1, ... }

// Multi-index
function createMultiIndex(arr, ...indexDefs) {
  const indexes = new Map();

  for (const { name, keyFn } of indexDefs) {
    indexes.set(name, createIndex(arr, keyFn));
  }

  return {
    by(indexName) {
      return indexes.get(indexName);
    }
  };
}

const userIndexes = createMultiIndex(
  users,
  { name: 'id', keyFn: u => u.id },
  { name: 'email', keyFn: u => u.email }
);

console.log(userIndexes.by('id').get(1));
console.log(userIndexes.by('email').get('bob@example.com'));
```

### Pattern 5: Set-Based Filtering

```javascript
// Filter using Set for O(1) lookups
function filterBySet(arr, allowedValues) {
  const allowedSet = new Set(allowedValues);
  return arr.filter(item => allowedSet.has(item));
}

const allIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const activeIds = [2, 4, 6, 8];
const active = filterBySet(allIds, activeIds);
console.log(active); // [2, 4, 6, 8]

// Filter objects by property
function filterByProperty(arr, property, allowedValues) {
  const allowedSet = new Set(allowedValues);
  return arr.filter(item => allowedSet.has(item[property]));
}

const orders = [
  { id: 1, status: 'pending' },
  { id: 2, status: 'shipped' },
  { id: 3, status: 'delivered' },
  { id: 4, status: 'pending' },
  { id: 5, status: 'cancelled' }
];

const activeOrders = filterByProperty(
  orders,
  'status',
  ['pending', 'shipped']
);
console.log(activeOrders.map(o => o.id)); // [1, 2, 4]
```

## Interview Questions

### Question 1: Implement a DefaultMap

```javascript
// Question: Create a Map that returns a default value for missing keys
class DefaultMap extends Map {
  constructor(defaultFactory, entries = []) {
    super(entries);
    this.defaultFactory = defaultFactory;
  }

  get(key) {
    if (!this.has(key)) {
      this.set(key, this.defaultFactory(key));
    }
    return super.get(key);
  }
}

// Usage
const counter = new DefaultMap(() => 0);
counter.set('a', counter.get('a') + 1);
counter.set('a', counter.get('a') + 1);
counter.set('b', counter.get('b') + 1);

console.log(counter.get('a')); // 2
console.log(counter.get('b')); // 1
console.log(counter.get('c')); // 0 (default)

// Group items
const groups = new DefaultMap(() => []);
const words = ['apple', 'banana', 'apricot', 'blueberry'];

for (const word of words) {
  groups.get(word[0]).push(word);
}

console.log(groups.get('a')); // ['apple', 'apricot']
console.log(groups.get('b')); // ['banana', 'blueberry']
```

### Question 2: Find First Non-Repeating Character

```javascript
// Question: Find the first non-repeating character in a string
function firstNonRepeating(str) {
  const charCount = new Map();

  // Count occurrences
  for (const char of str) {
    charCount.set(char, (charCount.get(char) || 0) + 1);
  }

  // Find first with count 1 (Map preserves insertion order)
  for (const [char, count] of charCount) {
    if (count === 1) {
      return char;
    }
  }

  return null;
}

console.log(firstNonRepeating('aabbccdde')); // 'e'
console.log(firstNonRepeating('abcabc')); // null
console.log(firstNonRepeating('aabbc')); // 'c'
```

### Question 3: Two Sum Problem

```javascript
// Question: Find two numbers that add up to target
function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    seen.set(nums[i], i);
  }

  return null;
}

console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6)); // [1, 2]
console.log(twoSum([3, 3], 6)); // [0, 1]
```

### Question 4: Find All Duplicates

```javascript
// Question: Find all duplicate values in an array
function findDuplicates(arr) {
  const seen = new Set();
  const duplicates = new Set();

  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }

  return [...duplicates];
}

console.log(findDuplicates([1, 2, 3, 2, 4, 3, 5])); // [2, 3]
console.log(findDuplicates([1, 1, 1, 1])); // [1]
console.log(findDuplicates([1, 2, 3, 4])); // []
```

### Question 5: Implement Set Operations

```javascript
// Question: Implement union, intersection, difference for Sets
class SetOperations {
  static union(setA, setB) {
    return new Set([...setA, ...setB]);
  }

  static intersection(setA, setB) {
    return new Set([...setA].filter(x => setB.has(x)));
  }

  static difference(setA, setB) {
    return new Set([...setA].filter(x => !setB.has(x)));
  }

  static symmetricDifference(setA, setB) {
    return new Set([
      ...[...setA].filter(x => !setB.has(x)),
      ...[...setB].filter(x => !setA.has(x))
    ]);
  }

  static isSubset(setA, setB) {
    return [...setA].every(x => setB.has(x));
  }

  static isSuperset(setA, setB) {
    return [...setB].every(x => setA.has(x));
  }

  static isDisjoint(setA, setB) {
    return [...setA].every(x => !setB.has(x));
  }
}

const A = new Set([1, 2, 3, 4]);
const B = new Set([3, 4, 5, 6]);

console.log([...SetOperations.union(A, B)]);        // [1, 2, 3, 4, 5, 6]
console.log([...SetOperations.intersection(A, B)]); // [3, 4]
console.log([...SetOperations.difference(A, B)]);   // [1, 2]
console.log([...SetOperations.symmetricDifference(A, B)]); // [1, 2, 5, 6]
```

### Question 6: Group Anagrams

```javascript
// Question: Group anagrams together
function groupAnagrams(words) {
  const groups = new Map();

  for (const word of words) {
    // Create key by sorting characters
    const key = [...word].sort().join('');

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(word);
  }

  return [...groups.values()];
}

const words = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'];
console.log(groupAnagrams(words));
// [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]
```

### Question 7: LRU Cache

```javascript
// Question: Implement an LRU (Least Recently Used) cache
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }

    // Move to end (most recent)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  put(key, value) {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Remove oldest if at capacity
    else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }
}

const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1)); // 1
cache.put(3, 3);           // Evicts key 2
console.log(cache.get(2)); // -1 (not found)
cache.put(4, 4);           // Evicts key 1
console.log(cache.get(1)); // -1 (not found)
console.log(cache.get(3)); // 3
console.log(cache.get(4)); // 4
```

## Summary

JavaScript's Map, Set, WeakMap, and WeakSet collections provide powerful tools for managing data:

### Map
- Key-value pairs with any type as key
- Maintains insertion order
- O(1) average lookup, insertion, deletion
- Use for: caching, lookup tables, object-keyed data

### Set
- Collection of unique values
- Maintains insertion order
- O(1) average lookup
- Use for: deduplication, membership testing, set operations

### WeakMap
- Object keys only, held weakly
- Allows garbage collection of keys
- Not enumerable
- Use for: private data, metadata, memoization

### WeakSet
- Object values only, held weakly
- Allows garbage collection of values
- Not enumerable
- Use for: marking objects, tracking states, preventing duplicates

### Key Takeaways

1. **Choose Map over Object** when:
   - Keys are not strings
   - You need to iterate in insertion order
   - You frequently add/remove entries
   - You need the size property

2. **Choose Set over Array** when:
   - You need unique values
   - You need fast lookup (has)
   - You need set operations (union, intersection)

3. **Choose WeakMap/WeakSet** when:
   - You want automatic memory cleanup
   - You're storing metadata about objects
   - You don't need to enumerate the contents

4. **Performance considerations**:
   - Map/Set: O(1) for get, set, has, delete
   - Object: O(1) for property access but varies
   - Array: O(n) for includes, indexOf

Mastering these collections enables you to write more efficient, cleaner, and more maintainable JavaScript code.
