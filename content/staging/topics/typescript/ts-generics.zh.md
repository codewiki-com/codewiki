---
title: TypeScript 泛型编程
description: 掌握TypeScript泛型的使用方法、约束、工具类型和高级类型体操
track: typescript
section: generics-advanced
difficulty: intermediate
tags:
  - TypeScript
  - 泛型
  - 类型系统
status: imported
origin: old/src/content/docs/frontend/ts-generics.zh.md
divergence: 0.214
issues:
  - order-mismatch
legacy:
  category: Frontend
  subcategory: TypeScript
  order: 8
  lastUpdated: 2026-01-07
---

泛型（Generics）是 TypeScript 类型系统中最强大的特性之一，它允许我们在定义函数、接口或类时不预先指定具体的类型，而是在使用时再确定类型。掌握泛型是成为 TypeScript 高级开发者的必经之路。

## 概念解释

### 什么是泛型？

泛型本质上是**类型的参数化**。就像函数可以接收值参数一样，泛型允许类型接收类型参数。这使得我们可以编写更加灵活、可复用的代码，同时保持类型安全。

考虑一个简单的例子：我们需要一个函数，接收什么类型就返回什么类型。

```typescript
// 不使用泛型 - 丢失类型信息
function identity(arg: any): any {
  return arg;
}

// 使用泛型 - 保持类型信息
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<string>("hello"); // result 的类型是 string
const num = identity(42); // 类型推断：num 的类型是 number（字面量类型）
```

### 为什么需要泛型？

1. **类型安全**：避免使用 `any` 导致的类型丢失
2. **代码复用**：一套代码逻辑适配多种类型
3. **更好的开发体验**：IDE 自动补全和类型检查
4. **抽象能力**：构建通用的数据结构和算法

## 核心原理

泛型的核心原理是**类型变量**。类型变量是一种特殊的变量，它作用于类型而非值。当我们声明 `<T>` 时，`T` 就成为了一个类型变量，可以在函数签名、接口定义或类定义中使用。

```typescript
// T 是类型变量，可以被任何类型替代
function swap<T, U>(tuple: [T, U]): [U, T] {
  return [tuple[1], tuple[0]];
}

const swapped = swap([1, "hello"]); // 类型是 [string, number]
```

TypeScript 编译器在处理泛型时会进行**类型推断**。大多数情况下，编译器可以根据传入的参数自动推断类型变量的具体类型，无需显式指定。

## 泛型函数

泛型函数是最常见的泛型应用场景。

### 基础语法

```typescript
// 单个类型参数
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}

// 多个类型参数
function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

// 箭头函数泛型
const getLength = <T extends { length: number }>(arg: T): number => {
  return arg.length;
};
```

### 实际应用示例

```typescript
// API 请求封装
async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json() as Promise<T>;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// 使用时指定返回类型
const user = await fetchData<User>("/api/user/1");
console.log(user.name); // 完整的类型提示

// 数组工具函数
function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function groupBy<T, K extends keyof any>(
  arr: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const groupKey = key(item);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}
```

## 泛型接口

泛型接口允许我们定义可复用的类型结构。

```typescript
// 基础泛型接口
interface Container<T> {
  value: T;
  getValue(): T;
  setValue(value: T): void;
}

// 实现泛型接口
class Box<T> implements Container<T> {
  constructor(public value: T) {}

  getValue(): T {
    return this.value;
  }

  setValue(value: T): void {
    this.value = value;
  }
}

// API 响应接口
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// 使用示例
type UserListResponse = PaginatedResponse<User>;
```

### 泛型接口 vs 泛型类型别名

```typescript
// 接口 - 支持声明合并
interface Dictionary<T> {
  [key: string]: T;
}

interface Dictionary<T> {
  size: number; // 声明合并
}

// 类型别名 - 更灵活，支持联合类型
type Result<T> = { success: true; data: T } | { success: false; error: string };

// 条件类型只能用类型别名
type Nullable<T> = T | null | undefined;
```

## 泛型类

泛型类允许我们创建可复用的类结构。

```typescript
// 基础泛型类
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// 使用
const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
console.log(numberStack.pop()); // 2

// 更复杂的示例：双向链表
class LinkedListNode<T> {
  constructor(
    public value: T,
    public next: LinkedListNode<T> | null = null,
    public prev: LinkedListNode<T> | null = null
  ) {}
}

class DoublyLinkedList<T> {
  private head: LinkedListNode<T> | null = null;
  private tail: LinkedListNode<T> | null = null;
  private _size: number = 0;

  get size(): number {
    return this._size;
  }

  append(value: T): void {
    const newNode = new LinkedListNode(value);
    if (!this.tail) {
      this.head = this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this._size++;
  }

  *[Symbol.iterator](): Iterator<T> {
    let current = this.head;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}
```

## 泛型约束（extends）

泛型约束用于限制类型参数必须满足特定条件。

### 基础约束

```typescript
// 约束 T 必须有 length 属性
function logLength<T extends { length: number }>(arg: T): T {
  console.log(arg.length);
  return arg;
}

logLength("hello"); // OK
logLength([1, 2, 3]); // OK
logLength({ length: 10 }); // OK
// logLength(123); // Error: number 没有 length 属性

// 约束 T 必须是某个接口的子类型
interface Printable {
  print(): void;
}

function printAll<T extends Printable>(items: T[]): void {
  items.forEach(item => item.print());
}
```

### keyof 约束

```typescript
// 确保 K 是 T 的键
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = { name: "Tom", age: 25 };
getProperty(person, "name"); // OK，返回 string
getProperty(person, "age"); // OK，返回 number
// getProperty(person, "address"); // Error: "address" 不是 person 的键

// 多重约束
function setProperty<T, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K]
): void {
  obj[key] = value;
}
```

### 泛型约束中使用类型参数

```typescript
// U 必须是 T 的子类型
function copyFields<T extends U, U>(target: T, source: U): T {
  for (let key in source) {
    target[key] = (source as T)[key];
  }
  return target;
}
```

## 内置工具类型

TypeScript 提供了丰富的内置工具类型，它们都是基于泛型实现的。

### Partial 和 Required

```typescript
// Partial<T> - 将所有属性变为可选
type Partial<T> = {
  [P in keyof T]?: T[P];
};

interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
// 等价于 { id?: number; name?: string; email?: string; }

// Required<T> - 将所有属性变为必需
type Required<T> = {
  [P in keyof T]-?: T[P];
};

interface Config {
  host?: string;
  port?: number;
}

type RequiredConfig = Required<Config>;
// 等价于 { host: string; port: number; }
```

### Pick 和 Omit

```typescript
// Pick<T, K> - 从 T 中选取指定属性
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type UserBasic = Pick<User, "id" | "name">;
// 等价于 { id: number; name: string; }

// Omit<T, K> - 从 T 中排除指定属性
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

type UserWithoutEmail = Omit<User, "email">;
// 等价于 { id: number; name: string; }
```

### Record

```typescript
// Record<K, T> - 创建一个对象类型，键为 K，值为 T
type Record<K extends keyof any, T> = {
  [P in K]: T;
};

type PageInfo = {
  title: string;
  url: string;
};

type Pages = Record<"home" | "about" | "contact", PageInfo>;

const pages: Pages = {
  home: { title: "Home", url: "/" },
  about: { title: "About", url: "/about" },
  contact: { title: "Contact", url: "/contact" }
};
```

### Readonly 和 ReadonlyArray

```typescript
// Readonly<T> - 将所有属性变为只读
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

const user: Readonly<User> = {
  id: 1,
  name: "Tom",
  email: "tom@example.com"
};
// user.name = "Jerry"; // Error: 只读属性

// ReadonlyArray<T> - 只读数组
const numbers: ReadonlyArray<number> = [1, 2, 3];
// numbers.push(4); // Error: 只读数组
// numbers[0] = 10; // Error: 只读数组
```

### Exclude、Extract 和 NonNullable

```typescript
// Exclude<T, U> - 从 T 中排除可以赋值给 U 的类型
type Exclude<T, U> = T extends U ? never : T;

type T1 = Exclude<"a" | "b" | "c", "a">; // "b" | "c"

// Extract<T, U> - 从 T 中提取可以赋值给 U 的类型
type Extract<T, U> = T extends U ? T : never;

type T2 = Extract<"a" | "b" | "c", "a" | "f">; // "a"

// NonNullable<T> - 从 T 中排除 null 和 undefined
type NonNullable<T> = T extends null | undefined ? never : T;

type T3 = NonNullable<string | null | undefined>; // string
```

### ReturnType 和 Parameters

```typescript
// ReturnType<T> - 获取函数返回类型
type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;

function createUser() {
  return { id: 1, name: "Tom" };
}

type UserType = ReturnType<typeof createUser>;
// 等价于 { id: number; name: string; }

// Parameters<T> - 获取函数参数类型的元组
type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

function greet(name: string, age: number): string {
  return `Hello, ${name}! You are ${age} years old.`;
}

type GreetParams = Parameters<typeof greet>; // [string, number]
```

## 条件类型与 infer

条件类型是 TypeScript 类型系统中最强大的特性之一，它允许我们根据条件选择类型。

### 基础条件类型

```typescript
// 基础语法：T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false

// 分布式条件类型
type ToArray<T> = T extends any ? T[] : never;

type StrOrNumArray = ToArray<string | number>;
// 等价于 string[] | number[]（不是 (string | number)[]）
```

### infer 关键字

`infer` 用于在条件类型中声明一个待推断的类型变量。

```typescript
// 获取数组元素类型
type ElementType<T> = T extends (infer E)[] ? E : never;

type NumElement = ElementType<number[]>; // number
type StrElement = ElementType<string[]>; // string

// 获取 Promise 解析后的类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type Resolved = UnwrapPromise<Promise<string>>; // string

// 递归解包嵌套 Promise
type DeepUnwrapPromise<T> = T extends Promise<infer U>
  ? DeepUnwrapPromise<U>
  : T;

type Deep = DeepUnwrapPromise<Promise<Promise<Promise<number>>>>; // number

// 获取函数第一个参数类型
type FirstParameter<T extends (...args: any) => any> = T extends (
  first: infer F,
  ...rest: any
) => any
  ? F
  : never;

type First = FirstParameter<(a: string, b: number) => void>; // string
```

### 复杂的 infer 应用

```typescript
// 提取对象中值为函数的属性名
type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? K : never;
}[keyof T];

interface Mixed {
  name: string;
  age: number;
  greet(): void;
  calculate(x: number): number;
}

type FuncNames = FunctionPropertyNames<Mixed>; // "greet" | "calculate"

// 获取构造函数的实例类型
type InstanceType<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: any) => infer R ? R : any;
```

## 类型体操实战

### 实现 DeepReadonly

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

interface NestedObject {
  a: {
    b: {
      c: string;
    };
  };
  d: number;
}

type ReadonlyNested = DeepReadonly<NestedObject>;
// 所有嵌套属性都变为 readonly
```

### 实现 Flatten

```typescript
// 扁平化数组类型
type Flatten<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends any[]
    ? [...Flatten<First>, ...Flatten<Rest>]
    : [First, ...Flatten<Rest>]
  : [];

type Nested = [1, [2, [3, 4]], 5];
type Flat = Flatten<Nested>; // [1, 2, 3, 4, 5]
```

### 实现 TupleToUnion

```typescript
type TupleToUnion<T extends any[]> = T[number];

type Tuple = ["a", "b", "c"];
type Union = TupleToUnion<Tuple>; // "a" | "b" | "c"
```

### 实现 StringToUnion

```typescript
type StringToUnion<S extends string> = S extends `${infer First}${infer Rest}`
  ? First | StringToUnion<Rest>
  : never;

type Chars = StringToUnion<"hello">; // "h" | "e" | "l" | "o"
```

### 实现 CamelCase

```typescript
type CamelCase<S extends string> = S extends `${infer First}_${infer Rest}`
  ? `${Lowercase<First>}${Capitalize<CamelCase<Rest>>}`
  : Lowercase<S>;

type Camel = CamelCase<"hello_world_foo">; // "helloWorldFoo"
```

### 实现类型安全的事件系统

```typescript
type EventMap = {
  click: { x: number; y: number };
  keydown: { key: string; code: number };
  scroll: { scrollTop: number };
};

class TypedEventEmitter<T extends Record<string, any>> {
  private listeners: {
    [K in keyof T]?: Array<(data: T[K]) => void>;
  } = {};

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    this.listeners[event]?.forEach(listener => listener(data));
  }
}

const emitter = new TypedEventEmitter<EventMap>();

emitter.on("click", data => {
  console.log(data.x, data.y); // 完整的类型提示
});

emitter.emit("click", { x: 100, y: 200 }); // OK
// emitter.emit("click", { x: 100 }); // Error: 缺少 y 属性
```

## 最佳实践

### 合理使用泛型约束

```typescript
// 好的实践：明确约束
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}

// 避免：过于宽泛的约束
function merge<T, U>(a: T, b: U): T & U {
  return { ...a, ...b } as T & U; // 需要类型断言，不安全
}
```

### 提供默认类型参数

```typescript
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

// 可以不指定类型参数
const response: ApiResponse = { data: {}, status: 200 };

// 也可以指定具体类型
const userResponse: ApiResponse<User> = { data: user, status: 200 };
```

### 使用有意义的类型参数名

```typescript
// 好的实践
interface Repository<Entity, Id> {
  findById(id: Id): Entity | null;
  save(entity: Entity): void;
}

// 避免：单字母在复杂场景下难以理解
interface Repository<T, U> {
  findById(id: U): T | null;
  save(entity: T): void;
}
```

### 避免过度泛型化

```typescript
// 过度泛型化
function add<T extends number>(a: T, b: T): T {
  return (a + b) as T;
}

// 简单直接
function add(a: number, b: number): number {
  return a + b;
}
```

### 利用类型推断

```typescript
// 让 TypeScript 推断类型
const numbers = [1, 2, 3].map(n => n * 2); // number[]

// 不需要显式指定
const numbers = [1, 2, 3].map<number>(n => n * 2); // 多余
```

## 面试要点

### 常见面试题

1. **泛型和 any 的区别是什么？**
   - `any` 会丢失类型信息，而泛型保持类型安全
   - 泛型可以建立输入和输出之间的类型关系

2. **解释 keyof 和 typeof 的用法**
   - `keyof` 获取对象类型的所有键的联合类型
   - `typeof` 获取值的类型

3. **什么是分布式条件类型？**
   - 当条件类型作用于联合类型时，会分别对每个成员应用条件

4. **infer 关键字的作用是什么？**
   - 在条件类型中声明待推断的类型变量

5. **实现一个 DeepPartial 类型**
   ```typescript
   type DeepPartial<T> = {
     [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
   };
   ```

6. **如何获取函数的返回类型？**
   - 使用内置的 `ReturnType<T>` 或手动实现带 `infer` 的条件类型

### 进阶考察点

- 协变与逆变的理解
- 类型收窄（Type Narrowing）
- 模板字面量类型
- 映射类型的修饰符（`+`、`-`、`readonly`、`?`）

## 延伸阅读

### 官方资源

- [TypeScript 官方文档 - 泛型](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript 官方文档 - 工具类型](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript 官方文档 - 条件类型](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)

### 进阶学习

- [type-challenges](https://github.com/type-challenges/type-challenges) - 类型体操练习题库
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - 深入理解 TypeScript
- [Total TypeScript](https://www.totaltypescript.com/) - Matt Pocock 的 TypeScript 教程

### 相关工具

- [ts-toolbelt](https://github.com/millsp/ts-toolbelt) - 高级类型工具库
- [utility-types](https://github.com/piotrwitek/utility-types) - 实用类型工具集
- [TypeScript Playground](https://www.typescriptlang.org/play) - 在线实验环境

---

掌握 TypeScript 泛型需要大量实践。建议从简单的泛型函数开始，逐步深入到复杂的类型体操。记住，泛型的目的是提高代码的复用性和类型安全性，而不是炫技。在实际项目中，应该在类型安全和代码可读性之间找到平衡。
