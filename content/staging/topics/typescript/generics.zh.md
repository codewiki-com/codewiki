---
title: TypeScript 泛型
description: 深入理解 TypeScript 泛型：泛型函数、泛型类、约束与条件类型
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - 泛型
  - 类型参数
  - 约束
status: imported
origin: old/src/content/docs/typescript/generics.zh.md
divergence: 0.227
issues: []
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 2
  lastUpdated: 2026-01-07
---

泛型是 TypeScript 类型系统中最强大的特性之一，它允许我们创建可重用的组件，这些组件可以支持多种类型而不失去类型安全性。泛型提供了一种方式来创建灵活且类型安全的代码。

## 什么是泛型？

泛型允许我们在定义函数、类或接口时不预先指定具体的类型，而是在使用时再指定类型。这样可以让同一段代码适用于多种类型，同时保持类型检查的优势。

### 为什么需要泛型？

不使用泛型的情况：

```typescript
function identity(arg: number): number {
  return arg;
}

// 如果要支持字符串，需要重新写一个函数
function identityString(arg: string): string {
  return arg;
}

// 使用 any 会失去类型检查
function identityAny(arg: any): any {
  return arg;
}
```

使用泛型：

```typescript
function identity<T>(arg: T): T {
  return arg;
}

// 使用时指定类型
const num = identity<number>(42);        // num: number
const str = identity<string>("hello");   // str: string
const bool = identity<boolean>(true);    // bool: boolean

// TypeScript 可以自动推断类型
const auto = identity("world");  // auto: string
```

## 泛型函数

### 基本语法

泛型函数使用尖括号 `<T>` 来声明类型参数：

```typescript
function getFirstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const numbers = [1, 2, 3];
const firstNum = getFirstElement(numbers);  // number | undefined

const strings = ["a", "b", "c"];
const firstStr = getFirstElement(strings);  // string | undefined
```

### 多个类型参数

函数可以有多个类型参数：

```typescript
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const result1 = pair<string, number>("age", 25);
// result1: [string, number]

const result2 = pair("name", "Alice");
// result2: [string, string] (自动推断)

const result3 = pair(42, true);
// result3: [number, boolean]
```

### 泛型箭头函数

```typescript
// 普通箭头函数
const map = <T, U>(array: T[], fn: (item: T) => U): U[] => {
  return array.map(fn);
};

const lengths = map(["hello", "world"], (s) => s.length);
// lengths: number[]

// 在 TSX 文件中，需要添加逗号来避免与 JSX 语法冲突
const mapTSX = <T,>(array: T[]): T[] => {
  return array;
};
```

### 实际应用示例

```typescript
// 数组去重
function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// 交换数组中的两个元素
function swap<T>(array: T[], i: number, j: number): T[] {
  const result = [...array];
  [result[i], result[j]] = [result[j], result[i]];
  return result;
}

// 安全的数组访问
function getArrayItem<T>(array: T[], index: number, defaultValue: T): T {
  return array[index] ?? defaultValue;
}

const colors = ["red", "green", "blue"];
const color = getArrayItem(colors, 10, "black");  // "black"
```

## 泛型接口

### 基本泛型接口

```typescript
interface Box<T> {
  value: T;
}

const numberBox: Box<number> = { value: 42 };
const stringBox: Box<string> = { value: "hello" };

// 泛型接口可以嵌套
interface Pair<T, U> {
  first: T;
  second: U;
}

const coordinate: Pair<number, number> = { first: 10, second: 20 };
const nameAge: Pair<string, number> = { first: "Alice", second: 30 };
```

### 泛型函数接口

```typescript
interface GenericIdentityFn<T> {
  (arg: T): T;
}

const myIdentity: GenericIdentityFn<number> = (arg) => arg;

// 或者将泛型参数放在方法上
interface SearchFn {
  <T>(array: T[], predicate: (item: T) => boolean): T | undefined;
}

const find: SearchFn = (array, predicate) => {
  return array.find(predicate);
};

const foundNumber = find([1, 2, 3, 4, 5], (n) => n > 3);  // 4
```

### 实际应用：响应数据类型

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Product {
  id: number;
  title: string;
  price: number;
}

// 使用
const userResponse: ApiResponse<User> = {
  success: true,
  data: {
    id: 1,
    name: "Alice",
    email: "alice@example.com"
  },
  timestamp: Date.now()
};

const productListResponse: ApiResponse<Product[]> = {
  success: true,
  data: [
    { id: 1, title: "Phone", price: 599 },
    { id: 2, title: "Laptop", price: 1299 }
  ],
  timestamp: Date.now()
};
```

## 泛型类

### 基本泛型类

```typescript
class GenericNumber<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  getValue(): T {
    return this.value;
  }

  setValue(value: T): void {
    this.value = value;
  }
}

const numberInstance = new GenericNumber<number>(42);
console.log(numberInstance.getValue());  // 42

const stringInstance = new GenericNumber<string>("hello");
console.log(stringInstance.getValue());  // "hello"
```

### 泛型集合类

```typescript
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

  clear(): void {
    this.items = [];
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
numberStack.push(3);
console.log(numberStack.pop());  // 3
console.log(numberStack.peek()); // 2
```

### 队列类实现

```typescript
class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  front(): T | undefined {
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

const taskQueue = new Queue<string>();
taskQueue.enqueue("task1");
taskQueue.enqueue("task2");
console.log(taskQueue.dequeue());  // "task1"
```

### 键值对存储类

```typescript
class KeyValueStore<K, V> {
  private store = new Map<K, V>();

  set(key: K, value: V): void {
    this.store.set(key, value);
  }

  get(key: K): V | undefined {
    return this.store.get(key);
  }

  has(key: K): boolean {
    return this.store.has(key);
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  keys(): K[] {
    return Array.from(this.store.keys());
  }

  values(): V[] {
    return Array.from(this.store.values());
  }
}

const userStore = new KeyValueStore<number, User>();
userStore.set(1, { id: 1, name: "Alice", email: "alice@example.com" });
console.log(userStore.get(1));
```

## 泛型约束

### 使用 extends 关键字约束

有时我们需要限制泛型的类型范围：

```typescript
// 约束必须有 length 属性
interface Lengthwise {
  length: number;
}

function logLength<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}

logLength("hello");           // OK
logLength([1, 2, 3]);         // OK
logLength({ length: 10 });    // OK
// logLength(42);             // Error: number 没有 length 属性
```

### 约束为特定类型

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = {
  name: "Alice",
  age: 30,
  email: "alice@example.com"
};

const name = getProperty(person, "name");    // OK, 类型为 string
const age = getProperty(person, "age");      // OK, 类型为 number
// const invalid = getProperty(person, "address"); // Error
```

### 在泛型约束中使用类型参数

```typescript
function copyFields<T extends U, U>(target: T, source: U): T {
  for (let key in source) {
    (target as any)[key] = source[key];
  }
  return target;
}

interface Named {
  name: string;
}

interface Person extends Named {
  name: string;
  age: number;
}

const person: Person = { name: "", age: 0 };
const named: Named = { name: "Alice" };
copyFields(person, named);  // OK
```

### 实际应用：确保对象属性存在

```typescript
function pluck<T, K extends keyof T>(objects: T[], key: K): T[K][] {
  return objects.map(obj => obj[key]);
}

interface Person {
  name: string;
  age: number;
  city: string;
}

const people: Person[] = [
  { name: "Alice", age: 30, city: "Beijing" },
  { name: "Bob", age: 25, city: "Shanghai" },
  { name: "Charlie", age: 35, city: "Guangzhou" }
];

const names = pluck(people, "name");     // string[]
const ages = pluck(people, "age");       // number[]
// const invalid = pluck(people, "country"); // Error
```

## 默认类型参数

### 基本用法

```typescript
interface Container<T = string> {
  value: T;
}

const stringContainer: Container = { value: "hello" };  // T 默认为 string
const numberContainer: Container<number> = { value: 42 };
```

### 多个默认类型参数

```typescript
class Dictionary<K = string, V = any> {
  private items = new Map<K, V>();

  set(key: K, value: V): void {
    this.items.set(key, value);
  }

  get(key: K): V | undefined {
    return this.items.get(key);
  }
}

// 使用默认类型
const dict1 = new Dictionary();
dict1.set("name", "Alice");

// 指定第一个类型参数
const dict2 = new Dictionary<number>();
dict2.set(1, "one");

// 指定全部类型参数
const dict3 = new Dictionary<string, number>();
dict3.set("age", 30);
```

### 默认类型参数的约束

```typescript
interface PageData<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

function fetchPage<T = any>(page: number): Promise<PageData<T>> {
  // 实现省略
  return Promise.resolve({
    data: [] as T[],
    total: 0,
    page,
    pageSize: 10
  });
}

// 不指定类型，使用默认的 any
fetchPage(1);

// 指定具体类型
fetchPage<User>(1);
```

## 条件类型

### 基本条件类型

条件类型使用 `extends` 和三元运算符的语法：

```typescript
type TypeName<T> =
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  T extends undefined ? "undefined" :
  T extends Function ? "function" :
  "object";

type T1 = TypeName<string>;    // "string"
type T2 = TypeName<number>;    // "number"
type T3 = TypeName<boolean>;   // "boolean"
type T4 = TypeName<() => void>; // "function"
type T5 = TypeName<string[]>;  // "object"
```

### 分布式条件类型

当条件类型作用于联合类型时，会分布到每个成员：

```typescript
type ToArray<T> = T extends any ? T[] : never;

type T1 = ToArray<string | number>;
// 等价于: ToArray<string> | ToArray<number>
// 结果: string[] | number[]

// 阻止分布式行为
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type T2 = ToArrayNonDist<string | number>;
// 结果: (string | number)[]
```

### infer 关键字

`infer` 可以在条件类型中推断类型：

```typescript
// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type T1 = ReturnType<() => string>;           // string
type T2 = ReturnType<(x: number) => number>;  // number
type T3 = ReturnType<typeof Math.random>;     // number

// 提取函数参数类型
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

type T4 = Parameters<(x: number, y: string) => void>;  // [number, string]

// 提取数组元素类型
type ElementType<T> = T extends (infer E)[] ? E : never;

type T5 = ElementType<string[]>;     // string
type T6 = ElementType<number[]>;     // number

// 提取 Promise 的类型
type Unpromise<T> = T extends Promise<infer R> ? R : T;

type T7 = Unpromise<Promise<string>>;  // string
type T8 = Unpromise<number>;           // number
```

### 实际应用：深度只读

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

interface Config {
  name: string;
  settings: {
    theme: string;
    options: {
      darkMode: boolean;
    };
  };
}

type ReadonlyConfig = DeepReadonly<Config>;
// 所有嵌套属性都是只读的
```

### 实际应用：提取可选属性

```typescript
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

interface User {
  id: number;
  name: string;
  age?: number;
  email?: string;
}

type OptionalUserKeys = OptionalKeys<User>;  // "age" | "email"
type RequiredUserKeys = RequiredKeys<User>;  // "id" | "name"
```

## 高级泛型模式

### 泛型工厂函数

```typescript
function createInstance<T>(constructor: new () => T): T {
  return new constructor();
}

class Person {
  name = "Unknown";
}

const person = createInstance(Person);
console.log(person.name);  // "Unknown"
```

### 泛型混合（Mixins）

```typescript
type Constructor<T = {}> = new (...args: any[]) => T;

function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    timestamp = Date.now();
  };
}

function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActive = false;

    activate() {
      this.isActive = true;
    }

    deactivate() {
      this.isActive = false;
    }
  };
}

class User {
  name = "";
}

const TimestampedUser = Timestamped(User);
const instance = new TimestampedUser();
console.log(instance.timestamp);

const TimestampedActivatableUser = Timestamped(Activatable(User));
const instance2 = new TimestampedActivatableUser();
instance2.activate();
console.log(instance2.isActive);  // true
```

### 类型安全的事件发射器

```typescript
type EventMap = {
  [event: string]: any;
};

class TypedEventEmitter<Events extends EventMap> {
  private listeners: {
    [K in keyof Events]?: Array<(data: Events[K]) => void>;
  } = {};

  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }
}

// 使用
interface MyEvents {
  userLogin: { userId: number; timestamp: number };
  userLogout: { userId: number };
  dataUpdate: { data: any[] };
}

const emitter = new TypedEventEmitter<MyEvents>();

emitter.on("userLogin", (data) => {
  console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

emitter.emit("userLogin", { userId: 123, timestamp: Date.now() });
// emitter.emit("userLogin", { userId: "123" }); // Error: 类型不匹配
```

## 最佳实践

### 使用有意义的类型参数名称

```typescript
// 不好
function map<T, U>(array: T[], fn: (item: T) => U): U[] {
  return array.map(fn);
}

// 更好：使用描述性名称
function map<Item, Result>(
  array: Item[],
  fn: (item: Item) => Result
): Result[] {
  return array.map(fn);
}

// 常见约定
// T - Type（类型）
// K - Key（键）
// V - Value（值）
// E - Element（元素）
// R - Result（结果）
```

### 避免过度使用泛型

```typescript
// 过度使用
function identity<T>(arg: T): T {
  return arg;
}

// 如果类型固定，直接使用具体类型
function getStringLength(str: string): number {
  return str.length;
}
```

### 优先使用类型推断

```typescript
// 不需要显式指定类型参数
const numbers = [1, 2, 3];
const doubled = numbers.map(n => n * 2);  // TypeScript 自动推断

// 只在必要时显式指定
const result = someGenericFunction<SpecificType>(arg);
```

### 合理使用泛型约束

```typescript
// 添加必要的约束使代码更安全
function merge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

// 这样可以防止传入非对象类型
// merge(42, "hello");  // Error
```

### 文档化复杂的泛型类型

```typescript
/**
 * 递归地将类型的所有属性设置为可选
 * @template T - 要处理的类型
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};
```

## 总结

泛型是 TypeScript 中强大而灵活的特性，它提供了：

1. **类型安全**：在编译时捕获类型错误
2. **代码复用**：编写可适用于多种类型的通用代码
3. **类型推断**：TypeScript 能够自动推断泛型类型
4. **灵活性**：通过约束、条件类型等高级特性实现复杂的类型逻辑

掌握泛型是成为 TypeScript 高手的关键一步。从简单的泛型函数开始，逐步深入到泛型类、泛型约束和条件类型，你将能够编写出更加健壮和可维护的 TypeScript 代码。

## 参考资源

- [TypeScript 官方文档 - 泛型](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Deep Dive - 泛型](https://basarat.gitbook.io/typescript/type-system/generics)
- [TypeScript 高级类型](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
