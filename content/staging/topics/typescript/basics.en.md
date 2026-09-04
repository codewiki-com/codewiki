---
title: TypeScript Basic Types
description: "Master TypeScript basic types: primitives, arrays, tuples, enums and type annotations"
track: typescript
section: type-system
difficulty: beginner
tags:
  - TypeScript
  - Types
  - Basics
  - Type Annotations
status: imported
origin: old/src/content/docs/typescript/basics.en.md
divergence: 0.32
issues: []
legacy:
  category: TypeScript
  subcategory: Type System
  order: 1
  lastUpdated: 2026-01-07
---

TypeScript is a statically typed superset of JavaScript that adds optional type annotations to help catch errors during development. Understanding TypeScript's basic types is fundamental to writing type-safe code.

## Primitive Types

TypeScript supports all JavaScript primitive types with explicit type annotations.

### String

The `string` type represents textual data.

```typescript
let firstName: string = "John";
let lastName: string = 'Doe';
let fullName: string = `${firstName} ${lastName}`;

// Template literals are also strings
let greeting: string = `Hello, ${fullName}!`;
```

### Number

The `number` type represents both integer and floating-point numbers.

```typescript
let age: number = 25;
let price: number = 19.99;
let hexValue: number = 0xf00d;
let binaryValue: number = 0b1010;
let octalValue: number = 0o744;
```

### Boolean

The `boolean` type has only two values: `true` and `false`.

```typescript
let isActive: boolean = true;
let hasPermission: boolean = false;
let isValid: boolean = age > 18;
```

### BigInt

The `bigint` type represents integers with arbitrary precision (available in ES2020+).

```typescript
let bigNumber: bigint = 9007199254740991n;
let anotherBig: bigint = BigInt(9007199254740991);
```

### Symbol

The `symbol` type represents unique identifiers.

```typescript
let sym1: symbol = Symbol("key");
let sym2: symbol = Symbol("key");

// Each symbol is unique
console.log(sym1 === sym2); // false
```

## Arrays and Tuples

### Arrays

Arrays can be typed in two ways:

```typescript
// Using type[]
let numbers: number[] = [1, 2, 3, 4, 5];
let names: string[] = ["Alice", "Bob", "Charlie"];

// Using Array<type>
let scores: Array<number> = [85, 90, 78, 92];
let fruits: Array<string> = ["apple", "banana", "orange"];

// Multi-dimensional arrays
let matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];
```

### Tuples

Tuples are arrays with a fixed number of elements where each element can have a different type.

```typescript
// Basic tuple
let person: [string, number] = ["Alice", 30];

// Accessing tuple elements
let name = person[0]; // string
let age = person[1];  // number

// Tuple with optional elements
let optionalTuple: [string, number?] = ["Bob"];

// Tuple with rest elements
let extendedTuple: [string, ...number[]] = ["scores", 85, 90, 78];

// Named tuples (TypeScript 4.0+)
let namedTuple: [name: string, age: number, city: string] = ["Alice", 30, "NYC"];
```

### Readonly Arrays and Tuples

```typescript
let readonlyArray: readonly number[] = [1, 2, 3];
// readonlyArray.push(4); // Error: Property 'push' does not exist

let readonlyTuple: readonly [string, number] = ["Alice", 30];
// readonlyTuple[0] = "Bob"; // Error: Cannot assign to '0'
```

## Enums

Enums allow you to define a set of named constants.

### Numeric Enums

```typescript
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right    // 3
}

let direction: Direction = Direction.Up;
console.log(direction); // 0

// With explicit values
enum Status {
  Active = 1,
  Inactive = 2,
  Pending = 3
}

// Auto-incrementing from a starting value
enum Priority {
  Low = 1,
  Medium,  // 2
  High     // 3
}
```

### String Enums

```typescript
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}

let favoriteColor: Color = Color.Blue;
console.log(favoriteColor); // "BLUE"
```

### Heterogeneous Enums

Enums can mix string and numeric members (though not recommended).

```typescript
enum Mixed {
  No = 0,
  Yes = "YES"
}
```

### Const Enums

Const enums are removed during compilation for better performance.

```typescript
const enum HttpStatus {
  OK = 200,
  BadRequest = 400,
  Unauthorized = 401,
  NotFound = 404
}

let status: HttpStatus = HttpStatus.OK; // Inlined as 200 at compile time
```

## Special Types

### Any

The `any` type disables type checking. Use sparingly as it defeats the purpose of TypeScript.

```typescript
let anything: any = 42;
anything = "hello";
anything = true;
anything = { x: 10 };

// No type checking on any
anything.someMethod(); // No error, but might fail at runtime
```

### Unknown

The `unknown` type is a type-safe alternative to `any`. You must perform type checking before using unknown values.

```typescript
let value: unknown = "hello";

// Error: Can't use without type checking
// let str: string = value;

// Correct: Type guard required
if (typeof value === "string") {
  let str: string = value; // OK
}

// Using type assertion
let num: number = value as number;
```

### Never

The `never` type represents values that never occur. Used for functions that never return.

```typescript
// Function that throws an error
function throwError(message: string): never {
  throw new Error(message);
}

// Function with an infinite loop
function infiniteLoop(): never {
  while (true) {
    // Never exits
  }
}

// Exhaustive type checking
type Shape = "circle" | "square";

function getArea(shape: Shape): number {
  switch (shape) {
    case "circle":
      return Math.PI * 10 * 10;
    case "square":
      return 10 * 10;
    default:
      const exhaustiveCheck: never = shape;
      return exhaustiveCheck;
  }
}
```

### Void

The `void` type represents the absence of a value, typically used for functions that don't return anything.

```typescript
function logMessage(message: string): void {
  console.log(message);
  // No return statement or return undefined
}

function warnUser(): void {
  alert("Warning!");
}

// Variables of type void can only be undefined or null
let unusable: void = undefined;
```

## Null and Undefined

TypeScript has special types for `null` and `undefined`.

```typescript
let u: undefined = undefined;
let n: null = null;

// With strictNullChecks disabled
let name: string = null; // OK
let age: number = undefined; // OK

// With strictNullChecks enabled (recommended)
let name2: string = null; // Error
let age2: number = undefined; // Error

// Use union types to allow null/undefined
let optionalName: string | null = null;
let optionalAge: number | undefined = undefined;
```

### Optional Properties and Parameters

```typescript
interface User {
  name: string;
  age?: number; // Optional property (type is number | undefined)
}

function greet(name: string, greeting?: string): void {
  if (greeting) {
    console.log(`${greeting}, ${name}!`);
  } else {
    console.log(`Hello, ${name}!`);
  }
}

greet("Alice");           // OK
greet("Bob", "Hi");       // OK
```

### Non-null Assertion Operator

The `!` operator tells TypeScript that a value won't be null or undefined.

```typescript
function processValue(value: string | null) {
  // TypeScript knows value might be null
  // console.log(value.length); // Error

  // Using non-null assertion (use with caution)
  console.log(value!.length); // Asserts value is not null
}

// Better approach: use type guard
function processSafely(value: string | null) {
  if (value !== null) {
    console.log(value.length); // OK
  }
}
```

## Type Annotations

Type annotations explicitly declare the type of variables, parameters, and return values.

### Variable Annotations

```typescript
// Explicit type annotation
let username: string = "Alice";
let age: number = 30;

// Type inference (TypeScript infers the type)
let inferredString = "Bob"; // Type: string
let inferredNumber = 42;    // Type: number

// Multiple variables
let x: number, y: number, z: number;
```

### Function Annotations

```typescript
// Parameter and return type annotations
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function
const multiply = (x: number, y: number): number => {
  return x * y;
};

// Optional parameters
function buildName(firstName: string, lastName?: string): string {
  return lastName ? `${firstName} ${lastName}` : firstName;
}

// Default parameters
function greet(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}!`;
}

// Rest parameters
function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}
```

### Object Type Annotations

```typescript
// Object literal type
let person: { name: string; age: number } = {
  name: "Alice",
  age: 30
};

// Optional properties
let user: { name: string; email?: string } = {
  name: "Bob"
};

// Readonly properties
let config: { readonly apiUrl: string; timeout: number } = {
  apiUrl: "https://api.example.com",
  timeout: 5000
};

// config.apiUrl = "new url"; // Error: readonly property
```

### Type Aliases

Type aliases create reusable type definitions.

```typescript
// Basic type alias
type ID = string | number;
let userId: ID = "abc123";
let productId: ID = 456;

// Object type alias
type User = {
  id: ID;
  name: string;
  email: string;
  age?: number;
};

let user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com"
};

// Function type alias
type MathOperation = (a: number, b: number) => number;

const add: MathOperation = (x, y) => x + y;
const subtract: MathOperation = (x, y) => x - y;
```

## Type Assertions

Type assertions tell TypeScript to treat a value as a specific type.

```typescript
// Angle-bracket syntax
let someValue: any = "this is a string";
let strLength: number = (<string>someValue).length;

// As syntax (preferred, required in JSX)
let anotherValue: any = "another string";
let anotherLength: number = (anotherValue as string).length;

// Practical example
const myCanvas = document.getElementById("canvas") as HTMLCanvasElement;

// Double assertion (use with extreme caution)
const value = "hello" as unknown as number; // Not recommended
```

## Best Practices

1. **Enable Strict Mode**: Use `"strict": true` in `tsconfig.json` for maximum type safety.

2. **Prefer Type Inference**: Let TypeScript infer types when possible to reduce verbosity.

```typescript
// Unnecessary annotation
let name: string = "Alice";

// Better: let TypeScript infer
let name = "Alice"; // Type is inferred as string
```

3. **Avoid Any**: Use `unknown` or specific types instead of `any`.

4. **Use Const Assertions**: For literal types that shouldn't change.

```typescript
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000
} as const;

// config.timeout = 3000; // Error: readonly
```

5. **Use Union Types**: Instead of `any` when a value can be multiple types.

```typescript
function formatValue(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value.toFixed(2);
}
```

## Conclusion

Understanding TypeScript's basic types is the foundation for writing robust, type-safe applications. These types provide compile-time safety, better IDE support, and self-documenting code. As you progress, you'll learn more advanced features like interfaces, generics, and conditional types that build upon these fundamentals.

Remember:
- Use primitive types for basic values
- Leverage arrays and tuples for collections
- Employ enums for named constants
- Apply special types (`any`, `unknown`, `never`, `void`) appropriately
- Handle `null` and `undefined` explicitly
- Annotate types for clarity and safety

With these basics mastered, you're ready to explore more advanced TypeScript features and build scalable applications.
