---
title: JavaScript 函数
description: 掌握 JavaScript 函数：声明、箭头函数、闭包与高阶函数
track: javascript
section: functions-scope
difficulty: intermediate
tags:
  - JavaScript
  - 函数
  - 闭包
  - 箭头函数
status: imported
origin: old/src/content/docs/javascript/functions.en.md
divergence: 0.219
issues:
  - title-lang-en
  - title-language
legacy:
  category: JavaScript
  subcategory: 核心概念
  order: 2
  lastUpdated: 2026-01-07
---

Functions are a core concept in JavaScript, representing reusable blocks of code designed to perform specific tasks. Mastering functions is essential for writing high-quality JavaScript code.

## Function Declarations and Expressions

### Function Declarations

Function declarations are the most basic way to define functions and feature hoisting behavior.

```javascript
// Function declaration
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('John')); // Output: Hello, John!

// Function hoisting example
console.log(add(2, 3)); // Output: 5 (can be called before declaration)

function add(a, b) {
  return a + b;
}
```

### Function Expressions

Function expressions assign a function to a variable and do not have hoisting behavior.

```javascript
// Anonymous function expression
const subtract = function(a, b) {
  return a - b;
};

console.log(subtract(10, 3)); // Output: 7

// Named function expression (useful for debugging and recursion)
const factorial = function fact(n) {
  if (n <= 1) return 1;
  return n * fact(n - 1);
};

console.log(factorial(5)); // Output: 120
```

### Function Declaration vs Function Expression

```javascript
// ❌ Error: Function expressions are not hoisted
try {
  multiply(2, 3); // ReferenceError
} catch(e) {
  console.log('multiply is not yet defined');
}

const multiply = function(a, b) {
  return a * b;
};

// ✅ Correct: Function declarations are hoisted
divide(10, 2); // Works correctly

function divide(a, b) {
  return a / b;
}
```

## Arrow Functions

Arrow functions are a concise syntax introduced in ES6, featuring lexical `this` binding.

### Basic Syntax

```javascript
// Traditional function
const traditional = function(x) {
  return x * 2;
};

// Arrow function
const arrow = (x) => {
  return x * 2;
};

// Simplified syntax (parentheses optional for single parameter)
const simple = x => x * 2;

// Multiple parameters
const sum = (a, b) => a + b;

// No parameters
const getRandomNumber = () => Math.random();

// Returning object literals (must wrap in parentheses)
const createPerson = (name, age) => ({ name, age });

console.log(createPerson('Alice', 25)); // { name: 'Alice', age: 25 }
```

### Differences in this Binding

Arrow functions do not bind their own `this`; instead, they inherit `this` from the enclosing scope.

```javascript
// Traditional function's this
const person1 = {
  name: 'John',
  sayHello: function() {
    console.log(`Hello, I'm ${this.name}`);
  }
};

person1.sayHello(); // Output: Hello, I'm John

// Arrow function's this
const person2 = {
  name: 'Jane',
  sayHello: () => {
    console.log(`Hello, I'm ${this.name}`); // this refers to outer scope
  }
};

person2.sayHello(); // Output: Hello, I'm undefined

// Practical use case
class Counter {
  constructor() {
    this.count = 0;
  }

  // Use arrow function to preserve this reference
  increment = () => {
    this.count++;
    console.log(this.count);
  }

  // Delayed call example
  startCounting() {
    setInterval(() => {
      this.count++;
      console.log(`Count: ${this.count}`);
    }, 1000);
  }
}
```

### When to Use Arrow Functions

```javascript
// ✅ Appropriate use cases for arrow functions

// 1. Array methods
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);

// 2. Callback functions
setTimeout(() => console.log('Delayed execution'), 1000);

// 3. Promise chains
fetch('/api/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));

// ❌ Inappropriate use cases for arrow functions

// 1. Object methods (when you need to access the object's this)
const calculator = {
  value: 0,
  // Wrong
  addArrow: (n) => {
    this.value += n; // this doesn't point to calculator
  },
  // Correct
  addRegular: function(n) {
    this.value += n;
  }
};

// 2. Constructors
// const Person = (name) => { this.name = name; }; // ❌ Error

// 3. When you need the arguments object
const regularFunc = function() {
  console.log(arguments); // Works correctly
};

const arrowFunc = () => {
  // console.log(arguments); // ❌ Error: Arrow functions don't have arguments
};
```

## Parameter Handling

### Default Parameters

```javascript
// ES6 default parameters
function greet(name = 'Guest', greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}

console.log(greet()); // Output: Hello, Guest!
console.log(greet('Sarah')); // Output: Hello, Sarah!
console.log(greet('Mike', 'Good morning')); // Output: Good morning, Mike!

// Default parameters can reference other parameters
function createUser(name, role = 'user', id = generateId(name)) {
  return { name, role, id };
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}`;
}
```

### Rest Parameters

```javascript
// Collect any number of arguments
function sum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}

console.log(sum(1, 2, 3)); // Output: 6
console.log(sum(1, 2, 3, 4, 5)); // Output: 15

// Combined with regular parameters
function multiply(multiplier, ...numbers) {
  return numbers.map(n => n * multiplier);
}

console.log(multiply(2, 1, 2, 3)); // Output: [2, 4, 6]

// Practical application: logging function
function log(level, ...messages) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}]`, ...messages);
}

log('INFO', 'User logged in', { userId: 123 });
```

### Spread Operator

```javascript
// Spread array in function call
const numbers = [1, 2, 3];
console.log(Math.max(...numbers)); // Output: 3

// Merge arrays
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];

// Copy objects
const original = { name: 'John', age: 20 };
const copy = { ...original, age: 21 }; // Override age property

console.log(copy); // { name: 'John', age: 21 }
```

### Destructuring Parameters

```javascript
// Object destructuring
function createProfile({ name, age, city = 'New York' }) {
  return `${name}, ${age} years old, from ${city}`;
}

const user = { name: 'Emma', age: 28, city: 'Los Angeles' };
console.log(createProfile(user)); // Output: Emma, 28 years old, from Los Angeles

// Array destructuring
function getCoordinates([x, y, z = 0]) {
  return { x, y, z };
}

console.log(getCoordinates([10, 20])); // { x: 10, y: 20, z: 0 }

// Nested destructuring
function processOrder({
  items,
  user: { name, email },
  shipping: { address, city } = {}
}) {
  console.log(`Processing order: ${name} (${email})`);
  console.log(`Shipping to: ${city} ${address}`);
}
```

## Closures

A closure is a function that has access to variables from its outer scope, even after the outer function has finished executing.

### Basic Concept of Closures

```javascript
// Basic closure example
function outerFunction(outerVariable) {
  return function innerFunction(innerVariable) {
    console.log(`Outer variable: ${outerVariable}`);
    console.log(`Inner variable: ${innerVariable}`);
  };
}

const closure = outerFunction('outer');
closure('inner');
// Output:
// Outer variable: outer
// Inner variable: inner
```

### Practical Applications of Closures

#### Data Privacy

```javascript
// Create private variables
function createCounter() {
  let count = 0; // Private variable

  return {
    increment() {
      count++;
      return count;
    },
    decrement() {
      count--;
      return count;
    },
    getCount() {
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.decrement()); // 1
console.log(counter.getCount()); // 1
// console.log(counter.count); // undefined - cannot access directly
```

#### Function Factories

```javascript
// Create functions with specific functionality
function createMultiplier(multiplier) {
  return function(number) {
    return number * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15

// Practical application: creating validators
function createValidator(regex, errorMessage) {
  return function(input) {
    if (regex.test(input)) {
      return { valid: true };
    }
    return { valid: false, error: errorMessage };
  };
}

const emailValidator = createValidator(
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  'Please enter a valid email address'
);

const phoneValidator = createValidator(
  /^\d{10}$/,
  'Please enter a valid phone number'
);

console.log(emailValidator('test@example.com')); // { valid: true }
console.log(phoneValidator('12345')); // { valid: false, error: '...' }
```

#### Event Handlers

```javascript
// Closure preserving state
function setupButton(buttonId) {
  let clickCount = 0;

  document.getElementById(buttonId)?.addEventListener('click', function() {
    clickCount++;
    console.log(`Button ${buttonId} has been clicked ${clickCount} times`);
  });
}

// Each button has its own independent clickCount
setupButton('btn1');
setupButton('btn2');
```

#### Module Pattern

```javascript
// Creating modules
const userModule = (function() {
  // Private variables and functions
  let users = [];

  function validateUser(user) {
    return user.name && user.email;
  }

  // Public API
  return {
    addUser(user) {
      if (validateUser(user)) {
        users.push(user);
        return true;
      }
      return false;
    },

    getUsers() {
      return [...users]; // Return a copy to protect internal data
    },

    getUserCount() {
      return users.length;
    }
  };
})();

userModule.addUser({ name: 'John', email: 'john@example.com' });
console.log(userModule.getUserCount()); // 1
// console.log(users); // ❌ Error: Cannot access private variable
```

### Common Closure Pitfalls

```javascript
// Closure pitfall in loops
function createFunctions() {
  const functions = [];

  // ❌ Incorrect example
  for (var i = 0; i < 3; i++) {
    functions.push(function() {
      console.log(i);
    });
  }

  return functions;
}

const funcs = createFunctions();
funcs[0](); // Output: 3 (not 0)
funcs[1](); // Output: 3 (not 1)
funcs[2](); // Output: 3 (not 2)

// ✅ Solution 1: Use let
function createFunctionsCorrect1() {
  const functions = [];

  for (let i = 0; i < 3; i++) { // Use let instead of var
    functions.push(function() {
      console.log(i);
    });
  }

  return functions;
}

// ✅ Solution 2: Use IIFE
function createFunctionsCorrect2() {
  const functions = [];

  for (var i = 0; i < 3; i++) {
    functions.push((function(index) {
      return function() {
        console.log(index);
      };
    })(i));
  }

  return functions;
}

// ✅ Solution 3: Use array methods
function createFunctionsCorrect3() {
  return [0, 1, 2].map(i => () => console.log(i));
}
```

## Higher-Order Functions

Higher-order functions are functions that accept functions as arguments or return functions.

### Accepting Functions as Arguments

```javascript
// Custom map function
function myMap(array, callback) {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(callback(array[i], i, array));
  }
  return result;
}

const numbers = [1, 2, 3, 4, 5];
const squared = myMap(numbers, n => n * n);
console.log(squared); // [1, 4, 9, 16, 25]

// Custom filter function
function myFilter(array, predicate) {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i, array)) {
      result.push(array[i]);
    }
  }
  return result;
}

const evens = myFilter(numbers, n => n % 2 === 0);
console.log(evens); // [2, 4]
```

### Returning Functions

```javascript
// Function composition
function compose(...functions) {
  return function(input) {
    return functions.reduceRight((acc, fn) => fn(acc), input);
  };
}

const addOne = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

const compute = compose(square, double, addOne);
console.log(compute(3)); // ((3 + 1) * 2)² = 64

// Pipe function (left to right)
function pipe(...functions) {
  return function(input) {
    return functions.reduce((acc, fn) => fn(acc), input);
  };
}

const process = pipe(addOne, double, square);
console.log(process(3)); // ((3 + 1) * 2)² = 64
```

### Common Higher-Order Functions

```javascript
const students = [
  { name: 'Alice', score: 85, grade: 'A' },
  { name: 'Bob', score: 92, grade: 'A' },
  { name: 'Charlie', score: 78, grade: 'B' },
  { name: 'Diana', score: 95, grade: 'A' },
  { name: 'Eve', score: 68, grade: 'C' }
];

// map: Transform data
const names = students.map(s => s.name);
console.log(names); // ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']

// filter: Filter data
const topStudents = students.filter(s => s.score >= 90);
console.log(topStudents); // [{ name: 'Bob', ... }, { name: 'Diana', ... }]

// reduce: Aggregate data
const totalScore = students.reduce((sum, s) => sum + s.score, 0);
const averageScore = totalScore / students.length;
console.log(averageScore); // 83.6

// find: Find a single element
const student = students.find(s => s.name === 'Alice');
console.log(student); // { name: 'Alice', score: 85, grade: 'A' }

// some: Test if at least one element meets the condition
const hasExcellent = students.some(s => s.score >= 95);
console.log(hasExcellent); // true

// every: Test if all elements meet the condition
const allPassed = students.every(s => s.score >= 60);
console.log(allPassed); // true

// Method chaining
const topScores = students
  .filter(s => s.grade === 'A')
  .map(s => s.score)
  .sort((a, b) => b - a);

console.log(topScores); // [95, 92, 85]
```

### Practical Application: Functional Programming

```javascript
// Function currying
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}

const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3)); // 6
console.log(curriedAdd(1, 2)(3)); // 6
console.log(curriedAdd(1)(2, 3)); // 6

// Partial application
function partial(fn, ...fixedArgs) {
  return function(...remainingArgs) {
    return fn(...fixedArgs, ...remainingArgs);
  };
}

const multiply = (a, b, c) => a * b * c;
const double = partial(multiply, 2);

console.log(double(3, 4)); // 2 * 3 * 4 = 24

// Debounce function
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Throttle function
function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage examples
const expensiveOperation = () => console.log('Executing expensive operation');
const debouncedOp = debounce(expensiveOperation, 300);
const throttledOp = throttle(expensiveOperation, 300);
```

## IIFE (Immediately Invoked Function Expression)

An IIFE is a function that is defined and immediately executed, commonly used to create isolated scopes.

### Basic Syntax

```javascript
// Syntax 1: Wrap the entire expression in parentheses
(function() {
  console.log('IIFE executed');
})();

// Syntax 2: Wrap the function in parentheses
(function() {
  console.log('IIFE executed');
}());

// Arrow function IIFE
(() => {
  console.log('Arrow function IIFE');
})();

// IIFE with parameters
(function(name) {
  console.log(`Hello, ${name}!`);
})('World');

// IIFE with return value
const result = (function() {
  const a = 10;
  const b = 20;
  return a + b;
})();

console.log(result); // 30
```

### IIFE Use Cases

#### Avoiding Global Pollution

```javascript
// ❌ Pollutes global scope
var counter = 0;
var increment = function() { counter++; };
var decrement = function() { counter--; };

// ✅ Use IIFE to avoid global pollution
const counterModule = (function() {
  let counter = 0; // Private variable

  return {
    increment: () => ++counter,
    decrement: () => --counter,
    getCount: () => counter
  };
})();

console.log(counterModule.increment()); // 1
console.log(counterModule.getCount()); // 1
```

#### Creating Isolated Scopes

```javascript
// Using IIFE in loops
for (var i = 0; i < 3; i++) {
  (function(index) {
    setTimeout(function() {
      console.log(`Index: ${index}`);
    }, 100);
  })(i);
}
// Output: Index: 0, Index: 1, Index: 2

// Modern approach using let
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(`Index: ${i}`), 100);
}
```

#### Module Pattern

```javascript
const app = (function() {
  // Private variables and functions
  const config = {
    apiUrl: 'https://api.example.com',
    timeout: 5000
  };

  function log(message) {
    console.log(`[App] ${message}`);
  }

  function fetchData(endpoint) {
    log(`Fetching data: ${endpoint}`);
    return fetch(`${config.apiUrl}/${endpoint}`);
  }

  // Public API
  return {
    init() {
      log('Application initialized');
    },

    getData(endpoint) {
      return fetchData(endpoint);
    },

    setApiUrl(url) {
      config.apiUrl = url;
      log(`API URL updated to: ${url}`);
    }
  };
})();

app.init();
app.setApiUrl('https://new-api.example.com');
```

#### Singleton Pattern

```javascript
const singleton = (function() {
  let instance;

  function createInstance() {
    const object = {
      name: 'Singleton Object',
      data: []
    };
    return object;
  }

  return {
    getInstance() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

const obj1 = singleton.getInstance();
const obj2 = singleton.getInstance();

console.log(obj1 === obj2); // true - same instance
```

## Best Practices

### Function Naming

```javascript
// ✅ Use descriptive names starting with verbs
function calculateTotal(items) { /* ... */ }
function validateEmail(email) { /* ... */ }
function getUserById(id) { /* ... */ }

// ❌ Avoid vague names
function process(data) { /* ... */ }
function handle() { /* ... */ }
function doIt(x) { /* ... */ }
```

### Single Responsibility

```javascript
// ❌ Function does too many things
function processUser(user) {
  // Validate
  if (!user.email) throw new Error('Email is missing');

  // Transform
  user.name = user.name.toUpperCase();

  // Save
  database.save(user);

  // Send email
  sendEmail(user.email);
}

// ✅ Each function does one thing
function validateUser(user) {
  if (!user.email) throw new Error('Email is missing');
  if (!user.name) throw new Error('Name is missing');
}

function normalizeUser(user) {
  return {
    ...user,
    name: user.name.toUpperCase(),
    email: user.email.toLowerCase()
  };
}

function saveUser(user) {
  return database.save(user);
}

function notifyUser(user) {
  return sendEmail(user.email);
}

// Compose them together
function processUser(user) {
  validateUser(user);
  const normalized = normalizeUser(user);
  const saved = saveUser(normalized);
  notifyUser(saved);
  return saved;
}
```

### Number of Parameters

```javascript
// ❌ Too many parameters
function createUser(name, age, email, phone, address, city, country, zipCode) {
  // ...
}

// ✅ Use object parameters
function createUser({ name, age, email, phone, address, city, country, zipCode }) {
  // ...
}

// Clearer when calling
createUser({
  name: 'John',
  age: 25,
  email: 'john@example.com',
  city: 'New York'
});
```

### Pure Functions

```javascript
// ❌ Impure function (has side effects)
let total = 0;
function addToTotal(value) {
  total += value; // Modifies external variable
  return total;
}

// ✅ Pure function (no side effects)
function add(a, b) {
  return a + b; // Only depends on inputs, doesn't modify external state
}

// Benefits of pure functions
const result1 = add(2, 3);
const result2 = add(2, 3);
console.log(result1 === result2); // true - same input always produces same output
```

### Error Handling

```javascript
// ✅ Use try-catch for error handling
function parseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parsing failed:', error.message);
    return null;
  }
}

// ✅ Return early to reduce nesting
function processOrder(order) {
  if (!order) {
    throw new Error('Order cannot be empty');
  }

  if (!order.items || order.items.length === 0) {
    throw new Error('Order must contain items');
  }

  if (order.total < 0) {
    throw new Error('Order total cannot be negative');
  }

  // Process valid order
  return calculateTotal(order);
}
```

## Summary

JavaScript functions are fundamental to programming. Master these key concepts:

1. **Function Declarations and Expressions**: Understand hoisting and differences between definition methods
2. **Arrow Functions**: Master the concise syntax and this binding rules
3. **Parameter Handling**: Use modern features like default parameters, rest parameters, and destructuring
4. **Closures**: Understand scope chains and practical applications of closures
5. **Higher-Order Functions**: Write functions that accept or return functions to enable functional programming
6. **IIFE**: Create isolated scopes and avoid global pollution

By practicing these concepts, you will be able to write cleaner, more modular, and more maintainable JavaScript code.

## Further Learning

- Async functions (async/await)
- Generator functions
- Functional programming paradigms
- Function applications in design patterns
- Performance optimization techniques (memoization, tail call optimization)
