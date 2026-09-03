---
title: TypeScript 高级类型
description: 掌握 TypeScript 高级类型：映射类型、条件类型、模板字面量类型
track: typescript
section: type-system
difficulty: advanced
tags:
  - TypeScript
  - 高级类型
  - 映射类型
  - 条件类型
status: imported
origin: old/src/content/docs/typescript/advanced-types.zh.md
divergence: 0.35
issues:
  - divergent
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 3
  lastUpdated: 2026-01-07
---

TypeScript 的高级类型系统提供了强大的类型操作能力，使开发者能够构建更加精确和灵活的类型定义。本文将深入探讨映射类型、条件类型、模板字面量类型、`infer` 关键字以及递归类型等核心概念。

## 映射类型（Mapped Types）

映射类型允许你基于旧类型创建新类型，通过遍历旧类型的属性来生成新的类型结构。

### 基础映射类型

```typescript
// 基础映射类型语法
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

interface User {
  id: number;
  name: string;
  email: string;
}

type ReadonlyUser = Readonly<User>;
// 结果：
// {
//   readonly id: number;
//   readonly name: string;
//   readonly email: string;
// }
```

### 可选映射类型

```typescript
// 将所有属性变为可选
type Partial<T> = {
  [P in keyof T]?: T[P];
};

type PartialUser = Partial<User>;
// 结果：
// {
//   id?: number;
//   name?: string;
//   email?: string;
// }
```

### 必需映射类型

```typescript
// 移除所有可选标记
type Required<T> = {
  [P in keyof T]-?: T[P];
};

interface OptionalConfig {
  host?: string;
  port?: number;
  timeout?: number;
}

type RequiredConfig = Required<OptionalConfig>;
// 结果：
// {
//   host: string;
//   port: number;
//   timeout: number;
// }
```

### 属性重映射

```typescript
// 使用 as 关键字进行属性名转换
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// 结果：
// {
//   getName: () => string;
//   getAge: () => number;
// }
```

### 条件属性过滤

```typescript
// 过滤掉特定类型的属性
type FilterByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

interface Mixed {
  id: number;
  name: string;
  age: number;
  email: string;
}

type NumberProps = FilterByType<Mixed, number>;
// 结果：
// {
//   id: number;
//   age: number;
// }
```

## 索引访问类型（Indexed Access Types）

索引访问类型允许你通过属性名来获取类型的特定部分。

### 基础索引访问

```typescript
type Person = {
  name: string;
  age: number;
  address: {
    city: string;
    country: string;
  };
};

// 获取单个属性类型
type PersonName = Person['name']; // string
type PersonAge = Person['age']; // number

// 获取嵌套属性类型
type PersonCity = Person['address']['city']; // string
```

### 联合类型索引

```typescript
// 使用联合类型索引多个属性
type PersonNameOrAge = Person['name' | 'age']; // string | number

// 使用 keyof 获取所有属性值的联合类型
type PersonValues = Person[keyof Person];
// string | number | { city: string; country: string; }
```

### 数组元素类型提取

```typescript
// 提取数组元素类型
type StringArray = string[];
type ArrayElement = StringArray[number]; // string

const colors = ['red', 'green', 'blue'] as const;
type Color = typeof colors[number]; // 'red' | 'green' | 'blue'
```

### 实用示例：深度属性访问

```typescript
// 创建深度访问类型
type DeepValue<T, K extends string> = K extends `${infer First}.${infer Rest}`
  ? First extends keyof T
    ? DeepValue<T[First], Rest>
    : never
  : K extends keyof T
  ? T[K]
  : never;

interface Config {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
}

type SSLEnabled = DeepValue<Config, 'server.ssl.enabled'>; // boolean
```

## 条件类型（Conditional Types）

条件类型根据类型之间的关系来选择不同的类型分支，语法类似于三元表达式。

### 基础条件类型

```typescript
// 基础语法：T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
```

### 提取函数返回类型

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getUser() {
  return { id: 1, name: 'Alice' };
}

type UserReturnType = ReturnType<typeof getUser>;
// { id: number; name: string; }
```

### 提取函数参数类型

```typescript
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

function createUser(name: string, age: number, email: string) {
  return { name, age, email };
}

type CreateUserParams = Parameters<typeof createUser>;
// [name: string, age: number, email: string]
```

### 分布式条件类型

```typescript
// 当条件类型作用于联合类型时，会分布到每个成员上
type ToArray<T> = T extends any ? T[] : never;

type StrOrNum = string | number;
type Arrays = ToArray<StrOrNum>; // string[] | number[]

// 如果不想分布，可以用元组包裹
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type SingleArray = ToArrayNonDist<StrOrNum>; // (string | number)[]
```

### 排除类型

```typescript
// 从联合类型中排除特定类型
type Exclude<T, U> = T extends U ? never : T;

type T1 = Exclude<'a' | 'b' | 'c', 'a'>; // 'b' | 'c'
type T2 = Exclude<string | number | boolean, boolean>; // string | number
```

### 提取类型

```typescript
// 从联合类型中提取特定类型
type Extract<T, U> = T extends U ? T : never;

type T3 = Extract<'a' | 'b' | 'c', 'a' | 'f'>; // 'a'
type T4 = Extract<string | number | boolean, number>; // number
```

## 模板字面量类型（Template Literal Types）

模板字面量类型允许你通过字符串模板来构建新的字符串字面量类型。

### 基础模板字面量

```typescript
type World = 'world';
type Greeting = `hello ${World}`; // 'hello world'

type EmailLocale = 'en' | 'zh' | 'ja';
type WelcomeEmail = `welcome_${EmailLocale}`;
// 'welcome_en' | 'welcome_zh' | 'welcome_ja'
```

### 内置字符串操作类型

```typescript
// Uppercase：转大写
type UppercaseGreeting = Uppercase<'hello'>; // 'HELLO'

// Lowercase：转小写
type LowercaseGreeting = Lowercase<'HELLO'>; // 'hello'

// Capitalize：首字母大写
type CapitalizedGreeting = Capitalize<'hello'>; // 'Hello'

// Uncapitalize：首字母小写
type UncapitalizedGreeting = Uncapitalize<'Hello'>; // 'hello'
```

### 事件处理器类型

```typescript
type EventName = 'click' | 'scroll' | 'mousemove';
type EventHandler = `on${Capitalize<EventName>}`;
// 'onClick' | 'onScroll' | 'onMousemove'

// 完整的事件系统
type PropEventSource<Type> = {
  on<Key extends string & keyof Type>(
    eventName: `${Key}Changed`,
    callback: (newValue: Type[Key]) => void
  ): void;
};

declare function makeWatchedObject<Type>(
  obj: Type
): Type & PropEventSource<Type>;

const person = makeWatchedObject({
  firstName: 'Saoirse',
  lastName: 'Ronan',
  age: 26,
});

person.on('firstNameChanged', (newValue) => {
  // newValue 的类型自动推断为 string
  console.log(`firstName was changed to ${newValue}!`);
});
```

### 路径自动完成

```typescript
type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${Path<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

interface DeepObject {
  user: {
    profile: {
      name: string;
      age: number;
    };
    settings: {
      theme: string;
    };
  };
}

type ObjectPaths = Path<DeepObject>;
// 'user' | 'user.profile' | 'user.profile.name' | 'user.profile.age' |
// 'user.settings' | 'user.settings.theme'
```

### SQL 查询构建器

```typescript
type SQLOperator = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
type TableName = 'users' | 'posts' | 'comments';

type SQLQuery<
  Op extends SQLOperator,
  Table extends TableName
> = `${Op} * FROM ${Table}`;

type UserQuery = SQLQuery<'SELECT', 'users'>; // 'SELECT * FROM users'
type PostQuery = SQLQuery<'DELETE', 'posts'>; // 'DELETE * FROM posts'
```

## infer 关键字

`infer` 关键字用于在条件类型中声明类型变量，让 TypeScript 自动推断类型。

### 基础用法

```typescript
// 推断函数返回类型
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getUserInfo() {
  return { id: 1, name: 'Alice', role: 'admin' };
}

type UserInfo = GetReturnType<typeof getUserInfo>;
// { id: number; name: string; role: string; }
```

### 推断数组元素类型

```typescript
type Unpacked<T> = T extends (infer U)[]
  ? U
  : T extends (...args: any[]) => infer U
  ? U
  : T extends Promise<infer U>
  ? U
  : T;

type T1 = Unpacked<string[]>; // string
type T2 = Unpacked<() => number>; // number
type T3 = Unpacked<Promise<boolean>>; // boolean
type T4 = Unpacked<string>; // string
```

### 推断元组第一个元素

```typescript
type FirstElement<T extends any[]> = T extends [infer First, ...any[]]
  ? First
  : never;

type Tuple1 = FirstElement<[string, number, boolean]>; // string
type Tuple2 = FirstElement<[number]>; // number
type Tuple3 = FirstElement<[]>; // never
```

### 推断元组最后一个元素

```typescript
type LastElement<T extends any[]> = T extends [...any[], infer Last]
  ? Last
  : never;

type Last1 = LastElement<[string, number, boolean]>; // boolean
type Last2 = LastElement<[number]>; // number
```

### 推断 Promise 嵌套类型

```typescript
type UnwrapPromise<T> = T extends Promise<infer U>
  ? UnwrapPromise<U>
  : T;

type NestedPromise = Promise<Promise<Promise<string>>>;
type Unwrapped = UnwrapPromise<NestedPromise>; // string
```

### 推断构造函数参数

```typescript
type ConstructorParameters<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: infer P) => any ? P : never;

class UserService {
  constructor(private apiUrl: string, private timeout: number) {}
}

type UserServiceParams = ConstructorParameters<typeof UserService>;
// [apiUrl: string, timeout: number]
```

## 递归类型（Recursive Types）

递归类型允许类型引用自身，用于处理嵌套或树形结构的数据。

### 基础递归类型

```typescript
// JSON 值类型
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

const validJSON: JSONValue = {
  name: 'Alice',
  age: 30,
  hobbies: ['reading', 'coding'],
  address: {
    city: 'Beijing',
    coordinates: [116.4, 39.9],
  },
};
```

### 深度只读

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

interface NestedConfig {
  database: {
    host: string;
    credentials: {
      username: string;
      password: string;
    };
  };
}

type ReadonlyConfig = DeepReadonly<NestedConfig>;
// 所有嵌套属性都变为只读
```

### 深度可选

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepPartial<T[P]>
    : T[P];
};

type PartialConfig = DeepPartial<NestedConfig>;
// 所有嵌套属性都变为可选
```

### 树形结构

```typescript
interface TreeNode<T> {
  value: T;
  children?: TreeNode<T>[];
}

const fileSystem: TreeNode<string> = {
  value: 'root',
  children: [
    {
      value: 'src',
      children: [
        { value: 'index.ts' },
        { value: 'utils.ts' },
      ],
    },
    {
      value: 'tests',
      children: [{ value: 'test.spec.ts' }],
    },
  ],
};
```

### 路径类型提取

```typescript
type Paths<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ?
              | `${Prefix}${K}`
              | Paths<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
        : never;
    }[keyof T]
  : never;

interface AppConfig {
  server: {
    port: number;
    ssl: {
      enabled: boolean;
      certPath: string;
    };
  };
  database: {
    host: string;
  };
}

type ConfigPaths = Paths<AppConfig>;
// 'server' | 'server.port' | 'server.ssl' | 'server.ssl.enabled' |
// 'server.ssl.certPath' | 'database' | 'database.host'
```

### 扁平化嵌套对象

```typescript
type Flatten<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T as K extends string
        ? T[K] extends object
          ? never
          : Prefix extends ''
          ? K
          : `${Prefix}.${K}`
        : never]: T[K];
    } & {
      [K in keyof T as K extends string
        ? T[K] extends object
          ? K
          : never
        : never]: T[K] extends object
        ? Flatten<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
        : never;
    }[keyof T]
  : T;

interface Nested {
  a: string;
  b: {
    c: number;
    d: {
      e: boolean;
    };
  };
}

type Flattened = Flatten<Nested>;
// { a: string; 'b.c': number; 'b.d.e': boolean; }
```

## 高级类型组合实战

### 类型安全的事件发射器

```typescript
type EventMap = {
  click: { x: number; y: number };
  keypress: { key: string };
  submit: { formData: Record<string, any> };
};

type EventEmitter<T extends Record<string, any>> = {
  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
  off<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
};

declare const emitter: EventEmitter<EventMap>;

emitter.on('click', (data) => {
  console.log(data.x, data.y); // 类型安全：data 是 { x: number; y: number }
});

emitter.emit('keypress', { key: 'Enter' }); // 类型检查通过
// emitter.emit('keypress', { x: 10 }); // 错误：类型不匹配
```

### 类型安全的状态管理

```typescript
type State = {
  user: {
    id: number;
    name: string;
  };
  settings: {
    theme: 'light' | 'dark';
    language: string;
  };
};

type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

type Selector<T, P extends string> = (state: T) => PathValue<T, P>;

function createSelector<P extends Paths<State>>(
  path: P
): Selector<State, P> {
  return (state: State) => {
    const keys = path.split('.');
    let result: any = state;
    for (const key of keys) {
      result = result[key];
    }
    return result;
  };
}

const selectTheme = createSelector('settings.theme');
const theme = selectTheme({
  user: { id: 1, name: 'Alice' },
  settings: { theme: 'dark', language: 'zh-CN' },
}); // theme 类型为 'light' | 'dark'
```

### API 响应类型生成器

```typescript
type APIResponse<T> = {
  data: T;
  status: number;
  message: string;
};

type APIEndpoints = {
  '/users': {
    GET: { id: number; name: string }[];
    POST: { id: number; name: string };
  };
  '/posts': {
    GET: { id: number; title: string; content: string }[];
  };
};

type ExtractResponse<
  Endpoint extends keyof APIEndpoints,
  Method extends keyof APIEndpoints[Endpoint]
> = APIResponse<APIEndpoints[Endpoint][Method]>;

type UsersListResponse = ExtractResponse<'/users', 'GET'>;
// APIResponse<{ id: number; name: string }[]>

type CreateUserResponse = ExtractResponse<'/users', 'POST'>;
// APIResponse<{ id: number; name: string }>
```

## 最佳实践

### 避免过度复杂

```typescript
// 不好：过于复杂
type Complex<T> = T extends {
  a: infer A;
  b: infer B;
}
  ? A extends string
    ? B extends number
      ? { result: `${A}-${B}` }
      : never
    : never
  : never;

// 好：分步骤定义
type ExtractA<T> = T extends { a: infer A } ? A : never;
type ExtractB<T> = T extends { b: infer B } ? B : never;
type FormatResult<A extends string, B extends number> = { result: `${A}-${B}` };
```

### 使用类型约束

```typescript
// 确保泛型参数满足特定约束
type GetProperty<T extends object, K extends keyof T> = T[K];

interface User {
  id: number;
  name: string;
}

type UserName = GetProperty<User, 'name'>; // string
// type Invalid = GetProperty<User, 'invalid'>; // 错误
```

### 提供默认类型参数

```typescript
type Paginated<T, Meta = { page: number; total: number }> = {
  data: T[];
  meta: Meta;
};

type UserList = Paginated<User>; // 使用默认 Meta
type CustomUserList = Paginated<User, { cursor: string }>; // 自定义 Meta
```

## 总结

TypeScript 的高级类型系统提供了强大的类型操作能力：

1. **映射类型**：转换和操作对象类型的属性
2. **索引访问类型**：提取类型的特定部分
3. **条件类型**：基于类型关系进行条件判断
4. **模板字面量类型**：构建字符串字面量类型
5. **infer 关键字**：在条件类型中推断类型
6. **递归类型**：处理嵌套和树形结构

掌握这些高级类型技巧，能够让你编写更加类型安全、灵活和可维护的 TypeScript 代码。在实际开发中，合理运用这些工具可以大大提升代码质量和开发效率。
