---
title: JavaScript ES6+ Features
description: "Master ES6+ features: destructuring, spread, Map/Set, Symbol, Proxy"
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - ES6
  - Modern JavaScript
  - New Features
status: imported
origin: old/src/content/docs/javascript/es6-features.en.md
divergence: 0.435
issues:
  - divergent
legacy:
  category: JavaScript
  subcategory: ES6+
  order: 7
  lastUpdated: 2026-01-07
---

ES6 (ECMAScript 2015) and later versions introduced powerful features that revolutionized JavaScript development. We'll cover essential modern JavaScript features with practical examples.

## Destructuring

Destructuring allows you to extract values from arrays or properties from objects into distinct variables.

### Array Destructuring

```javascript
// Basic array destructuring
const numbers = [1, 2, 3, 4, 5];
const [first, second, third] = numbers;

console.log(first);  // 1
console.log(second); // 2
console.log(third);  // 3

// Skipping elements
const [a, , c] = numbers;
console.log(a, c); // 1 3

// Rest pattern
const [head, ...tail] = numbers;
console.log(head); // 1
console.log(tail); // [2, 3, 4, 5]

// Default values
const [x = 10, y = 20, z = 30] = [1, 2];
console.log(x, y, z); // 1 2 30

// Swapping variables
let var1 = 'first';
let var2 = 'second';
[var1, var2] = [var2, var1];
console.log(var1, var2); // 'second' 'first'
```

### Object Destructuring

```javascript
// Basic object destructuring
const person = {
  name: 'Alice',
  age: 30,
  city: 'New York',
  country: 'USA'
};

const { name, age } = person;
console.log(name, age); // 'Alice' 30

// Renaming variables
const { name: fullName, age: years } = person;
console.log(fullName, years); // 'Alice' 30

// Default values
const { name: userName, role = 'user' } = person;
console.log(userName, role); // 'Alice' 'user'

// Nested destructuring
const user = {
  id: 1,
  profile: {
    username: 'alice123',
    email: 'alice@example.com',
    settings: {
      theme: 'dark',
      notifications: true
    }
  }
};

const {
  profile: {
    username,
    settings: { theme }
  }
} = user;

console.log(username, theme); // 'alice123' 'dark'

// Rest properties
const { city, ...restInfo } = person;
console.log(city);      // 'New York'
console.log(restInfo);  // { name: 'Alice', age: 30, country: 'USA' }
```

### Function Parameter Destructuring

```javascript
// Object parameters
function displayUser({ name, age, city = 'Unknown' }) {
  console.log(`${name}, ${age}, from ${city}`);
}

displayUser({ name: 'Bob', age: 25 }); // 'Bob, 25, from Unknown'

// Array parameters
function processCoordinates([x, y, z = 0]) {
  return { x, y, z };
}

console.log(processCoordinates([10, 20])); // { x: 10, y: 20, z: 0 }

// Combined destructuring
function handleRequest({
  url,
  method = 'GET',
  headers = {},
  body
}) {
  return {
    endpoint: url,
    type: method,
    requestHeaders: headers,
    payload: body
  };
}
```

## Spread and Rest Operators

The spread (`...`) and rest (`...`) operators provide flexible ways to work with arrays and objects.

### Spread Operator

```javascript
// Array spreading
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];
console.log(combined); // [1, 2, 3, 4, 5, 6]

// Array cloning
const original = [1, 2, 3];
const clone = [...original];
console.log(clone); // [1, 2, 3]
console.log(clone === original); // false

// Array expansion
const numbers = [1, 2, 3, 4, 5];
console.log(Math.max(...numbers)); // 5

// Object spreading
const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3, d: 4 };
const merged = { ...obj1, ...obj2 };
console.log(merged); // { a: 1, b: 2, c: 3, d: 4 }

// Object cloning
const originalObj = { x: 1, y: 2 };
const clonedObj = { ...originalObj };
console.log(clonedObj); // { x: 1, y: 2 }

// Overriding properties
const defaults = { theme: 'light', fontSize: 14 };
const userSettings = { fontSize: 16 };
const finalSettings = { ...defaults, ...userSettings };
console.log(finalSettings); // { theme: 'light', fontSize: 16 }

// Conditional spreading
const includeOptional = true;
const config = {
  required: true,
  ...(includeOptional && { optional: true })
};
console.log(config); // { required: true, optional: true }
```

### Rest Operator

```javascript
// Function rest parameters
function sum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}

console.log(sum(1, 2, 3, 4, 5)); // 15

// Mixed parameters
function introduce(greeting, ...names) {
  return `${greeting} ${names.join(', ')}!`;
}

console.log(introduce('Hello', 'Alice', 'Bob', 'Charlie'));
// 'Hello Alice, Bob, Charlie!'

// Array destructuring with rest
const [first, second, ...others] = [1, 2, 3, 4, 5];
console.log(first);  // 1
console.log(second); // 2
console.log(others); // [3, 4, 5]

// Object destructuring with rest
const person = {
  name: 'Alice',
  age: 30,
  city: 'NYC',
  country: 'USA'
};
const { name, ...details } = person;
console.log(name);    // 'Alice'
console.log(details); // { age: 30, city: 'NYC', country: 'USA' }
```

## Map and WeakMap

Map and WeakMap are advanced data structures for key-value storage.

### Map

```javascript
// Creating a Map
const map = new Map();

// Setting values
map.set('name', 'Alice');
map.set('age', 30);
map.set(42, 'number key');
map.set({ id: 1 }, 'object key');

console.log(map.size); // 4

// Getting values
console.log(map.get('name')); // 'Alice'
console.log(map.get('age'));  // 30

// Checking for keys
console.log(map.has('name')); // true
console.log(map.has('city')); // false

// Deleting entries
map.delete('age');
console.log(map.has('age')); // false

// Initializing with array
const map2 = new Map([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3']
]);

// Iterating over Map
map2.forEach((value, key) => {
  console.log(`${key}: ${value}`);
});

// Using for...of
for (const [key, value] of map2) {
  console.log(`${key} => ${value}`);
}

// Keys, values, and entries
console.log([...map2.keys()]);   // ['key1', 'key2', 'key3']
console.log([...map2.values()]); // ['value1', 'value2', 'value3']
console.log([...map2.entries()]); // [['key1', 'value1'], ...]

// Object as key (powerful feature)
const obj1 = { id: 1 };
const obj2 = { id: 2 };
const objMap = new Map();

objMap.set(obj1, 'First object');
objMap.set(obj2, 'Second object');

console.log(objMap.get(obj1)); // 'First object'
console.log(objMap.get(obj2)); // 'Second object'

// Clearing the map
map2.clear();
console.log(map2.size); // 0

// Practical example: Caching
const cache = new Map();

function expensiveOperation(key) {
  if (cache.has(key)) {
    console.log('Returning cached result');
    return cache.get(key);
  }

  console.log('Computing result');
  const result = key * 2; // Simulate expensive operation
  cache.set(key, result);
  return result;
}

console.log(expensiveOperation(5)); // Computing result, 10
console.log(expensiveOperation(5)); // Returning cached result, 10
```

### WeakMap

```javascript
// WeakMap only accepts objects as keys
const weakMap = new WeakMap();

let obj1 = { id: 1 };
let obj2 = { id: 2 };

weakMap.set(obj1, 'data for obj1');
weakMap.set(obj2, 'data for obj2');

console.log(weakMap.get(obj1)); // 'data for obj1'
console.log(weakMap.has(obj2)); // true

// Garbage collection benefit
obj1 = null; // obj1 can now be garbage collected
// weakMap automatically removes the entry

// WeakMap methods (limited API)
// - set(key, value)
// - get(key)
// - has(key)
// - delete(key)
// Note: No size property, no iteration methods

// Practical example: Private data
const privateData = new WeakMap();

class Person {
  constructor(name, ssn) {
    this.name = name;
    privateData.set(this, { ssn });
  }

  getSSN() {
    return privateData.get(this).ssn;
  }
}

const person = new Person('Alice', '123-45-6789');
console.log(person.name); // 'Alice'
console.log(person.getSSN()); // '123-45-6789'
console.log(person.ssn); // undefined (private!)

// DOM node metadata (common use case)
const nodeMetadata = new WeakMap();

function attachMetadata(element, metadata) {
  nodeMetadata.set(element, metadata);
}

function getMetadata(element) {
  return nodeMetadata.get(element);
}

// When DOM nodes are removed, metadata is automatically cleaned up
```

## Set and WeakSet

Set and WeakSet are collections of unique values.

### Set

```javascript
// Creating a Set
const set = new Set();

// Adding values
set.add(1);
set.add(2);
set.add(3);
set.add(2); // Duplicate, ignored

console.log(set.size); // 3

// Initializing with array
const set2 = new Set([1, 2, 3, 4, 5, 5, 5]);
console.log(set2.size); // 5 (duplicates removed)

// Checking for values
console.log(set2.has(3)); // true
console.log(set2.has(10)); // false

// Deleting values
set2.delete(3);
console.log(set2.has(3)); // false

// Iterating over Set
set2.forEach(value => {
  console.log(value);
});

// Using for...of
for (const value of set2) {
  console.log(value);
}

// Converting to array
const array = [...set2];
console.log(array); // [1, 2, 4, 5]

// Set operations
const setA = new Set([1, 2, 3, 4]);
const setB = new Set([3, 4, 5, 6]);

// Union
const union = new Set([...setA, ...setB]);
console.log([...union]); // [1, 2, 3, 4, 5, 6]

// Intersection
const intersection = new Set(
  [...setA].filter(x => setB.has(x))
);
console.log([...intersection]); // [3, 4]

// Difference
const difference = new Set(
  [...setA].filter(x => !setB.has(x))
);
console.log([...difference]); // [1, 2]

// Symmetric difference
const symmetricDiff = new Set([
  ...[...setA].filter(x => !setB.has(x)),
  ...[...setB].filter(x => !setA.has(x))
]);
console.log([...symmetricDiff]); // [1, 2, 5, 6]

// Practical example: Removing duplicates
const numbers = [1, 2, 2, 3, 4, 4, 5, 5, 5];
const unique = [...new Set(numbers)];
console.log(unique); // [1, 2, 3, 4, 5]

// Practical example: Unique string characters
const text = "hello world";
const uniqueChars = new Set(text);
console.log([...uniqueChars].join('')); // "helo wrd"

// Clearing the set
set2.clear();
console.log(set2.size); // 0
```

### WeakSet

```javascript
// WeakSet only stores objects
const weakSet = new WeakSet();

let obj1 = { id: 1 };
let obj2 = { id: 2 };
let obj3 = { id: 3 };

weakSet.add(obj1);
weakSet.add(obj2);
weakSet.add(obj3);

console.log(weakSet.has(obj1)); // true
console.log(weakSet.has(obj2)); // true

// Deleting
weakSet.delete(obj2);
console.log(weakSet.has(obj2)); // false

// Garbage collection
obj1 = null; // obj1 can now be garbage collected

// WeakSet methods (limited API)
// - add(value)
// - has(value)
// - delete(value)
// Note: No size property, no iteration methods

// Practical example: Marking objects as processed
const processedItems = new WeakSet();

function processItem(item) {
  if (processedItems.has(item)) {
    console.log('Already processed');
    return;
  }

  console.log('Processing item:', item.id);
  // ... do processing
  processedItems.add(item);
}

const item1 = { id: 1, data: 'test' };
processItem(item1); // Processing item: 1
processItem(item1); // Already processed

// Practical example: DOM element tracking
const clickedElements = new WeakSet();

function handleClick(element) {
  if (clickedElements.has(element)) {
    console.log('Element already clicked');
    return;
  }

  clickedElements.add(element);
  console.log('First click on element');
}

// When elements are removed from DOM, they're auto-cleaned from WeakSet
```

## Symbol

Symbol is a primitive data type that creates unique identifiers.

### Basic Symbol Usage

```javascript
// Creating symbols
const sym1 = Symbol();
const sym2 = Symbol();

console.log(sym1 === sym2); // false (always unique)

// Symbols with descriptions
const sym3 = Symbol('mySymbol');
const sym4 = Symbol('mySymbol');

console.log(sym3.toString()); // 'Symbol(mySymbol)'
console.log(sym3 === sym4);   // false (still unique)

// Getting symbol description
console.log(sym3.description); // 'mySymbol'

// Symbols as object keys
const id = Symbol('id');
const user = {
  name: 'Alice',
  [id]: 123
};

console.log(user[id]); // 123
console.log(user.id);  // undefined

// Symbols are not enumerable
console.log(Object.keys(user));           // ['name']
console.log(Object.getOwnPropertyNames(user)); // ['name']
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(id)]

// Practical example: Private properties
const _private = Symbol('private');

class Account {
  constructor(balance) {
    this[_private] = balance;
  }

  getBalance() {
    return this[_private];
  }

  deposit(amount) {
    this[_private] += amount;
  }
}

const account = new Account(1000);
console.log(account.getBalance()); // 1000
console.log(account[_private]);    // undefined (not directly accessible)
```

### Global Symbol Registry

```javascript
// Creating global symbols
const globalSym1 = Symbol.for('app.id');
const globalSym2 = Symbol.for('app.id');

console.log(globalSym1 === globalSym2); // true (same symbol)

// Getting symbol key
console.log(Symbol.keyFor(globalSym1)); // 'app.id'

// Regular symbols are not in registry
const regularSym = Symbol('test');
console.log(Symbol.keyFor(regularSym)); // undefined

// Practical example: Cross-realm identifiers
const TRANSACTION_ID = Symbol.for('app.transaction.id');

class Transaction {
  constructor() {
    this[TRANSACTION_ID] = Math.random();
  }

  getId() {
    return this[TRANSACTION_ID];
  }
}
```

### Well-Known Symbols

```javascript
// Symbol.iterator - make objects iterable
const range = {
  from: 1,
  to: 5,

  [Symbol.iterator]() {
    return {
      current: this.from,
      last: this.to,

      next() {
        if (this.current <= this.last) {
          return { done: false, value: this.current++ };
        } else {
          return { done: true };
        }
      }
    };
  }
};

for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// Symbol.toStringTag - customize Object.prototype.toString
class MyClass {
  get [Symbol.toStringTag]() {
    return 'MyClass';
  }
}

const instance = new MyClass();
console.log(instance.toString()); // '[object MyClass]'

// Symbol.toPrimitive - customize type conversion
const obj = {
  value: 100,

  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      return this.value;
    }
    if (hint === 'string') {
      return `Value: ${this.value}`;
    }
    return this.value;
  }
};

console.log(+obj);     // 100 (number hint)
console.log(`${obj}`); // 'Value: 100' (string hint)
console.log(obj + 50); // 150 (default hint)

// Symbol.hasInstance - customize instanceof
class MyArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}

console.log([] instanceof MyArray); // true
console.log({} instanceof MyArray); // false

// Symbol.species - customize constructor for derived objects
class CustomArray extends Array {
  static get [Symbol.species]() {
    return Array;
  }
}

const customArr = new CustomArray(1, 2, 3);
const mapped = customArr.map(x => x * 2);

console.log(mapped instanceof CustomArray); // false
console.log(mapped instanceof Array);       // true
```

## Proxy and Reflect

Proxy and Reflect provide metaprogramming capabilities for intercepting and customizing object operations.

### Proxy Basics

```javascript
// Creating a proxy
const target = {
  message: 'Hello'
};

const handler = {
  get(target, property) {
    console.log(`Getting ${property}`);
    return target[property];
  }
};

const proxy = new Proxy(target, handler);

console.log(proxy.message);
// Getting message
// 'Hello'

// Property validation
const validator = {
  set(target, property, value) {
    if (property === 'age') {
      if (typeof value !== 'number') {
        throw new TypeError('Age must be a number');
      }
      if (value < 0 || value > 150) {
        throw new RangeError('Age must be between 0 and 150');
      }
    }
    target[property] = value;
    return true;
  }
};

const person = new Proxy({}, validator);

person.age = 30;  // OK
console.log(person.age); // 30

try {
  person.age = 'thirty'; // TypeError
} catch (e) {
  console.error(e.message);
}

try {
  person.age = 200; // RangeError
} catch (e) {
  console.error(e.message);
}
```

### Proxy Traps

```javascript
// Comprehensive trap example
const handler = {
  // Property access
  get(target, property, receiver) {
    console.log(`GET ${property}`);
    return Reflect.get(target, property, receiver);
  },

  // Property assignment
  set(target, property, value, receiver) {
    console.log(`SET ${property} = ${value}`);
    return Reflect.set(target, property, value, receiver);
  },

  // Property existence check
  has(target, property) {
    console.log(`HAS ${property}`);
    return Reflect.has(target, property);
  },

  // Property deletion
  deleteProperty(target, property) {
    console.log(`DELETE ${property}`);
    return Reflect.deleteProperty(target, property);
  },

  // Object.keys, for...in
  ownKeys(target) {
    console.log('OWNKEYS');
    return Reflect.ownKeys(target);
  },

  // Object.getOwnPropertyDescriptor
  getOwnPropertyDescriptor(target, property) {
    console.log(`GET DESCRIPTOR ${property}`);
    return Reflect.getOwnPropertyDescriptor(target, property);
  },

  // Object.defineProperty
  defineProperty(target, property, descriptor) {
    console.log(`DEFINE ${property}`);
    return Reflect.defineProperty(target, property, descriptor);
  }
};

const obj = new Proxy({ x: 1 }, handler);

obj.y = 2;              // SET y = 2
console.log(obj.x);     // GET x, then 1
console.log('x' in obj); // HAS x, then true
delete obj.y;           // DELETE y
Object.keys(obj);       // OWNKEYS
```

### Practical Proxy Examples

```javascript
// 1. Default values
function withDefaults(target, defaults) {
  return new Proxy(target, {
    get(target, property) {
      return property in target ? target[property] : defaults[property];
    }
  });
}

const config = withDefaults(
  { host: 'localhost' },
  { host: 'example.com', port: 3000, timeout: 5000 }
);

console.log(config.host);    // 'localhost'
console.log(config.port);    // 3000
console.log(config.timeout); // 5000

// 2. Negative array indices
function createArray(arr) {
  return new Proxy(arr, {
    get(target, property) {
      const index = Number(property);
      if (index < 0) {
        property = String(target.length + index);
      }
      return Reflect.get(target, property);
    }
  });
}

const array = createArray([1, 2, 3, 4, 5]);
console.log(array[-1]); // 5
console.log(array[-2]); // 4

// 3. Observable objects
function observable(target, callback) {
  return new Proxy(target, {
    set(target, property, value) {
      const oldValue = target[property];
      const result = Reflect.set(target, property, value);
      callback(property, oldValue, value);
      return result;
    }
  });
}

const user = observable({}, (property, oldValue, newValue) => {
  console.log(`${property} changed from ${oldValue} to ${newValue}`);
});

user.name = 'Alice';  // name changed from undefined to Alice
user.age = 30;        // age changed from undefined to 30
user.age = 31;        // age changed from 30 to 31

// 4. Access logging
function createLogger(target, name) {
  return new Proxy(target, {
    get(target, property) {
      console.log(`[${name}] Accessing ${String(property)}`);
      const value = target[property];

      if (typeof value === 'function') {
        return function(...args) {
          console.log(`[${name}] Calling ${String(property)} with`, args);
          return value.apply(this, args);
        };
      }

      return value;
    }
  });
}

const api = createLogger({
  fetchUser(id) {
    return { id, name: 'User ' + id };
  }
}, 'API');

api.fetchUser(123);
// [API] Accessing fetchUser
// [API] Calling fetchUser with [123]

// 5. Read-only objects
function readonly(target) {
  return new Proxy(target, {
    set() {
      throw new Error('Cannot modify readonly object');
    },
    deleteProperty() {
      throw new Error('Cannot delete from readonly object');
    }
  });
}

const constants = readonly({ PI: 3.14159, E: 2.71828 });
console.log(constants.PI); // 3.14159

try {
  constants.PI = 3; // Error: Cannot modify readonly object
} catch (e) {
  console.error(e.message);
}

// 6. Revocable proxies
const { proxy: revocableProxy, revoke } = Proxy.revocable(
  { data: 'sensitive' },
  {
    get(target, property) {
      return target[property];
    }
  }
);

console.log(revocableProxy.data); // 'sensitive'

revoke(); // Revoke proxy access

try {
  console.log(revocableProxy.data); // TypeError
} catch (e) {
  console.error('Proxy has been revoked');
}
```

### Reflect API

```javascript
// Reflect provides default operations as functions
const obj = { x: 1, y: 2 };

// Property operations
Reflect.get(obj, 'x');              // 1
Reflect.set(obj, 'z', 3);           // true
Reflect.has(obj, 'x');              // true
Reflect.deleteProperty(obj, 'y');   // true

// Property descriptors
Reflect.defineProperty(obj, 'a', {
  value: 100,
  writable: false
});

const descriptor = Reflect.getOwnPropertyDescriptor(obj, 'a');
console.log(descriptor);
// { value: 100, writable: false, enumerable: false, configurable: false }

// Object operations
console.log(Reflect.ownKeys(obj)); // ['x', 'z', 'a']

// Function operations
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(Reflect.apply(greet, null, ['Alice']));
// 'Hello, Alice!'

// Constructor operations
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

const point = Reflect.construct(Point, [10, 20]);
console.log(point); // Point { x: 10, y: 20 }

// Prototype operations
const proto = { inherited: true };
const newObj = {};
Reflect.setPrototypeOf(newObj, proto);
console.log(Reflect.getPrototypeOf(newObj) === proto); // true

// Extensibility operations
Reflect.preventExtensions(newObj);
console.log(Reflect.isExtensible(newObj)); // false

// Using Reflect with Proxy for proper behavior
const handler = {
  get(target, property, receiver) {
    // Properly handles getter functions and 'this' binding
    return Reflect.get(target, property, receiver);
  },

  set(target, property, value, receiver) {
    // Returns boolean for success/failure
    return Reflect.set(target, property, value, receiver);
  }
};

const proxiedObj = new Proxy({ value: 0 }, handler);
```

### Advanced Proxy Patterns

```javascript
// 1. Private properties pattern
function createPrivateProps() {
  const privateProps = new WeakMap();

  return function(target) {
    privateProps.set(target, {});

    return new Proxy(target, {
      get(target, property) {
        if (property.startsWith('_')) {
          return privateProps.get(target)[property];
        }
        return target[property];
      },

      set(target, property, value) {
        if (property.startsWith('_')) {
          privateProps.get(target)[property] = value;
          return true;
        }
        target[property] = value;
        return true;
      }
    });
  };
}

const withPrivate = createPrivateProps();
const obj = withPrivate({ public: 'visible' });

obj._private = 'hidden';
console.log(obj._private);      // 'hidden'
console.log(obj.public);        // 'visible'
console.log(Object.keys(obj));  // ['public'] (no _private)

// 2. Type enforcement
function typed(types) {
  return new Proxy({}, {
    set(target, property, value) {
      const expectedType = types[property];

      if (expectedType && typeof value !== expectedType) {
        throw new TypeError(
          `Property ${property} must be of type ${expectedType}`
        );
      }

      target[property] = value;
      return true;
    }
  });
}

const person = typed({
  name: 'string',
  age: 'number',
  active: 'boolean'
});

person.name = 'Alice';  // OK
person.age = 30;        // OK

try {
  person.age = '30';    // TypeError
} catch (e) {
  console.error(e.message);
}

// 3. Method chaining
function chainable(target) {
  return new Proxy(target, {
    get(target, property) {
      if (typeof target[property] === 'function') {
        return function(...args) {
          target[property].apply(target, args);
          return this; // Return proxy for chaining
        };
      }
      return target[property];
    }
  });
}

const calculator = chainable({
  value: 0,
  add(n) { this.value += n; },
  multiply(n) { this.value *= n; },
  subtract(n) { this.value -= n; }
});

calculator.add(10).multiply(2).subtract(5);
console.log(calculator.value); // 15
```

## Summary

ES6+ features have transformed JavaScript development:

- **Destructuring**: Extract values elegantly from arrays and objects
- **Spread/Rest**: Flexible array and object manipulation
- **Map/WeakMap**: Advanced key-value storage with object keys
- **Set/WeakSet**: Collections of unique values with automatic cleanup
- **Symbol**: Unique identifiers for properties and metadata
- **Proxy/Reflect**: Powerful metaprogramming capabilities

These features enable cleaner, more maintainable, and more powerful JavaScript code. Master them to write modern, professional JavaScript applications.
