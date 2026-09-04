---
title: TypeScript 工具类型
description: 掌握 TypeScript 内置工具类型：Partial、Pick、Omit、Record 等
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - 工具类型
  - Partial
  - Pick
status: imported
origin: old/src/content/docs/typescript/utility-types.zh.md
divergence: 0.148
issues: []
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 4
  lastUpdated: 2026-01-07
---

TypeScript 提供了一系列内置的工具类型（Utility Types），用于对现有类型进行转换和操作。这些工具类型大大简化了类型定义的工作，让我们能够更灵活地处理复杂的类型场景。

## 属性修饰符工具类型

### Partial<T>

将类型 `T` 的所有属性变为可选属性。

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// 所有属性都变为可选
type PartialUser = Partial<User>;
// 等价于:
// {
//   id?: number;
//   name?: string;
//   email?: string;
//   age?: number;
// }

// 实际应用：更新用户信息
function updateUser(userId: number, updates: Partial<User>) {
  // 可以只传递需要更新的字段
  console.log(`更新用户 ${userId}:`, updates);
}

updateUser(1, { name: "张三" }); // 只更新名字
updateUser(2, { email: "lisi@example.com", age: 25 }); // 更新多个字段
```

**实现原理：**

```typescript
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};
```

### Required<T>

与 `Partial` 相反，将类型 `T` 的所有属性变为必需属性。

```typescript
interface Config {
  host?: string;
  port?: number;
  timeout?: number;
}

// 所有属性都变为必需
type RequiredConfig = Required<Config>;
// 等价于:
// {
//   host: string;
//   port: number;
//   timeout: number;
// }

// 实际应用：验证配置完整性
function validateConfig(config: Required<Config>): boolean {
  // 确保所有配置项都存在
  return config.host.length > 0 && config.port > 0 && config.timeout > 0;
}

const fullConfig: Required<Config> = {
  host: "localhost",
  port: 3000,
  timeout: 5000
};

validateConfig(fullConfig); // OK
```

**实现原理：**

```typescript
type MyRequired<T> = {
  [P in keyof T]-?: T[P];
};
```

### Readonly<T>

将类型 `T` 的所有属性变为只读属性。

```typescript
interface Point {
  x: number;
  y: number;
}

const point: Readonly<Point> = { x: 10, y: 20 };

// point.x = 30; // 错误：无法分配到 "x" ，因为它是只读属性

// 实际应用：创建不可变对象
function createImmutableState<T>(initialState: T): Readonly<T> {
  return Object.freeze(initialState);
}

const state = createImmutableState({ count: 0, name: "计数器" });
// state.count = 1; // 错误：无法修改只读属性
```

**实现原理：**

```typescript
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

### 组合使用

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
}

// 部分更新且只读
type ReadonlyPartialProduct = Readonly<Partial<Product>>;

// 全部必需且只读
type ImmutableProduct = Readonly<Required<Product>>;

const productUpdate: ReadonlyPartialProduct = { price: 99.99 };
// productUpdate.price = 88.88; // 错误：只读属性

const completeProduct: ImmutableProduct = {
  id: 1,
  name: "笔记本电脑",
  price: 5999,
  description: "高性能办公本" // 必须提供
};
```

## 属性选择工具类型

### Pick<T, K>

从类型 `T` 中选择一组属性 `K` 来构造新类型。

```typescript
interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

// 只选择需要的属性
type ArticlePreview = Pick<Article, "id" | "title" | "author" | "createdAt">;
// 等价于:
// {
//   id: number;
//   title: string;
//   author: string;
//   createdAt: Date;
// }

// 实际应用：API 响应类型
function getArticlePreviews(): ArticlePreview[] {
  return [
    {
      id: 1,
      title: "TypeScript 入门",
      author: "张三",
      createdAt: new Date()
    }
  ];
}

// 选择单个属性
type ArticleId = Pick<Article, "id">;
```

**实现原理：**

```typescript
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

### Omit<T, K>

从类型 `T` 中排除一组属性 `K` 来构造新类型。

```typescript
interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  createdAt: Date;
}

// 排除敏感信息
type PublicUser = Omit<User, "password">;
// 等价于:
// {
//   id: number;
//   username: string;
//   email: string;
//   createdAt: Date;
// }

// 排除多个属性
type UserCredentials = Omit<User, "id" | "createdAt">;

// 实际应用：API 响应
function getUserProfile(userId: number): PublicUser {
  return {
    id: userId,
    username: "zhangsan",
    email: "zhangsan@example.com",
    createdAt: new Date()
    // password 被排除
  };
}

// 创建用户时排除自动生成的字段
type CreateUserInput = Omit<User, "id" | "createdAt">;

const newUser: CreateUserInput = {
  username: "lisi",
  password: "secret123",
  email: "lisi@example.com"
};
```

**实现原理：**

```typescript
type MyOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

### Record<K, T>

构造一个对象类型，其属性键为 `K`，属性值为 `T`。

```typescript
// 创建字符串到数字的映射
type PageNumbers = Record<string, number>;

const pages: PageNumbers = {
  home: 1,
  about: 2,
  contact: 3
};

// 使用联合类型作为键
type Role = "admin" | "user" | "guest";
type Permissions = Record<Role, string[]>;

const permissions: Permissions = {
  admin: ["read", "write", "delete"],
  user: ["read", "write"],
  guest: ["read"]
};

// 实际应用：多语言支持
type Language = "zh" | "en" | "ja";
type Translations = Record<Language, Record<string, string>>;

const translations: Translations = {
  zh: {
    greeting: "你好",
    farewell: "再见"
  },
  en: {
    greeting: "Hello",
    farewell: "Goodbye"
  },
  ja: {
    greeting: "こんにちは",
    farewell: "さようなら"
  }
};

// 复杂对象映射
type ProductId = string;
type ProductDetails = Record<ProductId, {
  name: string;
  price: number;
  stock: number;
}>;

const products: ProductDetails = {
  "prod-001": { name: "键盘", price: 299, stock: 50 },
  "prod-002": { name: "鼠标", price: 99, stock: 100 }
};
```

**实现原理：**

```typescript
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};
```

## 联合类型工具

### Exclude<T, U>

从类型 `T` 中排除可以赋值给 `U` 的类型。

```typescript
type AllColors = "red" | "blue" | "green" | "yellow" | "black";
type PrimaryColors = "red" | "blue" | "yellow";

// 排除主要颜色，得到次要颜色
type SecondaryColors = Exclude<AllColors, PrimaryColors>;
// 结果: "green" | "black"

// 实际应用：过滤类型
type NumericTypes = string | number | boolean | Date;
type NonNumeric = Exclude<NumericTypes, number>;
// 结果: string | boolean | Date

// 排除 null 和 undefined
type NullableString = string | null | undefined;
type NonNullableString = Exclude<NullableString, null | undefined>;
// 结果: string

// 复杂示例：事件过滤
type MouseEvent = "click" | "dblclick" | "mousedown" | "mouseup";
type KeyboardEvent = "keydown" | "keyup" | "keypress";
type AllEvents = MouseEvent | KeyboardEvent;

type OnlyMouseEvents = Exclude<AllEvents, KeyboardEvent>;
// 结果: "click" | "dblclick" | "mousedown" | "mouseup"
```

**实现原理：**

```typescript
type MyExclude<T, U> = T extends U ? never : T;
```

### Extract<T, U>

从类型 `T` 中提取可以赋值给 `U` 的类型。

```typescript
type AllTypes = string | number | boolean | Date | null;
type PrimitiveTypes = string | number | boolean;

// 提取原始类型
type ExtractedPrimitives = Extract<AllTypes, PrimitiveTypes>;
// 结果: string | number | boolean

// 实际应用：提取特定类型
type MixedValues = "success" | "error" | 404 | 500 | true | false;
type StringStatuses = Extract<MixedValues, string>;
// 结果: "success" | "error"

type NumberCodes = Extract<MixedValues, number>;
// 结果: 404 | 500

// 函数类型提取
type Functions = ((x: number) => void) | ((x: string) => void) | string | number;
type OnlyFunctions = Extract<Functions, Function>;
// 结果: ((x: number) => void) | ((x: string) => void)
```

**实现原理：**

```typescript
type MyExtract<T, U> = T extends U ? T : never;
```

### NonNullable<T>

从类型 `T` 中排除 `null` 和 `undefined`。

```typescript
type NullableValue = string | number | null | undefined;
type NonNullValue = NonNullable<NullableValue>;
// 结果: string | number

// 实际应用：确保非空值
function processValue(value: NonNullable<string | null | undefined>) {
  // 可以安全地使用 value，不需要检查 null/undefined
  console.log(value.toUpperCase());
}

// processValue(null); // 错误
processValue("hello"); // OK

// 数组过滤
type MaybeUsers = (User | null | undefined)[];
type DefiniteUsers = NonNullable<MaybeUsers[number]>[];

// 与 Promise 结合
type ApiResponse<T> = Promise<T | null>;
type RequiredApiResponse<T> = Promise<NonNullable<T>>;
```

**实现原理：**

```typescript
type MyNonNullable<T> = T extends null | undefined ? never : T;
```

## 函数相关工具类型

### ReturnType<T>

获取函数类型 `T` 的返回值类型。

```typescript
// 简单函数
function getUserById(id: number) {
  return {
    id,
    name: "张三",
    email: "zhangsan@example.com"
  };
}

type User = ReturnType<typeof getUserById>;
// 结果: { id: number; name: string; email: string; }

// 异步函数
async function fetchData() {
  return { data: [1, 2, 3], total: 3 };
}

type FetchResult = ReturnType<typeof fetchData>;
// 结果: Promise<{ data: number[]; total: number; }>

// 提取 Promise 内部类型
type UnwrappedFetchResult = Awaited<ReturnType<typeof fetchData>>;
// 结果: { data: number[]; total: number; }

// 实际应用：类型推断
class ApiService {
  getUsers() {
    return [{ id: 1, name: "用户1" }];
  }

  getProducts() {
    return [{ id: 1, name: "产品1", price: 100 }];
  }
}

type Users = ReturnType<ApiService["getUsers"]>;
type Products = ReturnType<ApiService["getProducts"]>;

// 高阶函数
function createCalculator() {
  return {
    add: (a: number, b: number) => a + b,
    subtract: (a: number, b: number) => a - b
  };
}

type Calculator = ReturnType<typeof createCalculator>;
// 结果: { add: (a: number, b: number) => number; subtract: (a: number, b: number) => number; }
```

**实现原理：**

```typescript
type MyReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
```

### Parameters<T>

获取函数类型 `T` 的参数类型组成的元组。

```typescript
function createUser(name: string, age: number, email: string) {
  return { name, age, email };
}

type CreateUserParams = Parameters<typeof createUser>;
// 结果: [name: string, age: number, email: string]

// 使用参数类型
function logCreateUser(...args: CreateUserParams) {
  console.log("创建用户，参数:", args);
  return createUser(...args);
}

// 实际应用：包装函数
type ApiFunction = (endpoint: string, options?: RequestInit) => Promise<Response>;
type ApiParams = Parameters<ApiFunction>;

function apiWithLogging(...args: ApiParams) {
  console.log("API 调用:", args[0]);
  // 实际调用 API
}

// 提取单个参数类型
type FirstParam = Parameters<typeof createUser>[0]; // string
type SecondParam = Parameters<typeof createUser>[1]; // number

// 复杂函数
function complexFunction(
  user: { id: number; name: string },
  options: { timeout?: number; retry?: boolean }
) {
  // ...
}

type ComplexParams = Parameters<typeof complexFunction>;
// 结果: [user: { id: number; name: string }, options: { timeout?: number; retry?: boolean }]
```

**实现原理：**

```typescript
type MyParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
```

### ConstructorParameters<T>

获取构造函数类型 `T` 的参数类型组成的元组。

```typescript
class Person {
  constructor(public name: string, public age: number) {}
}

type PersonParams = ConstructorParameters<typeof Person>;
// 结果: [name: string, age: number]

// 实际应用：工厂函数
function createPerson(...args: ConstructorParameters<typeof Person>) {
  return new Person(...args);
}

const person = createPerson("李四", 30);

// 内置类型
type DateParams = ConstructorParameters<typeof Date>;
// 结果: [value: string | number | Date] | []

type ErrorParams = ConstructorParameters<typeof Error>;
// 结果: [message?: string]
```

### InstanceType<T>

获取构造函数类型 `T` 的实例类型。

```typescript
class Database {
  constructor(public connectionString: string) {}

  query(sql: string) {
    return [];
  }
}

type DatabaseInstance = InstanceType<typeof Database>;
// 结果: Database

// 实际应用：依赖注入
function createService(DatabaseClass: typeof Database, connectionString: string): InstanceType<typeof Database> {
  return new DatabaseClass(connectionString);
}

const db = createService(Database, "mongodb://localhost");

// 泛型类
class Container<T> {
  constructor(public value: T) {}
}

type StringContainer = InstanceType<typeof Container<string>>;
// 错误：需要具体的构造函数类型
```

## 字符串操作工具类型

TypeScript 4.1+ 引入了模板字面量类型相关的工具类型。

### Uppercase<T>

将字符串类型转换为大写。

```typescript
type Greeting = "hello world";
type LoudGreeting = Uppercase<Greeting>;
// 结果: "HELLO WORLD"

// 实际应用：HTTP 方法
type HttpMethod = "get" | "post" | "put" | "delete";
type HttpMethodUpper = Uppercase<HttpMethod>;
// 结果: "GET" | "POST" | "PUT" | "DELETE"

// 动态生成常量名
type EventName = "click" | "focus" | "blur";
type EventConstant = `ON_${Uppercase<EventName>}`;
// 结果: "ON_CLICK" | "ON_FOCUS" | "ON_BLUR"
```

### Lowercase<T>

将字符串类型转换为小写。

```typescript
type LoudGreeting = "HELLO WORLD";
type Greeting = Lowercase<LoudGreeting>;
// 结果: "hello world"

// 实际应用：规范化键名
type ConfigKeys = "API_URL" | "API_KEY" | "TIMEOUT";
type NormalizedKeys = Lowercase<ConfigKeys>;
// 结果: "api_url" | "api_key" | "timeout"
```

### Capitalize<T>

将字符串类型的首字母转换为大写。

```typescript
type Animal = "cat" | "dog" | "bird";
type CapitalizedAnimal = Capitalize<Animal>;
// 结果: "Cat" | "Dog" | "Bird"

// 实际应用：生成方法名
type Action = "create" | "update" | "delete";
type HandlerName = `on${Capitalize<Action>}`;
// 结果: "onCreate" | "onUpdate" | "onDelete"

interface EventHandlers {
  onCreate: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}
```

### Uncapitalize<T>

将字符串类型的首字母转换为小写。

```typescript
type CapitalizedAction = "Create" | "Update" | "Delete";
type Action = Uncapitalize<CapitalizedAction>;
// 结果: "create" | "update" | "delete"

// 实际应用：从类名生成实例名
type ClassName = "UserService" | "ProductService";
type InstanceName = Uncapitalize<ClassName>;
// 结果: "userService" | "productService"
```

## 自定义工具类型

基于 TypeScript 的映射类型和条件类型，我们可以创建自定义工具类型。

### 深度 Partial

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface Company {
  name: string;
  address: {
    street: string;
    city: string;
    country: {
      name: string;
      code: string;
    };
  };
  employees: number;
}

type PartialCompany = DeepPartial<Company>;
// 所有嵌套属性都是可选的

const update: PartialCompany = {
  address: {
    country: {
      code: "CN" // 只更新国家代码
    }
  }
};
```

### 深度 Readonly

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

const config: DeepReadonly<Company> = {
  name: "科技公司",
  address: {
    street: "中关村大街",
    city: "北京",
    country: {
      name: "中国",
      code: "CN"
    }
  },
  employees: 100
};

// config.address.city = "上海"; // 错误：只读属性
```

### 可空类型

```typescript
type Nullable<T> = T | null;
type Nullish<T> = T | null | undefined;

interface User {
  id: number;
  name: string;
  email: Nullable<string>; // string | null
  phone: Nullish<string>;  // string | null | undefined
}

const user: User = {
  id: 1,
  name: "张三",
  email: null,
  phone: undefined
};
```

### Promise 包装

```typescript
type Promisify<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? (...args: Parameters<T[P]>) => Promise<ReturnType<T[P]>>
    : T[P];
};

interface SyncAPI {
  getUser(id: number): User;
  deleteUser(id: number): boolean;
  count: number;
}

type AsyncAPI = Promisify<SyncAPI>;
// {
//   getUser(id: number): Promise<User>;
//   deleteUser(id: number): Promise<boolean>;
//   count: number;
// }
```

### 必需属性提取

```typescript
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

interface Mixed {
  required1: string;
  required2: number;
  optional1?: boolean;
  optional2?: Date;
}

type Required = RequiredKeys<Mixed>; // "required1" | "required2"
type Optional = OptionalKeys<Mixed>; // "optional1" | "optional2"
```

### 类型合并

```typescript
type Merge<T, U> = Omit<T, keyof U> & U;

interface DefaultConfig {
  timeout: number;
  retries: number;
  cache: boolean;
}

interface CustomConfig {
  timeout: string; // 覆盖为 string 类型
  logging: boolean; // 新增属性
}

type MergedConfig = Merge<DefaultConfig, CustomConfig>;
// {
//   retries: number;
//   cache: boolean;
//   timeout: string;  // 被覆盖
//   logging: boolean; // 新增
// }
```

### 函数参数覆盖

```typescript
type OverrideParameters<T extends (...args: any[]) => any, NewParams extends any[]> =
  (...args: NewParams) => ReturnType<T>;

function originalFunction(name: string, age: number): User {
  return { id: 1, name, age };
}

type NewFunction = OverrideParameters<typeof originalFunction, [config: { name: string; age: number }]>;

const newFunction: NewFunction = (config) => {
  return originalFunction(config.name, config.age);
};
```

### 键值对调

```typescript
type Reverse<T extends Record<string, string>> = {
  [P in T[keyof T]]: {
    [K in keyof T]: T[K] extends P ? K : never;
  }[keyof T];
};

type StatusCodes = {
  success: "200";
  notFound: "404";
  serverError: "500";
};

type CodeToStatus = Reverse<StatusCodes>;
// {
//   "200": "success";
//   "404": "notFound";
//   "500": "serverError";
// }

const codeMap: CodeToStatus = {
  "200": "success",
  "404": "notFound",
  "500": "serverError"
};
```

## 实战示例

### 表单处理

```typescript
interface UserForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  agreedToTerms: boolean;
}

// 表单值类型（所有字段可选，用于中间状态）
type FormValues = Partial<UserForm>;

// 表单错误类型
type FormErrors = Partial<Record<keyof UserForm, string>>;

// 提交数据（排除确认密码）
type SubmitData = Omit<UserForm, "confirmPassword">;

// 表单状态
interface FormState {
  values: FormValues;
  errors: FormErrors;
  touched: Partial<Record<keyof UserForm, boolean>>;
  isSubmitting: boolean;
}

// 使用示例
const formState: FormState = {
  values: {
    username: "zhangsan",
    email: "zhangsan@example.com"
  },
  errors: {
    password: "密码长度至少 8 位"
  },
  touched: {
    username: true,
    email: true,
    password: true
  },
  isSubmitting: false
};
```

### API 响应处理

```typescript
// 基础响应类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 分页数据
interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 用户列表响应
type UserListResponse = ApiResponse<PaginatedData<PublicUser>>;

// 用户详情响应
type UserDetailResponse = ApiResponse<User>;

// 错误响应（无 data 字段）
type ErrorResponse = Omit<ApiResponse<never>, "data">;

// 通用请求函数
async function request<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  return response.json();
}

// 类型安全的使用
const userList: UserListResponse = await request<PaginatedData<PublicUser>>("/api/users");
```

### 状态管理

```typescript
// 应用状态
interface AppState {
  user: User | null;
  theme: "light" | "dark";
  language: "zh" | "en";
  notifications: Notification[];
}

// 动作类型
type Action<T extends keyof AppState> = {
  type: `SET_${Uppercase<T>}`;
  payload: AppState[T];
};

// 所有可能的动作
type AppAction = {
  [K in keyof AppState]: Action<K>;
}[keyof AppState];

// 示例动作
const setUserAction: AppAction = {
  type: "SET_USER",
  payload: { id: 1, name: "张三", email: "zhangsan@example.com" }
};

const setThemeAction: AppAction = {
  type: "SET_THEME",
  payload: "dark"
};

// Reducer
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload };
    default:
      return state;
  }
}
```

### 数据库模型

```typescript
// 基础时间戳字段
interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// 软删除
interface SoftDelete {
  deletedAt: Date | null;
}

// 完整模型
interface Model extends Timestamps, SoftDelete {
  id: number;
}

// 创建输入（排除自动生成字段）
type CreateInput<T extends Model> = Omit<T, keyof Model>;

// 更新输入（所有字段可选，排除时间戳）
type UpdateInput<T extends Model> = Partial<Omit<T, keyof Timestamps | "id">>;

// 用户模型
interface UserModel extends Model {
  username: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
}

// 创建用户
const createUserInput: CreateInput<UserModel> = {
  username: "zhangsan",
  email: "zhangsan@example.com",
  passwordHash: "hashed_password",
  role: "user"
};

// 更新用户
const updateUserInput: UpdateInput<UserModel> = {
  email: "newemail@example.com",
  role: "admin"
};
```

## 最佳实践

### 组合使用工具类型

```typescript
// 创建灵活的类型变体
type FlexibleUser = Readonly<Partial<User>>;
type RequiredPublicUser = Required<PublicUser>;
type PartialUpdateUser = Partial<Omit<User, "id">>;
```

### 类型守卫结合工具类型

```typescript
function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

const maybeUser: User | null = getUser();

if (isNonNullable(maybeUser)) {
  // maybeUser 的类型是 User
  console.log(maybeUser.name);
}
```

### 泛型约束

```typescript
// 确保 T 是对象类型
type ObjectOnly<T extends object> = Readonly<T>;

// 确保 T 有特定属性
type WithId<T extends { id: any }> = T & { id: string };
```

### 避免过度使用

```typescript
// 不好：过度复杂
type OverlyComplex = Readonly<Partial<Required<Pick<User, "id" | "name">>>>;

// 好：清晰简洁
type UserIdName = Pick<User, "id" | "name">;
type PartialUserIdName = Partial<UserIdName>;
```

## 总结

TypeScript 工具类型是类型系统中强大的特性，它们能帮助我们：

1. **减少重复代码**：通过转换现有类型，避免手动定义相似的类型
2. **提高类型安全**：利用类型系统捕获更多潜在错误
3. **增强代码可维护性**：类型定义更加简洁和语义化
4. **提升开发效率**：自动推导类型，减少手动标注

掌握这些工具类型，能让你编写出更加健壮和优雅的 TypeScript 代码。建议在实际项目中多加练习，逐步形成使用工具类型的思维习惯。

## 相关资源

- [TypeScript 官方文档 - Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript 深入理解](https://jkchao.github.io/typescript-book-chinese/)
- [Type Challenges](https://github.com/type-challenges/type-challenges) - 类型体操练习
