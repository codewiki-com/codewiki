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
origin: old/src/content/docs/typescript/strict-mode.zh.md
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

严格模式（Strict Mode）是 TypeScript 类型安全的核心，它通过一系列编译器选项来强制执行更严格的类型检查，帮助开发者在编译时捕获潜在的运行时错误。本文将深入解析各个严格模式选项的工作原理、使用场景和最佳实践。

## 概念解释

### 什么是严格模式？

TypeScript 的严格模式是一组编译器选项的集合，这些选项能够启用更严格的类型检查规则。启用严格模式后，TypeScript 会对代码进行更严格的分析，捕获更多潜在的类型错误。

在 `tsconfig.json` 中，可以通过设置 `"strict": true` 一次性启用所有严格模式选项：

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 严格模式包含的选项

`strict: true` 等同于同时启用以下所有选项：

| 选项 | 说明 |
|------|------|
| `noImplicitAny` | 禁止隐式 any 类型 |
| `noImplicitThis` | 禁止隐式 this 类型 |
| `strictNullChecks` | 严格空值检查 |
| `strictFunctionTypes` | 严格函数类型检查 |
| `strictBindCallApply` | 严格 bind/call/apply 检查 |
| `strictPropertyInitialization` | 严格属性初始化检查 |
| `useUnknownInCatchVariables` | catch 变量使用 unknown 类型 |
| `alwaysStrict` | 输出文件中添加 "use strict" |

### 为什么需要严格模式？

JavaScript 是一门动态类型语言，TypeScript 的设计目标之一是提供渐进式类型检查。默认情况下，TypeScript 的类型检查相对宽松，以便于从 JavaScript 迁移。然而，宽松的类型检查会遗漏许多潜在的错误：

```typescript
// 非严格模式下，这些代码不会报错
function greet(name) {  // name 隐式为 any
  return name.toUpperCase();
}

greet(123);  // 运行时错误：number.toUpperCase is not a function
```

启用严格模式后，TypeScript 会要求明确的类型注解，在编译时就能发现这类问题。

## 核心原理

### 类型系统的层次结构

理解严格模式需要先理解 TypeScript 的类型层次：

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

- **unknown**：顶层类型，任何类型都可以赋值给 unknown
- **never**：底层类型，表示永不发生的值
- **null 和 undefined**：在严格模式下，它们不再是所有类型的子类型

### 协变与逆变

`strictFunctionTypes` 涉及到类型系统中的协变（Covariance）和逆变（Contravariance）概念：

- **协变**：子类型关系保持方向一致（返回值类型）
- **逆变**：子类型关系方向相反（参数类型）

```typescript
type Animal = { name: string };
type Dog = { name: string; breed: string };

// 返回值是协变的：Dog 是 Animal 的子类型
type AnimalFactory = () => Animal;
type DogFactory = () => Dog;

const dogFactory: DogFactory = () => ({ name: "Buddy", breed: "Labrador" });
const animalFactory: AnimalFactory = dogFactory;  // OK：协变

// 参数是逆变的：反直觉但类型安全
type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

const animalHandler: AnimalHandler = (animal) => console.log(animal.name);
// const dogHandler: DogHandler = animalHandler;  // strictFunctionTypes 下报错
```

## 核心要点

### strictNullChecks - 严格空值检查

这是最重要的严格模式选项之一，它改变了 `null` 和 `undefined` 在类型系统中的行为。

#### 关闭时的行为

```typescript
// strictNullChecks: false
let name: string = "Alice";
name = null;       // OK
name = undefined;  // OK

function getLength(str: string): number {
  return str.length;  // 可能运行时错误
}

getLength(null);  // 编译通过，运行时报错
```

#### 开启后的行为

```typescript
// strictNullChecks: true
let name: string = "Alice";
// name = null;       // Error: 不能将 null 赋值给 string
// name = undefined;  // Error: 不能将 undefined 赋值给 string

// 显式声明可空类型
let nullableName: string | null = "Alice";
nullableName = null;  // OK

function getLength(str: string): number {
  return str.length;  // 安全：str 一定是 string
}

// getLength(null);  // Error: 类型 null 不能赋值给 string
```

#### 空值收窄

```typescript
function processName(name: string | null): string {
  // 必须先进行空值检查
  if (name === null) {
    return "Unknown";
  }
  // 这里 name 的类型被收窄为 string
  return name.toUpperCase();
}

// 使用可选链和空值合并
function getNameLength(name: string | null | undefined): number {
  return name?.length ?? 0;
}
```

### noImplicitAny - 禁止隐式 any

当 TypeScript 无法推断出变量的类型时，默认会将其视为 `any` 类型。`noImplicitAny` 选项禁止这种隐式行为。

#### 关闭时的行为

```typescript
// noImplicitAny: false
function add(a, b) {  // a 和 b 隐式为 any
  return a + b;
}

add(1, 2);         // 3
add("hello", 123); // "hello123"
add({}, []);       // "[object Object]"
```

#### 开启后的行为

```typescript
// noImplicitAny: true

// Error: 参数 'a' 隐式具有 'any' 类型
// function add(a, b) {
//   return a + b;
// }

// 必须提供类型注解
function add(a: number, b: number): number {
  return a + b;
}

// 或者使用泛型
function identity<T>(value: T): T {
  return value;
}
```

#### 常见场景

```typescript
// 1. 回调函数参数
// Error: 参数 'item' 隐式具有 'any' 类型
// [1, 2, 3].forEach(item => console.log(item));

// 正确写法（通常 TypeScript 可以从上下文推断）
[1, 2, 3].forEach((item: number) => console.log(item));
// 或依赖类型推断
const numbers: number[] = [1, 2, 3];
numbers.forEach(item => console.log(item));  // item 推断为 number

// 2. 解构赋值
function processConfig({ name, value }) {  // Error
  console.log(name, value);
}

// 正确写法
function processConfig({ name, value }: { name: string; value: number }) {
  console.log(name, value);
}

// 3. 类方法
class Calculator {
  // Error: 参数 'a' 隐式具有 'any' 类型
  // add(a, b) {
  //   return a + b;
  // }

  add(a: number, b: number): number {
    return a + b;
  }
}
```

### noImplicitThis - 禁止隐式 this

当函数中的 `this` 类型无法被推断时，`noImplicitThis` 会报告错误。

#### 关闭时的行为

```typescript
// noImplicitThis: false
const obj = {
  name: "Alice",
  greet() {
    return function() {
      // this 是 any，可能导致运行时错误
      console.log(this.name);
    };
  }
};

obj.greet()();  // undefined（非严格模式）或报错（严格模式）
```

#### 开启后的行为

```typescript
// noImplicitThis: true
const obj = {
  name: "Alice",
  greet() {
    // Error: 'this' 隐式具有 'any' 类型
    // return function() {
    //   console.log(this.name);
    // };

    // 解决方案 1：使用箭头函数
    return () => {
      console.log(this.name);  // OK: this 被正确推断
    };
  }
};

// 解决方案 2：显式声明 this 类型
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

#### 类中的 this

```typescript
class Counter {
  count = 0;

  // 问题：回调中的 this 会丢失
  increment() {
    this.count++;
  }

  // 解决方案：使用箭头函数属性
  incrementArrow = () => {
    this.count++;
  };

  // 解决方案：使用 bind
  constructor() {
    this.increment = this.increment.bind(this);
  }
}

const counter = new Counter();
const fn = counter.incrementArrow;
fn();  // 正确工作
```

### strictFunctionTypes - 严格函数类型

此选项启用对函数参数的逆变检查，使函数类型检查更加严格和安全。

#### 关闭时的行为（双变，Bivariant）

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
  console.log(dog.breed);  // 访问 breed 属性
};

// 危险！这在非严格模式下是允许的
animalCallback = dogCallback;

// 运行时错误：传入的 Animal 没有 breed 属性
animalCallback({ name: "Generic Animal" });
```

#### 开启后的行为（逆变）

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

// Error: 不能将 DogCallback 赋值给 AnimalCallback
// 参数类型不兼容
// animalCallback = dogCallback;

// 但反过来是安全的
dogCallback = animalCallback;  // OK
```

#### 方法与函数属性的区别

```typescript
interface Example {
  // 方法语法：仍然是双变的（为了兼容性）
  method(x: string): void;

  // 函数属性语法：受 strictFunctionTypes 影响
  property: (x: string) => void;
}
```

### strictPropertyInitialization - 严格属性初始化

此选项要求类的实例属性必须在声明时或构造函数中初始化。需要同时启用 `strictNullChecks`。

#### 关闭时的行为

```typescript
// strictPropertyInitialization: false
class User {
  name: string;   // 未初始化，但不报错
  email: string;  // 未初始化，但不报错

  constructor() {
    // 忘记初始化属性
  }
}

const user = new User();
console.log(user.name.toUpperCase());  // 运行时错误！
```

#### 开启后的行为

```typescript
// strictPropertyInitialization: true
class User {
  // Error: 属性 'name' 没有初始化器，也未在构造函数中明确赋值
  // name: string;

  // 方式 1：在声明时初始化
  name: string = "";

  // 方式 2：在构造函数中初始化
  email: string;

  // 方式 3：声明为可选属性
  phone?: string;

  // 方式 4：声明为可能 undefined
  address: string | undefined;

  // 方式 5：使用明确赋值断言（谨慎使用）
  id!: number;

  constructor(email: string) {
    this.email = email;
  }
}
```

#### 处理异步初始化

```typescript
class AsyncUser {
  // 使用明确赋值断言处理异步初始化
  data!: UserData;

  async init() {
    this.data = await fetchUserData();
  }

  // 或者使用可选属性 + 检查
  cachedData?: UserData;

  async getData(): Promise<UserData> {
    if (!this.cachedData) {
      this.cachedData = await fetchUserData();
    }
    return this.cachedData;
  }
}

// 工厂模式更安全
class SafeAsyncUser {
  private constructor(public data: UserData) {}

  static async create(): Promise<SafeAsyncUser> {
    const data = await fetchUserData();
    return new SafeAsyncUser(data);
  }
}
```

### strictBindCallApply - 严格 bind/call/apply

此选项对 `bind`、`call` 和 `apply` 方法启用更严格的类型检查。

#### 关闭时的行为

```typescript
// strictBindCallApply: false
function greet(name: string, age: number) {
  return `Hello, ${name}! You are ${age} years old.`;
}

// 这些调用在非严格模式下不会报错
greet.call(undefined, "Alice");  // 缺少参数
greet.apply(undefined, ["Alice", "twenty"]);  // 类型错误
greet.bind(undefined, 123);  // 类型错误
```

#### 开启后的行为

```typescript
// strictBindCallApply: true
function greet(name: string, age: number): string {
  return `Hello, ${name}! You are ${age} years old.`;
}

// Error: 应有 2 个参数，但获得 1 个
// greet.call(undefined, "Alice");

// Error: 类型 'string' 不能赋值给类型 'number'
// greet.apply(undefined, ["Alice", "twenty"]);

// Error: 类型 'number' 不能赋值给类型 'string'
// greet.bind(undefined, 123);

// 正确用法
greet.call(undefined, "Alice", 30);
greet.apply(undefined, ["Alice", 30]);
const boundGreet = greet.bind(undefined, "Alice");
boundGreet(30);  // "Hello, Alice! You are 30 years old."
```

### useUnknownInCatchVariables - catch 变量使用 unknown

TypeScript 4.4+ 引入，将 catch 子句的错误变量类型从 `any` 改为 `unknown`。

#### 关闭时的行为

```typescript
// useUnknownInCatchVariables: false
try {
  throw new Error("Something went wrong");
} catch (error) {
  // error 是 any 类型
  console.log(error.message);  // 可能运行时错误
  console.log(error.nonExistent);  // 不报错，但可能是 undefined
}
```

#### 开启后的行为

```typescript
// useUnknownInCatchVariables: true
try {
  throw new Error("Something went wrong");
} catch (error) {
  // error 是 unknown 类型
  // console.log(error.message);  // Error: 'error' 是 unknown 类型

  // 必须进行类型检查
  if (error instanceof Error) {
    console.log(error.message);
  } else if (typeof error === "string") {
    console.log(error);
  } else {
    console.log("Unknown error:", error);
  }
}

// 或者使用类型断言（需要确保类型正确）
try {
  throw new Error("Something went wrong");
} catch (error) {
  const err = error as Error;
  console.log(err.message);
}
```

#### 封装错误处理

```typescript
// 创建类型安全的错误处理工具
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

// 使用
try {
  // 可能抛出各种类型的错误
  throw { code: 500, reason: "Server error" };
} catch (error) {
  console.log(getErrorMessage(error));
}
```

### alwaysStrict - 始终严格

此选项确保所有输出的 JavaScript 文件都包含 `"use strict"` 指令。

```typescript
// alwaysStrict: true

// 输入
function example() {
  return this;
}

// 输出
"use strict";
function example() {
  return this;
}
```

## 代码示例

### 完整的严格模式配置

```json
{
  "compilerOptions": {
    "strict": true,
    // 或者单独配置每个选项
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

### 类型安全的 API 响应处理

```typescript
// 启用所有严格模式选项后的类型安全代码

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
    // useUnknownInCatchVariables: error 是 unknown 类型
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

// 使用响应
async function displayUser(id: number): Promise<void> {
  const response = await fetchUser(id);

  // strictNullChecks: 必须检查 data 是否为 null
  if (!response.success || response.data === null) {
    console.error(response.error ?? "Failed to fetch user");
    return;
  }

  // 现在 TypeScript 知道 response.data 是 User 类型
  const user = response.data;
  console.log(`Name: ${user.name}`);
  console.log(`Email: ${user.email}`);

  // 可选属性仍需要检查
  if (user.phone) {
    console.log(`Phone: ${user.phone}`);
  }
}
```

### 严格模式下的类设计

```typescript
// strictPropertyInitialization 要求所有属性都被正确初始化

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
}

class DatabaseConnection {
  // 方式 1：声明时初始化
  private connected: boolean = false;

  // 方式 2：构造函数参数
  private readonly config: DatabaseConfig;

  // 方式 3：可选属性
  private lastQuery?: string;

  // 方式 4：明确赋值断言（用于异步初始化的情况）
  private connection!: Connection;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // 初始化 connection
    this.connection = await createConnection(this.config);
    this.connected = true;
  }

  // noImplicitThis: this 类型明确
  query(sql: string): Promise<QueryResult> {
    if (!this.connected) {
      throw new Error("Not connected to database");
    }
    this.lastQuery = sql;
    return this.connection.query(sql);
  }

  // 获取最后执行的查询
  getLastQuery(): string | undefined {
    return this.lastQuery;
  }
}

// 使用工厂函数确保完整初始化
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

### 事件处理器的类型安全

```typescript
// strictFunctionTypes 确保事件处理器的类型安全

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

// 类型安全的事件处理器
type EventHandler<T extends BaseEvent> = (event: T) => void;

class EventEmitter {
  private handlers: Map<string, EventHandler<BaseEvent>[]> = new Map();

  on<T extends AppEvent>(
    type: T["type"],
    handler: EventHandler<T>
  ): void {
    const handlers = this.handlers.get(type) ?? [];
    // strictFunctionTypes 确保类型安全
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

// 使用
const emitter = new EventEmitter();

emitter.on("click", (event) => {
  // event 被正确推断为 ClickEvent
  console.log(`Click at (${event.x}, ${event.y})`);
});

emitter.on("keyboard", (event) => {
  // event 被正确推断为 KeyboardEvent
  console.log(`Key pressed: ${event.key}`);
});

emitter.emit({
  type: "click",
  timestamp: Date.now(),
  x: 100,
  y: 200
});
```

## 最佳实践

### 在新项目中始终启用严格模式

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

### 渐进式启用严格模式

对于遗留项目，建议按以下顺序逐步启用：

```json
// 第一阶段：基础类型检查
{
  "compilerOptions": {
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}

// 第二阶段：空值安全
{
  "compilerOptions": {
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true
  }
}

// 第三阶段：函数和属性
{
  "compilerOptions": {
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}

// 第四阶段：完整严格模式
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 避免使用类型断言绕过检查

```typescript
// 不推荐：使用断言绕过空值检查
function processUser(user: User | null) {
  console.log((user as User).name);  // 危险！
}

// 推荐：正确的空值处理
function processUser(user: User | null) {
  if (user === null) {
    console.log("No user provided");
    return;
  }
  console.log(user.name);
}

// 或使用断言函数
function assertUser(user: User | null): asserts user is User {
  if (user === null) {
    throw new Error("User is required");
  }
}

function processUser(user: User | null) {
  assertUser(user);
  console.log(user.name);  // 类型被收窄为 User
}
```

### 使用 unknown 而非 any

```typescript
// 不推荐
function parseJSON(json: string): any {
  return JSON.parse(json);
}

// 推荐
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}

// 使用时进行类型验证
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
  console.log(data.apiUrl);  // 类型安全
}
```

### 正确处理可选属性和参数

```typescript
interface Options {
  timeout?: number;
  retries?: number;
  onError?: (error: Error) => void;
}

function fetchData(url: string, options: Options = {}): Promise<Response> {
  // 使用默认值
  const timeout = options.timeout ?? 5000;
  const retries = options.retries ?? 3;

  // 条件调用可选回调
  const handleError = (error: Error) => {
    options.onError?.(error);
  };

  // ...
}
```

## 常见陷阱

### 明确赋值断言的滥用

```typescript
class User {
  // 危险：使用 ! 断言但可能未初始化
  name!: string;

  async init() {
    // 如果这个方法没被调用，name 就是 undefined
    this.name = await fetchName();
  }
}

// 更安全的做法
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

### 函数重载与严格模式

```typescript
// 重载签名
function process(value: string): string;
function process(value: number): number;
// 实现签名必须兼容所有重载
function process(value: string | number): string | number {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value * 2;
}

// strictFunctionTypes 会检查实现与重载的兼容性
```

### 第三方库类型问题

```typescript
// 某些库的类型定义可能与严格模式不兼容
// 解决方案 1：使用 skipLibCheck
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}

// 解决方案 2：创建类型声明扩展
// types/problematic-lib.d.ts
declare module "problematic-lib" {
  export function doSomething(value: string | null): string;
}

// 解决方案 3：包装函数
import { riskyFunction } from "problematic-lib";

function safeWrapper(value: string): string {
  const result = riskyFunction(value);
  if (result === null) {
    throw new Error("Unexpected null result");
  }
  return result;
}
```

### 数组索引访问

```typescript
// 即使启用了 strictNullChecks，数组索引访问默认不会返回 undefined
const arr: string[] = ["a", "b", "c"];
const item = arr[10];  // item 类型是 string，但实际是 undefined

// 推荐启用 noUncheckedIndexedAccess
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true
  }
}

// 现在 item 类型是 string | undefined
const item = arr[10];
if (item !== undefined) {
  console.log(item.toUpperCase());
}
```

## 性能考量

### 编译时间影响

严格模式会增加编译器的类型检查工作量，可能略微增加编译时间。但这种开销通常很小，而且可以通过以下方式优化：

1. **增量编译**：启用 `incremental: true`
2. **跳过库检查**：启用 `skipLibCheck: true`
3. **项目引用**：大型项目使用 `composite` 和 `references`

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

### 运行时影响

严格模式只影响编译时的类型检查，不会影响运行时性能。生成的 JavaScript 代码与非严格模式完全相同（除了可能添加 `"use strict"` 指令）。

## 实战场景

### 场景 1：API 客户端封装

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

### 场景 2：状态管理

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

// strictFunctionTypes 确保 reducer 类型安全
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
      // 穷尽性检查
      const _exhaustive: never = action;
      return state;
  }
}

// 类型安全的 dispatch
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

### 场景 3：表单验证

```typescript
type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; errors: string[] };

interface Validator<T> {
  validate(value: unknown): ValidationResult<T>;
}

// 字符串验证器
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

// 对象验证器
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

// 使用示例
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
    // result.value 类型是 UserForm
    console.log("Valid:", result.value.username, result.value.email);
  } else {
    // result.errors 是 string[]
    console.error("Validation errors:", result.errors);
  }
}
```

## 面试要点

### Q1: 什么是 TypeScript 的严格模式？它包含哪些选项？

**答案要点**：
- 严格模式是一组编译器选项的集合，用于启用更严格的类型检查
- `strict: true` 会启用：noImplicitAny、noImplicitThis、strictNullChecks、strictFunctionTypes、strictBindCallApply、strictPropertyInitialization、useUnknownInCatchVariables、alwaysStrict
- 严格模式帮助在编译时捕获更多潜在的运行时错误

### Q2: strictNullChecks 有什么作用？不启用会有什么问题？

**答案要点**：
- 启用后，null 和 undefined 不再是所有类型的子类型
- 不启用时，任何类型的变量都可以赋值为 null 或 undefined，这可能导致运行时的 "Cannot read property of null/undefined" 错误
- 启用后需要显式使用联合类型（如 `string | null`）来表示可空类型
- 需要进行空值检查才能安全访问可能为空的值

### Q3: strictFunctionTypes 如何影响函数类型的兼容性？

**答案要点**：
- 启用后，函数参数类型使用逆变检查
- 这意味着接受父类型参数的函数不能赋值给接受子类型参数的变量
- 方法语法定义的函数仍然是双变的（为了兼容性）
- 这确保了回调函数的类型安全

### Q4: 如何在遗留项目中渐进式启用严格模式？

**答案要点**：
- 建议分阶段启用，从影响较小的选项开始
- 推荐顺序：noImplicitAny -> strictNullChecks -> strictFunctionTypes -> strictPropertyInitialization -> 完整 strict
- 可以使用 `// @ts-ignore` 或 `// @ts-expect-error` 临时忽略特定行的错误
- 考虑为不同模块使用不同的配置文件

### Q5: useUnknownInCatchVariables 的作用是什么？如何正确处理 catch 中的错误？

**答案要点**：
- 将 catch 子句中的错误变量从 any 类型改为 unknown 类型
- 这迫使开发者在使用错误对象之前进行类型检查
- 正确的处理方式是使用 instanceof 检查或类型守卫
- 可以创建统一的错误处理工具函数来处理不同类型的错误

## 延伸阅读

- [TypeScript 官方文档 - 编译器选项](https://www.typescriptlang.org/tsconfig)
- [TypeScript 官方文档 - 严格模式](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#strictness)
- [TypeScript Deep Dive - 严格模式选项](https://basarat.gitbook.io/typescript/type-system/strict-types)
- [TypeScript 4.4 发布说明 - useUnknownInCatchVariables](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html)
- [协变与逆变详解](https://www.stephanboyer.com/post/132/what-are-covariance-and-contravariance)
- [TypeScript 类型系统深入理解](https://type-level-typescript.com/)
