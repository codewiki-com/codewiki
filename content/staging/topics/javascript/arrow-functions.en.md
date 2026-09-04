---
title: JavaScript 箭头函数
description: 深入理解 JavaScript 箭头函数：简洁语法、隐式返回、词法 this 绑定、无 arguments 对象以及使用场景分析
track: javascript
section: functions-scope
difficulty: intermediate
tags:
  - JavaScript
  - 箭头函数
  - ES6
  - this
  - 函数式编程
status: imported
origin: old/src/content/docs/javascript/arrow-functions.en.md
divergence: 0.197
issues:
  - title-lang-en
  - title-language
legacy:
  category: JavaScript
  subcategory: 函数
  order: 3
  lastUpdated: 2026-01-07
---

Arrow Functions are a more concise function syntax introduced in ES6. They simplify how functions are written and change the binding rules for `this`, making them one of the most commonly used features in modern JavaScript development.

## Concept Explanation

### What Are Arrow Functions

Arrow functions are function expressions defined using the `=>` symbol, providing a more concise syntax than traditional function expressions. Arrow functions were first released in 2015 with the ECMAScript 6 (ES6) specification.

```javascript
// Traditional function expression
const traditionalFunc = function(x) {
  return x * 2;
};

// Arrow function
const arrowFunc = (x) => {
  return x * 2;
};

// Shorthand form
const shortArrow = x => x * 2;
```

### Characteristics of Arrow Functions

1. **More concise syntax**: Omits the `function` keyword
2. **Implicit return**: Can omit `return` and curly braces for single expressions
3. **Lexical this binding**: Inherits `this` from the enclosing scope
4. **No arguments object**: Must use rest parameters instead
5. **Cannot be used as constructors**: Cannot use the `new` keyword
6. **No prototype property**: Lighter weight than regular functions

### Why Do We Need Arrow Functions

Before ES6, JavaScript's `this` binding issues troubled developers. The `this` in traditional functions depends on how they're called, not where they're defined, leading to many common errors:

```javascript
// The problem in the ES5 era
function Counter() {
  this.count = 0;

  // Problem: this in setTimeout doesn't point to Counter instance
  setInterval(function() {
    this.count++; // this points to global object, not Counter instance
    console.log(this.count); // NaN
  }, 1000);
}

// ES5 solution
function Counter() {
  var self = this; // Save this reference
  this.count = 0;

  setInterval(function() {
    self.count++; // Use saved reference
    console.log(self.count);
  }, 1000);
}

// ES6 arrow function elegant solution
function Counter() {
  this.count = 0;

  setInterval(() => {
    this.count++; // this automatically points to Counter instance
    console.log(this.count);
  }, 1000);
}
```

## Core Principles

### Lexical Scope and this Binding

The most important feature of arrow functions is **lexical this binding**. Unlike regular functions, arrow functions don't have their own `this`; they inherit `this` from the enclosing scope at definition time.

```javascript
// Regular function: this is dynamically bound at runtime
const obj1 = {
  name: 'Object 1',
  getName: function() {
    return this.name;
  }
};

const obj2 = {
  name: 'Object 2'
};

console.log(obj1.getName()); // 'Object 1'
console.log(obj1.getName.call(obj2)); // 'Object 2' - this is changed

// Arrow function: this is lexically bound at definition time
const globalThis = this;

const obj3 = {
  name: 'Object 3',
  getName: () => {
    return this.name; // this points to the enclosing scope at definition time
  }
};

console.log(obj3.getName()); // undefined (in browser) or global name
console.log(obj3.getName.call(obj2)); // Still undefined, call has no effect
```

### Internal Implementation Principle

From the engine's perspective, arrow functions can be understood as closures that capture the outer `this` at creation time:

```javascript
// Arrow function
const arrowFn = () => {
  console.log(this);
};

// Conceptually equivalent to (simplified understanding)
const _this = this;
const equivalentFn = function() {
  console.log(_this);
}.bind(_this);
```

However, arrow functions have a fundamental difference from `bind`:

```javascript
// A function created with bind still has its own this, just fixed
const boundFn = function() {
  console.log(this);
}.bind({ name: 'bound' });

// Arrow functions simply don't have their own this
const arrowFn = () => {
  console.log(this);
};

// Verify the difference
console.log(boundFn.hasOwnProperty('prototype')); // true
console.log(arrowFn.hasOwnProperty('prototype')); // false
```

### Execution Context and Arrow Functions

When the JavaScript engine executes an arrow function, it doesn't create a new `this` binding:

```javascript
// Execution context stack illustration
function outer() {
  // Outer execution context: this = someValue

  const arrow = () => {
    // Arrow function execution context: doesn't create new this
    // Uses outer this = someValue
    console.log(this);
  };

  const regular = function() {
    // Regular function execution context: this = depends on call method
    console.log(this);
  };

  arrow();   // someValue
  regular(); // undefined (strict mode) or global
}

outer.call({ name: 'outer object' });
```

## Key Points

### Basic Syntax Forms

```javascript
// Complete form
const full = (a, b) => {
  const sum = a + b;
  return sum;
};

// Single parameter can omit parentheses
const single = x => {
  return x * 2;
};

// Single expression can omit curly braces and return (implicit return)
const implicit = x => x * 2;

// No parameters must use empty parentheses
const noParams = () => console.log('no parameters');

// Multiple parameters must use parentheses
const multiParams = (a, b, c) => a + b + c;

// Using rest parameters
const rest = (...args) => args.reduce((a, b) => a + b);
```

### Implicit Return

```javascript
// Returning primitive values
const double = x => x * 2;

// Returning arrays
const toArray = (a, b) => [a, b];

// Returning object literals (must wrap with parentheses)
const createPerson = (name, age) => ({ name, age });

// Wrong example: without parentheses it's parsed as function body
const wrong = (name, age) => { name, age }; // Returns undefined

// Returning ternary expressions
const abs = x => x >= 0 ? x : -x;

// Returning logical expressions
const getDefault = value => value || 'default value';

// Returning function calls
const log = msg => console.log(msg);

// Returning template strings
const greet = name => `Hello, ${name}!`;
```

### No arguments Object

```javascript
// Regular functions have arguments
function traditionalSum() {
  console.log(arguments); // Arguments object
  return Array.from(arguments).reduce((a, b) => a + b);
}

// Arrow functions don't have arguments
const arrowSum = () => {
  // console.log(arguments); // ReferenceError
};

// Solution: use rest parameters
const arrowSumFixed = (...args) => {
  console.log(args); // A real array
  return args.reduce((a, b) => a + b);
};

console.log(arrowSumFixed(1, 2, 3, 4, 5)); // 15

// Arrow functions can access outer function's arguments
function outer() {
  const inner = () => {
    console.log(arguments); // outer's arguments
  };
  inner();
}

outer(1, 2, 3); // Arguments [1, 2, 3]
```

### Cannot Be Used as Constructors

```javascript
// Regular functions can be used as constructors
function Person(name) {
  this.name = name;
}
const person1 = new Person('John'); // Works fine

// Arrow functions cannot be used as constructors
const PersonArrow = (name) => {
  this.name = name;
};

try {
  const person2 = new PersonArrow('Jane');
} catch (e) {
  console.log(e.message); // PersonArrow is not a constructor
}

// Arrow functions don't have prototype property
console.log(Person.prototype); // {constructor: f}
console.log(PersonArrow.prototype); // undefined
```

### Cannot Change this

```javascript
const arrowFn = () => {
  console.log(this);
};

const obj = { name: 'object' };

// call, apply, bind cannot change arrow function's this
arrowFn.call(obj);   // Still outer this
arrowFn.apply(obj);  // Still outer this
const bound = arrowFn.bind(obj);
bound(); // Still outer this

// Compare with regular function
const regularFn = function() {
  console.log(this);
};

regularFn.call(obj);  // { name: 'object' }
regularFn.apply(obj); // { name: 'object' }
```

### No new.target

```javascript
// Regular functions can detect if called with new
function Regular() {
  console.log(new.target);
}

new Regular(); // function Regular
Regular();     // undefined

// Arrow functions don't have new.target
const Arrow = () => {
  // console.log(new.target); // Syntax error or references outer
};
```

## Code Examples

### Arrow Functions in Array Methods

```javascript
const products = [
  { name: 'Phone', price: 5999, stock: 100 },
  { name: 'Computer', price: 8999, stock: 50 },
  { name: 'Headphones', price: 299, stock: 200 },
  { name: 'Tablet', price: 3999, stock: 80 },
  { name: 'Watch', price: 2499, stock: 150 }
];

// map: Transform data
const productNames = products.map(p => p.name);
console.log(productNames); // ['Phone', 'Computer', 'Headphones', 'Tablet', 'Watch']

// filter: Filter data
const expensiveProducts = products.filter(p => p.price > 3000);
console.log(expensiveProducts);
// [{ name: 'Phone', ... }, { name: 'Computer', ... }, { name: 'Tablet', ... }]

// reduce: Aggregate data
const totalValue = products.reduce(
  (total, p) => total + p.price * p.stock,
  0
);
console.log(totalValue); // 2,197,200

// find: Find element
const phone = products.find(p => p.name === 'Phone');
console.log(phone); // { name: 'Phone', price: 5999, stock: 100 }

// some: Check if any exists
const hasExpensive = products.some(p => p.price > 10000);
console.log(hasExpensive); // false

// every: Check if all satisfy
const allInStock = products.every(p => p.stock > 0);
console.log(allInStock); // true

// sort: Sort (note: modifies original array)
const sortedByPrice = [...products].sort((a, b) => b.price - a.price);
console.log(sortedByPrice[0].name); // 'Computer'

// Method chaining
const result = products
  .filter(p => p.price > 1000)
  .map(p => ({ ...p, totalValue: p.price * p.stock }))
  .sort((a, b) => b.totalValue - a.totalValue)
  .map(p => `${p.name}: $${p.totalValue.toLocaleString()}`);

console.log(result);
// ['Phone: $599,900', 'Computer: $449,950', 'Watch: $374,850', 'Tablet: $319,920']
```

### Promise and Async Operations

```javascript
// Promise chain
const fetchUser = userId =>
  fetch(`/api/users/${userId}`)
    .then(response => response.json())
    .then(user => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName}`
    }))
    .catch(error => {
      console.error('Failed to fetch user:', error);
      return null;
    });

// async/await with arrow functions
const fetchUserAsync = async userId => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const user = await response.json();
    return {
      ...user,
      fullName: `${user.firstName} ${user.lastName}`
    };
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
};

// Parallel requests
const fetchMultipleUsers = async userIds => {
  const promises = userIds.map(id => fetchUserAsync(id));
  return Promise.all(promises);
};

// Usage example
fetchMultipleUsers([1, 2, 3])
  .then(users => users.filter(user => user !== null))
  .then(validUsers => console.log(validUsers));
```

### Event Handling

```javascript
// DOM event handling
class ClickCounter {
  constructor(buttonId) {
    this.count = 0;
    this.button = document.getElementById(buttonId);
    this.display = document.getElementById('display');

    // Using arrow function to maintain this reference
    this.button.addEventListener('click', () => {
      this.count++;
      this.updateDisplay();
    });
  }

  updateDisplay() {
    this.display.textContent = `Click count: ${this.count}`;
  }
}

// Comparison: Using regular function requires extra handling
class ClickCounterOld {
  constructor(buttonId) {
    this.count = 0;
    this.button = document.getElementById(buttonId);
    this.display = document.getElementById('display');

    // Method 1: bind this
    this.button.addEventListener('click', function() {
      this.count++;
      this.updateDisplay();
    }.bind(this));

    // Method 2: Save this reference
    const self = this;
    this.button.addEventListener('click', function() {
      self.count++;
      self.updateDisplay();
    });
  }

  updateDisplay() {
    this.display.textContent = `Click count: ${this.count}`;
  }
}
```

### Functional Programming Patterns

```javascript
// Currying
const curry = fn => {
  const curried = (...args) =>
    args.length >= fn.length
      ? fn(...args)
      : (...more) => curried(...args, ...more);
  return curried;
};

const add = curry((a, b, c) => a + b + c);
console.log(add(1)(2)(3)); // 6
console.log(add(1, 2)(3)); // 6
console.log(add(1)(2, 3)); // 6

// Function composition
const compose = (...fns) => x =>
  fns.reduceRight((acc, fn) => fn(acc), x);

const pipe = (...fns) => x =>
  fns.reduce((acc, fn) => fn(acc), x);

// Usage example
const addOne = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

const computeCompose = compose(square, double, addOne);
const computePipe = pipe(addOne, double, square);

console.log(computeCompose(3)); // ((3 + 1) * 2)^2 = 64
console.log(computePipe(3));    // ((3 + 1) * 2)^2 = 64

// Partial application
const partial = (fn, ...presetArgs) =>
  (...laterArgs) => fn(...presetArgs, ...laterArgs);

const multiply = (a, b, c) => a * b * c;
const multiplyByTwo = partial(multiply, 2);

console.log(multiplyByTwo(3, 4)); // 2 * 3 * 4 = 24

// Memoization
const memoize = fn => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const fibonacci = memoize(n =>
  n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2)
);

console.log(fibonacci(50)); // Fast calculation, no stack overflow
```

### Arrow Functions in Classes

```javascript
class Timer {
  constructor() {
    this.seconds = 0;
    this.intervalId = null;
  }

  // Arrow functions in class fields (ES2022+)
  // Automatically binds this, suitable for callbacks
  tick = () => {
    this.seconds++;
    console.log(`${this.seconds} seconds elapsed`);
  };

  start = () => {
    if (!this.intervalId) {
      this.intervalId = setInterval(this.tick, 1000);
    }
  };

  stop = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  };

  reset = () => {
    this.stop();
    this.seconds = 0;
  };
}

const timer = new Timer();

// Can safely pass methods as callbacks
const { start, stop } = timer;
setTimeout(start, 0);  // this still points to timer instance
setTimeout(stop, 5000); // Stop after 5 seconds

// Comparison: Regular methods lose this when used as callbacks
class TimerBroken {
  constructor() {
    this.seconds = 0;
  }

  tick() {
    this.seconds++; // this may be undefined when called as callback
  }

  start() {
    setInterval(this.tick, 1000); // Error: this in this.tick is incorrect
  }
}
```

## Best Practices

### Choose Appropriate Use Cases

```javascript
// Suitable for arrow functions

// 1. Array method callbacks
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

// 2. Promise chains
fetchData()
  .then(data => processData(data))
  .then(result => displayResult(result));

// 3. Short function expressions
const isEven = n => n % 2 === 0;
const square = n => n * n;

// 4. Callbacks that need to preserve this
class Component {
  constructor() {
    this.state = { count: 0 };
    button.addEventListener('click', () => {
      this.setState({ count: this.state.count + 1 });
    });
  }
}

// 5. Factory functions that immediately return objects or values
const createPoint = (x, y) => ({ x, y });
const createAction = type => ({ type, timestamp: Date.now() });
```

### Avoid Unsuitable Scenarios

```javascript
// Not suitable for arrow functions

// 1. Object methods (need to access the object itself)
const calculator = {
  value: 0,
  // Wrong
  addArrow: (n) => {
    this.value += n; // this doesn't point to calculator
  },
  // Correct
  add(n) {
    this.value += n;
  }
};

// 2. Prototype methods
function Person(name) {
  this.name = name;
}

// Wrong
Person.prototype.sayHelloArrow = () => {
  console.log(`Hello, I'm ${this.name}`); // this is incorrect
};

// Correct
Person.prototype.sayHello = function() {
  console.log(`Hello, I'm ${this.name}`);
};

// 3. Constructors
// const Person = (name) => { this.name = name; }; // Cannot use new

// 4. Scenarios that need arguments object
function sum() {
  return Array.from(arguments).reduce((a, b) => a + b, 0);
}

// 5. Event handlers with dynamic context
button.addEventListener('click', function() {
  console.log(this); // Points to button element
  this.classList.toggle('active');
});

// 6. Scenarios that need function hoisting
// Arrow functions are not hoisted
```

### Maintain Consistency

```javascript
// Keep consistent style in your project

// Style 1: Prefer arrow functions
const utils = {
  formatDate: date => date.toISOString().split('T')[0],
  capitalize: str => str.charAt(0).toUpperCase() + str.slice(1),
  isEmpty: value => value == null || value === ''
};

// Style 2: Use regular functions for methods
const utils2 = {
  formatDate(date) {
    return date.toISOString().split('T')[0];
  },
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  isEmpty(value) {
    return value == null || value === '';
  }
};

// Choose one style and maintain it throughout the project
```

### Use Implicit Return Reasonably

```javascript
// Good implicit return usage
const double = x => x * 2;
const isValid = item => item.status === 'active';
const getName = user => user.name;

// When too complex, use explicit return
// Not good
const processItem = item => item.status === 'active'
  ? { ...item, processed: true, timestamp: Date.now() }
  : { ...item, processed: false, error: 'Item is not active' };

// Better
const processItem = item => {
  if (item.status === 'active') {
    return {
      ...item,
      processed: true,
      timestamp: Date.now()
    };
  }
  return {
    ...item,
    processed: false,
    error: 'Item is not active'
  };
};
```

### Pay Attention to Readability

```javascript
// Nested arrow functions can be hard to read
// Not good
const result = arr.map(x => y => z => x + y + z);

// Better: Extract to named functions
const createAdder = x => y => x + y;
const add5 = createAdder(5);
console.log(add5(3)); // 8

// Or use comments to explain
const createAdder2 = x =>    // First level: receive base number
  y =>                       // Second level: receive number to add
    x + y;                   // Return sum
```

## Common Pitfalls

### this in Object Methods

```javascript
// Pitfall: Using arrow function for object literal methods
const person = {
  name: 'John',
  // Wrong: this doesn't point to person
  greetArrow: () => {
    console.log(`Hello, I'm ${this.name}`);
  },
  // Correct
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
};

person.greetArrow(); // Hello, I'm undefined
person.greet();      // Hello, I'm John
```

### Forgetting Parentheses When Returning Object Literals

```javascript
// Pitfall: Returning object literals
const createUser = (name, age) => { name, age }; // Returns undefined!

// Reason: Curly braces are parsed as function body, comma expression returns last value
const wrong = (name, age) => {
  name; // Expression statement
  age;  // Expression statement, function has no explicit return, returns undefined
};

// Correct: Wrap with parentheses
const createUserCorrect = (name, age) => ({ name, age });
```

### Line Break Issues with Implicit Return

```javascript
// Pitfall: Line break after arrow
const broken = ()
  => 'hello'; // SyntaxError!

// Correct
const working = () =>
  'hello';

// Or
const working2 = () => (
  'hello'
);
```

### Using arguments

```javascript
// Pitfall: Trying to use arguments
const showArgs = () => {
  console.log(arguments); // ReferenceError or accesses outer arguments
};

// Solution
const showArgsFixed = (...args) => {
  console.log(args);
};

// Note: Arrow functions inherit outer arguments
function outer() {
  const inner = () => {
    console.log(arguments); // This is outer's arguments!
  };
  inner();
}

outer(1, 2, 3); // Arguments [1, 2, 3]
```

### Using the new Keyword

```javascript
// Pitfall: Trying to new arrow function
const Person = name => {
  this.name = name;
};

// new Person('John'); // TypeError: Person is not a constructor

// Solution: Use regular function or class
function PersonFunc(name) {
  this.name = name;
}

class PersonClass {
  constructor(name) {
    this.name = name;
  }
}
```

### Confusing Destructuring Parameters and Arrow

```javascript
// Pitfall: Confusion when combining destructuring with arrow functions
const processUser = { name, age } => { /* ... */ }; // SyntaxError!

// Correct: Destructuring parameters need parentheses
const processUserCorrect = ({ name, age }) => {
  console.log(name, age);
};

// Default parameters
const greet = ({ name = 'Guest' } = {}) => {
  console.log(`Hello, ${name}`);
};

greet();           // Hello, Guest
greet({});         // Hello, Guest
greet({ name: 'John' }); // Hello, John
```

### Naming Issues in Recursion

```javascript
// Pitfall: Anonymous arrow functions are hard to recurse
const factorial = n => {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // Depends on external variable name
};

// Problem: Recursion fails after reassignment
const originalFactorial = factorial;
// factorial = null; // If this happens...
// originalFactorial(5); // Error! Internal call still uses factorial

// Solution 1: Use Y combinator (functional)
const Y = fn => (x => fn(v => x(x)(v)))(x => fn(v => x(x)(v)));

const factorialY = Y(f => n => n <= 1 ? 1 : n * f(n - 1));

// Solution 2: Use named function expression
const factorialNamed = function fact(n) {
  if (n <= 1) return 1;
  return n * fact(n - 1);
};
```

## Performance Considerations

### Creation Overhead

```javascript
// Arrow functions may have slight creation overhead advantage in some scenarios
// Because they don't have prototype property

// Regular function
function regular() {}
console.log(regular.prototype); // { constructor: f }

// Arrow function
const arrow = () => {};
console.log(arrow.prototype); // undefined

// But in practical applications the difference is negligible and shouldn't be a selection criterion
```

### Creating Functions in Loops

```javascript
// Note: Creating functions in loops may impact performance

// Potential issue: New function created each iteration
for (let i = 0; i < 1000; i++) {
  array.map(x => x * 2); // New arrow function created each iteration
}

// Optimization: Extract outside the loop
const double = x => x * 2;
for (let i = 0; i < 1000; i++) {
  array.map(double);
}

// Or use for loop instead of map (in performance-critical scenarios)
const result = [];
for (let i = 0; i < array.length; i++) {
  result.push(array[i] * 2);
}
```

### Inlining and Optimization

```javascript
// Modern JavaScript engines optimize arrow functions well
// Short arrow functions are usually inlined

// V8 and other engines optimize this type of code
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);

// Performance-critical code testing
const iterations = 1000000;

console.time('arrow');
for (let i = 0; i < iterations; i++) {
  numbers.map(x => x * 2);
}
console.timeEnd('arrow');

console.time('regular');
for (let i = 0; i < iterations; i++) {
  numbers.map(function(x) { return x * 2; });
}
console.timeEnd('regular');

// Results are usually very close, modern engines optimize well
```

### Memory Considerations

```javascript
// Arrow functions in class fields: Each instance creates a new function
class ComponentWithArrow {
  handleClick = () => {
    console.log(this);
  };
}

// Each instance has its own handleClick function
const c1 = new ComponentWithArrow();
const c2 = new ComponentWithArrow();
console.log(c1.handleClick === c2.handleClick); // false

// Prototype methods: All instances share the same function
class ComponentWithPrototype {
  handleClick() {
    console.log(this);
  }
}

const p1 = new ComponentWithPrototype();
const p2 = new ComponentWithPrototype();
console.log(p1.handleClick === p2.handleClick); // true

// If creating many instances, prototype methods save more memory
// But watch out for this binding behavior
```

## Practical Scenarios

### Scenario 1: Event Handling in React Components

```javascript
// Arrow functions in React class components
class Counter extends React.Component {
  state = { count: 0 };

  // Using arrow function to automatically bind this
  increment = () => {
    this.setState(state => ({ count: state.count + 1 }));
  };

  decrement = () => {
    this.setState(state => ({ count: state.count - 1 }));
  };

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.increment}>+</button>
        <button onClick={this.decrement}>-</button>
      </div>
    );
  }
}

// Arrow functions in React functional components
const CounterFunctional = () => {
  const [count, setCount] = React.useState(0);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
};
```

### Scenario 2: Data Processing Pipeline

```javascript
// E-commerce data processing example
const orders = [
  { id: 1, userId: 101, items: [{ price: 100, qty: 2 }, { price: 50, qty: 1 }], status: 'completed', date: '2024-01-15' },
  { id: 2, userId: 102, items: [{ price: 200, qty: 1 }], status: 'pending', date: '2024-01-16' },
  { id: 3, userId: 101, items: [{ price: 150, qty: 3 }], status: 'completed', date: '2024-01-17' },
  { id: 4, userId: 103, items: [{ price: 80, qty: 2 }, { price: 120, qty: 1 }], status: 'completed', date: '2024-01-18' },
];

// Data processing functions
const calculateOrderTotal = order =>
  order.items.reduce((sum, item) => sum + item.price * item.qty, 0);

const enrichOrder = order => ({
  ...order,
  total: calculateOrderTotal(order)
});

const isCompleted = order => order.status === 'completed';

const byUserId = userId => order => order.userId === userId;

const sumTotals = orders =>
  orders.reduce((sum, order) => sum + order.total, 0);

// Process data with pipeline
const getUserCompletedOrdersTotal = userId =>
  orders
    .map(enrichOrder)
    .filter(isCompleted)
    .filter(byUserId(userId))
    |> sumTotals; // Pipeline operator (Stage 2 proposal)

// Current syntax implementation
const getUserCompletedOrdersTotalCurrent = userId =>
  sumTotals(
    orders
      .map(enrichOrder)
      .filter(isCompleted)
      .filter(byUserId(userId))
  );

console.log(getUserCompletedOrdersTotalCurrent(101)); // 250 + 450 = 700
```

### Scenario 3: API Request Wrapper

```javascript
// API utility functions
const createApi = baseUrl => {
  const request = (method, endpoint) => async (data = null) => {
    const config = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  return {
    get: endpoint => request('GET', endpoint),
    post: endpoint => request('POST', endpoint),
    put: endpoint => request('PUT', endpoint),
    delete: endpoint => request('DELETE', endpoint)
  };
};

// Usage example
const api = createApi('https://api.example.com');

const userApi = {
  getAll: api.get('/users'),
  getById: id => api.get(`/users/${id}`)(),
  create: api.post('/users'),
  update: (id, data) => api.put(`/users/${id}`)(data),
  delete: id => api.delete(`/users/${id}`)()
};

// Calling
userApi.getAll()
  .then(users => console.log(users))
  .catch(error => console.error(error));

userApi.create({ name: 'John', email: 'john@example.com' })
  .then(user => console.log('Created successfully:', user));
```

### Scenario 4: State Management

```javascript
// Simple state management implementation
const createStore = (initialState, reducers) => {
  let state = initialState;
  const listeners = [];

  const getState = () => state;

  const dispatch = action => {
    const reducer = reducers[action.type];
    if (reducer) {
      state = reducer(state, action.payload);
      listeners.forEach(listener => listener(state));
    }
    return action;
  };

  const subscribe = listener => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  };

  return { getState, dispatch, subscribe };
};

// Define reducers
const todoReducers = {
  ADD_TODO: (state, payload) => ({
    ...state,
    todos: [...state.todos, { id: Date.now(), text: payload, done: false }]
  }),

  TOGGLE_TODO: (state, payload) => ({
    ...state,
    todos: state.todos.map(todo =>
      todo.id === payload ? { ...todo, done: !todo.done } : todo
    )
  }),

  REMOVE_TODO: (state, payload) => ({
    ...state,
    todos: state.todos.filter(todo => todo.id !== payload)
  }),

  SET_FILTER: (state, payload) => ({
    ...state,
    filter: payload
  })
};

// Create store
const store = createStore(
  { todos: [], filter: 'all' },
  todoReducers
);

// Action creators
const addTodo = text => ({ type: 'ADD_TODO', payload: text });
const toggleTodo = id => ({ type: 'TOGGLE_TODO', payload: id });
const removeTodo = id => ({ type: 'REMOVE_TODO', payload: id });
const setFilter = filter => ({ type: 'SET_FILTER', payload: filter });

// Usage
store.subscribe(state => console.log('State updated:', state));

store.dispatch(addTodo('Learn arrow functions'));
store.dispatch(addTodo('Complete project'));
store.dispatch(toggleTodo(store.getState().todos[0].id));
```

## Interview Key Points

### Differences Between Arrow Functions and Regular Functions

**Standard Answer Points:**

1. **More concise syntax**: Uses `=>` instead of `function` keyword
2. **No own this**: Lexically bound, inherits this from enclosing scope
3. **No arguments object**: Must use rest parameters `...args`
4. **Cannot be used as constructor**: No `[[Construct]]` internal method, cannot use `new`
5. **No prototype property**: Because it cannot be a constructor
6. **No new.target**: Cannot detect if called via `new`
7. **Cannot be used as Generator**: Cannot use `yield` keyword

### What is Lexical this?

**Standard Answer:**

Lexical this means the arrow function's this value is determined at definition time, decided by the nearest enclosing non-arrow function's this. This is different from regular functions where this is dynamically determined at runtime based on how they're called.

```javascript
// Lexical this example
function outer() {
  // Outer this
  const arrow = () => {
    console.log(this); // Same as outer this
  };
  arrow();
}

outer.call({ name: 'test' }); // { name: 'test' }
```

### When Should Arrow Functions Not Be Used?

**Standard Answer Points:**

1. **Object methods**: When you need to access the object itself
2. **Prototype methods**: Methods added to prototype
3. **Constructors**: Cannot use new
4. **Scenarios needing arguments**: Arrow functions don't have arguments
5. **Event handlers needing dynamic this**: When you need this to point to the triggering element
6. **Scenarios needing function hoisting**: Arrow functions are not hoisted

### Do call/apply/bind Work on Arrow Functions?

**Standard Answer:**

They don't work for changing this binding. Arrow functions don't have their own this, so call, apply, bind cannot change their this reference. However, these methods can still be used to pass parameters:

```javascript
const arrow = (...args) => console.log(args);
arrow.call(null, 1, 2, 3); // [1, 2, 3] - Parameters passed normally
```

### How to Access arguments in Arrow Functions?

**Standard Answer:**

There are two methods:
1. **Use rest parameters**: `const fn = (...args) => { console.log(args); }`
2. **Access outer function's arguments**: Arrow functions inherit the enclosing scope's arguments

```javascript
function outer() {
  const inner = () => console.log(arguments);
  inner();
}
outer(1, 2, 3); // Arguments [1, 2, 3]
```

### Can Arrow Functions Be Used as Constructors? Why?

**Standard Answer:**

No. Reasons:
1. Arrow functions don't have `[[Construct]]` internal method
2. Arrow functions don't have `prototype` property
3. Arrow functions don't have their own `this`, cannot initialize instance properties

```javascript
const Arrow = () => {};
new Arrow(); // TypeError: Arrow is not a constructor
console.log(Arrow.prototype); // undefined
```

### What Are the Pros and Cons of Using Arrow Functions in Class Fields?

**Standard Answer:**

**Pros:**
- Automatically binds this, can safely be passed as callbacks
- More concise code

**Cons:**
- Each instance creates a new function, uses more memory
- Cannot use `super.method()` in subclasses
- May affect type inference in TypeScript

```javascript
class Example {
  // Class field arrow function - independent for each instance
  arrowMethod = () => this;

  // Prototype method - shared by all instances
  regularMethod() { return this; }
}
```

## Further Reading

### Official Documentation
- [MDN: Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- [ECMAScript Specification: Arrow Function Definitions](https://tc39.es/ecma262/#sec-arrow-function-definitions)

### Deep Dive
- [You Don't Know JS: this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/this-object-prototypes/README.md)
- [JavaScript: The Definitive Guide, 7th Edition](https://www.oreilly.com/library/view/javascript-the-definitive/9781491952016/) - Chapter 8

### Related Topics
- [JavaScript this Binding Explained](/javascript/this-binding)
- [JavaScript Closures](/javascript/closures)
- [JavaScript Functions](/javascript/functions)
- [ES6 New Features](/javascript/es6-features)

### Best Practice Guides
- [Airbnb JavaScript Style Guide - Arrow Functions](https://github.com/airbnb/javascript#arrow-functions)
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html#features-functions-arrow-functions)
