---
title: TypeScript 条件类型
description: 掌握 TypeScript 条件类型，包括 infer 关键字和分布式条件类型
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - 条件类型
  - 类型编程
  - infer
status: imported
origin: old/src/content/docs/typescript/conditional-types.zh.md
divergence: 0.246
issues: []
legacy:
  category: TypeScript
  subcategory: 高级类型
  order: 13
  lastUpdated: 2026-01-07
---

条件类型是 TypeScript 类型系统中最强大的特性之一，它允许我们根据类型之间的关系动态地选择类型。通过条件类型，我们可以实现类型级别的逻辑判断，构建出高度灵活和类型安全的代码。

## 条件类型基础语法

### 基本语法结构

条件类型的语法类似于 JavaScript 的三元表达式：

```typescript
T extends U ? X : Y
```

这个表达式的含义是：如果类型 `T` 可以赋值给类型 `U`，则结果类型为 `X`，否则为 `Y`。

```typescript
// 基础示例：判断是否为字符串类型
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;      // true
type B = IsString<number>;      // false
type C = IsString<"hello">;     // true（字面量类型也是字符串）
type D = IsString<string[]>;    // false
```

### 类型约束检查

条件类型可以用于检查类型是否满足特定约束：

```typescript
// 检查类型是否为数组
type IsArray<T> = T extends any[] ? true : false;

type E = IsArray<number[]>;     // true
type F = IsArray<string>;       // false
type G = IsArray<[1, 2, 3]>;    // true（元组也是数组）

// 检查类型是否为函数
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

type H = IsFunction<() => void>;           // true
type I = IsFunction<(x: number) => string>; // true
type J = IsFunction<string>;               // false

// 检查类型是否为对象（非原始类型）
type IsObject<T> = T extends object ? true : false;

type K = IsObject<{ name: string }>;  // true
type L = IsObject<string[]>;          // true（数组也是对象）
type M = IsObject<string>;            // false
type N = IsObject<null>;              // false
```

### 嵌套条件类型

条件类型可以嵌套使用，实现多分支逻辑：

```typescript
// 类型分类器
type TypeName<T> = T extends string
  ? "string"
  : T extends number
  ? "number"
  : T extends boolean
  ? "boolean"
  : T extends undefined
  ? "undefined"
  : T extends null
  ? "null"
  : T extends Function
  ? "function"
  : T extends Array<any>
  ? "array"
  : "object";

type T1 = TypeName<string>;        // "string"
type T2 = TypeName<42>;            // "number"
type T3 = TypeName<true>;          // "boolean"
type T4 = TypeName<() => void>;    // "function"
type T5 = TypeName<number[]>;      // "array"
type T6 = TypeName<{ x: 1 }>;      // "object"
```

### 条件类型与泛型约束

条件类型常与泛型约束结合使用：

```typescript
// 提取数组元素类型，仅当 T 是数组时有效
type ElementType<T> = T extends (infer E)[] ? E : never;

type Elem1 = ElementType<string[]>;    // string
type Elem2 = ElementType<number[]>;    // number
type Elem3 = ElementType<string>;      // never

// 带约束的条件类型
type ArrayOrSingle<T> = T extends any[] ? T : T[];

type Arr1 = ArrayOrSingle<string>;     // string[]
type Arr2 = ArrayOrSingle<number[]>;   // number[]
```

## infer 关键字详解

`infer` 关键字是条件类型中用于类型推断的强大工具。它只能在条件类型的 `extends` 子句中使用，用于声明一个待推断的类型变量。

### 基础用法

```typescript
// 推断函数返回类型
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getUserInfo() {
  return { id: 1, name: "张三", role: "admin" };
}

type UserInfo = GetReturnType<typeof getUserInfo>;
// 结果: { id: number; name: string; role: string; }

type StringReturn = GetReturnType<() => string>;  // string
type VoidReturn = GetReturnType<() => void>;      // void
type NeverReturn = GetReturnType<string>;         // never
```

### 推断函数参数类型

```typescript
// 推断第一个参数类型
type FirstParameter<T> = T extends (first: infer F, ...args: any[]) => any
  ? F
  : never;

function greet(name: string, age: number) {
  return `Hello, ${name}`;
}

type FirstParam = FirstParameter<typeof greet>;  // string

// 推断所有参数类型
type AllParameters<T> = T extends (...args: infer P) => any ? P : never;

type AllParams = AllParameters<typeof greet>;    // [name: string, age: number]
```

### 推断数组元素类型

```typescript
// 提取数组元素类型
type ArrayElementType<T> = T extends (infer E)[] ? E : never;

type StrElem = ArrayElementType<string[]>;       // string
type NumElem = ArrayElementType<number[]>;       // number
type MixedElem = ArrayElementType<(string | number)[]>;  // string | number

// 提取只读数组元素类型
type ReadonlyArrayElement<T> = T extends readonly (infer E)[] ? E : never;

type ReadonlyElem = ReadonlyArrayElement<readonly string[]>;  // string
```

### 推断元组元素

```typescript
// 推断元组第一个元素
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

type F1 = First<[string, number, boolean]>;  // string
type F2 = First<[number]>;                   // number
type F3 = First<[]>;                         // never

// 推断元组最后一个元素
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type L1 = Last<[string, number, boolean]>;   // boolean
type L2 = Last<[number]>;                    // number

// 推断元组除第一个外的其余元素
type Rest<T extends any[]> = T extends [any, ...infer R] ? R : never;

type R1 = Rest<[string, number, boolean]>;   // [number, boolean]
type R2 = Rest<[string]>;                    // []

// 推断元组除最后一个外的其余元素
type Init<T extends any[]> = T extends [...infer I, any] ? I : never;

type I1 = Init<[string, number, boolean]>;   // [string, number]
```

### 推断 Promise 内部类型

```typescript
// 提取 Promise 的值类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type P1 = UnwrapPromise<Promise<string>>;    // string
type P2 = UnwrapPromise<Promise<number[]>>;  // number[]
type P3 = UnwrapPromise<string>;             // string（非 Promise 返回原类型）

// 递归解包嵌套 Promise
type DeepUnwrapPromise<T> = T extends Promise<infer U>
  ? DeepUnwrapPromise<U>
  : T;

type NestedPromise = Promise<Promise<Promise<string>>>;
type Deep = DeepUnwrapPromise<NestedPromise>;  // string

// TypeScript 内置的 Awaited 类型实现类似功能
type AwaitedResult = Awaited<Promise<Promise<number>>>;  // number
```

### 推断构造函数相关类型

```typescript
// 推断构造函数参数类型
type ConstructorParams<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: infer P) => any ? P : never;

class User {
  constructor(public name: string, public age: number) {}
}

type UserParams = ConstructorParams<typeof User>;  // [name: string, age: number]

// 推断构造函数实例类型
type InstanceOf<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: any) => infer I ? I : never;

type UserInstance = InstanceOf<typeof User>;  // User
```

### infer 在字符串模板中的应用

```typescript
// 提取字符串开头部分
type GetPrefix<T extends string> = T extends `${infer Prefix}_${string}`
  ? Prefix
  : never;

type Prefix1 = GetPrefix<"user_name">;     // "user"
type Prefix2 = GetPrefix<"app_config_db">; // "app"
type Prefix3 = GetPrefix<"noprefix">;      // never

// 提取路径参数
type ExtractRouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
    ? Param
    : never;

type RouteParams = ExtractRouteParams<"/users/:userId/posts/:postId">;
// 结果: "userId" | "postId"

// 驼峰转换
type CamelToSnake<T extends string> = T extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? `_${Lowercase<First>}${CamelToSnake<Rest>}`
    : `${First}${CamelToSnake<Rest>}`
  : T;

type Snake = CamelToSnake<"getUserById">;  // "get_user_by_id"
```

### 多位置 infer

当同一个类型变量在多个位置被 infer 时，TypeScript 会推断出联合类型（协变位置）或交叉类型（逆变位置）：

```typescript
// 协变位置：产生联合类型
type CovariantInfer<T> = T extends { a: infer U; b: infer U } ? U : never;

type Co1 = CovariantInfer<{ a: string; b: number }>;  // string | number
type Co2 = CovariantInfer<{ a: string; b: string }>;  // string

// 逆变位置（函数参数）：产生交叉类型
type ContravariantInfer<T> = T extends {
  fn1: (x: infer U) => void;
  fn2: (x: infer U) => void;
}
  ? U
  : never;

type Contra1 = ContravariantInfer<{
  fn1: (x: { a: string }) => void;
  fn2: (x: { b: number }) => void;
}>;
// 结果: { a: string } & { b: number }
```

## 分布式条件类型

### 分布式行为原理

当条件类型作用于泛型类型，且该泛型类型是联合类型时，条件类型会自动分布到联合类型的每个成员上：

```typescript
// 分布式条件类型
type ToArray<T> = T extends any ? T[] : never;

// 当 T 是联合类型时，会分布计算
type DistributedArray = ToArray<string | number>;
// 等价于: ToArray<string> | ToArray<number>
// 结果: string[] | number[]

// 对比：如果想要 (string | number)[]，需要禁用分布
type NonDistributedArray = [string | number] extends [any]
  ? (string | number)[]
  : never;
// 结果: (string | number)[]
```

### 禁用分布式行为

有时我们不希望条件类型分布，可以用元组包裹：

```typescript
// 分布式版本
type IsUnion<T> = T extends any ? T[] : never;
type Distributed = IsUnion<string | number>;  // string[] | number[]

// 非分布式版本（使用元组包裹）
type IsUnionNonDist<T> = [T] extends [any] ? T[] : never;
type NonDistributed = IsUnionNonDist<string | number>;  // (string | number)[]

// 实际应用：检测是否为联合类型
type IsUnionType<T, C = T> = T extends any
  ? [C] extends [T]
    ? false
    : true
  : never;

type Check1 = IsUnionType<string>;          // false
type Check2 = IsUnionType<string | number>; // true
```

### Exclude 和 Extract 的实现原理

TypeScript 内置的 `Exclude` 和 `Extract` 工具类型正是利用了分布式条件类型：

```typescript
// Exclude 实现：从 T 中排除可赋值给 U 的类型
type MyExclude<T, U> = T extends U ? never : T;

type Ex1 = MyExclude<"a" | "b" | "c", "a">;        // "b" | "c"
type Ex2 = MyExclude<string | number | boolean, number>;  // string | boolean

// 分布过程示意:
// MyExclude<"a" | "b" | "c", "a">
// = MyExclude<"a", "a"> | MyExclude<"b", "a"> | MyExclude<"c", "a">
// = never | "b" | "c"
// = "b" | "c"

// Extract 实现：从 T 中提取可赋值给 U 的类型
type MyExtract<T, U> = T extends U ? T : never;

type Ext1 = MyExtract<"a" | "b" | "c", "a" | "f">;  // "a"
type Ext2 = MyExtract<string | number | boolean, number | string>;  // string | number
```

### NonNullable 的实现

```typescript
// 排除 null 和 undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;

type NN1 = MyNonNullable<string | null | undefined>;  // string
type NN2 = MyNonNullable<number | null>;              // number

// 分布过程示意:
// MyNonNullable<string | null | undefined>
// = MyNonNullable<string> | MyNonNullable<null> | MyNonNullable<undefined>
// = string | never | never
// = string
```

### 过滤联合类型中的特定成员

```typescript
// 过滤出函数类型
type FilterFunctions<T> = T extends (...args: any[]) => any ? T : never;

type Mixed = string | number | (() => void) | ((x: number) => string);
type OnlyFunctions = FilterFunctions<Mixed>;
// 结果: (() => void) | ((x: number) => string)

// 过滤出对象类型的属性名
type FilterKeysByType<T, ValueType> = {
  [K in keyof T]: T[K] extends ValueType ? K : never;
}[keyof T];

interface Example {
  id: number;
  name: string;
  age: number;
  active: boolean;
  email: string;
}

type NumberKeys = FilterKeysByType<Example, number>;  // "id" | "age"
type StringKeys = FilterKeysByType<Example, string>;  // "name" | "email"
```

### 联合类型转交叉类型

利用分布式条件类型和函数参数的逆变性，可以实现联合类型到交叉类型的转换：

```typescript
// 联合类型转交叉类型
type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type Union = { a: string } | { b: number } | { c: boolean };
type Intersection = UnionToIntersection<Union>;
// 结果: { a: string } & { b: number } & { c: boolean }

// 分步解析:
// 1. 分布: (k: { a: string }) => void | (k: { b: number }) => void | (k: { c: boolean }) => void
// 2. 推断: 由于函数参数是逆变的，infer I 推断出交叉类型
```

## 类型推断模式

### 提取对象属性类型

```typescript
// 提取特定键的值类型
type PropertyType<T, K extends keyof T> = T[K];

interface User {
  id: number;
  name: string;
  profile: {
    avatar: string;
    bio: string;
  };
}

type UserId = PropertyType<User, "id">;        // number
type UserProfile = PropertyType<User, "profile">; // { avatar: string; bio: string; }

// 深度属性提取
type DeepPropertyType<T, Path extends string> = Path extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? DeepPropertyType<T[K], Rest>
    : never
  : Path extends keyof T
  ? T[Path]
  : never;

type AvatarType = DeepPropertyType<User, "profile.avatar">;  // string
```

### 函数类型操作

```typescript
// 追加参数
type AppendParameter<Fn extends (...args: any[]) => any, P> = Fn extends (
  ...args: infer Args
) => infer R
  ? (...args: [...Args, P]) => R
  : never;

type Original = (a: string, b: number) => boolean;
type WithExtra = AppendParameter<Original, Date>;
// 结果: (a: string, b: number, arg2: Date) => boolean

// 前置参数
type PrependParameter<Fn extends (...args: any[]) => any, P> = Fn extends (
  ...args: infer Args
) => infer R
  ? (first: P, ...args: Args) => R
  : never;

type WithFirst = PrependParameter<Original, object>;
// 结果: (first: object, a: string, b: number) => boolean

// 改变返回类型
type ChangeReturnType<Fn extends (...args: any[]) => any, NewReturn> = Fn extends (
  ...args: infer Args
) => any
  ? (...args: Args) => NewReturn
  : never;

type ChangedReturn = ChangeReturnType<Original, string>;
// 结果: (a: string, b: number) => string
```

### 递归类型推断

```typescript
// 深度只读
type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

interface NestedObject {
  level1: {
    level2: {
      value: string;
    };
    items: number[];
  };
}

type ReadonlyNested = DeepReadonly<NestedObject>;
// 所有嵌套属性都变为只读

// 深度可选
type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

type PartialNested = DeepPartial<NestedObject>;
// 所有嵌套属性都变为可选

// 深度必需
type DeepRequired<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
  ? { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;
```

### 条件映射类型

```typescript
// 根据属性值类型决定是否保留
type PickByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K];
};

interface Mixed {
  id: number;
  name: string;
  age: number;
  active: boolean;
  email: string;
}

type NumberProps = PickByType<Mixed, number>;
// 结果: { id: number; age: number; }

type StringProps = PickByType<Mixed, string>;
// 结果: { name: string; email: string; }

// 排除特定类型的属性
type OmitByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? never : K]: T[K];
};

type NonNumberProps = OmitByType<Mixed, number>;
// 结果: { name: string; active: boolean; email: string; }
```

## 工具类型实现

### ReturnType 实现

```typescript
// 内置 ReturnType 的实现
type MyReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;

// 使用示例
function fetchUser(): Promise<{ id: number; name: string }> {
  return Promise.resolve({ id: 1, name: "张三" });
}

type FetchUserReturn = MyReturnType<typeof fetchUser>;
// 结果: Promise<{ id: number; name: string }>

// 获取异步函数的实际返回值类型
type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : never;

type UserData = AsyncReturnType<typeof fetchUser>;
// 结果: { id: number; name: string }
```

### Parameters 实现

```typescript
// 内置 Parameters 的实现
type MyParameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

function createOrder(
  productId: string,
  quantity: number,
  options?: { express: boolean }
) {
  // ...
}

type OrderParams = MyParameters<typeof createOrder>;
// 结果: [productId: string, quantity: number, options?: { express: boolean }]

// 获取第 N 个参数的类型
type ParameterAt<
  T extends (...args: any) => any,
  N extends number
> = MyParameters<T>[N];

type FirstParam = ParameterAt<typeof createOrder, 0>;  // string
type SecondParam = ParameterAt<typeof createOrder, 1>; // number
```

### Partial 和 Required 实现

```typescript
// Partial 实现
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// Required 实现（使用 -? 移除可选修饰符）
type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};

// 深度版本
type DeepPartialImpl<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends (...args: any[]) => any
      ? T[K]
      : DeepPartialImpl<T[K]>
    : T[K];
};

type DeepRequiredImpl<T> = {
  [K in keyof T]-?: T[K] extends object
    ? T[K] extends (...args: any[]) => any
      ? T[K]
      : DeepRequiredImpl<T[K]>
    : T[K];
};
```

### Pick 和 Omit 实现

```typescript
// Pick 实现
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit 实现（依赖 Exclude）
type MyOmit<T, K extends keyof any> = {
  [P in Exclude<keyof T, K>]: T[P];
};

// 使用映射类型的 as 子句实现 Omit
type MyOmitAlt<T, K extends keyof any> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

interface User {
  id: number;
  name: string;
  password: string;
  email: string;
}

type PublicUser = MyOmit<User, "password">;
// 结果: { id: number; name: string; email: string; }
```

### Record 实现

```typescript
// Record 实现
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};

// 使用示例
type StatusMap = MyRecord<"success" | "error" | "pending", {
  code: number;
  message: string;
}>;

const statusMap: StatusMap = {
  success: { code: 200, message: "成功" },
  error: { code: 500, message: "错误" },
  pending: { code: 202, message: "处理中" }
};
```

### Readonly 和 Mutable 实现

```typescript
// Readonly 实现
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Mutable（移除 readonly）实现
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

interface ImmutableConfig {
  readonly host: string;
  readonly port: number;
}

type MutableConfig = Mutable<ImmutableConfig>;
// 结果: { host: string; port: number; }（readonly 被移除）
```

## 高级模式与实战

### 类型安全的事件系统

```typescript
// 事件映射
interface EventMap {
  click: { x: number; y: number; button: number };
  keypress: { key: string; code: number; ctrl: boolean };
  scroll: { scrollTop: number; scrollLeft: number };
  resize: { width: number; height: number };
}

// 事件处理器类型
type EventHandler<E extends keyof EventMap> = (event: EventMap[E]) => void;

// 类型安全的事件发射器
interface TypedEventEmitter<T extends Record<string, any>> {
  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
  off<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
}

// 使用示例
declare const emitter: TypedEventEmitter<EventMap>;

emitter.on("click", (event) => {
  // event 的类型自动推断为 { x: number; y: number; button: number }
  console.log(event.x, event.y);
});

emitter.emit("keypress", { key: "Enter", code: 13, ctrl: false });
// emitter.emit("keypress", { x: 10 }); // 错误：类型不匹配
```

### 类型安全的 API 路由

```typescript
// API 端点定义
interface APIEndpoints {
  "/users": {
    GET: { response: User[]; params: { limit?: number } };
    POST: { response: User; body: Omit<User, "id"> };
  };
  "/users/:id": {
    GET: { response: User; params: { id: string } };
    PUT: { response: User; body: Partial<User>; params: { id: string } };
    DELETE: { response: void; params: { id: string } };
  };
  "/posts": {
    GET: { response: Post[]; params: { page?: number } };
  };
}

// 提取响应类型
type ApiResponse<
  Path extends keyof APIEndpoints,
  Method extends keyof APIEndpoints[Path]
> = APIEndpoints[Path][Method] extends { response: infer R } ? R : never;

// 提取请求体类型
type ApiBody<
  Path extends keyof APIEndpoints,
  Method extends keyof APIEndpoints[Path]
> = APIEndpoints[Path][Method] extends { body: infer B } ? B : never;

// 类型安全的请求函数
async function apiRequest<
  Path extends keyof APIEndpoints,
  Method extends keyof APIEndpoints[Path]
>(
  path: Path,
  method: Method,
  options?: {
    body?: ApiBody<Path, Method>;
    params?: APIEndpoints[Path][Method] extends { params: infer P } ? P : never;
  }
): Promise<ApiResponse<Path, Method>> {
  // 实现略
  return {} as any;
}

// 使用示例
const users = await apiRequest("/users", "GET", { params: { limit: 10 } });
// users 的类型为 User[]

const newUser = await apiRequest("/users", "POST", {
  body: { name: "张三", email: "zhangsan@example.com" }
});
// newUser 的类型为 User
```

### 表单验证类型

```typescript
// 验证规则类型
interface ValidationRules {
  required: boolean;
  minLength: number;
  maxLength: number;
  pattern: RegExp;
  custom: (value: any) => boolean;
}

// 表单字段配置
type FormFieldConfig<T> = {
  [K in keyof T]: {
    value: T[K];
    rules?: Partial<ValidationRules>;
    error?: string;
  };
};

// 表单值类型提取
type FormValues<T extends FormFieldConfig<any>> = {
  [K in keyof T]: T[K] extends { value: infer V } ? V : never;
};

// 使用示例
interface UserFormConfig extends FormFieldConfig<{
  username: string;
  email: string;
  age: number;
}> {}

const formConfig: UserFormConfig = {
  username: {
    value: "",
    rules: { required: true, minLength: 3, maxLength: 20 }
  },
  email: {
    value: "",
    rules: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
  },
  age: {
    value: 0,
    rules: { required: true }
  }
};

type UserFormValues = FormValues<UserFormConfig>;
// 结果: { username: string; email: string; age: number; }
```

### 状态机类型

```typescript
// 状态定义
type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

// 状态转换规则
type StateTransitions = {
  pending: "paid" | "cancelled";
  paid: "shipped" | "cancelled";
  shipped: "delivered";
  delivered: never;
  cancelled: never;
};

// 类型安全的状态机
interface StateMachine<State extends string, Transitions extends Record<State, string>> {
  currentState: State;
  transition<S extends State>(
    from: S,
    to: Transitions[S]
  ): void;
  canTransition<S extends State>(
    from: S,
    to: string
  ): to is Transitions[S];
}

// 条件类型检查有效转换
type ValidTransition<
  Current extends OrderStatus,
  Next extends string
> = Next extends StateTransitions[Current] ? true : false;

type CanPendingToPaid = ValidTransition<"pending", "paid">;      // true
type CanPendingToShipped = ValidTransition<"pending", "shipped">; // false
type CanShippedToDelivered = ValidTransition<"shipped", "delivered">; // true
```

### Builder 模式类型推断

```typescript
// 查询构建器类型
interface QueryBuilder<
  Selected extends string = never,
  Filtered extends string = never
> {
  select<S extends string>(
    ...fields: S[]
  ): QueryBuilder<Selected | S, Filtered>;

  where<F extends string>(
    field: F,
    value: any
  ): QueryBuilder<Selected, Filtered | F>;

  build(): {
    selected: Selected;
    filtered: Filtered;
  };
}

// 使用示例（类型会累积）
declare function createQuery(): QueryBuilder;

const query = createQuery()
  .select("id", "name")
  .select("email")
  .where("status", "active")
  .where("age", 18)
  .build();

// query 的类型:
// {
//   selected: "id" | "name" | "email";
//   filtered: "status" | "age";
// }
```

### JSON Schema 类型推断

```typescript
// JSON Schema 类型定义
type JSONSchema =
  | { type: "string" }
  | { type: "number" }
  | { type: "boolean" }
  | { type: "null" }
  | { type: "array"; items: JSONSchema }
  | { type: "object"; properties: Record<string, JSONSchema>; required?: string[] };

// 从 JSON Schema 推断 TypeScript 类型
type InferJSONSchema<S extends JSONSchema> = S extends { type: "string" }
  ? string
  : S extends { type: "number" }
  ? number
  : S extends { type: "boolean" }
  ? boolean
  : S extends { type: "null" }
  ? null
  : S extends { type: "array"; items: infer I }
  ? I extends JSONSchema
    ? InferJSONSchema<I>[]
    : never
  : S extends { type: "object"; properties: infer P; required?: infer R }
  ? P extends Record<string, JSONSchema>
    ? {
        [K in keyof P as K extends R ? never : K]?: InferJSONSchema<P[K]>;
      } & {
        [K in keyof P as K extends R ? K : never]: InferJSONSchema<P[K]>;
      }
    : never
  : never;

// 使用示例
type UserSchema = {
  type: "object";
  properties: {
    id: { type: "number" };
    name: { type: "string" };
    tags: { type: "array"; items: { type: "string" } };
  };
  required: "id" | "name";
};

type InferredUser = InferJSONSchema<UserSchema>;
// 结果近似: { id: number; name: string; tags?: string[] }
```

## 条件类型常见陷阱与最佳实践

### 分布式行为的意外

```typescript
// 陷阱：意外的分布式行为
type WrapInArray<T> = T extends any ? T[] : never;

type Unexpected = WrapInArray<string | number>;
// 期望: (string | number)[]
// 实际: string[] | number[]

// 解决方案：使用元组禁用分布
type WrapInArrayFixed<T> = [T] extends [any] ? T[] : never;

type Expected = WrapInArrayFixed<string | number>;
// 结果: (string | number)[]
```

### never 类型的特殊行为

```typescript
// never 在分布式条件类型中会消失
type Test<T> = T extends any ? T : never;

type WithNever = Test<string | never>;
// 结果: string（never 被过滤掉了）

// 检测 never 类型
type IsNever<T> = [T] extends [never] ? true : false;

type Check1 = IsNever<never>;      // true
type Check2 = IsNever<string>;     // false
type Check3 = IsNever<undefined>;  // false
```

### any 类型的特殊处理

```typescript
// any 会同时匹配 true 和 false 分支
type IsAny<T> = 0 extends 1 & T ? true : false;

type AnyCheck1 = IsAny<any>;      // true
type AnyCheck2 = IsAny<unknown>;  // false
type AnyCheck3 = IsAny<string>;   // false

// 更可靠的 any 检测
type IsAnyStrict<T> = unknown extends T
  ? [T] extends [string]
    ? true
    : false
  : false;
```

### 类型收窄与条件类型

```typescript
// 在泛型函数中使用条件类型
function processValue<T extends string | number>(value: T): T extends string ? string[] : number {
  if (typeof value === "string") {
    // TypeScript 无法自动收窄泛型类型
    // return value.split(""); // 错误：类型不匹配
    return value.split("") as any; // 需要类型断言
  }
  return (value * 2) as any;
}

// 更好的方式：使用函数重载
function processValueOverload(value: string): string[];
function processValueOverload(value: number): number;
function processValueOverload(value: string | number): string[] | number {
  if (typeof value === "string") {
    return value.split("");
  }
  return value * 2;
}
```

### 性能考虑

```typescript
// 避免过深的递归类型
type DeepNested<T, Depth extends number[]> = Depth["length"] extends 10
  ? T
  : { value: DeepNested<T, [...Depth, 0]> };

// 添加递归深度限制
type MaxDepth = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 10 层

type SafeDeepReadonly<T, Depth extends number[] = []> = Depth["length"] extends MaxDepth["length"]
  ? T
  : T extends object
  ? { readonly [K in keyof T]: SafeDeepReadonly<T[K], [...Depth, 0]> }
  : T;
```

### 类型可读性

```typescript
// 不好：复杂的嵌套条件
type Complex<T> = T extends { a: infer A }
  ? A extends string
    ? A extends `${infer Prefix}_${string}`
      ? Prefix
      : never
    : never
  : never;

// 好：拆分为多个类型
type ExtractA<T> = T extends { a: infer A } ? A : never;
type ExtractPrefix<T extends string> = T extends `${infer P}_${string}` ? P : never;
type SimplifiedComplex<T> = ExtractA<T> extends string
  ? ExtractPrefix<ExtractA<T>>
  : never;
```

## 总结

TypeScript 条件类型是类型系统中极其强大的特性，掌握它们能让你：

1. **实现类型级别的逻辑判断**：根据类型关系动态选择类型
2. **使用 infer 进行类型推断**：从复杂类型中提取内部类型信息
3. **利用分布式条件类型**：优雅地处理联合类型
4. **构建类型安全的工具函数**：ReturnType、Parameters 等内置类型的原理
5. **创建高级类型模式**：事件系统、API 路由、状态机等实战应用

在实际开发中，合理运用条件类型可以大大提升代码的类型安全性和可维护性。但也要注意避免过度复杂的类型定义，保持代码的可读性。

## 相关资源

- [TypeScript 官方文档 - Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript 官方文档 - Inferring Within Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)
- [Type Challenges](https://github.com/type-challenges/type-challenges) - 类型体操练习
- [TypeScript 深入理解](https://jkchao.github.io/typescript-book-chinese/) - 中文深入教程
