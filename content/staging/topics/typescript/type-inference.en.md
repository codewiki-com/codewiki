---
title: Type Inference
description: Complete guide to TypeScript type inference, automatic type deduction and best practices
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - Type Inference
  - Type System
  - Type Safety
status: imported
origin: old/src/content/docs/typescript/type-inference.en.md
divergence: 0.213
issues: []
legacy:
  category: TypeScript
  subcategory: Type System
  order: 10
  lastUpdated: 2026-01-07
---

Type inference is one of TypeScript's most powerful features. It allows the compiler to automatically determine types without requiring explicit type annotations, reducing boilerplate while maintaining full type safety. Understanding how TypeScript infers types helps you write cleaner, more maintainable code.

## What is Type Inference?

Type inference is the automatic deduction of types by the TypeScript compiler based on how values are used in your code. Instead of explicitly declaring every type, TypeScript analyzes your code and determines the most appropriate type.

```typescript
// Explicit type annotation
let message: string = "Hello, TypeScript";

// Type inference - TypeScript infers 'string'
let inferredMessage = "Hello, TypeScript";

// Both variables have the same type: string
```

The compiler examines the value on the right side of the assignment and infers that `inferredMessage` must be of type `string`.

## Basic Type Inference

### Variable Initialization

TypeScript infers types at the point of variable initialization:

```typescript
let count = 42;           // inferred as number
let isActive = true;      // inferred as boolean
let username = "alice";   // inferred as string
let nothing = null;       // inferred as null
let notDefined;           // inferred as any (no initializer)
```

### Array Inference

Arrays are inferred based on their elements:

```typescript
let numbers = [1, 2, 3, 4, 5];           // number[]
let strings = ["a", "b", "c"];            // string[]
let mixed = [1, "two", 3];                // (string | number)[]
let empty = [];                           // any[] (be careful!)

// With explicit typing for empty arrays
let typedEmpty: number[] = [];            // number[]
```

### Object Inference

Object types are inferred from their structure:

```typescript
let user = {
  name: "Alice",
  age: 30,
  isAdmin: false
};
// Inferred type: { name: string; age: number; isAdmin: boolean }

// Accessing properties works as expected
console.log(user.name.toUpperCase());  // OK
console.log(user.age.toFixed(2));      // OK

// TypeScript catches errors
// user.email;  // Error: Property 'email' does not exist
```

### Function Return Type Inference

TypeScript infers function return types from the return statements:

```typescript
// Return type inferred as number
function add(a: number, b: number) {
  return a + b;
}

// Return type inferred as string
function greet(name: string) {
  return `Hello, ${name}!`;
}

// Return type inferred as string | undefined
function maybeGreet(name: string, shouldGreet: boolean) {
  if (shouldGreet) {
    return `Hello, ${name}!`;
  }
  // implicit return undefined
}

// Return type inferred as never (function never returns)
function throwError(message: string) {
  throw new Error(message);
}
```

## Best Common Type

When inferring types from multiple expressions, TypeScript uses the "best common type" algorithm to find a type that is compatible with all candidates.

### Union of Types

```typescript
// Best common type is (number | string | boolean)[]
let mixedArray = [1, "hello", true];

// Best common type is (Cat | Dog)[]
class Animal { name: string = ""; }
class Cat extends Animal { meow() {} }
class Dog extends Animal { bark() {} }

let pets = [new Cat(), new Dog()];  // (Cat | Dog)[]
```

### Explicit Base Type

Sometimes you need to explicitly specify the desired type:

```typescript
// Without annotation: (Cat | Dog)[]
let pets1 = [new Cat(), new Dog()];

// With annotation: Animal[]
let pets2: Animal[] = [new Cat(), new Dog()];

// The second approach allows adding any Animal later
pets2.push(new Animal());  // OK
// pets1.push(new Animal());  // Error with strict settings
```

### Numeric Literal Types

```typescript
// Inferred as number (widened from literal)
let mutableNumber = 42;

// Inferred as literal type 42
const constantNumber = 42;

// Array of number literals becomes number[]
let numbers = [1, 2, 3];  // number[], not (1 | 2 | 3)[]

// Use 'as const' for literal types
const literalNumbers = [1, 2, 3] as const;  // readonly [1, 2, 3]
```

## Contextual Typing

Contextual typing occurs when TypeScript infers types based on the location or context where an expression appears. This is sometimes called "type inference in reverse."

### Event Handlers

```typescript
// TypeScript infers the event parameter type from context
document.addEventListener("click", (event) => {
  // event is inferred as MouseEvent
  console.log(event.clientX, event.clientY);
});

document.addEventListener("keydown", (event) => {
  // event is inferred as KeyboardEvent
  console.log(event.key, event.code);
});
```

### Callback Functions

```typescript
const numbers = [1, 2, 3, 4, 5];

// 'num' is inferred as number from array context
const doubled = numbers.map((num) => num * 2);

// 'a' and 'b' are inferred as numbers
const sorted = numbers.sort((a, b) => a - b);

// Multiple parameters inferred correctly
const indexed = numbers.map((value, index, array) => {
  // value: number, index: number, array: number[]
  return { value, index, total: array.length };
});
```

### Object Method Context

```typescript
interface Calculator {
  add: (a: number, b: number) => number;
  subtract: (a: number, b: number) => number;
}

const calc: Calculator = {
  // Parameters are inferred from the interface
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};
```

### Generic Context

```typescript
// TypeScript infers generic type from usage
function identity<T>(value: T): T {
  return value;
}

const str = identity("hello");    // T inferred as string
const num = identity(42);         // T inferred as number
const obj = identity({ x: 1 });   // T inferred as { x: number }

// Array methods with generics
const filtered = [1, 2, 3, null, 4].filter(
  (item): item is number => item !== null
);
// filtered is number[]
```

## Control Flow Analysis

TypeScript performs sophisticated control flow analysis to narrow types within different code branches.

### Type Guards

```typescript
function processValue(value: string | number) {
  if (typeof value === "string") {
    // TypeScript knows value is string here
    console.log(value.toUpperCase());
  } else {
    // TypeScript knows value is number here
    console.log(value.toFixed(2));
  }
}
```

### Truthiness Narrowing

```typescript
function printLength(str: string | null | undefined) {
  if (str) {
    // str is narrowed to string (truthy check eliminates null/undefined)
    console.log(str.length);
  }
}

// With optional chaining and nullish coalescing
function safeLength(str: string | null | undefined): number {
  return str?.length ?? 0;
}
```

### Equality Narrowing

```typescript
function compare(a: string | number, b: string | boolean) {
  if (a === b) {
    // Both must be string (the only common type)
    console.log(a.toUpperCase());
    console.log(b.toUpperCase());
  }
}
```

### instanceof Narrowing

```typescript
class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

function handleError(error: Error | ApiError) {
  if (error instanceof ApiError) {
    // error is narrowed to ApiError
    console.log(`API Error ${error.statusCode}: ${error.message}`);
  } else {
    // error is narrowed to Error
    console.log(`Error: ${error.message}`);
  }
}
```

### in Operator Narrowing

```typescript
interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

function move(animal: Bird | Fish) {
  if ("fly" in animal) {
    // animal is Bird
    animal.fly();
  } else {
    // animal is Fish
    animal.swim();
  }
}
```

### Discriminated Unions

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // shape is Circle
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // shape is Rectangle
      return shape.width * shape.height;
    case "triangle":
      // shape is Triangle
      return (shape.base * shape.height) / 2;
  }
}
```

### Exhaustiveness Checking

```typescript
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function getShapeName(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      return "Circle";
    case "rectangle":
      return "Rectangle";
    case "triangle":
      return "Triangle";
    default:
      // If we add a new shape and forget to handle it,
      // TypeScript will error here
      return assertNever(shape);
  }
}
```

## Type Widening

Type widening is the process by which TypeScript expands literal types to their base types in certain contexts.

### let vs const

```typescript
// 'let' widens literals to base types
let mutableString = "hello";      // type: string
let mutableNumber = 42;           // type: number
let mutableBoolean = true;        // type: boolean

// 'const' preserves literal types
const constantString = "hello";   // type: "hello"
const constantNumber = 42;        // type: 42
const constantBoolean = true;     // type: true
```

### Object Property Widening

```typescript
// Object properties are widened by default
const config = {
  name: "app",
  port: 3000,
  debug: true,
};
// type: { name: string; port: number; debug: boolean }

// Use 'as const' to prevent widening
const strictConfig = {
  name: "app",
  port: 3000,
  debug: true,
} as const;
// type: { readonly name: "app"; readonly port: 3000; readonly debug: true }
```

### Controlling Widening

```typescript
// Explicit type annotation prevents widening
const status: "pending" | "complete" = "pending";

// Type assertion prevents widening
const direction = "north" as "north";

// Const assertion for entire structure
const point = { x: 10, y: 20 } as const;
// type: { readonly x: 10; readonly y: 20 }

// Const assertion for arrays
const colors = ["red", "green", "blue"] as const;
// type: readonly ["red", "green", "blue"]
```

### Function Parameter Inference and Widening

```typescript
function setStatus<T extends string>(status: T): T {
  return status;
}

// Without constraint, the literal is preserved
const result1 = setStatus("active");  // type: "active"

// Compare with a non-generic version
function setStatusWide(status: string): string {
  return status;
}
const result2 = setStatusWide("active");  // type: string
```

## Type Narrowing

Type narrowing is the opposite of widening - it refines a type to a more specific type based on runtime checks.

### Assignment Narrowing

```typescript
let value: string | number;

value = "hello";
// value is now string
console.log(value.toUpperCase());

value = 42;
// value is now number
console.log(value.toFixed(2));
```

### Custom Type Guards

```typescript
interface Cat {
  meow(): void;
  purr(): void;
}

interface Dog {
  bark(): void;
  wagTail(): void;
}

// User-defined type guard
function isCat(pet: Cat | Dog): pet is Cat {
  return "meow" in pet;
}

function interactWithPet(pet: Cat | Dog) {
  if (isCat(pet)) {
    pet.meow();
    pet.purr();
  } else {
    pet.bark();
    pet.wagTail();
  }
}
```

### Assertion Functions

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Value must be a string");
  }
}

function processInput(input: unknown) {
  assertIsString(input);
  // input is now string
  console.log(input.toUpperCase());
}

// Non-null assertion function
function assertDefined<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error("Value must be defined");
  }
}
```

### Array Filtering with Type Guards

```typescript
const mixedArray: (string | number | null)[] = [1, "two", null, 3, "four", null];

// Filter with type guard narrows the result type
const strings = mixedArray.filter((item): item is string => typeof item === "string");
// strings is string[]

const numbers = mixedArray.filter((item): item is number => typeof item === "number");
// numbers is number[]

const nonNull = mixedArray.filter((item): item is string | number => item !== null);
// nonNull is (string | number)[]
```

## Practical Examples

### API Response Handling

```typescript
interface SuccessResponse<T> {
  status: "success";
  data: T;
}

interface ErrorResponse {
  status: "error";
  message: string;
  code: number;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

async function fetchUser(id: number): Promise<ApiResponse<User>> {
  // Implementation
  const response = await fetch(`/api/users/${id}`);
  if (response.ok) {
    return { status: "success", data: await response.json() };
  }
  return {
    status: "error",
    message: "User not found",
    code: response.status
  };
}

interface User {
  id: number;
  name: string;
  email: string;
}

async function displayUser(id: number) {
  const response = await fetchUser(id);

  if (response.status === "success") {
    // TypeScript knows response is SuccessResponse<User>
    console.log(`User: ${response.data.name}`);
    console.log(`Email: ${response.data.email}`);
  } else {
    // TypeScript knows response is ErrorResponse
    console.error(`Error ${response.code}: ${response.message}`);
  }
}
```

### Form Validation

```typescript
interface ValidationSuccess {
  valid: true;
  data: FormData;
}

interface ValidationError {
  valid: false;
  errors: Record<string, string[]>;
}

type ValidationResult = ValidationSuccess | ValidationError;

interface FormData {
  username: string;
  email: string;
  age: number;
}

function validateForm(input: unknown): ValidationResult {
  const errors: Record<string, string[]> = {};

  if (typeof input !== "object" || input === null) {
    return { valid: false, errors: { form: ["Invalid input"] } };
  }

  const obj = input as Record<string, unknown>;

  // Validate username
  if (typeof obj.username !== "string" || obj.username.length < 3) {
    errors.username = ["Username must be at least 3 characters"];
  }

  // Validate email
  if (typeof obj.email !== "string" || !obj.email.includes("@")) {
    errors.email = ["Invalid email format"];
  }

  // Validate age
  if (typeof obj.age !== "number" || obj.age < 0 || obj.age > 150) {
    errors.age = ["Age must be between 0 and 150"];
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      username: obj.username as string,
      email: obj.email as string,
      age: obj.age as number,
    },
  };
}

function handleFormSubmit(input: unknown) {
  const result = validateForm(input);

  if (result.valid) {
    // result.data is FormData
    console.log(`Welcome, ${result.data.username}!`);
  } else {
    // result.errors is Record<string, string[]>
    Object.entries(result.errors).forEach(([field, messages]) => {
      console.error(`${field}: ${messages.join(", ")}`);
    });
  }
}
```

### State Machine

```typescript
interface IdleState {
  status: "idle";
}

interface LoadingState {
  status: "loading";
  startTime: number;
}

interface SuccessState<T> {
  status: "success";
  data: T;
  completedAt: number;
}

interface ErrorState {
  status: "error";
  error: Error;
  failedAt: number;
}

type AsyncState<T> = IdleState | LoadingState | SuccessState<T> | ErrorState;

function renderAsyncContent<T>(
  state: AsyncState<T>,
  renderData: (data: T) => string
): string {
  switch (state.status) {
    case "idle":
      return "Ready to load";
    case "loading":
      const elapsed = Date.now() - state.startTime;
      return `Loading... (${elapsed}ms)`;
    case "success":
      return renderData(state.data);
    case "error":
      return `Error: ${state.error.message}`;
  }
}
```

## Best Practices

### Let TypeScript Infer When Possible

```typescript
// Unnecessary explicit types
const name: string = "Alice";
const numbers: number[] = [1, 2, 3];
const user: { name: string; age: number } = { name: "Bob", age: 30 };

// Better: let TypeScript infer
const name = "Alice";
const numbers = [1, 2, 3];
const user = { name: "Bob", age: 30 };
```

### Annotate Function Parameters and Return Types for Public APIs

```typescript
// Public function: explicit types improve documentation
export function calculateDiscount(
  price: number,
  discountPercent: number
): number {
  return price * (1 - discountPercent / 100);
}

// Internal helper: inference is fine
const applyTax = (amount: number, rate: number) => amount * (1 + rate);
```

### Use const Assertions for Literal Types

```typescript
// When you need literal types
const DIRECTIONS = ["north", "south", "east", "west"] as const;
type Direction = typeof DIRECTIONS[number];  // "north" | "south" | "east" | "west"

const CONFIG = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3,
} as const;
```

### Prefer Discriminated Unions

```typescript
// Good: discriminated union with clear type narrowing
type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

function processResult<T, E>(result: Result<T, E>) {
  if (result.success) {
    return result.value;
  } else {
    throw result.error;
  }
}
```

### Use Type Guards for Complex Type Narrowing

```typescript
// Define reusable type guards
function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

// Use in array operations
const values = [1, null, 2, undefined, 3];
const nonNullValues = values.filter(isNonNullable);  // number[]
```

## Common Pitfalls

### Empty Array Inference

```typescript
// Problem: empty array is any[]
const items = [];  // any[]
items.push("string");
items.push(42);  // No error, but type unsafe

// Solution: provide type annotation
const typedItems: string[] = [];
typedItems.push("string");
// typedItems.push(42);  // Error: Argument of type 'number'...
```

### Object Property Addition

```typescript
// Problem: can't add properties to inferred type
const user = { name: "Alice" };
// user.age = 30;  // Error: Property 'age' does not exist

// Solution: define complete type upfront
interface User {
  name: string;
  age?: number;
}
const user2: User = { name: "Alice" };
user2.age = 30;  // OK
```

### Callback Parameter Types

```typescript
// Problem: no context for callback type
const handler = (event) => {  // event is any
  console.log(event.target);
};

// Solution: provide context or annotation
const typedHandler = (event: MouseEvent) => {
  console.log(event.target);
};

// Or use in context
document.addEventListener("click", (event) => {
  // event is MouseEvent (contextual typing)
  console.log(event.target);
});
```

## Conclusion

TypeScript's type inference system is a powerful feature that significantly reduces the amount of explicit type annotations needed while maintaining strong type safety. By understanding how basic inference, best common type, contextual typing, and control flow analysis work, you can write cleaner code that fully leverages TypeScript's capabilities.

Key takeaways:

- Let TypeScript infer types when the inference is clear and correct
- Use explicit annotations for public APIs and when inference is insufficient
- Leverage discriminated unions for complex state management
- Use type guards and assertion functions for custom narrowing
- Be aware of type widening and use const assertions when needed
- Trust the control flow analysis to narrow types in conditionals

Mastering type inference helps you strike the right balance between type safety and code conciseness, leading to more maintainable and robust TypeScript applications.
