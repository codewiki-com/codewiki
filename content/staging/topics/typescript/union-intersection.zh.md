---
title: TypeScript 联合类型与交叉类型
description: 深入掌握 TypeScript 联合类型与交叉类型：类型组合、可辨识联合、类型收窄与实战应用
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - 联合类型
  - 交叉类型
  - 可辨识联合
  - 类型收窄
status: imported
origin: old/src/content/docs/typescript/union-intersection.zh.md
divergence: 0.221
issues:
  - title-lang-en
  - title-language
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 4
  lastUpdated: 2026-01-07
---

联合类型（Union Types）和交叉类型（Intersection Types）是 TypeScript 类型系统中两个核心概念，它们提供了强大的类型组合能力。联合类型表示"或"的关系，交叉类型表示"且"的关系。掌握这两种类型对于编写类型安全的 TypeScript 代码至关重要。

## 概念解释

### 联合类型（Union Types）

联合类型使用竖线 `|` 符号连接多个类型，表示一个值可以是这些类型中的任意一种。这类似于数学中的"并集"概念。

```typescript
// 基础联合类型
type StringOrNumber = string | number;

let value: StringOrNumber;
value = "hello";  // 有效
value = 42;       // 有效
// value = true;  // 错误：boolean 不在联合类型中
```

### 交叉类型（Intersection Types）

交叉类型使用 `&` 符号连接多个类型，表示一个值必须同时满足所有类型的要求。这类似于数学中的"交集"概念，但在类型系统中表现为类型的合并。

```typescript
// 基础交叉类型
interface Named {
  name: string;
}

interface Aged {
  age: number;
}

type Person = Named & Aged;

const person: Person = {
  name: "Alice",  // 必须有 name
  age: 30         // 必须有 age
};
```

### 历史背景

联合类型和交叉类型源自类型理论中的代数数据类型（Algebraic Data Types, ADTs）。联合类型对应于"和类型"（Sum Types），交叉类型对应于"积类型"（Product Types）。TypeScript 从 1.4 版本开始支持联合类型，从 1.6 版本开始支持交叉类型。

### 解决的问题

1. **类型灵活性**：允许变量接受多种类型的值
2. **类型组合**：无需继承即可组合多个类型
3. **精确建模**：更准确地表达业务领域中的类型关系
4. **API 设计**：创建更灵活的函数签名

## 核心原理

### 联合类型的底层机制

联合类型在类型检查时采用"宽进严出"的策略：

```typescript
type StringOrNumber = string | number;

function process(value: StringOrNumber) {
  // 在函数内部，只能访问 string 和 number 共有的属性/方法
  // value.length;  // 错误：number 没有 length 属性
  // value.toFixed(); // 错误：string 没有 toFixed 方法

  // 可以访问共有的方法
  value.toString();  // 有效：两者都有 toString
  value.valueOf();   // 有效：两者都有 valueOf
}
```

### 交叉类型的底层机制

交叉类型将多个类型的成员合并为一个类型：

```typescript
interface A {
  a: string;
  shared: number;
}

interface B {
  b: string;
  shared: number;
}

type AB = A & B;

// AB 等价于：
// {
//   a: string;
//   b: string;
//   shared: number;  // 相同属性类型必须兼容
// }

const ab: AB = {
  a: "a value",
  b: "b value",
  shared: 42
};
```

### 类型兼容性规则

```typescript
// 联合类型的兼容性
type Narrow = string;
type Wide = string | number;

let narrow: Narrow = "hello";
let wide: Wide = narrow;  // 有效：Narrow 可赋值给 Wide
// narrow = wide;         // 错误：Wide 不能赋值给 Narrow

// 交叉类型的兼容性
interface Base {
  id: number;
}

interface Extended {
  id: number;
  name: string;
}

// Extended 自动兼容 Base & { name: string }
let extended: Extended = { id: 1, name: "test" };
let intersected: Base & { name: string } = extended;  // 有效
```

### 属性冲突处理

当交叉类型中的属性类型冲突时：

```typescript
interface X {
  prop: string;
}

interface Y {
  prop: number;
}

type XY = X & Y;

// prop 的类型变为 string & number，即 never
// 因为没有值能同时是 string 和 number
// const xy: XY = { prop: ??? };  // 无法创建有效值
```

## 核心要点

### 联合类型要点

| 特性 | 说明 | 示例 |
|------|------|------|
| 语法 | 使用 `\|` 连接类型 | `string \| number` |
| 成员访问 | 只能访问共有成员 | `value.toString()` |
| 类型收窄 | 需要类型守卫确定具体类型 | `typeof`, `instanceof` |
| 分布式 | 在泛型中自动分布 | `T extends U ? X : Y` |
| 赋值规则 | 窄类型可赋值给宽类型 | `string` -> `string \| number` |

### 交叉类型要点

| 特性 | 说明 | 示例 |
|------|------|------|
| 语法 | 使用 `&` 连接类型 | `A & B` |
| 成员访问 | 可访问所有成员 | 合并后的所有属性 |
| 冲突处理 | 相同属性类型取交集 | `string & number` = `never` |
| 用途 | 组合多个类型/接口 | Mixin 模式 |
| 赋值规则 | 宽类型可赋值给窄类型 | `A & B` -> `A` |

### 类型收窄方法

1. **typeof 守卫**：适用于原始类型
2. **instanceof 守卫**：适用于类实例
3. **in 操作符**：检查属性是否存在
4. **可辨识联合**：使用共有的字面量属性
5. **自定义类型守卫**：使用 `is` 关键字
6. **真值收窄**：利用 JavaScript 的真值判断
7. **相等性收窄**：使用 `===` 或 `!==`

## 代码示例

### 联合类型基础用法

```typescript
// 1. 基本联合类型
type ID = string | number;

function printId(id: ID) {
  console.log(`ID is: ${id}`);
}

printId(101);      // "ID is: 101"
printId("abc");    // "ID is: abc"

// 2. 联合类型数组
type StringOrNumberArray = (string | number)[];

const mixed: StringOrNumberArray = [1, "two", 3, "four"];

// 3. 字面量联合类型
type Direction = "north" | "south" | "east" | "west";

function move(direction: Direction) {
  console.log(`Moving ${direction}`);
}

move("north");  // 有效
// move("up");  // 错误：不在联合类型中

// 4. 联合类型与 null/undefined
type NullableString = string | null | undefined;

function greet(name: NullableString) {
  if (name) {
    console.log(`Hello, ${name}!`);
  } else {
    console.log("Hello, stranger!");
  }
}
```

### 交叉类型基础用法

```typescript
// 1. 接口合并
interface Printable {
  print(): void;
}

interface Loggable {
  log(): void;
}

type PrintableAndLoggable = Printable & Loggable;

class Document implements PrintableAndLoggable {
  print() {
    console.log("Printing document...");
  }

  log() {
    console.log("Logging document...");
  }
}

// 2. 对象类型合并
type Name = {
  firstName: string;
  lastName: string;
};

type Contact = {
  email: string;
  phone: string;
};

type Employee = Name & Contact & {
  employeeId: number;
};

const employee: Employee = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "123-456-7890",
  employeeId: 12345
};

// 3. 函数类型交叉
type Logger = {
  log: (message: string) => void;
};

type Formatter = {
  format: (data: unknown) => string;
};

type LoggerWithFormatter = Logger & Formatter;

const logger: LoggerWithFormatter = {
  log: (message) => console.log(message),
  format: (data) => JSON.stringify(data)
};
```

### 类型收窄（Type Narrowing）

```typescript
// 1. typeof 类型守卫
function padLeft(value: string, padding: string | number): string {
  if (typeof padding === "number") {
    // 这里 padding 的类型被收窄为 number
    return " ".repeat(padding) + value;
  }
  // 这里 padding 的类型被收窄为 string
  return padding + value;
}

console.log(padLeft("Hello", 4));      // "    Hello"
console.log(padLeft("Hello", ">>> ")); // ">>> Hello"

// 2. instanceof 类型守卫
class Bird {
  fly() {
    console.log("Flying...");
  }
}

class Fish {
  swim() {
    console.log("Swimming...");
  }
}

type Pet = Bird | Fish;

function move(pet: Pet) {
  if (pet instanceof Bird) {
    pet.fly();  // pet 被收窄为 Bird
  } else {
    pet.swim(); // pet 被收窄为 Fish
  }
}

// 3. in 操作符
interface Admin {
  name: string;
  privileges: string[];
}

interface User {
  name: string;
  email: string;
}

type UnknownEmployee = Admin | User;

function printEmployeeInfo(emp: UnknownEmployee) {
  console.log(`Name: ${emp.name}`);

  if ("privileges" in emp) {
    // emp 被收窄为 Admin
    console.log(`Privileges: ${emp.privileges.join(", ")}`);
  }

  if ("email" in emp) {
    // emp 被收窄为 User
    console.log(`Email: ${emp.email}`);
  }
}

// 4. 自定义类型守卫
interface Cat {
  meow(): void;
}

interface Dog {
  bark(): void;
}

// 类型谓词：返回类型是 pet is Cat
function isCat(pet: Cat | Dog): pet is Cat {
  return (pet as Cat).meow !== undefined;
}

function makeSound(pet: Cat | Dog) {
  if (isCat(pet)) {
    pet.meow();  // pet 被收窄为 Cat
  } else {
    pet.bark();  // pet 被收窄为 Dog
  }
}

// 5. 真值收窄
function printLength(str: string | null | undefined) {
  if (str) {
    // str 被收窄为 string
    console.log(str.length);
  }
}

// 6. 相等性收窄
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // x 和 y 都被收窄为 string（唯一可能相等的类型）
    console.log(x.toUpperCase());
    console.log(y.toLowerCase());
  }
}
```

### 可辨识联合（Discriminated Unions）

```typescript
// 使用共同的字面量属性来区分联合类型成员

// 1. 基本可辨识联合
interface Circle {
  kind: "circle";  // 辨识属性
  radius: number;
}

interface Rectangle {
  kind: "rectangle";  // 辨识属性
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";  // 辨识属性
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // shape 被收窄为 Circle
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // shape 被收窄为 Rectangle
      return shape.width * shape.height;
    case "triangle":
      // shape 被收窄为 Triangle
      return (shape.base * shape.height) / 2;
  }
}

// 2. 状态机模式
interface IdleState {
  status: "idle";
}

interface LoadingState {
  status: "loading";
  progress: number;
}

interface SuccessState {
  status: "success";
  data: unknown;
}

interface ErrorState {
  status: "error";
  error: Error;
}

type RequestState = IdleState | LoadingState | SuccessState | ErrorState;

function handleRequest(state: RequestState) {
  switch (state.status) {
    case "idle":
      console.log("Ready to start");
      break;
    case "loading":
      console.log(`Loading: ${state.progress}%`);
      break;
    case "success":
      console.log("Data received:", state.data);
      break;
    case "error":
      console.log("Error:", state.error.message);
      break;
  }
}

// 3. 穷尽性检查
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function getShapeDescription(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      return `Circle with radius ${shape.radius}`;
    case "rectangle":
      return `Rectangle ${shape.width}x${shape.height}`;
    case "triangle":
      return `Triangle with base ${shape.base}`;
    default:
      // 如果添加了新的 Shape 类型但忘记处理，这里会报错
      return assertNever(shape);
  }
}

// 4. Redux Action 模式
interface AddTodoAction {
  type: "ADD_TODO";
  payload: {
    id: number;
    text: string;
  };
}

interface ToggleTodoAction {
  type: "TOGGLE_TODO";
  payload: {
    id: number;
  };
}

interface RemoveTodoAction {
  type: "REMOVE_TODO";
  payload: {
    id: number;
  };
}

type TodoAction = AddTodoAction | ToggleTodoAction | RemoveTodoAction;

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function todoReducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case "ADD_TODO":
      return [
        ...state,
        {
          id: action.payload.id,
          text: action.payload.text,
          completed: false
        }
      ];
    case "TOGGLE_TODO":
      return state.map(todo =>
        todo.id === action.payload.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    case "REMOVE_TODO":
      return state.filter(todo => todo.id !== action.payload.id);
  }
}
```

### 高级组合模式

```typescript
// 1. 混合使用联合和交叉类型
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fetchUser(id: number): Result<{ name: string; email: string }> {
  if (id > 0) {
    return {
      success: true,
      data: { name: "Alice", email: "alice@example.com" }
    };
  }
  return {
    success: false,
    error: "Invalid user ID"
  };
}

const result = fetchUser(1);
if (result.success) {
  console.log(result.data.name);  // 类型安全
} else {
  console.log(result.error);
}

// 2. 条件类型与联合类型
type NonNullable<T> = T extends null | undefined ? never : T;

type T1 = NonNullable<string | null | undefined>;  // string
type T2 = NonNullable<string | number | null>;     // string | number

// 3. 映射类型与联合类型
type PartialByKeys<T, K extends keyof T> = {
  [P in K]?: T[P];
} & {
  [P in Exclude<keyof T, K>]: T[P];
};

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type UserWithOptionalContact = PartialByKeys<User, "email" | "age">;
// { id: number; name: string; email?: string; age?: number }

// 4. 泛型约束与交叉类型
function merge<T extends object, U extends object>(
  obj1: T,
  obj2: U
): T & U {
  return { ...obj1, ...obj2 };
}

const merged = merge(
  { name: "Alice" },
  { age: 30 }
);
// merged: { name: string } & { age: number }

// 5. 联合类型到交叉类型的转换
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends
  ((k: infer I) => void) ? I : never;

type Union = { a: string } | { b: number } | { c: boolean };
type Intersection = UnionToIntersection<Union>;
// Intersection = { a: string } & { b: number } & { c: boolean }
```

## 最佳实践

### 优先使用可辨识联合

```typescript
// 推荐：使用可辨识联合
interface Dog {
  type: "dog";
  bark(): void;
}

interface Cat {
  type: "cat";
  meow(): void;
}

type Animal = Dog | Cat;

function handleAnimal(animal: Animal) {
  switch (animal.type) {
    case "dog":
      animal.bark();
      break;
    case "cat":
      animal.meow();
      break;
  }
}

// 不推荐：使用可选属性模拟联合
interface AnimalBad {
  type: "dog" | "cat";
  bark?: () => void;  // 可选
  meow?: () => void;  // 可选
}
// 缺点：无法保证 dog 一定有 bark，cat 一定有 meow
```

### 使用穷尽性检查

```typescript
type Status = "pending" | "approved" | "rejected";

function getStatusMessage(status: Status): string {
  switch (status) {
    case "pending":
      return "Waiting for review";
    case "approved":
      return "Request approved";
    case "rejected":
      return "Request rejected";
    default:
      // 确保所有情况都被处理
      const _exhaustive: never = status;
      return _exhaustive;
  }
}
```

### 合理使用类型别名

```typescript
// 为复杂的联合/交叉类型创建有意义的别名
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONArray
  | JSONObject;

interface JSONArray extends Array<JSONValue> {}
interface JSONObject {
  [key: string]: JSONValue;
}

// 而不是到处使用内联类型
function parse(json: string): JSONValue {
  return JSON.parse(json);
}
```

### 避免过深的嵌套

```typescript
// 不推荐：过深的嵌套
type Complex = (A | B) & (C | D) & (E | F);

// 推荐：分步定义
type AB = A | B;
type CD = C | D;
type EF = E | F;
type Combined = AB & CD & EF;
```

### 使用类型守卫函数

```typescript
// 将类型检查逻辑封装为可重用的函数
interface ApiError {
  code: number;
  message: string;
}

interface ApiSuccess<T> {
  data: T;
}

type ApiResponse<T> = ApiError | ApiSuccess<T>;

function isApiError<T>(response: ApiResponse<T>): response is ApiError {
  return "code" in response && "message" in response;
}

function handleResponse<T>(response: ApiResponse<T>) {
  if (isApiError(response)) {
    console.error(`Error ${response.code}: ${response.message}`);
  } else {
    console.log("Success:", response.data);
  }
}
```

## 常见陷阱

### 联合类型的属性访问错误

```typescript
type StringOrNumber = string | number;

function processValue(value: StringOrNumber) {
  // 错误示例
  // console.log(value.length);  // Error: number 没有 length

  // 正确示例：先进行类型收窄
  if (typeof value === "string") {
    console.log(value.length);
  }
}
```

### 交叉类型的冲突

```typescript
interface A {
  prop: string;
}

interface B {
  prop: number;
}

type AB = A & B;
// AB.prop 的类型是 never（string & number = never）

// 解决方案：使用泛型或重新设计类型
interface BaseWithProp<T> {
  prop: T;
}

type AWithGeneric = BaseWithProp<string>;
type BWithGeneric = BaseWithProp<number>;
```

### 忽略可辨识联合的穷尽性

```typescript
type Shape = Circle | Rectangle;

function getArea(shape: Shape) {
  if (shape.kind === "circle") {
    return Math.PI * shape.radius ** 2;
  }
  // 缺少 rectangle 的处理
  // 如果后续添加新类型，编译器不会警告
}

// 正确做法：使用 switch 和穷尽性检查
function getAreaSafe(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    default:
      const _exhaustive: never = shape;
      throw new Error(`Unhandled shape: ${_exhaustive}`);
  }
}
```

### 分布式条件类型的意外行为

```typescript
type ToArray<T> = T extends any ? T[] : never;

// 联合类型会分布
type Result = ToArray<string | number>;
// Result = string[] | number[]（不是 (string | number)[]）

// 如果需要非分布行为，包裹在元组中
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type ResultNonDist = ToArrayNonDist<string | number>;
// ResultNonDist = (string | number)[]
```

### 类型守卫的作用域问题

```typescript
type Pet = { type: "cat"; meow(): void } | { type: "dog"; bark(): void };

function handlePet(pet: Pet) {
  if (pet.type === "cat") {
    pet.meow();  // 正确

    setTimeout(() => {
      // pet.meow();  // 错误！在回调中类型收窄失效
      // 解决方案：在闭包外保存收窄后的引用
    }, 1000);
  }
}

// 正确做法
function handlePetCorrect(pet: Pet) {
  if (pet.type === "cat") {
    const cat = pet;  // 保存收窄后的类型
    setTimeout(() => {
      cat.meow();  // 正确
    }, 1000);
  }
}
```

## 性能考量

### 编译时性能

1. **简化复杂类型**：过于复杂的联合/交叉类型会增加编译时间

```typescript
// 避免过于复杂的类型计算
type TooComplex =
  | Type1 & Type2 & Type3
  | Type4 & Type5 & Type6
  | Type7 & Type8 & Type9;

// 考虑简化或分解
```

2. **限制联合类型的成员数量**：大量成员会影响类型检查性能

```typescript
// 不推荐：过多的联合成员
type AllHTMLElements =
  | HTMLDivElement
  | HTMLSpanElement
  | HTMLInputElement
  // ... 100+ 更多

// 推荐：使用基类或泛型
type HTMLElements = HTMLElement;
```

### 运行时性能

1. **类型收窄的成本**：运行时的类型检查有性能开销

```typescript
// 频繁调用的函数中，考虑使用可辨识联合而非 typeof
// typeof 检查
function processTypeof(value: string | number) {
  if (typeof value === "string") {
    // ...
  }
}

// 可辨识联合（通常更快）
function processDiscriminated(
  value: { type: "string"; value: string } | { type: "number"; value: number }
) {
  if (value.type === "string") {
    // ...
  }
}
```

2. **避免不必要的类型守卫**

```typescript
// 如果能在编译时确定类型，就不需要运行时检查
function process(value: string) {
  // 不需要 typeof 检查
  console.log(value.length);
}
```

## 实战场景

### 场景 1：API 响应处理

```typescript
// 定义 API 响应类型
interface SuccessResponse<T> {
  status: "success";
  data: T;
  timestamp: number;
}

interface ErrorResponse {
  status: "error";
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: number;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// API 客户端
async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        error: {
          code: `HTTP_${response.status}`,
          message: data.message || "Unknown error"
        },
        timestamp: Date.now()
      };
    }

    return {
      status: "success",
      data,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      status: "error",
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network error"
      },
      timestamp: Date.now()
    };
  }
}

// 使用示例
interface User {
  id: number;
  name: string;
  email: string;
}

async function getUser(id: number) {
  const response = await fetchData<User>(`/api/users/${id}`);

  if (response.status === "success") {
    console.log(`User: ${response.data.name}`);
    return response.data;
  } else {
    console.error(`Error: ${response.error.message}`);
    throw new Error(response.error.message);
  }
}
```

### 场景 2：表单验证

```typescript
// 验证结果类型
type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

// 字段验证器类型
type Validator<T> = (value: T) => ValidationResult;

// 创建验证器
const required: Validator<string> = (value) => {
  if (!value.trim()) {
    return { valid: false, errors: ["This field is required"] };
  }
  return { valid: true };
};

const minLength = (min: number): Validator<string> => (value) => {
  if (value.length < min) {
    return { valid: false, errors: [`Minimum length is ${min}`] };
  }
  return { valid: true };
};

const email: Validator<string> = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return { valid: false, errors: ["Invalid email format"] };
  }
  return { valid: true };
};

// 组合验证器
function combine<T>(...validators: Validator<T>[]): Validator<T> {
  return (value: T) => {
    const errors: string[] = [];

    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    return errors.length > 0
      ? { valid: false, errors }
      : { valid: true };
  };
}

// 表单字段类型
interface FormField<T> {
  value: T;
  validator: Validator<T>;
}

// 表单验证
function validateForm<T extends Record<string, FormField<any>>>(
  form: T
): { [K in keyof T]: ValidationResult } {
  const results = {} as { [K in keyof T]: ValidationResult };

  for (const key in form) {
    const field = form[key];
    results[key] = field.validator(field.value);
  }

  return results;
}

// 使用示例
const registrationForm = {
  username: {
    value: "john",
    validator: combine(required, minLength(3))
  },
  email: {
    value: "john@example.com",
    validator: combine(required, email)
  },
  password: {
    value: "123456",
    validator: combine(required, minLength(8))
  }
};

const validationResults = validateForm(registrationForm);
```

### 场景 3：状态管理

```typescript
// 异步操作状态
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

// 创建异步状态 hook（概念示例）
function useAsyncState<T>() {
  let state: AsyncState<T> = { status: "idle" };

  return {
    getState: () => state,
    setIdle: () => { state = { status: "idle" }; },
    setLoading: () => { state = { status: "loading" }; },
    setSuccess: (data: T) => { state = { status: "success", data }; },
    setError: (error: Error) => { state = { status: "error", error }; }
  };
}

// 渲染函数
function renderAsyncState<T>(
  state: AsyncState<T>,
  render: {
    idle: () => string;
    loading: () => string;
    success: (data: T) => string;
    error: (error: Error) => string;
  }
): string {
  switch (state.status) {
    case "idle":
      return render.idle();
    case "loading":
      return render.loading();
    case "success":
      return render.success(state.data);
    case "error":
      return render.error(state.error);
  }
}

// 使用示例
const userState: AsyncState<User> = {
  status: "success",
  data: { id: 1, name: "Alice", email: "alice@example.com" }
};

const output = renderAsyncState(userState, {
  idle: () => "Click to load",
  loading: () => "Loading...",
  success: (user) => `Hello, ${user.name}!`,
  error: (err) => `Error: ${err.message}`
});
```

### 场景 4：插件系统

```typescript
// 插件接口
interface BasePlugin {
  name: string;
  version: string;
}

interface LoggerPlugin extends BasePlugin {
  type: "logger";
  log: (message: string) => void;
  level: "debug" | "info" | "warn" | "error";
}

interface StoragePlugin extends BasePlugin {
  type: "storage";
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
}

interface AnalyticsPlugin extends BasePlugin {
  type: "analytics";
  track: (event: string, data: Record<string, unknown>) => void;
}

type Plugin = LoggerPlugin | StoragePlugin | AnalyticsPlugin;

// 插件管理器
class PluginManager {
  private plugins: Plugin[] = [];

  register(plugin: Plugin): void {
    this.plugins.push(plugin);
  }

  getPlugin<T extends Plugin["type"]>(
    type: T
  ): Extract<Plugin, { type: T }> | undefined {
    return this.plugins.find(
      (p): p is Extract<Plugin, { type: T }> => p.type === type
    );
  }

  getAllPlugins(): Plugin[] {
    return [...this.plugins];
  }
}

// 使用示例
const manager = new PluginManager();

manager.register({
  name: "ConsoleLogger",
  version: "1.0.0",
  type: "logger",
  log: console.log,
  level: "info"
});

const logger = manager.getPlugin("logger");
if (logger) {
  logger.log("Hello from plugin!");  // 类型安全
}
```

## 面试要点

### 联合类型和交叉类型的区别是什么？

**参考答案**：
- 联合类型（`|`）表示"或"的关系，值可以是其中任意一种类型
- 交叉类型（`&`）表示"且"的关系，值必须同时满足所有类型
- 联合类型访问属性时只能访问共有成员
- 交叉类型访问属性时可以访问所有成员

### 什么是可辨识联合？如何实现？

**参考答案**：
可辨识联合是一种特殊的联合类型模式，其中每个成员都有一个共同的字面量属性（辨识属性）。通过检查这个属性，TypeScript 可以自动收窄类型。

```typescript
interface Circle { kind: "circle"; radius: number; }
interface Square { kind: "square"; side: number; }
type Shape = Circle | Square;

function area(shape: Shape) {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.side ** 2;
  }
}
```

### TypeScript 中有哪些类型收窄的方法？

**参考答案**：
1. `typeof` 守卫：用于原始类型
2. `instanceof` 守卫：用于类实例
3. `in` 操作符：检查属性存在
4. 可辨识联合：使用字面量辨识属性
5. 自定义类型守卫：使用 `is` 关键字
6. 真值收窄：利用 JavaScript 真值判断
7. 相等性收窄：使用 `===` 或 `!==`

### 交叉类型中属性冲突如何处理？

**参考答案**：
当交叉类型中相同属性有不同类型时，该属性的类型会变成这些类型的交叉类型。如果交叉后得到 `never`，则该属性无法赋值。

```typescript
interface A { prop: string; }
interface B { prop: number; }
type AB = A & B;  // prop 类型为 string & number = never
```

解决方案：使用泛型、重新设计类型结构，或使用类型断言。

### 如何实现穷尽性检查？

**参考答案**：
使用 `never` 类型进行穷尽性检查，确保所有联合类型成员都被处理：

```typescript
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function handle(value: "a" | "b" | "c") {
  switch (value) {
    case "a": return "A";
    case "b": return "B";
    case "c": return "C";
    default: return assertNever(value);
  }
}
```

### 分布式条件类型是什么？如何避免？

**参考答案**：
当条件类型作用于联合类型时，会分布到每个成员上分别计算，然后将结果联合起来。

```typescript
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>;  // string[] | number[]
```

避免分布行为：将类型参数包裹在元组中：

```typescript
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type Result = ToArrayNonDist<string | number>;  // (string | number)[]
```

## 延伸阅读

### 官方文档

- [TypeScript Handbook - Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [TypeScript Handbook - Intersection Types](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)
- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

### 深度学习资源

- [TypeScript Deep Dive - 联合类型](https://basarat.gitbook.io/typescript/type-system/discriminated-unions)
- [Effective TypeScript](https://effectivetypescript.com/) - Dan Vanderkam
- [Programming TypeScript](https://www.oreilly.com/library/view/programming-typescript/9781492037644/) - Boris Cherny

### 相关主题

- [TypeScript 泛型](/typescript/generics) - 了解泛型与联合/交叉类型的结合使用
- [TypeScript 高级类型](/typescript/advanced-types) - 深入学习条件类型、映射类型等
- [TypeScript 类型守卫](/typescript/type-guards) - 掌握各种类型收窄技术
- [TypeScript 工具类型](/typescript/utility-types) - 学习内置的类型操作工具
