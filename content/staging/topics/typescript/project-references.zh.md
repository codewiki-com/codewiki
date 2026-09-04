---
title: TypeScript 项目引用
description: 深入理解 TypeScript 项目引用机制，掌握 composite 项目、references 配置、--build 模式、增量编译与 monorepo 最佳实践
track: typescript
section: config-migration
difficulty: advanced
tags:
  - TypeScript
  - 项目引用
  - monorepo
  - 增量编译
  - 构建优化
status: imported
origin: old/src/content/docs/typescript/project-references.zh.md
divergence: 0.208
issues:
  - title-lang-en
  - title-language
legacy:
  category: TypeScript
  subcategory: 工具链
  order: 9
  lastUpdated: 2026-01-07
---

TypeScript 项目引用（Project References）是 TypeScript 3.0 引入的重要特性，它彻底改变了大型 TypeScript 项目的组织和构建方式。通过将代码库拆分为多个相互依赖的子项目，项目引用实现了增量编译、更快的构建速度和更好的代码边界管理。

## 概念解释

### 什么是项目引用？

项目引用是一种将 TypeScript 程序组织为多个较小项目的机制。每个子项目都有自己独立的 `tsconfig.json` 配置文件，可以被其他项目引用。这种结构带来了几个关键优势：

```
monorepo/
├── packages/
│   ├── core/              # 核心库
│   │   ├── src/
│   │   └── tsconfig.json
│   ├── utils/             # 工具库
│   │   ├── src/
│   │   └── tsconfig.json
│   └── app/               # 应用
│       ├── src/
│       └── tsconfig.json
└── tsconfig.json          # 根配置
```

### 解决的核心问题

在项目引用出现之前，大型 TypeScript 项目面临以下挑战：

1. **编译时间过长**：每次修改都需要重新编译整个项目
2. **代码边界模糊**：无法强制执行模块之间的依赖方向
3. **IDE 响应缓慢**：需要加载和分析整个代码库
4. **无法独立测试**：子模块无法单独编译和验证

项目引用通过以下方式解决这些问题：

- **增量编译**：只重新编译发生变化的项目及其依赖项
- **依赖边界强制**：通过显式引用声明，防止循环依赖
- **并行构建**：独立的项目可以并行编译
- **更快的编辑器响应**：IDE 只需加载当前项目及其依赖

### 适用场景

项目引用特别适合以下场景：

- **Monorepo 架构**：多个包共享代码库
- **大型单体项目**：需要拆分为逻辑模块
- **库与应用分离**：公共库被多个应用使用
- **前后端共享类型**：共享 API 类型定义

## 核心原理

### Composite 项目

`composite` 选项是项目引用的基础。它告诉 TypeScript 编译器这个项目可以被其他项目引用：

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

启用 `composite` 后会强制执行以下约束：

1. **必须启用 `declaration`**：生成 `.d.ts` 类型声明文件
2. **必须设置 `rootDir`**：明确源代码根目录
3. **所有源文件必须被 `include` 或 `files` 匹配**：不能有游离的文件
4. **启用增量编译**：自动生成 `.tsbuildinfo` 文件

### References 数组

`references` 数组声明当前项目依赖的其他项目：

```json
{
  "compilerOptions": {
    "outDir": "./dist"
  },
  "references": [
    { "path": "../core" },
    { "path": "../utils" }
  ]
}
```

每个引用包含一个 `path` 属性，指向被引用项目的目录（包含 `tsconfig.json`）或直接指向配置文件。

引用的工作机制：

1. **类型解析**：从被引用项目的 `.d.ts` 文件读取类型
2. **不会重新编译依赖**：依赖项必须已经构建完成
3. **版本感知**：通过 `.tsbuildinfo` 检测依赖是否过期

### 构建依赖图

TypeScript 编译器会根据 `references` 构建项目依赖图：

```
        ┌─────────┐
        │  core   │
        └────┬────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────┐     ┌─────────┐
│  utils  │     │   api   │
└────┬────┘     └────┬────┘
     │               │
     └───────┬───────┘
             ▼
        ┌─────────┐
        │   app   │
        └─────────┘
```

这个依赖图确保：

- 按正确的拓扑顺序编译
- 检测循环依赖
- 实现最大程度的并行化

## 核心要点

### Composite 项目的必要配置

```json
{
  "compilerOptions": {
    // 必需选项
    "composite": true,
    "declaration": true,

    // 强烈推荐
    "declarationMap": true,      // 支持跳转到源码
    "sourceMap": true,           // 调试支持
    "outDir": "./dist",          // 输出目录
    "rootDir": "./src",          // 源码根目录

    // 可选但推荐
    "incremental": true,         // 增量编译
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*"]
}
```

### 根配置文件的作用

根目录的 `tsconfig.json` 通常作为解决方案配置：

```json
{
  "files": [],                    // 不直接包含任何文件
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" },
    { "path": "./packages/api" },
    { "path": "./packages/app" }
  ]
}
```

`files: []` 表示这个配置本身不编译任何文件，只用于协调子项目。

### prepend 选项

`prepend` 选项将被引用项目的输出预置到当前项目的输出中：

```json
{
  "references": [
    { "path": "../core", "prepend": true }
  ]
}
```

这在构建单一捆绑输出时有用，但现代项目通常使用打包工具处理，较少使用此选项。

### 私有引用模式

使用 `private: true` 标记内部模块：

```json
// packages/internal/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true
  }
}
```

结合包管理器的 workspace 协议，可以控制哪些包可以被外部访问。

## 代码示例

### 基础 Monorepo 结构

创建一个包含三个包的 monorepo：

```
my-monorepo/
├── packages/
│   ├── shared/           # 共享工具库
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── server/           # 后端服务
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── client/           # 前端应用
│       ├── src/
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
├── tsconfig.json
└── package.json
```

#### 共享库配置

```json
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

```typescript
// packages/shared/src/types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
```

```typescript
// packages/shared/src/index.ts
export * from './types';

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

#### 后端服务配置

```json
// packages/server/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

```typescript
// packages/server/src/index.ts
import { User, ApiResponse, validateEmail, formatDate } from '@my-monorepo/shared';

interface CreateUserRequest {
  name: string;
  email: string;
}

function createUser(request: CreateUserRequest): ApiResponse<User> {
  if (!validateEmail(request.email)) {
    return {
      success: false,
      data: null as unknown as User,
      error: 'Invalid email format'
    };
  }

  const user: User = {
    id: crypto.randomUUID(),
    name: request.name,
    email: request.email,
    createdAt: new Date()
  };

  console.log(`User created on ${formatDate(user.createdAt)}`);

  return {
    success: true,
    data: user
  };
}

export { createUser };
```

#### 前端应用配置

```json
// packages/client/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

```typescript
// packages/client/src/index.ts
import { User, ApiResponse, formatDate } from '@my-monorepo/shared';

async function fetchUser(id: string): Promise<User | null> {
  const response = await fetch(`/api/users/${id}`);
  const result: ApiResponse<User> = await response.json();

  if (result.success) {
    console.log(`User last active: ${formatDate(result.data.createdAt)}`);
    return result.data;
  }

  console.error(result.error);
  return null;
}

export { fetchUser };
```

#### 根配置文件

```json
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/server" },
    { "path": "./packages/client" }
  ]
}
```

#### Package.json 配置

```json
// package.json (根目录)
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "tsc --build",
    "build:force": "tsc --build --force",
    "clean": "tsc --build --clean",
    "watch": "tsc --build --watch"
  }
}
```

```json
// packages/shared/package.json
{
  "name": "@my-monorepo/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
```

### 分层架构示例

展示更复杂的分层架构：

```
enterprise-app/
├── packages/
│   ├── domain/           # 领域模型层
│   ├── infrastructure/   # 基础设施层
│   ├── application/      # 应用服务层
│   └── presentation/     # 表现层
└── tsconfig.json
```

```json
// packages/domain/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true
  },
  "include": ["src/**/*"]
  // 领域层不依赖其他层
}
```

```json
// packages/infrastructure/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../domain" }
  ]
}
```

```json
// packages/application/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../domain" },
    { "path": "../infrastructure" }
  ]
}
```

```json
// packages/presentation/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../domain" },
    { "path": "../application" }
  ]
}
```

## 最佳实践

### 使用基础配置继承

创建共享的基础配置减少重复：

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  }
}
```

```json
// packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### 明确的依赖方向

建立清晰的依赖层次，避免循环依赖：

```
✅ 正确的依赖方向：
presentation → application → domain
infrastructure → domain

❌ 避免循环依赖：
domain ↔ infrastructure（错误！）
```

### 合理的项目粒度

- **太粗**：失去增量编译的优势
- **太细**：管理复杂度增加
- **建议**：按功能域或业务边界划分

```
推荐结构：
packages/
├── shared/          # 通用工具和类型
├── core/            # 核心业务逻辑
├── api/             # API 层
├── web/             # Web 前端
└── mobile/          # 移动端
```

### 配置声明文件输出

确保 IDE 和构建工具都能正确解析类型：

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "declarationDir": "./dist/types"
  }
}
```

### 版本化构建信息

将 `.tsbuildinfo` 纳入版本控制或配置在固定位置：

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

### CI/CD 优化

在 CI 环境中使用增量构建：

```yaml
# .github/workflows/build.yml
- name: Build
  run: |
    npm ci
    npm run build

- name: Cache TypeScript build info
  uses: actions/cache@v3
  with:
    path: |
      packages/**/dist/.tsbuildinfo
    key: tsbuildinfo-${{ hashFiles('packages/**/src/**/*.ts') }}
```

## 常见陷阱

### 忘记启用 declaration

```json
// ❌ 错误：缺少 declaration
{
  "compilerOptions": {
    "composite": true
  }
}

// ✅ 正确
{
  "compilerOptions": {
    "composite": true,
    "declaration": true
  }
}
```

### 循环引用

```
// ❌ 错误：A 引用 B，B 引用 A
packages/a/tsconfig.json: references: [{ "path": "../b" }]
packages/b/tsconfig.json: references: [{ "path": "../a" }]
```

解决方案：提取共享代码到新的独立包：

```
// ✅ 正确：提取共享代码
packages/shared/  ← A 和 B 都依赖 shared
packages/a/       ← 依赖 shared
packages/b/       ← 依赖 shared
```

### 路径配置不一致

确保 `tsconfig.json` 中的路径和包管理器的 workspace 配置一致：

```json
// ❌ 路径不匹配
// tsconfig.json 中使用相对路径
"references": [{ "path": "../shared" }]

// package.json 中使用包名
"dependencies": { "@my-scope/shared": "workspace:*" }
```

需要确保两者都能正确解析到同一个包。

### 遗漏根配置中的引用

```json
// ❌ 根配置遗漏了某些包
{
  "references": [
    { "path": "./packages/core" }
    // 遗漏了 ./packages/utils
  ]
}

// ✅ 包含所有需要构建的包
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" },
    { "path": "./packages/app" }
  ]
}
```

### 直接导入源文件

```typescript
// ❌ 错误：直接导入源文件
import { something } from '../shared/src/index';

// ✅ 正确：通过包名导入
import { something } from '@my-scope/shared';
```

### 构建产物未提交或未生成

```bash
# ❌ 错误：依赖项未构建
tsc --project packages/app

# ✅ 正确：使用 --build 模式
tsc --build packages/app
```

## 性能考量

### 增量编译效果

项目引用的主要性能优势来自增量编译：

| 场景 | 无项目引用 | 有项目引用 |
|-----|----------|----------|
| 首次编译 | 100% | 100% |
| 修改单个文件 | 100%（全量重编译） | 5-10%（仅重编译受影响项目） |
| 仅修改类型 | 100% | 2-5% |

### 构建缓存策略

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

`.tsbuildinfo` 文件包含：
- 文件哈希值
- 依赖图
- 输出文件签名

### 并行构建

TypeScript 编译器会自动并行构建无依赖关系的项目：

```
构建顺序示例：
阶段 1: [core]                     ← 无依赖，先构建
阶段 2: [utils, api] (并行)        ← 都依赖 core
阶段 3: [app]                      ← 依赖 utils 和 api
```

### 大型项目优化建议

1. **按需构建**：只构建当前工作的包

```bash
# 只构建特定包及其依赖
tsc --build packages/app
```

2. **跳过类型检查**：打包时可以跳过检查

```bash
# 在打包前单独运行类型检查
tsc --build --noEmit
```

3. **使用 swc 或 esbuild**：对于纯转译场景

```bash
# 使用 esbuild 进行快速转译
esbuild src/**/*.ts --outdir=dist

# 单独使用 tsc 进行类型检查
tsc --noEmit
```

4. **合理划分项目边界**：避免过度拆分

```
❌ 过度拆分（每个文件一个项目）
✅ 合理划分（按功能域划分）
```

## 实战场景

### 场景一：全栈 TypeScript Monorepo

```
fullstack-app/
├── packages/
│   ├── types/           # 共享类型定义
│   ├── validation/      # 共享校验逻辑
│   ├── api/             # Express 后端
│   └── web/             # React 前端
└── tsconfig.json
```

```json
// packages/types/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

```typescript
// packages/types/src/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
```

API 和 Web 都引用 types：

```json
// packages/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../types" },
    { "path": "../validation" }
  ]
}
```

### 场景二：组件库开发

```
ui-library/
├── packages/
│   ├── tokens/          # 设计令牌
│   ├── icons/           # 图标
│   ├── components/      # 组件
│   └── themes/          # 主题
└── tsconfig.json
```

```json
// packages/components/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../tokens" },
    { "path": "../icons" }
  ]
}
```

### 场景三：微服务架构

```
microservices/
├── packages/
│   ├── proto/           # gRPC 协议定义
│   ├── common/          # 共享工具
│   ├── user-service/    # 用户服务
│   ├── order-service/   # 订单服务
│   └── gateway/         # API 网关
└── tsconfig.json
```

每个服务独立配置，但共享协议定义：

```json
// packages/user-service/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../proto" },
    { "path": "../common" }
  ]
}
```

## 面试要点

### 常见面试问题

**1. 什么是 TypeScript 项目引用？它解决了什么问题？**

项目引用是 TypeScript 3.0 引入的功能，允许将大型项目拆分为多个子项目。主要解决：
- 大型项目编译时间过长
- 代码边界不清晰
- 无法实现增量编译
- IDE 响应缓慢

**2. composite 选项的作用是什么？**

`composite: true` 将项目标记为可被引用的项目。它会：
- 强制启用 `declaration`
- 强制要求所有文件被 include/files 匹配
- 自动生成 `.tsbuildinfo` 用于增量编译
- 确保项目可以被其他项目引用

**3. --build 模式与普通 tsc 的区别？**

```bash
# 普通编译 - 不处理项目引用
tsc

# --build 模式 - 处理项目引用，支持增量编译
tsc --build
```

区别：
- `--build` 会按依赖顺序构建所有引用的项目
- `--build` 支持增量编译
- `--build` 可以并行构建无依赖关系的项目

**4. 如何处理项目间的循环依赖？**

TypeScript 不允许循环引用。解决方案：
- 提取共享代码到独立的包
- 重新设计依赖关系
- 使用依赖注入或接口隔离

**5. 项目引用与 npm workspaces 的关系？**

两者互补：
- npm workspaces 管理包之间的依赖关系和符号链接
- 项目引用管理 TypeScript 的编译顺序和增量编译

两者需要配合使用才能实现完整的 monorepo 工作流。

### 进阶考察点

- 增量编译的原理（`.tsbuildinfo` 文件结构）
- 如何优化大型 monorepo 的构建性能
- 项目引用与各种打包工具的集成方式
- 如何在 CI/CD 中利用构建缓存

## 延伸阅读

### 官方文档

- [TypeScript 项目引用官方文档](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [tsconfig.json 参考](https://www.typescriptlang.org/tsconfig)
- [构建模式 (--build)](https://www.typescriptlang.org/docs/handbook/project-references.html#build-mode-for-typescript)

### 相关工具

- [Turborepo](https://turbo.build/) - 高性能 monorepo 构建系统
- [Nx](https://nx.dev/) - 智能 monorepo 工具
- [Lerna](https://lerna.js.org/) - 多包管理工具
- [pnpm workspaces](https://pnpm.io/workspaces) - 高效的 workspace 支持

### 深入学习

- [Monorepo 最佳实践](https://monorepo.tools/)
- [TypeScript 编译原理](https://github.com/microsoft/TypeScript/wiki/Architectural-Overview)
- [大型 TypeScript 项目管理](https://www.typescriptlang.org/docs/handbook/project-references.html#guidance)

---

TypeScript 项目引用是管理大型代码库的强大工具。通过合理拆分项目、明确依赖关系、利用增量编译，可以显著提升开发效率和构建性能。在实践中，建议从简单的结构开始，随着项目增长逐步引入更复杂的配置。记住，项目引用的核心目标是让大型项目保持可维护性和高效的开发体验。
