---
title: TypeScript 渐进式迁移策略
description: JavaScript 项目迁移到 TypeScript 的完整指南：规划策略、配置设置、类型覆盖率提升以及大规模迁移的最佳实践
track: typescript
section: config-migration
difficulty: intermediate
tags:
  - TypeScript
  - 迁移
  - JavaScript
  - 重构
  - 类型安全
  - 遗留代码
status: imported
origin: old/src/content/docs/typescript/progressive-migration.zh.md
divergence: 0.235
issues: []
legacy:
  category: TypeScript
  subcategory: 迁移
  order: 20
  lastUpdated: 2026-01-22
---

将 JavaScript 代码库迁移到 TypeScript 是一项需要周密计划和执行的重大工程。渐进式迁移策略允许团队逐步采用 TypeScript，在持续提升类型安全性的同时将干扰降到最低。本文探讨将 JavaScript 项目成功迁移到 TypeScript 的经过验证的策略、工具和最佳实践。

## 概念解释

### 什么是渐进式迁移？

渐进式迁移是一种将 JavaScript 代码库逐步转换为 TypeScript 的方法。与一次性重写整个代码库（"大爆炸"式迁移）不同，你可以逐文件、逐模块地引入 TypeScript，同时在整个过程中保持应用程序的正常运行。

```
JavaScript 代码库 (100%)
         ↓
    阶段 1: 设置与配置
         ↓
    阶段 2: 核心工具 (20% TS)
         ↓
    阶段 3: 共享组件 (50% TS)
         ↓
    阶段 4: 功能模块 (80% TS)
         ↓
    阶段 5: 严格模式与清理 (100% TS)
         ↓
TypeScript 代码库 (100%)
```

### 为什么选择渐进式迁移？

| 方式 | 优点 | 缺点 |
|----------|------|------|
| 大爆炸式 | 立即获得完整类型安全 | 高风险，阻塞开发 |
| 渐进式 | 低风险，持续交付 | 临时存在混合代码库 |

渐进式迁移具有以下优势：

1. **降低风险**：更改是增量的且可逆的
2. **持续交付**：应用程序在整个过程中保持可部署
3. **学习曲线**：团队成员可以逐步学习 TypeScript
4. **即时收益**：尽早开始获得类型安全的好处
5. **可管理范围**：每个阶段都有明确、可实现的目标

### 迁移前提条件

在开始迁移之前，评估项目的准备情况：

```typescript
// 迁移准备检查清单
interface MigrationReadiness {
  // 构建系统
  buildToolSupportsTS: boolean;      // Webpack、Vite 等
  canConfigureTSLoader: boolean;     // ts-loader、esbuild 等

  // 测试
  testsExist: boolean;               // 单元/集成测试
  testCoverage: number;              // 代码覆盖率百分比

  // 团队
  teamTSExperience: "none" | "some" | "experienced";
  trainingPlanned: boolean;

  // 代码库
  codebaseSize: "small" | "medium" | "large";
  hasTypeDependencies: boolean;      // @types/* 包是否可用
  documentationExists: boolean;
}
```

## 核心原理

### 迁移金字塔

有效的迁移遵循自下而上的方法，从基础代码开始：

```
                    ┌─────────────┐
                    │   页面/     │  ← 最后迁移
                    │   路由      │
                 ┌──┴─────────────┴──┐
                 │      组件         │
              ┌──┴───────────────────┴──┐
              │    服务/Hooks           │
           ┌──┴─────────────────────────┴──┐
           │        工具/辅助函数          │
        ┌──┴───────────────────────────────┴──┐
        │          类型/接口定义              │  ← 首先迁移
        └─────────────────────────────────────┘
```

### 类型安全光谱

迁移涉及在类型安全光谱上移动：

```typescript
// 级别 0：纯 JavaScript
function processData(data) {
  return data.map(item => item.value * 2);
}

// 级别 1：JSDoc 注解
/**
 * @param {Array<{value: number}>} data
 * @returns {number[]}
 */
function processData(data) {
  return data.map(item => item.value * 2);
}

// 级别 2：带隐式 any 的 TypeScript
function processData(data: any): any {
  return data.map((item: any) => item.value * 2);
}

// 级别 3：带宽松类型的 TypeScript
interface DataItem {
  value: number;
  [key: string]: any;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value * 2);
}

// 级别 4：带严格类型的 TypeScript
interface DataItem {
  readonly id: string;
  value: number;
  metadata?: Record<string, unknown>;
}

function processData(data: readonly DataItem[]): number[] {
  return data.map(item => item.value * 2);
}
```

### 兼容层

在迁移过程中，你需要保持 JS 和 TS 代码之间的兼容性：

```typescript
// types/legacy.d.ts - JavaScript 模块的类型声明
declare module "legacy-module" {
  export function legacyFunction(input: unknown): unknown;
  export const legacyConfig: Record<string, any>;
}

// 类型安全使用的包装器
// utils/legacyWrapper.ts
import { legacyFunction } from "legacy-module";

interface TypedInput {
  id: string;
  data: number[];
}

interface TypedOutput {
  result: string;
  success: boolean;
}

export function typedLegacyFunction(input: TypedInput): TypedOutput {
  const result = legacyFunction(input);

  // 运行时验证
  if (
    typeof result === "object" &&
    result !== null &&
    "result" in result &&
    "success" in result
  ) {
    return result as TypedOutput;
  }

  throw new Error("遗留函数输出格式不符合预期");
}
```

## 核心要点

### 阶段 1：项目设置

#### 初始 TypeScript 配置

从允许 JavaScript 文件的宽松配置开始：

```json
// tsconfig.json - 初始迁移配置
{
  "compilerOptions": {
    // 允许 JavaScript 文件
    "allowJs": true,
    "checkJs": false,

    // 初始时宽松的类型检查
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,

    // 模块设置
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "resolveJsonModule": true,

    // 输出设置
    "target": "ES2020",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,

    // 调试用的源码映射
    "sourceMap": true,

    // 路径别名
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 目录结构

为迁移组织你的项目：

```
src/
├── types/              # 共享类型定义
│   ├── index.ts
│   ├── api.ts
│   └── models.ts
├── utils/              # 首先迁移（纯函数）
│   ├── helpers.ts      # 已转换为 TS
│   └── legacy.js       # 尚未转换
├── services/           # API 和业务逻辑
│   ├── api.ts
│   └── auth.js
├── components/         # UI 组件
│   ├── Button.tsx
│   └── Form.jsx
└── pages/              # 最后迁移
    ├── Home.tsx
    └── Dashboard.jsx
```

### 阶段 2：类型基础

#### 创建共享类型

定义将在整个代码库中使用的核心类型：

```typescript
// src/types/models.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "admin" | "editor" | "viewer";

export interface ApiResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// src/types/api.ts
export interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  timeout?: number;
}

export type RequestInterceptor = (config: RequestConfig) => RequestConfig;
export type ResponseInterceptor<T> = (response: T) => T;
```

#### JSDoc 作为桥梁

在转换之前使用 JSDoc 为 JavaScript 文件添加类型：

```javascript
// src/utils/validation.js

/**
 * @typedef {Object} ValidationRule
 * @property {string} field
 * @property {(value: unknown) => boolean} validate
 * @property {string} message
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

/**
 * 根据一组规则验证数据
 * @param {Record<string, unknown>} data - 要验证的数据
 * @param {ValidationRule[]} rules - 验证规则
 * @returns {ValidationResult}
 */
export function validateData(data, rules) {
  const errors = [];

  for (const rule of rules) {
    const value = data[rule.field];
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 阶段 3：逐步文件转换

#### 将 JavaScript 转换为 TypeScript

按照以下流程处理每个文件：

```typescript
// 步骤 1：将 .js 重命名为 .ts（或 .jsx 重命名为 .tsx）
// 步骤 2：添加类型导入和基本注解

// 之前：utils/formatters.js
export function formatCurrency(amount, currency) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: currency
  }).format(amount);
}

export function formatDate(date, format) {
  // 实现
}

// 之后：utils/formatters.ts
type CurrencyCode = "CNY" | "USD" | "EUR" | "JPY";
type DateFormat = "short" | "medium" | "long" | "full";

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "CNY"
): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency
  }).format(amount);
}

export function formatDate(
  date: Date | string | number,
  format: DateFormat = "medium"
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  const options: Intl.DateTimeFormatOptions = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  }[format];

  return new Intl.DateTimeFormat("zh-CN", options).format(dateObj);
}
```

#### 处理第三方库

```typescript
// 选项 1：安装 @types 包
// npm install --save-dev @types/lodash

import { debounce } from "lodash";  // 类型自动可用

// 选项 2：创建本地声明
// src/types/vendors.d.ts
declare module "untyped-library" {
  export function doSomething(input: string): Promise<void>;
  export interface LibConfig {
    timeout: number;
    retries: number;
  }
}

// 选项 3：快速迁移时使用 any（不推荐长期使用）
// @ts-ignore
import { unknownFunction } from "problematic-library";
```

### 阶段 4：增量严格性

#### 渐进式 tsconfig 严格性

为不同阶段创建多个配置：

```json
// tsconfig.base.json - 共享设置
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2020",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  }
}

// tsconfig.json - 当前开发配置
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "strict": false,
    "noImplicitAny": true,  // 逐个启用
    "strictNullChecks": false
  },
  "include": ["src/**/*"]
}

// tsconfig.strict.json - 目标配置
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "allowJs": false,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src/**/*"]
}
```

#### 按文件启用严格模式

使用注释在特定文件中启用更严格的检查：

```typescript
// src/utils/critical.ts
// @ts-strict - 仅对此文件启用严格模式（提议中的特性）

// 替代方案：使用 eslint 进行按文件规则
/* eslint-disable @typescript-eslint/no-explicit-any */

// 或者创建带有更严格配置的单独目录
// src/strict/
// tsconfig.json 中设置 strict: true
```

### 阶段 5：处理遗留代码

#### 类型断言和守卫

```typescript
// 对于来自外部源的数据
interface UserData {
  id: string;
  name: string;
  email: string;
}

function isUserData(value: unknown): value is UserData {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as UserData).id === "string" &&
    typeof (value as UserData).name === "string" &&
    typeof (value as UserData).email === "string"
  );
}

// 与遗留 API 一起使用
async function fetchUser(id: string): Promise<UserData> {
  const response = await legacyApi.get(`/users/${id}`);
  const data: unknown = response.data;

  if (isUserData(data)) {
    return data;
  }

  throw new Error("用户数据格式无效");
}

// 用于遗留模块集成
import { legacyProcess } from "./legacy";

interface ProcessResult {
  success: boolean;
  output: string;
}

function processWithTypes(input: string): ProcessResult {
  // 遗留函数返回未知形状
  const result = legacyProcess(input) as Record<string, unknown>;

  return {
    success: Boolean(result.success),
    output: String(result.output ?? "")
  };
}
```

#### 迁移工具函数

```typescript
// src/utils/migration.ts

/**
 * 安全地访问未类型化对象中的嵌套属性
 */
export function safeGet<T>(
  obj: unknown,
  path: string,
  defaultValue: T
): T {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return (current as T) ?? defaultValue;
}

/**
 * 断言值不是 null 或 undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? "值为 null 或 undefined");
  }
}

/**
 * 通过验证将 unknown 转换为特定类型
 */
export function coerce<T>(
  value: unknown,
  validator: (v: unknown) => v is T,
  errorMessage: string
): T {
  if (validator(value)) {
    return value;
  }
  throw new TypeError(errorMessage);
}

// 使用
const config = safeGet(legacyConfig, "database.connection.host", "localhost");
assertDefined(user, "用户必须已登录");
const validatedData = coerce(input, isUserData, "用户数据无效");
```

## 代码示例

### 完整迁移示例：API 服务

```javascript
// 之前：services/api.js
import axios from "axios";

const instance = axios.create({
  baseURL: process.env.API_URL,
  timeout: 10000
});

export async function get(url, params) {
  const response = await instance.get(url, { params });
  return response.data;
}

export async function post(url, data) {
  const response = await instance.post(url, data);
  return response.data;
}

export async function handleApiError(error) {
  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data.message || "未知错误"
    };
  }
  return {
    status: 500,
    message: error.message
  };
}
```

```typescript
// 之后：services/api.ts
import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig
} from "axios";

// 类型
export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiErrorResponse };

// 实现
class ApiService {
  private instance: AxiosInstance;

  constructor(config: ApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 10000,
      headers: config.headers
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 如果可用则添加认证令牌
        const token = this.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );
  }

  private getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  async get<T>(
    url: string,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResult<T>> {
    try {
      const response = await this.instance.get<T>(url, { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  async post<T, D = unknown>(
    url: string,
    data?: D
  ): Promise<ApiResult<T>> {
    try {
      const response = await this.instance.post<T>(url, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  async put<T, D = unknown>(
    url: string,
    data?: D
  ): Promise<ApiResult<T>> {
    try {
      const response = await this.instance.put<T>(url, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  async delete<T>(url: string): Promise<ApiResult<T>> {
    try {
      const response = await this.instance.delete<T>(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  private handleError(error: unknown): ApiErrorResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; code?: string }>;

      if (axiosError.response) {
        return {
          status: axiosError.response.status,
          code: axiosError.response.data?.code ?? "UNKNOWN_ERROR",
          message: axiosError.response.data?.message ?? "发生错误"
        };
      }

      if (axiosError.request) {
        return {
          status: 0,
          code: "NETWORK_ERROR",
          message: "网络错误 - 请检查您的连接"
        };
      }
    }

    return {
      status: 500,
      code: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "未知错误"
    };
  }
}

// 导出单例实例
export const api = new ApiService({
  baseURL: process.env.API_URL ?? "http://localhost:3000"
});

// 导出类以供自定义实例使用
export { ApiService };
```

### React 组件迁移

```jsx
// 之前：components/UserCard.jsx
import React, { useState, useEffect } from "react";

export function UserCard({ user, onEdit, onDelete, showActions }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    setIsLoading(true);
    await onEdit(user.id);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("确定要删除吗？")) {
      setIsLoading(true);
      await onDelete(user.id);
      setIsLoading(false);
    }
  };

  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {showActions && (
        <div className="actions">
          <button onClick={handleEdit} disabled={isLoading}>
            编辑
          </button>
          <button onClick={handleDelete} disabled={isLoading}>
            删除
          </button>
        </div>
      )}
    </div>
  );
}
```

```tsx
// 之后：components/UserCard.tsx
import React, { useState, useCallback } from "react";

// 类型
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "user";
}

export interface UserCardProps {
  user: User;
  onEdit?: (userId: string) => Promise<void>;
  onDelete?: (userId: string) => Promise<void>;
  showActions?: boolean;
  className?: string;
}

// 组件
export function UserCard({
  user,
  onEdit,
  onDelete,
  showActions = true,
  className = ""
}: UserCardProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = useCallback(async (): Promise<void> => {
    if (!onEdit) return;

    setIsLoading(true);
    setError(null);

    try {
      await onEdit(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "编辑用户失败");
    } finally {
      setIsLoading(false);
    }
  }, [onEdit, user.id]);

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!onDelete) return;

    const confirmed = window.confirm(
      `确定要删除 ${user.name} 吗？`
    );

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      await onDelete(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除用户失败");
    } finally {
      setIsLoading(false);
    }
  }, [onDelete, user.id, user.name]);

  return (
    <div className={`user-card ${className}`.trim()}>
      <img
        src={user.avatar}
        alt={`${user.name} 的头像`}
        className="user-card__avatar"
      />
      <div className="user-card__info">
        <h3 className="user-card__name">{user.name}</h3>
        <p className="user-card__email">{user.email}</p>
        <span className="user-card__role">{user.role}</span>
      </div>

      {error && (
        <div className="user-card__error" role="alert">
          {error}
        </div>
      )}

      {showActions && (onEdit || onDelete) && (
        <div className="user-card__actions">
          {onEdit && (
            <button
              type="button"
              onClick={handleEdit}
              disabled={isLoading}
              className="user-card__button user-card__button--edit"
            >
              {isLoading ? "加载中..." : "编辑"}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="user-card__button user-card__button--delete"
            >
              {isLoading ? "加载中..." : "删除"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// 为向后兼容导出默认值
export default UserCard;
```

## 最佳实践

### 迁移规划

```typescript
// 创建迁移跟踪系统
interface MigrationFile {
  path: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  assignee?: string;
  priority: "high" | "medium" | "low";
  dependencies: string[];
  notes?: string;
}

interface MigrationPlan {
  phase: number;
  name: string;
  description: string;
  files: MigrationFile[];
  startDate: Date;
  targetDate: Date;
}

// 迁移计划示例
const migrationPlan: MigrationPlan[] = [
  {
    phase: 1,
    name: "基础",
    description: "设置 TypeScript 并创建核心类型",
    files: [
      {
        path: "src/types/index.ts",
        status: "completed",
        priority: "high",
        dependencies: []
      },
      {
        path: "src/utils/helpers.ts",
        status: "in-progress",
        assignee: "developer1",
        priority: "high",
        dependencies: ["src/types/index.ts"]
      }
    ],
    startDate: new Date("2024-01-01"),
    targetDate: new Date("2024-01-15")
  }
];
```

### 维护类型覆盖率报告

```bash
# 安装 type-coverage 工具
npm install -g type-coverage

# 运行覆盖率报告
type-coverage --detail --strict

# 添加到 CI 管道
# .github/workflows/type-check.yml
```

```yaml
# .github/workflows/type-check.yml
name: 类型检查

on: [push, pull_request]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx type-coverage --at-least 80
```

### 记录迁移决策

```typescript
// src/types/README.md 或内联文档

/**
 * 迁移决策日志
 *
 * 2024-01-15：为 API 响应选择可辨识联合类型而非类层次结构
 * 原因：更好的类型收窄，更简单的序列化
 *
 * 2024-01-20：对外部数据使用 `unknown` 而非 `any`
 * 原因：强制运行时验证，捕获更多错误
 *
 * 2024-02-01：为 ID 采用品牌类型
 * 原因：防止混淆不同的 ID 类型
 */

// 品牌类型实现
type Brand<K, T> = K & { __brand: T };

type UserId = Brand<string, "UserId">;
type PostId = Brand<string, "PostId">;

function createUserId(id: string): UserId {
  return id as UserId;
}

function createPostId(id: string): PostId {
  return id as PostId;
}

// 这可以防止如下错误：
// getUserById(postId) - TypeScript 会捕获这个错误！
```

### 逐步增加严格性

```json
// 第 1-2 周：从 allowJs 开始
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false
  }
}

// 第 3-4 周：启用 noImplicitAny
{
  "compilerOptions": {
    "allowJs": true,
    "noImplicitAny": true
  }
}

// 第 5-6 周：启用 strictNullChecks
{
  "compilerOptions": {
    "allowJs": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// 第 7 周+：启用其余严格选项
{
  "compilerOptions": {
    "allowJs": true,
    "strict": true
  }
}
```

## 常见陷阱

### 过度使用类型断言

```typescript
// 错误：使用断言来消除错误
function processData(data: unknown) {
  const user = data as User;  // 危险！
  return user.name.toUpperCase();
}

// 正确：在运行时验证
function processData(data: unknown) {
  if (!isUser(data)) {
    throw new Error("用户数据无效");
  }
  return data.name.toUpperCase();
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as User).name === "string" &&
    typeof (value as User).email === "string"
  );
}
```

### 忽略依赖项中的隐式 any

```typescript
// 错误：忽略来自依赖项的类型错误
// @ts-ignore
import { something } from "untyped-package";

// 正确：创建正确的声明
// src/types/untyped-package.d.ts
declare module "untyped-package" {
  export function something(input: string): Promise<Result>;

  export interface Result {
    success: boolean;
    data: unknown;
  }
}
```

### 一次转换太多文件

```typescript
// 错误：一次转换整个目录
// 这会产生大量错误并阻塞进度

// 正确：使用此检查清单逐文件转换：
interface ConversionChecklist {
  steps: string[];
}

const conversionProcess: ConversionChecklist = {
  steps: [
    "1. 将 .js 重命名为 .ts",
    "2. 添加类型导入",
    "3. 为函数参数添加类型",
    "4. 为函数返回值添加类型",
    "5. 在需要时为局部变量添加类型",
    "6. 修复产生的任何错误",
    "7. 运行测试",
    "8. 提交更改"
  ]
};
```

### 转换后不进行测试

```typescript
// 始终验证转换后的代码是否正确工作

// 原始 JavaScript 测试应该仍然通过
describe("formatCurrency", () => {
  it("正确格式化人民币", () => {
    expect(formatCurrency(1234.56, "CNY")).toBe("￥1,234.56");
  });

  it("处理零值", () => {
    expect(formatCurrency(0, "CNY")).toBe("￥0.00");
  });
});

// 添加 TypeScript 特定的测试
describe("formatCurrency 类型", () => {
  it("接受有效的货币代码", () => {
    // 此测试在编译时验证类型系统
    const result: string = formatCurrency(100, "EUR");
    expect(typeof result).toBe("string");
  });

  // TypeScript 会在编译时捕获这个：
  // formatCurrency(100, "INVALID"); // 错误！
});
```

## 性能考量

### 构建时间优化

```json
// tsconfig.json 优化以加快构建
{
  "compilerOptions": {
    // 跳过声明文件的类型检查
    "skipLibCheck": true,

    // 增量编译
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo",

    // 对大型代码库使用项目引用
    "composite": true
  }
}
```

### 大型代码库的项目引用

```json
// tsconfig.json（根目录）
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/api" },
    { "path": "./packages/ui" }
  ]
}

// packages/core/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}

// packages/api/tsconfig.json
{
  "compilerOptions": {
    "composite": true
  },
  "references": [
    { "path": "../core" }
  ]
}
```

### 并行类型检查

```bash
# 使用 fork-ts-checker 在开发期间进行并行类型检查
npm install --save-dev fork-ts-checker-webpack-plugin

# 或使用带增量的 tsc watch 模式
tsc --watch --incremental
```

## 实战场景

### 场景 1：电商平台迁移

```typescript
// 阶段 1：定义核心领域类型
// src/types/ecommerce.ts

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: Money;
  inventory: InventoryStatus;
  categories: CategoryId[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export type CurrencyCode = "CNY" | "USD" | "EUR";

export interface InventoryStatus {
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
}

// 阶段 2：迁移购物车服务
// src/services/cart.ts

export interface CartItem {
  productId: string;
  quantity: number;
  price: Money;
  addedAt: Date;
}

export interface Cart {
  id: string;
  userId: string | null;  // 访客购物车为 null
  items: CartItem[];
  subtotal: Money;
  discounts: Discount[];
  total: Money;
}

export class CartService {
  async addItem(
    cartId: string,
    productId: string,
    quantity: number
  ): Promise<Cart> {
    // 实现
  }

  async removeItem(
    cartId: string,
    productId: string
  ): Promise<Cart> {
    // 实现
  }

  calculateTotal(cart: Cart): Money {
    // 实现
  }
}
```

### 场景 2：遗留 API 客户端迁移

```typescript
// 用类型安全接口包装遗留 API 客户端

// 原始未类型化客户端
// const legacyClient = require("./legacy-api-client");

// 类型安全包装器
// src/services/typed-api-client.ts

interface LegacyApiResponse {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

interface TypedUser {
  id: string;
  username: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

class TypedApiClient {
  private legacy: typeof legacyClient;

  constructor() {
    this.legacy = legacyClient;
  }

  async getUser(id: string): Promise<TypedUser> {
    const response: LegacyApiResponse = await this.legacy.get(`/users/${id}`);

    if (response.status !== 200) {
      throw new ApiError(response.status, "获取用户失败");
    }

    return this.validateUser(response.body);
  }

  private validateUser(data: unknown): TypedUser {
    // 运行时验证
    if (!this.isTypedUser(data)) {
      throw new ValidationError("用户数据格式无效");
    }
    return data;
  }

  private isTypedUser(value: unknown): value is TypedUser {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const obj = value as Record<string, unknown>;

    return (
      typeof obj.id === "string" &&
      typeof obj.username === "string" &&
      typeof obj.email === "string" &&
      typeof obj.profile === "object" &&
      obj.profile !== null
    );
  }
}

export const apiClient = new TypedApiClient();
```

## 面试要点

### Q1：在迁移过程中启用严格模式选项的推荐顺序是什么？

**答案要点**：
- 从 `noImplicitAny` 开始 - 强制显式类型注解
- 然后启用 `strictNullChecks` - 捕获空引用错误
- 接下来添加 `strictFunctionTypes` - 确保回调类型安全
- 最后启用 `strictPropertyInitialization` - 类属性安全
- 仅当所有单独选项都通过时才使用 `strict: true`

### Q2：如何处理没有类型定义的第三方库？

**答案要点**：
- 在 DefinitelyTyped 中检查 `@types/*` 包
- 在 `src/types/` 或 `@types/` 中创建本地声明文件
- 使用 `declare module` 进行模块扩展
- 作为最后手段，使用带 TODO 注释的 `// @ts-ignore`
- 考虑将类型贡献回 DefinitelyTyped

### Q3：哪些策略有助于在迁移期间保持团队速度？

**答案要点**：
- 建立带截止日期的明确迁移阶段
- 临时允许 `any` 并使用 lint 规则跟踪使用情况
- 使用 type-coverage 工具衡量进度
- 让有经验的 TypeScript 开发者与初学者配对
- 为常见迁移模式创建共享工具
- 在初始阶段不要因为类型不完美而阻塞 PR

### Q4：如何确保外部数据在运行时的类型安全？

**答案要点**：
- 使用类型守卫进行运行时验证
- 考虑使用 Zod、io-ts 或 Yup 等验证库
- 创建验证并返回类型化数据的工厂函数
- 永远不要对外部数据信任 `as` 断言
- 为类型验证失败实现错误边界

### Q5：迁移进展顺利或不顺利的迹象是什么？

**答案要点**：
- 好迹象：类型覆盖率增加，运行时错误减少，团队信心增长
- 坏迹象：过度使用 `any`，到处都是 `@ts-ignore` 注释，构建时间爆炸
- 跟踪指标：类型覆盖率百分比，`any` 使用次数，构建时间
- 定期回顾以调整迁移策略

## 延伸阅读

- [TypeScript 官方迁移指南](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [将大型 TypeScript 代码库迁移到严格模式](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [type-coverage 工具](https://github.com/nicholasserra/type-coverage)
- [Definitely Typed 仓库](https://github.com/DefinitelyTyped/DefinitelyTyped)
- [TypeScript Deep Dive - 迁移](https://basarat.gitbook.io/typescript/getting-started/migrating)
- [Airbnb 的 TypeScript 迁移之旅](https://medium.com/airbnb-engineering/ts-migrate-a-tool-for-migrating-to-typescript-at-scale-cd23bfeb5cc)
- [ts-migrate：自动化迁移工具](https://github.com/airbnb/ts-migrate)
