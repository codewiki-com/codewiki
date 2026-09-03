---
title: TypeScript 模板字面量类型
description: 掌握 TypeScript 模板字面量类型，构建强大的字符串类型约束
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - 模板字面量
  - 类型编程
status: imported
origin: old/src/content/docs/typescript/template-literal-types.zh.md
divergence: 0.142
issues: []
legacy:
  category: TypeScript
  subcategory: 高级类型
  order: 14
  lastUpdated: 2026-01-07
---

模板字面量类型（Template Literal Types）是 TypeScript 4.1 引入的革命性特性，它将 JavaScript 模板字符串的语法能力扩展到了类型系统层面。通过模板字面量类型，开发者可以在编译时构建、验证和转换字符串类型，实现前所未有的类型安全性。本文将全面深入地探讨模板字面量类型的语法、原理、应用模式以及最佳实践。

## 概念解释

### 什么是模板字面量类型

模板字面量类型使用与 JavaScript 模板字符串相同的反引号（`` ` ``）语法，但它操作的是类型而非值：

```typescript
// JavaScript 模板字符串 - 运行时操作
const name = "TypeScript";
const greeting = `Hello, ${name}!`; // "Hello, TypeScript!"

// TypeScript 模板字面量类型 - 编译时类型
type Name = "TypeScript";
type Greeting = `Hello, ${Name}!`; // 类型是 "Hello, TypeScript!"
```

模板字面量类型的核心能力在于：
1. **类型层面的字符串拼接**：将多个字符串类型组合成新类型
2. **联合类型的分布计算**：自动生成所有可能的字符串组合
3. **字符串模式匹配**：结合条件类型进行类型推断

### 历史背景与动机

在 TypeScript 4.1 之前，类型系统对字符串的处理非常有限。开发者面临以下困境：

```typescript
// 4.1 之前：无法精确描述字符串模式
type EventName = string; // 过于宽泛
type EventHandler = `on${string}`; // 不支持此语法

// 4.1 之前：无法在类型层面转换字符串
type UpperName = Uppercase<"hello">; // 不存在这样的能力
```

模板字面量类型的引入彻底改变了这一局面，使 TypeScript 的类型系统具备了完整的字符串操作能力。

### 解决的核心问题

1. **API 类型定义**：精确描述 REST 路由、事件名称、CSS 类名等
2. **配置验证**：编译时验证配置字符串格式
3. **代码生成类型**：自动推导 getter/setter、事件处理器等方法名
4. **命名转换**：驼峰、蛇形、烤串命名法的类型级转换
5. **国际化键检查**：验证翻译键的存在性

## 核心语法

### 基础语法结构

模板字面量类型的基本结构如下：

```typescript
// 基础模板
type Template = `prefix-${string}-suffix`;

// 使用字符串字面量类型
type World = "World";
type HelloWorld = `Hello, ${World}`; // "Hello, World"

// 多个插值
type Protocol = "http" | "https";
type Host = "localhost" | "example.com";
type Port = 80 | 443;
type URL = `${Protocol}://${Host}:${Port}`;
// 生成 8 种组合
```

### 占位符支持的类型

模板字面量类型的占位符支持以下类型：

```typescript
// 1. 字符串字面量类型
type A = `value-${"one" | "two"}`; // "value-one" | "value-two"

// 2. 数字字面量类型
type B = `port-${80 | 443}`; // "port-80" | "port-443"

// 3. 布尔字面量类型
type C = `flag-${true | false}`; // "flag-true" | "flag-false"

// 4. string 类型
type D = `id-${string}`; // `id-${string}`

// 5. number 类型
type E = `count-${number}`; // `count-${number}`

// 6. bigint 类型
type F = `big-${bigint}`; // `big-${bigint}`

// 7. null 和 undefined
type G = `nullable-${null}`; // "nullable-null"
type H = `optional-${undefined}`; // "optional-undefined"

// 8. 其他模板字面量类型（嵌套）
type Prefix = `pre-${string}`;
type Nested = `${Prefix}-post`; // `pre-${string}-post`
```

### 联合类型的分布计算

当模板中包含联合类型时，会进行笛卡尔积计算：

```typescript
type Size = "small" | "medium" | "large";
type Color = "red" | "blue" | "green";

// 笛卡尔积：3 × 3 = 9 种组合
type SizeColor = `${Size}-${Color}`;
// | "small-red"   | "small-blue"   | "small-green"
// | "medium-red"  | "medium-blue"  | "medium-green"
// | "large-red"   | "large-blue"   | "large-green"

// 三个联合类型：2 × 3 × 2 = 12 种组合
type Theme = "light" | "dark";
type Variant = "primary" | "secondary" | "danger";
type State = "normal" | "hover";
type ClassName = `${Theme}-${Variant}-${State}`;
```

## 内置字符串操作类型

TypeScript 提供了四个内置的字符串操作类型，它们是由编译器直接实现的"内在类型"（Intrinsic Types）。

### Uppercase<S> - 转换为大写

```typescript
type Upper1 = Uppercase<"hello">; // "HELLO"
type Upper2 = Uppercase<"Hello World">; // "HELLO WORLD"
type Upper3 = Uppercase<"abc" | "def">; // "ABC" | "DEF"

// 与模板字面量结合
type EventType = "click" | "focus" | "blur";
type UpperEvent = Uppercase<EventType>; // "CLICK" | "FOCUS" | "BLUR"

// 实际应用：HTTP 方法
type HttpMethod = Uppercase<"get" | "post" | "put" | "delete">;
// "GET" | "POST" | "PUT" | "DELETE"
```

### Lowercase<S> - 转换为小写

```typescript
type Lower1 = Lowercase<"HELLO">; // "hello"
type Lower2 = Lowercase<"Hello World">; // "hello world"

// 实际应用：规范化输入
type NormalizedStatus = Lowercase<"ACTIVE" | "INACTIVE" | "Pending">;
// "active" | "inactive" | "pending"
```

### Capitalize<S> - 首字母大写

```typescript
type Cap1 = Capitalize<"hello">; // "Hello"
type Cap2 = Capitalize<"hello world">; // "Hello world" (只处理首字母)

// 实际应用：生成方法名
type PropName = "name" | "age" | "email";
type GetterName = `get${Capitalize<PropName>}`;
// "getName" | "getAge" | "getEmail"

type SetterName = `set${Capitalize<PropName>}`;
// "setName" | "setAge" | "setEmail"
```

### Uncapitalize<S> - 首字母小写

```typescript
type Uncap1 = Uncapitalize<"Hello">; // "hello"
type Uncap2 = Uncapitalize<"HELLO">; // "hELLO" (只处理首字母)

// 实际应用：从类名生成实例名
type ClassName = "UserService" | "OrderController";
type InstanceName = Uncapitalize<ClassName>;
// "userService" | "orderController"
```

### 组合使用

```typescript
// 标准化事件处理器名称
type RawEvent = "CLICK" | "MouseOver" | "key_down";
type NormalizedEvent = `on${Capitalize<Lowercase<RawEvent>>}`;
// "onClick" | "onMouseover" | "onKey_down"

// 注意：这些类型只处理 ASCII 字符
type ChineseUpper = Uppercase<"你好">; // "你好" (不变)
type MixedUpper = Uppercase<"Hello你好">; // "HELLO你好"
```

## 模式匹配与类型推断

模板字面量类型与条件类型和 `infer` 关键字结合，可以实现强大的字符串解析和模式匹配能力。

### 基础模式匹配

```typescript
// 检查字符串是否匹配特定模式
type StartsWith<S extends string, P extends string> =
  S extends `${P}${string}` ? true : false;

type A = StartsWith<"hello world", "hello">; // true
type B = StartsWith<"hello world", "world">; // false

// 检查结尾
type EndsWith<S extends string, Suffix extends string> =
  S extends `${string}${Suffix}` ? true : false;

type C = EndsWith<"hello world", "world">; // true
type D = EndsWith<"hello world", "hello">; // false

// 包含检查
type Contains<S extends string, Sub extends string> =
  S extends `${string}${Sub}${string}` ? true : false;

type E = Contains<"hello world", "o w">; // true
```

### 使用 infer 提取子串

```typescript
// 提取前缀
type ExtractPrefix<S extends string, Delimiter extends string> =
  S extends `${infer Prefix}${Delimiter}${string}` ? Prefix : never;

type Prefix1 = ExtractPrefix<"user_name", "_">; // "user"
type Prefix2 = ExtractPrefix<"hello-world-foo", "-">; // "hello"

// 提取后缀
type ExtractSuffix<S extends string, Delimiter extends string> =
  S extends `${string}${Delimiter}${infer Suffix}` ? Suffix : never;

type Suffix1 = ExtractSuffix<"user_name", "_">; // "name"
type Suffix2 = ExtractSuffix<"hello-world-foo", "-">; // "world-foo" (贪婪匹配)

// 同时提取两部分
type Split2<S extends string, D extends string> =
  S extends `${infer First}${D}${infer Rest}`
    ? [First, Rest]
    : [S];

type Parts = Split2<"hello-world", "-">; // ["hello", "world"]
```

### 递归模式匹配

```typescript
// 将字符串分割为数组
type Split<S extends string, D extends string> =
  S extends `${infer First}${D}${infer Rest}`
    ? [First, ...Split<Rest, D>]
    : S extends ""
    ? []
    : [S];

type Words = Split<"a-b-c-d", "-">; // ["a", "b", "c", "d"]
type Chars = Split<"hello", "">; // ["h", "e", "l", "l", "o"]

// 字符串反转
type Reverse<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? `${Reverse<Rest>}${First}`
    : S;

type Reversed = Reverse<"hello">; // "olleh"

// 字符串长度（通过转换为元组）
type StringLength<S extends string> = Split<S, "">["length"];
type Len = StringLength<"hello">; // 5
```

### 路由参数解析

```typescript
// 解析 URL 路由参数
type ParseRouteParams<Route extends string> =
  Route extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ParseRouteParams<`/${Rest}`>
    : Route extends `${string}:${infer Param}`
    ? Param
    : never;

type UserRoute = "/users/:userId/posts/:postId";
type Params = ParseRouteParams<UserRoute>; // "userId" | "postId"

// 生成参数对象类型
type RouteParams<Route extends string> = {
  [K in ParseRouteParams<Route>]: string;
};

type UserRouteParams = RouteParams<UserRoute>;
// { userId: string; postId: string }

// 类型安全的路由函数
function navigate<Route extends string>(
  route: Route,
  params: RouteParams<Route>
): string {
  let path: string = route;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, value as string);
  }
  return path;
}

navigate("/users/:userId/posts/:postId", {
  userId: "123",
  postId: "456"
}); // OK

// navigate("/users/:userId", { postId: "456" }); // 错误！
```

## 联合类型与模板字面量

### 联合类型的分布特性

```typescript
// 基础分布计算
type Fruit = "apple" | "banana" | "orange";
type Container = "box" | "bag";
type FruitInContainer = `${Fruit} in ${Container}`;
// "apple in box" | "apple in bag" | "banana in box" | ...（6种）

// 生成 CSS 类名
type Breakpoint = "sm" | "md" | "lg" | "xl";
type Display = "block" | "flex" | "grid" | "none";
type ResponsiveDisplay = `${Breakpoint}:${Display}`;
// "sm:block" | "sm:flex" | ... | "xl:none"（16种）

// 生成 Tailwind 样式类
type Spacing = 0 | 1 | 2 | 4 | 8;
type Side = "t" | "r" | "b" | "l" | "x" | "y" | "";
type SpacingClass = `p${Side}-${Spacing}`;
// "p-0" | "pt-0" | ... | "py-8"（35种）
```

### 条件过滤

```typescript
// 过滤特定模式的联合类型成员
type FilterByPrefix<T extends string, P extends string> =
  T extends `${P}${string}` ? T : never;

type AllEvents = "onClick" | "onFocus" | "onBlur" | "handleSubmit" | "handleReset";
type OnEvents = FilterByPrefix<AllEvents, "on">;
// "onClick" | "onFocus" | "onBlur"

// 移除特定模式
type RemovePrefix<T extends string, P extends string> =
  T extends `${P}${infer Rest}` ? Rest : T;

type EventNames = RemovePrefix<OnEvents, "on">;
// "Click" | "Focus" | "Blur"

// 替换模式
type ReplacePrefix<T extends string, From extends string, To extends string> =
  T extends `${From}${infer Rest}` ? `${To}${Rest}` : T;

type HandleEvents = ReplacePrefix<OnEvents, "on", "handle">;
// "handleClick" | "handleFocus" | "handleBlur"
```

### 键重映射

```typescript
// 使用模板字面量重映射对象键
type AddPrefix<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K];
};

interface User {
  name: string;
  age: number;
}

type PrefixedUser = AddPrefix<User, "user_">;
// { user_name: string; user_age: number }

// 生成 Getter 和 Setter
type Getters<T> = {
  [K in keyof T as K extends string ? `get${Capitalize<K>}` : never]: () => T[K];
};

type Setters<T> = {
  [K in keyof T as K extends string ? `set${Capitalize<K>}` : never]: (
    value: T[K]
  ) => void;
};

type UserGetters = Getters<User>;
// { getName: () => string; getAge: () => number }

type UserSetters = Setters<User>;
// { setName: (value: string) => void; setAge: (value: number) => void }

// 完整的访问器类型
type Accessors<T> = Getters<T> & Setters<T>;
```

## 实战模式

### 模式 1：类型安全的事件系统

```typescript
// 定义事件映射
interface EventPayloadMap {
  click: { x: number; y: number; button: number };
  keydown: { key: string; code: string; ctrlKey: boolean };
  resize: { width: number; height: number };
  custom: { data: unknown };
}

// 生成事件处理器类型
type EventHandler<K extends keyof EventPayloadMap> =
  `on${Capitalize<string & K>}`;

type EventHandlers<T extends Record<string, any>> = {
  [K in keyof T as EventHandler<K & string>]?: (payload: T[K]) => void;
};

type DOMEventHandlers = EventHandlers<EventPayloadMap>;
// {
//   onClick?: (payload: { x: number; y: number; button: number }) => void;
//   onKeydown?: (payload: { key: string; code: string; ctrlKey: boolean }) => void;
//   onResize?: (payload: { width: number; height: number }) => void;
//   onCustom?: (payload: { data: unknown }) => void;
// }

// 类型安全的事件发射器
class TypedEmitter<Events extends Record<string, any>> {
  private listeners: {
    [K in keyof Events]?: Array<(payload: Events[K]) => void>;
  } = {};

  on<K extends keyof Events>(
    event: K,
    listener: (payload: Events[K]) => void
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(
    event: K,
    listener: (payload: Events[K]) => void
  ): void {
    const listeners = this.listeners[event];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners[event]?.forEach((listener) => listener(payload));
  }
}

// 使用
const emitter = new TypedEmitter<EventPayloadMap>();
emitter.on("click", ({ x, y, button }) => {
  console.log(`Click at (${x}, ${y}) with button ${button}`);
});
emitter.emit("click", { x: 100, y: 200, button: 0 });
```

### 模式 2：命名转换工具

```typescript
// 驼峰转蛇形 (camelCase -> snake_case)
type CamelToSnake<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? `_${Lowercase<First>}${CamelToSnake<Rest>}`
    : `${First}${CamelToSnake<Rest>}`
  : S;

type Snake1 = CamelToSnake<"getUserById">; // "get_user_by_id"
type Snake2 = CamelToSnake<"firstName">; // "first_name"

// 蛇形转驼峰 (snake_case -> camelCase)
type SnakeToCamel<S extends string> = S extends `${infer First}_${infer Rest}`
  ? `${Lowercase<First>}${SnakeToPascal<Rest>}`
  : Lowercase<S>;

type SnakeToPascal<S extends string> = S extends `${infer First}_${infer Rest}`
  ? `${Capitalize<Lowercase<First>>}${SnakeToPascal<Rest>}`
  : Capitalize<Lowercase<S>>;

type Camel1 = SnakeToCamel<"get_user_by_id">; // "getUserById"
type Camel2 = SnakeToCamel<"first_name">; // "firstName"

// 转换对象所有键
type SnakeKeysToCamel<T> = {
  [K in keyof T as K extends string ? SnakeToCamel<K> : K]: T[K];
};

type CamelKeysToSnake<T> = {
  [K in keyof T as K extends string ? CamelToSnake<K> : K]: T[K];
};

interface SnakeUser {
  first_name: string;
  last_name: string;
  email_address: string;
}

type CamelUser = SnakeKeysToCamel<SnakeUser>;
// { firstName: string; lastName: string; emailAddress: string }

// 深度转换
type DeepSnakeToCamel<T> = T extends object
  ? T extends Array<infer U>
    ? Array<DeepSnakeToCamel<U>>
    : {
        [K in keyof T as K extends string ? SnakeToCamel<K> : K]: DeepSnakeToCamel<
          T[K]
        >;
      }
  : T;
```

### 模式 3：CSS 类型安全

```typescript
// CSS 长度单位
type CSSLengthUnit = "px" | "em" | "rem" | "%" | "vh" | "vw" | "vmin" | "vmax";
type CSSLength = `${number}${CSSLengthUnit}` | "auto" | "0";

// CSS 颜色格式
type HexColor = `#${string}`;
type RGBColor = `rgb(${number}, ${number}, ${number})`;
type RGBAColor = `rgba(${number}, ${number}, ${number}, ${number})`;
type HSLColor = `hsl(${number}, ${number}%, ${number}%)`;
type CSSColor = HexColor | RGBColor | RGBAColor | HSLColor | "transparent";

// CSS 间距
type SpacingValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
type SpacingUnit = "px" | "rem";
type Spacing = `${SpacingValue}${SpacingUnit}` | "auto";

// 使用示例
function setStyles(styles: {
  width?: CSSLength;
  height?: CSSLength;
  padding?: Spacing;
  color?: CSSColor;
}) {
  // 实现
}

setStyles({
  width: "100px",
  height: "50vh",
  padding: "16rem",
  color: "#ff0000",
}); // 正确

// setStyles({ width: "100" }); // 错误：缺少单位
// setStyles({ color: "red" }); // 错误：不是有效的颜色格式

// Tailwind-like 类名生成
type TwSpacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
type TwDirection = "t" | "r" | "b" | "l" | "x" | "y" | "";
type TwPaddingClass = `p${TwDirection}-${TwSpacing}`;
type TwMarginClass = `m${TwDirection}-${TwSpacing}`;

type TwBreakpoint = "sm" | "md" | "lg" | "xl" | "2xl";
type TwResponsive<T extends string> = T | `${TwBreakpoint}:${T}`;

type ResponsivePadding = TwResponsive<TwPaddingClass>;
// "p-0" | "pt-0" | ... | "2xl:py-24"
```

### 模式 4：国际化类型安全

```typescript
// 翻译键生成
type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? NestedKeyOf<T[K], `${Prefix}${Prefix extends "" ? "" : "."}${K}`>
          : `${Prefix}${Prefix extends "" ? "" : "."}${K}`
        : never;
    }[keyof T]
  : never;

// 翻译结构
interface Translations {
  common: {
    buttons: {
      submit: string;
      cancel: string;
      delete: string;
    };
    messages: {
      success: string;
      error: string;
      loading: string;
    };
  };
  pages: {
    home: {
      title: string;
      welcome: string;
    };
    profile: {
      title: string;
      edit: string;
    };
  };
}

type TranslationKey = NestedKeyOf<Translations>;
// "common.buttons.submit" | "common.buttons.cancel" | "common.buttons.delete" |
// "common.messages.success" | "common.messages.error" | "common.messages.loading" |
// "pages.home.title" | "pages.home.welcome" |
// "pages.profile.title" | "pages.profile.edit"

// 类型安全的翻译函数
function t(key: TranslationKey): string {
  // 实现翻译逻辑
  return key;
}

t("common.buttons.submit"); // 正确
// t("common.buttons.save"); // 错误：不存在此键

// 带参数的翻译
type TranslationWithParams<Params extends Record<string, any>> = {
  key: TranslationKey;
  params: Params;
};

interface InterpolationParams {
  "pages.home.welcome": { name: string };
  "common.messages.error": { code: number };
}

function tWithParams<K extends keyof InterpolationParams>(
  key: K,
  params: InterpolationParams[K]
): string {
  return key;
}

tWithParams("pages.home.welcome", { name: "John" }); // 正确
```

### 模式 5：API 端点类型

```typescript
// HTTP 方法
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// API 路径定义
type ApiPath = `/${string}`;

// 端点定义
type Endpoint = `${HttpMethod} ${ApiPath}`;

// 具体的 API 定义
interface ApiEndpoints {
  "GET /users": { response: User[] };
  "GET /users/:id": { response: User; params: { id: string } };
  "POST /users": { response: User; body: CreateUserDto };
  "PUT /users/:id": {
    response: User;
    params: { id: string };
    body: UpdateUserDto;
  };
  "DELETE /users/:id": { response: void; params: { id: string } };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserDto {
  name: string;
  email: string;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
}

// 解析端点
type ParseEndpoint<E extends string> = E extends `${infer M} ${infer P}`
  ? { method: M; path: P }
  : never;

type Parsed = ParseEndpoint<"GET /users/:id">;
// { method: "GET"; path: "/users/:id" }

// 类型安全的 API 客户端
type ApiRequest<E extends keyof ApiEndpoints> = ApiEndpoints[E] extends {
  body: infer B;
}
  ? { body: B }
  : {};

type ApiParams<E extends keyof ApiEndpoints> = ApiEndpoints[E] extends {
  params: infer P;
}
  ? { params: P }
  : {};

type ApiResponse<E extends keyof ApiEndpoints> = ApiEndpoints[E]["response"];

async function api<E extends keyof ApiEndpoints>(
  endpoint: E,
  options: ApiRequest<E> & ApiParams<E>
): Promise<ApiResponse<E>> {
  // 实现 API 调用
  return {} as ApiResponse<E>;
}

// 使用
await api("GET /users/:id", { params: { id: "123" } });
await api("POST /users", { body: { name: "John", email: "john@example.com" } });
```

### 模式 6：表单验证规则

```typescript
// 验证规则模式
type ValidationRule =
  | `required`
  | `min:${number}`
  | `max:${number}`
  | `minLength:${number}`
  | `maxLength:${number}`
  | `pattern:${string}`
  | `email`
  | `url`
  | `date`
  | `in:${string}`;

// 解析验证规则
type ParseValidationRule<R extends ValidationRule> = R extends "required"
  ? { type: "required" }
  : R extends `min:${infer N extends number}`
  ? { type: "min"; value: N }
  : R extends `max:${infer N extends number}`
  ? { type: "max"; value: N }
  : R extends `minLength:${infer N extends number}`
  ? { type: "minLength"; value: N }
  : R extends `maxLength:${infer N extends number}`
  ? { type: "maxLength"; value: N }
  : R extends `pattern:${infer P}`
  ? { type: "pattern"; value: P }
  : R extends `in:${infer Options}`
  ? { type: "in"; options: Split<Options, ","> }
  : R extends "email"
  ? { type: "email" }
  : R extends "url"
  ? { type: "url" }
  : R extends "date"
  ? { type: "date" }
  : never;

type Split<S extends string, D extends string> = S extends `${infer F}${D}${infer R}`
  ? [F, ...Split<R, D>]
  : [S];

// 测试
type Rule1 = ParseValidationRule<"min:5">;
// { type: "min"; value: 5 }

type Rule2 = ParseValidationRule<"in:apple,banana,orange">;
// { type: "in"; options: ["apple", "banana", "orange"] }

// 表单字段定义
interface FieldConfig<Rules extends ValidationRule[]> {
  name: string;
  rules: Rules;
}

function defineField<Rules extends ValidationRule[]>(
  config: FieldConfig<Rules>
): FieldConfig<Rules> {
  return config;
}

const emailField = defineField({
  name: "email",
  rules: ["required", "email", "maxLength:255"],
});
```

## 常见陷阱与解决方案

### 陷阱 1：类型爆炸

```typescript
// 问题：联合类型的笛卡尔积可能导致巨大的类型
type Letter = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j";
type TwoLetters = `${Letter}${Letter}`; // 100 种组合
type ThreeLetters = `${Letter}${Letter}${Letter}`; // 1000 种组合
// type FourLetters = `${Letter}${Letter}${Letter}${Letter}`; // 10000 种 - 可能导致性能问题

// 解决方案 1：使用更宽泛的类型
type SafeLetters = `${string}${string}${string}${string}`;

// 解决方案 2：限制联合类型大小
type LimitedLetter = "a" | "b" | "c";
type SafeTwoLetters = `${LimitedLetter}${LimitedLetter}`; // 9 种

// 解决方案 3：使用品牌类型
type FourLetterCode = string & { __brand: "FourLetterCode" };

function validateFourLetterCode(code: string): code is FourLetterCode {
  return /^[a-j]{4}$/.test(code);
}
```

### 陷阱 2：递归深度限制

```typescript
// 问题：TypeScript 对递归类型有深度限制（约 50 层）
type InfiniteJoin<T extends string[], D extends string> = T extends [
  infer First extends string,
  ...infer Rest extends string[]
]
  ? Rest["length"] extends 0
    ? First
    : `${First}${D}${InfiniteJoin<Rest, D>}`
  : never;

// 长数组可能触发深度限制
// type LongJoin = InfiniteJoin<[...100个元素...], "-">; // 错误

// 解决方案 1：添加深度限制
type MaxDepth = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 10 层

type SafeJoin<
  T extends string[],
  D extends string,
  Depth extends number[] = []
> = Depth["length"] extends MaxDepth["length"]
  ? string
  : T extends [infer First extends string, ...infer Rest extends string[]]
  ? Rest["length"] extends 0
    ? First
    : `${First}${D}${SafeJoin<Rest, D, [...Depth, 0]>}`
  : never;

// 解决方案 2：使用尾递归优化
type TailJoin<
  T extends string[],
  D extends string,
  Acc extends string = ""
> = T extends [infer First extends string, ...infer Rest extends string[]]
  ? TailJoin<Rest, D, Acc extends "" ? First : `${Acc}${D}${First}`>
  : Acc;
```

### 陷阱 3：infer 的贪婪匹配

```typescript
// 问题：infer 总是匹配尽可能短的字符串（非贪婪匹配）
type FirstPart<S extends string> = S extends `${infer First}-${string}`
  ? First
  : never;

type Result = FirstPart<"a-b-c-d">; // "a" (只匹配到第一个 "-")

// 如果想匹配最后一个分隔符，需要递归
type BeforeLastDash<S extends string> = S extends `${infer Before}-${infer After}`
  ? After extends `${string}-${string}`
    ? `${Before}-${BeforeLastDash<After>}`
    : Before
  : S;

type LastResult = BeforeLastDash<"a-b-c-d">; // "a-b-c"

// 获取最后一部分
type AfterLastDash<S extends string> = S extends `${string}-${infer After}`
  ? After extends `${string}-${string}`
    ? AfterLastDash<After>
    : After
  : S;

type LastPart = AfterLastDash<"a-b-c-d">; // "d"
```

### 陷阱 4：never 在模板中的行为

```typescript
// 问题：never 会导致整个模板类型变成 never
type NeverTemplate = `value-${never}`; // never
type UnionWithNever = `prefix-${never | "a"}-suffix`; // "prefix-a-suffix"

// 解决方案：在使用前过滤 never
type FilterNever<T> = [T] extends [never] ? string : T;

type SafeTemplate<T extends string> = [T] extends [never]
  ? never
  : `value-${T}`;

// 空联合类型问题
type EmptyUnion = never;
type EmptyResult = `prefix-${EmptyUnion}`; // never

// 检查联合类型是否为空
type IsNever<T> = [T] extends [never] ? true : false;
type Check = IsNever<never>; // true
```

### 陷阱 5：模板字面量与运行时的差异

```typescript
// 问题：类型检查发生在编译时，运行时无保证
type ValidEmail = `${string}@${string}.${string}`;

function sendEmail(email: ValidEmail): void {
  console.log(`Sending to: ${email}`);
}

// 编译时正确，但运行时可能无效
const email = "not-a-valid-email" as ValidEmail;
sendEmail(email); // 类型检查通过，但 email 格式实际上无效

// 解决方案：结合运行时验证
function isValidEmail(email: string): email is ValidEmail {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sendEmailSafe(email: string): void {
  if (isValidEmail(email)) {
    sendEmail(email); // 现在类型安全
  } else {
    throw new Error("Invalid email format");
  }
}
```

## 性能优化

### 编译时性能

```typescript
// 避免复杂类型计算
// 不好：每次使用都重新计算
type BadPattern = `${1 | 2 | 3 | 4 | 5}-${1 | 2 | 3 | 4 | 5}-${1 | 2 | 3 | 4 | 5}`;

// 好：预先计算并缓存
type Digit = 1 | 2 | 3 | 4 | 5;
type DigitPair = `${Digit}-${Digit}`; // 25 种
type GoodPattern = `${DigitPair}-${Digit}`; // 125 种，分步计算

// 使用条件短路
type ShortCircuit<T extends string> = T extends ""
  ? never // 快速返回空字符串情况
  : `result-${T}`;

// 避免不必要的递归
type EfficientSplit<S extends string, D extends string, Acc extends string[] = []> =
  S extends `${infer First}${D}${infer Rest}`
    ? EfficientSplit<Rest, D, [...Acc, First]>
    : [...Acc, S];
```

### IDE 响应性优化

```typescript
// 问题：复杂类型影响 IDE 自动补全
interface SlowInterface {
  [K in `prop${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`]: string;
}

// 解决方案：显式声明常用属性
interface FastInterface {
  prop1: string;
  prop2: string;
  prop3: string;
  // 其他使用索引签名
  [key: `prop${number}`]: string;
}

// 使用类型辅助函数代替内联类型
type PropName = `prop${1 | 2 | 3}`;
type PropRecord = Record<PropName, string>;

// 分离复杂类型定义
type ComplexType = /* 复杂定义 */ string;
// 在使用处引用 ComplexType，而不是内联复杂表达式
```

## 面试要点

### 基础问题

**Q1: 什么是模板字面量类型？它与 JavaScript 模板字符串的区别是什么？**

A: 模板字面量类型是 TypeScript 4.1 引入的类型系统特性，使用与 JavaScript 模板字符串相同的反引号语法，但作用于类型层面。主要区别：

```typescript
// JavaScript 模板字符串 - 运行时求值
const runtime = `Hello, ${userName}!`;

// TypeScript 模板字面量类型 - 编译时类型
type CompileTime = `Hello, ${string}!`;
```

- JavaScript 模板字符串在运行时拼接字符串值
- 模板字面量类型在编译时构建和检查字符串类型
- 模板字面量类型支持联合类型的分布计算

**Q2: TypeScript 提供了哪些内置的字符串操作类型？**

A: TypeScript 提供了四个内置字符串操作类型：

1. `Uppercase<S>`: 将字符串转为大写
2. `Lowercase<S>`: 将字符串转为小写
3. `Capitalize<S>`: 将首字母转为大写
4. `Uncapitalize<S>`: 将首字母转为小写

这些是编译器内置的"内在类型"，直接由编译器实现。

### 进阶问题

**Q3: 解释模板字面量类型中联合类型的分布计算原理。**

A: 当模板字面量类型中包含联合类型时，会进行笛卡尔积运算：

```typescript
type A = "a" | "b";
type B = "1" | "2";
type C = `${A}-${B}`;

// 计算过程：
// 对于 A 的每个成员，与 B 的每个成员组合
// = "a-1" | "a-2" | "b-1" | "b-2"

// 多个联合类型时：
type X = "x" | "y"; // 2 个
type Y = "1" | "2" | "3"; // 3 个
type Z = "a" | "b"; // 2 个
type Result = `${X}-${Y}-${Z}`; // 2 × 3 × 2 = 12 种组合
```

**Q4: 如何使用模板字面量类型实现类型安全的路由参数解析？**

```typescript
type ParseParams<Route extends string> =
  Route extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ParseParams<`/${Rest}`>
    : Route extends `${string}:${infer Param}`
    ? Param
    : never;

type RouteParams<Route extends string> = {
  [K in ParseParams<Route>]: string;
};

// 使用
type UserRoute = "/users/:userId/posts/:postId";
type Params = RouteParams<UserRoute>;
// { userId: string; postId: string }
```

**Q5: 模板字面量类型有哪些性能注意事项？**

A: 主要性能问题和解决方案：

1. **类型爆炸**：大联合类型的笛卡尔积可能产生数千种组合
   - 解决：限制联合类型大小，使用 string 代替大联合

2. **递归深度限制**：TypeScript 限制递归约 50 层
   - 解决：添加深度限制参数，使用尾递归优化

3. **编译时间增加**：复杂模板类型增加编译时间
   - 解决：缓存中间类型，使用条件短路

4. **IDE 响应变慢**：影响自动补全性能
   - 解决：显式声明常用成员，避免内联复杂类型

### 实战问题

**Q6: 实现一个驼峰命名和蛇形命名相互转换的类型工具。**

```typescript
// 驼峰 -> 蛇形
type CamelToSnake<S extends string> = S extends `${infer F}${infer R}`
  ? F extends Uppercase<F>
    ? `_${Lowercase<F>}${CamelToSnake<R>}`
    : `${F}${CamelToSnake<R>}`
  : S;

// 蛇形 -> 驼峰
type SnakeToCamel<S extends string> = S extends `${infer F}_${infer R}`
  ? `${Lowercase<F>}${Capitalize<SnakeToCamel<R>>}`
  : Lowercase<S>;

// 转换对象键
type ConvertKeys<T, Converter extends (s: string) => string> = {
  [K in keyof T as K extends string ? ReturnType<Converter> : K]: T[K];
};
```

**Q7: 如何创建类型安全的事件处理器类型？**

```typescript
type EventMap = {
  click: { x: number; y: number };
  keydown: { key: string };
};

type EventHandler<K extends keyof EventMap> = `on${Capitalize<string & K>}`;

type EventHandlers<T extends Record<string, any>> = {
  [K in keyof T as EventHandler<K & string>]?: (event: T[K]) => void;
};

type Handlers = EventHandlers<EventMap>;
// { onClick?: (event: { x: number; y: number }) => void;
//   onKeydown?: (event: { key: string }) => void; }
```

## 延伸阅读

### 官方文档

- [TypeScript 官方文档 - Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [TypeScript 4.1 发布说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html)
- [TypeScript 官方文档 - Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [TypeScript 官方文档 - Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)

### 学习资源

- [Type Challenges](https://github.com/type-challenges/type-challenges) - 类型体操练习，包含大量模板字面量类型题目
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - TypeScript 深入指南
- [Total TypeScript](https://www.totaltypescript.com/) - Matt Pocock 的 TypeScript 高级教程
- [TypeScript Playground](https://www.typescriptlang.org/play) - 在线实验环境

### 相关工具库

- [ts-toolbelt](https://github.com/millsp/ts-toolbelt) - TypeScript 类型工具库，包含丰富的字符串操作类型
- [type-fest](https://github.com/sindresorhus/type-fest) - 实用类型集合
- [ts-pattern](https://github.com/gvergnaud/ts-pattern) - 类型安全的模式匹配库

### 进阶主题

- 条件类型与模板字面量类型的深度结合
- 递归类型在字符串解析中的高级应用
- 类型级别的正则表达式模拟
- 模板字面量类型在框架设计中的应用（如 tRPC、Prisma、Zod）
- 编译器对模板字面量类型的优化策略

---

模板字面量类型是 TypeScript 类型系统中最具表达力的特性之一。它将 JavaScript 模板字符串的灵活性引入类型层面，使得我们能够构建精确的字符串约束、实现复杂的类型转换、以及创建类型安全的 API。掌握模板字面量类型，不仅能够提升代码的类型安全性，更能够帮助开发者设计出更加优雅和健壮的类型系统。在实际应用中，应当在类型精确性和编译性能之间寻找平衡，避免过度复杂的类型定义影响开发体验。
