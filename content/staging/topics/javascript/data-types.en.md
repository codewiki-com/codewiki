---
title: JavaScript Data Types and Type Coercion
description: Comprehensive guide to JavaScript's primitive and object types, including automatic type conversion, implicit coercion rules, and best practices
track: javascript
section: functions-scope
difficulty: beginner
tags:
  - data types
  - type coercion
  - primitives
  - type conversion
  - equality
status: imported
origin: old/src/content/docs/javascript/data-types.en.md
divergence: 0.127
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 5
  lastUpdated: 2026-01-07
---

JavaScript's type system is one of the most unique and often misunderstood aspects of the language. Unlike statically-typed languages, JavaScript is dynamically typed, meaning variables can hold any type of value and can change types at runtime. However, this flexibility comes with complexity, particularly around type coercion—the automatic conversion of values from one type to another. This comprehensive guide explores JavaScript's data types, how type coercion works, and best practices for writing robust code that handles types correctly.

---

## Concept Explanation

### What Are Data Types?

Data types represent the kind of value that a variable holds. They determine:
- How much memory is allocated for the value
- What operations can be performed on the value
- How the value behaves in different contexts

### JavaScript's Type System

JavaScript has two main categories of types:

**Primitive Types** (immutable, stored by value):
- `undefined`
- `null`
- `boolean`
- `number`
- `string`
- `symbol` (ES6+)
- `bigint` (ES2020+)

**Object Types** (mutable, stored by reference):
- Objects (including arrays, functions, dates, etc.)

### What Is Type Coercion?

Type coercion is the automatic conversion of a value from one type to another. JavaScript performs this conversion in situations where operations or comparisons involve different types. There are two forms:

- **Implicit Coercion**: Automatically performed by JavaScript during operations
- **Explicit Coercion**: Deliberately converting types using methods like `String()`, `Number()`, or `Boolean()`

---

## Core Principles

### Dynamic Typing

JavaScript variables don't have a fixed type. A variable can be any type and can change types during execution:

```javascript
let value = 42;           // number
value = "hello";          // string
value = true;             // boolean
value = { name: "John" }; // object
```

### Type Coercion Rules

JavaScript follows specific rules when coercing values. The coercion behavior depends on:
- The operator being used (`+`, `==`, `===`, etc.)
- The types of operands
- The context of the operation

### Strict Equality vs. Loose Equality

- **Strict Equality (`===`)**: No type coercion; both type and value must match
- **Loose Equality (`==`)**: Allows type coercion; attempts to convert operands to the same type

### Truthy and Falsy Values

Every value in JavaScript can be evaluated in a boolean context:

**Falsy values** (convert to `false`):
- `false`
- `0` (and `-0`)
- `0n` (BigInt zero)
- `""` (empty string)
- `null`
- `undefined`
- `NaN`

**Truthy values** (convert to `true`):
- Everything else, including:
  - Non-zero numbers
  - Non-empty strings
  - Objects (including empty arrays and objects)
  - Functions

### Abstract Equality Algorithm

When using `==`, JavaScript follows the Abstract Equality Algorithm:
1. If types are the same, use strict comparison
2. If one value is `null` and the other is `undefined`, return `true`
3. If types are different, attempt to coerce:
   - Number vs. String: Convert string to number
   - Boolean: Convert to number first
   - Object vs. Primitive: Call `valueOf()` or `toString()`

### The Type Coercion Chain

Different operations trigger different coercion behaviors:
- **Arithmetic operators** (`+`, `-`, `*`, `/`): Convert to numbers
- **String concatenation** (`+` with a string): Convert to strings
- **Comparison operators** (`<`, `>`, `<=`, `>=`): Convert to numbers
- **Logical operators** (`&&`, `||`, `!`): Convert to booleans

---

## Key Points

### Primitive Types

1. **Undefined**: Represents the absence of a value or uninitialized variables
2. **Null**: Represents intentional absence of value (must be explicitly assigned)
3. **Boolean**: True or false values for logical operations
4. **Number**: Includes integers, floats, Infinity, -Infinity, and NaN
5. **String**: Immutable sequences of characters (16-bit UTF-16 code units)
6. **Symbol**: Unique and immutable identifier (ES6+)
7. **BigInt**: Arbitrary precision integers (ES2020+)

### Object Types

1. **Plain Objects**: Key-value pairs
2. **Arrays**: Ordered collections with numeric indices
3. **Functions**: Callable objects with code execution
4. **Built-in Objects**: Date, RegExp, Error, Map, Set, etc.

### Important Distinctions

- **`typeof undefined`** → `"undefined"`
- **`typeof null`** → `"object"` (historical bug, but correct behavior expected)
- **`typeof []`** → `"object"` (arrays are objects)
- **`typeof {}`** → `"object"`
- **`typeof function() {}`** → `"function"`
- **`NaN === NaN`** → `false` (use `Number.isNaN()` instead)
- **`null == undefined`** → `true`, but `null === undefined` → `false`

### The Addition Operator's Special Behavior

The `+` operator has unique coercion rules:
- If either operand is a string, both operands convert to strings and concatenate
- If both operands are numbers (or convert to numbers), they add numerically
- Objects are converted using `valueOf()` first, then `toString()` if needed

---

## Code Examples

### Example 1: Understanding Type Coercion in Operations

```javascript
// Arithmetic operations coerce to numbers
console.log("5" - "2");        // 3 (string subtraction converts to numbers)
console.log("5" * "2");        // 10
console.log("5" / "2");        // 2.5
console.log("hello" - 5);      // NaN (non-numeric string can't convert)

// String concatenation
console.log("5" + 2);          // "52" (both convert to strings)
console.log(2 + "5");          // "25"
console.log("5" + 2 + 3);      // "523" (left-to-right evaluation)
console.log(2 + 3 + "5");      // "55" (2 + 3 = 5, then "5" + "5" = "55")

// Boolean coercion
console.log(+"true");          // NaN (not a number)
console.log(+true);            // 1
console.log(+false);           // 0
console.log(!"hello");         // false
console.log(!!"hello");        // true (double negation for boolean)
```

### Example 2: Equality Comparisons

```javascript
// Loose equality (==) with coercion
console.log(0 == false);          // true (false coerces to 0)
console.log("0" == false);        // true ("0" → 0, false → 0)
console.log("" == 0);             // true ("" → 0, 0 == 0)
console.log(null == undefined);   // true (special case)
console.log(null == 0);           // false (null only equals null/undefined)
console.log(undefined == 0);      // false

// Strict equality (===) without coercion
console.log(0 === false);         // false (different types)
console.log("0" === 0);           // false (different types)
console.log(null === undefined);  // false (different types)
console.log(NaN === NaN);         // false (NaN never equals anything, including itself)

// Correct NaN checking
console.log(Number.isNaN(NaN));   // true
console.log(Object.is(NaN, NaN)); // true
```

### Example 3: Explicit Type Conversion

```javascript
// String conversion
String(123);              // "123"
String(true);             // "true"
String(null);             // "null"
String(undefined);        // "undefined"
(123).toString();         // "123"
123 + "";                 // "123" (implicit)

// Number conversion
Number("123");            // 123
Number("123.45");         // 123.45
Number("123abc");         // NaN (invalid format)
Number(true);             // 1
Number(false);            // 0
Number(null);             // 0
Number(undefined);        // NaN
parseInt("123");          // 123
parseFloat("123.45");     // 123.45
+"123";                   // 123 (unary plus operator)

// Boolean conversion
Boolean(1);               // true
Boolean(0);               // false
Boolean("");              // false
Boolean("hello");         // true
Boolean(null);            // false
Boolean(undefined);       // false
Boolean([]);              // true (objects are truthy)
Boolean({});              // true (objects are truthy)
!!1;                      // true (double negation)
```

### Example 4: Object to Primitive Coercion

```javascript
// Objects use valueOf() and toString() for coercion
const obj = {
  valueOf() {
    console.log("valueOf called");
    return 42;
  },
  toString() {
    console.log("toString called");
    return "[object Custom]";
  }
};

// Numeric context: valueOf() is tried first
console.log(obj + 0);     // "valueOf called", then "toString called", result: "42[object Custom]"
console.log(obj - 0);     // "valueOf called", result: 42
console.log(obj * 1);     // "valueOf called", result: 42

// String context: toString() is tried first
console.log("Value: " + obj);  // "toString called", result: "Value: [object Custom]"

// Arrays have special coercion behavior
console.log([1, 2, 3] + 0);       // "1,2,30" (array toString = "1,2,3")
console.log([] + []);             // "" (empty arrays convert to empty strings)
console.log([] + {});             // "[object Object]"
```

### Example 5: Truthy and Falsy Values in Control Flow

```javascript
// Falsy values
if (!0) console.log("0 is falsy");
if (!"") console.log("empty string is falsy");
if (!null) console.log("null is falsy");
if (!undefined) console.log("undefined is falsy");
if (!NaN) console.log("NaN is falsy");
if (!false) console.log("false is falsy");

// Truthy values
if (1) console.log("1 is truthy");
if ("hello") console.log("non-empty string is truthy");
if ([]) console.log("array is truthy");
if ({}) console.log("object is truthy");
if (function() {}) console.log("function is truthy");

// Practical uses of truthiness
const name = getUserName();
if (name) {  // Uses truthiness to check for value
  console.log(`Hello, ${name}`);
}

// Default values using || (OR operator)
const count = userCount || 0;  // Use 0 if userCount is falsy

// Default values using ?? (nullish coalescing, ES2020+)
const value = userValue ?? "default";  // Only uses default if undefined or null
```

### Example 6: Common Coercion Scenarios

```javascript
// Unary plus for numeric conversion
const str = "42";
const num = +str;  // 42
console.log(typeof num);  // "number"

// Template literals (no coercion needed, automatic stringification)
const count = 5;
console.log(`Count: ${count}`);  // "Count: 5"

// Logical operators and short-circuit evaluation
const user = getCurrentUser() || getGuestUser();  // Returns first truthy value
const valid = isValid && processData();           // Processes only if isValid is truthy

// Comparison operations with coercion
console.log(2 > "1");   // true ("1" coerces to 1)
console.log("apple" < "banana");  // true (lexicographic comparison)
console.log([] > []);   // false (arrays convert to empty strings, "" == "")

// Type conversion in array methods
const numbers = ["1", "2", "3"].map(Number);  // [1, 2, 3]
const nums = ["1", "2", "3"].map(x => +x);   // [1, 2, 3]
```

### Example 7: Advanced Coercion Scenarios

```javascript
// Symbol.toPrimitive for custom coercion behavior
const customObj = {
  value: 42,
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.value;
    if (hint === "string") return `CustomObj: ${this.value}`;
    return true;
  }
};

console.log(customObj + 0);  // 42 (numeric context)
console.log(customObj + "");  // "CustomObj: 42" (string context)
console.log(customObj == true);  // false (uses default hint)

// Array coercion edge cases
console.log([].toString());        // ""
console.log([1].toString());       // "1"
console.log([1, 2, 3].toString()); // "1,2,3"
console.log(["a"].toString());     // "a"

// NaN edge cases
const result = parseInt("hello");  // NaN
console.log(isNaN(result));        // true
console.log(Number.isNaN(result)); // true
console.log(result == NaN);        // false (never true)
console.log(result === NaN);       // false (never true)
```

---

## Best Practices

### Use Strict Equality by Default

Always use `===` and `!==` instead of `==` and `!=` to avoid unexpected coercion:

```javascript
// Avoid
if (value == 0) { }

// Prefer
if (value === 0) { }
```

### Explicitly Convert Types When Needed

Make type conversions explicit and obvious:

```javascript
// Avoid implicit coercion
const count = "5" - 0;  // Unclear intent

// Prefer explicit conversion
const count = Number("5");
const count = parseInt("5", 10);
```

### Use the Nullish Coalescing Operator

For default values, prefer `??` over `||` when you want to distinguish between falsy values:

```javascript
// Using ||: treats all falsy values as missing
const name = userInput || "Guest";  // "Guest" if userInput is "", 0, false, etc.

// Using ??: only treats null/undefined as missing
const name = userInput ?? "Guest";  // Preserves "", 0, false
```

### Check for NaN Correctly

Never use `===` or `==` to check for NaN:

```javascript
// Avoid
if (value === NaN) { }  // Always false

// Correct
if (Number.isNaN(value)) { }
if (Object.is(value, NaN)) { }
```

### Be Explicit About Boolean Context

```javascript
// Less clear
if (items.length) { }

// More explicit
if (items.length > 0) { }

// For boolean values, be explicit
if (isValid === true) { }
// Or accept truthiness when appropriate
if (isValid) { }
```

### Use Number Parsing Functions Correctly

```javascript
// parseInt with radix
parseInt("FF", 16);    // 255 (hexadecimal)
parseInt("101", 2);    // 5 (binary)
parseInt("10", 10);    // 10 (decimal, radix is required)

// parseFloat for decimals
parseFloat("3.14");    // 3.14

// Number() for strict conversion
Number("3.14");        // 3.14
Number("0xFF");        // 255 (understands hex)
```

### Document Type Expectations

Use JSDoc or TypeScript to make type expectations clear:

```javascript
/**
 * Calculates total price
 * @param {number} basePrice - The base price in dollars
 * @param {number} taxRate - The tax rate as decimal (0.1 for 10%)
 * @returns {number} The total price including tax
 */
function calculateTotal(basePrice, taxRate) {
  return basePrice * (1 + taxRate);
}

// Or with TypeScript
function calculateTotal(basePrice: number, taxRate: number): number {
  return basePrice * (1 + taxRate);
}
```

### Use Type Guards

Validate types before operations:

```javascript
function processValue(value) {
  // Type guard
  if (typeof value !== "number") {
    throw new TypeError("Expected a number");
  }
  return value * 2;
}

// For objects
function processObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    throw new TypeError("Expected an object");
  }
  return obj;
}

// For arrays
if (Array.isArray(value)) {
  // Process as array
}
```

### Handle Edge Cases

Be aware of JavaScript's quirks:

```javascript
// Check for valid numbers
if (Number.isFinite(value)) {
  // value is a valid number
}

// Check for integer
if (Number.isInteger(value)) {
  // value is an integer
}

// Safe string to number conversion
function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}
```

### Use Modern Features

Prefer newer approaches to type handling:

```javascript
// BigInt for large integers
const bigNum = 123456789012345678901234567890n;

// Optional chaining to avoid errors
const city = user?.address?.city;  // Returns undefined if any step is null/undefined

// Nullish coalescing
const value = config?.timeout ?? 5000;  // Default 5000 if timeout is null/undefined
```

---

## Common Pitfalls

### Pitfall 1: The "Loose Equality Trap"

```javascript
// Problematic code
if (user.age == "18") {  // Coerces "18" to 18
  // Problem: also matches user.age == 18, user.age == true, etc.
}

// Fixed code
if (user.age === 18) {
  // Only matches if age is actually the number 18
}
```

### Pitfall 2: String Concatenation with Numbers

```javascript
// Easy mistake
const total = 10 + 20 + "30";  // "3030" - not 60!

// Correct approach
const total = 10 + 20;
const message = `Total: ${total}`;  // "Total: 30"
```

### Pitfall 3: Array to String Coercion

```javascript
// Unexpected behavior
console.log([1, 2, 3] == "1,2,3");  // true!
console.log([] == "");              // true!
console.log([0] == false);          // true!

// These shouldn't happen in well-written code
console.log([1, 2, 3] === "1,2,3"); // false (correct with ===)
```

### Pitfall 4: parseInt Without Radix

```javascript
// Problematic - can have unexpected behavior
parseInt("08");      // 0 (in some older browsers, treated as octal!)
parseInt("10");      // 10 (numeric string)

// Always specify radix
parseInt("08", 10);  // 8
parseInt("10", 10);  // 10
parseInt("10", 2);   // 2 (binary)
```

### Pitfall 5: Null/Undefined Confusion

```javascript
// Easy confusion
typeof null;           // "object" (historical bug)
typeof undefined;      // "undefined"
null == undefined;     // true
null === undefined;    // false

// Safe checking
if (value == null) {   // Checks for both null and undefined
  // value is null or undefined
}

if (value === null) {  // Only null
}
if (value === undefined) {  // Only undefined
}
```

### Pitfall 6: NaN Checking

```javascript
// Wrong ways to check NaN
if (value === NaN) { }      // Always false
if (value == NaN) { }       // Always false
if (!isNaN(value)) { }      // Coerces to number first!

// isNaN("hello") returns true because "hello" coerces to NaN

// Correct way
if (Number.isNaN(value)) { }      // Only true if value is actually NaN
if (Object.is(value, NaN)) { }   // Alternative approach
```

### Pitfall 7: Falsy Value Assumptions

```javascript
// Function with no input
function handleInput(input) {
  if (input) {  // All falsy values pass through
    // Treats "", 0, false, null, undefined as "no input"
  }
}

// More precise
function handleInput(input) {
  if (input !== undefined && input !== null) {
    // Handles empty strings, 0, false correctly
  }
}

// Or with nullish coalescing
function handleInput(input = "default") {
  // input uses "default" only if it's null or undefined
}
```

### Pitfall 8: typeof Limitations

```javascript
// typeof has quirks
typeof [];              // "object" (not "array")
typeof null;            // "object" (not "null")
typeof undefined;       // "undefined"

// Better type checking
Array.isArray(value);          // true/false
value instanceof Date;         // true/false
value === null;                // true/false
typeof value === "function";   // true/false
```

### Pitfall 9: Order of Operations with Type Coercion

```javascript
// The order matters!
"5" + 2 + 3;     // "523" (string concat happens first)
5 + 2 + "3";     // "73" (5 + 2 = 7, then concat "3")
"5" + (2 + 3);   // "55" (parentheses force number addition first)
("5" + 2) + 3;   // "523" (explicit left-to-right)
```

### Pitfall 10: Object Comparison Always Compares by Reference

```javascript
// Different object instances are never equal, even with same content
{} === {};                          // false
{a: 1} === {a: 1};                 // false
[1, 2, 3] === [1, 2, 3];           // false

// Same reference
const obj = {a: 1};
obj === obj;                        // true

// Always use structural comparison for objects
JSON.stringify({a: 1}) === JSON.stringify({a: 1});  // true (but limited)
```

---

## Performance Considerations

### Type Coercion Performance

Type coercion has a performance cost. Avoid unnecessary conversions:

```javascript
// Less efficient (coercion happens at runtime)
if (userInput == 10) { }           // Converts userInput to number

// More efficient (no coercion needed)
if (parseInt(userInput, 10) === 10) { }  // Explicit conversion
```

### Numeric Operations on Arrays

Converting array strings to numbers efficiently:

```javascript
// Less efficient (multiple function calls)
[1, 2, 3].map(x => Number(x));

// More efficient (unary plus)
[1, 2, 3].map(x => +x);

// Most efficient (if already numbers)
["1", "2", "3"].map(Number);
```

### String Concatenation vs. Template Literals

Modern engines optimize both similarly, but use what's most readable:

```javascript
// Both have similar performance in modern engines
const str1 = a + b + c;
const str2 = `${a}${b}${c}`;

// However, for many concatenations, template literals can be more efficient
const result = `${a}${b}${c}${d}${e}`;
```

### Caching Type Checks

For repeated type checks in loops, consider caching:

```javascript
// If checking same type many times
const isArray = Array.isArray(data);
for (let i = 0; i < items.length; i++) {
  if (isArray) {
    // Process array item
  }
}
```

### Comparison Operations

Strict equality is slightly faster than loose equality:

```javascript
// Very marginally faster
if (value === 10) { }  // No coercion needed

// Slightly slower
if (value == 10) { }   // May require coercion
```

### Object to Primitive Conversion Overhead

Avoid custom coercion methods if called frequently:

```javascript
// Every comparison triggers custom coercion
for (const item of largeArray) {
  if (item == customObj) { }  // Calls Symbol.toPrimitive or valueOf
}

// Cache the value instead
const objValue = customObj.valueOf();
for (const item of largeArray) {
  if (item == objValue) { }  // Direct comparison
}
```

---

## Real-world Scenarios

### Scenario 1: Form Input Validation

```javascript
// Problem: Form inputs are always strings
function submitForm(data) {
  const age = data.age;  // "25" (string from input)

  // Wrong
  if (age >= 18) { }    // Works but relies on coercion

  // Better
  const parsedAge = parseInt(data.age, 10);
  if (!Number.isInteger(parsedAge) || parsedAge < 0) {
    throw new Error("Invalid age");
  }
  if (parsedAge >= 18) { }
}

// Complete solution
function validateAge(ageString) {
  const age = Number(ageString);

  // Validate: is it a valid number?
  if (!Number.isFinite(age)) return { valid: false, error: "Not a number" };

  // Validate: is it an integer?
  if (!Number.isInteger(age)) return { valid: false, error: "Must be whole number" };

  // Validate: is it in valid range?
  if (age < 0 || age > 150) return { valid: false, error: "Age out of range" };

  return { valid: true, value: age };
}
```

### Scenario 2: API Response Handling

```javascript
// API returns mixed types
function processApiResponse(response) {
  // Status might be number or string
  const statusCode = Number(response.status);
  if (!Number.isFinite(statusCode)) {
    console.error("Invalid status code");
    return null;
  }

  // Count might be string or number
  const itemCount = parseInt(response.itemCount, 10) || 0;

  // Parse boolean string from API
  const isActive = response.isActive === "true" || response.isActive === true;

  return { statusCode, itemCount, isActive };
}
```

### Scenario 3: Configuration with Defaults

```javascript
// Handling configuration with various input types
class AppConfig {
  constructor(config = {}) {
    // Timeout: allow number, string, or undefined
    this.timeout = this._parseTimeout(config.timeout);

    // Debug: allow boolean or truthy/falsy
    this.debug = Boolean(config.debug);

    // Retries: allow number, string, or use default
    this.retries = this._parseRetries(config.retries);
  }

  _parseTimeout(value) {
    const timeout = Number(value);
    return Number.isFinite(timeout) && timeout > 0 ? timeout : 5000;
  }

  _parseRetries(value) {
    const retries = Number(value);
    return Number.isInteger(retries) && retries >= 0 ? retries : 3;
  }
}

const config = new AppConfig({ timeout: "10000", debug: 1, retries: "5" });
```

### Scenario 4: Data Transformation Pipeline

```javascript
// Processing data with different formats
function transformUserData(rawData) {
  return {
    // String fields
    name: String(rawData.name || "").trim(),
    email: String(rawData.email || "").toLowerCase(),

    // Numeric fields
    age: Number(rawData.age) || null,
    salary: Number(rawData.salary) || 0,

    // Boolean fields
    isActive: Boolean(rawData.isActive),
    isPremium: rawData.isPremium === "yes" || rawData.isPremium === true,

    // Array fields
    tags: Array.isArray(rawData.tags) ? rawData.tags :
          (typeof rawData.tags === "string" ? rawData.tags.split(",") : []),

    // Date fields
    joinDate: rawData.joinDate instanceof Date ?
              rawData.joinDate :
              new Date(rawData.joinDate)
  };
}
```

### Scenario 5: Flexible Function Parameters

```javascript
// Function that accepts various input types
function drawChart(data, options = {}) {
  // Width: allow number or percentage string
  const width = typeof options.width === "string"
    ? parseFloat(options.width)
    : Number(options.width);

  // Height: similar handling
  const height = typeof options.height === "string"
    ? parseFloat(options.height)
    : Number(options.height);

  // Title: coerce to string
  const title = String(options.title || "Chart");

  // Show legend: boolean or truthy/falsy
  const showLegend = options.showLegend !== false;  // defaults to true

  return {
    data,
    width: Number.isFinite(width) ? width : 800,
    height: Number.isFinite(height) ? height : 600,
    title,
    showLegend
  };
}
```

### Scenario 6: Handling Middleware Data

```javascript
// Middleware often receives mixed types
function formatLogger(req, res, next) {
  // Status code from res.statusCode (number)
  const status = res.statusCode;

  // Response time from header (might be string)
  const duration = Number(res.get("X-Response-Time")) || 0;

  // Request size (string or number)
  const size = Number(req.get("content-length")) || 0;

  // Is error (boolean check)
  const isError = status >= 400;

  const log = {
    status,
    duration: `${duration}ms`,
    size: `${size} bytes`,
    error: isError
  };

  console.log(log);
  next();
}
```

---

## Interview Points

### Question 1: What is the difference between `==` and `===`?

**Answer:**
- `===` (strict equality): Compares both value and type without coercion
- `==` (loose equality): Coerces operands to the same type before comparing

Example:
```javascript
0 == false;    // true (false coerces to 0)
0 === false;   // false (different types)
```

Best practice: Use `===` by default.

### Question 2: What are falsy and truthy values?

**Answer:**
Falsy values (convert to `false` in boolean context): `false`, `0`, `""`, `null`, `undefined`, `NaN`

Truthy values (convert to `true` in boolean context): Everything else, including `[]`, `{}`, `"0"`, `function() {}`

Example:
```javascript
if ("0") { }  // true - string "0" is truthy!
if (0) { }    // false - number 0 is falsy
```

### Question 3: What is type coercion and how does it work?

**Answer:**
Type coercion is JavaScript's automatic conversion of values from one type to another. It happens when:
- Using operators that expect specific types
- Comparing values of different types (with `==`)
- Using values in boolean context (if statements, logical operators)

The conversion follows specific rules based on the operator and context.

### Question 4: Explain what `NaN` is and how to check for it correctly.

**Answer:**
`NaN` (Not-a-Number) is a special value that represents an undefined or unrepresentable numerical result. Importantly, `NaN === NaN` returns `false`.

Correct ways to check for NaN:
```javascript
Number.isNaN(value);    // Best - only true if value is literally NaN
isNaN(value);           // Converts to number first (may give unexpected results)
Object.is(value, NaN);  // Also works
```

### Question 5: What happens when you add a number and string?

**Answer:**
When the `+` operator encounters a string, it performs string concatenation rather than addition. Both operands are converted to strings.

```javascript
5 + 2 + "3";      // "73" (5 + 2 = 7, then "7" + "3" = "73")
"5" + 2 + 3;      // "523" (all concatenated)
5 + 2 + 3;        // 10 (all addition)
```

This is one of the most common source of bugs in JavaScript.

### Question 6: How does `Object.is()` differ from `===`?

**Answer:**
`Object.is()` is similar to `===` but handles two edge cases differently:

```javascript
Object.is(NaN, NaN);      // true (unlike ===)
Object.is(+0, -0);        // false (unlike ===, which returns true)
Object.is(5, 5);          // true (same as ===)
```

### Question 7: What is the purpose of `Symbol.toPrimitive`?

**Answer:**
`Symbol.toPrimitive` allows you to customize how an object is converted to a primitive value. It receives a "hint" parameter:
- `"number"`: Numeric conversion
- `"string"`: String conversion
- `"default"`: Default conversion (usually numeric)

```javascript
const obj = {
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return 42;
    if (hint === "string") return "custom";
    return true;
  }
};
```

### Question 8: What's the difference between `null` and `undefined`?

**Answer:**
- `undefined`: Represents an uninitialized variable or function with no return value
- `null`: Represents intentional absence of value, must be explicitly assigned

```javascript
let x;
console.log(x);        // undefined
typeof undefined;      // "undefined"
typeof null;           // "object" (historical bug)
null == undefined;     // true (special case)
null === undefined;    // false
```

### Question 9: How would you safely parse a number from user input?

**Answer:**
```javascript
function safeParseNumber(input) {
  const num = Number(input);

  // Check if result is a valid number
  if (!Number.isFinite(num)) {
    return null;  // or throw error, or return default
  }

  return num;
}

// Or with validation
function parseAge(input) {
  const num = parseInt(input, 10);
  if (!Number.isInteger(num) || num < 0 || num > 150) {
    throw new Error("Invalid age");
  }
  return num;
}
```

### Question 10: What's wrong with this code and how would you fix it?

**Problem Code:**
```javascript
const values = ["1", "2", "3"];
const total = values.reduce((sum, val) => sum + val, 0);
console.log(total);  // "0123" (string concatenation!)
```

**Fixed Code:**
```javascript
const values = ["1", "2", "3"];
const total = values.reduce((sum, val) => sum + Number(val), 0);
console.log(total);  // 6 (correct numeric sum)

// Or convert upfront
const values = ["1", "2", "3"].map(Number);
const total = values.reduce((sum, val) => sum + val, 0);
```

---

## Further Reading

### Official Documentation
- [MDN: JavaScript Data Types and Structures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures)
- [MDN: Type Coercion](https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion)
- [MDN: Equality Comparisons and Sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)
- [ECMAScript Specification](https://tc39.es/ecma262/)

### Related Topics
- **Type Checking**: TypeScript, JSDoc type annotations
- **Error Handling**: Understanding errors from type mismatches
- **Operator Overloading**: Custom coercion with Symbol.toPrimitive
- **Strict Mode**: Enforces stricter parsing and error checking

### Books and Articles
- "You Don't Know JS" by Kyle Simpson - Type & Grammar
- "Eloquent JavaScript" by Marijn Haverbeke
- "JavaScript: The Good Parts" by Douglas Crockford

### Tools and Linters
- **ESLint**: Use rules like `eqeqeq` (enforce ===) and `no-implicit-coercion`
- **TypeScript**: Static typing to prevent many coercion issues
- **JSDoc**: Document expected types explicitly
- **Prettier**: Code formatting for consistency

### Practice Resources
- [JavaScript.info: Type Conversions](https://javascript.info/type-conversions)
- [You Don't Know JS Repository](https://github.com/getify/You-Dont-Know-JS)
- [Exercism: JavaScript Track](https://exercism.org/tracks/javascript)

---

## Summary

JavaScript's dynamic type system and automatic type coercion are powerful features that enable flexible code, but they require careful understanding to avoid bugs. Key takeaways:

1. **Use strict equality (`===`)** by default to avoid unexpected coercion
2. **Understand truthy and falsy values** to write clear conditional logic
3. **Be explicit about type conversions** when necessary
4. **Know the special cases** like NaN, null, and undefined
5. **Validate external input** thoroughly before processing
6. **Use modern features** like nullish coalescing and optional chaining
7. **Leverage tools** like TypeScript and ESLint for type safety

By mastering JavaScript's type system, you'll write more robust, maintainable code and avoid hours of debugging confusing type-related bugs.
