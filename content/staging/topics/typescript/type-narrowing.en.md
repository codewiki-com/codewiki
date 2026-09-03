---
title: TypeScript 类型收窄
description: 深入理解 TypeScript 类型收窄机制，掌握 typeof、instanceof、in 操作符、真值检查、可辨识联合、类型谓词与断言函数
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - 类型收窄
  - 类型守卫
  - 类型安全
  - 控制流分析
status: imported
origin: old/src/content/docs/typescript/type-narrowing.en.md
divergence: 0.197
issues:
  - title-lang-en
  - title-language
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 6
  lastUpdated: 2026-01-07
---

Type Narrowing is one of the most fundamental concepts in TypeScript's type system. It refers to the TypeScript compiler's ability to analyze control flow in your code and automatically refine a variable's type from a broader type (such as a union type) to a more specific type. Understanding the type narrowing mechanism is key to writing type-safe code.

## Concept Explanation

### What is Type Narrowing?

Type narrowing refers to TypeScript's ability to "narrow" a variable's type from a broader type to a more specific type within a particular code scope, based on conditional checks, type checking operations, and other analyses.

```typescript
function processValue(value: string | number) {
  // Here value's type is string | number
  console.log(value);

  if (typeof value === "string") {
    // Here value's type is narrowed to string
    console.log(value.toUpperCase());
  } else {
    // Here value's type is narrowed to number
    console.log(value.toFixed(2));
  }
}
```

### Why Do We Need Type Narrowing?

In JavaScript, variables can hold values of any type, which leads to many runtime errors. TypeScript addresses this problem through its static type system, and type narrowing is the core mechanism of this system:

1. **Type Safety**: Ensures that only properties and methods that actually exist on a type can be accessed in a specific context
2. **IntelliSense**: IDEs can provide accurate autocompletion based on the narrowed type
3. **Compile-time Checking**: Catches potential type errors at compile time rather than runtime

### The Essence of Type Narrowing

Type narrowing is essentially the TypeScript compiler's **Control Flow Analysis** capability. The compiler tracks the execution paths of your code and infers the specific type of a variable in each branch.

```typescript
function example(x: string | number | boolean) {
  // x: string | number | boolean

  if (typeof x === "string") {
    // x: string
    return x.length;
  }
  // x: number | boolean

  if (typeof x === "number") {
    // x: number
    return x * 2;
  }
  // x: boolean

  return x ? "yes" : "no";
}
```

## Core Principles

### Control Flow Analysis

The TypeScript compiler analyzes your code's control flow, tracking the type of a variable across different code paths. This analysis is based on the following principles:

1. **Assignment Analysis**: When a variable is assigned a value of a specific type, its type is updated
2. **Conditional Analysis**: In different branches of conditional statements, types are narrowed based on the conditional expression
3. **Reachability Analysis**: Identifies unreachable code and excludes impossible cases in type inference

```typescript
function controlFlowExample(value: string | null) {
  // value: string | null

  if (value === null) {
    // value: null
    return "Value is empty";
  }

  // value: string (null has been excluded)
  return value.toUpperCase();
}
```

### Type Guards

Type guards are expressions that trigger type narrowing. TypeScript recognizes the following types of guards:

| Type Guard | Use Case | Example |
|------------|----------|---------|
| `typeof` | Primitive type checking | `typeof x === "string"` |
| `instanceof` | Class instance checking | `x instanceof Date` |
| `in` | Property existence checking | `"name" in x` |
| Equality checks | Literal types, `null`, `undefined` | `x === null` |
| Truthiness checks | Excluding falsy values | `if (x)` |
| Type predicates | Custom type checking | `function isString(x): x is string` |
| Assertion functions | Conditional assertions | `function assert(x): asserts x is T` |

### Assignment Narrowing

When a variable is declared but not initialized, TypeScript determines its type based on subsequent assignments:

```typescript
let value: string | number;

// Accessing value here would cause an error because it's not initialized

value = "hello";
// value: string

value = 42;
// value: number

// Initializing at declaration locks the type
const name = "TypeScript";
// name: "TypeScript" (literal type)
```

## Key Points

### typeof Type Guard

`typeof` is the most commonly used type guard, used for checking primitive types. TypeScript recognizes the following `typeof` return values:

- `"string"`
- `"number"`
- `"bigint"`
- `"boolean"`
- `"symbol"`
- `"undefined"`
- `"object"` (note: `null` also returns `"object"`)
- `"function"`

```typescript
function processInput(input: string | number | boolean | undefined) {
  if (typeof input === "string") {
    // input: string
    return `String length: ${input.length}`;
  }

  if (typeof input === "number") {
    // input: number
    return `Number doubled: ${input * 2}`;
  }

  if (typeof input === "boolean") {
    // input: boolean
    return `Boolean negated: ${!input}`;
  }

  // input: undefined
  return "Undefined";
}
```

### instanceof Type Guard

`instanceof` is used to check whether an object is an instance of a class, working by checking the prototype chain:

```typescript
class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

class ValidationError extends Error {
  fields: string[];

  constructor(message: string, fields: string[]) {
    super(message);
    this.fields = fields;
  }
}

function handleError(error: Error) {
  if (error instanceof HttpError) {
    // error: HttpError
    console.log(`HTTP Error ${error.statusCode}: ${error.message}`);
  } else if (error instanceof ValidationError) {
    // error: ValidationError
    console.log(`Validation Error, invalid fields: ${error.fields.join(", ")}`);
  } else {
    // error: Error
    console.log(`Unknown error: ${error.message}`);
  }
}
```

### in Operator Type Guard

The `in` operator checks whether an object has a specific property, commonly used to distinguish interfaces with different properties:

```typescript
interface Admin {
  id: number;
  role: "admin";
  permissions: string[];
}

interface User {
  id: number;
  role: "user";
  email: string;
}

type Person = Admin | User;

function getPersonInfo(person: Person) {
  console.log(`ID: ${person.id}`);

  if ("permissions" in person) {
    // person: Admin
    console.log(`Admin permissions: ${person.permissions.join(", ")}`);
  } else {
    // person: User
    console.log(`User email: ${person.email}`);
  }
}
```

### Truthiness Narrowing

In JavaScript, "falsy values" include: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`. Truthiness checks can be used to exclude these values:

```typescript
function processOptionalString(value: string | null | undefined) {
  if (value) {
    // value: string (null, undefined, and empty string are excluded)
    console.log(value.toUpperCase());
  }
}

// Combined with logical operators
function printLength(str: string | null | undefined) {
  // Using && for truthiness check
  str && console.log(str.length);

  // Using ?? to provide a default value
  const safeStr = str ?? "default";
  console.log(safeStr.length); // safeStr: string
}
```

**Note**: Truthiness checks will also exclude empty strings `""`, which may not be what you want:

```typescript
function processString(value: string | null) {
  if (value) {
    // Empty string won't enter this branch
    console.log(value);
  }

  // If you only want to exclude null, check explicitly
  if (value !== null) {
    // value: string (including empty string)
    console.log(value);
  }
}
```

### Equality Narrowing

When comparing using `===`, `!==`, `==`, `!=`, TypeScript narrows types accordingly:

```typescript
function processValue(a: string | number, b: string | boolean) {
  if (a === b) {
    // Both a and b are string (the intersection type of both)
    console.log(a.toUpperCase());
    console.log(b.toLowerCase());
  }
}

function checkNull(value: string | null) {
  if (value !== null) {
    // value: string
    console.log(value.length);
  }

  // You can also use == to check both null and undefined at once
  if (value != null) {
    // value: string
    console.log(value.length);
  }
}
```

### Discriminated Unions

Discriminated unions are a powerful type design pattern that uses a common "tag" property to distinguish between different members of a union type:

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
      // shape: Circle
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // shape: Rectangle
      return shape.width * shape.height;
    case "triangle":
      // shape: Triangle
      return (shape.base * shape.height) / 2;
  }
}
```

### Type Predicates

Type predicates allow you to create custom type guard functions with the return type using the `parameterName is Type` syntax:

```typescript
interface Fish {
  swim: () => void;
}

interface Bird {
  fly: () => void;
}

// Type predicate function
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

function moveAnimal(pet: Fish | Bird) {
  if (isFish(pet)) {
    // pet: Fish
    pet.swim();
  } else {
    // pet: Bird
    pet.fly();
  }
}
```

### Assertion Functions

Assertion functions throw an error when the condition is not met, declared using the `asserts` keyword:

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`Expected string, got ${typeof value}`);
  }
}

function processValue(value: unknown) {
  assertIsString(value);
  // value: string (from here on)
  console.log(value.toUpperCase());
}

// Assert condition is true
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function divide(a: number, b: number): number {
  assert(b !== 0, "Divisor cannot be zero");
  // Here TypeScript knows b is not 0
  return a / b;
}
```

## Code Examples

### Example 1: Complete Type Narrowing Scenario

```typescript
// Define multiple response types
interface SuccessResponse {
  status: "success";
  data: unknown;
  timestamp: number;
}

interface ErrorResponse {
  status: "error";
  error: {
    code: number;
    message: string;
  };
}

interface LoadingResponse {
  status: "loading";
  progress: number;
}

type ApiResponse = SuccessResponse | ErrorResponse | LoadingResponse;

// Using type predicates
function isSuccess(response: ApiResponse): response is SuccessResponse {
  return response.status === "success";
}

function isError(response: ApiResponse): response is ErrorResponse {
  return response.status === "error";
}

// Handle API response
function handleResponse(response: ApiResponse): string {
  // Method 1: Using switch and discriminated unions
  switch (response.status) {
    case "success":
      return `Success! Data: ${JSON.stringify(response.data)}`;
    case "error":
      return `Error ${response.error.code}: ${response.error.message}`;
    case "loading":
      return `Loading... ${response.progress}%`;
  }
}

// Method 2: Using type predicates
function handleWithPredicates(response: ApiResponse): string {
  if (isSuccess(response)) {
    // response: SuccessResponse
    return `Timestamp: ${response.timestamp}`;
  }

  if (isError(response)) {
    // response: ErrorResponse
    return `Error code: ${response.error.code}`;
  }

  // response: LoadingResponse
  return `Progress: ${response.progress}%`;
}
```

### Example 2: Recursive Type Narrowing

```typescript
// JSON value type definition
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// Recursively traverse and transform JSON
function transformJson(value: JsonValue): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    // value: JsonValue[]
    const items = value.map(transformJson);
    return `[${items.join(", ")}]`;
  }

  // value: { [key: string]: JsonValue }
  const entries = Object.entries(value).map(
    ([k, v]) => `"${k}": ${transformJson(v)}`
  );
  return `{${entries.join(", ")}}`;
}

// Usage example
const data: JsonValue = {
  name: "John",
  age: 30,
  active: true,
  address: null,
  tags: ["developer", "designer"],
  profile: {
    bio: "Hello World",
    links: ["github.com", "twitter.com"]
  }
};

console.log(transformJson(data));
```

### Example 3: Generics and Type Narrowing

```typescript
// Generic type guard
function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// Filter null and undefined from an array
function filterNullish<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter(isNonNullable);
}

const mixed = [1, null, 2, undefined, 3, null, 4];
const numbers = filterNullish(mixed);
// numbers: number[]
console.log(numbers); // [1, 2, 3, 4]

// Generic assertion function
function assertDefined<T>(
  value: T | null | undefined,
  name: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${name} cannot be null or undefined`);
  }
}

interface Config {
  apiUrl?: string;
  timeout?: number;
}

function initializeApp(config: Config) {
  assertDefined(config.apiUrl, "apiUrl");
  assertDefined(config.timeout, "timeout");

  // Here config.apiUrl and config.timeout are guaranteed to exist
  console.log(`API: ${config.apiUrl}, Timeout: ${config.timeout}ms`);
}
```

### Example 4: Complex State Machine Types

```typescript
// Define state machine states
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
  retryCount: number;
}

type FetchState<T> = IdleState | LoadingState | SuccessState<T> | ErrorState;

// State transition function
function transitionState<T>(
  state: FetchState<T>,
  action:
    | { type: "START" }
    | { type: "SUCCESS"; data: T }
    | { type: "ERROR"; error: Error }
    | { type: "RESET" }
): FetchState<T> {
  switch (action.type) {
    case "START":
      return { status: "loading", startTime: Date.now() };

    case "SUCCESS":
      if (state.status !== "loading") {
        console.warn("Can only transition to success from loading state");
        return state;
      }
      return {
        status: "success",
        data: action.data,
        completedAt: Date.now()
      };

    case "ERROR":
      if (state.status !== "loading") {
        console.warn("Can only transition to error from loading state");
        return state;
      }
      return {
        status: "error",
        error: action.error,
        retryCount: 0
      };

    case "RESET":
      return { status: "idle" };
  }
}

// Render state
function renderState<T>(
  state: FetchState<T>,
  renderData: (data: T) => string
): string {
  switch (state.status) {
    case "idle":
      return "Click to start loading";
    case "loading":
      const elapsed = Date.now() - state.startTime;
      return `Loading... (${elapsed}ms)`;
    case "success":
      return renderData(state.data);
    case "error":
      return `Error: ${state.error.message} (Retry count: ${state.retryCount})`;
  }
}
```

## Best Practices

### Prefer Discriminated Unions

Discriminated unions provide the clearest type narrowing experience:

```typescript
// Recommended: Using discriminated unions
interface CreateAction {
  type: "CREATE";
  payload: { name: string };
}

interface UpdateAction {
  type: "UPDATE";
  payload: { id: number; name: string };
}

interface DeleteAction {
  type: "DELETE";
  payload: { id: number };
}

type Action = CreateAction | UpdateAction | DeleteAction;

function reducer(action: Action) {
  switch (action.type) {
    case "CREATE":
      // Type automatically narrowed, payload structure is clear
      return { id: Date.now(), name: action.payload.name };
    case "UPDATE":
      return { id: action.payload.id, name: action.payload.name };
    case "DELETE":
      return { deleted: action.payload.id };
  }
}
```

### Use Exhaustiveness Checking

Ensure all cases of a union type are handled:

```typescript
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

type Status = "pending" | "approved" | "rejected";

function getStatusMessage(status: Status): string {
  switch (status) {
    case "pending":
      return "Awaiting review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      // If a new status is added but not handled, this will cause a compile error
      return assertNever(status);
  }
}
```

### Use Type Predicates Properly

Type predicates should perform actual runtime checks:

```typescript
// Bad: Type predicate doesn't check properly
function isUser(obj: unknown): obj is User {
  return obj !== null; // Insufficient check!
}

// Good: Complete runtime check
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "name" in obj &&
    typeof (obj as User).id === "number" &&
    typeof (obj as User).name === "string"
  );
}
```

### Avoid Overusing Type Assertions

Type assertions bypass type checking; prefer type narrowing instead:

```typescript
interface User {
  name: string;
  age: number;
}

// Not recommended: Using type assertion
function processUser1(data: unknown) {
  const user = data as User; // Dangerous! No runtime check
  console.log(user.name);
}

// Recommended: Using type guards
function processUser2(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "name" in data &&
    "age" in data
  ) {
    // Safe type narrowing
    const user = data as User;
    console.log(user.name);
  }
}
```

### Combine Null Checks with Optional Chaining

```typescript
interface User {
  profile?: {
    avatar?: string;
    bio?: string;
  };
}

function getAvatar(user: User | null | undefined): string {
  // Using optional chaining and nullish coalescing
  return user?.profile?.avatar ?? "/default-avatar.png";
}

// If you need to use the value in subsequent code, check for null first
function processUser(user: User | null) {
  if (!user) {
    return;
  }

  // user: User
  if (user.profile) {
    // user.profile: { avatar?: string; bio?: string }
    console.log(user.profile.bio);
  }
}
```

## Common Pitfalls

### typeof null Returns "object"

```typescript
function processValue(value: object | null) {
  if (typeof value === "object") {
    // Pitfall: value could still be null!
    // value.toString(); // Runtime error
  }

  // Correct approach: Check for null first
  if (value !== null && typeof value === "object") {
    value.toString(); // Safe
  }
}
```

### Truthiness Checks Exclude Empty Strings and 0

```typescript
function processNumber(value: number | null) {
  if (value) {
    // Pitfall: 0 is also excluded!
    console.log(value * 2);
  }

  // Correct approach
  if (value !== null) {
    console.log(value * 2); // 0 is handled correctly
  }
}

function processString(value: string | null) {
  if (value) {
    // Pitfall: Empty string is also excluded
    console.log(value.length);
  }

  // If empty string is a valid value
  if (value !== null) {
    console.log(value.length); // Length of "" is 0
  }
}
```

### Incorrect Checks in Type Predicates

```typescript
interface Cat {
  meow: () => void;
}

interface Dog {
  bark: () => void;
}

// Wrong type predicate
function isCat(pet: Cat | Dog): pet is Cat {
  // This check is wrong! Should check for meow, not bark
  return (pet as Dog).bark === undefined;
}

// Correct type predicate
function isCatCorrect(pet: Cat | Dog): pet is Cat {
  return "meow" in pet;
}
```

### Limitations of Array Type Narrowing

```typescript
function processArray(arr: string[] | number[]) {
  // TypeScript cannot narrow array element types within loops
  for (const item of arr) {
    // item: string | number
    // Cannot determine if it's string or number
  }

  // Solution 1: Check the first element
  if (arr.length > 0 && typeof arr[0] === "string") {
    // But this still doesn't narrow the entire array
    const strings = arr as string[];
    strings.forEach(s => console.log(s.toUpperCase()));
  }

  // Solution 2: Use a type guard function
  if (isStringArray(arr)) {
    arr.forEach(s => console.log(s.toUpperCase()));
  }
}

function isStringArray(arr: unknown[]): arr is string[] {
  return arr.every(item => typeof item === "string");
}
```

### Type Narrowing Fails in Callbacks

```typescript
function processCallback(value: string | null) {
  if (value !== null) {
    // value: string

    setTimeout(() => {
      // In the callback, TypeScript cannot guarantee value is still non-null
      // Because value could be modified before the callback executes
      console.log(value.toUpperCase()); // Here value is still string | null
    }, 1000);
  }
}

// Solution: Save the narrowed value to a const
function processCallbackFixed(value: string | null) {
  if (value !== null) {
    const nonNullValue = value; // const cannot be reassigned

    setTimeout(() => {
      console.log(nonNullValue.toUpperCase()); // nonNullValue: string
    }, 1000);
  }
}
```

## Performance Considerations

### Runtime Overhead of Type Guards

Type guards are runtime checks and have some performance overhead:

```typescript
// Simple typeof checks have almost no overhead
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// Complex object validation may have significant overhead
function isValidUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    "email" in value &&
    typeof (value as User).id === "number" &&
    typeof (value as User).name === "string" &&
    typeof (value as User).email === "string" &&
    (value as User).email.includes("@")
  );
}
```

### Avoid Redundant Checks

```typescript
// Bad: Redundant checks
function processItems(items: (string | number)[]) {
  const strings: string[] = [];
  const numbers: number[] = [];

  for (const item of items) {
    if (typeof item === "string") {
      strings.push(item);
    }
    if (typeof item === "number") {
      numbers.push(item);
    }
  }
}

// Good: Using else
function processItemsBetter(items: (string | number)[]) {
  const strings: string[] = [];
  const numbers: number[] = [];

  for (const item of items) {
    if (typeof item === "string") {
      strings.push(item);
    } else {
      numbers.push(item);
    }
  }
}
```

### Use Map Instead of Switch for Many Branches

```typescript
type EventType = "click" | "scroll" | "keydown" | "keyup" | "resize" | "load";

// Using switch (performance degrades as branches increase)
function handleEventSwitch(type: EventType) {
  switch (type) {
    case "click": return handleClick();
    case "scroll": return handleScroll();
    // ... more branches
  }
}

// Using Map (O(1) lookup)
const eventHandlers = new Map<EventType, () => void>([
  ["click", handleClick],
  ["scroll", handleScroll],
  // ... more mappings
]);

function handleEventMap(type: EventType) {
  const handler = eventHandlers.get(type);
  handler?.();
}
```

## Real-World Scenarios

### Scenario 1: Form Validation

```typescript
interface FormField {
  value: string;
  error?: string;
  touched: boolean;
}

interface FormState {
  username: FormField;
  email: FormField;
  password: FormField;
}

type ValidationResult =
  | { valid: true }
  | { valid: false; errors: Record<string, string> };

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(form: FormState): ValidationResult {
  const errors: Record<string, string> = {};

  if (!form.username.value.trim()) {
    errors.username = "Username cannot be empty";
  } else if (form.username.value.length < 3) {
    errors.username = "Username must be at least 3 characters";
  }

  if (!form.email.value.trim()) {
    errors.email = "Email cannot be empty";
  } else if (!validateEmail(form.email.value)) {
    errors.email = "Invalid email format";
  }

  if (!form.password.value) {
    errors.password = "Password cannot be empty";
  } else if (form.password.value.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

// Usage
function submitForm(form: FormState) {
  const result = validateForm(form);

  if (!result.valid) {
    // result: { valid: false; errors: Record<string, string> }
    Object.entries(result.errors).forEach(([field, error]) => {
      console.error(`${field}: ${error}`);
    });
    return;
  }

  // result: { valid: true }
  console.log("Form validation passed, submitting...");
}
```

### Scenario 2: API Response Handling

```typescript
// API response types
interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Type guard
function isApiError<T>(response: ApiResponse<T>): response is ApiError {
  return !response.ok;
}

// Wrapped fetch function
async function apiFetch<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: `HTTP_${response.status}`,
          message: data.message || "Request failed",
          details: data.details
        }
      };
    }

    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: e instanceof Error ? e.message : "Network error"
      }
    };
  }
}

// Usage example
interface User {
  id: number;
  name: string;
  email: string;
}

async function getUser(id: number): Promise<User | null> {
  const response = await apiFetch<User>(`/api/users/${id}`);

  if (isApiError(response)) {
    // response: ApiError
    console.error(`Failed to get user: ${response.error.message}`);

    if (response.error.details) {
      Object.entries(response.error.details).forEach(([field, errors]) => {
        console.error(`  ${field}: ${errors.join(", ")}`);
      });
    }

    return null;
  }

  // response: ApiSuccess<User>
  return response.data;
}
```

### Scenario 3: Message Handling System

```typescript
// Define message types
interface TextMessage {
  type: "text";
  content: string;
  sender: string;
  timestamp: number;
}

interface ImageMessage {
  type: "image";
  url: string;
  width: number;
  height: number;
  sender: string;
  timestamp: number;
}

interface SystemMessage {
  type: "system";
  event: "join" | "leave" | "rename";
  userId: string;
  data?: Record<string, string>;
  timestamp: number;
}

type Message = TextMessage | ImageMessage | SystemMessage;

// Message handler
class MessageHandler {
  private textHandlers: ((msg: TextMessage) => void)[] = [];
  private imageHandlers: ((msg: ImageMessage) => void)[] = [];
  private systemHandlers: ((msg: SystemMessage) => void)[] = [];

  onText(handler: (msg: TextMessage) => void) {
    this.textHandlers.push(handler);
  }

  onImage(handler: (msg: ImageMessage) => void) {
    this.imageHandlers.push(handler);
  }

  onSystem(handler: (msg: SystemMessage) => void) {
    this.systemHandlers.push(handler);
  }

  dispatch(message: Message) {
    switch (message.type) {
      case "text":
        this.textHandlers.forEach(h => h(message));
        break;
      case "image":
        this.imageHandlers.forEach(h => h(message));
        break;
      case "system":
        this.systemHandlers.forEach(h => h(message));
        break;
    }
  }
}

// Usage
const handler = new MessageHandler();

handler.onText(msg => {
  // msg: TextMessage
  console.log(`${msg.sender}: ${msg.content}`);
});

handler.onImage(msg => {
  // msg: ImageMessage
  console.log(`${msg.sender} sent an image ${msg.url} (${msg.width}x${msg.height})`);
});

handler.onSystem(msg => {
  // msg: SystemMessage
  switch (msg.event) {
    case "join":
      console.log(`User ${msg.userId} joined the chat`);
      break;
    case "leave":
      console.log(`User ${msg.userId} left the chat`);
      break;
    case "rename":
      console.log(`User ${msg.userId} renamed to ${msg.data?.newName}`);
      break;
  }
});
```

## Interview Key Points

### What is type narrowing? How does it work?

**Answer**: Type narrowing is the process by which TypeScript, through control flow analysis, refines a variable's type from a broader type to a more specific type within a particular code block. The TypeScript compiler tracks code execution paths and infers the specific type of a variable in different branches based on conditional checks, type checking operations, and other analyses.

### What's the difference between typeof and instanceof?

**Answer**:
- `typeof` is used to check primitive types (string, number, boolean, etc.) and returns a type string
- `instanceof` is used to check if an object is an instance of a class, working through prototype chain checking
- `typeof null` returns "object", which is a historical JavaScript quirk
- `instanceof` cannot be used with primitive types, and `typeof` cannot distinguish between different object types

### Explain Discriminated Unions

**Answer**: Discriminated unions are a type design pattern where each member of a union type has a common "tag" property (usually a literal type), and checking this property can distinguish between different types. TypeScript can automatically narrow the type based on the value of the tag property.

```typescript
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number };

function area(shape: Shape) {
  if (shape.kind === "circle") {
    return Math.PI * shape.radius ** 2; // shape: { kind: "circle"; radius: number }
  }
  return shape.width * shape.height; // shape: { kind: "rectangle"; ... }
}
```

### What's the difference between type predicates and assertion functions?

**Answer**:
- **Type predicates**: Return boolean, used for conditional checks, syntax is `parameterName is Type`
- **Assertion functions**: Throw an error when the condition is not met, syntax is `asserts parameterName is Type`

```typescript
// Type predicate
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// Assertion function
function assertString(value: unknown): asserts value is string {
  if (typeof value !== "string") throw new Error("Not a string");
}
```

### How do you implement exhaustiveness checking?

**Answer**: Use the `never` type to ensure all cases of a union type are handled:

```typescript
function assertNever(x: never): never {
  throw new Error("Unexpected value: " + x);
}

type Color = "red" | "green" | "blue";

function getColorCode(color: Color): string {
  switch (color) {
    case "red": return "#ff0000";
    case "green": return "#00ff00";
    case "blue": return "#0000ff";
    default: return assertNever(color); // If a case is missed, this will cause a compile error
  }
}
```

## Further Reading

### Official Documentation

- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#typeof-type-guards)
- [TypeScript Deep Dive - Type Guard](https://basarat.gitbook.io/typescript/type-system/typeguard)

### Related Topics

- [TypeScript Type Guards](/docs/typescript/type-guards) - More detailed introduction to type guards
- [TypeScript Advanced Types](/docs/typescript/advanced-types) - Conditional types, mapped types, etc.
- [TypeScript Generics](/docs/typescript/generics) - Combining generics with type narrowing

### Recommended Resources

- [Understanding TypeScript's Control Flow Based Type Analysis](https://mariusschulz.com/blog/control-flow-based-type-analysis-in-typescript)
- [Assertion Functions in TypeScript](https://mariusschulz.com/blog/assertion-functions-in-typescript)
- [TypeScript: Documentation - More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions)
