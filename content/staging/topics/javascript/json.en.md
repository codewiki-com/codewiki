---
title: JavaScript JSON Processing
description: Master JavaScript JSON parsing, serialization, techniques and common pitfalls
track: javascript
section: core
difficulty: beginner
tags:
  - JavaScript
  - JSON
  - data
  - serialization
status: imported
origin: old/src/content/docs/javascript/json.en.md
divergence: 0.281
issues: []
legacy:
  category: JavaScript
  subcategory: Data Processing
  order: 25
  lastUpdated: 2026-01-07
---

JSON (JavaScript Object Notation) is a lightweight, text-based data interchange format that has become the de facto standard for data exchange on the web. Originally derived from JavaScript, JSON is language-independent and supported by virtually every modern programming language. This comprehensive guide covers everything you need to know about working with JSON in JavaScript.

## Introduction to JSON

### What is JSON?

JSON is a text format for storing and transporting data. It is self-describing and easy to understand for both humans and machines.

```javascript
// A simple JSON object
{
  "name": "Alice",
  "age": 30,
  "city": "New York",
  "isStudent": false,
  "courses": ["Math", "Science", "History"],
  "address": {
    "street": "123 Main St",
    "zipCode": "10001"
  }
}
```

### Why Use JSON?

1. **Lightweight**: Minimal syntax overhead compared to XML
2. **Human-Readable**: Easy to read and write
3. **Language-Independent**: Supported by all major programming languages
4. **Native JavaScript Support**: Built-in parsing and serialization methods
5. **Widely Adopted**: Standard format for REST APIs and web services

### JSON vs JavaScript Objects

While JSON syntax is derived from JavaScript object literal notation, they are not identical:

```javascript
// JavaScript Object (valid)
const jsObject = {
  name: "Alice",           // Unquoted keys allowed
  'single-quoted': true,   // Single quotes allowed
  method() {               // Methods allowed
    return this.name;
  },
  undefined: undefined,    // undefined is valid
  symbol: Symbol("id"),    // Symbols are valid
};

// JSON (strict format)
const jsonString = `{
  "name": "Alice",
  "singleQuoted": true
}`;

// Key differences:
// 1. JSON keys MUST be double-quoted strings
// 2. JSON values cannot be functions, undefined, or symbols
// 3. JSON only supports double quotes for strings
// 4. JSON cannot have trailing commas
// 5. JSON cannot have comments
```

## JSON Syntax Rules

### Supported Data Types

JSON supports six data types:

```javascript
// 1. Strings - Must use double quotes
const jsonString = '{"message": "Hello, World!"}';

// 2. Numbers - Integer or floating-point
const jsonNumbers = '{"integer": 42, "float": 3.14, "negative": -10, "exponential": 2.5e10}';

// 3. Booleans - true or false (lowercase)
const jsonBoolean = '{"active": true, "deleted": false}';

// 4. null - Represents empty/no value
const jsonNull = '{"data": null}';

// 5. Arrays - Ordered list of values
const jsonArray = '{"items": [1, "two", true, null]}';

// 6. Objects - Key-value pairs
const jsonObject = '{"person": {"name": "Bob", "age": 25}}';

// Parsing examples
console.log(JSON.parse(jsonString));   // { message: "Hello, World!" }
console.log(JSON.parse(jsonNumbers));  // { integer: 42, float: 3.14, negative: -10, exponential: 25000000000 }
console.log(JSON.parse(jsonBoolean));  // { active: true, deleted: false }
console.log(JSON.parse(jsonNull));     // { data: null }
console.log(JSON.parse(jsonArray));    // { items: [1, "two", true, null] }
console.log(JSON.parse(jsonObject));   // { person: { name: "Bob", age: 25 } }
```

### Unsupported Types

These JavaScript types cannot be directly represented in JSON:

```javascript
// Types that cannot be serialized to JSON
const problematicData = {
  func: function() { return "hello"; },  // Functions
  undef: undefined,                       // undefined
  sym: Symbol("id"),                      // Symbols
  bigInt: 123456789012345678901234567890n, // BigInt
  date: new Date(),                       // Date (converts to string)
  regex: /pattern/gi,                     // RegExp (converts to empty object)
  map: new Map([["key", "value"]]),       // Map (converts to empty object)
  set: new Set([1, 2, 3]),                // Set (converts to empty object)
  infinity: Infinity,                     // Infinity (converts to null)
  nan: NaN,                               // NaN (converts to null)
};

console.log(JSON.stringify(problematicData));
// Output: {"date":"2026-01-07T...","regex":{},"map":{},"set":{},"infinity":null,"nan":null}
// Note: func, undef, and sym are completely omitted
```

### Valid JSON Format

```javascript
// Valid JSON examples
const validJSON = [
  '{"name": "Alice"}',                    // Simple object
  '[1, 2, 3]',                            // Array
  '"Hello"',                              // String
  '42',                                   // Number
  'true',                                 // Boolean
  'null',                                 // null
  '{"nested": {"deep": {"value": 1}}}',   // Nested objects
  '[{"id": 1}, {"id": 2}]',               // Array of objects
];

// Invalid JSON examples (will throw SyntaxError)
const invalidJSON = [
  "{'name': 'Alice'}",      // Single quotes not allowed
  '{name: "Alice"}',        // Keys must be quoted
  '{"name": "Alice",}',     // Trailing comma not allowed
  '{name: undefined}',      // undefined not allowed
  '{"value": NaN}',         // NaN not allowed
  '{"value": Infinity}',    // Infinity not allowed
  // Comments not allowed
  `{
    // This is a comment
    "name": "Alice"
  }`,
];

// Test validity
validJSON.forEach((json, i) => {
  try {
    JSON.parse(json);
    console.log(`Valid JSON ${i + 1}: OK`);
  } catch (e) {
    console.log(`Valid JSON ${i + 1}: Error`);
  }
});
```

## JSON.parse() - Parsing JSON

The `JSON.parse()` method parses a JSON string and constructs the JavaScript value or object described by the string.

### Basic Usage

```javascript
// Basic parsing
const jsonString = '{"name": "Alice", "age": 30}';
const obj = JSON.parse(jsonString);

console.log(obj);        // { name: "Alice", age: 30 }
console.log(obj.name);   // "Alice"
console.log(obj.age);    // 30

// Parsing different JSON types
console.log(JSON.parse('"Hello"'));     // "Hello" (string)
console.log(JSON.parse('42'));          // 42 (number)
console.log(JSON.parse('true'));        // true (boolean)
console.log(JSON.parse('null'));        // null
console.log(JSON.parse('[1, 2, 3]'));   // [1, 2, 3] (array)
```

### The Reviver Function

The optional second parameter is a reviver function that can transform the parsed values:

```javascript
// Basic reviver example
const json = '{"name": "Alice", "birthYear": 1995}';

const person = JSON.parse(json, (key, value) => {
  console.log(`Key: "${key}", Value: ${value}`);
  return value;
});
// Output:
// Key: "name", Value: Alice
// Key: "birthYear", Value: 1995
// Key: "", Value: [object Object]  <- The root object

// Transforming values with reviver
const data = '{"price": "100", "quantity": "5"}';

const order = JSON.parse(data, (key, value) => {
  // Convert string numbers to actual numbers
  if (key === "price" || key === "quantity") {
    return Number(value);
  }
  return value;
});

console.log(order);           // { price: 100, quantity: 5 }
console.log(order.price * order.quantity); // 500
```

### Reviving Dates

Dates are converted to strings in JSON. Use a reviver to convert them back:

```javascript
// Date revival
const jsonWithDate = '{"name": "Event", "date": "2026-01-07T10:30:00.000Z"}';

// Without reviver - date remains a string
const parsed1 = JSON.parse(jsonWithDate);
console.log(typeof parsed1.date);  // "string"

// With reviver - date becomes a Date object
const dateReviver = (key, value) => {
  // ISO 8601 date pattern
  const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

  if (typeof value === "string" && datePattern.test(value)) {
    return new Date(value);
  }
  return value;
};

const parsed2 = JSON.parse(jsonWithDate, dateReviver);
console.log(parsed2.date instanceof Date);  // true
console.log(parsed2.date.getFullYear());    // 2026

// More robust date reviver
const robustDateReviver = (key, value) => {
  if (typeof value === "string") {
    // Try to parse as date
    const date = new Date(value);
    // Check if it's a valid date and the string looks like a date
    if (!isNaN(date.getTime()) && value.includes("-")) {
      // Additional check: make sure it's not just a number string
      if (isNaN(Number(value))) {
        return date;
      }
    }
  }
  return value;
};
```

### Error Handling

Always handle potential parsing errors:

```javascript
// Safe JSON parsing
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON parsing error:", error.message);
    return defaultValue;
  }
}

// Usage examples
console.log(safeJsonParse('{"valid": true}'));     // { valid: true }
console.log(safeJsonParse('invalid json'));         // null
console.log(safeJsonParse('', {}));                 // {}
console.log(safeJsonParse(undefined, []));          // []

// More detailed error handling
function parseJsonWithDetails(jsonString) {
  try {
    return {
      success: true,
      data: JSON.parse(jsonString),
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error.message,
        name: error.name,
        // Extract position from error message if available
        position: extractErrorPosition(error.message)
      }
    };
  }
}

function extractErrorPosition(message) {
  const match = message.match(/position (\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Test error handling
const result = parseJsonWithDetails('{"name": "Alice",}');
if (!result.success) {
  console.log("Parse error:", result.error.message);
  // Output: Parse error: Unexpected token } in JSON at position 18
}
```

### Parsing Large JSON

For very large JSON strings, consider these approaches:

```javascript
// Streaming JSON parsing (conceptual - requires external library)
// For Node.js, libraries like 'stream-json' can help

// Chunked processing for arrays
async function processLargeJsonArray(jsonString) {
  const array = JSON.parse(jsonString);
  const chunkSize = 1000;

  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    await processChunk(chunk);

    // Allow other operations to proceed
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

async function processChunk(chunk) {
  // Process each item in the chunk
  chunk.forEach(item => {
    // Process item
  });
}

// Memory-efficient approach: parse only what you need
function extractField(jsonString, fieldName) {
  // Simple regex-based extraction for known structure
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, "g");
  const matches = [];
  let match;

  while ((match = regex.exec(jsonString)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}
```

## JSON.stringify() - Serializing to JSON

The `JSON.stringify()` method converts a JavaScript value to a JSON string.

### Basic Usage

```javascript
// Basic serialization
const obj = { name: "Alice", age: 30, active: true };
const json = JSON.stringify(obj);

console.log(json);           // '{"name":"Alice","age":30,"active":true}'
console.log(typeof json);    // "string"

// Serializing different types
console.log(JSON.stringify("Hello"));        // '"Hello"'
console.log(JSON.stringify(42));             // '42'
console.log(JSON.stringify(true));           // 'true'
console.log(JSON.stringify(null));           // 'null'
console.log(JSON.stringify([1, 2, 3]));      // '[1,2,3]'
console.log(JSON.stringify({ a: 1, b: 2 })); // '{"a":1,"b":2}'
```

### The Replacer Parameter

The second parameter can be a function or an array to filter/transform values:

```javascript
// Replacer as a function
const user = {
  name: "Alice",
  password: "secret123",
  email: "alice@example.com",
  age: 30
};

// Filter out sensitive data
const safeJson = JSON.stringify(user, (key, value) => {
  if (key === "password") {
    return undefined;  // Omit this property
  }
  return value;
});

console.log(safeJson);
// '{"name":"Alice","email":"alice@example.com","age":30}'

// Transform values
const data = { price: 100, quantity: 5 };

const formatted = JSON.stringify(data, (key, value) => {
  if (key === "price") {
    return `$${value.toFixed(2)}`;
  }
  return value;
});

console.log(formatted);  // '{"price":"$100.00","quantity":5}'

// Replacer as an array (whitelist)
const fullObject = {
  id: 1,
  name: "Product",
  description: "A great product",
  internalCode: "XYZ123",
  price: 99.99
};

// Only include specific properties
const publicJson = JSON.stringify(fullObject, ["id", "name", "price"]);
console.log(publicJson);
// '{"id":1,"name":"Product","price":99.99}'
```

### The Space Parameter

The third parameter controls indentation for pretty-printing:

```javascript
const obj = {
  name: "Alice",
  address: {
    city: "New York",
    country: "USA"
  },
  hobbies: ["reading", "gaming"]
};

// No formatting (default)
console.log(JSON.stringify(obj));
// '{"name":"Alice","address":{"city":"New York","country":"USA"},"hobbies":["reading","gaming"]}'

// With 2 spaces indentation
console.log(JSON.stringify(obj, null, 2));
/*
{
  "name": "Alice",
  "address": {
    "city": "New York",
    "country": "USA"
  },
  "hobbies": [
    "reading",
    "gaming"
  ]
}
*/

// With 4 spaces
console.log(JSON.stringify(obj, null, 4));

// With tab character
console.log(JSON.stringify(obj, null, "\t"));

// With custom string (max 10 characters)
console.log(JSON.stringify(obj, null, "-->"));
/*
{
-->"name": "Alice",
-->"address": {
-->-->"city": "New York",
-->-->"country": "USA"
-->},
-->"hobbies": [
-->-->"reading",
-->-->"gaming"
-->]
}
*/
```

### The toJSON() Method

Objects can define a custom `toJSON()` method to control their serialization:

```javascript
// Custom toJSON method
class User {
  constructor(name, email, password) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.createdAt = new Date();
  }

  // Custom serialization
  toJSON() {
    return {
      name: this.name,
      email: this.email,
      // Password is excluded
      createdAt: this.createdAt.toISOString()
    };
  }
}

const user = new User("Alice", "alice@example.com", "secret");
console.log(JSON.stringify(user, null, 2));
/*
{
  "name": "Alice",
  "email": "alice@example.com",
  "createdAt": "2026-01-07T10:30:00.000Z"
}
*/

// Built-in Date toJSON
const date = new Date("2026-01-07T10:30:00Z");
console.log(JSON.stringify({ date }));
// '{"date":"2026-01-07T10:30:00.000Z"}'

// Custom toJSON for complex objects
class Order {
  constructor(items) {
    this.items = items;
    this.total = items.reduce((sum, item) => sum + item.price, 0);
  }

  toJSON() {
    return {
      items: this.items.map(item => ({
        name: item.name,
        price: item.price
      })),
      total: this.total,
      itemCount: this.items.length
    };
  }
}

const order = new Order([
  { name: "Book", price: 25, internalId: "B001" },
  { name: "Pen", price: 5, internalId: "P001" }
]);

console.log(JSON.stringify(order, null, 2));
```

### Handling Circular References

JSON.stringify() throws an error for circular references:

```javascript
// Circular reference error
const obj = { name: "Alice" };
obj.self = obj;  // Circular reference

try {
  JSON.stringify(obj);
} catch (error) {
  console.log(error.message);
  // "Converting circular structure to JSON"
}

// Solution 1: Use a replacer to handle circular references
function stringifyWithCircular(obj) {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular Reference]";
      }
      seen.add(value);
    }
    return value;
  });
}

const circular = { name: "Alice" };
circular.self = circular;
circular.friend = { name: "Bob", knows: circular };

console.log(stringifyWithCircular(circular));
// '{"name":"Alice","self":"[Circular Reference]","friend":{"name":"Bob","knows":"[Circular Reference]"}}'

// Solution 2: Use a library like 'flatted' or 'circular-json'

// Solution 3: Manually remove circular references before serializing
function removeCircular(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (seen.has(obj)) {
    return undefined;
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => removeCircular(item, seen));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleaned = removeCircular(value, seen);
    if (cleaned !== undefined) {
      result[key] = cleaned;
    }
  }

  return result;
}
```

## Advanced Techniques

### Deep Clone with JSON

A simple (but limited) way to deep clone objects:

```javascript
// Deep clone using JSON
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const original = {
  name: "Alice",
  address: {
    city: "New York",
    coords: { lat: 40.7128, lng: -74.0060 }
  },
  hobbies: ["reading", "gaming"]
};

const cloned = deepClone(original);
cloned.address.city = "Los Angeles";
cloned.hobbies.push("swimming");

console.log(original.address.city);  // "New York" (unchanged)
console.log(original.hobbies);       // ["reading", "gaming"] (unchanged)

// Limitations of JSON deep clone:
const problematic = {
  date: new Date(),           // Becomes string
  regex: /pattern/g,          // Becomes empty object
  func: () => "hello",        // Lost
  undef: undefined,           // Lost
  nan: NaN,                   // Becomes null
  infinity: Infinity,         // Becomes null
  map: new Map([["a", 1]]),   // Becomes empty object
  set: new Set([1, 2, 3]),    // Becomes empty object
};

const clonedProblematic = deepClone(problematic);
console.log(clonedProblematic);
// { date: "2026-01-07T...", regex: {}, nan: null, infinity: null, map: {}, set: {} }

// Better alternative: structuredClone (modern browsers and Node.js 17+)
const betterClone = structuredClone(original);
```

### Custom Serialization and Deserialization

Handle complex types with custom serializers:

```javascript
// Custom type serialization system
const typeHandlers = {
  serialize: {
    Date: (value) => ({ __type: "Date", value: value.toISOString() }),
    RegExp: (value) => ({ __type: "RegExp", source: value.source, flags: value.flags }),
    Map: (value) => ({ __type: "Map", entries: Array.from(value.entries()) }),
    Set: (value) => ({ __type: "Set", values: Array.from(value) }),
  },
  deserialize: {
    Date: (data) => new Date(data.value),
    RegExp: (data) => new RegExp(data.source, data.flags),
    Map: (data) => new Map(data.entries),
    Set: (data) => new Set(data.values),
  }
};

function advancedStringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Date) return typeHandlers.serialize.Date(value);
    if (value instanceof RegExp) return typeHandlers.serialize.RegExp(value);
    if (value instanceof Map) return typeHandlers.serialize.Map(value);
    if (value instanceof Set) return typeHandlers.serialize.Set(value);
    return value;
  });
}

function advancedParse(json) {
  return JSON.parse(json, (key, value) => {
    if (value && typeof value === "object" && value.__type) {
      const handler = typeHandlers.deserialize[value.__type];
      if (handler) return handler(value);
    }
    return value;
  });
}

// Usage
const complexData = {
  name: "Test",
  createdAt: new Date("2026-01-07"),
  pattern: /hello\s+world/gi,
  metadata: new Map([["key1", "value1"], ["key2", "value2"]]),
  tags: new Set(["javascript", "json", "tutorial"])
};

const serialized = advancedStringify(complexData);
console.log(serialized);
// Contains __type markers for special types

const deserialized = advancedParse(serialized);
console.log(deserialized.createdAt instanceof Date);  // true
console.log(deserialized.pattern instanceof RegExp);  // true
console.log(deserialized.metadata instanceof Map);    // true
console.log(deserialized.tags instanceof Set);        // true
```

### JSON Schema Validation

Validate JSON structure against a schema:

```javascript
// Simple schema validator
function validateJsonSchema(data, schema) {
  const errors = [];

  function validate(value, schema, path = "") {
    // Type checking
    if (schema.type) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== schema.type && !(schema.type === "null" && value === null)) {
        errors.push(`${path}: expected ${schema.type}, got ${actualType}`);
        return;
      }
    }

    // Required properties
    if (schema.type === "object" && schema.required) {
      for (const prop of schema.required) {
        if (!(prop in value)) {
          errors.push(`${path}: missing required property "${prop}"`);
        }
      }
    }

    // Object properties
    if (schema.type === "object" && schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in value) {
          validate(value[key], propSchema, `${path}.${key}`);
        }
      }
    }

    // Array items
    if (schema.type === "array" && schema.items) {
      value.forEach((item, index) => {
        validate(item, schema.items, `${path}[${index}]`);
      });
    }

    // String constraints
    if (schema.type === "string") {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`${path}: string too short (min: ${schema.minLength})`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`${path}: string too long (max: ${schema.maxLength})`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push(`${path}: string does not match pattern`);
      }
    }

    // Number constraints
    if (schema.type === "number") {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`${path}: number below minimum (${schema.minimum})`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`${path}: number above maximum (${schema.maximum})`);
      }
    }
  }

  validate(data, schema);

  return {
    valid: errors.length === 0,
    errors
  };
}

// Usage example
const userSchema = {
  type: "object",
  required: ["name", "email", "age"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 100 },
    email: { type: "string", pattern: "^[^@]+@[^@]+\\.[^@]+$" },
    age: { type: "number", minimum: 0, maximum: 150 },
    hobbies: {
      type: "array",
      items: { type: "string" }
    }
  }
};

const validUser = {
  name: "Alice",
  email: "alice@example.com",
  age: 30,
  hobbies: ["reading", "gaming"]
};

const invalidUser = {
  name: "",
  email: "invalid-email",
  age: -5
};

console.log(validateJsonSchema(validUser, userSchema));
// { valid: true, errors: [] }

console.log(validateJsonSchema(invalidUser, userSchema));
// { valid: false, errors: [...] }
```

### Merge JSON Objects

Deep merge multiple JSON objects:

```javascript
// Deep merge function
function deepMerge(target, ...sources) {
  if (!sources.length) return target;

  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

// Usage
const defaults = {
  server: {
    host: "localhost",
    port: 3000,
    ssl: false
  },
  database: {
    host: "localhost",
    port: 5432
  },
  logging: {
    level: "info",
    format: "json"
  }
};

const userConfig = {
  server: {
    port: 8080,
    ssl: true
  },
  database: {
    host: "db.example.com"
  }
};

const finalConfig = deepMerge({}, defaults, userConfig);
console.log(JSON.stringify(finalConfig, null, 2));
/*
{
  "server": {
    "host": "localhost",
    "port": 8080,
    "ssl": true
  },
  "database": {
    "host": "db.example.com",
    "port": 5432
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
*/
```

## Working with APIs

### Fetching JSON Data

```javascript
// Modern fetch API
async function fetchJson(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new TypeError("Response was not JSON");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// Usage
async function getUsers() {
  try {
    const users = await fetchJson("https://api.example.com/users");
    console.log(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
  }
}

// Fetch with timeout
async function fetchJsonWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  }
}
```

### Sending JSON Data

```javascript
// POST request with JSON body
async function postJson(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorBody}`);
  }

  return await response.json();
}

// Usage
async function createUser(userData) {
  try {
    const result = await postJson("https://api.example.com/users", {
      name: userData.name,
      email: userData.email,
      role: userData.role || "user"
    });
    console.log("User created:", result);
    return result;
  } catch (error) {
    console.error("Failed to create user:", error);
    throw error;
  }
}

// PUT/PATCH request
async function updateJson(url, data, method = "PUT") {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Delete request (may not need JSON body)
async function deleteResource(url) {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Some APIs return empty response on DELETE
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
```

### API Error Handling

```javascript
// Comprehensive API client with error handling
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Parse response body
      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle non-2xx responses
      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;

    } catch (error) {
      // Network or parsing errors
      if (!error.status) {
        error.status = 0;
        error.message = `Network error: ${error.message}`;
      }
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: "POST", body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: "PUT", body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }
}

// Usage
const api = new ApiClient("https://api.example.com");

async function example() {
  try {
    // GET request
    const users = await api.get("/users");

    // POST request
    const newUser = await api.post("/users", {
      name: "Alice",
      email: "alice@example.com"
    });

    // PUT request
    const updatedUser = await api.put(`/users/${newUser.id}`, {
      name: "Alice Smith"
    });

    // DELETE request
    await api.delete(`/users/${newUser.id}`);

  } catch (error) {
    if (error.status === 401) {
      console.log("Unauthorized - please log in");
    } else if (error.status === 404) {
      console.log("Resource not found");
    } else if (error.status === 0) {
      console.log("Network error - check your connection");
    } else {
      console.log("API error:", error.message);
    }
  }
}
```

## Common Pitfalls and Solutions

### Parsing Non-JSON Strings

```javascript
// Problem: Parsing something that looks like JSON but isn't
const notJson = "Hello, World!";

try {
  JSON.parse(notJson);  // SyntaxError
} catch (error) {
  console.log("Not valid JSON");
}

// Solution: Always validate or use try-catch
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

console.log(isValidJson('{"valid": true}'));  // true
console.log(isValidJson('not json'));          // false
console.log(isValidJson(''));                  // false
console.log(isValidJson('null'));              // true (null is valid JSON)
```

### Loss of Precision with Large Numbers

```javascript
// Problem: Large integers lose precision
const jsonWithLargeNumber = '{"id": 9007199254740993}';
const parsed = JSON.parse(jsonWithLargeNumber);

console.log(parsed.id);                    // 9007199254740992 (wrong!)
console.log(parsed.id === 9007199254740993); // false

// Solution 1: Use strings for large IDs
const jsonWithStringId = '{"id": "9007199254740993"}';
const parsed2 = JSON.parse(jsonWithStringId);
console.log(parsed2.id); // "9007199254740993" (correct as string)

// Solution 2: Use BigInt with custom parsing
const bigIntReviver = (key, value) => {
  // Check if it's a number that might lose precision
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    // This won't work because precision is already lost
    // Better to send as string from the server
  }
  return value;
};

// Solution 3: Parse large numbers as strings using regex
function parseLargeNumbers(jsonString) {
  // Replace large numbers with strings before parsing
  const modified = jsonString.replace(
    /:\s*(\d{16,})/g,
    ':"$1"'
  );
  return JSON.parse(modified);
}

// Solution 4: Use a library like 'json-bigint'
```

### Date Handling

```javascript
// Problem: Dates are serialized as strings
const obj = { date: new Date("2026-01-07") };
const json = JSON.stringify(obj);
const parsed = JSON.parse(json);

console.log(typeof parsed.date);  // "string"
console.log(parsed.date instanceof Date);  // false

// Solution: Custom date handling
class DateHandler {
  static serialize(obj) {
    return JSON.stringify(obj, (key, value) => {
      if (value instanceof Date) {
        return { __type: "Date", iso: value.toISOString() };
      }
      return value;
    });
  }

  static parse(json) {
    return JSON.parse(json, (key, value) => {
      if (value && value.__type === "Date") {
        return new Date(value.iso);
      }
      return value;
    });
  }
}

const data = {
  event: "Meeting",
  date: new Date("2026-01-07T10:00:00Z")
};

const serialized = DateHandler.serialize(data);
const restored = DateHandler.parse(serialized);

console.log(restored.date instanceof Date);  // true
console.log(restored.date.toISOString());    // "2026-01-07T10:00:00.000Z"
```

### Undefined Values

```javascript
// Problem: undefined values are dropped during serialization
const obj = {
  name: "Alice",
  age: undefined,
  email: null
};

console.log(JSON.stringify(obj));
// '{"name":"Alice","email":null}'
// Note: 'age' is missing

// Arrays with undefined
const arr = [1, undefined, 3];
console.log(JSON.stringify(arr));
// '[1,null,3]' - undefined becomes null in arrays

// Solution: Convert undefined to null explicitly
function serializeWithUndefined(obj) {
  return JSON.stringify(obj, (key, value) => {
    return value === undefined ? null : value;
  });
}

console.log(serializeWithUndefined(obj));
// '{"name":"Alice","age":null,"email":null}'

// Or mark undefined values
function serializeWithMarker(obj) {
  return JSON.stringify(obj, (key, value) => {
    return value === undefined ? { __undefined: true } : value;
  });
}

function parseWithMarker(json) {
  return JSON.parse(json, (key, value) => {
    return value && value.__undefined ? undefined : value;
  });
}
```

### Prototype Pollution

```javascript
// Problem: JSON.parse can potentially cause prototype pollution
// This is a security concern with older patterns

// Dangerous pattern (DO NOT USE)
function unsafeMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === "object") {
      target[key] = target[key] || {};
      unsafeMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

// Malicious JSON
const maliciousJson = '{"__proto__": {"isAdmin": true}}';
const parsed = JSON.parse(maliciousJson);

// Solution: Always validate and sanitize
function safeParse(json) {
  const obj = JSON.parse(json);
  return sanitizeObject(obj);
}

function sanitizeObject(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Remove dangerous keys
  const dangerous = ["__proto__", "constructor", "prototype"];

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!dangerous.includes(key)) {
      cleaned[key] = sanitizeObject(value);
    }
  }

  return cleaned;
}

// Use Object.create(null) for safer objects
const safeObj = Object.create(null);
Object.assign(safeObj, JSON.parse('{"key": "value"}'));
```

### Handling Empty or Null Responses

```javascript
// Problem: API returns empty or null response
async function fetchData(url) {
  const response = await fetch(url);
  const text = await response.text();

  // Handle empty response
  if (!text || text.trim() === "") {
    return null;
  }

  // Handle "null" string
  if (text.trim() === "null") {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse response:", text);
    throw new Error("Invalid JSON response");
  }
}

// Safe response handling
function safeJsonParse(text, defaultValue = {}) {
  if (!text || typeof text !== "string") {
    return defaultValue;
  }

  const trimmed = text.trim();

  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed ?? defaultValue;
  } catch {
    return defaultValue;
  }
}
```

## Performance Considerations

### Benchmarking JSON Operations

```javascript
// Performance testing utility
function benchmark(name, fn, iterations = 10000) {
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const end = performance.now();
  const avgTime = (end - start) / iterations;

  console.log(`${name}: ${avgTime.toFixed(4)}ms per operation`);
  return avgTime;
}

// Test data
const smallObject = { name: "Alice", age: 30 };
const mediumObject = {
  users: Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    active: i % 2 === 0
  }))
};

// Benchmark stringify
benchmark("Small object stringify", () => JSON.stringify(smallObject));
benchmark("Medium object stringify", () => JSON.stringify(mediumObject));

// Benchmark parse
const smallJson = JSON.stringify(smallObject);
const mediumJson = JSON.stringify(mediumObject);

benchmark("Small JSON parse", () => JSON.parse(smallJson));
benchmark("Medium JSON parse", () => JSON.parse(mediumJson));
```

### Optimizing JSON Size

```javascript
// Technique 1: Use shorter property names
const verbose = {
  firstName: "Alice",
  lastName: "Smith",
  emailAddress: "alice@example.com",
  dateOfBirth: "1995-01-15"
};

const compact = {
  fn: "Alice",
  ln: "Smith",
  em: "alice@example.com",
  dob: "1995-01-15"
};

console.log(JSON.stringify(verbose).length);  // 95 characters
console.log(JSON.stringify(compact).length);  // 63 characters

// Technique 2: Remove null/undefined values
function removeNullValues(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    return value === null || value === undefined ? undefined : value;
  }));
}

// Technique 3: Use arrays instead of objects for repetitive data
const objectArray = [
  { id: 1, name: "Alice", age: 30 },
  { id: 2, name: "Bob", age: 25 },
  { id: 3, name: "Charlie", age: 35 }
];

// More compact format
const tupleArray = {
  fields: ["id", "name", "age"],
  data: [
    [1, "Alice", 30],
    [2, "Bob", 25],
    [3, "Charlie", 35]
  ]
};

console.log(JSON.stringify(objectArray).length);  // 81 characters
console.log(JSON.stringify(tupleArray).length);   // 72 characters

// Reconstruction function
function reconstructObjects(compact) {
  const { fields, data } = compact;
  return data.map(row => {
    const obj = {};
    fields.forEach((field, i) => {
      obj[field] = row[i];
    });
    return obj;
  });
}

console.log(reconstructObjects(tupleArray));
```

### Lazy Parsing

```javascript
// For very large JSON, consider lazy/partial parsing
class LazyJson {
  constructor(jsonString) {
    this.jsonString = jsonString;
    this.parsed = null;
  }

  // Only parse when needed
  get data() {
    if (this.parsed === null) {
      this.parsed = JSON.parse(this.jsonString);
    }
    return this.parsed;
  }

  // Extract a single value without full parsing (simple implementation)
  extractValue(key) {
    const regex = new RegExp(`"${key}"\\s*:\\s*("[^"]*"|\\d+|true|false|null)`);
    const match = this.jsonString.match(regex);

    if (match) {
      return JSON.parse(match[1]);
    }
    return undefined;
  }

  // Check if key exists without full parsing
  hasKey(key) {
    return this.jsonString.includes(`"${key}":`);
  }
}

// Usage
const largeJson = JSON.stringify({
  id: 12345,
  name: "Large Dataset",
  // ... many more properties
  data: Array(10000).fill({ value: 1 })
});

const lazy = new LazyJson(largeJson);

// Fast operations without full parsing
console.log(lazy.hasKey("id"));       // true
console.log(lazy.extractValue("id")); // 12345

// Full parsing only when needed
// const fullData = lazy.data;
```

### Caching Parsed JSON

```javascript
// Simple JSON cache
class JsonCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  parse(jsonString) {
    // Use the string itself as the key
    if (this.cache.has(jsonString)) {
      return this.cache.get(jsonString);
    }

    const parsed = JSON.parse(jsonString);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(jsonString, parsed);
    return parsed;
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

// Usage
const cache = new JsonCache(50);

// First parse - slow
const result1 = cache.parse('{"name": "Alice"}');

// Second parse - fast (from cache)
const result2 = cache.parse('{"name": "Alice"}');

console.log(result1 === result2);  // true (same object reference)
```

## Security Best Practices

### Input Validation

```javascript
// Validate JSON input
function validateJsonInput(input, options = {}) {
  const {
    maxLength = 1000000,  // 1MB default
    maxDepth = 20,
    allowedTypes = ["object", "array"]
  } = options;

  // Check input length
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  if (input.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength}`);
  }

  // Parse with error handling
  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }

  // Check type
  const type = Array.isArray(parsed) ? "array" : typeof parsed;
  if (!allowedTypes.includes(type)) {
    throw new Error(`Type "${type}" is not allowed`);
  }

  // Check depth
  if (!checkDepth(parsed, maxDepth)) {
    throw new Error(`JSON exceeds maximum depth of ${maxDepth}`);
  }

  return parsed;
}

function checkDepth(obj, maxDepth, currentDepth = 0) {
  if (currentDepth > maxDepth) {
    return false;
  }

  if (obj === null || typeof obj !== "object") {
    return true;
  }

  const values = Array.isArray(obj) ? obj : Object.values(obj);
  return values.every(value => checkDepth(value, maxDepth, currentDepth + 1));
}

// Usage
try {
  const data = validateJsonInput(userInput, {
    maxLength: 50000,
    maxDepth: 10,
    allowedTypes: ["object"]
  });
  // Process data...
} catch (error) {
  console.error("Validation failed:", error.message);
}
```

### Sanitizing Output

```javascript
// Sanitize JSON output to prevent XSS
function sanitizeForHtml(obj) {
  const json = JSON.stringify(obj);

  // Escape characters that could break out of script tags
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/'/g, "\\u0027")
    .replace(/"/g, "\\u0022");
}

// Safe embedding in HTML
function embedJsonInHtml(data) {
  const safeJson = sanitizeForHtml(data);
  return `<script type="application/json" id="app-data">${safeJson}</script>`;
}

// Reading embedded JSON
function readEmbeddedJson(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    return JSON.parse(element.textContent);
  } catch {
    return null;
  }
}

// Sanitize sensitive data before logging
function sanitizeForLogging(obj) {
  const sensitiveKeys = ["password", "token", "secret", "apiKey", "authorization"];

  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      return "[REDACTED]";
    }
    return value;
  }));
}

// Usage
const userData = {
  name: "Alice",
  password: "secret123",
  apiKey: "abc123xyz"
};

console.log(sanitizeForLogging(userData));
// { name: "Alice", password: "[REDACTED]", apiKey: "[REDACTED]" }
```

### Preventing JSON Injection

```javascript
// Safe JSON construction
function buildSafeJson(userInput) {
  // Never concatenate user input into JSON strings
  // BAD:
  // const json = `{"name": "${userInput}"}`; // Vulnerable!

  // GOOD: Use JSON.stringify
  const obj = { name: userInput };
  return JSON.stringify(obj);
}

// Example of why string concatenation is dangerous
const maliciousInput = '", "isAdmin": true, "x": "';
// Bad: `{"name": "${maliciousInput}"}`
// Results in: {"name": "", "isAdmin": true, "x": ""}

// Good: JSON.stringify({ name: maliciousInput })
// Results in: {"name":"\", \"isAdmin\": true, \"x\": \""}
// The quotes are properly escaped

// Validate expected structure
function validateStructure(obj, schema) {
  // Check that obj only contains expected keys
  const allowedKeys = Object.keys(schema);
  const actualKeys = Object.keys(obj);

  for (const key of actualKeys) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`Unexpected key: ${key}`);
    }
  }

  // Check types
  for (const [key, expectedType] of Object.entries(schema)) {
    if (key in obj) {
      const actualType = Array.isArray(obj[key]) ? "array" : typeof obj[key];
      if (actualType !== expectedType) {
        throw new Error(`Invalid type for ${key}: expected ${expectedType}, got ${actualType}`);
      }
    }
  }

  return true;
}

// Usage
const userSchema = {
  name: "string",
  age: "number",
  email: "string"
};

try {
  const input = JSON.parse(userInput);
  validateStructure(input, userSchema);
  // Safe to use
} catch (error) {
  console.error("Invalid input:", error.message);
}
```

## Real-World Examples

### Configuration Management

```javascript
// Configuration loader with defaults and validation
class ConfigLoader {
  constructor(defaultConfig) {
    this.defaultConfig = defaultConfig;
    this.config = null;
  }

  load(jsonString) {
    try {
      const userConfig = JSON.parse(jsonString);
      this.config = this.mergeWithDefaults(userConfig);
      this.validate();
      return this.config;
    } catch (error) {
      throw new Error(`Configuration error: ${error.message}`);
    }
  }

  mergeWithDefaults(userConfig) {
    return this.deepMerge({}, this.defaultConfig, userConfig);
  }

  deepMerge(target, ...sources) {
    for (const source of sources) {
      for (const key in source) {
        if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
          target[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  validate() {
    // Add custom validation logic
    if (this.config.server.port < 1 || this.config.server.port > 65535) {
      throw new Error("Invalid port number");
    }
  }

  get(path) {
    return path.split(".").reduce((obj, key) => obj?.[key], this.config);
  }
}

// Usage
const defaultConfig = {
  server: {
    host: "localhost",
    port: 3000,
    cors: {
      enabled: false,
      origins: []
    }
  },
  database: {
    host: "localhost",
    port: 5432,
    pool: {
      min: 2,
      max: 10
    }
  },
  logging: {
    level: "info",
    format: "json"
  }
};

const loader = new ConfigLoader(defaultConfig);

const userConfigJson = `{
  "server": {
    "port": 8080,
    "cors": {
      "enabled": true,
      "origins": ["https://example.com"]
    }
  }
}`;

const config = loader.load(userConfigJson);
console.log(loader.get("server.port"));        // 8080
console.log(loader.get("server.cors.enabled")); // true
console.log(loader.get("database.pool.max"));   // 10 (from defaults)
```

### Local Storage with JSON

```javascript
// Type-safe local storage wrapper
class TypedStorage {
  constructor(prefix = "app_") {
    this.prefix = prefix;
  }

  set(key, value, expiresIn = null) {
    const item = {
      value,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : null
    };

    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
      return true;
    } catch (error) {
      // Handle quota exceeded or other errors
      console.error("Storage error:", error);
      return false;
    }
  }

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this.prefix + key);

      if (!raw) {
        return defaultValue;
      }

      const item = JSON.parse(raw);

      // Check expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.remove(key);
        return defaultValue;
      }

      return item.value;
    } catch {
      return defaultValue;
    }
  }

  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }

  clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Get all stored keys
  keys() {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.slice(this.prefix.length));
  }
}

// Usage
const storage = new TypedStorage("myapp_");

// Store user preferences
storage.set("preferences", {
  theme: "dark",
  language: "en",
  notifications: true
});

// Store with expiration (1 hour)
storage.set("sessionData", { userId: 123 }, 60 * 60 * 1000);

// Retrieve data
const prefs = storage.get("preferences", { theme: "light" });
console.log(prefs.theme);  // "dark"

// Get with default value
const missing = storage.get("nonexistent", { default: true });
console.log(missing);  // { default: true }
```

### Data Transformation Pipeline

```javascript
// JSON transformation utilities
const JsonTransform = {
  // Flatten nested object
  flatten(obj, prefix = "") {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value, newKey));
      } else {
        result[newKey] = value;
      }
    }

    return result;
  },

  // Unflatten to nested object
  unflatten(obj) {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      const keys = key.split(".");
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
    }

    return result;
  },

  // Pick specific fields
  pick(obj, fields) {
    const result = {};
    for (const field of fields) {
      if (field in obj) {
        result[field] = obj[field];
      }
    }
    return result;
  },

  // Omit specific fields
  omit(obj, fields) {
    const result = { ...obj };
    for (const field of fields) {
      delete result[field];
    }
    return result;
  },

  // Rename keys
  rename(obj, keyMap) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = keyMap[key] || key;
      result[newKey] = value;
    }
    return result;
  },

  // Transform values
  mapValues(obj, fn) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = fn(value, key);
    }
    return result;
  }
};

// Usage examples
const user = {
  firstName: "Alice",
  lastName: "Smith",
  address: {
    street: "123 Main St",
    city: "New York",
    country: "USA"
  },
  password: "secret"
};

// Flatten
console.log(JsonTransform.flatten(user));
// { firstName: "Alice", lastName: "Smith", "address.street": "123 Main St", ... }

// Pick fields
console.log(JsonTransform.pick(user, ["firstName", "lastName"]));
// { firstName: "Alice", lastName: "Smith" }

// Omit sensitive fields
console.log(JsonTransform.omit(user, ["password"]));
// { firstName: "Alice", lastName: "Smith", address: {...} }

// Rename keys
console.log(JsonTransform.rename(user, { firstName: "first_name", lastName: "last_name" }));
// { first_name: "Alice", last_name: "Smith", address: {...}, password: "secret" }
```

### API Response Normalization

```javascript
// Normalize API responses to consistent format
class ApiNormalizer {
  static normalize(response, schema) {
    if (Array.isArray(response)) {
      return response.map(item => this.normalizeItem(item, schema));
    }
    return this.normalizeItem(response, schema);
  }

  static normalizeItem(item, schema) {
    const result = {};

    for (const [targetKey, config] of Object.entries(schema)) {
      let value;

      if (typeof config === "string") {
        // Simple mapping: targetKey: "sourceKey"
        value = this.getNestedValue(item, config);
      } else if (typeof config === "object") {
        // Complex mapping
        const sourceValue = this.getNestedValue(item, config.from);

        if (config.transform) {
          value = config.transform(sourceValue, item);
        } else {
          value = sourceValue;
        }

        if (value === undefined && config.default !== undefined) {
          value = config.default;
        }
      }

      if (value !== undefined) {
        result[targetKey] = value;
      }
    }

    return result;
  }

  static getNestedValue(obj, path) {
    return path.split(".").reduce((o, k) => o?.[k], obj);
  }
}

// Usage: Normalize different API responses to consistent format
const githubUser = {
  login: "alice",
  name: "Alice Smith",
  avatar_url: "https://github.com/avatars/alice",
  html_url: "https://github.com/alice",
  created_at: "2020-01-15T10:30:00Z"
};

const twitterUser = {
  screen_name: "alice",
  displayName: "Alice Smith",
  profileImageUrl: "https://twitter.com/avatars/alice",
  url: "https://twitter.com/alice",
  createdAt: 1579084200000
};

// Schema for normalizing to common format
const userSchema = {
  username: "login",  // For GitHub
  // username: "screen_name",  // For Twitter
  displayName: "name",
  avatar: "avatar_url",
  profileUrl: "html_url",
  createdAt: {
    from: "created_at",
    transform: (val) => new Date(val)
  }
};

const normalizedGithub = ApiNormalizer.normalize(githubUser, userSchema);
console.log(normalizedGithub);
// { username: "alice", displayName: "Alice Smith", avatar: "...", ... }
```

## Summary

JSON is a fundamental technology for modern web development. This guide covered:

1. **JSON Basics**: Syntax rules, supported data types, and differences from JavaScript objects
2. **Parsing**: Using `JSON.parse()` with revivers for custom deserialization
3. **Serialization**: Using `JSON.stringify()` with replacers and formatting options
4. **Advanced Techniques**: Deep cloning, custom serialization, schema validation, and object merging
5. **API Integration**: Fetching and sending JSON data with proper error handling
6. **Common Pitfalls**: Handling dates, large numbers, circular references, and undefined values
7. **Performance**: Optimization techniques, caching, and lazy parsing
8. **Security**: Input validation, output sanitization, and preventing injection attacks
9. **Real-World Examples**: Configuration management, local storage, data transformation, and API normalization

Key takeaways:

- Always use `try-catch` when parsing JSON from external sources
- Be aware of type limitations (Date, BigInt, undefined, functions)
- Use the replacer and reviver functions for custom serialization logic
- Validate and sanitize JSON input, especially from untrusted sources
- Consider performance implications with large JSON payloads
- Use strict equality (`===`) and proper type checking when working with parsed JSON

## References

- [MDN Web Docs - JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)
- [JSON.org](https://www.json.org/)
- [ECMA-404 JSON Standard](https://www.ecma-international.org/publications-and-standards/standards/ecma-404/)
- [RFC 8259 - The JSON Data Interchange Format](https://datatracker.ietf.org/doc/html/rfc8259)
