---
title: 类型推断
description: TypeScript 类型推断完全指南，自动类型推导和最佳实践
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - Type Inference
  - Type System
  - Type Safety
status: imported
origin: old/src/content/docs/typescript/type-inference.zh.md
divergence: 0.213
issues: []
legacy:
  category: TypeScript
  subcategory: Type System
  order: 10
  lastUpdated: 2026-01-07
---

类型推断是 TypeScript 最强大的特性之一。它允许编译器自动确定类型，而无需显式类型注解，在保持完整类型安全的同时减少样板代码。理解 TypeScript 如何推断类型有助于你编写更简洁、更易维护的代码。

## 什么是类型推断？

类型推断是 TypeScript 编译器根据代码中值的使用方式自动推导类型的过程。TypeScript 不需要显式声明每个类型，而是分析你的代码并确定最合适的类型。

```typescript
// 显式类型注解
let message: string = "Hello, TypeScript";

// 类型推断 - TypeScript 推断为 'string'
let inferredMessage = "Hello, TypeScript";

// 两个变量具有相同的类型：string
```

编译器检查赋值右侧的值，并推断 `inferredMessage` 必须是 `string` 类型。

## 基本类型推断

### 变量初始化

TypeScript 在变量初始化时推断类型：

```typescript
let count = 42;           // 推断为 number
let isActive = true;      // 推断为 boolean
let username = "alice";   // 推断为 string
let nothing = null;       // 推断为 null
let notDefined;           // 推断为 any（无初始值）
```

### 数组推断

数组根据其元素推断类型：

```typescript
let numbers = [1, 2, 3, 4, 5];           // number[]
let strings = ["a", "b", "c"];            // string[]
let mixed = [1, "two", 3];                // (string | number)[]
let empty = [];                           // any[]（小心！）

// 为空数组显式类型
let typedEmpty: number[] = [];            // number[]
```

### 对象推断

对象类型从其结构推断：

```typescript
let user = {
  name: "Alice",
  age: 30,
  isAdmin: false
};
// 推断类型: { name: string; age: number; isAdmin: boolean }

// 访问属性按预期工作
console.log(user.name.toUpperCase());  // OK
console.log(user.age.toFixed(2));      // OK

// TypeScript 捕获错误
// user.email;  // 错误: 属性 'email' 不存在
```

### 函数返回类型推断

TypeScript 从 return 语句推断函数返回类型：

```typescript
// 返回类型推断为 number
function add(a: number, b: number) {
  return a + b;
}

// 返回类型推断为 string
function greet(name: string) {
  return `Hello, ${name}!`;
}

// 返回类型推断为 string | undefined
function maybeGreet(name: string, shouldGreet: boolean) {
  if (shouldGreet) {
    return `Hello, ${name}!`;
  }
  // 隐式返回 undefined
}

// 返回类型推断为 never（函数永不返回）
function throwError(message: string) {
  throw new Error(message);
}
```

## 最佳公共类型

当从多个表达式推断类型时，TypeScript 使用"最佳公共类型"算法来找到与所有候选类型兼容的类型。

### 类型联合

```typescript
// 最佳公共类型是 (number | string | boolean)[]
let mixedArray = [1, "hello", true];

// 最佳公共类型是 (Cat | Dog)[]
class Animal { name: string = ""; }
class Cat extends Animal { meow() {} }
class Dog extends Animal { bark() {} }

let pets = [new Cat(), new Dog()];  // (Cat | Dog)[]
```

### 显式基类型

有时你需要显式指定所需的类型：

```typescript
// 没有注解: (Cat | Dog)[]
let pets1 = [new Cat(), new Dog()];

// 有注解: Animal[]
let pets2: Animal[] = [new Cat(), new Dog()];

// 第二种方法允许稍后添加任何 Animal
pets2.push(new Animal());  // OK
// pets1.push(new Animal());  // 严格设置下会报错
```

### 数字字面量类型

```typescript
// 推断为 number（从字面量拓宽）
let mutableNumber = 42;

// 推断为字面量类型 42
const constantNumber = 42;

// 数字字面量数组变成 number[]
let numbers = [1, 2, 3];  // number[]，不是 (1 | 2 | 3)[]

// 使用 'as const' 获取字面量类型
const literalNumbers = [1, 2, 3] as const;  // readonly [1, 2, 3]
```

## 上下文类型

当 TypeScript 根据表达式出现的位置或上下文推断类型时，就会发生上下文类型推断。这有时被称为"反向类型推断"。

### 事件处理程序

```typescript
// TypeScript 从上下文推断事件参数类型
document.addEventListener("click", (event) => {
  // event 被推断为 MouseEvent
  console.log(event.clientX, event.clientY);
});

document.addEventListener("keydown", (event) => {
  // event 被推断为 KeyboardEvent
  console.log(event.key, event.code);
});
```

### 回调函数

```typescript
const numbers = [1, 2, 3, 4, 5];

// 'num' 从数组上下文推断为 number
const doubled = numbers.map((num) => num * 2);

// 'a' 和 'b' 被推断为 numbers
const sorted = numbers.sort((a, b) => a - b);

// 多个参数正确推断
const indexed = numbers.map((value, index, array) => {
  // value: number, index: number, array: number[]
  return { value, index, total: array.length };
});
```

### 对象方法上下文

```typescript
interface Calculator {
  add: (a: number, b: number) => number;
  subtract: (a: number, b: number) => number;
}

const calc: Calculator = {
  // 参数从接口推断
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};
```

### 泛型上下文

```typescript
// TypeScript 从使用推断泛型类型
function identity<T>(value: T): T {
  return value;
}

const str = identity("hello");    // T 推断为 string
const num = identity(42);         // T 推断为 number
const obj = identity({ x: 1 });   // T 推断为 { x: number }

// 带泛型的数组方法
const filtered = [1, 2, 3, null, 4].filter(
  (item): item is number => item !== null
);
// filtered 是 number[]
```

## 控制流分析

TypeScript 执行复杂的控制流分析，在不同的代码分支中收窄类型。

### 类型守卫

```typescript
function processValue(value: string | number) {
  if (typeof value === "string") {
    // TypeScript 知道 value 在这里是 string
    console.log(value.toUpperCase());
  } else {
    // TypeScript 知道 value 在这里是 number
    console.log(value.toFixed(2));
  }
}
```

### 真值收窄

```typescript
function printLength(str: string | null | undefined) {
  if (str) {
    // str 被收窄为 string（真值检查排除了 null/undefined）
    console.log(str.length);
  }
}

// 使用可选链和空值合并
function safeLength(str: string | null | undefined): number {
  return str?.length ?? 0;
}
```

### 相等性收窄

```typescript
function compare(a: string | number, b: string | boolean) {
  if (a === b) {
    // 两者必须是 string（唯一的公共类型）
    console.log(a.toUpperCase());
    console.log(b.toUpperCase());
  }
}
```

### instanceof 收窄

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
    // error 被收窄为 ApiError
    console.log(`API Error ${error.statusCode}: ${error.message}`);
  } else {
    // error 被收窄为 Error
    console.log(`Error: ${error.message}`);
  }
}
```

### in 运算符收窄

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
    // animal 是 Bird
    animal.fly();
  } else {
    // animal 是 Fish
    animal.swim();
  }
}
```

### 可辨识联合

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
      // shape 是 Circle
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // shape 是 Rectangle
      return shape.width * shape.height;
    case "triangle":
      // shape 是 Triangle
      return (shape.base * shape.height) / 2;
  }
}
```

### 穷尽性检查

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
      // 如果我们添加一个新形状并忘记处理它，
      // TypeScript 会在这里报错
      return assertNever(shape);
  }
}
```

## 类型拓宽

类型拓宽是 TypeScript 在某些上下文中将字面量类型扩展为其基类型的过程。

### let vs const

```typescript
// 'let' 将字面量拓宽为基类型
let mutableString = "hello";      // 类型: string
let mutableNumber = 42;           // 类型: number
let mutableBoolean = true;        // 类型: boolean

// 'const' 保留字面量类型
const constantString = "hello";   // 类型: "hello"
const constantNumber = 42;        // 类型: 42
const constantBoolean = true;     // 类型: true
```

### 对象属性拓宽

```typescript
// 对象属性默认被拓宽
const config = {
  name: "app",
  port: 3000,
  debug: true,
};
// 类型: { name: string; port: number; debug: boolean }

// 使用 'as const' 防止拓宽
const strictConfig = {
  name: "app",
  port: 3000,
  debug: true,
} as const;
// 类型: { readonly name: "app"; readonly port: 3000; readonly debug: true }
```

### 控制拓宽

```typescript
// 显式类型注解防止拓宽
const status: "pending" | "complete" = "pending";

// 类型断言防止拓宽
const direction = "north" as "north";

// 整个结构的 const 断言
const point = { x: 10, y: 20 } as const;
// 类型: { readonly x: 10; readonly y: 20 }

// 数组的 const 断言
const colors = ["red", "green", "blue"] as const;
// 类型: readonly ["red", "green", "blue"]
```

### 函数参数推断和拓宽

```typescript
function setStatus<T extends string>(status: T): T {
  return status;
}

// 没有约束，字面量被保留
const result1 = setStatus("active");  // 类型: "active"

// 与非泛型版本比较
function setStatusWide(status: string): string {
  return status;
}
const result2 = setStatusWide("active");  // 类型: string
```

## 类型收窄

类型收窄与拓宽相反 - 它根据运行时检查将类型细化为更具体的类型。

### 赋值收窄

```typescript
let value: string | number;

value = "hello";
// value 现在是 string
console.log(value.toUpperCase());

value = 42;
// value 现在是 number
console.log(value.toFixed(2));
```

### 自定义类型守卫

```typescript
interface Cat {
  meow(): void;
  purr(): void;
}

interface Dog {
  bark(): void;
  wagTail(): void;
}

// 用户定义的类型守卫
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

### 断言函数

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Value must be a string");
  }
}

function processInput(input: unknown) {
  assertIsString(input);
  // input 现在是 string
  console.log(input.toUpperCase());
}

// 非空断言函数
function assertDefined<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error("Value must be defined");
  }
}
```

### 使用类型守卫的数组过滤

```typescript
const mixedArray: (string | number | null)[] = [1, "two", null, 3, "four", null];

// 带类型守卫的过滤器收窄结果类型
const strings = mixedArray.filter((item): item is string => typeof item === "string");
// strings 是 string[]

const numbers = mixedArray.filter((item): item is number => typeof item === "number");
// numbers 是 number[]

const nonNull = mixedArray.filter((item): item is string | number => item !== null);
// nonNull 是 (string | number)[]
```

## 实际示例

### API 响应处理

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
  // 实现
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
    // TypeScript 知道 response 是 SuccessResponse<User>
    console.log(`User: ${response.data.name}`);
    console.log(`Email: ${response.data.email}`);
  } else {
    // TypeScript 知道 response 是 ErrorResponse
    console.error(`Error ${response.code}: ${response.message}`);
  }
}
```

### 表单验证

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

  // 验证用户名
  if (typeof obj.username !== "string" || obj.username.length < 3) {
    errors.username = ["Username must be at least 3 characters"];
  }

  // 验证邮箱
  if (typeof obj.email !== "string" || !obj.email.includes("@")) {
    errors.email = ["Invalid email format"];
  }

  // 验证年龄
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
    // result.data 是 FormData
    console.log(`Welcome, ${result.data.username}!`);
  } else {
    // result.errors 是 Record<string, string[]>
    Object.entries(result.errors).forEach(([field, messages]) => {
      console.error(`${field}: ${messages.join(", ")}`);
    });
  }
}
```

### 状态机

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

## 最佳实践

### 尽可能让 TypeScript 推断

```typescript
// 不必要的显式类型
const name: string = "Alice";
const numbers: number[] = [1, 2, 3];
const user: { name: string; age: number } = { name: "Bob", age: 30 };

// 更好：让 TypeScript 推断
const name = "Alice";
const numbers = [1, 2, 3];
const user = { name: "Bob", age: 30 };
```

### 为公共 API 注解函数参数和返回类型

```typescript
// 公共函数：显式类型改善文档
export function calculateDiscount(
  price: number,
  discountPercent: number
): number {
  return price * (1 - discountPercent / 100);
}

// 内部辅助函数：推断即可
const applyTax = (amount: number, rate: number) => amount * (1 + rate);
```

### 对字面量类型使用 const 断言

```typescript
// 当你需要字面量类型时
const DIRECTIONS = ["north", "south", "east", "west"] as const;
type Direction = typeof DIRECTIONS[number];  // "north" | "south" | "east" | "west"

const CONFIG = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3,
} as const;
```

### 优先使用可辨识联合

```typescript
// 好：可辨识联合具有清晰的类型收窄
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

### 对复杂类型收窄使用类型守卫

```typescript
// 定义可重用的类型守卫
function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

// 在数组操作中使用
const values = [1, null, 2, undefined, 3];
const nonNullValues = values.filter(isNonNullable);  // number[]
```

## 常见陷阱

### 空数组推断

```typescript
// 问题：空数组是 any[]
const items = [];  // any[]
items.push("string");
items.push(42);  // 没有错误，但类型不安全

// 解决方案：提供类型注解
const typedItems: string[] = [];
typedItems.push("string");
// typedItems.push(42);  // 错误: 'number' 类型的参数...
```

### 对象属性添加

```typescript
// 问题：不能向推断的类型添加属性
const user = { name: "Alice" };
// user.age = 30;  // 错误: 属性 'age' 不存在

// 解决方案：预先定义完整类型
interface User {
  name: string;
  age?: number;
}
const user2: User = { name: "Alice" };
user2.age = 30;  // OK
```

### 回调参数类型

```typescript
// 问题：回调类型没有上下文
const handler = (event) => {  // event 是 any
  console.log(event.target);
};

// 解决方案：提供上下文或注解
const typedHandler = (event: MouseEvent) => {
  console.log(event.target);
};

// 或在上下文中使用
document.addEventListener("click", (event) => {
  // event 是 MouseEvent（上下文类型）
  console.log(event.target);
});
```

## 结论

TypeScript 的类型推断系统是一个强大的特性，它显著减少了所需的显式类型注解数量，同时保持强类型安全。通过理解基本推断、最佳公共类型、上下文类型和控制流分析的工作原理，你可以编写更简洁的代码，充分利用 TypeScript 的能力。

关键要点：

- 当推断清晰正确时，让 TypeScript 推断类型
- 对公共 API 和推断不足时使用显式注解
- 对复杂状态管理利用可辨识联合
- 对自定义收窄使用类型守卫和断言函数
- 注意类型拓宽，在需要时使用 const 断言
- 信任控制流分析在条件语句中收窄类型

掌握类型推断有助于你在类型安全和代码简洁之间取得适当的平衡，从而构建更易维护和健壮的 TypeScript 应用程序。
