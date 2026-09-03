---
title: JavaScript 柯里化与函数组合
description: 深入理解 JavaScript 函数式编程核心概念：柯里化、偏函数应用、函数组合、管道与 Point-free 风格
track: javascript
section: functions-scope
difficulty: advanced
tags:
  - JavaScript
  - 柯里化
  - 函数组合
  - 函数式编程
  - 高阶函数
status: imported
origin: old/src/content/docs/javascript/currying-composition.en.md
divergence: 0.207
issues:
  - title-lang-en
  - title-language
legacy:
  category: JavaScript
  subcategory: 函数式编程
  order: 20
  lastUpdated: 2026-01-07
---

Currying and Composition are two core techniques in functional programming. They help us write more modular, reusable, and testable code. We'll cover the principles, implementations, and practical applications of these concepts in depth.

## Concept Explanations

### What is Currying

Currying is a technique that transforms a function with multiple arguments into a sequence of functions, each taking a single argument. The name comes from mathematician Haskell Curry.

```javascript
// Regular function: accepts all arguments at once
function add(a, b, c) {
  return a + b + c;
}
add(1, 2, 3); // 6

// Curried function: accepts one argument at a time
function curriedAdd(a) {
  return function(b) {
    return function(c) {
      return a + b + c;
    };
  };
}
curriedAdd(1)(2)(3); // 6
```

### What is Partial Application

Partial application is fixing some arguments of a function to produce a new function that accepts the remaining arguments. Unlike currying, partial application can fix multiple arguments at once.

```javascript
// Partial application
function multiply(a, b, c) {
  return a * b * c;
}

// Fix the first argument to 2
function multiplyByTwo(b, c) {
  return multiply(2, b, c);
}

multiplyByTwo(3, 4); // 24
```

### What is Function Composition

Function composition is the process of combining multiple functions into a new function, where the output of one function becomes the input of the next.

```javascript
// Independent functions
const double = x => x * 2;
const addOne = x => x + 1;
const square = x => x * x;

// Function composition: executes from right to left
const composed = x => square(addOne(double(x)));
composed(3); // square(addOne(double(3))) = square(addOne(6)) = square(7) = 49
```

### What is Pipe

Pipe is a variant of function composition, but the execution order is from left to right, which is more aligned with human reading habits.

```javascript
// Pipe: executes from left to right
const piped = x => square(double(addOne(x)));
// More intuitive representation: addOne -> double -> square
```

### What is Point-free Style

Point-free (also known as Tacit Programming) is a programming style where function definitions do not explicitly mention their arguments.

```javascript
// Non Point-free
const addOneExplicit = x => add(1, x);

// Point-free
const addOnePointFree = add(1); // Assuming add is curried
```

## Core Principles

### Mathematical Foundation of Currying

The mathematical foundation of currying comes from Lambda Calculus. In Lambda Calculus, all functions accept only a single argument. Multi-argument functions can be represented through nested single-argument functions:

```
f(a, b, c) ≡ f(a)(b)(c)
```

The key to this equivalent transformation is closures - inner functions can access the arguments of outer functions.

### Mathematical Foundation of Function Composition

Function composition originates from the concept of composite functions in mathematics:

```
(f ∘ g)(x) = f(g(x))
```

Where `∘` represents the composition operator, `f ∘ g` is read as "f composed with g", meaning execute g first, then execute f.

### The Role of Closures in Currying

Currying relies on closures to "remember" previously passed arguments:

```javascript
function curry(fn) {
  return function curried(...args) {
    // Closure preserves fn and the collected args
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    // Return a new function to continue collecting arguments
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}
```

## Key Points

### Characteristics of Currying

1. **Argument Reuse**: Can create specific versions based on already curried functions
2. **Delayed Execution**: Calculation is only performed when enough arguments are collected
3. **Composition Friendly**: Single-argument functions are easier to compose

### Differences Between Partial Application and Currying

| Feature | Currying | Partial Application |
|---------|----------|---------------------|
| Argument passing | One at a time | Can be multiple |
| Return value | Always returns a function (until all arguments) | Returns a function accepting remaining arguments |
| Argument order | Must be left to right | Can fix arguments at any position |

### Characteristics of Function Composition

1. **Executes right to left**: `compose(f, g, h)(x)` equals `f(g(h(x)))`
2. **Satisfies associativity**: `compose(f, compose(g, h))` equals `compose(compose(f, g), h)`
3. **Identity function**: `compose(f, identity)` equals `f`

## Code Examples

### Implementing a Generic Curry Function

```javascript
// Basic version
function curry(fn) {
  const arity = fn.length;

  return function curried(...args) {
    if (args.length >= arity) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, [...args, ...moreArgs]);
    };
  };
}

// Usage example
const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3));     // 6
console.log(curriedAdd(1, 2)(3));     // 6
console.log(curriedAdd(1)(2, 3));     // 6
console.log(curriedAdd(1, 2, 3));     // 6
```

### Currying with Placeholder Support

```javascript
const _ = Symbol('placeholder');

function curryWithPlaceholder(fn) {
  const arity = fn.length;

  return function curried(...args) {
    // Check if there are enough non-placeholder arguments
    const realArgs = args.filter(arg => arg !== _);

    if (realArgs.length >= arity) {
      return fn.apply(this, realArgs);
    }

    return function(...moreArgs) {
      // Replace placeholders
      const mergedArgs = args.map(arg =>
        arg === _ && moreArgs.length ? moreArgs.shift() : arg
      );
      // Add remaining arguments
      return curried.apply(this, [...mergedArgs, ...moreArgs]);
    };
  };
}

// Usage example
const subtract = (a, b, c) => a - b - c;
const curriedSubtract = curryWithPlaceholder(subtract);

console.log(curriedSubtract(10)(2)(1));      // 7
console.log(curriedSubtract(_, 2, _)(10)(1)); // 7  (10 - 2 - 1)
console.log(curriedSubtract(_, _, 1)(10)(2)); // 7  (10 - 2 - 1)
```

### Implementing Partial Application

```javascript
// Basic version: fix left-side arguments
function partial(fn, ...fixedArgs) {
  return function(...remainingArgs) {
    return fn.apply(this, [...fixedArgs, ...remainingArgs]);
  };
}

// Usage example
const greet = (greeting, name, punctuation) =>
  `${greeting}, ${name}${punctuation}`;

const sayHello = partial(greet, 'Hello');
console.log(sayHello('John', '!')); // Hello, John!

const greetJohn = partial(greet, 'Hello', 'John');
console.log(greetJohn('!')); // Hello, John!
```

### Partial Application with Right-side Fixing

```javascript
// Fix arguments from the right side
function partialRight(fn, ...fixedArgs) {
  return function(...remainingArgs) {
    return fn.apply(this, [...remainingArgs, ...fixedArgs]);
  };
}

// Usage example
const divide = (a, b) => a / b;
const divideBy2 = partialRight(divide, 2);

console.log(divideBy2(10)); // 5 (10 / 2)
```

### Partial Application at Any Position

```javascript
const __ = Symbol('partialPlaceholder');

function partialAny(fn, ...partialArgs) {
  return function(...remainingArgs) {
    const args = partialArgs.map(arg =>
      arg === __ ? remainingArgs.shift() : arg
    );
    return fn.apply(this, [...args, ...remainingArgs]);
  };
}

// Usage example
const formatDate = (year, month, day) => `${year}-${month}-${day}`;

const formatCurrentYear = partialAny(formatDate, 2026, __, __);
console.log(formatCurrentYear(1, 7)); // 2026-1-7

const formatJanuary = partialAny(formatDate, __, 1, __);
console.log(formatJanuary(2026, 15)); // 2026-1-15
```

### Implementing Function Composition (compose)

```javascript
// Basic version
function compose(...fns) {
  if (fns.length === 0) {
    return arg => arg;
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return function(...args) {
    return fns.reduceRight((acc, fn, index) => {
      // The first function can receive multiple arguments
      return index === fns.length - 1
        ? fn.apply(this, acc)
        : fn(acc);
    }, args);
  };
}

// Usage example
const double = x => x * 2;
const addOne = x => x + 1;
const square = x => x * x;

const compute = compose(square, addOne, double);
console.log(compute(3)); // square(addOne(double(3))) = 49

// More complex example
const toLowerCase = str => str.toLowerCase();
const split = separator => str => str.split(separator);
const join = separator => arr => arr.join(separator);
const map = fn => arr => arr.map(fn);

const slugify = compose(
  join('-'),
  map(s => s.trim()),
  split(' '),
  toLowerCase
);

console.log(slugify('Hello World JavaScript')); // "hello-world-javascript"
```

### Implementing Pipe

```javascript
// Basic version
function pipe(...fns) {
  if (fns.length === 0) {
    return arg => arg;
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return function(...args) {
    return fns.reduce((acc, fn, index) => {
      return index === 0
        ? fn.apply(this, acc)
        : fn(acc);
    }, args);
  };
}

// Usage example
const processNumber = pipe(
  double,
  addOne,
  square
);

console.log(processNumber(3)); // ((3 * 2) + 1)² = 49

// Practical application: data processing pipeline
const processUsers = pipe(
  users => users.filter(u => u.age >= 18),
  users => users.map(u => ({ ...u, isAdult: true })),
  users => users.sort((a, b) => a.name.localeCompare(b.name))
);

const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 16 },
  { name: 'Charlie', age: 30 }
];

console.log(processUsers(users));
// [{ name: 'Alice', age: 25, isAdult: true }, { name: 'Charlie', age: 30, isAdult: true }]
```

### Async Function Composition

```javascript
// Async compose
function composeAsync(...fns) {
  return function(input) {
    return fns.reduceRight(
      (chain, fn) => chain.then(fn),
      Promise.resolve(input)
    );
  };
}

// Async pipe
function pipeAsync(...fns) {
  return function(input) {
    return fns.reduce(
      (chain, fn) => chain.then(fn),
      Promise.resolve(input)
    );
  };
}

// Usage example
const fetchUser = async (id) => {
  // Simulated API call
  return { id, name: 'John', email: 'john@example.com' };
};

const validateUser = async (user) => {
  if (!user.email) throw new Error('Missing email');
  return user;
};

const enrichUser = async (user) => {
  return { ...user, timestamp: Date.now() };
};

const processUser = pipeAsync(
  fetchUser,
  validateUser,
  enrichUser
);

processUser(123).then(console.log);
// { id: 123, name: 'John', email: 'john@example.com', timestamp: ... }
```

### Point-free Style Examples

```javascript
// Utility functions
const prop = key => obj => obj[key];
const filter = predicate => arr => arr.filter(predicate);
const map = fn => arr => arr.map(fn);
const reduce = (fn, initial) => arr => arr.reduce(fn, initial);
const gt = a => b => b > a;
const add = a => b => a + b;

// Non Point-free style
const sumOfAdultAgesExplicit = users => {
  return users
    .filter(user => user.age > 18)
    .map(user => user.age)
    .reduce((sum, age) => sum + age, 0);
};

// Point-free style
const sumOfAdultAges = pipe(
  filter(pipe(prop('age'), gt(18))),
  map(prop('age')),
  reduce(add, 0)
);

const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 16 },
  { name: 'Charlie', age: 30 }
];

console.log(sumOfAdultAges(users)); // 55
```

## Best Practices

### Argument Order Design

When designing curry-friendly functions, place the most likely to change arguments last:

```javascript
// Good design: configuration first, data last
const formatCurrency = curry((currency, decimals, amount) => {
  return `${currency}${amount.toFixed(decimals)}`;
});

const formatUSD = formatCurrency('$', 2);
const formatCNY = formatCurrency('¥', 2);

console.log(formatUSD(1234.567)); // $1234.57
console.log(formatCNY(1234.567)); // ¥1234.57

// Bad design: data first
const badFormat = curry((amount, currency, decimals) => {
  return `${currency}${amount.toFixed(decimals)}`;
});
// Hard to create useful partial applications
```

### Function Granularity Control

Keep functions small and focused for easy composition:

```javascript
// Small functions, easy to compose
const trim = s => s.trim();
const toLowerCase = s => s.toLowerCase();
const split = sep => s => s.split(sep);
const join = sep => arr => arr.join(sep);
const replace = (pattern, replacement) => s => s.replace(pattern, replacement);

const slugify = pipe(
  trim,
  toLowerCase,
  replace(/\s+/g, '-'),
  replace(/[^\w-]/g, '')
);

// Large function, hard to reuse
const slugifyMonolithic = str => {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
};
```

### Use Meaningful Intermediate Function Names

```javascript
// Name intermediate functions for better readability
const isAdult = user => user.age >= 18;
const getName = user => user.name;
const sortAlphabetically = (a, b) => a.localeCompare(b);

const getAdultNames = pipe(
  filter(isAdult),
  map(getName),
  arr => arr.sort(sortAlphabetically)
);

// Anonymous functions are harder to understand
const getAdultNamesAnonymous = pipe(
  filter(u => u.age >= 18),
  map(u => u.name),
  arr => arr.sort((a, b) => a.localeCompare(b))
);
```

### Use Point-free Appropriately

```javascript
// Moderate use of Point-free, maintain readability
const getActiveUserEmails = pipe(
  filter(prop('isActive')),
  map(prop('email'))
);

// Overuse leads to difficulty understanding
const overcomplicated = pipe(
  filter(compose(not, prop('deleted'))),
  map(compose(toLowerCase, prop('email'))),
  filter(compose(gt(0), prop('length')))
);

// Add comments and naming as appropriate
const isNotDeleted = compose(not, prop('deleted'));
const getEmailLowerCase = compose(toLowerCase, prop('email'));
const isNotEmpty = compose(gt(0), prop('length'));

const getValidEmails = pipe(
  filter(isNotDeleted),
  map(getEmailLowerCase),
  filter(isNotEmpty)
);
```

### Handling Side Effects

Isolate side effects at the end of the composition chain:

```javascript
// Pure functions process data, side effects at the end
const processAndLog = pipe(
  filter(isAdult),
  map(formatUser),
  users => {
    console.log('Processing complete:', users.length);
    return users;
  }
);

// Or use a tap function
const tap = fn => value => {
  fn(value);
  return value;
};

const processAndLogBetter = pipe(
  filter(isAdult),
  map(formatUser),
  tap(users => console.log('Processing complete:', users.length))
);
```

## Common Pitfalls

### Ignoring Function Arity

```javascript
// Problem: parseInt accepts two arguments
['1', '2', '3'].map(parseInt);
// Result: [1, NaN, NaN]
// Because map passes (value, index, array)

// Solution 1: Wrapper function
['1', '2', '3'].map(s => parseInt(s, 10));
// Result: [1, 2, 3]

// Solution 2: Use a unary wrapper
const unary = fn => arg => fn(arg);
['1', '2', '3'].map(unary(parseInt));
// Note: This still has issues because radix is not specified

// Best solution
const parseDecimal = curry(parseInt)(_, 10); // Use partial to fix radix
['1', '2', '3'].map(s => parseInt(s, 10));
```

### Losing this Binding

```javascript
// Problem: Currying may lose this
const obj = {
  value: 10,
  add(a, b) {
    return this.value + a + b;
  }
};

const curriedAdd = curry(obj.add);
// curriedAdd(1)(2) // Error: this is undefined

// Solution 1: Bind this
const boundAdd = curry(obj.add.bind(obj));
console.log(boundAdd(1)(2)); // 13

// Solution 2: Use arrow functions
const obj2 = {
  value: 10,
  add: (a, b) => obj2.value + a + b
};
```

### Over-currying

```javascript
// Unnecessary currying
const add = curry((a, b) => a + b);
const result = add(1)(2); // Overkill, 1 + 2 is clearer

// Only curry when reuse is needed
const formatCurrency = curry((symbol, amount) => `${symbol}${amount}`);
const formatUSD = formatCurrency('$');
const formatCNY = formatCurrency('¥');
// Here currying has practical value
```

### Overly Long Composition Chains

```javascript
// Overly long composition chains are hard to debug
const processData = pipe(
  step1,
  step2,
  step3,
  step4,
  step5,
  step6,
  step7,
  step8
);
// Difficult to locate errors

// Group and name sub-pipelines
const validateData = pipe(step1, step2, step3);
const transformData = pipe(step4, step5);
const formatData = pipe(step6, step7, step8);

const processData = pipe(
  validateData,
  transformData,
  formatData
);
```

### Improper Error Handling

```javascript
// Errors in the middle of a composition chain interrupt the entire flow
const riskyPipeline = pipe(
  JSON.parse,      // May throw an error
  processData,
  formatOutput
);

// Use Result type or try-catch wrapper
const safeJSONParse = str => {
  try {
    return { success: true, data: JSON.parse(str) };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

const safePipeline = pipe(
  safeJSONParse,
  result => result.success ? processData(result.data) : result,
  result => result.success !== false ? formatOutput(result) : result
);

// More elegant solution: use Maybe or Either Monad
```

## Performance Considerations

### Currying Performance Overhead

```javascript
// Currying creates multiple closures and function objects
const curriedAdd = curry((a, b, c) => a + b + c);

// Each call creates a new function
const add1 = curriedAdd(1);     // Creates one function
const add1And2 = add1(2);       // Creates another function
const result = add1And2(3);     // Finally executes

// For hot paths, consider avoiding currying
// Avoid using currying in loops
for (let i = 0; i < 1000000; i++) {
  curriedAdd(1)(2)(i);
}

// Use regular functions in loops
const add = (a, b, c) => a + b + c;
for (let i = 0; i < 1000000; i++) {
  add(1, 2, i);
}
```

### Optimizing Composition Chains

```javascript
// Short-circuit optimization: filter early to reduce subsequent processing
const processUsers = pipe(
  // Filter first to reduce data volume for subsequent processing
  filter(isActive),
  filter(isAdult),
  map(enrichUser),
  map(formatUser)
);

// Merge map operations
// Multiple traversals
const process1 = pipe(
  map(double),
  map(addOne),
  map(square)
);

// Compose functions for single traversal
const combinedOperation = compose(square, addOne, double);
const process2 = map(combinedOperation);
```

### Memoization Optimization

```javascript
// Add caching for expensive computations
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// Currying + Memoization
const memoizedCurry = fn => {
  const memoized = memoize(fn);
  return curry(memoized);
};

// Usage example
const expensiveCalculation = memoizedCurry((a, b, c) => {
  console.log('Calculating...');
  return a ** b ** c;
});

console.log(expensiveCalculation(2)(3)(4)); // Calculating... 2417851639229258349412352
console.log(expensiveCalculation(2)(3)(4)); // Uses cache, no output
```

### Lazy Evaluation

```javascript
// Use generators for lazy pipelines
function* lazyPipe(iterable, ...fns) {
  for (const item of iterable) {
    let value = item;
    for (const fn of fns) {
      value = fn(value);
    }
    yield value;
  }
}

// Usage example: only process the data you need
const users = generateManyUsers(1000000);

const processedUsers = lazyPipe(
  users,
  user => ({ ...user, processed: true }),
  user => user.age > 18 ? user : null,
  user => user && user.name.toUpperCase()
);

// Only take the first 10 results
let count = 0;
for (const user of processedUsers) {
  if (user && ++count <= 10) {
    console.log(user);
  }
  if (count >= 10) break;
}
```

## Practical Scenarios

### Form Validation

```javascript
// Validation function factory
const validate = {
  required: field => value =>
    value ? { valid: true } : { valid: false, error: `${field} is required` },

  minLength: (field, min) => value =>
    value.length >= min
      ? { valid: true }
      : { valid: false, error: `${field} must be at least ${min} characters` },

  maxLength: (field, max) => value =>
    value.length <= max
      ? { valid: true }
      : { valid: false, error: `${field} must be at most ${max} characters` },

  pattern: (field, regex, message) => value =>
    regex.test(value)
      ? { valid: true }
      : { valid: false, error: message || `${field} format is invalid` },

  email: field => validate.pattern(
    field,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    'Please enter a valid email address'
  )
};

// Compose multiple validation rules
const validateField = (...validators) => value => {
  for (const validator of validators) {
    const result = validator(value);
    if (!result.valid) return result;
  }
  return { valid: true };
};

// Usage example
const validateUsername = validateField(
  validate.required('Username'),
  validate.minLength('Username', 3),
  validate.maxLength('Username', 20),
  validate.pattern('Username', /^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
);

const validateEmail = validateField(
  validate.required('Email'),
  validate.email('Email')
);

console.log(validateUsername('ab'));        // { valid: false, error: 'Username must be at least 3 characters' }
console.log(validateUsername('john_doe'));  // { valid: true }
console.log(validateEmail('invalid'));      // { valid: false, error: 'Please enter a valid email address' }
```

### Data Processing Pipeline

```javascript
// E-commerce order processing
const processOrders = pipe(
  // Filter valid orders
  filter(order => order.status !== 'cancelled'),

  // Calculate total price for each order
  map(order => ({
    ...order,
    total: order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })),

  // Apply discounts
  map(order => ({
    ...order,
    finalTotal: order.couponCode
      ? order.total * 0.9
      : order.total
  })),

  // Sort by total price
  orders => orders.sort((a, b) => b.finalTotal - a.finalTotal),

  // Generate report
  orders => ({
    count: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.finalTotal, 0),
    orders: orders.slice(0, 10) // Only return top 10
  })
);

// Usage example
const orders = [
  { id: 1, status: 'completed', items: [{ price: 100, quantity: 2 }], couponCode: 'SAVE10' },
  { id: 2, status: 'cancelled', items: [{ price: 50, quantity: 1 }] },
  { id: 3, status: 'completed', items: [{ price: 200, quantity: 1 }] }
];

console.log(processOrders(orders));
```

### API Request Builder

```javascript
// Curried request builder
const createRequest = curry((baseUrl, method, endpoint, options) => ({
  url: `${baseUrl}${endpoint}`,
  method,
  ...options
}));

// Create request builder for a specific API
const apiRequest = createRequest('https://api.example.com');
const get = apiRequest('GET');
const post = apiRequest('POST');
const put = apiRequest('PUT');
const del = apiRequest('DELETE');

// Create requests for specific endpoints
const getUsers = get('/users');
const getUser = id => get(`/users/${id}`);
const createUser = data => post('/users')({ body: JSON.stringify(data) });
const updateUser = curry((id, data) => put(`/users/${id}`)({ body: JSON.stringify(data) }));
const deleteUser = id => del(`/users/${id}`);

// Usage example
console.log(getUsers({}));
// { url: 'https://api.example.com/users', method: 'GET' }

console.log(createUser({ name: 'John' }));
// { url: 'https://api.example.com/users', method: 'POST', body: '{"name":"John"}' }
```

### Function Composition in React

```javascript
// Higher-Order Component composition
const withLoading = Component => props =>
  props.loading ? <div>Loading...</div> : <Component {...props} />;

const withError = Component => props =>
  props.error ? <div>Error: {props.error}</div> : <Component {...props} />;

const withAuth = Component => props =>
  props.user ? <Component {...props} /> : <div>Please log in first</div>;

// Compose multiple HOCs
const enhance = compose(
  withAuth,
  withError,
  withLoading
);

const EnhancedUserProfile = enhance(UserProfile);

// Function composition in Hooks
function useProcessedData(rawData) {
  return useMemo(() =>
    pipe(
      filter(isValid),
      map(transform),
      sortBy('date')
    )(rawData),
    [rawData]
  );
}
```

### Middleware Pattern

```javascript
// Express-style middleware composition
const compose = (...middlewares) => {
  return (req, res, next) => {
    let index = -1;

    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;

      let fn = middlewares[i];
      if (i === middlewares.length) fn = next;
      if (!fn) return Promise.resolve();

      try {
        return Promise.resolve(fn(req, res, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
};

// Middleware definitions
const logger = async (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  const start = Date.now();
  await next();
  console.log(`Duration: ${Date.now() - start}ms`);
};

const auth = async (req, res, next) => {
  if (!req.headers.authorization) {
    res.status = 401;
    res.body = { error: 'Unauthorized' };
    return;
  }
  await next();
};

const handler = async (req, res) => {
  res.body = { message: 'Success' };
};

// Compose middleware
const app = compose(logger, auth, handler);
```

## Interview Key Points

### What is currying? What are its advantages?

**Key points**:
- Currying is a technique that transforms a multi-argument function into a series of single-argument functions
- Advantages: argument reuse, delayed execution, easier function composition

```javascript
// Example code
const multiply = a => b => c => a * b * c;
const double = multiply(2);
const quadruple = multiply(4);

console.log(double(3)(4));    // 24
console.log(quadruple(3)(4)); // 48
```

### Implement a curry function

```javascript
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
```

### Difference between compose and pipe

**Key points**:
- `compose`: Executes right to left, `compose(f, g, h)(x)` = `f(g(h(x)))`
- `pipe`: Executes left to right, `pipe(f, g, h)(x)` = `h(g(f(x)))`
- `pipe` is more aligned with human reading habits

### Difference between currying and partial application

**Key points**:
- Currying: Accepts one argument at a time, returns a function accepting the next argument
- Partial application: Can fix multiple arguments at once, returns a function accepting the remaining arguments
- Currying is a special case of partial application

### What is Point-free style?

**Key points**:
- A programming style where function definitions do not explicitly mention their arguments
- Creates new functions through function composition
- Advantages: more concise, easier to compose
- Disadvantages: may reduce readability

```javascript
// Non Point-free
const getNames = users => users.map(user => user.name);

// Point-free
const prop = key => obj => obj[key];
const map = fn => arr => arr.map(fn);
const getNames = map(prop('name'));
```

### How to handle this binding in curried functions?

```javascript
// Use bind
const boundMethod = curry(obj.method.bind(obj));

// Or preserve this in the curry implementation
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return curried.bind(this, ...args);
  };
}
```

## Further Reading

### Official Documentation and Specifications
- [MDN - Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- [MDN - Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)

### Functional Programming Libraries
- [Ramda](https://ramdajs.com/) - A JavaScript library designed specifically for functional programming
- [Lodash/fp](https://github.com/lodash/lodash/wiki/FP-Guide) - The functional programming version of Lodash
- [Sanctuary](https://sanctuary.js.org/) - A type-safe functional programming library

### Classic Books
- "Functional-Light JavaScript" - Kyle Simpson
- "Functional Programming in JavaScript" - Luis Atencio
- "Mostly Adequate Guide to Functional Programming" - Brian Lonsdorf

### Related Articles
- [Composing Software](https://medium.com/javascript-scene/composing-software-the-book-f31c77fc3ddc) - Eric Elliott
- [Functional JavaScript](https://www.sitepoint.com/introduction-functional-javascript/) - SitePoint

### Online Courses
- [Functional-Light JavaScript](https://frontendmasters.com/courses/functional-javascript-v3/) - Frontend Masters
- [Hardcore Functional Programming in JavaScript](https://frontendmasters.com/courses/hardcore-js-v2/) - Frontend Masters
