---
title: "JavaScript Object Methods: Deep Dive into Object Manipulation"
description: Comprehensive guide to JavaScript Object static methods including Object.keys, values, entries, assign, freeze, seal, and more. Learn advanced object manipulation techniques with practical examples and best practices.
track: javascript
section: core
difficulty: intermediate
tags:
  - Object
  - methods
  - immutability
  - object-manipulation
  - ES6
  - JavaScript-fundamentals
status: imported
origin: old/src/content/docs/javascript/object-methods.en.md
divergence: 0.298
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---


## Concept Explanation

JavaScript Object methods are static functions attached to the global `Object` constructor that provide utilities for inspecting, creating, and modifying objects. These methods form the foundation of object manipulation in JavaScript and are essential for modern application development.

Before ES6, accessing object properties required manual iteration. The introduction of Object static methods revolutionized how developers interact with objects, providing standardized, efficient ways to:

- Extract property keys, values, and entries
- Create new objects with specific configurations
- Merge objects together
- Make objects immutable or partially immutable
- Define property behaviors and metadata

These methods bridge the gap between simple object operations and complex property descriptor configurations, solving real-world problems like state management, configuration merging, and data transformation.

## Core Principles

### Object Introspection
Object methods allow you to inspect what's inside an object—its properties, their values, and their metadata. This is fundamental for debugging, serialization, and dynamic programming.

### Object Immutability Levels
JavaScript provides multiple levels of immutability:
- **Frozen**: Cannot add, delete, or modify properties
- **Sealed**: Cannot add or delete properties, but can modify existing ones
- **Non-extensible**: Cannot add properties, but can delete or modify existing ones
- **Default**: Fully mutable

### Property Enumeration Rules
By default, Object methods only include **enumerable** properties. Non-enumerable properties (like methods) are typically excluded, which prevents accidentally exposing internal methods.

### Shallow Operations
Most Object methods perform **shallow** operations—they don't recursively process nested objects. Understanding this is crucial to avoid unexpected behavior.

### Descriptor-Based Control
Property descriptors give granular control over how properties behave—whether they're writable, enumerable, and configurable.

## Key Points

### Object.keys()
- Returns an array of the object's **own, enumerable property names**
- Does not include inherited properties from the prototype chain
- Does not include Symbol properties
- Order: same as manual enumeration with `for...in`
- Time complexity: O(n) where n is the number of properties

### Object.values()
- Returns an array of the object's **own, enumerable property values**
- Excludes inherited properties
- Order: same as Object.keys()
- Useful for extracting data without property names

### Object.entries()
- Returns array of [key, value] pairs
- Each element is a 2-element array [property, value]
- Enables structured iteration over object data
- Pairs well with `Object.fromEntries()` for transformations

### Object.assign()
- Copies enumerable properties from source to target
- Modifies and returns the target object
- Performs shallow copy
- Processes sources left to right
- Returns the modified target object

### Object.freeze()
- Makes object completely immutable
- Cannot add, delete, or modify properties
- Does not prevent modification of nested objects (shallow freeze)
- Affects property descriptors; writable becomes false
- Returns the frozen object itself

### Object.seal()
- Prevents adding or deleting properties
- Allows modification of existing properties
- Slightly faster than freeze
- Still allows changing property values

### Object.preventExtensions()
- Prevents adding new properties only
- Allows deletion and modification of existing properties
- Least restrictive of the three immutability methods

### Object.create()
- Creates new object with specified prototype
- Allows setting up property descriptors in one operation
- More powerful than object literals for complex scenarios
- Essential for implementing classical inheritance patterns

### Object.defineProperty() / Object.defineProperties()
- Creates or modifies properties with precise control
- Allows setting: value, writable, enumerable, configurable
- Enables getters and setters
- More verbose but provides maximum control

### Object.getOwnPropertyDescriptor() / Object.getOwnPropertyDescriptors()
- Inspects property metadata
- Returns descriptor object with value, writable, enumerable, configurable
- Useful for copying properties with exact configuration

### Object.getPrototypeOf() / Object.setPrototypeOf()
- Safely access and modify prototype chain
- `getPrototypeOf` is safer than `__proto__` property
- Setting prototypes is rarely needed in modern code

## Code Examples

### Extracting Data from Objects

```javascript
const user = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  role: "admin",
  isActive: true
};

// Get all property names
const keys = Object.keys(user);
console.log(keys);
// Output: ['id', 'name', 'email', 'role', 'isActive']

// Get all property values
const values = Object.values(user);
console.log(values);
// Output: [1, 'Alice', 'alice@example.com', 'admin', true]

// Get [key, value] pairs
const entries = Object.entries(user);
console.log(entries);
// Output: [
//   ['id', 1],
//   ['name', 'Alice'],
//   ['email', 'alice@example.com'],
//   ['role', 'admin'],
//   ['isActive', true]
// ]

// Iterate with entries (most descriptive way)
for (const [key, value] of entries) {
  console.log(`${key}: ${value}`);
}
```

### Merging Objects with Object.assign()

```javascript
const defaults = {
  theme: "light",
  language: "en",
  fontSize: 14,
  notifications: true
};

const userPreferences = {
  theme: "dark",
  fontSize: 16
};

// Merge user preferences into defaults
const finalConfig = Object.assign({}, defaults, userPreferences);
console.log(finalConfig);
// Output: {
//   theme: 'dark',
//   language: 'en',
//   fontSize: 16,
//   notifications: true
// }

// Warning: Object.assign performs shallow copy
const person = {
  name: "Bob",
  address: {
    city: "New York",
    zip: "10001"
  }
};

const personCopy = Object.assign({}, person);
personCopy.address.city = "Los Angeles";

console.log(person.address.city);
// Output: 'Los Angeles' (nested object was modified!)
```

### Creating Immutable Objects

```javascript
const user = {
  id: 1,
  name: "Charlie",
  preferences: { theme: "dark" }
};

// Shallow freeze - prevents top-level modifications
Object.freeze(user);

user.name = "David"; // Fails silently in non-strict mode
user.newProp = "value"; // Fails silently

// But nested objects can still be modified
user.preferences.theme = "light"; // This works!

console.log(user.preferences.theme); // Output: 'light'

// For deep freeze, recursively freeze all nested objects
function deepFreeze(obj) {
  Object.freeze(obj);
  Object.values(obj).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  });
  return obj;
}

const deepFrozenUser = {
  id: 1,
  settings: { theme: "dark", notifications: true }
};

deepFreeze(deepFrozenUser);
deepFrozenUser.settings.theme = "light"; // Fails
```

### Seal vs Freeze

```javascript
// SEAL - can modify existing properties, but not add/delete
const sealed = { name: "Eve", age: 25 };
Object.seal(sealed);

sealed.name = "Frank"; // OK - modifies existing property
console.log(sealed.name); // Output: 'Frank'

sealed.email = "frank@example.com"; // Fails silently
delete sealed.age; // Fails silently

// FREEZE - cannot modify, add, or delete
const frozen = { name: "Grace", age: 30 };
Object.freeze(frozen);

frozen.name = "Henry"; // Fails silently
console.log(frozen.name); // Output: 'Grace'

// Check if object is frozen or sealed
console.log(Object.isFrozen(frozen)); // true
console.log(Object.isSealed(sealed)); // true
```

### Property Descriptors

```javascript
const obj = {};

// Define a property with a getter and setter
Object.defineProperty(obj, 'temperature', {
  get() {
    return this._temperature || 0;
  },
  set(value) {
    if (value < -273.15) {
      throw new Error('Temperature cannot be below absolute zero');
    }
    this._temperature = value;
  },
  enumerable: true,
  configurable: true
});

obj.temperature = 25;
console.log(obj.temperature); // Output: 25

// obj.temperature = -300; // Throws error

// Define multiple properties at once
const user = {};
Object.defineProperties(user, {
  id: {
    value: 1,
    writable: false,
    enumerable: true,
    configurable: false
  },
  name: {
    value: "Ivan",
    writable: true,
    enumerable: true,
    configurable: true
  },
  _password: {
    value: "secret",
    writable: true,
    enumerable: false, // Hidden from enumeration
    configurable: false
  }
});

console.log(Object.keys(user)); // ['id', 'name']
user.id = 2; // Fails - not writable
```

### Inspecting Property Descriptors

```javascript
const obj = { name: "Jack" };

// Get descriptor for a single property
const descriptor = Object.getOwnPropertyDescriptor(obj, 'name');
console.log(descriptor);
// Output: {
//   value: 'Jack',
//   writable: true,
//   enumerable: true,
//   configurable: true
// }

// Get all descriptors
const allDescriptors = Object.getOwnPropertyDescriptors(obj);
console.log(allDescriptors);

// Clone object with exact property descriptors
function deepClone(source) {
  const target = Object.create(Object.getPrototypeOf(source));
  Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
  return target;
}
```

### Creating Objects with Object.create()

```javascript
// Create object with specific prototype
const animal = {
  speak() {
    console.log(`${this.name} makes a sound`);
  }
};

const dog = Object.create(animal);
dog.name = "Rex";
dog.bark = function() {
  console.log(`${this.name} barks!`);
};

dog.speak(); // Output: 'Rex makes a sound'
dog.bark(); // Output: 'Rex barks!'

// Create object with prototype and initial properties
const person = Object.create(null, {
  name: {
    value: "Karen",
    writable: true,
    enumerable: true
  },
  greet: {
    value() {
      return `Hello, I'm ${this.name}`;
    },
    enumerable: false
  }
});

console.log(person.greet()); // Output: "Hello, I'm Karen"

// Objects created with Object.create(null) have no prototype
const noProto = Object.create(null);
console.log(noProto.toString); // undefined (no inherited methods)
```

### Object Transformation Pattern

```javascript
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" }
];

// Transform array of objects to object indexed by ID
const usersById = Object.fromEntries(
  users.map(user => [user.id, user.name])
);
console.log(usersById);
// Output: { 1: 'Alice', 2: 'Bob', 3: 'Charlie' }

// Invert key-value pairs
const languageCodes = { en: "English", fr: "French", de: "German" };
const codeToLanguage = Object.fromEntries(
  Object.entries(languageCodes).map(([code, lang]) => [lang, code])
);
console.log(codeToLanguage);
// Output: { English: 'en', French: 'fr', German: 'de' }

// Filter object properties
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  debug: true,
  secret: "xxx"
};

const publicConfig = Object.fromEntries(
  Object.entries(config)
    .filter(([key]) => !key.toLowerCase().includes('secret'))
);
console.log(publicConfig);
// Output: { apiUrl: '...', timeout: 5000, debug: true }
```

### Prevent Extensions

```javascript
const config = { apiUrl: "https://example.com", port: 3000 };

Object.preventExtensions(config);

// Can modify existing properties
config.port = 8000; // OK
console.log(config.port); // Output: 8000

// Cannot add new properties
config.timeout = 5000; // Fails silently

// Can still delete properties
delete config.port; // OK

console.log(config.port); // Output: undefined

// Check if object is extensible
console.log(Object.isExtensible(config)); // false
```

### Practical: Building a Configuration Manager

```javascript
class ConfigManager {
  constructor(defaults) {
    this.config = Object.freeze({ ...defaults });
  }

  // Get configuration value with fallback
  get(key, fallback = undefined) {
    return this.config[key] ?? fallback;
  }

  // Create new config with overrides (immutable pattern)
  override(overrides) {
    const newConfig = Object.assign({}, this.config, overrides);
    return new ConfigManager(newConfig);
  }

  // Get all config entries as object
  getAll() {
    return { ...this.config };
  }

  // List all configuration keys
  keys() {
    return Object.keys(this.config);
  }

  // Export as JSON
  toJSON() {
    return JSON.stringify(this.config, null, 2);
  }
}

// Usage
const appConfig = new ConfigManager({
  env: "production",
  debug: false,
  timeout: 5000
});

console.log(appConfig.get("env")); // Output: 'production'

const devConfig = appConfig.override({ env: "development", debug: true });
console.log(devConfig.get("debug")); // Output: true
console.log(appConfig.get("debug")); // Output: false (original unchanged)
```

## Best Practices

### Use Object.entries() for Modern Iteration
```javascript
// Good - modern and clear
for (const [key, value] of Object.entries(obj)) {
  console.log(key, value);
}

// Avoid - older approach
for (const key in obj) {
  if (obj.hasOwnProperty(key)) {
    console.log(key, obj[key]);
  }
}
```

### Prefer Const with Object Spread for Immutability
```javascript
// Good - spreads values, prevents mutation
const config = { ...defaults, ...userSettings };

// Less ideal - mutates original
Object.assign(defaults, userSettings);
```

### Use Deep Freeze When Needed
```javascript
// For sensitive configuration objects
const deepFreeze = (obj) => {
  Object.freeze(obj);
  Object.values(obj).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  });
  return obj;
};

const secureConfig = deepFreeze({ db: { password: "secret" } });
```

### Check Object Immutability Status
```javascript
if (Object.isFrozen(criticalData)) {
  console.log("Data is protected from modification");
}
```

### Use Property Descriptors for Validation
```javascript
Object.defineProperty(user, 'age', {
  get() {
    return this._age;
  },
  set(value) {
    if (value < 0 || value > 150) {
      throw new RangeError('Invalid age');
    }
    this._age = value;
  }
});
```

### Leverage Object.create(null) for Maps
```javascript
// Good - no inherited properties (like toString)
const map = Object.create(null);
map['key'] = 'value';

// Compare with:
const normalObj = {};
console.log('toString' in normalObj); // true
console.log('toString' in map); // false
```

### Use Shorthand Property Names
```javascript
// Good - modern syntax
const name = "Alice";
const user = { name, role: "admin" };

// Avoid verbose form
const user = { name: name, role: "admin" };
```

### Transform Data with fromEntries()
```javascript
// Transform query string to object
const params = Object.fromEntries(new URLSearchParams(location.search));

// Transform Map to object
const mapData = new Map([['a', 1], ['b', 2]]);
const obj = Object.fromEntries(mapData);
```

## Common Pitfalls

### Shallow Copy Confusion
```javascript
// PITFALL: Modifying nested objects
const original = { user: { name: "Alice" } };
const copy = Object.assign({}, original);
copy.user.name = "Bob";
console.log(original.user.name); // "Bob" - original was modified!

// SOLUTION: Use proper cloning for nested structures
const deepCopy = JSON.parse(JSON.stringify(original)); // For JSON-serializable data
// or use structuredClone() in modern browsers:
const deepCopy = structuredClone(original);
```

### Forgetting Object.keys/values/entries Skip Non-Enumerable Properties
```javascript
// PITFALL:
const obj = { visible: 1 };
Object.defineProperty(obj, 'hidden', {
  value: 2,
  enumerable: false
});
console.log(Object.keys(obj)); // ['visible'] - 'hidden' is skipped

// Use getOwnPropertyNames to include non-enumerable properties
console.log(Object.getOwnPropertyNames(obj)); // ['visible', 'hidden']
```

### Freeze Doesn't Prevent Nested Modification
```javascript
// PITFALL:
const data = Object.freeze({ settings: { theme: 'light' } });
data.settings.theme = 'dark'; // This works - deep freeze needed!

// SOLUTION: Implement deep freeze
function deepFreeze(obj) {
  Object.freeze(obj);
  Object.values(obj).forEach(val => {
    if (typeof val === 'object' && val !== null) {
      deepFreeze(val);
    }
  });
}
```

### Order of Object.assign() Matters
```javascript
// PITFALL: Later sources override earlier ones
const result = Object.assign({}, { a: 1, b: 2 }, { b: 3, c: 4 });
console.log(result); // { a: 1, b: 3, c: 4 } - b is 3, not 2!

// Understand source order:
// Result comes from left-to-right merging
```

### Mutating Method Parameters
```javascript
// PITFALL:
function updateUser(user, changes) {
  return Object.assign(user, changes); // Mutates original!
}

// SOLUTION: Create new object
function updateUser(user, changes) {
  return Object.assign({}, user, changes); // Original unchanged
}
```

### Using for...in Can Include Inherited Properties
```javascript
// PITFALL:
for (const key in obj) {
  console.log(key); // Includes inherited properties
}

// SOLUTION: Use Object.entries or check hasOwnProperty
for (const key in obj) {
  if (obj.hasOwnProperty(key)) {
    console.log(key); // Only own properties
  }
}

// BETTER: Use Object.entries
for (const [key, value] of Object.entries(obj)) {
  console.log(key, value); // Always own properties only
}
```

### Seal vs Freeze Confusion
```javascript
// PITFALL: Not understanding the difference
const data = Object.seal({});
data.prop = "value"; // Fails - can't add properties to sealed object

// Solution: Know your intent
// - Use freeze() for completely immutable data
// - Use seal() if you want to modify existing properties only
// - Use preventExtensions() if you might delete properties
```

## Performance Considerations

### Object.keys() Performance
- Linear time O(n) complexity where n is property count
- Faster than for...in loop with hasOwnProperty check
- Optimize by knowing property count in advance
- Consider using Object.values/entries if you need values too

```javascript
// Avoid multiple iterations
const keys = Object.keys(obj);
const values = Object.values(obj); // Iterates again

// Better: Use single entries() iteration if you need both
const entries = Object.entries(obj);
entries.forEach(([key, value]) => {
  // Use both key and value
});
```

### Object.assign() Efficiency
- Performs shallow copy in O(n) time
- For large objects with many properties, cost is noticeable
- Consider using spread operator for clarity (similar performance)

```javascript
// Roughly equivalent performance
Object.assign({}, a, b, c);
const merged = { ...a, ...b, ...c };

// Spread is often preferred for readability
```

### Object.freeze() Performance
- Creates internal flags, minimal performance cost
- Frozen objects may be optimized by engines
- No significant runtime penalty for accessing frozen object properties

### Avoid Repeated Transformations
```javascript
// SLOW: Transforms on every access
function getUserEmails(users) {
  return Object.values(users).map(u => u.email);
}

// BETTER: Cache if called repeatedly
const emailCache = new WeakMap();
function getUserEmails(users) {
  if (!emailCache.has(users)) {
    emailCache.set(users, Object.values(users).map(u => u.email));
  }
  return emailCache.get(users);
}
```

### Descriptor Definition Performance
- Defining properties with descriptors is slower than assignment
- Use only when you need specific behaviors (getters, validation)
- Batch property definitions with Object.defineProperties()

```javascript
// Slower: Multiple defineProperty calls
Object.defineProperty(obj, 'a', { value: 1 });
Object.defineProperty(obj, 'b', { value: 2 });
Object.defineProperty(obj, 'c', { value: 3 });

// Better: Single defineProperties call
Object.defineProperties(obj, {
  a: { value: 1 },
  b: { value: 2 },
  c: { value: 3 }
});
```

## Real-world Scenarios

### API Response Normalization
```javascript
// Normalize API response to standard format
function normalizeUser(apiResponse) {
  const normalized = Object.create(null);

  const mapping = {
    user_id: 'id',
    user_name: 'name',
    user_email: 'email',
    is_active: 'active'
  };

  for (const [apiKey, appKey] of Object.entries(mapping)) {
    if (apiKey in apiResponse) {
      normalized[appKey] = apiResponse[apiKey];
    }
  }

  return Object.freeze(normalized);
}

const apiData = {
  user_id: 123,
  user_name: "Alice",
  user_email: "alice@example.com",
  is_active: true
};

const user = normalizeUser(apiData);
// { id: 123, name: 'Alice', email: 'alice@example.com', active: true }
```

### Redux-style State Management
```javascript
function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_USER':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };
    case 'SET_CONFIG':
      return Object.assign({}, state, {
        config: action.payload
      });
    default:
      return state;
  }
}

const initialState = Object.freeze({
  user: { id: 1, name: 'Bob' },
  config: { theme: 'light' }
});
```

### Feature Flag Management
```javascript
class FeatureFlags {
  constructor(flags) {
    this.flags = Object.freeze({ ...flags });
  }

  isEnabled(flag) {
    return this.flags[flag] ?? false;
  }

  getEnabledFeatures() {
    return Object.entries(this.flags)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag);
  }

  withOverrides(overrides) {
    return new FeatureFlags(
      Object.assign({}, this.flags, overrides)
    );
  }
}

const flags = new FeatureFlags({
  newUI: true,
  betaFeatures: false,
  analytics: true
});
```

### Database Model Serialization
```javascript
class Model {
  static toObject(instance) {
    return Object.fromEntries(
      Object.entries(instance)
        .filter(([key]) => !key.startsWith('_'))
        .filter(([, value]) => typeof value !== 'function')
    );
  }

  static fromObject(data) {
    return Object.assign(new this(), data);
  }
}

class User extends Model {
  constructor(name, email) {
    this.name = name;
    this.email = email;
    this._internalId = Math.random();
  }

  getEmail() {
    return this.email;
  }
}

const user = new User("Carol", "carol@example.com");
const data = User.toObject(user);
// { name: 'Carol', email: 'carol@example.com' }
```

### Configuration Merging with Defaults
```javascript
const DEFAULT_CONFIG = Object.freeze({
  host: 'localhost',
  port: 3000,
  timeout: 5000,
  retries: 3,
  cache: {
    enabled: true,
    ttl: 3600
  }
});

function createConfig(userConfig) {
  const config = Object.assign({}, DEFAULT_CONFIG, userConfig);

  // For nested objects, need to merge explicitly
  if (userConfig?.cache) {
    config.cache = Object.assign({}, DEFAULT_CONFIG.cache, userConfig.cache);
  }

  return Object.seal(config);
}

const appConfig = createConfig({ port: 8000, cache: { ttl: 7200 } });
// { host: 'localhost', port: 8000, timeout: 5000, retries: 3, cache: { enabled: true, ttl: 7200 } }
```

## Interview Points

### Q1: What's the difference between Object.freeze(), Object.seal(), and Object.preventExtensions()?

**Answer:**
- **freeze()**: Cannot add, delete, or modify properties. Most restrictive.
- **seal()**: Cannot add or delete, but can modify existing properties.
- **preventExtensions()**: Cannot add properties, but can delete and modify.

```javascript
const obj = { a: 1 };

// freeze - completely immutable
Object.freeze(obj);
obj.a = 2; // Fails

// seal - can change values but not structure
Object.seal(obj);
obj.a = 2; // Works
obj.b = 3; // Fails

// preventExtensions - can delete but not add
Object.preventExtensions(obj);
delete obj.a; // Works
obj.b = 3; // Fails
```

### Q2: Why is Object.assign() shallow and how would you handle deep copies?

**Answer:**
Object.assign() only copies property values, not nested objects. For deep copies, use:

```javascript
// Method 1: JSON (only for JSON-serializable data)
const deepCopy = JSON.parse(JSON.stringify(obj));

// Method 2: structuredClone (modern browsers)
const deepCopy = structuredClone(obj);

// Method 3: Recursive function
function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(deepCopy);
  const copy = {};
  for (const key in obj) {
    copy[key] = deepCopy(obj[key]);
  }
  return copy;
}
```

### Q3: Explain the order of operations in Object.assign()

**Answer:**
Object.assign() processes sources from left to right. Each source's properties override previous ones:

```javascript
const result = Object.assign({}, { a: 1, b: 2 }, { b: 3, c: 4 });
// Process order:
// 1. {} - empty
// 2. {a: 1, b: 2} - a:1, b:2
// 3. {b: 3, c: 4} - b overridden to 3, c added
// Result: {a: 1, b: 3, c: 4}
```

### Q4: When would you use Object.create() over object literals?

**Answer:**
Use Object.create() when you need:
- Specific prototype chain setup
- Define properties with descriptors in one operation
- Create object without inherited Object.prototype methods

```javascript
// Object literal
const obj = { a: 1 };
// Has methods: toString, hasOwnProperty, etc.

// Object.create(null)
const bareObj = Object.create(null);
// No inherited methods - useful for maps/dictionaries
bareObj['toString'] = 'my string'; // Won't conflict with Object.prototype
```

### Q5: What are enumerable properties and why do Object.keys/values/entries skip non-enumerable ones?

**Answer:**
Enumerable properties are those marked with `enumerable: true` in their descriptor. They're skipped to avoid exposing internal methods. This is a design choice to make iteration predictable.

```javascript
const obj = { visible: 1 };
Object.defineProperty(obj, 'hidden', {
  value: 2,
  enumerable: false // Skipped by Object.keys
});

Object.keys(obj); // ['visible']
Object.getOwnPropertyNames(obj); // ['visible', 'hidden']
```

### Q6: How would you implement a deep freeze function?

**Answer:**
Recursively freeze all nested objects:

```javascript
function deepFreeze(obj) {
  Object.freeze(obj);

  Object.values(obj).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  });

  return obj;
}

// Usage
const data = deepFreeze({
  user: { name: 'David', settings: { theme: 'dark' } }
});

data.user.settings.theme = 'light'; // Fails
```

### Q7: What's the practical use case for Object.getOwnPropertyDescriptors()?

**Answer:**
Creating precise clones of objects with exact property configurations:

```javascript
// Perfect clone preserving all property descriptors
function cloneWithDescriptors(source) {
  const target = Object.create(Object.getPrototypeOf(source));
  Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
  return target;
}

// vs
const copy = Object.assign({}, source); // Loses descriptor info
```

## Further Reading

### Official Documentation
- [MDN: Object Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
- [ECMAScript Specification: Object](https://tc39.es/ecma262/#sec-object-objects)

### Related Articles
- [MDN: Property Descriptors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [MDN: Prototype Chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [MDN: Object Immutability](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)

### Books
- "You Don't Know JS Yet" - Kyle Simpson (Objects & Classes chapter)
- "JavaScript: The Definitive Guide" - David Flanagan (Objects chapter)
- "Effective JavaScript" - David Herman

### Practice Resources
- [JavaScript.info: Object Methods](https://javascript.info/object-methods)
- [Eloquent JavaScript: Objects](https://eloquentjavascript.net/04_data.html)
- [30 Days of JavaScript Challenge](https://github.com/Asabeneh/30-Days-Of-JavaScript)

### Video Resources
- [JavaScript.info Video Course](https://javascript.info/)
- [Jake Archibald's ES6 presentation](https://www.youtube.com/results?search_query=jake+archibald+es6)
- [Fun Fun Function - Object Composition](https://www.youtube.com/watch?v=O8wJS6-INuY)
