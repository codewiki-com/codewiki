---
title: TypeScript infer 关键字深度解析
description: 深入掌握 TypeScript infer 关键字，包括条件类型推断、返回类型提取、元组推断、递归类型等高级应用
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - infer
  - 条件类型
  - 类型推断
  - 类型编程
status: imported
origin: old/src/content/docs/typescript/infer.zh.md
divergence: 0.235
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: TypeScript
  subcategory: 高级类型
  order: 14
  lastUpdated: 2026-01-07
---

`infer` 是 TypeScript 类型系统中最强大且最具表现力的关键字之一。它允许我们在条件类型中声明一个待推断的类型变量，从而实现从复杂类型结构中提取、转换和操作类型信息的能力。掌握 `infer` 是进阶 TypeScript 类型编程的必经之路。

## 概念解释

### 什么是 infer？

`infer` 关键字只能在条件类型（Conditional Types）的 `extends` 子句中使用，用于声明一个类型变量，该变量会在类型匹配过程中被 TypeScript 编译器自动推断出具体类型。

```typescript
// 基本语法结构
type SomeType<T> = T extends SomePattern<infer U> ? U : DefaultType;
```

在这个模式中：
- `T` 是输入类型
- `SomePattern<infer U>` 是我们期望匹配的类型模式
- `U` 是被推断出的类型变量
- 如果 `T` 匹配模式，则返回 `U`；否则返回 `DefaultType`

### infer 解决了什么问题？

在 `infer` 出现之前，TypeScript 没有办法从复杂类型中"提取"出部分类型信息。例如：

```typescript
// 假设我们有一个函数类型，如何获取它的返回类型？
type MyFunction = (x: number, y: string) => boolean;

// 在没有 infer 之前，这是无法做到的
// 有了 infer，我们可以这样写：
type GetReturn<T> = T extends (...args: any[]) => infer R ? R : never;

type Result = GetReturn<MyFunction>; // boolean
```

### 历史背景

`infer` 关键字是在 TypeScript 2.8 版本（2018年3月发布）中随条件类型一起引入的。这一特性的加入极大地增强了 TypeScript 类型系统的表达能力，使得许多原本无法实现的高级类型操作成为可能，包括内置工具类型如 `ReturnType`、`Parameters`、`InstanceType` 等的实现。

## 核心原理

### 类型模式匹配

`infer` 的工作原理基于类型模式匹配。TypeScript 编译器会尝试将输入类型与指定的模式进行匹配，在匹配过程中推断出 `infer` 声明的类型变量。

```typescript
// 模式匹配示意
type Unwrap<T> = T extends Promise<infer U> ? U : T;

// 当 T = Promise<string> 时：
// 1. 编译器检查 Promise<string> 是否可以匹配 Promise<infer U>
// 2. 匹配成功，U 被推断为 string
// 3. 返回 U，即 string
type A = Unwrap<Promise<string>>; // string

// 当 T = number 时：
// 1. 编译器检查 number 是否可以匹配 Promise<infer U>
// 2. 匹配失败
// 3. 返回 T，即 number
type B = Unwrap<number>; // number
```

### 推断位置的影响

`infer` 可以出现在类型模式的不同位置，位置决定了推断的内容：

```typescript
// 在泛型参数位置推断
type ExtractArrayElement<T> = T extends Array<infer E> ? E : never;

// 在函数返回值位置推断
type ExtractReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 在函数参数位置推断
type ExtractFirstArg<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;

// 在对象属性值位置推断
type ExtractValue<T> = T extends { value: infer V } ? V : never;

// 在模板字面量位置推断
type ExtractPrefix<T> = T extends `${infer P}_${string}` ? P : never;
```

### 协变与逆变位置

当同一个 `infer` 变量出现在多个位置时，推断结果取决于这些位置的协变/逆变性质：

```typescript
// 协变位置（如返回值、属性值）：推断联合类型
type CovariantInfer<T> = T extends { a: infer U; b: infer U } ? U : never;
type Co = CovariantInfer<{ a: string; b: number }>; // string | number

// 逆变位置（如函数参数）：推断交叉类型
type ContravariantInfer<T> = T extends {
  fn1: (x: infer U) => void;
  fn2: (x: infer U) => void;
} ? U : never;

type Contra = ContravariantInfer<{
  fn1: (x: { a: string }) => void;
  fn2: (x: { b: number }) => void;
}>; // { a: string } & { b: number }
```

## 核心要点

### infer 只能在条件类型中使用

```typescript
// 正确：在 extends 子句中使用
type Correct<T> = T extends (infer U)[] ? U : never;

// 错误：不能直接使用
// type Wrong<T> = infer U; // Error
// type AlsoWrong<T> = Array<infer U>; // Error
```

### infer 声明的变量只在 true 分支中可用

```typescript
type Example<T> = T extends (...args: infer P) => infer R
  ? { params: P; return: R }  // P 和 R 在这里可用
  : never;                     // P 和 R 在这里不可用

type Func = Example<(x: number) => string>;
// { params: [x: number]; return: string }
```

### 可以声明多个 infer 变量

```typescript
type FunctionInfo<T> = T extends (
  this: infer This,
  ...args: infer Args
) => infer Return
  ? {
      thisType: This;
      arguments: Args;
      returnType: Return;
    }
  : never;

function greet(this: { name: string }, greeting: string): void {
  console.log(`${greeting}, ${this.name}!`);
}

type GreetInfo = FunctionInfo<typeof greet>;
// {
//   thisType: { name: string };
//   arguments: [greeting: string];
//   returnType: void;
// }
```

### infer 可以配合约束使用（TypeScript 4.7+）

```typescript
// 在 infer 上添加约束
type FirstString<T> = T extends [infer S extends string, ...unknown[]] ? S : never;

type A = FirstString<["hello", 1, 2]>; // "hello"
type B = FirstString<[123, "world"]>;   // never（第一个元素不是 string）

// 更复杂的约束
type ExtractFunction<T> = T extends infer F extends (...args: any[]) => any ? F : never;
```

### infer 在分布式条件类型中的行为

```typescript
type ElementOf<T> = T extends (infer E)[] ? E : never;

// 联合类型会分布
type Mixed = ElementOf<string[] | number[]>;
// 等价于: ElementOf<string[]> | ElementOf<number[]>
// 结果: string | number

// 如果不想分布，使用元组包裹
type ElementOfNonDist<T> = [T] extends [(infer E)[]] ? E : never;
type NonDist = ElementOfNonDist<string[] | number[]>;
// 结果: string | number（作为整体推断）
```

## 代码示例

### 示例1：推断函数返回类型

```typescript
// 实现 ReturnType 工具类型
type MyReturnType<T extends (...args: any[]) => any> =
  T extends (...args: any[]) => infer R ? R : never;

// 测试
function createUser(name: string, age: number) {
  return { id: Math.random(), name, age, createdAt: new Date() };
}

type User = MyReturnType<typeof createUser>;
// { id: number; name: string; age: number; createdAt: Date }

// 处理异步函数
type AsyncReturnType<T extends (...args: any[]) => Promise<any>> =
  T extends (...args: any[]) => Promise<infer R> ? R : never;

async function fetchUser(id: number): Promise<{ name: string; email: string }> {
  return { name: "Alice", email: "alice@example.com" };
}

type FetchedUser = AsyncReturnType<typeof fetchUser>;
// { name: string; email: string }
```

### 示例2：推断函数参数类型

```typescript
// 实现 Parameters 工具类型
type MyParameters<T extends (...args: any[]) => any> =
  T extends (...args: infer P) => any ? P : never;

function updateProfile(
  userId: number,
  data: { name?: string; avatar?: string },
  options?: { notify: boolean }
) {
  // ...
}

type UpdateProfileParams = MyParameters<typeof updateProfile>;
// [userId: number, data: { name?: string; avatar?: string }, options?: { notify: boolean }]

// 获取特定位置的参数
type FirstParam<T extends (...args: any[]) => any> =
  T extends (first: infer F, ...rest: any[]) => any ? F : never;

type SecondParam<T extends (...args: any[]) => any> =
  T extends (first: any, second: infer S, ...rest: any[]) => any ? S : never;

type First = FirstParam<typeof updateProfile>;  // number
type Second = SecondParam<typeof updateProfile>; // { name?: string; avatar?: string }
```

### 示例3：元组类型推断

```typescript
// 获取元组第一个元素
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;

// 获取元组最后一个元素
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

// 获取除第一个外的剩余元素
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

// 获取除最后一个外的其余元素
type Init<T extends any[]> = T extends [...infer I, any] ? I : never;

// 获取元组长度
type Length<T extends any[]> = T["length"];

// 测试
type Tuple = [string, number, boolean, Date];

type H = Head<Tuple>;   // string
type L = Last<Tuple>;   // Date
type T = Tail<Tuple>;   // [number, boolean, Date]
type I = Init<Tuple>;   // [string, number, boolean]
type Len = Length<Tuple>; // 4

// 元组反转
type Reverse<T extends any[]> = T extends [infer First, ...infer Rest]
  ? [...Reverse<Rest>, First]
  : [];

type Reversed = Reverse<[1, 2, 3, 4]>; // [4, 3, 2, 1]
```

### 示例4：递归类型推断

```typescript
// 深度解包 Promise
type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;

type Nested = Promise<Promise<Promise<string>>>;
type Unwrapped = DeepAwaited<Nested>; // string

// 深度解包数组
type DeepFlatten<T> = T extends Array<infer U> ? DeepFlatten<U> : T;

type NestedArray = number[][][];
type Flattened = DeepFlatten<NestedArray>; // number

// 深度只读（递归）
type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

interface Config {
  database: {
    host: string;
    port: number;
    credentials: {
      user: string;
      password: string;
    };
  };
}

type ReadonlyConfig = DeepReadonly<Config>;
// 所有嵌套属性都变为 readonly

// 递归提取所有叶子节点类型
type LeafTypes<T> = T extends object
  ? T extends (...args: any[]) => any
    ? T
    : { [K in keyof T]: LeafTypes<T[K]> }[keyof T]
  : T;

interface Tree {
  a: string;
  b: number;
  c: {
    d: boolean;
    e: {
      f: Date;
    };
  };
}

type Leaves = LeafTypes<Tree>; // string | number | boolean | Date
```

### 示例5：字符串模板类型推断

```typescript
// 提取路由参数
type ExtractRouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
    ? Param
    : never;

type Params = ExtractRouteParams<"/users/:userId/posts/:postId/comments/:commentId">;
// "userId" | "postId" | "commentId"

// 驼峰转蛇形
type CamelToSnake<S extends string> = S extends `${infer C}${infer Rest}`
  ? C extends Uppercase<C>
    ? `_${Lowercase<C>}${CamelToSnake<Rest>}`
    : `${C}${CamelToSnake<Rest>}`
  : S;

type Snake = CamelToSnake<"getUserById">; // "get_user_by_id"

// 蛇形转驼峰
type SnakeToCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Lowercase<Head>}${Capitalize<SnakeToCamel<Tail>>}`
  : Lowercase<S>;

type Camel = SnakeToCamel<"get_user_by_id">; // "getUserById"

// 提取文件扩展名
type ExtractExtension<T extends string> =
  T extends `${string}.${infer Ext}` ? Ext : never;

type Ext1 = ExtractExtension<"image.png">; // "png"
type Ext2 = ExtractExtension<"archive.tar.gz">; // "tar.gz" | "gz"

// 精确提取最后一个扩展名
type LastExtension<T extends string> =
  T extends `${infer _}.${infer Rest}`
    ? Rest extends `${string}.${string}`
      ? LastExtension<Rest>
      : Rest
    : never;

type LastExt = LastExtension<"archive.tar.gz">; // "gz"
```

### 示例6：构造函数类型推断

```typescript
// 推断构造函数参数
type ConstructorParameters<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: infer P) => any ? P : never;

// 推断构造函数实例类型
type InstanceType<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: any) => infer R ? R : never;

class Service {
  constructor(
    public readonly name: string,
    public readonly config: { timeout: number }
  ) {}

  start() {
    console.log(`Starting ${this.name}...`);
  }
}

type ServiceParams = ConstructorParameters<typeof Service>;
// [name: string, config: { timeout: number }]

type ServiceInstance = InstanceType<typeof Service>;
// Service

// 创建工厂函数
function createFactory<T extends new (...args: any[]) => any>(
  ctor: T
): (...args: ConstructorParameters<T>) => InstanceType<T> {
  return (...args) => new ctor(...args);
}

const createService = createFactory(Service);
const service = createService("MyService", { timeout: 5000 });
// service 的类型为 Service
```

### 示例7：复杂类型操作

```typescript
// 提取对象中特定类型的键
type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

interface User {
  id: number;
  name: string;
  age: number;
  email: string;
  isActive: boolean;
}

type StringKeys = KeysOfType<User, string>; // "name" | "email"
type NumberKeys = KeysOfType<User, number>; // "id" | "age"

// 提取函数类型的属性
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

interface API {
  baseUrl: string;
  timeout: number;
  get: (url: string) => Promise<any>;
  post: (url: string, data: any) => Promise<any>;
}

type APIFunctions = FunctionKeys<API>; // "get" | "post"

// 提取 Promise 数组的内部类型
type UnwrapPromiseArray<T extends Promise<any>[]> = {
  [K in keyof T]: T[K] extends Promise<infer U> ? U : never;
};

type Promises = [Promise<string>, Promise<number>, Promise<boolean>];
type Values = UnwrapPromiseArray<Promises>; // [string, number, boolean]

// 类似 Promise.all 的类型推断
type PromiseAllReturnType<T extends readonly Promise<any>[]> = Promise<{
  -readonly [K in keyof T]: T[K] extends Promise<infer U> ? U : never;
}>;

declare function promiseAll<T extends readonly Promise<any>[]>(
  promises: T
): PromiseAllReturnType<T>;

// 使用
const result = promiseAll([
  Promise.resolve("hello"),
  Promise.resolve(42),
  Promise.resolve(true)
] as const);
// result 的类型为 Promise<[string, number, boolean]>
```

## 最佳实践

### 提供合理的默认值

```typescript
// 好：当匹配失败时返回有意义的类型
type SafeReturnType<T> = T extends (...args: any[]) => infer R ? R : unknown;

// 不好：返回 never 可能导致意外的类型收窄
type UnsafeReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

### 添加类型约束提高安全性

```typescript
// 好：添加约束确保输入类型正确
type ReturnType<T extends (...args: any[]) => any> =
  T extends (...args: any[]) => infer R ? R : never;

// 使用时会有编译错误提示
// type Wrong = ReturnType<string>; // Error: string 不满足约束
```

### 拆分复杂类型提高可读性

```typescript
// 不好：过于复杂的嵌套
type ComplexExtract<T> = T extends {
  data: { items: Array<{ value: infer V extends string }> }
} ? V : never;

// 好：拆分为多个类型
type ExtractItems<T> = T extends { data: { items: infer I } } ? I : never;
type ExtractValue<T> = T extends Array<{ value: infer V }> ? V : never;
type StringValue<T> = T extends string ? T : never;

type BetterExtract<T> = StringValue<ExtractValue<ExtractItems<T>>>;
```

### 使用类型别名提高代码复用

```typescript
// 定义通用的推断工具
type InferArrayElement<T> = T extends (infer E)[] ? E : never;
type InferPromiseValue<T> = T extends Promise<infer V> ? V : never;
type InferMapValue<T> = T extends Map<any, infer V> ? V : never;
type InferSetElement<T> = T extends Set<infer E> ? E : never;

// 组合使用
type ComplexData = Promise<Map<string, Set<number>[]>>;

type Step1 = InferPromiseValue<ComplexData>; // Map<string, Set<number>[]>
type Step2 = InferMapValue<Step1>;           // Set<number>[]
type Step3 = InferArrayElement<Step2>;       // Set<number>
type Step4 = InferSetElement<Step3>;         // number
```

### 为递归类型添加深度限制

```typescript
// 限制递归深度，防止无限递归
type MaxDepth = 10;
type BuildArray<N extends number, T extends any[] = []> =
  T["length"] extends N ? T : BuildArray<N, [...T, unknown]>;

type SafeDeepReadonly<T, Depth extends any[] = []> =
  Depth["length"] extends MaxDepth
    ? T
    : T extends object
    ? { readonly [K in keyof T]: SafeDeepReadonly<T[K], [...Depth, unknown]> }
    : T;
```

## 常见陷阱

### 陷阱1：在错误位置使用 infer

```typescript
// 错误：infer 只能在 extends 子句中使用
// type Wrong<T> = Array<infer U>; // Error

// 正确
type Correct<T> = T extends Array<infer U> ? U : never;
```

### 陷阱2：忽略分布式条件类型的影响

```typescript
// 可能出乎意料的结果
type Boxed<T> = T extends any ? { value: T } : never;

type Result = Boxed<string | number>;
// 期望：{ value: string | number }
// 实际：{ value: string } | { value: number }

// 解决方案：禁用分布
type BoxedNonDist<T> = [T] extends [any] ? { value: T } : never;
type CorrectResult = BoxedNonDist<string | number>;
// { value: string | number }
```

### 陷阱3：never 类型的特殊行为

```typescript
// never 在分布式条件类型中会"消失"
type Test<T> = T extends any ? T : never;
type Result = Test<never>; // never（空联合类型）

// 检测 never 需要禁用分布
type IsNever<T> = [T] extends [never] ? true : false;
type Check1 = IsNever<never>;  // true
type Check2 = IsNever<string>; // false
```

### 陷阱4：any 类型的特殊行为

```typescript
// any 同时满足 true 和 false 分支
type Test<T> = T extends string ? "yes" : "no";
type Result = Test<any>; // "yes" | "no"（不是 "yes"！）

// 检测 any
type IsAny<T> = 0 extends 1 & T ? true : false;
type Check1 = IsAny<any>;     // true
type Check2 = IsAny<unknown>; // false
type Check3 = IsAny<string>;  // false
```

### 陷阱5：递归类型的性能问题

```typescript
// 过深的递归可能导致编译器报错或性能问题
type DeepNested<T, Depth extends number = 100> =
  Depth extends 0
    ? T
    : { value: DeepNested<T, MinusOne<Depth>> };

// 建议：限制递归深度
type SafeDepth = 10;
```

### 陷阱6：推断位置的协变/逆变混淆

```typescript
// 同一个 infer 变量在不同位置会有不同行为
type Mixed<T> = T extends {
  producer: () => infer U;    // 协变位置
  consumer: (x: infer U) => void; // 逆变位置
} ? U : never;

// 当协变和逆变位置的推断冲突时，结果可能不符合预期
type Result = Mixed<{
  producer: () => string;
  consumer: (x: number) => void;
}>; // never（因为 string 和 number 无法统一）
```

## 性能考量

### 避免过深的递归

```typescript
// 不好：无限制的递归
type BadDeepFlatten<T> = T extends Array<infer U> ? BadDeepFlatten<U> : T;

// 好：添加深度限制
type GoodDeepFlatten<T, Depth extends number = 10> =
  Depth extends 0
    ? T
    : T extends Array<infer U>
    ? GoodDeepFlatten<U, MinusOne<Depth>>
    : T;

// 辅助类型：减一
type MinusOne<N extends number> =
  BuildTuple<N> extends [infer _, ...infer Rest]
    ? Rest["length"]
    : never;

type BuildTuple<N extends number, T extends any[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, any]>;
```

### 缓存中间结果

```typescript
// 不好：重复计算
type Bad<T> = {
  a: T extends Promise<infer U> ? U : never;
  b: T extends Promise<infer U> ? Array<U> : never;
  c: T extends Promise<infer U> ? Map<string, U> : never;
};

// 好：提取公共部分
type ExtractPromise<T> = T extends Promise<infer U> ? U : never;
type Good<T> = {
  a: ExtractPromise<T>;
  b: ExtractPromise<T> extends never ? never : Array<ExtractPromise<T>>;
  c: ExtractPromise<T> extends never ? never : Map<string, ExtractPromise<T>>;
};
```

### 避免复杂的类型计算

```typescript
// 复杂的条件嵌套会增加编译时间
type TooComplex<T> =
  T extends A ?
    T extends B ?
      T extends C ?
        T extends D ?
          // ... 更多嵌套
        : never
      : never
    : never
  : never;

// 建议：拆分为多个简单类型
type Step1<T> = T extends A ? ExtractA<T> : never;
type Step2<T> = T extends B ? ExtractB<T> : never;
type Simplified<T> = Step1<T> & Step2<T>;
```

## 实战场景

### 场景1：类型安全的事件系统

```typescript
// 定义事件映射
interface EventMap {
  userLogin: { userId: string; timestamp: number };
  userLogout: { userId: string };
  pageView: { path: string; referrer?: string };
  purchase: { productId: string; amount: number; currency: string };
}

// 提取事件数据类型
type EventData<E extends keyof EventMap> = EventMap[E];

// 提取所有事件名
type EventNames = keyof EventMap;

// 事件处理器类型
type EventHandler<E extends keyof EventMap> = (data: EventData<E>) => void;

// 类型安全的事件发射器
class TypedEventEmitter {
  private handlers: {
    [E in keyof EventMap]?: EventHandler<E>[];
  } = {};

  on<E extends keyof EventMap>(event: E, handler: EventHandler<E>): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event]!.push(handler);
  }

  emit<E extends keyof EventMap>(event: E, data: EventData<E>): void {
    this.handlers[event]?.forEach(handler => handler(data));
  }
}

// 使用
const emitter = new TypedEventEmitter();

emitter.on("userLogin", (data) => {
  // data 自动推断为 { userId: string; timestamp: number }
  console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

emitter.emit("purchase", {
  productId: "123",
  amount: 99.99,
  currency: "USD"
});
```

### 场景2：API 响应类型推断

```typescript
// API 端点定义
interface APIEndpoints {
  "GET /users": { response: User[]; query: { limit?: number; offset?: number } };
  "GET /users/:id": { response: User; params: { id: string } };
  "POST /users": { response: User; body: Omit<User, "id" | "createdAt"> };
  "PUT /users/:id": { response: User; params: { id: string }; body: Partial<User> };
  "DELETE /users/:id": { response: void; params: { id: string } };
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// 提取方法
type ExtractMethod<T extends string> = T extends `${infer M} ${string}` ? M : never;

// 提取路径
type ExtractPath<T extends string> = T extends `${string} ${infer P}` ? P : never;

// 提取响应类型
type ResponseOf<E extends keyof APIEndpoints> =
  APIEndpoints[E] extends { response: infer R } ? R : never;

// 提取请求体类型
type BodyOf<E extends keyof APIEndpoints> =
  APIEndpoints[E] extends { body: infer B } ? B : never;

// 提取路径参数类型
type ParamsOf<E extends keyof APIEndpoints> =
  APIEndpoints[E] extends { params: infer P } ? P : never;

// 提取查询参数类型
type QueryOf<E extends keyof APIEndpoints> =
  APIEndpoints[E] extends { query: infer Q } ? Q : never;

// 类型安全的 fetch 包装
async function apiRequest<E extends keyof APIEndpoints>(
  endpoint: E,
  options?: {
    params?: ParamsOf<E>;
    query?: QueryOf<E>;
    body?: BodyOf<E>;
  }
): Promise<ResponseOf<E>> {
  // 实现省略
  return {} as ResponseOf<E>;
}

// 使用
async function example() {
  // 类型安全：返回 User[]
  const users = await apiRequest("GET /users", {
    query: { limit: 10 }
  });

  // 类型安全：返回 User
  const user = await apiRequest("GET /users/:id", {
    params: { id: "123" }
  });

  // 类型安全：body 必须符合要求
  const newUser = await apiRequest("POST /users", {
    body: { name: "Alice", email: "alice@example.com" }
  });
}
```

### 场景3：表单验证类型系统

```typescript
// 验证规则定义
interface ValidationRules {
  required: true;
  minLength: number;
  maxLength: number;
  pattern: RegExp;
  min: number;
  max: number;
  email: true;
  url: true;
  custom: (value: any) => boolean;
}

// 表单字段定义
type FormField<T, Rules extends Partial<ValidationRules> = {}> = {
  value: T;
  rules: Rules;
};

// 表单 Schema
interface LoginFormSchema {
  username: FormField<string, { required: true; minLength: 3; maxLength: 20 }>;
  password: FormField<string, { required: true; minLength: 8 }>;
  rememberMe: FormField<boolean, {}>;
}

// 提取表单值类型
type FormValues<T> = {
  [K in keyof T]: T[K] extends FormField<infer V, any> ? V : never;
};

type LoginFormValues = FormValues<LoginFormSchema>;
// { username: string; password: string; rememberMe: boolean }

// 提取必填字段
type RequiredFields<T> = {
  [K in keyof T]: T[K] extends FormField<any, { required: true }> ? K : never;
}[keyof T];

type LoginRequiredFields = RequiredFields<LoginFormSchema>;
// "username" | "password"

// 提取字段验证规则
type FieldRules<T, K extends keyof T> =
  T[K] extends FormField<any, infer R> ? R : never;

type UsernameRules = FieldRules<LoginFormSchema, "username">;
// { required: true; minLength: 3; maxLength: 20 }
```

### 场景4：状态管理类型推断

```typescript
// Action 定义
type Action<Type extends string, Payload = void> =
  Payload extends void
    ? { type: Type }
    : { type: Type; payload: Payload };

// 定义 Actions
type LoginAction = Action<"LOGIN", { username: string; password: string }>;
type LogoutAction = Action<"LOGOUT">;
type SetUserAction = Action<"SET_USER", { user: User }>;
type UpdateSettingsAction = Action<"UPDATE_SETTINGS", Partial<Settings>>;

type AllActions = LoginAction | LogoutAction | SetUserAction | UpdateSettingsAction;

// 从 Action 提取 Payload 类型
type PayloadOf<A extends AllActions, T extends A["type"]> =
  Extract<A, { type: T }> extends { payload: infer P } ? P : void;

type LoginPayload = PayloadOf<AllActions, "LOGIN">;
// { username: string; password: string }

type LogoutPayload = PayloadOf<AllActions, "LOGOUT">;
// void

// 类型安全的 dispatch
interface Store<S, A extends { type: string }> {
  getState(): S;
  dispatch<T extends A["type"]>(
    action: Extract<A, { type: T }> extends { payload: infer P }
      ? { type: T; payload: P }
      : { type: T }
  ): void;
}

// Reducer 类型
type Reducer<S, A extends { type: string }> = (
  state: S,
  action: A
) => S;

// 创建类型安全的 action creator
function createAction<T extends string>(type: T): () => Action<T>;
function createAction<T extends string, P>(
  type: T
): (payload: P) => Action<T, P>;
function createAction(type: string) {
  return (payload?: any) =>
    payload === undefined ? { type } : { type, payload };
}

const login = createAction<"LOGIN", { username: string; password: string }>("LOGIN");
const logout = createAction<"LOGOUT">("LOGOUT");

// 使用
const loginAction = login({ username: "alice", password: "secret" });
const logoutAction = logout();
```

## 面试要点

### 问题1：什么是 infer 关键字？它能在哪里使用？

**答案要点：**
- `infer` 是 TypeScript 中用于条件类型中进行类型推断的关键字
- 只能在条件类型的 `extends` 子句中使用
- 用于声明一个待推断的类型变量
- 推断的类型只能在条件为 true 的分支中使用

```typescript
// 示例
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

### 问题2：如何使用 infer 实现 ReturnType 和 Parameters 工具类型？

**答案要点：**

```typescript
// ReturnType：推断函数返回类型
type MyReturnType<T extends (...args: any[]) => any> =
  T extends (...args: any[]) => infer R ? R : never;

// Parameters：推断函数参数类型
type MyParameters<T extends (...args: any[]) => any> =
  T extends (...args: infer P) => any ? P : never;

// 使用示例
type Fn = (a: string, b: number) => boolean;
type R = MyReturnType<Fn>;    // boolean
type P = MyParameters<Fn>;    // [a: string, b: number]
```

### 问题3：infer 在协变和逆变位置的不同行为是什么？

**答案要点：**
- 协变位置（如返回值、属性值）：同一个 infer 变量推断为联合类型
- 逆变位置（如函数参数）：同一个 infer 变量推断为交叉类型

```typescript
// 协变：联合类型
type Covariant<T> = T extends { a: infer U; b: infer U } ? U : never;
type Co = Covariant<{ a: string; b: number }>; // string | number

// 逆变：交叉类型
type Contravariant<T> = T extends {
  fn1: (x: infer U) => void;
  fn2: (x: infer U) => void;
} ? U : never;
type Contra = Contravariant<{
  fn1: (x: { a: 1 }) => void;
  fn2: (x: { b: 2 }) => void;
}>; // { a: 1 } & { b: 2 }
```

### 问题4：如何用 infer 实现元组类型的操作（如 Head、Tail、Last）？

**答案要点：**

```typescript
// 获取第一个元素
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;

// 获取除第一个外的其余元素
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

// 获取最后一个元素
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

// 元组反转
type Reverse<T extends any[]> = T extends [infer F, ...infer R]
  ? [...Reverse<R>, F]
  : [];

// 测试
type Tuple = [1, 2, 3, 4];
type H = Head<Tuple>;     // 1
type T = Tail<Tuple>;     // [2, 3, 4]
type L = Last<Tuple>;     // 4
type R = Reverse<Tuple>;  // [4, 3, 2, 1]
```

### 问题5：如何处理 infer 与分布式条件类型的交互？

**答案要点：**
- 分布式条件类型会对联合类型的每个成员分别应用
- 如果不想分布，可以用元组包裹类型

```typescript
// 分布式行为
type ElementOf<T> = T extends (infer E)[] ? E : never;
type Dist = ElementOf<string[] | number[]>; // string | number

// 禁用分布式行为
type ElementOfNonDist<T> = [T] extends [(infer E)[]] ? E : never;
type NonDist = ElementOfNonDist<string[] | number[]>; // string | number
```

### 问题6：TypeScript 4.7+ 中 infer 的约束语法是什么？

**答案要点：**

```typescript
// TypeScript 4.7+ 支持在 infer 上添加 extends 约束
type FirstString<T> = T extends [infer S extends string, ...any[]] ? S : never;

type A = FirstString<["hello", 1]>;  // "hello"
type B = FirstString<[123, "world"]>; // never（第一个元素不是 string）

// 这等价于之前的写法
type FirstStringOld<T> = T extends [infer S, ...any[]]
  ? S extends string ? S : never
  : never;
```

## 延伸阅读

### 官方文档
- [TypeScript Handbook - Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript Handbook - Inferring Within Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)
- [TypeScript Release Notes 2.8](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html)
- [TypeScript Release Notes 4.7 - extends Constraints on infer](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html)

### 推荐资源
- [Type Challenges](https://github.com/type-challenges/type-challenges) - TypeScript 类型体操练习，包含大量 infer 相关题目
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - TypeScript 深入理解
- [Total TypeScript](https://www.totaltypescript.com/) - Matt Pocock 的 TypeScript 教程
- [type-fest](https://github.com/sindresorhus/type-fest) - TypeScript 类型工具库，包含许多 infer 的高级用法

### 相关文章
- [Understanding infer in TypeScript](https://blog.logrocket.com/understanding-infer-typescript/)
- [Advanced TypeScript: The Power of Infer](https://dev.to/macsikora/advanced-typescript-the-power-of-infer-2fnl)
- [TypeScript Conditional Types and Infer](https://mariusschulz.com/blog/conditional-types-in-typescript)
