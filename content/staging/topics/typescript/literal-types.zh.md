---
title: TypeScript 字面量类型：类型安全的精确性
description: 掌握 TypeScript 字面量类型以实现精确的类型约束：字符串、数字、布尔字面量，以及类型安全代码的高级模式
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
origin: old/src/content/docs/typescript/literal-types.zh.md
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

TypeScript 字面量类型允许你指定变量必须具有特定字面值集合中的一个值。你可以将值限制为精确的字面量，如 `"success"` 或 `200`，而不是接受任何字符串或数字，从而创建更精确和自文档化的代码。本综合指南探讨了字面量类型、它们的应用、最佳实践以及构建健壮、类型安全应用程序的高级模式。

## 概念解释

字面量类型表示代码中精确、不变的值。字面量类型不是使用 `string` 或 `number` 等宽泛类型，而是让你精确指定哪些值是可接受的。这为 TypeScript 提供了足够的信息，在编译时捕获否则会溜走的错误。

### 什么是字面量类型？

字面量类型是作为自己类型的特定值。TypeScript 识别四种字面量类型：

- **字符串字面量**：特定的字符串值
- **数字字面量**：特定的数值
- **布尔字面量**：具体的 `true` 或 `false`
- **BigInt 字面量**：特定的 BigInt 值（TypeScript 4.4+）

```typescript
// 字符串字面量
type Status = "pending" | "approved" | "rejected";
let currentStatus: Status = "pending"; // 有效
// currentStatus = "invalid"; // 错误：不可赋值

// 数字字面量
type HttpStatus = 200 | 201 | 400 | 404 | 500;
let code: HttpStatus = 200; // 有效
// code = 201; // 有效
// code = 199; // 错误：不可赋值

// 布尔字面量
type Debuggable = true;
let isDebug: Debuggable = true; // 有效
// isDebug = false; // 错误：不可赋值

// 不同字面量类型的联合
type Response = "success" | "error" | 200 | 201 | false;
let response: Response = "success"; // 有效
let code2: Response = 200; // 有效
let error: Response = false; // 有效
```

## 核心原理

### 类型收窄和字面量类型

字面量类型与类型收窄紧密配合。当你将变量与特定字面值进行比较时，TypeScript 会适当地收窄类型。

```typescript
type Direction = "up" | "down" | "left" | "right";

function move(direction: Direction): void {
  if (direction === "up") {
    // direction 被收窄为类型 "up"
    console.log("Moving upward");
  } else if (direction === "down") {
    // direction 被收窄为类型 "down"
    console.log("Moving downward");
  }
}

// 使用 switch 语句
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
    // TypeScript 确保所有情况都被处理
  }
}
```

### 推断和字面量类型拓宽

默认情况下，TypeScript 将字面值"拓宽"为它们的通用类型。理解何时发生拓宽至关重要。

```typescript
// 没有显式类型注解，TypeScript 会拓宽类型
const url = "https://api.example.com"; // 类型: string
const port = 3000; // 类型: number

// 使用显式字面量类型注解
const apiUrl: "https://api.example.com" = "https://api.example.com"; // 类型: 字面量
const defaultPort: 3000 = 3000; // 类型: 字面量

// 使用 'as const' 防止拓宽
const config = {
  apiUrl: "https://api.example.com" as const, // 字面量
  port: 3000 as const, // 字面量
  timeout: 5000 as const // 字面量
} as const; // 使所有属性成为字面量
```

### 使用 `as const` 进行自动字面量推断

`as const` 断言是创建字面量类型而无需显式注解的强大工具。

```typescript
// 没有 as const
const colors = ["red", "green", "blue"]; // 类型: string[]

// 使用 as const
const colorLiterals = ["red", "green", "blue"] as const;
// 类型: readonly ["red", "green", "blue"]

// 从 as const 提取字面量
type ColorType = typeof colorLiterals[number]; // "red" | "green" | "blue"

// 对象使用 as const
const permissions = {
  read: "read",
  write: "write",
  delete: "delete"
} as const;

type Permission = typeof permissions[keyof typeof permissions];
// "read" | "write" | "delete"
```

## 关键要点

### 字符串字面量类型

字符串字面量是最常见的字面量类型形式，非常适合表示固定选项。

```typescript
// 简单示例
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface ApiRequest {
  url: string;
  method: HttpMethod;
  body?: unknown;
}

const request: ApiRequest = {
  url: "https://api.example.com/users",
  method: "POST", // 有效
  body: { name: "John" }
};

// request.method = "OPTIONS"; // 错误：不可赋值

// 实际示例：事件处理程序
type EventType = "click" | "change" | "submit" | "focus" | "blur";
type EventHandler = (event: EventType, callback: () => void) => void;

const registerHandler: EventHandler = (event, callback) => {
  // 类型安全的事件注册
  document.addEventListener(event, callback as EventListener);
};
```

### 数字字面量类型

数字字面量对于 HTTP 状态码、错误码和固定数值非常有用。

```typescript
// HTTP 状态码
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

// 使用数字字面量作为枚举替代
type Priority = 1 | 2 | 3 | 4 | 5;
const priorityLabels: Record<Priority, string> = {
  1: "Lowest",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Highest"
};
```

### 布尔字面量类型

布尔字面量不太常见，但对于特定的 true/false 要求很有用。

```typescript
// 严格的 true 要求
function enableDebugMode(debug: true): void {
  console.log("Debug mode enabled");
}

enableDebugMode(true); // 有效
// enableDebugMode(false); // 错误

// 布尔字面量联合
type Environment = "development" | "production";
type IsProduction = Environment extends "production" ? true : false;

// 实际用例：功能开关
interface FeatureFlags {
  darkMode: boolean;
  betaFeatures: boolean;
  analytics: true; // 始终要求为 true
}

const config: FeatureFlags = {
  darkMode: false,
  betaFeatures: true,
  analytics: true // 必须为 true
};
```

### 混合字面量联合类型

组合不同的字面量类型可以创建强大、富有表现力的类型定义。

```typescript
// 混合字面量
type RequestStatus = "idle" | "loading" | "success" | "error" | 0 | 1;

// 更实际的示例：标签联合
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

// 带字面量状态的响应类型
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

## 代码示例

### 使用字面量类型的完整 REST API 客户端

```typescript
// 将所有 HTTP 方法定义为字面量类型
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";
type ContentType = "application/json" | "application/x-www-form-urlencoded" | "text/plain";
type ApiStatus = "pending" | "loading" | "success" | "error";

// 特定状态码
type SuccessCode = 200 | 201 | 202 | 204;
type ClientErrorCode = 400 | 401 | 403 | 404 | 422;
type ServerErrorCode = 500 | 502 | 503;
type StatusCode = SuccessCode | ClientErrorCode | ServerErrorCode;

// 请求配置
interface RequestConfig {
  url: string;
  method: HttpMethod;
  contentType?: ContentType;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

// 响应包装器
interface ApiResponse<T> {
  status: ApiStatus;
  code: StatusCode;
  data?: T;
  error?: string;
  timestamp: number;
}

// API 客户端类
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

// 使用
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

### 使用字面量类型的状态机

```typescript
// 定义状态类型
type UserState = "unauthenticated" | "authenticating" | "authenticated" | "error";
type LoadingState = "idle" | "loading" | "success" | "failure";
type ModalState = "open" | "closing" | "closed";

// 为复杂状态创建可辨识联合
type AppState =
  | { user: "unauthenticated" }
  | { user: "authenticating"; email: string }
  | { user: "authenticated"; id: number; email: string }
  | { user: "error"; message: string };

// 状态转换
type StateTransition =
  | { from: "unauthenticated"; to: "authenticating"; email: string }
  | { from: "authenticating"; to: "authenticated"; id: number; email: string }
  | { from: "authenticating"; to: "error"; message: string }
  | { from: "authenticated"; to: "unauthenticated" }
  | { from: "error"; to: "unauthenticated" };

class StateMachine {
  private state: AppState = { user: "unauthenticated" };

  transition(input: StateTransition): void {
    // TypeScript 确保有效的转换
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

// 类型安全的状态管理
const machine = new StateMachine();
machine.transition({
  from: "unauthenticated",
  to: "authenticating",
  email: "user@example.com"
});
```

### 使用字面量类型的表单验证

```typescript
// 字段验证级别
type ValidationLevel = "error" | "warning" | "info" | "success";
type FieldType = "text" | "email" | "password" | "number" | "checkbox" | "select";
type ValidationRule = "required" | "email" | "minLength" | "maxLength" | "pattern" | "custom";

// 验证结果
interface ValidationResult {
  isValid: boolean;
  level: ValidationLevel;
  message: string;
}

// 字段配置
interface FieldConfig {
  name: string;
  type: FieldType;
  required: boolean;
  validators: ValidationRule[];
  errorMessage?: string;
}

// 表单状态
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

    // 基于类型的验证
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

// 使用
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

### 配置构建器模式

```typescript
// 将配置选项定义为字面量类型
type Environment = "development" | "staging" | "production";
type LogLevel = "debug" | "info" | "warn" | "error";
type DatabaseDriver = "postgresql" | "mysql" | "mongodb";
type CacheProvider = "redis" | "memcached" | "memory";

// 配置接口
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

// 具有类型安全的配置构建器
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

// 使用
const config = new ConfigBuilder()
  .setEnvironment("production")
  .setPort(8080)
  .setLogLevel("info")
  .setDatabase("postgresql", "localhost", 5432)
  .setCache("redis", 3600)
  .build();
```

## 最佳实践

### 对常量使用 `as const`

```typescript
// 好：对常量使用 as const
const API_ENDPOINTS = {
  users: "/users",
  posts: "/posts",
  comments: "/comments"
} as const;

type Endpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];
// 类型: "/users" | "/posts" | "/comments"

// 避免：没有 as const，类型太宽泛
const API_ENDPOINTS_BAD = {
  users: "/users",
  posts: "/posts",
  comments: "/comments"
};

type EndpointBad = typeof API_ENDPOINTS_BAD[keyof typeof API_ENDPOINTS_BAD];
// 类型: string (不是具体的字面量)
```

### 使用枚举替代方案创建类型安全的联合

```typescript
// 使用字面量类型代替枚举
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// 这通常比以下更好：
// enum HttpMethod {
//   GET = "GET",
//   POST = "POST",
//   ...
// }

// 优点：
// - 没有额外的运行时值
// - 更容易作为字符串使用
// - 可以直接与联合类型一起使用
// - 没有枚举开销的类型安全

// 提取值的辅助方法
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type Method = typeof HTTP_METHODS[number];
```

### 将字面量与可辨识联合结合

```typescript
// 可辨识联合与字面量类型配合强大
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

// 类型安全的工厂
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

### 利用字面量的类型守卫

```typescript
// 类型守卫函数
function isSuccessResponse<T>(
  response: SuccessResponse<T> | ErrorResponse
): response is SuccessResponse<T> {
  return response.status === "success";
}

function handleApiResponse<T>(response: SuccessResponse<T> | ErrorResponse): void {
  if (isSuccessResponse(response)) {
    // 类型收窄为 SuccessResponse<T>
    console.log("Data:", response.data);
  } else {
    // 类型收窄为 ErrorResponse
    console.error("Error:", response.message);
  }
}

// 使用 in 运算符和字面量类型
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

### 创建类型别名以提高可读性

```typescript
// 好：清晰、可读的类型别名
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

// 避免：到处使用内联字面量
interface BadConfig {
  env: "development" | "staging" | "production"; // 难以重用
  logLevel: "debug" | "info" | "warn" | "error"; // 重复
}
```

## 常见陷阱

### 类型拓宽问题

```typescript
// 问题：对象字面量中的类型拓宽
const config = {
  env: "production", // 类型: string (被拓宽)
  port: 8080 // 类型: number (被拓宽)
};

function startServer(env: "development" | "production", port: 3000 | 8080) {
  // 错误: string 不可赋值给类型 "development" | "production"
  // 错误: number 不可赋值给类型 3000 | 8080
}

startServer(config.env, config.port);

// 解决方案 1：使用 as const
const configFixed = {
  env: "production" as const,
  port: 8080 as const
};

startServer(configFixed.env, configFixed.port); // 有效！

// 解决方案 2：注解对象类型
const configAnnotated: {
  env: "development" | "production";
  port: 3000 | 8080;
} = {
  env: "production",
  port: 8080
};

startServer(configAnnotated.env, configAnnotated.port); // 有效！
```

### 函数参数推断问题

```typescript
// 问题：推断的参数类型太宽泛
const handleEvent = (event: string) => {
  // event 的类型是 string，不是具体的字面量
  console.log(event);
};

// 解决方案：显式使用字面量类型参数
const handleEventFixed = (event: "click" | "change" | "submit") => {
  // event 现在被正确类型化
  console.log(event);
};

// 或使用推断字面量的回调
const createHandler = <T extends string>(
  event: T
) => {
  return () => console.log(event);
};

const handler = createHandler("click"); // T 被推断为 "click"
```

### 穷尽性检查失败

```typescript
// 问题：遗漏的情况未被捕获
type Status = "pending" | "success" | "error" | "timeout";

function handleStatus(status: Status): string {
  switch (status) {
    case "pending":
      return "Waiting...";
    case "success":
      return "Done!";
    case "error":
      return "Failed!";
    // 缺少 "timeout" 情况 - 没有错误！
  }
}

// 解决方案：使用 never 进行穷尽性检查
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

// 现在如果你添加一个情况，TypeScript 会在未处理时报错
```

### 混合宽松和严格的字面量使用

```typescript
// 问题：不一致的字面量使用
interface Request {
  method: "GET" | "POST" | "PUT" | "DELETE"; // 严格字面量
  url: string; // 宽松字符串
  body?: unknown;
}

const req: Request = {
  method: "GET",
  url: "https://api.example.com" // 没有类型安全
};

// 解决方案：保持一致
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

### 过度指定导致僵化

```typescript
// 问题：太具体的字面量减少灵活性
type UserRole = "admin" | "user" | "guest";
type Permission = "read" | "write" | "delete" | "admin";

interface User {
  role: UserRole;
  permissions: Permission[]; // 现在很难添加新角色/权限
}

// 解决方案：将核心类型与可扩展模式分开
type BaseUserRole = "admin" | "user" | "guest";
type UserRole = BaseUserRole | string; // 允许自定义角色

type BasePermission = "read" | "write" | "delete";
type Permission = BasePermission | string; // 允许自定义权限

// 或使用品牌类型获得更多灵活性
type Permission = string & { readonly __brand: "Permission" };

function isValidPermission(perm: string): perm is Permission {
  return ["read", "write", "delete", "admin"].includes(perm);
}
```

## 性能考虑

### 编译速度

```typescript
// 好：字面量类型编译快速
type Status = "pending" | "success" | "error";

// 避免：非常大的字面量联合
type BadStatus =
  | "status0" | "status1" | "status2" | "status3" | "status4"
  | "status5" | "status6" | "status7" | "status8" | "status9"
  // ... 数百个更多

// 更好：分组相关字面量
type StatusGroup = "pending" | "loading" | "success" | "error";
type DetailedStatus = `${StatusGroup}:${number}`;
```

### 内存使用

```typescript
// 字面量类型是零成本抽象
// 它们编译后不会产生运行时代码

type Status = "pending" | "success" | "error";

const checkStatus = (status: Status): string => {
  // 在运行时，这只是一个字符串
  // 类型检查只在编译时发生
  return status === "pending" ? "Waiting..." : "Done!";
};

// 类型联合没有运行时表示
```

### 类型推断优化

```typescript
// 使用 const 上下文保持类型具体
// 这比先泛化再收窄更快

// 快：从一开始就具体
const config: { env: "production"; port: 8080 } = {
  env: "production",
  port: 8080
};

// 慢：先泛化再收窄
const configGeneral: { env: string; port: number } = {
  env: "production",
  port: 8080
};

if (configGeneral.env === "production") {
  // 现在 TypeScript 必须收窄类型
}
```

## 实际场景

### 使用字面量类型的 React 组件 Props

```typescript
// 使用字面量类型为 prop 变体的 React 组件
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

// 类型安全的使用
<Button
  size="large"
  variant="primary"
  state="idle"
  onClick={() => console.log("clicked")}
>
  Click me
</Button>;
```

### GraphQL 查询类型安全

```typescript
// 使用字面量的类型安全 GraphQL 查询
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

// 带类型推断的使用
const getUsersQuery: GraphQLRequest = {
  query: `query GetUsers { users { id name email } }`,
  operationType: "query"
};

const response = await executeGraphQL<{ users: Array<{ id: string; name: string; email: string }> }>(
  getUsersQuery
);

if (response.status === "success") {
  // TypeScript 知道 response.data 已定义
  console.log(response.data.users);
}
```

### 状态管理（类 Redux）

```typescript
// 使用字面量类型的 Redux 风格状态管理
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

// 类型安全的 dispatch
const dispatch = (action: AppAction) => {
  const newState = appReducer(initialState, action);
  console.log(newState);
};

dispatch({ type: "SET_USER", payload: { id: 1, name: "John" } });
dispatch({ type: "LOGOUT" });
dispatch({ type: "SET_LOADING", payload: true });
```

### 配置管理系统

```typescript
// 使用字面量类型和验证的配置
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

// 使用
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

## 面试要点

### 什么是字面量类型，为什么有用？

字面量类型是作为自己类型的特定值。它们有用是因为：

- 提供比 `string` 或 `number` 等通用类型更严格的类型安全
- 实现更好的类型推断和收窄
- 使代码更加自文档化
- 在编译时捕获否则会在运行时发生的错误
- 在 switch 语句中启用穷尽性检查

### 解释字面量类型和枚举之间的区别

字面量类型和枚举都将值限制为特定选项，但是：

**字面量类型：**
- 在运行时编译为空
- 是零成本抽象
- 使用联合语法（`"option1" | "option2"`）
- 直接与字符串/数字一起工作
- 对复杂类型组合更灵活

**枚举：**
- 生成运行时 JavaScript 对象
- 有运行时表示
- 使用枚举语法
- 创建命名空间
- 稍重但可以有计算值

```typescript
// 字面量类型（无运行时成本）
type Method = "GET" | "POST";
const method: Method = "GET";

// 枚举（创建运行时对象）
enum MethodEnum {
  GET = "GET",
  POST = "POST"
}
const method2: MethodEnum = MethodEnum.GET;
```

### 什么是 `as const`，何时应该使用？

`as const` 是一个 TypeScript 断言，告诉编译器将值视为字面量而不是泛化它们：

```typescript
// 没有 as const - 类型被泛化
const config = { env: "prod" }; // 类型: { env: string }

// 使用 as const - 类型是具体的字面量
const config2 = { env: "prod" } as const; // 类型: { readonly env: "prod" }
```

使用 `as const`：
- 用于配置对象
- 用于常量数组
- 当你需要从对象属性获得精确字面量类型时
- 用于创建类型安全的查找对象

### 字面量类型如何启用穷尽性检查？

联合类型中的字面量类型允许 TypeScript 验证所有情况都已处理：

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
      const _: never = status; // 如果任何情况缺失则报错
  }
}
```

如果向联合添加新的字面量，TypeScript 将强制你处理它。

### 描述使用字面量类型的可辨识联合的实际用例

一个常见用例是 Redux 风格的 action 分发：

```typescript
type Action =
  | { type: "SET_USER"; payload: User }
  | { type: "LOGOUT" }
  | { type: "SET_ERROR"; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_USER":
      // action.payload 在这里是 User，类型收窄完美工作
      return { ...state, user: action.payload };
    case "LOGOUT":
      return { ...state, user: null };
    case "SET_ERROR":
      // action.payload 在这里是 string
      return { ...state, error: action.payload };
  }
};
```

`type` 字段作为鉴别器，允许 TypeScript 收窄每个 action 的 payload 类型。

## 延伸阅读

### TypeScript 官方文档
- [TypeScript 手册：字面量类型](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
- [TypeScript 手册：联合类型](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [TypeScript 手册：类型收窄](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

### 相关概念
- **可辨识联合**：将字面量类型与对象属性结合以实现强大的类型鉴别
- **类型守卫**：使用字面量类型检查在条件块内收窄类型
- **穷尽性检查**：利用 `never` 类型与字面量联合
- **品牌类型**：从原始值创建不同类型以获得额外安全性

### 最佳实践文章
- 使用 `as const` 进行运行时安全的类型定义
- 使用可辨识联合的 Redux 模式类型安全
- 使用字面量类型约束的表单验证
- 使用状态码字面量的 API 响应处理

### 练习题
1. 使用字面量类型创建类型安全的状态机
2. 构建使用字面量类型的带错误状态的已验证表单
3. 使用可辨识联合实现类 Redux 状态管理
4. 使用 HTTP 方法和状态码字面量设计 API 客户端
5. 创建具有字面量动作类型的插件系统

字面量类型是一个强大的特性，它在灵活性和类型安全之间架起了桥梁。通过将值约束为特定字面量，你创建的代码同时更具限制性和表达性，在编译时捕获错误，同时使代码的行为清晰明了。
