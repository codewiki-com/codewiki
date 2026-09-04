---
title: Iterators and Generators
description: Complete guide to JavaScript iterators and generators, Symbol.iterator and yield
track: javascript
section: core
difficulty: advanced
tags:
  - JavaScript
  - Iterators
  - Generators
  - Symbol
status: imported
origin: old/src/content/docs/javascript/iterators-generators.en.md
divergence: 0.368
issues:
  - divergent
legacy:
  category: JavaScript
  subcategory: Advanced Features
  order: 14
  lastUpdated: 2026-01-07
---

Iterators and generators are powerful features introduced in ES6 that provide a standardized way to traverse data structures and create custom iteration behaviors. They form the foundation for many JavaScript features including `for...of` loops, the spread operator, and async iteration patterns.

## Understanding Iteration

Before diving into iterators and generators, it is important to understand why they exist. JavaScript has many built-in data structures like arrays, strings, maps, and sets. Each of these can be traversed, but historically there was no unified protocol for doing so. Iterators solve this problem by providing a standard interface for sequential access to elements.

## The Iterator Protocol

An iterator is any object that implements the **iterator protocol** by having a `next()` method that returns an object with two properties:

- `value`: The next value in the sequence
- `done`: A boolean indicating whether the sequence is complete

```javascript
// Manual iterator implementation
const createCounterIterator = (max) => {
  let count = 0;

  return {
    next() {
      if (count < max) {
        return { value: count++, done: false };
      }
      return { value: undefined, done: true };
    }
  };
};

const counter = createCounterIterator(3);

console.log(counter.next()); // { value: 0, done: false }
console.log(counter.next()); // { value: 1, done: false }
console.log(counter.next()); // { value: 2, done: false }
console.log(counter.next()); // { value: undefined, done: true }
```

## The Iterable Protocol and Symbol.iterator

An **iterable** is any object that implements the iterable protocol by having a `[Symbol.iterator]` method that returns an iterator. This is what allows objects to work with `for...of` loops and the spread operator.

```javascript
// Making a custom object iterable
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
        }
        return { value: undefined, done: true };
      }
    };
  }
};

// Now we can use for...of
for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// And the spread operator
const numbers = [...range]; // [1, 2, 3, 4, 5]
```

### Built-in Iterables

Many JavaScript objects are already iterable:

```javascript
// Arrays
const arr = [1, 2, 3];
for (const item of arr) {
  console.log(item);
}

// Strings
const str = "Hello";
for (const char of str) {
  console.log(char); // H, e, l, l, o
}

// Maps
const map = new Map([['a', 1], ['b', 2]]);
for (const [key, value] of map) {
  console.log(key, value);
}

// Sets
const set = new Set([1, 2, 3]);
for (const item of set) {
  console.log(item);
}

// Arguments object
function example() {
  for (const arg of arguments) {
    console.log(arg);
  }
}

// NodeList (DOM)
const elements = document.querySelectorAll('div');
for (const el of elements) {
  console.log(el);
}
```

### Accessing the Default Iterator

You can access an object's iterator directly using `Symbol.iterator`:

```javascript
const arr = ['a', 'b', 'c'];
const iterator = arr[Symbol.iterator]();

console.log(iterator.next()); // { value: 'a', done: false }
console.log(iterator.next()); // { value: 'b', done: false }
console.log(iterator.next()); // { value: 'c', done: false }
console.log(iterator.next()); // { value: undefined, done: true }
```

## Generators

Generators are special functions that can pause execution and resume later, making it much easier to create iterators. They are defined using the `function*` syntax and use the `yield` keyword to produce values.

### Basic Generator Syntax

```javascript
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

// Generators are iterable
for (const value of simpleGenerator()) {
  console.log(value); // 1, 2, 3
}
```

### The yield Keyword

The `yield` keyword pauses the generator and returns a value. When `next()` is called again, execution resumes from where it left off.

```javascript
function* countUp() {
  console.log('Starting...');
  yield 1;
  console.log('After first yield');
  yield 2;
  console.log('After second yield');
  yield 3;
  console.log('Finished');
}

const counter = countUp();

counter.next();
// Starting...
// { value: 1, done: false }

counter.next();
// After first yield
// { value: 2, done: false }

counter.next();
// After second yield
// { value: 3, done: false }

counter.next();
// Finished
// { value: undefined, done: true }
```

### Passing Values to Generators

The `next()` method can accept a value that becomes the result of the `yield` expression:

```javascript
function* conversation() {
  const name = yield 'What is your name?';
  const hobby = yield `Hello ${name}! What is your hobby?`;
  return `Nice to meet you ${name}. ${hobby} sounds fun!`;
}

const chat = conversation();

console.log(chat.next().value);
// What is your name?

console.log(chat.next('Alice').value);
// Hello Alice! What is your hobby?

console.log(chat.next('Coding').value);
// Nice to meet you Alice. Coding sounds fun!
```

### Generator Return Values

Generators can use `return` to specify a final value:

```javascript
function* withReturn() {
  yield 1;
  yield 2;
  return 'final value';
}

const gen = withReturn();

console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 'final value', done: true }
console.log(gen.next()); // { value: undefined, done: true }

// Note: for...of ignores the return value
for (const v of withReturn()) {
  console.log(v); // Only 1, 2 (not 'final value')
}
```

### Delegating to Other Generators with yield*

The `yield*` expression delegates to another generator or iterable:

```javascript
function* generator1() {
  yield 1;
  yield 2;
}

function* generator2() {
  yield 'a';
  yield* generator1(); // Delegate to generator1
  yield 'b';
}

const gen = generator2();
console.log([...gen]); // ['a', 1, 2, 'b']

// yield* works with any iterable
function* iterateArray() {
  yield* [1, 2, 3];
  yield* 'abc';
}

console.log([...iterateArray()]); // [1, 2, 3, 'a', 'b', 'c']
```

### Generator Error Handling

Generators support error handling with `throw()` and `return()` methods:

```javascript
function* errorHandlingGenerator() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } catch (error) {
    console.log('Caught:', error.message);
    yield 'error handled';
  } finally {
    console.log('Cleanup');
  }
}

const gen = errorHandlingGenerator();

console.log(gen.next()); // { value: 1, done: false }
console.log(gen.throw(new Error('Something went wrong')));
// Caught: Something went wrong
// { value: 'error handled', done: false }
console.log(gen.next());
// Cleanup
// { value: undefined, done: true }

// Using return() to terminate early
const gen2 = errorHandlingGenerator();
console.log(gen2.next()); // { value: 1, done: false }
console.log(gen2.return('early exit'));
// Cleanup
// { value: 'early exit', done: true }
```

## Practical Examples

### Infinite Sequences

Generators are perfect for representing infinite sequences:

```javascript
function* fibonacci() {
  let prev = 0;
  let curr = 1;

  while (true) {
    yield curr;
    [prev, curr] = [curr, prev + curr];
  }
}

// Get first 10 Fibonacci numbers
const fib = fibonacci();
const first10 = [];
for (let i = 0; i < 10; i++) {
  first10.push(fib.next().value);
}
console.log(first10); // [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]

// Utility function for taking n items
function* take(iterable, n) {
  let count = 0;
  for (const item of iterable) {
    if (count >= n) return;
    yield item;
    count++;
  }
}

console.log([...take(fibonacci(), 10)]);
// [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
```

### ID Generator

```javascript
function* idGenerator(prefix = 'id') {
  let id = 1;
  while (true) {
    yield `${prefix}_${id++}`;
  }
}

const userIdGen = idGenerator('user');
const postIdGen = idGenerator('post');

console.log(userIdGen.next().value); // user_1
console.log(userIdGen.next().value); // user_2
console.log(postIdGen.next().value); // post_1
console.log(userIdGen.next().value); // user_3
```

### Tree Traversal

```javascript
class TreeNode {
  constructor(value, children = []) {
    this.value = value;
    this.children = children;
  }

  // Depth-first traversal
  *[Symbol.iterator]() {
    yield this.value;
    for (const child of this.children) {
      yield* child;
    }
  }

  // Breadth-first traversal
  *breadthFirst() {
    const queue = [this];
    while (queue.length > 0) {
      const node = queue.shift();
      yield node.value;
      queue.push(...node.children);
    }
  }
}

const tree = new TreeNode('root', [
  new TreeNode('a', [
    new TreeNode('a1'),
    new TreeNode('a2')
  ]),
  new TreeNode('b', [
    new TreeNode('b1')
  ])
]);

console.log([...tree]);
// ['root', 'a', 'a1', 'a2', 'b', 'b1']

console.log([...tree.breadthFirst()]);
// ['root', 'a', 'b', 'a1', 'a2', 'b1']
```

### Paginated Data Fetching

```javascript
function* paginatedFetch(baseUrl, pageSize = 10) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    // In real usage, this would be async
    const response = {
      data: Array.from({ length: pageSize }, (_, i) =>
        `Item ${(page - 1) * pageSize + i + 1}`
      ),
      hasNextPage: page < 5 // Simulate 5 pages
    };

    yield* response.data;
    hasMore = response.hasNextPage;
    page++;
  }
}

const items = paginatedFetch('/api/items', 3);
console.log([...take(items, 10)]);
// First 10 items across multiple "pages"
```

### State Machine

```javascript
function* trafficLight() {
  while (true) {
    yield 'green';
    yield 'yellow';
    yield 'red';
  }
}

const light = trafficLight();
console.log(light.next().value); // green
console.log(light.next().value); // yellow
console.log(light.next().value); // red
console.log(light.next().value); // green (cycles)
```

## Async Iterators and Generators

ES2018 introduced async iterators and generators for handling asynchronous sequences.

### Async Iterator Protocol

```javascript
const asyncIterable = {
  [Symbol.asyncIterator]() {
    let i = 0;
    return {
      async next() {
        if (i < 3) {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 100));
          return { value: i++, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
};

// Use for-await-of to consume
async function consumeAsync() {
  for await (const value of asyncIterable) {
    console.log(value); // 0, 1, 2 (with delays)
  }
}

consumeAsync();
```

### Async Generators

```javascript
async function* asyncGenerator() {
  yield await Promise.resolve(1);
  yield await Promise.resolve(2);
  yield await Promise.resolve(3);
}

async function consume() {
  for await (const value of asyncGenerator()) {
    console.log(value);
  }
}

consume(); // 1, 2, 3

// Real-world example: streaming API data
async function* fetchUsers(url) {
  let nextUrl = url;

  while (nextUrl) {
    const response = await fetch(nextUrl);
    const data = await response.json();

    for (const user of data.users) {
      yield user;
    }

    nextUrl = data.nextPage;
  }
}

async function processUsers() {
  for await (const user of fetchUsers('/api/users')) {
    console.log(user.name);
    // Process each user as they arrive
  }
}
```

### Async Generator for Real-Time Data

```javascript
async function* pollEndpoint(url, interval = 1000) {
  while (true) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      yield data;
    } catch (error) {
      yield { error: error.message };
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

// Usage
async function monitor() {
  for await (const status of pollEndpoint('/api/status', 5000)) {
    if (status.error) {
      console.error('Error:', status.error);
    } else {
      console.log('Status:', status);
    }

    // Break condition
    if (status.shutdown) break;
  }
}
```

## Using Iterators with the Spread Operator and Destructuring

Iterables integrate seamlessly with modern JavaScript syntax:

```javascript
function* range(start, end) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

// Spread operator
const arr = [...range(1, 5)]; // [1, 2, 3, 4, 5]

// Destructuring
const [first, second, ...rest] = range(1, 5);
console.log(first);  // 1
console.log(second); // 2
console.log(rest);   // [3, 4, 5]

// Array.from
const doubled = Array.from(range(1, 5), x => x * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// Function arguments
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
console.log(sum(...range(1, 5))); // 15
```

## Iterator Helpers

Modern JavaScript is adding built-in iterator helper methods. As of 2025, these are available in most environments:

```javascript
function* naturals() {
  let n = 1;
  while (true) yield n++;
}

// Iterator helpers (when available)
const result = naturals()
  .take(10)
  .filter(n => n % 2 === 0)
  .map(n => n * 2)
  .toArray();

console.log(result); // [4, 8, 12, 16, 20]

// Polyfill-style implementation
function* map(iterable, fn) {
  for (const item of iterable) {
    yield fn(item);
  }
}

function* filter(iterable, predicate) {
  for (const item of iterable) {
    if (predicate(item)) {
      yield item;
    }
  }
}

function* take(iterable, n) {
  let count = 0;
  for (const item of iterable) {
    if (count >= n) return;
    yield item;
    count++;
  }
}

// Usage
const evensDoubled = [...take(
  map(
    filter(naturals(), n => n % 2 === 0),
    n => n * 2
  ),
  5
)];
console.log(evensDoubled); // [4, 8, 12, 16, 20]
```

## Common Patterns and Best Practices

### Making Classes Iterable

```javascript
class Collection {
  #items = [];

  add(item) {
    this.#items.push(item);
    return this;
  }

  *[Symbol.iterator]() {
    yield* this.#items;
  }

  *reverse() {
    for (let i = this.#items.length - 1; i >= 0; i--) {
      yield this.#items[i];
    }
  }

  *filter(predicate) {
    for (const item of this) {
      if (predicate(item)) yield item;
    }
  }
}

const collection = new Collection();
collection.add(1).add(2).add(3).add(4).add(5);

console.log([...collection]); // [1, 2, 3, 4, 5]
console.log([...collection.reverse()]); // [5, 4, 3, 2, 1]
console.log([...collection.filter(x => x > 2)]); // [3, 4, 5]
```

### Composable Iteration Utilities

```javascript
const iterUtils = {
  *map(iterable, fn) {
    let index = 0;
    for (const item of iterable) {
      yield fn(item, index++);
    }
  },

  *filter(iterable, predicate) {
    for (const item of iterable) {
      if (predicate(item)) yield item;
    }
  },

  *take(iterable, n) {
    let count = 0;
    for (const item of iterable) {
      if (count++ >= n) return;
      yield item;
    }
  },

  *skip(iterable, n) {
    let count = 0;
    for (const item of iterable) {
      if (count++ >= n) yield item;
    }
  },

  *zip(...iterables) {
    const iterators = iterables.map(it => it[Symbol.iterator]());
    while (true) {
      const results = iterators.map(it => it.next());
      if (results.some(r => r.done)) return;
      yield results.map(r => r.value);
    }
  },

  reduce(iterable, fn, initial) {
    let accumulator = initial;
    let index = 0;
    for (const item of iterable) {
      accumulator = fn(accumulator, item, index++);
    }
    return accumulator;
  }
};

// Usage
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const letters = ['a', 'b', 'c', 'd', 'e'];

const result = iterUtils.reduce(
  iterUtils.map(
    iterUtils.filter(numbers, n => n % 2 === 0),
    n => n * 2
  ),
  (sum, n) => sum + n,
  0
);
console.log(result); // 60 (4+8+12+16+20)

console.log([...iterUtils.zip(numbers, letters)]);
// [[1,'a'], [2,'b'], [3,'c'], [4,'d'], [5,'e']]
```

## Performance Considerations

Generators are lazily evaluated, meaning they only compute values when requested. This provides significant memory benefits for large datasets:

```javascript
// Memory-intensive: creates entire array
const eager = Array.from({ length: 1000000 }, (_, i) => i * 2);
const firstThree = eager.slice(0, 3);

// Memory-efficient: only computes needed values
function* lazyDoubles() {
  let i = 0;
  while (true) {
    yield i++ * 2;
  }
}

const lazy = lazyDoubles();
const firstThreeLazy = [lazy.next().value, lazy.next().value, lazy.next().value];
```

However, generators do have overhead compared to simple loops. For small, fixed-size collections, regular arrays may be faster.

## Summary

Iterators and generators are fundamental to modern JavaScript:

- **Iterators** provide a standard protocol for sequential access to data
- **Symbol.iterator** makes objects usable with `for...of` and spread syntax
- **Generators** simplify iterator creation with `function*` and `yield`
- **yield*** delegates to other iterables
- **Async generators** handle asynchronous sequences elegantly
- Lazy evaluation makes generators memory-efficient for large or infinite sequences

Understanding these concepts opens up powerful patterns for data processing, state management, and asynchronous programming in JavaScript.
