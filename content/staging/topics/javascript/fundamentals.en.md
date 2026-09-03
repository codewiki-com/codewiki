---
title: JavaScript Fundamentals
description: Complete guide to JavaScript fundamentals including variables, data types, operators and basic syntax
track: javascript
section: core
difficulty: beginner
tags:
  - JavaScript
  - fundamentals
  - basics
  - syntax
status: imported
origin: old/src/content/docs/javascript/fundamentals.en.md
divergence: 0.223
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Basics
  order: 1
  lastUpdated: 2026-01-07
---

JavaScript is one of the most popular programming languages today, widely used in web development, server-side programming, mobile app development, and beyond. This comprehensive guide covers the core fundamentals of JavaScript, including variable declarations, data types, type coercion, operators, and strict mode.

## Variable Declarations

JavaScript provides three ways to declare variables: `var`, `let`, and `const`. Understanding their differences is essential for writing high-quality code.

### var Keyword

`var` is the original way to declare variables in JavaScript, with the following characteristics:

```javascript
// Function scope
function example() {
  var x = 10;
  if (true) {
    var x = 20; // Same variable
    console.log(x); // Output: 20
  }
  console.log(x); // Output: 20
}

// Hoisting
console.log(name); // Output: undefined (no error)
var name = "Alice";

// Can be redeclared
var age = 25;
var age = 30; // No error

// Can be accessed before declaration
function hoistingDemo() {
  console.log(message); // undefined
  var message = "Hello";
  console.log(message); // "Hello"
}
```

**Key characteristics of var:**
- Function-scoped (not block-scoped)
- Variables are hoisted to the top of their function
- Can be redeclared within the same scope
- Can be used before declaration (value will be `undefined`)

### let Keyword

`let` was introduced in ES6 and addresses many issues with `var`:

```javascript
// Block scope
function example() {
  let x = 10;
  if (true) {
    let x = 20; // Different variable
    console.log(x); // Output: 20
  }
  console.log(x); // Output: 10
}

// Temporal Dead Zone (TDZ)
// console.log(name); // ReferenceError
let name = "Bob";

// Cannot be redeclared
let age = 25;
// let age = 30; // SyntaxError: Identifier 'age' has already been declared

// Block scoping in loops
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2 (each iteration has its own 'i')

// Compare with var
for (var j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 100);
}
// Output: 3, 3, 3 (same 'j' for all iterations)
```

**Key characteristics of let:**
- Block-scoped
- Temporal Dead Zone (TDZ) - cannot be accessed before declaration
- Cannot be redeclared in the same scope
- Accessing before declaration throws ReferenceError

### const Keyword

`const` is used to declare constants that must be initialized at declaration:

```javascript
// Declaring constants
const PI = 3.14159;
// PI = 3.14; // TypeError: Assignment to constant variable

// Must be initialized
// const name; // SyntaxError: Missing initializer in const declaration

// For objects and arrays, contents can be modified
const person = { name: "Alice" };
person.name = "Bob"; // This works
console.log(person.name); // Output: "Bob"

// person = {}; // TypeError: Assignment to constant variable

const numbers = [1, 2, 3];
numbers.push(4); // This works
console.log(numbers); // Output: [1, 2, 3, 4]

// numbers = []; // TypeError: Assignment to constant variable

// For truly immutable objects, use Object.freeze()
const frozen = Object.freeze({ value: 42 });
frozen.value = 100; // Silently fails (or throws in strict mode)
console.log(frozen.value); // 42

// Note: Object.freeze is shallow
const nested = Object.freeze({
  outer: { inner: 'value' }
});
nested.outer.inner = 'changed'; // This works!
console.log(nested.outer.inner); // 'changed'
```

**Key characteristics of const:**
- Block-scoped
- Must be initialized at declaration
- Cannot be reassigned
- For reference types, the contents can still be modified

### Best Practices for Variable Declarations

```javascript
// Recommended approach
// 1. Prefer const by default
const API_URL = "https://api.example.com";
const MAX_RETRIES = 3;
const CONFIG = {
  timeout: 5000,
  retries: 3
};

// 2. Use let when reassignment is needed
let counter = 0;
counter++;

let currentUser = null;
currentUser = { name: "Alice" };

// 3. Avoid var in modern JavaScript
// var is only needed for legacy browser support

// 4. Declare variables at the top of their scope
function processData(data) {
  const result = [];
  let index = 0;

  // ... rest of function
}

// 5. Use meaningful variable names
const userAge = 25;           // Good
const a = 25;                 // Bad

const isAuthenticated = true; // Good for booleans
const auth = true;            // Less clear
```

## Data Types

JavaScript data types are divided into two categories: **Primitive Types** and **Reference Types**.

### Primitive Types

JavaScript has 7 primitive data types:

#### Number

```javascript
// Integers and floating-point numbers
let integer = 42;
let float = 3.14;
let negative = -100;
let exponential = 2.5e6; // 2,500,000

// Special numeric values
let infinity = Infinity;
let negInfinity = -Infinity;
let notANumber = NaN;

// Checking special values
console.log(isNaN(NaN));           // true
console.log(isNaN("hello"));       // true (converts to NaN first)
console.log(Number.isNaN(NaN));    // true
console.log(Number.isNaN("hello")); // false (more precise)

console.log(isFinite(100));        // true
console.log(isFinite(Infinity));   // false

// Floating-point precision issues
console.log(0.1 + 0.2);            // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);    // false

// Solutions for precision issues
console.log((0.1 + 0.2).toFixed(1));              // "0.3"
console.log(Math.abs(0.1 + 0.2 - 0.3) < 0.0001); // true
console.log(Number.EPSILON);                      // ~2.22e-16

// Safe integer range
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log(Number.MIN_SAFE_INTEGER); // -9007199254740991
console.log(Number.isSafeInteger(9007199254740991)); // true
console.log(Number.isSafeInteger(9007199254740992)); // false

// Numeric bases
let binary = 0b1010;    // Binary: 10
let octal = 0o12;       // Octal: 10
let hex = 0xA;          // Hexadecimal: 10

// Numeric separators (ES2021)
let billion = 1_000_000_000;
let bytes = 0xFF_FF_FF_FF;
```

#### String

```javascript
// String declarations
let single = 'Single quotes';
let double = "Double quotes";
let template = `Template literal`;

// Template literals (ES6)
let name = "Alice";
let age = 25;
let greeting = `Hello, I'm ${name} and I'm ${age} years old.`;
console.log(greeting); // "Hello, I'm Alice and I'm 25 years old."

// Expression interpolation
let a = 10;
let b = 20;
console.log(`Sum: ${a + b}`); // "Sum: 30"

// Multi-line strings
let multiLine = `
  Line 1
  Line 2
  Line 3
`;

// Common string methods
let str = "Hello, JavaScript!";
console.log(str.length);              // 18
console.log(str.charAt(0));           // "H"
console.log(str[0]);                  // "H"
console.log(str.indexOf("Java"));     // 7
console.log(str.lastIndexOf("a"));    // 10
console.log(str.slice(7, 11));        // "Java"
console.log(str.substring(7, 11));    // "Java"
console.log(str.toUpperCase());       // "HELLO, JAVASCRIPT!"
console.log(str.toLowerCase());       // "hello, javascript!"
console.log(str.split(", "));         // ["Hello", "JavaScript!"]
console.log(str.includes("Script"));  // true
console.log(str.startsWith("Hello")); // true
console.log(str.endsWith("!"));       // true
console.log(str.replace("JavaScript", "World")); // "Hello, World!"
console.log("  trim  ".trim());       // "trim"
console.log("abc".repeat(3));         // "abcabcabc"
console.log("hello".padStart(10, "0")); // "00000hello"
console.log("hello".padEnd(10, "!"));   // "hello!!!!!"

// String search methods
let text = "The quick brown fox";
console.log(text.search(/quick/));    // 4
console.log(text.match(/[aeiou]/g));  // ["e", "u", "i", "o", "o"]

// ES2021 methods
console.log("hello".replaceAll("l", "L")); // "heLLo"
```

#### Boolean

```javascript
let isTrue = true;
let isFalse = false;

// Boolean conversion
// Falsy values - values that convert to false
console.log(Boolean(false));     // false
console.log(Boolean(0));         // false
console.log(Boolean(-0));        // false
console.log(Boolean(""));        // false (empty string)
console.log(Boolean(null));      // false
console.log(Boolean(undefined)); // false
console.log(Boolean(NaN));       // false

// Truthy values - everything else converts to true
console.log(Boolean(1));         // true
console.log(Boolean(-1));        // true
console.log(Boolean("hello"));   // true
console.log(Boolean("0"));       // true (non-empty string)
console.log(Boolean("false"));   // true (non-empty string)
console.log(Boolean([]));        // true (empty array is truthy!)
console.log(Boolean({}));        // true (empty object is truthy!)
console.log(Boolean(function(){})); // true

// Double negation for boolean conversion
console.log(!!"hello"); // true
console.log(!!0);       // false
console.log(!![]);      // true
```

#### null

```javascript
let empty = null;
console.log(typeof empty); // "object" (this is a historical bug in JavaScript)

// Common usage: explicitly represents "nothing" or "empty"
let user = null; // User not logged in
user = { name: "Alice" }; // User logged in

// Checking for null
console.log(empty === null); // true
console.log(empty == null);  // true
console.log(empty == undefined); // true (loose equality)
console.log(empty === undefined); // false (strict equality)

// Null coalescing
let value = null;
let result = value ?? "default";
console.log(result); // "default"
```

#### undefined

```javascript
let notDefined;
console.log(notDefined);        // undefined
console.log(typeof notDefined); // "undefined"

// Common situations where undefined appears

// 1. Variable declared but not assigned
let a;
console.log(a); // undefined

// 2. Accessing non-existent object property
let obj = {};
console.log(obj.name); // undefined

// 3. Function without return statement
function noReturn() {}
console.log(noReturn()); // undefined

// 4. Function parameter not passed
function greet(name) {
  console.log(name); // undefined if not passed
}
greet();

// 5. Array elements not assigned
let arr = [1, , 3];
console.log(arr[1]); // undefined

// Checking for undefined
let value;
console.log(value === undefined); // true
console.log(typeof value === "undefined"); // true (safer for undeclared variables)

// Default parameter values
function sayHello(name = "Guest") {
  console.log(`Hello, ${name}!`);
}
sayHello();        // "Hello, Guest!"
sayHello("Alice"); // "Hello, Alice!"
```

#### Symbol

```javascript
// Creating unique identifiers
let sym1 = Symbol();
let sym2 = Symbol();
console.log(sym1 === sym2); // false (always unique)

// Symbol with description
let sym3 = Symbol("description");
console.log(sym3.description); // "description"
console.log(sym3.toString());  // "Symbol(description)"

// Symbols as object property keys
const ID = Symbol("id");
let user = {
  name: "Alice",
  [ID]: 12345
};

console.log(user[ID]); // 12345
console.log(user.ID);  // undefined (different property)

// Symbols are not enumerable
console.log(Object.keys(user));                  // ["name"]
console.log(Object.getOwnPropertyNames(user));   // ["name"]
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(id)]
console.log(Reflect.ownKeys(user));              // ["name", Symbol(id)]

// Global Symbol registry
let globalSym1 = Symbol.for("shared");
let globalSym2 = Symbol.for("shared");
console.log(globalSym1 === globalSym2); // true

// Get key for global symbol
console.log(Symbol.keyFor(globalSym1)); // "shared"
console.log(Symbol.keyFor(sym1));       // undefined (not in registry)

// Well-known symbols
// Symbol.iterator, Symbol.toStringTag, Symbol.toPrimitive, etc.
```

#### BigInt

```javascript
// For integers larger than Number.MAX_SAFE_INTEGER
let bigNumber = 9007199254740991n;
let anotherBig = BigInt("9007199254740992");
let fromNumber = BigInt(100);

// Arithmetic operations
console.log(bigNumber + 1n);  // 9007199254740992n
console.log(bigNumber * 2n);  // 18014398509481982n
console.log(bigNumber / 3n);  // 3002399751580330n (truncated)
console.log(bigNumber % 3n);  // 1n

// Cannot mix BigInt with regular numbers
// console.log(bigNumber + 1); // TypeError

// Explicit conversion required
console.log(bigNumber + BigInt(1)); // 9007199254740992n
console.log(Number(bigNumber) + 1); // 9007199254740992 (may lose precision)

// Comparison works
console.log(10n > 5);  // true
console.log(10n === 10); // false (different types)
console.log(10n == 10);  // true (type coercion)

// BigInt in conditionals
if (0n) {
  console.log("truthy");
} else {
  console.log("falsy"); // 0n is falsy
}
```

### Reference Types

Reference types store a reference (memory address) to the actual data in heap memory.

#### Object

```javascript
// Object literal
let person = {
  name: "Alice",
  age: 25,
  hobbies: ["reading", "gaming"],
  greet: function() {
    console.log(`Hello, I'm ${this.name}`);
  },
  // Shorthand method syntax
  introduce() {
    console.log(`I'm ${this.age} years old`);
  }
};

// Property access
console.log(person.name);      // "Alice" (dot notation)
console.log(person["age"]);    // 25 (bracket notation)

// Dynamic property access
let prop = "name";
console.log(person[prop]);     // "Alice"

// Adding/modifying properties
person.email = "alice@example.com";
person.age = 26;

// Deleting properties
delete person.email;

// Property existence check
console.log("name" in person);           // true
console.log(person.hasOwnProperty("name")); // true

// Object methods
console.log(Object.keys(person));   // ["name", "age", "hobbies", "greet", "introduce"]
console.log(Object.values(person)); // ["Alice", 26, [...], f, f]
console.log(Object.entries(person)); // [["name", "Alice"], ["age", 26], ...]

// Object destructuring
const { name, age } = person;
console.log(name, age); // "Alice" 26

// Destructuring with renaming
const { name: userName, age: userAge } = person;
console.log(userName, userAge); // "Alice" 26

// Spread operator
let personCopy = { ...person, city: "New York" };

// Object.assign
let merged = Object.assign({}, person, { country: "USA" });

// Computed property names
let key = "dynamicKey";
let obj = {
  [key]: "value",
  [`${key}_2`]: "value2"
};
console.log(obj.dynamicKey); // "value"

// Shorthand property names
let x = 10, y = 20;
let point = { x, y }; // Same as { x: x, y: y }
console.log(point); // { x: 10, y: 20 }
```

#### Array

```javascript
// Array creation
let arr1 = [1, 2, 3, 4, 5];
let arr2 = new Array(5);           // Array with 5 empty slots
let arr3 = Array.from("hello");    // ["h", "e", "l", "l", "o"]
let arr4 = Array.of(1, 2, 3);      // [1, 2, 3]
let arr5 = [...Array(5).keys()];   // [0, 1, 2, 3, 4]

// Array access and modification
let numbers = [1, 2, 3, 4, 5];
console.log(numbers[0]);    // 1
console.log(numbers.at(-1)); // 5 (ES2022)
numbers[0] = 10;

// Adding/removing elements
numbers.push(6);        // Add to end
numbers.pop();          // Remove from end
numbers.unshift(0);     // Add to beginning
numbers.shift();        // Remove from beginning
numbers.splice(2, 1, 10); // Remove 1 element at index 2, insert 10

// Finding elements
console.log(numbers.indexOf(3));        // Index of 3
console.log(numbers.lastIndexOf(3));    // Last index of 3
console.log(numbers.includes(4));       // true/false
console.log(numbers.find(x => x > 3));  // First element > 3
console.log(numbers.findIndex(x => x > 3)); // Index of first element > 3
console.log(numbers.findLast(x => x > 3));  // Last element > 3 (ES2023)

// Iteration methods
numbers.forEach((num, index, array) => {
  console.log(`Index ${index}: ${num}`);
});

// Transformation methods
let doubled = numbers.map(x => x * 2);
let filtered = numbers.filter(x => x > 2);
let sum = numbers.reduce((acc, cur) => acc + cur, 0);
let product = numbers.reduceRight((acc, cur) => acc * cur, 1);

// Testing methods
let hasLarge = numbers.some(x => x > 10);  // true if any element passes
let allPositive = numbers.every(x => x > 0); // true if all elements pass

// Sorting
let sorted = [...numbers].sort((a, b) => a - b); // Ascending
let reversed = [...numbers].reverse();

// Array flattening
let nested = [1, [2, [3, [4]]]];
console.log(nested.flat());    // [1, 2, [3, [4]]]
console.log(nested.flat(2));   // [1, 2, 3, [4]]
console.log(nested.flat(Infinity)); // [1, 2, 3, 4]

// flatMap
let sentences = ["Hello World", "Foo Bar"];
let words = sentences.flatMap(s => s.split(" ")); // ["Hello", "World", "Foo", "Bar"]

// Array destructuring
let [first, second, ...rest] = numbers;
console.log(first, second, rest);

// Checking if array
console.log(Array.isArray(numbers)); // true
console.log(Array.isArray({}));      // false
```

#### Function

```javascript
// Function declaration (hoisted)
function add(a, b) {
  return a + b;
}

// Function expression
const subtract = function(a, b) {
  return a - b;
};

// Arrow function
const multiply = (a, b) => a * b;
const square = x => x * x;        // Single parameter, no parentheses
const getObject = () => ({ x: 1 }); // Return object literal

// Default parameters
function greet(name = "Guest", greeting = "Hello") {
  return `${greeting}, ${name}!`;
}
console.log(greet());                // "Hello, Guest!"
console.log(greet("Alice"));         // "Hello, Alice!"
console.log(greet("Bob", "Hi"));     // "Hi, Bob!"

// Rest parameters
function sum(...numbers) {
  return numbers.reduce((acc, cur) => acc + cur, 0);
}
console.log(sum(1, 2, 3, 4)); // 10

// Spread in function calls
let nums = [1, 2, 3];
console.log(Math.max(...nums)); // 3

// IIFE (Immediately Invoked Function Expression)
(function() {
  console.log("Immediately executed");
})();

// Arrow IIFE
(() => {
  console.log("Arrow IIFE");
})();

// Higher-order functions
function createMultiplier(factor) {
  return function(number) {
    return number * factor;
  };
}
const double = createMultiplier(2);
const triple = createMultiplier(3);
console.log(double(5)); // 10
console.log(triple(5)); // 15

// Function properties
function example() {}
console.log(example.name);   // "example"
console.log(example.length); // 0 (number of expected parameters)
```

### typeof Operator

```javascript
// Type checking with typeof
console.log(typeof 42);           // "number"
console.log(typeof "hello");      // "string"
console.log(typeof true);         // "boolean"
console.log(typeof undefined);    // "undefined"
console.log(typeof null);         // "object" (historical bug)
console.log(typeof Symbol());     // "symbol"
console.log(typeof 123n);         // "bigint"
console.log(typeof {});           // "object"
console.log(typeof []);           // "object"
console.log(typeof function(){}); // "function"

// More accurate type checking
console.log(Array.isArray([]));   // true
console.log(Object.prototype.toString.call(null));      // "[object Null]"
console.log(Object.prototype.toString.call([]));        // "[object Array]"
console.log(Object.prototype.toString.call(new Date())); // "[object Date]"
console.log(Object.prototype.toString.call(/regex/));    // "[object RegExp]"

// Custom type checking function
function getType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}
```

## Type Coercion

JavaScript type conversion is divided into **explicit conversion** and **implicit conversion (type coercion)**.

### Explicit Type Conversion

```javascript
// Converting to String
String(123);        // "123"
String(true);       // "true"
String(false);      // "false"
String(null);       // "null"
String(undefined);  // "undefined"
String([1, 2, 3]);  // "1,2,3"
String({});         // "[object Object]"

(123).toString();   // "123"
(255).toString(16); // "ff" (hexadecimal)
(255).toString(2);  // "11111111" (binary)

// Converting to Number
Number("123");      // 123
Number("123.45");   // 123.45
Number("");         // 0
Number("   ");      // 0
Number("abc");      // NaN
Number("123abc");   // NaN
Number(true);       // 1
Number(false);      // 0
Number(null);       // 0
Number(undefined);  // NaN
Number([]);         // 0
Number([1]);        // 1
Number([1, 2]);     // NaN
Number({});         // NaN

parseInt("123");       // 123
parseInt("123.45");    // 123
parseInt("123abc");    // 123
parseInt("abc123");    // NaN
parseInt("  42  ");    // 42
parseInt("1010", 2);   // 10 (binary to decimal)
parseInt("ff", 16);    // 255 (hex to decimal)

parseFloat("123.45");    // 123.45
parseFloat("123.45.67"); // 123.45
parseFloat("3.14abc");   // 3.14

// Unary plus operator (quick number conversion)
+"123";     // 123
+"123.45";  // 123.45
+"";        // 0
+true;      // 1
+false;     // 0

// Converting to Boolean
Boolean(1);          // true
Boolean(0);          // false
Boolean(-1);         // true
Boolean("");         // false
Boolean("hello");    // true
Boolean("0");        // true (non-empty string!)
Boolean(null);       // false
Boolean(undefined);  // false
Boolean({});         // true
Boolean([]);         // true
```

### Implicit Type Conversion

```javascript
// String concatenation
console.log("Number: " + 123);  // "Number: 123"
console.log("1" + 2);           // "12"
console.log(1 + "2");           // "12"
console.log(1 + 2 + "3");       // "33" (left to right)
console.log("1" + 2 + 3);       // "123"

// Math operations (except +)
console.log("5" - 2);   // 3
console.log("5" * 2);   // 10
console.log("5" / 2);   // 2.5
console.log("5" % 2);   // 1
console.log("5" ** 2);  // 25
console.log("10" - "3"); // 7

// Comparison operations
console.log("5" > 3);    // true (string converted to number)
console.log("10" > "9"); // false (string comparison: "1" < "9")
console.log("10" > 9);   // true (number comparison)

// Logical operations
console.log(!0);        // true
console.log(!1);        // false
console.log(!"");       // true
console.log(!"hello");  // false
console.log(!null);     // true
console.log(!undefined); // true

// Short-circuit evaluation
console.log("hello" && "world"); // "world"
console.log(0 && "world");       // 0
console.log("hello" || "world"); // "hello"
console.log(0 || "world");       // "world"

// Conditional statements
if ("hello") {
  console.log("Non-empty strings are truthy");
}

if (0) {
  console.log("Won't execute");
}
```

### Common Type Coercion Pitfalls

```javascript
// Addition operator behavior
console.log(1 + 2 + "3");   // "33" (1+2=3, then "3"+"3"="33")
console.log("1" + 2 + 3);   // "123"

// null and undefined numeric conversion
console.log(null + 1);      // 1 (null converts to 0)
console.log(undefined + 1); // NaN (undefined converts to NaN)

// Object type conversion
console.log([] + []);       // "" (empty string)
console.log([] + {});       // "[object Object]"
console.log({} + []);       // "[object Object]" or 0 (depends on context)
console.log([1, 2] + [3, 4]); // "1,23,4"

// Array to primitive conversion
console.log([1] + [2]);     // "12"
console.log([1] - [2]);     // -1 (both convert to numbers)

// Equality comparison coercion
console.log(null == undefined);  // true
console.log(null == 0);          // false (special case)
console.log(undefined == 0);     // false (special case)
console.log("" == 0);            // true
console.log("" == false);        // true
console.log([] == false);        // true
console.log([] == 0);            // true
console.log([] == "");           // true
console.log([1] == 1);           // true
console.log([1] == "1");         // true

// Object comparison
console.log({} == "[object Object]"); // true
console.log({} == {});                // false (different references)

// Weird but true
console.log((!+[]+[]+![]).length); // 9 (try to figure it out!)
```

## Operators

### Arithmetic Operators

```javascript
let a = 10;
let b = 3;

console.log(a + b);  // 13 Addition
console.log(a - b);  // 7 Subtraction
console.log(a * b);  // 30 Multiplication
console.log(a / b);  // 3.333... Division
console.log(a % b);  // 1 Modulo (remainder)
console.log(a ** b); // 1000 Exponentiation (ES7)

// Increment and decrement
let c = 5;
console.log(c++);  // 5 (post-increment: return then add)
console.log(c);    // 6
console.log(++c);  // 7 (pre-increment: add then return)

let d = 5;
console.log(d--);  // 5 (post-decrement)
console.log(--d);  // 3 (pre-decrement)

// Unary operators
console.log(+"-5");  // -5 (unary plus converts to number)
console.log(-"5");   // -5 (unary minus)
console.log(-(-5));  // 5
```

### Assignment Operators

```javascript
let x = 10;

x += 5;   // x = x + 5 -> 15
x -= 3;   // x = x - 3 -> 12
x *= 2;   // x = x * 2 -> 24
x /= 4;   // x = x / 4 -> 6
x %= 4;   // x = x % 4 -> 2
x **= 3;  // x = x ** 3 -> 8

// Logical assignment operators (ES2021)
let y = null;
y ||= 10;  // Assign if y is falsy -> 10
y &&= 20;  // Assign if y is truthy -> 20
y ??= 30;  // Assign if y is null/undefined -> 20 (y is already 20)

// Practical example
let config = {};
config.timeout ??= 5000;  // Set default if not defined
console.log(config.timeout); // 5000
```

### Comparison Operators

```javascript
// Relational operators
console.log(5 > 3);   // true
console.log(5 < 3);   // false
console.log(5 >= 5);  // true
console.log(5 <= 4);  // false

// Equality operators
console.log(5 == "5");   // true (loose equality - type coercion)
console.log(5 === "5");  // false (strict equality - no coercion)
console.log(5 != "5");   // false
console.log(5 !== "5");  // true

// Special cases
console.log(NaN === NaN);        // false (NaN is not equal to anything)
console.log(Object.is(NaN, NaN)); // true (more accurate comparison)
console.log(Object.is(+0, -0));   // false
console.log(+0 === -0);           // true

// String comparison (lexicographic)
console.log("apple" < "banana");  // true
console.log("2" > "10");          // true ("2" > "1")
console.log("10" > 9);            // true (number comparison)
```

### Logical Operators

```javascript
// AND operator (&&)
console.log(true && true);    // true
console.log(true && false);   // false
console.log(false && true);   // false
console.log(1 && 2);          // 2 (returns last truthy or first falsy)
console.log(0 && 2);          // 0

// OR operator (||)
console.log(true || false);   // true
console.log(false || true);   // true
console.log(false || false);  // false
console.log(1 || 2);          // 1 (returns first truthy or last falsy)
console.log(0 || 2);          // 2

// NOT operator (!)
console.log(!true);           // false
console.log(!0);              // true
console.log(!!"hello");       // true (double negation converts to boolean)

// Nullish coalescing operator (??) - ES2020
console.log(null ?? "default");      // "default"
console.log(undefined ?? "default"); // "default"
console.log(0 ?? "default");         // 0 (only null/undefined trigger default)
console.log("" ?? "default");        // ""

// Difference between || and ??
console.log(0 || "default");   // "default" (0 is falsy)
console.log(0 ?? "default");   // 0 (0 is not null/undefined)
console.log("" || "default");  // "default" (empty string is falsy)
console.log("" ?? "default");  // ""

// Short-circuit evaluation
let a = false;
let b = true;
console.log(a && expensiveFunction()); // a is false, function not called
console.log(b || expensiveFunction()); // b is true, function not called

function expensiveFunction() {
  console.log("Called!");
  return "result";
}
```

### Conditional (Ternary) Operator

```javascript
let age = 20;
let status = age >= 18 ? "Adult" : "Minor";
console.log(status); // "Adult"

// Nested ternary (use sparingly)
let score = 85;
let grade = score >= 90 ? "A"
          : score >= 80 ? "B"
          : score >= 70 ? "C"
          : score >= 60 ? "D"
          : "F";
console.log(grade); // "B"

// Ternary for assignment
let message = isLoggedIn ? "Welcome back!" : "Please log in";

// Ternary for function calls
isValid ? processData() : showError();
```

### Optional Chaining Operator

```javascript
// Optional chaining (?.) - ES2020
let user = {
  name: "Alice",
  address: {
    city: "New York"
  }
};

// Traditional approach
let city1 = user && user.address && user.address.city;

// With optional chaining
let city2 = user?.address?.city;     // "New York"
let country = user?.address?.country; // undefined (no error)
let zip = user?.location?.zipCode;    // undefined (no error)

// With nullish coalescing
let cityName = user?.address?.city ?? "Unknown";

// Method calls
let result = user.getName?.(); // undefined if method doesn't exist

// Array access
let arr = [1, 2, 3];
console.log(arr?.[0]);   // 1
console.log(arr?.[10]);  // undefined

// Dynamic property access
let prop = "name";
console.log(user?.[prop]); // "Alice"

// Function calls
let callback = undefined;
callback?.(); // No error, returns undefined
```

### Other Operators

```javascript
// Spread operator (...)
let arr1 = [1, 2, 3];
let arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]

let obj1 = { a: 1, b: 2 };
let obj2 = { ...obj1, c: 3 }; // { a: 1, b: 2, c: 3 }

// Comma operator
let x = (1, 2, 3); // x = 3 (returns last value)

// delete operator
let obj = { a: 1, b: 2 };
delete obj.a;
console.log(obj); // { b: 2 }

// in operator
console.log("a" in { a: 1 }); // true
console.log(0 in [1, 2, 3]);  // true (index exists)

// instanceof operator
console.log([] instanceof Array);   // true
console.log({} instanceof Object);  // true
console.log(new Date() instanceof Date); // true
```

## Equality Comparison

Understanding JavaScript's different equality comparisons is essential.

### Loose Equality (==) vs Strict Equality (===)

```javascript
// Loose equality (==) - performs type coercion
console.log(1 == "1");          // true
console.log(true == 1);         // true
console.log(null == undefined); // true
console.log("" == false);       // true
console.log("0" == false);      // true
console.log([] == false);       // true
console.log([] == 0);           // true
console.log([] == "");          // true

// Strict equality (===) - no type coercion
console.log(1 === "1");          // false
console.log(true === 1);         // false
console.log(null === undefined); // false
console.log("" === false);       // false
console.log("0" === false);      // false

// Best practice: Always use strict equality (===)
```

### Object.is() Method

```javascript
// Object.is() provides the most accurate equality comparison
console.log(Object.is(NaN, NaN));   // true
console.log(NaN === NaN);           // false

console.log(Object.is(+0, -0));     // false
console.log(+0 === -0);             // true

console.log(Object.is(5, 5));       // true
console.log(Object.is("hello", "hello")); // true

// Comparison summary
// ===: NaN !== NaN, +0 === -0
// Object.is: NaN is NaN, +0 is not -0
```

### Object Equality

```javascript
// Objects are compared by reference
let obj1 = { name: "Alice" };
let obj2 = { name: "Alice" };
let obj3 = obj1;

console.log(obj1 === obj2); // false (different references)
console.log(obj1 === obj3); // true (same reference)

// Deep equality comparison (custom implementation)
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== "object" || typeof obj2 !== "object"
      || obj1 === null || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

console.log(deepEqual(obj1, obj2)); // true
console.log(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })); // true
console.log(deepEqual({ a: 1 }, { a: 2 })); // false

// Using JSON.stringify (simple but limited)
console.log(JSON.stringify(obj1) === JSON.stringify(obj2)); // true
// Note: This fails for objects with functions, undefined, or circular references
```

## Strict Mode

Strict mode is a way to opt into a restricted variant of JavaScript that eliminates some silent errors and improves performance.

### Enabling Strict Mode

```javascript
// Enable for entire script (must be first statement)
"use strict";

// Enable for a specific function
function strictFunction() {
  "use strict";
  // Strict mode code here
}

// ES6 modules are automatically in strict mode
// Classes are automatically in strict mode
```

### Strict Mode Restrictions

```javascript
"use strict";

// 1. Cannot use undeclared variables
// x = 10; // ReferenceError: x is not defined
let x = 10; // Must declare

// 2. Cannot delete variables, functions, or arguments
let y = 5;
// delete y; // SyntaxError

// 3. Cannot use duplicate parameter names
// function sum(a, a, c) {} // SyntaxError

// 4. Octal literals are not allowed
// let octal = 010; // SyntaxError
let octal = 0o10; // Use 0o prefix instead

// 5. Cannot write to read-only properties
const obj = {};
Object.defineProperty(obj, "x", { value: 42, writable: false });
// obj.x = 9; // TypeError

// 6. Cannot add properties to non-extensible objects
const fixed = Object.preventExtensions({});
// fixed.newProp = "value"; // TypeError

// 7. Cannot delete non-deletable properties
// delete Object.prototype; // TypeError

// 8. Reserved words cannot be used as variable names
// let implements, interface, let, package; // SyntaxError
// let private, protected, public, static, yield; // SyntaxError

// 9. 'this' is undefined in functions called without context
function showThis() {
  "use strict";
  console.log(this); // undefined (not window/global)
}
showThis();

// 10. 'eval' and 'arguments' cannot be assigned
// eval = 5; // SyntaxError
// arguments = []; // SyntaxError

// 11. 'with' statement is not allowed
// with (Math) { x = cos(2); } // SyntaxError

// 12. eval() cannot introduce new variables
eval("var evalVar = 10;");
// console.log(evalVar); // ReferenceError in strict mode
```

### Benefits of Strict Mode

```javascript
"use strict";

// 1. Catches common coding mistakes
// Accidental global variables are caught
function example() {
  // typoVariable = 10; // ReferenceError instead of creating global
}

// 2. Prevents unsafe actions
// Assigning to NaN, Infinity, undefined throws
// NaN = 5; // TypeError

// 3. Makes eval() safer
// Variables declared in eval() stay in eval scope

// 4. Simplifies variable uses
// No need to worry about 'with' statement complications

// 5. Paves the way for future ECMAScript versions
// Reserved words are protected

// 6. Makes debugging easier
// this remains undefined in standalone functions
// Helps identify incorrect method calls
```

## Basic Syntax

### Statements and Expressions

```javascript
// Expression: produces a value
5 + 3                    // Arithmetic expression
"hello" + "world"        // String expression
x = 10                   // Assignment expression
x > 5 ? "yes" : "no"     // Ternary expression
function() {}            // Function expression

// Statement: performs an action
let x = 10;              // Variable declaration statement
if (x > 5) {}            // Conditional statement
for (let i = 0; i < 5; i++) {} // Loop statement
return x;                // Return statement
throw new Error();       // Throw statement
```

### Control Flow

```javascript
// If-else statement
let age = 20;

if (age >= 18) {
  console.log("Adult");
} else if (age >= 13) {
  console.log("Teenager");
} else {
  console.log("Child");
}

// Switch statement
let day = "Monday";

switch (day) {
  case "Monday":
  case "Tuesday":
  case "Wednesday":
  case "Thursday":
  case "Friday":
    console.log("Weekday");
    break;
  case "Saturday":
  case "Sunday":
    console.log("Weekend");
    break;
  default:
    console.log("Invalid day");
}

// For loop
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// For...of loop (iterables)
let arr = [1, 2, 3];
for (let value of arr) {
  console.log(value);
}

// For...in loop (object properties)
let obj = { a: 1, b: 2, c: 3 };
for (let key in obj) {
  console.log(key, obj[key]);
}

// While loop
let count = 0;
while (count < 5) {
  console.log(count);
  count++;
}

// Do-while loop
let num = 0;
do {
  console.log(num);
  num++;
} while (num < 5);

// Break and continue
for (let i = 0; i < 10; i++) {
  if (i === 3) continue; // Skip iteration
  if (i === 7) break;    // Exit loop
  console.log(i);
}

// Labeled statements
outer: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) {
      break outer; // Break out of outer loop
    }
    console.log(i, j);
  }
}
```

### Comments

```javascript
// Single-line comment

/*
 * Multi-line comment
 * Can span multiple lines
 */

/**
 * JSDoc comment for documentation
 * @param {string} name - The name to greet
 * @returns {string} The greeting message
 */
function greet(name) {
  return `Hello, ${name}!`;
}
```

### Error Handling

```javascript
// Try-catch-finally
try {
  // Code that might throw an error
  let result = riskyOperation();
  console.log(result);
} catch (error) {
  // Handle the error
  console.error("An error occurred:", error.message);
} finally {
  // Always executed
  console.log("Cleanup code");
}

// Throwing errors
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}

// Error types
throw new Error("Generic error");
throw new TypeError("Type error");
throw new RangeError("Range error");
throw new ReferenceError("Reference error");
throw new SyntaxError("Syntax error");

// Custom error
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

throw new ValidationError("Invalid input");

// Optional catch binding (ES2019)
try {
  JSON.parse("invalid json");
} catch {
  console.log("JSON parsing failed");
}
```

## Summary

This guide covered the core fundamentals of JavaScript:

1. **Variable Declarations**: Prefer `const` by default, use `let` when reassignment is needed, avoid `var` in modern code
2. **Data Types**: 7 primitive types (Number, String, Boolean, null, undefined, Symbol, BigInt) and reference types (Object, Array, Function, etc.)
3. **Type Coercion**: Understand explicit and implicit type conversions, avoid common pitfalls
4. **Operators**: Master arithmetic, assignment, comparison, logical operators, and modern operators like optional chaining and nullish coalescing
5. **Strict Mode**: Enable strict mode for safer, more predictable code
6. **Basic Syntax**: Understand statements, expressions, control flow, and error handling

Mastering these fundamentals is the first step to becoming a proficient JavaScript developer. Practice using `const`/`let`, strict equality comparisons (`===`), and explicit type conversions to write more robust and maintainable code.

## References

- [MDN Web Docs - JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [ECMAScript Specification](https://tc39.es/ecma262/)
- [JavaScript.info](https://javascript.info/)
