---
title: TypeScript 高级类型编程
description: 掌握TypeScript高级类型技术，构建类型安全的应用
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - 类型编程
  - 泛型
  - 类型体操
status: imported
origin: old/src/content/docs/frontend/typescript-advanced.zh.md
divergence: 0.238
issues: []
legacy:
  category: Frontend
  subcategory: TypeScript
  order: 9
  lastUpdated: 2026-01-07
---

TypeScript 的类型系统是图灵完备的，这意味着我们可以在类型层面进行复杂的计算和逻辑判断。掌握高级类型编程技术，能够让我们构建出更加类型安全、可维护的应用程序。本文将深入探讨 TypeScript 中的高级类型技术，包括条件类型、映射类型、模板字面量类型等核心概念。

## 条件类型（Conditional Types）

条件类型是 TypeScript 类型系统中最强大的特性之一，它允许我们根据类型关系动态地选择类型。

### 基础语法

条件类型的语法类似于 JavaScript 中的三元表达式：

```typescript
type ConditionalType<T> = T extends U ? X : Y;
```

如果类型 `T` 可以赋值给类型 `U`，则结果类型为 `X`，否则为 `Y`。

```typescript
// 基础示例：判断类型是否为字符串
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false
type C = IsString<"hello">; // true（字面量类型也是 string 的子类型）

// 更实用的示例：类型过滤
type NonNullable<T> = T extends null | undefined ? never : T;

type Result = NonNullable<string | null | undefined>; // string
```

### 分布式条件类型

当条件类型作用于联合类型时，会自动进行分布式计算，即对联合类型的每个成员分别应用条件类型：

```typescript
type ToArray<T> = T extends any ? T[] : never;

// 分布式计算过程：
// ToArray<string | number>
// = (string extends any ? string[] : never) | (number extends any ? number[] : never)
// = string[] | number[]

type StrOrNumArray = ToArray<string | number>; // string[] | number[]

// 如果想要避免分布式行为，可以用方括号包裹
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type StrOrNumArrayNonDist = ToArrayNonDist<string | number>; // (string | number)[]
```

### 条件类型的嵌套

条件类型可以嵌套使用，实现复杂的类型逻辑：

```typescript
type TypeName<T> = T extends string
  ? "string"
  : T extends number
    ? "number"
    : T extends boolean
      ? "boolean"
      : T extends undefined
        ? "undefined"
        : T extends Function
          ? "function"
          : "object";

type T1 = TypeName<string>;     // "string"
type T2 = TypeName<() => void>; // "function"
type T3 = TypeName<string[]>;   // "object"
```

## infer 关键字

`infer` 关键字用于在条件类型中声明一个待推断的类型变量。它只能在 `extends` 子句中使用，让我们能够从复杂类型中提取出需要的部分。

### 基础用法

```typescript
// 获取数组元素类型
type ElementType<T> = T extends (infer E)[] ? E : never;

type NumElement = ElementType<number[]>;   // number
type StrElement = ElementType<string[]>;   // string
type MixedElement = ElementType<(string | number)[]>; // string | number

// 获取函数返回类型（ReturnType 的实现原理）
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function createUser() {
  return { id: 1, name: "Tom", active: true };
}

type UserType = MyReturnType<typeof createUser>;
// { id: number; name: string; active: boolean; }

// 获取函数参数类型（Parameters 的实现原理）
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

type Params = MyParameters<(a: string, b: number) => void>; // [a: string, b: number]
```

### 高级 infer 应用

```typescript
// 提取 Promise 内部类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type Resolved = UnwrapPromise<Promise<string>>; // string
type NotPromise = UnwrapPromise<number>;        // number

// 递归解包嵌套 Promise
type DeepUnwrapPromise<T> = T extends Promise<infer U>
  ? DeepUnwrapPromise<U>
  : T;

type Deep = DeepUnwrapPromise<Promise<Promise<Promise<number>>>>; // number

// 获取函数第一个参数类型
type FirstArg<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;

type First = FirstArg<(name: string, age: number) => void>; // string

// 获取函数最后一个参数类型
type LastArg<T> = T extends (...args: [...infer _, infer L]) => any ? L : never;

type Last = LastArg<(a: string, b: number, c: boolean) => void>; // boolean

// 提取构造函数实例类型
type InstanceType<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: any) => infer R ? R : any;

class Person {
  constructor(public name: string) {}
}

type PersonInstance = InstanceType<typeof Person>; // Person
```

### 多位置 infer

一个条件类型中可以使用多个 `infer` 声明：

```typescript
// 同时提取函数参数和返回类型
type FunctionInfo<T> = T extends (...args: infer A) => infer R
  ? { args: A; return: R }
  : never;

type Info = FunctionInfo<(x: number, y: string) => boolean>;
// { args: [x: number, y: string]; return: boolean }

// 提取对象的键值类型
type ExtractKeyValue<T> = T extends { [K in infer Key]: infer Value }
  ? { keys: Key; values: Value }
  : never;
```

## 映射类型（Mapped Types）

映射类型允许我们基于旧类型创建新类型，通过遍历键来转换类型结构。

### 基础映射类型

```typescript
// 基础语法
type MappedType<T> = {
  [K in keyof T]: T[K];
};

// 将所有属性变为可选（Partial 的实现）
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// 将所有属性变为必需（Required 的实现）
type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};

// 将所有属性变为只读（Readonly 的实现）
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

// 移除只读修饰符
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

interface User {
  readonly id: number;
  name: string;
  email?: string;
}

type MutableUser = Mutable<User>;
// { id: number; name: string; email?: string; }
```

### 键重映射（Key Remapping）

TypeScript 4.1 引入了键重映射功能，使用 `as` 子句可以在映射过程中转换键：

```typescript
// 为所有键添加前缀
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}${string & K}`]: T[K];
};

interface Person {
  name: string;
  age: number;
}

type PrefixedPerson = Prefixed<Person, "person_">;
// { person_name: string; person_age: number; }

// 过滤特定类型的键
type FilterByValueType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K];
};

interface Mixed {
  name: string;
  age: number;
  active: boolean;
  score: number;
}

type NumberProps = FilterByValueType<Mixed, number>;
// { age: number; score: number; }

// 提取所有方法
type Methods<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

// 将所有属性名转换为大写
type UppercaseKeys<T> = {
  [K in keyof T as Uppercase<string & K>]: T[K];
};

type UpperPerson = UppercaseKeys<Person>;
// { NAME: string; AGE: number; }
```

### 深层映射

```typescript
// 深层只读
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

// 深层可选
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

interface NestedConfig {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
  database: {
    url: string;
  };
}

type ReadonlyConfig = DeepReadonly<NestedConfig>;
type PartialConfig = DeepPartial<NestedConfig>;
```

## 模板字面量类型

TypeScript 4.1 引入了模板字面量类型，允许我们在类型层面进行字符串操作。

### 基础用法

```typescript
// 基础模板字面量类型
type Greeting = `Hello, ${string}!`;

const g1: Greeting = "Hello, World!"; // OK
const g2: Greeting = "Hello, TypeScript!"; // OK
// const g3: Greeting = "Hi, World!"; // Error

// 联合类型的排列组合
type Size = "small" | "medium" | "large";
type Color = "red" | "blue" | "green";

type SizeColor = `${Size}-${Color}`;
// "small-red" | "small-blue" | "small-green" |
// "medium-red" | "medium-blue" | "medium-green" |
// "large-red" | "large-blue" | "large-green"

// 事件名称类型
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<"click">; // "onClick"
type MouseMoveEvent = EventName<"mouseMove">; // "onMouseMove"
```

### 内置字符串操作类型

TypeScript 提供了四个内置的字符串操作类型：

```typescript
// Uppercase<S> - 转换为大写
type Upper = Uppercase<"hello">; // "HELLO"

// Lowercase<S> - 转换为小写
type Lower = Lowercase<"HELLO">; // "hello"

// Capitalize<S> - 首字母大写
type Cap = Capitalize<"hello">; // "Hello"

// Uncapitalize<S> - 首字母小写
type Uncap = Uncapitalize<"Hello">; // "hello"
```

### 字符串类型推断

结合 `infer` 和模板字面量类型，可以实现复杂的字符串解析：

```typescript
// 提取字符串中的特定部分
type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : T extends `${infer _Start}:${infer Param}`
      ? Param
      : never;

type Params = ExtractRouteParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"

// CamelCase 转换
type CamelCase<S extends string> =
  S extends `${infer First}_${infer Rest}`
    ? `${Lowercase<First>}${Capitalize<CamelCase<Rest>>}`
    : Lowercase<S>;

type Camel = CamelCase<"hello_world_foo_bar">; // "helloWorldFooBar"

// kebab-case 转换
type KebabCase<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? First extends Uppercase<First>
      ? `-${Lowercase<First>}${KebabCase<Rest>}`
      : `${First}${KebabCase<Rest>}`
    : S;

type Kebab = KebabCase<"backgroundColor">; // "-background-color"（首字母需要额外处理）

// 字符串分割
type Split<S extends string, D extends string> =
  S extends `${infer First}${D}${infer Rest}`
    ? [First, ...Split<Rest, D>]
    : S extends ""
      ? []
      : [S];

type Parts = Split<"a-b-c", "-">; // ["a", "b", "c"]
```

### 实际应用：类型安全的路由系统

```typescript
// 路由参数提取和验证
type ExtractParams<Path extends string> =
  Path extends `${infer _}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractParams<`/${Rest}`>]: string }
    : Path extends `${infer _}:${infer Param}`
      ? { [K in Param]: string }
      : {};

type UserRouteParams = ExtractParams<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }

function navigate<Path extends string>(
  path: Path,
  params: ExtractParams<Path>
): void {
  // 实现导航逻辑
}

navigate("/users/:userId/posts/:postId", {
  userId: "123",
  postId: "456"
}); // OK

// navigate("/users/:userId", { postId: "456" }); // Error: 缺少 userId
```

## 内置工具类型深入

TypeScript 提供了丰富的内置工具类型，理解它们的实现原理有助于我们编写更高级的类型。

### 属性操作类型

```typescript
// Pick<T, K> - 选取指定属性
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit<T, K> - 排除指定属性
type MyOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// 实际应用
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

type PublicUser = Omit<User, "password">; // 排除敏感信息
type UserCredentials = Pick<User, "email" | "password">; // 登录凭证
```

### 联合类型操作

```typescript
// Exclude<T, U> - 从 T 中排除可以赋值给 U 的类型
type MyExclude<T, U> = T extends U ? never : T;

type T1 = Exclude<"a" | "b" | "c", "a" | "b">; // "c"

// Extract<T, U> - 从 T 中提取可以赋值给 U 的类型
type MyExtract<T, U> = T extends U ? T : never;

type T2 = Extract<"a" | "b" | "c", "a" | "f">; // "a"

// NonNullable<T> - 排除 null 和 undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;

type T3 = NonNullable<string | null | undefined>; // string
```

### 函数相关类型

```typescript
// ReturnType<T> - 获取函数返回类型
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;

// Parameters<T> - 获取函数参数类型元组
type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

// ConstructorParameters<T> - 获取构造函数参数类型
type MyConstructorParameters<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: infer P) => any ? P : never;

// ThisParameterType<T> - 获取函数的 this 参数类型
type MyThisParameterType<T> =
  T extends (this: infer U, ...args: any[]) => any ? U : unknown;

// OmitThisParameter<T> - 移除函数的 this 参数
type MyOmitThisParameter<T> =
  T extends (this: any, ...args: infer A) => infer R
    ? (...args: A) => R
    : T;
```

### Record 和索引签名

```typescript
// Record<K, T> - 创建具有指定键类型和值类型的对象类型
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};

// 应用示例：状态管理
type LoadingState = "idle" | "loading" | "success" | "error";

type StateHandlers = Record<LoadingState, () => void>;

const handlers: StateHandlers = {
  idle: () => console.log("Idle"),
  loading: () => console.log("Loading..."),
  success: () => console.log("Success!"),
  error: () => console.log("Error occurred"),
};

// 带类型检查的对象映射
type PageRoutes = Record<
  "home" | "about" | "contact",
  { path: string; component: React.ComponentType }
>;
```

## 类型守卫与类型收窄

类型守卫是运行时检查，用于将类型收窄到更具体的类型。

### 内置类型守卫

```typescript
function processValue(value: string | number | null) {
  // typeof 类型守卫
  if (typeof value === "string") {
    console.log(value.toUpperCase()); // value: string
  } else if (typeof value === "number") {
    console.log(value.toFixed(2)); // value: number
  } else {
    console.log("Value is null"); // value: null
  }
}

// instanceof 类型守卫
class Dog {
  bark() {
    console.log("Woof!");
  }
}

class Cat {
  meow() {
    console.log("Meow!");
  }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark(); // animal: Dog
  } else {
    animal.meow(); // animal: Cat
  }
}

// in 操作符类型守卫
interface Fish {
  swim: () => void;
}

interface Bird {
  fly: () => void;
}

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim(); // animal: Fish
  } else {
    animal.fly(); // animal: Bird
  }
}
```

### 自定义类型守卫

使用 `is` 关键字创建自定义类型守卫函数：

```typescript
// 基础自定义类型守卫
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function processUnknown(value: unknown) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // value: string
  }
}

// 复杂对象的类型守卫
interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return response.success === true;
}

async function fetchUser(): Promise<ApiResponse<User>> {
  // 模拟 API 调用
  return { success: true, data: { id: 1, name: "Tom", email: "tom@example.com" } };
}

async function handleUserFetch() {
  const response = await fetchUser();
  if (isApiSuccess(response)) {
    console.log(response.data.name); // 类型安全访问
  } else {
    console.error(response.error);
  }
}

// 数组类型守卫
function isArrayOfStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

// 可辨识联合（Discriminated Union）
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
  }
}
```

### 断言函数（Assertion Functions）

TypeScript 3.7 引入了断言函数，它们在运行时进行检查，如果检查失败则抛出错误：

```typescript
// 断言函数签名使用 asserts 关键字
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Value must be a string");
  }
}

function assertNonNull<T>(value: T): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error("Value cannot be null or undefined");
  }
}

function processData(data: unknown) {
  assertIsString(data);
  // 此后 data 的类型为 string
  console.log(data.toUpperCase());
}

// 带条件的断言
function assertIsDefined<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message ?? "Value is not defined");
  }
}
```

## 声明合并

TypeScript 支持声明合并，允许将多个同名声明合并为一个定义。

### 接口合并

```typescript
// 同名接口会自动合并
interface User {
  id: number;
  name: string;
}

interface User {
  email: string;
  createdAt: Date;
}

// 合并后的 User 接口
const user: User = {
  id: 1,
  name: "Tom",
  email: "tom@example.com",
  createdAt: new Date(),
};

// 函数重载合并
interface Document {
  createElement(tagName: "div"): HTMLDivElement;
  createElement(tagName: "span"): HTMLSpanElement;
}

interface Document {
  createElement(tagName: "canvas"): HTMLCanvasElement;
  createElement(tagName: string): HTMLElement;
}

// 注意：后声明的重载会排在前面（除了字符串字面量重载）
```

### 命名空间与类/函数/枚举合并

```typescript
// 为类添加静态成员
class Album {
  label: Album.AlbumLabel | undefined;
}

namespace Album {
  export interface AlbumLabel {
    name: string;
    color: string;
  }

  export function createDefault(): Album {
    return new Album();
  }
}

const album = Album.createDefault();

// 为函数添加属性
function buildName(firstName: string, lastName?: string) {
  return firstName + (lastName ? " " + lastName : "");
}

namespace buildName {
  export const defaultLastName = "Smith";
  export function withDefault(firstName: string) {
    return buildName(firstName, defaultLastName);
  }
}

console.log(buildName.withDefault("John")); // "John Smith"

// 为枚举添加函数
enum Color {
  Red = 1,
  Green = 2,
  Blue = 4,
}

namespace Color {
  export function mixColors(c1: Color, c2: Color): Color {
    return c1 | c2;
  }
}

const purple = Color.mixColors(Color.Red, Color.Blue);
```

## 模块增强

模块增强允许我们扩展第三方模块的类型定义。

### 扩展第三方库类型

```typescript
// 假设我们使用 express
// 扩展 Express 的 Request 接口

// types/express.d.ts
import "express";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
    sessionId?: string;
  }
}

// 现在可以在代码中使用扩展的属性
import express from "express";

const app = express();

app.use((req, res, next) => {
  // TypeScript 现在认识 req.user
  if (req.user) {
    console.log(req.user.id);
  }
  next();
});
```

### 全局模块增强

```typescript
// 扩展全局对象
declare global {
  interface Window {
    myApp: {
      version: string;
      debug: boolean;
    };
  }

  interface Array<T> {
    customMethod(): T[];
  }
}

// 实现扩展的方法
Array.prototype.customMethod = function () {
  return [...this];
};

// 使用
window.myApp = { version: "1.0.0", debug: true };
const arr = [1, 2, 3].customMethod();
```

### 扩展 Vue/React 类型

```typescript
// 扩展 Vue 组件选项
// types/vue.d.ts
import "vue";

declare module "vue" {
  interface ComponentCustomOptions {
    permissions?: string[];
  }

  interface ComponentCustomProperties {
    $api: typeof import("@/api").default;
  }
}

// 扩展 React 类型
// types/react.d.ts
import "react";

declare module "react" {
  interface CSSProperties {
    "--custom-property"?: string;
    [key: `--${string}`]: string | number | undefined;
  }
}
```

## 类型体操实战

类型体操是指在类型层面进行复杂的计算和操作。以下是一些经典的类型体操案例。

### 实现 Tuple 相关操作

```typescript
// 元组转联合类型
type TupleToUnion<T extends readonly any[]> = T[number];

type Union = TupleToUnion<["a", "b", "c"]>; // "a" | "b" | "c"

// 元组长度
type Length<T extends readonly any[]> = T["length"];

type Len = Length<[1, 2, 3, 4, 5]>; // 5

// 元组第一个元素
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

type F = First<[1, 2, 3]>; // 1

// 元组最后一个元素
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type L = Last<[1, 2, 3]>; // 3

// 元组 Push
type Push<T extends any[], E> = [...T, E];

type Pushed = Push<[1, 2], 3>; // [1, 2, 3]

// 元组 Pop
type Pop<T extends any[]> = T extends [...infer R, any] ? R : never;

type Popped = Pop<[1, 2, 3]>; // [1, 2]

// 元组反转
type Reverse<T extends any[]> = T extends [infer F, ...infer R]
  ? [...Reverse<R>, F]
  : [];

type Reversed = Reverse<[1, 2, 3]>; // [3, 2, 1]
```

### 实现字符串操作

```typescript
// 字符串长度（通过转换为元组）
type StringLength<S extends string> = Split<S, "">["length"];

type StrLen = StringLength<"hello">; // 5

// 字符串替换
type Replace<
  S extends string,
  From extends string,
  To extends string
> = From extends ""
  ? S
  : S extends `${infer F}${From}${infer R}`
    ? `${F}${To}${R}`
    : S;

type Replaced = Replace<"hello world", "world", "TypeScript">;
// "hello TypeScript"

// 全局替换
type ReplaceAll<
  S extends string,
  From extends string,
  To extends string
> = From extends ""
  ? S
  : S extends `${infer F}${From}${infer R}`
    ? ReplaceAll<`${F}${To}${R}`, From, To>
    : S;

type ReplacedAll = ReplaceAll<"a-b-c-d", "-", "_">; // "a_b_c_d"

// 去除首尾空格
type TrimLeft<S extends string> = S extends `${" " | "\n" | "\t"}${infer R}`
  ? TrimLeft<R>
  : S;

type TrimRight<S extends string> = S extends `${infer L}${" " | "\n" | "\t"}`
  ? TrimRight<L>
  : S;

type Trim<S extends string> = TrimRight<TrimLeft<S>>;

type Trimmed = Trim<"  hello world  ">; // "hello world"
```

### 实现对象操作

```typescript
// 深度合并两个类型
type DeepMerge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U
    ? K extends keyof T
      ? T[K] extends object
        ? U[K] extends object
          ? DeepMerge<T[K], U[K]>
          : U[K]
        : U[K]
      : U[K]
    : K extends keyof T
      ? T[K]
      : never;
};

type A = { a: { b: 1; c: 2 }; d: 3 };
type B = { a: { b: 10; e: 4 }; f: 5 };
type Merged = DeepMerge<A, B>;
// { a: { b: 10; c: 2; e: 4 }; d: 3; f: 5 }

// 路径类型
type PathKeys<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T]: K extends string
        ?
            | `${Prefix}${K}`
            | PathKeys<T[K], `${Prefix}${K}.`>
        : never;
    }[keyof T]
  : never;

interface Config {
  server: {
    host: string;
    port: number;
  };
  database: {
    url: string;
  };
}

type ConfigPaths = PathKeys<Config>;
// "server" | "server.host" | "server.port" | "database" | "database.url"

// 获取路径值类型
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

type HostType = PathValue<Config, "server.host">; // string
```

### 实现类型安全的 EventEmitter

```typescript
type EventMap = {
  userLogin: { userId: string; timestamp: Date };
  userLogout: { userId: string };
  pageView: { path: string; referrer?: string };
  error: { message: string; stack?: string };
};

class TypedEventEmitter<Events extends Record<string, any>> {
  private listeners: {
    [K in keyof Events]?: Array<(payload: Events[K]) => void>;
  } = {};

  on<E extends keyof Events>(
    event: E,
    listener: (payload: Events[E]) => void
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);

    // 返回取消订阅函数
    return () => {
      const idx = this.listeners[event]!.indexOf(listener);
      if (idx > -1) {
        this.listeners[event]!.splice(idx, 1);
      }
    };
  }

  emit<E extends keyof Events>(event: E, payload: Events[E]): void {
    this.listeners[event]?.forEach((listener) => listener(payload));
  }

  once<E extends keyof Events>(
    event: E,
    listener: (payload: Events[E]) => void
  ): void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      listener(payload);
    });
  }
}

// 使用
const emitter = new TypedEventEmitter<EventMap>();

emitter.on("userLogin", ({ userId, timestamp }) => {
  console.log(`User ${userId} logged in at ${timestamp}`);
});

emitter.emit("userLogin", {
  userId: "123",
  timestamp: new Date(),
}); // OK

// emitter.emit("userLogin", { userId: "123" }); // Error: 缺少 timestamp
```

## 面试要点

### 高频面试题

**1. 条件类型中的分布式特性是什么？如何避免？**

当条件类型作用于裸类型参数（naked type parameter）的联合类型时，会自动分布：

```typescript
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>; // string[] | number[]

// 避免分布式行为，使用方括号包裹
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type Result2 = ToArrayNonDist<string | number>; // (string | number)[]
```

**2. 实现一个 DeepRequired 类型**

```typescript
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepRequired<T[K]>
    : T[K];
};
```

**3. 如何提取对象中所有方法的名称？**

```typescript
type MethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
```

**4. 协变与逆变是什么？**

- 协变（Covariance）：子类型可以赋值给父类型（数组元素类型、函数返回类型）
- 逆变（Contravariance）：父类型可以赋值给子类型（函数参数类型）
- 双变（Bivariance）：TypeScript 中方法参数默认是双变的
- 不变（Invariance）：既不协变也不逆变

```typescript
// 协变示例
let animals: Animal[] = [];
let dogs: Dog[] = [];
animals = dogs; // OK - 数组是协变的

// 逆变示例
type Handler<T> = (arg: T) => void;
let animalHandler: Handler<Animal> = (a) => {};
let dogHandler: Handler<Dog> = animalHandler; // OK - 参数是逆变的
```

**5. 如何实现一个类型安全的 get 函数？**

```typescript
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

function get<T, P extends string>(obj: T, path: P): PathValue<T, P> {
  return path.split(".").reduce((acc, key) => acc?.[key], obj as any);
}
```

### 进阶考察点

- 类型推断的优先级和规则
- 条件类型的延迟解析特性
- 递归类型的深度限制和优化
- 类型兼容性与结构类型系统
- 声明文件的编写规范
- 模块解析策略

## 延伸阅读

### 官方资源

- [TypeScript 官方文档 - 高级类型](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [TypeScript 官方文档 - 模板字面量类型](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [TypeScript 发布说明](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html)

### 进阶学习

- [type-challenges](https://github.com/type-challenges/type-challenges) - 类型体操练习题库，从简单到困难
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - 深入理解 TypeScript
- [Total TypeScript](https://www.totaltypescript.com/) - Matt Pocock 的高级 TypeScript 教程
- [TypeScript 类型系统趣谈](https://zhuanlan.zhihu.com/p/64446259) - 中文深度解析

### 实用工具

- [ts-toolbelt](https://github.com/millsp/ts-toolbelt) - 1000+ 高级类型工具库
- [utility-types](https://github.com/piotrwitek/utility-types) - 实用类型工具集合
- [type-fest](https://github.com/sindresorhus/type-fest) - 常用类型工具集
- [TypeScript Playground](https://www.typescriptlang.org/play) - 在线实验环境

---

TypeScript 的高级类型编程需要大量练习和实践。建议从理解基础概念开始，逐步深入到复杂的类型体操。在实际项目中，应该在类型安全和代码可读性之间找到平衡，避免过度复杂的类型定义影响代码的可维护性。记住，类型系统的目的是帮助我们编写更安全、更可靠的代码，而不是炫技。
