---
title: JavaScript Destructuring Assignment
description: "Master destructuring assignment in JavaScript: array destructuring, object destructuring, default values, rest parameters, nested destructuring, and practical patterns for cleaner, more readable code"
track: javascript
section: core
difficulty: intermediate
tags:
  - destructuring
  - syntax
  - arrays
  - objects
  - es6
  - modern javascript
  - parameters
status: imported
origin: old/src/content/docs/javascript/destructuring.en.md
divergence: 0.256
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
legacy:
  category: javascript
  subcategory: ""
  order: 10
  lastUpdated: 2026-01-07
---

Destructuring assignment is a powerful ES6 feature that allows you to extract values from arrays or properties from objects and bind them to variables in a more concise and readable way. By mastering destructuring, you can write cleaner code, improve readability, and handle complex data structures with elegance. This comprehensive guide covers array destructuring, object destructuring, advanced patterns, and real-world applications.

## Concept Introduction

### What is Destructuring?

Destructuring is a JavaScript syntax that lets you unpack values from arrays or properties from objects into distinct variables. Instead of accessing values through bracket notation or dot notation, you can declare and extract values in a single statement.

**Why use destructuring?**
- **Cleaner code**: Reduces verbose property access syntax
- **Readability**: Makes intent explicit about which properties you're using
- **Less boilerplate**: Eliminates repetitive variable assignments
- **Function parameters**: Simplifies passing and receiving complex objects
- **Default values**: Elegantly handle missing values with defaults
- **Swapping values**: Makes variable swapping trivial

### Types of Destructuring

JavaScript supports two main forms of destructuring:

1. **Array Destructuring**: Extract values by position from arrays
2. **Object Destructuring**: Extract properties by name from objects

Both can be combined with rest parameters, default values, nested patterns, and renaming.

### Why Destructuring Matters

Destructuring has become fundamental in modern JavaScript because it:
- Reduces code verbosity while maintaining clarity
- Enables functional programming patterns
- Simplifies component development (especially in React)
- Makes function signatures more expressive
- Supports modern data-driven development practices
- Improves maintainability and code review experience

## Core Principles

### Array Destructuring Basics

Extract values from arrays by position:

```javascript
// Without destructuring
const colors = ['red', 'green', 'blue'];
const firstColor = colors[0];
const secondColor = colors[1];

// With destructuring
const [firstColor, secondColor, thirdColor] = colors;
console.log(firstColor);   // 'red'
console.log(secondColor);  // 'green'
console.log(thirdColor);   // 'blue'

// Skip elements
const [primary, , tertiary] = colors;
console.log(primary);   // 'red'
console.log(tertiary);  // 'blue'

// Skip at the end
const [first, second] = colors;
console.log(first);   // 'red'
console.log(second);  // 'green'
```

### Object Destructuring Basics

Extract properties from objects by name:

```javascript
// Without destructuring
const person = { name: 'Alice', age: 30, city: 'NYC' };
const name = person.name;
const age = person.age;

// With destructuring
const { name, age, city } = person;
console.log(name);  // 'Alice'
console.log(age);   // 30
console.log(city);  // 'NYC'

// Destructuring non-existent properties
const { name, country } = person;
console.log(country);  // undefined

// With different variable names
const { name: personName, age: personAge } = person;
console.log(personName);  // 'Alice'
console.log(personAge);   // 30
```

### Default Values

Provide default values for missing elements or properties:

```javascript
// Array destructuring with defaults
const colors = ['red'];
const [primary = 'red', secondary = 'blue', tertiary = 'green'] = colors;
console.log(primary);    // 'red'
console.log(secondary);  // 'blue'
console.log(tertiary);   // 'green'

// Object destructuring with defaults
const { name = 'Unknown', age = 0, city = 'Unknown' } = {};
console.log(name);  // 'Unknown'
console.log(age);   // 0
console.log(city);  // 'Unknown'

// Combining actual and default values
const person = { name: 'Bob', age: 25 };
const { name, age, city = 'Unknown' } = person;
console.log(city);  // 'Unknown'
```

### Rest Parameters in Destructuring

Collect remaining elements or properties using the rest operator:

```javascript
// Array destructuring with rest
const numbers = [1, 2, 3, 4, 5];
const [first, second, ...rest] = numbers;
console.log(first);  // 1
console.log(second); // 2
console.log(rest);   // [3, 4, 5]

// Object destructuring with rest
const person = { name: 'Carol', age: 28, city: 'LA', country: 'USA' };
const { name, age, ...location } = person;
console.log(name);     // 'Carol'
console.log(location); // { city: 'LA', country: 'USA' }

// Rest must be last
const [a, ...middle, b] = [1, 2, 3, 4];  // SyntaxError!
```

### Nested Destructuring

Destructure nested arrays and objects:

```javascript
// Nested array destructuring
const matrix = [[1, 2], [3, 4]];
const [[a, b], [c, d]] = matrix;
console.log(a, b, c, d);  // 1 2 3 4

// Nested object destructuring
const user = {
  name: 'David',
  address: {
    street: '123 Main St',
    city: 'Boston',
    zip: '02101'
  }
};

const { name, address: { street, city } } = user;
console.log(name);   // 'David'
console.log(street); // '123 Main St'
console.log(city);   // 'Boston'

// Deep nesting with defaults
const {
  address: {
    street = 'Unknown',
    country = 'USA'
  } = {}
} = { name: 'Eve' };
console.log(street);  // 'Unknown'
console.log(country); // 'USA'
```

### Destructuring in Function Parameters

Extract values directly in function parameters:

```javascript
// Array parameter destructuring
function sum([a, b]) {
  return a + b;
}
console.log(sum([5, 3]));  // 8

// Object parameter destructuring
function printPerson({ name, age }) {
  console.log(`${name} is ${age} years old`);
}
printPerson({ name: 'Frank', age: 35 });  // 'Frank is 35 years old'

// With defaults
function greet({ name = 'Guest', greeting = 'Hello' } = {}) {
  console.log(`${greeting}, ${name}!`);
}
greet({ name: 'Grace' });      // 'Hello, Grace!'
greet({});                     // 'Hello, Guest!'
greet();                       // 'Hello, Guest!'

// Mixed destructuring
function processData({ id, values: [first, ...rest] = [] }) {
  console.log(id, first, rest);
}
processData({ id: 1, values: [10, 20, 30] });  // 1 10 [20, 30]
```

## Key Points

- **Array destructuring** extracts values by position using square brackets `[a, b, c]`
- **Object destructuring** extracts properties by name using curly braces `{name, age}`
- **Default values** fill missing array elements or undefined properties elegantly
- **Rest operator** (`...rest`) collects remaining elements or properties
- **Renaming** allows binding extracted values to different variable names using `{ name: newName }`
- **Nested destructuring** enables extraction from deeply nested structures in a single statement
- **Function parameters** can use destructuring for cleaner function signatures
- **Skip elements** in arrays by omitting names between commas
- **Swapping values** becomes trivial: `[a, b] = [b, a]`
- **Partial extraction** lets you ignore unneeded properties or elements
- **Computed property names** are supported in object destructuring patterns
- **Mixed destructuring** combines arrays and objects in complex patterns
- **Destructuring assignment** evaluates right-to-left and doesn't require variable declaration
- **Destructuring works** with any iterable (arrays) or object-like values
- **Performance** is generally excellent as modern engines optimize destructuring heavily

## Code Examples

### Array Destructuring Patterns

```javascript
// Basic array destructuring
const fruits = ['apple', 'banana', 'cherry'];
const [first, second, third] = fruits;
console.log(first, second, third);  // apple banana cherry

// Skipping elements
const [primary, , secondary] = fruits;
console.log(primary, secondary);    // apple cherry

// Extracting specific elements
const [, banana] = fruits;
console.log(banana);                // banana

// Default values
const [a = 1, b = 2, c = 3, d = 4] = [10, 20];
console.log(a, b, c, d);            // 10 20 3 4

// Rest operator
const [head, ...tail] = [1, 2, 3, 4, 5];
console.log(head);  // 1
console.log(tail);  // [2, 3, 4, 5]

// Swapping variables
let x = 5, y = 10;
[x, y] = [y, x];
console.log(x, y);  // 10 5

// Mixed with rest and defaults
const [first, second = 0, ...rest] = [100];
console.log(first, second, rest);   // 100 0 []

// Nested array destructuring
const nested = [[1, 2], [3, 4]];
const [[a, b], [c, d]] = nested;
console.log(a, b, c, d);             // 1 2 3 4

// Complex nesting with skips
const deep = [[1, [2, 3]], [4, [5, 6]]];
const [[x, [, y]], [, [z]]] = deep;
console.log(x, y, z);                // 1 3 5
```

### Object Destructuring Patterns

```javascript
// Basic object destructuring
const user = { name: 'Alice', email: 'alice@example.com', age: 30 };
const { name, email } = user;
console.log(name, email);  // Alice alice@example.com

// Renaming properties
const { name: fullName, age: userAge } = user;
console.log(fullName, userAge);  // Alice 30

// Default values
const { name, status = 'active', role = 'user' } = user;
console.log(status, role);  // active user

// Rest operator
const { name, email, ...rest } = user;
console.log(rest);  // { age: 30 }

// Computed property names
const key = 'name';
const { [key]: value } = user;
console.log(value);  // Alice

// Extracting with defaults and renaming
const {
  name: userName = 'Unknown',
  status: userStatus = 'inactive'
} = { name: 'Bob' };
console.log(userName, userStatus);  // Bob inactive

// Nested object destructuring
const person = {
  id: 1,
  profile: {
    name: 'Carol',
    contact: {
      email: 'carol@example.com',
      phone: '555-1234'
    }
  }
};

const {
  profile: {
    name,
    contact: { email }
  }
} = person;
console.log(name, email);  // Carol carol@example.com

// Nested with defaults
const {
  profile: {
    name,
    bio = 'No bio provided'
  } = {}
} = {};
console.log(name, bio);    // undefined No bio provided

// Multiple levels of nesting
const deep = {
  level1: {
    level2: {
      level3: {
        value: 'found it!'
      }
    }
  }
};

const { level1: { level2: { level3: { value } } } } = deep;
console.log(value);  // found it!
```

### Function Parameter Destructuring

```javascript
// Destructuring array parameters
function logCoordinates([x, y]) {
  console.log(`Coordinates: (${x}, ${y})`);
}
logCoordinates([10, 20]);  // Coordinates: (10, 20)

// Destructuring object parameters
function displayUser({ name, email, verified = false }) {
  console.log(`${name} (${email}) - Verified: ${verified}`);
}
displayUser({ name: 'David', email: 'david@example.com' });
// David (david@example.com) - Verified: false

// Default parameter object
function createConfig({
  host = 'localhost',
  port = 3000,
  ssl = false
} = {}) {
  return { host, port, ssl };
}
console.log(createConfig());              // {host: 'localhost', port: 3000, ssl: false}
console.log(createConfig({ port: 8080 })); // {host: 'localhost', port: 8080, ssl: false}

// Complex destructuring in parameters
function processData({
  id,
  values: [first, ...rest] = [],
  options: { verbose = false } = {}
}) {
  console.log({ id, first, rest, verbose });
}
processData({
  id: 1,
  values: [10, 20, 30],
  options: { verbose: true }
});
// { id: 1, first: 10, rest: [20, 30], verbose: true }

// Array with defaults in function parameters
function sum([a = 0, b = 0]) {
  return a + b;
}
console.log(sum([5]));     // 5
console.log(sum([5, 10])); // 15
console.log(sum([]));      // 0

// Callback parameter destructuring
const users = [
  { id: 1, name: 'Eve' },
  { id: 2, name: 'Frank' }
];

users.forEach(({ id, name }) => {
  console.log(`User ${id}: ${name}`);
});
// User 1: Eve
// User 2: Frank

// REST API response handling
function handleResponse({
  status,
  data: { users: [first, ...others] = [] } = {}
} = {}) {
  console.log(`Status: ${status}, First User: ${first?.name}, Others: ${others.length}`);
}
handleResponse({
  status: 200,
  data: { users: [{ name: 'Grace' }, { name: 'Henry' }] }
});
// Status: 200, First User: Grace, Others: 1
```

### Practical Real-world Examples

```javascript
// React component props destructuring
function UserCard({ user: { name, avatar }, onEdit, isAdmin = false }) {
  return `<div>${name} (Admin: ${isAdmin})</div>`;
}

// Destructuring API responses
async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const { data: { id: userId, profile: { email, verified } } } = await response.json();
  return { userId, email, verified };
}

// Array operations with destructuring
const [first, ...middle, last] = [1, 2, 3, 4, 5];
console.log(first, last);  // 1 5

// Object merging with spread and destructuring
const user = { name: 'Alice', age: 30 };
const { name, ...rest } = user;
const updated = { name, ...rest, city: 'NYC' };
console.log(updated);  // { name: 'Alice', age: 30, city: 'NYC' }

// Extracting query parameters
const query = { page: 1, limit: 10, sort: 'name', filter: 'active' };
const { page, limit, ...filters } = query;
console.log(filters);  // { sort: 'name', filter: 'active' }

// Handling optional response data
const response = {
  success: true,
  data: {
    user: { name: 'Bob', role: 'admin' }
  }
};

const { success, data: { user: { name, role } = {} } = {} } = response;
console.log(success, name, role);  // true Bob admin

// Array destructuring in loops
const pairs = [[1, 2], [3, 4], [5, 6]];
for (const [x, y] of pairs) {
  console.log(x + y);  // 3, 7, 11
}

// Destructuring in object methods
const calculator = {
  values: [1, 2, 3, 4],
  process() {
    const [min, ...rest] = this.values;
    return { min, max: Math.max(...rest) };
  }
};
console.log(calculator.process());  // { min: 1, max: 4 }

// Conditional destructuring
const data = { x: 10, y: 20 };
const { x, y = x } = data;  // y gets default from x if not present
console.log(x, y);  // 10 20

// Destructuring with type checking
function processUser({ name, email, ...extras }) {
  if (typeof name !== 'string') throw new Error('Invalid name');
  if (typeof email !== 'string') throw new Error('Invalid email');
  return { name, email, extras };
}
```

### Advanced Destructuring Patterns

```javascript
// Destructuring with transformation
const numbers = [1, 2, 3];
const { 0: first, 2: third } = numbers;
console.log(first, third);  // 1 3

// Destructuring with getters
const obj = {
  get name() { return 'Dynamic'; },
  get timestamp() { return Date.now(); }
};
const { name, timestamp } = obj;
console.log(name, timestamp);  // Dynamic <timestamp>

// Ignoring unwanted properties
const user = { id: 1, name: 'Carol', _internal: 'secret', __meta: 'data' };
const { id, name } = user;  // Ignores _internal and __meta
console.log(id, name);  // 1 Carol

// Extracting from Map/Set with entries
const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
for (const [key, value] of map.entries()) {
  console.log(key, value);
}

// Complex nested with mixed arrays and objects
const config = {
  app: {
    name: 'MyApp',
    services: [
      { name: 'auth', port: 3001 },
      { name: 'api', port: 3002 }
    ]
  }
};

const {
  app: {
    name: appName,
    services: [
      { port: authPort },
      { port: apiPort }
    ]
  }
} = config;
console.log(appName, authPort, apiPort);  // MyApp 3001 3002

// Using rest with rename
const { x: a, y: b, ...others } = { x: 1, y: 2, z: 3, w: 4 };
console.log(a, b, others);  // 1 2 { z: 3, w: 4 }

// Destructuring with Object.entries
const obj = { name: 'David', age: 28 };
for (const [key, value] of Object.entries(obj)) {
  console.log(`${key}: ${value}`);
}

// Combining spread with destructuring
const [head, ...tail] = [1, 2, 3, 4];
const newArray = [0, head, ...tail];
console.log(newArray);  // [0, 1, 2, 3, 4]

// Array/object in object destructuring
const mixed = {
  id: 1,
  coords: [10, 20],
  meta: { created: '2024-01-01' }
};

const { id, coords: [x, y], meta: { created } } = mixed;
console.log(id, x, y, created);  // 1 10 20 2024-01-01
```

## Best Practices

### Use Meaningful Variable Names

```javascript
// Bad: unclear names
const { d, m, y } = dateObj;

// Good: descriptive names
const { day, month, year } = dateObj;

// Good: rename for clarity
const { day: dateDay, month: dateMonth } = dateObj;
```

### Destructure at Function Entry

Extract what you need at the beginning of functions for clarity:

```javascript
// Bad: accessing properties throughout
function processUser(user) {
  console.log(user.name);
  console.log(user.email);
  console.log(user.role);
}

// Good: destructure immediately
function processUser(user) {
  const { name, email, role } = user;
  console.log(name, email, role);
}

// Better: destructure in parameters
function processUser({ name, email, role }) {
  console.log(name, email, role);
}
```

### Set Sensible Defaults

Always consider what default values make sense:

```javascript
// Bad: no defaults, might cause errors
function fetchData({ url, timeout, retries }) {
  // timeout or retries might be undefined
}

// Good: reasonable defaults
function fetchData({
  url,
  timeout = 5000,
  retries = 3
}) {
  // Safe to use all values
}

// Better: parameter object default
function fetchData({
  url,
  timeout = 5000,
  retries = 3
} = {}) {
  // Function can be called without arguments
}
```

### Be Careful with Deep Nesting

Deep destructuring can reduce readability:

```javascript
// Too nested - hard to read
const {
  user: {
    profile: {
      contact: {
        address: {
          street
        }
      }
    }
  }
} = data;

// Better: destructure in steps
const { user } = data;
const { profile } = user;
const { contact } = profile;
const { address } = contact;
const { street } = address;

// Or: intermediate variables
const user = data.user;
const { street } = user.profile.contact.address;
```

### Prefer Specific Over Generic

```javascript
// Bad: destructuring everything
const { ...allProps } = componentProps;

// Good: specify what you use
const { disabled, className, onClick } = componentProps;

// Good: collect extras when needed
const { disabled, className, ...rest } = componentProps;
```

### Use Rest Parameters Purposefully

```javascript
// Bad: using rest without reason
const { x, y, ...rest } = { x: 1, y: 2 };

// Good: using rest to forward props
function CustomButton({ disabled, onClick, ...rest }) {
  return <button {...rest} />;
}

// Good: extracting unwanted properties
function getPublicData(user) {
  const { _id, __v, password, ...public } = user;
  return public;
}
```

## Common Pitfalls

### Undefined vs Missing Properties

```javascript
const obj = { a: 1, b: undefined };
const { a = 'default', b = 'default' } = obj;

console.log(a);  // 1
console.log(b);  // 'default' (defaults replace undefined)

// If you need to distinguish:
const { b } = obj;
if (b !== undefined) {
  console.log('b is explicitly undefined');
}
```

### Destructuring null or undefined

```javascript
// Error: Cannot destructure null
const { name } = null;  // TypeError!

// Error: Cannot destructure undefined
const { name } = undefined;  // TypeError!

// Solution: provide defaults
const { name } = null || {};  // Works: name = undefined
const { name = 'Unknown' } = undefined || {};  // Works: name = 'Unknown'

// Solution: optional chaining in function parameters
function safe({ name } = {}) {
  console.log(name);
}
safe(null);         // undefined
safe(undefined);    // undefined
safe({ name: 'Alice' });  // 'Alice'
```

### Hoisting Behavior with let/const

```javascript
// This works - destructuring with const/let
{
  const { name } = obj;
}

// Reassignment needs var or letting it be already declared
let name;
{ name } = obj;  // Works

// This fails - trying to declare in nested scope
{
  const { name } = obj;
}
{
  const { name } = obj;  // OK - different scope
}
```

### Renaming Confusion

```javascript
// Wrong: this doesn't rename
const { name } = user;  // Declares variable 'name'

// Correct: use colon for renaming
const { name: userName } = user;  // Declares variable 'userName'

// Common mistake: forgetting colon in nested destructuring
const { address: { city } } = user;  // address not available in scope!

// If you need both:
const { address, address: { city } } = user;
```

### Array Index vs Property Destructuring

```javascript
// Destructuring with array element index
const arr = [1, 2, 3];
const [first, second] = arr;  // first=1, second=2

// Destructuring array as object (unusual!)
const { 0: zero, 1: one } = arr;  // zero=1, one=2

// These are different:
const [a] = arr;       // a = 1
const { length } = arr; // length = 3 (accessing property)
```

### Rest Position Errors

```javascript
// Wrong: rest must be last
const [a, ...rest, b] = [1, 2, 3, 4];  // SyntaxError!

// Correct: rest at end
const [a, ...rest] = [1, 2, 3, 4];  // a=1, rest=[2,3,4]

// Wrong: multiple rest
const [a, ...rest, ...rest2] = array;  // SyntaxError!

// Correct: only one rest
const { a, ...rest } = obj;
```

### Performance with Complex Patterns

```javascript
// This works but is confusing
const {
  deeply: {
    nested: {
      value: [first, ...rest]
    } = {}
  } = {}
} = potentially_null_value;

// Clearer approach:
const data = potentially_null_value || {};
const nested = data.deeply?.nested || {};
const value = nested.value || [];
const [first, ...rest] = value;
```

## Performance Considerations

### Destructuring is Optimized

Modern JavaScript engines optimize destructuring heavily:

```javascript
// Modern engines treat these similarly
const x = obj.name;
const y = obj.age;

const { name: x, age: y } = obj;

// Both compile to efficient code
```

### Avoid Over-destructuring

```javascript
// Don't destructure if you only use one property
const user = getUser();
const { name, email, verified, role, preferences } = user;
console.log(name);  // Only used once

// Better:
const user = getUser();
console.log(user.name);

// Or if using multiple:
const { name, email, verified } = user;
console.log(name, email, verified);
```

### Deep Nesting Performance

```javascript
// This is efficient - modern engines optimize it
const { a: { b: { c: value } } } = data;

// But very deep nesting can impact readability more than performance
// Usually not a bottleneck, but avoid extremely deep patterns
```

### Destructuring in Loops

```javascript
// In tight loops, consider destructuring outside
function processMany(items) {
  for (const item of items) {
    const { id, name, value } = item;  // Destructures each iteration
    // Use id, name, value
  }
}

// If accessing properties frequently, might be worth it
function process(items) {
  return items.map(({ id, value }) => id + value);
}
```

## Real-world Scenarios

### React Component Props

```javascript
function UserProfile({ user, onEdit, onDelete, isLoading = false }) {
  const { id, name, email, avatar } = user || {};

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <p>{email}</p>
      <button onClick={() => onEdit(id)}>Edit</button>
      <button onClick={() => onDelete(id)}>Delete</button>
    </div>
  );
}
```

### REST API Response Handling

```javascript
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  const { status, data: { user, settings } = {} } = await response.json();

  if (status !== 200) throw new Error('Failed to fetch');

  const { name, email, verified = false } = user;
  const { theme = 'light', notifications = true } = settings;

  return { name, email, verified, theme, notifications };
}
```

### Configuration Objects

```javascript
function startServer({
  host = 'localhost',
  port = 3000,
  ssl = false,
  database: {
    type = 'mongodb',
    uri = 'mongodb://localhost:27017'
  } = {},
  cache: {
    enabled = true,
    ttl = 3600
  } = {}
} = {}) {
  console.log(`Starting server on ${host}:${port}`);
  console.log(`Database: ${type} at ${uri}`);
  console.log(`Cache: ${enabled ? `enabled (TTL: ${ttl}s)` : 'disabled'}`);
}

startServer({
  port: 8080,
  database: { type: 'postgresql' },
  cache: { enabled: false }
});
```

### Form Handling

```javascript
function handleFormSubmit(event) {
  event.preventDefault();
  const { target: form } = event;

  const { email: { value: email }, password: { value: password } } = form;

  login({ email, password });
}

// Or with FormData
function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const { email, password, remember } = Object.fromEntries(formData);

  login({ email, password, remember: remember === 'on' });
}
```

### Array Operations

```javascript
// Rotate array
function rotateArray(arr) {
  const [first, ...rest] = arr;
  return [...rest, first];
}

// Get min and max
function getMinMax(numbers) {
  const [min, ...rest] = numbers.sort((a, b) => a - b);
  const max = rest[rest.length - 1];
  return { min, max };
}

// Partition array
function partition(array, predicate) {
  const pass = [];
  const fail = [];

  for (const item of array) {
    (predicate(item) ? pass : fail).push(item);
  }

  return [pass, fail];
}

// Usage with destructuring
const [even, odd] = partition([1, 2, 3, 4, 5], n => n % 2 === 0);
console.log(even, odd);  // [2, 4] [1, 3, 5]
```

### Data Transformation

```javascript
// Transform API data to local format
function transformUser(apiUser) {
  const {
    first_name: firstName,
    last_name: lastName,
    email_verified: verified,
    ...rest
  } = apiUser;

  return {
    firstName,
    lastName,
    verified,
    ...rest
  };
}

// Extracting specific fields from collection
function getPublicUsers(users) {
  return users.map(({ id, name, avatar }) => ({
    id,
    name,
    avatar
  }));
}

// Complex transformation
function mergeResponses({ user, settings }, { notifications, preferences } = {}) {
  const { id, email } = user;
  const { theme } = settings;

  return {
    id,
    email,
    theme,
    notifications: notifications || {},
    preferences: preferences || {}
  };
}
```

## Interview Points

### What are the Benefits of Destructuring?

**Answer**: Destructuring provides several benefits:
- **Cleaner syntax**: Reduces verbose property access
- **Improved readability**: Makes it clear which properties are being used
- **Default values**: Handle missing values gracefully
- **Function parameters**: More expressive and self-documenting
- **Less repetition**: Reduces variable assignment boilerplate
- **Easier refactoring**: Clear dependencies on specific properties

### What's the Difference Between Array and Object Destructuring?

**Answer**: Array destructuring extracts values by position and uses square brackets `[a, b, c]`. Object destructuring extracts properties by name and uses curly braces `{name, age}`. Arrays are ordered and positional; objects are keyed by property names.

### How Do Default Values Work in Destructuring?

**Answer**: Default values are used when the extracted value is `undefined`. They're specified with `=` after the variable name. Default values don't apply if a property exists with an explicit `undefined` value - the default only activates when the property is missing.

### Can You Destructure null or undefined?

**Answer**: No, attempting to destructure `null` or `undefined` throws a TypeError. Solutions include providing a default value for the whole object parameter (`{ name } = {}`) or using the OR operator (`null || {}`).

### What's the Rest Operator in Destructuring?

**Answer**: The rest operator (`...rest`) collects remaining elements in an array or properties in an object into a new variable. It must be the last element in the destructuring pattern and only one rest operator is allowed per pattern.

### How Does Destructuring in Function Parameters Work?

**Answer**: Function parameters can use destructuring syntax directly. This extracts specific properties or array elements when the function is called, making the expected structure explicit and enabling default values at the function signature level.

### What's the Difference Between Renaming and Aliasing?

**Answer**: In destructuring, renaming means binding a property to a different variable name using `: newName` syntax (e.g., `{ name: userName }`). This is sometimes called aliasing, and the property itself still has its original name - only the variable name changes.

### Can You Combine Array and Object Destructuring?

**Answer**: Yes, you can mix array and object destructuring in complex patterns. For example, you can destructure an array where elements are objects, or destructure an object where properties contain arrays, enabling flexible data extraction from complex nested structures.

## Further Reading

### Essential JavaScript Resources
- **MDN Web Docs**: [Destructuring Assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
- **ECMAScript Specification**: [Destructuring Patterns](https://tc39.es/ecma262/#sec-destructuring-patterns)
- **JavaScript.info**: [Destructuring Assignment](https://javascript.info/destructuring-assignment)

### Advanced Topics
- Destructuring with complex nested structures
- Destructuring in async/await patterns
- Destructuring with optional chaining and nullish coalescing
- Performance optimization of destructuring patterns
- Destructuring with getters and computed properties

### Practice Resources
- Refactor existing code to use destructuring
- Practice complex nested destructuring patterns
- Build React components using parameter destructuring
- Work with REST APIs and destructure responses
- Implement utility functions using destructuring patterns

### Related Concepts
- Spread operator (`...`)
- Object and array literals
- Function parameters and arguments
- Modern ES6+ JavaScript features
- Functional programming patterns in JavaScript
