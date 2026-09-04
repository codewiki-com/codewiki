---
title: "TypeScript Literal Types: Precision in Type Safety"
description: "Master TypeScript literal types for precise type constraints: string, number, boolean literals, and advanced patterns for type-safe code"
track: typescript
section: type-system
difficulty: intermediate
tags:
  - literal types
  - type safety
  - string literals
  - number literals
  - union types
  - type narrowing
status: imported
origin: old/src/content/docs/typescript/literal-types.en.md
divergence: 0.234
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: TypeScript
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

TypeScript literal types allow you to specify that a variable must have one of a specific set of literal values. Rather than accepting any string or number, you can restrict values to exact literals like `"success"` or `200`, creating more precise and self-documenting code. This comprehensive guide explores literal types, their applications, best practices, and advanced patterns for building robust, type-safe applications.

## Concept Explanation

Literal types represent exact, unchanging values in your code. Instead of using broad types like `string` or `number`, literal types let you specify precisely which values are acceptable. This provides TypeScript with enough information to catch errors at compile time that would otherwise slip through.

### What Are Literal Types?

A literal type is a specific value that serves as its own type. TypeScript recognizes four kinds of literal types:

- **String Literals**: Specific string values
- **Number Literals**: Specific numeric values
- **Boolean Literals**: `true` or `false` specifically
- **BigInt Literals**: Specific BigInt values (TypeScript 4.4+)

```typescript
// String literal
type Status = "pending" | "approved" | "rejected";
let currentStatus: Status = "pending"; // Valid
// currentStatus = "invalid"; // Error: not assignable

// Number literal
type HttpStatus = 200 | 201 | 400 | 404 | 500;
let code: HttpStatus = 200; // Valid
// code = 201; // Valid
// code = 199; // Error: not assignable

// Boolean literal
type Debuggable = true;
let isDebug: Debuggable = true; // Valid
// isDebug = false; // Error: not assignable

// Union of different literal types
type Response = "success" | "error" | 200 | 201 | false;
let response: Response = "success"; // Valid
let code2: Response = 200; // Valid
let error: Response = false; // Valid
```

## Core Principles

### Type Narrowing and Literal Types

Literal types work hand-in-hand with type narrowing. When you check a variable against a specific literal value, TypeScript narrows the type appropriately.

```typescript
type Direction = "up" | "down" | "left" | "right";

function move(direction: Direction): void {
  if (direction === "up") {
    // direction is narrowed to type "up"
    console.log("Moving upward");
  } else if (direction === "down") {
    // direction is narrowed to type "down"
    console.log("Moving downward");
  }
}

// With switch statements
function handleDirection(dir: Direction): string {
  switch (dir) {
    case "up":
      return "Move up";
    case "down":
      return "Move down";
    case "left":
      return "Move left";
    case "right":
      return "Move right";
    // TypeScript ensures all cases are handled
  }
}
```

### Inference and Literal Type Widening

By default, TypeScript "widens" literal values to their general type. Understanding when widening happens is crucial.

```typescript
// Without explicit type annotation, TypeScript widens the type
const url = "https://api.example.com"; // type: string
const port = 3000; // type: number

// With explicit literal type annotation
const apiUrl: "https://api.example.com" = "https://api.example.com"; // type: literal
const defaultPort: 3000 = 3000; // type: literal

// Using 'as const' prevents widening
const config = {
  apiUrl: "https://api.example.com" as const, // literal
  port: 3000 as const, // literal
  timeout: 5000 as const // literal
} as const; // Makes all properties literal
```

### `as const` for Automatic Literal Inference

The `as const` assertion is powerful for creating literal types without explicit annotations.

```typescript
// Without as const
const colors = ["red", "green", "blue"]; // type: string[]

// With as const
const colorLiterals = ["red", "green", "blue"] as const;
// type: readonly ["red", "green", "blue"]

// Extracting literals from as const
type ColorType = typeof colorLiterals[number]; // "red" | "green" | "blue"

// Objects with as const
const permissions = {
  read: "read",
  write: "write",
  delete: "delete"
} as const;

type Permission = typeof permissions[keyof typeof permissions];
// "read" | "write" | "delete"
```

## Key Points

### String Literal Types

String literals are the most common form of literal types, perfect for representing fixed options.

```typescript
// Simple example
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface ApiRequest {
  url: string;
  method: HttpMethod;
  body?: unknown;
}

const request: ApiRequest = {
  url: "https://api.example.com/users",
  method: "POST", // Valid
  body: { name: "John" }
};

// request.method = "OPTIONS"; // Error: not assignable

// Practical example: Event handlers
type EventType = "click" | "change" | "submit" | "focus" | "blur";
type EventHandler = (event: EventType, callback: () => void) => void;

const registerHandler: EventHandler = (event, callback) => {
  // Type-safe event registration
  document.addEventListener(event, callback as EventListener);
};
```

### Number Literal Types

Number literals are useful for HTTP status codes, error codes, and fixed numeric values.

```typescript
// HTTP status codes
type SuccessStatus = 200 | 201 | 202 | 204;
type ClientErrorStatus = 400 | 401 | 403 | 404;
type ServerErrorStatus = 500 | 502 | 503;

type HttpStatus = SuccessStatus | ClientErrorStatus | ServerErrorStatus;

interface HttpResponse {
  status: HttpStatus;
  data: unknown;
}

function handleResponse(response: HttpResponse): void {
  if (response.status === 200 || response.status === 201) {
    console.log("Success:", response.data);
  } else if (response.status >= 400 && response.status < 500) {
    console.log("Client error");
  } else {
    console.log("Server error");
  }
}

// Enum alternative using number literals
type Priority = 1 | 2 | 3 | 4 | 5;
const priorityLabels: Record<Priority, string> = {
  1: "Lowest",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Highest"
};
```

### Boolean Literal Types

Boolean literals are less common but useful for specific true/false requirements.

```typescript
// Strict true requirement
function enableDebugMode(debug: true): void {
  console.log("Debug mode enabled");
}

enableDebugMode(true); // Valid
// enableDebugMode(false); // Error

// Union of boolean literals
type Environment = "development" | "production";
type IsProduction = Environment extends "production" ? true : false;

// Practical use case: Feature flags
interface FeatureFlags {
  darkMode: boolean;
  betaFeatures: boolean;
  analytics: true; // Always required to be true
}

const config: FeatureFlags = {
  darkMode: false,
  betaFeatures: true,
  analytics: true // Must be true
};
```

### Mixed Literal Union Types

Combining different literal types creates powerful, expressive type definitions.

```typescript
// Mixed literals
type RequestStatus = "idle" | "loading" | "success" | "error" | 0 | 1;

// More practical example: Tagged unions
type Action =
  | { type: "SET_USER"; payload: { id: number; name: string } }
  | { type: "LOGOUT"; payload: null }
  | { type: "UPDATE_SETTINGS"; payload: Record<string, unknown> };

function reducer(state: unknown, action: Action): unknown {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "LOGOUT":
      return { ...state, user: null };
    case "UPDATE_SETTINGS":
      return { ...state, settings: action.payload };
  }
}

// Response types with literal status
type SuccessResponse<T> = {
  status: "success";
  code: 200 | 201;
  data: T;
};

type ErrorResponse = {
  status: "error";
  code: 400 | 404 | 500;
  message: string;
};

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

## Code Examples

### Complete REST API Client with Literal Types

```typescript
// Define all HTTP methods as literal types
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";
type ContentType = "application/json" | "application/x-www-form-urlencoded" | "text/plain";
type ApiStatus = "pending" | "loading" | "success" | "error";

// Specific status codes
type SuccessCode = 200 | 201 | 202 | 204;
type ClientErrorCode = 400 | 401 | 403 | 404 | 422;
type ServerErrorCode = 500 | 502 | 503;
type StatusCode = SuccessCode | ClientErrorCode | ServerErrorCode;

// Request configuration
interface RequestConfig {
  url: string;
  method: HttpMethod;
  contentType?: ContentType;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

// Response wrapper
interface ApiResponse<T> {
  status: ApiStatus;
  code: StatusCode;
  data?: T;
  error?: string;
  timestamp: number;
}

// API client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${config.url}`, {
        method: config.method,
        headers: {
          "Content-Type": config.contentType || "application/json",
          ...config.headers
        },
        body: config.body ? JSON.stringify(config.body) : undefined
      });

      const data = await response.json();

      if (response.ok) {
        return {
          status: "success" as const,
          code: response.status as SuccessCode,
          data: data as T,
          timestamp: Date.now()
        };
      } else {
        return {
          status: "error" as const,
          code: response.status as ClientErrorCode | ServerErrorCode,
          error: data.message || "Unknown error",
          timestamp: Date.now()
        };
      }
    } catch (err) {
      return {
        status: "error" as const,
        code: 500 as const,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: Date.now()
      };
    }
  }

  get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: "GET", headers });
  }

  post<T>(url: string, body: unknown, contentType?: ContentType): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: "POST", body, contentType });
  }

  put<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: "PUT", body });
  }

  delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: "DELETE" });
  }
}

// Usage
const client = new ApiClient("https://api.example.com");

interface User {
  id: number;
  name: string;
  email: string;
}

(async () => {
  const response = await client.get<User>("/users/1");

  if (response.status === "success") {
    console.log("User:", response.data);
  } else {
    console.error("Error:", response.error);
  }
})();
```

### State Machine with Literal Types

```typescript
// Define state types
type UserState = "unauthenticated" | "authenticating" | "authenticated" | "error";
type LoadingState = "idle" | "loading" | "success" | "failure";
type ModalState = "open" | "closing" | "closed";

// Create a discriminated union for complex states
type AppState =
  | { user: "unauthenticated" }
  | { user: "authenticating"; email: string }
  | { user: "authenticated"; id: number; email: string }
  | { user: "error"; message: string };

// State transitions
type StateTransition =
  | { from: "unauthenticated"; to: "authenticating"; email: string }
  | { from: "authenticating"; to: "authenticated"; id: number; email: string }
  | { from: "authenticating"; to: "error"; message: string }
  | { from: "authenticated"; to: "unauthenticated" }
  | { from: "error"; to: "unauthenticated" };

class StateMachine {
  private state: AppState = { user: "unauthenticated" };

  transition(input: StateTransition): void {
    // TypeScript ensures valid transitions
    switch (true) {
      case input.from === "unauthenticated" && input.to === "authenticating":
        this.state = { user: "authenticating", email: input.email };
        break;
      case input.from === "authenticating" && input.to === "authenticated":
        this.state = {
          user: "authenticated",
          id: input.id,
          email: input.email
        };
        break;
      case input.from === "authenticating" && input.to === "error":
        this.state = { user: "error", message: input.message };
        break;
      case input.from === "authenticated" && input.to === "unauthenticated":
        this.state = { user: "unauthenticated" };
        break;
      case input.from === "error" && input.to === "unauthenticated":
        this.state = { user: "unauthenticated" };
        break;
    }
  }

  getState(): AppState {
    return this.state;
  }
}

// Type-safe state management
const machine = new StateMachine();
machine.transition({
  from: "unauthenticated",
  to: "authenticating",
  email: "user@example.com"
});
```

### Form Validation with Literal Types

```typescript
// Field validation levels
type ValidationLevel = "error" | "warning" | "info" | "success";
type FieldType = "text" | "email" | "password" | "number" | "checkbox" | "select";
type ValidationRule = "required" | "email" | "minLength" | "maxLength" | "pattern" | "custom";

// Validation result
interface ValidationResult {
  isValid: boolean;
  level: ValidationLevel;
  message: string;
}

// Field configuration
interface FieldConfig {
  name: string;
  type: FieldType;
  required: boolean;
  validators: ValidationRule[];
  errorMessage?: string;
}

// Form state
type FormState = "pristine" | "dirty" | "validating" | "valid" | "invalid";

class FormValidator {
  private fields: Map<string, FieldConfig> = new Map();
  private state: FormState = "pristine";

  addField(config: FieldConfig): void {
    this.fields.set(config.name, config);
  }

  validate(fieldName: string, value: unknown): ValidationResult {
    const field = this.fields.get(fieldName);
    if (!field) {
      return { isValid: false, level: "error", message: "Field not found" };
    }

    // Type-based validation
    switch (field.type) {
      case "email":
        return this.validateEmail(value as string);
      case "number":
        return this.validateNumber(value as number);
      case "password":
        return this.validatePassword(value as string);
      default:
        return this.validateText(value as string, field);
    }
  }

  private validateEmail(value: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        isValid: false,
        level: "error",
        message: "Invalid email format"
      };
    }
    return {
      isValid: true,
      level: "success",
      message: "Valid email"
    };
  }

  private validatePassword(value: string): ValidationResult {
    if (value.length < 8) {
      return {
        isValid: false,
        level: "warning",
        message: "Password should be at least 8 characters"
      };
    }
    return {
      isValid: true,
      level: "success",
      message: "Strong password"
    };
  }

  private validateNumber(value: number): ValidationResult {
    if (isNaN(value)) {
      return {
        isValid: false,
        level: "error",
        message: "Invalid number"
      };
    }
    return {
      isValid: true,
      level: "success",
      message: "Valid number"
    };
  }

  private validateText(value: string, field: FieldConfig): ValidationResult {
    if (field.required && !value) {
      return {
        isValid: false,
        level: "error",
        message: "This field is required"
      };
    }
    return {
      isValid: true,
      level: "success",
      message: "Valid"
    };
  }
}

// Usage
const validator = new FormValidator();
validator.addField({
  name: "email",
  type: "email",
  required: true,
  validators: ["required", "email"]
});

const emailResult = validator.validate("email", "user@example.com");
console.log(emailResult); // { isValid: true, level: "success", message: "Valid email" }
```

### Configuration Builder Pattern

```typescript
// Define configuration options as literal types
type Environment = "development" | "staging" | "production";
type LogLevel = "debug" | "info" | "warn" | "error";
type DatabaseDriver = "postgresql" | "mysql" | "mongodb";
type CacheProvider = "redis" | "memcached" | "memory";

// Configuration interface
interface AppConfig {
  env: Environment;
  port: 3000 | 3001 | 3002 | 8000 | 8080;
  logLevel: LogLevel;
  database: {
    driver: DatabaseDriver;
    host: string;
    port: number;
  };
  cache: {
    provider: CacheProvider;
    ttl: number;
  };
}

// Configuration builder with type safety
class ConfigBuilder {
  private config: Partial<AppConfig> = {};

  setEnvironment(env: Environment): this {
    this.config.env = env;
    return this;
  }

  setPort(port: 3000 | 3001 | 3002 | 8000 | 8080): this {
    this.config.port = port;
    return this;
  }

  setLogLevel(level: LogLevel): this {
    this.config.logLevel = level;
    return this;
  }

  setDatabase(driver: DatabaseDriver, host: string, port: number): this {
    this.config.database = { driver, host, port };
    return this;
  }

  setCache(provider: CacheProvider, ttl: number): this {
    this.config.cache = { provider, ttl };
    return this;
  }

  build(): AppConfig {
    if (!this.config.env || !this.config.port || !this.config.logLevel ||
        !this.config.database || !this.config.cache) {
      throw new Error("Incomplete configuration");
    }
    return this.config as AppConfig;
  }
}

// Usage
const config = new ConfigBuilder()
  .setEnvironment("production")
  .setPort(8080)
  .setLogLevel("info")
  .setDatabase("postgresql", "localhost", 5432)
  .setCache("redis", 3600)
  .build();
```

## Best Practices

### Use `as const` for Constants

```typescript
// Good: Using as const for constants
const API_ENDPOINTS = {
  users: "/users",
  posts: "/posts",
  comments: "/comments"
} as const;

type Endpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];
// type: "/users" | "/posts" | "/comments"

// Avoid: Without as const, types are too broad
const API_ENDPOINTS_BAD = {
  users: "/users",
  posts: "/posts",
  comments: "/comments"
};

type EndpointBad = typeof API_ENDPOINTS_BAD[keyof typeof API_ENDPOINTS_BAD];
// type: string (not specific literals)
```

### Create Type-Safe Unions with Enums Alternative

```typescript
// Using literal types instead of enums
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// This is often better than:
// enum HttpMethod {
//   GET = "GET",
//   POST = "POST",
//   ...
// }

// Benefits:
// - No extra runtime value
// - Easier to work with as strings
// - Can directly use with union types
// - Type-safe without enum overhead

// Helper to extract values
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type Method = typeof HTTP_METHODS[number];
```

### Combine Literals with Discriminated Unions

```typescript
// Discriminated unions are powerful with literal types
type Circle = { kind: "circle"; radius: number };
type Square = { kind: "square"; sideLength: number };
type Triangle = { kind: "triangle"; base: number; height: number };

type Shape = Circle | Square | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.sideLength ** 2;
    case "triangle":
      return (shape.base * shape.height) / 2;
  }
}

// Type-safe factory
function createShape(kind: "circle" | "square" | "triangle", ...args: number[]): Shape {
  switch (kind) {
    case "circle":
      return { kind, radius: args[0] };
    case "square":
      return { kind, sideLength: args[0] };
    case "triangle":
      return { kind, base: args[0], height: args[1] };
  }
}
```

### Leverage Type Guards with Literals

```typescript
// Type guard function
function isSuccessResponse<T>(
  response: SuccessResponse<T> | ErrorResponse
): response is SuccessResponse<T> {
  return response.status === "success";
}

function handleApiResponse<T>(response: SuccessResponse<T> | ErrorResponse): void {
  if (isSuccessResponse(response)) {
    // Type narrowed to SuccessResponse<T>
    console.log("Data:", response.data);
  } else {
    // Type narrowed to ErrorResponse
    console.error("Error:", response.message);
  }
}

// In operator with literal types
type Config1 = { type: "api"; url: string };
type Config2 = { type: "file"; path: string };
type Config = Config1 | Config2;

function getSource(config: Config): string {
  if (config.type === "api") {
    return config.url;
  } else {
    return config.path;
  }
}
```

### Create Type Aliases for Better Readability

```typescript
// Good: Clear, readable type aliases
type Environment = "development" | "staging" | "production";
type LogLevel = "debug" | "info" | "warn" | "error";
type HttpStatus = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 500 | 502 | 503;

interface AppConfig {
  env: Environment;
  logLevel: LogLevel;
}

interface HttpResponse {
  status: HttpStatus;
  body: unknown;
}

// Avoid: Inline literals everywhere
interface BadConfig {
  env: "development" | "staging" | "production"; // Hard to reuse
  logLevel: "debug" | "info" | "warn" | "error"; // Duplicated
}
```

## Common Pitfalls

### Type Widening Issues

```typescript
// Problem: Type widening in object literals
const config = {
  env: "production", // type: string (widened)
  port: 8080 // type: number (widened)
};

function startServer(env: "development" | "production", port: 3000 | 8080) {
  // Error: string is not assignable to type "development" | "production"
  // Error: number is not assignable to type 3000 | 8080
}

startServer(config.env, config.port);

// Solution 1: Use as const
const configFixed = {
  env: "production" as const,
  port: 8080 as const
};

startServer(configFixed.env, configFixed.port); // Works!

// Solution 2: Annotate the object type
const configAnnotated: {
  env: "development" | "production";
  port: 3000 | 8080;
} = {
  env: "production",
  port: 8080
};

startServer(configAnnotated.env, configAnnotated.port); // Works!
```

### Function Parameter Inference Issues

```typescript
// Problem: Inferred parameter types are too broad
const handleEvent = (event: string) => {
  // event has type string, not specific literals
  console.log(event);
};

// Solution: Be explicit with literal type parameters
const handleEventFixed = (event: "click" | "change" | "submit") => {
  // event is now correctly typed
  console.log(event);
};

// Or use callback with inferred literals
const createHandler = <T extends string>(
  event: T
) => {
  return () => console.log(event);
};

const handler = createHandler("click"); // T inferred as "click"
```

### Exhaustiveness Checking Failures

```typescript
// Problem: Missing cases not caught
type Status = "pending" | "success" | "error" | "timeout";

function handleStatus(status: Status): string {
  switch (status) {
    case "pending":
      return "Waiting...";
    case "success":
      return "Done!";
    case "error":
      return "Failed!";
    // Missing "timeout" case - no error!
  }
}

// Solution: Use never for exhaustiveness checking
function handleStatusFixed(status: Status): string {
  switch (status) {
    case "pending":
      return "Waiting...";
    case "success":
      return "Done!";
    case "error":
      return "Failed!";
    case "timeout":
      return "Timed out!";
    default:
      const _exhaustive: never = status;
      return _exhaustive;
  }
}

// Now if you add a case, TypeScript will error if it's not handled
```

### Mixing Loose and Strict Literal Usage

```typescript
// Problem: Inconsistent literal usage
interface Request {
  method: "GET" | "POST" | "PUT" | "DELETE"; // Strict literal
  url: string; // Loose string
  body?: unknown;
}

const req: Request = {
  method: "GET",
  url: "https://api.example.com" // No type safety
};

// Solution: Be consistent
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Endpoint = "/users" | "/posts" | "/comments";

interface StrictRequest {
  method: Method;
  endpoint: Endpoint;
  body?: unknown;
}

const strictReq: StrictRequest = {
  method: "GET",
  endpoint: "/users"
};
```

### Over-Specification Leading to Rigidity

```typescript
// Problem: Too specific literals reduce flexibility
type UserRole = "admin" | "user" | "guest";
type Permission = "read" | "write" | "delete" | "admin";

interface User {
  role: UserRole;
  permissions: Permission[]; // Now it's hard to add new roles/permissions
}

// Solution: Separate core types from extensible patterns
type BaseUserRole = "admin" | "user" | "guest";
type UserRole = BaseUserRole | string; // Allow custom roles

type BasePermission = "read" | "write" | "delete";
type Permission = BasePermission | string; // Allow custom permissions

// Or use Branded Types for more flexibility
type Permission = string & { readonly __brand: "Permission" };

function isValidPermission(perm: string): perm is Permission {
  return ["read", "write", "delete", "admin"].includes(perm);
}
```

## Performance Considerations

### Compilation Speed

```typescript
// Good: Literal types compile quickly
type Status = "pending" | "success" | "error";

// Avoid: Very large literal unions
type BadStatus =
  | "status0" | "status1" | "status2" | "status3" | "status4"
  | "status5" | "status6" | "status7" | "status8" | "status9"
  // ... hundreds more

// Better: Group related literals
type StatusGroup = "pending" | "loading" | "success" | "error";
type DetailedStatus = `${StatusGroup}:${number}`;
```

### Memory Usage

```typescript
// Literal types are zero-cost abstractions
// They compile away to runtime code with no overhead

type Status = "pending" | "success" | "error";

const checkStatus = (status: Status): string => {
  // At runtime, this is just a string
  // Type checking happens at compile-time only
  return status === "pending" ? "Waiting..." : "Done!";
};

// No runtime representation of the type union
```

### Type Inference Optimization

```typescript
// Use const contexts to keep types specific
// This is faster than generalizing then narrowing

// Fast: Specific from the start
const config: { env: "production"; port: 8080 } = {
  env: "production",
  port: 8080
};

// Slower: Generalize then narrow
const configGeneral: { env: string; port: number } = {
  env: "production",
  port: 8080
};

if (configGeneral.env === "production") {
  // Now TypeScript must narrow the type
}
```

## Real-world Scenarios

### React Component Props with Literal Types

```typescript
// React component using literal types for prop variants
type ButtonSize = "small" | "medium" | "large";
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonState = "idle" | "loading" | "disabled" | "error";

interface ButtonProps {
  size: ButtonSize;
  variant: ButtonVariant;
  state: ButtonState;
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  size,
  variant,
  state,
  onClick,
  children
}) => {
  const sizeClasses: Record<ButtonSize, string> = {
    small: "px-2 py-1 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg"
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-blue-500 text-white",
    secondary: "bg-gray-200 text-black",
    danger: "bg-red-500 text-white",
    ghost: "bg-transparent border border-gray-300"
  };

  const isDisabled = state === "disabled" || state === "loading";

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {state === "loading" ? "Loading..." : children}
    </button>
  );
};

// Type-safe usage
<Button
  size="large"
  variant="primary"
  state="idle"
  onClick={() => console.log("clicked")}
>
  Click me
</Button>;
```

### GraphQL Query Type Safety

```typescript
// Type-safe GraphQL queries using literals
type QueryType = "query" | "mutation" | "subscription";
type OperationStatus = "pending" | "loading" | "success" | "error";

interface GraphQLRequest {
  query: string;
  operationType: QueryType;
  variables?: Record<string, unknown>;
}

interface GraphQLResponse<T> {
  status: OperationStatus;
  data?: T;
  errors?: Array<{ message: string; code: string }>;
}

const executeGraphQL = async <T,>(
  request: GraphQLRequest
): Promise<GraphQLResponse<T>> => {
  try {
    const response = await fetch("/graphql", {
      method: "POST",
      body: JSON.stringify({
        query: request.query,
        variables: request.variables
      })
    });

    const data = await response.json();

    return {
      status: data.errors ? "error" : "success",
      data: data.data,
      errors: data.errors
    };
  } catch (error) {
    return {
      status: "error",
      errors: [{ message: "Network error", code: "NETWORK_ERROR" }]
    };
  }
};

// Usage with type inference
const getUsersQuery: GraphQLRequest = {
  query: `query GetUsers { users { id name email } }`,
  operationType: "query"
};

const response = await executeGraphQL<{ users: Array<{ id: string; name: string; email: string }> }>(
  getUsersQuery
);

if (response.status === "success") {
  // TypeScript knows response.data is defined
  console.log(response.data.users);
}
```

### State Management (Redux-like)

```typescript
// Redux-style state management with literal types
type AppActionType = "SET_USER" | "LOGOUT" | "SET_LOADING" | "SET_ERROR";
type AppState = {
  user: { id: number; name: string } | null;
  loading: boolean;
  error: string | null;
};

type AppAction =
  | { type: "SET_USER"; payload: { id: number; name: string } }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "LOGOUT":
      return { ...state, user: null };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Dispatch with type safety
const dispatch = (action: AppAction) => {
  const newState = appReducer(initialState, action);
  console.log(newState);
};

dispatch({ type: "SET_USER", payload: { id: 1, name: "John" } });
dispatch({ type: "LOGOUT" });
dispatch({ type: "SET_LOADING", payload: true });
```

### Configuration Management System

```typescript
// Configuration with literal types and validation
type ConfigEnvironment = "development" | "staging" | "production";
type ConfigFeature = "darkMode" | "betaUI" | "analytics" | "notifications";

interface ConfigValue<T> {
  value: T;
  version: number;
  lastUpdated: 2026-01-07
}

interface AppConfiguration {
  environment: ConfigEnvironment;
  features: Partial<Record<ConfigFeature, boolean>>;
  cache: {
    ttl: 3600 | 7200 | 86400;
    strategy: "lru" | "lfu" | "fifo";
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    format: "json" | "text" | "csv";
  };
}

class ConfigManager {
  private config: AppConfiguration;
  private history: Array<{
    timestamp: Date;
    changes: string[];
  }> = [];

  constructor(initialConfig: AppConfiguration) {
    this.config = initialConfig;
  }

  setEnvironment(env: ConfigEnvironment): void {
    this.config.environment = env;
    this.recordChange(`environment changed to ${env}`);
  }

  setFeature(feature: ConfigFeature, enabled: boolean): void {
    this.config.features[feature] = enabled;
    this.recordChange(`feature ${feature} ${enabled ? "enabled" : "disabled"}`);
  }

  setLogLevel(level: "debug" | "info" | "warn" | "error"): void {
    this.config.logging.level = level;
    this.recordChange(`log level changed to ${level}`);
  }

  getConfig(): AppConfiguration {
    return this.config;
  }

  private recordChange(change: string): void {
    const lastEntry = this.history[this.history.length - 1];
    if (lastEntry && lastEntry.timestamp.getTime() === Date.now()) {
      lastEntry.changes.push(change);
    } else {
      this.history.push({
        timestamp: new Date(),
        changes: [change]
      });
    }
  }
}

// Usage
const configManager = new ConfigManager({
  environment: "production",
  features: { darkMode: true, analytics: true },
  cache: { ttl: 3600, strategy: "lru" },
  logging: { level: "info", format: "json" }
});

configManager.setEnvironment("staging");
configManager.setFeature("betaUI", true);
configManager.setLogLevel("debug");
```

## Interview Points

### What are literal types and why are they useful?

Literal types are specific values that serve as their own types in TypeScript. They're useful because they:

- Provide stricter type safety than general types like `string` or `number`
- Enable better type inference and narrowing
- Make code more self-documenting
- Catch errors at compile-time that would otherwise occur at runtime
- Enable exhaustiveness checking in switch statements

### Explain the difference between literal types and enums

Literal types and enums both restrict values to specific options, but:

**Literal Types:**
- Compile to nothing at runtime
- Are zero-cost abstractions
- Use union syntax (`"option1" | "option2"`)
- Work directly with strings/numbers
- More flexible for complex type combinations

**Enums:**
- Generate runtime JavaScript objects
- Have runtime representation
- Use enum syntax
- Create a namespace
- Slightly heavier but can have computed values

```typescript
// Literal type (no runtime cost)
type Method = "GET" | "POST";
const method: Method = "GET";

// Enum (creates runtime object)
enum MethodEnum {
  GET = "GET",
  POST = "POST"
}
const method2: MethodEnum = MethodEnum.GET;
```

### What is `as const` and when should it be used?

`as const` is a TypeScript assertion that tells the compiler to treat values as literals rather than generalizing them:

```typescript
// Without as const - types are generalized
const config = { env: "prod" }; // type: { env: string }

// With as const - types are specific literals
const config2 = { env: "prod" } as const; // type: { readonly env: "prod" }
```

Use `as const`:
- For configuration objects
- For constant arrays
- When you need exact literal types from object properties
- For creating type-safe lookup objects

### How do literal types enable exhaustiveness checking?

Literal types in union types allow TypeScript to verify that all cases are handled:

```typescript
type Status = "pending" | "success" | "error";

function handle(status: Status) {
  switch (status) {
    case "pending":
      return "Waiting...";
    case "success":
      return "Done!";
    case "error":
      return "Failed!";
    default:
      const _: never = status; // Error if any case is missing
  }
}
```

If a new literal is added to the union, TypeScript will force you to handle it.

### Describe a practical use case for discriminated unions with literal types

A common use case is Redux-style action dispatching:

```typescript
type Action =
  | { type: "SET_USER"; payload: User }
  | { type: "LOGOUT" }
  | { type: "SET_ERROR"; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_USER":
      // action.payload is User here, type narrowing works perfectly
      return { ...state, user: action.payload };
    case "LOGOUT":
      return { ...state, user: null };
    case "SET_ERROR":
      // action.payload is string here
      return { ...state, error: action.payload };
  }
};
```

The `type` field acts as a discriminator, allowing TypeScript to narrow each action's payload type.

## Further Reading

### TypeScript Official Documentation
- [TypeScript Handbook: Literal Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
- [TypeScript Handbook: Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [TypeScript Handbook: Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

### Related Concepts
- **Discriminated Unions**: Combine literal types with object properties for powerful type discrimination
- **Type Guards**: Use literal type checks to narrow types within conditional blocks
- **Exhaustiveness Checking**: Leverage the `never` type with literal unions
- **Branded Types**: Create distinct types from primitive values for additional safety

### Best Practices Articles
- Using `as const` for runtime-safe type definitions
- Redux pattern type safety with discriminated unions
- Form validation with literal type constraints
- API response handling with status code literals

### Practice Exercises
1. Create a type-safe state machine using literal types
2. Build a validated form with error states using literal types
3. Implement a Redux-like state management with discriminated unions
4. Design an API client with HTTP method and status code literals
5. Create a plugin system with literal action types

Literal types are a powerful feature that bridges the gap between flexibility and type safety. By constraining values to specific literals, you create code that is simultaneously more restrictive and more expressive, catching errors at compile-time while making your code's behavior crystal clear.
