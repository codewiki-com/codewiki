---
title: Proxy and Reflect
description: Complete guide to JavaScript Proxy and Reflect, metaprogramming and object interception
track: javascript
section: core
difficulty: advanced
tags:
  - JavaScript
  - Proxy
  - Reflect
  - Metaprogramming
status: imported
origin: old/src/content/docs/javascript/proxy-reflect.en.md
divergence: 0.331
issues: []
legacy:
  category: JavaScript
  subcategory: Advanced Features
  order: 18
  lastUpdated: 2026-01-07
---

JavaScript's Proxy and Reflect APIs are powerful metaprogramming tools that allow you to intercept and customize fundamental operations on objects. These features enable advanced patterns such as validation, logging, access control, and the creation of virtual properties.

## Introduction to Metaprogramming

Metaprogramming is writing code that can inspect, modify, or generate other code at runtime. In JavaScript, Proxy and Reflect provide the foundation for metaprogramming by allowing you to intercept and redefine fundamental language operations.

```javascript
// Simple example: Logging property access
const target = { name: 'Alice', age: 30 };

const handler = {
  get(target, property) {
    console.log(`Accessing property: ${property}`);
    return target[property];
  }
};

const proxy = new Proxy(target, handler);

console.log(proxy.name);
// Output:
// Accessing property: name
// Alice
```

## Understanding Proxy

A Proxy wraps another object (the target) and intercepts operations performed on it. You define the behavior for these interceptions using a handler object containing trap methods.

### Basic Syntax

```javascript
const proxy = new Proxy(target, handler);
```

- **target**: The original object you want to proxy
- **handler**: An object defining which operations to intercept and how to redefine them

### Proxy Traps

Traps are methods in the handler object that intercept specific operations. JavaScript provides 13 different traps.

#### Property Access Traps

##### get(target, property, receiver)

Intercepts property reading operations.

```javascript
const user = {
  firstName: 'John',
  lastName: 'Doe',
  _password: 'secret123'
};

const handler = {
  get(target, property, receiver) {
    // Hide private properties (starting with _)
    if (property.startsWith('_')) {
      return undefined;
    }

    // Create computed properties
    if (property === 'fullName') {
      return `${target.firstName} ${target.lastName}`;
    }

    return Reflect.get(target, property, receiver);
  }
};

const secureUser = new Proxy(user, handler);

console.log(secureUser.firstName);  // 'John'
console.log(secureUser.fullName);   // 'John Doe'
console.log(secureUser._password);  // undefined (hidden)
```

##### set(target, property, value, receiver)

Intercepts property assignment operations.

```javascript
const validator = {
  set(target, property, value, receiver) {
    if (property === 'age') {
      if (typeof value !== 'number') {
        throw new TypeError('Age must be a number');
      }
      if (value < 0 || value > 150) {
        throw new RangeError('Age must be between 0 and 150');
      }
    }

    if (property === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error('Invalid email format');
      }
    }

    return Reflect.set(target, property, value, receiver);
  }
};

const person = new Proxy({}, validator);

person.age = 25;        // Works fine
person.email = 'test@example.com';  // Works fine

// person.age = -5;     // RangeError: Age must be between 0 and 150
// person.age = 'old';  // TypeError: Age must be a number
// person.email = 'invalid';  // Error: Invalid email format
```

##### has(target, property)

Intercepts the `in` operator.

```javascript
const hiddenProperties = ['_id', '_internal'];

const handler = {
  has(target, property) {
    if (hiddenProperties.includes(property)) {
      return false;
    }
    return Reflect.has(target, property);
  }
};

const obj = new Proxy({ _id: 1, name: 'Test' }, handler);

console.log('name' in obj);  // true
console.log('_id' in obj);   // false (hidden)
```

##### deleteProperty(target, property)

Intercepts the `delete` operator.

```javascript
const handler = {
  deleteProperty(target, property) {
    if (property.startsWith('_')) {
      throw new Error(`Cannot delete private property: ${property}`);
    }

    console.log(`Deleting property: ${property}`);
    return Reflect.deleteProperty(target, property);
  }
};

const obj = new Proxy({ name: 'Test', _id: 1 }, handler);

delete obj.name;  // Logs: Deleting property: name
// delete obj._id;  // Error: Cannot delete private property: _id
```

#### Object Operation Traps

##### getOwnPropertyDescriptor(target, property)

Intercepts `Object.getOwnPropertyDescriptor()`.

```javascript
const handler = {
  getOwnPropertyDescriptor(target, property) {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, property);

    if (descriptor && property.startsWith('_')) {
      // Make private properties non-enumerable
      return { ...descriptor, enumerable: false };
    }

    return descriptor;
  }
};

const obj = new Proxy({ name: 'Test', _secret: 'hidden' }, handler);

console.log(Object.keys(obj));  // ['name'] - _secret is hidden
```

##### defineProperty(target, property, descriptor)

Intercepts `Object.defineProperty()`.

```javascript
const handler = {
  defineProperty(target, property, descriptor) {
    // Prevent defining non-configurable properties
    if (descriptor.configurable === false) {
      throw new Error('All properties must be configurable');
    }

    console.log(`Defining property: ${property}`);
    return Reflect.defineProperty(target, property, descriptor);
  }
};

const obj = new Proxy({}, handler);

Object.defineProperty(obj, 'name', {
  value: 'Test',
  configurable: true
});
// Logs: Defining property: name
```

##### ownKeys(target)

Intercepts `Object.keys()`, `Object.getOwnPropertyNames()`, and `Object.getOwnPropertySymbols()`.

```javascript
const handler = {
  ownKeys(target) {
    // Filter out private properties
    return Reflect.ownKeys(target).filter(key => {
      return typeof key !== 'string' || !key.startsWith('_');
    });
  }
};

const obj = new Proxy({
  name: 'Public',
  _secret: 'Private',
  age: 25
}, handler);

console.log(Object.keys(obj));  // ['name', 'age']
```

#### Prototype Traps

##### getPrototypeOf(target)

Intercepts `Object.getPrototypeOf()`.

```javascript
const handler = {
  getPrototypeOf(target) {
    console.log('Getting prototype');
    return Reflect.getPrototypeOf(target);
  }
};

const obj = new Proxy({}, handler);
Object.getPrototypeOf(obj);  // Logs: Getting prototype
```

##### setPrototypeOf(target, prototype)

Intercepts `Object.setPrototypeOf()`.

```javascript
const handler = {
  setPrototypeOf(target, prototype) {
    throw new Error('Changing prototype is not allowed');
  }
};

const obj = new Proxy({}, handler);
// Object.setPrototypeOf(obj, {});  // Error: Changing prototype is not allowed
```

#### Extensibility Traps

##### isExtensible(target)

Intercepts `Object.isExtensible()`.

```javascript
const handler = {
  isExtensible(target) {
    console.log('Checking extensibility');
    return Reflect.isExtensible(target);
  }
};
```

##### preventExtensions(target)

Intercepts `Object.preventExtensions()`.

```javascript
const handler = {
  preventExtensions(target) {
    console.log('Preventing extensions');
    return Reflect.preventExtensions(target);
  }
};
```

#### Function Traps

##### apply(target, thisArg, argumentsList)

Intercepts function calls.

```javascript
function sum(a, b) {
  return a + b;
}

const handler = {
  apply(target, thisArg, args) {
    console.log(`Calling function with args: ${args}`);
    const start = performance.now();
    const result = Reflect.apply(target, thisArg, args);
    const end = performance.now();
    console.log(`Execution time: ${end - start}ms`);
    return result;
  }
};

const proxiedSum = new Proxy(sum, handler);

proxiedSum(1, 2);
// Logs:
// Calling function with args: 1,2
// Execution time: 0.1ms
// Returns: 3
```

##### construct(target, argumentsList, newTarget)

Intercepts the `new` operator.

```javascript
class User {
  constructor(name) {
    this.name = name;
  }
}

const handler = {
  construct(target, args, newTarget) {
    console.log(`Creating new instance with args: ${args}`);

    // Add timestamp to all instances
    const instance = Reflect.construct(target, args, newTarget);
    instance.createdAt = new Date();

    return instance;
  }
};

const ProxiedUser = new Proxy(User, handler);

const user = new ProxiedUser('Alice');
console.log(user.name);       // 'Alice'
console.log(user.createdAt);  // Current date
```

## The Reflect API

Reflect is a built-in object providing methods for interceptable JavaScript operations. It complements Proxy by providing default behavior for all trap operations.

### Why Use Reflect?

1. **Proper return values**: Reflect methods return meaningful values instead of throwing errors
2. **Cleaner syntax**: More functional approach compared to Object methods
3. **Consistency with Proxy**: Each Proxy trap has a corresponding Reflect method
4. **Reliable forwarding**: Correctly forwards operations in proxy handlers

### Reflect Methods

```javascript
// Reflect.get(target, propertyKey[, receiver])
const obj = { x: 1 };
console.log(Reflect.get(obj, 'x'));  // 1

// Reflect.set(target, propertyKey, value[, receiver])
Reflect.set(obj, 'y', 2);
console.log(obj.y);  // 2

// Reflect.has(target, propertyKey)
console.log(Reflect.has(obj, 'x'));  // true

// Reflect.deleteProperty(target, propertyKey)
Reflect.deleteProperty(obj, 'y');
console.log(obj.y);  // undefined

// Reflect.ownKeys(target)
console.log(Reflect.ownKeys(obj));  // ['x']

// Reflect.getPrototypeOf(target)
console.log(Reflect.getPrototypeOf(obj));  // {}

// Reflect.setPrototypeOf(target, prototype)
Reflect.setPrototypeOf(obj, { inherited: true });

// Reflect.isExtensible(target)
console.log(Reflect.isExtensible(obj));  // true

// Reflect.preventExtensions(target)
Reflect.preventExtensions(obj);

// Reflect.getOwnPropertyDescriptor(target, propertyKey)
console.log(Reflect.getOwnPropertyDescriptor(obj, 'x'));
// { value: 1, writable: true, enumerable: true, configurable: true }

// Reflect.defineProperty(target, propertyKey, attributes)
Reflect.defineProperty(obj, 'z', { value: 3, writable: false });

// Reflect.apply(target, thisArgument, argumentsList)
function greet(name) {
  return `Hello, ${name}!`;
}
console.log(Reflect.apply(greet, null, ['World']));  // 'Hello, World!'

// Reflect.construct(target, argumentsList[, newTarget])
class Person {
  constructor(name) {
    this.name = name;
  }
}
const person = Reflect.construct(Person, ['Alice']);
console.log(person.name);  // 'Alice'
```

### Reflect vs Object Methods

```javascript
// Object.defineProperty throws on failure
try {
  Object.defineProperty(Object.freeze({}), 'x', { value: 1 });
} catch (e) {
  console.log('Failed');  // 'Failed'
}

// Reflect.defineProperty returns false on failure
const result = Reflect.defineProperty(Object.freeze({}), 'x', { value: 1 });
console.log(result);  // false

// Using Reflect in proxy handlers
const handler = {
  set(target, property, value, receiver) {
    console.log(`Setting ${property} to ${value}`);
    // Reflect.set returns true/false indicating success
    return Reflect.set(target, property, value, receiver);
  }
};
```

## Revocable Proxies

Revocable proxies can be "turned off" after creation, making the proxy unusable.

```javascript
const target = { name: 'Resource' };

const { proxy, revoke } = Proxy.revocable(target, {
  get(target, property) {
    console.log(`Accessing: ${property}`);
    return Reflect.get(target, property);
  }
});

console.log(proxy.name);  // Logs: Accessing: name, Returns: 'Resource'

// Revoke the proxy
revoke();

// Any operation on the proxy now throws
try {
  console.log(proxy.name);
} catch (e) {
  console.log(e.message);  // Cannot perform 'get' on a proxy that has been revoked
}
```

### Use Case: Temporary Access

```javascript
function createTemporaryAccess(resource, timeout) {
  const { proxy, revoke } = Proxy.revocable(resource, {});

  setTimeout(() => {
    console.log('Access revoked');
    revoke();
  }, timeout);

  return proxy;
}

const sensitiveData = { apiKey: 'secret-key-123' };
const tempAccess = createTemporaryAccess(sensitiveData, 5000);

console.log(tempAccess.apiKey);  // Works for 5 seconds
// After 5 seconds, access is revoked
```

## Practical Use Cases

### Data Validation

```javascript
function createValidatedObject(schema) {
  return new Proxy({}, {
    set(target, property, value) {
      const validator = schema[property];

      if (validator) {
        const { type, required, min, max, pattern } = validator;

        // Type validation
        if (type && typeof value !== type) {
          throw new TypeError(
            `Property '${property}' must be of type '${type}'`
          );
        }

        // Range validation for numbers
        if (type === 'number') {
          if (min !== undefined && value < min) {
            throw new RangeError(
              `Property '${property}' must be at least ${min}`
            );
          }
          if (max !== undefined && value > max) {
            throw new RangeError(
              `Property '${property}' must be at most ${max}`
            );
          }
        }

        // Pattern validation for strings
        if (pattern && !pattern.test(value)) {
          throw new Error(
            `Property '${property}' does not match required pattern`
          );
        }
      }

      return Reflect.set(target, property, value);
    }
  });
}

// Usage
const userSchema = {
  name: { type: 'string', required: true },
  age: { type: 'number', min: 0, max: 150 },
  email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
};

const user = createValidatedObject(userSchema);

user.name = 'Alice';           // OK
user.age = 30;                 // OK
user.email = 'alice@test.com'; // OK

// user.age = -5;              // RangeError
// user.email = 'invalid';     // Error: does not match pattern
```

### Logging and Debugging

```javascript
function createLoggingProxy(target, name = 'Object') {
  return new Proxy(target, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      console.log(`[GET] ${name}.${String(property)} = ${JSON.stringify(value)}`);
      return value;
    },

    set(target, property, value, receiver) {
      console.log(`[SET] ${name}.${String(property)} = ${JSON.stringify(value)}`);
      return Reflect.set(target, property, value, receiver);
    },

    deleteProperty(target, property) {
      console.log(`[DELETE] ${name}.${String(property)}`);
      return Reflect.deleteProperty(target, property);
    },

    apply(target, thisArg, args) {
      console.log(`[CALL] ${name}(${args.map(a => JSON.stringify(a)).join(', ')})`);
      const result = Reflect.apply(target, thisArg, args);
      console.log(`[RETURN] ${JSON.stringify(result)}`);
      return result;
    }
  });
}

// Usage
const user = createLoggingProxy({ name: 'Alice', age: 30 }, 'user');

user.name;        // [GET] user.name = "Alice"
user.age = 31;    // [SET] user.age = 31
delete user.age;  // [DELETE] user.age

const add = createLoggingProxy((a, b) => a + b, 'add');
add(2, 3);
// [CALL] add(2, 3)
// [RETURN] 5
```

### Virtual Properties and Computed Values

```javascript
function createComputedProperties(target, computed) {
  return new Proxy(target, {
    get(target, property, receiver) {
      if (property in computed) {
        return computed[property].call(receiver);
      }
      return Reflect.get(target, property, receiver);
    },

    set(target, property, value, receiver) {
      if (property in computed) {
        throw new Error(`Cannot set computed property: ${property}`);
      }
      return Reflect.set(target, property, value, receiver);
    },

    ownKeys(target) {
      return [...Reflect.ownKeys(target), ...Object.keys(computed)];
    },

    getOwnPropertyDescriptor(target, property) {
      if (property in computed) {
        return {
          enumerable: true,
          configurable: true,
          get: computed[property]
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    }
  });
}

// Usage
const rectangle = createComputedProperties(
  { width: 10, height: 5 },
  {
    area() { return this.width * this.height; },
    perimeter() { return 2 * (this.width + this.height); },
    diagonal() { return Math.sqrt(this.width ** 2 + this.height ** 2); }
  }
);

console.log(rectangle.area);       // 50
console.log(rectangle.perimeter);  // 30
console.log(rectangle.diagonal);   // 11.180339887498949

rectangle.width = 20;
console.log(rectangle.area);       // 100 (automatically updated)
```

### Negative Array Indices

```javascript
function createNegativeIndexArray(array) {
  return new Proxy(array, {
    get(target, property, receiver) {
      const index = Number(property);

      if (Number.isInteger(index) && index < 0) {
        property = String(target.length + index);
      }

      return Reflect.get(target, property, receiver);
    },

    set(target, property, value, receiver) {
      const index = Number(property);

      if (Number.isInteger(index) && index < 0) {
        property = String(target.length + index);
      }

      return Reflect.set(target, property, value, receiver);
    }
  });
}

// Usage
const arr = createNegativeIndexArray([1, 2, 3, 4, 5]);

console.log(arr[-1]);  // 5 (last element)
console.log(arr[-2]);  // 4 (second to last)

arr[-1] = 10;
console.log(arr);      // [1, 2, 3, 4, 10]
```

### Observable Objects (Reactive Data)

```javascript
function createObservable(target, onChange) {
  const observers = new Set();

  if (onChange) {
    observers.add(onChange);
  }

  function notify(property, oldValue, newValue) {
    observers.forEach(observer => {
      observer({ property, oldValue, newValue });
    });
  }

  const proxy = new Proxy(target, {
    set(target, property, value, receiver) {
      const oldValue = target[property];

      if (oldValue !== value) {
        const result = Reflect.set(target, property, value, receiver);
        notify(property, oldValue, value);
        return result;
      }

      return true;
    },

    deleteProperty(target, property) {
      const oldValue = target[property];
      const result = Reflect.deleteProperty(target, property);
      notify(property, oldValue, undefined);
      return result;
    }
  });

  // Add method to subscribe
  proxy.subscribe = (callback) => {
    observers.add(callback);
    return () => observers.delete(callback);
  };

  return proxy;
}

// Usage
const state = createObservable({ count: 0, name: 'App' });

const unsubscribe = state.subscribe(({ property, oldValue, newValue }) => {
  console.log(`${property} changed from ${oldValue} to ${newValue}`);
});

state.count = 1;  // count changed from 0 to 1
state.count = 2;  // count changed from 1 to 2
state.name = 'MyApp';  // name changed from App to MyApp

unsubscribe();  // Stop observing
state.count = 3;  // No log output
```

### Access Control and Permissions

```javascript
function createSecureObject(target, permissions) {
  return new Proxy(target, {
    get(target, property, receiver) {
      const permission = permissions[property];

      if (permission && !permission.read) {
        throw new Error(`Access denied: Cannot read property '${property}'`);
      }

      return Reflect.get(target, property, receiver);
    },

    set(target, property, value, receiver) {
      const permission = permissions[property];

      if (permission && !permission.write) {
        throw new Error(`Access denied: Cannot write property '${property}'`);
      }

      return Reflect.set(target, property, value, receiver);
    },

    deleteProperty(target, property) {
      const permission = permissions[property];

      if (permission && !permission.delete) {
        throw new Error(`Access denied: Cannot delete property '${property}'`);
      }

      return Reflect.deleteProperty(target, property);
    }
  });
}

// Usage
const document = createSecureObject(
  {
    id: '123',
    title: 'Secret Document',
    content: 'Classified information',
    author: 'Admin'
  },
  {
    id: { read: true, write: false, delete: false },
    title: { read: true, write: true, delete: false },
    content: { read: false, write: false, delete: false },
    author: { read: true, write: false, delete: false }
  }
);

console.log(document.title);    // 'Secret Document'
document.title = 'New Title';   // OK
// console.log(document.content);  // Error: Access denied
// document.id = '456';            // Error: Access denied
```

### Lazy Initialization

```javascript
function createLazyObject(initializers) {
  const cache = {};

  return new Proxy({}, {
    get(target, property) {
      if (!(property in cache)) {
        if (property in initializers) {
          console.log(`Initializing: ${property}`);
          cache[property] = initializers[property]();
        }
      }
      return cache[property];
    },

    has(target, property) {
      return property in initializers || property in cache;
    },

    ownKeys() {
      return Object.keys(initializers);
    }
  });
}

// Usage
const resources = createLazyObject({
  database: () => {
    // Expensive database connection
    return { connected: true, query: (sql) => `Result of: ${sql}` };
  },
  cache: () => {
    // Initialize cache
    return new Map();
  },
  logger: () => {
    // Set up logger
    return { log: (msg) => console.log(`[LOG] ${msg}`) };
  }
});

// Nothing initialized yet
console.log('Starting app...');

// Only database is initialized when accessed
resources.database.query('SELECT * FROM users');
// Logs: Initializing: database

// Cache is initialized on first access
resources.cache.set('key', 'value');
// Logs: Initializing: cache
```

### API Mocking for Testing

```javascript
function createMockAPI(responses) {
  return new Proxy({}, {
    get(target, endpoint) {
      return new Proxy(() => {}, {
        apply(target, thisArg, args) {
          const key = `${endpoint}:${JSON.stringify(args)}`;

          if (key in responses) {
            return Promise.resolve(responses[key]);
          }

          if (endpoint in responses) {
            const response = responses[endpoint];
            return Promise.resolve(
              typeof response === 'function' ? response(...args) : response
            );
          }

          return Promise.reject(new Error(`No mock for: ${endpoint}`));
        }
      });
    }
  });
}

// Usage
const mockAPI = createMockAPI({
  getUser: (id) => ({ id, name: `User ${id}` }),
  getProducts: [{ id: 1, name: 'Product 1' }],
  'createOrder:[{"productId":1}]': { orderId: '123', status: 'created' }
});

// Using the mock
async function test() {
  const user = await mockAPI.getUser(42);
  console.log(user);  // { id: 42, name: 'User 42' }

  const products = await mockAPI.getProducts();
  console.log(products);  // [{ id: 1, name: 'Product 1' }]

  const order = await mockAPI.createOrder({ productId: 1 });
  console.log(order);  // { orderId: '123', status: 'created' }
}

test();
```

## Advanced Patterns

### Proxy Chains

Multiple proxies can be chained for complex behavior composition.

```javascript
function compose(...handlers) {
  return (target) => {
    return handlers.reduceRight((acc, handler) => {
      return new Proxy(acc, handler);
    }, target);
  };
}

const loggingHandler = {
  get(target, property, receiver) {
    console.log(`[LOG] Getting: ${property}`);
    return Reflect.get(target, property, receiver);
  }
};

const validationHandler = {
  set(target, property, value, receiver) {
    if (property === 'age' && (typeof value !== 'number' || value < 0)) {
      throw new Error('Invalid age');
    }
    return Reflect.set(target, property, value, receiver);
  }
};

const createEnhancedObject = compose(loggingHandler, validationHandler);

const user = createEnhancedObject({ name: 'Alice', age: 30 });
user.name;     // [LOG] Getting: name
user.age = 31; // Works
// user.age = -1; // Error: Invalid age
```

### Membrane Pattern

The membrane pattern wraps entire object graphs, ensuring all objects accessed through the membrane are also wrapped.

```javascript
function createMembrane(target) {
  const proxyMap = new WeakMap();

  function wrap(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (proxyMap.has(obj)) {
      return proxyMap.get(obj);
    }

    const proxy = new Proxy(obj, {
      get(target, property, receiver) {
        const value = Reflect.get(target, property, receiver);
        return wrap(value);  // Recursively wrap returned objects
      },

      set(target, property, value, receiver) {
        // Unwrap if setting a proxy
        const unwrapped = proxyMap.has(value) ?
          [...proxyMap.entries()].find(([k, v]) => v === value)?.[0] :
          value;
        return Reflect.set(target, property, unwrapped, receiver);
      }
    });

    proxyMap.set(obj, proxy);
    return proxy;
  }

  return wrap(target);
}

// Usage
const data = {
  user: {
    name: 'Alice',
    address: {
      city: 'Wonderland'
    }
  }
};

const wrapped = createMembrane(data);
const city = wrapped.user.address.city;  // All nested accesses are proxied
```

## Performance Considerations

Proxies introduce overhead compared to direct property access. Here are some tips for optimizing proxy usage.

### Cache Computed Values

```javascript
const handler = {
  get(target, property, receiver) {
    // Bad: Recomputes every time
    // return expensiveComputation(target[property]);

    // Good: Cache the result
    if (!target._cache) target._cache = {};
    if (!(property in target._cache)) {
      target._cache[property] = expensiveComputation(target[property]);
    }
    return target._cache[property];
  }
};
```

### Avoid Unnecessary Proxy Creation

```javascript
// Bad: Creates new proxy on every call
function getData() {
  return new Proxy(data, handler);
}

// Good: Reuse the same proxy
const proxiedData = new Proxy(data, handler);
function getData() {
  return proxiedData;
}
```

### Use Proxies Strategically

```javascript
// Only proxy objects that need interception
function createSmartProxy(target, options) {
  if (!options.validate && !options.log) {
    return target;  // No proxy needed
  }
  return new Proxy(target, createHandler(options));
}
```

## Proxy Invariants and Limitations

Proxies must maintain certain invariants to ensure JavaScript semantics are preserved.

### Non-configurable Properties

```javascript
const target = {};
Object.defineProperty(target, 'x', {
  value: 1,
  configurable: false
});

const proxy = new Proxy(target, {
  get(target, property) {
    if (property === 'x') {
      return 2;  // This will throw!
    }
    return Reflect.get(target, property);
  }
});

// TypeError: 'get' on proxy: property 'x' is a read-only and
// non-configurable data property on the proxy target but the
// proxy did not return its actual value
```

### Non-extensible Targets

```javascript
const target = Object.preventExtensions({ x: 1 });

const proxy = new Proxy(target, {
  has(target, property) {
    return false;  // Can't hide existing properties on non-extensible objects
  }
});

// This will throw for existing properties
console.log('x' in proxy);
```

## Browser and Environment Support

Proxy and Reflect are supported in all modern browsers and Node.js.

- Chrome 49+
- Firefox 18+ (full support in 42+)
- Safari 10+
- Edge 12+
- Node.js 6+

**Important**: Proxies cannot be polyfilled for older environments because they require engine-level support.

## Summary

Proxy and Reflect are powerful metaprogramming tools that enable:

- **Interception**: Trap and customize fundamental operations on objects
- **Validation**: Enforce data constraints at the property level
- **Logging**: Automatically track all object interactions
- **Virtual Properties**: Create computed values and dynamic behavior
- **Access Control**: Implement fine-grained permission systems
- **Reactivity**: Build observable data structures for UI frameworks

Key points to remember:

1. Use Reflect methods in proxy traps for consistent, correct behavior
2. Revocable proxies allow temporary access that can be revoked
3. Proxies have some overhead - use them strategically
4. Proxy invariants must be maintained for non-configurable properties
5. Proxies cannot be polyfilled - they require native support

Mastering Proxy and Reflect opens up powerful patterns for building robust, maintainable JavaScript applications with sophisticated runtime behavior.
