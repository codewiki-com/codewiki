---
title: TypeScript配置
description: tsconfig.json完全指南，编译选项、项目引用与最佳实践
track: typescript
section: config-migration
difficulty: intermediate
tags:
  - TypeScript
  - tsconfig
  - 配置
  - 编译器
status: imported
origin: old/src/content/docs/typescript/tsconfig.zh.md
divergence: 0.217
issues: []
legacy:
  category: TypeScript
  subcategory: 工具链
  order: 8
  lastUpdated: 2026-01-07
---

`tsconfig.json` 是 TypeScript 项目的核心配置文件，它定义了编译器如何处理你的代码。掌握这个配置文件对于构建健壮的 TypeScript 项目至关重要。

## tsconfig.json 基本结构

一个典型的 `tsconfig.json` 文件包含以下主要部分：

```json
{
  "compilerOptions": {
    // 编译器选项
  },
  "include": [],
  "exclude": [],
  "files": [],
  "extends": "",
  "references": []
}
```

### 文件包含与排除

```json
{
  "include": [
    "src/**/*",
    "types/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.spec.ts"
  ],
  "files": [
    "src/global.d.ts"
  ]
}
```

- **include**: 指定要编译的文件模式
- **exclude**: 排除的文件模式（默认排除 `node_modules`）
- **files**: 明确指定要编译的文件列表

## 核心编译器选项

### 目标与模块系统

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

#### target - 编译目标

指定 JavaScript 输出版本：

| 值 | 说明 |
|---|---|
| `ES5` | 兼容旧浏览器 |
| `ES2015`/`ES6` | 支持类、箭头函数等 |
| `ES2020` | 支持可选链、空值合并 |
| `ES2022` | 支持顶级 await、类字段 |
| `ESNext` | 最新 ECMAScript 特性 |

#### module - 模块系统

```json
{
  "compilerOptions": {
    // Node.js 项目
    "module": "NodeNext",

    // 前端打包项目
    "module": "ESNext",

    // 传统 CommonJS
    "module": "CommonJS"
  }
}
```

#### moduleResolution - 模块解析策略

```json
{
  "compilerOptions": {
    // 现代打包工具（Vite、esbuild、webpack）
    "moduleResolution": "bundler",

    // Node.js ESM 项目
    "moduleResolution": "NodeNext",

    // Node.js CommonJS 项目
    "moduleResolution": "Node",

    // 传统模式（不推荐）
    "moduleResolution": "Classic"
  }
}
```

### 严格模式选项

严格模式是 TypeScript 类型安全的核心。强烈建议在所有新项目中启用：

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

`strict: true` 等同于启用以下所有选项：

```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true
  }
}
```

#### 各严格选项详解

**noImplicitAny** - 禁止隐式 any

```typescript
// 错误：参数 'x' 隐式具有 'any' 类型
function process(x) {
  return x * 2;
}

// 正确
function process(x: number): number {
  return x * 2;
}
```

**strictNullChecks** - 严格空值检查

```typescript
let name: string;

// 错误：不能将 null 赋值给 string
name = null;

// 正确
let name: string | null = null;

function getLength(str: string | null): number {
  // 错误：str 可能为 null
  return str.length;

  // 正确：使用空值检查
  return str?.length ?? 0;
}
```

**strictPropertyInitialization** - 类属性必须初始化

```typescript
class User {
  // 错误：属性 'name' 没有初始化
  name: string;

  // 正确方式 1：初始化
  name: string = '';

  // 正确方式 2：在构造函数中赋值
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  // 正确方式 3：明确标记为可能未定义
  name!: string; // 使用 ! 断言
}
```

### 额外类型检查选项

```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**noUncheckedIndexedAccess** - 索引访问检查

```typescript
const arr: string[] = ['a', 'b', 'c'];

// 启用后，element 类型为 string | undefined
const element = arr[5];

// 必须进行空值检查
if (element !== undefined) {
  console.log(element.toUpperCase());
}
```

**exactOptionalPropertyTypes** - 精确可选属性类型

```typescript
interface Config {
  debug?: boolean;
}

const config: Config = {
  // 错误：不能将 undefined 显式赋给可选属性
  debug: undefined
};

// 正确：省略该属性
const config: Config = {};
```

### 输出配置

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationDir": "./dist/types",
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true
  }
}
```

| 选项 | 说明 |
|---|---|
| `outDir` | 输出目录 |
| `rootDir` | 源代码根目录 |
| `declaration` | 生成 .d.ts 声明文件 |
| `declarationDir` | 声明文件输出目录 |
| `declarationMap` | 生成声明文件的 source map |
| `sourceMap` | 生成 source map 文件 |

### 路径映射

配置模块路径别名，简化导入语句：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

使用示例：

```typescript
// 替代：import { Button } from '../../../components/Button'
import { Button } from '@components/Button';

// 替代：import { formatDate } from '../../utils/date'
import { formatDate } from '@utils/date';
```

> **注意**：路径映射仅在编译时生效。运行时需要配合打包工具（如 Vite、webpack）或使用 `tsconfig-paths` 等工具。

### 互操作性选项

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

**esModuleInterop** - ES 模块互操作

```typescript
// 没有 esModuleInterop
import * as express from 'express';
const app = express();

// 启用 esModuleInterop 后
import express from 'express';
const app = express();
```

**isolatedModules** - 独立模块编译

确保代码可以被 Babel、esbuild 等单文件编译器正确处理：

```typescript
// 错误：const enum 在独立模块模式下不允许
const enum Color {
  Red,
  Green,
  Blue
}

// 正确：使用普通 enum
enum Color {
  Red,
  Green,
  Blue
}
```

**verbatimModuleSyntax** - 保留模块语法

TypeScript 5.0+ 推荐选项，明确区分类型导入和值导入：

```typescript
// 纯类型导入 - 编译后会被移除
import type { User } from './types';

// 混合导入
import { createUser, type UserOptions } from './user';
```

## 配置继承 (extends)

使用 `extends` 继承基础配置，避免重复：

### 继承官方推荐配置

```json
{
  "extends": "@tsconfig/recommended/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

常用的官方配置包：

```bash
npm install -D @tsconfig/recommended
npm install -D @tsconfig/node20
npm install -D @tsconfig/strictest
```

### 继承本地配置

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

```json
// tsconfig.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### 多配置文件策略

大型项目常见的配置结构：

```
project/
├── tsconfig.json          # 主配置（IDE 使用）
├── tsconfig.base.json     # 基础共享配置
├── tsconfig.build.json    # 构建配置
├── tsconfig.node.json     # Node.js 脚本配置
└── src/
```

```json
// tsconfig.build.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

## 项目引用 (Project References)

项目引用用于管理大型 monorepo 或多包项目，提供增量编译和更好的代码组织。

### 基本配置

```json
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

```json
// packages/app/tsconfig.json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

```json
// 根目录 tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/app" }
  ]
}
```

### 关键选项

**composite** - 启用项目引用

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true  // composite 要求必须启用
  }
}
```

**incremental** - 增量编译

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

### 构建命令

```bash
# 构建所有引用的项目
tsc --build

# 简写
tsc -b

# 强制重新构建
tsc -b --force

# 清理构建产物
tsc -b --clean

# 监听模式
tsc -b --watch
```

## 常见场景配置示例

### React 项目

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### Node.js 后端项目

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 库/NPM 包项目

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020"],
    "strict": true,
    "declaration": true,
    "declarationDir": "./dist/types",
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

配合 `package.json`：

```json
{
  "name": "my-library",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
```

### Monorepo 项目

```json
// packages/tsconfig.base.json
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
    "composite": true
  }
}
```

## 最佳实践

### 始终启用严格模式

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

对于遗留项目，可以渐进式启用：

```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true
    // 逐步添加其他严格选项
  }
}
```

### 使用现代模块解析

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### 启用额外检查

```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 跳过库类型检查

```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

这可以显著提升编译速度，同时仍然检查你自己的代码。

### 明确区分类型导入

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

```typescript
// 使用 type 关键字导入类型
import type { User } from './types';
import { createUser, type UserOptions } from './user';
```

### 配置路径别名

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 生成 Source Map

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "declarationMap": true
  }
}
```

### 使用增量编译

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

## 调试配置问题

### 查看有效配置

```bash
# 显示最终合并后的配置
tsc --showConfig

# 显示将被编译的文件列表
tsc --listFiles
```

### 常见问题排查

**问题：找不到模块**

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",  // 或 "NodeNext"
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**问题：类型声明冲突**

```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "types": ["node"]  // 只包含需要的类型
  }
}
```

**问题：编译输出结构不正确**

```json
{
  "compilerOptions": {
    "rootDir": "./src",  // 明确指定源码根目录
    "outDir": "./dist"
  },
  "include": ["src/**/*"]  // 只包含 src 目录
}
```

## 总结

`tsconfig.json` 是 TypeScript 项目的基石。合理的配置能够：

- 提供更强的类型安全保障
- 改善开发体验和 IDE 支持
- 优化编译性能
- 生成适合目标环境的代码

建议从严格模式开始，根据项目需求逐步调整配置。保持配置的简洁和一致性，利用 `extends` 复用配置，对于大型项目采用项目引用来管理复杂度。
