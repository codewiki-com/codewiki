---
title: 类型覆盖率与类型安全
description: 深入理解 TypeScript 类型覆盖率指标、衡量类型安全性、覆盖率跟踪工具以及在代码库中实现全面类型安全的策略
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - 类型覆盖率
  - 类型安全
  - 代码质量
  - 静态分析
  - any 类型
status: imported
origin: old/src/content/docs/typescript/type-coverage.zh.md
divergence: 0.234
issues: []
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 21
  lastUpdated: 2026-01-22
---

类型覆盖率是一个衡量 TypeScript 代码中实际有类型定义与隐式或显式使用 `any` 的比例的指标。高类型覆盖率表明 TypeScript 可以提供最大程度的编译时安全性，而低覆盖率意味着许多运行时错误可能无法被检测到。本文探讨如何在 TypeScript 项目中衡量、提升和维护类型覆盖率。

## 概念解释

### 什么是类型覆盖率？

类型覆盖率表示具有已知类型的代码符号（变量、参数、返回类型等）与 `any` 或 `unknown` 类型符号的百分比。它类似于测试覆盖率，但针对的是类型。

```typescript
// 低类型覆盖率示例
function processData(data) {          // data: any（隐式）
  const result = data.map(item => {   // item: any
    return item.value;                // .value: any
  });
  return result;                      // result: any[]
}

// 高类型覆盖率示例
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

### 类型覆盖率 vs 类型安全

这两个概念相关但不同：

| 方面 | 类型覆盖率 | 类型安全 |
|--------|--------------|-------------|
| 定义 | 有类型符号的百分比 | 运行时没有类型错误 |
| 衡量方式 | 定量（百分比） | 定性（正确/错误） |
| 关注点 | 类型的广度 | 类型的正确性 |
| 目标 | 最小化 `any` 使用 | 防止运行时类型错误 |

```typescript
// 高覆盖率但低安全性
interface User {
  name: string;
  age: number;
}

function processUser(user: User) {
  // 100% 类型覆盖率，但如果 User 类型错误则不安全
  return user.name.toUpperCase();
}

// 运行时使用错误数据调用
const data = JSON.parse('{"name": null, "age": "thirty"}');
processUser(data as User);  // 运行时错误：Cannot read property 'toUpperCase' of null

// 高覆盖率且高安全性
function processUserSafe(user: unknown): string {
  if (isUser(user)) {
    return user.name.toUpperCase();
  }
  throw new Error("无效的用户数据");
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

### `any` 的代价

使用 `any` 会破坏 TypeScript 的类型系统：

```typescript
// "any 病毒" - any 会在你的代码中传播
function getConfig(): any {
  return { timeout: 5000 };
}

const config = getConfig();           // config: any
const timeout = config.timeout;        // timeout: any
const doubled = timeout * 2;           // doubled: any
const message = `Timeout: ${doubled}`; // message: string（终于有类型了！）

// 潜在的 bug 未被检测到
config.timout;          // 拼写错误 - any 不会报错
config.timeout.foo.bar; // 无效访问 - 不会报错
timeout + "string";     // 类型强制转换 - 不会报错
```

## 核心原理

### 最大化类型推断

TypeScript 可以自动推断许多类型。理解推断有助于在不过度注解的情况下保持覆盖率：

```typescript
// TypeScript 自动推断这些类型
const numbers = [1, 2, 3];                    // number[]
const doubled = numbers.map(n => n * 2);       // number[]
const sum = numbers.reduce((a, b) => a + b);   // number

// 从函数返回值推断
function createUser(name: string, age: number) {
  return {
    id: crypto.randomUUID(),  // 推断为 string
    name,                     // 推断为 string
    age,                      // 推断为 number
    createdAt: new Date()     // 推断为 Date
  };
}

type User = ReturnType<typeof createUser>;
// User = { id: string; name: string; age: number; createdAt: Date }

// 从回调的上下文类型推断
const users: User[] = [];
users.filter(user => user.age > 18);  // user 从数组类型推断
users.map(user => user.name);          // user 从数组类型推断
```

### 严格模式与覆盖率

严格模式选项直接影响类型覆盖率：

```typescript
// 没有严格模式 - 许多隐式 any
function greet(name) {       // name: any（隐式）
  return "Hello, " + name;
}

const obj = {
  handler() {
    return this.value;       // this: any（隐式）
  }
};

// 有严格模式 - 强制显式类型
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

### 类型收窄保持覆盖率

类型收窄在处理不确定性时保持覆盖率：

```typescript
// 没有收窄 - 覆盖率下降
function processValue(value: string | number | null) {
  // value 可能是三种类型中的任意一种
  return value;  // 仍然是联合类型
}

// 有收窄 - 保持特定类型
function processValue(value: string | number | null): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return value.toUpperCase();  // value: string
  }

  return value.toFixed(2);  // value: number
}

// 使用可辨识联合进行复杂收窄
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

## 核心要点

### 衡量类型覆盖率

#### 使用 type-coverage 工具

衡量类型覆盖率最流行的工具：

```bash
# 全局安装
npm install -g type-coverage

# 基本用法
type-coverage

# 显示未覆盖代码的详细信息
type-coverage --detail

# 严格模式（将 unknown 也计为未覆盖）
type-coverage --strict

# 设置最低阈值（低于则失败）
type-coverage --at-least 90

# 输出 JSON 用于 CI 集成
type-coverage --json > coverage.json
```

示例输出：
```
95.23% (1842/1935)
```

#### 理解指标

```typescript
// type-coverage 将这些计为已覆盖：
const x: string = "hello";           // 显式类型
const y = "hello";                   // 推断类型（string）
const arr: number[] = [1, 2, 3];     // 显式数组类型
function fn(a: string): number { }   // 有类型的参数和返回值

// type-coverage 将这些计为未覆盖：
const x: any = "hello";              // 显式 any
function fn(a) { }                   // 隐式 any 参数
let data = value as any;             // 类型断言为 any
const obj: { [key: string]: any };   // 索引签名中的 any
```

#### 跟踪覆盖率变化

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

  // 检查是否有回退
  if (history.records.length > 1) {
    const previous = history.records[history.records.length - 2];
    const current = history.records[history.records.length - 1];

    if (current.percentage < previous.percentage) {
      console.error(
        `类型覆盖率回退：${previous.percentage}% -> ${current.percentage}%`
      );
      process.exit(1);
    }
  }
}

trackCoverage();
```

### `any` 的常见来源

#### 1. 未类型化的函数参数

```typescript
// 问题
function process(data) {  // data: any
  return data.value;
}

// 解决方案 1：添加显式类型
function process(data: { value: number }): number {
  return data.value;
}

// 解决方案 2：使用泛型提高灵活性
function process<T extends { value: number }>(data: T): number {
  return data.value;
}

// 解决方案 3：使用接口/类型别名
interface Processable {
  value: number;
}

function process(data: Processable): number {
  return data.value;
}
```

#### 2. JSON 解析

```typescript
// 问题
const data = JSON.parse(jsonString);  // data: any

// 解决方案 1：类型断言（谨慎使用）
interface User {
  id: string;
  name: string;
}

const data = JSON.parse(jsonString) as User;

// 解决方案 2：运行时验证（推荐）
function parseUser(json: string): User {
  const data: unknown = JSON.parse(json);

  if (!isUser(data)) {
    throw new Error("无效的用户 JSON");
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

// 解决方案 3：使用 Zod 等验证库
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

#### 3. 外部 API 响应

```typescript
// 问题
async function fetchData() {
  const response = await fetch("/api/data");
  return response.json();  // 返回 Promise<any>
}

// 解决方案：为响应添加类型
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
    throw new Error(`HTTP 错误：${response.status}`);
  }

  const data: unknown = await response.json();

  // 运行时验证以确保真正的安全
  if (!isApiData(data)) {
    throw new Error("无效的 API 响应");
  }

  return data;
}

// API 响应的类型守卫
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

#### 4. 动态对象访问

```typescript
// 问题
function getValue(obj: object, key: string) {
  return obj[key];  // 返回 any
}

// 解决方案 1：使用 keyof 泛型
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 解决方案 2：使用 Record 类型
function getValue<T>(obj: Record<string, T>, key: string): T | undefined {
  return obj[key];
}

// 解决方案 3：使用特定类型的索引签名
interface Config {
  [key: string]: string | number | boolean;
}

function getValue(obj: Config, key: string): string | number | boolean {
  return obj[key];
}
```

#### 5. 第三方库

```typescript
// 问题：没有类型的库
import { doSomething } from "untyped-lib";  // doSomething: any

// 解决方案 1：创建声明文件
// src/types/untyped-lib.d.ts
declare module "untyped-lib" {
  export function doSomething(input: string): Promise<{
    success: boolean;
    data: unknown;
  }>;
}

// 解决方案 2：创建带类型的包装器
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

### 提升覆盖率的策略

#### 1. 启用严格编译选项

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

#### 2. 使用 ESLint 规则

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

#### 3. 逐步加强类型

```typescript
// 步骤 1：从显式 any 开始（可跟踪）
function processData(data: any): any {
  return data.items.map((item: any) => item.value);
}

// 步骤 2：添加外层类型
interface ProcessInput {
  items: any[];
}

function processData(data: ProcessInput): any[] {
  return data.items.map((item: any) => item.value);
}

// 步骤 3：添加内层类型
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

// 步骤 4：添加额外的安全性
function processData(data: Readonly<ProcessInput>): readonly number[] {
  return data.items.map(item => item.value);
}
```

## 代码示例

### 类型安全的 API 客户端

```typescript
// 具有高覆盖率的完整类型化 API 客户端

// 类型
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

// 类型安全的 fetch 包装器
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
            message: "请求超时",
            status: 408
          }
        };
      }

      return {
        ok: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "未知错误",
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

// 使用时具有完整类型覆盖
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
    throw new Error(`获取用户失败：${result.error.message}`);
  }

  return result.data;
}

async function createUser(data: CreateUserRequest): Promise<User> {
  const result = await api.post<User, CreateUserRequest>("/users", data);

  if (!result.ok) {
    throw new Error(`创建用户失败：${result.error.message}`);
  }

  return result.data;
}
```

### 类型安全的事件系统

```typescript
// 具有完整类型覆盖的事件系统

// 事件类型定义
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

// 类型安全的事件发射器
class TypedEventEmitter {
  private handlers = new Map<EventName, Set<EventHandler<any>>>();

  on<E extends EventName>(event: E, handler: EventHandler<E>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(handler);

    // 返回取消订阅函数
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
          console.error(`事件处理器 ${event} 出错：`, error);
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

// 使用
const events = new TypedEventEmitter();

// 完整的类型推断和检查
events.on("user:login", (data) => {
  // data 被类型化为 { userId: string; timestamp: Date }
  console.log(`用户 ${data.userId} 在 ${data.timestamp} 登录`);
});

events.on("cart:add", (data) => {
  // data 被类型化为 { productId: string; quantity: number; price: number }
  const total = data.quantity * data.price;
  console.log(`添加了 ${data.quantity} x ${data.productId}，总计：${total}`);
});

// 编译时捕获类型错误
// events.emit("user:login", { userId: 123 });  // 错误：userId 应该是 string
// events.emit("cart:add", { productId: "123" });  // 错误：缺少 quantity 和 price
// events.on("invalid:event", () => {});  // 错误：无效的事件名
```

### 运行时类型验证

```typescript
// 具有类型推断的完整运行时验证

// 验证器类型
type Validator<T> = {
  parse(value: unknown): T;
  safeParse(value: unknown): { success: true; data: T } | { success: false; error: string };
};

// 原始类型验证器
function string(): Validator<string> {
  return {
    parse(value: unknown): string {
      if (typeof value !== "string") {
        throw new Error(`期望 string，得到 ${typeof value}`);
      }
      return value;
    },
    safeParse(value: unknown) {
      if (typeof value !== "string") {
        return { success: false, error: `期望 string，得到 ${typeof value}` };
      }
      return { success: true, data: value };
    }
  };
}

function number(): Validator<number> {
  return {
    parse(value: unknown): number {
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new Error(`期望 number，得到 ${typeof value}`);
      }
      return value;
    },
    safeParse(value: unknown) {
      if (typeof value !== "number" || Number.isNaN(value)) {
        return { success: false, error: `期望 number，得到 ${typeof value}` };
      }
      return { success: true, data: value };
    }
  };
}

function boolean(): Validator<boolean> {
  return {
    parse(value: unknown): boolean {
      if (typeof value !== "boolean") {
        throw new Error(`期望 boolean，得到 ${typeof value}`);
      }
      return value;
    },
    safeParse(value: unknown) {
      if (typeof value !== "boolean") {
        return { success: false, error: `期望 boolean，得到 ${typeof value}` };
      }
      return { success: true, data: value };
    }
  };
}

// 对象验证器
type ObjectSchema = Record<string, Validator<unknown>>;
type InferObject<T extends ObjectSchema> = {
  [K in keyof T]: T[K] extends Validator<infer U> ? U : never;
};

function object<T extends ObjectSchema>(schema: T): Validator<InferObject<T>> {
  return {
    parse(value: unknown): InferObject<T> {
      if (typeof value !== "object" || value === null) {
        throw new Error(`期望 object，得到 ${typeof value}`);
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
        return { success: false, error: `期望 object，得到 ${typeof value}` };
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

// 数组验证器
function array<T>(itemValidator: Validator<T>): Validator<T[]> {
  return {
    parse(value: unknown): T[] {
      if (!Array.isArray(value)) {
        throw new Error(`期望 array，得到 ${typeof value}`);
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
        return { success: false, error: `期望 array，得到 ${typeof value}` };
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

// 可选验证器
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

// 使用
const UserSchema = object({
  id: string(),
  name: string(),
  age: number(),
  isActive: boolean(),
  email: optional(string())
});

type User = ReturnType<typeof UserSchema.parse>;

// 从外部源安全解析
const jsonData = '{"id": "123", "name": "张三", "age": 30, "isActive": true}';
const result = UserSchema.safeParse(JSON.parse(jsonData));

if (result.success) {
  const user = result.data;  // 完全类型化！
  console.log(user.name);    // TypeScript 知道这是 string
} else {
  console.error(result.error);
}
```

## 最佳实践

### 1. 设置覆盖率阈值

```json
// package.json
{
  "scripts": {
    "type-coverage": "type-coverage --at-least 90 --strict",
    "type-coverage:report": "type-coverage --detail --strict > type-coverage.txt"
  }
}
```

### 2. 将覆盖率添加到 CI/CD

```yaml
# .github/workflows/type-check.yml
name: 类型检查

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

      - name: 类型覆盖率
        run: npx type-coverage --at-least 90 --strict

      - name: TypeScript 编译
        run: npx tsc --noEmit
```

### 3. 跟踪 any 使用

```typescript
// 创建一个工具来标记有意使用的 any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IntentionalAny = any;

// 记录为什么需要 any
interface LegacyApiResponse {
  // TODO: 当 API 文档可用时正确定义类型
  data: IntentionalAny;
}

// 使用注释进行跟踪
function processLegacyData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 遗留 API，将在 #123 中添加类型
  data: any
): void {
  // ...
}
```

### 4. 优先使用 unknown 而非 any

```typescript
// 错误：使用 any 会失去所有类型安全性
function parseJSON(text: string): any {
  return JSON.parse(text);
}

const data = parseJSON('{"name": "张三"}');
data.foo.bar.baz;  // 没有错误，但运行时会崩溃

// 正确：使用 unknown 强制类型检查
function parseJSON(text: string): unknown {
  return JSON.parse(text);
}

const data = parseJSON('{"name": "张三"}');
// data.name;  // 错误：'data' 是 'unknown' 类型

// 必须先收窄类型
if (typeof data === "object" && data !== null && "name" in data) {
  console.log((data as { name: unknown }).name);
}
```

### 5. 创建类型守卫库

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

// 组合守卫
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

## 常见陷阱

### 1. 类型断言掩盖问题

```typescript
// 错误：断言隐藏了实际问题
const data = fetchData() as User;  // 如果 fetchData 返回 any，仍然没有安全性

// 正确：在运行时验证
const data = fetchData();
if (!isUser(data)) {
  throw new Error("无效的用户数据");
}
// 现在 data 被类型化为 User 并有实际保证
```

### 2. 索引签名泄漏 any

```typescript
// 错误：索引签名实际上使值变成 any
interface Config {
  [key: string]: any;
}

// 更好：限制值类型
interface Config {
  [key: string]: string | number | boolean;
}

// 最好：使用已知键和可选属性
interface Config {
  timeout?: number;
  retries?: number;
  debug?: boolean;
  endpoint?: string;
}
```

### 3. 泛型默认为 unknown

```typescript
// 问题：泛型默认为 unknown，没有用处
function process<T>(data: T): T {
  // 无法对 data 做任何事
  return data;
}

// 解决方案：添加约束
function process<T extends { id: string }>(data: T): T {
  console.log(data.id);  // 现在可以访问 id
  return data;
}
```

### 4. 事件处理器丢失类型

```typescript
// 错误：事件处理器经常有 any 类型
document.addEventListener("click", (event) => {
  event.target.value;  // target 是 EventTarget | null，没有类型
});

// 正确：使用类型断言或守卫
document.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    console.log(target.value);  // 现在正确类型化
  }
});
```

## 性能考量

### 编译时影响

更高的类型覆盖率可能增加编译时间：

```json
// 为大型项目优化 TypeScript 编译器
{
  "compilerOptions": {
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo"
  }
}
```

### 运行时验证开销

```typescript
// 考虑何时验证
// - 始终在应用边界验证（API、用户输入）
// - 对于类型有保证的内部函数调用可以跳过
// - 对内部检查使用仅开发环境的断言

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

## 实战场景

### 场景 1：遗留代码集成

```typescript
// 用类型安全接口包装遗留代码

// legacy-analytics.js（未类型化）
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

// 类型安全的事件定义
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

// 使用时具有完整类型安全
trackEvent("pageView", { path: "/home" });
trackEvent("purchase", { productId: "123", price: 29.99, quantity: 2 });
// trackEvent("purchase", { productId: "123" });  // 错误：缺少 price 和 quantity
```

### 场景 2：表单处理

```typescript
// 类型安全的表单处理

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

// 使用
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
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "邮箱格式无效",
    password: (value) =>
      value.length >= 8 ? null : "密码至少需要 8 个字符"
  },
  onSubmit: async (values) => {
    await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify(values)
    });
  }
});

// 类型安全的字段访问
form.setField("email", "user@example.com");
form.setField("password", "secretpassword");
form.setField("rememberMe", true);
// form.setField("email", 123);  // 错误：number 不能赋值给 string
// form.setField("invalid", "value");  // 错误：无效的字段名
```

## 面试要点

### Q1：什么是类型覆盖率，为什么它很重要？

**答案要点**：
- 类型覆盖率衡量具有已知类型与 `any` 类型的代码百分比
- 高覆盖率意味着更多的编译时错误检测
- 它与类型安全不同（覆盖率是广度，安全性是正确性）
- type-coverage 等工具可以衡量和强制执行阈值

### Q2：TypeScript 代码中 `any` 的主要来源是什么？

**答案要点**：
- 缺少类型注解导致的隐式 any
- JSON.parse() 和返回 any 的 API 响应
- 没有类型定义的第三方库
- 使用字符串键的动态对象访问
- 事件处理器和 DOM API
- 用于消除错误的类型断言为 any

### Q3：如何在现有项目中提升类型覆盖率？

**答案要点**：
- 逐步启用严格编译选项
- 使用 ESLint 规则捕获 any 使用
- 为运行时验证创建类型守卫
- 为未类型化的依赖添加声明文件
- 用 unknown 替换 any 并收窄类型
- 在 CI/CD 中设置覆盖率阈值

### Q4：什么时候可以接受使用 `any`？

**答案要点**：
- 迁移期间临时使用（需要跟踪）
- 复杂的泛型类型情况，正确类型化难度过高
- 与真正动态的外部系统交互
- 始终记录原因并计划移除
- 尽可能优先使用 unknown 而非 any

### Q5：如何确保运行时的类型安全？

**答案要点**：
- 使用类型守卫进行运行时验证
- 在应用边界验证（API、用户输入）
- 使用 Zod、io-ts 等验证库
- 为内部检查创建断言函数
- 将编译时类型与运行时检查结合

## 延伸阅读

- [type-coverage 工具](https://github.com/nicholasserra/type-coverage)
- [TypeScript ESLint 规则](https://typescript-eslint.io/rules/)
- [Zod - TypeScript 优先的模式验证](https://zod.dev/)
- [io-ts - 运行时类型系统](https://github.com/gcanti/io-ts)
- [TypeScript 手册 - 类型守卫](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript 严格模式](https://www.typescriptlang.org/tsconfig#strict)
- [Effective TypeScript - 第 43 条：优先使用类型安全的方法而非猴子补丁](https://effectivetypescript.com/)
- [Total TypeScript - Zod 教程](https://www.totaltypescript.com/tutorials/zod)
