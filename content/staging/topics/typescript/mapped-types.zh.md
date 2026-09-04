---
title: TypeScript 映射类型
description: 深入学习 TypeScript 映射类型，包括内置映射类型和自定义映射类型
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - 映射类型
  - 类型编程
status: imported
origin: old/src/content/docs/typescript/mapped-types.zh.md
divergence: 0.223
issues: []
legacy:
  category: TypeScript
  subcategory: 高级类型
  order: 12
  lastUpdated: 2026-01-07
---

映射类型（Mapped Types）是 TypeScript 类型系统中最强大的特性之一，它允许我们基于现有类型创建新类型，通过遍历类型的属性键并对其进行转换。这种能力使得类型定义更加灵活、可复用，是实现高级类型编程的基础。

## 映射类型基础语法

### 基本形式

映射类型的核心语法是使用 `in` 关键字遍历键的联合类型：

```typescript
type MappedType<T> = {
  [K in keyof T]: T[K];
};
```

这个基本形式包含三个关键部分：
- `K in keyof T`：遍历类型 `T` 的所有属性键
- `K`：当前遍历到的键
- `T[K]`：通过索引访问获取对应的值类型

```typescript
// 示例：创建一个与原类型相同的类型
interface User {
  id: number;
  name: string;
  email: string;
}

type CopyUser = {
  [K in keyof User]: User[K];
};
// 结果与 User 完全相同：
// {
//   id: number;
//   name: string;
//   email: string;
// }
```

### 使用泛型

映射类型通常与泛型结合使用，以创建可复用的类型工具：

```typescript
// 将类型的所有属性值变为 string
type Stringify<T> = {
  [K in keyof T]: string;
};

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

type StringifiedProduct = Stringify<Product>;
// 结果：
// {
//   id: string;
//   name: string;
//   price: string;
//   inStock: string;
// }
```

### 键的来源

映射类型中的键可以来自多种来源：

```typescript
// 来源 1：使用 keyof 从类型中提取
type FromKeyof<T> = {
  [K in keyof T]: T[K];
};

// 来源 2：使用字符串字面量联合类型
type StatusFlags = {
  [K in 'loading' | 'error' | 'success']: boolean;
};
// 结果：
// {
//   loading: boolean;
//   error: boolean;
//   success: boolean;
// }

// 来源 3：使用数字字面量联合类型
type Positions = {
  [K in 0 | 1 | 2]: string;
};
// 结果：
// {
//   0: string;
//   1: string;
//   2: string;
// }

// 来源 4：使用 symbol
declare const uniqueKey: unique symbol;
type SymbolKeyed = {
  [K in typeof uniqueKey]: string;
};
```

## 属性修饰符

映射类型支持添加或移除属性修饰符 `readonly` 和 `?`（可选）。

### 添加修饰符

```typescript
// 添加 readonly 修饰符
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

// 添加 ? 修饰符（可选）
type Partial<T> = {
  [K in keyof T]?: T[K];
};

// 同时添加两个修饰符
type ReadonlyPartial<T> = {
  readonly [K in keyof T]?: T[K];
};

interface Config {
  host: string;
  port: number;
}

type ImmutableConfig = Readonly<Config>;
// {
//   readonly host: string;
//   readonly port: number;
// }

type OptionalConfig = Partial<Config>;
// {
//   host?: string;
//   port?: number;
// }

type ImmutableOptionalConfig = ReadonlyPartial<Config>;
// {
//   readonly host?: string;
//   readonly port?: number;
// }
```

### 移除修饰符

使用 `-` 前缀可以移除修饰符：

```typescript
// 移除 readonly 修饰符
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

// 移除 ? 修饰符（必需）
type Required<T> = {
  [K in keyof T]-?: T[K];
};

// 同时移除两个修饰符
type MutableRequired<T> = {
  -readonly [K in keyof T]-?: T[K];
};

interface ReadonlyOptionalUser {
  readonly id?: number;
  readonly name?: string;
  readonly email?: string;
}

type EditableUser = Mutable<ReadonlyOptionalUser>;
// {
//   id?: number;
//   name?: string;
//   email?: string;
// }

type CompleteUser = Required<ReadonlyOptionalUser>;
// {
//   readonly id: number;
//   readonly name: string;
//   readonly email: string;
// }

type FullyEditableUser = MutableRequired<ReadonlyOptionalUser>;
// {
//   id: number;
//   name: string;
//   email: string;
// }
```

### 添加修饰符的显式语法

也可以使用 `+` 前缀显式添加修饰符：

```typescript
// 显式添加 readonly
type ExplicitReadonly<T> = {
  +readonly [K in keyof T]: T[K];
};

// 显式添加 ?
type ExplicitPartial<T> = {
  [K in keyof T]+?: T[K];
};

// 这两种写法与不带 + 的版本效果相同
// 但可以提高代码可读性，明确表示"添加"修饰符的意图
```

## 键重映射（Key Remapping）

TypeScript 4.1 引入了键重映射功能，使用 `as` 子句可以在映射过程中转换属性键。

### 基本键重映射

```typescript
// 为所有属性名添加前缀
type Prefixed<T, Prefix extends string> = {
  [K in keyof T as `${Prefix}${string & K}`]: T[K];
};

interface User {
  id: number;
  name: string;
}

type PrefixedUser = Prefixed<User, 'user_'>;
// 结果：
// {
//   user_id: number;
//   user_name: string;
// }
```

### 使用内置字符串类型转换

```typescript
// 将属性名转为大写
type UppercaseKeys<T> = {
  [K in keyof T as Uppercase<string & K>]: T[K];
};

// 将属性名转为小写
type LowercaseKeys<T> = {
  [K in keyof T as Lowercase<string & K>]: T[K];
};

// 将属性名首字母大写
type CapitalizeKeys<T> = {
  [K in keyof T as Capitalize<string & K>]: T[K];
};

interface ApiResponse {
  statusCode: number;
  responseBody: string;
  errorMessage: string;
}

type UppercaseResponse = UppercaseKeys<ApiResponse>;
// {
//   STATUSCODE: number;
//   RESPONSEBODY: string;
//   ERRORMESSAGE: string;
// }

type CapitalizedResponse = CapitalizeKeys<ApiResponse>;
// {
//   StatusCode: number;
//   ResponseBody: string;
//   ErrorMessage: string;
// }
```

### 生成 Getter 和 Setter

```typescript
// 生成 getter 方法类型
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

// 生成 setter 方法类型
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

// 合并 getter 和 setter
type Accessors<T> = Getters<T> & Setters<T>;

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// {
//   getName: () => string;
//   getAge: () => number;
// }

type PersonSetters = Setters<Person>;
// {
//   setName: (value: string) => void;
//   setAge: (value: number) => void;
// }

type PersonAccessors = Accessors<Person>;
// {
//   getName: () => string;
//   getAge: () => number;
//   setName: (value: string) => void;
//   setAge: (value: number) => void;
// }
```

### 事件处理器类型

```typescript
// 生成事件处理器类型
type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (
    oldValue: T[K],
    newValue: T[K]
  ) => void;
};

interface FormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

type FormEventHandlers = EventHandlers<FormData>;
// {
//   onUsernameChange: (oldValue: string, newValue: string) => void;
//   onPasswordChange: (oldValue: string, newValue: string) => void;
//   onRememberMeChange: (oldValue: boolean, newValue: boolean) => void;
// }
```

### 使用 never 过滤属性

当键重映射返回 `never` 时，该属性会被过滤掉：

```typescript
// 移除所有以下划线开头的属性
type PublicOnly<T> = {
  [K in keyof T as K extends `_${string}` ? never : K]: T[K];
};

interface InternalData {
  id: number;
  name: string;
  _cache: Map<string, any>;
  _metadata: object;
}

type PublicData = PublicOnly<InternalData>;
// {
//   id: number;
//   name: string;
// }

// 只保留字符串类型的属性
type StringPropsOnly<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface MixedTypes {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

type StringProps = StringPropsOnly<MixedTypes>;
// {
//   name: string;
//   email: string;
// }
```

### 基于值类型过滤属性

```typescript
// 保留特定类型的属性
type PickByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K];
};

// 排除特定类型的属性
type OmitByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? never : K]: T[K];
};

interface Entity {
  id: number;
  name: string;
  description: string;
  count: number;
  isActive: boolean;
  createdAt: Date;
}

type NumberProps = PickByType<Entity, number>;
// {
//   id: number;
//   count: number;
// }

type NonNumberProps = OmitByType<Entity, number>;
// {
//   name: string;
//   description: string;
//   isActive: boolean;
//   createdAt: Date;
// }

// 保留函数类型的属性
type MethodsOnly<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

interface Service {
  name: string;
  baseUrl: string;
  get: (url: string) => Promise<any>;
  post: (url: string, data: any) => Promise<any>;
  delete: (url: string) => Promise<void>;
}

type ServiceMethods = MethodsOnly<Service>;
// {
//   get: (url: string) => Promise<any>;
//   post: (url: string, data: any) => Promise<any>;
//   delete: (url: string) => Promise<void>;
// }
```

## TypeScript 内置映射类型

TypeScript 提供了多个基于映射类型实现的内置工具类型。

### Partial<T>

将所有属性变为可选：

```typescript
// 实现原理
type Partial<T> = {
  [K in keyof T]?: T[K];
};

// 使用示例
interface User {
  id: number;
  name: string;
  email: string;
}

function updateUser(id: number, updates: Partial<User>) {
  // updates 中的所有字段都是可选的
  console.log(`更新用户 ${id}:`, updates);
}

updateUser(1, { name: '新名字' }); // 只更新 name
updateUser(2, { email: 'new@email.com', name: '张三' }); // 更新多个字段
updateUser(3, {}); // 空更新也是合法的
```

### Required<T>

将所有属性变为必需：

```typescript
// 实现原理
type Required<T> = {
  [K in keyof T]-?: T[K];
};

// 使用示例
interface Options {
  host?: string;
  port?: number;
  timeout?: number;
}

function initServer(options: Required<Options>) {
  // 所有选项都必须提供
  console.log(`服务器启动于 ${options.host}:${options.port}`);
}

// initServer({ host: 'localhost' }); // 错误：缺少 port 和 timeout
initServer({ host: 'localhost', port: 3000, timeout: 5000 }); // 正确
```

### Readonly<T>

将所有属性变为只读：

```typescript
// 实现原理
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

// 使用示例
interface Point {
  x: number;
  y: number;
}

const origin: Readonly<Point> = { x: 0, y: 0 };
// origin.x = 10; // 错误：无法分配到 'x'，因为它是只读属性

// 常用于状态管理
interface AppState {
  user: User | null;
  isLoading: boolean;
}

function getState(): Readonly<AppState> {
  return {
    user: null,
    isLoading: false
  };
}

const state = getState();
// state.isLoading = true; // 错误：只读属性
```

### Pick<T, K>

从类型 T 中选取指定的属性：

```typescript
// 实现原理
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 使用示例
interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  publishedAt: Date;
  tags: string[];
}

// 文章列表只需要部分字段
type ArticlePreview = Pick<Article, 'id' | 'title' | 'author'>;
// {
//   id: number;
//   title: string;
//   author: string;
// }

function getArticlePreviews(): ArticlePreview[] {
  return [
    { id: 1, title: 'TypeScript 入门', author: '张三' },
    { id: 2, title: 'React 最佳实践', author: '李四' }
  ];
}
```

### Record<K, T>

构造一个属性键为 K、属性值为 T 的对象类型：

```typescript
// 实现原理
type Record<K extends keyof any, T> = {
  [P in K]: T;
};

// 使用示例
type Role = 'admin' | 'editor' | 'viewer';

// 每个角色对应一组权限
type Permissions = Record<Role, string[]>;

const rolePermissions: Permissions = {
  admin: ['create', 'read', 'update', 'delete'],
  editor: ['create', 'read', 'update'],
  viewer: ['read']
};

// 状态映射
type Status = 'pending' | 'approved' | 'rejected';
type StatusInfo = Record<Status, { label: string; color: string }>;

const statusConfig: StatusInfo = {
  pending: { label: '待审核', color: 'yellow' },
  approved: { label: '已通过', color: 'green' },
  rejected: { label: '已拒绝', color: 'red' }
};
```

### Omit<T, K>

从类型 T 中排除指定的属性：

```typescript
// 实现原理
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// 使用示例
interface User {
  id: number;
  name: string;
  password: string;
  email: string;
}

// 公开的用户信息（排除密码）
type PublicUser = Omit<User, 'password'>;
// {
//   id: number;
//   name: string;
//   email: string;
// }

// 创建用户时的输入（排除自动生成的 id）
type CreateUserInput = Omit<User, 'id'>;
// {
//   name: string;
//   password: string;
//   email: string;
// }

function createUser(input: CreateUserInput): User {
  return {
    id: Date.now(), // 自动生成 id
    ...input
  };
}
```

## 自定义映射类型

### 深度 Readonly

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
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

type ImmutableConfig = DeepReadonly<NestedConfig>;

const config: ImmutableConfig = {
  server: {
    host: 'localhost',
    port: 3000,
    ssl: {
      enabled: true,
      cert: '/path/to/cert'
    }
  },
  database: {
    url: 'mongodb://localhost'
  }
};

// config.server.ssl.enabled = false; // 错误：只读属性
```

### 深度 Partial

```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: {
      light: string;
      dark: string;
    };
  };
  fonts: {
    heading: string;
    body: string;
  };
}

// 合并主题配置
function mergeTheme(base: Theme, overrides: DeepPartial<Theme>): Theme {
  // 深度合并逻辑
  return { ...base, ...overrides } as Theme;
}

const customTheme: DeepPartial<Theme> = {
  colors: {
    primary: '#007bff',
    // 不需要提供所有嵌套属性
  }
};
```

### 可空类型

```typescript
// 使所有属性可为 null
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// 使所有属性可为 null 或 undefined
type Nullish<T> = {
  [K in keyof T]: T[K] | null | undefined;
};

interface FormFields {
  username: string;
  password: string;
  age: number;
}

type NullableForm = Nullable<FormFields>;
// {
//   username: string | null;
//   password: string | null;
//   age: number | null;
// }

// 表单初始状态
const initialForm: NullableForm = {
  username: null,
  password: null,
  age: null
};
```

### 属性值类型转换

```typescript
// 将所有属性包装为 Promise
type Promisify<T> = {
  [K in keyof T]: Promise<T[K]>;
};

// 将所有属性包装为数组
type Arrayify<T> = {
  [K in keyof T]: T[K][];
};

// 将所有属性包装为 getter 函数
type Functionify<T> = {
  [K in keyof T]: () => T[K];
};

interface Data {
  name: string;
  count: number;
}

type PromisedData = Promisify<Data>;
// {
//   name: Promise<string>;
//   count: Promise<number>;
// }

type ArrayData = Arrayify<Data>;
// {
//   name: string[];
//   count: number[];
// }

type FunctionData = Functionify<Data>;
// {
//   name: () => string;
//   count: () => number;
// }
```

### 条件映射类型

```typescript
// 根据值类型转换属性值
type ConditionalMap<T, From, To> = {
  [K in keyof T]: T[K] extends From ? To : T[K];
};

interface Mixed {
  id: number;
  name: string;
  items: string[];
  active: boolean;
}

// 将所有 string 类型转为 number
type StringToNumber = ConditionalMap<Mixed, string, number>;
// {
//   id: number;
//   name: number;        // 从 string 转为 number
//   items: string[];     // 保持不变（string[] 不是 string）
//   active: boolean;
// }

// 更复杂的条件：将数组类型展开
type UnwrapArrays<T> = {
  [K in keyof T]: T[K] extends (infer U)[] ? U : T[K];
};

type UnwrappedMixed = UnwrapArrays<Mixed>;
// {
//   id: number;
//   name: string;
//   items: string;  // 从 string[] 展开为 string
//   active: boolean;
// }
```

### 分离属性类型

```typescript
// 将必需属性和可选属性分离
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

type RequiredProps<T> = Pick<T, RequiredKeys<T>>;
type OptionalProps<T> = Pick<T, OptionalKeys<T>>;

interface UserProfile {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
}

type RequiredUserFields = RequiredProps<UserProfile>;
// { id: number; name: string; }

type OptionalUserFields = OptionalProps<UserProfile>;
// { email?: string; phone?: string; bio?: string; }

type ReqKeys = RequiredKeys<UserProfile>; // "id" | "name"
type OptKeys = OptionalKeys<UserProfile>; // "email" | "phone" | "bio"
```

## 高级模式与实战应用

### 类型安全的 API 客户端

```typescript
// API 端点定义
interface ApiEndpoints {
  '/users': {
    GET: { response: User[]; params: { page?: number; limit?: number } };
    POST: { response: User; body: Omit<User, 'id'> };
  };
  '/users/:id': {
    GET: { response: User; params: { id: string } };
    PUT: { response: User; params: { id: string }; body: Partial<User> };
    DELETE: { response: void; params: { id: string } };
  };
}

// 生成类型安全的请求方法
type ApiClient<T extends Record<string, Record<string, any>>> = {
  [Path in keyof T as Path extends string ? Path : never]: {
    [Method in keyof T[Path]]: T[Path][Method] extends {
      response: infer R;
      params?: infer P;
      body?: infer B;
    }
      ? B extends object
        ? (params: P, body: B) => Promise<R>
        : P extends object
        ? (params: P) => Promise<R>
        : () => Promise<R>
      : never;
  };
};

type Client = ApiClient<ApiEndpoints>;
// 自动生成类型安全的方法签名
```

### 表单字段验证

```typescript
// 验证规则类型
type ValidationRule<T> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
};

// 为表单类型生成验证规则类型
type FormValidation<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

// 验证错误类型
type FormErrors<T> = {
  [K in keyof T]?: string;
};

interface LoginForm {
  username: string;
  password: string;
  rememberMe: boolean;
}

const loginValidation: FormValidation<LoginForm> = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 20
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
  }
};

function validate<T extends object>(
  data: T,
  rules: FormValidation<T>
): FormErrors<T> {
  const errors: FormErrors<T> = {};
  // 验证逻辑...
  return errors;
}
```

### 状态管理 Action 类型

```typescript
// 状态定义
interface AppState {
  user: User | null;
  posts: Post[];
  settings: Settings;
  isLoading: boolean;
}

// 自动生成 Action 类型
type SetterActions<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: {
    type: `SET_${Uppercase<string & K>}`;
    payload: T[K];
  };
}[keyof T];

type AppAction = SetterActions<AppState>;
// 生成：
// | { type: 'SET_USER'; payload: User | null }
// | { type: 'SET_POSTS'; payload: Post[] }
// | { type: 'SET_SETTINGS'; payload: Settings }
// | { type: 'SET_ISLOADING'; payload: boolean }

// Reducer 类型
type Reducer<S, A extends { type: string; payload?: any }> = (
  state: S,
  action: A
) => S;

const reducer: Reducer<AppState, AppAction> = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_POSTS':
      return { ...state, posts: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_ISLOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};
```

### 数据库模型映射

```typescript
// 基础模型字段
interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 创建输入类型（排除自动生成的字段）
type CreateInput<T extends BaseModel> = Omit<T, keyof BaseModel>;

// 更新输入类型（所有字段可选，排除 id 和时间戳）
type UpdateInput<T extends BaseModel> = Partial<
  Omit<T, keyof BaseModel>
>;

// 查询结果类型（所有字段只读）
type QueryResult<T extends BaseModel> = Readonly<T>;

// 列表查询结果
type ListResult<T extends BaseModel> = {
  items: QueryResult<T>[];
  total: number;
  page: number;
  pageSize: number;
};

// 用户模型
interface UserModel extends BaseModel {
  email: string;
  name: string;
  role: 'admin' | 'user';
  passwordHash: string;
}

type CreateUserInput = CreateInput<UserModel>;
// { email: string; name: string; role: 'admin' | 'user'; passwordHash: string; }

type UpdateUserInput = UpdateInput<UserModel>;
// { email?: string; name?: string; role?: 'admin' | 'user'; passwordHash?: string; }

// 仓库接口
interface Repository<T extends BaseModel> {
  create(data: CreateInput<T>): Promise<QueryResult<T>>;
  findById(id: string): Promise<QueryResult<T> | null>;
  findAll(options?: { page?: number; pageSize?: number }): Promise<ListResult<T>>;
  update(id: string, data: UpdateInput<T>): Promise<QueryResult<T>>;
  delete(id: string): Promise<void>;
}

class UserRepository implements Repository<UserModel> {
  async create(data: CreateUserInput): Promise<QueryResult<UserModel>> {
    // 实现创建逻辑
    throw new Error('Not implemented');
  }
  // ... 其他方法实现
}
```

### 响应式状态包装

```typescript
// 观察者类型
type Observer<T> = (value: T) => void;

// 将对象属性转换为可观察属性
type Observable<T> = {
  [K in keyof T]: {
    get(): T[K];
    set(value: T[K]): void;
    subscribe(observer: Observer<T[K]>): () => void;
  };
};

interface State {
  count: number;
  message: string;
}

function createObservable<T extends object>(initial: T): Observable<T> {
  const values = { ...initial };
  const observers: { [K in keyof T]?: Set<Observer<T[K]>> } = {};

  const observable = {} as Observable<T>;

  for (const key of Object.keys(initial) as (keyof T)[]) {
    observable[key] = {
      get(): T[typeof key] {
        return values[key];
      },
      set(value: T[typeof key]): void {
        values[key] = value;
        observers[key]?.forEach(fn => fn(value));
      },
      subscribe(observer: Observer<T[typeof key]>): () => void {
        if (!observers[key]) {
          observers[key] = new Set();
        }
        observers[key]!.add(observer);
        return () => observers[key]!.delete(observer);
      }
    };
  }

  return observable;
}

// 使用示例
const state = createObservable<State>({ count: 0, message: '' });
state.count.subscribe(value => console.log('Count changed:', value));
state.count.set(1); // 触发订阅回调
```

### 多语言国际化类型

```typescript
type Language = 'zh' | 'en' | 'ja';

// 翻译键定义
interface TranslationKeys {
  'common.submit': string;
  'common.cancel': string;
  'user.welcome': string;
  'user.logout': string;
  'error.notFound': string;
  'error.serverError': string;
}

// 所有语言的翻译
type Translations = {
  [L in Language]: TranslationKeys;
};

// 带参数的翻译
type TranslationParams = {
  'user.welcome': { name: string };
  'error.validation': { field: string; rule: string };
};

// 翻译函数类型
type TranslateFunction = {
  // 无参数翻译
  <K extends Exclude<keyof TranslationKeys, keyof TranslationParams>>(
    key: K
  ): string;
  // 带参数翻译
  <K extends keyof TranslationParams>(
    key: K,
    params: TranslationParams[K]
  ): string;
};

const translations: Translations = {
  zh: {
    'common.submit': '提交',
    'common.cancel': '取消',
    'user.welcome': '欢迎',
    'user.logout': '退出登录',
    'error.notFound': '未找到',
    'error.serverError': '服务器错误'
  },
  en: {
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'user.welcome': 'Welcome',
    'user.logout': 'Logout',
    'error.notFound': 'Not Found',
    'error.serverError': 'Server Error'
  },
  ja: {
    'common.submit': '送信',
    'common.cancel': 'キャンセル',
    'user.welcome': 'ようこそ',
    'user.logout': 'ログアウト',
    'error.notFound': '見つかりません',
    'error.serverError': 'サーバーエラー'
  }
};
```

## 映射类型的类型推断

### 保持属性特征

TypeScript 的映射类型会尝试保持原始类型的属性特征：

```typescript
// 同态映射：保持可选性和只读性
type Homomorphic<T> = {
  [K in keyof T]: T[K];
};

interface Original {
  readonly id: number;
  name?: string;
  email: string;
}

type Copied = Homomorphic<Original>;
// {
//   readonly id: number;  // 保持 readonly
//   name?: string;        // 保持 optional
//   email: string;
// }
```

### 非同态映射

当键不来自 `keyof T` 时，映射不会保持属性特征：

```typescript
type NonHomomorphic = {
  [K in 'a' | 'b' | 'c']: K;
};
// {
//   a: 'a';
//   b: 'b';
//   c: 'c';
// }
// 没有 readonly 或 optional 修饰符
```

### 条件分发

当映射类型与条件类型结合时的行为：

```typescript
type DistributedPick<T, K extends keyof T> = {
  [P in K]: T[P] extends infer U
    ? U extends object
      ? { wrapped: U }
      : U
    : never;
};

interface Sample {
  id: number;
  name: string;
  data: { value: number };
}

type Picked = DistributedPick<Sample, 'id' | 'data'>;
// {
//   id: number;
//   data: { wrapped: { value: number } };
// }
```

## 最佳实践与注意事项

### 命名约定

```typescript
// 好的命名：清晰表达意图
type ReadonlyDeep<T> = { readonly [K in keyof T]: ReadonlyDeep<T[K]> };
type PickByValue<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type WithPrefix<T, P extends string> = { [K in keyof T as `${P}${string & K}`]: T[K] };

// 避免：过于简短或含糊的命名
type R<T> = { readonly [K in keyof T]: T[K] }; // 不清楚 R 代表什么
type X<T, U> = { [K in keyof T as T[K] extends U ? K : never]: T[K] }; // X 意义不明
```

### 类型约束

```typescript
// 添加适当的泛型约束
type SafeRecord<K extends string | number | symbol, V> = {
  [P in K]: V;
};

// 确保键是字符串（用于模板字面量）
type PrefixedKeys<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K];
};

// 确保值类型满足条件
type FunctionProps<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};
```

### 避免过度复杂

```typescript
// 不好：一个表达式做太多事情
type OverlyComplex<T> = {
  [K in keyof T as T[K] extends Function
    ? never
    : K extends `_${string}`
    ? never
    : K extends string
    ? `get${Capitalize<K>}`
    : K]: T[K] extends object
    ? Readonly<T[K]>
    : T[K] | null;
};

// 好：分解为可组合的小类型
type ExcludeFunctions<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

type ExcludePrivate<T> = {
  [K in keyof T as K extends `_${string}` ? never : K]: T[K];
};

type AddGetters<T> = {
  [K in keyof T as K extends string ? `get${Capitalize<K>}` : K]: T[K];
};

type MakeNullable<T> = {
  [K in keyof T]: T[K] | null;
};

// 组合使用
type Processed<T> = AddGetters<ExcludePrivate<ExcludeFunctions<T>>>;
```

### 处理特殊情况

```typescript
// 处理数组类型
type DeepReadonlyArray<T> = T extends (infer U)[]
  ? DeepReadonlyValue<U>[]
  : T;

type DeepReadonlyValue<T> = T extends object
  ? T extends Function
    ? T
    : DeepReadonlyObject<T>
  : T;

type DeepReadonlyObject<T> = {
  readonly [K in keyof T]: DeepReadonlyValue<T[K]>;
};

// 处理 Map 和 Set
type DeepReadonlyCollection<T> = T extends Map<infer K, infer V>
  ? ReadonlyMap<K, DeepReadonlyValue<V>>
  : T extends Set<infer U>
  ? ReadonlySet<DeepReadonlyValue<U>>
  : T;
```

### 性能考虑

```typescript
// 避免无限递归
type SafeDeepPartial<T, Depth extends number[] = []> = Depth['length'] extends 10
  ? T // 达到最大深度，停止递归
  : {
      [K in keyof T]?: T[K] extends object
        ? SafeDeepPartial<T[K], [...Depth, 1]>
        : T[K];
    };

// 使用缓存（TypeScript 会自动缓存类型计算结果）
type CachedType<T> = T extends { __cached: infer U } ? U : never;
```

## 总结

映射类型是 TypeScript 类型系统中的核心特性，它提供了强大的类型转换能力：

1. **基础语法**：使用 `[K in Keys]` 遍历属性键
2. **修饰符操作**：使用 `+/-` 添加或移除 `readonly` 和 `?`
3. **键重映射**：使用 `as` 子句转换属性键名
4. **内置类型**：`Partial`、`Required`、`Readonly`、`Pick`、`Omit`、`Record` 等
5. **自定义类型**：深度转换、条件映射、属性过滤等高级模式

掌握映射类型可以帮助你：

- 减少类型定义的重复代码
- 创建更精确的类型约束
- 实现类型安全的 API 设计
- 构建可复用的类型工具库

在实际开发中，建议从简单的映射类型开始，逐步掌握键重映射和条件映射等高级技巧。合理运用映射类型，可以显著提升 TypeScript 代码的类型安全性和可维护性。

## 相关资源

- [TypeScript 官方文档 - Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [TypeScript 官方文档 - Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [Type Challenges](https://github.com/type-challenges/type-challenges) - 类型体操练习
