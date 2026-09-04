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
origin: old/src/content/docs/typescript/type-narrowing.zh.md
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

类型收窄（Type Narrowing）是 TypeScript 类型系统中最核心的概念之一。它指的是 TypeScript 编译器通过分析代码中的控制流，自动将变量的类型从宽泛的类型（如联合类型）精确到更具体的类型。理解类型收窄机制，是写出类型安全代码的关键。

## 概念解释

### 什么是类型收窄？

类型收窄是指在特定的代码作用域内，TypeScript 能够根据条件判断、类型检查等操作，将变量的类型从一个较宽泛的类型"收窄"为一个更具体的类型。

```typescript
function processValue(value: string | number) {
  // 此处 value 的类型是 string | number
  console.log(value);

  if (typeof value === "string") {
    // 此处 value 的类型被收窄为 string
    console.log(value.toUpperCase());
  } else {
    // 此处 value 的类型被收窄为 number
    console.log(value.toFixed(2));
  }
}
```

### 为什么需要类型收窄？

在 JavaScript 中，变量可以持有任意类型的值，这导致了许多运行时错误。TypeScript 通过静态类型系统来解决这个问题，而类型收窄则是这个系统的核心机制：

1. **类型安全**：确保在特定上下文中只能访问该类型实际拥有的属性和方法
2. **智能提示**：IDE 能够根据收窄后的类型提供准确的自动补全
3. **编译时检查**：在编译阶段发现潜在的类型错误，而非运行时

### 类型收窄的本质

类型收窄本质上是 TypeScript 编译器的**控制流分析（Control Flow Analysis）**能力。编译器会追踪代码的执行路径，在每个分支中推断出变量的具体类型。

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

## 核心原理

### 控制流分析

TypeScript 编译器会分析代码的控制流，跟踪变量在不同代码路径中的类型。这种分析是基于以下原则：

1. **赋值分析**：当变量被赋予特定类型的值时，其类型会被更新
2. **条件分析**：在条件语句的不同分支中，根据条件表达式收窄类型
3. **可达性分析**：识别不可达代码，并在类型推断中排除不可能的情况

```typescript
function controlFlowExample(value: string | null) {
  // value: string | null

  if (value === null) {
    // value: null
    return "值为空";
  }

  // value: string（null 已被排除）
  return value.toUpperCase();
}
```

### 类型守卫

类型守卫是触发类型收窄的表达式。TypeScript 识别以下几种类型守卫：

| 类型守卫 | 适用场景 | 示例 |
|---------|---------|------|
| `typeof` | 原始类型检查 | `typeof x === "string"` |
| `instanceof` | 类实例检查 | `x instanceof Date` |
| `in` | 属性存在检查 | `"name" in x` |
| 相等性检查 | 字面量类型、`null`、`undefined` | `x === null` |
| 真值检查 | 排除 falsy 值 | `if (x)` |
| 类型谓词 | 自定义类型检查 | `function isString(x): x is string` |
| 断言函数 | 条件断言 | `function assert(x): asserts x is T` |

### 赋值收窄

当变量被声明但未初始化时，TypeScript 会根据后续赋值来确定类型：

```typescript
let value: string | number;

// 此处访问 value 会报错，因为未初始化

value = "hello";
// value: string

value = 42;
// value: number

// 声明时初始化会锁定类型
const name = "TypeScript";
// name: "TypeScript"（字面量类型）
```

## 核心要点

### typeof 类型守卫

`typeof` 是最常用的类型守卫，用于检查原始类型。TypeScript 能识别以下 `typeof` 返回值：

- `"string"`
- `"number"`
- `"bigint"`
- `"boolean"`
- `"symbol"`
- `"undefined"`
- `"object"`（注意：`null` 也返回 `"object"`）
- `"function"`

```typescript
function processInput(input: string | number | boolean | undefined) {
  if (typeof input === "string") {
    // input: string
    return `字符串长度: ${input.length}`;
  }

  if (typeof input === "number") {
    // input: number
    return `数字的两倍: ${input * 2}`;
  }

  if (typeof input === "boolean") {
    // input: boolean
    return `布尔值取反: ${!input}`;
  }

  // input: undefined
  return "未定义";
}
```

### instanceof 类型守卫

`instanceof` 用于检查对象是否是某个类的实例，通过检查原型链来工作：

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
    console.log(`HTTP 错误 ${error.statusCode}: ${error.message}`);
  } else if (error instanceof ValidationError) {
    // error: ValidationError
    console.log(`验证错误，无效字段: ${error.fields.join(", ")}`);
  } else {
    // error: Error
    console.log(`未知错误: ${error.message}`);
  }
}
```

### in 操作符类型守卫

`in` 操作符检查对象是否具有某个属性，常用于区分具有不同属性的接口：

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
    console.log(`管理员权限: ${person.permissions.join(", ")}`);
  } else {
    // person: User
    console.log(`用户邮箱: ${person.email}`);
  }
}
```

### 真值检查（Truthiness Narrowing）

JavaScript 中的"假值"（falsy values）包括：`false`、`0`、`-0`、`0n`、`""`、`null`、`undefined`、`NaN`。利用真值检查可以排除这些值：

```typescript
function processOptionalString(value: string | null | undefined) {
  if (value) {
    // value: string（排除了 null、undefined 和空字符串）
    console.log(value.toUpperCase());
  }
}

// 结合逻辑运算符
function printLength(str: string | null | undefined) {
  // 使用 && 进行真值检查
  str && console.log(str.length);

  // 使用 ?? 提供默认值
  const safeStr = str ?? "默认值";
  console.log(safeStr.length); // safeStr: string
}
```

**注意**：真值检查会同时排除空字符串 `""`，这可能不是你想要的：

```typescript
function processString(value: string | null) {
  if (value) {
    // 空字符串不会进入这个分支
    console.log(value);
  }

  // 如果只想排除 null，应该明确检查
  if (value !== null) {
    // value: string（包括空字符串）
    console.log(value);
  }
}
```

### 相等性收窄

使用 `===`、`!==`、`==`、`!=` 进行比较时，TypeScript 会相应地收窄类型：

```typescript
function processValue(a: string | number, b: string | boolean) {
  if (a === b) {
    // a 和 b 都是 string（两者的交集类型）
    console.log(a.toUpperCase());
    console.log(b.toLowerCase());
  }
}

function checkNull(value: string | null) {
  if (value !== null) {
    // value: string
    console.log(value.length);
  }

  // 也可以使用 == 来同时检查 null 和 undefined
  if (value != null) {
    // value: string
    console.log(value.length);
  }
}
```

### 可辨识联合（Discriminated Unions）

可辨识联合是一种强大的类型设计模式，通过共同的"标签"属性来区分联合类型中的不同成员：

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

### 类型谓词（Type Predicates）

类型谓词允许你创建自定义的类型守卫函数，返回类型使用 `parameterName is Type` 语法：

```typescript
interface Fish {
  swim: () => void;
}

interface Bird {
  fly: () => void;
}

// 类型谓词函数
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

### 断言函数（Assertion Functions）

断言函数在条件不满足时抛出错误，使用 `asserts` 关键字声明：

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`期望字符串，得到 ${typeof value}`);
  }
}

function processValue(value: unknown) {
  assertIsString(value);
  // value: string（从这里开始）
  console.log(value.toUpperCase());
}

// 断言条件为真
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function divide(a: number, b: number): number {
  assert(b !== 0, "除数不能为零");
  // 此处 TypeScript 知道 b 不是 0
  return a / b;
}
```

## 代码示例

### 示例1：完整的类型收窄场景

```typescript
// 定义多种响应类型
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

// 使用类型谓词
function isSuccess(response: ApiResponse): response is SuccessResponse {
  return response.status === "success";
}

function isError(response: ApiResponse): response is ErrorResponse {
  return response.status === "error";
}

// 处理 API 响应
function handleResponse(response: ApiResponse): string {
  // 方式1：使用 switch 和可辨识联合
  switch (response.status) {
    case "success":
      return `成功! 数据: ${JSON.stringify(response.data)}`;
    case "error":
      return `错误 ${response.error.code}: ${response.error.message}`;
    case "loading":
      return `加载中... ${response.progress}%`;
  }
}

// 方式2：使用类型谓词
function handleWithPredicates(response: ApiResponse): string {
  if (isSuccess(response)) {
    // response: SuccessResponse
    return `时间戳: ${response.timestamp}`;
  }

  if (isError(response)) {
    // response: ErrorResponse
    return `错误代码: ${response.error.code}`;
  }

  // response: LoadingResponse
  return `进度: ${response.progress}%`;
}
```

### 示例2：递归类型收窄

```typescript
// JSON 值的类型定义
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// 递归遍历并转换 JSON
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

// 使用示例
const data: JsonValue = {
  name: "张三",
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

### 示例3：泛型与类型收窄

```typescript
// 泛型类型守卫
function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// 过滤数组中的 null 和 undefined
function filterNullish<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter(isNonNullable);
}

const mixed = [1, null, 2, undefined, 3, null, 4];
const numbers = filterNullish(mixed);
// numbers: number[]
console.log(numbers); // [1, 2, 3, 4]

// 泛型断言函数
function assertDefined<T>(
  value: T | null | undefined,
  name: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${name} 不能为 null 或 undefined`);
  }
}

interface Config {
  apiUrl?: string;
  timeout?: number;
}

function initializeApp(config: Config) {
  assertDefined(config.apiUrl, "apiUrl");
  assertDefined(config.timeout, "timeout");

  // 此处 config.apiUrl 和 config.timeout 都是确定存在的
  console.log(`API: ${config.apiUrl}, 超时: ${config.timeout}ms`);
}
```

### 示例4：复杂的状态机类型

```typescript
// 定义状态机状态
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

// 状态转换函数
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
        console.warn("只能从 loading 状态转换到 success");
        return state;
      }
      return {
        status: "success",
        data: action.data,
        completedAt: Date.now()
      };

    case "ERROR":
      if (state.status !== "loading") {
        console.warn("只能从 loading 状态转换到 error");
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

// 渲染状态
function renderState<T>(
  state: FetchState<T>,
  renderData: (data: T) => string
): string {
  switch (state.status) {
    case "idle":
      return "点击开始加载";
    case "loading":
      const elapsed = Date.now() - state.startTime;
      return `加载中... (${elapsed}ms)`;
    case "success":
      return renderData(state.data);
    case "error":
      return `错误: ${state.error.message} (重试次数: ${state.retryCount})`;
  }
}
```

## 最佳实践

### 优先使用可辨识联合

可辨识联合提供了最清晰的类型收窄体验：

```typescript
// 推荐：使用可辨识联合
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
      // 类型自动收窄，payload 结构明确
      return { id: Date.now(), name: action.payload.name };
    case "UPDATE":
      return { id: action.payload.id, name: action.payload.name };
    case "DELETE":
      return { deleted: action.payload.id };
  }
}
```

### 使用穷尽性检查

确保处理了联合类型的所有情况：

```typescript
function assertNever(value: never): never {
  throw new Error(`未处理的情况: ${JSON.stringify(value)}`);
}

type Status = "pending" | "approved" | "rejected";

function getStatusMessage(status: Status): string {
  switch (status) {
    case "pending":
      return "等待审核";
    case "approved":
      return "已批准";
    case "rejected":
      return "已拒绝";
    default:
      // 如果添加了新的状态但忘记处理，这里会报编译错误
      return assertNever(status);
  }
}
```

### 合理使用类型谓词

类型谓词应该进行实际的运行时检查：

```typescript
// 不好：类型谓词没有正确检查
function isUser(obj: unknown): obj is User {
  return obj !== null; // 检查不充分！
}

// 好：完整的运行时检查
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

### 避免过度使用类型断言

类型断言会绕过类型检查，应该优先使用类型收窄：

```typescript
interface User {
  name: string;
  age: number;
}

// 不推荐：使用类型断言
function processUser1(data: unknown) {
  const user = data as User; // 危险！没有运行时检查
  console.log(user.name);
}

// 推荐：使用类型守卫
function processUser2(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "name" in data &&
    "age" in data
  ) {
    // 安全的类型收窄
    const user = data as User;
    console.log(user.name);
  }
}
```

### 结合 null 检查与可选链

```typescript
interface User {
  profile?: {
    avatar?: string;
    bio?: string;
  };
}

function getAvatar(user: User | null | undefined): string {
  // 使用可选链和空值合并
  return user?.profile?.avatar ?? "/default-avatar.png";
}

// 如果需要在后续代码中使用，先进行 null 检查
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

## 常见陷阱

### typeof null 返回 "object"

```typescript
function processValue(value: object | null) {
  if (typeof value === "object") {
    // 陷阱：value 仍然可能是 null！
    // value.toString(); // 运行时错误
  }

  // 正确做法：先检查 null
  if (value !== null && typeof value === "object") {
    value.toString(); // 安全
  }
}
```

### 真值检查排除空字符串和 0

```typescript
function processNumber(value: number | null) {
  if (value) {
    // 陷阱：0 也会被排除！
    console.log(value * 2);
  }

  // 正确做法
  if (value !== null) {
    console.log(value * 2); // 0 也会被正确处理
  }
}

function processString(value: string | null) {
  if (value) {
    // 陷阱：空字符串也会被排除
    console.log(value.length);
  }

  // 如果空字符串是有效值
  if (value !== null) {
    console.log(value.length); // "" 的长度是 0
  }
}
```

### 类型谓词中的错误检查

```typescript
interface Cat {
  meow: () => void;
}

interface Dog {
  bark: () => void;
}

// 错误的类型谓词
function isCat(pet: Cat | Dog): pet is Cat {
  // 这个检查是错误的！应该检查 meow 而不是 bark
  return (pet as Dog).bark === undefined;
}

// 正确的类型谓词
function isCatCorrect(pet: Cat | Dog): pet is Cat {
  return "meow" in pet;
}
```

### 数组类型收窄的限制

```typescript
function processArray(arr: string[] | number[]) {
  // TypeScript 无法在循环中收窄数组元素类型
  for (const item of arr) {
    // item: string | number
    // 无法确定是 string 还是 number
  }

  // 解决方案1：先检查第一个元素
  if (arr.length > 0 && typeof arr[0] === "string") {
    // 但这仍然不能收窄整个数组
    const strings = arr as string[];
    strings.forEach(s => console.log(s.toUpperCase()));
  }

  // 解决方案2：使用类型守卫函数
  if (isStringArray(arr)) {
    arr.forEach(s => console.log(s.toUpperCase()));
  }
}

function isStringArray(arr: unknown[]): arr is string[] {
  return arr.every(item => typeof item === "string");
}
```

### 回调函数中的类型收窄失效

```typescript
function processCallback(value: string | null) {
  if (value !== null) {
    // value: string

    setTimeout(() => {
      // 在回调中，TypeScript 无法保证 value 仍然是非空的
      // 因为 value 可能在回调执行前被修改
      console.log(value.toUpperCase()); // 这里 value 仍然是 string | null
    }, 1000);
  }
}

// 解决方案：将收窄后的值保存到 const
function processCallbackFixed(value: string | null) {
  if (value !== null) {
    const nonNullValue = value; // const 不会被重新赋值

    setTimeout(() => {
      console.log(nonNullValue.toUpperCase()); // nonNullValue: string
    }, 1000);
  }
}
```

## 性能考量

### 类型守卫的运行时开销

类型守卫是运行时检查，会有一定的性能开销：

```typescript
// 简单的 typeof 检查几乎没有开销
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// 复杂的对象验证可能有较大开销
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

### 避免重复检查

```typescript
// 不好：重复检查
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

// 好：使用 else
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

### 使用 Map 替代 switch 进行大量分支判断

```typescript
type EventType = "click" | "scroll" | "keydown" | "keyup" | "resize" | "load";

// 使用 switch（性能随分支增加而下降）
function handleEventSwitch(type: EventType) {
  switch (type) {
    case "click": return handleClick();
    case "scroll": return handleScroll();
    // ... 更多分支
  }
}

// 使用 Map（O(1) 查找）
const eventHandlers = new Map<EventType, () => void>([
  ["click", handleClick],
  ["scroll", handleScroll],
  // ... 更多映射
]);

function handleEventMap(type: EventType) {
  const handler = eventHandlers.get(type);
  handler?.();
}
```

## 实战场景

### 场景1：表单验证

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
    errors.username = "用户名不能为空";
  } else if (form.username.value.length < 3) {
    errors.username = "用户名至少3个字符";
  }

  if (!form.email.value.trim()) {
    errors.email = "邮箱不能为空";
  } else if (!validateEmail(form.email.value)) {
    errors.email = "邮箱格式不正确";
  }

  if (!form.password.value) {
    errors.password = "密码不能为空";
  } else if (form.password.value.length < 8) {
    errors.password = "密码至少8个字符";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

// 使用
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
  console.log("表单验证通过，提交中...");
}
```

### 场景2：API 响应处理

```typescript
// API 响应类型
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

// 类型守卫
function isApiError<T>(response: ApiResponse<T>): response is ApiError {
  return !response.ok;
}

// 封装的 fetch 函数
async function apiFetch<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: `HTTP_${response.status}`,
          message: data.message || "请求失败",
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
        message: e instanceof Error ? e.message : "网络错误"
      }
    };
  }
}

// 使用示例
interface User {
  id: number;
  name: string;
  email: string;
}

async function getUser(id: number): Promise<User | null> {
  const response = await apiFetch<User>(`/api/users/${id}`);

  if (isApiError(response)) {
    // response: ApiError
    console.error(`获取用户失败: ${response.error.message}`);

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

### 场景3：消息处理系统

```typescript
// 定义消息类型
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

// 消息处理器
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

// 使用
const handler = new MessageHandler();

handler.onText(msg => {
  // msg: TextMessage
  console.log(`${msg.sender}: ${msg.content}`);
});

handler.onImage(msg => {
  // msg: ImageMessage
  console.log(`${msg.sender} 发送了图片 ${msg.url} (${msg.width}x${msg.height})`);
});

handler.onSystem(msg => {
  // msg: SystemMessage
  switch (msg.event) {
    case "join":
      console.log(`用户 ${msg.userId} 加入了聊天`);
      break;
    case "leave":
      console.log(`用户 ${msg.userId} 离开了聊天`);
      break;
    case "rename":
      console.log(`用户 ${msg.userId} 改名为 ${msg.data?.newName}`);
      break;
  }
});
```

## 面试要点

### 什么是类型收窄？它是如何工作的？

**答**：类型收窄是 TypeScript 通过控制流分析，在特定代码块中将变量类型从宽泛类型精确到更具体类型的过程。TypeScript 编译器追踪代码执行路径，根据条件判断、类型检查等操作，在不同分支中推断出变量的具体类型。

### typeof 和 instanceof 的区别是什么？

**答**：
- `typeof` 用于检查原始类型（string、number、boolean 等），返回类型字符串
- `instanceof` 用于检查对象是否是某个类的实例，通过原型链检查
- `typeof null` 返回 "object"，是 JavaScript 的历史遗留问题
- `instanceof` 不能用于原始类型，`typeof` 无法区分不同的对象类型

### 解释可辨识联合（Discriminated Unions）

**答**：可辨识联合是一种类型设计模式，联合类型的每个成员都有一个共同的"标签"属性（通常是字面量类型），通过检查这个属性可以区分不同的类型。TypeScript 能够根据标签属性的值自动收窄类型。

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

### 类型谓词和断言函数的区别？

**答**：
- **类型谓词**：返回 boolean，用于条件判断，语法是 `parameterName is Type`
- **断言函数**：不满足条件时抛出错误，语法是 `asserts parameterName is Type`

```typescript
// 类型谓词
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// 断言函数
function assertString(value: unknown): asserts value is string {
  if (typeof value !== "string") throw new Error("Not a string");
}
```

### 如何实现穷尽性检查？

**答**：使用 `never` 类型确保处理了联合类型的所有情况：

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
    default: return assertNever(color); // 如果漏掉某个 case，这里会报编译错误
  }
}
```

## 延伸阅读

### 官方文档

- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#typeof-type-guards)
- [TypeScript Deep Dive - Type Guard](https://basarat.gitbook.io/typescript/type-system/typeguard)

### 相关主题

- [TypeScript 类型守卫](/docs/typescript/type-guards) - 更详细的类型守卫介绍
- [TypeScript 高级类型](/docs/typescript/advanced-types) - 条件类型、映射类型等
- [TypeScript 泛型](/docs/typescript/generics) - 泛型与类型收窄的结合

### 推荐资源

- [Understanding TypeScript's Control Flow Based Type Analysis](https://mariusschulz.com/blog/control-flow-based-type-analysis-in-typescript)
- [Assertion Functions in TypeScript](https://mariusschulz.com/blog/assertion-functions-in-typescript)
- [TypeScript: Documentation - More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions)
