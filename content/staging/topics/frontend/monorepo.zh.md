---
title: Monorepo 工程化实践
description: 掌握Monorepo架构，高效管理多项目代码库
track: frontend
section: build-tools
difficulty: advanced
tags:
  - Monorepo
  - 工程化
  - pnpm
  - Turborepo
status: imported
origin: old/src/content/docs/frontend/monorepo.zh.md
divergence: 0.225
issues: []
legacy:
  category: Frontend
  subcategory: Engineering
  order: 30
  lastUpdated: 2026-01-07
---

在现代前端开发中，随着项目规模的扩大和微服务架构的流行，如何高效管理多个相互关联的项目成为一个重要挑战。Monorepo（单一代码仓库）作为一种代码管理策略，被 Google、Facebook、Microsoft 等科技巨头广泛采用。本文将深入探讨 Monorepo 的核心概念、工具选择、最佳实践以及实际应用场景。

## Monorepo vs Multirepo

### 什么是 Monorepo？

Monorepo（Monolithic Repository）是一种将多个项目存放在同一个代码仓库中的开发策略。与之相对的是 Multirepo（也称为 Polyrepo），即每个项目都有独立的代码仓库。

```
# Monorepo 结构示例
my-monorepo/
├── packages/
│   ├── web-app/          # 前端应用
│   ├── mobile-app/       # 移动端应用
│   ├── shared-utils/     # 共享工具库
│   ├── ui-components/    # UI 组件库
│   └── api-client/       # API 客户端
├── apps/
│   ├── admin-portal/     # 管理后台
│   └── user-portal/      # 用户门户
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### 两种策略的对比

| 特性 | Monorepo | Multirepo |
|------|----------|-----------|
| 代码共享 | 简单直接，即时生效 | 需要发布 npm 包 |
| 依赖管理 | 统一版本，避免冲突 | 各自管理，可能版本不一致 |
| 原子提交 | 支持跨项目原子提交 | 需要多次提交协调 |
| 代码重构 | 全局重构更容易 | 需要逐个仓库修改 |
| CI/CD | 需要智能构建策略 | 各自独立，配置简单 |
| 权限管理 | 粒度较粗 | 精细的权限控制 |
| 仓库大小 | 可能很大 | 各自独立，较小 |
| 学习曲线 | 需要额外工具 | 传统方式，易上手 |

### 何时选择 Monorepo？

适合使用 Monorepo 的场景：

- **多个项目共享大量代码**：如组件库、工具函数等
- **需要频繁跨项目修改**：如 API 变更影响多个客户端
- **统一的技术栈和规范**：如统一的 ESLint、TypeScript 配置
- **紧密协作的团队**：需要实时同步代码变更
- **微前端架构**：多个子应用需要协同开发

不适合的场景：

- 项目之间完全独立，无代码共享
- 团队分布广泛，需要严格的权限隔离
- 项目使用完全不同的技术栈

## 工具选择

### pnpm Workspaces

pnpm 是目前最流行的 Monorepo 包管理工具，通过硬链接和符号链接实现高效的依赖管理。

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'tools/*'
```

```json
// package.json (根目录)
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "pnpm": "^8.0.0",
    "turbo": "^2.0.0"
  }
}
```

pnpm 的核心优势：

```bash
# 安装所有工作区依赖
pnpm install

# 为特定包添加依赖
pnpm add lodash --filter @my-org/web-app

# 在所有包中运行脚本
pnpm -r run build

# 只运行变更的包
pnpm -r --filter ...[origin/main] run test

# 并行运行任务
pnpm -r --parallel run dev
```

### Turborepo

Turborepo 是 Vercel 开发的高性能构建系统，专为 Monorepo 优化。

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

Turborepo 核心特性：

```bash
# 增量构建 - 只构建变更的包
turbo run build

# 远程缓存 - 团队共享构建缓存
turbo run build --remote-only

# 依赖图可视化
turbo run build --graph

# 运行特定包
turbo run build --filter=@my-org/web-app

# 运行依赖于某包的所有包
turbo run build --filter=...@my-org/shared-utils

# 并行度控制
turbo run build --concurrency=50%
```

### Nx

Nx 是一个功能更全面的 Monorepo 工具，提供了丰富的插件生态。

```json
// nx.json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json"
    ],
    "sharedGlobals": []
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production"],
      "cache": true
    }
  },
  "defaultBase": "main"
}
```

Nx 常用命令：

```bash
# 创建新项目
npx create-nx-workspace@latest my-workspace

# 生成应用
nx generate @nx/react:application my-app

# 生成库
nx generate @nx/react:library my-lib

# 运行受影响的项目
nx affected:build
nx affected:test

# 查看项目依赖图
nx graph

# 运行特定项目
nx run my-app:build
nx run-many --target=build --projects=app1,app2
```

### Lerna（经典方案）

Lerna 是最早的 JavaScript Monorepo 工具之一，现已由 Nx 团队维护。

```json
// lerna.json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "independent",
  "npmClient": "pnpm",
  "useWorkspaces": true,
  "command": {
    "version": {
      "conventionalCommits": true,
      "message": "chore(release): publish %s"
    },
    "publish": {
      "registry": "https://registry.npmjs.org"
    }
  }
}
```

### 工具对比总结

| 特性 | pnpm + Turborepo | Nx | Lerna |
|------|-----------------|-----|-------|
| 学习曲线 | 低 | 中等 | 低 |
| 构建缓存 | 本地+远程 | 本地+远程 | 无（需配合 Nx） |
| 增量构建 | 优秀 | 优秀 | 基础 |
| 插件生态 | 中等 | 丰富 | 较少 |
| 代码生成 | 无 | 强大 | 无 |
| 配置复杂度 | 简单 | 中等 | 简单 |
| 适用规模 | 中小型 | 大型 | 中小型 |

**推荐组合**：pnpm + Turborepo 是目前最流行的组合，适合大多数项目。

## 项目结构设计

### 标准目录结构

```
monorepo/
├── apps/                    # 应用目录
│   ├── web/                 # Web 应用
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── mobile/              # 移动端应用
│   └── admin/               # 管理后台
├── packages/                # 共享包目录
│   ├── ui/                  # UI 组件库
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/               # 工具函数库
│   ├── config/              # 共享配置
│   │   ├── eslint/
│   │   ├── typescript/
│   │   └── tailwind/
│   └── types/               # 共享类型定义
├── tooling/                 # 开发工具
│   ├── scripts/             # 构建脚本
│   └── generators/          # 代码生成器
├── docs/                    # 文档
├── .github/                 # GitHub 配置
│   └── workflows/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

### 包的 package.json 配置

```json
// packages/ui/package.json
{
  "name": "@my-org/ui",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./components/*": {
      "import": "./dist/components/*/index.mjs",
      "require": "./dist/components/*/index.js",
      "types": "./dist/components/*/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@my-org/config-typescript": "workspace:*",
    "@my-org/config-eslint": "workspace:*",
    "tsup": "^8.0.0"
  }
}
```

### 共享 TypeScript 配置

```json
// packages/config/typescript/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Base",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

```json
// packages/config/typescript/react.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

```json
// apps/web/tsconfig.json
{
  "extends": "@my-org/config-typescript/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 依赖管理

### 工作区依赖引用

```json
// apps/web/package.json
{
  "name": "@my-org/web",
  "dependencies": {
    "@my-org/ui": "workspace:*",
    "@my-org/utils": "workspace:^1.0.0",
    "@my-org/types": "workspace:~1.0.0"
  }
}
```

工作区协议说明：
- `workspace:*`：始终使用本地版本
- `workspace:^1.0.0`：发布时转换为 `^1.0.0`
- `workspace:~1.0.0`：发布时转换为 `~1.0.0`

### 统一依赖版本

使用 `.npmrc` 配置：

```ini
# .npmrc
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=true
```

使用 `pnpm.overrides` 统一版本：

```json
// package.json (根目录)
{
  "pnpm": {
    "overrides": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "typescript": "^5.3.0"
    },
    "peerDependencyRules": {
      "ignoreMissing": ["@types/react"]
    }
  }
}
```

### 依赖提升策略

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'

# .npmrc
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
public-hoist-pattern[]=@types/*
```

### 内部包的实时开发

使用 `tsup` 实现实时编译：

```typescript
// packages/ui/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  clean: true,
  external: ['react', 'react-dom'],
  // 开发模式下监听文件变化
  watch: process.env.NODE_ENV === 'development',
});
```

## 构建缓存与增量构建

### Turborepo 缓存配置

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    ".env",
    ".env.local",
    "tsconfig.base.json"
  ],
  "globalEnv": ["NODE_ENV", "CI"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": [
        "src/**",
        "package.json",
        "tsconfig.json",
        "!**/*.test.*",
        "!**/*.spec.*"
      ],
      "outputs": ["dist/**", ".next/**"],
      "env": ["API_URL", "PUBLIC_URL"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": [
        "src/**",
        "test/**",
        "**/*.test.*",
        "**/*.spec.*"
      ],
      "outputs": ["coverage/**"]
    }
  }
}
```

### 远程缓存配置

```bash
# 登录 Vercel（Turborepo 远程缓存）
npx turbo login

# 链接到团队
npx turbo link

# 使用远程缓存构建
turbo run build --remote-only
```

自托管远程缓存：

```yaml
# 使用 turborepo-remote-cache 自托管
# docker-compose.yml
version: '3'
services:
  turbo-cache:
    image: ducktors/turborepo-remote-cache
    ports:
      - '3000:3000'
    environment:
      - STORAGE_PROVIDER=local
      - STORAGE_PATH=/cache
    volumes:
      - ./cache:/cache
```

```json
// turbo.json
{
  "remoteCache": {
    "signature": true,
    "enabled": true
  }
}
```

```bash
# .turbo/config.json
{
  "teamId": "team_xxx",
  "apiUrl": "https://your-cache-server.com"
}
```

### 增量构建策略

```bash
# 只构建自 main 分支以来变更的包
turbo run build --filter=...[origin/main]

# 构建特定包及其依赖
turbo run build --filter=@my-org/web...

# 构建依赖于特定包的所有包
turbo run build --filter=...@my-org/ui

# 排除特定包
turbo run build --filter=!@my-org/docs
```

### 缓存调试

```bash
# 查看缓存状态
turbo run build --dry-run

# 强制重新构建（忽略缓存）
turbo run build --force

# 查看详细输出
turbo run build --verbosity=2

# 生成构建概要
turbo run build --summarize
```

## 版本管理与发布

### Changesets 工作流

Changesets 是管理版本和发布的最佳工具：

```bash
# 安装
pnpm add -Dw @changesets/cli

# 初始化
pnpm changeset init
```

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/changelog-github",
  "commit": false,
  "fixed": [],
  "linked": [["@my-org/ui", "@my-org/ui-*"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@my-org/docs", "@my-org/web"]
}
```

### 版本管理工作流

```bash
# 开发完成后，添加 changeset
pnpm changeset

# 选择影响的包和版本类型
# ? Which packages would you like to include?
# > @my-org/ui
# > @my-org/utils
# ? Is this a major, minor or patch?
# > patch

# 编写变更描述
# Summary: Fixed button hover state

# 生成的 changeset 文件
# .changeset/fluffy-dogs-dance.md
```

```markdown
<!-- .changeset/fluffy-dogs-dance.md -->
---
"@my-org/ui": patch
"@my-org/utils": patch
---

Fixed button hover state and updated utility functions
```

### 发布流程

```bash
# 消费 changesets，更新版本号
pnpm changeset version

# 构建所有包
pnpm build

# 发布到 npm
pnpm changeset publish

# 推送 tags
git push --follow-tags
```

### 自动化发布（GitHub Actions）

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          version: pnpm changeset version
          publish: pnpm changeset publish
          commit: 'chore: release packages'
          title: 'chore: release packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## CI/CD 集成

### GitHub Actions 完整配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  build:
    name: Build and Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm turbo run lint

      - name: Type Check
        run: pnpm turbo run type-check

      - name: Test
        run: pnpm turbo run test

      - name: Build
        run: pnpm turbo run build

  affected:
    name: Build Affected
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build affected packages
        run: pnpm turbo run build --filter=...[origin/main]
```

### 部署策略

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      web: ${{ steps.filter.outputs.web }}
      admin: ${{ steps.filter.outputs.admin }}
      docs: ${{ steps.filter.outputs.docs }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            web:
              - 'apps/web/**'
              - 'packages/**'
            admin:
              - 'apps/admin/**'
              - 'packages/**'
            docs:
              - 'docs/**'

  deploy-web:
    needs: changes
    if: ${{ needs.changes.outputs.web == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Web App
        run: |
          pnpm install
          pnpm turbo run build --filter=@my-org/web
          # Deploy to Vercel/Netlify/etc.

  deploy-admin:
    needs: changes
    if: ${{ needs.changes.outputs.admin == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Admin Portal
        run: |
          pnpm install
          pnpm turbo run build --filter=@my-org/admin
          # Deploy to hosting
```

### 预览部署

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install
        run: pnpm install

      - name: Build
        run: pnpm turbo run build --filter=@my-org/web

      - name: Deploy Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/web
```

## 最佳实践

### 代码组织原则

```typescript
// packages/shared-types/src/index.ts
// 集中管理共享类型
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// packages/api-client/src/index.ts
// 封装 API 调用逻辑
import type { User, ApiResponse } from '@my-org/shared-types';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/users/${id}`);
    return response.json();
  }
}

// packages/ui/src/components/Button/index.tsx
// 共享 UI 组件
import { forwardRef } from 'react';
import type { ButtonProps } from './types';
import styles from './Button.module.css';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'medium', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${styles.button} ${styles[variant]} ${styles[size]}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 共享配置管理

```javascript
// packages/config/eslint/base.js
module.exports = {
  extends: ['eslint:recommended'],
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
};

// packages/config/eslint/react.js
module.exports = {
  extends: [
    './base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
};

// apps/web/eslint.config.js
const reactConfig = require('@my-org/config-eslint/react');

module.exports = {
  ...reactConfig,
  // 项目特定配置
};
```

### 开发脚本优化

```json
// package.json (根目录)
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:web": "turbo run dev --filter=@my-org/web...",
    "build": "turbo run build",
    "build:affected": "turbo run build --filter=...[origin/main]",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch --parallel",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "prepare": "husky install",
    "new:package": "turbo gen workspace --name",
    "deps:check": "pnpm outdated -r",
    "deps:update": "pnpm update -r --latest"
  }
}
```

### Git Hooks 配置

```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged

// .lintstagedrc.js
module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  'package.json': ['pnpm sort-package-json'],
};

// .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}

// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['web', 'admin', 'ui', 'utils', 'config', 'deps', 'ci'],
    ],
  },
};
```

### 文档自动化

```typescript
// tooling/scripts/generate-docs.ts
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PackageJson {
  name: string;
  description: string;
  version: string;
}

function generatePackageDocs() {
  const packagesDir = join(process.cwd(), 'packages');
  const packages = readdirSync(packagesDir);

  const docs = packages.map((pkg) => {
    const pkgJsonPath = join(packagesDir, pkg, 'package.json');
    const pkgJsonContent = readFileSync(pkgJsonPath, 'utf-8');
    const pkgJson: PackageJson = JSON.parse(pkgJsonContent);

    return `## ${pkgJson.name}

**Version:** ${pkgJson.version}

${pkgJson.description}

\`\`\`bash
pnpm add ${pkgJson.name}
\`\`\`
`;
  });

  writeFileSync(
    join(process.cwd(), 'docs', 'PACKAGES.md'),
    `# Packages\n\n${docs.join('\n---\n\n')}`
  );
}

generatePackageDocs();
```

## 迁移策略

### 从 Multirepo 迁移

迁移步骤：

```bash
# 创建 Monorepo 基础结构
mkdir my-monorepo && cd my-monorepo
pnpm init
mkdir packages apps

# 初始化工作区
cat > pnpm-workspace.yaml << EOF
packages:
  - 'packages/*'
  - 'apps/*'
EOF

# 迁移现有仓库（保留 Git 历史）
git subtree add --prefix=packages/ui \
  https://github.com/org/ui-library.git main

git subtree add --prefix=apps/web \
  https://github.com/org/web-app.git main

# 更新内部依赖
# 将 npm 包引用改为 workspace 引用
# "ui-library": "^1.0.0" -> "@my-org/ui": "workspace:*"

# 统一配置文件
# 创建共享的 tsconfig、eslint 等配置
```

### 渐进式迁移方案

```typescript
// scripts/migrate-package.ts
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

interface MigrationConfig {
  sourceRepo: string;
  targetPath: string;
  packageName: string;
}

function migratePackage(config: MigrationConfig) {
  const { sourceRepo, targetPath, packageName } = config;

  // 确保目标目录存在
  const fullPath = join(process.cwd(), targetPath);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
  }

  // 使用 git subtree 保留历史（使用 spawnSync 而非 exec）
  console.log(`Migrating ${packageName} from ${sourceRepo}...`);
  const result = spawnSync('git', [
    'subtree', 'add',
    `--prefix=${targetPath}`,
    sourceRepo,
    'main',
    '--squash'
  ], { stdio: 'inherit' });

  if (result.status !== 0) {
    console.error('Migration failed');
    return;
  }

  // 更新 package.json
  const pkgJsonPath = join(fullPath, 'package.json');
  const pkgJsonContent = readFileSync(pkgJsonPath, 'utf-8');
  const pkgJson = JSON.parse(pkgJsonContent);
  pkgJson.name = `@my-org/${packageName}`;

  writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

  console.log(`Successfully migrated ${packageName}`);
}

// 使用示例
migratePackage({
  sourceRepo: 'https://github.com/org/ui-library.git',
  targetPath: 'packages/ui',
  packageName: 'ui',
});
```

### 迁移检查清单

```markdown
## Monorepo 迁移检查清单

### 准备阶段
- [ ] 评估现有仓库之间的依赖关系
- [ ] 确定需要迁移的仓库列表
- [ ] 选择 Monorepo 工具（pnpm + Turborepo 推荐）
- [ ] 规划目录结构
- [ ] 制定命名规范（@org/package-name）

### 迁移阶段
- [ ] 创建 Monorepo 基础结构
- [ ] 配置 pnpm-workspace.yaml
- [ ] 迁移各仓库代码（保留 Git 历史）
- [ ] 更新内部依赖为 workspace 协议
- [ ] 统一 TypeScript 配置
- [ ] 统一 ESLint 配置
- [ ] 统一测试配置

### 验证阶段
- [ ] 所有包可以正常构建
- [ ] 所有测试通过
- [ ] 增量构建正常工作
- [ ] 缓存机制正常工作
- [ ] CI/CD 流程正常

### 后续优化
- [ ] 配置远程缓存
- [ ] 优化构建性能
- [ ] 设置自动化发布
- [ ] 更新文档
- [ ] 团队培训
```

## 面试要点

### 常见面试问题

**Q1: Monorepo 和 Multirepo 的区别是什么？各有什么优缺点？**

```
Monorepo 将多个项目放在同一个仓库中管理，优点包括：
- 代码共享简单，无需发布 npm 包
- 支持原子提交，保证多项目变更的一致性
- 统一的开发规范和工具链
- 方便进行全局重构

缺点：
- 仓库可能变得很大
- 需要额外的工具支持
- 权限管理粒度较粗
- CI/CD 配置更复杂

Multirepo 每个项目独立仓库，适合：
- 项目完全独立的场景
- 需要严格权限控制
- 不同技术栈的项目
```

**Q2: pnpm 相比 npm/yarn 有什么优势？**

```javascript
// pnpm 使用硬链接和符号链接，实现：
// 1. 节省磁盘空间 - 相同包只存储一次
// 2. 安装速度快 - 利用全局存储
// 3. 严格的依赖隔离 - 避免幽灵依赖

// 对比示例：
// npm/yarn: 每个项目都复制 node_modules
// pnpm: 使用链接共享全局存储

// 工作区支持
// pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**Q3: 如何实现 Monorepo 的增量构建？**

```json
// 使用 Turborepo 配置
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],  // 依赖先构建
      "inputs": ["src/**"],     // 只监听 src 变化
      "outputs": ["dist/**"]    // 缓存输出
    }
  }
}

// 使用命令
// turbo run build --filter=...[origin/main]
// 只构建自 main 分支以来变化的包
```

**Q4: Monorepo 中如何管理版本和发布？**

```bash
# 使用 Changesets 工作流

# 开发完成后添加变更记录
pnpm changeset

# 生成变更文件描述影响的包和版本类型
# .changeset/xxx.md

# 合并到主分支后更新版本
pnpm changeset version

# 发布到 npm
pnpm changeset publish
```

**Q5: 如何处理 Monorepo 中的循环依赖？**

```typescript
// 循环依赖示例（应该避免）：
// packages/a 依赖 packages/b
// packages/b 依赖 packages/a

// 解决方案：
// 1. 提取公共代码到第三个包
// packages/shared <- 公共代码
// packages/a -> 依赖 shared
// packages/b -> 依赖 shared

// 2. 使用依赖注入
// 运行时注入依赖，而非编译时

// 3. 使用事件机制解耦
// 通过事件总线通信
```

### 实战场景题

**场景1：设计一个微前端架构的 Monorepo**

```
monorepo/
├── apps/
│   ├── main-app/         # 主应用（容器）
│   ├── module-user/      # 用户模块
│   ├── module-order/     # 订单模块
│   └── module-product/   # 商品模块
├── packages/
│   ├── shared-ui/        # 共享 UI
│   ├── shared-utils/     # 共享工具
│   ├── shared-types/     # 共享类型
│   └── module-federation/ # 模块联邦配置
└── turbo.json

关键点：
1. 统一技术栈和版本
2. 共享组件库确保 UI 一致性
3. 使用 Module Federation 实现运行时集成
4. 独立部署各模块
```

**场景2：优化 CI/CD 构建时间**

```yaml
# 优化策略：
# 使用远程缓存
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

# 只构建受影响的包
run: turbo run build --filter=...[origin/main]

# 并行执行独立任务
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: turbo run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - run: turbo run test

# 使用矩阵策略并行测试
strategy:
  matrix:
    package: [web, admin, api]
steps:
  - run: turbo run test --filter=@my-org/${{ matrix.package }}
```

### 核心知识点总结

```
1. Monorepo 核心概念
   - 单一仓库管理多项目
   - 代码共享与复用
   - 统一的工具链和规范

2. 工具生态
   - pnpm workspaces: 包管理
   - Turborepo/Nx: 构建系统
   - Changesets: 版本发布
   - GitHub Actions: CI/CD

3. 关键技术点
   - workspace 协议依赖
   - 增量构建与缓存
   - 任务编排与并行
   - 远程缓存共享

4. 最佳实践
   - 合理的目录结构
   - 共享配置管理
   - 自动化版本发布
   - 完善的 CI/CD 流程

5. 常见问题
   - 性能优化
   - 依赖管理
   - 权限控制
   - 迁移策略
```

## 总结

Monorepo 作为现代大型项目的代码管理策略，通过合理的工具选择和配置，可以大大提升开发效率和代码质量。pnpm + Turborepo 的组合目前是最受欢迎的方案，它们提供了高效的依赖管理、智能的构建缓存和强大的任务编排能力。

在实践中，需要根据团队规模、项目复杂度和具体需求来选择合适的工具和配置。同时，良好的目录结构设计、统一的配置管理和完善的 CI/CD 流程是成功实施 Monorepo 的关键。

随着微前端、微服务架构的普及，Monorepo 将在更多场景中发挥重要作用。掌握 Monorepo 的核心概念和最佳实践，将帮助你在大型项目中游刃有余。
