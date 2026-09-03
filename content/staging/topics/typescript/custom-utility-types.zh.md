---
title: TypeScript 自定义工具类型
description: 深入讲解 TypeScript 自定义工具类型的设计与实现，包括 DeepPartial、DeepRequired、OmitByType、RequiredKeys 等高级类型编程模式
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - typescript
  - utility-types
  - 泛型
  - 类型编程
  - 高级类型
status: imported
origin: old/src/content/docs/typescript/custom-utility-types.zh.md
divergence: 0.227
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - category-casing
legacy:
  category: TypeScript
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

## 概念解释

TypeScript 内置了许多工具类型（Utility Types），如 `Partial<T>`、`Required<T>`、`Pick<T, K>` 等，它们为日常类型操作提供了极大的便利。然而，实际项目中的类型需求往往更加复杂——你可能需要递归地将嵌套对象的所有属性变为可选，或者根据属性值的类型来筛选对象的键。这时，自定义工具类型就成为了必不可少的技能。

自定义工具类型是指开发者利用 TypeScript 的高级类型特性（泛型、条件类型、映射类型、infer 关键字等）所构建的可复用类型工具。它们通常接收一个或多个类型参数，经过类型运算后返回新的类型。

### 历史背景

TypeScript 从 2.1 版本开始引入映射类型（Mapped Types），2.8 版本引入条件类型（Conditional Types）和 `infer` 关键字，这些特性的加入使得类型层面的编程成为可能。社区也因此诞生了许多优秀的类型工具库，如 `type-fest`、`ts-toolbelt`、`utility-types` 等，它们极大地推动了 TypeScript 类型编程的发展。

### 解决的问题

自定义工具类型主要解决以下问题：

1. **类型复用**：避免在多处重复编写相似的类型定义
2. **类型约束**：在编译时对类型进行严格检查，减少运行时错误
3. **代码可读性**：通过语义化的类型名称提升代码的自文档性
4. **类型安全的抽象**：在不损失类型信息的前提下实现代码抽象

## 核心原理

自定义工具类型的构建依赖于 TypeScript 的几个核心类型特性：

### 泛型（Generics）

泛型是类型的参数化，允许在定义类型时使用类型变量：

```typescript
type Identity<T> = T;
type Box<T> = { value: T };
```

### 条件类型（Conditional Types）

条件类型根据类型关系选择不同的类型分支：

```typescript
type IsString<T> = T extends string ? true : false;

// 分布式条件类型：当 T 是联合类型时，条件类型会分布到每个成员
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>; // string[] | number[]
```

### 映射类型（Mapped Types）

映射类型可以遍历类型的键并创建新类型：

```typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Optional<T> = {
  [K in keyof T]?: T[K];
};
```

### infer 关键字

`infer` 用于在条件类型中推断类型变量：

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type Unpacked<T> = T extends Array<infer U> ? U : T;
```

### 模板字面量类型（Template Literal Types）

TypeScript 4.1 引入的模板字面量类型允许对字符串类型进行操作：

```typescript
type Greeting<T extends string> = `Hello, ${T}!`;
type HelloWorld = Greeting<'World'>; // "Hello, World!"
```

### 类型运算的本质

TypeScript 的类型系统是图灵完备的，这意味着理论上可以用类型实现任意复杂的计算。工具类型本质上就是类型层面的函数：

- **输入**：类型参数（泛型）
- **处理**：条件分支、递归、映射等
- **输出**：新的类型

## 核心要点

### 构建自定义工具类型的基本步骤

1. **明确需求**：确定输入类型和期望的输出类型
2. **分解问题**：将复杂类型拆分为多个简单类型的组合
3. **选择工具**：根据需求选择合适的类型特性
4. **递归处理**：对于嵌套结构，使用递归类型
5. **边界处理**：考虑特殊情况（never、unknown、联合类型等）

### 常用的类型构建模式

| 模式 | 说明 | 示例 |
|------|------|------|
| 映射转换 | 遍历对象键并转换值类型 | `Readonly<T>` |
| 条件筛选 | 根据条件过滤类型 | `Extract<T, U>` |
| 递归处理 | 处理嵌套结构 | `DeepPartial<T>` |
| 推断提取 | 从复杂类型中提取部分类型 | `ReturnType<T>` |
| 键操作 | 添加、删除或修改对象的键 | `Omit<T, K>` |

### 类型体操的基础运算

```typescript
// 类型相等判断
type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2)
    ? true
    : false;

// 获取对象的键的联合类型
type Keys<T> = keyof T;

// 获取对象的值的联合类型
type Values<T> = T[keyof T];
```

## 代码示例

### DeepPartial - 深度可选

将对象的所有嵌套属性都变为可选：

```typescript
/**
 * 递归地将类型 T 的所有属性及其嵌套属性变为可选
 * @example
 * type User = { name: string; profile: { age: number; email: string } };
 * type PartialUser = DeepPartial<User>;
 * // { name?: string; profile?: { age?: number; email?: string } }
 */
type DeepPartial<T> = T extends object
  ? T extends Function
    ? T  // 函数类型直接返回
    : { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

// 使用示例
interface Config {
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
    poolSize: number;
  };
}

// 部分配置更新时非常有用
function updateConfig(config: Config, updates: DeepPartial<Config>): Config {
  // 深度合并逻辑
  return { ...config, ...updates };
}

// 只需要提供要更新的部分
const updates: DeepPartial<Config> = {
  server: {
    ssl: {
      enabled: true
    }
  }
};
```

### DeepRequired - 深度必选

与 DeepPartial 相反，将所有嵌套属性变为必选：

```typescript
/**
 * 递归地将类型 T 的所有属性及其嵌套属性变为必选
 * -? 修饰符用于移除可选标记
 */
type DeepRequired<T> = T extends object
  ? T extends Function
    ? T
    : { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;

// 处理可能包含 undefined 的情况
type DeepRequiredNonNullable<T> = T extends object
  ? T extends Function
    ? T
    : { [K in keyof T]-?: DeepRequiredNonNullable<NonNullable<T[K]>> }
  : T;

// 使用示例
interface PartialSettings {
  theme?: {
    primary?: string;
    secondary?: string;
  };
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
}

type RequiredSettings = DeepRequired<PartialSettings>;
// {
//   theme: { primary: string; secondary: string };
//   notifications: { email: boolean; push: boolean };
// }
```

### DeepReadonly - 深度只读

递归地将所有属性变为只读：

```typescript
/**
 * 递归地将类型 T 的所有属性变为只读
 */
type DeepReadonly<T> = T extends object
  ? T extends Function
    ? T
    : { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

// 带有数组处理的版本
type DeepReadonlyArray<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonlyFull<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonlyFull<T[K]> }
    : T;

type DeepReadonlyFull<T> = T extends Function ? T : DeepReadonlyArray<T>;

// 使用示例
interface State {
  users: { id: number; name: string }[];
  settings: {
    theme: string;
    language: string;
  };
}

type ImmutableState = DeepReadonlyFull<State>;
// {
//   readonly users: ReadonlyArray<{ readonly id: number; readonly name: string }>;
//   readonly settings: { readonly theme: string; readonly language: string };
// }
```

### OmitByType - 按值类型过滤

根据属性值的类型来过滤对象的键：

```typescript
/**
 * 从类型 T 中移除值类型为 U 的属性
 * @example
 * type Obj = { a: string; b: number; c: string };
 * type Result = OmitByType<Obj, string>; // { b: number }
 */
type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

/**
 * 从类型 T 中保留值类型为 U 的属性
 */
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

// 使用示例
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

type StringFields = PickByType<User, string>;
// { name: string; email: string }

type NonStringFields = OmitByType<User, string>;
// { id: number; age: number; isActive: boolean }

type NumberFields = PickByType<User, number>;
// { id: number; age: number }

// 更复杂的示例：过滤出函数类型的属性
interface Service {
  name: string;
  version: number;
  start: () => void;
  stop: () => void;
  getStatus: () => string;
}

type Methods = PickByType<Service, Function>;
// { start: () => void; stop: () => void; getStatus: () => string }

type Data = OmitByType<Service, Function>;
// { name: string; version: number }
```

### RequiredKeys / OptionalKeys - 获取必选/可选键

提取对象类型中的必选键或可选键：

```typescript
/**
 * 获取类型 T 中所有必选属性的键
 */
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * 获取类型 T 中所有可选属性的键
 */
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// 使用示例
interface Person {
  id: number;           // 必选
  name: string;         // 必选
  email?: string;       // 可选
  phone?: string;       // 可选
  address?: string;     // 可选
}

type PersonRequiredKeys = RequiredKeys<Person>;  // "id" | "name"
type PersonOptionalKeys = OptionalKeys<Person>;  // "email" | "phone" | "address"

// 实际应用：确保某些字段必填
type EnsureRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

type PersonWithRequiredEmail = EnsureRequired<Person, 'email'>;
// { id: number; name: string; phone?: string; address?: string; email: string }
```

### Mutable - 移除只读

移除对象所有属性的只读修饰符：

```typescript
/**
 * 移除类型 T 中所有属性的 readonly 修饰符
 * -readonly 用于移除只读标记
 */
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * 深度移除只读修饰符
 */
type DeepMutable<T> = T extends object
  ? T extends Function
    ? T
    : { -readonly [K in keyof T]: DeepMutable<T[K]> }
  : T;

// 使用示例
interface ReadonlyUser {
  readonly id: number;
  readonly name: string;
  readonly profile: {
    readonly bio: string;
    readonly avatar: string;
  };
}

type MutableUser = Mutable<ReadonlyUser>;
// { id: number; name: string; profile: { readonly bio: string; readonly avatar: string } }

type FullyMutableUser = DeepMutable<ReadonlyUser>;
// { id: number; name: string; profile: { bio: string; avatar: string } }
```

### PathOf / PathValue - 对象路径类型

获取对象的所有可能路径及对应的值类型：

```typescript
/**
 * 获取对象类型 T 的所有可能路径
 * 使用点号分隔的字符串表示嵌套路径
 */
type PathOf<T, Prefix extends string = ''> = T extends object
  ? T extends Array<any>
    ? Prefix
    : {
        [K in keyof T & string]: K extends string
          ? Prefix extends ''
            ? PathOf<T[K], K> | K
            : PathOf<T[K], `${Prefix}.${K}`> | `${Prefix}.${K}`
          : never;
      }[keyof T & string]
  : Prefix;

/**
 * 根据路径获取对应的值类型
 */
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

// 使用示例
interface AppConfig {
  app: {
    name: string;
    version: string;
  };
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
}

type ConfigPaths = PathOf<AppConfig>;
// "app" | "app.name" | "app.version" | "database" | "database.host" |
// "database.port" | "database.credentials" | "database.credentials.username" |
// "database.credentials.password"

type HostType = PathValue<AppConfig, 'database.host'>;     // string
type PortType = PathValue<AppConfig, 'database.port'>;     // number
type CredentialsType = PathValue<AppConfig, 'database.credentials'>;
// { username: string; password: string }

// 类型安全的配置读取函数
function getConfig<P extends PathOf<AppConfig>>(
  config: AppConfig,
  path: P
): PathValue<AppConfig, P> {
  const keys = path.split('.');
  let result: any = config;
  for (const key of keys) {
    result = result[key];
  }
  return result;
}
```

### UnionToIntersection - 联合转交叉

将联合类型转换为交叉类型：

```typescript
/**
 * 将联合类型转换为交叉类型
 * 利用函数参数的逆变特性实现
 */
type UnionToIntersection<U> = (
  U extends any ? (arg: U) => void : never
) extends (arg: infer I) => void
  ? I
  : never;

// 使用示例
type Union = { a: string } | { b: number } | { c: boolean };
type Intersection = UnionToIntersection<Union>;
// { a: string } & { b: number } & { c: boolean }

// 实际应用：合并多个接口
interface A { name: string; }
interface B { age: number; }
interface C { email: string; }

type Merged = UnionToIntersection<A | B | C>;
// { name: string } & { age: number } & { email: string }
```

### FunctionKeys - 获取函数类型的键

提取对象中所有函数类型属性的键：

```typescript
/**
 * 获取类型 T 中所有函数类型属性的键
 */
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

/**
 * 获取类型 T 中所有非函数类型属性的键
 */
type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * 只保留函数类型的属性
 */
type PickFunctions<T> = Pick<T, FunctionKeys<T>>;

/**
 * 移除函数类型的属性
 */
type OmitFunctions<T> = Pick<T, NonFunctionKeys<T>>;

// 使用示例
interface UserService {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  getProfile: () => Promise<User>;
  updateProfile: (data: Partial<User>) => Promise<User>;
}

type UserServiceMethods = FunctionKeys<UserService>;
// "login" | "logout" | "getProfile" | "updateProfile"

type UserServiceData = NonFunctionKeys<UserService>;
// "currentUser" | "isAuthenticated"

type UserServiceAPI = PickFunctions<UserService>;
// { login: ...; logout: ...; getProfile: ...; updateProfile: ... }
```

### Promisify - 函数 Promise 化

将函数的返回类型包装为 Promise：

```typescript
/**
 * 将函数的返回类型包装为 Promise
 */
type Promisify<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => Promise<Awaited<ReturnType<T>>>;

/**
 * 将对象中所有方法的返回类型包装为 Promise
 */
type PromisifyAll<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : T[K];
};

// 使用示例
interface SyncAPI {
  getData: () => string;
  setData: (value: string) => void;
  processData: (input: number) => number;
}

type AsyncAPI = PromisifyAll<SyncAPI>;
// {
//   getData: () => Promise<string>;
//   setData: (value: string) => Promise<void>;
//   processData: (input: number) => Promise<number>;
// }
```

## 最佳实践

### 使用有意义的类型名称

```typescript
// 不好的命名
type T1<T> = { [K in keyof T]?: T[K] };

// 好的命名
type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
```

### 添加 JSDoc 注释

```typescript
/**
 * 递归地将类型 T 的所有属性变为可选
 * @template T - 要转换的对象类型
 * @example
 * type User = { name: string; profile: { age: number } };
 * type PartialUser = DeepPartial<User>;
 */
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

### 处理边界情况

```typescript
// 处理 Function、Array、Date 等特殊类型
type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends Date
      ? T
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;
```

### 避免过度复杂的类型

```typescript
// 将复杂类型拆分为多个简单类型
type IsArray<T> = T extends any[] ? true : false;
type IsFunction<T> = T extends Function ? true : false;
type IsObject<T> = T extends object
  ? IsArray<T> extends true
    ? false
    : IsFunction<T> extends true
      ? false
      : true
  : false;

// 然后组合使用
type DeepPartial<T> = IsObject<T> extends true
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

### 使用辅助类型提高可读性

```typescript
// 辅助类型
type Primitive = string | number | boolean | symbol | null | undefined;
type DeepPartialObject<T> = { [K in keyof T]?: DeepPartial<T[K]> };

// 主类型更清晰
type DeepPartial<T> = T extends Primitive
  ? T
  : T extends Function
    ? T
    : DeepPartialObject<T>;
```

### 组织和导出工具类型

```typescript
// types/utilities.ts
export type DeepPartial<T> = /* ... */;
export type DeepRequired<T> = /* ... */;
export type DeepReadonly<T> = /* ... */;

// types/index.ts
export * from './utilities';
export * from './api-types';
export * from './domain-types';
```

## 常见陷阱

### 递归类型的深度限制

TypeScript 对递归类型有深度限制（通常约 50 层），过深的递归会导致编译错误：

```typescript
// 可能导致问题的深度递归
type DeepNested = {
  level1: {
    level2: {
      // ... 很多层
      level50: {
        value: string;
      };
    };
  };
};

// 解决方案：添加递归深度计数器（TypeScript 4.5+）
type DeepPartialWithDepth<T, Depth extends number = 10> = Depth extends 0
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartialWithDepth<T[K], Prev[Depth]> }
    : T;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
```

### 分布式条件类型的意外行为

```typescript
// 联合类型会被分布处理
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>; // string[] | number[]

// 如果不想分布，用元组包装
type ToArrayNoDistribute<T> = [T] extends [any] ? T[] : never;
type Result2 = ToArrayNoDistribute<string | number>; // (string | number)[]
```

### never 类型的特殊行为

```typescript
// never 在联合类型中会消失
type Test1 = string | never; // string

// never 在条件类型中的行为
type Test2<T> = T extends string ? T : never;
type Result = Test2<never>; // never（不会进入条件判断）

// 检测 never 类型
type IsNever<T> = [T] extends [never] ? true : false;
```

### 索引访问的类型安全

```typescript
// 不安全的索引访问
type UnsafeGet<T, K> = T[K]; // 错误：K 可能不是 T 的键

// 安全的索引访问
type SafeGet<T, K extends keyof T> = T[K];

// 带默认值的安全访问
type SafeGetWithDefault<T, K, D = never> = K extends keyof T ? T[K] : D;
```

### 可选属性与 undefined 的区别

```typescript
interface User {
  name: string;
  email?: string;           // 可选属性
  phone: string | undefined; // 必须提供，但值可以是 undefined
}

// 这两个类型是不同的
type A = { key?: string };      // key 可以不存在
type B = { key: string | undefined }; // key 必须存在，值可以是 undefined

// 处理时需要注意
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
```

### 函数重载的类型推断

```typescript
// 对于重载函数，只会推断最后一个签名
function fn(x: string): string;
function fn(x: number): number;
function fn(x: string | number): string | number {
  return x;
}

type FnReturn = ReturnType<typeof fn>; // string | number（最后一个签名）
```

## 性能考量

### 类型实例化深度

TypeScript 编译器对类型实例化有深度限制。复杂的递归类型可能导致：

- 编译时间增加
- IDE 响应变慢
- 出现 "Type instantiation is excessively deep" 错误

```typescript
// 优化前：每次递归都创建新类型
type DeepPartialSlow<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartialSlow<T[K]> : T[K];
};

// 优化后：使用条件类型提前终止
type DeepPartialFast<T> = T extends object
  ? T extends Function
    ? T
    : { [K in keyof T]?: DeepPartialFast<T[K]> }
  : T;
```

### 缓存类型计算

TypeScript 会缓存类型计算结果，但复杂的类型可能无法有效缓存：

```typescript
// 使用类型别名帮助缓存
type IsObject<T> = T extends object ? (T extends Function ? false : true) : false;

// 在其他类型中复用
type DeepPartial<T> = IsObject<T> extends true
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

### 避免不必要的类型计算

```typescript
// 不好：每次使用都要计算
type Config = DeepPartial<LargeConfigType>;

// 好：计算一次，多次使用
type PartialConfig = DeepPartial<LargeConfigType>;
// 在多处使用 PartialConfig
```

### 合理使用 `any` 作为逃生舱

对于极其复杂的类型，适当使用 `any` 可以避免编译性能问题：

```typescript
// 当类型过于复杂时
type ComplexType<T> = T extends SomeCondition
  ? /* 复杂计算 */
  : any; // 使用 any 作为降级方案
```

## 实战场景

### 场景一：API 响应类型处理

```typescript
// API 响应包装类型
type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
  timestamp: string;
};

// 分页响应
type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}>;

// 将 API 响应中的 Date 字符串转换为 Date 类型
type DateKeys<T> = {
  [K in keyof T]: T[K] extends string
    ? K extends `${string}Date` | `${string}At` | `${string}Time`
      ? K
      : never
    : never;
}[keyof T];

type WithParsedDates<T> = {
  [K in keyof T]: K extends DateKeys<T> ? Date : T[K];
};

// 使用
interface UserResponse {
  id: number;
  name: string;
  createdAt: string;  // ISO date string
  updatedAt: string;  // ISO date string
  lastLoginDate: string;
}

type ParsedUser = WithParsedDates<UserResponse>;
// { id: number; name: string; createdAt: Date; updatedAt: Date; lastLoginDate: Date }
```

### 场景二：表单验证类型

```typescript
// 表单字段验证规则类型
type ValidationRule<T> = {
  required?: boolean;
  min?: T extends number ? number : never;
  max?: T extends number ? number : never;
  minLength?: T extends string ? number : never;
  maxLength?: T extends string ? number : never;
  pattern?: T extends string ? RegExp : never;
  custom?: (value: T) => string | undefined;
};

// 根据数据类型生成验证规则类型
type FormValidation<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

// 使用
interface RegisterForm {
  username: string;
  email: string;
  age: number;
  password: string;
}

const validation: FormValidation<RegisterForm> = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  age: {
    required: true,
    min: 18,
    max: 120,
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value) => {
      if (!/[A-Z]/.test(value)) {
        return 'Password must contain at least one uppercase letter';
      }
      return undefined;
    },
  },
};
```

### 场景三：状态管理类型

```typescript
// Redux 风格的 Action 类型
type ActionMap<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends undefined
    ? { type: K }
    : { type: K; payload: T[K] };
};

type Actions<T extends Record<string, any>> = ActionMap<T>[keyof ActionMap<T>];

// 使用
interface CounterPayloads {
  INCREMENT: undefined;
  DECREMENT: undefined;
  SET_COUNT: number;
  ADD: number;
}

type CounterAction = Actions<CounterPayloads>;
// | { type: 'INCREMENT' }
// | { type: 'DECREMENT' }
// | { type: 'SET_COUNT'; payload: number }
// | { type: 'ADD'; payload: number }

// Reducer 类型
type Reducer<S, A extends { type: string }> = (state: S, action: A) => S;

const counterReducer: Reducer<number, CounterAction> = (state, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    case 'SET_COUNT':
      return action.payload; // 类型安全：TypeScript 知道这里有 payload
    case 'ADD':
      return state + action.payload;
    default:
      return state;
  }
};
```

### 场景四：事件系统类型

```typescript
// 类型安全的事件发射器
type EventMap = Record<string, any>;

type EventHandler<T> = (payload: T) => void;

interface TypedEventEmitter<E extends EventMap> {
  on<K extends keyof E>(event: K, handler: EventHandler<E[K]>): void;
  off<K extends keyof E>(event: K, handler: EventHandler<E[K]>): void;
  emit<K extends keyof E>(event: K, payload: E[K]): void;
}

// 使用
interface AppEvents {
  'user:login': { userId: string; timestamp: Date };
  'user:logout': { userId: string };
  'data:update': { entity: string; id: number; changes: Record<string, any> };
  'error': Error;
}

declare const emitter: TypedEventEmitter<AppEvents>;

// 类型安全的事件处理
emitter.on('user:login', (payload) => {
  console.log(payload.userId);    // string
  console.log(payload.timestamp); // Date
});

emitter.emit('data:update', {
  entity: 'user',
  id: 1,
  changes: { name: 'New Name' },
});
```

### 场景五：ORM 查询构建器类型

```typescript
// 简化的查询条件类型
type WhereCondition<T> = {
  [K in keyof T]?: T[K] | { eq?: T[K]; ne?: T[K]; gt?: T[K]; lt?: T[K]; in?: T[K][] };
};

type OrderDirection = 'asc' | 'desc';
type OrderBy<T> = Partial<Record<keyof T, OrderDirection>>;

type SelectFields<T> = (keyof T)[];

interface QueryBuilder<T> {
  where(condition: WhereCondition<T>): QueryBuilder<T>;
  orderBy(order: OrderBy<T>): QueryBuilder<T>;
  select<K extends keyof T>(...fields: K[]): QueryBuilder<Pick<T, K>>;
  limit(count: number): QueryBuilder<T>;
  offset(count: number): QueryBuilder<T>;
  execute(): Promise<T[]>;
}

// 使用
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  createdAt: Date;
}

declare const query: QueryBuilder<User>;

// 类型安全的查询构建
const result = await query
  .where({
    age: { gt: 18 },
    name: { ne: 'admin' },
  })
  .orderBy({ createdAt: 'desc' })
  .select('id', 'name', 'email')
  .limit(10)
  .execute();

// result 类型为 Pick<User, 'id' | 'name' | 'email'>[]
```

## 面试要点

### 高频面试题

**1. 实现 DeepPartial 类型**

```typescript
// 题目：实现一个 DeepPartial<T>，将对象的所有嵌套属性变为可选

// 答案
type DeepPartial<T> = T extends object
  ? T extends Function
    ? T
    : { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

**2. 实现 Flatten 类型**

```typescript
// 题目：将嵌套数组类型扁平化为一维数组类型

type Flatten<T> = T extends (infer U)[]
  ? Flatten<U>
  : T;

// 测试
type Nested = number[][][];
type Flat = Flatten<Nested>; // number
```

**3. 获取对象所有路径**

```typescript
// 题目：获取对象的所有可能访问路径

type Paths<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends object
    ? K | `${K}.${Paths<T[K]>}`
    : K
  : never;
```

**4. 实现 UnionToTuple**

```typescript
// 题目：将联合类型转换为元组类型（高级题）

type UnionToIntersection<U> = (
  U extends any ? (arg: U) => void : never
) extends (arg: infer I) => void
  ? I
  : never;

type LastOfUnion<U> = UnionToIntersection<
  U extends any ? (x: U) => void : never
> extends (x: infer Last) => void
  ? Last
  : never;

type UnionToTuple<U, Last = LastOfUnion<U>> = [U] extends [never]
  ? []
  : [...UnionToTuple<Exclude<U, Last>>, Last];

// 测试
type Union = 'a' | 'b' | 'c';
type Tuple = UnionToTuple<Union>; // ['a', 'b', 'c']
```

**5. 实现 PickByValue**

```typescript
// 题目：根据值类型筛选对象的属性

type PickByValue<T, V> = Pick<
  T,
  { [K in keyof T]: T[K] extends V ? K : never }[keyof T]
>;

// 测试
interface Obj {
  a: string;
  b: number;
  c: string;
  d: boolean;
}
type StringKeys = PickByValue<Obj, string>; // { a: string; c: string }
```

### 面试考察重点

1. **基础概念**
   - 泛型的作用和用法
   - 条件类型的工作原理
   - 映射类型的语法
   - `infer` 关键字的用法

2. **高级技巧**
   - 分布式条件类型
   - 递归类型
   - 模板字面量类型
   - 类型守卫和类型收窄

3. **实践能力**
   - 能否正确实现常见工具类型
   - 是否了解边界情况和陷阱
   - 代码组织和命名规范

4. **问题解决**
   - 分析复杂类型需求
   - 拆解问题为简单步骤
   - 优化类型计算性能

## 延伸阅读

### 官方文档

- [TypeScript Handbook - Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Handbook - Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript Handbook - Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [TypeScript Handbook - Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

### 类型工具库

- [type-fest](https://github.com/sindresorhus/type-fest) - 常用类型工具集合
- [ts-toolbelt](https://github.com/millsp/ts-toolbelt) - 功能强大的类型工具库
- [utility-types](https://github.com/piotrwitek/utility-types) - 实用类型工具集

### 学习资源

- [Type Challenges](https://github.com/type-challenges/type-challenges) - TypeScript 类型编程挑战
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - 深入理解 TypeScript
- [Effective TypeScript](https://effectivetypescript.com/) - TypeScript 最佳实践

### 进阶文章

- [How the TypeScript Compiler Compiles](https://www.huy.rocks/everyday/04-01-2022-typescript-how-the-compiler-compiles)
- [TypeScript Type System Explained](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [Advanced TypeScript Patterns](https://www.patterns.dev/posts/advanced-typescript-patterns/)
