---
title: Type Coverage and Type Safety
description: Understanding TypeScript type coverage metrics, measuring type safety, tools for tracking coverage, and strategies for achieving comprehensive type safety in your codebase
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - Type Coverage
  - Type Safety
  - Code Quality
  - Static Analysis
  - any Type
status: imported
origin: old/src/content/docs/typescript/type-coverage.en.md
divergence: 0.234
issues: []
legacy:
  category: TypeScript
  subcategory: Type System
  order: 21
  lastUpdated: 2026-01-22
---

Type coverage is a metric that measures how much of your TypeScript code is actually typed versus implicitly or explicitly using `any`. High type coverage indicates that TypeScript can provide maximum compile-time safety, while low coverage means many runtime errors may go undetected. This article explores how to measure, improve, and maintain type coverage in TypeScript projects.

## Concept Explanation

### What is Type Coverage?

Type coverage represents the percentage of code symbols (variables, parameters, return types, etc.) that have known types versus those that are `any` or `unknown`. It's analogous to test coverage but for types.

```typescript
// Low type coverage example
function processData(data) {          // data: any (implicit)
  const result = data.map(item => {   // item: any
    return item.value;                // .value: any
  });
  return result;                      // result: any[]
}

// High type coverage example
interface DataItem {
  id: string;
  value: number;
}

function processData(data: DataItem[]): number[] {
  const result = data.map(item => {   // item: DataItem
    return item.value;                // .value: number
  });
  return result;                      // result: number[]
}
```

### Type Coverage vs Type Safety

These concepts are related but distinct:

| Aspect | Type Coverage | Type Safety |
|--------|--------------|-------------|
| Definition | Percentage of typed symbols | Absence of type errors at runtime |
| Measurement | Quantitative (percentage) | Qualitative (correct/incorrect) |
| Focus | Breadth of typing | Correctness of types |
| Goal | Minimize `any` usage | Prevent runtime type errors |

```typescript
// High coverage but low safety
interface User {
  name: string;
  age: number;
}

function processUser(user: User) {
  // 100% type coverage, but unsafe if User type is wrong
  return user.name.toUpperCase();
}

// Called with incorrect data at runtime
const data = JSON.parse('{"name": null, "age": "thirty"}');
processUser(data as User);  // Runtime error: Cannot read property 'toUpperCase' of null

// High coverage AND high safety
function processUserSafe(user: unknown): string {
  if (isUser(user)) {
    return user.name.toUpperCase();
  }
  throw new Error("Invalid user data");
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as User).name === "string" &&
    typeof (value as User).age === "number"
  );
}
```

### The Cost of `any`

Using `any` defeats TypeScript's type system:

```typescript
// The "any virus" - any spreads through your code
function getConfig(): any {
  return { timeout: 5000 };
}

const config = getConfig();           // config: any
const timeout = config.timeout;        // timeout: any
const doubled = timeout * 2;           // doubled: any
const message = `Timeout: ${doubled}`; // message: string (finally typed!)

// Potential bugs undetected
config.timout;          // Typo - no error with any
config.timeout.foo.bar; // Invalid access - no error
timeout + "string";     // Type coercion - no error
```

## Core Principles

### Type Inference Maximization

TypeScript can infer many types automatically. Understanding inference helps maintain coverage without excessive annotations:

```typescript
// TypeScript infers these types automatically
const numbers = [1, 2, 3];                    // number[]
const doubled = numbers.map(n => n * 2);       // number[]
const sum = numbers.reduce((a, b) => a + b);   // number

// Inference from function returns
function createUser(name: string, age: number) {
  return {
    id: crypto.randomUUID(),  // inferred as string
    name,                     // inferred as string
    age,                      // inferred as number
    createdAt: new Date()     // inferred as Date
  };
}

type User = ReturnType<typeof createUser>;
// User = { id: string; name: string; age: number; createdAt: Date }

// Contextual typing from callbacks
const users: User[] = [];
users.filter(user => user.age > 18);  // user is typed from array type
users.map(user => user.name);          // user is typed from array type
```

### Strict Mode and Coverage

Strict mode options directly impact type coverage:

```typescript
// Without strict mode - many implicit any
function greet(name) {       // name: any (implicit)
  return "Hello, " + name;
}

const obj = {
  handler() {
    return this.value;       // this: any (implicit)
  }
};

// With strict mode - forced explicit types
function greet(name: string): string {
  return "Hello, " + name;
}

const obj = {
  value: 42,
  handler(): number {
    return this.value;       // this: typeof obj
  }
};
```

### Type Narrowing for Coverage

Type narrowing maintains coverage while handling uncertainty:

```typescript
// Without narrowing - coverage drops
function processValue(value: string | number | null) {
  // value could be any of three types
  return value;  // Still union type
}

// With narrowing - maintains specific types
function processValue(value: string | number | null): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return value.toUpperCase();  // value: string
  }

  return value.toFixed(2);  // value: number
}

// Using discriminated unions for complex narrowing
interface Success {
  type: "success";
  data: string[];
}

interface Failure {
  type: "failure";
  error: Error;
}

type Result = Success | Failure;

function handleResult(result: Result): string[] {
  switch (result.type) {
    case "success":
      return result.data;     // result: Success
    case "failure":
      throw result.error;     // result: Failure
  }
}
```

## Key Points

### Measuring Type Coverage

#### Using type-coverage Tool

The most popular tool for measuring type coverage:

```bash
# Install globally
npm install -g type-coverage

# Basic usage
type-coverage

# With details showing uncovered code
type-coverage --detail

# Strict mode (counts unknown as uncovered too)
type-coverage --strict

# Set minimum threshold (fails if below)
type-coverage --at-least 90

# Output as JSON for CI integration
type-coverage --json > coverage.json
```

Example output:
```
95.23% (1842/1935)
```

#### Understanding the Metrics

```typescript
// type-coverage counts these as COVERED:
const x: string = "hello";           // Explicit type
const y = "hello";                   // Inferred type (string)
const arr: number[] = [1, 2, 3];     // Explicit array type
function fn(a: string): number { }   // Typed parameters and return

// type-coverage counts these as UNCOVERED:
const x: any = "hello";              // Explicit any
function fn(a) { }                   // Implicit any parameter
let data = value as any;             // Type assertion to any
const obj: { [key: string]: any };   // any in index signature
```

#### Tracking Coverage Over Time

```typescript
// scripts/track-coverage.ts
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFileSync, readFileSync, existsSync } from "fs";

const execFileAsync = promisify(execFile);

interface CoverageRecord {
  date: string;
  percentage: number;
  covered: number;
  total: number;
}

interface CoverageHistory {
  records: CoverageRecord[];
}

async function trackCoverage(): Promise<void> {
  const { stdout } = await execFileAsync("npx", ["type-coverage", "--json"]);
  const coverage = JSON.parse(stdout);

  const historyPath = ".type-coverage-history.json";
  const history: CoverageHistory = existsSync(historyPath)
    ? JSON.parse(readFileSync(historyPath, "utf-8"))
    : { records: [] };

  history.records.push({
    date: new Date().toISOString(),
    percentage: coverage.percentage,
    covered: coverage.covered,
    total: coverage.total
  });

  writeFileSync(historyPath, JSON.stringify(history, null, 2));

  // Check for regression
  if (history.records.length > 1) {
    const previous = history.records[history.records.length - 2];
    const current = history.records[history.records.length - 1];

    if (current.percentage < previous.percentage) {
      console.error(
        `Type coverage regression: ${previous.percentage}% -> ${current.percentage}%`
      );
      process.exit(1);
    }
  }
}

trackCoverage();
```

### Common Sources of `any`

#### 1. Untyped Function Parameters

```typescript
// Problem
function process(data) {  // data: any
  return data.value;
}

// Solution 1: Add explicit type
function process(data: { value: number }): number {
  return data.value;
}

// Solution 2: Use generics for flexibility
function process<T extends { value: number }>(data: T): number {
  return data.value;
}

// Solution 3: Use interface/type alias
interface Processable {
  value: number;
}

function process(data: Processable): number {
  return data.value;
}
```

#### 2. JSON Parsing

```typescript
// Problem
const data = JSON.parse(jsonString);  // data: any

// Solution 1: Type assertion (use cautiously)
interface User {
  id: string;
  name: string;
}

const data = JSON.parse(jsonString) as User;

// Solution 2: Runtime validation (recommended)
function parseUser(json: string): User {
  const data: unknown = JSON.parse(json);

  if (!isUser(data)) {
    throw new Error("Invalid user JSON");
  }

  return data;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as User).id === "string" &&
    typeof (value as User).name === "string"
  );
}

// Solution 3: Use a validation library like Zod
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string()
});

type User = z.infer<typeof UserSchema>;

function parseUser(json: string): User {
  return UserSchema.parse(JSON.parse(json));
}
```

#### 3. External API Responses

```typescript
// Problem
async function fetchData() {
  const response = await fetch("/api/data");
  return response.json();  // Returns Promise<any>
}

// Solution: Type the response
interface ApiData {
  items: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  total: number;
  page: number;
}

async function fetchData(): Promise<ApiData> {
  const response = await fetch("/api/data");

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data: unknown = await response.json();

  // Validate at runtime for true safety
  if (!isApiData(data)) {
    throw new Error("Invalid API response");
  }

  return data;
}

// Type guard for API response
function isApiData(value: unknown): value is ApiData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    Array.isArray(obj.items) &&
    typeof obj.total === "number" &&
    typeof obj.page === "number"
  );
}
```

#### 4. Dynamic Object Access

```typescript
// Problem
function getValue(obj: object, key: string) {
  return obj[key];  // Returns any
}

// Solution 1: Use generics with keyof
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Solution 2: Use Record type
function getValue<T>(obj: Record<string, T>, key: string): T | undefined {
  return obj[key];
}

// Solution 3: Use index signature with specific type
interface Config {
  [key: string]: string | number | boolean;
}

function getValue(obj: Config, key: string): string | number | boolean {
  return obj[key];
}
```

#### 5. Third-Party Libraries

```typescript
// Problem: Library without types
import { doSomething } from "untyped-lib";  // doSomething: any

// Solution 1: Create declaration file
// src/types/untyped-lib.d.ts
declare module "untyped-lib" {
  export function doSomething(input: string): Promise<{
    success: boolean;
    data: unknown;
  }>;
}

// Solution 2: Create wrapper with types
// src/lib/typed-wrapper.ts
import { doSomething as untypedDoSomething } from "untyped-lib";

interface DoSomethingResult {
  success: boolean;
  data: unknown;
}

export async function doSomething(input: string): Promise<DoSomethingResult> {
  const result = await untypedDoSomething(input);
  return result as DoSomethingResult;
}
```

### Strategies for Improving Coverage

#### 1. Enable Strict Compiler Options

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### 2. Use ESLint Rules

```javascript
// .eslintrc.js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/no-unsafe-argument": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "warn"
  }
};
```

#### 3. Gradual Type Strengthening

```typescript
// Step 1: Start with explicit any (tracked)
function processData(data: any): any {
  return data.items.map((item: any) => item.value);
}

// Step 2: Add outer types
interface ProcessInput {
  items: any[];
}

function processData(data: ProcessInput): any[] {
  return data.items.map((item: any) => item.value);
}

// Step 3: Add inner types
interface Item {
  value: number;
  label: string;
}

interface ProcessInput {
  items: Item[];
}

function processData(data: ProcessInput): number[] {
  return data.items.map(item => item.value);
}

// Step 4: Add additional safety
function processData(data: Readonly<ProcessInput>): readonly number[] {
  return data.items.map(item => item.value);
}
```

## Code Examples

### Type-Safe API Client

```typescript
// A fully typed API client with high coverage

// Types
interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

interface ApiError {
  code: string;
  message: string;
  status: number;
}

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

// Type-safe fetch wrapper
class ApiClient {
  private config: Required<ApiConfig>;

  constructor(config: ApiConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      timeout: config.timeout ?? 30000,
      headers: config.headers ?? {}
    };
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.config.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }

    return url.toString();
  }

  private async request<T>(options: RequestOptions): Promise<ApiResult<T>> {
    const { method, path, body, params, headers } = options;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(this.buildUrl(path, params), {
        method,
        headers: {
          "Content-Type": "application/json",
          ...this.config.headers,
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        return {
          ok: false,
          error: {
            code: errorBody.code ?? "HTTP_ERROR",
            message: errorBody.message ?? response.statusText,
            status: response.status
          }
        };
      }

      const data = await response.json() as T;
      return { ok: true, data };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return {
          ok: false,
          error: {
            code: "TIMEOUT",
            message: "Request timed out",
            status: 408
          }
        };
      }

      return {
        ok: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
          status: 0
        }
      };
    }
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: "GET", path, params });
  }

  async post<T, B = unknown>(path: string, body?: B): Promise<ApiResult<T>> {
    return this.request<T>({ method: "POST", path, body });
  }

  async put<T, B = unknown>(path: string, body?: B): Promise<ApiResult<T>> {
    return this.request<T>({ method: "PUT", path, body });
  }

  async delete<T>(path: string): Promise<ApiResult<T>> {
    return this.request<T>({ method: "DELETE", path });
  }
}

// Usage with full type coverage
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

const api = new ApiClient({ baseUrl: "https://api.example.com" });

async function getUser(id: string): Promise<User> {
  const result = await api.get<User>(`/users/${id}`);

  if (!result.ok) {
    throw new Error(`Failed to get user: ${result.error.message}`);
  }

  return result.data;
}

async function createUser(data: CreateUserRequest): Promise<User> {
  const result = await api.post<User, CreateUserRequest>("/users", data);

  if (!result.ok) {
    throw new Error(`Failed to create user: ${result.error.message}`);
  }

  return result.data;
}
```

### Type-Safe Event System

```typescript
// Event system with full type coverage

// Event type definitions
interface EventMap {
  "user:login": { userId: string; timestamp: Date };
  "user:logout": { userId: string; reason: "manual" | "timeout" | "error" };
  "cart:add": { productId: string; quantity: number; price: number };
  "cart:remove": { productId: string };
  "order:created": { orderId: string; total: number; items: number };
  "error": { code: string; message: string; stack?: string };
}

type EventName = keyof EventMap;
type EventData<E extends EventName> = EventMap[E];
type EventHandler<E extends EventName> = (data: EventData<E>) => void;

// Type-safe event emitter
class TypedEventEmitter {
  private handlers = new Map<EventName, Set<EventHandler<any>>>();

  on<E extends EventName>(event: E, handler: EventHandler<E>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  once<E extends EventName>(event: E, handler: EventHandler<E>): () => void {
    const wrappedHandler: EventHandler<E> = (data) => {
      this.handlers.get(event)?.delete(wrappedHandler);
      handler(data);
    };

    return this.on(event, wrappedHandler);
  }

  emit<E extends EventName>(event: E, data: EventData<E>): void {
    const eventHandlers = this.handlers.get(event);

    if (eventHandlers) {
      eventHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  off<E extends EventName>(event: E, handler?: EventHandler<E>): void {
    if (handler) {
      this.handlers.get(event)?.delete(handler);
    } else {
      this.handlers.delete(event);
    }
  }

  removeAllListeners(): void {
    this.handlers.clear();
  }
}

// Usage
const events = new TypedEventEmitter();

// Full type inference and checking
events.on("user:login", (data) => {
  // data is typed as { userId: string; timestamp: Date }
  console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

events.on("cart:add", (data) => {
  // data is typed as { productId: string; quantity: number; price: number }
  const total = data.quantity * data.price;
  console.log(`Added ${data.quantity} x ${data.productId}, total: ${total}`);
});

// Type errors caught at compile time
// events.emit("user:login", { userId: 123 });  // Error: userId should be string
// events.emit("cart:add", { productId: "123" });  // Error: missing quantity and price
// events.on("invalid:event", () => {});  // Error: invalid event name
```

### Runtime Type Validation

```typescript
// Comprehensive runtime validation with type inference

// Validator types
type Validator<T> = {
  parse(value: unknown): T;
  safeParse(value: unknown): { success: true; data: T } | { success: false; error: string };
};

// Primitive validators
function string(): Validator<string> {
  return {
    parse(value: unknown): string {
      if (typeof value !== "string") {
        throw new Error(`Expected string, got ${typeof value}`);
      }
      return value;
    },
    safeParse(value: unknown) {
      if (typeof value !== "string") {
        return { success: false, error: `Expected string, got ${typeof value}` };
      }
      return { success: true, data: value };
    }
  };
}

function number(): Validator<number> {
  return {
    parse(value: unknown): number {
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new Error(`Expected number, got ${typeof value}`);
      }
      return value;
    },
    safeParse(value: unknown) {
      if (typeof value !== "number" || Number.isNaN(value)) {
        return { success: false, error: `Expected number, got ${typeof value}` };
      }
      return { success: true, data: value };
    }
  };
}

function boolean(): Validator<boolean> {
  return {
    parse(value: unknown): boolean {
      if (typeof value !== "boolean") {
        throw new Error(`Expected boolean, got ${typeof value}`);
      }
      return value;
    },
    safeParse(value: unknown) {
      if (typeof value !== "boolean") {
        return { success: false, error: `Expected boolean, got ${typeof value}` };
      }
      return { success: true, data: value };
    }
  };
}

// Object validator
type ObjectSchema = Record<string, Validator<unknown>>;
type InferObject<T extends ObjectSchema> = {
  [K in keyof T]: T[K] extends Validator<infer U> ? U : never;
};

function object<T extends ObjectSchema>(schema: T): Validator<InferObject<T>> {
  return {
    parse(value: unknown): InferObject<T> {
      if (typeof value !== "object" || value === null) {
        throw new Error(`Expected object, got ${typeof value}`);
      }

      const result: Record<string, unknown> = {};
      const obj = value as Record<string, unknown>;

      for (const [key, validator] of Object.entries(schema)) {
        result[key] = validator.parse(obj[key]);
      }

      return result as InferObject<T>;
    },
    safeParse(value: unknown) {
      if (typeof value !== "object" || value === null) {
        return { success: false, error: `Expected object, got ${typeof value}` };
      }

      const result: Record<string, unknown> = {};
      const obj = value as Record<string, unknown>;

      for (const [key, validator] of Object.entries(schema)) {
        const fieldResult = validator.safeParse(obj[key]);
        if (!fieldResult.success) {
          return { success: false, error: `${key}: ${fieldResult.error}` };
        }
        result[key] = fieldResult.data;
      }

      return { success: true, data: result as InferObject<T> };
    }
  };
}

// Array validator
function array<T>(itemValidator: Validator<T>): Validator<T[]> {
  return {
    parse(value: unknown): T[] {
      if (!Array.isArray(value)) {
        throw new Error(`Expected array, got ${typeof value}`);
      }
      return value.map((item, index) => {
        try {
          return itemValidator.parse(item);
        } catch (error) {
          throw new Error(`[${index}]: ${(error as Error).message}`);
        }
      });
    },
    safeParse(value: unknown) {
      if (!Array.isArray(value)) {
        return { success: false, error: `Expected array, got ${typeof value}` };
      }

      const result: T[] = [];
      for (let i = 0; i < value.length; i++) {
        const itemResult = itemValidator.safeParse(value[i]);
        if (!itemResult.success) {
          return { success: false, error: `[${i}]: ${itemResult.error}` };
        }
        result.push(itemResult.data);
      }

      return { success: true, data: result };
    }
  };
}

// Optional validator
function optional<T>(validator: Validator<T>): Validator<T | undefined> {
  return {
    parse(value: unknown): T | undefined {
      if (value === undefined) {
        return undefined;
      }
      return validator.parse(value);
    },
    safeParse(value: unknown) {
      if (value === undefined) {
        return { success: true, data: undefined };
      }
      return validator.safeParse(value);
    }
  };
}

// Usage
const UserSchema = object({
  id: string(),
  name: string(),
  age: number(),
  isActive: boolean(),
  email: optional(string())
});

type User = ReturnType<typeof UserSchema.parse>;

// Safe parsing from external source
const jsonData = '{"id": "123", "name": "John", "age": 30, "isActive": true}';
const result = UserSchema.safeParse(JSON.parse(jsonData));

if (result.success) {
  const user = result.data;  // Fully typed!
  console.log(user.name);    // TypeScript knows this is string
} else {
  console.error(result.error);
}
```

## Best Practices

### 1. Set Coverage Thresholds

```json
// package.json
{
  "scripts": {
    "type-coverage": "type-coverage --at-least 90 --strict",
    "type-coverage:report": "type-coverage --detail --strict > type-coverage.txt"
  }
}
```

### 2. Add Coverage to CI/CD

```yaml
# .github/workflows/type-check.yml
name: Type Check

on: [push, pull_request]

jobs:
  type-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - run: npm ci
      - run: npm run build --if-present

      - name: Type Coverage
        run: npx type-coverage --at-least 90 --strict

      - name: TypeScript Compile
        run: npx tsc --noEmit
```

### 3. Track Any Usage

```typescript
// Create a utility to mark intentional any usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IntentionalAny = any;

// Document why any is needed
interface LegacyApiResponse {
  // TODO: Type this properly when API documentation is available
  data: IntentionalAny;
}

// Use comments for tracking
function processLegacyData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API, to be typed in #123
  data: any
): void {
  // ...
}
```

### 4. Prefer unknown Over any

```typescript
// BAD: Using any loses all type safety
function parseJSON(text: string): any {
  return JSON.parse(text);
}

const data = parseJSON('{"name": "John"}');
data.foo.bar.baz;  // No error, but will crash at runtime

// GOOD: Using unknown forces type checking
function parseJSON(text: string): unknown {
  return JSON.parse(text);
}

const data = parseJSON('{"name": "John"}');
// data.name;  // Error: 'data' is of type 'unknown'

// Must narrow the type first
if (typeof data === "object" && data !== null && "name" in data) {
  console.log((data as { name: unknown }).name);
}
```

### 5. Create Type Guards Library

```typescript
// src/utils/type-guards.ts

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isArray<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(itemGuard);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is { [P in K]: unknown } {
  return isObject(obj) && key in obj;
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// Combine guards
export function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    hasProperty(value, "id") &&
    isString(value.id) &&
    hasProperty(value, "name") &&
    isString(value.name)
  );
}
```

## Common Pitfalls

### 1. Type Assertions Masking Issues

```typescript
// BAD: Assertion hides the actual problem
const data = fetchData() as User;  // If fetchData returns any, still no safety

// GOOD: Validate at runtime
const data = fetchData();
if (!isUser(data)) {
  throw new Error("Invalid user data");
}
// Now data is typed as User with actual guarantee
```

### 2. Index Signatures Leaking any

```typescript
// BAD: Index signature effectively makes values any
interface Config {
  [key: string]: any;
}

// BETTER: Restrict the value types
interface Config {
  [key: string]: string | number | boolean;
}

// BEST: Use known keys with optional properties
interface Config {
  timeout?: number;
  retries?: number;
  debug?: boolean;
  endpoint?: string;
}
```

### 3. Generics Defaulting to unknown

```typescript
// Problem: Generic defaults to unknown, not useful
function process<T>(data: T): T {
  // Can't do anything with data
  return data;
}

// Solution: Add constraints
function process<T extends { id: string }>(data: T): T {
  console.log(data.id);  // Now we can access id
  return data;
}
```

### 4. Event Handlers Losing Types

```typescript
// BAD: Event handlers often have any types
document.addEventListener("click", (event) => {
  event.target.value;  // target is EventTarget | null, not typed
});

// GOOD: Use type assertions or guards
document.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    console.log(target.value);  // Now properly typed
  }
});
```

## Performance Considerations

### Compile-Time Impact

Higher type coverage can increase compile time:

```json
// Optimize TypeScript compiler for large projects
{
  "compilerOptions": {
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo"
  }
}
```

### Runtime Validation Overhead

```typescript
// Consider when to validate
// - Always validate at application boundaries (API, user input)
// - Skip internal function calls where types are guaranteed
// - Use development-only assertions for internal checks

function validateInDev<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  message: string
): T {
  if (process.env.NODE_ENV === "development") {
    if (!guard(value)) {
      throw new Error(message);
    }
  }
  return value as T;
}
```

## Practical Scenarios

### Scenario 1: Legacy Code Integration

```typescript
// Wrapping legacy code with type-safe interfaces

// legacy-analytics.js (untyped)
// export function track(event, properties) { ... }

// typed-analytics.ts
import { track as legacyTrack } from "./legacy-analytics";

interface AnalyticsEvent {
  name: string;
  properties: Record<string, string | number | boolean>;
  timestamp?: Date;
}

export function track(event: AnalyticsEvent): void {
  legacyTrack(event.name, {
    ...event.properties,
    timestamp: (event.timestamp ?? new Date()).toISOString()
  });
}

// Type-safe event definitions
interface TrackingEvents {
  pageView: { path: string; referrer?: string };
  buttonClick: { buttonId: string; label: string };
  purchase: { productId: string; price: number; quantity: number };
}

export function trackEvent<E extends keyof TrackingEvents>(
  eventName: E,
  properties: TrackingEvents[E]
): void {
  track({
    name: eventName,
    properties: properties as Record<string, string | number | boolean>
  });
}

// Usage with full type safety
trackEvent("pageView", { path: "/home" });
trackEvent("purchase", { productId: "123", price: 29.99, quantity: 2 });
// trackEvent("purchase", { productId: "123" });  // Error: missing price and quantity
```

### Scenario 2: Form Handling

```typescript
// Type-safe form handling

interface FormField<T> {
  value: T;
  error: string | null;
  touched: boolean;
}

interface FormState<T extends Record<string, unknown>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isSubmitting: boolean;
}

type FieldValidator<T> = (value: T) => string | null;

interface FormConfig<T extends Record<string, unknown>> {
  initialValues: T;
  validators: { [K in keyof T]?: FieldValidator<T[K]> };
  onSubmit: (values: T) => Promise<void>;
}

function createForm<T extends Record<string, unknown>>(
  config: FormConfig<T>
): {
  state: FormState<T>;
  setField: <K extends keyof T>(field: K, value: T[K]) => void;
  submit: () => Promise<void>;
} {
  const fields = {} as FormState<T>["fields"];

  for (const key of Object.keys(config.initialValues) as Array<keyof T>) {
    fields[key] = {
      value: config.initialValues[key],
      error: null,
      touched: false
    };
  }

  const state: FormState<T> = {
    fields,
    isValid: true,
    isSubmitting: false
  };

  function setField<K extends keyof T>(field: K, value: T[K]): void {
    state.fields[field].value = value;
    state.fields[field].touched = true;

    const validator = config.validators[field];
    if (validator) {
      state.fields[field].error = validator(value);
    }

    updateValidity();
  }

  function updateValidity(): void {
    state.isValid = Object.values(state.fields).every(
      (field) => (field as FormField<unknown>).error === null
    );
  }

  async function submit(): Promise<void> {
    if (!state.isValid || state.isSubmitting) return;

    state.isSubmitting = true;

    const values = {} as T;
    for (const key of Object.keys(state.fields) as Array<keyof T>) {
      values[key] = state.fields[key].value;
    }

    try {
      await config.onSubmit(values);
    } finally {
      state.isSubmitting = false;
    }
  }

  return { state, setField, submit };
}

// Usage
interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const form = createForm<LoginForm>({
  initialValues: {
    email: "",
    password: "",
    rememberMe: false
  },
  validators: {
    email: (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Invalid email",
    password: (value) =>
      value.length >= 8 ? null : "Password must be at least 8 characters"
  },
  onSubmit: async (values) => {
    await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify(values)
    });
  }
});

// Type-safe field access
form.setField("email", "user@example.com");
form.setField("password", "secretpassword");
form.setField("rememberMe", true);
// form.setField("email", 123);  // Error: number not assignable to string
// form.setField("invalid", "value");  // Error: invalid field name
```

## Interview Key Points

### Q1: What is type coverage and why does it matter?

**Key Points**:
- Type coverage measures the percentage of code with known types vs `any`
- High coverage means more compile-time error detection
- It's different from type safety (coverage is breadth, safety is correctness)
- Tools like type-coverage can measure and enforce thresholds

### Q2: What are the main sources of `any` in TypeScript code?

**Key Points**:
- Implicit any from missing type annotations
- JSON.parse() and API responses returning any
- Third-party libraries without type definitions
- Dynamic object access with string keys
- Event handlers and DOM APIs
- Type assertions to any to silence errors

### Q3: How do you improve type coverage in an existing project?

**Key Points**:
- Enable strict compiler options incrementally
- Use ESLint rules to catch any usage
- Create type guards for runtime validation
- Add declaration files for untyped dependencies
- Replace any with unknown and narrow types
- Set coverage thresholds in CI/CD

### Q4: When is it acceptable to use `any`?

**Key Points**:
- Temporary during migration (with tracking)
- Complex generic type situations where proper typing is prohibitively difficult
- Interfacing with truly dynamic external systems
- Always document why and plan to remove
- Prefer unknown over any when possible

### Q5: How do you ensure type safety at runtime?

**Key Points**:
- Use type guards for runtime validation
- Validate at application boundaries (API, user input)
- Use validation libraries like Zod, io-ts
- Create assertion functions for internal checks
- Combine compile-time types with runtime checks

## Further Reading

- [type-coverage Tool](https://github.com/nicholasserra/type-coverage)
- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)
- [Zod - TypeScript-first Schema Validation](https://zod.dev/)
- [io-ts - Runtime Type System](https://github.com/gcanti/io-ts)
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Effective TypeScript - Item 43: Prefer Type-Safe Approaches to Monkey Patching](https://effectivetypescript.com/)
- [Total TypeScript - Zod Tutorial](https://www.totaltypescript.com/tutorials/zod)
