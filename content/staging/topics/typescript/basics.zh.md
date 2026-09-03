---
title: TypeScript 基础类型
description: 掌握 TypeScript 基础类型：原始类型、数组、元组、枚举与类型注解
track: typescript
section: type-system
difficulty: beginner
tags:
  - TypeScript
  - 类型
  - 基础
  - 类型注解
status: imported
origin: old/src/content/docs/typescript/basics.zh.md
divergence: 0.32
issues: []
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 1
  lastUpdated: 2026-01-07
---

TypeScript 是 JavaScript 的超集，为 JavaScript 添加了静态类型系统。掌握 TypeScript 的基础类型是编写类型安全代码的第一步。本文将全面介绍 TypeScript 的基础类型系统。

## 原始类型（Primitive Types）

TypeScript 支持 JavaScript 的所有原始类型，并为它们提供了类型注解。

### 布尔类型（Boolean）

布尔类型表示真或假的值。

```typescript
let isDone: boolean = false;
let isActive: boolean = true;

// 错误示例
// let invalid: boolean = 1; // Error: Type 'number' is not assignable to type 'boolean'
```

### 数字类型（Number）

TypeScript 中所有数字都是浮点数，类型为 `number`。支持十进制、十六进制、二进制和八进制字面量。

```typescript
let decimal: number = 6;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;
let big: number = 1_000_000; // 数字分隔符
```

### 字符串类型（String）

字符串类型使用 `string` 表示，可以使用单引号、双引号或模板字符串。

```typescript
let color: string = "blue";
let name: string = 'Alice';

// 模板字符串
let age: number = 30;
let sentence: string = `我叫 ${name}，今年 ${age} 岁。`;
```

### 符号类型（Symbol）

Symbol 是 ES6 引入的原始类型，用于创建唯一的标识符。

```typescript
let sym1: symbol = Symbol("key");
let sym2: symbol = Symbol("key");

console.log(sym1 === sym2); // false，每个 Symbol 都是唯一的
```

### 大整数类型（BigInt）

BigInt 用于表示任意精度的整数。

```typescript
let big1: bigint = 100n;
let big2: bigint = BigInt(100);

// 注意：不能混用 number 和 bigint
// let invalid = big1 + 100; // Error
let valid: bigint = big1 + 100n; // 正确
```

## 数组与元组

### 数组（Array）

TypeScript 提供两种方式定义数组类型。

```typescript
// 方式 1：类型 + 方括号
let list1: number[] = [1, 2, 3];
let names: string[] = ["Alice", "Bob", "Charlie"];

// 方式 2：泛型数组
let list2: Array<number> = [1, 2, 3];
let flags: Array<boolean> = [true, false, true];

// 多维数组
let matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6]
];

// 混合类型数组（使用联合类型）
let mixed: (number | string)[] = [1, "two", 3, "four"];
```

### 元组（Tuple）

元组类型允许表示一个已知元素数量和类型的数组，各元素的类型不必相同。

```typescript
// 声明元组
let tuple: [string, number];
tuple = ["hello", 10]; // 正确
// tuple = [10, "hello"]; // 错误：类型不匹配

// 访问元组元素
console.log(tuple[0].substring(1)); // "ello"
console.log(tuple[1].toFixed(2)); // "10.00"

// 元组解构
let [str, num] = tuple;

// 可选元素
let optionalTuple: [string, number?];
optionalTuple = ["hello"];
optionalTuple = ["hello", 10];

// 剩余元素
let restTuple: [string, ...number[]];
restTuple = ["label", 1, 2, 3, 4];

// 只读元组
let readonlyTuple: readonly [string, number] = ["hello", 10];
// readonlyTuple[0] = "world"; // Error: 只读属性
```

### 元组的实际应用

```typescript
// 函数返回多个值
function getUserInfo(): [string, number, boolean] {
  return ["Alice", 30, true];
}

const [username, age, isActive] = getUserInfo();

// 坐标系统
type Point2D = [number, number];
type Point3D = [number, number, number];

let point: Point2D = [10, 20];
let space: Point3D = [10, 20, 30];
```

## 枚举（Enum）

枚举用于定义一组命名常量，使代码更具可读性。

### 数字枚举

```typescript
// 默认从 0 开始
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}

let dir: Direction = Direction.Up;
console.log(dir); // 0

// 自定义起始值
enum Status {
  Pending = 1,
  Approved,  // 2
  Rejected   // 3
}

// 自定义所有值
enum HttpStatus {
  OK = 200,
  NotFound = 404,
  InternalServerError = 500
}
```

### 字符串枚举

```typescript
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}

let favoriteColor: Color = Color.Red;
console.log(favoriteColor); // "RED"

// 实际应用：API 响应状态
enum ApiStatus {
  Success = "SUCCESS",
  Error = "ERROR",
  Loading = "LOADING"
}

function handleResponse(status: ApiStatus) {
  if (status === ApiStatus.Success) {
    console.log("请求成功");
  }
}
```

### 异构枚举

虽然不推荐，但 TypeScript 支持混合字符串和数字的枚举。

```typescript
enum Mixed {
  No = 0,
  Yes = "YES"
}
```

### 常量枚举

使用 `const enum` 可以在编译时完全移除枚举，提高性能。

```typescript
const enum LogLevel {
  Debug,
  Info,
  Warning,
  Error
}

let level = LogLevel.Error; // 编译后直接替换为 3
```

### 反向映射

数字枚举支持反向映射，可以从值获取名称。

```typescript
enum Response {
  No = 0,
  Yes = 1
}

console.log(Response[0]); // "No"
console.log(Response[1]); // "Yes"
console.log(Response.No); // 0
```

## 特殊类型

### any 类型

`any` 类型可以赋值为任意类型，会跳过类型检查。应尽量避免使用。

```typescript
let notSure: any = 4;
notSure = "也许是字符串";
notSure = false; // 都可以

// any 类型的变量可以访问任意属性和方法
notSure.toFixed();
notSure.substring(0, 1);

// 数组中使用 any
let list: any[] = [1, true, "free"];
list[1] = 100;
```

### unknown 类型

`unknown` 是类型安全的 `any`。使用前必须进行类型检查。

```typescript
let value: unknown;

value = true;
value = 42;
value = "hello";

// 不能直接使用
// let value1: boolean = value; // Error
// value.toFixed(); // Error

// 必须先进行类型检查
if (typeof value === "string") {
  console.log(value.toUpperCase()); // 正确
}

// 类型断言
let strValue: string = value as string;

// 类型守卫
function isString(x: unknown): x is string {
  return typeof x === "string";
}

if (isString(value)) {
  console.log(value.length); // 正确
}
```

### never 类型

`never` 表示永不存在的值的类型，通常用于永不返回的函数。

```typescript
// 抛出异常的函数
function error(message: string): never {
  throw new Error(message);
}

// 无限循环
function infiniteLoop(): never {
  while (true) {
    // ...
  }
}

// never 是所有类型的子类型
function check(x: string | number): string {
  if (typeof x === "string") {
    return x;
  } else if (typeof x === "number") {
    return x.toString();
  }
  // 这里 x 的类型是 never
  return error("未知类型");
}

// 使用 never 进行完整性检查
type Shape = Circle | Square;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size ** 2;
    default:
      // 如果添加新类型但忘记处理，这里会报错
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

### void 类型

`void` 表示没有任何类型，通常用于没有返回值的函数。

```typescript
// 函数没有返回值
function warnUser(): void {
  console.log("这是一个警告消息");
}

// void 类型的变量只能赋值为 undefined 或 null
let unusable: void = undefined;

// 实际应用：回调函数
function doSomething(callback: () => void): void {
  callback();
}

doSomething(() => {
  console.log("执行回调");
});
```

## null 和 undefined

在 TypeScript 中，`null` 和 `undefined` 有各自的类型。

```typescript
let u: undefined = undefined;
let n: null = null;

// strictNullChecks 模式
// 默认情况下，null 和 undefined 是所有类型的子类型
let num: number = undefined; // strictNullChecks: false 时允许
let str: string = null; // strictNullChecks: false 时允许

// 推荐启用 strictNullChecks
// 此时需要使用联合类型
let maybeNumber: number | null = null;
maybeNumber = 42;

let maybeString: string | undefined = undefined;
maybeString = "hello";

// 可选属性自动包含 undefined
interface User {
  name: string;
  age?: number; // 等同于 number | undefined
}

let user: User = { name: "Alice" };
user.age = 30;
```

### 非空断言操作符

使用 `!` 可以断言某个值不为 `null` 或 `undefined`。

```typescript
function getValue(): string | null {
  return "value";
}

let value = getValue();
// let length = value.length; // Error: 对象可能为 null

// 使用非空断言
let length = value!.length; // 告诉编译器 value 不为 null

// 可选链更安全
let safeLength = value?.length; // 如果 value 为 null，返回 undefined
```

### 空值合并操作符

```typescript
let input: string | null = null;

// 使用 || 可能有问题
let value1 = input || "default"; // "default"

// 使用 ?? 更精确（只处理 null 和 undefined）
let value2 = input ?? "default"; // "default"

let zero = 0;
console.log(zero || 100); // 100
console.log(zero ?? 100); // 0（更符合预期）
```

## 类型注解与类型推断

### 类型注解

类型注解是显式告诉 TypeScript 变量的类型。

```typescript
// 变量类型注解
let age: number = 30;
let name: string = "Alice";
let isActive: boolean = true;

// 函数参数和返回值类型注解
function add(a: number, b: number): number {
  return a + b;
}

// 对象类型注解
let person: { name: string; age: number } = {
  name: "Bob",
  age: 25
};

// 数组类型注解
let numbers: number[] = [1, 2, 3];

// 函数类型注解
let greet: (name: string) => string;
greet = function(name: string): string {
  return `Hello, ${name}`;
};
```

### 类型推断

TypeScript 可以自动推断变量的类型。

```typescript
// 自动推断为 number
let count = 10;

// 自动推断为 string
let message = "Hello";

// 自动推断为 (number, number) => number
function multiply(a: number, b: number) {
  return a * b;
}

// 自动推断数组类型
let items = [1, 2, 3]; // number[]
let mixed = [1, "two", true]; // (number | string | boolean)[]

// 上下文类型推断
window.onmousedown = function(mouseEvent) {
  // mouseEvent 自动推断为 MouseEvent
  console.log(mouseEvent.button);
};
```

### 最佳类型推断

当需要从多个表达式推断类型时，TypeScript 会计算最佳通用类型。

```typescript
// 推断为 (number | null)[]
let values = [1, 2, null];

// 推断为 number[]（最佳通用类型）
let numbers = [1, 2, 3];

// 需要显式注解以包含基类
class Animal {}
class Dog extends Animal {}
class Cat extends Animal {}

// 推断为 (Dog | Cat)[]
let pets = [new Dog(), new Cat()];

// 显式注解为 Animal[]
let animals: Animal[] = [new Dog(), new Cat()];
```

### 何时使用类型注解

```typescript
// 1. 声明变量但稍后赋值
let username: string;
username = "Alice";

// 2. 变量类型无法推断
let data: any = fetchData();

// 3. 函数返回值（虽然可以推断，但建议显式注解）
function calculate(x: number, y: number): number {
  return x + y;
}

// 4. 对象字面量
const config: { timeout: number; retries: number } = {
  timeout: 3000,
  retries: 3
};
```

## 实践建议

### 优先使用类型推断

```typescript
// 好的做法
let count = 10;
let message = "Hello";

// 不必要的注解
let count: number = 10;
let message: string = "Hello";
```

### 避免使用 any

```typescript
// 不推荐
function processData(data: any) {
  return data.value;
}

// 推荐：使用 unknown 或具体类型
function processData(data: unknown) {
  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as { value: any }).value;
  }
}
```

### 启用严格模式

在 `tsconfig.json` 中启用严格检查：

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true
  }
}
```

### 使用字面量类型提高精确性

```typescript
// 使用字面量类型而不是 string
type Direction = "up" | "down" | "left" | "right";

function move(direction: Direction) {
  // ...
}

move("up"); // 正确
// move("diagonal"); // Error
```

### 善用联合类型和类型守卫

```typescript
function processValue(value: string | number) {
  if (typeof value === "string") {
    // TypeScript 知道这里 value 是 string
    return value.toUpperCase();
  } else {
    // TypeScript 知道这里 value 是 number
    return value.toFixed(2);
  }
}
```

## 总结

TypeScript 的基础类型系统为 JavaScript 提供了强大的类型安全保障。掌握这些基础类型是编写高质量 TypeScript 代码的基础：

- **原始类型**：boolean, number, string, symbol, bigint
- **数组与元组**：灵活的集合类型和固定结构的元组
- **枚举**：提高代码可读性的命名常量
- **特殊类型**：any, unknown, never, void 各有其适用场景
- **null 和 undefined**：正确处理空值是类型安全的重要部分
- **类型注解与推断**：在需要时使用注解，其他时候依赖推断

通过合理使用这些基础类型，你可以编写出更安全、更易维护的代码。在后续学习中，我们将探讨更高级的类型特性，如接口、泛型和高级类型。
