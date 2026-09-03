---
title: TypeScript 模块增强 (Module Augmentation)
description: 深入理解 TypeScript 模块增强机制，掌握声明合并、模块扩展、全局增强等高级技术，学会如何安全地扩展第三方类型定义
track: typescript
section: patterns
difficulty: advanced
tags:
  - TypeScript
  - 模块增强
  - 声明合并
  - 类型扩展
  - 第三方类型
status: imported
origin: old/src/content/docs/typescript/module-augmentation.zh.md
divergence: 0.213
issues:
  - title-lang-en
  - missing-subcategory-en
  - missing-subcategory-zh
  - title-language
legacy:
  category: TypeScript
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

## 概念解释

模块增强 (Module Augmentation) 是 TypeScript 提供的一种强大机制，允许开发者在不修改原始模块源代码的情况下，扩展现有模块的类型定义。这一特性建立在 TypeScript 的声明合并 (Declaration Merging) 基础之上。

### 什么是模块增强？

模块增强本质上是一种"打补丁"的方式，让你能够：

1. **扩展第三方库的类型**：当第三方库的类型定义不完整或需要自定义扩展时
2. **添加全局类型**：向 Window、NodeJS.Global 等全局对象添加自定义属性
3. **扩展内置类型**：增强 Array、String 等原生类型的方法定义
4. **模块化类型组织**：将类型定义分散到多个文件中进行管理

### 历史背景

在 TypeScript 2.0 之前，扩展第三方模块的类型是一个痛点。开发者需要：
- 修改 `node_modules` 中的类型文件（不推荐）
- 使用 `any` 类型绑定（丧失类型安全）
- 完全重写类型定义（工作量大）

TypeScript 2.0 引入了模块增强语法，使得类型扩展变得优雅且可维护。

### 解决的问题

| 问题场景 | 传统方案 | 模块增强方案 |
|---------|---------|-------------|
| 第三方库类型不完整 | 使用 `any` 或忽略错误 | 声明缺失的类型 |
| 需要添加自定义属性 | 类型断言 | 接口合并 |
| 全局对象扩展 | 污染全局命名空间 | 全局增强声明 |
| 插件系统类型支持 | 手动维护类型 | 动态模块增强 |

## 核心原理

### 声明合并 (Declaration Merging)

声明合并是模块增强的理论基础。TypeScript 编译器会将同名的多个声明合并为单个定义。

```typescript
// 接口合并示例
interface User {
  name: string;
}

interface User {
  age: number;
}

// 合并后等价于：
// interface User {
//   name: string;
//   age: number;
// }

const user: User = {
  name: "Alice",
  age: 30
};
```

### 合并规则

TypeScript 支持以下声明的合并：

| 声明类型 | 可合并对象 |
|---------|-----------|
| 接口 (Interface) | 接口、命名空间 |
| 命名空间 (Namespace) | 命名空间、类、函数、枚举 |
| 类 (Class) | 命名空间 |
| 函数 (Function) | 命名空间 |
| 枚举 (Enum) | 命名空间 |

**注意**：类与类之间、变量与变量之间不能合并。

### 模块增强的工作机制

```typescript
// 原始模块 (some-library.d.ts)
declare module "some-library" {
  export interface Config {
    baseUrl: string;
  }
}

// 增强文件 (augment.d.ts)
declare module "some-library" {
  interface Config {
    timeout?: number;  // 新增属性
  }
}

// 使用时两者自动合并
import { Config } from "some-library";
const config: Config = {
  baseUrl: "https://api.example.com",
  timeout: 5000  // 类型安全！
};
```

### 编译器处理流程

1. **收集阶段**：编译器扫描所有 `.ts` 和 `.d.ts` 文件
2. **识别阶段**：识别同名的模块声明
3. **合并阶段**：按照合并规则将声明组合
4. **验证阶段**：检查合并后的类型是否一致
5. **输出阶段**：生成最终的类型定义

## 核心要点

### 模块增强 vs 全局增强

```typescript
// 模块增强：必须在模块文件中（有 import/export）
import "express";

declare module "express" {
  interface Request {
    userId?: string;
  }
}

// 全局增强：在全局作用域添加类型
declare global {
  interface Window {
    myApp: {
      version: string;
    };
  }
}

export {}; // 确保文件被视为模块
```

### 增强位置要求

| 增强类型 | 文件类型要求 | 语法 |
|---------|-------------|------|
| 模块增强 | 必须是模块文件 | `declare module "xxx" {}` |
| 全局增强 | 必须是模块文件 | `declare global {}` |
| 脚本声明 | 可以是脚本文件 | 直接声明 |

### 接口成员合并策略

```typescript
interface Animal {
  name: string;
  speak(): void;
}

interface Animal {
  age: number;
  speak(): string;  // 函数重载，不是覆盖
}

// 合并结果
interface Animal {
  name: string;
  age: number;
  speak(): void;
  speak(): string;  // 两个重载签名都保留
}
```

### 命名空间合并

```typescript
// 为类添加静态成员
class Album {
  label: Album.AlbumLabel;
}

namespace Album {
  export interface AlbumLabel {
    name: string;
  }
}

// 使用
const album = new Album();
const label: Album.AlbumLabel = { name: "EMI" };
```

### 增强的作用域

- 模块增强只在当前文件及其导入者中生效
- 全局增强在整个项目中生效
- 增强声明必须与原始声明兼容

## 代码示例

### 示例 1：扩展 Express Request

```typescript
// types/express.d.ts
import { User } from "../models/User";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    sessionId?: string;
    startTime?: number;
  }
}

// middleware/auth.ts
import { Request, Response, NextFunction } from "express";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // req.user 现在有正确的类型
  if (req.user) {
    console.log(`User: ${req.user.name}`);
  }
  next();
};
```

### 示例 2：扩展 Vue 组件实例

```typescript
// types/vue.d.ts
import Vue from "vue";
import { AxiosInstance } from "axios";

declare module "vue/types/vue" {
  interface Vue {
    $http: AxiosInstance;
    $eventBus: Vue;
  }
}

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    myCustomOption?: string;
  }
}

// 使用
export default Vue.extend({
  myCustomOption: "hello",
  mounted() {
    this.$http.get("/api/data");  // 类型安全
    this.$eventBus.$emit("event");
  }
});
```

### 示例 3：扩展全局 Window 对象

```typescript
// types/global.d.ts
interface AppConfig {
  apiBaseUrl: string;
  version: string;
  features: {
    darkMode: boolean;
    analytics: boolean;
  };
}

declare global {
  interface Window {
    __APP_CONFIG__: AppConfig;
    gtag: (...args: unknown[]) => void;
  }

  // 扩展 NodeJS 全局对象
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      API_KEY: string;
      DATABASE_URL: string;
    }
  }
}

export {};

// 使用
const config = window.__APP_CONFIG__;
console.log(config.version);

const apiKey = process.env.API_KEY;  // string 类型，非 string | undefined
```

### 示例 4：扩展第三方库类型

```typescript
// types/lodash.d.ts
import _ from "lodash";

declare module "lodash" {
  interface LoDashStatic {
    /**
     * 自定义工具函数：深度冻结对象
     */
    deepFreeze<T extends object>(obj: T): Readonly<T>;
  }
}

// 实现
import _ from "lodash";

_.mixin({
  deepFreeze<T extends object>(obj: T): Readonly<T> {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = (obj as Record<string, unknown>)[prop];
      if (
        value !== null &&
        typeof value === "object" &&
        !Object.isFrozen(value)
      ) {
        _.deepFreeze(value as object);
      }
    });
    return obj as Readonly<T>;
  }
});

// 使用
const frozen = _.deepFreeze({ a: { b: 1 } });  // 类型安全
```

### 示例 5：条件模块增强

```typescript
// types/conditional.d.ts

// 根据环境增强不同的类型
declare module "my-library" {
  interface Config {
    mode: "development" | "production";
  }
}

// 开发环境特定增强
declare module "my-library" {
  interface Config {
    debug?: boolean;
    verbose?: boolean;
  }
}

// 生产环境特定增强
declare module "my-library" {
  interface Config {
    sentry?: {
      dsn: string;
    };
    performance?: {
      tracking: boolean;
    };
  }
}
```

### 示例 6：为类添加静态属性和方法

```typescript
// 原始类
class MyClass {
  instanceMethod() {
    return "instance";
  }
}

// 通过命名空间增强添加静态成员
namespace MyClass {
  export const VERSION = "1.0.0";

  export interface Options {
    debug: boolean;
  }

  export function create(options: Options): MyClass {
    console.log("Creating with debug:", options.debug);
    return new MyClass();
  }
}

// 使用
console.log(MyClass.VERSION);  // "1.0.0"
const instance = MyClass.create({ debug: true });
const options: MyClass.Options = { debug: false };
```

### 示例 7：扩展 Array 原型方法

```typescript
// types/array.d.ts
interface Array<T> {
  /**
   * 返回数组的第一个元素
   */
  first(): T | undefined;

  /**
   * 返回数组的最后一个元素
   */
  last(): T | undefined;

  /**
   * 返回去重后的数组
   */
  unique(): T[];

  /**
   * 按指定属性分组
   */
  groupBy<K extends keyof T>(key: K): Record<string, T[]>;
}

// 实现 (array-extensions.ts)
Array.prototype.first = function<T>(this: T[]): T | undefined {
  return this[0];
};

Array.prototype.last = function<T>(this: T[]): T | undefined {
  return this[this.length - 1];
};

Array.prototype.unique = function<T>(this: T[]): T[] {
  return [...new Set(this)];
};

Array.prototype.groupBy = function<T, K extends keyof T>(
  this: T[],
  key: K
): Record<string, T[]> {
  return this.reduce((acc, item) => {
    const groupKey = String(item[key]);
    (acc[groupKey] = acc[groupKey] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

// 使用
const numbers = [1, 2, 2, 3, 3, 3];
console.log(numbers.first());   // 1
console.log(numbers.last());    // 3
console.log(numbers.unique());  // [1, 2, 3]

const users = [
  { name: "Alice", role: "admin" },
  { name: "Bob", role: "user" },
  { name: "Charlie", role: "admin" }
];
console.log(users.groupBy("role"));
// { admin: [...], user: [...] }
```

## 最佳实践

### 类型文件组织结构

```
src/
├── types/
│   ├── global.d.ts          # 全局类型增强
│   ├── express.d.ts         # Express 扩展
│   ├── vue.d.ts             # Vue 扩展
│   └── index.d.ts           # 类型导出汇总
├── @types/
│   └── my-untyped-lib/      # 无类型库的声明
│       └── index.d.ts
└── tsconfig.json
```

### tsconfig.json 配置

```json
{
  "compilerOptions": {
    "typeRoots": [
      "./node_modules/@types",
      "./src/types",
      "./src/@types"
    ],
    "types": [
      "node",
      "jest"
    ],
    "baseUrl": ".",
    "paths": {
      "*": ["src/types/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts"
  ]
}
```

### 模块增强命名约定

```typescript
// 推荐：使用描述性的文件名
// types/express-augment.d.ts
// types/vue-custom-properties.d.ts

// 推荐：在增强中添加详细注释
declare module "express-serve-static-core" {
  /**
   * 扩展 Express Request 接口
   * @description 添加用户认证相关属性
   * @since v1.2.0
   */
  interface Request {
    /**
     * 当前已认证的用户
     * 由 authMiddleware 设置
     */
    user?: import("../models/User").User;
  }
}
```

### 使用接口而非类型别名

```typescript
// 推荐：使用 interface，支持声明合并
declare module "some-lib" {
  interface Options {
    timeout: number;
  }
}

// 不推荐：type 不支持声明合并
declare module "some-lib" {
  type Options = {  // 错误：重复标识符
    timeout: number;
  };
}
```

### 保持增强的最小化

```typescript
// 推荐：只添加必要的属性
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

// 不推荐：添加过多不相关的属性
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    companyId?: string;
    permissions?: string[];
    settings?: Record<string, unknown>;
    cache?: Map<string, unknown>;
    // ... 过多属性导致维护困难
  }
}
```

### 版本兼容性考虑

```typescript
// types/library-augment.d.ts

// 使用条件类型处理版本差异
declare module "some-library" {
  // v2.x 新增的属性
  interface Config {
    /**
     * @since 2.0.0
     * @deprecated 3.0.0 中将移除，请使用 newOption
     */
    legacyOption?: boolean;

    /**
     * @since 2.1.0
     */
    newOption?: string;
  }
}
```

## 常见陷阱

### 陷阱 1：忘记导出语句

```typescript
// 错误：缺少导出，文件被视为脚本而非模块
declare global {
  interface Window {
    myProp: string;
  }
}
// 全局增强不会生效！

// 正确：添加空导出
declare global {
  interface Window {
    myProp: string;
  }
}
export {};  // 关键！
```

### 陷阱 2：模块路径不匹配

```typescript
// 错误：模块名称必须完全匹配
declare module "Express" {  // 大小写错误
  interface Request {
    user?: User;
  }
}

// 正确：Express 实际导出的模块名
declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
```

### 陷阱 3：循环依赖

```typescript
// types/a.d.ts
import { B } from "./b";  // 导入 B
declare module "some-lib" {
  interface A {
    b: B;
  }
}

// types/b.d.ts
import { A } from "./a";  // 循环导入！
declare module "some-lib" {
  interface B {
    a: A;
  }
}

// 解决方案：使用类型导入或合并到同一文件
import type { B } from "./b";  // 使用 type-only 导入
```

### 陷阱 4：重复声明冲突

```typescript
// 错误：非接口类型不能合并
declare module "lib" {
  export type Config = { a: string };
}

declare module "lib" {
  export type Config = { b: number };  // 错误：重复标识符
}

// 正确：使用接口
declare module "lib" {
  export interface Config { a: string }
}

declare module "lib" {
  export interface Config { b: number }  // 正确合并
}
```

### 陷阱 5：增强顺序问题

```typescript
// 文件执行顺序可能导致类型不可用
// types/express.d.ts
import { User } from "../models/User";  // 如果 User 尚未定义...

declare module "express" {
  interface Request {
    user?: User;  // User 可能是 any
  }
}

// 解决方案：确保依赖顺序正确
// 或使用动态导入类型
declare module "express" {
  interface Request {
    user?: import("../models/User").User;
  }
}
```

### 陷阱 6：类型擦除问题

```typescript
// 运行时不存在的属性
declare global {
  interface Window {
    myConfig: AppConfig;
  }
}

// 使用时需要确保运行时存在
if (typeof window !== "undefined" && window.myConfig) {
  // 安全使用
  console.log(window.myConfig.version);
}

// 不安全：直接访问可能抛出错误
console.log(window.myConfig.version);  // 类型正确但运行时可能失败
```

### 陷阱 7：泛型增强限制

```typescript
// 错误：不能在增强中添加新的泛型参数
declare module "lib" {
  interface Container<T> {
    value: T;
  }
}

declare module "lib" {
  interface Container<T, U> {  // 错误：泛型参数不匹配
    extra: U;
  }
}

// 正确：保持相同的泛型签名
declare module "lib" {
  interface Container<T> {
    extra?: unknown;  // 使用兼容类型
  }
}
```

## 性能考量

### 编译时性能

1. **类型合并开销**
   - 大量增强声明会增加编译器合并工作
   - 建议将相关增强合并到同一文件

```typescript
// 推荐：合并相关增强
declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    session?: Session;
    logger?: Logger;
  }
}

// 不推荐：分散在多个文件
// request-user.d.ts, request-session.d.ts, request-logger.d.ts
```

2. **类型检查深度**

```typescript
// 避免过深的嵌套类型增强
declare module "lib" {
  interface Config {
    level1: {
      level2: {
        level3: {
          // 深层嵌套影响类型检查性能
        }
      }
    }
  }
}

// 推荐：使用独立接口
interface DeepConfig {
  setting: string;
}

declare module "lib" {
  interface Config {
    deep: DeepConfig;
  }
}
```

### 运行时性能

模块增强是纯类型操作，**不会影响运行时性能**。但需注意：

1. 原型扩展会影响运行时

```typescript
// 原型扩展有运行时开销
Array.prototype.first = function() {
  return this[0];
};

// 考虑使用静态工具函数替代
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

2. 类型守卫的运行时成本

```typescript
// 类型增强可能需要运行时验证
interface Request {
  user?: User;
}

// 需要运行时检查
function handler(req: Request) {
  if (req.user) {  // 运行时检查
    console.log(req.user.name);
  }
}
```

### IDE 性能

大量类型增强可能影响 IDE 响应速度：

```json
// tsconfig.json 优化
{
  "compilerOptions": {
    "skipLibCheck": true,  // 跳过 .d.ts 文件检查
    "incremental": true,   // 增量编译
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

## 实战场景

### 场景 1：构建插件系统

```typescript
// core/plugin-system.ts
export interface PluginContext {
  version: string;
}

export interface Plugin {
  name: string;
  install(context: PluginContext): void;
}

// plugins/logger/types.d.ts
import { PluginContext } from "../../core/plugin-system";

declare module "../../core/plugin-system" {
  interface PluginContext {
    logger: {
      info(msg: string): void;
      error(msg: string): void;
    };
  }
}

// plugins/logger/index.ts
import { Plugin, PluginContext } from "../../core/plugin-system";

export const loggerPlugin: Plugin = {
  name: "logger",
  install(context: PluginContext) {
    context.logger = {
      info: (msg) => console.log(`[INFO] ${msg}`),
      error: (msg) => console.error(`[ERROR] ${msg}`)
    };
  }
};

// app.ts
import { PluginContext } from "./core/plugin-system";
import "./plugins/logger/types";  // 导入类型增强

function initApp(context: PluginContext) {
  context.logger.info("App initialized");  // 类型安全！
}
```

### 场景 2：国际化类型安全

```typescript
// types/i18n.d.ts
import "vue-i18n";

// 定义翻译键类型
interface TranslationSchema {
  common: {
    save: string;
    cancel: string;
    delete: string;
  };
  user: {
    profile: string;
    settings: string;
    logout: string;
  };
  errors: {
    notFound: string;
    unauthorized: string;
    serverError: string;
  };
}

declare module "vue-i18n" {
  export interface DefineLocaleMessage extends TranslationSchema {}
}

// 使用
import { useI18n } from "vue-i18n";

const { t } = useI18n();
t("common.save");       // 正确
t("user.profile");      // 正确
t("invalid.key");       // 类型错误！
```

### 场景 3：数据库 ORM 扩展

```typescript
// types/prisma.d.ts
import { PrismaClient } from "@prisma/client";

declare module "@prisma/client" {
  interface PrismaClient {
    // 软删除扩展
    $softDelete<T extends keyof PrismaClient>(
      model: T,
      where: Parameters<PrismaClient[T]["findFirst"]>[0]["where"]
    ): Promise<{ count: number }>;

    // 审计日志扩展
    $withAudit<T>(
      operation: () => Promise<T>,
      metadata: { userId: string; action: string }
    ): Promise<T>;
  }
}

// extensions/prisma-extensions.ts
import { PrismaClient } from "@prisma/client";

export function extendPrisma(prisma: PrismaClient) {
  return prisma.$extends({
    model: {
      $allModels: {
        async softDelete<T>(
          this: T,
          where: Record<string, unknown>
        ): Promise<{ count: number }> {
          const context = Prisma.getExtensionContext(this);
          return (context as any).updateMany({
            where,
            data: { deletedAt: new Date() }
          });
        }
      }
    }
  });
}
```

### 场景 4：状态管理类型增强

```typescript
// store/modules/user.ts
export interface UserState {
  id: string | null;
  name: string;
  email: string;
}

export const userModule = {
  state: (): UserState => ({
    id: null,
    name: "",
    email: ""
  }),
  // ... actions, mutations
};

// types/vuex.d.ts
import { Store } from "vuex";
import { UserState } from "../store/modules/user";

interface RootState {
  user: UserState;
  // 其他模块状态...
}

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $store: Store<RootState>;
  }
}

declare module "vuex" {
  export function useStore(): Store<RootState>;
}

// 组件中使用
import { useStore } from "vuex";

const store = useStore();
store.state.user.name;  // 完整类型推导
```

### 场景 5：API 响应类型增强

```typescript
// types/axios.d.ts
import "axios";

// 定义 API 响应格式
interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

declare module "axios" {
  export interface AxiosResponse<T = unknown> {
    // 原始响应数据
    data: ApiResponse<T>;
  }

  export interface AxiosRequestConfig {
    // 自定义配置
    skipErrorHandler?: boolean;
    retryCount?: number;
  }
}

// api/user.ts
import axios from "axios";

interface User {
  id: string;
  name: string;
}

async function getUser(id: string) {
  const response = await axios.get<User>(`/api/users/${id}`, {
    skipErrorHandler: true  // 类型安全的自定义配置
  });

  // response.data 类型是 ApiResponse<User>
  return response.data.data;  // 返回 User 类型
}
```

## 面试要点

### Q1: 什么是声明合并？哪些声明可以合并？

**答案**：声明合并是 TypeScript 编译器将同名的多个声明合并为单一定义的机制。

可合并的声明：
- 接口与接口
- 命名空间与命名空间
- 命名空间与类、函数、枚举

不可合并的声明：
- 类与类
- 变量与变量
- 类型别名不支持合并

### Q2: 模块增强和全局增强有什么区别？

**答案**：

| 特性 | 模块增强 | 全局增强 |
|-----|---------|---------|
| 语法 | `declare module "xxx" {}` | `declare global {}` |
| 作用域 | 特定模块 | 全局作用域 |
| 使用场景 | 扩展第三方库类型 | 扩展 Window、NodeJS.Global 等 |
| 文件要求 | 必须是模块文件 | 必须是模块文件 |

### Q3: 如何正确扩展 Express 的 Request 类型？

**答案**：

```typescript
// 错误：模块名不正确
declare module "express" {
  interface Request {
    user?: User;
  }
}

// 正确：使用正确的内部模块名
declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
```

关键点：需要找到实际定义 Request 接口的模块。

### Q4: 为什么使用 interface 而不是 type 进行模块增强？

**答案**：

1. `interface` 支持声明合并，`type` 不支持
2. 同名 `type` 会导致编译错误
3. `interface` 可以被扩展和继承

```typescript
// interface 可以合并
interface A { x: number }
interface A { y: number }  // OK

// type 不能合并
type B = { x: number }
type B = { y: number }  // Error: 重复标识符
```

### Q5: 模块增强有哪些常见陷阱？

**答案**：

1. 忘记添加 `export {}` 导致文件不是模块
2. 模块路径大小写或名称不匹配
3. 循环依赖导致类型不可用
4. 尝试合并非接口类型
5. 运行时未初始化增强的属性

### Q6: 如何为没有类型定义的第三方库创建类型？

**答案**：

```typescript
// 方法 1：在 @types 目录下创建
// src/@types/untyped-lib/index.d.ts
declare module "untyped-lib" {
  export function doSomething(x: string): number;
  export const VERSION: string;
}

// 方法 2：使用通配符模块声明
declare module "untyped-*" {
  const content: any;
  export default content;
}

// 方法 3：创建 ambient 声明
declare module "untyped-lib";  // 所有导入都是 any
```

### Q7: 解释 TypeScript 中 `import type` 在模块增强中的作用

**答案**：

`import type` 只导入类型信息，不产生运行时代码，这对于模块增强很重要：

```typescript
// 使用 import type 避免循环依赖
import type { User } from "./models";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

// 或使用内联导入类型
declare module "express-serve-static-core" {
  interface Request {
    user?: import("./models").User;
  }
}
```

好处：
- 避免运行时导入
- 减少循环依赖问题
- 明确标识只用于类型

## 延伸阅读

### 官方文档
- [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [TypeScript Module Augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)
- [TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

### 深度文章
- [Augmenting Global & Module Scope in TypeScript](https://mariusschulz.com/blog/augmenting-global-and-module-scope-in-typescript)
- [TypeScript Evolution: Declaration Merging](https://blog.mariusschulz.com/2017/05/26/typescript-2-3-generic-parameter-defaults)
- [Extending Third-Party Declarations in TypeScript](https://dev.to/macsikora/extending-typescript-declarations-4jhk)

### 相关工具
- [dts-gen](https://github.com/microsoft/dts-gen) - 自动生成 .d.ts 文件
- [dtslint](https://github.com/microsoft/dtslint) - 检查类型定义质量
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) - 社区类型定义仓库

### 书籍推荐
- 《Programming TypeScript》- Boris Cherny
- 《Effective TypeScript》- Dan Vanderkam
- 《TypeScript 编程》(中文版)
