---
title: TypeScript 严格模式
description: 深入解析 TypeScript 严格模式选项：strictNullChecks、strictFunctionTypes、strictPropertyInitialization、noImplicitAny、noImplicitThis 的原理与实践
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - 严格模式
  - 类型安全
  - tsconfig
  - 编译器选项
status: imported
origin: old/src/content/docs/typescript/strict-mode.en.md
divergence: 0.21
issues:
  - title-lang-en
  - title-language
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 9
  lastUpdated: 2026-01-07
---

Strict Mode is the core of TypeScript's type safety. It enforces stricter type checking through a series of compiler options, helping developers catch potential runtime errors at compile time. We'll analyze how each strict mode option works in depth, along with their use cases and best practices.

## Concept Explanation

### What is Strict Mode?

TypeScript's strict mode is a collection of compiler options that enable stricter type checking rules. When strict mode is enabled, TypeScript performs more rigorous code analysis and catches more potential type errors.

In `tsconfig.json`, you can enable all strict mode options at once by setting `"strict": true`:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### Options Included in Strict Mode

`strict: true` is equivalent to enabling all of the following options simultaneously:

| Option | Description |
|------|------|
| `noImplicitAny` | Disallow implicit any types |
| `noImplicitThis` | Disallow implicit this types |
| `strictNullChecks` | Strict null checks |
| `strictFunctionTypes` | Strict function type checking |
| `strictBindCallApply` | Strict bind/call/apply checking |
| `strictPropertyInitialization` | Strict property initialization checking |
| `useUnknownInCatchVariables` | Use unknown type for catch variables |
| `alwaysStrict` | Add "use strict" to output files |

### Why Do We Need Strict Mode?

JavaScript is a dynamically typed language, and one of TypeScript's design goals is to provide gradual type checking. By default, TypeScript's type checking is relatively lenient to facilitate migration from JavaScript. However, lenient type checking can miss many potential errors:

```typescript
// In non-strict mode, this code won't report errors
function greet(name) {  // name is implicitly any
  return name.toUpperCase();
}

greet(123);  // Runtime error: number.toUpperCase is not a function
```

With strict mode enabled, TypeScript requires explicit type annotations and can discover such issues at compile time.

## Core Principles

### Type System Hierarchy

Understanding strict mode requires first understanding TypeScript's type hierarchy:

```
                    unknown
                       |
          +-----------+-----------+
          |           |           |
        object      void        never
          |           |
    +-----+-----+     |
    |     |     |   null (strictNullChecks)
  Array  Date  ...  undefined (strictNullChecks)
```

- **unknown**: Top type, any type can be assigned to unknown
- **never**: Bottom type, represents values that never occur
- **null and undefined**: In strict mode, they are no longer subtypes of all types

### Covariance and Contravariance

`strictFunctionTypes` involves the concepts of Covariance and Contravariance in type systems:

- **Covariance**: Subtype relationship maintains the same direction (return value types)
- **Contravariance**: Subtype relationship reverses direction (parameter types)

```typescript
type Animal = { name: string };
type Dog = { name: string; breed: string };

// Return values are covariant: Dog is a subtype of Animal
type AnimalFactory = () => Animal;
type DogFactory = () => Dog;

const dogFactory: DogFactory = () => ({ name: "Buddy", breed: "Labrador" });
const animalFactory: AnimalFactory = dogFactory;  // OK: covariant

// Parameters are contravariant: counterintuitive but type-safe
type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

const animalHandler: AnimalHandler = (animal) => console.log(animal.name);
// const dogHandler: DogHandler = animalHandler;  // Error under strictFunctionTypes
```

## Key Points

### strictNullChecks - Strict Null Checks

This is one of the most important strict mode options. It changes how `null` and `undefined` behave in the type system.

#### Behavior When Disabled

```typescript
// strictNullChecks: false
let name: string = "Alice";
name = null;       // OK
name = undefined;  // OK

function getLength(str: string): number {
  return str.length;  // Possible runtime error
}

getLength(null);  // Compiles, but throws runtime error
```

#### Behavior When Enabled

```typescript
// strictNullChecks: true
let name: string = "Alice";
// name = null;       // Error: Cannot assign null to string
// name = undefined;  // Error: Cannot assign undefined to string

// Explicitly declare nullable type
let nullableName: string | null = "Alice";
nullableName = null;  // OK

function getLength(str: string): number {
  return str.length;  // Safe: str is definitely a string
}

// getLength(null);  // Error: Type null cannot be assigned to string
```

#### Null Narrowing

```typescript
function processName(name: string | null): string {
  // Must check for null first
  if (name === null) {
    return "Unknown";
  }
  // Here name's type is narrowed to string
  return name.toUpperCase();
}

// Using optional chaining and nullish coalescing
function getNameLength(name: string | null | undefined): number {
  return name?.length ?? 0;
}
```

### noImplicitAny - Disallow Implicit Any

When TypeScript cannot infer a variable's type, it defaults to treating it as `any` type. The `noImplicitAny` option disallows this implicit behavior.

#### Behavior When Disabled

```typescript
// noImplicitAny: false
function add(a, b) {  // a and b are implicitly any
  return a + b;
}

add(1, 2);         // 3
add("hello", 123); // "hello123"
add({}, []);       // "[object Object]"
```

#### Behavior When Enabled

```typescript
// noImplicitAny: true

// Error: Parameter 'a' implicitly has an 'any' type
// function add(a, b) {
//   return a + b;
// }

// Must provide type annotations
function add(a: number, b: number): number {
  return a + b;
}

// Or use generics
function identity<T>(value: T): T {
  return value;
}
```

#### Common Scenarios

```typescript
// 1. Callback function parameters
// Error: Parameter 'item' implicitly has an 'any' type
// [1, 2, 3].forEach(item => console.log(item));

// Correct approach (usually TypeScript can infer from context)
[1, 2, 3].forEach((item: number) => console.log(item));
// Or rely on type inference
const numbers: number[] = [1, 2, 3];
numbers.forEach(item => console.log(item));  // item inferred as number

// 2. Destructuring assignment
function processConfig({ name, value }) {  // Error
  console.log(name, value);
}

// Correct approach
function processConfig({ name, value }: { name: string; value: number }) {
  console.log(name, value);
}

// 3. Class methods
class Calculator {
  // Error: Parameter 'a' implicitly has an 'any' type
  // add(a, b) {
  //   return a + b;
  // }

  add(a: number, b: number): number {
    return a + b;
  }
}
```

### noImplicitThis - Disallow Implicit This

When the type of `this` in a function cannot be inferred, `noImplicitThis` reports an error.

#### Behavior When Disabled

```typescript
// noImplicitThis: false
const obj = {
  name: "Alice",
  greet() {
    return function() {
      // this is any, may cause runtime errors
      console.log(this.name);
    };
  }
};

obj.greet()();  // undefined (non-strict mode) or error (strict mode)
```

#### Behavior When Enabled

```typescript
// noImplicitThis: true
const obj = {
  name: "Alice",
  greet() {
    // Error: 'this' implicitly has type 'any'
    // return function() {
    //   console.log(this.name);
    // };

    // Solution 1: Use arrow function
    return () => {
      console.log(this.name);  // OK: this is correctly inferred
    };
  }
};

// Solution 2: Explicitly declare this type
interface Greeter {
  name: string;
  greet(): void;
}

function greet(this: Greeter) {
  console.log(this.name);
}

const greeter: Greeter = {
  name: "Alice",
  greet
};

greeter.greet();  // "Alice"
```

#### This in Classes

```typescript
class Counter {
  count = 0;

  // Problem: this is lost in callbacks
  increment() {
    this.count++;
  }

  // Solution: Use arrow function property
  incrementArrow = () => {
    this.count++;
  };

  // Solution: Use bind
  constructor() {
    this.increment = this.increment.bind(this);
  }
}

const counter = new Counter();
const fn = counter.incrementArrow;
fn();  // Works correctly
```

### strictFunctionTypes - Strict Function Types

This option enables contravariant checking for function parameters, making function type checking more strict and safe.

#### Behavior When Disabled (Bivariant)

```typescript
// strictFunctionTypes: false
type Animal = { name: string };
type Dog = { name: string; breed: string };

type AnimalCallback = (animal: Animal) => void;
type DogCallback = (dog: Dog) => void;

let animalCallback: AnimalCallback = (animal) => {
  console.log(animal.name);
};

let dogCallback: DogCallback = (dog) => {
  console.log(dog.breed);  // Accesses breed property
};

// Dangerous! This is allowed in non-strict mode
animalCallback = dogCallback;

// Runtime error: The Animal passed in doesn't have a breed property
animalCallback({ name: "Generic Animal" });
```

#### Behavior When Enabled (Contravariant)

```typescript
// strictFunctionTypes: true
type Animal = { name: string };
type Dog = Animal & { breed: string };

type AnimalCallback = (animal: Animal) => void;
type DogCallback = (dog: Dog) => void;

let animalCallback: AnimalCallback = (animal) => {
  console.log(animal.name);
};

let dogCallback: DogCallback = (dog) => {
  console.log(dog.breed);
};

// Error: Cannot assign DogCallback to AnimalCallback
// Parameter types are incompatible
// animalCallback = dogCallback;

// But the reverse is safe
dogCallback = animalCallback;  // OK
```

#### Difference Between Methods and Function Properties

```typescript
interface Example {
  // Method syntax: Still bivariant (for compatibility)
  method(x: string): void;

  // Function property syntax: Affected by strictFunctionTypes
  property: (x: string) => void;
}
```

### strictPropertyInitialization - Strict Property Initialization

This option requires that class instance properties must be initialized either at declaration or in the constructor. Requires `strictNullChecks` to be enabled as well.

#### Behavior When Disabled

```typescript
// strictPropertyInitialization: false
class User {
  name: string;   // Not initialized, but no error
  email: string;  // Not initialized, but no error

  constructor() {
    // Forgot to initialize properties
  }
}

const user = new User();
console.log(user.name.toUpperCase());  // Runtime error!
```

#### Behavior When Enabled

```typescript
// strictPropertyInitialization: true
class User {
  // Error: Property 'name' has no initializer and is not definitely assigned in the constructor
  // name: string;

  // Method 1: Initialize at declaration
  name: string = "";

  // Method 2: Initialize in constructor
  email: string;

  // Method 3: Declare as optional property
  phone?: string;

  // Method 4: Declare as possibly undefined
  address: string | undefined;

  // Method 5: Use definite assignment assertion (use with caution)
  id!: number;

  constructor(email: string) {
    this.email = email;
  }
}
```

#### Handling Async Initialization

```typescript
class AsyncUser {
  // Use definite assignment assertion for async initialization
  data!: UserData;

  async init() {
    this.data = await fetchUserData();
  }

  // Or use optional property + check
  cachedData?: UserData;

  async getData(): Promise<UserData> {
    if (!this.cachedData) {
      this.cachedData = await fetchUserData();
    }
    return this.cachedData;
  }
}

// Factory pattern is safer
class SafeAsyncUser {
  private constructor(public data: UserData) {}

  static async create(): Promise<SafeAsyncUser> {
    const data = await fetchUserData();
    return new SafeAsyncUser(data);
  }
}
```

### strictBindCallApply - Strict bind/call/apply

This option enables stricter type checking for the `bind`, `call`, and `apply` methods.

#### Behavior When Disabled

```typescript
// strictBindCallApply: false
function greet(name: string, age: number) {
  return `Hello, ${name}! You are ${age} years old.`;
}

// These calls won't error in non-strict mode
greet.call(undefined, "Alice");  // Missing parameter
greet.apply(undefined, ["Alice", "twenty"]);  // Type error
greet.bind(undefined, 123);  // Type error
```

#### Behavior When Enabled

```typescript
// strictBindCallApply: true
function greet(name: string, age: number): string {
  return `Hello, ${name}! You are ${age} years old.`;
}

// Error: Expected 2 arguments, but got 1
// greet.call(undefined, "Alice");

// Error: Type 'string' is not assignable to type 'number'
// greet.apply(undefined, ["Alice", "twenty"]);

// Error: Type 'number' is not assignable to type 'string'
// greet.bind(undefined, 123);

// Correct usage
greet.call(undefined, "Alice", 30);
greet.apply(undefined, ["Alice", 30]);
const boundGreet = greet.bind(undefined, "Alice");
boundGreet(30);  // "Hello, Alice! You are 30 years old."
```

### useUnknownInCatchVariables - Use Unknown in Catch Variables

Introduced in TypeScript 4.4+, this changes the error variable type in catch clauses from `any` to `unknown`.

#### Behavior When Disabled

```typescript
// useUnknownInCatchVariables: false
try {
  throw new Error("Something went wrong");
} catch (error) {
  // error is any type
  console.log(error.message);  // Possible runtime error
  console.log(error.nonExistent);  // No error, but may be undefined
}
```

#### Behavior When Enabled

```typescript
// useUnknownInCatchVariables: true
try {
  throw new Error("Something went wrong");
} catch (error) {
  // error is unknown type
  // console.log(error.message);  // Error: 'error' is of type 'unknown'

  // Must perform type checking
  if (error instanceof Error) {
    console.log(error.message);
  } else if (typeof error === "string") {
    console.log(error);
  } else {
    console.log("Unknown error:", error);
  }
}

// Or use type assertion (need to ensure the type is correct)
try {
  throw new Error("Something went wrong");
} catch (error) {
  const err = error as Error;
  console.log(err.message);
}
```

#### Encapsulating Error Handling

```typescript
// Create type-safe error handling utilities
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error occurred";
}

// Usage
try {
  // May throw various types of errors
  throw { code: 500, reason: "Server error" };
} catch (error) {
  console.log(getErrorMessage(error));
}
```

### alwaysStrict - Always Strict

This option ensures that all output JavaScript files include the `"use strict"` directive.

```typescript
// alwaysStrict: true

// Input
function example() {
  return this;
}

// Output
"use strict";
function example() {
  return this;
}
```

## Code Examples

### Complete Strict Mode Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    // Or configure each option individually
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true
  }
}
```

### Type-Safe API Response Handling

```typescript
// Type-safe code with all strict mode options enabled

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

async function fetchUser(id: number): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `HTTP error: ${response.status}`
      };
    }

    const data: User = await response.json();
    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    // useUnknownInCatchVariables: error is unknown type
    const message = error instanceof Error
      ? error.message
      : "Unknown error occurred";

    return {
      success: false,
      data: null,
      error: message
    };
  }
}

// Using the response
async function displayUser(id: number): Promise<void> {
  const response = await fetchUser(id);

  // strictNullChecks: Must check if data is null
  if (!response.success || response.data === null) {
    console.error(response.error ?? "Failed to fetch user");
    return;
  }

  // Now TypeScript knows response.data is User type
  const user = response.data;
  console.log(`Name: ${user.name}`);
  console.log(`Email: ${user.email}`);

  // Optional properties still need checking
  if (user.phone) {
    console.log(`Phone: ${user.phone}`);
  }
}
```

### Class Design in Strict Mode

```typescript
// strictPropertyInitialization requires all properties to be properly initialized

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
}

class DatabaseConnection {
  // Method 1: Initialize at declaration
  private connected: boolean = false;

  // Method 2: Constructor parameter
  private readonly config: DatabaseConfig;

  // Method 3: Optional property
  private lastQuery?: string;

  // Method 4: Definite assignment assertion (for async initialization cases)
  private connection!: Connection;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // Initialize connection
    this.connection = await createConnection(this.config);
    this.connected = true;
  }

  // noImplicitThis: this type is explicit
  query(sql: string): Promise<QueryResult> {
    if (!this.connected) {
      throw new Error("Not connected to database");
    }
    this.lastQuery = sql;
    return this.connection.query(sql);
  }

  // Get the last executed query
  getLastQuery(): string | undefined {
    return this.lastQuery;
  }
}

// Use factory function to ensure complete initialization
class SafeDatabaseConnection {
  private constructor(
    private readonly config: DatabaseConfig,
    private readonly connection: Connection
  ) {}

  static async create(config: DatabaseConfig): Promise<SafeDatabaseConnection> {
    const connection = await createConnection(config);
    return new SafeDatabaseConnection(config, connection);
  }

  query(sql: string): Promise<QueryResult> {
    return this.connection.query(sql);
  }
}
```

### Type Safety for Event Handlers

```typescript
// strictFunctionTypes ensures type safety for event handlers

interface BaseEvent {
  type: string;
  timestamp: number;
}

interface ClickEvent extends BaseEvent {
  type: "click";
  x: number;
  y: number;
}

interface KeyboardEvent extends BaseEvent {
  type: "keyboard";
  key: string;
  code: number;
}

type AppEvent = ClickEvent | KeyboardEvent;

// Type-safe event handler
type EventHandler<T extends BaseEvent> = (event: T) => void;

class EventEmitter {
  private handlers: Map<string, EventHandler<BaseEvent>[]> = new Map();

  on<T extends AppEvent>(
    type: T["type"],
    handler: EventHandler<T>
  ): void {
    const handlers = this.handlers.get(type) ?? [];
    // strictFunctionTypes ensures type safety
    handlers.push(handler as EventHandler<BaseEvent>);
    this.handlers.set(type, handlers);
  }

  emit<T extends AppEvent>(event: T): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }
}

// Usage
const emitter = new EventEmitter();

emitter.on("click", (event) => {
  // event is correctly inferred as ClickEvent
  console.log(`Click at (${event.x}, ${event.y})`);
});

emitter.on("keyboard", (event) => {
  // event is correctly inferred as KeyboardEvent
  console.log(`Key pressed: ${event.key}`);
});

emitter.emit({
  type: "click",
  timestamp: Date.now(),
  x: 100,
  y: 200
});
```

## Best Practices

### Always Enable Strict Mode in New Projects

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Gradually Enable Strict Mode

For legacy projects, it's recommended to enable options in phases:

```json
// Phase 1: Basic type checking
{
  "compilerOptions": {
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}

// Phase 2: Null safety
{
  "compilerOptions": {
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true
  }
}

// Phase 3: Functions and properties
{
  "compilerOptions": {
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}

// Phase 4: Full strict mode
{
  "compilerOptions": {
    "strict": true
  }
}
```

### Avoid Using Type Assertions to Bypass Checks

```typescript
// Not recommended: Using assertion to bypass null check
function processUser(user: User | null) {
  console.log((user as User).name);  // Dangerous!
}

// Recommended: Proper null handling
function processUser(user: User | null) {
  if (user === null) {
    console.log("No user provided");
    return;
  }
  console.log(user.name);
}

// Or use assertion functions
function assertUser(user: User | null): asserts user is User {
  if (user === null) {
    throw new Error("User is required");
  }
}

function processUser(user: User | null) {
  assertUser(user);
  console.log(user.name);  // Type narrowed to User
}
```

### Use unknown Instead of any

```typescript
// Not recommended
function parseJSON(json: string): any {
  return JSON.parse(json);
}

// Recommended
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}

// Perform type validation when using
interface Config {
  apiUrl: string;
  timeout: number;
}

function isConfig(value: unknown): value is Config {
  return (
    typeof value === "object" &&
    value !== null &&
    "apiUrl" in value &&
    "timeout" in value &&
    typeof (value as Config).apiUrl === "string" &&
    typeof (value as Config).timeout === "number"
  );
}

const data = parseJSON(jsonString);
if (isConfig(data)) {
  console.log(data.apiUrl);  // Type-safe
}
```

### Properly Handle Optional Properties and Parameters

```typescript
interface Options {
  timeout?: number;
  retries?: number;
  onError?: (error: Error) => void;
}

function fetchData(url: string, options: Options = {}): Promise<Response> {
  // Use default values
  const timeout = options.timeout ?? 5000;
  const retries = options.retries ?? 3;

  // Conditionally call optional callback
  const handleError = (error: Error) => {
    options.onError?.(error);
  };

  // ...
}
```

## Common Pitfalls

### Misuse of Definite Assignment Assertion

```typescript
class User {
  // Dangerous: Using ! assertion but may not be initialized
  name!: string;

  async init() {
    // If this method isn't called, name will be undefined
    this.name = await fetchName();
  }
}

// Safer approach
class SafeUser {
  private _name: string | undefined;

  async init() {
    this._name = await fetchName();
  }

  get name(): string {
    if (this._name === undefined) {
      throw new Error("User not initialized");
    }
    return this._name;
  }
}
```

### Function Overloads and Strict Mode

```typescript
// Overload signatures
function process(value: string): string;
function process(value: number): number;
// Implementation signature must be compatible with all overloads
function process(value: string | number): string | number {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value * 2;
}

// strictFunctionTypes checks implementation compatibility with overloads
```

### Third-Party Library Type Issues

```typescript
// Some library type definitions may not be compatible with strict mode
// Solution 1: Use skipLibCheck
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}

// Solution 2: Create type declaration extensions
// types/problematic-lib.d.ts
declare module "problematic-lib" {
  export function doSomething(value: string | null): string;
}

// Solution 3: Wrapper functions
import { riskyFunction } from "problematic-lib";

function safeWrapper(value: string): string {
  const result = riskyFunction(value);
  if (result === null) {
    throw new Error("Unexpected null result");
  }
  return result;
}
```

### Array Index Access

```typescript
// Even with strictNullChecks enabled, array index access doesn't return undefined by default
const arr: string[] = ["a", "b", "c"];
const item = arr[10];  // item type is string, but actual value is undefined

// Recommend enabling noUncheckedIndexedAccess
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true
  }
}

// Now item type is string | undefined
const item = arr[10];
if (item !== undefined) {
  console.log(item.toUpperCase());
}
```

## Performance Considerations

### Compile Time Impact

Strict mode increases the compiler's type checking workload, which may slightly increase compile time. However, this overhead is usually small and can be optimized in the following ways:

1. **Incremental compilation**: Enable `incremental: true`
2. **Skip library check**: Enable `skipLibCheck: true`
3. **Project references**: Use `composite` and `references` for large projects

```json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

### Runtime Impact

Strict mode only affects compile-time type checking and has no impact on runtime performance. The generated JavaScript code is identical to non-strict mode (except for potentially adding the `"use strict"` directive).

## Practical Scenarios

### Scenario 1: API Client Wrapper

```typescript
interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string, defaultTimeout: number = 5000) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
  }

  async request<T>(config: RequestConfig): Promise<ApiResult<T>> {
    try {
      const response = await fetch(this.baseUrl + config.url, {
        method: config.method,
        headers: {
          "Content-Type": "application/json",
          ...config.headers
        },
        body: config.data ? JSON.stringify(config.data) : undefined,
        signal: AbortSignal.timeout(config.timeout ?? this.defaultTimeout)
      });

      if (!response.ok) {
        const error = await response.json() as ApiError;
        return { success: false, error };
      }

      const data = await response.json() as T;
      return { success: true, data };
    } catch (error) {
      // useUnknownInCatchVariables
      const message = error instanceof Error
        ? error.message
        : "Unknown error occurred";

      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message
        }
      };
    }
  }

  get<T>(url: string, config?: Partial<RequestConfig>): Promise<ApiResult<T>> {
    return this.request<T>({ method: "GET", url, ...config });
  }

  post<T>(
    url: string,
    data: unknown,
    config?: Partial<RequestConfig>
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: "POST", url, data, ...config });
  }
}
```

### Scenario 2: State Management

```typescript
interface State {
  user: User | null;
  posts: Post[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: "SET_USER"; payload: User }
  | { type: "CLEAR_USER" }
  | { type: "SET_POSTS"; payload: Post[] }
  | { type: "ADD_POST"; payload: Post }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string };

// strictFunctionTypes ensures reducer type safety
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, error: null };

    case "CLEAR_USER":
      return { ...state, user: null };

    case "SET_POSTS":
      return { ...state, posts: action.payload };

    case "ADD_POST":
      return { ...state, posts: [...state.posts, action.payload] };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    default:
      // Exhaustiveness check
      const _exhaustive: never = action;
      return state;
  }
}

// Type-safe dispatch
function createStore(initialState: State) {
  let state = initialState;
  const listeners: Array<(state: State) => void> = [];

  return {
    getState: () => state,

    dispatch: (action: Action) => {
      state = reducer(state, action);
      listeners.forEach(listener => listener(state));
    },

    subscribe: (listener: (state: State) => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    }
  };
}
```

### Scenario 3: Form Validation

```typescript
type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; errors: string[] };

interface Validator<T> {
  validate(value: unknown): ValidationResult<T>;
}

// String validator
class StringValidator implements Validator<string> {
  private minLength?: number;
  private maxLength?: number;
  private pattern?: RegExp;

  constructor(options?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  }) {
    this.minLength = options?.minLength;
    this.maxLength = options?.maxLength;
    this.pattern = options?.pattern;
  }

  validate(value: unknown): ValidationResult<string> {
    const errors: string[] = [];

    if (typeof value !== "string") {
      return { valid: false, errors: ["Value must be a string"] };
    }

    if (this.minLength !== undefined && value.length < this.minLength) {
      errors.push(`Minimum length is ${this.minLength}`);
    }

    if (this.maxLength !== undefined && value.length > this.maxLength) {
      errors.push(`Maximum length is ${this.maxLength}`);
    }

    if (this.pattern !== undefined && !this.pattern.test(value)) {
      errors.push("Value does not match required pattern");
    }

    return errors.length > 0
      ? { valid: false, errors }
      : { valid: true, value };
  }
}

// Object validator
class ObjectValidator<T extends Record<string, unknown>>
  implements Validator<T>
{
  constructor(
    private schema: { [K in keyof T]: Validator<T[K]> }
  ) {}

  validate(value: unknown): ValidationResult<T> {
    if (typeof value !== "object" || value === null) {
      return { valid: false, errors: ["Value must be an object"] };
    }

    const errors: string[] = [];
    const result: Partial<T> = {};

    for (const key of Object.keys(this.schema) as Array<keyof T>) {
      const fieldValue = (value as Record<string, unknown>)[key as string];
      const fieldResult = this.schema[key].validate(fieldValue);

      if (fieldResult.valid) {
        result[key] = fieldResult.value;
      } else {
        errors.push(...fieldResult.errors.map(e => `${String(key)}: ${e}`));
      }
    }

    return errors.length > 0
      ? { valid: false, errors }
      : { valid: true, value: result as T };
  }
}

// Usage example
interface UserForm {
  username: string;
  email: string;
}

const userValidator = new ObjectValidator<UserForm>({
  username: new StringValidator({ minLength: 3, maxLength: 20 }),
  email: new StringValidator({ pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
});

function handleSubmit(formData: unknown) {
  const result = userValidator.validate(formData);

  if (result.valid) {
    // result.value type is UserForm
    console.log("Valid:", result.value.username, result.value.email);
  } else {
    // result.errors is string[]
    console.error("Validation errors:", result.errors);
  }
}
```

## Interview Key Points

### Q1: What is TypeScript's strict mode? What options does it include?

**Key Points**:
- Strict mode is a collection of compiler options that enable stricter type checking
- `strict: true` enables: noImplicitAny, noImplicitThis, strictNullChecks, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, useUnknownInCatchVariables, alwaysStrict
- Strict mode helps catch more potential runtime errors at compile time

### Q2: What does strictNullChecks do? What problems occur without it?

**Key Points**:
- When enabled, null and undefined are no longer subtypes of all types
- Without it, variables of any type can be assigned null or undefined, which may cause runtime "Cannot read property of null/undefined" errors
- When enabled, you must explicitly use union types (like `string | null`) to represent nullable types
- Null checks are required to safely access potentially null values

### Q3: How does strictFunctionTypes affect function type compatibility?

**Key Points**:
- When enabled, function parameter types use contravariant checking
- This means functions that accept parent type parameters cannot be assigned to variables that expect child type parameters
- Functions defined with method syntax are still bivariant (for compatibility)
- This ensures type safety for callback functions

### Q4: How to gradually enable strict mode in legacy projects?

**Key Points**:
- It's recommended to enable in phases, starting with options that have less impact
- Recommended order: noImplicitAny -> strictNullChecks -> strictFunctionTypes -> strictPropertyInitialization -> full strict
- Can use `// @ts-ignore` or `// @ts-expect-error` to temporarily ignore errors on specific lines
- Consider using different configuration files for different modules

### Q5: What is the purpose of useUnknownInCatchVariables? How to properly handle errors in catch?

**Key Points**:
- Changes the error variable in catch clauses from any type to unknown type
- This forces developers to perform type checking before using the error object
- Proper handling is to use instanceof checks or type guards
- Can create unified error handling utility functions to handle different types of errors

## Further Reading

- [TypeScript Official Documentation - Compiler Options](https://www.typescriptlang.org/tsconfig)
- [TypeScript Official Documentation - Strict Mode](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#strictness)
- [TypeScript Deep Dive - Strict Mode Options](https://basarat.gitbook.io/typescript/type-system/strict-types)
- [TypeScript 4.4 Release Notes - useUnknownInCatchVariables](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html)
- [Covariance and Contravariance Explained](https://www.stephanboyer.com/post/132/what-are-covariance-and-contravariance)
- [Deep Understanding of TypeScript Type System](https://type-level-typescript.com/)
