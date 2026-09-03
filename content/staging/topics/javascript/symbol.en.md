---
title: JavaScript Symbol Explained
description: Deep dive into JavaScript Symbol primitive type including built-in Symbols and practical applications
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - Symbol
  - ES6
  - metaprogramming
status: imported
origin: old/src/content/docs/javascript/symbol.en.md
divergence: 0.202
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Data Types
  order: 23
  lastUpdated: 2026-01-07
---

Symbol is a primitive data type introduced in ECMAScript 2015 (ES6) that creates unique, immutable identifiers. Unlike other primitives, each Symbol is guaranteed to be unique, making them ideal for creating property keys that won't collide with other properties.

## What is a Symbol?

A Symbol is a unique and immutable primitive value that can be used as an identifier for object properties. Think of Symbols as unique IDs that JavaScript guarantees will never conflict with any other value.

```javascript
// Creating symbols
const sym1 = Symbol();
const sym2 = Symbol();

console.log(sym1 === sym2); // false - every Symbol is unique

// Symbols with descriptions (for debugging)
const sym3 = Symbol('description');
const sym4 = Symbol('description');

console.log(sym3 === sym4); // false - still unique despite same description
console.log(sym3.toString()); // 'Symbol(description)'
console.log(sym3.description); // 'description' (ES2019+)
```

### Key Characteristics

1. **Uniqueness**: Every Symbol is unique, even with identical descriptions
2. **Immutability**: Symbols cannot be changed after creation
3. **Non-coercible**: Symbols don't auto-convert to strings or numbers
4. **Property keys**: Symbols can be used as object property keys

```javascript
// Symbols are not coercible to strings
const sym = Symbol('test');

// This throws TypeError
// console.log('Symbol: ' + sym);

// Explicit conversion is required
console.log('Symbol: ' + sym.toString()); // 'Symbol: Symbol(test)'
console.log(`Symbol: ${sym.description}`); // 'Symbol: test'

// Symbols are not numbers either
// console.log(sym + 1); // TypeError
```

## Creating Symbols

There are three ways to create symbols in JavaScript.

### Symbol() Constructor

The `Symbol()` function creates a new unique symbol each time it's called.

```javascript
// Without description
const id = Symbol();

// With description (recommended for debugging)
const userId = Symbol('user id');
const sessionId = Symbol('session id');

console.log(userId); // Symbol(user id)
console.log(typeof userId); // 'symbol'

// Cannot use 'new' keyword
// const sym = new Symbol(); // TypeError: Symbol is not a constructor
```

### Symbol.for() - Global Symbol Registry

`Symbol.for()` creates symbols in a global registry, allowing you to reuse the same symbol across your codebase or even across different realms (like iframes).

```javascript
// Create or retrieve a global symbol
const globalSym1 = Symbol.for('app.id');
const globalSym2 = Symbol.for('app.id');

console.log(globalSym1 === globalSym2); // true - same symbol from registry

// Compare with regular Symbol()
const localSym = Symbol('app.id');
console.log(globalSym1 === localSym); // false - different symbols

// Retrieve the key for a global symbol
console.log(Symbol.keyFor(globalSym1)); // 'app.id'
console.log(Symbol.keyFor(localSym)); // undefined - not in global registry
```

### Symbol.keyFor()

Retrieves the key for a symbol from the global registry.

```javascript
const globalSymbol = Symbol.for('my.key');
const localSymbol = Symbol('my.key');

console.log(Symbol.keyFor(globalSymbol)); // 'my.key'
console.log(Symbol.keyFor(localSymbol)); // undefined

// Useful for cross-realm communication
const SHARED_KEY = Symbol.for('shared.data');
// This same symbol can be retrieved in iframes or web workers
```

## Symbols as Object Properties

Symbols shine when used as object property keys, providing a way to create properties that won't conflict with other code.

### Basic Property Usage

```javascript
const id = Symbol('id');
const name = Symbol('name');

const user = {
  [id]: 12345,
  [name]: 'Alice',
  email: 'alice@example.com'
};

console.log(user[id]); // 12345
console.log(user[name]); // 'Alice'

// Symbol properties are not enumerable by default
console.log(Object.keys(user)); // ['email']
console.log(Object.getOwnPropertyNames(user)); // ['email']

// Use getOwnPropertySymbols to access symbol keys
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(id), Symbol(name)]

// Reflect.ownKeys returns all keys including symbols
console.log(Reflect.ownKeys(user)); // ['email', Symbol(id), Symbol(name)]
```

### Hidden Properties

Symbol properties are "hidden" from most iteration methods, making them useful for internal properties.

```javascript
const _internal = Symbol('internal');
const _validate = Symbol('validate');

class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
    this[_internal] = {
      createdAt: new Date(),
      version: 1
    };
  }

  [_validate]() {
    return this.email.includes('@');
  }

  save() {
    if (this[_validate]()) {
      console.log('Saving user...');
      this[_internal].version++;
      return true;
    }
    return false;
  }

  getMetadata() {
    return { ...this[_internal] };
  }
}

const user = new User('Alice', 'alice@example.com');

// Public properties are visible
console.log(Object.keys(user)); // ['name', 'email']

// Symbol properties are hidden from JSON serialization
console.log(JSON.stringify(user)); // {"name":"Alice","email":"alice@example.com"}

// But can still be accessed if you have the symbol
console.log(user[_internal]); // { createdAt: Date, version: 1 }
```

### Preventing Property Collisions

Symbols prevent accidental property overwrites when extending objects or working with third-party libraries.

```javascript
// Without symbols - risk of collision
const obj1 = { id: 1, name: 'Object 1' };

// Some library might add its own 'id' property
function addTracking(obj) {
  obj.id = Math.random(); // Overwrites existing id!
  return obj;
}

// With symbols - no collision
const trackingId = Symbol('tracking.id');

function addTrackingSafe(obj) {
  obj[trackingId] = Math.random();
  return obj;
}

const obj2 = { id: 1, name: 'Object 2' };
addTrackingSafe(obj2);

console.log(obj2.id); // 1 - preserved
console.log(obj2[trackingId]); // Random number - separate property
```

## Well-Known Symbols

JavaScript provides several built-in symbols that allow you to customize object behavior. These are called "well-known symbols" and are static properties of the Symbol object.

### Symbol.iterator

Makes objects iterable with `for...of` loops and the spread operator.

```javascript
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
        return { done: true };
      }
    };
  }
};

// Now we can iterate
for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// Spread operator works too
console.log([...range]); // [1, 2, 3, 4, 5]

// Array.from works
console.log(Array.from(range)); // [1, 2, 3, 4, 5]
```

### Symbol.asyncIterator

Enables asynchronous iteration with `for await...of` loops.

```javascript
const asyncDataSource = {
  data: ['First', 'Second', 'Third'],

  async *[Symbol.asyncIterator]() {
    for (const item of this.data) {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      yield item;
    }
  }
};

// Usage
async function processData() {
  for await (const item of asyncDataSource) {
    console.log(item);
  }
}

processData();
// Logs (with 100ms delays):
// First
// Second
// Third
```

### Symbol.toStringTag

Customizes the string returned by `Object.prototype.toString()`.

```javascript
class CustomCollection {
  get [Symbol.toStringTag]() {
    return 'CustomCollection';
  }
}

const collection = new CustomCollection();
console.log(Object.prototype.toString.call(collection));
// '[object CustomCollection]'

// Compare with built-in objects
console.log(Object.prototype.toString.call([])); // '[object Array]'
console.log(Object.prototype.toString.call(new Map())); // '[object Map]'
console.log(Object.prototype.toString.call(new Set())); // '[object Set]'

// Practical use: Type checking
function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

console.log(getType(collection)); // 'CustomCollection'
console.log(getType([])); // 'Array'
console.log(getType({})); // 'Object'
```

### Symbol.toPrimitive

Controls how objects are converted to primitive values.

```javascript
const money = {
  amount: 100,
  currency: 'USD',

  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case 'number':
        return this.amount;
      case 'string':
        return `${this.currency} ${this.amount}`;
      default: // 'default'
        return this.amount;
    }
  }
};

console.log(+money); // 100 (number hint)
console.log(`${money}`); // 'USD 100' (string hint)
console.log(money + 50); // 150 (default hint)
console.log(money == 100); // true (default hint)

// More complex example
class Temperature {
  constructor(celsius) {
    this.celsius = celsius;
  }

  get fahrenheit() {
    return (this.celsius * 9/5) + 32;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'string') {
      return `${this.celsius}C (${this.fahrenheit}F)`;
    }
    return this.celsius;
  }
}

const temp = new Temperature(25);
console.log(`Today: ${temp}`); // 'Today: 25C (77F)'
console.log(temp > 20); // true
console.log(temp + 5); // 30
```

### Symbol.hasInstance

Customizes the behavior of the `instanceof` operator.

```javascript
class MyArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}

console.log([] instanceof MyArray); // true
console.log([1, 2, 3] instanceof MyArray); // true
console.log({} instanceof MyArray); // false

// Practical use: Duck typing
class Thenable {
  static [Symbol.hasInstance](instance) {
    return instance !== null &&
           typeof instance === 'object' &&
           typeof instance.then === 'function';
  }
}

const promise = Promise.resolve(42);
const fakeThen = { then: () => {} };
const notThen = { value: 42 };

console.log(promise instanceof Thenable); // true
console.log(fakeThen instanceof Thenable); // true
console.log(notThen instanceof Thenable); // false
```

### Symbol.species

Specifies the constructor to use when creating derived objects.

```javascript
class MyArray extends Array {
  // Without this, map/filter/etc would return MyArray instances
  static get [Symbol.species]() {
    return Array;
  }
}

const myArr = new MyArray(1, 2, 3);
const mapped = myArr.map(x => x * 2);

console.log(myArr instanceof MyArray); // true
console.log(mapped instanceof MyArray); // false
console.log(mapped instanceof Array); // true

// Real-world example: Custom Promise
class TrackedPromise extends Promise {
  static get [Symbol.species]() {
    return Promise;
  }

  constructor(executor) {
    super(executor);
    this.created = Date.now();
  }
}

const tracked = new TrackedPromise(resolve => resolve(42));
console.log(tracked.created); // timestamp

const chained = tracked.then(x => x * 2);
console.log(chained instanceof TrackedPromise); // false
console.log(chained instanceof Promise); // true
```

### Symbol.isConcatSpreadable

Controls whether an object is spread when using `Array.prototype.concat()`.

```javascript
// Arrays are spreadable by default
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
console.log(arr1.concat(arr2)); // [1, 2, 3, 4, 5, 6]

// Disable spreading
arr2[Symbol.isConcatSpreadable] = false;
console.log(arr1.concat(arr2)); // [1, 2, 3, [4, 5, 6]]

// Enable spreading for array-like objects
const arrayLike = {
  0: 'a',
  1: 'b',
  2: 'c',
  length: 3,
  [Symbol.isConcatSpreadable]: true
};

console.log(['x'].concat(arrayLike)); // ['x', 'a', 'b', 'c']

// Without the symbol
const notSpreadable = {
  0: 'a',
  1: 'b',
  length: 2
};

console.log(['x'].concat(notSpreadable)); // ['x', { 0: 'a', 1: 'b', length: 2 }]
```

### Symbol.match, Symbol.replace, Symbol.search, Symbol.split

Customize string methods that accept regular expressions.

```javascript
// Custom matcher
class CaseInsensitiveMatcher {
  constructor(pattern) {
    this.pattern = pattern.toLowerCase();
  }

  [Symbol.match](str) {
    const lowerStr = str.toLowerCase();
    const index = lowerStr.indexOf(this.pattern);
    if (index === -1) return null;

    return [str.substring(index, index + this.pattern.length)];
  }

  [Symbol.replace](str, replacement) {
    const lowerStr = str.toLowerCase();
    const index = lowerStr.indexOf(this.pattern);
    if (index === -1) return str;

    return str.substring(0, index) +
           replacement +
           str.substring(index + this.pattern.length);
  }

  [Symbol.search](str) {
    return str.toLowerCase().indexOf(this.pattern);
  }
}

const matcher = new CaseInsensitiveMatcher('hello');

console.log('Hello World'.match(matcher)); // ['Hello']
console.log('Say HELLO'.replace(matcher, 'hi')); // 'Say hi'
console.log('HELLO there'.search(matcher)); // 0

// Symbol.split example
class SplitByLength {
  constructor(length) {
    this.length = length;
  }

  [Symbol.split](str) {
    const result = [];
    for (let i = 0; i < str.length; i += this.length) {
      result.push(str.substring(i, i + this.length));
    }
    return result;
  }
}

const splitter = new SplitByLength(3);
console.log('abcdefghi'.split(splitter)); // ['abc', 'def', 'ghi']
```

### Symbol.unscopables

Specifies properties that should be excluded from `with` statement bindings (rarely used).

```javascript
const obj = {
  foo: 1,
  bar: 2
};

obj[Symbol.unscopables] = {
  bar: true
};

with (obj) {
  console.log(foo); // 1
  // console.log(bar); // ReferenceError: bar is not defined
}

// Array uses this to prevent breaking legacy code
console.log(Array.prototype[Symbol.unscopables]);
// { at: true, copyWithin: true, entries: true, fill: true, ... }
```

## Practical Applications

### Creating Unique Constants

Symbols provide truly unique constants that can't be accidentally duplicated.

```javascript
// Traditional approach - risk of collision
const STATUS_PENDING = 'PENDING';
const STATUS_ACTIVE = 'ACTIVE';
const STATUS_COMPLETED = 'COMPLETED';

// Symbol approach - guaranteed unique
const Status = {
  PENDING: Symbol('pending'),
  ACTIVE: Symbol('active'),
  COMPLETED: Symbol('completed')
};

function processOrder(order) {
  switch (order.status) {
    case Status.PENDING:
      return 'Order is pending';
    case Status.ACTIVE:
      return 'Order is being processed';
    case Status.COMPLETED:
      return 'Order complete';
    default:
      throw new Error('Unknown status');
  }
}

const order = { id: 1, status: Status.ACTIVE };
console.log(processOrder(order)); // 'Order is being processed'

// This won't match even with same description
const fakeStatus = Symbol('active');
order.status = fakeStatus;
// processOrder(order); // throws Error: Unknown status
```

### Implementing Private-like Properties

While JavaScript now has true private fields with `#`, symbols provide a softer form of encapsulation.

```javascript
const _balance = Symbol('balance');
const _transactions = Symbol('transactions');
const _addTransaction = Symbol('addTransaction');

class BankAccount {
  constructor(initialBalance) {
    this[_balance] = initialBalance;
    this[_transactions] = [];
  }

  [_addTransaction](type, amount) {
    this[_transactions].push({
      type,
      amount,
      timestamp: new Date(),
      balance: this[_balance]
    });
  }

  deposit(amount) {
    if (amount <= 0) throw new Error('Invalid amount');
    this[_balance] += amount;
    this[_addTransaction]('deposit', amount);
    return this[_balance];
  }

  withdraw(amount) {
    if (amount <= 0) throw new Error('Invalid amount');
    if (amount > this[_balance]) throw new Error('Insufficient funds');
    this[_balance] -= amount;
    this[_addTransaction]('withdrawal', amount);
    return this[_balance];
  }

  get balance() {
    return this[_balance];
  }

  getStatement() {
    return [...this[_transactions]];
  }
}

const account = new BankAccount(1000);
account.deposit(500);
account.withdraw(200);

console.log(account.balance); // 1300
console.log(Object.keys(account)); // [] - symbol properties hidden
console.log(account.getStatement()); // Array of transactions
```

### Plugin Systems and Extensibility

Symbols allow safe extension of objects without name collisions.

```javascript
// Plugin system
const plugins = {
  init: Symbol('plugin.init'),
  cleanup: Symbol('plugin.cleanup'),
  name: Symbol('plugin.name')
};

class Application {
  constructor() {
    this.plugins = [];
  }

  use(plugin) {
    if (typeof plugin[plugins.init] !== 'function') {
      throw new Error('Plugin must have an init method');
    }
    this.plugins.push(plugin);
    plugin[plugins.init](this);
    console.log(`Plugin "${plugin[plugins.name]}" initialized`);
  }

  shutdown() {
    for (const plugin of this.plugins.reverse()) {
      if (plugin[plugins.cleanup]) {
        plugin[plugins.cleanup](this);
        console.log(`Plugin "${plugin[plugins.name]}" cleaned up`);
      }
    }
  }
}

// Create a plugin
const loggingPlugin = {
  [plugins.name]: 'Logger',
  [plugins.init](app) {
    app.log = (message) => console.log(`[LOG] ${message}`);
  },
  [plugins.cleanup](app) {
    delete app.log;
  }
};

const app = new Application();
app.use(loggingPlugin);
app.log('Hello!'); // [LOG] Hello!
app.shutdown();
```

### Metadata and Decorators

Symbols are useful for attaching metadata to objects.

```javascript
const metadata = {
  type: Symbol('metadata.type'),
  validators: Symbol('metadata.validators'),
  serializable: Symbol('metadata.serializable')
};

function Field(config) {
  return function(target, propertyKey) {
    if (!target[metadata.validators]) {
      target[metadata.validators] = {};
    }
    target[metadata.validators][propertyKey] = config;
  };
}

function Serializable(target) {
  target[metadata.serializable] = true;
  target[metadata.type] = target.name;
}

// Usage (conceptual - actual decorators require transpilation)
class User {
  constructor() {
    this.name = '';
    this.email = '';
    this.age = 0;

    // Simulating decorator behavior
    this[metadata.validators] = {
      name: { required: true, minLength: 2 },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      age: { min: 0, max: 150 }
    };
  }

  validate() {
    const validators = this[metadata.validators];
    const errors = [];

    for (const [field, rules] of Object.entries(validators)) {
      const value = this[field];

      if (rules.required && !value) {
        errors.push(`${field} is required`);
      }
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`);
      }
    }

    return errors;
  }
}

const user = new User();
user.name = 'A';
user.email = 'invalid';
user.age = 200;

console.log(user.validate());
// ['name must be at least 2 characters', 'email format is invalid', 'age must be at most 150']
```

### Cross-Realm Identity

Using `Symbol.for()` for cross-realm communication.

```javascript
// In main window
const MESSAGE_TYPE = Symbol.for('app.message.type');
const READY = Symbol.for('app.state.ready');

// This symbol will be the same in iframes, workers, etc.
const message = {
  [MESSAGE_TYPE]: 'greeting',
  content: 'Hello from main window'
};

// In iframe or worker
const SAME_MESSAGE_TYPE = Symbol.for('app.message.type');

// These are the same symbol
console.log(MESSAGE_TYPE === SAME_MESSAGE_TYPE); // true

function processMessage(msg) {
  // Can reliably check the type
  if (msg[SAME_MESSAGE_TYPE] === 'greeting') {
    console.log(msg.content);
  }
}
```

## Symbol Methods and Properties

### Instance Properties

```javascript
const sym = Symbol('my description');

// description (ES2019+)
console.log(sym.description); // 'my description'

// For symbols without description
const noDesc = Symbol();
console.log(noDesc.description); // undefined
```

### Instance Methods

```javascript
const sym = Symbol('test');

// toString()
console.log(sym.toString()); // 'Symbol(test)'

// valueOf()
console.log(sym.valueOf()); // Symbol(test)

// Symbol.prototype[@@toStringTag]
console.log(Object.prototype.toString.call(sym)); // '[object Symbol]'

// Symbol.prototype[@@toPrimitive]
// Symbols can only convert to themselves
console.log(sym[Symbol.toPrimitive]('string')); // Symbol(test)
```

### Static Properties

```javascript
// All well-known symbols
console.log(Symbol.asyncIterator); // Symbol(Symbol.asyncIterator)
console.log(Symbol.hasInstance); // Symbol(Symbol.hasInstance)
console.log(Symbol.isConcatSpreadable); // Symbol(Symbol.isConcatSpreadable)
console.log(Symbol.iterator); // Symbol(Symbol.iterator)
console.log(Symbol.match); // Symbol(Symbol.match)
console.log(Symbol.matchAll); // Symbol(Symbol.matchAll)
console.log(Symbol.replace); // Symbol(Symbol.replace)
console.log(Symbol.search); // Symbol(Symbol.search)
console.log(Symbol.species); // Symbol(Symbol.species)
console.log(Symbol.split); // Symbol(Symbol.split)
console.log(Symbol.toPrimitive); // Symbol(Symbol.toPrimitive)
console.log(Symbol.toStringTag); // Symbol(Symbol.toStringTag)
console.log(Symbol.unscopables); // Symbol(Symbol.unscopables)
```

## Working with Symbol Properties

### Accessing Symbol Properties

```javascript
const sym = Symbol('key');
const obj = {
  regular: 'value',
  [sym]: 'symbol value'
};

// Direct access (requires reference to symbol)
console.log(obj[sym]); // 'symbol value'

// Object.keys() - doesn't include symbols
console.log(Object.keys(obj)); // ['regular']

// Object.getOwnPropertyNames() - doesn't include symbols
console.log(Object.getOwnPropertyNames(obj)); // ['regular']

// Object.getOwnPropertySymbols() - only symbols
console.log(Object.getOwnPropertySymbols(obj)); // [Symbol(key)]

// Reflect.ownKeys() - all keys including symbols
console.log(Reflect.ownKeys(obj)); // ['regular', Symbol(key)]

// for...in loop - doesn't include symbols
for (const key in obj) {
  console.log(key); // 'regular'
}

// Object.assign() and spread - copies symbol properties
const copied = { ...obj };
console.log(copied[sym]); // 'symbol value'
```

### Checking for Symbol Properties

```javascript
const sym = Symbol('test');
const obj = { [sym]: 'value', regular: 'data' };

// 'in' operator works with symbols
console.log(sym in obj); // true

// hasOwnProperty works with symbols
console.log(obj.hasOwnProperty(sym)); // true

// Object.hasOwn (ES2022) works with symbols
console.log(Object.hasOwn(obj, sym)); // true

// Object.prototype.propertyIsEnumerable
console.log(obj.propertyIsEnumerable(sym)); // true
```

## Symbols and JSON

Symbols are completely ignored by `JSON.stringify()`.

```javascript
const secretData = Symbol('secret');

const user = {
  name: 'Alice',
  age: 30,
  [secretData]: 'classified information'
};

const json = JSON.stringify(user);
console.log(json); // {"name":"Alice","age":30}

// Symbol properties are lost in serialization
const parsed = JSON.parse(json);
console.log(parsed[secretData]); // undefined

// Custom toJSON can include symbol data if needed
const serializable = {
  name: 'Bob',
  [secretData]: 'secret',

  toJSON() {
    return {
      name: this.name,
      hasSecret: this[secretData] !== undefined
    };
  }
};

console.log(JSON.stringify(serializable));
// {"name":"Bob","hasSecret":true}
```

## Best Practices

### When to Use Symbols

```javascript
// 1. Unique property keys that won't collide
const INTERNAL_ID = Symbol('internal.id');

// 2. Constants that need to be truly unique
const EventTypes = {
  CLICK: Symbol('click'),
  HOVER: Symbol('hover'),
  FOCUS: Symbol('focus')
};

// 3. Implementing protocols (iterator, etc.)
class LinkedList {
  *[Symbol.iterator]() {
    let current = this.head;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}

// 4. Adding metadata without polluting object
const validators = Symbol('validators');
obj[validators] = ['required', 'email'];

// 5. Creating hooks for customization
const onSave = Symbol('hooks.onSave');
class Model {
  save() {
    if (this[onSave]) {
      this[onSave]();
    }
    // ... save logic
  }
}
```

### When Not to Use Symbols

```javascript
// 1. When you need serialization
// Symbols don't survive JSON.stringify()

// 2. For truly private data - use private fields instead
class Example {
  #privateField = 'truly private'; // ES2022+

  // vs
  [Symbol('pseudo-private')] = 'still accessible';
}

// 3. When you need to iterate over all properties regularly
// Symbol properties require special handling

// 4. For simple string constants
// If uniqueness isn't critical, strings are simpler
const STATUS_ACTIVE = 'active'; // Often sufficient
```

### Symbol Naming Conventions

```javascript
// Use descriptive descriptions for debugging
const id = Symbol('user.id'); // Good
const x = Symbol(); // Avoid - hard to debug

// Use namespaced descriptions to prevent confusion
const CACHE_KEY = Symbol('mylib.cache.key');
const INTERNAL = Symbol('mylib.internal');

// For global symbols, use reverse domain notation
const SHARED = Symbol.for('com.mycompany.shared.state');
```

## Browser and Runtime Support

Symbols are supported in all modern JavaScript environments:

- Chrome 38+
- Firefox 36+
- Safari 9+
- Edge 12+
- Node.js 0.12+

All well-known symbols have broad support, with some newer ones like `Symbol.asyncIterator` requiring more recent versions.

## Summary

JavaScript Symbols provide powerful capabilities for creating unique identifiers and customizing object behavior:

- **Uniqueness**: Every symbol is guaranteed unique, preventing property collisions
- **Hidden Properties**: Symbol keys are hidden from most iteration methods
- **Well-Known Symbols**: Customize built-in behaviors like iteration and type conversion
- **Global Registry**: Share symbols across different parts of your application
- **Metaprogramming**: Extend and modify JavaScript's built-in behaviors

Key takeaways:

1. Use `Symbol()` for local unique identifiers
2. Use `Symbol.for()` when symbols need to be shared globally
3. Well-known symbols enable powerful metaprogramming patterns
4. Symbol properties don't appear in `JSON.stringify()` or regular enumeration
5. Symbols complement (but don't replace) private class fields for encapsulation

Mastering Symbols opens up advanced JavaScript patterns for building robust, extensible, and maintainable applications.
