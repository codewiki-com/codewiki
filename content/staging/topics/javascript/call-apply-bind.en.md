---
title: call、apply、bind 方法详解
description: 深入理解 JavaScript 中 Function.prototype 的 call、apply、bind 方法，掌握显式 this 绑定、方法借用与偏函数应用
track: javascript
section: functions-scope
difficulty: intermediate
tags:
  - JavaScript
  - this
  - call
  - apply
  - bind
  - 函数
status: imported
origin: old/src/content/docs/javascript/call-apply-bind.en.md
divergence: 0.193
issues:
  - title-lang-en
  - title-language
legacy:
  category: JavaScript
  subcategory: 核心概念
  order: 6
  lastUpdated: 2026-01-07
---

In JavaScript, the `this` value of a function is dynamically determined at runtime. `call`, `apply`, and `bind` are three methods on `Function.prototype` that allow us to explicitly specify the `this` value when a function executes. Mastering these three methods is essential for understanding JavaScript's `this` mechanism and implementing many advanced programming patterns.

## Concept Explanation

### Why We Need Explicit Binding

JavaScript's `this` binding rules are dynamic, meaning that the same function may have `this` pointing to different objects depending on how it's called.

```javascript
const person = {
  name: 'Zhang San',
  greet: function() {
    console.log(`Hello, I am ${this.name}`);
  }
};

// Called as an object method: this points to person
person.greet(); // Hello, I am Zhang San

// Called as a regular function: this points to the global object (undefined in strict mode)
const greetFunc = person.greet;
greetFunc(); // Hello, I am undefined
```

`call`, `apply`, and `bind` provide a way to "lock in" a function's `this` value, regardless of how the function is called.

### Differences Between the Three

| Method | Execution Timing | Parameter Passing | Return Value |
|--------|------------------|-------------------|--------------|
| `call` | Immediate | Individual arguments | Function execution result |
| `apply` | Immediate | Array format | Function execution result |
| `bind` | Not immediate | Individual arguments (can be partial) | New function |

## Core Principles

### Function.prototype.call

The `call` method calls a function with a given `this` value and individually passed arguments.

**Syntax**:
```javascript
func.call(thisArg, arg1, arg2, ...)
```

**Basic Usage**:
```javascript
function introduce(greeting, punctuation) {
  console.log(`${greeting}, I am ${this.name}${punctuation}`);
}

const person1 = { name: 'Li Si' };
const person2 = { name: 'Wang Wu' };

introduce.call(person1, 'Hello', '!'); // Hello, I am Li Si!
introduce.call(person2, 'Hi everyone', '~'); // Hi everyone, I am Wang Wu~
```

**Internal Implementation Principle of call**:

```javascript
// Simulated implementation of call
Function.prototype.myCall = function(context, ...args) {
  // If context is null or undefined, point to the global object
  context = context ?? globalThis;

  // Ensure context is an object type
  context = Object(context);

  // Use Symbol to avoid property name conflicts
  const fnKey = Symbol('fn');

  // Make the function a method of context
  context[fnKey] = this;

  // Call the function and get the result
  const result = context[fnKey](...args);

  // Delete the temporary property
  delete context[fnKey];

  return result;
};

// Test
function greet(greeting) {
  return `${greeting}, ${this.name}`;
}

console.log(greet.myCall({ name: 'Xiao Ming' }, 'Hello')); // Hello, Xiao Ming
```

### Function.prototype.apply

`apply` is almost identical to `call`, with the only difference being that arguments are passed as an array (or array-like object).

**Syntax**:
```javascript
func.apply(thisArg, [argsArray])
```

**Basic Usage**:
```javascript
function introduce(greeting, punctuation) {
  console.log(`${greeting}, I am ${this.name}${punctuation}`);
}

const person = { name: 'Zhao Liu' };

// Arguments passed as an array
introduce.apply(person, ['Good morning', '!']); // Good morning, I am Zhao Liu!
```

**Internal Implementation Principle of apply**:

```javascript
// Simulated implementation of apply
Function.prototype.myApply = function(context, argsArray = []) {
  context = context ?? globalThis;
  context = Object(context);

  const fnKey = Symbol('fn');
  context[fnKey] = this;

  // Spread the array arguments
  const result = context[fnKey](...argsArray);

  delete context[fnKey];

  return result;
};

// Test
const numbers = [5, 2, 9, 1, 7];
console.log(Math.max.myApply(null, numbers)); // 9
```

### Function.prototype.bind

`bind` creates a new function that, when called, has its `this` value set to the provided value, and prepends a given sequence of arguments when called.

**Syntax**:
```javascript
const boundFunc = func.bind(thisArg, arg1, arg2, ...)
```

**Basic Usage**:
```javascript
const person = {
  name: 'Qian Qi',
  greet: function(greeting) {
    console.log(`${greeting}, I am ${this.name}`);
  }
};

// Create a bound function
const boundGreet = person.greet.bind(person);

// No matter how it's called, this points to person
boundGreet('Hello'); // Hello, I am Qian Qi
setTimeout(boundGreet.bind(null, 'Delayed greeting'), 1000); // Delayed greeting, I am Qian Qi
```

**Internal Implementation Principle of bind**:

```javascript
// Simulated implementation of bind
Function.prototype.myBind = function(context, ...boundArgs) {
  const originalFunc = this;

  // Return a new function
  const boundFunc = function(...callArgs) {
    // Check if called with new
    const isNewCall = new.target !== undefined;

    // If called with new, this should point to the newly created instance
    const thisArg = isNewCall ? this : context;

    // Merge preset arguments with call-time arguments
    return originalFunc.apply(thisArg, [...boundArgs, ...callArgs]);
  };

  // Maintain the prototype chain for correct inheritance when using new
  if (originalFunc.prototype) {
    boundFunc.prototype = Object.create(originalFunc.prototype);
  }

  return boundFunc;
};

// Test
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const BoundPerson = Person.myBind(null, 'Xiao Hong');
const person = new BoundPerson(25);
console.log(person.name, person.age); // Xiao Hong 25
```

## Key Points

### thisArg Parameter Handling Rules

```javascript
function showThis() {
  console.log(this);
}

// null or undefined: points to global object in non-strict mode, keeps original value in strict mode
showThis.call(null);       // window (non-strict mode)
showThis.call(undefined);  // window (non-strict mode)

// Strict mode
function strictShowThis() {
  'use strict';
  console.log(this);
}
strictShowThis.call(null);      // null
strictShowThis.call(undefined); // undefined

// Primitive values are wrapped into objects
showThis.call(42);      // Number {42}
showThis.call('hello'); // String {'hello'}
showThis.call(true);    // Boolean {true}
```

### Differences in Parameter Passing

```javascript
function sum(a, b, c, d) {
  return a + b + c + d;
}

// call: pass arguments individually
console.log(sum.call(null, 1, 2, 3, 4)); // 10

// apply: pass as array
console.log(sum.apply(null, [1, 2, 3, 4])); // 10

// bind: can pass arguments in batches (partial application)
const addTwo = sum.bind(null, 1, 2);
console.log(addTwo(3, 4)); // 10
```

### Special Behavior of bind

```javascript
// Binding a bound function again has no effect
function greet() {
  console.log(this.name);
}

const obj1 = { name: 'Object 1' };
const obj2 = { name: 'Object 2' };

const bound1 = greet.bind(obj1);
const bound2 = bound1.bind(obj2); // Attempt to rebind

bound2(); // "Object 1" (still bound to obj1)

// When a bound function is used as a constructor, this points to the new instance
function Animal(name) {
  this.name = name;
}

const BoundAnimal = Animal.bind({ species: 'unknown' });
const cat = new BoundAnimal('Kitty');
console.log(cat.name); // "Kitty" (this points to cat, not the bound object)
```

### Arrow Functions and Explicit Binding

```javascript
const obj = { name: 'Object' };

const arrowFunc = () => {
  console.log(this.name);
};

// call, apply, bind have no effect on arrow functions
arrowFunc.call(obj);   // undefined (not "Object")
arrowFunc.apply(obj);  // undefined
arrowFunc.bind(obj)(); // undefined
```

## Code Examples

### Example 1: Method Borrowing

```javascript
// Borrow array methods for array-like objects
function logArguments() {
  // arguments is an array-like object without forEach method
  // Borrow Array.prototype.forEach
  Array.prototype.forEach.call(arguments, function(arg, index) {
    console.log(`Argument ${index + 1}: ${arg}`);
  });
}

logArguments('apple', 'banana', 'orange');
// Argument 1: apple
// Argument 2: banana
// Argument 3: orange

// Borrow slice to convert array-like to real array
function toArray() {
  return Array.prototype.slice.call(arguments);
}

console.log(toArray(1, 2, 3)); // [1, 2, 3]

// Borrow Object.prototype.toString for type detection
function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

console.log(getType([]));        // "Array"
console.log(getType({}));        // "Object"
console.log(getType(null));      // "Null"
console.log(getType(undefined)); // "Undefined"
console.log(getType(42));        // "Number"
console.log(getType(/regex/));   // "RegExp"
```

### Example 2: Classic Applications of apply

```javascript
// Find the maximum/minimum value in an array
const numbers = [5, 2, 9, 1, 7, 3, 8];

// Use apply to spread the array
const max = Math.max.apply(null, numbers);
const min = Math.min.apply(null, numbers);

console.log(`Max: ${max}, Min: ${min}`); // Max: 9, Min: 1

// After ES6, you can use the spread operator
const maxES6 = Math.max(...numbers);

// Merge arrays
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];

// Use apply to push arr2 elements into arr1
Array.prototype.push.apply(arr1, arr2);
console.log(arr1); // [1, 2, 3, 4, 5, 6]

// Dynamically call functions
function executeWithArgs(fn, args) {
  return fn.apply(null, args);
}

function multiply(a, b, c) {
  return a * b * c;
}

console.log(executeWithArgs(multiply, [2, 3, 4])); // 24
```

### Example 3: Partial Application with bind

```javascript
// Partial function: pre-fill some arguments
function multiply(a, b) {
  return a * b;
}

// Create specific multiplication functions
const double = multiply.bind(null, 2);
const triple = multiply.bind(null, 3);
const quadruple = multiply.bind(null, 4);

console.log(double(5));    // 10
console.log(triple(5));    // 15
console.log(quadruple(5)); // 20

// More complex partial application
function createUrl(protocol, domain, path) {
  return `${protocol}://${domain}/${path}`;
}

// Preset protocol
const httpUrl = createUrl.bind(null, 'https');

// Further preset domain
const apiUrl = httpUrl.bind(null, 'api.example.com');

console.log(apiUrl('users'));     // https://api.example.com/users
console.log(apiUrl('products'));  // https://api.example.com/products

// Partial application for logging functions
function log(level, timestamp, message) {
  console.log(`[${level}] ${timestamp}: ${message}`);
}

const logError = log.bind(null, 'ERROR');
const logWarning = log.bind(null, 'WARNING');
const logInfo = log.bind(null, 'INFO');

const now = new Date().toISOString();
logError(now, 'Server connection failed');   // [ERROR] 2026-01-07T...: Server connection failed
logWarning(now, 'Memory usage too high');    // [WARNING] 2026-01-07T...: Memory usage too high
logInfo(now, 'User logged in successfully'); // [INFO] 2026-01-07T...: User logged in successfully
```

### Example 4: bind in Event Handling

```javascript
class ButtonHandler {
  constructor(label) {
    this.label = label;
    this.clickCount = 0;

    // Bind this in the constructor
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    this.clickCount++;
    console.log(`${this.label} was clicked ${this.clickCount} times`);
  }

  attachTo(element) {
    // handleClick's this is already bound, safe to use as callback
    element.addEventListener('click', this.handleClick);
  }

  detachFrom(element) {
    element.removeEventListener('click', this.handleClick);
  }
}

// Classic usage in React class components (though Hooks are now recommended)
class Counter {
  constructor() {
    this.count = 0;
    // Bind methods
    this.increment = this.increment.bind(this);
    this.decrement = this.decrement.bind(this);
  }

  increment() {
    this.count++;
    this.render();
  }

  decrement() {
    this.count--;
    this.render();
  }

  render() {
    console.log(`Current count: ${this.count}`);
  }
}
```

### Example 5: Currying with bind

```javascript
// Implement simple currying using bind
function curry(fn) {
  const arity = fn.length; // Number of arguments the function expects

  return function curried(...args) {
    if (args.length >= arity) {
      return fn.apply(this, args);
    }
    // Use bind to preset existing arguments
    return curried.bind(this, ...args);
  };
}

// Test currying
function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3));    // 6
console.log(curriedAdd(1, 2)(3));    // 6
console.log(curriedAdd(1)(2, 3));    // 6
console.log(curriedAdd(1, 2, 3));    // 6

// Practical application: creating filters
function filter(predicate, array) {
  return array.filter(predicate);
}

const curriedFilter = curry(filter);

const filterEven = curriedFilter(n => n % 2 === 0);
const filterPositive = curriedFilter(n => n > 0);

console.log(filterEven([1, 2, 3, 4, 5, 6]));     // [2, 4, 6]
console.log(filterPositive([-2, -1, 0, 1, 2])); // [1, 2]
```

## Best Practices

### Prefer Arrow Functions for Callbacks

```javascript
// Modern recommended approach
class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    // Use arrow function, no need for bind
    setInterval(() => {
      this.seconds++;
      console.log(`${this.seconds} seconds elapsed`);
    }, 1000);
  }
}

// If you must use a regular function, bind in the constructor
class Timer2 {
  constructor() {
    this.seconds = 0;
    this.tick = this.tick.bind(this);
  }

  tick() {
    this.seconds++;
    console.log(`${this.seconds} seconds elapsed`);
  }

  start() {
    setInterval(this.tick, 1000);
  }
}
```

### Use Spread Operator Instead of apply

```javascript
// Before ES6
const numbers = [1, 2, 3, 4, 5];
const max = Math.max.apply(null, numbers);

// After ES6 (recommended)
const maxES6 = Math.max(...numbers);

// Merging arrays
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];

// Before
Array.prototype.push.apply(arr1, arr2);

// Now (recommended)
const combined = [...arr1, ...arr2];
```

### Avoid Frequently Creating Bound Functions

```javascript
// Not recommended: creates new function on every render
class BadExample {
  render() {
    // Creates a new bound function on every call
    button.addEventListener('click', this.handleClick.bind(this));
  }
}

// Recommended: bind once in the constructor
class GoodExample {
  constructor() {
    this.handleClick = this.handleClick.bind(this);
  }

  render() {
    button.addEventListener('click', this.handleClick);
  }
}

// Or use arrow function as class property
class BetterExample {
  handleClick = () => {
    // this is automatically bound to the instance
  };

  render() {
    button.addEventListener('click', this.handleClick);
  }
}
```

### Use call/apply Safely

```javascript
// Create an empty object as a safe thisArg
const emptyContext = Object.create(null);

function processData(data) {
  // Use empty object instead of null to avoid accidentally modifying global object
  return someFunction.apply(emptyContext, data);
}

// Use optional chaining for potentially undefined methods
const obj = {
  nested: {
    method: function() { return 'result'; }
  }
};

// Safe call
const result = obj?.nested?.method?.call(obj);
```

## Common Pitfalls

### Pitfall 1: Misunderstanding bind's Non-rebindable Nature

```javascript
function greet() {
  console.log(`Hello, ${this.name}`);
}

const person1 = { name: 'A' };
const person2 = { name: 'B' };
const person3 = { name: 'C' };

// First bind takes effect
const bound1 = greet.bind(person1);
bound1(); // Hello, A

// Subsequent binds don't change this
const bound2 = bound1.bind(person2);
bound2(); // Hello, A (still A, not B)

// call and apply also cannot change a bound function's this
bound1.call(person3); // Hello, A (still A, not C)
```

### Pitfall 2: Losing Context in Method Borrowing

```javascript
const logger = {
  prefix: '[Logger]',
  log: function(message) {
    console.log(`${this.prefix} ${message}`);
  }
};

// Wrong: direct assignment loses this
const log = logger.log;
log('test'); // undefined test

// Correct: use bind to preserve this
const boundLog = logger.log.bind(logger);
boundLog('test'); // [Logger] test

// Or use arrow function wrapper
const wrappedLog = (msg) => logger.log(msg);
wrappedLog('test'); // [Logger] test
```

### Pitfall 3: Creating Bound Functions in Loops

```javascript
// Problem code: creates new bound function on each iteration
const handlers = {};
const actions = ['save', 'load', 'delete'];

for (let i = 0; i < actions.length; i++) {
  handlers[actions[i]] = function() {
    console.log(`Executing ${actions[i]}`);
  }.bind(this); // Creates new function each time
}

// Better approach: use closure or factory function
function createHandler(action) {
  return function() {
    console.log(`Executing ${action}`);
  };
}

const betterHandlers = {};
actions.forEach(action => {
  betterHandlers[action] = createHandler(action);
});
```

### Pitfall 4: bind Behavior with Constructors

```javascript
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const obj = { custom: true };
const BoundPerson = Person.bind(obj, 'Zhang San');

// Called as regular function: this points to obj
BoundPerson(25);
console.log(obj.name, obj.age); // Zhang San 25

// Called as constructor: this points to newly created instance, ignoring bound object
const person = new BoundPerson(30);
console.log(person.name, person.age);   // Zhang San 30
console.log(person.custom);              // undefined (not obj)
console.log(person instanceof Person);   // true
```

### Pitfall 5: apply with null/undefined Arguments

```javascript
// When second argument is null or undefined, it's equivalent to no arguments
function logArgs(...args) {
  console.log(args);
}

logArgs.apply(null, null);      // []
logArgs.apply(null, undefined); // []
logArgs.apply(null, []);        // []
logArgs.apply(null, [1, 2, 3]); // [1, 2, 3]

// Note: passing non-array types may cause errors
try {
  logArgs.apply(null, 'string'); // Some environments will throw an error
} catch (e) {
  console.log('Error: apply second argument must be an array or array-like object');
}
```

## Performance Considerations

### Performance Overhead of bind

```javascript
// bind creates a new function, which has some overhead
function benchmark() {
  const obj = { value: 42 };

  function getValue() {
    return this.value;
  }

  console.time('Direct call');
  for (let i = 0; i < 1000000; i++) {
    getValue.call(obj);
  }
  console.timeEnd('Direct call');

  const boundGetValue = getValue.bind(obj);
  console.time('Bound call');
  for (let i = 0; i < 1000000; i++) {
    boundGetValue();
  }
  console.timeEnd('Bound call');

  console.time('Bind every time');
  for (let i = 0; i < 1000000; i++) {
    getValue.bind(obj)();
  }
  console.timeEnd('Bind every time');
}

// Bound call is much faster than binding every time
// So you should reuse bound functions rather than rebinding
```

### Performance Difference Between call and apply

```javascript
// In modern JavaScript engines, the difference is minimal
// But when the number of arguments is fixed, call may be slightly faster than apply

function sum(a, b, c) {
  return a + b + c;
}

// When arguments are fixed, prefer call
sum.call(null, 1, 2, 3);

// When arguments are a dynamic array, use apply or spread operator
const args = [1, 2, 3];
sum.apply(null, args);
sum(...args); // Modern code prefers spread operator
```

### Avoid bind in Hot Paths

```javascript
// Not recommended: using bind in frequently called loops
function processItems(items, processor) {
  for (const item of items) {
    // Creates new function each time
    processor.process.bind(processor)(item);
  }
}

// Recommended: bind in advance or use arrow function
function processItemsBetter(items, processor) {
  const boundProcess = processor.process.bind(processor);
  for (const item of items) {
    boundProcess(item);
  }
}

// Or use arrow function
function processItemsBest(items, processor) {
  for (const item of items) {
    processor.process(item);
  }
}
```

## Real-World Scenarios

### Scenario 1: Event Handling in React Class Components

```javascript
class TodoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { todos: [] };

    // Bind methods in constructor
    this.handleAdd = this.handleAdd.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleAdd(text) {
    this.setState(prevState => ({
      todos: [...prevState.todos, { id: Date.now(), text }]
    }));
  }

  handleDelete(id) {
    this.setState(prevState => ({
      todos: prevState.todos.filter(todo => todo.id !== id)
    }));
  }

  render() {
    return (
      <div>
        <AddButton onClick={this.handleAdd} />
        {this.state.todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onDelete={() => this.handleDelete(todo.id)}
          />
        ))}
      </div>
    );
  }
}
```

### Scenario 2: Functional Programming Utilities

```javascript
// Implement compose function
function compose(...fns) {
  return function composed(result) {
    return fns.reduceRight((acc, fn) => fn.call(this, acc), result);
  };
}

// Implement pipe function
function pipe(...fns) {
  return function piped(result) {
    return fns.reduce((acc, fn) => fn.call(this, acc), result);
  };
}

// Usage example
const addPrefix = str => `[Prefix] ${str}`;
const addSuffix = str => `${str} [Suffix]`;
const toUpperCase = str => str.toUpperCase();

const format = compose(addSuffix, toUpperCase, addPrefix);
console.log(format('message')); // [Prefix] message [Suffix] becomes uppercase

const formatPipe = pipe(addPrefix, toUpperCase, addSuffix);
console.log(formatPipe('message')); // [Prefix] message becomes uppercase then [Suffix]
```

### Scenario 3: Implementing Debounce and Throttle

```javascript
// Debounce function implementation
function debounce(fn, delay, immediate = false) {
  let timeoutId = null;

  return function debounced(...args) {
    const context = this;

    const later = () => {
      timeoutId = null;
      if (!immediate) {
        fn.apply(context, args);
      }
    };

    const callNow = immediate && !timeoutId;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, delay);

    if (callNow) {
      fn.apply(context, args);
    }
  };
}

// Throttle function implementation
function throttle(fn, limit) {
  let lastTime = 0;
  let timeoutId = null;

  return function throttled(...args) {
    const context = this;
    const now = Date.now();
    const remaining = limit - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn.apply(context, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        fn.apply(context, args);
      }, remaining);
    }
  };
}

// Usage example
const handleResize = throttle(function() {
  console.log('Window size:', window.innerWidth, window.innerHeight);
}, 200);

window.addEventListener('resize', handleResize);
```

### Scenario 4: Implementing Inheritance Patterns

```javascript
// Borrowing constructor for inheritance
function Animal(name) {
  this.name = name;
  this.species = 'animal';
}

Animal.prototype.speak = function() {
  console.log(`${this.name} makes a sound`);
};

function Dog(name, breed) {
  // Use call to borrow parent constructor
  Animal.call(this, name);
  this.breed = breed;
  this.species = 'dog';
}

// Set up prototype chain
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  console.log(`${this.name} barks`);
};

const dog = new Dog('Buddy', 'Golden Retriever');
console.log(dog.name);   // Buddy
console.log(dog.breed);  // Golden Retriever
dog.speak();             // Buddy makes a sound
dog.bark();              // Buddy barks
```

### Scenario 5: Type-Safe Method Calls

```javascript
// Safe array method calls
function safeArrayMethod(arrayLike, method, ...args) {
  if (arrayLike == null) {
    return [];
  }
  return Array.prototype[method].call(arrayLike, ...args);
}

// Handling NodeList
const nodes = document.querySelectorAll('div');
const texts = safeArrayMethod(nodes, 'map', node => node.textContent);

// Safe string method calls
function safeStringMethod(value, method, ...args) {
  if (value == null) {
    return '';
  }
  return String.prototype[method].call(String(value), ...args);
}

const result = safeStringMethod(null, 'toUpperCase'); // ''
const result2 = safeStringMethod('hello', 'toUpperCase'); // 'HELLO'
```

## Interview Key Points

### Common Interview Questions

**1. What are the differences between call, apply, and bind?**

Answer: All three are used to change a function's `this` binding.
- `call`: Immediately invokes the function, arguments passed individually
- `apply`: Immediately invokes the function, arguments passed as an array
- `bind`: Returns a new function without immediate execution, can preset arguments

**2. Implement call/apply/bind manually**

```javascript
// Simplified implementation
Function.prototype.myCall = function(context, ...args) {
  context = context ?? globalThis;
  const key = Symbol();
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};

Function.prototype.myApply = function(context, args = []) {
  context = context ?? globalThis;
  const key = Symbol();
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};

Function.prototype.myBind = function(context, ...boundArgs) {
  const fn = this;
  return function(...args) {
    return fn.apply(
      new.target ? this : context,
      [...boundArgs, ...args]
    );
  };
};
```

**3. How to implement bind using apply?**

```javascript
Function.prototype.bindWithApply = function(context, ...boundArgs) {
  const fn = this;
  return function(...args) {
    return fn.apply(context, [...boundArgs, ...args]);
  };
};
```

**4. Can a function returned by bind be bound again?**

Answer: You can call bind, but the second and subsequent binds won't change the `this` binding. The `this` value from the first bind is permanently bound.

**5. Can arrow functions use call/apply/bind to change this?**

Answer: No. Arrow functions don't have their own `this`; their `this` is determined at definition time and inherited from the outer scope. Calling `call`, `apply`, or `bind` simply ignores the passed `thisArg`.

### Code Output Questions

```javascript
// Question 1
var name = 'global';
const obj = {
  name: 'object',
  getName: function() {
    return this.name;
  }
};

console.log(obj.getName());                    // ?
console.log(obj.getName.call({ name: 'new object' })); // ?
console.log(obj.getName.bind({ name: 'bound object' })()); // ?

// Answer: object, new object, bound object

// Question 2
function foo() {
  console.log(this.a);
}

const obj1 = { a: 1, foo };
const obj2 = { a: 2 };

obj1.foo.call(obj2); // ?
// Answer: 2 (call takes precedence over implicit binding)

// Question 3
function Foo() {
  this.a = 1;
}

const obj = { a: 2 };
const Bar = Foo.bind(obj);
const bar = new Bar();
console.log(bar.a); // ?
console.log(obj.a); // ?
// Answer: 1, 2 (new call ignores bind's thisArg)
```

## Further Reading

### Official Documentation
- [MDN - Function.prototype.call()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call)
- [MDN - Function.prototype.apply()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)
- [MDN - Function.prototype.bind()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- [ECMAScript Specification - Function Objects](https://tc39.es/ecma262/#sec-function-objects)

### Classic Books
- "You Don't Know JS" (Up & Going) - Part 2: this and Object Prototypes
- "JavaScript: The Definitive Guide" (7th Edition) - Chapter 8: Functions
- "Secrets of the JavaScript Ninja" (2nd Edition) - Chapter 4: Functions for the master

### Quality Articles
- [JavaScript Deep Dive: Simulating call and apply](https://github.com/mqyqingfeng/Blog/issues/11)
- [JavaScript Deep Dive: Simulating bind](https://github.com/mqyqingfeng/Blog/issues/12)
- [Understanding this in JavaScript](https://javascript.info/object-methods)

### Related Topics
- [this Binding Mechanism](/javascript/this-binding) - Learn the complete binding rules for this in JavaScript
- [Understanding Closures](/javascript/closures) - Understand lexical scope and closures
- [Functions](/javascript/functions) - A comprehensive introduction to JavaScript functions
